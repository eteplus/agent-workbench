# Subagent Task Contract & Deliverables

所有通过 `Herdr → Pi Agent` 委派的任务都使用本文件定义的 Task Contract。Main 定义任务契约和验收标准；子 Agent 在授权范围内执行并提供证据。

## 1. Contract Rules

- 子 Agent 仅接收本次任务相关的需求、规范、Task Contract、Skill 和 References，不全量注入 Main Workflow 或无关历史。
- 每次委派填写以下字段；确实不适用时标记 `N/A`。L2 任务还必须遵循本文件定义的任务总览、决策记录和 Handoff 规范。
- `Agent Role` 表示本次执行者职责；`Task Type` 使用 `task-classification.md` 的完整枚举。不要将阶段名称误填为 Agent Role。
- `Skills` 字段必须注明 Skill 是否已安装、调用策略及加载结果。调用策略使用 `HERDR_EXPLICIT_COMMAND`（Main 通过 Herdr `agent prompt` 前缀命令触发；目标为 Pi Agent 时统一使用 `/skill:<name>`）、`USER_COMMAND`（用户在 Main Runtime 显式输入，按 Runtime 语法映射）、`RUNTIME_AUTO`（当前 Runtime 明确允许模型自动调用）或 `CORE_FALLBACK`（Skill 不可用时使用 Core 流程）。`disable-model-invocation: true` 的 Skill 不得标为 `RUNTIME_AUTO`；Herdr 显式命令不受该字段限制，但目标 Pi Agent 必须已安装该 Skill。
- References 路径相对于 `AGENT_WORKBENCH_ROOT` 解析。
- 委派前，Main 确认子 Agent 能访问指定文件；无法访问时，Main 将相关规则摘要或必要片段写入 Context。
- 执行所需 Skill 必须由实际执行的子 Agent 加载；Main 已加载的 Skill 不代表子 Agent 自动继承。
- 缺少非关键字段时，子 Agent 可记录合理假设；会实质影响实现或验收的缺失信息交由 Main Clarify。

## 2. Task Contract Template

```text
Task ID: <唯一任务标识>
Agent Role: <Main / Planner | Repo Researcher | Web Researcher | Implementer | Primary Reviewer | Secondary Reviewer | Reviewer Escalation | Tester | Expert>
Task Type: <Research | Plan / Architecture | Implement | Visual Implementation | Review | Test | Debug | Documentation | Issue / Ticket | Mixed>
Goal: <明确目标和预期结果>
Model Preference / Thinking: <按 core/model-routing.md 指定模型偏好与档位>
Skills: <逻辑 Skill 名称 + REQUIRED / OPTIONAL + 是否已安装 + invocation policy + 加载结果；invocation policy 使用 HERDR_EXPLICIT_COMMAND / USER_COMMAND / RUNTIME_AUTO / CORE_FALLBACK；无则 None。`disable-model-invocation: true` 不得标为 RUNTIME_AUTO；可选 Skill 未加载时走 Core fallback>
References: <按需加载的参考文件路径；无则 None>
Workspace Baseline:
  Branch: <任务开始时的当前分支>
  Base Commit: <任务开始时 HEAD；无法获取时 N/A 并说明>
  Initial Git Status: <clean / dirty>
  Pre-existing Modified Paths: <任务开始前已修改的文件；无则 None>
  Pre-existing Untracked Paths: <任务开始前已存在的未跟踪文件；无则 None>
  Pre-existing Paths Overlapping Scope: <与本次目标修改范围重叠的既有变更路径；无则 None>
  Overlap Handling: <NONE | EXCLUDED | USER_AUTHORIZED_WITH_SNAPSHOT | BLOCKED>
  Baseline Snapshot: <任务前快照目录/文件路径；无则 N/A>
  Allowed Paths: <本次任务允许修改的路径>
Scope: <允许检查或修改的文件、模块及边界>
Context: <需求、方案、代码位置、前序证据和相关规范>
Retrieval: <按 references/code-retrieval.md 选择 CodeGraph MCP / rg / fd / Read / sed；或 N/A>
Time Budget: <按 core/acceptance.md 的阶段预算和检查点；已知硬限制>
Deliverables: <产物路径与交付内容；无文件时说明>
Constraints: <本任务适用的 core/permissions.md 权限、安全与工作区边界>
Acceptance Criteria: <可观察、可验证的完成条件>
Decision Authority: <已确认决策 / 项目约定 / Agent 可提出建议的边界；注明产品/领域批准责任人>
Developer Review Requirement: <REQUIRED | RECOMMENDED | NOT REQUIRED；由 Main 按 core/acceptance.md 判定>
Final Response: <状态、交付路径、未完成和未验证事项>
```

