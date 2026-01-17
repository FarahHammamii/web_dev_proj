import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AIBadge } from "@/components/Badges";
import { ReactionPickerCompact } from "@/components/ReactionPicker";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  Send,
  Heart,
  Plus,
  Megaphone,
  TrendingUp,
  ExternalLink,
  Globe,
  RefreshCw,
  MessageCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Pin,
  Clock,
  Reply,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { api, Post, ReactionType, Comment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatMediaUrl, getMediaType, getFileName } from "@/lib/media";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";

interface UserPostsResponse {
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

export default function UserPosts() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company, isAuthenticated, isLoading: authLoading } = useAuth() as any;
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { unreadCount } = useUnreadNotifications();
  
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<"post" | "announcement">("post");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [engagementRate, setEngagementRate] = useState(0);

  const canCreate = location.pathname === "/my-posts";

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

  useEffect(() => {
    const loadUserPosts = async () => {
      try {
        setIsLoading(true);
        
        let targetUserId = userId;
        
        if (!targetUserId && location.pathname === "/my-posts") {
          if (user?._id) {
            targetUserId = user._id;
          } else {
            try {
              const profile = await api.getUserProfile();
              targetUserId = profile._id;
            } catch (profileError) {
              console.error("❌ Failed to fetch user profile:", profileError);
              toast.error("Cannot load posts: user not identified");
              setPosts([]);
              setIsLoading(false);
              return;
            }
          }
        }
        
        if (!targetUserId) {
          toast.error("Cannot load posts: user not identified");
          setPosts([]);
          setIsLoading(false);
          return;
        }
        
        console.log("✅ Loading posts for user:", targetUserId);
        await fetchUserPosts(targetUserId);
        
      } catch (error) {
        console.error("Error loading user posts:", error);
        toast.error("Failed to load posts");
        setPosts([]);
        setIsLoading(false);
      }
    };

    if (userId || location.pathname === "/my-posts") {
      loadUserPosts();
    } else {
      setIsLoading(false);
    }
  }, [userId, location.pathname, user?._id]);

  const fetchUserPosts = async (targetUserId: string) => {
    try {
      console.log("📡 [DEBUG] Fetching posts for user ID:", targetUserId);
      console.log("📡 [DEBUG] Auth token exists:", !!api.getToken());
      console.log("📡 [DEBUG] API Base URL:", api.getBaseUrl());
      
      const response: UserPostsResponse = await api.getUserPosts(targetUserId, 1, 100);
      
      console.log("📡 [DEBUG] API Response:", {
        success: response.success,
        hasData: !!response.data,
        postsCount: response.data?.posts?.length || 0,
        totalPosts: response.data?.pagination?.total || 0,
        fullResponse: response
      });
      
      if (response.success && response.data?.posts) {
        const userPosts = response.data.posts;
        console.log(`✅ [DEBUG] Found ${userPosts.length} posts for user ${targetUserId}`);
        
        setPosts(userPosts);
        setPagination(response.data.pagination);
        setTotalPosts(response.data.pagination.total);
        
        calculateEngagementStats(userPosts);
        
        const reactions: Record<string, ReactionType | null> = {};
        for (const post of userPosts) {
          try {
            const reactionResponse = await api.getUserReaction("Post", post._id);
            if (reactionResponse.success && reactionResponse.data) {
              reactions[post._id] = reactionResponse.data.reactionType;
            } else {
              reactions[post._id] = null;
            }
          } catch (error) {
            console.log(`No reaction found for post ${post._id}:`, error);
            reactions[post._id] = null;
          }
        }
        setUserReactions(reactions);
        
      } else {
        console.warn("⚠️ [DEBUG] No posts found or response structure unexpected:", response);
        setPosts([]);
        setTotalPosts(0);
        setTotalLikes(0);
        setEngagementRate(0);
      }
    } catch (error: any) {
      console.error("❌ [DEBUG] Error fetching user posts:", error);
      console.error("❌ [DEBUG] Error details:", {
        message: error.message,
        status: error.status,
        stack: error.stack,
        response: error.response
      });
      
      toast.error("Failed to load posts");
      setPosts([]);
      setTotalPosts(0);
      setTotalLikes(0);
      setEngagementRate(0);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEngagementStats = (posts: Post[]) => {
    console.log("Calculating engagement stats for", posts.length, "posts");
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalReactions = 0;
    
    posts.forEach(post => {
      totalLikes += post.likesCount || 0;
      totalComments += post.commentsCount || 0;
      
      if (post.reactions) {
        const reactionTypes: ReactionType[] = ["like", "love", "dislike", "encourage", "haha"];
        reactionTypes.forEach(type => {
          totalReactions += post.reactions?.[type] || 0;
        });
      }
    });
    
    console.log("Calculated stats:", { 
      totalLikes, 
      totalComments, 
      totalReactions,
      postsCount: posts.length 
    });
    
    setTotalLikes(totalLikes);
    
    const totalEngagements = totalLikes + totalComments + totalReactions;
    const estimatedFollowers = 100;
    const rate = estimatedFollowers > 0 && posts.length > 0 
      ? (totalEngagements / (posts.length * estimatedFollowers)) * 100 
      : 0;
    
    setEngagementRate(Math.min(rate, 100));
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("useAI", isAIEnabled.toString());
      
      if (company) {
        formData.append("authorType", "Company");
        formData.append("companyId", company._id);
      }
      
      const response = await api.createPost(formData);
      
      if (response.success) {
        let created = response.data as Post;
        
        if (!created.author || !created.author.details) {
          created.author = {
            id: user?._id || "",
            type: "User",
            details: {
              _id: user?._id || "",
              firstName: user?.firstName,
              lastName: user?.lastName,
              Avatar: user?.image,
            }
          } as any;
        }
        
        const newPost: Post = {
          ...created,
          likesCount: created.likesCount || 0,
          commentsCount: created.commentsCount || 0
        };
        
        setPosts(prev => [newPost, ...prev]);
        setTotalPosts(prev => prev + 1);
        
        setTimeout(() => {
          calculateEngagementStats([newPost, ...posts]);
        }, 100);
        
        setPostContent("");
        setIsAIEnabled(false);
        setIsDialogOpen(false);
        
        toast.success("Post created successfully!");
        
        setTimeout(async () => {
          try {
            let targetUserId = userId;
            if (!targetUserId && location.pathname === "/my-posts") {
              targetUserId = user?._id;
            }
            if (targetUserId) {
              await fetchUserPosts(targetUserId);
            }
          } catch (error) {
            console.error("Error refreshing posts:", error);
          }
        }, 500);
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  const handleRefreshPosts = async () => {
    try {
      setIsLoading(true);
      let targetUserId = userId;
      if (!targetUserId && location.pathname === "/my-posts") {
        targetUserId = user?._id;
      }
      if (targetUserId) {
        await fetchUserPosts(targetUserId);
        toast.success("Posts refreshed!");
      } else {
        toast.error("Unable to determine which posts to refresh");
      }
    } catch (error) {
      console.error("Error refreshing posts:", error);
      toast.error("Failed to refresh posts");
    } finally {
      setIsLoading(false);
    }
  };

  const checkCommentHasReplies = async (commentId: string): Promise<number> => {
    try {
      const response = await api.getCommentReplies(commentId, 1, 1);
      return response.data?.pagination?.total || 0;
    } catch (error) {
      console.log('Error checking for replies:', error);
      return 0;
    }
  };

  const fetchCommentReplies = async (postId: string, commentId: string) => {
    try {
      setPostComments(prev => {
        const updateLoading = (comments: Comment[] = []): Comment[] => {
          return comments.map(c => {
            if (c._id === commentId) return { ...(c as any), repliesLoading: true } as any;
            if ((c as any).replies && (c as any).replies.length > 0) {
              return { ...c, replies: updateLoading((c as any).replies) } as any;
            }
            return c;
          });
        };

        return { ...prev, [postId]: updateLoading(prev[postId]) };
      });

      const response = await api.getCommentReplies(commentId);
      const repliesData: Comment[] = response.data?.replies || response.data?.comments || [];

      const repliesWithMeta = await Promise.all(
        repliesData.map(async (reply) => {
          const nestedReplyCount = await checkCommentHasReplies(reply._id);
          return { ...reply, replies: nestedReplyCount > 0 ? [] : undefined, showReplies: false, repliesLoading: false, hasReplies: nestedReplyCount > 0, replyCount: nestedReplyCount } as any;
        })
      );

      setPostComments(prev => {
        const updateWithReplies = (comments: Comment[] = []): Comment[] => {
          return comments.map(c => {
            if (c._id === commentId) {
              return { ...(c as any), replies: repliesWithMeta, showReplies: true, repliesLoading: false, hasReplies: repliesWithMeta.length > 0, replyCount: repliesWithMeta.length } as any;
            }
            if ((c as any).replies && (c as any).replies.length > 0) {
              return { ...c, replies: updateWithReplies((c as any).replies) } as any;
            }
            return c;
          });
        };

        return { ...prev, [postId]: updateWithReplies(prev[postId]) };
      });
    } catch (error) {
      console.error('Error fetching replies:', error);
      setPostComments(prev => {
        const removeLoading = (comments: Comment[] = []): Comment[] => {
          return comments.map(c => {
            if (c._id === commentId) return { ...(c as any), repliesLoading: false } as any;
            if ((c as any).replies && (c as any).replies.length > 0) {
              return { ...c, replies: removeLoading((c as any).replies) } as any;
            }
            return c;
          });
        };

        return { ...prev, [postId]: removeLoading(prev[postId]) };
      });
    }
  };

  const toggleReplies = (postId: string, commentId: string) => {
    setPostComments(prev => {
      const comments = prev[postId] || [];

      const toggleRecursive = (commentList: Comment[]): Comment[] => {
        return commentList.map(c => {
          if (c._id === commentId) {
            const shouldShow = !(c as any).showReplies;
            if (shouldShow && (((c as any).replies && (c as any).replies.length === 0) || !(c as any).replies) && !(c as any).repliesLoading) {
              fetchCommentReplies(postId, commentId);
            }
            return { ...(c as any), showReplies: shouldShow } as any;
          }
          if ((c as any).replies && (c as any).replies.length > 0) {
            return { ...c, replies: toggleRecursive((c as any).replies) } as any;
          }
          return c;
        });
      };

      return { ...prev, [postId]: toggleRecursive(comments) };
    });
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await api.getPostComments(postId);
      const commentsData: Comment[] = response.data?.comments || response.data?.replies || [];

      const commentsWithMeta = await Promise.all(
        commentsData.map(async (comment) => {
          const replyCount = await checkCommentHasReplies(comment._id);
          return { ...comment, replyCount } as Comment;
        })
      );

      setPostComments(prev => ({ ...prev, [postId]: commentsWithMeta }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    try {
      const parentCommentId = replyingTo[postId];
      const response = await api.createComment(postId, { content: commentText, parentCommentId });
      if (response.success && response.data) {
        const newComment = response.data as Comment;

        if (parentCommentId) {
          setPostComments(prev => {
            const current = prev[postId] || [];

            const addReply = (commentsList: Comment[]): Comment[] => {
              return commentsList.map(c => {
                if (c._id === parentCommentId) {
                  const replies = Array.isArray((c as any).replies) ? (c as any).replies : [];
                  return { ...(c as any), replies: [...replies, newComment], hasReplies: true, showReplies: true, replyCount: ((c as any).replyCount || 0) + 1 } as any;
                } else if ((c as any).replies && (c as any).replies.length > 0) {
                  return { ...c, replies: addReply((c as any).replies) } as any;
                }
                return c;
              });
            };

            return { ...prev, [postId]: addReply(current) };
          });
        } else {
          setPostComments(prev => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
        }

        setCommentInputs(prev => ({ ...prev, [postId]: "" }));
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleReply = (postId: string, commentId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: commentId }));
  };

  const cancelReply = (postId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
  };

  const toggleComments = (postId: string) => {
    const newShow = !showComments[postId];
    setShowComments(prev => ({ ...prev, [postId]: newShow }));
    if (newShow && (!postComments[postId] || postComments[postId].length === 0)) {
      fetchComments(postId);
    }
  };

  const renderComment = (comment: any, postId: string, depth = 0) => {
    const authorName = comment.author?.type === 'User' ? `${comment.author.details?.firstName || ''} ${comment.author.details?.lastName || ''}`.trim() : comment.author?.details?.name || 'User';
    const rawImage = comment.author?.type === 'User' ? (comment.author?.details?.image || user?.image) : (comment.author?.details?.logo);
    const authorImage = formatMediaUrl(rawImage);

    const isReplying = replyingTo[postId] === comment._id;
    const hasReplies = comment.hasReplies || (comment.replies && comment.replies.length > 0);
    const showRepliesButton = comment.hasReplies || (comment.replies !== undefined && comment.replies.length > 0) || depth === 0;

    return (
      <div key={comment._id} className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <UserAvatar name={authorName} src={authorImage} size="sm" />
        <div className="flex-1">
          <div className={`bg-secondary/50 rounded-lg p-3` + (isReplying ? ' ring-2 ring-primary/50' : '')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => handleReply(postId, comment._id)}>
              <Reply className="h-3 w-3 mr-1" /> Reply
            </Button>

            {showRepliesButton && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-6"
                onClick={() => toggleReplies(postId, comment._id)}
                disabled={comment.repliesLoading}
              >
                {comment.repliesLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    Loading...
                  </span>
                ) : (
                  <>
                    {comment.showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    )}
                  </>
                )}
              </Button>
            )}

            {isReplying && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => cancelReply(postId)}>
                Cancel
              </Button>
            )}
          </div>

          {comment.showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map((r: any) => renderComment(r, postId, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      await api.addReaction("Post", postId, reactionType);
      setUserReactions(prev => ({ ...prev, [postId]: reactionType }));
      
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          const prevReaction = userReactions[postId];
          const stats = post.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
          
          if (prevReaction) {
            stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
            stats.total = Math.max(0, stats.total - 1);
          }
          
          stats[reactionType]++;
          stats.total++;
          
          return { 
            ...post, 
            reactions: { ...stats },
            likesCount: (post.likesCount || 0) + 1
          };
        }
        return post;
      }));
      
      setTotalLikes(prev => prev + 1);
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  const handleRemoveReaction = async (postId: string) => {
    try {
      await api.removeReaction("Post", postId);
      const prevReaction = userReactions[postId];
      setUserReactions(prev => ({ ...prev, [postId]: null }));
      
      if (prevReaction) {
        setPosts(prev => prev.map(post => {
          if (post._id === postId) {
            const stats = post.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
            stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
            stats.total = Math.max(0, stats.total - 1);
            
            return { 
              ...post, 
              reactions: { ...stats },
              likesCount: Math.max(0, (post.likesCount || 0) - 1)
            };
          }
          return post;
        }));
        
        setTotalLikes(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(post => post._id !== postId));
      setTotalPosts(prev => prev - 1);
      toast.success("Post deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error(error.message || "Failed to delete post");
    }
  };

  const handlePinPost = (postId: string) => {
    toast.info("Pinning functionality requires backend implementation");
  };

  const getAuthorInfo = (post: Post) => {
    let name = "User";
    let image = undefined;
    let type = "User";
    
    if (post.author && typeof post.author === 'object') {
      type = post.author.type || post.authorType || "User";
      
      if ('details' in post.author && post.author.details) {
        const details = post.author.details;
        
        if (type === "Company") {
          name = details.name || "Company";
          image = details.logo;
        } else {
          name = `${details.firstName || ''} ${details.lastName || ''}`.trim();
          image = details.image;
        }
      } else {
        if (type === "Company") {
          name = (post.author as any).name || "Company";
          image = (post.author as any).logo;
        } else {
          name = `${(post.author as any).firstName || ''} ${(post.author as any).lastName || ''}`.trim();
          image = (post.author as any).image;
        }
      }
    }
    
    if (!name || name === "User") {
      if (user) {
        name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || "You";
        image = image || user.image;
      }
    }
    
    return { name, image, type };
  };

  const renderPostMedia = (post: Post) => {
    if (!post.media || post.media.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        {post.media.map((media, index) => {
          if (!media.url) return null;
          
          const mediaUrl = formatMediaUrl(media.url);
          const mediaType = media.type || getMediaType(media.url);
          
          return (
            <div key={index} className="rounded-lg overflow-hidden">
              {mediaType === 'image' ? (
                <div>
                  <img 
                    src={mediaUrl} 
                    alt={`Post media ${index + 1}`}
                    className="w-full h-auto max-h-96 object-contain rounded-lg"
                    onError={(e) => {
                      console.error(`Failed to load image: ${mediaUrl}`);
                      e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                    }}
                  />
                </div>
              ) : mediaType === 'video' ? (
                <div>
                  <video 
                    controls 
                    className="w-full max-h-96"
                    poster="https://placehold.co/600x400/1a1a1a/ffffff?text=Video+Thumbnail"
                  >
                    <source src={mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="bg-secondary p-4 rounded-lg">
                  <a 
                    href={mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View document: {getFileName(media.url)}</span>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">
                {userId && userId !== user?._id ? "User Posts" : "My Posts"}
              </h1>
              <p className="text-muted-foreground">Manage your posts and content</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefreshPosts}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  {canCreate && (
                    <Button variant="gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="font-display">Create New Post</DialogTitle>
                    <DialogDescription>
                      Share your thoughts, ideas, or updates with your network.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex gap-3">
                      <Button
                        variant={postType === "post" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPostType("post")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Post
                      </Button>
                      
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-primary">
                          <Sparkles className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div>
                          <Label htmlFor="ai-mode" className="font-medium">AI Writing Assistant</Label>
                          <p className="text-xs text-muted-foreground">Let AI help enhance your content</p>
                        </div>
                      </div>
                      <Switch
                        id="ai-mode"
                        checked={isAIEnabled}
                        onCheckedChange={setIsAIEnabled}
                      />
                    </div>

                    <Textarea
                      placeholder={isAIEnabled ? "Describe what you want to post and AI will help..." : "What's on your mind?"}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[150px] resize-none"
                    />

                    {isAIEnabled && postContent && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Generate with AI
                      </Button>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon">
                          <ImageIcon className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <FileText className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="gradient" 
                          onClick={handleCreatePost} 
                          disabled={!postContent.trim() || isPosting}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {isPosting ? "Posting..." : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{totalPosts}</p>
                  <p className="text-xs text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Heart className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{totalLikes}</p>
                  <p className="text-xs text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold">{engagementRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Engagement Rate</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <GlassCard key={i} className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-40 w-full rounded-lg" />
                  </div>
                </GlassCard>
              ))
            ) : posts.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No Posts Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't created any posts yet. Share your first post!
                </p>
                {canCreate && (
                  <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                )}
              </GlassCard>
            ) : (
              posts.map((post) => {
                const authorInfo = getAuthorInfo(post);
                const userReaction = userReactions[post._id];
                
                return (
                  <GlassCard key={post._id} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <UserAvatar 
                          name={authorInfo.name} 
                          src={formatMediaUrl(authorInfo.image)}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-semibold">{authorInfo.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {postType === "announcement" ? (
                                <><Megaphone className="h-3 w-3 mr-1" />Announcement</>
                              ) : (
                                <><FileText className="h-3 w-3 mr-1" />Post</>
                              )}
                            </Badge>
                            {post.useAI && <AIBadge />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · 
                            <Globe className="h-3 w-3 inline ml-1" />
                          </p>
                          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                          
                          {renderPostMedia(post)}
                          
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                            <div className="flex items-center gap-4">
                              <ReactionPickerCompact
                                currentReaction={userReaction}
                                onReact={(type) => handleReaction(post._id, type)}
                                onRemoveReaction={() => handleRemoveReaction(post._id)}
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-muted-foreground hover:text-primary"
                                onClick={() => toggleComments(post._id)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {post.commentsCount || 0} Comments
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{post.likesCount || 0} likes</span>
                            </div>
                          </div>
                          
                          {showComments[post._id] && (
                            <div className="mt-4 space-y-4" data-post-id={post._id}>
                              <div className="flex gap-2">
                                <UserAvatar 
                                  name={user ? `${user.firstName} ${user.lastName}` : "User"} 
                                  src={formatMediaUrl(user?.image)}
                                  size="sm" 
                                />
                                <div className="flex-1">
                                  <Textarea
                                    placeholder={replyingTo[post._id] ? "Write a reply..." : "Write a comment..."}
                                    className="min-h-[60px] resize-none border border-input rounded-lg"
                                    value={commentInputs[post._id] || ""}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post._id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAddComment(post._id);
                                      }
                                    }}
                                  />
                                  <div className="flex justify-end mt-2">
                                    <Button size="sm" onClick={() => handleAddComment(post._id)} disabled={!commentInputs[post._id]?.trim()}>
                                      {replyingTo[post._id] ? "Reply" : "Comment"}
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {(postComments[post._id] || []).map((comment: Comment) => renderComment(comment, post._id))}
                              </div>

                              {(postComments[post._id]?.length === 0) && (
                                <p className="text-center text-sm text-muted-foreground py-4">No comments yet. Be the first to comment!</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePinPost(post._id)}>
                            <Pin className="h-4 w-4 mr-2" />
                            Pin Post
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/post/${post._id}`)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Post
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeletePost(post._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </GlassCard>
                );
              })
            )}
            
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => {/* Handle previous page */}}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => {/* Handle next page */}}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}