# 模型路由与运行时核验

本文件定义 Main 与子 Agent 的模型偏好、Thinking、运行时核验和升级规则。表中名称是目标偏好；实际 Provider、Model ID、版本、参数映射和能力以当前运行配置为准。

## 1. Main Runtime 与模型

Main Runtime 与 Main 模型分别选择：

| Main Runtime | 模型偏好 | 默认 Thinking | 说明 |
|---|---|---|---|
| Claude Code | Claude Opus 5.5 | `medium`；按 Runtime 支持调整 | 当前 Claude Code Session 担任 Main / Planner |
| Pi | Claude Opus 5.5 或 GPT-6.1 Sol | `medium` | 当前 Pi Session 担任 Main / Planner |

- 用户按任务或习惯选择 Runtime；Main 模型由当前 Session 或 Runtime 配置决定。
- 复杂规划使用 `high`；重大架构或高风险决策使用当前模型支持的更高 Thinking。
- Claude Code 与 Pi 的 Thinking 名称和控制方式由各自 Runtime Adapter 映射，参数只传给所属 Runtime。

## 2. Pi 子 Agent 模型偏好

| Agent | 模型偏好 | 默认 Thinking | 使用条件 |
|---|---|---|---|
| Repo Researcher | DeepSeek V4.1 Flash | `max` | 项目内部跨文件检索、配置或调用链分析 |
| Web Researcher | DeepSeek V4.1 Flash | `max` | 外部技术资料、版本或规范检索 |
| Implementer | DeepSeek V4.1 Flash | `max` | L2 代码变更，含 Visual Implementation |
| Primary Reviewer | GPT-6 Luna | `medium` | 所有 L2 代码变更；复杂 Diff 可用 `high` |
| Secondary Reviewer | GLM-5.3 Flash | `max` | 满足 §5 条件时 |
| Reviewer Escalation | Claude Sonnet 5.5 | `medium` | 满足 §5 条件时；受跨家族约束 |
| Tester | DeepSeek V4.1 Flash | `max` | 高风险、跨模块、关键契约，或独立验证能增加覆盖时 |
| Expert | Claude Opus 5.5 | `medium` | 重大架构决策或常规 Agent 无法解决的问题 |

表中是角色偏好；Herdr / Pi 按当前 Provider 配置解析实际模型、Alias 和 Endpoint。

## 3. 委派规则

- 每次启动新 Agent 都显式传入模型偏好和 Thinking，避免继承全局 `defaultThinkingLevel` 或旧 Session 的设置。
- 使用当前 Herdr Agent Automation 接口启动 Pi Agent，命令、参数和等待方式以已安装版本的帮助或 Schema 为准。
- 只传实际 Provider / Model 支持的参数；Prompt 中声明的模型和 Thinking 需要核验才算生效。
- 无法动态覆盖时，使用已配置且能确认生效的 Agent Profile。
- 目标 Thinking 不受支持时，读取实际支持的值，由 Main 决定 Fallback 或暂停，并记录最终生效值。
- 凭据、Token 和认证文件留在 Runtime 配置中，Contract 只引用模型名称。

## 4. 运行时核验

常规任务在 Contract 启动核验中确认实际配置（`core/task-contract.md` §1）；只在目标模型不可用、映射不明或能力未知时查询模型目录。按当前 Runtime 的接口核验：

- 模型目录：`get_available_models` 或 `pi --list-models [keyword]`，读取 `provider`、`id`、`input`、`reasoning`、`cost`。
- Pi TUI 子 Agent：在自身 Shell 工具中读取 `PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL` 并写入报告，这些值反映该 Session 的有效配置。Main 在 Constraints 中授权这项只读查询。Main 的环境、启动参数和 Prompt 声明不能代替子 Agent 的实际值。
- RPC Session：用 `get_state` 核对 `model` 与 `thinkingLevel`，用 `get_available_thinking_levels` 查询支持值，用 `get_session_stats` 记录 Usage / Cost。这些是 RPC 专属命令，仅在 RPC Session 中使用。
- 定位 Session：子 Agent 提供 `PI_SESSION_FILE`，或 Main 读取 Herdr 结构化 Agent 的 `agent_session.value`（以当前 Schema 为准）；只在异常时定向读取相关事件。

