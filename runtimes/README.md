# Runtime 适配

Runtime Adapter 将同一套 Core Workflow 接入不同的 Main Agent。Core 使用逻辑 Skill 名称；Adapter 负责将其映射为当前 Runtime 的调用形式。

## Runtime 入口矩阵

| Runtime | Main 入口 | 默认入口位置 | 调用方式 |
|---|---|---|---|
| Claude Code | Skill `workflow` | `~/.claude/skills/workflow/SKILL.md` | `/workflow <任务目标>` |
| Pi | Prompt Template `workflow` | `~/.pi/agent/prompts/workflow.md` | `/workflow <任务目标>` |

两个 Runtime 和 Herdr 启动的 Pi 子 Agent 都需要通过 `AGENT_WORKBENCH_ROOT` 定位同一份仓库。入口启动时验证该变量和 Core 文件；路径不存在时停止并报告配置问题。仓库应放在稳定路径。移动仓库后，先检查并移除指向旧路径的 Pi Prompt / Skills Symlink，再重新安装链接。通过桌面应用启动 Runtime 或 Herdr 时，确认对应进程及其启动的子进程都能读取该变量；Shell Profile 中的设置不一定自动传递给 GUI 进程或已运行的服务。

```bash
export AGENT_WORKBENCH_ROOT="$HOME/Workspace/agent-workbench"
test -n "$AGENT_WORKBENCH_ROOT"
test -f "$AGENT_WORKBENCH_ROOT/core/workflow.md"
```

## 环境准备

调用 `/workflow` 前，准备以下组件：

1. **Herdr**：安装并启动 Herdr TUI；确认 `herdr --help` 能显示当前 CLI 命令。Agent Automation 依赖可用的 Workspace / Tab / Shell Pane。
2. **Pi Coding Agent**：安装 Pi CLI，并完成至少一个可用 Provider / Model 的认证。确认 `pi --help` 和模型配置可用。
3. **Main Runtime**：选择 Claude Code 或 Pi。只有选择 Claude Code Main 时才需要安装 Claude Code 并完成登录/认证。
4. **Skills CLI**：需要安装或同步 Skills 时准备 Node.js、pnpm 和 `pnpx skills`；具体第三方 Skill 安装分流见 `skills/README.md`。
5. **环境变量**：设置 `AGENT_WORKBENCH_ROOT`，并确保 Main Runtime 与 Herdr 启动的 Pi 子 Agent 进程都能读取该变量。桌面应用启动时要单独确认进程环境。

建议安装 `herdr integration install pi`，为 Herdr 提供 Pi Session 身份和状态上报，并支持服务重启后的会话恢复。它是增强项，不是 Pane / Agent 基本调度的前置条件。

## Skill 调用映射

Core 只引用逻辑 Skill 名称，不写 Runtime 专属 Slash Command。当前调用映射：

| 逻辑 Skill | Claude Code | Pi | 调用方式 / 使用说明 |
|---|---|---|---|
| `implement` | `/implement`（Claude Code 用户显式调用） | `/skill:implement`；Herdr `agent prompt` 同样使用 `/skill:implement <Issue / Spec URL>` | `disable-model-invocation: true` 禁止模型自主调用；用户 / Orchestrator 显式命令可触发。内部 `code-review` 仍需 Tracker / fixed point；嵌套依赖单独核验 |
| `grill-with-docs` | `/grill-with-docs` | `/skill:grill-with-docs`；Herdr `agent prompt` 使用同一语法 | 用户 / Orchestrator 显式调用；内部 `grilling` / `domain-modeling` 调用仍需核验，Pi Main 默认使用 Core Clarify |
| `retro` | `/retro` | `/skill:retro`；Herdr `agent prompt` 使用同一语法 | 用户 / Orchestrator 显式调用；内部 `writing-for-agents` 调用仍需核验，Pi Main 默认使用 Core Retro |
| `tdd` | `/tdd`（可选安装） | `/skill:tdd` | Red-Green-Refactor 测试驱动实践；默认只安装到 Pi |
| `codebase-design` | `/codebase-design`（可选安装） | `/skill:codebase-design` | `tdd` 使用的接口设计 / 模块边界参考；默认随 `tdd` 安装到 Pi；需使用时可通过 Herdr 单独显式委派 |
| `code-review` | 保留 Claude Code bundled `/code-review` | `/skill:code-review`（仅条件安装） | 上游 `implement` 的自检；第三方版本默认不安装到任何 Runtime；只有 Tracker / fixed point 条件满足且明确选择试用时才按需安装到 Pi，不得替代 Core Primary Review |
| `grilling` | `/grilling` | `/skill:grilling`（需单独安装并显式委派） | `grill-with-docs` 在 Claude Code 中的访谈依赖；Pi parent 不会自动调用该依赖 |
| `domain-modeling` | `/domain-modeling` | `/skill:domain-modeling`（需单独安装并显式委派） | `grill-with-docs` 在 Claude Code 中的领域建模依赖；Pi parent 不会自动调用该依赖 |
| `writing-for-agents` | `/writing-for-agents` | `/skill:writing-for-agents`（需单独安装并显式委派） | `retro` 在 Claude Code 中的文档写作依赖；Pi parent 不会自动调用该依赖 |
| `ui-impl` | `/ui-impl` | `/skill:ui-impl` | 视觉实现专项 Skill |

