
"use client";

import SubscriptionForm from "@/components/subscription-form";
import SubscriptionList from "@/components/subscription-list";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Employee, Subscription } from "@/lib/types";
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function SubscriptionsPage() {
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const subscriptionsOnly = subscriptions.filter(s => s.licenseType === 'subscription');

    const handleSave = (data: Partial<Subscription>) => {
        const newSubscription = {
            ...data,
            id: `sub-${new Date().getTime()}`,
            assignedUsers: data.assignedUsers || [],
            accounts: data.accounts || [],
        } as Subscription;

        const newSubscriptions = [...subscriptions, newSubscription];
        setSubscriptions(newSubscriptions);
        localStorage.setItem('subscriptions', JSON.stringify(newSubscriptions));

        setIsSubscriptionModalOpen(false);
        try {
            toast({ title: 'Created', description: 'Subscription created successfully' });
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        const storedSubscriptions = localStorage.getItem('subscriptions');
        if (storedSubscriptions) {
            setSubscriptions(JSON.parse(storedSubscriptions));
        } else {
            setSubscriptions(initialSubscriptions);
            localStorage.setItem('subscriptions', JSON.stringify(initialSubscriptions));
        }

        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
        } else {
            setEmployees(initialEmployees);
            localStorage.setItem('employees', JSON.stringify(initialEmployees));
        }
    }, []);

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
                            initialData={{ licenseType: 'subscription', status: 'active', pricingType: 'per-license' }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <SubscriptionList subscriptions={subscriptionsOnly} employees={employees} />
        </>
    )
}