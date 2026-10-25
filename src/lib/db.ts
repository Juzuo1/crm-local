import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { DEFAULT_ROLE_PERMISSIONS, RolePermissions, RolePermissionConfig, DataScope } from './permissions';
import type { AuditLog } from './audit';
import { writeAuditLog, buildChangeDetail } from './audit';
import { supabaseAdmin, isSupabaseConfigured } from './supabaseServer';

// ============================================================
// 存储层说明：
//  - 配了 Supabase 环境变量 → 读写云端数据库（多人共享、可上线）
//  - 未配置 → 自动回退本地文件 ./data/crm.json（本地开发/演示）
// 所有业务逻辑（过滤、统计、权限）保持不变，仅底层 IO 改为异步。
// ============================================================

const DB_DIR = path.resolve('./data');
const DB_FILE = path.join(DB_DIR, 'crm.json');
const LOCK_FILE = path.join(DB_DIR, 'crm.lock');

interface Database {
  users: User[];
  customers: Customer[];
  followups: Followup[];
  segments: Segment[];
  departments: Department[];
  role_permissions: RolePermissions;
  audit_logs: AuditLog[];
  sea_pool_rules: SeaPoolRules;
}

const DEFAULT_SEA_POOL_RULES: SeaPoolRules = {
  enabled: true,
  days_to_fall: 7,
  excluded_stages: ['completed', 'lost'],
  claim_limit_per_day: 3,
};

// 内存工作副本（单实例内复用；云端模式下每次 saveDb 都会写回 Supabase，冷启动从云端拉取最新）
let db: Database | null = null;

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function nextId(collection: { id: number }[]): number {
  if (collection.length === 0) return 1;
  return Math.max(...collection.map((i) => i.id)) + 1;
}

// 首次加载时补齐默认数据（角色权限、公海规则、种子管理员）
function ensureSeed(): void {
  const database = db!;
  if (!database.role_permissions || Object.keys(database.role_permissions).length === 0) {
    database.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
  }
  if (!database.sea_pool_rules) {
    database.sea_pool_rules = { ...DEFAULT_SEA_POOL_RULES };
  }
  if (database.users.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    database.users.push({
      id: 1,
      name: '管理员',
      email: 'admin@crm.local',
      password_hash: hash,
      role: 'admin',
      department_id: null,
      is_active: 1,
      created_at: now(),
    });
  }
}

async function loadDb(): Promise<Database> {
  if (db) return db;

  if (isSupabaseConfigured && supabaseAdmin) {
    const [users, customers, followups, segments, departments, rolePerms, auditLogs, seaRules] =
      await Promise.all([
        supabaseAdmin.from('crm_users').select('*'),
        supabaseAdmin.from('crm_customers').select('*'),
        supabaseAdmin.from('crm_followups').select('*'),
        supabaseAdmin.from('crm_segments').select('*'),
        supabaseAdmin.from('crm_departments').select('*'),
        supabaseAdmin.from('crm_role_permissions').select('*'),
        supabaseAdmin.from('crm_audit_logs').select('*'),
        supabaseAdmin.from('crm_sea_pool_rules').select('*'),
      ]);

    db = {
      users: (users.data as unknown as User[]) || [],
      customers: (customers.data as unknown as Customer[]) || [],
      followups: (followups.data as unknown as Followup[]) || [],
      segments: (segments.data as unknown as Segment[]) || [],
      departments: (departments.data as unknown as Department[]) || [],
      role_permissions:
        rolePerms.data && rolePerms.data.length
          ? (Object.fromEntries(
              (rolePerms.data as { role: string; permissions: RolePermissions[string] }[]).map(
                (r) => [r.role, r.permissions],
              ),
            ) as RolePermissions)
          : JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
      audit_logs: (auditLogs.data as unknown as AuditLog[]) || [],
      sea_pool_rules:
        seaRules.data && (seaRules.data as SeaPoolRules[])[0]
          ? (seaRules.data as unknown as SeaPoolRules[])[0]
          : { ...DEFAULT_SEA_POOL_RULES },
    };
    ensureSeed();
    await saveDb();
    return db;
  }

  // —— 本地文件回退 ——
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } else {
    db = {
      users: [],
      customers: [],
      followups: [],
      segments: [],
      departments: [],
      role_permissions: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
      audit_logs: [],
      sea_pool_rules: { ...DEFAULT_SEA_POOL_RULES },
    };
  }
  ensureSeed();
  saveDbLocal();
  return db!;
}

async function saveDb(): Promise<void> {
  if (isSupabaseConfigured && supabaseAdmin) {
    await saveDbSupabase();
  } else {
    saveDbLocal();
  }
}

