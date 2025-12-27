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
  X,
  CheckSquare,
  Square,
  FileText,
  Trash2,
  Globe,
  Palette
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { prepareMessagesForBlog, restoreBlogImages } from '@/utils/blogUtils';

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

  // Blog Generation State
  const [blogStyle, setBlogStyle] = useState<'literary' | 'logical' | 'record'>('literary');
  const [blogDraft, setBlogDraft] = useState<{ title: string; markdown: string } | null>(null);
  const [isBlogDraftVisible, setIsBlogDraftVisible] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [nickname, setNickname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_global_nickname');
      if (stored) setNickname(stored);
    }
  }, []);

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
            <div key={pairIdx} className="flex gap-3 items-start">
              {isSelectionMode && (
                <button
                  onClick={() => {
                    const ids = [pair.user?.id, pair.assistant?.id].filter(Boolean) as string[];
                    const next = new Set(selectedMessageIds);
                    // If both exist and are selected, deselect both. If one missing or unselected, select available ones.
                    // Simple logic: toggle group.
                    const allSelected = ids.every(id => next.has(id));
                    if (allSelected) {
                      ids.forEach(id => next.delete(id));
                    } else {
                      ids.forEach(id => next.add(id));
                    }
                    setSelectedMessageIds(next);
                  }}
                  className={`mt-6 flex-shrink-0 transition-all ${[pair.user?.id, pair.assistant?.id].filter(Boolean).every(id => selectedMessageIds.has(id as string)) ? 'text-[var(--accent-main)]' : 'text-slate-300 hover:text-slate-400'}`}
                >
                  {[pair.user?.id, pair.assistant?.id].filter(Boolean).every(id => selectedMessageIds.has(id as string)) ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              )}

              <div
                className={`flex-1 group p-6 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-6 ${isSelectionMode ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (isSelectionMode) {
                    const ids = [pair.user?.id, pair.assistant?.id].filter(Boolean) as string[];
                    const next = new Set(selectedMessageIds);
                    const allSelected = ids.every(id => next.has(id));
                    if (allSelected) {
                      ids.forEach(id => next.delete(id));
                    } else {
                      ids.forEach(id => next.add(id));
                    }
                    setSelectedMessageIds(next);
                  }
                }}
              >
                {pair.user && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">You</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 font-medium leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown
                          urlTransform={(url) => url}
                          components={{
                            img: ({ node, ...props }) => (
                              <img
                                {...props}
                                className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-200 shadow-sm object-cover my-2 inline-block"
                              />
                            )
                          }}
                        >
                          {pair.user.content}
                        </ReactMarkdown>
                      </div>
                      <div className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">{new Date(pair.user.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                )}
                {pair.assistant && (
                  <div className={`flex gap-4 ${pair.user ? 'pt-6 border-t border-slate-50' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex-shrink-0 flex items-center justify-center text-orange-400"><Sparkles className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 font-medium leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown
                          urlTransform={(url) => url}
                          components={{
                            img: ({ node, ...props }) => (
                              <img
                                {...props}
                                className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-200 shadow-sm object-cover my-2 inline-block"
                              />
                            )
                          }}
                        >
                          {pair.assistant.content}
                        </ReactMarkdown>
                      </div>
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
            </div>
          ))}
          {!loading && !error && messages.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No messages in this conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Blog Generation Toolbar */}
      {!loading && !error && messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-40">
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {/* Draft Preview */}
            <AnimatePresence>
              {blogDraft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="p-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-between bg-white overflow-hidden"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-3 rounded-xl bg-orange-100 text-orange-500 flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-widest">博客草稿已就绪</div>
                      <div className="text-sm text-slate-800 font-bold truncate">{blogDraft.title}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setBlogDraft(null)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('chat2blog_draft', JSON.stringify({ title: blogDraft.title, content: blogDraft.markdown }));
                        router.push('/publish');
                      }}
                      className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                    >
                      <Globe className="w-4 h-4" /> 立即发布
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all ${isSelectionMode ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'}`}
              >
                {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{isSelectionMode ? '退出选择' : '选择消息'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl">
                  <Palette className="w-4 h-4 text-slate-400" />
                  <select
                    value={blogStyle}
                    onChange={(e) => setBlogStyle(e.target.value as any)}
                    className="bg-transparent text-sm font-bold text-slate-600 outline-none border-none cursor-pointer appearance-none pr-4"
                  >
                    <option value="literary">文艺风格</option>
                    <option value="logical">逻辑严密</option>
                    <option value="record">对话实录</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 -ml-2 pointer-events-none" />
                </div>

                <button
                  disabled={blogLoading}
                  onClick={async () => {
                    try {
                      setBlogLoading(true);
                      const targetMessages = (isSelectionMode && selectedMessageIds.size > 0)
                        ? messages.filter((m: any) => selectedMessageIds.has(m.id))
                        : messages;

                      const { cleanedMessages, imageMap } = prepareMessagesForBlog(targetMessages);

                      const globalNick = localStorage.getItem('user_global_nickname');
                      const authorName = globalNick || nickname || '笔者';

                      const res = await fetch('/api/blog', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: cleanedMessages,
                          style: blogStyle,
                          authorName
                        }),
                      });

                      if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.error || 'Failed to generate blog');
                      }

                      const data = await res.json();
                      const restoredMarkdown = restoreBlogImages(data.markdown, imageMap);

                      setBlogDraft({
                        title: data.title,
                        markdown: restoredMarkdown
                      });
                      setIsBlogDraftVisible(true);
                    } catch (e: any) {
                      alert('生成失败: ' + e.message);
                    } finally {
                      setBlogLoading(false);
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-orange-200 ${blogLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'}`}
                >
                  {blogLoading ? '生成中...' : '生成博客'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
