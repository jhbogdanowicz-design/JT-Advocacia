import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ygzzfvgkestgnicepngh.supabase.co';
const supabaseAnonKey = 'sb_publishable__u6NI4JF2F7fvYS-auLaNA_Kc87ngDq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
