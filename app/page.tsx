"use client";

import Link from 'next/link';
import { Sparkles, Users, MessageSquare, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-16 z-50">
        <Logo className="w-10 h-10" showText={true} />
        <div className="flex items-center gap-6">
          <Link href="/blog" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors">
            我的作品
          </Link>
          <Link href="/mbti" className="px-6 py-2 bg-[var(--accent-main)] text-white text-sm font-bold rounded-full hover:opacity-90 transition-all">
            开始创作
          </Link>
          <div className="h-6 w-px bg-[var(--border-light)] mx-2" />
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
            <span className="text-[var(--text-primary)]">
              Chat2<span className="text-[var(--accent-main)]">Blog</span>
            </span>
          </h1>
          <p className="text-[var(--text-secondary)] text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed">
            将瞬时的灵感，通过充满张力的对话，沉淀为字里行间的永恒。
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* MBTI Mode */}
          <Link href="/mbti">
            <motion.div
              whileHover={{ y: -8 }}
              className="group relative bg-[var(--bg-panel)] rounded-[3rem] p-12 border border-[var(--border-light)] hover:border-[var(--accent-main)]/30 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 bg-[var(--bg-hover)] rounded-2xl mb-10 group-hover:bg-[var(--accent-main)] transition-colors duration-500 group-hover:text-white text-[var(--accent-main)]">
                  <MessageSquare className="w-8 h-8" />
                </div>

                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6 flex items-center justify-between">
                  MBTI 创作实验室
                  <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                </h2>

                <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed">
                  与五位性格迥异的专家深度对谈。从逻辑推演到感性共鸣，全方位解构您的创作主题。
                </p>

                <div className="flex flex-wrap gap-2">
                  {['ENTJ', 'ISTJ', 'ENFP', 'INFP', 'ENFJ'].map(role => (
                    <span key={role} className="px-3 py-1 bg-[var(--bg-hover)] text-[var(--text-tertiary)] rounded-lg text-[10px] font-bold border border-[var(--border-light)]">
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Love and Deepspace Mode */}
          <Link href="/lysk">
            <motion.div
              whileHover={{ y: -8 }}
              className="group relative bg-[var(--bg-panel)] rounded-[3rem] p-12 border border-[var(--border-light)] hover:border-[var(--accent-main)]/30 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 h-16 bg-[var(--bg-hover)] rounded-2xl mb-10 group-hover:bg-[var(--accent-main)] transition-colors duration-500 group-hover:text-white text-[var(--accent-main)]">
                  <Sparkles className="w-8 h-8" />
                </div>

                <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6 flex items-center justify-between">
                  极夜编辑器
                  <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                </h2>

                <p className="text-[var(--text-secondary)] text-lg mb-10 leading-relaxed">
                  在深邃的交互中捕捉那些微妙且动人的瞬间。适合需要极致细腻感触的同人与随笔创作。
                </p>

                <div className="flex flex-wrap gap-2">
                  {['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'].map(name => (
                    <span key={name} className="px-3 py-1 bg-[var(--bg-hover)] text-[var(--text-tertiary)] rounded-lg text-[10px] font-bold border border-[var(--border-light)]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </Link>
        </div>

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
