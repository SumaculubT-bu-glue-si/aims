import { useState, useRef, useCallback, useEffect } from 'react'
import { 
  getPcsFromGraphQL, 
  getMonitorsFromGraphQL, 
  getPhonesFromGraphQL, 
  getOthersFromGraphQL,
  getMasterDataFromGraphQL 
} from '../actions'
import { FrontendAsset, PcFormValues, AssetField } from '@/lib/types/index'
import { toSnakeCase } from '../utils/string-helpers'

interface InventoryData {
  pcs: FrontendAsset[];
  monitors: FrontendAsset[];
  smartphones: FrontendAsset[];
  others: FrontendAsset[];
}

interface PaginationState {
  pcs: { currentPage: number; itemsPerPage: number; totalCount: number };
  monitors: { currentPage: number; itemsPerPage: number; totalCount: number };
  smartphones: { currentPage: number; itemsPerPage: number; totalCount: number };
  others: { currentPage: number; itemsPerPage: number; totalCount: number };
}

interface Filters {
  locations: string[];
  statuses: string[];
  employee: string;
  global: string;
  details?: Partial<PcFormValues>;
}

interface SortConfig {
  key: keyof FrontendAsset;
  direction: 'asc' | 'desc';
}

interface UseInventoryDataProps {
  initialLocations?: { id: string; name: string; }[];
  initialEmployees?: { id: string; name: string; }[];
  initialProjects?: { id: string; name: string; }[];
  initialSystemFields?: AssetField[];
}

