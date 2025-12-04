import { AppSidebar } from "@/components/app-sidebar";
import { DashboardCards } from "@/components/dashboard-cards";
import { AttendanceChart } from "@/components/attendance-chart";
import { RecentLeavesTable } from "@/components/recent-leaves-table";
import { RecentEmployees } from "@/components/recent-employees";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAsgardeo } from "@asgardeo/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

export default function Dashboard() {
  const { isSignedIn } = useAsgardeo();
  const { data, isLoading, error, refetch } = useDashboard({
    autoFetch: true,
    refreshInterval: 0, // Set to 60000 for 1-minute auto-refresh
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Authentication Warning */}
              {!isSignedIn && (
                <div className="px-4 lg:px-6">
                  <Alert variant="destructive">
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertTitle>Not Authenticated</AlertTitle>
                    <AlertDescription>
                      Please sign in to view the dashboard data.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Error Display */}
              {error && isSignedIn && (
                <div className="px-4 lg:px-6">
                  <Alert variant="destructive">
                    <IconAlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Dashboard</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>{error}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={refetch}
                        className="ml-4"
                      >
                        <IconRefresh className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Dashboard Stats Cards */}
              <DashboardCards data={data} isLoading={isLoading} />

              {/* Attendance Chart */}
              <div className="px-4 lg:px-6">
                <AttendanceChart
                  data={data?.attendanceSummary ?? null}
                  isLoading={isLoading}
                />
              </div>

              {/* Two Column Layout for Tables */}
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

              {/* Refresh Button */}
              {isSignedIn && !isLoading && (
                <div className="px-4 lg:px-6 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refetch}
                    className="gap-2"
                  >
                    <IconRefresh className="h-4 w-4" />
                    Refresh Data
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
