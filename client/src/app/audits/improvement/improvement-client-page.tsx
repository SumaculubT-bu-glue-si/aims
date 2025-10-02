
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader, AlertCircle, CheckCircle, Eye, MapPin, User, Edit3, Save, X, Target } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAuditPlans, updateAuditAsset, createCorrectiveAction } from "@/lib/graphql-client"
import { useI18n } from "@/hooks/use-i18n"
import { enUS, ja } from 'date-fns/locale'

// Define types based on GraphQL schema
interface AuditAsset {
  id: string;
  current_status: string;
  auditor_notes?: string;
  audited_at?: string;
  resolved: boolean;
  original_location: string;
  original_user?: string;
  current_location?: string;
  asset: {
    id: string;
    asset_id: string;
    model: string;
    location: string;
    user_id?: string;
    employee?: {
      id: string;
      name: string;
    };
  };
}

interface AuditPlan {
  id: string;
  name: string;
  start_date: string;
  due_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  auditAssets: AuditAsset[];
  assignments?: Array<{
    id: string;
    status: string;
    location?: {
      id: string;
      name: string;
    };
    auditor?: {
      id: string;
      name: string;
    };
  }>;
}

interface Discrepancy {
  id: string;
  asset: AuditAsset['asset'];
  current_status: string;
  original_location: string;
  original_user?: string;
  current_location?: string;
  current_user?: string;
  auditor_notes?: string;
  resolved: boolean;
  planId: string;
  type: 'missing' | 'broken' | 'location_change' | 'user_change';
}

