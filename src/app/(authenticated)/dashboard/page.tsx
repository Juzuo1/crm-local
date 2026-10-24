'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';
import Icon from '@/components/Icon';
import { LEVEL_LABELS, LEVEL_SOLID, STAGE_LABELS, STAGE_SOLID, CHANNEL_LABELS, CHANNEL_SOLID, avatarColor } from '@/lib/ui';

interface DashboardData {
  totalCustomers: number;
  newThisMonth: number;
  pendingFollowup: number;
  levelDistribution: { customer_level: string; count: number }[];
  channelDistribution: { source_channel: string; count: number }[];
  stageDistribution: { stage: string; count: number }[];
  recentCustomers: { id: number; contact_name: string; company_name: string; country: string; source_channel: string; customer_level: string; created_at: string }[];
  followupAlerts: { id: number; contact_name: string; company_name: string; next_followup_at: string }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-slate-400">加载中…</div>;
  }

  if (!data) return null;

  const statCards = [
    { label: '客户总数', value: data.totalCustomers, sub: `本月新增 ${data.newThisMonth}`, icon: 'users', color: 'text-[#0A2540]', iconBg: 'bg-slate-100 text-[#0A2540]' },
    { label: '待跟进客户', value: data.pendingFollowup, sub: '今天或已逾期', icon: 'clock', color: data.pendingFollowup > 0 ? 'text-red-600' : 'text-[#0A2540]', iconBg: 'bg-red-50 text-red-500' },
    { label: '本月新增', value: data.newThisMonth, sub: '持续积累客户资产', icon: 'plus', color: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0A2540]">仪表盘</h2>
        <p className="text-xs text-slate-400 mt-0.5">业务全貌一览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
              <Icon name={card.icon} className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">{card.label}</div>
              <div className={`text-2xl font-bold leading-tight ${card.color}`}>{card.value}</div>
              <div className="text-[11px] text-slate-400">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 客户等级分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80">
          <h3 className="font-semibold text-[#0A2540] mb-4">客户等级分布</h3>
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map(level => {
              const item = data.levelDistribution.find(d => d.customer_level === level);
              const count = item?.count || 0;
              const pct = data.totalCustomers > 0 ? Math.round((count / data.totalCustomers) * 100) : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{LEVEL_LABELS[level]}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: LEVEL_SOLID[level] }} />
                  </div>
                  <span className="text-sm text-[#0A2540] font-semibold w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 客户阶段分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80">
          <h3 className="font-semibold text-[#0A2540] mb-4">客户阶段分布</h3>
          <div className="space-y-2.5">
            {data.stageDistribution.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
            ) : (
              data.stageDistribution.map(s => {
                const pct = data.totalCustomers > 0 ? Math.round((s.count / data.totalCustomers) * 100) : 0;
                const label = STAGE_LABELS[s.stage] || s.stage;
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 truncate shrink-0">{label}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 2)}%`, background: STAGE_SOLID[s.stage] || '#94A3B8' }} />
                    </div>
                    <span className="text-sm text-[#0A2540] font-semibold w-8 text-right">{s.count}</span>
                    <span className="text-[11px] text-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 渠道分布 - 饼图 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80">
          <h3 className="font-semibold text-[#0A2540] mb-4">渠道来源分布</h3>
          {data.channelDistribution.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">暂无数据</p>
          ) : (
            <PieChart data={data.channelDistribution.map(ch => ({
              label: CHANNEL_LABELS[ch.source_channel] || ch.source_channel,
              value: ch.count,
              color: CHANNEL_SOLID[ch.source_channel] || '#94A3B8',
            }))} />
          )}
        </div>

        {/* 最近添加的客户 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#0A2540]">最近添加的客户</h3>
            <Link href="/customers" className="text-sm text-[#FF6B35] hover:text-[#e55a2b] font-medium inline-flex items-center gap-1">
              查看全部 <Icon name="arrowRight" className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-1">
            {data.recentCustomers.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition">
                <div className={`w-7 h-7 rounded-full ${avatarColor(c.contact_name || '?')} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                  {(c.contact_name || '?').slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-[#0A2540]">{c.contact_name}</span>
                  {c.company_name && <span className="text-xs text-slate-400 ml-2 truncate">{c.company_name}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400">{c.country}</span>
                  {c.source_channel && (
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{CHANNEL_LABELS[c.source_channel] || c.source_channel}</span>
                  )}
                </div>
              </Link>
            ))}
            {data.recentCustomers.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">暂无客户</p>
            )}
          </div>
        </div>
      </div>

      {/* 跟进提醒 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200/80">
        <h3 className="font-semibold text-[#0A2540] mb-4">
          跟进提醒
          {(() => {
            const overdue = data.followupAlerts.filter(c => new Date(c.next_followup_at) < new Date());
            const today = data.followupAlerts.filter(c => {
              const d = new Date(c.next_followup_at);
              const now = new Date();
              return d.toDateString() === now.toDateString();
            });
            const tomorrow = data.followupAlerts.filter(c => {
              const d = new Date(c.next_followup_at);
              const t = new Date();
              t.setDate(t.getDate() + 1);
              return d.toDateString() === t.toDateString();
            });
            return (
              <span className="ml-2 space-x-1.5">
                {overdue.length > 0 && <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full font-medium ring-1 ring-inset ring-red-200">{overdue.length} 逾期</span>}
                {today.length > 0 && <span className="px-2 py-0.5 bg-orange-50 text-[#FF6B35] text-xs rounded-full font-medium ring-1 ring-inset ring-orange-200">{today.length} 今天</span>}
                {tomorrow.length > 0 && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">{tomorrow.length} 明天</span>}
              </span>
            );
          })()}
        </h3>

        {data.followupAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="check" className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-slate-400">没有需要跟进的客户</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const today = new Date();
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);

              const overdue = data.followupAlerts.filter(c => new Date(c.next_followup_at) < today);
              const todayItems = data.followupAlerts.filter(c => {
                const d = new Date(c.next_followup_at);
                return d.toDateString() === today.toDateString();
              });
              const tomorrowItems = data.followupAlerts.filter(c => {
                const d = new Date(c.next_followup_at);
                return d.toDateString() === tomorrow.toDateString();
              });

              return (
                <>
                  {overdue.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="warning" className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs font-semibold text-red-600 tracking-wide">已逾期</span>
                        <span className="h-px bg-red-200 flex-1" />
                      </div>
                      <div className="space-y-2">
                        {overdue.slice(0, 8).map(c => (
                          <div key={c.id}
                            className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-red-50/70 border border-red-100 hover:bg-red-50 transition">
                            <Link href={`/customers/${c.id}`} className="flex-1 min-w-0">
                              <div>
                                <span className="text-sm font-medium text-[#0A2540]">{c.contact_name}</span>
                                {c.company_name && <span className="text-xs text-slate-400 ml-2">{c.company_name}</span>}
                              </div>
                              <span className="text-xs text-red-600 font-medium">
                                已逾期 · {formatDateTime(c.next_followup_at)}
                              </span>
                            </Link>
                            <Link href={`/customers/${c.id}`}
                              className="shrink-0 ml-3 px-3.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition cursor-pointer">
                              立即跟进
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {todayItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="clock" className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="text-xs font-semibold text-[#FF6B35] tracking-wide">今天需跟进</span>
                        <span className="flex-1 h-px bg-orange-200" />
                      </div>
                      <div className="space-y-2">
                        {todayItems.map(c => (
                          <div key={c.id}
                            className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-orange-50/70 border border-orange-100 hover:bg-orange-50 transition">
                            <Link href={`/customers/${c.id}`} className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[#0A2540]">{c.contact_name}</span>
                              {c.company_name && <span className="text-xs text-slate-400 ml-2">{c.company_name}</span>}
                            </Link>
                            <Link href={`/customers/${c.id}`}
                              className="shrink-0 ml-3 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#FF6B35] text-white hover:bg-[#e55a2b] transition cursor-pointer">
                              跟进
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tomorrowItems.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="calendar" className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-400 tracking-wide">明天</span>
                        <span className="flex-1 h-px bg-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        {tomorrowItems.map(c => (
                          <Link key={c.id} href={`/customers/${c.id}`}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-slate-50 transition text-sm">
                            <div>
                              <span className="text-slate-700">{c.contact_name}</span>
                              {c.company_name && <span className="text-xs text-slate-400 ml-2">{c.company_name}</span>}
                            </div>
                            <span className="text-xs text-slate-400">{formatDateTime(c.next_followup_at)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== 环形饼图组件（数据自带颜色）=====
function PieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 75; const cx = 90; const cy = 90; const size = 180;
  let angle = -Math.PI / 2;

  function slicePath(start: number, end: number) {
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`;
  }

  return (
    <div className="flex items-start gap-6">
      <svg width={size} height={size} className="shrink-0">
        {data.map((d) => {
          const a = (d.value / total) * Math.PI * 2;
          const end = angle + a;
          const mid = angle + a / 2;
          const lx = cx + r * 0.62 * Math.cos(mid);
          const ly = cy + r * 0.62 * Math.sin(mid);
          const path = slicePath(angle, end);
          angle = end;
          return (
            <g key={d.label}>
              <path d={path} fill={d.color} stroke="#fff" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="12" fontWeight="600">{d.value}</text>
            </g>
          );
        })}
      </svg>
      <div className="space-y-2 flex-1 pt-1">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-slate-600 flex-1">{d.label}</span>
            <span className="text-[#0A2540] font-semibold">{d.value}</span>
            <span className="text-slate-400 text-xs w-9 text-right">{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