实际值与偏好不符时，Main 按 §3 选择已知 Fallback 或暂停，并记录理由。元数据渠道不可用时标为 `NOT VERIFIED` 并说明限制；路由的必要条件（如 Reviewer 跨家族）无法核实时暂停该委派。非必要的 Usage / Cost 无法获取时写 `N/A`。只读取所需的模型变量，凭据和完整环境变量保持隐藏（`core/permissions.md` §4）。

## 5. 升级规则

### Reviewer 跨家族约束

所有 Reviewer（Primary、Secondary、Escalation）的实际模型家族都与 Implementer 的实际模型家族不同。Implementer 升级模型后，Main 重新检查这一约束：

1. 优先使用表 §2 的默认模型。
2. 默认模型与 Implementer 同家族时，按 GLM-5.3 Flash → GPT-6 Luna 的顺序，选择尚未参与本任务 Review 的跨家族模型。
3. 没有可用的跨家族模型，或所有跨家族 Reviewer 都已参与当前争议时，由 Main 依据原始需求、当前源码、Diff、测试和已有 Review 证据直接裁决并记录理由。仍无法形成有证据的结论时，P0/P1 保持 `BLOCKED`。

### Implementer

同一问题连续两次实现失败、关键测试失败且当前模型无法定位原因、涉及复杂并发/事务/数据一致性/高风险边界，或实际复杂度明显超出预期时，Main 可升级到已配置的 Claude Sonnet 5.5 / Claude Opus 5.5，并复用已有需求、方案、Diff、测试和失败证据。

### Primary Review

跨模块、复杂业务逻辑或高风险 Diff 可提升到 `high`。Review 要求见 `core/acceptance.md` §3。

### Secondary Review

满足以下任一条件时启动：

- 涉及安全/权限、数据迁移/一致性或核心接口契约。
- 跨模块或复杂 Diff 中有具体的高影响边界，Primary Review 或现有测试未充分覆盖。
- 测试覆盖有明确缺口，且对应具体的高影响风险。
- Primary Reviewer 提出需要独立交叉验证的 P0/P1。

启动前，Main 在 `overview.md` 记录具体风险、现有覆盖的限制和本次新增的检查目标。理由需要指向具体风险；文件数量多或跨模块本身不构成理由。

### Reviewer Escalation

满足以下任一条件时启动：

- Primary 与 Secondary Reviewer 对 P0/P1 有实质分歧。
- 关键 P0/P1 的根因或影响仍无法确认。
- 安全/权限/数据一致性等高影响问题经过前两轮仍无法形成有证据的结论。

Secondary Reviewer 不可用时，Main 可按风险直接启动 Escalation 并记录原因。触发对象限于 P0/P1 及有具体证据的高影响问题。

### Researcher / Expert

官方资料冲突、涉及多个技术栈/版本，或结论影响重大架构决策时，Main 可提高 Thinking 或委派 Expert 独立分析。

### 升级上限

- 每个任务最多一次 Primary Review、一次符合条件的 Secondary Review 和一次定向 Escalation。
- 其他角色针对同一问题最多升级一次；升级后仍无法解决时暂停并报告。
- 每次升级记录原因、实际 Provider / Model ID、实际 Thinking 和结果；升级模型不可用时使用已配置的 Fallback 并如实记录。

## 6. 必需模型元数据

每份 Handoff / Review / Test 报告在可获取时记录：

- Provider
- 实际 Model ID
- 实际 Thinking
- 模型或工具的能力限制
- Usage / Cost（可读取时）

模型偏好、实际模型和实际 Thinking 分开记录。
