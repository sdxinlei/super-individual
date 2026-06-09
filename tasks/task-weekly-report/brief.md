# Task: task-weekly-report - AI 周报生成工具 MVP

## 背景
根据「超级个体计划-执行篇」Day 2 要求：用 Python + GPT API 写一个 CLI 工具，输入今日工作内容，输出周报。开源发布到 GitHub 作为第一个公开作品。

## 输入
- 技术栈: Python 3 + OpenAI API（兼容任意 LLM API）
- 输出格式: Markdown 周报（周一至周日，含完成事项、问题、明日计划）
- 使用方式: CLI 工具

## 要求
1. Python CLI 工具，单文件或少量文件
2. 功能：逐日输入工作内容 → 自动汇总为周报 Markdown
3. 支持两种模式：
   a. 交互式 CLI（逐日问答输入）
   b. 批量模式（传入 JSON 文件）
4. 输出为美观的 Markdown 周报，含日期范围、每日 summary、下周计划
5. 项目根目录需要 README.md 说明用法
6. 配置通过环境变量 OPENAI_API_KEY 或 .env 文件

## 产出文件
- tasks/task-weekly-report/artifacts/weekly_report.py: 主程序
- tasks/task-weekly-report/artifacts/requirements.txt: 依赖清单
- tasks/task-weekly-report/artifacts/.env.example: 环境变量示例
- tasks/task-weekly-report/artifacts/README.md: 使用说明
- tasks/task-weekly-report/result.md: 完成报告

## 注意事项
- 使用标准库 + openai 库，最小依赖
- 错误处理完善（网络超时、API 错误、无效输入）
- 代码添加中文注释
- 支持 OpenAI 兼容 API（可配置 base_url）
