import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig } from '../utils';
import { validateProvenance } from '../validator';

/**
 * Validate ProvenanceCode records
 */
export function validateCommand(baseDir: string, options: { mode?: string } = {}): void {
  console.log(chalk.blue('🔍 Validating ProvenanceCode records...'));
  console.log();

  // Load config
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  // Override validation mode if specified
  const validationMode = options.mode || config.validation.mode;

  // Run validation
  const result = validateProvenance(baseDir, config);

  // Display results
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const risksPath = path.join(baseDir, config.paths.risks);
  
  const decisionCount = fs.existsSync(decisionsPath) 
    ? fs.readdirSync(decisionsPath).filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json').length 
    : 0;
  const riskCount = fs.existsSync(risksPath) 
    ? fs.readdirSync(risksPath).filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json').length 
    : 0;

  console.log(chalk.gray(`Validated ${decisionCount} decision(s) and ${riskCount} risk(s)`));
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

