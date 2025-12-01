"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const dynamic = 'force-dynamic';

export default function ConversationDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!supabaseClient) {
          setError('Supabase 未配置：请设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY');
          setLoading(false);
          return;
        }
        const client = supabaseClient;
        const { data: { user }, error: userErr } = await client.auth.getUser();
        if (userErr) throw userErr;
        if (!user) {
          window.location.href = "/login";
          return;
        }
        // Load conversation
        const { data: conv, error: convErr } = await client
          .from("conversations")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();
        if (convErr) throw convErr;
        setConversation(conv);

        // Load messages with audio records
        const { data: msgs, error: msgsErr } = await client
          .from("messages")
          .select(`
            id,
            role,
            content,
            created_at,
            audio_records (
              id,
              type,
              url,
              created_at
            )
          `)
          .eq("conversation_id", id)
          .order("created_at", { ascending: true });
        if (msgsErr) throw msgsErr;
        setMessages(msgs || []);
      } catch (e: any) {
        setError(e?.message || "加载失败");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  return (
    <main className="relative flex flex-col min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-lime-50" />
      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <Logo className="w-8 h-8" showText={false} />
          <Link href="/history" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">← 返回列表</Link>
        </div>
        {loading && <p className="text-sm text-emerald-700">加载中...</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
        {conversation && (
          <div className="mb-6 p-4 rounded-2xl bg-white/90 border border-emerald-100 shadow shadow-emerald-100/60 backdrop-blur-md">
            <h1 className="text-xl font-semibold text-emerald-950">{conversation.title || "未命名会话"}</h1>
            <p className="text-xs text-emerald-700 mt-1">
              {conversation.view_mode === 'game' ? '恋与深空' : 'MBTI'} · {new Date(conversation.created_at).toLocaleString()}
            </p>
          </div>
        )}
        <div className="space-y-4">
          {(() => {
            const pairs: any[] = [];
            let i = 0;
            while (i < messages.length) {
              const msg = messages[i];
              if (msg.role === 'user') {
                // Find the next assistant message (if any)
                let assistantMsg = null;
                if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                  assistantMsg = messages[i + 1];
                  i += 2; // Skip both user and assistant
                } else {
                  i += 1; // Only user, no assistant
                }
                pairs.push({ user: msg, assistant: assistantMsg });
              } else {
                // Orphan assistant message
                pairs.push({ user: null, assistant: msg });
                i += 1;
              }
            }
            return pairs;
          })().map((pair, pairIdx) => (
            <div key={pairIdx} className="p-4 rounded-2xl bg-white/90 border border-emerald-100 shadow shadow-emerald-100/60 backdrop-blur-md space-y-3">
              {pair.user && (
                <div>
                  <div className="text-xs font-medium text-emerald-700 mb-1">你</div>
                  <div className="text-sm text-emerald-950 whitespace-pre-wrap">{pair.user.content}</div>
                  <div className="text-xs text-emerald-600 mt-1">{new Date(pair.user.created_at).toLocaleString()}</div>
                </div>
              )}
              {pair.assistant && (
                <div className="pt-3 border-t border-emerald-100">
                  <div className="text-xs font-medium text-emerald-700 mb-1">AI</div>
                  <div className="text-sm text-emerald-950 whitespace-pre-wrap">{pair.assistant.content}</div>
                  <div className="text-xs text-emerald-600 mt-1">{new Date(pair.assistant.created_at).toLocaleString()}</div>
                  {pair.assistant.audio_records && pair.assistant.audio_records.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {pair.assistant.audio_records.map((audio: any) => (
                        <div key={audio.id} className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-700">{audio.type === 'tts' ? '🔊 TTS' : '🎤 录音'}</span>
                          <audio controls src={audio.url} className="h-8 flex-1" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {!loading && !error && messages.length === 0 && (
            <p className="text-sm text-emerald-700 p-4 rounded-2xl bg-white/70 border border-emerald-100">暂无消息</p>
          )}
        </div>
      </div>
    </main>
  );
}
