
'use client';

import type { Subscription, Employee, SubscriptionStatus, LicenseType } from '@/lib/types';
import { useRouter, usePathname } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

interface SubscriptionListProps {
    subscriptions: Subscription[];
    employees: Employee[];
}

const USD_JPY_RATE = 150;

function formatCurrency(amount: number, currency: 'JPY' | 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
};

export default function SubscriptionList({ subscriptions, employees }: SubscriptionListProps) {
    const router = useRouter();
    const pathname = usePathname();

    const statusMap: Record<SubscriptionStatus, { text: string; variant: 'secondary' | 'default' }> = {
        active: { text: 'Active', variant: 'default' },
        inactive: { text: 'Inactive', variant: 'secondary' },
    };

    const getSubscriptionCost = (sub: Subscription) => {
        if (sub.licenseType === 'perpetual') {
            return sub.accounts.reduce((total, acc) => {
                const costInYen = acc.currency === 'USD' ? acc.amount * USD_JPY_RATE : acc.amount;
                return total + costInYen;
            }, 0);
        }

        if (sub.pricingType === 'per-seat' && sub.perUserPricing) {
            const userCount = sub.assignedUsers?.length || 0;
            const price = sub.perUserPricing.monthly || (sub.perUserPricing.yearly || 0) / 12;
            const cost = userCount * price;
            return sub.perUserPricing.currency === 'USD' ? cost * USD_JPY_RATE : cost;
        }

        return Math.round(sub.accounts.reduce((total, acc) => {
            if (acc.billingCycle === undefined) return total;

            let monthlyCost = 0;
            const costInYen = acc.currency === 'USD' ? acc.amount * USD_JPY_RATE : acc.amount;
            const period = acc.billingCycle.period || 1;
            switch (acc.billingCycle.unit) {
                case 'day':
                    monthlyCost = (costInYen / period) * 30;
                    break;
                case 'week':
                    monthlyCost = (costInYen / period) * 4;
                    break;
                case 'month':
                    monthlyCost = costInYen / period;
                    break;
                case 'year':
                    monthlyCost = costInYen / (period * 12);
                    break;
            }
            return total + monthlyCost;
        }, 0));
    }

    const calculateUsageRate = (sub: Subscription) => {
        if (sub.pricingType === 'per-seat') {
            return sub.assignedUsers && sub.assignedUsers.length > 0 ? 100 : 0;
        }
        if (sub.accounts.length === 0) return 0;
        const usedCount = sub.accounts.filter(acc => acc.assignedUser || acc.assignedDevice).length;
        return Math.round((usedCount / sub.accounts.length) * 100);
    }

    const getLicenseCount = (sub: Subscription) => {
        if (sub.pricingType === 'per-seat') {
            const count = sub.assignedUsers?.length || 0;
            return `${count} / -`;
        }
        const usedCount = sub.accounts.filter(a => a.assignedUser || a.assignedDevice).length;
        return `${usedCount} / ${sub.accounts.length}`;
    }

    const handleRowClick = (subId: string) => {
        // If currently inside the license area, navigate to the license subscription detail route
        if (pathname && pathname.startsWith('/license')) {
            router.push(`/license/subscriptions/${subId}`);
            return;
        }
    }

    const licenseType: LicenseType | undefined = subscriptions[0]?.licenseType;

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>Service Name</TableHead>
                            {licenseType === 'subscription' && <TableHead>Cost/Price</TableHead>}
                            {licenseType === 'perpetual' && <TableHead>Price</TableHead>}
                            <TableHead>Licenses</TableHead>
                            <TableHead>Usage Rate</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subscriptions.map((sub) => {
                            const usageRate = calculateUsageRate(sub);
                            const cost = getSubscriptionCost(sub);

                            return (
                                <TableRow key={sub.id} onClick={() => handleRowClick(sub.id)} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        {sub.name}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(cost, 'JPY')}
                                        {sub.licenseType === 'subscription' && ` / month`}
                                    </TableCell>
                                    <TableCell>{getLicenseCount(sub)}</TableCell>
                                    <TableCell>
                                        {sub.licenseType === 'subscription' ? (
                                            <div className="flex items-center gap-2">
                                                <Progress value={usageRate} className="w-20" />
                                                <span>{usageRate}%</span>
                                            </div>
                                        ) : (
                                            'N/A'
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusMap[sub.status].variant}>
                                            {statusMap[sub.status].text}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
