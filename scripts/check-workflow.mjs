// Structural document checks and executable script regressions for Agent Workbench.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
    for (const [, target, sections] of read(path).matchAll(/`((?:core|runtimes|skills)\/[^`<>?*]+\.md)`(?: §(\d[\d.§、–,\- ]*))?/g)) {
      assert.ok(existsSync(resolve(root, target)), `${path}: ${target}`);
      for (const section of sections?.match(/\d+(?:\.\d+)?/g) ?? []) {
        const escaped = section.replaceAll('.', '\\.');
        assert.match(read(target), new RegExp(`^#{1,6} ${escaped}[. ]`, 'm'), `${path}: ${target} §${section}`);
      }
    }
  }
});

test('every core reference file is reachable from workflow or Entry docs', () => {
  const workflow = read('core/workflow.md');
  for (const ref of readdirSync(resolve(root, 'core/references')).filter((f) => f.endsWith('.md'))) {
    assert.ok(workflow.includes(`core/references/${ref}`), `core/workflow.md missing reference link: ${ref}`);
  }
  assert.ok(!existsSync(resolve(root, 'core/references/review-escalation.md')), 'three-tier review-escalation.md should stay removed');
});

test('repository documents and scripts use Simplified Chinese only (no Traditional characters)', () => {
  const isSimplifiedHan = (text) => {
    const han = (text.match(/\p{Script=Han}+/gu) || []).join('');
    if (!han) return { ok: true, bad: [] };
    const check = spawnSync('iconv', ['-f', 'UTF-8', '-t', 'EUC-CN'], { input: han });
    if (check.error) return { ok: true, bad: [] };
    if (check.status === 0) return { ok: true, bad: [] };
    const bad = [...new Set([...han].filter(
      (ch) => spawnSync('iconv', ['-f', 'UTF-8', '-t', 'EUC-CN'], { input: ch }).status !== 0,
    ))];
    return { ok: false, bad };
  };
  assert.equal(isSimplifiedHan('\u5f62\u614b\u9a57\u8b49').ok, false, 'detector must reject Traditional Han');
  const scripts = readdirSync(resolve(root, 'scripts')).map((f) => `scripts/${f}`);
  for (const path of [...docs, ...scripts]) {
    const res = isSimplifiedHan(read(path));
    assert.ok(res.ok, `${path} contains non-Simplified / Traditional characters: ${res.bad.join(', ')}`);
  }
});

