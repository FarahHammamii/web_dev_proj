import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Sparkles,
  FileText,
  Megaphone,
  RefreshCw,
  Trash2,
  MessageCircle,
  Send,
  Plus,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { api, Post, ReactionType, Comment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatMediaUrl, getMediaType } from "@/lib/media";
import { UserAvatar } from "@/components/UserAvatar";

export default function CompanyPosts() {
  const { companyId: paramId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, company: myCompany, isAuthenticated } = useAuth() as any;
  const { unreadCount } = useUnreadNotifications();
  const isMyCompanyRoute = location.pathname.includes("/company/posts") || location.pathname === "/my-company";
  const targetCompanyId = paramId || (isMyCompanyRoute ? myCompany?._id : null);

 
  const canCreate = isAuthenticated && (isMyCompanyRoute || (myCompany && paramId === myCompany._id));

  
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [postType, setPostType] = useState<"post" | "announcement">("post");

  const [userReactions, setUserReactions] = useState<Record<string, ReactionType | null>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
    
      if (!targetCompanyId) {
        return; 
      }

      try {
        setIsLoading(true);
    
        if (targetCompanyId === myCompany?._id) {
           setCurrentCompany(myCompany);
        } else {
           try {
             const compData = await api.getCompanyProfile();
             setCurrentCompany(compData);
           } catch (e) { console.error("Profile load err", e); }
        }

        await fetchCompanyPosts(targetCompanyId);
        
      } catch (error) {
        console.error("Error loading feed:", error);
        toast.error("Failed to load updates");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [targetCompanyId, myCompany]); 
  const fetchCompanyPosts = async (id: string) => {
   
    if (!id) return;

    try {
      const response = await api.getCompanyPosts(id, 1, 100);
      if (response.success && response.data?.posts) {
        setPosts(response.data.posts);
        
    
        const reactions: Record<string, ReactionType | null> = {};
        await Promise.all(response.data.posts.map(async (p) => {
            try {
                const r = await api.getUserReaction("Post", p._id);
                reactions[p._id] = r.success ? r.data.reactionType : null;
            } catch { reactions[p._id] = null; }
        }));
        setUserReactions(reactions);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !targetCompanyId) return;
    
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      formData.append("useAI", isAIEnabled.toString());
   
      formData.append("authorType", "Company");
      formData.append("companyId", targetCompanyId);
      
      if (postType === "announcement") {
        formData.append("isAnnouncement", "true");
        formData.append("type", "announcement");
      }

      const response = await api.createPost(formData);
      
      if (response.success) {
     
        const createdPost = response.data as Post;
        const displayPost: Post = {
            ...createdPost,
            likesCount: 0,
            commentsCount: 0,
            author: {
                type: 'Company',
                details: {
                    _id: targetCompanyId,
                    name: currentCompany?.name || "Company",
                    logo: currentCompany?.logo,
                }
            } as any
        };

        setPosts(prev => [displayPost, ...prev]);
        setPostContent("");
        setIsAIEnabled(false);
        setIsDialogOpen(false);
        toast.success("Update published!");
      }
    } catch (error: any) {
      console.error("Creation error:", error);
      toast.error("Failed to post update");
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
        await api.deletePost(postId);
        setPosts(prev => prev.filter(p => p._id !== postId));
        toast.success("Post deleted");
    } catch (e) { toast.error("Failed to delete"); }
  };

  const handleReaction = async (postId: string, type: ReactionType) => {
    try {
        await api.addReaction("Post", postId, type);
        setUserReactions(prev => ({...prev, [postId]: type}));
        setPosts(prev => prev.map(p => p._id === postId ? {...p, likesCount: (p.likesCount || 0) + 1} : p));
    } catch (e) { toast.error("Action failed"); }
  };

  const handleRemoveReaction = async (postId: string) => {
    try {
        await api.removeReaction("Post", postId);
        setUserReactions(prev => ({...prev, [postId]: null}));
        setPosts(prev => prev.map(p => p._id === postId ? {...p, likesCount: Math.max(0, (p.likesCount || 0) - 1)} : p));
    } catch (e) { toast.error("Action failed"); }
  };

  const toggleComments = async (postId: string) => {
    const show = !showComments[postId];
    setShowComments(prev => ({...prev, [postId]: show}));
    if (show && !postComments[postId]) {
        const res = await api.getPostComments(postId);
        setPostComments(prev => ({...prev, [postId]: res.data?.comments || []}));
    }
  };

  const handleAddComment = async (postId: string) => {
    const txt = commentInputs[postId];
    if(!txt?.trim()) return;
    try {
        const res = await api.createComment(postId, { content: txt });
        if(res.success) {
            setPostComments(prev => ({...prev, [postId]: [res.data, ...(prev[postId]||[])]}));
            setCommentInputs(prev => ({...prev, [postId]: ""}));
            setPosts(prev => prev.map(p => p._id === postId ? {...p, commentsCount: (p.commentsCount||0)+1} : p));
        }
    } catch (e) { toast.error("Failed to comment"); }
  };

  const navbarUser = user ? {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: formatMediaUrl(user.image),
    role: "user" as const
  } : undefined;

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                {currentCompany?.logo ? (
                    <img src={formatMediaUrl(currentCompany.logo)} className="h-16 w-16 rounded-lg object-cover border" />
                ) : (
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="h-8 w-8" />
                    </div>
                )}
                <div>
                    <h1 className="font-display text-3xl font-bold">{currentCompany?.name || "Company Updates"}</h1>
                    <p className="text-muted-foreground">Recent announcements and activities</p>
                </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => targetCompanyId && fetchCompanyPosts(targetCompanyId)} 
                disabled={isLoading || !targetCompanyId}
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                {canCreate && (
                    <DialogTrigger asChild>
                    <Button variant="gradient">
                        <Plus className="h-4 w-4 mr-2" /> Create Update
                    </Button>
                    </DialogTrigger>
                )}
                
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="font-display">Create Company Update</DialogTitle>
                    <DialogDescription>
                      Share news with your followers as <strong>{currentCompany?.name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="flex gap-3">
                      <Button 
                        variant={postType === "post" ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setPostType("post")}
                      >
                        <FileText className="h-4 w-4 mr-2" /> Post
                      </Button>
                      
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <Label htmlFor="ai" className="cursor-pointer">AI Assistant</Label>
                        </div>
                        <Switch id="ai" checked={isAIEnabled} onCheckedChange={setIsAIEnabled} />
                    </div>

                    <Textarea
                      placeholder={isAIEnabled ? "Describe the announcement (AI will write it)..." : "Write your update..."}
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="min-h-[150px] resize-none focus-visible:ring-1"
                    />

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreatePost} disabled={isPosting || !postContent.trim()}>
                            {isPosting ? "Publishing..." : "Publish"}
                        </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading && !posts.length ? (
             <div className="space-y-4">
                 {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
             </div>
          ) : posts.length === 0 ? (
             <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
                 <p className="text-muted-foreground">No updates posted yet.</p>
             </div>
          ) : (
             <div className="space-y-6">
                 {posts.map(post => {
                     
                     return (
                         <GlassCard key={post._id} className={`p-0 overflow-hidden ${ 'border-primary/20' }`}>
                             <div className="p-6">
                                 <div className="flex justify-between items-start mb-4">
                                     <div className="flex items-center gap-3">
                                         <UserAvatar 
                                            name={post.author?.details?.name || currentCompany?.name} 
                                            src={formatMediaUrl(post.author?.details?.logo || currentCompany?.logo)} 
                                            className="rounded-md"
                                         />
                                         <div>
                                             <div className="flex items-center gap-2">
                                                 <span className="font-semibold">{post.author?.details?.name || currentCompany?.name || "Company"}</span>
                                                 {<Badge variant="destructive" className="text-[10px] h-5 px-1.5">Announcement</Badge>}
                                             </div>
                                             <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                                         </div>
                                     </div>
                                     {canCreate && (
                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeletePost(post._id)}>
                                             <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                         </Button>
                                     )}
                                 </div>

                                 <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                                 
                                 {post.media && post.media.length > 0 && (
                                    <div className="mt-4 rounded-lg overflow-hidden border bg-black/5">
                                        {post.media.map((m, i) => (
                                            getMediaType(m.url) === 'image' 
                                            ? <img key={i} src={formatMediaUrl(m.url)} className="w-full max-h-96 object-contain" />
                                            : <a key={i} href={formatMediaUrl(m.url)} target="_blank" className="p-4 block text-primary underline">View Attachment</a>
                                        ))}
                                    </div>
                                 )}
                             </div>

                             <div className="bg-muted/30 px-6 py-3 flex items-center justify-between border-t border-border/50">
                                 <div className="flex items-center gap-2">
                                     <ReactionPickerCompact 
                                        currentReaction={userReactions[post._id]} 
                                        onSelect={(t) => handleReaction(post._id, t)}
                                        onRemove={() => handleRemoveReaction(post._id)}
                                     />
                                     <span className="text-xs text-muted-foreground">{post.likesCount || 0}</span>
                                 </div>
                                 <Button variant="ghost" size="sm" className="h-8" onClick={() => toggleComments(post._id)}>
                                     <MessageCircle className="h-4 w-4 mr-2" /> {post.commentsCount || 0}
                                 </Button>
                             </div>

                             {showComments[post._id] && (
                                 <div className="bg-muted/10 p-4 border-t space-y-4">
                                     <div className="flex gap-2">
                                         <Textarea 
                                            value={commentInputs[post._id] || ""} 
                                            onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                                            placeholder="Write a comment..." 
                                            className="h-10 min-h-[40px] py-2 resize-none text-sm"
                                         />
                                         <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => handleAddComment(post._id)}>
                                             <Send className="h-4 w-4" />
                                         </Button>
                                     </div>
                                     <div className="space-y-3">
                                         {(postComments[post._id] || []).map(comment => {
                                             const cName = comment.author?.details?.name || comment.author?.details?.firstName || "User";
                                             const cImg = formatMediaUrl(comment.author?.details?.image);
                                             return (
                                                <div key={comment._id} className="flex gap-3 text-sm">
                                                    <UserAvatar name={cName} src={cImg} size="sm" />
                                                    <div className="bg-secondary/50 p-3 rounded-lg flex-1">
                                                        <div className="font-semibold text-xs mb-1">{cName}</div>
                                                        <p>{comment.content}</p>
                                                    </div>
                                                </div>
                                             )
                                         })}
                                     </div>
                                 </div>
                             )}
                         </GlassCard>
                     );
                 })}
             </div>
          )}
        </div>
      </PageContainer>
    </div>
  );
}