import { useEffect, useState } from "react";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Filter,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
} from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { LeaveRecord } from "@/lib/api/leave";
import { useLeaveAPI } from "@/lib/api/leave";
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

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

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

function getStatusIcon(status: string) {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="size-4" />;
    case "rejected":
      return <XCircle className="size-4" />;
    case "pending":
      return <Clock className="size-4" />;
    case "cancelled":
      return <Ban className="size-4" />;
    default:
      return <AlertCircle className="size-4" />;
  }
}

export default function LeavePage() {
  const leaveAPI = useLeaveAPI();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [leaveType, setLeaveType] = useState<string>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [leaveToCancel, setLeaveToCancel] = useState<string | null>(null);

  useEffect(() => {
    loadLeaveData();
  }, [statusFilter]);

  const loadLeaveData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const leaves = await leaveAPI.getMyLeaves({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 100,
      });

      setMyLeaves(leaves);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load leave data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      toast({
        title: "Invalid Dates",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveAPI.applyLeave({
        leave_type: leaveType as any,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        contact_info: contactInfo.trim() || undefined,
      });

      toast({
        title: "Leave Applied Successfully",
        description: "Your leave request has been submitted for approval",
      });

      setIsApplyDialogOpen(false);
      resetForm();
      await loadLeaveData(true);
    } catch (error: any) {
      toast({
        title: "Failed to Apply Leave",
        description: error.message || "Unable to submit leave request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!leaveToCancel) return;

    try {
      await leaveAPI.cancelLeave(leaveToCancel);
      toast({
        title: "Leave Cancelled",
        description: "Your leave request has been cancelled",
      });
      setCancelDialogOpen(false);
      setLeaveToCancel(null);
      await loadLeaveData(true);
    } catch (error: any) {
      toast({
        title: "Failed to Cancel",
        description: error.message || "Unable to cancel leave request",
        variant: "destructive",
      });
    }
  };

  const openCancelDialog = (leaveId: string) => {
    setLeaveToCancel(leaveId);
    setCancelDialogOpen(true);
  };

  const resetForm = () => {
    setLeaveType("annual");
    setStartDate("");
    setEndDate("");
    setReason("");
    setContactInfo("");
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  // Calculate summary stats
  const stats = {
    total: myLeaves.length,
    pending: myLeaves.filter((l) => l.status === "pending").length,
    approved: myLeaves.filter((l) => l.status === "approved").length,
    rejected: myLeaves.filter((l) => l.status === "rejected").length,
  };

  // Loading state
  if (loading && myLeaves.length === 0) {
    return (
      <DashboardLayout>
        <PageHeader
          title="My Leaves"
          icon={<CalendarDays className="size-5" />}
        />
        <PageContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        title="My Leaves"
        description="Manage your leave requests and track your leave history"
        icon={<CalendarDays className="size-8" />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLeaveData(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Apply for Leave</span>
                <span className="sm:hidden">Apply</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 shadow-2xl">
              <DialogHeader className="border-b border-gray-200 dark:border-slate-800 pb-4">
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  Apply for Leave
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400 pt-1">
                  Fill in the details below to submit your leave request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="leave-type"
                      className="text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Leave Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger
                        id="leave-type"
                        className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700">
                        <SelectItem
                          value="annual"
                          className="text-gray-900 dark:text-white"
                        >
                          Annual Leave
                        </SelectItem>
                        <SelectItem
                          value="sick"
                          className="text-gray-900 dark:text-white"
                        >
                          Sick Leave
                        </SelectItem>
                        <SelectItem
                          value="casual"
                          className="text-gray-900 dark:text-white"
                        >
                          Casual Leave
                        </SelectItem>
                        <SelectItem
                          value="maternity"
                          className="text-gray-900 dark:text-white"
                        >
                          Maternity Leave
                        </SelectItem>
                        <SelectItem
                          value="paternity"
                          className="text-gray-900 dark:text-white"
                        >
                          Paternity Leave
                        </SelectItem>
                        <SelectItem
                          value="unpaid"
                          className="text-gray-900 dark:text-white"
                        >
                          Unpaid Leave
                        </SelectItem>
                        <SelectItem
                          value="other"
                          className="text-gray-900 dark:text-white"
                        >
                          Other
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-gray-700 dark:text-gray-300 font-semibold">
                      Duration
                    </Label>
                    <div className="flex items-center justify-center h-10 px-3 border border-gray-300 dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-900 shadow-sm">
                      <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                        {calculateDays()}
                      </span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                        day(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="start-date"
                      className="text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label
                      htmlFor="end-date"
                      className="text-gray-700 dark:text-gray-300 font-semibold"
                    >
                      End Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || format(new Date(), "yyyy-MM-dd")}
                      className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label
                    htmlFor="reason"
                    className="text-gray-700 dark:text-gray-300 font-semibold"
                  >
                    Reason <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for your leave request..."
                    rows={3}
                    className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-gray-200 dark:border-slate-800 pt-4 mt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsApplyDialogOpen(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyLeave}
                  disabled={isSubmitting}
                  className="bg-black dark:bg-gray-900 hover:bg-gray-900 dark:hover:bg-gray-800 text-white font-semibold"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <PageContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Leaves
                </CardTitle>
                <CalendarDays className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="size-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle2 className="size-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">Granted leaves</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="size-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rejected}</div>
                <p className="text-xs text-muted-foreground">Declined</p>
              </CardContent>
            </Card>
          </div>

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Leave Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  {statusFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter("all")}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {myLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CalendarDays className="size-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Leave Requests
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {statusFilter === "all"
                      ? "You haven't applied for any leaves yet"
                      : `No ${statusFilter} leave requests found`}
                  </p>
                  <Button onClick={() => setIsApplyDialogOpen(true)}>
                    <Plus className="size-4 mr-2" />
                    Apply for Leave
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reviewer</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myLeaves.map((leave) => (
                        <TableRow key={leave.id}>
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
                            <Badge
                              variant="outline"
                              className={`gap-1 ${getStatusBadgeClass(leave.status)}`}
                            >
                              {getStatusIcon(leave.status)}
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {leave.reviewer_name ? (
                              <span className="text-sm">
                                {leave.reviewer_name}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {(leave.status === "pending" ||
                              leave.status === "approved") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openCancelDialog(leave.id)}
                              >
                                <Ban className="size-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContent>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this leave request? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeaveToCancel(null)}>
              No, Keep It
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelLeave}>
              Yes, Cancel Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
