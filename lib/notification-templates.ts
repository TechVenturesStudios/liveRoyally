import { queueEmail } from "./email-outbox";
import { getAppBaseUrl } from "./app-url";
import { escapeHtml } from "./email-template";
import { prisma } from "./prisma";

type Role = "member" | "provider" | "partner";

const roleCopy: Record<Role, { valueProp: string; step2: string; step3: string }> = {
  member: {
    valueProp: "discover local offers and experiences that support your community",
    step2: "Explore available events and offers",
    step3: "Claim your first voucher",
  },
  provider: {
    valueProp: "connect your business with local members and community opportunities",
    step2: "Review your business profile",
    step3: "Review pending event invitations",
  },
  partner: {
    valueProp: "grow your organization through meaningful local partnerships",
    step2: "Review your organization profile",
    step3: "Invite providers and publish your first event",
  },
};

function roleLabel(role: Role) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function layout(preheader: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>${body}<p>The Local Metrics Team</p></div>`;
}

async function notificationsEnabled(userId: string) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      member_profiles: { select: { notification_enabled: true } },
      provider_profiles: { select: { notification_enabled: true } },
      partner_profiles: { select: { notification_enabled: true } },
    },
  });

  return Boolean(
    user?.member_profiles?.notification_enabled ??
    user?.provider_profiles?.notification_enabled ??
    user?.partner_profiles?.notification_enabled
  );
}

export async function queueTemporaryPasswordEmail(input: {
  email: string;
  temporaryPassword: string;
  userType?: string | null;
}) {
  const loginUrl = `${(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/login`;
  const accountType = input.userType ? roleLabel(input.userType as Role) : "Local Metrics";
  const subject = "Your temporary Local Metrics login password";
  const preheader = "Use this temporary password to sign in and create your permanent password.";
  const textBody = [
    "Welcome to Local Metrics!", "",
    `Your ${accountType} account is ready. Use the details below to sign in:`, "",
    `Email: ${input.email}`,
    `Temporary password: ${input.temporaryPassword}`, "",
    `Sign in: ${loginUrl}`, "",
    "You will be prompted to create a new password after signing in.", "",
    "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `<p>Welcome to Local Metrics!</p><p>Your <strong>${escapeHtml(accountType)}</strong> account is ready. Use the details below to sign in:</p><p><strong>Email:</strong> ${escapeHtml(input.email)}<br /><strong>Temporary password:</strong> <code>${escapeHtml(input.temporaryPassword)}</code></p><p><a href="${escapeHtml(loginUrl)}">Sign in to Local Metrics</a></p><p>You will be prompted to create a new password after signing in.</p>`);

  return queueEmail({
    idempotencyKey: `temporary-password:${input.email.trim().toLowerCase()}`,
    templateKey: "account.temporary_password",
    toEmail: input.email,
    subject,
    textBody,
    htmlBody,
    payload: { userType: input.userType || null },
    priority: "high",
  });
}

export type AuthorizedRepresentativeInviteEmailInput = {
  assignmentId: string;
  memberId: string;
  toEmail: string;
  firstName?: string | null;
  inviterName: string;
  inviterRole: string;
  acceptRepInviteLink: string;
  inviteToken?: string;
};

export async function queueAuthorizedRepresentativeInviteEmail(input: AuthorizedRepresentativeInviteEmailInput) {
  if (!(await notificationsEnabled(input.memberId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = `${input.inviterName} invited you to be a Representative`;
  const preheader = `Accept to help manage ${input.inviterName}'s account on Local Metrics.`;
  const permissions = [
    "help manage the account at events",
    "represent the account when interacting with Local Metrics",
  ];
  const textBody = [
    `Hi ${firstName},`, "",
    `${input.inviterName} (${input.inviterRole}) has invited you to become a Representative on their Local Metrics account.`, "",
    "As a Representative, you'll be able to:",
    ...permissions.map((permission) => `- ${permission}`), "",
    `Accept invitation: ${input.acceptRepInviteLink}`, "",
    "If you weren't expecting this invite, you can safely ignore this email.", "", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p><strong>${escapeHtml(input.inviterName)}</strong> (${escapeHtml(input.inviterRole)}) has invited you to become a Representative on their Local Metrics account.</p>
    <p>As a Representative, you'll be able to:</p>
    <ul>${permissions.map((permission) => `<li>${escapeHtml(permission)}</li>`).join("")}</ul>
    <p><a href="${escapeHtml(input.acceptRepInviteLink)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px">Accept invitation</a></p>
    <p>If you weren't expecting this invite, you can safely ignore this email.</p>
  `);

  return queueEmail({
    idempotencyKey: `authorized-representative-invite:${input.assignmentId}:${input.inviteToken || "initial"}`,
    templateKey: "member.authorized_representative_invitation",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.memberId,
    relatedEntityType: "authorized_representative_assignment",
    relatedEntityId: input.assignmentId,
    payload: { ...input, firstName, permissions },
  });
}

export type PublishedEventMemberEmailInput = {
  eventId: string;
  memberId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventShortDescription: string;
  eventLink: string;
};

export async function queuePublishedEventMemberEmail(input: PublishedEventMemberEmailInput) {
  if (!(await notificationsEnabled(input.memberId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = `New event near you: ${input.eventName}`;
  const preheader = `${input.partnerName} just published a new event — don't miss out.`;
  const textBody = [
    `Hi ${firstName},`, "",
    `${input.partnerName} just published a new event in your network:`, "",
    input.eventName, `📅 ${input.eventDate}`, `📍 ${input.eventLocation}`, "",
    input.eventShortDescription, "",
    `View event & claim your voucher: ${input.eventLink}`, "", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>${escapeHtml(input.partnerName)} just published a new event in your network:</p>
    <p><strong>${escapeHtml(input.eventName)}</strong><br />
      📅 ${escapeHtml(input.eventDate)}<br />
      📍 ${escapeHtml(input.eventLocation)}</p>
    <p>${escapeHtml(input.eventShortDescription)}</p>
    <p><a href="${escapeHtml(input.eventLink)}">View event &amp; claim your voucher</a></p>
  `);

  return queueEmail({
    idempotencyKey: `event-member-published:${input.eventId}:${input.memberId}`,
    templateKey: "member.event_published",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.memberId,
    relatedEntityType: "event",
    relatedEntityId: input.eventId,
    payload: { ...input, firstName },
  });
}

export type PointsTier = {
  tierName: string;
  pointsThreshold: number;
  tierBenefit: string;
};

export type PointsTierGuideEmailInput = {
  userId: string;
  toEmail: string;
  firstName?: string | null;
  earnRules: [string, string, string] | string[];
  tiers: PointsTier[];
  currentPoints: number;
  currentTier: string;
  pointsToNextTier: number;
  nextTier: string;
  dashboardLink: string;
  idempotencyKey?: string;
};

export function queuePointsTierGuideEmail(input: PointsTierGuideEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = "How Local Metrics Points & Tiers work";
  const preheader = "Earn more, unlock more — here's the breakdown.";
  const earnRules = input.earnRules.slice(0, 3);
  const tierLines = input.tiers.map(
    (tier) => `- ${tier.tierName}: ${tier.pointsThreshold} points — ${tier.tierBenefit}`
  );
  const textBody = [
    `Hi ${firstName},`, "",
    "Here's a quick guide to earning and using points on Local Metrics:", "",
    "EARNING POINTS",
    ...earnRules.map((rule) => `- ${rule}`), "",
    "TIERS",
    ...tierLines, "",
    `You're currently at ${input.currentPoints} points (${input.currentTier} tier). ${input.pointsToNextTier} more points to reach ${input.nextTier}!`, "",
    `View your dashboard: ${input.dashboardLink}`, "", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Here's a quick guide to earning and using points on Local Metrics:</p>
    <p><strong>EARNING POINTS</strong></p>
    <ul>${earnRules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}</ul>
    <p><strong>TIERS</strong></p>
    <ul>${input.tiers.map((tier) => `<li><strong>${escapeHtml(tier.tierName)}</strong>: ${tier.pointsThreshold} points — ${escapeHtml(tier.tierBenefit)}</li>`).join("")}</ul>
    <p>You're currently at <strong>${input.currentPoints} points</strong> (${escapeHtml(input.currentTier)} tier). ${input.pointsToNextTier} more points to reach ${escapeHtml(input.nextTier)}!</p>
    <p><a href="${escapeHtml(input.dashboardLink)}">View your dashboard</a></p>
  `);

  return queueEmail({
    idempotencyKey: input.idempotencyKey || `points-tier-guide:${input.userId}:${Date.now()}`,
    templateKey: "member.points_tier_guide",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.userId,
    payload: { ...input, firstName, earnRules },
  });
}

export async function queueMemberPointsTierGuideEmail(input: {
  userId: string;
  dashboardLink: string;
  idempotencyKey?: string;
}) {
  const year = new Date().getFullYear();
  const [user, rewardAccount, tiers, tasks] = await Promise.all([
    prisma.users.findUnique({
      where: { user_id: input.userId },
      select: { email: true, first_name: true, user_type: true },
    }),
    prisma.reward_accounts.findUnique({
      where: { user_id_reward_year: { user_id: input.userId, reward_year: year } },
      select: { points_balance: true },
    }),
    prisma.reward_tiers.findMany({
      where: { user_type: "member", active: true },
      orderBy: [{ min_points: "asc" }, { display_order: "asc" }],
      select: { name: true, min_points: true },
    }),
    prisma.reward_tasks.findMany({
      where: { user_type: "member", active: true },
      orderBy: [{ display_order: "asc" }, { created_at: "asc" }],
      take: 3,
      select: { name: true, description: true },
    }),
  ]);

  if (!user || user.user_type !== "member" || !user.email?.trim()) return null;

  const currentPoints = rewardAccount?.points_balance ?? 0;
  const currentTier = [...tiers].reverse().find((tier) => tier.min_points <= currentPoints) ?? tiers[0];
  const nextTier = tiers.find((tier) => tier.min_points > currentPoints) ?? null;
  const earnRules = tasks.map((task) => task.description?.trim() ? `${task.name}: ${task.description.trim()}` : task.name);

  return queuePointsTierGuideEmail({
    userId: input.userId,
    toEmail: user.email,
    firstName: user.first_name,
    earnRules,
    tiers: tiers.map((tier) => ({
      tierName: tier.name,
      pointsThreshold: tier.min_points,
      tierBenefit: `Continue earning points to reach the ${tier.name} tier.`,
    })),
    currentPoints,
    currentTier: currentTier?.name || "Explorer",
    pointsToNextTier: nextTier ? Math.max(0, nextTier.min_points - currentPoints) : 0,
    nextTier: nextTier?.name || currentTier?.name || "top tier",
    dashboardLink: input.dashboardLink,
    idempotencyKey: input.idempotencyKey,
  });
}

export type VoucherExpiringSoonEmailInput = {
  voucherId: string;
  memberId: string;
  toEmail: string;
  firstName?: string | null;
  eventName: string;
  voucherName: string;
  expirationDate: string;
  daysRemaining: number;
  claimLink: string;
};

export async function queueVoucherExpiringSoonEmail(input: VoucherExpiringSoonEmailInput) {
  if (!(await notificationsEnabled(input.memberId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = `⏰ Your voucher for ${input.eventName} expires in 3 days`;
  const preheader = `Don't miss out — claim it before ${input.expirationDate}.`;
  const textBody = [
    `Hi ${firstName},`, "",
    `Just a heads up — your voucher for ${input.eventName} is still unclaimed, and time is running out.`, "",
    `Voucher: ${input.voucherName}`,
    `Expires: ${input.expirationDate} (${input.daysRemaining} days left)`, "",
    `Claim it now: ${input.claimLink}`, "",
    "Don't let it go to waste!", "", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>Just a heads up — your voucher for <strong>${escapeHtml(input.eventName)}</strong> is still unclaimed, and time is running out.</p>
    <p><strong>Voucher:</strong> ${escapeHtml(input.voucherName)}<br />
      <strong>Expires:</strong> ${escapeHtml(input.expirationDate)} (${input.daysRemaining} days left)</p>
    <p><a href="${escapeHtml(input.claimLink)}">Claim it now</a></p>
    <p>Don't let it go to waste!</p>
  `);

  return queueEmail({
    idempotencyKey: `voucher-expiring-soon:${input.voucherId}:${input.memberId}`,
    templateKey: "member.voucher_expiring_soon",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.memberId,
    relatedEntityType: "voucher",
    relatedEntityId: input.voucherId,
    payload: { ...input, firstName },
    priority: "high",
  });
}

export type RecentMemberEvent = {
  eventName: string;
  partnerName: string;
};

export type MemberInactiveEmailInput = {
  memberId: string;
  toEmail: string;
  firstName?: string | null;
  recentEvents: RecentMemberEvent[];
  browseLink: string;
  reminderDate: string;
};

export async function queueMemberInactiveEmail(input: MemberInactiveEmailInput) {
  if (!(await notificationsEnabled(input.memberId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = `We miss you, ${firstName} — here's what's new`;
  const preheader = "New events and offers are waiting for you.";
  const textBody = [
    `Hi ${firstName},`, "", "",
    "It's been a little while since you've claimed a voucher on Local Metrics. Here's what you might have missed:", "", "",
    ...input.recentEvents.map((event) => `- ${event.eventName} — ${event.partnerName}`), "", "",
    `Browse current offers: ${input.browseLink}`, "", "",
    "We'd love to see you back,", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>It's been a little while since you've claimed a voucher on Local Metrics. Here's what you might have missed:</p>
    <ul>${input.recentEvents.map((event) => `<li>${escapeHtml(event.eventName)} — ${escapeHtml(event.partnerName)}</li>`).join("")}</ul>
    <p><a href="${escapeHtml(input.browseLink)}">Browse current offers</a></p>
    <p>We'd love to see you back,</p>
  `);

  return queueEmail({
    idempotencyKey: `member-inactive-no-claims:${input.memberId}:${input.reminderDate}`,
    templateKey: "member.inactive_no_voucher_claims",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.memberId,
    relatedEntityType: "user",
    relatedEntityId: input.memberId,
    payload: { ...input, firstName },
  });
}

export type PartnerInactiveEmailInput = {
  partnerId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  createEventLink: string;
  supportEmail: string;
  reminderDate: string;
};

export async function queuePartnerInactiveEmail(input: PartnerInactiveEmailInput) {
  if (!(await notificationsEnabled(input.partnerId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = "Ready to create your next event?";
  const preheader = "It's been 30 days since your last event — let's get one live.";
  const textBody = [
    `Hi ${firstName},`, "", "",
    `It's been about 30 days since ${input.partnerName} last published an event on Local Metrics. Your network of members is ready for what's next.`, "", "",
    `Create a new event: ${input.createEventLink}`, "", "",
    `Need help or ideas? Reach out to your account manager at ${input.supportEmail}.`, "", "",
    "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>It's been about 30 days since <strong>${escapeHtml(input.partnerName)}</strong> last published an event on Local Metrics. Your network of members is ready for what's next.</p>
    <p><a href="${escapeHtml(input.createEventLink)}">Create a new event</a></p>
    <p>Need help or ideas? Reach out to your account manager at <a href="mailto:${escapeHtml(input.supportEmail)}">${escapeHtml(input.supportEmail)}</a>.</p>
  `);

  return queueEmail({
    idempotencyKey: `partner-inactive-no-event:${input.partnerId}:${input.reminderDate}`,
    templateKey: "partner.inactive_no_event",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.partnerId,
    relatedEntityType: "user",
    relatedEntityId: input.partnerId,
    payload: { ...input, firstName },
  });
}

export type UpcomingEventReminderEmailInput = {
  eventId: string;
  recipientId: string;
  toEmail: string;
  firstName?: string | null;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventTime: string;
  daysUntilEvent: number;
  eventLink: string;
  isMember?: boolean;
  isProvider?: boolean;
  isPartner?: boolean;
  voucherName?: string | null;
  voucherInstructions?: string | null;
  providerInstructions?: string | null;
  eventManageLink?: string | null;
};

export async function queueUpcomingEventReminderEmail(input: UpcomingEventReminderEmailInput) {
  if (!(await notificationsEnabled(input.recipientId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const subject = `Reminder: ${input.eventName} is coming up on ${input.eventDate}`;
  const preheader = `${input.daysUntilEvent} days to go — here are the details.`;
  const roleLines = [
    input.isMember ? `Your voucher: ${input.voucherName || "Local Metrics voucher"} — ${input.voucherInstructions || "Review your voucher details before attending."}` : null,
    input.isProvider ? `Your participation details: ${input.providerInstructions || "Review your accepted event invitation."}` : null,
    input.isPartner ? `Event management: ${input.eventManageLink || "Open your partner dashboard."}` : null,
  ].filter(Boolean) as string[];
  const textBody = [
    `Hi ${firstName},`, "",
    `This is a reminder that ${input.eventName} is happening soon.`, "",
    `📅 ${input.eventDate}`, `📍 ${input.eventLocation}`, `🕐 ${input.eventTime}`, "",
    ...roleLines, "", `View full event details: ${input.eventLink}`, "", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p>This is a reminder that <strong>${escapeHtml(input.eventName)}</strong> is happening soon.</p>
    <p>📅 ${escapeHtml(input.eventDate)}<br />📍 ${escapeHtml(input.eventLocation)}<br />🕐 ${escapeHtml(input.eventTime)}</p>
    ${input.isMember ? `<p><strong>Your voucher:</strong> ${escapeHtml(input.voucherName || "Local Metrics voucher")} — ${escapeHtml(input.voucherInstructions || "Review your voucher details before attending.")}</p>` : ""}
    ${input.isProvider ? `<p><strong>Your participation details:</strong> ${escapeHtml(input.providerInstructions || "Review your accepted event invitation.")}</p>` : ""}
    ${input.isPartner ? `<p><strong>Event management:</strong> <a href="${escapeHtml(input.eventManageLink || input.eventLink)}">Open event management</a></p>` : ""}
    <p><a href="${escapeHtml(input.eventLink)}">View full event details</a></p>
  `);

  return queueEmail({
    idempotencyKey: `event-upcoming-reminder:${input.eventId}:${input.recipientId}:${input.daysUntilEvent}`,
    templateKey: "event.upcoming_reminder",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.recipientId,
    relatedEntityType: "event",
    relatedEntityId: input.eventId,
    payload: { ...input, firstName },
  });
}

export type EventChangedEmailInput = {
  eventId: string;
  recipientId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  eventName: string;
  changeSummary: string;
  eventDate: string;
  eventLocation: string;
  eventLink: string;
  partnerContactEmail?: string | null;
};

export async function queueEventChangedEmail(input: EventChangedEmailInput) {
  if (!(await notificationsEnabled(input.recipientId))) return null;
  const firstName = input.firstName?.trim() || "there";
  const subject = `Update: ${input.eventName} details have changed`;
  const preheader = "Here's what changed for the event you're part of.";
  const textBody = [
    `Hi ${firstName},`, "",
    `${input.partnerName} made changes to ${input.eventName}, which you're part of. Here's what's new:`, "",
    input.changeSummary, "", "Updated details:", `📅 ${input.eventDate}`, `📍 ${input.eventLocation}`, "",
    `Please review the updated event: ${input.eventLink}`,
    input.partnerContactEmail ? "" : null,
    input.partnerContactEmail ? `If these changes affect your plans, contact ${input.partnerName} at ${input.partnerContactEmail}.` : null,
    "", "The Local Metrics Team",
  ].filter((line): line is string => line !== null).join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p><strong>${escapeHtml(input.partnerName)}</strong> made changes to <strong>${escapeHtml(input.eventName)}</strong>, which you're part of. Here's what's new:</p>
    <p>${escapeHtml(input.changeSummary).replace(/\n/g, "<br />")}</p>
    <p><strong>Updated details:</strong><br />📅 ${escapeHtml(input.eventDate)}<br />📍 ${escapeHtml(input.eventLocation)}</p>
    <p><a href="${escapeHtml(input.eventLink)}">Please review the updated event</a></p>
    ${input.partnerContactEmail ? `<p>If these changes affect your plans, contact ${escapeHtml(input.partnerName)} at <a href="mailto:${escapeHtml(input.partnerContactEmail)}">${escapeHtml(input.partnerContactEmail)}</a>.</p>` : ""}
  `);
  return queueEmail({
    idempotencyKey: `event-changed:${input.eventId}:${input.recipientId}:${Buffer.from(input.changeSummary).toString("base64url").slice(0, 40)}`,
    templateKey: "event.changed",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.recipientId,
    relatedEntityType: "event",
    relatedEntityId: input.eventId,
    payload: { ...input, firstName },
  });
}

export type ReferralEmailInput = {
  referralId: string;
  toEmail: string;
  referrerName: string;
  referralSignupLink: string;
  referralIncentiveDescription?: string;
};

export function queueReferralEmail(input: ReferralEmailInput) {
  const subject = `${input.referrerName} thinks you'd love Local Metrics`;
  const preheader = "Join with their referral link and start earning rewards.";
  const incentive = input.referralIncentiveDescription || "a future Local Metrics reward (details coming soon)";
  const textBody = [
    "Hi there,",
    `${input.referrerName} has invited you to join Local Metrics — a rewards platform where you earn points and unlock exclusive offers from local partners.`, "",
    `Sign up with this invite and you'll both get ${incentive}.`, "", `Join now: ${input.referralSignupLink}`, "", "See you inside,", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `<p>Hi there,</p><p><strong>${escapeHtml(input.referrerName)}</strong> has invited you to join Local Metrics — a rewards platform where you earn points and unlock exclusive offers from local partners.</p><p>Sign up with this invite and you'll both get ${escapeHtml(incentive)}.</p><p><a href="${escapeHtml(input.referralSignupLink)}">Join now</a></p><p>See you inside,</p>`);
  return queueEmail({
    idempotencyKey: `referral-invite:${input.referralId}`,
    templateKey: "member.referral_invitation",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    relatedEntityType: "referral",
    relatedEntityId: input.referralId,
    payload: input,
  });
}

export type PartnerApprovedEmailInput = {
  partnerId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  createEventLink: string;
  inviteProviderLink: string;
  manageTeamLink: string;
  loginLink: string;
};

export async function queuePartnerApprovedEmail(input: PartnerApprovedEmailInput) {
  if (!(await notificationsEnabled(input.partnerId))) return null;
  const firstName = input.firstName?.trim() || "there";
  const subject = "You're approved! Welcome to Local Metrics as a Partner";
  const preheader = "Your account is live — start building your first event.";
  const textBody = [`Hi ${firstName},`, "", `Great news — ${input.partnerName}'s Local Metrics partner account has been approved!`, "", `Create and publish events: ${input.createEventLink}`, `Invite providers to participate: ${input.inviteProviderLink}`, `Manage your team and representatives: ${input.manageTeamLink}`, "", `Log in to get started: ${input.loginLink}`, "", "Welcome to Local Metrics,", "The Local Metrics Team"].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p>Great news — <strong>${escapeHtml(input.partnerName)}</strong>'s Local Metrics partner account has been approved!</p><ul><li><a href="${escapeHtml(input.createEventLink)}">Create and publish events</a></li><li><a href="${escapeHtml(input.inviteProviderLink)}">Invite providers to participate</a></li><li><a href="${escapeHtml(input.manageTeamLink)}">Manage your team and representatives</a></li></ul><p><a href="${escapeHtml(input.loginLink)}">Log in to get started</a></p><p>Welcome to Local Metrics,</p>`);
  return queueEmail({ idempotencyKey: `partner-approved:${input.partnerId}`, templateKey: "partner.account_approved", toEmail: input.toEmail, subject, textBody, htmlBody, userId: input.partnerId, relatedEntityType: "user", relatedEntityId: input.partnerId, payload: { ...input, firstName } });
}

export type PartnerDeclinedEmailInput = {
  partnerId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  supportEmail: string;
};

export async function queuePartnerDeclinedEmail(input: PartnerDeclinedEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = "Your Local Metrics partner account application was declined";
  const preheader = "An update about your Local Metrics partner application.";
  const textBody = [
    `Hi ${firstName},`,
    "",
    `Thank you for applying for ${input.partnerName} to join Local Metrics as a Partner. After review, we were unable to approve the application at this time.`,
    "",
    `If you have questions or would like more information, please contact us at ${input.supportEmail}.`,
    "",
    "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(
    preheader,
    `<p>Hi ${escapeHtml(firstName)},</p><p>Thank you for applying for <strong>${escapeHtml(input.partnerName)}</strong> to join Local Metrics as a Partner. After review, we were unable to approve the application at this time.</p><p>If you have questions or would like more information, please contact us at <a href="mailto:${escapeHtml(input.supportEmail)}">${escapeHtml(input.supportEmail)}</a>.</p>`,
  );

  return queueEmail({
    idempotencyKey: `partner-declined:${input.partnerId}`,
    templateKey: "partner.account_declined",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    userId: input.partnerId,
    relatedEntityType: "user",
    relatedEntityId: input.partnerId,
    payload: { ...input, firstName },
  });
}

export type ProviderInvitationEmailInput = {
  inviteId: string;
  providerId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  eventName?: string | null;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  acceptInviteLink: string;
  inviteExpirationDate?: string | null;
};

export async function queueProviderInvitationEmail(input: ProviderInvitationEmailInput) {
  if (!(await notificationsEnabled(input.providerId))) return null;
  const firstName = input.firstName?.trim() || "there";
  const subject = `${input.partnerName} invited you to join Local Metrics as a Provider`;
  const preheader = "Accept the invite to start participating in their events.";
  const eventCopy = input.eventName ? ` for ${input.eventName}` : "";
  const textBody = [`Hi ${firstName},`, "", `${input.partnerName} has invited you to join Local Metrics as a Provider${eventCopy}.`, "", "As a Provider, you'll be able to:", "- Participate in partner events", "- Reach a network of engaged members", "- Grow your local business network", "", `Accept invitation: ${input.acceptInviteLink}`, input.inviteExpirationDate ? "" : null, input.inviteExpirationDate ? `This invite expires on ${input.inviteExpirationDate}.` : null, "", "The Local Metrics Team"].filter((line): line is string => line !== null).join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p><strong>${escapeHtml(input.partnerName)}</strong> has invited you to join Local Metrics as a Provider${input.eventName ? ` for <strong>${escapeHtml(input.eventName)}</strong>` : ""}.</p><ul><li>Participate in partner events</li><li>Reach a network of engaged members</li><li>Grow your local business network</li></ul><p><a href="${escapeHtml(input.acceptInviteLink)}">Accept invitation</a></p>${input.inviteExpirationDate ? `<p>This invite expires on ${escapeHtml(input.inviteExpirationDate)}.</p>` : ""}`);
  return queueEmail({ idempotencyKey: `provider-invitation:${input.inviteId}`, templateKey: "provider.invitation", toEmail: input.toEmail, subject, textBody, htmlBody, userId: input.providerId, relatedEntityType: "event_provider_invite", relatedEntityId: input.inviteId, payload: { ...input, firstName } });
}

export type ProviderNetworkInvitationEmailInput = {
  invitationId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  partnerCode: string;
  acceptInviteLink: string;
};

export async function queueProviderNetworkInvitationEmail(input: ProviderNetworkInvitationEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = `${input.partnerName} invited you to join their provider network`;
  const preheader = "Complete your provider registration to join the network.";
  const textBody = [
    `Hi ${firstName},`,
    "",
    `${input.partnerName} has invited your business to join their provider network on Local Metrics.`,
    "",
    `Complete your provider registration here: ${input.acceptInviteLink}`,
    "",
    "If you were not expecting this invitation, you can safely ignore this email.",
    "",
    "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(
    preheader,
    `<p>Hi ${escapeHtml(firstName)},</p><p><strong>${escapeHtml(input.partnerName)}</strong> has invited your business to join their provider network on Local Metrics.</p><p><a href="${escapeHtml(input.acceptInviteLink)}">Complete provider registration</a></p><p>If you were not expecting this invitation, you can safely ignore this email.</p>`,
  );

  return queueEmail({
    idempotencyKey: `provider-network-invitation:${input.invitationId}`,
    templateKey: "provider.network_invitation",
    toEmail: input.toEmail,
    subject,
    textBody,
    htmlBody,
    relatedEntityType: "partner_provider_invitation",
    relatedEntityId: input.invitationId,
    payload: { ...input, firstName },
  });
}

export type CampaignResultsEmailInput = {
  eventId: string;
  partnerId: string;
  toEmail: string;
  firstName?: string | null;
  eventName: string;
  vouchersClaimed: number;
  vouchersRedeemed: number;
  newMembersReached: number;
  providerCount: number;
  createEventLink: string;
};

export async function queueCampaignResultsEmail(input: CampaignResultsEmailInput) {
  if (!(await notificationsEnabled(input.partnerId))) return null;
  const firstName = input.firstName?.trim() || "there";
  const subject = `Results are in for ${input.eventName}`;
  const preheader = "See how your event performed.";
  const textBody = [`Hi ${firstName},`, "", `${input.eventName} has wrapped up. Here's how it performed:`, "", `📊 Vouchers claimed: ${input.vouchersClaimed}`, `📊 Vouchers redeemed: ${input.vouchersRedeemed}`, `📊 New members reached: ${input.newMembersReached}`, `📊 Participating providers: ${input.providerCount}`, "", `Ready to plan your next event? ${input.createEventLink}`, "", "The Local Metrics Team"].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p><strong>${escapeHtml(input.eventName)}</strong> has wrapped up. Here's how it performed:</p><ul><li>📊 Vouchers claimed: ${input.vouchersClaimed}</li><li>📊 Vouchers redeemed: ${input.vouchersRedeemed}</li><li>📊 New members reached: ${input.newMembersReached}</li><li>📊 Participating providers: ${input.providerCount}</li></ul><p>Ready to plan your next event? <a href="${escapeHtml(input.createEventLink)}">Create a new event</a></p>`);
  return queueEmail({ idempotencyKey: `campaign-results:${input.eventId}:${input.partnerId}`, templateKey: "partner.campaign_results", toEmail: input.toEmail, subject, textBody, htmlBody, userId: input.partnerId, relatedEntityType: "event", relatedEntityId: input.eventId, payload: { ...input, firstName } });
}

export type ProviderRemovedEmailInput = {
  providerId: string;
  toEmail: string;
  firstName?: string | null;
  partnerName: string;
  lrnJoinLink: string;
  supportEmail: string;
};

export async function queueProviderRemovedEmail(input: ProviderRemovedEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = `You've been removed from ${input.partnerName} — explore Local Metrics's Local Rewards Network`;
  const preheader = "Stay connected with new opportunities on Local Metrics.";
  const textBody = [`Hi ${firstName},`, "", `${input.partnerName} has removed you as a participating provider on their Local Metrics account.`, "", "You're still a valued part of the Local Metrics community. Consider joining LRN (Local Rewards Network) to connect with other partners and continue participating in events:", "", `Join LRN: ${input.lrnJoinLink}`, "", `Questions? Reach out to us at ${input.supportEmail}.`, "", "The Local Metrics Team"].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p><strong>${escapeHtml(input.partnerName)}</strong> has removed you as a participating provider on their Local Metrics account.</p><p>You're still a valued part of the Local Metrics community. Consider joining LRN (Local Rewards Network) to connect with other partners and continue participating in events:</p><p><a href="${escapeHtml(input.lrnJoinLink)}">Join LRN</a></p><p>Questions? Reach out to us at <a href="mailto:${escapeHtml(input.supportEmail)}">${escapeHtml(input.supportEmail)}</a>.</p>`);
  return queueEmail({ idempotencyKey: `provider-removed:${input.providerId}:${Date.now()}`, templateKey: "provider.removed_from_partner", toEmail: input.toEmail, subject, textBody, htmlBody, userId: input.providerId, relatedEntityType: "user", relatedEntityId: input.providerId, payload: { ...input, firstName } });
}

export async function queueWelcomeEmail(userId: string, role: Role) {
  const user = await prisma.users.findUnique({ where: { user_id: userId }, select: { email: true, first_name: true } });
  if (!user?.email) return null;
  const firstName = user.first_name?.trim() || "there";
  const copy = roleCopy[role];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  const profileLink = `${baseUrl.replace(/\/$/, "")}/dashboard/profile`;
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@localmetrics.com";
  const subject = `Welcome to Local Metrics, ${firstName}! 🎉`;
  const preheader = "Your account is ready — here's how to get started.";
  const textBody = [
    `Hi ${firstName},`, "", `Welcome to Local Metrics! Your ${roleLabel(role)} account has been created successfully.`, "",
    `Local Metrics makes it easy to ${copy.valueProp}.`, "", "Here's how to get started:",
    `1. Complete your profile: ${profileLink}`, `2. ${copy.step2}`, `3. ${copy.step3}`, "",
    `If you have any questions, our support team is here to help at ${supportEmail}.`, "", "Welcome aboard,", "The Local Metrics Team",
  ].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p>Welcome to Local Metrics! Your <strong>${roleLabel(role)}</strong> account has been created successfully.</p><p>Local Metrics makes it easy to ${escapeHtml(copy.valueProp)}.</p><p>Here's how to get started:</p><ol><li>Complete your profile: <a href="${profileLink}">${profileLink}</a></li><li>${escapeHtml(copy.step2)}</li><li>${escapeHtml(copy.step3)}</li></ol><p>If you have any questions, our support team is here to help at <a href="mailto:${supportEmail}">${escapeHtml(supportEmail)}</a>.</p><p>Welcome aboard,</p>`);
  return queueEmail({
    idempotencyKey: `welcome:${userId}`,
    templateKey: "account.welcome",
    toEmail: user.email,
    subject,
    textBody,
    htmlBody,
    userId,
    payload: { role, firstName, roleName: roleLabel(role), roleValueProp: copy.valueProp },
  });
}

export async function queueProfileUpdatedEmail(input: {
  userId: string;
  firstName?: string | null;
  email: string;
  changedFieldDescription: string;
}) {
  if (!(await notificationsEnabled(input.userId))) return null;

  const firstName = input.firstName?.trim() || "there";
  const secureAccountLink = `${(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/login`;
  const changeDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  const subject = "Your Local Metrics profile was updated";
  const preheader = "We're confirming a recent change to your account.";
  const textBody = [`Hi ${firstName},`, "", `This is a confirmation that the following change was made to your account on ${changeDate}:`, "", input.changedFieldDescription, "", "If you made this change, no action is needed.", `If you did NOT make this change, please secure your account immediately: ${secureAccountLink}`, "", "The Local Metrics Team"].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p>This is a confirmation that the following change was made to your account on ${escapeHtml(changeDate)}:</p><p><strong>${escapeHtml(input.changedFieldDescription)}</strong></p><p>If you made this change, no action is needed.</p><p>If you did <strong>NOT</strong> make this change, please <a href="${secureAccountLink}">secure your account immediately</a>.</p>`);
  return queueEmail({
    idempotencyKey: `profile-updated:${input.userId}:${Date.now()}`,
    templateKey: "account.profile_updated",
    toEmail: input.email,
    subject,
    textBody,
    htmlBody,
    userId: input.userId,
    payload: { changedFieldDescription: input.changedFieldDescription, changeDate },
  });
}
