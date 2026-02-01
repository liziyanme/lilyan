"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ fontFamily: "sans-serif", padding: "2rem", textAlign: "center", background: "#f5e6d3" }}>
        <h2>出错了</h2>
        <p style={{ color: "#5c4033", marginBottom: "1rem" }}>
          {error.message || "应用加载失败"}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            background: "#4a7c59",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          重试
        </button>
      </body>
    </html>
  );
}
