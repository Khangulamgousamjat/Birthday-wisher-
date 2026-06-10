import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export type ButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: "primary" | "secondary" | "outline";
  children?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, translateY: -2 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "premium-uiverse-btn transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span className="flex items-center justify-center gap-2 relative z-10">
          {children}
        </span>
        <span className="premium-uiverse-btn-border" />
      </motion.button>
    );
  }
);
Button.displayName = "Button";
