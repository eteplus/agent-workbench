# Subagent Task Contract & Deliverables

所有通过 `Herdr → Pi Agent` 委派的任务都使用本文件定义的 Task Contract。Main 定义任务契约和验收标准；子 Agent 在授权范围内执行并提供证据。

## 1. Contract Rules

- 子 Agent 仅接收本次任务相关的需求、规范、Task Contract、Skill 和 References，不全量注入 Main Workflow 或无关历史。
- 每次委派填写以下字段；确实不适用时标记 `N/A`。L2 任务还必须遵循本文件定义的任务总览、决策记录和 Handoff 规范。
- `Agent Role` 表示本次执行者职责；`Task Type` 使用 `task-classification.md` 的完整枚举。不要将阶段名称误填为 Agent Role。
- 默认按 Core 和本次 Contract 执行；仅用户指定或专项能力需要时使用 Skill。`Skills` 注明 REQUIRED / OPTIONAL、是否安装、调用策略、加载结果及必要依赖。策略为 `HERDR_EXPLICIT_COMMAND`、`USER_COMMAND`、`RUNTIME_AUTO` 或 `CORE_FALLBACK`（仅 OPTIONAL 或未指定 Skill 的 Core 默认路径）；REQUIRED 不得使用 CORE_FALLBACK。语法与支持能力见 `runtimes/README.md`。`disable-model-invocation: true` 不得标为 `RUNTIME_AUTO`。
- REQUIRED Skill 或必要依赖缺失、未展开或不可执行时，子 Agent 停止依赖该能力的工作并报告 Main；Main 重新安排支持的执行路径或请求变更要求，不静默降级。OPTIONAL 不可用时记录原因，按 Core 继续。parent 加载成功不代表嵌套依赖执行成功。
- References 路径相对于 `AGENT_WORKBENCH_ROOT` 解析。
- 委派前，Main 确认子 Agent 能访问指定文件；无法访问时，Main 将相关规则摘要或必要片段写入 Context。
- 执行所需 Skill 必须由实际执行的子 Agent 加载；Main 已加载的 Skill 不代表子 Agent 自动继承。
- 缺少非关键字段时，子 Agent 可记录合理假设；会实质影响实现或验收的缺失信息交由 Main Clarify。

## 2. Task Contract Template

