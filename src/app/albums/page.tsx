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
              <h2 className="font-cute-cn font-bold text-stardew-dark mb-3">{a.name}</h2>
              {a.images.length === 0 ? (
                <p className="font-cute-cn text-sm text-stardew-brown">暂无照片，写日记时选择此相册添加</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {a.images.map((img) => (
                    <div key={img.id} className="aspect-square rounded-pixel overflow-hidden border-2 border-stardew-dark bg-stardew-panel">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover pixel-art" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