function saveDbLocal(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

async function saveDbSupabase(): Promise<void> {
  const d = db!;
  // 这些表不会真删（或软删），直接 upsert 全部
  await supabaseAdmin!.from('crm_customers').upsert(d.customers as never, { onConflict: 'id' });
  await supabaseAdmin!.from('crm_users').upsert(d.users as never, { onConflict: 'id' });
  await supabaseAdmin!.from('crm_followups').upsert(d.followups as never, { onConflict: 'id' });
  await supabaseAdmin!.from('crm_audit_logs').upsert(d.audit_logs as never, { onConflict: 'id' });
  // 这些表存在「硬删除」，先清空再插入，保证与内存一致
  await supabaseAdmin!.from('crm_departments').delete().neq('id', -1);
  if (d.departments.length) await supabaseAdmin!.from('crm_departments').insert(d.departments as never);
  await supabaseAdmin!.from('crm_segments').delete().neq('id', -1);
  if (d.segments.length) await supabaseAdmin!.from('crm_segments').insert(d.segments as never);
  await supabaseAdmin!.from('crm_role_permissions').delete().neq('role', '__never__');
  const rpRows = Object.entries(d.role_permissions).map(([role, permissions]) => ({ role, permissions }));
  if (rpRows.length) await supabaseAdmin!.from('crm_role_permissions').insert(rpRows as never);
  // 公海规则单行
  await supabaseAdmin!.from('crm_sea_pool_rules').upsert({ id: 1, ...d.sea_pool_rules } as never, {
    onConflict: 'id',
  });
}

// ========== 审计日志 ==========

export async function addAuditLog(entry: {
  user_id: number;
  user_name: string;
  action: string;
  target_type: AuditLog['target_type'];
  target_id: number;
  target_name: string;
  detail: Record<string, unknown>;
}): Promise<void> {
  const data = await loadDb();
  if (!data.audit_logs) data.audit_logs = [];
  writeAuditLog(data.audit_logs, entry);
  await saveDb();
}

export async function listAuditLogs(filters: {
  userId?: number;
  action?: string;
  targetType?: string;
  days?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: AuditLog[]; total: number }> {
  const data = await loadDb();
  if (!data.audit_logs) data.audit_logs = [];
  const { filterAuditLogs } = require('./audit');
  return filterAuditLogs(data.audit_logs, filters);
}

/** 获取客户当前值（审计用） */
export async function getCustomerSnapshot(id: number): Promise<Record<string, unknown> | null> {
  const data = await loadDb();
  const c = data.customers.find((x) => x.id === id && !x.deleted_at);
  if (!c) return null;
  const { ...rest } = c as unknown as Record<string, unknown>;
  delete (rest as Record<string, unknown>).password_hash;
  return rest;
}

/** 获取用户当前值（审计用） */
export async function getUserSnapshot(id: number): Promise<Record<string, unknown> | null> {
  const data = await loadDb();
  const u = data.users.find((x) => x.id === id);
  if (!u) return null;
  const { password_hash, ...rest } = u as unknown as Record<string, unknown>;
  return rest;
}

// ========== 权限辅助函数 ==========

/** 获取某个角色对某个模块的数据范围 */
export async function getDataScope(role: string, moduleKey: string): Promise<DataScope> {
  const perms = await getRolePermissions();
  const config = perms[role];
  if (!config) return 'own';
  if (config.permissions.includes('*')) return 'all';
  return config.dataScopes?.[moduleKey] || 'own';
}

/** 根据数据范围构建可见用户ID列表 */
export async function buildVisibleUserIds(userId: number, dataScope: DataScope): Promise<number[]> {
  if (dataScope === 'all') return [];
  if (dataScope === 'department') {
    const team = await getTeamMemberIds(userId);
    return [userId, ...team];
  }
  return [userId];
}

/** 检查角色是否拥有某个操作权限 */
export async function hasPermission(role: string, permKey: string): Promise<boolean> {
  const perms = await getRolePermissions();
  const config = perms[role];
  if (!config) return false;
  if (config.permissions.includes('*')) return true;
  return config.permissions.includes(permKey);
}

/** 检查权限并返回可见用户ID（一步完成，供 API 使用） */
export async function resolveAccess(
  userId: number,
  role: string,
  moduleKey: string,
  requiredPerm: string,
): Promise<{ allowed: boolean; visibleUserIds: number[] }> {
  if (!(await hasPermission(role, requiredPerm))) {
    return { allowed: false, visibleUserIds: [] };
  }
  const scope = await getDataScope(role, moduleKey);
  return { allowed: true, visibleUserIds: await buildVisibleUserIds(userId, scope) };
}

export interface Department {
  id: number;
  name: string;
  manager_id: number | null;
  created_at: string;
}

export interface Segment {
  id: number;
  name: string;
  type: 'system' | 'custom';
  filters: SegmentFilters;
  created_by: number;
  created_at: string;
}

export interface SegmentFilters {
  channels?: string[];
  levels?: string[];
  countries?: string[];
  tags?: string[];
  createdWithinDays?: number;
  followupWithinDays?: number;
  noFollowupDays?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'agent' | 'manager';
  department_id: number | null;
  is_active: number;
  created_at: string;
}

export interface Customer {
  id: number;
  contact_name: string;
  position: string;
  phone: string;
  email: string;
  company_name: string;
  country: string;
  source_channel: string;
  customer_level: string;
  stage: string;
  stage_updated_at: string | null;
  product_interests: string;
  tags: string;
  notes: string;
  assigned_to: number | null;
  last_followup_at: string | null;
  next_followup_at: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sea_pool_entered_at: string | null;
  sea_pool_claimed_at: string | null;
}

export interface SeaPoolRules {
  enabled: boolean;
  days_to_fall: number;
  excluded_stages: string[];
  claim_limit_per_day: number;
}

export interface Followup {
  id: number;
  customer_id: number;
  user_id: number;
  method: string;
  content: string;
  next_followup_at: string | null;
  created_at: string;
}

// ========== 用户查询 ==========

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const data = await loadDb();
  return data.users.find((u) => u.email === email);
}

export async function findUserById(id: number): Promise<User | undefined> {
  const data = await loadDb();
  return data.users.find((u) => u.id === id);
}

export async function listUsers(): Promise<Omit<User, 'password_hash'>[]> {
  const data = await loadDb();
  return data.users.map(({ password_hash, ...rest }) => rest);
}

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const data = await loadDb();
  const newUser: User = {
    ...user,
    id: nextId(data.users),
    created_at: now(),
  };
  data.users.push(newUser);
  await saveDb();
  return newUser;
}

