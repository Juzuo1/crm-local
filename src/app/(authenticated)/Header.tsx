'use client';

import { useState, useEffect, useRef } from 'react';
import type { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions';
import Link from 'next/link';

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

  // 加载通知
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
    // 30秒轮询
    pollingRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // 点击外部关闭
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

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-medium text-gray-600">
        欢迎回来，{user.name}
      </h1>

      <div className="flex items-center gap-4">
        {/* 通知铃铛 */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            title="跟进提醒"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* 下拉面板 */}
          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">跟进提醒</h3>
                <div className="flex items-center gap-3 mt-1">
                  {overdueAlerts.length > 0 && (
                    <span className="text-xs text-red-600">{overdueAlerts.length} 个逾期</span>
                  )}
                  {todayAlerts.length > 0 && (
                    <span className="text-xs text-orange-600">{todayAlerts.length} 个今天</span>
                  )}
                  {tomorrowAlerts.length > 0 && (
                    <span className="text-xs text-gray-500">{tomorrowAlerts.length} 个明天</span>
                  )}
                </div>
              </div>

              {alerts.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  ✅ 没有需要跟进的客户
                </div>
              ) : (
                <div className="py-1">
                  {/* 分组：逾期 */}
                  {overdueAlerts.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 text-[11px] font-medium text-red-500 uppercase bg-red-50/50">
                        ⚠ 已逾期
                      </div>
                      {overdueAlerts.map(a => (
                        <Link key={a.id} href={`/customers/${a.id}`}
                          onClick={() => setShowNotif(false)}
                          className="block px-4 py-2 hover:bg-red-50 transition border-l-2 border-red-400">
                          <div className="text-sm font-medium text-gray-900">{a.contact_name}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-gray-400">{a.company_name || '-'}</span>
                            <span className="text-xs text-red-600 font-medium">逾期{a.overdue_days}天</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* 今天 */}
                  {todayAlerts.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 text-[11px] font-medium text-orange-500 uppercase bg-orange-50/50">
                        ⏰ 今天
                      </div>
                      {todayAlerts.map(a => (
                        <Link key={a.id} href={`/customers/${a.id}`}
                          onClick={() => setShowNotif(false)}
                          className="block px-4 py-2 hover:bg-orange-50 transition border-l-2 border-orange-300">
                          <div className="text-sm font-medium text-gray-900">{a.contact_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{a.company_name || '-'}</div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* 明天 */}
                  {tomorrowAlerts.length > 0 && (
                    <div>
                      <div className="px-4 py-1.5 text-[11px] font-medium text-gray-400 uppercase bg-gray-50/50">
                        📅 明天
                      </div>
                      {tomorrowAlerts.map(a => (
                        <Link key={a.id} href={`/customers/${a.id}`}
                          onClick={() => setShowNotif(false)}
                          className="block px-4 py-2 hover:bg-gray-50 transition border-l-2 border-gray-200">
                          <div className="text-sm font-medium text-gray-900">{a.contact_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{a.company_name || '-'}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <Link href="/dashboard" onClick={() => setShowNotif(false)}
                  className="text-xs text-blue-600 hover:underline">
                  前往仪表盘查看全部 →
                </Link>
              </div>
            </div>
          )}
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-red-600 transition cursor-pointer"
          >
            退出登录
          </button>
        </form>
      </div>
    </header>
  );
}
