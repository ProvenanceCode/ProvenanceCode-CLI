import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';

/**
 * Export command - Export decisions to various formats
 */
export function exportCommand(baseDir: string, options: any = {}): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const { format = 'html', output, theme = 'light' } = options;

  const decisions = loadAllDecisions(baseDir, config);
  const risks = loadAllRisks(baseDir, config);

  if (decisions.length === 0 && risks.length === 0) {
    console.log(chalk.yellow('No records to export'));
    return;
  }

  let content = '';
  let defaultFilename = '';

  switch (format.toLowerCase()) {
    case 'html':
      content = exportToHTML(decisions, risks, theme);
      defaultFilename = 'provenancecode-export.html';
      break;
    case 'markdown':
    case 'md':
      content = exportToMarkdown(decisions, risks);
      defaultFilename = 'provenancecode-export.md';
      break;
    case 'confluence':
      content = exportToConfluence(decisions, risks);
      defaultFilename = 'provenancecode-confluence.txt';
      break;
    case 'notion':
      content = exportToNotion(decisions, risks);
      defaultFilename = 'provenancecode-notion.md';
      break;
    case 'pdf':
      console.log(chalk.yellow('PDF export requires HTML conversion. Exporting as HTML first...'));
      content = exportToHTML(decisions, risks, theme);
      defaultFilename = 'provenancecode-export.html';
      console.log(chalk.gray('Use a tool like wkhtmltopdf to convert to PDF:'));
      console.log(chalk.cyan(`  wkhtmltopdf ${defaultFilename} provenancecode.pdf`));
      break;
    case 'json':
      content = JSON.stringify({ decisions, risks }, null, 2);
      defaultFilename = 'provenancecode-export.json';
      break;
    default:
      console.log(chalk.red(`Unsupported format: ${format}`));
      console.log(chalk.gray('Supported: html, markdown, confluence, notion, json, pdf'));
      process.exit(1);
  }

  const outputPath = output || defaultFilename;
  fs.writeFileSync(outputPath, content);

  console.log(chalk.green(`✓ Exported ${decisions.length} decision(s) and ${risks.length} risk(s)`));
  console.log(chalk.gray(`  File: ${path.resolve(outputPath)}`));
  
  if (format === 'html') {
    console.log(chalk.gray(`  Open: file://${path.resolve(outputPath)}`));
  }
}

/**
 * Export to HTML
 */
