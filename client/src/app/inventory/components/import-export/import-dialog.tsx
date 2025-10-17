import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AssetField } from "@/lib/types";
import { PcFormValues } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader, Upload, Sparkles } from "lucide-react";
import { fieldIdToSchemaKeyMap } from "@/lib/data"
import { Input } from "@/components/ui/input";
import { useI18n } from "@/hooks/use-i18n";
import { IMPORT_EXPORT } from "../../constants";
import { FILE_VALIDATION } from "../../constants/import-export";


interface ImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onImportComplete: () => void;
    systemFields: AssetField[];
    getDisplayName: (key: keyof PcFormValues) => string;
    fileEncoding: 'UTF-8' | 'Shift_JIS';
    setFileEncoding: (encoding: 'UTF-8' | 'Shift_JIS') => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleImportFile: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileName: string;
    fileData: Record<string, string>[];
    fileBuffer: ArrayBuffer | null;
    fileHeaders: string[];
    mappings: Record<string, string | null>;
    handleMappingChange: (fieldId: string, value: string) => void;
    handleAiMatch: () => void;
    isMappingAiLoading: boolean;
    isPending: boolean;
    handleConfirmImport: () => void;
    importProgress: { current: number; total: number };
    onError: (title: string, description: string) => void;
  }

export function ImportDialog({
    isOpen, 
    onOpenChange, 
    onImportComplete, 
    systemFields, 
    getDisplayName,
    fileEncoding,
    setFileEncoding,
    fileInputRef,
    handleImportFile,
    fileName,
    fileData,
    fileBuffer,
    fileHeaders,
    mappings,
    handleMappingChange,
    handleAiMatch,
    isMappingAiLoading,
    isPending,
    handleConfirmImport,
    importProgress,
    onError
 }: ImportDialogProps) {
    const { t } = useI18n();
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
            <DialogHeader>
                <DialogTitle>{t('pages.inventory.import_dialog.title')}</DialogTitle>
                    <DialogDescription>
                    {t('pages.inventory.import_dialog.description')}
                    <br />
                    {t('pages.inventory.import_dialog.description_2')}
                </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
                <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="encoding-select">{t('pages.inventory.mapping_dialog.encoding')}</Label>
                <Select value={fileEncoding} onValueChange={setFileEncoding}>
                    <SelectTrigger id="encoding-select" className="w-full">
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {IMPORT_EXPORT.SUPPORTED_ENCODINGS.map(encoding => (
                            <SelectItem key={encoding} value={encoding}>
                                {encoding}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-1.5 md:col-span-4">
                <Label>{t('actions.select_file')}</Label>
                <div className="flex items-center gap-2">
                    <Input
                        id="file-upload"
                        type="file"
                        ref={fileInputRef}
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              const validationError = FILE_VALIDATION.getValidationError(file.name, file.size);
                              if (validationError) {
                                onError('File Validation Error', validationError);
                                event.target.value = ''; // Clear the input
                                return;
                              }
                            }
                            handleImportFile(event);
                          }}
                        accept={IMPORT_EXPORT.SUPPORTED_FILE_TYPES.join(',')}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {t('actions.select_file')}
                    </Button>
                    <span className="flex-1 truncate text-sm text-muted-foreground">
                        {fileName || t('pages.inventory.mapping_dialog.no_file_chosen')}
                        {fileData.length > 0 && (
                        <span className="ml-2 text-foreground">
                            {t('pages.inventory.import_dialog.records_loaded', { count: fileData.length })}
                            {fileBuffer && (
                            <span className="ml-1 text-xs text-muted-foreground">
                                ({(fileBuffer.byteLength / 1024).toFixed(1)} KB)
                            </span>
                            )}
                        </span>
                        )}
                    </span>
                </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-end items-center">
                <Button variant="outline" onClick={handleAiMatch} disabled={isMappingAiLoading || isPending || fileHeaders.length === 0}>
                    {isMappingAiLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {t('pages.inventory.mapping_dialog.ai_match_button')}
                </Button>
                </div>

                <div className="max-h-[50vh] overflow-y-auto pr-4">
                <div className="relative">
                    {isMappingAiLoading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 rounded-md">
                        <Loader className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    )}
                    <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                        <TableRow>
                        <TableHead className="font-semibold">{t('pages.inventory.mapping_dialog.system_field')}</TableHead>
                        <TableHead className="font-semibold">{t('pages.inventory.mapping_dialog.file_column')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {systemFields
                        .filter(field => field.visible && fieldIdToSchemaKeyMap[field.id])
                        .map((field) => (
                            <TableRow key={field.id}>
                            <TableCell className="font-medium">{field.displayName}</TableCell>
                            <TableCell>
                                <Select
                                onValueChange={(value) => handleMappingChange(field.id, value)}
                                value={mappings[field.id] || ""}
                                disabled={fileHeaders.length === 0}
                                >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('pages.inventory.mapping_dialog.select_column_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="--skip--">{t('pages.inventory.mapping_dialog.skip_import')}</SelectItem>
                                    {fileHeaders.map((header, index) => (
                                    <SelectItem key={`${header}-${index}`} value={header}>
                                        {header}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                </div>
            </div>

            <DialogFooter>
                <DialogClose asChild>
                <Button variant="secondary" disabled={isPending || isMappingAiLoading}>{t('actions.cancel')}</Button>
                </DialogClose>
                <Button onClick={handleConfirmImport} disabled={isPending || isMappingAiLoading || fileHeaders.length === 0}>
                {isPending ? (
                    <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t('actions.importing_progress', { current: importProgress.current, total: importProgress.total })}
                    </>
                ) : t('pages.inventory.mapping_dialog.confirm_button')}
                </Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}