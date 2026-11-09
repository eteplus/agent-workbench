# 测试、Review、Gate 与验收

本文件定义 Handoff、测试、独立 Review、Gate 与修复、Main 验收、最终报告和阶段预算。补充 Review 细节见 `core/references/review-escalation.md`，Developer Review 见 `core/references/developer-review.md`，异常恢复见 `core/references/recovery.md`。

## 1. Handoff

L2 代码变更由 Herdr → Pi Implementer 执行。Implementer 按 Contract、`core/permissions.md` 和本文件做最小必要修改，运行受影响检查，写入指定 `handoff.md`。Skill 加载与失败处理见 `core/task-contract.md` §1；可选上游 `implement` 的前置条件见 `skills/README.md`「条件安装」。

Main 读取 Handoff，核对任务 Diff、关键实现和真实检查结果后进入独立 Review。Implementer 的自检与独立 Primary Review 分开计算。

## 2. 测试

- Main 读取项目脚本，在 Contract 中给出每项检查的完整命令、运行目录、实际范围和绝对日志路径；包脚本无法收窄范围时直接调用测试工具。
- Implementer 按这些命令执行基础检查；发现范围不符时先修正命令再执行。
- 高风险、跨模块、关键契约变更或独立验证能增加覆盖时，委派 Tester。Tester 只运行约定测试并报告问题；修改代码需要 Contract 明确授权。
- 后续改动未触及已验证的代码、测试或相关配置时，复用原结果，只检查新增改动，并注明复用理由；影响范围变化时重跑受影响检查。Main 独立验收不等于重复执行同一检查；已有同版本的真实日志与退出码时直接核验，只在证据可疑、输入变化或能增加覆盖时复跑，并记录原因。
- 测试报告记录实际命令、范围、退出码、结果、完整日志路径、未覆盖项和环境限制。先把完整输出写入本角色证据目录，再展示摘要。每次执行使用独立日志路径，保留失败与早期结果；同版本已有有效结果时不为补齐报告再次执行或覆盖日志。
- 测试场景覆盖原始验收条件，以及 `decisions.md` 中已确认且可验证的行为/契约决策；无法自动验证的设计取舍列为 Developer Review 关注项。

### 共享检查入口

