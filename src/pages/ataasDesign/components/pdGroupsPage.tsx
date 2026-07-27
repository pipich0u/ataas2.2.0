import {
  CopyOutlined,
  DisconnectOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  ConfigProvider,
  Drawer,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tabs,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MonacoEditor } from '../../../components/shared/MonacoEditor';

type PdRoleName = 'router' | 'prefill' | 'decode';
type PdPodRole = PdRoleName | 'store' | 'master' | 'etcd';
type GroupStatus = '正常' | '需关注' | '更新中' | '已摘流';
type TrafficState = 'serving' | 'drained';
type GroupYamlFileKey = 'router' | 'workers';

type PdPod = {
  key: string;
  role: PdPodRole;
  category: 'inference' | 'dependency';
  name: string;
  node: string;
  podIP: string;
  ready: boolean;
  readyLabel: string;
  status: 'Running' | 'Pending';
  restarts: number;
};

type PdRole = {
  role: PdRoleName;
  resourceName: string;
  ready: number;
  desired: number;
  nodes: string[];
  config: Array<{ label: string; value: string }>;
};

type PdGroup = {
  key: string;
  clusterKey: string;
  clusterAlias: string;
  clusterName: string;
  name: string;
  model: string;
  namespace: string;
  routerRbg: string;
  workersRbg: string;
  status: GroupStatus;
  trafficState: TrafficState;
  updatedAt: string;
  roles: Record<PdRoleName, PdRole>;
  pods: PdPod[];
  exposure: {
    seName: string;
    host: string;
    port: string;
    protocol: string;
    routerService: string;
    policy: string;
  };
};

const roleLabels: Record<PdPodRole, string> = {
  router: 'ROUTER',
  prefill: 'PREFILL',
  decode: 'DECODE',
  store: 'STORE',
  master: 'MASTER',
  etcd: 'ETCD',
};

const createRole = (
  role: PdRoleName,
  resourceName: string,
  ready: number,
  desired: number,
  nodes: string[],
  config: PdRole['config'],
): PdRole => ({ role, resourceName, ready, desired, nodes, config });

const createPods = (
  groupKey: string,
  role: PdRoleName,
  nodes: string[],
  ready: number,
): PdPod[] => nodes.map((node, index) => ({
  key: `${groupKey}-${role}-${index}`,
  role,
  category: 'inference',
  name: `${groupKey}-${role}-${index}`,
  node,
  podIP: `10.25.${role === 'router' ? 18 : role === 'prefill' ? 32 : 46}.${30 + index}`,
  ready: index < ready,
  readyLabel: index < ready ? '1/1' : '0/1',
  status: index < ready ? 'Running' : 'Pending',
  restarts: index === 0 && role === 'decode' ? 1 : 0,
}));

const createDependencyPods = (
  groupKey: string,
  clusterAlias: string,
): PdPod[] => {
  const createInfrastructureRole = (
    role: Extract<PdPodRole, 'store' | 'master' | 'etcd'>,
    count: number,
  ) => Array.from({ length: count }, (_, index): PdPod => ({
    key: `${groupKey}-mooncake-${role}-${index}`,
    role,
    category: 'dependency',
    name: `${groupKey}-mooncake-${role}-${index}`,
    node: `${clusterAlias}-${role}-${String(index + 1).padStart(2, '0')}`,
    podIP: `10.26.${role === 'store' ? 52 : role === 'master' ? 62 : 72}.${30 + index}`,
    ready: true,
    readyLabel: role === 'store' ? '2/2' : '1/1',
    status: 'Running',
    restarts: role === 'store' && index === 0 ? 1 : 0,
  }));

  return [
    ...createInfrastructureRole('store', 5),
    ...createInfrastructureRole('master', 3),
    ...createInfrastructureRole('etcd', 3),
  ];
};

