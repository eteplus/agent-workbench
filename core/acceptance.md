# Test, Review, Gate & Acceptance

本文件定义实施验证、独立 Review、补充 Review 的触发点、修复门禁、最终验收、报告和阶段预算。补充 Review 的盲审和争议裁决细节见 `references/review-escalation.md`。

## 1. Implement Handoff

L2 代码变更由 Herdr → Pi Implementer 执行。Implementer 按 Task Contract、`permissions.md` 和本节规则进行最小必要修改、运行受影响检查，并写入指定 Handoff。Core 是默认实现路径；可选上游 `implement` 的前置条件见 `skills/README.md`，调用方式见 `runtimes/README.md`。

指定 Skill 时，Handoff 的 `Skill Loading & Execution` 分别记录安装状态、加载证据和必要依赖的实际执行结果；未执行不得报告成功。REQUIRED / OPTIONAL 失败处理以 `task-contract.md` §1 为准，REQUIRED 不得静默 fallback。

Main 先读取 Handoff，再检查任务范围内的实际 Diff、关键实现和检查结果，然后进入独立 Review。若用户显式调用了上游 `implement`，且该项目具备其 `code-review` 所需的 Issue Tracker 配置，该 Skill 内部执行的 `code-review` 属于 Implementer 自检，可作为 Handoff 补充证据；它不能替代本文件要求的独立 Primary Review，也不得重复计为独立 Reviewer。该上游 Skill 若因缺少 Tracker 配置而提示运行 setup，Main 按 Contract 的 REQUIRED / OPTIONAL 规则处理；未经用户授权不得自动运行 setup 或写入项目配置。上游 `code-review` 的完整前置条件和 Diff 限制见 `skills/README.md`；它不覆盖未提交工作区修改，不能用作当前未提交 Diff 的完整 Review。当前工作区修改仍由 Core Primary Review 按 Workspace Baseline 和快照规则审查。

## 2. Test

- Implementer 执行与修改范围直接相关的基础检查，并记录真实命令与结果。定向运行前读取项目脚本，确认追加参数确实缩小测试范围；已有宽范围过滤时使用测试工具的直接调用方式。
- 高风险、跨模块、关键契约变更或独立验证能增加覆盖时，委派 Tester。
- 按影响范围复用已真实执行的验证：后续改动未触及已验证代码、测试或相关配置时，保留原命令、覆盖范围和结果，只检查新增改动。影响范围改变时重跑受影响检查；注明复用理由和新增检查，不因报告或文档笔误重跑整套验证。
- Tester 按 Task Contract 执行约定测试；未经明确授权只报告问题、不修改实现代码。
- 测试报告必须记录实际命令、测试范围、退出码、通过/失败、完整日志路径、未覆盖项和环境限制。先将完整输出写入本角色授权证据目录，再展示摘要；工具调用必须返回原检查退出码，不能用摘要命令的成功代替检查成功。

单个检查可使用以下 Bash 调用；替换绝对日志路径与检查命令，日志父目录须已在本角色授权范围内建立。摘要在包装内部完成，包装作为最终执行命令；外层不得追加 `| tail`、`|| true` 或后续成功命令覆盖失败退出码。重定向可用，但须保留退出码和完整日志。循环执行多项检查时逐项记录退出码，并以任一检查失败作为整组失败：

```bash
bash -c '
  log=$1; shift
  "$@" >"$log" 2>&1
  result=$?
  tail -n 40 "$log"
  printf "check_exit=%s\n" "$result"
  exit "$result"
' _ /absolute/task/subtasks/implement/evidence/verify.log pnpm verify
```

- 长检查优先使用前台或 Runtime 可轮询任务。后台检查记录 PID / Session 标识、完整日志路径、等待完成依据与最终退出码；启动成功、进程消失或日志摘要不等于检查通过。Shell `wait` 在拥有该子进程的原执行上下文使用；跨工具调用时依靠 Runtime 完成结果或原执行者持久保存的退出码。无最终退出码标记 NOT VERIFIED，不计通过；超时后先观察原任务，恢复规则见 §13。
- 测试场景应覆盖原始验收条件及 `decisions.md` 中已确认且可验证的行为/契约决策；无法自动验证的设计取舍列为 Developer Review 关注项。

### 实现版本证据

