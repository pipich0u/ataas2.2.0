import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, message, Modal, Segmented, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import * as yaml from 'js-yaml';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MonacoEditor } from '../../../components/shared/MonacoEditor';
import { createManualPod, useK8sResourceStore } from './k8sResourceStore';

type ResourceView = 'svc' | 'se' | 'pod' | 'pv' | 'pvc';
type PortInfo = { port: number; targetPort: number; nodePort?: number; protocol: string };
type EndpointInfo = { address: string; weight?: number };

type ServiceRow = {
  key: string;
  name: string;
  se: string;
  cluster: string;
  namespace: string;
  clusterIP: string;
  type: string;
  ports: PortInfo[];
  endpoints: EndpointInfo[];
  pods: number;
  age: string;
};

type PodRow = {
  key: string;
  name: string;
  cluster: string;
  namespace: string;
  group: string;
  role: string;
  category: 'inference' | 'dependency' | 'other';
  ready: string;
  status: string;
  restart: number;
  image: string;
  ip: string;
  node: string;
  age: string;
  canOpenGroup?: boolean;
};

type RouteEntry = {
  key: string;
  name: string;
  cluster: string;
  namespace: string;
  hosts: string[];
  ports: PortInfo[];
  endpoints: { address: string; weight: number }[];
};

type PVRow = {
  key: string;
  name: string;
  capacity: string;
  storageType: string;
  accessMode: string;
  status: string;
  reclaimPolicy: string;
  age: string;
};

type PVCRow = {
  key: string;
  name: string;
  namespace: string;
  requestCapacity: string;
  storageClass: string;
  status: string;
  boundPV: string;
  age: string;
};

type SummaryItem = {
  label: string;
  value: number;
  tone?: 'is-normal' | 'is-warning' | 'is-error';
};

type PodScope = {
  cluster: string;
  group: string;
  pods?: PodRow[];
};

type DevPodDraft = {
  name: string;
  namespace: string;
  owner: string;
  node: string;
  template: string;
  collaborators: string;
  expiresIn: string;
};

type DevPodYamlDocument = {
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    annotations?: Record<string, unknown>;
  };
  spec?: {
    nodeName?: string;
    containers?: Array<{ image?: string }>;
  };
};

const devPodTemplates = [
  { value: 'pytorch-b300', label: 'PyTorch 2.5 / CUDA 12.4', image: 'registry.internal/dev/pytorch:2.5-cuda12.4' },
  { value: 'sglang-debug', label: 'SGLang Debug / CUDA 12.4', image: 'registry.internal/dev/sglang-debug:v0.5.10' },
  { value: 'cuda-base', label: 'CUDA 12.4 Base', image: 'registry.internal/dev/cuda:12.4-runtime' },
];

const pvRows: PVRow[] = [];
const pvcRows: PVCRow[] = [];

const includesKeyword = (content: string, keyword: string) => (
  !keyword || content.toLowerCase().includes(keyword)
);

