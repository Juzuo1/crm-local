'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { login, getSession } from '@/lib/auth';
import env from '@/lib/env';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: '请输入邮箱和密码' };
  }

  const result = await login(email, password);
  if (!result) {
    return { error: '邮箱或密码错误' };
  }

  const cookieStore = await cookies();
  cookieStore.set(env.COOKIE_NAME, result.token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  redirect('/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(env.COOKIE_NAME);
  redirect('/login');
}

export async function getCurrentUser() {
  return getSession();
}
