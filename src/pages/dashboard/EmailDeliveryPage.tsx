import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuthCheck } from "@/hooks/useAuthCheck";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type EmailJob = {
  job_id: string;
  template_key: string;
  status: string;
  to_email: string;
  subject: string;
  scheduled_at: string;
  sent_at: string | null;
  attempt_count: number;
  provider_message_id: string | null;
  last_error: string | null;
};

const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString() : "—";

export default function EmailDeliveryPage() {
  const { isLoading } = useAuthCheck();
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const response = await fetch("/api/admin/email-jobs");
    const data = await response.json();
    setJobs(data.jobs || []);
    setLoading(false);
  };

  useEffect(() => { if (!isLoading) void load(); }, [isLoading]);

  if (isLoading || loading) return <LoadingSpinner />;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-purple">Email delivery</h1>
            <p className="text-sm text-muted-foreground">Outbox records, SES delivery IDs, failures, and retry state.</p>
          </div>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => void load()}>Refresh</button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/30">
              <tr>{["Status", "Template", "Recipient", "Scheduled", "Sent", "Attempts", "Details"].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody>
              {jobs.map((job) => <tr key={job.job_id} className="border-b last:border-0">
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{job.status}</span></td>
                <td className="px-4 py-3 font-mono text-xs">{job.template_key}</td>
                <td className="px-4 py-3">{job.to_email}<div className="text-xs text-muted-foreground">{job.subject}</div></td>
                <td className="whitespace-nowrap px-4 py-3">{dateLabel(job.scheduled_at)}</td>
                <td className="whitespace-nowrap px-4 py-3">{dateLabel(job.sent_at)}</td>
                <td className="px-4 py-3">{job.attempt_count}</td>
                <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">{job.provider_message_id || job.last_error || job.job_id}</td>
              </tr>)}
              {!jobs.length && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No email jobs found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
