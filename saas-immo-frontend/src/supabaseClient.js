import { createClient } from '@supabase/supabase-js'

// Va chercher ça dans Supabase > Settings > API
const supabaseUrl = 'https://wcybvmyamnpkwpuabvqq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjeWJ2bXlhbW5wa3dwdWFidnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTY4OTIsImV4cCI6MjA3ODQ5Mjg5Mn0.bFZLL9-A0i5kqpjIAPMI1frwHFwhiqfswurUDt5XGOY' // (la clé "anon", "public")

export const supabase = createClient(supabaseUrl, supabaseKey)