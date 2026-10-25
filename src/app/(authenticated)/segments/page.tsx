'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';

interface SegmentWithCount {
  id: number;
  name: string;
  type: 'system' | 'custom';
  filters: Record<string, unknown>;
  customerCount: number;
  created_at: string;
}

interface Customer {
  id: number;
  contact_name: string;
  company_name: string;
  country: string;
  source_channel: string;
  customer_level: string;
  phone: string;
  email: string;
  next_followup_at: string;
  created_at: string;
}

const channelLabels: Record<string, string> = {
  facebook: 'Facebook', tiktok: 'TikTok', alibaba: '阿里国际站',
  website: '独立站', exhibition: '展会', referral: '转介绍', other: '其他'
};

const levelColors: Record<string, string> = {
  A: 'bg-green-100 text-green-800', B: 'bg-orange-100 text-orange-800',
  C: 'bg-yellow-100 text-yellow-800', D: 'bg-red-100 text-red-800'
};

const segmentGroups = [
  { key: 'channel', title: '按渠道', icon: 'megaphone' },
  { key: 'level', title: '按客户等级', icon: 'star' },
  { key: 'time', title: '按建档时间', icon: 'clock' },
  { key: 'followup', title: '跟进相关', icon: 'calendar' },
  { key: 'combo', title: '组合客群', icon: 'shuffle' },
  { key: 'custom', title: '自定义客群', icon: 'pencil' },
];

function classifySegment(seg: SegmentWithCount): string {
  const n = seg.name;
  if (n.includes('Facebook') || n.includes('TikTok') || n.includes('阿里') || n.includes('独立站') || n.includes('展会')) return 'channel';
  if (n.includes('A级') || n.includes('B级') || n.includes('C级') || n.includes('D级')) return 'level';
  if (n.includes('近') && n.includes('天新增')) return 'time';
  if (n.includes('跟进') || n.includes('未跟进')) return 'followup';
  if (seg.type === 'custom') return 'custom';
  return 'combo';
}

