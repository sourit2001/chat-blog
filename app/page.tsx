"use client";

import Link from 'next/link';
import { Sparkles, Users, MessageSquare, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-16 z-50">
        <Logo className="w-10 h-10" showText={true} />
        <div className="flex items-center gap-8">
          <Link href="/blog" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
            我的博客
          </Link>
          <Link href="/login" className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm font-bold rounded-full border border-white/10 transition-all">
            登录
          </Link>
        </div>
      </nav>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-5xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
              <Logo className="w-16 h-16" showText={false} />
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
              chat2
            </span>
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              blog
            </span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed">
            选择您的 AI 创作空间，开始一段充满灵感的对话之旅
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* MBTI Mode */}
          <Link href="/mbti">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/5 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500 border border-emerald-500/30">
                  <Users className="w-10 h-10 text-emerald-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  MBTI 创作实验室
                  <MessageSquare className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>

                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  与五位性格迥异的 MBTI 专家共同进行头脑风暴，多维视角打磨您的博客内容。
                </p>

                <div className="flex flex-wrap gap-3">
                  {['ENTJ', 'ISTJ', 'ENFP', 'INFP', 'ENFJ'].map(role => (
                    <span key={role} className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-semibold border border-emerald-500/20">
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
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-white/5 backdrop-blur-2xl rounded-3xl p-10 border border-white/10 hover:border-purple-500/50 transition-all duration-500 cursor-pointer overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-20 h-20 bg-purple-500/20 rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500 border border-purple-500/30">
                  <Sparkles className="w-10 h-10 text-purple-400" />
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
                  恋与深空：星际对话
                  <Heart className="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>

                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  跨越光年，与五位男主开启专属互动。在深邃的夜色中分享心动瞬间。
                </p>

                <div className="flex flex-wrap gap-3">
                  {['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'].map(name => (
                    <span key={name} className="px-4 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-sm font-semibold border border-purple-500/20">
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
          className="text-center text-slate-500 mt-16 flex flex-col items-center gap-4"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
          <p className="text-sm tracking-widest uppercase">Click a card to enter the mode</p>
        </motion.div>
      </div>
    </div>
  );
}
