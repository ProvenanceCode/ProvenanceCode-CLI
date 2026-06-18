import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { ProvenanceConfig } from '../types';
import { getDecisionTemplate, getRiskTemplate, getProvenanceReadme } from '../templates';
import { loadConfig, saveConfig, getCurrentTimestamp, getNextSimpleSequenceNumber } from '../utils';

interface MigrationOptions {
  appCode?: string;
  area?: string;
  silent?: boolean;
  toDeo?: boolean;
  toTap?: boolean;
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
  if (options.toDeo) {
    migrateToDeo(baseDir, options);
    return;
  }

  if (options.toTap) {
    migrateToTap(baseDir);
    return;
  }

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
 * Migrate g2/v2 decision records to DEO v1.0 format.
 * Triggered by: prvc migrate --to-deo
 */
function migrateToDeo(baseDir: string, options: MigrationOptions): void {
  console.log(chalk.blue('🔄 Migrating ProvenanceCode records to DEO v1.0...'));
  console.log();

  const config = loadConfig(baseDir);
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized in this directory.'));
    console.log(chalk.gray('   Run: npx prvc init'));
    process.exit(1);
  }

  const decisionsPath = path.join(baseDir, config.paths.decisions);
  if (!fs.existsSync(decisionsPath)) {
    console.log(chalk.yellow('No decisions directory found.'));
    return;
  }

  const OUTDATED = [
    'provenancecode.decision.v2',
    'https://provenancecode.org/schemas/decision.g2.schema.json'
  ];

  const files = fs.readdirSync(decisionsPath)
    .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

  let migratedCount = 0;
  let skippedCount = 0;
  const humanReviewFields: string[] = [];

  files.forEach(file => {
    const filePath = path.join(decisionsPath, file);
    try {
      const record = fs.readJsonSync(filePath);

      if (!OUTDATED.includes(record.schema)) {
        skippedCount++;
        return;
      }

      const rawId: string = record.decision_id ?? record.id ?? '';
      // Re-pad 6-digit hierarchical IDs to 7-digit: DEC-APP-AREA-000001 → DEC-APP-AREA-0000001
      const deoId = rawId.replace(
        /^(DEC-[A-Z0-9]{2,6}-[A-Z0-9]{2,6}-)([0-9]{6})$/,
        (_m, prefix, seq) => `${prefix}${seq.padStart(7, '0')}`
      );

      const deoRecord: any = {
        schema: 'provenancecode.decision.v1',
        id: deoId || rawId,
        title: record.title,
        version: 1,
        lifecycle: {
          state: record.status === 'deprecated' ? 'superseded' : (record.status ?? 'draft')
        },
        timestamps: {
          created_at: record.timestamps?.created_at ?? record.date_created ?? getCurrentTimestamp(),
          ...(record.timestamps?.updated_at ?? record.date_updated
            ? { updated_at: record.timestamps?.updated_at ?? record.date_updated }
            : {})
        },
        actors: {
          author: (Array.isArray(record.authors) && record.authors.length > 0)
            ? record.authors[0]
            : (record.actors?.author ?? 'unknown'),
          ...(Array.isArray(record.authors) && record.authors.length > 1
            ? { reviewers: record.authors.slice(1) }
            : {})
        },
        outcome: record.decision ?? record.outcome ?? '',
        rationale: record.rationale ?? '',
        risk: typeof record.risk === 'string'
          ? { level: 'low', description: record.risk }
          : (record.risk ?? { level: 'low' })
      };

      // Carry over optional fields
      if (record.context && typeof record.context === 'string') {
        deoRecord.problem = record.context;
      }
      if (record.consequences) {
        deoRecord.consequences = record.consequences;
      }
      if (Array.isArray(record.tags) && record.tags.length > 0) {
        deoRecord.tags = record.tags;
      }

      // Warn about fields requiring human review
      if (!deoRecord.rationale) {
        humanReviewFields.push(`${file}: "rationale" is empty — fill in why this decision was made`);
      }
      if (!deoRecord.outcome) {
        humanReviewFields.push(`${file}: "outcome" is empty — fill in what was decided`);
      }

      // Rename file if id changed (7-digit padding)
      const newFilename = `${deoRecord.id}.json`;
      const newPath = path.join(decisionsPath, newFilename);

      fs.writeJsonSync(newPath, deoRecord, { spaces: 2 });
      if (newPath !== filePath) {
        fs.removeSync(filePath);
      }

      migratedCount++;
    } catch {
      console.log(chalk.yellow(`  ⚠️  Skipped (parse error): ${file}`));
    }
  });

  console.log(chalk.green(`✅ DEO v1.0 migration completed`));
  console.log();
  console.log(chalk.gray(`  Migrated: ${migratedCount} file(s)`));
  console.log(chalk.gray(`  Skipped (already DEO v1):  ${skippedCount} file(s)`));

  if (humanReviewFields.length > 0) {
    console.log();
    console.log(chalk.yellow('⚠️  Fields requiring human review:'));
    humanReviewFields.forEach(msg => console.log(chalk.yellow(`  • ${msg}`)));
  }

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

