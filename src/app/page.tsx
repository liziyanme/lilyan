import Link from "next/link";

export default function HomePage() {
  const navItems = [
    { href: "/diary", label: "日记本", emoji: "📔", desc: "写日记、带定位、私密/公开" },
    { href: "/countdown", label: "纪念日 / 倒计时", emoji: "📅", desc: "距 xxx 已经 xxx 天" },
    { href: "/albums", label: "云相册", emoji: "📷", desc: "笔记相册、旅游、探店" },
  ];

  return (
    <main className="min-h-dvh safe-bottom flex flex-col items-center px-4 py-6 sm:py-8">
      <header className="text-center mb-6 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
          <img
            src="/images/chiikawa%20pocket.png"
            alt=""
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0"
          />
          <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl font-bold text-stardew-dark tracking-tight leading-tight">
            LZY&apos;s Diary
          </h1>
          <img
            src="/images/chiikawa%20pocket.png"
            alt=""
            className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0"
          />
        </div>
        <p className="font-cute-cn text-sm text-stardew-brown mt-1">lzy的电子日记本</p>
      </header>

      <nav className="w-full max-w-sm space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block card-pixel rounded-pixel-lg p-4 sm:p-5
                       hover:shadow-[8px_8px_0_var(--stardew-dark)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--stardew-dark)]"
          >
            <span className="text-2xl mr-3">{item.emoji}</span>
            <span className="font-cute-cn font-bold text-base sm:text-lg text-stardew-dark">{item.label}</span>
            <p className="mt-2 text-sm text-stardew-brown ml-9 font-cute-cn">{item.desc}</p>
          </Link>
        ))}
      </nav>

      <footer className="mt-10 flex flex-col items-center gap-2 font-cute-cn text-xs text-stardew-brown">
        <img src="/images/222.png" alt="" className="w-10 h-10 object-contain pixel-art opacity-90" />
        <span>数据将支持多端同步 · 敬请期待</span>
      </footer>
    </main>
  );
}
