"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/profile";
import { reverseGeocodeToCityDistrict } from "@/lib/geocode";
import type { DiaryEntry } from "@/lib/diary-types";

type Album = { id: string; name: string; sort_order: number };

export default function DiaryPage() {
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
  const [formImages, setFormImages] = useState<File[]>([]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<DiaryEntry | null>(null);

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

  useEffect(() => {
    if (!showForm) return;
    fetchAlbums().then(async (list) => {
      if (list.length === 0) await ensureDefaultAlbum();
    });
  }, [showForm]);

  const ensureDefaultAlbum = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from("album")
      .insert({ name: "笔记", sort_order: 0, user_id: user?.id ?? null })
      .select("id")
      .single();
    if (data) await fetchAlbums();
  };

  const filtered = entries.filter((e) =>
    !search.trim() || e.content.toLowerCase().includes(search.toLowerCase())
  );

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
    setFormImages([]);
    setFormError("");
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
    setFormImages([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const uploadImages = async (diaryId: string, albumId: string | null): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < formImages.length; i++) {
      const file = formImages[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${diaryId}/${Date.now()}-${i}.${ext}`;
      const { error } = await supabase.storage.from("diary-images").upload(path, file, { upsert: true });
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      const { data: { publicUrl } } = supabase.storage.from("diary-images").getPublicUrl(path);
      urls.push(publicUrl);
      if (albumId) {
        await supabase.from("album_image").insert({
          album_id: albumId,
          image_url: publicUrl,
          diary_id: diaryId,
        });
      }
    }
    return urls;
  };

  const submit = async () => {
    const content = formContent.trim();
    if (!content) return;
    setFormSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const profile = getProfile();
    // 有照片时自动选第一个相册（若未选）
    const albumId = formAlbumId || (formImages.length > 0 && albums[0] ? albums[0].id : null) || null;
    const row = {
      user_id: user?.id ?? null,
      content,
      location: formLocation.trim() || null,
      is_private: false,
      album_id: albumId,
      author_nickname: profile.nickname || "LZY",
      author_avatar: profile.avatar,
    };
    try {
      if (editing) {
        const { error } = await supabase.from("diary").update(row).eq("id", editing.id);
        if (error) throw error;
        if (formImages.length > 0 && albumId) {
          await uploadImages(editing.id, albumId);
        }
      } else {
        const { data: inserted, error } = await supabase.from("diary").insert(row).select("id").single();
        if (error) throw error;
        if (inserted && formImages.length > 0 && albumId) {
          await uploadImages(inserted.id, albumId);
        }
      }
      fetchDiaries();
      closeForm();
    } catch (err) {
      console.error(err);
      setFormError(err instanceof Error ? err.message : "保存失败，请检查 Supabase Storage 是否已创建 diary-images 桶（见 supabase-storage-setup.md）");
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
          className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          ← 返回
        </Link>
        <h1 className="font-cute-cn font-bold text-xl text-stardew-dark">📔 日记本</h1>
        <button
          onClick={openNew}
          className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          ✏️ 写日记
        </button>
      </header>

      {/* 搜索 */}
      <div className="card-pixel rounded-pixel-lg p-3 mb-4 max-w-md mx-auto">
        <input
          type="text"
          placeholder="搜索日记内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full font-cute-cn text-stardew-dark border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel placeholder:text-stardew-brown/60 focus:outline-none focus:ring-2 focus:ring-stardew-green"
        />
      </div>

      {/* 列表 */}
      {loading ? (
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
      )}

      {/* 日记详情 - 全屏展示（仿微博） */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-tint-blue-strong">
          <header className="flex items-center gap-3 px-4 py-3 border-b-2 border-stardew-dark/20 bg-white/90 shrink-0">
            <button onClick={() => setViewing(null)} className="font-cute-cn text-stardew-dark text-sm font-bold">
              ← 返回
            </button>
            <h2 className="font-cute-cn font-bold text-stardew-dark flex-1 text-center">日记</h2>
            <span className="w-12" />
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
                    <div key={i} className="aspect-square rounded-pixel overflow-hidden border-2 border-stardew-dark bg-stardew-panel">
                      <img src={url} alt="" className="w-full h-full object-cover pixel-art" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => openEdit(viewing)} className="font-cute-cn text-sm btn-stardew py-2 px-4">
                  编辑
                </button>
                <button onClick={() => setDeleteConfirm(viewing)} className="font-cute-cn text-sm border-2 border-red-400 text-red-600 rounded-pixel py-2 px-4 hover:bg-red-50">
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
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t-2 border-stardew-dark/20 safe-bottom">
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
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <p className="font-cute-cn text-stardew-dark text-sm mb-4">确定删除这条日记？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel"
              >
                取消
              </button>
              <button
                onClick={() => deleteDiary(deleteConfirm.id)}
                className="flex-1 btn-stardew py-2 font-cute-cn text-sm bg-red-500 border-stardew-dark hover:bg-red-600"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 写/编辑表单 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-cute-cn font-bold text-lg text-stardew-dark mb-4">
              {editing ? "编辑日记" : "写日记"}
            </h2>
            {formError && (
              <div className="mb-3 card-pixel rounded-pixel px-3 py-2 bg-red-100 border-2 border-red-400">
                <p className="font-cute-cn text-sm text-red-700">{formError}</p>
              </div>
            )}
            <textarea
              value={formContent}
              onChange={(e) => { setFormContent(e.target.value); setFormError(""); }}
              placeholder="写下今天的感受..."
              rows={4}
              className="w-full font-cute-cn text-stardew-dark border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel placeholder:text-stardew-brown/60 focus:outline-none focus:ring-2 focus:ring-stardew-green resize-none"
            />
            <div className="mt-3 flex items-center gap-2 flex-wrap">
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
                <span className="font-cute-cn text-xs text-stardew-brown truncate max-w-[180px]">{formLocation}</span>
              )}
            </div>
            <div className="mt-3">
              <label className="font-cute-cn text-sm text-stardew-dark block mb-2">📷 添加照片</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFormImages(Array.from(e.target.files ?? []))}
                className="font-cute-cn text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-pixel file:border-2 file:border-stardew-dark file:bg-stardew-panel file:text-stardew-dark"
              />
              {formImages.length > 0 && (
                <p className="font-cute-cn text-xs text-stardew-brown mt-1">已选 {formImages.length} 张</p>
              )}
            </div>
            <div className="mt-3">
              <label className="font-cute-cn text-sm text-stardew-dark block mb-2">📁 发到相册</label>
              <select
                value={formAlbumId}
                onChange={(e) => setFormAlbumId(e.target.value)}
                className="font-cute-cn text-sm w-full border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel text-stardew-dark"
              >
                <option value="">不放入相册</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={closeForm}
                className="flex-1 font-cute-cn text-stardew-brown border-2 border-stardew-dark rounded-pixel py-2"
              >
                取消
              </button>
              <button
                onClick={submit}
                disabled={formSubmitting || !formContent.trim()}
                className="flex-1 btn-stardew py-2 disabled:opacity-50"
              >
                {formSubmitting ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