  const resolvedAppCode = config.defaultAppCode ?? appCode;
  const resolvedArea = config.defaultArea ?? area;
  const decisionIdMap = migrateDecisionRecords(decisionsDir, resolvedAppCode, resolvedArea, updatedFiles, baseDir);
  const riskCount = migrateRiskRecords(risksDir, resolvedAppCode, resolvedArea, decisionIdMap, updatedFiles, baseDir);
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
  const appCode = ((existing?.defaultAppCode ?? existing?.id_format?.project) || defaultAppCode).toUpperCase();
  const area = ((existing?.defaultArea ?? existing?.id_format?.subproject) || defaultArea).toUpperCase();

  const config: ProvenanceConfig = existing || {
    standard: 'deo',
    version: '1.0',
    defaultAppCode: appCode,
    defaultArea: area,
    id_format: {
      style: 'hierarchical',
      project: appCode,
      subproject: area,
      require_subproject: false
    },
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

  config.defaultAppCode = appCode;
  config.defaultArea = area;
  if (!config.id_format) {
    config.id_format = {
      style: 'hierarchical',
      project: appCode,
      subproject: area,
      require_subproject: false
    };
  }
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

/**
 * Migrate legacy task-provenance@2.0 records to TAP v1 format.
 * Triggered by: prvc migrate --to-tap
 */
function migrateToTap(baseDir: string): void {
  console.log(chalk.blue('🔄 Migrating task-provenance@2.0 records to TAP v1...'));
  console.log();

  const config = loadConfig(baseDir);
  if (!config) {
    console.log(chalk.red('❌ ProvenanceCode is not initialized. Run: prvc init'));
    process.exit(1);
  }

  const legacyPaths = [
    path.join(baseDir, 'provenance', 'tasks'),
    path.join(baseDir, 'provenance', 'task-provenances'),
    path.join(baseDir, '.provenancecode', 'tasks')
  ];

  const tasksDir = path.join(baseDir, config.paths.tasks ?? 'provenance/tasks');
  fs.ensureDirSync(tasksDir);

  let migratedCount = 0;
  let skippedCount = 0;

  // Determine the next safe sequence number BEFORE processing any files,
  // so we never overwrite existing TAPs that were created with prvc tap new.
  let nextSeqBase = parseInt(
    getNextSimpleSequenceNumber(tasksDir, 'TAP', 'id'),
    10
  );

  for (const legacyPath of legacyPaths) {
    if (!fs.existsSync(legacyPath)) continue;

    const files = fs.readdirSync(legacyPath)
      .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');

    // Also skip files already renamed to .migrated
    const activeFiles = files.filter(f => !f.endsWith('.migrated'));

    activeFiles.forEach(file => {
      const srcPath = path.join(legacyPath, file);
      try {
        const record = fs.readJsonSync(srcPath);

        // Only migrate records that are task-provenance@2.0 or have no TAP schema
        if (record.schema === 'provenancecode.tap.v1') {
          skippedCount++;
          return;
        }

        const seq = String(nextSeqBase + migratedCount).padStart(6, '0');
        const tapId = record.id ?? `TAP-${seq}`;
        const tapDir = path.join(tasksDir, tapId);
        fs.ensureDirSync(tapDir);

        const tap: any = {
          schema: 'provenancecode.tap.v1',
          id: tapId,
          title: record.title ?? record.task_description ?? 'Migrated task',
          version: 1,
          lifecycle: { state: record.status ?? 'completed' },
          timestamps: {
            started_at: record.started_at ?? record.created_at ?? getCurrentTimestamp(),
            ended_at: record.ended_at ?? record.completed_at ?? null,
            attested_at: record.attested_at ?? null
          },
          runtime: {
            agent: record.agent ?? record.bot ?? 'unknown',
            model: record.model ?? 'unknown',
            session_id: record.session_id ?? null
          },
          git: {
            branch: record.branch ?? record.git?.branch ?? 'unknown',
            commit_sha: record.commit_sha ?? record.git?.commit_sha ?? 'unknown',
            repo: record.repo ?? record.git?.repo
          },
          actors: {
            agent: record.agent ?? record.bot ?? 'unknown',
            model: record.model ?? 'unknown',
            human_reviewer: record.human_reviewer ?? null
          },
          task: {
            outcome: record.outcome ?? record.result ?? 'succeeded',
            description: record.task_description ?? record.title,
            summary: record.summary
          },
          risk: {
            needs_human_review: record.needs_human_review ?? false,
            level: record.risk_level ?? 'low'
          },
          enforcement: { validated: false },
          links: {
            decisions: record.decisions ?? record.links?.decisions,
            specs: record.specs ?? record.links?.specs
          },
          _migrated_from: record.schema ?? 'task-provenance@2.0'
        };

        fs.writeJsonSync(path.join(tapDir, 'task.json'), tap, { spaces: 2 });
        // Rename source to prevent duplicate migration on subsequent runs
        fs.renameSync(srcPath, srcPath + '.migrated');
        migratedCount++;
      } catch {
        console.log(chalk.yellow(`  ⚠️  Skipped (parse error): ${file}`));
      }
    });
  }

  console.log(chalk.green('✅ TAP migration completed'));
  console.log();
  console.log(chalk.gray(`  Migrated: ${migratedCount} task record(s)`));
  console.log(chalk.gray(`  Skipped (already TAP v1): ${skippedCount}`));
  console.log();
  console.log(chalk.bold('Next step:'));
  console.log(chalk.cyan('  npx prvc validate'));
  console.log();
}


