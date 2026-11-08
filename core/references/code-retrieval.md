# 代码检索

适用于 Main、Repo Researcher、Implementer、Reviewer 和 Tester。需要跨文件代码分析时，通过 Task Contract 将本文件传给实际执行的 Agent。

## 工具选择

| 工具 | 适用场景 |
|---|---|
| CodeGraph | 跨文件符号关系、调用链和变更影响分析 |
| `rg` | 精确文本、标识符、配置键和引用搜索 |
| `fd` | 文件名、目录和路径定位 |
| `Read` | 读取源码、文档和必要上下文 |
| `sed` | 已知文件路径和行号后的局部片段提取 |

CodeGraph 使用 [@colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)，属于可选检索增强。按当前 Runtime 暴露的 MCP Schema 或 CLI Help 使用；未安装或不可用时，使用 `rg` / `fd` / `Read` 继续工作。

## 检索规则

1. 跨文件结构、调用链或影响分析优先使用 CodeGraph；简单文本和路径问题直接使用 `rg` / `fd`。
2. 搜索结果用于定位候选代码。对关键实现结论、Review Finding 和影响范围，核对当前工作区源码、Git Diff 和测试证据。
3. 图谱索引可能落后于工作区。出现过期提示时，按 CodeGraph 当前文档更新索引；无法确认索引状态时，以当前源码和确定性检索为准。
4. CodeGraph 不可用时改用 `rg` / `fd` / `Read`，只在影响覆盖范围时说明限制。
5. `sed` 只用于已知路径和行号后的局部读取；仓库发现和搜索使用上述工具。

## 消费扫描与删除证据

仅在任务依赖消费数量、零引用结论、删除或契约收缩时使用：

1. 一次性扫描器先通过覆盖本次引用形态、别名和同名异源的小型自检，再扫描仓库。
2. 数量与清单从同一结果生成；零消费证据和保留约定分别列出，未解析引用标为待确认。
3. 缺少关键证据时暂停依赖该结论的删除或收缩；基线与修改后结果遵循 `core/task-contract.md` §5–6 的写入归属，分别保存。

## 证据

Research、Implement、Review 和 Test 的代码事实应尽可能包含文件路径、符号、行号及支持结论的源码 / Diff / 测试证据。图谱推断和模型摘要不能单独证明实现行为。
