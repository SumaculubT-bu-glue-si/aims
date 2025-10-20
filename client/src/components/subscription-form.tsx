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
import { CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { enUS, ja } from "date-fns/locale"
import { format } from "date-fns"
import { useI18n } from "@/hooks/use-i18n"
import { createSubscription, updateSubscription } from '@/lib/graphql-client';

const licenseSchema = z.object({
    id: z.string().optional(),
    accountId: z.string().min(1, 'Account ID is required'),
    unitPrice: z.coerce.number().min(0, 'Amount must be 0 or greater'),
    currency: z.enum(['JPY', 'USD']),
    billingCycle: z.coerce.number().int().min(1, 'Period must be at least 1').optional(),
    billingInterval: z.enum(['day', 'week', 'month', 'year']).optional(),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    renewalDate: z.string().optional(),
    version: z.string().optional(),
    licenseKey: z.string().optional(),
    used: z.boolean().optional(),
    assignedEmployee: z.object({
        employeeId: z.string().optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        location: z.string().optional(),
        projects: z.string().optional(),
        orgUnitPath: z.string().optional(),
    }).optional(),
});

const assignedUserSchema = z.object({
    employeeId: z.string(),
    assignedDate: z.string(),
});

const subscriptionSchema = z.object({
    serviceName: z.string().min(1, { message: 'Service name is required' }),
    status: z.enum(['active', 'inactive'], { required_error: 'Status is required' }),
    pricingType: z.enum(['per-license', 'per-seat'], { required_error: 'Pricing type is required' }),
    licenseType: z.enum(['subscription', 'perpetual'], { required_error: 'License type is required' }),
    licenses: z.array(licenseSchema),
    vendor: z.string().optional(),
    category: z.string().optional(),
    paymentMethod: z.string().optional(),
    cancellationDate: z.date().optional(),
    officialWebsite: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
    officialSupport: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
    notes: z.string().optional(),
    // assignedUsers: z.array(assignedUserSchema).optional(),
    perSeatMonthlyPrice: z.coerce.number().optional(),
    perSeatYearlyPrice: z.coerce.number().optional(),
    perSeatCurrency: z.enum(['jpy', 'usd']).optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
    onSave: () => void;
    onCancel: () => void;
    mode: 'create' | 'update';
    subscriptionId?: string;
    initialData?: {
        licenseType: 'subscription' | 'perpetual';
        status: 'active' | 'inactive';
        pricingType: 'per-license' | 'per-seat';
    };
    data?: Subscription;
}

function PricingTypeFields({ control }: { control: any }) {
    const pricingType = useWatch({ control, name: 'pricingType' });
    const licenseType = useWatch({ control, name: 'licenseType' });
    const { fields, append, remove } = useFieldArray({
        control: control,
        name: "licenses",
    });

    const { t } = useI18n();

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
                            name="perSeatMonthlyPrice"
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
                            name="perSeatYearlyPrice"
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
                            name="perSeatCurrency"
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
                                            <SelectItem value="jpy">JPY</SelectItem>
                                            <SelectItem value="usd">USD</SelectItem>
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
        );
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
                                    name={`licenses.${index}.accountId`}
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
                                    name={`licenses.${index}.unitPrice`}
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
                                    name={`licenses.${index}.currency`}
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
                                            name={`licenses.${index}.billingCycle`}
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
                                            name={`licenses.${index}.billingInterval`}
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
                                <FormField control={control} name={`licenses.${index}.startDate`} render={({ field }) => (
                                    <FormItem className="">
                                        <FormLabel>Start Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={control} name={`licenses.${index}.endDate`} render={({ field }) => (
                                    <FormItem className="">
                                        <FormLabel>End Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                {licenseType === 'subscription' && (
                                    <FormField control={control} name={`licenses.${index}.renewalDate`} render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Renewal Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" onSelect={field.onChange} initialFocus /></PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                                <FormField
                                    control={control}
                                    name={`licenses.${index}.version`}
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
                                    name={`licenses.${index}.licenseKey`}
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
                        onClick={() => append({ accountId: `new-${fields.length + 1}`, unitPrice: 0, currency: 'JPY', billingCycle: 1, billingInterval: 'month' })}
                    >
                        Add Account
                    </Button>
                </CardFooter>
            </Card>
        );
    }
    return null;
}


import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Subscription } from '@/lib/types';

export default function SubscriptionForm({ onSave, onCancel, mode, subscriptionId, initialData, data }: SubscriptionFormProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    const form = useForm<SubscriptionFormValues>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            serviceName: data && data.service_name ? data.service_name : '',
            status: data && data.status ? data.status : 'active',
            pricingType: data && data.pricing_type ? data.pricing_type : 'per-license',
            licenseType: data && data.license_type ? data.license_type : initialData?.licenseType,
            licenses: data && data.licenses.length > 0 ? data.licenses.map(license => ({
                id: license.id,
                accountId: license.account_id,
                unitPrice: license.unit_price,
                currency: license.currency.toUpperCase() as 'JPY' | 'USD' ?? null,
                billingCycle: license.billing_cycle,
                billingInterval: license.billing_interval,
                startDate: license.start_date ? new Date(license.start_date) : undefined,
                endDate: license.end_date ? new Date(license.end_date) : undefined,
                renewalDate: license.renewal_date ? new Date(license.renewal_date) : undefined,
                version: license.version ?? undefined,
                licenseKey: license.license_key ?? undefined,
                used: license.used ?? false,
                assignedEmployee: license.assigned_employee ?? undefined
            })) : [],
            // assignedUsers: data ? [] : [],
            vendor: data && data.vendor ? data.vendor : '',
            category: data && data.category ? data.category : '',
            paymentMethod: data && data.payment_method ? data.payment_method : '',
            cancellationDate: data && data.cancellation_date ? new Date(data.cancellation_date) : undefined,
            officialWebsite: data && data.official_website ? data.official_website : '',
            officialSupport: data && data.official_support ? data.official_support : '',
            notes: data && data.notes ? data.notes : '',
            perSeatMonthlyPrice: data && data.per_seat_monthly_price ? data.per_seat_monthly_price : 0,
            perSeatYearlyPrice: data && data.per_seat_yearly_price ? data.per_seat_yearly_price : 0,
            perSeatCurrency: data && data.per_seat_currency ? data.per_seat_currency : 'jpy',
        },
    });

    const onSubmit = async (data: SubscriptionFormValues) => {
        setLoading(true);
        // Transform data to match the GraphQL input structure
        const subscriptionData = {
            serviceName: data.serviceName,
            vendor: data.vendor,
            licenseType: data.licenseType,
            pricingType: data.pricingType,
            status: data.status,
            category: data.category,
            paymentMethod: data.paymentMethod,
            cancellationDate: data.cancellationDate,
            officialWebsite: data.officialWebsite,
            officialSupport: data.officialSupport,
            perSeatMonthlyPrice: data.perSeatMonthlyPrice,
            perSeatYearlyPrice: data.perSeatYearlyPrice,
            perSeatCurrency: data.perSeatCurrency,
            notes: data.notes,
            licenses: data.licenses.map(license => ({
                id: (license as any).id,
                accountId: license.accountId,
                unitPrice: license.unitPrice,
                currency: license.currency,
                billingCycle: license.billingCycle,
                billingInterval: license.billingInterval,
                startDate: license.startDate,
                endDate: license.endDate,
                renewalDate: license.renewalDate,
                version: license.version,
                licenseKey: license.licenseKey,
                used: license.used,
                assignedEmployee: license.assignedEmployee
            })),
        };
        console.log(subscriptionData)

        try {
            if (mode === 'create') {
                await createSubscription(subscriptionData);
                toast({
                    title: 'Success',
                    description: 'Subscription created successfully.',
                });
            } else if (mode === 'update' && subscriptionId) {
                await updateSubscription(subscriptionId, subscriptionData);
                toast({
                    title: 'Success',
                    description: 'Subscription updated successfully.',
                });
            }
        } catch (error) {
            console.error('Error saving subscription:', error);
            toast({
                title: 'Error',
                description: 'Failed to save subscription. Please try again.',
                variant: 'destructive',
            });
            return;
        } finally {
            setLoading(false);
        }
        
        onSave();
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
                                    name="serviceName"
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
                                <FormField control={form.control} name="cancellationDate" render={({ field }) => (
                                    <FormItem className="">
                                        <FormLabel>Cancellation Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("h-10 w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField
                                control={form.control}
                                name="officialWebsite"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Official Website</FormLabel>
                                        <FormControl>
                                            <Input placeholder='e.g., https://www.google.com/workspace/' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="officialSupport"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Official Support Page</FormLabel>
                                        <FormControl>
                                            <Input placeholder='e.g., https://support.google.com/' {...field} />
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
                                            <Textarea placeholder='Any additional notes...' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <PricingTypeFields control={form.control} />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Submitting...' : mode === 'create' ? 'Create' : 'Update'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}