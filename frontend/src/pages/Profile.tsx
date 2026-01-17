import { useState, useEffect } from "react";
import { MainNav } from "@/components/MainNav";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMediaUrl } from "@/lib/media";
import { Trash2 } from "lucide-react"; 


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { api, Experience, Project, Skill, Certificate } from "@/lib/api"; 
import {
  Loader2,
  Edit2,
  MapPin,
  Mail,
  MoreHorizontal,
  Users,
  Eye,
  TrendingUp,
  Folder,
  Briefcase,
  Award,
  Plus,
  Globe,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { toast } from "sonner";

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

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split('T')[0];
  } catch (e) {
    return "";
  }
};

export default function ProfilePage() {
  const { user, isLoading, error, refetchUser } = useProfile();
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    profileViews: 0,
    postImpressions: 0,
    connections: 0
  });
  
  const [isExpOpen, setIsExpOpen] = useState(false);
  const [isProjOpen, setIsProjOpen] = useState(false);
  const [isSkillOpen, setIsSkillOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);

  const [expForm, setExpForm] = useState<Partial<Experience>>({ current: false });
  const [projForm, setProjForm] = useState<Partial<Project>>({});
  const [skillForm, setSkillForm] = useState<Partial<Skill>>({ level: "Intermediate" });
  const [certForm, setCertForm] = useState<Partial<Certificate>>({});


