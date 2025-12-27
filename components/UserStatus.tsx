"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface UserStatusProps {
    className?: string;
    isSidebar?: boolean;
}

export function UserStatus({ className, isSidebar = false }: UserStatusProps) {
    const { user, loading, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [nickname, setNickname] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user_global_nickname');
        if (stored) setNickname(stored);
    }, []);

    const handleSaveNickname = (newVal: string) => {
        setNickname(newVal);
        localStorage.setItem('user_global_nickname', newVal);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setIsEditing(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (loading) {
        return <div className={`w-8 h-8 rounded-full bg-[var(--bg-hover)] animate-pulse ${className}`} />;
    }

    if (!user) {
        return (
            <Link
                href="/login"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-full transition-all ${className}`}
            >
                <LogIn className="w-4 h-4" />
                <span>登录</span>
            </Link>
        );
    }

    const userEmail = user.email || '用户';
    const displayName = nickname || userEmail;
    const userInitial = displayName[0].toUpperCase();

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-[var(--bg-hover)] transition-all ${isSidebar ? 'w-full' : ''}`}
            >

                {!isSidebar && (
                    <>
                        <span className="text-sm font-bold text-[var(--text-primary)] max-w-[120px] truncate">
                            {displayName}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
                {isSidebar && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="text-sm font-bold text-[var(--text-primary)] truncate block mr-2 text-left">
                            {displayName}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute ${isSidebar ? 'bottom-full left-0 mb-2 w-full min-w-[200px]' : 'top-full right-0 mt-2 w-64'} bg-[var(--bg-page)] border border-[var(--border-light)] rounded-2xl shadow-xl z-[100] p-2 backdrop-blur-xl overflow-hidden`}
                    >
                        <div className="px-3 py-3 border-b border-[var(--border-light)] mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-50 mb-1">Account</p>
                            <p className="text-xs font-medium text-[var(--text-secondary)] truncate mb-3">{userEmail}</p>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wide">昵称</label>
                                <input
                                    value={nickname}
                                    onChange={(e) => handleSaveNickname(e.target.value)}
                                    placeholder="设置显示昵称"
                                    className="w-full text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-hover)] rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[var(--accent-main)]/20 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--accent-main)] hover:bg-[var(--accent-main)] hover:text-white rounded-xl transition-colors font-bold mt-1"
                            style={{ '--tw-bg-opacity': '0.1' } as any}
                        >
                            <LogOut className="w-4 h-4" />
                            <span>退出登录</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
