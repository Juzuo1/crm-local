'use client';

import { useState, useEffect, useRef } from 'react';
import type { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions';
import Link from 'next/link';
import Icon from '@/components/Icon';

interface NotificationItem {
  id: number;
  contact_name: string;
  company_name: string;
  next_followup_at: string;
  is_overdue: boolean;
  is_today: boolean;
  is_tomorrow: boolean;
  overdue_days: number;
}

export default function Header({ user }: { user: SessionUser }) {
  const [showNotif, setShowNotif] = useState(false);
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.total || 0);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    if (showNotif) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotif]);

  const overdueAlerts = alerts.filter(a => a.is_overdue);
  const todayAlerts = alerts.filter(a => a.is_today);
  const tomorrowAlerts = alerts.filter(a => a.is_tomorrow);

  const groupHead = (color: string, label: string) => (
    <div className={`px-4 py-1.5 text-[11px] font-semibold tracking-wide ${color}`}>{label}</div>
  );

  const alertItem = (a: NotificationItem, hover: string, border: string, extra?: React.ReactNode) => (
    <Link key={a.id} href={`/customers/${a.id}`}
      onClick={() => setShowNotif(false)}
      className={`block px-4 py-2.5 ${hover} transition border-l-2 ${border}`}>
      <div className="text-sm font-medium text-slate-800">{a.contact_name}</div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-xs text-slate-400">{a.company_name || '-'}</span>
        {extra}
      </div>
    </Link>
  );

  return (
    <header className="h-14 bg-white/80 backdrop-blur border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <h1 className="text-sm text-slate-500">
        欢迎回来，<span className="font-semibold text-[#0A2540]">{user.name}</span>
      </h1>

      <div className="flex items-center gap-2">
        {/* 通知铃铛 */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#0A2540] transition cursor-pointer"
            title="跟进提醒"
          >
            <Icon name="bell" className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-[#FF6B35] text-white text-[10px] font-bold px-1 ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-[340px] bg-white rounded-xl shadow-xl shadow-slate-900/5 border border-slate-200 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0A2540]">跟进提醒</h3>
                <div className="flex items-center gap-2.5">
                  {overdueAlerts.length > 0 && (
                    <span className="text-xs text-red-600 font-medium">{overdueAlerts.length} 逾期</span>
                  )}
                  {todayAlerts.length > 0 && (
                    <span className="text-xs text-[#FF6B35] font-medium">{todayAlerts.length} 今天</span>
                  )}
                  {tomorrowAlerts.length > 0 && (
                    <span className="text-xs text-slate-400">{tomorrowAlerts.length} 明天</span>
                  )}
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Icon name="check" className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-400">没有需要跟进的客户</div>
                </div>
              ) : (
                <div className="py-1">
                  {overdueAlerts.length > 0 && (
                    <div>
                      {groupHead('text-red-500 bg-red-50/60', '已逾期')}
                      {overdueAlerts.map(a => alertItem(a, 'hover:bg-red-50', 'border-red-400',
                        <span className="text-xs text-red-600 font-medium">逾期{a.overdue_days}天</span>))}
                    </div>
                  )}
                  {todayAlerts.length > 0 && (
                    <div>
                      {groupHead('text-[#FF6B35] bg-orange-50/60', '今天')}
                      {todayAlerts.map(a => alertItem(a, 'hover:bg-orange-50/60', 'border-orange-300'))}
                    </div>
                  )}
                  {tomorrowAlerts.length > 0 && (
                    <div>
                      {groupHead('text-slate-400 bg-slate-50', '明天')}
                      {tomorrowAlerts.map(a => alertItem(a, 'hover:bg-slate-50', 'border-slate-200'))}
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/80 rounded-b-xl">
                <Link href="/dashboard" onClick={() => setShowNotif(false)}
                  className="text-xs text-[#FF6B35] hover:text-[#e55a2b] font-medium inline-flex items-center gap-1">
                  前往仪表盘查看全部 <Icon name="arrowRight" className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition cursor-pointer px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <Icon name="logout" className="w-4 h-4" />
            退出
          </button>
        </form>
      </div>
    </header>
  );
}
