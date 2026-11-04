# Test, Review, Gate & Acceptance

本文件定义实施验证、独立 Review、补充 Review 的触发点、修复门禁、最终验收、报告和阶段预算。补充 Review 的盲审和争议裁决细节见 `references/review-escalation.md`。

## 1. Implement Handoff

L2 代码变更由 Herdr → Pi Implementer 执行。Implementer 必须遵循 Task Contract、`permissions.md` 和本节定义的 Core 实现要求，按授权范围进行最小必要修改，运行与变更直接相关的基础检查，并将结果写入 `handoff.md`。若 Task Contract 指定了 Skill，Handoff 必须填写 `Skill Loading & Execution`，分别记录每个 parent 的安装状态、显式调用方式、实际加载结果，以及每个嵌套依赖的执行结果；Pi 不支持的 Claude Code Skill Tool 嵌套调用标记为 `UNSUPPORTED`，未执行的依赖不得报告为成功。上游 `implement` Skill 是可选的实现编排增强，其 frontmatter 设置 `disable-model-invocation: true`，禁止模型自行选择或通过 Skill Tool 自动触发，但允许显式命令调用。通过 Herdr `agent prompt` 向 Pi Agent 触发 Skill 时，统一使用 `/skill:<name>` 命令前缀；例如 `/skill:implement <Issue / Spec URL>` 可以显式触发已安装的 `implement` parent Skill。该方式属于 Main / Orchestrator 的显式命令委派，不属于模型自主调用。使用前确认 Skill 已安装，目标 Agent 能访问任务上下文，并满足上游调用所需的 Spec / Ticket、Tracker 和 fixed point 条件。触发 parent `implement` 只证明主 Skill 已启动；其内部 `tdd` / `code-review` 调用及各自报告仍须单独核验。条件不满足或 Skill 未成功加载时，直接按 Core Task Contract 实现。

Main 先读取 Handoff，再检查任务范围内的实际 Diff、关键实现和检查结果，然后进入独立 Review。若用户显式调用了上游 `implement`，且该项目具备其 `code-review` 所需的 Issue Tracker 配置，该 Skill 内部执行的 `code-review` 属于 Implementer 自检，可作为 Handoff 补充证据；它不能替代本文件要求的独立 Primary Review，也不得重复计为独立 Reviewer。该上游 Skill 若因缺少 Tracker 配置而提示运行 setup，Main 应停止该可选 Skill 路径并回到 Core 流程；未经用户授权不得自动运行 setup 或写入项目配置。上游 `code-review` 还要求 fixed point，并使用 `git diff <fixed-point>...HEAD` 比较已提交到 HEAD 的分支变更；它不包含 staged / unstaged 工作区修改，不能用作当前未提交 Diff 的完整 Review。当前工作区修改仍由 Core Primary Review 按 Workspace Baseline 和快照规则审查。

## 2. Test

- Implementer 执行与修改范围直接相关的基础检查，并记录真实命令与结果。
- 高风险、跨模块、关键契约变更或独立验证能增加覆盖时，委派 Tester。
- 简单变更可复用 Implementer 已真实执行的检查，避免重复运行同一套测试。
- Tester 按 Task Contract 执行约定测试；未经明确授权只报告问题、不修改实现代码。
- 测试报告必须记录实际命令、测试范围、通过/失败、未覆盖项和环境限制。
- 测试场景应覆盖原始验收条件及 `decisions.md` 中已确认且可验证的行为/契约决策；无法自动验证的设计取舍列为 Developer Review 关注项。

## 3. Primary Review

所有 L2 代码变更必须委派 Primary Reviewer 独立审查。Reviewer 的实际模型家族必须与 Implementer 的实际模型家族不同；Implementer 升级后需重新检查此约束，具体回退路由见 `model-routing.md`。

Review 输入限定为：

- Task Contract 中的完整 Workspace Baseline（Branch、Base Commit、任务前状态、既有 Modified / Untracked Paths、重叠路径、Overlap Handling、Baseline Snapshot、Allowed Paths）。
- 对任务开始时干净且未与既有变更重叠的路径，检查相对于 Base Commit 的 `git diff <base> -- <changed paths>`；同时检查本次新增的 Untracked 文件。
- 对 `USER_AUTHORIZED_WITH_SNAPSHOT` 路径，比较 `workspace-baseline/` 中的任务前快照与最终文件，并单独报告本次新增/修改内容。`git diff <base>` 会包含任务开始前已有的工作区修改，不能直接作为这些路径的任务专属 Diff。
- 对 `EXCLUDED` 路径不审查为本次实现变更；对 `BLOCKED` 路径不得继续实现或给出该路径 Review PASS。任务前已有的 Untracked 文件不得认定为本次新增文件。
- 原始需求和验收标准。
- `research.md`（如有）、`decisions.md`（如有）。
- `plan.md`（如有）、`handoff.md`。
- 相关项目规范和必要测试结果。

Reviewer 必须核对实际实现与原始需求、已确认决策及项目约定的一致性，并检查变更是否超出 Workspace Baseline 和授权路径。特别检查实现过程中是否出现未记录的产品行为、交互、架构、API 或数据契约选择；发现时作为 Finding 或待确认风险报告，并引用相关 Decision ID（如有）。

Primary Reviewer 必须：

- 覆盖约定的完整 Diff，并报告已审查范围；未覆盖完整范围时标记 `INCOMPLETE`。
- 每条 Finding 提供文件和行号、问题证据、对应需求/规范及可执行修复建议。
- 将证据不足的判断标记为待确认；区分缺陷、风险和改进建议。
- 以实际代码行为为依据，不将代码风格偏好作为缺陷。
- 检查 Agent 新增的实质性假设是否已在 `decisions.md` 记录，并具有正确的来源和确认状态。
- 对重要变更解释关键调用链、状态和数据契约是否符合已确认意图；证据不足时标记待确认。
- 只读检查，不修改实现代码；结果写入 `review.md`。

### Finding Severity

- **P0**：发布阻断、核心功能失效、严重数据、安全、权限或契约问题。
- **P1**：明确缺陷、重要行为错误，或缺失测试会掩盖具体且重要的风险。
- **P2**：非阻断改进、边界建议或偏好性意见，不触发自动修复循环。

统一字段：`ID | Severity | File:Line | Issue | Evidence | Suggested Fix`。涉及需求意图或决策偏差时，在 Finding 中补充 `Requirement / Decision Ref`，指向原始验收条件或 `decisions.md` 的 Decision ID。

## 4. Secondary Review & Reviewer Escalation

是否启动 GLM-5.3 Flash Secondary Reviewer 或 Claude Sonnet 5.5 Reviewer Escalation，完全按 `model-routing.md` 中的风险条件决定。

满足条件时：

1. 加载 `references/review-escalation.md`。
2. 将该文件路径或相关规则交给对应 Reviewer。
3. Secondary Reviewer 使用独立 Pi Session / 上下文，对完整约定 Diff 进行盲审。
4. Main 合并重复 Finding，保留实质分歧，并基于源码、Diff、需求、契约和测试证据裁决。
5. Sonnet 只处理限定的高影响争议，不重新扫描整个仓库，也不替代 Main 最终决策。

普通、范围明确且风险可控的 L2 任务只执行 Primary Review。已触发的审查必须完成，或明确报告 `BLOCKED` / `PARTIAL` 和未完成原因。

## 5. Visual Verification

实际承担视觉实现的 Agent 必须加载逻辑 Skill `ui-impl`。通过 Herdr `agent prompt` 向 Pi Implementer 触发时，使用 `/skill:ui-impl` 显式加载已安装的 Skill。通用实现流程、权限和交付要求以 Core Task Contract 为准；上游 `implement` 是用户 / Orchestrator 显式调用的可选增强，只有其 Spec / Ticket、Tracker 和 fixed point 前置条件均满足时才使用。`ui-impl` 负责视觉分析、还原方法和浏览器验证步骤。Claude Code、Pi 交互式调用和 Herdr → Pi 调用的语法由对应 Runtime 说明。

