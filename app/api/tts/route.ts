import { NextRequest } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const REPLICATE_VERSION = "43b17801b02267d0baf70071ff440358f75499f20ad5c51118a2fdad14ba9b8c";

// 使用 MiniMax TTS 支持的实际 voice_id - 五位男主全部为男声，但音色各不相同
// 参考: https://replicate.com/minimax/speech-02-turbo/readme
const voicePresets: Record<string, string> = {
  female: "Chinese (Mandarin)_Sweet_Lady",
  male: "Chinese (Mandarin)_Gentleman",
  // 恋与深空男主专属声音（均为男性音色）：
  shenxinghui: "R8_06O5P5Z3",                               // 沈星回：指定自定义 Voice ID
  qinche: "Chinese (Mandarin)_Unrestrained_Young_Man",        // 秦彻：放荡不羁少年
  qiyu: "Chinese (Mandarin)_Stubborn_Friend",              // 祁煜：固执的朋友
  lishen: "Chinese (Mandarin)_Gentleman",                  // 黎深：绅士温和男声
  xiayizhou: "Chinese (Mandarin)_Southern_Young_Man",      // 夏以昼：南方年轻人（温暖亲切）
  // MBTI 角色声音映射：
  // 分析家 (Analysts) - 紫色
  INTJ: "Chinese (Mandarin)_Gentleman",               // 深沉、稳重
  INTP: "Chinese (Mandarin)_Gentle_Senior",           // 温和、智慧
  ENTJ: "Chinese (Mandarin)_Unrestrained_Young_Man",  // 强势、果断
  ENTP: "Chinese (Mandarin)_Stubborn_Friend",         // 机智、爱抬杠

  // 外交官 (Diplomats) - 绿色
  INFJ: "Chinese (Mandarin)_Sweet_Lady",              // 温柔、坚定
  INFP: "Chinese (Mandarin)_Soft_Girl",               // 柔软、治愈
  ENFJ: "Chinese (Mandarin)_Refreshing_Young_Man",    // 热情、领袖感
  ENFP: "Chinese (Mandarin)_Pure-hearted_Boy",        // 活力、单纯

  // 守护者 (Sentinels) - 蓝色
  ISTJ: "Chinese (Mandarin)_Gentleman",               // 严谨、务实
  ISFJ: "Chinese (Mandarin)_Sweet_Lady",              // 温暖、照顾
  ESTJ: "Chinese (Mandarin)_Unrestrained_Young_Man",  // 强硬、管理
  ESFJ: "Chinese (Mandarin)_Sweet_Lady",              // 热情、周到

  // 探险家 (Explorers) - 黄色
  ISTP: "Chinese (Mandarin)_Stubborn_Friend",         // 酷、冷静
  ISFP: "Chinese (Mandarin)_Soft_Girl",               // 灵动、艺术
  ESTP: "Chinese (Mandarin)_Unrestrained_Young_Man",  // 无畏、冲动
  ESFP: "Chinese (Mandarin)_Pure-hearted_Boy",        // 指挥、表演
};

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "缺少要朗读的文本" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ error: "缺少 REPLICATE_API_TOKEN" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const voice_id = voicePresets[voice as keyof typeof voicePresets] || voicePresets.female;

    // 智能情绪识别：使用 Gemini Flash 快速分析文本情感
    let detectedEmotion = "happy"; // 默认为开心
    try {
      const { text: sentiment } = await generateText({
        model: google("gemini-2.5-flash"),
        system: "Analyze the sentiment of the text. Return exactly one of: neutral, happy, sad, angry, fearful, surprised, calm. Focus on the predominant emotion.",
        prompt: text,
      });
      const cleaned = sentiment.trim().toLowerCase();
      // 更加鲁棒的关键词匹配
      const emotions = ["neutral", "happy", "sad", "angry", "fearful", "surprised", "calm"];
      const matched = emotions.find(e => cleaned.includes(e));
      if (matched) {
        detectedEmotion = matched;
      }
    } catch (e: any) {
      console.warn("Sentiment analysis failed:", e?.message || e);
      console.warn("Fallback to happy");
    }

    console.log(`TTS request: voice=${voice}, voice_id=${voice_id}, emotion=${detectedEmotion}, text=${text.slice(0, 50)}...`);

    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: REPLICATE_VERSION,
        input: {
          text,
          voice_id,
          emotion: detectedEmotion,
          language_boost: "Chinese",
          english_normalization: false,
        },
      }),
    });

    if (!createRes.ok) {
      const errorText = await createRes.text();
      console.error("Replicate TTS create error:", errorText);
      return new Response(JSON.stringify({ error: "Replicate 语音创建失败" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let prediction = await createRes.json();

    // 轮询直到完成
    while (prediction.status === "starting" || prediction.status === "processing") {
      await new Promise((r) => setTimeout(r, 800));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!pollRes.ok) {
        const errorText = await pollRes.text();
        console.error("Replicate TTS poll error:", errorText);
        return new Response(JSON.stringify({ error: "Replicate 语音轮询失败" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      prediction = await pollRes.json();
    }

    if (prediction.status !== "succeeded") {
      console.error("Replicate prediction failed", prediction);
      return new Response(JSON.stringify({ error: "Replicate 语音生成失败" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const output = prediction.output;
    const audioUrl = Array.isArray(output) ? output[0] : output;

    if (!audioUrl || typeof audioUrl !== "string") {
      console.error("Replicate TTS missing audio url", prediction);
      return new Response(JSON.stringify({ error: "未获得音频 URL" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ audioUrl }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("TTS route error", error);
    return new Response(JSON.stringify({ error: error?.message || "TTS 接口异常" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
