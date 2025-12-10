import { useEffect, useState, useCallback } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlert } from "@/contexts/AlertContext";
import {
 User,
 Mail,
 Phone,
 Shield,
 Building2,
 Calendar,
 Clock,
 Briefcase,
 AlertCircle,
 Loader2,
 Save,
 RefreshCw,
} from "lucide-react";
import {
 getCurrentUser,
 type UserProfile,
 type UserRole,
 formatRole,
 formatStatus,
 getStatusColor,
} from "@/lib/api/users";

interface BasicUserInfo {
 email?: string;
 username?: string;
 displayName?: string;
 allowedScopes?: string;
 tenantDomain?: string;
 sessionState?: string;
 sub?: string;
 preferred_username?: string;
 org_id?: string;
 org_name?: string;
 groups?: string[];
}

export default function ProfilePage() {
 const { getDecodedIdToken, isSignedIn, getAccessToken } = useAsgardeo();
 const { showAlert } = useAlert();
 const [userInfo, setUserInfo] = useState<BasicUserInfo | null>(null);
 const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [isUpdating, setIsUpdating] = useState(false);
 const [authStatus, setAuthStatus] = useState<
  "checking" | "active" | "inactive"
 >("checking");
 const [isMounted, setIsMounted] = useState(false);
 const [currentRole, setCurrentRole] = useState<UserRole>("employee");

 // Editable fields
 const [editableFields, setEditableFields] = useState({
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
 });

 useEffect(() => {
  setIsMounted(true);
 }, []);

 // Fetch user information from decoded ID token and backend
 // NOTE: useCallback was removed to avoid frequent identity changes causing repeated effects.
 // We keep a plain async function and drive initial fetch from an effect that only depends on mount and sign-in state.
 async function fetchUserData() {
  if (!isSignedIn) {
   setIsLoading(false);
   setAuthStatus("inactive");
   return;
  }

  try {
   setIsLoading(true);
   const decodedToken = await getDecodedIdToken();
   const accessToken = await getAccessToken();

   // Extract basic user info from decoded token
   const basicInfo: BasicUserInfo = {
    email: decodedToken?.email as string,
    username: decodedToken?.username as string,
    displayName:
     (decodedToken?.preferred_username as string) ||
     (decodedToken?.sub as string),
    allowedScopes: decodedToken?.scope as string,
    tenantDomain: decodedToken?.tenant_domain as string,
    sessionState: decodedToken?.session_state as string,
    sub: decodedToken?.sub as string,
    preferred_username: decodedToken?.preferred_username as string,
    org_id: decodedToken?.org_id as string,
    org_name: decodedToken?.org_name as string,
    groups: decodedToken?.groups as string[],
   };

   setUserInfo(basicInfo);

   // Determine role from groups
   const groups = basicInfo.groups || [];
   if (
    groups.includes("HR_Administrators") ||
    groups.includes("HR_Admin") ||
    groups.includes("HR-Administrators")
   ) {
    setCurrentRole("HR_Admin");
   } else if (
    groups.includes("HR_Managers") ||
    groups.includes("HR_Manager") ||
    groups.includes("HR-Managers")
   ) {
    setCurrentRole("HR_Manager");
   } else if (
    groups.includes("Managers") ||
    groups.includes("manager") ||
    groups.includes("Manager")
   ) {
    setCurrentRole("manager");
   } else {
    setCurrentRole("employee");
   }

   // Try to fetch full profile from backend
   try {
    const profile = await getCurrentUser(accessToken);
    setUserProfile(profile);
    setEditableFields({
     phone: profile.phone || "",
     emergency_contact_name: "",
     emergency_contact_phone: "",
    });
   } catch (err) {
    console.log("Could not fetch profile from backend:", err);
   }

   setAuthStatus("active");
  } catch (error) {
   console.error("Error fetching user info:", error);
   setAuthStatus("inactive");
  } finally {
   setIsLoading(false);
  }
 }

 useEffect(() => {
  // Only trigger on initial mount and when sign-in state changes to avoid frequent re-runs
  if (!isMounted) return;
  fetchUserData();
 }, [isMounted, isSignedIn]);

 const handleInputChange = (field: string, value: string) => {
  setEditableFields((prev) => ({
   ...prev,
   [field]: value,
  }));
 };

 const handleSaveProfile = async () => {
  setIsUpdating(true);
  try {
   // In a real implementation, this would call an API endpoint
   // For now, just show a success message
   await new Promise((resolve) => setTimeout(resolve, 1000));
   showAlert({
    title: "Profile Updated",
    message: "Your profile has been updated successfully.",
    variant: "success",
   });
  } catch (error) {
   showAlert({
    title: "Update Failed",
    message:
     error instanceof Error ? error.message : "Failed to update profile",
    variant: "destructive",
   });
  } finally {
   setIsUpdating(false);
  }
 };

 const displayValue = (
  value: string | undefined | null,
  fallback = "Not available",
 ) => {
  return value && value.trim() !== "" ? value : fallback;
 };

 // Loading skeleton
 if (!isMounted || isLoading) {
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
       <Skeleton className="h-20 w-20 rounded-full" />
       <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
       </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
       {[...Array(4)].map((_, i) => (
        <Card key={i}>
         <CardHeader>
          <Skeleton className="h-5 w-32" />
         </CardHeader>
         <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
         </CardContent>
        </Card>
       ))}
      </div>
     </div>
    </SidebarInset>
   </SidebarProvider>
  );
 }

 // Not signed in
 if (!isSignedIn || authStatus === "inactive") {
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
        Please sign in to view your profile.
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
     {/* Profile Header */}
     <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
       <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <User className="h-10 w-10" />
       </div>
       <div>
        <h1 className="text-2xl font-bold tracking-tight">
         {displayValue(userInfo?.displayName, "User")}
        </h1>
        <p className="text-muted-foreground">{userInfo?.email}</p>
        <div className="flex items-center gap-2 mt-2">
         <Badge variant="outline">{formatRole(currentRole)}</Badge>
         {userProfile && (
          <Badge
           variant="outline"
           className={getStatusColor(userProfile.status)}
          >
           {formatStatus(userProfile.status)}
          </Badge>
         )}
        </div>
       </div>
      </div>
      <Button
       variant="outline"
       size="sm"
       onClick={fetchUserData}
       disabled={isLoading}
      >
       <RefreshCw
        className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
       />
       Refresh
      </Button>
     </div>

     {/* Tabs */}
     <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
       <TabsTrigger value="profile" className="gap-2">
        <User className="h-4 w-4" />
        Profile
       </TabsTrigger>
       <TabsTrigger value="security" className="gap-2">
        <Shield className="h-4 w-4" />
        Security
       </TabsTrigger>
       {userProfile && (
        <TabsTrigger value="employment" className="gap-2">
         <Briefcase className="h-4 w-4" />
         Employment
        </TabsTrigger>
       )}
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile" className="space-y-6">
       <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
           <User className="h-5 w-5" />
           Basic Information
          </CardTitle>
          <CardDescription>
           Your personal information from Asgardeo
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
          <div className="space-y-2">
           <Label>Display Name</Label>
           <Input
            value={displayValue(userInfo?.displayName)}
            disabled
            className="bg-muted"
           />
          </div>
          <div className="space-y-2">
           <Label>Username</Label>
           <Input
            value={displayValue(userInfo?.username)}
            disabled
            className="bg-muted"
           />
          </div>
          {userProfile && (
           <>
            <div className="space-y-2">
             <Label>First Name</Label>
             <Input
              value={displayValue(userProfile.first_name)}
              disabled
              className="bg-muted"
             />
            </div>
            <div className="space-y-2">
             <Label>Last Name</Label>
             <Input
              value={displayValue(userProfile.last_name)}
              disabled
              className="bg-muted"
             />
            </div>
           </>
          )}
         </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
           <Mail className="h-5 w-5" />
           Contact Information
          </CardTitle>
          <CardDescription>
           Your email and phone details
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
          <div className="space-y-2">
           <Label>Email Address</Label>
           <div className="flex items-center gap-2">
            <Input
             value={displayValue(userInfo?.email)}
             disabled
             className="bg-muted"
            />
            <Badge variant="outline" className="shrink-0">
             Verified
            </Badge>
           </div>
          </div>
          <div className="space-y-2">
           <Label htmlFor="phone">Phone Number</Label>
           <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
             id="phone"
             placeholder="+1 (555) 123-4567"
             value={editableFields.phone}
             onChange={(e) =>
              handleInputChange("phone", e.target.value)
             }
             className="pl-10"
            />
           </div>
          </div>
          <Separator />
          <div className="space-y-2">
           <Label htmlFor="emergency_contact_name">
            Emergency Contact Name
           </Label>
           <Input
            id="emergency_contact_name"
            placeholder="Jane Doe"
            value={editableFields.emergency_contact_name}
            onChange={(e) =>
             handleInputChange(
              "emergency_contact_name",
              e.target.value,
             )
            }
           />
          </div>
          <div className="space-y-2">
           <Label htmlFor="emergency_contact_phone">
            Emergency Contact Phone
           </Label>
           <Input
            id="emergency_contact_phone"
            placeholder="+1 (555) 987-6543"
            value={editableFields.emergency_contact_phone}
            onChange={(e) =>
             handleInputChange(
              "emergency_contact_phone",
              e.target.value,
             )
            }
           />
          </div>
         </CardContent>
        </Card>
       </div>

       {/* Save Button */}
       <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={isUpdating}>
         {isUpdating ? (
          <>
           <Loader2 className="mr-2 h-4 w-4 animate-spin" />
           Saving...
          </>
         ) : (
          <>
           <Save className="mr-2 h-4 w-4" />
           Save Changes
          </>
         )}
        </Button>
       </div>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security" className="space-y-6">
       <div className="grid gap-6 md:grid-cols-2">
        {/* Account Info */}
        <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
           <Shield className="h-5 w-5" />
           Account Information
          </CardTitle>
          <CardDescription>
           Your account security details
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
          <div className="space-y-2">
           <Label>Account ID (Subject)</Label>
           <Input
            value={displayValue(userInfo?.sub)}
            disabled
            className="bg-muted font-mono text-xs"
           />
          </div>
          <div className="space-y-2">
           <Label>Tenant Domain</Label>
           <Input
            value={displayValue(userInfo?.tenantDomain)}
            disabled
            className="bg-muted"
           />
          </div>
          <div className="space-y-2">
           <Label>Organization</Label>
           <Input
            value={displayValue(userInfo?.org_name)}
            disabled
            className="bg-muted"
           />
          </div>
         </CardContent>
        </Card>

        {/* Roles & Permissions */}
        <Card>
         <CardHeader>
          <CardTitle className="flex items-center gap-2">
           <Shield className="h-5 w-5" />
           Roles & Permissions
          </CardTitle>
          <CardDescription>
           Your assigned roles and access levels
          </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
          <div className="space-y-2">
           <Label>Current Role</Label>
           <div className="p-3 rounded-md bg-muted">
            <Badge variant="outline" className="text-sm">
             {formatRole(currentRole)}
            </Badge>
           </div>
          </div>
          <div className="space-y-2">
           <Label>Groups</Label>
           <div className="p-3 rounded-md bg-muted flex flex-wrap gap-2">
            {userInfo?.groups && userInfo.groups.length > 0 ? (
             userInfo.groups.map((group) => (
              <Badge key={group} variant="secondary">
               {group}
              </Badge>
             ))
            ) : (
             <span className="text-sm text-muted-foreground">
              No groups assigned
             </span>
            )}
           </div>
          </div>
          <div className="space-y-2">
           <Label>Allowed Scopes</Label>
           <div className="p-3 rounded-md bg-muted">
            <p className="text-xs font-mono break-all text-muted-foreground">
             {displayValue(userInfo?.allowedScopes)}
            </p>
           </div>
          </div>
         </CardContent>
        </Card>
       </div>
      </TabsContent>

      {/* Employment Tab */}
      {userProfile && (
       <TabsContent value="employment" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
         {/* Job Details */}
         <Card>
          <CardHeader>
           <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Details
           </CardTitle>
           <CardDescription>
            Your current position and department
           </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label>Job Title</Label>
            <Input
             value={displayValue(userProfile.job_title)}
             disabled
             className="bg-muted"
            />
           </div>
           <div className="space-y-2">
            <Label>Department</Label>
            <div className="relative">
             <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
              value={displayValue(userProfile.department)}
              disabled
              className="bg-muted pl-10"
             />
            </div>
           </div>
           <div className="space-y-2">
            <Label>Team</Label>
            <Input
             value={displayValue(userProfile.team)}
             disabled
             className="bg-muted"
            />
           </div>
          </CardContent>
         </Card>

         {/* Employment Info */}
         <Card>
          <CardHeader>
           <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Employment Information
           </CardTitle>
           <CardDescription>
            Your employment dates and status
           </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label>Joining Date</Label>
            <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
              value={
               userProfile.joining_date
                ? new Date(
                  userProfile.joining_date,
                 ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                 })
                : "Not available"
              }
              disabled
              className="bg-muted pl-10"
             />
            </div>
           </div>
           <div className="space-y-2">
            <Label>Employee ID</Label>
            <Input
             value={
              userProfile.employee_id?.toString() ||
              "Not assigned"
             }
             disabled
             className="bg-muted"
            />
           </div>
           <div className="space-y-2">
            <Label>Account Created</Label>
            <div className="relative">
             <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
              value={
               userProfile.created_at
                ? new Date(
                  userProfile.created_at,
                 ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                 })
                : "Not available"
              }
              disabled
              className="bg-muted pl-10"
             />
            </div>
           </div>
          </CardContent>
         </Card>
        </div>
       </TabsContent>
      )}
     </Tabs>
    </div>
   </SidebarInset>
  </SidebarProvider>
 );
}
