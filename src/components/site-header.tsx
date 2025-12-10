import { useLocation } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationPanel } from "@/components/notification-panel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

// Route label mapping for breadcrumbs
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  onboard: "Onboard Employee",
  onboarding: "Onboarding Status",
  teams: "Teams & Hierarchy",
  reports: "Reports & Analytics",
  attendance: "Attendance",
  team: "Team Attendance",
  leave: "Leave Management",
  approvals: "Pending Approvals",
  governance: "Governance",
  audit: "Audit Logs",
  compliance: "Compliance",
  settings: "Settings",
  users: "Employees", // Map old route to new label
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> =
    [];

  let currentPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip numeric IDs in breadcrumbs (like /employees/123)
    if (/^\d+$/.test(segment)) {
      breadcrumbs.push({
        label: `#${segment}`,
        href: currentPath,
        isLast: i === segments.length - 1,
      });
      continue;
    }

    const label =
      routeLabels[segment] ||
      segment.charAt(0).toUpperCase() + segment.slice(1);

    breadcrumbs.push({
      label,
      href: currentPath,
      isLast: i === segments.length - 1,
    });
  }

  return breadcrumbs;
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];

  if (!lastSegment) return "Dashboard";

  // Handle numeric IDs
  if (/^\d+$/.test(lastSegment)) {
    const parentSegment = segments[segments.length - 2];
    return routeLabels[parentSegment] || "Details";
  }

  return (
    routeLabels[lastSegment] ||
    lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  );
}

export function SiteHeader() {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* Left section: Sidebar trigger and breadcrumbs */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4 hidden sm:block"
          />

          {/* Desktop: Full breadcrumbs */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={crumb.href}>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="font-medium">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink
                        href={crumb.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </BreadcrumbLink>
                      {index < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Mobile: Just page title */}
          <h1 className="md:hidden text-sm font-medium truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right section: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatedThemeToggler className="flex items-center justify-center size-9 rounded-lg border bg-background hover:bg-accent transition-colors" />
          <NotificationPanel />
        </div>
      </div>
    </header>
  );
}
