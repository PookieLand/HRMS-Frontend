// Onboarding Status Page
// Track and manage pending employee onboarding invitations
// Shows invitation status, allows resending and cancellation

import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useAsgardeo } from "@asgardeo/react";
import {
  UserPlus,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Send,
  Trash2,
  Eye,
  Filter,
  Search,
  Users,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  listOnboardingInvitations,
  cancelOnboarding,
  resendInvitation,
  formatOnboardingStatus,
  type OnboardingStatusResponse,
  type OnboardingStatus,
  type UserRole,
  canInitiateOnboarding,
} from "@/lib/api/users";

import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow, parseISO } from "date-fns";

// Status badge styling
function getStatusBadgeClass(status: OnboardingStatus): string {
  switch (status) {
    case "completed":
      return "status-success";
    case "failed":
    case "cancelled":
      return "status-error";
    case "initiated":
    case "invitation_sent":
      return "status-info";
    case "asgardeo_user_created":
    case "employee_created":
      return "status-warning";
    default:
      return "status-neutral";
  }
}

// Status icon
function getStatusIcon(status: OnboardingStatus) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="size-4 text-red-500" />;
    case "initiated":
    case "invitation_sent":
      return <Mail className="size-4 text-blue-500" />;
    case "asgardeo_user_created":
    case "employee_created":
      return <Clock className="size-4 text-amber-500" />;
    default:
      return <AlertCircle className="size-4 text-muted-foreground" />;
  }
}

