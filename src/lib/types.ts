export type TaskStepStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';
export type PlanStatus = 'running' | 'awaiting' | 'done' | 'failed' | 'aborted' | 'interrupted';

export interface StepPreview {
  before_yaml?: string;
  after_yaml?: string;
  resource_version?: string;
  description?: string;
  resolved_params?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  previewed_at?: string;
}

export interface TaskStep {
  name: string;
  status: TaskStepStatus;
  detail?: string;
  started_at?: string;
  finished_at?: string;
  preview?: StepPreview;
  result?: unknown;
  error?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  skipped_by?: string;
  skipped_at?: string;
}

export interface TaskSnapshot {
  id: string;
  type: string;
  status: PlanStatus;
  steps: TaskStep[];
  error?: string;
  created_at: string;
  finished_at?: string;
  meta?: Record<string, string>;
  params?: Record<string, unknown>;
  awaiting_step?: number;
  awaiting_nonce?: string;
  exec_user?: string;
  exec_readonly?: boolean;
  confirm_each_step?: boolean;
  aborted_by?: string;
  aborted_at?: string;
  cluster: string;
}

export interface TaskCreateResponse {
  task_id: string;
}

export interface ConfigTreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  size?: number;
  modified_ms?: number;
  children?: ConfigTreeNode[];
}

export interface ConfigListTreeResponse {
  root: ConfigTreeNode;
}

export interface ConfigGetResponse {
  path: string;
  yaml: string;
  exists: boolean;
}

export interface ConfigCommitWrite {
  path: string;
  yaml: string;
}

export interface ConfigCommitResponse {
  commit_hash?: string;
  written_paths: string[];
  deleted_paths: string[];
  no_change?: boolean;
}

export interface ConfigCommitEntry {
  hash: string;
  message: string;
  author: string;
  ts_ms: number;
}

export interface ConfigHistoryResponse {
  path: string;
  commits: ConfigCommitEntry[];
}

export interface ConfigShowCommitResponse {
  hash: string;
  parent_hash?: string;
  yaml: string;
  parent_yaml: string;
  diff: string;
}
