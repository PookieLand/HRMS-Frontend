import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Mail,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  Loader2,
  CheckCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/contexts/AlertContext";
import {
  initiateOnboarding,
  type InitiateOnboardingRequest,
  type InitiateOnboardingResponse,
  type UserRole,
  formatRole,
} from "@/lib/api/users";

interface OnboardingFormProps {
  accessToken: string;
  currentUserRole: UserRole;
  onSuccess?: (response: InitiateOnboardingResponse) => void;
}

type FormStep = "details" | "success";

export function OnboardingForm({
  accessToken,
  currentUserRole,
  onSuccess,
}: OnboardingFormProps) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [step, setStep] = useState<FormStep>("details");
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] =
    useState<InitiateOnboardingResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState<InitiateOnboardingRequest>({
    email: "",
    role: "employee",
    job_title: "",
    salary: 0,
    salary_currency: "USD",
    employment_type: "permanent",
    probation_months: undefined,
    contract_start_date: undefined,
    contract_end_date: undefined,
    department: "",
    team: "",
    manager_id: undefined,
    joining_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get available roles based on current user's role
  const getAvailableRoles = (): { value: string; label: string }[] => {
    if (currentUserRole === "HR_Admin") {
      return [
        { value: "HR_Manager", label: "HR Manager" },
        { value: "manager", label: "Manager" },
        { value: "employee", label: "Employee" },
      ];
    }
    if (currentUserRole === "HR_Manager") {
      return [
        { value: "manager", label: "Manager" },
        { value: "employee", label: "Employee" },
      ];
    }
    return [];
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // Job title validation
    if (!formData.job_title || formData.job_title.length < 2) {
      newErrors.job_title = "Job title must be at least 2 characters";
    }

    // Salary validation
    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = "Salary must be greater than 0";
    }

    // Joining date validation
    if (!formData.joining_date) {
      newErrors.joining_date = "Joining date is required";
    }

    // Employment type specific validations
    if (formData.employment_type === "permanent") {
      // Probation months is optional but must be valid if provided
      if (formData.probation_months !== undefined) {
        if (formData.probation_months < 1 || formData.probation_months > 12) {
          newErrors.probation_months =
            "Probation period must be between 1 and 12 months";
        }
      }
    }

    if (formData.employment_type === "contract") {
      if (!formData.contract_start_date) {
        newErrors.contract_start_date = "Contract start date is required";
      }
      if (!formData.contract_end_date) {
        newErrors.contract_end_date = "Contract end date is required";
      }
      if (
        formData.contract_start_date &&
        formData.contract_end_date &&
        formData.contract_end_date <= formData.contract_start_date
      ) {
        newErrors.contract_end_date = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Clean up the data before sending
      const requestData: InitiateOnboardingRequest = {
        email: formData.email,
        role: formData.role as "HR_Manager" | "manager" | "employee",
        job_title: formData.job_title,
        salary: formData.salary,
        salary_currency: formData.salary_currency || "USD",
        employment_type: formData.employment_type,
        joining_date: formData.joining_date,
      };

      // Add optional fields if they have values
      if (formData.department) requestData.department = formData.department;
      if (formData.team) requestData.team = formData.team;
      if (formData.notes) requestData.notes = formData.notes;
      if (formData.manager_id) requestData.manager_id = formData.manager_id;

      // Employment type specific fields
      if (
        formData.employment_type === "permanent" &&
        formData.probation_months
      ) {
        requestData.probation_months = formData.probation_months;
      }
      if (formData.employment_type === "contract") {
        requestData.contract_start_date = formData.contract_start_date;
        requestData.contract_end_date = formData.contract_end_date;
      }

      const response = await initiateOnboarding(accessToken, requestData);
      setSuccessData(response);
      setStep("success");

      showAlert({
        title: "Onboarding Initiated",
        message: `Invitation sent to ${response.email}`,
        variant: "success",
      });

      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      showAlert({
        title: "Onboarding Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to initiate onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInvitationLink = async () => {
    if (successData?.invitation_link) {
      await navigator.clipboard.writeText(successData.invitation_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartAnother = () => {
    setFormData({
      email: "",
      role: "employee",
      job_title: "",
      salary: 0,
      salary_currency: "USD",
      employment_type: "permanent",
      probation_months: undefined,
      contract_start_date: undefined,
      contract_end_date: undefined,
      department: "",
      team: "",
      manager_id: undefined,
      joining_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setSuccessData(null);
    setStep("details");
  };

  // Success state
  if (step === "success" && successData) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl">Onboarding Initiated!</CardTitle>
          <CardDescription className="text-base">
            An invitation has been sent to the new employee
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium">{successData.email}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline">
                {formatRole(successData.role as UserRole)}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="font-medium">{successData.job_title}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="font-medium">
                {new Date(successData.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Invitation Link
            </Label>
            <div className="flex gap-2">
              <Input
                value={successData.invitation_link}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyInvitationLink}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  window.open(successData.invitation_link, "_blank")
                }
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleStartAnother}
            >
              Onboard Another
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate({ to: "/dashboard/users" })}
            >
              View All Users
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Form state
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Mail className="h-5 w-5 text-primary" />
          Basic Information
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="employee@company.com"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">
              Role <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleSelectChange("role", value)}
            >
              <SelectTrigger
                className={errors.role ? "border-destructive" : ""}
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableRoles().map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Job Details */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Briefcase className="h-5 w-5 text-primary" />
          Job Details
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job_title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="job_title"
              name="job_title"
              placeholder="Software Engineer"
              value={formData.job_title}
              onChange={handleInputChange}
              className={errors.job_title ? "border-destructive" : ""}
            />
            {errors.job_title && (
              <p className="text-sm text-destructive">{errors.job_title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              placeholder="Engineering"
              value={formData.department || ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Input
              id="team"
              name="team"
              placeholder="Platform Team"
              value={formData.team || ""}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="joining_date">
              Joining Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="joining_date"
              name="joining_date"
              type="date"
              value={formData.joining_date}
              onChange={handleInputChange}
              className={errors.joining_date ? "border-destructive" : ""}
            />
            {errors.joining_date && (
              <p className="text-sm text-destructive">{errors.joining_date}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Compensation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="h-5 w-5 text-primary" />
          Compensation
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salary">
              Annual Salary <span className="text-destructive">*</span>
            </Label>
            <Input
              id="salary"
              name="salary"
              type="number"
              min="0"
              step="1000"
              placeholder="75000"
              value={formData.salary || ""}
              onChange={handleInputChange}
              className={errors.salary ? "border-destructive" : ""}
            />
            {errors.salary && (
              <p className="text-sm text-destructive">{errors.salary}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary_currency">Currency</Label>
            <Select
              value={formData.salary_currency}
              onValueChange={(value) =>
                handleSelectChange("salary_currency", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                <SelectItem value="LKR">LKR - Sri Lankan Rupee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Employment Type */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-primary" />
          Employment Type
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employment_type">Type</Label>
            <Select
              value={formData.employment_type}
              onValueChange={(value) =>
                handleSelectChange(
                  "employment_type",
                  value as "permanent" | "contract",
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.employment_type === "permanent" && (
            <div className="space-y-2">
              <Label htmlFor="probation_months">
                Probation Period (months)
              </Label>
              <Input
                id="probation_months"
                name="probation_months"
                type="number"
                min="1"
                max="12"
                placeholder="3"
                value={formData.probation_months || ""}
                onChange={handleInputChange}
                className={errors.probation_months ? "border-destructive" : ""}
              />
              {errors.probation_months && (
                <p className="text-sm text-destructive">
                  {errors.probation_months}
                </p>
              )}
            </div>
          )}

          {formData.employment_type === "contract" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="contract_start_date">
                  Contract Start <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contract_start_date"
                  name="contract_start_date"
                  type="date"
                  value={formData.contract_start_date || ""}
                  onChange={handleInputChange}
                  className={
                    errors.contract_start_date ? "border-destructive" : ""
                  }
                />
                {errors.contract_start_date && (
                  <p className="text-sm text-destructive">
                    {errors.contract_start_date}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_end_date">
                  Contract End <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contract_end_date"
                  name="contract_end_date"
                  type="date"
                  value={formData.contract_end_date || ""}
                  onChange={handleInputChange}
                  className={
                    errors.contract_end_date ? "border-destructive" : ""
                  }
                />
                {errors.contract_end_date && (
                  <p className="text-sm text-destructive">
                    {errors.contract_end_date}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <FileText className="h-5 w-5 text-primary" />
          Additional Notes
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Any additional notes about this employee..."
            value={formData.notes || ""}
            onChange={handleInputChange}
            rows={3}
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/dashboard" })}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending Invitation...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
