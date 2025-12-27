"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Feather, Clock, Heart, MessageSquare, Send, ChevronDown, Users, Sparkles, BookOpen, History, Menu, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    date: string;
    isPrivate?: boolean;
};

export default function BlogDetailPage() {
    const router = useRouter();
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);

    // Interaction states
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Array<{ id: string, text: string, date: string, author: string }>>([]);
    const [newComment, setNewComment] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    // Navigation states
    const [isChatDropdownOpen, setIsChatDropdownOpen] = useState(false);
    const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('chat2blog_published');
        if (saved) {
            const posts = JSON.parse(saved);
            const found = posts.find((p: BlogPost) => p.id === params.id);
            if (found) {
                setPost(found);
            } else {
                const fallback = localStorage.getItem('chat2blog_view_post');
                if (fallback) setPost(JSON.parse(fallback));
            }
        }

        const postId = String(params.id);
        const storedLikes = localStorage.getItem(`likes_${postId}`);
        if (storedLikes) {
            setLikes(parseInt(storedLikes));
            setIsLiked(localStorage.getItem(`isLiked_${postId}`) === 'true');
        } else {
            setLikes(Math.floor(Math.random() * 50) + 10);
        }

        const storedComments = localStorage.getItem(`comments_${postId}`);
        if (storedComments) {
            setComments(JSON.parse(storedComments));
        }
    }, [params.id]);

    const handleLike = () => {
        const postId = String(params.id);
        const newIsLiked = !isLiked;
        const newLikes = newIsLiked ? likes + 1 : likes - 1;
        setIsLiked(newIsLiked);
        setLikes(newLikes);
        localStorage.setItem(`likes_${postId}`, newLikes.toString());
        localStorage.setItem(`isLiked_${postId}`, newIsLiked.toString());
    };
    const handleEdit = () => {
        if (!post) return;
        const draftData = {
            id: post.id,
            title: post.title,
            content: post.content,
            date: new Date().toISOString(),
            isPrivate: post.isPrivate,
            isTip: true // Flag to tell publish page this is an edit of existing
        };
        localStorage.setItem('chat2blog_draft', JSON.stringify(draftData));
        router.push('/publish');
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: post?.title,
                    text: '来看看这篇好文章',
                    url: url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            }
        } catch (error) {
            console.error('Share failed:', error);
        }
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const comment = {
            id: Date.now().toString(),
            text: newComment,
            date: new Date().toISOString(),
            author: '访客'
        };

        setComments(prev => {
            const updated = [comment, ...prev];
            localStorage.setItem(`comments_${String(params.id)}`, JSON.stringify(updated));
            return updated;
        });
        setNewComment('');
    };

    const { cleanContent, coverImage } = React.useMemo(() => {
        if (!post) return { cleanContent: '', coverImage: null };
        const imgMatch = post.content.match(/!\[.*?\]\((.*?)\)/);
        if (imgMatch) {
            return {
                cleanContent: post.content.replace(imgMatch[0], ''),
                coverImage: imgMatch[1]
            };
        }
        return { cleanContent: post.content, coverImage: null };
    }, [post]);

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-serif selection:bg-[var(--accent-main)]/10">
            {/* Header */}
            {/* Navigation */}
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
                                            <Link href="/blog" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">博客生成</p>
                                                    <p className="text-[10px] text-slate-500">记录美好回忆</p>
                                                </div>
                                            </Link>
                                            <Link href="/history" className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                                    <History className="w-4 h-4" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-800">历史记录</p>
                                                    <p className="text-[10px] text-slate-500">查看过往对话</p>
                                                </div>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleEdit}
                        className="p-3 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
                        title="编辑文章"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-3 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
                        title="分享文章"
                    >
                        {isCopied ? <span className="text-xs font-sans font-medium text-[var(--accent-main)]">已复制</span> : null}
                        <Share2 className="w-4 h-4" />
                    </button>
                    <div className="h-6 w-px bg-[var(--border-light)] hidden md:block" />
                    <UserStatus />
                    <button
                        className="lg:hidden p-2 text-[var(--text-secondary)]"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="w-6 h-6" />
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
                        className="fixed inset-0 z-[60] bg-white md:hidden flex flex-col"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <Logo className="w-8 h-8" showText={true} />
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">群聊</h3>
                                <div className="space-y-2">
                                    <Link href="/mbti" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-slate-700">MBTI 聊天室</div>
                                    </Link>
                                    <Link href="/lysk" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-slate-700">极夜编辑器</div>
                                    </Link>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">创作工具</h3>
                                <div className="space-y-2">
                                    <Link href="/blog" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                                            <BookOpen className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-slate-700">博客生成</div>
                                    </Link>
                                    <Link href="/history" className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-500">
                                            <History className="w-5 h-5" />
                                        </div>
                                        <div className="font-bold text-slate-700">历史记录</div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto">
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="artistic-prose"
                >
                    <header className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className={`flex flex-col md:flex-row gap-8 md:gap-12 items-center ${coverImage ? 'text-left' : 'text-center'}`}
                        >
                            {coverImage && (
                                <div className="w-full md:w-[280px] flex-shrink-0">
                                    <img
                                        src={coverImage}
                                        alt="Cover"
                                        className="w-full aspect-[3/4] object-cover rounded-2xl shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500 border border-[var(--border-light)]"
                                    />
                                </div>
                            )}
                            <div className="flex-1 w-full">
                                <div className={`flex items-center gap-3 mb-6 opacity-30 ${coverImage ? 'justify-start' : 'justify-center'}`}>
                                    <div className="h-px w-8 bg-[var(--accent-main)]" />
                                    <Feather className="w-4 h-4 text-[var(--accent-main)]" />
                                    <div className="h-px w-8 bg-[var(--accent-main)]" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-6 leading-tight">
                                    {post.title}
                                </h1>
                                <div className={`flex items-center gap-4 text-sm font-medium text-[var(--text-tertiary)] tracking-widest uppercase ${coverImage ? 'justify-start' : 'justify-center'}`}>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4 text-[var(--accent-main)]/80" />
                                        {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })}
                                    </span>
                                    <span className="text-[var(--border-light)]">•</span>
                                    <span>AI 灵感协作</span>
                                </div>
                            </div>
                        </motion.div>
                    </header>

                    <div className="markdown-content artistic-prose mb-20">
                        <ReactMarkdown
                            urlTransform={(url) => url}
                            components={{
                                img: ({ node, ...props }) => (
                                    <img
                                        {...props}
                                        className="max-w-full md:max-w-[300px] max-h-[300px] rounded-xl border border-[var(--border-light)] shadow-md object-cover my-6 mx-auto block"
                                    />
                                )
                            }}
                        >
                            {cleanContent}
                        </ReactMarkdown>
                    </div>

                    {/* Interaction Section */}
                    <div className="border-t border-[var(--border-light)] pt-12">
                        <div className="flex flex-col items-center gap-8">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={handleLike}
                                    className={`group flex flex-col items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-[var(--text-secondary)] hover:text-red-400'}`}
                                >
                                    <div className={`p-4 rounded-full transition-all ${isLiked ? 'bg-red-500/10' : 'bg-[var(--bg-hover)] group-hover:bg-red-500/10'}`}>
                                        <Heart className={`w-8 h-8 transition-transform ${isLiked ? 'fill-current scale-110' : 'scale-100 group-hover:scale-110'}`} />
                                    </div>
                                    <span className="text-sm font-medium font-sans">{likes} 喜欢</span>
                                </button>

                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className={`group flex flex-col items-center gap-2 transition-all ${showComments ? 'text-[var(--accent-main)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-main)]'}`}
                                >
                                    <div className={`p-4 rounded-full transition-all ${showComments ? 'bg-[var(--accent-main)]/10' : 'bg-[var(--bg-hover)] group-hover:bg-[var(--accent-main)]/10'}`}>
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <span className="text-sm font-medium font-sans">{comments.length} 评论</span>
                                </button>
                            </div>
                        </div>

                        {showComments && (
                            <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="pt-12 max-w-xl mx-auto">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 font-sans">
                                        评论 ({comments.length})
                                    </h3>

                                    <form onSubmit={handleCommentSubmit} className="mb-12 relative">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="写下你的想法..."
                                            className="w-full min-h-[120px] p-5 pr-14 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-light)] focus:border-[var(--accent-main)]/50 focus:ring-0 transition-all resize-none font-sans text-sm text-[var(--text-primary)] placeholder:[var(--text-tertiary)]"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="absolute bottom-4 right-4 p-2 bg-[var(--accent-main)] text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>

                                    <div className="space-y-6 pb-20">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-8 text-[var(--text-tertiary)] text-sm italic">
                                                暂无评论，来坐沙发吧...
                                            </div>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment.id} className="bg-[var(--bg-panel)] p-6 rounded-2xl border border-[var(--border-light)]">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="font-bold text-[var(--text-primary)] text-sm font-sans">{comment.author}</span>
                                                        <span className="text-xs text-[var(--text-tertiary)] font-sans">
                                                            {new Date(comment.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">
                                                        {comment.text}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="mt-20 pt-12 border-t border-[var(--border-light)] text-center">
                        <div className="inline-block p-10 border border-[var(--border-light)] rounded-full opacity-30">
                            <Logo className="w-12 h-12" />
                        </div>
                        <p className="mt-8 text-sm text-[var(--text-tertiary)]">
                            阅毕。感悟在此刻共鸣。
                        </p>
                    </footer>
                </motion.article>
            </main>
        </div>
    );
}
