import { LucideIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  tooltip?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "primary" | "warning" | "info";
}

const variantStyles = {
  default: "bg-card border shadow-card",
  primary: "bg-primary/5 border-primary/20",
  warning: "bg-warning/5 border-warning/20",
  info: "bg-info/5 border-info/20",
};

const iconStyles = {
  default: "bg-secondary text-primary",
  primary: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  tooltip,
  icon: Icon,
  trend,
  variant = "default",
}: SummaryCardProps) => {
  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all hover:shadow-elevated ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
            {tooltip ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground/70 hover:text-muted-foreground"
                      aria-label={`${title} formula`}
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>
          <p className="mt-1 text-xl font-bold text-foreground animate-count-up sm:text-2xl">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${iconStyles[variant]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
