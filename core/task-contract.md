# Task Contract 与交付物

所有通过 Herdr → Pi 委派的子任务均使用本文件定义的**自包含 Task Contract（简称 Contract）**，由 Main 定义目标、模块边界与验收标准。

## 1. 自包含 Contract 规则

- **内联通用约束**：Contract 通过 `Role Rules` 字段携带当前角色的权限、工具规范与边界硬护栏；子 Agent 直接读取本 Contract 与目标源码开展工作，并按 Contract 指引参考目标产物模板（`core/templates/`）或专项 Reference（如消费扫描时的 `core/references/code-retrieval.md`）。
- 每次新派发子 Agent 时填写 §2 模板字段，不适用的填 `N/A`。Main 须将本任务要求同步更新的文档（如 `AGENTS.md`、`GLOSSARY.md`、`docs/adr/`）一并列入 `Allowed Paths`。
- 子 Agent 遇到会实质改变产品行为、公共契约、超出 `Allowed Paths` 边界或工作区存在无关残留文件干扰检查的问题时，停下向 Main 报告证据与建议；模块内局部实现细节由子 Agent 自主完成。

### Skill

- 默认按自包含 Contract 执行。确需专项 Skill（如视觉实现的 `ui-impl`）时，在 `Skills` 注明：`逻辑名称 | 绝对 Source Path | REQUIRED 或 OPTIONAL | 调用策略`。
- 调用策略取 `HERDR_EXPLICIT_COMMAND`、`USER_COMMAND`、`RUNTIME_AUTO` 或 `CORE_FALLBACK`（映射见 `runtimes/README.md`）。
- `REQUIRED` Skill 或其必要依赖不可用时，子 Agent 停止依赖它的工作并报 `BLOCKED`；`OPTIONAL` 不可用时记录原因并按常规方式继续。

## 2. Contract 模板

```text
Task ID: <Workflow 唯一任务标识>
Subtask ID: <当前子任务标识，如 implement-1 / review-1>
Agent Role: <Repo Researcher | Web Researcher | Implementer | Primary Reviewer | Tester | Expert>
Task Type: <Research | Plan / Architecture | Implement | Visual Implementation | Review | Test | Debug | Documentation | Issue / Ticket | Mixed>
Output Language: <中文 | English；跟随 Main 任务语言>
Model / Thinking: <目标 Provider / Model / Thinking>
Skills: <None | 名称 | 绝对 Source Path | REQUIRED/OPTIONAL | 调用策略>
Goal: <一句话说明核心交付目标>
Workspace:
  Repository Root: <仓库根目录绝对路径>
  Base Commit: <任务开始时的 HEAD>
  Allowed Paths: <允许写入的模块/文档绝对路径 + 本子任务产物目录；Reviewer/Researcher 仅限本产物目录>
  Excluded Paths: <禁止触碰的目录或任务前既有脏文件；无则 None；已授权重叠脏文件附 workspace-baseline/ 快照路径>
Context & Plan: <原始需求要点、已确认决策摘要，或 plan.md / decisions.md / 专项 Reference 的绝对路径与已知模块入口>
Role Rules:
  - 仅在 Allowed Paths 内写入，保持 Excluded Paths 与无关目录原样；严禁擅自 mv / rm 仓库内无关目录，严禁执行 git commit / push / reset / checkout / stash。
  - 读取源码与搜索符号优先使用原生 read（配合 offset/limit 成块读取）与 grep 工具，避免用大量 bash sed/cat 碎片化读文件；修改任何文件必须使用 edit / write 工具，严禁使用 python3 / node / sed -i 脚本改写文件。
  - Reviewer 以 git diff <Base Commit> 与改动文件 read 为主，仅在跨文件调用链或边界不明时定点查询 codegraph。
  - 发现超出契约的公共接口歧义或环境残留干扰测试时停下报告 Main。
  - 停止源码修改后通过 "$AGENT_WORKBENCH_ROOT/scripts/run-check.sh" <绝对日志路径> <命令> 执行检查并保留真实退出码；检查后若再次修改源码，重跑受影响检查。
Checks: <需执行的检查命令与绝对日志路径；只读角色填 Read-only（复用已有同版本日志）>
Acceptance Criteria: <可观察、可验证的完成条件清单（含必要的文档/ADR 同步项）>
Deliverables: <唯一主报告绝对路径（如 handoff.md，结构参考 core/templates/）及必要日志/截图目录>
```

### 定向修复消息（复用原 Session）

未更换模型且原 Session 未逼近上下文窗口上限时，定向修复与定向复审直接向原 Agent 发送增量消息（或写简短 `fix-<n>.md`）：

