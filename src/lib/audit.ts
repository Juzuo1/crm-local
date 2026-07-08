// ============================================================
// 操作日志记录模块
// ============================================================

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  target_type: 'customer' | 'followup' | 'user' | 'department';
  target_id: number;
  target_name: string;
  detail: string; // JSON 字符串
  created_at: string;
}

function now(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

/** 判断两个值是否不相等 */
function changed(oldVal: unknown, newVal: unknown): boolean {
  if (oldVal === newVal) return false;
  if (oldVal == null && newVal == null) return false;
  return true;
}

/** 获取下一个ID */
export function nextAuditId(list: AuditLog[]): number {
  if (list.length === 0) return 1;
  return Math.max(...list.map(l => l.id)) + 1;
}

/** 记录一条操作日志 */
export function writeAuditLog(
  logs: AuditLog[],
  input: {
    user_id: number;
    user_name: string;
    action: string;
    target_type: AuditLog['target_type'];
    target_id: number;
    target_name: string;
    detail: Record<string, unknown>;
  },
): void {
  logs.push({
    id: nextAuditId(logs),
    user_id: input.user_id,
    user_name: input.user_name,
    action: input.action,
    target_type: input.target_type,
    target_id: input.target_id,
    target_name: input.target_name,
    detail: JSON.stringify(input.detail, null, 0),
    created_at: now(),
  });
}

/** 构建字段变更描述的简化版 */
export function buildChangeDetail(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>,
  trackedFields: string[],
): Record<string, { from: unknown; to: unknown }> {
  const detail: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of trackedFields) {
    const o = oldData[field] ?? '';
    const n = newData[field] ?? '';
    if (changed(o, n)) {
      detail[field] = { from: o, to: n };
    }
  }
  return detail;
}

/** 字段中文名映射 */
export const FIELD_LABELS: Record<string, string> = {
  contact_name: '联系人',
  position: '职位',
  phone: '手机',
  email: '邮箱',
  company_name: '公司',
  country: '国家',
  source_channel: '渠道',
  customer_level: '等级',
  stage: '阶段',
  product_interests: '产品兴趣',
  tags: '标签',
  notes: '备注',
  assigned_to: '负责人',
  next_followup_at: '下次跟进时间',
  name: '姓名',
  role: '角色',
  is_active: '状态',
  method: '跟进方式',
  content: '跟进内容',
};

/** 生成人类可读的变更摘要 */
export function summarizeChanges(
  detail: Record<string, { from: unknown; to: unknown }>,
): string {
  const parts = Object.entries(detail).map(([field, { from, to }]) => {
    const label = FIELD_LABELS[field] || field;
    const f = typeof from === 'string' && from.length > 40 ? from.slice(0, 40) + '...' : String(from || '(空)');
    const t = typeof to === 'string' && to.length > 40 ? to.slice(0, 40) + '...' : String(to || '(空)');
    return `${label}: ${f} → ${t}`;
  });
  return parts.join('; ') || '无变更';
}

/** 操作类型的可读标签 */
export const ACTION_LABELS: Record<string, string> = {
  'customer.create': '新增客户',
  'customer.update': '编辑客户',
  'customer.delete': '删除客户',
  'customer.restore': '恢复客户',
  'customer.assign': '分配客户',
  'followup.create': '添加跟进',
  'followup.delete': '删除跟进',
  'user.create': '创建用户',
  'user.update': '编辑用户',
  'user.reset_pwd': '重置密码',
  'user.toggle': '启用/停用用户',
  'user.transfer': '客户交接',
  'department.create': '创建部门',
  'department.update': '编辑部门',
  'department.delete': '删除部门',
  'department.add_member': '添加部门成员',
  'department.remove_member': '移除部门成员',
  'customer.sea_fall': '自动掉入公海',
  'customer.sea_push': '手动推入公海',
  'customer.sea_claim': '领取公海客户',
};

/** 筛选操作日志 */
export function filterAuditLogs(
  logs: AuditLog[],
  filters: {
    userId?: number;
    action?: string;
    targetType?: string;
    days?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  },
): { data: AuditLog[]; total: number } {
  let filtered = [...logs];

  if (filters.userId) {
    filtered = filtered.filter(l => l.user_id === filters.userId);
  }
  if (filters.action) {
    filtered = filtered.filter(l => l.action === filters.action);
  }
  if (filters.targetType) {
    filtered = filtered.filter(l => l.target_type === filters.targetType);
  }
  if (filters.days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filters.days);
    const cutoffStr = cutoff.toISOString().replace('T', ' ').slice(0, 19);
    filtered = filtered.filter(l => l.created_at >= cutoffStr);
  }
  if (filters.search) {
    const s = filters.search.toLowerCase();
    filtered = filtered.filter(l =>
      l.target_name.toLowerCase().includes(s) ||
      l.user_name.toLowerCase().includes(s)
    );
  }

  // 按时间倒序
  filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));

  const total = filtered.length;
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 30;
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return { data: paged, total };
}
