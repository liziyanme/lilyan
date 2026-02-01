"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const PUBLIC_PATHS = ["/login", "/register"];

/** 未登录时跳转到登录页，登录/注册页不校验 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    if (isPublic) {
      setAuthorized(true);
      return;
    }
    if (!isSupabaseConfigured) {
      setAuthorized(false);
      router.replace("/login");
      return;
    }
    let done = false;
    const timeoutMs = 5000;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      setAuthorized(false);
      router.replace("/login");
    }, timeoutMs);
    supabase.auth.getSession()
      .then((res) => {
        if (done) return;
        done = true;
        clearTimeout(t);
        if (res?.data?.session) setAuthorized(true);
        else {
          setAuthorized(false);
          router.replace("/login");
        }
      })
      .catch(() => {
        if (!done) {
          done = true;
          clearTimeout(t);
          setAuthorized(false);
          router.replace("/login");
        }
      });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) setAuthorized(true);
    });
    return () => {
      done = true;
      clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return <>{children}</>;
  }
  if (authorized === true) return <>{children}</>;
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 relative z-10 bg-tint-blue-strong">
      <div className="card-pixel rounded-pixel-lg p-6 max-w-sm text-center">
        <p className="font-cute-cn text-stardew-brown text-sm">正在验证登录状态...</p>
        <p className="font-cute-cn text-stardew-brown/70 text-xs mt-2">若长时间无响应，请检查 .env.local 配置后重启</p>
        <a href="/login" className="btn-stardew inline-block mt-4 px-6 py-2 font-cute-cn text-sm">
          前往登录
        </a>
      </div>
    </div>
  );
}
