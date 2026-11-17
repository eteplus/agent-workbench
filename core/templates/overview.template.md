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
- 批准依据与版本: <用户原话或会话引用 + 批准时的代码树指纹；未批准填 N/A>
- External Delivery: <N/A | COMPLETE | PARTIAL>
- Reviewed Tree: <`gate.sh tree` 输出；由 Main 在每次 Review / 复审完成后写入>
- Fast Lane Tree: <N/A | `gate.sh tree` 输出（仅走过快速通道时）>
- Project Memory: <SKIP（默认） | UPDATED | PROPOSE> — <一句话说明>

## 目标与基线
- 原始目标与范围:
- Base Commit: <任务开始时 git rev-parse HEAD 的完整输出，不用短提交号>
- 初始工作区状态: <CLEAN / DIRTY；列出既有修改及重叠文件处理说明>
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
- 验收对应证据: <逐项区分真实观察 / 受控验证 / 尚未验证，附证据路径>
- 已通过检查与日志: <命令、所查版本、时间、退出码及预期/实际范围；复用旧日志时说明未受影响的原因>
- Review 结论: <本轮发现与累计未解决项分别列出，保留 Finding ID>
- 视觉验证（适用时）:
- 未解决事项 / 残余风险: <逐项记录后续处理 / 接受风险 / 不处理、理由和已确认负责人；未确定写待确认>
- 流程例外（发生时）: <如 Main 接管生产修复，说明原因、范围和独立复核安排>

## Models & Usage
- Main: <Runtime / Model / Thinking>（<tokens / cost>）
- Subagents: <各角色实际 Model 与汇总 cost；未知注明原因>
