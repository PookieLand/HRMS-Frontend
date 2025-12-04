"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaveRequest } from "@/lib/api/dashboard";

interface RecentLeavesTableProps {
  data: LeaveRequest[];
  isLoading: boolean;
  title?: string;
  description?: string;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  cancelled: "secondary",
};

const leaveTypeLabels: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  casual: "Casual",
  unpaid: "Unpaid",
  maternity: "Maternity",
  paternity: "Paternity",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function RecentLeavesTable({
  data,
  isLoading,
  title = "Pending Leave Requests",
  description = "Recent leave requests awaiting approval",
}: RecentLeavesTableProps) {
  if (isLoading) {
    return <RecentLeavesTableSkeleton title={title} description={description} />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No pending leave requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              All leave requests have been processed
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 10).map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">
                    {leave.employee_name || `Employee #${leave.employee_id}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {leaveTypeLabels[leave.leave_type] || leave.leave_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {leave.days_count || calculateDays(leave.start_date, leave.end_date)}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={leave.reason}>
                    {leave.reason || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[leave.status] || "outline"}>
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {data.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing 10 of {data.length} requests
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface SkeletonProps {
  title: string;
  description: string;
}

function RecentLeavesTableSkeleton({ title, description }: SkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
