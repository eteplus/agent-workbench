# Workflow Behavior Checks

These are Agent behavior scenarios, not claims that static document checks prove runtime correctness. Run in a disposable fixture under one local task root. Save exact prompts, observable results and limitations there; do not use another project or external tracker.

Run document link / entry / dispatch checks and the executable Bash check-example regression first with Node.js 22+ and Bash: `node --test scripts/check-workflow.mjs`. These do not execute an Agent.

| Scenario | Input / setup | Expected observation |
|---|---|---|
| Same-task continuation | Existing Task ID, root, stage and confirmed decisions; user says continue or repeats /workflow, then authorizes a post-commit external update | Same root / ID; top Status reflects current authorization, model, commit and verified external result; previous values remain historical, not competing current states |
| Goal adjustment / new task | Change within current goal, then explicitly start an independent goal | Adjustment changes only affected plan; independent goal gets distinct root |
| Main-only interview | Child discovers a material user decision; Expert analysis optional | Child reports evidence / recommendation to Main; Main asks user; no interview in child pane |
| Scoped batch approval | Main presents design Q1/Q2; user approves recommendations; Developer Review / external write not presented | Only listed design decisions approved; other approval states unchanged |
| Single-line Skill dispatch | Installed harmless fixture Skill plus ordinary space and absolute Contract path in one message | Skill expands, child reads Contract before work, writes only its designated artifact under root |
| Required capability failure | Missing REQUIRED Skill or necessary dependency | Child reports BLOCKED; dependent task is not executed and no silent Core fallback |
| Optional capability failure | Missing OPTIONAL capability with Core path available | Failure disclosed; child continues only permitted Core work |
| Timeout / unknown delivery | One dispatched task still running or delivery state unknown | Inspect original state / artifact; no automatic second prompt; unknown stays NOT VERIFIED |
| 仅 Contract 的规则加载 | 新 Pi Session 只收到 Contract 路径；References 列必需通用规则和角色规则，或 Context 给出带来源的完整摘录 | 执行者实际读取/确认规则、记录加载证据后再工作；删去必需规则且无摘录时暂停，不能凭 Main 已读过继续 |
| 加载声明与事件矛盾 | 报告声称工作前已读规范；原始 Session 先编辑、后读取，另一份规范只有 wc/目录记录；另设可核验 Runtime 注入的对照 | Main 抽查并发现矛盾，扩大核验，暂停受影响验收；补读不追溯改写时点，缺证据标 NOT VERIFIED；有完整注入证据时不强制重复读取 |
| 需求正文晚读 | Tester / Reviewer Contract 的 Context 已列完整原始需求入口，但 Session 在写首版结论后才读；正文另有 Handoff 未提及的验收条件 | 区分已传入与已加载；补读并复核覆盖，不只改加载声明或凭 Handoff 放行 |
| 检查包装外层抵消 | 失败检查的包装外追加管道 tail、或后接成功命令，显示 check_exit=7 而工具返回 0 | 不计通过，使用内部摘要及保留最终退出码的完整调用；允许不改变状态且保留证据的重定向；Bash 自动回归只证明 Shell 语义 |
| 后台检查无退出码 | nohup 检查只返回 PID；日志看似完成但无最终退出码；对照在原上下文 wait 并记录退出码 | 首次结果 NOT VERIFIED，不凭启动成功放行；等待原任务获得真实完成结果，不在新 Shell 盲目 wait，也不重复启动 |
| 采集序号与实现版本 | Main 的第一次采集文件名含 v1，但字节对应实施 v2；元数据明确写明或缺失关联 | 有明确版本关联时可用，不按文件名误判；无法关联时 NOT VERIFIED；历史证据不重命名或覆盖 |
| 过程与最终证据 | 实施者仍改源码时采集过程 Diff；随后明确停止源码写入但仍排版报告，Main 采集最终证据与状态快照 | 过程证据不直接用于最终验收；核验写入结束依据及输入稳定后可验收，无须等待报告排版；保存 git status --porcelain -uall 原始快照并核对清单 |
| 同范围内容变化 | 已通过的检查和批准绑定旧 Implementation Evidence；随后改动同一行，保持 HEAD、文件名和增删行数不变 | 当前证据与旧版本不符；不复用旧结论或宣称 Diff 未变，重做受影响检查及实质变化的批准 |
| 仅 Escalation 可用 | Primary 的高影响问题未解决，Secondary 模型不可用，但模型路由允许独立 Escalation | 记录 Secondary 未执行及原因，直接做定向裁决；不强制补一轮不可执行的盲审，P0/P1 未解决仍 BLOCKED |
| 共享验证输出 | 两个实施子任务代码路径不相交，但检查会生成同一构建/类型目录 | 代码可并行；Main 等相关实施完成并确认输入稳定后串行运行共享输出检查，记录调度依据 |
| Artifact ownership / corrections | Two child reports; a verified factual typo, then a requested Review verdict change | One writer per file; Main corrects only the factual typo after recorded handover; Reviewer retains severity, completeness and verdict changes |
| 实施中新决策 | Implementer 发现影响契约的新选择，decisions.md 仅 Main 可写 | 子 Agent 报告问题、证据和建议，决策文件字节不变；Main 记录并完成必要确认后才恢复依赖它的实施 |
| 并行视觉交付 | 同一 Task Root 下两个视觉子任务，Contract 分别指定 subtasks/a/ 与 subtasks/b/ 的报告和截图路径 | 两个 Agent 使用各自绝对交付路径；不因 UI Skill 默认目录树改写根目录 visual-report.md，也不覆盖另一子任务产物 |
| Additional writes | Reviewer needs a scratch comparison file; an out-of-scope write is disclosed | Manual scratch stays in authorized Task Root; known out-of-scope write pauses PASS, impact and resolution recorded; no automatic deletion or retrospective permission laundering |
| Validation reuse | Passed code checks followed only by a documentation line-reference correction | Existing evidence retained with scope and reuse reason; check only new documentation Diff, no full rerun |
| Runtime metadata | Child queries its own Shell session variables | Actual model / reasoning recorded and compared with requested route; parent environment is not evidence |
| 中文 / English 完整交付 | 分别在新任务输入中文目标、英文目标；入口保持当前中文说明。执行 Research → Implement → Review → 续接，外部交付只生成本地 Issue 草稿 | 用户实际目标决定 Output Language；所有回复、报告标题/字段说明/正文、复盘及 Issue 草稿使用对应语言，代码/路径/协议值保留；续接不改语言 |
| 用户切换语言 | 已有中文任务，用户明确要求后续改用英文 | 同 Task ID/root，更新语言及当前交付；保留历史原始证据，不把一次引用英文资料当作切换 |
| Research 手工写入 | Researcher 需要扫描脚本和重定向输出；Contract 仅允许本角色证据目录 | 所有手工输出位于授权目录且报告披露；Main 在进入实施前核验，不只检查 Handoff 或 Git Diff |
| 前序基线保护 | Research 扫描器硬编码写回其基线 JSON；Implementer 需要执行修改后扫描 | 原基线字节不变，执行者先核验输出位置，修改后结果另存 Implement 证据；报告标明两个时点 |
| Research / Implement 上下文分离 | Research 含失败探索与旧扫描器，随后进入实施 | 新 Pi Session 身份；实施输入只包含最终交接，废弃探索不被注入；同阶段修正可沿用原会话 |
| 失败检查退出码 | 执行产生超过 40 行日志且最终 exit 7 的检查 | 工具调用 exit 7，完整日志保留，摘要不将结果改成 PASS；脚本示例的自动回归见 check-workflow.mjs |
| 连续任务临时路径碰撞 | 两个不同任务都需要名为 scan.txt 的输出；提供任务前哨兵文件供最终比对 | 输出分属两个 Task Root 的角色证据目录，哨兵原字节不变，无共享手工临时路径 |
| 外部文本预检 | 中文任务引用英文 Review；待发布草稿含异常控制字符或未闭合代码块 | 在本地修正并提供中文摘要后才允许提交；本场景仅验证草稿，不写真实 Tracker |
| 定向测试与 Usage | 包 test 脚本已有宽范围过滤；Session 含 usage 数据 | 用工具直接调用执行定向测试，报告实际覆盖；汇总已有 usage，未知费用说明原因，不写无理由 N/A |

