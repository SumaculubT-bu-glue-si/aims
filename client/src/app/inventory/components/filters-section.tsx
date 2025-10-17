"use client"

import React, { memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  SlidersHorizontal, 
  Upload, 
  Download, 
  FilePlus2, 
  RefreshCw, 
  Search, 
  X, 
  ChevronDown,
  Loader 
} from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from "@/lib/utils"

interface FiltersSectionProps {
  // Filter state
  filters: {
    locations: string[];
    statuses: string[];
    employee: string;
    global: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{ locations: string[]; statuses: string[]; employee: string; global: string; }>>;
  
  // Input values
  inputValues: { employee: string; global: string };
  setInputValues: (values: any) => void;
  
  // Master data
  masterDataState: {
    locations: { id: string; name: string; }[];
    projects: { id: string; name: string; }[];
    employees: { id: string; name: string; }[];
  };
  
  // Actions
  onImport: () => void;
  onExport: () => void;
  onAddNew: () => void;
  onRefresh: () => void;
  onSearch: () => void;
  onClearSearch: () => void;
  onDetailedSearch: () => void;
  
  // Loading states
  isExporting: boolean;
  isLoadingGraphQL: boolean;
  
  // Refs
  globalInputRef: React.RefObject<HTMLInputElement>;
  employeeInputRef: React.RefObject<HTMLInputElement>;
  
  // Event handlers
  onFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  
  // Status options
  allStatuses: string[];
  getStatusText: (status: string) => string;
}

export const FiltersSection = memo(function FiltersSection({
  filters,
  setFilters,
  inputValues,
  setInputValues,
  masterDataState,
  onImport,
  onExport,
  onAddNew,
  onRefresh,
  onSearch,
  onClearSearch,
  onDetailedSearch,
  isExporting,
  isLoadingGraphQL,
  globalInputRef,
  employeeInputRef,
  onFilterChange,
  onKeyPress,
  allStatuses,
  getStatusText,
}: FiltersSectionProps) {
  const { t } = useI18n();

  return (
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
                <Button variant="outline" onClick={onImport}>
                  <Upload className="mr-2 h-4 w-4" /> {t('pages.inventory.import')}
                </Button>
                <Button variant="outline" onClick={onExport} disabled={isExporting}>
                  {isExporting ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? t('pages.inventory.exporting') : t('pages.inventory.export')}
                </Button>
                <Button onClick={onAddNew}>
                  <FilePlus2 className="mr-2 h-4 w-4" /> {t('pages.inventory.add_new_asset')}
                </Button>
                <Button
                  variant="outline"
                  onClick={onRefresh}
                  disabled={isLoadingGraphQL}
                >
                  <RefreshCw className={cn("mr-2 h-4 w-4", isLoadingGraphQL && "animate-spin")} />
                  {isLoadingGraphQL ? t('actions.loading') : t('actions.refresh')}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {/* Global Search */}
              <div className="flex gap-2 sm:col-span-2">
                <Input
                  name="global"
                  placeholder={t('pages.inventory.filter_all')}
                  defaultValue={inputValues.global}
                  onChange={onFilterChange}
                  onKeyPress={onKeyPress}
                  className="bg-background flex-1"
                  ref={globalInputRef}
                />
                <Button
                  variant="outline"
                  onClick={onSearch}
                  className="px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {(inputValues.global || filters.global) && (
                  <Button
                    variant="outline"
                    onClick={onClearSearch}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Location Filter */}
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

              {/* Employee Search */}
              <div className="flex gap-2">
                <Input
                  name="employee"
                  placeholder={t('pages.inventory.filter_user')}
                  defaultValue={inputValues.employee}
                  onChange={onFilterChange}
                  onKeyPress={onKeyPress}
                  className="bg-background flex-1"
                  ref={employeeInputRef}
                />
                <Button
                  variant="outline"
                  onClick={onSearch}
                  className="px-3"
                >
                  <Search className="h-4 w-4" />
                </Button>
                {(inputValues.employee || filters.employee) && (
                  <Button
                    variant="outline"
                    onClick={onClearSearch}
                    className="px-3"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Status Filter */}
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
              <Button variant="outline" onClick={onDetailedSearch}>
                <Search className="mr-2 h-4 w-4" />
                {t('pages.inventory.detailed_search_title')}
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
})