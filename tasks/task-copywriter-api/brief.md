# Task: task-copywriter-api - AI 文案助手接入真实 API

## 背景
AI 文案助手目前使用 Mock 数据生成文案。需要接入真实 LLM API（当前用 Claude API，因为项目本身就是 Claude 生态），让工具真正可用，可以作为展示作品。

## 输入
- 现有文件：`super-individual/copywriter/index.html`
- 当前行为：前端纯静态，点击"生成"后 JS 从内置的 Mock 数组随机取文案
- 目标行为：收集用户输入（产品名称、特点、目标用户、风格），调用 API 生成定制文案

## 要求

### 方案
采用 **纯前端方案**（保持现有部署方式，不需要后端）：
- 使用 Anthropic Claude API 或兼容的 API 端点
- API Key 通过用户自行输入（界面加 API Key 输入框，本地存储到 localStorage）
- 或使用免费 API（如 Google Gemini API）

### 具体改动

1. **API Key 管理**
   - 在输入区上方添加 API Key 输入框（密码模式）
   - 存储到 localStorage，下次自动填充
   - 增加"清除 Key"按钮

2. **API 调用**
   - 支持 Claude API（`/v1/messages` 端点）
   - 支持 OpenAI 兼容 API（可选降级方案）
   - prompt 模板：根据用户输入的产品信息 + 选择平台 + 风格，构造合适的 prompt

3. **Prompt 模板设计**
   - 小红书文案风格：口语化、emoji 丰富、段落短
   - X/Twitter 风格：简洁、有钩子、英文
   - 朋友圈风格：亲切、信任感、中文
   - 每种风格在 JS 中作为模板函数

4. **错误处理**
   - API Key 无效 → 提示用户检查
   - API 调用失败 → 优雅降级（可降级到 Mock）
   - 加载状态展示

### 不改变
- 页面样式和布局不变
- 平台切换 UI 不变
- 复制按钮行为不变

## 产出文件
- `super-individual/copywriter/index.html`（修改）
- `super-individual/copywriter/app.js`（新建 — 把内联 JS 提取到独立文件）
- `tasks/task-copywriter-api/artifacts/`（备份改动说明）

## 注意事项
- 不要让 API Key 在页面源码中硬编码
- prompt 要写得足够好，让 API 产出高质量的文案
- 保留 Mock 作为 fallback

## 自检清单
- [ ] API Key 可输入、可保存、可清除
- [ ] Claude API 调用正常工作
- [ ] 3 种文案风格 prompt 不同且合理
- [ ] API 失败时自动降级 Mock
- [ ] 无硬编码密钥
