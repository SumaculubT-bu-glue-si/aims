
"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

import { type AuditPlan } from "../page"
import { getAuditPlans } from "@/lib/graphql-client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader, Search, RefreshCw, Eye, Calendar, Users, MapPin, User, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarCheck, CalendarX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/hooks/use-i18n"
import { enUS, ja } from "date-fns/locale"

export default function AuditsExecutionPage() {
  const [allPlans, setAllPlans] = useState<any[]>([])
  const [filteredPlans, setFilteredPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filters, setFilters] = useState({ searchTerm: '', status: 'all' })
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const { toast } = useToast()
  const router = useRouter()
  const { t } = useI18n();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)

      try {
        // Fetch audit plans from GraphQL API
        const auditPlansResult = await getAuditPlans();
        console.log('📊 Audit plans result:', auditPlansResult);

        if (auditPlansResult.success && auditPlansResult.data) {
          console.log('📋 Raw audit plans data:', auditPlansResult.data);

          const activePlans = auditPlansResult.data.filter((plan: any) =>
            plan.status === 'In Progress' || plan.status === 'Planning' || plan.status === 'Overdue'
          );
          console.log('✅ Active plans:', activePlans);

          // Log the structure of the first plan to debug
          if (activePlans.length > 0) {
            console.log('🔍 First plan structure:', {
              id: activePlans[0].id,
              name: activePlans[0].name,
              status: activePlans[0].status,
              start_date: activePlans[0].start_date,
              due_date: activePlans[0].due_date,
              description: activePlans[0].description,
              auditAssets: activePlans[0].auditAssets
            });
          }

          setAllPlans(activePlans);
          setFilteredPlans(activePlans);
        } else {
          console.error('❌ Failed to fetch audit plans:', auditPlansResult.error);
          toast({
            title: t('actions.error'),
            description: t('errors.audit_fetch'),
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        toast({
          title: t('actions.error'),
          description: t('errors.data_fetch'),
          variant: "destructive"
        });
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, []) // Empty dependency array - only run once on mount

  // Filter plans based on search term and status
  useEffect(() => {
    let filtered = allPlans;

    if (filters.searchTerm) {
      filtered = filtered.filter(plan =>
        plan.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(plan => plan.status === filters.status);
    }

    setFilteredPlans(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allPlans, filters]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPlans = filteredPlans.slice(startIndex, endIndex);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Planning': return 'secondary';
      case 'In Progress': return 'default';
      case 'Completed': return 'outline';
      case 'Overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Planning': return t('labels.audit_status.planning');
      case 'In Progress': return t('labels.statuses.in_progress');
      case 'Completed': return t('labels.statuses.completed');
      case 'Overdue': return t('labels.statuses.overdue');
      default: return status;
    }
  };

  const getAssetStatusBadgeVariant = (status: string) => {
    switch (status) {
      case '返却済': return 'default';      // Returned
      case '廃止': return 'secondary';     // Abolished
      case '保管(使用無)': return 'outline';  // In Storage - Unused
      case '利用中': return 'default';     // In Use
      case '保管中': return 'outline';        // In Storage
      case '貸出中': return 'secondary';     // On Loan
      case '故障中': return 'destructive'; // Broken
      case '利用予約': return 'secondary'; // Reserved for Use
      default: return 'secondary';
    }
  };

  const getAssetStatusText = (status: string) => {
    switch (status) {
      case '返却済': return t('labels.statuses.returned');
      case '廃止': return t('labels.statuses.abolished');
      case '保管(使用無)': return t('labels.statuses.in_storage_unused');
      case '利用中': return t('labels.statuses.in_use');
      case '保管中': return t('labels.statuses.in_storage');
      case '貸出中': return t('labels.statuses.on_loan');
      case '故障中': return t('labels.statuses.broken');
      case '利用予約': return t('pages.inventory.status.reserved');
      default: return status;
    }
  };

  const calculateProgress = (plan: any) => {
    try {
      if (!plan || !plan.auditAssets || plan.auditAssets.length === 0) return 0;

      const totalAssets = plan.auditAssets.length;
      const auditedAssets = plan.auditAssets.filter((asset: any) =>
        asset.audit_status === true
      ).length;

      return Math.round((auditedAssets / totalAssets) * 100);
    } catch (error) {
      console.error('Error calculating progress for plan:', plan?.id || 'unknown', error);
      return 0;
    }
  };

  const getTotalAssets = (plan: any) => {
    try {
      if (!plan) return 0;
      return plan.auditAssets?.length || 0;
    } catch (error) {
      console.error('Error getting total assets for plan:', plan?.id || 'unknown', error);
      return 0;
    }
  };

  const getAuditedAssets = (plan: any) => {
    try {
      if (!plan || !plan.auditAssets) return 0;
      return plan.auditAssets.filter((asset: any) =>
        asset.audit_status === true
      ).length;
    } catch (error) {
      console.error('Error getting audited assets for plan:', plan?.id || 'unknown', error);
      return 0;
    }
  };

  const getCalendarStatus = (plan: any) => {
    if (!plan || !plan.calendar_events) return { status: 'none', count: 0 };

    const eventCount = Array.isArray(plan.calendar_events) ? plan.calendar_events.length : 0;

    if (eventCount === 0) {
      return { status: 'none', count: 0 };
    } else if (eventCount > 0) {
      return { status: 'created', count: eventCount };
    }

    return { status: 'none', count: 0 };
  };

  const handleViewPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleRefresh = async () => {
    setIsLoading(true);

    const { t } = useI18n();

    try {
      const auditPlansResult = await getAuditPlans();
      if (auditPlansResult.success && auditPlansResult.data) {
        const activePlans = auditPlansResult.data.filter((plan: any) =>
          plan.status === 'In Progress' || plan.status === 'Planning' || plan.status === 'Overdue'
        );
        setAllPlans(activePlans);
        setFilteredPlans(activePlans);
        toast({
          title: t('actions.success'),
          description: t('actions.data_refreshed')
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.data_fetch'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    t('labels.audit_status.planning'),
    t('labels.statuses.in_progress'),
    t('labels.statuses.completed'),
    t('labels.statuses.overdue')
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.audits.execution.title')}</CardTitle>
          <CardDescription>{t('pages.audits.execution.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{allPlans.length}</span> {t('pages.audits.execution.stats.active_audit')}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {allPlans.reduce((total, plan) => total + getTotalAssets(plan), 0)}
              </span> {t('pages.audits.execution.stats.total_to_audit')}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">
                {allPlans.reduce((total, plan) => total + getAuditedAssets(plan), 0)}
              </span> {t('pages.audits.execution.stats.audited')}
            </div>
            {totalPages > 1 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Page {currentPage}</span> of {totalPages}
              </div>
            )}
          </div>

          {/* Filters Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('pages.audits.search_plans')}
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('labels.statuses.all_status')}</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>{getStatusText(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              className="ml-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('actions.refresh')}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className="text-muted-foreground mb-4">
                <p className="text-lg font-medium">{t('pages.audits.no_plans_found_title')}</p>
                <p className="text-sm">{t('pages.audits.no_plans_found_desc_reporting')}</p>
              </div>
              <Button onClick={() => router.push('/audits')} variant="outline">
                {t('pages.audits.to_audit_plans')}
              </Button>
            </div>
          ) : (
            <div className="border rounded-md">
              {/* Pagination Summary */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-muted/30 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Page {currentPage} of {totalPages}
                      ({filteredPlans.length} total plans)
                    </span>
                    <span className="text-muted-foreground">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredPlans.length)} plans
                    </span>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('labels.plan_name')}</TableHead>
                    <TableHead>{t('labels.status')}</TableHead>
                    <TableHead>{t('labels.progress')}</TableHead>
                    <TableHead>{t('pages.audits.detail.total_assets')}</TableHead>
                    <TableHead>{t('labels.start_date')}</TableHead>
                    <TableHead>{t('labels.due_date')}</TableHead>
                    <TableHead className="text-right">{t('actions.title')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlans.map((plan) => {
                    const progress = calculateProgress(plan);
                    const totalAssets = getTotalAssets(plan);
                    const auditedAssets = getAuditedAssets(plan);

                    return (
                      <TableRow key={plan.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            {plan.description && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(plan.status)} className="whitespace-nowrap">
                            {getStatusText(plan.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full max-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                              <Progress value={progress} className="flex-1" />
                              <span className="text-sm font-medium min-w-[40px]">{progress}%</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('pages.audits.audit_progress', { auditedAssets, totalAssets })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{totalAssets}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {plan.start_date ? format(plan.start_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={plan.status === 'Overdue' ? 'text-destructive font-medium' : ''}>
                              {plan.due_date ? format(plan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{totalAssets}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getCalendarStatus(plan).status === 'created' ? (
                              <>
                                <CalendarCheck className="h-4 w-4 text-green-600" />
                                <span className="text-sm text-green-600 font-medium">
                                  {getCalendarStatus(plan).count} events
                                </span>
                              </>
                            ) : (
                              <>
                                <CalendarX className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  {t('labels.na.no_events')}
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {plan.start_date ? format(plan.start_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className={plan.status === 'Overdue' ? 'text-destructive font-medium' : ''}>
                              {plan.due_date ? format(plan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPlan(plan)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('actions.view_details')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-4 py-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredPlans.length)} of {filteredPlans.length} plans
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Items per page:</span>
                        <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                          setItemsPerPage(parseInt(value))
                          setCurrentPage(1)
                        }}>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* First Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>

                      {/* Previous Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>

                      {/* Next Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>

                      {/* Last Page */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card >

      {/* Asset Details Modal */}
      {
        selectedPlan && (
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {selectedPlan?.name} - {t('pages.audits.sub_folders.detail')}
                </DialogTitle>
                <DialogDescription>
                  {selectedPlan?.description && (
                    <span className="block mb-2">{selectedPlan.description}</span>
                  )}
                </DialogDescription>

                {/* Plan Summary Info */}
                <div className="flex items-center gap-4 text-sm mb-4">
                  <span>{t('labels.status')}: <Badge variant={getStatusBadgeVariant(selectedPlan?.status)}>{getStatusText(selectedPlan?.status)}</Badge></span>
                  <span>{t('labels.progress')}: {selectedPlan ? calculateProgress(selectedPlan) : 0}%</span>
                  <span>{t('pages.dashboard.assets')}: {t('pages.audits.assets_summary', { total: selectedPlan ? getTotalAssets(selectedPlan) : 0, audited: selectedPlan ? getAuditedAssets(selectedPlan) : 0 })}</span>
                </div>
              </DialogHeader>

              <div className="overflow-y-auto max-h-[60vh]">
                {selectedPlan?.auditAssets && selectedPlan.auditAssets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('labels.id')}</TableHead>
                        <TableHead>{t('labels.model')}</TableHead>
                        <TableHead>{t('labels.location')}</TableHead>
                        <TableHead>{t('labels.userId')}</TableHead>
                        <TableHead>{t('labels.status')}</TableHead>
                        <TableHead>{t('labels.audit_status.self')}</TableHead>
                        <TableHead>{t('labels.notes')}</TableHead>
                        <TableHead>{t('labels.audited_at')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPlan.auditAssets.map((asset: any) => (
                        <TableRow key={asset.id}>
                          <TableCell className="font-mono text-sm">
                            {asset.asset?.asset_id || t('common.not_applicable')}
                          </TableCell>
                          <TableCell>
                            {asset.asset?.model || t('labels.na.unknown_model')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{asset.asset?.location || t('labels.na.unknown_location')}</div>
                                {asset.original_location && asset.original_location !== asset.asset?.location && (
                                  <div className="text-xs text-muted-foreground">
                                    was: {asset.original_location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{asset.asset?.employee?.name || t('labels.na.unassigned')}</div>
                                {asset.original_user && asset.original_user !== asset.asset?.employee?.name && (
                                  <div className="text-xs text-muted-foreground">
                                    was: {asset.original_user}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAssetStatusBadgeVariant(asset.current_status)}>
                              {getAssetStatusText(asset.current_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={asset.audit_status ? 'default' : 'secondary'}>
                              {asset.audit_status ? t('labels.audit_status.audited') : t('labels.audit_status.pending_audit')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px]">
                              {asset.auditor_notes ? (
                                <div className="text-sm">
                                  {asset.auditor_notes.length > 50
                                    ? `${asset.auditor_notes.substring(0, 50)}...`
                                    : asset.auditor_notes
                                  }
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">{t('labels.na.no_notes')}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {asset.audited_at ? (
                              <span className="text-sm">
                                {format(asset.audited_at, t('date.format_hhmm'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">{t('labels.audit_status.not_audited')}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No assets found</p>
                    <p className="text-sm">This audit plan doesn't have any assets assigned yet.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCloseModal}>
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )
      }
    </>
  )
}

