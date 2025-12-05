"use client";

import * as React from "react";
import { useAsgardeo } from "@asgardeo/react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  CalendarDays,
  Home,
  LifeBuoy,
  Send,
  Settings,
  Users,
  Clock,
  BarChart3,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAsgardeo();

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

  const data = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        isActive: true,
      },
      {
        title: "Employees",
        url: "#",
        icon: Users,
        items: [
          {
            title: "All Employees",
            url: "#",
          },
          {
            title: "Departments",
            url: "#",
          },
          {
            title: "Positions",
            url: "#",
          },
        ],
      },
      {
        title: "Attendance",
        url: "#",
        icon: Clock,
        items: [
          {
            title: "Check In/Out",
            url: "#",
          },
          {
            title: "My Attendance",
            url: "#",
          },
          {
            title: "Attendance Reports",
            url: "#",
          },
        ],
      },
      {
        title: "Leave Management",
        url: "#",
        icon: CalendarDays,
        items: [
          {
            title: "Request Leave",
            url: "#",
          },
          {
            title: "My Leaves",
            url: "#",
          },
          {
            title: "Pending Approvals",
            url: "#",
          },
          {
            title: "Leave Calendar",
            url: "#",
          },
        ],
      },
      {
        title: "Reports",
        url: "#",
        icon: BarChart3,
        items: [
          {
            title: "Attendance Report",
            url: "#",
          },
          {
            title: "Leave Report",
            url: "#",
          },
          {
            title: "Employee Report",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Notifications",
            url: "#",
          },
          {
            title: "Security",
            url: "#",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Support",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "Feedback",
        url: "#",
        icon: Send,
      },
    ],
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
                  <span className="truncate font-medium">HRMS</span>
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
