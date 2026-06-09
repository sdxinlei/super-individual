/**
 * 小红书内容工厂 - app.js
 * 功能：Claude API + Mock 降级 + 5种风格内容生成
 */

// ============================
// API Key 管理
// ============================
const XHS_API_KEY_STORAGE_KEY = 'xhs_factory_api_key';

function getApiKey() {
    return localStorage.getItem(XHS_API_KEY_STORAGE_KEY) || '';
}

function setApiKey(key) {
    localStorage.setItem(XHS_API_KEY_STORAGE_KEY, key);
}

function clearApiKey() {
    localStorage.removeItem(XHS_API_KEY_STORAGE_KEY);
    const input = document.getElementById('apiKeyInput');
    if (input) input.value = '';
    showToast('API Key 已清除');
}

// ============================
// Claude API 调用（复用文案助手模式）
// ============================
async function callClaudeAPI(apiKey, systemPrompt, userMessage) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }]
        })
    });

    if (!response.ok) {
        let errMsg;
        try {
            const err = await response.json();
            errMsg = err.error?.message || JSON.stringify(err);
        } catch {
            errMsg = await response.text();
        }
        throw new Error(`API 请求失败 (${response.status}): ${errMsg}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

// ============================
// 风格标签映射
// ============================
const STYLE_LABELS = {
    '种草': '种草推荐',
    '干货': '干货知识',
    '情感': '情感共鸣',
    '教程': '步骤教程',
    '测评': '客观测评'
};

const STYLE_EMOJIS = {
    '种草': '🔥',
    '干货': '📚',
    '情感': '💕',
    '教程': '📖',
    '测评': '📊'
};

// ============================
// System Prompt 生成（5种风格）
// ============================
function getSystemPrompt(style) {
    const basePrompt = `你是一位专业的小红书内容创作者。请根据用户提供的主题信息，生成高质量的小红书笔记。

请严格按照以下 JSON 格式输出每条笔记，不要输出其他内容：
{
  "notes": [
    {
      "title": "标题（吸引眼球，带 emoji）",
      "body": "正文内容（口语化、分段清晰，适当使用 emoji）",
      "coverText": "封面文案（一句话吸引点击）",
      "tags": ["#标签1", "#标签2", "#标签3", "#标签4", "#标签5"]
    }
  ]
}

注意：只输出 JSON 对象，不要输出 markdown 代码块包裹，不要输出其他文字。`;

    const styleRules = {
        '种草': `## 种草风格规则
- 语气：口语化、情绪化，像闺蜜强烈安利
- 关键词："绝了""必入""后悔没早用""谁懂啊""宝藏"
- 多用感叹号和 emoji 表达兴奋感
- 突出"用了之后真香"的体验感
- 正文带个人使用场景和真实感受
- 每个段落简短，多用换行`,
        '干货': `## 干货风格规则
- 语气：专业、有条理，像行业专家分享
- 结构：清单式、数据化、有编号
- 关键词："必看""干货""总结""避坑""小白必学"
- 多用数字、百分比、时间等具体信息
- 可以包含"误区""重点""技巧"子标题
- 正文逻辑清晰，分段明确`,
        '情感': `## 情感风格规则
- 语气：故事化、共鸣感，第一人称视角
- 结构：开头引入故事/场景 → 展开经历 → 观点升华
- 关键词："终于明白了""原来是这样""你有没有"
- 多用排比句和设问引发思考
- 话题可能涉及成长、职场、人际关系、自我提升
- 结尾有总结或呼吁`,
        '教程': `## 教程风格规则
- 语气：耐心、细致，像老师在一步步教
- 结构：步骤清晰，每个步骤用数字编号
- 关键词："手把手""超简单""一看就会""保姆级"
- 强调"第1步/第2步/第3步"式引导
- 可以说明需要准备的工具/材料
- 结尾可以给进阶建议`,
        '测评': `## 测评风格规则
- 语气：客观中立，像专业评测博主
- 结构：背景介绍 → 分项打分 → 优缺点对比 → 总结推荐
- 关键词："实测""打分""优缺点""对比""评分"
- 每个维度给出评分（⭐）
- 给出明确的推荐建议
- 可以用表格式排版`
    };

    return basePrompt + '\n\n' + (styleRules[style] || styleRules['种草']);
}

function buildUserMessage(data) {
    return `请根据以下信息生成 ${data.count} 条小红书笔记：

主题/关键词：${data.topic}
产品/账号定位：${data.positioning || '（未提供）'}
目标受众：${data.audience || '（未提供）'}
风格：${data.style}
字数：${data.length === 'short' ? '200字左右' : data.length === 'medium' ? '500字左右' : '1000字左右'}

请生成 ${data.count} 条不同角度的小红书笔记，以 JSON 格式返回。`;
}

// ============================
// Mock 模板（每种风格至少3条）
// ============================
const MOCK_TEMPLATES = {
    '种草': [
        (d) => ({
            title: '绝了！这个宝藏被我发现得太晚了 🔥',
            body: `家人们谁懂啊！！最近挖到的这个${d.topic}真的太好用了😭

先说说我的情况：作为一个${d.audience || '普通用户'}，之前真的踩了太多坑...

直到遇见了它，我才知道什么叫"真香"！

✨ 先说说最惊艳我的点：
真的是相见恨晚！用了之后就回不去了好吗！！

💫 使用体验：
操作简单到离谱，连我这种手残党都能轻松上手
效率直接翻倍，每天省下至少1小时！

💰 而且性价比绝了
这个价位能买到这个品质，真的是良心

${d.positioning ? '特别是做' + d.positioning + '的朋友，一定要试试！' : ''}

真的！信我！用了你一定会回来感谢我的！！
#好物推荐 #宝藏分享 #必入 #后悔没早用 #真实分享`,
            coverText: '相见恨晚的宝藏！用了就回不去了',
            tags: ['#好物推荐', '#宝藏分享', '#必入', '#后悔没早用', '#真实分享']
        }),
        (d) => ({
            title: '被问了800遍的私藏分享 🤫 一般人我不告诉他',
            body: `每次发朋友圈都有人问，今天终于来分享了！

这个${d.topic}我真的用了快半年了
从开始的不以为然，到现在离不开它

😍 先说说为什么推荐：
1. 真的太好用了！第一次用就被惊艳到
2. 操作超级简单，完全没有学习成本
3. ${d.audience ? '特别适合' + d.audience + '使用' : '谁用谁知道'}

📌 我的使用小tips：
一定要坚持用！刚开始可能感觉不明显
但是用了一周之后，效果真的绝了

💡 适合什么人群？
${d.audience ? '👉 ' + d.audience : '👉 所有人！真的不挑人'}
${d.positioning ? '👉 做' + d.positioning + '的小伙伴必入' : ''}

真的强烈推荐！不好用来找我！
#私藏分享 #好物安利 #必买清单 #人手必备 #不踩雷`,
            coverText: '私藏好物大公开！被问了800遍',
            tags: ['#私藏分享', '#好物安利', '#必买清单', '#人手必备', '#不踩雷']
        }),
        (d) => ({
            title: '0成本提升幸福感的小东西 🎯 后悔没早入',
            body: `真的真的真的！后悔没早点发现！

之前一直被朋友安利${d.topic}
我还想着："能有多好用啊？"

结果...真香定律再次应验😅

🎯 为什么这么推荐？
- 真的0成本/低成本投入
- 效果立竿见影，用了就有效
- 持久性强，不是三分钟热度

🌟 我的真实感受：
作为一个${d.audience || '普通用户'}
我对这些东西一向很挑剔
但是这个真的让我心服口服

💪 坚持使用后的变化：
工作效率提升了
生活品质也上了一个台阶

${d.positioning ? '做' + d.positioning + '的朋友真的别犹豫了！' : ''}

赶紧冲！现在知道还不晚！
#幸福感 #好物推荐 #后悔没早买 #生活好物 #值得入手`,
            coverText: '后悔没早入的宝藏！0成本提升幸福感',
            tags: ['#幸福感', '#好物推荐', '#后悔没早买', '#生活好物', '#值得入手']
        }),
        (d) => ({
            title: '谁用谁知道！这个${d.topic}真的太香了 😍',
            body: `我真的忍不住要来安利了！！

先说结论：${d.topic}，谁用谁知道，真的太香了！

🤔 为什么会接触到它？
之前在${d.audience || '各种渠道'}看到很多人推荐
抱着试试看的心态入坑了
结果一发不可收拾...

✨ 用了之后的变化：
1. 效率提升了不是一点点
2. 生活质量肉眼可见的提高
3. 连同事/朋友都问我最近状态怎么这么好

🎯 最让我惊喜的是：
完全不用费什么心思，傻瓜式操作
但是效果真的绝了！！！

${d.positioning ? '如果你也是做' + d.positioning + '的，真的不要犹豫！' : ''}

姐妹们信我！入股不亏！！
#好物分享 #真心推荐 #超级好用 #无限回购 #值得拥有`,
            coverText: '太上头了！用了就停不下来',
            tags: ['#好物分享', '#真心推荐', '#超级好用', '#无限回购', '#值得拥有']
        })
    ],
    '干货': [
        (d) => ({
            title: '做了3年${d.topic}，总结出5条黄金法则 📌',
            body: `做${d.topic}这么久，踩了无数坑才总结出来的经验
今天全部分享给${d.audience || '大家'}！

📌 黄金法则 1：方向比努力更重要
- 很多人一上来就埋头干，方向错了全白费
- 先花时间想清楚：你要解决什么问题？
- 目标用户是谁？他们真的需要吗？

📌 黄金法则 2：数据驱动决策
- 不要靠感觉，要考数据说话
- 关键指标：转化率、留存率、用户满意度
- 每周复盘数据，及时调整策略

📌 黄金法则 3：持续迭代优化
- 没有什么是一步到位的
- 小步快跑，不断试错
- 每次迭代解决一个核心问题

📌 黄金法则 4：建立系统思维
- 不要头痛医头脚痛医脚
- 从全局视角看问题
- 建立标准化流程，提高效率

📌 黄金法则 5：保持学习
- ${d.positioning || '这个领域'}变化太快
- 每周固定时间学习新知识
- 多和同行交流，打开思路

以上5条，我用了3年才悟出来
希望对${d.audience || '正在路上的你'}有帮助！

#干货分享 #经验总结 #避坑指南 #职场干货 #成长秘籍`,
            coverText: '3年经验浓缩5条黄金法则',
            tags: ['#干货分享', '#经验总结', '#避坑指南', '#职场干货', '#成长秘籍']
        }),
        (d) => ({
            title: '${d.topic}避坑指南 🚫 这5个错误90%的人都犯了',
            body: `做${d.topic}最常见的5个错误
${d.audience || '新手'}必看！避免白白浪费时间！

❌ 错误 1：目标定位不清晰
- 什么都想做，什么都没做好
- 建议：聚焦一个细分领域，做到极致
- 避免频繁切换方向

❌ 错误 2：忽略用户需求
- 自嗨型创作，不考虑用户真正要什么
- 建议：多做用户调研，了解痛点
- 内容要有价值，不能自娱自乐

❌ 错误 3：内容没有差异化
- 别人做什么你也做什么
- 建议：找到自己的独特角度
${d.positioning ? '- ' + d.positioning + '就是你的差异化切入点' : ''}

❌ 错误 4：不重视数据反馈
- 发了就不管了，不分析数据
- 建议：关注完播率、互动率、转化率
- 根据数据调整内容和发布时间

❌ 错误 5：急于求成
- 发了几条没效果就放弃
- 建议：坚持至少3个月，持续输出
- 把过程当作积累，而不是一蹴而就

以上5个错误，你中了几个？
评论区告诉我你的踩坑经历👇

#避坑 #新人必看 #经验分享 #成长干货 #内容创作`,
            coverText: '90%新手都会犯的5个错误',
            tags: ['#避坑', '#新人必看', '#经验分享', '#成长干货', '#内容创作']
        }),
        (d) => ({
            title: '${d.topic}从0到1完整攻略 📋 小白也能看懂',
            body: `今天是一篇纯干货，${d.audience || '想入门的朋友'}一定要收藏好！

📋 第一步：准备工作
1. 明确你的目标
2. 了解基本概念
3. 准备必要工具
4. 找到学习资源

📋 第二步：核心方法论
1. 先模仿：找到3-5个优秀案例
2. 再理解：分析为什么它们做得好
3. 后创新：找到自己的风格
4. 持续优化：不断测试和调整

📋 第三步：常见问题解答
Q: 需要多久才能有效果？
A: 一般3-6个月能看到明显效果

Q: 没有基础可以吗？
A: 完全没问题！谁都是从0开始的

Q: 需要投入多少？
A: 前期以学习为主，低成本启动

📋 第四步：进阶技巧
${d.positioning ? '- 结合' + d.positioning + '做深度内容' : ''}
- 建立自己的知识体系
- 形成内容矩阵
- 打造个人品牌

超全攻略已经给大家整理好了
收藏起来慢慢看！有问题评论区问我👋

#从0到1 #完整攻略 #入门指南 #干货分享 #学习路线`,
            coverText: '从0到1完整攻略，小白也能看懂',
            tags: ['#从0到1', '#完整攻略', '#入门指南', '#干货分享', '#学习路线']
        }),
        (d) => ({
            title: '数据说话：${d.topic}的10个惊人真相 📊',
            body: `今天用数据说话，带你看清${d.topic}的真相！

📊 数据 1：市场规模
这个领域正在快速增长
${d.audience ? d.audience + '群体' : '用户群体'}需求旺盛
现在是入场的最佳时机

📊 数据 2：用户画像
- 主力人群：${d.audience || '18-35岁年轻人'}
- 核心需求：效率提升/知识获取/社交需求
- 消费习惯：愿意为优质内容付费

📊 数据 3：成功率对比
有计划 vs 没计划：成功率相差 3 倍
坚持6个月 vs 放弃：差距不可估量
方法正确 vs 盲目：效率差 5-10 倍

📊 数据 4：投入产出比
- 时间投入：每天1-2小时
- 3个月：初步见效
- 6个月：稳定增长
- 1年：质的飞跃

📊 数据 5：关键成功因素
1. 内容质量（占比 40%）
2. 持续输出（占比 30%）
3. 互动运营（占比 20%）
4. 运气因素（占比 10%）

${d.positioning ? '对于做' + d.positioning + '的朋友来说，数据1-3尤为重要' : ''}

数据不会骗人，行动才有结果！
收藏这份数据分析，给自己定个小目标🎯

#数据分析 #行业洞察 #干货分享 #真相揭秘 #认知提升`,
            coverText: '10个数据揭示行业真相',
            tags: ['#数据分析', '#行业洞察', '#干货分享', '#真相揭秘', '#认知提升']
        })
    ],
    '情感': [
        (d) => ({
            title: '直到30岁才明白：${d.topic}才是最该投资的事 💭',
            body: `20多岁的时候，总在追逐别人眼中的"成功"

以为拼命加班就是努力
以为买贵的东西就是对自己好
以为社交越多就越有价值

直到30岁，经历了起起落落
才真正明白${d.topic}的意义

🌙 曾经的焦虑：
"别人都那么优秀，我是不是太慢了？"
"为什么我努力了还是看不到结果？"
"到底什么才是对的？"

💡 现在的感悟：
其实人生不是赛跑，每个人都有自己的节奏
${d.topic}的意义不在于追上别人
而在于成为更好的自己

✨ 给${d.audience || '正在焦虑的你'}的3个建议：
1. 慢下来，听听内心的声音
2. 专注自己，少和别人比较
3. 坚持做对的事，时间会给你答案

${d.positioning ? '就像我选择做' + d.positioning + '一样，不是因为别人都在做，而是因为我真的热爱' : ''}

你现在觉得最重要的事情是什么？
评论区聊聊吧 👇

#人生感悟 #成长心态 #30岁 #自我成长 #心灵鸡汤`,
            coverText: '30岁才明白的道理，希望能早点知道',
            tags: ['#人生感悟', '#成长心态', '#30岁', '#自我成长', '#心灵鸡汤']
        }),
        (d) => ({
            title: '写给所有${d.audience || "焦虑的年轻人"}：你已经很棒了 🌈',
            body: `亲爱的，我知道你现在可能正在焦虑

刷到别人光鲜亮丽的生活
看到同龄人"成功"的轨迹
再看看自己，好像还在原地踏步

但是我想告诉你：
你真的已经做得很好了

💭 你知道吗？
你看到的光鲜，只是别人想让你看到的
每个人都有自己的战场
你羡慕别人的同时，也有人在羡慕你

🌟 你已经做到了：
- 每天早起开始新的一天
- 面对困难没有放弃
- 在努力成为更好的自己

这些，都值得给自己一个拥抱

关于${d.topic}，我想说的是：
不要给自己太大压力
按照自己的节奏来就好

✨ 给今天的你：
深呼吸，对自己说一句"辛苦了"
然后继续保持热爱

${d.positioning ? '就像做' + d.positioning + '一样，重要的不是多快到达终点，而是在路上不断成长' : ''}

评论区对自己说一句鼓励的话吧
我先来：你已经很棒了！继续加油 💪

#治愈 #温暖 #焦虑 #自我接纳 #情感共鸣`,
            coverText: '写给焦虑的你：你已经很棒了',
            tags: ['#治愈', '#温暖', '#焦虑', '#自我接纳', '#情感共鸣']
        }),
        (d) => ({
            title: '关于${d.topic}，我终于决定放下了 🍃',
            body: `以前的我，总是想要抓住所有东西

害怕错过机会
害怕落后于人
害怕不够完美

为了${d.topic}
我付出了很多
也焦虑了很多

直到有一天
我坐在窗边
看到树叶随风飘落
突然就释怀了

🍃 有些事，尽力就好
🍃 有些人，遇见就好
🍃 有些路，走过就好

不是所有事情都要有个结果
不是所有付出都要有回报
人生最美的风景
往往在
意料之外

💭 给${d.audience || '正在纠结的你'}：
如果一件事让你太累了
不妨先放一放
深呼吸
给自己一点空间

${d.positioning ? '关于' + d.positioning + '的经历让我明白：放下的那一刻，才是真正的拥有' : ''}

你最近放下了什么？
来评论区聊聊 🍃

#放下 #释怀 #成长 #人生感悟 #治愈系`,
            coverText: '终于决定放下了，突然就释怀了',
            tags: ['#放下', '#释怀', '#成长', '#人生感悟', '#治愈系']
        }),
        (d) => ({
            title: '把${d.topic}当作一场修行，突然就不累了 🌻',
            body: `你有没有这样的时刻？

觉得做什么都不顺
明明很努力却没有结果
身边的人都在往前走
只有自己停在原地

我曾经也是这样的

每天焦虑到失眠
反复问自己：到底哪里做的不对
为什么别人可以我不行

直到有一天
朋友对我说了一句话：
"你太想赢了，反而忘了享受过程"

🌻 是啊
我太执着于结果了
反而忽略了过程中的风景

关于${d.topic}，我现在换了一种心态：
不是"我必须成功"
而是"我在这个过程中成长了什么"

💛 心态转变后：
1. 不再焦虑结果
2. 更享受过程
3. 反而收获更多
4. 心态也轻松了

${d.audience ? '送给所有' + d.audience + '：' : '送给你：'}
把生活当作一场修行
不要太在意终点
路上的风景也很美

${d.positioning ? '做' + d.positioning + '的这段经历，让我学会了放慢脚步' : ''}

你今天有什么值得开心的小事吗？
分享出来，一起治愈 👇

#修行 #心态 #治愈 #成长 #与自己和解`,
            coverText: '把生活当作修行，突然就不焦虑了',
            tags: ['#修行', '#心态', '#治愈', '#成长', '#与自己和解']
        })
    ],
    '教程': [
        (d) => ({
            title: '手把手教你搞定${d.topic} 📖 保姆级教程',
            body: `今天是一篇纯纯的保姆级教程
${d.audience || '零基础'}也能轻松学会！

📖 第1步：准备工作
首先要准备好这些：
✅ 明确自己的需求
✅ 了解基本概念
✅ 准备好必要的工具

📖 第2步：核心操作
跟着我做：
1. 第一步从这里开始
2. 注意这个关键细节
3. 这一步不要做错
4. 完成后的效果检查

📖 第3步：进阶技巧
会了基础操作之后
试试这些进阶玩法：
✨ 技巧一：提高效率的小窍门
✨ 技巧二：避免踩坑的注意事项
✨ 技巧三：效果最大化的方法

📖 第4步：常见问题
Q: 操作到一半卡住了怎么办？
A: 检查第2步的第3个细节

Q: 效果和预期不一样？
A: 可能是参数设置的问题

Q: ${d.positioning ? '做' + d.positioning + '有什么额外技巧吗？' : '有没有更快捷的方法？'}
A: 建议先从基础版本开始

💡 小贴士
- 多练习几次就熟练了
- 不懂的随时评论区问我
${d.positioning ? '- 结合' + d.positioning + '的场景效果更好' : ''}

赶紧收���学起来吧！学会了记得交作业👋

#教程 #保姆级教程 #手把手教学 #零基础 #学习技巧`,
            coverText: '保姆级教程！零基础也能轻松学会',
            tags: ['#教程', '#保姆级教程', '#手把手教学', '#零基础', '#学习技巧']
        }),
        (d) => ({
            title: '${d.topic}入门到精通：8步搞定 👨‍🏫',
            body: `从入门到精通，这篇文章就够了
建议${d.audience || '新手'}先收藏再看！

第1步：认知篇
- 先了解${d.topic}的基本概念
- 明确自己的学习目标
- 制定学习计划

第2步：工具篇
- 选择适合自己的工具
- 熟悉基础操作
- 建立工作流

第3步：基础操作
- 核心功能掌握
- 常用技巧熟练
- 避免常见的错误

第4步：实践练习
- 找一个实际项目练手
- 从简单到复杂
- 记录遇到的问题

第5步：进阶提升
- 学习高级技巧
- 优化工作流程
- 提高效率

第6步：复盘总结
- 总结自己的方法
- 建立知识体系
- 形成自己的风格

第7步：输出分享
- 教别人是最好的学习
- 输出倒逼输入
- 建立个人影响力

第8步：持续迭代
- 保持学习
- 跟随行业变化
${d.positioning ? '- 深耕' + d.positioning + '领域' : ''}

按照这8步走
3个月一定能看到明显进步！

你目前走到第几步了？评论区打卡👇

#入门到精通 #学习路线 #技能提升 #成长路径 #教程分享`,
            coverText: '从入门到精通就这8步，3个月见效',
            tags: ['#入门到精通', '#学习路线', '#技能提升', '#成长路径', '#教程分享']
        }),
        (d) => ({
            title: '1分钟学会${d.topic}核心技巧 ⚡ 超简单',
            body: `超简单！1分钟就能学会！
真的没有你想的那么难 🤯

🔥 核心技巧速成：

【第一步】找到入口
不要被复杂的功能吓到
你只需要关注核心功能
其他都是锦上添花

【第二步】掌握核心操作
记住这个公式：
输入 → 处理 → 输出
就这么简单！

【第三步】常见场景
场景1：日常使用
场景2：进阶需求
${d.positioning ? '场景3：' + d.positioning + '场景应用' : '场景3：团队协作场景'}

【第四步】避坑提醒
⚠️ 不要一上来就搞复杂的
⚠️ 不要忽视基础操作
⚠️ 不要怕犯错

💡 实用小技巧
- 快捷键能提升50%效率
- 善用模板功能
- 多看看官方文档

1分钟学会，剩下的就是多练习
${d.audience ? d.audience + '也能轻松上手！' : '真的超简单！'}

还有什么想学的？评论区告诉我👇

#快速上手 #1分钟学会 #效率提升 #技巧分享 #简单易学`,
            coverText: '1分钟就能学会的核心技巧',
            tags: ['#快速上手', '#1分钟学会', '#效率提升', '#技巧分享', '#简单易学']
        }),
        (d) => ({
            title: '超详细！${d.topic}全流程拆解 🎯 看完就会',
            body: `再复杂的流程，拆解开来都不难
今天把${d.topic}的完整流程拆给你看！

🎯 阶段一：策划（20%的时间）
目的：确定方向和策略
关键动作：
- 明确目标
- 分析需求
- 制定方案
产出：清晰的执行计划

🎯 阶段二：执行（50%的时间）
目的：按照计划执行
关键动作：
- 分步实施
- 过程监控
- 及时调整
产出：阶段性成果

🎯 阶段三：优化（20%的时间）
目的：打磨提升质量
关键动作：
- 收集反馈
- 分析数据
- 迭代优化
产出：优化后的成品

🎯 阶段四：复盘（10%的时间）
目的：总结经验
关键动作：
- 复盘过程
- 总结经验
- 形成SOP
产出：可复用的方法论

💡 全流程核心原则：
1. 先完成再完美
2. 反馈驱动优化
3. 标准化可复用

${d.positioning ? '这套流程做' + d.positioning + '也完全适用' : ''}
${d.audience ? d.audience + '收藏起来慢慢消化！' : '收藏起来慢慢消化！'}

有什么问题评论区见！👇

#全流程 #详细教程 #干货分享 #实操指南 #方法总结`,
            coverText: '全流程拆解，看完就会了',
            tags: ['#全流程', '#详细教程', '#干货分享', '#实操指南', '#方法总结']
        })
    ],
    '测评': [
        (d) => ({
            title: '实测3个月！${d.topic}真实体验报告 📊',
            body: `用了3个月${d.topic}，今天交一份真实测评报告！

📊 综合评分：⭐⭐⭐⭐（4/5）

👍 优点：
1. 核心功能很强大
    - 该有的功能都有
    - 操作流畅不卡顿
    - 效果超出预期

2. 用户体验好
    - 界面简洁美观
    - 上手难度低
    - 学习成本小

3. 性价比高
    - 功能对得起价格
    - 长期使用价值大
    - 比同类产品更划算

👎 缺点：
1. 部分功能有门槛
    - 进阶功能需要学习
    - 文档可以更详细

2. 还有优化空间
    - 偶尔有小bug
    - 更新频率可以更高

🎯 适合人群：
✅ ${d.audience || '初学者和进阶者'}
✅ ${d.positioning ? '做' + d.positioning + '的内容创作者' : '追求效率的用户'}
✅ 预算有限的个人用户

❌ 不适合：
- 需要极高端功能的用户
- 对稳定性要求极高的场景

💡 总结推荐：
综合来说，非常适合${d.audience || '大多数人'}使用
3个月用下来，利大于弊
推荐指数：⭐⭐⭐⭐

你也在用吗？评论区说说你的体验👇

#真实测评 #使用体验 #测评报告 #值得买吗 #产品评测`,
            coverText: '实测3个月，优缺点全说了',
            tags: ['#真实测评', '#使用体验', '#测评报告', '#值得买吗', '#产品评测']
        }),
        (d) => ({
            title: '2024最新${d.topic}横评对比 🏆 谁更值得选？',
            body: `市面上的${d.topic}太多了
今天做一个横向对比测评
帮${d.audience || '大家'}选出最适合的！

🏆 参评选手一览

【产品A】⭐⭐⭐⭐⭐
优点：功能全面、稳定性好
缺点：价格偏高
适合：预算充足的${d.audience || '专业用户'}

【产品B】⭐⭐⭐⭐
优点：性价比高、上手快
缺点：高级功能有限
适合：入门${d.audience || '用户'}、小团队

【产品C】⭐⭐⭐
优点：完全免费、基础功能够用
缺点：界面老旧、功能更新慢
适合：零预算${d.audience || '个人用户'}

📊 各维度评分对比

功能完整性：A > B > C
易用性：B > A > C
性价比：B > C > A
稳定性：A > B > C
售后服务：A > B > C

🏆 最终推荐

🥇 最佳综合：产品B（性价比之王）
🥇 最佳体验：产品A（功能最强）
🥇 最佳预算：产品C（免费够用）

${d.positioning ? '做' + d.positioning + '的话，我更推荐产品B' : ''}

你用的哪一款？评论区交流👇

#横评对比 #产品测评 #选购指南 #哪款好 #测评推荐`,
            coverText: '2024最新横评对比，看完不纠结',
            tags: ['#横评对比', '#产品测评', '#选购指南', '#哪款好', '#测评推荐']
        }),
        (d) => ({
            title: '扒了30个${d.topic}案例，我总结了这些规律 🔍',
            body: `花了2周时间，分析了30个${d.topic}案例
今天把发现的核心规律分享给${d.audience || '大家'}

🔍 规律一：成功的共同特征

1. 内容质量优先
   - 高点赞案例的共同点：内容有深度
   - 粗糙的内容很难获得关注
   - 优质内容的回报率远超平庸内容

2. 持续输出是关键
   - 90%的成功案例都在持续更新
   - 断更是最大的敌人
   - 保持频率比单篇爆款更重要

3. 互动带来增长
   - 回复评论的账号增长率高3倍
   - 主动互动能提升粉丝粘性
   - 社区参与度直接影响算法推荐

🔍 规律二：失败案例的教训

1. 定位不清晰：什么都想做，什么都没做好
2. 内容同质化：没有差异化，淹没在信息流
3. 急功近利：发了几条没效果就放弃

🔍 规律三：数据背后的真相

- 爆款率：约 2%-5%
- 平均成长周期：3-6个月
- 持续更新者的成功率：是放弃者的 10倍

💡 核心建议：
${d.positioning ? '做' + d.positioning + '的朋友，规律一最重要' : ''}
不要追求速成
踏踏实实做好内容
时间会给你答案

你从这些规律中有收获吗？评论区说说👇

#案例分析 #规律总结 #行业观察 #深度分析 #数据研究`,
            coverText: '30个案例分析，发现成功规律',
            tags: ['#案例分析', '#规律总结', '#行业观察', '#深度分析', '#数据研究']
        }),
        (d) => ({
            title: '${d.topic}深度测评：优点缺点全说了，不吹不黑 ⚖️',
            body: `客观中立，有一说一
今天深度测评${d.topic}
不吹不黑，优缺点都说清楚

⚖️ 测试环境
测试时长：2周
测试设备：日常使用设备
测试场景：${d.audience || '多种使用场景'}模拟

⭐ 功能评分：4/5
亮点功能做得很好
但部分边缘功能有待加强
核心体验流畅，无明显卡顿

⭐ 易用性评分：3.5/5
基础操作简单易懂
但进阶功能的学习曲线较陡
文档和教程可以更完善

⭐ 稳定性评分：4/5
日常使用稳定
偶尔有小的体验问题
更新修复及时

⭐ 性价比评分：4.5/5
功能对得起价格
长期使用价值高
比同类产品更有竞争力

📋 综合评分：4/5

【优点总结】
✅ 核心功能强大
✅ 性价比高
✅ 用户体验不错
✅ 更新迭代快

【缺点总结】
❌ 进阶功能门槛高
❌ 部分细节有待优化
❌ 客服响应速度一般

🎯 最终建议
适合：${d.audience || '追求性价比的用户'}
${d.positioning ? '特别适合做' + d.positioning + '的朋友' : ''}
建议先试用再决定

以上就是我的真实测评
希望对你有帮助！💪

#深度测评 #优缺点分析 #客观评测 #不吹不黑 #真实评价`,
            coverText: '深度测评！优缺点全说了，不吹不黑',
            tags: ['#深度测评', '#优缺点分析', '#客观评测', '#不吹不黑', '#真实评价']
        })
    ]
};