- Visual Handoff 必须引用 `visual-report.md` 和最终截图。
- Main 验收时检查参考图与实现截图的 Viewport、Route、页面状态和滚动位置。
- 确认主要视觉差异已核对，剩余差异和无法验证项已记录。
- 截图文件存在、页面运行成功或 DOM 检查通过，不能单独证明视觉验收完成。
- 视觉模型未读取截图或未完成视觉比较时，视觉状态标记 `NOT VERIFIED`。
- 高保真或关键页面可增加独立视觉复核；复核 Agent 必须支持图片输入，读取参考图、最终截图、Viewport 和 `visual-report.md`，只报告可观察到的差异，不替代代码 Review。

## 6. Gate & Repair

必需测试完成、Primary Review 完整，且所有已触发的补充审查均已完成后进入 Gate。

存在未解决 P0/P1 时执行定向修复：

1. 将 Finding、证据和验收条件交给原 Implementer。
2. 修复后运行针对性回归并更新 `handoff.md`。
3. Primary Reviewer 检查修复 Diff，确认原 Finding 已解决。
4. 原 Finding 来自补充 Review 且修复后仍存在实质争议时，由对应 Reviewer 定向复核该 Finding。

最多进行两轮修复与复审。第二轮后仍存在 P0/P1，停止自动循环并标记 `BLOCKED`。修复范围扩大时，Main 重新评估任务级别、范围和用户确认需求。

## 7. Developer Review

Developer Review 是面向开发者的人工理解与技术确认环节，用于确认开发者理解并接受审阅包中呈现的关键实现、技术取舍和维护风险。它位于适用的自动化验证、AI Review 和 Main Gate 之后，最终 Acceptance 之前。Developer Review 不替代 AI Review，也不能绕过未解决的 P0/P1。产品/领域行为的业务批准属于 Product / Domain Approval，必须按 `permissions.md` 和 `decisions.md` 在实现前单独记录。

### 7.1 触发条件

Main 必须对每个 L2 任务在 `overview.md` 中给出 `Developer Review: REQUIRED | RECOMMENDED | NOT REQUIRED` 和判定理由。满足以下任一条件时标记 `REQUIRED`：

- 用户可见的产品规则、业务行为或交互设计发生变化。
- 公共 API、事件、数据结构、数据库 Schema 或其他跨模块契约发生变化。
- 架构边界、核心抽象、关键依赖或跨模块设计发生实质调整。
- 涉及认证授权、安全、敏感数据、事务、一致性、并发或权限边界。
- 涉及数据迁移、破坏性变更、兼容性取舍或难以回滚的操作。
- Agent 提出的实质性产品/设计决策尚未得到用户确认，或原始意图存在会影响结果的重要不确定性。

普通、范围受控、遵循既有项目约定且没有实质性行为/契约决策的 L2 修改，可以标记 `RECOMMENDED` 或 `NOT REQUIRED`。Main 必须在 `overview.md` 记录依据；用户明确要求审阅时一律为 `REQUIRED`。

### 7.2 Developer Review Package

Main 负责整理可供开发者审阅的入口，至少包括：

- `overview.md`：任务目标、变更范围、流程状态和产物导航。
- `decisions.md`（如有）：关键选项、决策来源、理由、取舍和确认状态。
- `handoff.md`（实施任务）：Implementation Walkthrough、关键调用链、重要抽象和扩展/排查线索。
- 关键 Diff（代码变更任务）：重要文件/符号和变更位置；提供便于打开的路径及必要行号。
- `review.md` 及补充 Review（适用时）：Finding、解决状态和审查限制。
- `test-report.md`（执行独立测试时）：实际执行的测试、结果和未覆盖范围；基础检查结果可引用 `handoff.md`。
- 未解决假设、风险、技术债和后续建议。

Main 在面向开发者的回复中先给出任务摘要、重要决策、关键文件和审阅入口。开发者可以从 `overview.md` 进入其他上下文产物，再按需查看源码和 Diff；不要求逐行阅读全部实现才能理解关键变化。

### 7.3 Approval & Feedback

