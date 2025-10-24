"use client"

import React, { useState, useEffect, useMemo, useCallback, useTransition, useRef, startTransition } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { FiltersSection } from '@/app/inventory/components/filters-section'
import { AssetFormDialog } from '@/app/inventory/components/asset-form-dialog'
import { useInventoryData } from './hooks/use-inventory-data'
import { useAssetFilters } from './hooks/use-asset-filters'
import { useAssetForm } from './hooks/use-asset-form'
import { createTableColumns } from './utils/table-helpers'
import { getStatusText, getEmployeeName, getAssetTypeDisplayName, convertFormValuesToAsset } from './utils/asset-transformation'
import { ExportDialog } from './components/import-export/export-dialog';
import { ImportDialog } from './components/import-export/import-dialog';
import { ImportProgressDialog } from './components/import-export/import-progress-dialog';
import { ErrorBoundary } from './components/error-boundary';
import { getPcsFromGraphQL, getMonitorsFromGraphQL, getPhonesFromGraphQL, getOthersFromGraphQL, getAllAssetsFromGraphQL, getMasterDataFromGraphQL, bulkUpsertPcsToGraphQL, bulkUpsertMonitorsToGraphQL, bulkUpsertPhonesToGraphQL, bulkUpsertOthersToGraphQL, bulkUpsertMixedAssetsToGraphQL, deletePcFromGraphQL, deleteMonitorFromGraphQL, deletePhoneFromGraphQL } from "./actions"
import { pcSchema } from "@/lib/schemas/inventory"
import { fieldIdToSchemaKeyMap } from "@/lib/data"
import { 
  FrontendAsset, 
  Employee, 
  Project, 
  Location,
  AssetField,
  PcFormValues
} from '@/lib/types/index';

import { toSnakeCase } from './utils/string-helpers'
import { toast, useToast } from "@/hooks/use-toast"

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
import { FilePlus2, Laptop, Monitor, Smartphone, KeyRound, Cloud, Download, SlidersHorizontal, ArrowUp, ArrowDown, Upload, Loader, AlertTriangle, Sparkles, Trash2, ChevronDown, Search, X, RefreshCw, CalendarIcon } from "lucide-react"
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
import { useImportExport } from "./hooks/use-import-export"
import { useDialogState } from "./hooks/use-dialog-state"
import { useDetailedSearch } from "./hooks/use-detailed-search"
import { PcTab } from './components/tabs/PcTab';
import { MonitorTab } from './components/tabs/MonitorTab';
import { SmartphoneTab } from './components/tabs/SmartphoneTab';
import { OthersTab } from './components/tabs/OthersTab';
import { handleImportFile, handleMappingChange, handleAiMatch, handleConfirmImport, showErrorDialog, processFileContent } from "./utils/import-export-utils"
import { 
  ASSET_STATUSES, 
  STATUS_MAPPING, 
  getStatusBadgeVariant,
  ASSET_TYPES,
  PAGINATION_DEFAULTS,
  IMPORT_EXPORT,
  STATUS_JP_TO_EN,
  JAPANESE_HEADERS,
  EXPORT_COLUMN_ORDER,
  emptyFormValues 
} from './constants';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { enUS, ja } from "date-fns/locale"
import { format } from "date-fns"
type PcAsset = FrontendAsset;

type InventoryClientPageProps = {
  initialPcs: PcAsset[];
  initialLocations: { id: string; name: string; }[];
  initialEmployees: { id: string; name: string; }[];
  initialProjects: { id: string; name: string; }[];
  initialLocalInventory: any;
  initialSystemFields: AssetField[];
  initialError: string | null;
};

