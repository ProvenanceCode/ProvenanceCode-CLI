import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';

/**
 * Quality command - Show decision quality metrics
 */
export function qualityCommand(baseDir: string, options: any = {}): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  if (decisions.length === 0) {
    console.log(chalk.yellow('No decisions found yet. Start documenting!'));
    return;
  }

  console.log(chalk.blue('📊 Decision Quality Score'));
  console.log();

  // Calculate metrics
  const metrics = calculateQualityMetrics(decisions, risks);
  
  // Overall score
  const overallScore = calculateOverallScore(metrics);
  const scoreColor = overallScore >= 8 ? chalk.green : 
                    overallScore >= 6 ? chalk.yellow : chalk.red;
  
  console.log(scoreColor.bold(`Overall Score: ${overallScore.toFixed(1)}/10`));
  console.log();
  console.log(renderScoreBar(overallScore, 10));
  console.log();

  // Detailed metrics
  console.log(chalk.bold('Documentation Completeness:'));
  printMetric('Decisions with context', metrics.withContext, decisions.length);
  printMetric('Decisions with consequences', metrics.withConsequences, decisions.length);
  printMetric('Decisions with risk assessment', metrics.withRisk, decisions.length);
  printMetric('Decisions with links', metrics.withLinks, decisions.length);
  console.log();

  console.log(chalk.bold('Decision Status:'));
  printMetric('Accepted', metrics.statusCounts.accepted || 0, decisions.length);
  printMetric('Proposed', metrics.statusCounts.proposed || 0, decisions.length);
  printMetric('Draft', metrics.statusCounts.draft || 0, decisions.length);
  console.log();

  console.log(chalk.bold('Risk Management:'));
  console.log(chalk.gray(`  Total risks tracked: ${risks.length}`));
  printMetric('Open risks', metrics.openRisks, risks.length);
  printMetric('Mitigated risks', metrics.mitigatedRisks, risks.length);
  console.log();

  // Recommendations
  if (overallScore < 8) {
    console.log(chalk.bold('💡 Recommendations:'));
    if (metrics.withConsequences < decisions.length * 0.8) {
      console.log(chalk.yellow('  • Add consequences to more decisions'));
    }
    if (metrics.withRisk < decisions.length * 0.7) {
      console.log(chalk.yellow('  • Document risk assessments'));
    }
    if (metrics.withLinks < decisions.length * 0.5) {
      console.log(chalk.yellow('  • Link decisions to PRs and issues'));
    }
    if (metrics.statusCounts.draft > decisions.length * 0.3) {
      console.log(chalk.yellow('  • Review and finalize draft decisions'));
    }
    console.log();
  } else {
    console.log(chalk.green('✨ Excellent decision documentation! Keep it up!'));
    console.log();
  }
}

/**
 * Impact command - Analyze decision impact
 */
