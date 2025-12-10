import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Shield,
  Search,
  Filter,
  Download,
  User,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

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

export default function AuditPage() {
  const { getDecodedIdToken } = useAsgardeo();
  const [currentRole, setCurrentRole] = useState<UserRole>("employee");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AuditEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

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

  // Mock data - replace with API call
  useEffect(() => {
    const mockEvents: AuditEvent[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        user_id: "user_001",
        user_name: "John Smith",
        action: "user_login",
        resource: "authentication",
        status: "success",
        ip_address: "192.168.1.100",
        details: "User successfully logged in",
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user_id: "user_002",
        user_name: "Sarah Johnson",
        action: "employee_update",
        resource: "employee_management",
        status: "success",
        ip_address: "192.168.1.101",
        details: "Updated employee salary information",
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user_id: "user_003",
        user_name: "Mike Wilson",
        action: "leave_approval",
        resource: "leave_management",
        status: "success",
        ip_address: "192.168.1.102",
        details: "Approved leave request for employee #EMP-445",
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        user_id: "user_004",
        user_name: "Emily Davis",
        action: "failed_login",
        resource: "authentication",
        status: "failed",
        ip_address: "192.168.1.103",
        details: "Failed login attempt - invalid credentials",
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        user_id: "user_005",
        user_name: "Robert Brown",
        action: "user_creation",
        resource: "user_management",
        status: "success",
        ip_address: "192.168.1.104",
        details: "Created new employee account",
      },
    ];

    setTimeout(() => {
      setAuditEvents(mockEvents);
      setFilteredEvents(mockEvents);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter events based on search and filters
  useEffect(() => {
    let filtered = auditEvents;

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.details.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (filterAction !== "all") {
      filtered = filtered.filter((event) => event.action === filterAction);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((event) => event.status === filterStatus);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, filterAction, filterStatus, auditEvents]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "success":
        return "default";
      case "failed":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("login")) return <Shield className="size-4" />;
    if (action.includes("update") || action.includes("create"))
      return <Activity className="size-4" />;
    return <AlertCircle className="size-4" />;
  };

  // Check if user has access to audit logs
  const hasAuditAccess =
    currentRole === "HR_Admin" ||
    currentRole === "HR_Manager" ||
    currentRole === "manager";

  if (!hasAuditAccess) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex min-h-screen items-center justify-center p-8">
            <Card className="max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-destructive" />
                  Access Denied
                </CardTitle>
                <CardDescription>
                  You do not have permission to view audit logs.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
          {/* Header */}
          <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
            <div className="flex h-16 items-center gap-4 px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/20">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Audit Trail
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    System activity monitoring & compliance
                  </p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="size-4" />
                  Export
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">
                    Total Events
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {auditEvents.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">
                    Success Rate
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {(
                      (auditEvents.filter((e) => e.status === "success")
                        .length /
                        auditEvents.length) *
                      100
                    ).toFixed(0)}
                    %
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">Failed</CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {auditEvents.filter((e) => e.status === "failed").length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs">
                    Last 24h
                  </CardDescription>
                  <CardTitle className="text-2xl font-bold">
                    {auditEvents.length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="user_login">Login</SelectItem>
                      <SelectItem value="employee_update">Update</SelectItem>
                      <SelectItem value="leave_approval">
                        Leave Approval
                      </SelectItem>
                      <SelectItem value="user_creation">
                        User Creation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterAction("all");
                      setFilterStatus("all");
                    }}
                  >
                    <Filter className="size-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Events List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Showing {filteredEvents.length} of {auditEvents.length} events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-2">
                      <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">
                        Loading audit events...
                      </p>
                    </div>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="size-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No audit events found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                            {getActionIcon(event.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div>
                                <h3 className="font-semibold text-sm">
                                  {event.action
                                    .split("_")
                                    .map(
                                      (w) =>
                                        w.charAt(0).toUpperCase() + w.slice(1),
                                    )
                                    .join(" ")}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {event.details}
                                </p>
                              </div>
                              <Badge
                                variant={getStatusBadgeVariant(event.status)}
                              >
                                {event.status}
                              </Badge>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="size-3" />
                                {event.user_name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {format(
                                  new Date(event.timestamp),
                                  "MMM dd, yyyy HH:mm:ss",
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Activity className="size-3" />
                                {event.ip_address}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
