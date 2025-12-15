// Employee Onboarding Page
// Allows HR_Admin and HR_Manager to initiate new employee onboarding
// Uses the unified DashboardLayout for consistent styling

import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useAsgardeo } from "@asgardeo/react";
import {
 ArrowLeft,
 Shield,
 AlertCircle,
 UserPlus,
 Mail,
 Briefcase,
 Users,
 Info,
} from "lucide-react";

import {
 DashboardLayout,
 PageHeader,
 PageContent,
 PageSection,
} from "@/components/dashboard-layout";
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
   <DashboardLayout>
    <PageHeader
     title="Onboard Employee"
     icon={<UserPlus className="size-5" />}
    >
     <Link to="/dashboard/employees">
      <Button variant="outline" size="sm">
       <ArrowLeft className="size-4 mr-2" />
       Back
      </Button>
     </Link>
    </PageHeader>
    <PageContent>
     <Card>
      <CardHeader>
       <Skeleton className="h-6 w-48" />
       <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-6">
       {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-2">
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-10 w-full" />
        </div>
       ))}
      </CardContent>
     </Card>
    </PageContent>
   </DashboardLayout>
  );
 }

 // Not signed in
 if (!isSignedIn) {
  return (
   <DashboardLayout>
    <PageHeader
     title="Onboard Employee"
     icon={<UserPlus className="size-5" />}
    />
    <PageContent>
     <div className="flex flex-1 items-center justify-center py-16">
      <Alert variant="destructive" className="max-w-md">
       <AlertCircle className="h-4 w-4" />
       <AlertTitle>Authentication Required</AlertTitle>
       <AlertDescription>
        Please sign in to access employee onboarding.
       </AlertDescription>
      </Alert>
     </div>
    </PageContent>
   </DashboardLayout>
  );
 }

 // Error state
 if (error) {
  return (
   <DashboardLayout>
    <PageHeader
     title="Onboard Employee"
     icon={<UserPlus className="size-5" />}
    />
    <PageContent>
     <div className="flex flex-1 items-center justify-center py-16">
      <Alert variant="destructive" className="max-w-md">
       <AlertCircle className="h-4 w-4" />
       <AlertTitle>Error</AlertTitle>
       <AlertDescription>{error}</AlertDescription>
      </Alert>
     </div>
    </PageContent>
   </DashboardLayout>
  );
 }

 // Permission check
 if (!currentUserRole || !canInitiateOnboarding(currentUserRole)) {
  return (
   <DashboardLayout>
    <PageHeader
     title="Onboard Employee"
     icon={<UserPlus className="size-5" />}
    />
    <PageContent>
     <div className="flex flex-1 items-center justify-center py-16">
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
    </PageContent>
   </DashboardLayout>
  );
 }

 // Main content
 return (
  <DashboardLayout>
   <PageHeader
    title="Onboard Employee"
    description="Send an invitation to a new team member to join your organization"
    icon={<UserPlus className="size-5" />}
   >
    <Link to="/dashboard/employees">
     <Button variant="outline" size="sm">
      <ArrowLeft className="size-4 mr-2" />
      Back to Employees
     </Button>
    </Link>
   </PageHeader>

   <PageContent>
    {/* Role Indicator & Info */}
    <PageSection delay={1}>
     <Alert className="border-primary/20 bg-primary/5">
      <Shield className="h-4 w-4" />
      <AlertTitle>
       Onboarding as{" "}
       {currentUserRole === "HR_Admin"
        ? "HR Administrator"
        : "HR Manager"}
      </AlertTitle>
      <AlertDescription>
       {currentUserRole === "HR_Admin"
        ? "You can onboard employees with any role: HR Manager, Manager, or Employee."
        : "You can onboard employees with Manager or Employee roles."}
      </AlertDescription>
     </Alert>
    </PageSection>

    {/* Quick Info Cards */}
    <PageSection delay={2}>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className=" hover-lift">
       <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
         <Mail className="size-4" />
         Step 1
        </CardDescription>
        <CardTitle className="text-base">Send Invitation</CardTitle>
       </CardHeader>
       <CardContent>
        <p className="text-sm text-muted-foreground">
         Enter employee details and send an invitation email
        </p>
       </CardContent>
      </Card>

      <Card className=" hover-lift">
       <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
         <Users className="size-4" />
         Step 2
        </CardDescription>
        <CardTitle className="text-base">Account Setup</CardTitle>
       </CardHeader>
       <CardContent>
        <p className="text-sm text-muted-foreground">
         Employee creates their account via the invitation link
        </p>
       </CardContent>
      </Card>

      <Card className=" hover-lift">
       <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">
         <Briefcase className="size-4" />
         Step 3
        </CardDescription>
        <CardTitle className="text-base">Complete Profile</CardTitle>
       </CardHeader>
       <CardContent>
        <p className="text-sm text-muted-foreground">
         Employee fills in personal details and starts working
        </p>
       </CardContent>
      </Card>
     </div>
    </PageSection>

    {/* Onboarding Form */}
    <PageSection delay={3}>
     <Card>
      <CardHeader>
       <CardTitle className="flex items-center gap-2">
        <Info className="size-5" />
        Employee Details
       </CardTitle>
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
    </PageSection>
   </PageContent>
  </DashboardLayout>
 );
}
