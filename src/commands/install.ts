import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { migrateToV2 } from './migrate';

/**
 * Install command - Copy ProvenanceCode structure to project root
 */
export function installCommand(baseDir: string, options: any = {}): void {
  const { force = false } = options;

  console.log(chalk.blue('📦 Installing ProvenanceCode structure...'));
  console.log();

  const provenanceDir = path.join(baseDir, 'provenance');
  
  // If structure already exists, migrate/repair in place.
  if (fs.existsSync(provenanceDir) && !force) {
    console.log(chalk.yellow('ℹ️  Existing provenance directory detected.'));
    console.log(chalk.gray('   Running v1 -> v2 migration and folder repair...'));
    console.log();

    const migration = migrateToV2(baseDir, { silent: true });

    console.log(chalk.green('✅ ProvenanceCode structure is ready (v2)!'));
    console.log(chalk.gray(`   Migrated decisions: ${migration.decisionCount}`));
    console.log(chalk.gray(`   Migrated risks:     ${migration.riskCount}`));
    console.log(chalk.gray(`   Created files:      ${migration.createdFiles.length}`));
    console.log(chalk.gray(`   Updated files:      ${migration.updatedFiles.length}`));
    console.log();
    return;
  }

  const migration = migrateToV2(baseDir, { appCode: 'PROJ', area: 'CORE', silent: true });

  console.log(chalk.green('✅ ProvenanceCode structure installed!'));
  console.log();
  console.log(chalk.bold('Created:'));
  console.log(chalk.gray('  provenance/'));
  console.log(chalk.gray('  ├── decisions/'));
  console.log(chalk.gray('  ├── risks/'));
  console.log(chalk.gray('  ├── schemas/'));
  console.log(chalk.gray('  ├── codes.json (v2.0 registry)'));
  console.log(chalk.gray('  ├── sequences.json (v2.0 tracking)'));
  console.log(chalk.gray('  ├── provenance.config.json'));
  console.log(chalk.gray('  └── README.md'));
  if (migration.decisionCount > 0 || migration.riskCount > 0) {
    console.log(chalk.gray(`  ↳ Migrated ${migration.decisionCount} decision(s) and ${migration.riskCount} risk(s)`));
  }
  console.log();
  console.log(chalk.bold('Next steps:'));
  console.log(chalk.cyan('  1. Configure: npx prvc config --app-code=MYAPP'));
  console.log(chalk.cyan('  2. Add starter pack: npx prvc starterpack add cursor'));
  console.log(chalk.cyan('  3. Start documenting: npx prvc journal add "Your first decision"'));
  console.log();
}

