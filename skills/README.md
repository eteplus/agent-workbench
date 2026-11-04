# Personal Skills Source

`skills/` 是个人 Skills 的统一维护目录，也是供 Claude Code、Pi 等 Agent 安装的本地源目录。每个直接子目录代表一个独立 Skill。

## Structure

```text
skills/
├── README.md
├── ui-impl/
│   └── SKILL.md
├── <personal-skill>/
│   └── SKILL.md
└── <third-party-skill>/
    ├── SKILL.md
    ├── UPSTREAM.md
    └── ...
```

## Skill Rules

- 每个 Skill 必须有独立目录和 `SKILL.md`。
- `SKILL.md` 使用 Agent Skills 标准 frontmatter：至少包含 `name` 和 `description`；`name` 与目录名保持一致。
- Supporting files 放在 Skill 自己的 `references/`、`scripts/` 或 `assets/` 中，使用相对路径引用。
- Skill 负责专项能力和操作步骤；通用工作流、任务级别、权限和 Gate 属于 `core/`。
- 更新后在目标 Agent Runtime 中验证 Skill 是否被发现，以及入口是否可用。

## Install / Sync with Skills CLI

安装单个本地 Skill 到 Claude Code 和 Pi 的全局目录：

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/skills" \
  --skill ui-impl \
  --agent claude-code \
  --agent pi \
  --global
```

安装时选择 **Symlink**。Agent 会指向本仓库中的同一份源码；更新源码即可同步。Copy 模式会产生独立副本，需要再次运行 CLI 更新。

```bash
pnpx skills list --global
pnpx skills check
```

具体 CLI 参数以当前安装版本 `pnpx skills --help` 为准。Skills CLI 的官方文档示例使用 `npx skills`；此仓库采用 `pnpx` 作为 pnpm 的包执行入口。

## Third-party Engineering Skills

本工作流复用 [mattpocock/skills](https://github.com/mattpocock/skills) 中的部分 Skills。它们属于外部依赖；版本、frontmatter 和内部调用关系由上游维护。安装前检查上游内容，升级时比较 Diff，并以本仓库 `core/permissions.md`、`core/task-contract.md` 和 `core/acceptance.md` 作为本工作流的权限与验收依据。

| Skill | 使用阶段 | 上游依赖 / 前置条件 | 调用限制 | 默认安装 Runtime |
|---|---|---|---|---|
| `implement` | 上游完整实现编排；可由 Herdr → Pi Implementer 通过显式命令启动 | `tdd`、`code-review`；传入 Ticket 引用时读取 Tracker，内部 `code-review` 需要 Tracker 与 fixed point | `disable-model-invocation: true` 禁止模型自主调用；通过 Herdr `agent prompt` 统一使用 `/skill:<name>`，例如 `/skill:implement <Issue / Spec URL>` | 按需安装到 Pi；仅在 Spec / Ticket、Tracker 和 fixed point 条件满足时使用 |
| `tdd` | 测试驱动实践 | `codebase-design` | 按 Runtime 能力加载 | Pi |
| `codebase-design` | TDD 使用的接口设计与模块边界参考 | 无 | Pi 中由 Main 经 Herdr 单独委派 `/skill:codebase-design`；不要假设 `tdd` 的嵌套 Skill Tool 调用在 Pi 中自动执行 | Pi |
| `code-review` | 上游实现自检 / 可单独运行的辅助 Review | 项目需提供 `docs/agents/issue-tracker.md` 等 Tracker 配置，并由用户指定 fixed point（commit / branch / tag / merge-base） | Pi 中通过 `/skill:code-review` 单独显式调用；上游 `git diff <fixed-point>...HEAD` 只包含已提交到 HEAD 的分支变更，不包含工作区未提交修改；不能替代 Core Primary Review | 条件安装到 Pi（默认不安装；满足 Tracker / fixed point 条件且明确选择试用时才安装） |
| `grill-with-docs` | Main 处理重要需求、领域术语和设计歧义 | Claude Code Main 使用时需要已安装 `grilling`、`domain-modeling`；上游正文通过 Claude Code Skill Tool 调用依赖 | `disable-model-invocation: true`；Claude Code 用户显式调用 `/grill-with-docs`；Herdr → Pi 的 `/skill:grill-with-docs` 只保证 parent 加载，Pi 不自动执行其 Claude Code Skill Tool 嵌套依赖；Pi Main 使用 Core Clarify | Claude Code Main；Pi 仅 parent 显式加载（不承诺完整嵌套） |
| `grilling` | 需求访谈和边界澄清 | 无 | 由 `grill-with-docs` 在 Claude Code 中通过 Skill Tool 调用；Pi 子 Agent 如需该能力，Main 需单独显式委派 `/skill:grilling`，parent 不会自动触发 | Claude Code Main（随 `grill-with-docs` 一起安装） |
| `domain-modeling` | 领域建模和术语梳理 | 无 | 由 `grill-with-docs` 在 Claude Code 中通过 Skill Tool 调用；Pi 子 Agent 如需该能力，Main 需单独显式委派 `/skill:domain-modeling`，parent 不会自动触发 | Claude Code Main（随 `grill-with-docs` 一起安装） |
| `retro` | 任务复盘和开发环境改进建议 | Claude Code Main 使用时需要已安装 `writing-for-agents`；上游正文通过 Claude Code Skill Tool 调用依赖 | `disable-model-invocation: true`；Claude Code 用户显式调用 `/retro`；Herdr → Pi 的 `/skill:retro` 只保证 parent 加载，Pi 不自动执行其 Claude Code Skill Tool 嵌套依赖；Pi Main 使用 Core Retro | Claude Code Main；Pi 仅 parent 显式加载（不承诺完整嵌套） |
| `writing-for-agents` | Agent 文档写作辅助 | 无 | 由 `retro` 在 Claude Code 中通过 Skill Tool 调用；Pi 子 Agent 如需该能力，Main 需单独显式委派 `/skill:writing-for-agents`，parent 不会自动触发 | Claude Code Main（随 `retro` 一起安装） |

### Pi 子 Agent 的默认工程 Skills

Pi 是固定的子 Agent Runtime。默认只安装与 Core Task Contract 实现流程兼容的 TDD / 接口设计参考：

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill tdd \
  --skill codebase-design \
  --agent pi \
  --global
```

