import React from 'react';
import { AssetField, PcFormValues } from '@/lib/types/index';
import { fieldIdToSchemaKeyMap } from "@/lib/data";
import { IMPORT_EXPORT, EXPORT_COLUMN_ORDER, JAPANESE_HEADERS, FILE_VALIDATION } from '../constants/import-export';
import { emptyFormValues } from '../constants/form-defaults';
import { ASSET_TYPES } from '../constants/asset-types';

export const robustCsvParser = (csvText: string): { headers: string[], data: Record<string, string>[] } => {
    const text = csvText.replace(/\r\n/g, '\n').trim();
  
    const firstLineEnd = text.indexOf('\n');
    const firstLine = firstLineEnd === -1 ? text : text.substring(0, firstLineEnd);
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
  
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let field = '';
    let inQuotes = false;
  
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
  
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            field += '"';
            i++; // Skip the escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
      } else {
        if (char === delimiter) {
          currentRow.push(field);
          field = '';
        } else if (char === '\n') {
          currentRow.push(field);
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          field = '';
        } else if (char === '"' && field.length === 0) {
          inQuotes = true;
        } else {
          field += char;
        }
      }
    }
  
    // Add the last row if file doesn't end with newline
    if (field || currentRow.length > 0) {
      currentRow.push(field);
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
        rows.push(currentRow);
      }
    }
  
    if (rows.length === 0) {
      return { headers: [], data: [] };
    }
  
    const headers = rows.shift()!.map(h => h.trim().replace(/^"|"$/g, ''));
    const data = rows.map(rowData => {
      const obj: Record<string, string> = {};
      const paddedRow = rowData.concat(Array(Math.max(0, headers.length - rowData.length)).fill(''));
  
      headers.forEach((header, i) => {
        const value = paddedRow[i] || '';
        obj[header] = value.trim().replace(/^"|"$/g, '');
      });
      return obj;
    });
  
    return { headers, data };
  };

export const processFileContent = (
  buffer: ArrayBuffer,
  encoding: string,
  systemFields: AssetField[],
  onError: (title: string, description: string) => void,
  onSuccess: (headers: string[], data: Record<string, string>[], mappings: Record<string, string | null>) => void
) => {
  try {
    const decoder = new TextDecoder(encoding, { fatal: true });
    const text = decoder.decode(buffer);

    if (!text) {
      onError('Error', 'File is empty');
      return;
    }

    const { headers, data } = robustCsvParser(text);

    if (headers.length === 0 || data.length === 0) {
      onError('Error', 'No header or data found in file');
      return;
    }

    const initialMappings: Record<string, string | null> = {};
    const availableFields = systemFields.filter(field => field.visible && fieldIdToSchemaKeyMap[field.id]);

    availableFields.forEach(field => {
      if (field.systemName && ['notes', 'notes1', 'notes2', 'notes3', 'notes4', 'notes5'].includes(field.systemName)) {
        initialMappings[field.id] = null;
        return;
      }

      const normalize = (str: string) => str.toLowerCase().replace(/[\s\(\)-_]/g, '');
      const normalizedField = normalize(field.displayName);
      const matchedHeader = headers.find(h => normalize(h) === normalizedField);
      initialMappings[field.id] = matchedHeader || null;
    });

    onSuccess(headers, data, initialMappings);
  } catch (e: any) {
    onError('Encoding Error', 'Failed to decode file with specified encoding');
    throw e;
  }
};

export const handleImportFile = (
  event: React.ChangeEvent<HTMLInputElement>,
  fileEncoding: 'UTF-8' | 'Shift_JIS',
  systemFields: AssetField[],
  onError: (title: string, description: string) => void,
  onSuccess: (headers: string[], data: Record<string, string>[], mappings: Record<string, string | null>) => void,
  onFileNameChange: (name: string) => void,
  onFileBufferChange: (buffer: ArrayBuffer) => void
) => {
  const file = event.target.files?.[0];
  if (!file) {
    onFileNameChange('');
    return;
  }

  const validationError = FILE_VALIDATION.getValidationError(file.name, file.size);
  if (validationError) {
    onError('File Validation Error', validationError);
    onFileNameChange('');
    return;
  }

  if (!IMPORT_EXPORT.SUPPORTED_ENCODINGS.includes(fileEncoding)) {
    onError('Encoding Error', IMPORT_EXPORT.VALIDATION_MESSAGES.INVALID_ENCODING);
    return;
  }

  onFileNameChange(file.name);

  const reader = new FileReader();
  reader.onload = async (e) => {
    const buffer = e.target?.result as ArrayBuffer;
    if (!buffer) {
      onError('File Error', IMPORT_EXPORT.VALIDATION_MESSAGES.FILE_TOO_SMALL);
      return;
    }
    
    onFileBufferChange(buffer);
    try {
      processFileContent(buffer, fileEncoding, systemFields, onError, onSuccess);
    } catch (error) {
      onError('Processing Error', IMPORT_EXPORT.VALIDATION_MESSAGES.CORRUPTED_FILE);
    }
  };
  reader.readAsArrayBuffer(file);
};

