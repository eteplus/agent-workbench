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

Main Runtime 可以是 Claude Code 或 Pi。Runtime 与模型偏好分别配置；Main 模型偏好和档位以 `core/model-routing.md` §1 为准，实际选择遵循当前 Runtime 的支持范围。

### 指令优先级

1. 系统与平台安全约束。
2. 用户本次明确提出的要求。
3. 项目 `AGENTS.md`、项目规范和用户已确认的决策。
4. 本 Workflow 及其按需加载的 References。
5. Agent 自行判断。

发生冲突时，暂停冲突部分并向用户说明；用户明确要求的流程优先于本 Workflow 中可配置的流程约定。

## 2. 任务启动与续接

一次 Workflow 是一个任务生命周期，不是一次入口命令调用。Main 先判断当前请求：

- 同一任务的继续、阶段切换、再次调用入口或会话恢复：沿用 Task ID、产物根目录、当前阶段和已确认决策；从当前上下文或 `overview.md` 恢复，不重新 Intake。
- 当前目标的调整：只更新受影响的范围、决策、计划和验收；超出授权时先确认。
- 独立目标：建立新任务，不共用其他 Workflow 的产物根目录；无法确定归属时只澄清该歧义。

同一会话已读取且仍适用的 Core 不重复加载；恢复后缺少规则或规则已变更时读取对应文件。新任务按以下顺序启动：

1. 读取本文件，确认 Main 职责和总流程。
2. 读取 `core/task-classification.md`，判定任务类型和级别。
3. 读取 `core/permissions.md`，确认当前工作区、授权范围和副作用边界。
4. 按任务需要读取 `core/model-routing.md`、`core/task-contract.md` 和 `core/acceptance.md`。
5. 需要仓库检索时，将 `core/references/code-retrieval.md` 传给执行检索的 Agent。
6. 只有满足补充 Review 条件时，才加载 `core/references/review-escalation.md`。
7. 按任务类型执行必要阶段，不创建无关阶段。

Main 在任务开始、阶段切换或阻塞时向用户简报；授权范围内的常规推进不重复索要确认。用户可直接说“继续”或调整目标，无需逐阶段调用命令。每次续接先核对当前授权与实际工作区，结束时同步 `overview.md` 顶部当前状态和历史记录，字段与归属见 `core/task-contract.md` §6。

子 Agent 只接收当前任务所需的规则、输入和明确交付路径。Core 与 Task Contract 是默认执行路径；Skill 按用户指定或专项能力需要加载，调用机制和失败处理见 `task-contract.md`，语法由 Runtime Adapter 映射。

## 3. Intake、Research、Clarify 与 Plan

### Intake

开始时明确目标、任务类型与级别、交付物、范围与非目标、验收标准、依赖、风险、仓库和工作区边界。L2 任务在 `.agents/workflow/tasks/<task-id>/overview.md` 建立总览。检查相关 `AGENTS.md`、项目规范和已确认决策；只调查到足以分级、定范围和写 Contract。完整消费调查由执行 Agent 交付，Reviewer 独立核验，Main 验收时定向检查关键证据。

### Research

按需启动 Repo Researcher 或 Web Researcher。内部与外部调研可以并行，使用同一任务根目录下不同交付路径；需要更细划分时使用 `subtasks/`。Research 结论区分事实、推断和待确认事项，并提供文件位置、符号、行号或来源链接。项目代码检索遵循 `core/references/code-retrieval.md`。

### Clarify

当歧义会实质影响行为、范围、兼容性、数据或验收时才询问用户；先通过会话、代码、文档和已确认决策解决可自行查明的问题。

需要用户回答、决策或批准的交互始终在 Main 会话进行。子 Agent 发现新歧义时，将问题、证据、选项和建议报告 Main；Main 负责提问、接收回答和记录来源，不委派用户访谈。

重要业务歧义或用户要求深入澄清时，可在 Main 使用 `grilling` / `grill-with-docs` 等辅助 Skill；使用前按 `runtimes/README.md` 的 Skill 调用规则及 `skills/README.md` 的前置条件核验，不可用时按 Task Contract 的 REQUIRED / OPTIONAL 规则处理。Expert 只在重大架构或专业风险需要时提供独立分析，不是访谈的固定前置步骤，也不承载用户交互。

