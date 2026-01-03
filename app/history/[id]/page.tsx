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

const MemoizedMessageContent = React.memo(({ content, isUser, fontSize }: { content: string, isUser: boolean, fontSize: string }) => {
  return (
    <div className={`${fontSize === 'xlarge' ? 'text-[18px]' : fontSize === 'large' ? 'text-[16px]' : 'text-[13.5px] sm:text-sm'} ${isUser ? 'prose-invert' : 'text-slate-800'} font-medium leading-relaxed prose prose-sm max-w-none`}>
      <ReactMarkdown
        urlTransform={(u) => u}
        components={{
          img: ({ src, ...props }) => {
            if (!src) return null;
            return <img src={src} {...props} loading="lazy" decoding="async" className="max-w-full h-auto rounded-lg shadow-sm my-2" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

const getMessageImages = (message: any) => {
  let images: string[] = [];
  if (Array.isArray(message.content)) {
    images = message.content.filter((p: any) => p.type === 'image' || p.image).map((p: any) => p.image || p.data);
  }
  const atts = message.experimental_attachments || message.attachments || message.audio_records;
  if (Array.isArray(atts)) {
    const attImages = atts.filter((a: any) => a.contentType?.startsWith('image/') || a.url?.startsWith('data:image/')).map((a: any) => a.url);
    images = [...images, ...attImages];
  }
  return images.filter(img => typeof img === 'string' && img.length > 0);
};

const MessagePairItem = React.memo(({
  pair,
  isSelectionMode,
  isSelected,
  fontSize,
  viewMode,
  onToggle
}: {
  pair: any,
  isSelectionMode: boolean,
  isSelected: boolean,
  fontSize: "standard" | "large" | "xlarge",
  viewMode: 'mbti' | 'game',
  onToggle: () => void
}) => {
  const userContent = pair.userContent;
  const assistantContent = pair.assistantContent;
  const parsed = pair.parsedAssistant;
  const hasRoles = parsed && parsed.roles.length > 0;

  return (
    <div className="flex gap-2 sm:gap-4 items-start group chat-message-item">
      {isSelectionMode && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`mt-4 sm:mt-6 flex-shrink-0 transition-all z-10 ${isSelected ? 'text-[var(--accent-main)]' : 'text-slate-300 hover:text-slate-400'}`}
        >
          {isSelected ? <CheckSquare className="w-4 h-4 sm:w-5 h-4 sm:h-5" /> : <Square className="w-4 h-4 sm:w-5 h-4 sm:h-5" />}
        </button>
      )}

      <div
        className={`flex-1 space-y-4 sm:space-y-6 ${isSelectionMode ? 'cursor-pointer' : ''}`}
        onClick={() => { if (isSelectionMode) onToggle(); }}
      >
        {pair.user && (
          <div className="flex gap-2 sm:gap-4 flex-row-reverse">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--accent-main)] flex-shrink-0 flex items-center justify-center text-[8px] sm:text-[10px] font-black text-white uppercase shadow-sm">You</div>
            <div className="flex-1 flex flex-col items-end min-w-0">
              <div className="p-2.5 sm:p-4 rounded-2xl rounded-tr-sm bg-[var(--accent-main)] text-white shadow-sm border border-[var(--accent-main)]/20 max-w-[94%] sm:max-w-none">
                <MemoizedMessageContent content={userContent} isUser={true} fontSize={fontSize} />
                {getMessageImages(pair.user).length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2.5 mt-3">
                    {getMessageImages(pair.user).map((img, idx) => (
                      <div key={idx} className="relative group/img overflow-hidden rounded-md border border-white/20 shadow-sm">
                        <img src={img || undefined} alt="" loading="lazy" decoding="async" className="attachment-img transition-transform group-hover/img:scale-110 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); window.open(img, '_blank'); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {pair.assistant && (
          <div className="space-y-4 sm:space-y-6">
            {hasRoles ? (
              <div className="flex flex-col gap-4">
                <MbtiReply parsed={parsed!} messageId={pair.assistant.id} viewMode={viewMode} forceShowAll={true} audioRecords={pair.assistant.audio_records} fontSize={fontSize} />
                {getMessageImages(pair.assistant).length > 0 && (
                  <div className="flex flex-wrap justify-start gap-2.5 ml-10 sm:ml-14">
                    {getMessageImages(pair.assistant).map((img, idx) => (
                      <div key={idx} className="relative group/img overflow-hidden rounded-md border border-slate-100 shadow-sm">
                        <img src={img || undefined} alt="" loading="lazy" decoding="async" className="attachment-img transition-transform group-hover/img:scale-110 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); window.open(img, '_blank'); }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white flex-shrink-0 flex items-center justify-center text-[var(--accent-main)] border border-slate-100 shadow-sm">
                  <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col items-start">
                  <div className="p-2.5 sm:p-4 rounded-2xl rounded-tl-sm bg-white shadow-sm border border-slate-100 max-w-[94%] sm:max-w-none">
                    <MemoizedMessageContent content={assistantContent} isUser={false} fontSize={fontSize} />
                    {getMessageImages(pair.assistant).length > 0 && (
                      <div className="flex flex-wrap justify-start gap-2.5 mt-3">
                        {getMessageImages(pair.assistant).map((img, idx) => (
                          <div key={idx} className="relative group/img overflow-hidden rounded-md border border-slate-100 shadow-sm">
                            <img src={img || undefined} alt="" loading="lazy" decoding="async" className="w-12 h-12 sm:w-14 sm:h-14 object-cover transition-transform group-hover/img:scale-110 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); window.open(img, '_blank'); }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {pair.assistant.audio_records && pair.assistant.audio_records.length > 0 && (
                    <div className="mt-2 sm:mt-4 px-1 space-y-2">
                      {pair.assistant.audio_records.map((audio: any) => (
                        <div key={audio.id} className="flex flex-col gap-1">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest ml-1">{audio.type === 'tts' ? 'Voice Response' : 'Recording'}</span>
                          <audio controls src={audio.url || undefined} className="h-6 sm:h-7 w-full max-w-[200px] sm:max-w-[240px] opacity-60 hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

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
  const [fontSize, setFontSize] = useState<'standard' | 'large' | 'xlarge'>('standard');

  const togglePairSelection = React.useCallback((userMsgId: string | null, asstMsgId: string | null) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      const ids = [userMsgId, asstMsgId].filter(Boolean) as string[];
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_global_nickname');
      if (stored) setNickname(stored);

      const savedFontSize = localStorage.getItem('chat_font_size');
      if (savedFontSize === 'standard' || savedFontSize === 'large' || savedFontSize === 'xlarge') {
        setFontSize(savedFontSize);
      }
    }
  }, []);

  // 1. Unified Cache System (Persistent within session)
  // This satisfies the "don't reload what's already loaded" requirement.
  const getCacheKey = (mode: string) => `history_cache_${mode}`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!supabaseClient) throw new Error('Supabase 未配置');
        const client = supabaseClient;

        // **Optimization A: Parallelize Initial metadata fetching**
        const [userRes, convRes] = await Promise.all([
          client.auth.getUser(),
          client.from("conversations").select("id, view_mode, user_id").eq("id", id).single()
        ]);

        const user = userRes.data.user;
        const conv = convRes.data;
        if (!user) { window.location.href = "/login"; return; }
        if (convRes.error || !conv) throw new Error(convRes.error?.message || "会话不存在");

        setConversation(conv);
        const mode = conv.view_mode || 'mbti';

        // **Optimization B: Instant UI from Cache**
        const cacheKey = getCacheKey(mode);
        try {
          const cachedContent = sessionStorage.getItem(cacheKey);
          if (cachedContent) {
            const parsedCache = JSON.parse(cachedContent);
            if (Date.now() - parsedCache.timestamp < 1000 * 60 * 10) { // 10 min cache
              setMessages(parsedCache.messages);
              setLoading(false);
            }
          }
        } catch (e) { console.warn('Cache read failed:', e); }

        // **Optimization C: Background Intelligent Refresh**
        const { data: related } = await client.from('conversations').select('id').eq('user_id', user.id).eq('view_mode', mode).order('updated_at', { ascending: false }).limit(20);
        const ids = related?.map(r => r.id) || [id];

        const { data: rawMsgs, error: msgsError } = await client
          .from("messages")
          .select(`id, role, content, created_at, audio_records (id, type, url, created_at)`)
          .in("conversation_id", ids)
          .order("created_at", { ascending: false })
          .limit(20);

        if (!msgsError && rawMsgs) {
          setMessages(rawMsgs);
          // **Smart Caching with Quota Safety**
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              messages: rawMsgs,
              timestamp: Date.now()
            }));
          } catch (e) {
            // If quota exceeded, try to cache a smaller but useful subset (last 10 msgs)
            try {
              sessionStorage.removeItem(cacheKey);
              sessionStorage.setItem(cacheKey, JSON.stringify({
                messages: rawMsgs.slice(0, 10),
                timestamp: Date.now()
              }));
            } catch (innerE) {
              console.error('Session storage completely full');
            }
          }
        }
      } catch (e: any) {
        console.error('Fetch Failed:', e);
        setError("加载异常，请重试");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  useEffect(() => { setIsMounted(true); }, []);

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
        onclone: (doc) => {
          const style = doc.createElement('style');
          style.innerHTML = `
            :root {
              --color-slate-50: #f8fafc !important;
              --color-slate-100: #f1f5f9 !important;
              --color-slate-400: #94a3b8 !important;
              --color-slate-800: #1e293b !important;
              --color-slate-900: #0f172a !important;
              --color-orange-500: #f59e0b !important;
            }
          `;
          doc.head.appendChild(style);
        }
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('图片数据生成失败');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chat-export-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 500);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert('生成图片失败，请重试');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Group messages into user-assistant pairs (Descending Order Source)
  // Source: [ Newest... Oldest ]
  // Expected Pair: { User (trigger), Assistant (reply) }
  // In Descending stream: Assistant (Reply) comes first (index i), User (Trigger) comes next (index i+1)
  // 2. Performance: Pre-parse and memoize pairs calculation to avoid main-thread lockup
  const pairs = React.useMemo(() => {
    const p: { user: any; assistant: any; parsedAssistant: any; userContent: string; assistantContent: string }[] = [];
    const mode = conversation?.view_mode || 'mbti';
    let idx = 0;
    while (idx < messages.length) {
      const curr = messages[idx];
      if (curr.role === 'assistant') {
        const next = (idx + 1 < messages.length && messages[idx + 1].role === 'user') ? messages[idx + 1] : null;

        const assistantContent = getMessageContent(curr.content);
        const parsed = parseMbtiGroupReply(assistantContent, mode as any);
        const userContent = next ? getMessageContent(next.content) : '';

        if (next) {
          p.push({ user: next, assistant: curr, parsedAssistant: parsed, userContent, assistantContent });
          idx += 2;
        } else {
          p.push({ user: null, assistant: curr, parsedAssistant: parsed, userContent: '', assistantContent });
          idx++;
        }
      } else {
        p.push({ user: curr, assistant: null, parsedAssistant: null, userContent: getMessageContent(curr.content), assistantContent: '' });
        idx++;
      }
    }
    return p.reverse();
  }, [messages, conversation?.view_mode]);

  return (
    <main className="relative flex flex-col min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-12 z-50 bg-white/40 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2 sm:gap-6">
          <button
            onClick={() => router.back()}
            className="p-1 sm:p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all group"
          >
            <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-[var(--text-secondary)]" />
          </button>
          <div className="h-6 w-px bg-[var(--border-light)]" />
          <Link href="/">
            <Logo className="w-7 h-7 sm:w-9 sm:h-9" showText={true} accentColor="#F59E0B" />
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 font-bold text-slate-800">
          <UserStatus className="hidden sm:flex" />
        </div>
      </nav>

      <div className="flex-1 pt-20 sm:pt-32 px-3 sm:px-6 max-w-3xl mx-auto w-full pb-40 history-view-container relative">
        <style dangerouslySetInnerHTML={{
          __html: `
          /* GPU acceleration and Virtualization */
          .chat-message-item {
            content-visibility: auto;
            contain-intrinsic-size: 0 100px;
          }
          /* Only target actual content images, NOT avatars */
          .history-view-container .prose img,
          .history-view-container .attachment-img {
            max-width: 220px !important;
            max-height: 220px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain !important;
            border-radius: 12px !important;
            display: block !important;
            margin: 12px 0 !important;
            border: 1px solid rgba(0,0,0,0.06) !important;
            cursor: zoom-in !important;
            background: #ffffff !important;
            box-shadow: 0 4px 12px -2px rgba(0,0,0,0.08) !important;
          }
          /* Ensure avatars are NEVER affected by the shrinking logic */
          .history-view-container img[class*="avatar"],
          .history-view-container .avatar-container img,
          .history-view-container .mbti-avatar img {
            max-width: none !important;
            max-height: none !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        `}} />

        {loading && (
          <div className="flex flex-col items-center py-20 animate-pulse">
            <div className="w-12 h-12 bg-slate-200 rounded-full mb-4" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
        )}

        {error && (
          <div className="py-20 text-center">
            <div className="inline-block p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-bold mb-4">
              {error}
            </div>
            <button onClick={() => window.location.reload()} className="block mx-auto text-[var(--accent-main)] font-black uppercase tracking-widest text-xs hover:underline">
              Try Again
            </button>
          </div>
        )}

        {!loading && conversation && (
          <div className="flex items-center gap-2 mb-8 px-2 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-main)] shadow-[0_0_8px_var(--accent-main)]"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">已自动聚合该模式下的历史对话记录</span>
          </div>
        )}

        {/* Message Pairs */}
        <div className="space-y-6">
          {pairs.map((pair, pairIdx) => (
            <MessagePairItem
              key={pairIdx}
              pair={pair}
              viewMode={(conversation?.view_mode === 'game' ? 'game' : 'mbti')}
              isSelectionMode={isSelectionMode}
              isSelected={[pair.user?.id, pair.assistant?.id].filter(Boolean).every(id => selectedMessageIds.has(id as string))}
              fontSize={fontSize}
              onToggle={() => togglePairSelection(pair.user?.id, pair.assistant?.id)}
            />
          ))}

          {!loading && !error && messages.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">No messages in this conversation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Blog Generation Toolbar */}
      {!loading && !error && messages.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-40">
          <div className="max-w-3xl mx-auto flex flex-col gap-3 sm:gap-4">
            <AnimatePresence>
              {blogDraft && isBlogDraftVisible && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xl flex items-center justify-between bg-white overflow-hidden"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="p-2 sm:p-3 rounded-xl bg-orange-100 text-orange-500 flex-shrink-0">
                      <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest leading-none mb-1">Draft Ready</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{blogDraft.title}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('chat2blog_draft', JSON.stringify({ title: blogDraft.title, content: blogDraft.markdown }));
                      router.push('/publish');
                    }}
                    className="flex-shrink-0 px-3 sm:px-4 py-2 text-white text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95"
                  >
                    <Globe className="w-3.5 h-3.5" /> 立即发布
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
              <button
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold transition-all ${isSelectionMode ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-transparent'}`}
              >
                {isSelectionMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                <span className="text-xs sm:text-sm">{isSelectionMode ? '退出' : '选择'}</span>
              </button>

              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                <div className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-2 bg-slate-100 rounded-xl">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={blogStyle}
                    onChange={(e) => setBlogStyle(e.target.value as any)}
                    className="bg-transparent text-[11px] sm:text-xs font-black text-slate-600 outline-none border-none cursor-pointer appearance-none pr-3 uppercase tracking-tighter"
                  >
                    <option value="literary">文艺</option>
                    <option value="logical">逻辑</option>
                    <option value="record">记录</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={blogLoading}
                    onClick={async () => {
                      try {
                        setBlogLoading(true);
                        const targetMessages = (isSelectionMode && selectedMessageIds.size > 0)
                          ? messages.filter(m => selectedMessageIds.has(m.id))
                          : messages;
                        const { cleanedMessages, imageMap } = prepareMessagesForBlog(targetMessages);
                        const globalNick = localStorage.getItem('user_global_nickname');
                        const authorName = globalNick || nickname || '笔者';
                        const res = await fetch('/api/blog', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messages: cleanedMessages, style: blogStyle, authorName }),
                        });
                        if (!res.ok) throw new Error('Failed to generate');
                        const data = await res.json();
                        setBlogDraft({ title: data.title, markdown: restoreBlogImages(data.markdown, imageMap) });
                        setIsBlogDraftVisible(true);
                      } catch (e: any) { alert(e.message); }
                      finally { setBlogLoading(false); }
                    }}
                    className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs text-white transition-all shadow-lg ${blogLoading ? 'bg-slate-300' : 'bg-orange-500 shadow-orange-100 hover:bg-orange-600 active:scale-95'}`}
                  >
                    {blogLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : '生成博客'}
                  </button>

                  <button
                    disabled={isExportingImage}
                    onClick={handleDownloadImage}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-[11px] sm:text-xs text-white transition-all shadow-lg ${isExportingImage ? 'bg-slate-300' : 'bg-blue-500 shadow-blue-100 hover:bg-blue-600 active:scale-95'}`}
                  >
                    {isExportingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    <span>{isExportingImage ? '' : '生成图片'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Capture Area for Image Export - Persistent to ensure styles/images load correctly */}
      {isMounted && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
          <div ref={captureRef} className="p-10 w-[600px] flex flex-col gap-6 bg-white" style={{ backgroundColor: '#ffffff' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffffff', border: '1px solid #f1f5f9' }}>
                  <Sparkles className="w-6 h-6" style={{ color: '#F59E0B' }} />
                </div>
                <div>
                  <div className="text-sm font-black leading-tight" style={{ color: '#0f172a' }}>智聊室 · Chat Blog</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>Creative Co-Creation</div>
                </div>
              </div>
              <div className="text-[10px] font-mono" style={{ color: '#94a3b8' }}>
                {isMounted ? new Date().toLocaleDateString() : ''}
              </div>
            </div>
            <div className="space-y-8">
              {pairs.filter(p => {
                const userSelected = p.user && selectedMessageIds.has(p.user.id);
                const asstSelected = p.assistant && selectedMessageIds.has(p.assistant.id);
                return userSelected || asstSelected;
              }).map((p, idx) => {
                const mode = (conversation?.view_mode === 'game' ? 'game' : 'mbti') as any;
                const parsed = p.parsedAssistant;
                const hasRoles = parsed && parsed.roles.length > 0;

                return (
                  <div key={`export-${idx}`} className="space-y-6">
                    {p.user && selectedMessageIds.has(p.user.id) && (
                      <div className="flex gap-3 flex-row-reverse">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 mt-1 flex items-center justify-center text-[8px] font-black text-white bg-orange-500 border border-orange-600 shadow-sm uppercase">YOU</div>
                        <div className="p-4 rounded-2xl max-w-[85%] rounded-tr-sm bg-orange-500 text-white shadow-sm border border-orange-600">
                          <div className="text-sm leading-relaxed prose prose-invert">
                            <ReactMarkdown components={{ img: ({ src }) => src ? <img src={src} loading="eager" /> : null }}>
                              {p.userContent}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                    {p.assistant && selectedMessageIds.has(p.assistant.id) && (
                      <div className="space-y-4">
                        {hasRoles ? (
                          <div style={{ color: '#1e293b' }}>
                            <MbtiReply parsed={parsed!} messageId={`export-asst-${p.assistant.id}`} viewMode={mode} forceShowAll={true} audioRecords={p.assistant.audio_records} />
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full flex-shrink-0 mt-1 flex items-center justify-center bg-white border border-slate-200 text-orange-500 shadow-sm">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="p-4 rounded-2xl max-w-[85%] rounded-tl-sm bg-white text-slate-800 shadow-sm border border-slate-100">
                              <div className="text-sm leading-relaxed prose">
                                <ReactMarkdown components={{ img: ({ src }) => src ? <img src={src} loading="eager" /> : null }}>
                                  {p.assistantContent}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 pt-6 flex justify-between items-center border-t border-slate-100" style={{ borderColor: '#f1f5f9' }}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: '#f97316', color: '#ffffff' }}>B</div>
                <div className="text-[10px] font-bold" style={{ color: '#94a3b8' }}>Created via Chat2Blog</div>
              </div>
              <div className="text-[9px] font-medium" style={{ color: '#cbd5e1' }}>#{id?.slice(0, 8)}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
