"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Mic, Send, Menu, Sparkles, StopCircle, Copy, Trash2, Check, FileText, Download, Volume2, Loader2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ReactMarkdown from "react-markdown";
import { supabaseClient } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";

type ParsedMbtiReply = {
  intro: string;
  roles: { role: string; text: string }[];
};

type ViewMode = 'mbti' | 'game';
type InteractionMode = 'text' | 'voice';

const allMbtiRoles = ["ENTJ", "ISTJ", "ENFP", "INFP", "ENFJ"] as const;

const themes = {
  green: {
    bg: 'from-emerald-950 via-teal-950 to-slate-950',
    text: 'text-emerald-100',
    textSub: 'text-emerald-400',
    accentFrom: 'from-emerald-600',
    accentTo: 'to-teal-600',
    button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40',
    bubbleUser: 'bg-emerald-600 text-white',
    bubbleBot: 'bg-white/10 text-emerald-50 border border-emerald-500/20 shadow-none backdrop-blur-md',
    inputBg: 'bg-white/10 border border-emerald-500/20 text-emerald-100 placeholder-emerald-400/50 backdrop-blur-md',
    cardBg: 'bg-white/5 border border-emerald-500/10 text-emerald-100 shadow-none backdrop-blur-md',
  },
  lavender: {
    bg: 'from-violet-950 via-purple-950 to-slate-950',
    text: 'text-violet-100',
    textSub: 'text-violet-400',
    accentFrom: 'from-violet-600',
    accentTo: 'to-purple-600',
    button: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40',
    bubbleUser: 'bg-violet-600 text-white',
    bubbleBot: 'bg-white/10 text-violet-50 border border-violet-500/20 shadow-none backdrop-blur-md',
    inputBg: 'bg-white/10 border border-violet-500/20 text-violet-100 placeholder-violet-400/50 backdrop-blur-md',
    cardBg: 'bg-white/5 border border-violet-500/10 text-violet-100 shadow-none backdrop-blur-md',
  },
  pink: {
    bg: 'from-rose-950 via-pink-950 to-slate-950',
    text: 'text-rose-100',
    textSub: 'text-rose-400',
    accentFrom: 'from-rose-600',
    accentTo: 'to-pink-600',
    button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40',
    bubbleUser: 'bg-rose-600 text-white',
    bubbleBot: 'bg-white/10 text-rose-50 border border-rose-500/20 shadow-none backdrop-blur-md',
    inputBg: 'bg-white/10 border border-rose-500/20 text-rose-100 placeholder-rose-400/50 backdrop-blur-md',
    cardBg: 'bg-white/5 border border-rose-500/10 text-rose-100 shadow-none backdrop-blur-md',
  },
  butter: {
    bg: 'from-amber-950 via-orange-950 to-slate-950',
    text: 'text-amber-100',
    textSub: 'text-amber-400',
    accentFrom: 'from-amber-600',
    accentTo: 'to-orange-600',
    button: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40',
    bubbleUser: 'bg-amber-600 text-white',
    bubbleBot: 'bg-white/10 text-amber-50 border border-amber-500/20 shadow-none backdrop-blur-md',
    inputBg: 'bg-white/10 border border-amber-500/20 text-amber-100 placeholder-amber-400/50 backdrop-blur-md',
    cardBg: 'bg-white/5 border border-amber-500/10 text-amber-100 shadow-none backdrop-blur-md',
  },
} as const;

const getRoleEmoji = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    // 游戏小队视角：将 MBTI 槽位映射为《恋与深空》五位男主
    switch (role) {
      case 'ENTJ':
        return '\ud83d\udd25'; // 祁煜：火系、行动力强
      case 'ISTJ':
        return '\ud83e\ude7a'; // 黎深：医生、温柔克制
      case 'ENFP':
        return '\u2600\ufe0f'; // 沈星回：明亮、阳光少年
      case 'INFP':
        return '\ud83c\udfa8'; // 夏以昼：艺术气息、温柔细腻
      case 'ENFJ':
        return '\ud83c\udf11'; // 秦彻：危险感与守护并存
      default:
        return '\ud83c\udfae';
    }
  }

  switch (role) {
    case 'ENTJ':
      return '🧠';
    case 'ISTJ':
      return '�';
    case 'ENFP':
      return '🌟';
    case 'INFP':
      return '🌿';
    case 'ENFJ':
      return '😊';
    default:
      return '💬';
  }
};

const getRoleLabel = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ':
        return '祁煜';
      case 'ISTJ':
        return '黎深';
      case 'ENFP':
        return '沈星回';
      case 'INFP':
        return '夏以昼';
      case 'ENFJ':
        return '秦彻';
      default:
        return '';
    }
  }
  return role;
};

const getRoleAvatarClass = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    // 游戏小队视角下，为五位男主配置偏角色感的颜色
    switch (role) {
      case 'ENTJ':
        return 'from-rose-500 to-orange-500'; // 祁煜：火系、冲劲
      case 'ISTJ':
        return 'from-sky-500 to-cyan-500'; // 黎深：冷静、治愈
      case 'ENFP':
        return 'from-yellow-300 to-amber-400'; // 沈星回：明亮阳光
      case 'INFP':
        return 'from-emerald-300 to-teal-400'; // 夏以昼：柔和治愈
      case 'ENFJ':
        return 'from-slate-700 to-violet-700'; // 秦彻：暗色危感
      default:
        return 'from-slate-500 to-slate-400';
    }
  }

  // MBTI 视角下的默认颜色
  switch (role) {
    case 'ENTJ':
      return 'from-emerald-400 to-emerald-600';
    case 'ISTJ':
      return 'from-sky-400 to-cyan-500';
    case 'ENFP':
      return 'from-orange-300 to-amber-400';
    case 'INFP':
      return 'from-teal-300 to-emerald-400';
    case 'ENFJ':
      return 'from-rose-300 to-pink-400';
    default:
      return 'from-emerald-400 to-lime-500';
  }
};

const getRoleStatusText = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ':
        return '祁煜一边检查装备一边抬眼打量战场，话不多，却已经在心里替你把所有退路都想好。';
      case 'ISTJ':
        return '黎深安静地站在你身侧，目光细致地扫过每一个细节，用平稳的语气把风险和解决办法一条条说给你听。';
      case 'ENFP':
        return '沈星回总能先发现好玩的角度，他一边和你聊天一边帮你拆解难题，让气氛一点点从紧绷变得明亮。';
      case 'INFP':
        return '夏以昼悄悄记下你说过的每一句话，用温柔的视角补全那些你没来得及说出口的情绪。';
      case 'ENFJ':
        return '秦彻像是在旁观一切，却始终把你放在视线中央，只在必要的时候出声，把你从危险的边缘拉回来。';
      default:
        return '他们各自在自己的位置行动着，不约而同地把你放进自己的计划里。';
    }
  }

  switch (role) {
    case 'ENTJ':
      return '正在快速扫一眼全局，还在想怎么帮你定方向。';
    case 'ISTJ':
      return '在一旁默默记笔记，等你说完再补充细节和 checklist。';
    case 'ENFP':
      return '脑子里已经开了十个脑洞，只是在挑哪一个最好玩。';
    case 'INFP':
      return '认真听着你的情绪变化，在琢磨这件事对你意味着什么。';
    case 'ENFJ':
      return '在整理大家刚才的点子，准备帮你收个小结。';
    default:
      return '在旁边听着，还没决定要不要插话。';
  }
};

