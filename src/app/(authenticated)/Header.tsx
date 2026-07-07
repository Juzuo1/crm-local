'use client';

import type { SessionUser } from '@/lib/auth';
import { logoutAction } from '@/app/actions';

export default function Header({ user }: { user: SessionUser }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-medium text-gray-600">
        欢迎回来，{user.name}
      </h1>

      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm text-gray-500 hover:text-red-600 transition cursor-pointer"
        >
          退出登录
        </button>
      </form>
    </header>
  );
}
