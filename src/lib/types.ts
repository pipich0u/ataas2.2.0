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
