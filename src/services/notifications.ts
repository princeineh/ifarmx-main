import { supabase } from '../lib/supabase';

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
  });
  if (error) console.error('Notification insert failed:', error.message);
}