Claude Code 用户显式调用使用 `/skill-name`；Pi 交互式调用和 Herdr → Pi `agent prompt` 向目标 Pi Agent 发送 Skill 命令时，统一使用 `/skill:<name>`，例如 `/skill:implement`、`/skill:grill-with-docs`、`/skill:retro`、`/skill:ui-impl`。Pi Prompt Template 仍按文件名调用，例如 `/workflow`。上游设置 `disable-model-invocation: true` 的 Skill 不能由模型自主选择或通过 Skill Tool 自动调用；由用户或 Main / Orchestrator 显式发送 `/skill:<name>` 属于命令调用，符合该限制。该规则适用于所有已安装到目标 Pi Agent 的 Skills，不局限于 `implement`。parent Skill 成功加载不代表其正文中的嵌套 Skill / Skill Tool 调用自动成功；`tdd`、`code-review`、`grilling`、`domain-modeling`、`writing-for-agents` 等依赖仍须逐项确认实际执行和报告。Pi 中的 `grill-with-docs` / `retro` 仅保证可显式加载 parent；其正文依赖的 Claude Code `Skill` Tool 嵌套调用不属于当前支持的 Pi 执行路径。Pi Main 默认使用 Core Clarify / Retro；如需单项依赖能力，由 Main 通过 Herdr 单独派发 `/skill:<name>` 并核验结果。

