import { NextRequest, NextResponse } from 'next/server';
import { listSegments, createCustomSegment, deleteSegment, resolveAccess, hasPermission } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const access = await resolveAccess(user.id, user.role, 'segments', 'segments.view');
  if (!access.allowed) return NextResponse.json({ error: '无权访问' }, { status: 403 });

  const segments = await listSegments(access.visibleUserIds);

  return NextResponse.json({
    segments,
    canCreate: await hasPermission(user.role, 'segments.create'),
    role: user.role,
  });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'segments.create')) {
    return NextResponse.json({ error: '无权创建客群' }, { status: 403 });
  }

  const body = await request.json();
  if (!body.name || !body.filters) {
    return NextResponse.json({ error: '客群名称和筛选条件必填' }, { status: 400 });
  }

  const segment = await createCustomSegment({
    name: body.name,
    filters: body.filters,
    created_by: user.id,
  });

  return NextResponse.json(segment);
}

export async function DELETE(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'segments.create')) {
    return NextResponse.json({ error: '无权删除客群' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const id = parseInt(searchParams.get('id') || '0');

  const ok = await deleteSegment(id);
  if (!ok) {
    return NextResponse.json({ error: '删除失败（系统客群不可删除）' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
