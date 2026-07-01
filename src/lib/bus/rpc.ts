import type {
  ConfigCommitEntry,
  ConfigCommitResponse,
  ConfigGetResponse,
  ConfigHistoryResponse,
  ConfigListTreeResponse,
  ConfigShowCommitResponse,
  ConfigTreeNode,
} from '@/lib/types';
import workersGlm51CacheLayerSplitYaml from '@/lib/mock-configs/workers-glm51-index-cache-layer-split.yaml?raw';

type ConfigFile = {
  yaml: string;
  modified_ms: number;
  history: Array<ConfigCommitEntry & { yaml: string; parent_yaml: string }>;
};

const STORAGE_KEY = 'ataas.mock.configs.repo.v1';
const WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH = 'glm/bx_config/workers-glm51-index-cache-layer-split.yaml';

function nowMinus(days: number, hours = 0) {
  return Date.now() - (days * 24 + hours) * 60 * 60 * 1000;
}

function yamlFor(path: string, kind: 'devpod' | 'router' | 'workers') {
  if (kind === 'devpod') {
    const name = path.split('/').pop()?.replace(/\.yaml$/, '') || 'devpod';
    return `apiVersion: devpod.io/v1alpha1
kind: DevPod
metadata:
  name: \${NAME}
  namespace: devpods
spec:
  owner: \${OWNER}
  pod:
    spec:
      containers:
        - command:
            - sleep
            - infinity
          image: reg.ktaas.approaching-ai.com:4430/dockerhub/debian:trixie
          imagePullPolicy: IfNotPresent
          name: ${name}
          volumeMounts:
            - mountPath: /mnt
              name: mnt
      dnsPolicy: ClusterFirstWithHostNet
      hostNetwork: true
      nodeSelector:
        kubernetes.io/hostname: \${NODE}
      volumes:
        - hostPath:
            path: /mnt
            type: DirectoryOrCreate
          name: mnt
  running: true
  shell: zsh
`;
  }
  const model = path.includes('kimi') ? 'kimi' : path.includes('qwen') ? 'qwen' : 'glm51';
  if (kind === 'router') {
    return `apiVersion: workloads.x-k8s.io/v1alpha1
kind: RoleBasedGroup
metadata:
  name: ${model}-router-\${INDEX}
  namespace: default
spec:
  roles:
    - minReadySeconds: 0
      name: router
      replicas: \${ROUTER_REPLICAS}
      template:
        metadata:
          labels:
            rolebasedgroup.workloads.x-k8s.io/name: ${model}-router-\${INDEX}
            rolebasedgroup.workloads.x-k8s.io/role: router
        spec:
          containers:
            - command:
                - sh
                - '-c'
                - |
                  ulimit -n 1048576
                  ulimit -l unlimited
                  python3 -m sglang_router.launch_router \\
                    --pd-disaggregation \\
                    --service-discovery \\
                    --service-discovery-namespace default \\
                    --service-discovery-port 8000 \\
                    --prefill-selector rolebasedgroup.workloads.x-k8s.io/name=${model}-workers-\${INDEX},rolebasedgroup.workloads.x-k8s.io/role=prefill\\
                    --decode-selector rolebasedgroup.workloads.x-k8s.io/name=${model}-workers-\${INDEX},rolebasedgroup.workloads.x-k8s.io/role=decode\\
                    --host 0.0.0.0 \\
                    --request-timeout-secs 3600
              image: reg.ktaas.approaching-ai.com:4430/sglang/router:latest
              name: router
`;
  }
  return `apiVersion: workloads.x-k8s.io/v1alpha1
kind: RoleBasedGroup
metadata:
  name: ${model}-workers-\${INDEX}
  namespace: default
spec:
  roles:
    - name: prefill
      replicas: \${PREFILL_REPLICAS}
      template:
        spec:
          containers:
            - image: reg.ktaas.approaching-ai.com:4430/sglang:v0.5.10_${model}
              name: prefill
    - name: decode
      replicas: \${DECODE_REPLICAS}
      template:
        spec:
          containers:
            - image: reg.ktaas.approaching-ai.com:4430/sglang:v0.5.10_${model}
              name: decode
`;
}

