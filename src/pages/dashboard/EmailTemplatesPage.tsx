import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, User, Building, Users, Shield } from "lucide-react";

interface EmailTemplate {
  id: string;
  subject: string;
  scenario: string;
  body: string;
}

const memberEmails: EmailTemplate[] = [
  {
    id: "member-welcome",
    subject: "Welcome to LOCAL METRICS Network!",
    scenario: "Registration Confirmation",
    body: `Dear {{firstName}},

Welcome to the LOCAL METRICS Network! We're thrilled to have you join our community.

Your account has been successfully created with the following details:
• Network: {{networkName}}
• Member ID: {{memberId}}

As a member, you now have access to:
✓ Exclusive vouchers and rewards
✓ Local provider discounts
✓ Community events and activities
✓ Network score tracking

Get started by exploring available vouchers in your dashboard.

Best regards,
The LOCAL METRICS Team`
  },
  {
    id: "member-voucher",
    subject: "🎉 New Voucher Available for You!",
    scenario: "New Voucher Notification",
    body: `Hi {{firstName}},

Great news! A new voucher is now available for you:

📍 Provider: {{providerName}}
🎁 Offer: {{voucherDescription}}
📅 Valid Until: {{expiryDate}}
💰 Value: {{voucherValue}}

Don't miss out on this exclusive offer! Redeem it by visiting the provider and scanning your QR code.

Redeem Now: {{redeemLink}}

Happy savings!
LOCAL METRICS Team`
  },
  {
    id: "member-event",
    subject: "You're Invited: {{eventName}}",
    scenario: "Event Invitation",
    body: `Hello {{firstName}},

You're invited to an upcoming community event!

📌 Event: {{eventName}}
📅 Date: {{eventDate}}
⏰ Time: {{eventTime}}
📍 Location: {{eventLocation}}

{{eventDescription}}

This event is brought to you by {{providerName}} and participating will earn you {{networkPoints}} network points!

RSVP: {{rsvpLink}}

We hope to see you there!
LOCAL METRICS Team`
  },
  {
    id: "member-score",
    subject: "Your Monthly Network Score Update",
    scenario: "Monthly Score Summary",
    body: `Hi {{firstName}},

Here's your network activity summary for {{month}}:

📊 Current Network Score: {{currentScore}}
📈 Change from last month: {{scoreChange}}
🏆 Rank in your area: {{areaRank}}

Activity Breakdown:
• Vouchers Redeemed: {{vouchersRedeemed}}
• Events Attended: {{eventsAttended}}
• Points Earned: {{pointsEarned}}

Keep engaging with local providers to increase your score and unlock more rewards!

View Full Report: {{reportLink}}

Best,
LOCAL METRICS Team`
  }
];

