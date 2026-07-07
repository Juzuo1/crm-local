'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

const methodLabels: Record<string, string> = {
  phone: '📞 电话', whatsapp: '💬 WhatsApp', email: '📧 邮件',
  wechat: '🟢 微信', meeting: '🤝 见面'
};

const channelLabels: Record<string, string> = {
  facebook: 'Facebook', tiktok: 'TikTok', alibaba: '阿里国际站',
  website: '独立站', exhibition: '展会', referral: '转介绍', other: '其他'
};

export default function FollowupsPage() {
  const router = useRouter();
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);

  // 筛选条件
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
        <h2 className="text-xl font-bold text-gray-900">跟进记录</h2>
        {data && <span className="text-sm text-gray-400">共 {data.total} 条</span>}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        {/* 搜索框 */}
        <input
          type="text"
          placeholder="搜索客户姓名、公司、邮箱、电话..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {/* 下拉筛选 */}
        <div className="flex flex-wrap gap-2">
          {/* 渠道 */}
          <select value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部渠道</option>
            {Object.entries(channelLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* 跟进方式 */}
          <select value={method} onChange={e => { setMethod(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部方式</option>
            {Object.entries(methodLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* 时间范围 */}
          <select value={days} onChange={e => { setDays(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部时间</option>
            <option value="1">今天</option>
            <option value="3">近3天</option>
            <option value="7">近7天</option>
            <option value="15">近15天</option>
            <option value="30">近30天</option>
            <option value="90">近90天</option>
          </select>

          {/* 跟进人（管理员可见） */}
          {data && data.users && data.users.length > 0 && (
            <select value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">全部人员</option>
              {data.users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {/* 清除 */}
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer whitespace-nowrap">
              清除全部筛选
            </button>
          )}
        </div>
      </div>

      {/* 时间线 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📝</p>
            <p>{hasFilters ? '没有匹配的跟进记录' : '暂无跟进记录'}</p>
          </div>
        ) : (
          <div className="space-y-0">
            {data.data.map((f, i) => (
              <div key={f.id} className="flex gap-4 pb-5 relative">
                {i < data.data.length - 1 && (
                  <div className="absolute left-[17px] top-10 bottom-0 w-0.5 bg-gray-100" />
                )}
                <div className="shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm z-10">
                  {methodLabels[f.method]?.split(' ')[0] || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium text-blue-700 cursor-pointer hover:underline"
                      onClick={() => router.push(`/customers/${f.customer_id}`)}>
                      {f.customer_name}
                    </span>
                    {f.company_name && <span className="text-xs text-gray-400">{f.company_name}</span>}
                    {f.customer_channel && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        {channelLabels[f.customer_channel] || f.customer_channel}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">{methodLabels[f.method] || f.method}</span>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-400">{f.user_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{f.created_at?.slice(0, 16)}</span>
                  </div>
                  {f.customer_phone && (
                    <div className="text-xs text-gray-400 mb-1">
                      📱 {f.customer_phone}{f.customer_email ? ` · ✉️ ${f.customer_email}` : ''}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{f.content}</p>
                  {f.next_followup_at && (
                    <p className="text-xs text-blue-500 mt-1">
                      📅 下次跟进: {f.next_followup_at.slice(0, 16)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
            <span className="text-sm text-gray-500">共 {data.total} 条</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30 cursor-pointer hover:bg-gray-100">上一页</button>
              <span className="px-3 py-1 text-sm text-gray-500">{page}/{data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30 cursor-pointer hover:bg-gray-100">下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
