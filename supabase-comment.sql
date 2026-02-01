-- 日记评论表（在 supabase-schema.sql 之后执行）
CREATE TABLE IF NOT EXISTS diary_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_id UUID NOT NULL REFERENCES diary(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  author_nickname TEXT NOT NULL DEFAULT '我',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS diary_comment_diary_id_idx ON diary_comment(diary_id);
ALTER TABLE diary_comment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "diary_comment_all" ON diary_comment;
CREATE POLICY "diary_comment_all" ON diary_comment FOR ALL USING (true) WITH CHECK (true);
