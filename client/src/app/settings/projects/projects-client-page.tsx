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
import { PlusCircle, Trash2, AlertTriangle, GripVertical, Save } from "lucide-react"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { saveProject, deleteProject, updateProjectOrder, bulkUpdateProjectVisibility, bulkUpdateProjectChanges, type Project } from "./actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ProjectFormValues = z.infer<ReturnType<typeof useProjectSchema>>

type ProjectsClientPageProps = {
  initialProjects: Project[];
  initialError: string | null;
}

function useProjectSchema() {
  const { t } = useI18n();
  return z.object({
    name: z.string().min(1, t('validation.required', { field: t('pages.settings.projects.dialog_form_label') })),
    visible: z.boolean(),
  });
}

function SortableProjectRow({ project, onEdit, onVisibilityToggle, isPending }: { project: Project, onEdit: (p: Project) => void, onVisibilityToggle: (p: Project) => void, isPending: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: project.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-dnd-id={project.id}
      onClick={() => onEdit(project)}
      className="cursor-pointer hover:bg-muted/50"
    >
      <TableCell className="py-2 px-2 w-10">
        <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="py-2 px-2">{project.name}</TableCell>
      <TableCell className="py-2 px-2 text-right">
        <Switch
          checked={project.visible}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={() => onVisibilityToggle(project)}
          disabled={isPending}
          aria-label="Toggle visibility"
        />
      </TableCell>
    </TableRow>
  );
}

export default function ProjectsClientPage({ initialProjects, initialError }: ProjectsClientPageProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [error, setError] = useState<string | null>(initialError);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [hasVisibilityChanges, setHasVisibilityChanges] = useState(false)
  const { t } = useI18n()
  const { toast } = useToast()
  const router = useRouter();

  const projectSchema = useProjectSchema();

  useEffect(() => {
    setProjects(initialProjects || []);
    setError(initialError);
    setHasVisibilityChanges(false);
  }, [initialProjects, initialError]);


  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      visible: true,
    },
  })

  const handleAddNew = () => {
    setEditingProject(null)
    form.reset({ name: "", visible: true })
    setIsFormDialogOpen(true)
  }

  const handleEdit = (project: Project) => {
    if (project.name === 'All') return;
    setEditingProject(project)
    form.reset({ name: project.name, visible: project.visible })
    setIsFormDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (!editingProject) return;

    startTransition(async () => {
      const result = await deleteProject(editingProject.id)
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
        });
      }
      setIsDeleteDialogOpen(false);
      setIsFormDialogOpen(false);
    })
  }

  function onSubmit(values: ProjectFormValues) {
    startTransition(async () => {
      const result = await saveProject(editingProject ? editingProject.id : null, values)
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        })
        setIsFormDialogOpen(false)
        setEditingProject(null)
        router.refresh();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        });
      }
    })
  }

  const handleVisibilityToggle = (project: Project) => {
    // Update local state without saving to database
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === project.id
          ? { ...p, visible: !p.visible }
          : p
      )
    );
    setHasVisibilityChanges(true);
  };

  const handleDiscardChanges = () => {
    setProjects([...initialProjects]);
    setHasVisibilityChanges(false);
  };

  const handleSaveVisibilityChanges = () => {
    if (!hasVisibilityChanges) return;

    startTransition(async () => {
      // Get all projects that have different visibility or order from initial state
      const updates = projects
        .filter(project => {
          const initialProject = initialProjects.find(p => p.id === project.id);
          if (!initialProject) return false;

          // Check for visibility changes
          const visibilityChanged = initialProject.visible !== project.visible;
          // Check for order changes
          const orderChanged = initialProject.order !== project.order;

          return visibilityChanged || orderChanged;
        })
        .map(project => {
          const initialProject = initialProjects.find(p => p.id === project.id)!;
          const updates: Partial<Project> = {};

          // Add visibility update if changed
          if (initialProject.visible !== project.visible) {
            updates.visible = project.visible ?? true;
          }

          // Add order update if changed
          if (initialProject.order !== project.order) {
            updates.order = project.order;
          }

          return {
            id: project.id,
            visible: project.visible ?? true,
            name: project.name,
            description: project.description,
            order: project.order
          };
        });

      if (updates.length === 0) {
        setHasVisibilityChanges(false);
        return;
      }

      const result = await bulkUpdateProjectChanges(updates);
      if (result.success) {
        toast({
          title: t('actions.success'),
          description: t(result.message)
        });
        setHasVisibilityChanges(false);
        router.refresh();
      } else {
        toast({
          title: t('actions.error'),
          description: t(result.message),
          variant: "destructive"
        });
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = projects.findIndex((item) => item.id === active.id);
      const newIndex = projects.findIndex((item) => item.id === over!.id);
      const newOrderedProjects = arrayMove(projects, oldIndex, newIndex);

      // Update the order field for each project based on their new position
      const updatedProjects = newOrderedProjects.map((project, index) => ({
        ...project,
        order: index
      }));

      setProjects(updatedProjects);
      setHasVisibilityChanges(true); // Track changes for batch saving
    }
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
                  <TableHead className="py-1 px-2">{t('pages.settings.projects.table_header')}</TableHead>
                  <TableHead className="py-1 px-2 text-right w-24">{t('pages.settings.asset_fields.table_header_visible')}</TableHead>
                </TableRow>
              </TableHeader>
              <SortableContext items={projects} strategy={verticalListSortingStrategy}>
                <TableBody>
                  {projects.map((project) => (
                    <SortableProjectRow
                      key={project.id}
                      project={project}
                      onEdit={handleEdit}
                      onVisibilityToggle={handleVisibilityToggle}
                      isPending={isPending}
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
              <CardTitle>{t('nav.manage_projects')}</CardTitle>
              <CardDescription>{t('pages.settings.projects.description')}</CardDescription>
            </div>
            <div className="flex gap-2">
              {hasVisibilityChanges && (
                <>
                  <Button
                    onClick={handleSaveVisibilityChanges}
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
                <PlusCircle className="mr-2 h-4 w-4" /> {t('pages.settings.projects.add_new')}
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
        if (!open) setEditingProject(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProject ? t('pages.settings.projects.dialog_edit_title') : t('pages.settings.projects.dialog_add_title')}</DialogTitle>
            <DialogDescription>
              {editingProject ? t('pages.settings.projects.dialog_edit_desc') : t('pages.settings.projects.dialog_add_desc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('pages.settings.projects.dialog_form_label')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('pages.settings.projects.dialog_form_placeholder')} {...field} />
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
                      <FormDescription>{t('pages.settings.projects.visibility_desc')}</FormDescription>
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
                  {editingProject && (
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

      {editingProject && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('actions.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('actions.delete_confirm_message', { item: editingProject.name })}
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
