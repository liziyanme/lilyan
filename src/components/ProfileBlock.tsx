"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, type Profile } from "@/lib/profile";

export function ProfileBlock() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  if (profile === null) return null;

  return (
    <Link
      href="/profile"
      className="card-pixel rounded-pixel-lg p-4 flex items-center gap-4 w-full max-w-sm mx-auto mb-6
                 hover:shadow-[8px_8px_0_var(--stardew-dark)] hover:-translate-x-0.5 hover:-translate-y-0.5
                 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--stardew-dark)] transition-all"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-pixel border-2 border-stardew-dark bg-stardew-panel overflow-hidden flex items-center justify-center">
        {profile.avatar ? (
          <img src={profile.avatar} alt="" className="w-full h-full object-cover pixel-art" />
        ) : (
          <span className="font-pixel text-stardew-brown text-xl">?</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-pixel font-bold text-stardew-dark text-lg truncate">
          {profile.nickname || "未设置昵称"}
        </p>
        <p className="font-cute-cn text-stardew-brown text-xs mt-0.5">点击编辑头像与昵称</p>
      </div>
      <span className="font-pixel text-stardew-brown">→</span>
    </Link>
  );
}
