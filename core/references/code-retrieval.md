# Code Retrieval Reference

适用于 Main Agent、Repo Researcher、Implementer、Reviewer 和 Tester。需要跨文件代码分析时，通过 Task Contract 将本文件传给实际执行的 Agent。

## Tool Selection

| 工具 | 适用场景 |
|---|---|
| CodeGraph | 跨文件符号关系、调用链和变更影响分析 |
| `rg` | 精确文本、标识符、配置键和引用搜索 |
| `fd` | 文件名、目录和路径定位 |
| `Read` | 读取源码、文档和必要上下文 |
| `sed` | 已知文件路径和行号后的局部片段提取 |

CodeGraph 使用 [@colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)，属于可选检索增强。按当前 Runtime 暴露的 MCP Schema 或 CLI Help 使用；未安装或不可用时，使用 `rg` / `fd` / `Read` 继续工作。

## Retrieval Rules

1. 跨文件结构、调用链或影响分析优先使用 CodeGraph；简单文本和路径问题直接使用 `rg` / `fd`。
2. 搜索结果用于定位候选代码。对关键实现结论、Review Finding 和影响范围，核对当前工作区源码、Git Diff 和测试证据。
3. 图谱索引可能落后于工作区。出现过期提示时，按 CodeGraph 当前文档更新索引；无法确认索引状态时，以当前源码和确定性检索为准。
4. CodeGraph 不可用时回退到 `rg` / `fd` / `Read`，只在影响覆盖范围时说明限制。
5. `sed` 只用于已知路径和行号后的局部读取，不作为仓库发现或主要搜索工具。

## Evidence

Research、Implement、Review 和 Test 的代码事实应尽可能包含文件路径、符号、行号及支持结论的源码 / Diff / 测试证据。图谱推断和模型摘要不能单独证明实现行为。