export default function ImprovementClientPage() {
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [editingAsset, setEditingAsset] = useState<AuditAsset | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    current_location: '',
    current_user: '',
    current_status: '',
    auditor_notes: ''
  })

  const { toast } = useToast()
  const router = useRouter()

  const { t } = useI18n()

  useEffect(() => {
    async function fetchAuditPlans() {
      setIsLoading(true);
      try {
        const result = await getAuditPlans();
        if (result.success && result.data) {
          // Filter for completed plans or plans with audit data
          const plansWithData = result.data.filter((plan: any) =>
            plan.auditAssets && plan.auditAssets.length > 0
          );
          setPlans(plansWithData);
          if (plansWithData.length > 0) {
            setSelectedPlanId(plansWithData[0].id);
          }
        } else {
          console.error('Failed to fetch audit plans:', result.error);
        }
      } catch (error) {
        console.error('Error fetching audit plans:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAuditPlans();
  }, [])

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  )

  const discrepancies = useMemo(() => {
    if (!selectedPlan) return [];

    const assets = selectedPlan.auditAssets || [];
    const allDiscrepancies: Discrepancy[] = [];

    assets.forEach(asset => {
      if (asset.resolved) return;

      // Missing assets - check for Japanese status "欠落" (Missing)
      if (asset.current_status === '欠落' || asset.current_status === 'Missing') {
        allDiscrepancies.push({
          id: asset.id,
          asset: asset.asset,
          current_status: asset.current_status,
          original_location: asset.original_location,
          original_user: asset.original_user,
          current_location: asset.current_location || asset.original_location,
          current_user: asset.asset.employee?.name || asset.original_user,
          auditor_notes: asset.auditor_notes,
          resolved: asset.resolved,
          planId: selectedPlan.id,
          type: 'missing'
        });
      }

      // Location changes
      if (asset.current_location && asset.current_location !== asset.original_location) {
        allDiscrepancies.push({
          id: asset.id,
          asset: asset.asset,
          current_status: asset.current_status,
          original_location: asset.original_location,
          original_user: asset.original_user,
          current_location: asset.current_location,
          current_user: asset.asset.employee?.name || asset.original_user,
          auditor_notes: asset.auditor_notes,
          resolved: asset.resolved,
          planId: selectedPlan.id,
          type: 'location_change'
        });
      }

      // User changes - detect when user assignment changes
      if (asset.asset.employee?.name) {
        // Case 1: User was assigned to an asset that previously had no user
        if (!asset.original_user && asset.asset.employee.name) {
          allDiscrepancies.push({
            id: asset.id,
            asset: asset.asset,
            current_status: asset.current_status,
            original_location: asset.original_location,
            original_user: asset.original_user,
            current_location: asset.current_location || asset.original_location,
            current_user: asset.asset.employee.name,
            auditor_notes: asset.auditor_notes,
            resolved: asset.resolved,
            planId: selectedPlan.id,
            type: 'user_change'
          });
        }
        // Case 2: User changed from one user to another user
        else if (asset.original_user && asset.asset.employee.name !== asset.original_user) {
          allDiscrepancies.push({
            id: asset.id,
            asset: asset.asset,
            current_status: asset.current_status,
            original_location: asset.original_location,
            original_user: asset.original_user,
            current_location: asset.current_location || asset.original_location,
            current_user: asset.asset.employee.name,
            auditor_notes: asset.auditor_notes,
            resolved: asset.resolved,
            planId: selectedPlan.id,
            type: 'user_change'
          });
        }
      }

      // Broken assets - check for Japanese status "故障中" (Broken)
      if (asset.current_status === '故障中' || asset.current_status === 'Broken') {
        allDiscrepancies.push({
          id: asset.id,
          asset: asset.asset,
          current_status: asset.current_status,
          original_location: asset.original_location,
          original_user: asset.original_user,
          current_location: asset.current_location || asset.original_location,
          current_user: asset.asset.employee?.name || asset.original_user,
          auditor_notes: asset.auditor_notes,
          resolved: asset.resolved,
          planId: selectedPlan.id,
          type: 'broken'
        });
      }
    });

    return allDiscrepancies;
  }, [selectedPlan]);

  const handleEditAsset = (asset: AuditAsset) => {
    setEditingAsset(asset);
    setEditForm({
      current_location: asset.current_location || asset.original_location,
      current_user: asset.asset.employee?.name || asset.original_user || '',
      current_status: asset.current_status,
      auditor_notes: asset.auditor_notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!editingAsset) return;

    const { t } = useI18n();

    setIsProcessing(true);
    try {
      const updateData = {
        current_status: editForm.current_status,
        auditor_notes: editForm.auditor_notes,
        resolved: true,
        current_location: editForm.current_location,
        current_user: editForm.current_user
      };
      console.log('Updating audit asset with data:', updateData);
      console.log('Asset ID:', editingAsset.id);

      const result = await updateAuditAsset(editingAsset.id, updateData);

      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t('pages.inventory.update_success')
        });

        // Refresh the data
        const updatedResult = await getAuditPlans();
        if (updatedResult.success && updatedResult.data) {
          const plansWithData = updatedResult.data.filter((plan: any) =>
            plan.auditAssets && plan.auditAssets.length > 0
          );
          setPlans(plansWithData);
        }

        setIsEditModalOpen(false);
        setEditingAsset(null);
      } else {
        toast({
          title: t('actions.error'),
          description: t('pages.inventory.update_error'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('pages.inventory.update_error'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCorrectiveAction = async (discrepancy: Discrepancy) => {
    setIsProcessing(true);

    const { t } = useI18n();

    try {
      // Generate issue description based on discrepancy type
      let issue = '';
      let action = '';

      switch (discrepancy.type) {
        case 'missing':
          issue = `Asset ${discrepancy.asset.asset_id} (${discrepancy.asset.model}) is missing from expected location: ${discrepancy.original_location}`;
          action = 'Locate the missing asset and return it to the proper location or update asset records';
          break;
        case 'broken':
          issue = `Asset ${discrepancy.asset.asset_id} (${discrepancy.asset.model}) is broken and needs repair or replacement`;
          action = 'Assess damage, repair if possible, or arrange for replacement';
          break;
        case 'location_change':
          issue = `Asset ${discrepancy.asset.asset_id} (${discrepancy.asset.model}) has moved from ${discrepancy.original_location} to ${discrepancy.current_location}`;
          action = 'Verify if location change is authorized and update asset records accordingly';
          break;
        case 'user_change':
          issue = `Asset ${discrepancy.asset.asset_id} (${discrepancy.asset.model}) has been reassigned from ${discrepancy.original_user || 'unassigned'} to ${discrepancy.current_user || 'unassigned'}`;
          action = 'Verify if user reassignment is authorized and update asset records';
          break;
      }

      // Determine who should be assigned to resolve this discrepancy
      let assignedTo = '';

      // Priority 1: If asset has a user, assign to that user (they're responsible for their asset)
      if (discrepancy.asset.employee?.id) {
        assignedTo = discrepancy.asset.employee.id;
        console.log(`Auto-assigning to asset user: ${discrepancy.asset.employee.name} (ID: ${discrepancy.asset.employee.id})`);
      }

      // Priority 2: If no user, assign to the auditor responsible for this location
      else if (selectedPlan && (selectedPlan as any).assignments && (selectedPlan as any).assignments.length > 0) {
        // Find the auditor assigned to this asset's location
        const assetLocation = discrepancy.asset.location;
        const locationAssignment = (selectedPlan as any).assignments.find((assignment: any) =>
          assignment.location?.name === assetLocation
        );

        if (locationAssignment?.auditor?.id) {
          assignedTo = locationAssignment.auditor.id;
        } else {
        }
      } else {
      }
      console.log(`Final assignment for asset ${discrepancy.asset.asset_id}: ${assignedTo || 'No assignment'}`);

      // Create corrective action
      const result = await createCorrectiveAction({
        audit_asset_id: discrepancy.id,
        issue: issue,
        action: action,
        assigned_to: assignedTo, // Auto-assign to appropriate person
        priority: discrepancy.type === 'missing' || discrepancy.type === 'broken' ? 'high' : 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        notes: `Created from audit discrepancy: ${discrepancy.type}`
      });

      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t('pages.audits.create_success')
        });

        // Refresh the data to show the new corrective action
        const updatedResult = await getAuditPlans();
        if (updatedResult.success && updatedResult.data) {
          const plansWithData = updatedResult.data.filter((plan: any) =>
            plan.auditAssets && plan.auditAssets.length > 0
          );
          setPlans(plansWithData);
        }
      } else {
        toast({
          title: t('actions.error'),
          description: t('errors.corrections'),
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.corrections'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const missingAssets = useMemo(() =>
    discrepancies.filter(item => item.type === 'missing'), [discrepancies]
  );

  const locationChanges = useMemo(() =>
    discrepancies.filter(item => item.type === 'location_change'), [discrepancies]
  );

  const userChanges = useMemo(() =>
    discrepancies.filter(item => item.type === 'user_change'), [discrepancies]
  );

  const brokenAssets = useMemo(() =>
    discrepancies.filter(item => item.type === 'broken'), [discrepancies]
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case '発見':
        return 'default'
      case '欠落':
      case '故障中':
        return 'destructive'
      case '保管中':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const statusMapping: Record<string, string> = {
    '返却済': t('labels.statuses.returned'),
    '廃止': t('labels.statuses.abolished'),
    '保管(使用無)': t('labels.statuses.stored_not_in_use'),
    '利用中': t('labels.statuses.in_use'),
    '保管中': t('labels.statuses.in_storage'),
    '貸出中': t('labels.statuses.on_loan'),
    '故障中': t('labels.statuses.broken'),
    '利用予約': t('labels.statuses.reserved_for_use')
  };

  const getStatusText = (status: string) => {
    return statusMapping[status] || status;
  }

  const renderDiscrepancyTable = (assets: Discrepancy[], type: string) => {
    if (assets.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10">
          {t('pages.audits.improvement.no_discrepancies_type', { type: t(`pages.audits.improvement.category.${type}`) })}
        </div>
      );
    }

    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('labels.id')}</TableHead>
              <TableHead>{t('labels.model')}</TableHead>
              <TableHead>{t('labels.original_location')}</TableHead>
              <TableHead>{t('labels.current_location')}</TableHead>
              <TableHead>{t('labels.status')}</TableHead>
              <TableHead>{t('labels.notes')}</TableHead>
              <TableHead className="text-right">{t('labels.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">
                  {item.asset.asset_id}
                </TableCell>
                <TableCell>{item.asset.model}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {item.original_location}
                    </div>
                    {item.original_user && (
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        {item.original_user}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {item.current_location}
                    </div>
                    {item.current_user && (
                      <div className="flex items-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        {item.current_user}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(item.current_status)}>
                    {getStatusText(item.current_status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px]">
                    {item.auditor_notes ? (
                      <div className="text-sm">
                        {item.auditor_notes.length > 50
                          ? `${item.auditor_notes.substring(0, 50)}...`
                          : item.auditor_notes
                        }
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{t('labels.na.no_notes')}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAsset(item as any)}
                      disabled={isProcessing}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      {t('actions.resolve')}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateCorrectiveAction(item)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Target className="h-4 w-4 mr-2" />
                      )}
                      {t('actions.generate_action')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.audits.improvement.title')}</CardTitle>
            <CardDescription>
              {t('pages.audits.improvement.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={setSelectedPlanId} value={selectedPlanId} disabled={plans.length === 0}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder={t('pages.audits.improvement.resolve.current_user_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} ({t('pages.audits.detail.due_date')}: {format(plan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.audits.improvement.discrepancy_title')}</CardTitle>
              <CardDescription>
                {t('pages.audits.improvement.discrepancy_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Debug Information */}
              {/* <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Plan: {selectedPlan.name}</div>
                  <div>Total Assets: {selectedPlan.auditAssets?.length || 0}</div>
                  <div>Discrepancies Found: {discrepancies.length}</div>
                  <div>Missing: {discrepancies.filter(d => d.type === 'missing').length}</div>
                  <div>Broken: {discrepancies.filter(d => d.type === 'broken').length}</div>
                  <div>Location Changes: {discrepancies.filter(d => d.type === 'location_change').length}</div>
                  <div>User Changes: {discrepancies.filter(d => d.type === 'user_change').length}</div>
                </div>
              </div> */}

              {discrepancies.length > 0 ? (
                <Tabs defaultValue="missing">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="missing">
                      {t('pages.audits.improvement.category.missing')} <span className="ml-2 text-xs text-muted-foreground">({missingAssets.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="location">
                      {t('pages.audits.improvement.category.location')} <span className="ml-2 text-xs text-muted-foreground">({locationChanges.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="user">
                      {t('pages.audits.improvement.category.user')} <span className="ml-2 text-xs text-muted-foreground">({userChanges.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="broken">
                      {t('pages.audits.improvement.category.broken')} <span className="ml-2 text-xs text-muted-foreground">({brokenAssets.length})</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="missing" className="mt-4">
                    {renderDiscrepancyTable(missingAssets, 'missing')}
                  </TabsContent>
                  <TabsContent value="location" className="mt-4">
                    {renderDiscrepancyTable(locationChanges, 'location')}
                  </TabsContent>
                  <TabsContent value="user" className="mt-4">
                    {renderDiscrepancyTable(userChanges, 'user')}
                  </TabsContent>
                  <TabsContent value="broken" className="mt-4">
                    {renderDiscrepancyTable(brokenAssets, 'broken')}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-lg font-medium text-foreground">No Discrepancies Found</h3>
                  <p className="text-sm">All assets in this audit plan are properly accounted for.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!selectedPlanId && plans.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Please select an audit plan to view discrepancies
            </CardContent>
          </Card>
        )}

        {plans.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-foreground">{t('pages.audits.no_plans_found_title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('pages.audits.improvement.no_discrepancies')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Asset Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('pages.audits.improvement.resolve.title')}</DialogTitle>
            <DialogDescription>
              {t('pages.audits.improvement.resolve.description')}
            </DialogDescription>
          </DialogHeader>

          {editingAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('labels.id')}</label>
                  <div className="text-sm text-muted-foreground font-mono">
                    {editingAsset.asset.asset_id}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('labels.model')}</label>
                  <div className="text-sm text-muted-foreground">
                    {editingAsset.asset.model}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('labels.current_location')}</label>
                  <Input
                    value={editForm.current_location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_location: e.target.value }))}
                    placeholder={t('pages.audits.improvement.resolve.current_location_placeholder')}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('labels.current_user')}</label>
                  <Input
                    value={editForm.current_user}
                    onChange={(e) => setEditForm(prev => ({ ...prev, current_user: e.target.value }))}
                    placeholder={t('pages.audits.improvement.resolve.current_user_placeholder')}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('labels.status')}</label>
                <Select
                  value={editForm.current_status}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, current_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="欠落">{t('labels.statuses.missing')}</SelectItem>
                    <SelectItem value="返却済">{t('labels.statuses.returned')}</SelectItem>
                    <SelectItem value="廃止">{t('labels.statuses.abolished')}</SelectItem>
                    <SelectItem value="利用中">{t('labels.statuses.in_use')}</SelectItem>
                    <SelectItem value="保管中">{t('labels.statuses.in_storage')}</SelectItem>
                    <SelectItem value="貸出中">{t('labels.statuses.on_loan')}</SelectItem>
                    <SelectItem value="故障中">{t('labels.statuses.broken')}</SelectItem>
                    <SelectItem value="利用予約">{t('labels.statuses.reserved_for_use')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">{t('pages.audits.improvement.resolve.auditor_notes_label')}</label>
                <Textarea
                  value={editForm.auditor_notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, auditor_notes: e.target.value }))}
                  placeholder={t('pages.audits.improvement.resolve.notes_placeholder')}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('actions.resolve')}
                </Button>
                <Button onClick={handleSaveAsset} disabled={isProcessing}>
                  {isProcessing ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('actions.save_and_resolve')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

