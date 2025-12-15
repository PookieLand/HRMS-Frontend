// Employee Reports & Analytics Page
// Displays various HR reports including headcount, probation status, contracts expiring, etc.

import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import {
  getHeadcountReport,
  getProbationStatus,
  getContractsExpiring,
  getUpcomingAnniversaries,
  getUpcomingBirthdays,
  getSalarySummary,
  formatSalary,
  canSeeSalary,
  type HeadcountReport,
  type ProbationStatusReport,
  type ContractsExpiringReport,
  type Anniversary,
  type Birthday,
  type SalarySummary,
} from "../../../lib/api/employees";
import {
  DashboardLayout,
  PageHeader,
  PageContent,
  PageSection,
} from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Clock,
  FileText,
  Calendar,
  Cake,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { format, parseISO } from "date-fns";

type ReportType =
  | "headcount"
  | "probation"
  | "contracts"
  | "anniversaries"
  | "birthdays"
  | "salary";

export default function EmployeeReports() {
  const { getAccessToken } = useAsgardeo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState<ReportType>("headcount");

  // Report data
  const [headcountData, setHeadcountData] = useState<HeadcountReport | null>(
    null,
  );
  const [probationData, setProbationData] =
    useState<ProbationStatusReport | null>(null);
  const [contractsData, setContractsData] =
    useState<ContractsExpiringReport | null>(null);
  const [anniversariesData, setAnniversariesData] = useState<Anniversary[]>([]);
  const [birthdaysData, setBirthdaysData] = useState<Birthday[]>([]);
  const [salaryData, setSalaryData] = useState<SalarySummary | null>(null);

  useEffect(() => {
    extractUserRoles();
  }, []);

  useEffect(() => {
    if (userRoles.length > 0) {
      loadReport(activeReport);
    }
  }, [activeReport, userRoles]);

  async function extractUserRoles() {
    try {
      const token = await getAccessToken();
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      const roles = payload.groups || [];
      setUserRoles(roles);
    } catch (err) {
      console.error("Failed to extract user roles:", err);
    }
  }

  async function loadReport(reportType: ReportType) {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();

      switch (reportType) {
        case "headcount":
          const headcount = await getHeadcountReport(token);
          setHeadcountData(headcount);
          break;

        case "probation":
          const probation = await getProbationStatus(token);
          setProbationData(probation);
          break;

        case "contracts":
          const contracts = await getContractsExpiring(token, 30);
          setContractsData(contracts);
          break;

        case "anniversaries":
          const anniversaries = await getUpcomingAnniversaries(token, 30);
          setAnniversariesData(anniversaries);
          break;

        case "birthdays":
          const birthdays = await getUpcomingBirthdays(token, 30);
          setBirthdaysData(birthdays);
          break;

        case "salary":
          if (canSeeSalary(userRoles)) {
            const salary = await getSalarySummary(token);
            setSalaryData(salary);
          } else {
            setError("You don't have permission to view salary reports");
          }
          break;
      }
    } catch (err) {
      console.error("Failed to load report:", err);
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  }

  const showSalaryReport = canSeeSalary(userRoles);

  const reportTabs: Array<{
    id: ReportType;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "headcount",
      label: "Headcount",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "probation",
      label: "Probation",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      id: "contracts",
      label: "Contracts",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: "anniversaries",
      label: "Anniversaries",
      icon: <Calendar className="h-4 w-4" />,
    },
    { id: "birthdays", label: "Birthdays", icon: <Cake className="h-4 w-4" /> },
  ];

  if (showSalaryReport) {
    reportTabs.push({
      id: "salary",
      label: "Salary",
      icon: <DollarSign className="h-4 w-4" />,
    });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Reports & Analytics"
          description="Comprehensive HR reports and workforce analytics"
          icon={<BarChart3 className="size-7" />}
        />
        <PageContent>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Reports & Analytics"
        description="Comprehensive HR reports and workforce analytics"
        icon={<BarChart3 className="size-7" />}
      />

      <PageContent>
        <PageSection>
          {/* Report Tabs */}
          <Tabs
            value={activeReport}
            onValueChange={(value) => setActiveReport(value as ReportType)}
          >
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
              {reportTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Error State */}
            {error && (
              <Card className="border-destructive mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Headcount Report */}
            <TabsContent value="headcount" className="space-y-6 mt-6">
              {headcountData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          Total Employees
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold">
                          {headcountData.total_employees}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Active workforce
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                          Active
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold text-emerald-600">
                          {headcountData.active_employees}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Currently working
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          On Probation
                        </CardDescription>
                        <CardTitle className="text-4xl font-bold text-amber-600">
                          {headcountData.on_probation}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          New hires
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* By Department */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Headcount by Department</CardTitle>
                      <CardDescription>
                        Employee distribution across departments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {headcountData.by_department.map((dept) => (
                          <div key={dept.department} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">
                                {dept.department || "Unassigned"}
                              </span>
                              <span className="text-muted-foreground">
                                {dept.count} employees
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-full transition-all"
                                style={{
                                  width: `${(dept.count / headcountData.total_employees) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* By Employment Type */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Employment Type</CardTitle>
                      <CardDescription>
                        Breakdown of employment contracts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {headcountData.by_employment_type.map((type) => (
                          <div key={type.employment_type} className="space-y-2">
                            <p className="text-sm font-medium capitalize">
                              {type.employment_type}
                            </p>
                            <p className="text-3xl font-bold">{type.count}</p>
                            <p className="text-sm text-muted-foreground">
                              {(
                                (type.count / headcountData.total_employees) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Probation Report */}
            <TabsContent value="probation" className="space-y-6 mt-6">
              {probationData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total on Probation</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                          {probationData.total_on_probation}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Ending Soon (30 days)</CardDescription>
                        <CardTitle className="text-4xl font-bold text-amber-600">
                          {probationData.ending_soon}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Ending This Week</CardDescription>
                        <CardTitle className="text-4xl font-bold text-rose-600">
                          {probationData.ending_this_week}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Employees on Probation</CardTitle>
                      <CardDescription>
                        Review upcoming probation completions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {probationData.employees.map((employee) => (
                          <div
                            key={employee.employee_id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {employee.employee_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {employee.department || "Unassigned"}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge
                                variant={
                                  employee.days_remaining <= 7
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {employee.days_remaining} days left
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                Ends{" "}
                                {format(
                                  parseISO(employee.probation_end_date),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        {probationData.employees.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No employees currently on probation
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Contracts Expiring */}
            <TabsContent value="contracts" className="space-y-6 mt-6">
              {contractsData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total Contracts</CardDescription>
                        <CardTitle className="text-4xl font-bold">
                          {contractsData.total_contracts}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Expiring in 30 Days</CardDescription>
                        <CardTitle className="text-4xl font-bold text-amber-600">
                          {contractsData.expiring_within_30_days}
                        </CardTitle>
                      </CardHeader>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Expiring This Week</CardDescription>
                        <CardTitle className="text-4xl font-bold text-rose-600">
                          {contractsData.expiring_this_week}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Expiring Contracts</CardTitle>
                      <CardDescription>
                        Action required before contract end dates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {contractsData.contracts.map((contract) => (
                          <div
                            key={contract.employee_id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {contract.employee_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {contract.department || "Unassigned"}
                              </p>
                            </div>
                            <div className="text-right space-y-1">
                              <Badge
                                variant={
                                  contract.days_until_expiry <= 7
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {contract.days_until_expiry} days left
                              </Badge>
                              <p className="text-xs text-muted-foreground">
                                Expires{" "}
                                {format(
                                  parseISO(contract.contract_end_date),
                                  "MMM d, yyyy",
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                        {contractsData.contracts.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No contracts expiring soon
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Anniversaries */}
            <TabsContent value="anniversaries" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Work Anniversaries</CardTitle>
                  <CardDescription>
                    Celebrate your team's milestones in the next 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {anniversariesData.map((anniversary) => (
                      <div
                        key={anniversary.employee_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {anniversary.employee_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {anniversary.department || "Unassigned"}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className="bg-purple-500/10 text-purple-700 border-purple-200">
                            {anniversary.years_completed} years
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              parseISO(anniversary.anniversary_date),
                              "MMM d, yyyy",
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                    {anniversariesData.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No upcoming anniversaries in the next 30 days
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Birthdays */}
            <TabsContent value="birthdays" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Birthdays</CardTitle>
                  <CardDescription>
                    Team birthdays in the next 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {birthdaysData.map((birthday) => (
                      <div
                        key={birthday.employee_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">
                            {birthday.employee_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {birthday.department || "Unassigned"}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className="bg-pink-500/10 text-pink-700 border-pink-200">
                            {birthday.days_until} days
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(birthday.birthday), "MMM d")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {birthdaysData.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No upcoming birthdays in the next 30 days
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Salary Summary */}
            {showSalaryReport && (
              <TabsContent value="salary" className="space-y-6 mt-6">
                {salaryData && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Total Monthly Payroll
                          </CardDescription>
                          <CardTitle className="text-4xl font-bold text-emerald-600">
                            {formatSalary(
                              salaryData.total_payroll,
                              salaryData.currency,
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Across {salaryData.total_employees} employees
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardDescription>Average Salary</CardDescription>
                          <CardTitle className="text-4xl font-bold">
                            {formatSalary(
                              salaryData.average_salary,
                              salaryData.currency,
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            Per employee
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Salary by Department</CardTitle>
                        <CardDescription>
                          Departmental payroll breakdown
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {salaryData.by_department.map((dept) => (
                            <div key={dept.department} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                  {dept.department || "Unassigned"}
                                </span>
                                <span className="font-semibold">
                                  {formatSalary(
                                    dept.total_salary,
                                    salaryData.currency,
                                  )}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all"
                                  style={{
                                    width: `${(dept.total_salary / salaryData.total_payroll) * 100}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {dept.employee_count} employees • Avg:{" "}
                                {formatSalary(
                                  dept.average_salary,
                                  salaryData.currency,
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        </PageSection>
      </PageContent>
    </DashboardLayout>
  );
}
