
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Employee, Subscription } from '@/lib/types';
import { JapaneseYen, Users, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import CostBreakdownChart from '@/components/cost-breakdown-chart';
import SubscriptionInsights from '@/components/subscription-insights';

const USD_JPY_RATE = 150;

function formatCurrency(amount: number, currency: 'JPY' | 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(amount);
};


export default function DashboardSummary() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
        try {
            const stored = localStorage.getItem('subscriptions');
            return stored ? JSON.parse(stored) : initialSubscriptions;
        } catch (e) {
            return initialSubscriptions;
        }
    });

    const [employees, setEmployees] = useState<Employee[]>(() => {
        try {
            const stored = localStorage.getItem('employees');
            return stored ? JSON.parse(stored) : initialEmployees;
        } catch (e) {
            return initialEmployees;
        }
    });

    // Keep localStorage in sync when subscriptions change
    useEffect(() => {
        try {
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        } catch (e) {
            // ignore storage errors
        }
    }, [subscriptions]);

    // Keep localStorage in sync when employees change
    useEffect(() => {
        try {
            localStorage.setItem('employees', JSON.stringify(employees));
        } catch (e) {
            // ignore storage errors
        }
    }, [employees]);

    useEffect(() => {
        const storedSubscriptions = localStorage.getItem('subscriptions');
        if (storedSubscriptions) {
            setSubscriptions(JSON.parse(storedSubscriptions));
        } else {
            setSubscriptions(initialSubscriptions);
            localStorage.setItem('subscriptions', JSON.stringify(initialSubscriptions));
        }

        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
        } else {
            setEmployees(initialEmployees);
            localStorage.setItem('employees', JSON.stringify(initialEmployees));
        }
    }, []);

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');

    const totalMonthlyCost = Math.round(activeSubscriptions.reduce((total, sub) => {
        let subCost = 0;
        if (sub.pricingType === 'per-license') {
            subCost = sub.accounts.reduce((subTotal, acc) => {
                if (!acc.billingCycle) return subTotal;

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
                return subTotal + monthlyCost;
            }, 0);
        } else if (sub.pricingType === 'per-seat' && sub.perUserPricing) {
            const userCount = sub.assignedUsers?.length || 0;
            const monthlyPrice = sub.perUserPricing.monthly || (sub.perUserPricing.yearly || 0) / 12;
            const priceInYen = sub.perUserPricing.currency === 'USD' ? monthlyPrice * USD_JPY_RATE : monthlyPrice;
            subCost = userCount * priceInYen;
        }
        return total + subCost;
    }, 0));

    const totalAccounts = subscriptions.reduce((total, sub) => total + sub.accounts.length, 0);

    const totalUsedAccounts = activeSubscriptions.reduce((sum, sub) => sum + sub.accounts.filter(a => a.assignedUser).length, 0);
    const totalAvailableAccounts = activeSubscriptions.reduce((sum, sub) => sum + sub.accounts.length, 0);

    const averageUsageRate = totalAvailableAccounts > 0 ? Math.round((totalUsedAccounts / totalAvailableAccounts) * 100) : 0;


    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Monthly Cost</CardTitle>
                        <JapaneseYen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalMonthlyCost, 'JPY')}</div>
                        <p className="text-xs text-muted-foreground">Annual equivalent: {formatCurrency(totalMonthlyCost * 12, 'JPY')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
                        <p className="text-xs text-muted-foreground">out of {subscriptions.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAccounts}</div>
                        <p className="text-xs text-muted-foreground">All services total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Usage Rate</CardTitle>
                        <div className="h-4 w-4 text-muted-foreground">%</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {averageUsageRate}%
                        </div>
                        <p className="text-xs text-muted-foreground">For active subscriptions</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-full lg:col-span-4">
                    <CostBreakdownChart subscriptions={subscriptions} employees={employees} />
                </div>
                <div className="col-span-full lg:col-span-3">
                    <SubscriptionInsights subscriptions={subscriptions} />
                </div>
            </div>
        </>
    );
}
