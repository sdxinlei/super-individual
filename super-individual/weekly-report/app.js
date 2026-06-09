/**
 * AI 周报生成器 - 应用逻辑
 * 超级个体 | AI 工具开发者
 */

// 模拟 AI 生成（示��用，后续可接入真实 API）
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

function generateReport() {
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

    // Simulate AI generation delay
    setTimeout(() => {
        const report = generateMockReport(data);
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
        showToast('✅ 周报生成成功！');
    }, 1200);
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
        showToast('���� 已复制到剪贴板');
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
