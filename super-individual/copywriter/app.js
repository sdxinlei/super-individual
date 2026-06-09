/**
 * AI 文案助手 - app.js
 * 功能：Claude API 集成 + Mock 降级 + API Key 管理
 */

// ============================
// API Key 管理
// ============================
const API_KEY_STORAGE_KEY = 'copywriter_api_key';

function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
}

function setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
}

function clearApiKey() {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    document.getElementById('apiKeyInput').value = '';
    showToast('API Key 已清除');
}

// ============================
// Claude API 调用
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
// 系统 Prompt 模板（按平台 + 风格）
// ============================
const TONE_LABELS = {
    casual: '轻松口语',
    professional: '专业正式',
    humorous: '幽默风趣',
    urgent: '紧迫感'
};

function getSystemPrompt(platform, tone) {
    const toneLabel = TONE_LABELS[tone] || '专业正式';
    const base = `你是一位专业的社交媒体文案撰写专家。请根据用户提供的产品信息，生成适合该平台的推广文案。

风格要求：${toneLabel}

请直接输出文案内容，不要输出思考过程。每一条文案用 "===SEPARATOR===" 分隔。每条文案应完整、可直接使用。`;

    const platformRules = {
        xiaohongshu: `
小红书文案规则：
- 标题要吸引眼球，带 emoji
- 正文用口语化、亲切的语气
- 适当使用 emoji 增强表达
- 包含话题标签（#标签）
- 突出产品亮点和使用体验
- 字数控制在 200-500 字`,
        twitter: `
X/Twitter 推文规则：
- 简洁有力，每条不超过 280 字符
- 可以用英文或中文
- 适当使用 emoji
- 包含相关话题标签（#tag）
- 突出核心价值`,
        wechat: `
朋友圈文案规则：
- 口语化，像朋友间的分享
- 适当使用 emoji
- 突出产品的实用价值
- 可以适当包含号召性用语
- 结尾可以引导互动
- 字数控制在 100-300 字`
    };

    return base + (platformRules[platform] || '');
}

function buildUserMessage(data, count) {
    let highlightsText = data.highlights.map((h, i) => `${i + 1}. ${h}`).join('\n');
    if (!highlightsText) {
        highlightsText = '（用户未提供）';
    }

    return `请为以下产品生成 ${count} 条不同的推广文案：

产品名称：${data.name}
一句话描述：${data.desc || '（用户未提供）'}
目标受众：${data.audience || '（用户未提供）'}
核心卖点：
${highlightsText}

请生成 ${count} 条文案，每条用 "===SEPARATOR===" 分隔。`;
}

