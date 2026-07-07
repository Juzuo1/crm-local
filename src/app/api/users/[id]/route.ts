import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUserStatus, updateUser, updateUserPassword, transferCustomers, hasPermission } from '@/lib/db';
import { getSession } from '@/lib/auth';

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
      return NextResponse.json({ success: true });

    case 'edit':
      if (!hasPermission(user.role, 'users.edit')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      updateUser(parseInt(id), {
        name: body.name,
        email: body.email,
        role: body.role,
      });
      return NextResponse.json({ success: true });

    case 'reset-password':
      if (!hasPermission(user.role, 'users.reset_pwd')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      if (!body.password || body.password.length < 6) {
        return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
      }
      updateUserPassword(parseInt(id), body.password);
      return NextResponse.json({ success: true });

    case 'transfer':
      if (!hasPermission(user.role, 'users.transfer')) {
        return NextResponse.json({ error: '无权操作' }, { status: 403 });
      }
      if (!body.to_user_id) {
        return NextResponse.json({ error: '请选择目标用户' }, { status: 400 });
      }
      const count = transferCustomers(parseInt(id), body.to_user_id);
      return NextResponse.json({ success: true, count });

    default:
      return NextResponse.json({ error: '未知操作' }, { status: 400 });
  }
}