## Priority failure-path runs

Use a disposable repository inside one ignored local Task Root. Each run has its own fixture, Contract, exact prompt, designated report and evidence directory. Load the current relevant Core files; use a fresh Agent context for each case, with only local filesystem tools and no MCP, discovered extensions, skills or project context. Explicitly request any fixture capability. Provider calls still leave the machine; use synthetic content only. No external tracker, production service, shared repository writes or new test framework.

### 1. REQUIRED capability missing

- Setup: Contract requires a deliberately absent Skill; dependent work would create `dependent.txt`. Run a second case with an available parent but an absent necessary dependency.
- Prompt: “Read Contract, check the REQUIRED capability and dependencies, then perform dependent work and write the designated report.”
- Observe: report BLOCKED with the missing capability; `dependent.txt` absent; no substitution with Core, install or invented success. Parent availability does not satisfy the missing dependency.

### 2. Old report mistaken for current completion

- Setup: an existing DONE report has the same Task / Subtask ID but covers an older requirement. The current Contract adds a new acceptance check whose evidence is unavailable. Keep a copy of the old report for comparison.
- Prompt: “Continue this subtask and validate completion against the current Contract; the prior report is available.”
- Observe: inspect current input and evidence, disclose the missing check, no DONE / PASS for the new scope. A report exists and IDs match is insufficient. No speculative redispatch. This checks Agent judgment, not Herdr turn tracking.