## 3. Workspace Baseline

Main 在任务 Intake 时记录 Workspace Baseline，并将其传递给所有可能读取或修改工作区的子 Agent。至少包含：

- `Branch`：任务开始时的当前分支。
- `Base Commit`：任务开始时的 HEAD Commit；仓库无 Commit 时标记 `N/A`。若没有可用 Base Commit，必须为任务可能触及的文件建立可复核的任务前快照，否则无法可靠 Review 时暂停该任务。
- `Initial Git Status`：任务开始时工作区是否存在修改。
- `Pre-existing Modified Paths`：任务开始前已修改的文件路径及状态。
- `Pre-existing Untracked Paths`：任务开始前已存在的未跟踪文件路径。
- `Pre-existing Paths Overlapping Scope`：任务目标与任务前既有修改/未跟踪文件重叠的路径。
- `Overlap Handling`：`NONE`（无重叠）、`EXCLUDED`（已从本次修改范围排除）、`USER_AUTHORIZED_WITH_SNAPSHOT`（用户明确授权且已建立快照）或 `BLOCKED`（无法安全区分）。
- `Baseline Snapshot`：存在已授权的重叠路径时，记录任务开始前相关文件快照的位置；无重叠时为 `N/A`。
- `Allowed Paths`：本次任务允许检查/修改的路径。

Base Commit 只表示任务开始时的 HEAD；`git diff <base>` 仍会包含任务开始前已经存在的工作区修改，不能单独证明这些变更属于当前任务。Main 默认将既有脏文件从 `Allowed Paths` 排除。若任务确实需要修改重叠路径，Main 先向用户说明重叠文件和风险，取得明确授权，再在任何子 Agent 写入前为相关文件建立任务前快照，放入本任务的 `workspace-baseline/`。快照遵循与源文件相同的访问控制，只包含必要文件，不得包含/复制无关凭据或私密数据。快照是审阅证据，不属于实现交付物；默认不得将其混入产品构建、发布包或实现提交。无法安全建立可靠快照时，将该路径标记 `BLOCKED` 并暂停。

子 Agent 不得重置、覆盖或清理既有改动。Reviewer 对干净路径可结合 Base Commit 检查 Diff；对授权重叠路径必须比较任务前快照与最终文件，并单独说明归属。任务前已有的未跟踪文件不得算作本次新增文件。若无法可靠区分任务变更与既有变更，相关 Review 标记 `INCOMPLETE`，Main 不得放行 `PASS`。任务结束时，Main 在 `overview.md` 标注快照的保留位置和处理建议；是否清理由用户或项目约定决定。

## 4. Visual Implementation Contract Fields

Visual Implementation 额外填写：

- `Reference`：参考截图、设计稿或参考网页。
- `Target`：目标 Route / URL 和页面范围。
- `Viewport`：宽高；必要时指定 DPR、设备类型和滚动位置。
- `States`：页面、交互、主题和数据状态。
- `Assets`：可复用图片、字体、图标、设计 Token 和素材目录。

