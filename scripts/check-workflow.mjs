// Document checks and a Bash example regression; neither proves Agent runtime behavior.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

// shortcut: links in fenced examples are checked too; add fence parsing if a real example causes a false failure.
test('local document links resolve', () => {
  for (const path of docs) {
    for (const [, target] of read(path).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (target.includes('://') || target.startsWith('#')) continue;
      assert.ok(existsSync(resolve(root, dirname(path), target.split('#')[0])), `${path}: ${target}`);
    }
  }
});

test('Core dispatch and loading paths resolve from the Workbench root', () => {
  for (const path of ['core/workflow.md', 'core/task-contract.md']) {
    const text = read(path);
    assert.ok(!text.includes('`references/'), `${path}: ambiguous dispatch path`);
    assert.ok(!text.includes('按 references/'), `${path}: ambiguous retrieval path`);
    const targets = [...text.matchAll(/`((?:core|runtimes|skills)\/[^`<>]+\.md)`/g)]
      .map(([, target]) => target);
    assert.ok(targets.length, `${path}: loading paths missing`);
    for (const target of targets) {
      assert.ok(existsSync(resolve(root, target)), `${path}: ${target}`);
    }
  }
  const workflow = read('core/workflow.md');
  for (const template of ['overview', 'handoff']) {
    assert.ok(workflow.includes(`core/templates/${template}.template.md`), `Missing ${template} template pointer`);
  }
});

test('runtime entries delegate to Core', () => {
  for (const path of ['runtimes/pi/workflow.md', 'runtimes/claude-code/workflow/SKILL.md']) {
    const text = read(path);
    for (const required of ['AGENT_WORKBENCH_ROOT', 'core/workflow.md', '续接', 'Task ID', 'runtimes/README.md', 'REQUIRED / OPTIONAL', '任务语言', '用户实际目标']) {
      assert.ok(text.includes(required), `${path}: missing ${required}`);
    }
    assert.ok(!text.includes('再附 Task Contract'), path);
    assert.ok(!text.includes('/skill:grill-with-docs'), path);
  }
});

test('Skill dispatch examples keep the Contract on one line', () => {
  const commands = [...read('runtimes/README.md').matchAll(/```text\n([\s\S]*?)\n[ \t]*```/g)]
    .map(([, block]) => block.trim())
    .filter((block) => block.startsWith('/skill:'));
  assert.ok(commands.length, 'Explicit dispatch example missing');
  for (const command of commands) {
    assert.ok(!command.includes('\n'), command);
    assert.match(command, /^\/skill:[a-z0-9-]+ .+Contract/);
  }
});

test('artifact, approval, fallback and metadata rules are present', () => {
  const contract = read('core/task-contract.md');
  for (const rule of ['一个 Workflow 任务只有一个', 'subtasks/<subtask-id>/', '唯一写入负责人', 'USER_APPROVED', 'Main 会话', 'REQUIRED 不得使用 CORE_FALLBACK', '授权目标 Agent 用 printf']) {
    assert.ok(contract.includes(rule), `Contract: missing ${rule}`);
  }
  assert.ok(read('core/permissions.md').includes('批准只覆盖该轮问题'));
  assert.ok(read('core/acceptance.md').includes('暂停重发'));
  const routing = read('core/model-routing.md');
  assert.ok(routing.includes('PI_REASONING_LEVEL'));
  assert.ok(!routing.includes('PI_THINKING_LEVEL'));
});

test('任务语言贯穿 Contract、模板与验收定义（静态）', () => {
  const workflow = read('core/workflow.md');
  for (const rule of ['Output Language', '中文目标使用中文', '英文目标使用英文', '原始日志保持原样']) {
    assert.ok(workflow.includes(rule), `Workflow: missing ${rule}`);
  }
  assert.ok(read('core/task-contract.md').includes('Output Language:'));
  for (const template of ['overview', 'handoff', 'decisions']) {
    const content = read(`core/templates/${template}.template.md`);
    assert.ok(content.includes('Output Language'), template);
    assert.ok(content.includes('core/workflow.md §2'), template);
  }
  assert.ok(read('core/acceptance.md').includes('生成产物符合 Output Language'));
  assert.ok(read('core/permissions.md').includes('写入前校验最终文本'));
});

test('阶段写入、基线与新实施会话规则连通（静态）', () => {
  assert.ok(read('core/task-contract.md').includes('所有阶段报告（包括 Research'));
  assert.ok(read('core/task-contract.md').includes('基线与修改后证据分文件保存'));
  assert.ok(read('core/workflow.md').includes('Research → Implement 使用新的 Pi Session'));
  assert.ok(read('runtimes/README.md').includes('核验新的 Pi Session 身份'));
  assert.ok(read('core/acceptance.md').includes('含 Research'));
  const scenarios = read('tests/workflow-scenarios.md');
  for (const scenario of ['中文 / English 完整交付', '前序基线保护', '连续任务临时路径碰撞']) {
    assert.ok(scenarios.includes(scenario), scenario);
  }
});

test('通用交付独立于 Handoff，决策记录由 Main 写入（静态）', () => {
  const contract = read('core/task-contract.md');
  const common = contract.match(/### 通用交付规则\n([\s\S]*?)(?=\n### )/);
  assert.ok(common, '通用交付规则应是独立小节');
  for (const rule of ['所有阶段报告', 'Output Language', '源码、Diff、测试输出', '交付位置使用绝对路径']) {
    assert.ok(common[1].includes(rule), `通用交付缺少 ${rule}`);
  }
  const handoff = contract.match(/### `handoff.md`：实现理解\n([\s\S]*?)(?=\n## )/);
  assert.ok(handoff);
  assert.ok(!handoff[1].includes('所有阶段报告'));
  assert.ok(contract.includes('Main 负责更新 `decisions.md`'));
  assert.ok(!contract.includes('Main 或 Agent 在实施期间'));
});

test('视觉交付服从 Contract，并行章节引用工作区规则（静态）', () => {
  const visual = read('skills/ui-impl/SKILL.md');
  assert.ok(visual.includes('exact absolute paths assigned in the Task Contract'));
  assert.ok(visual.includes('default layout for a single visual implementation'));
  assert.ok(visual.includes('subtasks/<subtask-id>/'));
  assert.ok(!visual.includes('Keep `visual-report.md` at the task directory root'));
  const parallel = read('core/permissions.md').match(/## 5. Parallel Work\n([\s\S]*?)(?=\n## )/);
  assert.ok(parallel);
  assert.ok(parallel[1].includes('本文件 §2'));
  assert.ok(!parallel[1].includes('由 Main 先取得用户明确授权'));
});

test('委派必需规则、版本证据和验证调度连通（静态）', () => {
  const contract = read('core/task-contract.md');
  assert.ok(contract.includes('必需通用规则'));
  assert.ok(contract.includes('core/task-contract.md` §1、§6–7'));
  assert.ok(contract.includes('core/permissions.md` §2–4'));
  assert.ok(contract.includes('加载证据'));
  assert.ok(contract.includes('Implementation Evidence:'));
  assert.ok(read('core/templates/handoff.template.md').includes('Rule Loading Evidence:'));
  for (const path of ['core/templates/overview.template.md', 'core/templates/handoff.template.md']) {
    assert.ok(read(path).includes('Implementation Evidence'), path);
  }
  const acceptance = read('core/acceptance.md');
  for (const rule of ['完整二进制 Diff', '未跟踪文件', 'SHA-256', '不能以 HEAD、文件列表或增删行数', '共享输出']) {
    assert.ok(acceptance.includes(rule), `验收缺少 ${rule}`);
  }
  assert.ok(read('core/permissions.md').includes('验证并行条件见 `acceptance.md` §2'));
  const runtime = read('runtimes/README.md');
  assert.ok(runtime.includes('读取 Contract 及其必需规则'));
  assert.ok(!runtime.includes('REQUIRED 缺失 / 未展开时报告 Main 并停止受影响工作'));
});

test('Secondary 与 Escalation 是独立条件分支（静态）', () => {
  const acceptance = read('core/acceptance.md');
  const escalation = acceptance.match(/### Reviewer Escalation\n([\s\S]*?)(?=\n## )/);
  assert.ok(acceptance.includes('### Secondary Review\n'));
  assert.ok(escalation, '缺少独立 Escalation 分支');
  assert.ok(!escalation[1].includes('Secondary Reviewer 使用独立'));
  assert.ok(escalation[1].includes('不以 Secondary Review 完成为固定前置条件'));
  assert.ok(escalation[1].includes('Main'));
  assert.ok(!acceptance.includes('Sonnet 只处理'));
});

test('加载证据关联实际事件、需求输入与 Main 顺序抽查（静态）', () => {
  const contract = read('core/task-contract.md');
  for (const rule of ['原始需求正文及验收标准', '实际覆盖范围', '工具调用/事件位置', 'Runtime 自动注入', '行数统计', '补读如实标明', '首次相关写入/检查', '复核受影响工作']) {
    assert.ok(contract.includes(rule), `加载规则缺少 ${rule}`);
  }
  const template = read('core/templates/handoff.template.md');
  assert.ok(template.includes('Session tool/event references'));
  assert.ok(template.includes('requirement inputs'));
  const scenarios = read('tests/workflow-scenarios.md');
  for (const scenario of ['加载声明与事件矛盾', '需求正文晚读', '检查包装外层抵消', '后台检查无退出码']) {
    assert.ok(scenarios.includes(scenario), scenario);
  }
});

test('检查状态、采集用途与工作区原始快照规则连通（静态）', () => {
  const acceptance = read('core/acceptance.md');
  for (const rule of ['包装作为最终执行命令', '后续成功命令覆盖失败退出码', '重定向可用', '等待完成依据与最终退出码', '原执行上下文', '无最终退出码标记 NOT VERIFIED', '各角色采集序号不等于实现版本', '用途（过程检查 / 最终验收）', '停止相关实现写入的依据', '最终验收同时保存并引用工作区状态快照']) {
    assert.ok(acceptance.includes(rule), `检查与证据规则缺少 ${rule}`);
  }
  assert.ok(read('core/task-contract.md').includes('git status --porcelain -uall'));
  assert.ok(read('core/templates/handoff.template.md').includes('Background checks (if any)'));
  for (const scenario of ['采集序号与实现版本', '过程与最终证据']) {
    assert.ok(read('tests/workflow-scenarios.md').includes(scenario), scenario);
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

test('文档中的检查调用保留真实退出码和完整日志', () => {
  const match = read('core/acceptance.md').match(/```bash\nbash -c '([\s\S]*?)' _ /);
  assert.ok(match, '缺少可执行的检查示例');
  const dir = mkdtempSync(join(tmpdir(), 'workbench-check-'));
  try {
    for (const code of [0, 7]) {
      const log = join(dir, `exit-${code}.log`);
      const result = spawnSync('bash', ['-c', match[1], '_', log, 'bash', '-c',
        `printf 'line-%s\\n' {1..60}; printf 'stderr-marker\\n' >&2; exit ${code}`], { encoding: 'utf8' });
      assert.ifError(result.error);
      assert.equal(result.status, code);
      const full = readFileSync(log, 'utf8');
      assert.ok(full.startsWith('line-1\n'));
      assert.ok(full.includes('line-60\nstderr-marker\n'));
      assert.equal(full.trim().split('\n').length, 61);
      assert.ok(!result.stdout.includes('line-1\n'), '摘要应只显示尾部');
      assert.ok(result.stdout.includes(`check_exit=${code}`));
      if (code === 7) {
        for (const suffix of ['2>&1 | tail -40', '|| true', '; printf "summary-only\\n"']) {
          const masked = spawnSync('bash', ['-c', `bash -c "$1" _ "$2" bash -c "$3" ${suffix}`,
            '_', match[1], log, 'printf "failed-check\\n"; exit 7'], { encoding: 'utf8' });
          assert.ifError(masked.error);
          assert.equal(masked.status, 0, `${suffix}: 外层命令会抵消失败`);
          assert.ok(masked.stdout.includes('check_exit=7'));
          assert.equal(readFileSync(log, 'utf8'), 'failed-check\n');
        }
        const summary = join(dir, 'summary.log');
        const redirected = spawnSync('bash', ['-c', 'bash -c "$1" _ "$2" bash -c "$3" > "$4"',
          '_', match[1], log, 'printf "failed-check\\n"; exit 7', summary], { encoding: 'utf8' });
        assert.ifError(redirected.error);
        assert.equal(redirected.status, 7, '单纯重定向保留失败退出码');
        assert.ok(readFileSync(summary, 'utf8').includes('check_exit=7'));
        assert.equal(readFileSync(log, 'utf8'), 'failed-check\n');
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
