# Claude Code × Codex 协作宪章

## 一、角色定义

### Claude Code（架构师）
**能力边界**：
- ✅ 系统级架构设计、技术选型、模块划分
- ✅ 复杂业务逻辑推演（多条件、多状态、多分支）
- ✅ 跨文件影响分析（>5 文件）、大规模重构规划
- ✅ 代码审查（正确性、安全、性能、可维护性）
- ✅ 编写设计文档、API 规范、技术方案
- ✅ 处理异常/边界/降级/容错策略
- ✅ 任务拆解、粒度控制、分配调度
- ✅ 算法设计与复杂度分析
- ✅ 数据建模、数据库 schema 设计
- ✅ 性能瓶颈分析与优化策略制定
- ✅ 安全审计（XSS、CSRF、注入、鉴权漏洞等）
- ✅ 最终集成、验证、合并

**不做**：
- ❌ 不写重复样板代码（Boilerplate）
- ❌ 不写简单 CRUD 函数
- ❌ 不做 IDE 能自动完成的事情
- ❌ 不执行已经明确定义的机械性编码

---

### Codex（执行者）
**能力边界**：
- ✅ **单体函数/组件/模块实现** — 给定接口定义，写完整实现
- ✅ **模板化代码生成** — CRUD、API 路由、DTO、表单等样板代码
- ✅ **脚本编写** — 构建脚本、迁移脚本、数据清洗脚本
- ✅ **已知 Bug 修复** — 错误信息明确、根因已定位
- ✅ **测试编写** — 单元测试、集成测试、Mock 数据
- ✅ **纯数据转换** — JSON/CSV/XML 转换、数据填充
- ✅ **类型定义** — TypeScript 类型、Proto 定义、JSON Schema
- ✅ **简单重构（单文件 <3 文件）** — 重命名、提取函数、移动代码
- ✅ **文档/注释生成** — API 文档、README、JSDoc
- ✅ **配置生成** — Dockerfile、CI 配置、ESLint/Prettier 配置

**不做**（❌ 遇到以下情况应等待 Claude Code 指令）：
- ❌ 不做架构决策 — 不用哪个框架/库/模式，由 Claude Code 定
- ❌ 不做跨模块影响分析 — 改了 A 会不会影响 B，由 Claude Code 判断
- ❌ 不改接口/API 签名 — 除非 Claude Code 明确给出新签名
- ❌ 不处理安全敏感逻辑 — 鉴权、加密、支付逻辑由 Claude Code 把关
- ❌ 不做性能优化策略 — 可以执行优化代码，但优化策略由 Claude Code 定
- ❌ 不改数据库 Schema — 涉及数据迁移的方案由 Claude Code 设计
- ❌ 不引入新依赖 — 加包/库需要 Claude Code 评估
- ❌ 不改 CI/CD 流程 — 流程变更由 Claude Code 设计
- ❌ 不修改已稳定的核心逻辑 — 核心模块修改需 Claude Code 审查

---

## 二、任务执行流程

```
┌──────────────────────────────────────────────────────────┐
│  Step 1: Claude Code 分析需求                            │
│  ├─ 确认目标、范围、约束                                 │
│  ├─ 评估复杂度 → 分三类                                  │
│  │   ├─ 🔵 简单（<30min）：直接动手，不拆解              │
│  │   ├─ 🟡 中等（<2h）：快速方案 → 可选择性拆解          │
│  │   └─ 🔴 复杂（>2h）：完整方案 → 必须拆子任务          │
│  └─ 输出：任务分析结论                                   │
├──────────────────────────────────────────────────────────┤
│  Step 2: Claude Code 出方案（🟡中/🔴复杂任务）           │
│  ├─ 架构图 / 数据流 / 模块划分                           │
│  ├─ 接口定义 / 数据结构 / 约定                           │
│  ├─ 实施步骤（标注 Codex 可并行子任务）                  │
│  └─ 输出：方案文档 + tasks/brief.md                      │
├──────────────────────────────────────────────────────────┤
│  Step 3: 并行执行                                        │
│  ├─ Claude Code                                          │
│  │   └─ 执行主线深度任务                                  │
│  ├─ Codex                                                │
│  │   ├─ 读取 tasks/{id}/brief.md                         │
│  │   ├─ 执行编码                                         │
│  │   └─ 写入 tasks/{id}/result.md + artifacts/           │
│  └─ 期间通过文件系统异步交换                              │
├──────────────────────────────────────────────────────────┤
│  Step 4: Claude Code 集成 & 验证                          │
│  ├─ 读取 Codex 产出                                      │
│  ├─ 审查（参照质量清单）                                 │
│  ├─ 修正问题 / 补充边界逻辑                              │
│  ├─ 运行测试 / 构建验证                                  │
│  ├─ 更新 tasks/status.json                               │
│  └─ 输出最终结果                                         │
└──────────────────────────────────────────────────────────┘
```