代码实现的测试、Review 与 Developer Review 使用可比较的 `Implementation Evidence`，不能以 HEAD、文件列表或增删行数相同证明实现未变：

- 执行者在本角色授权证据目录保存 Base Commit、实际检查范围内相对该基准的完整二进制 Diff（`git diff --binary <base> -- <paths>`），以及参与检查的新增未跟踪文件的相对路径、存在/删除状态和内容 SHA-256；范围包含相关源码、测试与配置，生成输出和报告不作为实现输入。重叠脏文件的变更归属仍按 `task-contract.md` §3 的任务前快照核验。
- 每项检查开始前采集证据，结束后比较同一范围，确认执行期间输入未变，再将真实命令、结果、完整日志与该版本关联。Review 报告引用所审查版本；人工审阅包和批准记录引用同一版本。各版本分文件保留，后续采集不覆盖旧证据，并注明对应实现版本、采集时间/阶段、用途（过程检查 / 最终验收）与生成命令；各角色采集序号不等于实现版本，报告按内容及明确关联核对，不从文件名推断。
- 工作中采集的证据可用于过程检查。Main 的最终验收证据在相关实现写入结束、输入稳定后采集，并记录实施者停止相关实现写入的依据；working 中的报告存在不证明写入结束，仅报告排版仍在进行不妨碍已停止写入的实现核验。
- Main 在复用检查、续接、最终 Acceptance 及确认用户提交内容时，比较当前完整 Diff 和未跟踪输入清单；最终验收同时保存并引用工作区状态快照（`task-contract.md` §3）。证据相同才复用；内容变化后记录新版本，重做受影响 Test / Review，实质变化还需重新获得受影响的 Developer Review 批准。无法确认版本对应关系时标记 NOT VERIFIED 并暂停 PASS。

### 验证调度

Main 单独判定验证是否可并行，不从代码文件互不相交推断验证独立。会写共享输出（如类型生成、构建目录）或读取整个工作区的检查，等相关实施完成、输入稳定后串行执行；互不共享输出且输入稳定的检查可并行。Contract 记录实际检查范围、输出位置和调度依据，不增加锁服务或独立验证框架。

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
- 相关项目规范和必要测试结果，以及与当前 Diff 对应的 Implementation Evidence（见 §2）。

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

是否启动 Secondary Reviewer 或 Reviewer Escalation，按 `model-routing.md` 中的风险条件和模型路由决定。

### Secondary Review

仅在 `model-routing.md` 的 Secondary Review 条件触发时执行：

1. Main 将 `references/review-escalation.md` 及同版本的审阅输入传给 Secondary Reviewer。
2. Secondary Reviewer 使用独立 Pi Session / 上下文，对完整约定 Diff 进行盲审；完成前不接收 Primary Review 的 Findings 或结论。
3. 交付 `review-secondary.md` 后，Main 合并重复 Finding，保留实质分歧，并基于源码、Diff、需求、契约和测试证据裁决。

### Reviewer Escalation

仅在 `model-routing.md` 的 Escalation 条件触发时执行，不以 Secondary Review 完成为固定前置条件：

1. Main 按该文件选择实际模型及跨家族回退路径，将 `references/review-escalation.md`、争议 Finding 和最小必要版本证据传给 Escalation Reviewer。
2. Escalation Reviewer 仅处理限定的高影响争议，写入 `review-escalation.md`，不重新扫描整个仓库，也不替代 Main 最终决策。
3. Secondary Reviewer 不可用时，Main 按模型路由记录跳过原因并直接进入允许的定向裁决；没有可用独立 Reviewer 时由 Main 基于已有证据裁决并记录限制。仍无法确认的 P0/P1 保持 BLOCKED。

普通、范围明确且风险可控的 L2 任务只执行 Primary Review。已触发的审查必须完成，或明确报告 `BLOCKED` / `PARTIAL` 和未完成原因。

## 5. Visual Verification

实际承担视觉实现的 Agent 必须加载逻辑 Skill `ui-impl`，其为 REQUIRED 能力。它负责视觉分析、还原方法和浏览器验证；通用流程与交付要求以 Core Task Contract 为准，调用方式见 Runtime Adapter。

