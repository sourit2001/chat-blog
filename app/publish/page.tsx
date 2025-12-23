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
            // Remove any leading # from title if it exists from markdown extraction
            const cleanTitle = (title || '').replace(/^#\s+/, '').trim();
            setBlogTitle(cleanTitle);

            // If content starts with the title, remove it to avoid duplication in preview
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
        <div className="min-h-screen bg-[#fcfaf2] text-[#2c3e50] font-serif selection:bg-emerald-100 selection:text-emerald-900">
            {/* Aesthetic Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#fcfaf2]/80 backdrop-blur-xl border-b border-emerald-900/5 z-50 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-emerald-900/5 rounded-full transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-emerald-900/60 group-hover:text-emerald-900" />
                    </button>
                    <div className="h-6 w-px bg-emerald-900/10" />
                    <Logo className="w-8 h-8 opacity-80" showText={true} />
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-900/60 hover:text-emerald-900 hover:bg-emerald-900/5 rounded-full transition-all"
                    >
                        {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                        {isEditing ? '欣赏模式' : '润色一下'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isPublishing || isPublished}
                        className={`flex items-center gap-3 px-8 py-2.5 text-sm font-bold rounded-full transition-all tracking-widest ${isPublished
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-emerald-900 text-white hover:bg-emerald-800 active:scale-95 shadow-xl shadow-emerald-900/20'
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
                        className="mb-16 p-8 bg-emerald-900 text-white rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-emerald-900/30 overflow-hidden relative"
                    >
                        <div className="absolute -right-8 -bottom-8 opacity-10">
                            <Feather className="w-32 h-32 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 tracking-tighter">文章付梓，见字如面</h3>
                            <p className="text-emerald-100/70 text-sm">您的思绪已化作墨香，在云端永久珍藏。</p>
                        </div>
                        <button
                            onClick={() => router.push('/blog')}
                            className="relative z-10 px-6 py-2.5 bg-white text-emerald-900 text-sm font-bold rounded-full hover:bg-emerald-50 transition-colors"
                        >
                            我的作品集
                        </button>
                    </motion.div>
                )}

                {/* The Paper */}
                <div className={`transition-all duration-700 ${isEditing ? 'bg-white p-8 md:p-16 rounded-3xl shadow-inner border border-emerald-900/5' : ''}`}>
                    {isEditing ? (
                        <div className="space-y-8">
                            <input
                                value={blogTitle}
                                onChange={(e) => setBlogTitle(e.target.value)}
                                placeholder="在此处题字..."
                                className="w-full text-5xl font-black tracking-tighter border-none focus:ring-0 placeholder:text-emerald-900/10 bg-transparent"
                            />
                            <div className="w-20 h-1.5 bg-emerald-900 rounded-full" />
                            <textarea
                                value={blogContent}
                                onChange={(e) => setBlogContent(e.target.value)}
                                placeholder="笔耕不辍，思绪万千..."
                                className="w-full min-h-[600px] text-xl leading-[2] border-none focus:ring-0 placeholder:text-emerald-900/10 bg-transparent resize-none"
                            />
                        </div>
                    ) : (
                        <article className="artistic-prose">
                            <header className="mb-6 text-center">
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div className="flex items-center justify-center gap-3 mb-4 opacity-30">
                                        <div className="h-px w-8 bg-emerald-900" />
                                        <Feather className="w-4 h-4" />
                                        <div className="h-px w-8 bg-emerald-900" />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[#1a1a1a] mb-4 leading-tight">
                                        {blogTitle || '无题'}
                                    </h1>
                                    <div className="flex items-center justify-center gap-3 text-sm font-medium text-emerald-900/40 tracking-widest uppercase">
                                        <span>文 / AI 创作者</span>
                                        <span>•</span>
                                        <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </motion.div>
                            </header>

                            <div className="markdown-content artistic-prose">
                                <ReactMarkdown>{blogContent}</ReactMarkdown>
                            </div>

                            <footer className="mt-12 pt-8 border-t border-emerald-900/5 text-center">
                                <div className="inline-block p-8 border border-emerald-900/10 rounded-full opacity-10">
                                    <Logo className="w-10 h-10" />
                                </div>
                                <p className="mt-8 text-sm text-emerald-900/30 flex items-center justify-center gap-2">
                                    <Share2 className="w-4 h-4" />
                                    分享这篇文章的共鸣
                                </p>
                            </footer>
                        </article>
                    )}
                </div>
            </main>

            {/* Floating Action for Mobile */}
            <button
                onClick={() => setIsEditing(!isEditing)}
                className="md:hidden fixed bottom-10 right-10 w-16 h-16 bg-emerald-900 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-50 ring-8 ring-[#fcfaf2]"
            >
                {isEditing ? <Eye className="w-6 h-6" /> : <Feather className="w-6 h-6" />}
            </button>
        </div>
    );
}
