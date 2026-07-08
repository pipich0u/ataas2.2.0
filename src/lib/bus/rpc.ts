import type {
  TaskSnapshot,
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
  repo['resources/glm-5.2/service.yaml'] = makeFile(
    'resources/glm-5.2/service.yaml',
    `apiVersion: v1
kind: Service
metadata:
  labels:
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: glm51-router-0
    rolebasedgroup.workloads.x-k8s.io/role: router
  name: glm51-router-0
  namespace: default
spec:
  clusterIP: 10.43.219.154
  clusterIPs:
  - 10.43.219.154
  internalTrafficPolicy: Cluster
  ipFamilies:
  - IPv4
  ipFamilyPolicy: SingleStack
  ports:
  - name: http
    port: 30002
    protocol: TCP
    targetPort: 30002
  - name: metrics
    port: 9090
    protocol: TCP
    targetPort: 29000
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: glm51-router-0
    rolebasedgroup.workloads.x-k8s.io/role: router
  sessionAffinity: None
  type: ClusterIP
`,
    nowMinus(0, 1),
  );
  repo['resources/glm-5.2/service-entry.yaml'] = makeFile(
    'resources/glm-5.2/service-entry.yaml',
    `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: glm-5.2
  namespace: higress-system
spec:
  endpoints:
  - address: glm51-router-0.default.svc.cluster.local
    weight: 24
  - address: glm51-router-1.default.svc.cluster.local
    weight: 40
  - address: glm51-router-2.default.svc.cluster.local
    weight: 35
  hosts:
  - glm-5.2-cluster.local
  location: MESH_INTERNAL
  ports:
  - name: http
    number: 30002
    protocol: HTTP
  resolution: DNS
`,
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

const taskStorageKey = 'ataas.mock.b300.tasks.v1';

const defaultTasks = (): TaskSnapshot[] => [
  {
    id: 'wf-20260702-001',
    type: 'workflow',
    status: 'awaiting',
    created_at: '2026-07-02T21:42:18+08:00',
    cluster: 'beijing-prod',
    exec_user: 'admin',
    awaiting_step: 3,
    awaiting_nonce: 'nonce-glm51-003',
    meta: { name: 'GLM-5.1 新增模型服务', model: 'glm-5.1', group_index: '1', exec_user: 'admin' },
    steps: [
      { name: '生成 Router / Worker YAML', status: 'done', detail: '已从资源文件读取模板并注入变量' },
      { name: '创建 RBG 与 Service', status: 'done', detail: 'router service: glm51-router-1' },
      { name: '等待 Pods Ready', status: 'running', detail: 'prefill 3/4 · decode 1/1' },
      { name: '确认接入 ServiceEntry', status: 'pending', preview: { description: '将 glm51-router-1 加入 glm51-service-entry endpoint 列表' } },
      { name: 'Smoke test', status: 'pending' },
    ],
  },
  {
    id: 'wf-20260702-002',
    type: 'workflow',
    status: 'running',
    created_at: '2026-07-02T20:58:44+08:00',
    cluster: 'shanghai-online',
    exec_user: 'ops',
    meta: { name: 'h20-router-2 摘流降权', model: 'h20', group_index: '2', exec_user: 'ops' },
    steps: [
      { name: '读取当前 SE 权重', status: 'done', detail: '当前总和 100' },
      { name: '分阶段降低权重', status: 'running', detail: '当前 40% -> 20%' },
      { name: '等待请求排空', status: 'pending' },
      { name: '移除 Endpoint', status: 'pending' },
    ],
  },
  {
    id: 'task-20260702-003',
    type: 'sync-config',
    status: 'failed',
    created_at: '2026-07-02T19:21:02+08:00',
    finished_at: '2026-07-02T19:23:40+08:00',
    cluster: 'guangzhou-test',
    exec_user: 'admin',
    error: 'apply service entry timeout',
    meta: { name: '同步资源文件到集群', file: 'glm/bx_config/router-glm51.yaml', exec_user: 'admin' },
    steps: [
      { name: '拉取最新资源文件', status: 'done' },
      { name: '解析 YAML', status: 'done' },
      { name: '提交到 apiserver', status: 'error', detail: 'context deadline exceeded' },
    ],
  },
  {
    id: 'wf-20260701-014',
    type: 'workflow',
    status: 'done',
    created_at: '2026-07-01T23:16:31+08:00',
    finished_at: '2026-07-01T23:31:12+08:00',
    cluster: 'wuhan-kunpeng',
    exec_user: 'wjh',
    meta: { name: 'kp-router-1 扩容 Worker', model: 'kp', group_index: '1', exec_user: 'wjh' },
    steps: [
      { name: '选择节点', status: 'done', detail: '已选择 3 个节点' },
      { name: '更新 RBG replicas', status: 'done' },
      { name: '等待 Pods Ready', status: 'done' },
      { name: '回写资源文件', status: 'done' },
    ],
  },
  {
    id: 'wf-20260701-009',
    type: 'workflow',
    status: 'interrupted',
    created_at: '2026-07-01T18:04:09+08:00',
    cluster: 'beijing-prod',
    exec_user: 'system',
    meta: { name: 'deepseek-r1 服务滚动迁移', model: 'deepseek-r1', group_index: '4', exec_user: 'system' },
    steps: [
      { name: '创建新实例', status: 'done' },
      { name: '迁移 40% 权重', status: 'done' },
      { name: '等待健康检查', status: 'running', detail: '控制台重启后等待恢复' },
      { name: '继续迁移', status: 'pending' },
    ],
  },
  {
    id: 'task-20260701-006',
    type: 'pod-offline',
    status: 'aborted',
    created_at: '2026-07-01T16:18:33+08:00',
    finished_at: '2026-07-01T16:19:10+08:00',
    cluster: 'shanghai-online',
    exec_user: 'ops',
    meta: { name: '业务 POD 下线', pod: 'business-api-pod-2', exec_user: 'ops' },
    steps: [
      { name: '校验 SVC 关联', status: 'done' },
      { name: '排空请求', status: 'skipped', detail: '人工终止' },
      { name: '删除 POD', status: 'pending' },
    ],
  },
];

function loadTasks(): TaskSnapshot[] {
  try {
    const raw = localStorage.getItem(taskStorageKey);
    if (raw) return JSON.parse(raw) as TaskSnapshot[];
  } catch {
    // noop
  }
  return defaultTasks();
}

function saveTasks(tasks: TaskSnapshot[]) {
  try {
    localStorage.setItem(taskStorageKey, JSON.stringify(tasks));
  } catch {
    // noop
  }
}

let mockTasks = loadTasks();

export function getMockTaskSnapshot(taskId: string) {
  return mockTasks.find((task) => task.id === taskId) ?? null;
}

function updateTask(taskId: string, updater: (task: TaskSnapshot) => TaskSnapshot) {
  mockTasks = mockTasks.map((task) => task.id === taskId ? updater(task) : task);
  saveTasks(mockTasks);
}

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

export async function rpc(method: string, params?: any, body?: any): Promise<any> {
  await new Promise((resolve) => window.setTimeout(resolve, 80));

  if (method === 'task.list') {
    const page = Number(params?.page || 1);
    const pageSize = Number(params?.page_size || 10);
    const sorted = [...mockTasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return {
      tasks: sorted.slice((page - 1) * pageSize, page * pageSize),
      total: sorted.length,
    };
  }

  if (method === 'task.resume') {
    const taskId = params?.id;
    updateTask(taskId, (task) => ({
      ...task,
      status: 'running',
      error: undefined,
      finished_at: undefined,
      steps: task.steps.map((step) => step.status === 'error' ? { ...step, status: 'running', detail: 'resumed' } : step),
    }));
    return { status: 'running' };
  }

  if (method === 'workflow.confirm') {
    const request = body ?? params;
    const taskId = request?.task_id;
    const stepIndex = Number(request?.step ?? -1);
    updateTask(taskId, (task) => ({
      ...task,
      status: 'running',
      awaiting_step: undefined,
      awaiting_nonce: undefined,
      steps: task.steps.map((step, index) => index === stepIndex ? { ...step, status: 'running', detail: 'confirmed' } : step),
    }));
    return { status: 'running' };
  }

  if (method === 'workflow.abort') {
    const request = body ?? params;
    const taskId = request?.task_id;
    updateTask(taskId, (task) => ({
      ...task,
      status: 'aborted',
      finished_at: new Date().toISOString(),
      steps: task.steps.map((step) => step.status === 'running' ? { ...step, status: 'skipped', detail: 'aborted' } : step),
    }));
    return { status: 'aborted' };
  }

  if (method === 'workflow.skip_step') {
    const request = body ?? params;
    const taskId = request?.task_id;
    const stepIndex = Number(request?.step ?? -1);
    updateTask(taskId, (task) => ({
      ...task,
      status: 'running',
      awaiting_step: undefined,
      awaiting_nonce: undefined,
      steps: task.steps.map((step, index) => index === stepIndex ? { ...step, status: 'skipped', detail: 'skipped' } : step),
    }));
    return { status: 'running' };
  }

  if (method === 'workflow.execute') {
    const request = body ?? params;
    const taskId = `wf-${Date.now()}`;
    const rawSteps = Array.isArray(request?.steps) ? request.steps : [];
    const steps = rawSteps.length > 0
      ? rawSteps.map((step: any, index: number) => ({
        name: step?.name || step?.rpc || `step-${index + 1}`,
        status: index === 0 ? 'running' : 'pending',
        detail: step?.rpc,
        preview: { description: step?.rpc ? `preview: ${step.rpc}` : undefined },
      }))
      : [{ name: 'Execute workflow', status: 'running', detail: 'mock workflow started' }];
    const task: TaskSnapshot = {
      id: taskId,
      type: 'workflow',
      status: request?.confirm_each_step ? 'awaiting' : 'running',
      created_at: new Date().toISOString(),
      cluster: String(params || 'beijing-prod'),
      exec_user: 'admin',
      awaiting_step: request?.confirm_each_step ? 0 : undefined,
      awaiting_nonce: request?.confirm_each_step ? `nonce-${taskId}` : undefined,
      meta: { name: request?.name || 'Workflow', exec_user: 'admin' },
      params: request?.variables || {},
      steps,
    };
    mockTasks = [task, ...mockTasks];
    saveTasks(mockTasks);
    return { task_id: taskId };
  }

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
