'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions';
import Icon from '@/components/Icon';
import Logo from '@/components/Logo';

// 全球贸易网络背景：地球经纬网格 + 客户节点 + 航线弧线
function GlobeNetwork() {
  return (
    <svg viewBox="0 0 600 600" fill="none" className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true">
      <defs>
        <linearGradient id="arc-orange" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#FF6B35" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="arc-blue" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#60A5FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* 地球经纬网格 */}
      <circle cx="300" cy="310" r="230" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <ellipse cx="300" cy="310" rx="230" ry="90" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <ellipse cx="300" cy="310" rx="230" ry="165" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <ellipse cx="300" cy="310" rx="90" ry="230" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <ellipse cx="300" cy="310" rx="165" ry="230" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

      {/* 航线弧线（连接全球客户） */}
      <path d="M160 230 Q300 100 440 240" stroke="url(#arc-orange)" strokeWidth="1.5" />
      <path d="M440 240 Q380 400 210 420" stroke="url(#arc-blue)" strokeWidth="1.5" />
      <path d="M160 230 Q220 400 380 400" stroke="url(#arc-blue)" strokeWidth="1.5" />
      <path d="M440 240 Q300 340 210 420" stroke="url(#arc-orange)" strokeWidth="1.5" opacity="0.5" />

      {/* 客户节点 */}
      {[
        { cx: 160, cy: 230, c: '#FF6B35' },
        { cx: 440, cy: 240, c: '#FF6B35' },
        { cx: 210, cy: 420, c: '#60A5FA' },
        { cx: 380, cy: 400, c: '#60A5FA' },
        { cx: 300, cy: 310, c: '#ffffff' },
      ].map((d, i) => (
        <g key={i}>
          <circle cx={d.cx} cy={d.cy} r="10" fill={d.c} opacity="0.15" />
          <circle cx={d.cx} cy={d.cy} r="4" fill={d.c} />
        </g>
      ))}
    </svg>
  );
}

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
    <div className="flex min-h-screen">
      {/* ========== 左侧品牌区 ========== */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#0A2540] relative flex-col justify-between px-14 py-12 overflow-hidden">
        {/* 背景：光晕 + 贸易网络 */}
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[380px] h-[380px] rounded-full bg-[#FF6B35]/10 blur-3xl" />
        <GlobeNetwork />

        {/* 顶部：Logo + 品牌名 */}
        <div className="relative flex items-center gap-3.5">
          <Logo size={44} />
          <div>
            <div className="text-lg font-semibold text-white tracking-wide">YIMU 客户管理</div>
            <div className="text-xs text-slate-400 tracking-widest">GLOBAL TRADE CRM</div>
          </div>
        </div>

        {/* 中部：主标语 */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold text-white leading-snug">
            把全球客户<br />装进一个工作台
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            专为外贸团队打造的客户管理系统——询盘、跟进、公海、转化，全流程一目了然。
          </p>
        </div>

        {/* 底部：特性列表 */}
        <div className="relative space-y-3">
          {features.map(f => (
            <div key={f.text} className="flex items-center gap-3 text-[13px] text-slate-300">
              <span className="w-7 h-7 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-[#FF6B35]">
                <Icon name={f.icon} className="w-3.5 h-3.5" />
              </span>
              {f.text}
            </div>
          ))}
          <p className="pt-4 text-[11px] text-slate-500">© 2026 YIMU Energy · 外贸版 CRM</p>
        </div>
      </div>

      {/* ========== 右侧表单区 ========== */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 relative overflow-hidden">
        {/* 右侧淡装饰 */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-orange-100/40 blur-3xl" />

        <div className="w-full max-w-sm relative">
          {/* 移动端 Logo（小屏显示） */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Logo size={40} />
            <div className="text-lg font-semibold text-[#0A2540]">YIMU 客户管理</div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#0A2540]">欢迎回来</h1>
            <p className="text-slate-500 text-sm mt-1.5">登录你的账号，继续跟进全球客户</p>
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
              className="w-full py-2.5 bg-[#0A2540] hover:bg-[#123455] disabled:bg-slate-400 text-white font-medium rounded-lg transition cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-[#0A2540]/20"
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
