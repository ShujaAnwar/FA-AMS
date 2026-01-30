
import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const supabaseUrl = 'https://dpyppyyhcqpwxklogxqm.supabase.co';
const supabaseKey = 'sb_publishable_WrRmSH441rZ4o6zYjhnZig_dUSi7sre';

export const supabase = createClient(supabaseUrl, supabaseKey);
