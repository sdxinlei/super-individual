# Result: task-weekly-report - AI 周报生成工具 MVP

## 状态
completed

## 产出文件
- tasks/task-weekly-report/artifacts/weekly_report.py: 主程序（~250 行，含完整中文注释）
- tasks/task-weekly-report/artifacts/requirements.txt: 依赖清单（openai + python-dotenv）
- tasks/task-weekly-report/artifacts/.env.example: 环境变量配置示例
- tasks/task-weekly-report/artifacts/README.md: 完整使用说明

## 功能特性
1. **交互式 CLI 模式** — 逐日问答录入，自动计算本周日期范围
2. **批量 JSON 模式** — `--input data.json --output report.md` 传入数据
3. **AI 增强** — 自动生成周总结、润色周报（OpenAI 兼容 API）
4. **优雅降级** — 无 API key/网络不可用时，使用基础 Markdown 模板
5. **丰富降级提示** — 缺少 openai 包时打印 pip install 指引
6. **可配置** — 全部通过环境变量控制（API key/base_url/model/temperature）
7. **健壮错误处理** — 网络超时、API 错误、无效输入均有捕获

## 自检
- [x] 交互模式 + 批量模式双通道
- [x] AI 增强 + 基础模板双路径降级
- [x] 中文注释全覆盖
- [x] 边界条件处理（空输入、API 故障、文件不存在）
- [x] README 含安装/配置/示例/技术栈
