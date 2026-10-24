'use client';

import { useState } from 'react';
import { loginAction } from '@/app/actions';
import Icon from '@/components/Icon';

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
    <div className="flex min-h-screen items-center justify-center bg-[#0A2540] relative overflow-hidden">
      {/* 背景装饰：网格 + 光晕 */}
      <div className="absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="absolute -top-40 -right-40 w-[480px] h-[480px] rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full bg-[#FF6B35]/10 blur-3xl" />

      <div className="w-full max-w-md relative px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-white mb-4 shadow-lg shadow-blue-500/25">
              <Icon name="lightning" className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#0A2540]">YIMU 客户管理系统</h1>
            <p className="text-slate-400 text-sm mt-1">外贸业务一站式客户跟进平台</p>
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
                placeholder="admin@crm.local"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition text-slate-900 placeholder:text-slate-400"
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
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35]/40 focus:border-[#FF6B35] outline-none transition text-slate-900 placeholder:text-slate-400"
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

          <p className="text-center text-xs text-slate-400 mt-6">
            默认管理员：admin@crm.local / admin123
          </p>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">YIMU Energy · 外贸版 CRM</p>
      </div>
    </div>
  );
}
