/**
 * prvc spec  — manage Spec Records (SPEC-*)
 * prvc mistake — manage Mistake Records (MR-*)
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, getCurrentTimestamp, getNextSimpleSequenceNumber, getArtifactFiles } from '../utils';
import { SpecRecord, MistakeRecord } from '../types';

function resolveGitRepo(baseDir: string): { org: string; name: string } {
  try {
    const { execSync } = require('child_process');
    const remote = execSync('git remote get-url origin', { cwd: baseDir }).toString().trim();
    const match = remote.match(/[:/]([^/]+)\/([^/.]+)(\.git)?$/);
    if (match) return { org: match[1], name: match[2] };
  } catch { /* not a git repo */ }
  return { org: 'unknown', name: 'unknown' };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function requireConfig(baseDir: string) {
  const config = loadConfig(baseDir);
  if (!config) {
    console.error(chalk.red('❌ ProvenanceCode is not initialized. Run: prvc init'));
    process.exit(1);
  }
  return config;
}

function specsDir(baseDir: string, config: ReturnType<typeof loadConfig>): string {
  return path.join(baseDir, config!.paths.specs ?? 'provenance/specs');
}

function mistakesDir(baseDir: string, config: ReturnType<typeof loadConfig>): string {
  return path.join(baseDir, config!.paths.mistakes ?? 'provenance/mistakes');
}

// ── SPEC commands ─────────────────────────────────────────────────────────────

export function specCommand(
  baseDir: string,
  action: string,
  titleOrId: string | undefined,
  options: {
    risk?: string;
    status?: string;
    criteria?: string;
    paths?: string;
    decisions?: string;
  }
): void {
  const config = requireConfig(baseDir);
  const dir = specsDir(baseDir, config);

  switch (action) {
    case 'new':
      specNew(baseDir, dir, titleOrId, options);
      break;
    case 'list':
      specList(dir, options.status);
      break;
    case 'show':
      specShow(dir, titleOrId);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Usage: prvc spec <new|list|show> [title-or-id] [options]'));
      process.exit(1);
  }
}

function specNew(
  baseDir: string,
  dir: string,
  title: string | undefined,
  options: { risk?: string; criteria?: string; paths?: string; decisions?: string }
): void {
  if (!title) {
    console.error(chalk.red('❌ Title is required: prvc spec new "My spec title"'));
    process.exit(1);
  }

  const seq = getNextSimpleSequenceNumber(dir, 'SPEC', 'id');
  const id = `SPEC-${seq}`;
  const artifactDir = path.join(dir, id);
  const filePath = path.join(artifactDir, 'spec.json');

  fs.ensureDirSync(artifactDir);

  const repo = resolveGitRepo(baseDir);

  // Generated artifact matches the strict provenancecode.spec.v1 JSON Schema
  // (additionalProperties: false — no schema/created_at/updated_at)
  const spec = {
    id,
    repo,
    ref: `pc://${repo.org}/${repo.name}/spec/${id}`,
    title,
    status: 'draft' as const,
    risk: (options.risk as any) ?? 'medium',
    acceptanceCriteria: options.criteria ? options.criteria.split(',').map((s: string) => s.trim()) : [],
    affectedPaths: options.paths ? options.paths.split(',').map((s: string) => s.trim()) : [],
    relatedDecisions: options.decisions ? options.decisions.split(',').map((s: string) => s.trim()) : []
  };

  fs.writeJsonSync(filePath, spec, { spaces: 2 });

  console.log(chalk.green(`✓ Spec created: ${id}`));
  console.log(chalk.gray(`  File: ${path.relative(baseDir, filePath)}`));
  console.log(chalk.gray(`  Title: ${title}`));
  console.log(chalk.gray(`  Status: draft | Risk: ${spec.risk}`));
  console.log(chalk.gray(`  Ref: ${spec.ref}`));
}

function specList(dir: string, statusFilter?: string): void {
  const files = getArtifactFiles(dir, 'spec.json');
  if (files.length === 0) {
    console.log(chalk.gray('No spec records found.'));
    return;
  }

  const rows: SpecRecord[] = [];
  files.forEach(f => {
    try { rows.push(fs.readJsonSync(f)); } catch { /* skip */ }
  });

  const filtered = statusFilter ? rows.filter(r => r.status === statusFilter) : rows;
  console.log(chalk.bold(`\nSpec Records (${filtered.length})\n`));
  filtered.forEach(r => {
    console.log(`  ${chalk.cyan(r.id)}  [${r.status}]  ${chalk.bold(r.risk)}  ${r.title}`);
  });
  console.log();
}

function specShow(dir: string, id: string | undefined): void {
  if (!id) { console.error(chalk.red('❌ ID required')); process.exit(1); }
  const file = path.join(dir, id, 'spec.json');
  if (!fs.existsSync(file)) { console.error(chalk.red(`❌ Not found: ${id}`)); process.exit(1); }
  const spec: SpecRecord = fs.readJsonSync(file);
  console.log(chalk.bold(`\n${spec.id} — ${spec.title}`));
  console.log(`Status: ${spec.status} | Risk: ${spec.risk}`);
  if (spec.acceptanceCriteria?.length) {
    console.log('\nAcceptance Criteria:');
    spec.acceptanceCriteria.forEach(c => console.log(`  • ${c}`));
  }
  if (spec.affectedPaths?.length) console.log(`\nAffected Paths: ${spec.affectedPaths.join(', ')}`);
  if (spec.relatedDecisions?.length) console.log(`Related Decisions: ${spec.relatedDecisions.join(', ')}`);
  console.log();
}

