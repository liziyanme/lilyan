"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Album = { id: string; name: string; sort_order: number };
type AlbumImage = { id: string; image_url: string; diary_id: string | null };

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<(Album & { images: AlbumImage[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteAlbumConfirm, setDeleteAlbumConfirm] = useState<Album | null>(null);
  const [deleteImageConfirm, setDeleteImageConfirm] = useState<AlbumImage | null>(null);
  const [viewingAlbum, setViewingAlbum] = useState<(Album & { images: AlbumImage[] }) | null>(null);
  const [viewingImages, setViewingImages] = useState<AlbumImage[]>([]);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const fetchAlbums = async () => {
    const { data: albumData } = await supabase
      .from("album")
      .select("id, name, sort_order")
      .order("sort_order", { ascending: true });
    const list = (albumData ?? []) as Album[];
    const withImages = await Promise.all(
      list.map(async (a) => {
        const { data: imgData } = await supabase
          .from("album_image")
          .select("id, image_url, diary_id")
          .eq("album_id", a.id)
          .order("created_at", { ascending: false })
          .limit(12);
        return { ...a, images: (imgData ?? []) as AlbumImage[] };
      })
    );
    setAlbums(withImages);
    setLoading(false);
  };

  const openAlbumView = async (a: Album & { images: AlbumImage[] }) => {
    setViewingAlbum(a);
    const { data } = await supabase
      .from("album_image")
      .select("id, image_url, diary_id")
      .eq("album_id", a.id)
      .order("created_at", { ascending: false });
    setViewingImages((data ?? []) as AlbumImage[]);
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const addAlbum = async () => {
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    setAddError("");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("album").insert({
      name,
      sort_order: albums.length,
      user_id: user?.id ?? null,
    });
    setAdding(false);
    setNewName("");
    if (error) {
      setAddError(error.message || "添加失败，请检查是否已登录");
    } else {
      fetchAlbums();
    }
  };

  const deleteAlbum = async (a: Album) => {
    const { error } = await supabase.from("album").delete().eq("id", a.id);
    setDeleteAlbumConfirm(null);
    if (error) console.error(error);
    else fetchAlbums();
  };

  const deleteImage = async (img: AlbumImage) => {
    const { error } = await supabase.from("album_image").delete().eq("id", img.id);
    setDeleteImageConfirm(null);
    if (error) console.error(error);
    else fetchAlbums();
  };

  return (
    <main className="min-h-dvh safe-bottom px-4 py-6 relative z-10">
      <header className="flex items-center justify-between mb-6">
        <Link href="/" className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all">
          ← 返回
        </Link>
        <h1 className="font-cute-cn font-bold text-xl text-stardew-dark">📷 云相册</h1>
        <span className="w-24" />
      </header>
      <div className="max-w-md mx-auto space-y-4 mb-6">
        {addError && (
          <div className="card-pixel rounded-pixel px-3 py-2 bg-red-100 border-2 border-red-400">
            <p className="font-cute-cn text-sm text-red-700">{addError}</p>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="新相册名称（如：旅游、探店）"
            className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-2 bg-stardew-panel"
          />
          <button onClick={addAlbum} disabled={adding || !newName.trim()} className="btn-stardew px-4 py-2 font-cute-cn text-sm disabled:opacity-50">
            {adding ? "添加中" : "添加"}
          </button>
        </div>
      </div>
      {loading ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12">加载中...</p>
      ) : albums.length === 0 ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12 card-pixel rounded-pixel-lg max-w-sm mx-auto p-6">
          暂无相册，添加一个或在写日记时选择相册添加照片
        </p>
      ) : (
        <div className="space-y-6 max-w-md mx-auto">
          {albums.map((a) => (
            <div key={a.id} className="card-pixel rounded-pixel-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-cute-cn font-bold text-stardew-dark">{a.name}</h2>
                <div className="flex gap-2">
                  {a.images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => openAlbumView(a)}
                      className="font-cute-cn text-xs text-stardew-green border-2 border-stardew-dark rounded-pixel px-2 py-1 hover:bg-stardew-panel"
                    >
                      查看全部
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteAlbumConfirm(a)}
                    className="font-cute-cn text-xs text-red-600 border-2 border-stardew-dark rounded-pixel px-2 py-1 shadow-pixel hover:bg-red-50"
                  >
                    删除相册
                  </button>
                </div>
              </div>
              {a.images.length === 0 ? (
                <p className="font-cute-cn text-sm text-stardew-brown">暂无照片，写日记时选择此相册添加</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {a.images.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-pixel overflow-hidden border-2 border-stardew-dark bg-stardew-panel group">
                      <button
                        type="button"
                        onClick={() => setViewingImageUrl(img.image_url)}
                        className="absolute inset-0 w-full h-full block text-left cursor-zoom-in"
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-cover pixel-art pointer-events-none" />
                      </button>
                      <a
                        href={img.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-1 left-1 font-cute-cn text-xs bg-black/70 text-white rounded-pixel px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="下载"
                        onClick={(e) => e.stopPropagation()}
                      >
                        下载
                      </a>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteImageConfirm(img); }}
                        className="absolute top-1 right-1 font-cute-cn text-xs text-red-600 border-2 border-stardew-dark rounded-pixel px-1.5 py-0.5 shadow-pixel bg-stardew-panel hover:bg-red-50 z-10"
                        title="删除图片"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteAlbumConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <p className="font-cute-cn text-stardew-dark text-sm mb-4">确定删除相册「{deleteAlbumConfirm.name}」？相册内照片也会一并删除。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAlbumConfirm(null)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel shadow-pixel"
              >
                取消
              </button>
              <button
                onClick={() => deleteAlbum(deleteAlbumConfirm)}
                className="flex-1 font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 shadow-pixel bg-red-50 hover:bg-red-100"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteImageConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <p className="font-cute-cn text-stardew-dark text-sm mb-4">确定删除这张图片？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteImageConfirm(null)}
                className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel shadow-pixel"
              >
                取消
              </button>
              <button
                onClick={() => deleteImage(deleteImageConfirm)}
                className="flex-1 font-cute-cn text-sm text-red-600 border-2 border-stardew-dark rounded-pixel py-2 shadow-pixel bg-red-50 hover:bg-red-100"
              >
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingAlbum && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stardew-cream safe-top safe-bottom">
          <header className="flex items-center justify-between px-4 py-3 border-b-2 border-stardew-dark/20 bg-stardew-panel shrink-0">
            <button type="button" onClick={() => { setViewingAlbum(null); setViewingImages([]); }} className="font-cute-cn text-stardew-dark font-bold text-sm">
              ← 返回
            </button>
            <h2 className="font-cute-cn font-bold text-stardew-dark">{viewingAlbum.name}</h2>
            <span className="w-12" />
          </header>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-4">
              {viewingImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-pixel overflow-hidden border-2 border-stardew-dark bg-stardew-panel">
                  <button
                    type="button"
                    onClick={() => setViewingImageUrl(img.image_url)}
                    className="absolute inset-0 w-full h-full block text-left cursor-zoom-in"
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover pixel-art pointer-events-none" />
                  </button>
                  <a
                    href={img.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-0 left-0 right-0 font-cute-cn text-xs text-center py-2 bg-black/70 text-white z-10"
                    title="下载"
                    onClick={(e) => e.stopPropagation()}
                  >
                    下载
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewingImageUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setViewingImageUrl(null)}
        >
          <button type="button" className="absolute top-4 right-4 font-cute-cn text-white text-sm border border-white/60 rounded-pixel px-3 py-1.5 z-10" onClick={() => setViewingImageUrl(null)}>
            关闭
          </button>
          <a
            href={viewingImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-20 font-cute-cn text-white text-sm border border-white/60 rounded-pixel px-3 py-1.5 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            下载
          </a>
          <img src={viewingImageUrl} alt="" className="max-w-full max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </main>
  );
}
