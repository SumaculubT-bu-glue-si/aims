
'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import type { Subscription, Account, AssignedUser } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const billingCycleSchema = z.object({
    unit: z.enum(['day', 'week', 'month', 'year']),
    period: z.coerce.number().int().min(1, 'Period must be at least 1'),
}).optional();

const accountSchema = z.object({
    accountId: z.string().min(1, 'Account ID is required'),
    amount: z.coerce.number().min(0, 'Amount must be 0 or greater'),
    currency: z.enum(['JPY', 'USD']),
    billingCycle: billingCycleSchema,
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    renewalDate: z.string().optional(),
    version: z.string().optional(),
    licenseKey: z.string().optional(),
    // Add these so they are not stripped out by the form
    assignedUser: z.string().optional(),
    assignedDevice: z.string().optional(),
});

const perUserPricingSchema = z.object({
    monthly: z.coerce.number().optional(),
    yearly: z.coerce.number().optional(),
    currency: z.enum(['JPY', 'USD']),
}).optional();

const assignedUserSchema = z.object({
    employeeId: z.string(),
    assignedDate: z.string(),
});

const subscriptionSchema = z.object({
    name: z.string().min(1, { message: 'Service name is required' }),
    licenseType: z.enum(['subscription', 'perpetual'], { required_error: 'License type is required' }),
    pricingType: z.enum(['per-license', 'per-seat'], { required_error: 'Pricing type is required' }),
    status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
    vendor: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
    supportPage: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
    notes: z.string().optional(),
    accounts: z.array(accountSchema),
    perUserPricing: perUserPricingSchema.optional(),
    cancellationDate: z.string().optional(),
    assignedUsers: z.array(assignedUserSchema).optional(), // Keep assignedUsers
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
    onSave: (data: Partial<Subscription>) => void;
    onCancel: () => void;
    initialData?: Partial<Subscription>;
}

function PricingTypeFields({ control }: { control: any }) {
    const pricingType = useWatch({ control, name: 'pricingType' });
    const licenseType = useWatch({ control, name: 'licenseType' });
    const { fields, append, remove } = useFieldArray({
        control: control,
        name: "accounts",
    });

    if (pricingType === 'per-seat') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Price Per User</CardTitle>
                    <CardDescription>Enter the pricing plan per user.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={control}
                            name="perUserPricing.monthly"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monthly (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="1000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="perUserPricing.yearly"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Yearly (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="10000" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="perUserPricing.currency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Currency <span className="text-destructive ml-1">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder='Select currency' />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="JPY">JPY</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormDescription>Enter either monthly or yearly price, or both.</FormDescription>
                </CardContent>
            </Card>
        )
    }

    if (pricingType === 'per-license') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Enter the license (account) information for this app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.accountId`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account ID <span className="text-destructive ml-1">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder='ID for the account/license' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.amount`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit Price <span className="text-destructive ml-1">*</span></FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="1000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.currency`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Currency <span className="text-destructive ml-1">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select currency' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="JPY">JPY</SelectItem>
                                                    <SelectItem value="USD">USD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {licenseType === 'subscription' && (
                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <FormField
                                            control={control}
                                            name={`accounts.${index}.billingCycle.period`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Billing Cycle</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="1" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name={`accounts.${index}.billingCycle.unit`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>&nbsp;</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder='Unit' />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="day">day</SelectItem>
                                                            <SelectItem value="week">week</SelectItem>
                                                            <SelectItem value="month">month</SelectItem>
                                                            <SelectItem value="year">year</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.startDate`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.endDate`}
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
                                {licenseType === 'subscription' && (
                                    <FormField
                                        control={control}
                                        name={`accounts.${index}.renewalDate`}
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
                                )}
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.version`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Version</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1.0.0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={control}
                                    name={`accounts.${index}.licenseKey`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>License Key</FormLabel>
                                            <FormControl>
                                                <Input placeholder="XXXX-XXXX-XXXX-XXXX" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ accountId: `new-${fields.length + 1}`, amount: 0, currency: 'JPY', billingCycle: { unit: 'month', period: 1 } })}
                    >
                        Add Account
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    return null;
}


export default function SubscriptionForm({ onSave, onCancel, initialData }: SubscriptionFormProps) {
    const router = useRouter();

    const form = useForm<SubscriptionFormValues>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: initialData ? {
            ...initialData,
            cancellationDate: initialData.cancellationDate ? new Date(initialData.cancellationDate).toISOString().split('T')[0] : '',
            accounts: initialData.accounts?.map(a => ({
                ...a,
                startDate: a.startDate ? new Date(a.startDate).toISOString().split('T')[0] : '',
                endDate: a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : '',
                renewalDate: a.renewalDate ? new Date(a.renewalDate).toISOString().split('T')[0] : '',
            })) || [],
            perUserPricing: initialData.perUserPricing || { currency: 'JPY' }
        } : {
            name: '',
            licenseType: 'subscription',
            pricingType: 'per-license',
            status: 'active',
            vendor: '',
            category: '',
            paymentMethod: '',
            website: '',
            supportPage: '',
            notes: '',
            accounts: [],
            assignedUsers: [],
            perUserPricing: { currency: 'JPY' },
            cancellationDate: '',
        },
    });

    const onSubmit = (data: SubscriptionFormValues) => {
        const saveData: Partial<Subscription> = {
            ...data,
        };

        if (initialData) {
            if (data.pricingType === 'per-license') {
                saveData.accounts = data.accounts as Account[] | undefined;
                saveData.perUserPricing = undefined;
                saveData.assignedUsers = initialData.assignedUsers; // Retain existing users
            } else if (data.pricingType === 'per-seat') {
                saveData.perUserPricing = data.perUserPricing;
                saveData.accounts = initialData.accounts; // Retain existing accounts
                saveData.assignedUsers = data.assignedUsers;
            }
        } else {
            // This is a new subscription
            if (data.pricingType === 'per-license') {
                saveData.accounts = data.accounts as Account[] | undefined;
                saveData.assignedUsers = [];
            } else if (data.pricingType === 'per-seat') {
                saveData.assignedUsers = [];
                saveData.accounts = [];
            }
        }
        onSave(saveData);
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>Enter the basic information for the app to be managed.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Service Name <span className="text-destructive ml-1">*</span></FormLabel>
                                            <FormControl>
                                                <Input placeholder='e.g., Google Workspace' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="vendor"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vendor</FormLabel>
                                            <FormControl>
                                                <Input placeholder='e.g., Google LLC' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="licenseType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>License Type <span className="text-destructive ml-1">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData?.licenseType}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select license type' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="subscription">Subscription</SelectItem>
                                                    <SelectItem value="perpetual">Perpetual</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pricingType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pricing Type <span className="text-destructive ml-1">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select pricing type' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="per-license">Per-License</SelectItem>
                                                    <SelectItem value="per-seat">Per-Seat</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status <span className="text-destructive ml-1">*</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select status' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <FormControl>
                                                <Input placeholder='e.g., Groupware' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Payment Method</FormLabel>
                                            <FormControl>
                                                <Input placeholder='e.g., Credit Card' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cancellationDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cancellation Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Official Website</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="supportPage"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Support Page</FormLabel>
                                        <FormControl>
                                            <Input type="url" placeholder="https://example.com/support" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder='Enter notes for management' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <PricingTypeFields control={form.control} />
                </div>


                <div className="flex justify-end gap-2 sticky bottom-0 bg-background py-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Form>
    );
}

