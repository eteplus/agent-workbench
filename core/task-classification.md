# 任务分级

任务级别由影响范围和风险决定，任务类型由实际交付目标决定，两者分别判定。

## 1. 任务级别

| 级别 | 实施前判据 | 执行方式 |
|---|---|---|
| L0 | 仅文字修改，无执行行为、接口或数据语义变化；或答案可由单一已知来源确定的只读查询 | Main 直接处理，核对文字或来源 |
| L1 | 非 L0；预计单文件、总变更不超过 50 行，可含局部低风险行为修复；无公共接口/数据契约变化、跨模块影响或实质风险 | Main 直接处理，运行受影响检查 |
| L2 | 非 L0/L1；代码预计涉及多文件，或有公共契约、跨模块行为、兼容性、安全、稳定性等实质风险 | 代码实现委派 Implementer 并独立 Review；其他任务按类型选择执行者和验收 |

先判断风险与契约，再按上表选择唯一级别。文字修改按内容影响分级，与文件数无关；改变执行方式的 Agent 规则、脚本配置或公共文档契约按实际影响分级。纯 Research / Plan / Review / Test 按调查范围、决策影响和验证风险分级：简单只读查询由 Main 完成，需要独立上下文或跨模块证据时按 L2 委派。边界不清时取较高一级。

### L1 实施中升级

变更行数按 Git Diff 的新增与删除行数之和计算。实际触及第二个文件、总变更超过 50 行，或出现跨模块行为、接口/数据契约及实质风险时：

1. Main 暂停直接修改。
2. 保存当前 Diff 和工作区状态。
3. 升级为 L2，通过 Herdr 委派 Implementer。
4. 保留已完成的修改与用户既有变更。

## 2. 任务类型

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

Visual Implementation 是 Implement 的专项类型，适用于以截图、设计稿或现有网页为参考、需要高保真还原并用真实浏览器截图验证的 UI 任务。它沿用 L0/L1/L2 分级，L2 由 Implementer 承担。

Debug 只负责复现、诊断和收集证据；需要修复代码时，按修复本身的影响重新分级并进入对应的实施路径。

## 3. 流程选择

| 任务类型 | 基础流程 |
|---|---|
| Implement | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement → Handoff → Test / Review → Gate → Acceptance |
| Visual Implementation | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement + 浏览器验证 → Handoff → Test / Review → Gate → Acceptance |
| Research | Intake → Research → Acceptance |
| Plan / Architecture | Intake → Research（按需）→ Clarify（按需）→ Plan → Acceptance |
| Review | Intake → Review → Acceptance |
| Test | Intake → Test → Acceptance |
| Debug（仅诊断） | Intake → Research（按需）→ 复现与诊断 → `debug-report.md` → Acceptance |
| Debug（含修复） | Intake → Research（按需）→ 复现与诊断 → 按修复级别执行 Implement / Handoff / Test / Review / Gate → Acceptance |
| Documentation | Intake → Research（按需）→ Implement → Test（按需）→ Acceptance |
| Issue / Ticket | Intake → Research（按需）→ Clarify（按需）→ Plan / 外部写入 → 回读核验 → Acceptance |
| Mixed | 组合上述最小必要阶段；每个子目标明确交付物和验收标准 |

只执行完成任务所需的阶段。`overview.md`、Workspace Baseline、`decisions.md`、Developer Review 和知识沉淀是横向机制，按 `core/task-contract.md` 与 `core/acceptance.md` 的条件触发。L2 的 Research / Review / Test 委派对应 Agent，Plan 的决策由 Main 负责；非代码任务只配置与其交付相关的角色和验收。

Issue / Ticket 流程用于工作项的创建、更新等外部操作，授权与回读见 `core/permissions.md` §3。以 Issue 为需求来源的代码实施按 Implement 或 Mixed 执行。

## 4. 方案要求

L2 代码变更在实施前需要可执行方案，至少明确目标、范围、接口/数据契约、实施步骤、测试和风险。以下任一条件成立时写入 `plan.md`：

- 预计涉及 3 个及以上文件。
- 包含 API、接口、数据结构或数据库契约变化。
- 涉及数据迁移、兼容性、安全或稳定性风险。
- 需要并行实施。
- 存在复杂回滚或跨模块依赖。

其他 L2 任务把方案完整写入 Contract。`plan.md` 的内容要求见 `core/task-contract.md` §5。