export default function SegmentsPage() {
  const router = useRouter();
  const [segments, setSegments] = useState<SegmentWithCount[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // 创建自定义客群
  const [showCreate, setShowCreate] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customChannels, setCustomChannels] = useState<string[]>([]);
  const [customLevels, setCustomLevels] = useState<string[]>([]);
  const [customCreatedDays, setCustomCreatedDays] = useState('');

  // 折叠分组
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/segments')
      .then(r => r.json())
      .then(data => {
        setSegments(data.segments || []);
        setCanCreate(data.canCreate || false);
      })
      .finally(() => setLoading(false));
  }, []);

  async function selectSegment(seg: SegmentWithCount) {
    setSelectedId(seg.id);
    setSelectedName(seg.name);
    setCustomersLoading(true);
    const res = await fetch(`/api/customers?segment=${seg.id}&pageSize=100`);
    const json = await res.json();
    setCustomers(json.data || []);
    setCustomersLoading(false);
  }

  async function createSegment() {
    if (!customName.trim()) return;
    const filters: Record<string, unknown> = {};
    if (customChannels.length > 0) filters.channels = customChannels;
    if (customLevels.length > 0) filters.levels = customLevels;
    if (customCreatedDays) filters.createdWithinDays = parseInt(customCreatedDays);

    const res = await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: customName, filters }),
    });
    if (res.ok) {
      setShowCreate(false);
      setCustomName('');
      setCustomChannels([]);
      setCustomLevels([]);
      setCustomCreatedDays('');
      const r = await fetch('/api/segments');
      const d = await r.json();
      setSegments(d.segments || []);
    }
  }

  async function deleteCustomSegment(id: number) {
    await fetch(`/api/segments?id=${id}`, { method: 'DELETE' });
    setSegments(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setCustomers([]);
    }
  }

  const toggleItem = (list: string[], setter: (v: string[]) => void, item: string) => {
    if (list.includes(item)) setter(list.filter(i => i !== item));
    else setter([...list, item]);
  };

  const toggleCollapse = (key: string) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;

  return (
    <div className="flex h-full -m-6">
      {/* 左侧客群导航 */}
      <div className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        {/* 头部 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">客群管理</h2>
            {canCreate && (
              <button onClick={() => setShowCreate(!showCreate)}
                className="text-xs text-[#FF6B35] hover:text-[#e55a2b] cursor-pointer">
                {showCreate ? '取消' : '+ 新建'}
              </button>
            )}
          </div>
          {/* 全部客户入口 */}
          <button
            onClick={() => { setSelectedId(null); setSelectedName(''); setCustomers([]); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
              !selectedId ? 'bg-orange-50 text-[#0A2540] font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <Icon name="list" className="w-4 h-4" /> 全部客户
          </button>
        </div>

        {/* 创建自定义客群表单 */}
        {showCreate && (
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 space-y-3">
            <input value={customName} onChange={e => setCustomName(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm outline-none focus:ring-1 focus:ring-[#FF6B35]/40"
              placeholder="客群名称" />

            <div className="flex flex-wrap gap-1">
              {Object.entries(channelLabels).map(([k, v]) => (
                <button key={k} onClick={() => toggleItem(customChannels, setCustomChannels, k)}
                  className={`px-2 py-0.5 text-xs rounded border cursor-pointer ${
                    customChannels.includes(k) ? 'bg-[#0A2540] text-white border-[#0A2540]' : 'bg-white text-gray-600 border-gray-300'
                  }`}>{v}</button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {['A', 'B', 'C', 'D'].map(l => (
                <button key={l} onClick={() => toggleItem(customLevels, setCustomLevels, l)}
                  className={`px-2 py-0.5 text-xs rounded border cursor-pointer ${
                    customLevels.includes(l) ? 'bg-[#0A2540] text-white border-[#0A2540]' : 'bg-white text-gray-600 border-gray-300'
                  }`}>{l}级</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">近</span>
              <input type="number" value={customCreatedDays} onChange={e => setCustomCreatedDays(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs outline-none"
                placeholder="30" min="1" />
              <span className="text-xs text-gray-500">天</span>
            </div>

            <button onClick={createSegment} disabled={!customName.trim()}
              className="w-full py-1.5 bg-[#0A2540] text-white text-xs rounded hover:bg-[#123455] disabled:opacity-40 cursor-pointer">
              创建
            </button>
          </div>
        )}

        {/* 客群分组列表 */}
        <div className="py-2">
          {segmentGroups.map(group => {
            const groupSegs = segments.filter(s => classifySegment(s) === group.key);
            if (groupSegs.length === 0) return null;
            const isCollapsed = collapsed[group.key];

            return (
              <div key={group.key} className="mb-1">
                <button onClick={() => toggleCollapse(group.key)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Icon name="chevron-down" className={`w-4 h-4 text-gray-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                  <Icon name={group.icon} className="w-4 h-4 text-gray-400" />
                  <span>{group.title}</span>
                  <span className="ml-auto text-gray-300">{groupSegs.length}</span>
                </button>

                {!isCollapsed && groupSegs.map(seg => (
                  <button
                    key={seg.id}
                    onClick={() => selectSegment(seg)}
                    className={`w-full flex items-center gap-2 pl-10 pr-4 py-1.5 text-sm transition cursor-pointer ${
                      selectedId === seg.id
                        ? 'bg-orange-50 text-[#0A2540] font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span className="flex-1 truncate text-left">{seg.name}</span>
                    <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                      seg.customerCount > 0 ? 'bg-orange-100 text-[#0A2540]' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {seg.customerCount}
                    </span>
                    {seg.type === 'custom' && (
                      <button onClick={e => { e.stopPropagation(); deleteCustomSegment(seg.id); }}
                        className="text-gray-300 hover:text-red-500 text-xs ml-1 cursor-pointer"
                        title="删除">×</button>
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧客户列表 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {!selectedId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="mb-4 text-[#0A2540]"><Icon name="list" className="w-14 h-14" /></p>
              <p className="text-lg font-medium text-gray-500">选择左侧客群查看客户</p>
              <p className="text-sm mt-1">点击客群名称即可筛选对应客户</p>
            </div>
          </div>
        ) : customersLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {selectedName} <span className="text-sm font-normal text-gray-400">({customers.length}人)</span>
              </h3>
              <Link href={`/customers?segment=${selectedId}`}
                className="text-sm text-[#FF6B35] hover:underline">
                在新页面打开
              </Link>
            </div>

            {customers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="mb-2 text-[#0A2540]/40"><Icon name="list" className="w-10 h-10" /></p>
                <p>该客群暂无客户</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">联系人</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">公司</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">国家</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">渠道</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">等级</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">下次跟进</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers.map(c => (
                      <tr key={c.id}
                        onClick={() => router.push(`/customers/${c.id}`)}
                        className="hover:bg-gray-50 transition cursor-pointer">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{c.contact_name}</td>
                        <td className="px-4 py-2.5 text-gray-600">{c.company_name || '-'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{c.country || '-'}</td>
                        <td className="px-4 py-2.5">
                          {c.source_channel ? (
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                              {channelLabels[c.source_channel] || c.source_channel}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${levelColors[c.customer_level] || 'bg-gray-100 text-gray-600'}`}>
                            {c.customer_level}级
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {c.next_followup_at ? c.next_followup_at.slice(0, 10) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