function makeFile(path: string, yaml: string, modified_ms: number): ConfigFile {
  return {
    yaml,
    modified_ms,
    history: [
      {
        hash: 'a8bbd13f4e92',
        message: 'b300-web-console',
        author: 'admin',
        ts_ms: modified_ms,
        yaml,
        parent_yaml: yaml.replace('replicas: ${ROUTER_REPLICAS}', 'replicas: 1'),
      },
      {
        hash: 'd78bf34aa10c',
        message: 'initial config',
        author: 'admin',
        ts_ms: modified_ms - 18 * 24 * 60 * 60 * 1000,
        yaml: yaml.replace('imagePullPolicy: IfNotPresent', 'imagePullPolicy: Always'),
        parent_yaml: '',
      },
    ],
  };
}

function defaultRepo(): Record<string, ConfigFile> {
  const files: Array<[string, 'devpod' | 'router' | 'workers', number, number?]> = [
    ['devpod/codeserver.yaml', 'devpod', 46, 21],
    ['devpod/deb13.yaml', 'devpod', 46, 23],
    ['devpod/djw-smg.yaml', 'devpod', 30, 14],
    ['devpod/djw.yaml', 'devpod', 38, 9],
    ['devpod/hyc.yaml', 'devpod', 35, 8],
    ['devpod/mooncake.yaml', 'devpod', 31, 20],
    ['devpod/oql-smg.yaml', 'devpod', 30, 17],
    ['devpod/sglang.yaml', 'devpod', 45, 11],
    ['devpod/tokenspeed-cht.yaml', 'devpod', 29, 9],
    ['devpod/ubuntu2404.yaml', 'devpod', 46, 23],
    ['devpod/vncserver.yaml', 'devpod', 23, 8],
    ['devpod/yuechen-te.yaml', 'devpod', 2, 18],
    ['devpod/zxh-kimi.yaml', 'devpod', 26, 17],
    ['glm/bx_config/router-oql-202606.yaml', 'router', 0, 13],
    ['glm/bx_config/router-oql-no-load.yaml', 'router', 1, 9],
    ['glm/bx_config/router-wjh.yaml', 'router', 2, 11],
    ['glm/bx_config/router.yaml', 'router', 44, 7],
    ['glm/bx_config/workers-glm51-index.yaml', 'workers', 2, 14],
    ['glm/bx_config/workers-glm52-oql.yaml', 'workers', 2, 14],
    ['glm/bx_config/workers-glm52-tzh.yaml', 'workers', 2, 14],
    ['glm/bx_config/workers-glm52-yuechen.yaml', 'workers', 2, 14],
    ['glm/bx_config/workers-old.yaml', 'workers', 21, 14],
    ['kimi/yc_config/router-kimi.yaml', 'router', 7, 4],
    ['kimi/yc_config/workers-kimi.yaml', 'workers', 7, 4],
    ['qwen/prod/router-qwen.yaml', 'router', 11, 2],
    ['qwen/prod/workers-qwen.yaml', 'workers', 11, 2],
  ];
  const repo = Object.fromEntries(files.map(([path, kind, days, hours]) => [
    path,
    makeFile(path, yamlFor(path, kind), nowMinus(days, hours)),
  ]));
  repo[WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH] = makeFile(
    WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH,
    workersGlm51CacheLayerSplitYaml,
    nowMinus(0, 1),
  );
  return repo;
}

function normalizeHistoryAuthors(repo: Record<string, ConfigFile>) {
  for (const file of Object.values(repo)) {
    file.history = file.history.map((entry) => ({ ...entry, author: 'admin' }));
  }
  return repo;
}

function ensureBuiltInFiles(repo: Record<string, ConfigFile>) {
  normalizeHistoryAuthors(repo);
  if (!repo[WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH]) {
    repo[WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH] = makeFile(
      WORKERS_GLM51_CACHE_LAYER_SPLIT_PATH,
      workersGlm51CacheLayerSplitYaml,
      nowMinus(0, 1),
    );
    saveRepo(repo);
  }
  return repo;
}

