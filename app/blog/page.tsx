"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, ChevronRight, MessageSquare, Trash2, Feather, Menu, X, ChevronDown, Users, Sparkles, BookOpen, History, Lock, Globe, AlertTriangle } from 'lucide-react';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    date: string;
    isDraft?: boolean;
    isPrivate?: boolean;
};

export default function BlogListPage() {
    const router = useRouter();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
    const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [deletingPost, setDeletingPost] = useState<{ id: string, isDraft?: boolean } | null>(null);

    useEffect(() => {
        const loadPosts = () => {
            const published = JSON.parse(localStorage.getItem('chat2blog_published') || '[]');
            const draftJson = localStorage.getItem('chat2blog_draft');
            let allPosts = [...published];

            if (draftJson) {
                const draft = JSON.parse(draftJson);
                // Only show draft if it has content/title and is NOT marking an edit of an existing post that wasn't saved?
                // Actually if it's an edit, we still show it as draft.
                if (draft.title || draft.content) {
                    const draftPost: BlogPost = {
                        id: 'draft',
                        title: draft.title || '无题草稿',
                        content: draft.content || '',
                        date: draft.date || new Date().toISOString(),
                        isDraft: true,
                        isPrivate: draft.isPrivate
                    };
                    allPosts = [draftPost, ...published];
                }
            }
            setPosts(allPosts);
        };

        loadPosts();
        window.addEventListener('focus', loadPosts);
        return () => window.removeEventListener('focus', loadPosts);
    }, []);

    const deletePost = (id: string, isDraft?: boolean) => {
        setDeletingPost({ id, isDraft });
    };

    const executeDelete = () => {
        if (!deletingPost) return;
        const { id, isDraft } = deletingPost;

        if (isDraft) {
            localStorage.removeItem('chat2blog_draft');
            setPosts(prev => prev.filter(p => p.id !== 'draft'));
        } else {
            const next = posts.filter(p => !p.isDraft && p.id !== id);
            setPosts(prev => {
                const draft = prev.find(p => p.isDraft);
                return draft ? [draft, ...next] : next;
            });
            localStorage.setItem('chat2blog_published', JSON.stringify(next.filter(p => !p.isDraft)));
        }
        setDeletingPost(null);
    };

    const togglePermission = (e: React.MouseEvent, postId: string) => {
        e.stopPropagation();
        setPosts(prev => {
            const next = prev.map(p => {
                if (p.id === postId) {
                    return { ...p, isPrivate: !p.isPrivate };
                }
                return p;
            });
            localStorage.setItem('chat2blog_published', JSON.stringify(next.filter(p => !p.isDraft)));
            // Note: Drafts are in separate storage usually but here we merged them in state.
            // If we are toggling a draft, we should update 'chat2blog_draft'.
            const toggledPost = next.find(p => p.id === postId);
            if (toggledPost?.isDraft) {
                const draft = JSON.parse(localStorage.getItem('chat2blog_draft') || '{}');
                draft.isPrivate = toggledPost.isPrivate;
                localStorage.setItem('chat2blog_draft', JSON.stringify(draft));
            }
            return next;
        });
    };

    return (
        <div className="min-h-screen text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10" style={{ background: 'var(--bg-page)' }}>
            {/* Standard Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-6 md:px-12 z-50 bg-[var(--bg-page)]/80 backdrop-blur-xl border-b border-[var(--border-light)]">
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 hover:bg-[var(--bg-hover)] rounded-xl transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                        </button>
                        <div className="h-6 w-px bg-[var(--border-light)]" />
                        <Link href="/">
                            <Logo className="w-8 h-8 md:w-9 md:h-9" showText={true} accentColor="var(--accent-main)" />
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <div
                            className="relative"
                            onMouseEnter={() => setIsChatDropdownOpen(true)}
                            onMouseLeave={() => setIsChatDropdownOpen(false)}
                        >
                            <button className="flex items-center gap-1 text-[13px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-8 uppercase tracking-widest">
                                群聊 <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isChatDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isChatDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-[80%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 mt-1"
                                    >
                                        <div className="space-y-1">
                                            <Link href="/mbti" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                                                    <Users className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">MBTI 聊天室</p>
                                                    <p className="text-[10px] text-slate-500">性格专家的对谈</p>
                                                </div>
                                            </Link>
                                            <Link href="/lysk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">极夜编辑器</p>
                                                    <p className="text-[10px] text-slate-500">捕捉动人瞬间</p>
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
                            <button className="flex items-center gap-1 text-[13px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-8 uppercase tracking-widest">
                                工具 <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isCommunityDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isCommunityDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-[80%] left-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 mt-1"
                                    >
                                        <div className="space-y-1">
                                            <Link href="/blog" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">我的作品</p>
                                                    <p className="text-[10px] text-slate-500">查看博文草稿</p>
                                                </div>
                                            </Link>
                                            <Link href="/history" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                    <History className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">历史记录</p>
                                                    <p className="text-[10px] text-slate-500">管理对话历史</p>
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
                    <div className="hidden sm:block">
                        <UserStatus />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2 text-slate-700 hover:bg-slate-100/50 rounded-xl transition-colors"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 z-[40] bg-white pt-24 px-6 lg:hidden overflow-y-auto"
                    >
                        <div className="space-y-6 pb-12">
                            <div className="pb-6 border-b border-slate-100">
                                <UserStatus isSidebar={true} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Link href="/mbti" className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-orange-600 block">
                                    <Users className="w-6 h-6 mb-2" />
                                    <div className="text-sm font-bold">MBTI 聊天</div>
                                </Link>
                                <Link href="/lysk" className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 block">
                                    <Sparkles className="w-6 h-6 mb-2" />
                                    <div className="text-sm font-bold">极夜编辑</div>
                                </Link>
                                <Link href="/blog" className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 block">
                                    <BookOpen className="w-6 h-6 mb-2" />
                                    <div className="text-sm font-bold">我的作品</div>
                                </Link>
                                <Link href="/history" className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 block">
                                    <History className="w-6 h-6 mb-2" />
                                    <div className="text-sm font-bold">历史记录</div>
                                </Link>
                            </div>
                            <button
                                onClick={() => router.back()}
                                className="w-full flex items-center justify-center p-4 rounded-xl border border-slate-200 text-slate-600 font-bold"
                            >
                                返回
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-32 px-6 max-w-4xl mx-auto pb-32">
                <div className="flex items-end justify-between mb-16 border-b border-[var(--border-light)] pb-8">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter text-[var(--text-primary)]">我的作品</h1>
                        <p className="text-[var(--text-tertiary)] mt-2 font-medium">Recorded Inspirations — {posts.length} Posts</p>
                    </div>
                </div>

                {posts.length === 0 ? (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-8">
                            <Feather className="w-10 h-10 text-[var(--text-tertiary)]" />
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">灵感尚未着墨</h3>
                        <p className="text-[var(--text-tertiary)] mb-10 max-w-xs mx-auto">开启一段对话，将那些闪光的想法化作文字。</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => router.push('/mbti')} className="px-8 py-3 bg-[var(--bg-hover)] border border-[var(--border-light)] text-[var(--text-primary)] font-bold rounded-2xl hover:opacity-80 transition-all">开启创作</button>
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
                                    if (post.isDraft) {
                                        router.push('/publish');
                                    } else {
                                        localStorage.setItem('chat2blog_view_post', JSON.stringify(post));
                                        router.push(`/blog/${post.id}`);
                                    }
                                }}
                            >
                                <div className="flex flex-col md:flex-row gap-8 cursor-pointer items-start">
                                    <div className="md:w-16 text-[var(--text-tertiary)] opacity-20 font-black text-6xl tracking-tighter tabular-nums transition-colors group-hover:text-[var(--accent-main)] group-hover:opacity-40 flex-shrink-0">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>

                                    {post.content.match(/!\[.*?\]\((.*?)\)/) && (
                                        <div className="w-full md:w-48 aspect-[4/3] flex-shrink-0">
                                            <img
                                                src={post.content.match(/!\[.*?\]\((.*?)\)/)![1]}
                                                alt="Thumbnail"
                                                className="w-full h-full object-cover rounded-2xl border border-[var(--border-light)] shadow-sm group-hover:shadow-md transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-4">
                                            {post.isDraft ? (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded">Draft</span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 bg-[var(--accent-main)]/10 text-[var(--accent-main)] border border-[var(--accent-main)]/20 rounded">Published</span>
                                            )}

                                            <button
                                                onClick={(e) => togglePermission(e, post.id)}
                                                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold transition-all border ${post.isPrivate
                                                    ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                    }`}
                                            >
                                                {post.isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                                <span>{post.isPrivate ? 'Private' : 'Public'}</span>
                                            </button>

                                            <span className="text-xs text-[var(--text-tertiary)] font-bold">{new Date(post.date).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-4 group-hover:text-[var(--accent-main)] transition-colors leading-tight tracking-tighter">
                                            {post.title}
                                        </h2>

                                        <p className="text-[var(--text-secondary)] line-clamp-3 text-lg leading-relaxed mb-6 font-medium">
                                            {post.content.replace(/!\[.*?\]\((.*?)\)/g, '').replace(/[#*`]/g, '').slice(0, 200)}...
                                        </p>

                                        <div className="flex items-center gap-6">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deletePost(post.id, post.isDraft);
                                                }}
                                                className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-4 transition-all text-[var(--accent-main)]">
                                    <ChevronRight className="w-8 h-8" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deletingPost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeletingPost(null)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-1">确认删除？</h3>
                                    <p className="text-sm text-slate-500">删除后无法恢复，确定要继续吗？</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setDeletingPost(null)}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={executeDelete}
                                        className="px-4 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
