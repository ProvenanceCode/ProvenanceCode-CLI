import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { loadConfig, saveConfig } from '../utils';

/**
 * Config command - Configure ProvenanceCode settings
 */
export function configCommand(baseDir: string, action: string, options: any = {}): void {
  const config = loadConfig(baseDir);
  
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not installed in this directory.'));
    console.log(chalk.gray('   Run: npx prvc install'));
    process.exit(1);
  }

  switch (action) {
    case 'set':
      setConfig(baseDir, config, options);
      break;
    case 'get':
      getConfig(baseDir, config, options);
      break;
    case 'list':
      listConfig(baseDir, config);
      break;
    case 'monorepo':
      configureMonorepo(baseDir, config, options);
      break;
    default:
      // If no action but has options, treat as set
      if (Object.keys(options).filter(k => k !== 'help').length > 0) {
        setConfig(baseDir, config, options);
      } else {
        listConfig(baseDir, config);
      }
  }
}

/**
 * Set configuration values
 */
function setConfig(baseDir: string, config: any, options: any): void {
  const { appCode, area, mode } = options;
  let changed = false;

  if (appCode) {
    const newCode = appCode.toUpperCase();
    // Validate format (2-4 uppercase chars)
    if (!/^[A-Z0-9]{2,4}$/.test(newCode)) {
      console.log(chalk.red('❌ Invalid project code format. Must be 2-4 uppercase letters/numbers.'));
      process.exit(1);
    }
    config.defaultAppCode = newCode;
    changed = true;
    console.log(chalk.green(`✓ Set project code: ${config.defaultAppCode}`));
    
    // Update codes.json to register the project
    updateCodesRegistry(baseDir, newCode, config.defaultArea);
  }

  if (area) {
    const newArea = area.toUpperCase();
    // Validate format (2-4 uppercase chars)
    if (!/^[A-Z0-9]{2,4}$/.test(newArea)) {
      console.log(chalk.red('❌ Invalid subproject code format. Must be 2-4 uppercase letters/numbers.'));
      process.exit(1);
    }
    config.defaultArea = newArea;
    changed = true;
    console.log(chalk.green(`✓ Set default subproject: ${config.defaultArea}`));
    
    // Update codes.json to register the subproject
    updateCodesRegistry(baseDir, config.defaultAppCode, newArea);
  }

  if (mode) {
    config.validation.mode = mode;
    changed = true;
    console.log(chalk.green(`✓ Set validation mode: ${mode}`));
  }

  if (changed) {
    saveConfig(baseDir, config);
    console.log();
    console.log(chalk.gray('Configuration saved.'));
  } else {
    console.log(chalk.yellow('No changes made. Use --app-code, --area, or --mode options.'));
  }
}

/**
 * Update codes.json registry with project/subproject
 */
function updateCodesRegistry(baseDir: string, projectCode: string, subprojectCode: string): void {
  const codesPath = path.join(baseDir, 'provenance', 'codes.json');
  
  if (!fs.existsSync(codesPath)) {
    // Create codes.json if it doesn't exist
    const codes = {
      "schema": "provenancecode.codes@1.0",
      "version": "1.0",
      "monorepo": false,
      "projects": {}
    };
    fs.writeJsonSync(codesPath, codes, { spaces: 2 });
  }

  const codes = fs.readJsonSync(codesPath);
  
  // Ensure project exists
  if (!codes.projects[projectCode]) {
    codes.projects[projectCode] = {
      name: projectCode,
      subprojects: {}
    };
  }
  
  // Ensure subproject exists
  if (!codes.projects[projectCode].subprojects[subprojectCode]) {
    codes.projects[projectCode].subprojects[subprojectCode] = {
      name: subprojectCode,
      workspace: "."
    };
  }
  
  fs.writeJsonSync(codesPath, codes, { spaces: 2 });
}

/**
 * Get configuration value
 */
function getConfig(baseDir: string, config: any, options: any): void {
  const { key } = options;

  if (!key) {
    listConfig(baseDir, config);
    return;
  }

  const value = getNestedValue(config, key);
  
  if (value !== undefined) {
    console.log(chalk.cyan(JSON.stringify(value, null, 2)));
  } else {
    console.log(chalk.red(`Key not found: ${key}`));
  }
}

