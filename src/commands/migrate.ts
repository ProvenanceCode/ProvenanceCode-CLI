import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { ProvenanceConfig } from '../types';
import { getDecisionTemplate, getRiskTemplate, getProvenanceReadme } from '../templates';
import { loadConfig, saveConfig } from '../utils';

interface MigrationOptions {
  appCode?: string;
  area?: string;
  silent?: boolean;
}

interface MigrationResult {
  decisionCount: number;
  riskCount: number;
  createdFiles: string[];
  updatedFiles: string[];
}

const DEFAULT_CODES = {
  schema: 'provenancecode.codes@1.0',
  version: '1.0',
  monorepo: false,
  projects: {}
};

const DEFAULT_SEQUENCES = {
  schema: 'provenancecode.sequences@1.0',
  version: '1.0',
  sequences: {}
};

/**
 * CLI command wrapper for migration.
 */
export function migrateCommand(baseDir: string, options: MigrationOptions = {}): void {
  console.log(chalk.blue('🔄 Migrating ProvenanceCode from v1 to v2...'));
  console.log();

  const result = migrateToV2(baseDir, options);

  console.log(chalk.green('✅ Migration completed'));
  console.log();
  console.log(chalk.bold('Updated records:'));
  console.log(chalk.gray(`  Decisions: ${result.decisionCount}`));
  console.log(chalk.gray(`  Risks:     ${result.riskCount}`));
  console.log(chalk.gray(`  Created:   ${result.createdFiles.length} file(s)`));
  console.log(chalk.gray(`  Updated:   ${result.updatedFiles.length} file(s)`));
  console.log();
  console.log(chalk.bold('Next step:'));
  console.log(chalk.cyan('  npx prvc validate'));
  console.log();
}

/**
 * Idempotent migration helper used by install/init and migrate command.
 * Safe to run repeatedly.
 */
export function migrateToV2(baseDir: string, options: MigrationOptions = {}): MigrationResult {
  const appCode = (options.appCode || 'PROJ').toUpperCase();
  const area = (options.area || 'CORE').toUpperCase();
  const silent = options.silent === true;

  const provenanceDir = path.join(baseDir, 'provenance');
  const decisionsDir = path.join(provenanceDir, 'decisions');
  const risksDir = path.join(provenanceDir, 'risks');
  const schemasDir = path.join(provenanceDir, 'schemas');
  const configPath = path.join(provenanceDir, 'provenance.config.json');
  const codesPath = path.join(provenanceDir, 'codes.json');
  const sequencesPath = path.join(provenanceDir, 'sequences.json');
  const readmePath = path.join(provenanceDir, 'README.md');

  const createdFiles: string[] = [];
  const updatedFiles: string[] = [];

  fs.ensureDirSync(decisionsDir);
  fs.ensureDirSync(risksDir);
  fs.ensureDirSync(schemasDir);

  const sourceSchemaDir = path.join(__dirname, '..', 'schemas');
  fs.copySync(sourceSchemaDir, schemasDir);

  const config = ensureConfig(baseDir, appCode, area);
  if (!fs.existsSync(configPath)) {
    createdFiles.push(path.relative(baseDir, configPath));
  } else {
    updatedFiles.push(path.relative(baseDir, configPath));
  }

  if (!fs.existsSync(codesPath)) {
    fs.writeJsonSync(codesPath, DEFAULT_CODES, { spaces: 2 });
    createdFiles.push(path.relative(baseDir, codesPath));
  }

  if (!fs.existsSync(sequencesPath)) {
    fs.writeJsonSync(sequencesPath, DEFAULT_SEQUENCES, { spaces: 2 });
    createdFiles.push(path.relative(baseDir, sequencesPath));
  }

  const decisionTemplatePath = path.join(decisionsDir, 'TEMPLATE.json');
  if (!fs.existsSync(decisionTemplatePath)) {
    fs.writeFileSync(decisionTemplatePath, getDecisionTemplate());
    createdFiles.push(path.relative(baseDir, decisionTemplatePath));
  }

  const riskTemplatePath = path.join(risksDir, 'TEMPLATE.json');
  if (!fs.existsSync(riskTemplatePath)) {
    fs.writeFileSync(riskTemplatePath, getRiskTemplate());
    createdFiles.push(path.relative(baseDir, riskTemplatePath));
  }

  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, getProvenanceReadme());
    createdFiles.push(path.relative(baseDir, readmePath));
  }

  const decisionIdMap = migrateDecisionRecords(decisionsDir, config.defaultAppCode, config.defaultArea, updatedFiles, baseDir);
  const riskCount = migrateRiskRecords(risksDir, config.defaultAppCode, config.defaultArea, decisionIdMap, updatedFiles, baseDir);
  const decisionCount = Object.keys(decisionIdMap).length;

  if (!silent && (decisionCount > 0 || riskCount > 0)) {
    console.log(chalk.gray(`   Migrated ${decisionCount} decision(s) and ${riskCount} risk(s)`));
  }

  return {
    decisionCount,
    riskCount,
    createdFiles,
    updatedFiles
  };
}

