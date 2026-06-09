# API 模板 — 使用说明

## 文件列表

| 文件 | 说明 |
|------|------|
| `claude-api-template.js` | Claude API (Anthropic) 通用封装 |
| `openai-api-template.js` | OpenAI 兼容 API 通用封装 |

## 快速开始

### 1. 选模板

- 对接 Claude → 用 `claude-api-template.js`
- 对接 GPT / 兼容接口 → 用 `openai-api-template.js`

### 2. 配置 API Key

**方式 A — localStorage（推荐浏览器端）**

```js
// 在浏览器 DevTools Console 中执行
localStorage.setItem('claude_api_key', 'sk-ant-xxx');
// 或
localStorage.setItem('openai_api_key', 'sk-xxx');

// 开启 Mock 模式（不消耗额度）
localStorage.setItem('claude_mock', 'true');
```

**方式 B — 环境变量（推荐 Node.js）**

```bash
export CLAUDE_API_KEY=sk-ant-xxx
export OPENAI_API_KEY=sk-xxx
```

然后在代码中修改 `CONFIG.keySource = 'env'`。

### 3. 基本用法

```js
// Claude
const reply = await claudeAsk('你是一个助手', '你好');
console.log(reply);

// OpenAI
const reply = await openaiAsk('你是一个助手', '你好');
console.log(reply);
```

### 4. 流式输出

```js
await claudeChatStream(
  [{ role: 'user', content: '写一首诗' }],
  {},
  (chunk) => process.stdout.write(chunk),
  (full) => console.log('\n--- 完成 ---'),
  (err) => console.error(err)
);
```

### 5. Mock 降级

当 API 不可用或开发阶段，设置对应的 `localStorage` mock 标志即可获得模拟回复，无需改动代码。

## 自定义 API 地址

修改 `CONFIG.apiBase` 即可切换：

- Azure OpenAI → 填入 Azure 端点 URL
- Ollama → `http://localhost:11434/v1`
- vLLM → 填入部署地址

## 注意事项

- **不要** 在代码中硬编码 API Key
- 浏览器端使用 localStorage 时注意 XSS 风险
- 生产环境建议使用代理中转，避免暴露 Key
