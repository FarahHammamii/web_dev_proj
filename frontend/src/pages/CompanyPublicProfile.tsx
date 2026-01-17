import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { ReactionPicker, ReactionPickerCompact } from "@/components/ReactionPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MapPin,
  Globe,
  Mail,
  Users,
  Briefcase,
  FileText,
  Eye,
  TrendingUp,
  Users as FollowIcon,
  Calendar,
  DollarSign,
  Clock,
  ExternalLink,
  Users2,
  Heart,
  MessageSquare,
  MessageCircle,
  Share2,
  MoreVertical,
  Plus,
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Reply,
  Image as ImageIcon,
  Video,
  Send,
  Sparkles,
  Loader2,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Check,
  MessageCircle as MessageCircleIcon,
} from "lucide-react";
import { api, Company, Job, Post, Comment, ReactionType, ReactionStats, User } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatMediaUrl, getMediaType, getFileName } from "@/lib/media";
import { useAuth } from "@/contexts/AuthContext";

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  showReplies?: boolean;
  repliesLoading?: boolean;
  hasReplies?: boolean;
  replyCount?: number;
}


interface CompanyPostsResponse {
  success: boolean;
  data: {
    posts: Post[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function CompanyPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { unreadCount } = useUnreadNotifications();
  
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  

  const [currentUser, setCurrentUser] = useState<any>(null);
 
  const [postContent, setPostContent] = useState("");
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  

  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, {
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    isRequester: boolean;
    connectionId: string | null;
  }>>({});
  const [connectionLoading, setConnectionLoading] = useState<Record<string, boolean>>({});

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentWithReplies[]>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});
  

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalComments, setModalComments] = useState<CommentWithReplies[]>([]);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalReplyingTo, setModalReplyingTo] = useState<string | null>(null);


  const [engagement, setEngagement] = useState<{
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  }>({
    likes: 0,
    comments: 0,
    shares: 0,
    impressions: 0
  });

 
  useEffect(() => {
   if (id && currentUser) {
      fetchCompanyProfile();
      fetchCompanyJobs();
      fetchCompanyPosts();
      fetchEngagementMetrics();
    }
  },  [id, currentUser]);

  useEffect(() => {
   
    if (isAuthenticated) {
      fetchCurrentUser();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (company?.followers && currentUser) {
      checkAllFollowerConnections();
    }
  }, [company?.followers, currentUser]);


  const fetchCurrentUser = async () => {
    try {
      const userData = await api.getUserProfile();
      setCurrentUser(userData);
      

      try {
        const connections = await api.getMyConnections();
        setConnectionsCount(Array.isArray(connections) ? connections.length : 0);
      } catch (error) {
        console.log("Error fetching connections count:", error);
      }
    } catch (error) {
      console.log("User not logged in or error fetching user profile");
    }
  };

  const checkAllFollowerConnections = async () => {

  if (!company?.followers || !currentUser) return;
  
  const newStatuses: Record<string, {
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    isRequester: boolean;
    connectionId: string | null;
  }> = {};
  

  for (const follower of company.followers) {
   
    if (follower._id === currentUser._id) {
   
      newStatuses[follower._id] = {
        status: 'NONE',
        isRequester: false,
        connectionId: null
      };
      continue;
    }
    
    try {
      const statusData = await api.checkConnectionStatus(follower._id);
      newStatuses[follower._id] = statusData;
    } catch (error) {
      console.log(`Error checking connection status for ${follower._id}:`, error);
      newStatuses[follower._id] = {
        status: 'NONE',
        isRequester: false,
        connectionId: null
      };
    }
  }
  
  setConnectionStatuses(newStatuses);
};

  const fetchCompanyProfile = async () => {
    try {
      const companyData = await api.getCompanyById(id!);
      setCompany(companyData);
      
   
       if (currentUser && currentUser._id){
        try {
          const following = await api.getFollowingList();
          const followingList = Array.isArray(following) ? following : following?.data || [];
          const isFollowingCompany = followingList.some(c => c._id === id);
          setIsFollowing(isFollowingCompany);
          
    
          if (companyData.followers) {
            const isUserInFollowers = companyData.followers.some(f => f._id === currentUser._id);
            if (isUserInFollowers && !isFollowingCompany) {
              setIsFollowing(true);
            }
          }
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyJobs = async () => {
    if (!id) return;

    try {
      const res = await api.getCompanyJobsByCompanyId(id);

      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching company jobs:", error);
      setJobs([]);
    }
  };

  const fetchEngagementMetrics = async () => {
    try {
      const response = await api.getWeekEngagements();
      if (response && response.success && response.data) {
        setEngagement({
          likes: response.data.likes || 0,
          comments: response.data.comments || 0,
          shares: response.data.shares || 0,
          impressions: response.data.impressions || 0
        });
      }
    } catch (error) {
      console.error("Error fetching engagement metrics:", error);
    }
  };

  const fetchCompanyPosts = async () => {
    if (!id || postsLoading) return;
    
    setPostsLoading(true);
    try {
      const response = await api.getCompanyPosts(id, 1, 100);
      
      if (response.success && response.data && response.data.posts) {
        const postsArray = response.data.posts;
        setPosts(postsArray);
        

        const reactions: Record<string, ReactionType | null> = {};
        for (const post of response.data.posts) {
          try {
            const reactionResponse = await api.getUserReaction("Post", post._id);
            if (reactionResponse.success && reactionResponse.data) {
              reactions[post._id] = reactionResponse.data.reactionType;
            }
          } catch (error) {
            reactions[post._id] = null;
          }
        }
        setUserReactions(prev => ({ ...prev, ...reactions }));
      }
    } catch (error) {
      console.error("Error fetching company posts:", error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  
  const handleFollow = async () => {
  if (!id) return;
  

  if (!currentUser || !isAuthenticated) {
    toast.error("Please log in to follow companies");
    return;
  }
  
  setFollowLoading(true);
  try {
    if (isFollowing) {
      await api.unfollowCompany(id);
      toast.success("Unfollowed company!");
      setIsFollowing(false);
      
  
      if (company) {
        setCompany({
          ...company,
          followers: company.followers?.filter(f => f._id !== currentUser._id) || []
        });
      }
    } else {
      await api.followCompany(id);
      toast.success("Following company!");
      setIsFollowing(true);
      
  
      if (company) {
        setCompany({
          ...company,
          followers: [...(company.followers || []), {
            _id: currentUser._id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            image: currentUser.image,
            headline: currentUser.headline
          }]
        });
      }
    }
  } catch (error: any) {
    console.error("Error following/unfollowing:", error);
    toast.error(error.message || "Failed to update follow status");
  } finally {
    setFollowLoading(false);
  }
};


  const handleConnect = async (followerId: string) => {
    if (!followerId || !currentUser) return;
    
    setConnectionLoading(prev => ({ ...prev, [followerId]: true }));
    
    try {
      const currentStatus = connectionStatuses[followerId];
      
      if (currentStatus.status === 'ACCEPTED') {
    
        await api.disconnect(followerId);
        toast.success("Connection removed!");
        
     
        setConnectionStatuses(prev => ({
          ...prev,
          [followerId]: {
            status: 'NONE',
            isRequester: false,
            connectionId: null
          }
        }));
        

        setConnectionsCount(prev => Math.max(0, prev - 1));
        
      } else if (currentStatus.status === 'NONE') {
     
        await api.sendConnectionRequest(followerId);
        toast.success("Connection request sent!");
        
        setConnectionStatuses(prev => ({
          ...prev,
          [followerId]: {
            status: 'PENDING',
            isRequester: true,
            connectionId: null
          }
        }));
        
      } else if (currentStatus.status === 'PENDING') {

        if (currentStatus.isRequester) {
          await api.disconnect(followerId);
          toast.success("Connection request cancelled!");
          
          setConnectionStatuses(prev => ({
            ...prev,
            [followerId]: {
              status: 'NONE',
              isRequester: false,
              connectionId: null
            }
          }));
        } else {
          toast.info("You have a connection request from this user. Check your notifications to respond.");
        }
      }
      
    } catch (error: any) {
      console.error("Error handling connection:", error);
      
      if (error.message?.includes("already pending") || 
          error.message?.includes("Connection request already pending")) {
        toast.info("Connection request already sent");
        
        setConnectionStatuses(prev => ({
          ...prev,
          [followerId]: {
            status: 'PENDING',
            isRequester: true,
            connectionId: null
          }
        }));
      } else if (error.message?.includes("already connected")) {
        toast.error("You are already connected with this user");
        
        setConnectionStatuses(prev => ({
          ...prev,
          [followerId]: {
            status: 'ACCEPTED',
            isRequester: false,
            connectionId: null
          }
        }));
      } else {
        toast.error(error.message || "Failed to handle connection");
      }
    } finally {
      setConnectionLoading(prev => ({ ...prev, [followerId]: false }));
    }
  };

  const handleAcceptConnection = async (followerId: string) => {
    if (!followerId || !connectionStatuses[followerId]?.connectionId) return;
    
    setConnectionLoading(prev => ({ ...prev, [followerId]: true }));
    
    try {
      await api.respondToConnectionRequest(connectionStatuses[followerId].connectionId!, "ACCEPTED");
      toast.success("Connection request accepted!");
      

      setConnectionStatuses(prev => ({
        ...prev,
        [followerId]: {
          status: 'ACCEPTED',
          isRequester: false,
          connectionId: connectionStatuses[followerId].connectionId
        }
      }));
      
      setConnectionsCount(prev => prev + 1);
      
    } catch (error: any) {
      console.error("Error accepting connection:", error);
      toast.error(error.message || "Failed to accept connection");
    } finally {
      setConnectionLoading(prev => ({ ...prev, [followerId]: false }));
    }
  };

  const handleRejectConnection = async (followerId: string) => {
    if (!followerId || !connectionStatuses[followerId]?.connectionId) return;
    
    setConnectionLoading(prev => ({ ...prev, [followerId]: true }));
    
    try {
      await api.respondToConnectionRequest(connectionStatuses[followerId].connectionId!, "REJECTED");
      toast.success("Connection request rejected");
      

      setConnectionStatuses(prev => ({
        ...prev,
        [followerId]: {
          status: 'NONE',
          isRequester: false,
          connectionId: null
        }
      }));
      
    } catch (error: any) {
      console.error("Error rejecting connection:", error);
      toast.error(error.message || "Failed to reject connection");
    } finally {
      setConnectionLoading(prev => ({ ...prev, [followerId]: false }));
    }
  };

  const shouldShowMessageButton = (followerId: string) => {
   return currentUser && 
         currentUser._id !== followerId && 
         connectionStatuses[followerId]?.status === 'ACCEPTED';
  };

  const renderConnectionButton = (followerId: string) => {
    if (isAuthenticated ==false) {
      return (
        <Button 
          variant="gradient" 
          size="sm"
          className="gap-2"
          onClick={() => toast.info("Please login to connect")}
        >
          <UserPlus className="h-4 w-4" />
          Login to Connect
        </Button>
      );
    }

    if (currentUser._id === followerId) {
    return (
      <Button 
        variant="outline" 
        size="sm"
        className="gap-2" 
        disabled
      >
        <Check className="h-4 w-4" /> Your Profile
      </Button>
    );
  }

    const connectionStatus = connectionStatuses[followerId];
    const isLoading = connectionLoading[followerId];

    switch (connectionStatus?.status) {
      case "ACCEPTED":
        return (
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2 text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50"
              disabled
            >
              <Check className="h-4 w-4" /> Connected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConnect(followerId)}
              disabled={isLoading}
              className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
              title="Remove connection"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
            </Button>
          </div>
        );

      case "PENDING":
        const isUserRequester = connectionStatus.isRequester;
        
        if (isUserRequester) {
          return (
            <div className="flex gap-1">
              <Button 
                variant="secondary" 
                size="sm"
                className="gap-2"
              >
                <Loader2 className="h-4 w-4" /> Request Sent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleConnect(followerId)}
                disabled={isLoading}
                className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                title="Cancel request"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        } else {
          return (
            <div className="flex gap-1">
              <Button
                variant="gradient"
                size="sm"
                className="gap-2"
                onClick={() => handleAcceptConnection(followerId)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleRejectConnection(followerId)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          );
        }

      case "NONE":
      default:
        return (
          <Button 
            variant="gradient" 
            size="sm"
            className="gap-2" 
            onClick={() => handleConnect(followerId)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Connect
          </Button>
        );
    }
  };

  const renderFollowersSection = () => (
  <GlassCard className="p-6">
    <h2 className="font-display text-xl font-semibold mb-4">Followers ({company?.followers?.length || 0})</h2>
    {(!company?.followers || company.followers.length === 0) ? (
      <div className="text-center py-8">
        <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No followers yet</p>
      </div>
    ) : (
      <div className="flex flex-col gap-2">

        {company.followers.map((follower) => {
          const isCurrentUser = currentUser?._id === follower._id;
          
          return (
            <div key={follower._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => navigate(`/profile/${follower._id}`)}
              >
                <Avatar>
                  <AvatarImage src={formatMediaUrl(follower.image)} />
                  <AvatarFallback>
                    {follower.firstName?.[0]}{follower.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate hover:text-primary">
                    {follower.firstName} {follower.lastName}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">{follower.headline}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAuthenticated && renderConnectionButton(follower._id)}

                {shouldShowMessageButton(follower._id) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => navigate(`/messages?user=${follower._id}`)}
                    title="Message"
                  >
                    <MessageCircleIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </GlassCard>
);

  const renderCompanyFollowButton = () => {
  if (!isAuthenticated || !currentUser || company?.email === currentUser.email) {
    return null;
  }
  
  return (
    <Button 
      variant={isFollowing ? "outline" : "gradient"} 
      onClick={handleFollow}
      disabled={followLoading}
      className="gap-2"
    >
      {followLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FollowIcon className="h-4 w-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

  const getAuthorInfo = (post: Post) => {
    if (post.author && typeof post.author === 'object' && 'details' in post.author) {
      const authorDetails = post.author.details;
      const authorType = post.author.type || post.authorType || "User";
      
      const name = authorType === "Company" 
        ? authorDetails.name || "Company"
        : `${authorDetails.firstName || ''} ${authorDetails.lastName || ''}`.trim() || "User";
      
      let image = authorType === "Company" 
        ? authorDetails.logo 
        : authorDetails.image;

      if (!image && authorType === "Company" && company) {
        image = company.logo;
      }
      
      return { name, image, type: authorType };
    }
    
    const authorType = post.authorType || "User";
    const name = authorType === "Company"
      ? (post.author as any).name || "Company"
      : `${(post.author as any).firstName || ''} ${(post.author as any).lastName || ''}`.trim() || "User";
    
    let image = authorType === "Company"
      ? (post.author as any).logo
      : (post.author as any).image;

    if (!image && authorType === "Company" && company) {
      image = company.logo;
    }
    
    return { name, image, type: authorType };
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8081/${path.replace(/\\/g, '/')}`;
  };

  const followerCount = company?.followers?.length || 0;
  const activeJobsCount = jobs.filter(job => job.isActive).length;
  const totalJobsCount = jobs.length;
  const engagementRate = followerCount > 0 
  ? Math.round((posts.length * 10) / Math.max(followerCount, 1)) 
  : 0;

  const navbarUser = isAuthenticated && currentUser ? {
    name: currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : "User",
    email: currentUser.email || "",
    avatar: formatMediaUrl(currentUser.image),
    role: "user" as const
  } : undefined;


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={navbarUser} unreadNotifications={unreadCount} />
        <PageContainer>
          <div className="max-w-5xl mx-auto space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <MainNav user={navbarUser} unreadNotifications={unreadCount} />
        <PageContainer>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Company not found</h2>
            <p className="text-muted-foreground">The company you're looking for doesn't exist.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />
      
      <PageContainer className="pt-0">
        <div className="relative">
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-b-2xl" />
          
          <div className="max-w-5xl mx-auto px-4 -mt-20 md:-mt-24">
            <GlassCard className="overflow-visible">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6">

                  <div className="-mt-20 md:-mt-16 flex-shrink-0">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white dark:bg-gray-800 border-4 border-background overflow-hidden flex items-center justify-center">
                      {company.logo ? (
                        <img 
                          src={getImageUrl(company.logo) || ""}
                          alt={company.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
        
                  <div className="flex-1 pb-2">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold">
                          {company.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">{company.description}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {company.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {company.location}
                            </span>
                          )}
                          {company.website && (
                            <a
                              href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <Globe className="h-4 w-4" />
                              {company.website.replace(/^https?:\/\//, '')}
                            </a>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {followerCount} followers
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {renderCompanyFollowButton()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                          <Briefcase className="h-5 w-5" />
                          {activeJobsCount}
                        </div>
                        <p className="text-sm text-muted-foreground">Active Jobs</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                          <FileText className="h-5 w-5" />
                          {posts.length}
                        </div>
                        <p className="text-sm text-muted-foreground">Posts</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                          <Eye className="h-5 w-5" />
                          {followerCount}
                        </div>
                        <p className="text-sm text-muted-foreground">Followers</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
                          <TrendingUp className="h-5 w-5" />
                          {engagementRate}%
                        </div>
                        <p className="text-sm text-muted-foreground">Engagement Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <main className="space-y-6">
              <GlassCard className="p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
                    <TabsTrigger value="jobs" className="flex-1">Jobs ({totalJobsCount})</TabsTrigger>
                    <TabsTrigger value="posts" className="flex-1">Posts ({posts.length})</TabsTrigger>
                    <TabsTrigger value="people" className="flex-1">People ({followerCount})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </GlassCard>

              {activeTab === "about" && (
                <GlassCard className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">About</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {company.description || "No description available."}
                  </p>
                  
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    {company.email && (
                      <div>
                        <h3 className="font-display font-semibold mb-1">Email</h3>
                        <a
                          href={`mailto:${company.email}`}
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          {company.email}
                        </a>
                      </div>
                    )}

                    {company.location && (
                      <div>
                        <h3 className="font-display font-semibold mb-1">Location</h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {company.location}
                        </div>
                      </div>
                    )}

                    {company.website && (
                      <div>
                        <h3 className="font-display font-semibold mb-1">Website</h3>
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          {company.website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div>
                      <h3 className="font-display font-semibold mb-1">Joined</h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(company.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              )}

              {activeTab === "jobs" && (
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-display font-semibold text-lg mb-2">No Jobs Posted</h3>
                      <p className="text-sm text-muted-foreground">
                        This company hasn't posted any jobs yet.
                      </p>
                    </GlassCard>
                  ) : (
                    <>
                      {jobs.map((job) => (
                        <GlassCard key={job._id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/jobs/${job._id}`)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                                <Badge variant={job.isActive ? "default" : "secondary"}>
                                  {job.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {job.type}
                                </span>
                                {job.salaryRange && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {job.salaryRange}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm line-clamp-2">{job.description}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {job.applicants && (
                                <span className="text-sm text-muted-foreground">
                                  {job.applicants.length} applicants
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeTab === "posts" && (
                <div className="space-y-4">
              
                  {user && company.email === user.email && (
                    <GlassCard className="p-4">
                      <div className="flex gap-3">
                        <UserAvatar 
                          name={user ? `${user.firstName} ${user.lastName}` : "User"} 
                          src={formatMediaUrl(user?.image)}
                          size="md" 
                        />
                        <div className="flex-1">
                          <Textarea
                            placeholder="Share company news, updates, or announcements..."
                            className="min-h-[100px] resize-none border-0 bg-secondary/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                            value={postContent}
                            onChange={(e) => setPostContent(e.target.value)}
                          />
                          
                          {showAIHelper && (
                            <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30 animate-fade-in">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium">AI Writing Assistant</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Your post will be enhanced with AI when you publish.
                              </p>
                            </div>
                          )}
                          
                          {mediaPreviews.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {mediaPreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                  <img 
                                    src={preview} 
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                  <button
                                    type="button"
                                   
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground relative"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Photo/Video
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  const newFiles = [...mediaFiles, ...files];
                                  
                                  if (newFiles.length > 4) {
                                    toast.error("Maximum 4 files allowed");
                                    return;
                                  }
                                  
                                  setMediaFiles(newFiles);
                                  
                                  const newPreviews = files.map(file => URL.createObjectURL(file));
                                  setMediaPreviews(prev => [...prev, ...newPreviews]);
                                }}
                              />
                              <Button variant="ghost" size="sm" className="text-muted-foreground">
                                <FileText className="h-4 w-4 mr-1" />
                                Document
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={showAIHelper ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setShowAIHelper(!showAIHelper)}
                                className="gap-1"
                              >
                                <Sparkles className="h-4 w-4" />
                                AI
                              </Button>
                              <Button 
                                variant="gradient" 
                                size="sm" 
                                disabled={(!postContent.trim() && mediaFiles.length === 0) || isPosting}
                                onClick={async () => {
                                  if (!postContent.trim() && mediaFiles.length === 0) return;
                                  if (!company) return;
                                  
                                  setIsPosting(true);
                                  try {
                                    const formData = new FormData();
                                    formData.append("content", postContent);
                                    formData.append("useAI", showAIHelper.toString());
                                    
                                    mediaFiles.forEach((file) => {
                                      formData.append("media", file);
                                    });
                                    
                                    const response = await api.createPost(formData);
                                    
                                    const newPost: Post = {
                                      _id: response.data._id,
                                      content: response.data.content,
                                      media: response.data.media?.map(m => ({
                                        type: m.type || 'image',
                                        url: m.url,
                                        _id: m._id || Math.random().toString(36).slice(2, 11)
                                      })),
                                      author: {
                                        id: company._id,
                                        type: "Company",
                                        details: {
                                          _id: company._id,
                                          name: company.name,
                                          logo: company.logo
                                        }
                                      },
                                      authorType: "Company",
                                      reactions: response.data.reactions,
                                      commentsCount: 0,
                                      likesCount: 0,
                                      createdAt: new Date().toISOString(),
                                    };
                                    
                                    setPosts([newPost, ...posts]);
                                    setPostContent("");
                                    setShowAIHelper(false);
                                    setMediaFiles([]);
                                    setMediaPreviews([]);
                                    toast.success("Post created successfully!");
                                  } catch (error: any) {
                                    console.error("Error creating post:", error);
                                    toast.error(error.message || "Failed to create post");
                                  } finally {
                                    setIsPosting(false);
                                  }
                                }}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {isPosting ? "Posting..." : "Post"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  )}
                  {postsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <GlassCard key={i} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-lg" />
                              <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-40 w-full rounded-lg" />
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <GlassCard className="p-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-display font-semibold text-lg mb-2">No Posts Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        This company hasn't posted anything yet.
                      </p>
                    </GlassCard>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <GlassCard key={post._id} className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <UserAvatar 
                                name={getAuthorInfo(post).name} 
                                src={formatMediaUrl(getAuthorInfo(post).image)}
                                size="md"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-display font-semibold">{getAuthorInfo(post).name}</span>
                                  {getAuthorInfo(post).type === "Company" && (
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                      Company
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </p>
                                <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                                
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                                  <ReactionPickerCompact
                                    currentReaction={userReactions[post._id]}
                                    onReact={(type) => {
                                   
                                    }}
                                    onRemoveReaction={() => {
                                  
                                    }}
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-muted-foreground hover:text-primary"
                                    onClick={() => navigate(`/post/${post._id}`)}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    {post.commentsCount || 0} Comments
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "people" && renderFollowersSection()}
            </main>

            <aside className="space-y-4">
              {company.email && (
                <GlassCard className="p-4">
                  <h3 className="font-display font-semibold mb-3">Contact Info</h3>
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-3 text-sm hover:text-primary transition-colors mb-2"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {company.email}
                  </a>
                  {company.website && (
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      Visit website
                    </a>
                  )}
                </GlassCard>
              )}

              <GlassCard className="p-4">
                <h3 className="font-display font-semibold mb-3">Company Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Hiring</span>
                    <Badge variant={activeJobsCount > 0 ? "default" : "secondary"}>
                      {activeJobsCount > 0 ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Follower Growth</span>
                    <span className="text-sm font-semibold text-success">+12%</span>
                  </div>
      
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-display font-semibold mb-3">Open Positions</h3>
                <div className="space-y-3">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate(`/jobs/${job._id}`)}>
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{job.location}</p>
                      </div>
                    </div>
                  ))}
                  
                  {jobs.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => setActiveTab("jobs")}>
                      View all {totalJobsCount} jobs
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </GlassCard>
            </aside>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}