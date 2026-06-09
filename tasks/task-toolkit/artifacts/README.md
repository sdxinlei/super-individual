# 接单工具箱 — 快速交付模板集

一套可复用的通用模板，加速从接单到交付的全流程。

## 目录结构

```
├── api-templates/          # API 封装模板
│   ├── claude-api-template.js    — Claude API 通用封装
│   ├── openai-api-template.js    — OpenAI 兼容 API 封装
│   └── README.md
├── scraper-templates/      # 爬虫模板
│   ├── generic-scraper.py        — Python 通用爬虫
│   └── README.md
├── proposal-templates/     # 方案与报价模板
│   ├── proposal-template.md      — 技术方案书
│   └── quote-template.md         — 三级定价报价单
├── boilerplate/            # 站点样板
│   ├── dark-portfolio-template/  — 深色科技风作品集
│   └── tool-landing-template/    — 工具落地页
├── sop/                    # SOP 标准流程
│   ├── onboarding-sop.md         — 接单 SOP
│   └── delivery-checklist.md     — 交付检查清单
└── README.md               # 本文件
```

## 使用说明

所有模板遵循"复制即用"原则：

- **代码模板**：替换配置即可运行
- **文档模板**：替换 `{{变量}}` 即可使用
- **不含任何硬编码密钥**

## 快速索引

| 场景 | 使用模板 |
|------|----------|
| 对接 Claude API | `api-templates/claude-api-template.js` |
| 对接 GPT / 兼容 API | `api-templates/openai-api-template.js` |
| 爬取网页数据 | `scraper-templates/generic-scraper.py` |
| 写客户方案书 | `proposal-templates/proposal-template.md` |
| 做三级报价 | `proposal-templates/quote-template.md` |
| 搭建科技风作品集 | `boilerplate/dark-portfolio-template/` |
| 搭��工具型落地页 | `boilerplate/tool-landing-template/` |
| 梳理接单全流程 | `sop/onboarding-sop.md` |
| 交付前自检 | `sop/delivery-checklist.md` |
