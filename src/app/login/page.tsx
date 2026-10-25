'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';

const features = [
  { icon: 'users', text: '客户全生命周期管理，从询盘到成交' },
  { icon: 'sea', text: '公海池防撞单，超期自动回收' },
  { icon: 'clock', text: '跟进提醒与逾期预警，不漏一个商机' },
];

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0A2540]">
      {/* ========== 左侧品牌区（编辑式深蓝面板）========== */}
      <div
        className="hidden lg:flex lg:w-[50%] relative flex-col justify-between px-16 py-14 overflow-hidden"
        style={{
          backgroundColor: '#0A2540',
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* 极淡的底部提亮，增加层次（非模糊光斑） */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.05), transparent)' }}
        />

        {/* 顶部：Logo + 品牌名 */}
        <div className="relative flex items-center gap-3.5">
          <Logo size={46} variant="light" />
          <div>
            <div className="text-lg font-semibold text-white tracking-wide leading-tight">YIMU CRM</div>
            <div className="text-[11px] text-slate-400 tracking-[0.2em]">客户管理 · 外贸版</div>
          </div>
        </div>

        {/* 中部：主标语 */}
        <div className="relative max-w-md">
          <span className="block w-10 h-1 rounded-full bg-[#FF6B35] mb-6" />
          <h2 className="text-[34px] font-bold text-white leading-[1.25] tracking-tight">
            把全球客户，<br />装进一个工作台
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-400">
            专为外贸团队打造的客户管理系统——询盘、跟进、公海、转化，全流程一目了然。
          </p>
        </div>

        {/* 底部：特性列表 */}
        <div className="relative space-y-3.5">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3.5 text-[13.5px] text-slate-300">
              <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#FF6B35] shrink-0">
                <Icon name={f.icon} className="w-4 h-4" />
              </span>
              {f.text}
            </div>
          ))}
          <p className="pt-5 text-[11px] text-slate-500">© 2026 YIMU Energy · 外贸版 CRM</p>
        </div>
      </div>

      {/* ========== 右侧表单区 ========== */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] px-6 relative overflow-hidden">
        <div className="w-full max-w-sm relative">
          {/* 移动端 Logo（小屏显示） */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-9">
            <Logo size={42} variant="dark" />
            <div className="text-lg font-semibold text-[#0A2540] leading-tight">
              YIMU CRM
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-[#0A2540] tracking-tight">欢迎回来</h1>
            <p className="text-slate-500 text-sm mt-2">登录你的账号，继续跟进全球客户</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <Icon name="warning" className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                邮箱
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="请输入密码"
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0A2540] hover:bg-[#123455] disabled:bg-slate-400 text-white font-medium rounded-lg transition cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/15"
            >
              {loading ? '登录中…' : '登 录'}
            </button>
          </form>

          <div className="mt-8 p-3.5 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-400 leading-relaxed">
              演示账号：admin@crm.local / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