const createGroup = ({
  key,
  clusterKey,
  clusterAlias,
  clusterName,
  name,
  model,
  namespace,
  counts,
  nodes,
  status = '正常',
  trafficState = 'serving',
}: {
  key: string;
  clusterKey: string;
  clusterAlias: string;
  clusterName: string;
  name: string;
  model: string;
  namespace: string;
  counts: Record<PdRoleName, [number, number]>;
  nodes: Record<PdRoleName, string[]>;
  status?: GroupStatus;
  trafficState?: TrafficState;
}): PdGroup => {
  const groupOrdinal = name.split('_').slice(-1)[0];
  const routerRbg = `${model.toLowerCase()}-router-${groupOrdinal}`;
  const workersRbg = `${model.toLowerCase()}-workers-${groupOrdinal}`;
  const roles = {
    router: createRole('router', routerRbg, ...counts.router, nodes.router, [
      { label: '镜像', value: 'router-runtime:v2.8.1' },
      { label: 'CPU / 内存', value: '8 Core / 16 GiB' },
      { label: '调度策略', value: 'spread-by-node' },
    ]),
    prefill: createRole('prefill', `${workersRbg}-prefill`, ...counts.prefill, nodes.prefill, [
      { label: '镜像', value: 'pd-worker:v5.1.4' },
      { label: 'GPU / Pod', value: '1 × B300' },
      { label: '并行策略', value: 'TP=8, PP=1' },
    ]),
    decode: createRole('decode', `${workersRbg}-decode`, ...counts.decode, nodes.decode, [
      { label: '镜像', value: 'pd-worker:v5.1.4' },
      { label: 'GPU / Pod', value: '1 × B300' },
      { label: '并行策略', value: 'TP=4, PP=1' },
    ]),
  };
  return {
    key,
    clusterKey,
    clusterAlias,
    clusterName,
    name,
    model,
    namespace,
    routerRbg,
    workersRbg,
    status,
    trafficState,
    updatedAt: '2026-07-27 14:32',
    roles,
    pods: [
      ...createPods(key, 'router', nodes.router, counts.router[0]),
      ...createPods(key, 'prefill', nodes.prefill, counts.prefill[0]),
      ...createPods(key, 'decode', nodes.decode, counts.decode[0]),
      ...createDependencyPods(key, clusterAlias),
    ],
    exposure: {
      seName: `${name.replace('_', '-')}-serving-se`,
      host: `${name.replace('_', '-')}.${namespace}.model.internal`,
      port: '8000',
      protocol: 'HTTP',
      routerService: `${routerRbg}.${namespace}.svc.cluster.local`,
      policy: 'ROUND_ROBIN',
    },
  };
};

const initialGroups: PdGroup[] = [
  createGroup({
    key: 'glm51-1-st',
    clusterKey: 'shanghai-online',
    clusterAlias: 'st',
    clusterName: 'shanghai-online',
    name: 'glm51_1',
    model: 'GLM-5.1',
    namespace: 'model-serving',
    counts: { router: [1, 1], prefill: [8, 8], decode: [3, 3] },
    nodes: {
      router: ['st-router-01'],
      prefill: ['st-b300-11', 'st-b300-12', 'st-b300-13', 'st-b300-14', 'st-b300-15', 'st-b300-16', 'st-b300-17', 'st-b300-18'],
      decode: ['st-b300-21', 'st-b300-22', 'st-b300-23'],
    },
  }),
  createGroup({
    key: 'glm51-3-st',
    clusterKey: 'shanghai-online',
    clusterAlias: 'st',
    clusterName: 'shanghai-online',
    name: 'glm51_3',
    model: 'GLM-5.1',
    namespace: 'model-serving',
    counts: { router: [1, 1], prefill: [4, 4], decode: [1, 1] },
    nodes: {
      router: ['st-router-03'],
      prefill: ['st-b300-31', 'st-b300-32', 'st-b300-33', 'st-b300-34'],
      decode: ['st-b300-41'],
    },
  }),
  createGroup({
    key: 'glm51-4-st',
    clusterKey: 'shanghai-online',
    clusterAlias: 'st',
    clusterName: 'shanghai-online',
    name: 'glm51_4',
    model: 'GLM-5.1',
    namespace: 'model-serving',
    counts: { router: [1, 1], prefill: [7, 8], decode: [3, 3] },
    nodes: {
      router: ['st-router-04'],
      prefill: ['st-b300-51', 'st-b300-52', 'st-b300-53', 'st-b300-54', 'st-b300-55', 'st-b300-56', 'st-b300-57', 'st-b300-58'],
      decode: ['st-b300-61', 'st-b300-62', 'st-b300-63'],
    },
    status: '需关注',
  }),
  createGroup({
    key: 'glm51-1-bd',
    clusterKey: 'beijing-prod',
    clusterAlias: 'bd',
    clusterName: 'beijing-prod',
    name: 'glm51_1',
    model: 'GLM-5.1',
    namespace: 'model-serving',
    counts: { router: [1, 1], prefill: [8, 8], decode: [3, 3] },
    nodes: {
      router: ['bd-router-01'],
      prefill: ['bd-b300-11', 'bd-b300-12', 'bd-b300-13', 'bd-b300-14', 'bd-b300-15', 'bd-b300-16', 'bd-b300-17', 'bd-b300-18'],
      decode: ['bd-b300-21', 'bd-b300-22', 'bd-b300-23'],
    },
  }),
  createGroup({
    key: 'glm51-2-bd',
    clusterKey: 'beijing-prod',
    clusterAlias: 'bd',
    clusterName: 'beijing-prod',
    name: 'glm51_2',
    model: 'GLM-5.1',
    namespace: 'model-serving',
    counts: { router: [1, 1], prefill: [8, 8], decode: [3, 3] },
    nodes: {
      router: ['bd-router-02'],
      prefill: ['bd-b300-31', 'bd-b300-32', 'bd-b300-33', 'bd-b300-34', 'bd-b300-35', 'bd-b300-36', 'bd-b300-37', 'bd-b300-38'],
      decode: ['bd-b300-41', 'bd-b300-42', 'bd-b300-43'],
    },
    status: '已摘流',
    trafficState: 'drained',
  }),
  createGroup({
    key: 'glm51-1-bx',
    clusterKey: 'guangzhou-test',
    clusterAlias: 'bx',
    clusterName: 'guangzhou-test',
    name: 'glm51_1',
    model: 'GLM-5.1',
    namespace: 'model-serving-test',
    counts: { router: [1, 1], prefill: [7, 7], decode: [3, 3] },
    nodes: {
      router: ['bx-router-01'],
      prefill: ['bx-b300-11', 'bx-b300-12', 'bx-b300-13', 'bx-b300-14', 'bx-b300-15', 'bx-b300-16', 'bx-b300-17'],
      decode: ['bx-b300-21', 'bx-b300-22', 'bx-b300-23'],
    },
    status: '更新中',
  }),
];

