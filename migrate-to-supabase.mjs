// ============================================================
// 迁移脚本：把本地 data/crm.json 的数据写入 Supabase 云端数据库
// 适用场景：你之前在本地积累了一批客户/部门/用户数据，想一次性搬到线上。
// 全新部署（云端从零开始）无需运行本脚本，系统首次访问会自动创建管理员并初始化。
//
// 用法：
//   1) 在 .env.local 中填好 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
//   2) 在 crm-local 根目录运行：node migrate-to-supabase.mjs
//
// 注意：本脚本只读本地文件，不会删除本地数据；也不会清空云端已有数据之外的东西。
// ============================================================

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 简单读取 .env.local（若存在），避免额外依赖
function loadEnvLocal() {
  const p = './.env.local';
  if (fs.existsSync(p)) {
    const txt = fs.readFileSync(p, 'utf-8');
    for (const line of txt.split('\n')) {
      if (line.startsWith('#') || !line.trim()) continue;
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY，请先在 .env.local 填写。');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const jsonPath = './data/crm.json';
if (!fs.existsSync(jsonPath)) {
  console.error('⚠️ 未找到 data/crm.json。');
  console.error('   如果是全新部署，无需迁移，系统首次访问会自动初始化；');
  console.error('   如果想保留本地数据，请先本地运行一次 npm run dev 生成 data/crm.json。');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

async function main() {
  console.log('开始迁移到 Supabase...');

  if (db.users?.length) {
    const { error } = await supabase.from('crm_users').upsert(db.users, { onConflict: 'id' });
    if (error) throw error;
  }
  if (db.customers?.length) {
    const { error } = await supabase.from('crm_customers').upsert(db.customers, { onConflict: 'id' });
    if (error) throw error;
  }
  if (db.followups?.length) {
    const { error } = await supabase.from('crm_followups').upsert(db.followups, { onConflict: 'id' });
    if (error) throw error;
  }
  if (db.departments?.length) {
    await supabase.from('crm_departments').delete().neq('id', -1);
    const { error } = await supabase.from('crm_departments').insert(db.departments);
    if (error) throw error;
  }
  if (db.segments?.length) {
    await supabase.from('crm_segments').delete().neq('id', -1);
    const { error } = await supabase.from('crm_segments').insert(db.segments);
    if (error) throw error;
  }
  if (db.role_permissions) {
    const rp = Object.entries(db.role_permissions).map(([role, permissions]) => ({ role, permissions }));
    await supabase.from('crm_role_permissions').delete().neq('role', '__never__');
    const { error } = await supabase.from('crm_role_permissions').insert(rp);
    if (error) throw error;
  }
  if (db.audit_logs?.length) {
    const { error } = await supabase.from('crm_audit_logs').upsert(db.audit_logs, { onConflict: 'id' });
    if (error) throw error;
  }
  if (db.sea_pool_rules) {
    const { error } = await supabase.from('crm_sea_pool_rules').upsert({ id: 1, ...db.sea_pool_rules }, { onConflict: 'id' });
    if (error) throw error;
  }

  console.log('✅ 迁移完成：', {
    用户: db.users?.length || 0,
    客户: db.customers?.length || 0,
    跟进: db.followups?.length || 0,
    部门: db.departments?.length || 0,
    客群: db.segments?.length || 0,
    日志: db.audit_logs?.length || 0,
  });
}

main().catch((e) => {
  console.error('❌ 迁移失败：', e.message || e);
  process.exit(1);
});
