import { Building2 } from "lucide-react";
import { EmployeeSignupWizard } from "@/components/employee-signup-wizard";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export default function EmployeeSignupPage() {
 return (
  <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
   {/* Subtle grid pattern */}
   <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

   {/* Header */}
   <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
    <div className="flex items-center gap-3">
     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
      <Building2 className="h-5 w-5 text-primary-foreground" />
     </div>
     <span className="text-xl font-bold tracking-tight">HRMS</span>
    </div>
    <AnimatedThemeToggler className="flex items-center justify-center size-10 rounded-lg border bg-background hover:bg-accent transition-colors" />
   </header>

   {/* Main Content */}
   <main className="relative z-10 container mx-auto px-4 py-8 md:py-12">
    <EmployeeSignupWizard />
   </main>

   {/* Footer */}
   <footer className="relative z-10 py-6 text-center text-sm text-muted-foreground">
    <p>© {new Date().getFullYear()} HRMS. All rights reserved.</p>
    <p className="mt-1 text-xs">
     Need help?{" "}
     <a href="mailto:support@hrms.com" className="text-primary hover:underline">
      Contact Support
     </a>
    </p>
   </footer>
  </div>
 );
}
