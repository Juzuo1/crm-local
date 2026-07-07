'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/lib/utils';

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

const levelLabels: Record<string, string> = { A: 'A级 - 高价值', B: 'B级 - 意向强', C: 'C级 - 待培育', D: 'D级 - 无效' };
const levelColors: Record<string, string> = { A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-yellow-100 text-yellow-800', D: 'bg-red-100 text-red-800' };
const channelLabels: Record<string, string> = {
  facebook: 'Facebook', tiktok: 'TikTok', alibaba: '阿里国际站',
  website: '独立站', exhibition: '展会', referral: '转介绍', other: '其他'
};

const stageLabels: Record<string, string> = {
  new_lead: '新线索', initial_contact: '初步联系', needs_confirmed: '需求确认',
  quoted: '已报价', sample_testing: '样品测试', negotiation: '商务谈判',
  order_confirmed: '确认订单', production_shipping: '生产发货',
  completed: '已成交客户', lost: '已流失'
};

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
    return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">仪表盘</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">客户总数</div>
          <div className="text-3xl font-bold text-gray-900">{data.totalCustomers}</div>
          <div className="text-xs text-gray-400 mt-1">本月新增 {data.newThisMonth}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">待跟进客户</div>
          <div className={`text-3xl font-bold ${data.pendingFollowup > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {data.pendingFollowup}
          </div>
          <div className="text-xs text-gray-400 mt-1">今天或已逾期</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">本月新增</div>
          <div className="text-3xl font-bold text-green-600">{data.newThisMonth}</div>
          <div className="text-xs text-gray-400 mt-1">较上月</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 客户等级分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">客户等级分布</h3>
          <div className="space-y-3">
            {(['A', 'B', 'C', 'D'] as const).map(level => {
              const item = data.levelDistribution.find(d => d.customer_level === level);
              const count = item?.count || 0;
              const pct = data.totalCustomers > 0 ? Math.round((count / data.totalCustomers) * 100) : 0;
              return (
                <div key={level} className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[level]}`}>
                    {levelLabels[level]}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${level === 'A' ? 'bg-green-500' : level === 'B' ? 'bg-blue-500' : level === 'C' ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 客户阶段分布 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">客户阶段分布</h3>
          <div className="space-y-2.5">
            {data.stageDistribution.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">暂无数据</p>
            ) : (
              data.stageDistribution.map(s => {
                const pct = data.totalCustomers > 0 ? Math.round((s.count / data.totalCustomers) * 100) : 0;
                const label = stageLabels[s.stage] || s.stage;
                return (
                  <div key={s.stage} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-20 truncate">{label}</span>
                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 2)}%`, minWidth: pct > 0 ? '8px' : '0' }} />
                    </div>
                    <span className="text-sm text-gray-900 font-medium w-8 text-right">{s.count}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 渠道分布 - 饼图 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">渠道来源分布</h3>
          {data.channelDistribution.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无数据</p>
          ) : (
            <PieChart data={data.channelDistribution.map(ch => ({
              label: channelLabels[ch.source_channel] || ch.source_channel,
              value: ch.count,
            }))} />
          )}
        </div>

        {/* 最近添加的客户 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">最近添加的客户</h3>
            <Link href="/customers" className="text-sm text-blue-600 hover:underline">查看全部</Link>
          </div>
          <div className="space-y-2">
            {data.recentCustomers.map(c => (
              <Link key={c.id} href={`/customers/${c.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition">
                <div>
                  <span className="text-sm font-medium text-gray-900">{c.contact_name}</span>
                  {c.company_name && <span className="text-xs text-gray-400 ml-2">{c.company_name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{c.country}</span>
                  {c.source_channel && (
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">{channelLabels[c.source_channel] || c.source_channel}</span>
                  )}
                </div>
              </Link>
            ))}
            {data.recentCustomers.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center">暂无客户</p>
            )}
          </div>
        </div>
      </div>

      {/* 跟进提醒 */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">
          跟进提醒
          {data.followupAlerts.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">{data.followupAlerts.length}</span>
          )}
        </h3>
        <div className="space-y-2">
          {data.followupAlerts.map(c => {
            const isOverdue = new Date(c.next_followup_at) < new Date();
            return (
              <Link key={c.id} href={`/customers/${c.id}`}
                className={`flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition ${
                  isOverdue ? 'bg-red-50 border border-red-100' : ''
                }`}>
                <div>
                  <span className="text-sm font-medium text-gray-900">{c.contact_name}</span>
                  {c.company_name && <span className="text-xs text-gray-400 ml-2">{c.company_name}</span>}
                </div>
                <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                  {isOverdue ? '已逾期: ' : ''}{formatDateTime(c.next_followup_at)}
                </span>
              </Link>
            );
          })}
          {data.followupAlerts.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">✅ 没有需要跟进的客户</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 饼图组件 =====
const PIE_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#f97316'];

function PieChart({ data }: { data: { label: string; value: number }[] }) {
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
        {data.map((d, i) => {
          const a = (d.value / total) * Math.PI * 2;
          const end = angle + a;
          const mid = angle + a / 2;
          const lx = cx + r * 0.62 * Math.cos(mid);
          const ly = cy + r * 0.62 * Math.sin(mid);
          const path = slicePath(angle, end);
          angle = end;
          return (
            <g key={d.label}>
              <path d={path} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth="1.5" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill="#fff" fontSize="12" fontWeight="600">{d.value}</text>
            </g>
          );
        })}
      </svg>
      <div className="space-y-2 flex-1 pt-1">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-gray-600 flex-1">{d.label}</span>
            <span className="text-gray-900 font-medium">{d.value}</span>
            <span className="text-gray-400 text-xs">{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

