'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';

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
            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition">
              <div className="flex items-center gap-3">
              <Icon name="user" className="w-6 h-6 text-[#0A2540] shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">用户管理</div>
                <div className="text-xs text-gray-500">创建子账号、编辑信息、重置密码、客户交接</div>
              </div>
            </div>
            <span className="text-gray-300">→</span>
          </Link>

          <Link href="/segments"
            className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition">
              <div className="flex items-center gap-3">
                <Icon name="segments" className="w-6 h-6 text-[#0A2540] shrink-0" />
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
                <Icon name="download" className="w-6 h-6 text-[#0A2540] shrink-0" />
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

      {/* 公海规则 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Icon name="sea" className="w-5 h-5 text-[#0A2540]" /> 公海规则设置</h3>
        <SeaPoolRulesSettings />
      </div>

      {/* 通知偏好 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Icon name="bell" className="w-5 h-5 text-[#0A2540]" /> 跟进提醒设置</h3>
        <NotificationSettings />
      </div>

      {/* 数据说明 */}
      <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
        <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1.5"><Icon name="lightbulb" className="w-4 h-4 text-[#FF6B35]" /> 数据说明</h4>
        <ul className="text-xs text-[#0A2540] space-y-1">
          <li>· 所有数据存储在本地 <code className="bg-orange-100 px-1.5 py-0.5 rounded">data/crm.json</code> 文件中</li>
          <li>· 建议定期备份该文件以防数据丢失</li>
          <li>· 可随时通过"导出客户数据"功能下载 CSV 备份</li>
          <li>· 员工离职 → 改密码 → 新员工登录用原账号 → 客户数据无缝衔接</li>
          <li>· 如需彻底清空客户分配给新业务员，使用"交接"功能</li>
        </ul>
      </div>
    </div>
  );
}

/** 公海规则设置组件 */
function SeaPoolRulesSettings() {
  const [rules, setRules] = useState({ enabled: true, days_to_fall: 7, excluded_stages: ['completed', 'lost'], claim_limit_per_day: 3 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error' | ''>('');

  useEffect(() => {
    fetch('/api/sea-pool/rules')
      .then(r => r.json())
      .then(d => { setRules(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/sea-pool/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rules),
    });
    const json = await res.json();
    setMsg(json.success ? '保存成功' : '保存失败');
    setMsgType(json.success ? 'success' : 'error');
    setSaving(false);
    setTimeout(() => { setMsg(''); setMsgType(''); }, 3000);
  }

  const stages = [
    { value: 'new_lead', label: '新线索' },
    { value: 'initial_contact', label: '初步联系' },
    { value: 'needs_confirmed', label: '需求确认' },
    { value: 'quoted', label: '已报价' },
    { value: 'sample_testing', label: '样品测试' },
    { value: 'negotiation', label: '商务谈判' },
    { value: 'order_confirmed', label: '确认订单' },
    { value: 'production_shipping', label: '生产发货' },
    { value: 'completed', label: '已成交客户' },
    { value: 'lost', label: '已流失' },
  ];

  if (loading) return <div className="text-sm text-gray-400">加载中...</div>;

  return (
    <div className="space-y-4">
      {/* 开关 */}
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm font-medium text-gray-900">启用自动掉公海</div>
          <div className="text-xs text-gray-500 mt-0.5">开启后，超期未跟进的客户将自动掉入公海</div>
        </div>
        <button
          onClick={() => setRules(r => ({ ...r, enabled: !r.enabled }))}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            rules.enabled ? 'bg-[#0A2540]' : 'bg-gray-300'
          }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            rules.enabled ? 'translate-x-5' : ''
          }`} />
        </button>
      </div>

      {rules.enabled && (
        <>
          {/* 掉入天数 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-gray-900">掉入天数</div>
              <div className="text-xs text-gray-500 mt-0.5">超过多少天未跟进自动掉入公海</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={90}
                value={rules.days_to_fall}
                onChange={e => setRules(r => ({ ...r, days_to_fall: parseInt(e.target.value) || 7 }))}
                className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5"
              />
              <span className="text-sm text-gray-500">天</span>
            </div>
          </div>

          {/* 每日领取上限 */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium text-gray-900">每日领取上限</div>
              <div className="text-xs text-gray-500 mt-0.5">每人每天最多领取几个公海客户（0=不限）</div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={50}
                value={rules.claim_limit_per_day}
                onChange={e => setRules(r => ({ ...r, claim_limit_per_day: parseInt(e.target.value) || 0 }))}
                className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5"
              />
              <span className="text-sm text-gray-500">个/天</span>
            </div>
          </div>

          {/* 排除阶段 */}
          <div>
            <div className="text-sm font-medium text-gray-900 mb-2">不参与掉公海的阶段</div>
            <div className="text-xs text-gray-500 mb-3">这些阶段的客户即使超期未跟进也不会掉入公海</div>
            <div className="flex flex-wrap gap-2">
              {stages.map(s => {
                const checked = rules.excluded_stages.includes(s.value);
                return (
                  <label key={s.value}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition ${
                      checked ? 'bg-orange-50 border-orange-300 text-[#0A2540]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setRules(r => ({
                          ...r,
                          excluded_stages: checked
                            ? r.excluded_stages.filter(x => x !== s.value)
                            : [...r.excluded_stages, s.value],
                        }));
                      }}
                      className="rounded cursor-pointer"
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {msg && (
        <div className={`text-sm p-2.5 rounded-lg flex items-center gap-1.5 ${
          msgType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          <Icon name={msgType === 'success' ? 'check' : 'x'} className="w-4 h-4 shrink-0" />
          {msg}
        </div>
      )}

      <button onClick={save} disabled={saving}
        className="px-4 py-2 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] disabled:opacity-40 transition cursor-pointer disabled:cursor-not-allowed">
        {saving ? '保存中...' : '保存规则'}
      </button>
    </div>
  );
}

