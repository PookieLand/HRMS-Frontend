import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  User,
  Lock,
  Phone,
  MapPin,
  Heart,
  Building2,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Mail,
  Briefcase,
  Calendar,
  DollarSign,
  Clock,
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
  getOnboardingPreview,
  signupStep1,
  signupStep2,
  type OnboardingPreview,
  type SignupStep1Request,
  type SignupStep1Response,
  type SignupStep2Request,
  type SignupStep2Response,
  formatRole,
  type UserRole,
} from "@/lib/api/users";

type WizardStep =
  | "loading"
  | "preview"
  | "step1"
  | "step2"
  | "success"
  | "error";

interface Step1FormData {
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
  confirm_password: string;
}

interface Step2FormData {
  date_of_birth: string;
  gender: string;
  nationality: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  bank_name: string;
  bank_account_number: string;
  bank_routing_number: string;
}

export function EmployeeSignupWizard() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Get token from URL search params
  const search = useSearch({ strict: false }) as { token?: string };
  const invitationToken = search?.token || "";

  const [currentStep, setCurrentStep] = useState<WizardStep>("loading");
  const [preview, setPreview] = useState<OnboardingPreview | null>(null);
  const [, setStep1Response] = useState<SignupStep1Response | null>(null);
  const [step2Response, setStep2Response] =
    useState<SignupStep2Response | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form state for Step 1
  const [step1Data, setStep1Data] = useState<Step1FormData>({
    first_name: "",
    last_name: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  // Form state for Step 2
  const [step2Data, setStep2Data] = useState<Step2FormData>({
    date_of_birth: "",
    gender: "",
    nationality: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    bank_name: "",
    bank_account_number: "",
    bank_routing_number: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load preview on mount
  useEffect(() => {
    if (!invitationToken) {
      setErrorMessage(
        "No invitation token provided. Please use the link from your invitation email.",
      );
      setCurrentStep("error");
      return;
    }

    loadPreview();
  }, [invitationToken]);

  const loadPreview = async () => {
    try {
      setCurrentStep("loading");
      const data = await getOnboardingPreview(invitationToken);
      setPreview(data);

      if (data.is_expired) {
        setErrorMessage(
          "This invitation has expired. Please contact HR for a new invitation.",
        );
        setCurrentStep("error");
      } else if (!data.is_valid) {
        setErrorMessage(
          "This invitation is no longer valid. Please contact HR.",
        );
        setCurrentStep("error");
      } else {
        setCurrentStep("preview");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load invitation. Please check your link and try again.",
      );
      setCurrentStep("error");
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step1Data.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!step1Data.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!step1Data.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]+$/.test(step1Data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!step1Data.password) {
      newErrors.password = "Password is required";
    } else {
      if (step1Data.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(step1Data.password)) {
        newErrors.password =
          "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(step1Data.password)) {
        newErrors.password =
          "Password must contain at least one lowercase letter";
      } else if (!/\d/.test(step1Data.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(step1Data.password)) {
        newErrors.password =
          "Password must contain at least one special character";
      }
    }

    if (step1Data.password !== step1Data.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async () => {
    if (!validateStep1()) return;

    setIsLoading(true);
    try {
      const request: SignupStep1Request = {
        invitation_token: invitationToken,
        first_name: step1Data.first_name,
        last_name: step1Data.last_name,
        phone: step1Data.phone,
        password: step1Data.password,
      };

      const response = await signupStep1(request);
      setStep1Response(response);
      setCurrentStep("step2");

      showAlert({
        title: "Account Created",
        message: "Your account has been created. Please complete your profile.",
        variant: "success",
      });
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    setIsLoading(true);
    try {
      const request: SignupStep2Request = {
        invitation_token: invitationToken,
      };

      // Add optional fields if they have values
      if (step2Data.date_of_birth)
        request.date_of_birth = step2Data.date_of_birth;
      if (step2Data.gender)
        request.gender = step2Data.gender as "male" | "female" | "other";
      if (step2Data.nationality) request.nationality = step2Data.nationality;
      if (step2Data.address_line_1)
        request.address_line_1 = step2Data.address_line_1;
      if (step2Data.address_line_2)
        request.address_line_2 = step2Data.address_line_2;
      if (step2Data.city) request.city = step2Data.city;
      if (step2Data.state) request.state = step2Data.state;
      if (step2Data.country) request.country = step2Data.country;
      if (step2Data.postal_code) request.postal_code = step2Data.postal_code;
      if (step2Data.emergency_contact_name)
        request.emergency_contact_name = step2Data.emergency_contact_name;
      if (step2Data.emergency_contact_phone)
        request.emergency_contact_phone = step2Data.emergency_contact_phone;
      if (step2Data.emergency_contact_relationship)
        request.emergency_contact_relationship =
          step2Data.emergency_contact_relationship;
      if (step2Data.bank_name) request.bank_name = step2Data.bank_name;
      if (step2Data.bank_account_number)
        request.bank_account_number = step2Data.bank_account_number;
      if (step2Data.bank_routing_number)
        request.bank_routing_number = step2Data.bank_routing_number;

      const response = await signupStep2(request);
      setStep2Response(response);
      setCurrentStep("success");

      showAlert({
        title: "Onboarding Complete!",
        message:
          "Welcome to the team! Please check your email to set your password.",
        variant: "success",
      });
    } catch (error) {
      showAlert({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    step: "step1" | "step2",
    field: string,
    value: string,
  ) => {
    if (step === "step1") {
      setStep1Data((prev) => ({ ...prev, [field]: value }));
    } else {
      setStep2Data((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Loading state
  if (currentStep === "loading") {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your invitation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (currentStep === "error") {
    return (
      <Card className="max-w-lg mx-auto border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Invitation Error</CardTitle>
          <CardDescription className="text-base">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate({ to: "/" })}>Return Home</Button>
        </CardContent>
      </Card>
    );
  }

  // Preview state
  if (currentStep === "preview" && preview) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Welcome to {preview.company_name}!
          </CardTitle>
          <CardDescription className="text-base">
            You've been invited to join our team. Review your details below and
            click continue to create your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{preview.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge variant="outline">
                  {formatRole(preview.role as UserRole)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="font-medium">{preview.job_title}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">
                  {preview.department || "Not assigned"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Joining Date</p>
                <p className="font-medium">
                  {new Date(preview.joining_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <Badge variant="secondary" className="capitalize">
                  {preview.employment_type}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Annual Salary</p>
                <p className="font-medium">
                  {preview.salary_currency} {preview.salary.toLocaleString()}
                </p>
              </div>
            </div>

            {preview.employment_type === "permanent" &&
              preview.probation_months && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Probation Period
                    </p>
                    <p className="font-medium">
                      {preview.probation_months} months
                    </p>
                  </div>
                </div>
              )}

            {preview.employment_type === "contract" && (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contract Start
                    </p>
                    <p className="font-medium">
                      {preview.contract_start_date
                        ? new Date(
                            preview.contract_start_date,
                          ).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Contract End
                    </p>
                    <p className="font-medium">
                      {preview.contract_end_date
                        ? new Date(
                            preview.contract_end_date,
                          ).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button size="lg" onClick={() => setCurrentStep("step1")}>
              Continue to Create Account
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 1: Create Account
  if (currentStep === "step1") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm">
              2
            </div>
          </div>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Set up your login credentials and basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email (frozen) */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{preview?.email}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                Cannot be changed
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Name Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="first_name"
                  placeholder="John"
                  value={step1Data.first_name}
                  onChange={(e) =>
                    handleInputChange("step1", "first_name", e.target.value)
                  }
                  className={`pl-10 ${errors.first_name ? "border-destructive" : ""}`}
                />
              </div>
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="last_name"
                  placeholder="Doe"
                  value={step1Data.last_name}
                  onChange={(e) =>
                    handleInputChange("step1", "last_name", e.target.value)
                  }
                  className={`pl-10 ${errors.last_name ? "border-destructive" : ""}`}
                />
              </div>
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={step1Data.phone}
                onChange={(e) =>
                  handleInputChange("step1", "phone", e.target.value)
                }
                className={`pl-10 ${errors.phone ? "border-destructive" : ""}`}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <Separator />

          {/* Password Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={step1Data.password}
                  onChange={(e) =>
                    handleInputChange("step1", "password", e.target.value)
                  }
                  className={`pl-10 ${errors.password ? "border-destructive" : ""}`}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm_password"
                  type="password"
                  value={step1Data.confirm_password}
                  onChange={(e) =>
                    handleInputChange(
                      "step1",
                      "confirm_password",
                      e.target.value,
                    )
                  }
                  className={`pl-10 ${errors.confirm_password ? "border-destructive" : ""}`}
                />
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password}
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters with uppercase, lowercase,
            number, and special character.
          </p>

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep("preview")}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleStep1Submit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Step 2: Personal Details
  if (currentStep === "step2") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white text-sm">
              <CheckCircle className="h-4 w-4" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
          </div>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Add your personal details. All fields are optional but help us serve
            you better.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" />
              Personal Information
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={step2Data.date_of_birth}
                  onChange={(e) =>
                    handleInputChange("step2", "date_of_birth", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={step2Data.gender}
                  onValueChange={(value) =>
                    handleInputChange("step2", "gender", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  placeholder="e.g., American"
                  value={step2Data.nationality}
                  onChange={(e) =>
                    handleInputChange("step2", "nationality", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Address
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Input
                  id="address_line_1"
                  placeholder="123 Main Street"
                  value={step2Data.address_line_1}
                  onChange={(e) =>
                    handleInputChange("step2", "address_line_1", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_line_2">Address Line 2</Label>
                <Input
                  id="address_line_2"
                  placeholder="Apt 4B"
                  value={step2Data.address_line_2}
                  onChange={(e) =>
                    handleInputChange("step2", "address_line_2", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={step2Data.city}
                    onChange={(e) =>
                      handleInputChange("step2", "city", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={step2Data.state}
                    onChange={(e) =>
                      handleInputChange("step2", "state", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="USA"
                    value={step2Data.country}
                    onChange={(e) =>
                      handleInputChange("step2", "country", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    placeholder="10001"
                    value={step2Data.postal_code}
                    onChange={(e) =>
                      handleInputChange("step2", "postal_code", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Heart className="h-4 w-4" />
              Emergency Contact
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Name</Label>
                <Input
                  id="emergency_contact_name"
                  placeholder="Jane Doe"
                  value={step2Data.emergency_contact_name}
                  onChange={(e) =>
                    handleInputChange(
                      "step2",
                      "emergency_contact_name",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  placeholder="+1 (555) 987-6543"
                  value={step2Data.emergency_contact_phone}
                  onChange={(e) =>
                    handleInputChange(
                      "step2",
                      "emergency_contact_phone",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact_relationship">
                  Relationship
                </Label>
                <Input
                  id="emergency_contact_relationship"
                  placeholder="Spouse"
                  value={step2Data.emergency_contact_relationship}
                  onChange={(e) =>
                    handleInputChange(
                      "step2",
                      "emergency_contact_relationship",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Bank Details (for payroll)
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  placeholder="Chase Bank"
                  value={step2Data.bank_name}
                  onChange={(e) =>
                    handleInputChange("step2", "bank_name", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Account Number</Label>
                <Input
                  id="bank_account_number"
                  placeholder="****1234"
                  value={step2Data.bank_account_number}
                  onChange={(e) =>
                    handleInputChange(
                      "step2",
                      "bank_account_number",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_routing_number">Routing Number</Label>
                <Input
                  id="bank_routing_number"
                  placeholder="021000021"
                  value={step2Data.bank_routing_number}
                  onChange={(e) =>
                    handleInputChange(
                      "step2",
                      "bank_routing_number",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between">
            <Button variant="outline" disabled>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleStep2Submit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Onboarding
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (currentStep === "success" && step2Response) {
    return (
      <Card className="max-w-lg mx-auto border-emerald-500/20 bg-emerald-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
          <CardDescription className="text-base">
            Your onboarding is complete. You're all set to start your journey
            with us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Position</span>
              <span className="font-medium">{step2Response.job_title}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role</span>
              <Badge variant="outline">
                {formatRole(step2Response.role as UserRole)}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Start Date</span>
              <span className="font-medium">
                {new Date(step2Response.joining_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {step2Response.check_email_for_password && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">Check Your Email</p>
                <p className="text-sm text-muted-foreground">
                  We've sent you an email with instructions to set up your
                  password and access the system.
                </p>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={() => navigate({ to: "/" })}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
