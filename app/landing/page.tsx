"use client";

import Link from 'next/link';
import { Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            IdeaFlow
          </h1>
          <p className="text-gray-600 text-lg">
            选择你的 AI 对话模式
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* MBTI Mode */}
          <Link href="/mbti">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-400"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                MBTI 创作小组
              </h2>
              <p className="text-gray-600 mb-4">
                五位 MBTI 角色陪你头脑风暴，打磨博客内容
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">ENTJ</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">ISTJ</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">ENFP</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">INFP</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">ENFJ</span>
              </div>
            </motion.div>
          </Link>

          {/* Love and Deepspace Mode */}
          <Link href="/lysk">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-400"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                恋与深空
              </h2>
              <p className="text-gray-600 mb-4">
                与五位男主展开浪漫互动，体验恋爱群聊
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">沈星回</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">黎深</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">祁煜</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">夏以昼</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">秦彻</span>
              </div>
            </motion.div>
          </Link>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-gray-500 mt-8 text-sm"
        >
          点击卡片进入对应模式
        </motion.p>
      </div>
    </div>
  );
}
