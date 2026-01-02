"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import html2canvas from 'html2canvas';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';
import { MbtiReply } from "@/components/MbtiReply";
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
  Palette,
  Camera,
  ImageIcon,
  Download,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { prepareMessagesForBlog, restoreBlogImages } from '@/utils/blogUtils';
import { parseMbtiGroupReply, getRoleEmoji, getRoleAvatar, getRoleLabel, getRoleColor } from '@/utils/mbtiUtils';

const PERSONA_BLOCK_REGEX = /\[\[\[USER_PERSONA\]\]\][\s\S]*?\[\[\[\/USER_PERSONA\]\]\]/g;
const ROLES_BLOCK_REGEX = /\[\[\[SELECTED_ROLES\]\]\][\s\S]*?\[\[\[\/SELECTED_ROLES\]\]\]/g;

const stripPersonaBlock = (text: string) => (text || '').replace(PERSONA_BLOCK_REGEX, '').trim();
const stripRolesBlock = (text: string) => (text || '').replace(ROLES_BLOCK_REGEX, '').trim();

const getMessageContent = (content: any) => {
  let text = '';
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    text = content.map((p: any) => p.text || '').join('');
  }
  return stripRolesBlock(stripPersonaBlock(text));
};

const getMessageImages = (message: any) => {
  let images: string[] = [];
  if (Array.isArray(message.content)) {
    images = message.content.filter((p: any) => p.type === 'image' || p.image).map((p: any) => p.image || p.data);
  }
  const atts = message.experimental_attachments || message.attachments || message.audio_records; // Just in case
  if (Array.isArray(atts)) {
    const attImages = atts.filter((a: any) => a.contentType?.startsWith('image/') || a.url?.startsWith('data:image/')).map((a: any) => a.url);
    images = [...images, ...attImages];
  }
  return images.filter(Boolean);
};

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
  const [isMounted, setIsMounted] = useState(false);

  // Blog Generation State
  const [blogStyle, setBlogStyle] = useState<'literary' | 'logical' | 'record'>('literary');
  const [blogDraft, setBlogDraft] = useState<{ title: string; markdown: string } | null>(null);
  const [isBlogDraftVisible, setIsBlogDraftVisible] = useState(false);
  const [blogLoading, setBlogLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [nickname, setNickname] = useState('');
  const [isExportingImage, setIsExportingImage] = useState(false);
  const captureRef = React.useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDownloadImage = async () => {
    if (selectedMessageIds.size === 0) {
      alert('请先选择要生成的聊天内容');
      return;
    }

    try {
      setIsExportingImage(true);
      await new Promise(r => setTimeout(r, 800));

      if (!captureRef.current) throw new Error('Capture area not found');

      const images = captureRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      });
      await Promise.all(imagePromises);

      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `chat-export-${new Date().getTime()}.png`;
      link.click();
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsExportingImage(false);
    }
  };

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
          })().map((pair, pairIdx) => {
            const userContent = pair.user ? getMessageContent(pair.user.content) : '';
            const assistantContent = pair.assistant ? getMessageContent(pair.assistant.content) : '';
            const viewMode = (conversation?.view_mode === 'game' ? 'game' : 'mbti') as 'mbti' | 'game';
            const parsed = pair.assistant ? parseMbtiGroupReply(assistantContent, viewMode) : null;
            const hasRoles = parsed && parsed.roles.length > 0;

            return (
              <div key={pairIdx} className="flex gap-3 items-start">
                {isSelectionMode && (
                  <button
                    onClick={() => {
                      const ids = [pair.user?.id, pair.assistant?.id].filter(Boolean) as string[];
                      const next = new Set(selectedMessageIds);
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
                  className={`flex-1 group transition-all space-y-6 ${isSelectionMode ? 'cursor-pointer' : ''}`}
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
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-main)] flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white uppercase shadow-sm">You</div>
                      <div className="flex-1 flex flex-col items-end min-w-0">
                        <div className="p-4 rounded-2xl rounded-tr-sm bg-[var(--accent-main)] text-white shadow-sm border border-[var(--accent-main)]/20">
                          <div className="text-sm font-medium leading-relaxed prose prose-sm prose-invert max-w-none">
                            <ReactMarkdown
                              urlTransform={(url) => url}
                              components={{
                                img: ({ node, ...props }) => (
                                  <img
                                    {...props}
                                    className="max-w-[200px] max-h-[200px] rounded-lg border border-white/20 shadow-sm object-cover my-2 inline-block"
                                  />
                                )
                              }}
                            >
                              {userContent}
                            </ReactMarkdown>
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-widest">{new Date(pair.user.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  )}

                  {pair.assistant && (
                    <div className="space-y-6">
                      {pair.assistant && !hasRoles && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-white flex-shrink-0 flex items-center justify-center text-[var(--accent-main)] border border-slate-100 shadow-sm">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col items-start">
                            <div className="p-4 rounded-2xl rounded-tl-sm bg-white shadow-sm border border-slate-100">
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
                                  {assistantContent}
                                </ReactMarkdown>
                                {getMessageImages(pair.assistant).length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {getMessageImages(pair.assistant).map((img, idx) => (
                                      <img key={idx} src={img} alt="" className="max-w-full rounded-xl shadow-sm border border-slate-100" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-[9px] text-slate-300 font-bold mt-1 uppercase tracking-widest">{new Date(pair.assistant.created_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      )}

                      {hasRoles && (
                        <MbtiReply
                          parsed={parsed!}
                          messageId={pair.assistant.id}
                          viewMode={viewMode}
                          accentColor="#F59E0B"
                          audioRecords={pair.assistant.audio_records}
                        />
                      )}

                      {pair.assistant.audio_records && pair.assistant.audio_records.length > 0 && !hasRoles && (
                        <div className="mt-4 px-12 space-y-2">
                          {pair.assistant.audio_records.map((audio: any) => (
                            <div key={audio.id} className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">{audio.type === 'tts' ? 'Voice Response' : 'Recording'}</span>
                              <audio controls src={audio.url} className="h-7 w-full max-w-[240px] opacity-60 hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

                <button
                  disabled={isExportingImage}
                  onClick={handleDownloadImage}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg ${isExportingImage ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 active:scale-95 shadow-blue-100'}`}
                >
                  {isExportingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  <span>{isExportingImage ? '生成中...' : '生成图片'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Capture Area for Image Export */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        <div
          ref={captureRef}
          className="p-10 w-[600px] flex flex-col gap-6 bg-white"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}
              >
                <Sparkles className="w-6 h-6" style={{ color: '#F59E0B' }} />
              </div>
              <div>
                <div className="text-sm font-black tracking-tight" style={{ color: '#0f172a' }}>
                  智聊室 · Chat Blog
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8', opacity: 0.6 }}>
                  Creative Co-Creation
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono" style={{ color: '#94a3b8', opacity: 0.4 }}>
              {isMounted ? new Date().toLocaleDateString() : ''}
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-8">
            {messages
              .filter((m: any) => selectedMessageIds.has(m.id))
              .map((m: any) => {
                const content = getMessageContent(m.content);
                const images = getMessageImages(m);
                const viewMode = (conversation?.view_mode === 'game' ? 'game' : 'mbti') as 'mbti' | 'game';
                const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content, viewMode) : null;
                const hasRoles = parsed && parsed.roles.length > 0;

                if (m.role !== 'assistant' || !hasRoles) {
                  return (
                    <div key={`export-${m.id}`} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                        style={{
                          backgroundColor: m.role === 'user' ? '#F59E0B' : '#ffffff',
                          color: m.role === 'user' ? '#ffffff' : '#F59E0B',
                          border: '1px solid rgba(0,0,0,0.05)',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        {m.role === 'user' ? (
                          <div className="text-[9px] font-black uppercase" style={{ color: '#ffffff' }}>You</div>
                        ) : (
                          <Sparkles className="w-4 h-4" style={{ color: '#F59E0B' }} />
                        )}
                      </div>
                      <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div
                          className={`p-4 rounded-2xl ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                          style={{
                            backgroundColor: m.role === 'user' ? '#F59E0B' : '#ffffff',
                            border: m.role === 'user' ? 'none' : '1px solid #f1f5f9',
                            boxShadow: m.role === 'user' ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                          }}
                        >
                          <div
                            className={`text-[14px] max-w-none leading-relaxed ${m.role === 'user' ? 'font-medium' : ''}`}
                            style={{ color: m.role === 'user' ? '#ffffff' : '#334155' }}
                          >
                            <ReactMarkdown>{content}</ReactMarkdown>
                            {images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {images.map((img, idx) => (
                                  <img key={idx} src={img} alt="" className="max-w-full rounded-xl shadow-sm border border-slate-100" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`export-${m.id}`}>
                    <MbtiReply
                      parsed={parsed!}
                      messageId={`export-${m.id}`}
                      viewMode={viewMode}
                      forceShowAll={true}
                      audioRecords={m.audio_records}
                    />
                  </div>
                );
              })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 flex justify-between items-center" style={{ borderTop: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black text-white"
                style={{ backgroundColor: '#F59E0B' }}
              >B</div>
              <div className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>Created via Chat2Blog</div>
            </div>
            <div className="text-[9px] font-medium" style={{ color: '#cbd5e1' }}>#{conversation?.id?.slice(0, 8)}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