function MbtiReply({ parsed, messageId, theme, viewMode, selectedGameRoles }: { parsed: ParsedMbtiReply; messageId: string; theme: keyof typeof themes; viewMode: ViewMode; selectedGameRoles?: string[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  // 当消息 ID 变化时，初始化可见计数（避免每次流式内容变化都重置）
  useEffect(() => {
    setVisibleCount(0);
  }, [messageId]);

  // 在角色数量增长时，逐步增加可见计数；不因 parsed 对象变化而重置
  useEffect(() => {
    if (parsed.roles.length === 0) return;
    if (visibleCount >= parsed.roles.length) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => {
        if (prev >= parsed.roles.length) return prev;
        return prev + 1;
      });
    }, 700);

    return () => clearInterval(interval);
  }, [parsed.roles.length, visibleCount]);

  const visibleRoles = parsed.roles.slice(0, visibleCount || 1);
  const spokenRoles = new Set(parsed.roles.map((r) => r.role));
  const nameToSlot: Record<string, (typeof allMbtiRoles)[number]> = {
    '祁煜': 'ENTJ',
    '黎深': 'ISTJ',
    '沈星回': 'ENFP',
    '夏以昼': 'INFP',
    '秦彻': 'ENFJ',
  };
  const allowedSlots = viewMode === 'game'
    ? (Array.isArray(selectedGameRoles) && selectedGameRoles.length > 0
      ? selectedGameRoles.map((n) => nameToSlot[n]).filter(Boolean)
      : [])
    : allMbtiRoles;
  const silentRoles = allowedSlots.filter((r) => !spokenRoles.has(r));

  return (
    <div className={`space-y-3 ${themes[theme].text}`}>
      {parsed.intro && (
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-tr from-pink-300 to-rose-400 shadow-lg shadow-rose-400/20">
            <span className="text-base">✨</span>
          </div>
          <div className={`p-3.5 rounded-3xl max-w-[85%] backdrop-blur-md rounded-tl-none ${themes[theme].cardBg}`}>
            <div className="text-sm prose max-w-none">
              <ReactMarkdown>{parsed.intro}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {visibleRoles.map((block) => (
        <div key={`${messageId}-${block.role}`} className="flex gap-3">
          <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-tr ${getRoleAvatarClass(block.role, viewMode)} shadow-lg shadow-emerald-300/15`}>
            {viewMode === 'game' ? (
              <span className="text-[10px] font-semibold leading-none tracking-tight">
                {getRoleLabel(block.role, viewMode)}
              </span>
            ) : (
              <span className="text-[22px] leading-none">{getRoleEmoji(block.role, viewMode)}</span>
            )}
          </div>
          <div className={`p-3.5 rounded-3xl max-w-[85%] backdrop-blur-md rounded-tl-none ${themes[theme].cardBg}`}>
            <div className="text-sm prose max-w-none">
              {getRoleLabel(block.role, viewMode) && (
                <div className={`${viewMode === 'game' ? 'text-[11px] font-semibold opacity-80' : 'text-[16px] font-extrabold'} mb-1`}>
                  {getRoleLabel(block.role, viewMode)}
                </div>
              )}
              <ReactMarkdown>{block.text}</ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      {silentRoles.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1.5 pl-12">
          {silentRoles.map((role) => (
            <div
              key={`${messageId}-${role}-status`}
              className={`flex items-center gap-2 text-xs ${themes[theme].textSub}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center bg-gradient-to-tr ${getRoleAvatarClass(role, viewMode)} opacity-50`}
              >
                {viewMode !== 'game' && (
                  <span className="text-[14px] leading-none">{getRoleEmoji(role, viewMode)}</span>
                )}
              </div>
              <span>
                {getRoleLabel(role, viewMode) && (
                  <span className="font-medium">{getRoleLabel(role, viewMode)}：</span>
                )}
                {getRoleStatusText(role, viewMode)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatApp() {
  const router = useRouter();
  const pathname = usePathname();
  const isRootPath = pathname === '/';
  const [viewMode, setViewMode] = useState<ViewMode>('mbti');
  const fixedMode: ViewMode | null = pathname?.startsWith('/lysk')
    ? 'game'
    : pathname?.startsWith('/mbti')
      ? 'mbti'
      : null;
  useEffect(() => {
    if (fixedMode && viewMode !== fixedMode) {
      setViewMode(fixedMode);
      setTtsVoice(fixedMode === 'game' ? 'male' : 'female');
    }
  }, [fixedMode]);
  // Game mode: selectable chat members (default all 5)
  const allGameRoles = ['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'] as const;
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...allGameRoles]);
  const [messageSelectedRoles, setMessageSelectedRoles] = useState<Record<string, string[]>>({});
  const selectedRolesQueueRef = useRef<string[][]>([]);
  const userProfileStorageKey = 'chat_user_profile_v2';
  const legacyUserProfileStorageKey = 'chat_user_profile_v1';
  type UserPersona = {
    name: string;
    mbti: string;
    likes: string;
    schedule: string;
    work: string;
    redlines: string;
    extras: string;
  };
  const emptyPersona: UserPersona = { name: '', mbti: '', likes: '', schedule: '', work: '', redlines: '', extras: '' };
  const [userPersona, setUserPersona] = useState<UserPersona>(emptyPersona);
  const formatPersonaToPrompt = (p: UserPersona) => {
    const lines: string[] = [];
    if (p.name?.trim()) lines.push(`人设名：${p.name.trim()}`);
    if (p.mbti?.trim()) lines.push(`MBTI：${p.mbti.trim()}`);
    if (p.likes?.trim()) lines.push(`喜欢/偏好：${p.likes.trim()}`);
    if (p.schedule?.trim()) lines.push(`作息：${p.schedule.trim()}`);
    if (p.work?.trim()) lines.push(`工作/学习：${p.work.trim()}`);
    if (p.redlines?.trim()) lines.push(`雷点/禁忌：${p.redlines.trim()}`);
    if (p.extras?.trim()) lines.push(`补充：${p.extras.trim()}`);
    return lines.join('\n');
  };
  const userProfile = formatPersonaToPrompt(userPersona);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(userProfileStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<UserPersona>;
        setUserPersona({ ...emptyPersona, ...parsed });
        return;
      }
      const legacy = window.localStorage.getItem(legacyUserProfileStorageKey);
      if (legacy && legacy.trim()) {
        setUserPersona({ ...emptyPersona, extras: legacy.trim() });
        window.localStorage.setItem(userProfileStorageKey, JSON.stringify({ ...emptyPersona, extras: legacy.trim() }));
      }
    } catch { }
  }, []);
  const persistUserPersona = (next: UserPersona) => {
    try {
      window.localStorage.setItem(userProfileStorageKey, JSON.stringify(next));
    } catch { }
  };
  const gameRequestHeaders = {
    'x-view-mode': 'game',
    'x-selected-roles': selectedRoles.join(','),
    'x-user-profile': encodeURIComponent(userProfile || ''),
  } as const;
  const mbtiRequestHeaders = {
    'x-view-mode': 'mbti',
    'x-user-profile': encodeURIComponent(userProfile || ''),
  } as const;
  const gameApi = `/api/chat?viewMode=game&selectedRoles=${encodeURIComponent(selectedRoles.join(','))}&userProfile=${encodeURIComponent(userProfile || '')}`;
  const mbtiApi = `/api/chat?viewMode=mbti&userProfile=${encodeURIComponent(userProfile || '')}`;
  const chatMbti = useChat({
    id: 'mbti-session',
    api: mbtiApi,
    headers: mbtiRequestHeaders,
    onError: (err: unknown) => console.error("Chat error:", err),
  } as any);
  const chatGame = useChat({
    id: 'game-session',
    api: gameApi,
    headers: gameRequestHeaders,
    onError: (err: unknown) => console.error("Chat error:", err),
  } as any);
  const messages = viewMode === 'mbti' ? chatMbti.messages : chatGame.messages;
  const status = viewMode === 'mbti' ? chatMbti.status : chatGame.status;
  const setMessagesActive = viewMode === 'mbti' ? chatMbti.setMessages : chatGame.setMessages;
  const sendMessageActive = viewMode === 'mbti' ? chatMbti.sendMessage : chatGame.sendMessage;

  const [isRecording, setIsRecording] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [copied, setCopied] = useState(false);
  const [blogDraft, setBlogDraft] = useState<{ title: string; markdown: string } | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const recognitionActiveRef = useRef<boolean>(false);
  const inputRef = useRef(inputValue);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);
  const [theme, setTheme] = useState<keyof typeof themes>('green');
  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsVoice, setTtsVoice] = useState<'female' | 'male' | 'shenxinghui' | 'qinche' | 'qiyu' | 'lishen' | 'xiayizhou'>(viewMode === 'game' ? 'male' : 'female');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('text');
  // Conversation storage
  const [conversationId, setConversationId] = useState<string | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const lastStoredMessageIdRef = useRef<string | null>(null);
  const lastAssistantDbIdRef = useRef<string | null>(null);

  // 流式 TTS 队列
  const audioQueueRef = useRef<{ url: string; text: string }[]>([]);
  const isPlayingQueueRef = useRef(false);
  const currentStreamingMessageRef = useRef<string | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const processedSentencesRef = useRef<Set<string>>(new Set());
  const ttsProcessedRef = useRef(false);

  // Auth state for header
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const displayName = userEmail ? (userEmail.split('@')[0] || '已登录') : null;
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!supabaseClient) return;
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (mounted) setUserEmail(user?.email ?? null);
      } catch { }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSignOut = async () => {
    try {
      if (!supabaseClient) return;
      await supabaseClient.auth.signOut();
      setUserEmail(null);
      window.location.href = '/login';
    } catch { }
  };

  const isLoading = status === 'submitted' || status === 'streaming';
  const hasMessages = messages.length > 0;

  // Keep inputRef synced with inputValue
  useEffect(() => {
    inputRef.current = inputValue;
  }, [inputValue]);

  const PERSONA_BLOCK_START = '[[[USER_PERSONA';
  const PERSONA_BLOCK_REGEX = /\[\[\[USER_PERSONA\]\]\][\s\S]*?\[\[\[\/USER_PERSONA\]\]\]/g;
  const stripPersonaBlock = (text: string) => (text || '').replace(PERSONA_BLOCK_REGEX, '').trim();
  const withPersonaBlock = (text: string) => {
    const plain = stripPersonaBlock(text || '');
    const profile = (userProfile || '').trim();
    if (!profile) return plain;
    // Append a hidden block that backend will parse and strip before sending to the model
    return `${plain}\n\n[[[USER_PERSONA]]]\n${profile}\n[[[/USER_PERSONA]]]`;
  };

  const ROLES_BLOCK_REGEX = /\[\[\[SELECTED_ROLES\]\]\][\s\S]*?\[\[\[\/SELECTED_ROLES\]\]\]/g;
  const stripRolesBlock = (text: string) => (text || '').replace(ROLES_BLOCK_REGEX, '').trim();
  const withRolesBlock = (text: string) => {
    const plain = stripRolesBlock(text || '');
    if (viewMode !== 'game') return plain;
    const roles = Array.isArray(selectedRoles) ? selectedRoles.filter(Boolean) : [];
    if (roles.length === 0) return plain;
    return `${plain}\n\n[[[SELECTED_ROLES]]]\n${roles.join(',')}\n[[[/SELECTED_ROLES]]]`;
  };

  const withMetaBlocks = (text: string) => withRolesBlock(withPersonaBlock(text));

  const filterGameReplyByAllowedRoles = (text: string, allowedRoles?: string[]) => {
    const allowed = Array.isArray(allowedRoles) ? allowedRoles.filter(Boolean) : [];
    if (viewMode !== 'game') return text;
    if (allowed.length === 0) return '';
    const allowedSet = new Set(allowed);
    const lines = (text || '').split(/\r?\n/);
    const out: string[] = [];
    for (const line of lines) {
      const m = line.match(/^\s*(沈星回|黎深|祁煜|夏以昼|秦彻)：/);
      if (!m) {
        // Keep non-speaker lines only if they follow an allowed speaker block already
        if (out.length > 0) out.push(line);
        continue;
      }
      const speaker = m[1];
      if (allowedSet.has(speaker)) out.push(line);
    }
    return out.join('\n').trim();
  };

  // Bind the roles selected at send-time to the next assistant message(s), so later selection changes
  // won't retroactively hide/reshape historical replies.
  useEffect(() => {
    if (viewMode !== 'game') return;
    if (!messages || messages.length === 0) return;

    // Assign snapshots to any assistant message that doesn't have one yet.
    const newMappings: Record<string, string[]> = {};
    for (const m of messages) {
      if (m?.role !== 'assistant') continue;
      const id = String(m.id ?? '');
      if (!id) continue;
      if (messageSelectedRoles[id]) continue;
      const next = selectedRolesQueueRef.current.length > 0
        ? selectedRolesQueueRef.current.shift()!
        : (Array.isArray(selectedRoles) ? [...selectedRoles] : []);
      newMappings[id] = next;
    }

    if (Object.keys(newMappings).length > 0) {
      setMessageSelectedRoles((prev) => ({ ...prev, ...newMappings }));
    }
    // Intentionally omit messageSelectedRoles to avoid reassigning on every state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, viewMode]);

  // Helper to extract text content from message
  const getMessageContent = (message: any) => {
    let text = '';
    if (typeof message.content === 'string') text = message.content;
    else if (Array.isArray(message.content)) {
      text = message.content.map((p: any) => p.text || '').join('');
    } else if (message.parts && Array.isArray(message.parts)) {
      // Fallback for messages with parts but no content (e.g. from sendMessage with parts)
      text = message.parts.map((p: any) => p.text || '').join('');
    }
    const cleaned = stripRolesBlock(stripPersonaBlock(text));
    // Only enforce selectedRoles filtering on assistant replies.
    // User messages should always display (just strip hidden meta blocks).
    if (message?.role === 'assistant') {
      const id = String(message.id ?? '');
      const snapshot = id ? messageSelectedRoles[id] : undefined;
      return filterGameReplyByAllowedRoles(cleaned, snapshot || selectedRoles);
    }
    return cleaned;
  };

  const parseMbtiGroupReply = (content: string) => {
    const lines = content.split('\n');
    const roles = ["ENTJ", "ISTJ", "ENFP", "INFP", "ENFJ"] as const;
    type Role = (typeof roles)[number];

    let introLines: string[] = [];
    let currentRole: Role | null = null;
    let buffer: string[] = [];
    const roleBlocks: { role: Role; text: string }[] = [];

    // 允许前面有 Markdown 标记或列表前缀，识别 MBTI 或 男主中文名
    // 中文名与 MBTI 槽位映射：ENTJ->祁煜, ISTJ->黎深, ENFP->沈星回, INFP->夏以昼, ENFJ->秦彻
    const nameToSlot: Record<string, Role> = {
      '祁煜': 'ENTJ',
      '黎深': 'ISTJ',
      '沈星回': 'ENFP',
      '夏以昼': 'INFP',
      '秦彻': 'ENFJ',
    };
    const roleRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(ENTJ|ISTJ|ENFP|INFP|ENFJ|祁煜|黎深|沈星回|夏以昼|秦彻)[：:]/;

    for (const line of lines) {
      const match = line.match(roleRegex);
      if (match) {
        if (currentRole) {
          roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
        } else if (buffer.length > 0) {
          introLines = buffer.slice();
        }
        const tag = match[1];
        const mapped = (nameToSlot as any)[tag] || tag;
        currentRole = mapped as Role;
        buffer = [line.replace(roleRegex, '').trim()];
      } else {
        buffer.push(line);
      }
    }

    if (currentRole) {
      roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
    } else if (buffer.length > 0 && introLines.length === 0) {
      introLines = buffer.slice();
    }

    return {
      intro: introLines.join('\n').trim(),
      roles: roleBlocks,
    };
  };

  const handleCopy = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const content = getMessageContent(lastMessage);
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 流式 TTS：监听消息流式生成，实时拆分句子并生成音频
  useEffect(() => {
    if (interactionMode !== 'voice') return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    const content = getMessageContent(lastMessage);
    if (!content?.trim()) return;

    // 如果是新消息，重置累积文本
    if (lastMessage.id !== currentStreamingMessageRef.current) {
      currentStreamingMessageRef.current = lastMessage.id;
      accumulatedTextRef.current = '';
      audioQueueRef.current = [];
      processedSentencesRef.current.clear();
      ttsProcessedRef.current = false;
    }

    // 更新累积文本
    accumulatedTextRef.current = content;

    // 文字生成完毕时触发 TTS 处理（只处理一次）
    if (!isLoading && content && !ttsProcessedRef.current) {
      ttsProcessedRef.current = true;
      handleStreamingText(lastMessage.id, '', true);
    }
  }, [messages, isLoading, interactionMode]);

  // Save assistant messages to database (independent of voice mode)
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'assistant') return;
      if (lastMessage.id === lastStoredMessageIdRef.current) return;
      const content = getMessageContent(lastMessage);
      if (!content?.trim()) return;
      lastStoredMessageIdRef.current = lastMessage.id;
      // Save assistant message and store its DB id for audio linking
      saveMessage('assistant', content).then((id) => {
        if (id) lastAssistantDbIdRef.current = id;
      });
    }
  }, [messages, isLoading]);

  // Ensure a conversation exists for current user and view mode
  const ensureConversation = async () => {
    if (conversationId) return conversationId;
    if (!supabaseClient) return null;
    const client = supabaseClient;
    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;
    // Try find latest conversation for this viewMode created today
    const { data: found } = await client
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('view_mode', viewMode)
      .order('created_at', { ascending: false })
      .limit(1);
    if (found && found.length > 0) {
      setConversationId(found[0].id);
      return found[0].id as string;
    }
    // Create new conversation
    const title = viewMode === 'game' ? '恋与深空会话' : 'MBTI 团队会话';
    const { data: created, error } = await client
      .from('conversations')
      .insert({ user_id: user.id, title, view_mode: viewMode })
      .select('id')
      .single();
    if (error) return null;
    setConversationId(created.id);
    return created.id as string;
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string): Promise<string | null> => {
    try {
      const convId = await ensureConversation();
      if (!convId || !supabaseClient) return null;
      const client = supabaseClient;
      const { data, error } = await client
        .from('messages')
        .insert({ conversation_id: convId, role, content })
        .select('id')
        .single();
      if (error) throw error;
      return data?.id ?? null;
    } catch (e) {
      console.warn('saveMessage skipped:', (e as any)?.message);
      return null;
    }
  };

  const clearChat = () => {
    setMessagesActive([]);
    setMessageSelectedRoles({});
    selectedRolesQueueRef.current = [];
    window.speechSynthesis?.cancel?.();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    // 清空流式 TTS 队列
    audioQueueRef.current = [];
    isPlayingQueueRef.current = false;
    currentStreamingMessageRef.current = null;
    accumulatedTextRef.current = '';
    processedSentencesRef.current.clear();
    ttsProcessedRef.current = false;
  };

  // 流式文本处理：简化版，只在文字生成完毕后一次性处理
  const handleStreamingText = async (messageId: string, newText: string, isFinal: boolean) => {
    // 只在最终完成时处理，避免流式拆分的复杂性
    if (!isFinal) return;

    const buffer = accumulatedTextRef.current;
    if (!buffer.trim()) return;

    // 按段落拆分（双换行或角色前缀）
    const paragraphs: string[] = [];
    const lines = buffer.split('\n');
    let currentPara = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentPara) {
          paragraphs.push(currentPara.trim());
          currentPara = '';
        }
        continue;
      }

      // 检测角色前缀作为段落分隔
      const roleMatch = trimmed.match(/^(ENFP|ENFJ|ENTJ|ISTJ|INFP|沈星回|秦彻|祁煜|黎深|夏以昼)[：:]/);
      if (roleMatch && currentPara) {
        paragraphs.push(currentPara.trim());
        currentPara = trimmed;
      } else {
        currentPara += (currentPara ? ' ' : '') + trimmed;
      }
    }

    if (currentPara) {
      paragraphs.push(currentPara.trim());
    }

    // 为每个段落生成 TTS（顺序执行，避免乱序）
    for (const para of paragraphs) {
      if (!para || para.length < 3) continue;
      if (para.match(/^[-*#]+$/) || para === '---') continue; // 跳过分隔符

      if (!processedSentencesRef.current.has(para)) {
        processedSentencesRef.current.add(para);
        await generateTTSForSentence(messageId, para);
      }
    }

    // 启动队列播放器
    if (!isPlayingQueueRef.current) {
      playAudioQueue();
    }
  };

  // 为单个句子生成 TTS（异步并行）
  const generateTTSForSentence = async (messageId: string, sentence: string) => {
    if (!sentence.trim()) return;

    try {
      let voice = ttsVoice;
      let textToSpeak = sentence;

      // 游戏模式：检测角色前缀并切换声音，去掉前缀
      if (viewMode === 'game') {
        const speakerMatch = sentence.match(/^(沈星回|秦彻|祁煜|黎深|夏以昼)[：:]/);
        if (speakerMatch) {
          const speakerVoiceMap: Record<string, 'shenxinghui' | 'qinche' | 'qiyu' | 'lishen' | 'xiayizhou'> = {
            '沈星回': 'shenxinghui',
            '秦彻': 'qinche',
            '祁煜': 'qiyu',
            '黎深': 'lishen',
            '夏以昼': 'xiayizhou',
          };
          voice = speakerVoiceMap[speakerMatch[1]] || 'shenxinghui';
          // 去掉角色前缀，只播报内容
          textToSpeak = sentence.replace(/^(沈星回|秦彻|祁煜|黎深|夏以昼)[：:]/, '');
        }
      }
      // MBTI 模式：保留角色前缀，统一用一个声音

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成语音失败');

      const audioUrl = data.audioUrl as string;

      // 保存音频记录
      try {
        if (lastAssistantDbIdRef.current && audioUrl && supabaseClient) {
          await supabaseClient.from('audio_records').insert({
            message_id: lastAssistantDbIdRef.current,
            type: 'tts',
            url: audioUrl,
          });
        }
      } catch (e) {
        console.warn('save audio url failed:', (e as any)?.message);
      }

      // 加入播放队列
      audioQueueRef.current.push({ url: audioUrl, text: sentence });

      // 如果播放器空闲，立即启动
      if (!isPlayingQueueRef.current) {
        playAudioQueue();
      }
    } catch (err: any) {
      console.error('TTS generation failed for sentence:', sentence, err);
      setTtsError(err?.message || '生成语音失败');
    }
  };

  // 队列播放器：按顺序播放音频
  const playAudioQueue = async () => {
    if (isPlayingQueueRef.current) return;
    isPlayingQueueRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const item = audioQueueRef.current.shift();
      if (!item) break;

      try {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }

        audioRef.current.src = item.url;

        // 等待播放完成
        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) return resolve();

          audioRef.current.onended = () => resolve();
          audioRef.current.onerror = () => reject(new Error('播放失败'));

          audioRef.current.play().catch((err) => {
            console.warn('Audio play failed:', err);
            resolve(); // 失败也继续下一个
          });
        });

        // 句子间短暂停顿（300ms）
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error('Audio playback error:', err);
      }
    }

    isPlayingQueueRef.current = false;
  };

  const handlePlayVoice = async (messageId: string, text: string) => {
    if (!text?.trim()) return;
    if (interactionMode !== 'voice') return;

    // 在游戏模式下，优先按角色前缀拆分多段语音，并为每段选择对应男主的声音
    if (viewMode === 'game') {
      // 1. 先把可能残留的 MBTI 段首前缀替换为男主姓名
      let normalized = text;
      const mbtiToName: Array<[RegExp, string]> = [
        [/^\s*ENTJ[：:]/gm, '祁煜：'],
        [/^\s*ISTJ[：:]/gm, '黎深：'],
        [/^\s*ENFP[：:]/gm, '沈星回：'],
        [/^\s*INFP[：:]/gm, '夏以昼：'],
        [/^\s*ENFJ[：:]/gm, '秦彻：'],
      ];
      for (const [re, rep] of mbtiToName) normalized = normalized.replace(re, rep);

      // 2. 按角色名前缀拆分段落
      const segmentRegex = /^(沈星回|黎深|祁煜|夏以昼|秦彻)：([\s\S]*?)(?=^(?:沈星回|黎深|祁煜|夏以昼|秦彻)：|$)/gm;
      const segments: { speaker: string; voice: 'shenxinghui' | 'qinche' | 'qiyu' | 'lishen' | 'xiayizhou'; text: string }[] = [];

      const speakerVoiceMap: Record<string, 'shenxinghui' | 'qinche' | 'qiyu' | 'lishen' | 'xiayizhou'> = {
        '沈星回': 'shenxinghui',
        '秦彻': 'qinche',
        '祁煜': 'qiyu',
        '黎深': 'lishen',
        '夏以昼': 'xiayizhou',
      };

      let match: RegExpExecArray | null;
      while ((match = segmentRegex.exec(normalized)) !== null) {
        const speaker = match[1];
        const content = match[2]?.trim();
        const voice = speakerVoiceMap[speaker];
        if (content && voice) {
          segments.push({ speaker, voice, text: `${speaker}：${content}` });
        }
      }

      // 如果没有按前缀拆出段落，就退化为整段使用默认男声
      if (segments.length === 0) {
        segments.push({ speaker: '群聊', voice: 'shenxinghui', text: normalized });
      }

      setTtsError(null);
      setTtsLoadingId(messageId);

      try {
        // 顺序播放每一段语音
        for (const seg of segments) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: seg.text, voice: seg.voice }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '生成语音失败');
          const src = data.audioUrl as string;
          // save audio record (tts) if we have assistant db id
          try {
            if (lastAssistantDbIdRef.current && src && supabaseClient) {
              await supabaseClient.from('audio_records').insert({
                message_id: lastAssistantDbIdRef.current,
                type: 'tts',
                url: src,
              });
            }
          } catch (e) {
            console.warn('save audio url failed:', (e as any)?.message);
          }
          if (!audioRef.current) {
            audioRef.current = new Audio();
          } else {
            audioRef.current.pause();
          }
          audioRef.current.src = src;
          // 等待当前语音播放完再播下一段
          await new Promise<void>((resolve) => {
            if (!audioRef.current) return resolve();
            audioRef.current.onended = () => resolve();
            audioRef.current.play().catch(() => resolve());
          });
        }
        lastSpokenMessageIdRef.current = messageId;
      } catch (err: any) {
        console.error('Gemini TTS failed', err);
        setTtsError(err?.message || '生成语音失败，请稍后再试');
      } finally {
        setTtsLoadingId(null);
      }

      return;
    }

    // MBTI 模式：保持原有整段播报逻辑
    let textToSpeak = text;
    setTtsError(null);
    setTtsLoadingId(messageId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, voice: ttsVoice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '生成语音失败');
      const src = data.audioUrl as string;
      // save audio record (tts)
      try {
        if (lastAssistantDbIdRef.current && src && supabaseClient) {
          await supabaseClient.from('audio_records').insert({
            message_id: lastAssistantDbIdRef.current,
            type: 'tts',
            url: src,
          });
        }
      } catch (e) {
        console.warn('save audio url failed:', (e as any)?.message);
      }
      if (!audioRef.current) {
        audioRef.current = new Audio();
      } else {
        audioRef.current.pause();
      }
      audioRef.current.src = src;
      await audioRef.current.play();
      lastSpokenMessageIdRef.current = messageId;
    } catch (err: any) {
      console.error('Gemini TTS failed', err);
      setTtsError(err?.message || '生成语音失败，请稍后再试');
    } finally {
      setTtsLoadingId(null);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue(""); // Clear input immediately

    try {
      if (viewMode === 'game') {
        selectedRolesQueueRef.current.push(Array.isArray(selectedRoles) ? [...selectedRoles] : []);
      }
      const contentForModel = withMetaBlocks(content);
      await sendMessageActive({ role: 'user', content: contentForModel } as any);
      // store user message
      await saveMessage('user', stripRolesBlock(stripPersonaBlock(content)));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const setupRecognition = () => {
    try {
      if (typeof window === 'undefined') return;
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSttError('语音识别不可用：请使用 Chrome（桌面版），或确认浏览器支持 Web Speech API。');
        return;
      }
      if (!isSecure) {
        setSttError('语音识别需要在 https 或 localhost 环境下运行，请切换到安全环境再试。');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        recognitionActiveRef.current = true;
      };
      recognition.onend = () => {
        recognitionActiveRef.current = false;
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const newValue = inputRef.current + finalTranscript;
          setInputValue(newValue);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (inputRef.current.trim()) {
              stopRecording();
              const content = inputRef.current;
              setInputValue('');
              if (viewMode === 'game') {
                selectedRolesQueueRef.current.push(Array.isArray(selectedRoles) ? [...selectedRoles] : []);
              }
              const contentForModel = withMetaBlocks(content);
              sendMessageActive({ role: 'user', content: contentForModel } as any).catch(err => console.error('Auto-send failed:', err));
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setSttError(`语音识别错误：${event.error}`);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsRecording(false);
        try {
          if (recognitionActiveRef.current) recognition.stop();
        } catch { }
      };

      recognitionRef.current = recognition;
      setSttError(null);
    } catch (e: any) {
      console.error('setupRecognition failed', e);
      setSttError(`语音识别初始化失败：${e?.message || e}`);
    }
  };

  useEffect(() => {
    if (interactionMode === 'voice') {
      setupRecognition();
    } else {
      stopRecording();
      setSttError(null);
    }
  }, [viewMode, interactionMode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);
      if (!recognitionActiveRef.current) {
        try { recognitionRef.current?.start(); } catch (e) {
          // Ignore InvalidStateError when already started
          console.warn('recognition.start skipped:', e);
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
    try {
      if (recognitionActiveRef.current) recognitionRef.current?.stop();
    } catch { }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className={`relative flex flex-col h-[100dvh] overflow-hidden ${themes[theme].text}`}>
      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${themes[theme].bg}`} />
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/60 backdrop-blur-xl z-10 shadow-sm rounded-b-3xl">
        {/* Left: brand */}
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" showText={true} />
          {/* Mobile: current section badge */}
          <span className="sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 text-emerald-800 border border-white/60">
            {pathname?.startsWith('/lysk') ? '恋与深空' : 'MBTI'}
          </span>
        </div>

        {/* Center: primary nav (desktop only) */}
        <nav className="hidden sm:flex items-center gap-1 bg-white/70 rounded-full p-1 shadow-inner text-sm">
          <a
            href="/mbti"
            className={`px-4 py-1.5 rounded-full transition ${pathname?.startsWith('/mbti')
              ? 'bg-emerald-500 text-white shadow'
              : 'text-emerald-700 hover:bg-emerald-100'
              }`}
          >
            MBTI
          </a>
          <a
            href="/lysk"
            className={`px-4 py-1.5 rounded-full transition ${pathname?.startsWith('/lysk')
              ? 'bg-purple-500 text-white shadow'
              : 'text-purple-700 hover:bg-purple-100'
              }`}
          >
            恋与深空
          </a>
          <a
            href="/blog"
            className={`px-4 py-1.5 rounded-full transition ${pathname?.startsWith('/blog')
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-700 hover:bg-slate-100'
              }`}
          >
            我的博客
          </a>
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Desktop quick actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => hasMessages && handleCopy()}
              className={`p-2 rounded-full transition-colors ${hasMessages ? 'hover:bg-white/20 text-gray-600 hover:text-gray-900' : 'text-gray-400 cursor-not-allowed'}`}
              title="Copy last response"
              disabled={!hasMessages}
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={async () => {
                if (!hasMessages) return;
                try {
                  setBlogLoading(true);
                  const res = await fetch('/api/blog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to generate blog');
                  setBlogDraft({ title: data.title, markdown: data.markdown });
                  localStorage.setItem('chat2blog_draft', JSON.stringify({ title: data.title, content: data.markdown }));
                } catch (e) {
                  console.error('Blog generation failed', e);
                  alert('生成博客失败，请重试');
                } finally {
                  setBlogLoading(false);
                }
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors shadow ${hasMessages
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-gray-300 text-white cursor-not-allowed'
                } disabled:opacity-70`}
              title="生成博客"
              disabled={!hasMessages || blogLoading}
            >
              {blogLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>生成博客</span>
            </button>
            <button
              onClick={() => hasMessages && clearChat()}
              className={`p-2 rounded-full transition-colors ${hasMessages ? 'hover:bg-white/20 text-gray-600 hover:text-red-500' : 'text-gray-400 cursor-not-allowed'}`}
              title="Clear chat"
              disabled={!hasMessages}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          {/* Interaction mode toggle (visible) */}
          <button
            onClick={() => setInteractionMode(interactionMode === 'voice' ? 'text' : 'voice')}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-[#e5e5e5]"
            title={interactionMode === 'voice' ? '切换为文字模式' : '切换为语音模式'}
          >
            {interactionMode === 'voice' ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{interactionMode === 'voice' ? '语音' : '文字'}</span>
          </button>

          {/* Login / User avatar */}
          {userEmail ? (
            <details className="relative">
              <summary className="list-none inline-flex items-center justify-center h-9 px-3 rounded-full bg-emerald-600 text-white text-sm font-medium shadow cursor-pointer border border-emerald-500/20">
                {displayName || '已登录'}
              </summary>
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1a1a1a]/95 shadow-xl border border-white/10 p-2 space-y-1 backdrop-blur-md">
                <div className="px-3 py-1.5 text-[11px] text-[#a3a3a3] truncate">已登录：{userEmail}</div>
                <a href="/history" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-white/5">我的聊天</a>
                <button onClick={handleSignOut} className="w-full text-left block px-3 py-2 rounded-lg text-sm hover:bg-red-500/10 text-red-400">退出登录</button>
              </div>
            </details>
          ) : (
            <>
              <a
                href="/login"
                className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-[#e5e5e5] border border-white/10 shadow-sm"
              >
                登录 / 注册
              </a>
              <a
                href="/login"
                className="sm:hidden inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-white/10 text-[#e5e5e5] border border-white/10 shadow-sm"
              >
                登录
              </a>
            </>
          )}
          {/* History */}
          <a
            href="/history"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 text-[#e5e5e5] border border-white/10 shadow-sm"
            title="我的聊天"
          >
            我的聊天
          </a>
          {/* Consolidated menu (all sizes) */}
          <details className="relative z-50">
            <summary className="list-none inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 shadow cursor-pointer hover:bg-white/10">
              <Menu className="w-5 h-5 text-[#e5e5e5]" />
            </summary>
            <div className="absolute right-0 mt-2 w-80 max-h-[75vh] overflow-y-auto overscroll-contain rounded-xl bg-[#1a1a1a]/95 shadow-2xl border border-white/10 p-2 space-y-1 backdrop-blur-md">
              <a href="/mbti" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-emerald-500/10 hover:text-emerald-400">MBTI</a>
              <a href="/lysk" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-purple-500/10 hover:text-purple-400">恋与深空</a>
              <a href="/blog" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-blue-500/10 hover:text-blue-400">博客文章</a>
              <a href="/history" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-white/5">我的聊天</a>
              <a href="/login" className="block px-3 py-2 rounded-lg text-sm text-[#e5e5e5] hover:bg-white/5">登录</a>
              <div className="h-px bg-white/10 my-1" />
              <div className="px-2 py-1 text-[11px] text-[#737373]">快捷操作</div>
              <button
                onClick={() => hasMessages && handleCopy()}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${hasMessages ? 'hover:bg-white/5 text-[#e5e5e5]' : 'text-[#737373] cursor-not-allowed'}`}
                disabled={!hasMessages}
              >
                复制最近回复
              </button>
              <button
                onClick={async () => {
                  if (!hasMessages) return;
                  try {
                    setBlogLoading(true);
                    const res = await fetch('/api/blog', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ messages }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to generate blog');
                    setBlogDraft({ title: data.title, markdown: data.markdown });
                    localStorage.setItem('chat2blog_draft', JSON.stringify({ title: data.title, content: data.markdown }));
                  } catch (e) {
                    console.error('Blog generation failed', e);
                    alert('生成博客失败，请重试');
                  } finally {
                    setBlogLoading(false);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${hasMessages && !blogLoading ? 'hover:bg-emerald-500/10 text-emerald-400' : 'text-[#737373] cursor-not-allowed'
                  }`}
                disabled={!hasMessages || blogLoading}
              >
                <span>生成博客</span>
                {blogLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              </button>
              <button
                onClick={() => hasMessages && clearChat()}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${hasMessages ? 'hover:bg-red-500/10 text-red-400' : 'text-[#737373] cursor-not-allowed'}`}
                disabled={!hasMessages}
              >
                清空聊天
              </button>
              <div className="h-px bg-white/10 my-1" />
              <div className="px-2 py-1 text-[11px] text-[#737373]">我的信息（可选）</div>
              <div className="px-2 py-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <div className="text-[11px] text-[#a3a3a3] mb-1">人设名（必填，后续对话默认使用这个人设）</div>
                    <input
                      value={userPersona.name}
                      onChange={(e) => {
                        const next = { ...userPersona, name: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="例如：小雨 / 阿梨 / 我本人"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#a3a3a3] mb-1">MBTI</div>
                    <input
                      value={userPersona.mbti}
                      onChange={(e) => {
                        const next = { ...userPersona, mbti: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="INFP"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#a3a3a3] mb-1">作息</div>
                    <input
                      value={userPersona.schedule}
                      onChange={(e) => {
                        const next = { ...userPersona, schedule: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="晚睡/早起/熬夜党"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-[#a3a3a3] mb-1">喜欢吃/偏好</div>
                    <input
                      value={userPersona.likes}
                      onChange={(e) => {
                        const next = { ...userPersona, likes: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="抹茶/辣锅/烤肉（不吃香菜）"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-[#a3a3a3] mb-1">工作/学习</div>
                    <input
                      value={userPersona.work}
                      onChange={(e) => {
                        const next = { ...userPersona, work: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="互联网产品/学生/自由职业..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-[#a3a3a3] mb-1">雷点/禁忌</div>
                    <input
                      value={userPersona.redlines}
                      onChange={(e) => {
                        const next = { ...userPersona, redlines: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="例如：别叫我MC；别说教；别冷暴力"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] text-[#a3a3a3] mb-1">补充（可选）</div>
                    <textarea
                      value={userPersona.extras}
                      onChange={(e) => {
                        const next = { ...userPersona, extras: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="想让他们记住的其他细节..."
                      className="w-full min-h-[70px] resize-y rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-[#e5e5e5] placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#737373]">会自动保存到本机并用于后续聊天</span>
                  <button
                    onClick={() => {
                      setUserPersona(emptyPersona);
                      persistUserPersona(emptyPersona);
                    }}
                    className="px-2 py-1 text-[11px] rounded-md bg-white/10 hover:bg-white/20 border border-white/10 text-[#a3a3a3]"
                  >
                    清空
                  </button>
                </div>
              </div>
              {!fixedMode && (
                <>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-2 py-1 text-[11px] text-[#737373]">视图</div>
                  <button onClick={() => setViewMode('mbti')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${viewMode === 'mbti' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-white/5 text-[#e5e5e5]'}`}>MBTI</button>
                  <button onClick={() => setViewMode('game')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${viewMode === 'game' ? 'bg-purple-500/10 text-purple-400' : 'hover:bg-white/5 text-[#e5e5e5]'}`}>恋与深空</button>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-2 py-1 text-[11px] text-[#737373]">交互模式</div>
                  <button onClick={() => setInteractionMode('text')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${interactionMode === 'text' ? 'bg-white/10 text-[#e5e5e5]' : 'hover:bg-white/5 text-[#a3a3a3]'}`}>文字</button>
                  <button onClick={() => setInteractionMode('voice')} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${interactionMode === 'voice' ? 'bg-white/10 text-[#e5e5e5]' : 'hover:bg-white/5 text-[#a3a3a3]'}`}>语音</button>
                </>
              )}
              {viewMode === 'game' && (
                <>
                  <div className="h-px bg-white/10 my-1" />
                  <div className="px-2 py-1 text-[11px] text-[#737373]">聊天人选（最多5人）</div>
                  <div className="px-2 py-1 space-y-1">
                    {allGameRoles.map((r) => {
                      const checked = selectedRoles.includes(r);
                      return (
                        <label key={r} className="flex items-center gap-2 text-sm text-[#e5e5e5]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setSelectedRoles((prev) => {
                                if (e.target.checked) {
                                  const next = [...new Set([...prev, r])];
                                  return next.slice(0, 5);
                                } else {
                                  return prev.filter(x => x !== r);
                                }
                              });
                            }}
                            className="h-3.5 w-3.5 rounded border-white/20 bg-white/5"
                          />
                          <span>{r}</span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}
              <div className="h-px bg-white/10 my-1" />
              <div className="px-2 py-1 text-[11px] text-[#737373]">主题</div>
              <div className="flex items-center gap-1 bg-white/10 rounded-full p-1 border border-white/10">
                <button onClick={() => setTheme('green')} className={`w-7 h-7 flex items-center justify-center text-xs rounded-full ${theme === 'green' ? 'bg-white/20 shadow font-medium text-white' : 'hover:bg-white/10'}`}>🌿</button>
                <button onClick={() => setTheme('lavender')} className={`w-7 h-7 flex items-center justify-center text-xs rounded-full ${theme === 'lavender' ? 'bg-white/20 shadow font-medium text-white' : 'hover:bg-white/10'}`}>💜</button>
                <button onClick={() => setTheme('pink')} className={`w-7 h-7 flex items-center justify-center text-xs rounded-full ${theme === 'pink' ? 'bg-white/20 shadow font-medium text-white' : 'hover:bg-white/10'}`}>🌸</button>
                <button onClick={() => setTheme('butter')} className={`w-7 h-7 flex items-center justify-center text-xs rounded-full ${theme === 'butter' ? 'bg-white/20 shadow font-medium text-white' : 'hover:bg-white/10'}`}>🧈</button>
              </div>
            </div>
          </details>
        </div>
      </header>
      {(viewMode === 'game' || viewMode === 'mbti') && (
        <div className="px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur border-b border-white/5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <div className="text-sm text-[#a3a3a3]">
              <span className="font-medium text-[#e5e5e5]">当前人设：</span>
              {userPersona?.name?.trim() ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {userPersona.name.trim()}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  未设置（去右上角菜单填写“人设名”）
                </span>
              )}
            </div>
          </div>
        </div>
      )}
      {viewMode === 'game' && (
        <div className="px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur border-b border-white/5">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex gap-2 flex-wrap">
              {allGameRoles.map((r) => {
                const active = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => {
                      setSelectedRoles((prev) => {
                        return active
                          ? prev.filter((x) => x !== r)
                          : [...new Set([...prev, r])].slice(0, 5);
                      });
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border ${active
                      ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-[#a3a3a3] border-white/10 hover:bg-white/10'
                      }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedRoles([...allGameRoles])} className="px-2 py-1 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[#a3a3a3]">全选</button>
              <button onClick={() => setSelectedRoles([])} className="px-2 py-1 text-xs rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[#a3a3a3]">清空</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${themes[theme].accentFrom} ${themes[theme].accentTo} flex-shrink-0 flex items-center justify-center mt-1`}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className={`p-4 rounded-3xl rounded-tl-none max-w-[85%] backdrop-blur-md ${themes[theme].cardBg}`}>
              <p className="text-sm">
                Hello! I'm your creative partner. Tell me what's on your mind, and let's turn it into a blog post.
              </p>
            </div>
          </div>
        )}

        {messages.map((m: any) => {
          const content = getMessageContent(m);
          const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content) : null;
          const hasRoles = parsed && parsed.roles.length > 0;

          // 普通消息（用户，或无法解析为 MBTI 群聊的助手消息）
          if (m.role !== 'assistant' || !hasRoles) {
            return (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 shadow ${m.role === 'user' ? 'bg-white/20 text-white' : `bg-gradient-to-tr ${themes[theme].accentFrom} ${themes[theme].accentTo}`}`}>
                  {m.role === 'user' ? <div className="text-xs font-semibold">You</div> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-3.5 rounded-3xl max-w-[85%] backdrop-blur-md shadow-none ${m.role === 'user' ? `${themes[theme].bubbleUser} rounded-tr-none` : `${themes[theme].bubbleBot} rounded-tl-none`}`}>
                  <div className={`text-sm prose max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <MbtiReply
              key={m.id}
              parsed={parsed!}
              messageId={m.id}
              theme={theme}
              viewMode={viewMode}
              selectedGameRoles={
                viewMode === 'game'
                  ? (messageSelectedRoles[String(m.id ?? '')] || selectedRoles)
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* Blog Preview Panel */}
      {blogDraft && (
        <div className="border border-white/10 bg-[#1a1a1a] shadow-2xl p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[#e5e5e5]">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">博客草稿预览</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBlogDraft(null)}
                className="px-2 py-1 text-xs rounded-md bg-white/5 text-[#a3a3a3] hover:bg-white/10 border border-white/10"
              >关闭</button>
              <button
                onClick={() => {
                  localStorage.setItem('chat2blog_draft', JSON.stringify({
                    title: blogDraft.title,
                    content: blogDraft.markdown
                  }));
                  router.push('/publish');
                }}
                className="px-2 py-1 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 font-bold shadow-lg shadow-emerald-500/20"
              >
                <Globe className="w-3 h-3" /> 去发布
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([blogDraft.markdown], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const safeTitle = (blogDraft.title || 'draft').replace(/[^\w\-]+/g, '-');
                  a.href = url;
                  a.download = `${safeTitle}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2 py-1 text-xs rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> 下载 .md
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([blogDraft.markdown], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const safeTitle = (blogDraft.title || 'draft').replace(/[^\w\-]+/g, '-');
                  a.href = url;
                  a.download = `${safeTitle}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> 下载 .txt
              </button>
            </div>
          </div>
          <div className="prose max-w-none text-[15px] prose-neutral text-gray-900 max-h-[60vh] overflow-auto pr-1">
            <ReactMarkdown>{blogDraft.markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white/60 backdrop-blur-2xl border-t border-white/40 shadow-inner">
        {/* STT 提示和波形只在语音模式下显示 */}
        {interactionMode === 'voice' && sttError && (
          <div className="mb-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-2 flex items-center justify-between">
            <span>{sttError}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSttError(null)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15">忽略</button>
              <button onClick={setupRecognition} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500">重试</button>
            </div>
          </div>
        )}
        {/* Voice Visualizer */}
        <AnimatePresence>
          {interactionMode === 'voice' && isRecording && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 80, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden relative"
            >
              <AudioVisualizer stream={audioStream} isRecording={isRecording} />
              <button
                onClick={stopRecording}
                className="absolute bottom-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className={`flex-1 rounded-3xl flex items-center p-1.5 pl-4 transition-all focus-within:shadow-lg shadow ${themes[theme].inputBg}`}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={interactionMode === 'voice' ? "Type or speak..." : "请输入内容..."}
              className={`flex-1 bg-transparent border-none outline-none py-3 min-h-[44px] ${themes[theme].text}`}
            />
            {interactionMode === 'voice' && (
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-2 rounded-2xl transition-all ${isRecording ? "text-red-600 bg-red-100" : `${themes[theme].textSub} hover:bg-black/5`}`}
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className={`p-3 rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${themes[theme].button}`}
            disabled={!inputValue && !(interactionMode === 'voice' && isRecording)}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </main>
  );
}