export async function updateUserStatus(id: number, is_active: number): Promise<void> {
  const data = await loadDb();
  const user = data.users.find((u) => u.id === id);
  if (user) {
    user.is_active = is_active;
    await saveDb();
  }
}

export async function updateUser(
  id: number,
  updates: { name?: string; email?: string; role?: string },
): Promise<void> {
  const data = await loadDb();
  const user = data.users.find((u) => u.id === id);
  if (user) {
    if (updates.name) user.name = updates.name;
    if (updates.email) user.email = updates.email;
    if (updates.role) user.role = updates.role as User['role'];
    await saveDb();
  }
}

export async function updateUserPassword(id: number, newPassword: string): Promise<void> {
  const data = await loadDb();
  const user = data.users.find((u) => u.id === id);
  if (user) {
    user.password_hash = bcrypt.hashSync(newPassword, 10);
    await saveDb();
  }
}

export async function transferCustomers(fromUserId: number, toUserId: number): Promise<number> {
  const data = await loadDb();
  let count = 0;
  data.customers.forEach((c) => {
    if (!c.deleted_at && c.assigned_to === fromUserId) {
      c.assigned_to = toUserId;
      c.updated_at = now();
      count++;
    }
  });
  if (count > 0) await saveDb();
  return count;
}

export async function getTeamMemberIds(managerId: number): Promise<number[]> {
  const data = await loadDb();
  const dept = data.departments.find((d) => d.manager_id === managerId);
  if (!dept) return [];
  return data.users
    .filter((u) => u.department_id === dept.id && u.id !== managerId && u.is_active)
    .map((u) => u.id);
}

// ========== 部门管理 ==========

export async function listDepartments(): Promise<(Department & { manager_name: string; member_count: number })[]> {
  const data = await loadDb();
  if (!data.departments) data.departments = [];
  return data.departments.map((d) => {
    const manager = d.manager_id ? data.users.find((u) => u.id === d.manager_id) : null;
    const memberCount = data.users.filter((u) => u.department_id === d.id).length;
    return {
      ...d,
      manager_name: manager?.name || '未设置',
      member_count: memberCount,
    };
  });
}

export async function createDepartment(input: { name: string; manager_id?: number }): Promise<Department> {
  const data = await loadDb();
  if (!data.departments) data.departments = [];
  const dept: Department = {
    id: nextId(data.departments),
    name: input.name,
    manager_id: input.manager_id || null,
    created_at: now(),
  };
  data.departments.push(dept);
  await saveDb();
  return dept;
}

export async function updateDepartment(
  id: number,
  updates: { name?: string; manager_id?: number | null },
): Promise<void> {
  const data = await loadDb();
  if (!data.departments) data.departments = [];
  const dept = data.departments.find((d) => d.id === id);
  if (dept) {
    if (updates.name) dept.name = updates.name;
    if (updates.manager_id !== undefined) dept.manager_id = updates.manager_id;
    await saveDb();
  }
}

export async function deleteDepartment(id: number): Promise<void> {
  const data = await loadDb();
  if (!data.departments) return;
  data.departments = data.departments.filter((d) => d.id !== id);
  data.users.forEach((u) => {
    if (u.department_id === id) u.department_id = null;
  });
  await saveDb();
}

export async function setUserDepartment(userId: number, departmentId: number | null): Promise<void> {
  const data = await loadDb();
  const user = data.users.find((u) => u.id === userId);
  if (user) {
    user.department_id = departmentId;
    await saveDb();
  }
}

