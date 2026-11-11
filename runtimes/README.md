# Runtime 适配

Adapter 负责入口加载、Skill 语法和运行时调度；任务生命周期、权限、产物和验收由 Core 定义，不在各入口重复维护。

## 入口与准备

| Runtime | Main 入口 | 默认位置 |
|---|---|---|
| Claude Code | `/workflow <目标>`，Skill | `~/.claude/skills/workflow/SKILL.md` |
| Pi | `/workflow <目标>`，Prompt Template | `~/.pi/agent/prompts/workflow.md` |

Main 和 Pi 子 Agent 通过 `AGENT_WORKBENCH_ROOT` 定位同一份仓库。入口验证环境变量和 Core。GUI / Herdr 已运行进程不一定继承后来修改的 Shell Profile。路径无效时先修配置。安装步骤见各 Adapter README。

同一任务直接说「继续」或调整目标，重复 `/workflow` 也按 `core/workflow.md` §2 续接；不要求用户逐阶段输入命令。Session 恢复读取该任务总览和必要规则，不扫描无关历史。

Herdr 调用前检查当前 CLI Help / MCP Schema，并确认可用 Shell Pane。`agent start` 不创建 Pane；布局创建响应中的 ID 是后续调用的唯一依据。推荐 Pi Integration 提供 Session 身份和状态；缺失时仍可使用明确的文件交付，不以读屏代替验收。

## Skill 调用

Core / Task Contract 是默认执行路径，Skill 是按需专项能力，不另起 Workflow。

| 场景 | 语法 / 责任 |
|---|---|
| Claude Code Main | 用户显式调用 `/skill-name`；模型自动调用仅限 Runtime 和 Skill 明确支持时 |
| Pi Main | 用户显式调用 `/skill:name <请求>`；允许模型加载的 Skill 可直接读取其 `SKILL.md` |
| Herdr → Pi 子 Agent | Main 通过 `agent prompt` 发送下面的单行命令与 Contract 路径 |

`disable-model-invocation: true` 的 Skill 仅允许显式命令，不标为模型自主调用。`grilling` / `grill-with-docs` 等需要用户回答的能力留在 Main；非交互的领域分析或文档 Review 可独立委派。上游依赖和安装分流见 `skills/README.md`。

### 来源绑定

Contract 的绝对 Source Path 是本次 Skill 正文来源。Main 核对发现路径的真实指向；副本须核验正文与本次所需参考文件一致，名称一致不代表版本一致。仅来源已匹配时使用下方 `/skill:name` 显式命令。

模型允许加载的 Skill 来源不匹配时，发送普通 Contract 消息，要求执行者直接读取指定文件，并使用 RUNTIME_AUTO；避免显式命令先展开旧副本。用户显式调用型不能借此绕过调用限制；需要匹配来源的注册或用户调用，安装调整仍须授权。

```text
读取 Contract：<Contract 绝对路径>；先读取 Skills 的绝对 Source Path，再按 core/task-contract.md §1 完成启动核验后执行并交付。
```

### Pi 显式委派协议

1. Main 将 Contract 写入 Task Root，填写实际绝对来源、输入、交付与输出位置；按 `core/task-contract.md` §1 完成派发核对，并按上方来源绑定选择消息形式。Task Root 不用于推断代码仓库或 Workbench 位置。
2. 目标 Agent ready 且没有旧工作运行时才提交新任务。Core 路径直接发送「读取 Contract：<Contract 绝对路径>；按 core/task-contract.md §1 完成启动核验后执行并交付」。
3. 需要显式 Skill 时，发送一条单行消息，Skill 名称后必须有普通空格，完整任务输入通过 Contract 路径提供：

   ```text
   /skill:ui-impl 先读取 Contract：<Contract 绝对路径>；按 core/task-contract.md §1 完成启动核验后，按 Contract 执行并交付。
   ```

   上游 `implement` 确实适用时，传入其需要的 Spec / Ticket 引用，同时在同一行附 Contract 路径；先确认 `skills/README.md` 的 Tracker / fixed point 与权限条件。

