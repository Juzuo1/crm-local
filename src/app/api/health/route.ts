import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseAdmin, supabaseHost } from '@/lib/supabaseServer';
import { listUsers, listCustomers } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * 在线体检接口：用于部署后快速确认网站是否成功连上云数据库。
 * 只暴露「是否配置 / 是否连通 / 记录数量」，绝不返回任何密钥或用户敏感信息。
 */
export async function GET() {
  const result: Record<string, unknown> = {
    ok: false,
    mode: isSupabaseConfigured ? 'supabase' : 'local-file',
    supabaseConfigured: isSupabaseConfigured,
    supabaseHost,
    expectedHost: 'ebrvwrvwgsupfltqcfcu.supabase.co',
    timestamp: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabaseAdmin) {
    // 直连探测：确认 URL 与 service_role key 是否有效
    const probe = await supabaseAdmin.from('crm_users').select('id', { count: 'exact', head: true });
    result.dbReachable = !probe.error;
    if (probe.error) result.dbError = probe.error.message;
    result.dbUserCount = probe.count ?? null;
  }

  try {
    const users = await listUsers();
    const customers = await listCustomers({ page: 1, pageSize: 1 });
    result.userCount = users.length;
    result.customerCount = customers.total;
    result.ok = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(result);
}
