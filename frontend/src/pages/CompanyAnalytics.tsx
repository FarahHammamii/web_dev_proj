import { useState, useEffect, useMemo } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { useParams, useNavigate } from "react-router-dom";

import { 
  Award, 
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Target,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { api, Job, Applicant } from "@/lib/api";
import { formatMediaUrl } from "@/lib/media";
import { toast } from "sonner";


const COLORS = {
  accepted: '#10b981', 
  pending: '#f59e0b', 
  rejected: '#ef4444',  
  primary: '#3b82f6'
};

export default function CompanyAnalytics() {
   const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  

  const [engagement, setEngagement] = useState({ posts: 0, likes: 0, comments: 0 });


  const [candidates, setCandidates] = useState<Applicant[]>([]); 
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true);
        const response: any = await api.getCompanyJobs();
        
       
        let jobList: Job[] = [];
        if (Array.isArray(response)) jobList = response;
        else if (response.success && Array.isArray(response.data)) jobList = response.data;
        else if (response.jobs && Array.isArray(response.jobs)) jobList = response.jobs;

        setJobs(jobList);

     
        if (jobList.length > 0) {
          setSelectedJobId(jobList[0]._id);
          
        
          const companyId = jobList[0].companyId;
          if (companyId) {
             const postsRes = await api.getCompanyPosts(companyId, 1, 100); 
             if (postsRes.success) {
                const posts = postsRes.data.posts;
                const totalLikes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
                const totalComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
                setEngagement({
                    posts: postsRes.data.pagination.total,
                    likes: totalLikes,
                    comments: totalComments
                });
             }
          }
        }
      } catch (error) {
        console.error("Failed to load analytics", error);
        toast.error("Failed to load analytics data");
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, []);


  useEffect(() => {
    if (!selectedJobId) return;

   const fetchCandidates = async () => {
  setIsLoadingCandidates(true);
  try {
    const response = await api.getTopCandidates(selectedJobId, 10);
    console.log("Candidates API Response:", response);
    
    
    let candidateData = [];
    
    if (response.success && response.data) {
    
      candidateData = response.data;
    } else if (Array.isArray(response)) {
    
      candidateData = response;
    }
    
    console.log("Setting candidates:", candidateData);
    console.log("First candidate user:", candidateData[0]?.userId);
    
    setCandidates(candidateData);
  } catch (error) {
    console.error("Error fetching candidates", error);
    toast.error("Failed to load candidates");
    setCandidates([]);
  } finally {
    setIsLoadingCandidates(false);
  }
};

    fetchCandidates();
  }, [selectedJobId]);


  const stats = useMemo(() => {
    if (!selectedJobId || !jobs.length) return null;
    
    const job = jobs.find(j => j._id === selectedJobId);
    if (!job) return null;

    const apps = job.applicants || [];
    const total = apps.length;
    

    const distribution = {
      accepted: apps.filter(a => a.status === 'accepted').length,
      pending: apps.filter(a => a.status === 'pending').length,
      rejected: apps.filter(a => a.status === 'rejected').length
    };


    const scores = apps.map(a => a.score || 0);
    const avgScore = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
    const highestScore = total > 0 ? Math.max(...scores) : 0;

    return { total, distribution, avgScore, highestScore, jobTitle: job.title };
  }, [selectedJobId, jobs]);

  const pieData = stats ? [
    { name: 'Accepted', value: stats.distribution.accepted, color: COLORS.accepted },
    { name: 'Pending', value: stats.distribution.pending, color: COLORS.pending },
    { name: 'Rejected', value: stats.distribution.rejected, color: COLORS.rejected },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageContainer>
        <div className="space-y-10">
          
          
          <div>
            <div className="mb-6">
                <h1 className="font-display text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Overview of your brand presence and recruitment funnel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Posts" 
                    value={engagement.posts} 
                    icon={<FileText className="h-6 w-6 text-blue-500" />} 
                    sub="Content published"
                    bgClass="bg-blue-500/10"
                />
                <StatCard 
                    title="Total Reactions" 
                    value={engagement.likes} 
                    icon={<Heart className="h-6 w-6 text-pink-500" />} 
                    sub="Across all posts"
                    bgClass="bg-pink-500/10"
                />
                <StatCard 
                    title="Total Comments" 
                    value={engagement.comments} 
                    icon={<MessageSquare className="h-6 w-6 text-purple-500" />} 
                    sub="Community interactions"
                    bgClass="bg-purple-500/10"
                />
            </div>
          </div>

          <div className="h-px w-full bg-border/60" />

          
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" /> Recruitment Pipeline
                    </h2>
                    <p className="text-muted-foreground">Detailed breakdown by job position.</p>
                </div>
                
                <div className="w-full md:w-[320px]">
                    <Select 
                        value={selectedJobId || ""} 
                        onValueChange={setSelectedJobId}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="h-10 bg-background/50 backdrop-blur-sm border-muted-foreground/20">
                            <SelectValue placeholder={isLoading ? "Loading jobs..." : "Select a Position"} />
                        </SelectTrigger>
                        <SelectContent>
                            {jobs.map(job => (
                                <SelectItem key={job._id} value={job._id} className="font-medium">
                                    {job.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {!selectedJobId ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">Select a job position above to view specific analytics.</p>
                </div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <SmallStatCard 
                            label="Total Applicants" 
                            value={stats.total} 
                            icon={<FileText className="h-4 w-4" />}
                            trend="All time"
                        />
                        <SmallStatCard 
                            label="Avg Match Score" 
                            value={`${Math.round(stats.avgScore)}%`} 
                            icon={<Target className="h-4 w-4" />}
                            trend="AI Screening"
                        />
                        <SmallStatCard 
                            label="Top Candidate" 
                            value={`${Math.round(stats.highestScore)}%`} 
                            icon={<Trophy className="h-4 w-4" />}
                            trend="Highest Score"
                        />
                        <SmallStatCard 
                            label="Action Required" 
                            value={stats.distribution.pending} 
                            icon={<Clock className="h-4 w-4" />}
                            trend="Pending Review"
                            alert={stats.distribution.pending > 0}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                        
                     
                        <GlassCard className="lg:col-span-1 min-h-[450px] flex flex-col p-6">
                            <h3 className="font-semibold text-lg mb-2">Application Status</h3>
                            <p className="text-xs text-muted-foreground mb-6">Distribution of candidate outcomes</p>
                            
                            <div className="flex-1 w-full min-h-[250px] relative">
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                                        <PieChart className="h-10 w-10 mb-2 opacity-50"/>
                                        <span className="text-sm">No data available</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-6">
                                <StatusBadge count={stats.distribution.accepted} label="Accepted" color="bg-green-500/10 text-green-600" />
                                <StatusBadge count={stats.distribution.pending} label="Pending" color="bg-amber-500/10 text-amber-600" />
                                <StatusBadge count={stats.distribution.rejected} label="Rejected" color="bg-red-500/10 text-red-600" />
                            </div>
                        </GlassCard>

                      
                        <GlassCard className="lg:col-span-2 min-h-[450px] flex flex-col p-0 overflow-hidden">
                            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-secondary/20">
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        <Award className="h-5 w-5 text-amber-500" /> Top Matches
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Candidates ranked by AI compatibility score</p>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => window.location.href=`/company/jobs/${selectedJobId}/applicants`}>
                                    View Pipeline
                                </Button>
                            </div>

<div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
  {isLoadingCandidates && candidates.length === 0 ? (
    [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
  ) : candidates.length > 0 ? (
    candidates
      .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
      .map((candidate: any, i: number) => {
        
        console.log(`Rendering candidate ${i}:`, {
          id: candidate._id,
          userId: candidate.userId,
          firstName: candidate.userId?.firstName,
          lastName: candidate.userId?.lastName,
          hasUserObject: typeof candidate.userId === 'object',
          score: candidate.score
        });
        
       
        const user = candidate.userId;
        
        if (!user || typeof user !== 'object') {
          console.warn(`Candidate ${i} has no user object:`, candidate);
          return null; 
        }
        
        const firstName = user.firstName || "Applicant";
        const lastName = user.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim() || `Applicant #${i + 1}`;
        
        let avatarSrc = undefined;
        if (user.image) {
          const normalizedPath = user.image.replace(/\\/g, '/');
          avatarSrc = formatMediaUrl(normalizedPath);
        }
        
        const targetUserId = user._id || candidate._id;
        const finalScore = Math.round(candidate.score || 0);
        const appliedDate = candidate.appliedAt 
          ? new Date(candidate.appliedAt).toLocaleDateString() 
          : 'Recently';
        
        return (
          <div 
            key={candidate._id || i} 
            onClick={() => targetUserId && navigate(`/company/candidates/${targetUserId}?viewAs=candidate`)}
            className="group cursor-pointer flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <UserAvatar 
                  className="h-12 w-12 border-2 border-background shadow-sm"
                  name={fullName} 
                  src={avatarSrc} 
                  fallback={fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                />
                <div className="absolute -top-2 -left-2 bg-background border rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-bold shadow-sm">
                  #{i + 1}
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                  {fullName}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" />
                  Applied {appliedDate}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                {candidate.status === 'accepted' && (
                  <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20 shadow-none">
                    <CheckCircle2 className="h-3 w-3 mr-1"/> Accepted
                  </Badge>
                )}
                {candidate.status === 'rejected' && (
                  <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                    <XCircle className="h-3 w-3 mr-1"/> Rejected
                  </Badge>
                )}
                {candidate.status === 'pending' && (
                  <Badge variant="secondary" className="text-amber-600 bg-amber-50">
                    <Clock className="h-3 w-3 mr-1"/> Pending
                  </Badge>
                )}
              </div>
              
              <div className="text-right flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Match</span>
                <span className={`text-lg font-bold ${getScoreColor(finalScore)}`}>
                  {finalScore}%
                </span>
              </div>
            </div>
          </div>
        );
      })
  ) : (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
      <Target className="h-10 w-10 mb-2 opacity-30" />
      <p>No candidates found for this position.</p>
    </div>
  )}
</div>
                        </GlassCard>
                    </div>
                </>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}


function StatCard({ title, value, icon, sub, bgClass }: any) {
    return (
        <GlassCard className="p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-t-4 border-t-transparent hover:border-t-primary/20">
            <div className={`absolute top-4 right-4 p-3 rounded-2xl ${bgClass} transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <div className="relative z-10">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h4 className="text-4xl font-display font-bold mt-3 tracking-tight">{value}</h4>
                <p className="text-xs font-medium text-muted-foreground/80 mt-2">{sub}</p>
            </div>
        </GlassCard>
    )
}

function SmallStatCard({ label, value, icon, trend, alert }: any) {
    return (
        <GlassCard className={`p-5 flex flex-col justify-between ${alert ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-muted-foreground font-medium">{label}</span>
                <span className="text-muted-foreground/50">{icon}</span>
            </div>
            <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{trend}</div>
            </div>
        </GlassCard>
    )
}

function StatusBadge({ count, label, color }: any) {
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl ${color}`}>
            <span className="font-bold text-xl">{count}</span>
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span>
        </div>
    )
}

function getScoreColor(score: number = 0) {
    if (score >= 80) return "text-green-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-500";
}