检查统一使用 [run-check.sh](../scripts/run-check.sh)。Main 把示例中的日志路径和命令替换为 Contract 的准确值，并预先建立日志父目录：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/run-check.sh" /absolute/task/subtasks/implement/evidence/verify.log pnpm verify
```

脚本保存完整日志、显示尾部，并返回检查自身的退出码。

- 把它作为工具调用的最后一条命令，让工具返回值等于检查退出码；纯重定向可以保留。
- 预期失败同样返回非零退出码，在报告中标为 EXPECTED FAIL。
- Main 核对工具返回值、`check_exit` 和日志三者一致；批量检查逐项记录，任一非预期失败即整组失败。
- 长检查优先在前台或 Runtime 可轮询的任务中运行。后台检查记录 PID / Session、完整日志、完成依据和最终退出码；只有拿到最终退出码才计为通过，否则标为 NOT VERIFIED。Shell `wait` 在拥有该子进程的原上下文中使用。

### 状态与生命周期覆盖

功能涉及异步数据、订阅、缓存或可恢复状态时，实施前按原始目标列出需要验收的状态转换（如首次进入、首个数据到达、后续更新、结束、刷新恢复、切换上下文、无数据），每态说明值的来源、刷新触发和缺值语义。

实施者在修改前把原始验收逐项对应到真实入口、合法输入和可观察断言，写在现有 Handoff 启动核验段，不新增报告或 Main 握手。新增输入复用项目 typed fixture；合法性无法由类型保证时，在测试边界用既有 schema 校验一次，不用强制类型断言掩盖缺字段。同一输入的一致性要求沿用实际入口输出驱动后续消费断言；关键断言拆用例或使用测试框架的软断言，保证首个预期失败不遮蔽其它验收。

回归测试从真实数据入口经过状态层到界面断言，覆盖受影响的状态转换与旧值隔离。缺陷修复先运行最小定向失败回归，输入与断言稳定后再修复；完整项目检查在候选交付版本执行，仍遵循项目必需检查要求。原始要求中的行为缺失按缺陷处理。运行有费用或数据写入时按 `core/permissions.md` §2 取得授权；受控链路和用户实测的覆盖分别记录。

### 实现版本证据

测试、Review 与 Developer Review 绑定同一份可比较的 `Implementation Evidence`；HEAD、文件列表或增删行数相同都不足以证明实现未变。

- 执行者在本角色证据目录保存：Base Commit、检查范围内的完整二进制 Diff（`git diff --binary <base> -- <paths>`），以及参与检查的新增未跟踪文件的相对路径、状态和 SHA-256。范围包含相关源码、测试与配置。重叠脏文件按 `core/task-contract.md` §3 的任务前快照核验。
- 执行者停止写入后采集一次，再运行检查；检查结束后比较同一范围的 Diff 指纹（如 `git diff --binary <base> -- <paths> | shasum -a 256`）及参与检查的新增未跟踪输入路径、状态和内容哈希，全部一致才把命令、结果和日志与该版本关联。只有检查期间可能存在其他写入者（并行实施、用户编辑、会写源码的生成步骤）时，才在每项检查前后分别保存完整快照。各版本分文件保留，注明实现版本、采集阶段、用途（过程检查 / 最终验收）和生成命令；版本关联按内容和明确记录判断，文件名序号仅作标识。
- Main 在相关实现写入结束、输入稳定后核验最终验收证据，记录实施者停止写入的依据；已有同版本完整证据时直接引用，不在 Handoff、Review、Gate 各复制一份 Diff。
- 复用检查、续接、最终验收及确认用户提交内容时，Main 用一条命令比较当前 Diff 指纹及新增未跟踪输入的路径、状态和内容哈希与已记录版本（同一节点不重复比较），最终验收同时保存 `git status --porcelain -uall` 快照。证据相同才复用；内容变化时记录新版本，重做受影响的 Test / Review，实质变化还需重新取得受影响部分的 Developer Review 批准。版本对应关系无法确认时标为 NOT VERIFIED 并暂停 PASS。

### 验证调度

Main 单独判定验证能否并行。写共享输出（如类型生成、构建目录）或读取整个工作区的检查，在相关实施完成、输入稳定后串行执行，并由 Main 指定唯一执行者；Reviewer 需要额外运行这类检查时先交 Main 调度。不共享输出且输入稳定的检查可以并行。Contract 记录实际范围、输出位置和调度依据。

检查完成后确认后置环境仍可用（如生成配置仍指向有效服务、临时资源已按约定清理）。测试改变了生成配置时，执行者用项目既有恢复命令恢复并核验，再执行受影响检查。独立 Tester 的 Contract 写明相比已有验证新增的覆盖。

## 3. 独立 Review

所有 L2 代码变更委派 Primary Reviewer 独立 Review；Reviewer 的模型选择与跨家族约束见 `core/model-routing.md` §5。

Review 输入：

- Contract 中完整的 Workspace Baseline。
- 任务开始时干净且未与既有变更重叠的路径：`git diff <base> -- <changed paths>`，加上本次新增的未跟踪文件。
- `USER_AUTHORIZED_WITH_SNAPSHOT` 路径：`workspace-baseline/` 中的任务前快照与最终文件的比较，单独报告本次变更。
- `EXCLUDED` 路径不计为本次变更；`BLOCKED` 路径暂停实现，也不给出 Review PASS；任务前已有的未跟踪文件不计为新增。
- 原始需求和验收标准；`research.md`、`decisions.md`、`plan.md`（如有）和 `handoff.md`，包括验收与真实输入 / 断言的对应关系。
- 相关项目规范、必要测试结果，以及与当前 Diff 对应的 Implementation Evidence（§2）。

Primary Reviewer：

- 覆盖约定的完整 Diff 并报告已审范围；未覆盖完整范围时标记 `INCOMPLETE`。
- 核对实现与原始需求、已确认决策、项目约定及授权路径的一致性。
- 检查实现中未记录的产品行为、交互、架构、API 或数据契约选择，以及 Agent 新增假设是否已在 `decisions.md` 以正确来源和状态记录；发现时作为 Finding 或待确认风险报告，并引用 Decision ID。
- 对重要变更说明关键调用链、状态和数据契约是否符合已确认意图。
- 首轮 Review 一并核对新增测试输入合法性、数据来源和关键断言是否实际执行；每条 Finding 给出文件和行号、证据、对应需求/规范和可执行的修复建议。区分本次引入缺陷、当前验收缺口与 Base 既有范围外问题；后者只有阻断当前验收时才进入本次修复，证据不足时标为待确认。
- 以实际代码行为为依据评判；代码风格偏好归为 P2。
- 保持只读，结果写入 Contract 指定路径，默认 `review.md`。

### Finding 严重级别

- **P0**：发布阻断、核心功能失效，或严重的数据、安全、权限、契约问题。
- **P1**：明确缺陷、重要行为错误，或缺失测试会掩盖具体且重要的风险。
- **P2**：非阻断改进、边界建议或偏好意见，不进入自动修复循环。

统一字段：`ID | Severity | File:Line | Issue | Evidence | Suggested Fix`。涉及需求意图或决策偏差时补充 `Requirement / Decision Ref`。

## 4. 补充 Review 与定向裁决

Secondary Review 与 Reviewer Escalation 的触发条件和模型选择见 `core/model-routing.md` §5。普通、范围明确且风险可控的 L2 任务只做 Primary Review。

### Secondary Review

1. Main 把 `core/references/review-escalation.md` 和同版本 Review 输入交给 Secondary Reviewer。
2. Secondary Reviewer 在独立 Session 中对完整 Diff 盲审，完成前不接收 Primary Review 的结论。
3. `review-secondary.md` 交付后，Main 合并重复 Finding，保留实质分歧，依据源码、Diff、需求、契约和测试证据裁决。

### Reviewer Escalation

1. Main 选择模型，把 `core/references/review-escalation.md`、争议 Finding 和最小必要的版本证据交给 Escalation Reviewer。Secondary Review 不是它的前置条件。
2. Escalation Reviewer 只处理限定的高影响争议，写入 `review-escalation.md`；最终决策仍在 Main。

已触发的 Review 要么完成，要么明确报告 `BLOCKED` / `PARTIAL` 及原因。

## 5. 视觉验收

实际承担视觉实现的 Agent 必须加载 `ui-impl`（REQUIRED）。它负责视觉分析、还原和浏览器验证；通用流程与交付要求以 Contract 为准。

- Visual Handoff 引用 `visual-report.md` 和最终截图。
- Main 核对参考图与实现截图的 Viewport、Route、页面状态和滚动位置一致，或差异已披露。
- 主要视觉差异已核对，剩余差异和无法验证项已记录。
- 视觉验收以模型实际读取截图并完成比较为准；截图存在、页面运行成功或 DOM 检查通过只是前提。未完成比较时视觉状态标为 `NOT VERIFIED`，已完成的实现保留为 PARTIAL。
- 高保真或关键页面可增加独立视觉复核：复核 Agent 支持图片输入，读取参考图、最终截图、Viewport 和 `visual-report.md`，只报告可观察到的差异。
- 难以触发的状态可通过授权的组件夹具或浏览器响应替身渲染真实组件，并在报告与截图标题中标明来源。它只证明显示和交互；真实数据链路另由集成测试或用户实测验证。是否需要真实运行截图按原验收条款判定；状态构造方式和数据权限在实施前写入 Contract。

## 6. Gate 与修复

必需测试完成、Primary Review 完整、所有已触发的补充 Review 完成后进入 Gate。Main：

1. 按 §2 确认实现版本与检查状态。
2. 对照各阶段报告和工具事件中的重定向、脚本输出及额外写入；Git Diff 只覆盖 Git 跟踪范围，手工写入另行核对。漏报或越界写入在归属、影响和证据处置查明前阻止 PASS，处理见 `core/permissions.md` §2。
3. 报告中的事实笔误按 `core/permissions.md` §2「报告笔误修正」处理，不触发代码修复或整套验证。

存在未解决的 P0/P1 时定向修复：

1. 把 Finding、证据和验收条件交给原 Implementer。
2. 修复后运行针对性回归并更新 `handoff.md`；测试输入或断言变化时重建对应失败回归证据，输入未变时引用原失败证据。
3. Primary Reviewer 检查修复 Diff，确认原 Finding 已解决。
4. Finding 来自补充 Review 且修复后仍有实质争议时，由对应 Reviewer 定向复核该项。

P2 不派发修复，也不触发复审：Main 把它记入最终报告的 Unresolved / Next。Main 判断某条 P2 实际会掩盖验收条款或具体风险时，按 §3 改为 P1 并记录依据，再走上述修复流程。

最多两轮修复与复审；第二轮后仍有 P0/P1 时停止循环并标记 `BLOCKED`。修复范围扩大时，Main 重新评估级别、范围和所需确认。

Gate 通过后，需要 Developer Review 的任务按 `core/references/developer-review.md` 执行，再进入最终验收。

## 7. Main 验收

Main 依据用户目标、验收标准、实际代码、Diff、工具结果和交付物验收：

| 对象 | 验收标准 |
|---|---|
| L2 `overview.md` | 顶部状态反映当前阶段、授权、Main 配置、Commit 和外部结果；执行历史单独记录；产物链接、关键变更、决策、验证、Developer Review 与未解决事项完整 |
| Research | 指定产物完整，关键结论有位置或来源证据，手工写入核验完成；涉及消费扫描时，自检/限制、零消费与保留依据可核验，数量一致 |
| Debug（仅诊断） | `debug-report.md` 记录复现步骤、环境、证据、根因或未确认假设、已排除方向和建议验证；未确认的原因明确标为假设 |
| Plan | 方案覆盖目标、范围、契约、兼容性、步骤、测试、风险和验收 |
| Implement | 实际 Diff 符合范围；Handoff 完整，含 Implementation Walkthrough 和适用时的 Skill 加载与执行记录；检查结果真实 |
| Review | Primary Review 覆盖完整 Diff；Finding 有证据且可执行；已触发的补充 Review 完成，分歧已裁决或明确披露；`INCOMPLETE` 不放行 |
| Test | 测试命令真实执行，结果、失败、未覆盖范围和环境限制明确 |
| Visual Implementation | `visual-report.md` 和最终截图可读取；比较条件一致或差异已披露；主要差异、剩余问题和无法验证项均有记录 |
| Developer Review | 所有 `REQUIRED` 项均有开发者明确确认；未确认时 Verdict 为 `NEEDS DEVELOPER REVIEW` |
| 所有任务 | 业务行为符合预期，范围和契约符合约定，必需测试已执行，风险和用户决策已披露；回复和产物符合 Output Language；前序基线证据保持原样 |

子 Agent 自报的 `DONE` 只是状态，Main 完成本节验收后才作为完成依据。

## 8. 最终报告

最终报告字段完整、证据可追溯、表达精简。复杂任务可增加 Check 条目和必要证据：

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
- <其他实际参与角色>: <实际 Provider / Model ID / Thinking；仅参与时追加>

Usage: <各实际参与 Pi Session 的 tokens/cost；无法获取时 N/A 并说明原因>
Visual Evidence: <截图 / visual-report.md 或 N/A>
External Delivery: <N/A / COMPLETE / PARTIAL；见 core/permissions.md §3>
Developer Review Requirement: <REQUIRED / RECOMMENDED / NOT REQUIRED>
Developer Review Status: <PENDING / APPROVED / CHANGES REQUESTED / CLARIFICATION REQUIRED / SKIPPED / N/A>
Unresolved: <风险、未覆盖测试、未验证事项；没有则 None>
Next: <必要后续事项；没有则 None>
```

