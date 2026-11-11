// Structural document checks and executable evidence examples; neither runs an Agent.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const docs = ['README.md', ...['core', 'runtimes', 'skills', 'tests'].flatMap(
  (folder) => readdirSync(resolve(root, folder), { recursive: true })
    .filter((path) => path.endsWith('.md'))
    .map((path) => `${folder}/${path}`),
)];

// shortcut: checks include fenced examples and plain heading slugs; extend for explicit IDs or duplicate slugs when used.
test('local Markdown links and heading targets resolve', () => {
  for (const path of docs) {
    for (const [, target] of read(path).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (target.includes('://')) continue;
      const [file, anchor] = target.split('#');
      const destination = file ? resolve(root, dirname(path), file) : resolve(root, path);
      assert.ok(existsSync(destination), `${path}: ${target}`);
      if (anchor) {
        const headings = readFileSync(destination, 'utf8').split('\n')
          .filter((line) => /^#{1,6} /.test(line))
          .map((line) => line.replace(/^#+ /, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-'));
        assert.ok(headings.includes(decodeURIComponent(anchor)), `${path}: ${target}`);
      }
    }
  }
});

test('Workbench file and numbered-section pointers resolve', () => {
  for (const path of docs) {
    for (const [, target, sections] of read(path).matchAll(/`((?:core|runtimes|skills)\/[^`<>]+\.md)`(?: §(\d[\d.§、–,\- ]*))?/g)) {
      assert.ok(existsSync(resolve(root, target)), `${path}: ${target}`);
      for (const section of sections?.match(/\d+(?:\.\d+)?/g) ?? []) {
        const escaped = section.replaceAll('.', '\\.');
        assert.match(read(target), new RegExp(`^#{1,6} ${escaped}[. ]`, 'm'), `${path}: ${target} §${section}`);
      }
    }
  }
});

test('runtime entries and Skill frontmatter retain their interface', () => {
  for (const path of ['runtimes/pi/workflow.md', 'runtimes/claude-code/workflow/SKILL.md']) {
    const text = read(path);
    assert.ok(text.includes('AGENT_WORKBENCH_ROOT'), path);
    assert.ok(text.includes('core/workflow.md'), path);
    assert.ok(text.includes('runtimes/README.md'), path);
  }
  assert.match(read('runtimes/pi/workflow.md'), /\$\{@:-[^}]+\}/);
  for (const [path, name] of [['runtimes/claude-code/workflow/SKILL.md', 'workflow'], ['skills/ui-impl/SKILL.md', 'ui-impl']]) {
    const frontmatter = read(path).match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, path);
    assert.match(frontmatter[1], new RegExp(`^name: ${name}$`, 'm'));
    assert.match(frontmatter[1], /^description: .+/m);
  }
});

test('explicit Skill dispatch examples keep one command and Contract input', () => {
  const commands = [...read('runtimes/README.md').matchAll(/```text\n([\s\S]*?)\n[ \t]*```/g)]
    .map(([, block]) => block.trim()).filter((block) => block.startsWith('/skill:'));
  assert.ok(commands.length);
  for (const command of commands) {
    assert.ok(!command.includes('\n'), command);
    assert.match(command, /^\/skill:[a-z0-9-]+ .+Contract/);
  }
});

test('classification, role loading and Contract fields retain their structure', () => {
  const levels = [...read('core/task-classification.md').matchAll(/^\| (L[012]) \|/gm)].map(([, level]) => level);
  assert.deepEqual(levels, ['L0', 'L1', 'L2']);
  const contract = read('core/task-contract.md');
  const fields = contract.match(/```text\n([\s\S]*?)\n```/);
  assert.ok(fields);
  for (const field of ['Task ID', 'Subtask ID', 'Task Root', 'Repository Root', 'Agent Role', 'Task Type', 'Goal', 'Output Language', 'Skills', 'References', 'Workspace Baseline', 'Scope', 'Implementation Evidence', 'Time Budget', 'Deliverables', 'Constraints', 'Acceptance Criteria', 'Decision Authority', 'Developer Review Requirement']) {
    assert.match(fields[1], new RegExp(`^${field}:`, 'm'));
  }
  assert.match(fields[1], /^Skills:.*Source Path/m);
  for (const role of ['Implementer', 'Reviewer', 'Tester']) {
    assert.match(contract, new RegExp(`^\\| ${role} \\| .*core/acceptance\\.md`, 'm'));
  }
});

test('report templates retain evidence and controlled status fields', () => {
  const handoff = read('core/templates/handoff.template.md');
  for (const field of ['启动核验', 'Implementation Evidence']) assert.match(handoff, new RegExp(`^- ${field}:`, 'm'));
  for (const status of ['DONE', 'PARTIAL', 'BLOCKED', 'FAILED']) assert.ok(handoff.includes(status));
  const decisions = read('core/templates/decisions.template.md');
  for (const status of ['USER_APPROVED', 'PROJECT_CONVENTION', 'AGENT_PROPOSAL', 'PROPOSED', 'CONFIRMED', 'REJECTED', 'DEFERRED']) assert.ok(decisions.includes(status));
  for (const field of ['Product / Domain Approval', '批准', '证据']) assert.match(decisions, new RegExp(`^- ${field}:`, 'm'));
  assert.match(read('core/templates/overview.template.md'), /^- External Delivery:/m);
  const visual = read('skills/ui-impl/references/visual-report.template.md');
  assert.match(visual, /^\| Required State \|/m);
  assert.match(visual, /^- Visual verification:/m);
});

