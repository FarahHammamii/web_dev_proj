import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStatus?: boolean;
  status?: "online" | "offline" | "busy";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

const statusSizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
  xl: "h-4 w-4",
};

const statusColors = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
};

export function UserAvatar({ 
  src, 
  name, 
  size = "md", 
  showStatus = false, 
  status = "offline",
  className 
}: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative inline-block">
      <Avatar className={cn(
        sizeClasses[size],
        "ring-2 ring-background transition-transform hover:scale-105",
        className
      )}>
        <AvatarImage src={src} alt={name} className="object-cover" />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span 
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            statusSizeClasses[size],
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
