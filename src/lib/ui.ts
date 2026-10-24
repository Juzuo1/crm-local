// ============================================================
// YIMU CRM 统一设计系统
// 品牌色：深蓝 #0A2540（主色） + 橙 #FF6B35（点缀/关键动作）
// ============================================================

export const BRAND = {
  primary: '#0A2540',      // 品牌深蓝
  primaryLight: '#1B3A5C', // 深蓝亮阶
  accent: '#FF6B35',       // 品牌橙
  accentSoft: '#FFF1EB',   // 橙浅底
} as const;

// ---------- 客户等级 ----------
// A=品牌橙(高价值) B=蓝 C=琥珀 D=灰(无效不用红，红色留给逾期/危险)
export const LEVEL_LABELS: Record<string, string> = {
  A: 'A级 · 高价值', B: 'B级 · 意向强', C: 'C级 · 待培育', D: 'D级 · 无效',
};
export const LEVEL_BADGE: Record<string, string> = {
  A: 'bg-orange-50 text-orange-600 ring-orange-200',
  B: 'bg-blue-50 text-blue-600 ring-blue-200',
  C: 'bg-amber-50 text-amber-600 ring-amber-200',
  D: 'bg-slate-100 text-slate-500 ring-slate-200',
};
export const LEVEL_DOT: Record<string, string> = {
  A: 'bg-orange-500', B: 'bg-blue-500', C: 'bg-amber-500', D: 'bg-slate-400',
};
// 图表用实色
export const LEVEL_SOLID: Record<string, string> = {
  A: '#FF6B35', B: '#3B82F6', C: '#F59E0B', D: '#94A3B8',
};

// ---------- 客户阶段（10 级，收敛为 5 组语义色）----------
// 冷启动=石板灰 / 进行中=蓝 / 关键推进=品牌橙 / 接近成交=绿 / 成交=深绿 / 流失=灰
export const STAGE_LABELS: Record<string, string> = {
  new_lead: '新线索', initial_contact: '初步联系', needs_confirmed: '需求确认',
  quoted: '已报价', sample_testing: '样品测试', negotiation: '商务谈判',
  order_confirmed: '确认订单', production_shipping: '生产发货',
  completed: '已成交', lost: '已流失',
};
export const STAGE_BADGE: Record<string, string> = {
  new_lead: 'bg-slate-100 text-slate-600 ring-slate-200',
  initial_contact: 'bg-sky-50 text-sky-600 ring-sky-200',
  needs_confirmed: 'bg-blue-50 text-blue-600 ring-blue-200',
  quoted: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
  sample_testing: 'bg-orange-50 text-orange-600 ring-orange-200',
  negotiation: 'bg-orange-50 text-orange-700 ring-orange-300',
  order_confirmed: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  production_shipping: 'bg-emerald-50 text-emerald-700 ring-emerald-300',
  completed: 'bg-emerald-600 text-white ring-emerald-600',
  lost: 'bg-slate-100 text-slate-400 ring-slate-200 line-through',
};
export const STAGE_SOLID: Record<string, string> = {
  new_lead: '#94A3B8', initial_contact: '#38BDF8', needs_confirmed: '#3B82F6',
  quoted: '#6366F1', sample_testing: '#FB923C', negotiation: '#FF6B35',
  order_confirmed: '#34D399', production_shipping: '#10B981',
  completed: '#059669', lost: '#CBD5E1',
};

// ---------- 来源渠道 ----------
export const CHANNEL_LABELS: Record<string, string> = {
  facebook: 'Facebook', tiktok: 'TikTok', alibaba: '阿里国际站',
  website: '独立站', exhibition: '展会', referral: '转介绍', other: '其他',
};
export const CHANNEL_SOLID: Record<string, string> = {
  facebook: '#1877F2', tiktok: '#0A2540', alibaba: '#FF6B35',
  website: '#3B82F6', exhibition: '#8B5CF6', referral: '#10B981', other: '#94A3B8',
};

// ---------- 跟进方式 ----------
export const METHOD_LABELS: Record<string, string> = {
  phone: '电话', whatsapp: 'WhatsApp', email: '邮件', wechat: '微信', meeting: '见面',
};

// ---------- 通用小组件 ----------

/** 标签徽章（圆点 + 文字，ring 描边风格，全系统统一） */
export function badgeClass(map: Record<string, string>, key: string): string {
  return `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${map[key] || 'bg-slate-100 text-slate-600 ring-slate-200'}`;
}

/** 头像底色（按名字散列，全系统统一） */
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-orange-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-teal-500',
];
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
