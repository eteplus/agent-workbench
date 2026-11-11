# Handoff

> 按 Contract 的 Output Language 生成（core/workflow.md §2）。顶部状态块控制在 10 行以内。

## 状态
- Task ID / Subtask ID:
- 状态: DONE / PARTIAL / BLOCKED / FAILED
- 实际模型: <PI_PROVIDER / PI_MODEL / PI_REASONING_LEVEL>
- Base Commit 与修改文件数:
- 检查摘要: <关键检查命令与退出码>
- Skill 执行（仅指定 Skill 时填写，未指定时删去本行）:
- 未覆盖项 / 待关注风险:

## 实现摘要与 Walkthrough
- **主数据流 / 调用链**: <按真实调用顺序说明入口、核心模块与状态流转，附文件路径与关键符号>
- **关键规则与取舍**: <核心边界条件、兼容性处理及与 `decisions.md` 的对应关系>
- **扩展与排查入口**: <后续维护或排障先看哪个文件/函数>

## 修改文件清单
| 文件 | 变更意图 |
|---|---|
| | |

## 验证结果
| 命令 | 范围 | 退出码 | 结果 | 日志路径 |
|---|---|---|---|---|
| | | | | |

## 未完成事项与限制
- 未覆盖场景 / 环境限制（若发生计划外写入或偏离约束，一并披露路径与原因）:
