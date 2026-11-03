import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'super-secret-logistics-key-for-dev';
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
  [key: string]: any;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1 day from now')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null; // Invalid or expired token
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt(payload);

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(request?: Request) {
  // 1. Check Authorization header from request or incoming headers
  try {
    let authHeader: string | null = null;
    if (request) {
      authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    } else {
      const headerStore = await headers();
      authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const payload = await decrypt(token);
      if (payload) return payload;
    }
  } catch {
    // Ignore header resolution errors (e.g. outside request context)
  }

  // 2. Fall back to cookie
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return null;
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return null;

  const parsed = await decrypt(session);
  if (!parsed) return null;

  const res = NextResponse.next();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  res.cookies.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return res;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
