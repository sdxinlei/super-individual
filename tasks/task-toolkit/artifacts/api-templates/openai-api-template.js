/**
 * OpenAI 兼容 API 通用封装模板
 * ===========================================
 * 复制即用 — 替换 CONFIG 中的 API_KEY 来源即可
 *
 * 功能：
 * - 兼容 OpenAI / Azure OpenAI / 任何 OpenAI 兼容接口
 * - localStorage Key 管理（也支持环境变量）
 * - 请求封装（流式 / 非流式）
 * - 错误分类（401 / 403 / 5xx / 网络错误）
 * - Mock 降级（后端挂了也能演示）
 */

// ===================== 配置 =====================
const CONFIG = {
  // Key 来源：'localStorage' | 'env' | 'prompt'
  keySource: 'localStorage',
  localStorageKey: 'openai_api_key',
  envVarName: 'OPENAI_API_KEY',

  // API 地址 — 改成任意兼容接口（如 vllm / Ollama / Azure）
  apiBase: 'https://api.openai.com/v1',
  // Azure 用户请改为：'https://<资源名>.openai.azure.com/openai/deployments/<部署名>/chat/completions?api-version=2024-02-15-preview'

  model: 'gpt-4o',
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
  const key = prompt('请输入 OpenAI API Key：');
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

class OpenAIApiError extends Error {
  constructor(message, type, status, originalError) {
    super(message);
    this.name = 'OpenAIApiError';
    this.type = type; // 'auth' | 'rate_limit' | 'server' | 'network' | 'unknown'
    this.status = status;
    this.originalError = originalError;
  }
}

function classifyError(error, status) {
  if (status === 401 || status === 403) {
    return new OpenAIApiError(
      '认证失败：请检查 API Key 是否有效',
      'auth',
      status,
      error
    );
  }
  if (status === 429) {
    return new OpenAIApiError(
      '请求过于频繁：请稍后重试',
      'rate_limit',
      status,
      error
    );
  }
  if (status >= 500) {
    return new OpenAIApiError(
      '服务暂时不可用，请稍后重试',
      'server',
      status,
      error
    );
  }
  if (error && error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return new OpenAIApiError(
      '网络连接失败：请检查网络',
      'network',
      0,
      error
    );
  }
  return new OpenAIApiError(
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
    localStorage.getItem('openai_mock') === 'true'
  );
}

function getMockResponse(messages) {
  const lastMsg = messages[messages.length - 1]?.content || '';
  return {
    id: 'mock-msg-' + Date.now(),
    object: 'chat.completion',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: `[Mock 模式] 您发送的消息：\n\n"${lastMsg.slice(0, 100)}"\n\n这是模拟回复，不消耗 API 额度。\n请将 localStorage 中的 openai_mock 设为 "false" 以关闭 Mock 模式。`,
        },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// ===================== 核心请求函数 =====================

/**
 * 非流式 Chat Completion
 * @param {Array} messages - [{role: 'system'|'user'|'assistant', content: '...'}]
 * @param {Object} options - 可选覆盖配置
 * @returns {Promise<Object>} OpenAI 兼容响应
 */
async function openaiChat(messages, options = {}) {
  if (isMockMode()) {
    return getMockResponse(messages);
  }

  const apiKey = getApiKey();
  const body = {
    model: options.model || CONFIG.model,
    max_tokens: options.maxTokens || CONFIG.maxTokens,
    temperature: options.temperature ?? CONFIG.defaultTemperature,
    messages,
  };

  let response;
  try {
    response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
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
 * @param {Function} onError - (err: OpenAIApiError) => void
 */
async function openaiChatStream(messages, options = {}, onChunk, onDone, onError) {
  if (isMockMode()) {
    const mock = getMockResponse(messages);
    const text = mock.choices[0].message.content;
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
  };

  let response;
  try {
    response = await fetch(`${CONFIG.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    onError?.(classifyError(err, 0));
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
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // 跳过解析失败的块
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
async function openaiAsk(systemPrompt, userMessage, options = {}) {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ];
  const res = await openaiChat(messages, options);
  return res.choices[0].message.content;
}

// ===================== 导出 =====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    getApiKey,
    setLocalApiKey,
    removeLocalApiKey,
    openaiChat,
    openaiChatStream,
    openaiAsk,
    OpenAIApiError,
    isMockMode,
  };
}
