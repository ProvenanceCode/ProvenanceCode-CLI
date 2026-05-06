import * as fs from 'fs-extra';
import * as path from 'path';
import { ProvenanceConfig } from './types';

/**
 * Resolve the project code from either DEO id_format or legacy defaultAppCode
 */
export function resolveProjectCode(config: ProvenanceConfig): string {
  return config.id_format?.project ?? config.defaultAppCode ?? 'MYAPP';
}

/**
 * Resolve the area/subproject code
 */
export function resolveAreaCode(config: ProvenanceConfig, override?: string): string {
  return override ?? config.id_format?.subproject ?? config.defaultArea ?? 'CORE';
}

/**
 * Get the next sequence number for a given project/area, reading both DEO v1 `id` and legacy `decision_id`
 */
export function getNextSequenceNumber(decisionsPath: string, projectCode: string, areaCode: string): string {
  const prefix = `DEC-${projectCode}-${areaCode}-`;
  let maxSeq = 0;

  if (fs.existsSync(decisionsPath)) {
    const entries = fs.readdirSync(decisionsPath);

    entries.forEach(entry => {
      // Support both flat files and per-folder structure
      const jsonPath = entry.endsWith('.json')
        ? path.join(decisionsPath, entry)
        : path.join(decisionsPath, entry, 'decision.json');

      if (!fs.existsSync(jsonPath)) return;
      try {
        const content = fs.readJsonSync(jsonPath);
        // Read DEO v1 `id` first, fall back to legacy `decision_id`
        const id = content.id ?? content.decision_id;
        if (id && id.startsWith(prefix)) {
          const seqPart = id.split('-').pop();
          const seq = parseInt(seqPart ?? '', 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      } catch {
        // Skip invalid files
      }
    });
  }

  return String(maxSeq + 1).padStart(7, '0');
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
        } catch {
          // Skip invalid files
        }
      }
    });
  }

  const nextSeq = maxSeq + 1;
  return String(nextSeq).padStart(6, '0');
}

/**
 * Generate a DEO v1 decision ID (7-digit hierarchical format)
 */
export function generateDecisionId(projectCode: string, areaCode: string, sequence: string): string {
  return `DEC-${projectCode}-${areaCode}-${sequence}`;
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
  } catch {
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
 * Validate DEO v1 decision ID format (both hierarchical and legacy)
 * Hierarchical: DEC-{2-6}-[{2-6}-]{7digit}
 * Legacy:       DEC-{6digit}
 */
export function validateDecisionId(id: string): boolean {
  return /^(DEC-[A-Z0-9]{2,6}(-[A-Z0-9]{2,6})?-[0-9]{7}|DEC-[0-9]{6})$/.test(id);
}

/**
 * Validate risk ID format
 */
export function validateRiskId(id: string): boolean {
  return /^RA-[A-Z0-9]{2,4}-[A-Z0-9]{2,4}-[0-9]{6}$/.test(id);
}

/**
 * Get all decision files in a directory (flat files and per-folder)
 */
export function getDecisionFiles(decisionsPath: string): string[] {
  if (!fs.existsSync(decisionsPath)) {
    return [];
  }

  const result: string[] = [];
  const entries = fs.readdirSync(decisionsPath);

  entries.forEach(entry => {
    if (entry === 'TEMPLATE.json') return;

    const fullPath = path.join(decisionsPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Per-folder structure: DEC-PROJECT-AREA-0000001/decision.json
      const nested = path.join(fullPath, 'decision.json');
      if (fs.existsSync(nested)) {
        result.push(nested);
      }
    } else if (entry.endsWith('.json')) {
      result.push(fullPath);
    }
  });

  return result;
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

/**
 * Attempt to resolve the git author email from the repo config
 */
export function resolveGitAuthor(baseDir: string): string | null {
  try {
    const { execSync } = require('child_process');
    return execSync('git config user.email', { cwd: baseDir }).toString().trim() || null;
  } catch {
    return null;
  }
}
