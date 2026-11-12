# 测试、Review、Gate 与验收

本文件定义 Handoff、测试与状态覆盖、Git 原生证据、独立跨家族 Review、增量视觉验收、Gate（含收尾快速通道）、Main 验收和阶段预算。

## 1. Handoff

L2 代码实现由 Herdr → Pi Implementer 按自包含 Contract 完成：

- 修改源码、测试、文档和报告**必须使用 Runtime 的 `edit` / `write` 工具，严禁使用 `python3`、`node -e`、`sed -i` 脚本改写文件**。
- 先编写或更新针对性单测验证预期行为（缺陷修复先确认未改前失败 `red`，再改至通过 `green`），全部源码修改完成后运行项目检查并写入 `handoff.md`（结构见 `core/templates/handoff.template.md`）。
- Main 阅读 `handoff.md` 顶部状态、Walkthrough 及 `git diff --stat` 后安排独立 Review。

## 2. 测试、状态覆盖与工作区证据

- **先改后测时序铁律**：所有作为验收依据的检查必须在**最后一次源码/测试编辑之后**执行（Main 核对检查日志时间不早于改动文件修改时间或最后一次 `edit`）；检查完成后若又发生了任何源码修改，原日志失效，必须重跑受影响检查。
- **复用同版本日志**：Implementer 已在最新代码上运行并通过的基础检查与集成检查（如 `pnpm verify`、隔离集成测试），只要日志与退出码完整真实，Main 与 Reviewer 直接核验并复用日志；独立 Tester 仅在存在 Implementer 未覆盖的独立环境或端到端场景时派发。
- 后续局部改动未触及已验证模块时，只运行受影响的增量检查并说明复用依据。

### 状态与生命周期覆盖

功能涉及异步数据流（如 SSE / WebSocket）、订阅、缓存、可恢复状态或多消费方派生状态时，方案与回归测试须覆盖完整状态生命周期：

- **关键状态转换**：初始空态、运行中增量/替换、正常终态、失败/中止异常终态、页面刷新或重连恢复，以及切换上下文时的旧值隔离。
- **测试输入合法性**：新增测试复用项目 typed fixture 或真实构造器，确保输入满足生产代码的领域不变量，避免用强制类型断言构造违反不变量的畸形状态。

### 共享检查入口

所有作为验收依据的检查命令统一通过 [run-check.sh](../scripts/run-check.sh) 执行（预先确保日志父目录存在）：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/run-check.sh" /absolute/task/subtasks/implement/evidence/verify.log pnpm verify
```

- 命令需带环境变量时写成 `env VAR=x <命令>`，否则会被当作命令名。
- 将其作为单次工具调用的最后一条命令（后面不接管道或附加命令），使工具退出码等于真实 `check_exit`。
- 预期失败测试（`red`）保留非零退出码并在报告中标明 `EXPECTED FAIL`。后台长任务必须在原上下文 `wait` 拿到最终退出码后才算验证完成，仅拿到启动 PID 标为 `NOT VERIFIED`。

### Git 原生证据

- **干净基线（默认）**：初始工作区干净（或既有脏文件已列入 `Excluded Paths` 保持未动）时，直接以 `Base Commit`、`git status --porcelain -uall`、`git diff <Base Commit>`、新增未跟踪源文件本身及先改后测日志作为验收事实源。
- **重叠脏路径 / 并发写入保护（按需）**：仅当获授权修改任务前已脏的重叠文件，或存在多写入者并发风险时，使用 [evidence-snapshot.sh](../scripts/evidence-snapshot.sh) 保存基线与未跟踪文件副本（含完整源文本以便逐行 `diff -u`）：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/evidence-snapshot.sh" <base> /absolute/task/workspace-baseline [-- <paths>...]
bash "$AGENT_WORKBENCH_ROOT/scripts/evidence-snapshot.sh" --verify /absolute/task/workspace-baseline
```

## 3. 独立跨家族 Review

所有 L2 代码变更默认执行 **1 轮跨模型家族 Primary Review**（Reviewer 模型家族与 Implementer 不同，见 `core/model-routing.md` §4）：

