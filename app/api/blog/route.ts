import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;



export async function POST(req: Request) {
    try {
        const { messages, style = 'literary', authorName = '笔者' } = await req.json();

        // Helper to extract images and replace with placeholders
        const imageMap = new Map<string, string>();
        let imageCounter = 0;

        const processedTranscript = (messages || []).map((m: any) => {
            let content = "";
            let images: string[] = [];

            // Extract from standard content string (markdown regex)
            if (typeof m.content === "string") {
                content = m.content;
                const regex = /!\[.*?\]\((.*?)\)/g;
                let match;
                while ((match = regex.exec(m.content)) !== null) {
                    if (match[1]) images.push(match[1]);
                }
                // Strip images from content to avoid double inclusion or huge base64 in text analysis
                content = content.replace(/!\[.*?\]\(.*?\)/g, '[图片]');
            }
            else if (Array.isArray(m.content)) content = m.content.map((p: any) => p.text || "").join("");

            // Extract from attachments
            if (m.experimental_attachments) {
                m.experimental_attachments.forEach((att: any) => {
                    if (att.url) images.push(att.url);
                });
            }

            // Register images
            const imagePlaceholders = images.map(url => {
                imageCounter++;
                const key = `[[IMG_${imageCounter}]]`;
                imageMap.set(key, url);
                return key;
            });

            const textPart = `${m.role.toUpperCase()}: ${content}`;
            const imagePart = imagePlaceholders.length > 0 ? `\n(包含了 ${imagePlaceholders.length} 张图片: ${imagePlaceholders.join(', ')})` : '';
            return textPart + imagePart;
        }).join("\n\n");

        const transcript = processedTranscript;
        const validAuthor = authorName?.trim() || '笔者';

        let system = '';
        const imageInstruction = imageCounter > 0
            ? `\n    8. **图片使用**：对话中包含图片占位符（如 "[[IMG_1]]"）。请务必在博客的合适位置插入这些图片，语法为 \`![图片描述]([[IMG_1]])\`。不要遗漏精彩的视觉素材。`
            : '';

        if (style === 'logical') {
            system = `你是一位思维缜密、逻辑严谨的技术博客专栏作家 "${validAuthor}"。
    你擅长从纷繁复杂的对话中提炼出核心观点、技术干货或思维模型。

    **写作目标**：
    将一段多人对话重构为一篇结构清晰、论证有力的分析式文章。

    **要求**：
    1. **标题**：使用直击痛点或概括核心结论的标题（#）。
    2. **结构化**：必须使用层级分明的标题（##, ###）。
    3. **提炼与总结**：不要流水账记录对话。要归纳出“核心议题”、“各方观点差异”、“最终结论”或“行动建议”。
    4. **列表与引用**：多用无序列表、有序列表展示要点。涉及关键数据或金句时可使用引用。
    5. **语气**：客观、理性、专业。
    6. **第一人称**：文章以第一人称“我”的视角撰写。你就是 "${validAuthor}"，但在正文中**请完全使用“我”来指代自己，严禁出现 "${validAuthor}" 这个名字**。${imageInstruction}`;
        } else if (style === 'record') {
            system = `你是一位观察敏锐的会议记录员或剧本整理师 "${validAuthor}"。
    你的任务是将一段对话忠实地、清晰地整理为“对话实录”。

    **写作目标**：
    还原对话现场，保留互动的真实感，但去除无效的废话，整理为可读性强的剧本式或访谈式文档。

    **要求**：
    1. **标题**：例如“关于 [主题] 的深度对谈记录”。
    2. **导语**：用一段话介绍对话背景、参与人物（及他们的立场简述）。
    3. **对话还原**：保留精彩的问答互动。格式上可以使用“**角色A**：内容”的形式，或者更现代的排版。
    4. **高光时刻**：对于特别精彩的发言，可以高亮显示或单独摘录。
    5. **语气**：中立、客观。你是记录者 "${validAuthor}"，但在文中**请完全使用“我”或“记录者”来指代自己，严禁出现 "${validAuthor}" 这个名字**。
    6. **结语**：简短总结对话氛围或未尽事宜。${imageInstruction}`;
        } else {
            // Default: Literary
            system = `你是一位极具文学素养的内容创作者 "${validAuthor}"。
    你擅长将多人的灵感碎片，编织成具有深厚情感价值和优美文字表达的文学博客。

    **写作目标**：
    产出字里行间流露着“文艺、干净、高级”质感的内容。

    **要求**：
    1. **标题之美**：创作一个具有意境感的、诗意的一级标题（#）。
    2. **沉浸式表达**：直接进入主题，文字要连贯、有呼吸感。禁止使用“点评：”、“小结：”等生硬标签。
    3. **结构内敛**：使用优雅的二级标题（##）或三级标题（###）进行自然过渡。
    4. **视觉留白**：文字不要过于密集。巧妙地使用空行。
    5. **文风把控**：偏向散文或随笔的风格。根据聊天内容，或温柔细腻，或清冷睿智。
    6. **第一人称**：全文以第一人称“我”的主观视角叙述。你就是 "${validAuthor}"，但在文中**请完全使用“我”来指代自己，严禁出现 "${validAuthor}" 这个名字**。
    7. **纯净输出**：直接输出 Markdown源码。${imageInstruction}`;
        }

        const prompt = `以下是一次多角色对话的文字记录，请以创作者 "${validAuthor}" 的身份，撰写一篇${style === 'logical' ? '逻辑严密' : style === 'record' ? '实录风格' : '文艺风格'}的 Markdown 博客：\n\n${transcript}`;

        const { text } = await generateText({
            // @ts-ignore
            model: google("gemini-3-flash-preview"),
            system,
            prompt,
        });

        let finalText = text;
        imageMap.forEach((url, placeholder) => {
            finalText = finalText.split(placeholder).join(url);
        });

        const titleMatch = finalText.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1].trim() : "无题";

        return new Response(
            JSON.stringify({ markdown: finalText, title }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
