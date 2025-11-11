import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCheckmarkProps {
  show: boolean;
  className?: string;
}

export const SuccessCheckmark = ({ show, className }: SuccessCheckmarkProps) => {
  if (!show) return null;

  return (
    <div className={cn(
      "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
      "animate-scale-in pointer-events-none",
      className
    )}>
      <div className="relative">
        {/* Success ring pulse */}
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-success-ring" />
        
        {/* Checkmark container */}
        <div className="relative bg-green-500 rounded-full p-4 shadow-elevated">
          <Check className="h-12 w-12 text-white animate-checkmark" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
};
