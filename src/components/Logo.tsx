// ============================================================
// YIMU 品牌 Logo：蓝紫渐变圆环 + 闪电
// 用法：<Logo size={40} />
// ============================================================

export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="yimu-ring" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="yimu-bolt" x1="18" y1="8" x2="30" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      {/* 渐变圆环（右下留缺口，更现代） */}
      <circle
        cx="24" cy="24" r="19"
        stroke="url(#yimu-ring)" strokeWidth="4.5" strokeLinecap="round"
        strokeDasharray="106 13.4" transform="rotate(115 24 24)"
      />
      {/* 缺口处的小圆点，呼应"连接" */}
      <circle cx="36.5" cy="37.5" r="2.6" fill="#8B5CF6" />
      {/* 闪电 */}
      <path
        d="M27 7 L15.5 26 h5.5 L18.5 41 L32.5 21 h-5.5 Z"
        fill="url(#yimu-bolt)"
      />
    </svg>
  );
}
