

// Import/Export constants
export const IMPORT_EXPORT = {
  // File handling
  SUPPORTED_FILE_TYPES: ['.tsv', '.csv', 'text/tab-separated-values', 'text/csv'],
  SUPPORTED_ENCODINGS: ['UTF-8', 'Shift_JIS'],
  DEFAULT_ENCODING: 'UTF-8',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 1, // 1 byte
  MAX_ROWS: 10000, // Maximum number of rows
  MIN_ROWS: 1, // Minimum number of rows

  // File validation messages
  VALIDATION_MESSAGES: {
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    FILE_TOO_SMALL: 'File is too small or empty',
    INVALID_FILE_TYPE: 'Invalid file type. Please select a CSV or TSV file.',
    TOO_MANY_ROWS: 'File contains too many rows',
    NO_DATA_ROWS: 'File contains no data rows',
    INVALID_ENCODING: 'File encoding is not supported',
    CORRUPTED_FILE: 'File appears to be corrupted or invalid'
  },
  
  // Field mapping
  REQUIRED_FIELD_IDS: ['field_01'], // Corresponds to id
  SKIP_IMPORT_VALUE: '--skip--',
  
  // Export
  EXPORT_FILENAME_PREFIX: 'inventory_export_',
  EXPORT_FILE_EXTENSION: '.csv',
  EXPORT_MIME_TYPE: 'text/csv;charset=utf-8;',
  
  // Progress
  PROGRESS_UPDATE_DELAY: 500, // ms
  
} as const;

// CSV export column order
export const EXPORT_COLUMN_ORDER = [
  'id',                    // GSI内管理番号
  'hostname',              // ホスト名
  'type',                  // 資産タイプ
  'manufacturer',          // メーカー
  'model',                 // 機種(M)
  'part_number',           // 型番(P/N)
  'serial_number',         // 製造番号(S/N)
  'form_factor',           // 形状 (識別)
  'location',              // 所在
  'status',                // 状態
  'previous_user',         // 旧利用者
  'user',                  // 利用者
  'os',                    // OS
  'os_bit',                // OS bit
  'office_suite',          // OFFICE
  'software_license_key',  // soft key
  'wired_mac_address',     // 有線 (MACアドレス)
  'wired_ip_address',      // 有線 IPアドレス
  'wireless_mac_address',  // 無線 (MACアドレス)
  'wireless_ip_address',   // 無線 IPアドレス
  'usage_start_date',      // 利用開始日
  'usage_end_date',        // 利用終了日
  'carry_in_out_agreement', // 持ち込み契約
  'last_updated',          // 更新日
  'updated_by',            // 更新者
  'notes',                 // 備考
  'purchase_date',         // 購入日
  'purchase_price',        // 購入価格 (税込)
  'depreciation_years',    // 償却年数
  'depreciation_dept',     // 償却部門
  'cpu',                   // CPU
  'memory'                 // MEM
] as const;

// Japanese headers for CSV export
export const JAPANESE_HEADERS: Record<string, string> = {
  'id': 'GSI内管理番号',
  'hostname': 'ホスト名',
  'type': '資産タイプ',
  'manufacturer': 'メーカー',
  'model': '機種(M)',
  'part_number': '型番(P/N)',
  'serial_number': '製造番号(S/N)',
  'form_factor': '形状 (識別)',
  'location': '所在',
  'status': '状態',
  'previous_user': '旧利用者',
  'user': '利用者',
  'os': 'OS',
  'os_bit': 'OS bit',
  'office_suite': 'OFFICE',
  'software_license_key': 'soft key',
  'wired_mac_address': '有線 (MACアドレス)',
  'wired_ip_address': '有線 IPアドレス',
  'wireless_mac_address': '無線 (MACアドレス)',
  'wireless_ip_address': '無線 IPアドレス',
  'usage_start_date': '利用開始日',
  'usage_end_date': '利用終了日',
  'carry_in_out_agreement': '持ち込み契約',
  'last_updated': '更新日',
  'updated_by': '更新者',
  'notes': '備考',
  'purchase_date': '購入日',
  'purchase_price': '購入価格 (税込)',
  'depreciation_years': '償却年数',
  'depreciation_dept': '償却部門',
  'cpu': 'CPU',
  'memory': 'MEM'
};

export const FILE_VALIDATION = {
  // File type validation
  isValidFileType: (fileName: string): boolean => {
    const extension = fileName.toLowerCase().split('.').pop();
    const supportedExtensions = IMPORT_EXPORT.SUPPORTED_FILE_TYPES
      .map(type => type.replace('.', ''))
      .filter(type => !type.includes('/')); // Remove MIME types
    return supportedExtensions.includes(extension || '');
  },
  
  // File size validation
  isValidFileSize: (fileSize: number): boolean => {
    return fileSize >= IMPORT_EXPORT.MIN_FILE_SIZE && 
           fileSize <= IMPORT_EXPORT.MAX_FILE_SIZE;
  },
  
  // Get file validation error message
  getValidationError: (fileName: string, fileSize: number): string | null => {
    if (!FILE_VALIDATION.isValidFileType(fileName)) {
      return IMPORT_EXPORT.VALIDATION_MESSAGES.INVALID_FILE_TYPE;
    }
    if (!FILE_VALIDATION.isValidFileSize(fileSize)) {
      if (fileSize > IMPORT_EXPORT.MAX_FILE_SIZE) {
        return IMPORT_EXPORT.VALIDATION_MESSAGES.FILE_TOO_LARGE;
      }
      if (fileSize < IMPORT_EXPORT.MIN_FILE_SIZE) {
        return IMPORT_EXPORT.VALIDATION_MESSAGES.FILE_TOO_SMALL;
      }
    }
    return null;
  },
  
  // Data validation
  isValidData: (data: Record<string, string>[]): { isValid: boolean; error?: string } => {
    if (data.length === 0) {
      return { isValid: false, error: IMPORT_EXPORT.VALIDATION_MESSAGES.NO_DATA_ROWS };
    }
    if (data.length > IMPORT_EXPORT.MAX_ROWS) {
      return { isValid: false, error: IMPORT_EXPORT.VALIDATION_MESSAGES.TOO_MANY_ROWS };
    }
    return { isValid: true };
  }
} as const;
