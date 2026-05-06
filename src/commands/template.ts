import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, resolveProjectCode, resolveAreaCode, getNextSequenceNumber, generateDecisionId, getCurrentTimestamp, resolveGitAuthor } from '../utils';

/**
 * Template command - Use smart templates
 */
export function templateCommand(baseDir: string, action: string, templateName: string, options: any = {}): void {
  const config = loadConfig(baseDir);

  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  if (action === 'list') {
    listTemplates();
    return;
  }

  if (action === 'use') {
    useTemplate(baseDir, config, templateName, options);
    return;
  }

  console.log(chalk.red(`Unknown action: ${action}`));
  console.log(chalk.gray('Available: list, use'));
  process.exit(1);
}

/**
 * List available templates
 */
function listTemplates(): void {
  console.log(chalk.blue('📋 Available Templates'));
  console.log();

  const templates = getBuiltInTemplates();

  Object.keys(templates).forEach(key => {
    const template = templates[key];
    console.log(chalk.bold(key));
    console.log(chalk.gray(`  ${template.description}`));
    console.log();
  });

  console.log(chalk.gray('Usage: prvc template use <name>'));
}

/**
 * Use a template — emits DEO v1 record
 */
function useTemplate(baseDir: string, config: any, templateName: string, options: any): void {
  const templates = getBuiltInTemplates();
  const template = templates[templateName];

  if (!template) {
    console.log(chalk.red(`Template not found: ${templateName}`));
    console.log(chalk.gray('Run: prvc template list'));
    process.exit(1);
  }

  const { title, area } = options;
  const projectCode = resolveProjectCode(config);
  const areaCode = resolveAreaCode(config, area);
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const sequence = getNextSequenceNumber(decisionsPath, projectCode, areaCode);
  const decisionId = generateDecisionId(projectCode, areaCode, sequence);

  const record = {
    schema: 'provenancecode.decision.v1',
    id: decisionId,
    title: title || template.defaultTitle,
    version: 1,
    lifecycle: { state: 'draft' },
    timestamps: { created_at: getCurrentTimestamp() },
    actors: { author: resolveGitAuthor(baseDir) ?? 'unknown' },
    outcome: template.outcome,
    rationale: template.rationale,
    risk: {
      level: template.riskLevel ?? 'low',
      description: template.riskDescription ?? ''
    },
    problem: template.problem,
    options: template.options ?? [],
    tags: template.tags ?? []
  };

  const filename = `${decisionId}.json`;
  const filepath = path.join(decisionsPath, filename);

  fs.ensureDirSync(decisionsPath);
  fs.writeJsonSync(filepath, record, { spaces: 2 });

  console.log(chalk.green(`✨ ${template.name} decision created!`));
  console.log();
  console.log(chalk.bold('  ID:'), chalk.cyan(decisionId));
  console.log(chalk.bold('  File:'), chalk.gray(path.relative(baseDir, filepath)));
  console.log();
  console.log(chalk.gray('  Next: Edit the file to customize the decision'));
  console.log(chalk.cyan(`        code ${filepath}`));
}

/**
 * Get built-in templates (DEO v1 field names)
 */
