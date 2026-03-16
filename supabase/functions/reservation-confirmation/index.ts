import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ReservationPayload {
  email: string;
  name: string;
  kitCount?: string;
  joinAs?: string;
  slots?: number;
  calculatedAmount?: number;
  reservationType?: string;
}

const JOIN_AS_LABELS: Record<string, string> = {
  individual: "Individual Farmer",
  family: "Family / Group",
  organisation: "Organisation / Sponsor",
};

function formatNaira(amount: number): string {
  return "\u20A6" + amount.toLocaleString("en-NG");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      email,
      name,
      kitCount,
      joinAs,
      slots,
      calculatedAmount,
      reservationType,
    }: ReservationPayload = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing email or name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not set - skipping email send");
      return new Response(
        JSON.stringify({ success: true, message: "Email skipped - no API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedSlots = slots || 1;
    const resolvedAmount = calculatedAmount || 0;
    const resolvedJoinAs = joinAs || "individual";
    const tierLabel = JOIN_AS_LABELS[resolvedJoinAs] || "Individual Farmer";
    const isReserving = reservationType === "reserve" || resolvedAmount > 0;
    const amountDisplay = resolvedAmount > 0 ? formatNaira(resolvedAmount) : formatNaira(resolvedSlots * 24999);

    const reservationSection = isReserving
      ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 12px; font-weight: 600;">Your Reservation Summary</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #374151; font-size: 13px; padding: 4px 0;">Joining as</td>
            <td style="color: #166534; font-size: 13px; font-weight: 600; text-align: right;">${tierLabel}</td>
          </tr>
          <tr>
            <td style="color: #374151; font-size: 13px; padding: 4px 0;">Slots reserved</td>
            <td style="color: #166534; font-size: 13px; font-weight: 600; text-align: right;">${resolvedSlots} kit${resolvedSlots !== 1 ? "s" : ""}</td>
          </tr>
          <tr>
            <td style="color: #374151; font-size: 13px; padding: 4px 0;">Total amount</td>
            <td style="color: #166534; font-size: 13px; font-weight: 700; text-align: right;">${amountDisplay}</td>
          </tr>
          <tr>
            <td style="color: #374151; font-size: 13px; padding: 4px 0;">Shipping</td>
            <td style="color: #6b7280; font-size: 12px; text-align: right;">Calculated at delivery</td>
          </tr>
        </table>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #bbf7d0;">
          <p style="color: #15803d; font-size: 12px; margin: 0; text-align: center; font-weight: 600;">
            No payment today &mdash; payment link sent April 1, 2025
          </p>
        </div>
      </div>`
      : `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 8px; font-weight: 600;">You're in the Test Run</p>
        <p style="color: #15803d; font-size: 13px; margin: 0; line-height: 1.6;">
          Joining as <strong>${tierLabel}</strong>. Explore all features freely &mdash; no payment required until April 1, 2025.
          When the platform launches you'll receive your payment link directly to this email.
        </p>
      </div>`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f7faf8; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #040a07, #0d1f14); padding: 32px; text-align: center;">
      <div style="display: inline-block; background: linear-gradient(135deg, #00FF9F, #00D4FF); width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px; color: #040a07; font-weight: bold; margin-bottom: 12px;">i</div>
      <div style="display: inline-block; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); border-radius: 20px; padding: 4px 14px; margin-bottom: 12px;">
        <span style="color: #fbbf24; font-size: 11px; font-weight: 700; letter-spacing: 0.05em;">TEST RUN &mdash; LAUNCHING APRIL 1</span>
      </div>
      <h1 style="color: #fff; font-size: 22px; margin: 0 0 4px;">Your Batch 1 Spot is Secured!</h1>
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">iFarmX &mdash; Africa's Structured Self-Farming Platform</p>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">Hi ${name},</p>
      <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
        You're in! <strong>No payment required today.</strong> Your account is active and the full platform is open to explore right now.
      </p>

      ${reservationSection}

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 0 0 20px;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 8px; font-weight: 600;">What happens next:</p>
        <ul style="color: #b45309; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.9;">
          <li>Log in now and take the guided tour &mdash; it takes 3 minutes</li>
          <li>Explore every feature: Farm Tracker, AI Agronomist, Trade Centre</li>
          <li>On <strong>April 1, 2025</strong>, we'll send your payment link to this email</li>
          <li>After payment, your kit ships within 5&ndash;7 working days</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://ifarmx.com" style="display: inline-block; background: linear-gradient(135deg, #00FF9F, #00D4FF); color: #040a07; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;">Log In &amp; Explore Now</a>
      </div>

      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 20px 0 0; text-align: center;">
        Questions? Reply to this email or reach us at <a href="mailto:hello@ifarmx.com" style="color: #00a86b;">hello@ifarmx.com</a>
      </p>
    </div>
    <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0;">
        &copy; 2026 iFarmX &mdash; Africa's Structured Self-Farming Platform<br>
        Agricultural outcomes depend on biological growth cycles and proper care.
      </p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "iFarmX <noreply@ifarmx.com>",
        reply_to: "hello@ifarmx.com",
        to: [email],
        subject: "Your iFarmX Batch 1 Spot is Secured!",
        html: htmlBody,
      }),
    });

    const resData = await res.json();

    return new Response(
      JSON.stringify({ success: res.ok, data: resData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
