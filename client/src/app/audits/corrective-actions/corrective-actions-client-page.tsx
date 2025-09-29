"use client"

import { useState, useEffect, useMemo } from "react"
import { format, addDays, isAfter, isBefore } from "date-fns"
import { useSearchParams } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader, AlertCircle, CheckCircle, Clock, AlertTriangle, Plus, Edit3, Save, X, Calendar as CalendarIcon, User, Target, FileText, MapPin, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/hooks/use-i18n"
import { enUS, ja } from "date-fns/locale"
import {
  getAuditPlans,
  getCorrectiveActions,
  createCorrectiveAction,
  updateCorrectiveAction,
  updateCorrectiveActionStatus,
  deleteCorrectiveAction
} from "@/lib/graphql-client"
import { getEmployees } from "@/app/settings/employees/actions"
import type { Employee } from "@/lib/schemas/settings"
import { get } from "http"

// Define types for corrective actions
interface AuditAsset {
  id: string;
  current_status: string;
  auditor_notes?: string;
  audited_at?: string;
  resolved: boolean;
  original_location: string;
  original_user?: string;
  current_location?: string;
  asset: {
    id: string;
    asset_id: string;
    model: string;
    location: string;
    user_id?: string;
    employee?: {
      id: string;
      name: string;
    };
  };
}

interface AuditPlan {
  id: string;
  name: string;
  start_date: string;
  due_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  auditAssets: AuditAsset[];
  assignments?: Array<{
    id: string;
    status: string;
    location?: {
      id: string;
      name: string;
    };
    auditor?: {
      id: string;
      name: string;
    };
  }>;
}

interface CorrectiveAction {
  id: string;
  audit_asset_id: string;
  audit_plan_id: string;
  issue: string;
  action: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  due_date: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  auditAsset: AuditAsset;
  auditPlan: AuditPlan;
}

