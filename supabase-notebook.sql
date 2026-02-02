-- 日记本：写日记时可选择不同「本子」，可自行添加
-- 在 Supabase Dashboard → SQL Editor 中执行（若已执行过 supabase-schema.sql，只执行本文件即可）

-- 1. 日记本表
CREATE TABLE IF NOT EXISTS notebook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notebook_user_id_idx ON notebook(user_id);

-- 2. 日记表增加「所属日记本」
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'diary' AND column_name = 'notebook_id'
  ) THEN
    ALTER TABLE diary ADD COLUMN notebook_id UUID REFERENCES notebook(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS diary_notebook_id_idx ON diary(notebook_id);
  END IF;
END $$;

-- 3. RLS
ALTER TABLE notebook ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notebook_select" ON notebook;
CREATE POLICY "notebook_select" ON notebook FOR SELECT USING (true);
DROP POLICY IF EXISTS "notebook_insert" ON notebook;
CREATE POLICY "notebook_insert" ON notebook FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "notebook_update" ON notebook;
CREATE POLICY "notebook_update" ON notebook FOR UPDATE USING (true);
DROP POLICY IF EXISTS "notebook_delete" ON notebook;
CREATE POLICY "notebook_delete" ON notebook FOR DELETE USING (true);
