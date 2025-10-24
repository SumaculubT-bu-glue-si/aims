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
import { useI18n } from '@/hooks/use-i18n';
import { Progress } from './ui/progress';

// Temporary UI type until unified type is wired here
type UISubscription = any;

interface SubscriptionListProps {
    subscriptions: UISubscription[];
}

const USD_JPY_RATE = 150;

function formatCurrency(amount: number, currency: 'jpy' | 'usd') {
    const displayCurrency = currency.toUpperCase();
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        maximumFractionDigits: displayCurrency === 'JPY' ? 0 : 2,
    }).format(amount);
};

export default function SubscriptionList({ subscriptions }: SubscriptionListProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { t } = useI18n();

    const statusMap: Record<SubscriptionStatus, { text: string; variant: 'secondary' | 'default' }> = {
        active: { text: t('labels.status_values.active'), variant: 'default' },
        inactive: { text: t('labels.status_values.inactive'), variant: 'secondary' },
    };

    const getSubscriptionCost = (sub: UISubscription) => {
        // Per-seat subscriptions: compute from per-seat price * number of employees
        if (sub.pricingType === 'per-seat') {
            const userCount = sub.employees?.length || 0;
            const monthly = (sub.perSeatMonthlyPrice ?? undefined);
            const yearly = (sub.perSeatYearlyPrice ?? undefined);
            const base = monthly ?? (yearly ? yearly / 12 : 0);
            const currency = (sub.perSeatCurrency || 'jpy').toString().toLowerCase() as 'jpy' | 'usd';
            const costInYen = currency === 'usd' ? base * USD_JPY_RATE : base;
            return Math.round(userCount * costInYen);
        }
        if (sub.licenseType === 'perpetual') {
            return sub.accounts.reduce((total: number, acc: any) => {
                const costInYen = acc.currency === 'USD' ? acc.amount * USD_JPY_RATE : acc.amount;
                return total + costInYen;
            }, 0);
        }

        return Math.round(sub.accounts.reduce((total: number, acc: any) => {
            const hasCycle = acc.billingCycle !== undefined && acc.billingCycle !== null;
            const hasInterval = (acc as any).billingInterval !== undefined && (acc as any).billingInterval !== null;
            if (!hasCycle && !hasInterval) return total;

            const currencyUpper = (acc.currency || 'JPY').toString().toUpperCase();
            const costInYen = currencyUpper === 'USD' ? acc.amount * USD_JPY_RATE : acc.amount;
            const period = typeof acc.billingCycle === 'object' && acc.billingCycle !== null
                ? (acc.billingCycle as any).period || 1
                : (acc.billingCycle as any) || 1;
            const unit = typeof acc.billingCycle === 'object' && acc.billingCycle !== null
                ? (acc.billingCycle as any).unit
                : (acc as any).billingInterval;

            let monthlyCost = 0;
            switch (unit) {
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
                default:
                    monthlyCost = costInYen; // fallback if unit missing
            }
            return total + monthlyCost;
        }, 0));
    }

    const calculateUsageRate = (sub: UISubscription) => {
        if (sub.pricingType === 'per-seat') {
            const total = sub.employees?.length || 0;
            return total > 0 ? 100 : 0;
        }
        if (sub.accounts.length === 0) return 0;
        const usedCount = sub.accounts.filter((acc: any) => {
            const assigned = !!(acc.assignedEmployee && (acc.assignedEmployee.employee_id || acc.assignedEmployee.employeeId));
            return acc.used === true || assigned;
        }).length;
        return Math.round((usedCount / sub.accounts.length) * 100);
    }

    const getLicenseCount = (sub: UISubscription) => {
        if (sub.pricingType === 'per-seat') {
            const total = sub.employees?.length || 0;
            return `${total}`;
        }
        const usedCount = sub.accounts.filter((acc: any) => {
            const assigned = !!(acc.assignedEmployee && (acc.assignedEmployee.employee_id || acc.assignedEmployee.employeeId));
            return acc.used === true || assigned;
        }).length;
        return `${usedCount} / ${sub.accounts.length}`;
    }

    const handleRowClick = (subId: string) => {
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
                            <TableHead>{t('pages.subscriptions.table.service_name')}</TableHead>
                            {licenseType === 'subscription' && <TableHead>{t('pages.subscriptions.table.cost_price')}</TableHead>}
                            {licenseType === 'perpetual' && <TableHead>{t('pages.subscriptions.table.price')}</TableHead>}
                            <TableHead>{t('pages.subscriptions.table.licenses')}</TableHead>
                            <TableHead>{t('pages.subscriptions.table.usage_rate')}</TableHead>
                            <TableHead>{t('pages.subscriptions.table.status')}</TableHead>
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
                                        {formatCurrency(cost, 'jpy')}
                                        {sub.licenseType === 'subscription' && ` ${t('common.per_month')}`}
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
                                        {(() => {
                                            const statusKey = (sub.status as SubscriptionStatus);
                                            const s = statusMap[statusKey];
                                            return (
                                                <Badge variant={s.variant}>
                                                    {s.text}
                                                </Badge>
                                            );
                                        })()}
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