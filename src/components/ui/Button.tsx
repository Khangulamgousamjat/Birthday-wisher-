import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string;
  children: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, containerClassName = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn("neon-btn", containerClassName.includes("w-full") ? "w-full" : "", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
