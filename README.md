# Agent Workbench

面向个人开发环境的多 Runtime Agent 工作流仓库。支持 **Claude Code 或 Pi 担任 Main Agent**，通过 **Herdr → Pi Agent** 委派需要独立上下文的子任务。

> **项目状态**：本工作流仍在持续完善，来自维护者个人的 Agent 开发实践，主要适配当前维护者的工具和工作习惯。内容仅供参考与学习，请结合自身项目和风险偏好调整。

## 架构

```text
Claude Code ─┐
             ├── Main /workflow ── Core Rules
Pi ──────────┘         │
                       ▼
                 Herdr Automation
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
          Research  Implement  Review / Test
              └────────┼────────┘
                       ▼
             Main Gate / Acceptance
```

- **Core**：任务分级、模型路由、权限、Task Contract、Review、Gate 与验收的唯一规则来源。
- **Runtimes**：Claude Code Skill 与 Pi Prompt Template，共用 `/workflow` 启动 / 续接入口；调用语法只在 Adapter 定义。
- **Herdr → Pi**：Main 管理 Pane、启动 Pi 子 Agent、传递任务并收集结果。
- **Skills**：维护个人 Skill，并通过 Skills CLI 同步到 Agent Runtime。

## 环境与依赖

| 类别 | 依赖 | 必要性 / 用途 |
|---|---|---|
| Main Runtime | Claude Code **或** Pi | 二选一，承担 Main / Planner |
| Subagent Runtime | Pi Coding Agent | 必需；执行 L2 子任务 |
| Orchestration | Herdr | 必需；管理 Pane、启动和控制 Pi Agent |
| Model Access | Main 与 Pi 可用的模型 / Provider 凭据 | 必需；具体模型偏好见 `core/model-routing.md` |
| Skill Manager | Node.js / pnpm / `pnpx skills` | 安装和同步 Skills 时需要；具体安装方式见 `skills/README.md` |
| Engineering Skills | `mattpocock/skills` 指定 Skills | 按 Runtime 分流：Pi 默认安装 TDD / 设计辅助；Claude Code Main 可由用户显式调用澄清 / 复盘 Skills；Pi Main 默认使用 Core 内置流程，可选专项 Skill 按 `skills/README.md` 安装与核验；`implement` / `code-review` 默认不安装，仅满足前置条件并明确选择试用时才按需安装到 Pi；用户显式调用型 Skill 不会被模型自动触发 |
| Issue Tracker | 项目 Tracker 配置 | 上游 `code-review` 需要；`implement` 传入 Ticket 引用或使用其内部 `code-review` 时需要。未配置时使用 Core 实现与 Review 流程 |
| Visual Tooling | `ui-impl`、agent-browser、图片理解能力 | 仅视觉实现任务需要 |
| Code Retrieval | `@colbymchenry/codegraph` | 可选；不可用时使用 `rg` / `fd` / Read |

建议安装 Herdr Pi Integration，以提供 Pi Session 身份、状态上报和会话恢复支持。基础 Pane / Agent 调度由 Herdr 自动化能力提供。第三方 Skills 的调用约定、依赖边界和 Issue Tracker 前置条件见 [`skills/README.md`](skills/README.md)。Runtime 调度及 Pi 嵌套依赖边界见 [`runtimes/README.md`](runtimes/README.md)。

## 快速开始

### 1. 设置仓库路径

将仓库放在固定位置，例如 `~/Workspace/agent-workbench`，并在 Shell Profile 中设置：

```bash
export AGENT_WORKBENCH_ROOT="$HOME/Workspace/agent-workbench"
```

重新打开终端，或执行 `source ~/.zshrc`。确保 Main Runtime 和 Herdr 启动的 Pi 子 Agent 进程都能读取该变量。

### 2. 安装 Runtime 入口

```bash
cd "$AGENT_WORKBENCH_ROOT"
./scripts/install-runtime-links.sh
```

脚本为 Pi 安装全局 `/workflow` Prompt Template Symlink，并输出 Claude Code Skill 安装方式。选择 Claude Code 作为 Main 时执行：

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/runtimes/claude-code" \
  --skill workflow --agent claude-code --global
```

安装时选择 **Symlink**。Pi 活动 Session 执行 `/reload`。两个 Runtime 均通过 `/workflow <任务目标>` 启动。

### 3. 安装本仓库 Skill

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/skills" \
  --skill ui-impl --agent claude-code --agent pi --global
```

