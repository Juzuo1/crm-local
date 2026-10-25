import { NextResponse } from 'next/server';
import { checkSeaPoolFall, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'sea_pool.manage_rules')) {
    return NextResponse.json({ error: '无权操作' }, { status: 403 });
  }

  const result = await checkSeaPoolFall();

  // 审计
  if (result.fell > 0) {
    for (const d of result.details) {
      await addAuditLog({
        user_id: user.id,
        user_name: user.name,
        action: 'customer.sea_fall',
        target_type: 'customer',
        target_id: d.id,
        target_name: d.name,
        detail: { former_assignee: d.former_assignee, triggered_by: user.name },
      });
    }
  }

  return NextResponse.json(result);
}
