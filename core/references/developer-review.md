# Developer Review

L2 任务在 Intake 判定 Developer Review 要求，在 Gate 通过后、最终 Acceptance 前执行。Main 在 Intake 判定时和 Gate 之后加载本文件。

Developer Review 是开发者对审阅包中关键实现、技术取舍和维护风险的人工确认。它与 AI Review 并存，也不能绕过未解决的 P0/P1。业务规则和用户可见行为的批准属于 Product / Domain Approval，在实现前按 `core/permissions.md` §1 和 `decisions.md` 单独记录。

## 1. 触发条件

Main 为每个 L2 任务在 `overview.md` 记录 `Developer Review: REQUIRED | RECOMMENDED | NOT REQUIRED` 及判定理由。满足任一条件时为 `REQUIRED`：

- 用户可见的产品规则、业务行为或交互设计发生变化。
- 公共 API、事件、数据结构、数据库 Schema 或其他跨模块契约发生变化。
- 架构边界、核心抽象、关键依赖或跨模块设计发生实质调整。
- 涉及认证授权、安全、敏感数据、事务、一致性、并发或权限边界。
- 涉及数据迁移、破坏性变更、兼容性取舍或难以回滚的操作。
- 用户明确要求 Developer Review。

范围受控、遵循既有约定且没有实质性行为/契约决策的 L2 修改，标为 `RECOMMENDED` 或 `NOT REQUIRED`。用户只是要求「审查代码/方案」时按 Review 任务验收。纯 Research / Plan / Review / Test 默认 `NOT REQUIRED`。未批准的产品/设计决策在实施前澄清。

## 2. 审阅包

Main 整理审阅入口：

- `overview.md`：目标、变更范围、流程状态和产物导航。
- `decisions.md`（如有）：关键选项、来源、理由、取舍和确认状态。
- `handoff.md`（实施任务）：Implementation Walkthrough、关键调用链、重要抽象和扩展/排查入口。
- 关键 Diff：重要文件/符号和变更位置，附可直接打开的路径和必要行号。
- `review.md` 及补充 Review（适用时）：Finding、解决状态和 Review 限制。
- `test-report.md`（有独立测试时）：实际执行的测试、结果和未覆盖范围。
- 未解决的假设、风险、技术债和后续建议。

面向开发者的回复先给出任务摘要、重要决策、关键文件和审阅入口，让开发者从 `overview.md` 进入，按需查看源码和 Diff。

## 3. 批准与反馈

- `REQUIRED` 任务在开发者明确确认前，Verdict 为 `NEEDS DEVELOPER REVIEW`，Main 暂停最终 PASS。
- 批准只来自开发者对 Developer Review 请求的明确回答。测试通过、Reviewer PASS、子 Agent `DONE`、用户沉默、设计问答、标签选择和实施授权都不构成批准。
- 批准记录到 `overview.md`：确认者、Main 中的回答或指定的外部批准依据、审阅的 Implementation Evidence（`core/acceptance.md` §2）和结果。
- 审阅后代码、决策或验收范围发生实质变化时，原批准只覆盖旧版本；Main 更新审阅包并重新请求受影响部分的确认。
- 要求澄清：回到 Clarify，更新 `decisions.md` / `plan.md`，再执行受影响的实现和验证。
- 要求修改：Main 重新界定范围并委派原 Implementer 或合适的 Agent，重新执行受影响的 Test、Review 和 Gate；修复轮数仍按 `core/acceptance.md` §6 计算。
- `RECOMMENDED` / `NOT REQUIRED` 任务由 Main 依据已有证据验收；开发者可随时要求进入 Developer Review。

批准表示接受已呈现的实现和技术取舍；测试、Review、安全和权限的 Gate 照常生效，任何未解决的 P0/P1 仍阻止 PASS。Product / Domain Approval 仍为 PENDING 时，Verdict 为 `NEEDS USER DECISION`。

## 4. 验收条款变更

验收条款变更与 Developer Review 分开记录。原条款要求某项证据（如截图）而用户只给出口头确认时，Main 取得该证据，或明确询问并记录用户同意以口头确认替代，再更新条款和依据；缺证据的条款保持未完成。
