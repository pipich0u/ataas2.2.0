import { AppstoreOutlined, CloseOutlined, CopyOutlined, DownloadOutlined, PlusOutlined, TableOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, message, Modal, Popover, Segmented, Select, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import * as yaml from 'js-yaml';
import { FileCode2, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MonacoEditor } from '../../../components/shared/MonacoEditor';
import { CLUSTER_OPERATIONS_RESOURCE_TREE } from './clusterOperationsRuntime';
import { MODEL_OPS_RESOURCE_SPECS } from './modelOpsResourceSpec';
import { buildPodYaml, buildServiceEntryYaml, buildServiceYaml, clusterGroupNames, createManualPod, createManualService, createManualServiceEntry, K8sPodResource, K8sServiceEntryResource, K8sServiceResource, useK8sResourceStore } from './k8sResourceStore';

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
  podList: { name: string; ip: string; status: string }[];
  age: string;
};

type PodRow = {
  key: string;
  name: string;
  cluster: string;
  provider: string;
  dataCenter: string;
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
  cluster: string;
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

const SE_RESOURCE_FILES: Record<string, string> = {
  'se/llm-external-api.yaml': `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: llm-external-api
  namespace: higress-system
spec:
  hosts:
    - api.openai.com
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  resolution: DNS
  location: MESH_EXTERNAL`,
  'se/internal-model-server.yaml': `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: internal-model-server
  namespace: higress-system
spec:
  hosts:
    - model-server.internal.cluster.local
  addresses:
    - 10.100.0.100
  ports:
    - number: 8000
      name: http
      protocol: HTTP
  resolution: STATIC
  endpoints:
    - address: 10.100.0.101
      weight: 80
    - address: 10.100.0.102
      weight: 20`,
  'se/external-database.yaml': `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-database
  namespace: higress-system
spec:
  hosts:
    - db.cloud-service.com
  ports:
    - number: 5432
      name: tcp
      protocol: TCP
  resolution: DNS
  location: MESH_EXTERNAL`,
};

const SVC_RESOURCE_FILES: Record<string, string> = {
  'svc/sh-prod-router.yaml': `apiVersion: v1
kind: Service
metadata:
  name: sh-prod-router
  namespace: default
  labels:
    app: sh-prod-router
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
spec:
  type: ClusterIP
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
  ports:
    - name: http
      protocol: TCP
      port: 8000
      targetPort: 8000`,
  'svc/sh-prod-llm-1.yaml': `apiVersion: v1
kind: Service
metadata:
  name: sh-prod-llm-1
  namespace: default
  labels:
    app: sh-prod-llm-1
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-llm-1
    rolebasedgroup.workloads.x-k8s.io/role: prefill
spec:
  type: ClusterIP
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-llm-1
    rolebasedgroup.workloads.x-k8s.io/role: prefill
  ports:
    - name: http
      protocol: TCP
      port: 8000
      targetPort: 8000`,
  'svc/sh-prod-llm-2.yaml': `apiVersion: v1
kind: Service
metadata:
  name: sh-prod-llm-2
  namespace: default
  labels:
    app: sh-prod-llm-2
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-llm-2
    rolebasedgroup.workloads.x-k8s.io/role: decode
spec:
  type: ClusterIP
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: sh-prod-llm-2
    rolebasedgroup.workloads.x-k8s.io/role: decode
  ports:
    - name: http
      protocol: TCP
      port: 8000
      targetPort: 8000`,
  'svc/zz-prod-router.yaml': `apiVersion: v1
kind: Service
metadata:
  name: zz-prod-router
  namespace: default
  labels:
    app: zz-prod-router
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: zz-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
spec:
  type: NodePort
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: zz-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
  ports:
    - name: http
      protocol: TCP
      port: 8000
      targetPort: 8000
      nodePort: 30080`,
  'svc/bj-prod-router.yaml': `apiVersion: v1
kind: Service
metadata:
  name: bj-prod-router
  namespace: default
  labels:
    app: bj-prod-router
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: bj-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
spec:
  type: ClusterIP
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: bj-prod-router
    rolebasedgroup.workloads.x-k8s.io/role: router
  ports:
    - name: http
      protocol: TCP
      port: 8000
      targetPort: 8000`,
  'svc/zj-llm-router.yaml': `apiVersion: v1
kind: Service
metadata:
  name: zj-llm-router
  namespace: default
  labels:
    app: zj-llm-router
    monitoring: scrape
    rolebasedgroup.workloads.x-k8s.io/name: zj-llm-router
    rolebasedgroup.workloads.x-k8s.io/role: router
spec:
  type: LoadBalancer
  selector:
    rolebasedgroup.workloads.x-k8s.io/name: zj-llm-router
    rolebasedgroup.workloads.x-k8s.io/role: router
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 8000`,
};

const includesKeyword = (content: string, keyword: string) => (
  !keyword || content.toLowerCase().includes(keyword)
);

type PodOwnership = { provider: string; dataCenter: string };

const CLUSTER_OWNERSHIP = new Map<string, PodOwnership>(
  CLUSTER_OPERATIONS_RESOURCE_TREE.flatMap((provider) => provider.dcs.flatMap((dataCenter) => (
    dataCenter.clusters.map((cluster) => [
      cluster.key,
      { provider: provider.name, dataCenter: dataCenter.name },
    ] as [string, PodOwnership])
  ))),
);

const DEV_POD_CLUSTER_OPTIONS = CLUSTER_OPERATIONS_RESOURCE_TREE.flatMap((provider) => (
  provider.dcs.flatMap((dataCenter) => dataCenter.clusters.map((cluster) => ({
    value: cluster.key,
    label: `${cluster.name} · ${dataCenter.name} / ${provider.name}`,
  })))
));

const getPodOwnership = (cluster: string): PodOwnership => (
  CLUSTER_OWNERSHIP.get(cluster) || { provider: '未归属', dataCenter: '未归属数据中心' }
);

export default function ClusterResourceTables({
  className,
  view: initialView,
  selectedClusterKey,
  globalPodView = false,
  podClusterKeys,
  globalResourceView = false,
  resourceClusterKeys,
}: {
  className?: string;
  view: ResourceView;
  selectedClusterKey?: string;
  globalPodView?: boolean;
  podClusterKeys?: string[];
  globalResourceView?: boolean;
  resourceClusterKeys?: string[];
}) {
  const [keyword, setKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [podScope, setPodScope] = useState<PodScope | null>(null);
  const [namespaceFilter, setNamespaceFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [dataCenterFilter, setDataCenterFilter] = useState('all');
  const [clusterFilter, setClusterFilter] = useState('all');
  const [podStatus, setPodStatus] = useState('all');
  const [podRole, setPodRole] = useState('all');
  const [devPodOpen, setDevPodOpen] = useState(false);
  const [devPodStep, setDevPodStep] = useState<'form' | 'preview'>('form');
  const [devPodMode, setDevPodMode] = useState<'form' | 'yaml'>('form');
  const [devPodYaml, setDevPodYaml] = useState('');
  const [editingService, setEditingService] = useState<K8sServiceResource | null>(null);
  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [createServiceYaml, setCreateServiceYaml] = useState('');
  const [createServiceFileKey, setCreateServiceFileKey] = useState('');
  const [createServiceShowTree, setCreateServiceShowTree] = useState(false);
  const [createServiceEntryOpen, setCreateServiceEntryOpen] = useState(false);
  const [createServiceEntryYaml, setCreateServiceEntryYaml] = useState('');
  const [createServiceEntryFileKey, setCreateServiceEntryFileKey] = useState('');
  const [createServiceEntryShowTree, setCreateServiceEntryShowTree] = useState(false);
  const [editingPod, setEditingPod] = useState<K8sPodResource | null>(null);
  const [editPodOpen, setEditPodOpen] = useState(false);
  const [editingServiceEntry, setEditingServiceEntry] = useState<K8sServiceEntryResource | null>(null);
  const [editServiceEntryOpen, setEditServiceEntryOpen] = useState(false);
  const [devPodDraft, setDevPodDraft] = useState<DevPodDraft>({
    name: '',
    cluster: selectedClusterKey || '',
    namespace: 'devpods',
    owner: 'admin',
    node: '',
    template: devPodTemplates[0].value,
    collaborators: '',
    expiresIn: '24h',
  });
  const clusterScopeKeys = resourceClusterKeys ?? podClusterKeys;
  const usesGlobalClusterScope = globalPodView || globalResourceView;
  const currentCluster = selectedClusterKey || clusterScopeKeys?.[0] || 'default';
  const normalizedKeyword = keyword.trim().toLowerCase();
  const resourceStore = useK8sResourceStore();
  const { serviceEntries, services, pods } = resourceStore.state;
  const resourceClusterScopeKey = clusterScopeKeys === undefined
    ? '*'
    : [...new Set(clusterScopeKeys)].sort((a, b) => a.localeCompare(b)).join('|');

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

  const storeServiceRows = useMemo<ServiceRow[]>(() => services.map((service) => {
    const specIndex = MODEL_OPS_RESOURCE_SPECS.findIndex((s) => s.name === service.name);
    const groups = clusterGroupNames[service.cluster] || [];
    let routerPod: K8sPodResource | undefined;
    if (specIndex !== -1 && groups.length > 0) {
      const groupName = groups[specIndex % groups.length];
      routerPod = pods.find((p) => p.role === 'router' && p.group === groupName);
    }
    return {
      key: service.id,
      name: service.name,
      se: seNameMap.get(service.id) || service.serviceEntryId || '-',
      cluster: service.cluster,
      namespace: service.namespace,
      clusterIP: service.clusterIP,
      type: service.type,
      ports: service.ports,
      endpoints: serviceEndpointMap.get(service.id) || [],
      pods: routerPod ? 1 : 0,
      podList: routerPod ? [{ name: routerPod.name, ip: routerPod.podIP, status: routerPod.status }] : [],
      age: service.createdAt,
    };
  }), [services, seNameMap, serviceEndpointMap, pods]);

  const storePodRows = useMemo<PodRow[]>(() => pods.map((pod) => {
    const ownership = getPodOwnership(pod.cluster);
    return {
      key: pod.id,
      name: pod.name,
      cluster: pod.cluster,
      provider: ownership.provider,
      dataCenter: ownership.dataCenter,
      namespace: pod.namespace,
      group: pod.group || '-',
      role: pod.role,
      category: ['router', 'prefill', 'decode'].includes(pod.role) ? 'inference'
        : ['store', 'master', 'etcd'].includes(pod.role) ? 'dependency'
        : 'other',
      ready: pod.ready,
      status: pod.status === 'Draft' ? 'Pending' : pod.status,
      restart: pod.restart,
      image: pod.image,
      ip: pod.podIP,
      node: pod.node,
      age: pod.age,
    };
  }), [pods]);

  useEffect(() => {
    setPodScope(null);
    setNamespaceFilter('all');
    setProviderFilter('all');
    setDataCenterFilter('all');
    setClusterFilter('all');
    setPodStatus('all');
    setPodRole('all');
    setKeyword('');
    setDevPodOpen(false);
    setDevPodStep('form');
  }, [globalPodView, globalResourceView, resourceClusterScopeKey, selectedClusterKey]);

  useEffect(() => {
    if (initialView !== 'pod' || globalPodView) return undefined;
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
      setPodRole('all');
      setKeyword('');
    };
    window.addEventListener('ataas:pod-scope-change', applyPodScope);
    return () => window.removeEventListener('ataas:pod-scope-change', applyPodScope);
  }, [globalPodView, initialView]);

  useEffect(() => {
    if (initialView !== 'se') return undefined;
    const handler = (event: Event) => {
      const name = (event as CustomEvent<string>).detail;
      if (name) setKeyword(name);
    };
    window.addEventListener('ataas:se-search', handler);
    return () => window.removeEventListener('ataas:se-search', handler);
  }, [initialView]);

  const scopedServiceRows = useMemo(
    () => {
      if (!usesGlobalClusterScope) return storeServiceRows.filter((row) => row.cluster === currentCluster);
      if (resourceClusterScopeKey === '*') return storeServiceRows;
      if (!resourceClusterScopeKey) return [];
      const allowedClusters = new Set(resourceClusterScopeKey.split('|'));
      return storeServiceRows.filter((row) => allowedClusters.has(row.cluster));
    },
    [currentCluster, resourceClusterScopeKey, storeServiceRows, usesGlobalClusterScope],
  );
  const scopedPodRows = useMemo(() => {
    if (!globalPodView) return storePodRows.filter((row) => row.cluster === currentCluster);
    if (resourceClusterScopeKey === '*') return storePodRows;
    if (!resourceClusterScopeKey) return [];
    const allowedClusters = new Set(resourceClusterScopeKey.split('|'));
    return storePodRows.filter((row) => allowedClusters.has(row.cluster));
  }, [currentCluster, globalPodView, resourceClusterScopeKey, storePodRows]);
  const effectivePodRows = useMemo(() => {
    if (globalPodView) return scopedPodRows;
    if (podScope?.pods) return podScope.pods.map((row) => ({ ...row, canOpenGroup: true }));
    if (!podScope) return scopedPodRows;
    return scopedPodRows.filter((row) => (
      row.cluster === podScope.cluster && row.group === podScope.group
    ));
  }, [globalPodView, podScope, scopedPodRows]);

  const providerOptions = useMemo(() => [
    { value: 'all', label: '全部供应商' },
    ...Array.from(new Set(effectivePodRows.map((row) => row.provider)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value })),
  ], [effectivePodRows]);
  const dataCenterOptions = useMemo(() => [
    { value: 'all', label: '全部数据中心' },
    ...Array.from(new Set(effectivePodRows
      .filter((row) => providerFilter === 'all' || row.provider === providerFilter)
      .map((row) => row.dataCenter)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value })),
  ], [effectivePodRows, providerFilter]);
  const clusterOptions = useMemo(() => [
    { value: 'all', label: '全部集群' },
    ...Array.from(new Set(effectivePodRows
      .filter((row) => providerFilter === 'all' || row.provider === providerFilter)
      .filter((row) => dataCenterFilter === 'all' || row.dataCenter === dataCenterFilter)
      .map((row) => row.cluster)))
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: value })),
  ], [dataCenterFilter, effectivePodRows, providerFilter]);
  const ownerFilteredPodRows = useMemo(() => effectivePodRows.filter((row) => (
    (providerFilter === 'all' || row.provider === providerFilter)
    && (dataCenterFilter === 'all' || row.dataCenter === dataCenterFilter)
    && (clusterFilter === 'all' || row.cluster === clusterFilter)
  )), [clusterFilter, dataCenterFilter, effectivePodRows, providerFilter]);

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
  const scopedRouteData = useMemo(() => {
    if (!usesGlobalClusterScope) return storeRouteData.filter((row) => row.cluster === currentCluster);
    if (resourceClusterScopeKey === '*') return storeRouteData;
    if (!resourceClusterScopeKey) return [];
    const allowedClusters = new Set(resourceClusterScopeKey.split('|'));
    return storeRouteData.filter((row) => allowedClusters.has(row.cluster));
  }, [currentCluster, resourceClusterScopeKey, storeRouteData, usesGlobalClusterScope]);

  const podNamespaceRows = useMemo(
    () => ownerFilteredPodRows.filter((row) => namespaceFilter === 'all' || row.group === namespaceFilter),
    [namespaceFilter, ownerFilteredPodRows],
  );
  const serviceNamespaceRows = useMemo(
    () => scopedServiceRows.filter((row) => namespaceFilter === 'all' || row.namespace === namespaceFilter),
    [namespaceFilter, scopedServiceRows],
  );
  const routeNamespaceRows = useMemo(
    () => scopedRouteData.filter((row) => namespaceFilter === 'all' || row.namespace === namespaceFilter),
    [namespaceFilter, scopedRouteData],
  );
  const namespaceOptions = useMemo(() => {
    const values = initialView === 'pod'
      ? ownerFilteredPodRows.map((row) => row.group)
      : initialView === 'se'
      ? scopedRouteData.map((row) => row.namespace)
      : scopedServiceRows.map((row) => row.namespace);
    return [
      { value: 'all', label: initialView === 'pod' ? '全部组' : '全部命名空间' },
      ...Array.from(new Set(values))
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    ];
  }, [initialView, ownerFilteredPodRows, scopedRouteData, scopedServiceRows]);
  const roleOptions = useMemo(() => {
    const roles = Array.from(new Set(ownerFilteredPodRows.map((row) => row.role)));
    return [
      { value: 'all', label: '全部角色' },
      ...roles.sort((a, b) => a.localeCompare(b)).map((role) => ({ value: role, label: role.toUpperCase() })),
    ];
  }, [ownerFilteredPodRows]);
  const nodeOptions = useMemo(() => {
    const clusterNodes = scopedPodRows
      .filter((row) => !globalPodView || row.cluster === devPodDraft.cluster)
      .map((row) => row.node)
      .filter((node) => node && node !== '自动调度');
    return Array.from(new Set(clusterNodes))
      .sort((a, b) => a.localeCompare(b))
      .map((node) => ({ value: node, label: node }));
  }, [devPodDraft.cluster, globalPodView, scopedPodRows]);

  const filteredServices = useMemo(() => serviceNamespaceRows.filter((row) => includesKeyword(
    `${row.name} ${row.se} ${row.namespace} ${row.clusterIP} ${row.type}`,
    normalizedKeyword,
  )), [serviceNamespaceRows, normalizedKeyword]);

  const filteredPods = useMemo(() => podNamespaceRows.filter((row) => {
    if (podStatus !== 'all' && row.status !== podStatus) return false;
    if (podRole !== 'all' && row.role !== podRole) return false;
    return includesKeyword(
      `${row.name} ${row.provider} ${row.dataCenter} ${row.cluster} ${row.namespace} ${row.group} ${row.category} ${row.role} ${row.status} ${row.image} ${row.ip} ${row.node}`,
      normalizedKeyword,
    );
  }), [normalizedKeyword, podNamespaceRows, podStatus, podRole]);

  const filteredRoutes = useMemo(() => routeNamespaceRows.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.hosts.join(' ')} ${row.endpoints.map((endpoint) => endpoint.address).join(' ')}`,
    normalizedKeyword,
  )), [normalizedKeyword, routeNamespaceRows]);

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
        description: globalPodView
          ? '汇总所有供应商、数据中心和集群的 Pod 资源'
          : podScope
          ? `查看 ${podScope.group} 的全部 Pod 资源`
          : '查看 Pod 的运行状态、调度节点与重启情况',
        placeholder: globalPodView
          ? '搜索 Pod / Group / 供应商 / 数据中心 / 集群 / IP / Node'
          : '搜索 Pod 名称 / IP / Node',
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
        description: globalResourceView
          ? '查看当前左侧筛选范围内的 Service 访问地址、端口与关联后端'
          : '查看 Service 的访问地址、端口与关联后端',
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
        description: globalResourceView
          ? '查看当前左侧筛选范围内的网格出口服务、主机与端点配置'
          : '查看网格出口服务、主机与端点配置',
        placeholder: '搜索 ServiceEntry / Host / Endpoint',
        summary: [
          { label: 'ServiceEntry 总数', value: routeNamespaceRows.length },
          { label: 'Hosts', value: routeNamespaceRows.reduce((sum, row) => sum + row.hosts.length, 0) },
          { label: 'Ports', value: routeNamespaceRows.reduce((sum, row) => sum + row.ports.length, 0) },
          { label: 'Endpoints', value: routeNamespaceRows.reduce((sum, row) => sum + row.endpoints.length, 0) },
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
  }, [globalPodView, globalResourceView, initialView, podNamespaceRows, podScope, routeNamespaceRows, serviceNamespaceRows]);

  const selectedDevPodTemplate = devPodTemplates.find((template) => template.value === devPodDraft.template)
    || devPodTemplates[0];
  const formPreviewDevPod = useMemo(() => createManualPod({
    name: devPodDraft.name || 'my-devpod',
    cluster: devPodDraft.cluster || currentCluster,
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
    devPodDraft.cluster,
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
      cluster: devPodDraft.cluster || currentCluster,
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
    devPodDraft.cluster,
    devPodMode,
    devPodYaml,
    formPreviewDevPod,
    parsedDevPodYaml,
    selectedDevPodTemplate.image,
  ]);

  const openDevPodCreator = () => {
    setDevPodDraft({
      name: '',
      cluster: globalPodView
        ? (clusterFilter !== 'all' ? clusterFilter : clusterScopeKeys?.[0] || scopedPodRows[0]?.cluster || 'st')
        : currentCluster,
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
    } else if (!devPodDraft.cluster || !devPodDraft.name.trim() || !devPodDraft.owner.trim()) {
      message.warning('请选择目标集群，并填写 DevPod 名称和 Owner');
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
    setNamespaceFilter('all');
    setPodStatus('all');
    setPodRole('all');
    if (globalPodView) {
      const ownership = getPodOwnership(previewDevPod.cluster);
      setProviderFilter(ownership.provider);
      setDataCenterFilter(ownership.dataCenter);
      setClusterFilter(previewDevPod.cluster);
    }
    setKeyword(previewDevPod.name);
    message.success(`${previewDevPod.name} 已提交创建`);
  };

  const ownershipColumnWidth = useMemo(() => {
    const clusters = initialView === 'pod'
      ? effectivePodRows.map((row) => row.cluster)
      : initialView === 'svc'
      ? scopedServiceRows.map((row) => row.cluster)
      : scopedRouteData.map((row) => row.cluster);
    const estimateLabelWidth = (value: string) => (
      [...value].reduce((width, char) => width + (/^[\x00-\x7F]$/.test(char) ? 7 : 12), 16)
    );
    const widest = clusters.reduce((width, cluster) => {
      const ownership = getPodOwnership(cluster);
      return Math.max(width, estimateLabelWidth(ownership.provider)
        + estimateLabelWidth(ownership.dataCenter)
        + estimateLabelWidth(cluster)
        + 12);
    }, 320);
    return Math.min(520, Math.max(320, widest));
  }, [effectivePodRows, initialView, scopedRouteData, scopedServiceRows]);

  const renderResourceOwnership = (cluster: string) => {
    const ownership = getPodOwnership(cluster);
    return (
      <div className="resource-ownership-tags">
        <span title={ownership.provider}>{ownership.provider}</span>
        <span title={ownership.dataCenter}>{ownership.dataCenter}</span>
        <span title={cluster}>{cluster}</span>
      </div>
    );
  };

  const serviceOwnershipColumns: ColumnsType<ServiceRow> = globalResourceView ? [{
    title: '资源归属',
    key: 'ownership',
    width: ownershipColumnWidth,
    className: 'resource-ownership-column',
    render: (_value, row) => renderResourceOwnership(row.cluster),
  }] : [];

  const routeOwnershipColumns: ColumnsType<RouteEntry> = globalResourceView ? [{
    title: '资源归属',
    key: 'ownership',
    width: ownershipColumnWidth,
    className: 'resource-ownership-column',
    render: (_value, row) => renderResourceOwnership(row.cluster),
  }] : [];

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 150, render: (value) => <span className="resource-list-text">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    ...serviceOwnershipColumns,
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
      width: 500,
      render: (endpoints: EndpointInfo[]) => endpoints.length > 0 ? (
        <Popover
          placement="right"
          title="Endpoints"
          content={endpoints.map((endpoint) => (
            <div key={endpoint.address} style={{ padding: '2px 0', fontSize: 12, whiteSpace: 'nowrap' }}>
              <span className="resource-list-code">{endpoint.address}</span>
            </div>
          ))}
        >
          <div style={{ whiteSpace: 'nowrap', cursor: 'pointer', textDecoration: 'underline dashed #888', textUnderlineOffset: 3 }}>
            {endpoints.map((endpoint, index) => (
              <span key={`${endpoint.address}-${index}`} className="resource-list-code" style={{ marginRight: 8 }}>{endpoint.address}</span>
            ))}
          </div>
        </Popover>
      ) : (
        <span className="resource-list-muted">-</span>
      ),
    },
    {
      title: 'POD',
      key: 'pods',
      width: 90,
      render: (_: unknown, row: ServiceRow) => row.podList.length > 0 ? (
        <Popover
          placement="right"
          title={`关联 Router Pod（${row.pods}）`}
          content={row.podList.map((pod) => (
            <div key={pod.name} style={{ padding: '2px 0', display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, whiteSpace: 'nowrap' }}>
              <span className={`resource-list-status is-${pod.status.toLowerCase()}`}><i /></span>
              <span style={{ fontWeight: 500 }}>{pod.name}</span>
              <span className="resource-list-code">{pod.ip}</span>
            </div>
          ))}
        >
          <span style={{ cursor: 'pointer', textDecoration: 'underline dashed #888', textUnderlineOffset: 3 }}>{row.pods}</span>
        </Popover>
      ) : (
        <span>{row.pods}</span>
      ),
    },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 150, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_: unknown, row: ServiceRow) => {
        const service = services.find((s) => s.id === row.key);
        return (
          <span style={{ whiteSpace: 'nowrap', fontSize: 12 }} onClick={(e) => e.stopPropagation()}>
            <Button
              type="link"
              size="small"
              style={{ fontSize: 12, padding: '0 4px', color: '#888' }}
              icon={<Pencil size={12} />}
              onClick={() => {
                if (service) {
                  setEditingService(JSON.parse(JSON.stringify(service)));
                  setEditServiceOpen(true);
                }
              }}
            >编辑</Button>
            <Button
              type="link"
              danger
              size="small"
              style={{ fontSize: 12, padding: '0 4px' }}
              icon={<Trash2 size={12} />}
              onClick={() => {
                if (service) {
                  Modal.confirm({
                    title: '确认删除',
                    content: `确定要删除 Service「${service.name}」吗？`,
                    okText: '删除',
                    okType: 'danger',
                    cancelText: '取消',
                    onOk: () => {
                      resourceStore.removeService(service.id);
                      message.success('Service 已删除');
                    },
                  });
                }
              }}
            >删除</Button>
          </span>
        );
      },
    },
  ];

  const podOwnershipColumns: ColumnsType<PodRow> = globalPodView ? [{
    title: '资源归属',
    key: 'ownership',
    width: ownershipColumnWidth,
    className: 'resource-ownership-column',
    render: (_value, row) => renderResourceOwnership(row.cluster),
  }] : [];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'Pod', dataIndex: 'name', key: 'name', width: globalPodView ? 206 : 230, render: (value) => <span className="resource-list-name">{value}</span> },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
      width: 130,
      render: (value, row) => row.role === 'business' ? (
        <span className="resource-devpod-group">DevPod</span>
      ) : (
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
      ),
    },
    ...podOwnershipColumns,
    { title: 'Pod IP', dataIndex: 'ip', key: 'ip', width: globalPodView ? 159 : 130, className: 'resource-pod-ip-column', render: (value) => <span className="resource-list-code">{value}</span> },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: globalPodView ? 138 : 100,
      render: (value) => (
        <span className={`resource-role-tag is-${value}`}>
          {value === 'business' ? 'DEV' : value === 'dev' ? 'DEV' : value === 'master' ? 'MASTER' : value === 'store' ? 'STORE' : value === 'etcd' ? 'ETCD' : String(value).toUpperCase()}
        </span>
      ),
    },
    { title: 'Ready', dataIndex: 'ready', key: 'ready', width: globalPodView ? 104 : 80 },
    {
      title: 'Phase',
      dataIndex: 'status',
      key: 'status',
      width: globalPodView ? 140 : 120,
      render: (value) => (
        <span className={`resource-list-status is-${String(value).toLowerCase()}`}>
          <i />
          {value}
        </span>
      ),
    },
    { title: '重启次数', dataIndex: 'restart', key: 'restart', width: globalPodView ? 87 : 100 },
    { title: 'Node', dataIndex: 'node', key: 'node', width: globalPodView ? 147 : 160, render: (value, row) => value && value !== '自动调度' ? (
      <button
        type="button"
        className="resource-group-link"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('ataas:node-focus', {
            detail: { nodeName: value, cluster: row.cluster },
          }));
          document.querySelector<HTMLElement>(
            '.cluster-operations-homepage .module-tab[data-view="nodes"]',
          )?.click();
        }}
      >
        {value}
      </button>
    ) : <span className="is-nowrap">{value}</span> },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: globalPodView ? 113 : 120, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
    {
      title: '操作',
      key: 'action',
      width: globalPodView ? 190 : 200,
      fixed: 'right',
      render: (_value, row) => {
        const isDevPod = row.role === 'dev' || row.role === 'business';
        return (
          <span className="ataas-unified-table-actions" onClick={(e) => e.stopPropagation()}>
            {isDevPod && (
              <Button
                type="text"
                size="small"
                className="ataas-unified-table-action-button"
                icon={<Pencil size={12} />}
                onClick={() => {
                  const pod = pods.find((p) => p.id === row.key);
                  if (pod) {
                    setEditingPod(JSON.parse(JSON.stringify(pod)));
                    setEditPodOpen(true);
                  }
                }}
              >
                编辑
              </Button>
            )}
            <Button
              type="text"
              size="small"
              className="ataas-unified-table-action-button"
              icon={<RefreshCw size={12} />}
              onClick={() => {
                Modal.confirm({
                  title: '重建 Pod',
                  content: `确定要重建 ${row.name} 吗？`,
                  centered: true,
                  okText: '确定',
                  cancelText: '取消',
                  onOk: () => {
                    message.success(`Pod ${row.name} 已提交重建`);
                  },
                });
              }}
            >
              重建
            </Button>
            <Button
              type="text"
              size="small"
              danger
              className="ataas-unified-table-action-button danger"
              icon={<Trash2 size={12} />}
              onClick={() => {
                Modal.confirm({
                  title: '删除 Pod',
                  content: `确定要删除 ${row.name} 吗？`,
                  centered: true,
                  okText: '删除',
                  okButtonProps: { danger: true },
                  cancelText: '取消',
                  onOk: () => {
                    message.success(`Pod ${row.name} 已删除`);
                  },
                });
              }}
            >
              删除
            </Button>
          </span>
        );
      },
    },
  ];

  const serviceEntryColumns: ColumnsType<RouteEntry> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    ...routeOwnershipColumns,
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
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, row: RouteEntry) => (
        <Button type="link" size="small" style={{ fontSize: 12, padding: '0 4px', color: '#888' }}
          onClick={() => {
            const entry = resourceStore.state.serviceEntries.find(e => e.id === row.key);
            if (entry) { setEditingServiceEntry(entry); setEditServiceEntryOpen(true); }
          }}
        >
          编辑
        </Button>
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
      className={`group-list-table cluster-resource-list-table${globalResourceView ? ' is-global-resource-table' : ''}`}
      rowKey="key"
      columns={serviceEntryColumns}
      dataSource={filteredRoutes}
      tableLayout="fixed"
      scroll={{ x: 1110 + (globalResourceView ? ownershipColumnWidth : 0) }}
      pagination={pagination}
      locale={{ emptyText: '暂无 ServiceEntry 数据' }}
    />
  ) : initialView === 'svc' ? (
    <Table<ServiceRow>
      className={`group-list-table cluster-resource-list-table${globalResourceView ? ' is-global-resource-table' : ''}`}
      rowKey="key"
      columns={serviceColumns}
      dataSource={filteredServices}
      tableLayout="fixed"
      scroll={{ x: 1920 + (globalResourceView ? ownershipColumnWidth : 0) }}
      pagination={pagination}
      locale={{ emptyText: '暂无 Service 数据' }}
    />
  ) : initialView === 'pod' ? (
    <Table<PodRow>
      className={`group-list-table cluster-resource-list-table${globalPodView ? ' is-global-pod-table' : ''}`}
      rowKey="key"
      columns={podColumns}
      dataSource={filteredPods}
      tableLayout="fixed"
      scroll={{ x: globalPodView ? 1687 - 273 + ownershipColumnWidth : 1460 }}
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

        <div className={`group-table-toolbar${initialView === 'pod' ? ` resource-pod-toolbar${globalPodView ? ' is-global' : ''}` : ''}`}>
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
            {initialView === 'pod' && globalPodView && (
              <Select
                className="resource-provider-select"
                value={providerFilter}
                onChange={(value) => {
                  setProviderFilter(value);
                  setDataCenterFilter('all');
                  setClusterFilter('all');
                  setNamespaceFilter('all');
                }}
                options={providerOptions}
              />
            )}
            {initialView === 'pod' && globalPodView && (
              <Select
                className="resource-datacenter-select"
                value={dataCenterFilter}
                onChange={(value) => {
                  setDataCenterFilter(value);
                  setClusterFilter('all');
                  setNamespaceFilter('all');
                }}
                options={dataCenterOptions}
              />
            )}
            {initialView === 'pod' && globalPodView && (
              <Select
                className="resource-cluster-select"
                value={clusterFilter}
                onChange={(value) => {
                  setClusterFilter(value);
                  setNamespaceFilter('all');
                }}
                options={clusterOptions}
              />
            )}
            {(initialView === 'pod' || initialView === 'svc' || initialView === 'se') && (
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
            {initialView === 'pod' && (
              <Select
                className="resource-pod-role-select"
                value={podRole}
                onChange={setPodRole}
                options={roleOptions}
              />
            )}
            {initialView === 'pod' && podScope ? (
              <div className="resource-pod-scope">
                <span><small>Group</small>{podScope.group}</span>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setPodScope(null);
                    setNamespaceFilter('all');
                    setPodStatus('all');
                    setPodRole('all');
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
              className="resource-create-devpod ataas-page-create-button"
              icon={<PlusOutlined />}
              onClick={openDevPodCreator}
            >
              新建 DevPod
            </Button>
          ) : initialView === 'svc' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="ataas-cr-view-toggle">
                <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                  <TableOutlined size={12} />列表
                </button>
                <i className="ataas-cr-view-divider" />
                <button type="button" className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>
                  <AppstoreOutlined />卡片
                </button>
              </span>
              <Button
              type="primary"
              className="resource-create-devpod ataas-page-create-button"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateServiceYaml(buildServiceYaml({
                  id: '',
                  kind: 'Service',
                  name: 'my-service',
                  cluster: currentCluster,
                  namespace: 'default',
                  clusterIP: '10.43.100.100',
                  type: 'ClusterIP',
                  ports: [{ name: 'http', port: 8000, targetPort: 8000, protocol: 'TCP' }],
                  selector: { app: 'my-app' },
                  labels: { app: 'my-app' },
                  podIds: [],
                  source: 'manual',
                  status: 'Draft',
                  yaml: '',
                  createdAt: new Date().toISOString(),
                }));
                setCreateServiceOpen(true);
              }}
            >
              新建 Service
            </Button>
            </div>
          ) : initialView === 'se' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="ataas-cr-view-toggle">
                <button type="button" className={viewMode === 'table' ? 'active' : ''} onClick={() => setViewMode('table')}>
                  <TableOutlined size={12} />列表
                </button>
                <i className="ataas-cr-view-divider" />
                <button type="button" className={viewMode === 'card' ? 'active' : ''} onClick={() => setViewMode('card')}>
                  <AppstoreOutlined />卡片
                </button>
              </span>
              <Button
              type="primary"
              className="resource-create-devpod resource-create-service-entry ataas-page-create-button"
              icon={<PlusOutlined />}
              onClick={() => {
                setCreateServiceEntryShowTree(true);
                setCreateServiceEntryOpen(true);
              }}
            >
              新建 ServiceEntry
            </Button>
            </div>
          ) : null}
        </div>

        {viewMode === 'card' && initialView === 'svc' ? (
            <div className="ataas-cr-card-grid">
              {filteredServices.map((svc) => (
                <div key={svc.key} className="ataas-cr-card">
                  <header>
                    <span className="ataas-cr-card-icon"><FileCode2 size={18} /></span>
                    <div>
                      <strong>{svc.name}</strong>
                      <small>{svc.cluster} · {svc.namespace}</small>
                    </div>
                    <span className="resource-kind-tag">{svc.type}</span>
                  </header>
                  <div className="ataas-cr-card-body">
                    <div className="ataas-cr-card-simple-row"><span>Cluster IP</span><strong>{svc.clusterIP}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>关联 SE</span><strong>{svc.se || '-'}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>端口</span><strong>{svc.ports.length > 0 ? svc.ports.map((p) => `${p.port}/${p.protocol.toLowerCase()}`).join(', ') : '-'}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>Endpoints</span><strong>{svc.endpoints.length > 0 ? svc.endpoints[0].address + (svc.endpoints.length > 1 ? ` 等${svc.endpoints.length}个` : '') : '-'}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>Pods</span><strong>{svc.pods > 0 ? `${svc.pods} 个 · ${svc.podList.map((p) => p.name).join(', ')}` : '-'}</strong></div>
                  </div>
                  <footer>
                    <Button className="ataas-cr-card-action" icon={<Pencil size={12} />} onClick={() => {
                      const service = services.find((s) => s.id === svc.key);
                      if (service) { setEditingService(JSON.parse(JSON.stringify(service))); setEditServiceOpen(true); }
                    }}>编辑</Button>
                    <Button className="ataas-cr-card-action" icon={<Trash2 size={12} />} onClick={() => {
                      const service = services.find((s) => s.id === svc.key);
                      if (service) {
                        Modal.confirm({
                          title: '确认删除',
                          content: `确定要删除 Service「${service.name}」吗？`,
                          okText: '删除',
                          okType: 'danger',
                          cancelText: '取消',
                          onOk: () => { resourceStore.removeService(service.id); message.success('Service 已删除'); },
                        });
                      }
                    }} danger>删除</Button>
                  </footer>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#86909c', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◻</div>
                  <div>暂无 Service 数据</div>
                </div>
              )}
            </div>
          ) : viewMode === 'card' && initialView === 'se' ? (
            <div className="ataas-cr-card-grid">
              {filteredRoutes.map((route) => (
                <div key={route.key} className="ataas-cr-card">
                  <header>
                    <span className="ataas-cr-card-icon"><FileCode2 size={18} /></span>
                    <div>
                      <strong>{route.name}</strong>
                      <small>{route.cluster} · {route.namespace}</small>
                    </div>
                  </header>
                  <div className="ataas-cr-card-body">
                    <div className="ataas-cr-card-simple-row"><span>Hosts</span><strong>{route.hosts.join(', ') || '-'}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>Ports</span><strong>{route.ports.length > 0 ? route.ports.map((p) => `${p.port}/${p.protocol.toLowerCase()}`).join(', ') : '-'}</strong></div>
                    <div className="ataas-cr-card-simple-row"><span>Endpoints</span><strong>{route.endpoints.length > 0 ? route.endpoints.map((ep) => `${ep.address}(${ep.weight}%)`).join(', ') : '-'}</strong></div>
                  </div>
                  <footer>
                    <Button className="ataas-cr-card-action" icon={<Pencil size={12} />} onClick={() => {
                      const se = resourceStore.state.serviceEntries.find((s) => s.id === route.key);
                      if (se) { setEditingServiceEntry(JSON.parse(JSON.stringify(se))); setEditServiceEntryOpen(true); }
                    }}>编辑</Button>
                    <Button className="ataas-cr-card-action" icon={<Trash2 size={12} />} onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除 ServiceEntry「${route.name}」吗？`,
                        okText: '删除',
                        okType: 'danger',
                        cancelText: '取消',
                        onOk: () => { resourceStore.removeServiceEntry(route.key); message.success('ServiceEntry 已删除'); },
                      });
                    }} danger>删除</Button>
                  </footer>
                </div>
              ))}
              {filteredRoutes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#86909c', gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◻</div>
                  <div>暂无 ServiceEntry 数据</div>
                </div>
              )}
            </div>
          ) : <div className="group-table-frame">{table}</div>}

        <Modal
          title="编辑 Service"
          open={editServiceOpen}
          width={760}
          destroyOnClose
          onCancel={() => setEditServiceOpen(false)}
          onOk={() => {
            if (!editingService) return;
            try {
              const parsed = JSON.parse(editingService.yaml);
              if (!parsed) { message.error('无效的 JSON'); return; }
            } catch { /* non-JSON yaml is ok */ }
            resourceStore.update((prev) => ({
              ...prev,
              services: prev.services.map((s) => s.id === editingService.id ? {
                ...editingService,
                yaml: editingService.yaml || buildServiceYaml(editingService),
              } : s),
            }));
            setEditServiceOpen(false);
            message.success('Service 已更新');
          }}
          footer={(_, { OkBtn, CancelBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <CancelBtn /><OkBtn />
            </div>
          )}
        >
          {editingService && (
            <div style={{ height: 420, border: '1px solid #e5e6eb', borderRadius: 6, overflow: 'hidden' }}>
              <MonacoEditor
                value={editingService.yaml || buildServiceYaml(editingService)}
                language="yaml"
                height={420}
                onChange={(value) => setEditingService({ ...editingService, yaml: value })}
                options={{
                  lineNumbers: 'on',
                  folding: true,
                  wordWrap: 'off',
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          )}
        </Modal>

        <Modal
          title="编辑 Pod"
          open={editPodOpen}
          width={760}
          destroyOnClose
          onCancel={() => setEditPodOpen(false)}
          onOk={() => {
            if (!editingPod) return;
            try {
              const parsed = JSON.parse(editingPod.yaml);
              if (!parsed) { message.error('无效的 JSON'); return; }
            } catch { /* non-JSON yaml is ok */ }
            resourceStore.update((prev) => ({
              ...prev,
              pods: prev.pods.map((p) => p.id === editingPod.id ? {
                ...editingPod,
                yaml: editingPod.yaml || buildPodYaml(editingPod),
              } : p),
            }));
            setEditPodOpen(false);
            message.success('Pod 已更新');
          }}
          footer={(_, { OkBtn, CancelBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <CancelBtn /><OkBtn />
            </div>
          )}
        >
          {editingPod && (
            <div style={{ height: 420, border: '1px solid #e5e6eb', borderRadius: 6, overflow: 'hidden' }}>
              <MonacoEditor
                value={editingPod.yaml || buildPodYaml(editingPod)}
                language="yaml"
                height={420}
                onChange={(value) => setEditingPod({ ...editingPod, yaml: value })}
                options={{
                  lineNumbers: 'on',
                  folding: true,
                  wordWrap: 'off',
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          )}
        </Modal>

        <Modal
          title="编辑 ServiceEntry"
          open={editServiceEntryOpen}
          width={760}
          destroyOnClose
          onCancel={() => setEditServiceEntryOpen(false)}
          onOk={() => {
            if (!editingServiceEntry) return;
            try {
              const parsed = yaml.load(editingServiceEntry.yaml || '');
              if (!parsed) { message.error('无效的 YAML'); return; }
            } catch { /* non-yaml content is ok */ }
            resourceStore.update((prev) => ({
              ...prev,
              serviceEntries: prev.serviceEntries.map((e) => e.id === editingServiceEntry.id ? {
                ...editingServiceEntry,
                yaml: editingServiceEntry.yaml || buildServiceEntryYaml(editingServiceEntry),
              } : e),
            }));
            setEditServiceEntryOpen(false);
            message.success('ServiceEntry 已更新');
          }}
          footer={(_, { OkBtn, CancelBtn }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              <CancelBtn /><OkBtn />
            </div>
          )}
        >
          {editingServiceEntry && (
            <div style={{ height: 420, border: '1px solid #e5e6eb', borderRadius: 6, overflow: 'hidden' }}>
              <MonacoEditor
                value={editingServiceEntry.yaml || buildServiceEntryYaml(editingServiceEntry)}
                language="yaml"
                height={420}
                onChange={(value) => setEditingServiceEntry({ ...editingServiceEntry, yaml: value })}
                options={{
                  lineNumbers: 'on',
                  folding: true,
                  wordWrap: 'off',
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          )}
        </Modal>

        <Modal
          title="新建 Service"
          open={createServiceOpen}
          width={880}
          destroyOnClose
          onCancel={() => setCreateServiceOpen(false)}
          onOk={() => {
            if (!createServiceYaml.trim()) {
              message.warning('请输入 YAML 配置');
              return;
            }
            try {
              const parsed = yaml.load(createServiceYaml) as Record<string, unknown>;
              if (!parsed || parsed.kind !== 'Service') {
                message.error('YAML 的 kind 必须为 Service');
                return;
              }
              const metadata = (parsed.metadata || {}) as Record<string, unknown>;
              const spec = (parsed.spec || {}) as Record<string, unknown>;
              const name = String(metadata.name || '');
              const namespace = String(metadata.namespace || 'default');
              const clusterIP = String(spec.clusterIP || '10.43.100.100');
              const type = String(spec.type || 'ClusterIP') as K8sServiceResource['type'];
              const rawPorts = Array.isArray(spec.ports) ? spec.ports : [];
              const rawSelector = (spec.selector || {}) as Record<string, string>;
              const rawLabels = ((metadata.labels || {}) as Record<string, string>);

              const ports = rawPorts.map((p: Record<string, unknown>) => ({
                name: String(p.name || 'http'),
                port: Number(p.port) || 8000,
                targetPort: Number(p.targetPort) || Number(p.port) || 8000,
                nodePort: p.nodePort ? Number(p.nodePort) : undefined,
                protocol: String(p.protocol || 'TCP').toUpperCase() as 'TCP' | 'UDP',
              }));

              const service = createManualService({
                name,
                cluster: currentCluster,
                namespace,
                type,
                port: ports[0]?.port || 8000,
              });
              const newService: K8sServiceResource = {
                ...service,
                clusterIP,
                ports,
                selector: rawSelector,
                labels: rawLabels,
                yaml: createServiceYaml,
                status: 'Running',
              };
              resourceStore.addService(newService);
              setCreateServiceOpen(false);
              setCreateServiceYaml('');
              setCreateServiceFileKey('');
              setCreateServiceShowTree(false);
              message.success(`Service「${name}」已创建`);
            } catch (err) {
              message.error('YAML 解析失败，请检查格式');
            }
          }}
        >
          {createServiceShowTree || createServiceFileKey ? (
            <div style={{ display: 'flex', gap: 0, height: 460 }}>
              <div style={{ width: 200, flexShrink: 0, border: '1px solid #e5e6eb', borderRadius: 6, overflow: 'hidden', background: '#f7f8fa', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#86909c', borderBottom: '1px solid #e5e6eb' }}>资源文件</div>
                <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#86909c', padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>svc</div>
                  {Object.entries(SVC_RESOURCE_FILES).map(([path, content]) => {
                    const name = path.replace('svc/', '');
                    const active = createServiceFileKey === path;
                    return (
                      <div key={path} onClick={() => { setCreateServiceFileKey(path); setCreateServiceYaml(content); }}
                        style={{ padding: '6px 12px 6px 16px', cursor: 'pointer', fontSize: 13, color: active ? '#6951FF' : '#1d2129', background: active ? '#F3F0FF' : 'transparent', borderLeft: active ? '2px solid #6951FF' : '2px solid transparent', margin: '1px 0' }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#eef0f4'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>{name}</span>
                      </div>
                    );
                  })}
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#86909c', padding: '12px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>已有 Service</div>
                  {services.filter((s) => s.cluster === currentCluster).map((s) => {
                    const active = createServiceFileKey === s.id;
                    return (
                      <div key={s.id} onClick={() => { setCreateServiceFileKey(s.id); setCreateServiceYaml(s.yaml || buildServiceYaml(s)); }}
                        style={{ padding: '6px 12px 6px 16px', cursor: 'pointer', fontSize: 13, color: active ? '#6951FF' : '#1d2129', background: active ? '#F3F0FF' : 'transparent', borderLeft: active ? '2px solid #6951FF' : '2px solid transparent', margin: '1px 0' }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#eef0f4'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>{s.name}.yaml</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                {createServiceFileKey ? (
                  <>
                    <div style={{ height: 38, padding: '0 8px 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e6eb', borderRadius: '6px 6px 0 0', borderBottom: '1px solid #eef0f4', color: '#4e5969', background: '#f7f8fa', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
                      <span>{(() => {
                        const matched = Object.entries(SVC_RESOURCE_FILES).find(([k]) => k === createServiceFileKey);
                        if (matched) return matched[0].replace('svc/', '');
                        const svc = services.find((s) => s.id === createServiceFileKey);
                        return svc ? `${svc.name}.yaml` : '';
                      })()}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button type="text" size="small" icon={<CopyOutlined />} aria-label="复制 YAML" title="复制 YAML" onClick={async () => { await navigator.clipboard?.writeText(createServiceYaml); message.success('YAML 已复制'); }} />
                        <Button type="text" size="small" icon={<DownloadOutlined />} aria-label="下载 YAML" title="下载 YAML" onClick={() => { const url = URL.createObjectURL(new Blob([createServiceYaml], { type: 'application/yaml;charset=utf-8' })); const link = document.createElement('a'); link.href = url; const matched = Object.entries(SVC_RESOURCE_FILES).find(([k]) => k === createServiceFileKey); link.download = matched ? matched[0] : (services.find((s) => s.id === createServiceFileKey)?.name + '.yaml') || 'service.yaml'; link.click(); URL.revokeObjectURL(url); message.success('YAML 已下载'); }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, border: '1px solid #e5e6eb', borderTop: 0, borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                      <MonacoEditor value={createServiceYaml} language="yaml" height={420} onChange={setCreateServiceYaml} options={{ lineNumbers: 'on', folding: true, wordWrap: 'off', padding: { top: 12, bottom: 12 } }} />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid #e5e6eb', borderRadius: 6, color: '#c9cdd4', fontSize: 13, background: '#fafafa' }}>
                    请从左侧资源文件中选择
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setCreateServiceShowTree(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, border: '2px dashed #e5e6eb', borderRadius: 8, cursor: 'pointer', color: '#4e5969', fontSize: 14, background: '#fafafa', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6951FF'; e.currentTarget.style.color = '#6951FF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e6eb'; e.currentTarget.style.color = '#4e5969'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode2 size={20} />
                选择 YAML 文件
              </span>
            </div>
          )}
        </Modal>

        <Modal
          title="新建 ServiceEntry"
          open={createServiceEntryOpen}
          width={880}
          destroyOnClose
          onCancel={() => { setCreateServiceEntryOpen(false); setCreateServiceEntryShowTree(false); setCreateServiceEntryYaml(''); setCreateServiceEntryFileKey(''); }}
          onOk={() => {
            if (!createServiceEntryYaml.trim()) {
              message.warning('请输入 YAML 配置');
              return;
            }
            try {
              const parsed = yaml.load(createServiceEntryYaml) as Record<string, unknown>;
              if (!parsed || parsed.kind !== 'ServiceEntry') {
                message.error('YAML 的 kind 必须为 ServiceEntry');
                return;
              }
              const metadata = (parsed.metadata || {}) as Record<string, unknown>;
              const spec = (parsed.spec || {}) as Record<string, unknown>;
              const name = String(metadata.name || '');
              const namespace = String(metadata.namespace || 'higress-system');
              const rawHosts = Array.isArray(spec.hosts) ? spec.hosts.map((h: unknown) => String(h)) : [];
              const rawEndpoints = Array.isArray(spec.endpoints) ? spec.endpoints : [];

              const entry = createManualServiceEntry({
                name,
                cluster: currentCluster,
                namespace,
                hosts: rawHosts,
                yaml: createServiceEntryYaml,
              });
              resourceStore.addServiceEntry(entry);
              setCreateServiceEntryOpen(false);
              setCreateServiceEntryShowTree(false);
              setCreateServiceEntryYaml('');
              setCreateServiceEntryFileKey('');
              message.success(`ServiceEntry「${name}」已创建`);
            } catch (err) {
              message.error('YAML 解析失败，请检查格式');
            }
          }}
        >
          {createServiceEntryShowTree || createServiceEntryFileKey ? (
            <div style={{ display: 'flex', gap: 0, height: 460 }}>
              <div style={{ width: 200, flexShrink: 0, border: '1px solid #e5e6eb', borderRadius: 6, overflow: 'hidden', background: '#f7f8fa', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#86909c', borderBottom: '1px solid #e5e6eb' }}>资源文件</div>
                <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#86909c', padding: '8px 12px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>se</div>
                  {Object.entries(SE_RESOURCE_FILES).map(([path, content]) => {
                    const name = path.replace('se/', '');
                    const active = createServiceEntryFileKey === path;
                    return (
                      <div key={path} onClick={() => { setCreateServiceEntryFileKey(path); setCreateServiceEntryYaml(content); }}
                        style={{ padding: '6px 12px 6px 16px', cursor: 'pointer', fontSize: 13, color: active ? '#6951FF' : '#1d2129', background: active ? '#F3F0FF' : 'transparent', borderLeft: active ? '2px solid #6951FF' : '2px solid transparent', margin: '1px 0' }}
                        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#eef0f4'; }}
                        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 12 }}>
                {createServiceEntryFileKey ? (
                  <>
                    <div style={{ height: 38, padding: '0 8px 0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e5e6eb', borderRadius: '6px 6px 0 0', borderBottom: '1px solid #eef0f4', color: '#4e5969', background: '#f7f8fa', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 11 }}>
                      <span>{(() => {
                        const matched = Object.entries(SE_RESOURCE_FILES).find(([k]) => k === createServiceEntryFileKey);
                        return matched ? matched[0].replace('se/', '') : '';
                      })()}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button type="text" size="small" icon={<CopyOutlined />} aria-label="复制 YAML" title="复制 YAML" onClick={async () => { await navigator.clipboard?.writeText(createServiceEntryYaml); message.success('YAML 已复制'); }} />
                        <Button type="text" size="small" icon={<DownloadOutlined />} aria-label="下载 YAML" title="下载 YAML" onClick={() => { const url = URL.createObjectURL(new Blob([createServiceEntryYaml], { type: 'application/yaml;charset=utf-8' })); const link = document.createElement('a'); link.href = url; const matched = Object.entries(SE_RESOURCE_FILES).find(([k]) => k === createServiceEntryFileKey); link.download = matched ? matched[0] : 'service-entry.yaml'; link.click(); URL.revokeObjectURL(url); message.success('YAML 已下载'); }} />
                      </div>
                    </div>
                    <div style={{ flex: 1, border: '1px solid #e5e6eb', borderTop: 0, borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                      <MonacoEditor value={createServiceEntryYaml} language="yaml" height={420} onChange={setCreateServiceEntryYaml} options={{ lineNumbers: 'on', folding: true, wordWrap: 'off', padding: { top: 12, bottom: 12 } }} />
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', border: '1px solid #e5e6eb', borderRadius: 6, color: '#c9cdd4', fontSize: 13, background: '#fafafa' }}>
                    请从左侧资源文件中选择
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setCreateServiceEntryShowTree(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, border: '2px dashed #e5e6eb', borderRadius: 8, cursor: 'pointer', color: '#4e5969', fontSize: 14, background: '#fafafa', transition: 'border-color 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6951FF'; e.currentTarget.style.color = '#6951FF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e5e6eb'; e.currentTarget.style.color = '#4e5969'; }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileCode2 size={20} />
                选择 YAML 文件
              </span>
            </div>
          )}
        </Modal>

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
                <div className="devpod-create-target">
                  <span>目标集群</span>
                  <Select
                    value={devPodDraft.cluster || undefined}
                    placeholder="请选择集群"
                    options={DEV_POD_CLUSTER_OPTIONS}
                    onChange={(cluster) => setDevPodDraft((current) => ({ ...current, cluster, node: '' }))}
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
                  <div><dt>目标集群</dt><dd>{previewDevPod.cluster}</dd></div>
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
