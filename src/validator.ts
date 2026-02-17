import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ValidationResult, ProvenanceConfig } from './types';
import { getDecisionFiles, getRiskFiles, validateDecisionId, validateRiskId } from './utils';

// Load schemas
const decisionSchema = require('./schemas/decision.g2.schema.json');
const riskSchema = require('./schemas/risk.g2.schema.json');

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
  
  return ajv;
}

/**
 * Validate a single decision file
 */
function validateDecisionFile(filePath: string, ajv: Ajv, result: ValidationResult): void {
  try {
    const data = fs.readJsonSync(filePath);
    
    // Validate against schema
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
    
    // Additional validations
    if (data.decision_id && !validateDecisionId(data.decision_id)) {
      result.errors.push({
        file: filePath,
        message: `Invalid decision_id format: ${data.decision_id}`
      });
      result.valid = false;
    }
    
    // Check schema URL
    if (data.schema !== 'provenancecode.decision.v2' && data.schema !== 'https://provenancecode.org/schemas/decision.g2.schema.json') {
      result.warnings.push({
        file: filePath,
        message: `Schema identifier should be 'provenancecode.decision.v2' (v2.0 standard): ${data.schema}`
      });
    }
    
    // Warn on missing optional but recommended fields
    if (!data.consequences) {
      result.warnings.push({
        file: filePath,
        message: 'Recommended field "consequences" is missing'
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
 * Validate a single risk file
 */
function validateRiskFile(filePath: string, ajv: Ajv, result: ValidationResult): void {
  try {
    const data = fs.readJsonSync(filePath);
    
    // Validate against schema
    const valid = ajv.validate('risk', data);
    
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
    
    // Additional validations
    if (data.risk_id && !validateRiskId(data.risk_id)) {
      result.errors.push({
        file: filePath,
        message: `Invalid risk_id format: ${data.risk_id}`
      });
      result.valid = false;
    }
    
    // Check schema URL  
    if (data.schema !== 'provenancecode.risk.v2' && data.schema !== 'https://provenancecode.org/schemas/risk.g2.schema.json') {
      result.warnings.push({
        file: filePath,
        message: `Schema identifier should be 'provenancecode.risk.v2' (v2.0 standard): ${data.schema}`
      });
    }
    
    // Validate linked decision IDs
    if (data.linked_decisions && Array.isArray(data.linked_decisions)) {
      data.linked_decisions.forEach((decId: string) => {
        if (!validateDecisionId(decId)) {
          result.errors.push({
            file: filePath,
            message: `Invalid linked decision ID format: ${decId}`
          });
          result.valid = false;
        }
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
 * Validate all provenance records in a directory
 */
export function validateProvenance(baseDir: string, config: ProvenanceConfig): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  const ajv = createValidator();
  
  // Validate decision files
  const decisionsPath = path.join(baseDir, config.paths.decisions);
  const decisionFiles = getDecisionFiles(decisionsPath);
  
  decisionFiles.forEach(file => {
    validateDecisionFile(file, ajv, result);
  });
  
  // Validate risk files
  const risksPath = path.join(baseDir, config.paths.risks);
  const riskFiles = getRiskFiles(risksPath);
  
  riskFiles.forEach(file => {
    validateRiskFile(file, ajv, result);
  });
  
  return result;
}

