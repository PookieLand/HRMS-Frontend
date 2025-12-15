import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
} from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRecord } from "@/lib/api/leave";
import { useLeaveAPI } from "@/lib/api/leave";
import { Skeleton } from "@/components/ui/skeleton";

function getLeaveTypeBadgeClass(type: string) {
  switch (type) {
    case "annual":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "sick":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
    case "casual":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "maternity":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
    case "paternity":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "unpaid":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export default function LeaveApprovalsPage() {
  const leaveAPI = useLeaveAPI();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadPendingLeaves();
  }, []);

  const loadPendingLeaves = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const leaves = await leaveAPI.getPendingApprovals({
        limit: 100,
      });

      setPendingLeaves(leaves);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLeave) return;

    setIsProcessing(true);
    try {
      await leaveAPI.approveLeave(
        selectedLeave.id,
        approvalNotes.trim() || undefined,
      );

      toast({
        title: "Leave Approved",
        description: `Leave request from ${selectedLeave.employee_name} has been approved`,
      });

      setIsApproveDialogOpen(false);
      setApprovalNotes("");
      setSelectedLeave(null);
      await loadPendingLeaves(true);
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Unable to approve leave request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLeave || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this leave request",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await leaveAPI.rejectLeave(selectedLeave.id, rejectionReason.trim());

      toast({
        title: "Leave Rejected",
        description: `Leave request from ${selectedLeave.employee_name} has been rejected`,
      });

      setIsRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedLeave(null);
      await loadPendingLeaves(true);
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message || "Unable to reject leave request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openApproveDialog = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (leave: LeaveRecord) => {
    setSelectedLeave(leave);
    setIsRejectDialogOpen(true);
  };

  // Loading state
  if (loading && pendingLeaves.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Leave Approvals"
          icon={<Clock className="size-5" />}
        />
        <PageContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
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
        title="Leave Approvals"
        description="Review and approve leave requests from your team"
        icon={<Clock className="size-8" />}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadPendingLeaves(true)}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Approvals
                </CardTitle>
                <Clock className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingLeaves.length}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting your review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Urgent Requests
                </CardTitle>
                <AlertCircle className="size-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    pendingLeaves.filter((leave) => {
                      const startDate = new Date(leave.start_date);
                      const today = new Date();
                      const diffDays = Math.ceil(
                        (startDate.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      return diffDays <= 7;
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Starting within 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Days Requested
                </CardTitle>
                <Calendar className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingLeaves.reduce(
                    (sum, leave) => sum + leave.number_of_days,
                    0,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all pending requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
              <CardDescription>
                Review and take action on leave requests from your team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="size-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no pending leave requests at the moment
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Applied On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLeaves.map((leave) => {
                        const startDate = new Date(leave.start_date);
                        const today = new Date();
                        const diffDays = Math.ceil(
                          (startDate.getTime() - today.getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        const isUrgent = diffDays <= 7 && diffDays >= 0;

                        return (
                          <TableRow key={leave.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {leave.employee_name}
                                </span>
                                {leave.employee_email && (
                                  <span className="text-xs text-muted-foreground">
                                    {leave.employee_email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getLeaveTypeBadgeClass(
                                  leave.leave_type,
                                )}
                              >
                                {leave.leave_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {format(
                                    new Date(leave.start_date),
                                    "MMM dd, yyyy",
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  to{" "}
                                  {format(
                                    new Date(leave.end_date),
                                    "MMM dd, yyyy",
                                  )}
                                </span>
                                {isUrgent && (
                                  <Badge
                                    variant="outline"
                                    className="mt-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 w-fit"
                                  >
                                    <AlertCircle className="size-3 mr-1" />
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold tabular-nums">
                                {leave.number_of_days}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm line-clamp-2 max-w-xs">
                                {leave.reason}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {format(
                                  new Date(leave.created_at),
                                  "MMM dd, yyyy",
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => openApproveDialog(leave)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="size-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openRejectDialog(leave)}
                                >
                                  <XCircle className="size-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
            <DialogDescription>
              Confirm approval for {selectedLeave?.employee_name}'s leave
              request
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {selectedLeave.employee_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(
                          new Date(selectedLeave.start_date),
                          "MMM dd, yyyy",
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(selectedLeave.end_date),
                          "MMM dd, yyyy",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedLeave.number_of_days} day(s)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getLeaveTypeBadgeClass(selectedLeave.leave_type)}
                  >
                    {selectedLeave.leave_type}
                  </Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <FileText className="size-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedLeave.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">
                  Approval Notes (Optional)
                </Label>
                <Textarea
                  id="approval-notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or comments for this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setApprovalNotes("");
                setSelectedLeave(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Approve Leave
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedLeave?.employee_name}'s
              leave request
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {selectedLeave.employee_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(
                          new Date(selectedLeave.start_date),
                          "MMM dd, yyyy",
                        )}{" "}
                        -{" "}
                        {format(
                          new Date(selectedLeave.end_date),
                          "MMM dd, yyyy",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedLeave.number_of_days} day(s)
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getLeaveTypeBadgeClass(selectedLeave.leave_type)}
                  >
                    {selectedLeave.leave_type}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">
                  Rejection Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejecting this leave request..."
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be shared with the employee
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedLeave(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="size-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="size-4 mr-2" />
                  Reject Leave
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
