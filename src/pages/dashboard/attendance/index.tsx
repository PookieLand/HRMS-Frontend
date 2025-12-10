// My Attendance Page
// Personal attendance tracking with check-in/out functionality
// Shows daily status, weekly reports, and monthly summaries

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
import { useAsgardeo } from "@asgardeo/react";
import {
  Clock,
  Calendar as CalendarIcon,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { format, parseISO } from "date-fns";

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

export default function AttendancePage() {
  const attendanceAPI = useAttendanceAPI();
  const { getDecodedIdToken } = useAsgardeo();
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
  const [employeeId, setEmployeeId] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getEmployeeId = async () => {
      try {
        const decodedToken = await getDecodedIdToken();
        const id = (decodedToken?.sub as string) || "";
        setEmployeeId(id);
      } catch (error) {
        console.error("Failed to get employee ID:", error);
      }
    };
    getEmployeeId();
  }, [getDecodedIdToken]);

  useEffect(() => {
    if (employeeId) {
      loadAttendanceData();
    }
  }, [employeeId]);

  const loadAttendanceData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [today, recent, weekly, summary] = await Promise.all([
        attendanceAPI.getTodayAttendance(employeeId),
        attendanceAPI.getMyAttendance({ page: 1, page_size: 10 }),
        attendanceAPI.getWeeklyReport(),
        attendanceAPI.getMySummary("month"),
      ]);

      setTodayRecord(today);
      setIsCheckedIn(!!today && !today.check_out_time);
      setRecentRecords(recent.records);
      setWeeklyReport(weekly);
      setMonthlySummary(summary);
    } catch (error: any) {
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
      await attendanceAPI.checkIn({
        employee_id: employeeId,
        location: "Office",
      });

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
      await attendanceAPI.checkOut({
        employee_id: employeeId,
      });

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
    if (!hours) return "N/A";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
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

  return (
    <DashboardLayout>
      <PageHeader
        title="My Attendance"
        description="Track your work hours and attendance history"
        icon={<Clock className="size-5" />}
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
          <Card className="overflow-hidden relative border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-primary/10 dark:to-primary/5" />
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
            <Card className="card-accent-emerald hover-lift">
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

            <Card className="card-accent-blue hover-lift">
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

            <Card className="card-accent-violet hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider">
                  <TrendingUp className="size-4 text-violet-600" />
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

            <Card className="card-accent-amber hover-lift">
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

            <TabsContent value="weekly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="size-5" />
                    This Week's Summary
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
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
                      </div>

                      <div className="space-y-2">
                        {weeklyReport.days.map((day, index) => (
                          <div
                            key={day.date}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-center min-w-[60px]">
                                <p className="text-xs font-medium text-muted-foreground uppercase">
                                  {day.day_name}
                                </p>
                                <p className="text-sm font-bold">
                                  {format(parseISO(day.date), "MMM d")}
                                </p>
                              </div>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(day.status)}
                              >
                                {day.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              {day.check_in && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    In
                                  </p>
                                  <p className="font-semibold tabular-nums">
                                    {format(parseISO(day.check_in), "hh:mm a")}
                                  </p>
                                </div>
                              )}
                              {day.check_out && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Out
                                  </p>
                                  <p className="font-semibold tabular-nums">
                                    {format(parseISO(day.check_out), "hh:mm a")}
                                  </p>
                                </div>
                              )}
                              {day.hours_worked && (
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Hours
                                  </p>
                                  <p className="font-semibold tabular-nums">
                                    {formatDuration(day.hours_worked)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="size-5" />
                    Attendance Calendar
                  </CardTitle>
                  <CardDescription>
                    View your attendance history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) =>
                        date && setSelectedDate(date)
                      }
                      className="rounded-md border"
                    />
                    <div className="flex-1 space-y-4">
                      <h3 className="font-semibold text-lg">Recent Records</h3>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {recentRecords.map((record, index) => (
                          <div
                            key={record.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold">
                                {format(
                                  parseISO(record.date),
                                  "EEEE, MMM d, yyyy",
                                )}
                              </p>
                              <Badge
                                variant="outline"
                                className={getStatusBadgeClass(record.status)}
                              >
                                {record.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                        ))}
                      </div>
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
