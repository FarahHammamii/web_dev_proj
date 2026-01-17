import { PageContainer } from "@/components/PageContainer";
import { GlassCard, StatCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Users, Briefcase, Eye, FileText, Plus, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, Job } from "@/lib/api";
import { toast } from "sonner";

export default function CompanyDashboard() {
  const { isAuthenticated, accountType } = useAuth();

  const [stats, setStats] = useState({
    followers: 0,
    activeJobs: 0,
    totalApplications: 0,
    
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

 const fetchDashboardData = async () => {
  try {
    setIsLoading(true);

   
    const [companyData, jobsRes] = await Promise.all([
      api.getCompanyProfile(),
      api.getCompanyJobs(),
    ]);

   
    let jobsData = [];
    
    if (jobsRes) {
      if (jobsRes.success !== undefined) {
      
        jobsData = jobsRes.success ? jobsRes.data || [] : [];
      } else if (Array.isArray(jobsRes)) {
      
        jobsData = jobsRes;
      } else if (jobsRes.data && Array.isArray(jobsRes.data)) {
      
        jobsData = jobsRes.data;
      }
    }
    
    setJobs(jobsData);

  
    setStats({
      followers: companyData.followers?.length || 0,
      activeJobs: jobsData.filter((j: Job) => j.isActive).length,
      totalApplications: jobsData.reduce(
        (acc: number, j: Job) => acc + (j.applicants?.length || 0),
        0
      ),
    });
  } catch (error) {
    console.error(error);
    toast.error("Failed to load dashboard data");
  } finally {
    setIsLoading(false);
  }
};
  useEffect(() => {
    if (isAuthenticated && accountType === "company") {
      fetchDashboardData();
    }
  }, [isAuthenticated, accountType]);

  const handleCloseJob = async (jobId: string) => {
    try {
      await api.closeJob(jobId);
      toast.success("Job closed");
      fetchDashboardData();
    } catch (error) {
      toast.error("Failed to close job");
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
       
        fetchDashboardData();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            Loading...
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Company Dashboard</h1>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="mr-2 h-4 w-4" />
                  Post Job
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Followers"
              value={stats.followers.toString()}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              title="Active Jobs"
              value={stats.activeJobs.toString()}
              icon={<Briefcase className="h-5 w-5" />}
            />
            <StatCard
              title="Applications"
              value={stats.totalApplications.toString()}
              icon={<FileText className="h-5 w-5" />}
            />
            
          </div>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold mb-6">
              Manage Job Offers
            </h3>

            <div className="space-y-4">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <div
                    key={job._id}
                    className="
                      group
                      flex items-center justify-between p-4
                      rounded-lg border
                      bg-card/50
                      transition-all duration-300
                      hover:shadow-lg hover:shadow-primary/10
                      hover:-translate-y-1
                      hover:border-primary/50
                      cursor-pointer
                    "
                  >
                    <div>
                      <h4 className="font-bold">{job.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.applicants?.length || 0} applicants •{" "}
                        {job.location}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/company/applicants/${job._id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          Applicants
                        </Link>
                      </Button>

                      {job.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCloseJob(job._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No jobs found.
                </p>
              )}
            </div>
          </GlassCard>
        </div>
      </PageContainer>
    </div>
  );
}
