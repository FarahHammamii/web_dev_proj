import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import { NotificationBadge } from "@/components/Badges";
import { useSearch } from "@/contexts/searchContext";
import { useAuth } from "@/contexts/AuthContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Search,
  Bell,
  MessageSquare,
  Briefcase,
  Building2,
  User,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  ChevronDown,
  Users,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/feed", icon: Home },
  { label: "Network", href: "/network", icon: Users },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Messages", href: "/messages", icon: MessageSquare,  },
  { label: "Notifications", href: "/notifications", icon: Bell,  },
];

interface MainNavProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: "user" | "admin";
  };
  unreadNotifications?: number;
}

export function MainNav({ user, unreadNotifications }: MainNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { logout } = useAuth();
  
  const { query, setQuery } = useSearch();
  
  const navItemsWithBadge = navItems.map(item => 
    item.href === "/notifications" 
      ? { ...item, badge: unreadNotifications }
      : item
  ); 

  const isActive = (href: string) => location.pathname === href;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    if (newValue && location.pathname !== '/search') {
      navigate('/search');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden font-display text-xl font-bold sm:inline-block">
            Connectify
          </span>
        </Link>

        <div className="hidden flex-1 max-w-md mx-8 lg:block">
          <div className="relative input-glow rounded-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search people, jobs, companies..."
              className="pl-10 h-10 rounded-xl border-border/50 bg-secondary/50 focus:bg-background transition-colors"
              value={query}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItemsWithBadge.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "relative flex-col h-auto py-2 px-4 gap-0.5",
                    isActive(item.href) && "text-primary"
                  )}
                >
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {item.badge && item.badge > 0 && <NotificationBadge count={item.badge} />}
                  </div>
                  <span className="text-xs font-normal">{item.label}</span>
                  {isActive(item.href) && (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-primary rounded-full" />
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3">
                  <UserAvatar
                    name={user.name}
                    src={user.avatar}
                    size="sm"
                    showStatus
                    status="online"
                  />
                  <span className="hidden text-sm font-medium lg:inline-block">
                    {user.name.split(" ")[0]}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/company" className="cursor-pointer">
                      <Building2 className="mr-2 h-4 w-4" />
                      Company
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive cursor-pointer"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="gradient" asChild className="hidden sm:inline-flex">
                <Link to="/auth">Get started</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => {
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
                        <div className="relative">
                          <Icon className="h-5 w-5" />
                          {item.badge && (
                            <NotificationBadge count={item.badge} />
                          )}
                        </div>
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border/50 p-4 lg:hidden animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 rounded-xl"
              autoFocus
           
              value={query}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      )}
    </header>
  );
}