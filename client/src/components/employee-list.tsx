
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
import { Card, CardContent } from './ui/card';

interface EmployeeListProps {
    employees: Employee[];
}

export default function EmployeeList({ employees }: EmployeeListProps) {
    const router = useRouter();

    const handleRowClick = (employeeId: string) => {
        router.push(`/employees/${employeeId}`);
    };

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
