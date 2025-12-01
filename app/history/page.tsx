"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
        if (userErr) throw userErr;
        if (!user) {
          window.location.href = "/login";
          return;
        }
        const { data, error } = await supabaseClient
          .from("conversations")
          .select("id, title, view_mode, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setConversations(data || []);
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="relative flex flex-col min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50" />
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-emerald-950 mb-2">我的聊天</h1>
          <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">← 返回主页</Link>
        </div>
        {loading && <p className="text-sm text-emerald-700">加载中...</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        <ul className="space-y-3">
          {conversations.map((c) => (
            <li key={c.id} className="p-4 rounded-2xl bg-white/90 border border-emerald-100 shadow shadow-emerald-100/60 backdrop-blur-md hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-emerald-950">{c.title || "未命名会话"}</div>
                  <div className="text-xs text-emerald-700 mt-1">{c.view_mode === 'game' ? '恋与深空' : 'MBTI'} · {new Date(c.created_at).toLocaleString()}</div>
                </div>
                <Link href={`/history/${c.id}`} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition">查看</Link>
              </div>
            </li>
          ))}
          {!loading && !error && conversations.length === 0 && (
            <li className="text-sm text-emerald-700 p-4 rounded-2xl bg-white/70 border border-emerald-100">暂无记录</li>
          )}
        </ul>
      </div>
    </main>
  );
}
