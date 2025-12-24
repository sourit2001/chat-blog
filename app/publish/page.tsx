"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Check, Edit3, Eye, Feather, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from "@/components/Logo";

export default function PublishPage() {
    const router = useRouter();
    const [blogTitle, setBlogTitle] = useState('');
    const [blogContent, setBlogContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isPublished, setIsPublished] = useState(false);

    useEffect(() => {
        const savedDraft = localStorage.getItem('chat2blog_draft');
        if (savedDraft) {
            const { title, content } = JSON.parse(savedDraft);
            const cleanTitle = (title || '').replace(/^#\s+/, '').trim();
            setBlogTitle(cleanTitle);

            let cleanContent = content || '';
            if (cleanContent.startsWith(`# ${cleanTitle}`)) {
                cleanContent = cleanContent.replace(`# ${cleanTitle}`, '').trim();
            }
            setBlogContent(cleanContent);
        }
    }, []);

    const handlePublish = async () => {
        setIsPublishing(true);
        setTimeout(() => {
            setIsPublishing(false);
            setIsPublished(true);
            const publishedPosts = JSON.parse(localStorage.getItem('chat2blog_published') || '[]');
            publishedPosts.unshift({
                id: Date.now().toString(),
                title: blogTitle,
                content: blogContent,
                date: new Date().toISOString()
            });
            localStorage.setItem('chat2blog_published', JSON.stringify(publishedPosts));
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[var(--bg-page)]/80 backdrop-blur-xl border-b border-[var(--border-light)] z-50 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-[var(--bg-hover)] rounded-full transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    </button>
                    <div className="h-6 w-px bg-[var(--border-light)]" />
                    <Logo className="w-8 h-8 opacity-90" showText={true} />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-all"
                    >
                        {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditing ? '欣赏模式' : '润色一下'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || isPublished}
                        className={`flex items-center gap-3 px-8 py-2.5 text-sm font-bold rounded-full transition-all tracking-widest ${isPublished
                            ? 'bg-[var(--accent-main)]/10 text-[var(--accent-main)] cursor-default border border-[var(--accent-main)]/20'
                            : 'bg-[var(--accent-main)] text-white hover:opacity-90 active:scale-95'
                            }`}
                    >
                        {isPublishing ? (
                            <Globe className="w-4 h-4 animate-spin" />
                        ) : isPublished ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <Feather className="w-4 h-4" />
                        )}
                        {isPublishing ? '载入星辰...' : isPublished ? '已见刊' : '付梓开启'}
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
                {isPublished && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-16 p-10 bg-gradient-to-br from-[var(--accent-main)] to-[var(--accent-main)]/80 text-white rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -bottom-8 opacity-10">
                            <Feather className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 tracking-tighter">文章付梓，见字如面</h3>
                            <p className="text-white/80 text-sm">您的思绪已化作墨香，在云端永久珍藏。</p>
                        </div>
                        <button
                            onClick={() => router.push('/blog')}
                            className="relative z-10 px-8 py-3 bg-white text-[var(--accent-main)] text-sm font-black rounded-full hover:bg-white/90 transition-all uppercase tracking-widest"
                        >
                            我的作品集
                        </button>
                    </motion.div>
                )}

                <div className={`transition-all duration-700 ${isEditing ? 'bg-[var(--bg-panel)] p-8 md:p-16 rounded-[2rem] shadow-2xl border border-[var(--border-light)]' : ''}`}>
                    {isEditing ? (
                        <div className="space-y-10">
                            <input
                                value={blogTitle}
                                onChange={(e) => setBlogTitle(e.target.value)}
                                placeholder="在此处题字..."
                                className="w-full text-5xl font-black tracking-tighter border-none focus:ring-0 bg-transparent text-[var(--text-primary)]"
                            />
                            <div className="w-20 h-1 bg-[var(--accent-main)] opacity-30 rounded-full" />
                            <textarea
                                value={blogContent}
                                onChange={(e) => setBlogContent(e.target.value)}
                                placeholder="笔耕不辍，思绪万千..."
                                className="w-full min-h-[600px] text-xl leading-[2] border-none focus:ring-0 bg-transparent resize-none text-[var(--text-secondary)]"
                            />
                        </div>
                    ) : (
                        <article className="artistic-prose">
                            <header className="mb-12 text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center justify-center gap-3 mb-6 opacity-30">
                                        <div className="h-px w-8 bg-[var(--accent-main)]" />
                                        <Feather className="w-4 h-4 text-[var(--accent-main)]" />
                                        <div className="h-px w-8 bg-[var(--accent-main)]" />
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-6 leading-tight">
                                        {blogTitle || '无题'}
                                    </h1>
                                    <div className="flex items-center justify-center gap-4 text-sm font-medium text-[var(--text-tertiary)] tracking-widest uppercase">
                                        <span>文 / AI 创作者</span>
                                        <span className="text-[var(--border-light)]">•</span>
                                        <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </motion.div>
                            </header>

                            <div className="markdown-content artistic-prose">
                                <ReactMarkdown>{blogContent}</ReactMarkdown>
                            </div>

                            <footer className="mt-20 pt-12 border-t border-[var(--border-light)] text-center">
                                <div className="inline-block p-10 border border-[var(--border-light)] rounded-full opacity-30">
                                    <Logo className="w-12 h-12" />
                                </div>
                                <p className="mt-8 text-sm text-[var(--text-tertiary)] flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    分享这篇文章的共鸣
                                </p>
                            </footer>
                        </article>
                    )}
                </div>
            </main>

            <button
                onClick={() => setIsEditing(!isEditing)}
                className="md:hidden fixed bottom-10 right-10 w-16 h-16 bg-[var(--accent-main)] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50"
            >
                {isEditing ? <Eye className="w-6 h-6" /> : <Feather className="w-6 h-6" />}
            </button>
        </div>
    );
}
