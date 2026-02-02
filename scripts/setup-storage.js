/**
 * 一键创建 Supabase Storage 桶 diary-images（用于日记图片上传）
 * 使用前：在 .env.local 配置 SUPABASE_SERVICE_ROLE_KEY
 * 运行：node scripts/setup-storage.js
 */
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("未找到 .env.local，请先配置 Supabase");
    process.exit(1);
  }
  const env = fs.readFileSync(envPath, "utf8");
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();
  if (!url || !key) {
    console.error("请在 .env.local 配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.storage.createBucket("diary-images", {
    public: true,
    fileSizeLimit: 5242880,
  });

  if (error) {
    if (error.message?.includes("already exists")) {
      console.log("✓ diary-images 桶已存在，无需创建");
    } else {
      console.error("创建失败:", error.message);
      process.exit(1);
    }
  } else {
    console.log("✓ diary-images 桶创建成功！");
  }
}

main();