// ============================
// Mock 模板（API 降级时使用）
// ============================
const TEMPLATES = {
    xiaohongshu: {
        casual: [
            (p) => `标题：发现了一个宝藏工具 🔥\n\n家人们谁懂啊！这个 ${p.name} 真的太好用了！！\n\n${p.desc}\n\n✨ ${p.highlights[0]}\n✨ ${p.highlights[1] || ''}\n✨ ${p.highlights[2] || ''}\n\n自从用了它，工作效率直接翻倍💪\n适合 ${p.audience} 宝子们冲！\n\n#AI工具 #效率提升 #打工人必备`,
            (p) => `标题：后悔没早点知道！\n\n被同事安利的 ${p.name}，用了一次就真香了😭\n\n${p.desc}\n\n真的，${p.highlights[0]}\n而且 ${p.highlights[1] || '操作也特别简单'}\n\n推荐给所有 ${p.audience}！\n用了就回不去了！\n\n#效率工具 #AI #职场必备`,
            (p) => `标题：0 成本提升效率的方法📌\n\n分享一个我每天都在用的工具：${p.name}\n\n${p.desc}\n\n✅ ${p.highlights[0]}\n✅ ${p.highlights[1] || '免费使用'}\n\n真的解放双手，省下时间做更有价值的事🥹\n${p.audience} 都给我冲！\n\n#效率提升 #AI工具 #打工人`
        ],
        professional: [
            (p) => `标题：推荐一款提升团队效率的 AI 工具\n\n近期深度使用 ${p.name}，分享一下使用体验。\n\n${p.desc}\n\n核心优势：\n• ${p.highlights[0]}\n• ${p.highlights[1] || '操作简便，零学习成本'}\n• ${p.highlights[2] || '持续迭代，响应反馈'}\n\n推荐给 ${p.audience}，值得尝试。\n\n#AI #效率工具 #产品推荐`,
            (p) => `标题：用 AI 重构工作流，这个工具值得关注\n\n${p.name} —— ${p.desc}\n\n在实际使用中，我发现了几个显著优势：\n\n1️⃣ ${p.highlights[0]}\n2️⃣ ${p.highlights[1] || '用户体验流畅'}\n3️⃣ ${p.highlights[2] || '持续的 AI 能力升级'}\n\n如果你也是 ${p.audience}，强烈建议体验一下。\n\n#AI产品 #效率提升 #工具推荐`
        ],
        humorous: [
            (p) => `标题：刚发现了一个摸鱼神器 🤫\n\n嘘！小声说 🤫\n\n这个 ${p.name} 真的太离谱了\n${p.desc}\n\n以前写周报要 1 小时\n现在 ${p.highlights[0]}\n剩下的时间...你懂的 😏\n\n适合 ${p.audience}\n别问我是怎么知道的\n\n#摸鱼 #AI工具 #打工人自救指南`
        ],
        urgent: [
            (p) => `标题：别再手动写周报了！🔥\n\n你的同事已经用 ${p.name} 领先一步了。\n\n${p.desc}\n\n⏰ ${p.highlights[0]}\n🔥 ${p.highlights[1] || '团队协作效率翻倍'}\n\n${p.audience} 都在用，你还在等什么？\n现在就用起来！\n\n#AI #效率 #职场`
        ]
    },
    twitter: {
        casual: [
            (p) => `发现了 ${p.name}，真的太好用了！\n\n${p.desc}\n\n特点：\n✅ ${p.highlights[0]}\n✅ ${p.highlights[1] || '超简单'}\n\n推荐给 ${p.audience} 🔥\n\n#AI #Productivity #Tools`,
            (p) => `I built ${p.name} and it's been a game changer 🚀\n\n${p.desc}\n\n✨ ${p.highlights[0]}\n✨ ${p.highlights[1] || 'Super easy to use'}\n\nPerfect for ${p.audience}\nTry it out! 👇`,
            (p) => `如果你还在手动做${p.audience ? '这些事' : ''}，试试 ${p.name}\n\n${p.desc}\n\n省时省力，谁用谁知道 ✅\n\n#AI #Tools #Productivity`
        ],
        professional: [
            (p) => `Just released ${p.name} 🚀\n\n${p.desc}\n\nKey features:\n• ${p.highlights[0]}\n• ${p.highlights[1] || 'Clean UX'}\n• ${p.highlights[2] || 'AI-powered'}\n\nBuilt for ${p.audience || 'teams and individuals'}.\n\n#AI #Productivity #IndieHacker`,
            (p) => `${p.name} — ${p.desc}\n\nOne thing I've learned: ${p.highlights[0]}\n\nIf you're a ${p.audience || 'builder'}, this might help.\n\n#AI #Tools #BuildInPublic`
        ],
        humorous: [
            (p) => `Me before ${p.name}: spending hours on ${p.audience || 'boring stuff'}\nMe after: ☕️🕶️\n\n${p.desc}\n${p.highlights[0]}\n\n#AI #LazyDev #Productivity`
        ],
        urgent: [
            (p) => `Stop what you're doing and check this out 👀\n\n${p.name} — ${p.desc}\n\n${p.highlights[0]}\n\n${p.audience || 'Everyone'} needs this. Now. 🔥\n\n#AI #GameChanger`
        ]
    },
    wechat: {
        casual: [
            (p) => `推荐一个我每天都在用的工具 🔥\n\n${p.name} — ${p.desc}\n\n用了之后最大的感受：\n✅ ${p.highlights[0]}\n✅ ${p.highlights[1] || '操作极其简单'}\n✅ ${p.highlights[2] || '完全免费'}\n\n推荐给身边所有 ${p.audience}，谁用谁知道！`,
            (p) => `分享一个提升效率的神器 ✨\n\n${p.name}\n${p.desc}\n\n核心功能：\n1. ${p.highlights[0]}\n2. ${p.highlights[1] || '一键生成'}\n\n用了之后每天省下至少 30 分钟 🕐\n推荐给 ${p.audience}`
        ],
        professional: [
            (p) => `【工具推荐】${p.name}\n\n${p.desc}\n\n适用人群：${p.audience || '职场人士'}\n\n核心价值：\n• ${p.highlights[0]}\n• ${p.highlights[1] || '提升工作效率'}\n• ${p.highlights[2] || '持续优化迭代'}\n\n欢迎体验交流 🙏`
        ],
        humorous: [
            (p) => `发现了一个"偷懒"利器 😎\n\n${p.name} — ${p.desc}\n\n以前干这事要 1 小时\n现在 ${p.highlights[0]} 就搞定了\n\n剩下的时间...你懂的 🤫\n\n推荐给 ${p.audience}（尤其是想摸鱼的）`
        ],
        urgent: [
            (p) => `还在手动干这事？🔥\n\n${p.name} 了解一下\n${p.desc}\n\n${p.highlights[0]}\n别人已经在用了，你还在等什么？\n\n#效率 #AI工具`
        ]
    }
};

