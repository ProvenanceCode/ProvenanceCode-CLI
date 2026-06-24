import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, resolveProjectCode, resolveAreaCode, getNextSequenceNumber, generateDecisionId, getCurrentTimestamp, resolveGitAuthor } from '../utils';
import { DecisionRecord, RiskLevel } from '../types';

/**
 * Journal command - Quick decision capture
 */
export function journalCommand(baseDir: string, action: string, options: any = {}): void {
  const config = loadConfig(baseDir);

  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  switch (action) {
    case 'add':
      addJournalEntry(baseDir, config, options);
      break;
    case 'search':
      searchJournal(baseDir, config, options);
      break;
    case 'export':
      exportJournal(baseDir, config, options);
      break;
    case 'list':
      listJournal(baseDir, config, options);
      break;
    default:
      console.log(chalk.red(`Unknown journal action: ${action}`));
      console.log(chalk.gray('Available: add, search, export, list'));
      process.exit(1);
  }
}

/**
 * Auto-detect AI bot name from environment variables
 */
function detectBot(explicitBot?: string): string | undefined {
  if (explicitBot) return explicitBot;
  if (process.env.CURSOR_SESSION_ID) return 'cursor-ai';
  if (process.env.KIRO_SESSION_ID) return 'kiro';
  if (process.env.CLAUDE_CODE_SESSION) return 'claude-code';
  return undefined;
}

/**
 * Quick add journal entry (DEO v1 format)
 */
function addJournalEntry(baseDir: string, config: any, options: any): void {
  const { title, area, autoLink } = options;

  // --outcome is primary; --decision is accepted as alias for v2.0 compat
  const outcome: string = options.outcome ?? options.decision ?? title;
  const rationale: string = options.rationale ?? '';
  const riskLevel: RiskLevel = (options.riskLevel ?? options['risk-level'] ?? 'low') as RiskLevel;
  const author: string = options.author ?? resolveGitAuthor(baseDir) ?? 'unknown';
  const botName = detectBot(options.bot);

  if (!title) {
    console.log(chalk.red('❌ Title is required'));
    console.log(chalk.gray('   Usage: prvc journal add "Your decision" --outcome="What" --rationale="Why" --risk-level=low'));
    process.exit(1);
  }

  const projectCode = resolveProjectCode(config);
  const areaCode = resolveAreaCode(config, area);
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const sequence = getNextSequenceNumber(decisionsPath, projectCode, areaCode);
  const decisionId = generateDecisionId(projectCode, areaCode, sequence);

  const record: DecisionRecord = {
    schema: 'provenancecode.decision.v1',
    id: decisionId,
    title,
    version: 1,
    lifecycle: { state: 'draft' },
    timestamps: { created_at: getCurrentTimestamp() },
    actors: {
      author,
      ...(botName ? { bot: botName } : {})
    },
    outcome,
    rationale,
    risk: { level: riskLevel },
    ...(options.context ? { problem: options.context } : {}),
    tags: ['journal']
  };

  // Auto-link to current git context if requested
  if (autoLink) {
    const gitInfo = tryGetGitContext(baseDir);
    if (gitInfo?.links && gitInfo.links.length > 0) {
      record.links = { pr: gitInfo.links.map((l: any) => l.url) };
    }
  }

  const filename = `${decisionId}.json`;
  const filepath = path.join(decisionsPath, filename);

  fs.ensureDirSync(decisionsPath);
  fs.writeJsonSync(filepath, record, { spaces: 2 });

  console.log(chalk.green('✨ Decision recorded!'));
  console.log();
  console.log(chalk.bold('  ID:'), chalk.cyan(decisionId));
  console.log(chalk.bold('  File:'), chalk.gray(path.relative(baseDir, filepath)));
  if (botName) {
    console.log(chalk.bold('  Bot:'), chalk.dim(botName));
  }
  console.log();
  console.log(chalk.gray('  Edit: '), chalk.cyan(`code ${filepath}`));
  console.log(chalk.gray('  View: '), chalk.cyan(`prvc show ${decisionId}`));
}

/**
 * Search journal entries
 */
