"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Send, Menu, Sparkles, StopCircle, Copy, Trash2, Check, FileText, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import AudioVisualizer from "@/components/AudioVisualizer";
import ReactMarkdown from "react-markdown";

type ParsedMbtiReply = {
  intro: string;
  roles: { role: string; text: string }[];
};

const allMbtiRoles = ["ENTJ", "ISTJ", "ENFP", "INFP", "ENFJ"] as const;

const getRoleAvatarClass = (role: string) => {
  switch (role) {
    case 'ENTJ':
      return 'from-emerald-500 to-emerald-700';
    case 'ISTJ':
      return 'from-sky-500 to-cyan-600';
    case 'ENFP':
      return 'from-orange-400 to-amber-500';
    case 'INFP':
      return 'from-teal-400 to-emerald-500';
    case 'ENFJ':
      return 'from-rose-400 to-pink-500';
    default:
      return 'from-emerald-500 to-lime-500';
  }
};

const getRoleStatusText = (role: string) => {
  switch (role) {
    case 'ENTJ':
      return '正在快速扫一眼全局，还在想怎么帮你定方向。';
    case 'ISTJ':
      return '在一旁默默记笔记，等你说完再补充细节和 checklist。';
    case 'ENFP':
      return '脑子里已经开了十个脑洞，只是在挑哪一个最好玩。';
    case 'INFP':
      return '认真听着你的情绪变化，在琢磨这件事对你意味着什么。';
    case 'ENFJ':
      return '在整理大家刚才的点子，准备帮你收个小结。';
    default:
      return '在旁边听着，还没决定要不要插话。';
  }
};