// ============================
// Mock 降级生成
// ============================
function pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function generateMockOutput(data, platforms, tone, count) {
    let html = '';
    const platformNames = { xiaohongshu: '📕 小红书', twitter: '🐦 X/Twitter', wechat: '💬 朋友圈' };

    platforms.forEach(platform => {
        const platformTemplates = TEMPLATES[platform];
        if (!platformTemplates) return;

        const toneTemplates = platformTemplates[tone] || platformTemplates['professional'] || platformTemplates['casual'];
        const selected = pickRandom(toneTemplates, Math.min(count, toneTemplates.length));

        selected.forEach((template, i) => {
            const text = template(data);
            html += `
                <div class="output-card">
                    <div class="output-card-header">
                        <h4><span class="platform-badge">${platformNames[platform] || platform}</span> 文案 ${i + 1}</h4>
                        <button class="copy-btn" onclick="copyText(this)">📋 复制</button>
                    </div>
                    <div class="output-text">${text}</div>
                </div>
            `;
        });
    });

    return html;
}

// ============================
// 渲染输出卡片（通用）
// ============================
function renderOutput(platformTexts, platformNames) {
    let html = '';
    for (const [platform, texts] of Object.entries(platformTexts)) {
        texts.forEach((text, i) => {
            html += `
                <div class="output-card">
                    <div class="output-card-header">
                        <h4><span class="platform-badge">${platformNames[platform] || platform}</span> 文案 ${i + 1}</h4>
                        <button class="copy-btn" onclick="copyText(this)">📋 复制</button>
                    </div>
                    <div class="output-text">${escapeHtml(text)}</div>
                </div>
            `;
        });
    }
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================
// 主生成函数
// ============================
async function generateCopy() {
    // 收集表单数据
    const productName = document.getElementById('productName').value.trim();
    if (!productName) {
        showToast('请填写产品/品牌名称');
        return;
    }

    const productDesc = document.getElementById('productDesc').value.trim() || '一款提升效率的 AI 工具';
    const targetAudience = document.getElementById('targetAudience').value.trim() || '职场人士';
    const highlightsText = document.getElementById('keyHighlights').value.trim();
    const highlights = highlightsText
        ? highlightsText.split('\n').filter(h => h.trim()).map(h => h.trim())
        : ['提升效率', '简单易用'];
    const tone = document.getElementById('tone').value;
    const count = parseInt(document.getElementById('count').value);
    const platforms = getSelectedPlatforms();

    if (platforms.length === 0) {
        showToast('请至少选择一个发布平台');
        return;
    }

    const data = {
        name: productName,
        desc: productDesc,
        audience: targetAudience,
        highlights: highlights
    };

    // 显示加载状态
    const loadingEl = document.getElementById('loading');
    const outputSection = document.getElementById('outputSection');
    loadingEl.classList.add('active');
    outputSection.classList.remove('active');
    outputSection.innerHTML = '';

    // 尝试 API 生成
    const apiKey = getApiKey();
    let usedApi = false;

    if (apiKey) {
        try {
            const platformNames = { xiaohongshu: '📕 小红书', twitter: '🐦 X/Twitter', wechat: '💬 朋友圈' };
            const platformTexts = {};

            // 并发调用各平台
            const promises = platforms.map(async (platform) => {
                const systemPrompt = getSystemPrompt(platform, tone);
                const userMessage = buildUserMessage(data, count);
                const raw = await callClaudeAPI(apiKey, systemPrompt, userMessage);
                // 按分隔符拆分
                const parts = raw.split('===SEPARATOR===').map(s => s.trim()).filter(s => s);
                platformTexts[platform] = parts.slice(0, count);
            });

            await Promise.all(promises);

            // 检查是否有任何结果
            const hasResult = Object.values(platformTexts).some(arr => arr.length > 0);
            if (hasResult) {
                const html = renderOutput(platformTexts, platformNames);
                loadingEl.classList.remove('active');
                outputSection.innerHTML = html;
                outputSection.classList.add('active');
                showToast('✅ AI 文案生成成功！');
                usedApi = true;
            } else {
                throw new Error('API 返回内容为空');
            }
        } catch (e) {
            console.warn('API 调用失败，降级到 Mock:', e.message);
            // 降级到 Mock
        }
    }

    // Mock 降级
    if (!usedApi) {
        // 模拟延迟（保持 UX 一致）
        await new Promise(resolve => setTimeout(resolve, 800));
        const html = generateMockOutput(data, platforms, tone, count);
        loadingEl.classList.remove('active');
        outputSection.innerHTML = html;
        outputSection.classList.add('active');
        const msg = apiKey ? '⚠️ API 调用失败，已使用本地模板' : '✅ 文案生成成功！（本地模板模式）';
        showToast(msg);
    }
}

// ============================
// UI 工具函数
// ============================
function getSelectedPlatforms() {
    return Array.from(document.querySelectorAll('.platform-toggle.active'))
        .map(el => el.dataset.platform);
}

function copyText(btn) {
    const text = btn.closest('.output-card').querySelector('.output-text').textContent;
    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 已复制到剪贴板');
    }).catch(() => {
        const range = document.createRange();
        const el = btn.closest('.output-card').querySelector('.output-text');
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        showToast('📋 已复制到剪贴板');
    });
}

function clearAll() {
    document.getElementById('productName').value = '';
    document.getElementById('productDesc').value = '';
    document.getElementById('targetAudience').value = '';
    document.getElementById('keyHighlights').value = '';
    document.getElementById('outputSection').classList.remove('active');
    document.getElementById('outputSection').innerHTML = '';
    showToast('已清空');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

// ============================
// 初始化
// ============================
document.addEventListener('DOMContentLoaded', function () {
    // 平台切换
    document.querySelectorAll('.platform-toggle').forEach(el => {
        el.addEventListener('click', function () {
            const cb = this.querySelector('input[type=checkbox]');
            cb.checked = !cb.checked;
            this.classList.toggle('active');
        });
    });

    // API Key 输入框初始化
    const savedKey = getApiKey();
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput && savedKey) {
        apiKeyInput.value = savedKey;
    }

    // API Key 自动保存
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', function () {
            if (this.value) {
                setApiKey(this.value);
            } else {
                clearApiKey();
            }
        });
    }
});
