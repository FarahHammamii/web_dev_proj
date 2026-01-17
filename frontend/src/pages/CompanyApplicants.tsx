import { formatMediaUrl } from "@/lib/media";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PageContainer } from "@/components/PageContainer";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronLeft, RefreshCcw, Trophy } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";


export default function CompanyApplicants() {
  const navigate = useNavigate();

  const { jobId } = useParams<{ jobId: string }>();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescoring, setIsRescoring] = useState(false);
  const [topLimit, setTopLimit] = useState(10);

  useEffect(() => {
    if (jobId) fetchApplicants();
  }, [jobId]);

  const fetchApplicants = async () => {
  try {
    setIsLoading(true);

    const job = await api.getJobById(jobId!);
    setApplicants(job.applicants || []);

  } catch (error) {
    console.error(error);
    toast.error("Erreur de chargement");
  } finally {
    setIsLoading(false);
  }
};


const handleTopCandidates = async () => {
  try {
    const res = await api.getTopCandidates(jobId!, topLimit);

    const data = res.success ? res.data : (Array.isArray(res) ? res : []);
    setApplicants(data);

    toast.success(`Affichage des ${topLimit} meilleurs profils`);
  } catch (error) {
    toast.error("Erreur lors du filtrage");
  }
};


  const handleUpdateStatus = async (userId: string, status: "accepted" | "rejected") => {
    try {
      await api.updateApplicantStatus(jobId!, userId, status);
      setApplicants(prev => prev.map(a => a.userId._id === userId ? { ...a, status } : a));
      toast.success(`Applicant ${status}`);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const handleRescore = async () => {
    try {
      setIsRescoring(true);
      toast.info("AI analysis in progress...");
      const res = await api.rescoreApplicants(jobId!);
      await fetchApplicants();
      toast.success(`${res.updated || 0} applicants rescored!`);
    } catch (error) {
      toast.error("AI scoring failed");
    } finally {
      setIsRescoring(false);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <PageContainer>
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" asChild><Link to="/company"><ChevronLeft className="mr-2 h-4 w-4"/> Dashboard</Link></Button>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={50}
                value={topLimit}
                onChange={(e) => setTopLimit(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded-md text-sm"
              />

              <Button variant="outline" onClick={handleTopCandidates}>
                <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                Top
              </Button>
            </div>

            <Button variant="gradient" onClick={handleRescore} disabled={isRescoring}>
              <Sparkles className="mr-2 h-4 w-4"/>{isRescoring ? "Analyzing..." : "AI Rescore"}
            </Button>
            <Button variant="outline" size="icon" onClick={fetchApplicants}><RefreshCcw className="h-4 w-4"/></Button>
          </div>
        </div>

        <GlassCard className="p-0 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/30 font-bold">
            <div className="col-span-6">Candidate</div>
            <div className="col-span-2 text-center">AI Score</div>
            <div className="col-span-4 text-right">Actions</div>
          </div>
          {applicants.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No applicants found.</div>
          ) : (
            applicants.map((app) => (
              <div key={app.userId._id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center hover:bg-muted/10">
                <div className="col-span-6 flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/profile/${app.userId._id}`)}
                    className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold hover:ring-2 hover:ring-primary transition"
                  >
                    {app.userId.firstName[0]}
                  </button>

                <div>
                  <button
                    onClick={() => navigate(`/profile/${app.userId._id}`)}
                    className="font-semibold hover:underline hover:text-primary transition text-left"
                  >
                    {app.userId.firstName} {app.userId.lastName}
                  </button>
                  <br></br>

                    <Badge variant="outline">{app.status}</Badge>
                  </div>
                </div>
                <div className="col-span-2 text-center font-bold text-primary">{app.score}%</div>
                <div className="col-span-4 flex justify-end gap-2">
                  {app.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.userId._id, 'accepted')}>Accept</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(app.userId._id, 'rejected')}>Reject</Button>
                    </>
                  )}
                  
                  {app.resumeUrl && (
                    <Button size="sm" variant="ghost" asChild>
                      <a
                        href={formatMediaUrl(app.resumeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        CV
                      </a>
                    </Button>
                  )}

                </div>
              </div>
            ))
          )}
        </GlassCard>
      </PageContainer>
    </div>
  );
}