选择 **Symlink**。第三方 Skills 按角色和 Runtime 分流：Pi 子 Agent 使用工程实现辅助 Skills，Main Runtime 按需使用需求澄清 / 复盘 Skills；上游 `implement` / `code-review` 仅在 Issue Tracker 前置条件满足时条件安装。安装命令见 [`skills/README.md`](skills/README.md)。

### 4. 开始任务

- Claude Code：`/workflow <任务目标>`
- Pi：`/workflow <任务目标>`

Main 按风险选择最小必要流程。后续直接说“继续”或调整目标。同一任务重复 `/workflow` 或恢复会话仍沿用 Task ID、阶段和决策，不重新启动。访谈和批准留在 Main，L2 代码实现及独立 Research / Review / Test 通过 Herdr → Pi 执行；Research → Implement 使用新的 Pi Session。回复与生成产物跟随用户实际目标的语言，续接沿用（规则见 `core/workflow.md` §2）。Skill 是按需辅助，不另起工作流。

## 任务审阅

每个 Workflow 任务只有一个本地产物根目录 `.agents/workflow/tasks/<task-id>/`；同一任务续接沿用，独立任务不共用。细分执行放在该目录的 `subtasks/<id>/`，不另建顶层 task 目录；按需创建报告，每个文件一个写入负责人。

所有 L2 任务以 `overview.md` 为导航，查看目标、状态、关键文件、决策索引、验证结论与子任务入口，再按需查看：

- `decisions.md`：实质性选择、来源、责任人、理由、取舍和确认状态。
- `plan.md`：实施范围、步骤、契约、风险和回滚方案（按条件生成）。
- `handoff.md`：Implementation Walkthrough、调用链、状态/数据流、扩展和排障入口。
- `review*.md`、`test-report.md`：独立检查、Finding、测试结果和覆盖限制。
- `workspace-baseline/`（仅存在授权重叠路径时）：用于区分任务前已有修改与本次实现。
- Git Diff 与源码：核对实际变更和证据。

任务报告、派发上下文和检查输出仅作本地 Agent 上下文，默认不纳入提交。若项目没有忽略该目录，建议在项目本地 `.git/info/exclude` 添加 `.agents/workflow/tasks/`；不必修改团队共享 `.gitignore`，提交前仍检查暂存范围。已经跟踪的文件不受 ignore 规则影响，处理它们需单独授权。

长期知识从任务结论中提炼：架构取舍写 ADR，使用、接口和排障知识更新对应文档；仅在当前授权内执行，不复制全部过程报告。历史产物不自动清理。

同一轮明确列出的同类问题可批量确认，但设计确认、Developer Review 与外部写入授权不混同。高影响任务按条件进入 Developer Review。两类确认和最终 Gate 见 [`core/acceptance.md`](core/acceptance.md)。

## 文档导航

| 文档 | 内容 |
|---|---|
| [`core/workflow.md`](core/workflow.md) | Main 职责、阶段流程、门禁和上下文加载 |
| [`core/task-classification.md`](core/task-classification.md) | L0/L1/L2、任务类型和 Plan 条件 |
| [`core/model-routing.md`](core/model-routing.md) | Agent 模型偏好、Thinking 和升级 |
| [`core/permissions.md`](core/permissions.md) | 角色权限、决策归属、工作区和外部副作用 |
| [`core/task-contract.md`](core/task-contract.md) | Task Contract、Workspace Baseline 和任务产物 |
| [`core/acceptance.md`](core/acceptance.md) | Test、AI Review、Developer Review、Gate 和验收 |
| [`core/templates/`](core/templates/) | Overview、Decisions、Handoff 模板 |
| [`core/references/`](core/references/) | Code Retrieval 与 Review Escalation |
| [`runtimes/README.md`](runtimes/README.md) | Runtime 要求、Herdr 调度和 Skill 调用映射 |
| [`skills/README.md`](skills/README.md) | 个人 Skills、第三方依赖、安装和同步 |

## 维护原则

Core 规则只在对应权威文件中维护；Runtime Adapter 负责加载规则和映射调用方式；Skill 只承载专项能力。修改规则时先更新唯一权威文件，再检查入口、模板和引用。

使用 Node.js 22+ 和 Bash 运行 `node --test scripts/check-workflow.mjs` 检查文档链接、关键规则与检查命令示例的退出码/完整日志。行为验证按 [`tests/workflow-scenarios.md`](tests/workflow-scenarios.md) 执行，静态通过不代表 Runtime 已验证。

## License

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
