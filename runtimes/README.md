# Runtime 适配

Adapter 负责入口加载、Skill 调用语法与 Herdr 进程调度；任务分级、权限、自包含 Contract 与验收规则由 `core/` 唯一定义。

## 入口与准备

| Runtime | Main 入口 | 默认位置 |
|---|---|---|
| Claude Code | `/workflow <目标>`，Skill | `~/.claude/skills/workflow/SKILL.md` |
| Pi | `/workflow <目标>`，Prompt Template | `~/.pi/agent/prompts/workflow.md` |

Main 与子 Agent 通过 `AGENT_WORKBENCH_ROOT` 定位本仓库。同一任务直接说「继续」或调整目标，沿用原 Task ID 与 Task Root（`core/workflow.md` §2）。调用陌生的 CLI 子命令前先运行 `--help`；调用延迟加载或未展开声明的 MCP 工具前，先从工具搜索返回结果核对准确参数名。

## Skill 调用

自包含 Task Contract 是默认执行路径；Skill 仅作按需专项能力（如视觉实现 `ui-impl`）。

| 场景 | 语法 / 责任 |
|---|---|
| Claude Code Main | 用户显式调用 `/skill-name`；允许模型自动调用的按需读取 |
| Pi Main | 用户显式调用 `/skill:name <请求>`；允许模型加载的可直接读 `SKILL.md` |
| Herdr → Pi 子 Agent | Main 通过 `agent prompt` 发送单行指令与 Contract 绝对路径 |

### 来源绑定

Contract `Skills` 字段中的绝对 Source Path 是唯一权威正文来源。已安装的全局 Skill 指向一致时可直接用 `/skill:name` 显式命令展开；若全局副本版本不一致且允许模型读取，直接发送普通指令让子 Agent 读取指定绝对路径 `SKILL.md`。

### Pi 显式委派协议

1. Main 将自包含 Contract（含内联 `Role Rules`）写入 Task Root。
2. 常规任务直接发送单行指令（不带 `--wait`）：

```text
读取并按 Contract 执行与交付：<Contract 绝对路径>
```

3. 需要显式展开已同步 Skill 时，名称后保留普通空格并在同一行附上 Contract 路径：

```text
/skill:ui-impl 读取并按 Contract 执行与交付：<Contract 绝对路径>
```

## Herdr → Pi 调度协议

1. **创建与复用 Pane**：创建 Shell Pane 时加 `--no-focus` 保持用户焦点；复用策略与新建边界遵循 `core/workflow.md` §5。
2. **启动与定位 Session**：`herdr agent start` 显式传入 `--provider`、`--model` 与 Thinking 参数。提交 `agent prompt` 后用 `herdr agent get <agent>` 确认 `working`，并从其返回的 `agent_session.value` 读取准确的 `.jsonl` Session 路径。
3. **默认有界等待与持续推进（保活缓存 + 防超时）**：在目标仓库根调用 [wait-agent.sh](../scripts/wait-agent.sh)。脚本默认每轮等待约 4 分钟（`interval=120`、`max-cycles=2`，既低于宿主 300s Bash 超时，又在 5 分钟 Prompt Cache 有效期内返回保活），即使只传前 3 个参数也安全有界：

```bash
bash "$AGENT_WORKBENCH_ROOT/scripts/wait-agent.sh" <agent> <session-jsonl|-> <evidence-dir> [120] [2] [费用上限] [2]
```

   - 返回 `0`（`agent_done`）：子 Agent 本轮已完成，Main 立即读取交付报告进入下一阶段。
   - 返回 `1`（`still_working`）：子 Agent 正在推进但尚未完成——**Main 在当前回合内立即再次调用同一 `wait-agent.sh` 命令继续等待，严禁提前结束回合让用户盯屏等待**。
   - 返回 `3`（`stalled`）：连续两个周期无新进展（Session、Diff 与证据目录均无变化），立即发送检查点指令介入。
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
