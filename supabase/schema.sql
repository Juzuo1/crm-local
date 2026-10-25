-- ============================================================
-- YIMU CRM 数据库结构 (Supabase / PostgreSQL)
-- 用途：把原「本地文件存储」迁移到云端数据库，支持多人共享。
-- 执行方式：登录 Supabase 控制台 → SQL Editor → 粘贴本文件 → Run。
-- 说明：表名统一前缀 crm_，与同一 Supabase 项目下的其他系统隔离。
--       主键由应用层管理（普通 integer），不使用数据库自增，避免迁移/同步冲突。
-- ============================================================

-- ---------- 用户表 ----------
create table if not exists crm_users (
  id integer primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'agent',
  department_id integer,
  is_active integer not null default 1,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ---------- 部门表 ----------
create table if not exists crm_departments (
  id integer primary key,
  name text not null,
  manager_id integer,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ---------- 客户表 ----------
create table if not exists crm_customers (
  id integer primary key,
  contact_name text,
  position text default '',
  phone text default '',
  email text default '',
  company_name text default '',
  country text default '',
  source_channel text default '',
  customer_level text default 'C',
  stage text default 'new_lead',
  stage_updated_at text,
  product_interests text default '[]',
  tags text default '[]',
  notes text default '',
  assigned_to integer,
  last_followup_at text,
  next_followup_at text,
  created_by integer,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  deleted_at text,
  sea_pool_entered_at text,
  sea_pool_claimed_at text
);

-- ---------- 跟进记录表 ----------
create table if not exists crm_followups (
  id integer primary key,
  customer_id integer not null,
  user_id integer not null,
  method text default '',
  content text default '',
  next_followup_at text,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ---------- 客群表 ----------
create table if not exists crm_segments (
  id integer primary key,
  name text not null,
  type text not null default 'custom',
  filters jsonb not null default '{}'::jsonb,
  created_by integer not null default 0,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ---------- 角色权限表 ----------
create table if not exists crm_role_permissions (
  role text primary key,
  permissions jsonb not null
);

-- ---------- 操作日志表 ----------
create table if not exists crm_audit_logs (
  id integer primary key,
  user_id integer not null,
  user_name text not null,
  action text not null,
  target_type text not null,
  target_id integer not null,
  target_name text not null default '',
  detail jsonb not null default '{}'::jsonb,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

-- ---------- 公海规则表（单行，id=1） ----------
create table if not exists crm_sea_pool_rules (
  id integer primary key default 1,
  enabled boolean not null default true,
  days_to_fall integer not null default 7,
  excluded_stages jsonb not null default '["completed","lost"]'::jsonb,
  claim_limit_per_day integer not null default 3
);

-- ---------- 安全：开启 RLS，不建策略 ----------
-- 开启行级安全后，未授权角色（anon）一律被拒；service_role 自动绕过 RLS。
-- 本系统所有数据访问都走服务端 API（使用 service_role），客户端不直接连库。
alter table crm_users enable row level security;
alter table crm_departments enable row level security;
alter table crm_customers enable row level security;
alter table crm_followups enable row level security;
alter table crm_segments enable row level security;
alter table crm_role_permissions enable row level security;
alter table crm_audit_logs enable row level security;
alter table crm_sea_pool_rules enable row level security;

-- ---------- 索引（提升查询性能） ----------
create index if not exists idx_crm_customers_assigned on crm_customers(assigned_to);
create index if not exists idx_crm_customers_deleted on crm_customers(deleted_at);
create index if not exists idx_crm_followups_customer on crm_followups(customer_id);
create index if not exists idx_crm_audit_user on crm_audit_logs(user_id);
