"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/profile";
import { reverseGeocodeToCityDistrict } from "@/lib/geocode";
import type { DiaryEntry, Notebook } from "@/lib/diary-types";

type Album = { id: string; name: string; sort_order: number };

export default function DiaryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null>(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<DiaryEntry | null>(null);
  const [viewingImages, setViewingImages] = useState<string[]>([]);
  const [viewingLocationResolved, setViewingLocationResolved] = useState<string | null>(null);
  const [comments, setComments] = useState<{ id: string; content: string; author_nickname: string; created_at: string }[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [formContent, setFormContent] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formAlbumId, setFormAlbumId] = useState<string>("");
  const [formNotebookId, setFormNotebookId] = useState<string>("");
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DiaryEntry | null>(null);

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [newNotebookName, setNewNotebookName] = useState("");
  const [showAddNotebook, setShowAddNotebook] = useState(false);
  const [addingNotebook, setAddingNotebook] = useState(false);

  const [tab, setTab] = useState<"diary" | "draft">("diary");
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<"draft" | null>(null);
  const [deleteNotebookConfirm, setDeleteNotebookConfirm] = useState<Notebook | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const fetchDiaries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("diary")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      setEntries([]);
    } else {
      setEntries((data ?? []) as DiaryEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiaries();
  }, []);

  useEffect(() => {
    fetchNotebooks().then(async (list) => {
      if (list.length === 0) await ensureDefaultNotebook();
    });
  }, []);

  const fetchAlbums = async (): Promise<Album[]> => {
    const { data } = await supabase
      .from("album")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });
    const list = (data ?? []) as Album[];
    setAlbums(list);
    if (list.length > 0 && !formAlbumId) setFormAlbumId(list[0].id);
    return list;
  };

  const ensureDefaultAlbum = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("album")
      .insert({ name: "笔记", sort_order: 0, user_id: user?.id ?? null })
      .select("id")
      .single();
    if (data) await fetchAlbums();
  };

  const fetchNotebooks = async (): Promise<Notebook[]> => {
    const { data, error } = await supabase
      .from("notebook")
      .select("id, name, sort_order, created_at")
      .order("sort_order", { ascending: true });
    if (error) {
      console.warn("notebook 表可能未创建，请执行 supabase-notebook.sql", error);
      setNotebooks([]);
      return [];
    }
    const list = (data ?? []) as Notebook[];
    setNotebooks(list);
    if (list.length > 0 && !formNotebookId) setFormNotebookId(list[0].id);
    return list;
  };

  const ensureDefaultNotebook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("notebook")
      .insert({ name: "默认日记本", sort_order: 0, user_id: user?.id ?? null })
      .select("id")
      .single();
    if (!error && data) {
      await fetchNotebooks();
      setFormNotebookId(data.id);
    }
  };

  const addNotebook = async () => {
    const name = newNotebookName.trim();
    if (!name) return;
    setAddingNotebook(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("notebook")
      .insert({ name, sort_order: notebooks.length, user_id: user?.id ?? null })
      .select("id, name, sort_order, created_at")
      .single();
    setAddingNotebook(false);
    setNewNotebookName("");
    setShowAddNotebook(false);
    if (!error && data) {
      setNotebooks((n) => [...n, data as Notebook]);
      setFormNotebookId(data.id);
    }
  };

  useEffect(() => {
    if (!showForm) return;
    fetchNotebooks().then(async (list) => {
      if (list.length === 0) await ensureDefaultNotebook();
    });
    fetchAlbums().then(async (list) => {
      if (list.length === 0) await ensureDefaultAlbum();
    });
  }, [showForm]);

  const published = entries.filter((e) => !e.is_draft);
  const drafts = entries.filter((e) => e.is_draft);
  const bySearch = published.filter((e) =>
    !search.trim() || e.content.toLowerCase().includes(search.toLowerCase())
  );
  const filtered = selectedNotebookId
    ? bySearch.filter((e) => e.notebook_id === selectedNotebookId)
    : bySearch;

  const getLocation = () => {
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setFormLocation("设备不支持定位");
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const addr = await reverseGeocodeToCityDistrict(latitude, longitude);
          setFormLocation(addr);
        } catch {
          setFormLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setLocationLoading(false);
      },
      () => {
        setFormLocation("获取定位失败");
        setLocationLoading(false);
      }
    );
  };

  const openNew = () => {
    setEditing(null);
    setFormContent("");
    setFormLocation("");
    setFormAlbumId("");
    setFormNotebookId("");
    setFormImages([]);
    setFormError("");
    setShowAddNotebook(false);
    setNewNotebookName("");
    setShowForm(true);
  };

  const openDetail = async (e: DiaryEntry) => {
    setViewing(e);
    setViewingLocationResolved(null);
    setCommentInput("");
    const { data: imgData } = await supabase
      .from("album_image")
      .select("image_url")
      .eq("diary_id", e.id)
      .order("created_at", { ascending: true });
    setViewingImages((imgData ?? []).map((r: { image_url: string }) => r.image_url));
    const { data: cmtData, error: cmtErr } = await supabase
      .from("diary_comment")
      .select("id, content, author_nickname, created_at")
      .eq("diary_id", e.id)
      .order("created_at", { ascending: true });
    setComments(cmtErr ? [] : ((cmtData ?? []) as { id: string; content: string; author_nickname: string; created_at: string }[]));
    if (e.location && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(e.location.trim())) {
      const [lat, lon] = e.location.split(",").map((s) => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lon)) {
        reverseGeocodeToCityDistrict(lat, lon).then((addr) => {
          if (addr && !/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(addr)) setViewingLocationResolved(addr);
        });
      }
    }
  };

  const addComment = async () => {
    if (!viewing || !commentInput.trim()) return;
    setCommentSubmitting(true);
    const profile = getProfile();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("diary_comment")
      .insert({
        diary_id: viewing.id,
        user_id: user?.id ?? null,
        content: commentInput.trim(),
        author_nickname: profile.nickname || "我",
      })
      .select("id, content, author_nickname, created_at")
      .single();
    setCommentSubmitting(false);
    setCommentInput("");
    if (!error && data) setComments((c) => [...c, data as { id: string; content: string; author_nickname: string; created_at: string }]);
  };

  const openEdit = (e: DiaryEntry) => {
    setViewing(null);
    setEditing(e);
    setFormContent(e.content);
    setFormLocation(e.location ?? "");
    setFormAlbumId(e.album_id ?? "");
    setFormNotebookId(e.notebook_id ?? "");
    setFormImages([]);
    setShowForm(true);
  };

  const closeForm = (force = false) => {
    const hasContent = formContent.trim() || formImages.length > 0;
    if (!force && hasContent && !editing?.id && !formSubmitting) {
      setCloseConfirm("draft");
      return;
    }
    setShowForm(false);
    setEditing(null);
    setCloseConfirm(null);
    setSaveSuccessMessage(null);
  };

  const saveAsDraft = async () => {
    const content = formContent.trim();
    setDraftSaving(true);
    setFormError("");
    const { data: { user } } = await supabase.auth.getUser();
    const profile = getProfile();
    const albumId = formAlbumId || (formImages.length > 0 && albums[0] ? albums[0].id : null) || null;
    const row = {
      user_id: user?.id ?? null,
      content: content || "（无内容）",
      location: formLocation.trim() || null,
      is_private: false,
      is_draft: true,
      album_id: albumId,
      notebook_id: formNotebookId || null,
      author_nickname: profile.nickname || "LZY",
      author_avatar: profile.avatar,
    };
    try {
      const { error } = await supabase.from("diary").insert(row).select("id").single();
      if (error) throw error;
      await fetchDiaries();
      setSaveSuccessMessage("已保存为草稿");
      setTimeout(() => {
        setShowForm(false);
        setEditing(null);
        setCloseConfirm(null);
        setSaveSuccessMessage(null);
        setTab("draft");
      }, 1200);
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "草稿保存失败");
    }
    setDraftSaving(false);
  };

  const publishDraft = async (e: DiaryEntry) => {
    const { error } = await supabase.from("diary").update({ is_draft: false }).eq("id", e.id);
    if (error) console.error(error);
    else await fetchDiaries();
  };

  const deleteNotebook = async (n: Notebook) => {
    const { error } = await supabase.from("notebook").delete().eq("id", n.id);
    setDeleteNotebookConfirm(null);
    if (error) console.error(error);
    else await fetchNotebooks();
  };

  const uploadImages = async (diaryId: string, albumId: string | null): Promise<{ urls: string[]; errors: string[] }> => {
    const urls: string[] = [];
    const errors: string[] = [];
    for (let i = 0; i < formImages.length; i++) {
      const file = formImages[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${diaryId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("diary-images").upload(path, file, { upsert: true });
      if (error) {
        console.error("Upload error:", error);
        errors.push(`第${i + 1}张: ${error.message}`);
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from("diary-images").getPublicUrl(path);
      urls.push(publicUrl);
      if (albumId) {
        const { error: insertErr } = await supabase.from("album_image").insert({
          album_id: albumId,
          image_url: publicUrl,
          diary_id: diaryId,
        });
        if (insertErr) errors.push(`第${i + 1}张写入相册失败: ${insertErr.message}`);
      }
    }
    return { urls, errors };
  };

  const submit = async () => {
    const content = formContent.trim() || "（无文字）";
    const hasImages = formImages.length > 0;
    if (!content && !hasImages) return;
    setFormSubmitting(true);
    setFormError("");
    const { data: { user } } = await supabase.auth.getUser();
    const profile = getProfile();
    let albumId = formAlbumId || (hasImages && albums[0] ? albums[0].id : null) || null;
    if (hasImages && !albumId) {
      const { data: firstAlbum } = await supabase.from("album").select("id").order("sort_order", { ascending: true }).limit(1).maybeSingle();
      albumId = firstAlbum?.id ?? null;
      if (!albumId) {
        await ensureDefaultAlbum();
        const list = await fetchAlbums();
        albumId = list[0]?.id ?? null;
      } else {
        await fetchAlbums();
      }
    }
    const row = {
      user_id: user?.id ?? null,
      content,
      location: formLocation.trim() || null,
      is_private: false,
      is_draft: false,
      album_id: albumId,
      notebook_id: formNotebookId || null,
      author_nickname: profile.nickname || "LZY",
      author_avatar: profile.avatar,
    };
    try {
      let uploadErrorMsg = "";
      if (editing) {
        const { error } = await supabase.from("diary").update(row).eq("id", editing.id);
        if (error) throw error;
        if (formImages.length > 0 && albumId) {
          const { errors: uploadErrors } = await uploadImages(editing.id, albumId);
          if (uploadErrors.length > 0) uploadErrorMsg = "图片上传失败：" + uploadErrors.join("；");
        }
      } else {
        const { data: inserted, error } = await supabase.from("diary").insert(row).select("id").single();
        if (error) throw error;
        if (inserted && formImages.length > 0) {
          const { errors: uploadErrors } = await uploadImages(inserted.id, albumId);
          if (uploadErrors.length > 0) uploadErrorMsg = "图片上传失败：" + uploadErrors.join("；");
        }
      }
      await fetchDiaries();
      if (uploadErrorMsg) {
        setFormError(uploadErrorMsg + "。请检查 Supabase → Storage 是否已创建 diary-images 桶并设为 Public，见 supabase-storage-setup.md");
      } else {
        setSaveSuccessMessage("保存成功");
        setTimeout(() => {
          setShowForm(false);
          setEditing(null);
          setSaveSuccessMessage(null);
        }, 1200);
      }
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "保存失败。若提示缺少 is_draft 或 notebook_id 列，请在 Supabase 执行 supabase-draft.sql 和 supabase-notebook.sql");
    }
    setFormSubmitting(false);
  };

  const deleteDiary = async (id: string) => {
    const { error } = await supabase.from("diary").delete().eq("id", id);
    setDeleteConfirm(null);
    setViewing(null);
    if (error) console.error(error);
    else fetchDiaries();
  };

  return (
    <main className="min-h-dvh safe-bottom px-4 py-6 relative z-10">
      <header className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-2 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm sm:text-base"
        >
          ← 返回首页
        </Link>
        <h1 className="font-cute-cn font-bold text-xl text-stardew-dark">📔 日记本</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
            className="font-cute-cn text-stardew-brown text-sm border-2 border-stardew-dark rounded-pixel px-2 py-1.5"
          >
            退出
          </button>
          <button
            onClick={openNew}
            className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            ✏️ 写日记
          </button>
        </div>
      </header>

      {/* 日记 / 草稿箱 切换 */}
      <div className="flex gap-2 mb-4 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setTab("diary")}
          className={`flex-1 font-cute-cn font-bold py-2.5 rounded-pixel border-2 border-stardew-dark transition-all ${tab === "diary" ? "bg-stardew-green text-white shadow-pixel" : "bg-stardew-panel text-stardew-dark"}`}
        >
          📔 日记
        </button>
        <button
          type="button"
          onClick={() => setTab("draft")}
          className={`flex-1 font-cute-cn font-bold py-2.5 rounded-pixel border-2 border-stardew-dark transition-all ${tab === "draft" ? "bg-stardew-green text-white shadow-pixel" : "bg-stardew-panel text-stardew-dark"}`}
        >
          📥 草稿箱 {drafts.length > 0 && `(${drafts.length})`}
        </button>
      </div>

      {/* 我的日记本（仅日记 tab，点本子可看该分类日记） */}
      {tab === "diary" && (
        <div className="card-pixel rounded-pixel-lg p-4 mb-4 max-w-md mx-auto">
          <p className="font-cute-cn font-bold text-stardew-dark mb-2">📔 点日记本看该分类</p>
          {notebooks.length === 0 ? (
            <p className="font-cute-cn text-stardew-brown text-sm mb-2">暂无日记本。写日记时点「＋ 新建日记本」可添加；若一直为空，请在 Supabase 执行 supabase-notebook.sql</p>
          ) : (
            <ul className="flex flex-wrap gap-2 mb-2">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedNotebookId(null)}
                  className={`font-cute-cn text-sm px-3 py-1.5 rounded-pixel border transition-all ${selectedNotebookId === null ? "bg-stardew-green text-white border-stardew-dark" : "bg-stardew-panel border-stardew-dark/30 text-stardew-dark"}`}
                >
                  全部
                </button>
              </li>
              {notebooks.map((n) => (
                <li key={n.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedNotebookId(n.id)}
                    className={`font-cute-cn text-sm px-3 py-1.5 rounded-pixel border transition-all ${selectedNotebookId === n.id ? "bg-stardew-green text-white border-stardew-dark" : "bg-stardew-panel border-stardew-dark/30 text-stardew-dark"}`}
                  >
                    {n.name}
                  </button>
                  <button
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); setDeleteNotebookConfirm(n); }}
                    className="font-cute-cn text-xs text-red-600 border-2 border-stardew-dark rounded-pixel px-2 py-1 shadow-pixel hover:bg-red-50"
                    title="删除日记本"
                  >
                    删除
                  </button>
                </li>
              ))}
            </ul>
          )}
          {showAddNotebook ? (
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                placeholder="新日记本名称"
                maxLength={20}
                className="font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-1.5 flex-1 min-w-[120px] bg-stardew-panel"
                onKeyDown={(e) => e.key === "Enter" && addNotebook()}
              />
              <button onClick={addNotebook} disabled={addingNotebook || !newNotebookName.trim()} className="font-cute-cn text-sm btn-stardew px-3 py-1.5 disabled:opacity-50">
                {addingNotebook ? "添加中" : "添加"}
              </button>
              <button type="button" onClick={() => { setShowAddNotebook(false); setNewNotebookName(""); }} className="font-cute-cn text-xs text-stardew-brown">取消</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowAddNotebook(true)} className="font-cute-cn text-sm text-stardew-green border-2 border-stardew-dark rounded-pixel px-3 py-1.5">
              ＋ 新建日记本
            </button>
          )}
        </div>
      )}

      {/* 搜索（仅日记 tab） */}
      {tab === "diary" && (
        <div className="card-pixel rounded-pixel-lg p-3 mb-4 max-w-md mx-auto">
          <input
            type="text"
            placeholder="搜索日记内容..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full font-cute-cn text-stardew-dark border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel placeholder:text-stardew-brown/60 focus:outline-none focus:ring-2 focus:ring-stardew-green"
          />
        </div>
      )}

      {/* 草稿箱列表 */}
      {tab === "draft" && (
        <div className="max-w-md mx-auto space-y-3 mb-6">
          {drafts.length === 0 ? (
            <p className="text-center font-cute-cn text-stardew-brown py-12 card-pixel rounded-pixel-lg p-6">
              暂无草稿，写日记时点「关闭」可保存为草稿
            </p>
          ) : (
            drafts.map((e) => (
              <article
                key={e.id}
                className="card-pixel rounded-pixel-lg p-4 border-l-4 border-stardew-brown/50"
              >
                <p className="font-cute-cn text-stardew-dark text-sm line-clamp-2 mb-2">{e.content}</p>
                <p className="font-cute-cn text-stardew-brown/70 text-xs mb-3">
                  {new Date(e.updated_at).toLocaleString("zh-CN")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openEdit(e)}
                    className="font-cute-cn text-sm btn-stardew px-3 py-1.5"
                  >
                    继续写
                  </button>
                  <button
                    type="button"
                    onClick={() => publishDraft(e)}
                    className="font-cute-cn text-sm text-stardew-green border-2 border-stardew-dark rounded-pixel px-3 py-1.5"
                  >
                    发布
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(e)}
                    className="font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* 日记列表 */}
      {tab === "diary" && (loading ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12">加载中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12 card-pixel rounded-pixel-lg max-w-sm mx-auto p-6">
          暂无日记，点击「写日记」开始记录吧
        </p>
      ) : (
        <ul className="space-y-3 max-w-md mx-auto">
          {filtered.map((e) => (
            <li key={e.id}>
              <article
                onClick={() => openDetail(e)}
                className="card-pixel rounded-pixel-lg p-4 cursor-pointer hover:shadow-[8px_8px_0_var(--stardew-dark)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-[3px_3px_0_var(--stardew-dark)]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex-shrink-0 rounded-full border-2 border-stardew-dark bg-stardew-panel overflow-hidden flex items-center justify-center">
                    {e.author_avatar ? (
                      <img src={e.author_avatar} alt="" className="w-full h-full object-cover pixel-art" />
                    ) : (
                      <span className="font-pixel text-stardew-brown text-xs">?</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-cute-cn text-stardew-dark text-sm font-bold">{e.author_nickname}</p>
                      <span className="font-cute-cn text-stardew-brown/60 text-xs">
                        {new Date(e.created_at).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    <p className="font-cute-cn text-stardew-brown text-sm mt-1 line-clamp-2">
                      {e.content}
                    </p>
                    {e.location && (
                      <p className="font-cute-cn text-stardew-brown/80 text-xs mt-1 truncate">📍 {e.location}</p>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ))}

      {/* 日记详情 - 用 Portal 挂到 body，保证在全局 header 之上，返回按钮可见 */}
      {viewing && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#fdfbf8] via-[#f6f1ea] to-[#efe8df] safe-top">
          <header className="flex items-center gap-3 px-4 py-3 border-b-2 border-stardew-dark/20 bg-stardew-panel/95 shrink-0">
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-2 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all text-sm shrink-0"
            >
              ← 返回
            </button>
            <h2 className="font-cute-cn font-bold text-stardew-dark flex-1 text-center min-w-0">日记</h2>
            <button
              type="button"
              onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
              className="font-cute-cn text-stardew-brown text-sm border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shrink-0"
            >
              退出
            </button>
          </header>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="max-w-lg mx-auto px-4 py-6 pb-32">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-full border-2 border-stardew-dark bg-stardew-panel overflow-hidden">
                  {viewing.author_avatar ? (
                    <img src={viewing.author_avatar} alt="" className="w-full h-full object-cover pixel-art" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-pixel text-stardew-brown text-sm">?</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cute-cn font-bold text-stardew-dark">{viewing.author_nickname}</p>
                  <p className="font-cute-cn text-stardew-brown/70 text-xs mt-0.5">
                    {new Date(viewing.created_at).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
              <p className="font-cute-cn text-stardew-dark text-base leading-relaxed whitespace-pre-wrap break-words">
                {viewing.content}
              </p>
              {viewing.location && (
                <p className="font-cute-cn text-stardew-brown text-sm mt-3 flex items-center gap-1">
                  <span>📍</span> {viewingLocationResolved ?? viewing.location}
                </p>
              )}
              {viewingImages.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {viewingImages.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setViewingImageUrl(url)}
                      className="aspect-square rounded-pixel overflow-hidden border-2 border-stardew-dark bg-stardew-panel text-left block w-full cursor-zoom-in"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover pixel-art pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
              {viewingImageUrl && (
                <div
                  className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
                  onClick={() => setViewingImageUrl(null)}
                >
                  <button type="button" className="absolute top-4 right-4 font-cute-cn text-white text-sm border border-white/60 rounded-pixel px-3 py-1.5" onClick={() => setViewingImageUrl(null)}>
                    关闭
                  </button>
                  <img src={viewingImageUrl} alt="" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => openEdit(viewing)} className="font-cute-cn text-sm btn-stardew py-2 px-4">
                  编辑
                </button>
                <button onClick={() => setDeleteConfirm(viewing)} className="font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 px-4 shadow-pixel hover:bg-red-50">
                  删除
                </button>
              </div>
              <div className="mt-8 pt-6 border-t-2 border-stardew-dark/20">
                <p className="font-cute-cn font-bold text-stardew-dark mb-3">评论 ({comments.length})</p>
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-2 py-2 border-b border-stardew-dark/10 last:border-0">
                    <p className="font-cute-cn text-stardew-green text-sm font-bold shrink-0">{c.author_nickname}</p>
                    <p className="font-cute-cn text-stardew-brown text-sm flex-1">{c.content}</p>
                    <span className="font-cute-cn text-stardew-brown/60 text-xs shrink-0">{new Date(c.created_at).toLocaleString("zh-CN")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-stardew-panel/95 border-t-2 border-stardew-dark/20 safe-bottom">
            <div className="max-w-lg mx-auto flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="写评论..."
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel"
                onKeyDown={(e) => e.key === "Enter" && addComment()}
              />
              <button onClick={addComment} disabled={commentSubmitting || !commentInput.trim()} className="btn-stardew px-4 py-2 font-cute-cn text-sm disabled:opacity-50">
                {commentSubmitting ? "发送中" : "发送"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <p className="font-cute-cn text-stardew-dark text-sm mb-4">确定删除这条日记？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel shadow-pixel"
              >
                取消
              </button>
              <button
                onClick={() => deleteDiary(deleteConfirm.id)}
                className="flex-1 font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 shadow-pixel bg-red-50 hover:bg-red-100"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteNotebookConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <p className="font-cute-cn text-stardew-dark text-sm mb-4">确定删除日记本「{deleteNotebookConfirm.name}」？本子里的日记会保留，只是不再归类。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteNotebookConfirm(null)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel shadow-pixel"
              >
                取消
              </button>
              <button
                onClick={() => deleteNotebook(deleteNotebookConfirm)}
                className="flex-1 font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 shadow-pixel bg-red-50 hover:bg-red-100"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 写/编辑表单 - 全屏日记本风格 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex flex-col diary-page-bg safe-top safe-bottom">
          <header className="flex items-center justify-between px-4 py-3 border-b border-stardew-dark/20 bg-stardew-cream/95 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => closeForm()} className="font-cute-cn text-stardew-dark font-bold text-sm">
                ← 关闭
              </button>
              <button
                onClick={async () => { await supabase.auth.signOut(); router.replace("/login"); }}
                className="font-cute-cn text-stardew-brown text-xs border border-stardew-dark rounded-pixel px-2 py-1"
              >
                退出
              </button>
            </div>
            <h2 className="font-cute-cn font-bold text-stardew-dark">
              {saveSuccessMessage || (editing ? "编辑日记" : "写日记")}
            </h2>
            <button
              onClick={submit}
              disabled={formSubmitting || (!formContent.trim() && formImages.length === 0)}
              className="font-cute-cn text-sm btn-stardew px-4 py-1.5 disabled:opacity-50"
            >
              {formSubmitting ? "保存中..." : "发送"}
            </button>
          </header>
          <div className="flex-1 overflow-y-auto diary-page-paper">
            <div className="max-w-xl mx-auto pl-10 pr-6 py-6">
              {formError && (
                <div className="mb-4 rounded-pixel px-3 py-2 bg-red-100/90 border border-red-400">
                  <p className="font-cute-cn text-sm text-red-700">{formError}</p>
                </div>
              )}
              <textarea
                value={formContent}
                onChange={(e) => { setFormContent(e.target.value); setFormError(""); }}
                placeholder="写下今天的感受…可不写文字，只发图片也可"
                className="w-full font-cute-cn text-stardew-dark text-base leading-loose min-h-[40vh] bg-transparent border-0 resize-none focus:outline-none placeholder:text-stardew-brown/50"
                autoFocus
              />
              <p className="font-cute-cn text-xs text-stardew-brown/70 mt-1">可不写文字，只发图片也可发送</p>
              <div className="mt-6 pt-4 border-t border-stardew-dark/15 space-y-4">
                <div>
                  <label className="font-cute-cn text-sm font-bold text-stardew-dark block mb-2">📔 选择日记本</label>
                  {notebooks.length > 0 && (
                    <p className="font-cute-cn text-xs text-stardew-brown mb-2">当前可选：{notebooks.map((n) => n.name).join("、")}</p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {notebooks.length > 0 && (
                      <select
                        value={formNotebookId}
                        onChange={(e) => { setFormNotebookId(e.target.value); setShowAddNotebook(false); }}
                        className="font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-white/80 text-stardew-dark max-w-[180px]"
                      >
                        {notebooks.map((n) => (
                          <option key={n.id} value={n.id}>{n.name}</option>
                        ))}
                      </select>
                    )}
                    {!showAddNotebook ? (
                        <button
                          type="button"
                          onClick={() => setShowAddNotebook(true)}
                          className="font-cute-cn text-sm text-stardew-green border-2 border-stardew-dark rounded-pixel px-3 py-1.5"
                        >
                          ＋ 新建日记本
                        </button>
                      ) : (
                        <div className="flex gap-2 items-center flex-wrap">
                          <input
                            type="text"
                            value={newNotebookName}
                            onChange={(e) => setNewNotebookName(e.target.value)}
                            placeholder="日记本名称"
                            maxLength={20}
                            className="font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-1.5 w-32 bg-white/80"
                            onKeyDown={(e) => e.key === "Enter" && addNotebook()}
                          />
                          <button onClick={addNotebook} disabled={addingNotebook || !newNotebookName.trim()} className="font-cute-cn text-sm btn-stardew px-3 py-1.5 disabled:opacity-50">
                            {addingNotebook ? "添加中" : "添加"}
                          </button>
                          <button type="button" onClick={() => { setShowAddNotebook(false); setNewNotebookName(""); }} className="font-cute-cn text-xs text-stardew-brown">
                            取消
                          </button>
                        </div>
                      )}
                  </div>
                  {notebooks.length === 0 && !showAddNotebook && (
                    <p className="font-cute-cn text-xs text-stardew-brown mt-1">未创建日记本时日记不归类；可先点「新建日记本」。若未执行 supabase-notebook.sql 请先在 Supabase 执行。</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={getLocation}
                    disabled={locationLoading}
                    className="font-cute-cn text-sm text-stardew-green border-2 border-stardew-dark rounded-pixel px-3 py-1.5 disabled:opacity-50"
                  >
                    {locationLoading ? "获取中..." : "📍 添加定位"}
                  </button>
                  {formLocation && /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(formLocation.trim()) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const [lat, lon] = formLocation.split(",").map((s) => parseFloat(s.trim()));
                        if (!isNaN(lat) && !isNaN(lon)) {
                          setLocationLoading(true);
                          const addr = await reverseGeocodeToCityDistrict(lat, lon);
                          setFormLocation(addr);
                          setLocationLoading(false);
                        }
                      }}
                      disabled={locationLoading}
                      className="font-cute-cn text-xs text-stardew-green border border-stardew-dark rounded-pixel px-2 py-1 disabled:opacity-50"
                    >
                      转地址
                    </button>
                  )}
                  {formLocation && (
                    <span className="font-cute-cn text-xs text-stardew-brown truncate max-w-[200px]">{formLocation}</span>
                  )}
                </div>
                <div>
                  <label className="font-cute-cn text-sm font-bold text-stardew-dark block mb-2">📷 添加照片（最多 9 张）</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setFormImages(Array.from(e.target.files ?? []).slice(0, 9))}
                    className="font-cute-cn text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-pixel file:border-2 file:border-stardew-dark file:bg-stardew-panel file:text-stardew-dark"
                  />
                  {formImages.length > 0 && (
                    <p className="font-cute-cn text-xs text-stardew-brown mt-1">已选 {formImages.length} 张，最多 9 张</p>
                  )}
                </div>
                <div>
                  <label className="font-cute-cn text-sm font-bold text-stardew-dark block mb-2">📁 发到相册</label>
                  <select
                    value={formAlbumId}
                    onChange={(e) => setFormAlbumId(e.target.value)}
                    className="font-cute-cn text-sm w-full max-w-xs border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-white/80 text-stardew-dark"
                  >
                    <option value="">不放入相册</option>
                    {albums.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 关闭时：有内容则询问是否保存草稿 */}
          {closeConfirm === "draft" && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm bg-stardew-cream">
                <p className="font-cute-cn font-bold text-stardew-dark mb-4">有未发送的内容，保存为草稿？</p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={saveAsDraft}
                    disabled={draftSaving}
                    className="font-cute-cn text-sm btn-stardew w-full py-2.5 disabled:opacity-50"
                  >
                    {draftSaving ? "保存中..." : "保存为草稿"}
                  </button>
                  <button
                    type="button"
                    onClick={() => closeForm(true)}
                    className="font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2.5 w-full bg-stardew-panel text-stardew-dark"
                  >
                    不保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloseConfirm(null)}
                    className="font-cute-cn text-sm text-stardew-brown py-2"
                  >
                    继续编辑
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
