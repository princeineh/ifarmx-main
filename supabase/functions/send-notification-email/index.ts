import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const APP_URL = Deno.env.get("SITE_URL") || "https://ifarmx.com";

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
}

interface TypeStyle {
  accent: string;
  glow: string;
  icon: string;
  label: string;
  ctaText: string;
  ctaUrl: string;
}

const typeConfig: Record<string, TypeStyle> = {
  welcome: {
    accent: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    icon: "&#9655;",
    label: "SYS.WELCOME",
    ctaText: "Initialize Dashboard",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
  login_alert: {
    accent: "#ef4444",
    glow: "rgba(239,68,68,0.15)",
    icon: "&#9888;",
    label: "SEC.ALERT",
    ctaText: "Review Account",
    ctaUrl: `${APP_URL}?page=profile`,
  },
  order_placed: {
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    icon: "&#9654;",
    label: "ORD.PLACED",
    ctaText: "Track Order",
    ctaUrl: `${APP_URL}?page=order-tracking`,
  },
  payment_confirmed: {
    accent: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    icon: "&#10003;",
    label: "PAY.CONFIRMED",
    ctaText: "View Status",
    ctaUrl: `${APP_URL}?page=order-tracking`,
  },
  kit_activated: {
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.15)",
    icon: "&#9889;",
    label: "KIT.ACTIVE",
    ctaText: "View Plants",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
  appreciation: {
    accent: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    icon: "&#9733;",
    label: "APPRECIATION",
    ctaText: "View Achievements",
    ctaUrl: `${APP_URL}?page=achievements`,
  },
  program_update: {
    accent: "#3b82f6",
    glow: "rgba(59,130,246,0.15)",
    icon: "&#9673;",
    label: "PROG.UPDATE",
    ctaText: "View Program",
    ctaUrl: `${APP_URL}?page=organization`,
  },
  encouragement: {
    accent: "#f97316",
    glow: "rgba(249,115,22,0.15)",
    icon: "&#9733;",
    label: "WELL.DONE",
    ctaText: "Continue Farming",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
  kit_code: {
    accent: "#06b6d4",
    glow: "rgba(6,182,212,0.15)",
    icon: "&#9670;",
    label: "KIT.CODE",
    ctaText: "Activate Kit",
    ctaUrl: `${APP_URL}?page=activate`,
  },
  order_approved: {
    accent: "#10b981",
    glow: "rgba(16,185,129,0.15)",
    icon: "&#10003;",
    label: "ORD.APPROVED",
    ctaText: "Track Order",
    ctaUrl: `${APP_URL}?page=order-tracking`,
  },
  invoice: {
    accent: "#0ea5e9",
    glow: "rgba(14,165,233,0.15)",
    icon: "&#9634;",
    label: "INVOICE",
    ctaText: "View Invoice",
    ctaUrl: `${APP_URL}?page=admin`,
  },
  reminder: {
    accent: "#eab308",
    glow: "rgba(234,179,8,0.15)",
    icon: "&#9679;",
    label: "REMINDER",
    ctaText: "Open Dashboard",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
  care_logged: {
    accent: "#22c55e",
    glow: "rgba(34,197,94,0.15)",
    icon: "&#9678;",
    label: "CARE.LOG",
    ctaText: "View Plants",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
  system: {
    accent: "#6b7280",
    glow: "rgba(107,114,128,0.15)",
    icon: "&#9643;",
    label: "SYSTEM",
    ctaText: "Open Dashboard",
    ctaUrl: `${APP_URL}?page=dashboard`,
  },
};

const SECURITY_TYPES = new Set([
  "login_alert",
  "order_placed",
  "payment_confirmed",
  "kit_activated",
  "care_logged",
]);

function buildEmailHtml(
  record: NotificationRecord,
  recipientName: string
): string {
  const cfg = typeConfig[record.type] || typeConfig.system;
  const displayName = recipientName || "Farmer";
  const year = new Date().getFullYear();
  const showSecurity = SECURITY_TYPES.has(record.type);

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
  <title>${record.title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    * { box-sizing: border-box; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .cp { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-full { width: 100% !important; display: block !important; }
      h1 { font-size: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#07070d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div role="article" aria-roledescription="email" aria-label="${record.title}" lang="en" style="font-size:16px;">
    <div style="display:none;font-size:1px;color:#07070d;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${record.message.substring(0, 120)}&#8199;&#65279;&#847;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07070d;">
      <tr><td align="center" style="padding:40px 16px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin:0 auto;">

          <!-- LOGO -->
          <tr><td style="padding:0 0 32px 0;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding-right:10px;vertical-align:middle;">
                  <div style="width:36px;height:36px;background-color:${cfg.accent};border-radius:8px;text-align:center;line-height:36px;font-size:14px;color:#000;font-weight:800;display:inline-block;letter-spacing:-0.5px;">iF</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:24px;font-weight:800;color:#e4e4e7;letter-spacing:-0.5px;">iFarm</span><span style="font-size:24px;font-weight:800;color:${cfg.accent};letter-spacing:-0.5px;">X</span>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- MAIN CARD -->
          <tr><td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111119;border-radius:16px;overflow:hidden;border:1px solid #1f1f2e;">

              <!-- Accent top bar -->
              <tr><td style="height:3px;background-color:${cfg.accent};font-size:0;line-height:0;">&nbsp;</td></tr>

              <!-- Type badge -->
              <tr><td class="cp" style="padding:28px 36px 0 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr><td style="background-color:${cfg.glow};border:1px solid #252535;border-radius:6px;padding:6px 14px;">
                    <span style="font-size:11px;font-weight:700;color:${cfg.accent};letter-spacing:1.5px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">${cfg.icon}&nbsp; ${cfg.label}</span>
                  </td></tr>
                </table>
              </td></tr>

              <!-- Greeting -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <p style="margin:0;font-size:13px;color:#52525b;line-height:1.5;font-family:Menlo,'Courier New',monospace;">Hello, <span style="color:${cfg.accent};font-weight:800;">${displayName}</span></p>
              </td></tr>

              <!-- Title -->
              <tr><td class="cp" style="padding:10px 36px 0 36px;">
                <h1 style="margin:0;font-size:26px;font-weight:800;color:#f4f4f5;line-height:1.3;letter-spacing:-0.5px;">${record.title}</h1>
              </td></tr>

              <!-- Divider -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:40px;height:1px;background-color:${cfg.accent};font-size:0;">&nbsp;</td>
                    <td style="height:1px;background-color:#252535;font-size:0;">&nbsp;</td>
                  </tr>
                </table>
              </td></tr>

              <!-- Message -->
              <tr><td class="cp" style="padding:22px 36px 0 36px;">
                <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.8;">${record.message}</p>
              </td></tr>

              <!-- CTA Button -->
              <tr><td class="cp" style="padding:30px 36px 0 36px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr><td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr><td style="border-radius:8px;background-color:${cfg.accent};">
                        <a href="${cfg.ctaUrl}" target="_blank" style="display:inline-block;padding:14px 40px;font-size:13px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.8px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                          ${cfg.ctaText} &#8594;
                        </a>
                      </td></tr>
                    </table>
                  </td></tr>
                </table>
              </td></tr>

              <!-- URL hint -->
              <tr><td class="cp" style="padding:10px 36px 0 36px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">
                  &gt; <a href="${cfg.ctaUrl}" style="color:#52525b;text-decoration:underline;">ifarmx.com</a>
                </p>
              </td></tr>

              ${showSecurity ? `
              <!-- Security warning -->
              <tr><td class="cp" style="padding:20px 36px 0 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:rgba(239,68,68,0.08);border-radius:8px;border:1px solid #3b1111;">
                  <tr><td style="padding:14px 18px;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#fca5a5;line-height:1.5;font-family:Menlo,'Courier New',monospace;">
                      &#9888; Not you? <a href="${APP_URL}?page=forgot-password" style="color:#ef4444;text-decoration:underline;font-weight:700;">Reset password now</a>
                    </p>
                  </td></tr>
                </table>
              </td></tr>
              ` : ""}

              <tr><td style="padding:32px 0 0 0;"></td></tr>
            </table>
          </td></tr>

          <!-- STATS BAR -->
          <tr><td style="padding:12px 0 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#111119;border-radius:12px;border:1px solid #1f1f2e;">
              <tr>
                <td width="33%" style="padding:16px 8px;text-align:center;border-right:1px solid #1f1f2e;">
                  <p style="margin:0 0 3px 0;font-size:11px;font-weight:700;color:${cfg.accent};letter-spacing:1.2px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">Track</p>
                  <p style="margin:0;font-size:10px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">growth.log</p>
                </td>
                <td width="34%" style="padding:16px 8px;text-align:center;border-right:1px solid #1f1f2e;">
                  <p style="margin:0 0 3px 0;font-size:11px;font-weight:700;color:${cfg.accent};letter-spacing:1.2px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">Log</p>
                  <p style="margin:0;font-size:10px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">care.daily</p>
                </td>
                <td width="33%" style="padding:16px 8px;text-align:center;">
                  <p style="margin:0 0 3px 0;font-size:11px;font-weight:700;color:${cfg.accent};letter-spacing:1.2px;text-transform:uppercase;font-family:Menlo,'Courier New',monospace;">Earn</p>
                  <p style="margin:0;font-size:10px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">badges.xp</p>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- FOOTER -->
          <tr><td style="padding:28px 16px 0 16px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding-right:10px;vertical-align:middle;">
                  <div style="width:20px;height:20px;background-color:${cfg.accent};border-radius:4px;text-align:center;line-height:20px;font-size:9px;color:#000;font-weight:800;display:inline-block;">iF</div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:14px;font-weight:700;color:#52525b;letter-spacing:-0.3px;">iFarm</span><span style="font-size:14px;font-weight:700;color:${cfg.accent};letter-spacing:-0.3px;">X</span>
                </td>
              </tr>
            </table>

            <p style="margin:8px 0 16px 0;font-size:11px;color:#3f3f46;font-family:Menlo,'Courier New',monospace;">Growing smarter. Farming better. Together.</p>

            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding:0 10px;"><a href="${APP_URL}?page=dashboard" style="font-size:11px;color:#52525b;text-decoration:none;font-family:Menlo,'Courier New',monospace;">[Dashboard]</a></td>
                <td style="padding:0 10px;"><a href="${APP_URL}?page=dashboard" style="font-size:11px;color:#52525b;text-decoration:none;font-family:Menlo,'Courier New',monospace;">[Plants]</a></td>
                <td style="padding:0 10px;"><a href="${APP_URL}?page=marketplace" style="font-size:11px;color:#52525b;text-decoration:none;font-family:Menlo,'Courier New',monospace;">[Market]</a></td>
              </tr>
            </table>

            <p style="margin:16px 0 0 0;font-size:10px;color:#27272a;font-family:Menlo,'Courier New',monospace;">
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
    const { record }: { record: NotificationRecord } = await req.json();

    if (!record?.user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id in record" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData } = await supabase.auth.admin.getUserById(
      record.user_id
    );
    const recipientEmail = userData?.user?.email;

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", record.user_id)
      .maybeSingle();

    const { data: farmGroup } = await supabase
      .from("farming_groups")
      .select("group_name")
      .eq("user_id", record.user_id)
      .limit(1)
      .maybeSingle();

    const recipientName =
      farmGroup?.group_name ||
      profile?.display_name ||
      userData?.user?.user_metadata?.full_name ||
      userData?.user?.user_metadata?.name ||
      "";

    if (!recipientEmail) {
      return new Response(
        JSON.stringify({
          error: "User email not found",
          user_id: record.user_id,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not set - skipping email send");
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: "RESEND_API_KEY not configured",
          recipient: recipientEmail,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const htmlBody = buildEmailHtml(record, recipientName);
    const cfg = typeConfig[record.type] || typeConfig.system;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "iFarmX <notifications@ifarmx.com>",
        to: [recipientEmail],
        subject: `${cfg.label} - ${record.title}`,
        html: htmlBody,
      }),
    });

    const emailResult = await emailRes.json();

    if (!emailRes.ok) {
      console.error("Resend API error:", JSON.stringify(emailResult));
      return new Response(
        JSON.stringify({ error: "Email send failed", details: emailResult }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase
      .from("notifications")
      .update({ email_sent: true })
      .eq("id", record.id);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResult.id,
        recipient: recipientEmail,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("send-notification-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
