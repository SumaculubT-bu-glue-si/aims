
'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SubscriptionForm from "@/components/subscription-form";
import SubscriptionList from "@/components/subscription-list";
import { PlusCircle } from "lucide-react";
import { Employee, Subscription } from "@/lib/types";
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import { toast } from "@/hooks/use-toast";

export default function perpetualPage() {
    const [isPerpetualModalOpen, setIsPerpetualModalOpen] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    const perpetualOnly = subscriptions.filter(s => s.licenseType === 'perpetual');

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

        setIsPerpetualModalOpen(false);
        try {
            toast({ title: 'Created', description: 'Perpetual ubscription created successfully' });
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
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
                <Dialog open={isPerpetualModalOpen} onOpenChange={setIsPerpetualModalOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Perpetual
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Perpetual License</DialogTitle>
                            <DialogDescription>
                                Fill in the details for the new perpetual license.
                            </DialogDescription>
                        </DialogHeader>
                        <SubscriptionForm
                            onSave={handleSave}
                            onCancel={() => setIsPerpetualModalOpen(false)}
                            initialData={{ licenseType: 'perpetual', status: 'active', pricingType: 'per-license' }}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            <SubscriptionList subscriptions={perpetualOnly} employees={employees} />
        </>
    )
}