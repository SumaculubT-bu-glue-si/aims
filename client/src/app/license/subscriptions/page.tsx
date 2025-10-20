"use client";

import SubscriptionForm from "@/components/subscription-form";
import SubscriptionList from "@/components/subscription-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Employee, Subscription } from "@/lib/types";
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from "@/hooks/use-toast";
import { getSubscriptions } from "@/lib/graphql-client";

export default function SubscriptionsPage() {
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const subs = await getSubscriptions();
            console.log('subs', subs);

            // transform server shape (snake_case) into client Subscription shape (camelCase)
            const filtered = (subs || []).filter((s: any) => s.license_type === 'subscription');
            const mapped = filtered.map((s: any) => ({
                id: s.id,
                name: s.service_name || '',
                vendor: s.vendor || '',
                licenseType: s.license_type || 'subscription',
                pricingType: s.pricing_type || 'per-license',
                status: s.status || 'active',
                category: s.category || '',
                paymentMethod: s.payment_method || '',
                cancellationDate: s.cancellation_date || undefined,
                officialWebsite: s.official_website || undefined,
                officialSupport: s.official_support || undefined,
                notes: s.notes || '',
                perSeatMonthlyPrice: s.per_seat_monthly_price ?? null,
                perSeatYearlyPrice: s.per_seat_yearly_price ?? null,
                perSeatCurrency: (s.per_seat_currency || 'jpy'),
                employees: s.employees || [],
                // map licenses -> accounts (client expects accounts array)
                accounts: (s.licenses || []).map((l: any) => ({
                    id: l.id,
                    accountId: l.account_id,
                    amount: l.unit_price,
                    currency: l.currency,
                    billingCycle: l.billing_cycle,
                    billingInterval: l.billing_interval,
                    startDate: l.start_date,
                    endDate: l.end_date,
                    renewalDate: l.renewal_date,
                    version: l.version,
                    licenseKey: l.license_key,
                    used: l.used,
                    assignedEmployee: l.assigned_employee,
                })),
                // assignedUsers: [],
            } as unknown as Subscription));

            setSubscriptions(mapped);
        } catch (error) {
            toast({
                title: "Error fetching subscriptions",
                description: "Could not fetch subscriptions from the database.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);


    const handleSave = () => {
        fetchSubscriptions();
        setIsSubscriptionModalOpen(false);
    };

    return (
        <>
            <div className="w-full my-4 flex justify-end">
                <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-48 float-right">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Subscription
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Subscription</DialogTitle>
                            <DialogDescription>
                                Fill in the details for the new subscription.
                            </DialogDescription>
                        </DialogHeader>
                        <SubscriptionForm
                            onSave={handleSave}
                            onCancel={() => setIsSubscriptionModalOpen(false)}
                            mode="create"
                            initialData={{ licenseType: 'subscription', status: 'active', pricingType: 'per-license' }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            ) : (
                <SubscriptionList subscriptions={subscriptions as any} />
            )}
        </>
    )
}