const providerEmails: EmailTemplate[] = [
  {
    id: "provider-welcome",
    subject: "Welcome to LOCAL METRICS - Provider Account Activated",
    scenario: "Registration Confirmation",
    body: `Dear {{agentFirstName}},

Welcome to LOCAL METRICS! Your provider account for {{businessName}} has been successfully created.

Account Details:
• Business: {{businessName}}
• Category: {{businessCategory}}
• Network: {{networkName}}
• Provider ID: {{providerId}}

As a provider, you can now:
✓ Create and manage vouchers
✓ Host community events
✓ Track customer engagement
✓ Access analytics dashboard
✓ Add authorized representatives

Get started by creating your first voucher campaign!

Dashboard: {{dashboardLink}}

Best regards,
LOCAL METRICS Team`
  },
  {
    id: "provider-voucher-redemption",
    subject: "Voucher Redeemed at {{businessName}}",
    scenario: "Voucher Redemption Alert",
    body: `Hi {{agentFirstName}},

A voucher has just been redeemed at {{businessName}}!

📋 Redemption Details:
• Voucher: {{voucherName}}
• Value: {{voucherValue}}
• Member: {{memberName}}
• Time: {{redemptionTime}}
• Location: {{location}}

📊 Today's Stats:
• Total Redemptions: {{dailyRedemptions}}
• Revenue Generated: {{dailyRevenue}}

View all redemptions in your dashboard: {{dashboardLink}}

LOCAL METRICS Team`
  },
  {
    id: "provider-event-reminder",
    subject: "Reminder: Your Event Tomorrow - {{eventName}}",
    scenario: "Event Reminder",
    body: `Hello {{agentFirstName}},

This is a reminder that your event is happening tomorrow!

📌 Event: {{eventName}}
📅 Date: {{eventDate}}
⏰ Time: {{eventTime}}
📍 Location: {{eventLocation}}

📊 Registration Stats:
• Confirmed Attendees: {{confirmedCount}}
• Pending RSVPs: {{pendingCount}}
• Capacity: {{capacity}}

Checklist for tomorrow:
☐ Verify venue setup
☐ Prepare QR scanner
☐ Review attendee list
☐ Confirm staff assignments

Manage Event: {{eventLink}}

Good luck!
LOCAL METRICS Team`
  },
  {
    id: "provider-monthly-report",
    subject: "{{businessName}} - Monthly Performance Report",
    scenario: "Monthly Analytics",
    body: `Dear {{agentFirstName}},

Here's your monthly performance report for {{businessName}}:

📊 {{month}} Performance Summary:

Voucher Metrics:
• Vouchers Created: {{vouchersCreated}}
• Vouchers Redeemed: {{vouchersRedeemed}}
• Redemption Rate: {{redemptionRate}}%
• Revenue Generated: {{revenueGenerated}}

Event Metrics:
• Events Hosted: {{eventsHosted}}
• Total Attendees: {{totalAttendees}}
• Avg. Satisfaction: {{avgSatisfaction}}/5

Network Score Impact:
• Score Contribution: +{{scoreContribution}}
• Community Reach: {{communityReach}} members

View Full Report: {{reportLink}}

Keep up the great work!
LOCAL METRICS Team`
  },
  {
    id: "provider-network-invite",
    subject: "You're Invited to Join {{partnerName}}'s Network",
    scenario: "Partner Network Invitation",
    body: `Dear {{providerName}},

{{partnerName}} has invited you to join their LOCAL METRICS network!

🤝 About {{partnerName}}:
{{partnerDescription}}

📍 Network: {{networkName}}
📊 Network Members: {{networkMemberCount}}
🏢 Active Providers: {{activeProviders}}

Benefits of Joining:
✓ Access to {{partnerName}}'s member base
✓ Exclusive campaign opportunities
✓ Community event participation
✓ Analytics and engagement tracking
✓ Voucher creation and management

Join {{partnerName}}'s Network: {{inviteLink}}

This invitation expires on {{expiryDate}}.

If you have questions, contact {{partnerName}} at {{partnerEmail}}.

Best regards,
{{partnerName}} via LOCAL METRICS`
  },
  {
    id: "provider-event-created",
    subject: "New Event Created: {{eventName}}",
    scenario: "Event Creation Notification",
    body: `Hello {{agentFirstName}},

A new event has been created by {{partnerName}} that you may be interested in participating in!

📌 Event Details:
• Event Name: {{eventName}}
• Date: {{eventDate}}
• Time: {{eventTime}}
• Location: {{eventLocation}}
• Expected Attendance: {{expectedAttendance}}

📝 Event Description:
{{eventDescription}}

💰 Participation Options:
• Discount Range: {{discountRange}}
• Booth/Space Available: {{boothAvailable}}

To participate in this event, please review the details and confirm your interest through your dashboard.

View Event Details: {{eventLink}}

Best regards,
{{partnerName}} via LOCAL METRICS`
  },
  {
    id: "provider-event-published",
    subject: "🎉 Event Published: {{eventName}} is Now Live!",
    scenario: "Event Published Notification",
    body: `Hello {{agentFirstName}},

Great news! The event you're participating in has been published and is now live!

📌 Event Details:
• Event Name: {{eventName}}
• Date: {{eventDate}}
• Time: {{eventTime}}
• Location: {{eventLocation}}
• Partner: {{partnerName}}

📋 Your Participation Details:
• Your Discount Offer: {{yourDiscount}}
• Voucher Code: {{voucherCode}}
• Expected Foot Traffic: {{expectedTraffic}}

📢 Event Promotion:
The event is now visible to all {{networkMemberCount}} members in the {{networkName}} network. Members can claim vouchers and plan their visit.

Important Reminders:
☐ Ensure your QR scanner is ready
☐ Brief your staff on the event details
☐ Prepare for increased customer traffic
☐ Stock up on promotional materials

View Full Event Details: {{eventLink}}
Manage Your Vouchers: {{voucherLink}}

Best of luck with the event!
{{partnerName}} via LOCAL METRICS`
  },
  {
    id: "provider-live-royally-invite",
    subject: "Join the Live Royally Network - Your Data Awaits",
    scenario: "Live Royally Network Invitation",
    body: `Dear {{businessName}},

We noticed that your provider account has been inactive with {{previousPartner}} for 30 days. 

We want to offer you an opportunity to continue your LOCAL METRICS journey by joining the Live Royally Network!

🌟 Why Join Live Royally Network?
• Maintain access to your campaign history and data
• Continue engaging with local community members
• Access to new partnership opportunities
• Keep your business visible to LOCAL METRICS members

⚠️ Important Notice:
If you do not join the Live Royally Network or another partner network within the next 30 days, your campaign data will no longer be accessible.

📊 Your Current Data:
• Historical Campaigns: {{campaignCount}}
• Vouchers Created: {{vouchersCreated}}
• Total Redemptions: {{totalRedemptions}}
• Community Reach: {{communityReach}} members

Join Live Royally Network: {{joinLink}}

Alternatively, you can find other local partners in your area: {{findPartnersLink}}

If you have any questions, please contact our support team.

Best regards,
LOCAL METRICS Admin Team`
  }
];

