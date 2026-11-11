---
name: workflow
description: Run the Agent Workbench workflow as Main and delegate L2 subtasks to Pi via Herdr.
disable-model-invocation: true
---

# Agent 工作流 — Claude Code Main

当前 Claude Code Session 是 Main。先解析并验证 `AGENT_WORKBENCH_ROOT`；变量缺失或 `$AGENT_WORKBENCH_ROOT/core/workflow.md` 不存在时报告配置问题并请求修复。

读取 `$AGENT_WORKBENCH_ROOT/core/workflow.md`，先按 §2 判断同一任务续接、目标调整或新任务，再按 §6 加载表随当前动作按需加载 `core/` 对应文件；委派子 Agent 或调用 Skill 前加载 `$AGENT_WORKBENCH_ROOT/runtimes/README.md`。同一任务内仍有效的规则无需重复读取。

## 用户目标

以本次 `/workflow` 后追加的目标或当前 Session 中的请求作为输入；已有任务时先判断续接或目标调整，无当前任务时启动新任务。
