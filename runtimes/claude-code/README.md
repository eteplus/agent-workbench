# Claude Code Adapter

Claude Code 可以担任 Main Agent，由 Claude Opus 5.5 承担规划、决策、委派和验收。L2 实现及需要独立上下文的 Research / Review / Test 仍通过 Herdr → Pi 子 Agent 执行。

## Install

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/runtimes/claude-code" \
  --skill workflow --agent claude-code --global
```

安装方式选择 **Symlink**。安装后调用：

```text
/workflow <任务目标>
```

Skill 源文件：`workflow/SKILL.md`。

## Skill Invocation

Claude Code 的 Skills 使用 `/skill-name` 显式调用。对于 `disable-model-invocation: true` 的上游 Skill，该命令必须由用户手动输入；Main 不得将 Skill Tool 自动调用视为可用路径。Core 中的逻辑 Skill 名称映射见 [`../README.md`](../README.md)。上游 `implement`、`grill-with-docs`、`retro` 设置该 frontmatter，只能由用户手动输入对应命令；手动触发后，它们可按 Claude Code 的 Skill Tool 调用各自依赖。未手动触发时，按 Core 内置流程继续。

## Main Behavior

- 当前 Claude Code 会话担任 Main；主控模型偏好为 Claude Opus 5.5，实际 Provider / Model ID 以当前会话可确认的信息为准。
- L0/L1 按 Core 分类规则由 Main 直接处理。
- L2 由 Main 规划并通过 Herdr 派发 Pi 子 Agent。
- Claude Code 自带的 Agent / Task 能力不自动替代本 Workflow 指定的 Herdr → Pi 调度链；只有用户明确要求或 Runtime 适配规则明确允许时才改变调度方式。
- Main 可由用户手动调用 `grill-with-docs`、`retro`；它们不是 Main 可自动触发的依赖。L2 Implementer 在 Pi Runtime 中运行；Main 通过 Herdr `agent prompt` 向 Pi 子 Agent 触发任意已安装 Skill 时，统一使用 `/skill:<name>`，例如 `/skill:implement <Issue / Spec URL>`、`/skill:ui-impl`。上游 `implement` 仍受 Spec / Ticket、Tracker 和 fixed point 前置条件限制；其内部 `tdd` / `code-review` 调用须单独核验，第三方 `code-review` 受 Tracker 前置条件限制。
- 子 Agent 必须自行加载 Task Contract 指定的 Skills；Main 加载的 Skill 不自动传递。
- `REQUIRED` Developer Review 必须等待开发者明确确认后才能最终 PASS。
- 不在 Adapter 中复制模型表、权限矩阵、修复轮数或验收条件。

## Capability Notes

Claude Code 的当前模型、可调用工具和 Skill 发现由当前会话及安装配置决定。Main 记录实际可确认的模型信息；Pi 的 Thinking Level 参数不直接用于控制 Claude Code。
