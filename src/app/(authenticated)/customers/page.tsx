'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Customer {
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
  next_followup_at: string;
  last_followup_at: string;
  created_at: string;
  assigned_to: number | null;
  assigned_user_name: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ListData {
  data: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  segmentName?: string;
  users: UserItem[];
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

const levels = [
  { value: 'A', label: 'A级 - 高价值', color: 'bg-green-100 text-green-800' },
  { value: 'B', label: 'B级 - 意向强', color: 'bg-blue-100 text-blue-800' },
  { value: 'C', label: 'C级 - 待培育', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'D', label: 'D级 - 无效', color: 'bg-red-100 text-red-800' },
];

const stages = [
  { value: 'new_lead', label: '新线索', color: 'bg-gray-100 text-gray-700' },
  { value: 'initial_contact', label: '初步联系', color: 'bg-blue-100 text-blue-700' },
  { value: 'needs_confirmed', label: '需求确认', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'quoted', label: '已报价', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'sample_testing', label: '样品测试', color: 'bg-orange-100 text-orange-700' },
  { value: 'negotiation', label: '商务谈判', color: 'bg-purple-100 text-purple-700' },
  { value: 'order_confirmed', label: '确认订单', color: 'bg-green-100 text-green-700' },
  { value: 'production_shipping', label: '生产发货', color: 'bg-teal-100 text-teal-700' },
  { value: 'completed', label: '已成交客户', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lost', label: '已流失', color: 'bg-red-100 text-red-700' },
];

const channelLabels: Record<string, string> = Object.fromEntries(channels.map(c => [c.value, c.label]));

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [channel, setChannel] = useState(searchParams.get('channel') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [segmentName, setSegmentName] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchAssignTo, setBatchAssignTo] = useState('');
  const [message, setMessage] = useState('');

  const segmentId = searchParams.get('segment');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (channel) params.set('channel', channel);
    if (level) params.set('level', level);
    if (segmentId) params.set('segment', segmentId);
    params.set('page', String(page));
    params.set('pageSize', '20');

    const res = await fetch(`/api/customers?${params.toString()}`);
    const json = await res.json();
    setData(json);
    if (json.segmentName) setSegmentName(json.segmentName);
    if (json.users) setUsers(json.users);
    setLoading(false);
  }, [search, country, channel, level, page, segmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 清除所有筛选
  const clearFilters = () => {
    setSearch('');
    setCountry('');
    setChannel('');
    setLevel('');
    setPage(1);
  };

  const clearSegment = () => {
    router.push('/customers');
  };

  const hasFilters = search || country || channel || level || !!segmentId;

  // 快速切换阶段
  async function changeStage(customerId: number, newStage: string) {
    await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchData();
  }

  // 单条分配
  async function assignCustomer(customerId: number, newAssignedTo: string) {
    const res = await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: newAssignedTo ? parseInt(newAssignedTo) : null }),
    });
    if (res.ok) {
      fetchData();
      setMessage('已分配');
      setTimeout(() => setMessage(''), 2000);
    }
  }

  // 批量分配
  async function batchAssign() {
    if (selectedIds.size === 0 || !batchAssignTo) return;
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_ids: Array.from(selectedIds),
        assigned_to: parseInt(batchAssignTo),
      }),
    });
    if (res.ok) {
      setSelectedIds(new Set());
      setBatchAssignTo('');
      fetchData();
      setMessage(`已分配 ${selectedIds.size} 个客户`);
      setTimeout(() => setMessage(''), 3000);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (!data) return;
    if (selectedIds.size === data.data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.data.map(c => c.id)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">客户管理</h2>
        <Link href="/customers/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
          + 新增客户
        </Link>
      </div>

      {/* 客群横幅 */}
      {segmentName && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-blue-600">📋</span>
          <span className="text-sm font-medium text-blue-800">
            当前客群：{segmentName}
          </span>
          <span className="text-xs text-blue-500">（已自动筛选）</span>
          <button onClick={clearSegment}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer">
            退出客群视图
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="搜索联系人、公司、邮箱、手机..."
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
            {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-blue-800">
            已选择 {selectedIds.size} 个客户
          </span>
          <select value={batchAssignTo} onChange={e => setBatchAssignTo(e.target.value)}
            className="text-sm border border-blue-300 rounded px-2 py-1.5 bg-white cursor-pointer outline-none">
            <option value="">分配给...</option>
            <option value="">未分配（清空）</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button onClick={batchAssign} disabled={!batchAssignTo}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer disabled:cursor-not-allowed">
            确认分配
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-sm text-blue-600 hover:underline cursor-pointer ml-auto">
            取消选择
          </button>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="w-10 px-2 py-3">
                  <input type="checkbox" onChange={toggleSelectAll}
                    checked={(data && data.data.length > 0 && selectedIds.size === data.data.length) || false}
                    className="rounded border-gray-300 cursor-pointer" />
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">联系人</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">公司</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">国家</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">渠道</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">等级</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">阶段</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">负责人</th>
                <th className="text-left px-2 py-3 font-medium text-gray-600">建档时间</th>
                <th className="text-left px-3 py-3 font-medium text-gray-600">下次跟进</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">加载中...</td></tr>
              ) : data && data.data.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">暂无客户数据</td></tr>
              ) : (
                data?.data.map(c => {
                  const isSelected = selectedIds.has(c.id);
                  const isOverdue = c.next_followup_at && new Date(c.next_followup_at) < new Date();

                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition ${isSelected ? 'bg-blue-50' : ''} ${isOverdue ? 'border-l-2 border-l-red-400 bg-red-50/30' : ''}`}>
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-gray-300 cursor-pointer" />
                      </td>
                      <td className="px-3 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        <span className="font-medium text-gray-900">{c.contact_name}</span>
                      </td>
                      <td className="px-3 py-3 text-gray-600 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.company_name || '-'}
                      </td>
                      <td className="px-2 py-3 text-gray-600 text-sm cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.country || '-'}
                      </td>
                      <td className="px-2 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.source_channel ? (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                            {channelLabels[c.source_channel] || c.source_channel}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${c.customer_level === 'A' ? 'bg-green-100 text-green-800' : c.customer_level === 'B' ? 'bg-blue-100 text-blue-800' : c.customer_level === 'C' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {c.customer_level}级
                        </span>
                      </td>
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.stage || 'new_lead'}
                          onChange={e => changeStage(c.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white cursor-pointer hover:border-blue-300 outline-none max-w-[90px]">
                          {stages.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        {users.length > 0 ? (
                          <select
                            value={c.assigned_to || ''}
                            onChange={e => assignCustomer(c.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white cursor-pointer hover:border-blue-300 focus:ring-1 focus:ring-blue-500 outline-none max-w-[90px]">
                            <option value="">未分配</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs ${c.assigned_user_name === '未分配' ? 'text-orange-400' : 'text-gray-600'}`}>
                            {c.assigned_user_name}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-400 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.created_at?.slice(0, 10) || '-'}
                      </td>
                      <td className="px-3 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.next_followup_at ? (
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {isOverdue ? '⚠ ' : ''}{c.next_followup_at.slice(0, 10)}
                          </span>
                        ) : <span className="text-xs text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })
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
              {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                let p: number;
                if (data.totalPages <= 7) {
                  p = i + 1;
                } else if (page <= 4) {
                  p = i + 1;
                } else if (page >= data.totalPages - 3) {
                  p = data.totalPages - 6 + i;
                } else {
                  p = page - 3 + i;
                }
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 text-sm border rounded cursor-pointer ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}`}>
                    {p}
                  </button>
                );
              })}
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
