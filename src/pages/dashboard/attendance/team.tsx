import { useEffect, useState } from "react";
import { useAttendanceAPI } from "@/lib/api/attendance";
import type { AttendanceRecord, DailyAttendanceMetrics } from "@/lib/api/attendance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Search,
  Download,
  Calendar,
  BarChart3,
  UserCheck,
  UserX,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeamAttendancePage() {
  const attendanceAPI = useAttendanceAPI();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [teamAttendance, setTeamAttendance] = useState<AttendanceRecord[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyAttendanceMetrics | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    loadTeamAttendance();
    loadDailyMetrics();
  }, [selectedDate, statusFilter, currentPage]);

  const loadTeamAttendance = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getTeamAttendance({
        date: selectedDate,
        status: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        page_size: pageSize,
      });

      setTeamAttendance(response.records);
      setTotalRecords(response.total);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load team attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDailyMetrics = async () => {
    try {
      const metrics = await attendanceAPI.getDailyMetrics(selectedDate);
      setDailyMetrics(metrics);
    } catch (error: any) {
      console.error("Failed to load metrics:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
      late: "bg-amber-500/10 text-amber-700 border-amber-200",
      absent: "bg-rose-500/10 text-rose-700 border-rose-200",
      on_leave: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
      short_leave: "bg-orange-500/10 text-orange-700 border-orange-200",
      overtime: "bg-violet-500/10 text-violet-700 border-violet-200",
    };
    return colors[status] || "bg-gray-500/10 text-gray-700 border-gray-200";
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return "N/A";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const filteredAttendance = teamAttendance.filter((record) =>
    searchQuery
      ? record.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Downloading team attendance report...",
    });
    // Export logic would go here
  };

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Team Attendance
          </h1>
          <p className="text-muted-foreground">Monitor your team's attendance and work hours</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Metrics Cards */}
      {dailyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Checked In
              </CardDescription>
              <CardTitle className="text-3xl font-bold">
                {dailyMetrics.checked_in}
                <span className="text-lg text-muted-foreground ml-2">
                  / {dailyMetrics.total_employees}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${(dailyMetrics.checked_in / dailyMetrics.total_employees) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm font-semibold">{dailyMetrics.attendance_rate.toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-rose-600" />
                Not Checked In
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{dailyMetrics.not_checked_in}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {((dailyMetrics.not_checked_in / dailyMetrics.total_employees) * 100).toFixed(1)}% of
                team
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                On Leave
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{dailyMetrics.on_leave}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Approved leaves today</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Late Arrivals
              </CardDescription>
              <CardTitle className="text-3xl font-bold">{dailyMetrics.late_arrivals}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">After scheduled time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>View and manage team attendance records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-[200px]"
            />
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Notes</TableHead>
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
                ) : filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No attendance records found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{record.employee_name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.check_in_time
                          ? format(parseISO(record.check_in_time), "hh:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {record.check_out_time
                          ? format(parseISO(record.check_out_time), "hh:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatDuration(record.duration_hours)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.location || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {record.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
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
    </div>
  );
}