/**
 * List all configuration
 */
function listConfig(baseDir: string, config: any): void {
  console.log(chalk.blue('📋 ProvenanceCode Configuration'));
  console.log();
  console.log(chalk.bold('Project:'));
  console.log(chalk.gray(`  App Code:        ${config.defaultAppCode}`));
  console.log(chalk.gray(`  Default Area:    ${config.defaultArea}`));
  console.log();
  console.log(chalk.bold('Standard:'));
  console.log(chalk.gray(`  Version:         ${config.standard} ${config.version}`));
  console.log(chalk.gray(`  Decision ID:     ${config.idScheme}`));
  console.log(chalk.gray(`  Risk ID:         ${config.riskIdScheme}`));
  console.log();
  console.log(chalk.bold('Validation:'));
  console.log(chalk.gray(`  Mode:            ${config.validation.mode}`));
  console.log();

  if (config.monorepo) {
    console.log(chalk.bold('Monorepo:'));
    console.log(chalk.gray(`  Enabled:         ${config.monorepo.enabled ? 'Yes' : 'No'}`));
    if (config.monorepo.enabled && config.monorepo.roots) {
      console.log(chalk.gray(`  Sub-projects:`));
      config.monorepo.roots.forEach((root: string) => {
        console.log(chalk.gray(`    - ${root}`));
      });
    }
    console.log();
  }

  console.log(chalk.bold('Paths:'));
  console.log(chalk.gray(`  Root:            ${config.paths.root}`));
  console.log(chalk.gray(`  Decisions:       ${config.paths.decisions}`));
  console.log(chalk.gray(`  Risks:           ${config.paths.risks}`));
  console.log(chalk.gray(`  Schemas:         ${config.paths.schemas}`));
  console.log();
}

/**
 * Configure monorepo settings
 */
function configureMonorepo(baseDir: string, config: any, options: any): void {
  const { enable, disable, addRoot, removeRoot, roots } = options;

  // Initialize monorepo config if not exists
  if (!config.monorepo) {
    config.monorepo = {
      enabled: false,
      roots: []
    };
  }

  if (enable) {
    config.monorepo.enabled = true;
    console.log(chalk.green('✓ Monorepo mode enabled'));
  }

  if (disable) {
    config.monorepo.enabled = false;
    console.log(chalk.green('✓ Monorepo mode disabled'));
  }

  if (roots) {
    // Set roots from comma-separated string
    const rootsArray = roots.split(',').map((r: string) => r.trim()).filter(Boolean);
    config.monorepo.roots = rootsArray;
    config.monorepo.enabled = true;
    console.log(chalk.green(`✓ Set ${rootsArray.length} monorepo root(s):`));
    rootsArray.forEach((root: string) => {
      console.log(chalk.gray(`  - ${root}`));
    });
  }

  if (addRoot) {
    if (!config.monorepo.roots) {
      config.monorepo.roots = [];
    }
    if (!config.monorepo.roots.includes(addRoot)) {
      config.monorepo.roots.push(addRoot);
      config.monorepo.enabled = true;
      console.log(chalk.green(`✓ Added monorepo root: ${addRoot}`));
    } else {
      console.log(chalk.yellow(`Root already exists: ${addRoot}`));
    }
  }

  if (removeRoot) {
    if (config.monorepo.roots) {
      const index = config.monorepo.roots.indexOf(removeRoot);
      if (index > -1) {
        config.monorepo.roots.splice(index, 1);
        console.log(chalk.green(`✓ Removed monorepo root: ${removeRoot}`));
      } else {
        console.log(chalk.yellow(`Root not found: ${removeRoot}`));
      }
    }
  }

  saveConfig(baseDir, config);
  console.log();
  console.log(chalk.gray('Configuration saved.'));
  console.log();

  if (config.monorepo.enabled && config.monorepo.roots && config.monorepo.roots.length > 0) {
    console.log(chalk.bold('💡 Tip:'));
    console.log(chalk.gray('  Commands will now search all configured sub-projects.'));
    console.log(chalk.gray('  Use --project=<root> to target a specific sub-project.'));
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((o, k) => (o || {})[k], obj);
}

