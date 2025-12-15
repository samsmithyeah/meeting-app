import type { Request } from 'express'

/**
 * Extract facilitator code from Authorization header or request body.
 * Does NOT check query params for security reasons (URLs can be logged).
 */
export function getFacilitatorCode(req: Request): string | undefined {
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  // Fall back to body for POST/PUT requests
  return (req.body as { facilitatorCode?: string })?.facilitatorCode
}
