import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
} from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuditAPI, type AuditLog } from "@/lib/api/audit";

type UserRole = "HR_Admin" | "HR_Manager" | "manager" | "employee";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "failure":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "success":
      return <CheckCircle2 className="size-4" />;
    case "failure":
      return <XCircle className="size-4" />;
    case "warning":
      return <AlertTriangle className="size-4" />;
    default:
      return <Activity className="size-4" />;
  }
}

function getActionIcon(action: string) {
  const lowerAction = action.toLowerCase();
  if (lowerAction.includes("create") || lowerAction.includes("add")) {
    return <FileText className="size-4 text-green-600" />;
  } else if (lowerAction.includes("update") || lowerAction.includes("edit")) {
    return <Activity className="size-4 text-blue-600" />;
  } else if (lowerAction.includes("delete") || lowerAction.includes("remove")) {
    return <XCircle className="size-4 text-red-600" />;
  } else if (lowerAction.includes("approve")) {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  } else if (lowerAction.includes("reject")) {
    return <XCircle className="size-4 text-rose-600" />;
  }
  return <Activity className="size-4 text-muted-foreground" />;
}

export default function AuditPage() {
  const { getDecodedIdToken } = useAsgardeo();
  const auditAPI = useAuditAPI();
  const { toast } = useToast();

  // State
  const [currentRole, setCurrentRole] = useState<UserRole>("employee");
  const [auditEvents, setAuditEvents] = useState<AuditLog[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Determine user role
  useEffect(() => {
    const determineRole = async () => {
      try {
        const decodedToken = await getDecodedIdToken();
        const groups = (decodedToken?.groups as string[]) || [];

        if (
          groups.includes("HR_Administrators") ||
          groups.includes("HR_Admin") ||
          groups.includes("HR-Administrators")
        ) {
          setCurrentRole("HR_Admin");
        } else if (
          groups.includes("HR_Managers") ||
          groups.includes("HR_Manager") ||
          groups.includes("HR-Managers")
        ) {
          setCurrentRole("HR_Manager");
        } else if (
          groups.includes("Managers") ||
          groups.includes("manager") ||
          groups.includes("Manager")
        ) {
          setCurrentRole("manager");
        } else {
          setCurrentRole("employee");
        }
      } catch (error) {
        console.error("Error determining role:", error);
      }
    };

    determineRole();
  }, [getDecodedIdToken]);

  // Load audit events from API
  const loadAuditEvents = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const filters: any = {
        offset: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };

      if (filterLogType && filterLogType !== "all") {
        filters.log_type = filterLogType;
      }

      const response = await auditAPI.listAuditLogs(filters);
      setAuditEvents(response.items);
      setTotalRecords(response.total);
    } catch (error: any) {
      console.error("Failed to load audit logs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuditEvents();
  }, [currentPage, filterLogType]);

  // Apply local filters (search and status)
  useEffect(() => {
    let filtered = [...auditEvents];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.action.toLowerCase().includes(query) ||
          event.entity_type.toLowerCase().includes(query) ||
          event.user_id.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter((event) => event.status === filterStatus);
    }

    setFilteredEvents(filtered);
  }, [auditEvents, searchQuery, filterStatus]);

  const handleRefresh = () => {
    setCurrentPage(1);
    loadAuditEvents(true);
  };

  const stats = {
    total: totalRecords,
    success: auditEvents.filter((e) => e.status === "success").length,
    failed: auditEvents.filter((e) => e.status === "failure").length,
    warning: auditEvents.filter((e) => e.status === "warning").length,
  };

  const hasAuditAccess =
    currentRole === "HR_Admin" ||
    currentRole === "HR_Manager" ||
    currentRole === "manager";

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  if (!hasAuditAccess) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Audit Logs"
          description="Access denied"
          icon={<Shield className="size-8" />}
        />
        <PageContent>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="size-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Access Restricted
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  You don't have permission to view audit logs. This feature is
                  available to HR and Manager roles only.
                </p>
              </div>
            </CardContent>
          </Card>
        </PageContent>
      </DashboardLayout>
    );
  }

  if (isLoading && auditEvents.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Audit Logs"
          description="System activity and compliance tracking"
          icon={<Shield className="size-8" />}
        />
        <PageContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        description="System activity and compliance tracking"
        icon={<Shield className="size-8" />}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </PageHeader>

      <PageContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Events
                </CardTitle>
                <Activity className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Successful
                </CardTitle>
                <CheckCircle2 className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.success}</div>
                <p className="text-xs text-muted-foreground">Current page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">Current page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnings</CardTitle>
                <AlertTriangle className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.warning}</div>
                <p className="text-xs text-muted-foreground">Current page</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Events</CardTitle>
              <CardDescription>
                View and filter system audit logs and activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by action, entity, or user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={filterLogType}
                    onValueChange={setFilterLogType}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="size-4 mr-2" />
                      <SelectValue placeholder="Log Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="leave_request">
                        Leave Request
                      </SelectItem>
                      <SelectItem value="leave_approval">
                        Leave Approval
                      </SelectItem>
                      <SelectItem value="attendance">Attendance</SelectItem>
                      <SelectItem value="employee_management">
                        Employee
                      </SelectItem>
                      <SelectItem value="user_management">User</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failure">Failed</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Events Table */}
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Shield className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || filterStatus !== "all"
                      ? "No logs match your filters"
                      : "No audit logs available yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="size-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">
                                  {format(
                                    new Date(event.timestamp),
                                    "MMM dd, yyyy",
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(event.timestamp),
                                    "HH:mm:ss",
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(event.action)}
                              <span className="font-medium">
                                {event.action}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {event.entity_type}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {event.entity_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-muted-foreground" />
                              <span className="text-sm">{event.user_id}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-xs"
                            >
                              {event.service_name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`gap-1 ${getStatusBadgeClass(event.status)}`}
                            >
                              {getStatusIcon(event.status)}
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm line-clamp-2 max-w-xs">
                              {event.description}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalRecords)} of{" "}
                    {totalRecords} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          );
                        },
                      )}
                      {totalPages > 5 && (
                        <span className="text-muted-foreground px-2">...</span>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </DashboardLayout>
  );
}
