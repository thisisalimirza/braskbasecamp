import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-border/80 bg-background px-3 py-2 text-base shadow-sm transition-[border-color,box-shadow] outline-none md:h-9 md:py-1 md:text-sm",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "placeholder:text-muted-foreground/60",
        "focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/15",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60",
        "aria-invalid:border-destructive/80 aria-invalid:ring-2 aria-invalid:ring-destructive/15",
        "dark:bg-card dark:disabled:bg-muted/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
