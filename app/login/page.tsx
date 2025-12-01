"use client";

import React, { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 先尝试登录，不存在再注册
      const { data: signInData, error: signInError } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // 如果是用户不存在，尝试注册
        const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: undefined },
        });
        if (signUpError) throw signUpError;
        // 若禁用邮箱确认，通常会直接返回 session；
        // 若仍未返回 session，但用户存在且未确认，则提示配置问题，避免再次触发 Email not confirmed。
        if (!signUpData.session) {
          const confirmedAt = (signUpData.user as any)?.email_confirmed_at;
          if (!confirmedAt) {
            throw new Error('当前后台仍要求邮箱确认：请在 Supabase Auth → Providers → Email 关闭 Confirm email，并删除已创建的未确认用户后重试。');
          }
          // 如果已经确认（极少数场景），再尝试登录一次
          const { error: signInAfterSignUpError } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
          });
          if (signInAfterSignUpError) throw signInAfterSignUpError;
        }
      }

      router.replace("/");
    } catch (err: any) {
      console.error("Auth error", err);
      setError(err?.message || "登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-sm bg-white/90 shadow-xl rounded-2xl p-6 border border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900 mb-1 text-center">登录 / 注册</h1>
        <p className="text-xs text-gray-500 mb-4 text-center">使用邮箱和密码登录，首次输入会自动注册账号</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white"
              placeholder="至少 6 位"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-md px-2 py-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-2 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "处理中..." : "进入聊天"}
          </button>
        </form>
      </div>
    </main>
  );
}
