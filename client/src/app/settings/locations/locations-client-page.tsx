
"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button, buttonVariants } from "@/components/ui/button"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PlusCircle, Trash2, AlertTriangle, GripVertical } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { saveLocation, deleteLocation, updateLocationOrder, saveLocationsChanges, type Location } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type LocationFormValues = z.infer<ReturnType<typeof useLocationSchema>>

type LocationsClientPageProps = {
  initialLocations: Location[];
  initialError: string | null;
}

function useLocationSchema() {
  const { t } = useI18n();
  return z.object({
    name: z.string().min(1, t('validation.required', { field: t('pages.settings.locations.dialog_form_label') })),
    visible: z.boolean(),
  });
}

function SortableLocationRow({ location, onEdit, onVisibilityToggle, isPending, hasPendingChanges }: {
  location: Location,
  onEdit: (p: Location) => void,
  onVisibilityToggle: (p: Location) => void,
  isPending: boolean,
  hasPendingChanges: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: location.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-dnd-id={location.id}
      onClick={() => onEdit(location)}
      className="cursor-pointer hover:bg-muted/50"
    >
      <TableCell className="py-2 px-2 w-10">
        <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="py-2 px-2">{location.name}</TableCell>
      <TableCell className="py-2 px-2 text-right">
        <Switch
          checked={location.visible}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onVisibilityToggle(location)}
          disabled={isPending}
          aria-label="Toggle visibility"
        />
      </TableCell>
    </TableRow>
  );
}

