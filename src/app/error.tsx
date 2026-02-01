"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-6 bg-tint-blue-strong">
      <div className="card-pixel rounded-pixel-lg p-6 max-w-sm text-center">
        <h2 className="font-cute-cn text-stardew-dark text-base font-bold mb-4">出错了</h2>
        <p className="font-cute-cn text-stardew-brown text-sm mb-6">
          {error.message || "页面加载失败，请重试"}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-stardew px-4 py-2 font-cute-cn text-sm">
            重试
          </button>
          <a href="/" className="font-cute-cn text-sm text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-4 py-2 inline-block">
            返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
