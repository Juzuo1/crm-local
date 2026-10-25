'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { SessionUser } from '@/lib/auth';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';
import { avatarColor } from '@/lib/ui';

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

  // 激活态：白色半透明底 + 左侧品牌橙指示条
  const linkClass = (active: boolean) =>
    `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
      active
        ? 'bg-white/10 text-white font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:rounded-full before:bg-[#FF6B35]'
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
    }`;

  const menuConfig: MenuItem[] = [
    { href: '/dashboard', label: '仪表盘', icon: 'dashboard', permKey: 'dashboard' },
    {
      label: '客户管理', icon: 'users', permKey: 'customers',
      children: [
        { href: '/customers', label: '客户列表', icon: 'list' },
        { href: '/customers/new', label: '新增客户', icon: 'plus' },
        { href: '/followups', label: '跟进记录', icon: 'chat', permKey: 'followups' },
      ],
    },
    { href: '/segments', label: '客群管理', icon: 'segments', permKey: 'segments' },
    { href: '/sea-pool', label: '公海客户', icon: 'sea', permKey: 'sea_pool' },
  ];

  const adminMenu: MenuItem[] = [
    { href: '/departments', label: '部门管理', icon: 'building', permKey: 'departments' },
    { href: '/users', label: '用户管理', icon: 'user', permKey: 'users' },
    { href: '/roles', label: '角色管理', icon: 'shield', permKey: 'settings' },
    { href: '/audit-logs', label: '操作日志', icon: 'document', permKey: 'audit' },
    { href: '/settings', label: '系统设置', icon: 'settings', permKey: 'settings' },
  ];

  return (
    <aside className="w-56 bg-[#0A2540] text-white flex flex-col shrink-0">
      {/* 品牌区：蓝紫渐变圆环闪电 Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Logo size={36} variant="light" />
        <div>
          <div className="text-sm font-semibold tracking-wide">YIMU 客户管理</div>
          <div className="text-[11px] text-slate-400">外贸版 · CRM</div>
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
                    hasActiveChild ? 'text-white font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}>
                  <Icon name={item.icon} className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <Icon name="chevron-down" className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                </button>
                {isExpanded && (
                  <div className="ml-[21px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                    {visibleChildren.map(child => (
                      <Link key={child.href} href={child.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition ${
                          isActive(child.href) ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}>
                        <Icon name={child.icon} className="w-4 h-4" />{child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link key={item.href} href={item.href as string} className={linkClass(isActive(item.href as string))}>
              <Icon name={item.icon} className="w-[18px] h-[18px]" />{item.label}
            </Link>
          );
        })}

        {adminMenu.some(m => hasPerm(m.permKey)) && (
          <>
            <div className="mt-5 mb-2 px-3 text-[11px] text-slate-500 font-medium tracking-wider">系统管理</div>
            {adminMenu.map((item) => {
              if (!hasPerm(item.permKey)) return null;
              return (
                <Link key={item.href} href={item.href as string} className={linkClass(isActive(item.href as string))}>
                  <Icon name={item.icon} className="w-[18px] h-[18px]" />{item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* 底部用户信息：头像 + 姓名角色 */}
      <div className="px-4 py-3.5 border-t border-white/10 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full ${avatarColor(user.name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
          {user.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-white truncate">{user.name}</div>
          <div className="text-[11px] text-slate-400">{user.role === 'admin' ? '管理员' : user.role === 'manager' ? '主管' : '业务员'}</div>
        </div>
      </div>
    </aside>
  );
}
