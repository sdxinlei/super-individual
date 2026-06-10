/**
 * AI 周报生成器 - 应用逻辑
 * 超级个体 | AI 工具开发者
 */

// ============================================================
// API Key 管理
// ============================================================

const STORAGE_KEY = 'weekly_report_api_key';

function getApiKey() {
    const key = document.getElementById('apiKey').value.trim();
    if (key) {
        localStorage.setItem(STORAGE_KEY, key);
    }
    return key || localStorage.getItem(STORAGE_KEY) || '';
}

function loadApiKey() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        document.getElementById('apiKey').value = saved;
    }
}

// 页面加载时恢复 API Key
document.addEventListener('DOMContentLoaded', loadApiKey);

// ============================================================
// Claude API 调用
// ============================================================

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-6';

function buildPrompt(data) {
    const { days, projectName, tone } = data;
    const weekNum = getWeekNumber(new Date());
    const dateStr = getWeekDateRange();
    const proj = projectName || '本周工作';

    const toneDesc = {
        professional: '专业详细风格：结构完整，包含概述、详细内容、下周计划，语言正式',
        concise: '简洁扼要风格：每行一句话总结每日要点，不做展开',
        technical: '技术向风格：聚焦技术细节，使用代码块展示关键实现'
    };

    // 构建每天的内容
    const dayEntries = [];
    const dayNames = ['周一', '周二', '周三', '周四', '周五'];
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri'];
    keys.forEach((key, i) => {
        const content = days[key] && days[key].trim();
        if (content) {
            dayEntries.push(`### ${dayNames[i]}\n${content}`);
        } else {
            dayEntries.push(`### ${dayNames[i]}\n（无记录）`);
        }
    });

    return `你是一个专业的周报生成助手。请根据以下每天的工作内容，生成一份结构化的 Markdown 周报。

项目名称：${proj}
时间范围：${dateStr}（第 ${weekNum} 周）
风格要求：${toneDesc[tone] || toneDesc.professional}

每天的工作内容：
${dayEntries.join('\n\n')}

请严格按照 Markdown 格式生成周报。只输出周报内容，不需要额外的说明。`;
}

