import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';

/**
 * Search command - Advanced search and discovery
 */
export function searchCommand(baseDir: string, query: string, options: any = {}): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const { fuzzy = false, type, status, limit = 20 } = options;

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  let allRecords: any[] = [];
  
  if (!type || type === 'decision') {
    allRecords = allRecords.concat(decisions.map((d: any) => ({ ...d, _type: 'decision' })));
  }
  
  if (!type || type === 'risk') {
    allRecords = allRecords.concat(risks.map((r: any) => ({ ...r, _type: 'risk' })));
  }

  // Filter by status if specified
  if (status) {
    allRecords = allRecords.filter((r: any) => r.status === status);
  }

  // Search
  const results = searchRecords(allRecords, query, fuzzy);

  console.log(chalk.blue(`🔍 Found ${results.length} result(s) for "${query}"`));
  console.log();

  if (results.length === 0) {
    console.log(chalk.gray('  No matches found.'));
    if (!fuzzy) {
      console.log(chalk.gray('  Try using --fuzzy for approximate matching.'));
    }
    return;
  }

  const topResults = results.slice(0, limit);
  
  topResults.forEach((result: any, index: number) => {
    const record = result.record;
    const icon = record._type === 'decision' ? '📝' : '⚠️';
    const id = record.decision_id || record.risk_id;
    
    console.log(chalk.bold(`${index + 1}. ${icon} ${record.title}`));
    console.log(chalk.gray(`   ID: ${id} | Status: ${record.status} | Score: ${result.score.toFixed(0)}`));
    
    if (result.highlight) {
      console.log(chalk.gray(`   ...${result.highlight}...`));
    }
    console.log();
  });

  if (results.length > limit) {
    console.log(chalk.gray(`  Showing ${limit} of ${results.length} results. Use --limit to see more.`));
  }
}

/**
 * Related command - Find related decisions
 */
export function relatedCommand(baseDir: string, decisionId: string): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  const decision = decisions.find((d: any) => d.decision_id === decisionId);
  
  if (!decision) {
    console.log(chalk.red(`Decision not found: ${decisionId}`));
    process.exit(1);
  }

  console.log(chalk.blue(`🔗 Related to ${decisionId}`));
  console.log(chalk.bold(decision.title));
  console.log();

  // Find directly linked decisions
  const linkedDecisions: any[] = [];
  if (decision.links) {
    decision.links.forEach((link: any) => {
      if (link.type === 'decision') {
        const linkedDec = decisions.find((d: any) => d.decision_id === link.url);
        if (linkedDec) {
          linkedDecisions.push(linkedDec);
        }
      }
    });
  }

  if (linkedDecisions.length > 0) {
    console.log(chalk.bold('Linked Decisions:'));
    linkedDecisions.forEach((d: any) => {
      console.log(chalk.gray(`  • ${d.decision_id}: ${d.title}`));
    });
    console.log();
  }

  // Find related risks
  const relatedRisks = risks.filter((r: any) => 
    r.linked_decisions && r.linked_decisions.includes(decisionId)
  );

  if (relatedRisks.length > 0) {
    console.log(chalk.bold('Related Risks:'));
    relatedRisks.forEach((r: any) => {
      const severityColor = r.severity === 'critical' ? chalk.red : 
                           r.severity === 'high' ? chalk.yellow : chalk.gray;
      console.log(severityColor(`  ⚠️  ${r.risk_id}: ${r.title} [${r.severity}]`));
    });
    console.log();
  }

  // Find decisions with similar tags
  if (decision.tags && decision.tags.length > 0) {
    const similarDecisions = decisions.filter((d: any) => 
      d.decision_id !== decisionId &&
      d.tags &&
      d.tags.some((tag: string) => decision.tags.includes(tag))
    );

    if (similarDecisions.length > 0) {
      console.log(chalk.bold('Similar Decisions (by tags):'));
      similarDecisions.slice(0, 5).forEach((d: any) => {
        const commonTags = d.tags.filter((tag: string) => decision.tags.includes(tag));
        console.log(chalk.gray(`  • ${d.decision_id}: ${d.title}`));
        console.log(chalk.dim(`    Tags: ${commonTags.join(', ')}`));
      });
    }
  }
}

/**
 * Show command - Display a single decision
 */