// ========== 客户查询 ==========

export interface CustomerFilters {
  search?: string;
  country?: string;
  channel?: string;
  level?: string;
  tag?: string;
  stage?: string;
  assignedTo?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  nextFollowupFrom?: string;
  nextFollowupTo?: string;
  visibleUserIds?: number[];
  page?: number;
  pageSize?: number;
}

export async function listCustomers(filters: CustomerFilters): Promise<{ data: Customer[]; total: number }> {
  const data = await loadDb();
  let filtered = data.customers.filter((c) => !c.deleted_at);

  if (filters.visibleUserIds && filters.visibleUserIds.length > 0) {
    filtered = filtered.filter(
      (c) => filters.visibleUserIds!.includes(c.assigned_to || 0) || c.assigned_to === null,
    );
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.contact_name.toLowerCase().includes(s) ||
        (c.company_name && c.company_name.toLowerCase().includes(s)) ||
        (c.email && c.email.toLowerCase().includes(s)) ||
        (c.phone && c.phone.toLowerCase().includes(s)),
    );
  }
  if (filters.country) filtered = filtered.filter((c) => c.country === filters.country);
  if (filters.channel) filtered = filtered.filter((c) => c.source_channel === filters.channel);
  if (filters.level) filtered = filtered.filter((c) => c.customer_level === filters.level);
  if (filters.tag) filtered = filtered.filter((c) => c.tags.includes(filters.tag!));
  if (filters.stage) filtered = filtered.filter((c) => c.stage === filters.stage);
  if (filters.assignedTo !== undefined) {
    if (filters.assignedTo === 0) {
      filtered = filtered.filter((c) => c.assigned_to === null || c.assigned_to === 0);
    } else {
      filtered = filtered.filter((c) => c.assigned_to === filters.assignedTo);
    }
  }
  if (filters.createdAtFrom) filtered = filtered.filter((c) => c.created_at >= filters.createdAtFrom!);
  if (filters.createdAtTo) {
    filtered = filtered.filter((c) => c.created_at <= filters.createdAtTo! + 'T23:59:59');
  }
  if (filters.nextFollowupFrom) {
    filtered = filtered.filter(
      (c) => c.next_followup_at && c.next_followup_at >= filters.nextFollowupFrom!,
    );
  }
  if (filters.nextFollowupTo) {
    filtered = filtered.filter(
      (c) => c.next_followup_at && c.next_followup_at <= filters.nextFollowupTo! + 'T23:59:59',
    );
  }

  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = filtered.length;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  return { data: paged, total };
}

export async function findCustomerById(id: number): Promise<Customer | undefined> {
  const data = await loadDb();
  return data.customers.find((c) => c.id === id && !c.deleted_at);
}

export async function createCustomer(
  input: Partial<Customer> & { contact_name: string; created_by: number },
): Promise<Customer> {
  const data = await loadDb();
  const customer: Customer = {
    id: nextId(data.customers),
    contact_name: input.contact_name,
    position: input.position || '',
    phone: input.phone || '',
    email: input.email || '',
    company_name: input.company_name || '',
    country: input.country || '',
    source_channel: input.source_channel || '',
    customer_level: input.customer_level || 'C',
    stage: input.stage || 'new_lead',
    stage_updated_at: now(),
    product_interests: input.product_interests || '[]',
    tags: input.tags || '[]',
    notes: input.notes || '',
    assigned_to: input.assigned_to ?? null,
    last_followup_at: null,
    next_followup_at: input.next_followup_at || null,
    created_by: input.created_by,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
    sea_pool_entered_at: null,
    sea_pool_claimed_at: null,
  };
  data.customers.push(customer);
  await saveDb();
  return customer;
}

export async function updateCustomer(id: number, updates: Partial<Customer>): Promise<void> {
  const data = await loadDb();
  const idx = data.customers.findIndex((c) => c.id === id);
  if (idx >= 0) {
    data.customers[idx] = {
      ...data.customers[idx],
      ...updates,
      id,
      updated_at: now(),
    };
    await saveDb();
  }
}

export async function softDeleteCustomer(id: number): Promise<void> {
  const data = await loadDb();
  const customer = data.customers.find((c) => c.id === id);
  if (customer) {
    customer.deleted_at = now();
    await saveDb();
  }
}

// ========== 跟进记录 ==========

