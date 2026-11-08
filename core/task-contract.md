# Task Contract 与交付物

所有通过 Herdr → Pi 委派的任务都使用本文件定义的 Task Contract（简称 Contract）。Main 定义 Contract 和验收标准；子 Agent 在授权范围内执行并提供证据。

## 1. Contract 规则

- 每次委派按 §2 模板填写全部字段，不适用的标 `N/A`。子 Agent 只接收本次任务相关的需求、规范、Contract、Skill 和 References。
- `Agent Role` 填执行者职责（而非阶段名）；`Task Type` 使用 `core/task-classification.md` §2 的枚举。
- 缺少非关键信息时，子 Agent 可记录合理假设；会实质影响实现或验收的缺失交 Main Clarify。

### Skill

- 默认按 Core 执行。指定 Skill 时，`Skills` 字段写明：逻辑名称、绝对 Source Path、REQUIRED / OPTIONAL、安装状态、调用策略和加载结果。
- 调用策略取 `HERDR_EXPLICIT_COMMAND`、`USER_COMMAND`、`RUNTIME_AUTO` 或 `CORE_FALLBACK`。`CORE_FALLBACK` 只用于 OPTIONAL 或未指定 Skill；用户显式调用型 Skill 标为 `USER_COMMAND`。调用映射见 `runtimes/README.md`。
- 来源以 Source Path 为准；同名或同一安装目录只说明可能相同。
- Skill 由实际执行的子 Agent 加载；Main 加载过的 Skill 需要子 Agent 自行加载。
- REQUIRED Skill 或其必要依赖缺失、未展开或不可执行：子 Agent 停止依赖它的工作并报告 Main，由 Main 重新安排支持的执行路径或请求变更要求。
- OPTIONAL 不可用：记录原因，按 Core 继续。
- parent Skill 加载成功与其嵌套依赖执行成功分开核验。

### References

- 加载表路径相对于 `AGENT_WORKBENCH_ROOT`。Main 派发前把 References 解析为绝对路径，逐项写明章节、REQUIRED / OPTIONAL 和适用条件，或给出完整摘录并注明来源。
- 章节边界按当前标题定位。
- 涉及实现 / Review / Test 时，同时提供原始需求和验收正文。
- 条件未触发的项写明依据；必需项缺失或条件有歧义时交 Main 判断。

### 必需输入

| 执行者 | 加载章节 |
|---|---|
| 所有子 Agent | `core/task-contract.md` §1、§6 通用规则与当前产物、§7；`core/permissions.md` §1「决策归属」、§2–4；原始目标、范围和验收正文 |
| Implementer | `core/acceptance.md` §1、§2；并行时追加 `core/permissions.md` §5 |
| Reviewer | `core/acceptance.md` §2「实现版本证据」与「验证调度」；Primary 读取 §3；Secondary / Escalation 读取 §4、§3「Finding 严重级别」及 `core/references/review-escalation.md` 的盲审 / 定向裁决分支 |
| Tester | `core/acceptance.md` §2 |
| 视觉实现者 | `skills/ui-impl/SKILL.md`；`core/acceptance.md` §5 |

阶段预算写入 Time Budget；出现超时、未知结果或部分执行时才加载 `core/references/recovery.md`。Research、Debug 和 Plan 的专项证据要求写入当前 Contract。

### 启动核验

1. **Main 派发前**：确认当前授权与项目交付前置条件；提供已知入口、任务边界和写入归属；核对 Deliverables 中的报告/截图/证据路径都在 Allowed Paths 内。完整影响调查交给执行者，必要时先委派 Researcher。
2. **执行者工作前**：读取 Contract 指定的 Source Path 和必需输入，确认实际模型、必要的调用方/测试/配置、交付路径和完整检查命令。实际 Skill 来源与指定来源不符时，加载指定文件或交 Main 修正。缺输入、路径越界或能力冲突时，暂停依赖工作，待 Contract 更新后继续。
3. **完成条件**：在 Deliverables 指定的报告开头写启动核验段，列出实际来源、已加载的输入、范围、检查命令及未解决项；依赖缺口清零后再开始工作。无文件交付时在回复中记录。启动核验段写在原报告内，任务结束时补全整份报告。

## 2. Contract 模板

