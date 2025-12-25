"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';
import { ArrowLeft, Clock, History } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!supabaseClient) {
          setError('Supabase 未配置：请设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY');
          setLoading(false);
          return;
        }
        const client = supabaseClient;
        const { data: { user }, error: userErr } = await client.auth.getUser();
        if (userErr) throw userErr;
        if (!user) {
          window.location.href = "/login";
          return;
        }
        const { data, error } = await client
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
    <main className="relative flex flex-col min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-page)]/80 backdrop-blur-xl border-b border-[var(--border-light)] z-50 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="p-3 hover:bg-[var(--bg-hover)] rounded-full transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
          </button>
          <div className="h-6 w-px bg-[var(--border-light)]" />
          <Logo className="w-8 h-8 opacity-90" showText={true} />
        </div>
        <div className="flex items-center gap-6">
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-[var(--text-tertiary)] hidden md:block">Dialogue History</div>
          <div className="h-6 w-px bg-[var(--border-light)] hidden md:block" />
          <UserStatus />
        </div>
      </header>

      <div className="pt-32 px-6 max-w-4xl mx-auto w-full pb-32">
        <div className="mb-12 flex items-end justify-between border-b border-[var(--border-light)] pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-[var(--text-primary)]">我的记录</h1>
            <p className="text-[var(--text-tertiary)] mt-2 font-medium">Archived Conversations — {conversations.length} Sessions</p>
          </div>
        </div>

        {loading && <div className="py-20 text-center text-[var(--text-tertiary)]">加载中...</div>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        <div className="grid gap-4">
          {conversations.map((c) => (
            <div
              key={c.id}
              className="group p-6 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-light)] hover:border-[var(--accent-main)]/30 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center">
                  <History className="w-5 h-5 text-[var(--accent-main)]" />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-main)] transition-colors">{c.title || "未命名会话"}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-hover)] uppercase font-bold text-[10px]">{c.view_mode === 'game' ? '恋与深空' : 'MBTI'}</span>
                    <span>{new Date(c.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
                  </div>
                </div>
              </div>
              <Link href={`/history/${c.id}`} className="px-5 py-2 rounded-full text-xs font-bold bg-[var(--accent-main)] text-white hover:opacity-90 transition-all">查看</Link>
            </div>
          ))}
          {!loading && !error && conversations.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="w-10 h-10 opacity-10" />
              </div>
              <p className="text-[var(--text-tertiary)]">暂无历史记录</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
