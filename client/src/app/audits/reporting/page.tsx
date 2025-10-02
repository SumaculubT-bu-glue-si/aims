
"use client"

import { useState, useEffect, useMemo } from "react"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader, AlertCircle, FileText, Calendar, Users, MapPin, CheckCircle, XCircle, Clock } from "lucide-react"
import { format } from "date-fns"
import { getAuditPlans } from "@/lib/graphql-client"
import { useI18n } from "@/hooks/use-i18n"
import { enUS, ja } from "date-fns/locale"
import "../../../lib/fonts/NotoSansJP-Regular-normal"

// Extend jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

// Define types based on GraphQL schema
interface AuditAsset {
  id: string;
  current_status: string;
  auditor_notes?: string;
  audited_at?: string;
  resolved: boolean;
  original_location: string;
  original_user?: string | null;
  current_location?: string;
  current_user?: string | null;
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
}

export default function AuditReportingPage() {
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const { t } = useI18n();

  useEffect(() => {
    // Fetch audit plans from GraphQL API
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
    if (!selectedPlan) return {
      broken: [],
      missing: [],
      returned: [],
      abolished: [],
      inUse: [],
      inStorage: [],
      onLoan: [],
      reservedForUse: [],
      locationUserChanges: [],
      total: 0
    };

    const assets = selectedPlan.auditAssets || [];
    // Filter assets by status (using both English and Japanese statuses)
    const broken = assets.filter(asset =>
      asset.current_status === 'Broken' || asset.current_status === '故障中'
    );
    const missing = assets.filter(asset =>
      asset.current_status === 'Missing' || asset.current_status === '欠落'
    );

    // Debug logging for missing assets
    console.log('Missing assets calculation:', {
      totalAssets: assets.length,
      missingCount: missing.length,
      missingAssets: missing.map(asset => ({
        id: asset.id,
        status: asset.current_status,
        assetId: asset.asset.asset_id
      }))
    });
    const returned = assets.filter(asset =>
      asset.current_status === 'Returned' || asset.current_status === '返却済'
    );
    const abolished = assets.filter(asset =>
      asset.current_status === 'Abolished' || asset.current_status === '廃止'
    );
    const inUse = assets.filter(asset =>
      asset.current_status === 'In Use' || asset.current_status === '利用中'
    );
    const inStorage = assets.filter(asset =>
      asset.current_status === 'In Storage' || asset.current_status === '保管中'
    );
    const onLoan = assets.filter(asset =>
      asset.current_status === 'On Loan' || asset.current_status === '貸出中'
    );
    const reservedForUse = assets.filter(asset =>
      asset.current_status === 'Reserved for Use' || asset.current_status === '利用予約'
    );

    // Assets with location or user changes
    const locationUserChanges = assets.filter(asset =>
      asset.current_location && asset.current_location !== asset.original_location ||
      asset.current_user && asset.current_user !== asset.original_user
    );

    return {
      broken,
      missing,
      returned,
      abolished,
      inUse,
      inStorage,
      onLoan,
      reservedForUse,
      locationUserChanges,
      total: assets.length
    };
  }, [selectedPlan]);

  const generatePdfReport = async () => {
    if (!selectedPlan) return;
    setIsGenerating(true);

    const doc = new jsPDF();
    doc.setFont("NotoSansJP-Regular", "normal");

    // Title
    doc.setFontSize(18);
    doc.text(t('pages.audits.reporting.pdf.report_title'), 14, 22);

    // Subtitle and Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${t('pages.audits.reporting.pdf.plan')}: ${selectedPlan.name}`, 14, 30);
    doc.text(`${t('pages.audits.reporting.pdf.report_date')}: ${format(new Date(), t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}`, 14, 36);
    doc.text(`${t('labels.status')}: ${selectedPlan.status}`, 14, 42);

    // Summary Section
    doc.setFontSize(14);
    doc.text(t('pages.audits.reporting.pdf.summary'), 14, 50);
    doc.autoTable({
      startY: 55,
      body: [
        [t('pages.audits.detail.total_assets'), discrepancies.total.toString()],
        [t('labels.statuses.missing'), discrepancies.missing.length.toString()],
        [t('labels.statuses.returned'), discrepancies.returned.length.toString()],
        [t('labels.statuses.abolished'), discrepancies.abolished.length.toString()],
        [t('labels.statuses.in_use'), discrepancies.inUse.length.toString()],
        [t('labels.statuses.in_storage'), discrepancies.inStorage.length.toString()],
        [t('labels.statuses.on_loan'), discrepancies.onLoan.length.toString()],
        [t('labels.statuses.broken'), discrepancies.broken.length.toString()],
        [t('labels.statuses.reserved_for_use'), discrepancies.reservedForUse.length.toString()],
        [t('pages.audits.reporting.changed_assets'), discrepancies.locationUserChanges.length.toString()],
      ],
      theme: 'striped',
      headStyles: { fontStyle: 'bold' },
      styles: {
        font: "NotoSansJP-Regular"
      }
    });

    // Missing Assets Section
    let lastY = (doc as any).lastAutoTable.finalY || 80;

    if (discrepancies.missing.length > 0) {
      doc.setFontSize(14);
      doc.text(t('pages.audits.reporting.pdf.missing_assets_title'), 14, lastY + 15);
      doc.autoTable({
        startY: lastY + 20,
        head: [[
          t('labels.id'),
          t('labels.model'),
          t('labels.original_location'),
          t('labels.original_user')
        ]],
        body: discrepancies.missing.map(asset => [
          asset.asset.asset_id,
          asset.asset.model,
          asset.original_location,
          asset.original_user || t('common.not_applicable')
        ]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold' },
        styles: {
          font: "NotoSansJP-Regular"
        }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    // Broken Assets Section
    if (discrepancies.broken.length > 0) {
      doc.setFontSize(14);
      doc.text(t('pages.audits.reporting.pdf.broken_assets'), 14, lastY + 15);
      doc.autoTable({
        startY: lastY + 20,
        head: [[
          t('labels.id'),
          t('labels.model'),
          t('labels.current_location'),
          t('labels.notes')
        ]],
        body: discrepancies.broken.map(asset => [
          asset.asset.asset_id,
          asset.asset.model,
          asset.current_location || asset.original_location,
          asset.auditor_notes || t('labels.na.no_notes')
        ]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold' },
        styles: {
          font: "NotoSansJP-Regular"
        }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    // Returned Assets Section
    if (discrepancies.returned.length > 0) {
      doc.setFontSize(14);
      doc.text(t('pages.audits.reporting.pdf.returned_assets_title'), 14, lastY + 15);
      doc.autoTable({
        startY: lastY + 20,
        head: [[
          t('labels.id'),
          t('labels.model'),
          t('labels.current_location'),
          t('labels.notes')
        ]],
        body: discrepancies.returned.map(asset => [
          asset.asset.asset_id,
          asset.asset.model,
          asset.current_location || asset.original_location,
          asset.auditor_notes || t('labels.na.no_notes')
        ]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold' },
        styles: {
          font: "NotoSansJP-Regular"
        }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    // Abolished Assets Section
    if (discrepancies.abolished.length > 0) {
      doc.setFontSize(14);
      doc.text("Abolished Assets", 14, lastY + 15);
      doc.autoTable({
        startY: lastY + 20,
        head: [[
          t('labels.id'),
          t('labels.model'),
          t('labels.current_location'),
          t('labels.notes')
        ]],
        body: discrepancies.abolished.map(asset => [
          asset.asset.asset_id,
          asset.asset.model,
          asset.original_location,
          asset.auditor_notes || t('labels.na.no_notes')
        ]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold' },
        styles: {
          font: "NotoSansJP-Regular"
        }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    // Location/User Changes Section
    if (discrepancies.locationUserChanges.length > 0) {
      doc.setFontSize(14);
      doc.text("Location/User Changes", 14, lastY + 15);
      doc.autoTable({
        startY: lastY + 20,
        head: [[
          t('labels.id'),
          t('labels.model'),
          t('labels.original_location'),
          t('labels.current_location'),
          t('labels.original_user'),
          t('labels.current_user')
        ]],
        body: discrepancies.locationUserChanges.map(asset => [
          asset.asset.asset_id,
          asset.asset.model,
          asset.original_location,
          asset.current_location || asset.original_location,
          asset.original_user || t('common.not_applicable'),
          asset.current_user || t('common.not_applicable')
        ]),
        theme: 'grid',
        headStyles: { fontStyle: 'bold' },
        styles: {
          font: "NotoSansJP-Regular"
        }
      });
      lastY = (doc as any).lastAutoTable.finalY;
    }

    doc.save(`${selectedPlan.name}_AuditReport_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsGenerating(false);
  }

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('pages.audits.reporting.title')}</CardTitle>
          <CardDescription>
            {t('pages.audits.reporting.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={setSelectedPlanId} value={selectedPlanId} disabled={plans.length === 0}>
            <SelectTrigger className="w-full md:w-1/2">
              <SelectValue placeholder={t('pages.audits.reporting.select_plan_prompt')} />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {/* plan.due_date */}
                  {plan.name} ({t('pages.audits.reporting.due_date')}: {format(plan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={generatePdfReport} disabled={!selectedPlan || isGenerating}>
            {isGenerating ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            {t('pages.audits.reporting.generate_pdf_button')}
          </Button>
        </CardContent>
      </Card>

      {!selectedPlanId && plans.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            {t('pages.audits.reporting.select_plan_prompt')}
          </CardContent>
        </Card>
      )}

      {plans.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-foreground">{t('pages.audits.no_plans_found_title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('pages.audits.no_plans_found_desc_reporting')}</p>
          </CardContent>
        </Card>
      )}

      {selectedPlan && (
        <>
          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.audits.reporting.pdf.preview_title')}</CardTitle>
              <CardDescription>{t('pages.audits.reporting.pdf.preview_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Asset Audit Report */}
              <div>
                <h4 className="font-medium mb-3">{t('pages.audits.reporting.pdf.report_title')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">{discrepancies.missing?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.missing')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">{discrepancies.returned?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.returned')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">{discrepancies.abolished?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.abolished')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">{discrepancies.inUse?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.in_use')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">{discrepancies.inStorage?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.in_storage')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <div>
                      <div className="font-medium">{discrepancies.onLoan?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.on_loan')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">{discrepancies.broken?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.broken')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">{discrepancies.reservedForUse?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.reserved_for_use')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg col-span-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <div>
                      <div className="font-medium">{discrepancies.locationUserChanges?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">{t('pages.audits.reporting.changed_assets')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium mb-2">{t('pages.audits.reporting.pdf.plan_information')}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{t('pages.audits.reporting.start_date')}: {format(selectedPlan.start_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{t('pages.audits.reporting.due_date')}: {format(selectedPlan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}</span>
                    </div>
                  </div>
                </div>
                {selectedPlan.description && (
                  <div>
                    <h4 className="font-medium mb-2">{t('pages.audits.reporting.pdf.description')}</h4>
                    <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
