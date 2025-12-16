import { supabase } from '../config/supabase.js'

interface RequestWithHeaders {
  headers: {
    authorization?: string
    'x-facilitator-code'?: string
  }
  body?: unknown
}

/**
 * Extract facilitator code from X-Facilitator-Code header or request body.
 * Note: Authorization header is now reserved for JWT tokens.
 */
export function getFacilitatorCode(req: RequestWithHeaders): string | undefined {
  // Check X-Facilitator-Code header first
  const facilitatorHeader = req.headers['x-facilitator-code']
  if (facilitatorHeader) {
    return facilitatorHeader
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
