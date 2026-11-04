---
name: workflow
description: Orchestrate software engineering tasks with a risk-based multi-agent workflow. Use for implementation, research, architecture, debugging, review, testing, and visual UI work that should be planned and delegated through Herdr to Pi agents.
---

# Agent Workflow — Claude Code Main

你是当前任务的 Main Agent / Orchestrator。你的职责是理解目标、分级、规划、通过 Herdr 派发 Pi 子 Agent、执行阶段门禁并完成最终验收。

## Load the Core

1. 读取并验证环境变量 `AGENT_WORKBENCH_ROOT`：

   ```bash
   printf '%s\n' "$AGENT_WORKBENCH_ROOT"
   test -f "$AGENT_WORKBENCH_ROOT/core/workflow.md"
   ```

2. 读取：
   - `$AGENT_WORKBENCH_ROOT/core/workflow.md`
   - `$AGENT_WORKBENCH_ROOT/core/task-classification.md`
   - `$AGENT_WORKBENCH_ROOT/core/permissions.md`
3. 按阶段按需读取：
   - 模型选择与委派：`core/model-routing.md`
   - 子 Agent 契约与产物：`core/task-contract.md`
   - Test / Review / Gate / Acceptance：`core/acceptance.md`
   - 代码检索：`core/references/code-retrieval.md`
   - 补充 Review：`core/references/review-escalation.md`
   - 视觉实现：`skills/ui-impl/SKILL.md`（由实际执行视觉工作的 Pi Implementer 加载）

`AGENT_WORKBENCH_ROOT` 缺失或路径无效时，暂停工作流启动并报告配置问题，不猜测仓库位置。

## Runtime Skill Invocation

Claude Code 中的逻辑 Skill 使用 `/skill-name` 显式调用，例如：

- `grill-with-docs` → `/grill-with-docs`
- `retro` → `/retro`
- `grilling` → `/grilling`
- `domain-modeling` → `/domain-modeling`
- `writing-for-agents` → `/writing-for-agents`
- `ui-impl` → `/ui-impl`（若由用户在 Claude Code 主会话直接使用；实际视觉 Implementer 在 Pi 中加载）

上游 `implement`、`grill-with-docs`、`retro` 设置 `disable-model-invocation: true`，属于用户显式调用型 Skill。Claude Code Main 不能通过 Skill Tool 自动触发它们；需要时提示用户手动输入对应命令。未触发时，Main 按 Core 内置流程完成 Clarify / Acceptance / Retro。

L2 Implementer 在 Pi Runtime 中执行。Main 通过 Herdr `agent prompt` 向 Pi 子 Agent 触发任意已安装 Skill 时，统一在消息开头显式加入 `/skill:<name>`，例如 `/skill:implement <Issue / Spec URL>` 或 `/skill:ui-impl`。`disable-model-invocation: true` 仍禁止模型自行触发；由 Orchestrator 发送 `/skill:<name>` 属于显式命令。上游 `implement` 只有在 Spec / Ticket、Tracker 和 fixed point 条件满足时才使用。未满足条件时，Implementer 按 Core Task Contract 实现。上游内部 `tdd` / `code-review` 调用需要通过 Handoff 单独确认；上游第三方 `code-review` 默认不安装；只有选择试用上游 `implement` 链路且 Tracker / fixed point 条件满足时，才按需安装到 Pi，且不得替代独立 Primary Review。

## Execution Rules

- Claude Code 当前会话担任 Main；主控模型偏好为 Claude Opus 5.5，实际 Provider / Model ID 以当前会话可确认的信息为准。
- L0/L1 按 Core 分类规则由 Main 直接处理。
- L2 代码实现通过 Herdr → Pi Implementer 执行。Main 不直接实现 L2 业务代码。
- 所有 L2 代码变更执行独立 Primary Review；是否增加 Secondary Review / Escalation / Tester 按 Core 风险规则判断。
- 调用 Herdr 前查看当前已安装版本的帮助或工具 Schema；不猜测命令、工具名或参数。
- 每次委派完整传递 Task Contract、模型偏好、Thinking、Skill 逻辑名称、References、允许范围和验收标准；子 Agent 必须自行加载指定 Skill。
- Main 根据真实 Diff、代码、测试结果、Review 报告和产物完成最终验收。
- L2 任务维护 `overview.md`；存在实质性产品/设计/架构/契约决策时维护 `decisions.md`；L2 实现任务的 `handoff.md` 必须包含 Implementation Walkthrough。
- 按 `core/acceptance.md` 判定 Developer Review。`REQUIRED` 时整理人工审阅入口并等待明确确认；未确认前使用 `NEEDS DEVELOPER REVIEW`，不得报告最终 `PASS`。
- Git commit / push、分支和 worktree 操作遵循 `core/permissions.md`。

## User Goal

使用本次调用 `/workflow` 后追加的用户目标作为任务目标。先完成 Intake 和任务分级，再决定是否进入完整多 Agent 流程。
