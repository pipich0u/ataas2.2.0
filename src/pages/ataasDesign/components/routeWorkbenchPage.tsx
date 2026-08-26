import {
  ApartmentOutlined,
  CloseCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  DeploymentUnitOutlined,
  DownOutlined,
  EditOutlined,
  FileSearchOutlined,
  LinkOutlined,
  MoreOutlined,
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Drawer, Dropdown, Input, InputNumber, message, Modal, Select, Space, Switch, Tooltip } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Background,
  BaseEdge,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  SelectionMode,
  getBezierPath,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeProps,
  type NodeTypes,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import kimiLogo from '../kimi-logo.svg';
import '@xyflow/react/dist/style.css';
import { rpc } from '@/lib/bus/rpc';
import type { ConfigTreeNode } from '@/lib/types';
import {
  buildServiceEntryYaml as buildStoreServiceEntryYaml,
  createManualService,
  createManualServiceEntry,
  useK8sResourceStore,
  type K8sResourceState,
} from './k8sResourceStore';
import { DEFAULT_ROUTE_CONFIGS, routeConfigStore, useRouteConfigStore, type SharedRouteRecord } from './routeConfigStore';
import { buildRoutePluginConfigDefaults, ROUTE_PLUGIN_CONFIG_SCHEMAS, type RoutePluginConfigValue } from './routePluginConfig';
import { PLATFORM_GROUP_BY_ID, platformNodeNames } from './platformMockData';
import { PLUGIN_MANAGEMENT_MOCK_DATA } from './pluginManagementPage';
import './routeWorkbenchPage.less';

type PodRecord = {
  key: string;
  name: string;
  cluster: string;
  role: string;
  serviceId?: string;
  namespace: string;
  ready: string;
  status: string;
  restart: number;
  load: number;
  performance: number;
  image: string;
  podIP: string;
  node: string;
  nodeGPU: string;
  gpuUtil: number;
  gpuVram: number;
  age: string;
  trafficSource: string;
  group?: string;
  tpotP50?: number;
  tpotP99?: number;
  tpotHistory?: number[];
  ttftP50?: number;
  ttftP99?: number;
  ttftHistory?: number[];
};

type ServiceRecord = {
  key: string;
  name: string;
  namespace: string;
  clusterIP: string;
  type: string;
  ports: { name: string; port: number; targetPort: number; nodePort?: number; protocol: string }[];
  selector: Record<string, string>;
  labels: Record<string, string>;
  externalTrafficPolicy: string;
  sessionAffinity: string;
  createdAt: string;
};

type RouteEntry = {
  key: string;
  name: string;
  cluster: string;
  namespace: string;
  hosts: string[];
  endpoints: { address: string; weight: number }[];
  services: ServiceRecord[];
  yaml: string;
  createdAt: string;
  updatedAt: string;
};

