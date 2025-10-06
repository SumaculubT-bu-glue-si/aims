
"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlusCircle, Pencil, Trash2, Upload, Loader, AlertTriangle } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { getEmployees, saveEmployee, deleteEmployee } from "./actions"
import type { Employee } from "@/lib/schemas/settings"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { employeeSchema as getEmployeeSchema, type EmployeeFormValues } from "@/lib/schemas/settings"

export default function EmployeesClientPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isPending, startTransition] = useTransition()
  const { t } = useI18n()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null);
  const employeeSchema = getEmployeeSchema(t);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    const { employees: fetchedEmployees, error } = await getEmployees();
    if (error) {
      setError(error);
    } else {
      setEmployees(fetchedEmployees);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const form = useForm<Omit<EmployeeFormValues, 'employeeId' | 'department'>>({
    resolver: zodResolver(employeeSchema.omit({ employeeId: true, department: true })),
    defaultValues: {
      name: "",
    },
  })

  const handleAddNew = () => {
    setEditingEmployee(null)
    form.reset({ name: "" })
    setIsFormDialogOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    form.reset({ name: employee.name })
    setIsFormDialogOpen(true)
  }

  const handleDelete = (employeeId: string) => {
    startTransition(async () => {
      const result = await deleteEmployee(employeeId)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        await fetchData();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length === 0) return;

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const nameIndex = headers.indexOf('name');

        const startIndex = nameIndex !== -1 ? 1 : 0;
        const employeeIndex = nameIndex !== -1 ? nameIndex : 0;

        const newEmployees: string[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length > employeeIndex) {
            const employeeName = values[employeeIndex].trim().replace(/"/g, '');
            if (employeeName) {
              newEmployees.push(employeeName);
            }
          }
        }

        startTransition(async () => {
          for (const name of newEmployees) {
            await saveEmployee(null, name);
          }
          toast({
            title: t('actions.success'),
            description: t('pages.settings.employees.import_success', { count: newEmployees.length })
          });
          await fetchData();
        });
      }
    };
    reader.readAsText(file);

    if (event.target) {
      event.target.value = '';
    }
  };

  function onSubmit(values: Omit<EmployeeFormValues, 'employeeId' | 'department'>) {
    startTransition(async () => {
      const result = await saveEmployee(editingEmployee ? editingEmployee.id : null, values.name)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        setIsFormDialogOpen(false)
        setEditingEmployee(null)
        await fetchData();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
    })
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('pages.settings.employees.table_header_name')}</TableHead>
            <TableHead className="text-right w-[100px]">{t('pages.settings.employees.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)}>
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{t('actions.edit')}</span>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">{t('actions.delete')}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('actions.delete_confirm_message', { item: employee.name })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(employee.id)} disabled={isPending}>
                        {isPending ? t('actions.deleting') : t('actions.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4 gap-2">
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> {t('pages.settings.employees.import_csv')}
        </Button>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> {t('pages.settings.employees.add_new')}
        </Button>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".csv"
      />

      {renderContent()}

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? t('pages.settings.employees.dialog_edit_title') : t('pages.settings.employees.dialog_add_title')}</DialogTitle>
            <DialogDescription>
              {editingEmployee ? t('pages.settings.employees.dialog_edit_desc') : t('pages.settings.employees.dialog_add_desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" disabled={isPending}>{t('actions.cancel')}</Button>
                </DialogClose>
                <Button type="submit" disabled={isPending}>{isPending ? t('actions.saving') : t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