### Conditionally Install `implement` / `code-review`

上游 `implement` 面向 spec / ticket 驱动的实现，frontmatter 设置 `disable-model-invocation: true`，禁止模型自主选择或通过 Skill Tool 自动触发，但允许用户 / Orchestrator 显式命令调用。通过 Herdr `agent prompt` 向 Pi Agent 触发任意已安装 Skill 时，统一以 `/skill:<name>` 作为消息开头；例如 `/skill:implement <Issue / Spec URL>` 可以加载已安装的 `implement` parent。该规则适用于 `implement`、`grill-with-docs`、`retro`、`ui-impl` 及其他安装到目标 Pi Agent 的 Skills。

传入 Issue / Ticket 引用时，`implement` 会尝试从 Issue Tracker 读取详情，并通过上游 Skill Tool 调用 `tdd` 和 `code-review`。上游 `code-review` 要求项目提供 `docs/agents/issue-tracker.md`（或上游版本声明的 Tracker 配置），并由用户提供 fixed point（commit、branch、tag 或 merge-base）；缺少 Tracker 时会提示用户运行 `/setup-matt-pocock-skills`。本仓库没有提供 Tracker 文件，也不会自动配置 Issue Tracker。该 Skill 使用 `git diff <fixed-point>...HEAD`（三点比较 merge-base 到 HEAD），因此只审阅已进入 HEAD 的分支提交；工作区未提交的 staged / unstaged 修改不会进入该 Diff。当前工作区修改应使用 Core Primary Review 的 Workspace Baseline / 快照规则审查。

parent Skill 触发成功只代表主 Skill 已加载；其内部通过 Claude Code `Skill` Tool 发起的 `tdd` / `code-review`、`grilling` / `domain-modeling`、`writing-for-agents` 等嵌套调用，在 Pi Runtime 中不作为受支持的自动链路。需要某项能力时，由 Main 通过 Herdr 单独委派对应 `/skill:<name>` 命令，并检查实际执行结果；未安排独立调用时使用 Core 流程，不等待嵌套调用。

