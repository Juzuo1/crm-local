'use client';

import { useEffect, useState } from 'react';
import { PERMISSION_GROUPS, RolePermissions, RolePermissionConfig, DataScope } from '@/lib/permissions';

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '主管',
  agent: '业务员',
};

const scopeLabels: Record<DataScope, string> = {
  own: '仅自己',
  department: '本部门',
  all: '全部',
};

const scopeColors: Record<DataScope, string> = {
  own: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  department: 'bg-orange-100 text-orange-800 border-orange-300',
  all: 'bg-green-100 text-green-800 border-green-300',
};

export default function RolesPage() {
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeRole, setActiveRole] = useState<string>('admin');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/roles')
      .then(r => r.json())
      .then(setPermissions)
      .finally(() => setLoading(false));
  }, []);

  function getConfig(): RolePermissionConfig | null {
    if (!permissions) return null;
    return permissions[activeRole] || null;
  }

  function isAdmin(): boolean {
    return activeRole === 'admin';
  }

  function hasPerm(permKey: string): boolean {
    const config = getConfig();
    if (!config) return false;
    if (config.permissions.includes('*')) return true;
    return config.permissions.includes(permKey);
  }

  function getScope(moduleKey: string): DataScope {
    const config = getConfig();
    if (!config) return 'own';
    return config.dataScopes?.[moduleKey] || 'own';
  }

  function togglePerm(permKey: string) {
    if (!permissions) return;
    const config = { ...permissions[activeRole] };
    if (config.permissions.includes('*')) return;

    if (config.permissions.includes(permKey)) {
      config.permissions = config.permissions.filter(p => p !== permKey);
    } else {
      config.permissions = [...config.permissions, permKey];
    }
    setPermissions({ ...permissions, [activeRole]: config });
  }

  function setScope(moduleKey: string, scope: DataScope) {
    if (!permissions) return;
    const config = { ...permissions[activeRole] };
    if (config.permissions.includes('*')) return;
    config.dataScopes = { ...config.dataScopes, [moduleKey]: scope };
    setPermissions({ ...permissions, [activeRole]: config });
  }

  async function save() {
    if (!permissions) return;
    const res = await fetch('/api/roles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });
    if (res.ok) {
      setMessage('权限已保存，用户重新登录后生效');
      setTimeout(() => setMessage(''), 4000);
    }
  }

  function toggleGroup(key: string) {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const config = getConfig();
  const isAdminRole = isAdmin();

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;
  if (!permissions) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">角色管理</h2>
          <p className="text-sm text-gray-500 mt-1">配置每个角色的操作权限和数据范围</p>
        </div>
        <button onClick={save}
          className="px-4 py-2 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] cursor-pointer">
          保存权限
        </button>
      </div>

      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>
      )}

      {/* 角色标签切换 */}
      <div className="flex gap-2">
        {Object.entries(roleLabels).map(([key, label]) => (
          <button key={key} onClick={() => setActiveRole(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition cursor-pointer ${
              activeRole === key
                ? 'bg-[#0A2540] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {label}
            <span className="ml-1.5 text-xs opacity-70">
              ({key === 'admin' ? '全部权限' : key === 'manager' ? '部门管理' : '个人业务'})
            </span>
          </button>
        ))}
      </div>

      {/* 当前角色说明 */}
      {isAdminRole && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-[#0A2540]">
          💡 管理员拥有全部权限，不可修改。如需限制管理员权限，请先创建新角色。
        </div>
      )}

      {/* 权限组列表 */}
      <div className="space-y-3">
        {PERMISSION_GROUPS.map(group => {
          const isExpanded = expandedGroups[group.key] !== false; // 默认展开
          const activePerms = group.permissions.filter(p => isAdminRole || hasPerm(p.key));
          const activeCount = isAdminRole ? group.permissions.length : activePerms.length;
          const totalCount = group.permissions.length;

          return (
            <div key={group.key} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 组头部 */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition cursor-pointer text-left">
                <span className="text-lg">{group.icon}</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{group.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeCount}/{totalCount} 项权限
                    {group.hasDataScope && config && !isAdminRole && (
                      <span className={`ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${scopeColors[getScope(group.key)]}`}>
                        数据范围: {scopeLabels[getScope(group.key)]}
                      </span>
                    )}
                  </p>
                </div>
                <span className="text-gray-300 text-sm">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {/* 权限列表 */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {/* 数据范围选择（有数据范围的模块） */}
                  {group.hasDataScope && !isAdminRole && (
                    <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 shrink-0">数据范围:</span>
                      <div className="flex gap-1.5">
                        {(['own', 'department', 'all'] as DataScope[]).map(scope => (
                          <button key={scope}
                            onClick={() => setScope(group.key, scope)}
                            className={`px-3 py-1 text-xs rounded-full border transition cursor-pointer ${
                              getScope(group.key) === scope
                                ? scopeColors[scope] + ' font-medium'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                            }`}>
                            {scopeLabels[scope]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作权限复选框 */}
                  <div className="divide-y divide-gray-50">
                    {group.permissions.map(perm => {
                      const checked = isAdminRole || hasPerm(perm.key);
                      return (
                        <label key={perm.key}
                          className={`flex items-center gap-4 px-5 py-3 transition ${
                            isAdminRole ? 'opacity-70' : 'hover:bg-gray-50 cursor-pointer'
                          }`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isAdminRole}
                            onChange={() => togglePerm(perm.key)}
                            className="w-4 h-4 rounded border-gray-300 text-[#FF6B35] focus:ring-[#FF6B35]/40 disabled:cursor-not-allowed"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-800">{perm.label}</div>
                            <div className="text-xs text-gray-400">{perm.desc}</div>
                          </div>
                          {!isAdminRole && checked && (
                            <span className="text-xs text-green-500 font-medium">✓</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部保存 */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-700">修改完成后请点击保存</p>
          <p className="text-xs text-gray-400">权限变更将在用户下次登录时生效</p>
        </div>
        <button onClick={save}
          className="px-6 py-2.5 bg-[#0A2540] text-white text-sm font-medium rounded-lg hover:bg-[#123455] cursor-pointer shadow-sm">
          保存权限设置
        </button>
      </div>
    </div>
  );
}
