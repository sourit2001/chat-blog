"use client";


import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mic, Send, Menu, Sparkles, StopCircle, Copy, Trash2, Check, FileText,
  Download, Volume2, Loader2, Globe, LayoutGrid, Users, History,
  Settings, ChevronDown, ChevronRight, MessageCircle, PenTool, Palette,
  UserCircle, Plus, VolumeX, Image as ImageIcon, X, Camera, CheckSquare, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ReactMarkdown from "react-markdown";
import { supabaseClient } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";
import Link from 'next/link';
import { UserStatus } from '@/components/UserStatus';
import { prepareMessagesForBlog, restoreBlogImages } from '@/utils/blogUtils';
import { MbtiReply } from "@/components/MbtiReply";
import {
  allMbtiRoles,
  mbtiGroups,
  parseMbtiGroupReply,
  getRoleEmoji,
  getRoleLabel,
  getRoleAvatar,
  getRoleColor
} from '@/utils/mbtiUtils';

type ParsedMbtiReply = {
  intro: string;
  roles: { role: string; text: string }[];
};

type ViewMode = 'mbti' | 'game';
type InteractionMode = 'text' | 'voice';

// Utility constants removed, now imported from @/utils/mbtiUtils.ts


const themes = {
  emerald: {
    name: '生机翠',
    bg: 'bg-[#F0FDF4]',
    pageBg: '#F0FDF4',
    text: 'text-[var(--text-primary)]',
    accent: '#10B981',
    button: 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/20',
    bubbleUser: 'bg-[#10B981]/80 backdrop-blur-xl text-white shadow-xl shadow-emerald-500/10 border border-white/20',
    bubbleBot: 'bg-[var(--bg-bubble-bot)] backdrop-blur-2xl border border-[var(--border-light)] shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-[var(--bg-input)] backdrop-blur-xl border border-[var(--border-light)] text-[var(--text-primary)]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-light)]',
  },
  indigo: {
    name: '极光紫',
    bg: 'bg-[#F5F3FF]',
    pageBg: '#F5F3FF',
    text: 'text-[var(--text-primary)]',
    accent: '#6366F1',
    button: 'bg-[#6366F1] hover:bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20',
    bubbleUser: 'bg-[#6366F1]/80 backdrop-blur-xl text-white shadow-xl shadow-indigo-500/10 border border-white/20',
    bubbleBot: 'bg-[var(--bg-bubble-bot)] backdrop-blur-2xl border border-[var(--border-light)] shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-[var(--bg-input)] backdrop-blur-xl border border-[var(--border-light)] text-[var(--text-primary)]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-light)]',
  },
  rose: {
    name: '晚霞粉',
    bg: 'bg-[#FFF1F2]',
    pageBg: '#FFF1F2',
    text: 'text-[var(--text-primary)]',
    accent: '#F43F5E',
    button: 'bg-[#F43F5E] hover:bg-[#E11D48] text-white shadow-lg shadow-rose-500/20',
    bubbleUser: 'bg-[#F43F5E]/80 backdrop-blur-xl text-white shadow-xl shadow-rose-500/10 border border-white/20',
    bubbleBot: 'bg-[var(--bg-bubble-bot)] backdrop-blur-2xl border border-[var(--border-light)] shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-[var(--bg-input)] backdrop-blur-xl border border-[var(--border-light)] text-[var(--text-primary)]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-light)]',
  },
  amber: {
    name: '晨晖金',
    bg: 'bg-[#FFFBEB]',
    pageBg: 'linear-gradient(135deg, #93c5fd 0%, #fdba74 100%)', // Blue-300 to Orange-300
    text: 'text-[var(--text-primary)]',
    accent: '#F59E0B',
    button: 'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-lg shadow-amber-500/20',
    bubbleUser: 'bg-[#F59E0B]/80 backdrop-blur-xl text-white shadow-xl shadow-amber-500/10 border border-white/20',
    bubbleBot: 'bg-[var(--bg-bubble-bot)] backdrop-blur-2xl border border-[var(--border-light)] shadow-xl shadow-black/5 px-4',
    inputBg: 'bg-[var(--bg-input)] backdrop-blur-xl border border-[var(--border-light)] text-[var(--text-primary)]',
    cardBg: 'bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-light)]',
  },
} as const;

const chatBackgrounds = [
  { id: 'none', name: '极简', url: '' },
  { id: 'warm', name: '暖风', url: '/backgrounds/warm.png' },
  { id: 'vibrant', name: '流光', url: '/backgrounds/vibrant.png' },
  { id: 'cozy', name: '静谧', url: '/backgrounds/cozy.png' },
  { id: 'rain', name: '听雨', url: '/backgrounds/rain-cozy.png' },
  { id: 'meadow', name: '听风', url: '/backgrounds/meadow-cozy.png' },
  { id: 'fireplace', name: '围炉', url: '/backgrounds/fireplace-cozy.png' },
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

const FireplaceBackground = () => (
  <div className="absolute inset-0 overflow-hidden bg-[#1a0f0a] -z-20">
    {/* Base Scene */}
    <img
      src="/backgrounds/fireplace-cozy.png"
      alt="Cozy Fireplace"
      className="absolute inset-0 w-full h-full object-cover opacity-90"
      style={{ filter: 'brightness(0.9) contrast(1.1)' }}
    />

    {/* Dynamic Fire Flicker Overlay */}
    <motion.div
      animate={{
        opacity: [0.3, 0.45, 0.3, 0.5, 0.35],
        scale: [1, 1.02, 1, 1.03, 1]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(255,100,0,0.2)_0%,transparent_60%)] mix-blend-overlay pointer-events-none"
    />

    {/* Rising Embers & Sparks */}
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={`ember-${i}`}
        initial={{
          x: 40 + Math.random() * 20 + "%",
          y: 60 + Math.random() * 10 + "%",
          opacity: 0,
          scale: 0.1 + Math.random() * 0.7
        }}
        animate={{
          y: ["60%", (10 + Math.random() * 20) + "%"],
          x: [
            (40 + Math.random() * 20) + "%",
            (35 + Math.random() * 30) + "%",
            (25 + Math.random() * 50) + "%"
          ],
          opacity: [0, 1, 0.8, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          ease: "easeOut",
          delay: Math.random() * 6
        }}
        className="absolute w-1.5 h-1.5 pointer-events-none"
      >
        <div className="w-1 h-1 bg-gradient-to-t from-orange-400 to-yellow-200 rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(255,120,0,0.9)]" />
      </motion.div>
    ))}

    {/* Overall Hearth Glow */}
    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-black/20 pointer-events-none" />
  </div>
);

// Utility functions removed, now imported from @/utils/mbtiUtils.ts


const getRoleAvatarClass = (role: string, mode: ViewMode) => {
  // Use subtle, consistent colors instead of vibrant gradients
  return 'bg-[var(--bg-hover)] overflow-hidden';
};

