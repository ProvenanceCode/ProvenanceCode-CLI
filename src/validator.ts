import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ValidationResult, ProvenanceConfig } from './types';
import { getDecisionFiles, getRiskFiles, getArtifactFiles, validateDecisionId, validateRiskId } from './utils';

// Load schemas
const decisionSchema = require('./schemas/decision.v1.schema.json');
const riskSchema     = require('./schemas/risk.schema.json');        // canonical risk@1.0
const riskG2Schema   = require('./schemas/risk.g2.schema.json');     // legacy risk.v2 (backwards compat)
const acceptanceSchema = require('./schemas/acceptance-receipt.schema.json');
const specSchema = require('./schemas/spec.schema.json');
const mistakeSchema = require('./schemas/mistake.schema.json');
const tapSchema = require('./schemas/tap.schema.json');
const actSchema = require('./schemas/act.schema.json');
const meoSchema = require('./schemas/meo.schema.json');

// Outdated schema identifiers that must be rejected with an error
const OUTDATED_SCHEMA_IDS = [
  'provenancecode.decision.v2',
  'https://provenancecode.org/schemas/decision.g2.schema.json'
];

// Legacy risk schema identifier — validated against risk.g2.schema.json (backwards compat)
const LEGACY_RISK_SCHEMA_ID = 'provenancecode.risk.v2';

/**
 * Create an AJV instance with schemas loaded
 */
function createValidator(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false
  });

  addFormats(ajv);

  ajv.addSchema(decisionSchema, 'decision');
  ajv.addSchema(riskSchema, 'risk');
  ajv.addSchema(riskG2Schema, 'risk-g2');
  ajv.addSchema(acceptanceSchema, 'acceptance');
  ajv.addSchema(specSchema, 'spec');
  ajv.addSchema(mistakeSchema, 'mistake');
  ajv.addSchema(tapSchema, 'tap');
  ajv.addSchema(actSchema, 'act');
  ajv.addSchema(meoSchema, 'meo');

  return ajv;
}

/**
 * Validate a single decision file against DEO v1 schema
 */
function validateDecisionFile(filePath: string, ajv: Ajv, result: ValidationResult): void {
  try {
    const data = fs.readJsonSync(filePath);

    // Reject outdated schema identifiers with an error (not a warning)
    if (OUTDATED_SCHEMA_IDS.includes(data.schema)) {
      result.errors.push({
        file: filePath,
        message: `Outdated schema identifier "${data.schema}" — must be "provenancecode.decision.v1"`
      });
      result.valid = false;
      return;
    }

    // Validate against DEO v1 JSON Schema
    const valid = ajv.validate('decision', data);

    if (!valid && ajv.errors) {
      ajv.errors.forEach(error => {
        result.errors.push({
          file: filePath,
          message: `Schema validation failed: ${error.message}`,
          details: error
        });
      });
      result.valid = false;
    }

    // ID validation: read DEO v1 `id` first, fall back to legacy `decision_id`
    const idField = data.id ?? data.decision_id;
    if (idField && !validateDecisionId(idField)) {
      result.errors.push({
        file: filePath,
        message: `Invalid id format: ${idField}`
      });
      result.valid = false;
    }

    // Recommended field warnings (DEO v1)
    if (!data.rationale) {
      result.warnings.push({
        file: filePath,
        message: 'Recommended field "rationale" is missing'
      });
    }
    if (!data.outcome) {
      result.warnings.push({
        file: filePath,
        message: 'Recommended field "outcome" is missing'
      });
    }

  } catch (error: any) {
    result.errors.push({
      file: filePath,
      message: `Failed to parse JSON: ${error.message}`
    });
    result.valid = false;
  }
}

/**
 * Validate a single risk file.
 * Supports both canonical risk@1.0 and legacy risk.v2 (G2) formats.
 */
function validateRiskFile(filePath: string, ajv: Ajv, result: ValidationResult): void {
  try {
    const data = fs.readJsonSync(filePath);
    const schemaId: string | undefined = data.schema;

    if (schemaId === LEGACY_RISK_SCHEMA_ID) {
      // Legacy G2 format — validate against risk.g2.schema.json, warn about upgrade
      const valid = ajv.validate('risk-g2', data);
      if (!valid && ajv.errors) {
        ajv.errors.forEach(error => {
          result.errors.push({ file: filePath, message: `Schema validation failed: ${error.message}`, details: error });
        });
        result.valid = false;
      }
      result.warnings.push({
        file: filePath,
        message: `Risk record uses legacy schema "${LEGACY_RISK_SCHEMA_ID}" — migrate to "provenancecode.risk@1.0"`
      });
    } else {
      // Canonical risk@1.0 format
      const valid = ajv.validate('risk', data);
      if (!valid && ajv.errors) {
        ajv.errors.forEach(error => {
          result.errors.push({ file: filePath, message: `Schema validation failed: ${error.message}`, details: error });
        });
        result.valid = false;
      }

      if (schemaId && schemaId !== 'provenancecode.risk@1.0') {
        result.warnings.push({
          file: filePath,
          message: `Unrecognised risk schema identifier "${schemaId}" — expected "provenancecode.risk@1.0"`
        });
      }
    }

    // Validate linked decision IDs (G2 format)
    if (data.linked_decisions && Array.isArray(data.linked_decisions)) {
      data.linked_decisions.forEach((decId: string) => {
        if (!validateDecisionId(decId)) {
          result.errors.push({ file: filePath, message: `Invalid linked decision ID format: ${decId}` });
          result.valid = false;
        }
      });
    }

    // Validate linked decision IDs (risk@1.0 links.decisions format)
    if (data.links?.decisions && Array.isArray(data.links.decisions)) {
      data.links.decisions.forEach((decId: string) => {
        if (!validateDecisionId(decId)) {
          result.errors.push({ file: filePath, message: `Invalid links.decisions ID format: ${decId}` });
          result.valid = false;
        }
      });
    }

  } catch (error: any) {
    result.errors.push({ file: filePath, message: `Failed to parse JSON: ${error.message}` });
    result.valid = false;
  }
}