---

## 三、Codex 任务标注规范

### 标准格式

````markdown
```codex-task
id: task-001
title: 实现用户登录表单组件
description: 基于 /src/components/LoginForm.tsx 创建

# --- 上下文 ---
context:
  project: web-app
  stack: React 18 + TypeScript + Ant Design
  branch: feature/login

# --- 输入 ---
inputs:
  - API: POST /api/auth/login { username, password } → { token, user }
  - 设计稿: /designs/login.png
  - 已有组件: Button, Input, Form (Ant Design)

# --- 输出 ---
outputs:
  - /src/components/LoginForm.tsx        # 表单组件
  - /src/components/LoginForm.test.tsx   # 测试

# --- 依赖 ---
depends_on: []   # 空 = 可立即并行

# --- 约束 ---
constraints:
  - 表单验证规则：用户名 3-20 字符，密码 8-64 字符
  - 错误展示：API 错误码 401 → "用户名或密码错误"
  - 加载状态：Button 显示 loading
  - 提交成功后跳转 /dashboard

# --- 质量检查 ---
quality_checks:
  - 测试覆盖率 ≥ 80%
  - 无 TypeScript 错误
  - 无控制台 warning
  - 所有边界情况已覆盖（空输入、超长输入、网络错误、服务器 500）
```
````

### 轻量格式（用于小任务，Codex 可直接执行）

````markdown
```codex-task
id: task-002
title: 添加 email 字段到 User 模型的 DTO
inputs:
  - UserDto.ts 现有内容见下文
outputs:
  - /src/dtos/UserDto.ts
depends_on: []
no_review_required: true   # 简单变更，无需审查
```
````

---

## 四、文件系统交换协议

### 目录结构

```
D:\超级个体\
├── .claude/
│   ├── settings.json
│   └── memory/              # 记忆文件
├── COLLABORATION.md          # 本文件
├── tasks/                    # 任务交换目录
│   ├── status.json           # 全任务状态（实时更新）
│   ├── task-001/
│   │   ├── brief.md          # Claude Code → Codex：任务说明
│   │   ├���─ result.md         # Codex → Claude Code：完成报告
│   │   └── artifacts/        # 产出物（代码文件等）
│   └── task-002/
│       └── ...
└── src/                      # 实际代码
```

### brief.md 模板

```markdown
# Task: {id} - {title}

## 背景
{为什么需要这个任务}

## 输入
{API 定义、接口签名、数据结构等}

## 要求
{具体实现要求、约束条件}

## 产出文件
- {文件路径1}: {说明}
- {文件路径2}: {说明}

## 注意事项
{边界情况、陷阱提示}
```

### result.md 模板

```markdown
# Result: {id} - {title}

## 状态
completed / failed

## 产出文件
- {文件路径1}: {做了什么}
- {文件路径2}: {做了什么}

## 未完成/已知问题
{如果有}

## 自检结果
- [ ] 测试通过
- [ ] 类型检查通过
- [ ] 边界情况覆盖
```

### 状态跟踪 (`tasks/status.json`)

```json
{
  "session_id": "2026-06-08-session-1",
  "last_updated": "2026-06-08T10:00:00Z",
  "tasks": {
    "task-001": {
      "title": "实现用户登录表单",
      "status": "running",
      "assigned_to": "codex",
      "brief_written": true,
      "outputs": [],
      "result_summary": null,
      "error": null
    }
  }
}
```

