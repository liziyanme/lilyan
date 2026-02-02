"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 页面访问时上报访客记录（IP、设备、路径）到 /api/visitor，供后台在 Supabase visitor 表查看。
 */
export function VisitorTracker() {
  const pathname = usePathname();
  const reported = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || reported.current === pathname) return;
    reported.current = pathname;
    fetch(`/api/visitor?path=${encodeURIComponent(pathname)}`, {
      method: "GET",
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
