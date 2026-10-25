// ============================================================
// YIMU CRM 品牌标识
// 概念：以「Y」为骨架的客户关系网络 —— 三个节点（客户 / 伙伴）汇聚于
//       中心枢纽，中心枢纽用品牌橙强调，寓意「把所有客户关系收拢到一个
//       工作台」。区别于常见的「渐变圆环 + 闪电」模板化图标。
// 配色：light = 浅色徽标底（用于深蓝背景），dark = 深蓝徽标底（用于浅色背景）
// 用法：<Logo size={40} />  /  <Logo size={40} variant="dark" />
// ============================================================

type Variant = 'light' | 'dark';

export default function Logo({
  size = 40,
  variant = 'light',
  className = '',
}: {
  size?: number;
  variant?: Variant;
  className?: string;
}) {
  const badge = variant === 'light' ? '#FFFFFF' : '#0A2540';
  const mark = variant === 'light' ? '#0A2540' : '#FFFFFF';
  const hub = '#FF6B35';
  const edge = variant === 'light' ? 'rgba(10,37,64,0.08)' : 'rgba(255,255,255,0.14)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* 圆角方形徽标底 */}
      <rect x="3" y="3" width="42" height="42" rx="13" fill={badge} stroke={edge} strokeWidth="1" />

      {/* Y 形关系网络（三条连接线：两位客户 → 枢纽 → 业务落地） */}
      <g stroke={mark} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 14 L24 25" />
        <path d="M32 14 L24 25" />
        <path d="M24 25 L24 37" />
      </g>

      {/* 三个终端节点（客户 / 伙伴） */}
      <circle cx="16" cy="14" r="3" fill={mark} />
      <circle cx="32" cy="14" r="3" fill={mark} />
      <circle cx="24" cy="37" r="3" fill={mark} />

      {/* 中心枢纽（品牌橙，点睛之笔） */}
      <circle cx="24" cy="25" r="4.2" fill={hub} />
    </svg>
  );
}
