'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [stats, setStats] = useState({ users: 0, customers: 0, followups: 0 });
  const [canExport, setCanExport] = useState(false);

  useEffect(() => {
    // 加载统计
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setStats({
        users: 0,
        customers: d.totalCustomers || 0,
        followups: d.pendingFollowup || 0,
      }));

    // 加载用户数
    fetch('/api/users')
      .then(r => r.json())
      .then(d => setStats(prev => ({ ...prev, users: Array.isArray(d) ? d.length : 0 })))
      .catch(() => {});

    // 检查导出权限
    fetch('/api/roles/my-permissions')
      .then(r => r.json())
      .then(d => setCanExport(d.permissions?.includes('settings.export') || d.permissions?.includes('*')))
      .catch(() => {});
  }, []);

  async function exportData() {
    const res = await fetch('/api/customers?pageSize=10000');
    const json = await res.json();
    const csv = ['联系人,公司,国家,渠道,等级,手机,邮箱,建档时间'];
    (json.data || []).forEach((c: Record<string, unknown>) => {
      csv.push([
        c.contact_name, c.company_name, c.country, c.source_channel,
        c.customer_level, c.phone, c.email, c.created_at
      ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob(['﻿' + csv.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `客户数据导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-900">系统设置</h2>

      {/* 系统概览 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">系统概览</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.users}</div>
            <div className="text-xs text-gray-500 mt-1">用户数</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{stats.customers}</div>
            <div className="text-xs text-gray-500 mt-1">客户数</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{process.env.NEXT_PUBLIC_APP_VERSION || '1.0'}</div>
            <div className="text-xs text-gray-500 mt-1">版本</div>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">管理功能</h3>
        <div className="space-y-3">
          <Link href="/users"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition">
            <div className="flex items-center gap-3">
              <span className="text-xl">👥</span>
              <div>
                <div className="text-sm font-medium text-gray-900">用户管理</div>
                <div className="text-xs text-gray-500">创建子账号、编辑信息、重置密码、客户交接</div>
              </div>
            </div>
            <span className="text-gray-300">→</span>
          </Link>

          <Link href="/segments"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition">
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <div className="text-sm font-medium text-gray-900">客群管理</div>
                <div className="text-xs text-gray-500">管理预设客群、创建自定义客群</div>
              </div>
            </div>
            <span className="text-gray-300">→</span>
          </Link>

          {canExport && (
            <button onClick={exportData}
              className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-green-50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-xl">📥</span>
                <div>
                  <div className="text-sm font-medium text-gray-900 text-left">导出客户数据</div>
                  <div className="text-xs text-gray-500">导出全部客户为 CSV 文件（Excel 可打开）</div>
                </div>
              </div>
              <span className="text-gray-300">↓</span>
            </button>
          )}
        </div>
      </div>

      {/* 数据说明 */}
      <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 数据说明</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>· 所有数据存储在本地 <code className="bg-blue-100 px-1.5 py-0.5 rounded">data/crm.json</code> 文件中</li>
          <li>· 建议定期备份该文件以防数据丢失</li>
          <li>· 可随时通过"导出客户数据"功能下载 CSV 备份</li>
          <li>· 员工离职 → 改密码 → 新员工登录用原账号 → 客户数据无缝衔接</li>
          <li>· 如需彻底清空客户分配给新业务员，使用"交接"功能</li>
        </ul>
      </div>
    </div>
  );
}
