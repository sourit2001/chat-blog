import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

function messagesToTranscript(messages: any[]): string {
  return messages
    .map((m) => {
      let content = "";
      if (typeof m.content === "string") content = m.content;
      else if (Array.isArray(m.content)) content = m.content.map((p: any) => p.text || "").join("");
      else if (m.parts && Array.isArray(m.parts)) content = m.parts.map((p: any) => p.text || "").join("");
      return `${m.role.toUpperCase()}: ${content}`;
    })
    .join("\n\n");
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const transcript = messagesToTranscript(messages || []);

    const system = `你是一位资深中文博主兼编辑，擅长把随意聊天整理为有温度、有结构的高质量 Markdown 博客。要求：
- 语言自然口语化，但条理清晰，避免命令口吻和官话。
- 先给一个吸引人的标题（以一级标题 # 开头）。
- 紧接着给 1 段 2-3 句的引言。
- 正文使用二级/三级标题组织（## / ###），并用列表、引用、代码块等增强可读性。
- 适度总结与行动建议，最后加一个“延伸阅读/思考”段落（可选）。
- 用中文输出完整 Markdown（不需要再解释你在做什么）。`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash-exp"),
      system,
      prompt: `以下是一次多角色群聊的文字记录，请据此产出一篇可直接发布的 Markdown 博客：\n\n${transcript}`,
    });

    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : "未命名文章";

    return new Response(
      JSON.stringify({ markdown: text, title }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