4. Skill 命令与 Contract 放在同一条消息中提交：显式 Skill 会立即启动 Agent，而非单纯加载。当前 Pi 按普通空格分隔命令名称，换行紧跟名称的多行命令可能不展开；这一兼容限制应在升级 Pi 时重新验证。未知 Skill 可能原样传入模型，因此必须检查加载证据。
5. 启动核验的顺序和完成条件以 `core/task-contract.md` §1 为准。Pi Skill 展开以实际加载事件为证；失败语义仅在 Core 定义。

长 Contract 放文件而不是拼入命令；路径包含空格时保持完整并明确为一个路径。Contract 约束应与所选 Skill 前置条件一致；发现冲突先报告 Main，不能先执行后补权限。

## Herdr → Pi 调度与证据

以下是顺序说明，不是固定脚本；实际参数按当前安装版本核实：

1. 创建或选择可用 Shell Pane，保存响应中的 Pane ID，保持用户焦点。
2. 显式指定子 Agent 模型与 Thinking 启动 Pi；核验方法见 `core/model-routing.md`。Session 复用边界以 `core/workflow.md` §5 为准：换模型或上下文过大时不用 `--session` 接续旧文件，不能只重命名 Agent 或向原 Research Session 追加实施 Contract；可复用空闲 Pane，但须核验新的 Pi Session 身份。
3. 提交 Contract 路径（或上述单行 Skill 命令）时不要带 `--wait`：`agent prompt` 成功只代表已写入，之后用 `agent get` 确认 `working`。用 1 秒级 `--wait` 探活只会拿到必然的 timeout 非零退出，把正常投递显示成错误。
4. 阻塞等待用一次工具调用完成：`bash "$AGENT_WORKBENCH_ROOT/scripts/wait-agent.sh" <agent> <子 Agent Session 文件> <该角色证据目录> 300 2 [费用上限]`（在目标仓库根运行，工具超时设得足够长）。脚本内部每 5 分钟 `agent wait` 一次并探测 Diff、证据目录和 Session 费用，只在完成（0）、连续两次探测没有新改动或新证据（3）、达到费用上限（4）或 Herdr 报错（2）时返回，等待期间不占用 Main 回合。返回 3 时立即向子 Agent 发送检查点指令，不等阶段预算到期；返回 4 时按 `core/model-routing.md` §5 向用户简报。阶段「首个产出」时限早于停滞判定时，可用更小的间隔。状态等待不跟踪具体任务，旧 turn 的完成不能算新任务的完成。
5. 本任务有子 Agent 处于 working 时，Main 继续等待并推进，不结束当前回合；只在需要用户决策或用户要求暂停时结束，并在简报中列出仍在运行的 Agent 与续接方式。
6. `agent get` / 结构化 API 用于协调运行、阻塞和 Session 身份；指定报告、源码、Diff 和真实检查结果用于验收。先核对 Task / Subtask ID 与交付内容，再判断本次完成。
7. 超时 / stalled 后先检查原 Agent 的状态和产物；仍在运行则继续观察原任务，不补发。若结果未知，暂停重发并报告。恢复规则见 `core/references/recovery.md`。
8. 产物缺失、状态矛盾、Skill 加载异常或需要核对必需输入是否已读时，读取目标 Agent 提供的 `PI_SESSION_FILE`，或 `agent get` 的 `agent_session.value`（以当前 Schema 为准）；`session-progress.mjs <文件> --reads` 列出已读路径，其余只查看相关输入、工具结果和状态事件。Main 的 Session 路径不能替代子 Agent 的路径。
9. TUI `agent read` / `pane read` 仅排查终端问题；不是用户批准、Skill 展开或任务完成的证据。阻塞需要用户决策时回到 Main；终端权限 / 登录对话只在明确授权后处理，未知对话不得自动批准。
10. 仅清理本任务创建且不再需要的 Pane / Session，保留本地证据和仍需恢复的 Session。

## 新增 Runtime

入口接入 `core/workflow.md` 的任务启动 / 续接协议，Adapter 定义 Skill 调用、模型核验、结构化状态和文件交付方式。两个 Runtime 使用同一 Core；不复制分级、权限矩阵、模型表和验收规则。

## 参考资料

- [Herdr Agent Automation](https://herdr.dev/tui/docs/agent-automation/)
- [Herdr Integrations](https://herdr.dev/tui/docs/integrations/)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Pi Prompt Templates](https://pi.dev/docs/latest/prompt-templates)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
