import { Link } from "@tanstack/react-router";
import { Building2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/signup-form";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function SignupPage() {
 return (
  <div className="grid min-h-screen lg:grid-cols-2">
   {/* Left Section - Branding */}
   <div className="relative hidden lg:flex flex-col justify-between items-center bg-primary p-10 text-primary-foreground">
    {/* Background Pattern */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />

    {/* Logo */}
    <div className="relative flex items-center gap-3">
     <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground">
      <Building2 className="size-6 text-primary" />
     </div>
     <span className="text-2xl font-bold">HRMS</span>
    </div>

    {/* Main Content */}
    <div className="relative space-y-6 text-center">
     <h1 className="text-4xl font-bold leading-tight">
      Start managing your
      <br />
      workforce today
     </h1>
     <p className="text-lg text-primary-foreground/80 max-w-md mx-auto">
      Join thousands of companies using HRMS to streamline their human
      resource operations.
     </p>

     {/* Features List */}
     <ul className="space-y-3 text-primary-foreground/90 inline-block text-left">
      <li className="flex items-center gap-2">
       <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20">
        ✓
       </span>
       Easy employee onboarding
      </li>
      <li className="flex items-center gap-2">
       <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20">
        ✓
       </span>
       Automated leave management
      </li>
      <li className="flex items-center gap-2">
       <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20">
        ✓
       </span>
       Real-time attendance tracking
      </li>
      <li className="flex items-center gap-2">
       <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20">
        ✓
       </span>
       Comprehensive analytics
      </li>
     </ul>
    </div>

    {/* Footer */}
    <div className="relative text-sm text-primary-foreground/60">
     © {new Date().getFullYear()} HRMS. All rights reserved.
    </div>
   </div>

   {/* Right Section - Form */}
   <div className="relative flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-4 md:p-6">
     <Link to="/">
      <Button variant="ghost" size="sm" className="gap-2">
       <ArrowLeft className="size-4" />
       Back to Home
      </Button>
     </Link>
     <AnimatedThemeToggler className="flex items-center justify-center size-10 rounded-lg border bg-background hover:bg-accent transition-colors" />
    </div>

    {/* Mobile Logo */}
    <div className="flex items-center justify-center gap-2 py-4 lg:hidden">
     <div className="flex size-8 items-center justify-center rounded-md bg-primary">
      <Building2 className="size-5 text-primary-foreground" />
     </div>
     <span className="text-xl font-bold">HRMS</span>
    </div>

    {/* Form Container */}
    <div className="flex flex-1 items-center justify-center p-6 md:p-10">
     <div className="w-full max-w-sm">
      <SignupForm />
     </div>
    </div>

    {/* Mobile Footer */}
    <div className="p-4 text-center text-sm text-muted-foreground lg:hidden">
     © {new Date().getFullYear()} HRMS. All rights reserved.
    </div>
   </div>
  </div>
 );
}
