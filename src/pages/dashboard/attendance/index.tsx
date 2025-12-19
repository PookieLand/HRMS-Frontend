// My Attendance Page - Modernized with Charts and Calendar
// Personal attendance tracking with check-in/out functionality
// Shows daily status, weekly reports with charts, and monthly summaries

import { useEffect, useState } from "react";
import { useAttendanceAPI } from "@/lib/api/attendance";
import type {
  AttendanceRecord,
  WeeklyAttendanceReport,
  AttendanceSummary,
} from "@/lib/api/attendance";
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
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { IconTrendingUp } from "@tabler/icons-react";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

// Status badge styling - consistent with design system
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "present":
      return "status-success";
    case "late":
      return "status-warning";
    case "absent":
      return "status-error";
    case "on_leave":
      return "status-info";
    case "short_leave":
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
    case "overtime":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20";
    default:
      return "status-neutral";
  }
}

// Chart configuration
const chartConfig = {
  hours: {
    label: "Hours Worked",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function AttendancePage() {
  const attendanceAPI = useAttendanceAPI();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [weeklyReport, setWeeklyReport] =
    useState<WeeklyAttendanceReport | null>(null);
  const [monthlySummary, setMonthlySummary] =
    useState<AttendanceSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Get today's attendance
      const today = await attendanceAPI.getMyAttendanceToday();
      setTodayRecord(today);
      setIsCheckedIn(!!today && !today.check_out_time);

      // Get recent attendance history
      const recent = await attendanceAPI.getMyAttendance({
        limit: 10,
        offset: 0,
      });
      setRecentRecords(recent);

      // Get monthly summary and employee ID from first record
      const now = new Date();
      let employeeIdFromRecord = 0;
      let monthlySummaryData = null;

      if (recent.length > 0) {
        employeeIdFromRecord = parseInt(recent[0].employee_id) || 0;

        try {
          const summary = await attendanceAPI.getMonthlySummary(
            employeeIdFromRecord,
            now.getMonth() + 1,
            now.getFullYear(),
          );

          // Transform summary to match old format
          monthlySummaryData = {
            employee_id: String(employeeIdFromRecord),
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            total_days: summary.total_days_present + summary.total_days_absent,
            present_days: summary.total_days_present,
            absent_days: summary.total_days_absent,
            late_days: summary.total_days_late,
            leave_days: 0, // Not provided by backend
            total_hours_worked: summary.total_hours_worked,
            average_hours_per_day: summary.average_hours_per_day,
            overtime_hours: summary.overtime_hours,
            short_leave_count: 0, // Not provided by backend
            attendance_percentage: summary.attendance_percentage,
          };
        } catch (summaryError) {
          console.error("Failed to load monthly summary:", summaryError);
          // Create a basic summary from available data
          monthlySummaryData = {
            employee_id: String(employeeIdFromRecord),
            period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
            total_days: recent.length,
            present_days: recent.filter((r) => r.status === "present").length,
            absent_days: recent.filter((r) => r.status === "absent").length,
            late_days: recent.filter((r) => r.status === "late").length,
            leave_days: recent.filter((r) => r.status === "on_leave").length,
            total_hours_worked: recent.reduce(
              (sum, r) => sum + (r.duration_hours || 0),
              0,
            ),
            average_hours_per_day:
              recent.length > 0
                ? recent.reduce((sum, r) => sum + (r.duration_hours || 0), 0) /
                  recent.length
                : 0,
            overtime_hours: recent.reduce(
              (sum, r) => sum + (r.overtime_hours || 0),
              0,
            ),
            short_leave_count: recent.filter((r) => r.status === "short_leave")
              .length,
            attendance_percentage:
              recent.length > 0
                ? (recent.filter(
                    (r) => r.status === "present" || r.status === "late",
                  ).length /
                    recent.length) *
                  100
                : 0,
          };
        }
      } else {
        // No records available, create empty summary
        monthlySummaryData = {
          employee_id: "0",
          period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
          leave_days: 0,
          total_hours_worked: 0,
          average_hours_per_day: 0,
          overtime_hours: 0,
          short_leave_count: 0,
          attendance_percentage: 0,
        };
      }

      setMonthlySummary(monthlySummaryData);

      // Create weekly report from recent records
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const weeklyRecords = recent.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= startOfWeek && recordDate <= now;
      });

      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        const dateStr = day.toISOString().split("T")[0];
        const record = weeklyRecords.find((r) => r.date === dateStr);

        return {
          date: dateStr,
          day_name: day.toLocaleDateString("en-US", { weekday: "short" }),
          check_in: record?.check_in_time,
          check_out: record?.check_out_time,
          hours_worked: record?.duration_hours || 0,
          status: record?.status || "absent",
        };
      });

      setWeeklyReport({
        employee_id: String(employeeIdFromRecord),
        week_start: startOfWeek.toISOString().split("T")[0],
        week_end: now.toISOString().split("T")[0],
        days: weekDays,
        total_hours: weekDays.reduce((sum, day) => sum + day.hours_worked, 0),
        total_days_present: weekDays.filter(
          (d) => d.status === "present" || d.status === "late",
        ).length,
        overtime_hours: monthlySummaryData?.overtime_hours || 0,
      });
    } catch (error: any) {
      console.error("Failed to load attendance data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load attendance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      // Call self check-in endpoint with empty data object
      await attendanceAPI.checkIn({});

      toast({
        title: "Checked In Successfully",
        description: `Welcome! You checked in at ${format(new Date(), "hh:mm a")}`,
      });

      await loadAttendanceData(true);
    } catch (error: any) {
      toast({
        title: "Check-In Failed",
        description: error.message || "Unable to check in",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async () => {
    try {
      // Call self check-out endpoint with empty data object
      await attendanceAPI.checkOut({});

      toast({
        title: "Checked Out Successfully",
        description: `See you tomorrow! You checked out at ${format(new Date(), "hh:mm a")}`,
      });

      await loadAttendanceData(true);
    } catch (error: any) {
      toast({
        title: "Check-Out Failed",
        description: error.message || "Unable to check out",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Prepare chart data for weekly view
  const prepareWeeklyChartData = () => {
    if (!weeklyReport) return [];

    return weeklyReport.days.map((day) => ({
      day: format(parseISO(day.date), "EEE"),
      date: format(parseISO(day.date), "MMM d"),
      hours: day.hours_worked || 0,
      status: day.status,
    }));
  };

  // Get color for bar based on status
  const getBarColor = (status: string) => {
    switch (status) {
      case "present":
        return "hsl(142, 76%, 36%)"; // green
      case "late":
        return "hsl(38, 92%, 50%)"; // orange
      case "absent":
        return "hsl(0, 84%, 60%)"; // red
      case "on_leave":
        return "hsl(214, 100%, 50%)"; // blue
      default:
        return "hsl(var(--muted-foreground))"; // gray
    }
  };

  // Loading state
  if (loading && !todayRecord) {
    return (
      <DashboardLayout>
        <PageHeader title="My Attendance" icon={<Clock className="size-5" />} />
        <PageContent>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
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

  const weeklyChartData = prepareWeeklyChartData();

  return (
    <DashboardLayout>
      <PageHeader
        title="My Attendance"
        description="Track your work hours and attendance history"
        icon={<Clock className="size-7" />}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadAttendanceData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`size-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </PageHeader>

      <PageContent>
        {/* Check In/Out Card */}
        <PageSection delay={1}>
          <Card className="overflow-hidden relative border-2 hover-lift">
            <div className="absolute inset-0 bg-linear-to-br from-primary/3 via-background to-primary/3 dark:from-primary/5 dark:to-primary/3 pointer-events-none" />
            <CardContent className="p-6 md:p-8 relative">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                    <Clock className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                  </div>
                  <div className="text-center lg:text-left">
                    <h2 className="text-xl md:text-2xl font-bold mb-1">
                      {format(currentTime, "EEEE, MMMM d")}
                    </h2>
                    <p className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums">
                      {format(currentTime, "HH:mm:ss")}
                    </p>
                    {todayRecord && (
                      <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                        <Badge
                          variant="outline"
                          className={getStatusBadgeClass(todayRecord.status)}
                        >
                          {todayRecord.status.replace("_", " ").toUpperCase()}
                        </Badge>
                        {todayRecord.check_in_time && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <LogIn className="size-3" />
                            {format(
                              parseISO(todayRecord.check_in_time),
                              "hh:mm a",
                            )}
                          </span>
                        )}
                        {todayRecord.check_out_time && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <LogOut className="size-3" />
                            {format(
                              parseISO(todayRecord.check_out_time),
                              "hh:mm a",
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full lg:w-auto">
                  {!isCheckedIn ? (
                    <Button
                      size="lg"
                      onClick={handleCheckIn}
                      className="h-14 px-8 text-lg gap-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    >
                      <LogIn className="size-5" />
                      Check In
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleCheckOut}
                      className="h-14 px-8 text-lg gap-2 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700"
                    >
                      <LogOut className="size-5" />
                      Check Out
                    </Button>
                  )}
                  {todayRecord?.location && (
                    <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                      <MapPin className="size-3" />
                      {todayRecord.location}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* Stats Cards */}
        <PageSection delay={2}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Days Present
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {monthlySummary?.present_days || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {monthlySummary?.attendance_percentage.toFixed(1) || 0}%
                  attendance
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Timer className="size-4 text-blue-600" />
                  Hours Worked
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {monthlySummary?.total_hours_worked.toFixed(1) || 0}h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Avg: {monthlySummary?.average_hours_per_day.toFixed(1) || 0}
                  h/day
                </p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <IconTrendingUp className="size-4 text-violet-600" />
                  Overtime
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {monthlySummary?.overtime_hours.toFixed(1) || 0}h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <XCircle className="size-4 text-amber-600" />
                  Late Arrivals
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {monthlySummary?.late_days || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>
        </PageSection>

        {/* Weekly Report & Calendar */}
        <PageSection delay={3}>
          <Tabs defaultValue="weekly" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="weekly" className="gap-2">
                <BarChart3 className="size-4" />
                Weekly View
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="size-4" />
                Calendar
              </TabsTrigger>
            </TabsList>

            {/* Weekly View with Chart */}
            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5" />
                    This Week's Performance
                  </CardTitle>
                  <CardDescription>
                    {weeklyReport &&
                      format(parseISO(weeklyReport.week_start), "MMM d")}{" "}
                    -{" "}
                    {weeklyReport &&
                      format(parseISO(weeklyReport.week_end), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weeklyReport && (
                    <div className="space-y-6">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Hours
                          </p>
                          <p className="text-2xl font-bold tabular-nums">
                            {weeklyReport.total_hours.toFixed(1)}h
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Days Present
                          </p>
                          <p className="text-2xl font-bold tabular-nums">
                            {weeklyReport.total_days_present}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Avg Hours/Day
                          </p>
                          <p className="text-2xl font-bold tabular-nums">
                            {weeklyReport.total_days_present > 0
                              ? (
                                  weeklyReport.total_hours /
                                  weeklyReport.total_days_present
                                ).toFixed(1)
                              : "0.0"}
                            h
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Status
                          </p>
                          <p className="text-2xl font-bold">
                            {weeklyReport.total_days_present >= 5 ? "✓" : "!"}
                          </p>
                        </div>
                      </div>

                      {/* Hours Worked Bar Chart */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">
                          Daily Hours Breakdown
                        </h3>
                        <ChartContainer
                          config={chartConfig}
                          className="h-[250px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={weeklyChartData}
                              margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="hsl(var(--border))"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="day"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                label={{
                                  value: "Hours",
                                  angle: -90,
                                  position: "insideLeft",
                                  style: { fontSize: 12 },
                                }}
                              />
                              <ChartTooltip
                                cursor={{
                                  fill: "hsl(var(--muted))",
                                  opacity: 0.3,
                                }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                                        <p className="font-medium text-sm mb-1">
                                          {data.date}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {data.day}
                                        </p>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-2 h-2 rounded-full"
                                              style={{
                                                backgroundColor: getBarColor(
                                                  data.status,
                                                ),
                                              }}
                                            />
                                            <span className="text-xs">
                                              {formatDuration(data.hours)}
                                            </span>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`${getStatusBadgeClass(data.status)} text-xs`}
                                          >
                                            {data.status.replace("_", " ")}
                                          </Badge>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar
                                dataKey="hours"
                                radius={[8, 8, 0, 0]}
                                maxBarSize={60}
                              >
                                {weeklyChartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={getBarColor(entry.status)}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>

                      {/* Detailed Day List */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium mb-3">
                          Daily Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2">
                          {weeklyReport.days.map((day, index) => (
                            <Card
                              key={day.date}
                              className="p-4 hover-lift animate-in"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <div className="space-y-2">
                                <div className="text-center">
                                  <p className="text-xs font-medium text-muted-foreground uppercase">
                                    {format(parseISO(day.date), "EEE")}
                                  </p>
                                  <p className="text-lg font-bold">
                                    {format(parseISO(day.date), "d")}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`${getStatusBadgeClass(day.status)} w-full justify-center text-xs`}
                                >
                                  {day.status === "present"
                                    ? "✓"
                                    : day.status === "late"
                                      ? "⚠"
                                      : day.status === "absent"
                                        ? "✗"
                                        : "-"}
                                </Badge>
                                {day.hours_worked && day.hours_worked > 0 ? (
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">
                                      Hours
                                    </p>
                                    <p className="text-sm font-semibold tabular-nums">
                                      {day.hours_worked.toFixed(1)}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-muted-foreground">
                                    No data
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar View */}
            <TabsContent value="calendar" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="size-5" />
                      Attendance Calendar
                    </CardTitle>
                    <CardDescription>
                      Select a date to view details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center w-full">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) =>
                          date && setSelectedDate(date)
                        }
                        className="rounded-lg border shadow-sm w-full [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
                        captionLayout="dropdown"
                        buttonVariant="ghost"
                        modifiers={{
                          present: recentRecords
                            .filter((r) => r.status === "present")
                            .map((r) => parseISO(r.date)),
                          late: recentRecords
                            .filter((r) => r.status === "late")
                            .map((r) => parseISO(r.date)),
                          absent: recentRecords
                            .filter((r) => r.status === "absent")
                            .map((r) => parseISO(r.date)),
                        }}
                        modifiersClassNames={{
                          present:
                            "bg-green-600 text-white font-semibold hover:bg-green-700 data-[selected-single=true]:bg-green-600 data-[selected-single=true]:text-white",
                          late: "bg-amber-500 text-white font-semibold hover:bg-amber-600 data-[selected-single=true]:bg-amber-500 data-[selected-single=true]:text-white",
                          absent:
                            "bg-red-500 text-white font-semibold hover:bg-red-600 data-[selected-single=true]:bg-red-500 data-[selected-single=true]:text-white",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Records */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="size-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Last 10 attendance records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {recentRecords.length > 0 ? (
                        recentRecords.map((record, index) => (
                          <div
                            key={record.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-sm">
                                {format(parseISO(record.date), "EEEE, MMM d")}
                              </p>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(record.status)}
                              >
                                {record.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              {record.check_in_time && (
                                <span className="flex items-center gap-1">
                                  <LogIn className="size-3" />
                                  {format(
                                    parseISO(record.check_in_time),
                                    "hh:mm a",
                                  )}
                                </span>
                              )}
                              {record.check_out_time && (
                                <span className="flex items-center gap-1">
                                  <LogOut className="size-3" />
                                  {format(
                                    parseISO(record.check_out_time),
                                    "hh:mm a",
                                  )}
                                </span>
                              )}
                              {record.duration_hours && (
                                <span className="flex items-center gap-1">
                                  <Timer className="size-3" />
                                  {formatDuration(record.duration_hours)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="size-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No attendance records found</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Calendar Legend */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-emerald-600" />
                      <span className="text-sm text-muted-foreground">
                        Present
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-600" />
                      <span className="text-sm text-muted-foreground">
                        Late
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-rose-600" />
                      <span className="text-sm text-muted-foreground">
                        Absent
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded border-2 border-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        No Record
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
