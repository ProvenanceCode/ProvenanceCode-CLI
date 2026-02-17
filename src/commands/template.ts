import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';
import { getNextSequenceNumber, generateDecisionId, getCurrentTimestamp } from '../utils';

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
 * Use a template
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
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const areaCode = area || config.defaultArea;
  const sequence = getNextSequenceNumber(decisionsPath, config.defaultAppCode, areaCode);
  const decisionId = generateDecisionId(config.defaultAppCode, areaCode, sequence);

  const record = {
    schema: 'https://provenancecode.org/schemas/decision.g2.schema.json',
    decision_id: decisionId,
    title: title || template.defaultTitle,
    status: 'draft',
    context: template.context,
    decision: template.decision,
    consequences: template.consequences,
    risk: template.risk,
    date_created: getCurrentTimestamp(),
    tags: template.tags
  };

  const filename = `${decisionId}.json`;
  const filepath = path.join(decisionsPath, filename);
  
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
 * Get built-in templates
 */
function getBuiltInTemplates(): any {
  return {
    architecture: {
      name: 'Architecture Decision',
      description: 'For significant architectural choices',
      defaultTitle: 'Architecture Decision: [Component/System]',
      context: 'Describe the architectural challenge or need:\n- Current state of the system\n- What problem needs solving\n- Technical constraints\n- Business requirements',
      decision: 'The architectural approach we will take:\n- Pattern/style chosen (e.g., microservices, event-driven, monolithic)\n- Key components and their responsibilities\n- Technology stack\n- Integration patterns',
      consequences: 'Positive:\n- [List benefits: scalability, maintainability, performance, etc.]\n\nNegative:\n- [List drawbacks: complexity, cost, learning curve, etc.]\n\nTrade-offs:\n- [What we\'re optimizing for vs. what we\'re sacrificing]',
      risk: 'Technical risks:\n- [Implementation challenges]\n- [Performance concerns]\n- [Scalability limits]\n\nMitigation:\n- [How we\'ll address each risk]',
      tags: ['architecture', 'technical-decision']
    },
    
    security: {
      name: 'Security Decision',
      description: 'For security-related decisions and reviews',
      defaultTitle: 'Security Decision: [Feature/System]',
      context: 'Security context:\n- What system/feature are we securing\n- Current security posture\n- Compliance requirements (SOC2, GDPR, etc.)\n- Threat model',
      decision: 'Security approach:\n- Authentication/authorization strategy\n- Data protection measures\n- Security controls implemented\n- Monitoring and detection',
      consequences: 'Security improvements:\n- [Enhanced protection]\n- [Compliance benefits]\n\nUsability impact:\n- [Effect on user experience]\n- [Developer workflow changes]',
      risk: 'Security risks:\n- [Residual risks]\n- [Attack vectors]\n- [Compliance gaps]\n\nMitigation:\n- [Security controls]\n- [Monitoring]\n- [Incident response plan]',
      tags: ['security', 'compliance']
    },
    
    'tech-debt': {
      name: 'Technical Debt Decision',
      description: 'For intentional technical debt decisions',
      defaultTitle: 'Tech Debt: [What We\'re Deferring]',
      context: 'Why we\'re considering technical debt:\n- Business pressure or deadline\n- Current state of the code\n- What proper solution would require\n- Time/resource constraints',
      decision: 'The shortcut we\'re taking:\n- What we\'re building (quick solution)\n- What we\'re NOT doing (proper solution)\n- When we plan to address this\n- How we\'ll track this debt',
      consequences: 'Short-term:\n- [Ship faster]\n- [Reduced scope]\n\nLong-term:\n- [Code quality impact]\n- [Maintenance burden]\n- [Refactoring cost]',
      risk: 'Debt accumulation risks:\n- [Code becomes unmaintainable]\n- [Bugs increase]\n- [Team velocity drops]\n\nPayback plan:\n- [When: Target quarter/date]\n- [How: Refactoring approach]\n- [Cost: Estimated effort]',
      tags: ['tech-debt', 'refactoring']
    },
    
    api: {
      name: 'API Design Decision',
      description: 'For API design and versioning decisions',
      defaultTitle: 'API Decision: [Endpoint/Feature]',
      context: 'API requirements:\n- Use case or feature need\n- Current API state\n- Client requirements\n- Integration constraints',
      decision: 'API design:\n- Endpoint(s): [Methods and paths]\n- Request/response format\n- Authentication/authorization\n- Versioning strategy\n- Rate limiting',
      consequences: 'API quality:\n- [RESTful compliance]\n- [Developer experience]\n- [Performance characteristics]\n\nMaintenance:\n- [Breaking changes]\n- [Backward compatibility]\n- [Deprecation strategy]',
      risk: 'API risks:\n- [Breaking existing clients]\n- [Performance at scale]\n- [Security vulnerabilities]\n\nMitigation:\n- [Versioning]\n- [Documentation]\n- [Testing strategy]',
      tags: ['api', 'design']
    },
    
    database: {
      name: 'Database Decision',
      description: 'For database and data model decisions',
      defaultTitle: 'Database Decision: [Database/Schema]',
      context: 'Data requirements:\n- What data needs storing\n- Access patterns\n- Scale requirements\n- Query complexity',
      decision: 'Database approach:\n- Database choice (SQL/NoSQL/etc.)\n- Schema design\n- Indexing strategy\n- Partitioning/sharding plan',
      consequences: 'Data quality:\n- [Consistency model]\n- [Query performance]\n- [Storage efficiency]\n\nOperational:\n- [Backup/recovery]\n- [Scaling approach]\n- [Migration complexity]',
      risk: 'Data risks:\n- [Data loss scenarios]\n- [Performance degradation]\n- [Migration challenges]\n\nMitigation:\n- [Backup strategy]\n- [Monitoring]\n- [Testing approach]',
      tags: ['database', 'data-model']
    },
    
    tooling: {
      name: 'Tooling Decision',
      description: 'For developer tooling and infrastructure',
      defaultTitle: 'Tooling Decision: [Tool/Service]',
      context: 'Tooling need:\n- Current pain point or gap\n- Team requirements\n- Integration needs\n- Budget constraints',
      decision: 'Tool selection:\n- Tool/service chosen\n- Alternative tools considered\n- Why this tool wins\n- Implementation plan',
      consequences: 'Team impact:\n- [Productivity gain]\n- [Learning curve]\n- [Cost (time/money)]\n\nMaintenance:\n- [Ongoing effort]\n- [Vendor lock-in]\n- [Migration path]',
      risk: 'Tool risks:\n- [Vendor dependency]\n- [Tool abandonment]\n- [Integration issues]\n\nMitigation:\n- [Exit strategy]\n- [Alternative options]\n- [Monitoring usage]',
      tags: ['tooling', 'infrastructure']
    },
    
    performance: {
      name: 'Performance Optimization',
      description: 'For performance-related decisions',
      defaultTitle: 'Performance: [Optimization Area]',
      context: 'Performance issue:\n- Current performance metrics\n- Performance requirements/SLA\n- Bottleneck identified\n- User impact',
      decision: 'Optimization approach:\n- What we\'re optimizing\n- Technique/strategy used\n- Expected improvement\n- Trade-offs made',
      consequences: 'Performance gains:\n- [Latency improvement]\n- [Throughput increase]\n- [Resource usage]\n\nComplexity:\n- [Code complexity added]\n- [Maintenance burden]\n- [Debugging difficulty]',
      risk: 'Optimization risks:\n- [Premature optimization]\n- [New bottlenecks]\n- [Harder to maintain]\n\nValidation:\n- [Benchmarking approach]\n- [Monitoring strategy]\n- [Rollback plan]',
      tags: ['performance', 'optimization']
    }
  };
}