function ensureConfig(baseDir: string, defaultAppCode: string, defaultArea: string): ProvenanceConfig {
  const existing = loadConfig(baseDir);
  const config: ProvenanceConfig = existing || {
    standard: 'v2.0',
    version: '2.0',
    idScheme: 'DEC-{PROJECT}-{SUBPROJECT}-{SEQ6}',
    riskIdScheme: 'RA-{PROJECT}-{SUBPROJECT}-{SEQ6}',
    defaultAppCode,
    defaultArea,
    paths: {
      root: 'provenance',
      decisions: 'provenance/decisions',
      risks: 'provenance/risks',
      schemas: 'provenance/schemas'
    },
    validation: {
      mode: 'warn'
    }
  };

  config.standard = 'v2.0';
  config.version = '2.0';
  config.idScheme = 'DEC-{PROJECT}-{SUBPROJECT}-{SEQ6}';
  config.riskIdScheme = 'RA-{PROJECT}-{SUBPROJECT}-{SEQ6}';
  config.defaultAppCode = (config.defaultAppCode || defaultAppCode).toUpperCase();
  config.defaultArea = (config.defaultArea || defaultArea).toUpperCase();
  config.paths = {
    root: 'provenance',
    decisions: 'provenance/decisions',
    risks: 'provenance/risks',
    schemas: 'provenance/schemas'
  };
  if (!config.validation) {
    config.validation = { mode: 'warn' };
  }
  if (config.validation.mode !== 'warn' && config.validation.mode !== 'fail') {
    config.validation.mode = 'warn';
  }

  saveConfig(baseDir, config);
  return config;
}

function migrateDecisionRecords(
  decisionsDir: string,
  defaultAppCode: string,
  defaultArea: string,
  updatedFiles: string[],
  baseDir: string
): Record<string, string> {
  const files = fs.existsSync(decisionsDir) ? fs.readdirSync(decisionsDir) : [];
  const idMap: Record<string, string> = {};

  files
    .filter(file => file.endsWith('.json') && file !== 'TEMPLATE.json')
    .forEach(file => {
      const filePath = path.join(decisionsDir, file);

      try {
        const record = fs.readJsonSync(filePath);
        const originalId = record.decision_id;
        const newId = normalizeDecisionId(originalId, defaultAppCode, defaultArea);
        let changed = false;

        if (newId && newId !== originalId) {
          record.decision_id = newId;
          idMap[originalId] = newId;
          changed = true;
        }

        if (record.schema === 'https://provenancecode.org/schemas/decision.g2.schema.json') {
          record.schema = 'provenancecode.decision.v2';
          changed = true;
        }

        if (changed) {
          const targetName = `${record.decision_id}.json`;
          const targetPath = path.join(decisionsDir, targetName);
          fs.writeJsonSync(targetPath, record, { spaces: 2 });
          if (targetPath !== filePath) {
            fs.removeSync(filePath);
          }
          updatedFiles.push(path.relative(baseDir, targetPath));
        }
      } catch (error) {
        // Skip malformed files during migration; validate command will report them.
      }
    });

  return idMap;
}

function migrateRiskRecords(
  risksDir: string,
  defaultAppCode: string,
  defaultArea: string,
  decisionIdMap: Record<string, string>,
  updatedFiles: string[],
  baseDir: string
): number {
  const files = fs.existsSync(risksDir) ? fs.readdirSync(risksDir) : [];
  let migratedCount = 0;

  files
    .filter(file => file.endsWith('.json') && file !== 'TEMPLATE.json')
    .forEach(file => {
      const filePath = path.join(risksDir, file);

      try {
        const record = fs.readJsonSync(filePath);
        const originalId = record.risk_id;
        const newId = normalizeRiskId(originalId, defaultAppCode, defaultArea);
        let changed = false;

        if (newId && newId !== originalId) {
          record.risk_id = newId;
          changed = true;
        }

        if (record.schema === 'https://provenancecode.org/schemas/risk.g2.schema.json') {
          record.schema = 'provenancecode.risk.v2';
          changed = true;
        }

        if (Array.isArray(record.linked_decisions)) {
          const remapped = record.linked_decisions.map((id: string) => decisionIdMap[id] || id);
          if (JSON.stringify(remapped) !== JSON.stringify(record.linked_decisions)) {
            record.linked_decisions = remapped;
            changed = true;
          }
        }

        if (changed) {
          const targetName = `${record.risk_id}.json`;
          const targetPath = path.join(risksDir, targetName);
          fs.writeJsonSync(targetPath, record, { spaces: 2 });
          if (targetPath !== filePath) {
            fs.removeSync(filePath);
          }
          updatedFiles.push(path.relative(baseDir, targetPath));
          migratedCount += 1;
        }
      } catch (error) {
        // Skip malformed files during migration; validate command will report them.
      }
    });

  return migratedCount;
}

function normalizeDecisionId(id: string, defaultAppCode: string, defaultArea: string): string {
  if (!id || typeof id !== 'string') {
    return id;
  }

  const alreadyV2 = /^DEC-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$/.test(id);
  if (alreadyV2) {
    return id;
  }

  const v1OnlySequence = /^DEC-([0-9]{6})$/.exec(id);
  if (v1OnlySequence) {
    return `DEC-${defaultAppCode}-${defaultArea}-${v1OnlySequence[1]}`;
  }

  return id;
}

function normalizeRiskId(id: string, defaultAppCode: string, defaultArea: string): string {
  if (!id || typeof id !== 'string') {
    return id;
  }

  const raV2 = /^RA-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$/.test(id);
  if (raV2) {
    return id;
  }

  const rskFull = /^RSK-([A-Z0-9]{2,4})-([A-Z0-9]{2,4})-([0-9]{6})$/.exec(id);
  if (rskFull) {
    return `RA-${rskFull[1]}-${rskFull[2]}-${rskFull[3]}`;
  }

  const legacy = /^(RSK|RA)-([0-9]{6})$/.exec(id);
  if (legacy) {
    return `RA-${defaultAppCode}-${defaultArea}-${legacy[2]}`;
  }

  return id;
}

