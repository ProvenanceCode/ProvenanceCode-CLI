/**
 * prvc tap  — Task Attestation/Provenance (TAP-*)
 * prvc act  — Action Records (ACT-*)
 * prvc meo  — Memory Evidence Objects (MEO-*)
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, getCurrentTimestamp, resolveGitAuthor, getNextSimpleSequenceNumber, getArtifactFiles } from '../utils';
import { TapRecord, ActRecord, MeoRecord } from '../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function requireConfig(baseDir: string) {
  const config = loadConfig(baseDir);
  if (!config) {
    console.error(chalk.red('❌ ProvenanceCode is not initialized. Run: prvc init'));
    process.exit(1);
  }
  return config;
}

function resolveGitBranch(baseDir: string): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: baseDir }).toString().trim();
  } catch { return 'unknown'; }
}

function resolveGitCommit(baseDir: string): string {
  try {
    const { execSync } = require('child_process');
    return execSync('git rev-parse HEAD', { cwd: baseDir }).toString().trim();
  } catch { return 'unknown'; }
}

function tasksDir(baseDir: string, config: ReturnType<typeof loadConfig>) {
  return path.join(baseDir, config!.paths.tasks ?? 'provenance/tasks');
}
function actionsDir(baseDir: string, config: ReturnType<typeof loadConfig>) {
  return path.join(baseDir, config!.paths.actions ?? 'provenance/actions');
}
function memoriesDir(baseDir: string, config: ReturnType<typeof loadConfig>) {
  return path.join(baseDir, config!.paths.memories ?? 'provenance/memories');
}

// ── TAP ───────────────────────────────────────────────────────────────────────

export function tapCommand(
  baseDir: string,
  action: string,
  titleOrId: string | undefined,
  options: {
    agent?: string;
    model?: string;
    outcome?: string;
    session?: string;
    risk?: string;
    humanReview?: boolean;
    status?: string;
    recent?: string;
  }
): void {
  const config = requireConfig(baseDir);
  const dir = tasksDir(baseDir, config);

  switch (action) {
    case 'new':
      tapNew(baseDir, dir, titleOrId, options);
      break;
    case 'list':
      tapList(dir, options.status, parseInt(options.recent ?? '10', 10));
      break;
    case 'show':
      tapShow(dir, titleOrId);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Usage: prvc tap <new|list|show> [title-or-id] [options]'));
      process.exit(1);
  }
}

function tapNew(
  baseDir: string,
  dir: string,
  title: string | undefined,
  options: { agent?: string; model?: string; outcome?: string; session?: string; risk?: string; humanReview?: boolean }
): void {
  if (!title) {
    console.error(chalk.red('❌ Title is required: prvc tap new "Task description"'));
    process.exit(1);
  }

  const seq = getNextSimpleSequenceNumber(dir, 'TAP', 'id');
  const id = `TAP-${seq}`;
  const artifactDir = path.join(dir, id);
  const filePath = path.join(artifactDir, 'task.json');

  fs.ensureDirSync(artifactDir);

  const agent = options.agent ?? resolveGitAuthor(baseDir) ?? 'cursor-ai';
  const now = getCurrentTimestamp();

  const rawSha = resolveGitCommit(baseDir);
  // Schema requires commit_sha to match ^[0-9a-f]{7,40}$ — use placeholder when not in a git repo
  const commitSha = /^[0-9a-f]{7,40}$/.test(rawSha) ? rawSha : '0'.repeat(7);

  const tap: TapRecord = {
    schema: 'provenancecode.tap.v1',
    id,
    title,
    version: 1,
    lifecycle: { state: 'completed' },
    timestamps: { started_at: now, ended_at: now, attested_at: now },
    runtime: { agent, model: options.model ?? 'unknown', session_id: options.session ?? null },
    git: { branch: resolveGitBranch(baseDir), commit_sha: commitSha },
    actors: { agent, model: options.model ?? 'unknown', human_reviewer: null },
    task: {
      outcome: (options.outcome as any) ?? 'succeeded',
      description: title
    },
    risk: {
      needs_human_review: options.humanReview ?? false,
      level: (options.risk as any) ?? 'low'
    },
    enforcement: { validated: false },
    links: {}
  };

  fs.writeJsonSync(filePath, tap, { spaces: 2 });

  console.log(chalk.green(`✓ TAP created: ${id}`));
  console.log(chalk.gray(`  File: ${path.relative(baseDir, filePath)}`));
  console.log(chalk.gray(`  Agent: ${agent} | Outcome: ${tap.task.outcome}`));
}

function tapList(dir: string, statusFilter: string | undefined, limit: number): void {
  const files = getArtifactFiles(dir, 'task.json');
  if (files.length === 0) { console.log(chalk.gray('No TAP records found.')); return; }

  const rows: TapRecord[] = [];
  files.forEach(f => { try { rows.push(fs.readJsonSync(f)); } catch { /* skip */ } });

  const filtered = statusFilter ? rows.filter(r => r.lifecycle.state === statusFilter) : rows;
  const shown = filtered.slice(-limit);

  console.log(chalk.bold(`\nTask Attestation Records — TAP (${shown.length} of ${filtered.length})\n`));
  shown.forEach(r => {
    const outcomeColor = r.task.outcome === 'succeeded' ? chalk.green : chalk.red;
    console.log(`  ${chalk.cyan(r.id)}  ${outcomeColor(r.task.outcome)}  ${chalk.gray(r.runtime.agent)}  ${r.title}`);
  });
  console.log();
}

function tapShow(dir: string, id: string | undefined): void {
  if (!id) { console.error(chalk.red('❌ ID required')); process.exit(1); }
  const file = path.join(dir, id, 'task.json');
  if (!fs.existsSync(file)) { console.error(chalk.red(`❌ Not found: ${id}`)); process.exit(1); }
  const r: TapRecord = fs.readJsonSync(file);
  console.log(chalk.bold(`\n${r.id} — ${r.title}`));
  console.log(`State: ${r.lifecycle.state} | Outcome: ${r.task.outcome}`);
  console.log(`Agent: ${r.runtime.agent} | Model: ${r.runtime.model}`);
  console.log(`Branch: ${r.git.branch} | Commit: ${r.git.commit_sha.slice(0, 8)}`);
  if (r.task.summary) console.log(`\nSummary:\n${r.task.summary}`);
  if (r.links?.actions?.length) console.log(`\nActions: ${r.links.actions.join(', ')}`);
  if (r.links?.memories_written?.length) console.log(`Memories Written: ${r.links.memories_written.join(', ')}`);
  console.log();
}

// ── ACT ───────────────────────────────────────────────────────────────────────

export function actCommand(
  baseDir: string,
  action: string,
  titleOrId: string | undefined,
  options: {
    agent?: string;
    decision?: string;
    actionType?: string;
    resource?: string;
    task?: string;
    status?: string;
    recent?: string;
  }
): void {
  const config = requireConfig(baseDir);
  const dir = actionsDir(baseDir, config);

  switch (action) {
    case 'new':
      actNew(baseDir, dir, titleOrId, options);
      break;
    case 'list':
      actList(dir, options.status, parseInt(options.recent ?? '10', 10));
      break;
    case 'show':
      actShow(dir, titleOrId);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Usage: prvc act <new|list|show> [title-or-id] [options]'));
      process.exit(1);
  }
}

function actNew(
  baseDir: string,
  dir: string,
  title: string | undefined,
  options: { agent?: string; decision?: string; actionType?: string; resource?: string; task?: string }
): void {
  if (!title) {
    console.error(chalk.red('❌ Title is required: prvc act new "Action description"'));
    process.exit(1);
  }

  const seq = getNextSimpleSequenceNumber(dir, 'ACT', 'id');
  const id = `ACT-${seq}`;
  const artifactDir = path.join(dir, id);
  const filePath = path.join(artifactDir, 'action.json');

  fs.ensureDirSync(artifactDir);

  const agent = options.agent ?? resolveGitAuthor(baseDir) ?? 'cursor-ai';
  const now = getCurrentTimestamp();
  const decision = (options.decision?.toUpperCase() as any) ?? 'ALLOW';

  // execution.status must be: not_executed | succeeded | failed | partial
  // links.task must match ^TAP- (schema requires it)
  const taskLink = options.task ?? 'TAP-000000';
  if (!options.task) {
    console.log(chalk.yellow(`  ℹ️  No --task provided. Using placeholder task link: ${taskLink}. Update with the real TAP ID.`));
  }

  const act: ActRecord = {
    schema: 'provenancecode.act.v1',
    id,
    title,
    version: 1,
    lifecycle: { state: 'executed' },
    timestamps: { requested_at: now, decided_at: now },
    actors: { agent },
    action: { type: options.actionType ?? 'tool_call', resource: options.resource ?? 'unknown' },
    policy: { decision, policy_hash: 'manual' },
    approval: { required: decision === 'STEP_UP', status: decision === 'STEP_UP' ? 'pending' : 'not_required' },
    execution: { status: 'succeeded' },
    links: { task: taskLink }
  };

  fs.writeJsonSync(filePath, act, { spaces: 2 });

  console.log(chalk.green(`✓ ACT created: ${id}`));
  console.log(chalk.gray(`  File: ${path.relative(baseDir, filePath)}`));
  console.log(chalk.gray(`  Decision: ${decision} | Agent: ${agent}`));
}