export function useInventoryData(props?: UseInventoryDataProps) {
  const [inventory, setInventory] = useState<InventoryData>({
    pcs: [],
    monitors: [],
    smartphones: [],
    others: [],
  });

  const [pagination, setPagination] = useState<PaginationState>({
    pcs: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    monitors: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    smartphones: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
    others: { currentPage: 1, itemsPerPage: 100, totalCount: 0 },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const requestSeqRef = useRef({ pcs: 0, monitors: 0, smartphones: 0, others: 0 });
  const [pageCache, setPageCache] = useState<{
    pcs: Record<number, FrontendAsset[]>;
    monitors: Record<number, FrontendAsset[]>;
    smartphones: Record<number, FrontendAsset[]>;
    others: Record<number, FrontendAsset[]>;
  }>({ pcs: {}, monitors: {}, smartphones: {}, others: {} });

  const updatePagination = useCallback((tab: keyof PaginationState, updates: Partial<PaginationState['pcs']>) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates }
    }));
  }, []);

  const resetPagination = useCallback((tab: keyof PaginationState) => {
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], currentPage: 1 }
    }));
  }, []);

  const fetchPcs = useCallback(async (page: number, filters: Filters, sortConfig: SortConfig | null) => {
    try {
      const seq = ++requestSeqRef.current.pcs;
      const { pcs, pagination: pageInfo } = await getPcsFromGraphQL(page, 100, {
        ...filters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      
      if (seq !== requestSeqRef.current.pcs) return; // stale request

      setPageCache(prev => ({ ...prev, pcs: { ...prev.pcs, [page]: pcs } }));
      setInventory(prev => ({ ...prev, pcs }));
      updatePagination('pcs', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error fetching PCs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch PCs');
    }
  }, [updatePagination]);

  // Fetch all PCs data for client-side filtering and pagination
  const fetchAllPcs = useCallback(async () => {
    try {
      const seq = ++requestSeqRef.current.pcs;
      // Fetch a large number to get all data
      const { pcs, pagination: pageInfo } = await getPcsFromGraphQL(1, 10000, {
        sort_field: 'asset_id',
        sort_direction: 'asc',
      });
      
      if (seq !== requestSeqRef.current.pcs) return; // stale request

      setInventory(prev => ({ ...prev, pcs }));
      updatePagination('pcs', {
        currentPage: 1,
        totalCount: pageInfo?.total || pcs.length
      });
    } catch (error) {
      console.error('Error fetching all PCs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch all PCs');
    }
  }, [updatePagination]);

  const fetchMonitors = useCallback(async (page: number, filters: Filters, sortConfig: SortConfig | null) => {
    try {
      const seq = ++requestSeqRef.current.monitors;
      const { monitors, pagination: pageInfo } = await getMonitorsFromGraphQL(page, 100, {
        ...filters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      
      if (seq !== requestSeqRef.current.monitors) return;

      setPageCache(prev => ({ ...prev, monitors: { ...prev.monitors, [page]: monitors } }));
      setInventory(prev => ({ ...prev, monitors }));
      updatePagination('monitors', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch monitors');
    }
  }, [updatePagination]);

  const fetchSmartphones = useCallback(async (page: number, filters: Filters, sortConfig: SortConfig | null) => {
    try {
      const seq = ++requestSeqRef.current.smartphones;
      const { phones, pagination: pageInfo } = await getPhonesFromGraphQL(page, 100, {
        ...filters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      
      if (seq !== requestSeqRef.current.smartphones) return;

      setPageCache(prev => ({ ...prev, smartphones: { ...prev.smartphones, [page]: phones } }));
      setInventory(prev => ({ ...prev, smartphones: phones }));
      updatePagination('smartphones', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error fetching smartphones:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch smartphones');
    }
  }, [updatePagination]);

  const fetchOthers = useCallback(async (page: number, filters: Filters, sortConfig: SortConfig | null) => {
    try {
      const seq = ++requestSeqRef.current.others;
      const { others, pagination: pageInfo } = await getOthersFromGraphQL(page, 100, {
        ...filters,
        sort_field: sortConfig ? toSnakeCase(sortConfig.key) : 'asset_id',
        sort_direction: sortConfig?.direction || 'asc',
      });
      
      if (seq !== requestSeqRef.current.others) return;

      setPageCache(prev => ({ ...prev, others: { ...prev.others, [page]: others } }));
      setInventory(prev => ({ ...prev, others }));
      updatePagination('others', {
        currentPage: pageInfo?.currentPage || page,
        totalCount: pageInfo?.total || 0
      });
    } catch (error) {
      console.error('Error fetching others:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch others');
    }
  }, [updatePagination]);

  const fetchMasterData = useCallback(async () => {
    try {
      const masterData = await getMasterDataFromGraphQL();
      
      return {
        locations: masterData.locations || [],
        employees: masterData.employees || [],
        projects: masterData.projects || []
      };
    } catch (error) {
      console.error('Error fetching master data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch master data');
      return { locations: [], employees: [], projects: [] };
    }
  }, []);

  const [masterDataState, setMasterDataState] = useState<{
    locations: { id: string; name: string; }[];
    projects: { id: string; name: string; }[];
    employees: { id: string; name: string; }[];
  }>({
    locations: props?.initialLocations || [],
    projects: props?.initialProjects || [],
    employees: props?.initialEmployees || [],
  });
  
  const [systemFields, setSystemFields] = useState<AssetField[]>(props?.initialSystemFields || []);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FrontendAsset; direction: 'asc' | 'desc' } | null>(null);
  const [activeTab, setActiveTab] = useState("pcs");
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Fetch data with server-side pagination and filtering
  const fetchDataWithPagination = useCallback(async (filters: Filters, tab: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Only fetch master data if it's not already available (from initial props)
      if (!isInitialLoadComplete && masterDataState.locations.length === 0) {
        const masterData = await fetchMasterData();
        setMasterDataState(masterData);
      }
      
      // Fetch data for the specific tab with server-side filtering
      const targetTab = tab || activeTab;
      const currentPage = pagination[targetTab as keyof typeof pagination].currentPage;
      
      switch (targetTab) {
        case 'pcs':
          await fetchPcs(currentPage, filters, sortConfig);
          break;
        case 'monitors':
          await fetchMonitors(currentPage, filters, sortConfig);
          break;
        case 'smartphones':
          await fetchSmartphones(currentPage, filters, sortConfig);
          break;
        case 'others':
          await fetchOthers(currentPage, filters, sortConfig);
          break;
      }

      setIsInitialLoadComplete(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMasterData, fetchPcs, fetchMonitors, fetchSmartphones, fetchOthers, isInitialLoadComplete, activeTab, pagination, sortConfig]);

  // Fetch all data for client-side filtering and pagination
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Only fetch master data if it's not already available (from initial props)
      if (!isInitialLoadComplete && masterDataState.locations.length === 0) {
        const masterData = await fetchMasterData();
        setMasterDataState(masterData);
      }
      
      // Fetch all data for all asset types (no limit)
      const [pcsResult, monitorsResult, smartphonesResult, othersResult] = await Promise.all([
        getPcsFromGraphQL(1, 999999, { sort_field: 'asset_id', sort_direction: 'asc' }),
        getMonitorsFromGraphQL(1, 999999, { sort_field: 'asset_id', sort_direction: 'asc' }),
        getPhonesFromGraphQL(1, 999999, { sort_field: 'asset_id', sort_direction: 'asc' }),
        getOthersFromGraphQL(1, 999999, { sort_field: 'asset_id', sort_direction: 'asc' })
      ]);

      // Set all inventory data
      setInventory({
        pcs: pcsResult.pcs,
        monitors: monitorsResult.monitors,
        smartphones: smartphonesResult.phones,
        others: othersResult.others
      });

      // Update pagination with total counts
      updatePagination('pcs', { currentPage: 1, totalCount: pcsResult.pagination?.total || pcsResult.pcs.length });
      updatePagination('monitors', { currentPage: 1, totalCount: monitorsResult.pagination?.total || monitorsResult.monitors.length });
      updatePagination('smartphones', { currentPage: 1, totalCount: smartphonesResult.pagination?.total || smartphonesResult.phones.length });
      updatePagination('others', { currentPage: 1, totalCount: othersResult.pagination?.total || othersResult.others.length });

      setIsInitialLoadComplete(true);
    } catch (error) {
      console.error('Error fetching all data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch all data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMasterData, isInitialLoadComplete, updatePagination]);

  // Enhanced page change handler with caching
  const handlePageChange = useCallback(async (tab: keyof PaginationState, page: number, filters?: Filters, sortConfig?: SortConfig | null) => {
    updatePagination(tab, { currentPage: page });
    setIsLoading(true);

    try {
      // Use default filters and sortConfig if not provided
      const defaultFilters = filters || { locations: [], statuses: [], employee: '', global: '' };
      const defaultSortConfig = sortConfig || null;

      // Check cache first for instant display
      const cacheKey = tab as keyof typeof pageCache;
      if (pageCache[cacheKey][page]) {
        setInventory(prev => ({ ...prev, [tab]: pageCache[cacheKey][page] }));
        return;
      }

      // Fetch from server if not cached
      switch (tab) {
        case 'pcs':
          await fetchPcs(page, defaultFilters, defaultSortConfig);
          break;
        case 'monitors':
          await fetchMonitors(page, defaultFilters, defaultSortConfig);
          break;
        case 'smartphones':
          await fetchSmartphones(page, defaultFilters, defaultSortConfig);
          break;
        case 'others':
          await fetchOthers(page, defaultFilters, defaultSortConfig);
          break;
      }
    } catch (error) {
      console.error(`Error changing page for ${tab}:`, error);
      setError(error instanceof Error ? error.message : `Failed to change page for ${tab}`);
    } finally {
      setIsLoading(false);
    }
  }, [pageCache, fetchPcs, fetchMonitors, fetchSmartphones, fetchOthers, updatePagination]);

  // Clear cache for a specific tab (useful when filters change)
  const clearCache = useCallback((tab: keyof PaginationState) => {
    setPageCache(prev => ({
      ...prev,
      [tab]: {}
    }));
  }, []);

  // Clear all caches
  const clearAllCaches = useCallback(() => {
    setPageCache({ pcs: {}, monitors: {}, smartphones: {}, others: {} });
  }, []);

  const handleSort = useCallback((key: keyof FrontendAsset) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    // For client-side sorting, no server requests needed
    // The sorting will be handled by the useMemo hooks in the main component
  }, [sortConfig]);


  return {
    // State
    inventory,
    pagination,
    isLoading,
    error,
    pageCache,
    
    // Actions
    fetchPcs,
    fetchMonitors,
    fetchSmartphones,
    fetchOthers,
    fetchMasterData,
    fetchAllData,
    updatePagination,
    resetPagination,
    handlePageChange,
    clearCache,
    clearAllCaches,
    
    // Setters
    setInventory,
    setPagination,
    setError,
    setIsLoading,

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
    handleSort
  };
}
