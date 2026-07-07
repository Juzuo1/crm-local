import { NextResponse } from 'next/server';
import { getDashboardStats, resolveAccess } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { allowed, visibleUserIds } = resolveAccess(user.id, user.role, 'dashboard', 'dashboard.view');
  if (!allowed) return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const stats = getDashboardStats(visibleUserIds);
  return NextResponse.json(stats);
}
