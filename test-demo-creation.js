// Test script to manually invoke the demo creation edge function
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDemoCreation() {
  console.log('Creating test organization user...');

  const testEmail = `test-org-${Date.now()}@test.com`;
  const testPassword = 'TestPassword123!';

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.error('Error creating test user:', signUpError);
    return;
  }

  console.log('Test user created:', authData.user.id);

  await supabase
    .from('user_profiles')
    .update({ user_type: 'organization', display_name: 'Test Org' })
    .eq('id', authData.user.id);

  console.log('Creating demo program...');

  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({
      org_user_id: authData.user.id,
      name: 'Test Youth Farming Initiative',
      description: 'Test demo program',
      target_participants: 50,
      start_date: '2026-04-01',
      status: 'published',
      acceptance_type: 'open',
      min_kits_per_participant: 1,
      max_kits_per_participant: 3,
    })
    .select()
    .single();

  if (programError) {
    console.error('Error creating program:', programError);
    return;
  }

  console.log('Program created:', program.id);
  console.log('Calling edge function to create demo participants...');

  const { data: session } = await supabase.auth.getSession();

  const response = await fetch(`${supabaseUrl}/functions/v1/create-org-demo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      program_id: program.id,
      org_user_id: authData.user.id,
    }),
  });

  const result = await response.json();
  console.log('Edge function response:', result);

  if (!response.ok) {
    console.error('Edge function failed:', response.status, result);
    return;
  }

  console.log('Checking participants...');

  const { data: participants } = await supabase
    .from('program_participants')
    .select('*')
    .eq('program_id', program.id);

  console.log(`Found ${participants?.length || 0} participants`);

  console.log('\nTest completed! Cleaning up...');

  await supabase.auth.signOut();
}

testDemoCreation().catch(console.error);