function searchJournal(baseDir: string, config: any, options: any): void {
  const { query, fuzzy = false, limit = 10 } = options;

  if (!query) {
    console.log(chalk.red('❌ Search query is required'));
    console.log(chalk.gray('   Usage: prvc journal search "database"'));
    process.exit(1);
  }

  const decisionsPath = path.join(baseDir, config.paths.decisions);
  if (!fs.existsSync(decisionsPath)) {
    console.log(chalk.gray('No decisions found.'));
    return;
  }

  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  const results: Array<{ file: string; record: any; score: number }> = [];

  files.forEach(file => {
    try {
      const record = fs.readJsonSync(path.join(decisionsPath, file));
      const outcome = record.outcome ?? record.decision ?? '';
      const problem = record.problem ?? record.context ?? '';
      const searchText = `${record.title} ${problem} ${outcome} ${record.tags?.join(' ') || ''}`.toLowerCase();
      const queryLower = query.toLowerCase();

      let score = 0;
      if (searchText.includes(queryLower)) {
        score = 100;
        if (record.title.toLowerCase().includes(queryLower)) {
          score += 50;
        }
      } else if (fuzzy) {
        const words = queryLower.split(' ');
        const matches = words.filter((w: string) => searchText.includes(w)).length;
        score = (matches / words.length) * 100;
      }

      if (score > 0) {
        results.push({ file, record, score });
      }
    } catch {
      // Skip invalid files
    }
  });

  results.sort((a, b) => b.score - a.score);
  const topResults = results.slice(0, limit);

  console.log(chalk.blue(`🔍 Found ${results.length} result(s) for "${query}"`));
  console.log();

  if (topResults.length === 0) {
    console.log(chalk.gray('  No matches found. Try using --fuzzy for approximate matching.'));
    return;
  }

  topResults.forEach((result, index) => {
    const { record } = result;
    const id = record.id ?? record.decision_id;
    const state = record.lifecycle?.state ?? record.status;
    console.log(chalk.bold(`${index + 1}. ${record.title}`));
    console.log(chalk.gray(`   ID: ${id} | Status: ${state}`));
    if (record.tags?.length > 0) {
      console.log(chalk.gray(`   Tags: ${record.tags.join(', ')}`));
    }
    console.log();
  });
}

/**
 * Export journal
 */
function exportJournal(baseDir: string, config: any, options: any): void {
  const { format = 'markdown', output } = options;

  const decisionsPath = path.join(baseDir, config.paths.decisions);
  if (!fs.existsSync(decisionsPath)) {
    console.log(chalk.gray('No decisions found.'));
    return;
  }

  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  const decisions = files.map(file => {
    try {
      return fs.readJsonSync(path.join(decisionsPath, file));
    } catch {
      return null;
    }
  }).filter(Boolean);

  let exportContent = '';

  switch (format) {
    case 'markdown':
      exportContent = exportToMarkdown(decisions);
      break;
    case 'json':
      exportContent = JSON.stringify(decisions, null, 2);
      break;
    case 'csv':
      exportContent = exportToCsv(decisions);
      break;
    default:
      console.log(chalk.red(`Unknown format: ${format}`));
      console.log(chalk.gray('Available: markdown, json, csv'));
      process.exit(1);
  }

  if (output) {
    const resolved = path.resolve(output);
    // Reject writes to system directories — export is intended for user workspaces
    const forbidden = ['/etc', '/sys', '/proc', '/boot', '/dev', '/root', '/bin', '/sbin', '/usr/bin', '/usr/sbin'];
    if (forbidden.some(p => resolved === p || resolved.startsWith(p + path.sep))) {
      console.error(chalk.red(`❌ Output path not allowed: ${resolved}`));
      process.exit(1);
    }
    fs.writeFileSync(resolved, exportContent);
    console.log(chalk.green(`✓ Exported to ${resolved}`));
  } else {
    console.log(exportContent);
  }
}

/**
 * List journal entries
 */
