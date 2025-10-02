
"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useParams } from "next/navigation"
import { format } from 'date-fns'

import { useI18n } from "@/hooks/use-i18n"
import { type AuditPlan, type AuditItem } from "../page"
import { getLocations, type Location } from "@/app/settings/locations/actions"
import { getEmployees } from "@/app/settings/employees/actions"
import type { Employee } from "@/lib/schemas/settings"
import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Pie, PieChart, Cell } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { enUS, ja } from "date-fns/locale"
import { Loader, ArrowLeft, QrCode, PlusCircle, Calendar, CalendarCheck, CalendarX, RefreshCw } from "lucide-react"

const auditItemSchema = z.object({
  status: z.enum(['Pending', 'Found', 'In Storage', 'Broken', 'Missing', 'Scheduled for Disposal']),
  location: z.string().min(1, "Location is required"),
  user: z.string().min(1, "User is required"),
  notes: z.string().optional(),
});
type AuditItemFormValues = z.infer<typeof auditItemSchema>;

const newAssetSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required."),
  model: z.string().min(1, "Model is required."),
  location: z.string().min(1, "Location is required."),
  user: z.string().optional(),
  notes: z.string().optional()
});
type NewAssetFormValues = z.infer<typeof newAssetSchema>;


export default function AuditDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { t } = useI18n()

  const [plan, setPlan] = useState<AuditPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [editingItem, setEditingItem] = useState<AuditItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isNewAssetFormOpen, setIsNewAssetFormOpen] = useState(false)

  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const qrcodeRegionId = "qr-code-reader"
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)
  const [scannedAssetId, setScannedAssetId] = useState<string | null>(null)

  const itemForm = useForm<AuditItemFormValues>({
    resolver: zodResolver(auditItemSchema),
    defaultValues: {
      status: 'Pending',
      location: '',
      user: '',
      notes: ''
    }
  })
  const newAssetForm = useForm<NewAssetFormValues>({
    resolver: zodResolver(newAssetSchema),
    defaultValues: {
      assetId: '',
      model: '',
      location: '',
      user: '',
      notes: ''
    }
  })

  // --- Data Fetching and Initialization ---
  useEffect(() => {
    const storedPlans = localStorage.getItem("asset_audit_plans")
    if (storedPlans) {
      const allPlans: AuditPlan[] = JSON.parse(storedPlans)
      const currentPlan = allPlans.find(p => p.id === id)
      if (currentPlan) {
        setPlan(currentPlan)
      }
    }
    async function fetchMasterData() {
      const [locationsResult, employeesResult] = await Promise.all([getLocations(), getEmployees()]);
      if (!locationsResult.error) setLocations(locationsResult.locations);
      if (!employeesResult.error) setEmployees(employeesResult.employees);
      setIsLoading(false)
    }
    fetchMasterData()
  }, [id])

  // --- QR Code Scanner Logic ---
  useEffect(() => {
    if (isScannerOpen && !html5QrCodeRef.current) {
      const qrCode = new Html5Qrcode(qrcodeRegionId);
      html5QrCodeRef.current = qrCode;

      const onScanSuccess = (decodedText: string, result: Html5QrcodeResult) => {
        const foundItem = plan?.items.find(item => item.assetId === decodedText);
        if (foundItem) {
          handleEditItem(foundItem);
        }
        setScannedAssetId(decodedText);
        stopScanner();
      };

      qrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, onScanSuccess, undefined)
        .catch(err => console.error("Unable to start scanning.", err));
    }
  }, [isScannerOpen, plan?.items]);

  const stopScanner = () => {
    if (html5QrCodeRef.current?.isScanning) {
      html5QrCodeRef.current.stop()
        .then(() => {
          html5QrCodeRef.current = null;
          setIsScannerOpen(false);
        })
        .catch(err => console.error("Failed to stop scanner.", err));
    } else {
      setIsScannerOpen(false);
    }
  }

  // --- UI Handlers ---
  const handleEditItem = (item: AuditItem) => {
    setEditingItem(item);
    itemForm.reset({
      status: item.status,
      location: item.location,
      user: item.user,
      notes: item.notes || ""
    });
    setIsFormOpen(true);
  }

  const handleAddNewItem = () => {
    newAssetForm.reset();
    setIsNewAssetFormOpen(true);
  }

  // --- Data Mutation ---
  const handleSaveItem = (values: AuditItemFormValues) => {
    if (!plan || !editingItem) return;

    const updatedItem: AuditItem = {
      ...editingItem,
      ...values,
      auditedAt: new Date().toISOString()
    };

    updatePlanWithItems([...plan.items.map(i => i.assetId === updatedItem.assetId ? updatedItem : i)])
    setIsFormOpen(false);
  }

  const handleSaveNewAsset = (values: NewAssetFormValues) => {
    if (!plan) return;
    const newItem: AuditItem = {
      ...values,
      user: values.user || 'Unassigned',
      assetType: 'Unknown',
      isNew: true,
      status: 'Found',
      originalLocation: 'N/A',
      originalUser: 'N/A',
      auditedAt: new Date().toISOString()
    }
    updatePlanWithItems([...plan.items, newItem]);
    setIsNewAssetFormOpen(false);
  }

  const updatePlanWithItems = (updatedItems: AuditItem[]) => {
    if (!plan) return;
    const auditedCount = updatedItems.filter(item => item.status !== 'Pending').length;
    const newProgress = updatedItems.length > 0 ? Math.round((auditedCount / updatedItems.length) * 100) : 0;
    let newPlanStatus = plan.status;
    if (newProgress === 100) {
      newPlanStatus = 'Completed';
    } else if (auditedCount > 0 && newPlanStatus === 'Planning') {
      newPlanStatus = 'In Progress';
    }

    const updatedPlan = { ...plan, items: updatedItems, progress: newProgress, status: newPlanStatus }
    setPlan(updatedPlan)

    const storedPlans = localStorage.getItem("asset_audit_plans")
    if (storedPlans) {
      let allPlans: AuditPlan[] = JSON.parse(storedPlans)
      allPlans = allPlans.map(p => (p.id === id ? updatedPlan : p))
      localStorage.setItem("asset_audit_plans", JSON.stringify(allPlans))
    }
  }

  // --- Display & Formatting ---
  const getStatusBadgeVariant = (status: AuditItem['status']) => {
    switch (status) {
      case 'Found': return 'default'
      case 'Missing': return 'destructive'
      case 'Broken': return 'secondary'
      case 'Scheduled for Disposal': return 'secondary'
      case 'In Storage': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusText = (status: AuditItem['status']) => {
    const key = `pages.audits.status.${status.toLowerCase().replace(/ /g, '_')}`;
    const translated = t(key);
    // This provides a sensible fallback if the key doesn't exist yet
    return translated === key ? status.replace(/([A-Z])/g, ' $1').trim() : translated;
  }

  const statusOptions: AuditItem['status'][] = ['Pending', 'Found', 'Missing', 'Broken', 'In Storage', 'Scheduled for Disposal'];
  const chartData = [
    { name: 'Pending', value: (plan?.items || []).filter(i => i.status === 'Pending').length, fill: 'hsl(var(--chart-3))' },
    { name: 'Found', value: (plan?.items || []).filter(i => i.status === 'Found').length, fill: 'hsl(var(--chart-1))' },
    { name: 'Missing', value: (plan?.items || []).filter(i => i.status === 'Missing').length, fill: 'hsl(var(--destructive))' },
    { name: 'Broken', value: (plan?.items || []).filter(i => i.status === 'Broken').length, fill: 'hsl(var(--chart-2))' },
    { name: 'In Storage', value: (plan?.items || []).filter(i => i.status === 'In Storage').length, fill: 'hsl(var(--chart-4))' },
    { name: 'Scheduled for Disposal', value: (plan?.items || []).filter(i => i.status === 'Scheduled for Disposal').length, fill: 'hsl(var(--chart-5))' },
  ].filter(d => d.value > 0);

  const chartConfig: ChartConfig = {
    items: { label: t('pages.audits.detail.total_assets') },
    'Pending': { label: getStatusText('Pending'), color: "hsl(var(--chart-3))" },
    'Found': { label: getStatusText('Found'), color: "hsl(var(--chart-1))" },
    'Missing': { label: getStatusText('Missing'), color: "hsl(var(--destructive))" },
    'Broken': { label: getStatusText('Broken'), color: "hsl(var(--chart-2))" },
    'In Storage': { label: getStatusText('In Storage'), color: "hsl(var(--chart-4))" },
    'Scheduled for Disposal': { label: getStatusText('Scheduled for Disposal'), color: "hsl(var(--chart-5))" },
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!plan) {
    return <div>{t('actions.error_not_found', { item: t('pages.audits.title') })}</div>
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/audits/execution')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">{t('pages.audits.detail.title')}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{t('pages.audits.detail.due_date')}: {format(plan.dueDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.audits.detail.total_assets')}</p>
                  <p className="text-2xl font-bold">{(plan.items || []).length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.audits.detail.audited')}</p>
                  <p className="text-2xl font-bold">{(plan.items || []).filter(i => i.status !== 'Pending').length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pages.audits.detail.progress')}</p>
                  <p className="text-2xl font-bold">{plan.progress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.audits.detail.summary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-[150px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    strokeWidth={5}
                  >
                    {chartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </CardContent>
        </Card>
      </div>

      {/* Calendar Events Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Events Status
          </CardTitle>
          <CardDescription>
            Manage calendar events for this audit plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {plan.calendar_events && plan.calendar_events.length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">
                      {plan.calendar_events.length} calendar events created
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Events sent to assigned employees
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <CalendarX className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      No calendar events created
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Calendar events will be created automatically
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              {plan.calendar_events && plan.calendar_events.length > 0 && (
                <Button variant="outline" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Events
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('pages.audits.detail.asset_list')}</CardTitle>
              <CardDescription>{t('pages.audits.detail.asset_list_desc')}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                {t('actions.scan_qr')}
              </Button>
              <Button onClick={handleAddNewItem}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('actions.add_unlisted_asset')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('labels.id')}</TableHead>
                    <TableHead>{t('labels.model')}</TableHead>
                    <TableHead>{t('labels.current_user')}</TableHead>
                    <TableHead>{t('labels.current_location')}</TableHead>
                    <TableHead className="w-[200px]">{t('labels.audit_status.self')}</TableHead>
                    <TableHead className="w-[120px] text-right">{t('actions.title')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(plan.items || []).map(item => (
                    <TableRow key={item.assetId} data-scanned={scannedAssetId === item.assetId} className="data-[scanned=true]:bg-primary/20 transition-colors duration-1000">
                      <TableCell className="font-mono text-xs">
                        {item.assetId}
                        {item.isNew && <Badge variant="secondary" className="ml-2">New</Badge>}
                      </TableCell>
                      <TableCell>{item.model}</TableCell>
                      <TableCell>{item.user} {item.user !== item.originalUser && `(was ${item.originalUser})`}</TableCell>
                      <TableCell>{item.location} {item.location !== item.originalLocation && `(was ${item.originalLocation})`}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.status)} className="w-full justify-start">
                          {getStatusText(item.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                          {t('actions.audit')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Dialog */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.audits.qr_scanner.title')}</DialogTitle>
            <DialogDescription>{t('pages.audits.qr_scanner.description')}</DialogDescription>
          </DialogHeader>
          <div id={qrcodeRegionId} className="w-full h-auto aspect-square" />
          <DialogFooter>
            <Button variant="secondary" onClick={stopScanner}>{t('actions.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Item Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.audit')} - {editingItem?.assetId}</DialogTitle>
            <DialogDescription>{editingItem?.model}</DialogDescription>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(handleSaveItem)} className="space-y-4">
              <FormField control={itemForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.audit_status.self')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {statusOptions.map(status => <SelectItem key={status} value={status}>{getStatusText(status)}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <FormField control={itemForm.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.current_location')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                    defaultValue={undefined}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {locations
                        .filter(loc => employees.some(emp => emp.location === loc.name))
                        .map(loc => <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <FormField control={itemForm.control} name="user" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.current_user')}</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined}
                    defaultValue={undefined}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {employees.map(emp => <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <FormField control={itemForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.notes')}</FormLabel>
                  <FormControl><Textarea placeholder={t('labels.notes_placeholder')} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">{t('actions.cancel')}</Button></DialogClose>
                <Button type="submit">{t('actions.save')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Unlisted Asset Dialog */}
      <Dialog open={isNewAssetFormOpen} onOpenChange={setIsNewAssetFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('actions.add_unlisted_asset')}</DialogTitle>
            <DialogDescription>{t('pages.audits.add_unlisted_desc')}</DialogDescription>
          </DialogHeader>
          <Form {...newAssetForm}>
            <form onSubmit={newAssetForm.handleSubmit(handleSaveNewAsset)} className="space-y-4">
              <FormField control={newAssetForm.control} name="assetId" render={({ field }) => (<FormItem><FormLabel>{t('labels.id')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={newAssetForm.control} name="model" render={({ field }) => (<FormItem><FormLabel>{t('labels.model')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={newAssetForm.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.current_location')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {locations
                        .filter(loc => employees.some(emp => emp.location === loc.name))
                        .map(loc => <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <FormField control={newAssetForm.control} name="user" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.current_user')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {employees.map(emp => <SelectItem key={emp.id} value={emp.name}>{emp.name}</SelectItem>)}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>)} />
              <FormField control={newAssetForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel>{t('labels.notes')}</FormLabel>
                  <FormControl><Textarea placeholder={t('labels.notes_placeholder')} {...field} /></FormControl>
                  <FormMessage /></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="secondary">{t('actions.cancel')}</Button></DialogClose>
                <Button type="submit">{t('actions.add')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
