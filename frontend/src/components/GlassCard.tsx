import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ReactNode, CSSProperties } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  id?: string;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true,
  gradient = false,
  onClick,
  style,
  id
}: GlassCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm",
        hover && "card-hover",
        gradient && "bg-gradient-card",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      style={style}
      id={id}
    >
      {children}
    </Card>
  );
}

interface ContentCardProps {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ContentCard({ 
  header, 
  children, 
  footer, 
  className,
  noPadding = false 
}: ContentCardProps) {
  return (
    <GlassCard className={className}>
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent className={cn(noPadding && "p-0")}>
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </GlassCard>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon,
  className 
}: StatCardProps) {
  const changeColors = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-display text-3xl font-bold">{value}</p>
          {change && (
            <p className={cn("text-sm font-medium", changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
