"use client"

import React from "react"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { FrontendAsset, PcFormValues } from '@/lib/types/index'
import { pcSchema } from "@/lib/schemas/inventory"


interface AssetFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PcFormValues) => void;
  onDelete?: () => void;
  isPending: boolean;
  currentAsset?: FrontendAsset | null;
  locations: { id: string; name: string; }[];
  employees: { id: string; name: string; }[];
  allStatuses: string[];
  getDisplayName: (key: keyof PcFormValues) => string;
  getAssetTypeDisplayName: (type: string) => string;
  form: any; // Add form prop
}

export function AssetFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  onDelete,
  isPending,
  currentAsset,
  locations,
  employees,
  allStatuses,
  getDisplayName,
  getAssetTypeDisplayName,
  form,
}: AssetFormDialogProps) {
  const { t } = useI18n();

  const assetType = form.watch('type') || currentAsset?.type || 'pc';

  const locationOptions = locations.map((location) => (
    <SelectItem key={location.id} value={location.name}>
      {location.name}
    </SelectItem>
  ));

  const employeeOptions = employees.map((employee) => (
    <SelectItem key={employee.id} value={employee.id.toString()}>
      {employee.name}
    </SelectItem>
  ));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {currentAsset
              ? t('pages.inventory.edit_asset', { assetType: getAssetTypeDisplayName(currentAsset.type) })
              : t('pages.inventory.add_new_asset')
            }
          </DialogTitle>
          <DialogDescription>
            {currentAsset
              ? t('pages.inventory.edit_asset_desc', { assetType: getAssetTypeDisplayName(currentAsset.type) })
              : t('pages.inventory.add_asset_desc')
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 pl-1">
          <Form {...form}>
            <form id="pc-asset-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Hidden ID fields for editing */}
              <FormField control={form.control} name="id" render={({ field }) => (
                <input type="hidden" {...field} />
              )} />
              <FormField control={form.control} name="assetId" render={({ field }) => (
                <input type="hidden" {...field} />
              )} />
              
              {/* Asset Type Selection */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">{t('labels.asset_type')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('labels.select_type')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pc">{t('pages.inventory.tabs.pcs')}</SelectItem>
                          <SelectItem value="monitor">{t('pages.inventory.tabs.monitors')}</SelectItem>
                          <SelectItem value="smartphones">{t('pages.inventory.tabs.smartphones')}</SelectItem>
                          <SelectItem value="others">{t('pages.inventory.tabs.others')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">{t('labels.basic_info')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormItem>
                    <FormLabel>{t('labels.id')}</FormLabel>
                    <FormControl>
                      <Input value={currentAsset?.assetId || t('labels.autogenerated_id')} disabled />
                    </FormControl>
                  </FormItem>
                  
                  <FormField control={form.control} name="hostname" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('hostname')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="manufacturer" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('manufacturer')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="model" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('model')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('location')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('labels.select_location')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{locationOptions}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('status')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allStatuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="userId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('userId')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('labels.select_employee')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>{employeeOptions}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Additional fields based on asset type */}
              {(assetType === 'pc' || assetType === 'monitor' || assetType === 'smartphones' || assetType === 'other') && (
                <>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium mb-3">{t('labels.system_info')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="os" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getDisplayName('os')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      
                      <FormField control={form.control} name="cpu" render={({ field }) => (
                        <FormItem>
                          <FormLabel>{getDisplayName('cpu')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </>
              )}

              {/* Notes Section */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-3">{t('labels.notes_info')}</h3>
                <div className="grid grid-cols-1 gap-4">
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{getDisplayName('notes')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="pt-4 flex-shrink-0 border-t mt-4 flex justify-between w-full">
          <div>
            {currentAsset && onDelete && (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('actions.delete')}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isPending}>
                {t('actions.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" form="pc-asset-form" disabled={isPending}>
              {isPending ? t('actions.saving') : t('actions.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}