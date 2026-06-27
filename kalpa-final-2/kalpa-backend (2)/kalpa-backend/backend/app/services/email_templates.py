"""
Centralised email template library for Kalpa Asset Intelligence.

Each function returns (subject: str, html_body: str).
All templates are responsive, inline-CSS HTML compatible with major email clients.
"""

from __future__ import annotations

_BASE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>{subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
           style="background:#ffffff;border-radius:8px;overflow:hidden;
                  box-shadow:0 2px 8px rgba(0,0,0,.1);max-width:600px;">
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1a3a5c 0%,#2d6a9f 100%);
                   padding:28px 32px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:1px;">
            &#9889; KALPA POWER LTD
          </div>
          <div style="font-size:12px;color:#a8c8e8;margin-top:4px;letter-spacing:2px;">
            ASSET INTELLIGENCE PLATFORM
          </div>
        </td>
      </tr>
      <!-- Body -->
      <tr><td style="padding:32px;">
        {body}
      </td></tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f8f9fa;padding:20px 32px;border-top:1px solid #e9ecef;
                   text-align:center;font-size:12px;color:#6c757d;">
          <p style="margin:0 0 4px 0;">This email was generated automatically by the
             Kalpa Asset Intelligence Platform.</p>
          <p style="margin:0;">Do not reply to this email &bull;
             &copy; 2024 Kalpa Power Ltd</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def _wrap(subject: str, body: str) -> tuple[str, str]:
    return subject, _BASE.format(subject=subject, body=body)


# ---------------------------------------------------------------------------
# 1. Login OTP
# ---------------------------------------------------------------------------
def otp_email(to_name: str, otp: str, expires_minutes: int = 5) -> tuple[str, str]:
    body = f"""
      <h2 style="color:#1a3a5c;margin:0 0 16px 0;">Login Verification Code</h2>
      <p style="color:#495057;line-height:1.6;">
        Hello {to_name or "there"},<br><br>
        Use the code below to complete your login to the
        <strong>Kalpa Asset Intelligence Platform</strong>.
      </p>
      <div style="background:#f0f4f8;border-left:4px solid #2d6a9f;border-radius:6px;
                  padding:24px;text-align:center;margin:24px 0;">
        <div style="font-size:42px;font-weight:700;letter-spacing:12px;
                    color:#1a3a5c;font-family:monospace;">{otp}</div>
        <div style="font-size:13px;color:#6c757d;margin-top:8px;">
          Valid for {expires_minutes} minutes &bull; Single use only
        </div>
      </div>
      <p style="color:#868e96;font-size:13px;line-height:1.6;">
        If you did not request this code, your account may be under attack.
        Please change your password immediately and contact your administrator.
      </p>
      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;
                  padding:12px 16px;margin-top:16px;">
        <strong style="color:#856404;">&#9888; Security Notice:</strong>
        <span style="color:#856404;font-size:13px;">
          Kalpa support will NEVER ask you for this code.
        </span>
      </div>"""
    return _wrap("Your Kalpa Login Verification Code", body)


# ---------------------------------------------------------------------------
# 2. Welcome Email
# ---------------------------------------------------------------------------
def welcome_email(to_email: str) -> tuple[str, str]:
    body = f"""
      <h2 style="color:#1a3a5c;margin:0 0 16px 0;">Welcome to Kalpa Asset Intelligence</h2>
      <p style="color:#495057;line-height:1.6;">
        Your account has been successfully created for
        <strong>{to_email}</strong>.
      </p>
      <p style="color:#495057;line-height:1.6;">
        You now have access to the Kalpa Power Ltd asset tracking platform,
        where you can monitor solar panels, generators, transformers and other
        power infrastructure in real time.
      </p>
      <div style="background:#d4edda;border:1px solid #c3e6cb;border-radius:6px;
                  padding:16px;margin:20px 0;">
        <strong style="color:#155724;">&#10003; Account activated</strong><br>
        <span style="color:#155724;font-size:13px;">Role: Viewer &mdash; contact an administrator for elevated access.</span>
      </div>"""
    return _wrap("Welcome to Kalpa Asset Intelligence", body)


# ---------------------------------------------------------------------------
# 3. Password Reset
# ---------------------------------------------------------------------------
def password_reset_email(to_email: str, reset_token: str) -> tuple[str, str]:
    body = f"""
      <h2 style="color:#1a3a5c;margin:0 0 16px 0;">Password Reset Request</h2>
      <p style="color:#495057;line-height:1.6;">
        A password reset was requested for <strong>{to_email}</strong>.
      </p>
      <p style="color:#495057;line-height:1.6;">
        Use the token below in the password-reset API endpoint.
        It expires in 15 minutes.
      </p>
      <div style="background:#f0f4f8;border-left:4px solid #dc3545;border-radius:6px;
                  padding:20px;margin:20px 0;word-break:break-all;">
        <code style="font-size:14px;color:#1a3a5c;">{reset_token}</code>
      </div>
      <p style="color:#868e96;font-size:13px;">
        If you did not request a password reset, ignore this email.
        Your password will not change.
      </p>"""
    return _wrap("Kalpa Password Reset Request", body)


# ---------------------------------------------------------------------------
# 4. Maintenance Reminder
# ---------------------------------------------------------------------------
def maintenance_reminder_email(
    product_name: str,
    product_id: str,
    model: str,
    location: str,
    due_date: str,
    priority: str = "High",
    recommended_action: str = "Schedule preventive maintenance immediately.",
    is_demo: bool = False,
) -> tuple[str, str]:
    badge = ""
    if is_demo:
        badge = """<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;
                      padding:8px 12px;margin-bottom:16px;font-size:13px;color:#856404;">
                     &#9888; <strong>DEMO / TEST NOTIFICATION</strong> — Generated for demonstration purposes only
                   </div>"""
    priority_color = {"High": "#dc3545", "Medium": "#fd7e14", "Low": "#28a745"}.get(priority, "#6c757d")
    body = f"""
      {badge}
      <h2 style="color:#1a3a5c;margin:0 0 8px 0;">&#128295; Maintenance Reminder</h2>
      <p style="color:#495057;margin:0 0 20px 0;">
        The following asset requires maintenance attention.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #dee2e6;border-radius:6px;overflow:hidden;margin-bottom:20px;">
        <tr style="background:#f8f9fa;">
          <td colspan="2" style="padding:12px 16px;font-weight:700;color:#1a3a5c;
                                  border-bottom:1px solid #dee2e6;">
            Asset Details
          </td>
        </tr>
        {_row("Product", product_name)}
        {_row("Product ID", product_id)}
        {_row("Model", model)}
        {_row("Location", location)}
        {_row("Maintenance Due", due_date)}
        <tr>
          <td style="padding:10px 16px;color:#6c757d;font-size:13px;
                     border-bottom:1px solid #f1f3f5;width:40%;">Priority</td>
          <td style="padding:10px 16px;border-bottom:1px solid #f1f3f5;">
            <span style="background:{priority_color};color:#fff;padding:2px 10px;
                         border-radius:20px;font-size:12px;font-weight:600;">
              {priority}
            </span>
          </td>
        </tr>
      </table>
      <div style="background:#e8f4fd;border-left:4px solid #2d6a9f;border-radius:4px;
                  padding:14px 16px;margin-bottom:20px;">
        <strong style="color:#1a3a5c;">Recommended Action:</strong><br>
        <span style="color:#495057;">{recommended_action}</span>
      </div>"""
    return _wrap(f"[Kalpa] Maintenance Reminder — {product_name}", body)


# ---------------------------------------------------------------------------
# 5. Warranty Reminder
# ---------------------------------------------------------------------------
def warranty_reminder_email(
    product_name: str,
    product_id: str,
    model: str,
    location: str,
    expiry_date: str,
    days_remaining: int,
) -> tuple[str, str]:
    urgency = "Urgent" if days_remaining <= 7 else "Action Required"
    urgency_color = "#dc3545" if days_remaining <= 7 else "#fd7e14"
    body = f"""
      <h2 style="color:#1a3a5c;margin:0 0 8px 0;">&#128179; Warranty Expiry Notice</h2>
      <p style="color:#495057;margin:0 0 20px 0;">
        The warranty for the following asset is expiring soon.
        Take action before the expiry date to avoid uncovered repairs.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #dee2e6;border-radius:6px;overflow:hidden;margin-bottom:20px;">
        <tr style="background:#f8f9fa;">
          <td colspan="2" style="padding:12px 16px;font-weight:700;color:#1a3a5c;
                                  border-bottom:1px solid #dee2e6;">
            Asset Details
          </td>
        </tr>
        {_row("Product", product_name)}
        {_row("Product ID", product_id)}
        {_row("Model", model)}
        {_row("Location", location)}
        {_row("Warranty Expiry", expiry_date)}
        <tr>
          <td style="padding:10px 16px;color:#6c757d;font-size:13px;width:40%;">Days Remaining</td>
          <td style="padding:10px 16px;">
            <span style="background:{urgency_color};color:#fff;padding:2px 10px;
                         border-radius:20px;font-size:12px;font-weight:600;">
              {days_remaining} day{'s' if days_remaining != 1 else ''} — {urgency}
            </span>
          </td>
        </tr>
      </table>
      <div style="background:#fff3cd;border-left:4px solid #ffc107;border-radius:4px;
                  padding:14px 16px;">
        <strong style="color:#856404;">Recommended Action:</strong>
        <span style="color:#856404;">
          Contact your warranty provider or plan a service visit before expiry.
        </span>
      </div>"""
    return _wrap(f"[Kalpa] Warranty Expiring in {days_remaining} Days — {product_name}", body)


# ---------------------------------------------------------------------------
# 6. Admin Promotion
# ---------------------------------------------------------------------------
def admin_promotion_email(to_email: str, new_role: str, promoted_by: str) -> tuple[str, str]:
    body = f"""
      <h2 style="color:#1a3a5c;margin:0 0 16px 0;">&#128081; Role Update</h2>
      <p style="color:#495057;line-height:1.6;">
        Your role on the <strong>Kalpa Asset Intelligence Platform</strong>
        has been updated.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid #dee2e6;border-radius:6px;overflow:hidden;margin:20px 0;">
        {_row("Account", to_email)}
        {_row("New Role", new_role.upper())}
        {_row("Promoted by", promoted_by)}
      </table>
      <p style="color:#6c757d;font-size:13px;line-height:1.6;">
        If you believe this change was made in error, contact your system administrator immediately.
      </p>"""
    return _wrap("Your Kalpa Platform Role Has Been Updated", body)


# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------
def _row(label: str, value: str) -> str:
    return (
        f'<tr>'
        f'<td style="padding:10px 16px;color:#6c757d;font-size:13px;'
        f'border-bottom:1px solid #f1f3f5;width:40%;">{label}</td>'
        f'<td style="padding:10px 16px;color:#212529;border-bottom:1px solid #f1f3f5;">'
        f'<strong>{value}</strong></td>'
        f'</tr>'
    )