- **输入与方式**：Reviewer 以工作区当前源码与 `Base Commit` 的完整 `git diff`、本次新增未跟踪文件的全文 `read`、原始需求与已确认决策，以及 Implementer 的测试日志为主进行审查（仅在跨文件调用方不明时定点补查 `codegraph`）；保持只读，输出 `review.md`。Reviewer 不写代码树指纹；Review 完成且 Implementer 已停止后，由 Main 在仓库根运行 `bash "$AGENT_WORKBENCH_ROOT/scripts/gate.sh" tree <Base Commit>`，写入 `overview.md` 的 `Reviewed Tree: <hash>`（Review 覆盖的代码树指纹，按文件内容计算，提交前后不变）。
- **审查重点**：需求与父 Spec 一致性（含配套 ADR / `GLOSSARY.md` / 文档同步要求）、状态生命周期与异常边界、数据/接口契约安全，以及**新增测试输入的真实合法性与关键断言覆盖**。
- **Finding 分级**（格式：`ID | Severity | File:Line | Issue | Evidence | Suggested Fix`）：
  - **P0**：核心功能失效、崩溃，或严重的数据损坏、安全、权限、契约破坏。
  - **P1**：明确行为缺陷、需求遗漏，或关键测试无效以致掩盖实质风险。
  - **P2**：局部代码风格、非阻断可访问性或防御增强建议——记录到最终报告 `Unresolved`，不进入自动修复循环，Main 也不得在 Review 之后顺手修改生产代码（但若某条 P2 指向本任务 Spec 明确要求的文档/ADR 交付缺口，Main 须在本任务提交前补齐或请用户明确决定拆单，不得静默搁置后直接报 `PASS`）。
- **争议裁决**：对 Reviewer 提出的争议项，Main 直接结合当前源码、Diff 与测试证据裁决，驳回 P0/P1 或对规格措辞的不同理解须在 `decisions.md` 记一行（Finding / 决定 / 证据）；涉及业务语义未定义的交用户 Clarify。仅当涉及高危安全、资金或不可逆迁移且单轮 Review 仍无法确认风险时，Main 可按需增派一次另一跨家族模型做定向复核。

## 4. 视觉验收与增量重截

`Visual Implementation` 任务的实际执行者必须加载 `skills/ui-impl/SKILL.md`（REQUIRED）：

- 在真实浏览器中渲染目标页面，保存截图并**由具备视觉能力的模型实际读取截图完成比对**（未读图时视觉状态标为 `NOT VERIFIED`）。
- 受控网络替身或夹具渲染的截图须如实标明来源，与真实后端/流式链路证据区分记录。
- **增量重截原则**：在修复轮次或 Developer Review 微调时，仅重新截取受本次改动影响的页面/组件状态截图，其余未受影响状态复用已有同条件截图并注明范围。

## 5. Gate 与修复

测试与 Primary Review 完成后进入 Gate。

### 收尾快速通道（唯一定义，每任务限用 1 次）

当 Gate 唯一待处理项或 Developer Review 反馈**只改文档、ADR、`GLOSSARY.md`、注释与用户可见文案字符串**（不含源码文件中的条件、表达式和属性；报告事实笔误同理）时，允许走 1 次快速通道：

1. Main 直接用 `edit` / `write` 完成修改（或向仍在运行的原 Implementer Session 发简短指令修改）。
2. 停止修改后通过 `run-check.sh` 运行受影响检查；视觉任务按 §4 仅重截受影响状态并读图确认。
3. Main 核对完整 `git diff` 确认无顺带逻辑改动后放行，免派独立 Reviewer 复审，并运行 `gate.sh tree <Base Commit>` 把结果写入 `overview.md` 的 `Fast Lane Tree:`。
4. **逻辑与次数排除**：凡触及上述范围之外的生产代码、配置、Schema、迁移或测试文件（含条件分支、状态流转、计算公式、权限校验、接口/数据契约，不论行数多少），或已使用过 1 次快速通道后的再次修改，一律走下方定向修复与复审流程：Main 可自己小改，但必须写 `handoff-fix-<n>.md`，并由原 Reviewer 复核增量、产出 `review-fix-<n>.md`，Main 随后更新 `overview.md` 的 `Reviewed Tree:`。用户在 Review 之后追加或推翻设计（规格变更）同样适用，已有 Review 对变更部分作废。

### P0/P1 实质缺陷定向修复

