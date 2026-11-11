# 模型路由与运行时核验

本文件定义 Main 与子 Agent 的模型偏好、Thinking、运行时核验、跨家族约束和成本闸门。表中名称是目标偏好；实际 Provider、Model ID 和可用能力以当前运行环境为准。

## 1. Main Runtime 与模型

| Main Runtime | 模型偏好 | 默认 Thinking | 说明 |
|---|---|---|
| Claude Code | Claude Opus 5.5 | `medium` | 当前 Claude Code Session 担任 Main / Planner |
| Pi | Claude Opus 5.5 或 GPT-6.1 Sol | `medium` | 当前 Pi Session 担任 Main / Planner；复杂规划可用 `high` |

Main 负责决策与编排，通过将深入代码调查和实现委派给子 Agent 来控制自身上下文增长，避免高单价主模型产生高额重算费用。

## 2. Pi 子 Agent 模型偏好

| Agent | 模型偏好 | 默认 Thinking | 使用条件 |
|---|---|---|
| Repo / Web Researcher | DeepSeek V4.1 Flash | `max` | 存在阻断方案的跨模块未知项或外部技术检索时 |
| Implementer | DeepSeek V4.1 Flash | `max` | L2 代码实现；视觉任务需选择支持图片理解的模型 |
| Primary Reviewer | GPT-6 Luna | `medium`（复杂 Diff 用 `high`） | 所有 L2 代码变更；必须与 Implementer 跨模型家族 |
| Tester | DeepSeek V4.1 Flash | `max` | 仅当需补充 Implementer 未覆盖的独立集成/E2E 验证时 |
| Expert | Claude Opus 5.5 | `medium` | 重大架构权衡或常规模型连续失败的疑难问题 |

## 3. 委派与运行时核验

- 启动新子 Agent 时显式传入目标 `--provider`、`--model` 与 Thinking 参数，不依赖全局隐式默认值。
- 只在目标模型不确定或需校验视觉能力（`images`）与单价（`cost`）时，运行一次 `pi --list-models [keyword]` 查询。
- Pi 子 Agent 在最终报告顶部如实记录自身环境变量 `PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL`（只读这几个变量，不打印凭据和全量环境）。定位子 Agent Session 路径优先读取 Herdr `agent get <name>` 返回的 `agent_session.value`，不用通配符盲猜文件名。
- 目标模型或 Thinking 不可用时，Main 选择已知合规 Fallback 并在 `overview.md` 记录；无法满足跨家族 Review 等硬约束时暂停委派并向用户说明。

## 4. 跨家族约束与升级成本闸门

### Reviewer 跨家族约束

Primary Reviewer（及极少数高危场景按需增派的交叉复核 Reviewer）的实际模型家族**必须与 Implementer 不同**：

1. 默认使用 §2 的 `GPT-6 Luna`（当 Implementer 为 DeepSeek / GLM / Claude 时）。
2. 若默认模型不可用、被用户禁用或与 Implementer 同家族，按 `GLM-5.3 Flash → GPT-6 Luna → Claude Sonnet 5.5` 顺序选择可用且未禁用的跨家族模型。
3. 无可用跨家族模型时，由 Main 依据源码、Diff 与测试日志直接完成深度审查并向用户说明。

### 升级与成本闸门

- **升级条件**：首轮 Review 检出 P1 属于正常迭代，由原 Implementer 模型修复，不升级模型；仅当同一问题连续两轮修复失败或无法定位根因时，才考虑升级到高阶模型（如 `Claude Sonnet 5.5` / `Claude Opus 5.5`）。
- **成本闸门**：启用或切换到单价显著高于 §2 默认模型的模型前，Main 必须先向用户确认原因、目标模型与预计成本。用户指定的模型禁用列表或费用上限写入 `overview.md` 顶部状态，并通过 `scripts/wait-agent.sh` 的 `max-cost-usd` 参数实时监控；接近上限或单个子 Agent 成本异常偏高时立即暂停简报。
