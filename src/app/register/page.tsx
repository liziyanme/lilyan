"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setErrorMsg = (msg: string) => setError(msg);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (password !== confirm) {
      setErrorMsg("两次密码输入不一致");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("密码至少 6 位");
      return;
    }
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase 未配置：请检查 .env.local 并重启开发服务器");
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (err) {
        const msg = err.message || "注册失败";
        if (msg.includes("Invalid API key") || msg.includes("API key")) {
          setErrorMsg("API 密钥无效：请到 Supabase → Project Settings → API，复制 anon public（eyJ 开头）到 .env.local 的 NEXT_PUBLIC_SUPABASE_ANON_KEY，修改后重启 npm run dev");
        } else {
          setErrorMsg(msg);
        }
        return;
      }
      if (data.user?.identities?.length === 0) {
        setErrorMsg("该邮箱已被注册，请直接登录或更换邮箱");
        return;
      }
      setSuccess(true);
      setError("");
      if (data.session) {
        setTimeout(() => { window.location.href = "/"; }, 1200);
      }
    } catch (e) {
      setLoading(false);
      setErrorMsg(e instanceof Error ? e.message : "网络异常，请稍后重试");
    }
  };

  if (success) {
    return (
      <main className="min-h-dvh safe-bottom flex flex-col items-center px-4 py-6 sm:py-8 relative z-10">
        <header className="text-center mb-6 flex flex-col items-center">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
            <img src="/images/chiikawa%20pocket.png" alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0" />
            <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl font-bold text-stardew-dark tracking-tight leading-tight">
              LZY&apos;s Diary
            </h1>
            <img src="/images/chiikawa%20pocket.png" alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0" />
          </div>
        </header>
        <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm text-center border-2 border-stardew-green bg-green-50/80">
          <p className="font-cute-cn text-stardew-dark mb-2 text-base font-bold">✅ 注册成功！</p>
          <p className="font-cute-cn text-sm text-stardew-brown mb-6">
            若开启了邮箱验证，请查收邮件点击链接后再登录；否则将自动跳转到首页。
          </p>
          <Link href="/login" className="btn-stardew inline-block px-8 py-3 font-cute-cn text-sm">
            去登录
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh safe-bottom flex flex-col items-center px-4 py-6 sm:py-8 relative z-10">
      {!isSupabaseConfigured && (
        <div className="fixed top-4 left-4 right-4 z-50 card-pixel rounded-pixel-lg px-4 py-3 font-cute-cn text-sm text-red-700 bg-red-100 border-2 border-red-400" role="alert">
          请配置 .env.local 中的 Supabase 信息后重启开发服务器
        </div>
      )}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 card-pixel rounded-pixel-lg px-4 py-3 font-cute-cn text-sm text-red-700 bg-red-100 border-2 border-red-400" role="alert">
          {error}
        </div>
      )}
      <header className="text-center mb-6 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
          <img src="/images/chiikawa%20pocket.png" alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0" />
          <h1 className="font-pixel text-xl sm:text-2xl md:text-3xl font-bold text-stardew-dark tracking-tight leading-tight">
            LZY&apos;s Diary
          </h1>
          <img src="/images/chiikawa%20pocket.png" alt="" className="w-12 h-12 sm:w-14 sm:h-14 object-contain pixel-art flex-shrink-0" />
        </div>
        <p className="font-cute-cn text-sm text-stardew-brown mt-1">lzy的电子日记本</p>
      </header>

      <div className="w-full max-w-sm card-pixel rounded-pixel-lg p-6 shadow-pixel-lg hover:shadow-[8px_8px_0_var(--stardew-dark)] transition-shadow">
        <div className="text-center mb-6">
          <h2 className="font-cute-cn font-bold text-lg text-stardew-dark mb-1">✨ 注册 ✨</h2>
          <p className="font-cute-cn text-sm text-stardew-brown">创建账号，开始记录生活</p>
          <p className="font-cute-cn text-xs text-stardew-brown/80 mt-2">支持多设备同时登录</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="font-cute-cn text-stardew-dark text-sm block mb-2">📧 邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full font-cute-cn text-sm text-stardew-dark border-2 border-stardew-dark rounded-pixel px-4 py-3 bg-white/90 placeholder:text-stardew-brown/50 focus:outline-none focus:ring-2 focus:ring-stardew-green focus:border-stardew-green"
            />
          </div>
          <div>
            <label className="font-cute-cn text-stardew-dark text-sm block mb-2">🔑 密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              required
              minLength={6}
              className="w-full font-cute-cn text-sm text-stardew-dark border-2 border-stardew-dark rounded-pixel px-4 py-3 bg-white/90 placeholder:text-stardew-brown/50 focus:outline-none focus:ring-2 focus:ring-stardew-green focus:border-stardew-green"
            />
          </div>
          <div>
            <label className="font-cute-cn text-stardew-dark text-sm block mb-2">🔑 确认密码</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入密码"
              required
              minLength={6}
              className="w-full font-cute-cn text-sm text-stardew-dark border-2 border-stardew-dark rounded-pixel px-4 py-3 bg-white/90 placeholder:text-stardew-brown/50 focus:outline-none focus:ring-2 focus:ring-stardew-green focus:border-stardew-green"
            />
          </div>
          {error && (
            <div className="rounded-pixel px-3 py-2 bg-red-100 border-2 border-red-300">
              <p className="font-cute-cn text-sm text-red-700">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-stardew w-full py-3 font-cute-cn text-sm disabled:opacity-50"
          >
            {loading ? "注册中..." : "创建账号"}
          </button>
        </form>
        <div className="mt-6 pt-4 border-t-2 border-stardew-dark/20 text-center">
          <p className="font-cute-cn text-sm text-stardew-brown">
            已有账号？{" "}
            <Link href="/login" className="text-stardew-green font-bold underline hover:text-stardew-dark transition-colors">
              去登录
            </Link>
          </p>
        </div>
      </div>

      <footer className="mt-8 flex flex-col items-center gap-2 font-cute-cn text-xs text-stardew-brown">
        <img src="/images/222.png" alt="" className="w-8 h-8 object-contain pixel-art opacity-80" />
        <span>数据将支持多端同步</span>
      </footer>
    </main>
  );
}
