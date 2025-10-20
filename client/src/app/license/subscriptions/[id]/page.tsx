
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscriptions as initialSubscriptions, employees as initialEmployees } from '@/lib/mock-data';
import type { BillingCycle, Account, Subscription, AssignedUser, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, JapaneseYen, Percent, Briefcase, Building, Tag, CreditCard, ExternalLink, Monitor, User, Trash2, Edit, PlusCircle, Check, CalendarX2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import LicenseKeyDisplay from '@/components/license-key-display';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import SubscriptionForm from '@/components/subscription-form';
import { toast } from '@/hooks/use-toast';
import { useQuery, useLazyQuery, useMutation } from "@apollo/client/react";
import { ASSIGN_EMPLOYEE_TO_LICENSE, ASSIGN_EMPLOYEE_TO_SUB, UNASSIGN_EMPLOYEE, GET_SUBSCRIPTION, SEARCH_EMPLOYEES, MUT_DELETE_LICENSE } from "@/lib/queries";
import { gql } from "@apollo/client";

const USD_JPY_RATE = 150;

function formatDate(date?: string) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-CA');
}

function formatCurrency(amount: number, currency: 'jpy' | 'usd') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: currency === 'jpy' ? 0 : 2,
    }).format(amount);
};

function getBillingCycleText(billingCycle?: BillingCycle) {
    if (!billingCycle) return '';

    if (billingCycle.period === 1) {
        const unitMap: Record<string, string> = {
            day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Annually',
        };
        return unitMap[billingCycle.unit];
    }

    return `Every ${billingCycle.period} ${billingCycle.unit}s`;
}


