# Pi Adapter

Pi 可以担任 Main Agent，Main Model 可选择 Claude Opus 5.5 或 GPT-6.1 Sol。Main 负责规划、决策、委派、Gate 和最终验收，并通过 Herdr 启动独立 Pi 子 Agent。

## Install

本仓库提供 Pi Prompt Template：`workflow.md`。建立全局 Symlink：

```bash
cd "$AGENT_WORKBENCH_ROOT"
./scripts/install-runtime-links.sh
```

默认安装到 `~/.pi/agent/prompts/workflow.md`。活动 Session 执行 `/reload` 后调用：

```text
/workflow <任务目标>
```

## Skill Invocation

Pi 使用 `/skill:<name>` 显式加载已安装的 Skill。通过 Herdr `agent prompt` 向目标 Pi Agent 发送 Skill 调用时，也统一使用相同语法；例如：

```text
/skill:implement <Issue / Spec URL>

<完整 Task Contract、项目约定、Workspace Baseline、允许范围和验收标准>
```

该规则适用于所有已安装到目标 Pi Agent 的 Skills，包括 `implement`、`grill-with-docs`、`retro`、`tdd`、`code-review`、`grilling`、`domain-modeling`、`writing-for-agents`、`ui-impl` 及其他个人 Skills。`disable-model-invocation: true` 禁止模型自主选择或通过 Skill Tool 自动调用；用户或 Main / Orchestrator 通过 `/skill:<name>` 显式发送命令，属于允许的命令调用。Skill 未安装到目标 Agent 时，命令无法加载该 Skill。

显式加载 parent Skill 与执行它的内部依赖是两个层次。parent 正文若使用 Claude Code `Skill` Tool 调用 `tdd`、`code-review`、`grilling`、`domain-modeling` 或 `writing-for-agents` 等子 Skill，必须单独确认 Pi 当前环境是否支持该调用方式，并通过实际执行结果和 Handoff 证据核验。不要仅凭 parent 已加载就认定内部依赖已执行。

## Herdr → Pi Skill Dispatch

Main 通过 Herdr 委派时，将 `/skill:<name>` 放在 `agent prompt` 消息开头，再附 Task Contract 和必要上下文。示例：

```text
/skill:ui-impl

<Task Contract、参考截图、目标 Route、Viewport、状态、素材、Workspace Baseline 和验收标准>
```

如果使用上游 `implement`，还必须满足其 Spec / Ticket、Tracker 和 fixed point 前置条件：

```text
/skill:implement <Issue / Spec URL>

<完整 Task Contract、项目约定、Workspace Baseline、允许范围和验收标准>
```

`implement` parent 触发成功不代表内部 `tdd` / `code-review` 调用均已成功。`code-review` 仍要求项目 Tracker 配置与 fixed point，且不能替代 Core Primary Review。前置条件不满足时，按 Core Task Contract 实现。

## Main Behavior

- 当前 Pi Session 担任 Main；主控模型以当前 Session 实际模型为准。
- L0/L1 按 Core 规则由 Main 直接处理。
- L2 通过 Herdr 启动独立 Pi 子 Agent。
- 子 Agent 的 Provider、Model ID 和 Thinking 按 `core/model-routing.md` 解析；不得假设子 Agent 继承 Main 当前模型或档位。
- Pi Main 默认使用 Core 内置 Clarify / Retro 流程；已安装的 `grill-with-docs` / `retro` 可由用户显式输入 `/skill:<name>` 加载。若由 Herdr 委派给 Pi 子 Agent，则使用相同的 `/skill:<name>` 前缀。其正文中的 Claude Code `Skill` Tool 嵌套依赖仍须单独验证。
- Pi Implementer 默认以 Core Task Contract 为任务边界。Herdr `agent prompt` 对所有已安装 Skills 使用 `/skill:<name>` 显式触发；上游 `implement` 只有在 Spec / Ticket、Tracker 与 fixed point 条件满足时才使用。内部 `tdd` / `code-review` 调用仍需逐项确认；`code-review` 不替代独立 Primary Review。
- 子 Agent 必须自行加载 Task Contract 指定的 Skills；Main 加载的 Skill 不自动传递。
- 同一 Runtime 内多个 Pi Session 的上下文和权限按 Task Contract 隔离。

## Pi-specific Notes

- Prompt Template 只提供入口和参数，不承载重复的核心流程规则。
- Pi 的模型选择、Thinking 参数、MCP 工具和 Herdr 调用按当前配置与实际 Schema 执行。
- `/reload` 让活动 Session 重新发现新增或修改的 Prompt Template / Skill。


## 上游 Parent Skill 的嵌套依赖边界

通过 Herdr `agent prompt` 使用 `/skill:<name>` 仅保证目标 Pi Agent 显式加载对应 parent Skill。对于 `grill-with-docs` / `retro`，上游正文依赖 Claude Code `Skill` Tool 调用 `grilling`、`domain-modeling`、`writing-for-agents`；当前工作流不承诺这些嵌套调用在 Pi 中自动执行。Pi Main 默认使用 Core Clarify / Retro。需要单项依赖能力时，由 Main 通过 Herdr 单独派发对应 `/skill:<name>`，并在 Handoff 中核验实际执行结果；否则按 Core fallback 继续。
