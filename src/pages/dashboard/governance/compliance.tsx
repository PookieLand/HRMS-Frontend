import { useEffect, useState } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Scale,
  Database,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HardDrive,
  Trash2,
  Archive,
  Eye,
  Shield,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

type UserRole = "HR_Admin" | "HR_Manager" | "manager" | "employee";

interface DataInventoryItem {
  id: string;
  category: string;
  data_type: string;
  count: number;
  size_mb: number;
  last_updated: string;
  retention_days: number;
  compliance_status: "compliant" | "warning" | "non_compliant";
}

interface RetentionReport {
  id: string;
  data_category: string;
  total_records: number;
  old_records: number;
  stale_records: number;
  oldest_date: string;
  action_required: boolean;
}

interface PersonalDataReport {
  category: string;
  fields: string[];
  purpose: string;
  retention_period: string;
}

export default function CompliancePage() {
  const { getDecodedIdToken, user } = useAsgardeo();
  const [currentRole, setCurrentRole] = useState<UserRole>("employee");
  const [dataInventory, setDataInventory] = useState<DataInventoryItem[]>([]);
  const [retentionReports, setRetentionReports] = useState<RetentionReport[]>(
    [],
  );
  const [personalData, setPersonalData] = useState<PersonalDataReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inventory");

  // Determine user role
  useEffect(() => {
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

  // Mock data - replace with API calls
  useEffect(() => {
    const mockInventory: DataInventoryItem[] = [
      {
        id: "1",
        category: "Employee Records",
        data_type: "Personal Information",
        count: 1250,
        size_mb: 45.2,
        last_updated: new Date().toISOString(),
        retention_days: 2555,
        compliance_status: "compliant",
      },
      {
        id: "2",
        category: "Attendance Data",
        data_type: "Time Tracking",
        count: 48500,
        size_mb: 125.8,
        last_updated: new Date(Date.now() - 86400000).toISOString(),
        retention_days: 730,
        compliance_status: "compliant",
      },
      {
        id: "3",
        category: "Leave Records",
        data_type: "Leave History",
        count: 8200,
        size_mb: 32.1,
        last_updated: new Date(Date.now() - 172800000).toISOString(),
        retention_days: 1095,
        compliance_status: "warning",
      },
      {
        id: "4",
        category: "Payroll Data",
        data_type: "Salary Information",
        count: 15000,
        size_mb: 89.5,
        last_updated: new Date(Date.now() - 259200000).toISOString(),
        retention_days: 2555,
        compliance_status: "compliant",
      },
      {
        id: "5",
        category: "Audit Logs",
        data_type: "System Activity",
        count: 125000,
        size_mb: 450.3,
        last_updated: new Date().toISOString(),
        retention_days: 30,
        compliance_status: "non_compliant",
      },
    ];

    const mockRetention: RetentionReport[] = [
      {
        id: "1",
        data_category: "Employee Contracts",
        total_records: 1200,
        old_records: 150,
        stale_records: 25,
        oldest_date: new Date(Date.now() - 94608000000).toISOString(),
        action_required: true,
      },
      {
        id: "2",
        data_category: "Performance Reviews",
        total_records: 3500,
        old_records: 800,
        stale_records: 120,
        oldest_date: new Date(Date.now() - 126144000000).toISOString(),
        action_required: true,
      },
      {
        id: "3",
        data_category: "Training Records",
        total_records: 5200,
        old_records: 450,
        stale_records: 80,
        oldest_date: new Date(Date.now() - 63072000000).toISOString(),
        action_required: false,
      },
    ];

    const mockPersonalData: PersonalDataReport[] = [
      {
        category: "Basic Information",
        fields: [
          "Full Name",
          "Email Address",
          "Phone Number",
          "Date of Birth",
          "Address",
        ],
        purpose: "Employee identification and contact",
        retention_period: "7 years after employment ends",
      },
      {
        category: "Employment Details",
        fields: [
          "Job Title",
          "Department",
          "Manager",
          "Employment Type",
          "Start Date",
        ],
        purpose: "Work assignment and organizational structure",
        retention_period: "Duration of employment + 3 years",
      },
      {
        category: "Attendance & Time",
        fields: [
          "Check-in/Check-out times",
          "Work hours",
          "Overtime records",
          "Leave history",
        ],
        purpose: "Time tracking and payroll processing",
        retention_period: "2 years from record date",
      },
      {
        category: "Compensation",
        fields: [
          "Salary information",
          "Bank details",
          "Tax information",
          "Payment history",
        ],
        purpose: "Payroll and financial compliance",
        retention_period: "7 years for tax purposes",
      },
      {
        category: "System Access",
        fields: [
          "Login credentials",
          "Access logs",
          "IP addresses",
          "Device info",
        ],
        purpose: "Security and audit compliance",
        retention_period: "30 days for audit logs",
      },
    ];

    setTimeout(() => {
      setDataInventory(mockInventory);
      setRetentionReports(mockRetention);
      setPersonalData(mockPersonalData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
            <CheckCircle2 className="size-3 mr-1" />
            Compliant
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
            <AlertTriangle className="size-3 mr-1" />
            Warning
          </Badge>
        );
      case "non_compliant":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
            <AlertTriangle className="size-3 mr-1" />
            Non-Compliant
          </Badge>
        );
      default:
        return null;
    }
  };

  const canViewFullCompliance =
    currentRole === "HR_Admin" || currentRole === "HR_Manager";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
          {/* Header */}
          <header className="sticky top-0 z-10 backdrop-blur-xl bg-background/90 border-b shadow-sm">
            <div className="flex h-16 items-center gap-4 px-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl">
                  <Scale className="size-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Compliance Center
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Data governance & retention management
                  </p>
                </div>
              </div>
              {canViewFullCompliance && (
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="size-4" />
                    Export Report
                  </Button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className=" ">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">
                    Total Data Categories
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {dataInventory.length}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className=" ">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">
                    Compliant
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {
                      dataInventory.filter(
                        (d) => d.compliance_status === "compliant",
                      ).length
                    }
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className=" ">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">
                    Needs Attention
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {
                      dataInventory.filter(
                        (d) =>
                          d.compliance_status === "warning" ||
                          d.compliance_status === "non_compliant",
                      ).length
                    }
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className=" ">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium">
                    Total Storage
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold">
                    {dataInventory
                      .reduce((acc, d) => acc + d.size_mb, 0)
                      .toFixed(1)}{" "}
                    MB
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="inventory" className="gap-2">
                  <Database className="size-4" />
                  Data Inventory
                </TabsTrigger>
                <TabsTrigger value="retention" className="gap-2">
                  <Archive className="size-4" />
                  Retention Reports
                </TabsTrigger>
                <TabsTrigger value="personal" className="gap-2">
                  <Eye className="size-4" />
                  My Data
                </TabsTrigger>
              </TabsList>

              {/* Data Inventory Tab */}
              <TabsContent value="inventory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Data Inventory Overview
                    </CardTitle>
                    <CardDescription>
                      Comprehensive view of all data stored in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Loading data inventory...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {dataInventory.map((item, index) => (
                          <div
                            key={item.id}
                            className="p-5 rounded-xl border bg-gradient-to-r from-card to-muted/20 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
                            style={{ animationDelay: `${index * 60}ms` }}
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-start gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                                  <FileText className="size-5 text-primary" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base">
                                    {item.category}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {item.data_type}
                                  </p>
                                </div>
                              </div>
                              {getComplianceBadge(item.compliance_status)}
                            </div>
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <HardDrive className="size-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Records
                                  </p>
                                  <p className="font-semibold">
                                    {item.count.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Database className="size-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Size
                                  </p>
                                  <p className="font-semibold">
                                    {item.size_mb} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="size-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Retention
                                  </p>
                                  <p className="font-semibold">
                                    {item.retention_days} days
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="size-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Updated
                                  </p>
                                  <p className="font-semibold">
                                    {format(
                                      new Date(item.last_updated),
                                      "MMM dd",
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Retention Reports Tab */}
              <TabsContent value="retention" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      Data Retention Analysis
                    </CardTitle>
                    <CardDescription>
                      Reports on old and stale data requiring attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Loading retention reports...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {retentionReports.map((report, index) => (
                          <div
                            key={report.id}
                            className="p-5 rounded-xl border bg-card hover:bg-accent/30 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                            style={{ animationDelay: `${index * 70}ms` }}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-amber-500/10">
                                  <Archive className="size-5 text-amber-600" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base">
                                    {report.data_category}
                                  </h3>
                                  <p className="text-xs text-muted-foreground">
                                    Oldest record from{" "}
                                    {format(
                                      new Date(report.oldest_date),
                                      "MMM dd, yyyy",
                                    )}
                                  </p>
                                </div>
                              </div>
                              {report.action_required && (
                                <Badge variant="destructive" className="gap-1">
                                  <AlertTriangle className="size-3" />
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                              <div className="text-center">
                                <p className="text-2xl font-bold">
                                  {report.total_records.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Total Records
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-amber-600">
                                  {report.old_records.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Old Records
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">
                                  {report.stale_records.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Stale Records
                                </p>
                              </div>
                            </div>
                            {report.action_required && (
                              <div className="mt-4 pt-4 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                >
                                  <Trash2 className="size-4" />
                                  Review & Archive
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Data Tab */}
              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Shield className="size-5" />
                      Your Personal Data Report
                    </CardTitle>
                    <CardDescription>
                      Overview of what data we store about you and why
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-2">
                          <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-sm text-muted-foreground">
                            Loading your data report...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 border border-muted">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="size-5 text-primary" />
                            <p className="font-semibold">
                              Data Subject: {user?.username || "Current User"}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            This report shows all categories of personal data
                            stored in our HRMS system
                          </p>
                        </div>

                        {personalData.map((data, index) => (
                          <div
                            key={data.category}
                            className="p-5 rounded-xl border bg-gradient-to-br from-card to-muted/10 animate-in fade-in slide-in-from-bottom-2"
                            style={{ animationDelay: `${index * 80}ms` }}
                          >
                            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                              <div className="size-2 rounded-full bg-primary" />
                              {data.category}
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Data Fields:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {data.fields.map((field) => (
                                    <Badge
                                      key={field}
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <Separator />
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Purpose:
                                  </p>
                                  <p className="text-sm">{data.purpose}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Retention Period:
                                  </p>
                                  <p className="text-sm">
                                    {data.retention_period}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            <strong>Your Rights:</strong> You have the right to
                            access, correct, or request deletion of your
                            personal data. Contact HR for any data-related
                            requests.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