function getBuiltInTemplates(): any {
  return {
    architecture: {
      name: 'Architecture Decision',
      description: 'For significant architectural choices',
      defaultTitle: 'Architecture Decision: [Component/System]',
      problem: 'Describe the architectural challenge or need:\n- Current state of the system\n- What problem needs solving\n- Technical constraints\n- Business requirements',
      outcome: 'The architectural approach we will take:\n- Pattern/style chosen (e.g., microservices, event-driven, monolithic)\n- Key components and their responsibilities\n- Technology stack\n- Integration patterns',
      rationale: 'Why this architecture was chosen over alternatives:\n- Key trade-offs evaluated\n- Non-functional requirements addressed\n- Long-term sustainability',
      riskLevel: 'medium',
      riskDescription: 'Technical risks:\n- [Implementation challenges]\n- [Performance concerns]\n- [Scalability limits]\n\nMitigation:\n- [How we\'ll address each risk]',
      tags: ['architecture', 'technical-decision']
    },

    security: {
      name: 'Security Decision',
      description: 'For security-related decisions and reviews',
      defaultTitle: 'Security Decision: [Feature/System]',
      problem: 'Security context:\n- What system/feature are we securing\n- Current security posture\n- Compliance requirements (SOC2, GDPR, etc.)\n- Threat model',
      outcome: 'Security approach:\n- Authentication/authorization strategy\n- Data protection measures\n- Security controls implemented\n- Monitoring and detection',
      rationale: 'Why this security approach was selected:\n- Compliance requirements addressed\n- Threat model considerations\n- Usability vs. security trade-offs',
      riskLevel: 'high',
      riskDescription: 'Security risks:\n- [Residual risks]\n- [Attack vectors]\n- [Compliance gaps]\n\nMitigation:\n- [Security controls]\n- [Monitoring]\n- [Incident response plan]',
      tags: ['security', 'compliance']
    },

    'tech-debt': {
      name: 'Technical Debt Decision',
      description: 'For intentional technical debt decisions',
      defaultTitle: 'Tech Debt: [What We\'re Deferring]',
      problem: 'Why we\'re considering technical debt:\n- Business pressure or deadline\n- Current state of the code\n- What proper solution would require\n- Time/resource constraints',
      outcome: 'The shortcut we\'re taking:\n- What we\'re building (quick solution)\n- What we\'re NOT doing (proper solution)\n- When we plan to address this\n- How we\'ll track this debt',
      rationale: 'Why this trade-off is acceptable right now:\n- Business context and deadline\n- Estimated cost of debt vs. cost of doing it right\n- Payback plan',
      riskLevel: 'medium',
      riskDescription: 'Debt accumulation risks:\n- [Code becomes unmaintainable]\n- [Bugs increase]\n- [Team velocity drops]\n\nPayback plan:\n- [When: Target quarter/date]\n- [How: Refactoring approach]\n- [Cost: Estimated effort]',
      tags: ['tech-debt', 'refactoring']
    },

    api: {
      name: 'API Design Decision',
      description: 'For API design and versioning decisions',
      defaultTitle: 'API Decision: [Endpoint/Feature]',
      problem: 'API requirements:\n- Use case or feature need\n- Current API state\n- Client requirements\n- Integration constraints',
      outcome: 'API design:\n- Endpoint(s): [Methods and paths]\n- Request/response format\n- Authentication/authorization\n- Versioning strategy\n- Rate limiting',
      rationale: 'Why this API design was chosen:\n- REST vs. GraphQL vs. gRPC considerations\n- Client DX priorities\n- Backward compatibility strategy',
      riskLevel: 'low',
      riskDescription: 'API risks:\n- [Breaking existing clients]\n- [Performance at scale]\n- [Security vulnerabilities]\n\nMitigation:\n- [Versioning]\n- [Documentation]\n- [Testing strategy]',
      tags: ['api', 'design']
    },

    database: {
      name: 'Database Decision',
      description: 'For database and data model decisions',
      defaultTitle: 'Database Decision: [Database/Schema]',
      problem: 'Data requirements:\n- What data needs storing\n- Access patterns\n- Scale requirements\n- Query complexity',
      outcome: 'Database approach:\n- Database choice (SQL/NoSQL/etc.)\n- Schema design\n- Indexing strategy\n- Partitioning/sharding plan',
      rationale: 'Why this database was chosen:\n- Data model fit\n- Query pattern alignment\n- Operational expertise\n- Cost/licensing',
      riskLevel: 'medium',
      riskDescription: 'Data risks:\n- [Data loss scenarios]\n- [Performance degradation]\n- [Migration challenges]\n\nMitigation:\n- [Backup strategy]\n- [Monitoring]\n- [Testing approach]',
      tags: ['database', 'data-model']
    },

    tooling: {
      name: 'Tooling Decision',
      description: 'For developer tooling and infrastructure',
      defaultTitle: 'Tooling Decision: [Tool/Service]',
      problem: 'Tooling need:\n- Current pain point or gap\n- Team requirements\n- Integration needs\n- Budget constraints',
      outcome: 'Tool selection:\n- Tool/service chosen\n- Alternative tools considered\n- Why this tool wins\n- Implementation plan',
      rationale: 'Why this tool was selected over alternatives:\n- Key capabilities that differentiate it\n- Team familiarity and adoption curve\n- Total cost of ownership',
      riskLevel: 'low',
      riskDescription: 'Tool risks:\n- [Vendor dependency]\n- [Tool abandonment]\n- [Integration issues]\n\nMitigation:\n- [Exit strategy]\n- [Alternative options]\n- [Monitoring usage]',
      tags: ['tooling', 'infrastructure']
    },

    performance: {
      name: 'Performance Optimization',
      description: 'For performance-related decisions',
      defaultTitle: 'Performance: [Optimization Area]',
      problem: 'Performance issue:\n- Current performance metrics\n- Performance requirements/SLA\n- Bottleneck identified\n- User impact',
      outcome: 'Optimization approach:\n- What we\'re optimizing\n- Technique/strategy used\n- Expected improvement\n- Trade-offs made',
      rationale: 'Why this optimization approach was chosen:\n- Profiling evidence\n- Complexity vs. gain trade-off\n- Alternative approaches considered',
      riskLevel: 'low',
      riskDescription: 'Optimization risks:\n- [Premature optimization]\n- [New bottlenecks]\n- [Harder to maintain]\n\nValidation:\n- [Benchmarking approach]\n- [Monitoring strategy]\n- [Rollback plan]',
      tags: ['performance', 'optimization']
    }
  };
}
