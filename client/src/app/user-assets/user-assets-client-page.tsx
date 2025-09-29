

"use client"

import { useState, useMemo, useEffect } from "react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Trash2, PlusCircle, AlertTriangle, Check, ChevronsUpDown, SlidersHorizontal, Laptop, Monitor, Smartphone, ChevronDown, ArrowUp, ArrowDown, Calendar as CalendarIcon, PackageCheck, Package, Search, User, Briefcase, Edit, Loader2 } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { updateAsset, getAssetsOptimized, getAvailableAssets } from "./actions"
import { Label } from "@/components/ui/label"
import type { PcAsset } from "@/lib/schemas/inventory"
import { type AssetField } from "@/lib/schemas/settings"
import { format, isPast } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Pagination } from "@/components/ui/pagination"

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { fieldIdToSchemaKeyMap } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { enUS, ja } from "date-fns/locale";

type Asset = {
    id: string;
    asset_id?: string;
    model?: string;
    project?: string;
    type: string;
    userId?: string; // Employee name for display
    employeeId?: string; // Employee ID for internal operations
    location?: string;
    status?: string;
    notes?: string;
    hostname?: string;
    manufacturer?: string;
    partNumber?: string;
    serialNumber?: string;
    formFactor?: string;
    os?: string;
    osBit?: string;
    officeSuite?: string;
    softwareLicenseKey?: string;
    wiredMacAddress?: string;
    wiredIpAddress?: string;
    wirelessMacAddress?: string;
    wirelessIpAddress?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    depreciationYears?: string;
    depreciationDept?: string;
    cpu?: string;
    memory?: string;
    previousUser?: string;
    usageStartDate?: string;
    usageEndDate?: string;
    carryInOutAgreement?: string;
    lastUpdated?: string;
    updatedBy?: string;
    notes1?: string;
    notes2?: string;
    notes3?: string;
    notes4?: string;
    notes5?: string;
}

type Subscription = {
    id: number;
    name: string;
    project: string;
    user?: string;
    location?: string;
}

type UserAssetsClientPageProps = {
    initialMasterData: {
        locations: string[];
        projects: string[];
        employees: { id: string | undefined; name: string | undefined; }[];
    };
    initialInventory: {
        pcs: PcAsset[];
        monitors: any[];
        smartphones: any[];
        others: any[];
    };
    systemFields: AssetField[];
    initialError: string | null;
}

const allStatuses = ['返却済', '廃止', '保管(使用無)', '利用中', '保管中', '貸出中', '故障中', '利用予約'];



type AssetDialogFilters = {
    locations: string[];
    statuses: string[];
    global: string;
};

