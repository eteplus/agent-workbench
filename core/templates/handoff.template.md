# Handoff

> 本模板只提供结构：标题、字段说明与正文按 Contract 的 Output Language 生成（core/workflow.md §2）。

## 状态
- Task ID / Subtask ID:
- Output Language:
- Task Root（绝对路径）:
- 状态: DONE / PARTIAL / BLOCKED / FAILED
- 实际 Provider / Model ID / Thinking:
- 元数据来源: <自身 Pi Shell 变量 / RPC 状态 / NOT VERIFIED 及原因>
- 启动核验: <已加载的规则与输入、实际范围/输出路径、未解决项；补读如实标注（core/task-contract.md §1、§6）>
- 修改的文件:
- Base Diff / Commit:
- Implementation Evidence: <路径 + 对应实现版本 + 采集阶段 + 用途（core/acceptance.md §2）>
- Workspace Baseline / Overlap Handling:
- 已比较的 Baseline Snapshot（适用时）:

## Skill 加载与执行

记录 Contract 指定的 Skill 是否安装、如何触发、parent 是否实际加载、嵌套依赖是否真正执行。未指定 Skill 时填 `None`。

| Skill | 要求 | 调用策略 | 已安装 | 已加载 | 执行结果 | 证据 / 说明 |
|---|---|---|---|---|---|---|
| `<skill-name>` | REQUIRED / OPTIONAL | `HERDR_EXPLICIT_COMMAND` / `USER_COMMAND` / `RUNTIME_AUTO` / `CORE_FALLBACK` | YES / NO / UNKNOWN | YES / NO / N/A | SUCCESS / FAILED / SKIPPED / UNSUPPORTED / NOT VERIFIED | |

- 已调用 / 已执行的嵌套依赖:
- 缺失或不支持的依赖:
- 是否使用 Core 路径:
- 调用错误或限制:

## 实现摘要
<本次实现做了什么。>

## 需求与决策追溯
| 变更 | 需求 | Decision ID / Origin | 理由 |
|---|---|---|---|
| | | | |

## Implementation Walkthrough

### 主流程与数据流
<按真实调用顺序描述入口、关键模块、数据流和副作用；附文件/符号/必要行号。>

### 关键抽象、状态与领域规则
<新增或修改的核心抽象、状态转换、领域规则和边界行为。>

### 重要取舍
<实现取舍、被排除的方案和已知限制；实质决策链接 `decisions.md`。>

### 扩展入口
<后续开发从哪些模块、接口或扩展点继续。>

### 排查入口
<常见故障的排查入口、关键日志/状态和验证方式。>

## 契约与兼容性
- API / 数据 / 事件契约:
- 兼容性 / 迁移:
- 安全 / 权限:

## 额外写入
- 实现与指定报告之外的手工写入: None / 绝对路径 + 用途 + 授权依据
- 验证命令生成的输出位置: <按 Contract Constraints>

## 验证
- 复用的检查 / 范围 / 理由: None / 已有证据 + 未受影响范围

| 命令 / 检查 | 范围 | Implementation Evidence | 退出码 | 结果 | 完整日志 / 完成证据 |
|---|---|---|---|---|---|
| | | | | | |

- 后台检查（如有）: <PID / Session + 完成证据 + 最终退出码（core/acceptance.md §2）>

## Review 重点
- 高风险路径:
- 已知缺口:
- 建议重点查看的位置:

## 未完成事项与限制
- 未完成事项:
- 未验证的假设:
- 风险:
