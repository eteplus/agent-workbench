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
    for (const path of [...docs, 'LICENSE', 'scripts/check-workflow.mjs', 'scripts/run-check.sh']) {
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
      const result = spawnSync(process.execPath, ['--test', '--test-name-pattern', pattern, join(dir, 'scripts/check-workflow.mjs')], { encoding: 'utf8', env });
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