export function showCommand(baseDir: string, id: string): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  let record = decisions.find((d: any) => d.decision_id === id);
  let type = 'decision';
  
  if (!record) {
    record = risks.find((r: any) => r.risk_id === id);
    type = 'risk';
  }

  if (!record) {
    console.log(chalk.red(`Record not found: ${id}`));
    process.exit(1);
  }

  const icon = type === 'decision' ? '📝' : '⚠️';
  
  console.log();
  console.log(chalk.bold.blue(`${icon} ${record.title}`));
  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log();
  console.log(chalk.bold('ID:'), chalk.cyan(id));
  console.log(chalk.bold('Status:'), getStatusColor(record.status)(record.status));
  
  if (type === 'decision') {
    console.log();
    console.log(chalk.bold('Context:'));
    console.log(formatText(record.context));
    console.log();
    console.log(chalk.bold('Decision:'));
    console.log(formatText(record.decision));
    
    if (record.consequences) {
      console.log();
      console.log(chalk.bold('Consequences:'));
      console.log(formatText(record.consequences));
    }
    
    if (record.risk) {
      console.log();
      console.log(chalk.bold('Risk Assessment:'));
      console.log(formatText(record.risk));
    }
    
    if (record.links && record.links.length > 0) {
      console.log();
      console.log(chalk.bold('Links:'));
      record.links.forEach((link: any) => {
        console.log(chalk.gray(`  • [${link.type}] ${link.url}`));
        if (link.title) {
          console.log(chalk.dim(`    ${link.title}`));
        }
      });
    }
  } else {
    console.log(chalk.bold('Severity:'), getSeverityColor(record.severity)(record.severity));
    console.log();
    console.log(chalk.bold('Description:'));
    console.log(formatText(record.description));
    
    if (record.mitigation) {
      console.log();
      console.log(chalk.bold('Mitigation:'));
      console.log(formatText(record.mitigation));
    }
    
    if (record.linked_decisions && record.linked_decisions.length > 0) {
      console.log();
      console.log(chalk.bold('Linked Decisions:'));
      record.linked_decisions.forEach((decId: string) => {
        console.log(chalk.gray(`  • ${decId}`));
      });
    }
  }
  
  if (record.tags && record.tags.length > 0) {
    console.log();
    console.log(chalk.bold('Tags:'), record.tags.join(', '));
  }
  
  if (record.date_created) {
    console.log();
    console.log(chalk.gray(`Created: ${new Date(record.date_created).toLocaleString()}`));
  }
  
  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log();
}

/**
 * Load all decisions
 */
function loadAllDecisions(baseDir: string, config: any): any[] {
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  if (!fs.existsSync(decisionsPath)) return [];

  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  return files.map(file => {
    try {
      return fs.readJsonSync(path.join(decisionsPath, file));
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Load all risks
 */
function loadAllRisks(baseDir: string, config: any): any[] {
  const risksPath = path.join(baseDir, config.paths.risks);
  if (!fs.existsSync(risksPath)) return [];

  const files = fs.readdirSync(risksPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  return files.map(file => {
    try {
      return fs.readJsonSync(path.join(risksPath, file));
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Search records
 */
function searchRecords(records: any[], query: string, fuzzy: boolean): any[] {
  const queryLower = query.toLowerCase();
  const results: any[] = [];

  records.forEach(record => {
    const searchText = JSON.stringify(record).toLowerCase();
    let score = 0;
    let highlight = '';

    if (searchText.includes(queryLower)) {
      score = 100;
      
      // Boost if in title
      if (record.title.toLowerCase().includes(queryLower)) {
        score += 100;
      }
      
      // Extract highlight
      const titleMatch = record.title.toLowerCase().indexOf(queryLower);
      if (titleMatch >= 0) {
        const start = Math.max(0, titleMatch - 20);
        const end = Math.min(record.title.length, titleMatch + queryLower.length + 20);
        highlight = record.title.substring(start, end);
      }
    } else if (fuzzy) {
      const words = queryLower.split(' ');
      const matches = words.filter(w => searchText.includes(w)).length;
      score = (matches / words.length) * 50;
    }

    if (score > 0) {
      results.push({ record, score, highlight });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Format text for display
 */
function formatText(text: string): string {
  return text.split('\n').map(line => `  ${line}`).join('\n');
}

/**
 * Get status color
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

/**
 * Get severity color
 */
function getSeverityColor(severity: string): any {
  switch (severity) {
    case 'critical': return chalk.red;
    case 'high': return chalk.yellow;
    case 'medium': return chalk.blue;
    case 'low': return chalk.gray;
    default: return chalk.white;
  }
}

