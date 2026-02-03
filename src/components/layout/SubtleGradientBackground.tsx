import { cn } from "@/lib/utils";

interface SubtleGradientBackgroundProps {
  className?: string;
}

export function SubtleGradientBackground({ className }: SubtleGradientBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle gradient blobs - light theme */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200/[0.08] dark:bg-blue-500/[0.06] rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-pink-200/[0.06] dark:bg-pink-500/[0.05] rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-violet-200/[0.05] dark:bg-violet-500/[0.04] rounded-full blur-3xl" />
      <div className="absolute -bottom-20 right-1/3 w-64 h-64 bg-cyan-200/[0.04] dark:bg-cyan-500/[0.03] rounded-full blur-3xl" />
    </div>
  );
}
