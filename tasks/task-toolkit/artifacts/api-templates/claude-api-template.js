/**
 * Claude API 通用封装模板
 * ===========================================
 * 复制即用 — 替换 CONFIG 中的 API_KEY 来源即可
 *
 * 功能：
 * - localStorage Key 管理（也支持环境变量）
 * - 请求封装（流式 / 非流式）
 * - 错误分类（401 / 403 / 5xx / 网络错误）
 * - Mock 降级（后端挂了也能演示）
 */

// ===================== 配置 =====================
const CONFIG = {
  // Key 来源：'localStorage' | 'env' | 'prompt'
  keySource: 'localStorage',
  localStorageKey: 'claude_api_key',
  envVarName: 'CLAUDE_API_KEY',
  apiBase: 'https://api.anthropic.com/v1',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  defaultTemperature: 0.7,
};

// ===================== Key 管理 =====================

function getApiKey() {
  if (CONFIG.keySource === 'localStorage') {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage 不可用，请改用 env 模式');
    }
    const key = localStorage.getItem(CONFIG.localStorageKey);
    if (!key) {
      throw new Error(
        `API Key 未设置。请在 localStorage 中设置 "${CONFIG.localStorageKey}"`
      );
    }
    return key;
  }
  if (CONFIG.keySource === 'env') {
    const key = process.env[CONFIG.envVarName];
    if (!key) {
      throw new Error(`环境变量 ${CONFIG.envVarName} 未设置`);
    }
    return key;
  }
  // prompt 模式：运行时由用户输入
  const key = prompt('请输入 Claude API Key：');
  if (!key) throw new Error('用户取消了 Key 输入');
  return key;
}

function setLocalApiKey(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CONFIG.localStorageKey, key);
  }
}

function removeLocalApiKey() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(CONFIG.localStorageKey);
  }
}

// ===================== 错误分类 =====================

class ClaudeApiError extends Error {
  constructor(message, type, status, originalError) {
    super(message);
    this.name = 'ClaudeApiError';
    this.type = type; // 'auth' | 'rate_limit' | 'server' | 'network' | 'unknown'
    this.status = status;
    this.originalError = originalError;
  }
}

function classifyError(error, status) {
  if (status === 401 || status === 403) {
    return new ClaudeApiError(
      '认证失败：请检查 API Key 是否有效',
      'auth',
      status,
      error
    );
  }
  if (status === 429) {
    return new ClaudeApiError(
      '请求过于频繁：请稍后重试',
      'rate_limit',
      status,
      error
    );
  }
  if (status >= 500) {
    return new ClaudeApiError(
      'Claude 服务暂时不可用，请稍后重试',
      'server',
      status,
      error
    );
  }
  if (error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return new ClaudeApiError(
      '网络连接失败：请检查网络',
      'network',
      0,
      error
    );
  }
  return new ClaudeApiError(
    error?.message || '未知错误',
    'unknown',
    status || 0,
    error
  );
}

// ===================== Mock 降级 =====================

function isMockMode() {
  return (
    CONFIG.keySource === 'localStorage' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('claude_mock') === 'true'
  );
}

function getMockResponse(messages) {
  const lastMsg = messages[messages.length - 1]?.content || '';
  return {
    id: 'mock-msg-' + Date.now(),
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: `[Mock 模式] 您发送的消息：\n\n"${lastMsg.slice(0, 100)}"\n\n这是模拟回复，不消耗 API 额度。\n请将 localStorage 中的 claude_mock 设为 "false" 以关闭 Mock 模式。`,
      },
    ],
    model: 'mock-model',
    stop_reason: 'end_turn',
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

// ===================== 核心请求函数 =====================

/**
 * 非流式请求
 * @param {Array} messages - [{role: 'user'|'assistant', content: '...'}]
 * @param {Object} options - 可选覆盖配置
 * @returns {Promise<Object>} Claude API 响应
 */
async function claudeChat(messages, options = {}) {
  if (isMockMode()) {
    return getMockResponse(messages);
  }

  const apiKey = getApiKey();
  const body = {
    model: options.model || CONFIG.model,
    max_tokens: options.maxTokens || CONFIG.maxTokens,
    temperature: options.temperature ?? CONFIG.defaultTemperature,
    messages,
    ...(options.system ? { system: options.system } : {}),
  };

  let response;
  try {
    response = await fetch(`${CONFIG.apiBase}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw classifyError(err, 0);
  }

  if (!response.ok) {
    let errBody;
    try {
      errBody = await response.json();
    } catch {
      errBody = null;
    }
    const err = new Error(errBody?.error?.message || response.statusText);
    throw classifyError(err, response.status);
  }

  return response.json();
}

/**
 * 流式请求 — 逐块回调
 * @param {Array} messages
 * @param {Object} options
 * @param {Function} onChunk - (text: string) => void
 * @param {Function} onDone - (fullText: string) => void
 * @param {Function} onError - (err: ClaudeApiError) => void
 */
async function claudeChatStream(messages, options = {}, onChunk, onDone, onError) {
  if (isMockMode()) {
    const mock = getMockResponse(messages);
    const text = mock.content[0].text;
    // 模拟逐块输出
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk(words[i] + ' ');
      await new Promise((r) => setTimeout(r, 50));
    }
    onDone(text);
    return;
  }

  const apiKey = getApiKey();
  const body = {
    model: options.model || CONFIG.model,
    max_tokens: options.maxTokens || CONFIG.maxTokens,
    temperature: options.temperature ?? CONFIG.defaultTemperature,
    messages,
    stream: true,
    ...(options.system ? { system: options.system } : {}),
  };

  let response;
  try {
    response = await fetch(`${CONFIG.apiBase}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const classified = classifyError(err, 0);
    onError?.(classified);
    return;
  }

  if (!response.ok) {
    let errBody;
    try {
      errBody = await response.json();
    } catch {
      errBody = null;
    }
    const err = new Error(errBody?.error?.message || response.statusText);
    onError?.(classifyError(err, response.status));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (!data || data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch {
          // 跳过解析失败的块
        }
      }
    }
    // 处理 buffer 中剩余内容
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(parsed.delta.text);
          }
        } catch {
          // ignore
        }
      }
    }
    onDone(fullText);
  } catch (err) {
    onError?.(classifyError(err, 0));
  }
}

// ===================== 便捷方法 =====================

/** 简单问答（非流式） */
async function claudeAsk(systemPrompt, userMessage, options = {}) {
  const messages = [{ role: 'user', content: userMessage }];
  const res = await claudeChat(messages, { ...options, system: systemPrompt });
  return res.content[0].text;
}

// ===================== 导出 =====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    getApiKey,
    setLocalApiKey,
    removeLocalApiKey,
    claudeChat,
    claudeChatStream,
    claudeAsk,
    ClaudeApiError,
    isMockMode,
  };
}
