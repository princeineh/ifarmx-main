import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kbhuzdhyuzcdsouthzoo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHV6ZGh5dXpjZHNvdXRoem9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MzA1NTYsImV4cCI6MjA4NjIwNjU1Nn0.h-Shn4OOk00tRcKZ_BDySjA9plFgk1ZCZxR3FMgePKU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
