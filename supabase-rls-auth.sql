-- 登录后按用户隔离数据：每位用户只能看到/修改自己的日记
-- 在 Supabase Dashboard → SQL Editor 中执行（在 supabase-schema.sql 之后执行）

-- 删除旧策略（含可能已存在的细分策略）
DROP POLICY IF EXISTS "diary_select" ON diary;
DROP POLICY IF EXISTS "diary_insert" ON diary;
DROP POLICY IF EXISTS "diary_update" ON diary;
DROP POLICY IF EXISTS "diary_delete" ON diary;
DROP POLICY IF EXISTS "countdown_all" ON countdown;
DROP POLICY IF EXISTS "countdown_select" ON countdown;
DROP POLICY IF EXISTS "countdown_insert" ON countdown;
DROP POLICY IF EXISTS "countdown_update" ON countdown;
DROP POLICY IF EXISTS "countdown_delete" ON countdown;
DROP POLICY IF EXISTS "album_all" ON album;
DROP POLICY IF EXISTS "album_select" ON album;
DROP POLICY IF EXISTS "album_insert" ON album;
DROP POLICY IF EXISTS "album_update" ON album;
DROP POLICY IF EXISTS "album_delete" ON album;
DROP POLICY IF EXISTS "album_image_all" ON album_image;

-- diary：仅操作自己的数据
CREATE POLICY "diary_select" ON diary FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "diary_insert" ON diary FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diary_update" ON diary FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "diary_delete" ON diary FOR DELETE
  USING (auth.uid() = user_id);

-- countdown、album、album_image：按 user_id 隔离
CREATE POLICY "countdown_select" ON countdown FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "countdown_insert" ON countdown FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "countdown_update" ON countdown FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "countdown_delete" ON countdown FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "album_select" ON album FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "album_insert" ON album FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "album_update" ON album FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "album_delete" ON album FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "album_image_all" ON album_image FOR ALL
  USING (true) WITH CHECK (true);
