import type { NextApiRequest, NextApiResponse } from "next";
import { getCognitoIdFromRequest } from "../../../lib/api-auth";
import { prisma } from "../../../lib/prisma";

async function requireAdmin(req: NextApiRequest) {
  const cognitoId = getCognitoIdFromRequest(req);
  if (!cognitoId) return null;
  const user = await prisma.users.findUnique({ where: { cognito_id: cognitoId }, select: { user_id: true, user_type: true } });
  return user?.user_type === "admin" ? user : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!(await requireAdmin(req))) return res.status(403).json({ error: "Admin access required" });

  if (req.method === "GET") {
    const status = String(req.query.status || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 250);
    const jobs = await prisma.email_jobs.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        job_id: true, template_key: true, status: true, to_email: true,
        subject: true, scheduled_at: true, sent_at: true, attempt_count: true,
        provider_message_id: true, last_error: true, created_at: true,
      },
    });
    return res.status(200).json({ jobs });
  }

  if (req.method === "POST") {
    const jobId = String(req.body?.jobId || "").trim();
    if (!jobId) return res.status(400).json({ error: "jobId is required" });
    const job = await prisma.email_jobs.updateMany({
      where: { job_id: jobId, status: "failed" },
      data: { status: "queued", scheduled_at: new Date(), last_error: null },
    });
    return res.status(job.count ? 200 : 404).json({ retried: Boolean(job.count) });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
