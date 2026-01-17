import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyNav } from "@/components/CompanyNav";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Heart,
  MessageCircle,
  Briefcase,
  Check,
  Bell,
  CheckCheck,
  Loader2,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api, Notification } from "@/lib/api";



const getSender = (notification: Notification) => {
  const sender = notification.sender;

  if (!sender || !sender.id) {
    return { name: "Someone", image: undefined };
  }


  if (sender.type === "User" && "firstName" in sender.id) {
    return {
      name: `${sender.id.firstName} ${sender.id.lastName}`,
      image: sender.id.image,
    };
  }
  
  if (sender.type === "Company" && "name" in sender.id) {
    return {
      name: sender.id.name || "Company",
      image: sender.id.logo,
    };
  }

  return { name: "Someone", image: undefined };
};

const getMessage = (n: Notification, senderName: string) => {
  switch (n.type) {
    case "reaction":
      return `${senderName} reacted to your post`;
    case "comment":
      return `${senderName} commented on your post`;
    case "reply":
      return `${senderName} replied to your comment`;
    case "job_application":
      return `${senderName} applied to your job`;
    case "MESSAGE":
      return `${senderName} sent you a message`;
    default:
       return "You have a new notification";
  }
};

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "reaction":
      return Heart;
    case "comment":
    case "reply":
    case "MESSAGE":
      return MessageCircle;
    case "job_application":
      return Briefcase;
    default:
      return Bell;
  }
};

const getColors = (type: Notification["type"]) => {
  switch (type) {
    case "reaction":
      return "bg-destructive/10 text-destructive";
    case "comment":
    case "reply":
    case "MESSAGE":
      return "bg-primary/10 text-primary";
    case "job_application":
      return "bg-accent/10 text-accent";
    default:
      return "bg-muted/10 text-muted-foreground";
  }
};



export default function CompanyNotificationsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, company: currentCompany, accountType } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const [weeklyStats, setWeeklyStats] = useState({
    likes: 0,
    comments: 0,
    applications: 0,
  });

  useEffect(() => {
    if (!authLoading) {
        if (!isAuthenticated) {
            navigate("/auth");
        } else if (accountType !== "company") {
            navigate("/feed");
        }
    }
  }, [authLoading, isAuthenticated, accountType, navigate]);

  useEffect(() => {
    if (isAuthenticated && accountType === "company") {
        fetchNotifications();
    }
  }, [isAuthenticated, accountType]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
        const res = await api.getNotifications();
        if (res.success) {
          setNotifications(res.data);
          const unread = res.data.filter((n: Notification) => !n.isRead).length;
          setUnreadCount(unread);
          calculateWeekly(res.data);
        }
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
    } finally {
        setLoading(false);
    }
  };

  const calculateWeekly = (data: Notification[]) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const week = data.filter(n => new Date(n.createdAt) > weekAgo);

    setWeeklyStats({
      likes: week.filter(n => n.type === "reaction").length,
      comments: week.filter(n => n.type === "comment" || n.type === "reply").length,
      applications: week.filter(n => n.type === "job_application").length,
    });
  };

  const markAsRead = async (id: string) => {
    try {
        await api.markNotificationAsRead(id);
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(c => Math.max(0, c - 1));
    } catch (error) {
        toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
        await api.markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
    } catch (error) {
        toast.error("Failed to mark all as read");
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "applications") return n.type === "job_application";
    if (filter === "interactions") return n.type === "reaction" || n.type === "comment" || n.type === "reply";
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const navCompany = currentCompany ? {
    name: currentCompany.name,
    email: currentCompany.email,
    logo: currentCompany.logo
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <CompanyNav company={navCompany} unreadNotifications={unreadCount} />

      <PageContainer>
        <PageHeader
          title="Company Notifications"
          description={`You have ${unreadCount} unread updates`}
          action={
            <Button onClick={markAllAsRead} disabled={!unreadCount} size="sm">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          }
        />

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <main className="space-y-4">
            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                <TabsTrigger value="applications">Applications</TabsTrigger>
                <TabsTrigger value="interactions">Interactions</TabsTrigger>
              </TabsList>
            </Tabs>

            {loading ? (
              [...Array(5)].map((_, i) => (
                <GlassCard key={i} className="h-20 animate-pulse">
                  <div />
                </GlassCard>
              ))
            ) : filtered.length ? (
              filtered.map(n => {
                const sender = getSender(n);
                const Icon = getIcon(n.type);

                return (
                  <GlassCard
                    key={n._id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                      !n.isRead && "border-l-4 border-primary bg-primary/5"
                    )}
                    onClick={() => {
                        if (!n.isRead) markAsRead(n._id);
                    }}
                  >
                    <div className="flex gap-4">
                      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0", getColors(n.type))}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                          {(() => {
                           const message = getMessage(n, sender.name);
                           return (
                             <div className="flex flex-col gap-1">
                               <p className={cn("text-sm break-words", !n.isRead && "font-medium")}>
                                 {message}
                               </p>
                             </div>
                           );
                          })()}

                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {!n.isRead && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="shrink-0 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(n._id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground py-12 bg-muted/20 rounded-lg border border-dashed">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No notifications found</p>
              </div>
            )}
          </main>

          <aside className="hidden lg:block">
            <GlassCard className="p-4 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                This Week's Activity
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground">Applications Received</span>
                    <b className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                        {weeklyStats.applications}
                    </b>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <span className="text-muted-foreground">Post Interactions</span>
                    <b className="bg-accent/10 text-accent px-2 py-0.5 rounded-full text-xs">
                        {weeklyStats.likes + weeklyStats.comments}
                    </b>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                      Tip: Respond to applicants within 48 hours to improve your company rating.
                  </p>
              </div>
            </GlassCard>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}