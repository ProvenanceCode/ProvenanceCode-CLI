import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { InitOptions, ProvenanceConfig } from '../types';
import { saveConfig } from '../utils';
import { migrateToV2 } from './migrate';
import { 
  getDecisionTemplate, 
  getRiskTemplate, 
  getProvenanceReadme,
  createCursorStarterPack,
  createClaudeStarterPack,
  createAntigravityStarterPack
} from '../templates';

/**
 * Initialize ProvenanceCode in a repository
 */
export function initCommand(baseDir: string, options: InitOptions): void {
  const {
    standard = 'deo',
    appCode = 'MYAPP',
    area = 'CORE',
    ai = [],
    ci = undefined,
    ciMode = 'warn',
    force = false
  } = options;

  console.log(chalk.blue('🚀 Initializing ProvenanceCode (DEO v1.0)...'));
  console.log();

  const enableRuntime = options.runtime ?? false;
  const provenanceDir = path.join(baseDir, 'provenance');
  const decisionsDir = path.join(provenanceDir, 'decisions');
  const risksDir = path.join(provenanceDir, 'risks');
  const specsDir = path.join(provenanceDir, 'specs');
  const mistakesDir = path.join(provenanceDir, 'mistakes');
  const schemasDir = path.join(provenanceDir, 'schemas');
  const configPath = path.join(provenanceDir, 'provenance.config.json');

  // Existing structure: migrate/repair instead of failing.
  if (fs.existsSync(configPath) && !force) {
    console.log(chalk.yellow('ℹ️  Existing ProvenanceCode installation detected.'));
    console.log(chalk.gray('   Running v1 -> v2 migration and folder repair...'));
    console.log();
    migrateToV2(baseDir, { appCode, area, silent: true });
    // Repair new dirs if missing
    fs.ensureDirSync(specsDir);
    fs.ensureDirSync(mistakesDir);
    if (enableRuntime) {
      fs.ensureDirSync(path.join(provenanceDir, 'tasks'));
      fs.ensureDirSync(path.join(provenanceDir, 'actions'));
      fs.ensureDirSync(path.join(provenanceDir, 'memories'));
    }
  } else {
    // Create directory structure
    console.log(chalk.gray('📁 Creating directory structure...'));
    fs.ensureDirSync(decisionsDir);
    fs.ensureDirSync(risksDir);
    fs.ensureDirSync(specsDir);
    fs.ensureDirSync(mistakesDir);
    fs.ensureDirSync(schemasDir);

    if (enableRuntime) {
      fs.ensureDirSync(path.join(provenanceDir, 'tasks'));
      fs.ensureDirSync(path.join(provenanceDir, 'actions'));
      fs.ensureDirSync(path.join(provenanceDir, 'memories'));
      console.log(chalk.gray('   + tasks/, actions/, memories/ (v2.0 runtime governance)'));
    }

    // Copy schemas
    console.log(chalk.gray('📄 Installing schemas...'));
    const sourceSchemaDir = path.join(__dirname, '..', 'schemas');
    fs.copySync(sourceSchemaDir, schemasDir);

    // Create config
    console.log(chalk.gray('⚙️  Creating configuration...'));
    const config: ProvenanceConfig = {
      standard: 'deo',
      version: '1.0',
      defaultAppCode: appCode.toUpperCase(),
      defaultArea: area.toUpperCase(),
      id_format: {
        style: 'hierarchical',
        project: appCode.toUpperCase(),
        subproject: area.toUpperCase(),
        require_subproject: false
      },
      paths: {
        root: 'provenance',
        decisions: 'provenance/decisions',
        risks: 'provenance/risks',
        specs: 'provenance/specs',
        mistakes: 'provenance/mistakes',
        schemas: 'provenance/schemas',
        ...(enableRuntime ? {
          tasks: 'provenance/tasks',
          actions: 'provenance/actions',
          memories: 'provenance/memories'
        } : {})
      },
      validation: {
        mode: ciMode ?? 'warn'
      },
      ...(enableRuntime ? { runtime: { enabled: true } } : {})
    };
    
    saveConfig(baseDir, config);

    // Create template files
    console.log(chalk.gray('📝 Creating templates...'));
    
    const decisionTemplatePath = path.join(decisionsDir, 'TEMPLATE.json');
    fs.writeFileSync(decisionTemplatePath, getDecisionTemplate());
    
    const riskTemplatePath = path.join(risksDir, 'TEMPLATE.json');
    fs.writeFileSync(riskTemplatePath, getRiskTemplate());

    // Create README
    const readmePath = path.join(provenanceDir, 'README.md');
    fs.writeFileSync(readmePath, getProvenanceReadme());
  }

  // Install AI starter packs
  if (ai && ai.length > 0) {
    console.log(chalk.gray('🤖 Installing AI starter packs...'));
    
    ai.forEach((aiTool: string) => {
      switch (aiTool.toLowerCase()) {
        case 'cursor':
          createCursorStarterPack(baseDir, appCode.toUpperCase(), area.toUpperCase());
          console.log(chalk.green('   ✓ Cursor'));
          break;
        case 'claude':
          createClaudeStarterPack(baseDir, appCode.toUpperCase(), area.toUpperCase());
          console.log(chalk.green('   ✓ Claude Code'));
          break;
        case 'antigravity':
          createAntigravityStarterPack(baseDir, appCode.toUpperCase(), area.toUpperCase());
          console.log(chalk.green('   ✓ Antigravity'));
          break;
        default:
          console.log(chalk.yellow(`   ⚠️  Unknown AI tool: ${aiTool}`));
      }
    });
  }

  // Create CI workflow if requested
  if (ci) {
    console.log(chalk.gray('🔄 Creating CI workflow...'));
    createCIWorkflow(baseDir, ci, ciMode);
  }

  // Success message
  console.log();
  console.log(chalk.green('✨ ProvenanceCode initialized successfully!'));
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log(chalk.gray('  1. Review configuration:'), chalk.cyan('cat provenance/provenance.config.json'));
  console.log(chalk.gray('  2. Record your first decision:'), chalk.cyan(`prvc journal add "My first decision" --outcome="What we decided" --rationale="Why we decided it"`));
  if (enableRuntime) {
    console.log(chalk.gray('  3. Record a task:'), chalk.cyan('prvc tap new "My first agent task" --agent=cursor-ai'));
    console.log(chalk.gray('  4. Validate records:'), chalk.cyan('npx prvc validate'));
  } else {
    console.log(chalk.gray('  3. Validate records:'), chalk.cyan('npx prvc validate'));
    console.log(chalk.gray('  4. Add runtime governance (v2.0):'), chalk.cyan('prvc init --runtime --force'));
  }
  console.log();
  console.log(chalk.gray('📖 Documentation: https://provenancecode.org'));
  console.log();
}