// ============================
// 工具函数
// ============================
function pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================
// 解析 API 返回的 JSON
// ============================
function parseApiResponse(rawText) {
    try {
        // 尝试直接解析
        const cleaned = rawText.trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.notes && Array.isArray(parsed.notes)) {
            return parsed.notes;
        }
        // 尝试包裹格式
        if (Array.isArray(parsed)) {
            return parsed;
        }
    } catch (e) {
        // 尝试提取 JSON
        try {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.notes && Array.isArray(parsed.notes)) {
                    return parsed.notes;
                }
            }
        } catch (e2) {
            console.warn('JSON 解析失败:', e2.message);
        }
    }
    return null;
}

// ============================
// 生成 Mock 结果
// ============================
function generateMockNotes(data) {
    const templates = MOCK_TEMPLATES[data.style] || MOCK_TEMPLATES['种草'];
    const selected = pickRandom(templates, data.count);
    return selected.map(t => t(data));
}

// ============================
// 渲染输出卡片
// ============================
function renderNotes(notes, index) {
    const note = notes;
    const tagsHtml = note.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    return `
        <div class="note-card" data-index="${index}">
            <div class="note-card-header">
                <h3>📝 笔记 ${index + 1}</h3>
                <div class="copy-btn-group">
                    <button class="copy-btn" onclick="copyNoteAll(${index})" title="复制全部">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        复制全部
                    </button>
                    <button class="copy-btn" onclick="copyNoteTitle(${index})" title="复制标题">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                        复制标题
                    </button>
                    <button class="copy-btn" onclick="copyNoteBody(${index})" title="复制正文">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        复制正文
                    </button>
                </div>
            </div>
            <div class="note-section">
                <div class="note-field-label">标题</div>
                <div class="note-title-text">${escapeHtml(note.title)}</div>
            </div>
            <div class="note-section">
                <div class="note-field-label">正文</div>
                <div class="note-body-text">${escapeHtml(note.body).replace(/\n/g, '<br>')}</div>
            </div>
            <div class="note-section">
                <div class="note-field-label">封面文案</div>
                <div class="note-cover-text">${escapeHtml(note.coverText)}</div>
            </div>
            <div class="note-section">
                <div class="note-field-label">标签</div>
                <div class="note-tags">${tagsHtml}</div>
            </div>
        </div>
    `;
}

