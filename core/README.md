# Core Documents

Core 定义跨 Agent Runtime 通用的任务规则。按以下方式维护唯一事实来源：

| 文件 | 权威范围 |
|---|---|
| `workflow.md` | Main 角色、整体执行阶段、规则加载和门禁顺序 |
| `task-classification.md` | 任务级别、类型、流程选择、L1 升级与 Plan 触发条件 |
| `model-routing.md` | Main / 子 Agent 模型偏好、Thinking、运行时解析与升级 |
| `permissions.md` | Agent 职责、工作区权限、并行、安全和外部副作用 |
| `task-contract.md` | 委派字段、报告路径、`overview.md` / `decisions.md` / `handoff.md` 产物结构和子 Agent 状态 |
| `acceptance.md` | Test、AI Review、Gate、Developer Review、修复、最终验收、知识更新、报告与预算 |
| `templates/` | 任务总览、决策记录和实现交接的标准模板 |
| `references/code-retrieval.md` | 仓库代码检索和证据策略 |
| `references/review-escalation.md` | Blind Review、Finding 合并和定向裁决 |

修改一项规则时只改其权威文件；其他文档通过链接或引用使用规则，不复制完整规则表。Runtime 专属 Skill 命令映射和 Herdr 调度方式维护在 `runtimes/README.md`；Core 只使用逻辑 Skill 名称。
