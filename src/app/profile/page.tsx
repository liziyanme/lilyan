"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getProfile, setProfile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const p = getProfile();
    setNickname(p.nickname);
    setAvatar(p.avatar);
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSize = 256;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setAvatar(url);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setAvatar(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const save = useCallback(() => {
    setSaveError("");
    try {
      setProfile({ nickname: nickname.trim() || "LZY", avatar });
      router.push("/");
    } catch (err) {
      setSaveError("保存失败，头像图片可能太大，请换一张小一点的图再试");
    }
  }, [nickname, avatar, router]);

  const deleteAccount = useCallback(async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setDeleteError("请先登录");
        setDeleteLoading(false);
        return;
      }
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || "删除失败");
        setDeleteLoading(false);
        return;
      }
      await supabase.auth.signOut();
      setDeleteConfirm(false);
      router.replace("/login");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "删除失败");
    }
    setDeleteLoading(false);
  }, [router]);

  return (
    <main className="min-h-dvh safe-bottom px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          ← 返回
        </Link>
        <h1 className="font-cute-cn font-bold text-stardew-dark text-xl">编辑资料</h1>
        <span className="w-20" />
      </header>

      <div className="card-pixel rounded-pixel-lg p-6 max-w-sm mx-auto space-y-6">
        <div>
          <p className="font-cute-cn font-bold text-stardew-dark mb-2">头像</p>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 rounded-pixel border-2 border-stardew-dark bg-stardew-panel overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover pixel-art" />
              ) : (
                <span className="font-pixel text-stardew-brown text-2xl">?</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-stardew px-4 py-2 text-sm"
            >
              更换头像
            </button>
          </div>
        </div>

        <div>
          <p className="font-cute-cn font-bold text-stardew-dark mb-2">昵称</p>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入昵称"
            maxLength={20}
            className="w-full font-cute-cn text-stardew-dark border-2 border-stardew-dark rounded-pixel px-4 py-2 bg-stardew-panel placeholder:text-stardew-brown/60 focus:outline-none focus:ring-2 focus:ring-stardew-green"
          />
        </div>

        <p className="font-cute-cn text-stardew-brown text-xs">
          发日记时会记录当时的头像和昵称，之后修改不会影响已发的日记。
        </p>

        {saveError && (
          <p className="font-cute-cn text-sm text-red-600">{saveError}</p>
        )}

        <button
          type="button"
          onClick={save}
          className="btn-stardew w-full py-3 text-lg"
        >
          保存
        </button>

        <div className="pt-6 mt-6 border-t-2 border-stardew-dark/20">
          <p className="font-cute-cn font-bold text-stardew-dark mb-2">删除账号</p>
          <p className="font-cute-cn text-stardew-brown text-xs mb-3">
            删除后账号及所有日记、相册、纪念日等数据将无法恢复，Supabase 中也会释放空间。
          </p>
          {deleteError && (
            <p className="font-cute-cn text-sm text-red-600 mb-2">{deleteError}</p>
          )}
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            className="font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel px-4 py-2 shadow-pixel hover:bg-red-50"
          >
            删除账号
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm bg-stardew-cream">
            <p className="font-cute-cn font-bold text-stardew-dark mb-2">确定删除账号？</p>
            <p className="font-cute-cn text-sm text-stardew-brown mb-4">账号及所有日记、相册、纪念日等数据将无法恢复。</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setDeleteConfirm(false); setDeleteError(""); }}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel shadow-pixel"
              >
                取消
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleteLoading}
                className="flex-1 font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 shadow-pixel bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                {deleteLoading ? "删除中..." : "确定删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
