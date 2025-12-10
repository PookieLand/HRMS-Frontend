import { useEffect, useState } from "react";
import { useLeaveAPI } from "@/lib/api/leave";
import type { LeaveRecord, TeamLeaveCalendar } from "@/lib/api/leave";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
 Filter,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
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
 const [teamCalendar, setTeamCalendar] = useState<TeamLeaveCalendar | null>(null);
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
   const calendar = await leaveAPI.getTeamCalendar(now.getMonth() + 1, now.getFullYear());
   setTeamCalendar(calendar);
  } catch (error: any) {
   console.error("Failed to load team calendar:", error);
  }
 };

 const handleApprove = async () => {
  if (!selectedLeave) return;

  setIsProcessing(true);
  try {
   await leaveAPI.approveLeave(selectedLeave.id, approvalNotes.trim() || undefined);

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

 const totalPages = Math.ceil(totalRecords / pageSize);

 return (
  <div className="space-y-8 pb-8">
   {/* Header */}
   <div>
    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
     Leave Approvals
    </h1>
    <p className="text-muted-foreground">Review and manage team leave requests</p>
   </div>

   {/* Stats Cards */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <Card className="">
     <CardHeader className="pb-3">
      <CardDescription className="flex items-center gap-2">
       <Clock className="h-4 w-4 text-amber-600" />
       Pending Approvals
      </CardDescription>
      <CardTitle className="text-3xl font-bold">{totalRecords}</CardTitle>
     </CardHeader>
     <CardContent>
      <p className="text-sm text-muted-foreground">Awaiting your review</p>
     </CardContent>
    </Card>

    <Card className="">
     <CardHeader className="pb-3">
      <CardDescription className="flex items-center gap-2">
       <Users className="h-4 w-4 text-indigo-600" />
       On Leave Today
      </CardDescription>
      <CardTitle className="text-3xl font-bold">
       {teamCalendar?.total_on_leave_today || 0}
      </CardTitle>
     </CardHeader>
     <CardContent>
      <p className="text-sm text-muted-foreground">Team members away</p>
     </CardContent>
    </Card>

    <Card className="">
     <CardHeader className="pb-3">
      <CardDescription className="flex items-center gap-2">
       <CalendarIcon className="h-4 w-4 text-blue-600" />
       Upcoming Leaves
      </CardDescription>
      <CardTitle className="text-3xl font-bold">
       {teamCalendar?.events.filter((e) => e.status === "approved").length || 0}
      </CardTitle>
     </CardHeader>
     <CardContent>
      <p className="text-sm text-muted-foreground">This month</p>
     </CardContent>
    </Card>
   </div>

   {/* Main Content Tabs */}
   <Tabs defaultValue="pending" className="space-y-6">
    <TabsList className="grid w-full max-w-md grid-cols-2">
     <TabsTrigger value="pending">
      <Clock className="h-4 w-4 mr-2" />
      Pending Requests
     </TabsTrigger>
     <TabsTrigger value="calendar">
      <CalendarIcon className="h-4 w-4 mr-2" />
      Team Calendar
     </TabsTrigger>
    </TabsList>

    {/* Pending Requests Tab */}
    <TabsContent value="pending" className="space-y-4">
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Pending Leave Requests
       </CardTitle>
       <CardDescription>Review and action pending leave requests from your team</CardDescription>
      </CardHeader>
      <CardContent>
       <div className="border rounded-lg">
        <Table>
         <TableHeader>
          <TableRow>
           <TableHead>Employee</TableHead>
           <TableHead>Type</TableHead>
           <TableHead>Start Date</TableHead>
           <TableHead>End Date</TableHead>
           <TableHead>Days</TableHead>
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
              <span className="text-muted-foreground">Loading...</span>
             </div>
            </TableCell>
           </TableRow>
          ) : pendingLeaves.length === 0 ? (
           <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
             <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500/50" />
              <p className="text-muted-foreground font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending leave requests</p>
             </div>
            </TableCell>
           </TableRow>
          ) : (
           pendingLeaves.map((leave) => (
            <TableRow key={leave.id} className="hover:bg-muted/50">
             <TableCell>
              <div>
               <p className="font-medium">{leave.employee_name}</p>
               {leave.employee_email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                 <Mail className="h-3 w-3" />
                 {leave.employee_email}
                </p>
               )}
              </div>
             </TableCell>
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
             <TableCell className="font-semibold">{leave.number_of_days}</TableCell>
             <TableCell className="max-w-[200px]">
              <p className="truncate text-sm" title={leave.reason}>
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
               >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
               </Button>
               <Button
                size="sm"
                variant="destructive"
                onClick={() => openRejectDialog(leave)}
               >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
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
        <div className="flex items-center justify-between mt-4">
         <p className="text-sm text-muted-foreground">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} requests
         </p>
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
           {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
             <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className="w-10"
             >
              {page}
             </Button>
            );
           })}
           {totalPages > 5 && <span className="text-muted-foreground">...</span>}
          </div>
          <Button
           variant="outline"
           size="sm"
           onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        {teamCalendar &&
         `${format(new Date(teamCalendar.year, teamCalendar.month - 1), "MMMM yyyy")}`}
       </CardDescription>
      </CardHeader>
      <CardContent>
       {teamCalendar && teamCalendar.events.length > 0 ? (
        <div className="space-y-3">
         {teamCalendar.events.map((event) => (
          <div
           key={event.id}
           className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
           <div className="flex items-start justify-between">
            <div className="flex-1">
             <div className="flex items-center gap-3 mb-2">
              <p className="font-semibold text-lg">{event.employee_name}</p>
              <Badge className={getLeaveTypeColor(event.leave_type)}>
               {event.leave_type}
              </Badge>
              <Badge
               variant="outline"
               className={
                event.status === "approved"
                 ? "border-emerald-500 text-emerald-700"
                 : "border-amber-500 text-amber-700"
               }
              >
               {event.status}
              </Badge>
             </div>
             <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
               <CalendarIcon className="h-3 w-3" />
               {format(parseISO(event.start_date), "MMM d")} -{" "}
               {format(parseISO(event.end_date), "MMM d, yyyy")}
              </span>
              <span className="font-semibold">
               {event.number_of_days} {event.number_of_days === 1 ? "day" : "days"}
              </span>
             </div>
            </div>
           </div>
          </div>
         ))}
        </div>
       ) : (
        <div className="flex flex-col items-center justify-center py-12">
         <CalendarIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
         <p className="text-muted-foreground">No leaves scheduled for this month</p>
        </div>
       )}
      </CardContent>
     </Card>
    </TabsContent>
   </Tabs>

   {/* Approve Dialog */}
   <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
    <DialogContent>
     <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-emerald-600">
       <CheckCircle2 className="h-5 w-5" />
       Approve Leave Request
      </DialogTitle>
      <DialogDescription>
       {selectedLeave && (
        <>
         You are approving {selectedLeave.number_of_days} day(s) of{" "}
         {selectedLeave.leave_type} leave for <strong>{selectedLeave.employee_name}</strong>
         <br />
         {format(parseISO(selectedLeave.start_date), "MMM d")} -{" "}
         {format(parseISO(selectedLeave.end_date), "MMM d, yyyy")}
        </>
       )}
      </DialogDescription>
     </DialogHeader>
     <div className="space-y-4 py-4">
      {selectedLeave && (
       <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <div>
         <p className="text-sm font-medium text-muted-foreground">Reason</p>
         <p className="text-sm">{selectedLeave.reason}</p>
        </div>
        {selectedLeave.contact_info && (
         <div>
          <p className="text-sm font-medium text-muted-foreground">Contact</p>
          <p className="text-sm">{selectedLeave.contact_info}</p>
         </div>
        )}
       </div>
      )}
      <div className="space-y-2">
       <Label htmlFor="approval-notes">Notes (Optional)</Label>
       <Textarea
        id="approval-notes"
        placeholder="Add any notes or conditions..."
        value={approvalNotes}
        onChange={(e) => setApprovalNotes(e.target.value)}
        rows={3}
        className="resize-none"
       />
      </div>
     </div>
     <DialogFooter>
      <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
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
      <DialogTitle className="flex items-center gap-2 text-rose-600">
       <XCircle className="h-5 w-5" />
       Reject Leave Request
      </DialogTitle>
      <DialogDescription>
       {selectedLeave && (
        <>
         You are rejecting {selectedLeave.number_of_days} day(s) of{" "}
         {selectedLeave.leave_type} leave for <strong>{selectedLeave.employee_name}</strong>
        </>
       )}
      </DialogDescription>
     </DialogHeader>
     <div className="space-y-4 py-4">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
       <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
       <div className="text-sm text-amber-800">
        <p className="font-medium mb-1">Rejection requires a reason</p>
        <p>Please provide a clear explanation for rejecting this leave request.</p>
       </div>
      </div>
      <div className="space-y-2">
       <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
       <Textarea
        id="rejection-reason"
        placeholder="Please explain why this leave request is being rejected..."
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        rows={4}
        className="resize-none"
       />
      </div>
     </div>
     <DialogFooter>
      <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
       Cancel
      </Button>
      <Button
       onClick={handleReject}
       disabled={isProcessing || !rejectionReason.trim()}
       variant="destructive"
      >
       {isProcessing ? "Rejecting..." : "Reject Leave"}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </div>
 );
}