function actList(dir: string, statusFilter: string | undefined, limit: number): void {
  const files = getArtifactFiles(dir, 'action.json');
  if (files.length === 0) { console.log(chalk.gray('No ACT records found.')); return; }

  const rows: ActRecord[] = [];
  files.forEach(f => { try { rows.push(fs.readJsonSync(f)); } catch { /* skip */ } });

  const filtered = statusFilter ? rows.filter(r => r.lifecycle.state === statusFilter) : rows;
  const shown = filtered.slice(-limit);

  console.log(chalk.bold(`\nAction Records — ACT (${shown.length} of ${filtered.length})\n`));
  shown.forEach(r => {
    const decColor = r.policy.decision === 'ALLOW' ? chalk.green
      : r.policy.decision === 'DENY' ? chalk.red : chalk.yellow;
    console.log(`  ${chalk.cyan(r.id)}  ${decColor(r.policy.decision)}  ${chalk.gray(r.action.type)}  ${r.title}`);
  });
  console.log();
}

function actShow(dir: string, id: string | undefined): void {
  if (!id) { console.error(chalk.red('❌ ID required')); process.exit(1); }
  const file = path.join(dir, id, 'action.json');
  if (!fs.existsSync(file)) { console.error(chalk.red(`❌ Not found: ${id}`)); process.exit(1); }
  const r: ActRecord = fs.readJsonSync(file);
  console.log(chalk.bold(`\n${r.id} — ${r.title}`));
  console.log(`Decision: ${r.policy.decision} | State: ${r.lifecycle.state}`);
  console.log(`Agent: ${r.actors.agent}`);
  console.log(`Action: ${r.action.type} on ${r.action.resource}`);
  if (r.links.task) console.log(`Task: ${r.links.task}`);
  console.log();
}

// ── MEO ───────────────────────────────────────────────────────────────────────

export function meoCommand(
  baseDir: string,
  action: string,
  titleOrId: string | undefined,
  options: {
    agent?: string;
    subtype?: string;
    domain?: string;
    summary?: string;
    confidence?: string;
    facts?: string;
    task?: string;
    status?: string;
  }
): void {
  const config = requireConfig(baseDir);
  const dir = memoriesDir(baseDir, config);

  switch (action) {
    case 'new':
      meoNew(baseDir, dir, titleOrId, options);
      break;
    case 'list':
      meoList(dir, options.status);
      break;
    case 'show':
      meoShow(dir, titleOrId);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Usage: prvc meo <new|list|show> [title-or-id] [options]'));
      process.exit(1);
  }
}

