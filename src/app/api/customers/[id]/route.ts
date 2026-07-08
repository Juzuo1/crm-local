import { NextRequest, NextResponse } from 'next/server';
import { findCustomerById, updateCustomer, softDeleteCustomer, listFollowups, listUsers, findUserById, getTeamMemberIds, hasPermission, getCustomerSnapshot, addAuditLog } from '@/lib/db';
import { getSession, SessionUser } from '@/lib/auth';
import { buildChangeDetail } from '@/lib/audit';
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
    canPushToSea: hasPermission(user.role, 'sea_pool.push'),
    assigned_to: customer.assigned_to,
    sea_pool_entered_at: customer.sea_pool_entered_at || null,
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

  // 保存旧值用于审计
  const oldSnapshot = getCustomerSnapshot(parseInt(id)) || {};

  updateCustomer(parseInt(id), updates as Parameters<typeof updateCustomer>[1]);

  // 审计日志
  const trackedFields = ['contact_name', 'position', 'phone', 'email', 'company_name', 'country', 'source_channel', 'customer_level', 'stage', 'product_interests', 'tags', 'notes', 'assigned_to', 'next_followup_at'];
  const detail = buildChangeDetail(oldSnapshot, { ...oldSnapshot, ...updates }, trackedFields);
  if (Object.keys(detail).length > 0) {
    addAuditLog({
      user_id: user.id,
      user_name: user.name,
      action: 'customer.update',
      target_type: 'customer',
      target_id: parseInt(id),
      target_name: customer.contact_name,
      detail: detail as Record<string, unknown>,
    });
  }

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

  addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'customer.delete',
    target_type: 'customer',
    target_id: parseInt(id),
    target_name: customer.contact_name,
    detail: { contact_name: customer.contact_name, company_name: customer.company_name || '' },
  });

  return NextResponse.json({ success: true });
}