async function callClaudeAPI(apiKey, prompt) {
    const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: 4096,
            messages: [
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorType = errorBody?.error?.type || '';
        const errorMsg = errorBody?.error?.message || response.statusText;

        if (response.status === 401 || response.status === 403) {
            throw new Error(`API_KEY_INVALID: ${errorMsg}`);
        }
        throw new Error(`API_ERROR(${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    let result = '';

    for (const block of data.content) {
        if (block.type === 'text') {
            result += block.text;
        }
    }

    return result;
}

// ============================================================
// 模拟 AI 生成（API 降级备用）
// ============================================================

function generateMockReport(data) {
    const { days, projectName, tone } = data;
    const weekNum = getWeekNumber(new Date());
    const proj = projectName || '本周工作';
    const dateStr = getWeekDateRange();

    let report = '';

    if (tone === 'professional') {
        report = `# ${proj} · 第 ${weekNum} 周工作周报\n\n`;
        report += `**时间范围**：${dateStr}\n\n`;
        report += `---\n\n`;
        report += `## 一、本周工作概述\n\n`;
        report += `本周主要围绕以下方面开展工作：\n\n`;

        const summaries = [];
        if (days.mon) summaries.push(days.mon.split('，')[0] || days.mon.slice(0, 20));
        if (days.tue) summaries.push(days.tue.split('，')[0] || days.tue.slice(0, 20));
        if (days.wed) summaries.push(days.wed.split('，')[0] || days.wed.slice(0, 20));
        if (summaries.length > 0) {
            report += `- ${summaries.join('；')}\n\n`;
        }

        report += `## 二、详细工作内容\n\n`;

        const dayNames = ['周一', '周二', '周三', '周四', '周五'];
        const keys = ['mon', 'tue', 'wed', 'thu', 'fri'];
        keys.forEach((key, i) => {
            if (days[key] && days[key].trim()) {
                report += `### ${dayNames[i]}\n\n${days[key]}\n\n`;
            } else {
                report += `### ${dayNames[i]}\n\n（无记录）\n\n`;
            }
        });

        report += `---\n\n`;
        report += `## 三、下周计划\n\n`;
        report += `- 持续推进现有工作\n`;
        report += `- 根据本周情况优化流程\n\n`;
        report += `---\n\n`;
        report += `*周报由 AI 自动生成*`;
    } else if (tone === 'concise') {
        report = `# ${proj} 周报 · W${weekNum}\n\n`;
        report += `**${dateStr}**\n\n`;
        report += `---\n\n`;

        const dayNames = ['周一', '周二', '周三', '周四', '周五'];
        const keys = ['mon', 'tue', 'wed', 'thu', 'fri'];
        keys.forEach((key, i) => {
            if (days[key] && days[key].trim()) {
                const firstLine = days[key].split('，')[0] || days[key].slice(0, 30);
                report += `**${dayNames[i]}**：${firstLine}\n\n`;
            }
        });

        report += `**下周**：持续推进\n\n`;
        report += `---\n*AI 生成*`;
    } else {
        // technical
        report = `# ${proj} · 技术周报 W${weekNum}\n\n`;
        report += `**周期**：${dateStr}\n\n`;
        report += `---\n\n`;
        report += `## 工作项\n\n`;

        const dayNames = ['周一', '周二', '周三', '周四', '周五'];
        const keys = ['mon', 'tue', 'wed', 'thu', 'fri'];
        keys.forEach((key, i) => {
            if (days[key] && days[key].trim()) {
                report += `### ${dayNames[i]}\n\`\`\`\n${days[key]}\n\`\`\`\n\n`;
            }
        });

        report += `## 技术要点\n\n`;
        report += `- 持续集成/交付流程正常\n`;
        report += `- 代码质量在可控范围内\n\n`;
        report += `---\n*AI 生成*`;
    }

    return report;
}

function getWeekNumber(d) {
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const diff = d - startOfYear + (startOfYear.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
    return Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
}

function getWeekDateRange() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${fmt(monday)} - ${fmt(friday)}`;
}

async function generateReport() {
    const data = {
        days: {
            mon: document.getElementById('mon').value.trim(),
            tue: document.getElementById('tue').value.trim(),
            wed: document.getElementById('wed').value.trim(),
            thu: document.getElementById('thu').value.trim(),
            fri: document.getElementById('fri').value.trim()
        },
        projectName: document.getElementById('projectName').value.trim(),
        tone: document.getElementById('tone').value
    };

    const hasContent = Object.values(data.days).some(v => v.length > 0);
    if (!hasContent) {
        showToast('请至少填写一天的工作内容');
        return;
    }

    // Show loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('outputSection').classList.remove('active');

    const apiKey = getApiKey();

    if (apiKey) {
        try {
            const prompt = buildPrompt(data);
            const report = await callClaudeAPI(apiKey, prompt);
            displayReport(report);
            showToast('✅ 周报生成成功！');
            return;
        } catch (err) {
            if (err.message.startsWith('API_KEY_INVALID')) {
                showToast('❌ API Key 无效，请检查后重试。已降级使用模拟数据');
            } else if (err.message.startsWith('API_ERROR(529)') || err.message.startsWith('API_ERROR(5')) {
                showToast('⚠️ API 暂时不可用，已降级使用模拟数据');
            } else {
                console.warn('API 调用失败，降级到 Mock：', err.message);
                showToast('⚠️ API 调用失败，已降级使用模拟数据');
            }
            // Fall through to mock
        }
    }

    // Mock fallback (API Key 为空 或 API 调用失败)
    await new Promise(resolve => setTimeout(resolve, 1200));
    const report = generateMockReport(data);
    displayReport(report);
    showToast('✅ 周报生成成功！');
}

function displayReport(report) {
    document.getElementById('loading').classList.remove('active');

    const contentEl = document.getElementById('reportContent');
    contentEl.innerHTML = report.replace(/\n/g, '<br>').replace(/#{3} (.*?)(?:<br>|$)/g, '<h3>$1</h3>')
        .replace(/## (.*?)(?:<br>|$)/g, '<h2>$1</h2>')
        .replace(/# (.*?)(?:<br>|$)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/---/g, '<hr>')
        .replace(/- (.*?)(?:<br>|$)/g, '• $1<br>')
        .replace(/```/g, '');

    document.getElementById('outputSection').classList.add('active');
}

function copyReport() {
    const content = document.getElementById('reportContent');
    const text = content.textContent || content.innerText;

    navigator.clipboard.writeText(text).then(() => {
        showToast('📋 已复制到剪贴板');
    }).catch(() => {
        // Fallback
        const range = document.createRange();
        range.selectNode(content);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        showToast('📋 已复制到剪贴板');
    });
}

function downloadReport() {
    const content = document.getElementById('reportContent');
    const text = content.textContent || content.innerText;

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `周报_${getWeekNumber(new Date())}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('⬇️ 已下载');
}

function clearAll() {
    ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('projectName').value = '';
    document.getElementById('tone').value = 'professional';
    document.getElementById('outputSection').classList.remove('active');
    showToast('已清空');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