export default function CorrectiveActionsClientPage() {
  const [plans, setPlans] = useState<AuditPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [actions, setActions] = useState<CorrectiveAction[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<CorrectiveAction | null>(null)
  const [actionForm, setActionForm] = useState({
    selectedDiscrepancyId: 'no-discrepancy',
    issue: '',
    action: '',
    assignedTo: '',
    priority: 'medium' as CorrectiveAction['priority'],
    dueDate: new Date(),
    notes: ''
  })

  const { toast } = useToast()
  const searchParams = useSearchParams()

  const { t } = useI18n();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch audit plans and employees in parallel
        const [plansResult, employeesResult] = await Promise.all([
          getAuditPlans(),
          getEmployees()
        ]);

        if (plansResult.success && plansResult.data) {
          // Filter for plans with audit data
          const plansWithData = plansResult.data.filter((plan: any) =>
            plan.auditAssets && plan.auditAssets.length > 0
          );
          setPlans(plansWithData);
          if (plansWithData.length > 0) {
            setSelectedPlanId(plansWithData[0].id);
          }
        } else {
          console.error('Failed to fetch audit plans:', plansResult.error);
        }

        if (employeesResult.employees) {
          setEmployees(employeesResult.employees);
        } else {
          console.error('Failed to fetch employees:', employeesResult.error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [])

  // Handle URL parameters for pre-selecting assets
  useEffect(() => {
    const assetId = searchParams.get('asset');
    const planId = searchParams.get('plan');

    if (assetId && planId && plans.length > 0) {
      // Set the selected plan
      setSelectedPlanId(planId);

      // Find the asset and pre-fill the form
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        const asset = plan.auditAssets.find(a => a.id === assetId);
        if (asset) {
          // Pre-fill the form with asset information
          let issue = '';
          let action = '';
          let priority: CorrectiveAction['priority'] = 'medium';

          if (asset.current_status === 'Missing' || asset.current_status === '欠落') {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is missing from location ${asset.original_location}`;
            action = 'Locate missing asset and verify its condition';
            priority = 'high';
          } else if (asset.current_status === 'Broken' || asset.current_status === '故障中') {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) requires repair`;
            action = 'Schedule repair or replacement assessment';
            priority = 'high';
          } else if (asset.current_status === 'Scheduled for Disposal') {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is scheduled for disposal`;
            action = 'Verify disposal requirements and schedule removal';
            priority = 'low';
          } else if (asset.current_location !== asset.original_location) {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) moved from ${asset.original_location} to ${asset.current_location}`;
            action = 'Update asset location in inventory system';
            priority = 'medium';
          } else if (asset.asset.employee?.name && asset.original_user && asset.asset.employee.name !== asset.original_user) {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) reassigned from ${asset.original_user} to ${asset.asset.employee.name}`;
            action = 'Update asset assignment in inventory system';
            priority = 'medium';
          }

          if (issue && action) {
            setActionForm({
              selectedDiscrepancyId: assetId,
              issue,
              action,
              assignedTo: '',
              priority,
              dueDate: addDays(new Date(), 7),
              notes: asset.auditor_notes || ''
            });

            // Open the create modal
            setIsCreateModalOpen(true);
          }
        }
      }
    }
  }, [searchParams, plans]);

  // Load corrective actions when plan changes
  useEffect(() => {
    if (selectedPlanId) {
      fetchCorrectiveActions();
    }
  }, [selectedPlanId]);

  const fetchCorrectiveActions = async () => {
    if (!selectedPlanId) return;

    try {
      const result = await getCorrectiveActions(selectedPlanId);
      if (result.success && result.data) {
        setActions(result.data);
      } else {
        console.error('Failed to fetch corrective actions:', result.error);
        setActions([]);
      }
    } catch (error) {
      console.error('Error fetching corrective actions:', error);
      setActions([]);
    }
  };

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId),
    [plans, selectedPlanId]
  )

  // Generate corrective actions from audit findings
  const generateCorrectiveActions = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      const newActions: CorrectiveAction[] = [];
      const existingAssetIds = actions.map(a => a.audit_asset_id);

      for (const asset of selectedPlan.auditAssets) {
        if (asset.resolved || existingAssetIds.includes(asset.id)) continue;

        let issue = '';
        let action = '';
        let priority: CorrectiveAction['priority'] = 'medium';

        if (asset.current_status === 'Missing' || asset.current_status === '欠落') {
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is missing from location ${asset.original_location}`;
          action = 'Locate missing asset and verify its condition';
          priority = 'high';
        } else if (asset.current_status === 'Broken' || asset.current_status === '故障中') {
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) requires repair`;
          action = 'Schedule repair or replacement assessment';
          priority = 'high';
        } else if (asset.current_status === 'Scheduled for Disposal') {
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is scheduled for disposal`;
          action = 'Verify disposal requirements and schedule removal';
          priority = 'low';
        } else if (asset.current_location !== asset.original_location) {
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) moved from ${asset.original_location} to ${asset.current_location}`;
          action = 'Update asset location in inventory system';
          priority = 'medium';
        } else if (asset.asset.employee?.name) {
          // Case 1: User was assigned to an asset that previously had no user
          if (!asset.original_user && asset.asset.employee.name) {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) assigned to ${asset.asset.employee.name} (was previously unassigned)`;
            action = 'Update asset assignment in inventory system';
            priority = 'medium';
          }
          // Case 2: User changed from one user to another user
          else if (asset.original_user && asset.asset.employee.name !== asset.original_user) {
            issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) reassigned from ${asset.original_user} to ${asset.asset.employee.name}`;
            action = 'Update asset assignment in inventory system';
            priority = 'medium';
          }
        }

        if (issue && action) {
          // Determine who should be assigned to resolve this discrepancy
          let assignedTo = '';

          // Priority 1: If asset has a user, assign to that user (they're responsible for their asset)
          if (asset.asset.employee?.id) {
            assignedTo = asset.asset.employee.id;
            console.log(`Auto-assigning to asset user: ${asset.asset.employee.name} (ID: ${asset.asset.employee.id})`);
          }
          // Priority 2: If no user, assign to the auditor responsible for this location
          else if ((selectedPlan as any).assignments && (selectedPlan as any).assignments.length > 0) {
            // Find the auditor assigned to this asset's location
            const assetLocation = asset.asset.location;
            const locationAssignment = (selectedPlan as any).assignments.find((assignment: any) =>
              assignment.location?.name === assetLocation
            );

            if (locationAssignment?.auditor?.id) {
              assignedTo = locationAssignment.auditor.id;
            } else {
            }
          } else {
          }
          console.log(`Final assignment for asset ${asset.asset.asset_id}: ${assignedTo || 'No assignment'}`);

          const result = await createCorrectiveAction({
            audit_asset_id: asset.id,
            issue,
            action,
            assigned_to: assignedTo, // Auto-assign to appropriate person
            priority,
            due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
            notes: asset.auditor_notes || ''
          });

          if (result.success && result.data) {
            newActions.push(result.data);
          }
        }
      }

      if (newActions.length > 0) {
        await fetchCorrectiveActions(); // Refresh the list
        toast({
          title: t('actions.success'),
          description: t('pages.audits.confirmation.success', { count: newActions.length })
        });
      } else {
        toast({
          title: t('actions.info'),
          description: t('pages.audits.confirmation.no_new_actions')
        });
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.corrections'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateAction = () => {
    setActionForm({
      selectedDiscrepancyId: 'no-discrepancy',
      issue: '',
      action: '',
      assignedTo: '',
      priority: 'medium',
      dueDate: new Date(),
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleEditAction = (action: CorrectiveAction) => {
    setEditingAction(action);
    setActionForm({
      selectedDiscrepancyId: action.audit_asset_id,
      issue: action.issue,
      action: action.action,
      assignedTo: action.assigned_to || '',
      priority: action.priority,
      dueDate: new Date(action.due_date),
      notes: action.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDiscrepancySelection = (discrepancyId: string) => {
    const selectedDiscrepancy = availableDiscrepancies.find(d => d.id === discrepancyId);
    if (selectedDiscrepancy) {
      setActionForm(prev => ({
        ...prev,
        selectedDiscrepancyId: discrepancyId,
        issue: selectedDiscrepancy.issue,
        action: selectedDiscrepancy.action,
        priority: selectedDiscrepancy.priority,
        notes: selectedDiscrepancy.auditor_notes || ''
      }));
    }
  };

  const handleSaveAction = async () => {
    if (!selectedPlan) return;


    // Check if a discrepancy is selected
    if (!editingAction && (!actionForm.selectedDiscrepancyId || actionForm.selectedDiscrepancyId === 'no-discrepancy')) {
      toast({
        title: t('actions.error'),
        description: t('errors.discrepancy'),
        variant: "destructive"
      });
      return;
    }

    // Check if there are available discrepancies for new actions
    if (!editingAction && availableDiscrepancies.length === 0) {
      toast({
        variant: "destructive",
        title: t('actions.error'),
        description: actions.length === 0 ?
          t('pages.audits.improvement.no_discrepancies') :
          t('pages.audits.improvement.no_discrepancies_act')
      });
      return;
    }

    setIsProcessing(true);
    try {
      if (editingAction) {
        // Update existing action
        const result = await updateCorrectiveAction(editingAction.id, {
          audit_asset_id: actionForm.selectedDiscrepancyId,
          issue: actionForm.issue,
          action: actionForm.action,
          assigned_to: actionForm.assignedTo,
          priority: actionForm.priority,
          due_date: format(actionForm.dueDate, 'yyyy-MM-dd'),
          notes: actionForm.notes
        });

        if (result.success) {
          await fetchCorrectiveActions(); // Refresh the list
          toast({
            title: t('actions.success'),
            description: t('pages.audits.confirmation.update_success')
          });
          setIsEditModalOpen(false);
          setEditingAction(null);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Create new action
        const result = await createCorrectiveAction({
          audit_asset_id: actionForm.selectedDiscrepancyId,
          issue: actionForm.issue,
          action: actionForm.action,
          assigned_to: actionForm.assignedTo,
          priority: actionForm.priority,
          due_date: format(actionForm.dueDate, 'yyyy-MM-dd'),
          notes: actionForm.notes
        });

        if (result.success) {
          await fetchCorrectiveActions(); // Refresh the list
          toast({
            title: t('actions.success'),
            description: t('pages.audits.confirmation.create_success')
          });
          setIsCreateModalOpen(false);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.action_save'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (actionId: string, newStatus: CorrectiveAction['status']) => {
    try {
      const result = await updateCorrectiveActionStatus(actionId, newStatus);
      if (result.success) {
        await fetchCorrectiveActions(); // Refresh the list
        toast({
          title: t('actions.success'),
          description: t('pages.audits.confirmation.status_update_success')
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.action_update'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Are you sure you want to delete this corrective action?')) return;

    try {
      const result = await deleteCorrectiveAction(actionId);
      if (result.success) {
        await fetchCorrectiveActions(); // Refresh the list
        toast({
          title: t('actions.success'),
          description: t('pages.audits.confirmation.delete_success')
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.action_delete'),
        variant: "destructive"
      });
    }
  };

  const handleSendReminders = async () => {
    if (!selectedPlan || planActions.length === 0) return;

    setIsProcessing(true);
    try {
      // Get all pending and in-progress actions that have due dates
      const actionsToRemind = planActions.filter(action =>
        action.status !== 'completed' &&
        action.due_date &&
        action.assigned_to
      );

      if (actionsToRemind.length === 0) {
        toast({
          title: t('actions.info'),
          description: t('pages.audits.confirmation.reminder_no_actions')
        });
        return;
      }

      // Initialize counters
      let remindersSent = 0;
      let remindersFailed = 0;

      // Send reminders for all actions at once using the bulk API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api'}/send-corrective-action-reminders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action_ids: actionsToRemind.map(action => action.id)
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            remindersSent = result.total_sent || 0;
            remindersFailed = result.total_failed || 0;
          } else {
            remindersFailed = actionsToRemind.length;
          }
        } else {
          remindersFailed = actionsToRemind.length;
        }
      } catch (error) {
        remindersFailed = actionsToRemind.length;
        console.error('Failed to send reminders:', error);
      }

      if (remindersSent > 0) {
        toast({
          title: t('actions.success'),
          description: t('pages.audits.confirmation.reminders_sent', { count: remindersSent, failed_message: remindersFailed > 0 ? `, Failed: ${remindersFailed}` : '' })
        });
      } else {
        toast({
          title: t('actions.error'),
          description: t('errors.reminder_error'),
          variant: "destructive"
        });
      }

    } catch (error) {
      toast({
        title: t('actions.error'),
        description: t('errors.reminder_error'),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const planActions = useMemo(() =>
    actions.filter(action => action.audit_plan_id === selectedPlanId),
    [actions, selectedPlanId]
  );

  const pendingActions = useMemo(() =>
    planActions.filter(action => action.status === 'pending'),
    [planActions]
  );

  const inProgressActions = useMemo(() =>
    planActions.filter(action => action.status === 'in_progress'),
    [planActions]
  );

  const completedActions = useMemo(() =>
    planActions.filter(action => action.status === 'completed'),
    [planActions]
  );

  const overdueActions = useMemo(() =>
    planActions.filter(action =>
      action.status !== 'completed' && isAfter(new Date(), new Date(action.due_date))
    ),
    [planActions]
  );

  // Get count of unique employees who have unresolved actions
  const uniqueEmployeesWithUnresolvedActions = useMemo(() => {
    const unresolvedActions = planActions.filter(action =>
      action.status !== 'completed' &&
      action.due_date &&
      action.assigned_to
    );

    // Get unique employee IDs
    const uniqueEmployeeIds = new Set(
      unresolvedActions.map(action => action.assigned_to)
    );

    return uniqueEmployeeIds.size;
  }, [planActions]);

  // Get available discrepancies for the selected plan
  const availableDiscrepancies = useMemo(() => {
    if (!selectedPlan) return [];

    const assets = selectedPlan.auditAssets || [];
    const allDiscrepancies: Array<{
      id: string;
      assetId: string;
      type: string;
      issue: string;
      action: string;
      priority: CorrectiveAction['priority'];
      location: string;
      asset: AuditAsset['asset'];
      current_status: string;
      auditor_notes?: string;
    }> = [];

    assets.forEach(asset => {
      if (asset.resolved) return;

      let issue = '';
      let action = '';
      let priority: CorrectiveAction['priority'] = 'medium';

      let type = '';

      if (asset.current_status === 'Missing' || asset.current_status === '欠落') {
        type = 'missing';
        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is missing from location ${asset.original_location}`;
        action = 'Locate missing asset and verify its condition';
        priority = 'high';
      } else if (asset.current_status === 'Broken' || asset.current_status === '故障中') {
        type = 'broken';
        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) requires repair`;
        action = 'Schedule repair or replacement assessment';
        priority = 'high';
      } else if (asset.current_status === 'Scheduled for Disposal') {
        type = 'disposal';
        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is scheduled for disposal`;
        action = 'Verify disposal requirements and schedule removal';
        priority = 'low';
      } else if (asset.current_location !== asset.original_location) {
        type = 'location_change';
        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) moved from ${asset.original_location} to ${asset.current_location}`;
        action = 'Update asset location in inventory system';
        priority = 'medium';
      } else if (asset.asset.employee?.name) {
        // Case 1: User was assigned to an asset that previously had no user
        if (!asset.original_user && asset.asset.employee.name) {
          type = 'user_change';
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) assigned to ${asset.asset.employee.name} (was previously unassigned)`;
          action = 'Update asset assignment in inventory system';
          priority = 'medium';
        }
        // Case 2: User changed from one user to another user
        else if (asset.original_user && asset.asset.employee.name !== asset.original_user) {
          type = 'user_change';
          issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) reassigned from ${asset.original_user} to ${asset.asset.employee.name}`;
          action = 'Update asset assignment in inventory system';
          priority = 'medium';
        }
      }

      if (issue && action) {
        allDiscrepancies.push({
          id: asset.id,
          assetId: asset.id,
          type,
          issue,
          action,
          priority,
          location: asset.current_location || asset.original_location,
          asset: asset.asset,
          current_status: asset.current_status,
          auditor_notes: asset.auditor_notes
        });
      }
    });

    // Filter out discrepancies that already have actions
    const existingAssetIds = actions.map(a => a.audit_asset_id);
    return allDiscrepancies.filter(d => !existingAssetIds.includes(d.assetId));
  }, [selectedPlan, actions]);

  // Get assignees based on location using actual employees data
  const getAssigneesByLocation = (location: string) => {
    if (!employees || employees.length === 0) {
      return [];
    }

    if (!location || location.trim() === '') {
      return employees;
    }

    const locationLower = location.toLowerCase().trim();

    // Filter employees by exact location match first
    const exactMatches = employees.filter(emp =>
      emp.location && emp.location.toLowerCase().trim() === locationLower
    );

    if (exactMatches.length > 0) {
      return exactMatches;
    }

    // Try partial location matching (e.g., "Building A" matches "Building A Floor 1")
    const partialMatches = employees.filter(emp =>
      emp.location && (
        emp.location.toLowerCase().includes(locationLower) ||
        locationLower.includes(emp.location.toLowerCase())
      )
    );

    if (partialMatches.length > 0) {
      return partialMatches;
    }

    // Try to match employees by department if location contains department info
    const departmentMatches = employees.filter(emp => {
      if (!emp.department) return false;

      const deptLower = emp.department.toLowerCase();
      return locationLower.includes(deptLower) || deptLower.includes(locationLower);
    });

    if (departmentMatches.length > 0) {
      return departmentMatches;
    }

    // Otherwise, return all employees as fallback
    return employees;
  };

  // Enhanced function to get assignees grouped by location relevance
  const getAssigneesGroupedByLocation = (location: string) => {
    if (!employees || employees.length === 0) {
      return { exactMatches: [], partialMatches: [], departmentMatches: [], allOthers: [] };
    }

    if (!location || location.trim() === '') {
      return { exactMatches: [], partialMatches: [], departmentMatches: [], allOthers: employees };
    }

    const locationLower = location.toLowerCase().trim();

    // Exact location matches
    const exactMatches = employees.filter(emp =>
      emp.location && emp.location.toLowerCase().trim() === locationLower
    );

    // Partial location matches (e.g., "Building A" matches "Building A Floor 1")
    const partialMatches = employees.filter(emp =>
      emp.location &&
      emp.location.toLowerCase().includes(locationLower) &&
      emp.location.toLowerCase().trim() !== locationLower
    );

    // Department matches
    const departmentMatches = employees.filter(emp => {
      if (!emp.department || !emp.location) return false;

      const deptLower = emp.department.toLowerCase();
      const locLower = emp.location.toLowerCase();

      // Check if department matches location or vice versa
      return locationLower.includes(deptLower) ||
        deptLower.includes(locationLower) ||
        locLower.includes(deptLower) ||
        deptLower.includes(locLower);
    }).filter(emp =>
      !exactMatches.some(exact => exact.id === emp.id) &&
      !partialMatches.some(partial => partial.id === emp.id)
    );

    // All other employees not in any of the above categories
    const allOthers = employees.filter(emp =>
      !exactMatches.some(exact => exact.id === emp.id) &&
      !partialMatches.some(partial => partial.id === emp.id) &&
      !departmentMatches.some(dept => dept.id === emp.id)
    );

    return { exactMatches, partialMatches, departmentMatches, allOthers };
  };

  // Helper function to get employee name by ID
  const getEmployeeNameById = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.name : employeeId;
  };

  const getPriorityColor = (priority: CorrectiveAction['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriority = (priority: string) => {
    switch (priority) {
      case 'low': return t('labels.priority.low');
      case 'medium': return t('labels.priority.medium');
      case 'high': return t('labels.priority.high');
      case 'critical': return t('labels.priority.critical');
    }
  };

  const getStatusColor = (status: CorrectiveAction['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'default';
      case 'overdue': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatus = (status: CorrectiveAction['status']) => {
    switch (status) {
      case 'completed': return t('labels.statuses.completed');
      case 'in_progress': return t('labels.statuses.in_progress');
      case 'overdue': return t('labels.statuses.overdue');
      case 'pending': return t('labels.statuses.pending');
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: CorrectiveAction['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('pages.audits.confirmation.title')}</CardTitle>
            <CardDescription>{t('pages.audits.confirmation.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select onValueChange={setSelectedPlanId} value={selectedPlanId} disabled={plans.length === 0}>
                <SelectTrigger className="w-full md:w-1/2">
                  <SelectValue placeholder={t('pages.audits.improvement.resolve.audit_plan_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({t('pages.audits.detail.due_date')}: {format(plan.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={generateCorrectiveActions} disabled={!selectedPlan || isProcessing || availableDiscrepancies.length === 0}>
                <Target className="h-4 w-4 mr-2" />
                {isProcessing ? t('actions.generating') : t('actions.generate_action')}
              </Button>

              <Button onClick={handleCreateAction} disabled={!selectedPlan || availableDiscrepancies.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create_action')}
              </Button>

              {selectedPlan && (
                <div className="text-sm text-muted-foreground">
                  {availableDiscrepancies.length === 0 ? (
                    availableDiscrepancies.length === 0 && actions.length === 0 ?
                      t('pages.audits.improvement.no_discrepancies') :
                      t('pages.audits.improvement.no_discrepancies_act')
                  ) : (
                    `${availableDiscrepancies.length} discrepancy${availableDiscrepancies.length === 1 ? '' : 's'} available for action`
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPlan && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{pendingActions.length}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.pending')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">{inProgressActions.length}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.in_progress')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">{completedActions.length}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.completed')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">{overdueActions.length}</div>
                      <div className="text-sm text-muted-foreground">{t('labels.statuses.overdue')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Available Discrepancies Section */}
            {/* {availableDiscrepancies.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Available Discrepancies</CardTitle>
                  <CardDescription>
                    These discrepancies from the audit can be converted to corrective actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset ID</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Issue Description</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableDiscrepancies.map((discrepancy) => {
                          const asset = selectedPlan.auditAssets.find(a => a.id === discrepancy.assetId);
                          if (!asset) return null;
                          
                          return (
                            <TableRow key={discrepancy.assetId}>
                              <TableCell className="font-mono text-sm">
                                {asset.asset.asset_id}
                              </TableCell>
                              <TableCell>{asset.asset.model}</TableCell>
                              <TableCell>
                                <Badge variant={
                                  discrepancy.type === 'missing' ? 'destructive' :
                                  discrepancy.type === 'broken' ? 'destructive' :
                                  'secondary'
                                }>
                                  {discrepancy.type.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[300px]">
                                <div className="text-sm">
                                  {discrepancy.type === 'missing' && 
                                    `Asset is missing from expected location: ${asset.original_location}`
                                  }
                                  {discrepancy.type === 'broken' && 
                                    `Asset is broken and needs repair or replacement`
                                  }
                                  {discrepancy.type === 'location_change' && 
                                    `Asset moved from ${asset.original_location} to ${asset.current_location || 'unknown'}`
                                  }
                                                                     {discrepancy.type === 'user_change' && 
                                     `Asset reassigned from ${asset.original_user} to ${asset.asset.employee?.name}`
                                   }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-sm">{asset.original_location}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  asset.current_status === '欠落' || asset.current_status === 'Missing' ? 'destructive' :
                                  asset.current_status === '故障中' || asset.current_status === 'Broken' ? 'destructive' :
                                  'secondary'
                                }>
                                  {asset.current_status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    // Pre-fill the form with this discrepancy
                                    let issue = '';
                                    let action = '';
                                    let priority: CorrectiveAction['priority'] = 'medium';
                                    
                                    switch (discrepancy.type) {
                                      case 'missing':
                                        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is missing from expected location: ${asset.original_location}`;
                                        action = 'Locate the missing asset and return it to the proper location or update asset records';
                                        priority = 'high';
                                        break;
                                      case 'broken':
                                        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) is broken and needs repair or replacement`;
                                        action = 'Assess damage, repair if possible, or arrange for replacement';
                                        priority = 'high';
                                        break;
                                      case 'location_change':
                                        issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) has moved from ${asset.original_location} to ${asset.current_location || 'unknown'}`;
                                        action = 'Verify if location change is authorized and update asset records accordingly';
                                        priority = 'medium';
                                        break;
                                                                             case 'user_change':
                                         if (!asset.original_user) {
                                           issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) has been assigned to ${asset.asset.employee?.name} (was previously unassigned)`;
                                         } else {
                                           issue = `Asset ${asset.asset.asset_id} (${asset.asset.model}) has been reassigned from ${asset.original_user} to ${asset.asset.employee?.name}`;
                                         }
                                         action = 'Verify if user reassignment is authorized and update asset records';
                                         priority = 'medium';
                                         break;
                                    }
                                    
                                    setActionForm({
                                      selectedDiscrepancyId: discrepancy.assetId,
                                      issue,
                                      action,
                                      assignedTo: '',
                                      priority,
                                      dueDate: addDays(new Date(), 7),
                                      notes: asset.auditor_notes || ''
                                    });
                                    
                                    setIsCreateModalOpen(true);
                                  }}
                                >
                                  <Target className="h-4 w-4 mr-2" />
                                  Create Action
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Actions Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('pages.audits.confirmation.action.title')}</CardTitle>
                    <CardDescription>
                      {t('pages.audits.confirmation.action.description', { plan: selectedPlan.name })}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSendReminders}
                    disabled={planActions.length === 0 || isProcessing}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    {isProcessing ? t('actions.sending') : t('actions.send_reminders')}
                  </Button>
                </div>
                {/* <div className="text-sm text-muted-foreground mt-2">
                  Sends consolidated reminder emails to assigned employees with all their pending and in-progress actions (one email per employee)
                </div> */}
                <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                  <span>📊 {t('pages.audits.confirmation.action.total_unresolved_actions', { count: planActions.filter(action => action.status !== 'completed').length })}</span>
                  <span>👥 {t('pages.audits.confirmation.action.assigned_employees', { count: uniqueEmployeesWithUnresolvedActions })}</span>
                </div>
              </CardHeader>
              <CardContent>
                {planActions.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">{t('labels.id')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.issue')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.action')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.location')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.assignee')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.priority.self')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.status')}</TableHead>
                          <TableHead className="whitespace-nowrap">{t('labels.due_date')}</TableHead>
                          <TableHead className="whitespace-nowrap text-right">{t('labels.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planActions.map((action) => {
                          // Find the asset information for this action
                          const asset = selectedPlan.auditAssets.find(a => a.id === action.audit_asset_id);
                          const location = asset?.current_location || asset?.original_location || 'Unknown';

                          return (
                            <TableRow key={action.id} className={action.status === 'overdue' ? 'bg-red-50' : ''}>
                              <TableCell className="font-mono text-sm">
                                {asset?.asset.asset_id || t('common.not_applicable')}
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="text-sm font-medium">{action.issue}</div>
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="text-sm">{action.action}</div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 whitespace-nowrap">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-sm">{location}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span className="text-sm">
                                    {action.assigned_to ?
                                      (() => {
                                        const employee = employees.find(emp => emp.id === action.assigned_to);
                                        if (employee) {
                                          const asset = selectedPlan.auditAssets.find(a => a.id === action.audit_asset_id);
                                          const location = asset?.current_location || asset?.original_location || '';
                                          const groupedAssignees = getAssigneesGroupedByLocation(location);

                                          let assignmentType = '';
                                          if (groupedAssignees.exactMatches.some(emp => emp.id === action.assigned_to)) {
                                            assignmentType = ' 🎯';
                                          } else if (groupedAssignees.partialMatches.some(emp => emp.id === action.assigned_to)) {
                                            assignmentType = ' 🔍';
                                          } else if (groupedAssignees.departmentMatches.some(emp => emp.id === action.assigned_to)) {
                                            assignmentType = ' 🏢';
                                          } else {
                                            assignmentType = ' 👥';
                                          }

                                          return `${employee.name}${employee.department ? ` (${employee.department})` : ''}${assignmentType}`;
                                        }
                                        return action.assigned_to;
                                      })()
                                      : 'Unassigned'
                                    }
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getPriorityColor(action.priority)}>
                                  {getPriority(action.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 whitespace-nowrap">
                                  {getStatusIcon(action.status)}
                                  <Badge variant={getStatusColor(action.status)}>
                                    {getStatus(action.status)}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`text-sm ${isAfter(new Date(), new Date(action.due_date)) && action.status !== 'completed' ? 'text-red-600 font-medium whitespace-nowrap' : ''}`}>
                                  {format(action.due_date, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <Select
                                    value={action.status}
                                    onValueChange={(value: CorrectiveAction['status']) => handleUpdateStatus(action.id, value)}
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">{t('labels.statuses.overdue')}</SelectItem>
                                      <SelectItem value="in_progress">{t('labels.statuses.in_progress')}</SelectItem>
                                      <SelectItem value="completed">{t('labels.statuses.completed')}</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditAction(action)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteAction(action.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <Target className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-foreground">{t('pages.audits.confirmation.no_corrective_actions')}</h3>
                    <p className="text-sm">
                      {availableDiscrepancies.length === 0 ? (
                        actions.length === 0 ?
                          t('pages.audits.improvement.no_discrepancies') :
                          t('pages.audits.improvement.no_discrepancies_act')
                      ) : (
                        t('pages.audits.improvement.no_discrepancies_instruct')
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedPlanId && plans.length > 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t('pages.audits.select_audit_plan')}
            </CardContent>
          </Card>
        )}

        {plans.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-foreground">{t('pages.audits.no_plans_found_title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('pages.audits.no_plans_found_desc_reporting')}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Action Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setEditingAction(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? t('pages.audits.confirmation.edit.title') : t('pages.audits.confirmation.create.title')}
            </DialogTitle>
            <DialogDescription>
              {editingAction ? t('pages.audits.confirmation.edit.description') : t('pages.audits.confirmation.create.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editingAction && (
              <div>
                <label className="text-sm font-medium">{t('pages.audits.confirmation.edit.select')}</label>
                <Select
                  value={actionForm.selectedDiscrepancyId === 'no-discrepancy' ? undefined : actionForm.selectedDiscrepancyId}
                  onValueChange={handleDiscrepancySelection}
                  disabled={availableDiscrepancies.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      availableDiscrepancies.length === 0 ?
                        t('pages.audits.confirmation.edit.unavailable') :
                        t('pages.audits.confirmation.edit.available')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDiscrepancies.length === 0 ? (
                      <SelectItem value="no-discrepancies" disabled>
                        {t('pages.audits.confirmation.edit.unavailable')}
                      </SelectItem>
                    ) : (
                      availableDiscrepancies.map((discrepancy) => (
                        <SelectItem key={discrepancy.id} value={discrepancy.id}>
                          {discrepancy.asset.asset_id} - {discrepancy.issue.substring(0, 50)}...
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {availableDiscrepancies.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    {actions.length === 0 ?
                      t('pages.audits.improvement.no_discrepancies') :
                      t('pages.audits.improvement.no_discrepancies_act')
                    }
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium">{t('pages.audits.confirmation.edit.issue_desc')}</label>
              <Textarea
                value={actionForm.issue}
                onChange={(e) => setActionForm(prev => ({ ...prev, issue: e.target.value }))}
                placeholder={t('pages.audits.confirmation.edit.issue_placeholder')}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t('pages.audits.confirmation.edit.corrective_action')}</label>
              <Textarea
                value={actionForm.action}
                onChange={(e) => setActionForm(prev => ({ ...prev, action: e.target.value }))}
                placeholder={t('pages.audits.confirmation.edit.action_placeholder')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium">{t('labels.assignee')}</label>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{t('pages.audits.confirmation.edit.assignee_desc')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Select
                    value={actionForm.assignedTo}
                    onValueChange={(value) => setActionForm(prev => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('pages.audits.confirmation.edit.assignee_select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        let location = '';

                        if (editingAction) {
                          // When editing, get location from the existing action's asset
                          const asset = selectedPlan?.auditAssets.find(a => a.id === actionForm.selectedDiscrepancyId);
                          location = asset?.current_location || asset?.original_location || '';
                        } else {
                          // When creating, get location from selected discrepancy
                          const selectedDiscrepancy = availableDiscrepancies.find(d => d.id === actionForm.selectedDiscrepancyId);
                          location = selectedDiscrepancy?.location || '';
                        }

                        if (!location) {
                          return <SelectItem value="no-location">{t('pages.audits.confirmation.edit.no_location')}</SelectItem>;
                        }

                        let groupedAssignees = getAssigneesGroupedByLocation(location);

                        if (groupedAssignees.exactMatches.length === 0 &&
                          groupedAssignees.partialMatches.length === 0 &&
                          groupedAssignees.departmentMatches.length === 0) {
                          return <SelectItem value="no-employees">{t('pages.audits.confirmation.edit.no_location')}</SelectItem>;
                        }

                        return (
                          <>
                            {groupedAssignees.exactMatches.length > 0 && (
                              <>
                                <SelectItem value="exact-header" disabled className="font-semibold text-primary">
                                  🎯 {t('pages.audits.confirmation.edit.exact_loc_match')}
                                </SelectItem>
                                {groupedAssignees.exactMatches.map((assignee: any) => (
                                  <SelectItem key={assignee.id} value={assignee.id} className="pl-6">
                                    {assignee.name} {assignee.department ? `(${assignee.department})` : ''} - {assignee.location}
                                  </SelectItem>
                                ))}
                              </>
                            )}

                            {groupedAssignees.partialMatches.length > 0 && (
                              <>
                                <SelectItem value="partial-header" disabled className="font-semibold text-blue-600">
                                  🔍 {t('pages.audits.confirmation.edit.partial_loc_match')}
                                </SelectItem>
                                {groupedAssignees.partialMatches.map((assignee: any) => (
                                  <SelectItem key={assignee.id} value={assignee.id} className="pl-6">
                                    {assignee.name} {assignee.department ? `(${assignee.department})` : ''} - {assignee.location}
                                  </SelectItem>
                                ))}
                              </>
                            )}

                            {groupedAssignees.departmentMatches.length > 0 && (
                              <>
                                <SelectItem value="department-header" disabled className="font-semibold text-orange-600">
                                  🏢 {t('pages.audits.confirmation.edit.dept_based_match')}
                                </SelectItem>
                                {groupedAssignees.departmentMatches.map((assignee: any) => (
                                  <SelectItem key={assignee.id} value={assignee.id} className="pl-6">
                                    {assignee.name} {assignee.department ? `(${assignee.department})` : ''} - {assignee.location}
                                  </SelectItem>
                                ))}
                              </>
                            )}

                            {groupedAssignees.allOthers.length > 0 && (
                              <>
                                <SelectItem value="all-header" disabled className="font-semibold text-gray-500">
                                  👥 {t('pages.audits.confirmation.edit.all_other_emp')}
                                </SelectItem>
                                {groupedAssignees.allOthers.map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id} className="pl-6">
                                    {emp.name} {emp.department ? `(${emp.department})` : ''} {emp.location ? `- ${emp.location}` : ''}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                {(() => {
                  let location = '';

                  if (editingAction) {
                    // When editing, get location from the existing action's asset
                    const asset = selectedPlan?.auditAssets.find(a => a.id === actionForm.selectedDiscrepancyId);
                    location = asset?.current_location || asset?.original_location || '';
                  } else {
                    // When creating, get location from selected discrepancy
                    const selectedDiscrepancy = availableDiscrepancies.find(d => d.id === actionForm.selectedDiscrepancyId);
                    location = selectedDiscrepancy?.location || '';
                  }

                  if (!location) {
                    return null;
                  }

                  let groupedAssignees = getAssigneesGroupedByLocation(location);

                  return (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Location: {location} •
                        {(() => {
                          if (groupedAssignees.exactMatches.length > 0) {
                            return t('pages.audits.confirmation.edit.exact_match', { count: groupedAssignees.exactMatches.length });
                          } else if (groupedAssignees.partialMatches.length > 0) {
                            return t('pages.audits.confirmation.edit.partial_match', { count: groupedAssignees.partialMatches.length });
                          } else if (groupedAssignees.departmentMatches.length > 0) {
                            return t('pages.audits.confirmation.edit.dept_match', { count: groupedAssignees.departmentMatches.length });
                          } else {
                            return t('pages.audits.confirmation.edit.no_loc_assignee');
                          }
                        })()}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-sm font-medium">{t('labels.priority.self')}</label>
                <Select
                  value={actionForm.priority}
                  onValueChange={(value: CorrectiveAction['priority']) => setActionForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('labels.priority.low')}</SelectItem>
                    <SelectItem value="medium">{t('labels.priority.medium')}</SelectItem>
                    <SelectItem value="high">{t('labels.priority.high')}</SelectItem>
                    <SelectItem value="critical">{t('labels.priority.critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t('labels.due_date')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(actionForm.dueDate, t('date.format'), { locale: t('date.locale') === 'en-US' ? enUS : ja })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={actionForm.dueDate}
                    onSelect={(date) => date && setActionForm(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="text-sm font-medium">{t('labels.notes')}</label>
              <Textarea
                value={actionForm.notes}
                onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('labels.notes_placeholder')}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setEditingAction(null);
              }}>
                <X className="h-4 w-4 mr-2" />
                {t('actions.cancel')}
              </Button>
              <Button onClick={handleSaveAction} disabled={isProcessing || (!editingAction && availableDiscrepancies.length === 0)}>
                {isProcessing ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingAction ? t('actions.update') : t('actions.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
