import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://twkxrgkkfhaylroyhfmi.supabase.co'

// Use the anon/public key environment variable here, make sure you set it in your environment (.env.local or similar)
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
