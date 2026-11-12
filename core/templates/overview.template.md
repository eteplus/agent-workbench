# 任务总览

> 标题与正文按 Output Language 生成（core/workflow.md §2）。仅保留实际需要的项，保持紧凑导航。

## 状态
- Task ID:
- Output Language:
- Task Root（绝对路径）:
- Repository Root（绝对路径）:
- 类型 / 级别:
- Main 配置: <Runtime / Model / Thinking>
- 当前授权与模型限制: <用户已确认的实施/外部授权、禁用模型或费用上限>
- 当前阶段 / Verdict: <IN PROGRESS | PASS | BLOCKED | NEEDS USER DECISION | NEEDS DEVELOPER REVIEW>
- Developer Review: <REQUIRED | RECOMMENDED | NOT REQUIRED> — <PENDING | APPROVED | CHANGES REQUESTED | N/A>
- External Delivery: <N/A | COMPLETE | PARTIAL>
- Reviewed Tree: <`gate.sh tree` 输出；由 Main 在每次 Review / 复审完成后写入>
- Fast Lane Tree: <N/A | `gate.sh tree` 输出（仅走过快速通道时）>
- Project Memory: <SKIP（默认） | UPDATED | PROPOSE> — <一句话说明>

## 目标与基线
- 原始目标与范围:
- Base Commit / 初始工作区状态: <Commit + CLEAN / DIRTY（重叠脏文件处理说明）>
- Allowed / Excluded Paths:

## 参与者与产物导航
| 角色 | 模型 / Thinking | Subtask / Session | 产物路径 | 状态 |
|---|---|---|---|---|
| Main | | Main | `overview.md`、`decisions.md`、`plan.md` | |
| Researcher（按需） | | | `subtasks/research/research.md` | |
| Implementer | | | `subtasks/implement/handoff.md` | |
| Reviewer | | | `subtasks/review/review.md` | |

## 决策索引
无实质决策时写 `No material decisions`。

| ID | 决策摘要 | Origin | Status | Product / Domain Approval |
|---|---|---|---|---|
| | | USER_APPROVED / PROJECT_CONVENTION / AGENT_PROPOSAL | CONFIRMED / PROPOSED | APPROVED / NOT_REQUIRED |

## 验证与审阅摘要
- 核心变更与调用链摘要:
- 已通过检查与日志:
- Review 结论（P0/P1/P2 状态）:
- 视觉验证（适用时）:
- 未解决事项 / 残余风险:

## Models & Usage
- Main: <Runtime / Model / Thinking>（<tokens / cost>）
- Subagents: <各角色实际 Model 与汇总 cost；未知注明原因>