Runtime、模型和 Usage 来自实际元数据；汇总已有 usage 时区分缓存读取与新增输入，未知费用写 N/A 并说明获取限制。报告文本使用任务语言，以上字段名只是结构参考。

`PASS` 同时要求：所有必需验收条件满足、必需测试真实执行、Review 完整通过、没有未解决的 P0/P1、必要用户决策已完成、所有 `REQUIRED` 的 Developer Review 已获明确批准。

## 9. 知识沉淀

Acceptance 后，Main 评估是否有值得长期保留的知识：

- 稳定的架构边界、公共契约、关键领域规则和重大技术取舍 → 项目 ADR / 架构文档。
- 经验证的模块入口、调用链、运行方式和排障方法 → 项目文档或相关 `AGENTS.md`。
- 可跨项目复用的 Agent 方法 → `agent-workbench/skills/` 中的 Skill。
- 一次性实现细节和调试过程 → 留在本地 Task Root。

只在当前任务授权范围内直接更新长期文档；授权外的候选记录到 `overview.md` / `retro.md`，附推荐位置和理由。

## 10. 复盘

任务出现重复失败、模型路由错误、异常高成本、并行冲突或交付缺口时，Main 检查流程、模型与 Thinking、成本、测试覆盖、并行和交付问题，记录到 `overview.md` / `retro.md`；两轮同类返工时至少记录根因与下一次前置检查，原始验收未满足时不通过简化流程放行。可选 `retro` Skill 的语法见 `runtimes/README.md`，前置条件见 `skills/README.md`；用户交互留在 Main。修改长期规范或 Skill 需要当前任务授权。

## 11. 阶段预算

阶段预算是软检查点：初始预算到达时保存进度并汇报；仍有明确下一步且持续有效进展时，Main 可以延长，并按下表的间隔再次检查。

| 阶段 | 初始预算 | 延长检查间隔 |
|---|---:|---:|
| Research | 30 分钟 | 20 分钟 |
| Implement | 60 分钟 | 30 分钟 |
| Visual Implementation | 90 分钟 | 30 分钟 |
| Test | 30 分钟 | 20 分钟 |
| Review（所有轮次合计） | 20 分钟 | 15 分钟 |
| Debug | 45 分钟 | 30 分钟 |

Primary、Secondary 和 Escalation Review 共用 Review 预算，并按实际记录各 Reviewer 的耗时和工具状态。连续两个检查点没有可验证进展时，按 `core/references/recovery.md` 处理。
