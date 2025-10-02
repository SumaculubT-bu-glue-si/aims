
'use client';

import {
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { ShieldCheck } from 'lucide-react';
import { gwsAccounts } from '@/lib/mock-data';
import GwsCard from '@/components/gws-card';

export default function GWSPage() {
    return (
        <div className="flex min-h-screen w-full bg-background">
            <SidebarInset className="container mx-auto p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <ShieldCheck className="w-8 h-8" />
                            Google Workspace Accounts
                        </h1>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gwsAccounts.map((account) => (
                        <GwsCard key={account.id} account={account} />
                    ))}
                </div>

            </SidebarInset>
        </div>
    );
}
