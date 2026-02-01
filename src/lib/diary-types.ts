/**
 * 发日记时记录当时的头像和昵称快照，后续修改资料不会影响已发日记。
 * 字段名与 Supabase 表一致（snake_case）
 */
export type DiaryEntry = {
  id: string;
  content: string;
  location?: string | null;
  is_private: boolean;
  author_nickname: string;
  author_avatar: string | null;
  created_at: string;
  updated_at: string;
  album_id?: string | null;
};
