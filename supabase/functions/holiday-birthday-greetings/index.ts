import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Holiday {
  month: number;
  day: number;
  name: string;
  greeting: string;
  message: (name: string) => string;
}

const fixedHolidays: Holiday[] = [
  {
    month: 1, day: 1,
    name: "New Year",
    greeting: "Happy New Year!",
    message: (n) => `${n}, wishing you a prosperous and fruitful New Year! May this year bring abundant harvests, healthy plants, and incredible growth for you and your farm. Here's to new beginnings and green fields ahead!`,
  },
  {
    month: 2, day: 14,
    name: "Valentine's Day",
    greeting: "Happy Valentine's Day!",
    message: (n) => `${n}, Happy Valentine's Day! Love grows in many forms -- including the love and care you show your plants every day. Today we celebrate your dedication to nurturing life. Keep spreading that love to your farm, your family, and your community!`,
  },
  {
    month: 3, day: 8,
    name: "International Women's Day",
    greeting: "Happy International Women's Day!",
    message: (n) => `${n}, today we celebrate women everywhere who are shaping the future of agriculture. Women farmers are the backbone of food security. Thank you for being part of this movement. Your strength and dedication inspire us all!`,
  },
  {
    month: 5, day: 1,
    name: "Workers' Day",
    greeting: "Happy Workers' Day!",
    message: (n) => `${n}, Happy Workers' Day! Farming is one of the most important jobs in the world, and your hard work feeds communities. Today we honor your dedication, early mornings, and tireless effort. You deserve every reward that comes your way!`,
  },
  {
    month: 5, day: 27,
    name: "Children's Day",
    greeting: "Happy Children's Day!",
    message: (n) => `${n}, Happy Children's Day! The seeds we plant today nourish the next generation. Whether you're farming with your family or teaching young ones about agriculture, you're building a legacy. Every child deserves to see where their food comes from!`,
  },
  {
    month: 6, day: 12,
    name: "Democracy Day",
    greeting: "Happy Democracy Day, Nigeria!",
    message: (n) => `${n}, Happy Democracy Day! Agriculture is the true foundation of a nation's independence. As you grow your plants and feed your community, you're contributing to Nigeria's strength and self-sufficiency. Keep farming, keep growing!`,
  },
  {
    month: 10, day: 1,
    name: "Independence Day",
    greeting: "Happy Independence Day, Nigeria!",
    message: (n) => `${n}, Happy Independence Day! Nigeria's future is rooted in agriculture, and farmers like you are leading the charge. Your commitment to growing food and building sustainable farms is a true act of patriotism. Proud of you!`,
  },
  {
    month: 10, day: 16,
    name: "World Food Day",
    greeting: "Happy World Food Day!",
    message: (n) => `${n}, Happy World Food Day! Today the world celebrates people like you who work to put food on tables. Every seed you plant, every care log you record, every harvest you reap makes a difference. You are part of the solution to global food security!`,
  },
  {
    month: 12, day: 25,
    name: "Christmas",
    greeting: "Merry Christmas!",
    message: (n) => `${n}, Merry Christmas! May this season of joy and giving fill your heart and home with warmth. Just as the earth brings forth new life, may your farm continue to flourish. Wishing you peace, prosperity, and a bountiful year ahead!`,
  },
  {
    month: 12, day: 26,
    name: "Boxing Day",
    greeting: "Happy Boxing Day!",
    message: (n) => `${n}, Happy Boxing Day! Take a moment to rest and appreciate how far you've come this year. Your farming journey is a story of growth, resilience, and dedication. Enjoy this day with loved ones -- you've earned it!`,
  },
];

function getIslamicHolidays2026(): Holiday[] {
  return [
    {
      month: 3, day: 20,
      name: "Eid al-Fitr",
      greeting: "Eid Mubarak!",
      message: (n) => `${n}, Eid Mubarak! As you celebrate the end of Ramadan, may Allah bless your farm with abundance. Your patience and discipline in both fasting and farming reflect your strong character. Wishing you and your family joy, peace, and prosperity!`,
    },
    {
      month: 5, day: 27,
      name: "Eid al-Adha",
      greeting: "Eid al-Adha Mubarak!",
      message: (n) => `${n}, Eid al-Adha Mubarak! Today we celebrate sacrifice and devotion. Your daily commitment to your plants is its own form of dedication. May Allah reward your efforts with bountiful harvests and bless your family!`,
    },
    {
      month: 9, day: 5,
      name: "Mawlid an-Nabi",
      greeting: "Happy Mawlid!",
      message: (n) => `${n}, on this blessed day of Mawlid, we celebrate with you. May the Prophet's teachings of hard work, patience, and caring for the earth continue to guide your farming journey. Peace and blessings upon you and your household!`,
    },
  ];
}

