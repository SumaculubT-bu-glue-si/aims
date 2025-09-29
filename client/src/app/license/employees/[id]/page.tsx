
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { employees as initialEmployees, subscriptions as initialSubscriptions } from '@/lib/mock-data';
import type { Subscription, Employee } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Building, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import EmployeeForm from '@/components/employee-form';

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

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Load data from localStorage or use initial dummy data
        const storedSubscriptions = localStorage.getItem('subscriptions');
        const storedEmployees = localStorage.getItem('employees');
        setSubscriptions(storedSubscriptions ? JSON.parse(storedSubscriptions) : initialSubscriptions);
        setEmployees(storedEmployees ? JSON.parse(storedEmployees) : initialEmployees);

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

    const employee = employees.find(e => e.id === id);

    const getAssignedSubscriptions = (): (Subscription & { assignmentType: 'license' | 'seat', accountId?: string, endDate?: string })[] => {
        if (!employee) return [];

        const assigned: (Subscription & { assignmentType: 'license' | 'seat', accountId?: string, endDate?: string })[] = [];

        subscriptions.forEach(sub => {
            if (sub.pricingType === 'per-license') {
                sub.accounts.forEach(acc => {
                    if (acc.assignedUser === employee.id) {
                        assigned.push({ ...sub, assignmentType: 'license', accountId: acc.accountId, endDate: acc.endDate });
                    }
                });
            }
            else if (sub.pricingType === 'per-seat') {
                const assignedUser = sub.assignedUsers?.find(u => u.employeeId === employee.id);
                if (assignedUser) {
                    // per-seat subscriptions don't have a specific end date per user in this model
                    assigned.push({ ...sub, assignmentType: 'seat' });
                }
            }
        });

        return assigned;
    }

    const handleSave = (data: Partial<Employee>) => {
        const updatedEmployees = employees.map(emp => (emp.id === id ? { ...emp, ...data } : emp));
        localStorage.setItem('employees', JSON.stringify(updatedEmployees));
        setEmployees(updatedEmployees);
        setIsEditModalOpen(false);
        try {
            toast({ title: 'Updated', description: 'Employee information updated' });
        } catch (e) {
            // ignore if toast isn't available
        }
    };

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
                                <span>{employee.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{employee.email}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit {employee.name}</DialogTitle>
                            <DialogDescription>
                                Update the employee's information below.
                            </DialogDescription>
                        </DialogHeader>
                        <EmployeeForm onSave={handleSave} initialData={employee} />
                    </DialogContent>
                </Dialog>
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
                                <TableHead>End Date</TableHead>
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
                                            <Badge variant={sub.pricingType === 'per-seat' ? 'secondary' : 'outline'}>
                                                {sub.pricingType === 'per-seat' ? 'Per-Seat' : 'Per-License'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                                {sub.status === 'active' ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(sub.endDate)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={4} className="text-center">No assigned apps.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
