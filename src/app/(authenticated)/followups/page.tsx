'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import { CHANNEL_LABELS, METHOD_LABELS } from '@/lib/ui';

interface FollowupItem {
  id: number;
  customer_id: number;
  user_id: number;
  user_name: string;
  customer_name: string;
  company_name: string;
  customer_phone: string;
  customer_email: string;
  customer_channel: string;
  method: string;
  content: string;
  next_followup_at: string | null;
  created_at: string;
}

interface ListData {
  data: FollowupItem[];
  total: number;
  page: number;
  totalPages: number;
  users: { id: number; name: string; role: string }[];
}

const METHOD_ICON: Record<string, string> = {
  phone: 'phone', whatsapp: 'chat', email: 'mail', wechat: 'chat', meeting: 'users',
};

const selectCls = 'px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition';

export default function FollowupsPage() {
  const router = useRouter();
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('');
  const [method, setMethod] = useState('');
  const [days, setDays] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (channel) params.set('channel', channel);
    if (method) params.set('method', method);
    if (days) params.set('days', days);
    if (filterUser) params.set('user', filterUser);
    params.set('page', String(page));
    params.set('pageSize', '30');

    const res = await fetch(`/api/followups?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [search, channel, method, days, filterUser, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const hasFilters = search || channel || method || days || filterUser;
  const clearFilters = () => {
    setSearch(''); setChannel(''); setMethod(''); setDays(''); setFilterUser(''); setPage(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0A2540]">跟进记录</h2>
          {data && <p className="text-xs text-slate-400 mt-0.5">共 {data.total} 条</p>}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="relative">
          <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="搜索客户姓名、公司、邮箱、电话…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">全部渠道</option>
            {Object.entries(CHANNEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select value={method} onChange={e => { setMethod(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">全部方式</option>
            {Object.entries(METHOD_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <select value={days} onChange={e => { setDays(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">全部时间</option>
            <option value="1">今天</option>
            <option value="3">近3天</option>
            <option value="7">近7天</option>
            <option value="15">近15天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>

          {data && data.users && data.users.length > 0 && (
            <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }} className={selectCls}>
              <option value="">全部人员</option>
              {data.users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer whitespace-nowrap transition">
              清除全部筛选
            </button>
          )}
        </div>
      </div>

      {/* 时间线 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">加载中…</div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Icon name="chat" className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p>{hasFilters ? '没有匹配的跟进记录' : '暂无跟进记录'}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {data.data.map((f, i) => (
              <div key={f.id} className="flex gap-4 pb-5 relative">
                {i < data.data.length - 1 && (
                  <div className="absolute left-[17px] top-10 bottom-0 w-px bg-slate-200" />
                )}
                <div className="shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center z-10 ring-4 ring-white">
                  <Icon name={METHOD_ICON[f.method] || 'chat'} className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-[#0A2540] cursor-pointer hover:text-[#FF6B35] transition"
                      onClick={() => router.push(`/customers/${f.customer_id}`)}>
                      {f.customer_name}
                    </span>
                    {f.company_name && <span className="text-xs text-slate-400">{f.company_name}</span>}
                    {f.customer_channel && (
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">
                        {CHANNEL_LABELS[f.customer_channel] || f.customer_channel}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{METHOD_LABELS[f.method] || f.method}</span>
                    <span className="text-xs text-slate-400">{f.user_name}</span>
                    <span className="text-xs text-slate-400 ml-auto">{f.created_at?.slice(0, 16)}</span>
                  </div>
                  {(f.customer_phone || f.customer_email) && (
                    <div className="text-xs text-slate-400 mb-1">
                      {[f.customer_phone, f.customer_email].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{f.content}</p>
                  {f.next_followup_at && (
                    <p className="text-xs text-[#FF6B35] mt-1.5 inline-flex items-center gap-1">
                      <Icon name="calendar" className="w-3.5 h-3.5" />下次跟进：{f.next_followup_at.slice(0, 16)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
            <span className="text-sm text-slate-400">共 {data.total} 条</span>
            <div className="flex gap-1 items-center">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-white transition">上一页</button>
              <span className="px-3 py-1 text-sm text-slate-400">{page} / {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-30 cursor-pointer hover:bg-white transition">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