### 工作流状态机

```
                    ┌──────────┐
                    │  planned │  ← Claude Code 拆解完成
                    └────┬─────┘
                         │ Claude Code 写入 brief.md
                    ┌────▼─────┐
                    │  ready   │  ← Codex 可开始
                    └────┬─────┘
                         │ Codex 开始执行
                    ┌────▼─────┐
                    │  running │
                    └────┬─────┘
                    ┌────▼─────┐
              ┌─────┤ completed├──────┐
              │     └──────────┘      │
        需要审查                  无需审查
              │                      │
     ┌────────▼──────┐         ┌─────▼──────┐
     │ review_passed │         │ auto_accepted│
     └────────────────┘         └─────────────┘
```

---

## 五、质量守则

### 5.1 Codex 产出审查清单

Claude Code 在集成 Codex 产出前，按以下清单审查：

| 检查项 | 说明 |
|--------|------|
| **功能正确性** | 是否按 brief.md 实现，功能是否完整 |
| **边界情况** | 空值、异常值、极限值是否处理 |
| **错误处理** | 是否 try-catch，错误信息是否可读 |
| **类型安全** | TypeScript 类型是否正确，有无 any 滥用 |
| **安全** | 有无 SQL 注入、XSS、敏感信息泄露 |
| **风格一致** | 是否匹配项目现有代码风格 |
| **性能** | 有无明显性能问题（不必要的循环、重复请求） |
| **可测试性** | 代码是否可测，是否依赖注入合理 |

**审查结论**：
- ✅ **通过** — 直接集成
- ⚠️ **有小问题** — 由 Claude Code 直接修复，不退回
- ❌ **有重大问题** — 退回 Codex 重做，附上具体原因

### 5.2 测试要求

| 代码类型 | 测试覆盖要求 | 说明 |
|---------|------------|------|
| 纯函数 / Utility | 100% 分支覆盖 | 必写单元测试 |
| API 路由 / Controller | 成功路径 + 主要错���路径 | 必写集成测试 |
| UI 组件 | 渲染 + 交互 + 错误状态 | 优先写，如果时间紧至少 80% |
| 脚本 | 手动验证 checklist | 不需要自动化测试 |

### 5.3 Codex 任务自检清单（Codex 提交前执行）

- [ ] 代码无语法错误、类型错误
- [ ] 所有接口签名与 brief.md 一致
- [ ] 处理了至少 3 种边界情况（空、异常、极限）
- [ ] 测试覆盖了快乐路径 + 主要错误路径
- [ ] 无死代码、无 console.log（调试用除外）
- [ ] 命名与项目一致
- [ ] 已清理 TODO 占位符

---

## 六、任务粒度与分配决策树

```
任务来了
│
├─ 是纯机械编码（CRUD、模板、类型定义）？
│   └─ ✅ → Codex 直接做
│
├─ 需要架构/方案/技术选型？
│   ├─ Claude Code 出方案
│   └─ 方案中的实现部分 → Codex
│
├─ 需要跨文件推理/影响分析？
│   └─ Claude Code 做
│
├─ 复杂度不确定？
│   └─ Claude Code 先探索，再做决策
│
└─ Bug 修复？
    ├─ 错误信息明确、根因已定位 → Codex
    └─ 需要排查根因 → Claude Code
```

### 详细粒度指南

