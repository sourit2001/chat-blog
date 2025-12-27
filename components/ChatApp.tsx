"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Mic, Send, Menu, Sparkles, StopCircle, Copy, Trash2, Check, FileText,
  Download, Volume2, Loader2, Globe, LayoutGrid, Users, History,
  Settings, ChevronDown, ChevronRight, MessageCircle, PenTool, Palette,
  UserCircle, Plus, VolumeX, Image as ImageIcon, X, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ReactMarkdown from "react-markdown";
import { supabaseClient } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";
import Link from 'next/link';
import { UserStatus } from '@/components/UserStatus';

type ParsedMbtiReply = {
  intro: string;
  roles: { role: string; text: string }[];
};

type ViewMode = 'mbti' | 'game';
type InteractionMode = 'text' | 'voice';

const allMbtiRoles = [
  "INTJ", "INTP", "ENTJ", "ENTP", // 紫人 (Analysts)
  "INFJ", "INFP", "ENFJ", "ENFP", // 绿人 (Diplomats)
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", // 蓝人 (Sentinels)
  "ISTP", "ISFP", "ESTP", "ESFP"  // 黄人 (Explorers)
] as const;

const mbtiGroups = [
  { name: '分析家', color: '#A855F7', roles: ["INTJ", "INTP", "ENTJ", "ENTP"] }, // 紫色
  { name: '外交官', color: '#22C55E', roles: ["INFJ", "INFP", "ENFJ", "ENFP"] }, // 绿色
  { name: '守护者', color: '#3B82F6', roles: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"] }, // 蓝色
  { name: '探险家', color: '#EAB308', roles: ["ISTP", "ISFP", "ESTP", "ESFP"] }  // 黄色
];

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
    pageBg: 'linear-gradient(135deg, #93c5fd 0%, #fdba74 100%)', // Blue-300 to Orange-300
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
    // 分析家
    case 'INTJ': return '♟️';
    case 'INTP': return '🧪';
    case 'ENTJ': return '🧠';
    case 'ENTP': return '🧨';
    // 外交官
    case 'INFJ': return '🔮';
    case 'INFP': return '🌿';
    case 'ENFJ': return '😊';
    case 'ENFP': return '🌟';
    // 守护者
    case 'ISTJ': return '📋';
    case 'ISFJ': return '🛡️';
    case 'ESTJ': return '📢';
    case 'ESFJ': return '🤝';
    // 探险家
    case 'ISTP': return '🛠️';
    case 'ISFP': return '🎨';
    case 'ESTP': return '⚡';
    case 'ESFP': return '🎉';
    default: return '💬';
  }
};

const getRoleLabel = (role: string, mode: ViewMode) => {
  if (mode === 'mbti') return role;

  // For game mode, we might get the MBTI code or the Chinese name
  const mapping: Record<string, string> = {
    'ENTJ': '祁煜',
    'ISTJ': '黎深',
    'ENFP': '沈星回',
    'INFP': '夏以昼',
    'ENFJ': '秦彻',
    '祁煜': '祁煜',
    '黎深': '黎深',
    '沈星回': '沈星回',
    '夏以昼': '夏以昼',
    '秦彻': '秦彻'
  };
  return mapping[role] || role;
};

const getRoleAvatar = (role: string, mode: ViewMode) => {
  if (mode === 'game') {
    switch (role) {
      case 'ENTJ': case '祁煜': return '/mbti/avatars/祁煜.jpg';
      case 'ISTJ': case '黎深': return '/mbti/avatars/黎深.jpg';
      case 'ENFP': case '沈星回': return '/mbti/avatars/沈星回.jpg';
      case 'INFP': case '夏以昼': return '/mbti/avatars/夏以昼.jpg';
      case 'ENFJ': case '秦彻': return '/mbti/avatars/秦彻.jpg';
      default: return null;
    }
  }
  return null;
};

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

const gameRoleColors: Record<string, string> = {
  '沈星回': '#c084fc', // 淡紫色
  '黎深': '#60a5fa',   // 蓝色
  '秦彻': '#f87171',   // 红色
  '祁煜': '#f472b6',   // 粉色
  '夏以昼': '#fb923c', // 橙色
};

const getRoleColor = (role: string, mode: ViewMode) => {
  // 优先匹配游戏角色名，防止 viewMode 状态不一致导致颜色丢失
  if (gameRoleColors[role]) {
    return gameRoleColors[role];
  }

  if (mode === 'game') {
    return gameRoleColors[role] || '#94a3b8';
  }
  const group = mbtiGroups.find(g => g.roles.includes(role as any));
  return group?.color || '#94a3b8';
};

