import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured.'
      )
    }

    _supabase = createClient(supabaseUrl, supabaseKey)
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop: keyof SupabaseClient) {
    return getSupabase()[prop]
  }
})
