import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs, listUsers, resolveAccess } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ACTION_LABELS } from '@/lib/audit';

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  // 操作日志查看权限：管理员和主管
  const access = resolveAccess(user.id, user.role, 'audit', 'audit.view');
  if (!access.allowed) return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const { searchParams } = request.nextUrl;

  const result = listAuditLogs({
    userId: searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined,
    action: searchParams.get('action') || undefined,
    targetType: searchParams.get('targetType') || undefined,
    days: searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '30'),
  });

  // 返回用户列表供筛选
  const allUsers = listUsers().map(u => ({ id: u.id, name: u.name }));

  return NextResponse.json({
    data: result.data,
    total: result.total,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 30,
    totalPages: Math.ceil(result.total / 30),
    users: allUsers,
    actionTypes: Object.entries(ACTION_LABELS).map(([value, label]) => ({ value, label })),
  });
}
