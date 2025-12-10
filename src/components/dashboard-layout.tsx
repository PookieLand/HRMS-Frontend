import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * DashboardLayout - Consistent wrapper for all dashboard pages
 *
 * Provides:
 * - Sidebar navigation
 * - Site header with notifications
 * - Consistent spacing and padding
 * - Animation support for page content
 */
export function DashboardLayout({ children, className }: DashboardLayoutProps) {
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
        <main
          className={cn(
            "flex flex-1 flex-col min-h-[calc(100vh-var(--header-height))]",
            className,
          )}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * PageHeader - Consistent header section for dashboard pages
 */
export function PageHeader({
  title,
  description,
  children,
  className,
  icon,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        "px-4 lg:px-6 py-6",
        "animate-in",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          {icon && (
            <span className="flex items-center justify-center size-10 rounded-xl bg-primary text-primary-foreground">
              {icon}
            </span>
          )}
          <span>{title}</span>
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageContent - Main content area with consistent padding
 */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex-1 px-4 lg:px-6 pb-8 space-y-6", className)}>
      {children}
    </div>
  );
}

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/**
 * PageSection - Animated section with staggered reveal
 */
export function PageSection({
  children,
  className,
  delay = 0,
}: PageSectionProps) {
  const delayClass =
    delay > 0 ? `animate-delay-${Math.min(delay * 100, 800)}` : "";

  return (
    <section
      className={cn("animate-in", delayClass, className)}
      style={delay > 0 ? { animationDelay: `${delay * 100}ms` } : undefined}
    >
      {children}
    </section>
  );
}
