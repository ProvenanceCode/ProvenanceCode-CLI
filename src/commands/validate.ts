import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, getArtifactFiles, getDecisionFiles, getRiskFiles } from '../utils';
import { validateProvenance } from '../validator';

type Track = 'repo' | 'runtime' | 'all';

function countFolderArtifacts(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(name => {
    const full = path.join(dir, name);
    return fs.statSync(full).isDirectory();
  }).length;
}

/**
 * Validate ProvenanceCode records
 */
export function validateCommand(baseDir: string, options: { mode?: string; track?: string } = {}): void {
  console.log(chalk.blue('🔍 Validating ProvenanceCode records...'));
  console.log();

  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const validationMode = options.mode || config.validation.mode;
  const track: Track = (options.track as Track) ?? 'all';

  const result = validateProvenance(baseDir, config);

  // ── Artifact counts ───────────────────────────────────────────────────────
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const risksPath = path.join(baseDir, config.paths.risks);
  const specsPath = path.join(baseDir, config.paths.specs ?? 'provenance/specs');
  const mistakesPath = path.join(baseDir, config.paths.mistakes ?? 'provenance/mistakes');
  const tasksPath = path.join(baseDir, config.paths.tasks ?? 'provenance/tasks');
  const actionsPath = path.join(baseDir, config.paths.actions ?? 'provenance/actions');
  const memoriesPath = path.join(baseDir, config.paths.memories ?? 'provenance/memories');

  const decCount = getDecisionFiles(decisionsPath).length;
  const rskCount = getRiskFiles(risksPath).length;
  const spcCount = getArtifactFiles(specsPath, 'spec.json').length;
  const mrCount  = getArtifactFiles(mistakesPath, 'mistake.json').length;
  const tapCount = getArtifactFiles(tasksPath, 'task.json').length;
  const actCount = getArtifactFiles(actionsPath, 'action.json').length;
  const meoCount = getArtifactFiles(memoriesPath, 'memory.json').length;

  if (track === 'repo' || track === 'all') {
    console.log(chalk.bold('Repo Governance (v1.x)'));
    console.log(chalk.gray(`  DEO decisions : ${decCount}`));
    console.log(chalk.gray(`  RA risks       : ${rskCount}`));
    console.log(chalk.gray(`  SPEC records   : ${spcCount}`));
    console.log(chalk.gray(`  MR mistakes    : ${mrCount}`));
  }
  if (track === 'runtime' || track === 'all') {
    console.log(chalk.bold('Runtime Governance (v2.0)'));
    console.log(chalk.gray(`  TAP tasks      : ${tapCount}`));
    console.log(chalk.gray(`  ACT actions    : ${actCount}`));
    console.log(chalk.gray(`  MEO memories   : ${meoCount}`));
  }
  console.log();

  // Display errors
  if (result.errors.length > 0) {
    console.log(chalk.red(`❌ ${result.errors.length} error(s) found:`));
    console.log();
    
    result.errors.forEach((error, index) => {
      console.log(chalk.red(`  ${index + 1}. ${path.relative(baseDir, error.file)}`));
      console.log(chalk.gray(`     ${error.message}`));
      if (error.details) {
        console.log(chalk.gray(`     ${JSON.stringify(error.details, null, 2)}`));
      }
      console.log();
    });
  }

  // Display warnings
  if (result.warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  ${result.warnings.length} warning(s) found:`));
    console.log();
    
    result.warnings.forEach((warning, index) => {
      console.log(chalk.yellow(`  ${index + 1}. ${path.relative(baseDir, warning.file)}`));
      console.log(chalk.gray(`     ${warning.message}`));
      console.log();
    });
  }

  // Summary
  if (result.valid && result.warnings.length === 0) {
    console.log(chalk.green('✨ All records are valid!'));
    console.log();
    process.exit(0);
  } else if (result.valid && result.warnings.length > 0) {
    console.log(chalk.green('✓ No errors found'));
    console.log(chalk.yellow(`⚠️  ${result.warnings.length} warning(s) - please review`));
    console.log();
    
    if (validationMode === 'fail') {
      console.log(chalk.gray('Mode: fail (warnings do not cause failure)'));
    }
    
    process.exit(0);
  } else {
    console.log(chalk.red('❌ Validation failed'));
    console.log();
    
    if (validationMode === 'fail') {
      console.log(chalk.red('Mode: fail - exiting with error code'));
      process.exit(1);
    } else {
      console.log(chalk.yellow('Mode: warn - exiting with success despite errors'));
      console.log(chalk.gray('(Set mode to "fail" in config or use --mode=fail to block on errors)'));
      process.exit(0);
    }
  }
}


