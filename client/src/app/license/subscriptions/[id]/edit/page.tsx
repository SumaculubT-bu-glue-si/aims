
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { subscriptions as initialSubscriptions } from '@/lib/mock-data';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Briefcase, Users, LayoutDashboard, Package, ShieldCheck } from 'lucide-react';
import SubscriptionForm from '@/components/subscription-form';
import type { Subscription } from '@/lib/types';
import { SystemSwitcher } from '@/components/system-switcher';
import { toast } from '@/hooks/use-toast';


export default function EditSubscriptionPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
    const [subscriptionToEdit, setSubscriptionToEdit] = useState<Subscription | undefined>(undefined);

    useEffect(() => {
        const storedSubscriptions = localStorage.getItem('subscriptions');
        const subs = storedSubscriptions ? JSON.parse(storedSubscriptions) : initialSubscriptions;
        setSubscriptions(subs);
        const sub = subs.find((s: Subscription) => s.id === id);
        setSubscriptionToEdit(sub);
    }, [id]);


    const handleSave = (data: Partial<Subscription>) => {
        const updatedSubscriptions = subscriptions.map(sub => (sub.id === id ? { ...sub, ...data } as Subscription : sub));
        localStorage.setItem('subscriptions', JSON.stringify(updatedSubscriptions));
        setSubscriptions(updatedSubscriptions);
        try {
            toast({ title: 'Updated', description: 'App information updated successfully' });
        } catch (e) {
            // ignore
        }
        router.push(`/subscriptions/${id}`);
    };

    if (!subscriptionToEdit) {
        return <div>App not found.</div>;
    }

    const isPerpetual = subscriptionToEdit.licenseType === 'perpetual';
    const breadcrumbListText = isPerpetual ? 'Perpetual' : 'Subscriptions';

    return (
        <div className="flex min-h-screen w-full bg-background">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Briefcase className="w-8 h-8" />
                    Edit {subscriptionToEdit.name}
                </h1>
            </div>

            <SubscriptionForm onSave={handleSave} onCancel={() => router.back()} initialData={subscriptionToEdit} />
        </div>
    );
}
