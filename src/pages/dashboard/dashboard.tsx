// Dashboard Page
// Main dashboard for HR_Admin showing key metrics and quick access
// Uses the unified DashboardLayout and design system

import { useAsgardeo } from "@asgardeo/react";
import {
  Users,
  Clock,
  CalendarDays,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
  PageSection,
} from "@/components/dashboard-layout";
import { DashboardCards } from "@/components/dashboard-cards";
import { AttendanceChart } from "@/components/attendance-chart";
import { RecentLeavesTable } from "@/components/recent-leaves-table";
import { RecentEmployees } from "@/components/recent-employees";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";

export default function Dashboard() {
  const { isSignedIn } = useAsgardeo();
  const { data, isLoading, error, refetch } = useDashboard({
    autoFetch: true,
    refreshInterval: 0, // Set to 60000 for 1-minute auto-refresh
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your organization"
        icon={<TrendingUp className="size-5" />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw
              className={`size-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link to="/dashboard/employees/onboard">
            <Button size="sm" className="gap-2">
              <UserPlus className="size-4" />
              <span className="hidden sm:inline">Onboard Employee</span>
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PageContent>
        {/* Authentication Warning */}
        {!isSignedIn && (
          <PageSection>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Not Authenticated</AlertTitle>
              <AlertDescription>
                Please sign in to view the dashboard data.
              </AlertDescription>
            </Alert>
          </PageSection>
        )}

        {/* Error Display */}
        {error && isSignedIn && (
          <PageSection>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={refetch}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </PageSection>
        )}

        {/* Dashboard Stats Cards */}
        <PageSection delay={1}>
          <DashboardCards data={data} isLoading={isLoading} />
        </PageSection>

        {/* Quick Actions */}
        <PageSection delay={2}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
            <Link to="/dashboard/employees">
              <Card className="card-accent-blue hover-lift cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
                    <Users className="size-4" />
                    Employees
                  </CardDescription>
                  <CardTitle className="text-lg flex items-center justify-between">
                    View All
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/dashboard/attendance">
              <Card className="card-accent-emerald hover-lift cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
                    <Clock className="size-4" />
                    Attendance
                  </CardDescription>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Check In/Out
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/dashboard/leave">
              <Card className="card-accent-amber hover-lift cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
                    <CalendarDays className="size-4" />
                    Leave
                  </CardDescription>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Apply Leave
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/dashboard/leave/approvals">
              <Card className="card-accent-violet hover-lift cursor-pointer group">
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
                    <CheckCircle2 className="size-4" />
                    Approvals
                  </CardDescription>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {isLoading ? (
                      <Skeleton className="h-5 w-8" />
                    ) : (
                      `${data?.leaveSummary?.pending_leaves ?? 0} Pending`
                    )}
                    <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </PageSection>

        {/* Attendance Chart */}
        <PageSection delay={3}>
          <div className="px-4 lg:px-6">
            <AttendanceChart
              data={data?.attendanceSummary ?? null}
              isLoading={isLoading}
            />
          </div>
        </PageSection>

        {/* Two Column Layout for Tables */}
        <PageSection delay={4}>
          <div className="px-4 lg:px-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Recent Leave Requests Table */}
            <RecentLeavesTable
              data={data?.recentLeaves ?? []}
              isLoading={isLoading}
              title="Pending Leave Requests"
              description="Recent leave requests awaiting approval"
            />

            {/* Recent Employees Table */}
            <RecentEmployees
              data={data?.employees ?? []}
              isLoading={isLoading}
              title="Employee Directory"
              description="Recent employees in the system"
              limit={5}
            />
          </div>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