```text
Task ID: <Workflow 唯一任务标识；所有子任务沿用>
Subtask ID: <当前委派标识；无则 N/A>
Task Root: <该 Workflow 产物根目录的绝对路径>
Repository Root: <当前项目仓库根目录的绝对路径；与 Task Root、AGENT_WORKBENCH_ROOT 区分>
Agent Role: <Main / Planner | Repo Researcher | Web Researcher | Implementer | Primary Reviewer | Secondary Reviewer | Reviewer Escalation | Tester | Expert>
Task Type: <Research | Plan / Architecture | Implement | Visual Implementation | Review | Test | Debug | Documentation | Issue / Ticket | Mixed>
Goal: <明确目标和预期结果>
Output Language: <沿用 Main 确定的任务语言；见 core/workflow.md §2>
Model Preference / Thinking: <按 core/model-routing.md 指定模型偏好与 Thinking>
Skills: <逻辑名称、绝对 Source Path、REQUIRED / OPTIONAL、安装状态、调用策略与加载结果；无则 None，见 §1>
References: <每项绝对路径 / 章节 / REQUIRED 或 OPTIONAL / 适用条件；完整摘录注明来源，见 §1>
Workspace Baseline:
  Branch: <任务开始时的当前分支>
  Base Commit: <任务开始时 HEAD；无法获取时 N/A 并说明>
  Initial Git Status: <clean / dirty>
  Pre-existing Modified Paths: <任务开始前已修改的文件；无则 None>
  Pre-existing Untracked Paths: <任务开始前已存在的未跟踪文件；无则 None>
  Pre-existing Paths Overlapping Scope: <与本次修改范围重叠的既有变更路径；无则 None>
  Overlap Handling: <NONE | EXCLUDED | USER_AUTHORIZED_WITH_SNAPSHOT | BLOCKED>
  Baseline Snapshot: <任务前快照路径；无则 N/A>
  Allowed Paths: <允许写入的绝对路径，包含实现文件、指定产物和证据目录>
Scope: <允许只读检查的文件、模块及边界；写入权限见 Allowed Paths>
Context: <需求、方案、代码位置、前序证据和相关规范；规则摘录注明来源>
Implementation Evidence: <关联实现版本及绝对证据路径，见 core/acceptance.md §2；实施前尚未生成时说明，非代码任务 N/A>
Retrieval: <按 core/references/code-retrieval.md 选择 CodeGraph / rg / fd / Read / sed；或 N/A>
Time Budget: <按 core/acceptance.md §11 的阶段预算；已知硬限制>
Deliverables: <Task Root 内的绝对交付路径、内容、唯一写入负责人及本角色证据目录>
Constraints: <适用权限；各检查的完整命令、运行目录、范围和绝对日志路径（使用 run-check.sh）；手工输出与生成输出的位置；授权读取自身 PI_PROVIDER / PI_MODEL / PI_REASONING_LEVEL，必要时 PI_SESSION_FILE>
Acceptance Criteria: <可观察、可验证的完成条件>
Decision Authority: <已确认决策 / 项目约定 / Agent 可提出建议的边界；Product / Domain Approval 负责人>
Developer Review Requirement: <REQUIRED | RECOMMENDED | NOT REQUIRED；见 core/references/developer-review.md>
Final Response: <状态、交付路径、未完成和未验证事项>
```

## 3. Workspace Baseline

Main 在 Intake 时记录 Workspace Baseline，传给所有可能读取或修改工作区的子 Agent：

- `Branch`：任务开始时的当前分支。
- `Base Commit`：任务开始时的 HEAD；仓库无 Commit 时为 `N/A`，并为可能触及的文件建立任务前快照，无法建立时暂停任务。
- `Initial Git Status`：有文件交付的工作区任务，Main 在 Intake 和最终验收时把 `git status --porcelain -uall` 原始输出保存到证据目录并引用。
- `Pre-existing Modified Paths` / `Pre-existing Untracked Paths`：任务开始前已修改或未跟踪的文件。
- `Pre-existing Paths Overlapping Scope`：与本次修改范围重叠的既有变更路径。
- `Overlap Handling`：`NONE`（无重叠）、`EXCLUDED`（已排除在修改范围外）、`USER_AUTHORIZED_WITH_SNAPSHOT`（用户授权且已建快照）或 `BLOCKED`（无法安全区分）。
- `Baseline Snapshot`：已授权重叠路径的任务前快照位置。
- `Allowed Paths`：本次允许写入的绝对路径。

`git diff <base>` 会包含任务开始前已有的工作区修改，单靠它无法区分本次变更。因此：

1. Main 默认把既有脏文件排除在 Allowed Paths 外。
2. 确需修改重叠路径时，Main 先向用户说明文件和风险并取得授权，在任何子 Agent 写入前把相关文件快照到 `workspace-baseline/`。快照只含必要文件，访问控制与源文件相同，不混入构建、发布包或提交。
3. 无法安全建立快照时，该路径标为 `BLOCKED`。