export async function listFollowups(customerId: number): Promise<(Followup & { user_name: string })[]> {
  const data = await loadDb();
  return data.followups
    .filter((f) => f.customer_id === customerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((f) => {
      const user = data.users.find((u) => u.id === f.user_id);
      return { ...f, user_name: user?.name || '未知' };
    });
}

export interface FollowupWithDetails extends Followup {
  user_name: string;
  customer_name: string;
  company_name: string;
  customer_phone: string;
  customer_email: string;
  customer_channel: string;
}

export async function listAllFollowups(filters: {
  visibleUserIds?: number[];
  page?: number;
  pageSize?: number;
  method?: string;
  days?: number;
  search?: string;
  channel?: string;
  filterUserId?: number;
}): Promise<{ data: FollowupWithDetails[]; total: number }> {
  const data = await loadDb();
  const activeCustomers = new Set(data.customers.filter((c) => !c.deleted_at).map((c) => c.id));

  let followups = data.followups.filter((f) => activeCustomers.has(f.customer_id));

  if (filters.visibleUserIds && filters.visibleUserIds.length > 0) {
    followups = followups.filter((f) => filters.visibleUserIds!.includes(f.user_id));
  }
  if (filters.filterUserId) {
    followups = followups.filter((f) => f.user_id === filters.filterUserId);
  }
  if (filters.method) {
    followups = followups.filter((f) => f.method === filters.method);
  }
  if (filters.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.days);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    followups = followups.filter((f) => f.created_at >= cutoffStr);
  }

  let enriched = followups.map((f) => {
    const cu = data.customers.find((c) => c.id === f.customer_id);
    const us = data.users.find((u) => u.id === f.user_id);
    return {
      ...f,
      user_name: us?.name || '未知',
      customer_name: cu?.contact_name || '未知',
      company_name: cu?.company_name || '',
      customer_phone: cu?.phone || '',
      customer_email: cu?.email || '',
      customer_channel: cu?.source_channel || '',
    };
  });

  if (filters.search) {
    const s = filters.search.toLowerCase();
    enriched = enriched.filter(
      (f) =>
        f.customer_name.toLowerCase().includes(s) ||
        f.customer_phone.toLowerCase().includes(s) ||
        f.customer_email.toLowerCase().includes(s) ||
        f.company_name.toLowerCase().includes(s),
    );
  }
  if (filters.channel) {
    enriched = enriched.filter((f) => f.customer_channel === filters.channel);
  }

  enriched.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = enriched.length;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 30;
  const paged = enriched.slice((page - 1) * pageSize, page * pageSize);
  return { data: paged, total };
}

export async function createFollowup(input: {
  customer_id: number;
  user_id: number;
  method: string;
  content: string;
  next_followup_at: string | null;
}): Promise<Followup> {
  const data = await loadDb();
  const followup: Followup = {
    id: nextId(data.followups),
    customer_id: input.customer_id,
    user_id: input.user_id,
    method: input.method,
    content: input.content,
    next_followup_at: input.next_followup_at,
    created_at: now(),
  };
  data.followups.push(followup);

  const customer = data.customers.find((c) => c.id === input.customer_id);
  if (customer) {
    customer.last_followup_at = now();
    if (input.next_followup_at) {
      customer.next_followup_at = input.next_followup_at;
    }
    customer.updated_at = now();
  }
  await saveDb();
  return followup;
}

// ========== 仪表盘统计 ==========

export interface DashboardStats {
  totalCustomers: number;
  newThisMonth: number;
  pendingFollowup: number;
  levelDistribution: { customer_level: string; count: number }[];
  channelDistribution: { source_channel: string; count: number }[];
  stageDistribution: { stage: string; count: number }[];
  recentCustomers: Customer[];
  followupAlerts: Customer[];
}

export async function getDashboardStats(visibleUserIds: number[]): Promise<DashboardStats> {
  const data = await loadDb();
  const active = data.customers.filter((c) => !c.deleted_at);

  const filtered =
    visibleUserIds.length === 0
      ? active
      : active.filter(
          (c) => visibleUserIds.includes(c.assigned_to || 0) || c.assigned_to === null,
        );

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const thisMonthStr = thisMonthStart.toISOString().replace('T', ' ').slice(0, 19);

  const nowStr = now();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().replace('T', ' ').slice(0, 10);

  const levelMap: Record<string, number> = {};
  const channelMap: Record<string, number> = {};
  const stageMap: Record<string, number> = {};
  filtered.forEach((c) => {
    levelMap[c.customer_level] = (levelMap[c.customer_level] || 0) + 1;
    if (c.source_channel) {
      channelMap[c.source_channel] = (channelMap[c.source_channel] || 0) + 1;
    }
    const s = c.stage || 'new_lead';
    stageMap[s] = (stageMap[s] || 0) + 1;
  });

  const pending = filtered
    .filter((c) => c.next_followup_at && c.next_followup_at <= tomorrowStr)
    .sort((a, b) => (a.next_followup_at || '').localeCompare(b.next_followup_at || ''));

  const recent = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);

  return {
    totalCustomers: filtered.length,
    newThisMonth: filtered.filter((c) => c.created_at >= thisMonthStr).length,
    pendingFollowup: pending.length,
    levelDistribution: Object.entries(levelMap).map(([customer_level, count]) => ({
      customer_level,
      count,
    })),
    channelDistribution: Object.entries(channelMap)
      .map(([source_channel, count]) => ({ source_channel, count }))
      .sort((a, b) => b.count - a.count),
    stageDistribution: Object.entries(stageMap)
      .map(([stage, count]) => ({ stage, count }))
      .sort((a, b) => b.count - a.count),
    recentCustomers: recent,
    followupAlerts: pending.slice(0, 10),
  };
}

