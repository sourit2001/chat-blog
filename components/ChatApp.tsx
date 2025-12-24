"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mic, Send, Menu, Sparkles, StopCircle, Copy, Trash2, Check, FileText,
  Download, Volume2, Loader2, Globe, LayoutGrid, Users, History,
  Settings, ChevronDown, ChevronRight, MessageCircle, PenTool, Palette,
  UserCircle, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ReactMarkdown from "react-markdown";
import { supabaseClient } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";
import Link from 'next/link';

type ParsedMbtiReply = {
  intro: string;
  roles: { role: string; text: string }[];
};

type ViewMode = 'mbti' | 'game';
type InteractionMode = 'text' | 'voice';

const allMbtiRoles = ["ENTJ", "ISTJ", "ENFP", "INFP", "ENFJ"] as const;

const themes = {
  emerald: {
    name: '生机翠',
    bg: 'bg-[#F0FDF4]',
    pageBg: '#F0FDF4',
    text: 'text-slate-900',
    accent: '#10B981',
    button: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/20',
    bubbleUser: 'bg-[#10B981]/80 backdrop-blur-xl text-white shadow-xl shadow-emerald-500/10 border border-white/20',
    bubbleBot: 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-white/60 backdrop-blur-xl border border-white/60 text-slate-900',
    cardBg: 'bg-white/30 backdrop-blur-2xl border border-white/40',
  },
  indigo: {
    name: '极光紫',
    bg: 'bg-[#F5F3FF]',
    pageBg: '#F5F3FF',
    text: 'text-slate-900',
    accent: '#6366F1',
    button: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20',
    bubbleUser: 'bg-[#6366F1]/80 backdrop-blur-xl text-white shadow-xl shadow-indigo-500/10 border border-white/20',
    bubbleBot: 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-white/60 backdrop-blur-xl border border-white/60 text-slate-900',
    cardBg: 'bg-white/30 backdrop-blur-2xl border border-white/40',
  },
  rose: {
    name: '晚霞粉',
    bg: 'bg-[#FFF1F2]',
    pageBg: '#FFF1F2',
    text: 'text-slate-900',
    accent: '#F43F5E',
    button: 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-lg shadow-rose-500/20',
    bubbleUser: 'bg-[#F43F5E]/80 backdrop-blur-xl text-white shadow-xl shadow-rose-500/10 border border-white/20',
    bubbleBot: 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-white/60 backdrop-blur-xl border border-white/60 text-slate-900',
    cardBg: 'bg-white/30 backdrop-blur-2xl border border-white/40',
  },
  amber: {
    name: '晨晖金',
    bg: 'bg-[#FFFBEB]',
    pageBg: '#FFFBEB',
    text: 'text-slate-900',
    accent: '#F59E0B',
    button: 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-lg shadow-amber-500/20',
    bubbleUser: 'bg-[#F59E0B]/80 backdrop-blur-xl text-white shadow-xl shadow-amber-500/10 border border-white/20',
    bubbleBot: 'bg-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-white/60 backdrop-blur-xl border border-white/60 text-slate-900',
    cardBg: 'bg-white/30 backdrop-blur-2xl border border-white/40',
  },
} as const;

const chatBackgrounds = [
  { id: 'none', name: '极简', url: '' },
  { id: 'warm', name: '暖风', url: '/backgrounds/warm.png' },
  { id: 'vibrant', name: '流光', url: '/backgrounds/vibrant.png' },
  { id: 'cozy', name: '静谧', url: '/backgrounds/cozy.png' },
  { id: 'rain', name: '听雨', url: '/backgrounds/rain-cozy.png' },
  { id: 'meadow', name: '听风', url: '/backgrounds/meadow-cozy.png' },
];

const RainyBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const bgImage = new Image();
    bgImage.src = "/backgrounds/rain-cozy.png";

    let animationFrameId: number;
    let width: number;
    let height: number;

    interface Drop {
      x: number;
      y: number;
      r: number;
      v: number;
      trail: { y: number; r: number }[];
      stutter: number;
    }

    interface StaticDrop {
      x: number;
      y: number;
      r: number;
      opacity: number;
    }

    const drops: Drop[] = [];
    const staticDrops: StaticDrop[] = [];

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;

      drops.length = 0;
      staticDrops.length = 0;

      for (let i = 0; i < 300; i++) {
        staticDrops.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.5 + Math.random() * 2,
          opacity: 0.1 + Math.random() * 0.2
        });
      }

      for (let i = 0; i < 40; i++) {
        drops.push(createDrop(true));
      }
    };

    const createDrop = (randomY = false) => ({
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -20,
      r: 2 + Math.random() * 3,
      v: 0.8 + Math.random() * 1.5,
      trail: [],
      stutter: Math.random() * 50
    });

    const draw = () => {
      // Background
      if (bgImage.complete) {
        ctx.drawImage(bgImage, 0, 0, width, height);
      } else {
        ctx.fillStyle = '#1a140f';
        ctx.fillRect(0, 0, width, height);
      }

      // Static condensation
      staticDrops.forEach(d => {
        ctx.fillStyle = `rgba(255, 240, 220, ${d.opacity})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Active drops
      drops.forEach((d, i) => {
        d.stutter++;
        if (d.stutter > 15) {
          d.y += d.v * (0.4 + Math.random() * 0.6);
          if (Math.random() > 0.96) d.stutter = 0;
        }

        if (Math.random() > 0.7) {
          d.trail.push({ y: d.y, r: d.r * 0.7 });
          if (d.trail.length > 12) d.trail.shift();
        }

        // Draw trail
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        d.trail.forEach(t => {
          ctx.beginPath();
          ctx.arc(d.x, t.y, t.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Refraction logic
        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.clip();

        if (bgImage.complete) {
          const shift = d.r * 1.5;
          ctx.drawImage(
            bgImage,
            (d.x / width) * bgImage.width - shift,
            (d.y / height) * bgImage.height - shift,
            d.r * 8, d.r * 8,
            d.x - d.r * 2, d.y - d.r * 2,
            d.r * 4, d.r * 4
          );
        }
        ctx.restore();

        // Volume Shading
        const grad = ctx.createRadialGradient(d.x - d.r * 0.3, d.y - d.r * 0.3, 0, d.x, d.y, d.r);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();

        // Glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(d.x - d.r * 0.3, d.y - d.r * 0.3, d.r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        if (d.y > height + 20) drops[i] = createDrop();
      });

      // Warm overlay
      ctx.fillStyle = 'rgba(40, 25, 10, 0.15)';
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    window.addEventListener('resize', init);
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', init);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a0a0a] -z-20">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const MeadowBackground = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#0d1a0d] -z-20">
    {/* Base Scene - Healing Meadow Photo with Breathing Animation */}
    <motion.img
      src="/backgrounds/meadow-cozy.png"
      alt="Cozy Meadow at Sunset"
      initial={{ scale: 1.1, x: "-1%", y: "-1%" }}
      animate={{
        scale: [1.1, 1.15, 1.1],
        x: ["-1%", "0%", "-1%"],
        y: ["-1%", "0%", "-1%"]
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="absolute inset-0 w-full h-full object-cover opacity-80"
      style={{ filter: 'brightness(0.8) saturate(1.2) blur(0.5px)' }}
    />

    {/* Flowing Light Rays (Tyndall Effect) */}
    <motion.div
      animate={{ opacity: [0.1, 0.3, 0.1], x: [-20, 20, -20] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,200,100,0.15)_0%,transparent_70%)] mix-blend-screen pointer-events-none"
    />

    {/* Dynamic Wind Streaks */}
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={`meadow-wind-${i}`}
        initial={{ x: "-100%", y: 20 + Math.random() * 60 + "%", opacity: 0 }}
        animate={{ x: "200%", opacity: [0, 0.15, 0] }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 5
        }}
        className="absolute w-[600px] h-[100px] bg-gradient-to-r from-transparent via-white/5 to-transparent blur-[40px] -rotate-12 pointer-events-none"
      />
    ))}

    {/* Floating Dandelion Particles with Sine Wave Path */}
    {[...Array(20)].map((_, i) => {
      const delay = Math.random() * 10;
      const duration = 12 + Math.random() * 10;
      return (
        <motion.div
          key={`cozy-seed-${i}`}
          initial={{ x: "-10%", y: 40 + Math.random() * 50 + "%", opacity: 0 }}
          animate={{
            x: "110%",
            y: [(40 + Math.random() * 50) + "%", (30 + Math.random() * 40) + "%", (50 + Math.random() * 40) + "%"],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "linear",
            delay
          }}
          className="absolute pointer-events-none"
        >
          <div className="w-1.5 h-1.5 bg-white rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-[-4px] border border-white/20 rounded-full blur-[1px]"
          />
        </motion.div>
      );
    })}

    {/* Layered Grass Movement (On top of image) */}
    <div className="absolute bottom-[-20px] inset-x-0 flex items-end justify-around h-64 pointer-events-none opacity-40">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={`moving-grass-${i}`}
          className="w-1.5 bg-emerald-400/20 rounded-t-full origin-bottom blur-[1px]"
          style={{ height: 80 + Math.random() * 120 + "px" }}
          animate={{
            rotate: [5, 20 + Math.random() * 15, 5],
            skewX: [2, 10 + Math.random() * 5, 2],
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>

    {/* Deep Foreground Blur */}
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-950/20 to-transparent backdrop-blur-[1px] pointer-events-none" />
  </div>
);

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
  // Use subtle, consistent colors instead of vibrant gradients
  return 'bg-[var(--bg-hover)]';
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
    <div className={`space-y-4 ${themes[theme].text}`}>
      {parsed.intro && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-white/40 backdrop-blur-md shadow-sm">
            <Sparkles className="w-4 h-4" style={{ color: themes[theme].accent }} />
          </div>
          <div className={`p-4 rounded-2xl max-w-[85%] ${themes[theme].cardBg} shadow-sm border border-black/5`}>
            <div className="text-sm prose max-w-none leading-relaxed text-slate-800">
              <ReactMarkdown>{parsed.intro}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {visibleRoles.map((block) => (
        <div key={`${messageId}-${block.role}`} className="flex gap-3">
          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-white shadow-sm border border-black/5`}>
            {viewMode === 'game' ? (
              <span className="text-[10px] font-bold text-slate-400">
                {getRoleLabel(block.role, viewMode)}
              </span>
            ) : (
              <span className="text-xl">{getRoleEmoji(block.role, viewMode)}</span>
            )}
          </div>
          <div className={`p-4 rounded-2xl max-w-[85%] border-l-4 ${themes[theme].cardBg} shadow-md border-black/5`} style={{ borderLeftColor: themes[theme].accent }}>
            <div className="text-sm prose max-w-none leading-relaxed text-slate-800">
              {getRoleLabel(block.role, viewMode) && (
                <div className="text-[10px] font-black mb-1 uppercase tracking-[0.2em]" style={{ color: themes[theme].accent }}>
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
              className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center bg-white/60`}
              >
                {viewMode !== 'game' && (
                  <span className="text-[10px]">{getRoleEmoji(role, viewMode)}</span>
                )}
              </div>
              <span>
                {getRoleLabel(role, viewMode) && (
                  <span>{getRoleLabel(role, viewMode)}：</span>
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

  // --- UI Layout States ---
  const [isPersonaDrawerOpen, setIsPersonaDrawerOpen] = useState(false);
  const [isAppearanceDrawerOpen, setIsAppearanceDrawerOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('emerald');
  const [selectedBg, setSelectedBg] = useState(chatBackgrounds[0]);
  const [isChatSubMenuOpen, setIsChatSubMenuOpen] = useState(true);

  // Sync theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[selectedTheme];
    root.style.setProperty('--bg-page', theme.pageBg);
    root.style.setProperty('--bg-panel', theme.pageBg);
    root.style.setProperty('--accent-main', theme.accent);

    // Determine if we need dark or light text based on theme name or common knowledge
    // For now, all these themes are light-ish backgrounds with dark text
    root.style.setProperty('--text-primary', '#1F2328');
    root.style.setProperty('--text-secondary', '#4B5563');

    root.style.setProperty('--bg-hover', `${theme.accent}15`);
    root.style.setProperty('--border-light', `${theme.accent}20`);
  }, [selectedTheme]);

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
  const [theme, setTheme] = useState<keyof typeof themes>('emerald');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Legacy theme mapping fix
  const activeTheme = selectedTheme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
    <div className={`relative flex h-[100dvh] w-full overflow-hidden bg-[var(--bg-page)] font-sans ${themes[selectedTheme].text}`}>
      {/* --- Desktop Sidebar --- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-light)] bg-[var(--bg-page)] z-30 transition-all">
        {/* Top: Logo */}
        <div className="p-8">
          <Logo className={`w-8 h-8 opacity-90`} showText={true} />
        </div>

        {/* Mid: Creation Section */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="py-2">
            <button
              onClick={() => setIsChatSubMenuOpen(!isChatSubMenuOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--bg-hover)] transition-colors group text-[var(--text-primary)]"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-[var(--accent-main)]" />
                <span>创作路径</span>
              </div>
              {isChatSubMenuOpen ? <ChevronDown className="w-4 h-4 opacity-40" /> : <ChevronRight className="w-4 h-4 opacity-40" />}
            </button>
            <AnimatePresence>
              {isChatSubMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-1 ml-4 space-y-1"
                >
                  <Link
                    href="/mbti"
                    className={`block px-3 py-2 text-xs rounded-lg transition-colors ${pathname === '/mbti' ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    · MBTI 创作型
                  </Link>
                  <Link
                    href="/lysk"
                    className={`block px-3 py-2 text-xs rounded-lg transition-colors ${pathname === '/lysk' ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    · 恋与深空同人
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/blog"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${pathname === '/blog' ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <div className={`w-0.5 h-4 bg-[var(--accent-main)] absolute left-0 ${pathname === '/blog' ? 'opacity-100' : 'opacity-0'}`} />
            <LayoutGrid className="w-4 h-4" />
            <span>博客广场</span>
          </Link>

          <Link
            href="/blog"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${pathname === '/my-blogs' ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <PenTool className="w-4 h-4" />
            <span>我的博客</span>
          </Link>

          <div className="h-px bg-[var(--border-light)] my-4 mx-3" />

          <Link
            href="/history"
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${pathname === '/history' ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
          >
            <History className="w-4 h-4" />
            <span>聊天历史</span>
          </Link>
        </nav>

        {/* Bottom: Settings & Modes */}
        <div className="px-4 py-6 space-y-2 border-t border-[var(--border-light)] bg-[var(--bg-page)]">
          <button
            onClick={() => setIsPersonaDrawerOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
          >
            <UserCircle className="w-4 h-4" />
            <span>人设配置</span>
          </button>

          <div className="flex items-center justify-between px-3 py-2 text-[13px] text-[var(--text-secondary)]">
            <div className="flex items-center gap-3">
              <Mic className="w-4 h-4" />
              <span>输入模式</span>
            </div>
            <button
              onClick={() => setInteractionMode(mode => mode === 'text' ? 'voice' : 'text')}
              className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg-hover)] border border-[var(--border-light)]"
            >
              {interactionMode === 'voice' ? '语音' : '文字'}
            </button>
          </div>

          <button
            onClick={() => setIsAppearanceDrawerOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
          >
            <Palette className="w-4 h-4" />
            <span>视觉风格</span>
          </button>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main
        className="flex-1 flex flex-col min-w-0 relative z-0 transition-all duration-700"
        style={{
          backgroundImage: (selectedBg.url && !selectedBg.url.startsWith('dynamic')) ? `url(${selectedBg.url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dynamic Backgrounds */}
        {selectedBg.id === 'rain' && <RainyBackground />}
        {selectedBg.id === 'meadow' && <MeadowBackground />}

        {/* Background Overlay for readability */}
        {(selectedBg.url || selectedBg.id === 'rain' || selectedBg.id === 'meadow') && (
          <div className={`absolute inset-0 ${['rain', 'meadow'].includes(selectedBg.id) ? 'backdrop-blur-none' : 'backdrop-blur-[8px]'} -z-10 pointer-events-none transition-all duration-1000 ${selectedBg.id === 'rain' ? 'bg-transparent' : 'bg-white/10'}`} />
        )}

        {/* Dynamic Theme Background fallback */}
        {!selectedBg.url && selectedBg.id === 'none' && (
          <div className={`${themes[selectedTheme].bg} absolute inset-0 -z-30 opacity-100`} />
        )}

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-panel)]">
          <Logo className={`w-7 h-7 opacity-90 ${isDarkMode ? 'invert' : ''}`} />
          <div className="text-xs font-bold text-[var(--text-primary)] px-3 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border-light)] uppercase tracking-widest">
            {pathname === '/lysk' ? '恋与深空' : 'MBTI创作'}
          </div>
          <button onClick={() => setIsPersonaDrawerOpen(true)} className="p-2 rounded-full hover:bg-[var(--bg-hover)]">
            <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </header>

        {/* Global Persona Bar (if active) */}
        {(viewMode === 'game' || viewMode === 'mbti') && (
          <div className="px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-panel)]/40 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-tertiary)]">当前身份：</span>
                <span className={`font-bold ${userPersona.name ? 'text-[var(--accent-main)]' : 'text-[var(--text-tertiary)] opacity-70'}`}>
                  {userPersona.name || '未配置人设'}
                </span>
                {userPersona.name && <span className="px-1.5 py-0.5 rounded bg-[var(--accent-main)]/10 text-[10px] text-[var(--accent-main)] uppercase border border-[var(--accent-main)]/20">{userPersona.mbti || 'MBTI'}</span>}
              </div>
              <button
                onClick={() => setIsPersonaDrawerOpen(true)}
                className="text-[var(--accent-main)] hover:opacity-80 transition-colors font-bold"
              >
                修改
              </button>
            </div>
          </div>
        )}

        {/* --- Chat Content --- */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6 scroll-smooth custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-20 text-center"
              >
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2 tracking-tight mt-10">开启一段对话</h2>
                <p className="text-[var(--text-secondary)] text-sm max-w-sm">在这里记录灵感，通过对话生成触动人心的博客文章。</p>
              </motion.div>
            )}

            {messages.map((m: any) => {
              const content = getMessageContent(m);
              const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content) : null;
              const hasRoles = parsed && parsed.roles.length > 0;

              if (m.role !== 'assistant' || !hasRoles) {
                return (
                  <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 sm:mt-2 shadow-lg backdrop-blur-xl border border-white/30`} style={{ backgroundColor: m.role === 'user' ? themes[selectedTheme].accent : 'rgba(255,255,255,0.6)', color: m.role === 'user' ? 'white' : themes[selectedTheme].accent }}>
                      {m.role === 'user' ? <div className="text-[10px] font-black uppercase">You</div> : <Sparkles className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 max-w-[85%] ${m.role === 'user' ? `${themes[selectedTheme].bubbleUser} rounded-2xl rounded-tr-sm` : `${themes[selectedTheme].bubbleBot} rounded-2xl rounded-tl-sm`}`}>
                      <div className={`text-[15px] prose prose-sm max-w-none leading-relaxed ${m.role === 'user' ? 'text-white drop-shadow-sm' : 'text-slate-800'}`}>
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
                  theme={selectedTheme}
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
        </div>

        {/* --- Input Console --- */}
        <section className={`p-4 border-t transition-all ${selectedBg.url ? 'bg-white/60 backdrop-blur-xl border-white/20' : 'bg-white border-slate-100'}`}>
          <div className="max-w-4xl mx-auto">
            {/* Draft Preview Tooltip */}
            <AnimatePresence>
              {blogDraft && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={`mb-4 p-4 rounded-2xl border shadow-2xl flex items-center justify-between ${selectedBg.url ? 'bg-white/80' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-[#a3a3a3] uppercase font-bold tracking-widest">博客草稿已就绪</div>
                      <div className="text-sm text-[#e5e5e5] font-bold line-clamp-1">{blogDraft.title}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBlogDraft(null)} className="p-2 rounded-lg hover:bg-white/5 text-[#a3a3a3]">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        localStorage.setItem('chat2blog_draft', JSON.stringify({ title: blogDraft.title, content: blogDraft.markdown }));
                        router.push('/publish');
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" /> 立即发布
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Form */}
            <div className="flex flex-col gap-3">
              {interactionMode === 'voice' && isRecording && (
                <div className="h-16 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                  <button onClick={stopRecording} className="absolute right-4 p-2 bg-red-500/20 text-red-500 rounded-full">
                    <StopCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className={`flex-1 rounded-2xl flex items-center px-4 transition-all focus-within:ring-2 ${themes[selectedTheme].inputBg}`} style={{ '--tw-ring-color': `${themes[selectedTheme].accent}33` } as any}>
                  <textarea
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e as any);
                      }
                    }}
                    placeholder={interactionMode === 'voice' ? (isRecording ? "正在倾听..." : "点击麦克风或直接输入...") : "聊聊你的想法..."}
                    className="flex-1 bg-transparent border-none outline-none py-4 max-h-48 resize-none text-[15px] font-medium placeholder-slate-400"
                  />
                  {interactionMode === 'voice' && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-2 rounded-xl transition-all ${isRecording ? "text-red-500 bg-red-50" : "text-slate-400 hover:bg-slate-100"}`}
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputValue && !isRecording}
                  className={`p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${themes[selectedTheme].button}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Input Tools */}
              <div className="flex items-center gap-4 px-2">
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
                    } catch (e) {
                      alert('生成博客失败，请重试');
                    } finally {
                      setBlogLoading(false);
                    }
                  }}
                  disabled={!hasMessages || blogLoading}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--accent-main)] transition-colors disabled:opacity-30"
                >
                  {blogLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  <span>生成博客</span>
                </button>
                <button
                  onClick={() => hasMessages && clearChat()}
                  disabled={!hasMessages}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)] hover:text-red-500 transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清除对话</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* --- Mobile Tab Bar --- */}
        <nav className="lg:hidden flex items-center justify-around h-16 border-t border-[var(--border-light)] bg-[var(--bg-panel)] pb-safe">
          <Link href="/mbti" className={`flex flex-col items-center gap-1 ${pathname === '/mbti' || pathname === '/lysk' ? 'text-[var(--accent-main)]' : 'text-[var(--text-tertiary)]'}`}>
            <MessageCircle className="w-5 h-5" />
            <span className="text-[10px] font-bold">群聊</span>
          </Link>
          <Link href="/blog" className={`flex flex-col items-center gap-1 ${pathname === '/blog' ? 'text-[var(--accent-main)]' : 'text-[var(--text-tertiary)]'}`}>
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-bold">广场</span>
          </Link>
          <Link href="/blog" className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]">
            <PenTool className="w-5 h-5" />
            <span className="text-[10px] font-bold">我的</span>
          </Link>
          <button onClick={() => setIsPersonaDrawerOpen(true)} className="flex flex-col items-center gap-1 text-[var(--text-tertiary)]">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-bold">设置</span>
          </button>
        </nav>
      </main>

      {/* --- Global Persona Drawer --- */}
      <AnimatePresence>
        {isPersonaDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPersonaDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 sm:w-96 bg-[var(--bg-page)] shadow-2xl z-[101] border-l border-[var(--border-light)] flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircle className="w-6 h-6 text-[var(--accent-main)]" />
                  <h3 className="text-lg font-black text-[var(--text-primary)]">人设配置</h3>
                </div>
                <button onClick={() => setIsPersonaDrawerOpen(false)} className="p-2 hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] rounded-lg transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">人设名</label>
                    <input
                      value={userPersona.name}
                      onChange={(e) => {
                        const next = { ...userPersona, name: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="你的创作者昵称"
                      className="w-full bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:[var(--text-tertiary)] focus:ring-1 focus:ring-[var(--accent-main)]/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">MBTI</label>
                      <input
                        value={userPersona.mbti}
                        onChange={(e) => {
                          const next = { ...userPersona, mbti: e.target.value };
                          setUserPersona(next);
                          persistUserPersona(next);
                        }}
                        placeholder="e.g. INFP"
                        className="w-full bg-[#fcfaf2] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">作息</label>
                      <input
                        value={userPersona.schedule}
                        onChange={(e) => {
                          const next = { ...userPersona, schedule: e.target.value };
                          setUserPersona(next);
                          persistUserPersona(next);
                        }}
                        placeholder="e.g. 熬夜党"
                        className="w-full bg-[#fcfaf2] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">偏好/喜欢</label>
                    <input
                      value={userPersona.likes}
                      onChange={(e) => {
                        const next = { ...userPersona, likes: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="e.g. 抹茶、摄影"
                      className="w-full bg-[#fcfaf2] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">雷点/禁忌</label>
                    <input
                      value={userPersona.redlines}
                      onChange={(e) => {
                        const next = { ...userPersona, redlines: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      placeholder="避免提到的内容"
                      className="w-full bg-[#fcfaf2] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">补充描述</label>
                    <textarea
                      value={userPersona.extras}
                      onChange={(e) => {
                        const next = { ...userPersona, extras: e.target.value };
                        setUserPersona(next);
                        persistUserPersona(next);
                      }}
                      rows={4}
                      placeholder="想让 AI 记住的其他细节..."
                      className="w-full bg-[#fcfaf2] border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none resize-none"
                    />
                  </div>
                </div>

                {viewMode === 'game' && (
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">成员管理 (恋与深空)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {allGameRoles.map(r => (
                        <button
                          key={r}
                          onClick={() => {
                            setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r].slice(0, 5));
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${selectedRoles.includes(r) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-[#a3a3a3] border-white/5'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[var(--border-light)] space-y-4 bg-[var(--bg-page)]">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>设置将自动加密保存至本地</span>
                  <button onClick={() => { setUserPersona(emptyPersona); persistUserPersona(emptyPersona); }} className="hover:text-red-400">重置人设</button>
                </div>
                <button
                  onClick={() => setIsPersonaDrawerOpen(false)}
                  className="w-full py-4 bg-[var(--accent-main)] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 transition-all"
                >
                  确定
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- Appearance Drawer --- */}
      <AnimatePresence>
        {isAppearanceDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAppearanceDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 sm:w-96 bg-white shadow-2xl z-[101] border-l border-slate-100 flex flex-col"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-6 h-6 text-indigo-500" />
                  <h3 className="text-lg font-black text-slate-900">视觉风格</h3>
                </div>
                <button onClick={() => setIsAppearanceDrawerOpen(false)} className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">配色方案</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(themes).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTheme(key as keyof typeof themes)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedTheme === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-inner"
                          style={{ backgroundColor: value.accent }}
                        />
                        <span className="text-xs font-bold text-slate-700">{value.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">聊天背景</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {chatBackgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg)}
                        className={`group relative h-24 rounded-2xl border-2 overflow-hidden transition-all ${selectedBg.id === bg.id ? 'border-indigo-500' : 'border-slate-100 hover:border-slate-200'}`}
                      >
                        {bg.url ? (
                          <img src={bg.url} alt={bg.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-slate-50" />
                        )}
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity ${selectedBg.id === bg.id ? 'opacity-100 bg-black/10' : ''}`}>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{bg.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-50">
                <button
                  onClick={() => setIsAppearanceDrawerOpen(false)}
                  className="w-full py-4 bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
                >
                  确定
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