function MbtiReply({ parsed, messageId, theme, viewMode, selectedGameRoles, onDelete }: { parsed: any; messageId: string; theme: keyof typeof themes; viewMode: ViewMode; selectedGameRoles?: string[]; onDelete?: (id: string) => void }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
  }, [messageId]);

  useEffect(() => {
    if (parsed.roles.length === 0) return;
    if (visibleCount >= parsed.roles.length) return;

    const interval = setInterval(() => {
      setVisibleCount((prev) => (prev >= parsed.roles.length ? prev : prev + 1));
    }, 600);
    return () => clearInterval(interval);
  }, [parsed.roles.length, visibleCount]);

  const visibleRoles = parsed.roles.slice(0, visibleCount || 1);
  const spokenRoles = new Set(parsed.roles.map((r: any) => r.role));

  const allowedSlots = (Array.isArray(selectedGameRoles) && selectedGameRoles.length > 0)
    ? selectedGameRoles
    : (viewMode === 'game' ? ['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'] : allMbtiRoles);

  const silentRoles = allowedSlots.filter((r: any) => {
    const roleId = (viewMode === 'game') ? r : r;
    return !spokenRoles.has(roleId);
  });

  return (
    <div className={`space-y-6 ${themes[theme].text}`}>
      {/* 1. Intro Bubble (AI System/Narration) */}
      {parsed.intro && (
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-white/40 backdrop-blur-md shadow-sm border border-white/50">
            <Sparkles className="w-5 h-5" style={{ color: themes[theme].accent }} />
          </div>
          <div className={`p-4 rounded-2xl max-w-[90%] ${themes[theme].cardBg} shadow-sm border border-black/5 rounded-tl-sm`}>
            <div className="text-sm prose prose-slate max-w-none leading-relaxed text-slate-700">
              <ReactMarkdown>{parsed.intro}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* 2. Individual Role Bubbles */}
      {visibleRoles.map((block: any, idx: number) => {
        const roleColor = getRoleColor(block.role, viewMode);
        return (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={`${messageId}-${block.role}-${idx}`}
            className="flex gap-3"
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-md overflow-hidden"
                style={{ border: `2px solid ${roleColor}` }}>
                {viewMode === 'game' && getRoleAvatar(block.role, viewMode) ? (
                  <img src={getRoleAvatar(block.role, viewMode)!} alt={block.role} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl drop-shadow-sm">{getRoleEmoji(block.role, viewMode)}</span>
                )}
              </div>
            </div>

            {/* Content Bubble */}
            <div className="flex-1 max-w-[85%] space-y-1">
              <div className="flex items-center gap-2 ml-1">
                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: roleColor }}>
                  {getRoleLabel(block.role, viewMode)}
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-200 to-transparent opacity-50" />
              </div>

              <div
                className={`p-4 rounded-2xl shadow-sm relative overflow-hidden backdrop-blur-sm transition-colors`}
                style={{
                  backgroundColor: `${roleColor}08`, // 还原为极淡背景 (~3%)
                  borderColor: `${roleColor}15`,     // 还原为淡边框
                  borderWidth: '1px'
                }}
              >
                {/* Accent line on the left inside the bubble */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: roleColor }} />
                <div className="text-[14.5px] prose prose-sm max-w-none leading-relaxed text-slate-800 font-medium">
                  <ReactMarkdown>{block.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* 3. Silent/Status Info (Compact) */}


      {/* 4. Outro/Summary Bubble */}
      {parsed.outro && visibleCount >= parsed.roles.length && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-end pr-4">
          <div className={`p-4 rounded-2xl bg-white/50 backdrop-blur-md border border-dashed border-slate-300 max-w-[80%] shadow-inner relative`}>
            <div className="absolute -top-2 left-4 px-2 bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">总结</div>
            <div className="text-sm italic text-slate-500 leading-relaxed">
              <ReactMarkdown>{parsed.outro}</ReactMarkdown>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recall Button */}
      {onDelete && (
        <div className="flex justify-start pl-14">
          <button onClick={() => onDelete(messageId)} className="flex items-center gap-1 text-[10px] font-bold text-slate-300 hover:text-red-400 transition-all opacity-50 hover:opacity-100">
            <Trash2 className="w-3 h-3" />
            <span>撤回此轮对话</span>
          </button>
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>('amber');
  const [selectedBg, setSelectedBg] = useState(chatBackgrounds[0]);
  const [isChatSubMenuOpen, setIsChatSubMenuOpen] = useState(true);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);

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

  const parseMbtiGroupReply = (content: string) => {
    const lines = content.split('\n');
    const roles = allMbtiRoles;
    type Role = (typeof roles)[number];

    let introLines: string[] = [];
    let outroLines: string[] = []; // 用于存放“小结”
    let currentRole: Role | null = null;
    let buffer: string[] = [];
    const roleBlocks: { role: Role; text: string }[] = [];

    const nameToSlot: Record<string, Role> = {
      '祁煜': 'ENTJ',
      '黎深': 'ISTJ',
      '沈星回': 'ENFP',
      '夏以昼': 'INFP',
      '秦彻': 'ENFJ',
    };
    // 支持 16 型人格和 5 位男主，且匹配小结/总结
    const roleRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(INTJ|INTP|ENTJ|ENTP|INFJ|INFP|ENFJ|ENFP|ISTJ|ISFJ|ESTJ|ESFJ|ISTP|ISFP|ESTP|ESFP|祁煜|黎深|沈星回|夏以昼|秦彻)[：:]/i;
    const summaryRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(小结|总结|总而言之)[：:]/i;

    for (const line of lines) {
      const match = line.match(roleRegex);
      const summaryMatch = line.match(summaryRegex);

      if (match) {
        if (currentRole) {
          roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
        } else if (buffer.length > 0) {
          introLines = buffer.slice();
        }
        const tag = match[1].toUpperCase();
        // 如果是 Game 模式，保留中文名不映射回 MBTI；否则尝试映射
        const mapped = viewMode === 'game' ? tag : ((nameToSlot as any)[tag] || tag);
        currentRole = mapped as Role;
        buffer = [line.replace(roleRegex, '').trim()];
      } else if (summaryMatch) {
        if (currentRole) {
          roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
          currentRole = null;
        }
        buffer = [line.replace(summaryRegex, '').trim()];
        outroLines = buffer; // 接下来的内容放入 outro
      } else {
        buffer.push(line);
      }
    }

    if (currentRole) {
      roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
    } else if (outroLines.length > 0) {
      // 已经在 outro 里了
    } else if (buffer.length > 0 && introLines.length === 0) {
      introLines = buffer.slice();
    }

    return { intro: introLines.join('\n').trim(), roles: roleBlocks, outro: outroLines.join('\n').trim() };
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

    // 默认兜底逻辑
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

      // Handle multimodal message if files are present
      if (filesSnapshot.length > 0) {
        const attachments = await Promise.all(filesSnapshot.map(async (f) => {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(f.file);
            reader.onload = () => resolve(reader.result as string);
          });
          return {
            name: f.file.name,
            contentType: f.file.type,
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

      // store user message (simplified for db, normally might need to store image URLs)
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
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg hover:bg-[var(--bg-hover)] transition-colors group text-[var(--text-primary)] mb-1"
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
                      className={`relative flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all ml-7 ${pathname === '/mbti' ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
                    >
                      {pathname === '/mbti' && <motion.div layoutId="sidebar-active" className="absolute left-0 w-1 h-3 rounded-full bg-[var(--accent-main)]" />}
                      <span>MBTI 创作型</span>
                    </Link>
                    <Link
                      href="/lysk"
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`relative flex items-center px-3 py-2 text-[13px] font-medium rounded-lg transition-all ml-7 ${pathname === '/lysk' ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}`}
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
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/blog' ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/blog' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <span>博客广场</span>
            </Link>

            <Link
              href="/blog"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/my-blogs' ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/my-blogs' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                <PenTool className="w-3.5 h-3.5" />
              </div>
              <span>我的博客</span>
            </Link>

            <Link
              href="/history"
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors group ${pathname === '/history' ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'}`}
            >
              <div className={`w-5 h-5 flex items-center justify-center rounded-md transition-colors ${pathname === '/history' ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)]' : 'bg-transparent text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                <History className="w-3.5 h-3.5" />
              </div>
              <span>聊天历史</span>
            </Link>
          </nav>

          {/* Bottom: Settings & Modes */}
          <div className="px-3 py-4 space-y-1 border-t border-[var(--border-light)] bg-[var(--bg-page)]/50">
            <button
              onClick={() => setIsAppearanceDrawerOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] group"
            >
              <div className="w-5 h-5 flex items-center justify-center rounded-md bg-transparent text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
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

        {/* Background Overlay for readability */}
        {(selectedBg.url || selectedBg.id === 'rain' || selectedBg.id === 'meadow') && (
          <div className={`absolute inset-0 ${['rain', 'meadow'].includes(selectedBg.id) ? 'backdrop-blur-none' : 'backdrop-blur-[8px]'} -z-10 pointer-events-none transition-all duration-1000 ${selectedBg.id === 'rain' ? 'bg-transparent' : 'bg-white/10'}`} />
        )}

        {/* Dynamic Theme Background fallback */}
        {!selectedBg.url && selectedBg.id === 'none' && (
          <div className={`${themes[selectedTheme].bg} absolute inset-0 -z-30 opacity-100`} />
        )}

        {/* Mobile Header */}
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
          <div className="flex items-center gap-3">
            <UserStatus />
            <button
              onClick={() => setIsPersonaDrawerOpen(true)}
              className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors"
            >
              <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </header>

        {/* Global Persona Bar (if active) */}
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
                const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content) : null;
                const hasRoles = parsed && parsed.roles.length > 0;

                if (m.role !== 'assistant' || !hasRoles) {
                  return (
                    <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
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
                          <div className={`text-[15px] prose prose-sm max-w-none leading-relaxed ${m.role === 'user' ? 'text-white drop-shadow-sm' : 'text-slate-800'}`}>
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
                  );
                }

                return (
                  <MbtiReply
                    key={m.id}
                    parsed={parsed!}
                    messageId={m.id}
                    theme={selectedTheme}
                    viewMode={viewMode}
                    onDelete={deleteMessage}
                    selectedGameRoles={messageSelectedRoles[String(m.id ?? '')] || selectedRoles}
                  />
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
    </div >
  );
}
