# Core 文档

Core 定义跨 Runtime 通用的工作流规则。每条规则只在一个权威文件中维护，其他文档通过引用使用：

| 文件 | 权威范围 |
|---|---|
| `workflow.md` | Main 职责、任务启动与续接、阶段流程、Session 复用和规则按需加载 |
| `task-classification.md` | L0/L1/L2 分级、任务类型、流程选择、收尾快速通道与 Plan 条件 |
| `model-routing.md` | Main / 子 Agent 模型偏好、Thinking、运行时核验、跨家族约束和成本闸门 |
| `permissions.md` | 角色权限、决策归属、目录级工作区边界、记忆授权、外部副作用、凭据和并行 |
| `task-contract.md` | 自包含 Contract、内联角色约束、路径边界、任务产物和完成状态 |
| `acceptance.md` | Handoff、测试与状态覆盖、Git 原生证据、跨家族 Review、增量视觉验收、Gate、最终报告和预算 |
| `templates/` | `overview.md`、`decisions.md`、`handoff.md` 模板 |
| `project-memory.md` | 跨任务项目记忆的边界、预算、默认跳过与维护规则 |
| `references/code-retrieval.md` | 代码检索工具选择与消费扫描 |
| `references/developer-review.md` | Developer Review 触发条件、审阅包与快速反馈通道 |
| `references/recovery.md` | 超时、部分执行、工具和模型异常恢复 |

修改规则时先改权威文件，再检查入口、模板和引用。Runtime 的 Skill 调用语法和 Herdr 调度维护在 `runtimes/README.md`；Core 只使用逻辑 Skill 名称。

项目记忆仅保存在目标项目本地 `<Project Root>/.agents/workflow/memory/project-memory.md`，默认不提交；采用 Workflow 时由 Main 默认维护，常规无增量任务直接跳过（见 `project-memory.md`）。

## 术语

每个概念只用一个名字。左列术语在中文正文中保留英文原词；其他概念使用中文。

| 术语 | 含义 | 已停用的别名 |
|---|---|---|
| Main | 当前会话中承担规划、决策、调度和验收的 Agent | Main Agent、主控、Orchestrator |
| Task Contract（简称 Contract） | Main 派发给子 Agent 的自包含任务说明文件 | 契约、任务契约 |
| 契约 | 仅指 API、数据结构、事件、数据库等接口契约 | — |
| Handoff | Implementer 交付的实现说明 `handoff.md` | 交接、实现交接 |
| Review / Reviewer | 独立代码与方案检查及其执行者 | 审查 |
| Finding | Review 发现的单个问题 | — |
| Gate | 进入 Developer Review / Acceptance 前的放行检查 | 门禁 |
| Developer Review | 开发者对实现和技术取舍的人工确认 | 开发者审查、人工审阅 |
| 审阅包 | 提供给 Developer Review 的材料入口 | 开发者审阅包 |
| Product / Domain Approval | 对业务规则和用户可见行为的批准 | 业务批准 |
| Verdict | 任务或报告的结论状态 | — |
| Session | 一个 Agent 运行实例及其记录 | 会话（指 Agent 运行实例时） |
| Thinking | 模型推理强度设置；字面变量如 `PI_REASONING_LEVEL` 除外 | 档位、推理档位、Reasoning Level |
| Fallback | 首选模型或能力不可用时的替代选择 | 回退 |
| Workspace Baseline、Task Root、Output Language | 见 `task-contract.md`、`workflow.md` | — |

阶段名 Intake、Research、Clarify、Plan、Implement、Test、Review、Gate、Acceptance 作为术语保留英文；「验收」指 Main 对交付的核验动作。

## 文档语言

仓库文档以简体中文撰写，不使用繁体字。英文只用于：

1. 产品与工具名：Claude Code、Pi、Herdr。
2. 字面标识符：路径、命令、环境变量、Contract 字段名、状态枚举值。
3. 无通行中文译名的技术词：Diff、Commit、Session、Skill、Token。
4. 上方术语表中的术语与阶段名。

表头、列表标签和模板字段名使用中文；字段名本身是术语或 Contract 字段时保留原词。引号统一使用「」。

例外：`skills/` 下的 Skill 正文、references、frontmatter `description` 与 `UPSTREAM.md` 模板，以及 Runtime 入口的 `description` 使用英文，便于跨仓库复用和触发匹配。本约定只约束仓库自身文档；任务产物语言遵循 `workflow.md` §2 的 Output Language。
