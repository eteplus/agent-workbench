# Model Routing & Runtime Resolution

本文件是主控模型、子 Agent 模型偏好、Thinking 和升级策略的唯一权威定义。表中的名称是目标模型偏好；实际 Provider、Model ID、版本、参数映射及可用能力以当前运行配置为准。

## 1. Main Runtime & Main Model

Main Runtime 和 Main Model 独立选择：

| Main Runtime | Main Model Preference | 默认 Thinking / Effort | 说明 |
|---|---|---|---|
| Claude Code | Claude Opus 5.5 | medium；按 Runtime 支持情况调整 | Claude Code 当前会话承担 Main / Planner |
| Pi | Claude Opus 5.5 或 GPT-6.1 Sol | medium | Pi 当前会话承担 Main / Planner |

- 主控 Runtime 可由用户按任务或工作习惯选择 Claude Code 或 Pi。
- 主控模型由用户当前会话或 Runtime 配置决定；不在 Core 中绑定唯一 Provider / Model ID。
- 复杂规划使用 `high`；重大架构或高风险决策使用当前模型支持的更高档位。
- Claude Code 与 Pi 的推理档位名称和控制方式可能不同，由各自 Runtime Adapter 映射；不把某个 Runtime 的档位参数直接传给另一个 Runtime。
- Main 在 L0/L1 直接处理任务；L2 代码实现由 Herdr → Pi Implementer 完成。

## 2. Pi Subagent Model Preferences

| Agent | Model Preference | Default Thinking | 使用条件与档位调整 |
|---|---|---|---|
| Repo Researcher | DeepSeek V4.1 Flash | `max` | 项目内部跨文件检索、配置或调用链分析 |
| Web Researcher | DeepSeek V4.1 Flash | `max` | 外部技术资料、版本或规范检索 |
| Implementer | DeepSeek V4.1 Flash | `max` | L2 代码变更；Visual Implementation 由该角色承担 |
| Primary Reviewer | GPT-6 Luna | `medium` | 所有 L2 代码变更的默认独立 Review；复杂 Diff 可使用 `high` |
| Secondary Reviewer | GLM-5.3 Flash | `max` | 仅用于高风险、复杂 Diff 或需要独立补充缺陷覆盖的任务 |
| Reviewer Escalation | Claude Sonnet 5.5（默认偏好） | `medium` | 前两轮对 P0/P1 存在实质争议，或高影响问题仍无法形成有证据的结论；如与 Implementer 模型家族相同，按 §5 跨家族回退规则改选 |
| Tester | DeepSeek V4.1 Flash | `max` | 高风险、跨模块、关键契约或独立验证可提供额外价值 |
| Expert | Claude Opus 5.5 | `medium` | 重大架构决策或常规 Agent 无法解决的问题 |

模型名称作为角色偏好，不硬编码 Herdr Alias、Provider 名称、官方 API Model ID 或 Endpoint。Herdr / Pi 根据当前 Provider 配置解析实际模型。

## 3. Dispatch Rules

- 每次新 Agent 调用都显式传入模型偏好和 Thinking，避免继承全局 `defaultThinkingLevel` 或旧 Session 档位。
- 使用当前 Herdr Agent Automation 接口启动 Pi Agent；实际命令、MCP 工具、参数和等待方式以已安装版本的帮助信息或 Schema 为准。
- 仅传递实际 Provider / Model 支持的参数；Prompt 声明模型和档位不代表参数已经生效。
- 无法动态覆盖时，使用已配置且能够确认实际生效的 Agent Profile。
- 目标档位不受支持时，读取实际支持档位，再由 Main 决定 Fallback 或暂停路由；记录最终实际生效值。
- 不把凭据、Token 或认证文件传入 Task Contract。

## 4. Just-in-Time Runtime Check

不设置独立 Preflight。常规任务直接委派；目标模型不可用、映射不明确或能力未知时，按需检查模型目录和会话状态。

按当前 Runtime 能力核验，不混用 TUI、CLI 与 RPC 接口：

- `get_available_models` 或 `pi --list-models [keyword]` 查询模型目录，可读取 `provider`、`id`、`input`、`reasoning` 和 `cost` 字段。
- `get_state` 只用于 RPC 会话，核对实际 `model` 与 `thinkingLevel`；Herdr TUI 不调用 RPC 专属命令。
- Main 在 Contract Constraints 中授权必要的只读元数据查询；Pi TUI 子 Agent 在自己的 LLM Shell 工具中读取 `PI_PROVIDER`、`PI_MODEL`、`PI_REASONING_LEVEL`，记录到指定报告；这些值随工具调用反映该 Session 的有效配置。Main 环境、启动参数和 Prompt 声明不能替代子 Agent 实际值。
- 需要定位 Session 时，子 Agent 提供 `PI_SESSION_FILE`，或 Main 读取 Herdr 结构化 Agent 的 `agent_session.value`（实际字段以当前 Schema 为准）；仅异常时定向读取相关事件。
- RPC 可用时使用 `get_available_thinking_levels` 查询支持档位，`get_session_stats` 记录 Usage / Cost；TUI 不调用这些 RPC 专属命令。

