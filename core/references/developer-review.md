# Developer Review

L2 任务在 Intake 按 `core/task-classification.md` §1 判定 `Developer Review: REQUIRED | RECOMMENDED | NOT REQUIRED`。
在技术 Gate 放行后、最终 Acceptance 前，由开发者对关键实现、技术取舍和维护风险进行人工把关。

## 1. 审阅包

Main 向开发者呈现紧凑的审阅摘要，引导从总览按需逐层查阅详情：

- **变更摘要与关键决策**：核心改动、与上级需求文档的对应关系及关键取舍（关联 `decisions.md`）。
- **关键文件与导航**：核心新增/修改文件路径（含数据库迁移、公共契约与 ADR 更新），以及 `handoff.md`、`overview.md` 入口。
- **验证与残余风险**：已通过的检查、关键截图（视觉任务）、保留的 P2 项与未覆盖边界。

## 2. 批准与反馈

- `REQUIRED` 任务在获得开发者明确批准前，Verdict 必须停在 `NEEDS DEVELOPER REVIEW`。此时需保留子 Agent Pane，严禁提前调用 `cleanup-agents.sh` 或直接报 `PASS`（`cleanup-agents.sh --task-root` 会检查 `overview.md` 中的 `APPROVED`）。测试全绿或 AI Reviewer 通过均不能代替开发者批准。
- 在 `overview.md` 的「批准依据与版本」保留用户原话或会话引用，以及当时的 `Reviewed Tree` / `Fast Lane Tree`。后续修改超出该次批准范围时需重新请用户确认，不能把旧批准沿用到新行为。
- 技术检查、人工批准与 `External Delivery` 分开记录；用户只要求本地改动时，外部交付填 `N/A`，不得擅自提交或发布。
- **无生产逻辑风险微调**：符合 `core/acceptance.md` §5 **收尾快速通道**条件时，直接按该通道原地修改、验证并汇报确认。
- **实质变更请求**：触及生产逻辑、组件结构或接口契约时，按 `core/acceptance.md` §5 的定向修复流程复用 Implementer 与 Reviewer 增量修改并复核，再更新审阅摘要请开发者确认。

## 3. 验收条款变更

验收条款变更与 Developer Review 批准分开确认。原验收条款要求某项客观证据（如特定运行状态截图或集成检查）而因环境限制尚未取得时，开发者对审阅包的口头批准不自动替代该证据：Main 须补齐该证据，或明确向开发者说明缺口并记录其同意调整验收条款后，方可给出最终 `PASS`。
