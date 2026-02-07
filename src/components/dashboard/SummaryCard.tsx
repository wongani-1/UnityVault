import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
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
  icon: Icon,
  trend,
  variant = "default",
}: SummaryCardProps) => {
  return (
    <div className={`rounded-xl border p-5 transition-all hover:shadow-elevated ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground animate-count-up">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? "text-success" : "text-destructive"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