function loadRepo(): Record<string, ConfigFile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return ensureBuiltInFiles(JSON.parse(raw) as Record<string, ConfigFile>);
  } catch {
    // noop
  }
  return ensureBuiltInFiles(defaultRepo());
}

function saveRepo(repo: Record<string, ConfigFile>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repo));
  } catch {
    // noop
  }
}

let repo = loadRepo();

function buildTree(): ConfigTreeNode {
  const root: ConfigTreeNode = { name: '', path: '', is_dir: true, children: [] };
  for (const [path, file] of Object.entries(repo)) {
    const parts = path.split('/');
    let cursor = root;
    parts.forEach((part, index) => {
      const childPath = parts.slice(0, index + 1).join('/');
      const isFile = index === parts.length - 1;
      cursor.children ||= [];
      let child = cursor.children.find((item) => item.name === part);
      if (!child) {
        child = { name: part, path: childPath, is_dir: !isFile, children: isFile ? undefined : [] };
        cursor.children.push(child);
      }
      if (isFile) {
        child.size = new TextEncoder().encode(file.yaml).length;
        child.modified_ms = file.modified_ms;
      }
      cursor = child;
    });
  }
  const sort = (node: ConfigTreeNode) => {
    node.children?.sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name));
    node.children?.forEach(sort);
  };
  sort(root);
  return root;
}

function unifiedDiff(parent: string, current: string) {
  return `--- parent
+++ current
${parent === current ? ' unchanged' : current.split('\n').slice(0, 80).map((line) => `+${line}`).join('\n')}`;
}

export async function rpc(method: string, params?: any): Promise<any> {
  await new Promise((resolve) => window.setTimeout(resolve, 80));

  if (method === 'config.list_tree') {
    return { root: buildTree() } satisfies ConfigListTreeResponse;
  }

  if (method === 'config.get') {
    const path = params?.path;
    const file = repo[path];
    return {
      path,
      yaml: file?.yaml ?? '',
      exists: Boolean(file),
    } satisfies ConfigGetResponse;
  }

  if (method === 'config.history') {
    const path = params?.path;
    return {
      path,
      commits: repo[path]?.history.map(({ yaml: _yaml, parent_yaml: _parent, ...entry }) => entry) ?? [],
    } satisfies ConfigHistoryResponse;
  }

  if (method === 'config.show_commit') {
    const path = params?.path;
    const hash = params?.hash;
    const entry = repo[path]?.history.find((item) => item.hash === hash) ?? repo[path]?.history[0];
    if (!entry) throw new Error('commit not found');
    return {
      hash: entry.hash,
      parent_hash: repo[path]?.history[1]?.hash,
      yaml: entry.yaml,
      parent_yaml: entry.parent_yaml,
      diff: unifiedDiff(entry.parent_yaml, entry.yaml),
    } satisfies ConfigShowCommitResponse;
  }

  if (method === 'config.commit') {
    const writes: Array<{ path: string; yaml?: string; content?: string }> = params?.writes
      ?? (params?.path ? [{ path: params.path, yaml: params.content }] : []);
    const deletes: string[] = params?.deletes ?? [];
    if (writes.length === 0 && deletes.length === 0) {
      return { no_change: true, written_paths: [], deleted_paths: [] } satisfies ConfigCommitResponse;
    }
    const hash = Math.random().toString(16).slice(2, 14);
    const ts_ms = Date.now();
    for (const write of writes) {
      const yaml = write.yaml ?? write.content ?? '';
      const old = repo[write.path]?.yaml ?? '';
      repo[write.path] = {
        yaml,
        modified_ms: ts_ms,
        history: [
          { hash, message: params?.message ?? 'update config', author: 'local', ts_ms, yaml, parent_yaml: old },
          ...(repo[write.path]?.history ?? []),
        ],
      };
    }
    for (const path of deletes) delete repo[path];
    saveRepo(repo);
    return {
      commit_hash: hash,
      written_paths: writes.map((write) => write.path),
      deleted_paths: deletes,
    } satisfies ConfigCommitResponse;
  }

  throw new Error(`Unsupported mock rpc method: ${method}`);
}
