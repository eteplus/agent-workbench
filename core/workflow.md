# Core 工作流

Claude Code 或 Pi 担任 Main；需要独立上下文的子任务（按需 Research、L2 实现、跨模型 Review 及按需 Test）由 Main 通过 Herdr 派发给 Pi 子 Agent。

## 1. Main 职责

Main 负责目标对齐、风险分级、用户决策、委派调度、Gate 和最终验收：

- **只读边界入口**：Main 只读取需求、仓库 `AGENTS.md`（及其引用的流程规范）、目录结构、模块入口与公共契约；调用链追踪、符号细节与测试实现委派给子 Agent 完成。仓库内检索限定在源码与文档目录（排除 `.git`、`node_modules`、构建产物与隐藏工具目录）。
- **工具与编辑硬护栏**：修改任何已有文件统一使用 Runtime 的 `edit` / `write` 工具，**严禁使用 `python3`、`node -e`、`sed -i` 或重定向脚本改写源码、测试与文档**。调用陌生 CLI 子命令前运行 `--help`；调用延迟加载或未展开声明的 MCP / 外部工具前，先通过工具搜索结果核对准确的参数字段名。
- **集中用户交互**：所有需求澄清、方案确认、模型升级、Developer Review 与外部写入授权均在 Main 完成，再通过自包含 Contract 派发子 Agent。

### 指令优先级

1. 系统与平台安全约束。
2. 用户本次明确提出的要求（用户明确简化或指定的流程优先于本 Workflow 默认约定）。
3. 项目 `AGENTS.md`、项目规范和用户已确认的决策。
4. 本 Workflow 及其按需加载的 References。
5. Agent 自行判断。

## 2. 任务启动与续接

一次 Workflow 对应一个任务生命周期：

- **同一任务**（继续、阶段切换、再次调用入口或 Session 恢复）：沿用 Task ID、Task Root、当前阶段和已确认决策，从当前上下文或 `overview.md` 直接续接。
- **目标调整**：只更新受影响的范围、决策、计划和验收；超出原授权时先向用户确认。新增小改动按其自身风险分级（例如补文档或改文案按 L0 / Documentation 直接处理），原任务尚未完成的 Gate 或批准保持有效。
- **独立目标**：建立新任务和新 Task Root；归属不明时只澄清这一点。

### 任务语言

Main 依据用户实际目标确定 `Output Language`（中文目标默认使用简体中文、不使用繁体字，英文目标使用英文，用户明确指定时从其指定；忽略模板、规则和代码自身语言）。所有回复、产物正文、Review 与外部 Issue 草稿均使用任务语言；路径、标识符、命令、协议枚举和原始日志保持原样。

## 3. Intake、Research、Clarify 与 Plan

### Intake

1. 执行 `git status --porcelain -uall` 记录工作区基线，**读取目标仓库根 `AGENTS.md`**；涉及 Issue / Ticket 时一并读取项目 Tracker 规范（如 `docs/agents/issue-tracker.md`），核对议题正文、父 Spec、备注与阻塞关系。存在本地项目记忆时按 `core/project-memory.md` §2 提取相关条目。
2. 对照父 Spec 与本任务要求，将配套的契约文档、ADR、`GLOSSARY.md` 或 `AGENTS.md` 更新一并纳入本次 `Allowed Paths` 与验收范围（不归本任务的须在派工前明确排除并告知用户），避免代码提交后二次补做。
3. 按 `core/task-classification.md` §1 显式输出任务级别（`L0/L1/L2`）与 `Developer Review` 要求；L2 任务创建 `overview.md`。取得明确「开始实施」授权后再启动实施子 Agent 或修改业务代码。

**完成条件**：已读取项目 `AGENTS.md`（及适用时的 Tracker 规范），已确认 `Base Commit` 与脏文件清单，已显式记录任务级别、`Developer Review` 要求、目录级 `Allowed Paths` 及完整验收清单（含配套文档/ADR 要求）；未知项已列为 `Research` 或 `Clarify` 问题。

### Research

仅当存在阻断方案的未知跨模块调用链或外部技术选型时执行；需求、Ticket 与入口已明确时直接进入下一阶段。Researcher 只回答具体未解问题并附文件路径与源码行号证据。

**完成条件**：所有阻断方案的未知问题均已有源码/文档证据结论，或已收敛为待用户拍板的明确选项。

### Clarify

仅当歧义会实质改变用户可见行为、公共契约、范围或数据安全时向用户提问；能从代码入口和项目规范查明的细节由 Agent 自行确认。同一轮围绕同一决策边界合并提问，给出选项与推荐依据，支持「全部按推荐」批量确认（`core/permissions.md` §1）。