**Claude Code 的同名 Skill 注意事项：** Claude Code 自带 bundled `/code-review`，同时提供 `/review` 别名。安装同名的个人/项目 `code-review` Skill 会覆盖 `/code-review`，但不会覆盖 `/review`。本仓库不把 Matt Pocock 的第三方 `code-review` 安装到 Claude Code，以保留其 bundled `/code-review`。第三方版本默认不安装到任何 Runtime；只有选择试用上游 `implement` 链路、项目 Tracker 与 fixed point 前置条件满足时，才按需安装到 Pi。详见 [Claude Code 同名 Skill 优先级](https://code.claude.com/docs/en/skills#resolve-skills-that-share-a-name)。

第三方 Skill 内部若描述调用另一个 Skill，必须逐项确认当前 Runtime 的调用能力。Herdr `agent prompt` 以 `/skill:<name>` 开头可显式加载目标 Pi Agent 上已安装的 parent Skill；这不代表 parent 正文中的 Claude Code `Skill` Tool 调用会自动转换为 Pi 可执行的嵌套调用。嵌套依赖未完成验证前，使用 Core fallback 或由 Orchestrator 显式拆分为独立子任务。实际执行的子 Agent 必须自行加载 Contract 指定的 Skill，Main 已加载的 Skill不会自动继承给子 Agent。

## Herdr → Pi 调度

Herdr 的自动化分为三个层次：

- **Layout**：Workspace、Tab、Pane 的创建和组织。
- **Pane**：控制原始终端，运行命令、发送输入、读取输出和等待文本。
- **Agent**：启动和控制识别到的 Pi Agent，并观察其 `working`、`blocked`、`idle` 等状态。

关键约束：`herdr agent start` 需要一个已存在、处于 Shell Prompt 的 Pane；它本身不会创建或拆分 Pane。Main 应先创建/选择 Workspace、Tab 和 Shell Pane，再使用实际返回的 Pane ID 启动 Pi。

### 典型调度顺序

下面示例假设 Main 当前运行在一个可用的 Herdr Pane 中，并已安装可选工具 `jq`。若使用 Herdr MCP / 结构化 API，可直接读取 JSON 字段，无需安装 `jq`：

```bash
# 1. 在 Main Pane 旁边创建 Shell Pane。
split_json=$(herdr pane split --current --direction right --no-focus)
PI_PANE_ID=$(printf '%s\n' "$split_json" | jq -r '.result.pane.pane_id')
test -n "$PI_PANE_ID"

# 2. 在该 Shell Pane 中启动 Pi。
herdr agent start implementer --kind pi --pane "$PI_PANE_ID"

# 3. Main 按 core/task-contract.md 组装完整 Task Contract。
TASK_CONTRACT_PROMPT="$(cat <<'TASK_CONTRACT_EOF'
<由 Main 按 core/task-contract.md 填写的完整 Task Contract>
TASK_CONTRACT_EOF
)"

# 4. 提交任务契约并等待 Agent 状态变化。
# 仅当选择上游 implement 且 Skill / Tracker / fixed point 前置条件已满足时启用命令前缀。
USE_UPSTREAM_IMPLEMENT=0
if [[ "$USE_UPSTREAM_IMPLEMENT" == "1" ]]; then
  : "${ISSUE_OR_SPEC_URL:?Set ISSUE_OR_SPEC_URL when invoking upstream implement}"
  IMPLEMENT_PROMPT="$(printf '/skill:implement %s\n\n%s' "$ISSUE_OR_SPEC_URL" "$TASK_CONTRACT_PROMPT")"
else
  IMPLEMENT_PROMPT="$TASK_CONTRACT_PROMPT"
fi
herdr agent prompt implementer "$IMPLEMENT_PROMPT" --wait --timeout 300000

# 5. 读取执行结果；独立核验文件与 Git Diff。
herdr agent read implementer --source recent-unwrapped --lines 120
```

示例中的 Task Contract 由 Main 按 `core/task-contract.md` 动态组装并通过 Prompt 传递；`task-contract.md` 是规范模板，不代表每个任务目录必须存在同名文件。长契约也可以写入任务目录，再在 Prompt 中传入可访问的路径，并明确要求子 Agent 读取。

这是 CLI 流程示例，不是固定脚本。若 Main 不在 Herdr Pane 内，先创建 Workspace / Tab / Shell Pane；具体命令按安装版本的 CLI Help 或 MCP Schema 执行。创建命令会返回 JSON，必须从响应中读取 Pane ID，禁止猜测 ID。

模型偏好和 Thinking 由 `core/model-routing.md` 决定。若通过 `herdr agent start ... -- <Pi CLI args>` 指定 Pi 模型参数，必须先根据当前 `pi --help` 和 Provider 配置确认参数有效，并在启动后核对实际 Model / Thinking。

### 调度与恢复规则

1. 确认目标 Pane 是可用 Shell Prompt，再执行 `agent start`。
2. `agent start` 返回后，使用 `agent prompt` 传递 Task Contract；长任务使用 `--wait` 和明确 Timeout。
3. 等待结束后读取 Agent 输出，并检查其写入的产物文件、源码和 Git Diff；终端输出不能替代文件证据。
4. Agent 处于 `blocked` 时先读取并理解阻塞内容，再通过当前 UI / `agent send-keys` 处理需要人工输入的步骤。`agent prompt` 对已处于 `blocked` 的 Agent 不会提交新 Prompt。
5. `agent prompt --wait` 从非工作状态提交时，需要观察到状态进入 `working` 或 `blocked`；未观察到活动可能返回 `agent_prompt_stalled`。超时或 stalled 后先读取 Agent 当前状态和输出，再决定是否重试；超时不代表 Prompt 一定没有发送，盲目重试可能造成重复任务。
6. Herdr 状态用于运行协调，不代表交付验收。最终判断仍由 Main 完成。

本节 CLI 示例使用可选 `jq` 解析 Pane ID；使用 MCP / 其他结构化工具时，可直接读取返回字段，无需安装 `jq`。

### Pi 集成

建议安装 Pi Integration：

```bash
herdr integration install pi
herdr integration status
```

Pi Integration 为 Herdr 提供 Pi Session 身份、状态上报和重启后的会话恢复支持。它属于推荐增强项，不替代 Pane / Agent 的基本自动化能力。详细行为以 [Herdr Integrations](https://herdr.dev/tui/docs/integrations/) 为准。

## 新增 Runtime

1. 在 `runtimes/<runtime>/` 建立入口和 Adapter 文档。
2. 入口读取 `AGENT_WORKBENCH_ROOT` 并加载 `core/workflow.md`。
3. 在 Adapter 中定义 Core 逻辑 Skill 名称到该 Runtime 调用方式的映射。
4. 按阶段加载 Core 子文档和 Task Contract 要求的 Skills / References。
5. 通过当前 Runtime 可用的 Herdr 接口派发 Pi 子 Agent。
6. 不复制任务分级、模型路由、权限、Contract、Review 或 Acceptance 规则。

## 参考资料

- [Herdr Agent Automation](https://herdr.dev/tui/docs/agent-automation/)
- [Herdr Agents](https://herdr.dev/tui/docs/agents/)
- [Herdr Integrations](https://herdr.dev/tui/docs/integrations/)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Pi Prompt Templates](https://pi.dev/docs/latest/prompt-templates)