export default function UserAssetsClientPage({
    initialMasterData,
    initialInventory,
    systemFields,
    initialError,
}: UserAssetsClientPageProps) {
    const { t } = useI18n()
    const { toast } = useToast()

    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [displayedEmployees, setDisplayedEmployees] = useState<string[]>([]);

    const [locationFilter, setLocationFilter] = useState("All")
    const [projectFilter, setProjectFilter] = useState("All")
    const [statusFilter, setStatusFilter] = useState("active")
    const [selectedAssetType, setSelectedAssetType] = useState<string>("all")
    const [error, setError] = useState<string | null>(initialError);

    const [masterData, setMasterData] = useState(initialMasterData);
    const [inventory, setInventory] = useState(initialInventory);

    const [isEmployeeSelectorOpen, setIsEmployeeSelectorOpen] = useState(false)
    const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false)
    const [selectedAssetInDialog, setSelectedAssetInDialog] = useState<Asset | null>(null);
    const [currentEmployeeForAssignment, setCurrentEmployeeForAssignment] = useState<string | null>(null);
    const [currentEmployeeIdForAssignment, setCurrentEmployeeIdForAssignment] = useState<string | null>(null);

    // Helper function to get employee ID by name
    const getEmployeeId = (employeeName: string): string | undefined => {
        // First try to find the employee ID from the assets
        const assetWithEmployee = allAssets.find(asset => asset.userId === employeeName);
        if (assetWithEmployee?.employeeId) {
            return assetWithEmployee.employeeId;
        }

        // Fallback to masterData.employees if available
        const employee = masterData.employees.find(emp => emp.name === employeeName);
        return employee?.id;
    };

    const [isAssignmentDetailOpen, setIsAssignmentDetailOpen] = useState(false);
    const [assignmentDetails, setAssignmentDetails] = useState<{
        assignmentDate: Date | undefined,
        location: string,
        notes: string,
    }>({
        assignmentDate: new Date(),
        location: '',
        notes: '',
    });
    const [isEditAssetOpen, setIsEditAssetOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [editingEmployee, setEditingEmployee] = useState<string | null>(null);
    const [isUpdatingAsset, setIsUpdatingAsset] = useState(false);
    const [isAssigningAsset, setIsAssigningAsset] = useState(false);

    // Loading states
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [isLoadingAvailableAssets, setIsLoadingAvailableAssets] = useState(false);

    // Pagination state
    const [paginationState, setPaginationState] = useState<{ [key: string]: { currentPage: number; itemsPerPage: number } }>({});
    const defaultItemsPerPage = 10;



    // State for asset selector dialog
    const [assetDialogFilters, setAssetDialogFilters] = useState<AssetDialogFilters>({ locations: [], statuses: [], global: "" });
    const [assetDialogSortConfig, setAssetDialogSortConfig] = useState<{ key: keyof PcAsset; direction: 'asc' | 'desc' } | null>(null);
    const [assetDialogPagination, setAssetDialogPagination] = useState<{ [key: string]: { currentPage: number; itemsPerPage: number } }>({});
    const assetDialogItemsPerPage = 20;

    // State for employee list pagination
    const [employeeListPagination, setEmployeeListPagination] = useState<{ currentPage: number; itemsPerPage: number }>({ currentPage: 1, itemsPerPage: 5 });
    const employeeListItemsPerPage = 5;


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

    const getStatusText = (status?: string) => {
        if (!status) return "";
        return statusMapping[status] || status;
    }

    const getAssetTypeText = (type: string) => {
        const key = `pages.inventory.tabs.${type.toLowerCase()}`;
        const translated = t(key);
        return translated === key ? type : translated;
    }

    // Pagination helper functions
    const getPaginationState = (employeeName: string) => {
        if (!paginationState[employeeName]) {
            setPaginationState(prev => ({
                ...prev,
                [employeeName]: { currentPage: 1, itemsPerPage: defaultItemsPerPage }
            }));
            return { currentPage: 1, itemsPerPage: defaultItemsPerPage };
        }
        return paginationState[employeeName];
    };

    const handlePageChange = (employeeName: string, page: number) => {
        setPaginationState(prev => ({
            ...prev,
            [employeeName]: { ...prev[employeeName], currentPage: page }
        }));
    };

    const getPaginatedAssets = (assets: Asset[], employeeName: string) => {
        const pagination = getPaginationState(employeeName);
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        return assets.slice(startIndex, endIndex);
    };

    // Asset dialog pagination helper functions
    const getAssetDialogPaginationState = (tabKey: string) => {
        if (!assetDialogPagination[tabKey]) {
            setAssetDialogPagination(prev => ({
                ...prev,
                [tabKey]: { currentPage: 1, itemsPerPage: assetDialogItemsPerPage }
            }));
            return { currentPage: 1, itemsPerPage: assetDialogItemsPerPage };
        }
        return assetDialogPagination[tabKey];
    };

    const handleAssetDialogPageChange = (tabKey: string, page: number) => {
        setAssetDialogPagination(prev => ({
            ...prev,
            [tabKey]: { ...prev[tabKey], currentPage: page }
        }));
    };

    const getPaginatedAssetsForDialog = (assets: any[], tabKey: string) => {
        const pagination = getAssetDialogPaginationState(tabKey);
        const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
        const endIndex = startIndex + pagination.itemsPerPage;
        return assets.slice(startIndex, endIndex);
    };

    // Employee list pagination helper functions
    const getPaginatedEmployees = (employees: string[]) => {
        const startIndex = (employeeListPagination.currentPage - 1) * employeeListItemsPerPage;
        const endIndex = startIndex + employeeListItemsPerPage;
        return employees.slice(startIndex, endIndex);
    };

    const handleEmployeeListPageChange = (page: number) => {
        setEmployeeListPagination(prev => ({ ...prev, currentPage: page }));
    };

    const [allAssets, setAllAssets] = useState<Asset[]>(() => [
        ...inventory.pcs.map(pc => ({ ...pc, type: 'pcs' })),
        ...inventory.monitors.map(monitor => ({ ...monitor, type: 'monitors' })),
        ...inventory.smartphones.map(phone => ({ ...phone, type: 'smartphones' })),
        ...inventory.others.map(other => ({ ...other, type: 'others' }))
    ]);

    const allSubscriptions: Subscription[] = [];

    const filteredEmployees = useMemo(() => {
        const employeesInFilter = new Set<string>();

        const userItems = [...allAssets, ...allSubscriptions];

        userItems.forEach(item => {
            const itemLocation = 'location' in item ? item.location : undefined;
            const itemUserId = 'userId' in item ? item.userId : undefined;

            if (locationFilter === 'All') {
                if (itemUserId) employeesInFilter.add(itemUserId);
            } else if (locationFilter === '本人所持') {
                if (itemUserId) employeesInFilter.add(itemUserId);
            } else {
                if (itemLocation === locationFilter && itemUserId) {
                    employeesInFilter.add(itemUserId);
                }
            }
        });

        // Only show employees who actually have assets assigned to them
        // Don't add all employees from master data - only show those with assets

        const employeesWithProject = new Set<string>();
        if (projectFilter !== 'All') {
            userItems.forEach(item => {
                const itemProject = 'project' in item ? item.project : undefined;
                const itemUserId = 'userId' in item ? item.userId : undefined;
                if (itemProject === projectFilter && itemUserId) {
                    employeesWithProject.add(itemUserId);
                }
            });
            return Array.from(employeesWithProject).filter(e => employeesInFilter.has(e)).sort();
        }

        return Array.from(employeesInFilter).sort();
    }, [locationFilter, projectFilter, allAssets, allSubscriptions]);

    const loadAssets = async () => {
        if (isLoadingAssets || allAssets.length > 0) return; // Don't reload if already loading or has data

        try {
            setIsLoadingAssets(true);
            const result = await getAssetsOptimized({
                onlyAssigned: false,
                perPage: 1000 // Load first 100 assigned assets
            });

            if (result.assets) {
                const transformedAssets = result.assets.map(asset => ({
                    id: asset.asset_id,
                    asset_id: asset.asset_id,
                    type: asset.type,
                    hostname: asset.hostname || '',
                    manufacturer: asset.manufacturer || '',
                    model: asset.model || '',
                    partNumber: asset.part_number || '',
                    serialNumber: asset.serial_number || '',
                    formFactor: asset.form_factor || '',
                    os: asset.os || '',
                    osBit: asset.os_bit || '',
                    officeSuite: asset.office_suite || '',
                    softwareLicenseKey: asset.software_license_key || '',
                    wiredMacAddress: asset.wired_mac_address || '',
                    wiredIpAddress: asset.wired_ip_address || '',
                    wirelessMacAddress: asset.wireless_mac_address || '',
                    wirelessIpAddress: asset.wireless_ip_address || '',
                    purchaseDate: asset.purchase_date || '',
                    purchasePrice: asset.purchase_price?.toString() || '',
                    purchasePriceTaxIncluded: asset.purchase_price?.toString() || '', // Add missing required field
                    depreciationYears: asset.depreciation_years?.toString() || '',
                    depreciationDept: asset.depreciation_dept || '',
                    cpu: asset.cpu || '',
                    memory: asset.memory || '',
                    location: asset.location || '',
                    status: asset.status || '',
                    previousUser: asset.previous_user || '',
                    userId: asset.employee?.name || asset.user_id || '', // Employee name for display
                    employeeId: asset.employee?.id || asset.user_id || '', // Employee ID for internal operations
                    usageStartDate: asset.usage_start_date || '',
                    usageEndDate: asset.usage_end_date || '',
                    carryInOutAgreement: asset.carry_in_out_agreement || '',
                    lastUpdated: asset.last_updated || '',
                    updatedBy: asset.updated_by || '',
                    notes: asset.notes || '',
                    project: asset.project || '',
                    notes1: asset.notes1 || '',
                    notes2: asset.notes2 || '',
                    notes3: asset.notes3 || '',
                    notes4: asset.notes4 || '',
                    notes5: asset.notes5 || '',
                }));

                setAllAssets(transformedAssets);

                // Extract unique employees from assets and update masterData
                const uniqueEmployees = new Map<string, { id: string; name: string }>();

                result.assets?.forEach(asset => {
                    if (asset.employee && asset.employee.id && asset.employee.name) {
                        uniqueEmployees.set(asset.employee.name, {
                            id: asset.employee.id,
                            name: asset.employee.name
                        });
                    }
                });

                // Update masterData with employee information
                setMasterData(prev => ({
                    ...prev,
                    employees: Array.from(uniqueEmployees.values())
                }));

                // Update inventory state
                setInventory(prev => ({
                    ...prev,
                    pcs: transformedAssets.filter(asset => asset.type === 'pc'),
                    monitors: transformedAssets.filter(asset => asset.type === 'monitor'),
                    smartphones: transformedAssets.filter(asset => asset.type === 'phone'),
                    others: transformedAssets.filter(asset => !['pc', 'monitor', 'phone'].includes(asset.type)),
                }));
            }
        } catch (error) {
            console.error('Error loading assets:', error);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    const handleSearch = () => {
        if (selectedEmployees.length > 0) {
            setDisplayedEmployees(selectedEmployees);
        } else {
            setDisplayedEmployees(filteredEmployees);
        }
        // Reset pagination when search is performed
        setPaginationState({});
        setEmployeeListPagination({ currentPage: 1, itemsPerPage: 5 });
    }

    useEffect(() => {
        setDisplayedEmployees(filteredEmployees);
        // Reset pagination when filters change
        setPaginationState({});
        setEmployeeListPagination({ currentPage: 1, itemsPerPage: 5 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationFilter, projectFilter, statusFilter]);

    // Auto-populate displayed employees when filtered employees change (including initial load)
    useEffect(() => {
        if (filteredEmployees.length > 0 && displayedEmployees.length === 0) {
            setDisplayedEmployees(filteredEmployees);
        }
    }, [filteredEmployees, displayedEmployees.length]);

    useEffect(() => {
        // Load assets when component mounts if we don't have any
        if (allAssets.length === 0) {
            loadAssets();
        }
    }, []); // Only run once on mount

    useEffect(() => {
        // Load available assets when asset selector dialog opens
        if (isAssetSelectorOpen && availableAssets.pcs.length === 0) {
            loadAvailableAssets();
        }
    }, [isAssetSelectorOpen]); // Run when dialog opens

    useEffect(() => {
        setAllAssets([
            ...inventory.pcs.map(pc => ({ ...pc, type: 'pcs' })),
            ...inventory.monitors.map(monitor => ({ ...monitor, type: 'monitors' })),
            ...inventory.smartphones.map(phone => ({ ...phone, type: 'smartphones' })),
            ...inventory.others.map(other => ({ ...other, type: 'others' }))
        ]);
    }, [inventory]);

    const handleOpenAssignDialog = async (employeeName: string) => {
        const employeeId = getEmployeeId(employeeName);
        if (!employeeId) {
            toast({
                title: t('actions.error'),
                description: t('errors.employees.not_found'),
                variant: 'destructive'
            });
            return;
        }

        setCurrentEmployeeForAssignment(employeeName);
        setCurrentEmployeeIdForAssignment(employeeId || null);
        setAssetDialogFilters({ locations: [], statuses: [], global: "" });
        setSelectedAssetInDialog(null);
        // Reset asset dialog pagination
        setAssetDialogPagination({});
        setIsAssetSelectorOpen(true);
    }

    const handleSelectAssetForAssignment = () => {
        if (!selectedAssetInDialog) return;
        setAssignmentDetails({
            assignmentDate: new Date(),
            location: selectedAssetInDialog.location || '',
            notes: '',
        });
        setIsAssetSelectorOpen(false);
        setIsAssignmentDetailOpen(true);
    };

    const handleConfirmAssignment = async () => {
        if (!selectedAssetInDialog || !currentEmployeeForAssignment || !currentEmployeeIdForAssignment || !assignmentDetails.assignmentDate) return;

        try {
            setIsAssigningAsset(true);
            // Prepare the update data for the asset
            // Note: user_id should be the employee ID from the database
            // while the UI displays employee names for better user experience
            const updateData: any = {
                asset_id: selectedAssetInDialog.asset_id || selectedAssetInDialog.id,
                user_id: currentEmployeeIdForAssignment,
                status: '利用中',
                usage_start_date: assignmentDetails.assignmentDate ? format(assignmentDetails.assignmentDate, 'yyyy-MM-dd') : undefined,
                location: assignmentDetails.location || selectedAssetInDialog.location,
                notes: assignmentDetails.notes
            };

            // Call the API to update the asset
            const result = await updateAsset(selectedAssetInDialog.asset_id || selectedAssetInDialog.id, updateData);

            if (result.success) {
                // Update the asset in the inventory
                setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    const assetTypeKey = selectedAssetInDialog.type as 'pcs' | 'monitors' | 'smartphones' | 'others';
                    const assetList = [...newInventory[assetTypeKey]];
                    const assetIndex = assetList.findIndex(a => a.id === selectedAssetInDialog.id);

                    if (assetIndex > -1) {
                        assetList[assetIndex] = {
                            ...assetList[assetIndex],
                            userId: currentEmployeeForAssignment,
                            employeeId: currentEmployeeIdForAssignment,
                            status: '利用中',
                            usageStartDate: assignmentDetails.assignmentDate ? format(assignmentDetails.assignmentDate, 'yyyy-MM-dd') : undefined,
                            location: assignmentDetails.location || assetList[assetIndex].location,
                            notes: assignmentDetails.notes
                        };
                        newInventory[assetTypeKey] = assetList;
                    }
                    return newInventory;
                });

                // Also update the allAssets array to reflect the change
                setAllAssets(prevAssets => {
                    return prevAssets.map(asset =>
                        asset.id === selectedAssetInDialog.id
                            ? {
                                ...asset,
                                userId: currentEmployeeForAssignment,
                                employeeId: currentEmployeeIdForAssignment,
                                status: '利用中',
                                usageStartDate: assignmentDetails.assignmentDate ? format(assignmentDetails.assignmentDate, 'yyyy-MM-dd') : undefined,
                                location: assignmentDetails.location || asset.location
                            }
                            : asset
                    );
                });

                // Show success message
                toast({
                    title: t('actions.success'),
                    description: t('pages.user_assets.asset_assigned_successfully')
                });

                // Close the dialog
                setIsAssignmentDetailOpen(false);
                setSelectedAssetInDialog(null);
                setCurrentEmployeeForAssignment(null);
                setCurrentEmployeeIdForAssignment(null);
            } else {
                // Show error message
                toast({
                    title: t('actions.error'),
                    description: t('actions.asset_assign_error'),
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error assigning asset:', error);
            toast({
                title: t('actions.error'),
                description: t('actions.asset_assign_error'),
                variant: 'destructive'
            });
        } finally {
            setIsAssigningAsset(false);
        }
    }

    const handleEditAsset = (asset: Asset, employee: string) => {
        setEditingAsset(asset);
        setEditingEmployee(employee);
        setIsEditAssetOpen(true);
    };

    const handleConfirmEditAsset = async () => {
        if (!editingAsset || !editingEmployee) return;

        try {
            setIsUpdatingAsset(true);

            // Call the API to update the asset - only send the fields we want to update
            const updateData: any = {
                asset_id: editingAsset.asset_id || editingAsset.id,
            };

            // Only add fields that have values
            if (editingAsset.usageStartDate) updateData.usage_start_date = editingAsset.usageStartDate;
            if (editingAsset.usageEndDate) updateData.usage_end_date = editingAsset.usageEndDate;
            if (editingAsset.location) updateData.location = editingAsset.location;
            if (editingAsset.notes) updateData.notes = editingAsset.notes;

            const result = await updateAsset(editingAsset.asset_id || editingAsset.id, updateData);

            if (result.success) {
                // Update the asset in the inventory
                setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    const assetTypeKey = editingAsset.type as 'pcs' | 'monitors' | 'smartphones' | 'others';
                    const assetList = [...newInventory[assetTypeKey]];
                    const assetIndex = assetList.findIndex(a => a.id === editingAsset.id);

                    if (assetIndex > -1) {
                        assetList[assetIndex] = {
                            ...assetList[assetIndex],
                            ...editingAsset
                        };
                        newInventory[assetTypeKey] = assetList;
                    }
                    return newInventory;
                });

                // Also update the allAssets array
                setAllAssets(prevAssets => {
                    return prevAssets.map(asset =>
                        asset.id === editingAsset.id
                            ? { ...asset, ...editingAsset }
                            : asset
                    );
                });

                // Show success message
                toast({
                    title: t('actions.success'),
                    description: t('pages.user_assets.asset_updated_successfully')
                });

                // Close the dialog
                setIsEditAssetOpen(false);
                setEditingAsset(null);
                setEditingEmployee(null);
            } else {
                // Show error message
                toast({
                    title: t('actions.error'),
                    description: t('actions.asset_update_error'),
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            toast({
                title: t('actions.error'),
                description: t('actions.asset_update_error'),
                variant: 'destructive'
            });
        } finally {
            setIsUpdatingAsset(false);
        }
    };








    const handleUnassignSubscription = (subId: number) => {
    }



    const employeeAssets = useMemo(() => {
        const result: { [key: string]: { assets: Asset[], subscriptions: Subscription[] } } = {};

        displayedEmployees.forEach(employee => {
            let assignedAssets = allAssets.filter(asset => asset.userId === employee);

            // Filter by selected asset type if not "all"
            if (selectedAssetType !== "all") {
                assignedAssets = assignedAssets.filter(asset => asset.type === selectedAssetType);
            }

            // Filter by status based on statusFilter
            if (statusFilter === "active") {
                // Only show assets with status "貸出中" (On Loan) or "利用中" (In Use)
                assignedAssets = assignedAssets.filter(asset =>
                    asset.status === '貸出中' || asset.status === '利用中'
                );
            }
            // If statusFilter === "all", show all statuses

            result[employee] = {
                assets: assignedAssets,
                subscriptions: [],
            };
        });

        return result;
    }, [displayedEmployees, allAssets, selectedAssetType, statusFilter]);


    const visibleColumns = useMemo(() => {
        if (!systemFields) return [];
        return systemFields.filter(field => field.visible)
            .sort((a, b) => a.order - b.order);
    }, [systemFields]);

    const [availableAssets, setAvailableAssets] = useState<{
        pcs: any[];
        monitors: any[];
        smartphones: any[];
        others: any[];
    }>({
        pcs: [],
        monitors: [],
        smartphones: [],
        others: [],
    });

    const loadAvailableAssets = async () => {
        if (isLoadingAvailableAssets) return;

        try {
            setIsLoadingAvailableAssets(true);
            const result = await getAvailableAssets({ perPage: 5000 }); // Load all available assets

            if (result.assets) {
                const transformedAssets = result.assets.map(asset => ({
                    id: asset.asset_id,
                    asset_id: asset.asset_id,
                    type: asset.type,
                    hostname: asset.hostname || '',
                    manufacturer: asset.manufacturer || '',
                    model: asset.model || '',
                    partNumber: asset.part_number || '',
                    serialNumber: asset.serial_number || '',
                    formFactor: asset.form_factor || '',
                    os: asset.os || '',
                    osBit: asset.os_bit || '',
                    officeSuite: asset.office_suite || '',
                    softwareLicenseKey: asset.software_license_key || '',
                    wiredMacAddress: asset.wired_mac_address || '',
                    wiredIpAddress: asset.wired_ip_address || '',
                    wirelessMacAddress: asset.wireless_mac_address || '',
                    wirelessIpAddress: asset.wireless_ip_address || '',
                    purchaseDate: asset.purchase_date || '',
                    purchasePrice: asset.purchase_price?.toString() || '',
                    purchasePriceTaxIncluded: asset.purchase_price?.toString() || '',
                    depreciationYears: asset.depreciation_years?.toString() || '',
                    depreciationDept: asset.depreciation_dept || '',
                    cpu: asset.cpu || '',
                    memory: asset.memory || '',
                    location: asset.location || '',
                    status: asset.status || '',
                    previousUser: asset.previous_user || '',
                    userId: asset.user_id || '', // Employee name for display
                    employeeId: asset.user_id || '', // Employee ID for internal operations
                    usageStartDate: asset.usage_start_date || '',
                    usageEndDate: asset.usage_end_date || '',
                    carryInOutAgreement: asset.carry_in_out_agreement || '',
                    lastUpdated: asset.last_updated || '',
                    updatedBy: asset.updated_by || '',
                    notes: asset.notes || '',
                    project: asset.project || '',
                    notes1: asset.notes1 || '',
                    notes2: asset.notes2 || '',
                    notes3: asset.notes3 || '',
                    notes4: asset.notes4 || '',
                    notes5: asset.notes5 || '',
                }));

                const pcs = transformedAssets.filter(asset => asset.type === 'pc');
                const monitors = transformedAssets.filter(asset => asset.type === 'monitor');
                const smartphones = transformedAssets.filter(asset => asset.type === 'phone');
                const others = transformedAssets.filter(asset => !['pc', 'monitor', 'phone'].includes(asset.type));
                setAvailableAssets({
                    pcs,
                    monitors,
                    smartphones,
                    others,
                });
            }
        } catch (error) {
            console.error('Error loading available assets:', error);
        } finally {
            setIsLoadingAvailableAssets(false);
        }
    };

    const filteredAssetsForDialog = useMemo(() => {
        const globalFilter = assetDialogFilters.global.toLowerCase();
        const filterGeneric = (asset: any) => {
            // Only show assets that are NOT assigned to anyone (no user_id)
            if (asset.userId && asset.userId.trim() !== '') {
                return false;
            }

            const matchesLocation = assetDialogFilters.locations.length === 0 || assetDialogFilters.locations.includes(asset.location || '');
            const matchesStatus = assetDialogFilters.statuses.length === 0 || assetDialogFilters.statuses.includes(asset.status || '');
            if (!matchesLocation || !matchesStatus) return false;

            if (!globalFilter) return true;
            return Object.values(asset).some(val => val && String(val).toLowerCase().includes(globalFilter));
        };

        let filteredPcs = availableAssets.pcs.filter(filterGeneric);

        if (assetDialogSortConfig !== null) {
            filteredPcs = filteredPcs.sort((a, b) => {
                const aValue = a[assetDialogSortConfig.key];
                const bValue = b[assetDialogSortConfig.key];

                // Handle undefined values
                if (aValue === undefined && bValue === undefined) return 0;
                if (aValue === undefined) return assetDialogSortConfig.direction === 'asc' ? -1 : 1;
                if (bValue === undefined) return assetDialogSortConfig.direction === 'asc' ? 1 : -1;

                if (aValue < bValue) return assetDialogSortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return assetDialogSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return {
            pcs: filteredPcs,
            monitors: availableAssets.monitors.filter(filterGeneric),
            smartphones: availableAssets.smartphones.filter(filterGeneric),
            others: availableAssets.others.filter(filterGeneric)
        }
    }, [availableAssets, assetDialogFilters, assetDialogSortConfig, visibleColumns]);


    const handleDialogSort = (key: keyof PcAsset) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (assetDialogSortConfig && assetDialogSortConfig.key === key && assetDialogSortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setAssetDialogSortConfig({ key, direction });
        // Reset pagination when sorting changes
        setAssetDialogPagination({});
    };

    const getDialogSortIcon = (key: keyof PcAsset) => {
        if (!assetDialogSortConfig || assetDialogSortConfig.key !== key) {
            return null;
        }
        if (assetDialogSortConfig.direction === 'asc') {
            return <ArrowUp className="ml-2 h-4 w-4" />;
        }
        return <ArrowDown className="ml-2 h-4 w-4" />;
    };

    const SortableHeader = ({ columnKey, children }: { columnKey: keyof PcAsset; children: React.ReactNode }) => (
        <TableHead className="h-auto px-4 py-1 whitespace-nowrap cursor-pointer" onClick={() => handleDialogSort(columnKey)}>
            <div className="flex items-center">
                {children}
                {getDialogSortIcon(columnKey)}
            </div>
        </TableHead>
    );

    const renderMainContent = () => {
        if (error) {
            return (
                <div className="p-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{t('actions.error')}</AlertTitle>
                        <AlertDescription>
                            <p>{error}</p>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        // Show loading state while fetching assets
        if (isLoadingAssets) {
            return (
                <div className="p-6">
                    <Card>
                        <CardContent className="p-10 text-center text-muted-foreground">
                            <div className="space-y-2">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-lg font-medium">{t('pages.user_assets.loading_title')}</p>
                                <p className="text-sm">{t('pages.user_assets.loading_desc')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        // Check if there are any assets in the system at all
        if (allAssets.length === 0) {
            return (
                <div className="p-6">
                    <Card>
                        <CardContent className="p-10 text-center text-muted-foreground">
                            <div className="space-y-2">
                                <p className="text-lg font-medium">{t('pages.user_assets.no_assets_in_system')}</p>
                                <p className="text-sm">{t('pages.user_assets.no_assets_in_system_desc')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('nav.user_assets')}</CardTitle>
                        <CardDescription>{t('pages.user_assets.description')}</CardDescription>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{t('pages.user_assets.summary.employees_with_assets', { count: filteredEmployees.length })}</span>
                            <span>{t('pages.user_assets.summary.total_assets_assigned', { count: allAssets.filter(asset => asset.userId && asset.userId.trim() !== '').length })}</span>
                            <span>{t('pages.user_assets.summary.active_assets', { count: allAssets.filter(asset => asset.userId && asset.userId.trim() !== '' && (asset.status === '貸出中' || asset.status === '利用中')).length })}</span>
                            <span>{t('pages.user_assets.summary.total_employees', { count: masterData.employees.length })}</span>
                        </div>
                        {/* <div className="text-xs text-muted-foreground mt-2">
                            <span className="inline-flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {statusFilter === "active" 
                                    ? 'Only showing assets with status "On Loan" (貸出中) or "In Use" (利用中)'
                                    : 'Showing all asset statuses'
                                }
                            </span>
                        </div> */}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="location-filter">{t('pages.user_assets.location_filter')}</Label>
                                <Select onValueChange={setLocationFilter} value={locationFilter}>
                                    <SelectTrigger id="location-filter">
                                        <SelectValue placeholder={t('pages.user_assets.all_locations')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">{t('pages.user_assets.all_locations')}</SelectItem>
                                        <SelectItem value="本人所持">{t('pages.user_assets.filter_by_user_possession')}</SelectItem>
                                        <DropdownMenuSeparator />
                                        {masterData.locations.filter(l => l !== 'All').map((location) => (
                                            <SelectItem key={location} value={location}>
                                                {location}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-3">
                                <Label htmlFor="project-filter">{t('pages.user_assets.project_filter')}</Label>
                                <Select onValueChange={setProjectFilter} value={projectFilter}>
                                    <SelectTrigger id="project-filter">
                                        <SelectValue placeholder={t('pages.user_assets.all_projects')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masterData.projects.map((project) => (
                                            <SelectItem key={project} value={project}>
                                                {project}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="mb-10" htmlFor="status-filter">{t('pages.user_assets.status_filter')}</Label>
                                <Select onValueChange={(value) => setStatusFilter(value)} value={statusFilter}>
                                    <SelectTrigger id="status-filter">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('labels.statuses.active_only')}</SelectItem>
                                        <SelectItem value="all">{t('labels.statuses.all_status')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-4">
                                <Label htmlFor="employee-select">{t('pages.user_assets.employee_select_label')}</Label>
                                <div>
                                    <Popover open={isEmployeeSelectorOpen} onOpenChange={setIsEmployeeSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={isEmployeeSelectorOpen}
                                                className="w-1/2 justify-between mr-4"
                                                disabled={filteredEmployees.length === 0}
                                            >
                                                <span className="truncate">
                                                    {selectedEmployees.length === 0
                                                        ? t('pages.user_assets.select_employee')
                                                        : t('pages.user_assets.employees_selected', { count: selectedEmployees.length })
                                                    }
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                            <Command>
                                                <CommandInput placeholder={t('pages.user_assets.search_employee_placeholder')} />
                                                <CommandList>
                                                    <CommandEmpty>{t('common.no_results_found')}</CommandEmpty>
                                                    <CommandGroup>
                                                        {filteredEmployees.map((employee) => (
                                                            <CommandItem
                                                                key={employee}
                                                                value={employee}
                                                                onSelect={(currentValue) => {
                                                                    setSelectedEmployees(prev =>
                                                                        prev.includes(currentValue)
                                                                            ? prev.filter(e => e !== currentValue)
                                                                            : [...prev, currentValue]
                                                                    );
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedEmployees.includes(employee) ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{employee}</span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        ID: {getEmployeeId(employee) || t('common.not_applicable')}

                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setLocationFilter("All");
                                            setProjectFilter("All");
                                            setStatusFilter("active");
                                            setSelectedAssetType("all");
                                            setSelectedEmployees([]);
                                        }}
                                    >
                                        {t('actions.clear_filters')}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2 md:col-span-2 self-end">
                                <Button onClick={handleSearch} className="w-full">
                                    <Search className="mr-2 h-4 w-4" />
                                    {t('actions.search')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {displayedEmployees.length > 0 ? (
                        <>
                            {getPaginatedEmployees(displayedEmployees).map(employee => (
                                <Card key={employee}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            <div className="flex flex-col">
                                                <span>{employee}</span>
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    ID: {getEmployeeId(employee) || t('common.not_applicable')}
                                                </span>
                                            </div>
                                        </CardTitle>
                                        <CardDescription>{t('pages.user_assets.assigned_items_desc')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-medium flex items-center gap-2"><Briefcase className="h-4 w-4" />{t('pages.user_assets.physical_assets_title')}</h3>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenAssignDialog(employee)}
                                                    disabled={allAssets.filter(asset => !asset.userId || asset.userId === '').length === 0}
                                                    title={allAssets.filter(asset => !asset.userId || asset.userId === '').length === 0 ? t('pages.user_assets.no_available_assets') : t('pages.user_assets.add_asset')}
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    {t('pages.user_assets.add_asset')}
                                                </Button>
                                            </div>
                                            <div className="border rounded-lg">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>{t('labels.id')}</TableHead>
                                                            <TableHead>{t('labels.model')}</TableHead>
                                                            <TableHead>{t('labels.asset_type')}</TableHead>
                                                            <TableHead>{t('labels.loan_date')}</TableHead>
                                                            <TableHead>{t('labels.return_due_date')}</TableHead>
                                                            <TableHead>{t('labels.actions')}</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {(employeeAssets[employee]?.assets.length || 0) > 0 ? getPaginatedAssets(employeeAssets[employee].assets, employee).map((asset) => (
                                                            <TableRow key={asset.id} className="cursor-pointer">
                                                                <TableCell className="font-mono text-xs">{asset.asset_id || asset.id}</TableCell>
                                                                <TableCell>{asset.model}</TableCell>
                                                                <TableCell>{getAssetTypeText(asset.type)}</TableCell>
                                                                <TableCell>{asset.usageStartDate ? format(asset.usageStartDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}</TableCell>
                                                                <TableCell>{asset.usageEndDate ? format(asset.usageEndDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}</TableCell>
                                                                <TableCell>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditAsset(asset, employee);
                                                                        }}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">{t('pages.user_assets.no_assets')}</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>

                                                {/* Pagination */}
                                                {employeeAssets[employee]?.assets.length > defaultItemsPerPage && (
                                                    <div className="ml-4">
                                                        <Pagination
                                                            currentPage={getPaginationState(employee).currentPage}
                                                            totalCount={employeeAssets[employee].assets.length}
                                                            itemsPerPage={defaultItemsPerPage}
                                                            onPageChange={(page) => handlePageChange(employee, page)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Employee List Pagination */}
                            {displayedEmployees.length > employeeListItemsPerPage && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={employeeListPagination.currentPage}
                                        totalCount={displayedEmployees.length}
                                        itemsPerPage={employeeListItemsPerPage}
                                        onPageChange={handleEmployeeListPageChange}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <Card className="mt-6">
                            <CardContent className="p-10 text-center text-muted-foreground">
                                <div className="space-y-2">
                                    <p className="text-lg font-medium">{t('pages.user_assets.no_employees_with_assets')}</p>
                                    <p className="text-sm">{t('pages.user_assets.no_employees_with_assets_desc')}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <div className="flex flex-col gap-6">
                {renderMainContent()}
            </div>



            <Dialog open={isAssetSelectorOpen} onOpenChange={setIsAssetSelectorOpen}>
                <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{t('pages.lending.select_asset_dialog.title')}</DialogTitle>
                        <DialogDescription>{t('pages.lending.select_asset_dialog.description', { employee: currentEmployeeForAssignment })}</DialogDescription>
                        <div className="text-sm text-muted-foreground mt-2">
                            {t('pages.lending.select_asset_dialog.description_2')}
                        </div>
                    </DialogHeader>
                    <div className="flex flex-col flex-grow min-h-0">
                        <Accordion type="single" collapsible className="w-full" defaultValue="filters">
                            <AccordionItem value="filters" className="border rounded-md">
                                <AccordionTrigger className="p-2 text-sm hover:no-underline data-[state=open]:border-b">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        <span>{t('pages.inventory.actions_and_filters')}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-4 border-t">
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <Input name="global" placeholder={t('pages.inventory.filter_all')} value={assetDialogFilters.global} onChange={(e) => {
                                            setAssetDialogFilters(prev => ({ ...prev, global: e.target.value }));
                                            setAssetDialogPagination({});
                                        }} className="bg-background sm:col-span-2" />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    <span className="truncate">
                                                        {assetDialogFilters.locations.length === 0 || assetDialogFilters.locations.length === masterData.locations.length
                                                            ? t('pages.inventory.filter_location')
                                                            : t('pages.inventory.filter_location_selected', { count: assetDialogFilters.locations.length })
                                                        }
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                                <DropdownMenuItem onSelect={() => {
                                                    setAssetDialogFilters(prev => ({ ...prev, locations: masterData.locations.filter(l => l !== 'All') }));
                                                    setAssetDialogPagination({});
                                                }} className="cursor-pointer">
                                                    {t('actions.select_all')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => {
                                                    setAssetDialogFilters(prev => ({ ...prev, locations: [] }));
                                                    setAssetDialogPagination({});
                                                }} className="cursor-pointer">
                                                    {t('actions.deselect_all')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {masterData.locations.filter(l => l !== 'All').map((location) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={location}
                                                        checked={assetDialogFilters.locations.includes(location)}
                                                        onCheckedChange={(checked) => {
                                                            setAssetDialogFilters(prev => ({
                                                                ...prev,
                                                                locations: checked
                                                                    ? [...prev.locations, location]
                                                                    : prev.locations.filter(s => s !== location)
                                                            }));
                                                            setAssetDialogPagination({});
                                                        }}
                                                        onSelect={e => e.preventDefault()}
                                                    >
                                                        {location}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    <span className="truncate">
                                                        {assetDialogFilters.statuses.length === 0 || assetDialogFilters.statuses.length === allStatuses.length
                                                            ? t('pages.inventory.filter_status')
                                                            : t('pages.inventory.filter_status_selected', { count: assetDialogFilters.statuses.length })
                                                        }
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-[var(--radix-popover-trigger-width)]">
                                                <DropdownMenuItem onSelect={() => {
                                                    setAssetDialogFilters(prev => ({ ...prev, statuses: allStatuses }));
                                                    setAssetDialogPagination({});
                                                }} className="cursor-pointer">
                                                    {t('actions.select_all')}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => {
                                                    setAssetDialogFilters(prev => ({ ...prev, statuses: [] }));
                                                    setAssetDialogPagination({});
                                                }} className="cursor-pointer">
                                                    {t('actions.deselect_all')}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {allStatuses.map((status) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={status}
                                                        checked={assetDialogFilters.statuses.includes(status)}
                                                        onCheckedChange={(checked) => {
                                                            setAssetDialogFilters(prev => ({
                                                                ...prev,
                                                                statuses: checked
                                                                    ? [...prev.statuses, status]
                                                                    : prev.statuses.filter(s => s !== status)
                                                            }));
                                                            setAssetDialogPagination({});
                                                        }}
                                                        onSelect={e => e.preventDefault()}
                                                    >
                                                        {getStatusText(status)}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        <Tabs defaultValue="pcs" className="flex flex-col flex-grow min-h-0 pt-4">
                            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto shrink-0">
                                <TabsTrigger value="pcs" className="py-1"><Laptop className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.pcs')} {t('pages.inventory.available', { count: filteredAssetsForDialog.pcs.length })}</TabsTrigger>
                                <TabsTrigger value="monitors" className="py-1"><Monitor className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.monitors')} {t('pages.inventory.available', { count: filteredAssetsForDialog.monitors.length })}</TabsTrigger>
                                <TabsTrigger value="smartphones" className="py-1"><Smartphone className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.smartphones')} {t('pages.inventory.available', { count: filteredAssetsForDialog.smartphones.length })}</TabsTrigger>
                                <TabsTrigger value="others" className="py-1"><Package className="mr-2 h-4 w-4" /> {t('pages.inventory.tabs.others')} {t('pages.inventory.available', { count: filteredAssetsForDialog.others.length })}</TabsTrigger>
                            </TabsList>

                            <TabsContent value="pcs" className="relative mt-2 flex-grow min-h-[300px]">
                                {isLoadingAvailableAssets ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">{t('pages.user_assets.loading_assets_title')}</p>
                                            <p className="text-xs text-muted-foreground">{t('pages.user_assets.loading_assets_desc')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 overflow-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background z-20">
                                                <TableRow>
                                                    <TableHead>{t('labels.id')}</TableHead>
                                                    <TableHead>{t('labels.model')}</TableHead>
                                                    <TableHead>{t('labels.asset_type')}</TableHead>
                                                    <TableHead>{t('labels.status')}</TableHead>
                                                    <TableHead>{t('labels.loan_date')}</TableHead>
                                                    <TableHead>{t('labels.return_due_date')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredAssetsForDialog.pcs.length > 0 ? getPaginatedAssetsForDialog(filteredAssetsForDialog.pcs, 'pcs').map((pc) => (
                                                    <TableRow key={pc.id} onClick={() => setSelectedAssetInDialog({ ...pc, type: 'pcs' })} className={cn("cursor-pointer", selectedAssetInDialog?.id === pc.id && "bg-muted hover:bg-muted")}>
                                                        <TableCell className="font-mono text-xs">{pc.id}</TableCell>
                                                        <TableCell>{pc.model}</TableCell>
                                                        <TableCell>{getAssetTypeText(pc.type || 'pcs')}</TableCell>
                                                        <TableCell>{getStatusText(pc.status)}</TableCell>
                                                        <TableCell>{pc.usageStartDate ? format(pc.usageStartDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}</TableCell>
                                                        <TableCell>{pc.usageEndDate ? format(pc.usageEndDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : t('common.not_applicable')}</TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-24 text-center">{t('pages.lending.select_asset_dialog.no_assets_found')}</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination for PCs */}
                                        {filteredAssetsForDialog.pcs.length > assetDialogItemsPerPage && (
                                            <div className="mt-4 px-4">
                                                <Pagination
                                                    currentPage={getAssetDialogPaginationState('pcs').currentPage}
                                                    totalCount={filteredAssetsForDialog.pcs.length}
                                                    itemsPerPage={assetDialogItemsPerPage}
                                                    onPageChange={(page) => handleAssetDialogPageChange('pcs', page)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="monitors" className="relative mt-2 flex-grow min-h-[300px]">
                                <div className="absolute inset-0 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-20">
                                            <TableRow>
                                                <TableHead>{t('labels.id')}</TableHead>
                                                <TableHead>{t('labels.model')}</TableHead>
                                                <TableHead>{t('labels.asset_type')}</TableHead>
                                                <TableHead>{t('labels.status')}</TableHead>
                                                <TableHead>{t('labels.loan_date')}</TableHead>
                                                <TableHead>{t('labels.return_due_date')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAssetsForDialog.monitors.length > 0 ? getPaginatedAssetsForDialog(filteredAssetsForDialog.monitors, 'monitors').map((monitor) => (
                                                <TableRow key={monitor.id} onClick={() => setSelectedAssetInDialog({ ...monitor, type: 'monitors' })} className={cn("cursor-pointer", selectedAssetInDialog?.id === monitor.id && "bg-muted hover:bg-muted")}>
                                                    <TableCell className="font-mono text-xs">{monitor.id}</TableCell>
                                                    <TableCell>{monitor.model}</TableCell>
                                                    <TableCell>{getAssetTypeText(monitor.type || 'monitors')}</TableCell>
                                                    <TableCell>{getStatusText(monitor.status)}</TableCell>
                                                    <TableCell>{monitor.usageStartDate ? new Date(monitor.usageStartDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                    <TableCell>{monitor.usageEndDate ? new Date(monitor.usageEndDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">{t('pages.lending.select_asset_dialog.no_assets_found')}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination for Monitors */}
                                    {filteredAssetsForDialog.monitors.length > assetDialogItemsPerPage && (
                                        <div className="mt-4 px-4">
                                            <Pagination
                                                currentPage={getAssetDialogPaginationState('monitors').currentPage}
                                                totalCount={filteredAssetsForDialog.monitors.length}
                                                itemsPerPage={assetDialogItemsPerPage}
                                                onPageChange={(page) => handleAssetDialogPageChange('monitors', page)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="smartphones" className="relative mt-2 flex-grow min-h-[300px]">
                                <div className="absolute inset-0 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-20">
                                            <TableRow>
                                                <TableHead>{t('labels.id')}</TableHead>
                                                <TableHead>{t('labels.model')}</TableHead>
                                                <TableHead>{t('labels.asset_type')}</TableHead>
                                                <TableHead>{t('labels.status')}</TableHead>
                                                <TableHead>{t('labels.loan_date')}</TableHead>
                                                <TableHead>{t('labels.return_due_date')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAssetsForDialog.smartphones.length > 0 ? getPaginatedAssetsForDialog(filteredAssetsForDialog.smartphones, 'smartphones').map((phone) => (
                                                <TableRow key={phone.id} onClick={() => setSelectedAssetInDialog({ ...phone, type: 'smartphones' })} className={cn("cursor-pointer", selectedAssetInDialog?.id === phone.id && "bg-muted hover:bg-muted")}>
                                                    <TableCell className="font-mono text-xs">{phone.id}</TableCell>
                                                    <TableCell>{phone.model}</TableCell>
                                                    <TableCell>{getAssetTypeText(phone.type || 'smartphones')}</TableCell>
                                                    <TableCell>{getStatusText(phone.status)}</TableCell>
                                                    <TableCell>{phone.usageStartDate ? new Date(phone.usageStartDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                    <TableCell>{phone.usageEndDate ? new Date(phone.usageEndDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">{t('pages.lending.select_asset_dialog.no_assets_found')}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination for Smartphones */}
                                    {filteredAssetsForDialog.smartphones.length > assetDialogItemsPerPage && (
                                        <div className="mt-4 px-4">
                                            <Pagination
                                                currentPage={getAssetDialogPaginationState('smartphones').currentPage}
                                                totalCount={filteredAssetsForDialog.smartphones.length}
                                                itemsPerPage={assetDialogItemsPerPage}
                                                onPageChange={(page) => handleAssetDialogPageChange('smartphones', page)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="others" className="relative mt-2 flex-grow min-h-[300px]">
                                <div className="absolute inset-0 overflow-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background z-20">
                                            <TableRow>
                                                <TableHead>{t('labels.id')}</TableHead>
                                                <TableHead>{t('labels.model')}</TableHead>
                                                <TableHead>{t('labels.asset_type')}</TableHead>
                                                <TableHead>{t('labels.status')}</TableHead>
                                                <TableHead>{t('labels.loan_date')}</TableHead>
                                                <TableHead>{t('labels.return_due_date')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredAssetsForDialog.others.length > 0 ? getPaginatedAssetsForDialog(filteredAssetsForDialog.others, 'others').map((other) => (
                                                <TableRow key={other.id} onClick={() => setSelectedAssetInDialog({ ...other, type: 'others' })} className={cn("cursor-pointer", selectedAssetInDialog?.id === other.id && "bg-muted hover:bg-muted")}>
                                                    <TableCell className="font-mono text-xs">{other.id}</TableCell>
                                                    <TableCell>{other.model}</TableCell>
                                                    <TableCell>{getAssetTypeText(other.type || 'others')}</TableCell>
                                                    <TableCell>{getStatusText(other.status)}</TableCell>
                                                    <TableCell>{other.usageStartDate ? new Date(other.usageStartDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                    <TableCell>{other.usageEndDate ? new Date(other.usageEndDate).toLocaleDateString() : t('common.not_applicable')}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">{t('pages.lending.select_asset_dialog.no_assets_found')}</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    {/* Pagination for Others */}
                                    {filteredAssetsForDialog.others.length > assetDialogItemsPerPage && (
                                        <div className="mt-4 px-4">
                                            <Pagination
                                                currentPage={getAssetDialogPaginationState('others').currentPage}
                                                totalCount={filteredAssetsForDialog.others.length}
                                                itemsPerPage={assetDialogItemsPerPage}
                                                onPageChange={(page) => handleAssetDialogPageChange('others', page)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsAssetSelectorOpen(false)}>{t('actions.cancel')}</Button>
                        <Button onClick={handleSelectAssetForAssignment} disabled={!selectedAssetInDialog}>{t('actions.select')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAssignmentDetailOpen} onOpenChange={setIsAssignmentDetailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('pages.user_assets.assign_asset_title')}</DialogTitle>
                        <DialogDescription>
                            {t('pages.user_assets.assign_asset_desc', { asset: selectedAssetInDialog?.model, employee: currentEmployeeForAssignment })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>{t('pages.user_assets.assignment_date')}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-2", !assignmentDetails.assignmentDate && "text-muted-foreground")}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {assignmentDetails.assignmentDate ? format(assignmentDetails.assignmentDate, "PPP") : <span>{t('actions.pick_date')}</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={assignmentDetails.assignmentDate} onSelect={(d) => setAssignmentDetails(prev => ({ ...prev, assignmentDate: d }))} initialFocus /></PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label>{t('pages.user_assets.location')}</Label>
                                <Input
                                    value={assignmentDetails.location}
                                    onChange={(e) => setAssignmentDetails(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder={t('pages.user_assets.location_placeholder')}
                                    className="mt-2"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>{t('labels.location')}</Label>
                            <Select
                                value={assignmentDetails.location}
                                onValueChange={(value) => setAssignmentDetails(prev => ({ ...prev, location: value }))}
                            >
                                <SelectTrigger className="mt-2">
                                    <SelectValue placeholder={t('labels.select_location')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {masterData.locations.filter(l => l !== 'All').map(loc => (
                                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>{t('labels.notes')}</Label>
                            <Textarea
                                className="mt-2"
                                value={assignmentDetails.notes}
                                onChange={(e) => setAssignmentDetails(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder={t('labels.notes_placeholder')}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsAssignmentDetailOpen(false)} disabled={isAssigningAsset}>{t('actions.cancel')}</Button>
                        <Button onClick={handleConfirmAssignment} disabled={isAssigningAsset}>
                            {isAssigningAsset ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('actions.assigning')}
                                </>
                            ) : (
                                t('actions.assign')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('pages.user_assets.edit_asset_title')}</DialogTitle>
                        <DialogDescription>
                            {t('pages.user_assets.edit_asset_desc', { asset: editingAsset?.model, employee: editingEmployee })}
                        </DialogDescription>
                    </DialogHeader>
                    {editingAsset && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>{t('labels.loan_date')}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-2", !editingAsset.usageStartDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editingAsset.usageStartDate ? format(editingAsset.usageStartDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={editingAsset.usageStartDate ? new Date(editingAsset.usageStartDate) : undefined}
                                                onSelect={(d) => setEditingAsset(prev => prev ? { ...prev, usageStartDate: d ? format(d, 'yyyy-MM-dd') : undefined } : null)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label>{t('labels.return_due_date')}</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal mt-2", !editingAsset.usageEndDate && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {editingAsset.usageEndDate ? format(editingAsset.usageEndDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={editingAsset.usageEndDate ? new Date(editingAsset.usageEndDate) : undefined}
                                                onSelect={(d) => setEditingAsset(prev => prev ? { ...prev, usageEndDate: d ? format(d, 'yyyy-MM-dd') : undefined } : null)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div>
                                <Label>{t('pages.user_assets.location')}</Label>
                                <Select
                                    value={editingAsset.location || ''}
                                    onValueChange={(value) => setEditingAsset(prev => prev ? { ...prev, location: value } : null)}
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder={t('labels.select_location')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {masterData.locations.filter(l => l !== 'All').map(loc => (
                                            <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>{t('labels.notes')}</Label>
                                <Textarea
                                    className="mt-2"
                                    value={editingAsset.notes || ''}
                                    onChange={(e) => setEditingAsset(prev => prev ? { ...prev, notes: e.target.value } : null)}
                                    placeholder={t('labels.notes_placeholder')}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsEditAssetOpen(false)} disabled={isUpdatingAsset}>{t('actions.cancel')}</Button>
                        <Button onClick={handleConfirmEditAsset} disabled={isUpdatingAsset}>
                            {isUpdatingAsset ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('actions.saving')}
                                </>
                            ) : (
                                t('actions.save')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    )
}
