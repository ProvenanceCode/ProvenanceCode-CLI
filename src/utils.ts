import * as fs from 'fs-extra';
import * as path from 'path';
import { ProvenanceConfig } from './types';

/**
 * Validates app-code / area / project codes against a safe character allowlist.
 * Prevents path-traversal characters from flowing into directory names.
 * Allowlist: A-Z, 0-9, underscore, hyphen — max 16 characters.
 */
export function validateCode(value: string, label: string): void {
  if (!/^[A-Z0-9_-]{1,16}$/i.test(value)) {
    throw new Error(
      `Invalid ${label} "${value}": must contain only A-Z, 0-9, _ or - and be at most 16 characters`
    );
  }
}

/**
 * Resolves a path and asserts it remains under the given root directory.
 * Throws on any path that escapes the root via `..` or absolute segments.
 */
export function safePath(root: string, ...parts: string[]): string {
  const rootResolved = path.resolve(root);
  const resolved = path.resolve(root, ...parts);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error(`Path traversal detected: "${resolved}" is outside root "${rootResolved}"`);
  }
  return resolved;
}

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
 * Get the next risk sequence number for a given area (RA- prefix)
 */
export function getNextRiskSequenceNumber(risksPath: string, appCode: string, area: string): string {
  // Accept both RA- (canonical) and RSK- (legacy) prefixes when scanning
  const canonPrefix = `RA-${appCode}-${area}-`;
  const legacyPrefix = `RSK-${appCode}-${area}-`;
  let maxSeq = 0;

  if (fs.existsSync(risksPath)) {
    const files = fs.readdirSync(risksPath);

    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const content = fs.readJsonSync(path.join(risksPath, file));
          const riskId: string | undefined = content.ra_id ?? content.risk_id;
          if (riskId && (riskId.startsWith(canonPrefix) || riskId.startsWith(legacyPrefix))) {
            const seqPart = riskId.split('-').pop();
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
 * Generate a risk ID (canonical RA- prefix)
 */
export function generateRiskId(appCode: string, area: string, sequence: string): string {
  return `RA-${appCode}-${area}-${sequence}`;
}

/**
 * Get the next simple 6-digit sequence number for any artifact type stored
 * in per-folder structure (PREFIX-XXXXXX/artifact.json or flat *.json)
 */
export function getNextSimpleSequenceNumber(
  dir: string,
  prefix: string,
  idField: string
): string {
  let maxSeq = 0;

  if (!fs.existsSync(dir)) return '000001';

  const entries = fs.readdirSync(dir);
  entries.forEach(entry => {
    if (entry === 'TEMPLATE.json') return;

    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    let jsonPath: string | null = null;
    if (stat.isDirectory()) {
      // Try common artifact filenames
      for (const name of ['task.json', 'action.json', 'memory.json', 'spec.json', 'mistake.json', 'risk.json', 'decision.json']) {
        const candidate = path.join(fullPath, name);
        if (fs.existsSync(candidate)) { jsonPath = candidate; break; }
      }
    } else if (entry.endsWith('.json')) {
      jsonPath = fullPath;
    }

    if (!jsonPath) return;
    try {
      const content = fs.readJsonSync(jsonPath);
      const id: string | undefined = content[idField] ?? content.id;
      if (id && id.startsWith(prefix + '-')) {
        const seqPart = id.split('-').pop();
        const seq = parseInt(seqPart ?? '', 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    } catch { /* skip */ }
  });

  return String(maxSeq + 1).padStart(6, '0');
}

/**
 * Get artifact files from a directory (per-folder structure only)
 */
export function getArtifactFiles(dir: string, filename: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const result: string[] = [];
  const entries = fs.readdirSync(dir);

  entries.forEach(entry => {
    if (entry === 'TEMPLATE.json') return;
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      const nested = path.join(fullPath, filename);
      if (fs.existsSync(nested)) result.push(nested);
    } else if (entry.endsWith('.json')) {
      result.push(fullPath);
    }
  });

  return result;
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
