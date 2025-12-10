// Audit Logs Page
// View and search audit events for the organization
// Access based on role: HR_Admin sees all, HR_Manager sees below, Manager sees employees

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
  Shield,
  Search,
  Filter,
  Download,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  FileText,
  Settings,
  Eye,
} from "lucide-react";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
  PageSection,
} from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { format, formatDistanceToNow, parseISO } from "date-fns";

type UserRole = "HR_Admin" | "HR_Manager" | "manager" | "employee";

interface AuditEvent {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  status: "success" | "failed" | "warning";
  ip_address: string;
  details: string;
  metadata?: Record<string, unknown>;
}

// Status badge styling
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "success":
      return "status-success";
    case "failed":
      return "status-error";
    case "warning":
      return "status-warning";
    default:
      return "status-neutral";
  }
}

// Action icon mapping
function getActionIcon(action: string) {
  if (action.includes("login") || action.includes("auth")) {
    return <Shield className="size-4" />;
  }
  if (action.includes("create") || action.includes("add")) {
    return <FileText className="size-4" />;
  }
  if (action.includes("update") || action.includes("edit")) {
    return <Settings className="size-4" />;
  }
  if (action.includes("delete") || action.includes("remove")) {
    return <XCircle className="size-4" />;
  }
  if (action.includes("view") || action.includes("read")) {
    return <Eye className="size-4" />;
  }
  return <Activity className="size-4" />;
}

export default function AuditPage() {
  const { getDecodedIdToken } = useAsgardeo();

  // State
  const [currentRole, setCurrentRole] = useState<UserRole>("employee");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // Load audit events (mock data for now)
  useEffect(() => {
    const loadAuditEvents = async () => {
      setIsLoading(true);

      // Mock data - replace with actual API call
      const mockEvents: AuditEvent[] = [
        {
          id: "1",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          user_id: "user_001",
          user_name: "John Smith",
          action: "user.login",
          resource: "Authentication",
          status: "success",
          ip_address: "192.168.1.100",
          details: "Successful login from Chrome browser",
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user_id: "user_002",
          user_name: "Jane Doe",
          action: "employee.create",
          resource: "Employee Management",
          status: "success",
          ip_address: "192.168.1.101",
          details: "Created new employee record for Alex Johnson",
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          user_id: "user_003",
          user_name: "Mike Wilson",
          action: "leave.approve",
          resource: "Leave Management",
          status: "success",
          ip_address: "192.168.1.102",
          details: "Approved annual leave request for Sarah Brown",
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          user_id: "user_001",
          user_name: "John Smith",
          action: "user.update",
          resource: "User Management",
          status: "warning",
          ip_address: "192.168.1.100",
          details: "Updated user permissions - elevated access granted",
        },
        {
          id: "5",
          timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          user_id: "user_004",
          user_name: "Emily Chen",
          action: "user.login",
          resource: "Authentication",
          status: "failed",
          ip_address: "192.168.1.105",
          details: "Failed login attempt - invalid password",
        },
        {
          id: "6",
          timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
          user_id: "user_002",
          user_name: "Jane Doe",
          action: "report.view",
          resource: "Reports",
          status: "success",
          ip_address: "192.168.1.101",
          details: "Viewed salary summary report",
        },
        {
          id: "7",
          timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
          user_id: "user_005",
          user_name: "Robert Taylor",
          action: "attendance.checkin",
          resource: "Attendance",
          status: "success",
          ip_address: "192.168.1.110",
          details: "Employee checked in at 9:05 AM",
        },
      ];

      setTimeout(() => {
        setAuditEvents(mockEvents);
        setFilteredEvents(mockEvents);
        setIsLoading(false);
      }, 800);
    };

    loadAuditEvents();
  }, []);

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = auditEvents;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.user_name.toLowerCase().includes(query) ||
          event.action.toLowerCase().includes(query) ||
          event.details.toLowerCase().includes(query) ||
          event.resource.toLowerCase().includes(query),
      );
    }

    if (filterAction !== "all") {
      filtered = filtered.filter((event) =>
        event.action.toLowerCase().includes(filterAction),
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((event) => event.status === filterStatus);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, filterAction, filterStatus, auditEvents]);

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Stats
  const stats = {
    total: auditEvents.length,
    success: auditEvents.filter((e) => e.status === "success").length,
    failed: auditEvents.filter((e) => e.status === "failed").length,
    warning: auditEvents.filter((e) => e.status === "warning").length,
  };

  // Check if user has access to audit logs
  const hasAuditAccess =
    currentRole === "HR_Admin" ||
    currentRole === "HR_Manager" ||
    currentRole === "manager";

  if (!hasAuditAccess) {
    return (
      <DashboardLayout>
        <PageHeader title="Audit Logs" icon={<Shield className="size-5" />} />
        <PageContent>
          <div className="flex flex-1 items-center justify-center py-16">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You do not have permission to view audit logs. Only HR Admin,
                  HR Manager, and Manager roles can access this page.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Audit Logs"
        description="Monitor system activity and security events"
        icon={<Shield className="size-5" />}
      >
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh logs</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" className="gap-2">
            <Download className="size-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        {/* Stats Cards */}
        <PageSection delay={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-accent-blue hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Total Events
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.total}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-emerald hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Successful
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    stats.success
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-amber hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <AlertCircle className="size-4 text-amber-600" />
                  Warnings
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    stats.warning
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-rose hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <XCircle className="size-4 text-rose-600" />
                  Failed
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {isLoading ? <Skeleton className="h-9 w-16" /> : stats.failed}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </PageSection>

        {/* Filters */}
        <PageSection delay={2}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action, or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Action Filter */}
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <Activity className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                    <SelectItem value="approve">Approve</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* Audit Events Table */}
        <PageSection delay={3}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Shield className="size-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">No audit events found</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="max-w-[250px]">Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEvents.map((event, index) => (
                        <TableRow
                          key={event.id}
                          className="animate-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="text-left">
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-3 text-muted-foreground" />
                                    <span className="text-sm">
                                      {formatDistanceToNow(
                                        parseISO(event.timestamp),
                                        { addSuffix: true },
                                      )}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(parseISO(event.timestamp), "PPpp")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-muted flex items-center justify-center">
                                <User className="size-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium">
                                {event.user_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(event.action)}
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {event.action}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {event.resource}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeClass(event.status)}
                            >
                              {event.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[250px] truncate text-sm text-muted-foreground">
                            {event.details}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs text-muted-foreground">
                              {event.ip_address}
                            </code>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
