
"use client"

import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"

import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { useTransitionContext } from "@/context/transition-context"
import { getPcs } from "../inventory/actions"
import { getLocations, type Location } from "../settings/locations/actions"
import { getEmployees } from "../settings/employees/actions"
import { type Employee } from "@/lib/schemas/settings"
import { createAuditPlan } from "@/lib/graphql-client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Loader, Calendar as CalendarIcon, PlusCircle, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { enUS, ja } from "date-fns/locale"

export type AuditAssignment = {
    location: string;
    user: string | null;
};

export type AuditItem = {
    assetId: string;
    isNew?: boolean;
    assetType: string;
    model: string;
    originalUser: string;
    originalLocation: string;
    user: string;
    location: string;
    status: 'Pending' | 'Found' | 'In Storage' | 'Broken' | 'Missing' | 'Scheduled for Disposal';
    notes?: string;
    auditedAt?: string;
    resolved?: boolean;
};


export type AuditPlan = {
  id: string;
  name: string;
  startDate: string;
  dueDate: string;
  status: 'Planning' | 'In Progress' | 'Completed' | 'Overdue';
  creationDate: string;
  progress: number;
  items: AuditItem[];
  assignments: AuditAssignment[];
  calendar_events?: string[];
};

function useAuditPlanSchema() {
    const { t } = useI18n();
    return z.object({
        name: z.string().min(1, t('validation.required', { field: t('pages.audits.dialog.form_label_name') })),
        startDate: z.date({ required_error: t('validation.required', { field: t('pages.audits.dialog.form_label_start_date') }) }),
        dueDate: z.date({ required_error: t('validation.required', { field: t('pages.audits.dialog.form_label_due_date') }) }),
        description: z.string().optional(),
        locations: z.array(z.string()).min(1, t('validation.required_selection', { field: t('pages.audits.preparation.locations_label') })),
        assignments: z.array(z.object({
            location: z.string(),
            user: z.string().nullable(),
        })).optional(),
    }).refine(data => data.dueDate >= data.startDate, {
        message: t('validation.date_after', {
            field1: t('pages.audits.dialog.form_label_due_date'),
            field2: t('pages.audits.dialog.form_label_start_date')
        }),
        path: ["dueDate"],
    });
}

type AuditPlanFormValues = z.infer<ReturnType<typeof useAuditPlanSchema>>;