// ============================
// 复制功能
// ============================
let _latestNotes = [];

function getLatestNotes() {
    return _latestNotes;
}

function buildNoteFullText(note) {
    return `标题：${note.title}\n\n${note.body}\n\n封面文案：${note.coverText}\n\n${note.tags.join(' ')}`;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('✅ 已复制到剪贴板');
    } catch {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('✅ 已复制到剪贴板');
        } catch {
            showToast('❌ 复制失败，请手动复制');
        }
    }
}

function copyNoteAll(index) {
    const notes = getLatestNotes();
    if (!notes || !notes[index]) return;
    const text = buildNoteFullText(notes[index]);
    copyToClipboard(text);
}

function copyNoteTitle(index) {
    const notes = getLatestNotes();
    if (!notes || !notes[index]) return;
    copyToClipboard(notes[index].title);
}

function copyNoteBody(index) {
    const notes = getLatestNotes();
    if (!notes || !notes[index]) return;
    copyToClipboard(notes[index].body);
}

function copyAllNotes() {
    const notes = getLatestNotes();
    if (!notes || notes.length === 0) return;
    const text = notes.map((n, i) => {
        return `===== 笔记 ${i + 1} =====\n${buildNoteFullText(n)}`;
    }).join('\n\n');
    copyToClipboard(text);
}

