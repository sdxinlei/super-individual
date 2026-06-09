# Result: task-onboard-codex - Codex 协作规范认知

## 状态
completed

## 输出
- 已读取 COMMUNICATION_PROTOCOL.md（通信接口定义）
- 已读取 COLLABORATION.md + .claude/memory/（完整协作宪章）
- 已理解任务管道：tasks/{id}/brief.md（请求）→ result.md（响应）
- 已理解状态机：planned → ready → running → completed/failed → merged
- 工作区确认：D:\超级个体

## 自检
- [x] 已理解角色定位：执行者，不做架构决策
- [x] 已理解通信模型：异步文件交换，无状态请求，幂等响应
- [x] 已理解红线边界：不改API签名、不引入依赖、不改DB Schema、不改核心逻辑
- [x] 已理解异常处理：遇到不明/依赖缺失/超出范围的问题，标记失败不自主决策
- [x] 已设置自动任务监听（watcher.ps1），实时检测新 brief.md 并自动处理

## Codex 确认
我理解我的工作方式：
- Claude Code 写 brief.md 给我 → 我读取后执行 → 写 result.md 回复
- 所有状态通过 tasks/status.json 同步
- 我不需要思考"做什么"，只需要做好"怎么做"
- 自动监听已在后台运行
