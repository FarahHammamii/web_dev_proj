import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { ReactionPicker, ReactionPickerCompact } from "@/components/ReactionPicker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMediaUrl, getMediaType, getFileName } from "@/lib/media";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Image,
  Video,
  FileText,
  Calendar,
  Sparkles,
  MessageCircle,
  MoreHorizontal,
  Send,
  TrendingUp,
  Users,
  Briefcase,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  Reply,
  Heart,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { api, FeedPost, ReactionType, ReactionStats, TrendingTopic, User, Comment, Company } from "@/lib/api";

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  showReplies?: boolean;
  repliesLoading?: boolean;
  hasReplies?: boolean;
  replyCount?: number;
}

export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postsContainerRef = useRef<HTMLDivElement>(null);
  
 
  const [postContent, setPostContent] = useState("");
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [suggestedCompanies, setSuggestedCompanies] = useState<Company[]>([]);
  

  const [currentUser, setCurrentUser] = useState<any>(null);
  

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, CommentWithReplies[]>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  

  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalComments, setModalComments] = useState<CommentWithReplies[]>([]);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalReplyingTo, setModalReplyingTo] = useState<string | null>(null);


  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isAuthenticated) {
        try {
          const userProfile = await api.getUserProfile();
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (user) {
            setCurrentUser(user);
          }
        }
      }
    };

    fetchCurrentUser();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeed();
      fetchTrends();
      fetchSuggestions();
      fetchConnectionsCount();
      fetchFollowingCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const postId = searchParams.get('postId');
    if (postId && posts.length > 0 && postsContainerRef.current) {
      const postElement = document.getElementById(`post-${postId}`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postElement.classList.add('notification-highlight');
        setTimeout(() => {
          postElement.classList.remove('notification-highlight');
        }, 3000);
      }
    }
  }, [posts, searchParams]);
  useEffect(() => {
    const postId = searchParams.get("postId");
    if (!postId || posts.length === 0) return;

    const post = posts.find(p => p._id === postId);
    if (post) {
      handlePostClick(post); 
    }
  }, [posts, searchParams]);
 
  const fetchFollowingCount = async () => {
    try {
      const following = await api.getFollowingList();
      setFollowingCount(Array.isArray(following) ? following.length : 0);
    } catch (error) {
      console.error('Error fetching following count:', error);
    }
  };

  const refreshFeed = async () => {
    await fetchFeed();
    toast.success("Feed refreshed!");
  };

  const fetchFeed = async () => {
    try {
      setIsLoading(true);
      const response = await api.getFeed();
      const postsData = response.data?.posts || [];
      
      console.log('Posts loaded:', postsData.length);
      
      setPosts(postsData);

      const reactions: Record<string, ReactionType | null> = {};
      postsData.forEach((post) => {
        reactions[post._id] = post.userReaction?.reactionType || null;
      });
      setUserReactions(reactions);
      
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error("Failed to load feed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await api.getTrendingTopics(5);
      setTrendingTopics(response.data || []);
    } catch (error) {
      console.error("Error fetching trends:", error);
    }
  };

  const fetchSuggestions = async () => {
    try {

      const userResponse = await api.getUserSuggestions(3);
      setSuggestedUsers(Array.isArray(userResponse) ? userResponse : []);

      const companyResponse = await api.getCompanySuggestions(3);
      setSuggestedCompanies(Array.isArray(companyResponse) ? companyResponse : []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const fetchConnectionsCount = async () => {
    try {
      const connections = await api.getMyConnections();
      setConnectionsCount(Array.isArray(connections) ? connections.length : 0);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const handleFollowCompany = async (companyId: string) => {
    try {
      await api.followCompany(companyId);
      toast.success("Started following company!");

      setFollowingCount(prev => prev + 1);

      setSuggestedCompanies(prev => prev.filter((c) => c._id !== companyId));
    } catch (error: any) {
      console.error("Error following company:", error);
      toast.error(error.message || "Failed to follow company");
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      console.log('Fetching comments for post:', postId);
      const response = await api.getPostComments(postId);
      
      const commentsData: Comment[] = response.data?.comments || response.data?.replies || [];
      
      const commentsWithReplies = await Promise.all(
        commentsData.map(async (comment) => {
          const replyCount = await checkCommentHasReplies(comment._id);
          
          return {
            ...comment,
            replies: replyCount > 0 ? [] : undefined,
            showReplies: false,
            repliesLoading: false,
            hasReplies: replyCount > 0,
            replyCount: replyCount
          };
        })
      );
      
      setPostComments(prev => ({
        ...prev,
        [postId]: commentsWithReplies
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };
  const fetchModalComments = async (postId: string) => {
    try {
      const response = await api.getPostComments(postId);
      const commentsData: Comment[] = response.data?.comments || response.data?.replies || [];
      
      const commentsWithReplies = await Promise.all(
        commentsData.map(async (comment) => {
          const replyCount = await checkCommentHasReplies(comment._id);
          
          return {
            ...comment,
            replies: replyCount > 0 ? [] : undefined,
            showReplies: false,
            repliesLoading: false,
            hasReplies: replyCount > 0,
            replyCount: replyCount
          };
        })
      );
      
      setModalComments(commentsWithReplies);
    } catch (error) {
      console.error("Error fetching modal comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const fetchCommentReplies = async (postId: string, commentId: string) => {
    try {

      setPostComments(prev => {
        const updateCommentWithLoading = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, repliesLoading: true };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentWithLoading(comment.replies)
              };
            }
            return comment;
          });
        };
        
        return {
          ...prev,
          [postId]: updateCommentWithLoading(prev[postId] || [])
        };
      });
      
      const response = await api.getCommentReplies(commentId);
      const repliesData: Comment[] = response.data?.replies || response.data?.comments || [];

      const repliesWithMeta = await Promise.all(
        repliesData.map(async (reply) => {
          const nestedReplyCount = await checkCommentHasReplies(reply._id);
          return {
            ...reply,
            replies: nestedReplyCount > 0 ? [] : undefined,
            showReplies: false,
            repliesLoading: false,
            hasReplies: nestedReplyCount > 0,
            replyCount: nestedReplyCount
          };
        })
      );
      setPostComments(prev => {
        const updateCommentWithReplies = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: repliesWithMeta,
                showReplies: true,
                repliesLoading: false,
                hasReplies: repliesWithMeta.length > 0,
                replyCount: repliesWithMeta.length
              };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentWithReplies(comment.replies)
              };
            }
            return comment;
          });
        };
        
        return {
          ...prev,
          [postId]: updateCommentWithReplies(prev[postId] || [])
        };
      });
      
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Failed to load replies");

      setPostComments(prev => {
        const removeLoadingState = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, repliesLoading: false };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: removeLoadingState(comment.replies)
              };
            }
            return comment;
          });
        };
        
        return {
          ...prev,
          [postId]: removeLoadingState(prev[postId] || [])
        };
      });
    }
  };

  const fetchModalCommentReplies = async (commentId: string) => {
    try {
      const response = await api.getCommentReplies(commentId);
      const repliesData: Comment[] = response.data?.replies || response.data?.comments || [];
      
      const repliesWithMeta = await Promise.all(
        repliesData.map(async (reply) => {
          const nestedReplyCount = await checkCommentHasReplies(reply._id);
          return {
            ...reply,
            replies: nestedReplyCount > 0 ? [] : undefined,
            showReplies: false,
            repliesLoading: false,
            hasReplies: nestedReplyCount > 0,
            replyCount: nestedReplyCount
          };
        })
      );

      const updateCommentWithReplies = (comments: CommentWithReplies[]): CommentWithReplies[] => {
        return comments.map(comment => {
          if (comment._id === commentId) {
            return {
              ...comment,
              replies: repliesWithMeta,
              showReplies: true,
              repliesLoading: false,
              hasReplies: repliesWithMeta.length > 0,
              replyCount: repliesWithMeta.length
            };
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentWithReplies(comment.replies)
            };
          }
          return comment;
        });
      };
      
      setModalComments(prev => updateCommentWithReplies(prev));
    } catch (error) {
      console.error("Error fetching modal replies:", error);

      const removeLoadingState = (comments: CommentWithReplies[]): CommentWithReplies[] => {
        return comments.map(comment => {
          if (comment._id === commentId) {
            return { ...comment, repliesLoading: false };
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: removeLoadingState(comment.replies)
            };
          }
          return comment;
        });
      };
      
      setModalComments(prev => removeLoadingState(prev));
    }
  };

  const toggleComments = (postId: string) => {
    const newShowState = !showComments[postId];
    setShowComments(prev => ({
      ...prev,
      [postId]: newShowState
    }));
    
    if (newShowState && (!postComments[postId] || postComments[postId].length === 0)) {
      fetchComments(postId);
    }
  };

  const toggleReplies = (postId: string, commentId: string) => {
    setPostComments(prev => {
      const comments = prev[postId] || [];
      
      const updateCommentRecursive = (commentList: CommentWithReplies[]): CommentWithReplies[] => {
        return commentList.map(comment => {
          if (comment._id === commentId) {
            const shouldShow = !comment.showReplies;
            
            if (shouldShow && comment.replies?.length === 0 && !comment.repliesLoading) {
              fetchCommentReplies(postId, commentId);
            }
            
            return {
              ...comment,
              showReplies: shouldShow
            };
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentRecursive(comment.replies)
            };
          }
          return comment;
        });
      };
      
      return {
        ...prev,
        [postId]: updateCommentRecursive(comments)
      };
    });
  };

  const toggleModalReplies = async (commentId: string) => {
    if (!selectedPost) return;

    try {
      const updateCommentRecursive = (comments: CommentWithReplies[]): CommentWithReplies[] => {
        return comments.map(comment => {
          if (comment._id === commentId) {
            const shouldShow = !comment.showReplies;
            
            if (shouldShow && comment.replies?.length === 0 && !comment.repliesLoading) {
              fetchModalCommentReplies(commentId);
            }
            
            return {
              ...comment,
              showReplies: shouldShow,
              repliesLoading: shouldShow && comment.replies?.length === 0
            };
          } else if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: updateCommentRecursive(comment.replies)
            };
          }
          return comment;
        });
      };
      
      setModalComments(prev => updateCommentRecursive(prev));
    } catch (error) {
      console.error("Error toggling replies:", error);
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

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    try {
      const parentCommentId = replyingTo[postId];
      const response = await api.createComment(postId, {
        content: commentText,
        parentCommentId: parentCommentId || undefined,
        useAI: false
      });

      const newComment: CommentWithReplies = {
        ...response.data,
        replies: [],
        showReplies: false,
        repliesLoading: false,
        hasReplies: false,
        replyCount: 0
      };

      if (parentCommentId) {
        setPostComments(prev => {
          const currentComments = prev[postId] || [];
          
          const addReplyToComment = (comments: CommentWithReplies[]): CommentWithReplies[] => {
            return comments.map(comment => {
              if (comment._id === parentCommentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                  hasReplies: true,
                  showReplies: true,
                  replyCount: (comment.replyCount || 0) + 1
                };
              } else if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: addReplyToComment(comment.replies)
                };
              }
              return comment;
            });
          };
          
          return {
            ...prev,
            [postId]: addReplyToComment(currentComments)
          };
        });
      } else {
        setPostComments(prev => ({
          ...prev,
          [postId]: [newComment, ...(prev[postId] || [])]
        }));
      }

      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return { 
            ...post, 
            commentsCount: (post.commentsCount || 0) + 1 
          };
        }
        return post;
      }));

      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
      
      toast.success(parentCommentId ? "Reply added!" : "Comment added!");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    }
  };

  const handleAddModalComment = async () => {
    if (!modalCommentInput.trim() || !selectedPost) return;

    try {
      const response = await api.createComment(selectedPost._id, {
        content: modalCommentInput,
        parentCommentId: modalReplyingTo || undefined,
        useAI: false
      });

      const newComment: CommentWithReplies = {
        ...response.data,
        replies: [],
        showReplies: false,
        repliesLoading: false,
        hasReplies: false,
        replyCount: 0
      };

      if (modalReplyingTo) {
        const addReplyToComment = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === modalReplyingTo) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newComment],
                hasReplies: true,
                showReplies: true,
                replyCount: (comment.replyCount || 0) + 1
              };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToComment(comment.replies)
              };
            }
            return comment;
          });
        };
        
        setModalComments(addReplyToComment(modalComments));
      } else {
        setModalComments(prev => [newComment, ...prev]);
      }

      setPosts(prev => prev.map(post => {
        if (post._id === selectedPost._id) {
          return { 
            ...post, 
            commentsCount: (post.commentsCount || 0) + 1 
          };
        }
        return post;
      }));

      setModalCommentInput("");
      setModalReplyingTo(null);
      
      toast.success(modalReplyingTo ? "Reply added!" : "Comment added!");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
    }
  };

  const handleReply = (postId: string, commentId: string, commentAuthorName?: string) => {
    setReplyingTo(prev => ({ 
      ...prev, 
      [postId]: commentId 
    }));
    setCommentInputs(prev => ({ 
      ...prev, 
      [postId]: `@${commentAuthorName || 'User'} ` 
    }));
    
    setTimeout(() => {
      const textarea = document.querySelector(`[data-post-id="${postId}"] textarea`);
      if (textarea) {
        (textarea as HTMLTextAreaElement).focus();
      }
    }, 100);
  };

  const handleModalReply = (commentId: string, commentAuthorName?: string) => {
    setModalReplyingTo(commentId);
    setModalCommentInput(`@${commentAuthorName || 'User'} `);
  };

  const cancelReply = (postId: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: null }));
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  const cancelModalReply = () => {
    setModalReplyingTo(null);
    setModalCommentInput("");
  };

  const handlePost = async () => {
    if (!postContent.trim() && mediaFiles.length === 0) return;
    
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("useAI", showAIHelper.toString());
      
      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });
      
      const response = await api.createPost(formData);
      
      const newFeedPost: FeedPost = {
        _id: response.data._id,
        content: response.data.content,
        media: response.data.media?.map(m => ({
          type: m.type || 'image',
          url: m.url,
          _id: m._id || Math.random().toString(36).slice(2, 11)
        })),
        author: {
          id: currentUser?._id || user?._id || "",
          type: "User",
          details: {
            _id: currentUser?._id || user?._id || "",
            firstName: currentUser?.firstName || user?.firstName,
            lastName: currentUser?.lastName || user?.lastName,
            image: currentUser?.image || user?.image
          }
        },
        likesCount: 0,
        commentsCount: 0,
        reactions: response.data.reactions,
        createdAt: new Date().toISOString(),
        userReaction: null
      };
      
      setPosts([newFeedPost, ...posts]);
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
  };

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    try {
      await api.addReaction("Post", postId, reactionType);
      setUserReactions((prev) => ({ ...prev, [postId]: reactionType }));
      
      setPosts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            const prevReaction = userReactions[postId];
            const stats = post.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
            
            if (prevReaction) {
              stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
              stats.total = Math.max(0, stats.total - 1);
            }
            
            stats[reactionType]++;
            stats.total++;
            
            return { ...post, reactions: { ...stats } };
          }
          return post;
        })
      );

      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => {
          if (!prev) return null;
          const prevReaction = userReactions[postId];
          const stats = prev.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
          
          if (prevReaction) {
            stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
            stats.total = Math.max(0, stats.total - 1);
          }
          
          stats[reactionType]++;
          stats.total++;
          
          return { ...prev, reactions: { ...stats } };
        });
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  const handleRemoveReaction = async (postId: string) => {
    try {
      await api.removeReaction("Post", postId);
      const prevReaction = userReactions[postId];
      setUserReactions((prev) => ({ ...prev, [postId]: null }));
      
      if (prevReaction) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              const stats = post.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
              stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
              stats.total = Math.max(0, stats.total - 1);
              return { ...post, reactions: { ...stats } };
            }
            return post;
          })
        );

        if (selectedPost && selectedPost._id === postId) {
          setSelectedPost(prev => {
            if (!prev) return null;
            const stats = prev.reactions || { total: 0, like: 0, love: 0, dislike: 0, encourage: 0, haha: 0 };
            stats[prevReaction] = Math.max(0, stats[prevReaction] - 1);
            stats.total = Math.max(0, stats.total - 1);
            return { ...prev, reactions: { ...stats } };
          });
        }
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await api.sendConnectionRequest(userId);
      toast.success("Connection request sent!");
      setSuggestedUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast.error(error.message || "Failed to send connection request");
    }
  };


  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...mediaFiles, ...files];
    
    if (newFiles.length > 4) {
      toast.error("Maximum 4 files allowed");
      return;
    }
    
    setMediaFiles(newFiles);
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostClick = (post: FeedPost) => {
    setSelectedPost(post);
    setShowPostModal(true);
    setModalCommentInput("");
    setModalReplyingTo(null);

    fetchModalComments(post._id);
  };

  const closeModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
    setModalComments([]);
    setModalCommentInput("");
    setModalReplyingTo(null);
  };

  const renderModalComment = (comment: CommentWithReplies, depth = 0) => {
    const authorName = comment.author.type === "User"
      ? `${comment.author.details?.firstName || ''} ${comment.author.details?.lastName || ''}`.trim()
      : comment.author.details?.name || "Company User";

    const authorImage = formatMediaUrl(
      comment.author.type === "User" 
        ? comment.author.details?.image 
        : comment.author.details?.logo
    );

    const isReplying = modalReplyingTo === comment._id;
    const hasReplies = comment.hasReplies || (comment.replies && comment.replies.length > 0);
    const showRepliesButton = comment.hasReplies || 
      (comment.replies !== undefined && comment.replies.length > 0) || 
      depth === 0;

    return (
      <div key={comment._id} className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <UserAvatar 
          name={authorName} 
          src={authorImage}
          size="sm" 
        />
        <div className="flex-1">
          <div className={`bg-secondary/50 p-3 ${isReplying ? 'ring-2 ring-primary/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {authorName}
                </span>
                {comment.author.type === "Company" && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    Company
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground h-6"
              onClick={() => handleModalReply(comment._id, authorName)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
            {showRepliesButton && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground h-6"
                onClick={() => toggleModalReplies(comment._id)}
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground h-6"
                onClick={cancelModalReply}
              >
                Cancel
              </Button>
            )}
          </div>
          
          {comment.showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map(reply => renderModalComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderComment = (comment: CommentWithReplies, postId: string, depth = 0) => {
    const authorName = comment.author.type === "User"
      ? `${comment.author.details?.firstName || ''} ${comment.author.details?.lastName || ''}`.trim()
      : comment.author.details?.name || "Company User";

    const authorImage = formatMediaUrl(
      comment.author.type === "User" 
        ? comment.author.details?.image 
        : comment.author.details?.logo
    );

    const isReplying = replyingTo[postId] === comment._id;
    const hasReplies = comment.hasReplies || (comment.replies && comment.replies.length > 0);
    const showRepliesButton = comment.hasReplies || 
      (comment.replies !== undefined && comment.replies.length > 0) || 
      depth === 0;

    return (
      <div key={comment._id} className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <UserAvatar 
          name={authorName} 
          src={authorImage}
          size="sm" 
        />
        <div className="flex-1">
          <div className={`bg-secondary/50 rounded-lg p-3 ${isReplying ? 'ring-2 ring-primary/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {authorName}
                </span>
                {comment.author.type === "Company" && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    Company
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground h-6"
              onClick={() => handleReply(postId, comment._id, authorName)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground h-6"
                onClick={() => cancelReply(postId)}
              >
                Cancel
              </Button>
            )}
          </div>
          
          {comment.showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">
              {comment.replies.map(reply => renderComment(reply, postId, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };


  const getUserData = () => {
    return currentUser || user;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const userData = getUserData();
  const userName = userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : "User";
  const userImage = userData?.image;
  const userHeadline = userData?.headline || "Professional";

  const navbarUser = isAuthenticated ? (
    userData ? {
      name: userName,
      email: userData.email,
      avatar: formatMediaUrl(userImage),
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

      <PageContainer className="pt-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_300px]">
          <aside className="hidden lg:block space-y-4">
            <GlassCard className="overflow-hidden">
              <div className="h-20 bg-gradient-primary" />
              <div className="p-4 -mt-10 text-center">
                <UserAvatar
                  name={userName}
                  src={formatMediaUrl(userImage)}
                  size="lg"
                  showStatus
                  status="online"
                  className="mx-auto ring-4 ring-background"
                />
                <h3 className="mt-3 font-display font-semibold">
                  {userName}
                </h3>
                <p className="text-sm text-muted-foreground">{userHeadline}</p>
              </div>
              <Separator />
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-medium text-primary">{connectionsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Following</span>
                  <span className="font-medium text-primary">{followingCount}</span>
                </div>
              </div>
              <Separator />
              <div className="p-4 space-y-3">
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm" onClick={() => navigate("/profile")}>
                  <Users className="h-4 w-4" />
                  View Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={() => navigate("/my-posts")}
                >
                  <FileText className="h-4 w-4" />
                  My Posts
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full justify-start gap-2 text-sm"
                  onClick={refreshFeed}
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Feed
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.length > 0 ? (
                  trendingTopics.map((topic, index) => (
                    <div
                      key={topic.tag}
                      className="flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          #{topic.tag}
                        </p>
                        <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                      </div>
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No trending topics</p>
                )}
              </div>
            </GlassCard>
          </aside>

          <main className="space-y-4">
            <GlassCard className="p-4">
              <div className="flex gap-3">
                <UserAvatar 
                  name={userName} 
                  src={formatMediaUrl(userImage)}
                  size="md" 
                />
                <div className="flex-1">
                  <Textarea
                    placeholder="Share your thoughts, ideas, or updates..."
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
                            onClick={() => removeMedia(index)}
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
                        <Image className="h-4 w-4 mr-1" />
                       Media
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleMediaUpload}
                      />
                      
                     
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
                        onClick={handlePost}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        {isPosting ? "Posting..." : "Post"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <GlassCard key={i} className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                      <Skeleton className="h-20 w-full mt-4" />
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : posts.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
              </GlassCard>
            ) : (
              posts.map((post) => {
                const authorName = post.author.type === "User" 
                  ? `${post.author.details?.firstName || ''} ${post.author.details?.lastName || ''}`.trim()
                  : post.author.details?.name || "Company";
                  
                const authorImage = formatMediaUrl(
                  post.author.type === "User" 
                    ? post.author.details?.image 
                    : post.author.details?.logo
                );
                
                return (
                  <GlassCard 
                    key={post._id} 
                    className="overflow-hidden animate-fade-in"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3">
                          <div 
                            className="cursor-pointer"
                            onClick={(e) => {
                              if (post.author.type === "Company") {
                                navigate(`/companies/${post.author.details._id}`);
                              } else {
                                navigate(`/profile/${post.author.details._id}`);
                              }
                            }}
                          >
                            <UserAvatar name={authorName} src={authorImage} size="md" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 
                                className="font-semibold hover:text-primary cursor-pointer transition-colors"
                                onClick={(e) => {
                                  if (post.author.type === "Company") {
                                    navigate(`/companies/${post.author.details._id}`);
                                  } else {
                                    navigate(`/profile/${post.author.details._id}`);
                                  }
                                }}
                              >
                                {authorName}
                              </h4>
                              {post.author.type === "Company" && (
                                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                  Company
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {new Date(post.createdAt).toLocaleDateString()} · <Globe className="h-3 w-3" />
                            </p>
                          </div>
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Save post</DropdownMenuItem>
                              <DropdownMenuItem>Copy link</DropdownMenuItem>
                              <DropdownMenuItem>Hide post</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div 
                        className="mb-4 cursor-pointer hover:bg-secondary/30 p-2 -m-2 rounded transition-colors"
                        onClick={() => handlePostClick(post)}
                      >
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {post.content}
                        </p>
                      </div>

                      {post.media && post.media.length > 0 && (
                        <div 
                          className="mb-4 space-y-2 cursor-pointer"
                          onClick={() => handlePostClick(post)}
                        >
                          {post.media.map((m, i) => {
                            const mediaUrl = formatMediaUrl(m.url);
                            const mediaType = m.type || getMediaType(m.url);
                            
                            return (
                              <div key={i} className="rounded-lg overflow-hidden">
                                {mediaType === 'image' ? (
                                  <div>
                                    <img 
                                      src={mediaUrl} 
                                      alt={`Post media ${i + 1}`}
                                      className="w-full object-cover max-h-96"
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
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <FileText className="h-4 w-4" />
                                      <span>View document: {getFileName(m.url)}</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-muted-foreground py-3 border-t border-b border-border/50">
                        <div className="flex items-center gap-4">
                          <div onClick={(e) => e.stopPropagation()}>
                            <ReactionPickerCompact
                              currentReaction={userReactions[post._id]}
                              onReact={(type) => handleReaction(post._id, type)}
                              onRemoveReaction={() => handleRemoveReaction(post._id)}
                            />
                          </div>
                          
                          <div onClick={(e) => e.stopPropagation()}>
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
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary"
                            onClick={() => handlePostClick(post)}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Post
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{post.likesCount || 0} likes</span>
                        </div>
                      </div>

                      {showComments[post._id] && (
                        <div 
                          className="mt-4 space-y-4" 
                          data-post-id={post._id} 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex gap-2">
                            <UserAvatar 
                              name={userName} 
                              src={formatMediaUrl(userImage)}
                              size="sm" 
                            />
                            <div className="flex-1">
                              <div className="relative">
                                <Textarea
                                  placeholder={
                                    replyingTo[post._id] 
                                      ? "Write a reply..." 
                                      : "Write a comment..."
                                  }
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
                                {replyingTo[post._id] && (
                                  <div className="absolute -top-6 left-0 flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                    <span>Replying to a comment...</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-4 px-1 ml-2"
                                      onClick={() => cancelReply(post._id)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end mt-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleAddComment(post._id)}
                                  disabled={!commentInputs[post._id]?.trim()}
                                >
                                  {replyingTo[post._id] ? "Reply" : "Comment"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {(postComments[post._id] || []).map((comment) => renderComment(comment, post._id))}
                          </div>
                          
                          {(postComments[post._id]?.length === 0) && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                              No comments yet. Be the first to comment!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </GlassCard>
                );
              })
            )}
          </main>

          <aside className="hidden lg:block space-y-4">
            <GlassCard className="p-4">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                People you may know
              </h3>
              <div className="space-y-4">
                {suggestedUsers.length > 0 ? (
                  suggestedUsers.map((person) => (
                    <div key={person._id} className="flex items-start gap-3">
                      <UserAvatar 
                        name={`${person.firstName} ${person.lastName}`} 
                        src={formatMediaUrl(person.image)} 
                        size="md" 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate hover:text-primary cursor-pointer transition-colors">
                          {person.firstName} {person.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {person.headline || person.location || "Professional"}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={() => handleConnect(person._id)}
                        >
                          Connect
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No suggestions available</p>
                )}
                {suggestedCompanies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Companies</h4>
                    <div className="space-y-4">
                      {suggestedCompanies.map((company) => (
                        <div key={`company-${company._id}`} className="flex items-start gap-3">
                          <UserAvatar 
                            name={company.name} 
                            src={formatMediaUrl(company.logo)} 
                            size="md" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate hover:text-primary cursor-pointer transition-colors">
                                {company.name}
                              </p>
                              <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
                                Company
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {company.location || "Company"}
                              {company.description && (
                                <span className="block mt-1 truncate">{company.description}</span>
                              )}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 w-full"
                              onClick={() => handleFollowCompany(company._id)}
                            >
                              Follow
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {suggestedUsers.length === 0 && suggestedCompanies.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No suggestions available
                  </p>
                )}
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Job Insights
              </h3>
              <div className="space-y-3">
                <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate("/jobs")}>
                  View all jobs
                </Button>
              </div>
            </GlassCard>

            <div className="text-xs text-muted-foreground space-y-2 px-2">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <a href="#" className="hover:text-primary hover:underline">About</a>
                <a href="#" className="hover:text-primary hover:underline">Help Center</a>
                <a href="#" className="hover:text-primary hover:underline">Privacy</a>
                <a href="#" className="hover:text-primary hover:underline">Terms</a>
              </div>
              <p>© 2025-2026 Connectify</p>
            </div>
          </aside>
        </div>
      </PageContainer>

      {showPostModal && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <UserAvatar 
                  name={selectedPost.author.type === "User" 
                    ? `${selectedPost.author.details?.firstName || ''} ${selectedPost.author.details?.lastName || ''}`.trim()
                    : selectedPost.author.details?.name || "Company"
                  }
                  src={formatMediaUrl(
                    selectedPost.author.type === "User" 
                      ? selectedPost.author.details?.image 
                      : selectedPost.author.details?.logo
                  )}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {selectedPost.author.type === "User" 
                        ? `${selectedPost.author.details?.firstName || ''} ${selectedPost.author.details?.lastName || ''}`.trim()
                        : selectedPost.author.details?.name || "Company"
                      }
                    </h3>
                    {selectedPost.author.type === "Company" && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                        Company
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPost.createdAt).toLocaleDateString()} · <Globe className="h-3 w-3 inline" />
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-base whitespace-pre-line leading-relaxed">
                  {selectedPost.content}
                </p>
              </div>

              {selectedPost.media && selectedPost.media.length > 0 && (
                <div className="mb-6 space-y-4">
                  {selectedPost.media.map((m, i) => {
                    const mediaUrl = formatMediaUrl(m.url);
                    const mediaType = m.type || getMediaType(m.url);
                    
                    return (
                      <div key={i} className="overflow-hidden">
                        {mediaType === 'image' ? (
                          <img 
                            src={mediaUrl} 
                            alt={`Post media ${i + 1}`}
                            className="w-full max-h-[500px] object-contain bg-secondary"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                            }}
                          />
                        ) : mediaType === 'video' ? (
                          <video 
                            controls 
                            className="w-full max-h-[500px]"
                            poster="https://via.placeholder.com/800x600?text=Video+Thumbnail"
                          >
                            <source src={mediaUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <div className="bg-secondary p-6">
                            <a 
                              href={mediaUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 text-primary hover:underline text-lg"
                            >
                              <FileText className="h-6 w-6" />
                              <span>View document: {getFileName(m.url)}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between py-4 border-t border-b border-border">
                <div className="flex items-center gap-4">
                  <ReactionPickerCompact
                    currentReaction={userReactions[selectedPost._id]}
                    onReact={(type) => handleReaction(selectedPost._id, type)}
                    onRemoveReaction={() => handleRemoveReaction(selectedPost._id)}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{selectedPost.commentsCount || 0} Comments</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{selectedPost.likesCount || 0} Likes</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-4">Comments</h4>
                
                <div className="flex gap-3 mb-6">
                  <UserAvatar 
                    name={userName} 
                    src={formatMediaUrl(userImage)}
                    size="sm" 
                  />
                  <div className="flex-1">
                    <div className="relative">
                      <Textarea
                        placeholder={modalReplyingTo ? "Write a reply..." : "Write a comment..."}
                        className="min-h-[80px] resize-none border border-input rounded-lg text-base"
                        value={modalCommentInput}
                        onChange={(e) => setModalCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddModalComment();
                          }
                        }}
                      />
                      {modalReplyingTo && (
                        <div className="absolute -top-6 left-0 flex items-center text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                          <span>Replying to a comment...</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 px-1 ml-2"
                            onClick={cancelModalReply}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button 
                        size="sm" 
                        onClick={handleAddModalComment}
                        disabled={!modalCommentInput.trim()}
                      >
                        {modalReplyingTo ? "Reply" : "Comment"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {modalComments.length > 0 ? (
                    modalComments.map((comment) => renderModalComment(comment))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}