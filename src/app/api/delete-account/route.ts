import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 删除当前账号：删除 Auth 用户及该用户的日记、相册、纪念日、日记本等数据。
 * 需在 .env.local 配置 SUPABASE_SERVICE_ROLE_KEY（Supabase → Project Settings → API → service_role）。
 * 客户端请求时在 Header 传 Authorization: Bearer <access_token>（当前登录的 access_token）。
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return Response.json({ error: "未提供登录凭证" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return Response.json({ error: "Supabase 未配置" }, { status: 500 });
  }
  if (!serviceRoleKey) {
    return Response.json(
      { error: "未配置 SUPABASE_SERVICE_ROLE_KEY，无法删除账号。请在 .env.local 添加（Supabase → Project Settings → API → service_role）" },
      { status: 500 }
    );
  }

  const anonClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await anonClient.auth.getUser();
  if (userError || !user?.id) {
    return Response.json({ error: "登录已过期或无效" }, { status: 401 });
  }

  const uid = user.id;
  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const { data: albums } = await adminClient.from("album").select("id").eq("user_id", uid);
    const albumIds = (albums ?? []).map((a: { id: string }) => a.id);
    if (albumIds.length > 0) {
      await adminClient.from("album_image").delete().in("album_id", albumIds);
    }
    await adminClient.from("diary").delete().eq("user_id", uid);
    await adminClient.from("countdown").delete().eq("user_id", uid);
    await adminClient.from("notebook").delete().eq("user_id", uid);
    await adminClient.from("album").delete().eq("user_id", uid);
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteUserError) {
      return Response.json({ error: deleteUserError.message || "删除用户失败" }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "删除失败" }, { status: 500 });
  }
}
