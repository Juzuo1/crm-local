import { NextRequest, NextResponse } from 'next/server';
import { claimSeaCustomer, findCustomerById, hasPermission, addAuditLog } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  if (!await hasPermission(user.role, 'sea_pool.claim')) {
    return NextResponse.json({ error: '无权领取' }, { status: 403 });
  }

  const body = await request.json();
  const { customer_id } = body;

  if (!customer_id) {
    return NextResponse.json({ error: '缺少客户ID' }, { status: 400 });
  }

  const customer = await findCustomerById(customer_id);
  const result = await claimSeaCustomer(customer_id, user.id);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // 审计日志
  await addAuditLog({
    user_id: user.id,
    user_name: user.name,
    action: 'customer.sea_claim',
    target_type: 'customer',
    target_id: customer_id,
    target_name: customer?.contact_name || `客户#${customer_id}`,
    detail: { customer_id, claimed_by: user.name },
  });

  return NextResponse.json({ success: true });
}
