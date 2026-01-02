"use client";

import React, { useEffect, useState } from 'react';
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import {
    getRoleEmoji,
    getRoleAvatar,
    getRoleLabel,
    getRoleColor,
    allMbtiRoles
} from '@/utils/mbtiUtils';

interface MbtiReplyProps {
    parsed: any;
    messageId: string;
    theme?: any;
    viewMode: 'mbti' | 'game';
    selectedGameRoles?: string[];
    onDelete?: (id: string) => void;
    forceShowAll?: boolean;
    isDarkBg?: boolean;
    accentColor?: string;
    audioRecords?: any[];
}

export function MbtiReply({
    parsed,
    messageId,
    viewMode,
    selectedGameRoles,
    onDelete,
    forceShowAll = false,
    isDarkBg = false,
    accentColor = "#F59E0B",
    audioRecords = []
}: MbtiReplyProps) {
    const [visibleCount, setVisibleCount] = useState(forceShowAll ? parsed.roles.length : 0);

    useEffect(() => {
        if (!forceShowAll) {
            setVisibleCount(0);
        }
    }, [messageId, forceShowAll]);

    useEffect(() => {
        if (forceShowAll || parsed.roles.length === 0) return;
        if (visibleCount >= parsed.roles.length) return;

        const interval = setInterval(() => {
            setVisibleCount((prev: number) => (prev >= parsed.roles.length ? prev : prev + 1));
        }, 600);
        return () => clearInterval(interval);
    }, [parsed.roles.length, visibleCount, forceShowAll]);

    const effectiveVisibleCount = forceShowAll ? parsed.roles.length : (visibleCount || 1);
    const visibleRoles = parsed.roles.slice(0, effectiveVisibleCount);
    const spokenRoles = new Set(parsed.roles.map((r: any) => r.role));

    // Filter and sort audio records for consistent indexing
    const ttsAudio = (audioRecords || [])
        .filter(a => a.type === 'tts')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const allowedSlots = (Array.isArray(selectedGameRoles) && selectedGameRoles.length > 0)
        ? selectedGameRoles
        : (viewMode === 'game' ? ['沈星回', '黎深', '祁煜', '夏以昼', '秦彻'] : allMbtiRoles);

    return (
        <div className={`space-y-6`}>
            {/* 1. Intro Bubble (AI System/Narration) */}
            {parsed.intro && (
                <div className="flex gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center mt-1"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.5)',
                            backdropFilter: forceShowAll ? 'none' : 'blur(10px)'
                        }}
                    >
                        <Sparkles className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div
                        className={`p-4 rounded-2xl max-w-[90%] shadow-sm rounded-tl-sm`}
                        style={{
                            backgroundColor: forceShowAll ? '#ffffff' : (isDarkBg ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}
                    >
                        <div
                            className={`text-sm max-w-none leading-relaxed`}
                            style={{ color: isDarkBg ? '#cbd5e1' : '#475569' }}
                        >
                            <ReactMarkdown>{parsed.intro}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Individual Role Bubbles */}
            {visibleRoles.map((block: any, idx: number) => {
                const roleColor = getRoleColor(block.role, viewMode);
                return (
                    <div
                        key={`${messageId}-${block.role}-${idx}`}
                        className="flex gap-3"
                    >
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    backgroundColor: '#ffffff',
                                    border: `2px solid ${roleColor}`,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                            >
                                {viewMode === 'game' && getRoleAvatar(block.role, viewMode) ? (
                                    <img src={getRoleAvatar(block.role, viewMode)!} alt={block.role} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl drop-shadow-sm">{getRoleEmoji(block.role, viewMode)}</span>
                                )}
                            </div>
                        </div>

                        {/* Content Bubble */}
                        <div className="flex-1 max-w-[85%] space-y-1">
                            <div className="flex items-center gap-2 ml-1">
                                <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: roleColor }}>
                                    {getRoleLabel(block.role, viewMode)}
                                </span>
                            </div>

                            <div
                                className={`p-4 rounded-2xl relative overflow-hidden ${forceShowAll ? '' : 'backdrop-blur-sm'} transition-colors`}
                                style={{
                                    backgroundColor: forceShowAll ? '#f8fafc' : `${roleColor}08`,
                                    borderColor: forceShowAll ? '#e2e8f0' : `${roleColor}15`,
                                    borderWidth: '1px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                                }}
                            >
                                {/* Accent line on the left inside the bubble */}
                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: roleColor }} />
                                <div
                                    className={`text-[14.5px] max-w-none leading-relaxed font-medium`}
                                    style={{ color: isDarkBg ? '#f8fafc' : '#1e293b' }}
                                >
                                    <ReactMarkdown>{block.text}</ReactMarkdown>
                                </div>
                                {ttsAudio[idx] && (
                                    <div className="mt-3 pt-2 border-t border-dashed border-slate-200/50">
                                        <audio controls src={ttsAudio[idx].url} className="h-6 w-full max-w-[200px] opacity-40 hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {parsed.outro && (forceShowAll || visibleCount >= parsed.roles.length) && (
                <div className="flex gap-3 justify-end pr-4">
                    <div
                        className={`p-4 rounded-2xl border border-dashed max-w-[80%] relative`}
                        style={{
                            backgroundColor: forceShowAll ? '#f8fafc' : (isDarkBg ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'),
                            borderColor: '#e2e8f0',
                            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <div
                            className={`absolute -top-2 left-4 px-2 text-[10px] font-bold uppercase tracking-tighter`}
                            style={{
                                backgroundColor: forceShowAll ? '#ffffff' : '#f8fafc',
                                color: '#94a3b8'
                            }}
                        >总结</div>
                        <div
                            className={`text-sm italic leading-relaxed`}
                            style={{ color: isDarkBg ? '#94a3b8' : '#64748b' }}
                        >
                            <ReactMarkdown>{parsed.outro}</ReactMarkdown>
                        </div>
                        {ttsAudio[parsed.roles.length] && (
                            <div className="mt-2 text-right">
                                <audio controls src={ttsAudio[parsed.roles.length].url} className="h-6 w-full max-w-[200px] opacity-40 hover:opacity-100 transition-opacity ml-auto" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