- Visual Handoff 必须引用 `visual-report.md` 和最终截图。
- Main 验收时检查参考图与实现截图的 Viewport、Route、页面状态和滚动位置。
- 确认主要视觉差异已核对，剩余差异和无法验证项已记录。
- 截图文件存在、页面运行成功或 DOM 检查通过，不能单独证明视觉验收完成。
- 视觉模型未读取截图或未完成视觉比较时，视觉状态标记 `NOT VERIFIED`，不放行视觉验收；必要能力缺失时暂停依赖该能力的工作并报告 Main。已完成的独立实现可保留为 PARTIAL，不把它当视觉交付 DONE。
- 高保真或关键页面可增加独立视觉复核；复核 Agent 必须支持图片输入，读取参考图、最终截图、Viewport 和 `visual-report.md`，只报告可观察到的差异，不替代代码 Review。

## 6. Gate & Repair

必需测试完成、Primary Review 完整，且所有已触发的补充审查均已完成后进入 Gate。Main 按 §2 确认测试、Review 与当前实现版本一致，同时核对各阶段（含 Research）报告披露的额外写入与已知工具写入；未解决的越界写入阻止 PASS，处理以 `permissions.md` §2 为准。事实笔误按该文件 Report Corrections 处理，不触发代码修复或整套验证；实质性判断仍由对应角色复核。

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
- 开发者可以批准、要求修改或要求澄清。批准记录到 `overview.md`，包含确认者、Main 会话回答或明确指定的外部批准依据、审阅的基准 Commit / 变更范围和确认结果。请求必须明确是 Developer Review；设计问答、标签选择和实施授权不代替该批准，确认范围遵循 `permissions.md`。
- 批准绑定审阅包的 Implementation Evidence（代码任务，见 §2），不是只绑定 Base Commit 或文件范围。Developer Review 完成后，如果代码、决策或验收范围发生实质变化，原批准仅对旧审阅范围有效；Main 必须更新审阅包并重新请求受影响部分的确认。
- 要求澄清时回到 Clarify，更新 `decisions.md` / `plan.md`，再执行受影响的实现和验证。
- 要求修改时由 Main 重新界定范围并委派原 Implementer 或适当 Agent；重新执行受影响的 Test、Review 和 Gate。原有 P0/P1 自动修复轮数仍按本文件 §6 执行。
- `RECOMMENDED` / `NOT REQUIRED` 任务由 Main 按已有证据完成验收；开发者随时可以要求进入人工审阅。

开发者批准表示接受已呈现的实现和技术取舍，不改变测试、Review、安全和权限门禁。它不能补做或替代 `decisions.md` 中要求的 Product / Domain Approval。若业务批准仍为 PENDING，Verdict 应为 `NEEDS USER DECISION`，而不是 `NEEDS DEVELOPER REVIEW`。任何未解决 P0/P1 仍然阻止 PASS。

## 8. Main Agent Acceptance

Main 依据用户目标、验收标准、实际代码、Diff、工具结果和交付物验收：

| Task Type | Acceptance Criteria |
|---|---|
| L2 Task Overview | `overview.md` 顶部反映当前阶段、授权、Main 配置、Commit 和外部结果；历史事件单独记录，产物链接、关键变更、决策、验证、Developer Review 与未解决事项完整 |
| Research | 指定产物存在且完整，关键结论有位置或来源证据，手工写入核验完成；涉及消费扫描时，自检/限制、零消费与保留依据可核验，数量一致 |
| Debug（仅诊断） | `debug-report.md` 记录可复现步骤、环境、证据、根因或未确认假设、已排除方向和建议验证；不把猜测报告为根因 |
| Plan | 方案覆盖目标、范围、契约、兼容性、步骤、测试、风险和验收 |
| Implement | 实际 Diff 符合任务范围；Handoff 完整，包含 Implementation Walkthrough 和适用时的 Skill Loading & Execution 记录；检查结果真实 |
| Review | Primary Review 覆盖完整约定 Diff；Finding 有证据且可行动；触发的补充审查已完成，分歧已裁决或明确披露；`INCOMPLETE` 不放行 |
| Test | 测试命令真实执行，结果、失败、未覆盖范围和环境限制明确 |
| Visual Implementation | `visual-report.md` 和最终截图存在且可读取；参考图与实现图的 Viewport、Route、状态和滚动位置一致，或差异已披露；主要视觉差异、剩余问题及无法验证项均有记录 |
| Developer Review | 所有 `REQUIRED` 项均有明确开发者确认；未确认时 Verdict 为 `NEEDS DEVELOPER REVIEW` |
| All tasks | 业务行为符合预期，修改范围和接口/数据契约符合约定，必需测试已执行，风险及用户决策已披露；回复和生成产物符合 Output Language（见 workflow.md §2），前序基线证据未被后续结果覆盖 |

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
- <其他实际参与角色，如 Tester / Researcher / Expert>: <实际 Provider / Model ID / Thinking；仅参与时追加>