export default function OnboardingStatusPage() {
  const { getAccessToken, getDecodedIdToken, isSignedIn } = useAsgardeo();
  const { toast } = useToast();

  // State
  const [invitations, setInvitations] = useState<OnboardingStatusResponse[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("employee");
  const [accessToken, setAccessToken] = useState<string>("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<OnboardingStatusResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Initialize and get user role
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getAccessToken();
        setAccessToken(token);

        const decodedToken = await getDecodedIdToken();
        const groups = (decodedToken?.groups as string[]) || [];

        if (
          groups.includes("HR_Administrators") ||
          groups.includes("HR_Admin") ||
          groups.includes("HR-Administrators")
        ) {
          setCurrentUserRole("HR_Admin");
        } else if (
          groups.includes("HR_Managers") ||
          groups.includes("HR_Manager") ||
          groups.includes("HR-Managers")
        ) {
          setCurrentUserRole("HR_Manager");
        } else if (
          groups.includes("Managers") ||
          groups.includes("manager") ||
          groups.includes("Manager")
        ) {
          setCurrentUserRole("manager");
        } else {
          setCurrentUserRole("employee");
        }
      } catch (err) {
        console.error("Error initializing:", err);
        setError("Failed to authenticate");
      }
    };

    init();
  }, [isSignedIn, getAccessToken, getDecodedIdToken]);

  // Load invitations
  const loadInvitations = useCallback(
    async (showRefreshing = false) => {
      if (!accessToken) return;

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params: { status?: OnboardingStatus; limit?: number } = {
          limit: 100,
        };

        if (statusFilter && statusFilter !== "all") {
          params.status = statusFilter as OnboardingStatus;
        }

        const response = await listOnboardingInvitations(accessToken, params);
        setInvitations(response.invitations);
      } catch (err) {
        console.error("Failed to load invitations:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load invitations",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, statusFilter],
  );

  useEffect(() => {
    if (accessToken) {
      loadInvitations();
    }
  }, [loadInvitations, accessToken]);

  // Filter invitations locally
  const filteredInvitations = invitations.filter((inv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.email.toLowerCase().includes(query) ||
      inv.job_title.toLowerCase().includes(query) ||
      inv.role.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(
      (i) =>
        i.status === "initiated" ||
        i.status === "invitation_sent" ||
        i.status === "asgardeo_user_created" ||
        i.status === "employee_created",
    ).length,
    completed: invitations.filter((i) => i.status === "completed").length,
    failed: invitations.filter(
      (i) => i.status === "failed" || i.status === "cancelled",
    ).length,
  };

  // Handle resend invitation
  const handleResend = async (invitation: OnboardingStatusResponse) => {
    setActionLoading(true);
    try {
      await resendInvitation(accessToken, invitation.invitation_token);
      toast({
        title: "Invitation Resent",
        description: `A new invitation has been sent to ${invitation.email}`,
      });
      loadInvitations(true);
    } catch (err) {
      toast({
        title: "Failed to Resend",
        description:
          err instanceof Error ? err.message : "Could not resend invitation",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle cancel invitation
  const handleCancel = async () => {
    if (!selectedInvitation) return;

    setActionLoading(true);
    try {
      await cancelOnboarding(
        accessToken,
        selectedInvitation.invitation_token,
        "Cancelled by admin",
      );
      toast({
        title: "Invitation Cancelled",
        description: `The invitation for ${selectedInvitation.email} has been cancelled`,
      });
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
      loadInvitations(true);
    } catch (err) {
      toast({
        title: "Failed to Cancel",
        description:
          err instanceof Error ? err.message : "Could not cancel invitation",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Check permissions
  if (!isSignedIn) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Onboarding Status"
          icon={<Users className="size-5" />}
        />
        <PageContent>
          <div className="flex flex-1 items-center justify-center py-16">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please sign in to access onboarding status.
              </AlertDescription>
            </Alert>
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  if (!canInitiateOnboarding(currentUserRole)) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Onboarding Status"
          icon={<Users className="size-5" />}
        />
        <PageContent>
          <div className="flex flex-1 items-center justify-center py-16">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to view onboarding status. Only HR
                  Admin and HR Manager roles can access this page.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Link to="/dashboard">
                  <Button variant="outline">Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Onboarding Status"
        description="Track and manage employee onboarding invitations"
        icon={<Users className="size-5" />}
      >
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadInvitations(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh list</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link to="/dashboard/employees/onboard">
            <Button className="gap-2">
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">New Onboarding</span>
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PageContent>
        {/* Stats Cards */}
        <PageSection delay={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-accent-blue hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Total Invitations
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? <Skeleton className="h-9 w-16" /> : stats.total}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-amber hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Pending
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? <Skeleton className="h-9 w-16" /> : stats.pending}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-emerald hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Completed
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    stats.completed
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-rose hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Failed/Cancelled
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? <Skeleton className="h-9 w-16" /> : stats.failed}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, role, job title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="invitation_sent">
                      Invitation Sent
                    </SelectItem>
                    <SelectItem value="asgardeo_user_created">
                      Account Created
                    </SelectItem>
                    <SelectItem value="employee_created">
                      Employee Created
                    </SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* Invitations Table */}
        <PageSection delay={3}>
          <Card>
            <CardContent className="p-0">
              {error ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <XCircle className="size-6 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium mb-2">
                    Failed to load invitations
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" onClick={() => loadInvitations()}>
                    <RefreshCw className="size-4 mr-2" />
                    Try again
                  </Button>
                </div>
              ) : loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Mail className="size-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">No invitations found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {statusFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Start by onboarding a new employee"}
                  </p>
                  <Link to="/dashboard/employees/onboard">
                    <Button>
                      <UserPlus className="size-4 mr-2" />
                      Onboard Employee
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Initiated</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right w-20">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvitations.map((invitation, index) => (
                        <TableRow
                          key={invitation.invitation_token}
                          className="animate-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="size-4 text-muted-foreground" />
                              <span className="font-medium">
                                {invitation.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{invitation.role}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {invitation.job_title}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(invitation.status)}
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(
                                  invitation.status,
                                )}
                              >
                                {formatOnboardingStatus(invitation.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {formatDistanceToNow(
                                    parseISO(invitation.initiated_at),
                                    { addSuffix: true },
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(
                                    parseISO(invitation.initiated_at),
                                    "PPpp",
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            {invitation.is_expired ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                {invitation.status === "completed" ||
                                invitation.status === "cancelled"
                                  ? "—"
                                  : "Active"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Eye className="size-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {(invitation.status === "initiated" ||
                                  invitation.status === "invitation_sent") && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleResend(invitation)}
                                      disabled={actionLoading}
                                    >
                                      <Send className="size-4 mr-2" />
                                      Resend Invitation
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setSelectedInvitation(invitation);
                                        setCancelDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="size-4 mr-2" />
                                      Cancel Invitation
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the invitation for{" "}
              <span className="font-medium">{selectedInvitation?.email}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={actionLoading}
            >
              Keep Invitation
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Invitation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
