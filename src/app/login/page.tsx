"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const setErrorMsg = (msg: string) => setError(msg);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginSuccess(false);
    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase 未配置：请检查 .env.local 中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        const msg = err.message || "登录失败";
        if (msg.includes("Invalid API key") || msg.includes("API key")) {
          setErrorMsg("API 密钥无效：请到 Supabase → Project Settings → API，复制 anon public（eyJ 开头）到 .env.local 的 NEXT_PUBLIC_SUPABASE_ANON_KEY，修改后重启 npm run dev");
        } else if (msg.includes("Email not confirmed") || msg.toLowerCase().includes("email")) {
          setErrorMsg("请先查收注册邮件，点击链接验证后再登录");
        } else if (msg.includes("Invalid") || msg.includes("credentials")) {
          setErrorMsg("邮箱或密码错误，请检查后重试");
        } else {
          setErrorMsg(msg);
        }
        return;
      }
      if (data.session) {
        setLoginSuccess(true);
        setError("");
        setTimeout(() => { window.location.href = "/"; }, 1200);
      } else {
        setErrorMsg("登录异常，请重试");
      }
    } catch (e) {
      setLoading(false);
      const msg = e instanceof Error ? e.message : "网络异常，请稍后重试";
      setErrorMsg(msg);
    }
  };

  return (
    <main className="min-h-dvh safe-bottom flex flex-col items-center px-4 py-6 sm:py-8 relative z-10">
      {!isSupabaseConfigured && (
        <div className="fixed top-4 left-4 right-4 z-50 card-pixel rounded-pixel-lg px-4 py-3 font-cute-cn text-sm text-red-700 bg-red-100 border-2 border-red-400" role="alert">
          请配置 .env.local 中的 Supabase 信息后重启开发服务器
        </div>
      )}
      {(error || loginSuccess) && (
        <div
          className={`fixed top-4 left-4 right-4 z-50 card-pixel rounded-pixel-lg px-4 py-3 font-cute-cn text-sm ${
            loginSuccess ? "text-stardew-dark bg-green-100 border-2 border-stardew-green" : "text-red-700 bg-red-100 border-2 border-red-400"
          }`}
          role="alert"
        >
          {loginSuccess ? "✅ 登录成功，正在跳转..." : error}
        </div>
      )}
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
        <p className="font-cute-cn text-sm text-stardew-brown mt-1 text-center">李紫妍大王万岁！</p>
      </header>

      <div className="w-full max-w-sm card-pixel rounded-pixel-lg p-6 shadow-pixel-lg hover:shadow-[8px_8px_0_var(--stardew-dark)] transition-shadow">
        <div className="text-center mb-6">
          <h2 className="font-cute-cn font-bold text-lg text-stardew-dark mb-1">✨ 登录 ✨</h2>
          <p className="font-cute-cn text-sm text-stardew-brown">输入账号密码进入你的小天地</p>
          <p className="font-cute-cn text-xs text-stardew-brown/80 mt-2">支持多设备同时登录</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="font-cute-cn text-stardew-dark text-sm block mb-2">
              📧 账号（邮箱）
            </label>
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
            <label className="font-cute-cn text-stardew-dark text-sm block mb-2">
              🔑 密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full font-cute-cn text-sm text-stardew-dark border-2 border-stardew-dark rounded-pixel px-4 py-3 bg-white/90 placeholder:text-stardew-brown/50 focus:outline-none focus:ring-2 focus:ring-stardew-green focus:border-stardew-green"
            />
          </div>
          {error && (
            <div className="rounded-pixel px-3 py-2 bg-red-100 border-2 border-red-400">
              <p className="font-cute-cn text-sm text-red-700">{error}</p>
            </div>
          )}
          {loginSuccess && (
            <div className="rounded-pixel px-3 py-2 bg-green-100 border-2 border-stardew-green">
              <p className="font-cute-cn text-sm text-stardew-dark">✅ 登录成功，正在跳转...</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading || loginSuccess}
            className="btn-stardew w-full py-3 font-cute-cn text-sm disabled:opacity-50 hover:bg-stardew-grass active:bg-stardew-green"
          >
            {loading ? "加载中..." : "进入日记本"}
          </button>
        </form>
        <div className="mt-6 pt-4 border-t-2 border-stardew-dark/20 text-center">
          <p className="font-cute-cn text-sm text-stardew-brown">
            还没有账号？{" "}
            <Link
              href="/register"
              className="text-stardew-green font-bold underline hover:text-stardew-dark transition-colors"
            >
              去注册
            </Link>
          </p>
        </div>
      </div>

      <footer className="mt-8 flex flex-col items-center gap-2 font-cute-cn text-xs text-stardew-brown text-center max-w-sm">
        <img src="/images/222.png" alt="" className="w-8 h-8 object-contain pixel-art opacity-80" />
        <span>数据将支持多端同步</span>
        <span className="opacity-80">若提示需验证邮件：到 Supabase → Auth → Email 关闭「Confirm email」</span>
      </footer>
    </main>
  );
}
