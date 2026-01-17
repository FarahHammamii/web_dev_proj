import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  fullWidth?: boolean;
}

export function PageContainer({ 
  children, 
  className,
  withPadding = true,
  fullWidth = false
}: PageContainerProps) {
  return (
    <div className={cn(
      "min-h-screen bg-background",
      withPadding && "px-4 py-6 md:px-6 lg:px-8",
      className
    )}>
      {fullWidth ? (
        children
      ) : (
        <div className="mx-auto max-w-7xl animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  description, 
  action,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between",
      className
    )}>
      <div className="space-y-1">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
