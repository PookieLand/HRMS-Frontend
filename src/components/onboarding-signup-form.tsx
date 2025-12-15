/**
 * Onboarding Signup Form
 *
 * Multi-step form for employee signup after receiving invitation email:
 * - Step 1: Create user account (password, personal info)
 * - Step 2: Complete employee profile (additional details)
 *
 * This form is accessed via invitation link with token parameter.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  CheckCircle2,
  User,
  Lock,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  Briefcase
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
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAlert } from "@/contexts/AlertContext";
import {
  getOnboardingPreview,
  completeSignupStep1,
  completeSignupStep2,
  validatePassword,
  calculatePasswordStrength,
  getPasswordStrengthLabel,
  formatEmploymentType,
  type OnboardingPreviewData,
  type SignupStep1Request,
  type SignupStep2Request,
} from "@/lib/api/onboarding";

type Step = 1 | 2;

export function OnboardingSignupForm() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const searchParams = useSearch({ from: "/signup" }) as { token?: string };
  const invitationToken = searchParams.token;

  // State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preview data from invitation
  const [previewData, setPreviewData] = useState<OnboardingPreviewData | null>(null);

  // Step 1 form data
  const [step1Data, setStep1Data] = useState<Partial<SignupStep1Request>>({
    invitation_token: invitationToken || "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Step 2 form data
  const [step2Data, setStep2Data] = useState<Partial<SignupStep2Request>>({
    invitation_token: invitationToken || "",
    date_of_birth: undefined,
    gender: undefined,
    nationality: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Load invitation preview
  useEffect(() => {
    if (!invitationToken) {
      showAlert({
        title: "Invalid Invitation",
        message: "No invitation token provided. Please use the link from your email.",
        variant: "destructive",
      });
      setIsLoadingPreview(false);
      return;
    }

    loadPreview();
  }, [invitationToken]);

  const loadPreview = async () => {
    try {
      setIsLoadingPreview(true);
      const data = await getOnboardingPreview(invitationToken!);

      if (!data.is_valid) {
        showAlert({
          title: "Invalid Invitation",
          message: data.is_expired
            ? "This invitation has expired. Please contact HR to resend the invitation."
            : "This invitation is no longer valid.",
          variant: "destructive",
        });
        return;
      }

      setPreviewData(data);

      // Check if step 1 already completed by checking status
      // If asgardeo user already created, skip to step 2
      // This would need to call getOnboardingStatus endpoint

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invitation";
      showAlert({
        title: "Error",
        message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Update password strength on change
  useEffect(() => {
    if (step1Data.password) {
      const strength = calculatePasswordStrength(step1Data.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [step1Data.password]);

  // Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!step1Data.first_name?.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!step1Data.last_name?.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!step1Data.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!step1Data.password) {
      newErrors.password = "Password is required";
    } else {
      const validation = validatePassword(step1Data.password);
      if (!validation.isValid) {
        newErrors.password = validation.errors[0];
      }
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (step1Data.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    // Step 2 fields are mostly optional, but we can add basic validation
    const newErrors: Record<string, string> = {};

    // Add any required validations here
    // For now, all step 2 fields are optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Step 1 submission
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);

    try {
      await completeSignupStep1({
        invitation_token: step1Data.invitation_token!,
        password: step1Data.password!,
        first_name: step1Data.first_name!,
        last_name: step1Data.last_name!,
        phone: step1Data.phone!,
      });

      showAlert({
        title: "Account Created",
        message: "Your user account has been created successfully. Please complete your profile.",
        variant: "default",
      });

      setCurrentStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      showAlert({
        title: "Error",
        message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2 submission
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await completeSignupStep2({
        invitation_token: step2Data.invitation_token!,
        date_of_birth: step2Data.date_of_birth || undefined,
        gender: step2Data.gender || undefined,
        nationality: step2Data.nationality || undefined,
        address_line_1: step2Data.address_line_1 || undefined,
        address_line_2: step2Data.address_line_2 || undefined,
        city: step2Data.city || undefined,
        state: step2Data.state || undefined,
        postal_code: step2Data.postal_code || undefined,
        country: step2Data.country || undefined,
        emergency_contact_name: step2Data.emergency_contact_name || undefined,
        emergency_contact_phone: step2Data.emergency_contact_phone || undefined,
        emergency_contact_relationship: step2Data.emergency_contact_relationship || undefined,
      });

      showAlert({
        title: "Onboarding Complete! 🎉",
        message: `Welcome ${response.email}! Your account has been successfully created. You can now sign in to access your dashboard.`,
        variant: "default",
      });

      // Store completion flag
      sessionStorage.setItem("onboardingComplete", "true");

      // Redirect to home/sign in page after 2 seconds
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to complete profile";
      showAlert({
        title: "Error",
        message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoadingPreview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading invitation details...</p>
      </div>
    );
  }

  // Invalid invitation
  if (!previewData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid Invitation</AlertTitle>
        <AlertDescription>
          This invitation link is invalid or has expired. Please contact your HR department for assistance.
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate progress
  const progress = currentStep === 1 ? 50 : 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Complete Your Registration</h1>
        <p className="text-muted-foreground">
          Step {currentStep} of 2 - {currentStep === 1 ? "Create Account" : "Complete Profile"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span className={currentStep === 1 ? "text-primary font-medium" : ""}>
            Create Account
          </span>
          <span className={currentStep === 2 ? "text-primary font-medium" : ""}>
            Complete Profile
          </span>
        </div>
      </div>

      {/* Invitation Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Your Position Details
          </CardTitle>
          <CardDescription>
            This information was provided by your HR department
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground">Email</Label>
            <p className="font-medium">{previewData.email}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Role</Label>
            <p className="font-medium capitalize">{previewData.role.replace("_", " ")}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Job Title</Label>
            <p className="font-medium">{previewData.job_title}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Employment Type</Label>
            <p className="font-medium">{formatEmploymentType(previewData.employment_type)}</p>
          </div>
          {previewData.department && (
            <div>
              <Label className="text-muted-foreground">Department</Label>
              <p className="font-medium">{previewData.department}</p>
            </div>
          )}
          {previewData.team && (
            <div>
              <Label className="text-muted-foreground">Team</Label>
              <p className="font-medium">{previewData.team}</p>
            </div>
          )}
          <div>
            <Label className="text-muted-foreground">Joining Date</Label>
            <p className="font-medium">
              {new Date(previewData.joining_date).toLocaleDateString()}
            </p>
          </div>
          {previewData.probation_months && (
            <div>
              <Label className="text-muted-foreground">Probation Period</Label>
              <p className="font-medium">{previewData.probation_months} months</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Step 1: Create Account */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Create Your Account
              </CardTitle>
              <CardDescription>
                Set up your login credentials and personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_name"
                    placeholder="John"
                    value={step1Data.first_name || ""}
                    onChange={(e) => {
                      setStep1Data({ ...step1Data, first_name: e.target.value });
                      if (errors.first_name) {
                        setErrors({ ...errors, first_name: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={errors.first_name ? "border-destructive" : ""}
                  />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="last_name"
                    placeholder="Doe"
                    value={step1Data.last_name || ""}
                    onChange={(e) => {
                      setStep1Data({ ...step1Data, last_name: e.target.value });
                      if (errors.last_name) {
                        setErrors({ ...errors, last_name: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={errors.last_name ? "border-destructive" : ""}
                  />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={step1Data.phone || ""}
                  onChange={(e) => {
                    setStep1Data({ ...step1Data, phone: e.target.value });
                    if (errors.phone) {
                      setErrors({ ...errors, phone: "" });
                    }
                  }}
                  disabled={isLoading}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="h-4 w-4 inline mr-2" />
                  Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a strong password"
                    value={step1Data.password || ""}
                    onChange={(e) => {
                      setStep1Data({ ...step1Data, password: e.target.value });
                      if (errors.password) {
                        setErrors({ ...errors, password: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {step1Data.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Progress value={passwordStrength} className="h-2 flex-1" />
                      <span className={`text-sm ${getPasswordStrengthLabel(passwordStrength).color}`}>
                        {getPasswordStrengthLabel(passwordStrength).label}
                      </span>
                    </div>
                  </div>
                )}
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm_password">
                  Confirm Password <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: "" });
                      }
                    }}
                    disabled={isLoading}
                    className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Continue to Profile
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Step 2: Complete Profile */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>
                Additional information (optional) - You can skip and update this later
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Personal Information</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Date of Birth
                    </Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={step2Data.date_of_birth || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, date_of_birth: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={step2Data.gender || ""}
                      onValueChange={(value) =>
                        setStep2Data({ ...step2Data, gender: value as any })
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="e.g., American, British, Indian"
                    value={step2Data.nationality || ""}
                    onChange={(e) =>
                      setStep2Data({ ...step2Data, nationality: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="address_line_1">Address Line 1</Label>
                  <Input
                    id="address_line_1"
                    placeholder="Street address"
                    value={step2Data.address_line_1 || ""}
                    onChange={(e) =>
                      setStep2Data({ ...step2Data, address_line_1: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={step2Data.address_line_2 || ""}
                    onChange={(e) =>
                      setStep2Data({ ...step2Data, address_line_2: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={step2Data.city || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, city: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="State or Province"
                      value={step2Data.state || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, state: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      placeholder="Postal/ZIP code"
                      value={step2Data.postal_code || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, postal_code: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Country"
                      value={step2Data.country || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, country: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="font-semibold">Emergency Contact</h3>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    placeholder="Full name"
                    value={step2Data.emergency_contact_name || ""}
                    onChange={(e) =>
                      setStep2Data({ ...step2Data, emergency_contact_name: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={step2Data.emergency_contact_phone || ""}
                      onChange={(e) =>
                        setStep2Data({ ...step2Data, emergency_contact_phone: e.target.value })
                      }
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                    <Input
                      id="emergency_contact_relationship"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      value={step2Data.emergency_contact_relationship || ""}
                      onChange={(e) =>
                        setStep2Data({
                          ...step2Data,
                          emergency_contact_relationship: e.target.value,
                        })
                      }
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(1)}
                  disabled={isLoading}
                >
                  Back to Account
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Registration...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                You can skip optional fields and update them later from your profile settings.
              </p>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