test('structural checks reject broken file and section pointers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-docs-'));
  try {
    for (const path of [...docs, 'LICENSE', 'scripts/check-workflow.mjs', 'scripts/run-check.sh', 'scripts/evidence-snapshot.sh', 'scripts/session-progress.mjs', 'scripts/wait-agent.sh']) {
      const destination = join(dir, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, read(path));
    }
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT; // Run the copied fixture outside the parent node:test runner.
    const clean = spawnSync(process.execPath, ['--test', '--test-name-pattern', 'local Markdown links|Workbench file and numbered-section', join(dir, 'scripts/check-workflow.mjs')], { encoding: 'utf8', env });
    assert.ifError(clean.error);
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    for (const [suffix, pattern] of [
      ['\n[broken](core/missing.md)\n', 'local Markdown links'],
      ['\n`core/acceptance.md` §1–99\n', 'Workbench file and numbered-section'],
    ]) {
      writeFileSync(join(dir, 'README.md'), read('README.md') + suffix);
      const result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-name-pattern', pattern, join(dir, 'scripts/check-workflow.mjs')], { encoding: 'utf8', env });
      assert.ifError(result.error);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, suffix.includes('missing.md') ? /core\/missing\.md/ : /§99/);
      assert.match(result.stdout, /not ok/);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('完整 Diff 指纹能区分同路径、同增删行数的内容变化', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-version-'));
  try {
    const base = join(dir, 'base.ts'), current = join(dir, 'current.ts');
    writeFileSync(base, 'const limit = 1;\n');
    const snapshots = [];
    for (const value of [2, 9]) {
      writeFileSync(current, `const limit = ${value};\n`);
      const diff = spawnSync('git', ['diff', '--no-index', '--binary', '--', base, current], { encoding: 'utf8' });
      const stat = spawnSync('git', ['diff', '--no-index', '--numstat', '--', base, current], { encoding: 'utf8' });
      assert.ifError(diff.error);
      assert.ifError(stat.error);
      assert.equal(diff.status, 1);
      assert.equal(stat.status, 1);
      snapshots.push({ stat: stat.stdout, digest: createHash('sha256').update(diff.stdout).digest('hex') });
    }
    assert.equal(snapshots[0].stat, snapshots[1].stat);
    assert.notEqual(snapshots[0].digest, snapshots[1].digest);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('未跟踪输入等长变化时，Diff 与路径清单不变但内容哈希改变', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-untracked-'));
  try {
    const init = spawnSync('git', ['init', '-q', dir], { encoding: 'utf8' });
    assert.ifError(init.error);
    assert.equal(init.status, 0, init.stderr);
    const snapshots = [];
    for (const value of ['partial', 'applied']) {
      writeFileSync(join(dir, 'input.txt'), value);
      const diff = spawnSync('git', ['diff', '--binary'], { cwd: dir, encoding: 'utf8' });
      const paths = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: dir, encoding: 'utf8' });
      assert.ifError(diff.error);
      assert.ifError(paths.error);
      assert.equal(diff.status, 0);
      assert.equal(paths.status, 0);
      snapshots.push({ diff: diff.stdout, paths: paths.stdout,
        digest: createHash('sha256').update(readFileSync(join(dir, 'input.txt'))).digest('hex') });
    }
    assert.equal(snapshots[0].diff, snapshots[1].diff);
    assert.equal(snapshots[0].paths, 'input.txt\n');
    assert.equal(snapshots[0].paths, snapshots[1].paths);
    assert.notEqual(snapshots[0].digest, snapshots[1].digest);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('外部回读正文必须精确一致，标签比较不依赖顺序', () => {
  const submitted = '- [ ] partial\n';
  const readback = '- [ ] applied\n';
  assert.equal(submitted.length, readback.length);
  assert.equal(submitted.split('\n').length, readback.split('\n').length);
  assert.notEqual(submitted, readback);
  assert.deepEqual(new Set(['done', 'reviewed']), new Set(['reviewed', 'done']));
});

test('后台检查的启动成功不代表完成，原上下文 wait 保留最终退出码', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-background-'));
  try {
    for (const code of [0, 7]) {
      const log = join(dir, `exit-${code}.log`);
      const result = spawnSync('bash', ['-c', `
        bash -c "$2" > "$1" 2>&1 &
        launch=$?; pid=$!
        printf "launch_exit=%s pid=%s\\n" "$launch" "$pid"
        wait "$pid"
        result=$?
        printf "check_exit=%s\\n" "$result"
        exit "$result"
      `, '_', log, `printf 'background-output\\n'; printf 'background-stderr\\n' >&2; exit ${code}`], { encoding: 'utf8' });
      assert.ifError(result.error);
      assert.match(result.stdout, /launch_exit=0 pid=\d+/);
      assert.ok(result.stdout.includes(`check_exit=${code}`));
      assert.equal(result.status, code);
      assert.equal(readFileSync(log, 'utf8'), 'background-output\nbackground-stderr\n');
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('共享检查入口保留成功、预期失败和普通失败的退出码与完整日志', () => {
  const example = read('core/acceptance.md').match(/```bash\nbash "\$AGENT_WORKBENCH_ROOT\/(scripts\/run-check\.sh)" /);
  assert.ok(example, '缺少共享入口示例');
  const runner = resolve(root, example[1]);
  const dir = mkdtempSync(join(tmpdir(), 'workbench-check-'));
  try {
    for (const code of [0, 1, 7]) {
      const log = join(dir, `exit ${code}.log`);
      const result = spawnSync('bash', [runner, log, 'bash', '-c',
        `printf 'line-%s\\n' {1..60}; printf 'stderr-marker\\n' >&2; exit ${code}`], { encoding: 'utf8' });
      assert.ifError(result.error);
      assert.equal(result.status, code);
      const full = readFileSync(log, 'utf8');
      assert.equal(full.trim().split('\n').length, 61);
      assert.ok(full.startsWith('line-1\n') && full.endsWith('line-60\nstderr-marker\n'));
      assert.ok(!result.stdout.includes('line-1\n'));
      assert.ok(result.stdout.includes(`check_exit=${code}`));
      if (code === 7) {
        for (const suffix of ['2>&1 | tail -40', '|| true', '; printf "summary-only\\n"']) {
          const masked = spawnSync('bash', ['-c', `bash "$1" "$2" bash -c "$3" ${suffix}`,
            '_', runner, log, 'printf "failed-check\\n"; exit 7'], { encoding: 'utf8' });
          assert.ifError(masked.error);
          assert.equal(masked.status, 0, `${suffix}: 调用方仍能掩盖退出码`);
          assert.ok(masked.stdout.includes('check_exit=7'));
          assert.equal(readFileSync(log, 'utf8'), 'failed-check\n');
        }
        const summary = join(dir, 'summary.log');
        const redirected = spawnSync('bash', ['-c', 'bash "$1" "$2" bash -c "$3" > "$4"',
          '_', runner, log, 'printf "failed-check\\n"; exit 7', summary], { encoding: 'utf8' });
        assert.ifError(redirected.error);
        assert.equal(redirected.status, 7);
        assert.ok(readFileSync(summary, 'utf8').includes('check_exit=7'));
      }
    }
    const directExit = spawnSync('bash', [runner, join(dir, 'builtin.log'), 'exit', '7'], { encoding: 'utf8' });
    assert.ifError(directExit.error);
    assert.equal(directExit.status, 7);
    assert.match(directExit.stdout, /check_exit=7/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// 批准字段与上限取自 plan.md §6.2–§6.3、§8.1 / D-04，独立于 core/project-memory.md 当前内容。
const memoryApproved = {
  fileFields: ['schema_version', 'policy_version', 'project_id', 'generation', 'updated_at', 'limits', 'import_floor', 'recent_receipts', 'deletion_markers', 'metrics', 'entries'],
  entryFields: ['id', 'topic_key', 'kind', 'title', 'scope', 'statement', 'task_goal', 'outcome', 'rationale', 'reusable_context', 'unresolved', 'owner', 'next_check', 'status', 'evidence_status', 'approval', 'sources', 'created_at', 'updated_at', 'last_verified_at', 'review_at', 'expires_at', 'invalidation_conditions', 'retention_class', 'protected_reason', 'utility'],
  limits: { current: 64, control: 32, managed: 192, files: 3, entries: 32, entryKib: 4, trigger: 24, target: 20, softKib: 51.2, targetKib: 44.8 },
};
const memorySlice = (memory, start, end) => {
  const from = memory.indexOf(start), to = memory.indexOf(end);
  assert.ok(from >= 0 && to > from, `缺少章节: ${start}`);
  return memory.slice(from, to);
};
// 首单元格中的反引号字段名；表头与分隔行不含字段名，自然被过滤。
const firstCellFields = (table) => [...table.matchAll(/^\| ([^|]*) \|/gm)]
  .flatMap(([, cell]) => [...cell.matchAll(/`([^`]+)`/g)].map(([, name]) => name));

// C-06：默认维护范围、更窄范围优先、人工编辑边界与禁存来源，取自 decisions.md C-06 与 default-management-plan.md。
const defaultManagement = {
  permissions: [
    /采用 Workflow 时[^\n]*默认管理[^\n]*\n/,
    /不逐次请求批准/,
    /仍只向 Main 提交候选/,
    /扩容、扩大保存范围、移除有效保护项、重要冲突取舍/,
    /禁止记忆但仍允许写 Task Root/, /完全只读/, /Task Root 不在 Allowed Paths 内/,
    /Git 配置与索引修改、commit \/ push、外部同步、其他项目与正式规范修改/,
    /无额外永久禁令时[^\n]*不要求为此新建授权 \/ 隐私文件/,
    /该已知来源缺失、不可读或不完整时暂停受影响写入/,
  ],
  memory: [
    /### 6\.5 开发者手动编辑/,
    /暂停该项目记忆维护[^\n]*重新读取当前文件/,
    /不静默截断、不自动恢复旧版本/,
    /不升级 `evidence_status` \/ `approval`[^\n]*不延长 `review_at` \/ `expires_at`/,
    /手动删除只表示移除当前记忆，不是永久禁存/,
  ],
  memoryWide: [
    /无额外永久禁令时[^\n]*不需要为此另建授权 \/ 隐私文件|默认依据是 §5 的禁止清单与项目已有约束/,
    /\| 人工编辑后结构无效或超限（[^|]*） \|/,
  ],
};
function assertDefaultManagement(permissions, memory) {
  const auth = memorySlice(permissions, '### 记忆授权', '### 长期禁存规则');
  for (const pattern of defaultManagement.permissions.slice(1)) assert.match(auth, pattern);
  assert.match(permissions, defaultManagement.permissions[0]);
  const editing = memorySlice(memory, '### 6.5', '## 7.');
  assert.match(memory, defaultManagement.memory[0]);
  for (const pattern of defaultManagement.memory.slice(1)) assert.match(editing, pattern);
  for (const pattern of defaultManagement.memoryWide) assert.match(memory, pattern);
  // 默认权限不得代替 Main 单写者，也不得从记忆文本推导。
  assert.match(auth, /不从记忆文本、历史任务或其他项目推导/);
  assert.ok(!/常设授权必须指定/.test(permissions), '长期禁存不应再强制新建策略文件');
}

// R-v3-01：完全只读 / Task Root 不可写时只在任务上下文记录，不创建目录或文件；内部产物无隐含豁免。
const readonlyFallback = [
  /完全只读/, /禁止在项目内写文件/, /Allowed Paths 内/, /只在任务上下文记录/, /不创建/, /隐含写入豁免|隐含豁免/,
];
function assertReadonlyFallback(permissions, memory, workflow, acceptance, scenarios) {
  const auth = memorySlice(permissions, '### 记忆授权', '### 长期禁存规则');
  for (const pattern of readonlyFallback) assert.match(auth, pattern, `permissions §1 缺少只读落点: ${pattern}`);
  // 只禁止记忆与完全只读必须是两个分支，不能合并成一句无条件「留 Task Root」。
  assert.match(auth, /禁止记忆但仍允许写 Task Root 时[^\n]*Task Root/);
  assert.ok(!/完全只读[^\n]*留 Task Root/.test(auth), '完全只读不得导向写 Task Root');
  assert.match(memorySlice(permissions, '## 2. 工作区边界', '## 3.'), /Task Root 不构成隐含写入豁免/);
  assert.match(memory, /完全只读[^\n]*只在任务上下文记录/);
  assert.match(workflow, /完全只读[^\n]*只在任务上下文记录/);
  assert.match(acceptance, /完全只读[^\n]*只在任务上下文记录/);
  assert.match(scenarios, /项目记忆完全只读落点/);
  // 场景表保持两列表头，不为只读分支新增列。
  assert.match(memory, /^\| 场景 \| 应有行为 \|$/m);
  const rows = memory.slice(memory.indexOf('## 12. 边界场景')).split('\n').filter((line) => line.startsWith('|'));
  assert.deepEqual(rows.filter((line) => line.split('|').length - 2 !== 2), [], '场景表应保持两列');
}

function assertMemoryRules(memory) {
  const budget = memorySlice(memory, '### 6.4', '## 7.');
  const lifetime = memorySlice(memory, '## 9.', '## 10.');
  const row = (label, section = memory) => {
    const line = section.match(new RegExp(`^\\| ${label} \\| (.+)$`, 'm'));
    assert.ok(line, `缺少行: ${label}`);
    return line[1];
  };
  const kib = (label) => Number(row(label, budget).match(/^(\d+) KiB/)[1]);
  const count = (label, pattern) => Number(row(label, budget).match(pattern)[1]);

  for (const section of ['## 3. 相关读取', '## 4. 结束评估', '## 10. 提交、失败与并发']) assert.ok(memory.includes(section), section);
  for (const iface of ['相关读取', '结束评估', '维护提交']) assert.match(memory, new RegExp(`^\\| ${iface} \\| `, 'm'), iface);

  // 绝对上限直接断言批准值，不靠文内 token 存在或比例自洽。
  const { current, control, managed, files, entries, entryKib, trigger, target, softKib, targetKib } = memoryApproved.limits;
  assert.equal(kib('当前文件'), current);
  assert.equal(kib('控制与辅助元数据'), control);
  assert.equal(kib('受管持久与操作空间'), managed);
  assert.equal(count('受管持久与操作空间', /最多 (\d+) 个文件/), files);
  assert.equal(count('当前条目', /(\d+) 条/), entries);
  assert.equal(count('单条', /序列化 (\d+) KiB/), entryKib);
  assert.equal(count('`previous` / `pending`', /各 (\d+) KiB/), current);
  assert.equal(control * 2, current);
  assert.equal(managed, current * files);
  assert.ok(memory.includes('32 条不等于 128 KiB'));
  assert.match(row('每任务新增候选', budget), /^3 条/);
  assert.match(row('单条来源', budget), /^3 个/);
  assert.match(row('`recent_receipts` / `deletion_markers`', budget), /各 32 项、各最多 90 天/);
  assert.match(row('单次读入上下文', budget), /最多 8 条、2,000 个 Unicode 字符/);

  const soft = memory.match(/文件 80%（([\d.]+) KiB）或 (\d+) 条；达到任一值，接纳新候选前整理到不高于 ([\d.]+) KiB 且不超过 (\d+) 条/);
  assert.ok(soft, '缺少软阈值规则');
  assert.equal(Number(soft[1]), softKib);
  assert.equal(Number(soft[2]), trigger);
  assert.equal(Number(soft[3]), targetKib);
  assert.equal(Number(soft[4]), target);

  // 字段从 §6.2 / §6.3 首单元格解析，再与批准的完整集对比，不从当前声明反推期望集。
  for (const [heading, next, approved] of [['### 6.2', '### 6.3', memoryApproved.fileFields], ['### 6.3', '### 6.4', memoryApproved.entryFields]]) {
    const parsed = firstCellFields(memorySlice(memory, heading, next));
    for (const field of approved) assert.ok(parsed.includes(field), `${heading} 缺少字段: ${field}`);
    const extra = parsed.filter((field) => !approved.includes(field) && ![...memoryApproved.fileFields, ...memoryApproved.entryFields].includes(field));
    assert.deepEqual(extra, [], `${heading} 出现未批准字段`);
  }
  for (const value of ['DECISION', 'CONTEXT', 'OUTCOME', 'OPEN_ISSUE', 'ACTIVE', 'NEEDS_REVALIDATION', 'CONFLICTED', 'VERIFIED', 'USER_CONFIRMED', 'UNVERIFIED']) {
    assert.ok(memory.includes(value), value);
  }

  const lifetimes = [['稳定且已批准的决策', 180, 365], ['可复用上下文', 90, 180], ['有后续影响的任务结果', 30, 90], ['未解问题', 30, 90], ['冲突信息', 14, 30]];
  for (const [label, review, expiry] of lifetimes) {
    assert.match(row(label, lifetime), new RegExp(`${review} 天`), label);
    assert.match(row(label, lifetime), new RegExp(`${expiry} 天`), `${label} 硬到期`);
  }

  // 评估四值与提交三值分离：无提交写 N/A，未授权不新增提交枚举。
  for (const result of ['SKIP', 'NO_CHANGE', 'PROPOSE', 'READY']) assert.ok(memory.includes(result), result);
  assert.match(memory, /\| SKIP \/ NO_CHANGE \| 无提交 \| N\/A \|/);
  assert.match(memory, /\| READY \| 有提交 \| UPDATED \/ FAILED \|/);
  assert.match(memory, /PROPOSE[^\n]*未提交[^\n]*|PROPOSE（未授权或冲突待裁决） \| 无提交/, '未授权路径必须允许无提交回执');
  assert.ok(!memory.includes('NOT AUTHORIZED'), '回执不新增 NOT AUTHORIZED 枚举');
  const uncommitted = memory.match(/收到 (?:UPDATED|FAILED|DEFERRED)[^\n]*/g) ?? [];
  assert.deepEqual(uncommitted, [], '无提交路径不能要求提交回执');
}

test('项目记忆：权威模块字段、接口与硬预算自洽', () => {
  const memory = read('core/project-memory.md');
  assertMemoryRules(memory);
});

test('项目记忆：默认维护与人工编辑边界', () => {
  assertDefaultManagement(read('core/permissions.md'), read('core/project-memory.md'));
  for (const path of ['README.md', 'core/README.md', 'core/workflow.md', 'core/acceptance.md']) {
    assert.match(read(path), /默认维护|默认管理/, `${path}: 未说明默认维护来源`);
  }
});

test('项目记忆：完全只读与 Task Root 不可写时只留任务上下文', () => {
  assertReadonlyFallback(read('core/permissions.md'), read('core/project-memory.md'), read('core/workflow.md'), read('core/acceptance.md'), read('tests/workflow-scenarios.md'));
});

test('项目记忆：只读落点的负向变体被拒绝', () => {
  const files = { permissions: read('core/permissions.md'), memory: read('core/project-memory.md'), workflow: read('core/workflow.md'), acceptance: read('core/acceptance.md'), scenarios: read('tests/workflow-scenarios.md') };
  const check = (overrides) => assertReadonlyFallback(overrides.permissions ?? files.permissions, overrides.memory ?? files.memory, overrides.workflow ?? files.workflow, overrides.acceptance ?? files.acceptance, overrides.scenarios ?? files.scenarios);
  const mutations = [
    ['完全只读退回到写 Task Root', 'permissions', (text) => text.replace('任务要求完全只读、禁止在项目内写文件，或 Task Root 不在 Allowed Paths 内时，只在任务上下文记录评估、候选与回执：不创建 Task Root 目录或文件，不写受管文件；', '任务要求完全只读时，候选留 Task Root；')],
    ['删除内部产物无豁免声明', 'permissions', (text) => text.replace('内部产物、证据目录和 Task Root 不构成隐含写入豁免。', '')],
    ['workflow 把只读写回 Task Root', 'workflow', (text) => text.replace('要求完全只读、禁止在项目内写文件或 Task Root 不在 Allowed Paths 内时，只在任务上下文记录，不创建目录或文件。', '要求完全只读时，写入范围相应收窄到 Task Root。')],
    ['场景表新增第三列', 'memory', (text) => text.replace('| 完全只读或 Task Root 不在 Allowed Paths 内 | 只在任务上下文记录，不创建目录或文件；内部产物不构成隐含豁免 |', '| 完全只读 | 任务要求不在项目内写文件 | 只在任务上下文记录 |')],
  ];
  for (const [label, target, mutate] of mutations) {
    const mutated = mutate(files[target]);
    assert.notEqual(mutated, files[target], `${label}: 变异未生效`);
    assert.throws(() => check({ [target]: mutated }), `${label}: 变异未被拒绝`);
  }
});

test('项目记忆：默认维护与人工编辑的负向变体被拒绝', () => {
  const permissions = read('core/permissions.md');
  const memory = read('core/project-memory.md');
  const mutations = [
    ['回退为逐项授权', 'permissions', (text) => text.replace('默认管理目标项目固定目录中的受管文件：创建、筛选、概括、去重、合并、更新、普通到期与容量淘汰、备份与暂存清理都在默认范围内，不逐次请求批准。', '写入、删除、备份清理与记忆路径初始化都需要当前任务的逐次明确授权。')],
    ['删除任务限制优先', 'permissions', (text) => text.replace('项目或任务明确禁止记忆但仍允许写 Task Root 时，候选、评估与回执留在 Task Root，评估记 PROPOSE、回执记 N/A（已尝试提交并被阻断时 DEFERRED），不自报已写入。', '')],
    ['恢复强制新建隐私文件', 'permissions', (text) => text.replace('不要求为此新建授权 / 隐私文件', '必须新建授权 / 隐私文件后才有禁存依据')],
    ['删除人工无效或超限保留规则', 'memory', (text) => text.replace('无效或超限时保留人工文件、报告具体问题并暂停相关自动维护；不静默截断、不自动恢复旧版本。', '无效或超限时自动截断到预算内并回滚到上一版本。')],
    ['人工编辑自动续期', 'memory', (text) => text.replace('不延长 `review_at` / `expires_at`', '自动延长 `review_at` / `expires_at`')],
    ['手删等同永久禁存', 'memory', (text) => text.replace('手动删除只表示移除当前记忆，不是永久禁存', '手动删除同时表示永久禁存')],
  ];
  for (const [label, target, mutate] of mutations) {
    const original = target === 'permissions' ? permissions : memory;
    const mutated = mutate(original);
    assert.notEqual(mutated, original, `${label}: 变异未生效`);
    assert.throws(() => assertDefaultManagement(
      target === 'permissions' ? mutated : permissions,
      target === 'memory' ? mutated : memory,
    ), `${label}: 变异未被拒绝`);
  }
});

test('项目记忆：负向副本被拒绝（预算放大、字段或声明删除）', () => {
  const original = read('core/project-memory.md');
  const mutations = [
    ['等比放大预算且保留历史数字', (text) => text
      .replace('| 当前文件 | 64 KiB', '| 当前文件 | 128 KiB')
      .replace('| 控制与辅助元数据 | 32 KiB', '| 控制与辅助元数据 | 64 KiB')
      .replace('| 受管持久与操作空间 | 192 KiB', '| 受管持久与操作空间 | 384 KiB')
      .replace('80%（51.2 KiB）', '80%（102.4 KiB）')
      .replace('不高于 44.8 KiB', '不高于 89.6 KiB')
      .concat('\n历史沿革：当前文件曾为 64 KiB、控制 32 KiB、峰值 192 KiB，软阈值曾为 51.2 / 44.8 KiB。\n')],
    ['删除 scope 字段声明但场景仍引用', (text) => text.replace('| `title` / `scope` |', '| `title` |')],
    ['删除 approval 字段声明', (text) => text.replace('| `evidence_status` / `approval` |', '| `evidence_status` |')],
    ['删除 import_floor 字段声明', (text) => text.replace('| `import_floor` | 最早允许导入的历史结果版本时间，防删除后回扫重建 |\n', '')],
    ['取消无提交回执的 N/A 规则', (text) => text.replace('| SKIP / NO_CHANGE | 无提交 | N/A | N/A |', '| SKIP / NO_CHANGE | 无提交 | UPDATED | N/A |')],
    ['恢复未授权的提交枚举', (text) => text.replace('回执写 N/A。两者', '回执写 NOT AUTHORIZED。两者')],
  ];
  for (const [label, mutate] of mutations) {
    const mutated = mutate(original);
    assert.notEqual(mutated, original, `${label}: 变异未生效`);
    assert.throws(() => assertMemoryRules(mutated), `${label}: 变异未被拒绝`);
  }
});

test('项目记忆：入口指针可达，数值只在权威模块维护', () => {
  for (const path of ['core/workflow.md', 'core/acceptance.md', 'core/permissions.md', 'core/task-contract.md', 'core/templates/overview.template.md', 'core/README.md', 'README.md']) {
    assert.ok(read(path).includes('project-memory.md'), path);
  }
  const memory = read('core/project-memory.md');
  for (const token of ['192 KiB', '51.2 KiB', '44.8 KiB', 'import_floor', '2,000']) assert.ok(memory.includes(token), token);
  for (const path of docs.filter((candidate) => candidate !== 'core/project-memory.md')) {
    for (const token of ['192 KiB', '51.2 KiB', '44.8 KiB', 'import_floor']) {
      assert.ok(!read(path).includes(token), `${path}: ${token} 只应在 core/project-memory.md 维护`);
    }
  }
  assert.ok(!memory.includes('AGENT_WORKBENCH_ROOT/.agents/workflow/memory'), '记忆路径不能跟随安装根');
});

test('项目记忆：本地忽略与已跟踪例外在隔离夹具中生效', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-memory-'));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
  const git = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8', env });
  const memoryPath = '.agents/workflow/memory/project-memory.md';
  const gate = () => ({
    ignored: git('check-ignore', '--no-index', '-q', memoryPath).status === 0,
    tracked: git('ls-files', '--', '.agents/workflow/memory/').stdout.trim() !== '',
  });
  try {
    assert.equal(git('init', '-q').status, 0);
    mkdirSync(join(dir, '.agents/workflow/memory'), { recursive: true });
    writeFileSync(join(dir, memoryPath), '# 合成记忆\n');
    assert.deepEqual(gate(), { ignored: false, tracked: false }, '缺少忽略规则时不满足写入前置条件');
    writeFileSync(join(dir, '.git/info/exclude'), '/.agents/workflow/memory/\n');
    assert.deepEqual(gate(), { ignored: true, tracked: false });
    assert.equal(git('status', '--porcelain', '-uall').stdout, '');
    assert.equal(git('add', '-f', memoryPath).status, 0);
    assert.deepEqual(gate(), { ignored: true, tracked: true }, '已跟踪文件不受忽略规则豁免');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('项目记忆：Contract 与 overview 只传受限条目和回执', () => {
  assert.match(read('core/task-contract.md'), /^Project Memory: /m);
  const overview = read('core/templates/overview.template.md');
  for (const field of ['项目根 / 记忆路径', '结束评估', '结果版本 / 代次', '回执', '写入授权 / 来源', '业务验收关系']) {
    assert.match(overview, new RegExp(`^- ${field}: `, 'm'), field);
  }
  // 回执只列提交三值，无提交以 N/A 表达；未授权归入授权字段。
  const receipt = overview.match(/^- 回执: (.+)$/m)[1];
  assert.match(receipt, /UPDATED \/ FAILED \/ DEFERRED/);
  assert.ok(receipt.includes('N/A'), '未提交必须可写 N/A');
  for (const invalid of ['PROPOSE', 'NOT AUTHORIZED']) assert.ok(!receipt.includes(invalid), `回执不应含 ${invalid}`);
  const evaluation = overview.match(/^- 结束评估: (.+)$/m)[1];
  for (const result of ['SKIP', 'NO_CHANGE', 'PROPOSE', 'READY']) assert.ok(evaluation.includes(result), result);

  const permissions = read('core/permissions.md');
  assert.match(permissions, /### 记忆授权/);
  assert.match(permissions, /### 长期禁存规则/);
  assert.match(permissions, /入口、禁存范围与解除方式/);
  assert.match(permissions, /暂停相关自动写入并交 Main/);

  const acceptance = read('core/acceptance.md');
  const section = acceptance.slice(acceptance.indexOf('## 9. 知识沉淀'));
  for (const result of ['SKIP', 'NO_CHANGE', 'PROPOSE', 'READY', 'UPDATED', 'FAILED', 'DEFERRED']) assert.ok(section.includes(result), result);
  assert.match(section, /不改变 Verdict/);
  assert.match(section, /长期禁存规则/);
  assert.match(section, /core\/project-memory\.md/);
});

test('日志参数无效或无法打开时不执行检查', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-log-'));
  try {
    const runner = resolve(root, 'scripts/run-check.sh');
    const marker = join(dir, 'started');
    for (const args of [[], ['relative.log'], [join(dir, 'missing', 'check.log')]]) {
      const result = spawnSync('bash', [runner, ...args, ...(args.length ? ['bash', '-c', 'touch "$1"', '_', marker] : [])], { encoding: 'utf8', cwd: dir });
      assert.ifError(result.error);
      assert.equal(result.status, 2);
      assert.ok(!existsSync(marker));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('版本证据脚本：采集后一致，同长度内容变化与新增未跟踪文件都被识别', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-evidence-'));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const script = resolve(root, 'scripts/evidence-snapshot.sh');
  const run = (...args) => spawnSync('bash', [script, ...args], { cwd: dir, encoding: 'utf8' });
  try {
    git('init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'evidence/\n');
    writeFileSync(join(dir, 'a.ts'), 'const limit = 1;\n');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    writeFileSync(join(dir, 'a.ts'), 'const limit = 2;\n');
    writeFileSync(join(dir, 'new.ts'), 'partial');
    const out = join(dir, 'evidence', 'v1');
    const captured = run(base, out);
    assert.equal(captured.status, 0, captured.stderr);
    assert.match(readFileSync(join(out, 'untracked-hashes.txt'), 'utf8'), /\tnew\.ts\n$/);
    assert.equal(run('--verify', out).status, 0);
    writeFileSync(join(dir, 'a.ts'), 'const limit = 9;\n');
    const changed = run('--verify', out);
    assert.equal(changed.status, 1);
    assert.match(changed.stdout, /MISMATCH diff-fingerprint\.txt/);
    writeFileSync(join(dir, 'a.ts'), 'const limit = 2;\n');
    writeFileSync(join(dir, 'new.ts'), 'applied');
    assert.match(run('--verify', out).stdout, /MISMATCH untracked-hashes\.txt/);
    writeFileSync(join(dir, 'new.ts'), 'partial');
    writeFileSync(join(dir, 'extra.ts'), '');
    assert.match(run('--verify', out).stdout, /MISMATCH untracked-hashes\.txt/);
    assert.equal(run(base, 'relative').status, 2);
    assert.equal(run('no-such-ref', join(dir, 'evidence', 'bad')).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Session 进展探测：按模型汇总费用并列出读取路径', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-session-'));
  try {
    const file = join(dir, 'session.jsonl');
    const assistant = (timestamp, model, total, call) => JSON.stringify({ type: 'message', timestamp,
      message: { role: 'assistant', model, usage: { cost: { total } }, content: [{ type: 'toolCall', ...call }] } });
    writeFileSync(file, [
      JSON.stringify({ type: 'session', timestamp: '2026-01-01T00:00:00.000Z' }),
      assistant('2026-01-01T00:01:00.000Z', 'cheap', 0.25, { name: 'read', arguments: { path: '/rules/a.md' } }),
      assistant('2026-01-01T00:02:00.000Z', 'premium', 2, { name: 'bash', arguments: { command: 'pnpm verify' } }),
      '',
    ].join('\n'));
    const result = spawnSync(process.execPath, [resolve(root, 'scripts/session-progress.mjs'), file, '--reads'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /last_event=2026-01-01T00:02:00\.000Z .*turns=2 context_tokens=0 cost_usd=2\.2500/);
    assert.match(result.stdout, /model premium cost_usd=2\.0000/);
    assert.match(result.stdout, /tool 00:02:00 bash pnpm verify/);
    assert.match(result.stdout, /read \/rules\/a\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('等待循环：完成、停滞、费用上限与 Herdr 错误各有独立退出码', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-wait-'));
  try {
    const repo = join(dir, 'repo');
    mkdirSync(repo);
    spawnSync('git', ['init', '-q'], { cwd: repo });
    const session = join(dir, 'session.jsonl');
    writeFileSync(session, JSON.stringify({ type: 'message', timestamp: '2026-01-01T00:00:00.000Z',
      message: { role: 'assistant', model: 'm', usage: { input: 10, cost: { total: 3 } }, content: [] } }) + '\n');
    // Fake herdr: replays one scripted outcome per call; "edit" also simulates a code change.
    const herdr = join(dir, 'herdr');
    writeFileSync(herdr, `#!/usr/bin/env bash
n=$(cat "$PLAN_DIR/count" 2>/dev/null || echo 0); echo $((n + 1)) > "$PLAN_DIR/count"
step=$(sed -n "$((n + 1))p" "$PLAN_DIR/plan")
case $step in
  done) echo '{"result":{}}'; exit 0 ;;
  edit) echo "x$n" >> work.txt; echo '{"error":{"code":"timeout"}}'; exit 1 ;;
  boom) echo '{"error":{"code":"agent_not_found"}}'; exit 1 ;;
  *) echo '{"error":{"code":"timeout"}}'; exit 1 ;;
esac
`, { mode: 0o755 });
    const run = (plan, maxCost = '0') => {
      writeFileSync(join(dir, 'plan'), plan.join('\n') + '\n');
      rmSync(join(dir, 'count'), { force: true });
      return spawnSync('bash', [resolve(root, 'scripts/wait-agent.sh'), 'a1', session, join(dir, 'evidence'), '0', '2', maxCost],
        { cwd: repo, encoding: 'utf8', env: { ...process.env, HERDR_BIN: herdr, PLAN_DIR: dir } });
    };
    const progressed = run(['edit', 'wait', 'edit', 'done']);
    assert.equal(progressed.status, 0, progressed.stdout + progressed.stderr);
    assert.match(progressed.stdout, /agent_done/);
    const stalled = run(['wait', 'wait', 'done']);
    assert.equal(stalled.status, 3, stalled.stdout);
    assert.match(stalled.stdout, /stalled probes_without_progress=2/);
    assert.equal(run(['edit', 'done'], '2.5').status, 4);
    assert.equal(run(['boom']).status, 2);
    assert.equal(spawnSync('bash', [resolve(root, 'scripts/wait-agent.sh')]).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
