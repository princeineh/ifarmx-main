import { supabase } from '../lib/supabase';

const SESSION_KEY = 'ifarm_session_id';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function trackPageView(page: string, userId?: string, referrer?: string) {
  if (!userId) return;
  try {
    await supabase.from('page_views').insert({
      user_id: userId,
      page,
      referrer: referrer || null,
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
    });
  } catch {}
}

export async function trackEvent(
  eventType: string,
  page: string,
  userId?: string,
  eventData?: Record<string, unknown>
) {
  if (!userId) return;
  try {
    await supabase.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData || null,
      page,
      session_id: getSessionId(),
    });
  } catch {}
}
