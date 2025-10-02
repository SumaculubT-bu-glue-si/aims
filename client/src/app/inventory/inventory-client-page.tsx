"use client"

import React, { useState, useEffect, useMemo, useTransition, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

import { getPcsFromGraphQL, getMonitorsFromGraphQL, getPhonesFromGraphQL, getOthersFromGraphQL, getAllAssetsFromGraphQL, getMasterDataFromGraphQL, bulkUpsertPcsToGraphQL, bulkUpsertMonitorsToGraphQL, bulkUpsertPhonesToGraphQL, bulkUpsertOthersToGraphQL, bulkUpsertMixedAssetsToGraphQL, deletePcFromGraphQL, deleteMonitorFromGraphQL, deletePhoneFromGraphQL } from "./graphql-actions"
import { pcSchema, type PcFormValues, type PcAsset } from "@/lib/schemas/inventory"
import { type AssetField } from "@/lib/schemas/settings"
import { fieldIdToSchemaKeyMap } from "@/lib/data"

// Helper to convert camelCase keys to snake_case for server sort fields
function toSnakeCase(key: string): string {
  return key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
}
import { useToast } from "@/hooks/use-toast"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilePlus2, Laptop, Monitor, Smartphone, KeyRound, Cloud, Download, SlidersHorizontal, ArrowUp, ArrowDown, Upload, Loader, AlertTriangle, Sparkles, Trash2, ChevronDown, Search, X, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/hooks/use-i18n"
import { Textarea } from "@/components/ui/textarea"
import { CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { mapAssetFieldsFromCsv, type MapAssetFieldsOutput } from "@/ai/flows/map-asset-fields-flow"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { buttonVariants } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { type Employee, type Project, type Location } from '@/lib/schemas/inventory';

type InventoryClientPageProps = {
  initialPcs: PcAsset[];
  initialLocations: { id: string; name: string; }[];
  initialEmployees: { id: string; name: string; }[];
  initialProjects: { id: string; name: string; }[];
  initialLocalInventory: any;
  initialSystemFields: AssetField[];
  initialError: string | null;
};

const allStatuses = ['返却済', '廃止', '保管(使用無)', '利用中', '保管中', '貸出中', '故障中', '利用予約'];

const emptyFormValues: PcFormValues = {
  id: "", type: "", hostname: "", manufacturer: "", model: "", partNumber: "", serialNumber: "",
  formFactor: "", os: "", osBit: "", officeSuite: "", softwareLicenseKey: "",
  wiredMacAddress: "", wiredIpAddress: "", wirelessMacAddress: "", wirelessIpAddress: "",
  purchaseDate: "", purchasePrice: "", depreciationYears: "", depreciationDept: "",
  cpu: "", memory: "", location: "", status: "保管中", previousUser: "",
  userId: "", usageStartDate: "", usageEndDate: "", carryInOutAgreement: "",
  lastUpdated: "", updatedBy: "", notes: "", notes1: "", notes2: "",
  notes3: "", notes4: "", notes5: "",
};

export default function InventoryClientPage({
  initialPcs,
  initialLocations,
  initialEmployees,
  initialProjects,
  initialLocalInventory,
  initialSystemFields,
  initialError,
}: InventoryClientPageProps) {
  const router = useRouter();
  const { t } = useI18n();


  // State for GraphQL data
  const [isLoadingGraphQL, setIsLoadingGraphQL] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const requestSeqRef = useRef({ pcs: 0, monitors: 0, smartphones: 0, others: 0 });
  const [pageCache, setPageCache] = useState<{
    pcs: Record<number, PcAsset[]>;
    monitors: Record<number, any[]>;
    smartphones: Record<number, any[]>;
    others: Record<number, any[]>;
  }>({ pcs: {}, monitors: {}, smartphones: {}, others: {} });
  const [graphQLError, setGraphQLError] = useState<string | null>(null);

  const [inventory, setInventory] = useState<{
    pcs: PcAsset[];
    monitors: any[];
    smartphones: any[];
    software: any[];
    cloud: any[];
    others: any[];
  }>({
    pcs: [],
    monitors: [],
    smartphones: [],
    software: [],
    cloud: [],
    others: [],
  });

  const [masterDataState, setMasterDataState] = useState({
    locations: initialLocations || [],
    projects: initialProjects || [],
    employees: initialEmployees || [],
  });


  const [systemFields, setSystemFields] = useState<AssetField[]>(initialSystemFields || []);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPc, setSelectedPc] = useState<PcAsset | null>(null)
  const [selectedMonitor, setSelectedMonitor] = useState<any | null>(null)
  const [selectedSmartphone, setSelectedSmartphone] = useState<any | null>(null)
  const [selectedOther, setSelectedOther] = useState<any | null>(null)
  const [allOthersAssets, setAllOthersAssets] = useState<any[]>([]) // Store ALL others assets for client-side pagination
  const [allPcsAssets, setAllPcsAssets] = useState<any[]>([]) // Store ALL PC assets
  const [allMonitorsAssets, setAllMonitorsAssets] = useState<any[]>([]) // Store ALL monitor assets
  const [allSmartphonesAssets, setAllSmartphonesAssets] = useState<any[]>([]) // Store ALL smartphone assets
  const [filters, setFilters] = useState<{
    locations: string[];
    statuses: string[];
    employee: string;
    global: string;
  }>({
    locations: [],
    statuses: [],
    employee: "",
    global: ""
  })


  const inputValuesRef = useRef({ employee: "", global: "" });
  const globalInputRef = useRef<HTMLInputElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);
  const [inputValues, setInputValues] = useState({ employee: "", global: "" })
  const [sortConfig, setSortConfig] = useState<{ key: keyof PcAsset; direction: 'asc' | 'desc' } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast()

  // Pagination state for each tab
  const [pagination, setPagination] = useState({
    pcs: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    monitors: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    smartphones: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    others: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState("pcs");

  // Helper functions for pagination
  const updatePagination = (tab: keyof typeof pagination, updates: Partial<typeof pagination.pcs>) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates }
    }));
  };

  const resetPagination = (tab: keyof typeof pagination) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], currentPage: 1 }
    }));
  };

  // Function to fetch PCs with server-side pagination
  const fetchPcsWithPagination = async (page: number = 1) => {
    try {
      const seq = ++requestSeqRef.current.pcs;
      const { pcs, pagination: pageInfo } = await getPcsFromGraphQL(page, 100, {
        locations: filters.locations,
        statuses: filters.statuses,
        employee: filters.employee,
        global: filters.global,
        details: detailedFilters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      if (seq !== requestSeqRef.current.pcs) return; // stale

      // cache page
      setPageCache(prev => ({ ...prev, pcs: { ...prev.pcs, [page]: pcs } }));

      setInventory(prev => ({
        ...prev,
        pcs
      }));

      updatePagination('pcs', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error handling PCs pagination:', error);
    }
  };

  // Function to fetch Monitors with server-side pagination
  const fetchMonitorsWithPagination = async (page: number = 1) => {
    try {
      const seq = ++requestSeqRef.current.monitors;
      const { monitors, pagination: pageInfo } = await getMonitorsFromGraphQL(page, 100, {
        locations: filters.locations,
        statuses: filters.statuses,
        employee: filters.employee,
        global: filters.global,
        details: detailedFilters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      if (seq !== requestSeqRef.current.monitors) return; // stale

      setPageCache(prev => ({ ...prev, monitors: { ...prev.monitors, [page]: monitors } }));

      setInventory(prev => ({
        ...prev,
        monitors
      }));

      updatePagination('monitors', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error handling Monitors pagination:', error);
    }
  };

  // Function to fetch Smartphones with server-side pagination
  const fetchSmartphonesWithPagination = async (page: number = 1) => {
    try {
      const seq = ++requestSeqRef.current.smartphones;
      const { phones, pagination: pageInfo } = await getPhonesFromGraphQL(page, 100, {
        locations: filters.locations,
        statuses: filters.statuses,
        employee: filters.employee,
        global: filters.global,
        details: detailedFilters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      if (seq !== requestSeqRef.current.smartphones) return; // stale

      setPageCache(prev => ({ ...prev, smartphones: { ...prev.smartphones, [page]: phones } }));

      setInventory(prev => ({
        ...prev,
        smartphones: phones
      }));

      updatePagination('smartphones', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error handling Smartphones pagination:', error);
    }
  };

  // Function to handle Others pagination (now server-side)
  const fetchOthersWithPagination = async (page: number = 1) => {
    try {
      const seq = ++requestSeqRef.current.others;
      const { others, pagination: pageInfo } = await getOthersFromGraphQL(page, 100, {
        locations: filters.locations,
        statuses: filters.statuses,
        employee: filters.employee,
        global: filters.global,
        details: detailedFilters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      if (seq !== requestSeqRef.current.others) return; // stale

      // cache page
      setPageCache(prev => ({ ...prev, others: { ...prev.others, [page]: others } }));

      setInventory(prev => ({
        ...prev,
        others
      }));

      updatePagination('others', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error handling Others pagination:', error);
    }
  };

  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isMappingAiLoading, setIsMappingAiLoading] = useState(false);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<Record<string, string | null>>({});
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [fileEncoding, setFileEncoding] = useState('UTF-8');
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isDetailedSearchOpen, setIsDetailedSearchOpen] = useState(false);
  const [detailedFilters, setDetailedFilters] = useState<Partial<PcFormValues>>({});

  // Function to handle page changes for each tab
  const handlePageChange = async (tab: keyof typeof pagination, page: number) => {
    updatePagination(tab, { currentPage: page });
    setIsLoadingGraphQL(true);

    try {
      // Use cache if available to render instantly
      if (tab === 'pcs' && pageCache.pcs[page]) {
        setInventory(prev => ({ ...prev, pcs: pageCache.pcs[page] }));
        return;
      }
      if (tab === 'monitors' && pageCache.monitors[page]) {
        setInventory(prev => ({ ...prev, monitors: pageCache.monitors[page] }));
        return;
      }
      if (tab === 'smartphones' && pageCache.smartphones[page]) {
        setInventory(prev => ({ ...prev, smartphones: pageCache.smartphones[page] }));
        return;
      }
      if (tab === 'others' && pageCache.others[page]) {
        setInventory(prev => ({ ...prev, others: pageCache.others[page] }));
        return;
      }

      switch (tab) {
        case 'pcs':
          await fetchPcsWithPagination(page);
          break;
        case 'monitors':
          await fetchMonitorsWithPagination(page);
          break;
        case 'smartphones':
          await fetchSmartphonesWithPagination(page);
          break;
        case 'others':
          await fetchOthersWithPagination(page);
          break;
      }
    } catch (error) {
      console.error(`Error changing page for ${tab}:`, error);
    } finally {
      setIsLoadingGraphQL(false);
    }
  };

  // Track if initial load is complete to prevent unnecessary refetches
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // When filters change, reset to page 1 and refetch ONLY the active tab
  useEffect(() => {
    // Skip refetch on initial load - let fetchDataFromGraphQL handle it
    if (!isInitialLoadComplete) return;

    const resetAndRefetchActive = async () => {
      const tab = activeTab as keyof typeof pagination;
      updatePagination(tab, { currentPage: 1 });
      setIsLoadingGraphQL(true);
      try {
        if (tab === 'pcs') await fetchPcsWithPagination(1);
        else if (tab === 'monitors') await fetchMonitorsWithPagination(1);
        else if (tab === 'smartphones') await fetchSmartphonesWithPagination(1);
        else if (tab === 'others') await fetchOthersWithPagination(1);
      } catch (e) {
        console.error('Error refetching after filters change:', e);
      } finally {
        setIsLoadingGraphQL(false);
      }
    };
    resetAndRefetchActive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.locations, filters.statuses, filters.employee, filters.global, JSON.stringify(detailedFilters), isInitialLoadComplete]);



  // Function to fetch data from GraphQL
  const fetchDataFromGraphQL = async () => {
    setIsLoadingGraphQL(true);
    setGraphQLError(null);

    try {

      // Fetch first page via fetchers to populate cache and state; fetch Others + master data in parallel
      await Promise.all([
        fetchPcsWithPagination(1),
        fetchMonitorsWithPagination(1),
        fetchSmartphonesWithPagination(1),
        fetchOthersWithPagination(1),
      ]);
      const [masterDataResult] = await Promise.all([
        getMasterDataFromGraphQL()
      ]);


      // Store ALL assets as empty for server-side pagination
      setAllPcsAssets([]);
      setAllMonitorsAssets([]);
      setAllSmartphonesAssets([]);
      setAllOthersAssets([]);

      // Set current page data from server for all paginated tabs
      setInventory(prev => ({
        ...prev,
        // DO NOT set any inventory data here to avoid stale overwrite; sequenced fetchers will set them
      }));

      // Pagination for all tabs already set by fetchers

      // Update master data state
      if (masterDataResult.masterData) {
        const masterData = masterDataResult.masterData;


        // Deduplicate locations, employees, and projects by name, keeping the first occurrence
        const deduplicatedLocations = masterData.locations?.filter((location, index, self) =>
          index === self.findIndex(l => l.name === location.name)
        ) || [];

        const deduplicatedEmployees = masterData.employees?.filter((employee, index, self) =>
          index === self.findIndex(e => e.name === employee.name)
        ) || [];

        const deduplicatedProjects = masterData.projects?.filter((project, index, self) =>
          index === self.findIndex(p => p.name === project.name)
        ) || [];


        setMasterDataState(prev => ({
          ...prev,
          locations: deduplicatedLocations,
          projects: deduplicatedProjects,
          employees: deduplicatedEmployees,
        }));

      }

      // Check for errors
      const errors = [
        masterDataResult.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('GraphQL errors found:', errors);
        setGraphQLError(errors.join('; '));
        toast({
          title: t('actions.error'),
          description: t('errors.graphql_fetch_failed'),
          variant: 'destructive'
        });
      } else {
        // Removed automatic success toast on page load to prevent duplicate messages
        // Success toasts are still shown for user-initiated actions like saving assets
      }
    } catch (error: any) {
      console.error('Error fetching data from GraphQL:', error);
      setGraphQLError(error.message || 'Failed to fetch data');
      toast({
        title: t('actions.error'),
        description: t('errors.graphql_fetch_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoadingGraphQL(false);
      setIsInitialLoadComplete(true); // Mark initial load as complete
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataFromGraphQL();
  }, []);

  // Memoize display names to avoid expensive lookups on every render
  const displayNames = useMemo(() => {
    const names: Record<keyof PcFormValues, string> = {} as any;
    if (systemFields) {
      Object.keys(pcSchema.shape).forEach(key => {
        const fieldKey = key as keyof PcFormValues;
        const field = systemFields.find(f => f.systemName === fieldKey);
        names[fieldKey] = field ? t(`labels.${fieldKey}`, { defaultValue: field.displayName }) : fieldKey;
      });
    }
    return names;
  }, [systemFields, t]);

  const getDisplayName = (key: keyof PcFormValues): string => {
    return displayNames[key] || key;
  };

  // Memoize dropdown options to prevent recreation on every render
  const employeeOptions = useMemo(() =>
    masterDataState.employees.map((employee) => (
      <SelectItem key={employee.id} value={employee.id.toString()}>
        {employee.name}
      </SelectItem>
    )), [masterDataState.employees]
  );

  const locationOptions = useMemo(() =>
    masterDataState.locations.map((location) => (
      <SelectItem key={location.id} value={location.name}>
        {location.name}
      </SelectItem>
    )), [masterDataState.locations]
  );

  // Memoized form field components to prevent unnecessary re-renders
  const MemoizedTextField = React.memo<{ name: keyof PcFormValues; label: string; type?: string }>(
    ({ name, label, type = "text" }) => (
      <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    )
  );

  const MemoizedTextArea = React.memo<{ name: keyof PcFormValues; label: string }>(
    ({ name, label }) => (
      <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
    )
  );

  const MemoizedSelectField = React.memo<{ name: keyof PcFormValues; label: string; options: React.ReactNode; placeholder?: string }>(
    ({ name, label, options, placeholder }) => (
      <FormField control={form.control} name={name} render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value ?? ""}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>{options}</SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
    )
  );

  const detailedSearchForm = useForm<PcFormValues>({
    defaultValues: {},
  });

  const [errorDialogState, setErrorDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string | React.ReactNode;
  }>({ isOpen: false, title: '', description: '' });


  const visibleColumns = useMemo(() => {
    if (!systemFields) return [];
    const visibleSystemFields = systemFields.filter(field => field.visible);

    // Sort by order, but move location, user, status to the front after 'id'
    const specialOrder: (keyof PcAsset)[] = ['location', 'userId', 'status'];

    return visibleSystemFields.sort((a, b) => {
      const aKey = fieldIdToSchemaKeyMap[a.id as keyof typeof fieldIdToSchemaKeyMap];
      const bKey = fieldIdToSchemaKeyMap[b.id as keyof typeof fieldIdToSchemaKeyMap];

      if (a.systemName === 'id') return -1;
      if (b.systemName === 'id') return 1;

      const aIsSpecial = aKey ? specialOrder.includes(aKey as any) : false;
      const bIsSpecial = bKey ? specialOrder.includes(bKey as any) : false;

      if (aIsSpecial && !bIsSpecial) return -1;
      if (!aIsSpecial && bIsSpecial) return 1;
      if (aIsSpecial && bIsSpecial) {
        return specialOrder.indexOf(aKey! as any) - specialOrder.indexOf(bKey! as any);
      }

      return a.order - b.order;
    });
  }, [systemFields]);

  const showErrorDialog = (title: string, description: string | React.ReactNode) => {
    setErrorDialogState({ isOpen: true, title, description });
  };

  const robustCsvParser = (csvText: string): { headers: string[], data: Record<string, string>[] } => {
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
  }

  const processFileContent = (buffer: ArrayBuffer, encoding: string) => {
    try {
      const decoder = new TextDecoder(encoding, { fatal: true });
      const text = decoder.decode(buffer);

      if (!text) {
        showErrorDialog(t('actions.error'), t('errors.file_empty'));
        return;
      }

      const { headers, data } = robustCsvParser(text);

      if (headers.length === 0 || data.length === 0) {
        showErrorDialog(t('actions.error'), t('errors.file_no_header_or_data'));
        return;
      }

      setFileHeaders(headers);
      setFileData(data);

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

      setMappings(initialMappings);
      setIsMappingAiLoading(false);
    } catch (e: any) {
      showErrorDialog(t('errors.encoding_error_title'), t('errors.encoding_error_message'));
      throw e;
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName('');
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        showErrorDialog(t('actions.error'), t('errors.file_empty'));
        return;
      }
      setFileBuffer(buffer);
      try {
        processFileContent(buffer, fileEncoding);
      } catch (error) {
        // Keep the import dialog open on failure
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = () => {
    if (fileData.length === 0) {
      showErrorDialog(t('actions.error'), t('errors.no_data_to_import'));
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
      showErrorDialog(
        t('pages.inventory.mapping_dialog.validation_error_title'),
        <>{t('pages.inventory.mapping_dialog.validation_error_desc')}{unmappedRequiredFields.join(', ')}</>
      );
      return;
    }

    const statusJpToEn: { [key: string]: string } = {
      '返却済': 'Returned',
      '廃止': 'Abolished',
      '保管(使用無)': 'Stored - Not in Use',
      '利用中': 'In Use',
      '保管中': 'In Storage',
      '貸出中': 'On Loan',
      '故障中': 'Broken',
      '利用予約': 'Reserved for Use',
    };
    // Process all rows as mixed assets
    const newAssets: any[] = fileData.map(row => {
      const assetObject: any = {};
      Object.entries(mappings).forEach(([fieldId, fileHeader]) => {
        if (fileHeader && fileHeader !== '--skip--' && row[fileHeader] !== undefined) {
          const schemaKey = fieldIdToSchemaKeyMap[fieldId as keyof typeof fieldIdToSchemaKeyMap];
          if (schemaKey) {
            let value = row[fileHeader];
            assetObject[schemaKey] = value;
          }
        }
      });
      return assetObject;
    });

    setPcsToImport(newAssets);
    setIsImporting(true);
    setIsImportDialogOpen(false);
    setImportProgress({ current: 0, total: newAssets.length });
    setIsImportProgressDialogOpen(true);
  }

  useEffect(() => {
    if (!isImporting || pcsToImport.length === 0) return;

    const doImport = async () => {
      const totalToImport = pcsToImport.length;
      setImportProgress({ current: 0, total: totalToImport });
      setIsImportProgressDialogOpen(true); // Ensure dialog is open 

      // Validate IDs first
      for (let i = 0; i < pcsToImport.length; i++) {
        const { id } = pcsToImport[i];
        if (!id || id.trim() === '') {
          showErrorDialog(
            t('errors.import_error_title', { row: i + 2 }),
            t('errors.id_required_error')
          );
          setIsImportProgressDialogOpen(false);
          setImportProgress({ current: 0, total: 0 });
          setIsImporting(false);
          return;
        }
      }

      // Perform a single bulk GraphQL upsert
      const result = await bulkUpsertMixedAssetsToGraphQL(pcsToImport);
      if (!result.success) {
        showErrorDialog(t('actions.error'), result.error || t('errors.graphql_import_failed'));
        setIsImportProgressDialogOpen(false);
        setImportProgress({ current: 0, total: 0 });
        setIsImporting(false);
        return;
      }

      // Store the import summary
      setImportSummary(result.summary);

      // Mark progress as complete
      setImportProgress({ current: totalToImport, total: totalToImport });

      // Show success toast with summary
      toast({
        title: t('actions.success'),
        description: t('actions.import_success_summary', {
          pcs: result.summary.pcs,
          monitors: result.summary.monitors,
          phones: result.summary.phones,
          others: result.summary.others
        }),
      });

      // Refresh data from GraphQL to reflect imported assets
      await fetchDataFromGraphQL();

      setFileHeaders([]);
      setFileData([]);
      setFileBuffer(null);
      setMappings({});
      setFileName('');
      setPcsToImport([]);
      setImportSummary(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsImportProgressDialogOpen(false);
      setIsImporting(false);
    };

    startTransition(() => {
      doImport();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImporting, pcsToImport]);


  const handleAiMatch = async () => {
    if (!fileHeaders.length) return;
    setIsMappingAiLoading(true);
    try {
      const availableFields = systemFields
        .filter(field => field.visible && fieldIdToSchemaKeyMap[field.id])
        .map(field => ({ id: field.id, name: field.displayName }));

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
      toast({
        title: t('pages.inventory.mapping_dialog.ai_toast_title'),
        description: t('pages.inventory.mapping_dialog.ai_toast_desc'),
      });
    } catch (error) {
      console.error("AI matching failed", error);
      showErrorDialog(t('actions.error'), t('errors.ai_matching_failed'));
    } finally {
      setIsMappingAiLoading(false);
    }
  }


  const handleMappingChange = (fieldId: string, fileHeader: string) => {
    setMappings(prev => ({ ...prev, [fieldId]: fileHeader }));
  }

  const form = useForm<PcFormValues>({
    resolver: zodResolver(pcSchema),
    defaultValues: emptyFormValues,
    mode: 'onBlur' // Only validate on blur instead of every keystroke
  });

  // Watch the asset type to conditionally show/hide form sections
  const assetType = form.watch('type');

  useEffect(() => {
    const currentAsset = getCurrentAsset();

    let valuesToSet: any = emptyFormValues;

    if (currentAsset) {
      valuesToSet = { ...currentAsset.asset };
      // Set the type field based on the current asset type
      valuesToSet.type = currentAsset.type;
    }

    // Ensure all keys from PcFormValues are present and are strings
    const sanitizedValues: PcFormValues = Object.keys(pcSchema.shape).reduce((acc, key) => {
      const formKey = key as keyof PcFormValues;
      acc[formKey] = (valuesToSet as any)[formKey] ?? "";
      return acc;
    }, {} as PcFormValues);

    form.reset(sanitizedValues);
  }, [selectedPc, selectedMonitor, selectedSmartphone, selectedOther, form]);

  // Initialize input values with current filters
  useEffect(() => {
    setInputValues({
      employee: filters.employee,
      global: filters.global
    });
    inputValuesRef.current = {
      employee: filters.employee,
      global: filters.global
    };
  }, []); // Only run once on mount

  function onSubmit(values: PcFormValues) {
    startTransition(async () => {
      try {
        // Prepare asset data for submission
        const assetData = { ...values };

        // If we're editing an existing asset, use its ID
        const currentAsset = getCurrentAsset();
        if (currentAsset) {
          assetData.id = currentAsset.asset.id;
        } else {
          // Generate a unique ID for new assets if not provided
          if (!assetData.id || assetData.id.trim() === '') {
            assetData.id = crypto.randomUUID();
          } else {
          }
        }

        // Determine asset type and route to appropriate GraphQL function
        const assetType = assetData.type?.toLowerCase();
        let result;

        if (assetType === 'pc') {
          result = await bulkUpsertPcsToGraphQL([assetData]);
        } else if (assetType === 'monitor') {
          result = await bulkUpsertMonitorsToGraphQL([assetData]);
        } else if (assetType === 'smartphones') {
          result = await bulkUpsertPhonesToGraphQL([assetData]);
        } else {
          // For 'others' or any unrecognized type, use the others function
          result = await bulkUpsertOthersToGraphQL([assetData]);
        }

        if (result.success) {
          toast({
            title: t('actions.success'),
            description: t('actions.inventory.save_success'),
          });
          setIsFormOpen(false);
          setSelectedPc(null);
          setSelectedMonitor(null);
          setSelectedSmartphone(null);
          setSelectedOther(null);
          // Add a small delay to ensure server has committed the transaction
          await new Promise(resolve => setTimeout(resolve, 500));
          // Refresh the inventory data
          await fetchDataFromGraphQL();
        } else {
          console.error('Failed to save asset:', result.error);
          showErrorDialog(t('actions.error'), result.error || 'Failed to save asset');
        }
      } catch (error) {
        console.error('Error saving asset:', error);
        showErrorDialog(t('actions.error'), 'An unexpected error occurred while saving the asset');
      }
    });
  }

  function onDetailedSearchSubmit(values: PcFormValues) {
    setDetailedFilters(values);
    setIsDetailedSearchOpen(false);
  }

  function handleClearDetailedSearch() {
    detailedSearchForm.reset({});
  }

  const handleDelete = () => {
    if (!selectedPc) return;
    startTransition(async () => {
      try {
        // Determine asset type and route to appropriate delete function
        const assetType = selectedPc.type?.toLowerCase();
        let result;

        if (assetType === 'pc') {
          result = await deletePcFromGraphQL(selectedPc.id);
        } else if (assetType === 'monitor') {
          result = await deleteMonitorFromGraphQL(selectedPc.id);
        } else if (assetType === 'smartphones') {
          result = await deletePhoneFromGraphQL(selectedPc.id);
        } else {
          // For 'others' or any unrecognized type, try to delete as PC for now
          // TODO: Implement deleteOthersFromGraphQL if needed
          result = await deletePcFromGraphQL(selectedPc.id);
        }

        if (result.success) {
          toast({
            title: t('actions.success'),
            description: t('actions.inventory.delete_success'),
          });
          setIsDeleteDialogOpen(false);
          setIsFormOpen(false);
          setSelectedPc(null);
          // Refresh the inventory data
          await fetchDataFromGraphQL();
        } else {
          setIsDeleteDialogOpen(false);
          showErrorDialog(t('actions.error'), result.error || 'Failed to delete asset');
        }
      } catch (error) {
        console.error('Error deleting asset:', error);
        setIsDeleteDialogOpen(false);
        showErrorDialog(t('actions.error'), 'An unexpected error occurred while deleting the asset');
      }
    });
  };

  const handleAddNew = () => {
    setSelectedPc(null);
    setSelectedMonitor(null);
    setSelectedSmartphone(null);
    setSelectedOther(null);
    setIsFormOpen(true);
  }

  const handleEdit = (asset: any) => {
    setSelectedPc(asset);
    setIsFormOpen(true);
  }

  const handleEditMonitor = (asset: any) => {
    setSelectedMonitor(asset);
    setIsFormOpen(true);
  }

  const handleEditSmartphone = (asset: any) => {
    setSelectedSmartphone(asset);
    setIsFormOpen(true);
  }

  const handleEditOther = (asset: any) => {
    setSelectedOther(asset);
    setIsFormOpen(true);
  }

  // Helper function to get the currently selected asset and its type
  const getCurrentAsset = () => {
    if (selectedPc) return { asset: selectedPc, type: 'pc' };
    if (selectedMonitor) return { asset: selectedMonitor, type: 'monitor' };
    if (selectedSmartphone) return { asset: selectedSmartphone, type: 'smartphone' };
    if (selectedOther) return { asset: selectedOther, type: 'other' };
    return null;
  }

  // Helper function to get asset type display name
  const getAssetTypeDisplayName = (type: string) => {
    switch (type) {
      case 'pc': return t('pages.inventory.tabs.pcs');
      case 'monitor': return t('pages.inventory.tabs.monitors');
      case 'smartphone': return t('pages.inventory.tabs.smartphones');
      case 'other': return t('pages.inventory.tabs.others');
      default: return type;
    }
  }

  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedPc(null);
      setSelectedMonitor(null);
      setSelectedSmartphone(null);
      setSelectedOther(null);
    }
  }

  const handleImportDialogChange = (open: boolean) => {
    setIsImportDialogOpen(open);
    if (!open) {
      setFileHeaders([]);
      setFileData([]);
      setFileBuffer(null);
      setMappings({});
      setFileName('');
      setImportProgress({ current: 0, total: 0 });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Update ref immediately without triggering re-render
    inputValuesRef.current[name as keyof typeof inputValuesRef.current] = value;
    // DO NOT update state - this prevents re-renders during typing
  }

  const handleSearch = () => {
    // Read current values from the ref (which gets updated during typing)
    const currentEmployee = inputValuesRef.current.employee;
    const currentGlobal = inputValuesRef.current.global;

    // Update display state only when search is performed
    setInputValues({
      employee: currentEmployee,
      global: currentGlobal
    });

    setFilters(prev => ({
      ...prev,
      employee: currentEmployee,
      global: currentGlobal
    }))
  }

  const handleClearSearch = () => {
    setInputValues({ employee: "", global: "" })
    inputValuesRef.current = { employee: "", global: "" }
    setFilters(prev => ({
      ...prev,
      employee: "",
      global: ""
    }))

    // Clear the actual input fields
    if (globalInputRef.current) {
      globalInputRef.current.value = "";
    }
    if (employeeInputRef.current) {
      employeeInputRef.current.value = "";
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const getStatusBadgeVariant = (status: string) => {
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
  }

  // Mapping of Japanese status values to their translations
  const statusMapping: Record<string, string> = {
    '返却済': t('labels.statuses.returned'),
    '廃止': t('labels.statuses.abolished'),
    '保管(使用無)': t('labels.statuses.stored_not_in_use'),
    '利用中': t('labels.statuses.in_use'),
    '保管中': t('labels.statuses.in_storage'),
    '貸出中': t('labels.statuses.on_loan'),
    '故障中': t('labels.statuses.broken'),
    '利用予約': t('labels.statuses.reserved_for_use')
  };

  const getStatusText = (status: string) => {
    return statusMapping[status] || status;
  }

  const handleSort = (key: keyof PcAsset) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    // Refetch current page with new sort so server-side pagination reflects sort order
    const currentTab = activeTab as keyof typeof pagination;
    const currentPage = pagination[currentTab].currentPage;
    if (currentTab === 'pcs') {
      fetchPcsWithPagination(currentPage);
    } else if (currentTab === 'monitors') {
      fetchMonitorsWithPagination(currentPage);
    } else if (currentTab === 'smartphones') {
      fetchSmartphonesWithPagination(currentPage);
    }
  };

  const getSortIcon = (key: keyof PcAsset) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  // Create a unified assets array for proper filtering
  const allAssets = useMemo(() => {
    const assets = [
      ...inventory.pcs.map(pc => ({ ...pc, _source: 'pcs' })),
      ...inventory.monitors.map(monitor => ({ ...monitor, _source: 'monitors' })),
      ...inventory.smartphones.map(phone => ({ ...phone, _source: 'smartphones' })),
      ...inventory.others.map(other => ({ ...other, _source: 'others' }))
    ];
    return assets;
  }, [inventory.pcs, inventory.monitors, inventory.smartphones, inventory.others]);

  // Filter assets by type per tab.
  // For PCs/Monitors/Smartphones, if server-side is used (all* empty), base on current page data to preserve UI filters without overriding server totals.
  const filteredPcs = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.pcs
    // Only use allPcsAssets for client-side pagination (Others tab)
    const base = inventory.pcs;

    // Debug logging

    // If using server-side pagination (no client full dataset), trust server filters and skip client filtering
    if (allPcsAssets.length === 0) {
      return base;
    }
    const filtered = base.filter(asset => {
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(asset.location || '');
      const matchesEmployee = !filters.employee || (asset.userId || "").toLowerCase().includes(filters.employee.toLowerCase());

      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(asset.status || '');
      if (!matchesLocation || !matchesEmployee || !matchesStatus) {
        return false;
      }

      const matchesGlobal = !filters.global || visibleColumns.some(field => {
        const schemaKey = fieldIdToSchemaKeyMap[field.id as keyof typeof fieldIdToSchemaKeyMap];
        if (!schemaKey) return false;
        const value = asset[schemaKey as keyof PcAsset];
        return value != null && String(value).toLowerCase().includes(filters.global.toLowerCase());
      });
      if (!matchesGlobal) {
        return false;
      }

      const matchesDetailed = Object.entries(detailedFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        const assetValue = asset[key as keyof PcAsset];
        return assetValue != null && String(assetValue).toLowerCase().includes(String(value).toLowerCase());
      });
      if (!matchesDetailed) {
        return false;
      }

      return true;
    });
    return filtered;
  }, [inventory.pcs, allPcsAssets, filters, visibleColumns, detailedFilters]);

  const sortedPcs = useMemo(() => {
    if (sortConfig !== null) {
      const sortedItems = [...filteredPcs].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'id' && typeof aValue === 'string' && typeof bValue === 'string') {
          const naturalSort = (valA: string, valB: string) => {
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          };
          const comparison = naturalSort(aValue, bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedItems;
    }
    return filteredPcs;
  }, [filteredPcs, sortConfig]);

  const filteredMonitors = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.monitors
    const base = inventory.monitors;
    if (allMonitorsAssets.length === 0) {
      return base;
    }
    return base.filter(asset => {
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(asset.location || '');
      const matchesEmployee = !filters.employee || (asset.userId || "").toLowerCase().includes(filters.employee.toLowerCase());

      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(asset.status || '');
      if (!matchesLocation || !matchesEmployee || !matchesStatus) {
        return false;
      }

      const matchesGlobal = !filters.global || visibleColumns.some(field => {
        const schemaKey = fieldIdToSchemaKeyMap[field.id as keyof typeof fieldIdToSchemaKeyMap];
        if (!schemaKey) return false;
        const value = asset[schemaKey as keyof PcAsset];
        return value != null && String(value).toLowerCase().includes(filters.global.toLowerCase());
      });
      if (!matchesGlobal) {
        return false;
      }

      const matchesDetailed = Object.entries(detailedFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        const assetValue = asset[key as keyof PcAsset];
        return assetValue != null && String(assetValue).toLowerCase().includes(String(value).toLowerCase());
      });
      if (!matchesDetailed) {
        return false;
      }

      return true;
    });
  }, [inventory.monitors, allMonitorsAssets, filters, visibleColumns, detailedFilters]);

  const filteredSmartphones = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.smartphones
    const base = inventory.smartphones;
    if (allSmartphonesAssets.length === 0) {
      return base;
    }
    return base.filter(asset => {
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(asset.location || '');
      const matchesEmployee = !filters.employee || (asset.userId || "").toLowerCase().includes(filters.employee.toLowerCase());

      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(asset.status || '');
      if (!matchesLocation || !matchesEmployee || !matchesStatus) {
        return false;
      }

      const matchesGlobal = !filters.global || visibleColumns.some(field => {
        const schemaKey = fieldIdToSchemaKeyMap[field.id as keyof typeof fieldIdToSchemaKeyMap];
        if (!schemaKey) return false;
        const value = asset[schemaKey as keyof PcAsset];
        return value != null && String(value).toLowerCase().includes(filters.global.toLowerCase());
      });
      if (!matchesGlobal) {
        return false;
      }

      const matchesDetailed = Object.entries(detailedFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        const assetValue = asset[key as keyof PcAsset];
        return assetValue != null && String(assetValue).toLowerCase().includes(String(value).toLowerCase());
      });
      if (!matchesDetailed) {
        return false;
      }

      return true;
    });
  }, [inventory.smartphones, allSmartphonesAssets, filters, visibleColumns, detailedFilters]);

  const filteredOthers = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.others
    const base = inventory.others;

    // Debug logging

    // If using server-side pagination (no client full dataset), trust server filters and skip client filtering
    if (allOthersAssets.length === 0) {
      return base;
    }

    // Fallback to client-side filtering if allOthersAssets is populated (shouldn't happen with server-side pagination)
    return allOthersAssets.filter(asset => {
      const matchesLocation = filters.locations.length === 0 || filters.locations.includes(asset.location || '');
      const matchesEmployee = !filters.employee || (asset.userId || "").toLowerCase().includes(filters.employee.toLowerCase());
      const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(asset.status || '');
      if (!matchesLocation || !matchesEmployee || !matchesStatus) {
        return false;
      }

      const matchesGlobal = !filters.global || visibleColumns.some(field => {
        const schemaKey = fieldIdToSchemaKeyMap[field.id as keyof typeof fieldIdToSchemaKeyMap];
        if (!schemaKey) return false;
        const value = asset[schemaKey as keyof PcAsset];
        return value != null && String(value).toLowerCase().includes(filters.global.toLowerCase());
      });
      if (!matchesGlobal) {
        return false;
      }

      const matchesDetailed = Object.entries(detailedFilters).every(([key, value]) => {
        if (!value || value === "") return true;
        const assetValue = asset[key as keyof PcAsset];
        return assetValue != null && String(assetValue).toLowerCase().includes(String(value).toLowerCase());
      });
      if (!matchesDetailed) {
        return false;
      }

      return true;
    });
  }, [inventory.others, allOthersAssets, filters, visibleColumns, detailedFilters]);

  // All tabs now use server-side pagination, so no need to update pagination totals from client-side filtering

  const sortedMonitors = useMemo(() => {
    if (sortConfig !== null) {
      const sortedItems = [...filteredMonitors].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'id' && typeof aValue === 'string' && typeof bValue === 'string') {
          const naturalSort = (valA: string, valB: string) => {
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          };
          const comparison = naturalSort(aValue, bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedItems;
    }
    return filteredMonitors;
  }, [filteredMonitors, sortConfig]);

  const sortedSmartphones = useMemo(() => {
    if (sortConfig !== null) {
      const sortedItems = [...filteredSmartphones].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'id' && typeof aValue === 'string' && typeof bValue === 'string') {
          const naturalSort = (valA: string, valB: string) => {
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          };
          const comparison = naturalSort(aValue, bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedItems;
    }
    return filteredSmartphones;
  }, [filteredSmartphones, sortConfig]);

  const sortedOthers = useMemo(() => {
    if (sortConfig !== null) {
      const sortedItems = [...filteredOthers].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (sortConfig.key === 'id' && typeof aValue === 'string' && typeof bValue === 'string') {
          const naturalSort = (valA: string, valB: string) => {
            return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
          };
          const comparison = naturalSort(aValue, bValue);
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue.toLowerCase() < bValue.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue.toLowerCase() > bValue.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sortedItems;
    }
    return filteredOthers;
  }, [filteredOthers, sortConfig]);

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof PcAsset; children: React.ReactNode }) => (
    <TableHead className="h-auto px-2 py-1 whitespace-nowrap cursor-pointer text-xs" onClick={() => handleSort(columnKey)}>
      <div className="flex items-center">
        {children}
        {getSortIcon(columnKey)}
      </div>
    </TableHead>
  );

  const renderContent = () => {
    if (isLoadingGraphQL) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (graphQLError) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('actions.error')}</AlertTitle>
          <AlertDescription>
            <p>{graphQLError}</p>
          </AlertDescription>
        </Alert>
      );
    }

    // Column configuration for 36-column tables
    const tableColumns = [
      { label: t('labels.id'), schemaKey: "id" as keyof PcAsset, sortable: true, minWidth: "80px" },
      { label: t('labels.hostname'), schemaKey: "hostname" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.location'), schemaKey: "location" as keyof PcAsset, sortable: true, minWidth: "80px" },
      { label: t('labels.userId'), schemaKey: "userId" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.status'), schemaKey: "status" as keyof PcAsset, sortable: true, minWidth: "80px" },
      { label: t('labels.manufacturer'), schemaKey: "manufacturer" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.model'), schemaKey: "model" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.partNumber'), schemaKey: "partNumber" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.serialNumber'), schemaKey: "serialNumber" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.formFactor'), schemaKey: "formFactor" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.previousUser'), schemaKey: "previousUser" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.os'), schemaKey: "os" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.osBit'), schemaKey: "osBit" as keyof PcAsset, sortable: true, minWidth: "60px" },
      { label: t('labels.officeSuite'), schemaKey: "officeSuite" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.softwareLicenseKey'), schemaKey: "softwareLicenseKey" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.wiredMacAddress'), schemaKey: "wiredMacAddress" as keyof PcAsset, sortable: true, minWidth: "140px" },
      { label: t('labels.wiredIpAddress'), schemaKey: "wiredIpAddress" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.wirelessMacAddress'), schemaKey: "wirelessMacAddress" as keyof PcAsset, sortable: true, minWidth: "140px" },
      { label: t('labels.wirelessIpAddress'), schemaKey: "wirelessIpAddress" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.usageStartDate'), schemaKey: "usageStartDate" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.usageEndDate'), schemaKey: "usageEndDate" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.carryInOutAgreement'), schemaKey: "carryInOutAgreement" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.lastUpdated'), schemaKey: "lastUpdated" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.updatedBy'), schemaKey: "updatedBy" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.purchaseDate'), schemaKey: "purchaseDate" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.purchasePrice'), schemaKey: "purchasePrice" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.purchasePriceTaxIncluded'), schemaKey: "purchasePriceTaxIncluded" as keyof PcAsset, sortable: true, minWidth: "120px" },
      { label: t('labels.depreciationYears'), schemaKey: "depreciationYears" as keyof PcAsset, sortable: true, minWidth: "80px" },
      { label: t('labels.depreciationDept'), schemaKey: "depreciationDept" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.cpu'), schemaKey: "cpu" as keyof PcAsset, sortable: true, minWidth: "100px" },
      { label: t('labels.memory'), schemaKey: "memory" as keyof PcAsset, sortable: true, minWidth: "80px" },
      { label: t('labels.notes'), schemaKey: "notes" as keyof PcAsset, sortable: false, minWidth: "200px" },
    ];

    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-grow min-h-0 pt-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto shrink-0">
          <TabsTrigger value="pcs" className="py-1"><Laptop className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.pcs')}</TabsTrigger>
          <TabsTrigger value="monitors" className="py-1"><Monitor className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.monitors')}</TabsTrigger>
          <TabsTrigger value="smartphones" className="py-1"><Smartphone className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.smartphones')}</TabsTrigger>
          <TabsTrigger value="others" className="py-1"><KeyRound className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.others')}</TabsTrigger>
        </TabsList>

        <TabsContent value="pcs" className="relative flex-grow flex flex-col">
          <div className="mt-2 h-[450px] w-full overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-20">
                <TableRow>
                  {tableColumns.map((column) => {
                    const isSortable = column.sortable;
                    return isSortable ? (
                      <SortableHeader key={column.schemaKey} columnKey={column.schemaKey}>
                        <span className="text-xs" style={{ minWidth: column.minWidth }}>
                          {column.label}
                        </span>
                      </SortableHeader>
                    ) : (
                      <TableHead key={column.schemaKey} className="h-auto px-2 py-1 whitespace-nowrap text-xs" style={{ minWidth: column.minWidth }}>
                        {column.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[400px]">
                {sortedPcs.length > 0 ? (
                  sortedPcs.map((pc, index) => (
                    <TableRow key={pc.id} onClick={() => handleEdit(pc)} className="cursor-pointer">
                      {tableColumns.map((column) => {
                        const value = pc[column.schemaKey];
                        const displayValue = value || '-';

                        // Special handling for status field (show badge)
                        if (column.schemaKey === 'status') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              <Badge variant={getStatusBadgeVariant(displayValue)} className="text-xs">
                                {getStatusText(displayValue)}
                              </Badge>
                            </TableCell>
                          );
                        }

                        // Special handling for ID field (monospace font)
                        if (column.schemaKey === 'id') {
                          return (
                            <TableCell key={column.schemaKey} className="font-mono text-xs px-2 py-1 whitespace-nowrap">
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Special handling for userId field (show employee name)
                        if (column.schemaKey === 'userId') {
                          // The asset object should have an employee property from the GraphQL relationship
                          const employeeName = (pc as any).employee?.name || displayValue;
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              {employeeName}
                            </TableCell>
                          );
                        }

                        // Special handling for notes field (truncate with title)
                        if (column.schemaKey === 'notes') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap max-w-xs truncate" title={displayValue}>
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Default cell rendering
                        return (
                          <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Laptop className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No PCs found</p>
                        <p className="text-sm">There are no PC assets in your inventory.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="h-16 flex-shrink-0 border-t bg-background px-4 py-2">
            <Pagination
              currentPage={pagination.pcs.currentPage}
              totalCount={pagination.pcs.totalCount}
              itemsPerPage={pagination.pcs.itemsPerPage}
              onPageChange={(page) => handlePageChange('pcs', page)}
            />
          </div>
        </TabsContent>
        <TabsContent value="monitors" className="relative flex-grow flex flex-col">
          <div className="mt-2 h-[450px] w-full overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-20">
                <TableRow>
                  {tableColumns.map((column) => {
                    const isSortable = column.sortable;
                    return isSortable ? (
                      <SortableHeader key={column.schemaKey} columnKey={column.schemaKey}>
                        <span className="text-xs" style={{ minWidth: column.minWidth }}>
                          {column.label}
                        </span>
                      </SortableHeader>
                    ) : (
                      <TableHead key={column.schemaKey} className="h-auto px-2 py-1 whitespace-nowrap text-xs" style={{ minWidth: column.minWidth }}>
                        {column.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[400px]">
                {sortedMonitors.length > 0 ? (
                  sortedMonitors.map((monitor: any, index: number) => (
                    <TableRow key={monitor.id} onClick={() => handleEditMonitor(monitor)} className="cursor-pointer">
                      {tableColumns.map((column) => {
                        const value = monitor[column.schemaKey];
                        const displayValue = value || '-';

                        // Special handling for status field (show badge)
                        if (column.schemaKey === 'status') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              <Badge variant={getStatusBadgeVariant(displayValue)} className="text-xs">
                                {getStatusText(displayValue)}
                              </Badge>
                            </TableCell>
                          );
                        }

                        // Special handling for ID field (monospace font)
                        if (column.schemaKey === 'id') {
                          return (
                            <TableCell key={column.schemaKey} className="font-mono text-xs px-2 py-1 whitespace-nowrap">
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Special handling for userId field (show employee name)
                        if (column.schemaKey === 'userId') {
                          // The asset object should have an employee property from the GraphQL relationship
                          const employeeName = (monitor as any).employee?.name || displayValue;
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              {employeeName}
                            </TableCell>
                          );
                        }

                        // Special handling for notes field (truncate with title)
                        if (column.schemaKey === 'notes') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap max-w-xs truncate" title={displayValue}>
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Default cell rendering
                        return (
                          <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Monitor className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Monitors found</p>
                        <p className="text-sm">There are no monitor assets in your inventory.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="h-16 flex-shrink-0 border-t bg-background px-4 py-2">
            <Pagination
              currentPage={pagination.monitors.currentPage}
              totalCount={pagination.monitors.totalCount}
              itemsPerPage={pagination.monitors.itemsPerPage}
              onPageChange={(page) => handlePageChange('monitors', page)}
            />
          </div>
        </TabsContent>
        <TabsContent value="smartphones" className="relative flex-grow flex flex-col">
          <div className="mt-2 h-[450px] w-full overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-20">
                <TableRow>
                  {tableColumns.map((column) => {
                    const isSortable = column.sortable;
                    return isSortable ? (
                      <SortableHeader key={column.schemaKey} columnKey={column.schemaKey}>
                        <span className="text-xs" style={{ minWidth: column.minWidth }}>
                          {column.label}
                        </span>
                      </SortableHeader>
                    ) : (
                      <TableHead key={column.schemaKey} className="h-auto px-2 py-1 whitespace-nowrap text-xs" style={{ minWidth: column.minWidth }}>
                        {column.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[400px]">
                {sortedSmartphones.length > 0 ? (
                  sortedSmartphones.map((phone: any, index: number) => (
                    <TableRow key={phone.id} onClick={() => handleEditSmartphone(phone)} className="cursor-pointer">
                      {tableColumns.map((column) => {
                        const value = phone[column.schemaKey];
                        const displayValue = value || '-';

                        // Special handling for status field (show badge)
                        if (column.schemaKey === 'status') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              <Badge variant={getStatusBadgeVariant(displayValue)} className="text-xs">
                                {getStatusText(displayValue)}
                              </Badge>
                            </TableCell>
                          );
                        }

                        // Special handling for ID field (monospace font)
                        if (column.schemaKey === 'id') {
                          return (
                            <TableCell key={column.schemaKey} className="font-mono text-xs px-2 py-1 whitespace-nowrap">
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Special handling for userId field (show employee name)
                        if (column.schemaKey === 'userId') {
                          // The asset object should have an employee property from the GraphQL relationship
                          const employeeName = (phone as any).employee?.name || displayValue;
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              {employeeName}
                            </TableCell>
                          );
                        }

                        // Special handling for notes field (truncate with title)
                        if (column.schemaKey === 'notes') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap max-w-xs truncate" title={displayValue}>
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Default cell rendering
                        return (
                          <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center h-full">
                        <Smartphone className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Smartphones found</p>
                        <p className="text-sm">There are no smartphone assets in your inventory.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="h-16 flex-shrink-0 border-t bg-background px-4 py-2">
            <Pagination
              currentPage={pagination.smartphones.currentPage}
              totalCount={pagination.smartphones.totalCount}
              itemsPerPage={pagination.smartphones.itemsPerPage}
              onPageChange={(page) => handlePageChange('smartphones', page)}
            />
          </div>
        </TabsContent>
        <TabsContent value="others" className="relative flex-grow flex flex-col">
          <div className="mt-2 h-[450px] w-full overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-20">
                <TableRow>
                  {tableColumns.map((column) => {
                    const isSortable = column.sortable;
                    return isSortable ? (
                      <SortableHeader key={column.schemaKey} columnKey={column.schemaKey}>
                        <span className="text-xs" style={{ minWidth: column.minWidth }}>
                          {column.label}
                        </span>
                      </SortableHeader>
                    ) : (
                      <TableHead key={column.schemaKey} className="h-auto px-2 py-1 whitespace-nowrap text-xs" style={{ minWidth: column.minWidth }}>
                        {column.label}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[400px]">
                {sortedOthers.length > 0 ? (
                  sortedOthers.map((other: any, index: number) => (
                    <TableRow key={other.id} onClick={() => handleEditOther(other)} className="cursor-pointer">
                      {tableColumns.map((column) => {
                        const value = other[column.schemaKey];
                        const displayValue = value || '-';

                        // Special handling for status field (show badge)
                        if (column.schemaKey === 'status') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              <Badge variant={getStatusBadgeVariant(displayValue)} className="text-xs">
                                {getStatusText(displayValue)}
                              </Badge>
                            </TableCell>
                          );
                        }

                        // Special handling for ID field (monospace font)
                        if (column.schemaKey === 'id') {
                          return (
                            <TableCell key={column.schemaKey} className="font-mono text-xs px-2 py-1 whitespace-nowrap">
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Special handling for userId field (show employee name)
                        if (column.schemaKey === 'userId') {
                          // The asset object should have an employee property from the GraphQL relationship
                          const employeeName = (other as any).employee?.name || displayValue;
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                              {employeeName}
                            </TableCell>
                          );
                        }

                        // Special handling for notes field (truncate with title)
                        if (column.schemaKey === 'notes') {
                          return (
                            <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap max-w-xs truncate" title={displayValue}>
                              {displayValue}
                            </TableCell>
                          );
                        }

                        // Default cell rendering
                        return (
                          <TableCell key={column.schemaKey} className="text-xs px-2 py-1 whitespace-nowrap">
                            {displayValue}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center h-full">
                        <KeyRound className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No Other Assets found</p>
                        <p className="text-sm">There are no other assets in your inventory.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="h-16 flex-shrink-0 border-t bg-background px-4 py-2">
            <Pagination
              currentPage={pagination.others.currentPage}
              totalCount={pagination.others.totalCount}
              itemsPerPage={pagination.others.itemsPerPage}
              onPageChange={(page) => handlePageChange('others', page)}
            />
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch ALL assets from the server (not just current page)
      const allAssetsResult = await getAllAssetsFromGraphQL(1, 10000); // Large number to get all assets

      if (allAssetsResult.error) {
        console.error("Error fetching all assets for export:", allAssetsResult.error);
        toast({
          title: t('actions.error'),
          description: t('pages.inventory.fetch_error'),
          variant: "destructive"
        });
        return;
      }

      // Combine all assets from different types
      const allAssetsForExport = [
        ...allAssetsResult.pcs,
        ...allAssetsResult.monitors,
        ...allAssetsResult.phones,
        ...allAssetsResult.others
      ];

      if (allAssetsForExport.length === 0) {
        toast({
          title: t('actions.warning'),
          description: t('pages.inventory.no_assets_to_export'),
          variant: "destructive"
        });
        return;
      }

      // Define column order based on the provided Japanese CSV format
      const exportColumnOrder = [
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
      ];

      // Get all unique field names from all assets
      const allFields = new Set<string>();
      allAssetsForExport.forEach(asset => {
        Object.keys(asset).forEach(key => allFields.add(key));
      });

      // Create ordered field names: start with our defined order, then add any remaining fields
      const orderedFieldNames: string[] = [];

      // Add fields in our defined order (if they exist in the data)
      exportColumnOrder.forEach(field => {
        if (allFields.has(field)) {
          orderedFieldNames.push(field);
          allFields.delete(field);
        }
      });

      // Add any remaining fields in alphabetical order
      const remainingFields = Array.from(allFields).sort();
      orderedFieldNames.push(...remainingFields);

      // Create CSV content with proper formatting
      const csvContent = [
        // Header row with Japanese column names as shown in the image
        orderedFieldNames.map(field => {
          // Map field names to exact Japanese column headers from the image
          const japaneseHeaders: { [key: string]: string } = {
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

          // Use Japanese header if available, otherwise fall back to system field display name or field name
          const displayName = japaneseHeaders[field] ||
            systemFields.find(f => f.systemName === field)?.displayName ||
            field;
          return `"${displayName}"`;
        }).join(','),

        // Data rows
        ...allAssetsForExport.map(asset =>
          orderedFieldNames.map(field => {
            const value = asset[field as keyof typeof asset];

            // Handle null/undefined values
            if (value === null || value === undefined) {
              return '""';
            }

            // Convert value to string and handle special characters
            let stringValue = String(value);

            // Format dates if they look like dates
            if (field.includes('date') && stringValue && stringValue !== 'null') {
              try {
                const date = new Date(stringValue);
                if (!isNaN(date.getTime())) {
                  stringValue = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                }
              } catch (e) {
                // Keep original value if date parsing fails
              }
            }

            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return `"${stringValue}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('actions.success'),
        description: t('pages.inventory.export_success', { count: allAssetsForExport.length }),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('actions.error'),
        description: t('pages.inventory.export_error'),
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col max-h-screen">
        <CardContent className="p-4 flex flex-col flex-grow min-h-0">
          <Accordion type="single" collapsible className="w-full" defaultValue="filters">
            <AccordionItem value="filters" className="border rounded-md">
              <AccordionTrigger className="p-2 text-sm hover:no-underline data-[state=open]:border-b">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>{t('pages.inventory.actions_and_filters')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 border-t">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{t('pages.inventory.title')}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}><Upload className="mr-2 h-4 w-4" /> {t('pages.inventory.import')}</Button>
                      <Button variant="outline" onClick={handleExport} disabled={isExporting}>
                        {isExporting ? (
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? t('pages.inventory.exporting') : t('pages.inventory.export')}
                      </Button>
                      <Button onClick={handleAddNew}><FilePlus2 className="mr-2 h-4 w-4" /> {t('pages.inventory.add_new_asset')}</Button>
                      <Button
                        variant="outline"
                        onClick={fetchDataFromGraphQL}
                        disabled={isLoadingGraphQL}
                      >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingGraphQL && "animate-spin")} />
                        {isLoadingGraphQL ? t('actions.loading') : t('actions.refresh')}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    <div className="flex gap-2 sm:col-span-2">
                      <Input
                        name="global"
                        placeholder={t('pages.inventory.filter_all')}
                        defaultValue={inputValues.global}
                        onChange={handleFilterChange}
                        onKeyPress={handleKeyPress}
                        className="bg-background flex-1"
                        ref={globalInputRef}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSearch}
                        className="px-3"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      {(inputValues.global || filters.global) && (
                        <Button
                          variant="outline"
                          onClick={handleClearSearch}
                          className="px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span className="truncate">
                            {filters.locations.length === 0 || filters.locations.length === masterDataState.locations.length
                              ? t('pages.inventory.filter_location')
                              : t('pages.inventory.filter_location_selected', { count: filters.locations.length })
                            }
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuLabel>{t('pages.inventory.filter_location')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, locations: [...new Set(masterDataState.locations.map(l => l.name))] }))} className="cursor-pointer">
                          {t('actions.select_all')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, locations: [] }))} className="cursor-pointer">
                          {t('actions.deselect_all')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {masterDataState.locations.map((location) => (
                          <DropdownMenuCheckboxItem
                            key={location.id}
                            checked={filters.locations.includes(location.name)}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                locations: checked
                                  ? [...new Set([...prev.locations, location.name])]
                                  : prev.locations.filter(s => s !== location.name)
                              }));
                            }}
                            onSelect={e => e.preventDefault()}
                          >
                            {location.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-2">
                      <Input
                        name="employee"
                        placeholder={t('pages.inventory.filter_user')}
                        defaultValue={inputValues.employee}
                        onChange={handleFilterChange}
                        onKeyPress={handleKeyPress}
                        className="bg-background flex-1"
                        ref={employeeInputRef}
                      />
                      <Button
                        variant="outline"
                        onClick={handleSearch}
                        className="px-3"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                      {(inputValues.employee || filters.employee) && (
                        <Button
                          variant="outline"
                          onClick={handleClearSearch}
                          className="px-3"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          <span className="truncate">
                            {filters.statuses.length === 0 || filters.statuses.length === allStatuses.length
                              ? t('pages.inventory.filter_status')
                              : t('pages.inventory.filter_status_selected', { count: filters.statuses.length })
                            }
                          </span>
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[var(--radix-popover-trigger-width)]">
                        <DropdownMenuLabel>{t('pages.inventory.filter_status')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, statuses: allStatuses }))} className="cursor-pointer">
                          {t('actions.select_all')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFilters(prev => ({ ...prev, statuses: [] }))} className="cursor-pointer">
                          {t('actions.deselect_all')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {allStatuses.map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={filters.statuses.includes(status)}
                            onCheckedChange={(checked) => {
                              setFilters(prev => ({
                                ...prev,
                                statuses: checked
                                  ? [...prev.statuses, status]
                                  : prev.statuses.filter(s => s !== status)
                              }));
                            }}
                            onSelect={e => e.preventDefault()}
                          >
                            {getStatusText(status)}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div>
                    <Button variant="outline" onClick={() => setIsDetailedSearchOpen(true)}>
                      <Search className="mr-2 h-4 w-4" />
                      {t('pages.inventory.detailed_search_title')}
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {renderContent()}

        </CardContent>
        <Dialog open={isFormOpen} onOpenChange={handleFormDialogChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{(() => {
                const currentAsset = getCurrentAsset();
                if (currentAsset) {
                  return t('pages.inventory.edit_asset', { assetType: getAssetTypeDisplayName(currentAsset.type) });
                }
                return t('pages.inventory.add_new_asset');
              })()}</DialogTitle>
              <DialogDescription>
                {(() => {
                  const currentAsset = getCurrentAsset();
                  if (currentAsset) {
                    return t('pages.inventory.edit_asset_desc', { assetType: getAssetTypeDisplayName(currentAsset.type) });
                  }
                  return t('pages.inventory.add_asset_desc');
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-2 pl-1">
              <Form {...form}>
                <form id="pc-asset-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Asset Type Selection - Always visible */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">{t('labels.asset_type')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('labels.select_type')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pc">{t('pages.inventory.tabs.pcs')}</SelectItem>
                              <SelectItem value="monitor">{t('pages.inventory.tabs.monitors')}</SelectItem>
                              <SelectItem value="smartphones">{t('pages.inventory.tabs.smartphones')}</SelectItem>
                              <SelectItem value="others">{t('pages.inventory.tabs.others')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">{t('labels.basic_info')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormItem>
                        <FormLabel>{t('labels.id')}</FormLabel>
                        <FormControl>
                          <Input value={(() => {
                            const currentAsset = getCurrentAsset();
                            if (currentAsset) {
                              return currentAsset.asset.id;
                            }
                            return t('labels.autogenerated_id');
                          })()} disabled />
                        </FormControl>
                      </FormItem>
                      <FormField control={form.control} name="hostname" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('hostname')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="manufacturer" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('manufacturer')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="model" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('model')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="partNumber" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('partNumber')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="serialNumber" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('serialNumber')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="formFactor" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('formFactor')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('location')}</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""}><FormControl><SelectTrigger><SelectValue placeholder={t('labels.select_location')} /></SelectTrigger></FormControl><SelectContent>{locationOptions}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('status')}</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{allStatuses.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="previousUser" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('previousUser')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="userId" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('userId')}</FormLabel><Select onValueChange={field.onChange} value={field.value ?? ""}><FormControl><SelectTrigger><SelectValue placeholder={t('labels.select_employee')} /></SelectTrigger></FormControl><SelectContent>{employeeOptions}</SelectContent></Select><FormMessage /></FormItem>)} />
                      {(assetType === 'pc' || assetType === 'monitor' || assetType === 'smartphones' || assetType === 'other') && (
                        <>
                          <FormField control={form.control} name="os" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('os')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="osBit" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('osBit')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="officeSuite" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('officeSuite')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="cpu" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('cpu')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                          <FormField control={form.control} name="memory" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('memory')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Network Information - Show for all asset types */}
                  {(assetType === 'pc' || assetType === 'monitor' || assetType === 'smartphones' || assetType === 'other') && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-3">{t('labels.network_info')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="wiredMacAddress" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('wiredMacAddress')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="wiredIpAddress" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('wiredIpAddress')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="wirelessMacAddress" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('wirelessMacAddress')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="wirelessIpAddress" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('wirelessIpAddress')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                  )}

                  {/* Financial Information */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">{t('labels.financial_info')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField control={form.control} name="purchaseDate" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('purchaseDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="purchasePrice" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('purchasePrice')}</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="depreciationYears" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('depreciationYears')}</FormLabel><FormControl><Input type="text" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="depreciationDept" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('depreciationDept')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </div>

                  {/* System Information - Show for all asset types */}
                  {(assetType === 'pc' || assetType === 'monitor' || assetType === 'smartphones' || assetType === 'other') && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-3">{t('labels.system_info')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="lastUpdated" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('lastUpdated')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="updatedBy" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('updatedBy')}</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>)} />
                      </div>
                    </div>
                  )}

                  {/* Notes and Additional Information */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">{t('labels.notes_info')}</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField control={form.control} name="softwareLicenseKey" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('softwareLicenseKey')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes1" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes1')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes2" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes2')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes3" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes3')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes4" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes4')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="notes5" render={({ field }) => (<FormItem><FormLabel>{getDisplayName('notes5')}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                  </div>
                </form>
              </Form>
            </div>
            <DialogFooter className="pt-4 flex-shrink-0 border-t mt-4 flex justify-between w-full">
              <div>
                {(selectedPc || selectedMonitor || selectedSmartphone || selectedOther) && (
                  <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('actions.delete')}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <DialogClose asChild><Button type="button" variant="secondary" disabled={isPending}>{t('actions.cancel')}</Button></DialogClose>
                <Button type="submit" form="pc-asset-form" disabled={isPending}>{isPending ? t('actions.saving') : t('actions.save')}</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Dialog open={isImportDialogOpen} onOpenChange={handleImportDialogChange}>
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
                  <SelectItem value="UTF-8">UTF-8</SelectItem>
                  <SelectItem value="Shift_JIS">Shift_JIS</SelectItem>
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
                  onChange={handleImportFile}
                  accept=".tsv,.csv,text/tab-separated-values,text/csv"
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
                  {fileData.length > 0 && <span className="ml-2 text-foreground">{t('pages.inventory.import_dialog.records_loaded', { count: fileData.length })}</span>}
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

      <AlertDialog open={errorDialogState.isOpen} onOpenChange={(isOpen) => setErrorDialogState(prev => ({ ...prev, isOpen }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" />
              {errorDialogState.title}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="py-4 text-sm text-foreground break-words whitespace-pre-wrap max-h-[60vh] overflow-auto">
                {errorDialogState.description}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogState({ isOpen: false, title: '', description: '' })}>
              {t('actions.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isImportProgressDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.import.progress.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.import.progress.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            {isImporting ? (
              <>
                <Loader className="h-10 w-10 animate-spin text-primary" />
                <div className="w-full text-center">
                  <p className="text-lg font-semibold mb-2">
                    {t('actions.importing_progress', { current: importProgress.current, total: importProgress.total })}
                  </p>
                  <Progress value={(importProgress.total > 0 ? (importProgress.current / importProgress.total) : 0) * 100} className="w-full" />
                </div>
              </>
            ) : importSummary ? (
              <div className="w-full text-center">
                <div className="text-green-600 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('actions.import.progress.complete')}</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{t('actions.import.progress.total_processed', { count: importSummary.total })}</p>
                  <p>{t('actions.import.progress.pcs_imported', { count: importSummary.pcs })}</p>
                  <p>{t('actions.import.progress.monitors_imported', { count: importSummary.monitors })}</p>
                  <p>{t('actions.import.progress.phones_imported', { count: importSummary.phones })}</p>
                  <p>{t('actions.import.progress.others_imported', { count: importSummary.others })}</p>

                  {importSummary.categorizationDetails && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="font-semibold text-blue-800 mb-2">Asset Categorization Details:</p>
                      {importSummary.categorizationDetails.pcs.length > 0 && (
                        <div className="mb-2">
                          <p className="text-blue-700 text-xs font-medium">PCs ({importSummary.categorizationDetails.pcs.length}):</p>
                          <p className="text-blue-600 text-xs">{importSummary.categorizationDetails.pcs.slice(0, 3).join(', ')}
                            {importSummary.categorizationDetails.pcs.length > 3 && ` and ${importSummary.categorizationDetails.pcs.length - 3} more`}
                          </p>
                        </div>
                      )}
                      {importSummary.categorizationDetails.monitors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-blue-700 text-xs font-medium">Monitors ({importSummary.categorizationDetails.monitors.length}):</p>
                          <p className="text-blue-600 text-xs">{importSummary.categorizationDetails.monitors.slice(0, 3).join(', ')}
                            {importSummary.categorizationDetails.monitors.length > 3 && ` and ${importSummary.categorizationDetails.monitors.length - 3} more`}
                          </p>
                        </div>
                      )}
                      {importSummary.categorizationDetails.phones.length > 0 && (
                        <div className="mb-2">
                          <p className="text-blue-700 text-xs font-medium">Phones ({importSummary.categorizationDetails.phones.length}):</p>
                          <p className="text-blue-600 text-xs">{importSummary.categorizationDetails.phones.slice(0, 3).join(', ')}
                            {importSummary.categorizationDetails.phones.length > 3 && ` and ${importSummary.categorizationDetails.phones.length - 3} more`}
                          </p>
                        </div>
                      )}
                      {importSummary.categorizationDetails.others.length > 0 && (
                        <div className="mb-2">
                          <p className="text-blue-700 text-xs font-medium">Others ({importSummary.categorizationDetails.others.length}):</p>
                          <p className="text-blue-600 text-xs">{importSummary.categorizationDetails.others.slice(0, 3).join(', ')}
                            {importSummary.categorizationDetails.others.length > 3 && ` and ${importSummary.categorizationDetails.others.length - 3} more`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {importSummary.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="font-semibold text-red-800">{t('actions.import.progress.errors_encountered')}</p>
                      {importSummary.errors.map((error, index) => (
                        <p key={index} className="text-red-700 text-xs">{error}</p>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setIsImportProgressDialogOpen(false);
                    setImportSummary(null);
                  }}
                >
                  {t('actions.import.progress.close')}
                </Button>
              </div>
            ) : null}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {selectedPc && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('actions.delete_confirm_message', { item: selectedPc.id })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isPending} className={cn(buttonVariants({ variant: "destructive" }))}>
                {isPending ? t('actions.deleting') : t('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDetailedSearchOpen} onOpenChange={setIsDetailedSearchOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('pages.inventory.detailed_search_title')}</DialogTitle>
            <DialogDescription>{t('pages.inventory.detailed_search_desc')}</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4 pl-2">
            <Form {...detailedSearchForm}>
              <form id="detailed-search-form" onSubmit={detailedSearchForm.handleSubmit(onDetailedSearchSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemFields.filter(f => f.visible).map(field => {
                    const schemaKey = fieldIdToSchemaKeyMap[field.id as keyof typeof fieldIdToSchemaKeyMap];
                    if (!schemaKey) return null;
                    return (
                      <FormField
                        key={field.id}
                        control={detailedSearchForm.control}
                        name={schemaKey as any}
                        render={({ field: formField }) => (
                          <FormItem>
                            <FormLabel>{getDisplayName(schemaKey as any)}</FormLabel>
                            <FormControl>
                              <Input {...formField} value={formField.value ?? ""} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </form>
            </Form>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClearDetailedSearch}>{t('actions.clear')}</Button>
            <DialogClose asChild><Button type="button" variant="secondary">{t('actions.cancel')}</Button></DialogClose>
            <Button type="submit" form="detailed-search-form">{t('actions.search')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