const getRoleState = (role: PdRole) => {
  if (role.ready === role.desired) return 'healthy';
  if (role.ready === 0) return 'error';
  return 'warning';
};

const getNodePreview = (nodes: string[]) => (
  nodes.length > 2 ? `${nodes.slice(0, 2).join('、')} +${nodes.length - 2}` : nodes.join('、')
);

const buildRouterYaml = (group: PdGroup) => `apiVersion: workloads.x-k8s.io/v1alpha1
kind: RoleBasedGroup
metadata:
  name: ${group.routerRbg}
  namespace: ${group.namespace}
  labels:
    serving.ataas.io/model: ${group.model.toLowerCase()}
    serving.ataas.io/cluster: ${group.clusterKey}
    serving.ataas.io/group: ${group.name}
    serving.ataas.io/component: router
spec:
  roles:
    - name: router
      replicas: ${group.roles.router.desired}
      minReadySeconds: 0
      template:
        metadata:
          labels:
            serving.ataas.io/group: ${group.name}
            serving.ataas.io/role: router
        spec:
          containers:
            - name: router
              image: registry.internal/ataas/router-runtime:v2.8.1
              imagePullPolicy: IfNotPresent
              args:
                - --model=${group.model}
                - --prefill-service=${group.roles.prefill.resourceName}
                - --decode-service=${group.roles.decode.resourceName}
              ports:
                - name: http
                  containerPort: 8000
              resources:
                requests:
                  cpu: "4"
                  memory: 8Gi
                limits:
                  cpu: "8"
                  memory: 16Gi
              readinessProbe:
                httpGet:
                  path: /health/ready
                  port: http
                periodSeconds: 5
`;

