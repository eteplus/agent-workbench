---
description: Run the Agent Workbench workflow as Pi Main and delegate L2 subtasks via Herdr.
argument-hint: "[task goal]"
---

# Agent 工作流 — Pi Main

当前 Pi Session 是 Main。先解析并验证 `AGENT_WORKBENCH_ROOT`；变量缺失或 `$AGENT_WORKBENCH_ROOT/core/workflow.md` 不存在时报告配置问题并请求修复。

读取 `$AGENT_WORKBENCH_ROOT/core/workflow.md`，先按 §2 判断同一任务续接、目标调整或新任务，再按 §6 加载表随当前动作按需加载 `core/` 对应文件；委派子 Agent 或调用 Skill 前加载 `$AGENT_WORKBENCH_ROOT/runtimes/README.md`。同一任务内仍有效的规则无需重复读取。

## 用户目标

${@:-请根据当前 Session 中的用户请求继续当前任务；没有当前任务时确定新目标。}
