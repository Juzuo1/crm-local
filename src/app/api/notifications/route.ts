import { NextRequest, NextResponse } from 'next/server';
import { listCustomers, listUsers, getDataScope } from '@/lib/db';
import { getSession } from '@/lib/auth';

export interface NotificationItem {
  id: number;
  contact_name: string;
  company_name: string;
  next_followup_at: string;
  is_overdue: boolean;
  is_today: boolean;
  is_tomorrow: boolean;
  overdue_days: number;
}

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const dataScope = await getDataScope(user.role, 'customers');
  let visibleUserIds: number[] = [];

  if (dataScope === 'own') {
    visibleUserIds = [user.id];
  } else if (dataScope === 'department') {
    const { getTeamMemberIds } = await import('@/lib/db');
    const team = await getTeamMemberIds(user.id);
    visibleUserIds = [user.id, ...team];
  }
  // admin: visibleUserIds 为空 → 看全部

  const { data: allCustomers } = await listCustomers({
    visibleUserIds: visibleUserIds.length > 0 ? visibleUserIds : undefined,
    pageSize: 10000,
  });

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const alerts: NotificationItem[] = allCustomers
    .filter(c => c.next_followup_at)
    .map(c => {
      const followupDate = c.next_followup_at!.slice(0, 10);
      const daysDiff = Math.floor(
        (new Date(followupDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: c.id,
        contact_name: c.contact_name,
        company_name: c.company_name || '',
        next_followup_at: c.next_followup_at!,
        is_overdue: daysDiff < 0,
        is_today: daysDiff === 0,
        is_tomorrow: daysDiff === 1,
        overdue_days: daysDiff < 0 ? Math.abs(daysDiff) : 0,
      };
    })
    .filter(a => a.is_overdue || a.is_today || a.is_tomorrow)
    .sort((a, b) => {
      // 逾期 > 今天 > 明天
      if (a.is_overdue !== b.is_overdue) return a.is_overdue ? -1 : 1;
      if (a.is_today !== b.is_today) return a.is_today ? -1 : 1;
      return a.next_followup_at.localeCompare(b.next_followup_at);
    });

  return NextResponse.json({
    alerts,
    total: alerts.length,
    overdue: alerts.filter(a => a.is_overdue).length,
    today: alerts.filter(a => a.is_today).length,
    tomorrow: alerts.filter(a => a.is_tomorrow).length,
  });
}
