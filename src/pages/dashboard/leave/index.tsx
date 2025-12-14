// My Leaves Page
// Personal leave management with application and tracking
// Shows leave balances, history, and allows applying for new leaves

import { useEffect, useState } from "react";
import { useLeaveAPI } from "@/lib/api/leave";
import type { LeaveRecord, LeaveSummary } from "@/lib/api/leave";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAsgardeo } from "@asgardeo/react";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Palmtree,
  X,
  RefreshCw,
  Filter,
  FileText,
  Calendar,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

// Status badge styling - consistent with design system
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "status-success";
    case "pending":
      return "status-warning";
    case "rejected":
      return "status-error";
    case "cancelled":
      return "status-neutral";
    default:
      return "status-neutral";
  }
}

// Leave type badge styling
function getLeaveTypeBadgeClass(type: string): string {
  switch (type) {
    case "annual":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "sick":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    case "casual":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
    case "maternity":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
    case "paternity":
      return "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20";
    case "unpaid":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function LeavePage() {
  const leaveAPI = useLeaveAPI();
  const { getDecodedIdToken } = useAsgardeo();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myLeaves, setMyLeaves] = useState<LeaveRecord[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<LeaveSummary | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [leaveType, setLeaveType] = useState<string>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employeeId, setEmployeeId] = useState<string>("");

  useEffect(() => {
    const initializeEmployee = async () => {
      try {
        const decodedToken = await getDecodedIdToken();
        const id = (decodedToken?.sub as string) || "";
        setEmployeeId(id);
      } catch (error) {
        console.error("Failed to get employee ID:", error);
        toast({
          title: "Error",
          description: "Failed to initialize employee information",
          variant: "destructive",
        });
      }
    };

    initializeEmployee();
  }, [getDecodedIdToken, toast]);

  useEffect(() => {
    if (employeeId) {
      loadLeaveData();
    }
  }, [employeeId, statusFilter]);

  const loadLeaveData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [leaves, summary] = await Promise.all([
        leaveAPI.getMyLeaves({
          status: statusFilter === "all" ? undefined : statusFilter,
          page: 1,
          page_size: 50,
        }),
        leaveAPI.getMyBalance(),
      ]);

      setMyLeaves(leaves.leaves);
      setLeaveSummary(summary);
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
        employee_id: employeeId,
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

  const handleCancelLeave = async (leaveId: string) => {
    try {
      await leaveAPI.cancelLeave(leaveId);
      toast({
        title: "Leave Cancelled",
        description: "Your leave request has been cancelled",
      });
      await loadLeaveData(true);
    } catch (error: any) {
      toast({
        title: "Failed to Cancel",
        description: error.message || "Unable to cancel leave request",
        variant: "destructive",
      });
    }
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

  // Loading state
  if (loading && !leaveSummary) {
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
        description="Manage your leave requests and track balances"
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
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Apply for Leave</DialogTitle>
                <DialogDescription>
                  Fill in the details below to submit your leave request
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leave-type">Leave Type *</Label>
                    <Select value={leaveType} onValueChange={setLeaveType}>
                      <SelectTrigger id="leave-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual Leave</SelectItem>
                        <SelectItem value="sick">Sick Leave</SelectItem>
                        <SelectItem value="casual">Casual Leave</SelectItem>
                        <SelectItem value="maternity">
                          Maternity Leave
                        </SelectItem>
                        <SelectItem value="paternity">
                          Paternity Leave
                        </SelectItem>
                        <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="flex items-center justify-center h-10 px-3 border rounded-md bg-muted/50">
                      <span className="text-lg font-bold tabular-nums">
                        {calculateDays()}
                      </span>
                      <span className="ml-2 text-muted-foreground text-sm">
                        day(s)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for your leave request..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">
                    Emergency Contact (while on leave)
                  </Label>
                  <Input
                    id="contact"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Phone number or email"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsApplyDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleApplyLeave} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <PageContent>
        {/* Leave Balance Cards */}
        <PageSection delay={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className=" hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Palmtree className="size-4 text-blue-600" />
                  Total Taken
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {leaveSummary?.total_leaves_taken ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Days this year</p>
              </CardContent>
            </Card>

            <Card className=" hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Clock className="size-4 text-amber-600" />
                  Pending
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {leaveSummary?.total_pending ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card className=" hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Approved
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {leaveSummary?.total_approved ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This year</p>
              </CardContent>
            </Card>

            <Card className=" hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <AlertCircle className="size-4 text-rose-600" />
                  Rejected
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {leaveSummary?.total_rejected ?? 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This year</p>
              </CardContent>
            </Card>
          </div>
        </PageSection>

        {/* Leave History */}
        <PageSection delay={2}>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Leave History
                  </CardTitle>
                  <CardDescription>
                    View and manage your leave requests
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="data-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="max-w-[200px]">Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="size-5 animate-spin" />
                            <span className="text-muted-foreground">
                              Loading...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : myLeaves.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                              <Calendar className="size-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">
                              No leave records found
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsApplyDialogOpen(true)}
                            >
                              Apply for Leave
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      myLeaves.map((leave, index) => (
                        <TableRow
                          key={leave.id}
                          className="animate-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
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
                          <TableCell className="tabular-nums">
                            {format(parseISO(leave.start_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {format(parseISO(leave.end_date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {leave.number_of_days}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeClass(leave.status)}
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {leave.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            {leave.status === "pending" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelLeave(leave.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <X className="size-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                            {leave.status === "rejected" &&
                              leave.rejection_reason && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    toast({
                                      title: "Rejection Reason",
                                      description: leave.rejection_reason,
                                    });
                                  }}
                                >
                                  <AlertCircle className="size-4 mr-1" />
                                  View
                                </Button>
                              )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
