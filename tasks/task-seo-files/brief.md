# Task: task-seo-files - 生成 SEO 标准文件

## 背景
超级个体站点即将部署 GitHub Pages。需要标准的 SEO 基础设施文件：站点地图、robots.txt、404 页面、favicon。

## 输入
- 站点 URL: `https://sdxinlei.github.io/super-individual/`
- 页面结构:
  - `/super-individual/index.html` — 个人主页
  - `/super-individual/weekly-report/index.html` — AI 周报生成器
  - `/super-individual/copywriter/index.html` — AI 文案助手

## 要求

### 产出物 1: sitemap.xml
文件: `super-individual/sitemap.xml`
- 包含所有 3 个页面
- 合理的优先级和更新频率
- 首页 priority 1.0, 工具页 0.8
- 使用当前日期

### 产出物 2: robots.txt
文件: `super-individual/robots.txt`
- 允许所有爬虫
- 指向 sitemap.xml

### 产出物 3: 404.html
文件: `super-individual/404.html`
- 与主站风格一致（深色科技风，靛蓝紫色系）
- 包含返回首页链接
- 幽默友好的 404 信息
- 加载 CSS: `../css/style.css`
- 保持导航栏一致性

### 产出物 4: favicon 生成指引
文件: `super-individual/favicon-guide.md`
- 因为无法生成图片文件，生成一份指引说明如何用在线工具生成 favicon
- 推荐配色：#6366f1 (靛蓝) 背景 + 白色 "S" 或 "🚀"
- 推荐工具: favicon.io / canva
- 然后在 index.html 的 <head> 中添加 favicon link 占位:
  `<link rel="icon" type="image/png" href="favicon/favicon-96x96.png">`

### 产出物 5: 更新 index.html head
在 `super-individual/index.html` 的 `<head>` 中添加:
- favicon link 占位
- robots meta 标签: `<meta name="robots" content="index, follow">`
- canonical URL: `<link rel="canonical" href="https://sdxinlei.github.io/super-individual/">`

## 产出文件
- `super-individual/sitemap.xml` (新建)
- `super-individual/robots.txt` (新建)
- `super-individual/404.html` (新建)
- `super-individual/favicon-guide.md` (新建)
- `super-individual/index.html` (修改，加 head 标签)

## 自检清单
- [ ] sitemap.xml 合法 XML
- [ ] robots.txt 语法正确
- [ ] 404.html 与主站风格一致
- [ ] favicon 指引完整可行
- [ ] index.html head 更新正确
