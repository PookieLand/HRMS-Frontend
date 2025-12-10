import {
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconCalendarCheck,
  IconCalendarOff,
  IconClock,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardData } from "@/lib/api/dashboard";

interface DashboardCardsProps {
  data: DashboardData | null;
  isLoading: boolean;
}

export function DashboardCards({ data, isLoading }: DashboardCardsProps) {
  if (isLoading) {
    return <DashboardCardsSkeleton />;
  }

  const totalEmployees = data?.totalEmployees ?? 0;
  const checkedIn = data?.attendanceSummary?.checked_in ?? 0;
  const notCheckedIn = data?.attendanceSummary?.not_checked_in ?? 0;
  const present = data?.attendanceSummary?.present ?? 0;
  const late = data?.attendanceSummary?.late ?? 0;
  const pendingLeaves = data?.leaveSummary?.pending_leaves ?? 0;
  const approvedLeaves = data?.leaveSummary?.approved_leaves ?? 0;

  // Calculate attendance rate
  const attendanceRate =
    totalEmployees > 0 ? Math.round((checkedIn / totalEmployees) * 100) : 0;

  // Determine if attendance is good (>= 90%)
  const isAttendanceGood = attendanceRate >= 90;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6">
      {/* Total Employees Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Employees</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalEmployees}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <IconUsers className="size-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Workforce overview <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total registered employees
          </div>
        </CardFooter>
      </Card>

      {/* Today's Attendance Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today's Attendance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {checkedIn} / {totalEmployees}
          </CardTitle>
          <CardAction>
            <Badge
              variant={isAttendanceGood ? "outline" : "destructive"}
              className="gap-1"
            >
              {isAttendanceGood ? (
                <IconTrendingUp className="size-3" />
              ) : (
                <IconTrendingDown className="size-3" />
              )}
              {attendanceRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {present} present, {late} late{" "}
            <IconCalendarCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {notCheckedIn} not checked in yet
          </div>
        </CardFooter>
      </Card>

      {/* Pending Leave Requests Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Leave Requests</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingLeaves}
          </CardTitle>
          <CardAction>
            <Badge
              variant={pendingLeaves > 5 ? "destructive" : "outline"}
              className="gap-1"
            >
              <IconClock className="size-3" />
              {pendingLeaves > 0 ? "Action needed" : "All clear"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting approval <IconCalendarOff className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {approvedLeaves} approved this period
          </div>
        </CardFooter>
      </Card>

      {/* Leave Statistics Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Leave Statistics</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data?.leaveSummary?.total_leaves ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <IconTrendingUp className="size-3" />
              Total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {approvedLeaves} approved,{" "}
            {data?.leaveSummary?.rejected_leaves ?? 0} rejected
          </div>
          <div className="text-muted-foreground">
            {data?.leaveSummary?.cancelled_leaves ?? 0} cancelled
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function DashboardCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="@container/card">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20 mt-2" />
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
