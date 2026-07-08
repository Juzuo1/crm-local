import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserStatus, updateUser, updateUserPassword, transferCustomers, hasPermission, getUserSnapshot, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { buildChangeDetail } from '@/lib/audit';

// 编辑用户信息 / 重置密码 / 交接客户 / 启停用
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const { id } = await context.params;
  const targetUser = findUserById(parseInt(id));
  if (!targetUser) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'toggle':
      if (!hasPermission(user.role, 'users.toggle')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      updateUserStatus(parseInt(id), body.is_active ? 1 : 0);
      addAuditLog({
        user_id: user.id,
        user_name: user.name,
        action: 'user.toggle',
        target_type: 'user',
        target_id: parseInt(id),
        target_name: targetUser.name,
        detail: { is_active: body.is_active ? 1 : 0 },
      });
      return NextResponse.json({ success: true });

    case 'edit':
      if (!hasPermission(user.role, 'users.edit')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      const oldUser = getUserSnapshot(parseInt(id)) || {};
      updateUser(parseInt(id), {
        name: body.name,
        email: body.email,
        role: body.role,
      });
      const userDetail = buildChangeDetail(oldUser, { ...oldUser, name: body.name, email: body.email, role: body.role }, ['name', 'email', 'role']);
      if (Object.keys(userDetail).length > 0) {
        addAuditLog({
          user_id: user.id,
          user_name: user.name,
          action: 'user.update',
          target_type: 'user',
          target_id: parseInt(id),
          target_name: targetUser.name,
          detail: userDetail as Record<string, unknown>,
        });
      }
      return NextResponse.json({ success: true });

    case 'reset-password':
      if (!hasPermission(user.role, 'users.reset_pwd')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      if (!body.password || body.password.length < 6) {
        return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
      }
      updateUserPassword(parseInt(id), body.password);
      addAuditLog({
        user_id: user.id,
        user_name: user.name,
        action: 'user.reset_pwd',
        target_type: 'user',
        target_id: parseInt(id),
        target_name: targetUser.name,
        detail: {},
      });
      return NextResponse.json({ success: true });

    case 'transfer':
      if (!hasPermission(user.role, 'users.transfer')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      if (!body.to_user_id) {
        return NextResponse.json({ error: '请选择目标用户' }, { status: 400 });
      }
      const toUser = findUserById(body.to_user_id);
      const count = transferCustomers(parseInt(id), body.to_user_id);
      addAuditLog({
        user_id: user.id,
        user_name: user.name,
        action: 'user.transfer',
        target_type: 'user',
        target_id: parseInt(id),
        target_name: targetUser.name,
        detail: { from_user: targetUser.name, to_user: toUser?.name || '未知', customer_count: count },
      });
      return NextResponse.json({ success: true, count });

    default:
      return NextResponse.json({ error: '未知操作' }, { status: 400 });
  }
}
