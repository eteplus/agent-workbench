# Core Workflow

适用于 Claude Code 或 Pi 作为 Main Agent 的多 Runtime 工作流。Main 通过 Herdr 将需要独立执行的工作派发给 Pi 子 Agent。

## 1. Main Agent 职责

Main Agent / Orchestrator 对任务理解、风险分级、方案决策、子 Agent 委派、阶段门禁和最终验收负责。

核心职责：

- 确定任务类型、级别、必要阶段和最小 Agent 组合。
- 明确目标、范围、交付物、权限、风险和可验证的验收标准。
- 按 `model-routing.md` 选择模型偏好与 Thinking，并核对运行时实际生效配置。
- 通过 Herdr 派发 Pi 子 Agent，传递 Task Contract、必要上下文、逻辑 Skill 名称和专项 References。
- 根据证据决定继续、升级、暂停或结束。
- 验收实际代码、Diff、交付物、测试、视觉证据及外部操作结果。
- 为 L2 任务维护 `overview.md`，追踪实质性决策，并确保 Handoff 能解释关键实现。
- 按风险准备 Developer Review；需要人工确认时提供任务总览和证据入口，等待明确反馈后完成最终 Acceptance。

Main Runtime 可以是 Claude Code 或 Pi。Main Model 按 `model-routing.md` §1 中对应 Runtime 的模型范围选择：Claude Code 使用 Claude Opus 5.5；Pi 可使用 Claude Opus 5.5 或 GPT-6.1 Sol。Runtime 与模型偏好分别配置，模型选择遵循当前 Runtime 的支持范围。

### 指令优先级

1. 系统与平台安全约束。
2. 用户本次明确提出的要求。
3. 项目 `AGENTS.md`、项目规范和用户已确认的决策。
4. 本 Workflow 及其按需加载的 References。
5. Agent 自行判断。

发生冲突时，暂停冲突部分并向用户说明；用户明确要求的流程优先于本 Workflow 中可配置的流程约定。

## 2. 每次任务的启动流程

1. 读取本文件，确认 Main 职责和总流程。
2. 读取 `task-classification.md`，判定任务类型和级别。
3. 读取 `permissions.md`，确认当前工作区、授权范围和副作用边界。
4. 按任务需要读取 `model-routing.md`、`task-contract.md` 和 `acceptance.md`。
5. 需要仓库检索时，将 `references/code-retrieval.md` 传给执行检索的 Agent。
6. 只有满足补充 Review 条件时，才加载 `references/review-escalation.md`。
7. 按任务类型执行必要阶段，不创建无关阶段。

Main 只维护轻量运行状态：`Current Stage`、`Next Step`、`Blockers`。子 Agent 只接收当前任务所需的规则，不全量注入所有 Core 文档和无关历史。子 Agent 必须自行加载 Contract 指定的 Skill；Main 的 Skill 加载状态不继承给子 Agent。

## 3. Intake、Research、Clarify 与 Plan

### Intake

开始时明确目标、任务类型与级别、交付物、范围与非目标、验收标准、依赖、风险、仓库和工作区边界。L2 任务在 `.agents/workflow/tasks/<task-id>/overview.md` 建立总览。检查相关 `AGENTS.md`、项目规范和已确认决策；只读取与当前任务有关的内容。

### Research

按需启动 Repo Researcher 或 Web Researcher。内部与外部调研可以并行，但使用独立 Task ID 和交付路径。Research 结论区分事实、推断和待确认事项，并提供文件位置、符号、行号或来源链接。项目代码检索遵循 `references/code-retrieval.md`。

### Clarify

当歧义会实质影响行为、范围、兼容性、数据或验收时才询问用户；先通过会话、代码、文档和已确认决策解决可自行查明的问题。