- `REQUIRED` 任务在开发者明确确认前，最终 Verdict 使用 `NEEDS DEVELOPER REVIEW`，Main 暂停最终 PASS。
- Main 不从测试通过、AI Reviewer PASS、子 Agent `DONE` 或用户沉默推断人工批准。
- 开发者可以批准、要求修改或要求澄清。批准记录到 `overview.md`，包含确认者/确认来源、审阅的基准 Commit / 变更范围和确认结果；对话中明确批准即可作为确认依据。
- Developer Review 完成后，如果代码、决策或验收范围发生实质变化，原批准仅对旧审阅范围有效；Main 必须更新审阅包并重新请求受影响部分的确认。
- 要求澄清时回到 Clarify，更新 `decisions.md` / `plan.md`，再执行受影响的实现和验证。
- 要求修改时由 Main 重新界定范围并委派原 Implementer 或适当 Agent；重新执行受影响的 Test、Review 和 Gate。原有 P0/P1 自动修复轮数仍按本文件 §6 执行。
- `RECOMMENDED` / `NOT REQUIRED` 任务由 Main 按已有证据完成验收；开发者随时可以要求进入人工审阅。

开发者批准表示接受已呈现的实现和技术取舍，不改变测试、Review、安全和权限门禁。它不能补做或替代 `decisions.md` 中要求的 Product / Domain Approval。若业务批准仍为 PENDING，Verdict 应为 `NEEDS USER DECISION`，而不是 `NEEDS DEVELOPER REVIEW`。任何未解决 P0/P1 仍然阻止 PASS。

## 8. Main Agent Acceptance

Main 依据用户目标、验收标准、实际代码、Diff、工具结果和交付物验收：

| Task Type | Acceptance Criteria |
|---|---|
| L2 Task Overview | `overview.md` 存在，产物链接和状态准确，关键变更、决策、验证、Developer Review 与未解决事项完整 |
| Research | 指定产物存在且完整，关键结论具有文件位置、符号、行号或来源链接 |
| Debug（仅诊断） | `debug-report.md` 记录可复现步骤、环境、证据、根因或未确认假设、已排除方向和建议验证；不把猜测报告为根因 |
| Plan | 方案覆盖目标、范围、契约、兼容性、步骤、测试、风险和验收 |
| Implement | 实际 Diff 符合任务范围；Handoff 完整，包含 Implementation Walkthrough 和适用时的 Skill Loading & Execution 记录；检查结果真实 |
| Review | Primary Review 覆盖完整约定 Diff；Finding 有证据且可行动；触发的补充审查已完成，分歧已裁决或明确披露；`INCOMPLETE` 不放行 |
| Test | 测试命令真实执行，结果、失败、未覆盖范围和环境限制明确 |
| Visual Implementation | `visual-report.md` 和最终截图存在且可读取；参考图与实现图的 Viewport、Route、状态和滚动位置一致，或差异已披露；主要视觉差异、剩余问题及无法验证项均有记录 |
| Developer Review | 所有 `REQUIRED` 项均有明确开发者确认；未确认时 Verdict 为 `NEEDS DEVELOPER REVIEW` |
| All tasks | 业务行为符合预期，修改范围和接口/数据契约符合约定，必需测试已执行，风险及用户决策已披露 |

子 Agent 的 `DONE` 只有在 Main 完成上述验收后才能作为任务完成依据。

## 9. Final Report

最终报告以字段完整、证据可追溯为准，保持表达精简；不设置固定行数上限。复杂任务可增加 Check 条目或必要证据，不得为满足行数目标而省略 Runtime、实际模型、Developer Review 状态、未解决风险或后续事项：

```text
Verdict: PASS / BLOCKED / NEEDS USER DECISION / NEEDS DEVELOPER REVIEW

- Check: <验收条件> — <结果与证据>
- Check: <验收条件> — <结果与证据>

Runtime:
- Main: <Claude Code | Pi>

Models:
- Planner: <实际 Provider / Model ID / Thinking>
- Implementer: <实际 Provider / Model ID / Thinking 或 N/A>
- Primary Reviewer: <实际 Provider / Model ID / Thinking 或 N/A>
- Secondary Reviewer: <实际 Provider / Model ID / Thinking / 触发原因或 None>
- Escalation: <实际 Provider / Model ID / Thinking / 裁决原因或 None>

Usage: <Pi session tokens/cost 或 N/A>
Visual Evidence: <最终截图 / visual-report.md 路径或 N/A>
Developer Review Requirement: <REQUIRED / RECOMMENDED / NOT REQUIRED>
Developer Review Status: <PENDING / APPROVED / CHANGES REQUESTED / CLARIFICATION REQUIRED / SKIPPED / N/A>
Unresolved: <风险、未覆盖测试、未验证事项；没有则 None>
Next: <必要后续事项；没有则 None>
```

