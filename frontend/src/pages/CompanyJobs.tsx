import { useState, useEffect } from "react";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Users,
  Eye,
  MoreHorizontal,
  Edit,
  Trash2,
  Pause,
  Play,
  Copy,
  ExternalLink,
  DollarSign,
  Building2,
  Sparkles,
  FileText,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, Job } from "@/lib/api";
import { toast } from "sonner";

const statusColors = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  draft: "bg-muted text-muted-foreground",
  closed: "bg-destructive/10 text-destructive",
};

export default function CompanyJobs() {
  const { isAuthenticated, accountType } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [jobForm, setJobForm] = useState({
    title: "",
    department: "",
    type: "",
    location: "",
    salaryRange: "",
    description: "",
    skillsRequired: "",
    requirements: "",
    experienceLevel: "",
    educationLevel: "",
    deadline: "",
  });

  useEffect(() => {
    if (isAuthenticated && accountType === "company") {
      fetchJobs();
    }
  }, [isAuthenticated, accountType]);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await api.getCompanyJobs();
      if (response.success) {
        setJobs(response.data);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobForm.title || !jobForm.description || !jobForm.type || !jobForm.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const jobData = {
        title: jobForm.title,
        description: jobForm.description,
        type: jobForm.type,
        location: jobForm.location,
        salaryRange: jobForm.salaryRange || undefined,
        requirements: jobForm.requirements || undefined,
        skillsRequired: jobForm.skillsRequired ? jobForm.skillsRequired.split(",").map(s => s.trim()) : undefined,
        experienceLevel: jobForm.experienceLevel || undefined,
        educationLevel: jobForm.educationLevel || undefined,
        deadline: jobForm.deadline || undefined,
        generateWithAI: isAIEnabled,
      };

      const response = await api.createJob(jobData);
      console.log("Create job response:", response);
      
      if (response && (response.success === true || response.success === undefined)) {
        toast.success("Job posted successfully!");
        setIsDialogOpen(false);
        setJobForm({
          title: "",
          department: "",
          type: "",
          location: "",
          salaryRange: "",
          description: "",
          skillsRequired: "",
          requirements: "",
          experienceLevel: "",
          educationLevel: "",
          deadline: "",
        });
        setIsAIEnabled(false);
        fetchJobs();
      } else {
        console.error("Create job response:", response);
        toast.error("Failed to create job");
      }
    } catch (error) {
      console.error("Error creating job:", error);
      toast.error("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || (job.isActive ? "active" : "closed") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeJobs = jobs.filter(j => j.isActive).length;
  const totalApplications = jobs.reduce((acc, j) => acc + (j.applicants?.length || 0), 0);
  const totalViews = 0; 
  const avgScore = jobs.length > 0 ? Math.round(jobs.reduce((acc, j) => acc + (j.applicants?.reduce((sum, a) => sum + a.score, 0) || 0) / (j.applicants?.length || 1), 0) / jobs.length) : 0;

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">Job Management</h1>
              <p className="text-muted-foreground">Create, manage, and track your job postings</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Create Job Posting</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new job posting.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-primary">
                        <Sparkles className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <Label htmlFor="ai-job" className="font-medium">AI Job Description</Label>
                        <p className="text-xs text-muted-foreground">Generate compelling job descriptions with AI</p>
                      </div>
                    </div>
                    <Switch
                      id="ai-job"
                      checked={isAIEnabled}
                      onCheckedChange={setIsAIEnabled}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Job Title</Label>
                      <Input 
                        placeholder="e.g., Senior Frontend Developer" 
                        className="mt-1.5"
                        value={jobForm.title}
                        onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select 
                        value={jobForm.department}
                        onValueChange={(value) => setJobForm(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="design">Design</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="hr">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Employment Type</Label>
                      <Select 
                        value={jobForm.type}
                        onValueChange={(value) => setJobForm(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g., ariana , manouba ..." 
                        className="mt-1.5"
                        value={jobForm.location}
                        onChange={(e) => setJobForm(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Salary Range</Label>
                      <Input 
                        placeholder="e.g., 1500-2000 dt" 
                        className="mt-1.5"
                        value={jobForm.salaryRange}
                        onChange={(e) => setJobForm(prev => ({ ...prev, salaryRange: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Job Description</Label>
                      <Textarea 
                        placeholder={isAIEnabled ? "Describe the role briefly and AI will generate a full description..." : "Describe the responsibilities, requirements, and benefits..."}
                        className="mt-1.5 min-h-[150px]"
                        value={jobForm.description}
                        onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                      {isAIEnabled && (
                        <Button variant="outline" size="sm" className="mt-2 gap-2">
                          <Sparkles className="h-4 w-4" />
                          Generate Description
                        </Button>
                      )}
                    </div>
                    <div className="col-span-2">
                      <Label>Required Skills</Label>
                      <Input 
                        placeholder="e.g., React, TypeScript, Node.js (comma separated)" 
                        className="mt-1.5"
                        value={jobForm.skillsRequired}
                        onChange={(e) => setJobForm(prev => ({ ...prev, skillsRequired: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" disabled={isSubmitting}>
                      Save as Draft
                    </Button>
                    <Button 
                      variant="gradient" 
                      onClick={handleCreateJob}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-4 w-4 mr-2" />
                          Publish Job
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Jobs"
              value={activeJobs}
              icon={<Briefcase className="h-5 w-5" />}
            />
            <StatCard
              title="Total Applications"
              value={totalApplications}
              change="+28% this week"
              changeType="positive"
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard
              title="Total Views"
              value={totalViews.toLocaleString()}
              change="+15% this week"
              changeType="positive"
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              title="Avg. AI Match Score"
              value="86%"
              icon={<Sparkles className="h-5 w-5" />}
            />
          </div>

    
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

       
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const status = job.isActive ? "active" : "closed";
              const applications = job.applicants?.length || 0;
              const avgScore = job.applicants?.length ? Math.round(job.applicants.reduce((sum, a) => sum + a.score, 0) / job.applicants.length) : 0;
              const postedAt = new Date(job.createdAt).toLocaleDateString();
              const expiresIn = job.deadline ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " days" : "No deadline";

              return (                
              <GlassCard key={job._id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                      <Badge className={statusColors[status as keyof typeof statusColors]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {job.salaryRange}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-display font-bold text-lg">{applications}</p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                      {avgScore > 0 && (
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="font-display font-bold text-lg text-primary">{avgScore}%</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                        {status === "active" && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/company/applicants/${job._id}`}>
                              <Users className="h-4 w-4 mr-2" />
                              View Applicants
                            </Link>
                          </Button>
                        )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Job
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          {job.isActive === true ? (
                            <DropdownMenuItem>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Job
                            </DropdownMenuItem>
                          ) : job.isActive === false ? (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Resume Job
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                    <span>Posted {postedAt}</span>
                    <span>•</span>
                    <span>
                      {expiresIn}
                    </span>
                  </div>
              </GlassCard>
              );
            })}
          </div>

          {filteredJobs.length === 0 && (
            <GlassCard className="p-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display font-semibold text-lg mb-2">No Jobs Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search or filters" 
                  : "Create your first job posting to attract top talent"}
              </p>
              <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            </GlassCard>
          )}
        </div>
      </PageContainer>
    </div>
  );
}