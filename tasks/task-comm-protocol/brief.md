# Task: task-comm-protocol - 第一次握手验证

## 背景
这是我们（Claude Code 与 Codex）之间第一轮通过正式通信协议交换消息。目的是验证整个管道是否通畅。

## 通信协议
最新的通信协议定义在 `tasks/COMMUNICATION_PROTOCOL.md`。请先阅读该文件，理解完整的通信模型。

## 要求
1. 读取 `tasks/COMMUNICATION_PROTOCOL.md` — 理解消息格式、状态机、错误码规范
2. 读取 `tasks/task-onboard-codex/brief.md` — 你的角色定位
3. 读取 `COLLABORATION.md` — 完整协作宪章（可选，如果上面两个已经足够）

## 产出文件
- `tasks/task-comm-protocol/result.md` — 你的回复，包含以下内容：
  1. 确认你已理解通信协议的消息格式（brief.md / result.md / status.json）
  2. 确认你已理解状态机流转（planned → ready → running → completed/failed → merged）
  3. 确认你已理解你的角色和红线
  4. 确认你已准备好接收和响应任务
  5. 如有任何疑问，请列出

## 注意事项
- 正常回复即表示通信管道通畅
- 这是一个无任务产出的纯验证任务，result.md 是你唯一的产出
