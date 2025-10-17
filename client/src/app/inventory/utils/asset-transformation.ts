import { FrontendAsset, PcFormValues } from '@/lib/types/index'

export function convertFormValuesToAsset(formValues: PcFormValues): FrontendAsset {
  const now = new Date().toISOString();
  
  return {
    id: formValues.id || '',
    assetId: formValues.assetId || '',
    type: (formValues.type as any) || 'pc',
    manufacturer: formValues.manufacturer || '',
    model: formValues.model || '',
    serialNumber: formValues.serialNumber || '',
    location: formValues.location || '',
    status: (formValues.status as any) || '保管中',
    userId: formValues.userId || '',
    notes: formValues.notes,
    project: formValues.project,
    
    // PC-specific fields
    hostname: formValues.hostname,
    partNumber: formValues.partNumber,
    formFactor: formValues.formFactor,
    os: formValues.os,
    osBit: formValues.osBit,
    officeSuite: formValues.officeSuite,
    softwareLicenseKey: formValues.softwareLicenseKey,
    wiredMacAddress: formValues.wiredMacAddress,
    wiredIpAddress: formValues.wiredIpAddress,
    wirelessMacAddress: formValues.wirelessMacAddress,
    wirelessIpAddress: formValues.wirelessIpAddress,
    cpu: formValues.cpu,
    memory: formValues.memory,
    previousUser: formValues.previousUser,
    
    // Purchase and financial fields
    purchaseDate: formValues.purchaseDate,
    purchasePrice: formValues.purchasePrice,
    purchasePriceTaxIncluded: formValues.purchasePriceTaxIncluded,
    depreciationYears: formValues.depreciationYears,
    depreciationDept: formValues.depreciationDept,
    
    // Usage tracking
    usageStartDate: formValues.usageStartDate,
    usageEndDate: formValues.usageEndDate,
    carryInOutAgreement: formValues.carryInOutAgreement,
    lastUpdated: formValues.lastUpdated,
    updatedBy: formValues.updatedBy,
    
    // Additional notes fields
    notes1: formValues.notes1,
    notes2: formValues.notes2,
    notes3: formValues.notes3,
    notes4: formValues.notes4,
    notes5: formValues.notes5,
    
    // Base entity fields
    createdAt: formValues.createdAt || now,
    updatedAt: formValues.updatedAt || now
  };
}

export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    '利用中': 'default',
    '保管中': 'secondary',
    '故障中': 'destructive',
    '廃止': 'destructive',
    '返却済': 'outline',
    '貸出中': 'default',
    '利用予約': 'secondary',
    '保管(使用無)': 'outline'
  };
  
  return statusMap[status] || 'default';
}

export function getStatusText(status: string): string {
  return status || 'Unknown';
}

export function getEmployeeName(asset: FrontendAsset): string {
  return (asset as any).employee?.name || asset.userId || '-';
}

export function getAssetTypeDisplayName(type: string): string {
  const typeMap: Record<string, string> = {
    'pc': 'PC',
    'monitor': 'Monitor',
    'smartphones': 'Smartphone',
    'others': 'Other Asset'
  };
  
  return typeMap[type] || type;
}