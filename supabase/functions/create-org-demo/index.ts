import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json();
    console.log('Received request body:', body);

    const { program_id, org_user_id } = body;

    if (!program_id || !org_user_id) {
      console.error('Missing parameters:', { program_id, org_user_id });
      return new Response(
        JSON.stringify({ error: 'Missing program_id or org_user_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (user.id !== org_user_id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: user mismatch' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Starting demo creation for program ${program_id}, org ${org_user_id}`);

    const demoParticipants = [
      {
        email: 'adaeze.okoro@demo.ifarmx.ng',
        display_name: 'Adaeze Okoro',
        region_vibe: 'Igbo Innovation',
        favorite_dish: 'Egusi Soup',
        health_tier: 'excellent',
        plants_count: 3,
        logs_days: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [2, 5, 9, 13],
        weeding_days: [3, 7, 11],
        pest_days: [1, 4, 8, 12, 14],
      },
      {
        email: 'chidi.eze@demo.ifarmx.ng',
        display_name: 'Chidi Eze',
        region_vibe: 'Lagos Hustle',
        favorite_dish: 'Jollof Rice',
        health_tier: 'excellent',
        plants_count: 2,
        logs_days: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [1, 5, 10],
        weeding_days: [3, 8, 13],
        pest_days: [2, 6, 11, 14],
      },
      {
        email: 'fatima.abubakar@demo.ifarmx.ng',
        display_name: 'Fatima Abubakar',
        region_vibe: 'Hausa Strength',
        favorite_dish: 'Vegetable Soup',
        health_tier: 'excellent',
        plants_count: 3,
        logs_days: [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [3, 7, 11],
        weeding_days: [2, 6, 10, 14],
        pest_days: [1, 5, 9, 13],
      },
      {
        email: 'tunde.williams@demo.ifarmx.ng',
        display_name: 'Tunde Williams',
        region_vibe: 'Yoruba Heritage',
        favorite_dish: 'Afang Soup',
        health_tier: 'good',
        plants_count: 2,
        logs_days: [0, 2, 3, 5, 7, 9, 11, 13],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [3, 9],
        weeding_days: [5, 11],
        pest_days: [2, 7, 13],
      },
      {
        email: 'blessing.okafor@demo.ifarmx.ng',
        display_name: 'Blessing Okafor',
        region_vibe: 'Delta Richness',
        favorite_dish: 'Banga Soup',
        health_tier: 'good',
        plants_count: 3,
        logs_days: [1, 2, 4, 6, 8, 10, 12, 14],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [2, 8],
        weeding_days: [4, 10],
        pest_days: [6, 12],
      },
      {
        email: 'emeka.nwankwo@demo.ifarmx.ng',
        display_name: 'Emeka Nwankwo',
        region_vibe: 'Igbo Innovation',
        favorite_dish: 'Ofe Akwu',
        health_tier: 'good',
        plants_count: 2,
        logs_days: [0, 1, 3, 5, 7, 10, 12],
        watering_pattern: [1, 1, 1, 1, 1, 1, 1],
        fertilizing_days: [3, 10],
        weeding_days: [5],
        pest_days: [1, 7, 12],
      },
      {
        email: 'ngozi.udo@demo.ifarmx.ng',
        display_name: 'Ngozi Udo',
        region_vibe: 'Cross River Culture',
        favorite_dish: 'Egusi Soup',
        health_tier: 'needs_attention',
        plants_count: 3,
        logs_days: [1, 4, 8, 12],
        watering_pattern: [1, 1, 1, 1],
        fertilizing_days: [4],
        weeding_days: [],
        pest_days: [8],
      },
      {
        email: 'yusuf.ibrahim@demo.ifarmx.ng',
        display_name: 'Yusuf Ibrahim',
        region_vibe: 'Hausa Strength',
        favorite_dish: 'Jollof Rice',
        health_tier: 'needs_attention',
        plants_count: 2,
        logs_days: [2, 6, 11],
        watering_pattern: [1, 1, 1],
        fertilizing_days: [],
        weeding_days: [6],
        pest_days: [],
      },
      {
        email: 'chioma.anya@demo.ifarmx.ng',
        display_name: 'Chioma Anya',
        region_vibe: 'Lagos Hustle',
        favorite_dish: 'Banga Soup',
        health_tier: 'needs_attention',
        plants_count: 1,
        logs_days: [3, 9],
        watering_pattern: [1, 1],
        fertilizing_days: [],
        weeding_days: [],
        pest_days: [9],
      },
    ];

    const createdCount = { success: 0, failed: 0 };

    for (const participant of demoParticipants) {
      try {
        console.log(`Creating participant: ${participant.email}`);
        let demoUserId: string;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: participant.email,
          password: 'DemoPassword123!',
          email_confirm: true,
        });

        console.log(`Auth result for ${participant.email}:`, { hasUser: !!authUser?.user, error: authError?.message });

        if (authError) {
          if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingUser = users?.users.find((u) => u.email === participant.email);
            if (existingUser) {
              demoUserId = existingUser.id;
            } else {
              console.error(`Failed to create or find demo user ${participant.email}:`, authError);
              createdCount.failed++;
              continue;
            }
          } else {
            console.error(`Failed to create demo user ${participant.email}:`, authError);
            createdCount.failed++;
            continue;
          }
        } else if (!authUser.user) {
          console.error(`No user returned for ${participant.email}`);
          createdCount.failed++;
          continue;
        } else {
          demoUserId = authUser.user.id;

          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const { error: profileCheckError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', demoUserId)
          .maybeSingle();

        if (profileCheckError) {
          await supabase
            .from('user_profiles')
            .insert({
              id: demoUserId,
              user_type: 'individual',
              display_name: participant.display_name,
              region_vibe: participant.region_vibe,
              favorite_dish: participant.favorite_dish,
            });
        } else {
          await supabase
            .from('user_profiles')
            .update({
              display_name: participant.display_name,
              region_vibe: participant.region_vibe,
              favorite_dish: participant.favorite_dish,
              user_type: 'individual',
            })
            .eq('id', demoUserId);
        }

        const { data: existingParticipant } = await supabase
          .from('program_participants')
          .select('id')
          .eq('program_id', program_id)
          .eq('user_id', demoUserId)
          .maybeSingle();

        if (!existingParticipant) {
          await supabase.from('program_participants').insert({
            program_id: program_id,
            user_id: demoUserId,
            status: 'active',
            joined_at: dateStr(-15),
          });
        }

        const { data: existingPlants } = await supabase
          .from('plants')
          .select('id')
          .eq('user_id', demoUserId)
          .eq('program_id', program_id);

        if (!existingPlants || existingPlants.length === 0) {
          const plantNames = ['Palm 1', 'Palm 2', 'Palm 3'];
          const plantsToCreate = plantNames.slice(0, participant.plants_count);

          const { data: plants } = await supabase
            .from('plants')
            .insert(
              plantsToCreate.map((name) => ({
                user_id: demoUserId,
                program_id: program_id,
                name,
                stage: 'nursery',
                planted_date: dateStr(-15),
                farming_type: 'individual',
              }))
            )
            .select();

          if (plants) {
            const logs: any[] = [];
            for (const plant of plants) {
              for (let i = 0; i < participant.logs_days.length; i++) {
                const dayOffset = participant.logs_days[i];
                let issueReport = null;

                if (
                  participant.health_tier === 'needs_attention' &&
                  dayOffset === participant.logs_days[participant.logs_days.length - 1]
                ) {
                  const issues = [
                    'Leaves turning yellow, not sure why',
                    'Some brown spots appearing on lower leaves',
                    'Growth seems slower than expected',
                  ];
                  issueReport = issues[Math.floor(Math.random() * issues.length)];
                }

                logs.push({
                  plant_id: plant.id,
                  user_id: demoUserId,
                  log_date: dateStr(-dayOffset),
                  watered: participant.watering_pattern[i] === 1,
                  fertilized: participant.fertilizing_days.includes(dayOffset),
                  weeded: participant.weeding_days.includes(dayOffset),
                  pruned: false,
                  pest_checked: participant.pest_days.includes(dayOffset),
                  notes: i === 0 && participant.health_tier === 'excellent' ? 'Seedling looking healthy!' : null,
                  issue_report: issueReport,
                });
              }
            }

            if (logs.length > 0) {
              await supabase.from('care_logs').insert(logs);
            }
          }
        }

        createdCount.success++;
      } catch (err) {
        console.error(`Error creating participant ${participant.email}:`, err);
        createdCount.failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: createdCount.success,
        failed: createdCount.failed,
        total: demoParticipants.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
