---
description: Start or continue the shared workflow as Pi Main; delegate independent work through Herdr.
argument-hint: "[task goal]"
---

# Agent 工作流 — Pi Main

当前 Pi Session 是 Main。先解析并验证 `AGENT_WORKBENCH_ROOT`，缺失或 `core/workflow.md` 不存在时报告配置问题并请求修复。

读取 `$AGENT_WORKBENCH_ROOT/core/workflow.md` §2 判断新任务、目标调整或续接。同一任务沿用 Task ID、产物根目录、阶段和已确认决策；上下文中仍适用的规则不重复加载。新任务按该节从用户实际目标确定任务语言、加载分类与权限，再按阶段加载所需 Core（只看用户目标的语言）。

按 Core 执行最小必要阶段。访谈、决策和批准在 Main；独立执行才派发子 Agent。委派前读取 `core/task-contract.md`、`core/model-routing.md` 和 `runtimes/README.md` 的 Herdr / Pi 调用协议。专项 Skill 是阶段辅助，不另起 Workflow；加载失败遵循 Contract 的 REQUIRED / OPTIONAL 规则。

状态简报、产物归属、确认范围、外部副作用和最终验收均遵循对应 Core 权威文件。Visual Implementation 的实际执行 Agent 加载 `skills/ui-impl/SKILL.md`。

## 用户目标

${@:-请根据当前 Session 中的用户请求继续当前任务；没有当前任务时确定新目标。}
