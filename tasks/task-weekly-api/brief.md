# Task: task-weekly-api - 周报生成器接入真实 API

## 背景
AI 周报生成器目前使用 Mock AI 生成周报。需要接入真实 LLM API，让工具真正可用。

## 输入
- 现有文件：`super-individual/weekly-report/index.html` + `super-individual/weekly-report/app.js`
- 当前行为：JS 内置 Mock 生成逻辑（简单拼接模板）
- 目标行为：用户输入每日工作内容 → API 生成结构化的高质量周报

## 要求

### 方案
与文案助手相同的纯前端方案：
- 使用 Claude API（兼容 OpenAI 格式）
- API Key 用户自行输入，localStorage 存储

### 具体改动

1. **API Key 管理**
   - 在输入区上方添加 API Key 输入框（密码模式）
   - localStorage 持久化

2. **API 调用改造**
   - 修改 `app.js` 中的 `generateReport()` 函数
   - 调用 Claude API `POST /v1/messages`
   - prompt 模板：将每日输入整理为结构化周报
   - 保留 Mock 作为 fallback

3. **Prompt 模板**
   ```
   你是一个专业的周报撰写助手。根据用户提供的每日工作内容，生成结构化 Markdown 周报。

   格式要求：
   - ## 本周工作总结
   - ### 重点工作（每项含背景、行动、结果）
   - ### 问题与解决
   - ### 下周计划
   ```

4. **错误处理**
   - API Key 无效提示
   - 调用失败降级 Mock
   - 加载状态展示

### 不改变
- 页面样式和布局不变
- 每日输入 UI 不变
- 复制/导出功能不变

## 产出文件
- `super-individual/weekly-report/app.js`（修改）
- `super-individual/weekly-report/index.html`（微调，加 API Key 输入）
- `tasks/task-weekly-api/artifacts/`（备份改动说明）

## 注意事项
- prompt 要保证周报输出格式稳定（可用 few-shot 示例）
- 保留用户现有的每日输入数据结构
- Mock fallback 要无缝降级

## 自检清单
- [ ] API Key 可输入、可保存、可清除
- [ ] 周报格式稳定（Markdown 结构化）
- [ ] API 失败自动降级 Mock
- [ ] 保留现有复制/导出功能