useEffect(() => {
  const loadStats = async () => {
    if (user && user._id) {
      try {
       
        const connections = await api.getMyConnections();
        
       
        const postsResponse = await api.getUserPosts(user._id, 1, 100);
        const userPosts = postsResponse?.data?.posts || [];
       
        const postImpressions = userPosts.reduce((total: number, post: any) => {
          return total + (post.likesCount || 0) + (post.commentsCount || 0);
        }, 0);
        
        setStats({
          profileViews: userPosts.length * 5, 
          postImpressions: postImpressions,
          connections: Array.isArray(connections) ? connections.length : 0
        });
      } catch (error) {
        console.error("Error loading stats:", error);
     
        setStats({
          profileViews: 0,
          postImpressions: 0,
          connections: user.connections?.length || 0
        });
      }
    }
  };
  
  if (user && user._id) {
    loadStats();
  }
}, [user]);

 
  const openAddExperience = () => {
    setEditingExpId(null);
    setExpForm({ current: false });
    setIsExpOpen(true);
  };

  const openEditExperience = (exp: any) => {
    setEditingExpId(exp._id);
    setExpForm({
      ...exp,
      startDate: formatDateForInput(exp.startDate),
      endDate: formatDateForInput(exp.endDate),
    });
    setIsExpOpen(true);
  };

  const handleSaveExperience = async () => {
    try {
      setIsSubmitting(true);
     
      if (!expForm.title || !expForm.company || !expForm.startDate) {
        toast.error("Please fill in required fields (Title, Company, Start Date)");
        return;
      }
      
    
      if (expForm.endDate && !expForm.current) {
        const startDate = new Date(expForm.startDate);
        const endDate = new Date(expForm.endDate);
        
        if (endDate < startDate) {
          toast.error("End date cannot be before start date");
          return;
        }
      }
      
    
      const formData = { ...expForm };
      if (formData.current) {
        formData.endDate = undefined;
      }
      
      if (editingExpId) {
        await api.updateExperience(editingExpId, formData);
        toast.success("Experience updated successfully!");
      } else {
        await api.addExperience(formData as any);
        toast.success("Experience added successfully!");
      }

      await refetchUser();
      setIsExpOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save experience");
    } finally {
      setIsSubmitting(false);
    }
  };


  const openAddProject = () => {
    setEditingProjId(null);
    setProjForm({});
    setIsProjOpen(true);
  };

  const openEditProject = (proj: any) => {
    setEditingProjId(proj._id);
    setProjForm({
      ...proj,
      startDate: formatDateForInput(proj.startDate),
      endDate: formatDateForInput(proj.endDate),
    });
    setIsProjOpen(true);
  };

  const handleSaveProject = async () => {
    try {
      setIsSubmitting(true);
      if (!projForm.title) {
        toast.error("Project name (Title) is required");
        return;
      }

      if (projForm.startDate && projForm.endDate) {
        const startDate = new Date(projForm.startDate);
        const endDate = new Date(projForm.endDate);
        
        if (endDate < startDate) {
          toast.error("End date cannot be before start date");
          return;
        }
      }

      const payload = {
        ...projForm, 
        technologies: projForm.technologies || [],
      };

      if (editingProjId) {
        await api.updateProject(editingProjId, payload);
        toast.success("Project updated successfully!");
      } else {
        await api.addProject(payload as any);
        toast.success("Project added successfully!");
      }

      await refetchUser();
      setIsProjOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  };


  const openAddSkill = () => {
    setEditingSkillId(null);
    setSkillForm({ level: "Intermediate" });
    setIsSkillOpen(true);
  };

  const openEditSkill = (skill: any) => {
    setEditingSkillId(skill._id);
    setSkillForm(skill);
    setIsSkillOpen(true);
  };
 
const handleDeleteExperience = async (expId: string) => {
  if (!window.confirm("Are you sure you want to delete this experience?")) return;
  
  try {
    await api.deleteExperience(expId);  
    toast.success("Experience deleted successfully!");
    await refetchUser();
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to delete experience");
  }
};


const handleDeleteProject = async (projId: string) => {
  if (!window.confirm("Are you sure you want to delete this project?")) return;
  
  try {
    await api.deleteProject(projId); 
    toast.success("Project deleted successfully!");
    await refetchUser();
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to delete project");
  }
};


const handleDeleteSkill = async (skillId: string) => {
  if (!window.confirm("Are you sure you want to delete this skill?")) return;
  
  try {
    await api.deleteSkill(skillId); 
    toast.success("Skill deleted successfully!");
    await refetchUser();
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to delete skill");
  }
};

const handleDeleteCertificate = async (certId: string) => {
  if (!window.confirm("Are you sure you want to delete this certificate?")) return;
  
  try {
    await api.deleteCertificate(certId); 
    await refetchUser();
  } catch (err: any) {
    console.error(err);
    toast.error(err.message || "Failed to delete certificate");
  }
};

  const handleSaveSkill = async () => {
    try {
      setIsSubmitting(true);
      if (!skillForm.name) {
        toast.error("Skill name is required");
        return;
      }

      if (editingSkillId) {
        await api.updateSkill(editingSkillId, skillForm);
        toast.success("Skill updated successfully!");
      } else {
        await api.addSkill(skillForm as any);
        toast.success("Skill added successfully!");
      }

      await refetchUser();
      setIsSkillOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save skill");
    } finally {
      setIsSubmitting(false);
    }
  };


  const openAddCertificate = () => {
    setEditingCertId(null);
    setCertForm({});
    setIsCertOpen(true);
  };

  const openEditCertificate = (cert: any) => {
    setEditingCertId(cert._id);
    setCertForm({
      ...cert,
      issueDate: formatDateForInput(cert.issueDate)
    });
    setIsCertOpen(true);
  };

  const handleSaveCertificate = async () => {
    try {
      setIsSubmitting(true);
      if (!certForm.name || !certForm.issuer) {
        toast.error("Name and Issuer are required");
        return;
      }

      if (editingCertId) {
        await api.updateCertificate(editingCertId, certForm);
        toast.success("Certificate updated successfully!");
      } else {
        await api.addCertificate(certForm as any);
        toast.success("Certificate added successfully!");
      }

      await refetchUser();
      setIsCertOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save certificate");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleEditProfile = () => {
    navigate("/settings"); 
  };

  const handleCurrentWorkChange = (checked: boolean) => {
    setExpForm(prev => ({
      ...prev,
      current: checked,
      endDate: checked ? undefined : prev.endDate
    }));
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-medium">{error || "User not found"}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const firstName = user.firstName || "User";
  const lastName = user.lastName || "";
  const fullName = `${firstName} ${lastName}`;

  const navbarUser = isAuthenticated ? (
    user ? {
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      avatar: formatMediaUrl(user.image),
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
        <div className="relative">
          <div className="h-48 md:h-64 bg-gradient-hero rounded-b-2xl" />
          <div className="max-w-5xl mx-auto px-4 -mt-20 md:-mt-24">
            <GlassCard className="overflow-visible">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="-mt-20 md:-mt-16">
                    <UserAvatar
                      name={fullName}
                      src={formatMediaUrl(user.image)}
                      size="xl"
                      showStatus
                      status="online"
                      className="ring-4 ring-background w-32 h-32 md:w-40 md:h-40"
                    />
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h1 className="font-display text-2xl md:text-3xl font-bold">{fullName}</h1>
                        <p className="text-muted-foreground mt-1">{user.headline}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                          {user.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" /> {user.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> {stats.connections} connections
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="gradient" onClick={handleEditProfile}>
                          <Edit2 className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => navigate(`/profile/${user._id}`)} 
                              className="cursor-pointer gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Public Profile
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
  <div className="text-center">
    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
      <Users className="h-5 w-5" /> {stats.connections}
    </div>
    <p className="text-sm text-muted-foreground">Connections</p>
  </div>
  <div className="text-center">
    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-primary">
      <TrendingUp className="h-5 w-5" /> {stats.postImpressions}
    </div>
    <p className="text-sm text-muted-foreground">Post impressions</p>
  </div>
</div>
              </div>
            </GlassCard>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <main className="space-y-6">
              {user.about && (
                <GlassCard className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-4">About</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {user.about}
                  </p>
                </GlassCard>
              )}

           
<GlassCard className="p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
      <Briefcase className="h-5 w-5 text-primary" /> Experience
    </h2>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={openAddExperience}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
  <div className="space-y-6">
    {user.experiences && user.experiences.length > 0 ? (
      user.experiences.map((exp: any, index: number) => (
        <div key={exp._id || index}>
          {index > 0 && <Separator className="mb-6" />}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{exp.title}</h3>
                  <p className="text-sm">{exp.company}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(exp.startDate)} - {exp.current ? "Present" : formatDate(exp.endDate)}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditExperience(exp)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleDeleteExperience(exp._id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {exp.description && (
                <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>
              )}
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">No experience listed.</p>
    )}
  </div>
</GlassCard>

<GlassCard className="p-6">
  <div className="flex items-center justify-between mb-6">
    <h2 className="font-display text-xl font-semibold flex items-center gap-2">
      <Folder className="h-5 w-5 text-primary" /> Projects
    </h2>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={openAddProject}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
  <div className="space-y-6">
    {user.projects && user.projects.length > 0 ? (
      user.projects.map((project: any, index: number) => (
        <div key={project._id || index}>
          {index > 0 && <Separator className="mb-6" />}
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
              <Folder className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{project.title}</h3>
                  {(project.startDate || project.endDate) && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {formatDate(project.startDate)}
                      {project.endDate && ` - ${formatDate(project.endDate)}`}
                    </p>
                  )}
                  {project.link && (
                    <a 
                      href={project.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Project <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={() => openEditProject(project)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => handleDeleteProject(project._id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">No projects listed.</p>
    )}
  </div>
</GlassCard>

             
<GlassCard className="p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-display text-xl font-semibold">Skills</h2>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={openAddSkill}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
  <div className="flex flex-wrap gap-2">
    {user.skills && user.skills.length > 0 ? (
      user.skills.map((skill: any, index: number) => (
        <Badge 
          key={skill._id || index} 
          variant="secondary" 
          className="px-3 py-1 cursor-pointer hover:bg-secondary/80 pr-1 group relative"
        >
          <span 
            className="pr-6"
            onClick={() => openEditSkill(skill)}
          >
            {skill.name}
            {skill.level && <span className="ml-1 opacity-50 text-xs">({skill.level})</span>}
          </span>
          <Edit2 className="h-3 w-3 ml-2 opacity-50" />
          <button
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSkill(skill._id);
            }}
            title="Delete skill"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </Badge>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">No skills added.</p>
    )}
  </div>
</GlassCard>
            </main>

           
            <aside className="space-y-4">
             
              <GlassCard className="p-4">
                <h3 className="font-display font-semibold mb-4">Contact Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {user.location}
                    </div>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-4">
  <h3 className="font-display font-semibold mb-4 flex items-center justify-between">
    <span className="flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certifications</span>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon-sm" onClick={openAddCertificate}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </h3>
  <div className="space-y-4">
    {user.certificates && user.certificates.length > 0 ? (
      user.certificates.map((cert: any, index: number) => (
        <div key={cert._id || index} className="group relative">
          <div className="pr-12">
            <p className="font-medium text-sm">{cert.name}</p>
            <p className="text-xs text-muted-foreground">
              {cert.issuer} {cert.issueDate && `· ${formatDate(cert.issueDate)}`}
            </p>
            {cert.url && (
              <a href={cert.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline mt-1 block">
                Show Credential
              </a>
            )}
          </div>
          <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => openEditCertificate(cert)}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => handleDeleteCertificate(cert._id)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-muted-foreground">None listed.</p>
    )}
  </div>
</GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-display font-semibold mb-3">Public profile & URL</h3>
                <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">
                    nexus.com/in/{firstName?.toLowerCase()}{lastName?.toLowerCase()}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigate(`/profile/${user._id}`)}>
                  View public profile
                </Button>
              </GlassCard>
            </aside>
          </div>
        </div>
      </PageContainer>

     
      <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingExpId ? "Edit Experience" : "Add Experience"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Job Title *</Label>
              <Input 
                value={expForm.title || ''} 
                onChange={e => setExpForm({...expForm, title: e.target.value})} 
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label>Company Name *</Label>
              <Input 
                value={expForm.company || ''} 
                onChange={e => setExpForm({...expForm, company: e.target.value})} 
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="grid gap-2">
              <Label>Location</Label>
              <Input 
                value={expForm.location || ''} 
                onChange={e => setExpForm({...expForm, location: e.target.value})} 
                placeholder="City, Country"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date *</Label>
                <Input type="date" value={expForm.startDate || ''} onChange={e => setExpForm({...expForm, startDate: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input 
                  type="date" 
                  disabled={expForm.current} 
                  value={expForm.endDate || ''} 
                  onChange={e => setExpForm({...expForm, endDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="current" 
                checked={expForm.current} 
                onCheckedChange={handleCurrentWorkChange} 
              />
              <Label htmlFor="current" className="font-normal cursor-pointer">I currently work here</Label>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={expForm.description || ''} 
                onChange={e => setExpForm({...expForm, description: e.target.value})} 
                placeholder="Describe your responsibilities..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveExperience} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isProjOpen} onOpenChange={setIsProjOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProjId ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name *</Label>
              <Input 
                value={projForm.title || ''} 
                onChange={e => setProjForm({...projForm, title: e.target.value})} 
                placeholder="e.g. E-commerce Platform"
              />
            </div>
            <div className="grid gap-2">
              <Label>Project URL</Label>
              <Input 
                value={projForm.link || ''} 
                onChange={e => setProjForm({...projForm, link: e.target.value})} 
                placeholder="https://github.com/..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={projForm.startDate || ''} onChange={e => setProjForm({...projForm, startDate: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={projForm.endDate || ''} onChange={e => setProjForm({...projForm, endDate: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Technologies (comma separated)</Label>
              <Input 
                value={Array.isArray(projForm.technologies) ? projForm.technologies.join(', ') : projForm.technologies || ''} 
                onChange={e => setProjForm({...projForm, technologies: e.target.value.split(',').map(t => t.trim())})} 
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={projForm.description || ''} 
                onChange={e => setProjForm({...projForm, description: e.target.value})} 
                placeholder="What did you build?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProjOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProject} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSkillOpen} onOpenChange={setIsSkillOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingSkillId ? "Edit Skill" : "Add Skill"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Skill Name *</Label>
              <Input value={skillForm.name || ''} onChange={e => setSkillForm({...skillForm, name: e.target.value})} placeholder="e.g. Python" />
            </div>
            <div className="grid gap-2">
              <Label>Proficiency Level</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={skillForm.level || "Intermediate"} 
                onChange={e => setSkillForm({...skillForm, level: e.target.value})}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSkillOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSkill} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCertOpen} onOpenChange={setIsCertOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingCertId ? "Edit Certification" : "Add Certification"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Certificate Name *</Label>
              <Input value={certForm.name || ''} onChange={e => setCertForm({...certForm, name: e.target.value})} placeholder="e.g. AWS Certified Developer" />
            </div>
            <div className="grid gap-2">
              <Label>Issuing Organization *</Label>
              <Input value={certForm.issuer || ''} onChange={e => setCertForm({...certForm, issuer: e.target.value})} placeholder="e.g. Amazon Web Services" />
            </div>
            <div className="grid gap-2">
              <Label>Issue Date</Label>
              <Input type="date" value={certForm.issueDate || ''} onChange={e => setCertForm({...certForm, issueDate: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Expiry Date</Label>
              <Input type="date" value={certForm.expiryDate || ''} onChange={e => setCertForm({...certForm, expiryDate: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Credential URL</Label>
              <Input value={certForm.url || ''} onChange={e => setCertForm({...certForm, url: e.target.value})} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCertOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCertificate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}