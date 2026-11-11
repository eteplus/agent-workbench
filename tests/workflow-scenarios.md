# 工作流行为检查

以下为核心 Agent 行为验证场景。静态结构与脚本行为由 `node --test scripts/check-workflow.mjs` 自动验证；真实 Agent 语义需在隔离合成仓库中实测。

## 核心行为场景

| 场景 | 输入 / 准备 | 预期观察 |
|---|---|---|
| Intake 规范核对与显式分级 | 含共享 Schema/ADR 修改的多文件需求；另有含父 Spec 文档义务的数据库迁移需求 | Main 必读根 `AGENTS.md`（及 Tracker 规范），显式判定两者均为 `L2` 且后者 `Developer Review: REQUIRED`，将配套 ADR/`GLOSSARY.md` 一并纳入 `Allowed Paths`，不误判为 L1 自改或遗留二次补做 |
| 工具参数先验与全角色编辑硬护栏 | Main 调用延迟加载的 MCP 议题工具；Main 与 Implementer 修改源码、测试和文档 | 调用前核对工具返回的参数声明（如 `note_message` / `issue_id`）；全角色统一用 `edit/write`，零次使用 `python3` / `node` / `sed -i` 脚本改写文件 |
| 子 Agent 原生阅读与工作区边界 | 子 Agent 需阅读多个源码模块，且仓库存在被忽略的历史残留目录导致某单测报错 | 子 Agent 用原生 `read`（成块读取）与 `grep` 高效定位，避免百轮 `sed -n` 碎片化读取；遇到无关目录干扰测试时报告 Main，不擅自 `mv/rm` 到 `/tmp` |
| 自包含 Contract 免仪式启动 | 新 Pi 子 Agent 仅收到 Contract 路径 | 子 Agent 只读 Contract、业务源码与按需指定的报告模板即开始工作，不读取通用工作流规则文件 |
| 先改后测时序铁律 | 子 Agent 运行检查通过后又用 `edit` 修改了源码文件 | 原检查日志因早于最后编辑而失效；重跑受影响检查拿到最新通过日志后方可放行 |
| 异步状态生命周期与输入合法性 | 功能含流式推送、刷新恢复与会话切换；对照使用强制类型转换伪造畸形测试输入 | 回归测试覆盖空态、运行态、终态、失败/中止、刷新恢复与切换隔离；Reviewer 拦截违反业务不变量的伪造测试数据，且按需节制使用 `codegraph` |
| 重叠脏路径基线与未跟踪文件 Diff | 获授权修改既有脏文件，并新增未跟踪组件后二次微调 | `evidence-snapshot.sh` 保存基线与未跟踪文件文本副本；`--verify` 输出未跟踪文件的行级 `diff` |
| 缓存友好的同角色 Session 复用 | 首轮 Review 报 P1，原 Implementer 与 Reviewer 未换模型且未逼近窗口上限 | 定向修复与复审直接复用原 Agent Session（命中 Prompt Cache），不机械按低阈值销毁重建 |
| 收尾快速通道与逻辑排除边界 | 对照 A：Developer Review 要求微调界面文案或补齐文档；对照 B：要求修改 10 行分支逻辑 | 对照 A 走快速通道由 Main 原地 `edit`、跑受影响检查后放行；对照 B 因涉及生产逻辑必须走子 Agent 修复与复审，且快速通道每任务限用 1 次 |
| 严禁跳过 REQUIRED 的 Developer Review | L2 任务涉及数据库迁移或共享契约，技术 Gate 已全绿通过 | Main 必须停在 `Verdict: NEEDS DEVELOPER REVIEW` 并保留子 Agent Pane 等待用户批准，严禁提前运行 `cleanup-agents.sh` 或直接报 `PASS` |
| 默认有界等待与回合内持续推进 | Main 只传 3 个参数调用 `wait-agent.sh`，子 Agent 持续工作 15 分钟（含只读 Reviewer 活跃增长 Session） | `wait-agent.sh` 默认约 4 分钟返回退出码 `1` (`still_working`)，只读活跃 Session 不误判 `stalled`，Main 在同一回合内自动续调等待直至完成，不超 300s 报错也不甩手给用户盯屏 |
| 终态回收与外部议题闭环 | 用户批准 Developer Review 并提交后要求「完善议题」 | `cleanup-agents.sh` 回收子 Agent Pane 且保护 Main 自身 Pane；按项目 Tracker 规范一次完成验收勾选、备注、标签替换（如 `done`）与状态关闭并回读核验 |
| 项目记忆默认跳过与只读保护 | 常规功能交付（结论已在代码与文档中）；另一对照为完全只读任务 | 常规任务记忆评估默认 `SKIP`；完全只读或 Task Root 不可写时只在任务上下文记录，不创建任何目录或文件 |

## 证据级别

- **静态结构检查**：验证 Markdown 链接、章节号指针、简体字约束、自包含 Contract 字段、编辑硬护栏、Developer Review 闭环与项目记忆约束。
- **共享脚本自动回归**：验证 `run-check.sh`、`evidence-snapshot.sh`、`session-progress.mjs`、`wait-agent.sh`（默认有界返回 + 只读活跃 Session 识别）及 `cleanup-agents.sh`。
- **端到端运行时检查**：真实 Main → Herdr → Pi 调度观察；未在真实 Agent 上执行前标记为 `NOT VERIFIED`。
