import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';

/**
 * Visualize command - Create beautiful visualizations
 */
export function visualizeCommand(baseDir: string, type: string, options: any = {}): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  switch (type) {
    case 'graph':
      generateGraph(baseDir, config, options);
      break;
    case 'timeline':
      generateTimeline(baseDir, config, options);
      break;
    case 'stats':
      generateStats(baseDir, config, options);
      break;
    default:
      console.log(chalk.red(`Unknown visualization type: ${type}`));
      console.log(chalk.gray('Available: graph, timeline, stats'));
      process.exit(1);
  }
}

/**
 * Generate decision graph
 */
function generateGraph(baseDir: string, config: any, options: any): void {
  const { output = 'decision-map.html', format = 'html' } = options;

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  if (format === 'mermaid') {
    const mermaid = generateMermaidGraph(decisions, risks);
    if (output) {
      fs.writeFileSync(output, mermaid);
      console.log(chalk.green(`✓ Mermaid graph saved to ${output}`));
    } else {
      console.log(mermaid);
    }
  } else {
    const html = generateHTMLGraph(decisions, risks);
    fs.writeFileSync(output, html);
    console.log(chalk.green(`✓ Interactive graph saved to ${output}`));
    console.log(chalk.gray(`  Open: file://${path.resolve(output)}`));
  }
}

/**
 * Generate timeline
 */
