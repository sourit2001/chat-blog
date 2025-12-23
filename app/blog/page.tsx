"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, MessageSquare, Trash2, Feather } from 'lucide-react';
import { Logo } from "@/components/Logo";

type BlogPost = {
    id: string;
    title: string;
    content: string;
    date: string;
};

export default function BlogListPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('chat2blog_published');
        if (saved) {
            setPosts(JSON.parse(saved));
        }
    }, []);

    const deletePost = (id: string) => {
        const next = posts.filter(p => p.id !== id);
        setPosts(next);
        localStorage.setItem('chat2blog_published', JSON.stringify(next));
    };

    return (
        <div className="min-h-screen bg-[#fcfaf2] text-[#2c3e50] font-serif">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#fcfaf2]/80 backdrop-blur-xl border-b border-emerald-900/5 z-50 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.push('/')}
                        className="p-3 hover:bg-emerald-900/5 rounded-full transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-emerald-900/60 group-hover:text-emerald-900" />
                    </button>
                    <div className="h-6 w-px bg-emerald-900/10" />
                    <Logo className="w-8 h-8 opacity-80" showText={true} />
                </div>
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-900/40">My Collection</div>
            </header>

            <main className="pt-32 px-6 max-w-4xl mx-auto pb-32">
                <div className="flex items-end justify-between mb-16 border-b border-emerald-900/10 pb-8">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-[#1a1a1a]">我的作品</h1>
                        <p className="text-emerald-900/40 mt-2 font-medium">Recorded Inspirations — {posts.length} Posts</p>
                    </div>
                    <button
                        onClick={() => router.push('/lysk')}
                        className="flex items-center gap-2 px-8 py-3 bg-emerald-900 text-white text-sm font-bold rounded-full hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
                    >
                        <Feather className="w-4 h-4" />
                        开始创作
                    </button>
                </div>

                {posts.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-emerald-900/5 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Feather className="w-10 h-10 text-emerald-900/20" />
                        </div>
                        <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2">灵感尚未着墨</h3>
                        <p className="text-emerald-900/40 mb-10 max-w-xs mx-auto">开启一段对话，将那些闪光的想法化作文字。</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => router.push('/mbti')} className="px-8 py-3 bg-white border border-emerald-900/10 text-emerald-900 font-bold rounded-2xl hover:bg-emerald-50 transition-all">MBTI 创作</button>
                            <button onClick={() => router.push('/lysk')} className="px-8 py-3 bg-white border border-emerald-900/10 text-emerald-900 font-bold rounded-2xl hover:bg-emerald-50 transition-all">恋与深空</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-12">
                        {posts.map((post, idx) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                                onClick={() => {
                                    localStorage.setItem('chat2blog_view_post', JSON.stringify(post));
                                    router.push(`/blog/${post.id}`);
                                }}
                            >
                                <div className="flex flex-col md:flex-row gap-8 cursor-pointer">
                                    <div className="md:w-1/4 text-emerald-900/20 font-black text-6xl tracking-tighter tabular-nums transition-colors group-hover:text-emerald-900/40">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="md:w-3/4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-emerald-900 text-white rounded">Published</span>
                                            <span className="text-xs text-emerald-900/40 font-bold">{new Date(post.date).toLocaleDateString('zh-CN')}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black text-[#1a1a1a] mb-4 group-hover:text-emerald-700 transition-colors leading-tight tracking-tighter">
                                            {post.title}
                                        </h2>
                                        <p className="text-emerald-900/60 line-clamp-3 text-lg leading-relaxed mb-6 font-medium">
                                            {post.content.replace(/[#*`]/g, '').slice(0, 200)}...
                                        </p>
                                        <div className="flex items-center gap-6">
                                            <span className="flex items-center gap-2 text-xs font-bold text-emerald-900/40">
                                                <MessageSquare className="w-4 h-4" /> AI Assisted
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePost(post.id);
                                                }}
                                                className="p-2 opacity-0 group-hover:opacity-100 bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all text-emerald-900">
                                    <ChevronRight className="w-8 h-8" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
