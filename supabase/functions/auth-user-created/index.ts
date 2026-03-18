import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

Deno.serve(async (req: Request) => {
  try {
    const { record } = await req.json();

    if (!record || !record.id) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = record.id;
    const meta = record.raw_user_meta_data || {};

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        user_type: meta.user_type || 'individual',
        display_name: meta.display_name || null,
        favorite_dish: meta.favorite_dish || null,
        region_vibe: meta.region_vibe || null,
      })
      .select()
      .single();

    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('Profile creation error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
