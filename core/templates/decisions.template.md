# 决策记录

> 本模板只提供结构：自然语言内容按 Output Language 生成（core/workflow.md §2）。只记录实质性选择，默认使用紧凑条目。

## 决策登记

### D-001: <决策标题>

- 问题 / 选项: <问题；可行选项及关键差别>
- 决定 / 理由 / 取舍: <决定、理由与代价>
- 影响: <受影响的行为、契约、兼容性或维护边界>
- 负责人 / Origin: <实际负责人> / USER_APPROVED | PROJECT_CONVENTION | AGENT_PROPOSAL
- Status: PROPOSED | CONFIRMED | REJECTED | DEFERRED
- Product / Domain Approval: NOT_REQUIRED | PENDING | APPROVED | REJECTED
- 批准: <确认者、确认类型/问题 ID/范围；不适用时 N/A>
- 证据: <Main 中的具体问题、推荐版本与回答，或指定的外部批准依据；相关需求、项目约定和源码/调研入口>
- 后续: <待确认、验证、文档更新或迁移事项；无则 None>

## 详细决策（按条件）

只有重大架构、迁移或有实质争议的决定，在对应条目后追加：

- 背景: <当前系统、原始目标与约束>
- 方案比较: <各方案的收益、代价、风险与证据；排除原因>
- 兼容性 / 回滚: <兼容性、迁移顺序和回滚>
- 验证: <如何证明决定满足目标；未验证的假设>

责任、来源、状态和批准证据只保留在紧凑条目中。PROPOSED 表示尚未批准；Developer Review 与 Product / Domain Approval 分开记录。

## 延后与未决决策

| ID | 未决问题 | 负责人 | 下一步 |
|---|---|---|---|
| | | | |
