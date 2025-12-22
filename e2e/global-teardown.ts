import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Test user emails that are used in E2E tests
const TEST_USER_EMAILS = ['user1@example.com', 'user2@example.com']

async function globalTeardown() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('[E2E Cleanup] Skipping cleanup: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
    return
  }

  console.log('[E2E Cleanup] Starting test data cleanup...')

  // Create Supabase client with service role key to bypass RLS
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Use admin API to get test user IDs (requires service role key)
    const {
      data: { users },
      error: listError
    } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('[E2E Cleanup] Failed to list users:', listError.message)
      return
    }

    const testUserIds = users
      .filter((u) => TEST_USER_EMAILS.includes(u.email || ''))
      .map((u) => u.id)

    if (testUserIds.length === 0) {
      console.log('[E2E Cleanup] No test users found, skipping cleanup')
      return
    }

    console.log(`[E2E Cleanup] Found ${testUserIds.length} test users`)

    // Delete all meetings created by test users
    // Cascade will handle questions, participants, answers, etc.
    const { error: deleteError, count } = await supabase
      .from('meetings')
      .delete({ count: 'exact' })
      .in('created_by', testUserIds)

    if (deleteError) {
      console.error('[E2E Cleanup] Failed to delete meetings:', deleteError.message)
    } else {
      console.log(`[E2E Cleanup] Deleted ${count ?? 0} test meetings`)
    }

    console.log('[E2E Cleanup] Cleanup completed successfully')
  } catch (error) {
    console.error('[E2E Cleanup] Unexpected error during cleanup:', error)
  }
}

export default globalTeardown

// Allow running as a standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  globalTeardown().catch(console.error)
}