`PASS` 必须同时满足：所有必需验收条件满足、必需测试真实执行、Review 完整通过、没有未解决 P0/P1、必要用户决策已完成，且所有 `REQUIRED` Developer Review 已获得明确批准。

## 10. Knowledge Update

完成 Acceptance 后，Main 评估本次任务是否产生值得长期保留的知识：

- 稳定的架构边界、公共契约、关键领域规则和重大技术取舍，适合沉淀为项目 ADR / Architecture Docs。
- 经验证的模块入口、调用链、运行方式和排障方法，适合更新项目文档或相关 `AGENTS.md`。
- 可跨项目复用的 Agent 执行方法，适合沉淀为 `agent-workbench/skills/` 中的 Skill。
- 一次性实现细节和短期调试过程保留在任务目录，不强行提升为长期规范。

长期文档更新必须遵守当前任务授权范围和项目文档约定；需要扩大修改范围时先取得用户授权。未获授权或暂不适合沉淀时，将候选项记录在 `overview.md` / `retro.md`，并说明原因。不要把所有任务报告机械复制到项目知识库。

## 11. Retro

任务出现重复失败、模型路由错误、异常高成本、并行冲突或交付缺口时，Main 按本节定义的 Core Retro 范围检查流程有效性、模型与 Thinking 选择、上下文/图片/Token 成本、测试覆盖、并行和交付问题。上游 `retro` 设置 `disable-model-invocation: true`，不能由模型自主调用；Claude Code Main 由用户显式输入 `/retro`，Herdr → Pi 子 Agent 则可通过 `agent prompt` 前缀 `/skill:retro` 显式加载已安装的 parent Skill。上游正文引用的 `writing-for-agents` 等嵌套 Skill / 工具仍须单独确认可用；Pi Main 未显式调用时继续执行 Core Retro 流程，并记录到 `overview.md` / `retro.md`。长期规范或 Skill 的修改须获得用户授权。

## 12. Stage Budgets

阶段预算采用软检查点。初始预算到达时保存进度并汇报；它是首次检查点，不是强制取消时间。仍有明确下一步且持续取得有效进展时，Main 可延长预算，并按下表检查。

| Stage | Initial Budget | Extension Checkpoint |
|---|---:|---:|
| Research | 30 minutes | 20 minutes |
| Implement | 60 minutes | 30 minutes |
| Visual Implementation | 90 minutes | 30 minutes |
| Test | 30 minutes | 20 minutes |
| Review (all rounds combined) | 20 minutes | 15 minutes |
| Debug | 45 minutes | 30 minutes |

Primary、Secondary 和 Escalation Review 共用 Review 阶段预算；启动补充 Reviewer 不重置预算。按实际情况记录各 Reviewer 的耗时和工具状态。

## 13. Recovery Rules

- **No Progress**：连续两个检查点没有可验证进展时暂停，分析阻塞并考虑缩小范围、补充信息、调整工具或升级模型。
- **Hard Timeout**：Provider、Herdr、Pi、MCP、Shell 等运行时硬超时由对应运行环境控制；在 Task Contract 记录已知限制。
- **Long-running Commands**：构建、测试、安装、服务启动和浏览器等待优先使用可轮询进程/Session。工具等待超时后先检查原进程状态和输出，再决定继续等待或重试。
- **Partial Execution**：暂停或硬超时后检查工作区、Diff、进程/Session、产物和工具结果，明确已执行、未执行和未验证事项；从现有状态恢复。
- **Tool Error**：工具调用最多重试一次；重试前确认操作是否已执行。长任务仍运行时优先轮询原 Session。
- **Model Error**：检查 Provider、Model 和参数映射，使用已配置 Fallback，并记录实际结果。
- **External Write**：按 `permissions.md` 授权和回读规则处理；非幂等操作超时后先查询当前状态。
- **Session Cleanup**：任务完成或明确暂停后，按运行环境能力关闭不再需要的 Session / pane；保留仍需继续的会话。