function getEasterHolidays2026(): Holiday[] {
  return [
    {
      month: 4, day: 3,
      name: "Good Friday",
      greeting: "Reflections on Good Friday",
      message: (n) => `${n}, wishing you a peaceful Good Friday. Just as seeds must be buried before they sprout, today reminds us that sacrifice leads to new life. May your farming journey continue to bear fruit in every season.`,
    },
    {
      month: 4, day: 5,
      name: "Easter Sunday",
      greeting: "Happy Easter!",
      message: (n) => `${n}, Happy Easter! Just as spring brings new life, may this season bring renewed energy and growth to your farm. Your plants are a living testimony of patience and hope. Wishing you and your family a joyful celebration!`,
    },
  ];
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

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const stats = {
      holiday_messages: 0,
      birthday_messages: 0,
      holiday_name: null as string | null,
    };

    const allHolidays = [
      ...fixedHolidays,
      ...getIslamicHolidays2026(),
      ...getEasterHolidays2026(),
    ];

    const todayHoliday = allHolidays.find((h) => h.month === month && h.day === day);

    const { data: todayNotifs } = await supabase
      .from("notifications")
      .select("user_id, title")
      .gte("created_at", `${today}T00:00:00Z`)
      .eq("type", "system");

    const sentTodaySet = new Set(
      (todayNotifs || []).map((n: { user_id: string; title: string }) => `${n.user_id}:${n.title}`)
    );

    const { data: allProfiles } = await supabase
      .from("user_profiles")
      .select("id, display_name, date_of_birth");

    if (!allProfiles || allProfiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, date: today, stats, note: "No users found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userIds = allProfiles.map((p: { id: string }) => p.id);

    const { data: farmingGroups } = await supabase
      .from("farming_groups")
      .select("user_id, group_name")
      .in("user_id", userIds);

    const farmNameMap = new Map<string, string | null>();
    (farmingGroups || []).forEach((g: { user_id: string; group_name: string }) => {
      farmNameMap.set(g.user_id, g.group_name);
    });

    if (todayHoliday) {
      stats.holiday_name = todayHoliday.name;

      const holidayInserts = allProfiles
        .filter((p: { id: string }) => !sentTodaySet.has(`${p.id}:${todayHoliday.greeting}`))
        .map((p: { id: string; display_name: string | null }) => {
          const name = getGreetingName(p.display_name, farmNameMap.get(p.id) || null);
          return {
            user_id: p.id,
            type: "system",
            title: todayHoliday.greeting,
            message: todayHoliday.message(name),
          };
        });

      if (holidayInserts.length > 0) {
        const batchSize = 500;
        for (let i = 0; i < holidayInserts.length; i += batchSize) {
          const batch = holidayInserts.slice(i, i + batchSize);
          await supabase.from("notifications").insert(batch);
        }
        stats.holiday_messages = holidayInserts.length;
      }
    }

    const birthdayUsers = allProfiles.filter((p: { date_of_birth: string | null }) => {
      if (!p.date_of_birth) return false;
      const dob = new Date(p.date_of_birth);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    if (birthdayUsers.length > 0) {
      const birthdayTitle = "Happy Birthday!";

      const birthdayInserts = birthdayUsers
        .filter((p: { id: string }) => !sentTodaySet.has(`${p.id}:${birthdayTitle}`))
        .map((p: { id: string; display_name: string | null }) => {
          const name = getGreetingName(p.display_name, farmNameMap.get(p.id) || null);
          return {
            user_id: p.id,
            type: "system",
            title: birthdayTitle,
            message: `Happy Birthday, ${name}! Today is your special day and the entire iFarmX community is celebrating with you. Just like your plants, you continue to grow stronger every day. May this new year of life bring you abundant harvests, good health, and endless joy. Keep thriving!`,
          };
        });

      if (birthdayInserts.length > 0) {
        await supabase.from("notifications").insert(birthdayInserts);
        stats.birthday_messages = birthdayInserts.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: today, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("holiday-birthday-greetings error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