const getRoleStatusText = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ':
        return '祁煜一边检查装备一边抬眼打量战场，话不多，却已经在心里替你把所有退路都想好。';
      case 'ISTJ':
        return '黎深虽然还在看手里的病例，但心思全在你身上，正无奈又宠溺地盘算着一会儿该怎么把你抓到怀里“管教”一番。';
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
    // 分析家 (Purple)
    case 'INTJ': return '正在推演某种极其复杂的逻辑，暂时没空闲聊。';
    case 'INTP': return '刚发现一个逻辑漏洞，正专注于重构自己的想法。';
    case 'ENTJ': return '正在快速扫一眼全局，还在想怎么帮你定方向。';
    case 'ENTP': return '已经想到了三个能把现状彻底搞乱的反直觉点子。';

    // 外交官 (Green)
    case 'INFJ': return '在字里行间寻找你没说出口的深层含义。';
    case 'INFP': return '认真听着你的情绪变化，在琢磨这件事对你意味着什么。';
    case 'ENFJ': return '在整理大家刚才的点子，准备帮你收个小结。';
    case 'ENFP': return '脑子里已经开了十个脑洞，只是在挑哪一个最好玩。';

    // 守护者 (Blue)
    case 'ISTJ': return '在一旁默默记笔记，等你说完再补充细节和 checklist。';
    case 'ISFJ': return '在留意窗外的情况，确保大家讨论的环境足够安心。';
    case 'ESTJ': return '在看表计算时间，随时准备把偏离的话题拉回来。';
    case 'ESFJ': return '在观察每个人的反应，确保没人感到被冷落。';

    // 探险家 (Yellow)
    case 'ISTP': return '在旁边把玩工具，顺便看看这件事有没有更省力的解法。';
    case 'ISFP': return '在构思这一幕如果画下来，该用什么样的配色。';
    case 'ESTP': return '有点坐不住了，正等你说完直接带大家去实操。';
    case 'ESFP': return '正准备在下个空档讲个笑话，把气氛燥起来。';

    default:
      return '在旁边听着，还没决定要不要插话。';
  }
};

const getRoleColorLocal = (role: string, mode: ViewMode) => {
  return getRoleColor(role, mode);
};


// MbtiReply component removed, now imported from @/components/MbtiReply.tsx


