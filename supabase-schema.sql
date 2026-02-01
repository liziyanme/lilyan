-- LZY's Diary - Supabase 表结构
-- 在 Supabase Dashboard → SQL Editor 中执行此脚本

-- 1. 日记表
CREATE TABLE IF NOT EXISTS diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  content TEXT NOT NULL,
  location TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  author_nickname TEXT NOT NULL DEFAULT 'LZY',
  author_avatar TEXT,
  album_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diary_user_id_idx ON diary(user_id);
CREATE INDEX IF NOT EXISTS diary_created_at_idx ON diary(created_at DESC);
CREATE INDEX IF NOT EXISTS diary_content_search_idx ON diary USING gin(to_tsvector('simple', content));

-- 2. 纪念日/倒计时表
CREATE TABLE IF NOT EXISTS countdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  target_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('anniversary', 'countdown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS countdown_user_id_idx ON countdown(user_id);

-- 3. 云相册板块表
CREATE TABLE IF NOT EXISTS album (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS album_user_id_idx ON album(user_id);

-- 4. 相册图片表
CREATE TABLE IF NOT EXISTS album_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES album(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  diary_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS album_image_album_id_idx ON album_image(album_id);

-- 5. 访客记录表
CREATE TABLE IF NOT EXISTS visitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT,
  user_agent TEXT,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visitor_created_at_idx ON visitor(created_at DESC);

-- 6. 日记更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS diary_updated_at ON diary;
CREATE TRIGGER diary_updated_at
  BEFORE UPDATE ON diary
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 7. RLS 策略（使用匿名登录，user_id = auth.uid()）
ALTER TABLE diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE countdown ENABLE ROW LEVEL SECURITY;
ALTER TABLE album ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_image ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor ENABLE ROW LEVEL SECURITY;

-- diary: 个人单用户，暂时允许所有操作（后续可加登录鉴权）
DROP POLICY IF EXISTS "diary_select" ON diary;
CREATE POLICY "diary_select" ON diary FOR SELECT USING (true);
DROP POLICY IF EXISTS "diary_insert" ON diary;
CREATE POLICY "diary_insert" ON diary FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "diary_update" ON diary;
CREATE POLICY "diary_update" ON diary FOR UPDATE USING (true);
DROP POLICY IF EXISTS "diary_delete" ON diary;
CREATE POLICY "diary_delete" ON diary FOR DELETE USING (true);

-- countdown
DROP POLICY IF EXISTS "countdown_all" ON countdown;
CREATE POLICY "countdown_all" ON countdown FOR ALL USING (true) WITH CHECK (true);

-- album
DROP POLICY IF EXISTS "album_all" ON album;
CREATE POLICY "album_all" ON album FOR ALL USING (true) WITH CHECK (true);

-- album_image
DROP POLICY IF EXISTS "album_image_all" ON album_image;
CREATE POLICY "album_image_all" ON album_image FOR ALL USING (true) WITH CHECK (true);

-- visitor: 允许插入，仅后台可读（后续加鉴权）
DROP POLICY IF EXISTS "visitor_insert" ON visitor;
CREATE POLICY "visitor_insert" ON visitor FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "visitor_select" ON visitor;
CREATE POLICY "visitor_select" ON visitor FOR SELECT USING (true);
