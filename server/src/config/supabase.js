import { createClient } from '@supabase/supabase-js'

let _supabase = null

function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn('Warning: Supabase credentials not configured. Database operations will fail.')
    }

    _supabase = createClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseKey || 'placeholder-key'
    )
  }
  return _supabase
}

export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getSupabase()[prop]
    }
  }
)
