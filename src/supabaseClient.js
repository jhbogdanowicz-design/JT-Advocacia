import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjprdxgouzkrnhrcmzjg.supabase.co';
const supabaseAnonKey = 'sb_publishable_kLiGX-hqfT3ON3-Ht3Rk4A_RASCS71E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
