const DEFAULT_APP_URL = "https://localmetrics.net";
const DEFAULT_SUPPORT_EMAIL = "info.localmetrics@gmail.com";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAppUrl() {
  return String(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL)
    .trim()
    .replace(/\/+$/, "");
}

exports.handler = async (event) => {
  if (event.triggerSource !== "CustomMessage_ForgotPassword") {
    return event;
  }

  const code = event.request?.codeParameter || "{####}";
  const supportEmail = escapeHtml(process.env.SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL);
  const appUrl = escapeHtml(getAppUrl());
  const preheader = "Use this verification code to reset your Local Metrics password.";

  event.response.emailSubject = "Reset your Local Metrics password";
  event.response.emailMessage = `
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${preheader}</div>
    <div style="background:#fbf8f1;padding:32px 16px;font-family:Arial,sans-serif;color:#27233d;line-height:1.6">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #eee8dc;border-radius:12px;overflow:hidden">
        <div style="padding:24px 32px;border-bottom:1px solid #eee8dc;text-align:center">
          <div style="font-size:24px;font-weight:700;letter-spacing:.04em;color:#4b2e83">LOCAL METRICS</div>
        </div>
        <div style="padding:32px">
          <p style="margin-top:0">Hello,</p>
          <p>We received a request to reset the password for your Local Metrics account.</p>
          <p style="margin-bottom:8px">Your verification code is:</p>
          <p style="margin:0 0 24px;text-align:center;font-size:28px;font-weight:700;letter-spacing:.18em;color:#4b2e83;background:#fbf8f1;border-radius:8px;padding:16px">${escapeHtml(code)}</p>
          <p>Enter this code on the password reset screen, then choose a new password.</p>
          <p style="margin-bottom:0"><a href="${appUrl}/login" style="display:inline-block;background:#4b2e83;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px">Reset your password</a></p>
          <p style="font-size:13px;color:#6b7280;margin-bottom:0">If you did not request a password reset, you can safely ignore this email. Need help? Contact <a href="mailto:${supportEmail}" style="color:#4b2e83">${supportEmail}</a>.</p>
        </div>
        <div style="padding:20px 32px;background:#27233d;color:#ffffff;text-align:center;font-size:13px">
          <p style="margin:0">The Local Metrics Team</p>
        </div>
      </div>
    </div>`;

  return event;
};
