import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-gray-500 dark:placeholder:text-gray-400 selection:bg-black dark:selection:bg-gray-800 selection:text-white flex field-sizing-content min-h-16 w-full rounded-md border bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 px-3 py-2 text-gray-900 dark:text-white text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-black dark:focus-visible:border-gray-400 focus-visible:ring-black/20 dark:focus-visible:ring-gray-400/20 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:aria-invalid:border-red-500 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
