export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LifecycleState = 'draft' | 'proposed' | 'accepted' | 'rejected' | 'superseded';

export interface ProvenanceConfig {
  standard: string;
  version: string;
  // DEO v1.0 id_format (preferred)
  id_format?: {
    style: 'hierarchical' | 'legacy';
    project?: string;
    subproject?: string;
    require_subproject?: boolean;
  };
  // Legacy keys — read for backward compat, do not write
  idScheme?: string;
  riskIdScheme?: string;
  defaultAppCode?: string;
  defaultArea?: string;
  paths: {
    root: string;
    decisions: string;
    risks: string;
    schemas: string;
  };
  validation: {
    mode: 'warn' | 'fail';
  };
}

export interface DecisionRecord {
  schema: 'provenancecode.decision.v1';
  id: string;
  title: string;
  version: number;
  lifecycle: {
    state: LifecycleState;
    supersedes?: string | null;
    superseded_by?: string | null;
  };
  timestamps: {
    created_at: string;
    accepted_at?: string | null;
    updated_at?: string | null;
    expires_at?: string | null;
  };
  actors: {
    author: string;
    approver?: string;
    bot?: string;
    reviewers?: string[];
  };
  outcome: string;
  rationale: string;
  risk: {
    level: RiskLevel;
    description?: string;
    acceptance?: string;
    mitigations?: string[];
  };
  // Optional fields
  problem?: string;
  options?: string[];
  consequences?: string;
  context?: {
    jira_key?: string;
    repo?: string;
    component?: string;
    links?: string[];
  };
  scope?: string[];
  tags?: string[];
  links?: {
    pr?: string[];
    issues?: string[];
    specs?: string[];
    decisions?: string[];
    risks?: string[];
  };
  integrity?: {
    receipt_path?: string;
    commit_sha?: string;
    prov_path?: string;
  };
  attestations?: Array<{ type: string; manifest_path?: string }>;
  metadata?: Record<string, unknown>;
}

export interface RiskRecord {
  schema: string;
  risk_id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'monitoring' | 'mitigated' | 'accepted' | 'closed';
  linked_decisions?: string[];
  mitigation?: string;
  impact?: string;
  probability?: 'low' | 'medium' | 'high';
  date_created?: string;
  date_updated?: string;
  owner?: string;
  tags?: string[];
}

export interface InitOptions {
  standard?: string;
  appCode?: string;
  area?: string;
  ai?: string[];
  ci?: string;
  ciMode?: 'warn' | 'fail';
  force?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    file: string;
    message: string;
    details?: any;
  }>;
  warnings: Array<{
    file: string;
    message: string;
  }>;
}
