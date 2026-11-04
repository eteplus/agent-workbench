# Implementation Handoff

## Status
- Status: DONE / PARTIAL / BLOCKED / FAILED
- Actual Provider / Model ID / Thinking:
- Changed Files:
- Base Diff / Commit:
- Workspace Baseline / Overlap Handling:
- Baseline Snapshot Compared (if applicable):

## Skill Loading & Execution

记录 Task Contract 指定的 Skill 是否安装、如何显式触发、parent 是否实际加载，以及嵌套依赖是否真正执行。没有指定 Skill 时填写 `None`。

| Skill | Invocation Policy | Installed in Target Runtime | Parent Loaded | Execution Result | Evidence / Notes |
|---|---|---|---|---|---|
| `<skill-name>` | `HERDR_EXPLICIT_COMMAND` / `USER_COMMAND` / `RUNTIME_AUTO` / `CORE_FALLBACK` | YES / NO / UNKNOWN | YES / NO / N/A | SUCCESS / FAILED / SKIPPED / UNSUPPORTED / NOT VERIFIED | |

- Nested dependencies invoked / executed:
- Missing or unsupported dependencies:
- Core fallback used:
- Invocation errors or limitations:

## Implementation Summary
<本次实现做了什么。>

## Requirement & Decision Trace
| Change | Requirement | Decision ID / Origin | Rationale |
|---|---|---|---|
| | | | |

## Implementation Walkthrough

### Main Execution / Data Flow
<按真实调用顺序描述入口、关键模块、数据流和副作用；提供文件/符号/必要行号。>

### Key Abstractions, State & Domain Rules
<解释新增或修改的核心抽象、状态转换、领域规则和边界行为。>

### Important Trade-offs
<说明实现取舍、被排除方案和已知限制；实质性决策应链接 `decisions.md`。>

### Extension Guide
<后续开发者应从哪些模块、接口或扩展点继续修改。>

### Debugging Guide
<常见故障的排查入口、关键日志/状态和验证方式。>

## Contract & Compatibility
- API / Data / Event Contract:
- Compatibility / Migration:
- Security / Permission:

## Verification
| Command / Check | Result | Evidence / Notes |
|---|---|---|
| | | |

## Review Focus
- High-risk paths:
- Known gaps:
- Suggested review locations:

## Remaining Work & Limitations
- Unfinished items:
- Unverified assumptions:
- Risks:
