import { NextRequest, NextResponse } from 'next/server';
import { getRolePermissions, updateRolePermissions } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  return NextResponse.json(await getRolePermissions());
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: '无权访问' }, { status: 403 });
  }
  const body = await request.json();
  await updateRolePermissions(body);
  return NextResponse.json({ success: true });
}