const partnerEmails: EmailTemplate[] = [
  {
    id: "partner-welcome",
    subject: "Partnership Activated - Welcome to LOCAL METRICS",
    scenario: "Registration Confirmation",
    body: `Dear {{agentFirstName}},

Welcome to LOCAL METRICS! Your partner account for {{organizationName}} is now active.

Partnership Details:
• Organization: {{organizationName}}
• Category: {{organizationCategory}}
• Network: {{networkName}}
• Partner ID: {{partnerId}}

As a partner, you have access to:
✓ Provider network management
✓ Campaign creation tools
✓ Advanced CRM features
✓ Integration capabilities
✓ Comprehensive analytics

Your dedicated partner dashboard is ready: {{dashboardLink}}

We look forward to a successful partnership!

Best regards,
LOCAL METRICS Team`
  },
  {
    id: "partner-campaign-launch",
    subject: "Campaign Launched: {{campaignName}}",
    scenario: "Campaign Notification",
    body: `Hi {{agentFirstName}},

Your campaign has been successfully launched!

📢 Campaign Details:
• Name: {{campaignName}}
• Type: {{campaignType}}
• Start Date: {{startDate}}
• End Date: {{endDate}}
• Budget: {{budget}}
• Target Providers: {{targetProviders}}

Campaign Goals:
{{campaignGoals}}

Track your campaign performance in real-time: {{campaignLink}}

Need assistance? Contact your account manager.

LOCAL METRICS Team`
  },
  {
    id: "partner-provider-onboarded",
    subject: "New Provider Joined Your Network",
    scenario: "Provider Onboarding Alert",
    body: `Hello {{agentFirstName}},

A new provider has joined your network!

🏢 Provider Details:
• Business Name: {{providerName}}
• Category: {{providerCategory}}
• Location: {{providerLocation}}
• Contact: {{providerContact}}

📊 Network Growth:
• Total Providers: {{totalProviders}}
• This Month: +{{monthlyGrowth}}
• Growth Rate: {{growthRate}}%

Welcome the new provider and help them get started!

Manage Providers: {{providersLink}}

LOCAL METRICS Team`
  },
  {
    id: "partner-integration-status",
    subject: "Integration Status Update: {{integrationName}}",
    scenario: "Integration Notification",
    body: `Dear {{agentFirstName}},

Your integration status has been updated:

🔗 Integration: {{integrationName}}
📊 Status: {{integrationStatus}}
📅 Updated: {{updateTime}}

{{statusDetails}}

{{#if actionRequired}}
⚠️ Action Required:
{{actionDetails}}

Take Action: {{actionLink}}
{{/if}}

View all integrations: {{integrationsLink}}

LOCAL METRICS Team`
  },
  {
    id: "partner-platform-invite",
    subject: "You're Invited to Join LOCAL METRICS Platform",
    scenario: "Platform Invitation",
    body: `Dear {{recipientName}},

You have been invited to join the LOCAL METRICS platform as a Partner organization!

🌟 About LOCAL METRICS:
LOCAL METRICS is a community economic development platform that connects local businesses, community organizations, and residents to strengthen local economies.

🤝 As a Partner, you can:
✓ Build and manage your own provider network
✓ Create community events and campaigns
✓ Track engagement and analytics
✓ Integrate with third-party platforms
✓ Access comprehensive CRM tools

📋 Invitation Details:
• Invited by: LOCAL METRICS Admin
• Role: Partner Organization
• Network: {{networkName}}

Get Started: {{inviteLink}}

This invitation expires on {{expiryDate}}.

If you have questions about becoming a partner, please contact us at {{supportEmail}}.

Welcome to LOCAL METRICS!
LOCAL METRICS Admin Team`
  },
  {
    id: "partner-account-approved",
    subject: "🎉 Your Partner Account Has Been Approved!",
    scenario: "Account Approval Notification",
    body: `Dear {{agentFirstName}},

Great news! Your partner account for {{organizationName}} has been approved and is now fully active.

✅ Account Status: APPROVED
📅 Approval Date: {{approvalDate}}
🔑 Partner ID: {{partnerId}}

You now have full access to:
✓ Partner Dashboard
✓ Provider Network Management
✓ Campaign Creation Tools
✓ CRM Features
✓ Analytics & Reporting
✓ Integration Settings

🚀 Next Steps:
1. Complete your organization profile
2. Invite providers to join your network
3. Create your first campaign or event
4. Explore integration options

Access Your Dashboard: {{dashboardLink}}

If you need assistance getting started, our support team is here to help at {{supportEmail}}.

Welcome to the LOCAL METRICS family!

Best regards,
LOCAL METRICS Admin Team`
  }
];