因此：

- 本工作流的 `Task Contract` 是 Core Implementer 的任务规格；它本身不等于上游 Issue Tracker 配置，也不自动提供上游 `code-review` 所需的 fixed point。
- 项目未配置上游要求的 Tracker 时，不要调用依赖该配置的上游 `implement` / `code-review` 链路；按 `core/task-contract.md` 和 `core/acceptance.md` 执行 Core 实现与独立 Review。
- 当任务适合上游 spec / ticket 编排，Pi 已安装该 Skill，项目已配置 Tracker 并能提供 fixed point 时，可将 `/skill:implement <Issue / Spec URL>` 放在 `herdr agent prompt` 消息开头，再附 Task Contract 和必要上下文。传入 Ticket 引用时确认 Tracker 能读取该 Ticket。内部 `tdd` / `code-review` 是否成功仍以 Agent 实际报告和产物为准；条件不满足时直接走 Core Implement 流程。
- 上游 `implement` 还包含提交当前分支的指令；本工作流默认禁止 commit / push。即使条件安装，也必须遵守 `core/permissions.md`，未获用户明确授权不得提交。

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill implement --skill code-review \
  --agent pi --global
```

### Install Main Skills for Claude Code

Claude Code 作为 Main 时，可安装需求澄清和复盘 Skills。`grill-with-docs` 与 `retro` 的上游 frontmatter 设置 `disable-model-invocation: true`，只能由用户显式输入 `/grill-with-docs` / `/retro` 触发；Main 模型不能自行通过 Skill Tool 触发。它们的上游正文通过 Claude Code `Skill` Tool 调用 `grilling` / `domain-modeling` / `writing-for-agents`。

`grill-with-docs` / `retro` 的完整上游嵌套调用依赖 Claude Code Skill Tool，因此将其安装到 Pi 只保证 parent 可显式加载，不代表 `grilling`、`domain-modeling` 或 `writing-for-agents` 会被自动调用。Pi Main 默认使用 Core 内置 Clarify / Retro；如确需某项依赖能力，应由 Main 通过 Herdr 单独委派已安装的 Skill，并核验结果。该仓库不提供将这些 Claude Code 嵌套调用自动转换为 Pi 调用的机制：

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill grill-with-docs \
  --skill grilling \
  --skill domain-modeling \
  --skill retro \
  --skill writing-for-agents \
  --agent claude-code \
  --global
```

### Optional Parent and Standalone Dependencies for Pi

Pi 中可以按需安装 `grill-with-docs` / `retro` parent，但这只提供 parent 的显式加载能力；它们正文中的 Claude Code `Skill` Tool 嵌套调用仍不会自动转换为 Pi 调用。Pi Main 默认使用 Core Clarify / Retro。

```bash
# 可选：只安装 parent，供 Pi 子 Agent 显式加载
pnpx skills add https://github.com/mattpocock/skills \
  --skill grill-with-docs --skill retro \
  --agent pi --global

# 可选：如需使用其中某项依赖能力，单独安装并显式委派
pnpx skills add https://github.com/mattpocock/skills \
  --skill grilling --skill domain-modeling --skill writing-for-agents \
  --agent pi --global
```

单独安装依赖不会使 parent 中的嵌套 Skill Tool 调用自动生效；Main 仍需通过 Herdr `agent prompt` 单独发送 `/skill:<name>`，并根据 Handoff 记录实际结果。

