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
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div>${body}<p>The Royally Team</p></div>`;
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

export function queueAuthorizedRepresentativeInviteEmail(input: AuthorizedRepresentativeInviteEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = `${input.inviterName} invited you to be a Representative`;
  const preheader = `Accept to help manage ${input.inviterName}'s account on Royally.`;
  const permissions = [
    "help manage the account at events",
    "represent the account when interacting with Royally",
  ];
  const textBody = [
    `Hi ${firstName},`, "",
    `${input.inviterName} (${input.inviterRole}) has invited you to become a Representative on their Royally account.`, "",
    "As a Representative, you'll be able to:",
    ...permissions.map((permission) => `- ${permission}`), "",
    `Accept invitation: ${input.acceptRepInviteLink}`, "",
    "If you weren't expecting this invite, you can safely ignore this email.", "", "The Royally Team",
  ].join("\n");
  const htmlBody = layout(preheader, `
    <p>Hi ${escapeHtml(firstName)},</p>
    <p><strong>${escapeHtml(input.inviterName)}</strong> (${escapeHtml(input.inviterRole)}) has invited you to become a Representative on their Royally account.</p>
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

export function queuePublishedEventMemberEmail(input: PublishedEventMemberEmailInput) {
  const firstName = input.firstName?.trim() || "there";
  const subject = `New event near you: ${input.eventName}`;
  const preheader = `${input.partnerName} just published a new event — don't miss out.`;
  const textBody = [
    `Hi ${firstName},`, "",
    `${input.partnerName} just published a new event in your network:`, "",
    input.eventName, `📅 ${input.eventDate}`, `📍 ${input.eventLocation}`, "",
    input.eventShortDescription, "",
    `View event & claim your voucher: ${input.eventLink}`, "", "The Royally Team",
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

export async function queueWelcomeEmail(userId: string, role: Role) {
  const user = await prisma.users.findUnique({ where: { user_id: userId }, select: { email: true, first_name: true } });
  if (!user?.email) return null;
  const firstName = user.first_name?.trim() || "there";
  const copy = roleCopy[role];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
  const profileLink = `${baseUrl.replace(/\/$/, "")}/dashboard/profile`;
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.SES_FROM_EMAIL || "support@royally.com";
  const subject = `Welcome to Royally, ${firstName}! 🎉`;
  const preheader = "Your account is ready — here's how to get started.";
  const textBody = [
    `Hi ${firstName},`, "", `Welcome to Royally! Your ${roleLabel(role)} account has been created successfully.`, "",
    `Royally makes it easy to ${copy.valueProp}.`, "", "Here's how to get started:",
    `1. Complete your profile: ${profileLink}`, `2. ${copy.step2}`, `3. ${copy.step3}`, "",
    `If you have any questions, our support team is here to help at ${supportEmail}.`, "", "Welcome aboard,", "The Royally Team",
  ].join("\n");
  const htmlBody = layout(preheader, `<p>Hi ${escapeHtml(firstName)},</p><p>Welcome to Royally! Your <strong>${roleLabel(role)}</strong> account has been created successfully.</p><p>Royally makes it easy to ${escapeHtml(copy.valueProp)}.</p><p>Here's how to get started:</p><ol><li>Complete your profile: <a href="${profileLink}">${profileLink}</a></li><li>${escapeHtml(copy.step2)}</li><li>${escapeHtml(copy.step3)}</li></ol><p>If you have any questions, our support team is here to help at <a href="mailto:${supportEmail}">${escapeHtml(supportEmail)}</a>.</p><p>Welcome aboard,</p>`);
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
  const firstName = input.firstName?.trim() || "there";
  const secureAccountLink = `${(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/login`;
  const changeDate = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date());
  const subject = "Your Royally profile was updated";
  const preheader = "We're confirming a recent change to your account.";
  const textBody = [`Hi ${firstName},`, "", `This is a confirmation that the following change was made to your account on ${changeDate}:`, "", input.changedFieldDescription, "", "If you made this change, no action is needed.", `If you did NOT make this change, please secure your account immediately: ${secureAccountLink}`, "", "The Royally Team"].join("\n");
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
