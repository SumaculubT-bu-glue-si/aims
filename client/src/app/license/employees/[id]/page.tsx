
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import type { Subscription, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { graphqlQuery, INVENTORY_QUERIES, getSubscriptions } from '@/lib/graphql-client';
import { Skeleton } from '@/components/ui/skeleton';

function formatDate(date?: string) {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-CA');
}

export default function EmployeeDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [employee, setEmployee] = useState<Employee | null>(null);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        // Check for flash message from other pages (e.g., after unassign)
        try {
            const msg = sessionStorage.getItem('flash_unassign_message');
            if (msg) {
                toast({ title: 'Success', description: msg });
                sessionStorage.removeItem('flash_unassign_message');
            }
        } catch (e) {
            // ignore if storage not available
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Fetch employees and find by employee_id param
                const resp = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES, { first: 1000, page: 1 });
                const list: Employee[] = (resp?.data?.employees?.data || []).map((emp: any) => ({
                    id: emp.id,
                    employee_id: emp.employee_id,
                    name: emp.name,
                    email: emp.email || '',
                    location: emp.location || '',
                    org_unit_path: emp.org_unit_path || '',
                    projects: Array.isArray(emp.projects) ? (emp.projects.join(', ')) : (emp.projects || ''),
                }));
                const found = list.find(e => e.employee_id === id) || null;
                setEmployee(found);

                // Fetch all subscriptions with assigned employees
                const subs = await getSubscriptions();
                setSubscriptions(subs || []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const getAssignedSubscriptions = (): Array<{ id: string; name: string; pricing_type: string; status: string; assignmentType: 'license' | 'seat'; accountId?: string; endDate?: string; assignedDate?: string; renewalDate?: string; }> => {
        if (!employee) return [];

        const empId = employee.employee_id;
        const assigned: Array<{ id: string; name: string; pricing_type: string; status: string; assignmentType: 'license' | 'seat'; accountId?: string; endDate?: string; assignedDate?: string; renewalDate?: string; }> = [];

        subscriptions.forEach((sub: any) => {
            // Per-seat: check if employee is in sub.employees
            const matchedSeat = Array.isArray(sub.employees) ? sub.employees.find((e: any) => e?.employee_id === empId) : null;
            if (matchedSeat) {
                assigned.push({ id: sub.id, name: sub.service_name, pricing_type: sub.pricing_type, status: sub.status, assignmentType: 'seat', assignedDate: matchedSeat.assigned_at || undefined });
            }

            // Per-license: scan licenses[].assigned_employee
            if (Array.isArray(sub.licenses)) {
                sub.licenses.forEach((lic: any) => {
                    const ae = lic?.assigned_employee;
                    if (ae && (ae.employee_id === empId)) {
                        assigned.push({ id: sub.id, name: sub.service_name, pricing_type: sub.pricing_type, status: sub.status, assignmentType: 'license', accountId: lic.account_id, endDate: lic.end_date, assignedDate: lic.start_date, renewalDate: lic.renewal_date });
                    }
                });
            }
        });

        return assigned;
    }

    // edit modal removed

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen w-full bg-background">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                    </div>
                    <Skeleton className="h-10 w-24" />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Assigned App List</CardTitle>
                        <CardDescription>List of apps assigned to this employee.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>App Name</TableHead>
                                    <TableHead>Pricing Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={`skeleton-row-${i}`} className="hover:bg-transparent">
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!employee) {
        return <div>Employee not found.</div>;
    }

    const assignedSubscriptions = getAssignedSubscriptions();
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('');
    }

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 border">
                        <AvatarFallback className="text-2xl">{getInitials(employee.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold">{employee.name}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                <span>{employee.location || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{employee.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* edit modal removed */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Assigned App List</CardTitle>
                    <CardDescription>List of apps assigned to this employee.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>App Name</TableHead>
                                <TableHead>Pricing Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Assigned Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead>Renewal Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {assignedSubscriptions.length > 0 ? (
                                assignedSubscriptions.map(sub => (
                                    <TableRow
                                        key={sub.id + (sub.accountId || '')}
                                        onClick={() => router.push(`/license/employees/${id}/subscriptions/${sub.id}/edit?accountId=${sub.accountId || ''}`)}
                                        className="cursor-pointer"
                                    >
                                        <TableCell
                                            className="font-medium hover:underline"
                                        >
                                            {sub.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={sub.pricing_type === 'per-seat' ? 'secondary' : 'outline'}>
                                                {sub.pricing_type === 'per-seat' ? 'Per-Seat' : 'Per-License'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                                {sub.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(sub.assignedDate)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(sub.endDate)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(sub.renewalDate)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="text-center">No assigned apps.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
