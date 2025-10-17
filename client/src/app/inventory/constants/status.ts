// Asset status constants
export const ASSET_STATUSES = [
  '返却済', 
  '廃止', 
  '保管(使用無)', 
  '利用中', 
  '保管中', 
  '貸出中', 
  '故障中', 
  '利用予約'
] as const;

export type AssetStatus = typeof ASSET_STATUSES[number];

// Status mapping for translations
export const STATUS_MAPPING: Record<string, string> = {
  '返却済': 'labels.statuses.returned',
  '廃止': 'labels.statuses.abolished',
  '保管(使用無)': 'labels.statuses.stored_not_in_use',
  '利用中': 'labels.statuses.in_use',
  '保管中': 'labels.statuses.in_storage',
  '貸出中': 'labels.statuses.on_loan',
  '故障中': 'labels.statuses.broken',
  '利用予約': 'labels.statuses.reserved_for_use'
};

// Status to English mapping for imports
export const STATUS_JP_TO_EN: Record<string, string> = {
  '返却済': 'Returned',
  '廃止': 'Abolished',
  '保管(使用無)': 'Stored - Not in Use',
  '利用中': 'In Use',
  '保管中': 'In Storage',
  '貸出中': 'On Loan',
  '故障中': 'Broken',
  '利用予約': 'Reserved for Use',
};

// Status badge variants
export const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case '利用中':
    case 'Active':
      return 'default'
    case '貸出中':
    case '利用予約':
      return 'secondary'
    case '故障中':
      return 'destructive'
    case '廃止':
    case '返却済':
      return 'outline'
    case '保管中':
    case '保管(使用無)':
      return 'outline'
    default:
      return 'secondary'
  }
};
