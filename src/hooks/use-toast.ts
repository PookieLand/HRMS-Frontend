import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant = "default", duration = 4000 }: ToastOptions) => {
    const message = title || description || "";
    const details = title && description ? description : undefined;

    if (variant === "destructive") {
      sonnerToast.error(message, {
        description: details,
        duration,
      });
    } else {
      sonnerToast.success(message, {
        description: details,
        duration,
      });
    }
  };

  return { toast };
}
