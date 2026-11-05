// Static workflow checks; these do not prove Agent runtime behavior.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
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
    for (const required of ['AGENT_WORKBENCH_ROOT', 'core/workflow.md', '续接', 'Task ID', 'runtimes/README.md', 'REQUIRED / OPTIONAL']) {
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
