"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CountdownItem = { id: string; title: string; target_date: string; type: "anniversary" | "countdown"; user_id: string | null };

function calcDays(target: string, type: string): number {
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((t.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return type === "anniversary" ? -diff : diff;
}

export default function CountdownPage() {
  const [items, setItems] = useState<CountdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState<"anniversary" | "countdown">("anniversary");
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase.from("countdown").select("*").order("target_date", { ascending: true });
    setItems((data ?? []) as CountdownItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const add = async () => {
    const title = formTitle.trim();
    if (!title || !formDate) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("countdown").insert({
      title,
      target_date: formDate,
      type: formType,
      user_id: user?.id ?? null,
    });
    setSubmitting(false);
    setFormTitle("");
    setFormDate("");
    setFormType("anniversary");
    setShowForm(false);
    fetchItems();
  };

  const remove = async (id: string) => {
    await supabase.from("countdown").delete().eq("id", id);
    fetchItems();
  };

  return (
    <main className="min-h-dvh safe-bottom px-4 py-6 relative z-10">
      <header className="flex items-center justify-between mb-6">
        <Link href="/" className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all">
          ← 返回
        </Link>
        <h1 className="font-cute-cn font-bold text-xl text-stardew-dark">📅 纪念日 / 倒计时</h1>
        <button
          onClick={() => setShowForm(true)}
          className="font-cute-cn text-stardew-green font-bold border-2 border-stardew-dark rounded-pixel px-3 py-1.5 shadow-pixel active:shadow-[2px_2px_0_#3D2C29] active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          ➕ 添加
        </button>
      </header>

      {loading ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12">加载中...</p>
      ) : items.length === 0 ? (
        <p className="text-center font-cute-cn text-stardew-brown py-12 card-pixel rounded-pixel-lg max-w-sm mx-auto p-6">
          暂无纪念日，点击「添加」记录
        </p>
      ) : (
        <ul className="space-y-3 max-w-md mx-auto">
          {items.map((i) => {
            const days = calcDays(i.target_date, i.type);
            const isPast = i.type === "anniversary" ? days >= 0 : days < 0;
            return (
              <li key={i.id} className="card-pixel rounded-pixel-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-cute-cn font-bold text-stardew-dark">{i.title}</p>
                  <p className="font-cute-cn text-sm text-stardew-brown mt-1">
                    {i.target_date}
                    {i.type === "anniversary" && (
                      <span className="ml-2">
                        {isPast ? `已经 ${days} 天` : `还有 ${-days} 天`}
                      </span>
                    )}
                    {i.type === "countdown" && (
                      <span className="ml-2">
                        {days >= 0 ? `还有 ${days} 天` : `已过去 ${-days} 天`}
                      </span>
                    )}
                  </p>
                </div>
                <button onClick={() => remove(i.id)} className="font-cute-cn text-xs text-red-600 border border-red-300 rounded-pixel px-2 py-1">
                  删除
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card-pixel rounded-pixel-lg p-6 w-full max-w-sm">
            <h2 className="font-cute-cn font-bold text-stardew-dark mb-4">添加纪念日 / 倒计时</h2>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="标题（如：生日、考试）"
              className="w-full font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-2 mb-3 bg-stardew-panel"
            />
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel px-3 py-2 mb-3 bg-stardew-panel"
            />
            <div className="flex gap-2 mb-4">
              {(["anniversary", "countdown"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFormType(t)}
                  className={`flex-1 font-cute-cn text-sm py-2 rounded-pixel border-2 ${
                    formType === t ? "bg-stardew-green text-white border-stardew-dark" : "border-stardew-dark bg-stardew-panel"
                  }`}
                >
                  {t === "anniversary" ? "纪念日（已经X天）" : "倒计时（还有X天）"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 font-cute-cn text-sm border-2 border-stardew-dark rounded-pixel py-2 bg-stardew-panel">
                取消
              </button>
              <button onClick={add} disabled={submitting || !formTitle.trim() || !formDate} className="flex-1 btn-stardew py-2 font-cute-cn text-sm disabled:opacity-50">
                {submitting ? "添加中" : "添加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