1. 属于需求/决策未定义的边界行为时，Main 先向用户 Clarify 并记入 `decisions.md`，不计入缺陷修复轮次。
2. 明确 P0/P1 代码缺陷：按 `core/workflow.md` §5 复用原 Implementer Session 发送增量修复消息，停止修改后运行针对性单测与必要检查，写入简短 `handoff-fix-<n>.md`。
3. 复用原 Reviewer Session 仅对本轮增量改动做定向复核，确认原 P0/P1 已关闭且无新回归。
4. 实质缺陷修复最多 **2 轮**；第 2 轮后仍存在未解决 P0/P1 时停止循环，标记 `BLOCKED` 并报告用户。

**Gate 放行条件**：`overview.md` 的 `Reviewed Tree`（或 `Fast Lane Tree`）等于当前代码树，全部验证日志均晚于最后一次代码编辑，必需检查 `check_exit=0`，P0/P1 Finding 清零，Spec 要求的配套文档/ADR 已齐备（或经用户明确同意延后），且每条原始验收条件均已对应到通过的测试或已读核验的截图。

## 6. Developer Review 衔接、Main 验收与最终报告

- **严禁跳过 `REQUIRED` 的 Developer Review**：Gate 放行后，凡 `Developer Review: REQUIRED` 的任务（如涉及 UI 行为、共享契约、数据库迁移或 ADR 修订），Main **必须先停在 `Verdict: NEEDS DEVELOPER REVIEW`**，保留子 Agent Pane 并按 `core/references/developer-review.md` 呈现审阅摘要等待开发者明确批准；**未获批准前严禁调用 `cleanup-agents.sh` 或直接报 `Verdict: PASS`**；用户的批准须记入 `overview.md` 的 `Developer Review: REQUIRED — APPROVED`。
- **最终验收与回收**：所有必需验收条件满足、Gate 放行且必要的 Developer Review 已获明确批准后，Main 同步更新 `overview.md` 最终状态（Verdict 与 `Models & Usage` 成本汇总以 `overview.md` 为准，聊天里的最终报告可精简），用 `scripts/cleanup-agents.sh --task-root <Task Root> --prefix <prefix>` 回收子 Agent 与 Pane（脚本先运行 `gate.sh check`：状态未终态、缺 `Models & Usage`、`decisions.md` 仍有 `PROPOSED`、`REQUIRED` 未批准或 Review 已过期时退出码 `5` 且不回收），再输出最终报告（后续用户要求「完善/关闭 Issue」时，严格按项目 Tracker 规范一次完成勾选、评论、标签替换与关闭并做回读核验）：

```text
Verdict: PASS / BLOCKED / NEEDS USER DECISION / NEEDS DEVELOPER REVIEW

- Check: <核心验收项> — <结果与关键证据路径>

Models & Usage:
- Main: <Runtime / Model / Thinking> (<tokens / cost>)
- Subagents: <各角色实际 Model 与汇总 cost；未知注明原因>

Visual / External: <关键截图路径、外部 Issue 更新状态，不适用填 N/A>
Developer Review: <REQUIRED / RECOMMENDED / NOT REQUIRED> — <APPROVED / PENDING / N/A>
Unresolved / Next: <保留的 P2 项、覆盖限制或后续建议；无则 None>
```

## 7. 知识沉淀、异常复盘与阶段预算

### 知识沉淀

Acceptance 达成最终结论后，Main 按 `core/project-memory.md` §3 判断准入（常规任务默认 `SKIP`）；记忆结果不改变业务 Verdict。

### 按需异常复盘

当任务出现同一问题连续两轮修复失败、模型路由错误、成本异常偏高或流程严重受阻时，Main 在 `overview.md`（或独立 `retro.md`）简要记录根因与改进措施；未经用户明确同意，不得通过降低原验收标准放行。

### 阶段预算

Main 使用 `scripts/wait-agent.sh` 默认有界等待（单次约 4 分钟返回，见 `runtimes/README.md`），收到 `still_working`（退出码 `1`）时自动续等，在停滞（退出码 `3`）或触及费用上限（退出码 `4`）时立即介入：

| 阶段 | 参考预算 | 停滞介入信号 |
|---|---:|---|
| Research / Review / Test | 15–20 分钟 | 连续两次探测无新进展或输出 |
| Implement（常规 / 视觉） | 45–60 分钟 | 15 分钟内无任何代码/测试修改或阻塞报告 |
| 定向修复（每轮） | 15 分钟 | 10 分钟内未跑通针对性单测 |