```text
基于原 Contract 执行第 <n>/2 轮定向修复（原边界与 Role Rules 继续有效，严禁用 python3/sed 改写源码）：
Findings:
  - <ID> | <File:Line> | <问题与预期行为（先跑定向单测验证修复）>
Out of Scope: <本轮不处理的 P2 项>
Checks: <停止修改源码后运行受影响单测与必要检查命令 + 新日志路径>
Deliverables: 在 <handoff-fix-<n>.md 绝对路径> 记录本轮修改文件、测试退出码与残余风险。
```

### 视觉实现补充字段

`Visual Implementation` 在 `Context & Plan` 或末尾追加：
- `Reference`：参考图、设计稿、对标页面或状态规范。
- `Target & Viewport`：目标 URL / Route、宽高与 DPR（保持共享开发服务原样运行）。
- `States`：需覆盖的关键状态、受控响应/夹具构造方式，以及输出到 `screenshots/` 的命名约定。执行者必须加载 `skills/ui-impl/SKILL.md` 并亲自读图核验。

## 3. Workspace 与路径边界

Main 在 Intake 执行一次 `git status --porcelain -uall` 记录工作区基线：

- **模块级 `Allowed Paths`**：实施任务按业务模块/目录及需同步更新的文档授权（如 `apps/web/`、`packages/`、`docs/` 及子任务产物目录）；子 Agent 可在授权模块内按需新增或修改辅助文件与单测。
- **既有脏文件与环境残留隔离**：任务开始前已存在的修改或未跟踪文件默认列入 `Excluded Paths` 保持原样；执行中若发现被忽略的历史残留目录干扰测试，子 Agent 报告 Main 由 Main 确认处置，不擅自移走或删除仓库内容。
- **授权重叠快照**：仅当确需修改既有脏文件并获用户明确授权时，Main 在派工前用 `scripts/evidence-snapshot.sh` 将重叠文件备份到 `<Task Root>/workspace-baseline/`；Reviewer 对重叠文件比较 `workspace-baseline/` 与当前文件，对干净路径直接比较 `git diff <Base Commit>`。无法区分既有改动与本次改动时不得放行 PASS。

## 4. 任务产物与状态

每个 L2 任务使用单一本地根目录 `<Repository Root>/.agents/workflow/tasks/<task-id>/`（默认不纳入 Git 提交，未忽略时加入 `.git/info/exclude`）。按实际触发阶段创建产物，每个文件单一写入负责人：

| 产物 | 负责人 | 创建条件与内容要求 |
|---|---|---|
| `overview.md` | Main | 所有 L2 任务：顶部当前状态、基线摘要、`Developer Review` 要求、决策与产物链接、验证结论（`core/templates/overview.template.md`）；至少在首次派工与最终验收时同步状态 |
| `decisions.md` | Main | 存在实质性产品/架构/契约取舍时创建（`core/templates/decisions.template.md`） |
| `plan.md` | Main | 满足 `core/task-classification.md` §4 条件时创建 |
| `subtasks/research/research.md` | Researcher | 独立 Research 任务或 L2 按需调研时创建 |
| `subtasks/implement/handoff.md` | Implementer | 实现摘要、修改文件、Walkthrough、检查结果与残余风险（`core/templates/handoff.template.md`）；修复轮写 `handoff-fix-<n>.md` |
| `subtasks/implement/visual-report.md` + `screenshots/` | Implementer | `Visual Implementation` 任务创建 |
| `subtasks/review/review.md` | Reviewer | Review 覆盖范围、P0/P1/P2 Findings 及结论；复审写 `review-fix-<n>.md` |
| `subtasks/test/test-report.md` | Tester | 仅派发了独立 Tester 时创建 |
| `debug-report.md` / `retro.md` | 对应角色 / Main | Debug 诊断任务或触发异常复盘（`core/acceptance.md` §7）时创建 |

- 报告顶部以不超过 10 行的「状态」块概括结论、实际模型（读取自身 `PI_PROVIDER` / `PI_MODEL` / `PI_REASONING_LEVEL`）和检查结果。
- 发生 `Allowed Paths` 之外的写入或偏离约束的操作时，必须在报告末尾如实披露路径与原因。

### 完成状态

子 Agent 最终状态取 `DONE`、`PARTIAL`、`BLOCKED` 或 `FAILED` 之一，并在最终回复中给出简明结论、实际模型与交付文件绝对路径。Main 依据真实代码 Diff、检查日志与截图独立验收（`core/acceptance.md` §6）。
