"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/context/auth-context"
import { graphqlQuery } from "@/lib/graphql-client"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/hooks/use-i18n"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { Loader, Calendar as CalendarIcon, Search, Filter, Eye, User, Clock, Globe, Monitor, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: any;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityLogsResponse {
  data: ActivityLog[];
  paginatorInfo: {
    currentPage: number;
    lastPage: number;
    total: number;
    hasMorePages: boolean;
  };
}

export default function ActivityLogsClientPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  // Dialog state
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Available actions for filter
  const availableActions = useMemo(() => {
    const actions = [...new Set(activityLogs.map(log => log.action))];
    return actions.sort();
  }, [activityLogs]);

  // Available users for filter
  const availableUsers = useMemo(() => {
    const users = [...new Set(activityLogs.map(log => log.user.name))];
    return users.sort();
  }, [activityLogs]);

  // Fetch activity logs
  const fetchActivityLogs = async (page: number = 1) => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const variables: any = {
        first: 20,
        page: page,
      };

      if (searchTerm) {
        variables.action = searchTerm;
      }
      if (actionFilter && actionFilter !== 'all') {
        variables.action = actionFilter;
      }
      if (userFilter && userFilter !== 'all') {
        const user = availableUsers.find(u => u === userFilter);
        if (user) {
          const userLog = activityLogs.find(log => log.user.name === user);
          if (userLog) {
            variables.user_id = userLog.user.id;
          }
        }
      }
      if (dateFrom) {
        variables.date_from = format(dateFrom, 'yyyy-MM-dd');
      }
      if (dateTo) {
        variables.date_to = format(dateTo, 'yyyy-MM-dd');
      }

      const query = `
        query GetActivityLogs(
          $first: Int
          $page: Int
          $user_id: ID
          $action: String
          $date_from: Date
          $date_to: Date
        ) {
          activityLogs(
            first: $first
            page: $page
            user_id: $user_id
            action: $action
            date_from: $date_from
            date_to: $date_to
          ) {
            data {
              id
              action
              description
              ip_address
              user_agent
              metadata
              created_at
              user {
                id
                name
                email
              }
            }
            paginatorInfo {
              currentPage
              lastPage
              total
              hasMorePages
            }
          }
        }
      `;

      const result = await graphqlQuery(query, variables);

      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        toast({
          title: "Error",
          description: "Failed to fetch activity logs",
          variant: "destructive",
        });
        return;
      }

      if (result.data?.activityLogs) {
        const logs = result.data.activityLogs.data;
        const paginatorInfo = result.data.activityLogs.paginatorInfo;

        // Always replace the logs for proper pagination
        setActivityLogs(logs);

        setCurrentPage(paginatorInfo.currentPage);
        setTotalPages(paginatorInfo.lastPage);
        setTotal(paginatorInfo.total);
        setHasMorePages(paginatorInfo.hasMorePages);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Go to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && !isLoading) {
      fetchActivityLogs(page);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchActivityLogs(1);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setActionFilter("all");
    setUserFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
    fetchActivityLogs(1);
  };

  // View log details
  const viewLogDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setIsDetailDialogOpen(true);
  };

  // Format action for display
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get action badge variant
  const getActionBadgeVariant = (action: string) => {
    if (action.includes('login')) return 'default';
    if (action.includes('create')) return 'secondary';
    if (action.includes('update')) return 'outline';
    if (action.includes('delete')) return 'destructive';
    return 'secondary';
  };

  // Initial load
  useEffect(() => {
    if (!authLoading && user) {
      fetchActivityLogs(1);
    }
  }, [authLoading, user]);

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Admin Activity Logs</CardTitle>
          <CardDescription>
            Monitor user activities and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search actions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {availableActions.map(action => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {availableUsers.map(user => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters} className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                Apply
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>

          {/* Activity Logs Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>Loading activity logs...</p>
                    </TableCell>
                  </TableRow>
                ) : activityLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p>No activity logs found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  activityLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-sm text-gray-500">{log.user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell>
                        {log.ip_address && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="font-mono text-sm">{log.ip_address}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewLogDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalCount={total}
                itemsPerPage={20}
                onPageChange={goToPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <p className="font-medium">{selectedLog.user.name}</p>
                  <p className="text-sm text-gray-500">{selectedLog.user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {formatAction(selectedLog.action)}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="font-mono text-sm">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm">
                    {format(new Date(selectedLog.created_at), 'MMM dd, yyyy HH:mm:ss')}
                  </p>
                </div>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-sm font-mono break-all">{selectedLog.user_agent}</p>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Metadata</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
