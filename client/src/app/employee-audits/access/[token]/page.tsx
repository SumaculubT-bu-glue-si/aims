"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { graphqlQuery } from "@/lib/graphql-client"
import { 
  Loader, AlertCircle, CheckCircle, XCircle, FileText, MapPin, User, 
  Search, Filter, Download, Edit3, Eye, CheckSquare, Square, 
  Calendar, Clock, AlertTriangle, Info, Target, Settings, ListTodo,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AuditAsset {
  id: string
  asset_id: string
  asset_type: string
  model: string
  original_user: string | null
  original_location: string
  current_user?: string | null
  current_location?: string
  status: string
  notes?: string
  audited_at?: string
  resolved?: boolean
  audit_status: boolean
}

interface AuditPlan {
  id: string
  name: string
  start_date: string
  due_date: string
  progress: number
  total_assets: number
  completed_assets: number
}

interface CorrectiveAction {
  id: string
  audit_asset_id: string
  issue: string
  action: string
  assigned_to: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  due_date: string
  completed_date?: string
  notes?: string
  created_at: string
  updated_at: string
  asset: {
    asset_id: string
    model: string
    location: string
  }
}

interface EmployeeAuditData {
  employee: {
    id: string
    name: string
    email: string
  }
  selectedPlan: AuditPlan
  auditAssets: AuditAsset[]
  role: {
    isAuditor: boolean
    assignedLocation: string | null
    canAuditAllAssets: boolean
    description: string
  }
}

interface StatusUpdateData {
  assetId: string
  status: string
  notes: string
  reassignUserId?: string
}

interface ActionUpdateData {
  actionId: string
  status: string
  notes: string
}

export default function EmployeeAuditAccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<{
    isAuditor: boolean
    assignedLocation: string | null
    canAuditAllAssets: boolean
    description: string
  } | null>(null)
  const [auditData, setAuditData] = useState<EmployeeAuditData | null>(null)
  const [expired, setExpired] = useState(false)
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<string>("audit")
  
  // UI State
  const [selectedPlan, setSelectedPlan] = useState<AuditPlan | null>(null)
  const [planAssets, setPlanAssets] = useState<AuditAsset[]>([])
     const [searchTerm, setSearchTerm] = useState("")
   const [statusFilter, setStatusFilter] = useState<string>("all")
   const [auditStatusFilter, setAuditStatusFilter] = useState<string>("all")
   const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set())
   
   // Pagination state
   const [currentPage, setCurrentPage] = useState(1)
   const [itemsPerPage, setItemsPerPage] = useState(12)
   
   // Corrective Actions pagination state
   const [actionsCurrentPage, setActionsCurrentPage] = useState(1)
   const [actionsItemsPerPage, setActionsItemsPerPage] = useState(5)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AuditAsset | null>(null)
  const [statusUpdateData, setStatusUpdateData] = useState<StatusUpdateData>({
    assetId: "",
    status: "",
    notes: "",
    reassignUserId: undefined
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [availableEmployees, setAvailableEmployees] = useState<Array<{id: string, name: string, email: string}>>([])

  // Corrective Actions state
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([])
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null)
  const [actionUpdateData, setActionUpdateData] = useState<ActionUpdateData>({
    actionId: "",
    status: "",
    notes: ""
  })
  const [isUpdatingAction, setIsUpdatingAction] = useState(false)
  
  // Corrective Actions sorting and filtering
  const [actionsStatusFilter, setActionsStatusFilter] = useState<string>("all")
  const [actionsPriorityFilter, setActionsPriorityFilter] = useState<string>("all")
  const [actionsSearchTerm, setActionsSearchTerm] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Invalid access token")
      setIsLoading(false)
      return
    }

    fetchAuditData()
  }, [token])

  // Fetch corrective actions when audit data and plan are loaded
  useEffect(() => {
    if (auditData?.employee.id && selectedPlan?.id) {
      fetchCorrectiveActions()
    }
  }, [auditData?.employee.id, selectedPlan?.id])



  const fetchAuditData = async () => {
    try {
      const query = `
        query GetEmployeeAuditAccess($token: String!) {
          employeeAuditAccess(token: $token) {
            success
            message
            employee {
              id
              name
              email
            }
            selectedPlan {
              id
              name
              start_date
              due_date
              progress
              total_assets
              completed_assets
            }
            auditAssets {
              id
              asset_id
              asset_type
              model
              original_user
              original_location
              current_user
              current_location
              status
              audit_status
              notes
              audited_at
              resolved
            }
            role {
              isAuditor
              assignedLocation
              canAuditAllAssets
              description
            }
          }
        }
      `

      const result = await graphqlQuery(query, { token })
      
      if (!result.data?.employeeAuditAccess.success) {
        if (result.data?.employeeAuditAccess.message.includes('expired') || result.data?.employeeAuditAccess.message.includes('invalid')) {
          setExpired(true)
        } else {
          setError(result.data?.employeeAuditAccess.message || "Failed to fetch audit data")
        }
        setIsLoading(false)
        return
      }

      const data = result.data.employeeAuditAccess
      setAuditData({
        employee: data.employee,
        selectedPlan: data.selectedPlan,
        auditAssets: data.auditAssets || [],
        role: data.role
      })
      setUserRole(data.role)

      setPlanAssets(data.auditAssets || [])      
      // Automatically set the selected plan and load assets
      if (data.selectedPlan) {
        setSelectedPlan(data.selectedPlan)
      }
      setIsLoading(false)
    } catch (error) {
      console.error('GraphQL error:', error)
      setError("Failed to fetch audit data. Please try again.")
      setIsLoading(false)
    }
  }



  const updateAssetStatus = async (assetId: string, status: string, notes?: string, reassignUserId?: string) => {
    try {
      setIsUpdating(true)
      
      const mutation = `
        mutation UpdateAssetStatus(
          $token: String!
          $assetId: ID!
          $status: String!
          $notes: String
          $reassignUserId: ID
        ) {
          updateAssetStatus(
            token: $token
            assetId: $assetId
            status: $status
            notes: $notes
            reassignUserId: $reassignUserId
          ) {
            success
            message
            asset {
              id
              audit_status
              current_status
              notes
              audited_at
              audited_by
              location_changed
              user_changed
              user_assigned
            }
            main_asset_updated
            user_assignment {
              old_user_id
              new_user_id
              new_user_name
            }
            changes_detected {
              location
              user
            }
          }
        }
      `

      const result = await graphqlQuery(mutation, {
        token,
        assetId,
        status,
        notes,
        reassignUserId
      })

      if (result.data?.updateAssetStatus.success) {
        // Refresh audit data
        await fetchAuditData()
        setShowStatusModal(false)
        setStatusUpdateData({ assetId: "", status: "", notes: "", reassignUserId: undefined })
      } else {
        const errorMessage = result.data?.updateAssetStatus.message || 'Failed to update asset status'
        
        // Handle specific error cases
        if (errorMessage.includes('already been resolved')) {
          setError("This asset has already been resolved and cannot be updated. Please contact your administrator if you need to make changes.")
        } else if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
          setError("Your access token has expired or is invalid. Please request a new access link.")
        } else {
          setError(errorMessage)
        }
        return // Don't throw error, just show the specific message
      }
    } catch (error) {
      console.error('Failed to update asset status:', error)
      setError("Failed to update asset status. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStatusUpdate = () => {
    if (statusUpdateData.status && statusUpdateData.assetId) {
      updateAssetStatus(
        statusUpdateData.assetId, 
        statusUpdateData.status, 
        statusUpdateData.notes,
        statusUpdateData.reassignUserId
      )
    }
  }

  const fetchAvailableEmployees = async (location: string) => {
    try {
      const response = await fetch(`/api/employees?location=${encodeURIComponent(location)}`)
      if (response.ok) {
        const data = await response.json()
        setAvailableEmployees(data.employees || [])
      } else {
        console.error('Failed to fetch employees:', response.status, response.statusText)
        setAvailableEmployees([])
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
      setAvailableEmployees([])
    }
  }

  const openStatusModal = async (asset: AuditAsset) => {
    // Prevent opening modal for resolved assets
    if (asset.resolved) {
      setError("This asset has already been resolved and cannot be updated. Please contact your administrator if you need to make changes.")
      return
    }
    
    setSelectedAsset(asset)
    setStatusUpdateData({
      assetId: asset.id,
      status: asset.status,
      notes: asset.notes || "",
      reassignUserId: undefined // Always start with undefined for user assignment
    })
    
    // Only fetch available employees if the asset doesn't have a current user
    if (!asset.current_user) {
      await fetchAvailableEmployees(asset.original_location)
    }
    
    setShowStatusModal(true)
  }

  const openAssetModal = (asset: AuditAsset) => {
    setSelectedAsset(asset)
    setShowAssetModal(true)
  }

  const toggleAssetSelection = (assetId: string) => {
    const newSelection = new Set(selectedAssets)
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId)
    } else {
      newSelection.add(assetId)
    }
    setSelectedAssets(newSelection)
  }

  const selectAllAssets = () => {
    if (selectedAssets.size === filteredAssets.length) {
      setSelectedAssets(new Set())
    } else {
      setSelectedAssets(new Set(filteredAssets.map(asset => asset.id)))
    }
  }

  const bulkUpdateStatus = async (status: string) => {
    if (selectedAssets.size === 0) return
    
    try {
      setIsUpdating(true)
      const promises = Array.from(selectedAssets).map(assetId =>
        updateAssetStatus(assetId, status) // Bulk updates don't change user assignments
      )
      
             await Promise.all(promises)
       setSelectedAssets(new Set())
       
       // Refresh audit data
       await fetchAuditData()
     } catch (error) {
       setError("Failed to update some assets. Please try again.")
     } finally {
       setIsUpdating(false)
     }
  }

  const exportAuditReport = () => {
    if (!auditData || !selectedPlan) return
    
    const reportData = {
      employee: auditData.employee,
      auditPlan: selectedPlan,
      exportDate: new Date().toISOString(),
      auditAssets: filteredAssets
    }
    
    // Create and download CSV
    const csvContent = generateCSV(reportData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-report-${selectedPlan.name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateCSV = (data: any) => {
    const headers = ['Asset ID', 'Model', 'Original Location', 'Original User', 'Current Status', 'Notes', 'Audited At']
    const rows = data.auditAssets.map((asset: AuditAsset) => [
      asset.asset_id,
      asset.model,
      asset.original_location,
      asset.original_user || 'Unassigned',
      asset.status,
      asset.notes || '',
      asset.audited_at || 'Not audited'
    ])
    
    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  // Corrective Actions Functions
  const fetchCorrectiveActions = async () => {
    if (!auditData?.employee.id || !selectedPlan?.id) return
    
    try {
      const query = `
        query GetCorrectiveActions($employee_id: ID!, $audit_plan_id: ID!) {
          employeeCorrectiveActions(employee_id: $employee_id, audit_plan_id: $audit_plan_id) {
            success
            message
            actions {
              id
              audit_asset_id
              issue
              action
              assigned_to
              priority
              status
              due_date
              completed_date
              notes
              created_at
              updated_at
              asset {
                asset_id
                model
                location
              }
            }
            role {
              isAuditor
              assignedLocation
              canSeeAllActions
              description
            }
          }
        }
      `

      const result = await graphqlQuery(query, {
        employee_id: auditData.employee.id,
        audit_plan_id: selectedPlan.id
      })

      if (result.data?.employeeCorrectiveActions.success) {
        setCorrectiveActions(result.data.employeeCorrectiveActions.actions || [])
        
        // Update user role if it includes corrective actions role info
        if (result.data.employeeCorrectiveActions.role) {
          setUserRole(prev => prev ? { ...prev, ...result.data.employeeCorrectiveActions.role } : result.data.employeeCorrectiveActions.role)
        }
      } else {
        console.error('Failed to fetch corrective actions:', result.data?.employeeCorrectiveActions.message)
        setCorrectiveActions([])
      }
    } catch (error) {
      console.error('Failed to fetch corrective actions:', error)
      setCorrectiveActions([])
    }
  }

  const updateCorrectiveActionStatus = async (actionId: string, status: string, notes: string) => {
    try {
      setIsUpdatingAction(true)
      const { updateEmployeeCorrectiveActionStatus } = await import('@/lib/graphql-client')
      const result = await updateEmployeeCorrectiveActionStatus(
        actionId,
        status,
        notes,
        auditData?.employee.id || ''
      )

      if (result.success) {
        // Refresh corrective actions
        await fetchCorrectiveActions()
        return true
      } else {
        throw new Error(result.error || 'Failed to update action status')
      }
    } catch (error) {
      console.error('Failed to update action status:', error)
      throw error
    } finally {
      setIsUpdatingAction(false)
    }
  }

  const handleActionStatusUpdate = async () => {
    if (!actionUpdateData.status || !actionUpdateData.actionId) return
    
    try {
      await updateCorrectiveActionStatus(
        actionUpdateData.actionId,
        actionUpdateData.status,
        actionUpdateData.notes
      )
      
      setShowActionModal(false)
      setSelectedAction(null)
      setActionUpdateData({ actionId: "", status: "", notes: "" })
    } catch (error) {
      setError("Failed to update action status. Please try again.")
    }
  }

  const openActionModal = (action: CorrectiveAction) => {
    setSelectedAction(action)
    setActionUpdateData({
      actionId: action.id,
      status: action.status,
      notes: action.notes || ""
    })
    setShowActionModal(true)
  }

  const getActionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getActionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'default'
      case 'overdue': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'overdue': return <AlertTriangle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

     // Filter assets based on search, status, audit status, AND user role
   const filteredAssets = planAssets.filter(asset => {
      // ROLE-BASED FILTERING: Most important filter first
    const matchesRole = userRole?.isAuditor 
      ? true // Auditors see ALL assets
      : asset.current_user === auditData?.employee.name // Employees see only their assets

    if (!matchesRole) return false

     const matchesSearch = asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asset.original_user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (asset.original_location || '').toLowerCase().includes(searchTerm.toLowerCase())
     
     const matchesStatus = statusFilter === "all" || asset.status === statusFilter
     
     const matchesAuditStatus = auditStatusFilter === "all" || 
                               (auditStatusFilter === "audited" && asset.audit_status) ||
                               (auditStatusFilter === "pending" && !asset.audit_status) ||
                               (auditStatusFilter === "owned" && asset.current_user === auditData?.employee.name)
     
     return matchesSearch && matchesStatus && matchesAuditStatus
   })

   // Pagination logic
   const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
   const startIndex = (currentPage - 1) * itemsPerPage
   const endIndex = startIndex + itemsPerPage
   const paginatedAssets = filteredAssets.slice(startIndex, endIndex)

   // Reset to first page when filters change
   useEffect(() => {
     setCurrentPage(1)
   }, [searchTerm, statusFilter, auditStatusFilter])

       // Reset to first page when plan assets change
    useEffect(() => {
      setCurrentPage(1)
    }, [planAssets])
    
      // Corrective Actions sorting and filtering logic
  const filteredAndSortedActions = useMemo(() => {
    let filtered = correctiveActions.filter(action => {
      // Status filter
      if (actionsStatusFilter !== "all" && action.status !== actionsStatusFilter) {
        return false
      }
      
      // Priority filter
      if (actionsPriorityFilter !== "all" && action.priority !== actionsPriorityFilter) {
        return false
      }
      
      // Search filter
      if (actionsSearchTerm) {
        const searchLower = actionsSearchTerm.toLowerCase()
        return (
          action.issue.toLowerCase().includes(searchLower) ||
          action.action.toLowerCase().includes(searchLower) ||
          action.asset.asset_id.toLowerCase().includes(searchLower) ||
          action.asset.model.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
    
         // Sort by status priority: pending -> in_progress -> completed -> overdue
     const statusPriority = { pending: 1, in_progress: 2, completed: 3, overdue: 4 }
    filtered.sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status]
      if (statusDiff !== 0) return statusDiff
      
      // Within same status, sort by priority: critical -> high -> medium -> low
      const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    
    return filtered
  }, [correctiveActions, actionsStatusFilter, actionsPriorityFilter, actionsSearchTerm])
    
    // Corrective Actions pagination logic
  const totalActionsPages = Math.ceil(filteredAndSortedActions.length / actionsItemsPerPage)
    const actionsStartIndex = (actionsCurrentPage - 1) * actionsItemsPerPage
    const actionsEndIndex = actionsStartIndex + actionsItemsPerPage
  const paginatedActions = filteredAndSortedActions.slice(actionsStartIndex, actionsEndIndex)
    
  // Reset corrective actions to first page when filters change
    useEffect(() => {
      setActionsCurrentPage(1)
  }, [actionsStatusFilter, actionsPriorityFilter, actionsSearchTerm])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your audit assignments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/employee-audits")} className="w-full">
              Return to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">Access Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-4">
              Your temporary access link has expired. Please request a new one.
            </p>
            <Button onClick={() => router.push("/employee-audits")} className="w-full">
              Request New Access
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!auditData) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "欠落":
        return "bg-red-100 text-red-800"
      case "返却済":
        return "bg-green-100 text-green-800"
      case "廃止":
        return "bg-gray-100 text-gray-800"
      case "利用中":
        return "bg-blue-100 text-blue-800"
      case "保管中":
        return "bg-indigo-100 text-indigo-800"
      case "貸出中":
        return "bg-purple-100 text-purple-800"
      case "故障中":
        return "bg-red-100 text-red-800"
      case "利用予約":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "欠落":
        return <AlertCircle className="w-4 h-4" />
      case "返却済":
        return <CheckCircle className="w-4 h-4" />
      case "廃止":
        return <Info className="w-4 h-4" />
      case "利用中":
        return <User className="w-4 h-4" />
      case "保管中":
        return <FileText className="w-4 h-4" />
      case "貸出中":
        return <MapPin className="w-4 h-4" />
      case "故障中":
        return <XCircle className="w-4 h-4" />
      case "利用予約":
        return <Clock className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
      {/* Main Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Dashboard</h1>
                <p className="text-lg text-gray-600">Welcome back, {auditData.employee.name}</p>
              </div>
            </div>
            
            {/* Audit Plan Information */}
            {selectedPlan && (
              <div className="flex flex-col">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedPlan?.name}</h2>
                  <div className="flex items-center gap-4 text-gray-500 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {selectedPlan?.due_date ? new Date(selectedPlan?.due_date).toLocaleDateString() : 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
        
        {/* Role Information */}
        {/* {userRole && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Employee Role
                </h3>
                <p className="text-sm text-blue-800">
                  {userRole.description}
                </p>

              </div>
            </div>
          </div>
        )} */}
          
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center p-6 rounded-md border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">{filteredAssets.length || 0}</div>
              <div className="text-sm font-medium text-gray-600">
                {userRole?.isAuditor ? 'Total Assets' : 'My Assets'}
              </div>
            </div>
            <div className="text-center p-6 rounded-md border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {filteredAssets.filter(asset => asset.audit_status).length}
              </div>
              <div className="text-sm font-medium text-gray-600">Assets Audited</div>
            </div>
            <div className="text-center p-6 rounded-md border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {filteredAssets.length > 0 ? Math.round((filteredAssets.filter(asset => asset.audit_status).length / filteredAssets.length) * 100) : 0}%
              </div>
              <div className="text-sm font-medium text-gray-600">Audit Progress</div>
            </div>
            <div className="text-center p-6 rounded-md border border-gray-200">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {filteredAssets.filter(asset => !asset.audit_status).length}
              </div>
              <div className="text-sm font-medium text-gray-600">Pending Audit</div>
            </div>
            <div className="text-center p-6 rounded-md border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {correctiveActions.filter(action => action.status !== 'completed').length}
              </div>
              <div className="text-sm font-medium text-gray-600">Pending Actions</div>
            </div>
          </div>
        </div>

        {/* Dual Navigation Tabs */}
        {selectedPlan && (
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="audit" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  Assets to Audit
                  <Badge variant="secondary" className="ml-2">
                    {filteredAssets.length}
                  </Badge>
                  {userRole && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                  My Assets
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="actions" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Target className="w-4 h-4" />
                  Corrective Actions
                  <Badge variant="secondary" className="ml-2">
                    {correctiveActions.filter(action => action.status !== 'completed').length}
                  </Badge>
                  {userRole && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                  My Actions
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Assets to Audit Tab */}
               <TabsContent value="audit" className="mt-6">
                 {/* Role-based Access Information */}
                 {/* {userRole && (
                   <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                     <div className="flex items-center gap-2 text-sm text-gray-700">
                       <Info className="w-4 h-4" />
                       <span>
                         {userRole.isAuditor 
                           ? `You are auditing all assets in location: ${userRole.assignedLocation || 'Unknown'}. You can see and update all assets in this location.`
                           : 'You have assets assigned to you in this audit plan. You can see and update your own assigned assets.'
                         }
                       </span>
                     </div>
                   </div>
                 )} */}
                 
                 {/* Asset Management Controls */}
                  {planAssets.length > 0 && (
                    <div className="mb-8">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        {/* Audit Status Filter Radio Buttons */}
                        {/* Audit Status Filter Radio Buttons - Available to all users */}
                          <div className="mb-6 pb-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Audit Status:</span>
                              <div className="flex flex-wrap gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="auditStatusFilter"
                                    value="all"
                                    checked={auditStatusFilter === "all"}
                                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">All Assets</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="auditStatusFilter"
                                    value="audited"
                                    checked={auditStatusFilter === "audited"}
                                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Audited</span>
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {planAssets.filter(asset => asset.audit_status).length}
                                  </Badge>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="auditStatusFilter"
                                    value="pending"
                                    checked={auditStatusFilter === "pending"}
                                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Pending Audit</span>
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {planAssets.filter(asset => !asset.audit_status).length}
                                  </Badge>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="auditStatusFilter"
                                    value="owned"
                                    checked={auditStatusFilter === "owned"}
                                    onChange={(e) => setAuditStatusFilter(e.target.value)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">Owned by Me</span>
                                  <Badge variant="secondary" className="ml-1 text-xs">
                                    {planAssets.filter(asset => asset.current_user === auditData?.employee.name).length}
                                  </Badge>
                                </label>
                              </div>
                            </div>
                          </div>

                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                          <div className="flex-1 space-y-4 lg:space-y-0 lg:space-x-4 lg:flex lg:items-center">
                            {/* Search */}
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                              <Input
                                placeholder="Search assets by type, model, user, or location..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full lg:w-80 h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                              />
                            </div>
                            
                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger className="w-full lg:w-48 h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                                <SelectValue placeholder="Filter by status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="欠落">欠落 (Missing)</SelectItem>
                                <SelectItem value="返却済">返却済 (Returned)</SelectItem>
                                <SelectItem value="廃止">廃止 (Abolished)</SelectItem>
                                <SelectItem value="利用中">利用中 (In Use)</SelectItem>
                                <SelectItem value="保管中">保管中 (In Storage)</SelectItem>
                                <SelectItem value="貸出中">貸出中 (On Loan)</SelectItem>
                                <SelectItem value="故障中">故障中 (Broken)</SelectItem>
                                <SelectItem value="利用予約">利用予約 (Reserved for Use)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                         
                                                   <div className="flex gap-3">
                                                         <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setSearchTerm("")
                                 setStatusFilter("all")
                                 setAuditStatusFilter("all")
                                 setCurrentPage(1)
                               }}
                               className="flex items-center gap-2 h-11 px-4 border-gray-200 hover:border-red-300 hover:bg-red-50"
                             >
                               <XCircle className="w-4 h-4" />
                               Clear Filters
                             </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={exportAuditReport}
                              className="flex items-center gap-2 h-11 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                            >
                              <Download className="w-4 h-4" />
                              Export Report
                            </Button>
                            
                            {selectedAssets.size > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowStatusModal(true)}
                                className="flex items-center gap-2 h-11 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                              >
                                <Edit3 className="w-4 h-4" />
                                Bulk Update ({selectedAssets.size})
                              </Button>
                            )}
                          </div>
                       </div>
                       
                       {/* Bulk Actions */}
                       {selectedAssets.size > 0 && (
                         <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                           <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                             <div className="flex items-center gap-4">
                               <span className="text-sm font-semibold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                                 {selectedAssets.size} asset{selectedAssets.size !== 1 ? 's' : ''} selected
                               </span>
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => setSelectedAssets(new Set())}
                                 className="border-blue-200 text-blue-700 hover:bg-blue-100"
                               >
                                 Clear Selection
                               </Button>
                             </div>
                             <div className="flex gap-3">
                               <Select onValueChange={bulkUpdateStatus}>
                                 <SelectTrigger className="w-48 h-10 border-blue-200 focus:border-blue-400 focus:ring-blue-200">
                                   <SelectValue placeholder="Update Status" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="欠落">欠落 (Missing)</SelectItem>
                                   <SelectItem value="返却済">返却済 (Returned)</SelectItem>
                                   <SelectItem value="廃止">廃止 (Abolished)</SelectItem>
                                   <SelectItem value="利用中">利用中 (In Use)</SelectItem>
                                   <SelectItem value="保管中">保管中 (In Storage)</SelectItem>
                                   <SelectItem value="貸出中">貸出中 (On Loan)</SelectItem>
                                   <SelectItem value="故障中">故障中 (Broken)</SelectItem>
                                   <SelectItem value="利用予約">利用予約 (Reserved for Use)</SelectItem>
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                                   {/* Audit Assets Section */}
                  {filteredAssets.length > 0 ? (
                    <div className="mb-8">
                      {/* Filter Summary */}
                      {(searchTerm || statusFilter !== "all" || auditStatusFilter !== "all") && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <Filter className="w-4 h-4" />
                            <span className="font-medium">Active Filters:</span>
                            {searchTerm && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                Search: "{searchTerm}"
                              </Badge>
                            )}
                            {statusFilter !== "all" && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                                Status: {statusFilter}
                              </Badge>
                            )}

                                                         <span className="text-blue-600">
                               Showing {filteredAssets.length} of {planAssets.length} assets
                               {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                             </span>
                          </div>
                        </div>
                      )}
                      
                                             <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                         <div className="flex items-center gap-3">
                           <Checkbox
                             checked={selectedAssets.size === filteredAssets.length}
                             onCheckedChange={selectAllAssets}
                             className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                           />
                           <span className="text-sm font-medium text-gray-700">Select All</span>
                         </div>
                         
                         {/* Pagination Info */}
                         <div className="flex items-center gap-4 text-sm text-gray-600">
                           <span>
                             Showing {startIndex + 1}-{Math.min(endIndex, filteredAssets.length)} of {filteredAssets.length} assets
                           </span>
                           <div className="flex items-center gap-2">
                             <span className="text-gray-500">Items per page:</span>
                             <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                               setItemsPerPage(parseInt(value))
                               setCurrentPage(1)
                             }}>
                               <SelectTrigger className="w-20 h-8">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="6">6</SelectItem>
                                 <SelectItem value="12">12</SelectItem>
                                 <SelectItem value="24">24</SelectItem>
                                 <SelectItem value="48">48</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>
                       </div>
                      
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {paginatedAssets.map((asset) => (
                         <Card key={asset.id} className="hover:shadow-lg transition-all duration-200 border-gray-200 hover:border-blue-300 group">
                           <CardHeader className="pb-4">
                             <div className="flex items-start justify-between">
                               <div className="flex items-center space-x-3">
                                 <Checkbox
                                   checked={selectedAssets.has(asset.id)}
                                   onCheckedChange={() => toggleAssetSelection(asset.id)}
                                   className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                 />
                                 <div className="flex items-center space-x-2">
                                   {getStatusIcon(asset.status)}
                                   <span className="font-semibold text-gray-900">{asset.asset_type}</span>
                                 </div>
                               </div>
                               <div className="flex flex-col items-end gap-2">
                                 <Badge className={`${getStatusColor(asset.status)} font-medium px-3 py-1`}>
                                   {asset.status}
                                 </Badge>
                                 <Badge className={`${asset.audit_status ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} font-medium px-2 py-1 text-xs`}>
                                   {asset.audit_status ? 'Audited' : 'Pending Audit'}
                                 </Badge>
                                 {asset.resolved && (
                                   <Badge className="bg-purple-100 text-purple-800 font-medium px-2 py-1 text-xs">
                                     ✓ Resolved
                                   </Badge>
                                 )}
                               </div>
                             </div>
                             <CardDescription className="text-sm text-gray-600 pl-8">
                               Model: {asset.model}
                             </CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-4 pl-8">
                             <div className="grid grid-cols-2 gap-4 text-sm">
                               <div className="flex items-center space-x-2">
                                 <User className="w-4 h-4 text-gray-500" />
                                 <span className="text-gray-700">User: {asset.current_user || 'Not specified'}</span>
                               </div>
                               <div className="flex items-center space-x-2">
                                 <MapPin className="w-4 h-4 text-gray-500" />
                                 <span className="text-gray-700">Location: {asset.original_location || 'Not specified'}</span>
                               </div>
                             </div>
                             
                             {/* Change Alerts */}
                             {asset.original_user && asset.current_user && asset.original_user !== asset.current_user && (
                               <Alert className="bg-amber-50 border-amber-200">
                                 <AlertTriangle className="w-4 h-4 text-amber-600" />
                                 <AlertDescription className="text-amber-800">
                                   User changed from <span className="font-semibold">{asset.original_user}</span> to <span className="font-semibold">{asset.current_user}</span>
                                 </AlertDescription>
                               </Alert>
                             )}
                             
                             {asset.original_location && asset.current_location && asset.original_location !== asset.current_location && (
                               <Alert className="bg-amber-50 border-amber-200">
                                 <AlertTriangle className="w-4 h-4 text-amber-600" />
                                 <AlertDescription className="text-amber-800">
                                   Location changed from <span className="font-semibold">{asset.original_location}</span> to <span className="font-semibold">{asset.current_location}</span>
                                 </AlertDescription>
                               </Alert>
                             )}
                             
                             {asset.notes && (
                               <div className="text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                                 <span className="font-medium text-gray-700">Notes: </span>
                                 <span className="text-gray-600">{asset.notes}</span>
                               </div>
                             )}
                             
                             {asset.audited_at && (
                               <div className="text-sm text-gray-500 flex items-center gap-2">
                                 <Calendar className="w-4 h-4" />
                                 <span>Last audited: {new Date(asset.audited_at).toLocaleDateString()}</span>
                               </div>
                             )}
                             
                             <div className="flex gap-3 pt-2">
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => openAssetModal(asset)}
                                 className="flex-1 h-10 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                               >
                                 <Eye className="w-4 h-4 mr-2" />
                                 View Details
                               </Button>
                               <Button
                                 variant="default"
                                 size="sm"
                                 onClick={() => openStatusModal(asset)}
                                 disabled={asset.resolved}
                                 className={`flex-1 h-10 ${
                                   asset.resolved 
                                     ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                                     : 'bg-blue-600 hover:bg-blue-700'
                                 }`}
                               >
                                 <Edit3 className="w-4 h-4 mr-2" />
                                 {asset.resolved ? 'Already Resolved' : 'Update Status'}
                               </Button>
                             </div>
                           </CardContent>
                         </Card>
                                                ))}
                       </div>
                       
                       {/* Pagination Controls */}
                       {totalPages > 1 && (
                         <div className="mt-8 flex items-center justify-center">
                           <div className="flex items-center gap-2">
                             {/* First Page */}
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setCurrentPage(1)}
                               disabled={currentPage === 1}
                               className="h-9 w-9 p-0"
                             >
                               <ChevronsLeft className="h-4 w-4" />
                             </Button>
                             
                             {/* Previous Page */}
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setCurrentPage(currentPage - 1)}
                               disabled={currentPage === 1}
                               className="h-9 w-9 p-0"
                             >
                               <ChevronLeft className="h-4 w-4" />
                             </Button>
                             
                             {/* Page Numbers */}
                             <div className="flex items-center gap-1">
                               {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                 let pageNum
                                 if (totalPages <= 5) {
                                   pageNum = i + 1
                                 } else if (currentPage <= 3) {
                                   pageNum = i + 1
                                 } else if (currentPage >= totalPages - 2) {
                                   pageNum = totalPages - 4 + i
                                 } else {
                                   pageNum = currentPage - 2 + i
                                 }
                                 
                                 return (
                                   <Button
                                     key={pageNum}
                                     variant={currentPage === pageNum ? "default" : "outline"}
                                     size="sm"
                                     onClick={() => setCurrentPage(pageNum)}
                                     className="h-9 w-9 p-0"
                                   >
                                     {pageNum}
                                   </Button>
                                 )
                               })}
                             </div>
                             
                             {/* Next Page */}
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setCurrentPage(currentPage + 1)}
                               disabled={currentPage === totalPages}
                               className="h-9 w-9 p-0"
                             >
                               <ChevronRight className="h-4 w-4" />
                             </Button>
                             
                             {/* Last Page */}
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setCurrentPage(totalPages)}
                               disabled={currentPage === totalPages}
                               className="h-9 w-9 p-0"
                             >
                               <ChevronsRight className="h-4 w-4" />
                             </Button>
                           </div>
                         </div>
                       )}
                     </div>
                   ) : planAssets.length > 0 ? (
                   <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                     <Search className="mx-auto h-12 w-12 text-gray-400" />
                     <h3 className="mt-2 text-sm font-medium text-gray-900">No Assets Found</h3>
                     <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or status filter.</p>
                   </div>
                 ) : (
                   <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                     <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                     <h3 className="mt-2 text-sm font-medium text-gray-900">All Caught Up!</h3>
                     <p className="mt-1 text-sm text-gray-500">This audit plan has no assets to audit at this time.</p>
                   </div>
                 )}
               </TabsContent>

                             {/* Corrective Actions Tab */}
               <TabsContent value="actions" className="mt-6">
                 {/* Role-based Access Information */}
                 {/* {userRole && (
                   <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                     <div className="flex items-center gap-2 text-sm text-gray-700">
                       <Info className="w-4 h-4" />
                       <span>
                         You can see corrective actions assigned to you for this audit plan.
                       </span>
                     </div>
                   </div>
                 )} */}
                 
                 {/* Summary Cards */}
                 {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <div className="flex items-center">
                       <Target className="h-5 w-5 text-blue-600 mr-2" />
                       <div>
                         <p className="text-sm font-medium text-blue-900">Total Actions</p>
                         <p className="text-2xl font-bold text-blue-700">{correctiveActions.length}</p>
                       </div>
                     </div>
                   </div>
                   <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                     <div className="flex items-center">
                       <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                       <div>
                         <p className="text-sm font-medium text-yellow-900">Pending</p>
                         <p className="text-2xl font-bold text-yellow-700">{correctiveActions.filter(a => a.status === 'pending').length}</p>
                       </div>
                     </div>
                   </div>
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                     <div className="flex items-center">
                       <Clock className="h-5 w-5 text-blue-600 mr-2" />
                       <div>
                         <p className="text-sm font-medium text-blue-900">In Progress</p>
                         <p className="text-2xl font-bold text-blue-700">{correctiveActions.filter(a => a.status === 'in_progress').length}</p>
                       </div>
                     </div>
                   </div>
                   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                     <div className="flex items-center">
                       <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                       <div>
                         <p className="text-sm font-medium text-green-900">Completed</p>
                         <p className="text-2xl font-bold text-green-700">{correctiveActions.filter(a => a.status === 'completed').length}</p>
                       </div>
                     </div>
                   </div>
                 </div> */}

                                   {correctiveActions.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      {/* Pagination Summary */}
                      {totalActionsPages > 1 && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Page {actionsCurrentPage} of {totalActionsPages} 
                              ({correctiveActions.length} total actions)
                            </span>
                            <span className="text-gray-500">
                              Showing {actionsStartIndex + 1}-{Math.min(actionsEndIndex, correctiveActions.length)} actions
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Search and Filter Bar */}
                     <div className="p-4 border-b border-gray-200">
                       <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                         <div className="flex-1 flex flex-col sm:flex-row gap-3">
                           <div className="relative">
                             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                             <Input
                               placeholder="Search actions by issue, action, or asset ID..."
                               className="pl-10 w-full sm:w-64 h-9"
                               value={actionsSearchTerm}
                               onChange={(e) => setActionsSearchTerm(e.target.value)}
                             />
                           </div>
                           <Select value={actionsStatusFilter} onValueChange={setActionsStatusFilter}>
                             <SelectTrigger className="w-full sm:w-40 h-9">
                               <SelectValue placeholder="Filter by status" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Statuses</SelectItem>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="in_progress">In Progress</SelectItem>
                               <SelectItem value="completed">Completed</SelectItem>
                             </SelectContent>
                           </Select>
                           <Select value={actionsPriorityFilter} onValueChange={setActionsPriorityFilter}>
                             <SelectTrigger className="w-full sm:w-40 h-9">
                               <SelectValue placeholder="Filter by priority" />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="all">All Priorities</SelectItem>
                               <SelectItem value="low">Low</SelectItem>
                               <SelectItem value="medium">Medium</SelectItem>
                               <SelectItem value="high">High</SelectItem>
                               <SelectItem value="critical">Critical</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                         <div className="flex gap-2">
                           <Button variant="outline" size="sm" className="h-9 px-3">
                             <Download className="w-4 h-4 mr-2" />
                             Export
                           </Button>
                         </div>
                       </div>
                     </div>
                     
                     <div className="overflow-x-auto">
                       <table className="w-full min-w-[800px]">
                         <thead className="bg-gray-50 border-b border-gray-200">
                           <tr>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Asset</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Issue</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Action</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Priority</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Due Date</th>
                             <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Actions</th>
                           </tr>
                         </thead>
                                                   <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedActions.map((action) => (
                             <tr key={action.id} className={`hover:bg-gray-50 ${
                               action.status === 'completed' ? 'bg-green-50/30' : 
                               action.status === 'in_progress' ? 'bg-blue-50/30' : 
                               'bg-yellow-50/30'
                             }`}>
                               <td className="px-4 py-3">
                                 <div className="flex items-center">
                                   <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                                     <Target className="h-4 w-4 text-red-600" />
                                   </div>
                                   <div className="ml-3 min-w-0">
                                     <div className="text-sm font-medium text-gray-900 font-mono truncate">{action.asset.asset_id}</div>
                                     <div className="text-xs text-gray-500 truncate">{action.asset.model}</div>
                                   </div>
                                 </div>
                               </td>
                               <td className="px-4 py-3">
                                 <div className="text-sm text-gray-900 max-w-full">
                                   <div className="overflow-hidden" style={{ 
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical'
                                   }}>
                                     {action.issue}
                                   </div>
                                 </div>
                               </td>
                               <td className="px-4 py-3">
                                 <div className="text-sm text-gray-900 max-w-full">
                                   <div className="overflow-hidden" style={{ 
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical'
                                   }}>
                                     {action.action}
                                   </div>
                                 </div>
                               </td>
                               <td className="px-4 py-3">
                                 <Badge variant={getActionPriorityColor(action.priority)} className="text-xs">
                                   {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
                                 </Badge>
                               </td>
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                   {getActionStatusIcon(action.status)}
                                   <Badge variant={getActionStatusColor(action.status)} className="text-xs">
                                     {action.status.replace('_', ' ').charAt(0).toUpperCase() + action.status.replace('_', ' ').slice(1)}
                                   </Badge>
                                 </div>
                               </td>
                               <td className="px-4 py-3 text-sm text-gray-900">
                                 {new Date(action.due_date).toLocaleDateString()}
                               </td>
                               <td className="px-4 py-3">
                                 {action.status === 'completed' ? (
                                   <div className="flex items-center gap-2">
                                     <CheckCircle className="h-4 w-4 text-green-600" />
                                     <span className="text-xs text-green-600 font-medium">Completed</span>
                                   </div>
                                 ) : (
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => openActionModal(action)}
                                   className="h-7 px-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                 >
                                   <Edit3 className="h-3 w-3" />
                                 </Button>
                                 )}
                               </td>
                             </tr>
                           ))}
                                                   </tbody>
                        </table>
                      </div>
                      
                      {/* Corrective Actions Pagination Controls */}
                      {totalActionsPages > 1 && (
                        <div className="px-4 py-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>
                                Showing {actionsStartIndex + 1}-{Math.min(actionsEndIndex, correctiveActions.length)} of {correctiveActions.length} actions
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Items per page:</span>
                                <Select value={actionsItemsPerPage.toString()} onValueChange={(value) => {
                                  setActionsItemsPerPage(parseInt(value))
                                  setActionsCurrentPage(1)
                                }}>
                                  <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* First Page */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActionsCurrentPage(1)}
                                disabled={actionsCurrentPage === 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              
                              {/* Previous Page */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActionsCurrentPage(actionsCurrentPage - 1)}
                                disabled={actionsCurrentPage === 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              
                              {/* Page Numbers */}
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalActionsPages) }, (_, i) => {
                                  let pageNum
                                  if (totalActionsPages <= 5) {
                                    pageNum = i + 1
                                  } else if (actionsCurrentPage <= 3) {
                                    pageNum = i + 1
                                  } else if (actionsCurrentPage >= totalActionsPages - 2) {
                                    pageNum = totalActionsPages - 4 + i
                                  } else {
                                    pageNum = actionsCurrentPage - 2 + i
                                  }
                                  
                                  return (
                                    <Button
                                      key={pageNum}
                                      variant={actionsCurrentPage === pageNum ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setActionsCurrentPage(pageNum)}
                                      className="h-8 w-8 p-0"
                                    >
                                      {pageNum}
                                    </Button>
                                  )
                                })}
                              </div>
                              
                              {/* Next Page */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActionsCurrentPage(actionsCurrentPage + 1)}
                                disabled={actionsCurrentPage === totalActionsPages}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              
                              {/* Last Page */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActionsCurrentPage(totalActionsPages)}
                                disabled={actionsCurrentPage === totalActionsPages}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                                   ) : (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                      <Target className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No Corrective Actions</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {correctiveActions.length === 0 
                          ? "No corrective actions have been assigned to you yet."
                          : "No actions match your current filters. Try adjusting your search criteria."
                        }
                      </p>
                    </div>
                  )}
               </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Loading State */}
        {selectedPlan && isLoading && (
          <div className="mb-8">
            <Card className="text-center py-12 bg-white border-0 shadow-sm">
              <CardContent className="p-0">
                <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Loading Audit Assets</h3>
                <p className="text-gray-600">Please wait while we load the assets for {selectedPlan?.name}</p>
              </CardContent>
            </Card>
          </div>
        )}

        
      </div>

      {/* Status Update Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Update Asset Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for {selectedAsset?.asset_type} - {selectedAsset?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
              <Select 
                value={statusUpdateData.status} 
                onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                                        <SelectContent>
                          <SelectItem value="欠落">欠落 (Missing)</SelectItem>
                          <SelectItem value="返却済">返却済 (Returned)</SelectItem>
                          <SelectItem value="廃止">廃止 (Abolished)</SelectItem>
                          <SelectItem value="利用中">利用中 (In Use)</SelectItem>
                          <SelectItem value="保管中">保管中 (In Storage)</SelectItem>
                          <SelectItem value="貸出中">貸出中 (On Loan)</SelectItem>
                          <SelectItem value="故障中">故障中 (Broken)</SelectItem>
                          <SelectItem value="利用予約">利用予約 (Reserved for Use)</SelectItem>
                        </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes (Optional)</label>
              <Textarea
                placeholder="Add any additional notes or findings..."
                value={statusUpdateData.notes}
                onChange={(e) => setStatusUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            
                        {/* User Assignment Section - Only show for assets without current user */}
            {!selectedAsset?.current_user && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  {/* <h4 className="text-sm font-semibold text-gray-700 mb-3">Assign User to Asset</h4> */}
                  <div className="space-y-3">
                    {/* <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-800">
                            This asset currently has no user assigned. You can assign it to an employee during the audit.
                          </p>
                        </div>
                      </div>
                    </div> */}
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Assign to User</label>
                      <Select 
                        value={statusUpdateData.reassignUserId || ""} 
                        onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, reassignUserId: value || undefined }))}
                      >
                        <SelectTrigger className="h-11 border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                          <SelectValue placeholder="Select an employee to assign" />
                        </SelectTrigger>
                                              <SelectContent>
                        {availableEmployees.length > 0 ? (
                          availableEmployees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.email})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-employees" disabled>
                            No employees available for this location
                          </SelectItem>
                        )}
                      </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Select an employee to assign this asset to
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* User Information Display - Show for assets with current user */}
            {/* {selectedAsset?.current_user && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">User Assignment</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500">Original User (Audit Plan Creation)</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset?.original_user || 'No user assigned'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Current User</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset?.current_user || 'No user assigned'}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-800">
                            This asset is already assigned to a user. User reassignment is not available for assets with existing assignments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )} */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdating}
                className="h-10 px-6 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={!statusUpdateData.status || isUpdating}
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
                {statusUpdateData.reassignUserId 
                  ? 'Update Status & Assign User' 
                  : 'Update Status'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Details Modal */}
      <Dialog open={showAssetModal} onOpenChange={setShowAssetModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Asset Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about {selectedAsset?.asset_type} - {selectedAsset?.model}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Asset Type</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.asset_type}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Model</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.model}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Original User</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.original_user || 'No user assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Current User</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.current_user || 'No user assigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Original Location</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.original_location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Location</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">{selectedAsset.current_location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                  <Badge className={`${getStatusColor(selectedAsset.status)} font-medium px-3 py-2`}>
                    {selectedAsset.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Resolved</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedAsset.resolved ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Audit Status</label>
                  <Badge className={`${selectedAsset.audit_status ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} font-medium px-3 py-2`}>
                    {selectedAsset.audit_status ? 'Audited' : 'Pending Audit'}
                  </Badge>
                </div>
              </div>
              
              {selectedAsset.notes && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {selectedAsset.notes}
                  </p>
                </div>
              )}
              
              {selectedAsset.audited_at && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Last Audited</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {new Date(selectedAsset.audited_at).toLocaleString()}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowAssetModal(false)}
                  className="h-10 px-6 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowAssetModal(false)
                    openStatusModal(selectedAsset)
                  }}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700"
                >
                  Update Status
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Corrective Action Status Update Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Update Corrective Action Status</DialogTitle>
            <DialogDescription>
              Update the status and add notes for the selected corrective action
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Asset</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {selectedAction.asset.asset_id} - {selectedAction.asset.model}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Priority</label>
                  <Badge variant={getActionPriorityColor(selectedAction.priority)}>
                    {selectedAction.priority.charAt(0).toUpperCase() + selectedAction.priority.slice(1)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Current Status</label>
                  <Badge variant={getActionStatusColor(selectedAction.status)}>
                    {selectedAction.status.replace('_', ' ').charAt(0).toUpperCase() + selectedAction.status.replace('_', ' ').slice(1)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Due Date</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {new Date(selectedAction.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Issue</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {selectedAction.issue}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Required Action</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {selectedAction.action}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">New Status</label>
                <Select 
                  value={actionUpdateData.status} 
                  onValueChange={(value) => setActionUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Notes</label>
                <Textarea
                  value={actionUpdateData.notes}
                  onChange={(e) => setActionUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about the current status or progress..."
                  rows={3}
                  className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowActionModal(false)}
                  className="h-10 px-6 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleActionStatusUpdate}
                  disabled={isUpdatingAction || !actionUpdateData.status}
                  className="h-10 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isUpdatingAction ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Status'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
