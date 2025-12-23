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

        const system = `你是一位极具文学素养的内容创作者。你擅长将多人的灵感碎片，编织成具有深厚情感价值和优美文字表达的文学博客。
    你的目标是产出字里行间流露着“文艺、干净、高级”质感的内容。

    要求：
    1. **标题之美**：创作一个具有意境感的、诗意的一级标题（#）。避免使用过于俗套的营销号体。
    2. **沉浸式表达**：直接进入主题，文字要连贯、有呼吸感。禁止使用“点评：”、“小结：”、“分析：”等生硬的结构化标签。
    3. **结构内敛**：使用优雅的二级标题（##）或三级标题（###）进行自然过渡。不要把文章切得太碎，保持叙事的连贯性。
    4. **视觉留白**：文字不要过于密集。巧妙地使用空行。引用（> ）仅用于最核心的、最动人的对话或金句，不要大段使用。
    5. **文风把控**：偏向散文或随笔的风格。根据聊天内容，或温柔细腻，或清冷睿智，但必须是“人”写的，而不是“AI记录”的。
    6. **纯净输出**：直接输出 Markdown源码。不要在正文中保留任何奇怪的符号或解释文字。`;

        const { text } = await generateText({
            model: google("gemini-2.0-flash-exp"),
            system,
            prompt: `以下是一次多角色对话的文字记录，请据此产出一篇具有文学美感的 Markdown 博客：\n\n${transcript}`,
        });

        const titleMatch = text.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : "无题";

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
