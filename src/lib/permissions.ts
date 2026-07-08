// ============================================================
// 完整权限定义 — 外贸客户管理系统
// ============================================================

/** 数据范围 */
export type DataScope = 'own' | 'department' | 'all';

/** 权限组定义 */
export interface PermissionGroup {
  key: string;
  label: string;
  icon: string;
  /** 该组下的操作权限 */
  permissions: PermissionDef[];
  /** 是否包含数据范围设置 */
  hasDataScope: boolean;
}

export interface PermissionDef {
  key: string;
  label: string;
  desc: string;
}

// ============================================================
// 所有权限组
// ============================================================

export const PERMISSION_GROUPS: PermissionGroup[] = [
  // -------- 仪表盘 --------
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: '📊',
    hasDataScope: true,
    permissions: [
      { key: 'dashboard.view', label: '查看仪表盘', desc: '访问仪表盘页面，查看统计数据' },
    ],
  },

  // -------- 客户管理 --------
  {
    key: 'customers',
    label: '客户管理',
    icon: '👥',
    hasDataScope: true,
    permissions: [
      { key: 'customers.view', label: '查看客户列表', desc: '浏览和搜索客户' },
      { key: 'customers.view_detail', label: '查看客户详情', desc: '进入客户详情页' },
      { key: 'customers.create', label: '新增客户', desc: '创建新客户档案' },
      { key: 'customers.edit', label: '编辑基本信息', desc: '修改联系人、公司、国家等字段' },
      { key: 'customers.edit_interests', label: '编辑产品兴趣', desc: '修改客户感兴趣的产品类型' },
      { key: 'customers.edit_tags', label: '编辑客户标签', desc: '添加/移除自定义标签' },
      { key: 'customers.edit_level', label: '修改客户等级', desc: '调整 A/B/C/D 等级' },
      { key: 'customers.edit_stage', label: '修改客户阶段', desc: '新线索→初步联系→...→已成交' },
      { key: 'customers.edit_notes', label: '修改备注', desc: '编辑客户备注信息' },
      { key: 'customers.delete', label: '删除客户', desc: '软删除（可恢复）' },
      { key: 'customers.restore', label: '恢复已删客户', desc: '从回收站恢复被删除的客户' },
      { key: 'customers.export', label: '导出 CSV', desc: '将客户数据导出为 CSV 文件' },
      { key: 'customers.import', label: '导入 CSV', desc: '从 CSV 文件批量导入客户' },
      { key: 'customers.assign', label: '分配负责人', desc: '单个或批量变更客户负责人' },
      { key: 'customers.view_phone', label: '查看手机号', desc: '在列表中查看客户手机号码' },
      { key: 'customers.view_email', label: '查看邮箱', desc: '在列表中查看客户邮箱地址' },
    ],
  },

  // -------- 跟进记录 --------
  {
    key: 'followups',
    label: '跟进记录',
    icon: '📝',
    hasDataScope: true,
    permissions: [
      { key: 'followups.view', label: '查看跟进记录', desc: '查看跟进时间线' },
      { key: 'followups.create', label: '添加跟进', desc: '为客户添加新的跟进记录' },
      { key: 'followups.delete', label: '删除跟进', desc: '删除跟进记录' },
      { key: 'followups.filter_user', label: '按跟进人筛选', desc: '在跟进记录页按人员筛选' },
    ],
  },

  // -------- 客群管理 --------
  {
    key: 'segments',
    label: '客群管理',
    icon: '📊',
    hasDataScope: true,
    permissions: [
      { key: 'segments.view', label: '查看客群', desc: '浏览系统预设和自定义客群' },
      { key: 'segments.create', label: '创建/删除客群', desc: '新建自定义客群或删除已有客群' },
    ],
  },

  // -------- 部门管理 --------
  {
    key: 'departments',
    label: '部门管理',
    icon: '🏢',
    hasDataScope: false,
    permissions: [
      { key: 'departments.view', label: '查看部门', desc: '查看部门列表和成员' },
      { key: 'departments.create', label: '创建部门', desc: '新建部门' },
      { key: 'departments.edit', label: '编辑部门', desc: '修改部门名称和主管' },
      { key: 'departments.delete', label: '删除部门', desc: '删除部门（成员变为未分配）' },
      { key: 'departments.add_member', label: '添加成员', desc: '向部门添加成员' },
      { key: 'departments.remove_member', label: '移除成员', desc: '将成员移出部门' },
      { key: 'departments.move_member', label: '跨部门移动', desc: '将成员移动到其他部门' },
    ],
  },

  // -------- 用户管理 --------
  {
    key: 'users',
    label: '用户管理',
    icon: '👤',
    hasDataScope: false,
    permissions: [
      { key: 'users.view', label: '查看用户列表', desc: '浏览所有系统用户' },
      { key: 'users.create', label: '创建子账号', desc: '创建新的登录账号' },
      { key: 'users.edit', label: '编辑用户信息', desc: '修改姓名、邮箱、角色' },
      { key: 'users.reset_pwd', label: '重置密码', desc: '为用户设置新密码' },
      { key: 'users.toggle', label: '启用/停用', desc: '启用或禁用账号' },
      { key: 'users.transfer', label: '客户交接', desc: '将该用户名下客户转移给他人' },
    ],
  },

  // -------- 角色管理 --------
  {
    key: 'roles',
    label: '角色管理',
    icon: '🔐',
    hasDataScope: false,
    permissions: [
      { key: 'roles.view', label: '查看角色权限', desc: '查看各角色的权限配置' },
      { key: 'roles.edit', label: '修改角色权限', desc: '调整角色的操作权限和数据范围' },
    ],
  },

  // -------- 公海管理 --------
  {
    key: 'sea_pool',
    label: '公海管理',
    icon: '🌊',
    hasDataScope: false,
    permissions: [
      { key: 'sea_pool.view', label: '查看公海', desc: '浏览公海客户列表' },
      { key: 'sea_pool.claim', label: '领取公海客户', desc: '从公海领取客户到自己名下' },
      { key: 'sea_pool.push', label: '推入公海', desc: '手动将客户推入公海' },
      { key: 'sea_pool.manage_rules', label: '管理公海规则', desc: '配置自动掉公海规则' },
    ],
  },

  // -------- 操作日志 --------
  {
    key: 'audit',
    label: '操作日志',
    icon: '📜',
    hasDataScope: false,
    permissions: [
      { key: 'audit.view', label: '查看操作日志', desc: '查看系统中的操作记录和变更历史' },
    ],
  },

  // -------- 系统设置 --------
  {
    key: 'settings',
    label: '系统设置',
    icon: '⚙️',
    hasDataScope: false,
    permissions: [
      { key: 'settings.view', label: '查看系统设置', desc: '访问系统设置页面' },
      { key: 'settings.export', label: '导出客户数据', desc: '在设置页导出全部客户 CSV' },
      { key: 'settings.notifications', label: '通知偏好设置', desc: '配置浏览器通知和跟进提醒偏好' },
    ],
  },
];

