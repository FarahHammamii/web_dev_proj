import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { api, Post, Comment, ReactionType } from "@/lib/api";
import { formatMediaUrl, getMediaType, getFileName } from "@/lib/media";
import { formatDistanceToNow } from "date-fns";
import { ReactionPickerCompact } from "@/components/ReactionPicker";
import { AIBadge } from "@/components/Badges";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import {
  Loader2,
  MapPin,
  Users,
  Briefcase,
  Folder,
  Award,
  Globe,
  ExternalLink,
  UserPlus,
  MessageCircle,
  Calendar,
  SearchX,
  Check,
  X,
  UserMinus,
  UserCheck,
  UserX,
  MoreHorizontal,
  Edit,
  Trash2,
  Pin,
  Clock,
  Reply,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Send,
  ChevronRight,
  FileText,
  Megaphone
} from "lucide-react";

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return dateString;
  }
};

export default function PublicProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "connected">("none");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const { unreadCount } = useUnreadNotifications();
  const [connectionsCount, setConnectionsCount] = useState<number>(0);
  const [connectionDetails, setConnectionDetails] = useState<{
    status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
    isRequester: boolean;
    connectionId: string | null;
  } | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        let currentUserData = null;
        try {
          currentUserData = await api.getUserProfile();
          setCurrentUser(currentUserData);
        } catch (err) {
          console.log("User is viewing as guest");
        }

        if (userId) {
          const publicData = await api.getPublicProfile(userId);
          setUser(publicData);

          try {
            const countResponse = await api.getUserConnectionsCount(userId);
            setConnectionsCount(countResponse.count);
          } catch (err) {
            console.log("Could not fetch connections count:", err);
            if (publicData.connections && Array.isArray(publicData.connections)) {
              setConnectionsCount(publicData.connections.length);
            }
          }

          await fetchUserPosts(userId, 2);
          if (currentUserData && currentUserData._id !== userId) {
            try {
              const connectionStatusData = await api.checkConnectionStatus(userId);
              setConnectionDetails(connectionStatusData);
              
              if (connectionStatusData.status === 'ACCEPTED') {
                setConnectionStatus('connected');
              } else if (connectionStatusData.status === 'PENDING') {
                setConnectionStatus('pending');
              } else {
                setConnectionStatus('none');
              }
            } catch (error) {
              console.error("Error checking connection status:", error);
              setConnectionStatus('none');
              setConnectionDetails(null);
            }
          } else if (currentUserData && currentUserData._id === userId) {
        
            setConnectionStatus('connected'); 
            if (currentUserData.connectionsCount !== undefined) {
              setConnectionsCount(currentUserData.connectionsCount);
            } else if (currentUserData.connections && Array.isArray(currentUserData.connections)) {
              setConnectionsCount(currentUserData.connections.length);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const fetchUserPosts = async (targetUserId: string, limit?: number) => {
    try {
      setIsLoadingPosts(true);
      const response = await api.getUserPosts(targetUserId, 1, limit || 100);
      
      if (response.success && response.data?.posts) {
        const userPosts = response.data.posts;
        setPosts(userPosts.slice(0, limit || userPosts.length));
        
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
      }
    } catch (error: any) {
      console.error("Error fetching user posts:", error);
      toast.error("Failed to load posts");
      setPosts([]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleShowAllPosts = async () => {
    if (userId) {
      await fetchUserPosts(userId);
      setShowAllPosts(true);
    }
  };

  const handleViewAllPosts = () => {
    if (userId) {
      navigate(`/users/${userId}/posts`);
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
    const rawImage = comment.author?.type === 'User' ? (comment.author?.details?.image || currentUser?.image) : (comment.author?.details?.logo);
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
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
    }
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
        name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.firstName || "User";
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

  const renderPost = (post: Post) => {
    const authorInfo = getAuthorInfo(post);
    const userReaction = userReactions[post._id];
    const postType = post.author?.type === 'Company' ? "announcement" : "post";
    
    return (
      <GlassCard key={post._id} className="p-6 mb-4">
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
                  {currentUser && (
                    <div className="flex gap-2">
                      <UserAvatar 
                        name={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User"} 
                        src={formatMediaUrl(currentUser?.image)}
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
                  )}

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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/post/${post._id}`)}
            title="View post"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
      </GlassCard>
    );
  };

  
  const handleConnect = async () => {
    if (!user?._id || !currentUser) return;
    
    setIsConnecting(true);
    try {
      await api.sendConnectionRequest(user._id);
      toast.success("Connection request sent!");
      setConnectionStatus("pending");
      
      setConnectionDetails({
        status: 'PENDING',
        isRequester: true,
        connectionId: null
      });
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast.error(error.message || "Failed to send connection request");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionDetails?.connectionId || !user?._id) return;
    
    setIsResponding(true);
    try {
      await api.respondToConnectionRequest(connectionDetails.connectionId, "ACCEPTED");
      toast.success("Connection request accepted!");
      setConnectionStatus("connected");
      
      setConnectionDetails({
        status: 'ACCEPTED',
        isRequester: false,
        connectionId: connectionDetails.connectionId
      });
      
      setConnectionsCount(prev => prev + 1);
    } catch (error: any) {
      console.error("Error accepting connection request:", error);
      toast.error(error.message || "Failed to accept connection request");
    } finally {
      setIsResponding(false);
    }
  };

  const handleRejectConnection = async () => {
    if (!connectionDetails?.connectionId || !user?._id) return;
    
    setIsResponding(true);
    try {
      await api.respondToConnectionRequest(connectionDetails.connectionId, "REJECTED");
      toast.success("Connection request rejected");
      setConnectionStatus("none");
      
      setConnectionDetails({
        status: 'NONE',
        isRequester: false,
        connectionId: null
      });
    } catch (error: any) {
      console.error("Error rejecting connection request:", error);
      toast.error(error.message || "Failed to reject connection request");
    } finally {
      setIsResponding(false);
    }
  };

  const handleCancelConnection = async () => {
    if (!user?._id || !currentUser || !connectionDetails) return;
    
    if (connectionStatus === 'pending' && connectionDetails.isRequester) {
      setIsConnecting(true);
      try {
        await api.disconnect(user._id);
        toast.success("Connection request cancelled!");
        setConnectionStatus("none");
        setConnectionDetails({
          status: 'NONE',
          isRequester: false,
          connectionId: null
        });
      } catch (error: any) {
        console.error("Error cancelling connection request:", error);
        toast.error(error.message || "Failed to cancel connection request");
      } finally {
        setIsConnecting(false);
      }
    } else if (connectionStatus === 'connected') {
      setIsDisconnecting(true);
      try {
        await api.disconnect(user._id);
        toast.success("Connection removed!");
        setConnectionStatus("none");
        setConnectionDetails({
          status: 'NONE',
          isRequester: false,
          connectionId: null
        });
        
        setConnectionsCount(prev => Math.max(0, prev - 1));
      } catch (error: any) {
        console.error("Error removing connection:", error);
        toast.error(error.message || "Failed to remove connection");
      } finally {
        setIsDisconnecting(false);
      }
    }
  };

  const shouldShowMessageButton = () => {
    return currentUser && 
           currentUser._id !== userId && 
           connectionStatus === 'connected';
  };

  const renderConnectionButton = () => {
    if (!currentUser) {
      return (
        <Button 
          variant="gradient" 
          className="gap-2"
          onClick={() => toast.info("Please login to connect")}
        >
          <UserPlus className="h-4 w-4" />
          Login to Connect
        </Button>
      );
    }

    if (currentUser._id === userId) {
      return (
        <Button variant="outline" className="gap-2" disabled>
          <Check className="h-4 w-4" /> Your Profile
        </Button>
      );
    }

    switch (connectionStatus) {
      case "connected":
        return (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2 text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50"
              disabled
            >
              <Check className="h-4 w-4" /> Connected
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancelConnection}
              disabled={isDisconnecting}
              className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
              title="Remove connection"
            >
              {isDisconnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserMinus className="h-4 w-4" />
              )}
            </Button>
          </div>
        );

      case "pending":
        const isUserRequester = connectionDetails?.isRequester;
        
        if (isUserRequester) {
          return (
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="gap-2"
              >
                <Loader2 className="h-4 w-4" /> Request Sent
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCancelConnection}
                disabled={isConnecting}
                className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                title="Cancel request"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            </div>
          );
        } else {
          return (
            <div className="flex gap-2">
              <Button
                variant="gradient"
                className="gap-2"
                onClick={handleAcceptConnection}
                disabled={isResponding}
              >
                {isResponding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleRejectConnection}
                disabled={isResponding}
              >
                {isResponding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserX className="h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          );
        }

      case "none":
      default:
        return (
          <Button 
            variant="gradient" 
            className="gap-2" 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Connect
          </Button>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <SearchX className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">User not found</h2>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const fullName = `${user.firstName || "User"} ${user.lastName || ""}`;
  const displayConnectionsCount = connectionsCount > 0 ? connectionsCount : 
    (user.connections && Array.isArray(user.connections) ? user.connections.length : 0);

  const displayedPosts = showAllPosts ? posts : posts.slice(0, 2);
  const hasMorePosts = posts.length > 2 && !showAllPosts;

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

      <PageContainer className="pt-0">
        
        <div className="relative mb-6">
          <div className="h-48 md:h-64 bg-gradient-hero rounded-b-2xl" />
          <div className="max-w-6xl mx-auto px-4 -mt-20 md:-mt-24">
            <GlassCard className="overflow-visible">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-end gap-6">
                  <div className="-mt-20 md:-mt-16 relative">
                    <UserAvatar
                      name={fullName}
                      src={formatMediaUrl(user.image)} 
                      size="xl"
                      className="ring-4 ring-background w-32 h-32 md:w-40 md:h-40"
                    />
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-display text-3xl font-bold">{fullName}</h1>
                        <p className="text-lg text-muted-foreground mt-1">
                          {user.headline || user.experiences?.[0]?.title || "Member"}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          {user.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {user.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> {displayConnectionsCount} connections
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Joined {new Date(user.createdAt || Date.now()).getFullYear()}
                          </span>
                        </div>
                      </div>

                    
                      <div className="flex gap-3 mt-4 md:mt-0">
                        {renderConnectionButton()}
                        
                        {shouldShowMessageButton() && (
                          <Button 
                            variant="outline" 
                            className="gap-2"
                            onClick={() => navigate(`/messages?user=${userId}`)}
                          >
                            <MessageCircle className="h-4 w-4" /> Message
                          </Button>
                        )}
                        
                        {user.website && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={user.website} target="_blank" rel="noreferrer">
                              <Globe className="h-5 w-5 text-muted-foreground" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="grid gap-6 lg:grid-cols-[350px_1fr] items-start">
            
            <aside className="space-y-6">
              
              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-3">About</h2>
                {user.about ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{user.about}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No bio provided.</p>
                )}
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {user.skills && user.skills.length > 0 ? (
                    user.skills.map((skill: any, index: number) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {skill.name}
                        {skill.level && (
                          <span className="ml-1 text-xs opacity-60">({skill.level})</span>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills listed.</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" /> Experience
                </h2>
                <div className="space-y-6">
                  {user.experiences && user.experiences.length > 0 ? (
                    user.experiences.map((exp: any, index: number) => (
                      <div key={index} className="relative pl-4 border-l-2 border-border/50 pb-2 last:pb-0">
                        <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                        <h3 className="font-semibold text-sm">{exp.title}</h3>
                        <p className="text-xs font-medium text-foreground/80">{exp.company}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                          {exp.location && ` • ${exp.location}`}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground mt-2">{exp.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No experience listed.</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Folder className="h-5 w-5 text-primary" /> Projects
                </h2>
                <div className="space-y-4">
                  {user.projects && user.projects.length > 0 ? (
                    user.projects.map((proj: any, index: number) => (
                      <div key={index}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{proj.title}</h3>
                            {(proj.startDate || proj.endDate) && (
                              <p className="text-xs text-muted-foreground">
                                {formatDate(proj.startDate)}
                                {proj.endDate && ` - ${formatDate(proj.endDate)}`}
                              </p>
                            )}
                          </div>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                        {index < user.projects.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No projects listed.</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Certifications
                </h2>
                <div className="space-y-4">
                  {user.certificates && user.certificates.length > 0 ? (
                    user.certificates.map((cert: any, index: number) => (
                      <div key={index}>
                        <h3 className="font-semibold text-sm">{cert.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuer} 
                          {cert.issueDate && ` • ${formatDate(cert.issueDate)}`}
                        </p>
                        {cert.url && (
                          <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 block">
                            Show Credential
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None listed.</p>
                  )}
                </div>
              </GlassCard>

            </aside>

         
            <main className="space-y-6">
              <GlassCard>
            
                <div className="border-b p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-lg">Recent Activity</h3>
                    {posts.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleViewAllPosts}
                        className="gap-1"
                      >
                        View All Posts
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-4 mt-4">
                    <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2 px-1">
                      Posts ({posts.length})
                    </button>
                  </div>
                </div>

              
                <div className="p-4">
                  {isLoadingPosts ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : displayedPosts.length > 0 ? (
                    <>
                      {displayedPosts.map((post) => renderPost(post))}
                      
                  
                      {hasMorePosts && !showAllPosts && (
                        <div className="flex flex-col items-center gap-3 mt-6 pt-6 border-t">
                          <Button 
                            variant="outline" 
                            onClick={handleShowAllPosts}
                            className="gap-2"
                          >
                            <ChevronDown className="h-4 w-4" />
                            Show More Posts ({posts.length - 2} more)
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleViewAllPosts}
                            className="gap-1"
                          >
                            View All Posts
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {showAllPosts && posts.length > 0 && (
                        <div className="flex justify-center mt-6 pt-6 border-t">
                          <Button 
                            variant="outline" 
                            onClick={handleViewAllPosts}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Full Posts Page
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                      <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                        <Briefcase className="h-8 w-8 opacity-20" />
                      </div>
                      <h4 className="font-medium text-lg text-foreground mb-1">
                        {user.firstName || 'This user'} hasn't posted anything recently
                      </h4>
                      <p className="max-w-xs mx-auto">
                        Check back later to see their updates.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </main>

          </div>
        </div>
      </PageContainer>
    </div>
  );
}