export default function ClusterResourceTables({
  className,
  view: initialView,
  selectedClusterKey,
}: {
  className?: string;
  view: ResourceView;
  selectedClusterKey?: string;
}) {
  const [keyword, setKeyword] = useState('');
  const [podScope, setPodScope] = useState<PodScope | null>(null);
  const [namespaceFilter, setNamespaceFilter] = useState('all');
  const [podStatus, setPodStatus] = useState('all');
  const [devPodOpen, setDevPodOpen] = useState(false);
  const [devPodStep, setDevPodStep] = useState<'form' | 'preview'>('form');
  const [devPodMode, setDevPodMode] = useState<'form' | 'yaml'>('form');
  const [devPodYaml, setDevPodYaml] = useState('');
  const [devPodDraft, setDevPodDraft] = useState<DevPodDraft>({
    name: '',
    namespace: 'devpods',
    owner: 'admin',
    node: '',
    template: devPodTemplates[0].value,
    collaborators: '',
    expiresIn: '24h',
  });
  const currentCluster = selectedClusterKey || 'default';
  const normalizedKeyword = keyword.trim().toLowerCase();
  const resourceStore = useK8sResourceStore();
  const { serviceEntries, services, pods } = resourceStore.state;

  const seNameMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceEntries.forEach((entry) => entry.serviceIds.forEach((serviceId) => map.set(serviceId, entry.name)));
    return map;
  }, [serviceEntries]);

  const serviceEndpointMap = useMemo(() => {
    const map = new Map<string, EndpointInfo[]>();
    serviceEntries.forEach((entry) => entry.endpoints.forEach((endpoint) => {
      const list = map.get(endpoint.serviceId) || [];
      list.push({ address: endpoint.address, weight: endpoint.weight });
      map.set(endpoint.serviceId, list);
    }));
    return map;
  }, [serviceEntries]);

  const storeServiceRows = useMemo<ServiceRow[]>(() => services.map((service) => ({
    key: service.id,
    name: service.name,
    se: seNameMap.get(service.id) || service.serviceEntryId || '-',
    cluster: service.cluster,
    namespace: service.namespace,
    clusterIP: service.clusterIP,
    type: service.type,
    ports: service.ports,
    endpoints: serviceEndpointMap.get(service.id) || [],
    pods: service.podIds.length,
    age: service.createdAt,
  })), [services, seNameMap, serviceEndpointMap]);

  const storePodRows = useMemo<PodRow[]>(() => pods.map((pod) => ({
    key: pod.id,
    name: pod.name,
    cluster: pod.cluster,
    namespace: pod.namespace,
    group: pod.group || '-',
    role: pod.role,
    category: ['router', 'prefill', 'decode'].includes(pod.role) ? 'inference' : 'other',
    ready: pod.ready,
    status: pod.status === 'Draft' ? 'Pending' : pod.status,
    restart: pod.restart,
    image: pod.image,
    ip: pod.podIP,
    node: pod.node,
    age: pod.age,
  })), [pods]);

  useEffect(() => {
    setPodScope(null);
    setNamespaceFilter('all');
    setPodStatus('all');
    setKeyword('');
    setDevPodOpen(false);
    setDevPodStep('form');
  }, [selectedClusterKey]);

  useEffect(() => {
    if (initialView !== 'pod') return undefined;
    const applyPodScope = (event: Event) => {
      const detail = (event as CustomEvent).detail as PodScope | undefined;
      if (!detail?.cluster || !detail.group) return;
      setPodScope({
        cluster: detail.cluster,
        group: detail.group,
        pods: Array.isArray(detail.pods) ? detail.pods : undefined,
      });
      setNamespaceFilter('all');
      setPodStatus('all');
      setKeyword('');
    };
    window.addEventListener('ataas:pod-scope-change', applyPodScope);
    return () => window.removeEventListener('ataas:pod-scope-change', applyPodScope);
  }, [initialView]);

  const scopedServiceRows = useMemo(
    () => storeServiceRows.filter((row) => row.cluster === currentCluster),
    [currentCluster, storeServiceRows],
  );
  const scopedPodRows = useMemo(
    () => storePodRows.filter((row) => row.cluster === currentCluster),
    [currentCluster, storePodRows],
  );
  const effectivePodRows = useMemo(() => {
    if (podScope?.pods) return podScope.pods.map((row) => ({ ...row, canOpenGroup: true }));
    if (!podScope) return scopedPodRows;
    return scopedPodRows.filter((row) => (
      row.cluster === podScope.cluster && row.group === podScope.group
    ));
  }, [podScope, scopedPodRows]);

  const podNamespaceRows = useMemo(
    () => effectivePodRows.filter((row) => namespaceFilter === 'all' || row.namespace === namespaceFilter),
    [effectivePodRows, namespaceFilter],
  );
  const serviceNamespaceRows = useMemo(
    () => scopedServiceRows.filter((row) => namespaceFilter === 'all' || row.namespace === namespaceFilter),
    [namespaceFilter, scopedServiceRows],
  );
  const namespaceOptions = useMemo(() => {
    const rows = initialView === 'pod' ? effectivePodRows : scopedServiceRows;
    return [
      { value: 'all', label: '全部命名空间' },
      ...Array.from(new Set(rows.map((row) => row.namespace)))
        .sort((a, b) => a.localeCompare(b))
        .map((namespace) => ({ value: namespace, label: namespace })),
    ];
  }, [effectivePodRows, initialView, scopedServiceRows]);
  const nodeOptions = useMemo(() => {
    const clusterNodes = scopedPodRows
      .map((row) => row.node)
      .filter((node) => node && node !== '自动调度');
    return Array.from(new Set(clusterNodes))
      .sort((a, b) => a.localeCompare(b))
      .map((node) => ({ value: node, label: node }));
  }, [scopedPodRows]);

  const storeRouteData = useMemo<RouteEntry[]>(() => serviceEntries.map((entry) => {
    const entryServices = services.filter((service) => entry.serviceIds.includes(service.id));
    const seen = new Set<string>();
    const entryPorts: PortInfo[] = [];
    entryServices.forEach((service) => service.ports.forEach((port) => {
      const portKey = `${port.port}-${port.protocol}`;
      if (!seen.has(portKey)) {
        seen.add(portKey);
        entryPorts.push(port);
      }
    }));

    const endpoints = entry.endpoints.map((endpoint) => ({
      address: endpoint.address,
      weight: endpoint.weight,
    }));
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    if (totalWeight > 0) {
      endpoints.forEach((endpoint) => {
        endpoint.weight = Math.round((endpoint.weight / totalWeight) * 100);
      });
    }

    return {
      key: entry.id,
      name: entry.name,
      cluster: entry.cluster,
      namespace: entry.namespace,
      hosts: entry.hosts,
      ports: entryPorts,
      endpoints,
    };
  }), [serviceEntries, services]);
  const scopedRouteData = useMemo(
    () => storeRouteData.filter((row) => row.cluster === currentCluster),
    [currentCluster, storeRouteData],
  );

  const filteredServices = useMemo(() => serviceNamespaceRows.filter((row) => includesKeyword(
    `${row.name} ${row.se} ${row.namespace} ${row.clusterIP} ${row.type}`,
    normalizedKeyword,
  )), [serviceNamespaceRows, normalizedKeyword]);

  const filteredPods = useMemo(() => podNamespaceRows.filter((row) => {
    if (podStatus !== 'all' && row.status !== podStatus) return false;
    return includesKeyword(
      `${row.name} ${row.cluster} ${row.namespace} ${row.group} ${row.category} ${row.role} ${row.status} ${row.image} ${row.ip} ${row.node}`,
      normalizedKeyword,
    );
  }), [normalizedKeyword, podNamespaceRows, podStatus]);

  const filteredRoutes = useMemo(() => scopedRouteData.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.hosts.join(' ')} ${row.endpoints.map((endpoint) => endpoint.address).join(' ')}`,
    normalizedKeyword,
  )), [scopedRouteData, normalizedKeyword]);

  const filteredPVs = useMemo(() => pvRows.filter((row) => includesKeyword(
    `${row.name} ${row.storageType} ${row.status}`,
    normalizedKeyword,
  )), [normalizedKeyword]);

  const filteredPVCs = useMemo(() => pvcRows.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.storageClass} ${row.status} ${row.boundPV}`,
    normalizedKeyword,
  )), [normalizedKeyword]);

  const pageConfig = useMemo<{
    title: string;
    description: string;
    placeholder: string;
    summary: SummaryItem[];
  }>(() => {
    if (initialView === 'pod') {
      const running = podNamespaceRows.filter((row) => row.status === 'Running').length;
      const pending = podNamespaceRows.filter((row) => row.status === 'Pending').length;
      const failed = podNamespaceRows.filter((row) => row.status === 'Failed').length;
      return {
        title: 'Pods',
        description: podScope
          ? `查看 ${podScope.group} 的全部 Pod 资源`
          : '查看 Pod 的运行状态、调度节点与重启情况',
        placeholder: '搜索 Pod 名称 / IP / Node',
        summary: [
          { label: 'Pod 总数', value: podNamespaceRows.length },
          { label: '运行中', value: running, tone: 'is-normal' },
          { label: '等待中', value: pending, tone: pending ? 'is-warning' : undefined },
          { label: '异常', value: failed, tone: failed ? 'is-error' : undefined },
        ],
      };
    }

    if (initialView === 'svc') {
      return {
        title: 'Services',
        description: '查看 Service 的访问地址、端口与关联后端',
        placeholder: '搜索 Service / ServiceEntry / Cluster IP',
        summary: [
          { label: 'Service 总数', value: serviceNamespaceRows.length },
          { label: 'ClusterIP', value: serviceNamespaceRows.filter((row) => row.type === 'ClusterIP').length },
          { label: 'NodePort', value: serviceNamespaceRows.filter((row) => row.type === 'NodePort').length },
          { label: '关联 Pods', value: serviceNamespaceRows.reduce((sum, row) => sum + row.pods, 0) },
        ],
      };
    }

    if (initialView === 'se') {
      return {
        title: 'ServiceEntry',
        description: '查看网格出口服务、主机与端点配置',
        placeholder: '搜索 ServiceEntry / Host / Endpoint',
        summary: [
          { label: 'ServiceEntry 总数', value: scopedRouteData.length },
          { label: 'Hosts', value: scopedRouteData.reduce((sum, row) => sum + row.hosts.length, 0) },
          { label: 'Ports', value: scopedRouteData.reduce((sum, row) => sum + row.ports.length, 0) },
          { label: 'Endpoints', value: scopedRouteData.reduce((sum, row) => sum + row.endpoints.length, 0) },
        ],
      };
    }

    if (initialView === 'pv') {
      return {
        title: 'PV',
        description: '查看当前集群的持久卷资源',
        placeholder: '搜索 PV 名称 / 存储类型',
        summary: [{ label: 'PV 总数', value: pvRows.length }],
      };
    }

    return {
      title: 'PVC',
      description: '查看当前集群的持久卷声明',
      placeholder: '搜索 PVC 名称 / 命名空间 / 存储类',
      summary: [{ label: 'PVC 总数', value: pvcRows.length }],
    };
  }, [initialView, podNamespaceRows, podScope, scopedRouteData, serviceNamespaceRows]);

  const selectedDevPodTemplate = devPodTemplates.find((template) => template.value === devPodDraft.template)
    || devPodTemplates[0];
  const formPreviewDevPod = useMemo(() => createManualPod({
    name: devPodDraft.name || 'my-devpod',
    cluster: currentCluster,
    namespace: devPodDraft.namespace || 'devpods',
    owner: devPodDraft.owner || 'admin',
    image: selectedDevPodTemplate.image,
    node: devPodDraft.node || undefined,
    collaborators: devPodDraft.collaborators
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    expiresIn: devPodDraft.expiresIn,
  }), [
    currentCluster,
    devPodDraft.collaborators,
    devPodDraft.expiresIn,
    devPodDraft.name,
    devPodDraft.namespace,
    devPodDraft.node,
    devPodDraft.owner,
    selectedDevPodTemplate.image,
  ]);
  const parsedDevPodYaml = useMemo(() => {
    if (!devPodYaml.trim()) return null;
    try {
      const parsed = yaml.load(devPodYaml);
      return parsed && typeof parsed === 'object' ? parsed as DevPodYamlDocument : null;
    } catch {
      return null;
    }
  }, [devPodYaml]);
  const previewDevPod = useMemo(() => {
    if (devPodMode !== 'yaml' || !parsedDevPodYaml) return formPreviewDevPod;
    const annotations = parsedDevPodYaml.metadata?.annotations || {};
    const collaborators = String(annotations['ataas.io/collaborators'] || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const pod = createManualPod({
      name: parsedDevPodYaml.metadata?.name || 'my-devpod',
      cluster: currentCluster,
      namespace: parsedDevPodYaml.metadata?.namespace || 'devpods',
      owner: String(annotations['ataas.io/owner'] || 'admin'),
      image: parsedDevPodYaml.spec?.containers?.[0]?.image || selectedDevPodTemplate.image,
      node: parsedDevPodYaml.spec?.nodeName,
      collaborators,
      expiresIn: String(annotations['ataas.io/expires-in'] || '24h'),
    });
    return { ...pod, source: 'imported-yaml' as const, yaml: devPodYaml };
  }, [
    currentCluster,
    devPodMode,
    devPodYaml,
    formPreviewDevPod,
    parsedDevPodYaml,
    selectedDevPodTemplate.image,
  ]);

  const openDevPodCreator = () => {
    setDevPodDraft({
      name: '',
      namespace: 'devpods',
      owner: 'admin',
      node: '',
      template: devPodTemplates[0].value,
      collaborators: '',
      expiresIn: '24h',
    });
    setDevPodMode('form');
    setDevPodYaml('');
    setDevPodStep('form');
    setDevPodOpen(true);
  };

  const validateDevPodDraft = () => {
    if (devPodMode === 'yaml') {
      if (!devPodYaml.trim()) {
        message.warning('请输入 YAML 配置');
        return false;
      }
      if (!parsedDevPodYaml) {
        message.error('YAML 格式不正确，请检查后重试');
        return false;
      }
      if (parsedDevPodYaml.kind !== 'Pod') {
        message.error('YAML kind 必须为 Pod');
        return false;
      }
      if (
        !parsedDevPodYaml.metadata?.name
        || !parsedDevPodYaml.metadata?.namespace
        || !parsedDevPodYaml.spec?.containers?.[0]?.image
      ) {
        message.warning('YAML 需要包含 Pod 名称、命名空间和容器镜像');
        return false;
      }
    } else if (!devPodDraft.name.trim() || !devPodDraft.owner.trim()) {
      message.warning('请填写 DevPod 名称和 Owner');
      return false;
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(previewDevPod.name.trim())) {
      message.warning('DevPod 名称仅支持小写字母、数字和连字符');
      return false;
    }
    const duplicate = pods.some((pod) => (
      pod.cluster === previewDevPod.cluster
      && pod.namespace === previewDevPod.namespace
      && pod.name === previewDevPod.name.trim()
    ));
    if (duplicate) {
      message.error('当前集群和命名空间中已存在同名 Pod');
      return false;
    }
    return true;
  };

  const previewDevPodDraft = () => {
    if (!validateDevPodDraft()) return;
    setDevPodStep('preview');
  };

  const createDevPod = () => {
    if (!validateDevPodDraft()) return;
    resourceStore.addPod(previewDevPod);
    setDevPodOpen(false);
    setDevPodStep('form');
    setPodScope(null);
    setNamespaceFilter(previewDevPod.namespace);
    setPodStatus('all');
    setKeyword(previewDevPod.name);
    message.success(`${previewDevPod.name} 已提交创建`);
  };

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 150, render: (value) => <span className="resource-list-text">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    { title: 'Cluster IP', dataIndex: 'clusterIP', key: 'clusterIP', width: 160, render: (value) => <span className="resource-list-code">{value}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120, render: (value) => <span className="resource-kind-tag">{value}</span> },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      width: 260,
      render: (ports: PortInfo[]) => (
        <div className="resource-list-lines is-inline">
          {ports.map((port, index) => (
            <span key={`${port.port}-${index}`} className="resource-list-code">
              {port.port} → {port.targetPort}{port.nodePort ? ` (node:${port.nodePort})` : ''} / {port.protocol.toLowerCase()}
            </span>
          ))}
          {ports.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpoints',
      key: 'endpoints',
      width: 300,
      render: (endpoints: EndpointInfo[]) => (
        <div className="resource-list-lines">
          {endpoints.map((endpoint, index) => (
            <span key={`${endpoint.address}-${index}`} className="resource-list-code">{endpoint.address}</span>
          ))}
          {endpoints.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    { title: 'POD', dataIndex: 'pods', key: 'pods', width: 90 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 150, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
  ];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'Pod', dataIndex: 'name', key: 'name', width: 230, render: (value) => <span className="resource-list-name">{value}</span> },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
      width: 130,
      render: (value, row) => row.role === 'business' ? (
        <span className="resource-devpod-group">DevPod</span>
      ) : row.canOpenGroup ? (
        <button
          type="button"
          className="resource-group-link"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('ataas:group-focus', {
              detail: { cluster: row.cluster, group: row.group },
            }));
            document.querySelector<HTMLElement>(
              '.cluster-operations-homepage .module-tab[data-view="workloads"]',
            )?.click();
          }}
        >
          {value}
        </button>
      ) : (
        <span className="resource-group-value">{value}</span>
      ),
    },
    { title: 'Pod IP', dataIndex: 'ip', key: 'ip', width: 140, render: (value) => <span className="resource-list-code">{value}</span> },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (value) => (
        <span className={`resource-role-tag is-${value}`}>
          {value === 'business' ? 'DEV' : String(value).toUpperCase()}
        </span>
      ),
    },
    { title: 'Ready', dataIndex: 'ready', key: 'ready', width: 80 },
    {
      title: 'Phase',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => (
        <span className={`resource-list-status is-${String(value).toLowerCase()}`}>
          <i />
          {value}
        </span>
      ),
    },
    { title: '重启次数', dataIndex: 'restart', key: 'restart', width: 100 },
    { title: 'Node', dataIndex: 'node', key: 'node', width: 160, render: (value) => <span className="is-nowrap">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    { title: 'Cluster', dataIndex: 'cluster', key: 'cluster', width: 150 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 120, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
  ];

  const serviceEntryColumns: ColumnsType<RouteEntry> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    {
      title: 'Hosts',
      dataIndex: 'hosts',
      key: 'hosts',
      width: 280,
      render: (hosts: string[]) => (
        <div className="resource-list-lines">
          {hosts.map((host) => <span key={host} className="resource-list-code">{host}</span>)}
        </div>
      ),
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      width: 180,
      render: (ports: PortInfo[]) => (
        <div className="resource-list-lines">
          {ports.map((port, index) => (
            <span key={`${port.port}-${index}`} className="resource-list-code">{port.port} / {port.protocol.toLowerCase()}</span>
          ))}
          {ports.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    {
      title: 'Endpoints（SVC）',
      dataIndex: 'endpoints',
      key: 'endpoints',
      width: 320,
      render: (endpoints: { address: string; weight: number }[]) => (
        <div className="resource-list-lines">
          {endpoints.map((endpoint, index) => (
            <span key={`${endpoint.address}-${index}`}>
              <span className="resource-list-code">{endpoint.address}</span>
              <small>{endpoint.weight}%</small>
            </span>
          ))}
          {endpoints.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
  ];

  const pvColumns: ColumnsType<PVRow> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 130 },
    { title: '存储类型', dataIndex: 'storageType', key: 'storageType', width: 150 },
    { title: '访问模式', dataIndex: 'accessMode', key: 'accessMode', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
    { title: '回收策略', dataIndex: 'reclaimPolicy', key: 'reclaimPolicy', width: 140 },
    { title: '创建时间', dataIndex: 'age', key: 'age', width: 180 },
  ];

  const pvcColumns: ColumnsType<PVCRow> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 150 },
    { title: '容量请求', dataIndex: 'requestCapacity', key: 'requestCapacity', width: 140 },
    { title: '存储类', dataIndex: 'storageClass', key: 'storageClass', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
    { title: '绑定 PV', dataIndex: 'boundPV', key: 'boundPV', width: 180 },
    { title: '创建时间', dataIndex: 'age', key: 'age', width: 180 },
  ];

  const pagination = {
    pageSize: 10,
    size: 'small' as const,
    showTotal: (total: number) => `共 ${total} 条`,
  };

  const table = initialView === 'se' ? (
    <Table<RouteEntry>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={serviceEntryColumns}
      dataSource={filteredRoutes}
      scroll={{ x: 1110 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 ServiceEntry 数据' }}
    />
  ) : initialView === 'svc' ? (
    <Table<ServiceRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={serviceColumns}
      dataSource={filteredServices}
      scroll={{ x: 1560 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 Service 数据' }}
    />
  ) : initialView === 'pod' ? (
    <Table<PodRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={podColumns}
      dataSource={filteredPods}
      scroll={{ x: 1460 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 Pod 数据' }}
    />
  ) : initialView === 'pv' ? (
    <Table<PVRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={pvColumns}
      dataSource={filteredPVs}
      scroll={{ x: 1060 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 PV 数据' }}
    />
  ) : (
    <Table<PVCRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={pvcColumns}
      dataSource={filteredPVCs}
      scroll={{ x: 1120 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 PVC 数据' }}
    />
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6951FF' }, components: { Table: { headerBg: '#F7F8FA' } } }}>
      <div className={['group-page-shell', 'cluster-resource-page', className].filter(Boolean).join(' ')}>
        <div className="group-page-head is-summary-only">
          <div className="group-page-summary">
            {pageConfig.summary.map((item) => (
              <span key={item.label}>
                <small>{item.label}</small>
                <b className={item.tone}>{item.value}</b>
              </span>
            ))}
          </div>
        </div>

        <div className={`group-table-toolbar${initialView === 'pod' ? ' resource-pod-toolbar' : ''}`}>
          <div className="resource-table-toolbar-left">
            <Input
              size="small"
              allowClear
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              prefix={<Search className="group-search-icon" />}
              placeholder={pageConfig.placeholder}
              className="group-search-input"
              style={{ width: 320 }}
            />
            {(initialView === 'pod' || initialView === 'svc') && (
              <Select
                className="resource-namespace-select"
                value={namespaceFilter}
                onChange={setNamespaceFilter}
                options={namespaceOptions}
              />
            )}
            {initialView === 'pod' && (
              <Select
                className="resource-pod-status-select"
                value={podStatus}
                onChange={setPodStatus}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'Running', label: 'Running' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Failed', label: 'Failed' },
                ]}
              />
            )}
            {initialView === 'pod' && podScope ? (
              <div className="resource-pod-scope">
                <span><small>Cluster</small>{podScope.cluster}</span>
                <span><small>Group</small>{podScope.group}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setPodScope(null);
                    setNamespaceFilter('all');
                    setPodStatus('all');
                  }}
                >
                  清除筛选
                </Button>
              </div>
            ) : null}
          </div>
          {initialView === 'pod' ? (
            <Button
              type="primary"
              className="resource-create-devpod"
              icon={<PlusOutlined />}
              onClick={openDevPodCreator}
            >
              新建 DevPod
            </Button>
          ) : null}
        </div>

        <div className="group-table-frame">
          {table}
        </div>

        {initialView === 'pod' && (
          <Modal
            rootClassName="devpod-create-modal"
            width={devPodMode === 'yaml' ? 760 : 680}
            open={devPodOpen}
            title="新建 DevPod"
            destroyOnHidden
            onCancel={() => {
              setDevPodOpen(false);
              setDevPodStep('form');
            }}
            footer={devPodStep === 'form' ? [
              <Button key="cancel" onClick={() => setDevPodOpen(false)}>取消</Button>,
              <Button key="preview" type="primary" onClick={previewDevPodDraft}>预览</Button>,
            ] : [
              <Button key="back" onClick={() => setDevPodStep('form')}>返回编辑</Button>,
              <Button key="create" type="primary" onClick={createDevPod}>创建 DevPod</Button>,
            ]}
          >
            {devPodStep === 'form' ? (
              <>
                <div className="devpod-create-mode">
                  <span>创建方式</span>
                  <Segmented
                    value={devPodMode}
                    options={[
                      { value: 'form', label: '表单配置' },
                      { value: 'yaml', label: 'YAML' },
                    ]}
                    onChange={(mode) => {
                      if (mode === 'yaml' && !devPodYaml) setDevPodYaml(formPreviewDevPod.yaml);
                      setDevPodMode(mode as 'form' | 'yaml');
                    }}
                  />
                </div>
                {devPodMode === 'form' ? (
                  <div className="devpod-form">
                    <div className="devpod-form-grid">
                      <label>
                        <span>DevPod 名称</span>
                        <Input
                          value={devPodDraft.name}
                          placeholder="例如 llm-debug"
                          onChange={(event) => setDevPodDraft((current) => ({ ...current, name: event.target.value }))}
                        />
                      </label>
                      <label>
                        <span>Owner</span>
                        <Input
                          value={devPodDraft.owner}
                          placeholder="用户名"
                          onChange={(event) => setDevPodDraft((current) => ({ ...current, owner: event.target.value }))}
                        />
                      </label>
                      <label>
                        <span>命名空间</span>
                        <Input
                          value={devPodDraft.namespace}
                          placeholder="devpods"
                          onChange={(event) => setDevPodDraft((current) => ({ ...current, namespace: event.target.value }))}
                        />
                      </label>
                      <label>
                        <span>Node</span>
                        <Select
                          allowClear
                          value={devPodDraft.node || undefined}
                          placeholder="自动调度"
                          options={nodeOptions}
                          onChange={(node) => setDevPodDraft((current) => ({ ...current, node: node || '' }))}
                        />
                      </label>
                      <label>
                        <span>自动回收</span>
                        <Select
                          value={devPodDraft.expiresIn}
                          options={[
                            { value: '8h', label: '8 小时后' },
                            { value: '24h', label: '24 小时后' },
                            { value: '72h', label: '3 天后' },
                            { value: '168h', label: '7 天后' },
                          ]}
                          onChange={(expiresIn) => setDevPodDraft((current) => ({ ...current, expiresIn }))}
                        />
                      </label>
                      <label>
                        <span>配置模板</span>
                        <Select
                          value={devPodDraft.template}
                          options={devPodTemplates}
                          onChange={(template) => setDevPodDraft((current) => ({ ...current, template }))}
                        />
                      </label>
                    </div>
                    <label className="devpod-form-wide">
                      <span>Collaborators</span>
                      <Input
                        value={devPodDraft.collaborators}
                        placeholder="输入用户名，多个用户用逗号分隔"
                        onChange={(event) => setDevPodDraft((current) => ({ ...current, collaborators: event.target.value }))}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="devpod-yaml-input">
                    <MonacoEditor
                      value={devPodYaml}
                      language="yaml"
                      height={340}
                      onChange={setDevPodYaml}
                      options={{
                        lineNumbers: 'on',
                        folding: true,
                        wordWrap: 'off',
                        padding: { top: 12, bottom: 12 },
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="devpod-preview">
                <dl>
                  <div><dt>命名空间</dt><dd>{previewDevPod.namespace}</dd></div>
                  <div><dt>Owner</dt><dd>{previewDevPod.owner}</dd></div>
                  <div><dt>自动回收</dt><dd>{previewDevPod.expiresIn}</dd></div>
                  <div><dt>Node</dt><dd>{previewDevPod.node}</dd></div>
                  <div><dt>镜像</dt><dd>{previewDevPod.image}</dd></div>
                </dl>
                <div className="devpod-preview-yaml">
                  <span>{previewDevPod.name}.yaml</span>
                  <pre>{previewDevPod.yaml}</pre>
                </div>
              </div>
            )}
          </Modal>
        )}
      </div>
    </ConfigProvider>
  );
}
