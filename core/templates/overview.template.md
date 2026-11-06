# Task Overview

> 按 Contract 的 Output Language 生成标题、字段说明与正文；本模板仅提供结构（core/workflow.md §2）。

> 顶部 Status 是唯一当前状态入口；其他章节提供摘要或历史证据，不重复当前授权和下一步。续接后同步顶部，历史记录遵循 core/task-contract.md §6。

## Status
- Task ID:
- Output Language:
- Task Root (absolute):
- Repository Root (absolute):
- Local Artifact Storage: ignored / not ignored (explain; not part of submission)
- Type / Level:
- Current Main Runtime / Provider / Model / Thinking:
- Current Authorization / Source:
- Committed Changes: None / commit + scope
- Implementation Evidence: N/A / version evidence path (core/acceptance.md §2)
- External Operation Result: None / target + verified result
- Current Stage:
- Next Step:
- Blockers:
- Verdict: IN PROGRESS / PASS / BLOCKED / NEEDS USER DECISION / NEEDS DEVELOPER REVIEW
- Developer Review Requirement: REQUIRED / RECOMMENDED / NOT REQUIRED
- Developer Review Status: PENDING / APPROVED / CHANGES REQUESTED / CLARIFICATION REQUIRED / SKIPPED / N/A
- Developer Review Rationale:

## Workspace Baseline
- Branch:
- Base Commit:
- Initial Git Status: CLEAN / DIRTY
- Pre-existing Modified Paths:
- Pre-existing Untracked Paths:
- Pre-existing Paths Overlapping Scope:
- Overlap Handling: NONE / EXCLUDED / USER_AUTHORIZED_WITH_SNAPSHOT / BLOCKED
- Baseline Snapshot: N/A / path
- Allowed Paths:

## Intent
- Original Goal:
- Scope / Non-goals:
- Acceptance Criteria:
- Confirmed Decisions / Evidence:

## Execution History
仅记录授权、模型切换、提交、外部结果和报告写入权移交等变更事件；引用具体会话回答或工具结果，历史不替代当前授权。

| Time | Event / Scope | Evidence |
|---|---|---|
| | | |

## Participants
| Role / Stage | Runtime / Model at execution | Subtask ID / Contract | Owned Deliverables | Result |
|---|---|---|---|---|
| Main / Planner | | | `overview.md`, `decisions.md`, final plan | |
| Researcher | | | | |
| Implementer | | | | |
| Reviewer | | | | |
| Tester | | | | |

## Artifact Index
仅保留实际需要的行；子任务链接到同一 Task Root 的 `subtasks/<id>/`，不创建空报告。

| Artifact | Path | Status / Notes |
|---|---|---|
| Workspace Baseline Snapshot | `workspace-baseline/` | N/A / path (only when an overlapping dirty path is explicitly authorized) |
| Research | `research.md` | N/A / path |
| Debug | `debug-report.md` | N/A / path (diagnosis tasks only) |
| Decisions | `decisions.md` | No material decisions / path |
| Plan | `plan.md` | N/A / path |
| Handoff | `handoff.md` | N/A / path |
| Primary Review | `review.md` | N/A / path |
| Secondary Review | `review-secondary.md` | N/A / path |
| Escalation | `review-escalation.md` | N/A / path |
| Test | `test-report.md` | N/A / path |
| Visual Report | `visual-report.md` | N/A / path |
| Screenshots | `screenshots/` | N/A / path |
| Retro | `retro.md` | N/A / path |

## Key Changes
| Area / File | Change | Why | Requirement / Decision |
|---|---|---|---|
| | | | |

## Decision Index
| ID | Decision | Origin | Owner | Status | Product / Domain Approval | Impact |
|---|---|---|---|---|---|---|
| | | | | | | |

## Implementation Understanding
- Main execution / data flow:
- Key abstractions, states, or domain rules:
- Important trade-offs:
- Extension entry points:
- Debugging entry points:

## Verification Summary
- Tests executed:
- AI Review result:
- P0/P1 status:
- Visual verification:
- Known coverage gaps:

## Product / Domain Approval
| Decision ID | Approval Owner | Status | Evidence |
|---|---|---|---|
| | | NOT_REQUIRED / PENDING / APPROVED / REJECTED | |

## Developer Review Package
- Key files / symbols / Diff locations:
- Decisions requiring attention:
- Review questions:
- Review scope (base commit / changed paths):
- Approval status / Main answer or designated external evidence:
- Approval kind / presented scope:

## Open Risks
- Unresolved assumptions:
- Deferred decisions:
- Known risks / technical debt:
- Out-of-scope writes / resolution evidence: None / paths + impact + disposition

## Knowledge Update Candidates
- ADR / architecture documentation:
- Project docs / AGENTS.md:
- Reusable Skill / workflow improvement:
- Status: UPDATED / PROPOSED / NOT NEEDED (explain)