// ============================================================
// 扁平权限键列表（方便查找）
// ============================================================

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

/** 获取某个权限组的所有权限键 */
export function getGroupPermissionKeys(groupKey: string): string[] {
  const group = PERMISSION_GROUPS.find(g => g.key === groupKey);
  return group ? group.permissions.map(p => p.key) : [];
}

/** 判断权限组是否有数据范围 */
export function groupHasDataScope(groupKey: string): boolean {
  const group = PERMISSION_GROUPS.find(g => g.key === groupKey);
  return group?.hasDataScope ?? false;
}

// ============================================================
// 角色权限类型
// ============================================================

/** 单个角色的权限配置 */
export interface RolePermissionConfig {
  /** 拥有的操作权限键列表，["*"] 表示全部 */
  permissions: string[];
  /** 各模块的数据范围 { "customers": "department", "followups": "own", ... } */
  dataScopes: Record<string, DataScope>;
}

/** 全部角色权限 */
export type RolePermissions = Record<string, RolePermissionConfig>;

// ============================================================
// 默认角色权限
// ============================================================

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  // -------- 管理员 --------
  admin: {
    permissions: ['*'],
    dataScopes: {},
  },

  // -------- 主管 --------
  manager: {
    permissions: [
      // 仪表盘
      'dashboard.view',
      // 客户管理
      'customers.view', 'customers.view_detail', 'customers.create',
      'customers.edit', 'customers.edit_interests', 'customers.edit_tags',
      'customers.edit_level', 'customers.edit_stage', 'customers.edit_notes',
      'customers.delete', 'customers.assign',
      'customers.view_phone', 'customers.view_email',
      // 跟进记录
      'followups.view', 'followups.create', 'followups.delete',
      'followups.filter_user',
      // 客群管理
      'segments.view', 'segments.create',
      // 公海管理
      'sea_pool.view', 'sea_pool.claim', 'sea_pool.push',
      // 部门管理（仅自己部门）
      'departments.view', 'departments.add_member', 'departments.remove_member',
      // 用户管理（仅自己部门）
      'users.view', 'users.reset_pwd', 'users.transfer',
      // 公海管理
      'sea_pool.view', 'sea_pool.claim', 'sea_pool.push', 'sea_pool.manage_rules',
      // 操作日志
      'audit.view',
      // 系统设置
      'settings.view',
    ],
    dataScopes: {
      dashboard: 'department',
      customers: 'department',
      followups: 'department',
      segments: 'department',
    },
  },

  // -------- 业务员 --------
  agent: {
    permissions: [
      // 仪表盘
      'dashboard.view',
      // 客户管理
      'customers.view', 'customers.view_detail', 'customers.create',
      'customers.edit', 'customers.edit_interests', 'customers.edit_tags',
      'customers.edit_stage', 'customers.edit_notes',
      'customers.view_phone', 'customers.view_email',
      // 跟进记录
      'followups.view', 'followups.create',
      // 客群管理
      'segments.view',
      // 公海管理
      'sea_pool.view', 'sea_pool.claim',
    ],
    dataScopes: {
      dashboard: 'own',
      customers: 'own',
      followups: 'own',
      segments: 'own',
    },
  },
};