Usage: <各实际参与 Pi Session 的可用 tokens/cost；无法获取时 N/A 并说明原因>
Visual Evidence: <最终截图 / visual-report.md 路径或 N/A>
Developer Review Requirement: <REQUIRED / RECOMMENDED / NOT REQUIRED>
Developer Review Status: <PENDING / APPROVED / CHANGES REQUESTED / CLARIFICATION REQUIRED / SKIPPED / N/A>
Unresolved: <风险、未覆盖测试、未验证事项；没有则 None>
Next: <必要后续事项；没有则 None>
```

Runtime、模型和 Usage 从实际元数据生成；会话已有 usage 数据时汇总可用字段，并区分缓存读取与新增输入，不从 token 数推断未知费用。最终文本遵循 `workflow.md` §2 的任务语言规则，以上字段名仅为结构参考。

`PASS` 必须同时满足：所有必需验收条件满足、必需测试真实执行、Review 完整通过、没有未解决 P0/P1、必要用户决策已完成，且所有 `REQUIRED` Developer Review 已获得明确批准。

## 10. Knowledge Update

完成 Acceptance 后，Main 评估本次任务是否产生值得长期保留的知识：

- 稳定的架构边界、公共契约、关键领域规则和重大技术取舍，适合沉淀为项目 ADR / Architecture Docs。
- 经验证的模块入口、调用链、运行方式和排障方法，适合更新项目文档或相关 `AGENTS.md`。
- 可跨项目复用的 Agent 执行方法，适合沉淀为 `agent-workbench/skills/` 中的 Skill。
- 一次性实现细节和短期调试过程留在本地任务目录，默认不提交；不机械复制 Handoff、调研和检查输出到项目文档。
- 完成时指出值得沉淀的结论、推荐位置和理由。只有当前任务明确授权的长期文档更新才直接执行；授权外仅记录候选，不扩大写入范围。

长期文档更新必须遵守当前任务授权范围和项目文档约定；需要扩大修改范围时先取得用户授权。未获授权或暂不适合沉淀时，将候选项记录在 `overview.md` / `retro.md`，并说明原因。不要把所有任务报告机械复制到项目知识库。

## 11. Retro

任务出现重复失败、模型路由错误、异常高成本、并行冲突或交付缺口时，Main 按 Core Retro 检查流程、模型与 Thinking、成本、测试覆盖、并行和交付问题，记录到 `overview.md` / `retro.md`。可选 `retro` Skill 的语法见 `runtimes/README.md`，前置条件与依赖见 `skills/README.md`；用户交互仍留在 Main。长期规范或 Skill 修改遵循当前任务授权。

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
- **Tool Error**：工具调用最多重试一次；重试前确认操作是否已执行。长任务仍运行时继续观察原 Session。Agent Prompt 的 timeout / stalled 只表示等待或活动观测失败，不表示未投递；先读结构化状态和约定产物，矛盾或缺失时定向查对应 Session。核对本轮委派输入、产物更新及对应执行证据；既有同 Task / Subtask ID 的 DONE 报告不能单独证明本轮完成。无法判断投递结果时标记 `NOT VERIFIED` 并暂停重发，不把旧 turn 的完成当成本次任务完成。
- **Model Error**：检查 Provider、Model 和参数映射，使用已配置 Fallback，并记录实际结果。Provider 错误 / 429 后的 idle 不等于交付完成；保留已完成证据，从缺失交付处恢复，不重复已成功的检查。必要报告缺失时不能通过 Gate。
- **External Write**：按 `permissions.md` 授权和回读规则处理；非幂等操作超时后先查询当前状态。
- **Session Cleanup**：任务完成或明确暂停后，仅关闭本任务创建且不再需要的 Session / pane；保留仍需继续的会话和本地证据，不清理用户或其他任务的会话。
