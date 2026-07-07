'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';

interface MenuItem {
  href?: string;
  label: string;
  icon: string;
  permKey?: string;
  children?: { href: string; label: string; icon: string; permKey?: string }[];
}

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [rolePerms, setRolePerms] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/roles/my-permissions')
      .then(r => r.json())
      .then(d => setRolePerms(d.permissions || []))
      .catch(() => setRolePerms([]));
  }, []);

  const hasPerm = (key?: string) => !key || rolePerms.includes('*') || rolePerms.some(p => p === key || p.startsWith(key + '.'));

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    '客户管理': pathname.startsWith('/customers') || pathname.startsWith('/followups'),
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/segments') return pathname === '/segments';
    if (href === '/roles') return pathname === '/roles';
    return pathname.startsWith(href);
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
      active ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const menuConfig: MenuItem[] = [
    { href: '/dashboard', label: '仪表盘', icon: '📊', permKey: 'dashboard' },
    {
      label: '客户管理', icon: '👥', permKey: 'customers',
      children: [
        { href: '/customers', label: '客户列表', icon: '📋' },
        { href: '/customers/new', label: '新增客户', icon: '➕' },
        { href: '/followups', label: '跟进记录', icon: '📝', permKey: 'followups' },
      ],
    },
    { href: '/segments', label: '客群管理', icon: '📊', permKey: 'segments' },
  ];

  const adminMenu: MenuItem[] = [
    { href: '/departments', label: '部门管理', icon: '🏢', permKey: 'departments' },
    { href: '/users', label: '用户管理', icon: '👤', permKey: 'users' },
    { href: '/roles', label: '角色管理', icon: '🔐', permKey: 'settings' },
    { href: '/settings', label: '系统设置', icon: '⚙️', permKey: 'settings' },
  ];

  return (
    <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm">CRM</div>
        <div>
          <div className="text-sm font-semibold">客户管理系统</div>
          <div className="text-xs text-slate-400">外贸版</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {menuConfig.map((item) => {
          if (!hasPerm(item.permKey)) return null;
          if (item.children) {
            const visibleChildren = item.children.filter(c => hasPerm(c.permKey));
            if (visibleChildren.length === 0) return null;
            const isExpanded = expanded[item.label];
            const hasActiveChild = visibleChildren.some(c => isActive(c.href));
            return (
              <div key={item.label}>
                <button onClick={() => setExpanded(prev => ({ ...prev, [item.label]: !prev[item.label] }))}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    hasActiveChild ? 'text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-xs text-slate-500">{isExpanded ? '▼' : '▶'}</span>
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-700 pl-3">
                    {visibleChildren.map(child => (
                      <Link key={child.href} href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                          isActive(child.href) ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}>
                        <span className="text-xs">{child.icon}</span>{child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href as string} className={linkClass(isActive(item.href as string))}>
              <span className="text-base">{item.icon}</span>{item.label}
            </Link>
          );
        })}

        {adminMenu.some(m => hasPerm(m.permKey)) && (
          <>
            <div className="mt-4 mb-2 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider">系统管理</div>
            {adminMenu.map((item) => {
              if (!hasPerm(item.permKey)) return null;
              return (
                <Link key={item.href} href={item.href as string} className={linkClass(isActive(item.href as string))}>
                  <span className="text-base">{item.icon}</span>{item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        {user.name} · {user.role === 'admin' ? '管理员' : user.role === 'manager' ? '主管' : '业务员'}
      </div>
    </aside>
  );
}
