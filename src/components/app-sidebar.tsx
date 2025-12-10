"use client";

import * as React from "react";
import { useAsgardeo } from "@asgardeo/react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Home,
  Users,
  Clock,
  Shield,
  UserPlus,
  BarChart3,
  Network,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type UserRole = "HR_Admin" | "HR_Manager" | "manager" | "employee";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, getDecodedIdToken } = useAsgardeo();
  const [currentRole, setCurrentRole] = React.useState<UserRole>("employee");

  // Determine user role from groups
  React.useEffect(() => {
    const determineRole = async () => {
      try {
        const decodedToken = await getDecodedIdToken();
        const groups = (decodedToken?.groups as string[]) || [];

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
      } catch (error) {
        console.error("Error determining role:", error);
      }
    };

    determineRole();
  }, [getDecodedIdToken]);

  // Handle Asgardeo user object where name can be an object with familyName and givenName
  const getUserDisplayName = () => {
    if (user?.username) return user.username;
    if (user?.name) {
      if (typeof user.name === "string") return user.name;
      if (typeof user.name === "object" && user.name !== null) {
        const nameObj = user.name as {
          givenName?: string;
          familyName?: string;
        };
        return (
          `${nameObj.givenName || ""} ${nameObj.familyName || ""}`.trim() ||
          "User"
        );
      }
    }
    return "User";
  };

  const userData = {
    name: getUserDisplayName(),
    email: user?.email || "user@example.com",
    avatar: user?.profilePicture || user?.picture || "",
  };

  // Role-based access checks
  const canManageEmployees =
    currentRole === "HR_Admin" || currentRole === "HR_Manager";

  const canManageTeam =
    currentRole === "HR_Admin" ||
    currentRole === "HR_Manager" ||
    currentRole === "manager";

  const canViewGovernance =
    currentRole === "HR_Admin" ||
    currentRole === "HR_Manager" ||
    currentRole === "manager";

  // Get role display name
  const getRoleDisplayName = () => {
    switch (currentRole) {
      case "HR_Admin":
        return "Administrator";
      case "HR_Manager":
        return "HR Manager";
      case "manager":
        return "Manager";
      default:
        return "Employee";
    }
  };

  const data = {
    navMain: [
      // Dashboard - visible to all
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
      },

      // Employees Section - Merged User Management + Employee Management
      // For HR roles: full access including onboarding
      // For managers: limited to directory and team views
      // For employees: only directory view
      {
        title: "Employees",
        url: "/dashboard/employees",
        icon: Users,
        items: [
          {
            title: "All Employees",
            url: "/dashboard/employees",
          },
          // Onboarding - only for HR roles
          ...(canManageEmployees
            ? [
                {
                  title: "Onboard Employee",
                  url: "/dashboard/employees/onboard",
                  icon: UserPlus,
                },
                {
                  title: "Onboarding Status",
                  url: "/dashboard/employees/onboarding",
                },
              ]
            : []),
          // Teams & Hierarchy - for managers and above
          ...(canManageTeam
            ? [
                {
                  title: "Teams & Hierarchy",
                  url: "/dashboard/employees/teams",
                  icon: Network,
                },
              ]
            : []),
          // Reports - for HR roles only
          ...(canManageEmployees
            ? [
                {
                  title: "Reports & Analytics",
                  url: "/dashboard/employees/reports",
                  icon: BarChart3,
                },
              ]
            : []),
        ],
      },

      // Attendance Section
      {
        title: "Attendance",
        url: "/dashboard/attendance",
        icon: Clock,
        items: [
          {
            title: "My Attendance",
            url: "/dashboard/attendance",
          },
          ...(canManageTeam
            ? [
                {
                  title: "Team Attendance",
                  url: "/dashboard/attendance/team",
                },
              ]
            : []),
        ],
      },

      // Leave Management Section
      {
        title: "Leave Management",
        url: "/dashboard/leave",
        icon: CalendarDays,
        items: [
          {
            title: "My Leaves",
            url: "/dashboard/leave",
          },
          ...(canManageTeam
            ? [
                {
                  title: "Pending Approvals",
                  url: "/dashboard/leave/approvals",
                },
              ]
            : []),
        ],
      },

      // Governance Section - Audit & Compliance
      ...(canViewGovernance
        ? [
            {
              title: "Governance",
              url: "/dashboard/governance/audit",
              icon: Shield,
              items: [
                {
                  title: "Audit Logs",
                  url: "/dashboard/governance/audit",
                },
                ...(currentRole === "HR_Admin" || currentRole === "HR_Manager"
                  ? [
                      {
                        title: "Compliance",
                        url: "/dashboard/governance/compliance",
                      },
                    ]
                  : []),
              ],
            },
          ]
        : []),
    ],
    navSecondary: [],
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Building2 className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold tracking-tight">
                    HRMS
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {getRoleDisplayName()}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
