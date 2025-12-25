"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Feather, Clock, Heart, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from "@/components/Logo";
import { UserStatus } from '@/components/UserStatus';

type BlogPost = {
    id: string;
    title: string;
    content: string;
    date: string;
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

    if (!post) return null;

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
                        onClick={handleShare}
                        className="p-3 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"
                        title="分享文章"
                    >
                        {isCopied ? <span className="text-xs font-sans font-medium text-[var(--accent-main)]">已复制</span> : null}
                        <Share2 className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-[var(--border-light)] hidden md:block" />
                    <UserStatus />
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="artistic-prose"
                >
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
                                {post.title}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-sm font-medium text-[var(--text-tertiary)] tracking-widest uppercase">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-[var(--accent-main)]/80" />
                                    {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Shanghai' })}
                                </span>
                                <span className="text-[var(--border-light)]">•</span>
                                <span>AI 灵感协作</span>
                            </div>
                        </motion.div>
                    </header>

                    <div className="markdown-content artistic-prose mb-20">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
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
