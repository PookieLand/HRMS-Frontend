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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Employee } from "@/lib/api/dashboard";

interface RecentEmployeesProps {
  data: Employee[];
  isLoading: boolean;
  title?: string;
  description?: string;
  limit?: number;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const contractTypeVariants: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  "Full-Time": "default",
  "Part-Time": "secondary",
  Contract: "outline",
  Intern: "outline",
};

export function RecentEmployees({
  data,
  isLoading,
  title = "Recent Employees",
  description = "Latest employee records in the system",
  limit = 10,
}: RecentEmployeesProps) {
  if (isLoading) {
    return <RecentEmployeesSkeleton title={title} description={description} />;
  }

  // Ensure data is an array (API might return object with employees array)
  const employeesArray = Array.isArray(data)
    ? data
    : ((data as unknown as { employees?: Employee[] })?.employees ?? []);

  if (!employeesArray || employeesArray.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No employees found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Employee records will appear here once added
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedEmployees = employeesArray.slice(0, limit);

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
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Hire Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.first_name, employee.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {employee.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{employee.position}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {employee.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contractTypeVariants[employee.contract_type] ||
                        "outline"
                      }
                      className="font-normal"
                    >
                      {employee.contract_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatDate(employee.date_of_hire)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {employeesArray.length > limit && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing {limit} of {employeesArray.length} employees
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

function RecentEmployeesSkeleton({ title, description }: SkeletonProps) {
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
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Hire Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
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