// ============================
// 主生成函数
// ============================
async function generateContent() {
    // 收集表单数据
    const topic = document.getElementById('topic').value.trim();
    if (!topic) {
        showToast('请填写主题/关键词');
        document.getElementById('topic').focus();
        return;
    }

    const positioning = document.getElementById('positioning').value.trim();
    const audience = document.getElementById('audience').value.trim();
    const style = document.querySelector('.style-btn.active')?.dataset.style;
    if (!style) {
        showToast('请选择风格');
        return;
    }
    const length = document.querySelector('.length-btn.active')?.dataset.length || 'medium';
    const count = parseInt(document.getElementById('noteCount').value) || 3;

    const data = {
        topic,
        positioning,
        audience,
        style,
        length,
        count: Math.min(Math.max(count, 1), 5)
    };

    // 显示加载状态
    const loadingEl = document.getElementById('loading');
    const outputSection = document.getElementById('outputSection');
    loadingEl.classList.add('active');
    outputSection.classList.remove('active');

    // 尝试 API 生成
    const apiKey = getApiKey();
    let usedApi = false;

    if (apiKey) {
        try {
            const systemPrompt = getSystemPrompt(style);
            const userMessage = buildUserMessage(data);
            const raw = await callClaudeAPI(apiKey, systemPrompt, userMessage);

            const parsed = parseApiResponse(raw);
            if (parsed && parsed.length > 0) {
                _latestNotes = parsed.slice(0, count);
            } else {
                throw new Error('API 返回内容解析失败');
            }
            usedApi = true;
        } catch (e) {
            console.warn('API 调用失败，降级到 Mock:', e.message);
        }
    }

    // Mock 降级
    if (!usedApi) {
        await new Promise(resolve => setTimeout(resolve, 800));
        _latestNotes = generateMockNotes(data);
    }

    // 渲染
    const notes = getLatestNotes();
    let html = '';
    if (notes.length > 1) {
        html += `<div class="copy-all-bar"><button class="copy-all-btn" onclick="copyAllNotes()">📋 复制全部 ${notes.length} 条笔记</button></div>`;
    }
    notes.forEach((note, i) => {
        html += renderNotes(note, i);
    });

    loadingEl.classList.remove('active');
    outputSection.innerHTML = html;
    outputSection.classList.add('active');

    const msg = usedApi ? '✅ AI 内容生成成功！' : (apiKey ? '⚠️ API 调用失败，已使用本地模板' : '✅ 内容生成成功！（本地模板模式）');
    showToast(msg);

    // 滚动到输出区
    setTimeout(() => {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ============================
// Toast
// ============================
function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============================
// 初始化
// ============================
document.addEventListener('DOMContentLoaded', function () {
    // 风格切换
    document.querySelectorAll('.style-btn').forEach(el => {
        el.addEventListener('click', function () {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 字数切换
    document.querySelectorAll('.length-btn').forEach(el => {
        el.addEventListener('click', function () {
            document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // API Key 输入框初始化
    const savedKey = getApiKey();
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        if (savedKey) apiKeyInput.value = savedKey;
        apiKeyInput.addEventListener('input', function () {
            if (this.value) {
                setApiKey(this.value);
            } else {
                clearApiKey();
            }
        });
    }

    // 回车键触发生成
    document.getElementById('topic')?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') generateContent();
    });

    // ============================
    // SaaS 初始化
    // ============================
    initUsageTracking();
    updateUsageBadge();

    // 首次访问引导
    if (!localStorage.getItem('xhs_onboarding_done')) {
        setTimeout(function () {
            openModal('onboardingModal');
        }, 600);
    }
});

// ============================
// SaaS 模块 - 付费墙、统计、历史记录、随机灵感、导出图片
// 不改原有 Mock 和 API 逻辑，只叠加新功能
// ============================

// ---- 常量 ----
const XHS_USAGE_KEY = 'xhs_factory_usage';
const XHS_HISTORY_KEY = 'xhs_factory_history';
const XHS_SUBSCRIPTION_KEY = 'xhs_factory_subscription';
const FREE_DAILY_LIMIT = 3;
const MAX_HISTORY = 50;

// ---- 使用次数追踪 ----
function getTodayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function initUsageTracking() {
    let usage = loadUsage();
    const today = getTodayKey();
    if (!usage[today]) {
        usage[today] = 0;
    }
    saveUsage(usage);
}

function loadUsage() {
    try {
        return JSON.parse(localStorage.getItem(XHS_USAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveUsage(usage) {
    localStorage.setItem(XHS_USAGE_KEY, JSON.stringify(usage));
}

function getTodayUsage() {
    const usage = loadUsage();
    return usage[getTodayKey()] || 0;
}

function incrementUsage() {
    const usage = loadUsage();
    const today = getTodayKey();
    usage[today] = (usage[today] || 0) + 1;
    saveUsage(usage);
    updateUsageBadge();
}

function getMonthUsage() {
    const usage = loadUsage();
    const now = new Date();
    const prefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let total = 0;
    for (const key in usage) {
        if (key.startsWith(prefix)) {
            total += usage[key];
        }
    }
    return total;
}

function getRemainingUsage() {
    if (isPremium()) return Infinity;
    return Math.max(0, FREE_DAILY_LIMIT - getTodayUsage());
}

function isPremium() {
    const sub = localStorage.getItem(XHS_SUBSCRIPTION_KEY);
    if (!sub) return false;
    try {
        const data = JSON.parse(sub);
        return data.active === true;
    } catch {
        return false;
    }
}

function checkUsageLimit() {
    if (isPremium()) return true;
    return getTodayUsage() < FREE_DAILY_LIMIT;
}

function updateUsageBadge() {
    const badge = document.getElementById('usageBadge');
    if (!badge) return;
    if (isPremium()) {
        badge.textContent = '无限次';
        badge.classList.remove('exhausted');
        badge.style.borderColor = 'var(--success)';
        badge.style.color = 'var(--success)';
        return;
    }
    const used = getTodayUsage();
    const remain = FREE_DAILY_LIMIT - used;
    badge.textContent = '今日 ' + used + '/' + FREE_DAILY_LIMIT;
    if (remain <= 0) {
        badge.classList.add('exhausted');
    } else {
        badge.classList.remove('exhausted');
    }
}

// ---- 升级流程 ----
function upgradePlan(plan) {
    let label, limit;
    switch (plan) {
        case 'basic':
            label = '基础版';
            limit = 10;
            break;
        case 'pro':
            label = '专业版';
            limit = 50;
            break;
        case 'premium':
            label = '尊享版';
            limit = Infinity;
            break;
        default:
            return;
    }
    const subData = {
        plan: plan,
        label: label,
        dailyLimit: limit,
        active: true,
        upgradedAt: new Date().toISOString()
    };
    localStorage.setItem(XHS_SUBSCRIPTION_KEY, JSON.stringify(subData));

    closeAllModals();
    updateUsageBadge();

    openModal('thankyouModal');
}

// ---- 弹窗工具 ----
function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(function (el) {
        el.classList.remove('active');
    });
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ---- 外部触发的弹窗 ----
function showPricingModal() {
    openModal('pricingModal');
}

function toggleDashboard() {
    const todayVal = document.getElementById('statToday');
    const monthVal = document.getElementById('statMonth');
    const remainVal = document.getElementById('statRemain');
    if (todayVal) todayVal.textContent = getTodayUsage();
    if (monthVal) monthVal.textContent = getMonthUsage();
    if (remainVal) remainVal.textContent = isPremium() ? '无限' : getRemainingUsage();

    const cta = document.getElementById('dashboardUpgradeCta');
    if (cta) {
        cta.style.display = isPremium() ? 'none' : 'block';
    }

    openModal('dashboardModal');
}

function showHistoryModal() {
    renderHistory();
    openModal('historyModal');
}

// ---- 历史记录 ----
function saveToHistory(note, style) {
    let history = loadHistory();
    const entry = {
        id: Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: note.title,
        body: note.body,
        coverText: note.coverText,
        tags: note.tags,
        style: style,
        createdAt: new Date().toISOString()
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(XHS_HISTORY_KEY, JSON.stringify(history));
}

function saveAllToHistory(notes, style) {
    notes.forEach(function (note) {
        saveToHistory(note, style);
    });
}

function loadHistory() {
    try {
        return JSON.parse(localStorage.getItem(XHS_HISTORY_KEY)) || [];
    } catch {
        return [];
    }
}

function clearHistory() {
    localStorage.removeItem(XHS_HISTORY_KEY);
    renderHistory();
    showToast('历史记录已清空');
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;
    const history = loadHistory();
    if (history.length === 0) {
        list.innerHTML = '<div class="history-empty"><span class="empty-icon">📭</span><p>还没有生成记录，快去创作吧！</p></div>';
        return;
    }
    let html = '<div style="text-align:right;margin-bottom:12px;"><button class="copy-btn" onclick="clearHistory()" style="color:var(--error);border-color:var(--error);">清空历史</button></div>';
    history.forEach(function (item) {
        const date = new Date(item.createdAt);
        const dateStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + ' ' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
        html += '<div class="history-item" onclick="useHistoryItem(\'' + item.id + '\')">' +
            '<div class="hi-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="hi-meta"><span>' + dateStr + '</span><span>风格: ' + (item.style || '未知') + '</span></div>' +
            '<div class="hi-preview">' + escapeHtml(item.body.substring(0, 80)) + '...</div>' +
        '</div>';
    });
    list.innerHTML = html;
}

function useHistoryItem(id) {
    const history = loadHistory();
    const item = history.find(function (h) { return h.id === id; });
    if (!item) {
        showToast('记录不存在');
        return;
    }
    const topicInput = document.getElementById('topic');
    if (topicInput) topicInput.value = item.title.replace(/[\[\]【】🔥💕📚📖📊🌟✨]/g, '').trim();
    closeModal('historyModal');
    showToast('已填入主题，点击生成即可创作');
    document.getElementById('topic')?.focus();
}

// ---- 随机灵感 ----
const INSPIRE_TOPICS = [
    'AI工具推荐', '职场穿搭', '居家好物', '效率App分享', '读书笔记',
    '健身打卡', '减肥餐食谱', '旅行攻略', '护肤心得', '美妆教程',
    '副业推荐', '考研经验', '编程学习', '自媒体运营', '极简生活',
    '育儿经验', '宠物日常', '家居改造', '周末去哪玩', '省钱技巧',
    '断舍离', '情绪管理', '时间管理', '副业收入', '面试技巧'
];

function randomInspire() {
    const topics = INSPIRE_TOPICS;
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const topicInput = document.getElementById('topic');
    if (topicInput) topicInput.value = topic;
    showToast('💡 随机灵感: ' + topic + ' — 点击生成开始创作');
    const styleBtns = document.querySelectorAll('.style-btn');
    if (styleBtns.length > 0) {
        const randomIdx = Math.floor(Math.random() * styleBtns.length);
        styleBtns.forEach(function (b) { b.classList.remove('active'); });
        styleBtns[randomIdx].classList.add('active');
    }
    topicInput?.focus();
}

// ---- 导出图片（占位） ----
function exportAsImage() {
    const notes = getLatestNotes();
    if (!notes || notes.length === 0) {
        showToast('请先生成内容');
        return;
    }
    try {
        const note = notes[0];
        const data = JSON.stringify({
            title: note.title,
            body: note.body,
            coverText: note.coverText,
            tags: note.tags,
            exportedAt: new Date().toISOString()
        });
        const base64 = btoa(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (m, p1) {
            return String.fromCharCode('0x' + p1);
        }));
        showToast('✅ 图片数据已生成（占位实现）');
        console.log('导出 base64 数据:', base64);
    } catch (e) {
        showToast('导出失败: ' + e.message);
    }
}

// ---- 首次引导关闭 ----
function closeOnboarding() {
    localStorage.setItem('xhs_onboarding_done', 'true');
    closeModal('onboardingModal');
}

// ---- 覆盖生成函数以增加次数限制 ----
const _originalGenerateContent = generateContent;

generateContent = function () {
    if (!checkUsageLimit()) {
        openModal('upgradeWallModal');
        return;
    }

    _originalGenerateContent.apply(this, arguments).then(function () {
        const notes = getLatestNotes();
        if (notes && notes.length > 0) {
            incrementUsage();
            const style = document.querySelector('.style-btn.active')?.dataset.style || '未知';
            saveAllToHistory(notes, style);
            updateUsageBadge();
            const exportBtn = document.getElementById('exportImageBtn');
            if (exportBtn) exportBtn.disabled = false;
        }
    }).catch(function (err) {
        console.warn('生成失败:', err);
    });
};