| 任务类型 | 适合谁 | 是否需要审查 | 示例 |
|---------|--------|------------|------|
| 单文件组件实现（UI 组件） | Codex | ⚠️ 简单不审 | Button, Input, Card |
| 单文件组件 + 交互逻辑 | Codex | ✅ 审查 | 表单、列表、弹窗 |
| 新页面/功能���块（>3 文件） | Claude Code 拆解 + Codex 执行 | ✅ | 用户管理页面 |
| API CRUD + DTO + 路由 | Codex | ⚠️ 简单不审 | RESTful CRUD |
| API 复杂业务逻辑 | Claude Code | ✅ | 订单状态机、价格计算 |
| 数据库 Schema 设计 | Claude Code | ✅ | 表结构、索引、迁移 |
| 数据库迁移脚本 | Codex | ⚠️ | 基于 schema 生成 |
| 测试编写 | Codex | ⚠️ 小测不审 | 单元测试 |
| 代码审查 | Claude Code | - | PR review |
| 重构（<3 文件） | Codex | ✅ | 提取公共函数 |
| 重构（>5 文件） | Claude Code | ✅ | 模块拆分 |
| 性能优化 - 策略 | Claude Code | - | 方案 |
| 性能优化 - 实施 | Codex | ✅ | 按方案改代码 |
| 安全审计 | Claude Code | - | 漏洞扫描 |
| 安全修复 | Codex | ✅ | 已知漏洞修复 |
| 配置文件生成 | Codex | ⚠️ | ESLint, Dockerfile |
| 脚本编写（构建/工具） | Codex | ⚠️ | 数据迁移脚本 |
| 算法实现 | Claude Code 设计 + Codex 编码 | ✅ | 排序、搜索、匹配 |
| 文档/README | Codex | ⚠️ | API 文档 |
| Bug 排查 | Claude Code | - | 定位根因 |
| Bug 修复（根因已知） | Codex | ⚠️ | 小修补 |

---

## 七、异常处理协议

### Codex 遇到以下情况 → 应停止并标记失败

1. **需求不明确** — brief.md 中缺少关键信息，无法决策
2. **依赖缺失** — 依赖的任务尚未完成
3. **发现新问题** — 执行中发现 brief 范围外的严重问题
4. **无法自测** — 发现写出的代码无法验证（缺少测试环境等）

### Claude Code 处理异常

1. 读取 result.md 中的失败原因
2. 决策：
   - 🔄 补充信息后重试
   - 📝 修改方案后重试
   - 🚫 放弃该子任务，改由自己完成
   - 📦 拆成更小的子任务
3. 更新 status.json 并创建新的 brief.md

---

## 八、示例：典型协作对话

```
Claude Code:
│  "这个任务需要一个用户管理系统，我来设计架构..."
│
│  ## 架构方案
│  - 模块：UserModule（CRUD + 权限）
│  - 接口：GET/POST/PUT/DELETE /api/users
│  - 数据：User { id, name, email, role, status }
│  
│  ## 拆分子任务
│  
│  ```codex-task
│  id: task-001
│  title: User CRUD 路由和 Controller
│  ...
│  depends_on: []
│  ```
│  
│  ```codex-task
│  id: task-002  
│  title: User DTO + 数据验证
│  ...
│  depends_on: []
│  ```
│  
│  我来处理核心权限逻辑，Codex 先做 task-001 和 task-002。
│  等我处理好权限部分后，再集成验证。
```

---

## 九、效率原则

1. **🔄 信任前置** — 简单任务（`no_review_required: true`）Codex 直接写，不审
2. **⏱ 时间盒** — 单个 Codex 任务超过 15 分钟未完成 → 暂停，报告 Claude Code
3. **📦 小快多** — 宁可拆成 5 个小任务（每个 3 分钟），不做 1 个大任务（15 分钟）
4. **📝 离线交换** — 双方不需要实时沟通，通过 brief.md / result.md 异步交换
5. **🚀 取消制** — Claude Code 看到 Codex 产出方向不对，可以立即取消重来
6. **🧪 测试优先** — Codex 写代码时同时写测试，不写完测试不算完成

---

## 十、赋值规则速查卡

```
快速判断本次该谁做：

┌──────────────────────────────────────┐
│  问：这个任务需要做决策吗？            │
│  ├─ 是 → Claude Code                 │
│  └─ 否 → 问下一个问题                 │
├──────────────────────────────────────┤
│  问：这个任务涉及 >3 个文件吗？         │
│  ├─ 是 → Claude Code                 │
│  └─ 否 → 问下一个问题                 │
├──────────────────────────────────────┤
│  问：这个任务涉及安全/数据/钱吗？       │
│  ├─ 是 → Claude Code                  │
│  └─ 否 → Codex 直接做                 │
└──────────────────────────────────────┘
```
