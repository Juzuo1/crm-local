'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDateTime } from '@/lib/utils';

interface AuditItem {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id: number;
  target_name: string;
  detail: string;
  created_at: string;
}

interface ListData {
  data: AuditItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  users: { id: number; name: string }[];
  actionTypes: { value: string; label: string }[];
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  customer: '客户',
  followup: '跟进',
  user: '用户',
  department: '部门',
};

const ACTION_COLORS: Record<string, string> = {
  'customer.create': 'bg-green-100 text-green-800',
  'customer.update': 'bg-blue-100 text-blue-800',
  'customer.delete': 'bg-red-100 text-red-800',
  'customer.assign': 'bg-purple-100 text-purple-800',
  'followup.create': 'bg-teal-100 text-teal-800',
  'user.create': 'bg-green-100 text-green-800',
  'user.update': 'bg-blue-100 text-blue-800',
  'user.reset_pwd': 'bg-yellow-100 text-yellow-800',
  'user.toggle': 'bg-orange-100 text-orange-800',
  'user.transfer': 'bg-purple-100 text-purple-800',
  'department.create': 'bg-green-100 text-green-800',
  'department.update': 'bg-blue-100 text-blue-800',
  'department.delete': 'bg-red-100 text-red-800',
  'department.add_member': 'bg-teal-100 text-teal-800',
  'department.remove_member': 'bg-orange-100 text-orange-800',
  'customer.sea_fall': 'bg-yellow-100 text-yellow-800',
  'customer.sea_push': 'bg-orange-100 text-orange-800',
  'customer.sea_claim': 'bg-green-100 text-green-800',
};

export default function AuditLogsPage() {
  const [data, setData] = useState<ListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterDays, setFilterDays] = useState(7);
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', '30');
    if (filterDays > 0) params.set('days', String(filterDays));
    if (filterAction) params.set('action', filterAction);
    if (filterUser) params.set('userId', filterUser);
    if (search) params.set('search', search);

    const res = await fetch(`/api/audit-logs?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, filterDays, filterAction, filterUser, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 切换筛选条件时重置页码
  function changeFilterDays(days: number) {
    setFilterDays(days);
    setPage(1);
  }
  function changeFilterAction(action: string) {
    setFilterAction(action);
    setPage(1);
  }
  function changeFilterUser(userId: string) {
    setFilterUser(userId);
    setPage(1);
  }
  function doSearch() {
    setPage(1);
    fetchData();
  }

  // 解析 detail JSON
  function parseDetail(detailJson: string): Record<string, unknown> {
    try { return JSON.parse(detailJson); } catch { return {}; }
  }

  // 渲染 detail 为可读文本
  function renderDetail(item: AuditItem): React.ReactNode {
    const d = parseDetail(item.detail);
    const entries = Object.entries(d);

    if (item.action === 'customer.update' || item.action === 'user.update') {
      return (
        <div className="space-y-1">
          {entries.map(([key, val]) => {
            if (typeof val === 'object' && val !== null) {
              const change = val as { from: unknown; to: unknown };
              return (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 w-16 shrink-0">{key}</span>
                  <span className="text-red-500 line-through">{String(change.from || '(空)')}</span>
                  <span className="text-gray-300">→</span>
                  <span className="text-green-600 font-medium">{String(change.to || '(空)')}</span>
                </div>
              );
            }
            return (
              <div key={key} className="text-xs text-gray-600">
                <span className="text-gray-400">{key}: </span>
                {String(val)}
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="text-xs text-gray-600 space-y-0.5">
        {entries.map(([key, val]) => {
          let displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
          if (displayVal.length > 60) displayVal = displayVal.slice(0, 60) + '...';
          return (
            <div key={key}>
              <span className="text-gray-400">{key}: </span>
              {displayVal}
            </div>
          );
        })}
        {entries.length === 0 && <span className="text-gray-400">-</span>}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-gray-900">📜 操作日志</h2>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* 时间快捷按钮 */}
          <div className="flex items-center gap-1">
            {[
              { days: 1, label: '今天' },
              { days: 3, label: '近3天' },
              { days: 7, label: '近7天' },
              { days: 30, label: '近30天' },
              { days: 0, label: '全部' },
            ].map(opt => (
              <button key={opt.days}
                onClick={() => changeFilterDays(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterDays === opt.days
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-200" />

          {/* 操作类型 */}
          <select value={filterAction} onChange={e => changeFilterAction(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700">
            <option value="">全部操作</option>
            {data?.actionTypes.map(a => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>

          {/* 操作人 */}
          <select value={filterUser} onChange={e => changeFilterUser(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700">
            <option value="">全部操作人</option>
            {data?.users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* 搜索 */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            placeholder="搜索目标或操作人..."
            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 w-40" />
        </div>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">加载中...</div>
        ) : !data || data.data.length === 0 ? (
          <div className="py-16 text-center text-gray-400">暂无操作记录</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">时间</th>
                  <th className="px-4 py-3 font-medium">操作人</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                  <th className="px-4 py-3 font-medium">目标</th>
                  <th className="px-4 py-3 font-medium">详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.data.map(item => {
                  const isExpanded = expandedRow === item.id;
                  return (
                    <>
                      <tr key={item.id}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition ${isExpanded ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(item.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.user_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[item.action] || 'bg-gray-100 text-gray-700'}`}>
                            {data.actionTypes.find(a => a.value === item.action)?.label || item.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{item.target_name}</span>
                          <span className="text-xs text-gray-400 ml-1.5">
                            {TARGET_TYPE_LABELS[item.target_type] || item.target_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400">
                            {isExpanded ? '▲ 收起' : '▼ 展开'}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${item.id}-detail`}>
                          <td colSpan={5} className="px-4 py-3 bg-gray-50/50">
                            {renderDetail(item)}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            {/* 分页 */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                <span>共 {data.total} 条记录</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100">
                    上一页
                  </button>
                  <span className="px-2">{page} / {data.totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                    className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100">
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
