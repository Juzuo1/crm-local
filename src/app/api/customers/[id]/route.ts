import { NextRequest, NextResponse } from 'next/server';
import { findCustomerById, updateCustomer, softDeleteCustomer, listFollowups, listUsers, findUserById, getTeamMemberIds, hasPermission } from '@/lib/db';
import { getSession, SessionUser } from '@/lib/auth';
import type { Customer } from '@/lib/db';

// 检查用户能否看到该客户（基于数据范围）
function canAccess(user: SessionUser, customer: Customer): boolean {
  if (hasPermission(user.role, '*')) return true;
  if (customer.assigned_to === user.id) return true;
  const team = getTeamMemberIds(user.id);
  if (team.length > 0 && customer.assigned_to !== null && team.includes(customer.assigned_to)) return true;
  return false;
}

// 获取客户详情
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'customers.view_detail')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const { id } = await context.params;
  const customer = findCustomerById(parseInt(id));

  if (!customer) {
    return NextResponse.json({ error: '客户不存在' }, { status: 404 });
  }

  if (!canAccess(user, customer)) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  const followups = listFollowups(parseInt(id));

  // 负责人姓名
  const assignedUser = customer.assigned_to ? findUserById(customer.assigned_to) : null;
  const assignedUserName = assignedUser?.name || '未分配';

  // 根据权限隐藏手机号和邮箱
  const canViewPhone = hasPermission(user.role, 'customers.view_phone');
  const canViewEmail = hasPermission(user.role, 'customers.view_email');

  // 用户列表（有分配权限才能看到）
  const canAssign = hasPermission(user.role, 'customers.assign');
  const users = canAssign ? listUsers().filter(u => u.role === 'agent' || u.role === 'manager') : [];

  return NextResponse.json({
    ...customer,
    phone: canViewPhone ? customer.phone : (customer.phone ? '***' : ''),
    email: canViewEmail ? customer.email : (customer.email ? '***' : ''),
    followups,
    assigned_user_name: assignedUserName,
    users,
    canEdit: hasPermission(user.role, 'customers.edit'),
    canEditLevel: hasPermission(user.role, 'customers.edit_level'),
    canEditInterests: hasPermission(user.role, 'customers.edit_interests'),
    canEditTags: hasPermission(user.role, 'customers.edit_tags'),
    canDelete: hasPermission(user.role, 'customers.delete'),
    canAssign: hasPermission(user.role, 'customers.assign'),
  });
}

// 更新客户
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await context.params;
  const customer = findCustomerById(parseInt(id));

  if (!customer) {
    return NextResponse.json({ error: '客户不存在' }, { status: 404 });
  }

  if (!canAccess(user, customer)) {
    return NextResponse.json({ error: '无权修改' }, { status: 403 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  // 基本信息：需要 customers.edit 权限
  if (hasPermission(user.role, 'customers.edit')) {
    const basicFields = ['contact_name', 'position', 'phone', 'email', 'company_name', 'country', 'source_channel', 'stage', 'notes', 'next_followup_at'];
    for (const f of basicFields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }
  }

  // 产品兴趣
  if (body.product_interests !== undefined && hasPermission(user.role, 'customers.edit_interests')) {
    updates.product_interests = JSON.stringify(body.product_interests);
  }

  // 标签
  if (body.tags !== undefined && hasPermission(user.role, 'customers.edit_tags')) {
    updates.tags = JSON.stringify(body.tags);
  }

  // 等级
  if (body.customer_level !== undefined && hasPermission(user.role, 'customers.edit_level')) {
    updates.customer_level = body.customer_level;
  }

  // 分配负责人
  if (body.assigned_to !== undefined && hasPermission(user.role, 'customers.assign')) {
    updates.assigned_to = body.assigned_to || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '没有要更新的字段' }, { status: 400 });
  }

  updateCustomer(parseInt(id), updates as Parameters<typeof updateCustomer>[1]);

  return NextResponse.json({ success: true });
}

// 软删除客户
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'customers.delete')) {
    return NextResponse.json({ error: '无权删除' }, { status: 403 });
  }

  const { id } = await context.params;
  const customer = findCustomerById(parseInt(id));

  if (!customer) {
    return NextResponse.json({ error: '客户不存在' }, { status: 404 });
  }

  if (!canAccess(user, customer)) {
    return NextResponse.json({ error: '无权删除' }, { status: 403 });
  }

  softDeleteCustomer(parseInt(id));

  return NextResponse.json({ success: true });
}
