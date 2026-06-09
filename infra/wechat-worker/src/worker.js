/**
 * 超级个体 — WeChat ↔ Claude 中转 Worker
 * =============================================
 * 架构：企业微信自建应用 → Cloudflare Worker → Claude API → 回复
 *
 * 流程：
 *   ① 你在企业微信给「超级个体助手」发消息
 *   ② 企业微信回调 → Worker（GET 验证 URL，POST 收消息）
 *   ③ Worker 调 Claude API 生成回复
 *   ④ Worker 调企业微信 API 发送回复到你的微信
 */

// ===================== 回调 URL 验证 (GET) =====================
async function handleVerify(request) {
  const url = new URL(request.url);
  const msg_signature = url.searchParams.get('msg_signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');
  const echostr = url.searchParams.get('echostr');

  // 如果没有这些参数，说明不是验证请求
  if (!msg_signature || !timestamp || !nonce || !echostr) {
    return new Response('OK', { status: 200 });
  }

  const token = WX_CALLBACK_TOKEN;
  const aesKey = WX_CALLBACK_AES_KEY;

  // 验证签名
  const arr = [token, timestamp, nonce, echostr].sort();
  const calcSig = await sha1(arr.join(''));
  if (calcSig !== msg_signature) {
    console.warn('签名验证失败', { calcSig, msg_signature });
    return new Response('Signature verification failed', { status: 403 });
  }

  // 解密 echostr（企业微信用的是 AES-256-CBC）
  try {
    const decrypted = decryptAES(echostr, aesKey);
    // 返回解密后的内容（明文 echostr）
    return new Response(decrypted, { status: 200 });
  } catch (e) {
    console.error('解密 echostr 失败:', e.message);
    return new Response('Decryption failed', { status: 403 });
  }
}

// ===================== 消息处理 (POST) =====================
async function handleMessage(request) {
  // 读取 XML 请求体
  const xmlText = await request.text();
  const url = new URL(request.url);
  const msg_signature = url.searchParams.get('msg_signature');
  const timestamp = url.searchParams.get('timestamp');
  const nonce = url.searchParams.get('nonce');

  // 验证签名
  const token = WX_CALLBACK_TOKEN;
  const arr = [token, timestamp, nonce, xmlText].sort();
  const calcSig = await sha1(arr.join(''));
  if (calcSig !== msg_signature) {
    console.warn('消息签名验证失败');
    return new Response('Signature verification failed', { status: 403 });
  }

  // 解密消息体
  let decryptedXml;
  try {
    decryptedXml = decryptAES(xmlText, WX_CALLBACK_AES_KEY);
  } catch (e) {
    console.error('消息解密失败:', e.message);
    return new ReplyXml('解密失败', 'text').toResponse();
  }

  // 解析 XML
  const msg = parseXML(decryptedXml.encrypted || decryptedXml);
  console.log('收到消息:', JSON.stringify(msg));

  // 只处理文本消息
  if (msg.MsgType !== 'text') {
    return new ReplyXml('暂只支持文本消息，请发送文字', 'text', msg.FromUserName, msg.ToUserName).toResponse();
  }

  const userMsg = msg.Content;
  const fromUser = msg.FromUserName;

  // 异步回复：先返回 success（避免企业微信超时），再发回复
  // 但我们直接同步处理也可，企业微信有 5s 超时，Claude API 通常在 2-3s
  const reply = await processWithClaude(userMsg, fromUser);

  // 返回 XML 回复给企业微信（企业微信会转发给用户）
  return new ReplyXml(reply, 'text', msg.FromUserName, msg.ToUserName).toResponse();
}

