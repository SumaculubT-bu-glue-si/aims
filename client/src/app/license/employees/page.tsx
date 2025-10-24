
'use client';

import type { Employee } from '@/lib/types/index';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { graphqlQuery, INVENTORY_QUERIES } from '@/lib/graphql-client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/hooks/use-i18n';

export default function EmployeeList() {
    const router = useRouter();
    const { t } = useI18n();

    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [locationFilter, setLocationFilter] = useState<string>('');
    const [nameFilter, setNameFilter] = useState<string>('');
    const [nameSortAsc, setNameSortAsc] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const itemsPerPage = 10;

    const uniqueLocations = useMemo(() => {
        const set = new Set<string>();
        for (const e of allEmployees) {
            const loc = (e.location || '').trim();
            if (loc) set.add(loc);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [allEmployees]);

    const selectLocationValue = useMemo(() => {
        if (locationFilter === '') return '__ALL__';
        return locationFilter;
    }, [locationFilter]);

    const handleRowClick = (employeeId: string) => {
        router.push(`/license/employees/${employeeId}`);
    };

    const fetchAllEmployees = async () => {
        setLoading(true);
        try {
            const response = await graphqlQuery(INVENTORY_QUERIES.GET_EMPLOYEES, {
                first: 1000,
                page: 1,
            });

            if (response?.data?.employees) {
                const list = (response.data.employees.data || []).map((emp: any): Employee => ({
                    id: emp.id,
                    createdAt: emp.created_at || '',
                    updatedAt: emp.updated_at || '',
                    employee_id: emp.employee_id,
                    name: emp.name,
                    email: emp.email || '',
                    location: emp.location || '',
                    org_unit_path: emp.org_unit_path || '',
                    projects: Array.isArray(emp.projects) ? (emp.projects.join(', ')) : (emp.projects || ''),
                }));
                setAllEmployees(list);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllEmployees();
    }, []);

    useEffect(() => {
        // Apply filters
        let filtered = allEmployees;
        if (nameFilter.trim()) {
            const nf = nameFilter.trim().toLowerCase();
            filtered = filtered.filter(e => (e.name || '').toLowerCase().includes(nf));
        }
        if (locationFilter === '__NA__') {
            filtered = filtered.filter(e => !(e.location && e.location.trim()));
        } else if (locationFilter !== '') {
            const lf = locationFilter.trim().toLowerCase();
            filtered = filtered.filter(e => (e.location || '').trim().toLowerCase() === lf);
        }

        // Apply name sort
        const sorted = [...filtered].sort((a, b) => {
            const aName = a.name || '';
            const bName = b.name || '';
            return nameSortAsc ? aName.localeCompare(bName) : bName.localeCompare(aName);
        });

        // Update total and current page if needed
        const newTotal = sorted.length;
        setTotalCount(newTotal);
        const maxPage = Math.max(1, Math.ceil(newTotal / itemsPerPage));
        const safePage = Math.min(currentPage, maxPage);
        if (safePage !== currentPage) {
            setCurrentPage(safePage);
        }

        // Slice for current page
        const start = (safePage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        setEmployees(sorted.slice(start, end));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allEmployees, nameFilter, locationFilter, nameSortAsc, currentPage]);

    const toggleNameSort = () => {
        setNameSortAsc(prev => !prev);
        setCurrentPage(1);
    };

    return (
        <Card>
            <CardContent className="p-0">
                <div className="p-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder={t('pages.license_employees.filter_name')}
                            value={nameFilter}
                            onChange={(e) => {
                                setNameFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                        <Select
                            value={selectLocationValue}
                            onValueChange={(value) => {
                                if (value === '__ALL__') {
                                    setLocationFilter('');
                                } else {
                                    setLocationFilter(value);
                                }
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder={t('pages.license_employees.all_locations')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__ALL__">{t('pages.license_employees.all_locations')}</SelectItem>
                                <SelectItem value="__NA__">{t('common.not_applicable')}</SelectItem>
                                {uniqueLocations.map((loc) => (
                                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead onClick={toggleNameSort} className="cursor-pointer select-none">
                                {t('pages.license_employees.table.name')} {nameSortAsc ? '▲' : '▼'}
                            </TableHead>
                            <TableHead>{t('pages.license_employees.table.email')}</TableHead>
                            <TableHead>{t('pages.license_employees.table.location')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading
                            ? Array.from({ length: itemsPerPage }).map((_, idx) => (
                                <TableRow key={`skeleton-${idx}`}>
                                    <TableCell className="font-medium"><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                </TableRow>
                            ))
                            : employees.map((employee) => (
                                <TableRow key={employee.id} onClick={() => handleRowClick(employee.employee_id)} className="cursor-pointer">
                                    <TableCell className="font-medium">{employee.name}</TableCell>
                                    <TableCell>{employee.email}</TableCell>
                                    <TableCell>{employee.location && employee.location.trim() ? employee.location : t('common.not_applicable')}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
                <Pagination
                    currentPage={currentPage}
                    totalCount={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    className="px-4 py-2"
                />
            </CardContent>
        </Card>
    );
}