// ========== 客群管理 ==========

function getSystemSegmentDefs(): Omit<Segment, 'id' | 'created_by' | 'created_at'>[] {
  return [
    { name: 'Facebook客户', type: 'system', filters: { channels: ['facebook'] } },
    { name: 'TikTok客户', type: 'system', filters: { channels: ['tiktok'] } },
    { name: '阿里国际站客户', type: 'system', filters: { channels: ['alibaba'] } },
    { name: '独立站客户', type: 'system', filters: { channels: ['website'] } },
    { name: '展会客户', type: 'system', filters: { channels: ['exhibition'] } },
    { name: '自主开发客户', type: 'system', filters: { channels: ['self_dev'] } },
    { name: 'A级-高价值客户', type: 'system', filters: { levels: ['A'] } },
    { name: 'B级-意向强客户', type: 'system', filters: { levels: ['B'] } },
    { name: 'C级-待培育客户', type: 'system', filters: { levels: ['C'] } },
    { name: 'D级-无效客户', type: 'system', filters: { levels: ['D'] } },
    { name: '近7天新增', type: 'system', filters: { createdWithinDays: 7 } },
    { name: '近30天新增', type: 'system', filters: { createdWithinDays: 30 } },
    { name: '近90天新增', type: 'system', filters: { createdWithinDays: 90 } },
    { name: '今日需跟进', type: 'system', filters: { followupWithinDays: 1 } },
    { name: '近7天需跟进', type: 'system', filters: { followupWithinDays: 7 } },
    { name: '超30天未跟进', type: 'system', filters: { noFollowupDays: 30 } },
    { name: 'Facebook A级客户', type: 'system', filters: { channels: ['facebook'], levels: ['A'] } },
    { name: '阿里 A/B级客户', type: 'system', filters: { channels: ['alibaba'], levels: ['A', 'B'] } },
    { name: '近30天A/B级新客', type: 'system', filters: { createdWithinDays: 30, levels: ['A', 'B'] } },
  ];
}

async function ensureSystemSegments(): Promise<void> {
  const data = await loadDb();
  if (!data.segments) data.segments = [];

  const defs = getSystemSegmentDefs();
  for (const def of defs) {
    const exists = data.segments.find((s) => s.type === 'system' && s.name === def.name);
    if (!exists) {
      data.segments.push({
        ...def,
        id: nextId(data.segments),
        created_by: 0,
        created_at: now(),
      });
    }
  }
  await saveDb();
}

function countSegmentCustomers(filters: SegmentFilters, activeCustomers: Customer[]): number {
  let filtered = [...activeCustomers];
  if (filters.channels && filters.channels.length > 0) {
    filtered = filtered.filter((c) => filters.channels!.includes(c.source_channel));
  }
  if (filters.levels && filters.levels.length > 0) {
    filtered = filtered.filter((c) => filters.levels!.includes(c.customer_level));
  }
  if (filters.countries && filters.countries.length > 0) {
    filtered = filtered.filter((c) => filters.countries!.includes(c.country));
  }
  if (filters.tags && filters.tags.length > 0) {
    filtered = filtered.filter((c) => {
      try {
        const tags: string[] = JSON.parse(c.tags || '[]');
        return filters.tags!.some((t) => tags.includes(t));
      } catch {
        return false;
      }
    });
  }
  if (filters.createdWithinDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.createdWithinDays);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    filtered = filtered.filter((c) => c.created_at >= cutoffStr);
  }
  if (filters.followupWithinDays) {
    const future = new Date();
    future.setDate(future.getDate() + filters.followupWithinDays);
    const futureStr = future.toISOString().replace('T', ' ').slice(0, 10);
    filtered = filtered.filter((c) => c.next_followup_at && c.next_followup_at <= futureStr);
  }
  if (filters.noFollowupDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.noFollowupDays);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    filtered = filtered.filter(
      (c) => !c.last_followup_at || c.last_followup_at < cutoffStr,
    );
  }
  return filtered.length;
}

export interface SegmentWithCount extends Segment {
  customerCount: number;
}

export async function listSegments(visibleUserIds: number[]): Promise<SegmentWithCount[]> {
  await ensureSystemSegments();
  const data = await loadDb();
  const active = data.customers.filter((c) => !c.deleted_at);
  const filtered =
    visibleUserIds.length === 0
      ? active
      : active.filter(
          (c) => visibleUserIds.includes(c.assigned_to || 0) || c.assigned_to === null,
        );
  const allSegments = [...data.segments];
  return allSegments.map((s) => ({
    ...s,
    customerCount: countSegmentCustomers(s.filters, filtered),
  }));
}