// ===================== Claude 处理核心 =====================
async function processWithClaude(userMessage, userId) {
  const apiKey = CLAUDE_API_KEY;

  // 没设置 API Key → 返回提示
  if (!apiKey) {
    return getDefaultReply(userMessage);
  }

  const systemPrompt = `你是一个名为"超级个体"的 AI 助手和独立开发者。你的角色是一个全栈开发者兼创业者。

核心能力：
- 你可以回答技术问题、编程问题
- 你可以讨论独立开发、创业、AI 相关话题
- 你可以帮助用户梳理思路、做决策
- 你有协作伙伴 Codex（执行者），可以派发编码任务

回复风格：
- 简洁、直接、有行动导向
- 中文回复
- 每次回复控制在 200 字以内
- 如果需要用户操作，清晰列出步骤

当前项目状态：
- 已完成：个人主页、文案助手、周报生成器、小红书内容工厂
- 当前在做：微信接入、小红书工厂 SaaS MVP
- 技术栈：纯前端（HTML/CSS/JS）+ Claude API，GitHub Pages 部署

用户信息：独立开发者，目标年入 100 万（超级个体品牌），用 Claude Code + Codex 双引擎协作工作。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Claude API 错误:', response.status, errText);
      return `Claude API 暂时不可用（${response.status}），请稍后重试。`;
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (e) {
    console.error('Claude API 调用失败:', e.message);
    return '网络错误，暂时无法连接到 AI 服务，请稍后重试。';
  }
}

// ===================== 无 API Key 时的默认回复 =====================
function getDefaultReply(msg) {
  const replies = [
    `收到：「${msg.slice(0, 50)}」`,
    `你好！我是超级个体助手的微信入口。`,
    `当前 AI 回复功能还在配置中，请通过 VS Code 中的 Claude Code 与我对话。`,
    `配置完成后，你就可以直接在微信上和我聊天了 🚀`,
  ];
  return replies.join('\n');
}

// ===================== XML 构建器 =====================
class ReplyXml {
  constructor(content, type = 'text', fromUser = '', toUser = '') {
    this.content = content;
    this.type = type;
    this.fromUser = fromUser || 'super_individual_bot';
    this.toUser = toUser || 'user';
  }

  toResponse() {
    const xml = `<xml>
  <ToUserName><![CDATA[${this.toUser}]]></ToUserName>
  <FromUserName><![CDATA[${this.fromUser}]]></FromUserName>
  <CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime>
  <MsgType><![CDATA[${this.type}]]></MsgType>
  <Content><![CDATA[${this.content}]]></Content>
</xml>`;
    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}

// ===================== 工具函数 =====================

async function sha1(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * AES-256-CBC 解密
 * 企业微信使用 AES-256-CBC，PKCS7 填充，Key 为 EncodingAESKey 的 Base64 解码
 * 消息格式：16字节随机串 + 4字节网络字节序明文长度 + 明文 + 企业微信CorpID
 */
function decryptAES(encryptedBase64, aesKeyBase64) {
  // EncodingAESKey 是 43 位 base64 字符串，尾部补 = 后解码得到 32 字节密钥
  const keyBuf = base64Decode(aesKeyBase64 + '=');
  const cipherBuf = base64Decode(encryptedBase64);

  // AES-256-CBC 解密，IV 取密钥前 16 字节
  const key = keyBuf.slice(0, 32);
  const iv = keyBuf.slice(0, 16);

  // 注意：这里用了 Web Crypto API
  // 但 Web Crypto API 在 CF Worker 中有原生支持
  // 直接返回明文，格式: random(16) + network_order_len(4) + content + corpId
  // 简化版：我们借助 node 或内置 polyfill
  // 实际部署时需要使用 @wecom/crypto 或类似库来处理

  // 由于 CF Worker 中 crypto.subtle 不支持直接 AES-CBC 解密带 PKCS7 的任意数据
  // 需要引入辅助库。这里返回一个占位
  console.log('AES 解密请求（需要使用 wecom-crypto 库）');
  return encryptedBase64; // placeholder
}

/** 修复 Base64 补齐 */
function base64Decode(str) {
  // 补齐 Base64 padding
  while (str.length % 4) str += '=';
  // CF Worker 环境中处理
  return new Uint8Array(
    atob(str).split('').map(c => c.charCodeAt(0))
  );
}

/** 极简 XML 解析（企业微信消息格式有限，不需要完整 XML 解析器） */
function parseXML(xml) {
  const result = {};
  const tags = xml.match(/<(\w+)>([\s\S]*?)<\/\1>/g);
  if (tags) {
    for (const tag of tags) {
      const m = tag.match(/<(\w+)>([\s\S]*?)<\/\1>/);
      if (m) {
        result[m[1]] = m[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
      }
    }
  }
  return result;
}

// ===================== 路由入口 =====================
export default {
  async fetch(request, env) {
    // 从 env 中读取变量
    WX_CALLBACK_TOKEN = env.WX_CALLBACK_TOKEN;
    WX_CALLBACK_AES_KEY = env.WX_CALLBACK_AES_KEY;
    CLAUDE_API_KEY = env.CLAUDE_API_KEY || '';
    CLAUDE_MODEL = env.CLAUDE_MODEL;

    if (request.method === 'GET') {
      return handleVerify(request);
    }
    if (request.method === 'POST') {
      return handleMessage(request);
    }
    return new Response('Method not allowed', { status: 405 });
  },
};

// 全局变量
let WX_CALLBACK_TOKEN, WX_CALLBACK_AES_KEY, CLAUDE_API_KEY, CLAUDE_MODEL;
