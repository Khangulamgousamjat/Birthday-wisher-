import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  containerClassName?: string;
  children: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, containerClassName = "", children, ...props }, ref) => {
    return (
      <div className={cn("noise-container", containerClassName)}>
        <div className="gradient-layer gradient-1" />
        <div className="gradient-layer gradient-2" />
        <div className="gradient-layer gradient-3" />
        <div className="top-strip" />
        <div className="noise-overlay" />
        <div className="content-wrapper">
          <button
            ref={ref}
            className={cn("publish-btn", className)}
            {...props}
          >
            {children}
          </button>
        </div>
      </div>
    );
  }
);

Button.displayName = "Button";
