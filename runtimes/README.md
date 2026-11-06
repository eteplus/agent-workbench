# Runtime 适配

Adapter 负责入口加载、Skill 语法和运行时调度；任务生命周期、权限、产物和验收由 Core 定义，不在各入口重复维护。

## 入口与准备

| Runtime | Main 入口 | 默认位置 |
|---|---|---|
| Claude Code | `/workflow <目标>`，Skill | `~/.claude/skills/workflow/SKILL.md` |
| Pi | `/workflow <目标>`，Prompt Template | `~/.pi/agent/prompts/workflow.md` |

Main 和 Pi 子 Agent 通过 `AGENT_WORKBENCH_ROOT` 定位同一份仓库。入口验证环境变量和 Core。GUI / Herdr 已运行进程不一定继承后来修改的 Shell Profile。路径无效时先修配置。安装步骤见各 Adapter README。

同一任务直接说“继续”或调整目标，重复 `/workflow` 也按 `core/workflow.md` §2 续接；不要求用户逐阶段输入命令。会话恢复读取该任务总览和必要规则，不扫描无关历史。

Herdr 调用前检查当前 CLI Help / MCP Schema，并确认可用 Shell Pane。`agent start` 不创建 Pane；布局创建响应中的 ID 是后续调用的唯一依据。推荐 Pi Integration 提供 Session 身份和状态；缺失时仍可使用明确的文件交付，不以读屏代替验收。

## Skill 调用

Core / Task Contract 是默认执行路径，Skill 是按需专项能力，不另起 Workflow。

| 场景 | 语法 / 责任 |
|---|---|
| Claude Code Main | 用户显式调用 `/skill-name`；模型自动调用仅限 Runtime 和 Skill 明确支持时 |
| Pi Main | 用户显式调用 `/skill:name <请求>`；允许模型加载的 Skill 可直接读取其 `SKILL.md` |
| Herdr → Pi 子 Agent | Main 通过 `agent prompt` 发送下面的单行命令与 Contract 路径 |

`disable-model-invocation: true` 的 Skill 仅允许显式命令，不标为模型自主调用。`grilling` / `grill-with-docs` 等需要用户回答的能力留在 Main；非交互领域分析或文档审查可独立委派。上游依赖和安装分流见 `skills/README.md`。

### Pi 显式委派协议

1. Main 将完整 Contract 写入当前 Task Root（细分时放 `subtasks/<id>/contract.md`），指定 Repository Root、唯一交付文件、绝对允许写入路径、必要依赖和前置条件；按 `core/task-contract.md` §1 核验必需规则可访问或摘录完整。Task Root 是产物位置，不能用来推断代码仓库或 Workbench 的位置。
2. 目标 Agent ready 且没有旧工作运行时才提交新任务。Core 路径直接发送“读取 Contract 及其必需规则：<Contract 绝对路径>，记录加载证据后按契约执行并交付”。
3. 需要显式 Skill 时，发送一条单行消息，Skill 名称后必须有普通空格，完整任务输入通过 Contract 路径提供：

   ```text
   /skill:ui-impl 先读取 Contract：<Contract 绝对路径>；核对所需 Skill、依赖、权限和输入后，按契约执行并交付。
   ```

   上游 `implement` 确实适用时，传入其需要的 Spec / Ticket 引用，同时在同一行附 Contract 路径；先确认 `skills/README.md` 的 Tracker / fixed point 与权限条件。

4. 不把“裸 Skill 加载”与 Contract 拆成两次提交：显式 Skill 会立即启动 Agent，不是纯加载动作。当前 Pi 按普通空格分隔命令名称，换行紧跟名称的多行命令可能不展开；这一兼容限制应在升级 Pi 时重新验证。未知 Skill 可能原样传入模型，因此必须检查加载证据。
5. 子 Agent 开始实际工作前按 `core/task-contract.md` §1 完成必需规则和能力核验。Pi 消息是否展开，以当前展开结果和实际加载证据为准；失败语义与 REQUIRED / OPTIONAL 处理只在 Core 定义。

长 Contract 放文件而不是拼入命令；路径包含空格时保持完整并明确为一个路径。Contract 约束应与所选 Skill 前置条件一致；发现冲突先报告 Main，不能先执行后补权限。

## Herdr → Pi 调度与证据

以下是顺序说明，不是固定脚本；实际参数按当前安装版本核实：

1. 创建或选择可用 Shell Pane，保存响应中的 Pane ID，保持用户焦点。
2. 显式指定子 Agent 模型与 Thinking 启动 Pi；核验方法见 `core/model-routing.md`。Research → Implement 的新 Session 边界以 `core/workflow.md` §5 为准，不能只重命名 Agent 或向原 Research Session 追加实施 Contract；可复用空闲 Pane，但须核验新的 Pi Session 身份。
3. 提交 Contract 路径（或上述单行 Skill 命令）时不要带 `--wait`：`agent prompt` 成功只代表已写入，之后用 `agent get` 确认 `working`。用 1 秒级 `--wait` 探活只会拿到必然的 timeout 非零退出，把正常投递显示成错误。
4. 需要阻塞等待时用一个贴近任务实际时长的 `--wait` / `agent wait`（例如 `--timeout 600000`），而不是反复 120 秒轮询；状态等待不跟踪具体任务，旧 turn 的完成不能算新任务的完成。
5. `agent get` / 结构化 API 用于协调运行、阻塞和 Session 身份；指定报告、源码、Diff 和真实检查结果用于验收。先核对 Task / Subtask ID 与交付内容，再判断本次完成。
6. 超时 / stalled 后先检查原 Agent 的状态和产物；仍在运行则继续观察原任务，不补发。若结果未知，暂停重发并报告。恢复规则见 `core/acceptance.md` §13。
7. 产物缺失、状态矛盾或 Skill 加载异常时，读取目标 Agent 提供的 `PI_SESSION_FILE`，或 `agent get` 的 `agent_session.value`（以当前 Schema 为准），只查看相关输入、工具结果和状态事件。Main 的 Session 路径不能替代子 Agent 的路径。
8. TUI `agent read` / `pane read` 仅排查终端问题；不是用户批准、Skill 展开或任务完成的证据。阻塞需要用户决策时回到 Main；终端权限 / 登录对话只在明确授权后处理，未知对话不得自动批准。
9. 仅清理本任务创建且不再需要的 Pane / Session，保留本地证据和仍需恢复的会话。

## 新增 Runtime

入口接入 `core/workflow.md` 的任务启动 / 续接协议，Adapter 定义 Skill 调用、模型核验、结构化状态和文件交付方式。两个 Runtime 使用同一 Core；不复制分级、权限矩阵、模型表和验收规则。

## 参考资料

- [Herdr Agent Automation](https://herdr.dev/tui/docs/agent-automation/)
- [Herdr Integrations](https://herdr.dev/tui/docs/integrations/)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Pi Prompt Templates](https://pi.dev/docs/latest/prompt-templates)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