const adminEmails: EmailTemplate[] = [
  {
    id: "admin-daily-digest",
    subject: "Daily Platform Digest - {{date}}",
    scenario: "Daily Summary",
    body: `Good morning,

Here's your daily platform digest for {{date}}:

📊 Platform Overview:
• Active Users: {{activeUsers}}
• New Registrations: {{newRegistrations}}
• Total Transactions: {{transactions}}

👥 User Activity:
• New Members: {{newMembers}}
• New Providers: {{newProviders}}
• New Partners: {{newPartners}}

💰 Financial Summary:
• Vouchers Redeemed: {{vouchersRedeemed}}
• Total Value: {{totalValue}}
• Commission: {{commission}}

⚠️ Alerts:
{{#each alerts}}
• {{this}}
{{/each}}

View Full Dashboard: {{dashboardLink}}

LOCAL METRICS System`
  },
  {
    id: "admin-security-alert",
    subject: "🔒 Security Alert: {{alertType}}",
    scenario: "Security Notification",
    body: `SECURITY ALERT

Type: {{alertType}}
Severity: {{severity}}
Time: {{alertTime}}
Source: {{source}}

Details:
{{alertDetails}}

Affected Resources:
{{#each resources}}
• {{this}}
{{/each}}

Recommended Actions:
{{#each recommendations}}
{{@index}}. {{this}}
{{/each}}

Investigate Now: {{investigateLink}}

This is an automated security notification.
LOCAL METRICS Security Team`
  },
  {
    id: "admin-system-update",
    subject: "System Update Scheduled - {{updateDate}}",
    scenario: "System Maintenance",
    body: `Dear Administrator,

A system update has been scheduled:

📅 Date: {{updateDate}}
⏰ Time: {{updateTime}} ({{timezone}})
⏱️ Expected Duration: {{duration}}

Update Details:
{{updateDetails}}

Changes Include:
{{#each changes}}
• {{this}}
{{/each}}

Impact:
{{impactDetails}}

During the update:
• Users may experience brief interruptions
• Scheduled tasks will be paused
• Monitoring will be enhanced

Post-Update Actions:
{{#each postActions}}
• {{this}}
{{/each}}

Contact: {{supportEmail}}

LOCAL METRICS Operations`
  },
  {
    id: "admin-user-report",
    subject: "User Report: {{reportType}} - {{userName}}",
    scenario: "User Report Notification",
    body: `User Report Received

📋 Report Details:
• Type: {{reportType}}
• Reported User: {{userName}}
• Reporter: {{reporterName}}
• Time: {{reportTime}}

Description:
{{reportDescription}}

Evidence:
{{#each evidence}}
• {{this}}
{{/each}}

User History:
• Account Age: {{accountAge}}
• Previous Reports: {{previousReports}}
• Status: {{userStatus}}

Action Required:
Please review this report and take appropriate action within 24 hours.

Review Report: {{reviewLink}}

LOCAL METRICS Moderation`
  }
];

const EmailTemplateCard = ({ template }: { template: EmailTemplate }) => (
  <Card className="mb-4">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{template.subject}</CardTitle>
        <Badge variant="secondary">{template.scenario}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg overflow-x-auto">
        {template.body}
      </pre>
    </CardContent>
  </Card>
);

const EmailTemplatesPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Sample email templates for various user scenarios</p>
        </div>
      </div>

      <Tabs defaultValue="member" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="member" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Member
          </TabsTrigger>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="partner" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Partner
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="member" className="mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="h-5 w-5" />
            Member Email Templates
          </h2>
          {memberEmails.map((template) => (
            <EmailTemplateCard key={template.id} template={template} />
          ))}
        </TabsContent>

        <TabsContent value="provider" className="mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Provider Email Templates
          </h2>
          {providerEmails.map((template) => (
            <EmailTemplateCard key={template.id} template={template} />
          ))}
        </TabsContent>

        <TabsContent value="partner" className="mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partner Email Templates
          </h2>
          {partnerEmails.map((template) => (
            <EmailTemplateCard key={template.id} template={template} />
          ))}
        </TabsContent>

        <TabsContent value="admin" className="mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Email Templates
          </h2>
          {adminEmails.map((template) => (
            <EmailTemplateCard key={template.id} template={template} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailTemplatesPage;
