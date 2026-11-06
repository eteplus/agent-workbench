# Review Escalation Reference

仅当 `core/model-routing.md` 的条件触发 Secondary Review 或 Reviewer Escalation 时加载。Main Agent 将本文件路径或必要规则传递给实际 Reviewer。普通 L2 Primary Review 不需要加载本文件。

## 1. Review Roles

- Primary Reviewer：按 `core/model-routing.md` 默认路由，完成第一轮独立 Review。
- Secondary Reviewer：满足风险条件时，以独立上下文补充缺陷覆盖。
- Reviewer Escalation：仅处理前两轮仍存在的 P0/P1 实质争议或高影响不确定性。

每个 Reviewer 均须遵循 `core/permissions.md` 与 `core/acceptance.md` 中的只读边界、Finding 严重级别和证据要求。

## 2. Blind Review

Secondary Reviewer 执行第一轮审查时采用盲审（Blind Review）：

1. 使用独立 Pi Session / 上下文。
2. 接收与 Primary Reviewer 相同的原始需求、验收标准、`research.md` / `decisions.md`（如有）、基准 Diff、Plan / Handoff、相关项目规范、必要测试结果及 Implementation Evidence（格式见 `core/acceptance.md` §2）。
3. 第一轮独立审查完成前，不提供 Primary Reviewer 的 Findings、结论或推理摘要。
4. 独立检查完整的约定 Diff，并写入 `review-secondary.md`。
5. 报告完成后，Main Agent 才合并两轮结果。

盲审用于降低前序 Finding 对第二轮判断的锚定影响。两个 Reviewer 的结论均以当前工作区代码和 Diff 证据为依据，并核对实现是否遵循原始需求、已确认决策和项目约定。发现实质性未记录决策时，明确标注其影响及确认状态。

## 3. Secondary Review Scope

Secondary Reviewer 聚焦高风险边界和可能遗漏的缺陷，包括但不限于：
- 权限、认证、授权和敏感数据访问。
- 数据迁移、事务、一致性、并发和幂等性。
- API / 数据结构 / 事件契约与兼容性。
- 跨模块调用链、异常路径和状态边界。
- 测试覆盖缺口对应的具体高影响行为。

使用与 Primary Review 相同的 Diff 基线和验收条件；可独立查阅必要源码和测试。审查范围仍限定于任务变更及其直接依赖，不扩展为无目标的全仓库扫描。

## 4. Finding Merge and Disagreement

Main Agent 合并报告时：

1. 按文件、行号、根因、触发条件和影响合并重复 Finding。
2. 保留不同模型之间的实质分歧，并分别记录支持证据。
3. 区分已证实缺陷、待确认风险和改进建议。
4. 不以模型数量或多数票决定 Finding 是否成立。
5. 对照当前源码、实际 Diff、需求、契约和测试结果作出判断。

Secondary Review 未覆盖完整 Diff 时标记 `INCOMPLETE`，记录已覆盖与剩余范围；任何已触发的审查轮次均须完成，或明确报告 `BLOCKED` / `PARTIAL` 和未完成原因。

## 5. Targeted Reviewer Escalation

只有 `core/model-routing.md` 定义的高影响争议条件成立时，才启动定向 Reviewer Escalation；默认模型、跨家族回退和参与者去重均按该文件选择。所有 Reviewer 的实际模型家族必须与 Implementer 不同，不得为了保留默认模型而违反该约束。

输入限定为：
- 争议 Finding 及其文件、行号和复现/触发条件。
- 原始需求、验收标准、相关接口/数据契约，以及适用的 `decisions.md` 记录。
- 涉及的最小必要源码与 Diff，以及对应的 Implementation Evidence（见 `core/acceptance.md` §2）。
- 已执行的 Primary / Secondary Reviewer 的实际模型、独立结论及证据；记录未执行的审查及原因。
- 相关测试结果和已确认事实。

要求 Escalation Reviewer 对每项争议给出：结论、证据、影响、置信限制和建议验证方式。它只执行定向裁决，不重新扫描整个仓库，也不替代 Main Agent 最终决策。

首选模型不可用时，按 `core/model-routing.md` 的跨家族回退与参与者去重规则处理。没有可用的独立 Reviewer 时，由 Main 基于原始需求、源码、Diff、测试及双方证据直接裁决并记录限制。仍无法形成有证据的结论时，未解决的 P0/P1 保持 `BLOCKED`。

## 6. Repair and Re-review

- P0/P1 Finding 进入 `core/acceptance.md` §6 Gate & Repair。
- 修复由原 Implementer 定向完成，并执行针对性回归。
- Primary Reviewer 检查修复 Diff。
- 只有来自 Secondary Review / Escalation 的 Finding 在修复后仍有实质争议时，才由对应 Reviewer 定向复核该项。
- 每个任务最多两轮修复与复审；达到上限仍有 P0/P1 时标记 `BLOCKED`。

## 7. Report Format

所有 Reviewer 使用 `core/acceptance.md` 规定的 Finding 字段：

`ID | Severity | File:Line | Issue | Evidence | Suggested Fix`；涉及需求意图或决策偏差时补充 `Requirement / Decision Ref`，指向验收条件或 `decisions.md` 的 Decision ID。

Secondary Review 写入 `review-secondary.md`；Escalation 定向裁决写入 `review-escalation.md`。报告还应声明审查范围、未覆盖范围、模型实际信息和工具限制。