export async function getSegmentById(id: number): Promise<Segment | undefined> {
  const data = await loadDb();
  return data.segments.find((s) => s.id === id);
}

export async function createCustomSegment(input: {
  name: string;
  filters: SegmentFilters;
  created_by: number;
}): Promise<Segment> {
  const data = await loadDb();
  if (!data.segments) data.segments = [];
  const segment: Segment = {
    id: nextId(data.segments),
    name: input.name,
    type: 'custom',
    filters: input.filters,
    created_by: input.created_by,
    created_at: now(),
  };
  data.segments.push(segment);
  await saveDb();
  return segment;
}

export async function deleteSegment(id: number): Promise<boolean> {
  const data = await loadDb();
  const idx = data.segments.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  const seg = data.segments[idx];
  if (seg.type === 'system') return false;
  data.segments.splice(idx, 1);
  await saveDb();
  return true;
}

export async function getSegmentCustomers(
  segmentId: number,
  visibleUserIds: number[],
): Promise<Customer[]> {
  const segment = await getSegmentById(segmentId);
  if (!segment) return [];
  const data = await loadDb();
  const active = data.customers.filter((c) => !c.deleted_at);
  const filtered =
    visibleUserIds.length === 0
      ? active
      : active.filter(
          (c) => visibleUserIds.includes(c.assigned_to || 0) || c.assigned_to === null,
        );
  return filterBySegment(filtered, segment.filters);
}

export function filterBySegment(customers: Customer[], filters: SegmentFilters): Customer[] {
  let result = [...customers];
  if (filters.channels && filters.channels.length > 0) {
    result = result.filter((c) => filters.channels!.includes(c.source_channel));
  }
  if (filters.levels && filters.levels.length > 0) {
    result = result.filter((c) => filters.levels!.includes(c.customer_level));
  }
  if (filters.countries && filters.countries.length > 0) {
    result = result.filter((c) => filters.countries!.includes(c.country));
  }
  if (filters.tags && filters.tags.length > 0) {
    result = result.filter((c) => {
      try {
        const tags: string[] = JSON.parse(c.tags || '[]');
        return filters.tags!.some((t) => tags.includes(t));
      } catch {
        return false;
      }
    });
  }
  if (filters.createdWithinDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.createdWithinDays);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    result = result.filter((c) => c.created_at >= cutoffStr);
  }
  if (filters.followupWithinDays) {
    const future = new Date();
    future.setDate(future.getDate() + filters.followupWithinDays);
    const futureStr = future.toISOString().replace('T', ' ').slice(0, 10);
    result = result.filter((c) => c.next_followup_at && c.next_followup_at <= futureStr);
  }
  if (filters.noFollowupDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.noFollowupDays);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    result = result.filter(
      (c) => !c.last_followup_at || c.last_followup_at < cutoffStr,
    );
  }
  return result;
}

// ========== 角色权限管理 ==========

export async function getRolePermissions(): Promise<RolePermissions> {
  const data = await loadDb();
  if (!data.role_permissions || Object.keys(data.role_permissions).length === 0) {
    data.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    await saveDb();
    return data.role_permissions;
  }
  const firstValue = data.role_permissions[Object.keys(data.role_permissions)[0]];
  if (Array.isArray(firstValue)) {
    data.role_permissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    await saveDb();
    return data.role_permissions;
  }
  return data.role_permissions;
}

export async function updateRolePermissions(permissions: RolePermissions): Promise<void> {
  const data = await loadDb();
  data.role_permissions = permissions;
  await saveDb();
}

// ========== 公海客户管理 ==========

export async function getSeaPoolRules(): Promise<SeaPoolRules> {
  const data = await loadDb();
  if (!data.sea_pool_rules) {
    data.sea_pool_rules = { ...DEFAULT_SEA_POOL_RULES };
    await saveDb();
  }
  return data.sea_pool_rules;
}

export async function updateSeaPoolRules(updates: Partial<SeaPoolRules>): Promise<void> {
  const data = await loadDb();
  data.sea_pool_rules = { ...data.sea_pool_rules, ...updates };
  await saveDb();
}

export function isInSeaPool(customer: Customer): boolean {
  if (customer.deleted_at) return false;
  if (customer.assigned_to !== null) return false;
  const rules = getSeaPoolRulesSync();
  if (rules.excluded_stages.includes(customer.stage)) return false;
  return true;
}

// 同步读取公海规则（isInSeaPool 为纯函数，避免在热路径引入 async）
function getSeaPoolRulesSync(): SeaPoolRules {
  // 优先用内存副本，避免在纯函数里触发异步 IO
  if (db && db.sea_pool_rules) return db.sea_pool_rules;
  return { ...DEFAULT_SEA_POOL_RULES };
}

