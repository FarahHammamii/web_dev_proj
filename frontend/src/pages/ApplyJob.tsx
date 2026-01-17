import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { X, Upload, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  jobId: string;
  onClose: () => void;
  onSuccess: (newApplicant: any) => void;
}

export default function ApplyJob({ jobId, onClose, onSuccess }: Props) {
  const [resume, setResume] = useState<File | null>(null);
  const [additionalAttachment, setAdditionalAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("resume", resume);
      if (additionalAttachment) {
        formData.append("additionalAttachment", additionalAttachment);
      }

      const response = await api.applyToJob(jobId, formData) as any;

      const applicantData = response.applicant;
      const score = response.aiScore || applicantData?.score;

      toast.success(`Application sent! AI Match Score: ${score}%`);
      onSuccess(applicantData);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to apply";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6 space-y-6 relative border-primary/20 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Submit Application</h2>
          <p className="text-sm text-muted-foreground">
            Your resume will be analyzed by our AI to calculate a match score.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Resume (PDF required)
            </label>
            <div className="relative border-2 border-dashed border-muted rounded-lg p-4 hover:border-primary/50 transition-colors bg-muted/20">
              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setResume(e.target.files?.[0] || null)}
              />
              <div className="text-center">
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {resume ? resume.name : "Click to upload or drag and drop"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4 text-muted-foreground" />
              Additional Attachment (Optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.mp4,.mov,.jpg,.jpeg,.png"
              className="block w-full text-xs text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-xs file:font-semibold
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20 cursor-pointer"
              onChange={(e) => setAdditionalAttachment(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={loading}
            className="px-8"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : "Apply Now"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}