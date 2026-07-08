'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

const channels = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'alibaba', label: '阿里国际站' },
  { value: 'website', label: '独立站' },
  { value: 'exhibition', label: '展会' },
  { value: 'referral', label: '转介绍' },
  { value: 'other', label: '其他' },
];

const channelLabels: Record<string, string> = Object.fromEntries(channels.map(c => [c.value, c.label]));

export default function SeaPoolPage() {
  const router = useRouter();

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [channel, setChannel] = useState('');
  const [level, setLevel] = useState('');
  const [message, setMessage] = useState('');
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

  // 触发掉公海检查
  async function triggerCheck() {
    setMessage('正在检查...');
    const res = await fetch('/api/sea-pool/check', { method: 'POST' });
    const json = await res.json();
    if (json.fell > 0) {
      setMessage(`✅ 本次 ${json.fell} 个客户掉入公海：${json.details.map((d: { name: string }) => d.name).join('、')}`);
    } else {
      setMessage('✅ 没有需要掉入公海的客户');
    }
    fetchData();
    setTimeout(() => setMessage(''), 5000);
  }

  // 领取客户
  async function claimCustomer(customerId: number) {
    setClaiming(customerId);
    const res = await fetch('/api/sea-pool/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId }),
    });
    const json = await res.json();
    if (json.success) {
      setMessage('✅ 领取成功！');
      fetchData();
    } else {
      setMessage(`❌ ${json.error || '领取失败'}`);
    }
    setClaiming(null);
    setTimeout(() => setMessage(''), 3000);
  }

  // 天数计算
  function daysSince(dateStr: string | null): string {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '今天';
    if (days === 1) return '1天前';
    return `${days}天前`;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🌊 公海客户</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            无人负责的客户将自动进入公海，业务员可自由领取
          </p>
        </div>
        <button onClick={triggerCheck}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer">
          🔍 立即检查掉公海
        </button>
      </div>

      {/* 统计卡片 */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-blue-600">{data.stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">公海总数</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-orange-600">{data.stats.weekFell}</div>
            <div className="text-xs text-gray-500 mt-1">近7天掉入</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl font-bold text-green-600">{data.stats.todayClaimed}</div>
            <div className="text-xs text-gray-500 mt-1">今日被领</div>
          </div>
        </div>
      )}

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
          message.startsWith('❌') ? 'bg-red-50 border border-red-200 text-red-700' :
          'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="搜索联系人、公司、邮箱..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            onKeyDown={e => { if (e.key === 'Enter') fetchData(); }}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部国家</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部渠道</option>
            {channels.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">全部等级</option>
            <option value="A">A级</option>
            <option value="B">B级</option>
            <option value="C">C级</option>
            <option value="D">D级</option>
          </select>
        </div>
      </div>

      {/* 客户表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-gray-600">联系人</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">公司</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">国家</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">渠道</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">等级</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">掉入时间</th>
                <th className="text-center px-3 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">加载中...</td></tr>
              ) : data && data.data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  🎉 公海暂无客户
                </td></tr>
              ) : (
                data?.data.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-3 py-3">
                      <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                        {c.contact_name}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {c.company_name || '-'}
                    </td>
                    <td className="px-2 py-3 text-gray-600 text-sm">
                      {c.country || '-'}
                    </td>
                    <td className="px-2 py-3">
                      {c.source_channel ? (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {channelLabels[c.source_channel] || c.source_channel}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-3">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        c.customer_level === 'A' ? 'bg-green-100 text-green-800' :
                        c.customer_level === 'B' ? 'bg-blue-100 text-blue-800' :
                        c.customer_level === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {c.customer_level}级
                      </span>
                    </td>
                    <td className="px-2 py-3 text-xs text-gray-500">
                      {daysSince(c.sea_pool_entered_at)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => claimCustomer(c.id)}
                        disabled={claiming === c.id}
                        className="px-4 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:bg-green-300 transition cursor-pointer disabled:cursor-not-allowed">
                        {claiming === c.id ? '领取中...' : '领取'}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-sm text-gray-500">共 {data.total} 条</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-100">
                上一页
              </button>
              <span className="px-3 py-1 text-sm text-gray-500">{page} / {data.totalPages}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-gray-100">
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
