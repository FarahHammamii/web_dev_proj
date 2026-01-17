import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MainNav } from "@/components/MainNav";
import { useUnreadNotifications } from "@/hooks/use-unread-notifications";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, Job } from "@/lib/api";
import { formatMediaUrl } from "@/lib/media";
import { toast } from "sonner";
import ApplyJob from "@/pages/ApplyJob";

export default function JobsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, accountType } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
  location: "",
  type: "",
  
});
  const page = Number(searchParams.get("page")) || 1;

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

  const handleApplicationSuccess = (jobId: string, newApplicant: any) => {
    const applicantWithId = {
      ...newApplicant,
      userId: newApplicant?.userId || user?._id || (user as any)?.id,
      status: newApplicant?.status || 'pending',
      score: newApplicant?.score || 0
    };

    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job._id === jobId) {
          const alreadyApplied = job.applicants?.some(a => {
            const id = typeof a.userId === 'object' ? a.userId._id : a.userId;
            return id?.toString() === applicantWithId.userId?.toString();
          });

          if (alreadyApplied) return job;

          return {
            ...job,
            applicants: [...(job.applicants || []), applicantWithId],
          };
        }
        return job;
      })
    );
    setSelectedJobId(null);
  };


  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/auth");
    if (!authLoading && isAuthenticated && accountType === "company") navigate("/company");
  }, [authLoading, isAuthenticated, accountType, navigate]);


const fetchJobs = async () => {
  try {
    setIsLoading(true);

    const response = await api.getJobs({
      page,
      limit: 10,
      ...filters,
    });

    setJobs(Array.isArray(response) ? response : (response.data ?? []));
  } catch (error) {
    console.error(error);
    toast.error("Failed to load jobs");
  } finally {
    setIsLoading(false);
  }
};
useEffect(() => {
  if (isAuthenticated) fetchJobs();
}, [isAuthenticated, page, filters]);


  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground">
      <MainNav user={navbarUser} unreadNotifications={unreadCount} />

      <PageContainer>
        <PageHeader 
          title="Jobs" 
          description={accountType === "company" ? "Manage your listings" : "Find your next opportunity"} 
        />
    <GlassCard className="p-4 mb-6  inline-block w-fi">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
     
        <input
          type="text"
          placeholder="Location"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.location}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, location: e.target.value }))
          }
        />

     
        <select
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value }))
          }
        >
          <option value="">All Types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="remote">Remote</option>
        </select>

        
    
        <Button
          variant="outline"
          onClick={() =>
            setFilters({ location: "", type: "" })
          }
        >
          Reset
        </Button>
      </div>
    </GlassCard>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <GlassCard key={i} className="p-4">
                <div className="space-y-2 animate-pulse">
                  <div className="h-4 w-1/2 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted rounded" />
                </div>
              </GlassCard>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <GlassCard key={job._id} className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {job.companyId?.name} • {job.location}
                    </p>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenJobId(openJobId === job._id ? null : job._id)}
                    >
                      {openJobId === job._id ? "Hide" : "Details"}
                    </Button>

                    {accountType === "user" && (() => {
                      const currentUserId = user?._id || (user as any)?.id;
                      
                      const applicant = job.applicants?.find((a) => {
                        if (!a || !a.userId) return false;
                        const aid = typeof a.userId === 'object' 
                          ? (a.userId._id || (a.userId as any).id) 
                          : a.userId;
                        return aid?.toString() === currentUserId?.toString();
                      });

                      if (applicant) {
                        const status = (applicant.status || 'pending').toLowerCase();
                        let statusColor = "text-primary"; 
                        if (status === "accepted") statusColor = "text-green-600 dark:text-green-400";
                        if (status === "rejected") statusColor = "text-red-600 dark:text-red-400";

                        return (
                          <div className="text-right border-l pl-4 border-muted ml-2">
                            <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter leading-none mb-1">Status</div>
                            <div className={`text-sm font-bold capitalize leading-none ${statusColor}`}>
                              {applicant.status || 'pending'}
                            </div>
                            <div className="inline-block text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                              Score: {applicant.score ?? 0}%
                            </div>
                          </div>
                        );
                      }

                      return (
                        <Button size="sm" onClick={() => setSelectedJobId(job._id)}>
                          Apply
                        </Button>
                      );
                    })()}
                  </div>
                </div>

                {openJobId === job._id && (
                  <div className="pt-4 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                      <span><span className="text-muted-foreground">Type:</span> {job.type}</span>
                      <span><span className="text-muted-foreground">Salary:</span> {job.salaryRange}</span>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No jobs found</p>
            </div>
          )}
        </div>
      </PageContainer>

      {selectedJobId && (
        <ApplyJob
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onSuccess={(newApplicant) => handleApplicationSuccess(selectedJobId, newApplicant)}
        />
      )}
    </div>
  );
}