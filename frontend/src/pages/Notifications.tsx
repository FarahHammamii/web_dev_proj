import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatMediaUrl } from "@/lib/media";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Briefcase,
  Building2,
  Check,
  Bell,
  CheckCheck,
  Loader2,
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
    case "connection_request":
      return `${senderName} sent you a connection request`;
    case "connection_accepted":
      return `${senderName} accepted your connection request`;
    case "job_offer":
      return `${senderName} sent you a job offer`;
    case "job_application":
      return `${senderName} applied to your job`;
    case "company_post":
      return `${senderName} published a new post`;
    case "MESSAGE":
      return `${senderName} sent you a message`;
    case "new_post":
      return `${senderName} published a new post`;

  }
};
const getSenderId = (n: Notification) => {
  if (!n.sender || !n.sender.id) return null;
  return typeof n.sender.id === "string" ? n.sender.id : n.sender.id._id;
};

const getIcon = (type: Notification["type"]) => {
  switch (type) {
    case "reaction":
      return Heart;
    case "comment":
    case "reply":
    case "MESSAGE":
      return MessageCircle;
    case "connection_request":
    case "connection_accepted":
      return UserPlus;
    case "job_offer":
    case "job_application":
      return Briefcase;
    case "company_post":
      return Building2;
    default:
      return Bell;
  }
};
const getPostIdFromNotification = (n) => {
  if (
    n.entity?.type === "Post" &&
    n.entity?.id &&
    typeof n.entity.id === "object"
  ) {
    return n.entity.id._id;
  }
  return null;
};
const getSenderIdFromNotification = (n) => {
  if (n.sender?.id?._id) return n.sender.id._id;
  return null;
};
const getJobOfferIdFromNotification = (n: Notification) => {
  if (
    n.entity?.type === "JobOffer" &&
    n.entity?.id
  ) {
    return typeof n.entity.id === "string"
      ? n.entity.id
      : n.entity.id._id;
  }
  return null;
};
const getColors = (type: Notification["type"]) => {
  switch (type) {
    case "reaction":
      return "bg-destructive/10 text-destructive";
    case "comment":
    case "reply":
    case "MESSAGE":
      return "bg-primary/10 text-primary";
    case "connection_request":
    case "connection_accepted":
      return "bg-success/10 text-success";
    case "job_offer":
    case "job_application":
      return "bg-warning/10 text-warning";
    case "company_post":
      return "bg-accent/10 text-accent";
    default:
      return "bg-muted/10 text-muted-foreground";
  }
};


export default function NotificationsPage() {
  const { accountType } = useAuth();

  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const [weeklyStats, setWeeklyStats] = useState({
    likes: 0,
    comments: 0,
    connections: 0,
    jobs: 0,
  });

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUser = async () => {
        try {
          const userData = await api.getUserProfile();
          setCurrentUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
        }
      };
      fetchUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/auth");
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await api.getNotifications();
    if (res.success) {
      setNotifications(res.data);
      const unread = res.data.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
      calculateWeekly(res.data);
    }
    setLoading(false);
  };

  const calculateWeekly = (data: Notification[]) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const week = data.filter(n => new Date(n.createdAt) > weekAgo);

    setWeeklyStats({
      likes: week.filter(n => n.type === "reaction").length,
      comments: week.filter(n => n.type === "comment" || n.type === "reply").length,
      connections: week.filter(n => n.type.startsWith("connection")).length,
      jobs: week.filter(n => n.type.startsWith("job")).length,
    });
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllAsRead = async () => {
    await api.markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const filtered = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    if (filter === "job") return n.type.startsWith("job");
    if (filter === "connection") return n.type.startsWith("connection");
    return true;
  });


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const navbarUser = isAuthenticated ? (
    currentUser ? {
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email,
      avatar: formatMediaUrl(currentUser.image),
      role: "user" as const
    } : {
      name: "Loading...",
      email: "",
      avatar: undefined,
      role: "user" as const
    }
  ) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />

      <PageContainer>
        <PageHeader
          title="Notifications"
          description={`You have ${unreadCount} unread notifications`}
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
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </TabsTrigger>
                {accountType === "company" && (<TabsTrigger value="job">Jobs</TabsTrigger>)}
                {accountType === "user" && (<TabsTrigger value="connection">Connections</TabsTrigger>)}
              </TabsList>
            </Tabs>

            {loading ? (
              [...Array(5)].map((_, i) => (
              <GlassCard key={i} className="h-20 animate-pulse">
                <div />
              </GlassCard>              ))
            ) : filtered.length ? (
              filtered.map(n => {
                const sender = getSender(n);
                const Icon = getIcon(n.type);

                return (
                  <GlassCard
                    key={n._id}
                    className={cn(
                      "p-4 cursor-pointer",
                      !n.isRead && "border-l-4 border-primary"
                    )}
                    onClick={() => {
                      const postId = getPostIdFromNotification(n);
                      const senderId = getSenderIdFromNotification(n);
                      const jobOfferId = getJobOfferIdFromNotification(n);

                    
                      if (n.type === "MESSAGE" && senderId) {
                        navigate(`/messages?user=${senderId}`);
                      }

                      if (
                        ["new_post", "company_post", "comment", "reaction", "reply"].includes(n.type) &&
                        postId
                      ) {
                        navigate(`/feed?postId=${postId}`);
                      }
                      if(["connection_accepted","connection_request"].includes(n.type) &&senderId){
                        navigate(`/profile/${senderId}`);
                      }
                      if (n.type === "job_application" && jobOfferId) {
                        navigate(`/company/applicants/${jobOfferId}`);
                        return;
                      }

                      if (n.type === "job_offer" && jobOfferId) {
                        navigate(`/jobs?jobId=${jobOfferId}`);
                        return;
                      }
                      if (!n.isRead) {
                        markAsRead(n._id);
                      }
                    }}


                  >
                    <div className="flex gap-4">
                      <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", getColors(n.type))}>
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        {(() => {
                          const message = getMessage(n, sender.name);
                          return (
                            message && (
                              <p className={cn("text-sm", !n.isRead && "font-medium")}>
                                {message}
                              </p>
                            )
                          );
                        })()}

                        <p className="text-xs text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>


                      {!n.isRead && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
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
              <div className="text-center text-muted-foreground py-12">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                No notifications
              </div>
            )}
          </main>

          <aside className="hidden lg:block">
            <GlassCard className="p-4">
              <h3 className="font-semibold mb-4">This week</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Likes</span><b>{weeklyStats.likes}</b></div>
                <div className="flex justify-between"><span>Comments</span><b>{weeklyStats.comments}</b></div>
                {accountType === "user" && (<div className="flex justify-between"><span>Connections</span><b>{weeklyStats.connections}</b></div>)}
                {accountType === "company" && (<div className="flex justify-between"><span>Jobs</span><b>{weeklyStats.jobs}</b></div>)}
              </div>
            </GlassCard>
          </aside>
        </div>
      </PageContainer>
    </div>
  );
}