const buildWorkersYaml = (group: PdGroup) => `apiVersion: workloads.x-k8s.io/v1alpha1
kind: RoleBasedGroup
metadata:
  name: ${group.workersRbg}
  namespace: ${group.namespace}
  labels:
    serving.ataas.io/model: ${group.model.toLowerCase()}
    serving.ataas.io/cluster: ${group.clusterKey}
    serving.ataas.io/group: ${group.name}
    serving.ataas.io/component: workers
spec:
  roles:
    - name: prefill
      replicas: ${group.roles.prefill.desired}
      minReadySeconds: 0
      template:
        metadata:
          labels:
            serving.ataas.io/group: ${group.name}
            serving.ataas.io/role: prefill
        spec:
          containers:
            - name: worker
              image: registry.internal/ataas/pd-worker:v5.1.4
              args:
                - --role=prefill
                - --model=${group.model}
                - --tensor-parallel-size=8
              env:
                - name: MOONCAKE_MASTER
                  value: ${group.name}-mooncake-master.${group.namespace}.svc.cluster.local
                - name: MOONCAKE_STORE
                  value: ${group.name}-mooncake-store.${group.namespace}.svc.cluster.local
              resources:
                limits:
                  nvidia.com/gpu: "1"
                  cpu: "16"
                  memory: 128Gi
              volumeMounts:
                - name: model-volume
                  mountPath: /models
    - name: decode
      replicas: ${group.roles.decode.desired}
      minReadySeconds: 0
      template:
        metadata:
          labels:
            serving.ataas.io/group: ${group.name}
            serving.ataas.io/role: decode
        spec:
          containers:
            - name: worker
              image: registry.internal/ataas/pd-worker:v5.1.4
              args:
                - --role=decode
                - --model=${group.model}
                - --tensor-parallel-size=4
              env:
                - name: PREFILL_SERVICE
                  value: ${group.roles.prefill.resourceName}.${group.namespace}.svc.cluster.local
                - name: KV_CACHE_BACKEND
                  value: mooncake
              resources:
                limits:
                  nvidia.com/gpu: "1"
                  cpu: "16"
                  memory: 128Gi
              volumeMounts:
                - name: model-volume
                  mountPath: /models
          volumes:
            - name: model-volume
              persistentVolumeClaim:
                claimName: ${group.model.toLowerCase()}-weights
`;

const RoleCell = ({ role }: { role: PdRole }) => (
  <div className="pd-role-cell">
    <div>
      <span className={`pd-role-badge is-${role.role}`}>{roleLabels[role.role]}</span>
      <strong className={`is-${getRoleState(role)}`}>{role.ready}/{role.desired}</strong>
    </div>
    <span title={role.nodes.join('、')}>{getNodePreview(role.nodes)}</span>
  </div>
);

