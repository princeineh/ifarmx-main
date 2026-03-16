import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APP_URL = Deno.env.get("SITE_URL") || "https://ifarmx.com";

interface AppreciationPayload {
  recipient_ids: string[];
  recipient_emails: string[];
  recipient_names: string[];
  sender_name: string;
  title: string;
  message: string;
  badge_type: string;
  period_label: string;
}

const badgeConfig: Record<string, { icon: string; label: string; accent: string; glow: string }> = {
  top_performer: { icon: "&#9733;", label: "TOP.PERFORMER", accent: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
  most_improved: { icon: "&#9650;", label: "MOST.IMPROVED", accent: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
  consistent: { icon: "&#9670;", label: "CONSISTENT", accent: "#10b981", glow: "rgba(16,185,129,0.15)" },
  special: { icon: "&#10022;", label: "SPECIAL", accent: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
};

const defaultBadge = { icon: "&#9733;", label: "APPRECIATION", accent: "#f59e0b", glow: "rgba(245,158,11,0.15)" };

function buildAppreciationHtml(
  name: string,
  title: string,
  message: string,
  badgeType: string,
  periodLabel: string,
  senderName: string
): string {
  const badge = badgeConfig[badgeType] || defaultBadge;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .cp { padding-left: 20px !important; padding-right: 20px !important; }
      h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#07070d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div role="article" aria-roledescription="email" aria-label="${title}" lang="en" style="font-size:16px;">
    <div style="display:none;font-size:1px;color:#07070d;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${message.substring(0, 120)}&#8199;&#65279;&#847;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07070d;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:0 auto;">

          <!-- LOGO -->
          <tr><td style="padding:0 0 32px 0;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding-right:10px;vertical-align:middle;">
                  <div style="width:36px;height:36px;background-color:${badge.accent};border-radius:8px;text-align:center;line-height:36px;font-size:14px;color:#000;font-weight:800;display:inline-block;letter-spacing:-0.5px;">iF</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:24px;font-weight:800;color:#e4e4e7;letter-spacing:-0.5px;">iFarm</span><span style="font-size:24px;font-weight:800;color:${badge.accent};letter-spacing:-0.5px;">X</span>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- MAIN CARD -->
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111119;border-radius:16px;overflow:hidden;border:1px solid #1f1f2e;">

              <!-- Accent top bar -->
              <tr><td style="height:3px;background-color:${badge.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

              <!-- Badge icon -->
              <tr><td style="padding:32px 0 0 0;text-align:center;">
                <div style="display:inline-block;width:72px;height:72px;background-color:${badge.glow};border:2px solid ${badge.accent};border-radius:50%;text-align:center;line-height:72px;">
                  <span style="font-size:32px;color:${badge.accent};">${badge.icon}</span>
                </div>
              </td></tr>

              <!-- Type badge -->
              <tr><td style="padding:16px 0 0 0;text-align:center;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                  <tr><td style="background-color:${badge.glow};border:1px solid #252535;border-radius:6px;padding:6px 14px;">
                    <span style="font-size:11px;font-weight:700;color:${badge.accent};letter-spacing:1.5px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">${badge.icon}&nbsp; ${badge.label}</span>
                  </td></tr>
                </table>
              </td></tr>

              <!-- Period -->
              <tr><td style="padding:8px 0 0 0;text-align:center;">
                <p style="margin:0;font-size:12px;color:#52525b;font-family:Menlo,'Courier New',monospace;">${periodLabel}</p>
              </td></tr>

              <!-- Greeting -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <p style="margin:0;font-size:13px;color:#52525b;line-height:1.5;font-family:Menlo,'Courier New',monospace;">Hello, <span style="color:${badge.accent};">${name}</span></p>
              </td></tr>

              <!-- Title -->
              <tr><td class="cp" style="padding:10px 36px 0 36px;">
                <h1 style="margin:0;font-size:26px;font-weight:800;color:#f4f4f5;line-height:1.3;letter-spacing:-0.5px;">${title}</h1>
              </td></tr>

              <!-- Divider -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:40px;height:1px;background-color:${badge.accent};font-size:0;">&nbsp;</td>
                    <td style="height:1px;background-color:#252535;font-size:0;">&nbsp;</td>
                  </tr>
                </table>
              </td></tr>

              <!-- Message -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.8;">${message}</p>
              </td></tr>

              <!-- Sender -->
              <tr><td class="cp" style="padding:18px 36px 0 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr><td style="background-color:#1a1a28;border:1px solid #252535;border-radius:8px;padding:14px 18px;">
                    <p style="margin:0;font-size:11px;font-weight:700;color:#52525b;letter-spacing:1px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">SENT BY</p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#e4e4e7;font-weight:600;">${senderName}</p>
                  </td></tr>
                </table>
              </td></tr>

              <!-- CTA Button -->
              <tr><td class="cp" style="padding:28px 36px 0 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr><td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr><td style="border-radius:8px;background-color:${badge.accent};">
                        <a href="${APP_URL}?page=achievements" target="_blank" style="display:inline-block;padding:14px 40px;font-size:13px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                          View Achievements &#8594;
                        </a>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </td></tr>

              <!-- URL hint -->
              <tr><td class="cp" style="padding:10px 36px 0 36px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">
                  &gt; <a href="${APP_URL}?page=achievements" style="color:#52525b;text-decoration:underline;">ifarmx.com</a>
                </p>
              </td></tr>

              <tr><td style="padding:32px 0 0 0;"></td></tr>
            </table>
          </td></tr>

          <!-- FOOTER -->
          <tr><td style="padding:28px 16px 0 16px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding-right:10px;vertical-align:middle;">
                  <div style="width:20px;height:20px;background-color:${badge.accent};border-radius:4px;text-align:center;line-height:20px;font-size:9px;color:#000;font-weight:800;display:inline-block;">iF</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:14px;font-weight:700;color:#52525b;letter-spacing:-0.3px;">iFarm</span><span style="font-size:14px;font-weight:700;color:${badge.accent};letter-spacing:-0.3px;">X</span>
                </td>
              </tr>
            </table>
            <p style="margin:8px 0 16px 0;font-size:11px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">Growing smarter. Farming better. Together.</p>
            <p style="margin:0;font-size:10px;color:#27272a;font-family:Menlo,'Courier New',monospace;">
              Powered by DotXan Tech &bull; &copy; ${year}
            </p>
            <p style="margin:4px 0 0 0;font-size:10px;color:#27272a;font-family:Menlo,'Courier New',monospace;">
              You received this because you have an iFarmX account.
            </p>
          </td></tr>

        </table>
      </td></tr>
    </table>
  </div>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload: AppreciationPayload = await req.json();
    const {
      recipient_ids,
      recipient_emails,
      recipient_names,
      sender_name,
      title,
      message,
      badge_type,
      period_label,
    } = payload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let emailsSent = 0;

    const emailPromises = recipient_emails.map(async (email, idx) => {
      const name = recipient_names[idx] || "Farmer";
      const recipientId = recipient_ids[idx];

      const htmlBody = buildAppreciationHtml(
        name,
        title,
        message,
        badge_type,
        period_label,
        sender_name
      );

      if (resendApiKey) {
        const badge = badgeConfig[badge_type] || defaultBadge;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "iFarmX <notifications@ifarmx.com>",
            to: [email],
            subject: `${badge.label} - ${title}`,
            html: htmlBody,
          }),
        });

        if (emailRes.ok) {
          emailsSent++;
        } else {
          const err = await emailRes.json();
          console.error(`Resend error for ${email}:`, JSON.stringify(err));
        }
      }

      await supabase
        .from("appreciations")
        .update({ email_sent: true })
        .eq("recipient_id", recipientId)
        .eq("email_sent", false);
    });

    await Promise.allSettled(emailPromises);

    return new Response(
      JSON.stringify({
        success: true,
        processed: recipient_emails.length,
        emails_sent: emailsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