const glm51MockServices: ServiceRecord[] = Array.from({ length: 30 }, (_, index) => {
  const seq = String(index + 1).padStart(2, '0');
  const name = 'glm51-router-' + seq;
  return {
    key: 'svc-glm51-' + seq,
    name,
    namespace: 'default',
    clusterIP: '10.43.70.' + (index + 10),
    type: 'NodePort',
    ports: [
      { name: 'http', port: 30002, targetPort: 30002, nodePort: 30100 + index, protocol: 'TCP' },
      { name: 'metrics', port: 9090, targetPort: 29000, nodePort: 29100 + index, protocol: 'TCP' },
    ],
    selector: { 'rolebasedgroup.workloads.x-k8s.io/name': name, 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
    labels: { monitoring: 'scrape', 'rolebasedgroup.workloads.x-k8s.io/name': name, 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
    externalTrafficPolicy: 'Cluster',
    sessionAffinity: index % 5 === 0 ? 'ClientIP' : 'None',
    createdAt: '2026-06-' + String((index % 20) + 1).padStart(2, '0') + ' 09:30',
  };
});

const routeData: RouteEntry[] = [
  {
    key: 'route-1', name: 'glm-5.1', cluster: 'st', namespace: 'higress-system',
    hosts: ['glm-5.1-cluster.local'],
    endpoints: glm51MockServices.map((svc, index) => ({ address: svc.name + '.default.svc.cluster.local', weight: index < 10 ? 4 : 3 })),
    services: glm51MockServices,
    createdAt: '2026-06-01 10:00', yaml: '', updatedAt: '2026-06-28 14:30',
  },
  {
    key: 'route-2', name: 'glm-5.1-canary', cluster: 'st', namespace: 'higress-system',
    hosts: ['glm-5.1-canary.cluster.local'],
    endpoints: [{ address: 'glm51-canary-router.default.svc.cluster.local', weight: 100 }],
    services: [{
      key: 'svc-2-1', name: 'glm51-canary-router', namespace: 'default', clusterIP: '10.43.71.11', type: 'NodePort',
      ports: [{ name: 'http', port: 30002, targetPort: 30002, nodePort: 30211, protocol: 'TCP' }],
      selector: { 'rolebasedgroup.workloads.x-k8s.io/name': 'glm51-canary-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      labels: { 'rolebasedgroup.workloads.x-k8s.io/name': 'glm51-canary-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      externalTrafficPolicy: 'Cluster', sessionAffinity: 'None', createdAt: '2026-06-18 10:30',
    }],
    createdAt: '2026-06-18 10:30', yaml: '', updatedAt: '2026-06-28 15:20',
  },
  {
    key: 'route-3', name: 'deepseek-r1', cluster: 'st', namespace: 'higress-system',
    hosts: ['deepseek-r1-cluster.local'],
    endpoints: [{ address: 'deepseek-router.default.svc.cluster.local', weight: 100 }],
    services: [{
      key: 'svc-3-1', name: 'deepseek-router', namespace: 'default', clusterIP: '10.43.58.20', type: 'NodePort',
      ports: [{ name: 'http', port: 30002, targetPort: 30002, nodePort: 30020, protocol: 'TCP' }, { name: 'grpc', port: 50051, targetPort: 50051, nodePort: 30021, protocol: 'TCP' }],
      selector: { 'rolebasedgroup.workloads.x-k8s.io/name': 'deepseek-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      labels: { monitoring: 'scrape', 'rolebasedgroup.workloads.x-k8s.io/name': 'deepseek-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      externalTrafficPolicy: 'Cluster', sessionAffinity: 'ClientIP', createdAt: '2026-05-20 07:30',
    }],
    createdAt: '2026-05-20 08:00', yaml: '', updatedAt: '2026-06-29 10:15',
  },
  {
    key: 'route-4', name: 'kimi-k2', cluster: 'bx', namespace: 'higress-system',
    hosts: ['kimi-k2-cluster.local'], endpoints: [{ address: 'kimi-router.default.svc.cluster.local', weight: 100 }],
    services: [{
      key: 'svc-4-1', name: 'kimi-router', namespace: 'default', clusterIP: '10.43.59.30', type: 'NodePort',
      ports: [{ name: 'http', port: 30002, targetPort: 30002, nodePort: 30030, protocol: 'TCP' }],
      selector: { 'rolebasedgroup.workloads.x-k8s.io/name': 'kimi-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      labels: { 'rolebasedgroup.workloads.x-k8s.io/name': 'kimi-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      externalTrafficPolicy: 'Cluster', sessionAffinity: 'None', createdAt: '2026-06-10 13:30',
    }],
    createdAt: '2026-06-10 14:00', yaml: '', updatedAt: '2026-06-28 09:45',
  },
  {
    key: 'route-8', name: 'glm-5.1-se', cluster: 'bx', namespace: 'higress-system',
    hosts: ['glm-5.1-se-cluster.local'], endpoints: [{ address: 'glm51-pd-bx-router.default.svc.cluster.local', weight: 100 }],
    services: [{
      key: 'svc-8-1', name: 'glm51-pd-bx-router', namespace: 'default', clusterIP: '10.43.68.10', type: 'NodePort',
      ports: [{ name: 'http', port: 30002, targetPort: 30002, nodePort: 30080, protocol: 'TCP' }],
      selector: { 'rolebasedgroup.workloads.x-k8s.io/name': 'glm51-pd-bx-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      labels: { 'rolebasedgroup.workloads.x-k8s.io/name': 'glm51-pd-bx-router', 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
      externalTrafficPolicy: 'Cluster', sessionAffinity: 'None', createdAt: '2026-06-30 10:00',
    }],
    createdAt: '2026-06-30 10:30', yaml: '', updatedAt: '2026-06-30 10:30',
  },
];

const pods: PodRecord[] = [
  ...Array.from({ length: 30 }, (_, index) => {
    const seq = String(index + 1).padStart(2, '0');
    return {
      key: 'p-glm51-svc-' + seq,
      name: 'glm51-router-' + seq + '-pod-0',
      cluster: 'st', role: 'router', group: 'glm51', namespace: 'default',
      ready: index % 9 === 0 ? '0/1' : '1/1', status: index % 9 === 0 ? 'Pending' : 'Running',
      restart: index % 6, load: 28 + (index % 7) * 6, performance: 72 + (index % 8) * 3,
      image: 'envoy/envoy:latest', podIP: '10.0.7.' + (index + 10), node: 'b300-' + String((index % 8) + 1).padStart(2, '0'),
      nodeGPU: 'B300 192G x 8', gpuUtil: 24 + (index % 6) * 5, gpuVram: 20 + (index % 5) * 4, age: ((index % 15) + 1) + 'd',
      trafficSource: 'glm-5.1', ttftP50: 38 + (index % 6) * 4, ttftP99: 82 + (index % 8) * 7,
    };
  }),
  { key: 'p31', name: 'glm51-pd-prefill', cluster: 'st', role: 'prefill', group: 'glm51', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 83, performance: 92, image: 'sglang/sglang:latest', podIP: '10.0.2.20', node: 'b300-16', nodeGPU: 'B300 192G x 8', gpuUtil: 80, gpuVram: 68, age: '3d', trafficSource: 'glm-5.1', ttftP50: 295, ttftP99: 550 },
  { key: 'p32', name: 'glm51-pd-decode', cluster: 'st', role: 'decode', group: 'glm51', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 73, performance: 88, image: 'vllm/vllm-openai:latest', podIP: '10.0.2.21', node: 'b300-16', nodeGPU: 'B300 192G x 8', gpuUtil: 71, gpuVram: 64, age: '3d', trafficSource: 'glm-5.1', tpotP50: 67, tpotP99: 90 },
  { key: 'p-glm51-canary-router', name: 'glm51-canary-router-0', cluster: 'st', role: 'router', serviceId: 'svc-2-1', group: 'glm51', namespace: 'default', ready: '1/1', status: 'Running', restart: 0, load: 18, performance: 71, image: 'envoy/envoy:latest', podIP: '10.0.8.21', node: 'b300-22', nodeGPU: 'B300 192G x 8', gpuUtil: 26, gpuVram: 18, age: '8d', trafficSource: 'glm-5.1-canary' },
  { key: 'p-deepseek-router', name: 'deepseek-router-0', cluster: 'st', role: 'router', group: 'deepseek', namespace: 'default', ready: '1/1', status: 'Running', restart: 0, load: 35, performance: 78, image: 'envoy/envoy:latest', podIP: '10.0.1.10', node: 'b300-01', nodeGPU: 'B300 192G x 8', gpuUtil: 32, gpuVram: 28, age: '12d', trafficSource: 'deepseek-r1' },
  { key: 'p-kimi-router', name: 'kimi-router-0', cluster: 'bx', role: 'router', group: 'kimi', namespace: 'default', ready: '1/1', status: 'Running', restart: 0, load: 52, performance: 74, image: 'mindie/mindie:latest', podIP: '10.0.4.5', node: 'b300-09', nodeGPU: 'B300 192G x 8', gpuUtil: 61, gpuVram: 52, age: '5d', trafficSource: 'kimi-k2' },
  { key: 'p-bx-router', name: 'glm51-pd-bx-router-0', cluster: 'bx', role: 'router', group: 'glm51', namespace: 'default', ready: '1/1', status: 'Running', restart: 0, load: 22, performance: 62, image: 'envoy/envoy:latest', podIP: '10.0.6.1', node: 'b300-17', nodeGPU: 'B300 192G x 8', gpuUtil: 28, gpuVram: 22, age: '1d', trafficSource: 'glm-5.1-se' },
];

type RouteWorkbenchKind = 'modelNode' | 'domainNode' | 'ingressGroupNode' | 'ingressNode' | 'clusterNode' | 'serviceNode' | 'routerPodNode' | 'pdWorkerNode';

const routeWorkbenchLevelByKind: Record<RouteWorkbenchKind, number> = {
  modelNode: 0,
  domainNode: 0,
  ingressGroupNode: 0,
  ingressNode: 1,
  clusterNode: 2,
  serviceNode: 3,
  routerPodNode: 4,
  pdWorkerNode: 5,
};

const routeWorkbenchLevelLabels = ['集群', '服务网格入口', '服务网格出口', 'SVC', 'Router', 'PD'];

type RouteWorkbenchNodeData = {
  kind: RouteWorkbenchKind;
  title: string;
  subtitle?: string;
  meta?: string;
  domain?: string;
  /** ServiceEntry 的 hosts；Ingress/Higress 的目标服务统一引用这里。 */
  hosts?: string;
  /** 下游实例所属的 SE 分区；摘流后仍用于保留原有 Group。 */
  groupKey?: string;
  role?: string;
  roleCount?: number;
  cluster?: string;
  namespace?: string;
  qps?: number;
  errRate?: number;
  load?: number;
  weight?: number;
  parallelIndex?: number;
  parallelTotal?: number;
  endpoints?: number;
  pods?: number;
  nodeCount?: number;
  logo?: string;
  health?: 'healthy' | 'warning' | 'error' | 'idle';
  yaml?: string;
  history?: Array<{ hash: string; time: string; author: string; message: string }>;
  sourceRouteKey?: string;
  sourceServiceKey?: string;
  expanded?: boolean;
  isDraft?: boolean;
  /** 新建独立分支的坐标锁定；默认排版时仍保留。 */
  manualPosition?: boolean;
  /** 用户拖拽后的临时坐标锁定；默认排版时恢复自动布局。 */
  draggedPosition?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  onQuickAdd?: (nodeId: string, kind: RouteWorkbenchKind) => void;
  hasChildren?: boolean;
  collapsed?: boolean;
  onToggleChildren?: (nodeId: string) => void;
};

type RouteWorkbenchEdgeData = {
  type: 'gateway' | 'endpoint' | 'service' | 'worker' | 'pair' | 'structure' | 'direct' | 'aligned';
  qps?: number;
  active?: number;
  weight?: number;
  load?: number;
  healthy?: boolean;
  pending?: boolean;
  label?: string;
  parallelIndex?: number;
  parallelTotal?: number;
  flowKey?: string;
  highlighted?: boolean;
  dimmed?: boolean;
};

const routeWorkbenchKindLabel: Record<RouteWorkbenchKind, string> = {
  modelNode: 'Model',
  domainNode: '集群',
  ingressGroupNode: 'Gateway',
  ingressNode: '服务网格入口',
  clusterNode: '服务网格出口',
  serviceNode: 'SVC',
  routerPodNode: '推理组',
  pdWorkerNode: 'Worker',
};

// 当前画布仍使用 domainNode 作为内部节点类型；对外展示为集群。
// 服务网格入口的 mock 域名在接入真实数据前统一固定为此值。
const routeWorkbenchIngressMockDomain = 'ktaas.llmapi.approaching-ai.com';
const routeWorkbenchLayoutRevision = 'level-layout-v3';

const routeWorkbenchKindIcon: Record<RouteWorkbenchKind, ReactNode> = {
  modelNode: <DatabaseOutlined />,
  domainNode: <LinkOutlined />,
  ingressGroupNode: <CloudServerOutlined />,
  ingressNode: <DeploymentUnitOutlined />,
  clusterNode: <span className="ataas-rf-letter-icon">S</span>,
  serviceNode: <ApartmentOutlined />,
  routerPodNode: <span className="ataas-rf-letter-icon">R</span>,
  pdWorkerNode: <span className="ataas-rf-letter-icon">W</span>,
};

const getRouteModelLogo = (modelName: string) => {
  const normalized = modelName.toLowerCase();
  if (normalized.includes('glm')) return glmLogo;
  if (normalized.includes('kimi')) return kimiLogo;
  if (normalized.includes('deepseek')) return deepseekLogo;
  return glmLogo;
};

const getRouteWorkbenchNodeIcon = (data: RouteWorkbenchNodeData) => {
  if (data.kind === 'modelNode' && data.logo) return <img src={data.logo} alt="" />;
  if (data.kind !== 'pdWorkerNode') return routeWorkbenchKindIcon[data.kind];
  const role = String(data.role || data.title || '').toLowerCase();
  if (role.includes('prefill')) return <span className="ataas-rf-letter-icon">P</span>;
  if (role.includes('decode')) return <span className="ataas-rf-letter-icon">D</span>;
  return <span className="ataas-rf-letter-icon">W</span>;
};

const getRouteWorkbenchHeatColor = (value = 0) => {
  if (value <= 0) return '#CBD5E1';
  if (value < 0.25) return '#4F8EF7';
  if (value < 0.5) return '#12A150';
  if (value < 0.75) return '#F59E0B';
  return '#D92D20';
};

const getRouteWorkbenchPairColor = (value = 0) => {
  if (value <= 0) return '#CBD5E1';
  if (value < 0.25) return '#6AA3E8';
  if (value < 0.5) return '#44AA99';
  if (value < 0.75) return '#FACC15';
  return '#E85D42';
};

const RouteWorkbenchNode = ({ id, data, selected }: NodeProps) => {
  const d = data as RouteWorkbenchNodeData;
  const health = d.health || 'healthy';
  const role = String(d.role || '').toLowerCase();
  const canTarget = d.kind !== 'modelNode';
  const canSource = d.kind !== 'pdWorkerNode';
  const isPrefillWorker = d.kind === 'pdWorkerNode' && role === 'prefill';
  const isDecodeWorker = d.kind === 'pdWorkerNode' && role === 'decode';
  const canShowStatus = d.kind === 'routerPodNode' || d.kind === 'pdWorkerNode';
  return (
    <div className={`ataas-rf-node ${d.kind} ${health} ${selected ? 'selected' : ''} ${d.highlighted ? 'highlighted' : ''} ${d.dimmed ? 'dimmed' : ''}`}>
      {canTarget && <Handle type="target" position={Position.Top} className="ataas-rf-handle" />}
      <div className={`ataas-rf-node-icon ${d.kind} role-${String(d.role || '').toLowerCase()}`}>{getRouteWorkbenchNodeIcon(d)}</div>
      <div className="ataas-rf-node-body">
        <div className="ataas-rf-node-title">
          <span title={d.title}>{d.title}</span>
          <strong className={`ataas-rf-node-kind ${d.kind}`}>{d.kind === 'pdWorkerNode' ? (role === 'decode' ? 'Decode' : 'Prefill') : routeWorkbenchKindLabel[d.kind]}</strong>
          {d.cluster && d.kind !== 'ingressGroupNode' && d.kind !== 'routerPodNode' && d.kind !== 'pdWorkerNode' && <em>{d.cluster}</em>}
        </div>
        {d.subtitle && <div className="ataas-rf-node-subtitle">{d.subtitle}</div>}
        <div className="ataas-rf-node-metrics">
          {d.qps != null && <span>{d.qps} qps</span>}
          {d.weight != null && <span>w:{d.weight}</span>}
          {d.endpoints != null && <span>{d.endpoints} ep</span>}
          {d.pods != null && <span>{d.pods} pods</span>}
          {d.nodeCount != null && <span>{d.nodeCount} nodes</span>}
          {d.errRate != null && d.errRate > 0 && <span className="danger">{(d.errRate * 100).toFixed(1)}% err</span>}
          {d.meta && <span>{d.meta}</span>}
        </div>
      </div>
      {canShowStatus && <i className="ataas-rf-node-status" />}
      {d.hasChildren && (
        <button
          type="button"
          className="ataas-rf-node-collapse"
          title={d.collapsed ? '展开下游' : '收起下游'}
          onClick={(event) => { event.stopPropagation(); d.onToggleChildren?.(id); }}
        >
          <PlusOutlined className={d.collapsed ? '' : 'expanded'} />
        </button>
      )}
      {canSource && <Handle type="source" position={Position.Bottom} className="ataas-rf-handle" />}
      {isPrefillWorker && <Handle type="source" id="pair-source" position={Position.Right} className="ataas-rf-handle ataas-rf-pair-handle" style={{ top: '72%' }} />}
      {isDecodeWorker && <Handle type="target" id="pair-target" position={Position.Left} className="ataas-rf-handle ataas-rf-pair-handle" style={{ top: '72%' }} />}
    </div>
  );
};

const RouteWorkbenchEdge = (props: EdgeProps) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, selected } = props;
  const d = (data || {}) as RouteWorkbenchEdgeData;
  const heat = d.qps ? Math.min(d.qps / 100, 1) : d.active ? Math.min(d.active / 50, 1) : d.load ? Math.min(d.load / 50, 1) : 0;
  const isPair = d.type === 'pair';
  const [directPath, directLabelX, directLabelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const pairIndex = d.parallelIndex || 0;
  const pairTotal = d.parallelTotal || 1;
  const pairBend = 64 + pairIndex * 24;
  const pairTargetY = targetY + (pairIndex - (pairTotal - 1) / 2) * 10;
  const pairTrunkX = Math.max(sourceX, targetX) + pairBend;
  const pairRadius = 8;
  const pairStepDir = sourceY < pairTargetY ? 1 : -1;
  const pairPath = [
    `M ${sourceX} ${sourceY}`,
    `L ${pairTrunkX - pairRadius} ${sourceY}`,
    `Q ${pairTrunkX} ${sourceY} ${pairTrunkX} ${sourceY + pairRadius * pairStepDir}`,
    `L ${pairTrunkX} ${pairTargetY - pairRadius * pairStepDir}`,
    `Q ${pairTrunkX} ${pairTargetY} ${pairTrunkX - pairRadius} ${pairTargetY}`,
    `L ${targetX} ${pairTargetY}`,
  ].join(' ');
  // 拓扑关系统一采用曲线，避免自动布局变化后出现直角折线和交叠的“管道感”。
  const path = isPair ? pairPath : directPath;
  const labelX = isPair ? pairTrunkX : directLabelX;
  const labelY = isPair ? (sourceY + pairTargetY) / 2 : directLabelY;
  const pairHeat = d.load ? Math.min(d.load / 140, 1) : 0;
  const stroke = d.type === 'direct' ? '#C5CEDB' : isPair ? getRouteWorkbenchPairColor(pairHeat) : d.healthy === false ? '#D92D20' : d.pending ? '#F59E0B' : d.type === 'worker' ? '#8EA4C0' : getRouteWorkbenchHeatColor(heat);
  const width = d.type === 'structure' ? 1.6 : 2;
  const rpm = d.qps != null ? Math.round(d.qps * 60) : d.active != null ? Math.round(d.active * 60) : d.load != null ? Math.round(d.load * 60) : null;
  const label = d.type === 'endpoint' && d.weight != null
    ? `${rpm == null ? '' : `${rpm.toLocaleString()} RPM · `}weight: ${d.weight}`
    : rpm == null ? '' : `${rpm.toLocaleString()} RPM`;
  const labelWidth = Math.max(isPair ? 28 : 52, Math.min(146, String(label).length * 7 + 14));
  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke: selected ? '#2563EB' : d.highlighted ? '#7C3AED' : stroke, strokeWidth: selected ? 3.5 : d.highlighted ? 3.5 : width, opacity: d.dimmed ? 0.12 : d.highlighted ? 1 : d.type === 'structure' ? 0.55 : 0.82 }} />
      <path d={path} fill="none" stroke="transparent" strokeWidth={18} className="ataas-rf-edge-hit-area" />
      {label && (
        <foreignObject width={labelWidth} height={24} x={labelX - labelWidth / 2} y={labelY - 12} requiredExtensions="http://www.w3.org/1999/xhtml">
          <div className={`ataas-rf-edge-label ${isPair ? 'pair' : ''}`} style={isPair ? { color: stroke, borderColor: `${stroke}55` } : undefined}>{label}</div>
        </foreignObject>
      )}
    </>
  );
};

const routeWorkbenchNodeTypes: NodeTypes = {
  modelNode: RouteWorkbenchNode,
  domainNode: RouteWorkbenchNode,
  ingressGroupNode: RouteWorkbenchNode,
  ingressNode: RouteWorkbenchNode,
  clusterNode: RouteWorkbenchNode,
  serviceNode: RouteWorkbenchNode,
  routerPodNode: RouteWorkbenchNode,
  pdWorkerNode: RouteWorkbenchNode,
};

const routeWorkbenchEdgeTypes = {
  trafficEdge: RouteWorkbenchEdge,
};

const routeWorkbenchMarkerEnd = { type: MarkerType.ArrowClosed, width: 14, height: 14 };

const routeWorkbenchHistory = [
  { hash: 'a8bbd13', time: '2026/07/02 21:45:18', author: '当前账户', message: 'update routing endpoint weights' },
  { hash: 'd78bf34', time: '2026/07/01 19:22:06', author: '当前账户', message: 'initial routing canvas config' },
];

const routeWorkbenchPluginCatalog = PLUGIN_MANAGEMENT_MOCK_DATA.filter((plugin) =>
  plugin.status === 'enabled' && plugin.scope.includes('路由') && !plugin.scope.includes('全局'));

const routeWorkbenchYaml = (kind: string, name: string) => `apiVersion: networking.istio.io/v1beta1
kind: ${kind}
metadata:
  name: ${name}
  namespace: default
spec:
  hosts:
    - glm-5.1-cluster.local
  ports:
    - number: 8000
      name: http
      protocol: HTTP`;

const routeWorkbenchInitialNodes: Node[] = [
  {
    id: 'model-glm51',
    type: 'modelNode',
    position: { x: 400, y: 80 },
    data: { kind: 'modelNode', title: 'GLM-5.1', subtitle: '模型服务 · 2 个集群', qps: 86, pods: 34, nodeCount: 14, logo: glmLogo, health: 'healthy', yaml: routeWorkbenchYaml('ModelService', 'glm51'), history: routeWorkbenchHistory },
  },
  {
    id: 'cluster-st',
    type: 'ingressGroupNode',
    position: { x: 400, y: 250 },
    data: { kind: 'ingressGroupNode', title: 'st 集群', subtitle: '2 SE · 33 实例', cluster: 'st', qps: 84, pods: 33, nodeCount: 12, health: 'healthy', yaml: routeWorkbenchYaml('Gateway', 'st-ingress'), history: routeWorkbenchHistory },
  },
  {
    id: 'se-glm51',
    type: 'clusterNode',
    position: { x: 400, y: 420 },
    data: { kind: 'clusterNode', title: 'glm51-service-entry', subtitle: 'ServiceEntry · ROUND_ROBIN', cluster: 'st', endpoints: 3, qps: 82, weight: 100, health: 'warning', yaml: routeWorkbenchYaml('ServiceEntry', 'glm51-service-entry'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-1',
    type: 'serviceNode',
    position: { x: 80, y: 600 },
    data: { kind: 'serviceNode', title: 'glm51-router-1', subtitle: 'ClusterIP · 10.43.21.18', cluster: 'st', pods: 1, weight: 33, health: 'healthy', yaml: routeWorkbenchYaml('Service', 'glm51-router-1'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-2',
    type: 'serviceNode',
    position: { x: 400, y: 600 },
    data: { kind: 'serviceNode', title: 'glm51-router-2', subtitle: 'ClusterIP · 10.43.21.19', cluster: 'st', pods: 1, weight: 33, health: 'warning', yaml: routeWorkbenchYaml('Service', 'glm51-router-2'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-3',
    type: 'serviceNode',
    position: { x: 720, y: 600 },
    data: { kind: 'serviceNode', title: 'glm51-router-3', subtitle: 'ClusterIP · 10.43.21.20', cluster: 'st', pods: 1, weight: 34, health: 'healthy', yaml: routeWorkbenchYaml('Service', 'glm51-router-3'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-1',
    type: 'routerPodNode',
    position: { x: 80, y: 780 },
    data: { kind: 'routerPodNode', title: 'glm51-router-1-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 31, health: 'healthy', yaml: routeWorkbenchYaml('Pod', 'glm51-router-1-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-2',
    type: 'routerPodNode',
    position: { x: 400, y: 780 },
    data: { kind: 'routerPodNode', title: 'glm51-router-2-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 25, health: 'warning', yaml: routeWorkbenchYaml('Pod', 'glm51-router-2-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-3',
    type: 'routerPodNode',
    position: { x: 720, y: 780 },
    data: { kind: 'routerPodNode', title: 'glm51-router-3-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 28, health: 'healthy', yaml: routeWorkbenchYaml('Pod', 'glm51-router-3-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'w-prefill-1',
    type: 'pdWorkerNode',
    position: { x: 250, y: 960 },
    data: { kind: 'pdWorkerNode', title: 'glm51-prefill-0', subtitle: 'Prefill · 3/4 Running', role: 'prefill', cluster: 'st', namespace: 'default', load: 8, health: 'warning', meta: 'P 1 · TTFT 31234', yaml: routeWorkbenchYaml('Pod', 'glm51-prefill-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'w-decode-1',
    type: 'pdWorkerNode',
    position: { x: 570, y: 960 },
    data: { kind: 'pdWorkerNode', title: 'glm51-decode-0', subtitle: 'Decode · 1/1 Running', role: 'decode', cluster: 'st', namespace: 'default', load: 18, health: 'healthy', meta: 'D 1 · TPOT 28.1', yaml: routeWorkbenchYaml('Pod', 'glm51-decode-0'), history: routeWorkbenchHistory },
  },
];

const routeWorkbenchInitialEdges: Edge[] = [
  { id: 'e-model-cluster', source: 'model-glm51', target: 'cluster-st', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'structure' } },
  { id: 'e-cluster-se', source: 'cluster-st', target: 'se-glm51', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'gateway', qps: 84 } },
  { id: 'e-se-svc-1', source: 'se-glm51', target: 'svc-router-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 31, weight: 33 } },
  { id: 'e-se-svc-2', source: 'se-glm51', target: 'svc-router-2', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 25, weight: 33, healthy: false } },
  { id: 'e-se-svc-3', source: 'se-glm51', target: 'svc-router-3', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 28, weight: 34 } },
  { id: 'e-svc-rp-1', source: 'svc-router-1', target: 'rp-router-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: 18 } },
  { id: 'e-svc-rp-2', source: 'svc-router-2', target: 'rp-router-2', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: 9, healthy: false } },
  { id: 'e-svc-rp-3', source: 'svc-router-3', target: 'rp-router-3', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: 14 } },
  { id: 'e-rp1-pf', source: 'rp-router-1', target: 'w-prefill-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'worker', load: 8 } },
  { id: 'e-rp2-pf', source: 'rp-router-2', target: 'w-prefill-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'worker', load: 12, healthy: false } },
  { id: 'e-rp3-dc', source: 'rp-router-3', target: 'w-decode-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'worker', load: 18 } },
  { id: 'e-pair', source: 'w-prefill-1', target: 'w-decode-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'pair', load: 6, label: 'pair 6' } },
];

// 链路编排页面独立演示数据：用于先展示一条清晰的运维链路，不依赖容器管理或资源文件。
const routeWorkbenchMockGraph: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    {
      id: 'mock-entry', type: 'domainNode', position: { x: 400, y: 40 },
      data: { kind: 'domainNode', title: '模型请求入口', subtitle: 'api.ataas.example.com', qps: 128, errRate: 0.002, health: 'healthy', yaml: routeWorkbenchYaml('VirtualService', 'api-entry'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-gateway', type: 'ingressGroupNode', position: { x: 400, y: 210 },
      data: { kind: 'ingressGroupNode', title: '网关 · Higress-gateway', subtitle: 'ST1 · 3 条入口规则', cluster: 'ST1', qps: 128, pods: 2, nodeCount: 2, health: 'healthy', yaml: routeWorkbenchYaml('Gateway', 'higress-gateway'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-ingress-1', type: 'ingressNode', position: { x: 70, y: 400 },
      data: { kind: 'ingressNode', title: 'Ingress-1', subtitle: 'glm-5.1 · /v1/chat', cluster: 'ST1', endpoints: 1, qps: 52, weight: 40, health: 'healthy', yaml: routeWorkbenchYaml('Ingress', 'glm-5.1'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-ingress-2', type: 'ingressNode', position: { x: 400, y: 400 },
      data: { kind: 'ingressNode', title: 'Ingress-2', subtitle: 'deepseek-r1 · /v1/chat', cluster: 'ST1', endpoints: 1, qps: 44, weight: 35, health: 'healthy', yaml: routeWorkbenchYaml('Ingress', 'deepseek-r1'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-ingress-3', type: 'ingressNode', position: { x: 730, y: 400 },
      data: { kind: 'ingressNode', title: 'Ingress-3', subtitle: 'kimi-k2 · /v1/chat', cluster: 'ST1', endpoints: 1, qps: 32, weight: 25, health: 'warning', yaml: routeWorkbenchYaml('Ingress', 'kimi-k2'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-se', type: 'clusterNode', position: { x: 400, y: 575 },
      data: { kind: 'clusterNode', title: 'deepseek-r1-service-entry', subtitle: 'ServiceEntry · ROUND_ROBIN', cluster: 'ST1', hosts: 'deepseek-r1.internal.dns', endpoints: 1, qps: 44, weight: 100, health: 'healthy', yaml: routeWorkbenchYaml('ServiceEntry', 'deepseek-r1-service-entry'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-svc', type: 'serviceNode', position: { x: 400, y: 750 },
      data: { kind: 'serviceNode', title: 'deepseek-r1-service', subtitle: 'ClusterIP · 10.43.12.8', cluster: 'ST1', pods: 1, qps: 44, weight: 100, health: 'healthy', yaml: routeWorkbenchYaml('Service', 'deepseek-r1-service'), history: routeWorkbenchHistory },
    },
    {
      id: 'mock-router', type: 'routerPodNode', position: { x: 400, y: 925 },
      data: { kind: 'routerPodNode', title: 'deepseek-r1-router-0', subtitle: 'Router Pod · Running', cluster: 'ST1', namespace: 'production', qps: 44, health: 'healthy', yaml: routeWorkbenchYaml('Pod', 'deepseek-r1-router-0'), history: routeWorkbenchHistory },
    },
  ],
  edges: [
    { id: 'mock-entry-gateway', source: 'mock-entry', target: 'mock-gateway', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'gateway', qps: 128 } },
    { id: 'mock-gateway-ingress-1', source: 'mock-gateway', target: 'mock-ingress-1', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 52, weight: 40 } },
    { id: 'mock-gateway-ingress-2', source: 'mock-gateway', target: 'mock-ingress-2', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 44, weight: 35 } },
    { id: 'mock-gateway-ingress-3', source: 'mock-gateway', target: 'mock-ingress-3', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 32, weight: 25, healthy: false } },
    { id: 'mock-ingress-se', source: 'mock-ingress-2', target: 'mock-se', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'structure' } },
    { id: 'mock-se-svc', source: 'mock-se', target: 'mock-svc', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: 44, weight: 100 } },
    { id: 'mock-svc-router', source: 'mock-svc', target: 'mock-router', type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: 44 } },
  ],
};

// 来源于 ST1 集群链路清单的独立 Mock。入口资源维持平铺，同类资源以连线汇聚，避免展开成多层树。
const buildSt1RouteWorkbenchMockGraph = (routeConfigs: SharedRouteRecord[]): { nodes: Node[]; edges: Edge[] } => {
  const st1IngressMocks = routeConfigs.map((route) => route.name);
  const st1ServiceEntryMocks = Array.from(new Set(routeConfigs.map((route) => route.serviceEntry)));
  const nodes: Node[] = [
    {
      id: 'st1-domain-glm', type: 'domainNode', position: { x: 9800, y: -420 },
      data: { kind: 'domainNode', title: 'st1', subtitle: `${st1IngressMocks.length} 个服务网格入口`, meta: '运行中', qps: 1280, errRate: 0.002, health: 'healthy', yaml: routeWorkbenchYaml('Cluster', 'st1'), history: routeWorkbenchHistory },
    },
  ];
  const edges: Edge[] = [];
  const ingressToSe = Object.fromEntries(routeConfigs.map((route) => [route.name, route.serviceEntry]));
  // 单集群 Mock：当前画布统一展示 ST1 链路。
  const mockClusterForServiceEntry = (_serviceEntry: string) => 'ST1';
  // 一个 SE 的整棵下游树占用一个固定分区，Ingress 也按分区而不是全局等距排列。
  // 4 Prefill + 1 Decode 连同卡片宽度约需 1,600px，额外预留间隙防止相邻 Group 重叠。
  const serviceEntryLaneX = (index: number) => 820 + index * 1800;
  const ingressX = (name: string) => {
    const serviceEntry = ingressToSe[name];
    const laneIndex = st1ServiceEntryMocks.indexOf(serviceEntry);
    const siblings = st1IngressMocks.filter((item) => ingressToSe[item] === serviceEntry);
    const siblingIndex = siblings.indexOf(name);
    return serviceEntryLaneX(laneIndex) + (siblingIndex - (siblings.length - 1) / 2) * 280;
  };

  st1IngressMocks.forEach((name, index) => {
    const routeConfig = routeConfigs.find((route) => route.name === name);
    const warning = !routeConfig?.enabled;
    const qps = 18 + (index % 7) * 9;
    nodes.push({
      id: `st1-ingress-${name}`, type: 'ingressNode', position: { x: ingressX(name), y: 210 },
      data: { kind: 'ingressNode', title: name, subtitle: `${routeConfig?.path || '/'} · ${mockClusterForServiceEntry(ingressToSe[name])}`, domain: routeConfig?.domain, cluster: mockClusterForServiceEntry(ingressToSe[name]), endpoints: 1, qps, weight: 100, health: warning ? 'warning' : 'healthy', yaml: routeWorkbenchYaml('Ingress', name), history: routeWorkbenchHistory },
    });
    edges.push({ id: `st1-domain-${name}`, source: 'st1-domain-glm', target: `st1-ingress-${name}`, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'direct', qps, flowKey: name } });
  });

  st1ServiceEntryMocks.forEach((name, index) => {
    const cluster = mockClusterForServiceEntry(name);
    nodes.push({
      id: `st1-se-${name}`, type: 'clusterNode', position: { x: serviceEntryLaneX(index), y: 455 },
      data: { kind: 'clusterNode', title: name, subtitle: `${cluster} · ServiceEntry`, cluster, hosts: `${name}.internal.dns`, endpoints: 1, qps: 28 + (index % 6) * 13, weight: 100, health: 'healthy', yaml: routeWorkbenchYaml('ServiceEntry', name), history: routeWorkbenchHistory },
    });
  });
  Object.entries(ingressToSe).forEach(([ingress, serviceEntry]) => {
    const qps = 18 + (st1IngressMocks.indexOf(ingress) % 7) * 9;
    edges.push({ id: `st1-${ingress}-${serviceEntry}`, source: `st1-ingress-${ingress}`, target: `st1-se-${serviceEntry}`, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned', qps, weight: 100, flowKey: ingress } });
  });

  // 每个 SE 的 P/D 数量直接来自平台拓扑数据，其他页面也消费同一份角色定义。
  // 子实例在所属 Router 下方扇形排布，并使用贝塞尔曲线，避免折线回折和交叉。
  st1ServiceEntryMocks.forEach((serviceEntry, serviceEntryIndex) => {
    const platformGroup = PLATFORM_GROUP_BY_ID.get(serviceEntry);
    const prefillNodes = platformNodeNames(platformGroup?.prefillNodeIds || []);
    const decodeNodes = platformNodeNames(platformGroup?.decodeNodeIds || []);
    const centerX = serviceEntryLaneX(serviceEntryIndex);
    const cluster = mockClusterForServiceEntry(serviceEntry);
    const totalQps = 36 + (serviceEntryIndex % 6) * 12;
    const hasParallelSvc = serviceEntry === 'night-traffic-2';
    const primaryWeight = hasParallelSvc ? 70 : 100;
    const serviceId = `st1-svc-${serviceEntry}`;
    const routerId = `st1-router-${serviceEntry}`;
    const primaryOffset = hasParallelSvc ? -220 : 0;
    nodes.push(
      {
        id: serviceId, type: 'serviceNode', position: { x: centerX + primaryOffset, y: 690 },
        data: { kind: 'serviceNode', title: `${serviceEntry}-svc`, subtitle: 'ClusterIP · 10.43.12.8', cluster, groupKey: serviceEntry, pods: 1, qps: Math.round(totalQps * primaryWeight / 100), weight: primaryWeight, parallelIndex: hasParallelSvc ? 0 : undefined, parallelTotal: hasParallelSvc ? 2 : undefined, health: 'healthy', yaml: routeWorkbenchYaml('Service', `${serviceEntry}-svc`), history: routeWorkbenchHistory },
      },
      {
        id: routerId, type: 'routerPodNode', position: { x: centerX + primaryOffset, y: 865 },
        data: { kind: 'routerPodNode', title: `${serviceEntry}-router-0`, subtitle: `Router Pod · 共置 ${prefillNodes[0] || 'P/D 节点'} · Running`, cluster, groupKey: serviceEntry, namespace: 'production', qps: Math.round(totalQps * primaryWeight / 100), parallelIndex: hasParallelSvc ? 0 : undefined, parallelTotal: hasParallelSvc ? 2 : undefined, health: 'healthy', yaml: routeWorkbenchYaml('Pod', `${serviceEntry}-router-0`), history: routeWorkbenchHistory },
      },
    );
    edges.push(
      { id: `st1-${serviceEntry}-svc`, source: `st1-se-${serviceEntry}`, target: serviceId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: Math.round(totalQps * primaryWeight / 100), weight: primaryWeight } },
      { id: `st1-${serviceEntry}-router`, source: serviceId, target: routerId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: Math.round(totalQps * primaryWeight / 100) } },
    );
    if (hasParallelSvc) {
      const secondaryWeight = 30;
      const secondaryQps = Math.round(totalQps * secondaryWeight / 100);
      const secondaryServiceId = `st1-svc-${serviceEntry}-canary`;
      const secondaryRouterId = `st1-router-${serviceEntry}-canary`;
      nodes.push(
        {
          id: secondaryServiceId, type: 'serviceNode', position: { x: centerX + 220, y: 690 },
          data: { kind: 'serviceNode', title: `${serviceEntry}-canary-svc`, subtitle: 'ClusterIP · 10.43.12.9', cluster, groupKey: serviceEntry, pods: 1, qps: secondaryQps, weight: secondaryWeight, parallelIndex: 1, parallelTotal: 2, health: 'healthy', yaml: routeWorkbenchYaml('Service', `${serviceEntry}-canary-svc`), history: routeWorkbenchHistory },
        },
        {
          id: secondaryRouterId, type: 'routerPodNode', position: { x: centerX + 220, y: 865 },
          data: { kind: 'routerPodNode', title: `${serviceEntry}-canary-router-0`, subtitle: 'Router Pod · Running', cluster, groupKey: serviceEntry, namespace: 'production', qps: secondaryQps, parallelIndex: 1, parallelTotal: 2, health: 'healthy', yaml: routeWorkbenchYaml('Pod', `${serviceEntry}-canary-router-0`), history: routeWorkbenchHistory },
        },
      );
      edges.push(
        { id: `st1-${serviceEntry}-canary-svc`, source: `st1-se-${serviceEntry}`, target: secondaryServiceId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'endpoint', qps: secondaryQps, weight: secondaryWeight } },
        { id: `st1-${serviceEntry}-canary-router`, source: secondaryServiceId, target: secondaryRouterId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'service', active: secondaryQps } },
      );
    }
    const workers = [
      ...prefillNodes.map((nodeName) => ({ role: 'prefill' as const, nodeName })),
      ...decodeNodes.map((nodeName) => ({ role: 'decode' as const, nodeName })),
    ];
    const workerSpacing = 300;
    const workerStartOffset = -((workers.length - 1) * workerSpacing) / 2;
    const prefillQps = Math.max(1, Math.round(totalQps / Math.max(1, prefillNodes.length)));
    prefillNodes.forEach((nodeName, prefillIndex) => {
      const offset = workerStartOffset + prefillIndex * workerSpacing;
      const workerId = `st1-${serviceEntry}-prefill-${prefillIndex + 1}`;
      nodes.push({
        id: workerId, type: 'pdWorkerNode', position: { x: centerX + offset, y: 1045 },
        data: { kind: 'pdWorkerNode', title: `${serviceEntry}-prefill-${prefillIndex + 1}`, subtitle: `Prefill · ${nodeName} · Running`, role: 'prefill', cluster, groupKey: serviceEntry, qps: prefillQps, load: 42 + prefillIndex * 7, health: 'healthy', yaml: routeWorkbenchYaml('Pod', `${serviceEntry}-prefill-${prefillIndex + 1}`), history: routeWorkbenchHistory },
      });
      edges.push({ id: `st1-${serviceEntry}-router-prefill-${prefillIndex + 1}`, source: routerId, target: workerId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned', qps: prefillQps, flowKey: workerId } });
    });
    decodeNodes.forEach((nodeName, decodeIndex) => {
      const decodeId = `st1-${serviceEntry}-decode-${decodeIndex + 1}`;
      const offset = workerStartOffset + (prefillNodes.length + decodeIndex) * workerSpacing;
      nodes.push({
        id: decodeId, type: 'pdWorkerNode', position: { x: centerX + offset, y: 1045 },
        data: { kind: 'pdWorkerNode', title: `${serviceEntry}-decode-${decodeIndex + 1}`, subtitle: `Decode · ${nodeName} · Running`, role: 'decode', cluster, groupKey: serviceEntry, qps: totalQps, load: 68 + decodeIndex * 3, health: 'healthy', yaml: routeWorkbenchYaml('Pod', `${serviceEntry}-decode-${decodeIndex + 1}`), history: routeWorkbenchHistory },
      });
      edges.push({ id: `st1-${serviceEntry}-router-decode-${decodeIndex + 1}`, source: routerId, target: decodeId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned', qps: totalQps, flowKey: decodeId } });
    });
  });
  return { nodes, edges };
};

const st1RouteWorkbenchMockGraph = buildSt1RouteWorkbenchMockGraph(DEFAULT_ROUTE_CONFIGS);

const routeWorkbenchLayerY: Record<RouteWorkbenchKind, number> = {
  modelNode: 80,
  domainNode: 80,
  ingressGroupNode: 250,
  ingressNode: 420,
  clusterNode: 420,
  serviceNode: 600,
  routerPodNode: 780,
  pdWorkerNode: 960,
};

const getRouteWorkbenchNodeKind = (node: Node): RouteWorkbenchKind => {
  const data = node.data as RouteWorkbenchNodeData | undefined;
  return data?.kind || (node.type as RouteWorkbenchKind) || 'serviceNode';
};

const getRouteWorkbenchNewNodePosition = (kind: RouteWorkbenchKind, nodes: Node[]) => {
  const sameLayerCount = nodes.filter((node) => getRouteWorkbenchNodeKind(node) === kind).length;
  return {
    x: Math.max(80, 90 + sameLayerCount * 280),
    y: routeWorkbenchLayerY[kind],
  };
};

const getRouteWorkbenchFreePosition = (kind: RouteWorkbenchKind, nodes: Node[], preferredX?: number) => {
  const layerNodes = nodes.filter((node) => getRouteWorkbenchNodeKind(node) === kind);
  const occupied = layerNodes.map((node) => node.position.x).sort((a, b) => a - b);
  let x = Math.max(80, preferredX ?? 90);
  const gap = 280;
  while (occupied.some((item) => Math.abs(item - x) < 220)) {
    x += gap;
  }
  return {
    x,
    y: routeWorkbenchLayerY[kind],
  };
};

const getRouteWorkbenchLayerOrder = (kind: RouteWorkbenchKind) => {
  return (Object.keys(routeWorkbenchLayerY) as RouteWorkbenchKind[]).indexOf(kind);
};

const layoutRouteWorkbenchNodes = (nodes: Node[]) => {
  const grouped = new Map<RouteWorkbenchKind, Node[]>();
  nodes.forEach((node) => {
    const kind = getRouteWorkbenchNodeKind(node);
    grouped.set(kind, [...(grouped.get(kind) || []), node]);
  });
  const next: Node[] = [];
  (Object.keys(routeWorkbenchLayerY) as RouteWorkbenchKind[]).forEach((kind) => {
    const layerNodes = grouped.get(kind) || [];
    const startX = Math.max(80, 400 - ((layerNodes.length - 1) * 140));
    layerNodes.forEach((node, index) => {
      next.push({
        ...node,
        position: {
          x: Math.max(80, startX + index * 280),
          y: routeWorkbenchLayerY[kind],
        },
      });
    });
  });
  return next;
};

const getRouteResourceGroup = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.startsWith('glm')) return 'glm51';
  if (normalized.startsWith('deepseek')) return 'deepseek';
  if (normalized.startsWith('kimi')) return 'kimi';
  return normalized.replace(/-(service-entry|se|router|svc)$/g, '');
};

const getRouteModelName = (routeName: string) => {
  const normalized = routeName.toLowerCase();
  if (normalized.startsWith('glm-5.1')) return 'glm-5.1';
  if (normalized.startsWith('deepseek')) return 'deepseek-r1';
  if (normalized.startsWith('kimi')) return 'kimi-k2';
  return routeName.replace(/-se$/i, '');
};

const getRouteModelDisplayName = (modelName: string) => {
  const normalized = modelName.toLowerCase();
  if (normalized === 'glm-5.1') return 'GLM-5.1';
  if (normalized === 'deepseek-r1') return 'DeepSeek-R1';
  if (normalized === 'kimi-k2') return 'Kimi-K2';
  return modelName;
};

const getRouteResourceId = (...parts: Array<string | number | undefined>) => parts
  .filter((part) => part !== undefined && part !== '')
  .join('-')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getRouteResourceHealth = (items: Array<{ status?: string; ready?: string }>) => {
  if (!items.length) return 'idle' as const;
  if (items.some((item) => item.status === 'Failed')) return 'error' as const;
  if (items.some((item) => item.status !== 'Running' || item.ready !== '1/1')) return 'warning' as const;
  return 'healthy' as const;
};

const getRouteResourceRoleLabel = (role: string) => {
  if (role === 'prefill') return 'Prefill';
  if (role === 'decode') return 'Decode';
  if (role === 'router') return 'Router';
  return '业务 Pod';
};

const buildServiceYaml = (service: ServiceRecord) => `apiVersion: v1
kind: Service
metadata:
  name: ${service.name}
  namespace: ${service.namespace}
spec:
  type: ${service.type}
  clusterIP: ${service.clusterIP}
  selector:
${Object.entries(service.selector || {}).map(([key, value]) => `    ${key}: ${value}`).join('\n') || '    app: unknown'}
  ports:
${service.ports.map((port) => `    - name: ${port.name}
      protocol: ${port.protocol}
      port: ${port.port}
      targetPort: ${port.targetPort}${port.nodePort ? `\n      nodePort: ${port.nodePort}` : ''}`).join('\n')}`;

const buildPodYaml = (pod: PodRecord) => `apiVersion: v1
kind: Pod
metadata:
  name: ${pod.name}
  namespace: ${pod.namespace}
  labels:
    app: ${pod.group || pod.name}
    role: ${pod.role}
spec:
  nodeName: ${pod.node}
  containers:
    - name: ${pod.role}
      image: ${pod.image}
      ports:
        - containerPort: 8000`;

const buildRouteEntryYaml = (route: RouteEntry) => `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: ${route.name}
  namespace: ${route.namespace}
spec:
  hosts:
${route.hosts.map((host) => `    - ${host}`).join('\n')}
  endpoints:
${route.endpoints.map((endpoint) => `    - address: ${endpoint.address}
      weight: ${endpoint.weight}`).join('\n')}`;

const getPodsForService = (route: RouteEntry, service: ServiceRecord, podRows: PodRecord[]) => {
  const selectorName = service.selector?.['rolebasedgroup.workloads.x-k8s.io/name'];
  const selectorRole = service.selector?.['rolebasedgroup.workloads.x-k8s.io/role'];
  const selectorApp = service.selector?.app;
  const routeGroup = getRouteResourceGroup(route.name);
  const strictMatches = podRows.filter((pod) => {
    if (pod.cluster !== route.cluster) return false;
    if (pod.serviceId === service.key) return true;
    if (selectorRole && pod.role !== selectorRole) return false;
    if (selectorApp && (pod.name === selectorApp || pod.group === selectorApp || pod.name.startsWith(`${selectorApp}-`))) return true;
    if (selectorName && (pod.name === selectorName || pod.name.startsWith(`${selectorName}-`))) return true;
    if (pod.name === service.name || pod.name.startsWith(`${service.name}-`)) return true;
    if (service.name.startsWith(pod.name) && pod.role === 'router') return true;
    return false;
  });
  if (strictMatches.length > 0 || route.services.length > 1) return strictMatches;
  return podRows.filter((pod) =>
    pod.cluster === route.cluster &&
    (!selectorRole || pod.role === selectorRole) &&
    (pod.trafficSource === route.name || pod.group === routeGroup)
  );
};

const getPodsForRoute = (route: RouteEntry, podRows: PodRecord[]) => {
  const serviceIds = new Set(route.services.map((service) => service.key));
  if (serviceIds.size > 0) {
    return podRows.filter((pod) => pod.cluster === route.cluster && !!pod.serviceId && serviceIds.has(pod.serviceId));
  }
  const routeGroup = getRouteResourceGroup(route.name);
  return podRows.filter((pod) => pod.cluster === route.cluster && (pod.trafficSource === route.name || pod.group === routeGroup));
};

const buildRouteWorkbenchFromResources = (routes: RouteEntry[], podRows: PodRecord[], expandedRouteKeys = new Set<string>()) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let routeStartY = 120;
  const clusterRouteStartY = new Map<string, number>();
  const modelNodes = new Map<string, { id: string; y: number; routeCount: number; clusterCount: number; podCount: number; nodeCount: number; health: RouteWorkbenchNodeData['health'] }>();
  const clusterIngress = new Map<string, { ingressId: string; y: number }>();
  const orderedRoutes = [...routes].sort((a, b) => {
    const aModel = getRouteModelName(a.name);
    const bModel = getRouteModelName(b.name);
    const aKnown = ['glm-5.1','deepseek-r1','kimi-k2'].includes(aModel);
    const bKnown = ['glm-5.1','deepseek-r1','kimi-k2'].includes(bModel);
    const aCluster = a.cluster || 'default';
    const bCluster = b.cluster || 'default';
    // Group by cluster first so manual SEs are sibling to same-cluster routes
    const clusterCompare = aCluster.localeCompare(bCluster);
    if (clusterCompare !== 0) return clusterCompare;
    // Within same cluster: known models first, then unknown
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    const modelCompare = aModel.localeCompare(bModel);
    if (modelCompare !== 0) return modelCompare;
    return a.name.localeCompare(b.name);
  });

  const modelStats = new Map<string, { routeCount: number; clusterSet: Set<string>; podCount: number; nodeSet: Set<string>; health: RouteWorkbenchNodeData['health'] }>();
  orderedRoutes.forEach((route) => {
    const modelName = getRouteModelName(route.name);
    const routePods = getPodsForRoute(route, podRows);
    const routeHealth = getRouteResourceHealth(routePods);
    const previous = modelStats.get(modelName) || { routeCount: 0, clusterSet: new Set<string>(), podCount: 0, nodeSet: new Set<string>(), health: 'healthy' as const };
    const nextHealth = previous.health === 'error' || routeHealth === 'error'
      ? 'error'
      : previous.health === 'warning' || routeHealth === 'warning'
        ? 'warning'
        : previous.health === 'idle' && routeHealth !== 'healthy'
          ? routeHealth
          : previous.health;
    modelStats.set(modelName, {
      routeCount: previous.routeCount + 1,
      clusterSet: new Set([...previous.clusterSet, route.cluster || 'default']),
      podCount: previous.podCount + routePods.length,
      nodeSet: new Set([...previous.nodeSet, ...routePods.map((pod) => pod.node).filter(Boolean)]),
      health: nextHealth,
    });
  });

  orderedRoutes.forEach((route, routeIndex) => {
    const modelName = getRouteModelName(route.name);
    const modelId = getRouteResourceId('model', modelName);
    const routeGroup = getRouteResourceGroup(route.name);
    const routePods = getPodsForRoute(route, podRows);
    const routeHealth = getRouteResourceHealth(routePods);
    const seId = getRouteResourceId('se', route.key);
    const baseY = routeStartY;
    let seY = baseY;
    const clusterKey = route.cluster || 'default';
    const modelClusterKey = `${modelName}-${clusterKey}`;
    const isKnownModel = ['glm-5.1','deepseek-r1','kimi-k2'].includes(modelName);
    if (!isKnownModel) seY = clusterRouteStartY.get(clusterKey) ?? routeStartY;
    if (isKnownModel && !modelNodes.has(modelName)) {
      const rawStats = modelStats.get(modelName) || { routeCount: 1, clusterSet: new Set([route.cluster || 'default']), podCount: routePods.length, nodeSet: new Set(routePods.map((pod) => pod.node).filter(Boolean)), health: routeHealth };
      const stats = { ...rawStats, clusterCount: rawStats.clusterSet.size, nodeCount: rawStats.nodeSet.size };
      modelNodes.set(modelName, { id: modelId, y: baseY, routeCount: stats.routeCount, clusterCount: stats.clusterCount, podCount: stats.podCount, nodeCount: stats.nodeCount, health: stats.health });
      nodes.push({
        id: modelId,
        type: 'modelNode',
        position: { x: baseY, y: routeWorkbenchLayerY.modelNode },
        data: {
          kind: 'modelNode',
          title: getRouteModelDisplayName(modelName),
          subtitle: `模型服务 · ${stats.clusterCount} 个集群`,
          qps: 86 - routeIndex * 4,
          pods: stats.podCount,
          nodeCount: stats.nodeCount,
          logo: getRouteModelLogo(modelName),
          health: stats.health,
          yaml: routeWorkbenchYaml('ModelService', modelName),
          history: routeWorkbenchHistory,
        },
      });
    }
    let ingress;
    if (isKnownModel) {
      ingress = clusterIngress.get(modelClusterKey);
      if (!ingress) {
        const ingressId = getRouteResourceId('cluster', modelName, clusterKey);
        ingress = { ingressId, y: baseY };
        clusterIngress.set(modelClusterKey, ingress);
        const clusterRoutes = orderedRoutes.filter((item) => getRouteModelName(item.name) === modelName && (item.cluster || 'default') === clusterKey);
        const clusterServiceIds = new Set(clusterRoutes.flatMap((item) => item.services.map((service) => service.key)));
        const clusterPods = podRows.filter((pod) => pod.cluster === route.cluster && !!pod.serviceId && clusterServiceIds.has(pod.serviceId));
        const clusterNodeCount = new Set(clusterPods.map((pod) => pod.node).filter(Boolean)).size;
        nodes.push(
          {
            id: ingressId,
            type: 'ingressGroupNode',
            position: { x: baseY, y: routeWorkbenchLayerY.ingressGroupNode },
            data: {
              kind: 'ingressGroupNode',
              title: `${clusterKey} 集群`,
              subtitle: `${clusterRoutes.length} SE · ${clusterPods.length} 实例`,
              cluster: clusterKey,
              qps: 78 - routeIndex * 5,
              pods: clusterPods.length,
              nodeCount: clusterNodeCount,
              health: getRouteResourceHealth(clusterPods),
              yaml: routeWorkbenchYaml('Gateway', `${clusterKey}-ingress`),
              history: routeWorkbenchHistory,
            },
          },
        );
        edges.push({ id: `e-${modelId}-${ingressId}`, source: modelId, target: ingressId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'structure' } });
        }
    } else {
      const clusterIngressEntry = Array.from(clusterIngress.entries()).find(([key]) => key.endsWith(`-${clusterKey}`));
      if (clusterIngressEntry) {
        ingress = clusterIngressEntry[1];
      } else {
        const ingressId = getRouteResourceId('cluster', 'manual', clusterKey);
        ingress = { ingressId, y: baseY };
        clusterIngress.set(`manual-${clusterKey}`, ingress);
        nodes.push({
          id: ingressId,
          type: 'ingressGroupNode',
          position: { x: baseY, y: routeWorkbenchLayerY.ingressGroupNode },
          data: {
            kind: 'ingressGroupNode',
            title: `${clusterKey} 集群`,
            subtitle: '手动 SE',
            cluster: clusterKey,
            qps: 70,
            pods: 0,
            nodeCount: 0,
            health: 'healthy',
            yaml: routeWorkbenchYaml('Gateway', `${clusterKey}-ingress`),
            history: [],
          },
        });
      }
    }
    const isExpanded = expandedRouteKeys.has(route.key);

    nodes.push(
      {
        id: seId,
        type: 'clusterNode',
        position: { x: seY, y: routeWorkbenchLayerY.clusterNode },
        data: {
          kind: 'clusterNode',
          title: route.name,
          subtitle: `${isExpanded ? '已展开' : '概览'} · ${route.services.length} SVC · ${routePods.length} POD`,
          cluster: route.cluster,
          namespace: route.namespace,
          hosts: route.hosts[0] || `${route.name}.internal.dns`,
          endpoints: route.endpoints.length,
          pods: routePods.length,
          qps: 76 - routeIndex * 5,
          weight: route.endpoints.reduce((sum, item) => sum + item.weight, 0),
          health: routeHealth,
          yaml: route.yaml || buildRouteEntryYaml(route),
          history: routeWorkbenchHistory,
          sourceRouteKey: route.key,
          expanded: isExpanded,
        },
      },
    );
    const siblingRoutes = orderedRoutes.filter((item) => getRouteModelName(item.name) === modelName && (item.cluster || 'default') === clusterKey);
    const siblingIndex = Math.max(0, siblingRoutes.findIndex((item) => item.key === route.key));
    if (ingress) {
      edges.push(
        {
          id: `e-${ingress.ingressId}-${seId}`,
          source: ingress.ingressId,
          target: seId,
          type: 'trafficEdge',
          markerEnd: routeWorkbenchMarkerEnd,
          data: { type: 'gateway', qps: isKnownModel ? 78 - routeIndex * 5 : 70, parallelIndex: siblingIndex, parallelTotal: siblingRoutes.length },
      },
    );
    }

    let branchY = seY;
    route.services.forEach((service, serviceIndex) => {
      const linkedPods = getPodsForService(route, service, podRows);
      const serviceHealth = getRouteResourceHealth(linkedPods);
      const serviceId = getRouteResourceId('svc', route.key, service.key || service.name);
      const endpoint = route.endpoints.find((item) => item.address.startsWith(service.name));
      edges.push({
        id: `e-${seId}-${serviceId}`,
        source: seId,
        target: serviceId,
        type: 'trafficEdge',
        markerEnd: routeWorkbenchMarkerEnd,
        data: { type: 'endpoint', qps: 28 + (serviceIndex % 12) * 3, weight: endpoint?.weight, healthy: serviceHealth !== 'error' },
      });
      const serviceY = branchY;
      nodes.push({
        id: serviceId,
        type: 'serviceNode',
        position: { x: serviceY, y: routeWorkbenchLayerY.serviceNode },
        data: {
          kind: 'serviceNode',
          title: service.name,
          subtitle: `${service.type} · ${service.clusterIP}`,
          cluster: route.cluster,
          namespace: service.namespace,
          pods: linkedPods.length,
          weight: endpoint?.weight || 0,
          qps: 28 + (serviceIndex % 12) * 3,
          health: serviceHealth,
          sourceServiceKey: service.key,
          yaml: buildServiceYaml(service),
          history: routeWorkbenchHistory,
        },
      });
      if (!isExpanded) {
        branchY += 140;
        return;
      }

      const servicePods = linkedPods.length ? linkedPods : [];
      const routerPods = servicePods.filter((pod) => pod.role === 'router');
      const routeWorkers = podRows.filter((pod) =>
        pod.cluster === route.cluster &&
        (pod.serviceId === service.key || (!pod.serviceId && pod.group === routeGroup)) &&
        (pod.role === 'prefill' || pod.role === 'decode')
      );
      const workerRoleCounts = routeWorkers.reduce<Record<string, number>>((acc, worker) => ({
        ...acc,
        [worker.role]: (acc[worker.role] || 0) + 1,
      }), {});
      const displayPods = routerPods.length ? routerPods : servicePods;
      const workerRowGap = 132;
      const rowHeight = routeWorkers.length > 0 && routerPods.length > 0
        ? Math.max(170, routeWorkers.length * workerRowGap + 24)
        : 140;
      displayPods.forEach((pod, podIndex) => {
        const podKind: RouteWorkbenchKind = pod.role === 'prefill' || pod.role === 'decode' ? 'pdWorkerNode' : 'routerPodNode';
        const podId = getRouteResourceId(podKind === 'pdWorkerNode' ? 'worker' : 'pod', route.key, service.key || service.name, pod.key);
        const podY = serviceY + podIndex * rowHeight;
        nodes.push({
          id: podId,
          type: podKind,
          position: { x: podY, y: routeWorkbenchLayerY[podKind] },
          data: {
            kind: podKind,
            title: pod.name,
            subtitle: `${getRouteResourceRoleLabel(pod.role)} · ${pod.status}`,
            role: pod.role,
            cluster: pod.cluster,
            namespace: pod.namespace,
            qps: pod.role === 'router' ? Math.max(0, Math.round(pod.load * 0.9)) : undefined,
            load: pod.role !== 'router' ? pod.load : undefined,
            meta: pod.role === 'prefill' ? `TTFT ${pod.ttftP99 || '-'}` : pod.role === 'decode' ? `TPOT ${pod.tpotP99 || '-'}` : pod.node,
            health: getRouteResourceHealth([pod]),
            yaml: buildPodYaml(pod),
            history: routeWorkbenchHistory,
          },
        });
        edges.push({
          id: `e-${serviceId}-${podId}`,
          source: serviceId,
          target: podId,
          type: 'trafficEdge',
          markerEnd: routeWorkbenchMarkerEnd,
          data: { type: 'service', active: pod.load, healthy: pod.status === 'Running' && pod.ready === '1/1' },
        });
        if (pod.role === 'router') {
          const workerNodeIds: Record<'prefill' | 'decode', string[]> = { prefill: [], decode: [] };
          const orderedWorkers = [
            ...routeWorkers.filter((worker) => worker.role === 'prefill'),
            ...routeWorkers.filter((worker) => worker.role === 'decode'),
          ];
          orderedWorkers.forEach((worker, workerIndex) => {
            const workerId = getRouteResourceId('worker', route.key, service.key || service.name, pod.key, worker.key);
            const workerY = podY + workerIndex * workerRowGap;
            if (worker.role === 'prefill' || worker.role === 'decode') workerNodeIds[worker.role].push(workerId);
            nodes.push({
              id: workerId,
              type: 'pdWorkerNode',
              position: { x: workerY, y: routeWorkbenchLayerY.pdWorkerNode },
              data: {
                kind: 'pdWorkerNode',
                title: worker.name,
                subtitle: `${getRouteResourceRoleLabel(worker.role)} Pod · ${worker.status}`,
                role: worker.role,
                roleCount: workerRoleCounts[worker.role] || 1,
                cluster: worker.cluster,
                namespace: worker.namespace,
                load: worker.load,
                meta: `${worker.role === 'prefill' ? 'P' : 'D'} ${workerRoleCounts[worker.role] || 1} · ${worker.role === 'prefill' ? `TTFT ${worker.ttftP99 || '-'}` : `TPOT ${worker.tpotP99 || '-'}`}`,
                health: getRouteResourceHealth([worker]),
                yaml: buildPodYaml(worker),
                history: routeWorkbenchHistory,
              },
            });
            edges.push({
              id: `e-${podId}-${workerId}`,
              source: podId,
              target: workerId,
              type: 'trafficEdge',
              markerEnd: routeWorkbenchMarkerEnd,
              data: { type: 'worker', load: worker.load, healthy: worker.status === 'Running' && worker.ready === '1/1' },
            });
          });
          workerNodeIds.prefill.forEach((prefillId, prefillIndex) => {
            const decodeId = workerNodeIds.decode[prefillIndex % workerNodeIds.decode.length];
            if (!decodeId) return;
            const pairLoad = 72 + ((routeIndex + serviceIndex + podIndex + prefillIndex) % 5) * 11;
            edges.push({
              id: `e-pair-${prefillId}-${decodeId}`,
              source: prefillId,
              target: decodeId,
              sourceHandle: 'pair-source',
              targetHandle: 'pair-target',
              type: 'trafficEdge',
              markerEnd: routeWorkbenchMarkerEnd,
              data: { type: 'pair', load: pairLoad, label: String(pairLoad), healthy: true, parallelIndex: prefillIndex, parallelTotal: workerNodeIds.prefill.length },
            });
          });
        }
      });
      branchY += Math.max(1, displayPods.length) * rowHeight;
    });

    routeStartY = Math.max(routeStartY + 220, branchY + 120);
    clusterRouteStartY.set(clusterKey, Math.max(
      (clusterRouteStartY.get(clusterKey) ?? seY) + 220,
      branchY + 120
    ));
  });

  // Fix parallel routing for all gateway edges (ingress → SE)
  {
    const gatewayEdges = edges.filter((e) => {
      const src = nodes.find((n) => n.id === e.source);
      return src && (src.data as any).kind === 'ingressGroupNode';
    });
    const ingressGroups = new Map();
    gatewayEdges.forEach((e) => {
      const g = ingressGroups.get(e.source) || [];
      g.push(e);
      ingressGroups.set(e.source, g);
    });
    ingressGroups.forEach((group: Edge[]) => {
      group.forEach((e: Edge, i: number) => {
        e.data = { ...(e.data as any), parallelIndex: i, parallelTotal: group.length };
      });
    });
  }

  return {
    nodes: nodes.length ? nodes : routeWorkbenchInitialNodes,
    edges: edges.length ? edges : routeWorkbenchInitialEdges,
  };
};

const toRouteWorkbenchResources = (state: K8sResourceState) => {
  const services: ServiceRecord[] = state.services.map((service) => ({
    key: service.id,
    name: service.name,
    namespace: service.namespace,
    clusterIP: service.clusterIP,
    type: service.type,
    ports: service.ports,
    selector: service.selector,
    labels: service.labels,
    externalTrafficPolicy: 'Cluster',
    sessionAffinity: 'None',
    createdAt: service.createdAt,
  }));
  const serviceMap = new Map(services.map((service) => [service.key, service]));
  const podsForRoute: PodRecord[] = state.pods.map((pod) => ({
    key: pod.id,
    name: pod.name,
    cluster: pod.cluster,
    role: pod.role,
    serviceId: pod.serviceId,
    namespace: pod.namespace,
    ready: pod.ready,
    status: pod.status === 'Draft' ? 'Pending' : pod.status,
    restart: pod.restart,
    load: pod.load,
    performance: Math.max(0, 100 - pod.restart * 6),
    image: pod.image,
    podIP: pod.podIP,
    node: pod.node,
    nodeGPU: pod.nodeGPU,
    gpuUtil: pod.gpuUtil,
    gpuVram: pod.gpuVram,
    age: pod.age,
    trafficSource: pod.trafficSource || '',
    group: pod.group,
    tpotP50: pod.tpotP50,
    tpotP99: pod.tpotP99,
    ttftP50: pod.ttftP50,
    ttftP99: pod.ttftP99,
  }));
  const routes: RouteEntry[] = state.serviceEntries.map((entry) => {
    const linkedServices = entry.serviceIds
      .map((serviceId) => serviceMap.get(serviceId))
      .filter((service): service is ServiceRecord => Boolean(service));
    return {
      key: entry.id,
      name: entry.name,
      cluster: entry.cluster,
      namespace: entry.namespace,
      hosts: entry.hosts,
      endpoints: entry.endpoints.map((endpoint) => ({ address: endpoint.address, weight: endpoint.weight })),
      services: linkedServices,
      yaml: entry.yaml || buildStoreServiceEntryYaml(entry),
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  });
  return { routes, pods: podsForRoute };
};

const RouteWorkbenchPage = ({
  onNavigateToNodeManagement,
  title = '链路编排',
}: {
  onNavigateToNodeManagement?: (clusterKey: string) => void;
  title?: string;
}) => {
  const resourceStore = useK8sResourceStore();
  const sharedRouteConfigs = useRouteConfigStore();
  // 该页面暂使用独立 Mock，不随资源管理页面的数据变更而重绘。
  const routeList: RouteEntry[] = [];
  const podList: PodRecord[] = [];
  const [routeWorkbenchExpandedRouteKeys, setRouteWorkbenchExpandedRouteKeys] = useState<string[]>([]);
  const [routeWorkbenchCollapsedClusters, setRouteWorkbenchCollapsedClusters] = useState<string[]>([]);
  const [routeWorkbenchSelected, setRouteWorkbenchSelected] = useState('');
  const [routeWorkbenchPanelTab, setRouteWorkbenchPanelTab] = useState<'detail' | 'relation' | 'yaml' | 'plugins'>('detail');
  const [routeWorkbenchHighlightedNodeIds, setRouteWorkbenchHighlightedNodeIds] = useState<string[]>([]);
  const [routeWorkbenchHighlightedEdgeIds, setRouteWorkbenchHighlightedEdgeIds] = useState<string[]>([]);
  const [routeWorkbenchHighlightedRelationKey, setRouteWorkbenchHighlightedRelationKey] = useState('');
  const [routeWorkbenchResourceSearch, setRouteWorkbenchResourceSearch] = useState('');
  // 默认只展示 4 个入口，避免入口过多时画布首次打开就失去可读性。
  const [routeWorkbenchIngressLimit, setRouteWorkbenchIngressLimit] = useState(4);
  const [routeWorkbenchRpmSort, setRouteWorkbenchRpmSort] = useState<'default' | 'desc' | 'asc'>('desc');
  const [routeWorkbenchVisibleLevel, setRouteWorkbenchVisibleLevel] = useState(4);
  const [routeWorkbenchPdCollapsed, setRouteWorkbenchPdCollapsed] = useState(true);
  const [routeWorkbenchExpandedPdGroupIds, setRouteWorkbenchExpandedPdGroupIds] = useState<string[]>([]);
  const [routeWorkbenchCollapsedNodeIds, setRouteWorkbenchCollapsedNodeIds] = useState<string[]>([]);
  const [routeWorkbenchNodes, setRouteWorkbenchNodes, onRouteWorkbenchNodesChange] = useNodesState(st1RouteWorkbenchMockGraph.nodes);
  const [routeWorkbenchEdges, setRouteWorkbenchEdges, onRouteWorkbenchEdgesChange] = useEdgesState(st1RouteWorkbenchMockGraph.edges);
  useEffect(() => {
    const graph = buildSt1RouteWorkbenchMockGraph(sharedRouteConfigs);
    setRouteWorkbenchNodes(graph.nodes);
    setRouteWorkbenchEdges(graph.edges);
    setRouteWorkbenchSelected('');
  }, [sharedRouteConfigs, setRouteWorkbenchEdges, setRouteWorkbenchNodes]);
  useEffect(() => {
    // 布局算法升级后清理 Fast Refresh 保留下来的旧坐标锁，避免旧错误位置继续污染新布局。
    setRouteWorkbenchNodes((nodes) => nodes.map((node) => ({
      ...node,
      data: { ...(node.data as RouteWorkbenchNodeData), draggedPosition: false },
    })));
  }, [routeWorkbenchLayoutRevision, setRouteWorkbenchNodes]);
  const routeWorkbenchReactFlowRef = useRef<any>(null);
  const routeWorkbenchLevelAnchorRef = useRef<{ id: string; x: number; y: number } | null>(null);
  const routeWorkbenchStateRef = useRef<{ nodes: Node[]; edges: Edge[] }>(st1RouteWorkbenchMockGraph);
  const routeWorkbenchUndoRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const routeWorkbenchFocusNodeIdRef = useRef<string>('');
  const [routeWorkbenchContextMenu, setRouteWorkbenchContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [routeWorkbenchSelectedEdgeId, setRouteWorkbenchSelectedEdgeId] = useState('');
  const [routeWorkbenchEdgeContextMenu, setRouteWorkbenchEdgeContextMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [routeWorkbenchRenameNodeId, setRouteWorkbenchRenameNodeId] = useState('');
  const [routeWorkbenchRenameValue, setRouteWorkbenchRenameValue] = useState('');
  const [routeWorkbenchEditMode, setRouteWorkbenchEditMode] = useState(false);
  const [routeWorkbenchChanges, setRouteWorkbenchChanges] = useState<Array<{ type: string; desc: string }>>([]);
  const [routeWorkbenchYamlDraft, setRouteWorkbenchYamlDraft] = useState('');
  const [routeWorkbenchYamlChangeDesc, setRouteWorkbenchYamlChangeDesc] = useState('');
  const [routeWorkbenchIngressDirty, setRouteWorkbenchIngressDirty] = useState(false);
  const [routeWorkbenchPlugins, setRouteWorkbenchPlugins] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(st1RouteWorkbenchMockGraph.nodes
      .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'ingressNode')
      .map((node, index) => [node.id, index % 2 === 0
        ? ['basic-auth', 'request-rewrite']
        : ['key-auth', 'ai-router']])));
  const [routeWorkbenchPluginDirty, setRouteWorkbenchPluginDirty] = useState(false);
  const [routeWorkbenchPluginAddOpen, setRouteWorkbenchPluginAddOpen] = useState(false);
  const [routeWorkbenchPluginAddValue, setRouteWorkbenchPluginAddValue] = useState<string>();
  const [routeWorkbenchPluginEditingKey, setRouteWorkbenchPluginEditingKey] = useState<string>();
  const [routeWorkbenchPluginDraft, setRouteWorkbenchPluginDraft] = useState<Record<string, RoutePluginConfigValue>>({});
  const [routeWorkbenchPluginConfigs, setRouteWorkbenchPluginConfigs] = useState<Record<string, Record<string, Record<string, RoutePluginConfigValue>>>>({});
  useEffect(() => {
    setRouteWorkbenchPlugins(Object.fromEntries(sharedRouteConfigs.map((route) => [`st1-ingress-${route.name}`, route.policies])));
    setRouteWorkbenchPluginConfigs(Object.fromEntries(sharedRouteConfigs.map((route) => [`st1-ingress-${route.name}`, route.pluginConfigs || {}])));
  }, [sharedRouteConfigs]);
  const [routeWorkbenchGroupCreateOpen, setRouteWorkbenchGroupCreateOpen] = useState(false);
  const [routeWorkbenchGroupCreatePosition, setRouteWorkbenchGroupCreatePosition] = useState<{ x: number; y: number } | undefined>();
  const [routeWorkbenchGroupPrefillCount, setRouteWorkbenchGroupPrefillCount] = useState(4);
  const [routeWorkbenchGroupDecodeCount, setRouteWorkbenchGroupDecodeCount] = useState(1);
  const [routeWorkbenchScalePdRouterId, setRouteWorkbenchScalePdRouterId] = useState('');
  const [routeWorkbenchScalePrefillCount, setRouteWorkbenchScalePrefillCount] = useState(1);
  const [routeWorkbenchScaleDecodeCount, setRouteWorkbenchScaleDecodeCount] = useState(0);
  const [domainCreateOpen, setDomainCreateOpen] = useState(false);
  const [domainCreateName, setDomainCreateName] = useState('');
  const [routeWorkbenchPreviewOpen, setRouteWorkbenchPreviewOpen] = useState(false);
  const [routeWorkbenchModelFilter, setRouteWorkbenchModelFilter] = useState<string>('all');
  const [routeWorkbenchServiceFilter, setRouteWorkbenchServiceFilter] = useState('');
  const [routeWorkbenchCreateKind, setRouteWorkbenchCreateKind] = useState<'se' | 'svc' | ''>('');
  const [routeWorkbenchCreatePosition, setRouteWorkbenchCreatePosition] = useState<{ x: number; y: number } | undefined>();
  const [routeWorkbenchCreateDraftNodeId, setRouteWorkbenchCreateDraftNodeId] = useState('');
  const [routeWorkbenchCreateDraft, setRouteWorkbenchCreateDraft] = useState({
    name: '',
    cluster: 'ST1',
    namespace: 'default',
    serviceEntryId: '',
    serviceType: 'ClusterIP',
    portName: 'http',
    port: 8000,
    targetPort: 8000,
    protocol: 'TCP',
    selectorKey: 'app',
    selectorValue: '',
    podIds: [] as string[],
    yaml: '',
  });
  /* ── YAML 文件选择器 ── */
  const [wbYamlTree, setWbYamlTree] = useState<ConfigTreeNode | null>(null);
  const [wbYamlPickerOpen, setWbYamlPickerOpen] = useState(false);
  const [wbYamlSelectedPath, setWbYamlSelectedPath] = useState('');
  const [wbYamlPreview, setWbYamlPreview] = useState('');
  const [wbYamlPickerLoading, setWbYamlPickerLoading] = useState(false);
  const loadWbYamlTree = async () => {
    if (wbYamlTree) return;
    setWbYamlPickerLoading(true);
    try {
      const res = await rpc('config.list_tree');
      setWbYamlTree(res.root);
    } catch {
      message.error('资源文件加载失败');
    }
    setWbYamlPickerLoading(false);
  };
  const selectWbYamlFile = async (path: string) => {
    setWbYamlSelectedPath(path);
    setWbYamlPickerLoading(true);
    try {
      const res = await rpc('config.get', { path });
      const yaml = res.yaml || '';
      setWbYamlPreview(yaml);
      setRouteWorkbenchCreateDraft((prev) => ({ ...prev, yaml }));
    } catch {
      message.error('YAML 读取失败');
    } finally {
      setWbYamlPickerLoading(false);
    }
  };
  const applyWbConfigYaml = () => {
    if (!wbYamlSelectedPath) return;
    setWbYamlPickerOpen(false);
  };
  const cloneRouteWorkbenchSnapshot = useCallback((snapshot: { nodes: Node[]; edges: Edge[] }) => ({
    nodes: snapshot.nodes.map((node) => ({ ...node, position: { ...node.position }, data: { ...node.data } })),
    edges: snapshot.edges.map((edge) => ({ ...edge, data: edge.data ? { ...edge.data } : edge.data })),
  }), []);
  const pushRouteWorkbenchUndo = useCallback(() => {
    routeWorkbenchUndoRef.current = [
      ...routeWorkbenchUndoRef.current.slice(-29),
      cloneRouteWorkbenchSnapshot(routeWorkbenchStateRef.current),
    ];
  }, [cloneRouteWorkbenchSnapshot]);
  const undoRouteWorkbench = useCallback(() => {
    const previous = routeWorkbenchUndoRef.current.pop();
    if (!previous) return false;
    setRouteWorkbenchNodes(previous.nodes);
    setRouteWorkbenchEdges(previous.edges);
    routeWorkbenchStateRef.current = cloneRouteWorkbenchSnapshot(previous);
    setRouteWorkbenchSelected('');
    setRouteWorkbenchContextMenu(null);
    return true;
  }, [cloneRouteWorkbenchSnapshot, setRouteWorkbenchEdges, setRouteWorkbenchNodes]);
  const handleRouteWorkbenchEdgesChange = useCallback((changes: EdgeChange[]) => {
    const removed = changes.filter((change) => change.type === 'remove');
    if (removed.length) {
      pushRouteWorkbenchUndo();
      setRouteWorkbenchChanges((items) => [...items, { type: '删除', desc: `已删除 ${removed.length} 条连线` }]);
    }
    onRouteWorkbenchEdgesChange(changes);
  }, [onRouteWorkbenchEdgesChange, pushRouteWorkbenchUndo]);
  const deleteRouteWorkbenchEdge = useCallback((edgeId: string) => {
    if (!edgeId) return;
    const edge = routeWorkbenchEdges.find((item) => item.id === edgeId);
    if (!edge) return;
    const sourceKind = (routeWorkbenchNodes.find((node) => node.id === edge.source)?.data as RouteWorkbenchNodeData | undefined)?.kind;
    const targetData = routeWorkbenchNodes.find((node) => node.id === edge.target)?.data as RouteWorkbenchNodeData | undefined;
    const isOfflineWorker = sourceKind === 'routerPodNode' && targetData?.kind === 'pdWorkerNode';
    pushRouteWorkbenchUndo();
    setRouteWorkbenchEdges((items) => items.filter((item) => item.id !== edgeId));
    setRouteWorkbenchSelectedEdgeId('');
    setRouteWorkbenchEdgeContextMenu(null);
    setRouteWorkbenchChanges((items) => [...items, {
      type: isOfflineWorker ? '下线' : '删除',
      desc: isOfflineWorker ? `下线 ${targetData?.title || '下游'} 节点` : '已删除连线',
    }]);
  }, [pushRouteWorkbenchUndo, routeWorkbenchEdges, routeWorkbenchNodes, setRouteWorkbenchEdges]);
  const requestDeleteRouteWorkbenchEdge = useCallback((edgeId: string) => {
    const edge = routeWorkbenchEdges.find((item) => item.id === edgeId);
    if (!edge) return;
    const sourceKind = (routeWorkbenchNodes.find((node) => node.id === edge.source)?.data as RouteWorkbenchNodeData | undefined)?.kind;
    const targetData = routeWorkbenchNodes.find((node) => node.id === edge.target)?.data as RouteWorkbenchNodeData | undefined;
    const targetKind = targetData?.kind;
    const isDrainTraffic = sourceKind === 'clusterNode' && targetKind === 'serviceNode';
    const isOfflineWorker = sourceKind === 'routerPodNode' && targetKind === 'pdWorkerNode';
    const workerName = targetData?.title || '下游';
    Modal.confirm({
      title: isDrainTraffic ? '确认摘流？' : isOfflineWorker ? `确认下线 ${workerName} 节点？` : '确认删除连线？',
      content: isDrainTraffic
        ? '摘流后，该 SE 将不再向此 SVC 转发流量。'
        : isOfflineWorker
          ? `下线后，${workerName} 将不再接收该推理组的流量。`
          : '删除后将解除这两个资源之间的关联。',
      okText: isDrainTraffic ? '摘流' : isOfflineWorker ? '下线节点' : '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => deleteRouteWorkbenchEdge(edgeId),
      onCancel: () => setRouteWorkbenchEdgeContextMenu(null),
    });
  }, [deleteRouteWorkbenchEdge, routeWorkbenchEdges, routeWorkbenchNodes]);
  useEffect(() => {
    routeWorkbenchStateRef.current = { nodes: routeWorkbenchNodes, edges: routeWorkbenchEdges };
  }, [routeWorkbenchEdges, routeWorkbenchNodes]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const flowVariations = new Map<string, number>();
      setRouteWorkbenchEdges((edges) => edges.map((edge) => {
        const data = edge.data as RouteWorkbenchEdgeData | undefined;
        if (!data || (data.qps == null && data.active == null)) return edge;
        const variation = data.flowKey
          ? flowVariations.get(data.flowKey) ?? (() => {
            const next = 0.92 + Math.random() * 0.16;
            flowVariations.set(data.flowKey!, next);
            return next;
          })()
          : 0.92 + Math.random() * 0.16;
        return {
          ...edge,
          data: data.qps != null
            ? { ...data, qps: Math.max(1, Math.round(data.qps * variation)) }
            : { ...data, active: Math.max(1, Math.round((data.active || 1) * variation)) },
        };
      }));
    }, 3000);
    return () => window.clearInterval(timer);
  }, [setRouteWorkbenchEdges]);
  useEffect(() => {
    if (routeWorkbenchFocusNodeIdRef.current) {
      const focusId = routeWorkbenchFocusNodeIdRef.current;
      const node = routeWorkbenchNodes.find((n) => n.id === focusId);
      if (node && routeWorkbenchReactFlowRef.current) {
        const ingressEdge = routeWorkbenchEdges.find((e) => e.target === focusId && (e.data as any)?.type === 'gateway');
        const ingressNode = ingressEdge ? routeWorkbenchNodes.find((n) => n.id === ingressEdge.source) : null;
        if (ingressNode) {
          routeWorkbenchReactFlowRef.current.setCenter(node.position.x + 380, node.position.y, { zoom: 0.8, duration: 400 });
        } else {
          routeWorkbenchReactFlowRef.current.setCenter(node.position.x + 380, node.position.y, { zoom: 1.2, duration: 400 });
        }
        routeWorkbenchFocusNodeIdRef.current = '';
      }
    }
  }, [routeWorkbenchNodes]);
  useEffect(() => {
    const handleRouteWorkbenchUndo = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInputTarget = !!target?.closest('input, textarea, [contenteditable="true"], .monaco-editor');
      if (isInputTarget) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (!undoRouteWorkbench()) message.info('没有可回退的画布操作');
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && routeWorkbenchSelectedEdgeId) {
        event.preventDefault();
        requestDeleteRouteWorkbenchEdge(routeWorkbenchSelectedEdgeId);
      }
    };
    window.addEventListener('keydown', handleRouteWorkbenchUndo);
    return () => window.removeEventListener('keydown', handleRouteWorkbenchUndo);
  }, [requestDeleteRouteWorkbenchEdge, routeWorkbenchSelectedEdgeId, undoRouteWorkbench]);

  const selectedNode = routeWorkbenchNodes.find((node) => node.id === routeWorkbenchSelected) || null;
        const selectedData = selectedNode?.data as RouteWorkbenchNodeData | undefined;
        useEffect(() => {
          const node = routeWorkbenchNodes.find((item) => item.id === routeWorkbenchSelected);
          setRouteWorkbenchYamlDraft(String((node?.data as RouteWorkbenchNodeData | undefined)?.yaml || ''));
          setRouteWorkbenchYamlChangeDesc('');
        }, [routeWorkbenchSelected]);
        const routeWorkbenchModelOptions = routeWorkbenchNodes
          .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'modelNode')
          .map((node) => ({ value: node.id, label: (node.data as RouteWorkbenchNodeData).title }));
        const collectRouteWorkbenchDownstream = (seedIds: string[]) => {
          const collected = new Set(seedIds);
          let changed = true;
          while (changed) {
            changed = false;
            routeWorkbenchEdges.forEach((edge) => {
              if (!collected.has(edge.source) || collected.has(edge.target)) return;
              collected.add(edge.target);
              changed = true;
            });
          }
          return collected;
        };
        const collectRouteWorkbenchUpstream = (seedIds: string[]) => {
          const collected = new Set(seedIds);
          let changed = true;
          while (changed) {
            changed = false;
            routeWorkbenchEdges.forEach((edge) => {
              if (!collected.has(edge.target) || collected.has(edge.source)) return;
              collected.add(edge.source);
              changed = true;
            });
          }
          return collected;
        };
        const toggleWorkbenchNodeChildren = (nodeId: string) => {
          const nodeData = routeWorkbenchNodes.find((node) => node.id === nodeId)?.data as RouteWorkbenchNodeData | undefined;
          if (routeWorkbenchPdCollapsed && nodeData?.kind === 'routerPodNode') {
            // PD 展开宽度变化时重新分配各分支的横向区间，自动拉开 Router 距离。
            setRouteWorkbenchNodes((nodes) => nodes.map((node) => ({
              ...node,
              data: { ...(node.data as RouteWorkbenchNodeData), draggedPosition: false },
            })));
            setRouteWorkbenchExpandedPdGroupIds((ids) => {
              const nextIds = ids.includes(nodeId) ? ids.filter((id) => id !== nodeId) : [...ids, nodeId];
              setRouteWorkbenchVisibleLevel(nextIds.length > 0 ? 5 : 4);
              return nextIds;
            });
            return;
          }
          // 收缩/展开只改变下游的可见性，不能触发其余卡片重新排版。
          // React Flow 实例中的坐标是用户此刻真正看到的位置，先将它们回写并锁定；
          // “默认排版”仍会统一清除 draggedPosition，恢复自动布局。
          const visiblePositionById = new Map<string, { x: number; y: number }>(
            (routeWorkbenchReactFlowRef.current?.getNodes?.() || []).map((node: Node) => [node.id, { ...node.position }]),
          );
          const downstreamNodeIds = collectRouteWorkbenchDownstream([nodeId]);
          downstreamNodeIds.delete(nodeId);
          if (visiblePositionById.size > 0) {
            setRouteWorkbenchNodes((nodes) => nodes.map((node) => {
              const position = visiblePositionById.get(node.id);
              // 即将被隐藏的下游卡片不能锁定；再次展开时需要按分支宽度自适应排布，
              // 尤其是一个推理组下的多个 Prefill / Decode 节点。
              if (position && !downstreamNodeIds.has(node.id)) {
                return { ...node, position, data: { ...(node.data as RouteWorkbenchNodeData), draggedPosition: true } };
              }
              if (downstreamNodeIds.has(node.id)) {
                return { ...node, data: { ...(node.data as RouteWorkbenchNodeData), draggedPosition: false } };
              }
              return node;
            }));
          }
          setRouteWorkbenchCollapsedNodeIds((ids) => ids.includes(nodeId) ? ids.filter((id) => id !== nodeId) : [...ids, nodeId]);
        };
        const modelVisibleIds = routeWorkbenchModelFilter === 'all'
          ? new Set(routeWorkbenchNodes.map((node) => node.id))
          : collectRouteWorkbenchDownstream([routeWorkbenchModelFilter]);
        const serviceKeyword = routeWorkbenchServiceFilter.trim().toLowerCase();
        const serviceMatchedIds = serviceKeyword
          ? routeWorkbenchNodes
            .filter((node) => {
              const data = node.data as RouteWorkbenchNodeData;
              return data.kind === 'serviceNode' && modelVisibleIds.has(node.id) && data.title.toLowerCase().includes(serviceKeyword);
            })
            .map((node) => node.id)
          : [];
        const serviceVisibleIds = serviceKeyword
          ? new Set([
            ...collectRouteWorkbenchUpstream(serviceMatchedIds),
            ...collectRouteWorkbenchDownstream(serviceMatchedIds),
          ])
          : modelVisibleIds;
        const orderedIngressNodes = routeWorkbenchNodes
          .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'ingressNode')
          .sort((left, right) => {
            if (routeWorkbenchRpmSort === 'default') return left.position.x - right.position.x;
            const leftRpm = ((left.data as RouteWorkbenchNodeData).qps || 0) * 60;
            const rightRpm = ((right.data as RouteWorkbenchNodeData).qps || 0) * 60;
            return routeWorkbenchRpmSort === 'desc' ? rightRpm - leftRpm : leftRpm - rightRpm;
          });
        const visibleIngressCount = Math.min(routeWorkbenchIngressLimit, orderedIngressNodes.length);
        const displayIngressNodes = orderedIngressNodes.slice(0, visibleIngressCount);
        const hasIngressLimit = visibleIngressCount < orderedIngressNodes.length;
        const topologyVisibleIds = new Set<string>();
        const addDownstreamTopology = (seedId: string) => {
          topologyVisibleIds.add(seedId);
          let changed = true;
          while (changed) {
            changed = false;
            routeWorkbenchEdges.forEach((edge) => {
              if (!topologyVisibleIds.has(edge.source) || topologyVisibleIds.has(edge.target)) return;
              topologyVisibleIds.add(edge.target);
              changed = true;
            });
          }
        };
        displayIngressNodes.forEach((node) => {
          addDownstreamTopology(node.id);
        });
        // Domain 只作为选中 Ingress 的共同上游展示，不能参与下游遍历，否则会重新展开全部 Ingress。
        displayIngressNodes.forEach((node) => {
          routeWorkbenchEdges.filter((edge) => edge.target === node.id).forEach((edge) => topologyVisibleIds.add(edge.source));
        });
          // 独立创建、尚未关联 Ingress 的 Domain 也需要始终显示在画布上。
        routeWorkbenchNodes
          .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'domainNode')
          .forEach((node) => topologyVisibleIds.add(node.id));
        // 独立创建、尚未连线的 SVC 也必须留在画布上，便于后续手动关联。
        routeWorkbenchNodes
          .filter((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            return data.kind === 'serviceNode' && !routeWorkbenchEdges.some((edge) => edge.target === node.id);
          })
          .forEach((node) => topologyVisibleIds.add(node.id));
        // 刚拖入的草稿以及用户手动摆放的独立节点必须保留在画布上，
        // 不参与 Ingress 数量筛选或自动分区排版。
        routeWorkbenchNodes
          .filter((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            return Boolean(data.isDraft || data.manualPosition);
          })
          .forEach((node) => topologyVisibleIds.add(node.id));
        // 摘流仅移除 SE → SVC 连线；该 SE 已有的 SVC/Router/Worker Group 仍需保留展示。
        routeWorkbenchNodes
          .filter((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            return Boolean(data.groupKey) && topologyVisibleIds.has(`st1-se-${data.groupKey}`);
          })
          .forEach((node) => topologyVisibleIds.add(node.id));
        const collapsedClustersSet = new Set(routeWorkbenchCollapsedClusters);
        const visibleNodes = routeWorkbenchNodes.filter((node) => {
          if (!modelVisibleIds.has(node.id)) return false;
          if (!serviceVisibleIds.has(node.id)) return false;
          if (!topologyVisibleIds.has(node.id)) return false;
          const hiddenByCollapsedAncestor = routeWorkbenchCollapsedNodeIds.some((collapsedId) => node.id !== collapsedId && collectRouteWorkbenchDownstream([collapsedId]).has(node.id));
          if (hiddenByCollapsedAncestor) return false;
          const nd = node.data as RouteWorkbenchNodeData;
          if (routeWorkbenchLevelByKind[nd.kind] > routeWorkbenchVisibleLevel) return false;
          if (
            routeWorkbenchPdCollapsed
            && nd.kind === 'pdWorkerNode'
            && !routeWorkbenchExpandedPdGroupIds.some((routerId) => collectRouteWorkbenchDownstream([routerId]).has(node.id))
          ) return false;
          // Keep ingress group nodes visible even when collapsed
          if (nd.kind === 'ingressGroupNode') return true;
          // Hide nodes belonging to collapsed clusters
          if (nd.cluster && collapsedClustersSet.has(nd.cluster)) return false;
          return true;
        });
        const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
        const visibleEdges = routeWorkbenchEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
        const highlightedNodeIds = new Set(routeWorkbenchHighlightedNodeIds);
        const highlightedEdgeIds = new Set(routeWorkbenchHighlightedEdgeIds);
        const hasHighlightedPath = highlightedNodeIds.size > 0;
  const clusterOptions = ['ST1'];
        // 创建不会触发默认排版：这里只移动视口到落点，节点坐标始终保留拖拽得到的位置。
        const focusWorkbenchPosition = (position?: { x: number; y: number }) => {
          if (!position) return;
          window.requestAnimationFrame(() => {
            routeWorkbenchReactFlowRef.current?.setCenter(position.x + 150, position.y + 48, {
              zoom: 0.92,
              duration: 260,
            });
          });
        };
        const openWorkbenchCreate = (kind: 'se' | 'svc', preset?: Partial<typeof routeWorkbenchCreateDraft>, position?: { x: number; y: number }) => {
    const nextCluster = preset?.cluster || clusterOptions[0] || 'ST1';
          const nextName = preset?.name || '';
          if (position) {
            const draftNodeId = `draft-${kind}-${Date.now()}`;
            const isService = kind === 'svc';
            pushRouteWorkbenchUndo();
            setRouteWorkbenchNodes((nodes) => [...nodes, {
              id: draftNodeId,
              type: isService ? 'serviceNode' : 'clusterNode',
              position,
              data: {
                kind: isService ? 'serviceNode' : 'clusterNode',
                title: isService ? '新建 SVC' : '新建服务网格出口',
                subtitle: isService ? 'ClusterIP · 草稿' : 'ServiceEntry · 草稿',
                cluster: nextCluster,
                pods: 0,
                endpoints: 0,
                health: 'idle',
                yaml: routeWorkbenchYaml(isService ? 'Service' : 'ServiceEntry', isService ? 'new-service' : 'new-service-entry'),
                history: [],
                isDraft: true,
                manualPosition: true,
              },
            }]);
            setRouteWorkbenchCreateDraftNodeId(draftNodeId);
            focusWorkbenchPosition(position);
          } else {
            setRouteWorkbenchCreateDraftNodeId('');
          }
          setRouteWorkbenchCreateKind(kind);
          setRouteWorkbenchCreatePosition(position);
          setWbYamlSelectedPath('');
          setWbYamlPreview('');
          setRouteWorkbenchCreateDraft({
            name: nextName,
            cluster: nextCluster,
            namespace: preset?.namespace || (kind === 'se' ? 'higress-system' : 'default'),
            serviceEntryId: '',
            serviceType: preset?.serviceType || 'ClusterIP',
            portName: preset?.portName || 'http',
            port: preset?.port || 8000,
            targetPort: preset?.targetPort || preset?.port || 8000,
            protocol: preset?.protocol || 'TCP',
            selectorKey: preset?.selectorKey || 'app',
            selectorValue: preset?.selectorValue || nextName,
            podIds: preset?.podIds || [],
            yaml: preset?.yaml || '',
          });
        };
        const cancelWorkbenchCreate = () => {
          if (routeWorkbenchCreateDraftNodeId) {
            setRouteWorkbenchNodes((nodes) => nodes.filter((node) => node.id !== routeWorkbenchCreateDraftNodeId));
            if (routeWorkbenchSelected === routeWorkbenchCreateDraftNodeId) setRouteWorkbenchSelected('');
          }
          setRouteWorkbenchCreateDraftNodeId('');
          setRouteWorkbenchCreateKind('');
          setRouteWorkbenchCreatePosition(undefined);
        };
        const submitWorkbenchCreate = () => {
          const name = routeWorkbenchCreateDraft.name.trim();
          if (!routeWorkbenchCreateKind || !name) {
            message.warning('请输入资源名称');
            return;
          }
          if (routeWorkbenchCreateKind === 'svc' && !/^[A-Za-z][A-Za-z0-9-]*$/.test(name)) {
            message.warning('SVC 名称仅支持英文、数字和连字符，且需以英文字母开头');
            return;
          }
          if (routeWorkbenchCreateKind === 'se') {
            const entry = createManualServiceEntry({
              name,
              cluster: routeWorkbenchCreateDraft.cluster,
              namespace: routeWorkbenchCreateDraft.namespace || 'higress-system',
              hosts: [`${name}.cluster.local`],
              yaml: routeWorkbenchCreateDraft.yaml.trim() || undefined,
            });
            resourceStore.addServiceEntry(entry);
            const position = routeWorkbenchCreatePosition
              || getRouteWorkbenchFreePosition('clusterNode', routeWorkbenchNodes, getRouteWorkbenchNewNodePosition('clusterNode', routeWorkbenchNodes).x);
            const nodeId = `se-${Date.now()}`;
            pushRouteWorkbenchUndo();
            setRouteWorkbenchNodes((nodes) => [...nodes.filter((node) => node.id !== routeWorkbenchCreateDraftNodeId), {
              id: nodeId,
              type: 'clusterNode',
              position,
              data: {
                kind: 'clusterNode',
                title: name,
                subtitle: 'ServiceEntry · 未关联',
                cluster: routeWorkbenchCreateDraft.cluster,
                hosts: `${name}.cluster.local`,
                endpoints: 0,
                health: 'idle',
                yaml: routeWorkbenchCreateDraft.yaml.trim() || routeWorkbenchYaml('ServiceEntry', name),
                history: [],
                sourceRouteKey: entry.id,
                manualPosition: true,
              },
            }]);
            setRouteWorkbenchCreateDraftNodeId('');
            setRouteWorkbenchSelected(nodeId);
            setRouteWorkbenchPanelTab('detail');
            focusWorkbenchPosition(position);
            message.success(`SE ${entry.name} 已创建`);
          } else {
            const service = createManualService({
              name,
              cluster: routeWorkbenchCreateDraft.cluster,
              namespace: routeWorkbenchCreateDraft.namespace || 'default',
              type: 'ClusterIP',
              serviceEntryId: routeWorkbenchCreateDraft.serviceEntryId || undefined,
            });
            resourceStore.addService(service.serviceEntryId
              ? {
                  ...service,
                  yaml: routeWorkbenchCreateDraft.yaml.trim() || service.yaml,
                  labels: { app: name },
                }
              : {
                  ...service,
                  yaml: routeWorkbenchCreateDraft.yaml.trim() || service.yaml,
                  labels: { app: name },
                },
            );
            const position = routeWorkbenchCreatePosition
              || getRouteWorkbenchFreePosition('serviceNode', routeWorkbenchNodes, getRouteWorkbenchNewNodePosition('serviceNode', routeWorkbenchNodes).x);
            const nodeId = `service-${Date.now()}`;
            pushRouteWorkbenchUndo();
            setRouteWorkbenchNodes((nodes) => [...nodes, {
              id: nodeId,
              type: 'serviceNode',
              position,
              data: {
                kind: 'serviceNode',
                title: name,
                subtitle: 'ClusterIP · 未关联',
                cluster: routeWorkbenchCreateDraft.cluster,
                pods: 0,
                health: 'idle',
                yaml: routeWorkbenchCreateDraft.yaml.trim() || routeWorkbenchYaml('Service', name),
                history: [],
                sourceServiceKey: service.id,
                manualPosition: true,
              },
            }]);
            if (routeWorkbenchCreateDraftNodeId) {
              setRouteWorkbenchNodes((nodes) => nodes.filter((node) => node.id !== routeWorkbenchCreateDraftNodeId));
              setRouteWorkbenchCreateDraftNodeId('');
            }
            setRouteWorkbenchSelected(nodeId);
            setRouteWorkbenchPanelTab('detail');
            focusWorkbenchPosition(position);
            message.success(`SVC ${service.name} 已创建`);
          }
          setRouteWorkbenchCreateKind('');
          setRouteWorkbenchCreatePosition(undefined);
        };
        const openWorkbenchRename = (nodeId: string) => {
          const node = routeWorkbenchNodes.find((item) => item.id === nodeId);
          const data = node?.data as RouteWorkbenchNodeData | undefined;
          if (!node || !data) return;
          setRouteWorkbenchRenameNodeId(nodeId);
          setRouteWorkbenchRenameValue(data.title);
          setRouteWorkbenchContextMenu(null);
        };
        const deleteWorkbenchNode = (nodeId: string) => {
          const node = routeWorkbenchNodes.find((item) => item.id === nodeId);
          const data = node?.data as RouteWorkbenchNodeData | undefined;
          const isRouterGroup = data?.kind === 'routerPodNode';
          pushRouteWorkbenchUndo();
          if (isRouterGroup) {
            // 整组下线仅切断 SVC -> Router 的上游流量，保留 Router 与其 PD 节点，便于后续恢复。
            setRouteWorkbenchEdges((edges) => edges.filter((edge) => edge.target !== nodeId));
            setRouteWorkbenchContextMenu(null);
            setRouteWorkbenchChanges((changes) => [...changes, { type: '下线', desc: `整组下线 ${data?.title || nodeId}` }]);
            return;
          }
          setRouteWorkbenchNodes((nodes) => nodes.filter((item) => item.id !== nodeId));
          setRouteWorkbenchEdges((edges) => edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
          if (data?.kind === 'clusterNode' && data.sourceRouteKey) {
            resourceStore.removeServiceEntry(data.sourceRouteKey);
          } else if (data?.kind === 'serviceNode' && data.sourceServiceKey) {
            resourceStore.removeService(data.sourceServiceKey);
          }
          if (routeWorkbenchSelected === nodeId) {
            setRouteWorkbenchSelected('');
            setRouteWorkbenchPanelTab('detail');
          }
          setRouteWorkbenchContextMenu(null);
          setRouteWorkbenchChanges((changes) => [...changes, { type: '删除', desc: `删除 ${data?.title || nodeId}` }]);
        };
        const requestDeleteWorkbenchNode = (nodeId: string) => {
          const node = routeWorkbenchNodes.find((item) => item.id === nodeId);
          const data = node?.data as RouteWorkbenchNodeData | undefined;
          if (!data) return;
          const isRouterGroup = data.kind === 'routerPodNode';
          Modal.confirm({
            title: isRouterGroup ? `确认整组下线 ${data.title}？` : `确认删除 ${data.title}？`,
            content: isRouterGroup
              ? '下线后将停止该推理组的上游流量，但会保留 Router、Prefill 和 Decode 节点。'
              : '删除后将解除该卡片与其关联资源的连线。',
            okText: isRouterGroup ? '整组下线' : '删除',
            okButtonProps: { danger: true },
            cancelText: '取消',
            onOk: () => deleteWorkbenchNode(nodeId),
            onCancel: () => setRouteWorkbenchContextMenu(null),
          });
        };
        const saveWorkbenchRename = () => {
          const nextName = routeWorkbenchRenameValue.trim();
          if (!routeWorkbenchRenameNodeId || !nextName) return;
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => nodes.map((node) => {
            if (node.id !== routeWorkbenchRenameNodeId) return node;
            const data = node.data as RouteWorkbenchNodeData;
            return { ...node, data: { ...data, title: nextName } };
          }));
          setRouteWorkbenchChanges((changes) => [...changes, { type: '修改', desc: `重命名为 ${nextName}` }]);
          setRouteWorkbenchRenameNodeId('');
          setRouteWorkbenchRenameValue('');
        };
        const autoLayoutWorkbench = () => {
          pushRouteWorkbenchUndo();
          setRouteWorkbenchExpandedRouteKeys([]);
          // 排版只处理当前画布，不能回退为初始 Mock 图而丢失用户新建资源。
          // 用户新建的节点是一棵独立分支；不能把它们重新塞进主 Domain 的静态布局，
          // 否则多个 Domain 会落在同一个锚点并相互覆盖。
          setRouteWorkbenchNodes((nodes) => nodes.map((node) => ({
            ...node,
            data: {
              ...(node.data as RouteWorkbenchNodeData),
              manualPosition: Boolean((node.data as RouteWorkbenchNodeData).manualPosition),
            },
          })));
        };
        const resetWorkbenchDefaultLayout = () => {
          pushRouteWorkbenchUndo();
          // “默认排版”只重置布局状态。节点和边必须全部保留，包括用户刚创建的资源与连线。
          setRouteWorkbenchNodes((nodes) => nodes.map((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            // Mock 主链路恢复默认排版；新建分支继续使用独立坐标，避免被主域名布局覆盖。
            return {
              ...node,
              data: {
                ...data,
                manualPosition: Boolean(data.manualPosition),
                draggedPosition: false,
              },
            };
          }));
          setRouteWorkbenchSelected('');
          setRouteWorkbenchPanelTab('detail');
          setRouteWorkbenchContextMenu(null);
          setRouteWorkbenchHighlightedNodeIds([]);
          setRouteWorkbenchHighlightedEdgeIds([]);
          setRouteWorkbenchHighlightedRelationKey('');
          setRouteWorkbenchPdCollapsed(true);
          setRouteWorkbenchExpandedPdGroupIds([]);
          setRouteWorkbenchCollapsedNodeIds([]);
          message.success('已恢复主链路默认排版，并保留新建集群分支的位置与连线');
        };
        const addWorkbenchNode = (kind: RouteWorkbenchKind, position?: { x: number; y: number }, role?: 'prefill' | 'decode') => {
          if (kind === 'domainNode') {
            const id = `domain-${Date.now()}`;
            const title = 'new-domain';
            const nodePosition = position || getRouteWorkbenchFreePosition('domainNode', routeWorkbenchNodes, getRouteWorkbenchNewNodePosition('domainNode', routeWorkbenchNodes).x);
            pushRouteWorkbenchUndo();
            setRouteWorkbenchNodes((nodes) => [...nodes, {
              id,
              type: 'domainNode',
              position: nodePosition,
      data: { kind: 'domainNode', title, subtitle: '新建集群', meta: '运行中', health: 'idle', yaml: routeWorkbenchYaml('Cluster', title), history: [], isDraft: true, manualPosition: true },
            }]);
            setRouteWorkbenchSelected(id);
            setRouteWorkbenchPanelTab('detail');
            focusWorkbenchPosition(nodePosition);
            setRouteWorkbenchChanges((changes) => [...changes, { type: '新增', desc: '新增集群节点' }]);
            return;
          }
          const label = routeWorkbenchKindLabel[kind];
          const id = `${kind}-${Date.now()}`;
          const title = kind === 'pdWorkerNode' ? `new-${role || 'worker'}` : `new-${label.toLowerCase()}`;
          const nodePosition = position || getRouteWorkbenchFreePosition(kind, routeWorkbenchNodes, getRouteWorkbenchNewNodePosition(kind, routeWorkbenchNodes).x);
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => [
            ...nodes,
            {
              id,
              type: kind,
              position: nodePosition,
              data: {
                kind,
                title,
                subtitle: kind === 'pdWorkerNode' ? `${role === 'decode' ? 'Decode' : 'Prefill'} · 未关联` : '未关联资源',
                cluster: kind === 'ingressNode' ? 'st1' : 'st',
                role: kind === 'pdWorkerNode' ? role || 'prefill' : undefined,
                health: 'idle',
                yaml: routeWorkbenchYaml(label, title),
                history: [],
                isDraft: true,
                manualPosition: true,
              },
            },
          ]);
          setRouteWorkbenchSelected(id);
          setRouteWorkbenchPanelTab('detail');
          focusWorkbenchPosition(nodePosition);
          setRouteWorkbenchChanges((changes) => [...changes, { type: '新增', desc: `新增 ${label} 节点` }]);
        };
        const confirmWorkbenchDraft = (nodeId: string) => {
          const draftPosition = routeWorkbenchNodes.find((node) => node.id === nodeId)?.position;
          const confirmedIds = new Set<string>([nodeId]);
          const collectDraftChildren = (parentId: string) => {
            routeWorkbenchEdges
              .filter((edge) => edge.source === parentId)
              .forEach((edge) => {
                const child = routeWorkbenchNodes.find((node) => node.id === edge.target);
                if ((child?.data as RouteWorkbenchNodeData | undefined)?.isDraft && !confirmedIds.has(edge.target)) {
                  confirmedIds.add(edge.target);
                  collectDraftChildren(edge.target);
                }
              });
          };
          collectDraftChildren(nodeId);
          setRouteWorkbenchNodes((nodes) => nodes.map((node) => confirmedIds.has(node.id)
            ? { ...node, data: { ...(node.data as RouteWorkbenchNodeData), isDraft: false } }
            : node));
          setRouteWorkbenchIngressDirty(false);
          focusWorkbenchPosition(draftPosition);
          // 创建完成后关闭右侧草稿面板，画布仅保留正式卡片。
          setRouteWorkbenchSelected('');
          setRouteWorkbenchPanelTab('detail');
          setRouteWorkbenchChanges((changes) => [...changes, { type: '新增', desc: '已创建资源卡片' }]);
          message.success('资源卡片已创建');
        };
        const cancelWorkbenchDraft = (nodeId: string) => {
          const removedIds = new Set<string>([nodeId]);
          const collectDraftChildren = (parentId: string) => {
            routeWorkbenchEdges
              .filter((edge) => edge.source === parentId)
              .forEach((edge) => {
                const child = routeWorkbenchNodes.find((node) => node.id === edge.target);
                if ((child?.data as RouteWorkbenchNodeData | undefined)?.isDraft && !removedIds.has(edge.target)) {
                  removedIds.add(edge.target);
                  collectDraftChildren(edge.target);
                }
              });
          };
          collectDraftChildren(nodeId);
          setRouteWorkbenchNodes((nodes) => nodes.filter((node) => !removedIds.has(node.id)));
          setRouteWorkbenchEdges((edges) => edges.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target)));
          setRouteWorkbenchSelected('');
          setRouteWorkbenchIngressDirty(false);
          message.info('已取消创建');
        };
        const addWorkbenchGroup = (position?: { x: number; y: number }, prefillCount = 4, decodeCount = 1) => {
          const stamp = Date.now();
          const center = position || getRouteWorkbenchFreePosition('routerPodNode', routeWorkbenchNodes, getRouteWorkbenchNewNodePosition('routerPodNode', routeWorkbenchNodes).x);
          const routerId = `router-group-${stamp}`;
          const workerSpacing = 300;
          const totalWorkerCount = prefillCount + decodeCount;
          const workerOffsets = Array.from({ length: totalWorkerCount }, (_, index) => (index - (totalWorkerCount - 1) / 2) * workerSpacing);
          const prefillOffsets = workerOffsets.slice(0, prefillCount);
          const decodeOffsets = workerOffsets.slice(prefillCount);
          const groupNodes: Node[] = [
            { id: routerId, type: 'routerPodNode', position: center, data: { kind: 'routerPodNode', title: 'new-router-0', subtitle: 'Router Pod · 未关联', cluster: 'st', qps: 40, health: 'idle', yaml: routeWorkbenchYaml('Pod', 'new-router-0'), history: [], isDraft: true, manualPosition: true } },
            ...prefillOffsets.map((offset, index) => ({ id: `prefill-group-${stamp}-${index + 1}`, type: 'pdWorkerNode', position: { x: center.x + offset, y: center.y + 180 }, data: { kind: 'pdWorkerNode' as const, title: `new-prefill-${index + 1}`, subtitle: 'Prefill · 未关联', role: 'prefill', cluster: 'st', qps: 10, health: 'idle' as const, yaml: routeWorkbenchYaml('Pod', `new-prefill-${index + 1}`), history: [], isDraft: true, manualPosition: true } })),
            ...decodeOffsets.map((offset, index) => ({ id: `decode-group-${stamp}-${index + 1}`, type: 'pdWorkerNode', position: { x: center.x + offset, y: center.y + 180 }, data: { kind: 'pdWorkerNode' as const, title: `new-decode-${index + 1}`, subtitle: 'Decode · 未关联', role: 'decode', cluster: 'st', qps: Math.max(1, prefillCount * 10 / Math.max(decodeCount, 1)), health: 'idle' as const, yaml: routeWorkbenchYaml('Pod', `new-decode-${index + 1}`), history: [], isDraft: true, manualPosition: true } })),
          ];
          const groupEdges: Edge[] = [
            ...prefillOffsets.map((_, index) => ({ id: `edge-${routerId}-prefill-${index + 1}`, source: routerId, target: `prefill-group-${stamp}-${index + 1}`, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned' as const, qps: 10 } })),
            ...decodeOffsets.map((_, index) => ({ id: `edge-${routerId}-decode-${index + 1}`, source: routerId, target: `decode-group-${stamp}-${index + 1}`, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned' as const, qps: Math.max(1, prefillCount * 10 / Math.max(decodeCount, 1)) } })),
          ];
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => [...nodes, ...groupNodes]);
          setRouteWorkbenchEdges((edges) => [...edges, ...groupEdges]);
          setRouteWorkbenchSelected(routerId);
          setRouteWorkbenchPanelTab('detail');
          focusWorkbenchPosition(center);
          setRouteWorkbenchChanges((changes) => [...changes, { type: '新增', desc: `新增 Group（Router + ${prefillCount} Prefill + ${decodeCount} Decode）` }]);
        };
        const openScalePdNodes = (routerId: string) => {
          const routerData = routeWorkbenchNodes.find((node) => node.id === routerId)?.data as RouteWorkbenchNodeData | undefined;
          if (routerData?.kind !== 'routerPodNode') return;
          setRouteWorkbenchScalePdRouterId(routerId);
          setRouteWorkbenchScalePrefillCount(1);
          setRouteWorkbenchScaleDecodeCount(0);
          setRouteWorkbenchContextMenu(null);
        };
        const scalePdNodes = () => {
          const router = routeWorkbenchNodes.find((node) => node.id === routeWorkbenchScalePdRouterId);
          const routerData = router?.data as RouteWorkbenchNodeData | undefined;
          const prefillCount = routeWorkbenchScalePrefillCount;
          const decodeCount = routeWorkbenchScaleDecodeCount;
          if (!router || routerData?.kind !== 'routerPodNode') return;
          if (prefillCount + decodeCount < 1) {
            message.warning('请至少扩容一个 Prefill 或 Decode 节点');
            return;
          }

          const stamp = Date.now();
          const existingWorkerIds = routeWorkbenchEdges
            .filter((edge) => edge.source === router.id)
            .map((edge) => edge.target);
          const existingWorkers = routeWorkbenchNodes.filter((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            return existingWorkerIds.includes(node.id) && data.kind === 'pdWorkerNode';
          });
          const existingPrefillCount = existingWorkers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'prefill').length;
          const existingDecodeCount = existingWorkers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'decode').length;
          const newWorkers: Node[] = [
            ...Array.from({ length: prefillCount }, (_, index) => {
              const title = `${routerData.title}-prefill-${existingPrefillCount + index + 1}`;
              return {
                id: `pd-scale-${stamp}-prefill-${index + 1}`,
                type: 'pdWorkerNode',
                position: { x: router.position.x, y: router.position.y + 190 },
                data: { kind: 'pdWorkerNode', title, subtitle: 'Prefill · 未关联', role: 'prefill', cluster: routerData.cluster, qps: 10, health: 'idle', yaml: routeWorkbenchYaml('Pod', title), history: [], manualPosition: true },
              };
            }),
            ...Array.from({ length: decodeCount }, (_, index) => {
              const title = `${routerData.title}-decode-${existingDecodeCount + index + 1}`;
              return {
                id: `pd-scale-${stamp}-decode-${index + 1}`,
                type: 'pdWorkerNode',
                position: { x: router.position.x, y: router.position.y + 190 },
                data: { kind: 'pdWorkerNode', title, subtitle: 'Decode · 未关联', role: 'decode', cluster: routerData.cluster, qps: Math.max(10, prefillCount * 10), health: 'idle', yaml: routeWorkbenchYaml('Pod', title), history: [], manualPosition: true },
              };
            }),
          ];
          const allWorkers = [...existingWorkers, ...newWorkers].sort((a, b) => {
            const roleA = (a.data as RouteWorkbenchNodeData).role === 'decode' ? 1 : 0;
            const roleB = (b.data as RouteWorkbenchNodeData).role === 'decode' ? 1 : 0;
            return roleA - roleB;
          });
          const spacing = 260;
          const workerY = Math.max(router.position.y + 190, ...existingWorkers.map((node) => node.position.y));
          const nextPositions = new Map(allWorkers.map((node, index) => [node.id, {
            x: router.position.x + (index - (allWorkers.length - 1) / 2) * spacing,
            y: workerY,
          }]));
          const newEdges: Edge[] = newWorkers.map((node) => ({
            id: `edge-${router.id}-${node.id}`,
            source: router.id,
            target: node.id,
            type: 'trafficEdge',
            markerEnd: routeWorkbenchMarkerEnd,
            data: { type: 'aligned' as const, qps: (node.data as RouteWorkbenchNodeData).qps || 10 },
          }));
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => [
            ...nodes.map((node) => nextPositions.has(node.id)
              ? { ...node, position: nextPositions.get(node.id)!, data: { ...(node.data as RouteWorkbenchNodeData), manualPosition: true } }
              : node),
            ...newWorkers.map((node) => ({ ...node, position: nextPositions.get(node.id)! })),
          ]);
          setRouteWorkbenchEdges((edges) => [...edges, ...newEdges]);
          setRouteWorkbenchChanges((changes) => [...changes, { type: '扩容', desc: `${routerData.title} 扩容 ${prefillCount} 个 Prefill、${decodeCount} 个 Decode 节点` }]);
          setRouteWorkbenchScalePdRouterId('');
          message.success('PD 节点扩容完成');
        };
        const createDomainCard = () => {
          const name = domainCreateName.trim();
          if (!name) {
            message.warning('请输入集群名称');
            return;
          }
          const id = `domain-${Date.now()}`;
          const position = getRouteWorkbenchFreePosition('domainNode', routeWorkbenchNodes, getRouteWorkbenchNewNodePosition('domainNode', routeWorkbenchNodes).x);
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => [...nodes, {
            id,
            type: 'domainNode',
            position,
            data: { kind: 'domainNode', title: name, subtitle: '新建集群', meta: '运行中', health: 'healthy', yaml: routeWorkbenchYaml('Cluster', name), history: [], manualPosition: true },
          }]);
          setRouteWorkbenchSelected(id);
          setRouteWorkbenchPanelTab('detail');
          window.requestAnimationFrame(() => routeWorkbenchReactFlowRef.current?.setCenter(position.x + 170, position.y + 44, { zoom: 0.9, duration: 300 }));
          setDomainCreateOpen(false);
          setDomainCreateName('');
          message.success('集群卡片已创建');
        };
        const syncWorkbenchFromContainerResources = () => {
          const nextGraph = buildRouteWorkbenchFromResources(routeList, podList, new Set());
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes(nextGraph.nodes);
          setRouteWorkbenchEdges(nextGraph.edges);
          setRouteWorkbenchExpandedRouteKeys([]);
          setRouteWorkbenchSelected('');
          setRouteWorkbenchPanelTab('detail');
          setRouteWorkbenchContextMenu(null);
          setRouteWorkbenchChanges([]);
          message.success('已从容器管理同步 SE / SVC / POD 拓扑');
        };
        const rebuildWorkbenchWithExpandedRoutes = (expandedKeys: string[]) => {
          const nextGraph = buildRouteWorkbenchFromResources(routeList, podList, new Set(expandedKeys));
          setRouteWorkbenchNodes(nextGraph.nodes);
          setRouteWorkbenchEdges(nextGraph.edges);
          setRouteWorkbenchExpandedRouteKeys(expandedKeys);
        };
        const toggleWorkbenchRouteExpand = (routeKey: string) => {
          const expanded = routeWorkbenchExpandedRouteKeys.includes(routeKey);
          const nextKeys = expanded
            ? routeWorkbenchExpandedRouteKeys.filter((key) => key !== routeKey)
            : [...routeWorkbenchExpandedRouteKeys, routeKey];
          pushRouteWorkbenchUndo();
          rebuildWorkbenchWithExpandedRoutes(nextKeys);
        };
        const collapseAllWorkbenchRoutes = () => {
          pushRouteWorkbenchUndo();
          rebuildWorkbenchWithExpandedRoutes([]);
          setRouteWorkbenchSelected('');
          setRouteWorkbenchPanelTab('detail');
          setRouteWorkbenchContextMenu(null);
          message.success('已收回全部 SE 分支');
        };
        const toggleClusterCollapse = (clusterName: string) => {
          setRouteWorkbenchCollapsedClusters((prev) =>
            prev.includes(clusterName)
              ? prev.filter((c) => c !== clusterName)
              : [...prev, clusterName]
          );
        };
        const quickAddWorkbenchChild = (parentId: string, parentKind: RouteWorkbenchKind) => {
          const parent = routeWorkbenchNodes.find((node) => node.id === parentId);
          const parentData = parent?.data as RouteWorkbenchNodeData | undefined;
          if (!parent || !parentData) return;
          if (parentKind === 'ingressGroupNode') {
            openWorkbenchCreate('se', {
      cluster: parentData.cluster || 'ST1',
              namespace: 'higress-system',
            });
            return;
          }
          if (parentKind === 'clusterNode') {
            openWorkbenchCreate('svc', {
      cluster: parentData.cluster || 'ST1',
              namespace: 'default',
              serviceEntryId: parentData.sourceRouteKey || '',
            });
            return;
          }
        };
        const onWorkbenchConnect = (connection: Connection) => {
          if (!connection.source || !connection.target) return;
          const source = routeWorkbenchNodes.find((node) => node.id === connection.source);
          const target = routeWorkbenchNodes.find((node) => node.id === connection.target);
          const sourceData = source?.data as RouteWorkbenchNodeData | undefined;
          const targetData = target?.data as RouteWorkbenchNodeData | undefined;
          const sourceTitle = source ? (source.data as RouteWorkbenchNodeData).title : connection.source;
          const targetTitle = target ? (target.data as RouteWorkbenchNodeData).title : connection.target;
          const id = `e-${connection.source}-${connection.target}-${Date.now()}`;
          const isDomainToIngress = sourceData?.kind === 'domainNode' && targetData?.kind === 'ingressNode';
          const isIngressToSe = (sourceData?.kind === 'ingressNode' || sourceData?.kind === 'ingressGroupNode') && targetData?.kind === 'clusterNode';
          const nextEdge = {
              id,
              source: connection.source!,
              target: connection.target!,
              type: 'trafficEdge',
              markerEnd: routeWorkbenchMarkerEnd,
              data: isDomainToIngress
                ? { type: 'direct', qps: sourceData?.qps, flowKey: connection.target }
                : isIngressToSe
                  ? { type: 'aligned', qps: sourceData?.qps, weight: 100, flowKey: connection.source }
                  : { type: 'endpoint', pending: true, label: 'pending' },
          };
          pushRouteWorkbenchUndo();
          setRouteWorkbenchEdges((edges) => {
            if (isDomainToIngress) {
              return [...edges.filter((edge) => !(edge.target === connection.target && (routeWorkbenchNodes.find((node) => node.id === edge.source)?.data as RouteWorkbenchNodeData | undefined)?.kind === 'domainNode')), nextEdge];
            }
            if (isIngressToSe) {
              return [...edges.filter((edge) => !(edge.source === connection.source && (routeWorkbenchNodes.find((node) => node.id === edge.target)?.data as RouteWorkbenchNodeData | undefined)?.kind === 'clusterNode')), nextEdge];
            }
            return [...edges, nextEdge];
          });
          if (isDomainToIngress) {
            setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === connection.target ? { ...node, data: { ...(node.data as RouteWorkbenchNodeData), domain: sourceData?.title } } : node));
          }
          if (isIngressToSe) {
            const hosts = targetData?.hosts || `${targetData?.title || ''}.internal.dns`;
            setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === connection.source ? { ...node, data: { ...(node.data as RouteWorkbenchNodeData), domain: hosts } } : node));
          }
          setRouteWorkbenchChanges((changes) => [...changes, { type: '关联', desc: `${sourceTitle} -> ${targetTitle}` }]);
        };
        const collectBranchEdges = (seedId: string, direction: 'upstream' | 'downstream') => {
          const nodeIds = new Set([seedId]);
          const edgeIds = new Set<string>();
          let changed = true;
          while (changed) {
            changed = false;
            routeWorkbenchEdges.forEach((item) => {
              const from = direction === 'upstream' ? item.target : item.source;
              const to = direction === 'upstream' ? item.source : item.target;
              if (!nodeIds.has(from) || nodeIds.has(to)) return;
              nodeIds.add(to);
              edgeIds.add(item.id);
              changed = true;
            });
          }
          return { nodeIds, edgeIds };
        };
        const toggleHighlightDownstreamBranch = (nodeId: string) => {
          const downstream = collectBranchEdges(nodeId, 'downstream');
          const branchNodeIds = [...downstream.nodeIds];
          const branchEdgeIds = [...downstream.edgeIds];
          const isCurrentBranchHighlighted = branchNodeIds.length === routeWorkbenchHighlightedNodeIds.length
            && branchNodeIds.every((id) => routeWorkbenchHighlightedNodeIds.includes(id))
            && branchEdgeIds.length === routeWorkbenchHighlightedEdgeIds.length
            && branchEdgeIds.every((id) => routeWorkbenchHighlightedEdgeIds.includes(id));
          setRouteWorkbenchHighlightedNodeIds(isCurrentBranchHighlighted ? [] : branchNodeIds);
          setRouteWorkbenchHighlightedEdgeIds(isCurrentBranchHighlighted ? [] : branchEdgeIds);
          setRouteWorkbenchHighlightedRelationKey('');
          setRouteWorkbenchContextMenu(null);
        };
        const highlightFullResourcePath = (nodeId: string) => {
          // 搜索定位时临时展开全部入口，确保目标卡片及其完整链路可见。
          setRouteWorkbenchIngressLimit(Math.max(1, orderedIngressNodes.length));
          const upstream = collectBranchEdges(nodeId, 'upstream');
          const downstream = collectBranchEdges(nodeId, 'downstream');
          setRouteWorkbenchHighlightedNodeIds([...new Set([...upstream.nodeIds, ...downstream.nodeIds])]);
          setRouteWorkbenchHighlightedEdgeIds([...new Set([...upstream.edgeIds, ...downstream.edgeIds])]);
          setRouteWorkbenchHighlightedRelationKey('');
          setRouteWorkbenchSelected(nodeId);
          setRouteWorkbenchPanelTab('detail');
          const node = routeWorkbenchNodes.find((item) => item.id === nodeId);
          if (node && routeWorkbenchReactFlowRef.current) {
            routeWorkbenchReactFlowRef.current.setCenter(node.position.x + 130, node.position.y + 44, { zoom: 0.86, duration: 320 });
          }
        };
        const searchResourcePath = (keyword: string) => {
          const normalized = keyword.trim().toLowerCase();
          if (!normalized) return;
          const node = routeWorkbenchNodes.find((item) => {
            const data = item.data as RouteWorkbenchNodeData;
            return (data.kind === 'clusterNode' || data.kind === 'ingressNode') && data.title.toLowerCase().includes(normalized);
          });
          if (!node) {
            message.warning('未找到匹配的 SE 或 Ingress');
            return;
          }
          highlightFullResourcePath(node.id);
        };
        const changeIngressLimit = (value: number | null) => {
          const maximum = Math.max(1, orderedIngressNodes.length);
          const nextValue = Math.min(Math.max(1, Number(value || 4)), maximum);
          setRouteWorkbenchIngressLimit(nextValue);
          if (!routeWorkbenchReactFlowRef.current) return;
          window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
            routeWorkbenchReactFlowRef.current?.fitView({ padding: 0.24, duration: 320 });
          }));
        };
        const changeVisibleLevel = (direction: -1 | 1) => {
          const nextLevel = Math.min(5, Math.max(0, routeWorkbenchVisibleLevel + direction));
          if (nextLevel === routeWorkbenchVisibleLevel) return;
          const displayedNodes = (routeWorkbenchReactFlowRef.current?.getNodes?.() || []) as Node[];
          const anchorNode = displayedNodes.find((node) => {
            const data = node.data as RouteWorkbenchNodeData;
            return routeWorkbenchLevelByKind[data.kind] === 0 && routeWorkbenchEdges.some((edge) => edge.source === node.id);
          });
          if (anchorNode) routeWorkbenchLevelAnchorRef.current = { id: anchorNode.id, x: anchorNode.position.x, y: anchorNode.position.y };
          // 全局逐级控制必须让父节点与新出现的子节点使用同一套布局坐标。
          // 仅保留用户手动创建/摆放的节点，其余节点统一释放旧的坐标锁。
          setRouteWorkbenchNodes((nodes) => nodes.map((node) => ({
            ...node,
            data: {
              ...(node.data as RouteWorkbenchNodeData),
              draggedPosition: (node.data as RouteWorkbenchNodeData).manualPosition ? (node.data as RouteWorkbenchNodeData).draggedPosition : false,
            },
          })));
          setRouteWorkbenchCollapsedNodeIds([]);
          setRouteWorkbenchVisibleLevel(nextLevel);
          setRouteWorkbenchPdCollapsed(nextLevel < 5);
          setRouteWorkbenchExpandedPdGroupIds([]);
        };
        const highlightRelatedPath = (edgeId: string) => {
          const edge = routeWorkbenchEdges.find((item) => item.id === edgeId);
          if (!edge || !selectedNode) return;
          const isDownstream = edge.source === selectedNode.id;
          const relatedNodeId = isDownstream ? edge.target : edge.source;
          // 高亮按“实际经过的边”计算；共享 SE 的其他入边不会因为两端节点同时存在而被误选。
          const upstream = collectBranchEdges(isDownstream ? selectedNode.id : relatedNodeId, 'upstream');
          const downstream = collectBranchEdges(isDownstream ? relatedNodeId : selectedNode.id, 'downstream');
          const pathNodeIds = new Set([selectedNode.id, relatedNodeId, ...upstream.nodeIds, ...downstream.nodeIds]);
          const pathEdgeIds = new Set([edge.id, ...upstream.edgeIds, ...downstream.edgeIds]);
          setRouteWorkbenchHighlightedNodeIds([...pathNodeIds]);
          setRouteWorkbenchHighlightedEdgeIds([...pathEdgeIds]);
          setRouteWorkbenchHighlightedRelationKey(edgeId);
        };
        const compactPositionById = new Map<string, { x: number; y: number }>();
        if (hasIngressLimit) {
          const compactIngressX = (index: number) => 320 + index * 360;
          // RPM 只决定有限展示时的入选优先级；画布仍沿拓扑顺序摆放，避免跨 SE 连线交叉。
          const layoutIngressNodes = [...displayIngressNodes].sort((left, right) => left.position.x - right.position.x);
          const visibleIngressIds = new Set(layoutIngressNodes.map((node) => node.id));
          layoutIngressNodes.forEach((node, index) => {
            compactPositionById.set(node.id, { x: compactIngressX(index), y: 210 });
          });
          const domainId = routeWorkbenchEdges.find((edge) => visibleIngressIds.has(edge.target))?.source;
          if (domainId) {
            const centerX = compactIngressX((layoutIngressNodes.length - 1) / 2) + 120;
            compactPositionById.set(domainId, { x: centerX - 170, y: -420 });
          }
          const targetSourcePositions = new Map<string, number[]>();
          routeWorkbenchEdges.forEach((edge) => {
            if (!visibleIngressIds.has(edge.source)) return;
            const sourcePosition = compactPositionById.get(edge.source);
            if (!sourcePosition) return;
            targetSourcePositions.set(edge.target, [...(targetSourcePositions.get(edge.target) || []), sourcePosition.x]);
          });
          targetSourcePositions.forEach((positions, targetId) => {
            compactPositionById.set(targetId, { x: positions.reduce((sum, value) => sum + value, 0) / positions.length - 10, y: 455 });
          });
          let changed = true;
          while (changed) {
            changed = false;
            routeWorkbenchEdges.forEach((edge) => {
              const sourcePosition = compactPositionById.get(edge.source);
              if (!sourcePosition || compactPositionById.has(edge.target)) return;
              const target = routeWorkbenchNodes.find((node) => node.id === edge.target);
              if (!target) return;
              compactPositionById.set(edge.target, { x: sourcePosition.x, y: target.position.y });
              changed = true;
            });
          }
          // Router 下的实例单独展开为扇区：4 个 Prefill 横向均分，Decode 固定在正下方。
          // 不能继续沿用父节点中心点，否则有限展示时多个 Worker 会重叠。
          const workerSpacing = 300;
          routeWorkbenchNodes
            .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'routerPodNode')
            .forEach((router) => {
              const routerPosition = compactPositionById.get(router.id);
              if (!routerPosition) return;
              const workers = routeWorkbenchEdges
                .filter((edge) => edge.source === router.id)
                .map((edge) => routeWorkbenchNodes.find((node) => node.id === edge.target))
                .filter((node): node is Node => node != null)
                .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'pdWorkerNode');
              const prefills = workers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'prefill');
              const decodes = workers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'decode');
              [...prefills, ...decodes].forEach((worker, index, allWorkers) => {
                compactPositionById.set(worker.id, {
                  x: routerPosition.x + (index - (allWorkers.length - 1) / 2) * workerSpacing,
                  y: 1045,
                });
              });
            });
        }
        const collapsedIngressPositionById = new Map<string, { x: number; y: number }>();
        const collapsedGroupPositionByKey = new Map<string, { x: number; y: number }>();
        const collapsedDomainPositionById = new Map<string, { x: number; y: number }>();
        const expandedPdPositionById = new Map<string, { x: number; y: number }>();
        if (visibleNodes.some((node) => (node.data as RouteWorkbenchNodeData).kind === 'ingressNode')) {
          const visibleIngressNodes = visibleNodes.filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'ingressNode');
          const groupKeys = Array.from(new Set([
            ...visibleNodes
              .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'clusterNode')
              .map((node) => (node.data as RouteWorkbenchNodeData).title),
            ...visibleNodes
              .map((node) => (node.data as RouteWorkbenchNodeData).groupKey)
              .filter((key): key is string => Boolean(key)),
          ]));
          let nextLaneX = 420;
          groupKeys.forEach((key) => {
            const serviceEntryNode = visibleNodes.find((node) => {
              const data = node.data as RouteWorkbenchNodeData;
              return data.kind === 'clusterNode' && data.title === key;
            });
            const routerNode = visibleNodes.find((node) => {
              const data = node.data as RouteWorkbenchNodeData;
              return data.kind === 'routerPodNode'
                && data.groupKey === key
                && routeWorkbenchEdges.some((edge) => {
                  if (edge.source !== node.id) return false;
                  const targetData = routeWorkbenchNodes.find((item) => item.id === edge.target)?.data as RouteWorkbenchNodeData | undefined;
                  return targetData?.kind === 'pdWorkerNode';
                });
            });
            const groupIngresses = visibleIngressNodes.filter((ingress) => routeWorkbenchEdges.some((edge) => edge.source === ingress.id && edge.target === serviceEntryNode?.id));
            const groupServices = visibleNodes.filter((node) => {
              const data = node.data as RouteWorkbenchNodeData;
              return data.kind === 'serviceNode' && data.groupKey === key;
            });
            // 每棵树的宽度由它的 Ingress 数量决定：单入口紧凑，多入口自动展开。
            const routerId = routerNode?.id;
            const pdExpanded = Boolean(routerId && (!routeWorkbenchPdCollapsed || routeWorkbenchExpandedPdGroupIds.includes(routerId)));
            const workers = routerId
              ? routeWorkbenchEdges
                .filter((edge) => edge.source === routerId)
                .map((edge) => routeWorkbenchNodes.find((node) => node.id === edge.target))
                .filter((node): node is Node => node != null)
                .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'pdWorkerNode')
              : [];
            // 整棵树按实际内容占位：展开 PD 时扩大当前树的分区，后续树自动右移。
            // 画布视角不做 fitView，避免用户正在查看的位置被重置。
            const ingressSpacing = pdExpanded ? 300 : 260;
            const workerSpacing = 300;
            const pdWidth = pdExpanded
              ? Math.max(620, (workers.length - 1) * workerSpacing + 340)
              : 0;
            // 并行 SVC/Router 的中心间距是 440px，卡片实际宽约 290px。
            // 分区宽度必须同时覆盖这些并行卡片，否则会侵入相邻 SE 分区。
            const parallelBranchWidth = groupServices.length > 1
              ? (groupServices.length - 1) * 440 + 340
              : 0;
            const laneWidth = Math.max(520, groupIngresses.length * ingressSpacing + 180, parallelBranchWidth, pdWidth);
            const groupCenter = nextLaneX + laneWidth / 2;
            collapsedGroupPositionByKey.set(key, { x: groupCenter, y: 455 });
            groupIngresses.forEach((ingress, index) => {
              collapsedIngressPositionById.set(ingress.id, {
                x: groupCenter + (index - (groupIngresses.length - 1) / 2) * ingressSpacing,
                y: 210,
              });
            });
            if (pdExpanded && routerId) {
              const prefills = workers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'prefill');
              const decodes = workers.filter((node) => (node.data as RouteWorkbenchNodeData).role === 'decode');
              const routerData = routerNode?.data as RouteWorkbenchNodeData | undefined;
              const routerParallelOffset = routerData?.parallelTotal && routerData.parallelTotal > 1
                ? (routerData.parallelIndex === 0 ? -220 : 220)
                : 0;
              const pdCenterX = groupCenter + routerParallelOffset;
              const pdRowY = (routerNode?.position.y ?? 865) + 180;
              [...prefills, ...decodes].forEach((worker, index, allWorkers) => {
                expandedPdPositionById.set(worker.id, {
                  x: pdCenterX + (index - (allWorkers.length - 1) / 2) * workerSpacing,
                  y: pdRowY,
                });
              });
            }
            nextLaneX += laneWidth + (pdExpanded ? 180 : 120);
          });
          // 无下游关联的新增 Ingress 仍放入紧凑行尾。
          const ungroupedIngressNodes = visibleIngressNodes.filter((node) => !collapsedIngressPositionById.has(node.id));
          ungroupedIngressNodes.forEach((node, index) => {
            collapsedIngressPositionById.set(node.id, { x: nextLaneX + index * 360, y: 210 });
          });
          if (ungroupedIngressNodes.length > 0) nextLaneX += ungroupedIngressNodes.length * 360;
          const laidOutIngressPositions = [...collapsedIngressPositionById.values()];
          const firstIngressX = laidOutIngressPositions.length > 0 ? Math.min(...laidOutIngressPositions.map((position) => position.x)) : 420;
          const lastIngressX = laidOutIngressPositions.length > 0 ? Math.max(...laidOutIngressPositions.map((position) => position.x)) : firstIngressX;
          // 入口卡片宽约 240，根卡片宽约 340；用卡片中心而不是左边界对齐。
          const compactDomainX = (firstIngressX + lastIngressX) / 2 + 120 - 170;
          visibleNodes.filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'domainNode').forEach((node) => {
            collapsedDomainPositionById.set(node.id, { x: compactDomainX, y: -420 });
          });

          // 层级切换时以根卡片为视觉锚点，把整套自动布局做同量平移。
          const levelAnchor = routeWorkbenchLevelAnchorRef.current;
          const plannedAnchor = levelAnchor ? collapsedDomainPositionById.get(levelAnchor.id) || compactPositionById.get(levelAnchor.id) : undefined;
          const anchorShiftX = levelAnchor && plannedAnchor ? levelAnchor.x - plannedAnchor.x : 0;
          if (anchorShiftX !== 0) {
            [compactPositionById, collapsedIngressPositionById, collapsedGroupPositionByKey, collapsedDomainPositionById, expandedPdPositionById].forEach((positionMap) => {
              positionMap.forEach((position, key) => positionMap.set(key, { ...position, x: position.x + anchorShiftX }));
            });
          }
        }
        const workbenchFlowNodes = visibleNodes.map((node) => {
          const nd = node.data as RouteWorkbenchNodeData;
          const clusterCollapsed = nd.kind === 'ingressGroupNode' && nd.cluster && routeWorkbenchCollapsedClusters.includes(nd.cluster);
          const groupKey = nd.kind === 'clusterNode' ? nd.title : nd.groupKey;
          const collapsedGroupPosition = groupKey ? collapsedGroupPositionByKey.get(groupKey) : undefined;
          const compactPdPosition = collapsedGroupPosition && (nd.kind === 'clusterNode' || nd.kind === 'serviceNode' || nd.kind === 'routerPodNode')
            ? {
              x: collapsedGroupPosition.x + (nd.parallelTotal && nd.parallelTotal > 1 ? (nd.parallelIndex === 0 ? -220 : 220) : 0),
              y: node.position.y,
            }
            : undefined;
          const expandedPdPosition = expandedPdPositionById.get(node.id);
          const levelAnchorPosition = routeWorkbenchLevelAnchorRef.current?.id === node.id
            ? { x: routeWorkbenchLevelAnchorRef.current.x, y: routeWorkbenchLevelAnchorRef.current.y }
            : undefined;
          return {
            ...node,
            // 普通收缩时保留仍可见节点的位置；主动展开 PD 组会先清除锁定，再采用自适应布局坐标。
            position: nd.manualPosition || nd.draggedPosition
              ? node.position
              : levelAnchorPosition || expandedPdPosition || collapsedDomainPositionById.get(node.id) || collapsedIngressPositionById.get(node.id) || compactPdPosition || compactPositionById.get(node.id) || node.position,
            data: {
              ...nd,
              onQuickAdd: quickAddWorkbenchChild,
              hasChildren: routeWorkbenchEdges.some((edge) => edge.source === node.id),
              collapsed: routeWorkbenchCollapsedNodeIds.includes(node.id)
                || (routeWorkbenchPdCollapsed && (node.data as RouteWorkbenchNodeData).kind === 'routerPodNode' && !routeWorkbenchExpandedPdGroupIds.includes(node.id)),
              onToggleChildren: toggleWorkbenchNodeChildren,
              subtitle: clusterCollapsed ? `${nd.subtitle || ''} · 已折叠` : nd.subtitle,
              highlighted: highlightedNodeIds.has(node.id),
              dimmed: hasHighlightedPath && !highlightedNodeIds.has(node.id),
            },
          };
        });
        const workbenchFlowEdges = visibleEdges.map((edge) => ({
          ...edge,
          data: {
            ...(edge.data as RouteWorkbenchEdgeData),
            highlighted: highlightedEdgeIds.has(edge.id),
            dimmed: hasHighlightedPath && !highlightedEdgeIds.has(edge.id),
          },
        }));
        const renderWorkbenchPanel = () => {
          if (!selectedNode || !selectedData) return null;
          const openIngressRouteDrawer = false;
          if (openIngressRouteDrawer && selectedData.kind === 'ingressNode') {
            const closeRouteEditor = () => setRouteWorkbenchSelected('');
            return (
              <Drawer
                className="ataas-ingress-route-editor-drawer"
                title="编辑路由"
                placement="right"
                width={860}
                open
                onClose={closeRouteEditor}
                extra={<Space><Button onClick={closeRouteEditor}>取消</Button><Button type="primary" onClick={() => { setRouteWorkbenchChanges((changes) => [...changes, { type: '修改', desc: `已更新 Ingress 路由 ${selectedData.title}` }]); message.success('路由配置已保存'); closeRouteEditor(); }}>确定</Button></Space>}
              >
                <div className="ataas-ingress-route-editor">
                  <section>
                    <label className="required">路由名称 <Tooltip title="路由名称长度不超过 63 个字符">?</Tooltip></label>
                    <Input defaultValue={selectedData.title} maxLength={63} showCount disabled />
                  </section>
                  <section>
                    <label>域名</label>
                    <Input value={routeWorkbenchIngressMockDomain} readOnly />
                  </section>
                  <section>
                    <label className="required">匹配规则 <Tooltip title="请求满足以下条件时会命中该路由">?</Tooltip></label>
                    <div className="ataas-ingress-route-rule">
                      <span className="rule-label required">路径（Path）</span>
                      <div className="ataas-ingress-route-rule-row">
                        <Select defaultValue="前缀匹配" options={[{ value: '前缀匹配', label: '前缀匹配' }, { value: '精确匹配', label: '精确匹配' }, { value: '正则匹配', label: '正则匹配' }]} />
                        <Input defaultValue="/" />
                        <Checkbox>忽略大小写</Checkbox>
                      </div>
                      <span className="rule-label">方法（Method）</span>
                      <Select mode="multiple" defaultValue={['GET', 'POST']} options={['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'].map((value) => ({ value, label: value }))} />
                    </div>
                  </section>
                  {[
                    ['请求头（Header）', '参数'],
                    ['请求参数（Query）', '参数'],
                  ].map(([name, addLabel]) => (
                    <section key={name}>
                      <label>{name} <Tooltip title="可按 Key、条件和值筛选请求">?</Tooltip></label>
                      <div className="ataas-ingress-route-empty-table">
                        <div><strong>Key</strong><strong>条件</strong><strong>值</strong><strong>操作</strong></div>
                        <span>暂无数据</span>
                      </div>
                      <Button type="link" icon={<PlusOutlined />}>{addLabel}</Button>
                    </section>
                  ))}
                  <section className="ataas-ingress-route-auth">
                    <label>是否启用请求认证</label>
                    <Switch defaultChecked />
                    <p>启用后，只有包含指定消费者认证信息的请求可以请求本路由。</p>
                    <label>认证方式</label>
                    <Select defaultValue="Key Auth" options={[{ value: 'Key Auth', label: 'Key Auth' }]} disabled />
                    <small>目前仅支持 Key Auth 认证</small>
                    <label>允许请求本路由的消费者名称列表</label>
                    <Select mode="tags" placeholder="允许请求本路由的消费者名称列表" />
                    <Button type="link">创建消费者</Button>
                  </section>
                  <section>
                    <label>附加注解（Annotation） <Tooltip title="为路由补充自定义注解">?</Tooltip></label>
                    <div className="ataas-ingress-route-empty-table compact">
                      <div><strong>Key</strong><strong>值</strong><strong>操作</strong></div>
                      <span>暂无数据</span>
                    </div>
                    <Button type="link" icon={<PlusOutlined />}>注解</Button>
                  </section>
                  <section>
                    <label className="required">目标服务</label>
                    <Select mode="multiple" defaultValue={['llm-mydeepseek.internal.dns:443']} options={[{ value: 'llm-mydeepseek.internal.dns:443', label: 'llm-mydeepseek.internal.dns:443' }]} />
                  </section>
                </div>
              </Drawer>
            );
          }
          const typeLabel = routeWorkbenchKindLabel[selectedData.kind];
          const relatedEdges = routeWorkbenchEdges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id);
          const serviceEntryNodes = routeWorkbenchNodes
            .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'clusterNode');
          const serviceEntryOptions = serviceEntryNodes
            .map((node) => {
              const data = node.data as RouteWorkbenchNodeData;
              const hosts = data.hosts || `${data.title}.internal.dns`;
              return { value: node.id, label: `${data.title} · ${hosts}` };
            });
          const linkedServiceEntryId = relatedEdges
            .filter((edge) => edge.source === selectedNode.id)
            .map((edge) => routeWorkbenchNodes.find((node) => node.id === edge.target))
            .filter((node): node is Node => Boolean(node))
            .filter((node) => (node.data as RouteWorkbenchNodeData).kind === 'clusterNode')
            .map((node) => node.id)[0];
          const linkedServiceEntry = serviceEntryNodes.find((node) => node.id === linkedServiceEntryId);
          const ingressServiceHosts = routeWorkbenchIngressMockDomain;
          const relatedItems = relatedEdges.map((edge) => {
            const isOutgoing = edge.source === selectedNode.id;
            const relatedNode = routeWorkbenchNodes.find((node) => node.id === (isOutgoing ? edge.target : edge.source));
            const relatedData = relatedNode?.data as RouteWorkbenchNodeData | undefined;
            return {
              key: edge.id,
              direction: isOutgoing ? '下游' : '上游',
              title: relatedData?.title || (isOutgoing ? edge.target : edge.source),
              kind: relatedData?.kind ? routeWorkbenchKindLabel[relatedData.kind] : '资源',
              edgeType: ((edge.data as RouteWorkbenchEdgeData | undefined)?.type || 'structure').toUpperCase(),
            };
          });
          const pushWorkbenchChange = (type: string, desc: string) => {
            setRouteWorkbenchChanges((changes) => [...changes, { type, desc }]);
            message.success(desc);
          };
          const renderPanelBody = () => {
            if (routeWorkbenchPanelTab === 'relation') {
              return (
                <div className="ataas-route-workbench-relation">
                  {relatedItems.length > 0 ? relatedItems.map((item) => (
                    <button key={item.key} type="button" className={routeWorkbenchHighlightedRelationKey === item.key ? 'active' : ''} onClick={() => highlightRelatedPath(item.key)}>
                      <span>{item.direction}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <em>{item.kind} · {item.edgeType}</em>
                      </div>
                    </button>
                  )) : (
                    <div className="ataas-route-workbench-empty">暂无关联资源</div>
                  )}
                </div>
              );
            }
            if (routeWorkbenchPanelTab === 'yaml') {
              const yamlChanged = routeWorkbenchYamlDraft !== String(selectedData.yaml || '');
              const saveYamlChange = () => {
                if (!yamlChanged) {
                  message.info('YAML 内容未发生变化');
                  return;
                }
                const changeDesc = routeWorkbenchYamlChangeDesc.trim();
                if (!changeDesc) {
                  message.warning('请填写变更情况');
                  return;
                }
                setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === selectedNode.id
                  ? { ...node, data: { ...(node.data as RouteWorkbenchNodeData), yaml: routeWorkbenchYamlDraft } }
                  : node));
                setRouteWorkbenchChanges((changes) => [...changes, { type: 'YAML 修改', desc: `${selectedData.title}：${changeDesc}` }]);
                setRouteWorkbenchYamlChangeDesc('');
                message.success('YAML 修改已保存');
              };
              return (
                <div className="ataas-route-workbench-yaml-editor">
                  <Input.TextArea
                    className="ataas-route-workbench-yaml-input"
                    value={routeWorkbenchYamlDraft}
                    onChange={(event) => setRouteWorkbenchYamlDraft(event.target.value)}
                    autoSize={{ minRows: 16, maxRows: 30 }}
                    spellCheck={false}
                  />
                  {yamlChanged && (
                    <div className="ataas-route-workbench-yaml-change">
                      <label>
                        <span>变更情况 <em>*</em></span>
                        <Input.TextArea
                          value={routeWorkbenchYamlChangeDesc}
                          onChange={(event) => setRouteWorkbenchYamlChangeDesc(event.target.value)}
                          placeholder="请说明本次 YAML 修改内容和原因"
                          autoSize={{ minRows: 3, maxRows: 6 }}
                          maxLength={500}
                          showCount
                        />
                      </label>
                      <div className="ataas-route-workbench-yaml-actions">
                        <Button onClick={() => {
                          setRouteWorkbenchYamlDraft(String(selectedData.yaml || ''));
                          setRouteWorkbenchYamlChangeDesc('');
                        }}>取消修改</Button>
                        <Button type="primary" icon={<SaveOutlined />} disabled={!routeWorkbenchYamlChangeDesc.trim()} onClick={saveYamlChange}>保存修改</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if (routeWorkbenchPanelTab === 'plugins') {
              const enabledPlugins = routeWorkbenchPlugins[selectedNode.id] || [];
              const attachedPlugins = routeWorkbenchPluginCatalog.filter((plugin) => enabledPlugins.includes(plugin.key));
              const availablePlugins = routeWorkbenchPluginCatalog.filter((plugin) => !enabledPlugins.includes(plugin.key));
              const selectedPlugin = routeWorkbenchPluginCatalog.find((plugin) => plugin.key === routeWorkbenchPluginAddValue);
              const selectedPluginFields = routeWorkbenchPluginAddValue
                ? ROUTE_PLUGIN_CONFIG_SCHEMAS[routeWorkbenchPluginAddValue] || []
                : [];
              const pluginDraftInvalid = selectedPluginFields.some((field) => {
                if (!field.required) return false;
                const value = routeWorkbenchPluginDraft[field.key];
                return value === '' || value == null || (Array.isArray(value) && !value.length);
              });
              const openPluginEditor = (pluginKey?: string) => {
                setRouteWorkbenchPluginEditingKey(pluginKey);
                setRouteWorkbenchPluginAddValue(pluginKey);
                setRouteWorkbenchPluginDraft(pluginKey
                  ? routeWorkbenchPluginConfigs[selectedNode.id]?.[pluginKey] || buildRoutePluginConfigDefaults(pluginKey)
                  : {});
                setRouteWorkbenchPluginAddOpen(true);
              };
              const updatePluginDraft = (key: string, value: RoutePluginConfigValue) => {
                setRouteWorkbenchPluginDraft((draft) => ({ ...draft, [key]: value }));
              };
              return (
                <>
                  <div className="ataas-route-workbench-plugins">
                    <div className="ataas-route-workbench-plugins-heading">
                      <div>
                        <strong>路由插件（{attachedPlugins.length}）</strong>
                        <span>仅展示当前路由已开启的插件，不包含全局插件。</span>
                      </div>
                      <Button type="primary" size="small" icon={<PlusOutlined />} disabled={!availablePlugins.length} onClick={() => {
                        openPluginEditor();
                      }}>添加插件</Button>
                    </div>
                    <div className="ataas-route-workbench-plugin-list">
                      {attachedPlugins.map((plugin) => (
                        <div className="ataas-route-workbench-plugin-item" key={plugin.key}>
                          <i>PL</i>
                          <div>
                            <strong>{plugin.name}</strong>
                            <span>{plugin.description}</span>
                            <em>{plugin.phase || plugin.category}</em>
                          </div>
                          <div className="ataas-route-workbench-plugin-actions">
                            <Button type="link" size="small" onClick={() => openPluginEditor(plugin.key)}>配置</Button>
                            <Button type="text" danger size="small" onClick={() => {
                              setRouteWorkbenchPlugins((items) => ({
                                ...items,
                                [selectedNode.id]: (items[selectedNode.id] || []).filter((item) => item !== plugin.key),
                              }));
                              setRouteWorkbenchPluginConfigs((items) => ({
                                ...items,
                                [selectedNode.id]: Object.fromEntries(Object.entries(items[selectedNode.id] || {}).filter(([key]) => key !== plugin.key)),
                              }));
                              setRouteWorkbenchPluginDirty(true);
                            }}>移除</Button>
                          </div>
                        </div>
                      ))}
                      {!attachedPlugins.length && (
                        <div className="ataas-route-workbench-plugin-empty">
                          <span>当前路由暂无已开启插件</span>
                          <Button type="link" onClick={() => openPluginEditor()}>添加插件</Button>
                        </div>
                      )}
                    </div>
                    {routeWorkbenchPluginDirty && (
                      <div className="ataas-route-workbench-plugin-save">
                        <span>路由插件配置已修改，尚未应用</span>
                        <Button type="primary" size="small" onClick={() => {
                          const routeName = selectedNode.id.replace(/^st1-ingress-/, '');
                          const sharedRoute = sharedRouteConfigs.find((route) => route.name === routeName);
                          if (sharedRoute) routeConfigStore.update(sharedRoute.id, {
                            policies: routeWorkbenchPlugins[selectedNode.id] || [],
                            pluginConfigs: routeWorkbenchPluginConfigs[selectedNode.id] || {},
                          });
                          setRouteWorkbenchPluginDirty(false);
                          pushWorkbenchChange('修改', `已应用 ${selectedData.title} 的路由插件配置`);
                        }}>应用更改</Button>
                      </div>
                    )}
                  </div>
                  <Modal
                    className="ataas-route-workbench-plugin-modal"
                    title={routeWorkbenchPluginEditingKey
                      ? `配置 ${selectedPlugin?.name || '路由插件'}`
                      : routeWorkbenchPluginAddValue
                        ? `配置 ${selectedPlugin?.name || '路由插件'}`
                        : '添加路由插件'}
                    open={routeWorkbenchPluginAddOpen}
                    width={640}
                    onCancel={() => {
                      setRouteWorkbenchPluginAddOpen(false);
                      setRouteWorkbenchPluginAddValue(undefined);
                      setRouteWorkbenchPluginEditingKey(undefined);
                      setRouteWorkbenchPluginDraft({});
                    }}
                    footer={routeWorkbenchPluginAddValue ? (
                      <div className="ataas-route-workbench-plugin-modal-footer">
                        {!routeWorkbenchPluginEditingKey && (
                          <Button onClick={() => {
                            setRouteWorkbenchPluginAddValue(undefined);
                            setRouteWorkbenchPluginDraft({});
                          }}>返回插件列表</Button>
                        )}
                        <span />
                        <Button onClick={() => {
                          setRouteWorkbenchPluginAddOpen(false);
                          setRouteWorkbenchPluginAddValue(undefined);
                          setRouteWorkbenchPluginEditingKey(undefined);
                          setRouteWorkbenchPluginDraft({});
                        }}>取消</Button>
                        <Button type="primary" disabled={pluginDraftInvalid} onClick={() => {
                          if (!routeWorkbenchPluginAddValue) return;
                          setRouteWorkbenchPlugins((items) => ({
                            ...items,
                            [selectedNode.id]: Array.from(new Set([...(items[selectedNode.id] || []), routeWorkbenchPluginAddValue])),
                          }));
                          setRouteWorkbenchPluginConfigs((items) => ({
                            ...items,
                            [selectedNode.id]: {
                              ...(items[selectedNode.id] || {}),
                              [routeWorkbenchPluginAddValue]: routeWorkbenchPluginDraft,
                            },
                          }));
                          setRouteWorkbenchPluginDirty(true);
                          setRouteWorkbenchPluginAddOpen(false);
                          setRouteWorkbenchPluginAddValue(undefined);
                          setRouteWorkbenchPluginEditingKey(undefined);
                          setRouteWorkbenchPluginDraft({});
                        }}>{routeWorkbenchPluginEditingKey ? '保存配置' : '添加并启用'}</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setRouteWorkbenchPluginAddOpen(false)}>取消</Button>
                    )}
                  >
                    <div className="ataas-route-workbench-plugin-picker">
                      {!routeWorkbenchPluginAddValue ? (
                        <>
                          <div className="ataas-route-workbench-plugin-choose-head">
                            <strong>选择插件</strong>
                            <span>从插件管理中选择一个已启用且支持路由范围的插件。</span>
                          </div>
                          <div className="ataas-route-workbench-plugin-choice-list">
                            {availablePlugins.map((plugin) => (
                              <button key={plugin.key} type="button" onClick={() => {
                                setRouteWorkbenchPluginAddValue(plugin.key);
                                setRouteWorkbenchPluginDraft(buildRoutePluginConfigDefaults(plugin.key));
                              }}>
                                <i>{plugin.name.slice(0, 1)}</i>
                                <span>
                                  <strong>{plugin.name}</strong>
                                  <small>{plugin.key} · {plugin.description}</small>
                                </span>
                                <em>{plugin.category}</em>
                                <b>配置</b>
                              </button>
                            ))}
                          </div>
                        </>
                      ) : selectedPlugin && (
                        <>
                          <div className="ataas-route-workbench-plugin-selected">
                            <i>{selectedPlugin.name.slice(0, 1)}</i>
                            <span>
                              <strong>{selectedPlugin.name}</strong>
                              <small>{selectedPlugin.key} · {selectedPlugin.description}</small>
                            </span>
                            <em>{selectedPlugin.category}</em>
                          </div>
                          <div className="ataas-route-workbench-plugin-config-form">
                            <h4>插件配置</h4>
                            {selectedPluginFields.map((field) => (
                              <label key={field.key} className={`field-${field.type}`}>
                                <span>{field.required && <em>*</em>}{field.label}</span>
                                {field.type === 'input' && <Input value={String(routeWorkbenchPluginDraft[field.key] ?? '')} placeholder={field.placeholder} onChange={(event) => updatePluginDraft(field.key, event.target.value)} />}
                                {field.type === 'textarea' && <Input.TextArea value={String(routeWorkbenchPluginDraft[field.key] ?? '')} placeholder={field.placeholder} autoSize={{ minRows: 3, maxRows: 6 }} onChange={(event) => updatePluginDraft(field.key, event.target.value)} />}
                                {field.type === 'number' && <InputNumber value={Number(routeWorkbenchPluginDraft[field.key] ?? 0)} min={0} onChange={(value) => updatePluginDraft(field.key, Number(value ?? 0))} />}
                                {field.type === 'select' && <Select value={String(routeWorkbenchPluginDraft[field.key] ?? '') || undefined} placeholder={field.placeholder || '请选择'} options={field.options} onChange={(value) => updatePluginDraft(field.key, value)} />}
                                {field.type === 'switch' && <Switch checked={Boolean(routeWorkbenchPluginDraft[field.key])} onChange={(value) => updatePluginDraft(field.key, value)} />}
                                {field.type === 'checkbox' && <Checkbox.Group value={Array.isArray(routeWorkbenchPluginDraft[field.key]) ? routeWorkbenchPluginDraft[field.key] as string[] : []} options={field.options} onChange={(value) => updatePluginDraft(field.key, value as string[])} />}
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </Modal>
                </>
              );
            }
  if (selectedData.kind === 'domainNode') {
    const clusterName = selectedData.title.trim().toLowerCase();
    const resourceCount = (kind: RouteWorkbenchKind) => routeWorkbenchNodes.filter((node) => {
      const nodeData = node.data as RouteWorkbenchNodeData;
      return nodeData.kind === kind && (nodeData.cluster || '').trim().toLowerCase() === clusterName;
    }).length;

    return (
      <div className="ataas-domain-detail-form">
        <label><span>集群名称</span><Input value={selectedData.title} readOnly /></label>
        <label><span>集群状态</span><Input value={selectedData.meta || '运行中'} readOnly /></label>
        <label><span>服务网格入口</span><Input value={`${resourceCount('ingressNode')} 个`} readOnly /></label>
        <label><span>服务网格出口</span><Input value={`${resourceCount('clusterNode')} 个`} readOnly /></label>
        <label><span>SVC 数量</span><Input value={`${resourceCount('serviceNode')} 个`} readOnly /></label>
        <label><span>推理组数量</span><Input value={`${resourceCount('routerPodNode')} 个`} readOnly /></label>
      </div>
    );
  }
            return (
              <>
                {selectedData.kind === 'ingressNode' && (
                  <>
                  <div className="ataas-ingress-route-panel-form" onChangeCapture={() => setRouteWorkbenchIngressDirty(true)}>
                    {selectedData.isDraft && (
                      <label><span>所属集群 <em>*</em></span><Select value={selectedData.cluster || 'st1'} options={[
                        { value: 'st1', label: 'st1' },
                        { value: 'bx', label: 'bx' },
                      ]} onChange={(cluster) => {
                        setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === selectedNode.id ? {
                          ...node,
                          data: { ...(node.data as RouteWorkbenchNodeData), cluster, subtitle: `${cluster} · Ingress` },
                        } : node));
                        setRouteWorkbenchIngressDirty(true);
                      }} /></label>
                    )}
                    <label><span>路由名称 <em>*</em></span><Input value={selectedData.title} maxLength={63} showCount disabled={!selectedData.isDraft} onChange={(event) => {
                      const title = event.target.value;
                      setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === selectedNode.id ? {
                        ...node,
                        data: { ...(node.data as RouteWorkbenchNodeData), title, yaml: routeWorkbenchYaml('Ingress', title) },
                      } : node));
                      setRouteWorkbenchIngressDirty(true);
                    }} /></label>
                    <label><span>域名</span><Input value={ingressServiceHosts} readOnly /></label>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>匹配规则 <em>*</em></strong>
                      <label><span>路径（Path）</span></label>
                      <div className="ataas-ingress-route-panel-path-row">
                        <Select defaultValue="前缀匹配" options={['前缀匹配', '精确匹配', '正则匹配'].map((value) => ({ value, label: value }))} />
                        <Input defaultValue="/" />
                        <Checkbox>忽略大小写</Checkbox>
                      </div>
                      <label><span>方法（Method）</span><Select mode="multiple" defaultValue={['GET', 'POST']} options={['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'].map((value) => ({ value, label: value }))} /></label>
                    </div>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>请求头（Header）</strong>
                      <div className="ataas-ingress-route-panel-empty"><div><span>Key</span><span>条件</span><span>值</span><span>操作</span></div><p>暂无数据</p></div>
                      <Button type="link" icon={<PlusOutlined />}>参数</Button>
                    </div>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>请求参数（Query）</strong>
                      <div className="ataas-ingress-route-panel-empty"><div><span>Key</span><span>条件</span><span>值</span><span>操作</span></div><p>暂无数据</p></div>
                      <Button type="link" icon={<PlusOutlined />}>参数</Button>
                    </div>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>请求认证</strong>
                      <Switch defaultChecked />
                      <p>启用后，只有包含指定消费者认证信息的请求可以请求本路由。</p>
                      <label><span>认证方式</span><Select defaultValue="Key Auth" options={[{ value: 'Key Auth', label: 'Key Auth' }]} disabled /></label>
                      <small>目前仅支持 Key Auth 认证</small>
                      <label><span>允许请求本路由的消费者名称列表</span><Select mode="tags" placeholder="允许请求本路由的消费者名称列表" /></label>
                      <Button type="link">创建消费者</Button>
                    </div>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>附加注解（Annotation）</strong>
                      <div className="ataas-ingress-route-panel-empty annotation"><div><span>Key</span><span>值</span><span>操作</span></div><p>暂无数据</p></div>
                      <Button type="link" icon={<PlusOutlined />}>注解</Button>
                    </div>
                    <div className="ataas-ingress-route-panel-section">
                      <strong>目标服务（SE） <em>*</em></strong>
                      <Select value={linkedServiceEntryId} placeholder="请选择目标 SE" options={serviceEntryOptions} onChange={(serviceEntryId) => {
                        const serviceEntry = routeWorkbenchNodes.find((node) => node.id === serviceEntryId);
                        const serviceEntryData = serviceEntry?.data as RouteWorkbenchNodeData | undefined;
                        const hosts = serviceEntryData?.hosts || `${serviceEntryData?.title || ''}.internal.dns`;
                        setRouteWorkbenchEdges((edges) => [
                          ...edges.filter((edge) => !(edge.source === selectedNode.id && (routeWorkbenchNodes.find((node) => node.id === edge.target)?.data as RouteWorkbenchNodeData | undefined)?.kind === 'clusterNode')),
                          { id: `e-${selectedNode.id}-${serviceEntryId}-${Date.now()}`, source: selectedNode.id, target: serviceEntryId, type: 'trafficEdge', markerEnd: routeWorkbenchMarkerEnd, data: { type: 'aligned', qps: selectedData.qps, weight: 100, flowKey: selectedNode.id } },
                        ]);
                        setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === selectedNode.id ? { ...node, data: { ...(node.data as RouteWorkbenchNodeData), domain: hosts } } : node));
                        setRouteWorkbenchIngressDirty(true);
                      }} />
                    </div>
                  </div>
                  {routeWorkbenchIngressDirty && !selectedData.isDraft && (
                    <div className="ataas-ingress-route-save-bar">
                      <span>内容已修改，尚未应用</span>
                      <Space size={8}>
                        <Button size="small" onClick={() => setRouteWorkbenchIngressDirty(false)}>撤销更改</Button>
                        <Button size="small" type="primary" onClick={() => {
                          setRouteWorkbenchChanges((changes) => [...changes, { type: '修改', desc: `已应用 Ingress 路由 ${selectedData.title} 的配置` }]);
                          if (selectedData.isDraft) {
                            setRouteWorkbenchNodes((nodes) => nodes.map((node) => node.id === selectedNode.id ? {
                              ...node,
                              data: { ...(node.data as RouteWorkbenchNodeData), isDraft: false },
                            } : node));
                          }
                          setRouteWorkbenchIngressDirty(false);
                          message.success(selectedData.isDraft ? 'Ingress 已创建' : '路由配置已应用');
                        }}>应用更改</Button>
                      </Space>
                    </div>
                  )}
                  </>
                )}
                {selectedData.kind === 'ingressGroupNode' && linkedServiceEntryId && (
                  <div className="ataas-ingress-route-panel-form">
                    <label><span>目标服务（SE Hosts）</span><Input value={ingressServiceHosts} readOnly /></label>
                  </div>
                )}
                {selectedData.kind !== 'ingressGroupNode' && selectedData.kind !== 'ingressNode' && selectedData.kind !== 'serviceNode' && (
                  <>
                    <label><span>显示名称</span><Input value={selectedData.title} readOnly /></label>
                    <label><span>资源类型</span><Input value={typeLabel} readOnly /></label>
                    <label><span>所属集群</span><Select value={selectedData.cluster || '全局'} options={['全局', 'st', 'bx', 'st1'].map((value) => ({ value, label: value }))} /></label>
                  </>
                )}
                {selectedData.kind === 'clusterNode' && (
                  <>
                    <label><span>Hosts</span><Input value="glm-5.1-cluster.local" readOnly /></label>
                    <label><span>LB 策略</span><Select defaultValue="ROUND_ROBIN" options={['ROUND_ROBIN', 'LEAST_CONN', 'RANDOM', 'consistentHash'].map((value) => ({ value, label: value }))} onChange={(value) => pushWorkbenchChange('修改', `${selectedData.title} LB 策略改为 ${value}`)} /></label>
                    <label><span>Endpoint</span><Input value={`${selectedData.endpoints || 0} 个下游服务`} readOnly /></label>
                    <div className="ataas-route-workbench-edit-card">
                      <div className="ataas-route-workbench-edit-title">
                        <strong>Endpoint 权重</strong>
                        <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => pushWorkbenchChange('新增', `${selectedData.title} 新增 endpoint`)}>新增</Button>
                      </div>
                      {[
                        ['glm51-router-1.default.svc.cluster.local', 33],
                        ['glm51-router-2.default.svc.cluster.local', 33],
                        ['glm51-router-3.default.svc.cluster.local', 34],
                      ].map(([address, weight]) => (
                        <div className="ataas-route-workbench-endpoint-row" key={String(address)}>
                          <Input value={String(address)} readOnly />
                          <InputNumber min={0} max={100} defaultValue={Number(weight)} controls={false} addonAfter="%" onChange={(value) => pushWorkbenchChange('修改', `${address} 权重改为 ${value}%`)} />
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => pushWorkbenchChange('删除', `${selectedData.title} 删除 endpoint ${address}`)} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {selectedData.kind === 'serviceNode' && (
                  <>
                    <label><span>名称</span><Input value={selectedData.title} readOnly /></label>
                    <label><span>集群</span><Input value={selectedData.cluster || 'ST1'} readOnly /></label>
                    <label><span>关联的服务网格出口</span><Input value={(() => {
                      const serviceEntryEdge = relatedEdges.find((edge) => {
                        const otherNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                        const otherNode = routeWorkbenchNodes.find((node) => node.id === otherNodeId);
                        return (otherNode?.data as RouteWorkbenchNodeData | undefined)?.kind === 'clusterNode';
                      });
                      const serviceEntryNodeId = serviceEntryEdge
                        ? (serviceEntryEdge.source === selectedNode.id ? serviceEntryEdge.target : serviceEntryEdge.source)
                        : '';
                      return (routeWorkbenchNodes.find((node) => node.id === serviceEntryNodeId)?.data as RouteWorkbenchNodeData | undefined)?.title || '未关联';
                    })()} readOnly /></label>
                    <label><span>命名空间</span><Input value={selectedData.namespace || 'default'} readOnly /></label>
                    <label><span>Cluster IP</span><Input value={selectedData.subtitle?.match(/(?:ClusterIP\s*·\s*)?([\d.]+)/)?.[1] || '10.43.12.8'} readOnly /></label>
                    <label><span>类型</span><Input value="ClusterIP" readOnly /></label>
                    <label><span>Ports</span><Input value="http : 8000 → 8000 / TCP" readOnly /></label>
                    <label><span>Endpoints</span><Input value={`${selectedData.pods || 1} 个`} readOnly /></label>
                    <label><span>运行时间</span><Input value="12 天" readOnly /></label>
                  </>
                )}
                {(selectedData.kind === 'routerPodNode' || selectedData.kind === 'pdWorkerNode') && (
                  <>
                    <label><span>镜像</span><Input value="sglang:v0.5.10_layer_split" readOnly /></label>
                    <label><span>命名空间</span><Input value={selectedData.namespace || 'default'} readOnly /></label>
                    <label><span>副本健康</span><Input value={selectedData.health === 'warning' ? '3/4 Running' : '1/1 Running'} readOnly /></label>
                  </>
                )}
                {selectedData.kind === 'routerPodNode' && (
                  <div className="ataas-route-workbench-edit-card">
                    <div className="ataas-route-workbench-edit-title">
                      <strong>Router 操作</strong>
                      <Space size={6}>
                        <Button size="small" onClick={() => pushWorkbenchChange('操作', `${selectedData.title} flush cache`)}>Flush cache</Button>
                        <Button size="small" onClick={() => message.info('server_info: workers=2, healthy=true')}>Server info</Button>
                      </Space>
                    </div>
                    <div className="ataas-route-workbench-worker-list">
                      {[
                        ['prefill', 'http://10.0.1.8:8000', 8],
                        ['decode', 'http://10.0.2.19:8000', 18],
                      ].map(([role, url, load]) => (
                        <div className="ataas-route-workbench-worker-row" key={String(url)}>
                          <Select defaultValue={String(role)} options={['prefill', 'decode', 'regular'].map((value) => ({ value, label: value }))} onChange={(value) => pushWorkbenchChange('修改', `${selectedData.title} worker 类型改为 ${value}`)} />
                          <Input defaultValue={String(url)} onBlur={(event) => pushWorkbenchChange('修改', `${selectedData.title} worker url 改为 ${event.target.value}`)} />
                          <span>{load}</span>
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => pushWorkbenchChange('删除', `${selectedData.title} 删除 worker ${url}`)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedData.kind === 'pdWorkerNode' && (
                  <div className="ataas-route-workbench-edit-card">
                    <div className="ataas-route-workbench-edit-title">
                      <strong>Worker 角色</strong>
                    </div>
                    <label><span>Worker 类型</span><Select defaultValue={selectedData.title.includes('prefill') ? 'prefill' : 'decode'} options={['prefill', 'decode', 'regular'].map((value) => ({ value, label: value }))} onChange={(value) => pushWorkbenchChange('修改', `${selectedData.title} 类型改为 ${value}`)} /></label>
                    <div className="ataas-route-workbench-binding-row">
                      <span>来源 Router</span>
                      <em>glm51-router-1-0 / glm51-router-2-0</em>
                    </div>
                    <div className="ataas-route-workbench-binding-row">
                      <span>Pair 关系</span>
                      <em>{'prefill -> decode · 6'}</em>
                    </div>
                  </div>
                )}
                {selectedData.kind === 'ingressGroupNode' && (
                  <>
                    <label><span>集群名称</span><Input value={selectedData.title} readOnly /></label>
                    <label><span>资源状态</span><Input value={`${selectedData.subtitle || '0 SE · 0 实例'}`} readOnly /></label>
                    <label><span>部署节点</span><Input value={`${selectedData.nodeCount || 0} 个节点`} readOnly addonAfter={onNavigateToNodeManagement && <LinkOutlined style={{ cursor: 'pointer' }} onClick={() => onNavigateToNodeManagement(selectedData.cluster || '')} />} /></label>
                  </>
                )}
                {selectedData.kind === 'modelNode' && (
                  <>
                    <label><span>模型名称</span><Input defaultValue={selectedData.title} onBlur={(event) => pushWorkbenchChange('修改', `模型名称改为 ${event.target.value}`)} /></label>
                    <label><span>集群</span><Input value={`${selectedData.subtitle || '模型服务'}`} readOnly /></label>
                    <label><span>实例数</span><Input value={`${selectedData.pods || 0} 个实例`} readOnly /></label>
                    <label><span>部署节点</span><Input value={`${selectedData.nodeCount || 0} 个节点`} readOnly /></label>
                  </>
                )}
                {selectedData.kind !== 'ingressGroupNode' && selectedData.kind !== 'ingressNode' && (
                  <div className="ataas-route-workbench-checks">
                    <div><span>链路健康</span><strong>{selectedData.health === 'warning' ? '需关注' : selectedData.health === 'error' ? '异常' : '正常'}</strong></div>
                    <div><span>配置来源</span><strong>资源文件 / 表单生成</strong></div>
                    <div><span>最近变更</span><strong>2026/07/02 21:47</strong></div>
                  </div>
                )}
              </>
            );
          };
          return (
            <aside
              className="ataas-route-workbench-panel nodrag nowheel nopan"
              onPointerDown={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onWheel={(event) => event.stopPropagation()}
              onDoubleClick={(event) => event.stopPropagation()}
            >
              <div className="ataas-route-workbench-panel-head">
                <span className={`ataas-rf-node-icon ${selectedData.kind}`}>{routeWorkbenchKindIcon[selectedData.kind]}</span>
                <div>
                  <strong>{selectedData.title}</strong>
                  <span>{typeLabel}</span>
                </div>
                <Button type="text" icon={<CloseCircleOutlined />} onClick={() => setRouteWorkbenchSelected('')} />
              </div>
              {selectedData.kind !== 'domainNode' && !selectedData.isDraft && (
                <div className="ataas-route-workbench-panel-tabs">
                  <button className={routeWorkbenchPanelTab === 'detail' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('detail')}>资源详情</button>
                  <button className={routeWorkbenchPanelTab === 'relation' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('relation')}>关联关系</button>
                  {selectedData.kind !== 'ingressGroupNode' && (
                    <button className={routeWorkbenchPanelTab === 'yaml' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('yaml')}>YAML</button>
                  )}
                  {selectedData.kind === 'ingressNode' && (
                    <button className={routeWorkbenchPanelTab === 'plugins' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('plugins')}>路由插件</button>
                  )}
                </div>
              )}
              <div className="ataas-route-workbench-form">
                {renderPanelBody()}
              </div>
              {selectedData.isDraft && (
                <div className="ataas-route-workbench-create-card-foot">
                  <Button onClick={() => cancelWorkbenchDraft(selectedNode.id)}>取消</Button>
                  <Button type="primary" onClick={() => confirmWorkbenchDraft(selectedNode.id)}>创建</Button>
                </div>
              )}
              {selectedData.kind !== 'ingressNode' && selectedData.kind !== 'domainNode' && !selectedData.isDraft && (
                <div className="ataas-route-workbench-next">
                  <span>关联资源</span>
                  <button onClick={() => message.info('编辑模式下从节点右侧连接点拖到下游节点即可关联')}><PlusOutlined /> 关联下游资源</button>
                </div>
              )}
            </aside>
          );
        };
        return (
          <div className="ataas-route-workbench-page">
            <header className="ataas-route-workbench-topbar">
              <div className="ataas-route-workbench-title">
                <strong>{title}</strong>
                <span>独立 Mock 数据 · 网关入口层级示意</span>
              </div>
              <div className="ataas-route-workbench-toolbar-actions">
                <div className="ataas-route-workbench-level-control">
                  <span>显示至：{routeWorkbenchLevelLabels[routeWorkbenchVisibleLevel]}</span>
                  <Button disabled={routeWorkbenchVisibleLevel <= 0} onClick={() => changeVisibleLevel(-1)}>收起一级</Button>
                  <Button type={routeWorkbenchVisibleLevel < 5 ? 'primary' : 'default'} disabled={routeWorkbenchVisibleLevel >= 5} onClick={() => changeVisibleLevel(1)}>
                    {routeWorkbenchVisibleLevel >= 5 ? '已到最下一级' : '展开下一级'}
                  </Button>
                </div>
        <div className="ataas-route-workbench-toolbar-field"><span className="ataas-route-workbench-toolbar-label">Ingress：</span><InputNumber
          value={Math.min(routeWorkbenchIngressLimit, Math.max(1, orderedIngressNodes.length))}
          min={1}
          max={Math.max(1, orderedIngressNodes.length)}
          onChange={changeIngressLimit}
          style={{ width: 64 }}
        /><span className="ataas-route-workbench-ingress-total">/ {orderedIngressNodes.length}</span></div>
                <Select
                  value={routeWorkbenchRpmSort}
                  options={[{ value: 'default', label: '默认排序' }, { value: 'desc', label: 'RPM 从高到低' }, { value: 'asc', label: 'RPM 从低到高' }]}
                  onChange={setRouteWorkbenchRpmSort}
                  style={{ width: 132 }}
                />
                <Input.Search
                  allowClear
                  placeholder="搜索 SE / Ingress"
                  value={routeWorkbenchResourceSearch}
                  onChange={(event) => setRouteWorkbenchResourceSearch(event.target.value)}
                  onSearch={searchResourcePath}
                  style={{ width: 220 }}
                />
                <Dropdown
                  trigger={['click']}
                  menu={{
                    items: [
                      {
                        key: 'toggle-pd-groups',
                        label: routeWorkbenchPdCollapsed ? '展开 PD 组' : '收起 PD 组',
                        onClick: () => {
                          setRouteWorkbenchPdCollapsed((collapsed) => {
                            const nextCollapsed = !collapsed;
                            if (nextCollapsed) setRouteWorkbenchExpandedPdGroupIds([]);
                            setRouteWorkbenchVisibleLevel(nextCollapsed ? 4 : 5);
                            return nextCollapsed;
                          });
                          window.requestAnimationFrame(() => routeWorkbenchReactFlowRef.current?.fitView({ padding: 0.2, duration: 280 }));
                        },
                      },
                      { key: 'restore-layout', label: '还原默认排版', onClick: resetWorkbenchDefaultLayout },
                    ],
                  }}
                >
                  <Button aria-label="更多操作" icon={<MoreOutlined />} />
                </Dropdown>
              </div>
            </header>
            <div className="ataas-route-workbench-shell">
              <aside className="ataas-route-workbench-palette" aria-label="添加资源卡片">
                {([
                  ['domainNode', '集群'],
                  ['ingressNode', '服务网格入口'],
                  ['clusterNode', '服务网格出口'],
                  ['serviceNode', 'SVC'],
                  ['routerPodNode', '推理组'],
                ] as Array<[RouteWorkbenchKind, string]>).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    draggable
                    onClick={() => type === 'routerPodNode'
                      ? setRouteWorkbenchGroupCreateOpen(true)
                      : type === 'serviceNode'
                        ? openWorkbenchCreate('svc')
                        : type === 'clusterNode'
                          ? openWorkbenchCreate('se')
                        : addWorkbenchNode(type)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData('application/rtwb-node', JSON.stringify({ type, group: type === 'routerPodNode' }));
                      event.dataTransfer.effectAllowed = 'move';
                    }}
                  >
                    <span className={`ataas-rf-node-icon ${type}`}>{routeWorkbenchKindIcon[type]}</span>
                    <span className="ataas-route-workbench-palette-label">{label}</span>
                  </button>
                ))}
              </aside>
              <main className="ataas-route-workbench-canvas">
                <ReactFlow
                  nodes={workbenchFlowNodes}
                  edges={workbenchFlowEdges}
                  nodeTypes={routeWorkbenchNodeTypes}
                  edgeTypes={routeWorkbenchEdgeTypes}
                  onNodesChange={onRouteWorkbenchNodesChange}
                  onEdgesChange={handleRouteWorkbenchEdgesChange}
                  onConnect={onWorkbenchConnect}
                  onEdgeClick={(_, edge) => {
                    setRouteWorkbenchSelectedEdgeId(edge.id);
                    setRouteWorkbenchSelected('');
                    setRouteWorkbenchContextMenu(null);
                  }}
                  onEdgeContextMenu={(event, edge) => {
                    event.preventDefault();
                    setRouteWorkbenchSelectedEdgeId(edge.id);
                    setRouteWorkbenchEdgeContextMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
                  }}
                  onNodeClick={(_, node) => {
                    setRouteWorkbenchSelected(node.id);
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu(null);
                    setRouteWorkbenchHighlightedNodeIds([]);
                    setRouteWorkbenchHighlightedEdgeIds([]);
                    setRouteWorkbenchHighlightedRelationKey('');
                  }}
                  onNodeContextMenu={(event, node) => {
                    event.preventDefault();
                    setRouteWorkbenchSelected(node.id);
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
                  }}
                  onNodeDragStop={(_, node) => {
                    // 拖拽完成后将落点锁定，避免自动布局在下一次渲染中覆盖它。
                    // “默认排版”会清除该临时锁定；新建独立分支的 manualPosition 仍会保留。
                    setRouteWorkbenchNodes((nodes) => nodes.map((item) => item.id === node.id
                      ? {
                          ...item,
                          position: node.position,
                          data: {
                            ...(item.data as RouteWorkbenchNodeData),
                            draggedPosition: true,
                          },
                        }
                      : item));
                  }}
                  onInit={(instance) => { routeWorkbenchReactFlowRef.current = instance; }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const rawNode = e.dataTransfer.getData('application/rtwb-node');
                    let droppedNode: { type: RouteWorkbenchKind; role?: 'prefill' | 'decode'; group?: boolean } | null = null;
                    try { droppedNode = JSON.parse(rawNode); } catch { droppedNode = rawNode ? { type: rawNode as RouteWorkbenchKind } : null; }
                    const position = routeWorkbenchReactFlowRef.current?.screenToFlowPosition({ x: e.clientX, y: e.clientY });
                    if (droppedNode?.type && position) {
                      if (droppedNode.group) {
                        setRouteWorkbenchGroupCreatePosition(position);
                        setRouteWorkbenchGroupCreateOpen(true);
                      } else if (droppedNode.type === 'serviceNode') {
                        openWorkbenchCreate('svc', undefined, position);
                      } else if (droppedNode.type === 'clusterNode') {
                        openWorkbenchCreate('se', undefined, position);
                      } else addWorkbenchNode(droppedNode.type, position, droppedNode.role);
                    }
                  }}
                  onPaneClick={() => {
                    setRouteWorkbenchSelected('');
                    setRouteWorkbenchSelectedEdgeId('');
                    setRouteWorkbenchEdgeContextMenu(null);
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu(null);
                    setRouteWorkbenchHighlightedNodeIds([]);
                    setRouteWorkbenchHighlightedEdgeIds([]);
                    setRouteWorkbenchHighlightedRelationKey('');
                  }}
                  defaultViewport={{ x: 24, y: 28, zoom: 0.82 }}
                  nodesDraggable
                  nodesConnectable
                  elementsSelectable
                  selectionOnDrag
                  selectionMode={SelectionMode.Partial}
                  selectionKeyCode="Shift"
                  multiSelectionKeyCode={['Meta', 'Control']}
                  deleteKeyCode={['Backspace', 'Delete']}
                  minZoom={0.25}
                  maxZoom={1.6}
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={18} size={1} color="#DDE4EE" />
                  <Controls showInteractive={false} />
                  <MiniMap pannable zoomable nodeStrokeWidth={2} className="ataas-route-workbench-rf-minimap" />
                </ReactFlow>
                {routeWorkbenchContextMenu && (
                  <div
                    className="ataas-route-workbench-context-menu"
                    style={{ left: routeWorkbenchContextMenu.x, top: routeWorkbenchContextMenu.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    {(() => {
                      const data = routeWorkbenchNodes.find((node) => node.id === routeWorkbenchContextMenu.nodeId)?.data as RouteWorkbenchNodeData | undefined;
                      return data?.kind === 'routerPodNode'
                        ? <button type="button" onClick={() => openScalePdNodes(routeWorkbenchContextMenu.nodeId)}><PlusOutlined /><span>扩容 PD 节点</span></button>
                        : <button type="button" onClick={() => openWorkbenchRename(routeWorkbenchContextMenu.nodeId)}><EditOutlined /><span>重命名</span></button>;
                    })()}
                    <button type="button" onClick={() => {
                      toggleWorkbenchNodeChildren(routeWorkbenchContextMenu.nodeId);
                      setRouteWorkbenchContextMenu(null);
                    }}>
                      <DownOutlined />
                      <span>{(() => {
                        const nodeId = routeWorkbenchContextMenu.nodeId;
                        const data = routeWorkbenchNodes.find((node) => node.id === nodeId)?.data as RouteWorkbenchNodeData | undefined;
                        const collapsed = routeWorkbenchCollapsedNodeIds.includes(nodeId)
                          || (routeWorkbenchPdCollapsed && data?.kind === 'routerPodNode' && !routeWorkbenchExpandedPdGroupIds.includes(nodeId));
                        return collapsed ? '展开下属分支' : '收缩下属分支';
                      })()}</span>
                    </button>
                    <button type="button" onClick={() => toggleHighlightDownstreamBranch(routeWorkbenchContextMenu.nodeId)}>
                      <LinkOutlined />
                      <span>{(() => {
                        const downstream = collectBranchEdges(routeWorkbenchContextMenu.nodeId, 'downstream');
                        const isHighlighted = [...downstream.nodeIds].length === routeWorkbenchHighlightedNodeIds.length
                          && [...downstream.nodeIds].every((id) => routeWorkbenchHighlightedNodeIds.includes(id))
                          && [...downstream.edgeIds].length === routeWorkbenchHighlightedEdgeIds.length
                          && [...downstream.edgeIds].every((id) => routeWorkbenchHighlightedEdgeIds.includes(id));
                        return isHighlighted ? '取消高亮下游' : '高亮下游';
                      })()}</span>
                    </button>
                    <button type="button" className="danger" onClick={() => requestDeleteWorkbenchNode(routeWorkbenchContextMenu.nodeId)}>
                      <DeleteOutlined />
                      <span>{(() => {
                        const data = routeWorkbenchNodes.find((node) => node.id === routeWorkbenchContextMenu.nodeId)?.data as RouteWorkbenchNodeData | undefined;
                        return data?.kind === 'routerPodNode' ? '整组下线' : '删除卡片';
                      })()}</span>
                    </button>
                  </div>
                )}
                {routeWorkbenchEdgeContextMenu && (
                  <div
                    className="ataas-route-workbench-context-menu"
                    style={{ left: routeWorkbenchEdgeContextMenu.x, top: routeWorkbenchEdgeContextMenu.y }}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <button type="button" className="danger" onClick={() => requestDeleteRouteWorkbenchEdge(routeWorkbenchEdgeContextMenu.edgeId)}>
                      <DeleteOutlined />
                      <span>{(() => {
                        const edge = routeWorkbenchEdges.find((item) => item.id === routeWorkbenchEdgeContextMenu.edgeId);
                        const sourceKind = (routeWorkbenchNodes.find((node) => node.id === edge?.source)?.data as RouteWorkbenchNodeData | undefined)?.kind;
                        const targetData = routeWorkbenchNodes.find((node) => node.id === edge?.target)?.data as RouteWorkbenchNodeData | undefined;
                        if (sourceKind === 'clusterNode' && targetData?.kind === 'serviceNode') return '摘流';
                        if (sourceKind === 'routerPodNode' && targetData?.kind === 'pdWorkerNode') return `下线 ${targetData.title || '下游'} 节点`;
                        return '删除连线';
                      })()}</span>
                    </button>
                  </div>
                )}
                {routeWorkbenchEditMode && routeWorkbenchChanges.length > 0 && (
                  <div className="ataas-route-workbench-changes">
                    <div>
                      <strong>{routeWorkbenchChanges.length} change</strong>
                      <span>待提交到资源文件</span>
                    </div>
                    <Space>
                      <Button onClick={() => setRouteWorkbenchChanges([])}>Discard</Button>
                      <Button type="primary" icon={<SaveOutlined />} onClick={() => setRouteWorkbenchPreviewOpen(true)}>Commit</Button>
                    </Space>
                  </div>
                )}
                {renderWorkbenchPanel()}
                {routeWorkbenchCreateKind === 'svc' && (
                  <aside className="ataas-route-workbench-panel ataas-route-workbench-create-card" aria-label="创建 SVC">
                    <div className="ataas-route-workbench-panel-head">
                      <span className="ataas-rf-node-icon serviceNode">{routeWorkbenchKindIcon.serviceNode}</span>
                      <div>
                        <strong>新建 SVC</strong>
                        <span>SVC</span>
                      </div>
                      <Button
                        type="text"
                        icon={<CloseCircleOutlined />}
                        onClick={cancelWorkbenchCreate}
                      />
                    </div>
                    <div className="ataas-route-workbench-form">
                      <div className="ataas-cm-create-form">
                          <div className="ataas-cm-create-field">
                            <label>SVC 名称（仅英文） <em>*</em></label>
                            <Input
                              placeholder="例如: glm51-router-01"
                              value={routeWorkbenchCreateDraft.name}
                              onChange={(event) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, name: event.target.value }))}
                            />
                          </div>
                          <div className="ataas-cm-create-field">
                            <label>集群 <em>*</em></label>
                            <Select
                              value={routeWorkbenchCreateDraft.cluster || undefined}
                              onChange={(value) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, cluster: value, serviceEntryId: '', podIds: [] }))}
                              placeholder="请选择集群"
                              style={{ width: '100%' }}
                              options={clusterOptions.map((item) => ({ value: item, label: item }))}
                            />
                          </div>
                          <div className="ataas-cm-create-field">
                            <label>资源文件</label>
                            <div className="ataas-cm-create-yaml-row">
                              {wbYamlSelectedPath ? (
                                <div className="ataas-cm-selected-yaml">
                                  <FileSearchOutlined />
                                  <span>{wbYamlSelectedPath}</span>
                                  <button
                                    type="button"
                                    className="ataas-cm-remove-yaml"
                                    onClick={() => {
                                      setWbYamlSelectedPath('');
                                      setWbYamlPreview('');
                                      setRouteWorkbenchCreateDraft((prev) => ({ ...prev, yaml: '' }));
                                    }}
                                  >
                                    移除
                                  </button>
                                </div>
                              ) : (
                                <span className="ataas-cm-select-yaml-hint">未选择</span>
                              )}
                              <Tooltip title="从资源文件树选择">
                                <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { loadWbYamlTree(); setWbYamlPickerOpen(true); }} />
                              </Tooltip>
                            </div>
                          </div>
                      </div>
                    </div>
                    <div className="ataas-route-workbench-create-card-foot">
                      <Button onClick={cancelWorkbenchCreate}>取消</Button>
                      <Button type="primary" onClick={submitWorkbenchCreate}>确定</Button>
                    </div>
                  </aside>
                )}
                {routeWorkbenchCreateKind === 'se' && (
                  <aside className="ataas-route-workbench-panel ataas-route-workbench-create-card" aria-label="创建服务网格出口">
                    <div className="ataas-route-workbench-panel-head">
                      <span className="ataas-rf-node-icon clusterNode">{routeWorkbenchKindIcon.clusterNode}</span>
                      <div>
                        <strong>新建服务网格出口</strong>
                        <span>服务网格出口</span>
                      </div>
                      <Button type="text" icon={<CloseCircleOutlined />} onClick={cancelWorkbenchCreate} />
                    </div>
                    <div className="ataas-route-workbench-form">
                      <div className="ataas-cm-create-form">
                        <div className="ataas-cm-create-field">
                          <label>显示名称 <em>*</em></label>
                          <Input
                            placeholder="例如: glm-5.1"
                            value={routeWorkbenchCreateDraft.name}
                            onChange={(event) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, name: event.target.value }))}
                          />
                        </div>
                        <div className="ataas-cm-create-field">
                          <label>集群 <em>*</em></label>
                          <Select
                            value={routeWorkbenchCreateDraft.cluster || undefined}
                            onChange={(value) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, cluster: value }))}
                            placeholder="请选择集群"
                            style={{ width: '100%' }}
                            options={clusterOptions.map((item) => ({ value: item, label: item }))}
                          />
                        </div>
                        <div className="ataas-cm-create-field">
                          <label>资源文件</label>
                          <div className="ataas-cm-create-yaml-row">
                            {wbYamlSelectedPath ? (
                              <div className="ataas-cm-selected-yaml">
                                <FileSearchOutlined />
                                <span>{wbYamlSelectedPath}</span>
                                <button type="button" className="ataas-cm-remove-yaml" onClick={() => {
                                  setWbYamlSelectedPath('');
                                  setWbYamlPreview('');
                                  setRouteWorkbenchCreateDraft((prev) => ({ ...prev, yaml: '' }));
                                }}>移除</button>
                              </div>
                            ) : <span className="ataas-cm-select-yaml-hint">未选择</span>}
                            <Tooltip title="从资源文件树选择">
                              <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { loadWbYamlTree(); setWbYamlPickerOpen(true); }} />
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ataas-route-workbench-create-card-foot">
                      <Button onClick={cancelWorkbenchCreate}>取消</Button>
                      <Button type="primary" onClick={submitWorkbenchCreate}>创建</Button>
                    </div>
                  </aside>
                )}
              </main>
            </div>
            <Modal
              className="ataas-config-yaml-picker-modal"
              title="从资源文件选择 YAML"
              open={wbYamlPickerOpen}
              onCancel={() => { setWbYamlPickerOpen(false); setWbYamlSelectedPath(''); }}
              width={920}
              footer={
                <div className="ataas-config-yaml-picker-footer">
                  <Button onClick={() => { setWbYamlPickerOpen(false); setWbYamlSelectedPath(''); }}>取消</Button>
                  <Button type="primary" disabled={!wbYamlSelectedPath || !wbYamlPreview.trim()} onClick={applyWbConfigYaml}>确认选择</Button>
                </div>
              }
            >
              <div className={'ataas-config-yaml-picker' + (wbYamlSelectedPath ? '' : '')}>
                <div className="ataas-config-yaml-picker-tree">
                  <div className="ataas-config-yaml-picker-title">文件</div>
                  <div className="ataas-config-yaml-picker-tree-body">
                    {wbYamlPickerLoading && !wbYamlTree ? (
                      <div className="ataas-config-yaml-picker-empty">加载中...</div>
                    ) : wbYamlTree ? (
                      <>
                        {(function renderTree(node: ConfigTreeNode, depth = 0): ReactNode {
                          const children = node.children || [];
                          return children.map((child) => {
                            if (child.is_dir) {
                              return (
                                <div key={child.path}>
                                  <div className="ataas-config-yaml-picker-dir" style={{ paddingLeft: 12 + depth * 14 }}>
                                    <DownOutlined />
                                    <span>{child.name}</span>
                                  </div>
                                  {renderTree(child, depth + 1)}
                                </div>
                              );
                            }
                            return (
                              <button
                                key={child.path}
                                type="button"
                                className={'ataas-config-yaml-picker-file' + (wbYamlSelectedPath === child.path ? ' selected' : '')}
                                style={{ paddingLeft: 24 + depth * 14 }}
                                onClick={() => selectWbYamlFile(child.path)}
                              >
                                <FileSearchOutlined />
                                <span>{child.name}</span>
                              </button>
                            );
                          });
                        })(wbYamlTree, 0)}
                      </>
                    ) : (
                      <div className="ataas-config-yaml-picker-empty">暂无配置文件</div>
                    )}
                  </div>
                </div>
                <div className="ataas-config-yaml-picker-preview">
                  <div className="ataas-config-yaml-picker-title">{wbYamlSelectedPath ? wbYamlSelectedPath : '文件预览'}</div>
                  {wbYamlSelectedPath ? (
                    <pre className="ataas-cm-yaml-preview" style={{ margin: 0, padding: 12, fontSize: 12, lineHeight: 1.6, overflow: 'auto', height: '100%' }}>{wbYamlPreview}</pre>
                  ) : (
                    <div className="ataas-config-yaml-picker-empty" style={{ height: '100%' }}>请在左侧文件树中选择一个文件</div>
                  )}
                </div>
              </div>
            </Modal>
            <Modal
              open={routeWorkbenchPreviewOpen}
              width={980}
              title="YAML Preview"
              onCancel={() => setRouteWorkbenchPreviewOpen(false)}
              footer={[
                <Button key="back" onClick={() => setRouteWorkbenchPreviewOpen(false)}>返回编辑</Button>,
                <Button key="apply" type="primary" onClick={() => {
                  message.success(`已应用 ${Math.max(routeWorkbenchChanges.length, 1)} 个对象`);
                  setRouteWorkbenchPreviewOpen(false);
                  setRouteWorkbenchChanges([]);
                  setRouteWorkbenchEditMode(false);
                }}>确认应用</Button>,
              ]}
            >
              <div className="ataas-route-workbench-preview">
                {(selectedData?.yaml || routeWorkbenchYaml('ServiceEntry', 'glm51-service-entry')).split('\n').map((line, index) => (
                  <div key={index}><span>{index + 1}</span><code>{line || ' '}</code></div>
                ))}
              </div>
            </Modal>
            <Drawer
              className="ataas-domain-create-drawer"
              open={domainCreateOpen}
              title="创建集群"
              placement="right"
              width={520}
              zIndex={1200}
      onClose={() => { setDomainCreateOpen(false); setDomainCreateName(''); }}
      extra={<Space><Button onClick={() => { setDomainCreateOpen(false); setDomainCreateName(''); }}>取消</Button><Button type="primary" disabled={!domainCreateName.trim()} onClick={createDomainCard}>创建</Button></Space>}
            >
      <div className="ataas-domain-create-form">
        <label><span>集群名称 <em>*</em></span><Input value={domainCreateName} maxLength={63} showCount placeholder="请输入集群名称" onChange={(event) => setDomainCreateName(event.target.value)} /></label>
      </div>
            </Drawer>
            <Modal
              title="创建 Group"
              open={routeWorkbenchGroupCreateOpen}
              okText="创建"
              cancelText="取消"
              onCancel={() => { setRouteWorkbenchGroupCreateOpen(false); setRouteWorkbenchGroupCreatePosition(undefined); }}
              onOk={() => {
                addWorkbenchGroup(routeWorkbenchGroupCreatePosition, routeWorkbenchGroupPrefillCount, routeWorkbenchGroupDecodeCount);
                setRouteWorkbenchGroupCreateOpen(false);
                setRouteWorkbenchGroupCreatePosition(undefined);
              }}
            >
              <div className="ataas-domain-create-form">
                <label><span>Prefill 数量 <em>*</em></span><InputNumber min={0} max={20} value={routeWorkbenchGroupPrefillCount} onChange={(value) => setRouteWorkbenchGroupPrefillCount(Number(value || 0))} /></label>
                <label><span>Decode 数量 <em>*</em></span><InputNumber min={0} max={20} value={routeWorkbenchGroupDecodeCount} onChange={(value) => setRouteWorkbenchGroupDecodeCount(Number(value || 0))} /></label>
              </div>
            </Modal>
            <Modal
              open={!!routeWorkbenchScalePdRouterId}
              title="扩容 PD 节点"
              okText="确认扩容"
              cancelText="取消"
              onOk={scalePdNodes}
              onCancel={() => setRouteWorkbenchScalePdRouterId('')}
            >
              <div className="ataas-domain-create-form">
                <label><span>新增 Prefill 数量</span><InputNumber min={0} max={20} value={routeWorkbenchScalePrefillCount} onChange={(value) => setRouteWorkbenchScalePrefillCount(Number(value || 0))} /></label>
                <label><span>新增 Decode 数量</span><InputNumber min={0} max={20} value={routeWorkbenchScaleDecodeCount} onChange={(value) => setRouteWorkbenchScaleDecodeCount(Number(value || 0))} /></label>
              </div>
            </Modal>
            <Modal
              open={!!routeWorkbenchRenameNodeId}
              title="重命名卡片"
              width={420}
              okText="确定"
              cancelText="取消"
              onOk={saveWorkbenchRename}
              onCancel={() => {
                setRouteWorkbenchRenameNodeId('');
                setRouteWorkbenchRenameValue('');
              }}
              okButtonProps={{ disabled: !routeWorkbenchRenameValue.trim() }}
            >
              <Input
                value={routeWorkbenchRenameValue}
                onChange={(event) => setRouteWorkbenchRenameValue(event.target.value)}
                onPressEnter={saveWorkbenchRename}
                placeholder="请输入卡片名称"
                autoFocus
              />
            </Modal>
          </div>
        );
};

export default RouteWorkbenchPage;
