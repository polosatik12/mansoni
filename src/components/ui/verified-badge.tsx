import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function VerifiedBadge({ className, size = "sm" }: VerifiedBadgeProps) {
  return (
    <BadgeCheck 
      className={cn(
        sizeClasses[size],
        "text-primary fill-primary stroke-primary-foreground flex-shrink-0",
        className
      )} 
    />
  );
}
