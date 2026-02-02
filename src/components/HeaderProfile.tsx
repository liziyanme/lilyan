"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile, type Profile } from "@/lib/profile";

/** QQ 风格：左上角显示头像 + 昵称，登录后显示；未登录显示登录链接 */
export function HeaderProfile() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const refresh = () => setProfile(getProfile());
    refresh();
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) =>
      setIsLoggedIn(!!session)
    );
    window.addEventListener("profile-updated", refresh);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("profile-updated", refresh);
    };
  }, [pathname]);

  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogoutConfirm(false);
    router.replace("/login");
  };

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (isPublic) {
    return (
      <header className="sticky top-0 z-10 flex-shrink-0 bg-stardew-panel/95 backdrop-blur-sm border-b-2 border-stardew-dark shadow-[0_2px_0_var(--stardew-dark)] safe-top">
        <div className="flex items-center px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="font-cute-cn font-bold text-stardew-dark text-sm sm:text-base">
            LZY&apos;s Diary
          </span>
        </div>
      </header>
    );
  }

  if (profile === null) return <div className="h-12 flex-shrink-0" aria-hidden />;

  if (!isLoggedIn) {
    return (
      <header className="sticky top-0 z-10 flex-shrink-0 bg-stardew-panel/95 backdrop-blur-sm border-b-2 border-stardew-dark shadow-[0_2px_0_var(--stardew-dark)] safe-top">
        <Link
          href="/login"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 text-stardew-green font-bold"
        >
          登录
        </Link>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-10 flex-shrink-0 bg-stardew-panel/95 backdrop-blur-sm border-b-2 border-stardew-dark shadow-[0_2px_0_var(--stardew-dark)] safe-top">
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-2.5">
        <Link
          href="/profile"
          className="flex items-center gap-3 max-w-[200px] sm:max-w-[240px]
                     hover:bg-stardew-cream/50 active:bg-stardew-cream/70 transition-colors rounded-br-pixel-lg py-1"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 rounded-full border-2 border-stardew-dark bg-stardew-cream overflow-hidden flex items-center justify-center ring-2 ring-white/50">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover pixel-art" />
            ) : (
              <span className="font-pixel text-stardew-brown text-sm">?</span>
            )}
          </div>
          <span className="font-cute-cn font-bold text-stardew-dark text-sm sm:text-base truncate min-w-0">
            {profile.nickname || "未设置昵称"}
          </span>
        </Link>
        <button
          onClick={() => setLogoutConfirm(true)}
          className="font-cute-cn text-stardew-brown text-sm border-2 border-stardew-dark rounded-pixel px-2 py-1 hover:bg-stardew-cream/70"
        >
          退出
        </button>
      </div>
      {logoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setLogoutConfirm(false)}>
          <div className="card-pixel rounded-pixel-lg p-5 w-full max-w-xs bg-stardew-cream" onClick={(e) => e.stopPropagation()}>
            <p className="font-cute-cn font-bold text-stardew-dark mb-4 text-center">确定退出登录？</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel text-stardew-dark"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 font-cute-cn text-sm btn-stardew py-2"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
