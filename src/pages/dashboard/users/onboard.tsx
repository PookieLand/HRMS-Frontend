import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useAsgardeo } from "@asgardeo/react";
import { ArrowLeft, Shield, AlertCircle, UserPlus } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { OnboardingForm } from "@/components/onboarding-form";
import { type UserRole, canInitiateOnboarding } from "@/lib/api/users";

export default function OnboardPage() {
  const { isSignedIn, getAccessToken, getDecodedIdToken } = useAsgardeo();
  const [accessToken, setAccessToken] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get access token and user role
  useEffect(() => {
    const init = async () => {
      if (!isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getAccessToken();
        setAccessToken(token);

        const decodedToken = await getDecodedIdToken();
        const groups = (decodedToken?.groups as string[]) || [];

        // Map groups to role
        if (
          groups.includes("HR_Administrators") ||
          groups.includes("HR_Admin") ||
          groups.includes("HR-Administrators")
        ) {
          setCurrentUserRole("HR_Admin");
        } else if (
          groups.includes("HR_Managers") ||
          groups.includes("HR_Manager") ||
          groups.includes("HR-Managers")
        ) {
          setCurrentUserRole("HR_Manager");
        } else if (
          groups.includes("Managers") ||
          groups.includes("manager") ||
          groups.includes("Manager")
        ) {
          setCurrentUserRole("manager");
        } else {
          setCurrentUserRole("employee");
        }
      } catch (err) {
        console.error("Error getting token:", err);
        setError("Failed to authenticate. Please try signing in again.");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isSignedIn, getAccessToken, getDecodedIdToken]);

  // Loading state
  if (isLoading) {
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
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Not signed in
  if (!isSignedIn) {
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
          <div className="flex flex-1 items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please sign in to access employee onboarding.
              </AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Error state
  if (error) {
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
          <div className="flex flex-1 items-center justify-center p-6">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Permission check
  if (!currentUserRole || !canInitiateOnboarding(currentUserRole)) {
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
          <div className="flex flex-1 items-center justify-center p-6">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle>Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to onboard new employees. Only HR
                  Admin and HR Manager roles can initiate employee onboarding.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Link to="/dashboard">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Main content
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
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard/users">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <UserPlus className="h-6 w-6" />
                Onboard New Employee
              </h1>
              <p className="text-muted-foreground">
                Send an invitation to a new employee to join the organization
              </p>
            </div>
          </div>

          {/* Role indicator */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>
              Onboarding as{" "}
              {currentUserRole === "HR_Admin" ? "HR Administrator" : "HR Manager"}
            </AlertTitle>
            <AlertDescription>
              {currentUserRole === "HR_Admin"
                ? "You can onboard employees with any role: HR Manager, Manager, or Employee."
                : "You can onboard employees with Manager or Employee roles."}
            </AlertDescription>
          </Alert>

          {/* Onboarding Form */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
              <CardDescription>
                Fill in the details for the new employee. An invitation email
                will be sent to them to complete their registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OnboardingForm
                accessToken={accessToken}
                currentUserRole={currentUserRole}
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
