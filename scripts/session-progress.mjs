#!/usr/bin/env node
// Compact progress probe for a Pi session file: last activity, context size, cost by model, recent tools.
// Usage: node session-progress.mjs <session.jsonl> [--reads]
//   --reads  also list unique paths opened with the read tool (startup-input verification)
import { readFileSync } from 'node:fs';

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node session-progress.mjs <session.jsonl> [--reads]');
  process.exit(2);
}

let last, turns = 0, context = 0;
const cost = {}, tools = [], reads = new Set();
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (!line) continue;
  const event = JSON.parse(line);
  if (event.type !== 'message') continue;
  last = event.timestamp;
  const message = event.message;
  if (message.role !== 'assistant') continue;
  turns += 1;
  const usage = message.usage ?? {};
  context = (usage.input ?? 0) + (usage.cacheRead ?? 0) + (usage.cacheWrite ?? 0); // size of the latest prompt
  cost[message.model] = (cost[message.model] ?? 0) + (message.usage?.cost?.total ?? 0);
  for (const block of message.content ?? []) {
    if (block.type !== 'toolCall') continue;
    const args = block.arguments ?? {};
    tools.push(`${event.timestamp.slice(11, 19)} ${block.name} ${String(args.command ?? args.path ?? args.pattern ?? '').replace(/\s+/g, ' ').slice(0, 100)}`);
    if (block.name === 'read' && args.path) reads.add(args.path);
  }
}

const minutes = last ? ((Date.now() - Date.parse(last)) / 60000).toFixed(1) : 'N/A';
const total = Object.values(cost).reduce((sum, value) => sum + value, 0);
console.log(`last_event=${last ?? 'N/A'} idle_min=${minutes} turns=${turns} context_tokens=${context} cost_usd=${total.toFixed(4)}`);
for (const [model, value] of Object.entries(cost)) console.log(`  model ${model} cost_usd=${value.toFixed(4)}`);
for (const tool of tools.slice(-5)) console.log(`  tool ${tool}`);
if (flag === '--reads') for (const path of reads) console.log(`  read ${path}`);
