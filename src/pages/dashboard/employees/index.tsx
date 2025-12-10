// Employees Directory Page
// Unified view combining user management and employee management
// For HR_Admin: Full access - view all employees, onboard, suspend, manage
// For HR_Manager: Can manage managers and employees
// For managers: Limited view of their team
// For employees: Can only view directory

import { useEffect, useState, useCallback } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  UserCog,
  UserX,
  UserCheck,
  Mail,
  Building2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

import {
  DashboardLayout,
  PageHeader,
  PageContent,
  PageSection,
} from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  listEmployees,
  getUniqueDepartments,
  calculateEmploymentDuration,
  formatSalary,
  canSeeSalary,
  type Employee,
  type EmployeeListParams,
} from "@/lib/api/employees";

import {
  suspendUser,
  activateUser,
  type UserRole,
  canManageUser,
} from "@/lib/api/users";

import { useToast } from "@/hooks/use-toast";

// Status badge styling
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "status-success";
    case "suspended":
      return "status-error";
    case "on_leave":
      return "status-info";
    case "terminated":
      return "status-error";
    default:
      return "status-neutral";
  }
}

// Employment type badge styling
function getEmploymentTypeBadgeClass(type: string): string {
  switch (type) {
    case "permanent":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
    case "contract":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Avatar gradient based on name hash
function getAvatarGradient(name: string): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-amber-600",
    "from-rose-500 to-pink-600",
    "from-indigo-500 to-blue-600",
  ];
  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

export default function EmployeesDirectory() {
  const { getAccessToken, getDecodedIdToken } = useAsgardeo();
  const { toast } = useToast();

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("employee");
  const [accessToken, setAccessToken] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEmploymentType, setSelectedEmploymentType] =
    useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Available departments from data
  const [departments, setDepartments] = useState<string[]>([]);

  // Initialize and get user role
  useEffect(() => {
    const init = async () => {
      try {
        const token = await getAccessToken();
        setAccessToken(token);

        const decodedToken = await getDecodedIdToken();
        const groups = (decodedToken?.groups as string[]) || [];

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
        console.error("Error initializing:", err);
        setError("Failed to authenticate");
      }
    };

    init();
  }, [getAccessToken, getDecodedIdToken]);

  // Load employees
  const loadEmployees = useCallback(
    async (showRefreshing = false) => {
      if (!accessToken) return;

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const params: EmployeeListParams = {
          offset: (currentPage - 1) * itemsPerPage,
          limit: itemsPerPage,
        };

        if (selectedDepartment && selectedDepartment !== "all") {
          params.department = selectedDepartment;
        }
        if (selectedStatus && selectedStatus !== "all") {
          params.status = selectedStatus;
        }
        if (selectedEmploymentType && selectedEmploymentType !== "all") {
          params.employment_type = selectedEmploymentType;
        }
        if (searchQuery) {
          params.search = searchQuery;
        }

        const response = await listEmployees(accessToken, params);
        setEmployees(response.employees);
        setTotalCount(response.pagination.total);

        // Extract unique departments
        if (response.employees.length > 0 && departments.length === 0) {
          const depts = getUniqueDepartments(response.employees);
          setDepartments(depts);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load employees",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      accessToken,
      currentPage,
      selectedDepartment,
      selectedStatus,
      selectedEmploymentType,
      searchQuery,
      departments.length,
    ],
  );

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Filter employees locally by search (for immediate feedback)
  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      emp.full_name.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.job_title.toLowerCase().includes(query) ||
      emp.department.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const showSalary = canSeeSalary([currentUserRole]);
  const canOnboard =
    currentUserRole === "HR_Admin" || currentUserRole === "HR_Manager";

  // Handle actions
  const handleSuspend = async (_employeeId: number, userId: number) => {
    try {
      await suspendUser(accessToken, userId, { reason: "Suspended by admin" });
      toast({
        title: "Employee Suspended",
        description: "The employee has been suspended successfully.",
      });
      loadEmployees(true);
    } catch (err) {
      toast({
        title: "Action Failed",
        description:
          err instanceof Error ? err.message : "Failed to suspend employee",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (_employeeId: number, userId: number) => {
    try {
      await activateUser(accessToken, userId);
      toast({
        title: "Employee Activated",
        description: "The employee has been activated successfully.",
      });
      loadEmployees(true);
    } catch (err) {
      toast({
        title: "Action Failed",
        description:
          err instanceof Error ? err.message : "Failed to activate employee",
        variant: "destructive",
      });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedStatus("all");
    setSelectedEmploymentType("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    (selectedDepartment && selectedDepartment !== "all") ||
    (selectedStatus && selectedStatus !== "all") ||
    (selectedEmploymentType && selectedEmploymentType !== "all");

  return (
    <DashboardLayout>
      {/* Page Header */}
      <PageHeader
        title="Employees"
        description="Manage your organization's workforce"
        icon={<Users className="size-5" />}
      >
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => loadEmployees(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={`size-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh list</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {canOnboard && (
            <Link to="/dashboard/users/onboard">
              <Button className="gap-2">
                <UserPlus className="size-4" />
                <span className="hidden sm:inline">Onboard Employee</span>
              </Button>
            </Link>
          )}
        </div>
      </PageHeader>

      <PageContent>
        {/* Stats Cards */}
        <PageSection delay={1}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-accent-emerald hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Total Employees
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? <Skeleton className="h-9 w-16" /> : totalCount}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-blue hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Active
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    employees.filter((e) => e.status === "active").length
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-amber hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  On Leave
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    employees.filter((e) => e.status === "on_leave").length
                  )}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="card-accent-violet hover-lift">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs uppercase tracking-wider">
                  Departments
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  {loading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    departments.length
                  )}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </PageSection>

        {/* Filters */}
        <PageSection delay={2}>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-muted-foreground" />
                  <CardTitle className="text-base">Filters</CardTitle>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                    Clear all
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, title..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>

                {/* Department */}
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => {
                    setSelectedDepartment(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <Building2 className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status */}
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => {
                    setSelectedStatus(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>

                {/* Employment Type */}
                <Select
                  value={selectedEmploymentType}
                  onValueChange={(value) => {
                    setSelectedEmploymentType(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <Briefcase className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </PageSection>

        {/* Results info */}
        <PageSection delay={3}>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredEmployees.length} of {totalCount} employees
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>
        </PageSection>

        {/* Employee Table */}
        <PageSection delay={4}>
          <Card>
            <CardContent className="p-0">
              {error ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <X className="size-6 text-destructive" />
                  </div>
                  <p className="text-destructive font-medium mb-2">
                    Failed to load employees
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{error}</p>
                  <Button variant="outline" onClick={() => loadEmployees()}>
                    <RefreshCw className="size-4 mr-2" />
                    Try again
                  </Button>
                </div>
              ) : loading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="size-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Users className="size-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium mb-1">No employees found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search or filters
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="data-table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Employee</TableHead>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tenure</TableHead>
                        {showSalary && <TableHead>Salary</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right w-20">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmployees.map((employee, index) => (
                        <TableRow
                          key={employee.id}
                          className="animate-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="size-10">
                                <AvatarFallback
                                  className={`bg-linear-to-br ${getAvatarGradient(employee.full_name)} text-white font-medium`}
                                >
                                  {getInitials(employee.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {employee.full_name}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {employee.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {employee.job_title}
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getEmploymentTypeBadgeClass(
                                employee.employment_type,
                              )}
                            >
                              {employee.employment_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">
                            {calculateEmploymentDuration(employee.hire_date)}
                          </TableCell>
                          {showSalary && (
                            <TableCell className="tabular-nums font-medium">
                              {formatSalary(employee.salary)}
                            </TableCell>
                          )}
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadgeClass(employee.status)}
                            >
                              {employee.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="size-4" />
                                  <span className="sr-only">Actions</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                  <Link
                                    to="/dashboard/employees/$id"
                                    params={{ id: employee.id.toString() }}
                                  >
                                    <Eye className="size-4 mr-2" />
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="size-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                {canManageUser(currentUserRole, "employee") && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <UserCog className="size-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    {employee.status === "active" ? (
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          handleSuspend(
                                            employee.id,
                                            employee.user_id,
                                          )
                                        }
                                      >
                                        <UserX className="size-4 mr-2" />
                                        Suspend
                                      </DropdownMenuItem>
                                    ) : employee.status === "suspended" ? (
                                      <DropdownMenuItem
                                        className="text-emerald-600 focus:text-emerald-600"
                                        onClick={() =>
                                          handleActivate(
                                            employee.id,
                                            employee.user_id,
                                          )
                                        }
                                      >
                                        <UserCheck className="size-4 mr-2" />
                                        Activate
                                      </DropdownMenuItem>
                                    ) : null}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {totalPages > 1 && !loading && !error && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Previous
                  </Button>

                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="icon-sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
