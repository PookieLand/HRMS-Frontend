import { useEffect } from "react";
import { useAsgardeo } from "@asgardeo/react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { signIn, isSignedIn } = useAsgardeo();
  const navigate = useNavigate();

  useEffect(() => {
    // If already signed in, redirect to dashboard
    if (isSignedIn) {
      navigate({ to: "/dashboard" });
      return;
    }

    // Otherwise, initiate Asgardeo sign-in
    const initiateLogin = async () => {
      try {
        // Set flag for login success alert
        sessionStorage.setItem("justLoggedIn", "true");
        await signIn();
      } catch (err) {
        console.error("Login redirect error:", err);
        sessionStorage.removeItem("justLoggedIn");
        // Redirect to home on error
        navigate({ to: "/" });
      }
    };

    initiateLogin();
  }, [signIn, isSignedIn, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}