function meoNew(
  baseDir: string,
  dir: string,
  title: string | undefined,
  options: { agent?: string; subtype?: string; domain?: string; summary?: string; confidence?: string; facts?: string; task?: string }
): void {
  if (!title) {
    console.error(chalk.red('❌ Title is required: prvc meo new "Memory title"'));
    process.exit(1);
  }

  const seq = getNextSimpleSequenceNumber(dir, 'MEO', 'id');
  const id = `MEO-${seq}`;
  const artifactDir = path.join(dir, id);
  const filePath = path.join(artifactDir, 'memory.json');

  fs.ensureDirSync(artifactDir);

  const agent = options.agent ?? resolveGitAuthor(baseDir) ?? 'cursor-ai';
  const now = getCurrentTimestamp();

  const subtype = (options.subtype as 'working' | 'dream') ?? 'working';

  // provenance.source must be: task | dream | manual
  // provenance.source_quality must be: human-reviewed | agent-observed | agent-synthesised | human-authored
  const provenanceSource = subtype === 'dream' ? 'dream' : options.task ? 'task' : 'manual';
  const sourceQuality = subtype === 'dream' ? 'agent-synthesised'
    : options.task ? 'agent-observed' : 'human-authored';

  const meo: MeoRecord = {
    schema: 'provenancecode.meo.v1',
    id,
    title,
    version: 1,
    subtype,
    lifecycle: { state: 'active' },
    timestamps: {
      created_at: now,
      consolidated_at: subtype === 'dream' ? now : null
    },
    runtime: { agent },
    scope: { domain: options.domain ?? 'general' },
    content: {
      summary: options.summary ?? title,
      confidence: (options.confidence as any) ?? 'medium',
      key_facts: options.facts ? options.facts.split(',').map((s: string) => s.trim()) : []
    },
    provenance: { source: provenanceSource, source_quality: sourceQuality },
    // For dream MEOs, written_by_task is not meaningful; link tasks via consolidation.inputs.tasks
    links: { written_by_task: subtype === 'working' ? (options.task ?? null) : null },
    // consolidation is required when subtype === 'dream' (enforced by schema if/then)
    ...(subtype === 'dream' ? {
      consolidation: {
        inputs: {
          tasks: options.task
            ? options.task.split(',').map((s: string) => s.trim())
            : ['TAP-000000']
        },
        synthesis_method: 'agent-reflection' as const
      }
    } : {})
  };

  fs.writeJsonSync(filePath, meo, { spaces: 2 });

  console.log(chalk.green(`✓ MEO created: ${id} (${meo.subtype})`));
  console.log(chalk.gray(`  File: ${path.relative(baseDir, filePath)}`));
  console.log(chalk.gray(`  Domain: ${meo.scope.domain} | Confidence: ${meo.content.confidence}`));
  if (subtype === 'dream' && !options.task) {
    console.log(chalk.yellow(`  ⚠️  Update consolidation.inputs.tasks with real TAP IDs (currently: placeholder)`));
  }
}

function meoList(dir: string, statusFilter?: string): void {
  const files = getArtifactFiles(dir, 'memory.json');
  if (files.length === 0) { console.log(chalk.gray('No MEO records found.')); return; }

  const rows: MeoRecord[] = [];
  files.forEach(f => { try { rows.push(fs.readJsonSync(f)); } catch { /* skip */ } });

  const filtered = statusFilter ? rows.filter(r => r.lifecycle.state === statusFilter) : rows;
  console.log(chalk.bold(`\nMemory Evidence Objects — MEO (${filtered.length})\n`));
  filtered.forEach(r => {
    const subtypeColor = r.subtype === 'dream' ? chalk.magenta : chalk.blue;
    console.log(`  ${chalk.cyan(r.id)}  ${subtypeColor(r.subtype)}  [${r.lifecycle.state}]  ${chalk.gray(r.scope.domain)}  ${r.title}`);
  });
  console.log();
}

function meoShow(dir: string, id: string | undefined): void {
  if (!id) { console.error(chalk.red('❌ ID required')); process.exit(1); }
  const file = path.join(dir, id, 'memory.json');
  if (!fs.existsSync(file)) { console.error(chalk.red(`❌ Not found: ${id}`)); process.exit(1); }
  const r: MeoRecord = fs.readJsonSync(file);
  console.log(chalk.bold(`\n${r.id} — ${r.title}`));
  console.log(`Subtype: ${r.subtype} | State: ${r.lifecycle.state} | Confidence: ${r.content.confidence}`);
  console.log(`Agent: ${r.runtime.agent} | Domain: ${r.scope.domain}`);
  console.log(`\nSummary:\n${r.content.summary}`);
  if (r.content.key_facts?.length) {
    console.log('\nKey Facts:');
    r.content.key_facts.forEach(f => console.log(`  • ${f}`));
  }
  if (r.links?.written_by_task) console.log(`\nWritten By: ${r.links.written_by_task}`);
  console.log();
}