```text
Task ID: <Workflow 唯一任务标识；所有子任务沿用>
Subtask ID: <当前委派标识；无则 N/A>
Task Root: <该 Workflow 产物根目录的绝对路径>
Repository Root: <当前项目仓库根目录的绝对路径；与 Task Root、AGENT_WORKBENCH_ROOT 区分>
Agent Role: <Main / Planner | Repo Researcher | Web Researcher | Implementer | Primary Reviewer | Secondary Reviewer | Reviewer Escalation | Tester | Expert>
Task Type: <Research | Plan / Architecture | Implement | Visual Implementation | Review | Test | Debug | Documentation | Issue / Ticket | Mixed>
Goal: <明确目标和预期结果>
Model Preference / Thinking: <按 core/model-routing.md 指定模型偏好与档位>
Skills: <逻辑 Skill 名称 + REQUIRED / OPTIONAL + 是否已安装 + invocation policy + 加载结果；invocation policy 使用 HERDR_EXPLICIT_COMMAND / USER_COMMAND / RUNTIME_AUTO / CORE_FALLBACK；无则 None。CORE_FALLBACK 仅 OPTIONAL 或无 Skill 时使用；REQUIRED 不得使用 CORE_FALLBACK。`disable-model-invocation: true` 不得标为 RUNTIME_AUTO>
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
  Allowed Paths: <允许写入的绝对路径；包含实现文件和指定产物，未列出的临时脚本路径不获授权>
Scope: <允许只读检查的文件、模块及边界；写入权限由 Allowed Paths 指定>
Context: <需求、方案、代码位置、前序证据和相关规范>
Retrieval: <按 core/references/code-retrieval.md 选择 CodeGraph MCP / rg / fd / Read / sed；或 N/A>
Time Budget: <按 core/acceptance.md 的阶段预算和检查点；已知硬限制>
Deliverables: <Task Root 内的绝对交付路径、内容和唯一写入负责人；无文件时说明>
Constraints: <本任务适用的 core/permissions.md 权限、安全与工作区边界；明确允许的工具/命令、手工审查文件在 Task Root 内的位置及验证命令自身输出位置。需核验 Pi 元数据时授权目标 Agent 用 printf 读取自身 PI_PROVIDER / PI_MODEL / PI_REASONING_LEVEL；需定位 Session 时同时授权 PI_SESSION_FILE；不能获得此能力时由 Main 按 model-routing.md 处理>
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
- `Allowed Paths`：本次任务允许写入的绝对路径；只读检查范围由 `Scope` 指定。

Base Commit 只表示任务开始时的 HEAD；`git diff <base>` 仍会包含任务开始前已经存在的工作区修改，不能单独证明这些变更属于当前任务。Main 默认将既有脏文件从 `Allowed Paths` 排除。若任务确实需要修改重叠路径，Main 先向用户说明重叠文件和风险，取得明确授权，再在任何子 Agent 写入前为相关文件建立任务前快照，放入本任务的 `workspace-baseline/`。快照遵循与源文件相同的访问控制，只包含必要文件，不得包含/复制无关凭据或私密数据。快照是审阅证据，不属于实现交付物；默认不得将其混入产品构建、发布包或实现提交。无法安全建立可靠快照时，将该路径标记 `BLOCKED` 并暂停。

子 Agent 不得重置、覆盖或清理既有改动。Reviewer 对干净路径可结合 Base Commit 检查 Diff；对授权重叠路径必须比较任务前快照与最终文件，并单独说明归属。任务前已有的未跟踪文件不得算作本次新增文件。若无法可靠区分任务变更与既有变更，相关 Review 标记 `INCOMPLETE`，Main 不得放行 `PASS`。任务结束时，Main 在 `overview.md` 标注快照的保留位置和处理建议；是否清理由用户或项目约定决定。

## 4. Visual Implementation Contract Fields

Visual Implementation 额外填写：

- `Reference`：参考截图、设计稿或参考网页。
- `Target`：目标 Route / URL 和页面范围。
- `Viewport`：宽高；必要时指定 DPR、设备类型和滚动位置。
- `States`：页面、交互、主题和数据状态。
- `Assets`：可复用图片、字体、图标、设计 Token 和素材目录。

实际执行视觉实现的 Agent 必须加载 `skills/ui-impl/SKILL.md`。Skill 加载、依赖与失败处理遵循 §1，Runtime 调用方式见 `runtimes/README.md`；Handoff 分别记录加载证据和实际执行结果。

## 5. Task Artifact Directory

一个 Workflow 任务只有一个产物根目录，默认位于目标项目的 `<Repository Root>/.agents/workflow/tasks/<task-id>/`，不位于 `AGENT_WORKBENCH_ROOT`；Contract 填写解析后的绝对 Task Root。Task ID 表示任务生命周期，重复入口调用、阶段切换和会话恢复沿用该目录；独立 Workflow 建立独立根目录。L0/L1 无文件交付时可不创建，L2 必须由 Main 创建 `overview.md`。

子 Agent 不另建顶层 task 目录。多份同类报告使用不同文件；需细分执行时使用 `subtasks/<subtask-id>/` 保存 Contract、报告和证据，由顶层 `overview.md` 索引。每个产物只有一个写入负责人：Main 维护总览、决策和最终方案，子 Agent 写指定报告；Main 汇总时引用报告；事实笔误修正与写入权移交遵循 `permissions.md` 的 Report Corrections，不与子 Agent 同写文件。

任务产物是本地 Agent 上下文，默认不纳入提交。Intake 检查根目录是否被 Git 忽略，在总览说明本地保存方式；未被忽略时建议使用项目本地 `.git/info/exclude`，不自动修改项目忽略规则或提交产物。提交前显式排除 task 目录。历史产物不自动迁移、删除或归档；长期知识提炼遵循 `acceptance.md` §10。

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
- 所有 L2 任务由 Main 创建并维护 `overview.md`。顶部 Status 是唯一当前状态入口：当前 Main 配置、阶段、授权及来源、阻塞、Verdict、人工审阅状态、已提交 Commit 和外部操作结果；尚未发生的项写 None。Intake、阶段切换及每次续接结束时更新，其他章节引用顶部状态。
- 历史授权、模型切换、提交、外部操作及报告写入权移交放在带时间和证据的 Execution History；参与者表按执行阶段记录模型，不把旧配置当成当前值。历史记录不自行授予当前权限。
- 它是任务导航页和审阅摘要，不复制其他产物的完整内容。使用相对路径链接到 `research.md`、`decisions.md`、`plan.md`、`handoff.md`、Review / Test 报告、视觉证据及适用时的 `workspace-baseline/`。
- 至少说明：Task Root、Repository Root、本地保存方式；原始目标和验收条件；任务类型/级别与 Main Runtime；参与 Agent；关键修改模块/文件；决策 ID、来源和状态；主要调用链/数据流；测试与 Review 结论；Developer Review 判定及理由；未解决风险和下一步。
- 对没有触发的阶段明确写 `N/A`，并说明原因；不要为了填满目录生成空白报告。

### `decisions.md`：决策追踪

当 L2 任务涉及实质性产品行为、交互设计、架构边界、技术选型、API / 数据结构 / 数据库契约、安全权限、兼容性、迁移、性能或失败处理决策时，必须创建 `decisions.md`。单纯按既有项目模式完成的局部实现细节无需逐项记录。

每项决策至少记录：Context、Problem、Options、Decision、Rationale、Trade-offs、Decision Owner、Origin、Status、Approval Requirement / Status、Impact 和 Evidence。

- `Origin` 使用 `USER_APPROVED`、`PROJECT_CONVENTION` 或 `AGENT_PROPOSAL`。`USER_APPROVED` 必须引用 Main 会话中具体问题、推荐版本和用户回答，或用户明确指定的外部批准依据；子 Agent 转述不等于用户批准。
- 需要业务确认的决策记录 `Product / Domain Approval` 的责任人、状态和确认依据；技术 Developer Review 与业务批准分开记录。
- `Status` 使用 `PROPOSED`、`CONFIRMED`、`REJECTED` 或 `DEFERRED`。
- Agent 可以分析并提出方案；实质性产品或设计选择超出已确认需求和项目约定时，先交 Main Clarify。需要业务方权衡的决策须在依赖该决策的实现开始前取得用户或 Product / Domain Owner 的明确批准。
- Main 或 Agent 在实施期间发现新的实质性决策时，先更新记录，再继续依赖该决策的工作；紧急且可逆的临时假设必须标记为 `PROPOSED` 并限制影响。
- 如果 L2 任务经过评估没有实质性决策，`overview.md` 中明确写 `No material decisions`，无需创建 `decisions.md`。

### `handoff.md`：实现理解

所有 L2 实现任务的 Handoff 必须包含 `Implementation Walkthrough`，说明关键变更与需求/决策的对应关系、核心调用链或数据流、关键抽象/状态/领域规则、技术取舍、扩展入口和排查线索。结合真实文件、符号和必要行号；避免泛化描述或重复整份 Diff。

- Implementer 将完整交接写入 `handoff.md`；Reviewer 和 Tester 写入各自报告。实际模型/档位附元数据来源，不能从启动偏好推断。
- 所有 Handoff / Review / Test 报告列出实现与指定报告之外的手工写入绝对路径、用途和权限依据（无则 None），包括审查临时文件；验证命令自身输出按 Constraints 记录。Main 对照工具结果和已知写入核对，不只看 Git Diff；发现越界按 `permissions.md` §2 处理。
- 其他任务按 Task Contract 指定路径交付。
- 文件交付任务必须写入完整内容，不能只在对话中返回摘要；写入失败时说明原因。
- 模板位于 `core/templates/`；创建产物时以模板为起点，按任务实际情况删去不适用章节并说明 `N/A`。
- 任务目录中的结论必须链接到可核验的源码、Diff、测试输出或来源；摘要不能替代原始证据。
- 不同 Workflow 使用独立产物根目录，同一 Workflow 的并行 Agent 使用不同文件或 `subtasks/` 子目录；按 Contract 指定的唯一写入负责人交付。
- Visual Implementation 的截图默认保存到 `screenshots/`，命名可采用 `iteration-1.png`、`iteration-2.png`、`final.png`；优先引用用户提供的参考图原始路径。
- 报告导航使用相对 Task Root 的链接；Contract 的 Task Root、允许写入范围和交付位置使用绝对路径。产物集中在当前根目录，不另建 `.artifacts/`。

## 7. Completion Status

子 Agent 最终状态只能为：

- `DONE`：约定任务完成，交付物已提供。
- `PARTIAL`：部分完成，列出剩余事项。
- `BLOCKED`：权限、依赖或信息问题导致无法继续。
- `FAILED`：执行失败，说明原因和已尝试处理。

最终响应同时说明：已完成、未完成、未验证事项、风险/阻塞、实际 Provider / Model ID、实际 Thinking 和交付路径。

`DONE` 是子 Agent 自报状态，Main 仍须依据真实交付验收。