// ── MISTAKE commands ──────────────────────────────────────────────────────────

export function mistakeCommand(
  baseDir: string,
  action: string,
  titleOrId: string | undefined,
  options: {
    severity?: string;
    failureType?: string;
    rootCause?: string;
    trigger?: string;
    impact?: string;
    fix?: string;
    ruleId?: string;
    statement?: string;
    decisions?: string;
  }
): void {
  const config = requireConfig(baseDir);
  const dir = mistakesDir(baseDir, config);

  switch (action) {
    case 'new':
      mistakeNew(baseDir, dir, titleOrId, options);
      break;
    case 'list':
      mistakeList(dir);
      break;
    case 'show':
      mistakeShow(dir, titleOrId);
      break;
    default:
      console.error(chalk.red(`Unknown action: ${action}`));
      console.log(chalk.gray('Usage: prvc mistake <new|list|show> [title-or-id] [options]'));
      process.exit(1);
  }
}

function mistakeNew(
  baseDir: string,
  dir: string,
  title: string | undefined,
  options: {
    severity?: string; failureType?: string; rootCause?: string;
    trigger?: string; impact?: string; fix?: string;
    ruleId?: string; statement?: string; decisions?: string;
  }
): void {
  if (!title) {
    console.error(chalk.red('❌ Title is required: prvc mistake new "What went wrong"'));
    process.exit(1);
  }

  const seq = getNextSimpleSequenceNumber(dir, 'MR', 'mr_id');
  const id = `MR-${seq}`;
  const artifactDir = path.join(dir, id);
  const filePath = path.join(artifactDir, 'mistake.json');

  fs.ensureDirSync(artifactDir);

  const repo = resolveGitRepo(baseDir);

  // Schema requires minLength ≥ 1 for trigger/impact/root_cause/fix.description
  // and requires repo, ref, scope fields
  const mistake = {
    schema: 'provenancecode.mistake.v1' as const,
    mr_id: id,
    repo,
    ref: `pc://${repo.org}/${repo.name}/mistake/${id}`,
    title,
    status: 'open' as const,
    created_at: getCurrentTimestamp(),
    severity: (options.severity as any) ?? 'medium',
    failure_type: options.failureType ?? 'unclassified',
    scope: { paths: [], components: [] },
    trigger: options.trigger ?? 'TODO: describe what triggered this mistake',
    impact: options.impact ?? 'TODO: describe the impact',
    root_cause: options.rootCause ?? 'TODO: describe the root cause',
    fix: { description: options.fix ?? 'TODO: describe the fix' },
    prevent_rule: {
      rule_id: options.ruleId ?? `PRV-${id}-prevent`,
      statement: options.statement ?? 'TODO: Define a prevention rule (minLength 10 chars)'
    },
    links: {
      decisions: options.decisions ? options.decisions.split(',').map((s: string) => s.trim()) : []
    }
  };

  fs.writeJsonSync(filePath, mistake, { spaces: 2 });

  console.log(chalk.green(`✓ Mistake record created: ${id}`));
  console.log(chalk.gray(`  File: ${path.relative(baseDir, filePath)}`));
  console.log(chalk.gray(`  Severity: ${mistake.severity}`));
  console.log(chalk.yellow(`  ⚠️  Edit the file to replace TODO placeholders with real values`));
}

function mistakeList(dir: string): void {
  const files = getArtifactFiles(dir, 'mistake.json');
  if (files.length === 0) { console.log(chalk.gray('No mistake records found.')); return; }

  console.log(chalk.bold(`\nMistake Records (${files.length})\n`));
  files.forEach(f => {
    try {
      const r: MistakeRecord = fs.readJsonSync(f);
      const statusColor = r.status === 'open' ? chalk.red : chalk.green;
      console.log(`  ${chalk.cyan(r.mr_id)}  ${statusColor(`[${r.status}]`)}  ${chalk.bold(r.severity)}  ${r.title}`);
    } catch { /* skip */ }
  });
  console.log();
}

function mistakeShow(dir: string, id: string | undefined): void {
  if (!id) { console.error(chalk.red('❌ ID required')); process.exit(1); }
  const file = path.join(dir, id, 'mistake.json');
  if (!fs.existsSync(file)) { console.error(chalk.red(`❌ Not found: ${id}`)); process.exit(1); }
  const r: MistakeRecord = fs.readJsonSync(file);
  console.log(chalk.bold(`\n${r.mr_id} — ${r.title}`));
  console.log(`Status: ${r.status} | Severity: ${r.severity} | Type: ${r.failure_type}`);
  if (r.trigger) console.log(`\nTrigger: ${r.trigger}`);
  if (r.root_cause) console.log(`Root Cause: ${r.root_cause}`);
  if (r.impact) console.log(`Impact: ${r.impact}`);
  if (r.fix?.description) console.log(`Fix: ${r.fix.description}`);
  console.log(`\nPrevention Rule [${r.prevent_rule.rule_id}]:\n  ${r.prevent_rule.statement}`);
  if (r.links?.decisions?.length) console.log(`\nLinked Decisions: ${r.links.decisions.join(', ')}`);
  console.log();
}
