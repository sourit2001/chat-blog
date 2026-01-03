"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';
import { ArrowLeft, Clock, History, ChevronDown, Users, Sparkles, BookOpen, Heart, Menu, X, LayoutGrid, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<'all' | 'mbti' | 'game'>('all');
  const PAGE_SIZE = 20;

  const load = async (pageNum: number, append: boolean = false) => {
    if (pageNum === 0) setLoading(true);
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
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      if (append) {
        setConversations(prev => [...prev, ...(data || [])]);
      } else {
        setConversations(data || []);
      }

      setHasMore((data || []).length === PAGE_SIZE);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    load(nextPage, true);
  };

  return (
    <main className="relative flex flex-col min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 md:px-12 z-50 bg-white/40 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-10">
          <Link href="/">
            <Logo className="w-8 h-8 md:w-9 md:h-9" showText={true} accentColor="#F59E0B" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <div
              className="relative"
              onMouseEnter={() => setIsChatDropdownOpen(true)}
              onMouseLeave={() => setIsChatDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-[13px] font-bold text-slate-700 hover:text-slate-900 transition-colors py-8 uppercase tracking-widest">
                群聊 <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isChatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isChatDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-[80%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 mt-1"
                  >
                    <div className="space-y-1">
                      <Link href="/mbti" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">MBTI 聊天室</p>
                          <p className="text-[10px] text-slate-500">性格专家的对谈</p>
                        </div>
                      </Link>
                      <Link href="/lysk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">极夜编辑器</p>
                          <p className="text-[10px] text-slate-500">捕捉动人瞬间</p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsCommunityDropdownOpen(true)}
              onMouseLeave={() => setIsCommunityDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-[13px] font-bold text-slate-700 hover:text-slate-900 transition-colors py-8 uppercase tracking-widest">
                工具 <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isCommunityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCommunityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-[80%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 mt-1"
                  >
                    <div className="space-y-1">
                      <Link href="/blog" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">我的作品</p>
                          <p className="text-[10px] text-slate-500">查看博文草稿</p>
                        </div>
                      </Link>
                      <Link href="/history" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <History className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-800">历史记录</p>
                          <p className="text-[10px] text-slate-500">管理对话历史</p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:block">
            <UserStatus />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-[40] bg-white pt-24 px-6 lg:hidden overflow-y-auto"
          >
            <div className="space-y-6 pb-12">
              <div className="pb-6 border-b border-slate-100">
                <UserStatus isSidebar={true} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/mbti" className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 block">
                  <Users className="w-6 h-6 mb-2" />
                  <div className="text-sm font-bold">MBTI 聊天</div>
                </Link>
                <Link href="/lysk" className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 block">
                  <Sparkles className="w-6 h-6 mb-2" />
                  <div className="text-sm font-bold">极夜编辑</div>
                </Link>
                <Link href="/blog" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 block">
                  <BookOpen className="w-6 h-6 mb-2" />
                  <div className="text-sm font-bold">我的作品</div>
                </Link>
                <Link href="/history" className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 block">
                  <History className="w-6 h-6 mb-2" />
                  <div className="text-sm font-bold">历史记录</div>
                </Link>
              </div>
              <Link href="/" className="flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-600 font-bold">
                回到首页
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-32 px-6 max-w-4xl mx-auto w-full pb-32">
        <div className="mb-12 flex items-end justify-between border-b border-[var(--border-light)] pb-8">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-[var(--text-primary)]">我的记录</h1>
            <p className="text-[var(--text-tertiary)] mt-2 font-medium">Archived Conversations — {conversations.length} Sessions</p>
          </div>
        </div>

        {loading && <div className="py-20 text-center text-[var(--text-tertiary)]">加载中...</div>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}

        <div className="space-y-6">
          {['mbti', 'game'].map((mode) => {
            // Find all conversations for this mode
            const modeConvs = conversations.filter(c => c.view_mode === mode);
            if (modeConvs.length === 0) return null;

            // Get the latest one
            const latest = modeConvs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return (
              <div
                key={mode}
                className="group p-6 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border-light)] hover:border-[var(--accent-main)]/30 transition-all flex items-center justify-between shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
              >
                {/* Background Decoration */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-5 pointer-events-none transition-transform group-hover:scale-110 ${mode === 'game' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />

                <div className="flex items-center gap-6 min-w-0 z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${mode === 'game' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {mode === 'game' ? <Sparkles className="w-8 h-8" /> : <Users className="w-8 h-8" />}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent-main)] transition-colors">
                        {mode === 'game' ? '恋与深空 · 互动' : 'MBTI · 团队创作'}
                      </h3>
                      <span className="bg-[var(--bg-hover)] text-[var(--text-tertiary)] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {modeConvs.length} SESSIONS
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] pt-1">
                      <span className="font-bold font-mono text-[var(--accent-main)]">LATEST</span>
                      <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] opacity-30" />
                      <span>{new Date(latest.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</span>
                      <span>{new Date(latest.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 z-10 pl-4">
                  <Link
                    href={`/history/${latest.id}`}
                    className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--accent-main)] hover:text-white transition-all"
                    title="继续最近的对话"
                  >
                    <History className="w-5 h-5 mb-0.5 ml-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && hasMore && conversations.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-light)] text-[var(--accent-main)] font-bold text-sm hover:border-[var(--accent-main)] transition-all shadow-sm"
            >
              加载更多记录
            </button>
          </div>
        )}
        {loading && conversations.length > 0 && (
          <div className="mt-8 text-center text-[var(--text-tertiary)] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在加载更多...</span>
          </div>
        )}
        {!loading && !error && conversations.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 opacity-10" />
            </div>
            <p className="text-[var(--text-tertiary)]">暂无历史记录</p>
          </div>
        )}
      </div>
    </main>
  );
}
