// Validate required environment variables in production
export function validateEnv(): void {
  if (process.env.NODE_ENV === 'production') {
    const required = ['CLIENT_URL', 'PORT', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'REDIS_URL']
    const missing = required.filter((key) => !process.env[key])
    if (missing.length > 0) {
      console.error(`Fatal: Missing required environment variables: ${missing.join(', ')}`)
      process.exit(1)
    }
  }
}
