import { supabase } from '../config/supabase.js'

interface RequestWithHeaders {
  headers: {
    authorization?: string
  }
  body?: unknown
}

/**
 * Extract facilitator code from Authorization header or request body.
 * Does NOT check query params for security reasons (URLs can be logged).
 */
export function getFacilitatorCode(req: RequestWithHeaders): string | undefined {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // Fall back to body for POST/PUT requests
  return (req.body as { facilitatorCode?: string })?.facilitatorCode
}

/**
 * Extract JWT token from Authorization header.
 */
export function getAuthToken(req: RequestWithHeaders): string | undefined {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return undefined
}

/**
 * Verify Supabase JWT token and return user info.
 */
export async function verifyAuthToken(
  token: string
): Promise<{ userId: string; email: string | undefined } | null> {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email
    }
  } catch {
    return null
  }
}
