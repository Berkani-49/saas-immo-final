import { createClient } from '@supabase/supabase-js'

// Va chercher ça dans Supabase > Settings > API
const supabaseUrl = 'https://TON_LIEN_SUPABASE.supabase.co'
const supabaseKey = 'TA_CLE_PUBLIQUE_ANON' // (la clé "anon", "public")

export const supabase = createClient(supabaseUrl, supabaseKey)