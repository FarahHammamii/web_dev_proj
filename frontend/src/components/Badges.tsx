import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface AIBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function AIBadge({ className, size = "sm" }: AIBadgeProps) {
  return (
    <Badge 
      className={cn(
        "bg-gradient-accent text-accent-foreground border-0 gap-1",
        size === "sm" && "text-xs px-2 py-0.5",
        size === "md" && "text-sm px-3 py-1",
        className
      )}
    >
      <Sparkles className={cn(
        size === "sm" && "h-3 w-3",
        size === "md" && "h-4 w-4"
      )} />
      AI
    </Badge>
  );
}

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count === 0) return null;
  
  return (
    <span className={cn(
      "absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground",
      count > 99 && "px-1 w-auto min-w-[1.25rem]",
      className
    )}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface StatusBadgeProps {
  status: "active" | "pending" | "closed" | "draft";
  className?: string;
}

const statusConfig = {
  active: { label: "Active", className: "bg-success/15 text-success border-success/30" },
  pending: { label: "Pending", className: "bg-warning/15 text-warning border-warning/30" },
  closed: { label: "Closed", className: "bg-muted text-muted-foreground border-muted" },
  draft: { label: "Draft", className: "bg-secondary text-secondary-foreground border-secondary" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
