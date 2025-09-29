
"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AppSidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { I18nProvider } from '@/context/i18n-context';
import { TransitionProvider } from '@/context/transition-context';
import { AuthProvider } from '@/context/auth-context';
import { LoadingOverlay } from '@/components/loading-overlay';
import { PageTransitionLoader } from '@/components/page-transition-loader';

function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';
    const isEmployeeAuditsPage = pathname.startsWith('/employee-audits');

    if (isLoginPage || isEmployeeAuditsPage) {
        return <>{children}</>;
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <div className="flex flex-1 flex-col min-w-0">
                    <AppHeader />
                    <main className="flex-1 flex flex-col p-4 md:px-6 md:pb-4 md:pt-0">
                        {children}
                    </main>
                </div>
            </div>
            <Toaster />
        </SidebarProvider>
    );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <I18nProvider>
            <TransitionProvider>
                <AuthProvider>
                    <MainLayout>{children}</MainLayout>
                    <LoadingOverlay />
                    <PageTransitionLoader />
                </AuthProvider>
            </TransitionProvider>
        </I18nProvider>
    );
}
