import { NextRequest } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 记录访客：IP、User-Agent、访问路径，写入 Supabase visitor 表。
 * 由前端在页面加载时调用 GET /api/visitor?path=/current/path
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured) return new Response(null, { status: 204 });

  const path = request.nextUrl.searchParams.get("path") ?? "/";
  const userAgent = request.headers.get("user-agent") ?? "";
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() ?? realIp ?? null;

  try {
    await supabase.from("visitor").insert({
      ip: ip || undefined,
      user_agent: userAgent || undefined,
      path: path || "/",
    });
  } catch {
    // 静默失败，不影响页面
  }

  return new Response(null, { status: 204 });
}
