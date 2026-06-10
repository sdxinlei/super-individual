/**
 * 小红书封面卡批量生成器
 * 读取 xiaohongshu-15.md → 提取封面卡标题/副标题 → 生成 15 个 HTML 文件
 *
 * 用法: node generate-covers.js
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = 'd:/超级个体/tasks/task-content-production/cover-template.html';
const XHS_PATH = 'd:/超级个体/tasks/task-content-production/artifacts/xiaohongshu-15.md';
const OUT_DIR = 'd:/超级个体/tasks/task-content-production/artifacts/covers';

function extractCoverData(md) {
  const covers = [];
  const lines = md.split('\n');
  let current = null;
  let sectionCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (line.includes('笔记') || line.includes('篇')) {
        sectionCount++;
        current = { id: sectionCount };
      }
    }
    if (line.includes('封面卡标题')) {
      if (current) current.title = line.split('：')[1]?.trim() || line.split(':')[1]?.trim() || '';
    }
    if (line.includes('封面卡副标题')) {
      if (current) {
        current.subtitle = line.split('：')[1]?.trim() || line.split(':')[1]?.trim() || '';
        // Look backwards for the note title (format: **标题**：...)
        for (let j = i - 1; j >= 0 && j >= i - 8; j--) {
          const prevLine = lines[j];
          if (prevLine.startsWith('**标题**') && prevLine.includes('：')) {
            current.noteTitle = prevLine.split('：')[1]?.trim() || prevLine.split(':')[1]?.trim() || '';
            break;
          }
        }
        covers.push({...current});
        current = null;
      }
    }
  }

  return covers;
}

function generateCover(template, data) {
  return template
    .replace('{{主标题}}', data.title || 'AI 效率工具推荐')
    .replace('{{副标题}}', data.subtitle || '独立开发者私藏清单')
    .replace('{{主题}}', data.noteTitle?.slice(0, 20) || '效率工具');
}

async function main() {
  // Read template
  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Read xhs markdown
  let xhsContent;
  try {
    xhsContent = fs.readFileSync(XHS_PATH, 'utf-8');
  } catch(e) {
    console.log('小红书内容尚未生成，等待中...');
    console.log('先使用默认主题生成占位封面');
    xhsContent = '';
  }

  // Create output dir
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // Extract cover data
  let covers;
  if (xhsContent) {
    covers = extractCoverData(xhsContent);
    console.log(`提取到 ${covers.length} 个封面数据`);
  }

  // If no data or less than 15, generate 15 with default/fallback content
  const defaultCovers = [
    { title: '效率翻3倍', subtitle: '独立开发者AI工具', noteTitle: 'AI效率工具推荐-独立开发者篇' },
    { title: '自媒体必备AI', subtitle: '日更10条不费劲', noteTitle: 'AI效率工具推荐-自媒体篇' },
    { title: '职场AI提效', subtitle: '每天少加班2小时', noteTitle: 'AI效率工具推荐-职场人篇' },
    { title: 'AI副业月入过万', subtitle: '一个人就是一家公司', noteTitle: '副业赚钱-AI赋能自由职业' },
    { title: '独立开发接单', subtitle: '3个月从0到接单', noteTitle: '副业赚钱-一个人怎么接单' },
    { title: '副业心态建设', subtitle: '不要等准备好了再开始', noteTitle: '副业赚钱-心态建设' },
    { title: '小红书标题公式', subtitle: '打开率提升300%', noteTitle: '运营技巧-标题公式' },
    { title: '标签策略指南', subtitle: '精准获取推荐流量', noteTitle: '运营技巧-标签策略' },
    { title: '笔记排版美学', subtitle: '看完就想关注你', noteTitle: '运营技巧-排版视觉' },
    { title: '小红书工厂测评', subtitle: '5分钟生成一篇爆款', noteTitle: '工具种草-小红书工厂' },
    { title: 'AI文案助手', subtitle: '3平台一键适配', noteTitle: '工具种草-AI文案助手' },
    { title: '周报生成器', subtitle: '写周报再也不痛苦', noteTitle: '工具种草-周报生成器' },
    { title: '裸辞做开发', subtitle: '一年后我后悔了吗', noteTitle: '心态成长-裸辞故事' },
    { title: '30岁重启人生', subtitle: '最好的时间是现在', noteTitle: '心态成长-30岁重启' },
    { title: '自律即自由', subtitle: '我的晨间作息表', noteTitle: '心态成长-自律自由' },
  ];

  const finalCovers = covers && covers.length >= 15 ? covers : defaultCovers;

  for (let i = 0; i < 15; i++) {
    const data = finalCovers[i] || defaultCovers[i];
    const html = generateCover(template, data);
    const filename = `cover-${String(i+1).padStart(2, '0')}-${data.title.slice(0, 8).replace(/[/\\?%*:|"<>]/g, '')}.html`;
    fs.writeFileSync(path.join(OUT_DIR, filename), html, 'utf-8');
    console.log(`✅ 生成: ${filename} (${data.title} / ${data.subtitle})`);
  }

  console.log(`\n🎉 共生成 15 张封面卡 HTML`);
  console.log(`📁 ${OUT_DIR}`);
}

main().catch(console.error);
