export interface ProvenanceConfig {
  standard: string;
  version: string;
  idScheme: string;
  riskIdScheme: string;
  defaultAppCode: string;
  defaultArea: string;
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
  schema: string;
  decision_id: string;
  title: string;
  status: 'draft' | 'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  consequences?: string;
  risk?: string;
  links?: Array<{
    type: 'pr' | 'issue' | 'doc' | 'decision' | 'risk' | 'other';
    url: string;
    title?: string;
  }>;
  date_created?: string;
  date_updated?: string;
  authors?: string[];
  tags?: string[];
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

