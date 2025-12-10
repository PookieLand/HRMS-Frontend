import { useEffect, useState } from "react";
import { useAttendanceAPI } from "@/lib/api/attendance";
import type {
  AttendanceRecord,
  WeeklyAttendanceReport,
  AttendanceSummary,
} from "@/lib/api/attendance";
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
} from "lucide-react";
import { format, parseISO } from "date-fns";

export default function AttendancePage() {
  const attendanceAPI = useAttendanceAPI();
  const { getDecodedIdToken } = useAsgardeo();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [weeklyReport, setWeeklyReport] =
    useState<WeeklyAttendanceReport | null>(null);
  const [monthlySummary, setMonthlySummary] =
    useState<AttendanceSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState<string>("");

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

  const loadAttendanceData = async () => {
    setLoading(true);
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
    }
  };

  const handleCheckIn = async () => {
    try {
      await attendanceAPI.checkIn({
        employee_id: employeeId,
        location: "Office", // Could be enhanced with geolocation
      });

      toast({
        title: "Checked In Successfully",
        description: `Welcome! You checked in at ${format(new Date(), "hh:mm a")}`,
      });

      await loadAttendanceData();
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

      await loadAttendanceData();
    } catch (error: any) {
      toast({
        title: "Check-Out Failed",
        description: error.message || "Unable to check out",
        variant: "destructive",
      });
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

  if (loading && !todayRecord) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-sm text-muted-foreground">
            Loading attendance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1
          className="text-4xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          My Attendance
        </h1>
        <p className="text-muted-foreground">
          Track your work hours and attendance history
        </p>
      </div>

      {/* Check In/Out Card */}
      <Card className="border-2 shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50" />
        <CardContent className="p-8 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {format(new Date(), "EEEE, MMMM d")}
                </h2>
                <p
                  className="text-5xl font-bold tracking-tight"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {format(new Date(), "HH:mm:ss")}
                </p>
                {todayRecord && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge className={getStatusColor(todayRecord.status)}>
                      {todayRecord.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    {todayRecord.check_in_time && (
                      <p className="text-sm text-muted-foreground">
                        In:{" "}
                        {format(parseISO(todayRecord.check_in_time), "hh:mm a")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {!isCheckedIn ? (
                <Button
                  size="lg"
                  onClick={handleCheckIn}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg h-16 px-8 text-lg"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Check In
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleCheckOut}
                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg h-16 px-8 text-lg"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Check Out
                </Button>
              )}
              {todayRecord?.location && (
                <p className="text-sm text-center text-muted-foreground flex items-center justify-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {todayRecord.location}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Days Present
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {monthlySummary?.present_days || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {monthlySummary?.attendance_percentage.toFixed(1)}% attendance
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-blue-600" />
              Hours Worked
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {monthlySummary?.total_hours_worked.toFixed(1) || 0}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Avg: {monthlySummary?.average_hours_per_day.toFixed(1)}h/day
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Overtime
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {monthlySummary?.overtime_hours.toFixed(1) || 0}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-amber-600" />
              Late Arrivals
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {monthlySummary?.late_days || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Report & Calendar */}
      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="weekly">
            <BarChart3 className="h-4 w-4 mr-2" />
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
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
                      <p className="text-2xl font-bold">
                        {weeklyReport.total_hours.toFixed(1)}h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Days Present
                      </p>
                      <p className="text-2xl font-bold">
                        {weeklyReport.total_days_present}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {weeklyReport.days.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
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
                          <Badge className={getStatusColor(day.status)}>
                            {day.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          {day.check_in && (
                            <div>
                              <p className="text-muted-foreground">In</p>
                              <p className="font-mono font-semibold">
                                {format(parseISO(day.check_in), "hh:mm a")}
                              </p>
                            </div>
                          )}
                          {day.check_out && (
                            <div>
                              <p className="text-muted-foreground">Out</p>
                              <p className="font-mono font-semibold">
                                {format(parseISO(day.check_out), "hh:mm a")}
                              </p>
                            </div>
                          )}
                          {day.hours_worked && (
                            <div>
                              <p className="text-muted-foreground">Hours</p>
                              <p className="font-mono font-semibold">
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
                <CalendarIcon className="h-5 w-5" />
                Attendance Calendar
              </CardTitle>
              <CardDescription>View your attendance history</CardDescription>
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
                    {recentRecords.map((record) => (
                      <div
                        key={record.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold">
                            {format(parseISO(record.date), "EEEE, MMM d, yyyy")}
                          </p>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {record.check_in_time && (
                            <span className="flex items-center gap-1">
                              <LogIn className="h-3 w-3" />
                              {format(
                                parseISO(record.check_in_time),
                                "hh:mm a",
                              )}
                            </span>
                          )}
                          {record.check_out_time && (
                            <span className="flex items-center gap-1">
                              <LogOut className="h-3 w-3" />
                              {format(
                                parseISO(record.check_out_time),
                                "hh:mm a",
                              )}
                            </span>
                          )}
                          {record.duration_hours && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
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
    </div>
  );
}