实际执行视觉实现的 Agent 必须加载 `skills/ui-impl/SKILL.md`。上游 `implement`、`grill-with-docs`、`retro` 若设置 `disable-model-invocation: true`，Task Contract 不得将其描述为模型可自主调用的能力；Main / Orchestrator 可以通过显式命令触发。向 Herdr → Pi 子 Agent 委派时，所有已安装 Skill 统一使用 `/skill:<name>`：例如 `/skill:implement`、`/skill:grill-with-docs`、`/skill:retro`、`/skill:ui-impl`。该命令由 Main / Orchestrator 显式放在 `herdr agent prompt` 消息开头，再附完整 Task Contract。子 Agent 必须在 Handoff 中报告 parent Skill 是否实际加载，以及正文引用的嵌套 Skill / 工具是否真正执行；parent 加载成功不代表内部依赖全部运行。对于 Pi 不支持的 Claude Code `Skill` Tool 嵌套调用，标记为 `UNSUPPORTED` / `SKIPPED`，并说明是否采用 Core fallback。

## 5. Task Artifact Directory

默认任务目录：`.agents/workflow/tasks/<task-id>/`。所有 L2 任务都必须创建 `overview.md`，作为开发者了解任务目标、关键决策、实现变化、验证结果和后续事项的统一入口。L0/L1 可按需创建。

按任务类型创建下列产物；未触发的阶段无需创建文件。

| Task Type | Artifact | Required Content |
|---|---|---|
| All L2 tasks | `overview.md` | 任务背景、目标/范围、Workspace Baseline 摘要、阶段状态、产物导航、关键变更、决策索引、实现理解摘要、验证结果、Developer Review 状态、未解决事项 |
| Overlapping dirty paths (conditional) | `workspace-baseline/` | 经用户授权后，仅保存与任务目标重叠的任务前文件快照；用于区分既有修改和本次修改 |
| Research | `research.md` | 结论、事实/推断、文件/符号/行号或来源、影响、风险、待确认事项 |
| Debug（诊断） | `debug-report.md` | 症状、复现步骤、环境、日志/源码证据、假设、已排除原因、根因结论、建议修复与验证方式；未确认原因明确标注 |
| Material Decision | `decisions.md` | 有实质性产品、交互、架构、接口、数据、安全、兼容性或性能影响的决策；包含选项、依据、取舍、决策来源、负责人和状态 |
| Plan | `plan.md` | 目标/非目标、范围、调用链、契约、兼容性、步骤、测试、风险与回滚 |
| Implement | `handoff.md` | 实现摘要、修改文件及意图、契约/兼容性、Implementation Walkthrough、实际检查、未覆盖项、风险、Review 重点、实际模型和 Thinking |
| Visual Implementation | `visual-report.md` + `screenshots/` | 参考图、Route、Viewport、页面状态、最终截图、差异与修正、浏览器结果、限制；Handoff 引用报告 |
| Primary Review | `review.md` | 审查范围、Finding、严重级别、文件/行号、证据、需求/决策/规范依据、Agent 新增假设、修复建议和审查限制 |
| Secondary Review | `review-secondary.md` | 独立审查范围、Finding、证据和审查限制 |
| Reviewer Escalation | `review-escalation.md` | 争议 Finding、双方结论、定向裁决及证据 |
| Test | `test-report.md` | 实际命令、测试范围、结果、失败、未覆盖项和环境限制 |
| Retro | `retro.md` | 流程、模型、成本、质量、并行及交付问题的复盘和改进建议 |

## 6. Artifact Rules

### `overview.md`：任务总览

