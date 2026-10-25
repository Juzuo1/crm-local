// 仅限服务端使用的 Supabase 管理员客户端（service_role 权限，可绕过 RLS）。
//
// 安全警告：
//   本文件只能在服务端代码中 import（API route / server action / instrumentation），
//   绝不能在客户端组件（'use client'）中出现，否则 service_role 密钥会泄露给浏览器。
//   所有客户端数据访问都必须经由本项目自带的 /api/* 接口，由服务端代查。
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 未配置环境变量时（如本地开发、或未部署）返回 false，存储层会自动回退到本地文件。
export const isSupabaseConfigured = Boolean(supabaseUrl && serviceRoleKey);

// 诊断用：返回当前生效的 Supabase 主机地址（仅主机名，不含任何密钥）。
// 用于部署后核对环境变量是否填对，例如 https://xxxx.supabase.co -> "xxxx.supabase.co"
export const supabaseHost = (() => {
  if (!supabaseUrl) return null;
  try {
    return new URL(supabaseUrl).host;
  } catch {
    return `INVALID_URL(${supabaseUrl})`;
  }
})();

export const supabaseAdmin = isSupabaseConfigured
  ? createClient(supabaseUrl as string, serviceRoleKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
