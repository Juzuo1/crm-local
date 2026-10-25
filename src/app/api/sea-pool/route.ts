import { NextRequest, NextResponse } from 'next/server';
import { listSeaPoolCustomers, pushToSeaPool, listUsers, findUserById, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 获取公海客户列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'sea_pool.view')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;

  const result = await listSeaPoolCustomers({
    search: searchParams.get('search') || undefined,
    country: searchParams.get('country') || undefined,
    channel: searchParams.get('channel') || undefined,
    level: searchParams.get('level') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
  });

  // 附加原负责人姓名
  const allUsers = await listUsers();
  const userMap: Record<number, string> = {};
  allUsers.forEach(u => { userMap[u.id] = u.name; });

  const dataWithNames = result.data.map(c => ({
    ...c,
    former_assignee_name: '无',
  }));

  return NextResponse.json({
    data: dataWithNames,
    total: result.total,
    stats: result.stats,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 20,
    totalPages: Math.ceil(result.total / 20),
  });
}

// 批量推入公海
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'sea_pool.push')) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = await request.json();
  const { customer_ids } = body;

  if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
    return NextResponse.json({ error: '请选择客户' }, { status: 400 });
  }

  const count = await pushToSeaPool(customer_ids);

  // 审计日志
  await addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'customer.sea_push',
    target_type: 'customer',
    target_id: 0,
    target_name: `${count}个客户`,
    detail: { count, customer_ids },
  });

  return NextResponse.json({ success: true, count });
}
