import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 背景：稍深一点的蓝/紫，移动端平板都适用
        "tint-blue": "#E8F0FE",
        "tint-blue-strong": "#C5DCF7",
        "tint-purple": "#F3E8FA",
        "tint-purple-strong": "#E8D4F5",
        // 星露谷电子像素风
        stardew: {
          cream: "#F5E6D3",
          panel: "#E8DCC4",
          brown: "#5C4033",
          dark: "#3D2C29",
          green: "#4A7C59",
          grass: "#88B04B",
          sky: "#87CEEB",
          gold: "#D4A84B",
        },
        kitty: { pink: "#FFB7C5", rose: "#FF69B4", blush: "#FFE4EC", white: "#FFF5F8",
        },
        chiikawa: { mint: "#B8E6D5", sky: "#A8D8EA", cream: "#FFF9E6", brown: "#8B7355" },
      },
      fontFamily: {
        cute: ["var(--font-cute)", "cursive"],
        pixel: ["var(--font-pixel)", "monospace"],
        "cute-cn": ["var(--font-cute-cn)", "sans-serif"],
      },
      fontWeight: { "pixel-bold": "700" },
      borderRadius: {
        pixel: "4px",
        "pixel-lg": "8px",
      },
      boxShadow: {
        pixel: "4px 4px 0 #3D2C29",
        "pixel-lg": "6px 6px 0 #3D2C29",
      },
    },
  },
  plugins: [],
};

export default config;
