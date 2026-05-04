import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

export type GlassCardProps = HTMLMotionProps<"div"> & {
  children: ReactNode;
};

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn("glass rounded-2xl p-8 transition-all duration-300 hover:bg-white/5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
