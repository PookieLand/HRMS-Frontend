import { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useAsgardeo } from "@asgardeo/react";
import {
 UserPlus,
 Users,
 Shield,
 AlertCircle,
} from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
 SidebarInset,
 SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserManagementTable } from "@/components/user-management-table";
import { OnboardingList } from "@/components/onboarding-list";
import {
 listUsers,
 type User,
 type UserRole,
 type UserStatus,
 canInitiateOnboarding,
} from "@/lib/api/users";

export default function UsersPage() {
 const { isSignedIn, getAccessToken, getDecodedIdToken } = useAsgardeo();
 const [accessToken, setAccessToken] = useState<string>("");
 const [currentUserRole, setCurrentUserRole] = useState<UserRole>("employee");
 const [users, setUsers] = useState<User[]>([]);
 const [totalUsers, setTotalUsers] = useState(0);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [page, setPage] = useState(1);
 const [filters, setFilters] = useState<{
  role?: UserRole;
  status?: UserStatus;
 }>({});
 const pageSize = 10;

 // Get access token and user role
 useEffect(() => {
  const init = async () => {
   if (!isSignedIn) return;

   try {
    const token = await getAccessToken();
    setAccessToken(token);

    const decodedToken = await getDecodedIdToken();
    const groups = (decodedToken?.groups as string[]) || [];

    // Map groups to role
    if (groups.includes("HR_Administrators") || groups.includes("HR_Admin")) {
     setCurrentUserRole("HR_Admin");
    } else if (groups.includes("HR_Managers") || groups.includes("HR_Manager")) {
     setCurrentUserRole("HR_Manager");
    } else if (groups.includes("Managers") || groups.includes("manager")) {
     setCurrentUserRole("manager");
    } else {
     setCurrentUserRole("employee");
    }
   } catch (err) {
    console.error("Error getting token:", err);
    setError("Failed to authenticate");
   }
  };

  init();
 }, [isSignedIn, getAccessToken, getDecodedIdToken]);

 // Load users
 const loadUsers = useCallback(async () => {
  if (!accessToken) return;

  setIsLoading(true);
  setError(null);

  try {
   const response = await listUsers(accessToken, {
    role: filters.role,
    status: filters.status,
    limit: pageSize,
    offset: (page - 1) * pageSize,
   });
   setUsers(response.users);
   setTotalUsers(response.total);
  } catch (err) {
   setError(err instanceof Error ? err.message : "Failed to load users");
  } finally {
   setIsLoading(false);
  }
 }, [accessToken, filters, page]);

 useEffect(() => {
  loadUsers();
 }, [loadUsers]);

 const handlePageChange = (newPage: number) => {
  setPage(newPage);
 };

 const handleFilterChange = (newFilters: {
  role?: UserRole;
  status?: UserStatus;
 }) => {
  setFilters(newFilters);
  setPage(1);
 };

 const canManage =
  currentUserRole === "HR_Admin" || currentUserRole === "HR_Manager";

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
        Please sign in to access user management.
       </AlertDescription>
      </Alert>
     </div>
    </SidebarInset>
   </SidebarProvider>
  );
 }

 if (!canManage) {
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
       <Shield className="h-4 w-4" />
       <AlertTitle>Access Denied</AlertTitle>
       <AlertDescription>
        You don't have permission to access user management. Only HR
        Admin and HR Manager roles can manage users.
       </AlertDescription>
      </Alert>
     </div>
    </SidebarInset>
   </SidebarProvider>
  );
 }

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
     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
       <h1 className="text-2xl font-bold tracking-tight">
        User Management
       </h1>
       <p className="text-muted-foreground">
        Manage users, onboarding invitations, and permissions
       </p>
      </div>
      {canInitiateOnboarding(currentUserRole) && (
       <Link to="/dashboard/users/onboard">
        <Button className="gap-2">
         <UserPlus className="h-4 w-4" />
         Onboard Employee
        </Button>
       </Link>
      )}
     </div>

     {/* Error Alert */}
     {error && (
      <Alert variant="destructive">
       <AlertCircle className="h-4 w-4" />
       <AlertTitle>Error</AlertTitle>
       <AlertDescription>{error}</AlertDescription>
      </Alert>
     )}

     {/* Tabs */}
     <Tabs defaultValue="users" className="space-y-4">
      <TabsList>
       <TabsTrigger value="users" className="gap-2">
        <Users className="h-4 w-4" />
        Users
       </TabsTrigger>
       <TabsTrigger value="onboarding" className="gap-2">
        <UserPlus className="h-4 w-4" />
        Onboarding
       </TabsTrigger>
      </TabsList>

      <TabsContent value="users">
       <Card>
        <CardHeader>
         <CardTitle>All Users</CardTitle>
         <CardDescription>
          View and manage all users in the system. You can suspend,
          activate, or change user roles.
         </CardDescription>
        </CardHeader>
        <CardContent>
         <UserManagementTable
          users={users}
          totalUsers={totalUsers}
          currentUserRole={currentUserRole}
          accessToken={accessToken}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onRefresh={loadUsers}
          onFilterChange={handleFilterChange}
         />
        </CardContent>
       </Card>
      </TabsContent>

      <TabsContent value="onboarding">
       <Card>
        <CardHeader>
         <CardTitle>Onboarding Invitations</CardTitle>
         <CardDescription>
          Track and manage employee onboarding invitations. You can
          resend or cancel pending invitations.
         </CardDescription>
        </CardHeader>
        <CardContent>
         <OnboardingList accessToken={accessToken} />
        </CardContent>
       </Card>
      </TabsContent>
     </Tabs>
    </div>
   </SidebarInset>
  </SidebarProvider>
 );
}
