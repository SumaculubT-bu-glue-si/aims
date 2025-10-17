import { useState, useCallback, useRef } from 'react'
import { PcFormValues } from '@/lib/types/index'

interface Filters {
  locations: string[];
  statuses: string[];
  employee: string;
  global: string;
}

interface InputValues {
  employee: string;
  global: string;
}

export function useAssetFilters() {
  const [filters, setFilters] = useState<Filters>({
    locations: [],
    statuses: [],
    employee: "",
    global: ""
  });

  const [inputValues, setInputValues] = useState<InputValues>({ 
    employee: "", 
    global: "" 
  });

  const [detailedFilters, setDetailedFilters] = useState<Partial<PcFormValues>>({});
  
  const inputValuesRef = useRef({ employee: "", global: "" });
  const globalInputRef = useRef<HTMLInputElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues(prev => ({ ...prev, [name]: value }));
    inputValuesRef.current = { ...inputValuesRef.current, [name]: value };
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, []);

  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      global: inputValues.global,
      employee: inputValues.employee
    }));
  }, [inputValues]);

  const handleClearSearch = useCallback(() => {
    setInputValues({ employee: "", global: "" });
    setFilters(prev => ({
      ...prev,
      global: "",
      employee: ""
    }));
    if (globalInputRef.current) globalInputRef.current.value = "";
    if (employeeInputRef.current) employeeInputRef.current.value = "";
  }, []);

  const updateDetailedFilters = useCallback((newFilters: Partial<PcFormValues>) => {
    setDetailedFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearDetailedFilters = useCallback(() => {
    setDetailedFilters({});
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      locations: [],
      statuses: [],
      employee: "",
      global: ""
    });
    setInputValues({ employee: "", global: "" });
    setDetailedFilters({});
  }, []);

  return {
    // State
    filters,
    inputValues,
    detailedFilters,
    
    // Refs
    globalInputRef,
    employeeInputRef,
    inputValuesRef,
    
    // Actions
    setFilters,
    setInputValues,
    setDetailedFilters,
    handleFilterChange,
    handleKeyPress,
    handleSearch,
    handleClearSearch,
    updateDetailedFilters,
    clearDetailedFilters,
    resetFilters
  };
}