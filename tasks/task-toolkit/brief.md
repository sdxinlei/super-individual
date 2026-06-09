# Task: task-toolkit - 接单工具箱（加速交付模板集）

## 背景
接单需要快速交付。准备一套通用模板工具箱，每次接单直接复用。

## 产出目录结构（全部放到 artifacts/）
```
tasks/task-toolkit/artifacts/
├── api-templates/
│   ├── claude-api-template.js    — Claude API 通用封装
│   ├── openai-api-template.js    — OpenAI 兼容 API 封装
│   └── README.md
├── scraper-templates/
│   ├── generic-scraper.py        — Python 爬虫模板
│   └── README.md
├── proposal-templates/
│   ├── proposal-template.md      — 客户方案书
│   └── quote-template.md         — 报价单（三级定价）
├── boilerplate/
│   ├── dark-portfolio-template/
│   │   ├── index.html
│   │   └── style.css
│   └── tool-landing-template/
│       └── index.html
├── sop/
│   ├── onboarding-sop.md         — 接单 SOP
│   └── delivery-checklist.md     — 交付检查清单
└── README.md
```

## 具体内容要求

### api-templates/
- Claude API 封装：localStorage Key 管理、请求函数、错误分类（401/403/5xx）、Mock 降级
- OpenAI API 封装：同上风格
- README：使用说明

### scraper-templates/
- Python 爬虫：requests + BeautifulSoup、防反爬、错误重试、命令行参数、JSON/CSV 输出

### proposal-templates/
- 方案书模板：项目背景、技术方案、交付物、时间排期、报价
- 报价单：基础/标准/尊享三级

### boilerplate/
- 深色科技风站点模板：跟主站风格一致，可复用
- 工具落地页模板：通用工具页面结构

### sop/
- 接单 SOP：沟通→方案→开发→交付→售后
- 交付清单：代码/测试/文档/部署验证

## 注意事项
- 代码模板"复制就能跑"
- 方案模板"填变量就能用"
- 不包含硬编码密钥
- 先 mkdir -p 再写文件

## 自检清单
- [ ] 所有目录和文件都生成
- [ ] 代码模板可运行
- [ ] 模板无硬编码密钥
