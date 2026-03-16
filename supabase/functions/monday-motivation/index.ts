import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const mondayMotivations = [
  {
    title: "New Week, New Growth!",
    message: (name: string) =>
      `${name}, it's a brand new week full of possibilities! Just like your plants grow stronger every day, so do you. This week, let's aim higher, work smarter, and celebrate every small win. Your farming journey is a testament to resilience and dedication. Let's make this week count!`,
  },
  {
    title: "Monday Energy: You've Got This!",
    message: (name: string) =>
      `Good morning ${name}! The best farmers don't wait for perfect conditions -- they create them. This Monday brings fresh opportunities to nurture your plants, learn something new, and inspire others in the community. You're part of something bigger than farming; you're building a sustainable future!`,
  },
  {
    title: "Start Strong, Finish Stronger!",
    message: (name: string) =>
      `${name}, every great harvest begins with small, consistent actions. This Monday, commit to showing up for your plants and yourself. Whether it's logging care, checking soil moisture, or just taking a moment to appreciate your progress -- every step matters. Let's grow together!`,
  },
  {
    title: "Your Weekly Dose of Inspiration",
    message: (name: string) =>
      `${name}, did you know that consistent farmers see 3x better results? This week, let's focus on consistency over perfection. One care log a day, one conversation with fellow farmers, one small improvement. That's how champions are built. Your plants believe in you, and so do we!`,
  },
  {
    title: "Monday Mindset: Growth Mode Activated!",
    message: (name: string) =>
      `Hey ${name}, here's your Monday reminder: you're not just growing plants, you're growing skills, confidence, and a legacy. Every seed you plant is a vote for the future you want to see. This week, show your plants (and yourself) what dedication looks like. Let's thrive!`,
  },
  {
    title: "Rise and Shine, Farmer!",
    message: (name: string) =>
      `${name}, Mondays are for fresh starts! Your farming journey is unique and powerful. Whether you're just getting started or have been farming for years, this week is a chance to level up. Check on your plants, connect with the community, and remember: agriculture changes lives -- starting with yours!`,
  },
  {
    title: "The Week Ahead Looks Green!",
    message: (name: string) =>
      `${name}, welcome to a new week of possibilities! Agriculture is more than a skill -- it's a lifestyle, a mission, and a movement. This week, let's celebrate the small victories: a new leaf sprouting, hitting your care log streak, or helping a fellow farmer. You're making a difference!`,
  },
  {
    title: "Fuel Your Week with Purpose",
    message: (name: string) =>
      `Good Monday morning, ${name}! Remember why you started this journey. Whether it's for financial freedom, food security, or building something meaningful, your "why" is powerful. This week, let that purpose guide every action. Your plants are counting on you, and you won't let them down!`,
  },
];

const reservationMotivations = [
  {
    title: "Your Farming Journey Starts Soon!",
    message: (name: string) =>
      `${name}, you've taken the first step by reserving your spot, and we're so excited for you! This Monday, take a moment to visualize your farm thriving, your plants growing, and the impact you'll have. Your journey into agriculture is closer than ever. Get ready to grow!`,
  },
  {
    title: "From Reservation to Reality",
    message: (name: string) =>
      `Hey ${name}, great news! Your reservation shows you're serious about building a better future through farming. This week, explore the iFarmX platform, learn about oil palm cultivation, and get ready for an incredible journey. The farming revolution is waiting for you!`,
  },
  {
    title: "You're Almost There!",
    message: (name: string) =>
      `${name}, your reserved spot is your ticket to becoming part of Nigeria's agricultural transformation. This Monday, we celebrate you for taking that bold step. Soon you'll be logging care, watching plants grow, and earning real results. Stay ready -- your kit is coming!`,
  },
];

