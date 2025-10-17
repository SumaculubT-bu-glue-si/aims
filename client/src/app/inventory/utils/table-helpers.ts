import { FrontendAsset } from '@/lib/types/index'

export interface TableColumn {
  label: string;
  schemaKey: keyof FrontendAsset;
  sortable: boolean;
  minWidth: string;
}

export function createTableColumns(t: (key: string) => string): TableColumn[] {
  return [
    { label: t('labels.id'), schemaKey: "assetId" as keyof FrontendAsset, sortable: true, minWidth: "80px" },
    { label: t('labels.hostname'), schemaKey: "hostname" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.location'), schemaKey: "location" as keyof FrontendAsset, sortable: true, minWidth: "80px" },
    { label: t('labels.userId'), schemaKey: "userId" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.status'), schemaKey: "status" as keyof FrontendAsset, sortable: true, minWidth: "80px" },
    { label: t('labels.manufacturer'), schemaKey: "manufacturer" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.model'), schemaKey: "model" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.partNumber'), schemaKey: "partNumber" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.serialNumber'), schemaKey: "serialNumber" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.formFactor'), schemaKey: "formFactor" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.previousUser'), schemaKey: "previousUser" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.os'), schemaKey: "os" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.osBit'), schemaKey: "osBit" as keyof FrontendAsset, sortable: true, minWidth: "60px" },
    { label: t('labels.officeSuite'), schemaKey: "officeSuite" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.softwareLicenseKey'), schemaKey: "softwareLicenseKey" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.wiredMacAddress'), schemaKey: "wiredMacAddress" as keyof FrontendAsset, sortable: true, minWidth: "140px" },
    { label: t('labels.wiredIpAddress'), schemaKey: "wiredIpAddress" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.wirelessMacAddress'), schemaKey: "wirelessMacAddress" as keyof FrontendAsset, sortable: true, minWidth: "140px" },
    { label: t('labels.wirelessIpAddress'), schemaKey: "wirelessIpAddress" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.usageStartDate'), schemaKey: "usageStartDate" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.usageEndDate'), schemaKey: "usageEndDate" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.carryInOutAgreement'), schemaKey: "carryInOutAgreement" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.lastUpdated'), schemaKey: "lastUpdated" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.updatedBy'), schemaKey: "updatedBy" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.purchaseDate'), schemaKey: "purchaseDate" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.purchasePrice'), schemaKey: "purchasePrice" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.purchasePriceTaxIncluded'), schemaKey: "purchasePriceTaxIncluded" as keyof FrontendAsset, sortable: true, minWidth: "120px" },
    { label: t('labels.depreciationYears'), schemaKey: "depreciationYears" as keyof FrontendAsset, sortable: true, minWidth: "80px" },
    { label: t('labels.depreciationDept'), schemaKey: "depreciationDept" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.cpu'), schemaKey: "cpu" as keyof FrontendAsset, sortable: true, minWidth: "100px" },
    { label: t('labels.memory'), schemaKey: "memory" as keyof FrontendAsset, sortable: true, minWidth: "80px" },
    { label: t('labels.notes'), schemaKey: "notes" as keyof FrontendAsset, sortable: false, minWidth: "200px" },
  ];
}

export function sortAssets<T extends FrontendAsset>(
  assets: T[], 
  sortConfig: { key: keyof FrontendAsset; direction: 'asc' | 'desc' } | null
): T[] {
  if (!sortConfig) return assets;

  return [...assets].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue === bValue) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
}