import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, LogIn, UserPlus } from "lucide-react";
import { useAsgardeo } from "@asgardeo/react";
import { useEffect, useRef } from "react";
import { Button } from "./components/ui/button";
import { useAlert } from "./contexts/AlertContext";
import { AnimatedThemeToggler } from "./components/ui/animated-theme-toggler";

function App() {
  const { isSignedIn, signIn } = useAsgardeo();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const hasHandledLogin = useRef(false);

  // Redirect to dashboard when signed in
  useEffect(() => {
    if (isSignedIn && !hasHandledLogin.current) {
      // Check if this is a fresh login (from session storage flag)
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (justLoggedIn === "true") {
        showAlert({
          title: "Login Successful",
          message: "Welcome back! You have successfully logged in.",
          variant: "success",
        });
        sessionStorage.removeItem("justLoggedIn");
        hasHandledLogin.current = true;
      }
      // Redirect to dashboard
      navigate({ to: "/dashboard" });
    }
  }, [isSignedIn, showAlert, navigate]);

  // Check for signup success notification
  useEffect(() => {
    const justSignedUp = sessionStorage.getItem("justSignedUp");
    if (justSignedUp === "true") {
      showAlert({
        title: "Account Created!",
        message: "Please check your email for verification, then log in.",
        variant: "success",
      });
      sessionStorage.removeItem("justSignedUp");
    }
  }, [showAlert]);

  const handleLogin = async () => {
    try {
      // Set flag for login success alert
      sessionStorage.setItem("justLoggedIn", "true");
      // Trigger Asgardeo sign in directly
      await signIn();
    } catch (err) {
      console.error("Login error:", err);
      sessionStorage.removeItem("justLoggedIn");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/20">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <AnimatedThemeToggler className="flex items-center justify-center size-10 rounded-lg border bg-background hover:bg-accent transition-colors" />
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center gap-8 text-center max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center size-20 rounded-2xl bg-primary shadow-lg">
          <Building2 className="size-10 text-primary-foreground" />
        </div>

        {/* Title & Description */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Welcome to HRMS
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md">
            Your complete Human Resource Management System for modern teams
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <span className="font-medium">Employee Management</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">📅</span>
            </div>
            <span className="font-medium">Leave Tracking</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl">⏰</span>
            </div>
            <span className="font-medium">Attendance</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
          <Button
            size="lg"
            className="px-8 py-6 text-lg font-semibold gap-2"
            onClick={handleLogin}
          >
            <LogIn className="size-5" />
            Login
          </Button>
          <Link to="/signup" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold gap-2 w-full"
            >
              <UserPlus className="size-5" />
              Sign Up
            </Button>
          </Link>
        </div>

        {/* Footer text */}
        <p className="text-sm text-muted-foreground mt-8">
          Secure authentication powered by Asgardeo
        </p>
      </div>
    </div>
  );
}

export default App;
