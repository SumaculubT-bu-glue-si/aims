
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Subscription, Employee } from "@/lib/types"

interface CostBreakdownChartProps {
    subscriptions: Subscription[];
    employees: Employee[];
}

const USD_JPY_RATE = 150;

function formatCurrency(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0
    }).format(value);
};

export default function CostBreakdownChart({ subscriptions, employees }: CostBreakdownChartProps) {
    const getDepartment = (employeeId: string) => {
        return employees.find(e => e.id === employeeId)?.department || 'Unassigned';
    }

    const data = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((acc, sub) => {
            let departmentCosts: { [key: string]: number } = {};

            if (sub.pricingType === 'per-license') {
                sub.accounts.forEach(account => {
                    if (!account.assignedUser || !account.billingCycle) return;

                    const department = getDepartment(account.assignedUser);
                    let monthlyCostInYen = 0;
                    const costInYen = account.currency === 'USD' ? account.amount * USD_JPY_RATE : account.amount;
                    const period = account.billingCycle.period || 1;
                    switch (account.billingCycle.unit) {
                        case 'day':
                            monthlyCostInYen = (costInYen / period) * 30;
                            break;
                        case 'week':
                            monthlyCostInYen = (costInYen / period) * 4;
                            break;
                        case 'month':
                            monthlyCostInYen = costInYen / period;
                            break;
                        case 'year':
                            monthlyCostInYen = costInYen / (period * 12);
                            break;
                    }
                    departmentCosts[department] = (departmentCosts[department] || 0) + monthlyCostInYen;
                });
            } else if (sub.pricingType === 'per-seat' && sub.perUserPricing) {
                const monthlyPrice = sub.perUserPricing.monthly || (sub.perUserPricing.yearly || 0) / 12;
                const priceInYen = sub.perUserPricing.currency === 'USD' ? monthlyPrice * USD_JPY_RATE : monthlyPrice;
                sub.assignedUsers?.forEach(user => {
                    const department = getDepartment(user.employeeId);
                    departmentCosts[department] = (departmentCosts[department] || 0) + priceInYen;
                });
            }

            for (const department in departmentCosts) {
                const existing = acc.find(item => item.department === department);
                if (existing) {
                    existing.cost += departmentCosts[department];
                } else {
                    acc.push({ department, cost: departmentCosts[department] });
                }
            }

            return acc;
        }, [] as { department: string; cost: number }[])
        .map(d => ({ ...d, cost: Math.round(d.cost) }))
        .sort((a, b) => b.cost - a.cost);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Cost by Department</CardTitle>
                <CardDescription>Total monthly subscription cost for each department.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="department" />
                            <YAxis tickFormatter={formatCurrency} width={80} />
                            <Tooltip
                                formatter={(value: number) => [formatCurrency(value), 'Monthly Cost']}
                                labelStyle={{ fontWeight: 'bold' }}
                                itemStyle={{ color: 'hsl(var(--primary))' }}
                                wrapperStyle={{
                                    border: '1px solid hsl(var(--border))',
                                    padding: '10px',
                                    backgroundColor: 'hsl(var(--background))',
                                    borderRadius: 'var(--radius)',
                                    color: 'hsl(var(--foreground))'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="cost" fill="hsl(var(--primary))" name='Monthly Cost (JPY)' radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
