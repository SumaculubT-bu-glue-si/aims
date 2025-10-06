

"use client"

import { useState, useRef, useMemo, useTransition, useEffect } from 'react'
import * as xlsx from 'xlsx'
import Papa from 'papaparse'
import { useRouter } from 'next/navigation'

import { useI18n } from '@/hooks/use-i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, Database, Users, Building, FolderKanban, AlertCircle, Loader, Sparkles, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { masterData } from '@/lib/data'
import { mapAssetFieldsFromCsv, type MapAssetFieldsOutput } from "@/ai/flows/map-asset-fields-flow"
import { type AssetField, type EmployeeFormValues } from '@/lib/schemas/settings'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from "@/hooks/use-toast"
import { saveEmployeesBatch } from '../employees/actions'
import { saveLocationsBatch } from '../locations/actions'

type Target = 'employees' | 'locations' | 'projects' | 'assets'
type FileType = 'csv' | 'excel'

export default function DataImportPage() {
  const { t } = useI18n()
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const csvFileInputRef = useRef<HTMLInputElement>(null)
  const excelFileInputRef = useRef<HTMLInputElement>(null)

  const [isParsing, setIsParsing] = useState<boolean>(false)
  const [isMappingAiLoading, setIsMappingAiLoading] = useState(false);
  const [isSubmitting, startTransition] = useTransition()

  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [isImportProgressOpen, setIsImportProgressOpen] = useState(false);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [importError, setImportError] = useState<{ title: string; message: string; } | null>(null);


  // File and parsing options state
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null)
  const [fileType, setFileType] = useState<FileType | null>(null)
  const [fileEncoding, setFileEncoding] = useState('UTF-8');
  const [hasHeader, setHasHeader] = useState(true);
  const [startRow, setStartRow] = useState(1);

  // Parsed data state
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});

  // Excel specific state
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<xlsx.WorkBook | null>(null);

  const targets = [
    { id: 'employees', icon: Users, title: t('nav.manage_employees'), desc: t('pages.settings.data_import.target_employees_desc') },
    { id: 'locations', icon: Building, title: t('nav.manage_locations'), desc: t('pages.settings.data_import.target_locations_desc') },
    { id: 'projects', icon: FolderKanban, title: t('nav.manage_projects'), desc: t('pages.settings.data_import.target_projects_desc') },
    { id: 'assets', icon: Database, title: t('pages.inventory.title'), desc: t('pages.settings.data_import.target_assets_desc') },
  ] as const

  const employeeSystemFields: AssetField[] = [
    { id: 'emp_field_01', order: 1, systemName: 'employeeId', displayName: t('pages.settings.employees.dialog_form_label_id'), dataType: 'Text', visible: true, notes: '従業員の一意のID。空の場合は自動採番されます。' },
    { id: 'emp_field_02', order: 2, systemName: 'name', displayName: t('pages.settings.employees.dialog_form_label_name'), dataType: 'Text', visible: true, notes: '従業員の氏名' },
    { id: 'emp_field_03', order: 3, systemName: 'email', displayName: t('pages.settings.employees.dialog_form_label_email'), dataType: 'Text', visible: true, notes: '従業員のメールアドレス' },
    { id: 'emp_field_04', order: 4, systemName: 'department', displayName: t('pages.settings.employees.dialog_form_label_department'), dataType: 'Text', visible: true, notes: '所属する拠点・部署' },
    { id: 'emp_field_05', order: 5, systemName: 'projects', displayName: t('pages.settings.employees.table_header_projects'), dataType: 'Text', visible: true, notes: '参加しているプロジェクト（カンマ区切り）' },
  ];

  const locationSystemFields: AssetField[] = [
    { id: 'loc_field_01', order: 1, systemName: 'name', displayName: t('pages.settings.locations.dialog_form_label'), dataType: 'Text', visible: true, notes: '拠点名' },
  ];

  const targetSystemFields = useMemo((): AssetField[] => {
    switch (selectedTarget) {
      case 'assets':
        return masterData.assetFields;
      case 'employees':
        return employeeSystemFields;
      case 'locations':
        return locationSystemFields;
      // TODO: Add schemas for other master types
      default:
        return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTarget]);

  const processCsvFile = async () => {
    if (!fileBuffer) return;
    setIsParsing(true);
    setError(null);

    try {
      const decoder = new TextDecoder(fileEncoding);
      const text = decoder.decode(fileBuffer);
      const result = await new Promise<{ data: string[][], errors: Papa.ParseError[] }>((resolve) => {
        Papa.parse<string[]>(text, {
          skipEmptyLines: true,
          complete: (res) => resolve({ data: res.data, errors: res.errors }),
          error: (err: Error) => resolve({ data: [], errors: [{ type: 'Quotes', code: 'MissingQuotes', message: err.message, row: 0 }] }),
        });
      });

      if (result.errors.length > 0) {
        throw new Error(t('errors.file_parse_error', { message: result.errors[0].message }));
      }

      const rows = result.data;
      const effectiveStartRow = startRow > 0 ? startRow - 1 : 0;

      if (rows.length <= effectiveStartRow) {
        throw new Error(t('errors.file_no_header_or_data'));
      }

      let dataToProcess = rows.slice(effectiveStartRow);
      let headers: string[];

      if (hasHeader) {
        headers = dataToProcess.shift()?.map(String) || [];
      } else {
        const firstRow = dataToProcess[0] || [];
        headers = firstRow.map((_, i) => `Column ${i + 1}`);
      }

      const dataAsObjects = dataToProcess.map(rowArray => {
        const rowObject: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowObject[header] = String(rowArray[index] ?? '');
        });
        return rowObject;
      });

      setFileHeaders(headers);
      setFileData(dataAsObjects);
    } catch (err: unknown) {
      setError((err as Error).message);
      setFileHeaders([]);
      setFileData([]);
    } finally {
      setIsParsing(false);
    }
  }

  const processExcelFile = async () => {
    if (!fileBuffer || !workbook || !selectedSheet) return;
    setIsParsing(true);
    setError(null);

    try {
      const sheet = workbook.Sheets[selectedSheet];
      const effectiveStartRow = startRow > 0 ? startRow - 1 : 0;

      const jsonData = xlsx.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        defval: '',
        range: effectiveStartRow,
        blankrows: false
      });

      if (jsonData.length === 0) {
        throw new Error(t('errors.file_no_header_or_data'));
      }

      let headers: string[];
      let data: any[][];

      if (hasHeader) {
        headers = jsonData[0]?.map(String) || [];
        data = jsonData.slice(1);
      } else {
        headers = jsonData[0]?.map((_: any, i: number) => `Column ${i + 1}`) || [];
        data = jsonData;
      }

      const dataAsObjects = data.map((rowArray: any[]) => {
        const rowObject: Record<string, string> = {};
        headers.forEach((header: string, index: number) => {
          rowObject[header] = String(rowArray[index] ?? '');
        });
        return rowObject;
      });

      setFileHeaders(headers);
      setFileData(dataAsObjects);
    } catch (err: unknown) {
      setError(t('errors.file_parse_error', { message: (err as Error).message }));
      setFileHeaders([]);
      setFileData([]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, selectedFileType: FileType) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetFileState();
      return;
    }
    setError(null);
    setFileName(file.name);
    setFileType(selectedFileType);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      setFileBuffer(buffer);

      if (selectedFileType === 'excel') {
        try {
          const wb = xlsx.read(buffer, { type: 'array' });
          setWorkbook(wb);
          const sheetNames = wb.SheetNames;
          setExcelSheets(sheetNames);
          setSelectedSheet(sheetNames[0] || '');
        } catch (err) {
          setError(t('errors.file_parse_error', { message: (err as Error).message }));
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  useEffect(() => {
    const processFile = async () => {
      if (!fileBuffer) return;
      if (fileType === 'csv') {
        await processCsvFile();
      } else if (fileType === 'excel') {
        await processExcelFile();
      }
    };
    processFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileBuffer, fileType, fileEncoding, hasHeader, startRow, selectedSheet, workbook]);


  useEffect(() => {
    // Reset mappings when headers change
    const initialMappings: Record<string, string | null> = {};
    targetSystemFields.forEach(field => { initialMappings[field.id] = null; });
    setMappings(initialMappings);
  }, [fileHeaders, targetSystemFields]);


  const resetFileState = () => {
    setFileName('');
    setFileBuffer(null);
    setFileHeaders([]);
    setFileData([]);
    setMappings({});
    setError(null);
    setWorkbook(null);
    setExcelSheets([]);
    setSelectedSheet('');
    setFileType(null);
    setHasHeader(true);
    setStartRow(1);
    if (csvFileInputRef.current) csvFileInputRef.current.value = "";
    if (excelFileInputRef.current) excelFileInputRef.current.value = "";
  }

  const handleAiMatch = async () => {
    if (!fileHeaders.length || targetSystemFields.length === 0) return;
    setIsMappingAiLoading(true);
    try {
      const availableFields = targetSystemFields.map(field => ({ id: field.id, name: field.displayName }));
      const aiSuggestions: MapAssetFieldsOutput = await mapAssetFieldsFromCsv({
        csvHeaders: fileHeaders,
        systemFields: availableFields,
      });

      const newMappings = { ...mappings };
      if (aiSuggestions?.mappings) {
        aiSuggestions.mappings.forEach(mapping => {
          if (mapping.csvHeader && fileHeaders.includes(mapping.csvHeader)) {
            newMappings[mapping.systemFieldId] = mapping.csvHeader;
          }
        });
      }
      setMappings(newMappings);
      setError(null);
    } catch (error) {
      console.error("AI matching failed", error);
      setError(t('errors.ai_matching_failed'));
    } finally {
      setIsMappingAiLoading(false);
    }
  }

  const handleImport = () => {
    startTransition(async () => {
      let result: { success: boolean; message: string; };
      setImportError(null);

      if (selectedTarget === 'employees') {
        const employeesToSave: EmployeeFormValues[] = fileData.map(row => {
          const employeeData: any = {};
          Object.entries(mappings).forEach(([fieldId, fileHeader]) => {
            const systemField = employeeSystemFields.find(f => f.id === fieldId);
            if (systemField && fileHeader && fileHeader !== '--skip--' && row[fileHeader] !== undefined) {
              const key = systemField.systemName as keyof EmployeeFormValues;
              if (key === 'projects') {
                employeeData.projects = row[fileHeader].split(',').map(p => p.trim()).filter(Boolean);
              } else {
                employeeData[key] = row[fileHeader] === undefined ? null : row[fileHeader];
              }
            }
          });
          return employeeData as EmployeeFormValues;
        });

        // Validation for employee name
        const invalidEmployeeIndex = employeesToSave.findIndex(emp => !emp.name || emp.name.trim() === '');
        if (invalidEmployeeIndex > -1) {
          const errorRow = (hasHeader ? startRow : startRow - 1) + invalidEmployeeIndex + 1;
          setImportError({
            title: t('errors.import_error_title', { row: errorRow }),
            message: t('validation.required', { field: t('pages.settings.employees.dialog_form_label_name') })
          });
          return;
        }

        setImportProgress({ current: 0, total: employeesToSave.length });
        setIsImportProgressOpen(true);
        result = await saveEmployeesBatch(employeesToSave);

      } else if (selectedTarget === 'locations') {
        const nameHeader = mappings['loc_field_01'];
        if (!nameHeader || nameHeader === '--skip--') {
          setImportError({ title: t('actions.error'), message: t('validation.required_mapping', { field: t('pages.settings.locations.dialog_form_label') }) });
          return;
        }
        const locationsToSave = fileData.map(row => row[nameHeader]!).filter(Boolean);
        setImportProgress({ current: 0, total: locationsToSave.length });
        setIsImportProgressOpen(true);
        result = await saveLocationsBatch(locationsToSave);

      } else {
        alert(t('pages.settings.data_import.import_started_message'));
        return;
      }

      if (result.success) {
        setImportProgress({ current: fileData.length, total: fileData.length });
        setTimeout(() => {
          setIsImportProgressOpen(false);
          setIsSuccessDialogOpen(true);
        }, 500);
      } else {
        setIsImportProgressOpen(false);
        const [message, detail] = result.message.split('^');
        const errorMessage = detail ? t(message, { id: detail }) : t(message);
        setImportError({ title: t('errors.import_error_title'), message: errorMessage });
      }
    });
  }

  const targetRedirects: Record<Target, string> = {
    employees: '/settings/employees',
    locations: '/settings/locations',
    projects: '/settings/projects',
    assets: '/inventory',
  };

  const [fieldSearchTerm, setFieldSearchTerm] = useState('');
  const [showOnlyUnmapped, setShowOnlyUnmapped] = useState(false);

  const getFieldGroups = () => {
    const allFields = targetSystemFields.map(field => ({
      ...field,
      isMapped: !!mappings[field.id] && mappings[field.id] !== '--skip--',
    }));

    const mappedFields = allFields.filter(field => field.isMapped);
    const unmappedFields = allFields.filter(field => !field.isMapped);

    return [
      { name: 'Mapped Fields', fields: mappedFields },
      { name: 'Unmapped Fields', fields: unmappedFields },
    ];
  };

  const getFilteredCsvHeaders = () => {
    const lowerCaseSearchTerm = fieldSearchTerm.toLowerCase();
    return fileHeaders.filter(header =>
      header.toLowerCase().includes(lowerCaseSearchTerm)
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('nav.data_import')}</CardTitle>
          <CardDescription>{t('pages.settings.data_import.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('pages.settings.data_import.step1_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {targets.map(target => (
                <Card
                  key={target.id}
                  className={cn(
                    "cursor-pointer hover:border-primary transition-colors",
                    selectedTarget === target.id && "border-primary ring-2 ring-primary"
                  )}
                  onClick={() => { setSelectedTarget(target.id as Target); resetFileState(); }}
                >
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <target.icon className="h-8 w-8 text-muted-foreground" />
                    <CardTitle className="text-lg">{target.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{target.desc}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {selectedTarget && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t('pages.settings.data_import.step2_title')}</h3>
              <Card className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CSV/TSV Uploader */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <FileText className="h-5 w-5" />
                      {t('pages.settings.data_import.upload_csv')}
                    </Label>
                    <div className="space-y-2">
                      <Label htmlFor="csv-encoding-select">{t('pages.inventory.mapping_dialog.encoding')}</Label>
                      <Select value={fileEncoding} onValueChange={setFileEncoding}>
                        <SelectTrigger id="csv-encoding-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTF-8">UTF-8</SelectItem>
                          <SelectItem value="Shift_JIS">Shift_JIS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => csvFileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('actions.select_file')}
                    </Button>
                  </div>

                  {/* Excel Uploader */}
                  <div className="space-y-4 rounded-lg border p-4">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <FileSpreadsheet className="h-5 w-5" />
                      {t('pages.settings.data_import.upload_excel')}
                    </Label>
                    <p className="text-sm text-muted-foreground pt-2 pb-2 h-10">
                      {t('pages.settings.data_import.excel_note')}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => excelFileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('actions.select_file')}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  {fileName ? `${t('pages.settings.data_import.selected_file')}: ${fileName}` : t('pages.inventory.mapping_dialog.no_file_chosen')}
                </div>

                {fileBuffer && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium">{t('pages.settings.data_import.import_options')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {fileType === 'excel' && (
                        <div className="space-y-2">
                          <Label htmlFor="sheet-select">{t('pages.settings.data_import.select_sheet')}</Label>
                          <Select value={selectedSheet} onValueChange={setSelectedSheet} disabled={excelSheets.length === 0}>
                            <SelectTrigger id="sheet-select"><SelectValue /></SelectTrigger>
                            <SelectContent>{excelSheets.map(sheet => (<SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="start-row">{t('pages.settings.data_import.start_row')}</Label>
                        <Input id="start-row" type="number" min="1" value={startRow} onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value, 10) || 1))} />
                      </div>
                      <div className="flex items-center pb-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="has-header" checked={hasHeader} onCheckedChange={(checked) => setHasHeader(checked as boolean)} />
                          <Label htmlFor="has-header" className="cursor-pointer">{t('pages.settings.data_import.use_header')}</Label>
                        </div>
                      </div>
                    </div>
                    {fileData.length > 0 && (
                      <p className="text-sm text-muted-foreground pt-1">{t('pages.inventory.import_dialog.records_loaded', { count: fileData.length })}</p>
                    )}
                  </div>
                )}

                {isParsing && <div className="flex items-center gap-2 mt-4 text-muted-foreground"><Loader className="h-4 w-4 animate-spin" />{t('pages.settings.data_import.parsing_file')}</div>}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('actions.error')}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </Card>
              <Input
                id="csv-file-upload"
                type="file"
                ref={csvFileInputRef}
                onChange={(e) => handleFileChange(e, 'csv')}
                accept=".tsv,.csv,text/tab-separated-values,text/csv"
                className="hidden"
              />
              <Input
                id="excel-file-upload"
                type="file"
                ref={excelFileInputRef}
                onChange={(e) => handleFileChange(e, 'excel')}
                accept=".xlsx"
                className="hidden"
              />
            </div>
          )}

          {selectedTarget && fileHeaders.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t('pages.settings.data_import.step3_title')}</h3>
                <Button variant="outline" onClick={handleAiMatch} disabled={isMappingAiLoading || isSubmitting}>
                  {isMappingAiLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {t('pages.settings.data_import.ai_match_button')}
                </Button>
              </div>

              {/* Search and filter for fields */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search fields to map..."
                    className="max-w-md"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      setFieldSearchTerm(searchTerm);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Show only unmapped:</Label>
                  <Checkbox
                    checked={showOnlyUnmapped}
                    onCheckedChange={(checked) => setShowOnlyUnmapped(checked as boolean)}
                  />
                </div>
              </div>

              <div className="border rounded-md max-h-[50vh] overflow-auto relative">
                {isMappingAiLoading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20 rounded-md">
                    <Loader className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Field Groups for better organization */}
                {getFieldGroups().map((group) => (
                  <div key={group.name} className="border-b last:border-b-0">
                    <div className="bg-muted/50 px-4 py-2 font-medium text-sm sticky top-0 z-10">
                      {group.name} ({group.fields.length} fields)
                    </div>
                    <Table>
                      <TableHeader className="sticky top-8 bg-background z-10">
                        <TableRow>
                          <TableHead className="font-semibold w-1/3">{t('pages.inventory.mapping_dialog.system_field')}</TableHead>
                          <TableHead className="font-semibold w-1/3">{t('pages.inventory.mapping_dialog.file_column')}</TableHead>
                          <TableHead className="font-semibold w-1/3">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.fields.map((field) => (
                          <TableRow key={field.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span>{field.displayName}</span>
                                {field.visible && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                    Visible
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                onValueChange={(value) => setMappings(prev => ({ ...prev, [field.id]: value }))}
                                value={mappings[field.id] || ""}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={t('pages.inventory.mapping_dialog.select_column_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="--skip--">{t('pages.inventory.mapping_dialog.skip_import')}</SelectItem>
                                  {/* Virtualized CSV headers - only show first 20 + search results */}
                                  {getFilteredCsvHeaders().slice(0, 20).map((header, index) => (
                                    <SelectItem key={`${header}-${index}`} value={header}>
                                      {header}
                                    </SelectItem>
                                  ))}
                                  {getFilteredCsvHeaders().length > 20 && (
                                    <SelectItem value="--more--" disabled>
                                      ... and {getFilteredCsvHeaders().length - 20} more columns
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={field.notes || undefined}>
                              {field.notes || ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleImport} disabled={isSubmitting || isMappingAiLoading}>
                  {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  {isSubmitting ? t('actions.importing') : t('pages.settings.data_import.import_button')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isImportProgressOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.inventory.import_progress.title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('pages.inventory.import_progress.description')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader className="h-10 w-10 animate-spin text-primary" />
            <div className="w-full text-center">
              <p className="text-lg font-semibold mb-2">
                {t('actions.importing_progress', { current: importProgress.current, total: importProgress.total })}
              </p>
              <Progress value={(importProgress.total > 0 ? (importProgress.current / importProgress.total) : 0) * 100} className="w-full" />
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!importError} onOpenChange={() => setImportError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive" />
              {importError?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{importError?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setImportError(null)}>{t('actions.close')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pages.settings.data_import.import_success_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('pages.settings.data_import.import_success_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsSuccessDialogOpen(false)}>{t('actions.close')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (selectedTarget) {
                router.push(targetRedirects[selectedTarget]);
              }
              setIsSuccessDialogOpen(false);
            }}>
              {t('pages.settings.data_import.view_imported_data')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
