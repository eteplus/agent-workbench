# 任务分级

任务级别由影响范围和风险决定，任务类型由交付目标决定，两者分别判定。Main 在动手修改或派工前必须显式判定级别。

## 1. 任务级别与 Developer Review 判定

| 级别 | 判据 | 执行方式 |
|---|---|---|
| L0 | 纯文字、文案标签、注释或文档微调，无执行逻辑、接口或数据语义变化；或单一已知来源的只读查询 | Main 直接用 `edit/write` 修改或回答，核对受影响断言 |
| L1 | 非 L0；预计**单模块、不超过 3 个文件且总变更（增+删）不超过 50 行**的局部低风险修改，**不涉及共享类型/Schema、公共接口、数据库或 ADR 变更** | Main 直接用 `edit/write` 处理并通过 `run-check.sh` 运行受影响检查 |
| L2 | 非 L0/L1；跨多文件（>3 个文件或 >50 行增删）、多模块协作、新增组件/页面，或触及**共享类型/Schema、公共 API/事件、数据库迁移、ADR 契约、兼容性、安全或并发风险** | 委派 Implementer 实现，并由跨家族 Reviewer 独立审查 |

文字与文案修改按实际行为影响分级；改变代码类型、Zod/JSON Schema、数据库表结构、执行脚本或架构契约的修改（即使是删除字段）一律按 **L2** 执行。

### L1 实施中升级

Main 在直接处理 L1 时，一旦发现实际改动超出 3 个文件、增删合计超过 50 行，或触及共享 Schema、公共接口与跨模块风险：立即停止直接修改，保留已完成改动，升级为 L2 并通过 Contract 委派 Implementer 接续完成。

### Developer Review 触发判定（L2 任务必判）

Main 在 L2 Intake 阶段同步判定并记录 `Developer Review: REQUIRED | RECOMMENDED | NOT REQUIRED`：
- **`REQUIRED`**：满足任一条件——(1) 用户可见产品行为或交互界面实质变化；(2) 公共 API、事件、共享数据结构或数据库 Schema/迁移变化；(3) 架构边界、Accepted ADR 修订、安全权限或并发一致性调整；(4) 用户或 Issue/Spec 明确要求。
- **`RECOMMENDED` / `NOT REQUIRED`**：遵循既有模式的纯内部实现调整；纯 Research / Plan / Review / Test 默认 `NOT REQUIRED`。审阅包与批准流程见 `core/references/developer-review.md`。

### 收尾增量分级

L2 任务在 Gate 或 Developer Review 阶段产生的增量改动按增量自身风险判定：无生产逻辑与契约风险的微调走 `core/acceptance.md` §5 **收尾快速通道**；触及生产逻辑或契约的改动走 L2 定向修复与复审。

## 2. 任务类型

- Research
- Plan / Architecture
- Implement
- Visual Implementation（以参考图、现有页面或状态规范为准，需真实浏览器渲染与模型读图核验的 UI 实现；新增页面或组件且展示计算结果时同样适用，至少一张真实渲染截图并读图）
- Review
- Test
- Debug（先复现与定位根因；需修复时按修复本身级别执行）
- Documentation
- Issue / Ticket
- Mixed

## 3. 流程选择

| 任务类型 | 最小必要流程 |
|---|---|
| Implement (L2) | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement → Handoff → Review → Gate → Developer Review（按条件）→ Acceptance |
| Visual Implementation (L2) | Intake → Research（按需）→ Clarify（按需）→ Plan → Implement + 浏览器验证 → Handoff → Review → Gate → Developer Review（按条件）→ Acceptance |
| Implement / Visual (L0/L1) | Intake（显式确认满足 L0/L1 判据）→ Main 直接修改 + `run-check.sh` 检查 / 局部截图 → Acceptance |
| Research | Intake → Research → Acceptance |
| Plan / Architecture | Intake → Research（按需）→ Clarify（按需）→ Plan → Acceptance |
| Review / Test | Intake → Review / Test → Acceptance |
| Debug | Intake → Research（按需）→ 复现与根因诊断（`debug-report.md`）→ 如需修复按级别走 L0/L1 或 L2 实施 |
| Documentation | Intake → 修改文档 → 链接/格式检查（按需）→ Acceptance |
| Issue / Ticket | Intake（读取项目 Tracker 规范）→ Clarify（按需）→ 外部写入授权 → 写入与单次回读核验 → Acceptance |
| Mixed | 按子目标组合上述最小阶段 |

`overview.md`、`decisions.md` 与 Developer Review 在 L2 任务中按对应条件启用。

## 4. 方案要求

L2 代码变更满足以下任一条件时写入独立的 `plan.md`，否则直接合并进 Contract 的 `Context & Plan`：

- 预计涉及 3 个及以上业务源码文件。
- 包含 API、SSE 事件、共享状态或数据库契约变化。
- 涉及数据迁移、兼容性、安全或并行实施。

`plan.md` 包含：
1. **目标与非目标**（明确做与不做的边界，核对父 Spec 中的配套 ADR / `GLOSSARY.md` / 文档义务）。
2. **模块范围与调用链**（数据入口、流向与复用的既有函数/组件）。
3. **契约与状态规则**（新增或修改的类型、字段；涉及异步流或多消费方派生状态时，按 `core/acceptance.md` §2 列出关键状态转换预期）。
4. **实施步骤与验收映射**（每项核心验收对应目标模块与测试文件）。
5. **风险与回滚**。

含公式、聚合、比例或阈值的 Spec，在 `Context & Plan` 或 `plan.md` 给出一个数值样例，用来在实现前暴露假设错误。
