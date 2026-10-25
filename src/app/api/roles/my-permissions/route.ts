import { NextResponse } from 'next/server';
import { getRolePermissions } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const perms = await getRolePermissions();
  const config = perms[user.role];
  if (!config) {
    return NextResponse.json({ role: user.role, permissions: [], dataScopes: {} });
  }

  return NextResponse.json({
    role: user.role,
    permissions: config.permissions,
    dataScopes: config.dataScopes || {},
  });
}
