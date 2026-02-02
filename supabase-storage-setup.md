# Supabase Storage 设置（日记图片上传）

写日记添加照片前，需在 Supabase 创建存储桶。

---

## 方法一：一键脚本（推荐）

1. 在 `.env.local` 里加上一行（Supabase → Project Settings → API → service_role 复制）：
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

2. 在项目根目录 `c:\diary` 打开终端，执行：
   ```
   node scripts/setup-storage.js
   ```

3. 看到 `✓ diary-images 桶创建成功！` 即完成。

---

## 方法二：网页手动创建

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 点进你的项目
2. 左侧菜单点 **Storage**
3. 点右上角 **New bucket**
4. **Name** 填：`diary-images`（必须一模一样）
5. 勾选 **Public bucket**
6. 点 **Create bucket**

---

## 若提示 "new row violates row-level security policy"

说明桶已存在，但缺少上传权限。在 **Supabase → SQL Editor** 里执行项目里的 **`supabase-storage-policies.sql`**（全部复制粘贴 → Run），执行后再试上传。

---

## 若上传仍失败（其他错误）

1. Storage → 点 `diary-images` → **Policies**
2. 点 **New policy** → **For full customization**
3. 策略名随便填，**Allowed operation** 选 **INSERT**，**Target roles** 选 **authenticated**，**Policy definition** 填 `true`
4. 再新建一条：**SELECT**，**Policy definition** 填 `true`（公开读）