/** 通知偏好设置组件 */
function NotificationSettings() {
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyPermission, setNotifyPermission] = useState<string>('default');
  const [notifyHour, setNotifyHour] = useState(9);
  const [testStatus, setTestStatus] = useState('');
  const [testType, setTestType] = useState<'success' | 'error' | 'warn' | ''>('');

  useEffect(() => {
    // 从 localStorage 读取设置
    const enabled = localStorage.getItem('crm_notify_enabled') === 'true';
    const hour = parseInt(localStorage.getItem('crm_notify_hour') || '9');
    setNotifyEnabled(enabled);
    setNotifyHour(hour);

    if ('Notification' in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  function saveSettings(enabled: boolean, hour: number) {
    localStorage.setItem('crm_notify_enabled', String(enabled));
    localStorage.setItem('crm_notify_hour', String(hour));
  }

  async function requestPermission() {
    if (!('Notification' in window)) {
      setTestStatus('当前浏览器不支持桌面通知');
      setTestType('warn');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifyPermission(perm);
    if (perm === 'granted') {
      saveSettings(true, notifyHour);
      setNotifyEnabled(true);
      setTestStatus('通知权限已开启');
      setTestType('success');
    } else {
      setTestStatus('通知权限被拒绝，请在浏览器设置中允许通知');
      setTestType('error');
    }
  }

  function toggleNotify() {
    const next = !notifyEnabled;
    if (next && notifyPermission !== 'granted') {
      requestPermission();
      return;
    }
    setNotifyEnabled(next);
    saveSettings(next, notifyHour);
  }

  function testNotification() {
    if (!('Notification' in window)) {
      setTestStatus('当前浏览器不支持桌面通知');
      setTestType('warn');
      return;
    }
    if (Notification.permission !== 'granted') {
      setTestStatus('请先开启通知权限');
      setTestType('warn');
      return;
    }
    new Notification('CRM 跟进提醒', {
      body: '这是一条测试通知。如果有客户需要跟进，您将收到类似提醒！',
      icon: '/favicon.ico',
    });
    setTestStatus('测试通知已发送，请查看桌面右上角');
    setTestType('success');
    setTimeout(() => { setTestStatus(''); setTestType(''); }, 3000);
  }

  // 获取当前登录用户
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);
  useEffect(() => {
    fetch('/api/roles/my-permissions')
      .then(r => r.json())
      .then(() => {
        // 从 cookie 或 header 获取用户名不太方便，暂时跳过
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* 桌面通知开关 */}
      <div className="flex items-center justify-between py-2">
        <div>
          <div className="text-sm font-medium text-gray-900">桌面通知</div>
          <div className="text-xs text-gray-500 mt-0.5">
            逾期客户会在工作时间收到浏览器弹窗提醒
          </div>
        </div>
        <button
          onClick={toggleNotify}
          className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
            notifyEnabled ? 'bg-[#0A2540]' : 'bg-gray-300'
          }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            notifyEnabled ? 'translate-x-5' : ''
          }`} />
        </button>
      </div>

      {/* 提醒时间 */}
      {notifyEnabled && (
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-gray-900">提醒时间</div>
            <div className="text-xs text-gray-500 mt-0.5">每天几点检查逾期客户并发送通知</div>
          </div>
          <select
            value={notifyHour}
            onChange={e => {
              const h = parseInt(e.target.value);
              setNotifyHour(h);
              saveSettings(notifyEnabled, h);
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            {Array.from({ length: 12 }, (_, i) => i + 8).map(h => (
              <option key={h} value={h}>{h}:00</option>
            ))}
          </select>
        </div>
      )}

      {/* 通知权限状态 */}
      <div className="text-xs text-gray-500">
        浏览器通知权限：{' '}
        {notifyPermission === 'granted' ? (
          <span className="text-green-600 font-medium inline-flex items-center gap-1"><Icon name="check" className="w-3.5 h-3.5" />已允许</span>
        ) : notifyPermission === 'denied' ? (
          <span className="text-red-600 font-medium inline-flex items-center gap-1"><Icon name="x" className="w-3.5 h-3.5" />已拒绝（请在浏览器设置中修改）</span>
        ) : (
          <span className="text-orange-600 font-medium inline-flex items-center gap-1"><Icon name="warning" className="w-3.5 h-3.5" />未设置（首次开启时会请求权限）</span>
        )}
      </div>

      {/* 测试按钮 */}
      <button onClick={testNotification}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer inline-flex items-center gap-2">
        <Icon name="bell" className="w-4 h-4" /> 发送测试通知
      </button>

      {testStatus && (
        <div className={`text-xs p-2.5 rounded-lg flex items-center gap-1.5 ${
          testType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
          testType === 'error' || testType === 'warn' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
          'bg-gray-50 text-gray-600'
        }`}>
          <Icon name={testType === 'success' ? 'check' : testType === 'error' ? 'x' : 'warning'} className="w-3.5 h-3.5 shrink-0" />
          {testStatus}
        </div>
      )}

      <div className="text-xs text-gray-400 mt-1 space-y-0.5">
        <div>· 浏览器通知需要页面处于打开状态（可最小化/后台标签页）</div>
        <div>· 系统会在每天早上和下午各检查一次逾期客户并发送提醒</div>
        <div>· 设置保存在当前浏览器本地，不同设备需分别设置</div>
      </div>
    </div>
  );
}
