import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface UserReminder {
  user_id: string;
  display_name: string | null;
  farm_name: string | null;
}

const careLogReminders = [
  {
    title: "Your Plants Are Waiting for You!",
    message: (name: string) =>
      `${name}, your plants need your attention today! A quick care log keeps your farm data sharp and your growth on track. Consistent logging helps you spot issues early, earn achievements, and get better agronomist recommendations. Don't break your streak -- log now and keep growing!`,
  },
  {
    title: "Time to Check In on Your Farm",
    message: (name: string) =>
      `Hey ${name}, your oil palm seedlings are counting on you! Logging your daily care takes less than 2 minutes but the benefits are massive: track watering patterns, catch pest problems early, and build a farming record that proves your dedication. Your future self will thank you!`,
  },
  {
    title: "Don't Let Today Slip By!",
    message: (name: string) =>
      `${name}, every day you log is a step closer to harvest glory. Farmers who log consistently see 40% better outcomes because they catch problems before they spread. Open iFarmX now and record today's care -- your plants are growing even when you're not watching!`,
  },
  {
    title: "Your Farming Streak Needs You",
    message: (name: string) =>
      `${name}, consistent farmers are successful farmers! Your daily care log helps you build a complete picture of your farming journey. Plus, active loggers get priority support from agronomists and stand out in program leaderboards. Take 2 minutes and log now!`,
  },
  {
    title: "Quick Reminder: Log Your Farm Care",
    message: (name: string) =>
      `Hi ${name}, just a friendly nudge -- have you logged your plant care today? Regular logging unlocks insights about your soil, growth patterns, and overall plant health. It also helps your program coordinators support you better. Your dedication matters!`,
  },
];

const careLogAppreciations = [
  {
    title: "Amazing Work Today!",
    message: (name: string) =>
      `${name}, you crushed it today! Your care log has been recorded and your plants are thriving because of your dedication. Tomorrow brings new growth opportunities -- we'll be here to remind you. Keep this momentum going and watch your farm transform!`,
  },
  {
    title: "Your Plants Say Thank You!",
    message: (name: string) =>
      `Great job ${name}! Your consistent care is building a powerful farming record. Every log entry helps our agronomist AI give you better, more personalized advice. See you tomorrow -- together we're growing something incredible!`,
  },
  {
    title: "Logged and Loaded!",
    message: (name: string) =>
      `${name}, another successful day in the books! Your farming data is getting richer and your plants are getting stronger. Remember: the best farmers are the most consistent ones. We'll check in tomorrow -- keep that streak alive!`,
  },
  {
    title: "You're Building Something Great",
    message: (name: string) =>
      `Well done ${name}! Today's log is another brick in your farming success story. Your data helps predict the best watering schedules, optimal fertilizer timing, and early pest detection. See you bright and early tomorrow!`,
  },
];

const kitActivationReminders = [
  {
    title: "Your Kit Is Ready to Activate!",
    message: (name: string) =>
      `${name}, you have a kit code waiting to be activated! Activating your kit unlocks your personal farming dashboard, plant tracking, daily care logs, and access to expert agronomist support. Don't wait -- activate now and start your farming journey today!`,
  },
  {
    title: "Unlock Your Farming Potential",
    message: (name: string) =>
      `Hey ${name}, your iFarmX kit is assigned but not yet activated. You're missing out on growth tracking, achievement badges, marketplace access, and personalized farming recommendations. It takes just 30 seconds to activate -- let's get growing!`,
  },
  {
    title: "Your Farm Awaits!",
    message: (name: string) =>
      `${name}, everything is set up for you -- just activate your kit code to begin! Once activated, you'll join a community of smart farmers tracking their progress, earning rewards, and building real agricultural skills. Activate now!`,
  },
];

const profileReminders = [
  {
    title: "Complete Your Farmer Profile",
    message: (name: string) =>
      `${name}, your profile is incomplete! A complete profile helps program coordinators support you better, unlocks personalized recommendations, and makes you visible in the farming community. Add your location, photo, and details now!`,
  },
  {
    title: "Your Profile Needs a Little Love",
    message: (name: string) =>
      `Hi ${name}, farmers with complete profiles get 3x more engagement from coordinators and agronomists. Add your state, photo, and contact details so we can serve you better. It only takes a minute!`,
  },
];

