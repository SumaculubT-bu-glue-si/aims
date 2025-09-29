
'use client';

import type { GWS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Mail, Globe, Info } from 'lucide-react';

interface GwsCardProps {
    account: GWS;
}

export default function GwsCard({ account }: GwsCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-blue-600" />
                    <div>
                        <CardTitle>{account.domain}</CardTitle>
                        <CardDescription>{account.plan}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                    <Globe className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Domain</p>
                        <p className="text-muted-foreground">{account.domain}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                    <Mail className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Administrator</p>
                        <p className="text-muted-foreground">{account.adminEmail}</p>
                    </div>
                </div>
                {account.notes && (
                    <div className="flex items-start gap-3 text-sm">
                        <Info className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Notes</p>
                            <p className="text-muted-foreground">{account.notes}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
