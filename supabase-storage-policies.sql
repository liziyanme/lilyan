-- Storage 上传策略：解决 "new row violates row-level security policy"
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 允许已登录用户向 diary-images 桶上传
DROP POLICY IF EXISTS "Allow authenticated upload to diary-images" ON storage.objects;
CREATE POLICY "Allow authenticated upload to diary-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'diary-images');

-- 允许所有人读取 diary-images 桶（公开相册）
DROP POLICY IF EXISTS "Allow public read diary-images" ON storage.objects;
CREATE POLICY "Allow public read diary-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'diary-images');

-- 允许已登录用户更新/覆盖（写日记时 upsert 需要）
DROP POLICY IF EXISTS "Allow authenticated update diary-images" ON storage.objects;
CREATE POLICY "Allow authenticated update diary-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'diary-images')
WITH CHECK (bucket_id = 'diary-images');