function MbtiReply({ parsed, messageId }: { parsed: ParsedMbtiReply; messageId: string }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (!parsed.roles.length) return;

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      if (index > parsed.roles.length) {
        clearInterval(interval);
        return;
      }
      setVisibleCount(index);
    }, 700);

    return () => clearInterval(interval);
  }, [parsed, messageId]);

  const visibleRoles = parsed.roles.slice(0, visibleCount || 1);
  const spokenRoles = new Set(parsed.roles.map((r) => r.role));
  const silentRoles = allMbtiRoles.filter((r) => !spokenRoles.has(r));

  return (
    <div className="space-y-2">
      {parsed.intro && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-tr from-emerald-500 to-lime-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="p-3 rounded-2xl max-w-[85%] backdrop-blur-sm bg-white/10 text-gray-200 rounded-tl-none">
            <div className="text-sm prose prose-invert max-w-none">
              <ReactMarkdown>{parsed.intro}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {visibleRoles.map((block) => (
        <div key={`${messageId}-${block.role}`} className="flex gap-3">
          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-gradient-to-tr ${getRoleAvatarClass(block.role)}`}>
            <span className="text-[10px] font-semibold">{block.role}</span>
          </div>
          <div className="p-3 rounded-2xl max-w-[85%] backdrop-blur-sm bg-white/10 text-gray-200 rounded-tl-none">
            <div className="text-sm prose prose-invert max-w-none">
              <ReactMarkdown>{block.text}</ReactMarkdown>
            </div>
          </div>
        </div>
      ))}

      {silentRoles.length > 0 && (
        <div className="mt-1 flex flex-col gap-1 pl-11">
          {silentRoles.map((role) => (
            <div
              key={`${messageId}-${role}-status`}
              className="flex items-center gap-2 text-xs text-gray-500"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-tr ${getRoleAvatarClass(role)} opacity-40`}
              >
                <span className="text-[9px] font-semibold">{role}</span>
              </div>
              <span>{getRoleStatusText(role)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { messages, sendMessage, status, setMessages } = useChat({
    onError: (err) => console.error("Chat error:", err),
  });

  const [isRecording, setIsRecording] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [copied, setCopied] = useState(false);
  const [blogDraft, setBlogDraft] = useState<{ title: string; markdown: string } | null>(null);
  const [blogLoading, setBlogLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef(inputValue);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const [sttError, setSttError] = useState<string | null>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Keep inputRef synced with inputValue
  useEffect(() => {
    inputRef.current = inputValue;
  }, [inputValue]);

  // Helper to extract text content from message
  const getMessageContent = (message: any) => {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content.map((p: any) => p.text || '').join('');
    }
    // Fallback for messages with parts but no content (e.g. from sendMessage with parts)
    if (message.parts && Array.isArray(message.parts)) {
      return message.parts.map((p: any) => p.text || '').join('');
    }
    return '';
  };

  const parseMbtiGroupReply = (content: string) => {
    const lines = content.split('\n');
    const roles = ["ENTJ", "ISTJ", "ENFP", "INFP", "ENFJ"] as const;
    type Role = (typeof roles)[number];

    let introLines: string[] = [];
    let currentRole: Role | null = null;
    let buffer: string[] = [];
    const roleBlocks: { role: Role; text: string }[] = [];

    // 允许前面有 Markdown 标记或列表前缀，例如 - ENTJ：、* ENFP：、**ENTJ：、### ENTJ：
    const roleRegex = /^[-*\s]*(?:\*{1,3}|#+)?\s*(ENTJ|ISTJ|ENFP|INFP|ENFJ)[：:]/;

    for (const line of lines) {
      const match = line.match(roleRegex);
      if (match) {
        if (currentRole) {
          roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
        } else if (buffer.length > 0) {
          introLines = buffer.slice();
        }
        currentRole = match[1] as Role;
        buffer = [line.replace(roleRegex, '').trim()];
      } else {
        buffer.push(line);
      }
    }

    if (currentRole) {
      roleBlocks.push({ role: currentRole, text: buffer.join('\n').trim() });
    } else if (buffer.length > 0 && introLines.length === 0) {
      introLines = buffer.slice();
    }

    return {
      intro: introLines.join('\n').trim(),
      roles: roleBlocks,
    };
  };

  // Text-to-Speech for AI responses
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const content = getMessageContent(lastMessage);

      if (lastMessage.role === 'assistant' && lastMessage.id !== lastSpokenMessageIdRef.current) {
        lastSpokenMessageIdRef.current = lastMessage.id;
        if (content) speak(content);
      }
    }
  }, [messages, isLoading]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN'; // Chinese
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh') && !v.name.includes('Hong Kong')); // Prefer mainland Chinese
      if (zhVoice) utterance.voice = zhVoice;

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopy = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const content = getMessageContent(lastMessage);
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const clearChat = () => {
    setMessages([]);
    window.speechSynthesis.cancel();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const content = inputValue;
    setInputValue(""); // Clear input immediately

    try {
      await sendMessage({ role: 'user', content } as any);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const setupRecognition = () => {
    try {
      if (typeof window === 'undefined') return;
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSttError('语音识别不可用：请使用 Chrome（桌面版），或确认浏览器支持 Web Speech API。');
        return;
      }
      if (!isSecure) {
        setSttError('语音识别需要在 https 或 localhost 环境下运行，请切换到安全环境再试。');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          const newValue = inputRef.current + finalTranscript;
          setInputValue(newValue);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (inputRef.current.trim()) {
              stopRecording();
              const content = inputRef.current;
              setInputValue('');
              sendMessage({ role: 'user', content } as any).catch(err => console.error('Auto-send failed:', err));
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setSttError(`语音识别错误：${event.error}`);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsRecording(false);
        try { recognition.stop(); } catch {}
      };

      recognitionRef.current = recognition;
      setSttError(null);
    } catch (e: any) {
      console.error('setupRecognition failed', e);
      setSttError(`语音识别初始化失败：${e?.message || e}`);
    }
  };

  useEffect(() => {
    setupRecognition();
  }, [sendMessage]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);
      recognitionRef.current?.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
      setAudioStream(null);
    }
    setIsRecording(false);
    recognitionRef.current?.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <main className="flex flex-col h-[100dvh] bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold text-lg tracking-tight">IdeaFlow</h1>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                title="Copy last response"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={async () => {
                  try {
                    setBlogLoading(true);
                    const res = await fetch('/api/blog', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ messages }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Failed to generate blog');
                    setBlogDraft({ title: data.title, markdown: data.markdown });
                  } catch (e) {
                    console.error('Blog generation failed', e);
                    alert('生成博客失败，请重试');
                  } finally {
                    setBlogLoading(false);
                  }
                }}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white disabled:opacity-50"
                title="生成博客"
                disabled={blogLoading}
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-red-400"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-500 flex-shrink-0 flex items-center justify-center mt-1">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/10 p-3 rounded-2xl rounded-tl-none max-w-[85%] backdrop-blur-sm">
              <p className="text-sm text-gray-200">
                Hello! I'm your creative partner. Tell me what's on your mind, and let's turn it into a blog post.
              </p>
            </div>
          </div>
        )}

        {messages.map((m: any) => {
          const content = getMessageContent(m);
          const parsed = m.role === 'assistant' ? parseMbtiGroupReply(content) : null;
          const hasRoles = parsed && parsed.roles.length > 0;

          // 普通消息（用户，或无法解析为 MBTI 群聊的助手消息）
          if (m.role !== 'assistant' || !hasRoles) {
            return (
              <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${m.role === 'user' ? 'bg-gray-700' : 'bg-gradient-to-tr from-emerald-500 to-lime-500'}`}>
                  {m.role === 'user' ? <div className="text-xs">You</div> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <div className={`p-3 rounded-2xl max-w-[85%] backdrop-blur-sm ${m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white/10 text-gray-200 rounded-tl-none'}`}>
                  <div className="text-sm prose prose-invert max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <MbtiReply key={m.id} parsed={parsed!} messageId={m.id} />
          );
        })}
      </div>

      {/* Blog Preview Panel */}
      {blogDraft && (
        <div className="border-t border-white/10 bg-black/70 backdrop-blur-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-300">
              <FileText className="w-4 h-4" />
              <span className="text-sm">博客草稿预览</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBlogDraft(null)}
                className="px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/15"
              >关闭</button>
              <button
                onClick={() => {
                  const blob = new Blob([blogDraft.markdown], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  const safeTitle = (blogDraft.title || 'draft').replace(/[^\w\-]+/g, '-');
                  a.href = url;
                  a.download = `${safeTitle}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-2 py-1 text-xs rounded-md bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> 下载 .md
              </button>
            </div>
          </div>
          <div className="prose prose-invert max-w-none text-sm">
            <ReactMarkdown>{blogDraft.markdown}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
        {sttError && (
          <div className="mb-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-md p-2 flex items-center justify-between">
            <span>{sttError}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSttError(null)} className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/15">忽略</button>
              <button onClick={setupRecognition} className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500">重试</button>
            </div>
          </div>
        )}
        {/* Voice Visualizer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 80, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden relative"
            >
              <AudioVisualizer stream={audioStream} isRecording={isRecording} />
              <button
                onClick={stopRecording}
                className="absolute bottom-2 right-2 p-1 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30"
              >
                <StopCircle className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <div className="flex-1 bg-white/10 rounded-2xl flex items-center p-1 pl-4 transition-colors focus-within:bg-white/15">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type or speak..."
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 py-3 min-h-[44px]"
            />
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 rounded-xl transition-all ${isRecording ? "text-red-400 bg-red-400/10" : "text-gray-400 hover:text-white"
                }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            className="p-3 bg-emerald-600 rounded-full text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!inputValue && !isRecording}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </main>
  );
}
