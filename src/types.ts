export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LifecycleState = 'draft' | 'proposed' | 'accepted' | 'rejected' | 'superseded';
export type PolicyDecision = 'ALLOW' | 'DENY' | 'STEP_UP';

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
    // v1.x additions
    specs?: string;
    mistakes?: string;
    // v2.0 runtime governance
    tasks?: string;
    actions?: string;
    memories?: string;
  };
  validation: {
    mode: 'warn' | 'fail';
  };
  // v2.0 runtime governance
  runtime?: {
    enabled: boolean;
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

// ── v1.x additions ─────────────────────────────────────────────────────────

export interface SpecRecord {
  schema: 'provenancecode.spec.v1';
  id: string;
  title: string;
  status: 'draft' | 'review' | 'approved';
  risk: RiskLevel;
  acceptanceCriteria: string[];
  affectedPaths: string[];
  relatedDecisions?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MistakeRecord {
  schema: 'provenancecode.mistake.v1' | 'provenancecode.mistake@1.0';
  mr_id: string;
  title: string;
  status: 'open' | 'resolved' | 'wont_fix' | 'duplicate';
  severity: RiskLevel;
  failure_type: string;
  root_cause: string;
  trigger: string;
  impact: string;
  fix: { description: string; pr_url?: string };
  prevent_rule: { rule_id: string; statement: string; enforcement?: string };
  links?: { decisions?: string[]; risks?: string[] };
  created_at?: string;
}

// ── v2.0 runtime governance ─────────────────────────────────────────────────

export interface TapRecord {
  schema: 'provenancecode.tap.v1';
  id: string;
  title: string;
  version: number;
  lifecycle: { state: 'in_progress' | 'completed' | 'blocked' | 'failed' | 'superseded' };
  timestamps: { started_at: string; ended_at: string | null; attested_at?: string | null };
  runtime: { agent: string; model: string; session_id?: string | null };
  git: { branch: string; commit_sha: string; repo?: string; changed_files?: string[] };
  actors: { agent: string; model: string; human_reviewer?: string | null };
  task: { outcome: 'succeeded' | 'failed' | 'blocked' | 'partial'; description?: string; summary?: string };
  risk: { needs_human_review: boolean; level?: RiskLevel; open_risks?: number; high_or_critical_open?: number };
  enforcement: { validated: boolean; validator?: string | null; errors?: string[]; preset?: string };
  links?: {
    decisions?: string[]; risks?: string[]; actions?: string[];
    memories_read?: string[]; memories_written?: string[]; specs?: string[];
    prior_task?: string | null; parent_task?: string | null;
  };
}

export interface ActRecord {
  schema: 'provenancecode.act.v1';
  id: string;
  title: string;
  version: number;
  lifecycle: { state: string };
  timestamps: { requested_at: string; decided_at: string };
  actors: { agent: string };
  action: { type: string; resource: string };
  policy: { decision: PolicyDecision; policy_hash: string };
  approval: { required: boolean; status: string };
  execution: { status: string };
  links: { task: string };
}

export interface MeoRecord {
  schema: 'provenancecode.meo.v1';
  id: string;
  title: string;
  version: number;
  subtype: 'working' | 'dream';
  lifecycle: { state: string };
  timestamps: { created_at: string; consolidated_at?: string | null };
  runtime: { agent: string };
  scope: { domain: string };
  content: { summary: string; confidence: 'high' | 'medium' | 'low' | 'speculative'; key_facts?: string[] };
  provenance: { source: 'task' | 'dream' | 'manual'; source_quality: 'human-reviewed' | 'agent-observed' | 'agent-synthesised' | 'human-authored' };
  links?: { written_by_task?: string | null };
  // Required when subtype === 'dream' (enforced by JSON Schema if/then)
  consolidation?: { inputs: { tasks: string[] }; synthesis_method: 'agent-reflection' | 'structured-summarisation' | 'llm-distillation' };
}

export interface InitOptions {
  standard?: string;
  appCode?: string;
  area?: string;
  ai?: string[];
  ci?: string;
  ciMode?: 'warn' | 'fail';
  force?: boolean;
  runtime?: boolean;
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
