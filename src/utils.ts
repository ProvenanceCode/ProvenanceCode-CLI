import * as fs from 'fs-extra';
import * as path from 'path';
import { ProvenanceConfig } from './types';

/**
 * Get the next sequence number for a given area
 */
export function getNextSequenceNumber(decisionsPath: string, appCode: string, area: string): string {
  const prefix = `DEC-${appCode}-${area}-`;
  let maxSeq = 0;

  if (fs.existsSync(decisionsPath)) {
    const files = fs.readdirSync(decisionsPath);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readJsonSync(path.join(decisionsPath, file));
          if (content.decision_id && content.decision_id.startsWith(prefix)) {
            const seqPart = content.decision_id.split('-').pop();
            if (seqPart) {
              const seq = parseInt(seqPart, 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        } catch (e) {
          // Skip invalid files
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(6, '0');
}

/**
 * Get the next risk sequence number for a given area
 */
export function getNextRiskSequenceNumber(risksPath: string, appCode: string, area: string): string {
  const prefix = `RSK-${appCode}-${area}-`;
  let maxSeq = 0;

  if (fs.existsSync(risksPath)) {
    const files = fs.readdirSync(risksPath);
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readJsonSync(path.join(risksPath, file));
          if (content.risk_id && content.risk_id.startsWith(prefix)) {
            const seqPart = content.risk_id.split('-').pop();
            if (seqPart) {
              const seq = parseInt(seqPart, 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        } catch (e) {
          // Skip invalid files
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(6, '0');
}

/**
 * Generate a decision ID
 */
export function generateDecisionId(appCode: string, area: string, sequence: string): string {
  return `DEC-${appCode}-${area}-${sequence}`;
}

/**
 * Generate a risk ID
 */
export function generateRiskId(appCode: string, area: string, sequence: string): string {
  return `RSK-${appCode}-${area}-${sequence}`;
}

/**
 * Load provenance config from a directory
 */
export function loadConfig(baseDir: string): ProvenanceConfig | null {
  const configPath = path.join(baseDir, 'provenance', 'provenance.config.json');
  
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    return fs.readJsonSync(configPath);
  } catch (e) {
    return null;
  }
}

/**
 * Save provenance config
 */
export function saveConfig(baseDir: string, config: ProvenanceConfig): void {
  const configPath = path.join(baseDir, 'provenance', 'provenance.config.json');
  fs.ensureFileSync(configPath);
  fs.writeJsonSync(configPath, config, { spaces: 2 });
}

/**
 * Validate ID format (v2.0 standard)
 */
export function validateDecisionId(id: string): boolean {
  return /^DEC-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$/.test(id);
}

/**
 * Validate risk ID format (v2.0 standard - uses RA prefix per standard)
 */
export function validateRiskId(id: string): boolean {
  return /^RA-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$/.test(id);
}

/**
 * Get all decision files in a directory
 */
export function getDecisionFiles(decisionsPath: string): string[] {
  if (!fs.existsSync(decisionsPath)) {
    return [];
  }

  return fs.readdirSync(decisionsPath)
    .filter(file => file.endsWith('.json') && file !== 'TEMPLATE.json')
    .map(file => path.join(decisionsPath, file));
}

/**
 * Get all risk files in a directory
 */
export function getRiskFiles(risksPath: string): string[] {
  if (!fs.existsSync(risksPath)) {
    return [];
  }

  return fs.readdirSync(risksPath)
    .filter(file => file.endsWith('.json') && file !== 'TEMPLATE.json')
    .map(file => path.join(risksPath, file));
}

/**
 * Format a timestamp as ISO 8601
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

