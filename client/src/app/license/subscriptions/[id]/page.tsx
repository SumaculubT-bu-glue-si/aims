
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { subscriptions as initialSubscriptions, employees as initialEmployees } from '@/lib/mock-data';
import type { BillingCycle, Account, Subscription, AssignedUser, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, JapaneseYen, Percent, Briefcase, LayoutDashboard, Building, Tag, CreditCard, ExternalLink, Monitor, User, MoreHorizontal, Trash2, Edit, PlusCircle, Check, ChevronsUpDown, CalendarX2, Package, KeyRound, ShieldCheck } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import LicenseKeyDisplay from '@/components/license-key-display';
import { SystemSwitcher } from '@/components/system-switcher';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import SubscriptionForm from '@/components/subscription-form';
import { toast } from '@/hooks/use-toast';


const USD_JPY_RATE = 150;

function formatDate(date?: string) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-CA');
}

function formatCurrency(amount: number, currency: 'JPY' | 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
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
    employees,
    onSelect,
    triggerText
}: {
    employees: { id: string; name: string }[];
    onSelect: (employeeId: string) => void;
    triggerText: React.ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {triggerText}
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command
                    filter={(value, search) => {
                        const employee = employees.find(e => e.id === value);
                        if (employee && employee.name.toLowerCase().includes(search.toLowerCase())) return 1;
                        return 0;
                    }}
                >
                    <CommandInput placeholder='Search employee...' />
                    <CommandList>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandGroup>
                            {employees.map((employee) => (
                                <CommandItem
                                    key={employee.id}
                                    value={employee.id}
                                    onSelect={(currentValue) => {
                                        onSelect(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === employee.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {employee.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
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

    const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const subscription = subscriptions.find((sub) => sub.id === id);

    useEffect(() => {
        const storedSubscriptions = localStorage.getItem('subscriptions');
        const storedEmployees = localStorage.getItem('employees');
        setSubscriptions(storedSubscriptions ? JSON.parse(storedSubscriptions) : initialSubscriptions);
        setEmployees(storedEmployees ? JSON.parse(storedEmployees) : initialEmployees);
    }, []);

    const updateSubscriptions = (newSubscriptions: Subscription[]) => {
        setSubscriptions(newSubscriptions);
        localStorage.setItem('subscriptions', JSON.stringify(newSubscriptions));
    };

    const handleSave = (data: Partial<Subscription>) => {
        const updatedSubscriptions = subscriptions.map(sub => (sub.id === id ? { ...sub, ...data } as Subscription : sub));
        updateSubscriptions(updatedSubscriptions);
        setIsEditModalOpen(false);
        try {
            toast({ title: 'Updated', description: 'App information updated successfully' });
        } catch (e) {
            // ignore
        }
    };

    // Per-license assignment change handler
    const handleAssignmentChange = (accountId: string, newAssignment: { type: 'user' | 'device' | 'unassign', id?: string }) => {
        const newSubscriptions = subscriptions.map(sub => {
            if (sub.id === id) {
                const newAccounts = sub.accounts.map(acc => {
                    if (acc.accountId === accountId) {
                        if (newAssignment.type === 'unassign') {
                            const { assignedUser, assignedDevice, ...rest } = acc;
                            return rest;
                        } else if (newAssignment.type === 'user') {
                            const { assignedDevice, ...rest } = acc;
                            return { ...rest, assignedUser: newAssignment.id };
                        } else if (newAssignment.type === 'device') {
                            const { assignedUser, ...rest } = acc;
                            return { ...rest, assignedDevice: newAssignment.id };
                        }
                    }
                    return acc;
                });
                return { ...sub, accounts: newAccounts };
            }
            return sub;
        });
        updateSubscriptions(newSubscriptions);
    };

    // Per-license account deletion
    const handleDeleteAccount = (accountId: string) => {
        if (!subscription) return;
        const newAccounts = subscription.accounts.filter(
            (acc) => acc.accountId !== accountId
        );
        const newSubscription = { ...subscription, accounts: newAccounts };
        const newSubscriptions = subscriptions.map((s) => (s.id === id ? newSubscription : s));
        updateSubscriptions(newSubscriptions);
    };

    // Per-seat user assignment
    const handleAssignUser = (employeeId: string) => {
        if (!subscription || subscription.pricingType !== 'per-seat') return;
        const newAssignedUsers = [...(subscription.assignedUsers || []), { employeeId, assignedDate: new Date().toISOString() }];
        const newSubscription = { ...subscription, assignedUsers: newAssignedUsers };
        const newSubscriptions = subscriptions.map(s => s.id === id ? newSubscription : s);
        updateSubscriptions(newSubscriptions);
    };

    // Per-seat user unassignment
    const handleUnassignUser = (employeeId: string) => {
        if (!subscription || subscription.pricingType !== 'per-seat') return;
        const newAssignedUsers = (subscription.assignedUsers || []).filter(u => u.employeeId !== employeeId);
        const newSubscription = { ...subscription, assignedUsers: newAssignedUsers };
        const newSubscriptions = subscriptions.map(s => s.id === id ? newSubscription : s);
        updateSubscriptions(newSubscriptions);
    };


    if (!subscription) {
        return <div>Subscription not found.</div>;
    }

    const getMonthlyCostInYen = () => {
        if (subscription.pricingType === 'per-seat' && subscription.perUserPricing) {
            const userCount = subscription.assignedUsers?.length || 0;
            const price = subscription.perUserPricing.monthly || (subscription.perUserPricing.yearly || 0) / 12;
            const cost = userCount * price;
            return Math.round(subscription.perUserPricing.currency === 'USD' ? cost * USD_JPY_RATE : cost);
        }

        return Math.round(subscription.accounts.reduce((total, acc) => {
            if (!acc.billingCycle) return total;
            let monthlyCost = 0;
            const costInYen = acc.currency === 'USD' ? acc.amount * USD_JPY_RATE : acc.amount;
            const period = acc.billingCycle.period || 1;
            switch (acc.billingCycle.unit) {
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

    // --- Per-License Vars ---
    const usedAccounts = subscription.accounts.filter(acc => acc.assignedUser || acc.assignedDevice);
    const unusedAccounts = subscription.accounts.filter(acc => !acc.assignedUser && !acc.assignedDevice);
    const licenseDetails = usedAccounts.map(acc => {
        const employee = employees.find(e => e.id === acc.assignedUser);
        return { ...acc, employee };
    });

    // --- Per-Seat Vars ---
    const assignedUserDetails = (subscription.assignedUsers || []).map(u => ({
        ...u,
        employee: employees.find(e => e.id === u.employeeId)
    }));
    const availableEmployeesForSeat = employees.filter(emp =>
        !(subscription.assignedUsers || []).some(u => u.employeeId === emp.id)
    );

    const monthlyCostYen = getMonthlyCostInYen();
    const totalLicenseCount = subscription.pricingType === 'per-seat' ? (subscription.assignedUsers?.length || 0) : subscription.accounts.length;
    const usedLicenseCount = subscription.pricingType === 'per-seat' ? (subscription.assignedUsers?.length || 0) : usedAccounts.length;
    const usageRate = totalLicenseCount > 0 ? Math.round((usedLicenseCount / totalLicenseCount) * 100) : 0;

    const isSubscription = subscription.licenseType === 'subscription';

    const availableEmployeesForLicense = employees.filter(emp =>
        !usedAccounts.some(acc => acc.assignedUser === emp.id)
    );

    const isPerSeat = subscription.pricingType === 'per-seat';
    const isPerpetual = subscription.licenseType === 'perpetual';

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Briefcase className="w-8 h-8" />
                    {subscription.name}
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
                                <DialogTitle>Edit {subscription.name}</DialogTitle>
                                <DialogDescription>
                                    Update the app's information below.
                                </DialogDescription>
                            </DialogHeader>
                            <SubscriptionForm onSave={handleSave} onCancel={() => setIsEditModalOpen(false)} initialData={subscription} />
                        </DialogContent>
                    </Dialog>

                    {subscription.cancellationDate && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                            <CalendarX2 className="h-3 w-3" />
                            Cancellation Scheduled: {formatDate(subscription.cancellationDate)}
                        </Badge>
                    )}
                    <Badge variant={isPerSeat ? 'secondary' : 'outline'}>
                        {isPerSeat ? 'Per-Seat' : 'Per-License'}
                    </Badge>
                    <Badge variant={subscription.licenseType === 'subscription' ? 'default' : 'outline'}>
                        {subscription.licenseType === 'subscription' ? 'Subscription' : 'Perpetual'}
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
                                {formatCurrency(monthlyCostYen, 'JPY')}
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
                                        employees={availableEmployeesForSeat}
                                        onSelect={handleAssignUser}
                                        triggerText={
                                            <Button variant="outline" size="sm">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Assign User
                                            </Button>
                                        }
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Assigned Date</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {assignedUserDetails.length > 0 ? (
                                            assignedUserDetails.map(detail => (
                                                <TableRow key={detail.employeeId}>
                                                    <TableCell className="font-medium">{detail.employee?.name || 'N/A'}</TableCell>
                                                    <TableCell>{detail.employee?.department || 'N/A'}</TableCell>
                                                    <TableCell>{formatDate(detail.assignedDate)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={() => handleUnassignUser(detail.employeeId)}>
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
                                            <TableRow>
                                                <TableHead>Assigned To</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>License Key</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {licenseDetails.length > 0 ? (
                                                licenseDetails.map(detail => (
                                                    <TableRow
                                                        key={detail.accountId}
                                                        onClick={() => detail.assignedUser && router.push(`/license/employees/${detail.assignedUser}/subscriptions/${id}/edit?accountId=${detail.accountId}`)}
                                                        className={detail.assignedUser ? "cursor-pointer" : ""}
                                                    >
                                                        <TableCell className="font-medium flex items-center gap-2">
                                                            {detail.assignedUser && <User className="w-4 h-4 text-muted-foreground" />}
                                                            {detail.assignedDevice && <Monitor className="w-4 h-4 text-muted-foreground" />}
                                                            <span>{detail.employee?.name || detail.assignedDevice || 'N/A'}</span>
                                                        </TableCell>
                                                        <TableCell>{formatCurrency(detail.amount, detail.currency)} {detail.billingCycle ? `/ ${getBillingCycleText(detail.billingCycle)}` : ''}</TableCell>
                                                        <TableCell>{formatDate(detail.endDate)}</TableCell>
                                                        <TableCell>
                                                            <LicenseKeyDisplay licenseKey={detail.licenseKey} />
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
                                            <TableRow>
                                                <TableHead>Account ID</TableHead>
                                                <TableHead>Unit Price</TableHead>
                                                <TableHead>End Date</TableHead>
                                                <TableHead>License Key</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {unusedAccounts.length > 0 ? (
                                                unusedAccounts.map(account => (
                                                    <TableRow key={account.accountId}>
                                                        <TableCell className="font-medium">{account.accountId}</TableCell>
                                                        <TableCell>{formatCurrency(account.amount, account.currency)} {account.billingCycle ? `/ ${getBillingCycleText(account.billingCycle)}` : ''}</TableCell>
                                                        <TableCell>{formatDate(account.endDate)}</TableCell>
                                                        <TableCell>
                                                            <LicenseKeyDisplay licenseKey={account.licenseKey} />
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                <EmployeeCombobox
                                                                    employees={availableEmployeesForLicense}
                                                                    onSelect={(employeeId) => handleAssignmentChange(account.accountId, { type: 'user', id: employeeId })}
                                                                    triggerText={
                                                                        <Button variant="outline" size="sm">
                                                                            <PlusCircle className="mr-2 h-4 w-4" />
                                                                            Assign
                                                                        </Button>
                                                                    }
                                                                />
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteAccount(account.accountId)}
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
                            {isPerSeat && subscription.perUserPricing && (
                                <div className="flex items-center">
                                    <JapaneseYen className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <span className="font-semibold mr-2">Price per User:</span>
                                    <span>
                                        {subscription.perUserPricing.monthly ? `${formatCurrency(subscription.perUserPricing.monthly, subscription.perUserPricing.currency)}/month` : ''}
                                        {subscription.perUserPricing.monthly && subscription.perUserPricing.yearly ? ` or ` : ''}
                                        {subscription.perUserPricing.yearly ? `${formatCurrency(subscription.perUserPricing.yearly, subscription.perUserPricing.currency)}/year` : ''}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />
                                <span className="font-semibold mr-2">Payment Method:</span>
                                <span>{subscription.paymentMethod || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Related Links</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            {subscription.website && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={subscription.website} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" /> Official Website
                                    </a>
                                </Button>
                            )}
                            {subscription.supportPage && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={subscription.supportPage} target="_blank" rel="noopener noreferrer">
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
