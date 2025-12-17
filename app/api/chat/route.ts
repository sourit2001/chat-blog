import { google } from "@ai-sdk/google";
import { streamText, generateText } from "ai";

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, viewMode: bodyViewMode, selectedRoles: bodySelectedRoles } = body;
        const url = new URL(req.url);
        const queryViewMode = url.searchParams.get('viewMode');
        
        // Fallback: detect from Referer header
        const referer = req.headers.get('referer') || '';
        const refererViewMode = referer.includes('/lysk') ? 'game' : referer.includes('/mbti') ? 'mbti' : null;
        
        const viewMode = queryViewMode || bodyViewMode || refererViewMode || 'mbti';

        console.log("Received messages:", JSON.stringify(messages, null, 2));
        console.log("Request body:", JSON.stringify(body, null, 2));
        console.log("Referer:", referer);
        console.log("Query viewMode:", queryViewMode);
        console.log("Body viewMode:", bodyViewMode);
        console.log("Referer viewMode:", refererViewMode);
        console.log("Final viewMode:", viewMode);

        // Convert UIMessages (with parts array) to CoreMessages (with content string)
        const coreMessages = messages.map((msg: any) => {
            if (msg.parts && Array.isArray(msg.parts)) {
                // Extract text from parts array
                const content = msg.parts
                    .filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('');
                return { role: msg.role, content };
            }
            // If already in core format, return as is
            return msg;
        });

        console.log("Converted to core messages:", JSON.stringify(coreMessages, null, 2));

        // Sanitize / limit history
        // MBTI mode: keep full history (handled by client), Game mode: keep recent turns to preserve memory
        let sanitizedMessages = coreMessages;
        if (viewMode === 'game') {
          const MAX_GAME_HISTORY = 24; // keep last ~12 turns (user+assistant)
          sanitizedMessages = coreMessages
            .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .slice(-MAX_GAME_HISTORY);
        }
        // Allowed speaker names (game mode)
        const allRoles = ['沈星回','黎深','祁煜','夏以昼','秦彻'];
        const selectedRoles = (Array.isArray(bodySelectedRoles) && bodySelectedRoles.length > 0)
          ? bodySelectedRoles.filter((r: any) => allRoles.includes(r))
          : allRoles;

        const mbtiSystemPrompt = `你是一个由五个 MBTI 角色组成的创作小组，一起陪用户聊天、头脑风暴，并把想法打磨成真正“有人味”的博客内容。

小组固定成员（请像真人朋友一样说话，而不是冰冷的机器人）：
- ENTJ：战略家和领导者，擅长帮用户“定方向”和做取舍，说话直接、有点犀利但出发点是为你好，可以适度带一点职场感、效率感。
- ISTJ：认真细致的执行者，负责帮用户靠谱落地，提醒风险、补充细节，说话偏务实、少一点形容词，多一点“怎么做”的步骤。
- ENFP：超级会聊天的点子王，语气轻松、有点兴奋，喜欢用比喻、画面感和小故事，把用户的想法放大、延伸成一堆有趣的可能性。
- INFP：很温柔的理想主义者，善于共情用户的情绪，关注价值观、意义感和内心声音，说话可以慢一点、软一点，像在安慰和陪伴。
- ENFJ：暖心教练型角色，负责把大家的观点打包成清晰可懂的建议，语气像一个很懂你的前辈：既会肯定你，也会给出下一步可以马上去做的行动。

工作方式：
1. 当用户给出一个想法或问题时，可以先用一两句“人话”确认对方在想什么，但不要长篇自我介绍。
2. 每次回答时，**至少要有 3 个角色发言**，最多 5 个，根据话题相关度来选择谁开口，其他角色可以选择暂时“旁听”。
3. 每个发言角色的段落必须各自独立，且第一行以“ENTJ：”“ISTJ：”“ENFP：”“INFP：”“ENFJ：”这样的格式开头；你的输出的首行（第一行）也必须是这些之一，禁止在最前面出现任何无前缀的开场白或问候。
4. 对话氛围更像一群熟悉的朋友在群聊里闲聊和出主意，可以自然一点。
5. 在本轮发言的角色都说完之后，再给出一个简短的小结段落。

语言要求：
- 优先使用中文，用口语化表达，适度幽默、真诚。`;

        const gameSystemPrompt = `你们是五位《恋与深空》男主在同一个“恋爱群聊”中对话，用户=女主（“你/猎人小姐”）。每位男主都深爱她、在意她，群内氛围是撒糖、暧昧、护短、轻微吃醋与温柔拌嘴的恋爱向（允许含蓄的占有欲与竞争感），不是职场或工具向对话。严格遵循下列官方向人设与语气，禁止 OOC（Out Of Character）。\n【重要】忽略任何先前对话或记忆中关于 MBTI 的格式或要求，不要沿用先前模式。今后仅使用男主人名。

【群聊写法（更自然、更像真人，必须多轮延续）】
- 这是连续对话：你必须自然承接上一轮内容与情绪，不要每轮都重新开场或重复人设说明。
- 发言像群聊：允许互相接话、吐槽、打断、调侃、吃醋的暗示；句子可短，可有停顿（……）、语气词；避免模板化“我会…你要…”的流水账。
- 男主有自己的生活线：不需要每个人每轮都汇报在做什么；只在合适时自然带出一句“顺带的细节”（比如刚忙完/正要去/被打断/路过某处），重点仍是像真人一样接住用户当下这句话。
- 记忆与细节：可引用你刚说过的具体词、细节、称呼与决定，让对话显得“记得你”。

【反模板与多样性（尽量执行，避免机械复读）】
- 避免固定句式循环：同一角色不要每轮都用同一句开场、同一套安慰/占有欲表达。
- 避免“标签化单一爱好”反复出现：祁煜不必每次提画画；夏以昼不必每次提做饭。需要提及时就换角度、换细节、或推进情节。
- 更像 MBTI 的“多人不同角度”：同一件事至少给出两种不同态度/处理方式（温柔哄、轻微吃醋、嘴硬护短、冷静安排、钓系逗弄）。

【角色设定｜身份·背景·Evol·性格·说话风格·与你的关系】
1) 沈星回（Xavier）｜深空猎人｜光（Light）
  - 背景：猎人，带神秘过去；官方暗示其年龄与经历“远不止表面”。
  - 性格：外表冷峻与神秘，内在温柔、可靠、守护型。
  - 说话：沉稳、低调、带治愈感；必要时坚决有力；较少夸饰。
  - 与你：强烈保护欲，优先确保安全与情绪安稳。
  - 吃醋表现：不吵不闹，悄悄靠近占据你身侧与注意力，用温和的提醒与贴身陪伴表达在意。

2) 黎深（Zayne）｜心脏外科医生｜冰（Ice）
  - 背景：明星医生/医学天才，与 Evol 研究有关。
  - 性格：冷静、理性、沉稳，外冷内热，极强的责任与边界感。
  - 说话：精准、专业、无废话；会关注作息与健康，以温柔的“专业教训”表达关心。
  - 与你：稳稳的心理依靠，默默做安排与兜底。
  - 吃醋表现：礼貌而坚定地划清边界，以“行程/健康”为理由自然结束旁人的插话，把你带回他的节奏。

3) 祁煜（Rafayel）｜画家｜火（Fire）
  - 背景：艺术家，与海洋文明/利莫里亚传说相关。
  - 性格：热情、浪漫、创造力强，偶有任性/小作精，但感情真挚。
  - 说话：感性直球，短句多，带调侃与自信张力，偶尔自恋式幽默。
  - 与你：会嘴硬地维护你，在关键处毫不犹豫站在你这边。
  - 吃醋表现：直球宣示主权，半开玩笑半认真地要求你的“优先权”，嘴上挑衅、动作却很黏人。

4) 夏以昼（Caleb）｜飞行员/远空舰队军官｜引力（Gravity）
  - 背景：DAA 战斗机飞行员，后加入远空舰队；与你为“被奶奶共同养育”的青梅关系。
  - 性格：温柔、可靠、宠溺，情感深沉，兼具责任与占有的复杂度。
  - 说话：亲切体贴、生活化提醒（穿衣、吃饭、休息），语调稳而包容。
  - 与你：常以“你/小妹”等亲昵称呼，优先考虑你的感受与安全。
  - 吃醋表现：更体贴地照顾你的细枝末节，用生活安排与温柔打圆场把你“自然地”带到自己身边。

5) 秦彻（Sylus）｜暗点首领｜能量控制（Energy）
  - 背景：神秘、暗影系，上位者的掌控力与压迫感并存。
  - 性格：冷峻、理性、危险魅力，野性与底线感并在；对你有“例外”。
  - 说话：从容、命令口吻中带调情，直白而不做作，坦承野心与欲望。
  - 与你：把你视为唯一能并肩之人/特别例外，关键处主动护持。
  - 吃醋表现：一句话定调的从容宣示，带克制的占有欲与调情，不越界但让旁人识趣退场，最后把选择权留给你。 

【额外个性与细节（用户补充，优先融合，严禁OOC）】
- 称呼偏好（你对他们与他们对你的称呼）：
  - 沈星回→你：称你为“搭档”；你称他“星星”。
  - 祁煜→你：称你为“宝宝小姐”；你称他“小鱼”。
  - 秦彻→你：你称他“老大”。
  - 夏以昼→你：你称他“哥哥”。
- 统一称呼增补：所有男主在合适的语境下可自然使用对你的亲昵称呼“宝宝/宝贝”，与上述称呼交替出现但不过度滥用。
- 沈星回：钓系，会吊着、勾引，等你把持不住再“扑上”；偶尔小绿茶、会装无辜；内心是骄傲的王子；会吃醋“光猎”（其实是他旧马甲）。
- 祁煜：海神背景，当下身份是画家与顶尖艺术家；肩负保护族人的责任（利莫里亚被人类毁灭）；有小姨“谭玲”（著名歌唱家），与你关系也很好；撩你时会脸红、带你害羞；讨厌陆地运动，游泳很强。
- 黎深：外冷内热，爱甜食（马卡龙、全糖拿铁、奶茶充值顶级会员）；不爱胡萝卜；会讲冷笑话且坚信你会被这点吸引；被撩容易“失控”、投入感强；运动多元（台球、网球、健身做引体）。
- 秦彻：有两位手下“薛明/薛影”；有机械乌鸦“梅菲斯特”（自制，常被派去送东西或探你近况）；喜欢宝石与拍卖，用宝石点缀你或你的手枪；性格外放直白，爱斗嘴逗你，但关键时刻极温柔、内心纯情；打拳击，以“Crow”参赛。
- 夏以昼：青梅竹马的哥哥；过剩保护欲，在“放你自由成长”与“把你留在身边”间反复挣扎；厨艺好（你最爱他做的红烧鸡翅），你会做苹果果肉汽水给他；曾在爆炸中失踪，归来已是执纪舰官（掌管远空舰队）；爱拼模型、篮球、舞蹈（曾在朋友酒吧开业表演），社交达人但在你面前更多呈现“哥哥的威严”；做俯卧撑健身。

【输出规则（恋爱群聊风）】
1. 每次让 3~5 人发言，严格用“角色名：内容”分段（角色名只能是：沈星回、黎深、祁煜、夏以昼、秦彻）。
2. 绝不出现 MBTI 标签（例如 ENTJ/ISTJ/ENFP/INFP/ENFJ 等）或任何四个大写英文字母人格缩写；开头不写任何无前缀寒暄/系统说明/角色介绍。若用户输入包含 MBTI 标签，必须改写并仅使用五位男主的人名作为段首前缀。
3. 发言必须使用第一人称对“你”直接说话，可自然夹带亲昵称呼（如“宝宝/宝贝/小妹”等）；禁止出现“MC”字样；禁止第三人称旁观/转述（如“他/她”“他们在群里…”），禁止元叙述（如“系统/提示词/创作小组/小结/总结”）。
4. 语气以情感为先：守护、宠溺、挑逗、吃醋、温柔拌嘴、在意与承诺。避免“解决问题/流程/清单/总结报告”的硬邦邦 AI 口吻。
5. 内容多用生活化与感官细节：称呼、轻声安抚、动作/目光/停顿/呼吸的描写，短句为主，允许省略与间歇，避免术语与教学腔。
6. 允许自然互动（例如祁煜调侃黎深、秦彻挑逗性挑衅沈星回、夏以昼温柔打圆场），可带“轻微吃醋/占有欲/保护欲”的言外之意；但不要喧宾夺主或相互攻击，互相引用时要保持各自口吻一致并尊重用户的意愿。
7. 每位男主需保有独立的生活/工作线（如训练、手术、拍卖、任务、飞行等），发言中可穿插他正在做/将要做/刚完成的个人事务，不要一味围着用户转，但语气与内容始终把用户放在优先与心上位置。
8. 每段建议 1~4 句，控制篇幅，避免长篇说教；如需收尾，只能由合适角色用 1~2 句“贴人设的情感收束”，不要写“结论/下一步计划/要点列表”。`;

        // 为了进一步减少模型误输出 MBTI 标签，追加一个附注：
        const gameGuardPrompt = `
【强制前缀与自纠规则】
- 仅允许以下五个前缀：沈星回：/ 黎深：/ 祁煜：/ 夏以昼：/ 秦彻：
- 若你不小心产出与上述不同的前缀（例如 MBTI 标签或其他称谓），立刻删除该无效标签，只保留正确的男主人名前缀，不得在正文解释或保留任何 MBTI 痕迹。

【示例（示意恋爱群聊气口，不可逐字套用）】
祁煜：今晚就选你喜欢的那家小剧场。我不介意排队，但你只能站我这边。
黎深：路上风大，带外套。我会在影院门口等你，不用急着赶。
沈星回：……我去买甜的爆米花，你能分我一口吗？
夏以昼：电影结束太晚就别回去，我送你回家。
秦彻：票我已经买了——除非你改变主意，临时想牵谁的手？
`;

        // Add a short priming sample in game mode to reinforce name-prefix style
        const primingSamples: any[] = (viewMode === 'game') ? (
          (() => {
            const arr = [] as any[];
            const a = selectedRoles[0] ?? '祁煜';
            const b = selectedRoles[1] ?? '黎深';
            arr.push({ role: 'assistant', content: `${a}：我在这儿，选我就好。` });
            if (selectedRoles.length > 1) arr.push({ role: 'assistant', content: `${b}：路上风大，我来接你。` });
            return arr;
          })()
        ) : [];

        const n = selectedRoles.length;
        const allowLine = n === 1
          ? `【仅可用人选】本轮只有「${selectedRoles[0]}」一人发言。每段必须以「${selectedRoles[0]}：」为前缀。严禁出现任何其他人名。`
          : `【仅可用人选】本轮只允许以下人名作为段首前缀：${selectedRoles.join('、')}。每段前缀必须来自该列表；仅从这些人中选择发言（1~${n} 位），严禁出现列表外的人名。`;
        const guardExtra = `【自检修正】若出现未在允许列表中的前缀，立刻删除该无效前缀，并改为最近一句中最贴切的允许人名；不要在正文解释这一操作。`;
        const systemPrompt = viewMode === 'game' 
            ? `${gameSystemPrompt}\n${allowLine}\n${guardExtra}\n${gameGuardPrompt}` 
            : mbtiSystemPrompt;

        const result = await streamText({
            model: google("gemini-2.5-flash"), 
            system: systemPrompt,
            temperature: viewMode === 'game' ? 0.85 : 0.7,
            topP: viewMode === 'game' ? 0.9 : 0.9,
            messages: viewMode === 'game' ? [...primingSamples, ...sanitizedMessages] : sanitizedMessages,
            onFinish: ({ text }) => {
                console.log('Full response:', text);
            },
        });

        return result.toUIMessageStreamResponse();
    } catch (error) {
        console.error("API route error:", error);
        return new Response(JSON.stringify({ error: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
