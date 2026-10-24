'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { LEVEL_BADGE, LEVEL_DOT, CHANNEL_LABELS, badgeClass } from '@/lib/ui';

interface SeaCustomer {
  id: number;
  contact_name: string;
  company_name: string;
  country: string;
  source_channel: string;
  customer_level: string;
  stage: string;
  phone: string;
  email: string;
  tags: string;
  next_followup_at: string | null;
  last_followup_at: string | null;
  created_at: string;
  sea_pool_entered_at: string | null;
  former_assignee_name: string;
}

interface ListData {
  data: SeaCustomer[];
  total: number;
  stats: { total: number; weekFell: number; todayClaimed: number };
  page: number;
  pageSize: number;
  totalPages: number;
}

const countries = [
  '美国', '德国', '英国', '法国', '意大利', '西班牙', '荷兰', '波兰', '土耳其',
  '巴西', '墨西哥', '南非', '尼日利亚', '肯尼亚', '埃及', '沙特阿拉伯', '阿联酋',
  '印度', '巴基斯坦', '孟加拉', '越南', '泰国', '印度尼西亚', '菲律宾', '马来西亚',
  '澳大利亚', '日本', '韩国', '加拿大', '俄罗斯', '其他'
];

const channels = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({ value, label }));

const inputCls = 'px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition';

export default function SeaPoolPage() {
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [channel, setChannel] = useState('');
  const [level, setLevel] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', '20');
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (channel) params.set('channel', channel);
    if (level) params.set('level', level);

    const res = await fetch(`/api/sea-pool?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, country, channel, level]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function triggerCheck() {
    setMessage({ type: 'info', text: '正在检查…' });
    const res = await fetch('/api/sea-pool/check', { method: 'POST' });
    const json = await res.json();
    if (json.fell > 0) {
      setMessage({ type: 'success', text: `本次 ${json.fell} 个客户掉入公海：${json.details.map((d: { name: string }) => d.name).join('、')}` });
    } else {
      setMessage({ type: 'success', text: '没有需要掉入公海的客户' });
    }
    fetchData();
    setTimeout(() => setMessage(null), 5000);
  }

  async function claimCustomer(customerId: number) {
    setClaiming(customerId);
    const res = await fetch('/api/sea-pool/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const json = await res.json();
    if (json.success) {
      setMessage({ type: 'success', text: '领取成功！已分配给你' });
      fetchData();
    } else {
      setMessage({ type: 'error', text: json.error || '领取失败' });
    }
    setClaiming(null);
    setTimeout(() => setMessage(null), 3000);
  }

  function daysSince(dateStr: string | null): string {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '1天前';
    return `${days}天前`;
  }

  const statCards = data ? [
    { label: '公海总数', value: data.stats.total, color: 'text-[#0A2540]', iconBg: 'bg-slate-100 text-[#0A2540]', icon: 'sea' },
    { label: '近7天掉入', value: data.stats.weekFell, color: 'text-[#FF6B35]', iconBg: 'bg-orange-50 text-[#FF6B35]', icon: 'warning' },
    { label: '今日被领取', value: data.stats.todayClaimed, color: 'text-emerald-600', iconBg: 'bg-emerald-50 text-emerald-500', icon: 'check' },
  ] : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0A2540]">公海客户</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            无人负责的客户将自动进入公海，业务员可自由领取
          </p>
        </div>
        <button onClick={triggerCheck}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] transition cursor-pointer shadow-sm">
          <Icon name="search" className="w-4 h-4" />立即检查掉公海
        </button>
      </div>

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                <Icon name={card.icon} className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-2xl font-bold leading-tight ${card.color}`}>{card.value}</div>
                <div className="text-xs text-slate-400">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
          message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' :
          'bg-slate-50 border border-slate-200 text-slate-600'
        }`}>
          <Icon name={message.type === 'success' ? 'check' : message.type === 'error' ? 'warning' : 'clock'} className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="搜索联系人、公司、邮箱…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              onKeyDown={e => { if (e.key === 'Enter') fetchData(); }}
              className={`w-full pl-9 ${inputCls}`}
            />
          </div>
          <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">全部国家</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">全部渠道</option>
            {channels.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} className={inputCls}>
            <option value="">全部等级</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
            <option value="D">D级</option>
          </select>
        </div>
      </div>

      {/* 客户表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">联系人</th>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">公司</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">国家</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">渠道</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">等级</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">掉入时间</th>
                <th className="text-center px-3 py-3 font-medium text-slate-500 text-xs">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-slate-400">加载中…</td></tr>
              ) : data && data.data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <Icon name="sea" className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <div className="text-slate-400">公海暂无客户</div>
                </td></tr>
              ) : (
                data?.data.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-[#0A2540] hover:text-[#FF6B35] transition">
                        {c.contact_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {c.company_name || '-'}
                    </td>
                    <td className="px-2 py-3 text-slate-500 text-[13px]">
                      {c.country || '-'}
                    </td>
                    <td className="px-2 py-3">
                      {c.source_channel ? (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {CHANNEL_LABELS[c.source_channel] || c.source_channel}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-3">
                      <span className={badgeClass(LEVEL_BADGE, c.customer_level)}>
                        <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[c.customer_level] || 'bg-slate-400'}`} />
                        {c.customer_level}级
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-400">
                      {daysSince(c.sea_pool_entered_at)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => claimCustomer(c.id)}
                        disabled={claiming === c.id}
                        className="px-4 py-1.5 bg-[#FF6B35] text-white text-xs font-medium rounded-lg hover:bg-[#e55a2b] disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed shadow-sm">
                        {claiming === c.id ? '领取中…' : '领取'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <span className="text-sm text-slate-400">共 {data.total} 条</span>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-white transition">
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-slate-400">{page} / {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-white transition">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