function EmployeeCombobox({
    onSelect,
    triggerText,
    excludedEmployeeIds = [],
    subscriptionId,
    pricingType,
    selectedLicenseId,
    onAssignmentUpdate,
}: {
    onSelect?: (employeeId: string, employeeName: string) => void;
    triggerText: React.ReactNode;
    excludedEmployeeIds?: string[];
    subscriptionId: string;
    pricingType: "per-license" | "per-seat";
    selectedLicenseId?: string;
    onAssignmentUpdate?: () => void; // optional callback to refresh UI
}) {
    const [assignEmployeeToLicense] = useMutation(ASSIGN_EMPLOYEE_TO_LICENSE);
    const [assignEmployeeToSub] = useMutation(ASSIGN_EMPLOYEE_TO_SUB);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ employee_id: string; name: string; email: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [searchEmployees, { loading }] = useLazyQuery(SEARCH_EMPLOYEES);

    // ✅ Reusable search handler
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.trim().length >= 2) {
            setIsSearching(true);
            try {
                const result = await searchEmployees({
                    variables: { name: query.trim(), first: 50 },
                });

                if ((result.data as any)?.searchEmployees) {
                    const filtered = (result.data as any).searchEmployees.filter(
                        (emp: any) => !excludedEmployeeIds.includes(emp.employee_id)
                    );
                    setSearchResults(filtered);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error("Error searching employees:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleSelect = async (employeeId: string, employeeName: string) => {
        try {
            const result = pricingType === "per-license" ? await assignEmployeeToLicense({
                variables: {
                    subscriptionId,
                    employeeId,
                    licenseId: selectedLicenseId,
                },
            }) : await assignEmployeeToSub({
                variables: {
                    subscriptionId,
                    employeeId,
                }
            });

            if ((result.data as any)?.assignEmployeeToSubscription?.success) {
                console.log("✅ Assigned:", employeeName);
                onAssignmentUpdate?.(); // Refresh UI (fetch updated list)
                onSelect?.(employeeId, employeeName);
            } else {
                console.error("❌ Failed to assign:", (result.data as any)?.assignEmployeeToSubscription?.message);
            }
        } catch (error) {
            console.error("GraphQL error assigning employee:", error);
        }

        setOpen(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{triggerText}</PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search employee by name..."
                        value={searchQuery}
                        onValueChange={handleSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                        {isSearching || loading ? (
                            <div className="p-2 text-sm text-muted-foreground">Searching...</div>
                        ) : searchQuery.length < 2 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                                Type at least 2 characters to search...
                            </div>
                        ) : searchResults.length === 0 ? (
                            <CommandEmpty>No employees found.</CommandEmpty>
                        ) : (
                            <CommandGroup>
                                {searchResults.map((employee) => (
                                    <CommandItem
                                        key={employee.employee_id}
                                        value={employee.name}
                                        onSelect={() => handleSelect(employee.employee_id, employee.name)}
                                        className="flex flex-col items-start cursor-pointer"
                                    >
                                        <span className="font-medium">{employee.name}</span>
                                        {employee.email && (
                                            <span className="text-xs text-muted-foreground">{employee.email}</span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


export default function SubscriptionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [subscription, setSubscription] = useState<Subscription>();
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { data, loading, error, refetch } = useQuery(GET_SUBSCRIPTION, {
        variables: { id },
    });
    const [deleteLicense] = useMutation(gql`${MUT_DELETE_LICENSE}`);

    const [usedLicenses, setUsedLicenses] = useState<License[]>([]);
    const [unusedLicenses, setUnusedLicenses] = useState<License[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; licenseId?: string; accountId?: string }>({ open: false });
    const [isDeleting, setIsDeleting] = useState(false);
    const [totalLicenseCount, setTotalLicenseCount] = useState<number>();
    const [usedLicenseCount, setUsedLicenseCount] = useState<number>();
    const [usageRate, setUsageRate] = useState<number>();
    const [isSubscription, setIsSubscription] = useState<boolean>();
    const [isPerSeat, setIsPerSeat] = useState<boolean>();

    useEffect(() => {
        console.log("Fetched subscription:", data);
        if (data && (data as any).getSubscription) {
            const subscriptionData = (data as any).getSubscription;
            console.log(subscriptionData);
            setSubscription(subscriptionData);

            const usedLicenses = subscriptionData.licenses.filter((l: License) => l.used);
            setUsedLicenses(usedLicenses);
            const unusedLicenses = subscriptionData.licenses.filter((l: License) => !l.used)
            setUnusedLicenses(unusedLicenses);

            const totalLicenseCount = subscriptionData.pricing_type === 'per-seat' ? (subscriptionData.employees?.length || 0) : subscriptionData.licenses?.length;
            setTotalLicenseCount(totalLicenseCount);
            const usedLicenseCount = subscriptionData.pricing_type === 'per-seat' ? (subscriptionData.employees?.length || 0) : usedLicenses.length;
            setUsedLicenseCount(usedLicenseCount);

            setUsageRate(totalLicenseCount > 0 ? Math.round((usedLicenseCount / totalLicenseCount) * 100) : 0);

            setIsSubscription(subscriptionData.license_type === 'subscription');

            setIsPerSeat(subscriptionData.pricing_type === 'per-seat');
        }
    }, [data])

    const handleSave = async () => {
        setIsEditModalOpen(false);
        setIsRefreshing(true);
        // Refetch the subscription data to show updated information
        try {
            await refetch();
            toast({
                title: 'Success',
                description: 'Subscription updated successfully.',
            });
        } catch (error) {
            console.error('Error refetching subscription data:', error);
            toast({
                title: 'Error',
                description: 'Failed to refresh subscription data.',
                variant: 'destructive'
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Per-license deletion
    const handleDeleteAccount = async (licenseId: string) => {
        try {
            await deleteLicense({ variables: { id: licenseId } });
            await refetch();
            toast({ title: 'Deleted', description: 'License deleted successfully.' });
        } catch (e) {
            console.error('Failed to delete license', e);
            toast({ title: 'Delete failed', description: 'Could not delete license.', variant: 'destructive' });
        }
    };

    const confirmDeleteLicense = async () => {
        if (!deleteModal.licenseId) return;
        try {
            setIsDeleting(true);
            await handleDeleteAccount(deleteModal.licenseId);
            setDeleteModal({ open: false });
        } finally {
            setIsDeleting(false);
        }
    };

    // Per-seat user unassignment (persist to backend) with confirm modal
    const [unassignEmployee] = useMutation(UNASSIGN_EMPLOYEE);
    const [unassignModal, setUnassignModal] = useState<{ open: boolean; employeeId?: string; name?: string }>({ open: false });
    const [isUnassigning, setIsUnassigning] = useState(false);

    const handleUnassignUser = async (employeeId: string) => {
        if (!subscription || subscription.pricing_type !== 'per-seat') return;
        setUnassignModal({ open: true, employeeId, name: subscription.employees.find(e => e.employee_id === employeeId)?.name });
    };

    const confirmUnassign = async () => {
        if (!unassignModal.employeeId || !subscription) return;
        try {
            setIsUnassigning(true);
            const res = await unassignEmployee({
                variables: {
                    subscriptionId: subscription.id,
                    employeeId: unassignModal.employeeId,
                }
            });
            const ok = (res.data as any)?.unassignEmployeeFromSubscription?.success;
            if (ok) {
                toast({ title: 'Unassigned', description: 'User unassigned successfully.' });
                setUnassignModal({ open: false });
                await refetch();
            } else {
                const msg = (res.data as any)?.unassignEmployeeFromSubscription?.message || 'Failed to unassign user.';
                toast({ title: 'Unassign failed', description: msg, variant: 'destructive' });
            }
        } catch (e) {
            console.error('Unassign error', e);
            toast({ title: 'Unassign failed', description: 'Unexpected error.', variant: 'destructive' });
        } finally {
            setIsUnassigning(false);
        }
    };


    // Show a simple skeleton while the subscription query is loading.
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-background p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="w-64 h-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="w-14 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="w-12 h-6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                    <div className="h-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-28 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-40 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="h-40 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                        <div className="h-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!subscription) {
        return <div>Subscription not found.</div>;
    }

    const getMonthlyCostInYen = () => {
        if (subscription.pricing_type === 'per-seat') {
            const userCount = subscription.employees?.length || 0;
            const price = subscription.per_seat_monthly_price || (subscription.per_seat_yearly_price || 0) / 12;
            const cost = userCount * price;
            return Math.round(subscription.per_seat_currency === 'usd' ? cost * USD_JPY_RATE : cost);
        }

        return Math.round(subscription.licenses?.reduce((total, acc) => {
            // if (!acc.billingCycle) return total;
            let monthlyCost = 0;
            const costInYen = acc.currency === 'usd' ? acc.unit_price * USD_JPY_RATE : acc.unit_price;
            const period = acc.billing_cycle || 1;
            switch (acc.billing_interval) {
                case 'day':
                    monthlyCost = (costInYen / period) * 30;
                    break;
                case 'week':
                    monthlyCost = (costInYen / period) * 4;
                    break;
                case 'month':
                    monthlyCost = costInYen / period;
                    break;
                case 'year':
                    monthlyCost = costInYen / (period * 12);
                    break;
            }
            return total + monthlyCost;
        }, 0));
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Briefcase className="w-8 h-8" />
                    {subscription.service_name}
                </h1>
                <div className="flex items-center gap-2">
                    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit {subscription.service_name}</DialogTitle>
                                <DialogDescription>
                                    Update the app's information below.
                                </DialogDescription>
                            </DialogHeader>
                            <SubscriptionForm
                                onSave={handleSave}
                                onCancel={() => setIsEditModalOpen(false)}
                                mode="update"
                                subscriptionId={subscription.id}
                                data={subscription}
                            />
                        </DialogContent>
                    </Dialog>

                    {subscription.cancellation_date && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <CalendarX2 className="h-3 w-3" />
                            Cancellation Scheduled: {formatDate(subscription.cancellation_date)}
                        </Badge>
                    )}
                    <Badge variant={isPerSeat ? 'secondary' : 'outline'}>
                        {isPerSeat ? 'Per-Seat' : 'Per-License'}
                    </Badge>
                    <Badge variant={subscription.license_type === 'subscription' ? 'default' : 'outline'}>
                        {subscription.license_type === 'subscription' ? 'Subscription' : 'Perpetual'}
                    </Badge>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {isSubscription && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Cost (JPY Equivalent)</CardTitle>
                            <JapaneseYen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(getMonthlyCostInYen(), 'jpy')}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {isPerSeat ? 'Total for assigned users' : 'Total for all accounts'}
                            </p>
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{isPerSeat ? 'Assigned Users' : 'License Status'}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usedLicenseCount} {!isPerSeat && `/ ${totalLicenseCount}`}</div>
                        <p className="text-xs text-muted-foreground">{isPerSeat ? 'Users' : 'Used / Total'}</p>
                    </CardContent>
                </Card>
                {isSubscription && !isPerSeat && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
                            <Percent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{usageRate}%</div>
                            <Progress value={usageRate} className="mt-2 h-2" />
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                    {isPerSeat ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Assigned User List</CardTitle>
                                        <CardDescription>Employees using this service.</CardDescription>
                                    </div>
                                    <EmployeeCombobox
                                        excludedEmployeeIds={subscription.employees?.map(emp => emp.employee_id) || []}
                                        triggerText={
                                            <Button variant="outline" size="sm">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Assign User
                                            </Button>
                                        }
                                        subscriptionId={subscription.id}
                                        pricingType={subscription.pricing_type}
                                        selectedLicenseId={undefined}
                                        onAssignmentUpdate={() => {
                                            // Refresh the UI when assignment changes
                                            refetch();
                                        }}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Name</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Assigned Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subscription.employees.length > 0 ? (
                                            subscription.employees.map(detail => (
                                                <TableRow key={detail.employee_id}>
                                                    <TableCell className="font-medium">{detail.name || 'N/A'}</TableCell>
                                                    <TableCell>{detail.location || '-'}</TableCell>
                                                    <TableCell>{detail.assigned_at ? formatDate(detail.assigned_at) : '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleUnassignUser(detail.employee_id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">No users are assigned.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            {unassignModal.open ? (
                                <Dialog open={unassignModal.open} onOpenChange={(open) => setUnassignModal(open ? unassignModal : { open: false })}>
                                    <DialogContent className="sm:max-w-[420px]">
                                        <DialogHeader>
                                            <DialogTitle>Unassign User</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to unassign {unassignModal.name || 'this user'} from {subscription.service_name}?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setUnassignModal({ open: false })} disabled={isUnassigning}>Cancel</Button>
                                            <Button variant="destructive" onClick={confirmUnassign} disabled={isUnassigning}>
                                                {isUnassigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isUnassigning ? 'Removing...' : 'Confirm Remove'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ) : null}
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Used License List</CardTitle>
                                    <CardDescription>Currently used licenses and their associated employees or devices.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Assigned To</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>License Key</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usedLicenses.length > 0 ? (
                                                usedLicenses.map(license => (
                                                    <TableRow
                                                        key={license.account_id}
                                                        onClick={() => license.assigned_employee?.id && router.push(`/license/employees/${license.assigned_employee?.id}/subscriptions/${id}/edit?accountId=${license.assigned_employee?.id}`)}
                                                        className={license.assigned_employee?.id ? "cursor-pointer" : ""}
                                                    >
                                                        <TableCell className="font-medium flex items-center gap-2">
                                                            {license.assigned_employee?.id && (
                                                                <>
                                                                    <User className="w-4 h-4 text-muted-foreground" />
                                                                    <span>{license.assigned_employee?.name}</span>
                                                                </>
                                                            )}
                                                            {/* {detail.assignedDevice && <Monitor className="w-4 h-4 text-muted-foreground" />*/}
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(license.unit_price, license.currency)} {license.billing_cycle ? `/ ${getBillingCycleText({ period: license.billing_cycle, unit: license.billing_interval })}` : ''}</TableCell>
                                                        <TableCell>{license.end_date ? formatDate(license.end_date) : 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <LicenseKeyDisplay licenseKey={license.license_key} />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center">No users.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Unused License List</CardTitle>
                                    <CardDescription>Contracted licenses that have not yet been assigned.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Account ID</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>License Key</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {unusedLicenses.length > 0 ? (
                                                unusedLicenses.map(license => (
                                                    <TableRow key={license.account_id}>
                                                        <TableCell className="font-medium">{license.account_id}</TableCell>
                                                        <TableCell>{formatCurrency(license.unit_price, license.currency)} {license.billing_cycle ? `/ ${getBillingCycleText({ period: license.billing_cycle, unit: license.billing_interval })}` : ''}</TableCell>
                                                        <TableCell>{license.end_date ? formatDate(license.end_date) : 'N/A'}</TableCell>
                                                        <TableCell>
                                                            <LicenseKeyDisplay licenseKey={license.license_key} />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <EmployeeCombobox
                                                                    onSelect={(employeeId, employeeName) => {
                                                                        // Handled inside EmployeeCombobox via ASSIGN_EMPLOYEE
                                                                        toast({
                                                                            title: 'License Assigned',
                                                                            description: `License has been assigned to ${employeeName}.`,
                                                                        });
                                                                    }}
                                                                    excludedEmployeeIds={usedLicenses
                                                                        .filter(lic => lic.assigned_employee?.employee_id)
                                                                        .map(lic => lic.assigned_employee!.employee_id as string)
                                                                    }
                                                                    triggerText={
                                                                        <Button variant="outline" size="sm">
                                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                                            Assign
                                                                        </Button>
                                                                    }
                                                                    subscriptionId={subscription.id}
                                                                    pricingType={subscription.pricing_type}
                                                                    selectedLicenseId={license.id as any}
                                                                    onAssignmentUpdate={() => {
                                                                        // Refresh the UI when assignment changes
                                                                        refetch();
                                                                    }}
                                                                />
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => setDeleteModal({ open: true, licenseId: (license as any).id as string, accountId: license.account_id })}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center">No unused licenses.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {deleteModal.open ? (
                                <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal(open ? deleteModal : { open: false })}>
                                    <DialogContent className="sm:max-w-[420px]">
                                        <DialogHeader>
                                            <DialogTitle>Delete License</DialogTitle>
                                            <DialogDescription>
                                                Are you sure you want to delete license {deleteModal.accountId || ''}?
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            <Button variant="outline" onClick={() => setDeleteModal({ open: false })} disabled={isDeleting}>Cancel</Button>
                                            <Button variant="destructive" onClick={confirmDeleteLicense} disabled={isDeleting}>
                                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ) : null}
                        </>
                    )}
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Service Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex items-center">
                                <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="font-semibold mr-2">Vendor:</span>
                                <span>{subscription.vendor || '-'}</span>
                            </div>
                            <div className="flex items-center">
                                <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="font-semibold mr-2">Category:</span>
                                <Badge variant="outline">{subscription.category || '-'}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contract Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            {isPerSeat && subscription.pricing_type === 'per-seat' && (
                                <div className="flex items-center">
                                    <JapaneseYen className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span className="font-semibold mr-2">Price per User:</span>
                                    <span>
                                        {subscription.per_seat_monthly_price ? `${formatCurrency(subscription.per_seat_monthly_price, subscription.per_seat_currency)}/month` : ''}
                                        {subscription.per_seat_monthly_price && subscription.per_seat_yearly_price ? ` or ` : ''}
                                        {subscription.per_seat_yearly_price ? `${formatCurrency(subscription.per_seat_yearly_price, subscription.per_seat_currency)}/year` : ''}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="font-semibold mr-2">Payment Method:</span>
                                <span>{subscription.payment_method || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Links</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {subscription.official_website && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={subscription.official_website} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" /> Official Website
                                    </a>
                                </Button>
                            )}
                            {subscription.official_support && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={subscription.official_support} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" /> Support Page
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{subscription.notes || 'No notes available.'}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
