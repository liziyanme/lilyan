# Supabase Storage 设置（日记图片上传）

写日记添加照片前，需在 Supabase 创建存储桶。

## 1. 创建存储桶

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard) → 你的项目
2. 左侧 **Storage** → **New bucket**
3. 桶名填写：`diary-images`
4. 勾选 **Public bucket**（公开读取，便于图片展示）
5. 点击 **Create bucket**

## 2. 设置上传策略（可选）

若上传失败，检查 Storage 策略：

1. Storage → 点击 `diary-images` 桶
2. **Policies** → **New policy**
3. 选择 **For full customization** 或使用预设
4. 策略示例（允许登录用户上传、公开读取）：
   - INSERT: `auth.role() = 'authenticated'`
   - SELECT: `true`（公开读）

完成后，写日记时即可添加照片。