/**
 * Validate a single acceptance receipt file (provenancecode.acceptance.v1).
 */
function validateAcceptanceFile(filePath: string, ajv: Ajv, result: ValidationResult): void {
  try {
    const data = fs.readJsonSync(filePath);
    const valid = ajv.validate('acceptance', data);
    if (!valid && ajv.errors) {
      ajv.errors.forEach(error => {
        result.errors.push({ file: filePath, message: `Schema validation failed: ${error.message}`, details: error });
      });
      result.valid = false;
    }
  } catch (error: any) {
    result.errors.push({ file: filePath, message: `Failed to parse JSON: ${error.message}` });
    result.valid = false;
  }
}

/**
 * Generic schema validator for simple artifacts (SPEC, MR, TAP, ACT, MEO)
 */
function validateGenericFile(
  filePath: string,
  schemaKey: string,
  ajv: Ajv,
  result: ValidationResult,
  idField: string,
  idPattern: RegExp
): void {
  try {
    const data = fs.readJsonSync(filePath);
    const valid = ajv.validate(schemaKey, data);

    if (!valid && ajv.errors) {
      ajv.errors.forEach(error => {
        result.errors.push({
          file: filePath,
          message: `Schema validation failed: ${error.message}`,
          details: error
        });
      });
      result.valid = false;
    }

    const id: string | undefined = data[idField] ?? data.id;
    if (id && !idPattern.test(id)) {
      result.errors.push({ file: filePath, message: `Invalid ${idField} format: ${id}` });
      result.valid = false;
    }
  } catch (error: any) {
    result.errors.push({ file: filePath, message: `Failed to parse JSON: ${error.message}` });
    result.valid = false;
  }
}

/**
 * Validate all provenance records in a directory
 */
export function validateProvenance(baseDir: string, config: ProvenanceConfig): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const ajv = createValidator();

  // Decisions
  const decisionFiles = getDecisionFiles(path.join(baseDir, config.paths.decisions));
  decisionFiles.forEach(file => validateDecisionFile(file, ajv, result));

  // Risks
  const riskFiles = getRiskFiles(path.join(baseDir, config.paths.risks));
  riskFiles.forEach(file => validateRiskFile(file, ajv, result));

  // Specs (v1.x)
  const specsPath = path.join(baseDir, config.paths.specs ?? 'provenance/specs');
  getArtifactFiles(specsPath, 'spec.json').forEach(file =>
    validateGenericFile(file, 'spec', ajv, result, 'id', /^SPEC-/)
  );

  // Mistakes (v1.x)
  const mistakesPath = path.join(baseDir, config.paths.mistakes ?? 'provenance/mistakes');
  getArtifactFiles(mistakesPath, 'mistake.json').forEach(file =>
    validateGenericFile(file, 'mistake', ajv, result, 'mr_id', /^MR-/)
  );

  // TAP (v2.0 runtime)
  const tasksPath = path.join(baseDir, config.paths.tasks ?? 'provenance/tasks');
  getArtifactFiles(tasksPath, 'task.json').forEach(file =>
    validateGenericFile(file, 'tap', ajv, result, 'id', /^TAP-/)
  );

  // ACT (v2.0 runtime)
  const actionsPath = path.join(baseDir, config.paths.actions ?? 'provenance/actions');
  getArtifactFiles(actionsPath, 'action.json').forEach(file =>
    validateGenericFile(file, 'act', ajv, result, 'id', /^ACT-/)
  );

  // MEO (v2.0 runtime)
  const memoriesPath = path.join(baseDir, config.paths.memories ?? 'provenance/memories');
  getArtifactFiles(memoriesPath, 'memory.json').forEach(file =>
    validateGenericFile(file, 'meo', ajv, result, 'id', /^MEO-/)
  );

  // Acceptance receipts (v1.x — generated by Verity at merge time, stored alongside decisions)
  const acceptancesPath = path.join(baseDir, config.paths.decisions);
  if (fs.existsSync(acceptancesPath)) {
    fs.readdirSync(acceptancesPath)
      .filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json')
      .map(f => path.join(acceptancesPath, f))
      .forEach(filePath => {
        try {
          const data = fs.readJsonSync(filePath);
          if (data.schema === 'provenancecode.acceptance.v1') {
            validateAcceptanceFile(filePath, ajv, result);
          }
        } catch { /* handled by validateDecisionFile for non-acceptance files */ }
      });
  }

  return result;
}
