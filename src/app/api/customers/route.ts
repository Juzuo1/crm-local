import { NextRequest, NextResponse } from 'next/server';
import { listCustomers, createCustomer, listSegments, filterBySegment, listUsers, updateCustomer, resolveAccess, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 获取客户列表
export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const segmentId = searchParams.get('segment');

  // 权限检查 + 获取可见范围
  const access = await resolveAccess(user.id, user.role, 'customers', 'customers.view');
  if (!access.allowed) return NextResponse.json({ error: '无权访问' }, { status: 403 });
  const visibleUserIds = access.visibleUserIds;

  // 如果有客群ID，先加载客群筛选条件
  let segmentFilters = undefined;
  let segmentName = '';
  if (segmentId) {
    const segments = await listSegments(visibleUserIds);
    const seg = segments.find(s => s.id === parseInt(segmentId));
    if (seg) {
      segmentFilters = seg.filters;
      segmentName = seg.name;
    }
  }

  const result = await listCustomers({
    search: searchParams.get('search') || undefined,
    country: searchParams.get('country') || undefined,
    channel: searchParams.get('channel') || undefined,
    level: searchParams.get('level') || undefined,
    tag: searchParams.get('tag') || undefined,
    stage: searchParams.get('stage') || undefined,
    assignedTo: searchParams.has('assignedTo') ? parseInt(searchParams.get('assignedTo')!) : undefined,
    createdAtFrom: searchParams.get('createdAtFrom') || undefined,
    createdAtTo: searchParams.get('createdAtTo') || undefined,
    nextFollowupFrom: searchParams.get('nextFollowupFrom') || undefined,
    nextFollowupTo: searchParams.get('nextFollowupTo') || undefined,
    visibleUserIds: visibleUserIds,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: parseInt(searchParams.get('pageSize') || '20'),
  });

  // 如果指定了客群，在后端再做一次过滤
  let finalData = result.data;
  if (segmentFilters) {
    finalData = filterBySegment(result.data, segmentFilters);
  }

  // 附加负责人姓名
  const allUsers = await listUsers();
  const userMap: Record<number, string> = {};
  allUsers.forEach(u => { userMap[u.id] = u.name; });
  const dataWithUser = finalData.map(c => ({
    ...c,
    assigned_user_name: c.assigned_to ? userMap[c.assigned_to] || '未知' : '未分配',
  }));

  // 根据权限决定是否隐藏手机号和邮箱
  const canViewPhone = await hasPermission(user.role, 'customers.view_phone');
  const canViewEmail = await hasPermission(user.role, 'customers.view_email');
  const maskedData = dataWithUser.map(c => ({
    ...c,
    phone: canViewPhone ? c.phone : (c.phone ? '***' : ''),
    email: canViewEmail ? c.email : (c.email ? '***' : ''),
  }));

  const total = segmentFilters ? finalData.length : result.total;
  return NextResponse.json({
    data: maskedData,
    total,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 20,
    totalPages: Math.ceil(total / 20),
    segmentName,
    users: await hasPermission(user.role, 'customers.assign')
      ? allUsers.filter(u => u.role === 'agent' || u.role === 'manager')
      : [],
  });
}

// 批量分配客户
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'customers.assign')) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = await request.json();
  const { customer_ids, assigned_to } = body;

  if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
    return NextResponse.json({ error: '请选择客户' }, { status: 400 });
  }

  let count = 0;
  for (const cid of customer_ids) {
    await updateCustomer(cid, { assigned_to: assigned_to || null });
    count++;
  }

  // 审计日志
  const targetUser = assigned_to ? (await listUsers()).find(u => u.id === assigned_to) : null;
  await addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'customer.assign',
    target_type: 'customer',
    target_id: 0,
    target_name: `${customer_ids.length}个客户 → ${targetUser?.name || '未分配'}`,
    detail: { count: customer_ids.length, assigned_to: assigned_to || null, assigned_name: targetUser?.name || '未分配' },
  });

  return NextResponse.json({ success: true, count });
}

// 新增客户
export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'customers.create')) {
    return NextResponse.json({ error: '无权新增客户' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.contact_name) {
    return NextResponse.json({ error: '联系人姓名必填' }, { status: 400 });
  }

  // 业务员创建的客户自动归属于自己
  const canAssign = await hasPermission(user.role, 'customers.assign');
  const assignedTo = canAssign ? (body.assigned_to || null) : user.id;

  const customer = await createCustomer({
    contact_name: body.contact_name,
    position: body.position,
    phone: body.phone,
    email: body.email,
    company_name: body.company_name,
    country: body.country,
    source_channel: body.source_channel,
    customer_level: body.customer_level,
    product_interests: JSON.stringify(body.product_interests || []),
    tags: JSON.stringify(body.tags || []),
    notes: body.notes,
    assigned_to: assignedTo,
    next_followup_at: body.next_followup_at || null,
    created_by: user.id,
  });

  // 审计日志
  await addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'customer.create',
    target_type: 'customer',
    target_id: customer.id,
    target_name: body.contact_name,
    detail: { contact_name: body.contact_name, company_name: body.company_name || '', country: body.country || '', source_channel: body.source_channel || '' },
  });

  return NextResponse.json({ success: true, id: customer.id });
}