export default function AuditPreparationPage() {
    const { t } = useI18n();
    const { toast } = useToast();
    const { navigate } = useTransitionContext();

    const [allLocations, setAllLocations] = useState<Location[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Call the hook at the top level
    const auditPlanSchema = useAuditPlanSchema();
    const form = useForm<AuditPlanFormValues>({
        resolver: zodResolver(auditPlanSchema),
        defaultValues: {
            name: "",
            description: "",
            locations: [],
            assignments: [],
        },
        mode: 'onSubmit', // Only validate on submit
        reValidateMode: 'onSubmit', // Re-validate only on submit
        criteriaMode: 'firstError', // Stop validation on first error
        delayError: 0, // No delay for errors
        shouldFocusError: false, // Don't auto-focus on errors
    });

    const { fields, replace } = useFieldArray({
        control: form.control,
        name: "assignments",
    });

    // Memoized auditor assignment component to prevent unnecessary re-renders
    const AuditorAssignment = useMemo(() => memo(({
        item,
        index,
        locationEmployees,
        getEmployeeCountText,
        onAuditorSelect
    }: {
        item: { location: string; user: string | null };
        index: number;
        locationEmployees: Employee[];
        getEmployeeCountText: (count: number) => string;
        onAuditorSelect: (index: number, value: string) => void;
    }) => {
        return (
            <FormField
                control={form.control}
                name={`assignments.${index}.user`}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium">
                            {item.location}
                            <span className="text-xs text-muted-foreground ml-2">
                                ({getEmployeeCountText(locationEmployees.length)})
                            </span>
                        </FormLabel>
                        <Select onValueChange={(value) => onAuditorSelect(index, value)} value={field.value || "none"}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('pages.audits.preparation.select_assignee_placeholder')} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {locationEmployees.length > 0 ? (
                                    locationEmployees.map(employee => (
                                        <SelectItem key={employee.id} value={employee.name}>
                                            {employee.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        {t('pages.audits.preparation.no_employees_at_location')}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />
        );
    }), [form.control, t]);

    AuditorAssignment.displayName = 'AuditorAssignment';

    // Remove expensive form.watch and use local state instead
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const locationUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingLocationUpdatesRef = useRef<Set<string>>(new Set());

    // Memoize employees by location to avoid repeated filtering
    const employeesByLocation = useMemo(() => {
        const grouped = new Map<string, Employee[]>();
        employees.forEach(employee => {
            if (employee.location) {
                if (!grouped.has(employee.location)) {
                    grouped.set(employee.location, []);
                }
                grouped.get(employee.location)!.push(employee);
            }
        });
        return grouped;
    }, [employees]);

    // Optimized location selection handlers with batching
    const handleSelectAllLocations = useCallback(() => {
        const locationsWithEmployees = allLocations
            .filter(location => employeesByLocation.has(location.name))
            .map(l => l.name);
        setSelectedLocations(locationsWithEmployees);
        form.setValue('locations', locationsWithEmployees, { shouldDirty: true, shouldValidate: false });
    }, [form, allLocations, employeesByLocation]);

    const handleDeselectAllLocations = useCallback(() => {
        setSelectedLocations([]);
        form.setValue('locations', [], { shouldDirty: true, shouldValidate: false });
    }, [form]);

    // Optimized single location toggle with batching
    const handleLocationToggle = useCallback((locationName: string, checked: boolean) => {
        // Add to pending updates
        if (checked) {
            pendingLocationUpdatesRef.current.add(locationName);
        } else {
            pendingLocationUpdatesRef.current.delete(locationName);
        }

        // Clear existing timeout
        if (locationUpdateTimeoutRef.current) {
            clearTimeout(locationUpdateTimeoutRef.current);
        }

        // Batch update after a short delay
        locationUpdateTimeoutRef.current = setTimeout(() => {
            const currentLocations = new Set(selectedLocations);

            // Apply all pending updates
            pendingLocationUpdatesRef.current.forEach(loc => {
                if (currentLocations.has(loc)) {
                    currentLocations.delete(loc);
                } else {
                    currentLocations.add(loc);
                }
            });

            const newLocations = Array.from(currentLocations);
            setSelectedLocations(newLocations);
            form.setValue('locations', newLocations, { shouldDirty: true, shouldValidate: false });

            // Clear pending updates
            pendingLocationUpdatesRef.current.clear();
        }, 50); // Very short delay for batching
    }, [selectedLocations, form]);

    // Optimized navigation handlers
    const handleNavigateToDashboard = useCallback(() => navigate('/audits/dashboard'), [navigate]);
    const handleNavigateToCorrectiveActions = useCallback(() => navigate('/audits/corrective-actions'), [navigate]);
    const handleNavigateToExecution = useCallback(() => navigate('/audits/execution'), [navigate]);
    const handleNavigateToImprovement = useCallback(() => navigate('/audits/improvement'), [navigate]);
    const handleNavigateToReporting = useCallback(() => navigate('/audits/reporting'), [navigate]);

    // Optimized date validation
    const isDateDisabled = useCallback((date: Date) => {
        const startDate = form.getValues("startDate");
        return startDate ? date < startDate : false;
    }, [form]);

    // Human-readable employee count display
    const getEmployeeCountText = useCallback((count: number) => {
        if (count === 0) {
            return t('pages.audits.preparation.no_employees_at_location');
        }
        if (count === 1) {
            return t('pages.audits.preparation.one_employee_available');
        }
        return t('pages.audits.preparation.multiple_employees_available', { count });
    }, [t]);

    // Simplified useEffect - only update assignments when locations change
    useEffect(() => {
        if (selectedLocations.length === 0) {
            replace([]);
            return;
        }

        // Create new assignments array efficiently
        const newAssignments = selectedLocations.map(loc => ({ location: loc, user: null }));

        // Only replace if assignments actually changed to prevent unnecessary re-renders
        const currentAssignments = form.getValues('assignments') || [];
        const hasChanges = JSON.stringify(newAssignments) !== JSON.stringify(currentAssignments);

        if (hasChanges) {
            replace(newAssignments);
        }
    }, [selectedLocations, replace, form]);

    // Sync local state with form on mount
    useEffect(() => {
        const formLocations = form.getValues('locations') || [];
        setSelectedLocations(formLocations);
    }, [form]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (locationUpdateTimeoutRef.current) {
                clearTimeout(locationUpdateTimeoutRef.current);
            }
            if (auditorSelectionTimeoutRef.current) {
                clearTimeout(auditorSelectionTimeoutRef.current);
            }
        };
    }, []);

    // Memoize the button text to prevent unnecessary re-renders
    const buttonText = useMemo(() => {
        if (selectedLocations.length > 0) {
            return t('pages.inventory.filter_location_selected', { count: selectedLocations.length });
        }
        return t('pages.audits.preparation.select_locations_placeholder');
    }, [selectedLocations.length, t]);

    // Debounced auditor selection handler to prevent rapid updates
    const auditorSelectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleAuditorSelection = useCallback((index: number, value: string) => {
        // Clear existing timeout
        if (auditorSelectionTimeoutRef.current) {
            clearTimeout(auditorSelectionTimeoutRef.current);
        }

        // Debounce the auditor selection update
        auditorSelectionTimeoutRef.current = setTimeout(() => {
            form.setValue(`assignments.${index}.user`, value, {
                shouldDirty: true,
                shouldValidate: false
            });
        }, 100); // 100ms debounce for auditor selection
    }, [form]);


    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const [locationsResult, employeesResult] = await Promise.all([
                getLocations(),
                getEmployees()
            ]);

            if (locationsResult.error) {
                toast({
                    title: t('actions.error'),
                    description: t('errors.database.location'),
                    variant: "destructive"
                });
            } else {
                const fetchedLocations = locationsResult.locations.filter(l => l.name !== 'All');
                setAllLocations(fetchedLocations);
            }

            if (employeesResult.error) {
                toast({
                    title: t('actions.error'),
                    description: t('errors.database.employee'),
                    variant: "destructive"
                });
            } else {
                setEmployees(employeesResult.employees);
            }

            setIsLoading(false);
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onSubmit(values: AuditPlanFormValues) {
        setIsSubmitting(true);

        try {
            
            // Manual validation using the schema
            const validationResult = auditPlanSchema.safeParse(values);
            if (!validationResult.success) {
                console.error('❌ Form validation failed:', validationResult.error.errors);
                const firstError = validationResult.error.errors[0];
                console.error('Error:', firstError);
                toast({
                    title: t('actions.error'),
                    description: t('errors.validation.failed'),
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }


            // Use local state for locations instead of form values
            const locationIds = selectedLocations.map(locName => {
                const location = allLocations.find(l => l.name === locName);
                return location?.id?.toString();
            }).filter(Boolean) as string[];


            // Get employee IDs from employee names using memoized data
            const employeeIds = values.assignments
                ?.map(assignment => {
                    if (!assignment.user) return null;
                    const locationEmployees = employeesByLocation.get(assignment.location) || [];
                    const employee = locationEmployees.find(emp => emp.name === assignment.user);
                    return employee?.id?.toString();
                })
                .filter(Boolean) as string[];


            if (locationIds.length === 0) {
                toast({
                    title: t('actions.error'),
                    description: t('errors.audit_prep.location'),
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            if (employeeIds.length === 0) {
                toast({
                    title: t('actions.error'),
                    description: t('errors.audit_prep.auditor'),
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            const auditPlanData = {
                name: values.name,
                startDate: format(values.startDate, 'yyyy-MM-dd'),
                dueDate: format(values.dueDate, 'yyyy-MM-dd'),
                description: values.description,
                locations: locationIds,
                auditors: employeeIds,
            };


            // Create audit plan using GraphQL API
            const result = await createAuditPlan(auditPlanData);


            if (!result.success) {
                toast({
                    title: t('actions.error'),
                    description: t('errors.audit_prep.create'),
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            toast({
                title: t('actions.success'),
                description: t('pages.audits.create_plan_success')
            });
            setIsSubmitting(false);
            navigate('/audits/execution');

        } catch (error) {
            console.error('Error creating audit plan:', error);
            toast({
                title: t('actions.error'),
                description: t('errors.audit_prep.create'),
                variant: "destructive"
            });
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('nav.audit_prep')}</CardTitle>
                        <CardDescription>{t('pages.audits.preparation.description')}</CardDescription>

                        {/* Audit Sub-folder Navigation */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <div className="text-sm text-muted-foreground mb-2 w-full">
                                {t('pages.audits.sections')}:
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigateToDashboard}
                                className="text-xs"
                            >
                                {t('nav.dashboard')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigateToCorrectiveActions}
                                className="text-xs"
                            >
                                {t('nav.corrective_actions')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigateToExecution}
                                className="text-xs"
                            >
                                {t('nav.execution')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigateToImprovement}
                                className="text-xs"
                            >
                                {t('nav.improvement')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigateToReporting}
                                className="text-xs"
                            >
                                {t('nav.reporting')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('pages.audits.dialog.form_label_name')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('pages.audits.dialog.form_placeholder_name')}
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('pages.audits.reporting.pdf.description')}</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder={t('pages.audits.dialog.placeholder')}
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="startDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('pages.audits.dialog.form_label_start_date')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="dueDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>{t('pages.audits.dialog.form_label_due_date')}</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja }) : <span>{t('actions.pick_date')}</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={isDateDisabled} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="locations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('pages.audits.preparation.locations_label')}</FormLabel>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <FormControl>
                                                        <Button variant="outline" className="w-full justify-between">
                                                            <span className="truncate">
                                                                {buttonText}
                                                            </span>
                                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                                    <DropdownMenuItem onSelect={handleSelectAllLocations} className="cursor-pointer">
                                                        {t('actions.select_all')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={handleDeselectAllLocations} className="cursor-pointer">
                                                        {t('actions.deselect_all')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {allLocations
                                                        .filter(location => employeesByLocation.has(location.name))
                                                        .map((location) => {
                                                            const isChecked = selectedLocations.includes(location.name);
                                                            return (
                                                                <DropdownMenuCheckboxItem
                                                                    key={location.id}
                                                                    checked={isChecked}
                                                                    onCheckedChange={(checked) => handleLocationToggle(location.name, checked)}
                                                                    onSelect={e => e.preventDefault()}
                                                                >
                                                                    {location.name}
                                                                </DropdownMenuCheckboxItem>
                                                            );
                                                    })}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {fields.length > 0 && (
                                    <div className="space-y-4">
                                        <FormLabel>{t('pages.audits.preparation.assignees_label')}</FormLabel>
                                        <Card className="max-h-60 overflow-y-auto">
                                            <CardContent className="p-4 space-y-4">
                                                {fields.map((item, index) => {
                                                    // Filter employees based on the selected location
                                                    const locationEmployees = employeesByLocation.get(item.location) || [];

                                                    return (
                                                        <AuditorAssignment
                                                            key={item.id}
                                                            item={item}
                                                            index={index}
                                                            locationEmployees={locationEmployees}
                                                            getEmployeeCountText={getEmployeeCountText}
                                                            onAuditorSelect={handleAuditorSelection}
                                                        />
                                                    );
                                                })}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                <PlusCircle className="mr-2 h-4 w-4" />
                                {t('pages.audits.create_plan')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}




