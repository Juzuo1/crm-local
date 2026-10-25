import { NextRequest, NextResponse } from 'next/server';
import { getSeaPoolRules, updateSeaPoolRules, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  return NextResponse.json(await getSeaPoolRules());
}

export async function PUT(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'sea_pool.manage_rules')) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const body = await request.json();
  const old = await getSeaPoolRules();
  await updateSeaPoolRules(body);

  // 审计
  await addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'user.update',
    target_type: 'user',
    target_id: 0,
    target_name: '公海规则',
    detail: { before: old, after: { ...old, ...body } },
  });

  return NextResponse.json({ success: true });
}