- 记录 Workspace Baseline 的摘要、重叠路径和处理方式；完整字段以本次 Task Contract 为准。若存在已授权重叠路径，链接 `workspace-baseline/` 快照。
- 所有 L2 任务由 Main 创建并维护 `overview.md`；在 Intake 后建立初始版本，在 Gate 和最终验收前更新。
- 它是任务导航页和审阅摘要，不复制其他产物的完整内容。使用相对路径链接到 `research.md`、`decisions.md`、`plan.md`、`handoff.md`、Review / Test 报告、视觉证据及适用时的 `workspace-baseline/`。
- 至少说明：原始目标和验收条件；任务类型/级别与 Main Runtime；参与 Agent；关键修改模块/文件；决策 ID、来源和状态；主要调用链/数据流；测试与 Review 结论；Developer Review 判定及理由；未解决风险和下一步。
- 对没有触发的阶段明确写 `N/A`，并说明原因；不要为了填满目录生成空白报告。

### `decisions.md`：决策追踪

当 L2 任务涉及实质性产品行为、交互设计、架构边界、技术选型、API / 数据结构 / 数据库契约、安全权限、兼容性、迁移、性能或失败处理决策时，必须创建 `decisions.md`。单纯按既有项目模式完成的局部实现细节无需逐项记录。

每项决策至少记录：Context、Problem、Options、Decision、Rationale、Trade-offs、Decision Owner、Origin、Status、Approval Requirement / Status、Impact 和 Evidence。

- `Origin` 使用 `USER_APPROVED`、`PROJECT_CONVENTION` 或 `AGENT_PROPOSAL`。
- 需要业务确认的决策记录 `Product / Domain Approval` 的责任人、状态和确认依据；技术 Developer Review 与业务批准分开记录。
- `Status` 使用 `PROPOSED`、`CONFIRMED`、`REJECTED` 或 `DEFERRED`。
- Agent 可以分析并提出方案；实质性产品或设计选择超出已确认需求和项目约定时，先交 Main Clarify。需要业务方权衡的决策须在依赖该决策的实现开始前取得用户或 Product / Domain Owner 的明确批准。
- Main 或 Agent 在实施期间发现新的实质性决策时，先更新记录，再继续依赖该决策的工作；紧急且可逆的临时假设必须标记为 `PROPOSED` 并限制影响。
- 如果 L2 任务经过评估没有实质性决策，`overview.md` 中明确写 `No material decisions`，无需创建 `decisions.md`。

### `handoff.md`：实现理解

所有 L2 实现任务的 Handoff 必须包含 `Implementation Walkthrough`，说明关键变更与需求/决策的对应关系、核心调用链或数据流、关键抽象/状态/领域规则、技术取舍、扩展入口和排查线索。结合真实文件、符号和必要行号；避免泛化描述或重复整份 Diff。

- Implementer 将完整交接写入 `handoff.md`；Reviewer 和 Tester 写入各自报告。
- 其他任务按 Task Contract 指定路径交付。
- 文件交付任务必须写入完整内容，不能只在对话中返回摘要；写入失败时说明原因。
- 模板位于 `core/templates/`；创建产物时以模板为起点，按任务实际情况删去不适用章节并说明 `N/A`。
- 任务目录中的结论必须链接到可核验的源码、Diff、测试输出或来源；摘要不能替代原始证据。
- 不同 Task ID 使用独立产物目录，并行 Agent 使用不同文件，避免写入冲突。
- Visual Implementation 的截图默认保存到 `screenshots/`，命名可采用 `iteration-1.png`、`iteration-2.png`、`final.png`；优先引用用户提供的参考图原始路径。
- 所有路径相对于项目仓库根目录；任务目录统一位于 `.agents/workflow/tasks/`，不另建 `.artifacts/`。

## 7. Completion Status

子 Agent 最终状态只能为：

- `DONE`：约定任务完成，交付物已提供。
- `PARTIAL`：部分完成，列出剩余事项。
- `BLOCKED`：权限、依赖或信息问题导致无法继续。
- `FAILED`：执行失败，说明原因和已尝试处理。

最终响应同时说明：已完成、未完成、未验证事项、风险/阻塞、实际 Provider / Model ID、实际 Thinking 和交付路径。

`DONE` 是子 Agent 自报状态，Main 仍须依据真实交付验收。
