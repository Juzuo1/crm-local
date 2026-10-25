import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser, findUserByEmail, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'users.view')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }

  return NextResponse.json(await listUsers());
}

export async function POST(request: NextRequest) {
  const admin = await getSession();
  if (!admin) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(admin.role, 'users.create')) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const { name, email, password, role } = await request.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: '姓名、邮箱、密码必填' }, { status: 400 });
  }

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: '邮箱已存在' }, { status: 400 });
  }

  const hash = bcrypt.hashSync(password, 10);
  await createUser({
    name,
    email,
    password_hash: hash,
    role: role || 'agent',
    is_active: 1,
    department_id: null,
  });

  // 审计日志
  await addAuditLog({
    user_id: admin.id,
    user_name: admin.name,
    action: 'user.create',
    target_type: 'user',
    target_id: 0,
    target_name: name,
    detail: { name, email, role: role || 'agent' },
  });

  return NextResponse.json({ success: true });
}
