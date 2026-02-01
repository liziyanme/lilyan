"use client";

/**
 * 冬季雪景 · 拓麻歌子/星露谷风电子像素生活场景
 * 保留动画形象展示位：前景雪地区域可叠加角色图（透明底 PNG）
 * 背景：像素天空、雪山、小屋、松树、雪地、飘雪
 */
export function PixelSceneBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <svg
        className="absolute inset-0 w-full h-full object-cover"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: "pixelated", imageRendering: "crisp-edges" }}
      >
        <defs>
          {/* 冬日天空 */}
          <linearGradient id="winter-sky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A8D8EA" />
            <stop offset="60%" stopColor="#C5DCF7" />
            <stop offset="100%" stopColor="#D4E8F7" />
          </linearGradient>
          {/* 雪山 - 远 */}
          <linearGradient id="snow-mount-far" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#B8C8D8" />
            <stop offset="50%" stopColor="#D8E4EC" />
            <stop offset="100%" stopColor="#E8EEF4" />
          </linearGradient>
          {/* 雪山 - 中 */}
          <linearGradient id="snow-mount-mid" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#9BAEC4" />
            <stop offset="40%" stopColor="#C8D6E4" />
            <stop offset="100%" stopColor="#E0E8F0" />
          </linearGradient>
          {/* 雪山 - 近 */}
          <linearGradient id="snow-mount-near" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#7A8FA6" />
            <stop offset="50%" stopColor="#B0C0D0" />
            <stop offset="100%" stopColor="#D0DCE8" />
          </linearGradient>
          {/* 雪地 */}
          <linearGradient id="snow-ground" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#B0C4D8" />
            <stop offset="30%" stopColor="#D8E4F0" />
            <stop offset="100%" stopColor="#F0F4F8" />
          </linearGradient>
        </defs>

        {/* 天空 */}
        <rect width="400" height="300" fill="url(#winter-sky)" />

        {/* 像素云 */}
        <g fill="#FFF" fillOpacity="0.9">
          <rect x="20" y="38" width="20" height="14" />
          <rect x="34" y="32" width="24" height="14" />
          <rect x="52" y="38" width="20" height="14" />
          <rect x="38" y="46" width="32" height="14" />
        </g>
        <g fill="#FFF" fillOpacity="0.85">
          <rect x="180" y="58" width="18" height="12" />
          <rect x="194" y="52" width="22" height="12" />
          <rect x="210" y="58" width="18" height="12" />
        </g>

        {/* 远山 - 雪顶 */}
        <path
          d="M0 300 L0 140 L80 100 L160 130 L240 90 L320 110 L400 85 L400 300 Z"
          fill="url(#snow-mount-far)"
        />
        <path
          d="M0 300 L0 180 L70 150 L150 170 L220 140 L300 160 L400 130 L400 300 Z"
          fill="url(#snow-mount-mid)"
        />
        <path
          d="M0 300 L0 220 L60 200 L140 210 L200 190 L280 205 L400 180 L400 300 Z"
          fill="url(#snow-mount-near)"
        />

        {/* 像素小屋 1 - 左侧 */}
        <g>
          <rect x="30" y="175" width="44" height="32" fill="#E8C4B0" stroke="#5C4033" strokeWidth="1" />
          <rect x="34" y="178" width="12" height="10" fill="#87CEEB" />
          <rect x="52" y="178" width="12" height="10" fill="#87CEEB" />
          <rect x="26" y="168" width="52" height="12" fill="#F0F4F8" stroke="#5C4033" strokeWidth="1" />
          <rect x="28" y="164" width="48" height="8" fill="#D0DCE8" />
        </g>
        {/* 像素小屋 2 - 中右 */}
        <g>
          <rect x="268" y="182" width="40" height="28" fill="#E8D0C0" stroke="#5C4033" strokeWidth="1" />
          <rect x="272" y="185" width="10" height="8" fill="#87CEEB" />
          <rect x="286" y="185" width="10" height="8" fill="#87CEEB" />
          <rect x="264" y="174" width="48" height="10" fill="#F0F4F8" stroke="#5C4033" strokeWidth="1" />
          <rect x="266" y="170" width="44" height="6" fill="#D0DCE8" />
        </g>
        {/* 像素小屋 3 - 右上 */}
        <g>
          <rect x="318" y="125" width="36" height="26" fill="#E0C8B8" stroke="#5C4033" strokeWidth="1" />
          <rect x="322" y="128" width="8" height="6" fill="#87CEEB" />
          <rect x="314" y="118" width="44" height="8" fill="#F0F4F8" stroke="#5C4033" strokeWidth="1" />
        </g>

        {/* 像素松树 - 左侧 */}
        <g fill="#4A7C59" stroke="#3D2C29" strokeWidth="1">
          <rect x="95" y="195" width="16" height="20" />
          <rect x="87" y="178" width="32" height="18" />
          <rect x="79" y="162" width="48" height="16" />
          <rect x="103" y="212" width="10" height="12" fill="#5C4033" />
        </g>
        {/* 像素松树 - 圣诞树风格 右侧 */}
        <g fill="#2D5A3D" stroke="#3D2C29" strokeWidth="1">
          <rect x="355" y="200" width="14" height="18" />
          <rect x="348" y="185" width="28" height="16" />
          <rect x="340" y="170" width="44" height="16" />
          <rect x="360" y="215" width="8" height="10" fill="#5C4033" />
        </g>
        <rect x="364" y="158" width="12" height="14" fill="#FFE066" />
        <circle cx="352" cy="178" r="3" fill="#FFB7C5" />
        <circle cx="372" cy="182" r="3" fill="#FFB7C5" />
        <circle cx="358" cy="192" r="3" fill="#A8D8EA" />

        {/* 前景雪地 - 动画形象可放在此区域上方 */}
        <rect x="0" y="218" width="400" height="82" fill="url(#snow-ground)" />
        {/* 雪地像素锯齿上缘 */}
        <g fill="#E8EEF4">
          {Array.from({ length: 26 }).map((_, i) => (
            <rect key={i} x={i * 16} y={214} width="16" height="6" />
          ))}
        </g>
        <g fill="#D0DCE8">
          {Array.from({ length: 25 }).map((_, i) => (
            <rect key={`s-${i}`} x={i * 16 + 8} y={208} width="16" height="6" />
          ))}
        </g>

        {/* 飘雪 - 小圆点 */}
        <g fill="#FFF" fillOpacity="0.7">
          {[
            [40, 50], [120, 70], [200, 45], [280, 90], [360, 55],
            [80, 120], [160, 100], [240, 130], [320, 110],
            [60, 170], [140, 155], [220, 165], [300, 150],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2" />
          ))}
        </g>
      </svg>
      {/* 浅色遮罩保证前景文字可读 */}
      <div className="absolute inset-0 bg-white/20" />
      {/* 动画形象层：将透明底角色图保存为 public/images/characters.png 即可自动显示 */}
      <div
        className="absolute inset-0 bg-no-repeat bg-center bg-contain pointer-events-none"
        style={{
          backgroundImage: "url(/images/characters.png)",
          backgroundSize: "80% auto",
          backgroundPosition: "center 78%",
        }}
      />
    </div>
  );
}
