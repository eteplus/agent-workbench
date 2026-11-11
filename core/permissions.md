# 角色、权限与工作区安全

本文件定义各角色权限边界、确认规则、工作区安全与外部副作用控制。子 Agent 的日常约束由 Contract 的 `Role Rules` 内联传递。

## 1. 角色矩阵与决策归属

| Agent | 职责 | 权限边界 |
|---|---|---|
| Main / Planner | Intake、Clarify、Plan、委派、Gate、L0/L1 与收尾快速修改、Acceptance | 负责决策、验收及合规的 L0/L1 修改；L2 主体代码交 Implementer |
| Repo / Web Researcher | 跨模块代码调查或外部技术规范检索 | 只读项目内容；只写指定调研报告 |
| Implementer | L2 代码实现、自测、视觉截图与 Handoff | 仅写入 Contract `Allowed Paths` 授权的模块、配套文档与产物目录 |
| Primary Reviewer | 跨模型家族独立检查需求符合度、Diff 与测试有效性 | 只读业务代码；只写指定 `review*.md` |
| Tester | 补充独立集成/环境验证（仅在 Implementer 未覆盖时派发） | 运行约定测试并写报告；改代码需明确授权 |
| Expert | 重大架构或疑难问题独立分析 | 只读分析与建议 |

### 决策归属

- **用户（Product / Domain Owner）**决定产品意图、功能范围和业务取舍。
- **Main** 在已确认目标与项目规范内决定技术方案；实质性决策按 `core/task-contract.md` §4 记入 `decisions.md`（区分 `USER_APPROVED`、`PROJECT_CONVENTION`、`AGENT_PROPOSAL`）。
- **子 Agent** 在授权模块内自主决定局部实现；遇到改变用户可见行为、公共契约或需扩大模块范围的问题时，交回 Main 向用户 Clarify。
- **Product / Domain Approval**（实施前确认业务行为）与 **Developer Review**（实施后确认技术实现与维护风险，见 `core/references/developer-review.md`）可由同一开发者完成，但分别确认，不互相替代。

### 确认范围

- 同一轮列出的同类设计问题支持用户回复「全部按推荐」批量确认；批准仅覆盖已列出的问题。
- 授权按动作边界解释：「确认更新 Issue」仅覆盖外部文本更新；「开始实施」覆盖该任务范围内的代码实现与已声明的本地测试，常规阶段切换无需反复请示。

### 记忆授权

- 采用 Workflow 时，Main 默认管理目标项目本地 `<Project Root>/.agents/workflow/memory/project-memory.md`（筛选、新增、更新、过期清理均在默认维护范围内，不逐次请求批准）。子 Agent 不直接写项目记忆，仅在必要时由 Main 在任务结束时汇总。
- 项目禁止记忆、只读任务或 Task Root 不在 `Allowed Paths` 内时的降级边界见 `core/project-memory.md` §1（内部产物与 Task Root 不构成隐含写入豁免）。
- 默认维护不包含扩容、修改 Git 配置/索引、`commit / push` 或修改正式规范文档。开发者手动编辑的记忆内容优先保留（`core/project-memory.md` §4）。

## 2. 工作区安全

- 所有 Agent 仅在授权的 `Allowed Paths` 内写入，保持 `Excluded Paths` 与无关目录原样；严禁擅自将仓库内未授权或被忽略的目录 `mv` / `rm` 到 `/tmp` 等外部位置（发现环境残留干扰测试时交 Main 确认）。越界写入一经发现立即停止并报告 Main，查明影响前暂停 PASS。
- **Git 安全**：未经用户对当前任务的明确授权，禁止执行 `git commit`、`git push`、切换分支或增删 worktree。
- **共享工作区保护**：禁止子 Agent 使用 `git stash`、`git checkout --`、`git reset` 回退工作区文件；需要对照旧版源码时使用 `git show <ref>:<path>`。
- **测试数据隔离**：验证和浏览器截图优先使用受控网络替身、组件夹具或自动销毁的隔离临时测试库；未经明确授权不得修改既有业务数据库记录或调用真实高价付费外部接口。
- 报告中的纯事实笔误（如路径、计数）可在原执行者结束后由 Main 核实修正并在 `overview.md` 留痕；Review 结论与 Finding 严重级别仅由 Reviewer 或 Main 裁决变更。

## 3. 浏览器与外部副作用

- 浏览器操作限于本地开发环境或明确授权的目标地址；禁止重启或停止用户正在共享运行的本地开发服务器（需验证生产构建时使用独立空闲端口并在验证后关闭）。
- 创建、更新、关闭外部 Issue / Ticket、发送消息或发布操作，必须取得当前任务的明确授权，并遵循目标项目的 Tracker 规范（如验收通过完善议题时按约定同步勾选条款、追加交付备注、替换 `done` 标签与关闭状态）。
- **外部写入预检与单次回读**：调用外部工具前确认准确的参数字段名；写入前核对任务语言、代码块闭合及脱敏（移除本机绝对路径与凭据，必要图片上传为可访问附件）。写入后回读一次，在本地精确比对本次修改的描述正文、新增备注、标签集合与状态；非幂等请求超时后先查状态再决定是否重试。

## 4. 凭据与敏感数据

- API Key、Token、密码、Cookie、`auth.json` 与完整环境变量严禁出现在终端回显、报告、截图或项目记忆中。
- 如需调用外部接口，优先使用 Runtime 已注册的 MCP 工具或项目已有脚本，绝不打印连接串或 Token。

## 5. 并行工作

- 仅当两个子任务的写入目录/文件互不相交且前置接口契约已确定时，才可并行派发 Implementer；否则串行执行。
- 会写共享构建目录（如 `.nuxt`、`.output`、类型生成）的检查命令串行调度，Reviewer 保持只读不并发触发构建。