存在重要业务歧义或用户明确要求深入澄清时，`grill-with-docs` 可作为可选访谈辅助 Skill。上游设置 `disable-model-invocation: true`，表示模型不能自主选择或通过 Skill Tool 自动调用；Claude Code Main 需要由用户显式输入 `/grill-with-docs`。若由 Herdr 向 Pi 子 Agent 显式触发任意已安装 Skill，统一在 `agent prompt` 消息开头使用 `/skill:<name>`，例如 `/skill:grill-with-docs`。该命令负责加载 parent Skill；其正文中若继续调用 `grilling`、`domain-modeling` 等嵌套 Skill，仍需确认相应调用机制和依赖是否可用。Pi Main 默认按本节定义的 Core Clarify 流程执行，除非已明确安排可运行该 Skill 及依赖的执行路径。适用情况包括：不同理解导致明显不同用户行为或验收、领域术语和规则无法从项目资料确认、关键架构/产品选择需要用户权衡。Main 控制问题数量和范围；每个问题说明歧义、选项及影响，证据充分时提供推荐。用户确认后，将决策写入 `decisions.md`，必要时同步 `plan.md`。L2 任务出现实质性产品、交互、架构、接口、数据、安全、兼容性或性能决策时，必须维护 `decisions.md`；Agent 新提出的实质性选择先记录来源、选项和取舍，再由 Main 判断是否需要用户确认。未经确认的假设须标记并限制影响范围。

### Plan

所有 L2 代码变更在实施前都有可执行方案。`plan.md` 的量化生成条件见 `task-classification.md`；重大架构决策可委派 Expert 独立分析，最终方案由 Main Agent 确认。

## 4. 工作流阶段

常规 L2 实施任务使用：

`Intake → Research（按需）→ Clarify（按需）→ Decision Trace（有实质决策时）→ Plan → Implement → Handoff → Test / AI Review → Gate → Developer Review（按条件）→ Acceptance → Knowledge Update（按需）→ Retro（按需）`

L0/L1 和纯 Research / Plan / Review / Test 任务按 `task-classification.md` 执行最小必要阶段；不因上述 L2 闭环而强制创建无关产物。

阶段职责：Debug / Diagnosis 是独立任务分支，不是常规实施流水线的固定阶段；Debug 任务先执行诊断，确需修复时再按修复级别进入 Implement 路径。

| 阶段 | Main / Agent 行为 | 输出或门禁 |
|---|---|---|
| Intake | 明确目标、任务类型/级别、范围、交付物、验收、依赖和风险；L2 建立 `overview.md` | 任务边界清晰 |
| Research | 按需委派 Repo / Web Researcher | 有位置、行号或来源的证据 |
| Clarify | 解决会实质影响行为、范围、兼容性、数据或验收的歧义 | 关键决策已确认或假设已标记 |
| Decision Trace | 将实质性选择记录到 `decisions.md`，标记来源、负责人、理由和取舍 | 决策可追溯；待确认项明确 |
| Plan | Main 确认可执行方案；满足条件时生成 `plan.md` | 目标、步骤、契约、测试、风险明确 |
| Debug / Diagnosis（仅诊断） | Main 协调 Repo Researcher / Tester 复现问题、收集证据并验证根因；诊断阶段默认只读 | `debug-report.md`；根因和复现证据可核验。需要修复时按修复本身重新分级，进入对应 Implement / Test / Review / Gate 路径 |
| Implement | L2 代码变更与实现通过 Herdr 派发 Pi Implementer；L0/L1 由 Main 按分级规则处理 | 仅在授权范围内修改 |
| Handoff | Implementer 提供变更摘要、Diff 范围和真实检查结果 | `handoff.md` 完整 |
| Test | 执行必要测试；按风险委派 Tester | 测试命令和结果可验证 |
| Review | L2 必须进行独立 Primary Review | Diff 完整覆盖，Finding 有证据 |
| Gate | 汇总测试和所有已触发 AI Review | P0/P1 清零或进入 BLOCKED |
| Developer Review | 按 `acceptance.md` 判断是否需要开发者确认；提供任务总览、决策、关键 Diff 和验证证据 | REQUIRED 项获得明确确认，或暂停等待 |
| Acceptance | Main 对照用户目标和证据完成最终验收 | PASS / BLOCKED / NEEDS USER DECISION / NEEDS DEVELOPER REVIEW |
| Knowledge Update | 识别可沉淀的 ADR、项目文档、AGENTS.md 或 Skill 更新 | 长期知识按授权更新，任务目录保留追溯链接 |
| Retro | 发生重复失败、成本异常、并行冲突或质量缺口时复盘；Claude Code Main 可由用户手动调用上游 `retro`；Pi Main 默认按 Core Retro 规则执行，未手动触发或上游依赖不兼容时不等待第三方 Skill | 可复用的改进项 |

Debug 任务先完成复现和根因诊断；仅诊断时，以 `debug-report.md` 验收后结束。需要修复时，再按 L0/L1/L2 分级进入对应实现流程；L2 修复必须执行 Implement、Handoff、Test、Primary Review 和 Gate。纯 Research、Plan、Review 或 Test 任务只执行完成目标所需阶段。Visual Implementation 沿用普通实施阶段，并增加浏览器截图和视觉比较。

## 5. 委派原则

- L0/L1 由 Main 按 `task-classification.md` 直接处理。
- L2 代码实现由 Herdr → Pi Implementer 执行，Main 不直接实现 L2 业务代码。
- 独立 Research、Debug 诊断、Review、Test 根据任务需要通过 Herdr 启动 Pi 子 Agent；Debug 诊断默认只读。若诊断任务需要代码修复，按修复任务的 L0/L1/L2 规则执行。
- 委派时使用 `task-contract.md` 定义的协议。每次只传入本次任务需要的信息。
- Herdr 的 Agent/Pane 创建、启动、等待和结果读取方式以当前安装版本实际提供的 CLI、MCP 或工具 Schema 为准。调用前读取当前帮助或工具描述，不从旧示例推断参数。
- Main 对子 Agent 的调度结果、代码和报告进行独立验收。Herdr 显示的运行状态和子 Agent 自报 `DONE` 均不能替代验收。

## 6. 阶段门禁

- 需求、范围或验收存在实质歧义时，先 Clarify。
- L2 任务在 Intake 后创建 `overview.md`；实质性决策进入 `decisions.md`；L2 实施前必须有可执行方案，`plan.md` 的生成条件见 `task-classification.md`。
- Implementer 提交完整 Handoff 后才进入独立 Review。
- 所有必需测试、Primary Review，以及已触发的 Secondary Review / Reviewer Escalation 均完成后，才进入自动化 Gate。
- 自动化 Gate 通过后，按 `acceptance.md` 触发 Developer Review；`REQUIRED` 项未获得明确确认时，Verdict 为 `NEEDS DEVELOPER REVIEW`。
- 未解决 P0/P1 时 Verdict 为 `BLOCKED`；实质性用户决策未完成时使用 `NEEDS USER DECISION`。
- 超时、工具失败、部分执行和未验证事项如实记录。

## 7. 文档加载与上下文控制

| 场景 | 加载内容 |
|---|---|
| 所有任务 | `workflow.md`、`task-classification.md`、`permissions.md` |
| 需要选模型或委派 | `model-routing.md`、`task-contract.md` |
| 代码实现 / Review / Test / Gate / Developer Review | `task-contract.md`、`acceptance.md` |
| 项目内部代码检索 | `references/code-retrieval.md` |
| Secondary Review / Escalation | `references/review-escalation.md` |
| Visual Implementation | 执行 Agent 加载 `skills/ui-impl/SKILL.md` |

文档路径以 `AGENT_WORKBENCH_ROOT` 为仓库根目录。Runtime 入口应先解析该环境变量，再读取对应文件。Core 中引用 Skill 时使用逻辑名称；调用语法由 Runtime Adapter 负责映射。环境变量缺失或路径无效时，报告配置问题并请求修复；不得猜测仓库路径。

## 8. 产物与状态

默认产物目录：`.agents/workflow/tasks/<task-id>/`。所有 L2 任务必须创建 `overview.md`；出现实质性决策时创建 `decisions.md`；L2 实现任务的 `handoff.md` 必须包含 Implementation Walkthrough。其他产物按阶段创建，未触发的阶段无需创建。模板位于 `core/templates/`，完整字段和状态定义见 `task-contract.md`。

子 Agent 状态：

- `DONE`：约定任务完成，交付物已提供。
- `PARTIAL`：部分完成，列出剩余事项。
- `BLOCKED`：权限、依赖或信息问题导致无法继续。
- `FAILED`：执行失败，说明原因和已尝试处理。

`DONE` 是子 Agent 自报状态。Main 必须核验真实产物、源码、Diff、检查结果和验收条件。

## 9. 完成原则

任务只有在 Main 完成 `acceptance.md` 定义的验收后，才能报告 `PASS`；触发 Developer Review 的任务还必须获得明确的开发者确认。最终报告保持精简，并完整覆盖 `acceptance.md` §9 的字段；任务复杂时可增加检查项和必要证据，不因行数限制省略 Runtime、模型、Developer Review 状态或未解决风险。