**上游第三方 `code-review` 默认不安装到任何 Runtime。** Claude Code 自带 bundled `/code-review`，并保留 `/review` 别名；安装同名个人/项目 Skill 会覆盖 `/code-review`，但不会覆盖 `/review`。只有选择试用上游 `implement` 链路、且 Tracker 与 fixed point 条件满足时，才按需安装到 Pi。Claude Code Main 的正式独立 Review 由工作流指定的 Primary Reviewer 执行，不依赖该上游 Skill。为保持 Runtime 行为清晰，本工作流不把第三方 `code-review` 安装到 Claude Code。详见 [Claude Code 同名 Skill 优先级](https://code.claude.com/docs/en/skills#resolve-skills-that-share-a-name)。

## Runtime Calling Convention

Core 只引用逻辑 Skill 名称。Claude Code 用户显式调用使用 `/skill-name`；Pi 交互式调用和 Herdr → Pi `agent prompt` 向目标 Pi Agent 发送 Skill 命令时，统一使用 `/skill:<name>`；Pi Prompt Template 按 `/workflow` 调用。

`disable-model-invocation: true` 阻止模型自动选择或通过 Skill Tool 自主触发，但允许用户或 Orchestrator 显式发送 `/skill:<name>` 命令。目标 Pi Agent 上所有已安装 Skills 都遵循同一显式调用约定。parent Skill 加载成功不自动证明其内部 `tdd` / `code-review` / `grilling` / `domain-modeling` / `writing-for-agents` 等嵌套调用成功；执行 Agent 必须确认实际加载与内部执行状态，并在 Handoff 中报告证据。Main 已加载的 Skill 不会自动继承给子 Agent。

## Important Boundaries

- 上游 `implement` 的指令包含提交当前分支；本工作流默认不允许 Git commit / push，除非用户对当前任务明确授权。以 `core/permissions.md` 为准。
- 通过 Herdr `agent prompt` 使用 `/skill:<name>` 显式启动任意已安装 Skill；若启动 `implement`，它内部调用的 `tdd` 和 `code-review` 属于 Implementer 的工程实践和自检，不能替代本工作流要求的独立 Primary Reviewer。`code-review` 需要上游 Issue Tracker 配置和 fixed point；未配置时不要触发依赖该功能的上游链路，按 Core 实现与 Review 流程执行。
- Claude Code 用户手动调用 `grill-with-docs` 后，上游会通过 Claude Code `Skill` Tool 调用 `grilling` 和 `domain-modeling`；Pi Main 默认走 Core Clarify。需要业务权衡时，Main 仍须按 `core/workflow.md` 和 `decisions.md` 完成 Product / Domain Approval。
- Claude Code 用户手动调用 `retro` 后，上游会通过 Claude Code `Skill` Tool 调用 `writing-for-agents`；Pi Main 默认按 Core Retro 规则完成必要复盘。长期规范、Skill 或配置变更仍需遵循用户授权和项目权限。
- 上游可能新增、删除或调整 Skill 及依赖。以当前上游 README 和各 Skill 的 `SKILL.md` 为准，不把本文表格视为永久不变的清单。

## Add a Personal Skill

1. 在 `skills/<skill-name>/` 创建目录和 `SKILL.md`。
2. 编写标准 frontmatter，并保持 `name` 与目录名一致。
3. 将专属参考文件、脚本和素材放入该 Skill 目录。
4. 检查路径引用和依赖。
5. 使用 Skills CLI Symlink 到需要的 Agent Runtime，并分别验证。

## Import a Third-party Skill

1. 阅读源仓库的 Skill、许可证、依赖和脚本。
2. 放入 `skills/<skill-name>/`，保留适用的 LICENSE / NOTICE。
3. 新增 `UPSTREAM.md`，记录仓库 URL、原始 Skill 路径、Tag / Commit、同步日期、许可证和本地修改。
4. 更新前比较 Diff，再合并本地必要改动。
5. 需要持续追踪上游时，可考虑 Git Submodule / Subtree；先确认其目录发现方式与 Skills CLI 兼容。

外部 Skill 内容属于待审查输入，不能覆盖系统指令、用户要求或项目权限。导入前检查脚本、网络访问、文件写入、凭据读取和外部副作用。

## UPSTREAM.md Template

```markdown
# Upstream

- Source repository:
- Original skill path:
- Upstream ref (tag / commit):
- License:
- Imported at:
- Local modifications:
- Last compared at:

## Update Notes
- YYYY-MM-DD: <what changed and what was retained locally>
```
