# Agent Workbench

面向个人开发环境的多 Runtime Agent 工作流仓库。支持 **Claude Code 或 Pi 担任 Main**，通过 **Herdr → Pi Agent** 委派需要独立上下文的子任务。

> **项目状态**：本工作流仍在持续完善，来自维护者个人的 Agent 开发实践，主要适配当前维护者的工具链和工作习惯。内容仅供参考与学习，请结合自身项目和风险偏好按需调整。

## 架构

```text
Claude Code ─┐
             ├── Main /workflow (Intake / Clarify / Plan / Fast-Path)
Pi ──────────┘         │
                       ▼
                 Herdr Automation (Pane 复用 + 自动回收)
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Research     Implement   Review / Test
      (按需调研)  (TDD + 视觉)  (跨模型家族审查)
          └────────────┼────────────┘
                       ▼
          Main Gate / Developer Review / Cleanup
```

- **Core**：任务分级、收尾快速通道、模型路由、权限、自包含 Contract、Git 原生证据、跨家族 Review 与验收的唯一规则来源；术语表见 [`core/README.md`](core/README.md#术语)。
- **Runtimes**：Claude Code Skill 与 Pi Prompt Template，共用 `/workflow` 启动 / 续接入口。
- **Herdr → Pi**：Main 管理并复用子 Agent Pane，等待进展并在任务完成时一键回收。
- **Skills**：维护个人专项 Skill（如 `ui-impl`），并通过 Skills CLI 同步到 Agent Runtime。

## 环境与依赖

| 类别 | 依赖 | 必要性 / 用途 |
|---|---|---|
| Main Runtime | Claude Code **或** Pi | 二选一，承担 Main / Planner |
| Subagent Runtime | Pi Coding Agent | 必需；执行 L2 子任务（按需 Research、Implement、独立 Review / Test） |
| Orchestration | Herdr | 必需；管理 Pane、复用和控制 Pi 子 Agent |
| Model Access | Main 与 Pi 可用的模型凭据 | 必需；跨家族路由见 `core/model-routing.md` |
| Skill Manager | Node.js / pnpm / `pnpx skills` | 安装和同步 Skills 时需要；见 `skills/README.md` |
| Engineering Skills | `mattpocock/skills` 指定 Skills | 可选辅助：Pi 可装 `tdd` / `codebase-design`，Main 可按需使用 `grilling` / `domain-modeling` / `retro` 等；详见 `skills/README.md` |
| Visual Tooling | `ui-impl`、真实浏览器工具、视觉模型 | 仅 `Visual Implementation` 任务需要 |
| Code Retrieval | `@colbymchenry/codegraph` | 可选；未安装时直接使用 `rg` / `fd` / Read |

## 快速开始

### 1. 设置仓库路径

将仓库放在固定位置，例如 `~/Workspace/agent-workbench`，并在 Shell Profile 中设置：

```bash
export AGENT_WORKBENCH_ROOT="$HOME/Workspace/agent-workbench"
```

重新打开终端或执行 `source ~/.zshrc`，确保 Main Runtime 与 Herdr 启动的进程均可读取该变量。

### 2. 安装入口与本仓库 Skill

```bash
cd "$AGENT_WORKBENCH_ROOT"
./scripts/install-runtime-links.sh

# Claude Code 作为 Main 时安装入口 Skill（选择 Symlink）
pnpx skills add "$AGENT_WORKBENCH_ROOT/runtimes/claude-code" \
  --skill workflow --agent claude-code --global

# 安装视觉实现 Skill（选择 Symlink）
pnpx skills add "$AGENT_WORKBENCH_ROOT/skills" \
  --skill ui-impl --agent claude-code --agent pi --global
```

Pi 活动 Session 执行 `/reload`。第三方辅助 Skills 的按需安装说明见 [`skills/README.md`](skills/README.md)。

### 3. 开始任务

- Claude Code 或 Pi：`/workflow <任务目标>`
- 后续直接说「继续」或调整目标。L0/L1 任务及 Gate / Developer Review 阶段无生产逻辑风险的收尾微调由 Main 原地快速完成；L2 任务通过自包含 Contract 委派子 Agent，并复用同角色 Pane。

## 任务产物与记忆

L2 任务使用单一本地目录 `.agents/workflow/tasks/<task-id>/`（默认不纳入 Git 提交，未忽略时建议加入项目本地 `.git/info/exclude`）：

- `overview.md`：唯一状态入口与产物导航。
- `decisions.md`（有实质决策时）、`plan.md`（多文件或契约变化时）。
- `subtasks/implement/handoff.md`、`subtasks/review/review.md`（按需含 `subtasks/research/research.md`、`subtasks/test/test-report.md` 及视觉任务的 `visual-report.md` + `screenshots/`）。
- 干净工作区直接以 `git diff <Base Commit>` 与先改后测日志作为事实源，不生成多轮重复快照目录。

跨任务项目记忆保存在目标项目本地 `.agents/workflow/memory/project-memory.md`（规则见 [`core/project-memory.md`](core/project-memory.md)），采用 Workflow 时由 Main 默认维护，常规任务默认 `SKIP`，仅沉淀代码与正式文档未覆盖的隐性约束（权限见 [`core/permissions.md`](core/permissions.md) §1）。对外 Issue 交付遵循 [`core/permissions.md`](core/permissions.md) §3 的脱敏与回读要求。

## 文档与脚本导航

| 路径 | 职责 |
|---|---|
| [`core/README.md`](core/README.md) | Core 文件职责、术语表与文档语言约定 |
| [`core/workflow.md`](core/workflow.md) | Main 职责、启动续接、阶段流程与 Session 复用 |
| [`core/task-classification.md`](core/task-classification.md) | L0/L1/L2、收尾快速通道与方案条件 |
| [`core/model-routing.md`](core/model-routing.md) | 模型偏好、跨家族 Review 约束与成本闸门 |
| [`core/permissions.md`](core/permissions.md) | 权限矩阵、目录级工作区边界、记忆授权与外部副作用 |
| [`core/task-contract.md`](core/task-contract.md) | 自包含 Contract、内联角色约束与产物结构 |
| [`core/acceptance.md`](core/acceptance.md) | 测试、状态覆盖、Git 原生证据、跨家族 Review、增量截图、Gate 与最终报告 |
| [`core/project-memory.md`](core/project-memory.md) | 项目记忆的边界、预算与维护规则 |
| [`runtimes/README.md`](runtimes/README.md) | Runtime 入口、Herdr 调度、Pane 复用与清理协议 |
| [`skills/README.md`](skills/README.md) | 个人 Skills、第三方依赖、安装和同步 |
| [`scripts/run-check.sh`](scripts/run-check.sh) | 统一执行检查命令、保存完整日志并保留真实退出码（`core/acceptance.md` §2） |
| [`scripts/wait-agent.sh`](scripts/wait-agent.sh) | 有界分段等待子 Agent，探测停滞与费用上限，避免工具硬超时 |
| [`scripts/gate.sh`](scripts/gate.sh) | 代码树指纹与终态检查（Review 是否覆盖最终代码树、Developer Review 批准、状态已终态、决策无 PROPOSED、含 `Models & Usage`） |
| [`scripts/cleanup-agents.sh`](scripts/cleanup-agents.sh) | 任务完成或终止时一键关闭子 Agent 与 Pane（自动保护 Main Pane） |
| [`scripts/session-progress.mjs`](scripts/session-progress.mjs) | 探测 Pi Session 活跃度、上下文 Token 与模型花费 |
| [`scripts/evidence-snapshot.sh`](scripts/evidence-snapshot.sh) | 仅用于重叠脏工作区基线备份及未跟踪文件行级比对 |

运行 `node --test scripts/check-workflow.mjs` 验证全部文档链接、章节指针、Contract/模板结构及脚本自动化回归；行为场景参考 [`tests/workflow-scenarios.md`](tests/workflow-scenarios.md)。

## 许可证

本项目的自有代码、工作流规则、模板和文档采用 [MIT License](LICENSE)。允许商业使用、修改和分发；分发副本或实质性内容时须保留版权声明与许可声明。

第三方 Skills、工具和依赖适用各自的许可证，本项目的 MIT License 不改变它们的授权条件。使用本工作流不会自动改变目标项目的许可证。

## 参考资料

- [Herdr Agent Automation](https://herdr.dev/tui/docs/agent-automation/)
- [Herdr Integrations](https://herdr.dev/tui/docs/integrations/)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Pi Prompt Templates](https://pi.dev/docs/latest/prompt-templates)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Vercel Skills CLI](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)
- [Matt Pocock Skills](https://github.com/mattpocock/skills)
- [CodeGraph](https://github.com/colbymchenry/codegraph)
