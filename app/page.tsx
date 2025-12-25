"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, MessageSquare, Heart, ArrowRight, ChevronDown, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

export default function Home() {
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  useEffect(() => {
    // Force set the "Amber" (Orange) theme variables for the landing page
    const root = document.documentElement;
    root.style.setProperty('--bg-page', '#FFFBEB');
    root.style.setProperty('--bg-panel', '#FFFBEB');
    root.style.setProperty('--accent-main', '#F59E0B');
    root.style.setProperty('--text-primary', '#0f172a');
    root.style.setProperty('--text-secondary', '#475569');
    root.style.setProperty('--text-tertiary', '#94a3b8');
    root.style.setProperty('--bg-hover', '#FEF3C7'); // Amber-100ish
    root.style.setProperty('--border-light', '#FDE68A'); // Amber-200ish
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-orange-300 text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-16 z-50 bg-white/40 backdrop-blur-md border-b border-[var(--border-light)]">
        <div className="flex items-center gap-10">
          <Logo className="w-9 h-9" showText={true} accentColor="#F59E0B" />

          <div className="hidden md:flex items-center gap-8">
            <div
              className="relative"
              onMouseEnter={() => setIsChatDropdownOpen(true)}
              onMouseLeave={() => setIsChatDropdownOpen(false)}
            >
              <button className="flex items-center gap-1 text-[14px] font-semibold text-slate-700 hover:text-slate-900 transition-colors py-8">
                群聊 <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isChatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isChatDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-64 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <div className="space-y-2">
                      <Link href="/mbti" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">MBTI 创作实验室</p>
                          <p className="text-[10px] text-slate-500">五位性格专家深度对谈</p>
                        </div>
                      </Link>
                      <Link href="/lysk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">极夜编辑器</p>
                          <p className="text-[10px] text-slate-500">捕捉动人的细腻瞬间</p>
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
              <button className="flex items-center gap-1 text-[14px] font-semibold text-slate-700 hover:text-slate-900 transition-colors py-8">
                社区 <ChevronDown className={`w-3.5 h-3.5 opacity-50 transition-transform ${isCommunityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isCommunityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 w-64 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50"
                  >
                    <div className="space-y-2">
                      <Link href="/blog" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">我的作品</p>
                          <p className="text-[10px] text-slate-500">查看您创作的所有博文</p>
                        </div>
                      </Link>
                      <Link href="/blog" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-800">创作广场</p>
                          <p className="text-[10px] text-slate-500">探索更多精彩对话内容</p>
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
          <UserStatus />
        </div>
      </nav>

      <div className="max-w-6xl w-full relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-24"
        >
          <div className="flex justify-center mb-8">
            <div className="p-1 px-4 bg-[var(--bg-hover)] border border-[var(--border-light)] rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent-main)]">
              Elegance in Dialogue
            </div>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            <span className="text-[#2563EB]">
              Chat2<span className="text-[var(--accent-main)]">Blog</span>
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
            将瞬时的灵感，通过充满张力的对话，沉淀为字里行间的永恒。
          </p>
        </motion.div>

        {/* Content removed to move items to dropdown */}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center text-[var(--text-tertiary)] mt-24 py-12 border-t border-[var(--border-light)]"
        >
          <div className="flex items-center justify-center gap-12 font-bold uppercase tracking-[0.2em] text-[10px]">
            <span>Inspiration Rooted</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-light)]" />
            <span>AI Collaborated</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--border-light)]" />
            <span>Human Refined</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