const GroupDetailDrawer = ({
  group,
  onClose,
  onReset,
  onToggleTraffic,
  onViewAllPods,
  onAfterOpenChange,
}: {
  group: PdGroup | null;
  onClose: () => void;
  onReset: (group: PdGroup) => void;
  onToggleTraffic: (group: PdGroup) => void;
  onViewAllPods: (group: PdGroup) => void;
  onAfterOpenChange: (open: boolean) => void;
}) => {
  const [yamlFileKey, setYamlFileKey] = useState<GroupYamlFileKey>('router');
  const yamlFiles = useMemo(() => group ? [
    {
      key: 'router' as const,
      label: 'Router',
      filename: `${group.routerRbg}.yaml`,
      content: buildRouterYaml(group),
    },
    {
      key: 'workers' as const,
      label: 'Prefill / Decode',
      filename: `${group.workersRbg}.yaml`,
      content: buildWorkersYaml(group),
    },
  ] : [], [group]);
  const activeYamlFile = yamlFiles.find((file) => file.key === yamlFileKey) || yamlFiles[0];

  useEffect(() => {
    setYamlFileKey('router');
  }, [group?.key]);

  const podColumns: ColumnsType<PdPod> = [
    {
      title: 'Pod',
      dataIndex: 'name',
      width: 210,
      ellipsis: true,
      render: (name: string) => <span title={name}>{name}</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      width: 90,
      render: (role: PdPodRole) => <span className={`pd-role-badge is-${role}`}>{roleLabels[role]}</span>,
    },
    { title: 'Ready', dataIndex: 'readyLabel', width: 70 },
    {
      title: 'Phase',
      width: 100,
      render: (_, pod) => (
        <span className={`pd-pod-status is-${pod.ready ? 'ready' : 'pending'}`}>
          <i />
          {pod.status}
        </span>
      ),
    },
    { title: '重启', dataIndex: 'restarts', width: 70 },
    { title: 'Node', dataIndex: 'node', width: 150 },
  ];

  const copyYaml = async () => {
    if (!activeYamlFile) return;
    await navigator.clipboard?.writeText(activeYamlFile.content);
    message.success(`${activeYamlFile.filename} 已复制`);
  };

  const downloadYaml = () => {
    if (!activeYamlFile) return;
    const url = URL.createObjectURL(new Blob([activeYamlFile.content], { type: 'application/yaml;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = activeYamlFile.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    message.success(`${activeYamlFile.filename} 已下载`);
  };

  const overview = group ? (
    <div className="pd-detail-stack">
      <section className="pd-detail-section">
        <div className="pd-detail-section-head">
          <strong>基本信息</strong>
          <span>最近更新 {group.updatedAt}</span>
        </div>
        <div className="pd-detail-glance">
          <span><small>Cluster</small><b>{group.clusterName}</b></span>
          <span><small>Model</small><b>{group.model}</b></span>
          <span><small>Namespace</small><b>{group.namespace}</b></span>
          <span><small>状态</small><b className={`is-${group.status}`}>{group.status}</b></span>
          <span><small>Router RBG</small><b>{group.routerRbg}</b></span>
          <span><small>Workers RBG</small><b>{group.workersRbg}</b></span>
        </div>
      </section>

      <section className="pd-detail-section">
        <div className="pd-detail-section-head"><strong>Role Statuses</strong></div>
        <div className="pd-detail-role-grid">
          {(Object.values(group.roles) as PdRole[]).map((role) => (
            <article className="pd-detail-role-card" key={role.role}>
              <div>
                <span className={`pd-role-badge is-${role.role}`}>{roleLabels[role.role]}</span>
                <strong className={`is-${getRoleState(role)}`}>{role.ready}/{role.desired} Ready</strong>
              </div>
              <b>{role.resourceName}</b>
              <p>{role.nodes.join('、')}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pd-detail-section">
        <div className="pd-detail-section-head">
          <strong>Route Exposure</strong>
          <span className={`pd-traffic-state is-${group.trafficState}`}>
            {group.trafficState === 'serving' ? '接流中' : '已摘流'}
          </span>
        </div>
        <div className="pd-route-exposure">
          <span><small>SE</small><b>{group.exposure.seName}</b></span>
          <span><small>Host</small><b>{group.exposure.host}</b></span>
          <span><small>Router Service</small><b>{group.exposure.routerService}</b></span>
          <span><small>端口 / 协议</small><b>{group.exposure.port} / {group.exposure.protocol}</b></span>
          <span><small>流量策略</small><b>{group.exposure.policy}</b></span>
        </div>
      </section>
    </div>
  ) : null;

  const configuration = group ? (
    <div className="pd-detail-stack">
      <section className="pd-detail-section">
        <div className="pd-detail-section-head"><strong>Role Config</strong></div>
        <div className="pd-role-config-grid">
          {(Object.values(group.roles) as PdRole[]).map((role) => (
            <article key={role.role}>
              <span className={`pd-role-badge is-${role.role}`}>{roleLabels[role.role]}</span>
              {role.config.map((item) => (
                <div key={item.label}><small>{item.label}</small><b>{item.value}</b></div>
              ))}
            </article>
          ))}
        </div>
      </section>
      <section className="pd-detail-section pd-yaml-section">
        <div className="pd-detail-section-head">
          <strong>部署 YAML</strong>
        </div>
        <div className="pd-yaml-file-tabs" role="tablist" aria-label="YAML 文件">
          {yamlFiles.map((file) => (
            <button
              key={file.key}
              type="button"
              role="tab"
              aria-selected={yamlFileKey === file.key}
              className={yamlFileKey === file.key ? 'is-active' : ''}
              onClick={() => setYamlFileKey(file.key)}
            >
              <strong>{file.label}</strong>
              <span>{file.filename}</span>
            </button>
          ))}
        </div>
        <div className="pd-yaml-editor-shell">
          <div className="pd-yaml-editor-toolbar">
            <span>{activeYamlFile?.filename}</span>
            <div className="pd-yaml-editor-actions">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                aria-label="复制 YAML"
                title="复制 YAML"
                onClick={copyYaml}
              />
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                aria-label="下载 YAML"
                title="下载 YAML"
                onClick={downloadYaml}
              />
            </div>
          </div>
          <MonacoEditor
            className="pd-yaml-editor"
            value={activeYamlFile?.content || ''}
            language="yaml"
            height={460}
            options={{
              readOnly: true,
              domReadOnly: true,
              lineNumbers: 'on',
              glyphMargin: false,
              folding: true,
              lineDecorationsWidth: 12,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'line',
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              scrollbar: {
                verticalScrollbarSize: 9,
                horizontalScrollbarSize: 9,
              },
              padding: { top: 12, bottom: 12 },
            }}
          />
        </div>
      </section>
    </div>
  ) : null;

  const renderPodTable = (pods: PdPod[]) => (
    <Table<PdPod>
      className="pd-pod-table"
      rowKey="key"
      columns={podColumns}
      dataSource={pods}
      scroll={{ y: 176 }}
      pagination={false}
      size="small"
    />
  );

  const podsContent = group ? (() => {
    const inferencePods = group.pods.filter((pod) => pod.category === 'inference');
    const dependencyPods = group.pods.filter((pod) => pod.category === 'dependency');
    const getReadyCount = (pods: PdPod[]) => pods.filter((pod) => pod.ready).length;
    return (
      <div className="pd-group-pods-content">
        <div className="pd-group-pods-toolbar">
          <span>当前 Group 共 {group.pods.length} 个 Pods</span>
          <Button type="link" size="small" onClick={() => onViewAllPods(group)}>
            在 Pods 中查看全部
          </Button>
        </div>
        <Collapse
          className="pd-pod-groups"
          defaultActiveKey={['inference', 'dependency']}
          items={[
            {
              key: 'inference',
              label: (
                <div className="pd-pod-group-label">
                  <strong>推理服务组件</strong>
                  <span>{getReadyCount(inferencePods)}/{inferencePods.length} Ready</span>
                </div>
              ),
              children: renderPodTable(inferencePods),
            },
            {
              key: 'dependency',
              label: (
                <div className="pd-pod-group-label">
                  <strong>Mooncake / 依赖组件</strong>
                  <span>{getReadyCount(dependencyPods)}/{dependencyPods.length} Ready</span>
                </div>
              ),
              children: renderPodTable(dependencyPods),
            },
          ]}
        />
      </div>
    );
  })() : null;

  return (
    <Drawer
      rootClassName="pd-group-detail-drawer"
      width={760}
      open={!!group}
      onClose={onClose}
      afterOpenChange={onAfterOpenChange}
      destroyOnHidden
      title={group ? (
        <div className="pd-group-drawer-title">
          <strong>{group.name}</strong>
          <span>{group.clusterName} · {group.model}</span>
        </div>
      ) : null}
      footer={group ? (
        <div className="pd-group-drawer-footer">
          <Button onClick={onClose}>关闭</Button>
          <Button icon={<ReloadOutlined />} onClick={() => onReset(group)}>重置</Button>
          <Button
            danger={group.trafficState === 'serving'}
            icon={<DisconnectOutlined />}
            onClick={() => onToggleTraffic(group)}
          >
            {group.trafficState === 'serving' ? '摘流' : '恢复流量'}
          </Button>
        </div>
      ) : null}
    >
      {group ? (
        <Tabs
          className="pd-group-detail-tabs"
          items={[
            { key: 'overview', label: '概览', children: overview },
            {
              key: 'pods',
              label: `Pods (${group.pods.length})`,
              children: podsContent,
            },
            { key: 'config', label: '配置 / YAML', children: configuration },
          ]}
        />
      ) : null}
    </Drawer>
  );
};

const PdGroupsPage = ({ selectedClusterKey }: { selectedClusterKey: string }) => {
  const [groups, setGroups] = useState(initialGroups);
  const [keyword, setKeyword] = useState('');
  const [statusScope, setStatusScope] = useState('all');
  const [detailGroupKey, setDetailGroupKey] = useState<string | null>(null);
  const [pendingPodsNavigation, setPendingPodsNavigation] = useState(false);

  useEffect(() => {
    const focusGroup = (event: Event) => {
      const detail = (event as CustomEvent).detail as { cluster?: string; group?: string } | undefined;
      if (!detail?.group) return;
      const matchedGroup = groups.find((group) => (
        group.name === detail.group
        && group.clusterKey === selectedClusterKey
        && (!detail.cluster || group.clusterName === detail.cluster)
      ));
      if (!matchedGroup) return;
      setDetailGroupKey(matchedGroup.key);
    };
    window.addEventListener('ataas:group-focus', focusGroup);
    return () => window.removeEventListener('ataas:group-focus', focusGroup);
  }, [groups, selectedClusterKey]);

  const filteredGroups = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return groups.filter((group) => {
      if (group.clusterKey !== selectedClusterKey) return false;
      if (statusScope !== 'all' && group.status !== statusScope) return false;
      if (!normalizedKeyword) return true;
      const searchText = [
        group.name,
        group.model,
        group.clusterName,
        group.namespace,
        group.exposure.seName,
        group.exposure.host,
        ...group.pods.map((pod) => `${pod.name} ${pod.node}`),
      ].join(' ').toLowerCase();
      return searchText.includes(normalizedKeyword);
    });
  }, [groups, keyword, selectedClusterKey, statusScope]);

  const scopedGroups = useMemo(
    () => groups.filter((group) => group.clusterKey === selectedClusterKey),
    [groups, selectedClusterKey],
  );
  const detailGroup = groups.find((group) => group.key === detailGroupKey) || null;

  const resetGroup = (group: PdGroup) => {
    Modal.confirm({
      rootClassName: 'pd-group-action-confirm is-reset',
      width: 480,
      centered: true,
      icon: null,
      title: (
        <div className="pd-group-confirm-title">
          <span className="pd-group-confirm-icon"><ReloadOutlined /></span>
          <div>
            <strong>重置 Group</strong>
            <span>{group.name}</span>
          </div>
        </div>
      ),
      content: (
        <div className="pd-group-confirm-content">
          <p>系统将按顺序滚动重建该 Group 的推理服务 Pods，期间可用副本数可能短暂下降。</p>
          <dl>
            <div><dt>重建范围</dt><dd>Router、Prefill、Decode Pods</dd></div>
            <div><dt>保持不变</dt><dd>SE 暴露与路由关系</dd></div>
          </dl>
        </div>
      ),
      okText: '提交重置',
      cancelText: '取消',
      onOk: () => {
        setGroups((current) => current.map((item) => (
          item.key === group.key ? { ...item, status: '更新中', updatedAt: '刚刚' } : item
        )));
        message.success(`${group.name} 重置任务已提交`);
      },
    });
  };

  const toggleTraffic = (group: PdGroup) => {
    const draining = group.trafficState === 'serving';
    Modal.confirm({
      rootClassName: `pd-group-action-confirm ${draining ? 'is-drain' : 'is-restore'}`,
      width: 480,
      centered: true,
      icon: null,
      title: (
        <div className="pd-group-confirm-title">
          <span className="pd-group-confirm-icon"><DisconnectOutlined /></span>
          <div>
            <strong>{draining ? '摘流 Group' : '恢复流量'}</strong>
            <span>{group.name}</span>
          </div>
        </div>
      ),
      content: (
        <div className="pd-group-confirm-content">
          <p>
            {draining
              ? '摘流后该 Group 将停止接收新请求，正在处理的请求不会被中断。'
              : '恢复后该 Group 将重新加入可用后端，并开始接收新请求。'}
          </p>
          <dl>
            <div><dt>Service Entry</dt><dd>{group.exposure.seName}</dd></div>
            <div>
              <dt>{draining ? '现有请求' : '流量状态'}</dt>
              <dd>{draining ? '等待自然结束' : '恢复接流'}</dd>
            </div>
          </dl>
        </div>
      ),
      okText: draining ? '确认摘流' : '确认恢复',
      cancelText: '取消',
      okButtonProps: draining ? { danger: true } : undefined,
      onOk: () => {
        setGroups((current) => current.map((item) => (
          item.key === group.key
            ? {
              ...item,
              trafficState: draining ? 'drained' : 'serving',
              status: draining ? '已摘流' : '正常',
              updatedAt: '刚刚',
            }
            : item
        )));
        message.success(`${group.name} 已${draining ? '摘流' : '恢复流量'}`);
      },
    });
  };

  const viewAllPods = (group: PdGroup) => {
    window.dispatchEvent(new CustomEvent('ataas:pod-scope-change', {
      detail: {
        cluster: group.clusterName,
        group: group.name,
        pods: group.pods.map((pod) => ({
          key: pod.key,
          name: pod.name,
          cluster: group.clusterName,
          namespace: group.namespace,
          group: group.name,
          role: pod.role,
          category: pod.category,
          ready: pod.readyLabel,
          status: pod.status,
          restart: pod.restarts,
          image: pod.category === 'inference' ? 'pd-worker:v5.1.4' : `mooncake-${pod.role}:v1.2.0`,
          ip: pod.podIP,
          node: pod.node,
          age: '3d 12h',
        })),
      },
    }));
    setPendingPodsNavigation(true);
    setDetailGroupKey(null);
  };

  const columns: ColumnsType<PdGroup> = [
    {
      title: 'Group',
      key: 'group',
      width: 100,
      render: (_, group) => (
        <button className="pd-group-name" type="button" onClick={() => setDetailGroupKey(group.key)}>
          {group.name}
        </button>
      ),
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      width: 84,
      render: (model: string) => <span className="pd-model-name">{model}</span>,
    },
    {
      title: 'Router',
      key: 'router',
      width: 125,
      render: (_, group) => <RoleCell role={group.roles.router} />,
    },
    {
      title: 'Prefill',
      key: 'prefill',
      width: 140,
      render: (_, group) => <RoleCell role={group.roles.prefill} />,
    },
    {
      title: 'Decode',
      key: 'decode',
      width: 140,
      render: (_, group) => <RoleCell role={group.roles.decode} />,
    },
    {
      title: 'Exposed SE',
      key: 'exposure',
      width: 180,
      render: (_, group) => (
        <div className="pd-exposure-cell">
          <div>
            <span className="pd-se-pill">SE</span>
            <b>{group.exposure.seName}</b>
          </div>
          <span title={group.exposure.host}>{group.exposure.host}</span>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_, group) => (
        <span className={`pd-group-status is-${group.status}`}>
          <i />
          {group.status}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 196,
      fixed: 'right',
      className: 'pd-group-actions-column',
      onHeaderCell: () => ({ className: 'pd-group-actions-column' }),
      render: (_, group) => (
        <div className="pd-group-actions">
          <Button
            type="link"
            size="small"
            className="pd-action-detail"
            icon={<EyeOutlined />}
            onClick={() => setDetailGroupKey(group.key)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            className="pd-action-reset"
            icon={<ReloadOutlined />}
            onClick={() => resetGroup(group)}
          >
            重置
          </Button>
          <Button
            type="link"
            size="small"
            danger={group.trafficState === 'serving'}
            className="pd-action-traffic"
            icon={<DisconnectOutlined />}
            onClick={() => toggleTraffic(group)}
          >
            {group.trafficState === 'serving' ? '摘流' : '恢复'}
          </Button>
        </div>
      ),
    },
  ];

  const healthyCount = scopedGroups.filter((group) => group.status === '正常').length;
  const attentionCount = scopedGroups.filter((group) => group.status === '需关注').length;
  const drainedCount = scopedGroups.filter((group) => group.trafficState === 'drained').length;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6951ff' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <div className="pd-groups-page">
        <header className="pd-groups-header">
          <div className="pd-groups-summary">
            <span><small>Group</small><b>{scopedGroups.length}</b></span>
            <span><small>正常</small><b className="is-normal">{healthyCount}</b></span>
            <span><small>需关注</small><b className={attentionCount ? 'is-error' : ''}>{attentionCount}</b></span>
            <span><small>已摘流</small><b>{drainedCount}</b></span>
          </div>
        </header>

        <div className="pd-groups-toolbar">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            prefix={<Search />}
            placeholder="搜索 Group / Model / SE / Node"
            className="pd-group-search"
          />
          <Select
            className="pd-status-select"
            value={statusScope}
            onChange={setStatusScope}
            options={[
              { value: 'all', label: '全部状态' },
              { value: '正常', label: '正常' },
              { value: '需关注', label: '需关注' },
              { value: '更新中', label: '更新中' },
              { value: '已摘流', label: '已摘流' },
            ]}
          />
        </div>

        <div className="pd-group-table-frame">
          <Table<PdGroup>
            className="pd-group-table"
            rowKey="key"
            columns={columns}
            dataSource={filteredGroups}
            scroll={{ x: 1050 }}
            pagination={{ pageSize: 10, size: 'small', showTotal: (total) => `共 ${total} 个` }}
            onRow={(group) => ({ onDoubleClick: () => setDetailGroupKey(group.key) })}
          />
        </div>
      </div>

      <GroupDetailDrawer
        group={detailGroup}
        onClose={() => setDetailGroupKey(null)}
        onReset={resetGroup}
        onToggleTraffic={toggleTraffic}
        onViewAllPods={viewAllPods}
        onAfterOpenChange={(open) => {
          if (open || !pendingPodsNavigation) return;
          setPendingPodsNavigation(false);
          document.querySelector<HTMLElement>(
            '.cluster-operations-homepage .module-tab[data-view="pods"]',
          )?.click();
        }}
      />
    </ConfigProvider>
  );
};

export default PdGroupsPage;
