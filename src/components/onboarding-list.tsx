import { useState, useEffect } from "react";
import {
  Mail,
  RefreshCw,
  XCircle,
  CheckCircle,
  Clock,
  User,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/contexts/AlertContext";
import {
  listOnboardingInvitations,
  cancelOnboarding,
  resendInvitation,
  type OnboardingStatusResponse,
  type OnboardingStatus,
  formatOnboardingStatus,
  formatRole,
  getStatusColor,
  type UserRole,
} from "@/lib/api/users";

interface OnboardingListProps {
  accessToken: string;
}

type DialogType = "cancel" | "resend" | null;

const statusIcons: Record<OnboardingStatus, React.ReactNode> = {
  initiated: <Clock className="h-4 w-4" />,
  invitation_sent: <Mail className="h-4 w-4" />,
  asgardeo_user_created: <User className="h-4 w-4" />,
  employee_created: <CheckCircle className="h-4 w-4" />,
  completed: <CheckCircle className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

export function OnboardingList({ accessToken }: OnboardingListProps) {
  const { showAlert } = useAlert();
  const [invitations, setInvitations] = useState<OnboardingStatusResponse[]>([]);
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedInvitation, setSelectedInvitation] =
    useState<OnboardingStatusResponse | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, [statusFilter, page]);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const params: {
        status?: OnboardingStatus;
        limit: number;
        offset: number;
      } = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter as OnboardingStatus;
      }

      const response = await listOnboardingInvitations(accessToken, params);
      setInvitations(response.invitations);
      setTotalInvitations(response.total);
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load invitations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(totalInvitations / pageSize);

  const openDialog = (type: DialogType, invitation: OnboardingStatusResponse) => {
    setSelectedInvitation(invitation);
    setDialogType(type);
  };

  const closeDialog = () => {
    setSelectedInvitation(null);
    setDialogType(null);
    setCancelReason("");
  };

  const handleCancel = async () => {
    if (!selectedInvitation) return;

    setIsActionLoading(true);
    try {
      await cancelOnboarding(
        accessToken,
        selectedInvitation.invitation_token,
        cancelReason || undefined
      );
      showAlert({
        title: "Invitation Cancelled",
        message: `Invitation for ${selectedInvitation.email} has been cancelled.`,
        variant: "success",
      });
      closeDialog();
      loadInvitations();
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to cancel invitation",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResend = async () => {
    if (!selectedInvitation) return;

    setIsActionLoading(true);
    try {
      await resendInvitation(accessToken, selectedInvitation.invitation_token);
      showAlert({
        title: "Invitation Resent",
        message: `Invitation email has been resent to ${selectedInvitation.email}.`,
        variant: "success",
      });
      closeDialog();
      loadInvitations();
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to resend invitation",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const canResend = (invitation: OnboardingStatusResponse) => {
    return (
      !invitation.is_expired &&
      ["initiated", "invitation_sent"].includes(invitation.status)
    );
  };

  const canCancel = (invitation: OnboardingStatusResponse) => {
    return (
      !invitation.is_expired &&
      !["completed", "cancelled", "failed"].includes(invitation.status)
    );
  };

  if (isLoading && invitations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Initiated</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="invitation_sent">Invitation Sent</SelectItem>
            <SelectItem value="asgardeo_user_created">Account Created</SelectItem>
            <SelectItem value="employee_created">Employee Created</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          onClick={loadInvitations}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Role / Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Initiated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <p className="text-muted-foreground">No invitations found</p>
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow
                  key={invitation.invitation_token}
                  className={invitation.is_expired ? "opacity-60" : ""}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{invitation.email}</span>
                      {invitation.initiated_by_name && (
                        <span className="text-xs text-muted-foreground">
                          by {invitation.initiated_by_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">
                        {formatRole(invitation.role as UserRole)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {invitation.job_title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(invitation.status)} inline-flex items-center gap-1`}
                      >
                        {statusIcons[invitation.status]}
                        {formatOnboardingStatus(invitation.status)}
                      </Badge>
                      {invitation.is_expired && (
                        <Badge
                          variant="outline"
                          className="bg-red-500/10 text-red-500 border-red-500/20 text-xs"
                        >
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {new Date(invitation.initiated_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(invitation.initiated_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(canResend(invitation) || canCancel(invitation)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          {canResend(invitation) && (
                            <DropdownMenuItem
                              onClick={() => openDialog("resend", invitation)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Resend Invitation
                            </DropdownMenuItem>
                          )}

                          {canCancel(invitation) && (
                            <DropdownMenuItem
                              onClick={() => openDialog("cancel", invitation)}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Invitation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalInvitations)} of {totalInvitations}{" "}
            invitations
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      <AlertDialog
        open={dialogType === "cancel"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{" "}
              <strong>{selectedInvitation?.email}</strong>? They will not be able
              to complete their onboarding.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Input
              id="cancel-reason"
              placeholder="Enter reason..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isActionLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Dialog */}
      <AlertDialog
        open={dialogType === "resend"}
        onOpenChange={() => closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a new invitation email to{" "}
              <strong>{selectedInvitation?.email}</strong>. The previous link
              will still work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResend} disabled={isActionLoading}>
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Resend Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