const universalMotivations = [
  {
    title: "Happy Monday, Champion!",
    message: (name: string) =>
      `${name}, welcome to a brand new week! At iFarmX, we believe every person has the potential to create change through agriculture. Whether you're farming today or planning for tomorrow, you're part of a community that's reshaping Nigeria's future. Let's make this week legendary!`,
  },
  {
    title: "Monday Vibes: Let's Grow Together!",
    message: (name: string) =>
      `${name}, it's Monday and the energy is high! This platform exists because of people like you who believe in innovation, sustainability, and the power of smart farming. This week, let's learn, share, and support each other. Together, we're unstoppable!`,
  },
  {
    title: "Your Potential Is Unlimited",
    message: (name: string) =>
      `Good morning, ${name}! Every Monday is a reminder that growth never stops. Whether you're nurturing plants, exploring new opportunities, or inspiring others, you're making an impact. This week, challenge yourself to try something new. The best version of you is just ahead!`,
  },
  {
    title: "Start Your Week with Confidence",
    message: (name: string) =>
      `${name}, Mondays are for setting the tone! This week, carry the confidence that you're part of something transformative. iFarmX is more than a platform -- it's a movement. Your participation, energy, and vision matter. Let's make this week one for the books!`,
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreetingName(
  displayName: string | null,
  farmName: string | null
): string {
  if (farmName) return farmName;
  if (displayName) return displayName;
  return "Champion";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const dayOfWeek = now.getDay();

    if (dayOfWeek !== 1) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Not Monday - skipping motivation",
          date: today,
          day: dayOfWeek,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stats = {
      active_farmers: 0,
      reserved_users: 0,
      general_users: 0,
      total_sent: 0,
    };

    const { data: todayMotivations } = await supabase
      .from("notifications")
      .select("user_id")
      .gte("created_at", `${today}T00:00:00Z`)
      .like("title", "%Monday%");

    const alreadySentToday = new Set(
      (todayMotivations || []).map((n: { user_id: string }) => n.user_id)
    );

    const { data: allUsers } = await supabase
      .from("user_profiles")
      .select("id, display_name, user_type");

    if (!allUsers || allUsers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          date: today,
          stats,
          note: "No users found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = allUsers.map((u: { id: string }) => u.id);

    const { data: farmingGroups } = await supabase
      .from("farming_groups")
      .select("user_id, group_name")
      .in("user_id", userIds);

    const farmNameMap = new Map<string, string>();
    (farmingGroups || []).forEach(
      (g: { user_id: string; group_name: string }) => {
        farmNameMap.set(g.user_id, g.group_name);
      }
    );

    const { data: usersWithPlants } = await supabase
      .from("plants")
      .select("user_id")
      .not("kit_code_id", "is", null);

    const activeFarmerIds = new Set(
      (usersWithPlants || []).map((p: { user_id: string }) => p.user_id)
    );

    const { data: reservations } = await supabase
      .from("reservations")
      .select("user_id")
      .is("confirmed_at", null);

    const reservedUserIds = new Set(
      (reservations || []).map((r: { user_id: string }) => r.user_id)
    );

    const motivationInserts = allUsers
      .filter(
        (u: { id: string; user_type: string }) =>
          u.user_type !== "organization" && !alreadySentToday.has(u.id)
      )
      .map((u: { id: string; display_name: string | null }) => {
        const name = getGreetingName(
          u.display_name,
          farmNameMap.get(u.id) || null
        );
        let template;

        if (activeFarmerIds.has(u.id)) {
          template = pickRandom(mondayMotivations);
          stats.active_farmers++;
        } else if (reservedUserIds.has(u.id)) {
          template = pickRandom(reservationMotivations);
          stats.reserved_users++;
        } else {
          template = pickRandom(universalMotivations);
          stats.general_users++;
        }

        return {
          user_id: u.id,
          type: "encouragement",
          title: template.title,
          message: template.message(name),
        };
      });

    if (motivationInserts.length > 0) {
      const batchSize = 500;
      for (let i = 0; i < motivationInserts.length; i += batchSize) {
        const batch = motivationInserts.slice(i, i + batchSize);
        await supabase.from("notifications").insert(batch);
      }
      stats.total_sent = motivationInserts.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        day: "Monday",
        stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("monday-motivation error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
