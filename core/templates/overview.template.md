# 任务总览

> 本模板只提供结构：标题、字段说明与正文按 Output Language 生成（core/workflow.md §2）。
> 顶部「状态」是唯一的当前状态入口；其他章节写摘要或历史证据。续接后同步顶部（core/task-contract.md §6）。

## 状态
- Task ID:
- Output Language:
- Task Root（绝对路径）:
- Repository Root（绝对路径）:
- 本地保存方式: 已忽略 / 未忽略（说明；不作为提交内容）
- 类型 / 级别:
- 当前 Main Runtime / Provider / Model / Thinking:
- 当前授权 / 来源:
- 已提交变更: None / Commit + 范围
- Implementation Evidence: N/A / 版本证据路径（core/acceptance.md §2）
- 外部操作结果: None / 目标 + 已核验结果
- External Delivery: N/A / COMPLETE / PARTIAL；正文回读、附件上传/可读取/渲染状态及限制（core/permissions.md §3）
- 当前阶段:
- 下一步:
- 阻塞:
- Verdict: IN PROGRESS / PASS / BLOCKED / NEEDS USER DECISION / NEEDS DEVELOPER REVIEW
- Developer Review Requirement: REQUIRED / RECOMMENDED / NOT REQUIRED
- Developer Review Status: PENDING / APPROVED / CHANGES REQUESTED / CLARIFICATION REQUIRED / SKIPPED / N/A
- Developer Review 判定理由:

## Workspace Baseline
- Branch:
- Base Commit:
- Initial Git Status: CLEAN / DIRTY
- Pre-existing Modified Paths:
- Pre-existing Untracked Paths:
- Pre-existing Paths Overlapping Scope:
- Overlap Handling: NONE / EXCLUDED / USER_AUTHORIZED_WITH_SNAPSHOT / BLOCKED
- Baseline Snapshot: N/A / 路径
- Allowed Paths:

## 目标与范围
- 原始目标:
- 范围 / 非目标:
- 验收条件:
- 已确认决策 / 证据:

## 执行历史
只记录授权、模型切换、提交、外部结果和报告写入权移交等事件，引用具体回答或工具结果。当前授权以顶部状态为准。

| 时间 | 事件 / 范围 | 证据 |
|---|---|---|
| | | |

## 参与者
| 角色 / 阶段 | 执行时的 Runtime / 模型 | Subtask ID / Contract | 负责的产物 | 结果 |
|---|---|---|---|---|
| Main / Planner | | | `overview.md`、`decisions.md`、最终方案 | |
| Researcher | | | | |
| Implementer | | | | |
| Reviewer | | | | |
| Tester | | | | |

## 产物索引
只保留实际需要的行；子任务链接到同一 Task Root 下的 `subtasks/<id>/`。

| 产物 | 路径 | 状态 / 说明 |
|---|---|---|
| Workspace Baseline 快照 | `workspace-baseline/` | N/A / 路径（仅当重叠脏文件已获授权） |
| Research | `research.md` | N/A / 路径 |
| Debug | `debug-report.md` | N/A / 路径（仅诊断任务） |
| 决策 | `decisions.md` | 无实质决策 / 路径 |
| Plan | `plan.md` | N/A / 路径 |
| Handoff | `handoff.md` | N/A / 路径 |
| Primary Review | `review.md` | N/A / 路径 |
| Secondary Review | `review-secondary.md` | N/A / 路径 |
| Escalation | `review-escalation.md` | N/A / 路径 |
| Test | `test-report.md` | N/A / 路径 |
| 视觉报告 | `visual-report.md` | N/A / 路径 |
| 截图 | `screenshots/` | N/A / 路径 |
| 复盘 | `retro.md` | N/A / 路径 |

## 关键变更
| 区域 / 文件 | 变更 | 原因 | 需求 / 决策 |
|---|---|---|---|
| | | | |

## 决策索引
| ID | 决策 | Origin | 负责人 | Status | Product / Domain Approval | 影响 |
|---|---|---|---|---|---|---|
| | | | | | | |

## 实现理解
- 主执行流程 / 数据流:
- 关键抽象、状态或领域规则:
- 重要取舍:
- 扩展入口:
- 排查入口:

## 验证结论
- 已执行的测试:
- Review 结论:
- P0/P1 状态:
- 视觉验证:
- 已知覆盖缺口:

## Product / Domain Approval
| Decision ID | 批准负责人 | 状态 | 证据 |
|---|---|---|---|
| | | NOT_REQUIRED / PENDING / APPROVED / REJECTED | |

## Developer Review 审阅包
- 关键文件 / 符号 / Diff 位置:
- 需要关注的决策:
- 审阅问题:
- 审阅范围（Base Commit / 变更路径）:
- 批准状态 / Main 中的回答或指定的外部证据:
- 确认类型 / 呈现范围:

## 未解决风险
- 未解决的假设:
- 延后的决策:
- 已知风险 / 技术债:
- 越界写入 / 处理证据: None / 路径 + 影响 + 处理

## 知识沉淀候选
- ADR / 架构文档:
- 项目文档 / AGENTS.md:
- 可复用的 Skill / 工作流改进:
- 状态: UPDATED / PROPOSED / NOT NEEDED（说明原因）