test('structural checks reject broken file and section pointers', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-docs-'));
  try {
    for (const path of [...docs, 'LICENSE', 'scripts/check-workflow.mjs', 'scripts/run-check.sh', 'scripts/evidence-snapshot.sh', 'scripts/session-progress.mjs', 'scripts/wait-agent.sh', 'scripts/cleanup-agents.sh', 'scripts/gate.sh']) {
      const destination = join(dir, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, read(path));
    }
    const env = { ...process.env };
    delete env.NODE_TEST_CONTEXT;
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
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('runtime entries and Skill frontmatter retain their interface without premature post-completion sprawl', () => {
  for (const path of ['runtimes/pi/workflow.md', 'runtimes/claude-code/workflow/SKILL.md']) {
    const text = read(path);
    assert.ok(text.includes('AGENT_WORKBENCH_ROOT'), path);
    assert.ok(text.includes('core/workflow.md'), path);
    assert.ok(text.includes('runtimes/README.md'), path);
    assert.ok(!text.includes('cleanup-agents.sh'), `${path}: entry prompt should not pre-dump terminal cleanup steps before Intake`);
  }
  assert.match(read('runtimes/pi/workflow.md'), /\$\{@:-[^}]+\}/);
  for (const [path, name] of [['runtimes/claude-code/workflow/SKILL.md', 'workflow'], ['skills/ui-impl/SKILL.md', 'ui-impl']]) {
    const frontmatter = read(path).match(/^---\n([\s\S]*?)\n---/);
    assert.ok(frontmatter, path);
    assert.match(frontmatter[1], new RegExp(`^name: ${name}$`, 'm'));
    assert.match(frontmatter[1], /^description: .+/m);
  }
  assert.ok(!read('skills/ui-impl/SKILL.md').includes('core/'), 'ui-impl skill must stay self-contained without reverse pointers into core/');
});

test('explicit Skill dispatch examples keep single-line Contract input without startup-ceremony bloat', () => {
  const commands = [...read('runtimes/README.md').matchAll(/```text\n([\s\S]*?)\n[ \t]*```/g)]
    .map(([, block]) => block.trim()).filter((block) => block.startsWith('/skill:'));
  assert.ok(commands.length);
  for (const command of commands) {
    assert.ok(!command.includes('\n'), command);
    assert.match(command, /^\/skill:[a-z0-9-]+ .+Contract/);
    assert.ok(!command.includes('启动核验'), 'dispatch prompt should not require startup verification ceremony');
  }
});

test('Main boundary, completion criteria, guarded fast-path, and self-contained Contract stay aligned', () => {
  const workflow = read('core/workflow.md');
  assert.match(workflow, /模块入口与公共契约/);
  assert.match(workflow, /严禁使用 `python3`、`node -e`、`sed -i`/);
  assert.match(workflow, /\*\*读取目标仓库根 `AGENTS\.md`\*\*/);
  assert.match(workflow, /\*\*持续等待不中断回合\*\*/);
  assert.match(workflow, /\*\*完成条件\*\*：已读取项目 `AGENTS\.md`/);
  assert.match(workflow, /`Developer Review` 待确认期间（`NEEDS DEVELOPER REVIEW`）必须保留已有子 Agent Pane/);
  assert.match(workflow, /cleanup-agents\.sh/);

  for (const path of docs) {
    const content = read(path);
    assert.ok(!content.includes('Thin Main') && !content.includes('轻主控'), `${path}: should use unified term Main`);
    assert.ok(!content.includes('describeTool'), `${path}: should not leak codemode-specific describeTool`);
    assert.ok(!content.includes('浅层'), `${path}: avoid unprofessional term 浅层`);
    assert.ok(!content.includes('12 字段'), `${path}: avoid stale field-count prefix`);
    assert.ok(!content.includes('150K'), `${path}: avoid rigid 150K session-destroy threshold that breaks prompt caching`);
  }

  const classification = read('core/task-classification.md');
  const levels = [...classification.matchAll(/^\| (L[012]) \|/gm)].map(([, level]) => level);
  assert.deepEqual(levels, ['L0', 'L1', 'L2']);
  assert.match(classification, /### Developer Review 触发判定/);
  assert.match(classification, /收尾快速通道/);

  const acceptance = read('core/acceptance.md');
  assert.match(acceptance, /先改后测时序铁律/);
  assert.match(acceptance, /### 状态与生命周期覆盖/);
  assert.match(acceptance, /允许走 1 次快速通道/);
  assert.match(acceptance, /含条件分支、状态流转、计算公式、权限校验、接口\/数据契约/);
  assert.match(acceptance, /Reviewed Tree/);
  assert.match(acceptance, /\*\*Gate 放行条件\*\*：/);
  assert.match(acceptance, /\*\*严禁跳过 `REQUIRED` 的 Developer Review\*\*/);
  assert.match(acceptance, /### 按需异常复盘/);

  const devReview = read('core/references/developer-review.md');
  assert.match(devReview, /## 3\. 验收条款变更/);
  assert.match(devReview, /口头批准不自动替代该证据/);

  const contractDoc = read('core/task-contract.md');
  assert.match(contractDoc, /携带当前角色的权限、工具规范与边界硬护栏/);
  assert.match(contractDoc, /core\/templates\//);
  const templateBlock = contractDoc.match(/```text\n([\s\S]*?)\n```/);
  assert.ok(templateBlock);
  const expectedFields = [
    'Task ID', 'Subtask ID', 'Agent Role', 'Task Type', 'Output Language',
    'Model / Thinking', 'Skills', 'Goal', 'Workspace', 'Context & Plan',
    'Role Rules', 'Checks', 'Acceptance Criteria', 'Deliverables',
  ];
  for (const field of expectedFields) {
    assert.match(templateBlock[1], new RegExp(`^${field}:`, 'm'), `Contract missing ${field}`);
  }
  assert.match(templateBlock[1], /Allowed Paths:/);
  assert.match(templateBlock[1], /Excluded Paths:/);
  assert.match(templateBlock[1], /严禁擅自 mv \/ rm/);
  assert.match(templateBlock[1], /严禁使用 python3 \/ node \/ sed -i/);
});

test('streamlined report templates retain essential status fields without ceremony bloat', () => {
  const handoff = read('core/templates/handoff.template.md');
  for (const status of ['DONE', 'PARTIAL', 'BLOCKED', 'FAILED']) assert.ok(handoff.includes(status));
  assert.ok(!handoff.includes('启动核验:'), 'handoff template should not require startup verification block');

  const decisions = read('core/templates/decisions.template.md');
  for (const status of ['USER_APPROVED', 'PROJECT_CONVENTION', 'AGENT_PROPOSAL', 'PROPOSED', 'CONFIRMED', 'REJECTED', 'DEFERRED']) {
    assert.ok(decisions.includes(status));
  }

  const overview = read('core/templates/overview.template.md');
  for (const field of ['Developer Review', 'External Delivery', 'Project Memory']) {
    assert.match(overview, new RegExp(`^- ${field}: `, 'm'), field);
  }

  const visual = read('skills/ui-impl/references/visual-report.template.md');
  assert.match(visual, /^\| Required State \|/m);
  assert.match(visual, /^- Visual verification:/m);
});

test('项目记忆：预算、默认跳过、只读回退与人工编辑保护自洽（单一事实源）', () => {
  const memory = read('core/project-memory.md');
  const permissions = read('core/permissions.md');

  assert.match(memory, /`16 KiB`/);
  assert.match(memory, /`25` 条/);
  assert.match(memory, /最多 `5` 条/);
  assert.match(memory, /默认 `SKIP`/);
  assert.ok(!memory.includes('import_floor'), 'pseudo-database import_floor should stay removed');
  assert.ok(!memory.includes('deletion_markers'), 'pseudo-database deletion_markers should stay removed');

  assert.match(memory, /完全只读[^\n]*只在任务上下文记录，不创建任何目录或文件/);
  assert.match(permissions, /默认管理目标项目本地/);
  assert.match(permissions, /core\/project-memory\.md` §1/);
  assert.match(memory, /保留开发者手动编写的内容，不静默截断或用旧内容覆盖/);
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
    writeFileSync(join(dir, memoryPath), '# 记忆\n');
    assert.deepEqual(gate(), { ignored: false, tracked: false });
    writeFileSync(join(dir, '.git/info/exclude'), '/.agents/workflow/memory/\n');
    assert.deepEqual(gate(), { ignored: true, tracked: false });
    assert.equal(git('add', '-f', memoryPath).status, 0);
    assert.deepEqual(gate(), { ignored: true, tracked: true });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('共享检查入口保留退出码与完整日志，且日志无法打开时不启动命令', () => {
  const example = read('core/acceptance.md').match(/```bash\nbash "\$AGENT_WORKBENCH_ROOT\/(scripts\/run-check\.sh)" /);
  assert.ok(example, '缺少共享检查入口示例');
  const runner = resolve(root, example[1]);
  const dir = mkdtempSync(join(tmpdir(), 'workbench-check-'));
  try {
    for (const code of [0, 1, 7]) {
      const log = join(dir, `exit-${code}.log`);
      const result = spawnSync('bash', [runner, log, 'bash', '-c',
        `printf 'line-%s\\n' {1..60}; printf 'stderr-marker\\n' >&2; exit ${code}`], { encoding: 'utf8' });
      assert.equal(result.status, code);
      const full = readFileSync(log, 'utf8');
      assert.equal(full.trim().split('\n').length, 62);
      assert.ok(full.trimEnd().endsWith(`check_exit=${code}`), 'log ends with check_exit for gate readers');
      assert.ok(result.stdout.includes(`check_exit=${code}`));
    }
    const marker = join(dir, 'started');
    for (const args of [[], ['relative.log'], [join(dir, 'missing', 'check.log')]]) {
      const result = spawnSync('bash', [runner, ...args, ...(args.length ? ['bash', '-c', 'touch "$1"', '_', marker] : [])], { encoding: 'utf8', cwd: dir });
      assert.equal(result.status, 2);
      assert.ok(!existsSync(marker));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('基线快照脚本：保存未跟踪文件副本并在变更时输出行级 diff', () => {
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
    writeFileSync(join(dir, 'panel.vue'), '<template>Old Label</template>\n');
    const out = join(dir, 'evidence', 'baseline');
    assert.equal(run(base, out).status, 0);
    assert.equal(readFileSync(join(out, 'untracked', 'panel.vue'), 'utf8'), '<template>Old Label</template>\n');
    assert.equal(run('--verify', out).status, 0);

    writeFileSync(join(dir, 'panel.vue'), '<template>New Label</template>\n');
    const diffed = run('--verify', out);
    assert.equal(diffed.status, 1);
    assert.match(diffed.stdout, /MISMATCH untracked-hashes\.txt/);
    assert.match(diffed.stdout, /-.*Old Label/);
    assert.match(diffed.stdout, /\+.*New Label/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Session 进展探测：汇总花费，并对缺失文件与未刷盘尾行容错', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-session-'));
  const script = resolve(root, 'scripts/session-progress.mjs');
  try {
    const missing = spawnSync(process.execPath, [script, join(dir, 'not-created-yet.jsonl')], { encoding: 'utf8' });
    assert.equal(missing.status, 0);
    assert.match(missing.stdout, /session_missing=1/);

    const dash = spawnSync(process.execPath, [script, '-'], { encoding: 'utf8' });
    assert.equal(dash.status, 0);
    assert.match(dash.stdout, /session_missing=1/);

    const file = join(dir, 'session.jsonl');
    const assistant = (timestamp, model, total, call) => JSON.stringify({
      type: 'message', timestamp,
      message: { role: 'assistant', model, usage: { cost: { total } }, content: [{ type: 'toolCall', ...call }] },
    });
    writeFileSync(file, [
      JSON.stringify({ type: 'session', timestamp: '2026-01-01T00:00:00.000Z' }),
      assistant('2026-01-01T00:01:00.000Z', 'cheap', 0.25, { name: 'read', arguments: { path: '/src/a.ts' } }),
      assistant('2026-01-01T00:02:00.000Z', 'premium', 2, { name: 'bash', arguments: { command: 'pnpm verify' } }),
      '{"type":"message","partial_unflushed_line',
    ].join('\n'));
    const result = spawnSync(process.execPath, [script, file, '--reads'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /turns=2 context_tokens=0 cost_usd=2\.2500/);
    assert.match(result.stdout, /model premium cost_usd=2\.0000/);
    assert.match(result.stdout, /read \/src\/a\.ts/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('等待循环：支持有界 max-cycles 返回 still_working(1)，以及完成(0)、停滞(3)、费用上限(4)、错误(2)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-wait-'));
  try {
    const repo = join(dir, 'repo');
    mkdirSync(repo);
    spawnSync('git', ['init', '-q'], { cwd: repo });
    const session = join(dir, 'session.jsonl');
    writeFileSync(session, JSON.stringify({
      type: 'message', timestamp: '2026-01-01T00:00:00.000Z',
      message: { role: 'assistant', model: 'm', usage: { input: 10, cost: { total: 3 } }, content: [] },
    }) + '\n');

    const herdr = join(dir, 'herdr');
    writeFileSync(herdr, `#!/usr/bin/env bash
n=$(cat "$PLAN_DIR/count" 2>/dev/null || echo 0); echo $((n + 1)) > "$PLAN_DIR/count"
step=$(sed -n "$((n + 1))p" "$PLAN_DIR/plan")
case $step in
  done) echo '{"result":{}}'; exit 0 ;;
  edit) echo "x$n" >> work.txt; echo '{"error":{"code":"timeout"}}'; exit 1 ;;
  readturn) echo '{"type":"message","timestamp":"2026-01-01T00:01:00.000Z","message":{"role":"assistant","model":"m","usage":{"input":10,"cost":{"total":0.1}},"content":[]}}' >> "$SESSION_FILE"; echo '{"error":{"code":"timeout"}}'; exit 1 ;;
  boom) echo '{"error":{"code":"agent_not_found"}}'; exit 1 ;;
  *) echo '{"error":{"code":"timeout"}}'; exit 1 ;;
esac
`, { mode: 0o755 });

    const runArgs = (plan, args, sess = session) => {
      writeFileSync(join(dir, 'plan'), plan.join('\n') + '\n');
      rmSync(join(dir, 'count'), { force: true });
      return spawnSync('bash', [resolve(root, 'scripts/wait-agent.sh'), ...args],
        { cwd: repo, encoding: 'utf8', env: { ...process.env, HERDR_BIN: herdr, PLAN_DIR: dir, SESSION_FILE: sess } });
    };
    const run = (plan, maxCost = '0', maxCycles = '0', sess = session) =>
      runArgs(plan, ['a1', sess, join(dir, 'evidence'), '0', '2', maxCost, maxCycles], sess);

    // Default (omitting $6/$7, like 5-arg call) MUST be bounded to 2 cycles instead of hanging infinitely!
    const defaultBounded = runArgs(['edit', 'edit', 'done'], ['a1', session, join(dir, 'evidence'), '0', '2']);
    assert.equal(defaultBounded.status, 1, defaultBounded.stdout + defaultBounded.stderr);
    assert.match(defaultBounded.stdout, /still_working cycles=2/);

    // Read-only Reviewer growing session.jsonl without git diff changes MUST count as progress, not stalled!
    const readOnlyWorking = runArgs(['readturn', 'readturn', 'done'], ['a1', session, join(dir, 'evidence'), '0', '2']);
    assert.equal(readOnlyWorking.status, 1, readOnlyWorking.stdout + readOnlyWorking.stderr);
    assert.match(readOnlyWorking.stdout, /still_working cycles=2/);

    const working = run(['edit', 'edit', 'done'], '0', '2', join(dir, 'missing.jsonl'));
    assert.equal(working.status, 1, working.stdout + working.stderr);
    assert.match(working.stdout, /still_working cycles=2/);

    const progressed = run(['edit', 'wait', 'edit', 'done']);
    assert.equal(progressed.status, 0);
    assert.match(progressed.stdout, /agent_done/);

    const stalled = run(['wait', 'wait', 'done']);
    assert.equal(stalled.status, 3);
    assert.match(stalled.stdout, /stalled probes_without_progress=2/);

    assert.equal(run(['edit', 'done'], '2.5').status, 4);
    assert.equal(run(['boom']).status, 2);
    assert.equal(spawnSync('bash', [resolve(root, 'scripts/wait-agent.sh')]).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('终态 Gate：指纹按内容计算（提交前后一致），过期、未终态、未批准、PROPOSED、缺成本时拒绝回收', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-gate-'));
  const git = (...args) => {
    const result = spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const gate = (...args) => spawnSync('bash', [resolve(root, 'scripts/gate.sh'), ...args], { cwd: dir, encoding: 'utf8' });
  const task = join(dir, 'task');
  try {
    git('init', '-q');
    writeFileSync(join(dir, '.gitignore'), 'task/\n');
    writeFileSync(join(dir, 'a.ts'), 'export const x = 1;\n');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base');
    const base = git('rev-parse', 'HEAD');
    mkdirSync(join(task, 'subtasks', 'review'), { recursive: true });
    writeFileSync(join(task, 'subtasks', 'review', 'review.md'), '# review\n');
    writeFileSync(join(task, 'decisions.md'), '| D1 | x | USER_APPROVED | CONFIRMED |\n');
    const overview = ({ state = 'PASS', dr = 'REQUIRED — APPROVED', tree = '', usage = true } = {}) => writeFileSync(join(task, 'overview.md'),
      `- 当前阶段 / Verdict: ${state}\n- Developer Review: ${dr}\n- Base Commit ${base}\n${tree ? `- Reviewed Tree: ${tree}\n` : ''}${usage ? '## Models & Usage\n' : ''}`);

    writeFileSync(join(dir, 'a.ts'), 'export const x = 2;\n');
    writeFileSync(join(dir, 'b.ts'), 'export const y = 1;\n');
    const tree = gate('tree', base).stdout.trim();
    assert.match(tree, /^[0-9a-f]{40}$/);
    assert.equal(gate('tree', base).stdout.trim(), tree, 'deterministic');

    overview({ tree });
    assert.equal(gate('check', task).status, 0);

    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'work');
    assert.equal(gate('tree', base).stdout.trim(), tree, 'fingerprint survives committing');
    assert.equal(gate('check', task).status, 0, 'gate still passes after commit');

    writeFileSync(join(dir, 'b.ts'), 'export const y = 2;\n');
    let result = gate('check', task);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /gate_fail=review_stale/);

    overview({ tree: gate('tree', base).stdout.trim() });
    assert.equal(gate('check', task).status, 0, 'updated Reviewed Tree covers the final tree');

    overview({ state: 'IN PROGRESS', dr: 'REQUIRED — PENDING', tree, usage: false });
    writeFileSync(join(task, 'decisions.md'), '| D1 | x | AGENT_PROPOSAL | PROPOSED |\n');
    result = gate('check', task);
    assert.equal(result.status, 1);
    for (const code of ['overview_status_not_final', 'no_models_and_usage', 'decisions_proposed', 'developer_review_not_approved', 'review_stale']) {
      assert.match(result.stdout, new RegExp(`gate_fail=${code}`));
    }

    const fake = join(dir, 'herdr');
    writeFileSync(fake, '#!/usr/bin/env bash\nprintf \'{"agents":[]}\'\n', { mode: 0o755 });
    const cleanup = spawnSync('bash', [resolve(root, 'scripts/cleanup-agents.sh'), '--task-root', task, '--prefix', 'x'],
      { cwd: dir, encoding: 'utf8', env: { ...process.env, HERDR_BIN: fake } });
    assert.equal(cleanup.status, 5);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('子 Agent 清理脚本：按前缀清理并保护 Main 自身 HERDR_PANE_ID', () => {
  const dir = mkdtempSync(join(tmpdir(), 'workbench-cleanup-'));
  try {
    const log = join(dir, 'actions.log');
    const herdr = join(dir, 'herdr');
    writeFileSync(herdr, `#!/usr/bin/env bash
if [[ $1 == agent && $2 == list ]]; then
  cat <<'JSON'
{"result":{"agents":[
  {"name":"task42","pane_id":"w4:p1P"},
  {"name":"task42-review","pane_id":"w4:p1Q"},
  {"name":"task42-main","pane_id":"w4:pMain"},
  {"name":"other-task","pane_id":"w4:p99"}
]}}
JSON
  exit 0
fi
printf '%s\\n' "$*" >> "$ACTION_LOG"
exit 0
`, { mode: 0o755 });

    const result = spawnSync('bash', [resolve(root, 'scripts/cleanup-agents.sh'), '--prefix', 'task42'], {
      encoding: 'utf8',
      env: { ...process.env, HERDR_BIN: herdr, HERDR_PANE_ID: 'w4:pMain', ACTION_LOG: log },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /cleanup_done closed=2/);
    const dashed = spawnSync('bash', [resolve(root, 'scripts/cleanup-agents.sh'), '--prefix', 'task42-'], {
      encoding: 'utf8',
      env: { ...process.env, HERDR_BIN: herdr, HERDR_PANE_ID: 'w4:pMain', ACTION_LOG: log },
    });
    assert.match(dashed.stdout, /cleanup_done closed=2/, 'trailing dash in prefix is tolerated');
    const actions = readFileSync(log, 'utf8');
    assert.match(actions, /pane close w4:p1P/);
    assert.match(actions, /pane close w4:p1Q/);
    assert.ok(!actions.includes('w4:pMain'), 'must never close Main pane');
    assert.ok(!actions.includes('w4:p99'), 'must not close unrelated agent pane');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
