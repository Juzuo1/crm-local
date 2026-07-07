'use client';

import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '主管',
  agent: '业务员',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');

  // 编辑弹窗
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');

  // 改密弹窗
  const [pwdUser, setPwdUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // 交接弹窗
  const [transferFrom, setTransferFrom] = useState<User | null>(null);
  const [transferTo, setTransferTo] = useState('');

  async function fetchUsers() {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  }

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
      }),
    });
    if (res.ok) {
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      fetchUsers();
      flash('子账号创建成功');
    } else {
      const json = await res.json();
      setFormError(json.error || '创建失败');
    }
  }

  async function toggleUser(user: User) {
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', is_active: !user.is_active }),
    });
    fetchUsers();
  }

  async function saveEdit() {
    if (!editUser) return;
    await fetch(`/api/users/${editUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        name: editName,
        email: editEmail,
        role: editRole,
      }),
    });
    setEditUser(null);
    fetchUsers();
    flash('用户信息已更新');
  }

  async function resetPassword() {
    if (!pwdUser || newPassword.length < 6) return;
    await fetch(`/api/users/${pwdUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset-password', password: newPassword }),
    });
    setPwdUser(null);
    setNewPassword('');
    flash('密码已重置');
  }

  async function doTransfer() {
    if (!transferFrom || !transferTo) return;
    const res = await fetch(`/api/users/${transferFrom.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'transfer', to_user_id: parseInt(transferTo) }),
    });
    const json = await res.json();
    setTransferFrom(null);
    setTransferTo('');
    fetchUsers();
    flash(`已交接 ${json.count || 0} 个客户`);
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">用户管理</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer">
          {showForm ? '取消' : '+ 新增子账号'}
        </button>
      </div>

      {/* 创建子账号 */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">创建子账号</h3>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{formError}</div>
          )}
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 <span className="text-red-500">*</span></label>
                <input name="name" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 <span className="text-red-500">*</span></label>
                <input name="email" type="email" required className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码 <span className="text-red-500">*</span></label>
                <input name="password" type="password" required minLength={6} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select name="role" defaultValue="agent" className={inputClass + " bg-white"}>
                  <option value="agent">业务员</option>
                  <option value="manager">主管</option>
                </select>
              </div>
            </div>
            <button type="submit"
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer">
              创建账号
            </button>
          </form>
        </div>
      )}

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">邮箱</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无用户</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {roleLabels[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.is_active ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{u.created_at?.slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 编辑 */}
                      <button onClick={() => {
                        setEditUser(u);
                        setEditName(u.name);
                        setEditEmail(u.email);
                        setEditRole(u.role);
                      }}
                        className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer">
                        编辑
                      </button>
                      {/* 改密 */}
                      <button onClick={() => { setPwdUser(u); setNewPassword(''); }}
                        className="text-xs px-2 py-1 text-orange-600 hover:bg-orange-50 rounded cursor-pointer">
                        改密
                      </button>
                      {/* 交接 */}
                      <button onClick={() => { setTransferFrom(u); setTransferTo(''); }}
                        className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 rounded cursor-pointer">
                        交接
                      </button>
                      {/* 启停 */}
                      {u.role !== 'admin' && (
                        <button onClick={() => toggleUser(u)}
                          className={`text-xs px-2 py-1 rounded cursor-pointer ${
                            u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}>
                          {u.is_active ? '停用' : '启用'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 编辑弹窗 */}
      {editUser && (
        <Modal title="编辑用户" onClose={() => setEditUser(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select value={editRole} onChange={e => setEditRole(e.target.value)} className={inputClass + " bg-white"}>
                <option value="agent">业务员</option>
                <option value="manager">主管</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditUser(null)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">取消</button>
              <button onClick={saveEdit}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer">保存</button>
            </div>
          </div>
        </Modal>
      )}

      {/* 改密弹窗 */}
      {pwdUser && (
        <Modal title={`重置密码 - ${pwdUser.name}`} onClose={() => setPwdUser(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              为 <strong>{pwdUser.name}</strong>（{pwdUser.email}）设置新密码。
              员工离职后将密码改掉，交给下一个人使用，<strong className="text-green-600">客户数据不会丢失</strong>。
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码 <span className="text-red-500">*</span></label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="至少6位" minLength={6} className={inputClass} />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setPwdUser(null)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">取消</button>
              <button onClick={resetPassword} disabled={newPassword.length < 6}
                className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 disabled:bg-orange-300 cursor-pointer disabled:cursor-not-allowed">
                确认重置
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 交接弹窗 */}
      {transferFrom && (
        <Modal title={`客户交接 - ${transferFrom.name}`} onClose={() => setTransferFrom(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              将 <strong>{transferFrom.name}</strong> 名下所有客户转移给另一个业务员。
              此操作不影响客户历史数据。
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标业务员</label>
              <select value={transferTo} onChange={e => setTransferTo(e.target.value)}
                className={inputClass + " bg-white"}>
                <option value="">请选择...</option>
                {users.filter(u => u.id !== transferFrom.id && u.role !== 'admin' && u.is_active)
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setTransferFrom(null)}
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 cursor-pointer">取消</button>
              <button onClick={doTransfer} disabled={!transferTo}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:bg-purple-300 cursor-pointer disabled:cursor-not-allowed">
                确认交接
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// 弹窗组件
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