export default function LocationsClientPage({ initialLocations, initialError }: LocationsClientPageProps) {
  const [locations, setLocations] = useState<Location[]>(initialLocations || []);
  const [error, setError] = useState<string | null>(initialError);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter();

  const locationSchema = useLocationSchema();

  useEffect(() => {
    setLocations(initialLocations || []);
    setError(initialError);
    setHasPendingChanges(false);
  }, [initialLocations, initialError]);


  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      visible: true,
    },
  })

  const handleAddNew = () => {
    setEditingLocation(null)
    form.reset({ name: "", visible: true })
    setIsFormDialogOpen(true)
  }

  const handleEdit = (location: Location) => {
    if (location.name === 'All') return;
    setEditingLocation(location)
    form.reset({ name: location.name, visible: location.visible })
    setIsFormDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!editingLocation) return;

    startTransition(async () => {
      const result = await deleteLocation(editingLocation.id)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        router.refresh();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
      setIsDeleteDialogOpen(false);
      setIsFormDialogOpen(false);
    })
  }

  function onSubmit(values: LocationFormValues) {
    startTransition(async () => {
      const result = await saveLocation(editingLocation ? editingLocation.id : null, values)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        setIsFormDialogOpen(false)
        setEditingLocation(null)
        router.refresh();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        })
      }
    })
  }

  const handleVisibilityToggle = (location: Location) => {
    const newVisible = !location.visible;

    // Update local state immediately for responsive UI
    setLocations(prev => prev.map(loc =>
      loc.id === location.id ? { ...loc, visible: newVisible } : loc
    ));

    // Track the change for batch saving
    setHasPendingChanges(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = locations.findIndex((item) => item.id === active.id);
      const newIndex = locations.findIndex((item) => item.id === over!.id);
      const newOrderedLocations = arrayMove(locations, oldIndex, newIndex);

      // Update the order field for each location based on their new position
      const updatedLocations = newOrderedLocations.map((location, index) => ({
        ...location,
        order: index
      }));

      // Update local state immediately for responsive UI
      setLocations(updatedLocations);

      // Track changes for batch saving
      setHasPendingChanges(true);
    }
  };

  const handleBatchSave = () => {
    if (!hasPendingChanges) return;

    startTransition(async () => {
      try {
        // Get all locations that have different visibility or order from initial state
        const updates = locations
          .filter(location => {
            const initialLocation = initialLocations.find(l => l.id === location.id);
            if (!initialLocation) return false;

            // Check for visibility changes
            const visibilityChanged = initialLocation.visible !== location.visible;
            // Check for order changes
            const orderChanged = initialLocation.order !== location.order;

            return visibilityChanged || orderChanged;
          })
          .map(location => {
            const initialLocation = initialLocations.find(l => l.id === location.id)!;
            const updates: Partial<Location> = {};

            // Add visibility update if changed
            if (initialLocation.visible !== location.visible) {
              updates.visible = location.visible ?? true;
            }

            // Add order update if changed
            if (initialLocation.order !== location.order) {
              updates.order = location.order;
            }

            return {
              id: location.id,
              updates
            };
          });

        if (updates.length === 0) {
          setHasPendingChanges(false);
          return;
        }

        const result = await saveLocationsChanges(updates);

        if (result.success) {
          toast({
            title: t('actions.success'),
            description: t(result.message)
          });
          setHasPendingChanges(false); // Clear changes
          router.refresh(); // Refresh to get updated data
        } else {
          console.error('❌ Failed to save location changes:', result.message);
          toast({
            title: t('actions.error'),
            description: t('errors.settings.save_failed'),
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Unexpected error during batch save:', error);
        toast({
          title: t('actions.error'),
          description: t('errors.settings.save_failed'),
          variant: "destructive"
        });
      }
    });
  };

  const handleDiscardChanges = () => {
    setHasPendingChanges(false);
    // Reset locations to their original state
    setLocations(initialLocations || []);
  };

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
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="py-1 px-2 w-10"></TableHead>
                  <TableHead className="py-1 px-2">{t('labels.location')}</TableHead>
                  <TableHead className="py-1 px-2 text-right w-24">{t('pages.settings.asset_fields.table_header_visible')}</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext items={locations} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {locations.map((location) => (
                    <SortableLocationRow
                      key={location.id}
                      location={location}
                      onEdit={handleEdit}
                      onVisibilityToggle={handleVisibilityToggle}
                      isPending={isPending}
                      hasPendingChanges={hasPendingChanges}
                    />
                  ))}
                </TableBody>
              </SortableContext>
            </Table>
          </DndContext>
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
              <CardTitle>{t('nav.manage_locations')}</CardTitle>
              <CardDescription>{t('pages.settings.locations.description')}</CardDescription>
            </div>
            <div className="flex gap-2">
              {hasPendingChanges && (
                <>
                  <Button
                    onClick={handleBatchSave}
                    disabled={isPending}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isPending ? t('actions.saving') : t('actions.save')}
                  </Button>
                  <Button
                    onClick={handleDiscardChanges}
                    disabled={isPending}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {t('actions.discard_changes')}
                  </Button>
                </>
              )}
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('pages.settings.locations.add_new')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[60vh] flex flex-col">
          {renderContent()}
        </CardContent>
      </Card>

      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {
        if (isPending) return;
        setIsFormDialogOpen(open);
        if (!open) setEditingLocation(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingLocation ? t('pages.settings.locations.dialog_edit_title') : t('pages.settings.locations.dialog_add_title')}</DialogTitle>
            <DialogDescription>
              {editingLocation ? t('pages.settings.locations.dialog_edit_desc') : t('pages.settings.locations.dialog_add_desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.settings.locations.dialog_form_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('pages.settings.locations.dialog_form_placeholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('pages.settings.asset_fields.table_header_visible')}</FormLabel>
                      <FormDescription>{t('pages.settings.locations.visibility_desc')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="flex justify-between w-full">
                <div>
                  {editingLocation && (
                    <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isPending}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('actions.delete')}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? t('actions.saving') : t('actions.save')}
                  </Button>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" disabled={isPending}>
                      {t('actions.cancel')}
                    </Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {editingLocation && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('actions.delete_confirm_message', { item: editingLocation.name })}
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
    </>
  )
}
