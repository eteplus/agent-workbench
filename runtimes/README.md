# Runtime 适配

本文件负责各 Runtime 的入口加载、Skill 调用语法与 Herdr 进程调度；任务分级、权限、Contract 与验收规则由 `core/` 统一定义。

## 入口与准备

| Runtime | Main 入口 | 默认位置 |
|---|---|---|
| Claude Code | `/workflow <目标>`，Skill | `~/.claude/skills/workflow/SKILL.md` |
| Pi | `/workflow <目标>`，Prompt Template | `~/.pi/agent/prompts/workflow.md` |

Main 与子 Agent 通过 `AGENT_WORKBENCH_ROOT` 定位本仓库。同一任务直接说「继续」或调整目标，沿用原 Task ID 与 Task Root（`core/workflow.md` §2）。调用陌生的 CLI 子命令前先运行 `--help`；调用延迟加载或未展开声明的 MCP 工具前，先从工具搜索返回结果核对准确参数名。

## Skill 调用

独立完整的 Task Contract 是默认执行路径；Skill 仅作按需专项能力（如视觉实现 `ui-impl`）。

| 场景 | 语法 / 责任 |
|---|---|
| Claude Code Main | 用户显式调用 `/skill-name`；允许模型自动调用的按需读取 |
| Pi Main | 用户显式调用 `/skill:name <请求>`；允许模型加载的可直接读 `SKILL.md` |
| Herdr → Pi 子 Agent | Main 通过 `agent prompt` 发送单行指令与 Contract 绝对路径 |

### Skill 路径以 Contract 为准

Contract `Skills` 字段中的绝对 Source Path 是唯一权威正文来源。已安装的全局 Skill 指向一致时可直接用 `/skill:name` 显式调用；若全局副本版本不一致且允许模型读取，直接发送普通指令让子 Agent 读取指定绝对路径 `SKILL.md`。

派发前确认 Source Path 存在，并以该 `SKILL.md` 所在目录解析正文中的相对引用。找不到引用时先核对正文与实际目录，不猜其他产品或旧安装位置；按 `core/task-contract.md` §1 的 REQUIRED / OPTIONAL 规则处理。本规则只约束本工作流调用的 Skill，不调整其他产品内部流程。

### Pi 显式委派协议

1. Main 将完整独立的 Contract（含内嵌 `Role Rules`）写入 Task Root。
2. 常规任务直接发送单行指令（不带 `--wait`）：

```text
读取并按 Contract 执行与交付：<Contract 绝对路径>
```

3. 需要显式调用已同步 Skill 时，名称后保留普通空格并在同一行附上 Contract 路径：

```text
/skill:ui-impl 读取并按 Contract 执行与交付：<Contract 绝对路径>
```

## Herdr → Pi 调度协议

1. **创建与复用 Pane**：创建独立 Tab/Pane 时加 `--no-focus` 保持用户焦点；复用策略与新建边界遵循 `core/workflow.md` §5。Herdr 没有 `agent stop` 子命令；复用空闲 Pane 时先发 `herdr agent send-keys <agent> ctrl-c`（或 `herdr pane send-keys <pane-id> ctrl-c`）退出旧进程并确认回到 Shell 提示符后再 `agent start`，若 Pane 仍忙则直接新建 Tab。
2. **启动与定位 Session**：`herdr agent start` 显式传入 `--provider`、`--model` 与 Thinking 参数。提交 `agent prompt` 后用 `herdr agent get <name>` 确认 `working`，并从其返回的 `agent_session.value` 读取准确的 `.jsonl` Session 路径：

```bash
herdr tab create --cwd <Repository Root> --label <name> --no-focus
herdr agent start <name> --kind pi --pane <pane-id> -- --provider <provider> --model <model> --thinking <level>
herdr agent prompt <name> "读取并按 Contract 执行与交付：<Contract 绝对路径>"
```

3. **默认分段等待与持续推进（维持缓存 + 防超时）**：在目标仓库根调用 [wait-agent.sh](../scripts/wait-agent.sh)。脚本默认每轮等待约 4 分钟（`interval=120`、`max-cycles=2`，既低于工具单次 300s 超时，又在 5 分钟 Prompt Cache 有效期内返回以维持缓存），即使只传前 3 个参数也安全可控：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/wait-agent.sh" <agent> <session-jsonl|-> <evidence-dir> [120] [2] [费用上限] [2]
```

   - 返回 `0`（`agent_done`）：子 Agent 本轮已完成，Main 立即读取交付报告进入下一阶段。
   - 返回 `1`（`still_working`）：子 Agent 正在推进但尚未完成——**Main 在当前回合内立即再次调用同一 `wait-agent.sh` 命令继续等待，严禁提前结束回合让用户盯屏等待**。
   - 返回 `3`（`stalled`）：连续两个周期无新进展（Session、Diff 与证据目录均无变化），立即发消息要求子 Agent 汇报当前阻塞或进展。
   - 返回 `4`（`cost_limit`）：达到费用上限，暂停并向用户简报。
4. **一键回收 Pane**：到达 `core/workflow.md` §5 规定的终态回收节点时（注意 `NEEDS DEVELOPER REVIEW` 期间保留 Pane 不关闭），调用 [cleanup-agents.sh](../scripts/cleanup-agents.sh) 退出本任务子 Agent 并关闭对应 Pane（自动跳过 `HERDR_PANE_ID` 保护 Main 终端）：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/cleanup-agents.sh" --task-root <Task Root> --prefix <task-agent-prefix>
```

## 参考资料

- [Herdr Agent Automation](https://herdr.dev/tui/docs/agent-automation/)
- [Herdr Integrations](https://herdr.dev/tui/docs/integrations/)
- [Pi Skills](https://pi.dev/docs/latest/skills)
- [Pi Prompt Templates](https://pi.dev/docs/latest/prompt-templates)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