export async function listSeaPoolCustomers(filters: {
  search?: string;
  country?: string;
  channel?: string;
  level?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: Customer[]; total: number; stats: { total: number; weekFell: number; todayClaimed: number } }> {
  const data = await loadDb();
  const rules = await getSeaPoolRules();
  let pool = data.customers.filter((c) => isInSeaPool(c));

  const total = pool.length;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().replace('T', ' ').slice(0, 19);
  const weekFell = pool.filter(
    (c) => c.sea_pool_entered_at && c.sea_pool_entered_at >= weekAgoStr,
  ).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayClaimed = pool.filter(
    (c) => c.sea_pool_claimed_at && c.sea_pool_claimed_at.slice(0, 10) === todayStr,
  ).length;

  if (filters.search) {
    const s = filters.search.toLowerCase();
    pool = pool.filter(
      (c) =>
        c.contact_name.toLowerCase().includes(s) ||
        (c.company_name && c.company_name.toLowerCase().includes(s)) ||
        (c.email && c.email.toLowerCase().includes(s)),
    );
  }
  if (filters.country) pool = pool.filter((c) => c.country === filters.country);
  if (filters.channel) pool = pool.filter((c) => c.source_channel === filters.channel);
  if (filters.level) pool = pool.filter((c) => c.customer_level === filters.level);

  pool.sort((a, b) => {
    const ta = a.sea_pool_entered_at || a.created_at;
    const tb = b.sea_pool_entered_at || b.created_at;
    return tb.localeCompare(ta);
  });

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const paged = pool.slice((page - 1) * pageSize, page * pageSize);
  return { data: paged, total, stats: { total, weekFell, todayClaimed } };
}

export async function claimSeaCustomer(
  customerId: number,
  userId: number,
): Promise<{ success: boolean; error?: string }> {
  const data = await loadDb();
  const customer = data.customers.find((c) => c.id === customerId && !c.deleted_at);
  if (!customer) return { success: false, error: '客户不存在' };
  if (!isInSeaPool(customer)) return { success: false, error: '该客户不在公海中' };

  const rules = await getSeaPoolRules();
  const claimer = data.users.find((u) => u.id === userId);
  if (claimer && claimer.role !== 'admin' && rules.claim_limit_per_day > 0) {
    const todayStr = now().slice(0, 10);
    const todayClaims = data.customers.filter(
      (c) =>
        c.sea_pool_claimed_at &&
        c.sea_pool_claimed_at.slice(0, 10) === todayStr &&
        c.assigned_to === userId,
    ).length;
    if (todayClaims >= rules.claim_limit_per_day) {
      return { success: false, error: `今日领取已达上限（${rules.claim_limit_per_day}个/天）` };
    }
  }

  customer.assigned_to = userId;
  customer.sea_pool_claimed_at = now();
  customer.updated_at = now();
  await saveDb();
  return { success: true };
}

export async function pushToSeaPool(customerIds: number[]): Promise<number> {
  const data = await loadDb();
  const rules = await getSeaPoolRules();
  let count = 0;
  for (const cid of customerIds) {
    const customer = data.customers.find((c) => c.id === cid && !c.deleted_at);
    if (customer && !rules.excluded_stages.includes(customer.stage)) {
      customer.assigned_to = null;
      customer.sea_pool_entered_at = now();
      customer.sea_pool_claimed_at = null;
      customer.updated_at = now();
      count++;
    }
  }
  if (count > 0) await saveDb();
  return count;
}

export async function checkSeaPoolFall(): Promise<{
  fell: number;
  details: { id: number; name: string; former_assignee: string }[];
}> {
  const data = await loadDb();
  const rules = await getSeaPoolRules();
  if (!rules.enabled) return { fell: 0, details: [] };

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - rules.days_to_fall);
  const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);

  const details: { id: number; name: string; former_assignee: string }[] = [];
  for (const customer of data.customers) {
    if (!customer.assigned_to) continue;
    if (customer.deleted_at) continue;
    if (rules.excluded_stages.includes(customer.stage)) continue;
    const referenceTime = customer.last_followup_at || customer.created_at;
    if (referenceTime < cutoffStr) {
      const formerUser = data.users.find((u) => u.id === customer.assigned_to);
      details.push({
        id: customer.id,
        name: customer.contact_name,
        former_assignee: formerUser?.name || '未知',
      });
      customer.assigned_to = null;
      customer.sea_pool_entered_at = now();
      customer.sea_pool_claimed_at = null;
      customer.updated_at = now();
    }
  }
  if (details.length > 0) await saveDb();
  return { fell: details.length, details };
}

export async function getTodayClaimCount(userId: number): Promise<number> {
  const data = await loadDb();
  const todayStr = now().slice(0, 10);
  return data.customers.filter(
    (c) =>
      c.assigned_to === userId &&
      c.sea_pool_claimed_at &&
      c.sea_pool_claimed_at.slice(0, 10) === todayStr,
  ).length;
}
