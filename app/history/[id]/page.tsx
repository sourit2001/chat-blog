"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';
import {
  ArrowLeft,
  ChevronDown,
  Users,
  Sparkles,
  BookOpen,
  History,
  Heart,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        // Load conversation
        const { data: conv, error: convErr } = await client
          .from("conversations")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
        if (convErr) throw convErr;
        setConversation(conv);

        // Load messages with audio records
        const { data: msgs, error: msgsErr } = await client
          .from("messages")
          .select(`
            id,
            role,
            content,
            created_at,
            audio_records (
              id,
              type,
              url,
              created_at
            )
          `)
          .eq("conversation_id", id)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true });
        if (msgsErr) throw msgsErr;

        // Manual sort to handle identical timestamps
        const sortedMsgs = (msgs || []).sort((a: any, b: any) => {
          const tA = new Date(a.created_at).getTime();
          const tB = new Date(b.created_at).getTime();
          if (tA !== tB) return tA - tB;
          if (a.role === 'user' && b.role === 'assistant') return -1;
          if (a.role === 'assistant' && b.role === 'user') return 1;
          return 0;
        });

        setMessages(sortedMsgs);
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  return (
    <main className="relative flex flex-col min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 md:px-12 z-50 bg-white/40 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all group"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="h-6 w-px bg-[var(--border-light)]" />
          <Link href="/">
            <Logo className="w-8 h-8 md:w-9 md:h-9" showText={true} accentColor="#F59E0B" />
          </Link>

          <div className="hidden lg:flex items-center gap-8 ml-4">
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

      {/* Mobile Menu */}
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
              <button
                onClick={() => router.back()}
                className="w-full flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-600 font-bold"
              >
                返回列表
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 pt-32 p-6 max-w-3xl mx-auto w-full pb-32">
        {loading && (
          <div className="flex flex-col items-center py-20 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded-full mb-4" />
            <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">Loading Conversation...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            Error: {error}
          </div>
        )}

        {conversation && (
          <div className="mb-12">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-main)] mb-3">
              <span className="px-2 py-0.5 rounded bg-[var(--accent-main)]/10 border border-[var(--accent-main)]/20">
                {conversation.view_mode === 'game' ? '恋与深空' : 'MBTI'}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-400">{new Date(conversation.created_at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">{conversation.title || "未命名会话"}</h1>
          </div>
        )}

        <div className="space-y-6">
          {(() => {
            const pairs: any[] = [];
            let pendingUser: any | null = null;
            for (const msg of messages) {
              if (msg.role === 'user') {
                if (pendingUser) pairs.push({ user: pendingUser, assistant: null });
                pendingUser = msg;
              } else if (msg.role === 'assistant') {
                if (pendingUser) {
                  pairs.push({ user: pendingUser, assistant: msg });
                  pendingUser = null;
                } else {
                  pairs.push({ user: null, assistant: msg });
                }
              } else {
                pairs.push({ user: null, assistant: msg });
              }
            }
            if (pendingUser) pairs.push({ user: pendingUser, assistant: null });
            return pairs.reverse();
          })().map((pair, pairIdx) => (
            <div
              key={pairIdx}
              className="group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-6"
            >
              {pair.user && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">You</div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{pair.user.content}</div>
                    <div className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">{new Date(pair.user.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              )}
              {pair.assistant && (
                <div className={`flex gap-4 ${pair.user ? 'pt-6 border-t border-slate-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center text-orange-400"><Sparkles className="w-4 h-4" /></div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">{pair.assistant.content}</div>
                    <div className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">{new Date(pair.assistant.created_at).toLocaleTimeString()}</div>
                    {pair.assistant.audio_records && pair.assistant.audio_records.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {pair.assistant.audio_records.map((audio: any) => (
                          <div key={audio.id} className="flex flex-col gap-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{audio.type === 'tts' ? 'Voice Response' : 'Recording'}</span>
                            <audio controls src={audio.url} className="h-8 w-full max-w-sm rounded-lg" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {!loading && !error && messages.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No messages in this conversation.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
