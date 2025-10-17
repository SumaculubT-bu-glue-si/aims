// Asset type constants
export const ASSET_TYPES = {
  PC: 'pc',
  MONITOR: 'monitor', 
  SMARTPHONE: 'smartphones',
  OTHER: 'others'
} as const;

export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];

// Asset type display names
export const ASSET_TYPE_DISPLAY_NAMES: Record<AssetType, string> = {
  [ASSET_TYPES.PC]: 'pages.inventory.tabs.pcs',
  [ASSET_TYPES.MONITOR]: 'pages.inventory.tabs.monitors', 
  [ASSET_TYPES.SMARTPHONE]: 'pages.inventory.tabs.smartphones',
  [ASSET_TYPES.OTHER]: 'pages.inventory.tabs.others'
};

// Asset type icons
export const ASSET_TYPE_ICONS = {
  [ASSET_TYPES.PC]: 'Laptop',
  [ASSET_TYPES.MONITOR]: 'Monitor',
  [ASSET_TYPES.SMARTPHONE]: 'Smartphone', 
  [ASSET_TYPES.OTHER]: 'KeyRound'
} as const;
