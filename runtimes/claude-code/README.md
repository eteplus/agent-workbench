# Claude Code 适配

当前 Claude Code Session 担任 Main，规划、决策和验收；L2 代码实现与需要独立执行的 Research / Review / Test 通过 Herdr → Pi 子 Agent 完成。

## 安装

```bash
pnpx skills add "$AGENT_WORKBENCH_ROOT/runtimes/claude-code" \
  --skill workflow --agent claude-code --global
```

选择 Symlink 后使用 `/workflow <目标>`；源文件为 `workflow/SKILL.md`。

## 使用与续接

入口遵循 `core/workflow.md` §2：同一任务重复调用或恢复仍使用原 Task ID、产物根目录和决策。后续直接说「继续」即可；用户访谈与批准始终在 Main。

Claude Code Skill 调用和 Herdr → Pi 单行 Contract 派发统一见 [`../README.md`](../README.md)；上游 Skill 的安装、前置条件和 bundled `code-review` 冲突见 [`../../skills/README.md`](../../skills/README.md)。用户显式调用型 Skill 需要用户手动输入命令，未指定时按 Core 执行。

## Runtime 注意事项

- Main 记录当前 Session 可核实的实际模型信息；Pi 的 Thinking 参数不直接控制 Claude Code。
- Claude Code Agent / Task 能力不自动替代 Core 指定的 Herdr → Pi 委派；只有用户明确要求或 Adapter 明确允许时改变路径。
- 两个 Main Runtime 使用同一套产物、授权和验收规则；Adapter 不重复维护模型表、权限矩阵或修复轮数。