const kitVerificationReminders = [
  {
    title: "Verify Your Kit Contents",
    message: (name: string) =>
      `${name}, have you checked all the items in your kit? Verifying your kit ensures you have everything needed for successful farming. If anything is missing, we can help resolve it quickly. Open iFarmX and verify your kit now!`,
  },
  {
    title: "Kit Check: Make Sure You Have Everything",
    message: (name: string) =>
      `Hey ${name}, a quick kit verification protects you! Confirm all your items are present so there are no surprises later. If something's missing, early reporting means faster replacement. Check your kit today!`,
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreetingName(displayName: string | null, farmName: string | null): string {
  if (farmName) return farmName;
  if (displayName) return displayName;
  return "Farmer";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date().toISOString().split("T")[0];

    const stats = {
      care_reminders: 0,
      care_appreciations: 0,
      kit_activation_reminders: 0,
      profile_reminders: 0,
      kit_verification_reminders: 0,
    };

    const { data: todayNotifs } = await supabase
      .from("notifications")
      .select("user_id, type, title")
      .gte("created_at", `${today}T00:00:00Z`)
      .in("type", ["reminder", "appreciation", "encouragement"]);

    const sentToday = new Set(
      (todayNotifs || []).map((n: { user_id: string; type: string }) => `${n.user_id}:${n.type}`)
    );

    const { data: usersWithPlants } = await supabase
      .from("plants")
      .select("user_id")
      .not("kit_code_id", "is", null);

    const plantUserIds = [...new Set((usersWithPlants || []).map((p: { user_id: string }) => p.user_id))];

    if (plantUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", plantUserIds);

      const { data: farmingGroups } = await supabase
        .from("farming_groups")
        .select("user_id, group_name")
        .in("user_id", plantUserIds);

      const profileMap = new Map<string, string | null>();
      (profiles || []).forEach((p: { id: string; display_name: string | null }) => {
        profileMap.set(p.id, p.display_name);
      });

      const farmNameMap = new Map<string, string | null>();
      (farmingGroups || []).forEach((g: { user_id: string; group_name: string }) => {
        farmNameMap.set(g.user_id, g.group_name);
      });

      const { data: todayLogs } = await supabase
        .from("care_logs")
        .select("user_id")
        .eq("log_date", today);

      const loggedTodaySet = new Set((todayLogs || []).map((l: { user_id: string }) => l.user_id));

      const notLoggedUsers: UserReminder[] = [];
      const loggedUsers: UserReminder[] = [];

      for (const uid of plantUserIds) {
        const reminder: UserReminder = {
          user_id: uid,
          display_name: profileMap.get(uid) || null,
          farm_name: farmNameMap.get(uid) || null,
        };
        if (loggedTodaySet.has(uid)) {
          loggedUsers.push(reminder);
        } else {
          notLoggedUsers.push(reminder);
        }
      }

      const careReminderInserts = notLoggedUsers
        .filter((u) => !sentToday.has(`${u.user_id}:reminder`))
        .map((u) => {
          const template = pickRandom(careLogReminders);
          const name = getGreetingName(u.display_name, u.farm_name);
          return {
            user_id: u.user_id,
            type: "reminder",
            title: template.title,
            message: template.message(name),
          };
        });

      if (careReminderInserts.length > 0) {
        await supabase.from("notifications").insert(careReminderInserts);
        stats.care_reminders = careReminderInserts.length;
      }

      const appreciationInserts = loggedUsers
        .filter((u) => !sentToday.has(`${u.user_id}:encouragement`))
        .map((u) => {
          const template = pickRandom(careLogAppreciations);
          const name = getGreetingName(u.display_name, u.farm_name);
          return {
            user_id: u.user_id,
            type: "encouragement",
            title: template.title,
            message: template.message(name),
          };
        });

      if (appreciationInserts.length > 0) {
        await supabase.from("notifications").insert(appreciationInserts);
        stats.care_appreciations = appreciationInserts.length;
      }
    }

    const { data: assignedUnactivated } = await supabase
      .from("kit_codes")
      .select("assigned_to_user_id")
      .eq("used", false)
      .not("assigned_to_user_id", "is", null);

    const unactivatedUserIds = [
      ...new Set(
        (assignedUnactivated || [])
          .map((k: { assigned_to_user_id: string | null }) => k.assigned_to_user_id)
          .filter(Boolean) as string[]
      ),
    ];

    if (unactivatedUserIds.length > 0) {
      const { data: unactivatedProfiles } = await supabase
        .from("user_profiles")
        .select("id, display_name")
        .in("id", unactivatedUserIds);

      const { data: unactivatedGroups } = await supabase
        .from("farming_groups")
        .select("user_id, group_name")
        .in("user_id", unactivatedUserIds);

      const upMap = new Map<string, string | null>();
      (unactivatedProfiles || []).forEach((p: { id: string; display_name: string | null }) => {
        upMap.set(p.id, p.display_name);
      });

      const ugMap = new Map<string, string | null>();
      (unactivatedGroups || []).forEach((g: { user_id: string; group_name: string }) => {
        ugMap.set(g.user_id, g.group_name);
      });

      const kitInserts = unactivatedUserIds
        .filter((uid) => !sentToday.has(`${uid}:reminder`))
        .map((uid) => {
          const template = pickRandom(kitActivationReminders);
          const name = getGreetingName(upMap.get(uid) || null, ugMap.get(uid) || null);
          return {
            user_id: uid,
            type: "reminder",
            title: template.title,
            message: template.message(name),
          };
        });

      if (kitInserts.length > 0) {
        await supabase.from("notifications").insert(kitInserts);
        stats.kit_activation_reminders = kitInserts.length;
      }
    }

    const { data: incompleteProfiles } = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .or("state_of_origin.is.null,phone_number.is.null,avatar_url.is.null")
      .neq("user_type", "organization");

    if (incompleteProfiles && incompleteProfiles.length > 0) {
      const incompleteIds = incompleteProfiles.map((p: { id: string }) => p.id);

      const { data: incompleteGroups } = await supabase
        .from("farming_groups")
        .select("user_id, group_name")
        .in("user_id", incompleteIds);

      const igMap = new Map<string, string | null>();
      (incompleteGroups || []).forEach((g: { user_id: string; group_name: string }) => {
        igMap.set(g.user_id, g.group_name);
      });

      const profileInserts = incompleteProfiles
        .filter((p: { id: string }) => !sentToday.has(`${p.id}:reminder`))
        .map((p: { id: string; display_name: string | null }) => {
          const template = pickRandom(profileReminders);
          const name = getGreetingName(p.display_name, igMap.get(p.id) || null);
          return {
            user_id: p.id,
            type: "reminder",
            title: template.title,
            message: template.message(name),
          };
        });

      if (profileInserts.length > 0) {
        await supabase.from("notifications").insert(profileInserts);
        stats.profile_reminders = profileInserts.length;
      }
    }

    const { data: activatedKits } = await supabase
      .from("kit_codes")
      .select("id, user_id")
      .eq("used", true)
      .not("user_id", "is", null);

    if (activatedKits && activatedKits.length > 0) {
      const activatedKitIds = activatedKits.map((k: { id: string }) => k.id);
      const activatedUserIds = [...new Set(activatedKits.map((k: { user_id: string }) => k.user_id))];

      const { data: verifications } = await supabase
        .from("kit_verifications")
        .select("kit_code_id")
        .in("kit_code_id", activatedKitIds);

      const verifiedKitIds = new Set((verifications || []).map((v: { kit_code_id: string }) => v.kit_code_id));

      const unverifiedUsers = activatedKits
        .filter((k: { id: string }) => !verifiedKitIds.has(k.id))
        .map((k: { user_id: string }) => k.user_id);

      const uniqueUnverified = [...new Set(unverifiedUsers)];

      if (uniqueUnverified.length > 0) {
        const { data: unverifiedProfiles } = await supabase
          .from("user_profiles")
          .select("id, display_name")
          .in("id", uniqueUnverified);

        const { data: unverifiedGroups } = await supabase
          .from("farming_groups")
          .select("user_id, group_name")
          .in("user_id", uniqueUnverified);

        const uvpMap = new Map<string, string | null>();
        (unverifiedProfiles || []).forEach((p: { id: string; display_name: string | null }) => {
          uvpMap.set(p.id, p.display_name);
        });

        const uvgMap = new Map<string, string | null>();
        (unverifiedGroups || []).forEach((g: { user_id: string; group_name: string }) => {
          uvgMap.set(g.user_id, g.group_name);
        });

        const verifyInserts = uniqueUnverified
          .filter((uid) => !sentToday.has(`${uid}:reminder`))
          .map((uid) => {
            const template = pickRandom(kitVerificationReminders);
            const name = getGreetingName(uvpMap.get(uid) || null, uvgMap.get(uid) || null);
            return {
              user_id: uid,
              type: "reminder",
              title: template.title,
              message: template.message(name),
            };
          });

        if (verifyInserts.length > 0) {
          await supabase.from("notifications").insert(verifyInserts);
          stats.kit_verification_reminders = verifyInserts.length;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: today, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("daily-reminders error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
