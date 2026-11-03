import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { createSession, encrypt } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      driverId: user.driverId,
      customerId: user.customerId,
    };

    const token = await encrypt(sessionPayload);
    await createSession(sessionPayload);

    return NextResponse.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        driverId: user.driverId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during login' }, { status: 500 });
  }
}