子 Agent 完整保留既有改动。Reviewer 对干净路径使用 Base Commit 比较，对授权重叠路径比较任务前快照与最终文件。无法可靠区分任务变更与既有变更时，相关 Review 标为 `INCOMPLETE`，任务不能 PASS。任务结束时，Main 在 `overview.md` 注明快照位置和处理建议，是否清理由用户决定。

## 4. 视觉实现字段

Visual Implementation 额外填写：

- `Reference`：参考截图、设计稿或参考网页。
- `Target`：目标 Route / URL 和页面范围。
- `Viewport`：宽高；必要时指定 DPR、设备类型和滚动位置。
- `States`：页面、交互、主题和数据状态；每个状态写明构造方式（真实操作 / 受控夹具或响应）、验证目标、数据写入边界和清理责任，见 `core/acceptance.md` §5。
- `Assets`：可复用的图片、字体、图标、设计 Token 和素材目录。

实际执行视觉实现的 Agent 加载 `skills/ui-impl/SKILL.md`；Handoff 分别记录加载证据和执行结果。

## 5. 任务产物目录

每个 Workflow 任务只有一个 Task Root，默认是 `<Repository Root>/.agents/workflow/tasks/<task-id>/`（位于目标项目内）。Contract 填写解析后的绝对路径。重复调用入口、阶段切换和 Session 恢复沿用该目录；独立 Workflow 使用独立目录。L0/L1 无文件交付时可不创建；L2 由 Main 创建 `overview.md`。

- 细分执行使用 `subtasks/<subtask-id>/` 保存 Contract、报告和证据，由顶层 `overview.md` 索引；多份同类报告使用不同文件。
- 每个产物只有一个写入负责人：Main 维护总览、决策和最终方案，子 Agent 写指定报告，Main 汇总时引用。写入权移交见 `core/permissions.md` §2「报告笔误修正」。
- 基线与修改后证据分文件保存，标明采集阶段、对应 Commit / 工作区状态和生成命令。执行前序脚本前检查其输出位置；脚本会写回前序证据时，改由当前执行者在本角色目录输出，前序基线保持只读。

任务产物是本地 Agent 上下文，默认不提交。Intake 检查 Task Root 是否被 Git 忽略，并在总览说明；未被忽略时建议用户加到项目本地 `.git/info/exclude`。提交前排除该目录。历史产物保留原样；长期知识提炼见 `core/acceptance.md` §9。

按任务类型创建产物，未触发的阶段无需创建：

| 任务类型 | 产物 | 必需内容 |
|---|---|---|
| 所有 L2 任务 | `overview.md` | 背景、目标/范围、Workspace Baseline 摘要、阶段状态、产物导航、关键变更、决策索引、实现理解、验证结果、Developer Review 状态、未解决事项 |
| 有已授权的重叠脏路径 | `workspace-baseline/` | 仅与任务目标重叠的任务前文件快照 |
| Research | `research.md` | 结论、事实/推断、文件/符号/行号或来源、影响、风险、待确认事项 |
| Debug（诊断） | `debug-report.md` | 症状、复现步骤、环境、日志/源码证据、假设、已排除原因、根因结论、建议修复与验证；未确认的原因标为假设 |
| 有实质决策 | `decisions.md` | 选项、依据、取舍、来源、负责人和状态 |
| Plan | `plan.md` | 目标/非目标、范围、调用链、契约、兼容性、步骤、测试、风险与回滚 |
| Implement | `handoff.md` | 实现摘要、修改文件及意图、契约/兼容性、Implementation Walkthrough、实际检查、未覆盖项、风险、Review 重点、实际模型和 Thinking |
| Visual Implementation | `visual-report.md` + `screenshots/` | 参考图、Route、Viewport、页面状态、最终截图、差异与修正、浏览器结果、限制；Handoff 引用报告 |
| Primary Review | `review.md` | Review 范围、Finding、严重级别、文件/行号、证据、需求/决策/规范依据、Agent 新增假设、修复建议和限制 |
| Secondary Review | `review-secondary.md` | 独立 Review 范围、Finding、证据和限制 |
| Reviewer Escalation | `review-escalation.md` | 争议 Finding、双方结论、定向裁决及证据 |
| Test | `test-report.md` | 实际命令、测试范围、结果、失败、未覆盖项和环境限制 |
| 复盘 | `retro.md` | 流程、模型、成本、质量、并行及交付问题和改进建议 |

## 6. 产物规则

### 通用交付规则

