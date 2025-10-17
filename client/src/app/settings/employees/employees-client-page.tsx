
"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlusCircle, Upload, Loader, AlertTriangle, Trash2, ChevronDown } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import { getEmployeesFromGraphQL, getLocationsFromGraphQL, getProjectsFromGraphQL, saveEmployeeClient, deleteEmployeeClient } from "../../inventory/graphql-actions"
import type { Employee, EmployeeFormValues } from "@/lib/schemas/settings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { employeeSchema as getEmployeeSchema } from "@/lib/schemas/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

type EmployeesClientPageProps = {
  initialEmployees?: Employee[];
  initialLocations?: string[];
  initialProjects?: string[];
  initialError?: string | null;
}

export default function EmployeesClientPage({ initialEmployees, initialLocations, initialProjects, initialError }: EmployeesClientPageProps = {}) {
  const { user, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees || []);
  const [locations, setLocations] = useState<string[]>(initialLocations || []);
  const [projects, setProjects] = useState<string[]>(initialProjects || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(!initialEmployees);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDuplicateEmailDialogOpen, setIsDuplicateEmailDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { t } = useI18n()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const employeeSchema = getEmployeeSchema(t);

  useEffect(() => {
    setEmployees(initialEmployees || []);
    setLocations(initialLocations || []);
    setProjects(initialProjects || []);
  }, [!!initialEmployees, !!initialLocations, !!initialProjects]);

  useEffect(() => {
    setError(initialError || null);
  }, [!!initialError]);

  // Fetch data when authenticated (only if not provided as props)
  useEffect(() => {
    async function fetchData() {
      if (!authLoading && user && !initialEmployees) {
        setIsLoading(true);
        try {
          const [employeesResult, locationsResult, projectsResult] = await Promise.all([
            getEmployeesFromGraphQL(),
            getLocationsFromGraphQL(),
            getProjectsFromGraphQL()
          ]);

          if (employeesResult.error) {
            setError('Failed to fetch employees');
          } else {
            setEmployees(employeesResult.employees as Employee[]);
          }

          if (locationsResult.error) {
            setError('Failed to fetch locations');
          } else {
            setLocations(locationsResult.locations.map(l => l.name));
          }

          if (projectsResult.error) {
            setError('Failed to fetch projects');
          } else {
            setProjects(projectsResult.projects.map(p => p.name));
          }
        } catch (error) {
          setError('Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      }
    }
    fetchData();
  }, [authLoading, user, !!initialEmployees]);

  // Show loading state while authentication is in progress
  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_id: "",
      name: "",
      email: "",
      location: "",
      projects: [],
    },
  })

  const handleAddNew = () => {
    setEditingEmployee(null)
    form.reset({ employee_id: "", name: "", email: "", location: "", projects: [] })
    setIsFormDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    form.reset({
      employee_id: employee.employee_id,
      name: employee.name,
      email: employee.email || "",
      location: employee.location || "",
      projects: employee.projects || [],
    })
    setIsFormDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!editingEmployee) return;

    startTransition(async () => {
      const result = await deleteEmployeeClient(editingEmployee.id)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        
        // Refresh the employees data from GraphQL
        try {
          const employeesResult = await getEmployeesFromGraphQL();
          if (employeesResult.error) {
            toast({
              title: t('actions.error'),
              description: 'Failed to refresh employee data',
              variant: "destructive"
            });
          } else {
            setEmployees(employeesResult.employees as Employee[]);
          }
        } catch (error) {
          console.error('Error refreshing employees:', error);
          toast({
            title: t('actions.error'),
            description: 'Failed to refresh employee data',
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
      setIsDeleteDialogOpen(false);
      setIsFormDialogOpen(false);
      setEditingEmployee(null);
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This functionality might need revision based on new fields
  };

  function onSubmit(values: EmployeeFormValues) {
    startTransition(async () => {
      // Map EmployeeFormValues to the expected format
      const mappedValues = {
        employeeId: values.employee_id,
        name: values.name,
        email: values.email,
        department: values.department,
        location: values.location,
        projects: values.projects
      };
      const result = await saveEmployeeClient(editingEmployee ? editingEmployee.id : null, mappedValues)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        setIsFormDialogOpen(false)
        setEditingEmployee(null)
        
        // Refresh the employees data from GraphQL
        try {
          const employeesResult = await getEmployeesFromGraphQL();
          if (employeesResult.error) {
            toast({
              title: t('actions.error'),
              description: 'Failed to refresh employee data',
              variant: "destructive"
            });
          } else {
            setEmployees(employeesResult.employees as Employee[]);
          }
        } catch (error) {
          console.error('Error refreshing employees:', error);
          toast({
            title: t('actions.error'),
            description: 'Failed to refresh employee data',
            variant: "destructive"
          });
        }
      } else {
        // Handle duplicate email error specifically
        if (result.errorType === 'duplicate_email') {
          setIsDuplicateEmailDialogOpen(true)
        } else {
          toast({ variant: "destructive", title: t('actions.error'), description: t(result.message) })
        }
      }
    })
  }

  const renderContent = () => {
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('actions.error')}</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="relative flex-1">
        <div className="absolute inset-0 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="py-1 px-2 w-[150px]">{t('pages.settings.employees.table_header_id')}</TableHead>
                <TableHead className="py-1 px-2">{t('pages.settings.employees.table_header_name')}</TableHead>
                <TableHead className="py-1 px-2">{t('pages.settings.employees.table_header_email')}</TableHead>
                <TableHead className="py-1 px-2 w-[150px]">{t('pages.settings.employees.table_header_location')}</TableHead>
                <TableHead className="py-1 px-2">{t('pages.settings.employees.table_header_projects')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell className="py-2 px-2">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id} onClick={() => handleEdit(employee)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="py-2 px-2 font-mono text-xs">{employee.employee_id}</TableCell>
                    <TableCell className="py-2 px-2">{employee.name}</TableCell>
                    <TableCell className="py-2 px-2">{employee.email}</TableCell>
                    <TableCell className="py-2 px-2">{employee.location}</TableCell>
                    <TableCell className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {employee.projects?.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {t('pages.settings.employees.no_employees_found')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('nav.manage_employees')}</CardTitle>
              <CardDescription>{t('pages.settings.employees.description')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> {t('pages.settings.employees.import_csv')}
              </Button>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('pages.settings.employees.add_new')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[60vh] flex flex-col">
          {renderContent()}
        </CardContent>
      </Card>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        if (isPending) return;
        setIsFormDialogOpen(open);
        if (!open) setEditingEmployee(null);
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? t('pages.settings.employees.dialog_edit_title') : t('pages.settings.employees.dialog_add_title')}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? t('pages.settings.employees.dialog_edit_desc') : t('pages.settings.employees.dialog_add_desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.settings.employees.dialog_form_label_id')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('pages.settings.employees.dialog_form_placeholder_id')}
                          {...field}
                          disabled={true}
                          className="bg-muted"
                        />
                      </FormControl>
                      <FormDescription>
                        {t('pages.settings.employees.dialog_form_placeholder_id_desc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('pages.settings.employees.dialog_form_label_name')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('pages.settings.employees.dialog_form_placeholder_name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.settings.employees.dialog_form_label_email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={t('pages.settings.employees.dialog_form_placeholder_email')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.settings.employees.dialog_form_label_location')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('pages.settings.employees.dialog_form_placeholder_location')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.settings.employees.table_header_projects')}</FormLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="truncate">
                              {field.value && field.value.length > 0
                                ? t('pages.inventory.filter_location_selected', { count: field.value.length })
                                : t('pages.settings.employees.dialog_form_placeholder_projects')
                              }
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                        <DropdownMenuItem onSelect={() => form.setValue('projects', projects, { shouldDirty: true })} className="cursor-pointer">
                          {t('actions.select_all')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => form.setValue('projects', [], { shouldDirty: true })} className="cursor-pointer">
                          {t('actions.deselect_all')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {projects.map((project) => (
                          <DropdownMenuCheckboxItem
                            key={project}
                            checked={field.value?.includes(project)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), project])
                                : field.onChange((field.value || []).filter((value) => value !== project))
                            }}
                            onSelect={e => e.preventDefault()}
                          >
                            {project}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-between w-full pt-4">
                <div>
                  {editingEmployee && (
                    <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isPending}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.delete')}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isPending}>{t('actions.cancel')}</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t('actions.saving') : t('actions.save')}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {editingEmployee && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('actions.delete_confirm_message', { item: editingEmployee.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>{t('actions.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isPending} className={cn(buttonVariants({ variant: "destructive" }))}>
                {isPending ? t('actions.deleting') : t('actions.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Duplicate Email Error Dialog */}
      <AlertDialog open={isDuplicateEmailDialogOpen} onOpenChange={setIsDuplicateEmailDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('actions.settings.employees.email_exists_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.settings.employees.email_exists_message')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsDuplicateEmailDialogOpen(false)}>
              {t('actions.close')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
