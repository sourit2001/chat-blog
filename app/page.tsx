"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, MessageSquare, Heart, ArrowRight, ChevronDown, BookOpen, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

export default function Home() {
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
  const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-orange-300 text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10 flex flex-col items-center p-6 relative overflow-x-hidden">
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

        <div className="flex items-center gap-2 md:gap-6">
          <div className="hidden sm:block">
            <UserStatus />
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[40] bg-white pt-24 px-6 md:hidden overflow-y-auto"
          >
            <div className="space-y-8 pb-12">
              <div className="sm:hidden pb-6 border-b border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">账户</p>
                <UserStatus isSidebar={true} className="!p-0" />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">群聊</p>
                <div className="grid gap-2">
                  <Link
                    href="/mbti"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-orange-500 shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">MBTI 创作实验室</p>
                      <p className="text-[10px] text-slate-500">五位性格专家深度对谈</p>
                    </div>
                  </Link>
                  <Link
                    href="/lysk"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">极夜编辑器</p>
                      <p className="text-[10px] text-slate-500">捕捉动人的细腻瞬间</p>
                    </div>
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">社区</p>
                <div className="grid gap-2">
                  <Link
                    href="/blog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">我的作品</p>
                      <p className="text-[10px] text-slate-500">查看您创作的所有博文</p>
                    </div>
                  </Link>
                  <Link
                    href="/blog"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-purple-500 shadow-sm">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">创作广场</p>
                      <p className="text-[10px] text-slate-500">探索更多精彩对话内容</p>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/mbti"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all"
                >
                  开始创作 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-6 mt-12"
          >
            <Link
              href="/mbti"
              className="group relative px-10 py-5 bg-slate-900 text-white rounded-full font-black text-lg shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                开启灵感之旅 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              与 AI 共同编织您的思想华章
            </p>
          </motion.div>
        </motion.div>

        {/* Features Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 px-4"
        >
          <div className="relative p-8 rounded-[2.5rem] bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl shadow-blue-500/5 group hover:bg-white/50 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-blue-500/20">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-800">16 种灵魂视角</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              与 16 种 <strong>MBTI 性格专家</strong> 开启深度对谈。从 <strong>INTJ</strong> 的理性复盘到 <strong>ENFP</strong> 的奇思妙想，感受不同人格视角下的思想碰撞与灵魂共鸣。
            </p>
          </div>

          <div className="relative p-8 rounded-[2.5rem] bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl shadow-orange-500/5 group hover:bg-white/50 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-orange-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-800">对话即创作</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              灵感不应止于碎片化的聊天。通过自研引擎，实时捕捉对话中闪光的句子，一键将其萃取为具备<strong>文学质感</strong>的博文，让每一次闲聊都沉淀为作品。
            </p>
          </div>

          <div className="relative p-8 rounded-[2.5rem] bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl shadow-indigo-500/5 group hover:bg-white/50 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-indigo-500/20">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-800">生成“每日 Blog”</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              习惯记录，更爱分享。基于每日的对话灵感，系统能自动构建风格化的<strong>每日日记或专题博文</strong>，轻松发布至社区，记录每个独一无二的思想瞬间。
            </p>
          </div>

          <div className="relative p-8 rounded-[2.5rem] bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl shadow-emerald-500/5 group hover:bg-white/50 transition-all duration-500">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black mb-4 text-slate-800">超感官体验</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              搭载全球领先的预训练大模型，配合沉浸式环境音与拟人语音（TTS）。在探索 MBTI 世界的同时，亦可邂逅<strong>秦彻、祁煜</strong>等次元身影，享受极致对谈。
            </p>
          </div>
        </motion.div>

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
