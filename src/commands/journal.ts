import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';
import { getNextSequenceNumber, generateDecisionId, getCurrentTimestamp } from '../utils';
import { DecisionRecord } from '../types';

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
 * Quick add journal entry
 */
function addJournalEntry(baseDir: string, config: any, options: any): void {
  const { title, context, decision, area, autoLink } = options;

  if (!title) {
    console.log(chalk.red('❌ Title is required'));
    console.log(chalk.gray('   Usage: prvc journal add "Your decision" --context="Why" --decision="What"'));
    process.exit(1);
  }

  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const areaCode = area || config.defaultArea;
  const sequence = getNextSequenceNumber(decisionsPath, config.defaultAppCode, areaCode);
  const decisionId = generateDecisionId(config.defaultAppCode, areaCode, sequence);

  const record: DecisionRecord = {
    schema: 'https://provenancecode.org/schemas/decision.g2.schema.json',
    decision_id: decisionId,
    title: title,
    status: 'draft',
    context: context || 'Added via journal',
    decision: decision || title,
    date_created: getCurrentTimestamp(),
    tags: ['journal']
  };

  // Auto-link to current git context if requested
  if (autoLink) {
    const gitInfo = tryGetGitContext(baseDir);
    if (gitInfo) {
      record.links = gitInfo.links;
      if (gitInfo.author) {
        record.authors = [gitInfo.author];
      }
    }
  }

  const filename = `${decisionId}.json`;
  const filepath = path.join(decisionsPath, filename);
  
  fs.writeJsonSync(filepath, record, { spaces: 2 });

  console.log(chalk.green('✨ Decision recorded!'));
  console.log();
  console.log(chalk.bold('  ID:'), chalk.cyan(decisionId));
  console.log(chalk.bold('  File:'), chalk.gray(path.relative(baseDir, filepath)));
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
  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  const results: Array<{ file: string; record: any; score: number }> = [];

  files.forEach(file => {
    try {
      const record = fs.readJsonSync(path.join(decisionsPath, file));
      const searchText = `${record.title} ${record.context} ${record.decision} ${record.tags?.join(' ') || ''}`.toLowerCase();
      const queryLower = query.toLowerCase();

      let score = 0;
      if (searchText.includes(queryLower)) {
        score = 100;
        // Boost if in title
        if (record.title.toLowerCase().includes(queryLower)) {
          score += 50;
        }
      } else if (fuzzy) {
        // Simple fuzzy matching
        const words = queryLower.split(' ');
        const matches = words.filter((w: string) => searchText.includes(w)).length;
        score = (matches / words.length) * 100;
      }

      if (score > 0) {
        results.push({ file, record, score });
      }
    } catch (e) {
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
    console.log(chalk.bold(`${index + 1}. ${record.title}`));
    console.log(chalk.gray(`   ID: ${record.decision_id} | Status: ${record.status}`));
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
  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  const decisions = files.map(file => {
    try {
      return fs.readJsonSync(path.join(decisionsPath, file));
    } catch (e) {
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
    fs.writeFileSync(output, exportContent);
    console.log(chalk.green(`✓ Exported to ${output}`));
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
  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  let decisions = files.map(file => {
    try {
      const record = fs.readJsonSync(path.join(decisionsPath, file));
      return { ...record, _file: file };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);

  // Filter by status
  if (status) {
    decisions = decisions.filter((d: any) => d.status === status);
  }

  // Filter by area
  if (area) {
    decisions = decisions.filter((d: any) => d.decision_id.includes(`-${area}-`));
  }

  // Sort by date (newest first)
  decisions.sort((a: any, b: any) => {
    const dateA = a.date_created || a.date_updated || '';
    const dateB = b.date_created || b.date_updated || '';
    return dateB.localeCompare(dateA);
  });

  // Limit results
  const recentDecisions = decisions.slice(0, recent);

  console.log(chalk.blue(`📋 ${decisions.length} decision(s) found`));
  if (recentDecisions.length < decisions.length) {
    console.log(chalk.gray(`   Showing ${recentDecisions.length} most recent`));
  }
  console.log();

  recentDecisions.forEach((decision: any) => {
    const statusColor = getStatusColor(decision.status);
    console.log(chalk.bold(decision.title));
    console.log(chalk.gray(`   ${decision.decision_id} | `) + statusColor(decision.status));
    if (decision.date_created) {
      const date = new Date(decision.date_created).toLocaleDateString();
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
    
    // Get current branch
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: baseDir })
      .toString().trim();
    
    // Get author
    const author = execSync('git config user.email', { cwd: baseDir })
      .toString().trim();
    
    // Try to get PR/issue from branch name
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
  } catch (e) {
    return null;
  }
}

/**
 * Export to markdown
 */
function exportToMarkdown(decisions: any[]): string {
  let md = '# Decision Journal\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  
  decisions.forEach(decision => {
    md += `## ${decision.title}\n\n`;
    md += `**ID:** ${decision.decision_id}  \n`;
    md += `**Status:** ${decision.status}  \n`;
    if (decision.date_created) {
      md += `**Created:** ${new Date(decision.date_created).toLocaleDateString()}  \n`;
    }
    md += '\n';
    md += `**Context:** ${decision.context}\n\n`;
    md += `**Decision:** ${decision.decision}\n\n`;
    if (decision.consequences) {
      md += `**Consequences:** ${decision.consequences}\n\n`;
    }
    md += '---\n\n';
  });
  
  return md;
}

/**
 * Export to CSV
 */
function exportToCsv(decisions: any[]): string {
  let csv = 'ID,Title,Status,Created,Context\n';
  
  decisions.forEach(decision => {
    const id = decision.decision_id;
    const title = `"${decision.title.replace(/"/g, '""')}"`;
    const status = decision.status;
    const created = decision.date_created || '';
    const context = `"${(decision.context || '').replace(/"/g, '""')}"`;
    
    csv += `${id},${title},${status},${created},${context}\n`;
  });
  
  return csv;
}

/**
 * Get color for status
 */
function getStatusColor(status: string): any {
  switch (status) {
    case 'accepted': return chalk.green;
    case 'rejected': return chalk.red;
    case 'proposed': return chalk.yellow;
    case 'draft': return chalk.gray;
    case 'deprecated': return chalk.dim;
    default: return chalk.white;
  }
}

