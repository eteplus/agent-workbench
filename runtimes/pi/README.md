# Pi 适配

当前 Pi Session 担任 Main，通过 Herdr 派发需要独立执行的 Pi 子 Agent。Main 与子 Agent 的实际模型分别按 `core/model-routing.md` 核验。

## 安装

```bash
cd "$AGENT_WORKBENCH_ROOT"
./scripts/install-runtime-links.sh
```

默认链接 `workflow.md` 到 `~/.pi/agent/prompts/workflow.md`；活动 Session 执行 `/reload` 后使用 `/workflow <目标>`。

## 使用与续接

入口遵循 `core/workflow.md` §2：新目标启动任务，同一目标继续或调整，沿用原 Task ID。用户后续可直接说「继续」。访谈和批准留在 Main，工作产物集中在该任务的一个本地根目录。

Pi 的 Skill 发现与显式调用、单行 Contract 委派、嵌套依赖和超时恢复协议统一见 [`../README.md`](../README.md)，不在此维护另一套示例。上游可选 Skill 的安装与前置条件见 [`../../skills/README.md`](../../skills/README.md)。

## Runtime 注意事项

- Prompt Template 是聊天入口，不是持久状态或权限执行器；续接依赖 Main 当前上下文和任务总览。
- `/reload` 重新发现修改后的模板 / Skill，不自动重做当前任务。
- 子 Agent 的模型、Thinking 和 Session 路径必须从目标 Agent 的实际元数据获取，不假设继承 Main。
- Core Clarify / Retro 是默认流程；显式辅助 Skill 与必要依赖不可用时，遵循 Contract 的 REQUIRED / OPTIONAL 规则。
