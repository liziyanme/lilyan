"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getProfile, setProfile } from "@/lib/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getProfile();
    setNickname(p.nickname);
    setAvatar(p.avatar);
  }, []);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const save = useCallback(() => {
    setProfile({ nickname: nickname.trim() || "LZY", avatar });
    router.push("/");
  }, [nickname, avatar, router]);

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

        <button
          type="button"
          onClick={save}
          className="btn-stardew w-full py-3 text-lg"
        >
          保存
        </button>
      </div>
    </main>
  );
}
