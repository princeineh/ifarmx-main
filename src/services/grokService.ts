import { supabase } from '../lib/supabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface GrokResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UsageData {
  messages_count: number;
  last_reset_date: string;
  total_messages: number;
  limit: number;
  remaining: number;
}

const DAILY_MESSAGE_LIMIT = 50;

export async function getUserUsage(): Promise<UsageData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];

    let { data: usage, error } = await supabase
      .from('grok_usage')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching usage:', error);
      return null;
    }

    if (!usage) {
      const { data: newUsage, error: insertError } = await supabase
        .from('grok_usage')
        .insert({
          user_id: user.id,
          messages_count: 0,
          last_reset_date: today,
          total_messages: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating usage record:', insertError);
        return null;
      }

      usage = newUsage;
    }

    if (usage.last_reset_date !== today) {
      const { data: updatedUsage, error: updateError } = await supabase
        .from('grok_usage')
        .update({
          messages_count: 0,
          last_reset_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error resetting usage:', updateError);
        return null;
      }

      usage = updatedUsage;
    }

    return {
      messages_count: usage.messages_count,
      last_reset_date: usage.last_reset_date,
      total_messages: usage.total_messages,
      limit: DAILY_MESSAGE_LIMIT,
      remaining: DAILY_MESSAGE_LIMIT - usage.messages_count
    };
  } catch (error) {
    console.error('Error in getUserUsage:', error);
    return null;
  }
}

export async function incrementUsage(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const usage = await getUserUsage();
    if (!usage) return false;

    const { error } = await supabase
      .from('grok_usage')
      .update({
        messages_count: usage.messages_count + 1,
        total_messages: usage.total_messages + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    return false;
  }
}

export async function sendMessageToGrok(
  messages: Message[],
  userContext?: { location?: string; plantCount?: number }
): Promise<GrokResponse> {
  try {
    const usage = await getUserUsage();

    if (!usage || usage.remaining <= 0) {
      throw new Error('Daily message limit reached. Please try again tomorrow.');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Authentication required');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grok-agronomist`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, userContext }),
    });

    const data = await response.json();

    if (!response.ok || data.fallback) {
      throw new Error(data.error || 'Failed to get response from Grok AI');
    }

    await incrementUsage();

    return {
      message: data.message,
      usage: data.usage
    };
  } catch (error) {
    console.error('Error sending message to Grok:', error);
    throw error;
  }
}
