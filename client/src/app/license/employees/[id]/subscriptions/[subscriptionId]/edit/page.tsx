
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import type { Subscription, Employee, Account, AssignedUser } from '@/lib/types';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

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

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const [employee, setEmployee] = useState<Employee | undefined>();
    const [subscription, setSubscription] = useState<Subscription | undefined>();
    const [assignmentData, setAssignmentData] = useState<Partial<Account> | Partial<AssignedUser> | undefined>();
    const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const storedSubs = localStorage.getItem('subscriptions');
        const storedEmps = localStorage.getItem('employees');
        const subs = storedSubs ? JSON.parse(storedSubs) : initialSubscriptions;
        const emps = storedEmps ? JSON.parse(storedEmps) : initialEmployees;

        setSubscriptions(subs);
        setEmployees(emps);

        const emp = emps.find((e: Employee) => e.id === employeeId);
        const sub = subs.find((s: Subscription) => s.id === subscriptionId);
        console.log(subs, emps);

        setEmployee(emp);
        setSubscription(sub);

        if (sub && emp) {
            if (sub.pricingType === 'per-license' && accountId) {
                const account = sub.accounts.find((a: { accountId: string; }) => a.accountId === accountId);
                setAssignmentData(account);
            } else if (sub.pricingType === 'per-seat') {
                const userAssignment = sub.assignedUsers?.find((u: { employeeId: string; }) => u.employeeId === employeeId);
                setAssignmentData(userAssignment);
            }
        }
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
                defaultValues.endDate = new Date(assignmentData.endDate).toISOString().split('T')[0];
            }
            if ('renewalDate' in assignmentData && assignmentData.renewalDate) {
                defaultValues.renewalDate = new Date(assignmentData.renewalDate).toISOString().split('T')[0];
            }
            if ('assignedDate' in assignmentData && assignmentData.assignedDate) {
                defaultValues.assignedDate = new Date(assignmentData.assignedDate).toISOString().split('T')[0];
            }
            form.reset(defaultValues);
        }
    }, [assignmentData, form]);


    const handleSave = (data: FormValues) => {
        const updatedSubscriptions = subscriptions.map(sub => {
            if (sub.id === subscriptionId) {
                if (sub.pricingType === 'per-license' && accountId) {
                    const updatedAccounts = sub.accounts.map(acc => {
                        if (acc.accountId === accountId) {
                            return { ...acc, endDate: data.endDate, renewalDate: data.renewalDate };
                        }
                        return acc;
                    });
                    return { ...sub, accounts: updatedAccounts };
                } else if (sub.pricingType === 'per-seat') {
                    const updatedUsers = sub.assignedUsers?.map(user => {
                        if (user.employeeId === employeeId) {
                            return { ...user, assignedDate: data.assignedDate || new Date().toISOString() };
                        }
                        return user;
                    });
                    return { ...sub, assignedUsers: updatedUsers };
                }
            }
            return sub;
        });

        localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
        setSubscriptions(updatedSubscriptions);
        // show success toast
        try {
            toast({ title: 'Updated', description: 'Subscription updated successfully' });
        } catch (e) {
            // swallow; toast may not be available in some edge cases
        }
        // Navigate back to the employee detail within the license section
        router.push(`/license/employees/${employeeId}`);
    };

    const handleUnassign = () => {
        // Open the confirm dialog instead of using the browser confirm
        setIsUnassignDialogOpen(true);
    }

    const confirmUnassign = () => {
        const updatedSubscriptions = subscriptions.map(sub => {
            if (sub.id === subscriptionId) {
                if (sub.pricingType === 'per-license' && accountId) {
                    const updatedAccounts = sub.accounts.map(acc => {
                        if (acc.accountId === accountId) {
                            const { assignedUser, ...rest } = acc;
                            return rest;
                        }
                        return acc;
                    });
                    return { ...sub, accounts: updatedAccounts };
                } else if (sub.pricingType === 'per-seat') {
                    const updatedUsers = sub.assignedUsers?.filter(user => user.employeeId !== employeeId);
                    return { ...sub, assignedUsers: updatedUsers };
                }
            }
            return sub;
        });

        localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
        setSubscriptions(updatedSubscriptions);
        // Set a flash message in sessionStorage so the employee detail page can show feedback
        try {
            sessionStorage.setItem('flash_unassign_message', 'Subscription unassigned successfully');
        } catch (e) {
            // ignore (SSR or storage disabled)
        }
        setIsUnassignDialogOpen(false);
        router.push(`/license/employees/${employeeId}`);
    }


    if (!employee || !subscription) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen max-w-lg w-full m-auto bg-background">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <User className="w-8 h-8" />
                    {employee.name} - {subscription.name}
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
                            {subscription.pricingType === 'per-license' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>End Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="renewalDate"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Renewal Date</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                            {subscription.pricingType === 'per-seat' && (
                                <FormField
                                    control={form.control}
                                    name="assignedDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assigned Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
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
                                            Are you sure you want to unassign this subscription from {employee.name}? This action can be undone by reassigning.
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
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
