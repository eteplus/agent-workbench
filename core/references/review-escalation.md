# 盲审与定向裁决

`core/model-routing.md` §5 触发 Secondary Review 或 Reviewer Escalation 时，Main 把本文件或其必要章节交给实际 Reviewer。普通 Primary Review 无需加载。

## 1. Reviewer 角色

- Primary Reviewer：第一轮独立 Review。
- Secondary Reviewer：满足风险条件时，在独立上下文中补充缺陷覆盖。
- Reviewer Escalation：只处理前两轮仍存在的 P0/P1 实质争议或高影响不确定性。

所有 Reviewer 遵守 `core/permissions.md` §1 的只读边界、`core/acceptance.md` §3 的 Finding 严重级别和证据要求，以及 `core/model-routing.md` §5 的跨家族约束。

## 2. 盲审

Secondary Reviewer 的第一轮采用盲审，减少前序 Finding 对判断的锚定：

1. 使用独立的 Pi Session。
2. 接收与 Primary Reviewer 相同的输入：原始需求、验收标准、`research.md` / `decisions.md`（如有）、基准 Diff、Plan / Handoff、相关项目规范、必要测试结果和 Implementation Evidence（`core/acceptance.md` §2）。
3. 在第一轮完成前，只接收上述输入；Primary Review 的 Finding、结论和推理摘要留到合并阶段。
4. 独立检查完整的约定 Diff，写入 `review-secondary.md`。
5. 报告完成后，Main 合并两轮结果。

两轮 Review 都以当前工作区代码和 Diff 为依据，核对实现是否符合原始需求、已确认决策和项目约定；发现未记录的实质决策时，标注其影响和确认状态。

## 3. 补充 Review 范围

Secondary Reviewer 聚焦高风险边界和可能遗漏的缺陷：

- 权限、认证、授权和敏感数据访问。
- 数据迁移、事务、一致性、并发和幂等性。
- API / 数据结构 / 事件契约与兼容性。
- 跨模块调用链、异常路径和状态边界。
- 测试覆盖缺口对应的具体高影响行为。

使用与 Primary Review 相同的 Diff 基线和验收条件，可独立查阅必要的源码和测试；范围限于任务变更及其直接依赖。

## 4. Finding 合并与分歧

Main 合并报告时：

1. 按文件、行号、根因、触发条件和影响合并重复 Finding。
2. 保留不同模型之间的实质分歧，分别记录支持证据。
3. 区分已证实的缺陷、待确认的风险和改进建议。
4. 对照当前源码、实际 Diff、需求、契约和测试结果判断 Finding 是否成立；模型数量和多数意见不作为依据。

Secondary Review 未覆盖完整 Diff 时标记 `INCOMPLETE`，记录已覆盖与剩余范围。

## 5. 定向裁决

Escalation 的输入限定为：

- 争议 Finding 及其文件、行号和复现/触发条件。
- 原始需求、验收标准、相关接口/数据契约，以及适用的 `decisions.md` 记录。
- 最小必要的源码与 Diff，以及对应的 Implementation Evidence。
- 已执行的 Primary / Secondary Review 的实际模型、独立结论和证据；未执行的 Review 及原因。
- 相关测试结果和已确认事实。

Escalation Reviewer 对每项争议给出结论、证据、影响、置信度限制和建议的验证方式。它只做定向裁决，范围限于争议项；最终决策由 Main 作出。没有可用的独立 Reviewer 时，按 `core/model-routing.md` §5 由 Main 直接裁决。

## 6. 修复与复审

修复流程和两轮上限见 `core/acceptance.md` §6。来自 Secondary Review / Escalation 的 Finding 在修复后仍有实质争议时，由对应 Reviewer 定向复核该项。

## 7. 报告格式

所有 Reviewer 使用 `core/acceptance.md` §3 的 Finding 字段。Secondary Review 写入 `review-secondary.md`，Escalation 写入 `review-escalation.md`。报告同时说明 Review 范围、未覆盖范围、实际模型信息和工具限制。