export function impactCommand(baseDir: string, decisionId: string): void {
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

  console.log(chalk.blue('🎯 Impact Analysis'));
  console.log();
  console.log(chalk.bold(decision.title));
  console.log(chalk.gray(decisionId));
  console.log();
  console.log(chalk.gray('─'.repeat(60)));
  console.log();

  // Linked decisions
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

  // Decisions that link to this one
  const incomingLinks = decisions.filter((d: any) => 
    d.links && d.links.some((l: any) => l.url === decisionId)
  );

  // Related risks
  const relatedRisks = risks.filter((r: any) => 
    r.linked_decisions && r.linked_decisions.includes(decisionId)
  );

  // Superseded decisions
  const superseded = decisions.filter((d: any) => 
    d.links && d.links.some((l: any) => l.type === 'decision' && l.url === decisionId) &&
    d.status === 'superseded'
  );

  console.log(chalk.bold('Direct Impact:'));
  console.log(chalk.gray(`  Linked decisions: ${linkedDecisions.length}`));
  console.log(chalk.gray(`  Referenced by: ${incomingLinks.length}`));
  console.log(chalk.gray(`  Related risks: ${relatedRisks.length}`));
  console.log();

  if (relatedRisks.length > 0) {
    console.log(chalk.bold('Risk Impact:'));
    relatedRisks.forEach((r: any) => {
      const severityColor = r.severity === 'critical' ? chalk.red : 
                           r.severity === 'high' ? chalk.yellow : chalk.gray;
      console.log(severityColor(`  ⚠️  ${r.title} [${r.severity}]`));
      console.log(chalk.dim(`     ${r.risk_id} - ${r.status}`));
    });
    console.log();
  }

  if (linkedDecisions.length > 0) {
    console.log(chalk.bold('Downstream Decisions:'));
    linkedDecisions.forEach((d: any) => {
      console.log(chalk.gray(`  📝 ${d.title}`));
      console.log(chalk.dim(`     ${d.decision_id} - ${d.status}`));
    });
    console.log();
  }

  if (incomingLinks.length > 0) {
    console.log(chalk.bold('Dependent Decisions:'));
    incomingLinks.forEach((d: any) => {
      console.log(chalk.gray(`  📝 ${d.title}`));
      console.log(chalk.dim(`     ${d.decision_id} - ${d.status}`));
    });
    console.log();
  }

  // Impact score
  const impactScore = calculateImpactScore(linkedDecisions.length, incomingLinks.length, relatedRisks.length);
  const impactLevel = impactScore >= 7 ? 'HIGH' : impactScore >= 4 ? 'MEDIUM' : 'LOW';
  const impactColor = impactScore >= 7 ? chalk.red : impactScore >= 4 ? chalk.yellow : chalk.green;

  console.log(chalk.bold('Impact Level: ') + impactColor(impactLevel));
  console.log(chalk.gray(`Score: ${impactScore}/10`));
  console.log();

  if (impactScore >= 7) {
    console.log(chalk.yellow('⚠️  High impact decision - changes should be carefully reviewed'));
  }
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(decisions: any[], risks: any[]): any {
  const metrics: any = {
    withContext: 0,
    withConsequences: 0,
    withRisk: 0,
    withLinks: 0,
    statusCounts: {},
    openRisks: 0,
    mitigatedRisks: 0
  };

  decisions.forEach(d => {
    if (d.context && d.context.length > 10) metrics.withContext++;
    if (d.consequences && d.consequences.length > 10) metrics.withConsequences++;
    if (d.risk && d.risk.length > 10) metrics.withRisk++;
    if (d.links && d.links.length > 0) metrics.withLinks++;
    
    metrics.statusCounts[d.status] = (metrics.statusCounts[d.status] || 0) + 1;
  });

  risks.forEach(r => {
    if (r.status === 'open') metrics.openRisks++;
    if (r.status === 'mitigated') metrics.mitigatedRisks++;
  });

  return metrics;
}

/**
 * Calculate overall quality score
 */
function calculateOverallScore(metrics: any): number {
  // Weighted scoring
  const completenessScore = (
    (metrics.withContext / (metrics.statusCounts.total || 1)) * 0.2 +
    (metrics.withConsequences / (metrics.statusCounts.total || 1)) * 0.3 +
    (metrics.withRisk / (metrics.statusCounts.total || 1)) * 0.25 +
    (metrics.withLinks / (metrics.statusCounts.total || 1)) * 0.25
  ) * 10;

  return Math.min(10, completenessScore);
}

/**
 * Calculate impact score
 */
function calculateImpactScore(linked: number, incoming: number, risks: number): number {
  return Math.min(10, linked * 1.5 + incoming * 2 + risks * 2);
}

/**
 * Render score bar
 */
function renderScoreBar(score: number, max: number): string {
  const filled = Math.round((score / max) * 40);
  const empty = 40 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  const color = score >= 8 ? chalk.green : score >= 6 ? chalk.yellow : chalk.red;
  return color(bar);
}

/**
 * Print metric
 */
function printMetric(label: string, value: number, total: number): void {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  const bar = '█'.repeat(Math.round(percentage / 5));
  const color = percentage >= 80 ? chalk.green : percentage >= 60 ? chalk.yellow : chalk.red;
  
  console.log(chalk.gray(`  ${label.padEnd(30)}: ${value}/${total} `) + color(`${bar} ${percentage}%`));
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

