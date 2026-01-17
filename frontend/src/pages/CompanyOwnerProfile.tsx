import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { ReactionPicker, ReactionPickerCompact } from "@/components/ReactionPicker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  MessageCircle,
  Share2,
  MoreHorizontal,
  X,
  Image as ImageIcon,
  Video,
  Send,
  Sparkles,
  Upload,
  Camera,
  ArrowLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Reply,
} from "lucide-react";
import { api, Company, Job, Post, Comment, ReactionType, ReactionStats, User } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMediaUrl, getMediaType, getFileName } from "@/lib/media";

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
  showReplies?: boolean;
  repliesLoading?: boolean;
  hasReplies?: boolean;
  replyCount?: number;
}

export default function CompanyOwnerProfile() {
  const { id: routeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company: authCompany, user, isAuthenticated, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postFileInputRef = useRef<HTMLInputElement>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("about");
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [followerGrowth, setFollowerGrowth] = useState<number>(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  

  const [postContent, setPostContent] = useState("");
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  
 
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [updatingCompany, setUpdatingCompany] = useState(false);
  

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

  useEffect(() => {
    if (isLoading) return;
    
    if (!routeId && !authCompany && !isAuthenticated) {
    console.log("No company found, redirecting to feed");
    navigate("/company");
    return;
  }
    
    if (!routeId && authCompany) {
      console.log("Using authenticated company:", authCompany._id);
      fetchCompanyProfile(authCompany._id);
      fetchCompanyPosts(1, authCompany._id);
      fetchCompanyJobs(); 
    } else if (routeId) {
      fetchCompanyProfile(routeId);
      fetchCompanyPosts(1, routeId);
      fetchCompanyJobs();
    }
  }, [routeId, authCompany, navigate, isLoading]);
  if (isLoading) {
  return <div className="flex justify-center p-8">Loading...</div>;
}
  const fetchCompanyProfile = async (companyId?: string) => {
    try {
      let companyData = null;
      
      if (authCompany && (!routeId || routeId === authCompany._id)) {
        try {
          const res = await api.getCompanyProfile();
          companyData = res;
        } catch (error) {
          console.log("Owner endpoint failed, trying public endpoint:", error);
        }
      }
      
      if (!companyData && companyId) {
        companyData = await api.getCompanyById(companyId);
      }
      
      if (!companyData && authCompany) {
        companyData = authCompany;
      }
      
      setCompany(companyData as any);
      
      // Populate edit form
      if (companyData) {
        setEditName(companyData.name || "");
        setEditDescription(companyData.description || "");
        setEditLocation(companyData.location || "");
        setEditWebsite(companyData.website || "");
        setEditEmail(companyData.email || "");
      }
      
    } catch (error) {
      console.error("Error fetching company profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyJobs = async (companyId?: string) => {
  const cid = companyId || routeId || authCompany?._id;
  try {
    const res = await api.getCompanyJobsByCompanyId(cid!);
    
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
  const fetchCompanyPosts = async (page = 1, companyId?: string) => {
    const cid = companyId || routeId || authCompany?._id;
    if (!cid || postsLoading) return;

    setPostsLoading(true);
    try {
      const response = await api.getCompanyPosts(cid, page, 10);

      if (response.success && response.data && response.data.posts) {
        const postsArray = response.data.posts;

        const transformedPosts = postsArray.map(post => ({
          ...post,
          author: post.author || {
            id: post.author?.details?._id || company?._id,
            type: "Company",
            details: {
              _id: company?._id,
              name: company?.name,
              logo: company?.logo
            }
          },
          authorType: post.authorType || "Company"
        }));

        if (page === 1) {
          setPosts(transformedPosts);
          
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
        } else {
          setPosts(prev => [...prev, ...transformedPosts]);
        }

        const pagination = response.data.pagination;
        setHasMorePosts(page < pagination.pages);
        setPostPage(page);
        setTotalPosts(pagination.total);
      }
    } catch (error) {
      console.error("Error fetching company posts:", error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
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
      
      setPostComments(prev => ({
        ...prev,
        [postId]: commentsWithReplies
      }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
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

  const handleCreatePost = async () => {
    if (!postContent.trim() && mediaFiles.length === 0) {
      toast.error("Please add content or media to create a post.");
      return;
    }
    
    setCreatingPost(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("useAI", showAIHelper.toString());
      
      mediaFiles.forEach((file) => {
        formData.append("media", file);
      });

      const res = await api.createPost(formData);
      if (res && res.data) {
        const newPost: Post = {
          ...res.data,
          author: res.data.author || {
            id: company?._id,
            type: "Company",
            details: {
              _id: company?._id,
              name: company?.name,
              logo: company?.logo
            }
          },
          authorType: res.data.authorType || "Company"
        };
        
        setPosts(prev => [newPost, ...prev]);
        setPostContent("");
        setShowAIHelper(false);
        setMediaFiles([]);
        setMediaPreviews([]);
        toast.success("Post created successfully!");
        setTotalPosts(prev => prev + 1);
      }
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast.error(error.message || "Failed to create post");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authCompany) {
      toast.error("You must be logged in as a company to update profile");
      return;
    }
    
    setUpdatingCompany(true);
    try {
      const data = new FormData();
      data.append("name", editName);
      data.append("description", editDescription || "");
      data.append("location", editLocation || "");
      data.append("website", editWebsite || "");
      data.append("email", editEmail || "");
      if (editLogoFile) data.append("logo", editLogoFile);
      
      const targetId = authCompany._id;
      const res = await api.updateCompanyProfile(targetId, data);
      
      if (res && (res.company || res.data)) {
        const updatedCompany = res.company || res.data;
        setCompany(updatedCompany);
        toast.success("Company profile updated");
        setShowEdit(false);
        setEditLogoFile(null);
        setEditLogoPreview(null);
        
        if (updatedCompany._id) {
          fetchCompanyPosts(1, updatedCompany._id);
        }
      }
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err?.message || "Failed to update company profile");
    } finally {
      setUpdatingCompany(false);
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

      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1
        } : null);
      }

      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
      setReplyingTo(prev => ({ ...prev, [postId]: null }));
      
      toast.success(parentCommentId ? "Reply added!" : "Comment added!");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast.error(error.message || "Failed to add comment");
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

  const handleEditLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setEditLogoFile(file);
    setEditLogoPreview(URL.createObjectURL(file));
  };
  

  const removeEditLogo = () => {
    setEditLogoFile(null);
    setEditLogoPreview(null);
    if (editLogoInputRef.current) {
      editLogoInputRef.current.value = "";
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
            
            return { ...post, reactions: { ...stats }, likesCount: (post.likesCount || 0) + 1 };
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
          
          return { ...prev, reactions: { ...stats }, likesCount: (prev.likesCount || 0) + 1 };
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
              return { ...post, reactions: { ...stats }, likesCount: Math.max(0, (post.likesCount || 0) - 1) };
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
            return { ...prev, reactions: { ...stats }, likesCount: Math.max(0, (prev.likesCount || 0) - 1) };
          });
        }
      }
    } catch (error) {
      console.error("Error removing reaction:", error);
      toast.error("Failed to remove reaction");
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setShowPostModal(true);
    setModalCommentInput("");
    setModalReplyingTo(null);
 
    fetchModalComments(post._id);
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
              return { ...comment, replies: repliesWithMeta, repliesLoading: false };
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
      console.error('Error fetching comment replies:', error);
      setPostComments(prev => {
        const clearLoading = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, repliesLoading: false };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: clearLoading(comment.replies)
              };
            }
            return comment;
          });
        };

        return {
          ...prev,
          [postId]: clearLoading(prev[postId] || [])
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

      setModalComments(prev => {
        const updateCommentWithReplies = (comments: CommentWithReplies[]): CommentWithReplies[] => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, replies: repliesWithMeta, repliesLoading: false };
            } else if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentWithReplies(comment.replies)
              };
            }
            return comment;
          });
        };

        return updateCommentWithReplies(prev);
      });
    } catch (error) {
      console.error('Error fetching modal comment replies:', error);
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

            return { ...comment, showReplies: shouldShow };
          } else if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: updateCommentRecursive(comment.replies) };
          }
          return comment;
        });
      };

      return { ...prev, [postId]: updateCommentRecursive(comments) };
    });
  };
  const calculateFollowerGrowth = () => {
  const followerCount = company.followers?.length || 0;
  const postCount = posts.length;
  const jobCount = jobs.filter(job => job.isActive).length;
  
 
  let growth = 5; 
  

  growth += Math.min(postCount * 0.5, 10); 
  growth += Math.min(jobCount * 1, 5); 
  

  if (followerCount > 100) growth *= 0.8;
  if (followerCount > 500) growth *= 0.6;
  
  setFollowerGrowth(Math.round(Math.max(1, growth)));
};
useEffect(() => {
  if (company && jobs.length > 0 && posts.length > 0) {
    calculateFollowerGrowth();
  }
}, [company, jobs, posts]);


 
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

            return { ...comment, showReplies: shouldShow };
          } else if (comment.replies && comment.replies.length > 0) {
            return { ...comment, replies: updateCommentRecursive(comment.replies) };
          }
          return comment;
        });
      };

      setModalComments(prev => updateCommentRecursive(prev));
    } catch (error) {
      console.error("Error toggling modal replies:", error);
    }
  };

 
  const handleReply = (postId: string, commentId: string, commentAuthorName?: string) => {
    setReplyingTo(prev => ({ ...prev, [postId]: commentId }));
    setCommentInputs(prev => ({ ...prev, [postId]: `@${commentAuthorName || 'User'} ` }));

    setTimeout(() => {
      const textarea = document.querySelector(`[data-post-id="${postId}"] textarea`);
      if (textarea) (textarea as HTMLTextAreaElement).focus();
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

  
  const renderComment = (comment: CommentWithReplies, postId: string, depth = 0) => {
    const authorName = comment.author.type === "User"
      ? `${comment.author.details?.firstName || ''} ${comment.author.details?.lastName || ''}`.trim()
      : comment.author.details?.name || "Company User";

    const authorImage = comment.author.type === "User"
  ? formatMediaUrl(comment.author.details?.image)  
  : formatMediaUrl(comment.author.details?.logo);  


    const isReplying = replyingTo[postId] === comment._id;
    const hasReplies = comment.hasReplies || (comment.replies && comment.replies.length > 0);
    const showRepliesButton = comment.hasReplies || (comment.replies !== undefined && comment.replies.length > 0) || depth === 0;

    return (
      <div key={comment._id} className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <UserAvatar name={authorName} src={authorImage} size="sm" />
        <div className="flex-1">
          <div className={`bg-secondary/50 rounded-lg p-3 ${isReplying ? 'ring-2 ring-primary/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
                {comment.author.type === "Company" && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Company</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => handleReply(postId, comment._id, authorName)}>
              <Reply className="h-3 w-3 mr-1" /> Reply
            </Button>

            {showRepliesButton && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => toggleReplies(postId, comment._id)} disabled={comment.repliesLoading}>
                {comment.repliesLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    Loading...
                  </span>
                ) : (
                  <>
                    {comment.showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" /> Hide {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" /> Show {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    )}
                  </>
                )}
              </Button>
            )}

            {isReplying && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => cancelReply(postId)}>Cancel</Button>
            )}
          </div>

          {comment.showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">{comment.replies.map(reply => renderComment(reply, postId, depth + 1))}</div>
          )}
        </div>
      </div>
    );
  };

  const closeModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
    setModalComments([]);
    setModalCommentInput("");
    setModalReplyingTo(null);
  };

  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleViewAllPosts = () => {
    const cid = routeId || company?._id;
    if (cid) navigate(`/companies/${cid}/posts`);
  };

  const handleViewAllJobs = () => {
    setActiveTab("jobs");
  };

  const handleViewAllPeople = () => {
    setActiveTab("people");
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `http://localhost:8081/${path.replace(/\\/g, '/')}`;
  };

 
  const getAuthorInfo = (post: Post) => {
    if (post.author && typeof post.author === 'object' && 'details' in post.author) {
      const authorDetails = post.author.details;
      const authorType = post.author.type || post.authorType || "User";
      
      const name = authorType === "Company" 
        ? authorDetails.name || "Company"
        : `${authorDetails.firstName || ''} ${authorDetails.lastName || ''}`.trim() || "User";
      
      const image = authorType === "Company" 
        ? authorDetails.logo 
        : authorDetails.image;
      
      return { name, image, type: authorType };
    }
    
    const authorType = post.authorType || "User";
    const name = authorType === "Company"
      ? (post.author as any).name || "Company"
      : `${(post.author as any).firstName || ''} ${(post.author as any).lastName || ''}`.trim() || "User";
    
    const image = authorType === "Company"
      ? (post.author as any).logo
      : (post.author as any).image;
    
    return { name, image, type: authorType };
  };

  const renderPostCard = (post: Post) => {
    const authorInfo = getAuthorInfo(post);
    const authorName = authorInfo.name;
    const authorImage = formatMediaUrl(company.logo);
    const authorType = authorInfo.type;
    
    const userReaction = userReactions[post._id];

    return (
      <GlassCard 
        key={post._id} 
        className="overflow-hidden animate-fade-in hover:shadow-lg transition-shadow"
      >
        <div className="p-4">
       
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-3">
              <UserAvatar name={authorName} src={authorImage} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold hover:text-primary cursor-pointer transition-colors">
                    {authorName}
                  </h4>
                  {authorType === "Company" && (
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      Company
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} · 
                  <Globe className="h-3 w-3" />
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
poster="https://placehold.co/600x400/1a1a1a/ffffff?text=Video+Thumbnail"                        >
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
                  currentReaction={userReaction}
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
              <span>{post.reactions?.total || 0} reactions</span>
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
                  name={user ? `${user.firstName} ${user.lastName}` : "User"} 
                  src={formatMediaUrl(user?.image)}
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
                          onClick={() => setReplyingTo(prev => ({ ...prev, [post._id]: null }))}
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
    const showRepliesButton = comment.hasReplies || (comment.replies !== undefined && comment.replies.length > 0) || depth === 0;

    return (
      <div key={comment._id} className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''}`}>
        <UserAvatar name={authorName} src={authorImage} size="sm" />
        <div className="flex-1">
          <div className={`bg-secondary/50 p-3 ${isReplying ? 'ring-2 ring-primary/50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
                {comment.author.type === "Company" && (
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Company</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => handleModalReply(comment._id, authorName)}>
              <Reply className="h-3 w-3 mr-1" /> Reply
            </Button>

            {showRepliesButton && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={() => toggleModalReplies(comment._id)} disabled={comment.repliesLoading}>
                {comment.repliesLoading ? (
                  <span className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                    Loading...
                  </span>
                ) : (
                  <>
                    {comment.showReplies ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" /> Hide {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" /> Show {comment.replyCount || 0} {comment.replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    )}
                  </>
                )}
              </Button>
            )}

            {isReplying && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6" onClick={cancelModalReply}>Cancel</Button>
            )}
          </div>

          {comment.showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 space-y-2">{comment.replies.map(reply => renderModalComment(reply, depth + 1))}</div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
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

  const followerCount = company.followers?.length || 0;
  const activeJobsCount = jobs.filter(job => job.isActive).length;
  const totalJobsCount = jobs.length;
  const engagementRate = followerCount > 0 
  ? Math.round((posts.length * 10) / Math.max(followerCount, 1)) 
  : 0;

  const isOwner = authCompany && authCompany._id === (routeId || authCompany._id);

  return (
    <div className="min-h-screen bg-background">
      
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
                        {isOwner ? (
                          <>
                            <Button variant="outline" onClick={() => setShowEdit(true)}>
                              Edit Profile
                            </Button>
                            <Button 
                              variant="gradient" 
                              onClick={() => { 
                                setActiveTab('posts'); 
                                setTimeout(() => {
                                  const el = document.querySelector('[data-post-composer] textarea');
                                  if (el) {
                                    (el as HTMLTextAreaElement).focus();
                                  }
                                }, 150); 
                              }}
                            >
                              Create Post
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant={isFollowing ? "outline" : "gradient"} 
                           
                            disabled={followLoading}
                          >
                            <FollowIcon className="h-4 w-4 mr-2" />
                            {isFollowing ? "Following" : "Follow"}
                          </Button>
                        )}
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
                        <p className="text-sm text-muted-foreground">Engagement</p>
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
                        <GlassCard key={job._id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleJobClick(job._id)}>
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
                  {isOwner && (
                    <GlassCard className="p-4" data-post-composer>
                      <div className="flex gap-3">
                        <UserAvatar 
                          name={company.name} 
                          src={formatMediaUrl(company.logo)}
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
                                onClick={() => postFileInputRef.current?.click()}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Media
                              </Button>
                              <input
                                ref={postFileInputRef}
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
                                disabled={(!postContent.trim() && mediaFiles.length === 0) || creatingPost}
                                onClick={handleCreatePost}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                {creatingPost ? "Posting..." : "Post"}
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
                      {posts.map(renderPostCard)}
                      
                      {posts.length > 0 && hasMorePosts && (
                        <div className="text-center pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => fetchCompanyPosts(postPage + 1, routeId || authCompany?._id)}
                            disabled={postsLoading}
                          >
                            {postsLoading ? "Loading..." : "Load More Posts"}
                          </Button>
                        </div>
                      )}
                      
                      {posts.length > 0 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleViewAllPosts}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View All Posts
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "people" && (
                <GlassCard className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">Followers</h2>
                  {(!company.followers || company.followers.length === 0) ? (
                    <div className="text-center py-8">
                      <Users2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No followers yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {company.followers.slice(0, 6).map((follower) => (
                        <div key={follower._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate(`/company/candidates/${follower._id}?viewAs=follower`)}>
                          <Avatar>
                            <AvatarImage src={getImageUrl(follower.image )} />
                            <AvatarFallback>
                              {follower.firstName?.[0]}{follower.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">
                              {follower.firstName} {follower.lastName} 
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">{follower.headline}</p>
                          </div>
                          
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {company.followers && company.followers.length > 6 && (
                    <div className="mt-6 text-center">
                      <Button variant="outline" onClick={handleViewAllPeople}>
                        View All {followerCount} Followers
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </GlassCard>
              )}
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
                    <span className={`text-sm font-semibold ${followerGrowth > 0 ? 'text-success' : 'text-destructive'}`}>
        {followerGrowth > 0 ? '+' : ''}{followerGrowth} %
      </span>
                  </div>
                  
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-display font-semibold mb-3">Open Positions</h3>
                <div className="space-y-3">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => handleJobClick(job._id)}>
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
                    <Button variant="ghost" size="sm" className="w-full text-primary" onClick={handleViewAllJobs}>
                      View all {totalJobsCount} jobs
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </GlassCard>
            </aside>
          </div>
        </div>

        {showEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
            <div 
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background shadow-2xl rounded-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm"
                onClick={() => {
                  setShowEdit(false);
                  setEditLogoFile(null);
                  setEditLogoPreview(null);
                }}
              >
                <X className="h-5 w-5" />
              </Button>

          
              <div className="p-6">
                <h3 className="font-display text-2xl font-semibold mb-6">Edit Company Profile</h3>
                
                <form onSubmit={handleUpdateCompany} className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full bg-secondary/50 border-4 border-background overflow-hidden flex items-center justify-center">
                        {editLogoPreview ? (
                          <img 
                            src={editLogoPreview} 
                            alt="New logo preview"
                            className="w-full h-full object-cover"
                          />
                        ) : company.logo ? (
                          <img 
                            src={getImageUrl(company.logo) || ""}
                            alt={company.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-16 w-16 text-muted-foreground" />
                        )}
                      </div>
                      
                   
                      <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="h-8 w-8 text-white" />
                      </div>
                      
                      <input
                        ref={editLogoInputRef}
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleEditLogoUpload}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => editLogoInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Logo
                      </Button>
                      
                      {editLogoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeEditLogo}
                          className="text-destructive hover:text-destructive gap-2"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground text-center">
                      Recommended: 400x400px, PNG or JPG
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editName">Company Name *</Label>
                        <Input 
                          id="editName"
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value)} 
                          required 
                          placeholder="Enter company name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="editEmail">Email</Label>
                        <Input 
                          id="editEmail"
                          value={editEmail} 
                          onChange={(e) => setEditEmail(e.target.value)} 
                          type="email"
                          placeholder="company@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="editDescription">Description</Label>
                      <Textarea 
                        id="editDescription"
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)} 
                        placeholder="Tell us about your company..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editLocation">Location</Label>
                        <Input 
                          id="editLocation"
                          value={editLocation} 
                          onChange={(e) => setEditLocation(e.target.value)} 
                          placeholder="City, Country"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="editWebsite">Website</Label>
                        <Input 
                          id="editWebsite"
                          value={editWebsite} 
                          onChange={(e) => setEditWebsite(e.target.value)} 
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEdit(false);
                        setEditLogoFile(null);
                        setEditLogoPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updatingCompany || !editName.trim()}
                      className="gap-2"
                    >
                      {updatingCompany ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

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
                    name={getAuthorInfo(selectedPost).name}
                    src={formatMediaUrl(getAuthorInfo(selectedPost).image)}
                    size="md"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {getAuthorInfo(selectedPost).name}
                      </h3>
                      {getAuthorInfo(selectedPost).type === "Company" && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Company
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })} · <Globe className="h-3 w-3 inline" />
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
                      <span>{selectedPost.reactions?.total || 0} Reactions</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-4">Comments</h4>
                  
                  <div className="flex gap-3 mb-6">
                    <UserAvatar 
                      name={user ? `${user.firstName} ${user.lastName}` : "User"} 
                      src={formatMediaUrl(user?.image)}
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
                              onClick={() => setModalReplyingTo(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button 
                          size="sm" 
                          
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
      </PageContainer>
    </div>
  );
}