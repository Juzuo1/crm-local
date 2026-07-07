import { NextRequest, NextResponse } from 'next/server';
import { listDepartments, createDepartment, updateDepartment, deleteDepartment, setUserDepartment, hasPermission } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'departments.view')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  return NextResponse.json(listDepartments());
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'departments.create')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  const body = await request.json();
  const dept = createDepartment({ name: body.name, manager_id: body.manager_id || undefined });
  return NextResponse.json(dept);
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'departments.edit')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  const body = await request.json();
  updateDepartment(body.id, { name: body.name, manager_id: body.manager_id });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!hasPermission(user.role, 'departments.delete')) {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  const { searchParams } = request.nextUrl;
  const id = parseInt(searchParams.get('id') || '0');
  deleteDepartment(id);
  return NextResponse.json({ success: true });
}

// 设置用户所属部门
export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const body = await request.json();

  if (body.department_id === null) {
    // 移除成员
    if (!hasPermission(user.role, 'departments.remove_member')) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }
  } else {
    // 添加/移动成员
    if (!hasPermission(user.role, 'departments.add_member')) {
      return NextResponse.json({ error: '无权操作' }, { status: 403 });
    }
  }

  setUserDepartment(body.user_id, body.department_id);
  return NextResponse.json({ success: true });
}
