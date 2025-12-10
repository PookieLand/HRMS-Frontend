import { useEffect, useState } from "react";
import { useLeaveAPI } from "@/lib/api/leave";
import type { LeaveRecord, LeaveBalance, LeaveSummary } from "@/lib/api/leave";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAsgardeo } from "@asgardeo/react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Palmtree,
  X,
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

export default function LeavePage() {
  const leaveAPI = useLeaveAPI();
  const { getDecodedIdToken } = useAsgardeo();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
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

  const loadLeaveData = async () => {
    setLoading(true);
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
      await loadLeaveData();
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
      await loadLeaveData();
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-700 border-amber-200",
      approved: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-500/10 text-rose-700 border-rose-200",
      cancelled: "bg-gray-500/10 text-gray-700 border-gray-200",
    };
    return colors[status] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const getLeaveTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      annual: "bg-blue-500/10 text-blue-700",
      sick: "bg-red-500/10 text-red-700",
      casual: "bg-green-500/10 text-green-700",
      maternity: "bg-purple-500/10 text-purple-700",
      paternity: "bg-indigo-500/10 text-indigo-700",
      unpaid: "bg-orange-500/10 text-orange-700",
      other: "bg-gray-500/10 text-gray-700",
    };
    return colors[type] || "bg-gray-500/10 text-gray-700";
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  if (loading && !leaveSummary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-sm text-muted-foreground">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-4xl font-bold tracking-tight mb-2"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            My Leaves
          </h1>
          <p className="text-muted-foreground">
            Manage your leave requests and track balances
          </p>
        </div>
        <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="h-4 w-4" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle
                className="text-2xl"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Apply for Leave
              </DialogTitle>
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
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <div className="h-10 px-3 border rounded-md flex items-center bg-muted">
                    <span className="text-sm font-semibold">
                      {calculateDays()} {calculateDays() === 1 ? "day" : "days"}
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
                  placeholder="Please provide a reason for your leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Information (Optional)</Label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="Phone number or alternate email"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApplyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleApplyLeave} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Palmtree className="h-4 w-4 text-blue-600" />
              Total Leaves
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {leaveSummary?.total_leaves_taken || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Taken this year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Pending
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {leaveSummary?.total_pending || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Approved
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {leaveSummary?.total_approved || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-600" />
              Rejected
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {leaveSummary?.total_rejected || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balances by Type */}
      {leaveSummary?.balances && leaveSummary.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Leave Balances
            </CardTitle>
            <CardDescription>
              Your remaining leave balance by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveSummary.balances.map((balance) => (
                <div
                  key={balance.leave_type}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getLeaveTypeColor(balance.leave_type)}>
                      {balance.leave_type.charAt(0).toUpperCase() +
                        balance.leave_type.slice(1)}
                    </Badge>
                    <span className="text-2xl font-bold">
                      {balance.available}
                      <span className="text-sm text-muted-foreground ml-1">
                        / {balance.total_allocated}
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Used:</span>
                      <span className="font-semibold">{balance.used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-semibold">{balance.pending}</span>
                    </div>
                  </div>
                  <div className="mt-2 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{
                        width: `${(balance.used / balance.total_allocated) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Leave History
              </CardTitle>
              <CardDescription>
                Your past and upcoming leave requests
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                        <span className="text-muted-foreground">
                          Loading...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : myLeaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          No leave records found
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsApplyDialogOpen(true)}
                          className="mt-2"
                        >
                          Apply for Leave
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  myLeaves.map((leave) => (
                    <TableRow key={leave.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge className={getLeaveTypeColor(leave.leave_type)}>
                          {leave.leave_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(leave.start_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {format(parseISO(leave.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {leave.number_of_days}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-sm">
                        {leave.reason}
                      </TableCell>
                      <TableCell>
                        {leave.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelLeave(leave.id)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <X className="h-4 w-4 mr-1" />
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
                              <AlertCircle className="h-4 w-4 mr-1" />
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
    </div>
  );
}