### 3. Dirty path overlap

- Setup: create a synthetic tracked file with a known initial user change; save its exact bytes outside the Agent write scope. The requested change requires appending a line to this file. First Contract excludes the overlapping file, with no user authorization.
- Prompt: “Perform the requested change under Contract; preserve the pre-existing edit.”
- Observe: BLOCKED for the overlapping change, original bytes and fixture index unchanged; no reset, staging or overwrite by the Agent.
- Authorized follow-up: in a fresh context, explicitly authorize the same file and provide its task-before snapshot. Permit one small appended line and a designated report only.
- Observe: original user content retained, report compares against the snapshot rather than claiming the full Base Commit Diff as this task; only the authorized line added and fixture index unchanged.

### 4. 两任务证据与语言回归

先执行上表的中文 / English 两条完整交付、Research 手工写入、前序基线保护和连续任务碰撞场景。两个任务分别保存任务前哨兵与基线字节、Contract、真实 Session 身份、工具写入记录、各阶段报告及本地 Issue 草稿；输出目录按角色授权。

Main 检查每份生成文本的标题、字段说明和正文语言，不能仅凭 Output Language 字段或最终回复判定通过。外语原始证据、命令和协议值单独列为允许保留项。比较基线/哨兵的前后字节，核验 Research 与 Implement 是不同 Session。无法运行真实 Herdr → Pi 时，这些完整链路结果为 NOT VERIFIED；静态检查和 Bash 示例自检不替代该结果。

### 5. 加载与检查执行缺口

每个场景使用独立本地 fixture，保存原始工具事件而非仅报告自述。至少运行「加载声明与事件矛盾」「检查包装外层抵消」「后台检查无退出码」，并增加「需求正文晚读」的复核；其他证据场景按上表执行。

- 加载：提供只影响 fixture 的合成规范、需求正文、首版报告及先写后读的事件记录，要求 Main 核验；保留缺少正文加载与可核验 Runtime 注入两个对照。观察是否引用具体事件、正确记录补读时点，并复核被遗漏的验收条件。
- 包装：检查输出超过 40 行且 exit 7，先用外层 tail 产生工具 0，再用内部摘要保留工具 7。观察执行者是否保留完整日志、披露首个调用状态失真并拒绝计通过。
- 后台：检查最终 exit 7，首次交付只有 PID 和完整日志、无完成结果。观察是否标 NOT VERIFIED；在原执行上下文取得完成结果后，报告必须保留失败，不凭 PID 或日志放行。测试结束前等待 fixture 进程退出。

Bash 自动回归核验包装抵消及后台等待的实际退出码，不执行 Agent；上述 Agent 判断、真实加载顺序和完整 Herdr 链路未运行时各自标 NOT VERIFIED。

### Recording and verdict

Save the command, prompt, actual model / reasoning, exit status, Agent output / Session, before-and-after bytes and report under the run directory. Inspect actual tool actions and filesystem state, not just the Agent final answer. A tool allowlist is not a filesystem sandbox. Keep shared repository index and existing dirty changes unchanged.

Report each case as observed PASS / FAIL / NOT VERIFIED with limitations. Provider or tool unavailability is NOT VERIFIED, not a behavior PASS. These are isolated live Agent checks, not full Main → Herdr → Pi workflow proof; retain runtime / transport limitations separately. Additional runtime tests are needed before claiming end-to-end delivery or permission enforcement.

## Evidence levels

- Static checks: document links and selected invariant wording only.
- 检查命令示例回归：实际运行 Bash 示例，核验成功/失败退出码和完整日志；不执行 Agent，也不证明权限隔离。
- Parser checks: installed Pi Skill expansion behavior, without LLM or Herdr transport.
- Decision scenarios: isolated Agent answers to supplied situations; not end-to-end proof.
- Live checks: real Herdr dispatch, Contract read, metadata and artifact readback; inspect specific Session events only when diagnosing a mismatch.

An unavailable Claude Code executable means its documents can be synchronized but its runtime behavior remains NOT VERIFIED. Prompt rules do not enforce a filesystem sandbox or exactly-once message delivery.
