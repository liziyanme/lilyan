-- 草稿箱：未写完可保存为草稿，稍后继续写或发布
-- 在 Supabase Dashboard → SQL Editor 中执行

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'diary' AND column_name = 'is_draft'
  ) THEN
    ALTER TABLE diary ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS diary_is_draft_idx ON diary(is_draft) WHERE is_draft = true;
  END IF;
END $$;
