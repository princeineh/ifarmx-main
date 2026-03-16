import { supabase } from '../lib/supabase';
import type { UserType } from '../types/database';

function dateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

async function createIndividualDemo(userId: string) {
  const plantNames = ['Prosperity Palm', 'Growth Champion', 'Abundance Tree'];

  const { data: plants } = await supabase
    .from('plants')
    .insert(
      plantNames.map((name) => ({
        user_id: userId,
        name,
        stage: 'nursery' as const,
        planted_date: dateStr(-5),
        farming_type: 'individual' as const,
      }))
    )
    .select();

  if (!plants) return;

  const logs: Record<string, unknown>[] = [];
  for (const plant of plants) {
    logs.push({
      plant_id: plant.id,
      user_id: userId,
      log_date: dateStr(-1),
      watered: true,
      fertilized: false,
      weeded: false,
      pruned: false,
      pest_checked: true,
    });
    logs.push({
      plant_id: plant.id,
      user_id: userId,
      log_date: dateStr(-3),
      watered: true,
      fertilized: true,
      weeded: false,
      pruned: false,
      pest_checked: false,
    });
    logs.push({
      plant_id: plant.id,
      user_id: userId,
      log_date: dateStr(-5),
      watered: true,
      fertilized: false,
      weeded: true,
      pruned: false,
      pest_checked: true,
    });
  }

  await supabase.from('care_logs').insert(logs);
}

async function createFamilyDemo(userId: string) {
  const { data: group } = await supabase
    .from('farming_groups')
    .insert({
      user_id: userId,
      group_type: 'family' as const,
      group_name: 'The Demo Family',
      total_seeds: 3,
    })
    .select()
    .single();

  if (!group) return;

  const { data: members } = await supabase
    .from('group_members')
    .insert([
      { group_id: group.id, name: 'Mama Adaeze', relationship: 'Mother', seeds_allocated: 1 },
      { group_id: group.id, name: 'Chukwuemeka', relationship: 'Son', seeds_allocated: 1 },
    ])
    .select();

  if (!members || members.length < 2) return;

  const { data: plants } = await supabase
    .from('plants')
    .insert([
      {
        user_id: userId,
        name: `${members[0].name}'s Palm`,
        stage: 'nursery' as const,
        planted_date: dateStr(-5),
        farming_type: 'family' as const,
        farming_group_id: group.id,
        group_member_id: members[0].id,
      },
      {
        user_id: userId,
        name: `${members[1].name}'s Palm`,
        stage: 'nursery' as const,
        planted_date: dateStr(-5),
        farming_type: 'family' as const,
        farming_group_id: group.id,
        group_member_id: members[1].id,
      },
      {
        user_id: userId,
        name: 'My Palm Tree',
        stage: 'nursery' as const,
        planted_date: dateStr(-5),
        farming_type: 'family' as const,
        farming_group_id: group.id,
        group_member_id: null,
      },
    ])
    .select();

  if (!plants) return;

  const logs: Record<string, unknown>[] = [];
  for (const plant of plants) {
    logs.push({
      plant_id: plant.id,
      user_id: userId,
      log_date: dateStr(-1),
      watered: true,
      fertilized: false,
      weeded: false,
      pruned: false,
      pest_checked: true,
    });
    logs.push({
      plant_id: plant.id,
      user_id: userId,
      log_date: dateStr(-3),
      watered: true,
      fertilized: true,
      weeded: false,
      pruned: false,
      pest_checked: false,
    });
  }

  await supabase.from('care_logs').insert(logs);
}

async function createOrgDemo(userId: string) {
  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({
      org_user_id: userId,
      name: 'Youth Farming Initiative',
      description:
        'A demo programme to help you explore all management features. This programme aims to empower 50 young farmers across Nigeria through oil palm cultivation, hands-on training, and ongoing support. Participants receive starter kits and access to the AI Agronomist for expert guidance.',
      target_participants: 50,
      start_date: '2026-04-01',
      status: 'published' as const,
      acceptance_type: 'open' as const,
      min_kits_per_participant: 1,
      max_kits_per_participant: 3,
    })
    .select()
    .single();

  if (programError || !program) {
    console.error('Failed to create demo program:', programError);
    throw new Error('Failed to create demo program');
  }

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-org-demo`;
  const { data: session } = await supabase.auth.getSession();

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        program_id: program.id,
        org_user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create demo participants:', errorText);
      throw new Error(`Failed to create demo participants: ${errorText}`);
    }

    const result = await response.json();
    console.log('Demo participants created:', result);
  } catch (error) {
    console.error('Error calling create-org-demo function:', error);
    throw error;
  }
}

export async function setupDemo(userId: string, path: UserType): Promise<void> {
  switch (path) {
    case 'individual':
      await createIndividualDemo(userId);
      break;
    case 'family':
      await createFamilyDemo(userId);
      break;
    case 'organization':
      await createOrgDemo(userId);
      break;
  }
}