function generateTimeline(baseDir: string, config: any, options: any): void {
  const { range, output = 'timeline.html' } = options;

  let decisions = loadAllDecisions(baseDir, config);

  // Filter by date range if specified
  if (range) {
    const days = parseInt(range.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    decisions = decisions.filter((d: any) => {
      const date = new Date(d.date_created || d.date_updated || '1970-01-01');
      return date >= cutoffDate;
    });
  }

  const html = generateTimelineHTML(decisions);
  fs.writeFileSync(output, html);
  
  console.log(chalk.green(`✓ Timeline saved to ${output}`));
  console.log(chalk.gray(`  Open: file://${path.resolve(output)}`));
}

/**
 * Generate statistics
 */
function generateStats(baseDir: string, config: any, options: any): void {
  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  console.log(chalk.blue('📊 ProvenanceCode Statistics'));
  console.log();

  // Basic counts
  console.log(chalk.bold('Overview:'));
  console.log(chalk.gray(`  Total Decisions: ${decisions.length}`));
  console.log(chalk.gray(`  Total Risks: ${risks.length}`));
  console.log();

  // Status breakdown
  console.log(chalk.bold('Decision Status:'));
  const statusCounts: any = {};
  decisions.forEach((d: any) => {
    statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
  });
  Object.keys(statusCounts).forEach(status => {
    const count = statusCounts[status];
    const bar = '█'.repeat(Math.ceil(count / decisions.length * 20));
    console.log(chalk.gray(`  ${status.padEnd(12)}: ${bar} ${count}`));
  });
  console.log();

  // Risk severity
  if (risks.length > 0) {
    console.log(chalk.bold('Risk Severity:'));
    const severityCounts: any = {};
    risks.forEach((r: any) => {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
    });
    Object.keys(severityCounts).forEach(severity => {
      const count = severityCounts[severity];
      const color = severity === 'critical' ? chalk.red : 
                   severity === 'high' ? chalk.yellow : chalk.gray;
      console.log(color(`  ${severity.padEnd(12)}: ${count}`));
    });
    console.log();
  }

  // Documentation quality
  console.log(chalk.bold('Documentation Quality:'));
  const withConsequences = decisions.filter((d: any) => d.consequences).length;
  const withRisk = decisions.filter((d: any) => d.risk).length;
  const withLinks = decisions.filter((d: any) => d.links && d.links.length > 0).length;
  
  console.log(chalk.gray(`  With Consequences: ${withConsequences}/${decisions.length} (${Math.round(withConsequences/decisions.length*100)}%)`));
  console.log(chalk.gray(`  With Risk Assessment: ${withRisk}/${decisions.length} (${Math.round(withRisk/decisions.length*100)}%)`));
  console.log(chalk.gray(`  With Links: ${withLinks}/${decisions.length} (${Math.round(withLinks/decisions.length*100)}%)`));
  console.log();

  // Activity
  const recentDecisions = decisions.filter((d: any) => {
    const date = new Date(d.date_created || '1970-01-01');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  });
  
  console.log(chalk.bold('Activity:'));
  console.log(chalk.gray(`  Decisions (last 30 days): ${recentDecisions.length}`));
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
 * Generate Mermaid graph
 */
function generateMermaidGraph(decisions: any[], risks: any[]): string {
  let mermaid = 'graph TD\n';
  
  decisions.forEach(decision => {
    const id = decision.decision_id.replace(/-/g, '_');
    const title = decision.title.substring(0, 30);
    mermaid += `  ${id}["${title}"]\n`;
    
    // Add status styling
    if (decision.status === 'accepted') {
      mermaid += `  style ${id} fill:#90EE90\n`;
    } else if (decision.status === 'rejected') {
      mermaid += `  style ${id} fill:#FFB6C1\n`;
    }
  });
  
  // Link decisions based on links array
  decisions.forEach(decision => {
    const id = decision.decision_id.replace(/-/g, '_');
    if (decision.links) {
      decision.links.forEach((link: any) => {
        if (link.type === 'decision') {
          const targetId = link.url.replace(/-/g, '_');
          mermaid += `  ${id} --> ${targetId}\n`;
        }
      });
    }
  });
  
  // Link risks to decisions
  risks.forEach(risk => {
    const riskId = risk.risk_id.replace(/-/g, '_');
    const title = risk.title.substring(0, 30);
    mermaid += `  ${riskId}{"${title}"}\n`;
    mermaid += `  style ${riskId} fill:#FFD700\n`;
    
    if (risk.linked_decisions) {
      risk.linked_decisions.forEach((decId: string) => {
        const targetId = decId.replace(/-/g, '_');
        mermaid += `  ${riskId} -.-> ${targetId}\n`;
      });
    }
  });
  
  return mermaid;
}

/**
 * Generate HTML graph with D3.js
 */
function generateHTMLGraph(decisions: any[], risks: any[]): string {
  const nodes = [
    ...decisions.map(d => ({
      id: d.decision_id,
      label: d.title,
      type: 'decision',
      status: d.status
    })),
    ...risks.map(r => ({
      id: r.risk_id,
      label: r.title,
      type: 'risk',
      severity: r.severity
    }))
  ];

  const links: any[] = [];
  
  decisions.forEach(decision => {
    if (decision.links) {
      decision.links.forEach((link: any) => {
        if (link.type === 'decision') {
          links.push({
            source: decision.decision_id,
            target: link.url,
            type: 'decision'
          });
        }
      });
    }
  });
  
  risks.forEach(risk => {
    if (risk.linked_decisions) {
      risk.linked_decisions.forEach((decId: string) => {
        links.push({
          source: risk.risk_id,
          target: decId,
          type: 'risk'
        });
      });
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ProvenanceCode Decision Map</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1a; }
    #graph { width: 100vw; height: 100vh; }
    .node circle { stroke: #fff; stroke-width: 2px; cursor: pointer; }
    .node text { font-size: 12px; fill: #fff; pointer-events: none; }
    .link { stroke: #999; stroke-opacity: 0.6; }
    .decision { fill: #4CAF50; }
    .risk { fill: #FF9800; }
    #info { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.8); color: #fff; padding: 20px; border-radius: 8px; max-width: 300px; }
  </style>
</head>
<body>
  <div id="info">
    <h2>ProvenanceCode Decision Map</h2>
    <p><span style="color:#4CAF50">●</span> Decisions</p>
    <p><span style="color:#FF9800">●</span> Risks</p>
    <p>Drag nodes to rearrange. Click for details.</p>
  </div>
  <svg id="graph"></svg>
  <script>
    const nodes = ${JSON.stringify(nodes)};
    const links = ${JSON.stringify(links)};
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const svg = d3.select('#graph')
      .attr('width', width)
      .attr('height', height);
    
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke-width', 2);
    
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    node.append('circle')
      .attr('r', 20)
      .attr('class', d => d.type);
    
    node.append('text')
      .attr('dy', -25)
      .attr('text-anchor', 'middle')
      .text(d => d.label.substring(0, 20));
    
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
    });
    
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  </script>
</body>
</html>`;
}

/**
 * Generate timeline HTML
 */
function generateTimelineHTML(decisions: any[]): string {
  const sorted = decisions.sort((a, b) => {
    const dateA = new Date(a.date_created || '1970-01-01');
    const dateB = new Date(b.date_created || '1970-01-01');
    return dateB.getTime() - dateA.getTime();
  });

  const timelineItems = sorted.map(d => {
    const date = new Date(d.date_created || '1970-01-01').toLocaleDateString();
    const statusColor = d.status === 'accepted' ? '#4CAF50' : d.status === 'rejected' ? '#f44336' : '#FFC107';
    
    return `
      <div class="timeline-item">
        <div class="timeline-marker" style="background: ${statusColor}"></div>
        <div class="timeline-content">
          <div class="timeline-date">${date}</div>
          <h3>${d.title}</h3>
          <p class="decision-id">${d.decision_id}</p>
          <p class="status" style="color: ${statusColor}">${d.status}</p>
          <p>${d.context}</p>
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ProvenanceCode Timeline</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a1a; color: #fff; padding: 40px; }
    h1 { text-align: center; margin-bottom: 60px; }
    .timeline { max-width: 800px; margin: 0 auto; position: relative; }
    .timeline::before { content: ''; position: absolute; left: 20px; top: 0; bottom: 0; width: 2px; background: #333; }
    .timeline-item { position: relative; margin-bottom: 40px; padding-left: 60px; }
    .timeline-marker { position: absolute; left: 11px; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; }
    .timeline-content { background: #2a2a2a; padding: 20px; border-radius: 8px; }
    .timeline-date { color: #999; font-size: 14px; margin-bottom: 10px; }
    h3 { margin: 0 0 10px 0; }
    .decision-id { color: #888; font-size: 12px; font-family: monospace; }
    .status { font-weight: bold; text-transform: uppercase; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📅 Decision Timeline</h1>
  <div class="timeline">
    ${timelineItems}
  </div>
</body>
</html>`;
}

