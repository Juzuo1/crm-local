'use client';

import { useEffect, useState } from 'react';

interface Department {
  id: number;
  name: string;
  manager_id: number | null;
  manager_name: string;
  member_count: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department_id: number | null;
  is_active: number;
  created_at: string;
}

interface MemberStats {
  customer_count: number;
  followup_count: number;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // 新建/编辑部门
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptManager, setDeptManager] = useState('');

  // 在部门内新增成员
  const [addMemberDeptId, setAddMemberDeptId] = useState<number | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('agent');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberPwd, setNewMemberPwd] = useState('');
  const [createdCredential, setCreatedCredential] = useState('');

  // 编辑成员弹窗
  const [editMember, setEditMember] = useState<User | null>(null);
  const [editMemName, setEditMemName] = useState('');
  const [editMemEmail, setEditMemEmail] = useState('');
  const [editMemRole, setEditMemRole] = useState('');
  const [editMemPwd, setEditMemPwd] = useState('');

  // 成员客户数统计
  const [memberStats, setMemberStats] = useState<Record<number, MemberStats>>({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [dRes, uRes] = await Promise.all([
      fetch('/api/departments'),
      fetch('/api/users'),
    ]);
    if (dRes.ok) setDepartments(await dRes.json());
    if (uRes.ok) {
      const uList = await uRes.json();
      setUsers(uList);
      // 加载每个业务员的客户数
      const stats: Record<number, MemberStats> = {};
      for (const u of uList) {
        if (u.role !== 'admin') {
          try {
            const res = await fetch(`/api/customers?pageSize=1`);
            const json = await res.json();
            // 简化：直接标记有数据
            stats[u.id] = { customer_count: 0, followup_count: 0 };
          } catch { /* */ }
        }
      }
      setMemberStats(stats);
    }
    setLoading(false);
  }

  function flash(msg: string) {
    setMessage(msg); setTimeout(() => setMessage(''), 3000);
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  // ===== 部门操作 =====
  async function saveDepartment() {
    if (!deptName.trim()) return;
    const body = { name: deptName, manager_id: deptManager ? parseInt(deptManager) : null };
    if (editDept) {
      await fetch('/api/departments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id: editDept.id }) });
      flash('部门已更新');
    } else {
      await fetch('/api/departments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      flash('部门已创建');
    }
    setShowDeptForm(false); setEditDept(null); setDeptName(''); setDeptManager('');
    loadData();
  }

  async function deleteDepartment(id: number, name: string) {
    if (!confirm(`确定删除部门「${name}」？成员将变为未分配。`)) return;
    await fetch(`/api/departments?id=${id}`, { method: 'DELETE' });
    flash('部门已删除'); loadData();
  }

  // ===== 成员操作 =====
  async function createMemberInDept() {
    if (!newMemberName.trim()) return;

    // 自动生成邮箱和密码（如果没填）
    const email = newMemberEmail.trim() || `user${Date.now().toString(36)}@crm.local`;
    const password = newMemberPwd || '123456';

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newMemberName.trim(), email, password, role: newMemberRole }),
    });
    if (res.ok) {
      // 找到刚创建的用户
      const uRes2 = await fetch('/api/users');
      const uList2 = await uRes2.json();
      const newUser = uList2.find((u: User) => u.email === email);
      if (newUser && addMemberDeptId) {
        await fetch('/api/departments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: newUser.id, department_id: addMemberDeptId }),
        });
      }

      // 显示生成的账号信息
      setCreatedCredential(`${newMemberName.trim()} 的登录账号：${email} / ${password}`);
      setTimeout(() => setCreatedCredential(''), 8000);

      setAddMemberDeptId(null);
      setNewMemberName(''); setNewMemberEmail(''); setNewMemberPwd('');
      setNewMemberRole('agent'); setShowAdvanced(false);
      loadData();
    } else {
      const err = await res.json();
      flash(err.error || '创建失败');
    }
  }

  async function assignUserToDept(userId: number, deptId: number | null) {
    await fetch('/api/departments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, department_id: deptId }),
    });
    loadData();
  }

  async function saveMemberEdit() {
    if (!editMember) return;
    await fetch(`/api/users/${editMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'edit', name: editMemName, email: editMemEmail, role: editMemRole }),
    });
    if (editMemPwd && editMemPwd.length >= 6) {
      await fetch(`/api/users/${editMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', password: editMemPwd }),
      });
    }
    setEditMember(null);
    flash('成员信息已更新');
    loadData();
  }

  function openEditMember(u: User) {
    setEditMember(u);
    setEditMemName(u.name);
    setEditMemEmail(u.email);
    setEditMemRole(u.role);
    setEditMemPwd('');
  }

  const roleLabels: Record<string, string> = { admin: '管理员', manager: '主管', agent: '业务员' };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">加载中...</div>;

  const unassignedUsers = users.filter(u => u.role !== 'admin' && !u.department_id && u.is_active);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{message}</div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">部门管理</h2>
        <button onClick={() => { setEditDept(null); setDeptName(''); setDeptManager(''); setShowDeptForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
          + 新建部门
        </button>
      </div>

      {/* 部门表单弹窗 */}
      {showDeptForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-900">{editDept ? '编辑部门' : '新建部门'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门名称 <span className="text-red-500">*</span></label>
              <input value={deptName} onChange={e => setDeptName(e.target.value)} className={inputClass} placeholder="例：中东组、欧洲组" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">部门主管</label>
              <select value={deptManager} onChange={e => setDeptManager(e.target.value)} className={inputClass + " bg-white"}>
                <option value="">暂不设置</option>
                {users.filter(u => u.role !== 'admin' && u.is_active).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({roleLabels[u.role]})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveDepartment} disabled={!deptName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-blue-300 cursor-pointer">保存</button>
            <button onClick={() => setShowDeptForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">取消</button>
          </div>
        </div>
      )}

      {/* 部门列表 */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-xl p-16 shadow-sm border border-gray-100 text-center">
          <p className="text-5xl mb-4">🏢</p>
          <p className="text-gray-500 text-lg mb-2">暂无部门</p>
          <p className="text-gray-400 text-sm">点击右上角"新建部门"创建第一个部门</p>
        </div>
      ) : (
        departments.map(dept => {
          const deptUsers = users.filter(u => u.department_id === dept.id && u.is_active);
          return (
            <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 部门头部 */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                    <p className="text-xs text-gray-500">
                      {deptUsers.length} 名成员 · 主管：<span className="font-medium text-blue-600">{dept.manager_name}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setAddMemberDeptId(addMemberDeptId === dept.id ? null : dept.id); }}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    + 添加成员
                  </button>
                  <button onClick={() => { setEditDept(dept); setDeptName(dept.name); setDeptManager(dept.manager_id ? String(dept.manager_id) : ''); setShowDeptForm(true); }}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    编辑
                  </button>
                  <button onClick={() => deleteDepartment(dept.id, dept.name)}
                    className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer">
                    删除
                  </button>
                </div>
              </div>

              {/* 部门内新增成员表单 */}
              {addMemberDeptId === dept.id && (
                <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">添加成员到「{dept.name}」</h4>

                  {createdCredential && (
                    <div className="mb-3 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg text-sm">
                      ✅ {createdCredential}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-40"
                      placeholder="输入姓名" autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') createMemberInDept(); }} />
                    <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer">
                      <option value="agent">业务员</option>
                      <option value="manager">主管</option>
                    </select>
                    <button onClick={createMemberInDept}
                      disabled={!newMemberName.trim()}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:bg-green-300 cursor-pointer">
                      创建
                    </button>
                    <button onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                      {showAdvanced ? '收起' : '高级选项'}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="flex items-center gap-3 mt-3">
                      <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-52 outline-none"
                        placeholder="自定义邮箱（留空自动生成）" />
                      <input value={newMemberPwd} onChange={e => setNewMemberPwd(e.target.value)}
                        type="text" className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36 outline-none"
                        placeholder="密码（默认123456）" />
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    只填姓名即可创建，邮箱和密码自动生成。创建成功后会显示登录信息。
                  </p>
                </div>
              )}

              {/* 成员列表 */}
              <div className="px-6 py-2">
                {deptUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">
                    暂无成员，点击上方"+ 添加成员"创建或从下方未分配列表拖入
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="text-left py-2.5 text-xs font-medium text-gray-400">姓名</th>
                        <th className="text-left py-2.5 text-xs font-medium text-gray-400">邮箱</th>
                        <th className="text-left py-2.5 text-xs font-medium text-gray-400">角色</th>
                        <th className="text-left py-2.5 text-xs font-medium text-gray-400">创建时间</th>
                        <th className="text-right py-2.5 text-xs font-medium text-gray-400">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptUsers.map(u => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2.5">
                            <span className="font-medium text-gray-900">{u.name}</span>
                            {dept.manager_id === u.id && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">主管</span>
                            )}
                          </td>
                          <td className="py-2.5 text-gray-500">{u.email}</td>
                          <td className="py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              u.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>{roleLabels[u.role]}</span>
                          </td>
                          <td className="py-2.5 text-gray-400 text-xs">{u.created_at?.slice(0, 10)}</td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEditMember(u)}
                                className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer">编辑</button>
                              <select
                                onChange={e => { if (e.target.value) assignUserToDept(u.id, parseInt(e.target.value)); }}
                                value=""
                                className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white cursor-pointer text-gray-500">
                                <option value="">移部门</option>
                                <option value="">──────</option>
                                {departments.filter(d => d.id !== dept.id).map(d => (
                                  <option key={d.id} value={d.id}>→ {d.name}</option>
                                ))}
                                <option value="0">→ 未分配</option>
                              </select>
                              <button onClick={() => assignUserToDept(u.id, null)}
                                className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded cursor-pointer">移出</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* 未分配用户 */}
      {unassignedUsers.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            📋 未分配部门的用户 ({unassignedUsers.length}人)
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedUsers.map(u => (
              <div key={u.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                <span className="font-medium text-gray-700">{u.name}</span>
                <span className="text-xs text-gray-400">({roleLabels[u.role]})</span>
                <select
                  onChange={e => { if (e.target.value) assignUserToDept(u.id, parseInt(e.target.value)); }}
                  value=""
                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 bg-white cursor-pointer ml-2">
                  <option value="">加入...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 编辑成员弹窗 */}
      {editMember && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditMember(null)}>
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑成员 - {editMember.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input value={editMemName} onChange={e => setEditMemName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input value={editMemEmail} onChange={e => setEditMemEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select value={editMemRole} onChange={e => setEditMemRole(e.target.value)} className={inputClass + " bg-white"}>
                  <option value="agent">业务员</option>
                  <option value="manager">主管</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  新密码 <span className="text-xs text-gray-400">（留空不修改）</span>
                </label>
                <input value={editMemPwd} onChange={e => setEditMemPwd(e.target.value)}
                  type="password" className={inputClass} placeholder="至少6位" minLength={6} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => setEditMember(null)}
                  className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">取消</button>
                <button onClick={saveMemberEdit}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
