
"use client";

import { usePathname } from "next/navigation";
import { useTransitionContext } from '@/context/transition-context';
import { useState, useEffect, useRef } from "react";
import {
    Boxes,
    GanttChartSquare,
    LayoutDashboard,
    Lightbulb,
    Database,
    Shield,
    CalendarClock,
    FileText,
    CreditCard,
    Users,
    ClipboardCheck,
    ArrowRightLeft,
    ChevronDown,
    Upload,
    Scale,
    Check,
    ChevronsUpDown,
    ShieldCheck,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarTrigger,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from "./ui/button";
import { useI18n } from "@/hooks/use-i18n";
import { TransitionLink } from "./transition-link";
import { useSidebar } from "./ui/sidebar";
import { cn } from "@/lib/utils";

export function AppSidebar() {
    const pathname = usePathname();
    const { navigate } = useTransitionContext();
    const { t } = useI18n();
    const { state } = useSidebar();
    const isExpanded = state === 'expanded';

    const [isSettingsOpen, setIsSettingsOpen] = useState(true);
    const [isAuditsOpen, setIsAuditsOpen] = useState(true);

    const prevPathnameRef = useRef(pathname);

    const systems = [
        { href: '/license', label: 'License Management', value: 'license', available: true },
        { href: '/compliance', label: 'Compliance Management', value: 'compliance', available: false },
        { href: '/server', label: 'Server Management', value: 'server', available: false },
        { href: '/', label: 'PC Management', value: 'pc', available: true },
        { href: '/router', label: 'Router Management', value: 'router', available: false },
        { href: '/smartphone', label: 'Smartphone Management', value: 'smartphone', available: false },
    ];

    // Set selected system based on URL
    const getSystemFromPath = (pathname: string) => {
        for (const system of systems) {
            if (system.value === 'pc' && pathname === '/') return 'pc';
            if (system.value !== 'pc' && pathname.includes(system.value)) return system.value;
        }
        return 'pc';
    };

    const [selectedSystem, setSelectedSystem] = useState<string>(getSystemFromPath(pathname));
    const selectedSystemLabel = systems.find(s => s.value === selectedSystem)?.label || '';

    useEffect(() => {
        setSelectedSystem(getSystemFromPath(pathname));
    }, [pathname]);

    useEffect(() => {
        const prevPathname = prevPathnameRef.current;

        const wasInSettings = prevPathname.startsWith('/settings');
        const nowInSettings = pathname.startsWith('/settings');

        const wasInAudits = prevPathname.startsWith('/audits');
        const nowInAudits = pathname.startsWith('/audits');

        if (nowInSettings && !wasInSettings) {
            setIsSettingsOpen(true);
        }

        if (nowInAudits && !wasInAudits) {
            setIsAuditsOpen(true);
        }

        prevPathnameRef.current = pathname;
    }, [pathname]);

    // When user switches systems, expand or collapse dropdowns.
    // If switching to PC management, automatically expand audits and master data.
    // If switching away, collapse them so they don't remain visible on other systems.
    useEffect(() => {
        if (selectedSystem === 'pc') {
            setIsAuditsOpen(true);
            setIsSettingsOpen(true);
        } else {
            setIsAuditsOpen(false);
            setIsSettingsOpen(false);
        }
    }, [selectedSystem]);

    const pcNavItems = [
        { href: "/", label: t("nav.dashboard"), icon: LayoutDashboard, exact: true },
        { href: "/inventory", label: t("nav.inventory"), icon: Boxes },
        { href: "/user-assets", label: t("nav.user_assets"), icon: Users },
        { href: "/optimize", label: t("nav.optimize_ai"), icon: Lightbulb },
        { href: "/compliance", label: t("nav.compliance"), icon: Scale },
    ];

    const licenseNavItems = [
        { href: "/license", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/license/subscriptions", label: "Subscriptions", icon: CreditCard },
        { href: "/license/perpetual", label: "Perpetual", icon: FileText },
        { href: "/license/employees", label: "Employees", icon: Users },
        { href: "/license/gws", label: "Google Workspace", icon: ShieldCheck },
    ];

    const navItems = selectedSystem === "license" ? licenseNavItems : pcNavItems;

    const auditsNavItems = [
        { href: "/audits/dashboard", label: t("nav.dashboard") },
        { href: "/audits", label: t("nav.audit_prep") },
        { href: "/audits/execution", label: t("nav.execution") },
        { href: "/audits/reporting", label: t("nav.reporting") },
        { href: "/audits/improvement", label: t("nav.improvement") },
        { href: "/audits/corrective-actions", label: t("nav.corrective_actions") },
    ];

    const settingsNavItems = [
        { href: "/settings/locations", label: t("nav.manage_locations") },
        { href: "/settings/projects", label: t("nav.manage_projects") },
        { href: "/settings/employees", label: t("nav.manage_employees") },
        { href: "/settings/system-users", label: t("nav.manage_system_users") },
        { href: "/settings/asset-fields", label: t("nav.manage_asset_fields") },
        { href: "/settings/data-import", label: t("nav.data_import") },
    ];

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex items-center group-data-[state=expanded]:flex-row group-data-[state=expanded]:justify-between group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:gap-y-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-[90%] h-auto flex justify-between px-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            <div className="w-full flex items-center gap-2">
                                {/* <AppLogo className="size-8 group-data-[collapsible=icon]:size-8" /> */}
                                <div className="w-full flex flex-row space-between items-center group-data-[collapsible=icon]:hidden">
                                    <div className="w-[90%] flex items-center text-wrap">
                                        <span className="text-lg font-semibold">{selectedSystemLabel}</span>
                                    </div>
                                    <ChevronsUpDown className="w-[10%] ml-1 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="start">
                        <DropdownMenuLabel>Switch System</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {systems.map((system) => (
                            <DropdownMenuItem
                                key={system.value}
                                onSelect={system.available ? () => {
                                    // update selected system immediately so sidebar updates without waiting for navigation
                                    setSelectedSystem(system.value);
                                    // perform a client-side transition via TransitionProvider (keeps layout visible)
                                    navigate(system.href);
                                } : undefined}
                                disabled={!system.available}
                                className={cn(
                                    "justify-between",
                                    system.available
                                        ? "hover:cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        : "opacity-50 cursor-not-allowed bg-transparent text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center">
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selectedSystem === system.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {system.label}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <SidebarTrigger className="hidden md:flex" />
            </SidebarHeader>

            <SidebarContent className="p-2">
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={
                                    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/')
                                }
                                tooltip={{ children: item.label, side: "right", align: "center" }}
                            >
                                <TransitionLink href={item.href}>
                                    <item.icon className="size-4" />
                                    <span className="group-data-[state=collapsed]:hidden">{item.label}</span>
                                </TransitionLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}

                    {selectedSystem === 'pc' && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => { if (isExpanded) setIsAuditsOpen(!isAuditsOpen) }}
                                isActive={pathname.startsWith('/audits')}
                                className="w-full justify-between"
                                tooltip={{ children: t("nav.audits"), side: "right", align: "center" }}
                                asChild={!isExpanded}
                            >
                                {isExpanded ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <ClipboardCheck className="size-4" />
                                            <span>{t("nav.audits")}</span>
                                        </div>
                                        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isAuditsOpen && "rotate-180")} />
                                    </>
                                ) : (
                                    <TransitionLink href="/audits/dashboard">
                                        <ClipboardCheck className="size-4" />
                                        <span className="sr-only">{t("nav.audits")}</span>
                                    </TransitionLink>
                                )}
                            </SidebarMenuButton>
                            {isExpanded && isAuditsOpen && (
                                <SidebarMenuSub>
                                    {auditsNavItems.map(item => (
                                        <SidebarMenuSubItem key={item.href}>
                                            <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                                <TransitionLink href={item.href}>{item.label}</TransitionLink>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                    )}

                    {selectedSystem === 'pc' && (
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => { if (isExpanded) setIsSettingsOpen(!isSettingsOpen) }}
                                isActive={pathname.startsWith('/settings')}
                                className="w-full justify-between"
                                tooltip={{ children: t("nav.master_data"), side: "right", align: "center" }}
                                asChild={!isExpanded}
                            >
                                {isExpanded ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <Database className="size-4" />
                                            <span>{t("nav.master_data")}</span>
                                        </div>
                                        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isSettingsOpen && "rotate-180")} />
                                    </>
                                ) : (
                                    <TransitionLink href="/settings/locations">
                                        <Database className="size-4" />
                                        <span className="sr-only">{t("nav.master_data")}</span>
                                    </TransitionLink>
                                )}
                            </SidebarMenuButton>
                            {isExpanded && isSettingsOpen && (
                                <SidebarMenuSub>
                                    {settingsNavItems.map(item => (
                                        <SidebarMenuSubItem key={item.href}>
                                            <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                                                <TransitionLink href={item.href}>{item.label}</TransitionLink>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>
                    )}

                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="p-2">
                {/* Footer is now empty, user menu moved to header */}
            </SidebarFooter>
        </Sidebar>
    );
}
