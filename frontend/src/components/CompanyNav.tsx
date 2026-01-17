import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatMediaUrl } from "@/lib/media";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  Building2,
  ChevronDown,
  Bell,
  TrendingUp,
  BarChart3,
  Users,
  User
} from "lucide-react";

interface CompanyNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const companyNavItems: CompanyNavItem[] = [
  { label: "Dashboard", href: "/company", icon: LayoutDashboard },
  { label: "Posts", href: "/company/posts", icon: FileText },
  { label: "Analytics", href: "/company/analytics", icon: BarChart3 },
];

interface CompanyNavProps {
  company?: {
    name: string;
    email: string;
    logo?: string;
  };
  unreadNotifications?: number;
}

const getInitials = (name: string) => {
  return name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "CO";
};

export function CompanyNav({ company, unreadNotifications = 0 }: CompanyNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const displayCompany = company || { 
    name: "Company Account", 
    email: "admin@company.com", 
    logo: "" 
  };

  const isActive = (href: string) => {
    if (href === "/company") {
      return location.pathname === "/company";
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = () => {
    console.log("Signing out...");
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        
        <div className="flex items-center gap-4 select-none">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-display text-xl font-bold sm:inline-block tracking-tight">
              Connectify
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/50">
            <span className="text-xs font-medium">Company Portal</span>
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex absolute left-1/2 -translate-x-1/2">
          {companyNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-9 px-4 gap-2 transition-all duration-200",
                    active && "bg-secondary text-foreground font-medium"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          
          <div className="hidden lg:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-md bg-green-500/10 border border-green-500/20">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700">+12% Growth</span>
          </div>

          <Link to="/company/notification">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9 rounded-full hover:bg-secondary"
            >
              <Bell className="h-4 w-4 text-muted-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
              )}
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 flex items-center gap-2 pl-2 pr-3 rounded-full hover:bg-secondary/80 border border-transparent hover:border-border transition-all ml-1">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={formatMediaUrl(displayCompany.logo)} alt={displayCompany.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                    {getInitials(displayCompany.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-semibold leading-none max-w-[100px] truncate">
                    {displayCompany.name}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayCompany.name}</p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {displayCompany.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                
                <DropdownMenuItem onClick={() => navigate("/company/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Public Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/company/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden ml-1">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b select-none">
                 <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={displayCompany.logo} alt={displayCompany.name} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(displayCompany.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="font-semibold truncate">{displayCompany.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{displayCompany.email}</span>
                </div>
              </div>

              <nav className="flex flex-col gap-2">
                {companyNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant={isActive(item.href) ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3"
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
                
                <div className="my-4 border-t" />
                
                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3"
                    onClick={() => { setMobileMenuOpen(false); navigate("/company/profile"); }}
                >
                    <User className="h-5 w-5" />
                    Profile
                </Button>
                
                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3"
                    onClick={() => { setMobileMenuOpen(false); navigate("/company/settings"); }}
                >
                    <Settings className="h-5 w-5" />
                    Settings
                </Button>

                <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}