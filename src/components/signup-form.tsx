import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signup, type SignupRequest } from "@/lib/api/auth";
import { useAlert } from "@/contexts/AlertContext";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter";
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (
      !/(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])/.test(formData.password)
    ) {
      newErrors.password =
        "Password must contain at least one special character";
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const signupData: SignupRequest = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      };

      await signup(signupData);

      // Set flag to show notification on home page
      sessionStorage.setItem("justSignedUp", "true");

      // Redirect to home page
      navigate({ to: "/" });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again.";

      showAlert({
        title: "Signup Failed",
        message: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Fill in the form below to create your account
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="firstName">First Name</FieldLabel>
          <Input
            id="firstName"
            type="text"
            placeholder="John"
            value={formData.firstName}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <FieldDescription className="text-destructive">
              {errors.firstName}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
          <Input
            id="lastName"
            type="text"
            placeholder="Doe"
            value={formData.lastName}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <FieldDescription className="text-destructive">
              {errors.lastName}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email ? (
            <FieldDescription className="text-destructive">
              {errors.email}
            </FieldDescription>
          ) : (
            <FieldDescription></FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && (
            <FieldDescription className="text-destructive">
              {errors.phone}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.password ? "border-destructive" : ""}
          />
          {errors.password ? (
            <FieldDescription className="text-destructive">
              {errors.password}
            </FieldDescription>
          ) : (
            <FieldDescription>
              Must be at least 8 characters with uppercase, lowercase, number,
              and special character.
            </FieldDescription>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            disabled={isLoading}
            required
            className={errors.confirmPassword ? "border-destructive" : ""}
          />
          {errors.confirmPassword && (
            <FieldDescription className="text-destructive">
              {errors.confirmPassword}
            </FieldDescription>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="px-6 text-center">
            Already have an account?{" "}
            <a href="/" className="text-primary hover:underline font-medium">
              Sign in
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