export default function ChatApp() {
  const router = useRouter();
  const pathname = usePathname();
  const isRootPath = pathname === '/';
  const [viewMode, setViewMode] = useState<ViewMode>('mbti');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- UI Layout States ---
  const [isPersonaDrawerOpen, setIsPersonaDrawerOpen] = useState(false);
  const [isAppearanceDrawerOpen, setIsAppearanceDrawerOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('amber');
  const [selectedBg, setSelectedBg] = useState(chatBackgrounds[0]);
  const [isChatSubMenuOpen, setIsChatSubMenuOpen] = useState(true);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [blogStyle, setBlogStyle] = useState<'literary' | 'logical' | 'record'>('literary');
  const [isBlogDraftVisible, setIsBlogDraftVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const captureRef = useRef<HTMLDivElement>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [fontSize, setFontSize] = useState<'standard' | 'large' | 'xlarge'>('standard');

  // Sync theme and background to CSS variables
  const isDarkBg = ['rain', 'meadow', 'fireplace'].includes(selectedBg.id);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFontSize = localStorage.getItem('chat_font_size');
      if (savedFontSize === 'standard' || savedFontSize === 'large' || savedFontSize === 'xlarge') {
        setFontSize(savedFontSize);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const theme = themes[selectedTheme];
    root.style.setProperty('--bg-page', theme.pageBg);
    root.style.setProperty('--bg-panel', theme.pageBg);
    root.style.setProperty('--accent-main', theme.accent);

    // Sidebar colors (Always dark, regardless of background)
    root.style.setProperty('--sidebar-text-primary', '#1F2328');
    root.style.setProperty('--sidebar-text-secondary', '#4B5563');

    // Dialogue/Main Area colors (Adaptable)
    const textColorPrimary = isDarkBg ? '#F8FAFC' : '#1F2328';
    const textColorSecondary = isDarkBg ? '#CBD5E1' : '#4B5563';
    const textColorTertiary = isDarkBg ? '#94A3B8' : '#64748B';
    const bubbleBotBg = isDarkBg ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
    const cardBg = isDarkBg ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
    const inputBg = isDarkBg ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';

    root.style.setProperty('--text-primary', textColorPrimary);
    root.style.setProperty('--text-secondary', textColorSecondary);
    root.style.setProperty('--text-tertiary', textColorTertiary);
    root.style.setProperty('--bg-bubble-bot', bubbleBotBg);
    root.style.setProperty('--bg-card', cardBg);
    root.style.setProperty('--bg-input', inputBg);

    root.style.setProperty('--bg-hover', `${theme.accent}15`);
    root.style.setProperty('--border-light', isDarkBg ? 'rgba(255,255,255,0.1)' : `${theme.accent}20`);

    // Save background to localStorage for component use
    localStorage.setItem('chat_background', JSON.stringify(selectedBg));
  }, [selectedTheme, selectedBg, isDarkBg]);

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
  }, [fixedMode, viewMode]);

  // Load the latest conversation when viewMode changes or on mount
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      if (!supabaseClient) return;
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      // Find the LATEST conversation for this mode
      const { data: found } = await supabaseClient
        .from('conversations')
        .select('id, messages(id, role, content)')
        .eq('user_id', user.id)
        .eq('view_mode', viewMode)
        .order('created_at', { ascending: false })
        .limit(1);

      if (active && found && found.length > 0) {
        setConversationId(found[0].id);

        // Restore messages too!
        if (found[0].messages) {
          const restored = found[0].messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content
          }));
          // Sort explicitly by ID or just trust returning order if handled
          // But usually we need to ensure correct message order
          // Here we just set conversationId, messages often loaded separately or we can set them
          // Let's at least set conversationId so new messages append to it.
        }
      } else {
        if (active) setConversationId(null);
      }
    };
    restoreSession();
    return () => { active = false; };
  }, [viewMode]);
  // Game mode: selectable chat members (default all 5)
  // Mode-based selectable chat members
  const allGameRoles = ['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'] as const;
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const rolesStorageKey = `chat_selected_roles_${viewMode}`;

  // Load selection from storage
  useEffect(() => {
    const saved = window.localStorage.getItem(rolesStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedRoles(parsed);
          return;
        }
      } catch (e) { }
    }
    // Default fallback
    if (viewMode === 'game') {
      setSelectedRoles([...allGameRoles]);
    } else {
      setSelectedRoles([...allMbtiRoles]);
    }
  }, [viewMode]);

  // Persist selection
  useEffect(() => {
    if (selectedRoles.length > 0) {
      window.localStorage.setItem(rolesStorageKey, JSON.stringify(selectedRoles));
    }
  }, [selectedRoles, rolesStorageKey]);

  // --- Ambient Sound Engine (Local & Robust) ---
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [ambientVolume, setAmbientVolume] = useState(0.4);

  const ambientSources: Record<string, string> = {
    'rain': '/audio/gentle-rain-07-437321.mp3',
    'meadow': '/audio/birds-forest-nature-445379.mp3',
    'fireplace': '/audio/firewood-burning-sound-179862.mp3',
  };

  useEffect(() => {
    const source = ambientSources[selectedBg.id];
    if (!ambientAudioRef.current) {
      ambientAudioRef.current = new Audio();
      ambientAudioRef.current.loop = true;
    }
    const audio = ambientAudioRef.current;

    if (source && isAmbientPlaying) {
      const fullPath = window.location.origin + source;
      if (audio.src !== fullPath) {
        audio.src = source;
        audio.load();
      }
      audio.volume = ambientVolume;
      audio.play().catch(() => {
        console.log("Audio waiting for interaction...");
      });
    } else {
      audio.pause();
      // Reset src if needed or just keep paused
    }

    return () => {
      if (ambientAudioRef.current) ambientAudioRef.current.pause();
    };
  }, [selectedBg.id, isAmbientPlaying, ambientVolume]);

  // Handle browser auto-play policy
  useEffect(() => {
    const unlock = () => {
      if (isAmbientPlaying && ambientAudioRef.current && ambientAudioRef.current.paused) {
        const source = ambientSources[selectedBg.id];
        if (source) {
          ambientAudioRef.current.play().catch(() => { });
        }
      }
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, [isAmbientPlaying, selectedBg.id]);
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
  type SavedPersona = UserPersona & { id: string };
  const emptyPersona: UserPersona = { name: '', mbti: '', likes: '', schedule: '', work: '', redlines: '', extras: '' };

  const [savedPersonas, setSavedPersonas] = useState<SavedPersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('default');
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
  const savedPersonasKey = 'chat_saved_personas_v2';

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(savedPersonasKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { personas: SavedPersona[], selectedId: string };
        setSavedPersonas(parsed.personas || []);
        setSelectedPersonaId(parsed.selectedId || 'default');
        const active = parsed.personas.find(p => p.id === parsed.selectedId) || parsed.personas[0];
        if (active) setUserPersona(active);
        return;
      }

      // Migration from single persona
      const single = window.localStorage.getItem(userProfileStorageKey);
      if (single) {
        const parsed = JSON.parse(single) as UserPersona;
        const initialPersona = { ...parsed, id: 'default' };
        setSavedPersonas([initialPersona]);
        setSelectedPersonaId('default');
        setUserPersona(parsed);
        window.localStorage.setItem(savedPersonasKey, JSON.stringify({ personas: [initialPersona], selectedId: 'default' }));
      } else {
        const initialPersona = { ...emptyPersona, name: '默认人设', id: 'default' };
        setSavedPersonas([initialPersona]);
        setSelectedPersonaId('default');
        setUserPersona(initialPersona);
      }
    } catch { }
  }, []);

  const persistSavedPersonas = (personas: SavedPersona[], selectedId: string) => {
    try {
      window.localStorage.setItem(savedPersonasKey, JSON.stringify({ personas, selectedId }));
    } catch { }
  };

  const handleCreatePersona = () => {
    const newId = Date.now().toString();
    const newPersona: SavedPersona = { ...emptyPersona, name: `新的人设 ${savedPersonas.length + 1}`, id: newId };
    const nextSaved = [...savedPersonas, newPersona];
    setSavedPersonas(nextSaved);
    setSelectedPersonaId(newId);
    setUserPersona(newPersona);
    persistSavedPersonas(nextSaved, newId);
  };

  const handleDeletePersona = (id: string) => {
    if (savedPersonas.length <= 1) return;
    const nextSaved = savedPersonas.filter(p => p.id !== id);
    setSavedPersonas(nextSaved);
    if (selectedPersonaId === id) {
      const fallback = nextSaved[0];
      setSelectedPersonaId(fallback.id);
      setUserPersona(fallback);
      persistSavedPersonas(nextSaved, fallback.id);
    } else {
      persistSavedPersonas(nextSaved, selectedPersonaId);
    }
  };

  const handleSelectPersona = (id: string) => {
    const active = savedPersonas.find(p => p.id === id);
    if (active) {
      setSelectedPersonaId(id);
      setUserPersona(active);
      persistSavedPersonas(savedPersonas, id);
    }
  };

  const updateActivePersona = (next: UserPersona) => {
    setUserPersona(next);
    const nextSaved = savedPersonas.map(p => p.id === selectedPersonaId ? { ...next, id: p.id } : p);
    setSavedPersonas(nextSaved);
    persistSavedPersonas(nextSaved, selectedPersonaId);
  };
  const gameRequestHeaders = {
    'x-view-mode': 'game',
    'x-selected-roles': selectedRoles.join(','),
    'x-user-profile': encodeURIComponent(userProfile || ''),
  } as const;
  const mbtiRequestHeaders = {
    'x-view-mode': 'mbti',
    'x-selected-roles': selectedRoles.join(','),
    'x-user-profile': encodeURIComponent(userProfile || ''),
  } as const;
  const gameApi = `/api/chat?viewMode=game&selectedRoles=${encodeURIComponent(selectedRoles.join(','))}&userProfile=${encodeURIComponent(userProfile || '')}`;
  const mbtiApi = `/api/chat?viewMode=mbti&selectedRoles=${encodeURIComponent(selectedRoles.join(','))}&userProfile=${encodeURIComponent(userProfile || '')}`;
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
  const [theme, setTheme] = useState<keyof typeof themes>('amber');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ id: string; file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Legacy theme mapping fix
  const activeTheme = selectedTheme;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ttsVoice, setTtsVoice] = useState<'female' | 'male' | 'shenxinghui' | 'qinche' | 'qiyu' | 'lishen' | 'xiayizhou' | 'ENTJ' | 'ISTJ' | 'ENFP' | 'INFP' | 'ENFJ'>(viewMode === 'game' ? 'male' : 'female');
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('text');
  // Conversation storage
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationPromiseRef = useRef<Promise<string | null> | null>(null);
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
    let isCurrentSpeakerAllowed = false;

    const allGameRolesPattern = ['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'].join('|');
    const speakerRegex = new RegExp(`^\\s*(${allGameRolesPattern})：`);

    for (const line of lines) {
      const m = line.match(speakerRegex);
      if (m) {
        const speaker = m[1];
        if (allowedSet.has(speaker)) {
          isCurrentSpeakerAllowed = true;
          out.push(line);
        } else {
          isCurrentSpeakerAllowed = false;
        }
      } else if (isCurrentSpeakerAllowed) {
        out.push(line);
      }
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

  const getMessageImages = (message: any) => {
    let images: string[] = [];
    if (Array.isArray(message.content)) {
      images = message.content.filter((p: any) => p.type === 'image' || p.image).map((p: any) => p.image || p.data);
    } else if (message.parts && Array.isArray(message.parts)) {
      images = message.parts.filter((p: any) => p.type === 'image' || p.image).map((p: any) => p.image || p.data);
    }
    const atts = message.experimental_attachments || message.attachments;
    if (Array.isArray(atts)) {
      const attImages = atts.filter((a: any) => a.contentType?.startsWith('image/') || a.url?.startsWith('data:image/')).map((a: any) => a.url);
      images = [...images, ...attImages];
    }
    return images.filter(Boolean);
  };

  // parseMbtiGroupReply removed, now imported from @/utils/mbtiUtils.ts


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

    // 关键修正：防止切换模式时朗读历史消息
    // 如果当前并未处于加载状态，且该消息 ID 没有被“正在流式处理”的 Ref 跟踪过，
    // 说明它是一条历史消息（或者是在 Text 模式下生成完的），此时不应触发朗读。
    if (!isLoading && currentStreamingMessageRef.current !== lastMessage.id) {
      return;
    }

    // 如果是新消息（必须是在 loading 状态下遇到新 ID），重置累积文本
    if (lastMessage.id !== currentStreamingMessageRef.current) {
      // 只有在 isLoading 为 true 时才允许初始化新消息的 TTS 状态
      // 这样能确保我们只朗读“正在生成”的消息，而不是切模式时看到的旧消息
      if (isLoading) {
        currentStreamingMessageRef.current = lastMessage.id;
        accumulatedTextRef.current = '';
        audioQueueRef.current = [];
        processedSentencesRef.current.clear();
        ttsProcessedRef.current = false;
      } else {
        return;
      }
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
  const ensureConversation = async (initialTitle?: string) => {
    if (conversationId) return conversationId;
    if (conversationPromiseRef.current) return conversationPromiseRef.current;

    const createOrFind = async (): Promise<string | null> => {
      if (!supabaseClient) return null;
      const client = supabaseClient;
      const { data: { user } } = await client.auth.getUser();
      if (!user) return null;

      // Reuse the latest conversation for this viewMode, regardless of when it was created
      /* 
         Change: Removed the 1-hour time limit. 
         Reason: User wants to continue the same historical session (e.g., "MBTI Team Chat") indefinitely 
                 unless explicitly cleared, rather than creating new fragments every hour.
      */
      const { data: found } = await client
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
        .eq('view_mode', viewMode)
        .order('created_at', { ascending: false })
        .limit(1);

      if (found && found.length > 0) {
        // If we found an existing conversation, reuse it!
        setConversationId(found[0].id);
        return found[0].id as string;
      }

      const cleanTitle = (initialTitle || '')
        .replace(/\[\[\[[\s\S]*?\]\]\]/g, '')
        .trim();

      const title = cleanTitle
        ? (cleanTitle.slice(0, 50) + (cleanTitle.length > 50 ? '...' : ''))
        : (viewMode === 'game' ? '恋与深空会话' : 'MBTI 团队会话');

      const { data: created, error } = await client
        .from('conversations')
        .insert({ user_id: user.id, title, view_mode: viewMode })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create conversation:', error);
        return null;
      }
      setConversationId(created.id);
      return created.id as string;
    };

    conversationPromiseRef.current = createOrFind();
    try {
      const res = await conversationPromiseRef.current;
      return res;
    } finally {
      conversationPromiseRef.current = null;
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', content: string): Promise<string | null> => {
    try {
      const convId = await ensureConversation(content);
      if (!convId || !supabaseClient) return null;
      const client = supabaseClient;

      // 1. Insert message
      const { data, error } = await client
        .from('messages')
        .insert({ conversation_id: convId, role, content })
        .select('id')
        .single();

      if (error) throw error;

      // 2. "Touch" the conversation to update its timestamp (if updated_at trigger exists)
      // Only update title if it's still the default generic title.
      try {
        const { data: currentConv } = await client
          .from('conversations')
          .select('title')
          .eq('id', convId)
          .single();

        const isGenericTitle = currentConv?.title?.includes('会话') || currentConv?.title === '新对话';

        if (isGenericTitle) {
          await client
            .from('conversations')
            .update({
              title: content.slice(0, 50) + (content.length > 50 ? '...' : '')
            })
            .eq('id', convId);
        }
      } catch (err) {
        console.warn('Failed to update title', err);
      }

      return data?.id ?? null;
    } catch (e) {
      console.error('saveMessage failed:', e);
      return null;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      // 1. Local state update
      setMessagesActive(prev => prev.filter(m => m.id !== messageId));

      // 2. Clear selected roles cache for this message if it's assistant
      setMessageSelectedRoles(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });

      // 3. Database deletion (best effort)
      if (supabaseClient) {
        const client = supabaseClient;
        await client.from('messages').delete().eq('id', messageId);
      }
    } catch (e) {
      console.warn('deleteMessage failed:', e);
    }
  };

  const clearChat = () => {
    setMessagesActive([]);
    setConversationId(null); // Reset conversation ID to start a new history entry next time
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
          const speakerVoiceMap: Record<string, string> = {
            '沈星回': 'shenxinghui',
            '秦彻': 'qinche',
            '祁煜': 'qiyu',
            '黎深': 'lishen',
            '夏以昼': 'xiayizhou',
          };
          voice = (speakerVoiceMap[speakerMatch[1]] || 'shenxinghui') as any;
          // 去掉角色前缀，只播报内容
          textToSpeak = sentence.replace(/^(沈星回|秦彻|祁煜|黎深|夏以昼)[：:]/, '');
        }
      }

      // MBTI 模式：检测角色前缀并切换声音
      if (viewMode === 'mbti') {
        const mbtiMatch = sentence.match(/^(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)[：:]/i);
        if (mbtiMatch) {
          voice = mbtiMatch[1].toUpperCase() as any;
          // 去掉角色前缀，只播报内容
          textToSpeak = sentence.replace(/^(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP)[：:]/i, '');
        }
      }

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

    // MBTI 模式：按角色前缀拆分播放
    if (viewMode === 'mbti') {
      const segmentRegex = /^(ENTJ|ISTJ|ENFP|INFP|ENFJ)[：:]([\s\S]*?)(?=^(?:ENTJ|ISTJ|ENFP|INFP|ENFJ)[：:]|$)/gm;
      const segments: { speaker: string; voice: string; text: string }[] = [];

      let match: RegExpExecArray | null;
      while ((match = segmentRegex.exec(text)) !== null) {
        const speaker = match[1];
        const content = match[2]?.trim();
        if (content) {
          segments.push({ speaker, voice: speaker as any, text: `${speaker}：${content}` });
        }
      }

      // 退化逻辑
      if (segments.length === 0) {
        segments.push({ speaker: '小组', voice: 'ENFJ', text });
      }

      setTtsError(null);
      setTtsLoadingId(messageId);

      try {
        for (const seg of segments) {
          const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: seg.text, voice: seg.voice }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '生成语音失败');
          const src = data.audioUrl as string;

          if (!audioRef.current) {
            audioRef.current = new Audio();
          } else {
            audioRef.current.pause();
          }
          audioRef.current.src = src;
          await new Promise<void>((resolve) => {
            if (!audioRef.current) return resolve();
            audioRef.current.onended = () => resolve();
            audioRef.current.play().catch(() => resolve());
          });
        }
        lastSpokenMessageIdRef.current = messageId;
      } catch (err: any) {
        console.error('MBTI TTS failed', err);
        setTtsError(err?.message || '生成语音失败');
      } finally {
        setTtsLoadingId(null);
      }
      return;
    }

    // Default兜底逻辑
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
      if (!audioRef.current) {
        audioRef.current = new Audio();
      } else {
        audioRef.current.pause();
      }
      audioRef.current.src = src;
      await audioRef.current.play();
      lastSpokenMessageIdRef.current = messageId;
    } catch (err: any) {
      console.error('TTS failed', err);
      setTtsError(err?.message || '生成语音失败');
    } finally {
      setTtsLoadingId(null);
    }
  };

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          }, 'image/jpeg', 0.7);
        };
      };
      reader.onerror = reject;
    });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && attachedFiles.length === 0) return;

    const content = inputValue;
    const filesSnapshot = [...attachedFiles];
    setInputValue(""); // Clear input immediately
    setAttachedFiles([]); // Clear attachments

    try {
      if (viewMode === 'game') {
        selectedRolesQueueRef.current.push(Array.isArray(selectedRoles) ? [...selectedRoles] : []);
      }
      const contentForModel = withMetaBlocks(content);

      let attachments: any[] = [];
      // Handle multimodal message if files are present
      if (filesSnapshot.length > 0) {
        attachments = await Promise.all(filesSnapshot.map(async (f) => {
          // Compress image before sending to avoid "Request Entity Too Large"
          let fileToProcess = f.file;
          try {
            if (f.file.type.startsWith('image/')) {
              const compressedBlob = await compressImage(f.file);
              fileToProcess = new File([compressedBlob], f.file.name, { type: 'image/jpeg' });
            }
          } catch (e) {
            console.warn('Image compression failed, using original', e);
          }

          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(fileToProcess);
            reader.onload = () => resolve(reader.result as string);
          });
          return {
            name: f.file.name,
            contentType: fileToProcess.type,
            url: base64,
          };
        }));

        await sendMessageActive({
          role: 'user',
          content: contentForModel,
          experimental_attachments: attachments as any
        } as any, {
          body: {
            viewMode,
            selectedRoles: selectedRoles.length > 0 ? selectedRoles : (viewMode === 'game' ? ['祁煜', '黎深', '沈星回', '夏以昼', '秦彻'] : ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ']),
            userProfile
          }
        });
      } else {
        await sendMessageActive({
          role: 'user',
          content: contentForModel
        } as any, {
          body: {
            viewMode,
            selectedRoles: selectedRoles.length > 0 ? selectedRoles : (viewMode === 'game' ? ['祁煜', '黎深', '沈星回', '夏以昼', '秦彻'] : ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ']),
            userProfile
          }
        });
      }

      // store user message (append image markdown if attachments exist)
      let contentToSave = stripRolesBlock(stripPersonaBlock(content));
      if (attachments.length > 0) {
        contentToSave += '\n\n' + attachments.map(a => `![image](${a.url})`).join('\n\n');
      }
      await saveMessage('user', contentToSave);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      preview: URL.createObjectURL(file)
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const newFile = {
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file)
          };
          setAttachedFiles(prev => [...prev, newFile]);
        }
      }
    }
  };

  const handleDownloadImage = async () => {
    if (selectedMessageIds.size === 0) {
      alert('请先选择要生成的聊天内容');
      return;
    }

    try {
      setIsExportingImage(true);
      // Wait for React to render the hidden capture area with the selected messages
      await new Promise(r => setTimeout(r, 800));

      if (!captureRef.current) {
        throw new Error('Capture area not found');
      }

      // Ensure all images inside are loaded
      const images = captureRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
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
        backgroundColor: isDarkBg ? '#0f172a' : '#ffffff',
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
    <div
      className={`relative flex h-[100dvh] w-full overflow-hidden font-sans ${themes[selectedTheme].text}`}
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* --- Sidebar Area (Desktop & Mobile) --- */}
      <aside
        className={`fixed inset-y-0 left-0 lg:relative flex flex-col border-r border-[var(--border-light)] z-[70] lg:z-30 transition-all duration-500 ease-in-out overflow-hidden 
          ${isMobileSidebarOpen ? 'w-[280px] translate-x-0 shadow-2xl' : 'w-0 -translate-x-full lg:translate-x-0'}
          ${isSidebarVisible ? 'lg:w-64' : 'lg:w-0 lg:border-r-0'}
        `}
        style={{ background: 'var(--bg-page)' }}
      >
        <div className="w-[280px] lg:w-[256px] flex flex-col h-full">
          {/* Top: Logo */}
          <div className="p-8">
            <Logo className="w-8 h-8 opacity-90" showText={true} accentColor={themes[selectedTheme].accent} />
          </div>

          {/* Mid: Creation Section */}
          {/* Mid: Creation Section */}
          <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar pt-2">
            <div className="pb-1">
              <button
                onClick={() => setIsChatSubMenuOpen(!isChatSubMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--bg-hover)] transition-colors group text-[var(--sidebar-text-primary)] mb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center rounded-md bg-[var(--accent-main)]/10 text-[var(--accent-main)]">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                  <span>创作路径</span>
                </div>
                {isChatSubMenuOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-40" /> : <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
              </button>
              <AnimatePresence>
                {isChatSubMenuOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-0.5 ml-1"
                  >
                    <Link
                      href="/mbti"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`relative flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all ml-7 ${pathname === '/mbti' ? 'text-[var(--sidebar-text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--sidebar-text-primary)]'}`}
                    >
                      {pathname === '/mbti' && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-3 rounded-full bg-[var(--accent-main)]" />}
                      <span>MBTI 创作型</span>
                    </Link>
                    <Link
                      href="/lysk"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`relative flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all ml-7 ${pathname === '/lysk' ? 'text-[var(--sidebar-text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--sidebar-text-primary)]'}`}
                    >
                      {pathname === '/lysk' && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-3 rounded-full bg-[var(--accent-main)]" />}
                      <span>恋与深空同人</span>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px bg-[var(--border-light)] my-3 mx-2 opacity-40" />

            <Link
              href="/blog"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/blog' ? 'text-[var(--sidebar-text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/blog' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--sidebar-text-secondary)] group-hover:text-[var(--sidebar-text-primary)]'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <span>博客广场</span>
            </Link>

            <Link
              href="/blog"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/my-blogs' ? 'text-[var(--sidebar-text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/my-blogs' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--sidebar-text-secondary)] group-hover:text-[var(--sidebar-text-primary)]'}`}>
                <PenTool className="w-3.5 h-3.5" />
              </div>
              <span>我的博客</span>
            </Link>

            <Link
              href="/history"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/history' ? 'text-[var(--sidebar-text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--sidebar-text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/history' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--sidebar-text-secondary)] group-hover:text-[var(--sidebar-text-primary)]'}`}>
                <History className="w-3.5 h-3.5" />
              </div>
              <span>聊天历史</span>
            </Link>
          </nav>

          {/* Bottom: Settings & Modes */}
          <div className="px-3 py-4 space-y-1 border-t border-[var(--border-light)] bg-[var(--bg-page)]/50">
            <button
              onClick={() => setIsAppearanceDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--sidebar-text-secondary)] group"
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-md bg-transparent text-[var(--sidebar-text-secondary)] group-hover:text-[var(--sidebar-text-primary)]">
                <Palette className="w-3.5 h-3.5" />
              </div>
              <span>视觉风格</span>
            </button>
            <div className="pt-3 mt-1 border-t border-[var(--border-light)]/50 px-1">
              <UserStatus isSidebar={true} />
            </div>
          </div>
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
        {selectedBg.id === 'rain' && <RainyBackground />}
        {selectedBg.id === 'meadow' && <MeadowBackground />}
        {selectedBg.id === 'fireplace' && <FireplaceBackground />}

        {/* Sidebar Toggle Button (Desktop) */}
        <div className="hidden lg:block absolute top-6 left-6 z-50">
          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="p-3 rounded-2xl bg-white/20 hover:bg-white/40 backdrop-blur-xl border border-white/30 shadow-xl transition-all group"
          >
            <Menu className={`w-5 h-5 text-[var(--text-primary)] transition-transform duration-500 ${isSidebarVisible ? 'rotate-90' : 'rotate-0'}`} />
          </button>
        </div>


        {(selectedBg.url || selectedBg.id === 'rain' || selectedBg.id === 'meadow') && (
          <div className={`absolute inset-0 ${['rain', 'meadow'].includes(selectedBg.id) ? 'backdrop-blur-none' : 'backdrop-blur-[8px]'} -z-10 pointer-events-none transition-all duration-1000 ${selectedBg.id === 'rain' ? 'bg-transparent' : 'bg-white/10'}`} />
        )}

        {/* Dynamic Theme Background fallback */}
        {!selectedBg.url && selectedBg.id === 'none' && (
          <div className={`${themes[selectedTheme].bg} absolute inset-0 -z-30 opacity-100`} />
        )}

        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)] bg-[var(--bg-panel)] z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Menu className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <Logo className="w-7 h-7 opacity-90" showText={true} accentColor={themes[selectedTheme].accent} />
          </div>
          <div className="flex items-center gap-2">
            <UserStatus />
            <button
              onClick={() => setIsAppearanceDrawerOpen(true)}
              className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Palette className="w-5 h-5 text-[var(--accent-main)]" />
            </button>
            <button
              onClick={() => setIsPersonaDrawerOpen(true)}
              className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </header>

        {(viewMode === 'game' || viewMode === 'mbti') && (
          <div className="px-4 py-2 border-b border-[var(--border-light)] bg-[var(--bg-panel)]/40 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex items-center justify-start gap-4 text-xs overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setIsPersonaDrawerOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity whitespace-nowrap flex-shrink-0"
              >
                <span className="text-[var(--text-tertiary)] text-sm">我的身份：</span>
                <span className={`font-bold ${userPersona.name ? 'text-[var(--accent-main)]' : 'text-[var(--text-tertiary)] opacity-70'} text-sm`}>
                  {userPersona.name || '未配置'}
                </span>
              </button>

              <div className="h-4 w-px bg-[var(--border-light)] flex-shrink-0" />

              <button
                onClick={() => setIsPersonaDrawerOpen(true)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
              >
                <span className="text-[var(--text-tertiary)] text-sm whitespace-nowrap">群聊成员：</span>
                {selectedRoles.length > 0 ? (
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    {selectedRoles.slice(0, 5).map((role, idx) => {
                      const baseColor = getRoleColor(role, viewMode);

                      return (
                        <div
                          key={role}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-sm whitespace-nowrap flex items-center gap-1.5 transition-colors flex-shrink-0"
                          style={{
                            backgroundColor: `${baseColor}15`,
                            borderColor: `${baseColor}30`,
                            color: baseColor
                          }}
                        >
                          {viewMode === 'game' && getRoleAvatar(role, viewMode) ? (
                            <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 border border-black/5">
                              <img src={getRoleAvatar(role, viewMode)!} alt={role} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <span className="text-[10px] leading-none opacity-90 scale-110">{getRoleEmoji(role, viewMode)}</span>
                          )}
                          <span>{viewMode === 'game' ? getRoleLabel(role, viewMode) : role}</span>
                        </div>
                      );
                    })}
                    {selectedRoles.length > 5 && (
                      <div className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 border border-slate-200 flex-shrink-0">
                        +{selectedRoles.length - 5}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[var(--text-tertiary)] opacity-70 text-sm">未选择</span>
                )}
                <Settings className="w-4 h-4 text-[var(--accent-main)] ml-1 flex-shrink-0" />
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

            {messages
              .filter((m, index, self) => index === self.findIndex((t) => t.id === m.id))
              .map((m: any) => {
                const content = getMessageContent(m);
                const images = getMessageImages(m);
                const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content, viewMode) : null;
                const hasRoles = parsed && parsed.roles.length > 0;

                if (m.role !== 'assistant' || !hasRoles) {
                  return (
                    <div key={m.id} className="flex gap-2 items-start">
                      {isSelectionMode && (
                        <button
                          onClick={() => {
                            const next = new Set(selectedMessageIds);
                            if (next.has(m.id)) next.delete(m.id);
                            else next.add(m.id);
                            setSelectedMessageIds(next);
                          }}
                          className={`mt-3 flex-shrink-0 transition-all ${selectedMessageIds.has(m.id) ? 'text-[var(--accent-main)]' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                          {selectedMessageIds.has(m.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <div className={`flex-1 flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 sm:mt-2 shadow-lg backdrop-blur-xl border border-white/30`} style={{ backgroundColor: m.role === 'user' ? themes[selectedTheme].accent : 'rgba(255,255,255,0.6)', color: m.role === 'user' ? 'white' : themes[selectedTheme].accent }}>
                          {m.role === 'user' ? (
                            <div className="text-[10px] font-black uppercase">You</div>
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>
                        <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[90%] md:max-w-[85%]`}>
                          {m.role === 'user' && userPersona.name && (
                            <span className="text-[10px] text-slate-400 font-bold mb-1 px-1">
                              {userPersona.name}
                            </span>
                          )}
                          <div className={`p-3 md:p-4 relative group ${m.role === 'user' ? `${themes[selectedTheme].bubbleUser} rounded-2xl rounded-tr-sm` : `${themes[selectedTheme].bubbleBot} rounded-2xl rounded-tl-sm`}`}>
                            <div className={`${fontSize === 'xlarge' ? 'text-[20px]' : fontSize === 'large' ? 'text-[17px]' : 'text-[15px]'} prose prose-sm ${isDarkBg ? 'prose-invert' : ''} max-w-none leading-relaxed ${m.role === 'user' ? 'text-white drop-shadow-sm' : 'text-[var(--text-primary)]'}`}>
                              <ReactMarkdown>{content}</ReactMarkdown>
                              {images.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {images.map((img, idx) => (
                                    <div key={idx} className="relative group">
                                      <img
                                        src={img}
                                        alt="uploaded"
                                        className="max-w-[240px] max-h-[320px] rounded-xl border border-white/20 shadow-md object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Recall Button */}
                            <button
                              onClick={() => deleteMessage(m.id)}
                              className={`absolute -bottom-6 ${m.role === 'user' ? 'right-0' : 'left-0'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>撤回</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className="flex gap-2 items-start">
                    {isSelectionMode && (
                      <button
                        onClick={() => {
                          const next = new Set(selectedMessageIds);
                          if (next.has(m.id)) next.delete(m.id);
                          else next.add(m.id);
                          setSelectedMessageIds(next);
                        }}
                        className={`mt-3 flex-shrink-0 transition-all ${selectedMessageIds.has(m.id) ? 'text-[var(--accent-main)]' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {selectedMessageIds.has(m.id) ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <MbtiReply
                        parsed={parsed!}
                        messageId={m.id}
                        theme={selectedTheme}
                        viewMode={viewMode}
                        isDarkBg={isDarkBg}
                        accentColor={themes[selectedTheme].accent}
                        onDelete={deleteMessage}
                        fontSize={fontSize}
                        selectedGameRoles={messageSelectedRoles[String(m.id ?? '')] || selectedRoles}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* --- Input Console --- */}
        <section className={`p-2 md:p-4 border-t transition-all ${selectedBg.url ? 'bg-white/60 backdrop-blur-xl border-white/20' : 'bg-white border-slate-100'}`}>
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
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${themes[selectedTheme].accent}33`, color: themes[selectedTheme].accent } as any}
                    >
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
                      className="px-4 py-2 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                      style={{ backgroundColor: themes[selectedTheme].accent } as any}
                    >
                      <Globe className="w-4 h-4" /> 立即发布
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Input Form */}
            <div className="flex flex-col gap-3">
              {isRecording && (
                <div className="h-16 bg-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                  <button onClick={stopRecording} className="absolute right-4 p-2 bg-red-500/20 text-red-500 rounded-full">
                    <StopCircle className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setInteractionMode(m => m === 'voice' ? 'text' : 'voice')}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center gap-2`}
                  style={{
                    backgroundColor: interactionMode === 'voice' ? `${themes[selectedTheme].accent}15` : 'rgba(255,255,255,0.8)',
                    color: interactionMode === 'voice' ? themes[selectedTheme].accent : '#64748b',
                    borderColor: interactionMode === 'voice' ? `${themes[selectedTheme].accent}33` : '#e2e8f0'
                  } as any}
                >
                  {interactionMode === 'voice' ? <Mic className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                  {interactionMode === 'voice' ? '语音回复模式' : '文字回复模式'}
                </button>
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <div className={`flex-1 rounded-2xl flex items-center px-3 md:px-4 transition-all focus-within:ring-2 ${themes[selectedTheme].inputBg}`} style={{ '--tw-ring-color': `${themes[selectedTheme].accent}33` } as any}>
                  <div className="flex flex-col flex-1">
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 py-3 border-b border-white/10">
                        {attachedFiles.map((file) => (
                          <div key={file.id} className="relative group w-16 h-16">
                            <img
                              src={file.preview}
                              alt="preview"
                              className="w-full h-full object-cover rounded-xl border border-white/20 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      rows={1}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e as any);
                        }
                      }}
                      placeholder={isRecording ? "正在倾听..." : (interactionMode === 'voice' ? "正在语音聊天模式..." : "正在文字聊天模式...")}
                      className="flex-1 bg-transparent border-none outline-none py-4 max-h-48 resize-none text-[15px] font-medium placeholder-slate-400"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Hidden Native Inputs */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />

                    {/* Combined Image/Camera Menu */}
                    <div className="relative">
                      <AnimatePresence>
                        {isImageMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={() => setIsImageMenuOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 10 }}
                              className="absolute bottom-full mb-3 left-0 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-xl rounded-xl p-1.5 flex flex-col gap-1 min-w-[100px] z-40"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  cameraInputRef.current?.click();
                                  setIsImageMenuOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-100/80 text-slate-700 text-xs font-bold transition-colors whitespace-nowrap"
                              >
                                <Camera className="w-4 h-4 text-[var(--accent-main)]" /> 拍照
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  fileInputRef.current?.click();
                                  setIsImageMenuOpen(false);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-100/80 text-slate-700 text-xs font-bold transition-colors whitespace-nowrap"
                              >
                                <ImageIcon className="w-4 h-4 text-[var(--accent-main)]" /> 相册
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                      <button
                        type="button"
                        onClick={() => setIsImageMenuOpen(!isImageMenuOpen)}
                        className={`p-2 rounded-xl transition-all ${isImageMenuOpen ? 'text-[var(--accent-main)] bg-[var(--bg-hover)]' : 'text-slate-400 hover:text-[var(--accent-main)] hover:bg-[var(--bg-hover)]'}`}
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`p-2 rounded-xl transition-all ${isRecording ? "text-red-500 bg-red-50" : "text-slate-400"}`}
                      style={!isRecording ? { '--tw-bg-opacity': '1' } as any : {}}
                    >
                      <Mic
                        className="w-5 h-5 transition-colors"
                        style={{ color: isRecording ? '#ef4444' : (interactionMode === 'voice' ? themes[selectedTheme].accent : undefined) }}
                      />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputValue && !isRecording}
                  className={`p-3 md:p-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${themes[selectedTheme].button}`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

              {/* Input Tools */}
              <div className="flex items-center gap-4 px-2">
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/50 border border-slate-200/50">
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`p-1 rounded transition-colors ${isSelectionMode ? 'text-[var(--accent-main)] bg-white shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                    title="选择消息生成"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                  {isSelectionMode && (
                    <button
                      onClick={handleDownloadImage}
                      disabled={isExportingImage || selectedMessageIds.size === 0}
                      className="p-1 rounded text-[var(--accent-main)] hover:bg-white/50 transition-colors disabled:opacity-50"
                      title="生成图片并下载"
                    >
                      {isExportingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <div className="w-px h-3 bg-slate-200 mx-0.5" />
                  <Palette className="w-3 h-3 text-slate-400 ml-1" />
                  <select
                    value={blogStyle}
                    onChange={(e) => setBlogStyle(e.target.value as any)}
                    className="bg-transparent text-[11px] font-bold text-slate-500 outline-none border-none py-0.5 pl-1 pr-6 cursor-pointer appearance-none"
                    style={{ backgroundImage: 'none' }}
                  >
                    <option value="literary">文艺风格</option>
                    <option value="logical">逻辑严密</option>
                    <option value="record">对话实录</option>
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400 -ml-5 pointer-events-none" />
                </div>
                <button
                  onClick={async () => {
                    if (!hasMessages) return;
                    try {
                      setBlogLoading(true);
                      const targetMessages = (isSelectionMode && selectedMessageIds.size > 0)
                        ? messages.filter((m: any) => selectedMessageIds.has(m.id))
                        : messages;

                      // 1. Pre-process messages to strip large images client-side
                      const { cleanedMessages, imageMap } = prepareMessagesForBlog(targetMessages);

                      const globalNick = typeof window !== 'undefined' ? localStorage.getItem('user_global_nickname') : '';
                      const authorName = globalNick || userPersona.name || '笔者';

                      const res = await fetch('/api/blog', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          messages: cleanedMessages, // Send cleaned messages
                          style: blogStyle,
                          authorName
                        }),
                      });

                      if (!res.ok) {
                        const errData = await res.json();
                        throw new Error(errData.error || 'Failed to generate blog');
                      }

                      const data = await res.json();

                      // 2. Restore images client-side
                      const restoredMarkdown = restoreBlogImages(data.markdown, imageMap);

                      setBlogDraft({
                        title: data.title,
                        markdown: restoredMarkdown
                      });
                      setIsBlogDraftVisible(true);
                    } catch (e) {
                      alert('生成博客失败，请重试');
                    } finally {
                      setBlogLoading(false);
                    }
                  }}
                  disabled={!hasMessages || blogLoading}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--accent-main)] brightness-75 hover:opacity-80 transition-opacity disabled:opacity-30"
                >
                  {blogLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  <span>生成博客</span>
                </button>
                <button
                  onClick={() => hasMessages && clearChat()}
                  disabled={!hasMessages}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[var(--accent-main)] brightness-75 hover:text-red-500 transition-colors disabled:opacity-30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清除对话</span>
                </button>
              </div>
            </div>
          </div>
        </section>


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
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-white/95 backdrop-blur-2xl shadow-2xl z-[101] border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-[var(--accent-main)]" />
                  <h3 className="text-lg font-black text-slate-800">群聊人物</h3>
                </div>
                <button onClick={() => setIsPersonaDrawerOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Character Selection UI */}
                {(viewMode === 'game' || viewMode === 'mbti') && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">群聊成员 (最多5人)</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRoles([])}
                          className="text-[10px] font-bold text-red-400 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors"
                        >
                          清空
                        </button>
                        <span className="text-[10px] font-bold text-[var(--accent-main)] bg-[var(--accent-main)]/10 px-2 py-0.5 rounded-full">已选 {selectedRoles.length}</span>
                      </div>
                    </div>

                    {viewMode === 'mbti' ? (
                      <div className="space-y-6 text-left">
                        {mbtiGroups.map(group => (
                          <div key={group.name} className="space-y-2">
                            <div className="flex items-center gap-2 px-1">
                              <div className="w-1 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {group.roles.map(r => (
                                <button
                                  key={r}
                                  onClick={() => {
                                    setSelectedRoles(prev =>
                                      prev.includes(r)
                                        ? prev.filter(x => x !== r)
                                        : [...prev, r].slice(0, 5)
                                    );
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${selectedRoles.includes(r)
                                    ? 'bg-white border-[var(--accent-main)] text-[var(--accent-main)] shadow-sm'
                                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                  <div className={`w-1.5 h-1.5 rounded-full ${selectedRoles.includes(r) ? 'bg-[var(--accent-main)]' : 'bg-slate-300'}`} />
                                  <span className="truncate">{r}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {allGameRoles.map(r => (
                          <button
                            key={r}
                            onClick={() => {
                              setSelectedRoles(prev =>
                                prev.includes(r)
                                  ? prev.filter(x => x !== r)
                                  : [...prev, r].slice(0, 5)
                              );
                            }}
                            className={`flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-bold border transition-all ${selectedRoles.includes(r)
                              ? 'bg-white border-[var(--accent-main)] text-[var(--accent-main)] shadow-sm'
                              : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                              }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${selectedRoles.includes(r) ? 'bg-[var(--accent-main)]' : 'bg-slate-300'}`} />
                            <span className="truncate">{getRoleLabel(r, viewMode)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Persona Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">已存人设</label>
                    <button
                      onClick={handleCreatePersona}
                      className="text-[10px] font-bold text-[var(--accent-main)] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> 新建人设
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {savedPersonas.map(p => (
                      <div key={p.id} className="group relative">
                        <button
                          onClick={() => handleSelectPersona(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedPersonaId === p.id
                            ? 'bg-[var(--accent-main)] text-white border-[var(--accent-main)] shadow-sm'
                            : 'bg-[var(--bg-panel)] text-[var(--text-secondary)] border-[var(--border-light)] hover:border-[var(--accent-main)]'
                            }`}
                        >
                          {p.name || '未命名'}
                        </button>
                        {savedPersonas.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePersona(p.id); }}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-800 text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform hover:bg-red-500"
                          >
                            <Plus className="w-2.5 h-2.5 rotate-45" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-[#737373]">人设名</label>
                    <input
                      value={userPersona.name}
                      onChange={(e) => updateActivePersona({ ...userPersona, name: e.target.value })}
                      placeholder="你的创作者昵称"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[var(--accent-main)]/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">MBTI</label>
                      <input
                        value={userPersona.mbti}
                        onChange={(e) => updateActivePersona({ ...userPersona, mbti: e.target.value })}
                        placeholder="e.g. INFP"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">作息</label>
                      <input
                        value={userPersona.schedule}
                        onChange={(e) => updateActivePersona({ ...userPersona, schedule: e.target.value })}
                        placeholder="e.g. 熬夜党"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">偏好/喜欢</label>
                    <input
                      value={userPersona.likes}
                      onChange={(e) => updateActivePersona({ ...userPersona, likes: e.target.value })}
                      placeholder="e.g. 抹茶、摄影"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">雷点/禁忌</label>
                    <input
                      value={userPersona.redlines}
                      onChange={(e) => updateActivePersona({ ...userPersona, redlines: e.target.value })}
                      placeholder="避免提到的内容"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">补充描述</label>
                    <textarea
                      value={userPersona.extras}
                      onChange={(e) => updateActivePersona({ ...userPersona, extras: e.target.value })}
                      rows={4}
                      placeholder="想让 AI 记住的其他细节..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none"
                    />
                  </div>
                </div>


              </div>

              <div className="p-6 border-t border-slate-100 space-y-4 bg-white">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>人设将持续保存并应用于所有对话</span>
                  <button onClick={() => updateActivePersona(emptyPersona)} className="hover:text-red-400 font-bold transition-colors">重置当前</button>
                </div>
                <button
                  onClick={() => setIsPersonaDrawerOpen(false)}
                  className="w-full py-4 bg-[var(--accent-main)] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 shadow-lg shadow-[var(--accent-main)]/20 transition-all"
                >
                  确认并关闭
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
              className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[var(--bg-page)] shadow-2xl z-[101] border-l border-[var(--border-light)] flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border-light)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Palette className="w-6 h-6 text-[var(--accent-main)]" />
                  <h3 className="text-lg font-black text-[var(--text-primary)]">视觉风格</h3>
                </div>
                <button onClick={() => setIsAppearanceDrawerOpen(false)} className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">配色方案</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(themes).map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedTheme(key as keyof typeof themes)}
                        className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedTheme === key ? 'border-[var(--accent-main)] bg-[var(--bg-hover)]' : 'border-[var(--border-light)] hover:border-[var(--accent-main)]/30'}`}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-inner"
                          style={{ backgroundColor: value.accent }}
                        />
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{value.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Selection */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">聊天背景</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {chatBackgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg)}
                        className={`group relative h-24 rounded-2xl border-2 overflow-hidden transition-all ${selectedBg.id === bg.id ? 'border-[var(--accent-main)]' : 'border-[var(--border-light)] hover:border-[var(--accent-main)]/30'}`}
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

                {/* Ambient Sound Section */}
                <div className="space-y-4 pt-4 border-t border-[var(--border-light)]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">背景白噪音</h4>
                      <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">沉浸式聆听雨声或微风</p>
                    </div>
                    <button
                      onClick={() => setIsAmbientPlaying(!isAmbientPlaying)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isAmbientPlaying ? 'bg-[var(--accent-main)]' : 'bg-[var(--border-light)]'}`}
                    >
                      <motion.div
                        animate={{ x: isAmbientPlaying ? 26 : 2 }}
                        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  {isAmbientPlaying && (
                    <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl">
                      <Volume2 className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={ambientVolume}
                        onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-500 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Font Size Selection */}
                <div className="space-y-4 pt-4 border-t border-[var(--border-light)]">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-tertiary)]">字体大小</h4>
                  <div className="flex gap-2">
                    {[
                      { id: 'standard', name: '标准', size: 'text-xs' },
                      { id: 'large', name: '大', size: 'text-sm' },
                      { id: 'xlarge', name: '更大', size: 'text-base' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontSize(f.id as any)}
                        className={`flex-1 py-3 rounded-2xl border-2 font-bold transition-all ${fontSize === f.id ? 'border-[var(--accent-main)] bg-[var(--bg-hover)] text-[var(--accent-main)]' : 'border-[var(--border-light)] text-[var(--text-tertiary)] hover:border-[var(--accent-main)]/30'}`}
                      >
                        <span className={f.size}>{f.name}</span>
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

      {/* Hidden Capture Area for Image Export */}
      {
        isMounted && (
          <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
            <div
              ref={captureRef}
              className={`p-10 w-[600px] flex flex-col gap-6 ${isDarkBg ? 'bg-[#0f172a]' : 'bg-white'}`}
              style={{
                backgroundColor: isDarkBg ? '#0f172a' : (themes[selectedTheme].bg.match(/\[(.*?)\]/)?.[1] || '#ffffff'),
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: themes[selectedTheme].accent }} />
                  </div>
                  <div>
                    <div className="text-sm font-black tracking-tight" style={{ color: isDarkBg ? '#ffffff' : '#1f2937' }}>
                      智聊室 · Chat Blog
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDarkBg ? '#cbd5e1' : '#64748b', opacity: 0.6 }}>
                      Creative Co-Creation
                    </div>
                  </div>
                </div>
                <div className="text-[10px] font-mono" style={{ color: isDarkBg ? '#ffffff' : '#000000', opacity: 0.4 }}>
                  {isMounted ? new Date().toLocaleDateString() : ''}
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-8">
                {messages
                  .filter((m: any) => selectedMessageIds.has(m.id))
                  .map((m: any) => {
                    const content = getMessageContent(m);
                    const images = getMessageImages(m);
                    const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content, viewMode) : null;
                    const hasRoles = parsed && parsed.roles.length > 0;

                    if (m.role !== 'assistant' || !hasRoles) {
                      return (
                        <div key={`export-${m.id}`} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                            style={{
                              backgroundColor: m.role === 'user' ? themes[selectedTheme].accent : '#ffffff',
                              color: m.role === 'user' ? '#ffffff' : themes[selectedTheme].accent,
                              border: '1px solid rgba(255,255,255,0.3)',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          >
                            {m.role === 'user' ? (
                              <div className="text-[9px] font-black uppercase" style={{ color: '#ffffff' }}>You</div>
                            ) : (
                              <Sparkles className="w-4 h-4" style={{ color: themes[selectedTheme].accent }} />
                            )}
                          </div>
                          <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                            <div
                              className={`p-4 rounded-2xl ${m.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                              style={{
                                backgroundColor: m.role === 'user' ? themes[selectedTheme].accent : '#ffffff',
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
                                      <img key={idx} src={img} alt="" className="max-w-full rounded-xl shadow-sm" style={{ border: '1px solid rgba(255,255,255,0.2)' }} />
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
                          theme={selectedTheme}
                          viewMode={viewMode}
                          isDarkBg={isDarkBg}
                          accentColor={themes[selectedTheme].accent}
                          forceShowAll={true}
                          selectedGameRoles={messageSelectedRoles[String(m.id ?? '')] || selectedRoles}
                        />
                      </div>
                    );
                  })}
              </div>

              {/* Footer */}
              <div
                className="mt-8 pt-6 flex justify-between items-center"
                style={{ borderTop: `1px solid ${isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`, opacity: 0.4 }}
              >
                <div className="text-[9px] font-bold tracking-widest uppercase" style={{ color: isDarkBg ? '#ffffff' : '#000000' }}>
                  Shared from Chat Blog App
                </div>
                <div className="text-[9px] font-mono" style={{ color: isDarkBg ? '#ffffff' : '#000000' }}>
                  {isMounted ? new Date().toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
