import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      email, password, fullName, phone, country, state,
      kitCount, reservationType, futureInterests,
      joinAs, slots, calculatedAmount,
    } = await req.json();

    if (!email || !password || !fullName || !phone) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      const msg = createError.message?.toLowerCase() || "";
      if (msg.includes("already been registered") || msg.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "already_registered" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw createError;
    }

    const userId = userData.user.id;

    await supabase
      .from("user_profiles")
      .update({ display_name: fullName, phone_number: phone })
      .eq("id", userId);

    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      const resolvedSlots = slots || 1;
      const resolvedAmount = calculatedAmount || 0;
      const resolvedJoinAs = joinAs || "individual";

      const { error: reservationError } = await supabase
        .from("reservations")
        .insert({
          user_id: userId,
          full_name: fullName,
          phone,
          email,
          country: country || "Nigeria",
          state: state || null,
          kit_count: kitCount || String(resolvedSlots),
          reservation_type: reservationType || "test_run",
          future_interests: futureInterests || [],
          batch: 1,
          status: "reserved",
          join_as: resolvedJoinAs,
          slots: resolvedSlots,
          calculated_amount: resolvedAmount,
        });

      if (reservationError) throw reservationError;
    }

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "system",
      title: "Batch 1 Spot Reserved!",
      message: `Welcome to iFarmX, ${fullName}! Your Batch 1 spot is secured. No payment required until April 1. Explore the platform, take the guided tour, and get ready for your farming journey.`,
    });

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
