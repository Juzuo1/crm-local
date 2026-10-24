'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import { LEVEL_LABELS, LEVEL_BADGE, LEVEL_DOT, STAGE_LABELS, CHANNEL_LABELS, badgeClass, avatarColor } from '@/lib/ui';

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

const channels = Object.entries(CHANNEL_LABELS).map(([value, label]) => ({ value, label }));
const levels = Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label }));
const stages = Object.entries(STAGE_LABELS).map(([value, label]) => ({ value, label }));

const inputCls = 'px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition';

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [channel, setChannel] = useState(searchParams.get('channel') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [stage, setStage] = useState(searchParams.get('stage') || '');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [assignedTo, setAssignedTo] = useState(searchParams.get('assignedTo') || '');
  const [createdAtFrom, setCreatedAtFrom] = useState(searchParams.get('createdAtFrom') || '');
  const [createdAtTo, setCreatedAtTo] = useState(searchParams.get('createdAtTo') || '');
  const [nextFollowupFrom, setNextFollowupFrom] = useState(searchParams.get('nextFollowupFrom') || '');
  const [nextFollowupTo, setNextFollowupTo] = useState(searchParams.get('nextFollowupTo') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
    if (stage) params.set('stage', stage);
    if (tag) params.set('tag', tag);
    if (assignedTo) params.set('assignedTo', assignedTo);
    if (createdAtFrom) params.set('createdAtFrom', createdAtFrom);
    if (createdAtTo) params.set('createdAtTo', createdAtTo);
    if (nextFollowupFrom) params.set('nextFollowupFrom', nextFollowupFrom);
    if (nextFollowupTo) params.set('nextFollowupTo', nextFollowupTo);
    if (segmentId) params.set('segment', segmentId);
    params.set('page', String(page));
    params.set('pageSize', '20');

    const res = await fetch(`/api/customers?${params.toString()}`);
    const json = await res.json();
    setData(json);
    if (json.segmentName) setSegmentName(json.segmentName);
    if (json.users) setUsers(json.users);
    setLoading(false);
  }, [search, country, channel, level, stage, tag, assignedTo, createdAtFrom, createdAtTo, nextFollowupFrom, nextFollowupTo, page, segmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearFilters = () => {
    setSearch(''); setCountry(''); setChannel(''); setLevel(''); setStage(''); setTag('');
    setAssignedTo(''); setCreatedAtFrom(''); setCreatedAtTo('');
    setNextFollowupFrom(''); setNextFollowupTo(''); setPage(1);
  };

  const clearSegment = () => {
    router.push('/customers');
  };

  const hasFilters = search || country || channel || level || stage || tag || assignedTo || createdAtFrom || createdAtTo || nextFollowupFrom || nextFollowupTo || !!segmentId;

  const advancedFilterCount = [stage, tag, assignedTo, createdAtFrom, createdAtTo, nextFollowupFrom, nextFollowupTo].filter(Boolean).length;

  async function changeStage(customerId: number, newStage: string) {
    await fetch(`/api/customers/${customerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchData();
  }

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
        <div>
          <h2 className="text-xl font-bold text-[#0A2540]">客户管理</h2>
          <p className="text-xs text-slate-400 mt-0.5">共 {data?.total ?? '-'} 个客户</p>
        </div>
        <Link href="/customers/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] transition shadow-sm">
          <Icon name="plus" className="w-4 h-4" /> 新增客户
        </Link>
      </div>

      {/* 客群横幅 */}
      {segmentName && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <Icon name="segments" className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-sm font-medium text-[#0A2540]">
            当前客群：{segmentName}
          </span>
          <span className="text-xs text-slate-400">（已自动筛选）</span>
          <button onClick={clearSegment}
            className="ml-auto text-sm text-[#FF6B35] hover:text-[#e55a2b] font-medium cursor-pointer">
            退出客群视图
          </button>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80">
        <div className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="搜索联系人、公司、邮箱、手机…"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                onKeyDown={e => { if (e.key === 'Enter') fetchData(); }}
                className={`w-full pl-9 ${inputCls}`}
              />
            </div>
            <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }}
              className={`${inputCls} max-w-[140px]`}>
              <option value="">全部国家</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={channel} onChange={e => { setChannel(e.target.value); setPage(1); }}
              className={`${inputCls} max-w-[130px]`}>
              <option value="">全部渠道</option>
              {channels.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }}
              className={`${inputCls} max-w-[130px]`}>
              <option value="">全部等级</option>
              {levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition cursor-pointer whitespace-nowrap ${showAdvanced ? 'bg-orange-50 border-[#FF6B35]/40 text-[#FF6B35]' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
              <span>更多筛选</span>
              {advancedFilterCount > 0 && (
                <span className="bg-[#FF6B35] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{advancedFilterCount}</span>
              )}
              <Icon name="chevron-down" className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer whitespace-nowrap">
                清除全部筛选
              </button>
            )}
          </div>
        </div>

        {/* 高级筛选面板 */}
        {showAdvanced && (
          <div className="border-t border-slate-100 px-4 py-4 bg-slate-50/60 rounded-b-xl space-y-3">
            <div className="flex flex-wrap gap-3">
              <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}
                className={`${inputCls} min-w-[130px]`}>
                <option value="">全部阶段</option>
                {stages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <input
                type="text"
                placeholder="标签筛选（如：VIP、锂电池）"
                value={tag}
                onChange={e => { setTag(e.target.value); setPage(1); }}
                onKeyDown={e => { if (e.key === 'Enter') fetchData(); }}
                className={`${inputCls} min-w-[180px]`}
              />
              <select value={assignedTo} onChange={e => { setAssignedTo(e.target.value); setPage(1); }}
                className={`${inputCls} min-w-[120px]`}>
                <option value="">全部负责人</option>
                <option value="0">未分配（公海）</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs text-slate-500 font-medium min-w-[60px]">建档时间</span>
              <input type="date" value={createdAtFrom}
                onChange={e => { setCreatedAtFrom(e.target.value); setPage(1); }}
                className={inputCls} />
              <span className="text-xs text-slate-400">至</span>
              <input type="date" value={createdAtTo}
                onChange={e => { setCreatedAtTo(e.target.value); setPage(1); }}
                className={inputCls} />

              <span className="text-xs text-slate-300 mx-2">|</span>

              <span className="text-xs text-slate-500 font-medium min-w-[60px]">下次跟进</span>
              <input type="date" value={nextFollowupFrom}
                onChange={e => { setNextFollowupFrom(e.target.value); setPage(1); }}
                className={inputCls} />
              <span className="text-xs text-slate-400">至</span>
              <input type="date" value={nextFollowupTo}
                onChange={e => { setNextFollowupTo(e.target.value); setPage(1); }}
                className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* 消息提示 */}
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
          <Icon name="check" className="w-4 h-4" />{message}
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#0A2540] rounded-xl px-4 py-3 shadow-lg shadow-[#0A2540]/10">
          <span className="text-sm font-medium text-white">
            已选择 {selectedIds.size} 个客户
          </span>
          <select value={batchAssignTo} onChange={e => setBatchAssignTo(e.target.value)}
            className="text-sm border border-white/20 rounded-lg px-2.5 py-1.5 bg-white/10 text-white cursor-pointer outline-none [&>option]:text-slate-800">
            <option value="">分配给…</option>
            <option value="">未分配（清空）</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button onClick={batchAssign} disabled={!batchAssignTo}
            className="px-3.5 py-1.5 bg-[#FF6B35] text-white text-sm font-medium rounded-lg hover:bg-[#e55a2b] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition">
            确认分配
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            className="px-3 py-1.5 text-sm text-slate-300 hover:text-white cursor-pointer ml-auto transition">
            取消选择
          </button>
        </div>
      )}

      {/* 表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80">
              <tr>
                <th className="w-10 px-2 py-3">
                  <input type="checkbox" onChange={toggleSelectAll}
                    checked={(data && data.data.length > 0 && selectedIds.size === data.data.length) || false}
                    className="rounded border-slate-300 cursor-pointer accent-[#FF6B35]" />
                </th>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">联系人</th>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">公司</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">国家</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">渠道</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">等级</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">阶段</th>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">负责人</th>
                <th className="text-left px-2 py-3 font-medium text-slate-500 text-xs">建档时间</th>
                <th className="text-left px-3 py-3 font-medium text-slate-500 text-xs">下次跟进</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16 text-slate-400">加载中…</td></tr>
              ) : data && data.data.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16">
                  <Icon name="users" className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <div className="text-slate-400">暂无客户数据</div>
                </td></tr>
              ) : (
                data?.data.map(c => {
                  const isSelected = selectedIds.has(c.id);
                  const isOverdue = c.next_followup_at && new Date(c.next_followup_at) < new Date();

                  return (
                    <tr key={c.id} className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-orange-50/50' : ''} ${isOverdue ? 'bg-red-50/40' : ''}`}>
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={isSelected}
                          onChange={() => toggleSelect(c.id)}
                          className="rounded border-slate-300 cursor-pointer accent-[#FF6B35]" />
                      </td>
                      <td className="px-3 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full ${avatarColor(c.contact_name || '?')} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                            {(c.contact_name || '?').slice(0, 1)}
                          </div>
                          <span className="font-medium text-[#0A2540]">{c.contact_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.company_name || '-'}
                      </td>
                      <td className="px-2 py-3 text-slate-500 text-[13px] cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.country || '-'}
                      </td>
                      <td className="px-2 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.source_channel ? (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                            {CHANNEL_LABELS[c.source_channel] || c.source_channel}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-2 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        <span className={badgeClass(LEVEL_BADGE, c.customer_level)}>
                          <span className={`w-1.5 h-1.5 rounded-full ${LEVEL_DOT[c.customer_level] || 'bg-slate-400'}`} />
                          {c.customer_level}级
                        </span>
                      </td>
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={c.stage || 'new_lead'}
                          onChange={e => changeStage(c.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-1.5 py-1 bg-white cursor-pointer hover:border-[#FF6B35]/50 outline-none max-w-[96px] transition">
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
                            className="text-xs border border-slate-200 rounded-lg px-1.5 py-1 bg-white cursor-pointer hover:border-[#FF6B35]/50 outline-none max-w-[96px] transition">
                            <option value="">未分配</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`text-xs ${c.assigned_user_name === '未分配' ? 'text-[#FF6B35]' : 'text-slate-600'}`}>
                            {c.assigned_user_name}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-400 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.created_at?.slice(0, 10) || '-'}
                      </td>
                      <td className="px-3 py-3 cursor-pointer" onClick={() => router.push(`/customers/${c.id}`)}>
                        {c.next_followup_at ? (
                          isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                              <Icon name="warning" className="w-3.5 h-3.5" />逾期
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">{c.next_followup_at.slice(0, 10)}</span>
                          )
                        ) : <span className="text-xs text-slate-300">-</span>}
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/60">
            <span className="text-sm text-slate-400">共 {data.total} 条</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1 text-sm border border-slate-200 rounded-lg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-white transition">
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
                    className={`px-3 py-1 text-sm border rounded-lg cursor-pointer transition ${p === page ? 'bg-[#0A2540] text-white border-[#0A2540]' : 'border-slate-200 hover:bg-white'}`}>
                    {p}
                  </button>
                );
              })}
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
