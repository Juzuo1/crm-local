import { NextRequest, NextResponse } from 'next/server';
import { createFollowup, listAllFollowups, listUsers, resolveAccess, hasPermission, findCustomerById, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;

  const access = resolveAccess(user.id, user.role, 'followups', 'followups.view');
  if (!access.allowed) return NextResponse.json({ error: '无权访问' }, { status: 403 });

  // 跟进人筛选权限
  const canFilterUser = hasPermission(user.role, 'followups.filter_user');
  const filterUserId = canFilterUser && searchParams.get('user')
    ? parseInt(searchParams.get('user')!)
    : undefined;

  const result = listAllFollowups({
    visibleUserIds: access.visibleUserIds.length === 0 ? undefined : access.visibleUserIds,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '30'),
    method: searchParams.get('method') || undefined,
    days: searchParams.get('days') ? parseInt(searchParams.get('days')!) : undefined,
    search: searchParams.get('search') || undefined,
    channel: searchParams.get('channel') || undefined,
    filterUserId,
  });

  // 管理员和主管返回用户列表供筛选
  const allUsers = canFilterUser
    ? listUsers().filter(u => u.role === 'agent' || u.role === 'manager')
    : [];

  return NextResponse.json({
    data: result.data,
    total: result.total,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 30,
    totalPages: Math.ceil(result.total / 30),
    users: allUsers,
  });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'followups.create')) {
    return NextResponse.json({ error: '无权添加跟进' }, { status: 403 });
  }

  const body = await request.json();
  const { customer_id, method, content, next_followup_at } = body;

  if (!customer_id) {
    return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
  }

  createFollowup({
    customer_id,
    user_id: user.id,
    method: method || 'phone',
    content: content || '',
    next_followup_at: next_followup_at || null,
  });

  // 审计日志
  const customer = findCustomerById(customer_id);
  addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'followup.create',
    target_type: 'followup',
    target_id: customer_id,
    target_name: customer?.contact_name || `客户#${customer_id}`,
    detail: { method: method || 'phone', content_preview: (content || '').slice(0, 80) },
  });

  return NextResponse.json({ success: true });
}