function listJournal(baseDir: string, config: any, options: any): void {
  const { status, area, recent = 10 } = options;

  const decisionsPath = path.join(baseDir, config.paths.decisions);
  if (!fs.existsSync(decisionsPath)) {
    console.log(chalk.gray('No decisions found.'));
    return;
  }

  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  let decisions = files.map(file => {
    try {
      const record = fs.readJsonSync(path.join(decisionsPath, file));
      return { ...record, _file: file };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Filter by status (DEO v1 lifecycle.state, fall back to legacy status)
  if (status) {
    decisions = decisions.filter((d: any) => (d.lifecycle?.state ?? d.status) === status);
  }

  // Filter by area (check both DEO v1 `id` and legacy `decision_id`)
  if (area) {
    decisions = decisions.filter((d: any) => (d.id ?? d.decision_id ?? '').includes(`-${area}-`));
  }

  // Sort by date (newest first)
  decisions.sort((a: any, b: any) => {
    const dateA = a.timestamps?.created_at ?? a.date_created ?? a.date_updated ?? '';
    const dateB = b.timestamps?.created_at ?? b.date_created ?? b.date_updated ?? '';
    return dateB.localeCompare(dateA);
  });

  const recentDecisions = decisions.slice(0, recent);

  console.log(chalk.blue(`📋 ${decisions.length} decision(s) found`));
  if (recentDecisions.length < decisions.length) {
    console.log(chalk.gray(`   Showing ${recentDecisions.length} most recent`));
  }
  console.log();

  recentDecisions.forEach((decision: any) => {
    const state = decision.lifecycle?.state ?? decision.status;
    const id = decision.id ?? decision.decision_id;
    const statusColor = getStatusColor(state);
    const createdAt = decision.timestamps?.created_at ?? decision.date_created;
    console.log(chalk.bold(decision.title));
    console.log(chalk.gray(`   ${id} | `) + statusColor(state));
    if (createdAt) {
      const date = new Date(createdAt).toLocaleDateString();
      console.log(chalk.gray(`   Created: ${date}`));
    }
    console.log();
  });
}

/**
 * Try to get git context
 */
function tryGetGitContext(baseDir: string): any {
  try {
    const { execSync } = require('child_process');

    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: baseDir })
      .toString().trim();

    const author = execSync('git config user.email', { cwd: baseDir })
      .toString().trim();

    const prMatch = branch.match(/(\d+)/);

    const links = [];
    if (prMatch) {
      links.push({
        type: 'pr',
        url: `PR #${prMatch[1]}`,
        title: `Related to ${branch}`
      });
    }

    return { author, links: links.length > 0 ? links : undefined };
  } catch {
    return null;
  }
}

/**
 * Export to markdown (DEO v1 fields with legacy fallback)
 */
function exportToMarkdown(decisions: any[]): string {
  let md = '# Decision Journal\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;

  decisions.forEach(decision => {
    const id = decision.id ?? decision.decision_id;
    const state = decision.lifecycle?.state ?? decision.status;
    const createdAt = decision.timestamps?.created_at ?? decision.date_created;
    const outcome = decision.outcome ?? decision.decision;
    const problem = decision.problem ?? (typeof decision.context === 'string' ? decision.context : '');

    md += `## ${decision.title}\n\n`;
    md += `**ID:** ${id}  \n`;
    md += `**Status:** ${state}  \n`;
    if (createdAt) {
      md += `**Created:** ${new Date(createdAt).toLocaleDateString()}  \n`;
    }
    md += '\n';
    if (problem) {
      md += `**Problem:** ${problem}\n\n`;
    }
    md += `**Outcome:** ${outcome}\n\n`;
    if (decision.rationale) {
      md += `**Rationale:** ${decision.rationale}\n\n`;
    }
    if (decision.consequences) {
      md += `**Consequences:** ${decision.consequences}\n\n`;
    }
    md += '---\n\n';
  });

  return md;
}

/**
 * Export to CSV (DEO v1 fields with legacy fallback)
 */
function exportToCsv(decisions: any[]): string {
  let csv = 'ID,Title,Status,Created,Outcome\n';

  decisions.forEach(decision => {
    const id = decision.id ?? decision.decision_id;
    const title = `"${decision.title.replace(/"/g, '""')}"`;
    const state = decision.lifecycle?.state ?? decision.status;
    const created = decision.timestamps?.created_at ?? decision.date_created ?? '';
    const outcome = `"${((decision.outcome ?? decision.decision) || '').replace(/"/g, '""')}"`;

    csv += `${id},${title},${state},${created},${outcome}\n`;
  });

  return csv;
}

/**
 * Get color for lifecycle state
 */
function getStatusColor(state: string): any {
  switch (state) {
    case 'accepted': return chalk.green;
    case 'rejected': return chalk.red;
    case 'proposed': return chalk.yellow;
    case 'draft': return chalk.gray;
    case 'superseded': return chalk.dim;
    default: return chalk.white;
  }
}