实际值与偏好不符时，由 Main 按 §3 决定使用已知 fallback 或暂停，并记录理由；不能仅写“未确认”继续依赖该配置。元数据渠道不可用时标记 `NOT VERIFIED` 并说明能力限制；路由必要条件（如 Reviewer 跨家族）无法核实时暂停该委派。非必要 Usage / Cost 不可获取时写 `N/A`。不读取或输出 `env` / `printenv` 全量内容、API Key、Token、密码、`auth.json` 或含凭据的配置。

## 5. Escalation Rules

### Implementer

相同问题连续两次实现尝试失败、关键测试失败且当前模型无法定位原因、涉及复杂并发/事务/数据一致性/高风险边界，或实际复杂度明显超出预期时，Main 可升级到已配置的 Claude Sonnet 5.5 / Claude Opus 5.5。升级时复用已有需求、方案、Diff、测试和失败证据。

### Primary Review

所有 L2 代码变更默认执行一次 GPT-6 Luna 独立 Review。若用户显式调用上游 `implement`，其内部 `tdd` 和 `code-review` 属于实现过程中的自检和验证，不替代独立 Primary Review；`implement` 的调用限制和 Issue Tracker 前置条件见 `skills/README.md`。跨模块、复杂业务逻辑或高风险 Diff 可将该次 Review 提升至 `high`。

### Secondary Review

仅在以下条件之一成立时调用 GLM-5.3 Flash：

- 涉及安全/权限、数据迁移/一致性或核心接口契约。
- Diff 跨模块或复杂度高，需要额外缺陷覆盖。
- 测试覆盖存在明确缺口，且该缺口对应具体高影响风险。
- Primary Reviewer 提出需要独立交叉验证的 P0/P1。

普通、范围明确且风险可控的 L2 任务只执行 Primary Review。

### Reviewer Escalation

仅在以下情况触发 Reviewer Escalation。默认模型为 Claude Sonnet 5.5；但 Reviewer 的实际模型家族必须与 Implementer 的实际模型家族不同。若 Implementer 已升级到 Claude Sonnet 5.5 / Claude Opus 5.5（Claude 家族），不得再使用 Claude Sonnet 5.5 作为 Reviewer：优先选择尚未参与本任务 Review 的 GLM-5.3 Flash；若不可用或已参与，则选择 GPT-6 Luna。该路由仍满足 Reviewer 与 Implementer 的跨模型家族约束。若没有可用的不同家族模型，或所有可用的不同家族 Reviewer 均已参与当前争议（包括 Luna 与 GLM 已分别作为 Primary / Secondary 参与分歧双方），Main 不重复委派已参与的 Reviewer，也不启动同家族 Reviewer；Main 基于原始需求、当前源码、Diff、测试和已有审查证据直接裁决并记录理由。仍无法形成有证据的结论时，未解决的 P0/P1 保持 `BLOCKED`。

仅在以下情况触发：

- GPT-6 Luna 与 GLM-5.3 Flash 对 P0/P1 存在实质分歧。
- 关键 P0/P1 根因或影响仍无法确认。
- 安全/权限/数据一致性等高影响问题经过前两轮仍无法形成有证据的结论。

若 GLM 不可用，Main 可根据风险直接升级，并记录跳过原因。P2、风格偏好和无具体证据的推测不触发升级。

### Researcher / Expert

官方资料存在冲突、涉及多个技术栈/版本，或结论影响重大架构决策时，Main 可提高实际模型支持的推理档位或委派 Expert 独立分析。

### 升级边界

- Reviewer 每个任务最多执行一次 Primary Review、一次符合条件的 Secondary Review 和一次定向 Escalation 裁决；Escalation 模型按上文的模型家族约束选择。
- 其他角色针对同一问题最多升级一次；升级后仍无法解决时暂停并报告。
- 任何升级都需记录原因、实际 Provider / Model ID、实际 Thinking 和结果。
- 升级模型不可用时使用已配置 Fallback 并如实记录。

## 6. Required Model Metadata

每个子 Agent 的 Handoff / Review / Test 报告应在可获取时记录：

- Provider
- 实际 Model ID
- 实际 Thinking / Reasoning Level
- 模型或工具能力限制
- Usage / Cost（可读取时）

模型偏好、实际模型和推理档位必须区分记录。
