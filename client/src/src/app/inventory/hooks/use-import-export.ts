import { useState, useCallback, useRef } from 'react'
import { AssetField, PcFormValues } from '@/lib/types/index'
import { handleAiMatch, handleConfirmImport, handleImportFile, handleMappingChange } from '../utils/import-export-utils';


interface UseImportExportProps {
    systemFields: AssetField[];
    onError: (title: string, description: string | React.ReactNode) => void;
    onSuccess: (message: string) => void;
}

export function useImportExport({ systemFields, onError, onSuccess }: UseImportExportProps) {

    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [isMappingAiLoading, setIsMappingAiLoading] = useState(false);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [fileData, setFileData] = useState<Record<string, string>[]>([]);
    const [mappings, setMappings] = useState<Record<string, string | null>>({});
    const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
    const [fileEncoding, setFileEncoding] = useState<'UTF-8' | 'Shift_JIS'>('UTF-8');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [isImportProgressDialogOpen, setIsImportProgressDialogOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [pcsToImport, setPcsToImport] = useState<(PcFormValues & { id?: string })[]>([]);
    const [importSummary, setImportSummary] = useState<{
        total: number;
        pcs: number;
        monitors: number;
        phones: number;
        others: number;
        errors: string[];
        categorizationDetails?: {
            pcs: string[];
            monitors: string[];
            phones: string[];
            others: string[];
        };
    } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleAiMatchCallback = useCallback(async () => {
        if (!fileHeaders.length) return;
        
        await handleAiMatch(
          fileHeaders,
          systemFields,
          setMappings,
          setIsMappingAiLoading,
          onError,
          onSuccess
        );
      }, [fileHeaders, systemFields, setMappings, setIsMappingAiLoading, onError, onSuccess]);

    const handleImportFileCallback = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleImportFile(
        event,
        fileEncoding,
        systemFields,
        onError,
        (headers, data, mappings) => {
        setFileHeaders(headers);
        setFileData(data);
        setMappings(mappings);
        setIsMappingAiLoading(false);
        },
        setFileName,
        setFileBuffer
    );
    }, [fileEncoding, systemFields, onError, setFileHeaders, setFileData, setMappings, setFileName, setFileBuffer, setIsMappingAiLoading]);

    const handleMappingChangeCallback = useCallback((fieldId: string, fileHeader: string) => {
    const newMappings = handleMappingChange(fieldId, fileHeader, mappings);
    setMappings(newMappings);
    }, [mappings, setMappings]);

    const handleConfirmImportCallback = useCallback(() => {
    handleConfirmImport(
        fileData,
        mappings,
        systemFields,
        onError,
        (assets) => {
        setPcsToImport(assets);
        setIsImporting(true);
        setImportProgress({ current: 0, total: assets.length });
        },
        setImportProgress,
        () => setIsImporting(true)
    );
    }, [fileData, mappings, systemFields, onError, setPcsToImport, setIsImporting, setImportProgress]);

    return {
        isImportDialogOpen,
        setIsImportDialogOpen,
        isMappingAiLoading,
        setIsMappingAiLoading,
        fileHeaders,    
        setFileHeaders,
        fileData,
        setFileData,
        mappings,
        setMappings,
        fileBuffer,
        setFileBuffer,
        fileEncoding,
        setFileEncoding: setFileEncoding as (encoding: 'UTF-8' | 'Shift_JIS') => void,
        fileName,
        setFileName,
        fileInputRef,
        importProgress,
        setImportProgress,
        isImportProgressDialogOpen,
        setIsImportProgressDialogOpen,
        isImporting,
        setIsImporting,
        pcsToImport,
        setPcsToImport,
        importSummary,
        setImportSummary,
        isExporting,
        setIsExporting,
        handleAiMatch: handleAiMatchCallback,
        handleImportFile: handleImportFileCallback,
        handleMappingChange: handleMappingChangeCallback,
        handleConfirmImport: handleConfirmImportCallback,
    }
}