**完成条件**：所有影响行为、契约、范围或外部副作用的待决项均已获用户确认并记入 `decisions.md`，无阻塞实施的 `PROPOSED` 项。

### Plan

满足 `core/task-classification.md` §4 条件时写入独立的 `plan.md`，其余直接写入 Contract 的 `Context & Plan`。方案定义目标、模块边界、接口/数据契约与状态规则、实施步骤与验收映射，具体行级实现留给 Implementer。

**完成条件**：每条原始验收条件（含配套文档/ADR）均已映射到目标模块与验证方式，接口/状态契约无歧义，Implementer 可直接开工。

## 4. 工作流阶段

常规 L2 实施任务：

`Intake → Research（按需）→ Clarify（按需）→ Plan → Implement → Handoff → Review（并行按需 Test）→ Gate → Developer Review（按条件）→ Acceptance & Cleanup`

- L0/L1 任务在显式确认满足 `core/task-classification.md` §1 判据后，由 Main 直接用 `edit/write` 修改并通过 `run-check.sh` 验证。
- Gate 或 Developer Review 期间的无生产逻辑风险微调走 `core/acceptance.md` §5 **收尾快速通道**。
- Acceptance 完成后按 `core/project-memory.md` §3 做一次记忆准入判断（常规任务默认 `SKIP`）；在派工和最终验收两个节点同步 `overview.md` 顶部状态。

## 5. 委派、等待与生命周期

- **按角色委派**：跨模块未知项委派 Researcher；L2 代码实现委派 Implementer（`Research → Implement` 使用新 Session，只传提炼后的方案与结论）；代码审查委派跨模型家族的 Primary Reviewer（`core/model-routing.md`）。独立 Tester 仅在需补充 Implementer 未覆盖的独立环境/端到端验证时派发（`core/acceptance.md` §2）。
- **自包含 Contract**：每次委派使用 `core/task-contract.md` §2 的自包含 Contract，内联通用角色约束；子 Agent 按需参考指定报告模板或专项 Reference。
- **持续等待不中断回合**：本任务有子 Agent 处于 `working` 且无需用户决策时，Main 调用 `scripts/wait-agent.sh` 有界等待；收到退出码 `1`（`still_working`）后**在同一回合内立即续调 `wait-agent.sh` 直至子 Agent 完成或异常**，不提前结束回合把等待交给用户。仅在遇到阻塞需用户决策或用户要求暂停时才结束当前回合。
- **复用同角色 Session**：同阶段的补充指令、定向修复与定向复审，只要**未更换模型且原 Session 未逼近模型上下文窗口上限（如未达窗口 60% 或触发压缩告警）**，直接复用原 Agent Session 发送增量消息（充分利用 Prompt Cache）；已结束角色的空闲 Pane 可关闭旧进程后复用给后续角色。换模型或逼近窗口上限时，关闭旧 Agent 后启动新 Session。
- **Pane 保留与终态回收**：`Developer Review` 待确认期间（`NEEDS DEVELOPER REVIEW`）必须保留已有子 Agent Pane 以便响应反馈；待用户明确批准达成最终 `PASS`（且无需继续追改）或任务明确取消/终止时，调用 `scripts/cleanup-agents.sh` 回收本任务全部子 Agent 与 Pane。

## 6. 按需加载

下表是 Main 的上下文指针表，按当前触发分支加载对应材料（同一任务内已加载的不再重读，路径相对于 `AGENT_WORKBENCH_ROOT`）：

| 触发时机 / 分支 | 加载目标 |
|---|---|
| 任务启动与分级（Intake） | `core/task-classification.md` §1–3；`core/permissions.md` §1–2 |
| 制定方案与委派子 Agent | `core/task-classification.md` §4；`core/model-routing.md`；`core/task-contract.md`；`runtimes/README.md` |
| 跨文件符号追踪 / 零引用删除扫描 | `core/references/code-retrieval.md` |
| 接收 Handoff / Review / Gate / 最终验收 | `core/acceptance.md`；涉及浏览器或外部 Issue 写入/关闭时加 `core/permissions.md` §3 与项目 Tracker 规范 |
| 提交审阅包与处理 Developer Review 反馈 | `core/references/developer-review.md` |
| 读取或更新项目记忆（存在记忆文件或准入非 SKIP 时） | `core/project-memory.md` |
| 子 Agent 停滞、超时或中断恢复 | `core/references/recovery.md` |

接收子 Agent 交付时，先读报告顶部状态块与 `git diff --stat`，按需定点读取关键源码和截图；大体积日志与 Session `.jsonl` 用脚本或 `grep` 提取摘要。
