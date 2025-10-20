
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import type { Subscription, Employee, Account, AssignedUser } from '@/lib/types';
import { CalendarIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { graphqlQuery, INVENTORY_QUERIES, getSubscriptions, updateSubscription, updatePerSeatAssignedDate } from '@/lib/graphql-client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { enUS, ja } from "date-fns/locale"
import { format, parse } from "date-fns"
import { useI18n } from "@/hooks/use-i18n"
import { cn } from '@/lib/utils';

const formSchema = z.object({
    endDate: z.string().optional(),
    renewalDate: z.string().optional(),
    assignedDate: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;


export default function EditEmployeeSubscriptionPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    // Route params can be shaped differently depending on how the route is nested.
    // Accept either `id` / `subscriptionId` for the subscription and `id` / `employeeId` for the employee.
    const employeeId = (params.employeeId ?? params.id) as string;
    const subscriptionId = (params.subscriptionId ?? params.id) as string;
    const accountId = searchParams.get('accountId');

    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [employee, setEmployee] = useState<Employee | undefined>();
    const [subscription, setSubscription] = useState<Subscription | undefined>();
    const [assignmentData, setAssignmentData] = useState<Partial<Account> | Partial<AssignedUser> | undefined>();
    const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
    const { toast } = useToast();
    const { t } = useI18n();

    const toYmd = (v: any): string => {
        if (!v) return '';
        const s = String(v);
        if (s.includes('T')) return s.split('T')[0];
        if (s.includes(' ')) return s.split(' ')[0];
        return s.slice(0, 10);
    };

    useEffect(() => {
        const load = async () => {
            // fetch employees (for name display)
            const empResp = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES, { first: 1000, page: 1 });
            const emps: Employee[] = (empResp?.data?.employees?.data || []).map((emp: any) => ({
                id: emp.id,
                employee_id: emp.employee_id,
                name: emp.name,
                email: emp.email || '',
                location: emp.location || '',
                org_unit_path: emp.org_unit_path || '',
                projects: Array.isArray(emp.projects) ? (emp.projects.join(', ')) : (emp.projects || ''),
            }));
            setEmployees(emps);
            const emp = emps.find(e => e.employee_id === employeeId);
            setEmployee(emp);

            // fetch subscriptions
            const subs = await getSubscriptions();
            setSubscriptions(subs || []);
            const sub = (subs || []).find((s: any) => s.id === subscriptionId);
            setSubscription(sub);

            if (sub && emp) {
                if (sub.pricing_type === 'per-license' && accountId) {
                    const license = (sub.licenses || []).find((a: any) => a.account_id === accountId);
                    setAssignmentData(license ? { endDate: license.end_date || '', renewalDate: license.renewal_date || '' } : undefined);
                } else if (sub.pricing_type === 'per-seat') {
                    const assignedEmp = (sub.employees || []).find((e: any) => e.employee_id === emp.employee_id);
                    setAssignmentData(assignedEmp?.assigned_at ? { assignedDate: toYmd(assignedEmp.assigned_at) } : undefined);
                }
            }
        };
        load();
    }, [employeeId, subscriptionId, accountId]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            endDate: '',
            renewalDate: '',
            assignedDate: '',
        },
    });

    useEffect(() => {
        if (assignmentData) {
            const defaultValues: FormValues = {};
            if ('endDate' in assignmentData && assignmentData.endDate) {
                const s = String(assignmentData.endDate);
                defaultValues.endDate = s.includes('T') ? s.split('T')[0] : s;
            }
            if ('renewalDate' in assignmentData && assignmentData.renewalDate) {
                const s = String(assignmentData.renewalDate);
                defaultValues.renewalDate = s.includes('T') ? s.split('T')[0] : s;
            }
            if ('assignedDate' in assignmentData && assignmentData.assignedDate) {
                defaultValues.assignedDate = toYmd((assignmentData as any).assignedDate);
            }
            form.reset(defaultValues);
        }
    }, [assignmentData, form]);


    const handleSave = async (data: FormValues) => {
        if (!subscription) return;
        if (subscription.pricing_type === 'per-license' && accountId) {
            const allLicenses = (subscription.licenses || []).map((lic: any) => {
                const isTarget = lic.account_id === accountId;
                return {
                    id: lic.id,
                    accountId: lic.account_id,
                    unitPrice: lic.unit_price,
                    currency: lic.currency,
                    billingCycle: lic.billing_cycle,
                    billingInterval: lic.billing_interval,
                    startDate: lic.start_date,
                    endDate: isTarget ? (data.endDate ? new Date(data.endDate) : lic.end_date) : lic.end_date,
                    renewalDate: isTarget ? (data.renewalDate ? new Date(data.renewalDate) : lic.renewal_date) : lic.renewal_date,
                    version: lic.version,
                    licenseKey: lic.license_key,
                    used: lic.used,
                    assignedEmployee: lic.assigned_employee ? { employee_id: lic.assigned_employee.employee_id } : undefined,
                };
            });

            const subscriptionData: any = {
                serviceName: subscription.service_name,
                vendor: subscription.vendor,
                licenseType: subscription.license_type,
                pricingType: subscription.pricing_type,
                status: subscription.status,
                category: subscription.category,
                paymentMethod: subscription.payment_method,
                cancellationDate: subscription.cancellation_date,
                officialWebsite: subscription.official_website,
                officialSupport: subscription.official_support,
                notes: subscription.notes,
                perSeatMonthlyPrice: subscription.per_seat_monthly_price ?? undefined,
                perSeatYearlyPrice: subscription.per_seat_yearly_price ?? undefined,
                perSeatCurrency: subscription.per_seat_currency ?? undefined,
                licenses: allLicenses,
            };
            await updateSubscription(subscriptionId, subscriptionData);
        } else if (subscription.pricing_type === 'per-seat') {
            if (!employee) return;
            const dateStr = (data.assignedDate && data.assignedDate.trim()) ? data.assignedDate : new Date().toISOString().split('T')[0];
            await updatePerSeatAssignedDate(subscriptionId, employee.employee_id, dateStr);
        }

        try {
            toast({ title: 'Updated', description: 'Subscription updated successfully' });
        } catch { }
        const redirect = searchParams.get('redirect');
        if (redirect) {
            router.push(redirect);
        } else {
            router.push(`/license/employees/${employeeId}`);
        }
    };

    const handleUnassign = () => {
        // Open the confirm dialog instead of using the browser confirm
        setIsUnassignDialogOpen(true);
    }

    const confirmUnassign = async () => {
        if (!subscription) return;
        if (subscription.pricing_type === 'per-license' && accountId) {
            const allLicenses = (subscription.licenses || []).map((lic: any) => {
                const isTarget = lic.account_id === accountId;
                return {
                    id: lic.id,
                    accountId: lic.account_id,
                    unitPrice: lic.unit_price,
                    currency: lic.currency,
                    billingCycle: lic.billing_cycle,
                    billingInterval: lic.billing_interval,
                    startDate: lic.start_date,
                    endDate: lic.end_date,
                    renewalDate: lic.renewal_date,
                    version: lic.version,
                    licenseKey: lic.license_key,
                    used: lic.used,
                    assignedEmployee: isTarget ? undefined : (lic.assigned_employee ? { employee_id: lic.assigned_employee.employee_id } : undefined),
                };
            });

            const subscriptionData: any = {
                serviceName: subscription.service_name,
                vendor: subscription.vendor,
                licenseType: subscription.license_type,
                pricingType: subscription.pricing_type,
                status: subscription.status,
                category: subscription.category,
                paymentMethod: subscription.payment_method,
                cancellationDate: subscription.cancellation_date,
                officialWebsite: subscription.official_website,
                officialSupport: subscription.official_support,
                notes: subscription.notes,
                perSeatMonthlyPrice: subscription.per_seat_monthly_price ?? undefined,
                perSeatYearlyPrice: subscription.per_seat_yearly_price ?? undefined,
                perSeatCurrency: subscription.per_seat_currency ?? undefined,
                licenses: allLicenses,
            };
            await updateSubscription(subscriptionId, subscriptionData);
        }

        try {
            sessionStorage.setItem('flash_unassign_message', 'Subscription unassigned successfully');
        } catch { }
        setIsUnassignDialogOpen(false);
        const redirect = searchParams.get('redirect');
        if (redirect) {
            router.push(redirect);
        } else {
            router.push(`/license/employees/${employeeId}`);
        }
    }


    if (!employee || !subscription) {
        return (
            <div className="flex flex-col min-h-screen max-w-lg w-full m-auto bg-background">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <User className="w-8 h-8" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                    <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Assignment Information</CardTitle>
                        <CardDescription>Edit the details of the subscription assigned to this employee.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={`row-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="h-10 bg-muted animate-pulse rounded" />
                                    <div className="h-10 bg-muted animate-pulse rounded" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen max-w-lg w-full m-auto bg-background">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <User className="w-8 h-8" />
                    {employee.name} - {subscription.service_name}
                </h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment Information</CardTitle>
                            <CardDescription>Edit the details of the subscription assigned to this employee.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscription?.pricing_type === 'per-license' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="endDate" render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(parse(field.value, 'yyyy-MM-dd', new Date()), t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="renewalDate" render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Renewal Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(parse(field.value, 'yyyy-MM-dd', new Date()), t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}
                            {subscription?.pricing_type === 'per-seat' && (
                                <FormField
                                    control={form.control}
                                    name="assignedDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assigned Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "h-10 w-full justify-start text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value
                                                                ? format(
                                                                    parse(field.value, 'yyyy-MM-dd', new Date()),
                                                                    t('date.format'),
                                                                    { locale: t('date.locale') === 'en-US' ? enUS : ja }
                                                                )
                                                                : <span>{t('actions.pick_date')}</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : undefined}
                                                        onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center">
                        <>
                            <Button type="button" variant="destructive" onClick={handleUnassign}>
                                Unassign
                            </Button>
                            <Dialog open={isUnassignDialogOpen} onOpenChange={setIsUnassignDialogOpen}>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Confirm Unassign</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to unassign this subscription from {employee?.name}? This action can be undone by reassigning.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button variant="outline" onClick={() => setIsUnassignDialogOpen(false)}>Cancel</Button>
                                        <Button variant="destructive" onClick={confirmUnassign}>Unassign</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => {
                                const redirect = searchParams.get('redirect');
                                if (redirect) {
                                    router.push(redirect);
                                } else {
                                    router.back();
                                }
                            }}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Saving…' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}