/**
 * Create GitHub CI workflow
 */
function createCIWorkflow(baseDir: string, ci: string, mode: string): void {
  if (ci.toLowerCase() !== 'github') {
    console.log(chalk.yellow('   ⚠️  Only GitHub CI is currently supported'));
    return;
  }

  const workflowDir = path.join(baseDir, '.github', 'workflows');
  fs.ensureDirSync(workflowDir);

  const workflowContent = `name: ProvenanceCode Validation

on:
  pull_request:
    paths:
      - 'provenance/**'
  push:
    branches:
      - main
      - master
    paths:
      - 'provenance/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install ProvenanceCode CLI
        run: npx prvc@latest --version || npm install -g prvc
      
      - name: Validate ProvenanceCode records
        run: npx prvc validate${mode === 'fail' ? ' --mode=fail' : ''}
        continue-on-error: ${mode !== 'fail'}
      
      - name: Comment validation results
        if: failure() && github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ ProvenanceCode validation failed. Please run \`npx prvc validate\` locally and fix any errors.'
            })
`;

  const workflowPath = path.join(workflowDir, 'provenancecode.yml');
  fs.writeFileSync(workflowPath, workflowContent);
  
  console.log(chalk.green('   ✓ GitHub Actions workflow created'));
  console.log(chalk.gray('     File: .github/workflows/provenancecode.yml'));
  
  if (mode === 'warn') {
    console.log(chalk.yellow('     Mode: warn (will not block PRs)'));
  } else {
    console.log(chalk.red('     Mode: fail (will block PRs on errors)'));
  }
}

/**
 * Add AI starter pack to existing installation
 */
export function addStarterCommand(baseDir: string, aiTool: string): void {
  const configPath = path.join(baseDir, 'provenance', 'provenance.config.json');
  
  if (!fs.existsSync(configPath)) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const config: ProvenanceConfig = fs.readJsonSync(configPath);
  const appCodeVal = config.defaultAppCode ?? config.id_format?.project ?? 'MYAPP';
  const areaVal = config.defaultArea ?? config.id_format?.subproject ?? 'CORE';

  console.log(chalk.blue(`🤖 Installing ${aiTool} starter pack...`));

  switch (aiTool.toLowerCase()) {
    case 'cursor':
      createCursorStarterPack(baseDir, appCodeVal, areaVal);
      console.log(chalk.green('✓ Cursor starter pack installed'));
      console.log(chalk.gray('  Location: provenance/ai/cursor/'));
      break;
    case 'claude':
      createClaudeStarterPack(baseDir, appCodeVal, areaVal);
      console.log(chalk.green('✓ Claude Code starter pack installed'));
      console.log(chalk.gray('  Location: provenance/ai/claude/'));
      break;
    case 'antigravity':
      createAntigravityStarterPack(baseDir, appCodeVal, areaVal);
      console.log(chalk.green('✓ Antigravity starter pack installed'));
      console.log(chalk.gray('  Location: provenance/ai/antigravity/'));
      break;
    default:
      console.log(chalk.red(`❌ Unknown AI tool: ${aiTool}`));
      console.log(chalk.gray('   Supported: cursor, claude, antigravity'));
      process.exit(1);
  }
}

