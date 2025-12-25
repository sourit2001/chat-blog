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
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
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
    const userInitial = userEmail[0].toUpperCase();

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-[var(--bg-hover)] transition-all ${isSidebar ? 'w-full' : ''}`}
            >
                <div className="w-8 h-8 rounded-full bg-[var(--accent-main)] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {userInitial}
                </div>
                {!isSidebar && (
                    <>
                        <span className="text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
                            {userEmail}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
                {isSidebar && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate block mr-2">
                            {userEmail}
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
                        className={`absolute ${isSidebar ? 'bottom-full left-0 mb-2 w-full' : 'top-full right-0 mt-2 w-48'} bg-[var(--bg-page)] border border-[var(--border-light)] rounded-2xl shadow-xl z-[100] p-2 backdrop-blur-xl overflow-hidden`}
                    >
                        <div className="px-3 py-2 border-b border-[var(--border-light)] mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-50 mb-1">Signed in as</p>
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{userEmail}</p>
                        </div>

                        <button
                            onClick={() => {
                                signOut();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--accent-main)] hover:bg-[var(--accent-main)] hover:text-white rounded-xl transition-colors font-medium"
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
