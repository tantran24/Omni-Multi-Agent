import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Loading spinner component
 */
export const LoadingSpinner = ({
  size = "default",
  className = "",
  ...props
}) => {
  const sizeClass =
    {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12",
    }[size] || "w-6 h-6";

  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <Loader2 className={`animate-spin text-claude-purple ${sizeClass}`} />
    </div>
  );
};

/**
 * Full-page loading component
 */
export const FullPageLoading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--background)] z-50">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-claude-purple to-claude-lavender flex items-center justify-center mb-6">
        <span className="text-white font-semibold text-xl">O</span>
      </div>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-[var(--muted-foreground)] animate-pulse">Loading...</p>
    </div>
  );
};

export default { LoadingSpinner, FullPageLoading };
