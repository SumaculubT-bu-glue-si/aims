
'use client';

import type { Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { employees as initialEmployees } from '@/lib/mock-data';

export default function EmployeeList() {
    const router = useRouter();

    const [employees, setEmployees] = useState<Employee[]>([]);

    const handleRowClick = (employeeId: string) => {
        router.push(`/license/employees/${employeeId}`);
    };

    useEffect(() => {
        const storedEmployees = localStorage.getItem('employees');
        if (storedEmployees) {
            setEmployees(JSON.parse(storedEmployees));
        } else {
            setEmployees(initialEmployees);
            localStorage.setItem('employees', JSON.stringify(initialEmployees));
        }
    }, []);

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employees.map((employee) => (
                            <TableRow key={employee.id} onClick={() => handleRowClick(employee.id)} className="cursor-pointer">
                                <TableCell className="font-medium">{employee.name}</TableCell>
                                <TableCell>{employee.email}</TableCell>
                                <TableCell>{employee.department}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
