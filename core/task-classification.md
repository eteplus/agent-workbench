# Task Classification

任务级别由影响范围和风险决定；任务类型由实际交付目标决定。两者分别判定。

## 1. Task Levels

| 级别 | 实施前判据 | 执行方式 |
|---|---|---|
| L0 | 文案、注释、局部文档或纯文字配置，无行为变化 | Main Agent 直接处理，按需自检 |
| L1 | 预计单文件、总变更不超过 50 行、无外部接口/数据契约变化、无跨模块行为影响且风险低 | Main Agent 直接处理，运行受影响检查 |
| L2 | 预计涉及多个文件、行为变化、接口/数据契约变化，或存在实质性兼容性、安全、稳定性风险 | 代码变更委派 Implementer，执行独立 Review；按风险增加 Tester / Expert |

### L1 实施中升级

以 Git Diff 的新增行数与删除行数之和计算变更行数。实际触及第二个文件、总变更超过 50 行，或出现跨模块行为、接口/数据契约及实质风险时：

1. Main 暂停直接修改。
2. 保存当前 Diff 和工作区状态。
3. 将任务升级为 L2，并通过 Herdr 委派 Implementer。
4. 保留已完成修改与用户既有变更。

边界不清时按较高一级处理。L2 任务必须生成 `overview.md`；是否需要 Developer Review 按 `acceptance.md` 中的触发条件判定。

## 2. Task Types

- Research
- Plan / Architecture
- Implement
- Visual Implementation
- Review
- Test
- Debug
- Documentation
- Issue / Ticket
- Mixed

Visual Implementation 是 Implement 的专项类型，适用于以截图、设计稿或现有网页为参考，需要高保真 UI 还原并通过真实浏览器截图验证的任务。它沿用 L0/L1/L2 分级，不新增 Agent 角色；L0/L1 可由 Main Agent 直接处理，L2 由 Implementer 承担。Debug 阶段只负责复现、诊断和证据收集；一旦需要修复代码，按修复本身的影响和风险重新确认级别，并进入相应实现门禁。

## 3. Workflow Selection

| Task Type | Required Flow |
|---|---|
| Implementation | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement → Handoff → Test / Review → Gate → Acceptance |
| Visual Implementation | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement + Browser Verification → Handoff → Test / Review → Gate → Acceptance |
| Research | Intake → Research → Acceptance |
| Plan / Architecture | Intake → Research（按需）→ Clarify（按需）→ Plan → Acceptance |
| Review | Intake → Review → Acceptance |
| Test | Intake → Test → Acceptance |
| Debug（仅诊断） | Intake → Research（按需）→ Debug / Reproduction → Debug Report → Acceptance |
| Debug（包含修复） | Intake → Research（按需）→ Debug / Reproduction → 按修复级别执行 Implement / Handoff / Test / Review / Gate → Acceptance |
| Documentation | Intake → Research（按需）→ Implement → Test（按需）→ Acceptance |
| Issue / Ticket | Intake → Research（按需）→ Clarify（按需）→ Plan / Implement → Read-back Verification → Acceptance |
| Mixed | 根据复合目标组合上述最小必要阶段；每个子目标明确交付物和验收标准 |

本表中的 Required Flow 表示各 Task Type 的基础执行阶段。L2 的 `overview.md`、Workspace Baseline、实质性 `decisions.md`、Developer Review 和 Knowledge Update 是横向机制，按 `workflow.md`、`task-contract.md` 与 `acceptance.md` 的条件执行，不在每一行重复展开。纯 Research / Plan / Review / Test 等非实现任务，也应按本表只执行与目标直接相关的阶段；其中 `overview.md` 仍适用于所有 L2 任务。

只执行完成任务所需的阶段。纯 Research、Plan、Review 或 Test 任务委派对应 Agent，不额外创建无关阶段。

## 4. Plan Requirement

所有 L2 代码变更在实施前都必须有可执行方案。以下任一条件成立时必须生成 `plan.md`：

- 预计涉及 3 个及以上文件。
- 包含 API / 接口 / 数据结构 / 数据库契约变化。
- 涉及数据迁移、兼容性、安全或稳定性风险。
- 需要并行实施。
- 存在复杂回滚或跨模块依赖。

其他 L2 任务将方案完整写入 Task Contract 和委派消息。方案至少明确目标、范围、接口/数据契约、实施步骤、测试和风险。完整内容要求见 `task-contract.md`。