const allStatuses = [...ASSET_STATUSES];

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
  const { user, loading: authLoading } = useAuth();
  const { t } = useI18n();

  const {
    inventory,
    pagination,
    isLoading: isLoadingGraphQL,
    error: graphQLError,
    fetchMasterData,
    updatePagination,
    resetPagination,
    setIsLoading: setIsLoadingGraphQL,
    masterDataState,
    setMasterDataState,
    systemFields,
    setSystemFields,
    sortConfig,
    setSortConfig,
    activeTab,
    setActiveTab,
    isInitialLoadComplete,
    setIsInitialLoadComplete,
    fetchAllData,
    handleSort
    
  } = useInventoryData({
    initialLocations: initialLocations,
    initialEmployees: initialEmployees,
    initialProjects: initialProjects,
    initialSystemFields: initialSystemFields
  });

  const {
    filters,
    setFilters,
    inputValues,
    detailedFilters,
    setDetailedFilters,
    globalInputRef,
    employeeInputRef,
    handleFilterChange,
    handleKeyPress,
    handleSearch,
    handleClearSearch,
    updateDetailedFilters,
    clearDetailedFilters,
    setInputValues
  } = useAssetFilters();

  const {
    isFormOpen,
    setIsFormOpen,
    selectedAsset,
    setSelectedAsset,
    isPending,
    form,
    openForm,
    closeForm,
    handleSubmit: hookHandleSubmit,
    setIsPending
  } = useAssetForm();

  const {
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
    setFileEncoding,
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
    handleAiMatch,
    handleImportFile,
    handleMappingChange,
    handleConfirmImport,
  } = useImportExport({ 
    systemFields, 
    onError: (title, description) => setErrorDialogState({ isOpen: true, title, description: String(description) }), 
    onSuccess: (message) => toast({ title: 'Success', description: message }),

    });

  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDetailedSearchOpen,
    setIsDetailedSearchOpen,
    errorDialogState,
    setErrorDialogState,
    handleDeleteDialogOpen,
    handleDetailedSearchOpen,
    handleErrorDialogOpen,
    handleErrorDialogClose
  } = useDialogState();

  const tableColumns = useMemo(() => createTableColumns(t), [t]);
  const { detailedSearchForm } = useDetailedSearch();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Fetch all data on component mount for client-side filtering and pagination
  useEffect(() => {
    fetchAllData();
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

  // Memoize getDisplayName function to prevent recreation
  const getDisplayName = useCallback((key: keyof PcFormValues) => {
    return displayNames[key] || key;
  }, [displayNames]);

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

      // Convert form values to assets
      const assetsToImport = pcsToImport.map(convertFormValuesToAsset);
      
      // Perform a single bulk GraphQL upsert
      const result = await bulkUpsertMixedAssetsToGraphQL(assetsToImport);
      if (!result.success) {
        showErrorDialog(t('actions.error'), result.error || t('errors.graphql_import_failed'));
        setIsImportProgressDialogOpen(false);
        setImportProgress({ current: 0, total: 0 });
        setIsImporting(false);
        return;
      }

      // Store the import summary
      const summary = result.summary || { pcs: 0, monitors: 0, phones: 0, others: 0, errors: [], categorizationDetails: { pcs: [], monitors: [], phones: [], others: [] } };
      setImportSummary({
        total: summary.pcs + summary.monitors + summary.phones + summary.others,
        pcs: summary.pcs,
        monitors: summary.monitors,
        phones: summary.phones,
        others: summary.others,
        errors: (summary as any).errors || [],
        categorizationDetails: (summary as any).categorizationDetails || { pcs: [], monitors: [], phones: [], others: [] }
      });

      // Mark progress as complete
      setImportProgress({ current: totalToImport, total: totalToImport });

      // Show success toast with summary
      toast({
        title: t('actions.success'),
        description: t('actions.import_success_summary', {
        }),
      });

      // Refresh all data to reflect imported assets
      await fetchAllData();

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

  // Watch the asset type to conditionally show/hide form sections
  const assetType = form.watch('type');

  // Helper function to get the currently selected asset and its type
  const getCurrentAsset = () => {
    if (selectedAsset) {
      // Determine type based on the asset's type field or other properties
      const assetType = selectedAsset.type?.toLowerCase() || 'pc';
      return { asset: selectedAsset, type: assetType };
    }
    return null;
  };

  useEffect(() => {
    const currentAsset = getCurrentAsset();

    let valuesToSet: any = emptyFormValues;

    if (currentAsset) {
      valuesToSet = { ...currentAsset.asset };
      // Set the type field based on the current asset type
      valuesToSet.type = currentAsset.type;
      // Ensure both ID fields are properly set for editing
      valuesToSet.id = currentAsset.asset.id;
      valuesToSet.assetId = currentAsset.asset.assetId;
    }

    // Ensure all keys from PcFormValues are present and are strings
    const sanitizedValues: PcFormValues = Object.keys(pcSchema.shape).reduce((acc, key) => {
      const formKey = key as keyof PcFormValues;
      const value = (valuesToSet as any)[formKey];
      
      // Convert numeric values to strings for form compatibility
      if (formKey === 'purchasePrice' || formKey === 'purchasePriceTaxIncluded' || formKey === 'depreciationYears') {
        acc[formKey] = value ? String(value) : "";
      } else {
        acc[formKey] = value ?? "";
      }
      return acc;
    }, {} as PcFormValues);

    form.reset(sanitizedValues);
  }, [selectedAsset, form]);

  const onSubmit = useCallback(async (values: PcFormValues) => {
    try {
      // Prepare asset data for submission
      const assetData = { ...values };

      const currentAsset = getCurrentAsset();
      if (currentAsset) {
        assetData.id = currentAsset.asset.id;
        assetData.assetId = currentAsset.asset.assetId;
      } else {
        // Generate a unique ID for new assets if not provided
        if (!assetData.id || assetData.id.trim() === '') {
          assetData.id = crypto.randomUUID();
        }
        if (!assetData.assetId || assetData.assetId.trim() === '') {
          assetData.assetId = crypto.randomUUID();
        }
      }

      // Form submission processing
      
      // Determine asset type and route to appropriate GraphQL function
      const assetType = assetData.type?.toLowerCase();
      let result;

      if (assetType === 'pc') {
        result = await bulkUpsertPcsToGraphQL([convertFormValuesToAsset(assetData)]);
      } else if (assetType === 'monitor') {
        result = await bulkUpsertMonitorsToGraphQL([convertFormValuesToAsset(assetData)]);
      } else if (assetType === 'smartphones') {
        result = await bulkUpsertPhonesToGraphQL([convertFormValuesToAsset(assetData)]);
      } else {
        // For 'others' or any unrecognized type, use the others function
        result = await bulkUpsertOthersToGraphQL([convertFormValuesToAsset(assetData)]);
      }

      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t('actions.inventory.save_success'),
        });
        // Add a small delay to ensure server has committed the transaction
        await new Promise(resolve => setTimeout(resolve, 500));
        // Refresh all inventory data
        await fetchAllData();
      } else {
        console.error('Failed to save asset:', result.error);
        showErrorDialog(t('actions.error'), result.error || 'Failed to save asset');
      }
    } catch (error) {
      console.error('Error saving asset:', error);
      showErrorDialog(t('actions.error'), 'An unexpected error occurred while saving the asset');
    }
  }, [getCurrentAsset, t, toast, showErrorDialog, fetchAllData]);

  function onDetailedSearchSubmit(values: PcFormValues) {
    setDetailedFilters(values);
    setIsDetailedSearchOpen(false);
  }

  function handleClearDetailedSearch() {
    detailedSearchForm.reset({});
  }

  const handleDelete = () => {
    const currentAsset = getCurrentAsset();
    if (!currentAsset) return;
    
    startTransition(async () => {
      try {
        // Determine asset type and route to appropriate delete function
        const assetType = currentAsset.type?.toLowerCase();
        let result;

        if (assetType === 'pc') {
          result = await deletePcFromGraphQL(currentAsset.asset.assetId);
        } else if (assetType === 'monitor') {
          result = await deleteMonitorFromGraphQL(currentAsset.asset.assetId);
        } else if (assetType === 'smartphones') {
          result = await deletePhoneFromGraphQL(currentAsset.asset.assetId);
        } else {

          result = await deletePcFromGraphQL(currentAsset.asset.assetId);
        }

        if (result.success) {
          toast({
            title: t('actions.success'),
            description: t('actions.inventory.delete_success'),
          });
          setIsDeleteDialogOpen(false);
          setIsFormOpen(false);
          setSelectedAsset(null);
          // Refresh all inventory data
          await fetchAllData();
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
    setSelectedAsset(null);
    setSelectedAsset(null);
    setIsFormOpen(true);
  }

  const handleEdit = (asset: any) => {
    setSelectedAsset(asset);
    setIsFormOpen(true);
  }


  const handleFormDialogChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedAsset(null);
      setSelectedAsset(null);
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
    if (allAssets.length === 0) {
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
  }, [inventory.pcs, allAssets, filters, visibleColumns, detailedFilters]);

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
    if (allAssets.length === 0) {
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
  }, [inventory.monitors, allAssets, filters, visibleColumns, detailedFilters]);

  const filteredSmartphones = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.smartphones
    const base = inventory.smartphones;
    if (allAssets.length === 0) {
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
  }, [inventory.smartphones, allAssets, filters, visibleColumns, detailedFilters]);

  const filteredOthers = useMemo(() => {
    // For server-side pagination, always use current page data from inventory.others
    const base = inventory.others;

    // If using server-side pagination (no client full dataset), trust server filters and skip client filtering
    if (allAssets.length === 0) {
      return base;
    }

    // Fallback to client-side filtering if allOthersAssets is populated (shouldn't happen with server-side pagination)
    return allAssets.filter(asset => {
      if ((asset as any)._source !== 'others') {
        return false;
      }

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
  }, [inventory.others, allAssets, filters, visibleColumns, detailedFilters]);

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

  // Calculate dynamic pagination for each tab based on filtered data
  const dynamicPcsPagination = useMemo(() => {
    const totalCount = sortedPcs.length;
    const itemsPerPage = pagination.pcs.itemsPerPage;
    const currentPage = pagination.pcs.currentPage;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    // If we have all data and it fits in one page, show all items
    const effectiveItemsPerPage = totalCount <= itemsPerPage ? totalCount : itemsPerPage;
    
    return {
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      itemsPerPage: effectiveItemsPerPage,
      totalCount,
      totalPages: totalCount <= itemsPerPage ? 1 : totalPages
    };
  }, [sortedPcs.length, pagination.pcs.currentPage, pagination.pcs.itemsPerPage]);

  const dynamicMonitorsPagination = useMemo(() => {
    const totalCount = sortedMonitors.length;
    const itemsPerPage = pagination.monitors.itemsPerPage;
    const currentPage = pagination.monitors.currentPage;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    const effectiveItemsPerPage = totalCount <= itemsPerPage ? totalCount : itemsPerPage;
    
    return {
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      itemsPerPage: effectiveItemsPerPage,
      totalCount,
      totalPages: totalCount <= itemsPerPage ? 1 : totalPages
    };
  }, [sortedMonitors.length, pagination.monitors.currentPage, pagination.monitors.itemsPerPage]);

  const dynamicSmartphonesPagination = useMemo(() => {
    const totalCount = sortedSmartphones.length;
    const itemsPerPage = pagination.smartphones.itemsPerPage;
    const currentPage = pagination.smartphones.currentPage;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    const effectiveItemsPerPage = totalCount <= itemsPerPage ? totalCount : itemsPerPage;
    
    return {
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      itemsPerPage: effectiveItemsPerPage,
      totalCount,
      totalPages: totalCount <= itemsPerPage ? 1 : totalPages
    };
  }, [sortedSmartphones.length, pagination.smartphones.currentPage, pagination.smartphones.itemsPerPage]);

  const dynamicOthersPagination = useMemo(() => {
    const totalCount = sortedOthers.length;
    const itemsPerPage = pagination.others.itemsPerPage;
    const currentPage = pagination.others.currentPage;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    
    const effectiveItemsPerPage = totalCount <= itemsPerPage ? totalCount : itemsPerPage;
    
    return {
      currentPage: Math.min(currentPage, Math.max(1, totalPages)),
      itemsPerPage: effectiveItemsPerPage,
      totalCount,
      totalPages: totalCount <= itemsPerPage ? 1 : totalPages
    };
  }, [sortedOthers.length, pagination.others.currentPage, pagination.others.itemsPerPage]);

  // Apply client-side pagination to sorted data
  const paginatedPcs = useMemo(() => {
    const startIndex = (dynamicPcsPagination.currentPage - 1) * dynamicPcsPagination.itemsPerPage;
    const endIndex = startIndex + dynamicPcsPagination.itemsPerPage;
    return sortedPcs.slice(startIndex, endIndex);
  }, [sortedPcs, dynamicPcsPagination]);

  const paginatedMonitors = useMemo(() => {
    const startIndex = (dynamicMonitorsPagination.currentPage - 1) * dynamicMonitorsPagination.itemsPerPage;
    const endIndex = startIndex + dynamicMonitorsPagination.itemsPerPage;
    return sortedMonitors.slice(startIndex, endIndex);
  }, [sortedMonitors, dynamicMonitorsPagination]);

  const paginatedSmartphones = useMemo(() => {
    const startIndex = (dynamicSmartphonesPagination.currentPage - 1) * dynamicSmartphonesPagination.itemsPerPage;
    const endIndex = startIndex + dynamicSmartphonesPagination.itemsPerPage;
    return sortedSmartphones.slice(startIndex, endIndex);
  }, [sortedSmartphones, dynamicSmartphonesPagination]);

  const paginatedOthers = useMemo(() => {
    const startIndex = (dynamicOthersPagination.currentPage - 1) * dynamicOthersPagination.itemsPerPage;
    const endIndex = startIndex + dynamicOthersPagination.itemsPerPage;
    return sortedOthers.slice(startIndex, endIndex);
  }, [sortedOthers, dynamicOthersPagination]);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    resetPagination(activeTab as keyof typeof pagination);
  }, [filters, activeTab, resetPagination]);

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

    return (
      <Tabs value={activeTab} onValueChange={(newTab) => {
        setActiveTab(newTab);
        // No need to fetch data since we have all data loaded
      }} className="flex flex-col flex-grow min-h-0 pt-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto shrink-0">
        <TabsTrigger value="pcs" className="py-1">
          <Laptop className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.pcs')}
        </TabsTrigger>
        <TabsTrigger value="monitors" className="py-1">
          <Monitor className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.monitors')}
        </TabsTrigger>
        <TabsTrigger value="smartphones" className="py-1">
          <Smartphone className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.smartphones')}
        </TabsTrigger>
        <TabsTrigger value="others" className="py-1">
          <KeyRound className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.others')}
        </TabsTrigger>
        </TabsList>

        <TabsContent value="pcs" className="relative flex-grow flex flex-col">
          <PcTab
            assets={paginatedPcs}
            columns={tableColumns}
            pagination={dynamicPcsPagination}
            onPageChange={(page) => updatePagination('pcs', { currentPage: page })}
            onRowClick={(asset) => openForm(asset)}
            onSort={(column) => handleSort(column as keyof PcAsset)}
            sortConfig={sortConfig}
            emptyStateIcon={Laptop}
            emptyStateTitle={t('pages.inventory.empty_state.pcs.title')}
            emptyStateDescription={t('pages.inventory.empty_state.pcs.description')}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
            getEmployeeName={getEmployeeName}
          />
        </TabsContent>
        <TabsContent value="monitors" className="relative flex-grow flex flex-col">
          <MonitorTab
            assets={paginatedMonitors}
            columns={tableColumns}
            pagination={dynamicMonitorsPagination}
            onPageChange={(page) => updatePagination('monitors', { currentPage: page })}
            onRowClick={handleEdit}
            onSort={(column) => handleSort(column)}
            sortConfig={sortConfig}
            emptyStateIcon={Monitor}
            emptyStateTitle={t('pages.inventory.empty_state.monitors.title')}
            emptyStateDescription={t('pages.inventory.empty_state.monitors.description')}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
            getEmployeeName={(asset) => (asset as any).employee?.name || asset.userId || '-'}
          />
        </TabsContent>
        <TabsContent value="smartphones" className="relative flex-grow flex flex-col">
          <SmartphoneTab
            assets={paginatedSmartphones}
            columns={tableColumns}
            pagination={dynamicSmartphonesPagination}
            onPageChange={(page) => updatePagination('smartphones', { currentPage: page })}
            onRowClick={handleEdit}
            onSort={(column) => handleSort(column as keyof PcAsset)}
            sortConfig={sortConfig}
            emptyStateIcon={Smartphone}
            emptyStateTitle={t('pages.inventory.empty_state.smartphones.title')}
            emptyStateDescription={t('pages.inventory.empty_state.smartphones.description')}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
            getEmployeeName={(asset) => (asset as any).employee?.name || asset.userId || '-'}
          />
        </TabsContent>
        <TabsContent value="others" className="relative flex-grow flex flex-col">
          <OthersTab
            assets={paginatedOthers}
            columns={tableColumns}
            pagination={dynamicOthersPagination}
            onPageChange={(page) => updatePagination('others', { currentPage: page })}
            onRowClick={handleEdit}
            onSort={(column) => handleSort(column as keyof PcAsset)}
            sortConfig={sortConfig}
            emptyStateIcon={KeyRound}
            emptyStateTitle={t('pages.inventory.empty_state.others.title')}
            emptyStateDescription={t('pages.inventory.empty_state.others.description')}
            getStatusBadgeVariant={getStatusBadgeVariant}
            getStatusText={getStatusText}
            getEmployeeName={(asset) => (asset as any).employee?.name || asset.userId || '-'}
          />
        </TabsContent>
      </Tabs>
    );
  }

  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Fetch ALL assets from the server (not just current page)
      const allAssetsResult = await getAllAssetsFromGraphQL(1, PAGINATION_DEFAULTS.MAX_EXPORT_ITEMS);

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
      const exportColumnOrder = [...EXPORT_COLUMN_ORDER];

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
          // Use Japanese header if available, otherwise fall back to system field display name or field name
          const displayName = JAPANESE_HEADERS[field] ||
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
      const blob = new Blob([csvContent], { type: IMPORT_EXPORT.EXPORT_MIME_TYPE });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${IMPORT_EXPORT.EXPORT_FILENAME_PREFIX}${new Date().toISOString().split('T')[0]}${IMPORT_EXPORT.EXPORT_FILE_EXTENSION}`);
      link.setAttribute('download', `${IMPORT_EXPORT.EXPORT_FILENAME_PREFIX}${new Date().toISOString().split('T')[0]}${IMPORT_EXPORT.EXPORT_FILE_EXTENSION}`);
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
    <ErrorBoundary>
      <Card className="h-full flex flex-col max-h-screen">
        <CardContent className="p-4 flex flex-col flex-grow min-h-0">
          <FiltersSection
              filters={filters}
              setFilters={setFilters}
              inputValues={inputValues}
              setInputValues={setInputValues}
              masterDataState={masterDataState}
              onImport={() => setIsImportDialogOpen(true)}
              onExport={() => setIsExportDialogOpen(true)}
              onAddNew={handleAddNew}
              onRefresh={() => fetchAllData()}
              onSearch={handleSearch}
              onClearSearch={handleClearSearch}
              onDetailedSearch={() => setIsDetailedSearchOpen(true)}
              isExporting={isExporting}
              isLoadingGraphQL={isLoadingGraphQL}
              globalInputRef={globalInputRef}
              employeeInputRef={employeeInputRef}
              onFilterChange={handleFilterChange}
                        onKeyPress={handleKeyPress}
              allStatuses={allStatuses}
              getStatusText={getStatusText}
          />
          <AssetFormDialog
              isOpen={isFormOpen}
              onOpenChange={closeForm}
              onSubmit={(data) => hookHandleSubmit(data, onSubmit)}
              onDelete={() => setIsDeleteDialogOpen(true)}
              isPending={isPending}
              currentAsset={selectedAsset}
              locations={masterDataState.locations}
              employees={masterDataState.employees}
              allStatuses={allStatuses}
              getDisplayName={getDisplayName}
              form={form}
              getAssetTypeDisplayName={getAssetTypeDisplayName}
          />
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
                  {/* Hidden ID fields for editing */}
                  <FormField control={form.control} name="id" render={({ field }) => (
                    <input type="hidden" {...field} />
                  )} />
                  <FormField control={form.control} name="assetId" render={({ field }) => (
                    <input type="hidden" {...field} />
                  )} />
                  
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
                              return currentAsset.asset.assetId;
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
                      <FormField control={form.control} name="purchaseDate" render={({ field }) => (
                        <FormItem className="">
                          <FormLabel>{getDisplayName('purchaseDate')}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" onSelect={field.onChange} initialFocus /></PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )} />
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
                {selectedAsset && (
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

      <ImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={() => setIsImportDialogOpen(false)}
        systemFields={systemFields}
        getDisplayName={getDisplayName}
        fileEncoding={fileEncoding}
        setFileEncoding={setFileEncoding}
        fileInputRef={fileInputRef}
        handleImportFile={handleImportFile}
        fileName={fileName}
        fileData={fileData}
        fileBuffer={fileBuffer}
        fileHeaders={fileHeaders}
        mappings={mappings}
        handleMappingChange={handleMappingChange}
        handleAiMatch={handleAiMatch}
        isMappingAiLoading={isMappingAiLoading}
        isPending={isPending}
        handleConfirmImport={handleConfirmImport}
        importProgress={importProgress}
        onError={(title, description) => setErrorDialogState({ isOpen: true, title, description: String(description) })}
      />
      <ImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={() => setIsImportDialogOpen(false)}
        systemFields={systemFields}
        getDisplayName={getDisplayName}
        fileEncoding={fileEncoding}
        setFileEncoding={setFileEncoding}
        fileInputRef={fileInputRef}
        handleImportFile={handleImportFile}
        fileName={fileName}
        fileData={fileData}
        fileBuffer={fileBuffer}
        fileHeaders={fileHeaders}
        mappings={mappings}
        handleMappingChange={handleMappingChange}
        handleAiMatch={handleAiMatch}
        isMappingAiLoading={isMappingAiLoading}
        isPending={isPending}
        handleConfirmImport={handleConfirmImport}
        importProgress={importProgress}
        onError={(title, description) => setErrorDialogState({ isOpen: true, title, description: String(description) })}
      />

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

      <ImportProgressDialog 
        isOpen={isImportProgressDialogOpen}
        progress={importProgress}
        isImporting={isImporting}
        summary={importSummary}
        onClose={() => {
                    setIsImportProgressDialogOpen(false);
                    setImportSummary(null);
                  }}
      />

      {selectedAsset && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {(() => {
                  const currentAsset = getCurrentAsset();
                  return t('actions.delete_confirm_message', { item: currentAsset?.asset.assetId || currentAsset?.asset.id || 'this asset' });
                })()}
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
          <ExportDialog 
            isOpen={isExportDialogOpen} 
            onOpenChange={setIsExportDialogOpen} 
            onExport={handleExport} 
            isExporting={isExporting} 
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClearDetailedSearch}>{t('actions.clear')}</Button>
            <DialogClose asChild><Button type="button" variant="secondary">{t('actions.cancel')}</Button></DialogClose>
            <Button type="submit" form="detailed-search-form">{t('actions.search')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExportDialog 
        isOpen={isExportDialogOpen} 
        onOpenChange={setIsExportDialogOpen} 
        onExport={handleExport} 
        isExporting={isExporting} 
      />
    </ErrorBoundary>
  )
}
