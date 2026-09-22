import { NextResponse } from 'next/server';
import { getSession } from './session';

/**
 * Global auth helper for API routes.
 * Checks for a valid Bearer token, API key, or active user session.
 */
export async function authenticate(request: Request): Promise<NextResponse | null> {
  // Check API keys / Tokens first for external integrations
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');
  const validToken = process.env.API_SECRET_TOKEN || 'secret_token_123';

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === validToken) return null; // Authenticated via Token
  }

  if (apiKey === validToken) return null; // Authenticated via API Key

  // Check UI Session (JWT stored in cookies)
  const session = await getSession();
  if (session) {
    return null; // Authenticated via UI session
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