- 文件交付任务把完整内容写入指定文件；写入失败时说明原因。
- 以 `core/templates/` 中的模板为起点，删去不适用的章节并说明 `N/A`；标题、字段说明和正文使用 Output Language。
- 报告中的结论链接到可核验的源码、Diff、测试输出或来源。
- 每份阶段报告（Research、Handoff、Review、Test）列出实现与指定报告之外的手工写入：绝对路径、用途和权限依据，无则 None。验证命令自身的输出按 Constraints 记录。Main 在阶段交付时对照工具结果核对，越界按 `core/permissions.md` §2 处理。
- 启动核验段（§1）列出已加载的规则和需求输入。Main 在交付时核对这些输入与报告内容相符；报告与已知事实矛盾、必需输入疑似遗漏或加载可疑时，再读取对应 Session 事件核验。必需输入确实缺失时，补读后复核受影响的工作，并在报告中如实标注补读。
- 代码交付和检查报告引用对应的 Implementation Evidence。
- Visual Implementation 截图默认保存到 `screenshots/`（如 `iteration-1.png`、`final.png`）；用户提供的参考图引用其原始路径。
- 报告中的链接相对于报告所在目录；Contract 中的写入、交付和日志路径使用绝对路径。

### `overview.md`：任务总览

- 所有 L2 任务由 Main 创建和维护，模板见 `core/templates/overview.template.md`。
- 顶部「状态」是唯一的当前状态入口：当前 Main 配置、阶段、授权及来源、阻塞、Verdict、Developer Review 状态、已提交 Commit 和外部操作结果，尚未发生的写 None。Intake、阶段切换和每次续接结束时更新。
- 授权、模型切换、提交、外部操作和写入权移交记录在「执行历史」，附时间和证据；历史记录只描述过去，当前权限以顶部状态为准。
- 它是导航页和审阅摘要：用相对路径链接其他产物，只写摘要。
- 记录 Workspace Baseline 摘要、重叠路径和处理方式；有授权重叠路径时链接 `workspace-baseline/`。
- 未触发的阶段写 `N/A` 并说明原因。

### `decisions.md`：决策追踪

L2 任务涉及实质性的产品行为、交互设计、架构边界、技术选型、API / 数据结构 / 数据库契约、安全权限、兼容性、迁移、性能或失败处理决策时创建；按既有项目模式完成的局部细节无需记录。没有实质决策时，在 `overview.md` 写 `No material decisions`。

使用 `core/templates/decisions.template.md` 的紧凑条目；重大架构、迁移或有争议的决策才展开上下文与方案比较。

- `Origin` 取 `USER_APPROVED`、`PROJECT_CONVENTION` 或 `AGENT_PROPOSAL`。`USER_APPROVED` 引用 Main 中的具体问题、推荐版本和用户回答，或用户明确指定的外部批准依据；子 Agent 的转述不算用户批准。
- `Status` 取 `PROPOSED`、`CONFIRMED`、`REJECTED` 或 `DEFERRED`。
- 需要业务确认的决策记录 Product / Domain Approval 的负责人、状态和依据，与 Developer Review 分开记录。
- 需要业务权衡的决策，在依赖它的实现开始前取得用户或 Product / Domain Owner 的明确批准。
- 子 Agent 在实施中发现新的实质决策时，把问题、证据和建议报告 Main；Main 更新 `decisions.md`，完成确认后再恢复依赖它的工作。紧急且可逆的临时假设由 Main 记为 `PROPOSED` 并限制影响范围。

### `handoff.md`：实现说明

所有 L2 实现任务的 Handoff 包含 `Implementation Walkthrough`：关键变更与需求/决策的对应关系、核心调用链或数据流、关键抽象/状态/领域规则、技术取舍、扩展入口和排查入口，结合真实文件、符号和必要行号说明。模板见 `core/templates/handoff.template.md`。

实际模型和 Thinking 附元数据来源（`core/model-routing.md` §4）。

## 7. 完成状态

子 Agent 的最终状态取以下之一：

- `DONE`：约定任务完成，交付物已提供。
- `PARTIAL`：部分完成，列出剩余事项。
- `BLOCKED`：权限、依赖或信息问题导致无法继续。
- `FAILED`：执行失败，说明原因和已尝试的处理。

最终回复同时说明已完成、未完成、未验证事项、风险/阻塞、实际 Provider / Model ID、实际 Thinking 和交付路径。

这些状态是子 Agent 自报，Herdr 显示的运行状态也只用于协调；Main 依据真实交付按 `core/acceptance.md` §7 验收。
