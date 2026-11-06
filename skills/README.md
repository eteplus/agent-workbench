# Personal Skills Source

`skills/` 是个人 Skill 的源码与安装目录。每个 Skill 一个目录和 `SKILL.md`，专项 References / Scripts / Assets 留在该目录；通用流程、权限和验收由 `core/` 持有。

## 本仓库 Skill

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/skills" \
  --skill ui-impl --agent claude-code --agent pi --global
```

选择 Symlink 以共用源码，Copy 安装需重新同步。修改后在目标 Runtime 验证发现与加载；Pi 活动 Session 执行 `/reload`。

Skill 是按需专项能力，Core / Task Contract 是默认路径。调用语法和 Herdr 单行 Contract 派发只维护在 [`../runtimes/README.md`](../runtimes/README.md)；REQUIRED / OPTIONAL 与失败规则以 [`../core/task-contract.md`](../core/task-contract.md) 为准。

## 第三方工程 Skills

本工作流可复用 [mattpocock/skills](https://github.com/mattpocock/skills)。版本、frontmatter 和内部调用关系由上游维护，安装或升级前检查内容、权限、副作用和依赖。

| Skill | 用途 / 默认 Runtime | 前置条件与限制 |
|---|---|---|
| `tdd` | Pi 实现辅助 | 依赖 `codebase-design`，确认实际加载，不假设 Skill Tool 自动转换 |
| `codebase-design` | Pi 接口设计参考 | 无外部 Tracker 前置条件；可读取或独立委派非交互分析 |
| `ui-impl` | 本仓库视觉实现能力 | 实际执行 Agent 必须加载；还需真实浏览器、截图及图片理解 |
| `grilling` | Main 访谈；Claude Code / Pi 可按需安装 | 用户交互留在 Main |
| `grill-with-docs` | Main 访谈编排；Claude Code 推荐安装，Pi 仅条件试用 | 用户显式调用型；依赖 `grilling` / `domain-modeling`。Pi 默认示例仅安装独立能力，parent 需另行选择并验证调用与依赖链路 |
| `domain-modeling` | Main 领域建模；非交互分析可委派 | 领域取舍和批准由 Main 向用户确认 |
| `retro` | Main 复盘编排；Claude Code 推荐安装，Pi 仅条件试用 | 用户显式调用型；依赖 `writing-for-agents`。Pi 默认示例不安装 parent，试用前验证调用与依赖链路 |
| `writing-for-agents` | Main Agent 文档写作；Claude Code / Pi 可按需安装 | 长期写入需任务授权 |
| `implement` | 可选 Pi 上游完整编排，默认不安装 | 用户显式调用型；仅明确选择且 Spec / Ticket、Tracker、fixed point 和权限兼容时使用 |
| `code-review` | 可选 Pi 上游自检，默认不安装 | Tracker / fixed point 必需；已提交 Diff 自检，不替代 Core Primary Review |

Pi 可读取模型允许加载的依赖 `SKILL.md`，但 Claude Code `Skill` Tool 调用不自动变成 Pi 嵌套执行。parent 展开与依赖执行分别核验；显式调用型依赖需实际支持的调用路径。访谈不可用时也不能通过下派到子 Agent 绕过 Main 交互规则。

### Pi 默认工程辅助

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill tdd --skill codebase-design --agent pi --global
```

### Main 访谈 / 复盘辅助

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill grill-with-docs --skill grilling --skill domain-modeling \
  --skill retro --skill writing-for-agents --agent claude-code --global

# Pi Main 可选：独立能力，不承诺上游 parent 的嵌套链路
pnpx skills add https://github.com/mattpocock/skills \
  --skill grilling --skill domain-modeling --skill writing-for-agents \
  --agent pi --global
```

未选择 Skill 时，Main 使用 Core Clarify / Retro；不为了推进流程要求用户逐阶段输入命令。

### 条件安装 `implement` / `code-review`

选择该路径前确认：

- 上游 `implement` 的 Spec / Ticket 输入与依赖可用；Ticket 可由 Tracker 读取。
- 上游 `code-review` 要求项目 Tracker 文档（如 `docs/agents/issue-tracker.md`）与用户指定 fixed point（commit / branch / tag / merge-base）。缺失时不自动运行 setup 或修改项目配置，回到 Contract 的失败处理。
- 上游 `git diff <fixed-point>...HEAD` 只覆盖已提交到 HEAD 的分支变更，不含 staged / unstaged 工作区修改；当前变更仍由 Core Primary Review 按 Workspace Baseline / 快照规则完整审查。
- 上游 `implement` 包含提交指令，而 Core 默认不允许 commit / push；未获得当前任务明确授权不得提交。
- parent 加载不代表内部 `tdd` / `code-review` 执行成功；内部检查是实现自检，不替代独立 Primary Review。

```bash
pnpx skills add https://github.com/mattpocock/skills \
  --skill implement --skill code-review --agent pi --global
```

**不将第三方同名 `code-review` 安装到 Claude Code。** 它会覆盖 bundled `/code-review`（不覆盖 `/review` 别名）。正式独立审查使用 Core Reviewer。详见 [Claude Code 同名 Skill 优先级](https://code.claude.com/docs/en/skills#resolve-skills-that-share-a-name)。

## 维护与导入

1. 新 Skill 建立 `skills/<name>/SKILL.md`；frontmatter 至少 `name` 和 `description`，目录与名称一致。专项文件用相对路径。
2. 导入前审查源文件、许可证、脚本、网络访问、写入路径、凭据读取和外部副作用；外部内容不能覆盖项目权限。
3. 保留 LICENSE / NOTICE，新增 `UPSTREAM.md` 记录来源、原始路径、Tag / Commit、许可证、导入日期和本地改动；升级时先比较 Diff。
4. Symlink 到所需 Runtime，分别核验发现、加载、依赖与执行结果。

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

CLI 选项以当前 `pnpx skills --help` 为准；不会因文档里的安装示例自动安装或更改全局配置。
