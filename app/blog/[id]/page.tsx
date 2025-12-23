"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, Feather, Clock, Heart, MessageSquare, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Logo } from "@/components/Logo";

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

        // Load initial mock interactions
        const postId = String(params.id);
        const storedLikes = localStorage.getItem(`likes_${postId}`);
        if (storedLikes) {
            setLikes(parseInt(storedLikes));
            setIsLiked(localStorage.getItem(`isLiked_${postId}`) === 'true');
        } else {
            setLikes(Math.floor(Math.random() * 50) + 10); // Random fake likes
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
        console.log('Submitting comment:', newComment);
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
        <div className="min-h-screen bg-[#151515] text-[#a3a3a3] font-serif selection:bg-emerald-900/30 selection:text-emerald-400">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 bg-[#151515]/80 backdrop-blur-xl border-b border-white/5 z-50 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 hover:bg-white/5 rounded-full transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#a3a3a3] group-hover:text-white" />
                    </button>
                    <div className="h-6 w-px bg-white/10" />
                    <Logo className="w-8 h-8 opacity-90 invert" showText={true} />
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleShare}
                        className="p-3 hover:bg-white/5 rounded-full text-[#a3a3a3] hover:text-white transition-all flex items-center gap-2"
                        title="分享文章"
                    >
                        {isCopied ? <span className="text-xs font-sans font-medium text-emerald-400">已复制</span> : null}
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
                <motion.article
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="artistic-prose"
                >
                    <header className="mb-6 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center justify-center gap-3 mb-4 opacity-30">
                                <div className="h-px w-8 bg-emerald-500" />
                                <Feather className="w-4 h-4 text-emerald-500" />
                                <div className="h-px w-8 bg-emerald-500" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-[#e5e5e5] mb-4 leading-tight">
                                {post.title}
                            </h1>
                            <div className="flex items-center justify-center gap-4 text-sm font-medium text-[#a3a3a3] tracking-widest uppercase">
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-emerald-500/80" />
                                    {new Date(post.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span className="text-white/20">•</span>
                                <span>AI 灵感协作</span>
                            </div>
                        </motion.div>
                    </header>

                    <div className="markdown-content artistic-prose mb-16">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>

                    {/* Interaction Section */}
                    <div className="border-t border-white/5 pt-10 mt-10">
                        <div className="flex flex-col items-center gap-8">
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={handleLike}
                                    className={`group flex flex-col items-center gap-2 transition-all ${isLiked ? 'text-red-500' : 'text-[#a3a3a3] hover:text-red-400'}`}
                                >
                                    <div className={`p-4 rounded-full transition-all ${isLiked ? 'bg-red-500/10' : 'bg-white/5 group-hover:bg-red-500/10'}`}>
                                        <Heart className={`w-8 h-8 transition-transform ${isLiked ? 'fill-current scale-110' : 'scale-100 group-hover:scale-110'}`} />
                                    </div>
                                    <span className="text-sm font-medium font-sans">{likes} 喜欢</span>
                                </button>

                                <button
                                    onClick={() => setShowComments(!showComments)}
                                    className={`group flex flex-col items-center gap-2 transition-all ${showComments ? 'text-emerald-400' : 'text-[#a3a3a3] hover:text-emerald-400'}`}
                                >
                                    <div className={`p-4 rounded-full transition-all ${showComments ? 'bg-emerald-500/10' : 'bg-white/5 group-hover:bg-emerald-500/10'}`}>
                                        <MessageSquare className="w-8 h-8" />
                                    </div>
                                    <span className="text-sm font-medium font-sans">{comments.length} 评论</span>
                                </button>
                            </div>
                        </div>

                        {/* Comments Section */}
                        {showComments && (
                            <div className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
                                <div className="pt-10 max-w-xl mx-auto">
                                    <h3 className="text-lg font-bold text-[#e5e5e5] mb-6 font-sans">
                                        评论 ({comments.length})
                                    </h3>

                                    <form onSubmit={handleCommentSubmit} className="mb-10 relative">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="写下你的想法... (Enter 换行)"
                                            className="w-full min-h-[120px] p-4 pr-14 rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500/50 focus:bg-white/10 focus:ring-0 transition-all resize-none font-sans text-sm text-[#e5e5e5] placeholder:text-white/20"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newComment.trim()}
                                            className="absolute bottom-3 right-3 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-all"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>

                                    <div className="space-y-6">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-8 text-white/20 text-sm italic">
                                                暂无评论，来坐沙发吧...
                                            </div>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment.id} className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="font-bold text-[#e5e5e5] text-sm font-sans">{comment.author}</span>
                                                        <span className="text-xs text-white/30 font-sans">
                                                            {new Date(comment.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#d4d4d4] text-sm leading-relaxed whitespace-pre-wrap">
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

                    <footer className="mt-12 pt-8 border-t border-white/5 text-center">
                        <div className="inline-block p-8 border border-white/5 rounded-full opacity-30">
                            <Logo className="w-10 h-10 invert" />
                        </div>
                        <p className="mt-8 text-sm text-white/20">
                            阅毕。感悟在此刻共鸣。
                        </p>
                    </footer>
                </motion.article>
            </main>
        </div>
    );
}
