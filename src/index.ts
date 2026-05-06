#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand, addStarterCommand } from './commands/init';
import { validateCommand } from './commands/validate';
import { journalCommand } from './commands/journal';
import { visualizeCommand } from './commands/visualize';
import { templateCommand } from './commands/template';
import { searchCommand, relatedCommand, showCommand } from './commands/search';
import { qualityCommand, impactCommand } from './commands/quality';
import { exportCommand } from './commands/export';
import { upgradeCommand } from './commands/upgrade';
import { installCommand } from './commands/install';
import { migrateCommand } from './commands/migrate';
import { configCommand } from './commands/config';
import { starterpackCommand } from './commands/starterpack';

const program = new Command();

program
  .name('prvc')
  .description('ProvenanceCode CLI - Generate and validate Decision Evidence Objects (DEO v1.0)')
  .version('2.0.0');

// Install command (NEW)
program
  .command('install')
  .description('Install ProvenanceCode structure in your project')
  .option('--force', 'Force reinstall if already exists')
  .action((options) => {
    try {
      installCommand(process.cwd(), options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate existing ProvenanceCode records (v1→v2 or g2→DEO v1.0)')
  .option('--app-code <code>', 'Fallback project code for legacy IDs', 'PROJ')
  .option('--area <area>', 'Fallback subproject code for legacy IDs', 'CORE')
  .option('--to-deo', 'Migrate g2/v2 records to DEO v1.0 format')
  .action((options) => {
    try {
      migrateCommand(process.cwd(), {
        appCode: options.appCode,
        area: options.area,
        toDeo: options.toDeo
      });
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize ProvenanceCode (DEO v1.0) in your repository')
  .option('--standard <standard>', 'Standard version', 'deo')
  .option('--app-code <code>', 'Application code for ID generation', 'MYAPP')
  .option('--area <area>', 'Default area for records', 'CORE')
  .option('--ai <tools>', 'AI starter packs (comma-separated: cursor,claude,antigravity)', (value) => {
    return value.split(',').map((s: string) => s.trim());
  })
  .option('--ci <provider>', 'CI provider (github)')
  .option('--ci-mode <mode>', 'CI validation mode (warn|fail)', 'warn')
  .option('--force', 'Force reinitialize if already exists')
  .action((options) => {
    try {
      initCommand(process.cwd(), {
        standard: options.standard,
        appCode: options.appCode,
        area: options.area,
        ai: options.ai,
        ci: options.ci,
        ciMode: options.ciMode,
        force: options.force
      });
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Config command (NEW)
program
  .command('config')
  .description('Configure ProvenanceCode settings')
  .argument('[action]', 'Action: set, get, list, monorepo')
  .option('--app-code <code>', 'Set application code')
  .option('--area <area>', 'Set default area')
  .option('--mode <mode>', 'Set validation mode (warn|fail)')
  .option('--key <key>', 'Get specific config key')
  .option('--enable', 'Enable monorepo mode')
  .option('--disable', 'Disable monorepo mode')
  .option('--roots <roots>', 'Set monorepo roots (comma-separated)')
  .option('--add-root <root>', 'Add a monorepo root')
  .option('--remove-root <root>', 'Remove a monorepo root')
  .action((action, options) => {
    try {
      configCommand(process.cwd(), action || 'list', options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Starterpack command (NEW)
program
  .command('starterpack')
  .description('Install AI starter packs to proper IDE locations')
  .argument('<action>', 'Action: add')
  .argument('<tool>', 'AI tool: cursor, claude, antigravity')
  .action((action, tool) => {
    try {
      starterpackCommand(process.cwd(), action, tool);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate ProvenanceCode records')
  .option('--mode <mode>', 'Validation mode (warn|fail)')
  .action((options) => {
    try {
      validateCommand(process.cwd(), {
        mode: options.mode
      });
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Starter command
program
  .command('starter')
  .description('Manage AI starter packs')
  .argument('<action>', 'Action: add')
  .argument('<tool>', 'AI tool: cursor, claude, antigravity')
  .action((action, tool) => {
    try {
      if (action === 'add') {
        addStarterCommand(process.cwd(), tool);
      } else {
        console.error(chalk.red('Error:'), `Unknown action: ${action}`);
        console.log(chalk.gray('Usage: prvc starter add <tool>'));
        process.exit(1);
      }
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Journal command
program
  .command('journal')
  .description('Quick decision capture and management')
  .argument('<action>', 'Action: add, search, export, list')
  .argument('[title]', 'Decision title (for add action)')
  // DEO v1.0 flags
  .option('--outcome <outcome>', 'Decision outcome — what was decided (DEO v1.0)')
  .option('--rationale <rationale>', 'Why this decision was made (DEO v1.0)')
  .option('--risk-level <level>', 'Risk level: low|medium|high|critical (DEO v1.0)', 'low')
  .option('--bot <name>', 'AI bot name (e.g. cursor-ai, kiro, claude-code)')
  .option('--author <author>', 'Author (defaults to git config user.email)')
  // Legacy alias (kept for v2.0 compat)
  .option('--decision <decision>', 'Alias for --outcome (deprecated, use --outcome)')
  // Shared flags
  .option('--context <context>', 'Problem context (stored as problem field)')
  .option('--area <area>', 'Area/subproject code')
  .option('--auto-link', 'Auto-link to git context')
  .option('--query <query>', 'Search query')
  .option('--fuzzy', 'Fuzzy search')
  .option('--format <format>', 'Export format (markdown, json, csv)')
  .option('--output <file>', 'Output file')
  .option('--status <status>', 'Filter by lifecycle state')
  .option('--recent <n>', 'Show N most recent', '10')
  .option('--limit <n>', 'Limit results', '10')
  .action((action, title, options) => {
    try {
      journalCommand(process.cwd(), action, { ...options, title });
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Visualize command
program
  .command('visualize')
  .alias('viz')
  .description('Create beautiful visualizations')
  .argument('<type>', 'Type: graph, timeline, stats')
  .option('--output <file>', 'Output file')
  .option('--format <format>', 'Format (html, mermaid)')
  .option('--range <days>', 'Time range (e.g., 30d)')
  .action((type, options) => {
    try {
      visualizeCommand(process.cwd(), type, options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Template command
program
  .command('template')
  .description('Use smart decision templates')
  .argument('<action>', 'Action: list, use')
  .argument('[name]', 'Template name')
  .option('--title <title>', 'Decision title')
  .option('--area <area>', 'Area code')
  .action((action, name, options) => {
    try {
      templateCommand(process.cwd(), action, name, options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Search command
program
  .command('search')
  .description('Search decisions and risks')
  .argument('<query>', 'Search query')
  .option('--fuzzy', 'Fuzzy search')
  .option('--type <type>', 'Type: decision, risk')
  .option('--status <status>', 'Filter by status')
  .option('--limit <n>', 'Limit results', '20')
  .action((query, options) => {
    try {
      searchCommand(process.cwd(), query, options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Related command
program
  .command('related')
  .description('Find related decisions')
  .argument('<decision-id>', 'Decision ID')
  .action((decisionId) => {
    try {
      relatedCommand(process.cwd(), decisionId);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Show command
program
  .command('show')
  .description('Display a decision or risk')
  .argument('<id>', 'Decision or risk ID')
  .action((id) => {
    try {
      showCommand(process.cwd(), id);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Quality command
program
  .command('quality')
  .description('Show decision quality score')
  .action((options) => {
    try {
      qualityCommand(process.cwd(), options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Impact command
program
  .command('impact')
  .description('Analyze decision impact')
  .argument('<decision-id>', 'Decision ID')
  .action((decisionId) => {
    try {
      impactCommand(process.cwd(), decisionId);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Export command
program
  .command('export')
  .description('Export decisions to various formats')
  .option('--format <format>', 'Format: html, markdown, confluence, notion, json, pdf', 'html')
  .option('--output <file>', 'Output file')
  .option('--theme <theme>', 'Theme: light, dark', 'light')
  .action((options) => {
    try {
      exportCommand(process.cwd(), options);
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Upgrade command
program
  .command('upgrade')
  .description('Learn about the ProvenanceCode GitHub App')
  .action(() => {
    try {
      upgradeCommand();
    } catch (error: any) {
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

