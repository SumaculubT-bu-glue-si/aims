
'use client';

import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
// import { AppLogo } from '@/components/app-logo';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const systems = [
    { value: 'license', label: 'License Management', status: 'purchased' },
    { value: 'compliance', label: 'Compliance Management', status: 'trial' },
    { value: 'server', label: 'Server Management', status: 'trial' },
    { value: 'pc', label: 'PC Management', status: 'purchased' },
    { value: 'router', label: 'Router Management', status: 'trial' },
    { value: 'smartphone', label: 'Smartphone Management', status: 'trial' },
] as const;

export function SystemSwitcher() {
    const [selectedSystem, setSelectedSystem] = useState<string>(systems[0].value);
    const selectedSystemLabel = systems.find(s => s.value === selectedSystem)?.label || '';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full h-auto justify-start px-2 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:h-auto"
                >
                    <div className="flex items-center gap-2">
                        {/* <AppLogo className="size-8 group-data-[collapsible=icon]:size-8" /> */}
                        <div className="group-data-[collapsible=icon]:hidden flex flex-col items-start">
                            <div className="flex items-center">
                                <span className="text-lg font-semibold">{selectedSystemLabel}</span>
                                <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />
                            </div>
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
                        onSelect={() => setSelectedSystem(system.value)}
                        className="justify-between"
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
                        {system.status === 'trial' && (
                            <Badge variant="outline">Trial</Badge>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