export const validateImportData = (
  fileData: Record<string, string>[],
  mappings: Record<string, string | null>,
  systemFields: AssetField[],
  onError: (title: string, description: string) => void
): boolean => {
  if (fileData.length === 0) {
    onError('Error', 'No data to import');
    return false;
  }


  const unmappedRequiredFields = IMPORT_EXPORT.REQUIRED_FIELD_IDS
    .map(id => {
      const field = systemFields.find(f => f.id === id);
      const isMapped = mappings[id] && mappings[id] !== IMPORT_EXPORT.SKIP_IMPORT_VALUE;
      return { field, isMapped };
    })
    .filter(item => !item.isMapped && item.field)
    .map(item => item.field!.displayName);

  if (unmappedRequiredFields.length > 0) {
    onError(
      'Validation Error',
      `Required fields must be mapped: ${unmappedRequiredFields.join(', ')}`
    );
    return false;
  }

  return true;
};

export const processImportData = (
  fileData: Record<string, string>[],
  mappings: Record<string, string | null>
): any[] => {
  return fileData.map((row, index) => {
    const assetObject: any = {};
    Object.entries(mappings).forEach(([fieldId, fileHeader]) => {
      if (fileHeader && fileHeader !== IMPORT_EXPORT.SKIP_IMPORT_VALUE && row[fileHeader] !== undefined) {
        const schemaKey = fieldIdToSchemaKeyMap[fieldId as keyof typeof fieldIdToSchemaKeyMap];
        if (schemaKey) {
          let value = row[fileHeader];
          assetObject[schemaKey] = value;
        }
      }
    });
    return assetObject;
  });
};

export const generateExportData = (
  assets: any[],
  useJapaneseHeaders: boolean = false
): { headers: string[], data: any[] } => {
  const headers = useJapaneseHeaders 
    ? [...EXPORT_COLUMN_ORDER].map(key => JAPANESE_HEADERS[key] || key)
    : [...EXPORT_COLUMN_ORDER];

  const data = assets.map(asset => {
    const row: any = {};
    EXPORT_COLUMN_ORDER.forEach(key => {
      row[key] = asset[key] || '';
    });
    return row;
  });

  return { headers, data };
};

export const createExportFilename = (): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${IMPORT_EXPORT.EXPORT_FILENAME_PREFIX}${timestamp}${IMPORT_EXPORT.EXPORT_FILE_EXTENSION}`;
};

export const handleMappingChange = (
  fieldId: string,
  fileHeader: string,
  currentMappings: Record<string, string | null>
): Record<string, string | null> => {
  return { ...currentMappings, [fieldId]: fileHeader };
};

import { toSnakeCase } from './string-helpers';

export const handleAiMatch = async (
  fileHeaders: string[],
  systemFields: AssetField[],
  onMappingsChange: (mappings: Record<string, string | null>) => void,
  onLoadingChange: (loading: boolean) => void,
  onError: (title: string, description: string | React.ReactNode) => void,
  onSuccess: (message: string) => void
) => {
  if (!fileHeaders.length) return;
  onLoadingChange(true);
  try {
    const availableFields = systemFields
      .filter(field => field.visible && fieldIdToSchemaKeyMap[field.id])
      .map(field => ({ id: field.id, name: field.displayName }));

    // Import the AI mapping function
    const { mapAssetFieldsFromCsv } = await import('@/ai/flows/map-asset-fields-flow');
    const aiSuggestions = await mapAssetFieldsFromCsv({
      csvHeaders: fileHeaders,
      systemFields: availableFields,
    });

    const newMappings: Record<string, string | null> = {};
    if (aiSuggestions?.mappings) {
      aiSuggestions.mappings.forEach(mapping => {
        if (mapping.csvHeader && fileHeaders.includes(mapping.csvHeader)) {
          newMappings[mapping.systemFieldId] = mapping.csvHeader;
        }
      });
    }

    onMappingsChange(newMappings);
    onSuccess('AI mapping completed successfully');
  } catch (error) {
    console.error("AI matching failed", error);
    onError('Error', 'AI matching failed');
  } finally {
    onLoadingChange(false);
  }
};

export const handleConfirmImport = (
  fileData: Record<string, string>[],
  mappings: Record<string, string | null>,
  systemFields: AssetField[],
  onError: (title: string, description: string | React.ReactNode) => void,
  onSuccess: (assets: any[]) => void,
  onProgress: (progress: { current: number; total: number }) => void,
  onImportStart: () => void
) => {
  if (fileData.length === 0) {
    onError('Error', 'No data to import');
    return;
  }

  const requiredFieldIds = ['field_01']; // Corresponds to id
  const unmappedRequiredFields = requiredFieldIds
    .map(id => {
      const field = systemFields.find(f => f.id === id);
      const isMapped = mappings[id] && mappings[id] !== '--skip--';
      return { field, isMapped };
    })
    .filter(item => !item.isMapped && item.field)
    .map(item => item.field!.displayName);

  if (unmappedRequiredFields.length > 0) {
    onError(
      'Validation Error',
      `Required fields must be mapped: ${unmappedRequiredFields.join(', ')}`
    );
    return;
  }

  try {
    const processedAssets = processImportData(fileData, mappings);
    onProgress({ current: 0, total: processedAssets.length });
    onImportStart();
    onSuccess(processedAssets);
  } catch (error) {
    onError('Import Error', 'Failed to process import data');
  }
};

export const showErrorDialog = (title: string, description: string | React.ReactNode) => {
  // This function is used to show error dialogs
  // The actual implementation depends on your dialog system
  console.error(title, description);
};