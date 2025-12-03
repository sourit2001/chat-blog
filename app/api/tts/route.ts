import { NextRequest } from "next/server";

const REPLICATE_VERSION = "43b17801b02267d0baf70071ff440358f75499f20ad5c51118a2fdad14ba9b8c";

// 使用 MiniMax TTS 支持的实际 voice_id - 五位男主全部为男声，但音色各不相同
// 参考: https://replicate.com/minimax/speech-02-turbo/readme
const voicePresets: Record<string, string> = {
  female: "Chinese (Mandarin)_Sweet_Lady",
  male: "Chinese (Mandarin)_Gentleman",
  // 恋与深空男主专属声音（均为男性音色）：
  shenxinghui: "R8_06O5P5Z3",                               // 沈星回：指定自定义 Voice ID
  qinche: "Chinese (Mandarin)_Reliable_Executive",         // 秦彻：可靠高管（成熟低沉）
  qiyu: "Chinese (Mandarin)_Straightforward_Boy",          // 祁煜：直率少年（活泼直接）
  lishen: "Chinese (Mandarin)_Gentleman",                  // 黎深：绅士温和男声
  xiayizhou: "Chinese (Mandarin)_Southern_Young_Man",      // 夏以昼：南方年轻人（温暖亲切）
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
    console.log(`TTS request: voice=${voice}, voice_id=${voice_id}, text=${text.slice(0, 50)}...`);

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
          emotion: "neutral",
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
