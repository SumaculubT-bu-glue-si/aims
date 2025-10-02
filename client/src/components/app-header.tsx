
"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/context/auth-context";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "./ui/dropdown-menu";
import { User, Globe, LogOut } from "lucide-react";

const pathToTitleKey: { [key: string]: string | { key: string, isRegex: boolean } } = {
    '/': 'nav.dashboard',
    '/inventory': 'nav.inventory',
    '/user-assets': 'nav.user_assets',
    '/audits': 'nav.audits',
    '/audits/audit_prep': 'nav.audit_prep',
    '/audits/execution': 'nav.execution',
    '/audits/reporting': 'nav.reporting',
    '/audits/improvement': 'nav.improvement',
    '/audits/corrective_actions': 'nav.corrective_actions',
    //'/audits/[id]': { key: 'pages.audits.detail.title', isRegex: true },
    '/settings': 'nav.master_data',
    '/settings/locations': 'nav.manage_locations',
    '/settings/projects': 'nav.manage_projects',
    '/settings/employees': 'nav.manage_employees',
    '/settings/system-users': 'nav.manage_system_users',
    '/settings/asset-fields': 'nav.manage_asset_fields',
    '/settings/data-import': 'nav.data_import',
};

export function AppHeader() {
    const pathname = usePathname();
    const { t, setLanguage } = useI18n();
    const { user, signOut } = useAuth();

    const getTitle = (path: string) => {
        // Prioritize exact match
        if (pathToTitleKey[path]) {
            const routeInfo = pathToTitleKey[path];
            const key = typeof routeInfo === 'string' ? routeInfo : routeInfo.key;
            const translated = t(key);
            // If translation returns the key, it means it's not found, so use the key itself.
            // This is useful for hardcoded titles like '棚卸し準備'.
            return translated === key ? key : translated;
        }

        // Then check regex for dynamic routes
        const dynamicMatch = Object.entries(pathToTitleKey).find(([route]) => {
            const routeInfo = pathToTitleKey[route];
            if (typeof routeInfo === 'object' && routeInfo.isRegex) {
                const regex = new RegExp(`^${route.replace(/\[.*?\]/g, '[^/]+')}$`);
                return regex.test(path);
            }
            return false;
        });

        if (dynamicMatch) {
            const routeInfo = dynamicMatch[1];
            const key = typeof routeInfo === 'string' ? routeInfo : routeInfo.key;
            return t(key);
        }

        // Fallback for settings subpages that might not have a dedicated title
        if (path.startsWith('/settings/')) return t('nav.master_data');

        return t('nav.dashboard');
    }

    const title = getTitle(pathname);

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:relative md:h-auto md:border-0 md:bg-transparent md:px-6 md:py-2">
            <SidebarTrigger className="md:hidden" />

            <div className="flex w-full items-center gap-4">
                <h1 className="text-xl font-semibold md:text-2xl whitespace-nowrap flex-1">{title}</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="size-8">
                                <AvatarImage src={user?.photoURL ?? undefined} alt={user?.displayName ?? "User"} />
                                <AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.displayName ?? "User"}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email ?? ""}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>{t('header.profile')}</span>
                        </DropdownMenuItem>

                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Globe className="mr-2 h-4 w-4" />
                                <span>{t('header.change_language')}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setLanguage('en')}>
                                        {t('language.english')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setLanguage('ja')}>
                                        {t('language.japanese')}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>{t('header.log_out')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