function exportToHTML(decisions: any[], risks: any[], theme: string): string {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const cardBg = isDark ? '#2a2a2a' : '#f5f5f5';
  const borderColor = isDark ? '#333' : '#ddd';

  const decisionsHTML = decisions.map(d => `
    <div class="record">
      <h2>${d.title}</h2>
      <div class="meta">
        <span class="id">${d.decision_id}</span>
        <span class="status status-${d.status}">${d.status}</span>
        ${d.date_created ? `<span class="date">${new Date(d.date_created).toLocaleDateString()}</span>` : ''}
      </div>
      <div class="section">
        <h3>Context</h3>
        <p>${formatForHTML(d.context)}</p>
      </div>
      <div class="section">
        <h3>Decision</h3>
        <p>${formatForHTML(d.decision)}</p>
      </div>
      ${d.consequences ? `
        <div class="section">
          <h3>Consequences</h3>
          <p>${formatForHTML(d.consequences)}</p>
        </div>
      ` : ''}
      ${d.risk ? `
        <div class="section">
          <h3>Risk Assessment</h3>
          <p>${formatForHTML(d.risk)}</p>
        </div>
      ` : ''}
      ${d.links && d.links.length > 0 ? `
        <div class="section">
          <h3>Links</h3>
          <ul>
            ${d.links.map((l: any) => `<li><strong>${l.type}:</strong> ${l.url}${l.title ? ` - ${l.title}` : ''}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      ${d.tags && d.tags.length > 0 ? `
        <div class="tags">
          ${d.tags.map((t: string) => `<span class="tag">${t}</span>`).join(' ')}
        </div>
      ` : ''}
    </div>
  `).join('');

  const risksHTML = risks.length > 0 ? `
    <h1 class="section-title">Risks</h1>
    ${risks.map(r => `
      <div class="record risk">
        <h2>⚠️ ${r.title}</h2>
        <div class="meta">
          <span class="id">${r.risk_id}</span>
          <span class="status status-${r.status}">${r.status}</span>
          <span class="severity severity-${r.severity}">${r.severity}</span>
        </div>
        <div class="section">
          <h3>Description</h3>
          <p>${formatForHTML(r.description)}</p>
        </div>
        ${r.mitigation ? `
          <div class="section">
            <h3>Mitigation</h3>
            <p>${formatForHTML(r.mitigation)}</p>
          </div>
        ` : ''}
        ${r.linked_decisions && r.linked_decisions.length > 0 ? `
          <div class="section">
            <h3>Linked Decisions</h3>
            <ul>
              ${r.linked_decisions.map((d: string) => `<li>${d}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `).join('')}
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ProvenanceCode Export</title>
  <style>
    * { box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      background: ${bgColor};
      color: ${textColor};
    }
    h1 { font-size: 2.5em; margin-bottom: 40px; }
    h2 { font-size: 1.8em; margin-bottom: 15px; }
    h3 { font-size: 1.2em; margin-bottom: 10px; color: #666; }
    .header { text-align: center; margin-bottom: 60px; }
    .subtitle { color: #888; font-size: 1.1em; }
    .section-title { margin-top: 60px; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid ${borderColor}; }
    .record { 
      background: ${cardBg};
      border: 1px solid ${borderColor};
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .meta { 
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .id { 
      font-family: monospace;
      background: ${isDark ? '#333' : '#e0e0e0'};
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
    }
    .status, .severity { 
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-accepted { background: #4CAF50; color: white; }
    .status-proposed { background: #FFC107; color: #000; }
    .status-rejected { background: #f44336; color: white; }
    .status-draft { background: #999; color: white; }
    .severity-critical { background: #f44336; color: white; }
    .severity-high { background: #FF9800; color: white; }
    .severity-medium { background: #2196F3; color: white; }
    .severity-low { background: #4CAF50; color: white; }
    .date { color: #888; font-size: 0.9em; }
    .section { margin-bottom: 20px; }
    .section p { margin: 5px 0; white-space: pre-wrap; }
    .tags { margin-top: 15px; }
    .tag { 
      background: ${isDark ? '#444' : '#e0e0e0'};
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.85em;
      margin-right: 8px;
    }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .footer { 
      text-align: center;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid ${borderColor};
      color: #888;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>ProvenanceCode Export</h1>
    <div class="subtitle">Generated ${new Date().toLocaleString()}</div>
    <div class="subtitle">${decisions.length} Decisions • ${risks.length} Risks</div>
  </div>

  <h1 class="section-title">Decisions</h1>
  ${decisionsHTML}

  ${risksHTML}

  <div class="footer">
    <p>Generated by ProvenanceCode CLI</p>
    <p><a href="https://provenancecode.org" style="color: ${isDark ? '#4CAF50' : '#2196F3'};">provenancecode.org</a></p>
  </div>
</body>
</html>`;
}

/**
 * Export to Markdown
 */
function exportToMarkdown(decisions: any[], risks: any[]): string {
  let md = '# ProvenanceCode Export\n\n';
  md += `Generated: ${new Date().toLocaleString()}\n\n`;
  md += `**${decisions.length} Decisions • ${risks.length} Risks**\n\n`;
  md += '---\n\n';

  md += '## Decisions\n\n';
  decisions.forEach(d => {
    md += `### ${d.title}\n\n`;
    md += `**ID:** ${d.decision_id}  \n`;
    md += `**Status:** ${d.status}  \n`;
    if (d.date_created) {
      md += `**Date:** ${new Date(d.date_created).toLocaleDateString()}  \n`;
    }
    md += '\n';
    md += `**Context:**\n${d.context}\n\n`;
    md += `**Decision:**\n${d.decision}\n\n`;
    if (d.consequences) {
      md += `**Consequences:**\n${d.consequences}\n\n`;
    }
    if (d.tags && d.tags.length > 0) {
      md += `*Tags: ${d.tags.join(', ')}*\n\n`;
    }
    md += '---\n\n';
  });

  if (risks.length > 0) {
    md += '## Risks\n\n';
    risks.forEach(r => {
      md += `### ⚠️ ${r.title}\n\n`;
      md += `**ID:** ${r.risk_id}  \n`;
      md += `**Severity:** ${r.severity} | **Status:** ${r.status}  \n\n`;
      md += `**Description:**\n${r.description}\n\n`;
      if (r.mitigation) {
        md += `**Mitigation:**\n${r.mitigation}\n\n`;
      }
      md += '---\n\n';
    });
  }

  return md;
}

/**
 * Export to Confluence format
 */
function exportToConfluence(decisions: any[], risks: any[]): string {
  let conf = 'h1. ProvenanceCode Export\n\n';
  conf += `{info}Generated: ${new Date().toLocaleString()}{info}\n\n`;

  conf += 'h2. Decisions\n\n';
  decisions.forEach(d => {
    conf += `h3. ${d.title}\n\n`;
    conf += `{panel:title=${d.decision_id} | Status: ${d.status}}\n`;
    conf += `*Context:*\n${d.context}\n\n`;
    conf += `*Decision:*\n${d.decision}\n\n`;
    if (d.consequences) {
      conf += `*Consequences:*\n${d.consequences}\n\n`;
    }
    conf += `{panel}\n\n`;
  });

  return conf;
}

/**
 * Export to Notion format (Markdown with Notion-specific syntax)
 */
function exportToNotion(decisions: any[], risks: any[]): string {
  return exportToMarkdown(decisions, risks);
}

/**
 * Format text for HTML
 */
function formatForHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
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

