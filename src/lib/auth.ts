import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import env from './env';
import { findUserByEmail } from './db';

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'agent' | 'manager';
}

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ id: user.id, name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'admin' | 'agent' | 'manager',
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function login(email: string, password: string): Promise<{ user: SessionUser; token: string } | null> {
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) return null;

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = await createToken(sessionUser);
  return { user: sessionUser, token };
}