Main 按已解决的前置决策提问；每个问题说明歧义、选项、影响和有证据的推荐，不把事实调查交给用户。确认范围和批准来源遵循 `permissions.md`。用户确认后，由 Main 将实质性决策写入 `decisions.md`，必要时同步 `plan.md`。未经确认的假设标记为待确认，并暂停依赖该决策的工作。

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
| Retro | 发生重复失败、成本异常、并行冲突或质量缺口时，按 `acceptance.md` §11 执行必要复盘；可选 Skill 的前置条件与依赖见 `skills/README.md` | 可复用的改进项 |

Debug 任务先完成复现和根因诊断；仅诊断时，以 `debug-report.md` 验收后结束。需要修复时，再按 L0/L1/L2 分级进入对应实现流程；L2 修复必须执行 Implement、Handoff、Test、Primary Review 和 Gate。纯 Research、Plan、Review 或 Test 任务只执行完成目标所需阶段。Visual Implementation 沿用普通实施阶段，并增加浏览器截图和视觉比较。

## 5. 委派原则

- L0/L1 由 Main 按 `task-classification.md` 直接处理。
- L2 代码实现由 Herdr → Pi Implementer 执行，Main 不直接实现 L2 业务代码。
- 独立 Research、Debug 诊断、Review、Test 根据任务需要通过 Herdr 启动 Pi 子 Agent；Debug 诊断默认只读。若诊断任务需要代码修复，按修复任务的 L0/L1/L2 规则执行。
- 委派时使用 `task-contract.md` 定义的协议。每次只传入本次任务需要的信息；子任务沿用 Workflow Task ID，以独立 Subtask ID 区分执行，产物仍在同一个任务根目录。
- 结构化 Agent 状态只用于协调；报告、实际 Diff 和检查结果用于验收。产物缺失、状态矛盾或 Skill 加载异常时，定向读取对应 Session 记录；TUI 屏幕仅用于终端故障诊断。
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
| 所有任务 | `core/workflow.md`、`core/task-classification.md`、`core/permissions.md` |
| 需要选模型或委派 | `core/model-routing.md`、`core/task-contract.md` |
| 代码实现 / Review / Test / Gate / Developer Review | `core/task-contract.md`、`core/acceptance.md` |
| 项目内部代码检索 | `core/references/code-retrieval.md` |
| Secondary Review / Escalation | `core/references/review-escalation.md` |
| Visual Implementation | 执行 Agent 加载 `skills/ui-impl/SKILL.md` |

加载表与委派 References 使用相对于 `AGENT_WORKBENCH_ROOT` 的路径；Core 正文中的同目录短名称相对于所在文档。Runtime 入口应先解析该环境变量，再读取对应文件。Core 中引用 Skill 时使用逻辑名称；调用语法由 Runtime Adapter 负责映射。环境变量缺失或路径无效时，报告配置问题并请求修复；不得猜测仓库路径。

## 8. 产物与状态

产物生命周期、单任务根目录、`subtasks/`、写入归属和本地保存方式以 `task-contract.md` §5–6 为准。所有 L2 任务创建 `overview.md`；其他产物仅在阶段需要时创建，未触发阶段不生成空报告。总览与交接分别使用 `core/templates/overview.template.md`、`core/templates/handoff.template.md`。

子 Agent 状态：

- `DONE`：约定任务完成，交付物已提供。
- `PARTIAL`：部分完成，列出剩余事项。
- `BLOCKED`：权限、依赖或信息问题导致无法继续。
- `FAILED`：执行失败，说明原因和已尝试处理。

`DONE` 是子 Agent 自报状态。Main 必须核验真实产物、源码、Diff、检查结果和验收条件。

## 9. 完成原则

任务只有在 Main 完成 `acceptance.md` 定义的验收后，才能报告 `PASS`；触发 Developer Review 的任务还必须获得明确的开发者确认。最终报告保持精简，并完整覆盖 `acceptance.md` §9 的字段；任务复杂时可增加检查项和必要证据，不因行数限制省略 Runtime、模型、Developer Review 状态或未解决风险。
