import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"


const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "text-foreground",

        lavender: "bg-violet-50 text-violet-700 border-violet-200",
        peach: "bg-orange-50 text-orange-700 border-orange-200",
        sky: "bg-sky-50 text-sky-700 border-sky-200",
        mint: "bg-emerald-50 text-emerald-700 border-emerald-200",
        lemon: "bg-yellow-50 text-yellow-800 border-yellow-200",
        plum: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
        rose: "bg-rose-50 text-rose-700 border-rose-200",
        slate: "bg-slate-50 text-slate-700 border-slate-200",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

export function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
