import { useEffect, useState } from "react";
import { useLeaveAPI } from "@/lib/api/leave";
import type { LeaveRecord, TeamLeaveCalendar } from "@/lib/api/leave";
import {
  DashboardLayout,
  PageHeader,
  PageContent,
  PageSection,
} from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  FileText,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LeaveApprovalsPage() {
  const leaveAPI = useLeaveAPI();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRecord[]>([]);
  const [teamCalendar, setTeamCalendar] = useState<TeamLeaveCalendar | null>(
    null,
  );
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNotes, setApprovalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const pageSize = 10;

  useEffect(() => {
    loadPendingLeaves();
    loadTeamCalendar();
  }, [currentPage]);

  const loadPendingLeaves = async () => {
    setLoading(true);
    try {
      const response = await leaveAPI.getPendingApprovals({
        page: currentPage,
        page_size: pageSize,
      });

      setPendingLeaves(response.leaves);
      setTotalRecords(response.total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load pending approvals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamCalendar = async () => {
    try {
      const now = new Date();
      const calendar = await leaveAPI.getTeamCalendar(
        now.getMonth() + 1,
        now.getFullYear(),
      );
      setTeamCalendar(calendar);
    } catch (error: any) {
      console.error("Failed to load team calendar:", error);
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
      await loadPendingLeaves();
      await loadTeamCalendar();
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
      await loadPendingLeaves();
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

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-500/10 text-blue-700 border-blue-200",
      sick: "bg-red-500/10 text-red-700 border-red-200",
      casual: "bg-green-500/10 text-green-700 border-green-200",
      maternity: "bg-purple-500/10 text-purple-700 border-purple-200",
      paternity: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
      unpaid: "bg-orange-500/10 text-orange-700 border-orange-200",
      other: "bg-gray-500/10 text-gray-700 border-gray-200",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  if (loading && !teamCalendar) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Leave Approvals"
          description="Review and manage team leave requests"
          icon={<Clock className="size-7" />}
        />
        <PageContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
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
        description="Review and manage team leave requests"
        icon={<Clock className="size-7" />}
      />

      <PageContent>
        <PageSection>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Pending Approvals
                </CardDescription>
                <CardTitle className="text-4xl font-bold">
                  {totalRecords}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Awaiting your review
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  On Leave Today
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-indigo-600">
                  {teamCalendar?.total_on_leave_today || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Team members away
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-blue-600" />
                  Upcoming Leaves
                </CardDescription>
                <CardTitle className="text-4xl font-bold text-blue-600">
                  {teamCalendar?.events.filter((e) => e.status === "approved")
                    .length || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        </PageSection>

        <PageSection delay={1}>
          {/* Main Content Tabs */}
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="gap-2">
                <Clock className="h-4 w-4" />
                Pending Requests
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                Team Calendar
              </TabsTrigger>
            </TabsList>

            {/* Pending Requests Tab */}
            <TabsContent value="pending" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Pending Leave Requests
                      </CardTitle>
                      <CardDescription>
                        Review and action pending leave requests from your team
                      </CardDescription>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {totalRecords} requests
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead className="hidden lg:table-cell">
                            Reason
                          </TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-12"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                <span className="text-muted-foreground">
                                  Loading...
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : pendingLeaves.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-12"
                            >
                              <div className="flex flex-col items-center gap-3">
                                <CheckCircle2 className="h-16 w-16 text-emerald-500/30" />
                                <div className="space-y-1">
                                  <p className="font-medium text-lg">
                                    All caught up!
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    No pending leave requests
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          pendingLeaves.map((leave) => (
                            <TableRow
                              key={leave.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {leave.employee_name}
                                  </p>
                                  {leave.employee_email && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {leave.employee_email}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={getLeaveTypeColor(
                                    leave.leave_type,
                                  )}
                                  variant="outline"
                                >
                                  {leave.leave_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm tabular-nums">
                                {format(
                                  parseISO(leave.start_date),
                                  "MMM d, yyyy",
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm tabular-nums">
                                {format(
                                  parseISO(leave.end_date),
                                  "MMM d, yyyy",
                                )}
                              </TableCell>
                              <TableCell className="font-semibold tabular-nums">
                                {leave.number_of_days}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell max-w-[200px]">
                                <p
                                  className="truncate text-sm"
                                  title={leave.reason}
                                >
                                  {leave.reason}
                                </p>
                                {leave.contact_info && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {leave.contact_info}
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => openApproveDialog(leave)}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">
                                      Approve
                                    </span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => openRejectDialog(leave)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">
                                      Reject
                                    </span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                      <p className="text-sm text-muted-foreground tabular-nums">
                        Showing {(currentPage - 1) * pageSize + 1} to{" "}
                        {Math.min(currentPage * pageSize, totalRecords)} of{" "}
                        {totalRecords} requests
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
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
                                  className="w-10 tabular-nums"
                                >
                                  {page}
                                </Button>
                              );
                            },
                          )}
                          {totalPages > 5 && (
                            <span className="text-muted-foreground px-2">
                              ...
                            </span>
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
            </TabsContent>

            {/* Team Calendar Tab */}
            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Team Leave Calendar
                  </CardTitle>
                  <CardDescription>
                    View approved and upcoming leaves for your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamCalendar && teamCalendar.events.length > 0 ? (
                    <div className="space-y-3">
                      {teamCalendar.events.map((event, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {event.employee_name}
                              </p>
                              <Badge
                                variant="outline"
                                className={getLeaveTypeColor(event.leave_type)}
                              >
                                {event.leave_type}
                              </Badge>
                              <Badge
                                variant={
                                  event.status === "approved"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {event.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span className="font-mono tabular-nums">
                                {format(parseISO(event.start_date), "MMM d")} -{" "}
                                {format(
                                  parseISO(event.end_date),
                                  "MMM d, yyyy",
                                )}
                              </span>
                              <span>•</span>
                              <span>{event.days} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">
                        No upcoming leaves scheduled
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageSection>
      </PageContent>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Approve Leave Request
            </DialogTitle>
            <DialogDescription>
              Approve leave request for {selectedLeave?.employee_name}
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Leave Type</p>
                  <Badge
                    className={getLeaveTypeColor(selectedLeave.leave_type)}
                    variant="outline"
                  >
                    {selectedLeave.leave_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {selectedLeave.number_of_days} days
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-mono text-sm">
                    {format(parseISO(selectedLeave.start_date), "MMM d")} -{" "}
                    {format(parseISO(selectedLeave.end_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="text-sm">{selectedLeave.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">
                  Approval Notes (Optional)
                </Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes or comments..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? "Approving..." : "Approve Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              Reject leave request for {selectedLeave?.employee_name}
            </DialogDescription>
          </DialogHeader>

          {selectedLeave && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Leave Type</p>
                  <Badge
                    className={getLeaveTypeColor(selectedLeave.leave_type)}
                    variant="outline"
                  >
                    {selectedLeave.leave_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {selectedLeave.number_of_days} days
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Period</p>
                  <p className="font-mono text-sm">
                    {format(parseISO(selectedLeave.start_date), "MMM d")} -{" "}
                    {format(parseISO(selectedLeave.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason" className="text-destructive">
                  Rejection Reason (Required) *
                </Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a clear reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="border-destructive focus-visible:ring-destructive"
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
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? "Rejecting..." : "Reject Leave"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
