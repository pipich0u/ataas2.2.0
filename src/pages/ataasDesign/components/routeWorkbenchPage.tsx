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
  PlusOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Input, InputNumber, message, Modal, Select, Space, Tooltip } from 'antd';
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
  getSmoothStepPath,
  type Connection,
  type Edge,
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

type RouteWorkbenchKind = 'modelNode' | 'domainNode' | 'ingressGroupNode' | 'clusterNode' | 'serviceNode' | 'routerPodNode' | 'pdWorkerNode';

type RouteWorkbenchNodeData = {
  kind: RouteWorkbenchKind;
  title: string;
  subtitle?: string;
  meta?: string;
  role?: string;
  roleCount?: number;
  cluster?: string;
  namespace?: string;
  qps?: number;
  errRate?: number;
  load?: number;
  weight?: number;
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
  onQuickAdd?: (nodeId: string, kind: RouteWorkbenchKind) => void;
};

type RouteWorkbenchEdgeData = {
  type: 'gateway' | 'endpoint' | 'service' | 'worker' | 'pair' | 'structure';
  qps?: number;
  active?: number;
  weight?: number;
  load?: number;
  healthy?: boolean;
  pending?: boolean;
  label?: string;
  parallelIndex?: number;
  parallelTotal?: number;
};

const routeWorkbenchKindLabel: Record<RouteWorkbenchKind, string> = {
  modelNode: 'Model',
  domainNode: 'Domain',
  ingressGroupNode: 'Cluster',
  clusterNode: 'SE',
  serviceNode: 'SVC',
  routerPodNode: 'Router',
  pdWorkerNode: 'Worker',
};

const routeWorkbenchKindIcon: Record<RouteWorkbenchKind, ReactNode> = {
  modelNode: <DatabaseOutlined />,
  domainNode: <DatabaseOutlined />,
  ingressGroupNode: <CloudServerOutlined />,
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
  const canQuickAdd = d.kind === 'ingressGroupNode' || d.kind === 'clusterNode';
  const quickAddTitle = d.kind === 'ingressGroupNode' ? '新增 SE' : '新增 SVC';
  return (
    <div className={`ataas-rf-node ${d.kind} ${health} ${selected ? 'selected' : ''}`}>
      {canTarget && <Handle type="target" position={Position.Left} className="ataas-rf-handle" />}
      <div className={`ataas-rf-node-icon ${d.kind} role-${String(d.role || '').toLowerCase()}`}>{getRouteWorkbenchNodeIcon(d)}</div>
      <div className="ataas-rf-node-body">
        <div className="ataas-rf-node-title">
          <span>{d.title}</span>
          <strong className={`ataas-rf-node-kind ${d.kind}`}>{routeWorkbenchKindLabel[d.kind]}</strong>
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
      {canQuickAdd && (
        <button
          type="button"
          className="ataas-rf-node-add"
          title={quickAddTitle}
          onClick={(event) => {
            event.stopPropagation();
            d.onQuickAdd?.(id, d.kind);
          }}
        >
          <PlusOutlined />
        </button>
      )}
      {canSource && <Handle type="source" position={Position.Right} className="ataas-rf-handle" />}
      {isPrefillWorker && <Handle type="source" id="pair-source" position={Position.Right} className="ataas-rf-handle ataas-rf-pair-handle" style={{ top: '72%' }} />}
      {isDecodeWorker && <Handle type="target" id="pair-target" position={Position.Right} className="ataas-rf-handle ataas-rf-pair-handle" style={{ top: '72%' }} />}
    </div>
  );
};

const RouteWorkbenchEdge = (props: EdgeProps) => {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd } = props;
  const d = (data || {}) as RouteWorkbenchEdgeData;
  const heat = d.qps ? Math.min(d.qps / 100, 1) : d.active ? Math.min(d.active / 50, 1) : d.load ? Math.min(d.load / 50, 1) : 0;
  const isPair = d.type === 'pair';
  const isGateway = d.type === 'gateway';
  const [smoothPath, smoothLabelX, smoothLabelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 18 });
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
  const gatewayIndex = d.parallelIndex || 0;
  const gatewayTotal = d.parallelTotal || 1;
  const gatewayTrunkX = sourceX + 36;
  const gatewayTargetY = targetY;
  const gatewayPath = [
    `M ${sourceX} ${sourceY}`,
    `L ${gatewayTrunkX} ${sourceY}`,
    `L ${gatewayTrunkX} ${gatewayTargetY}`,
    `L ${targetX} ${gatewayTargetY}`,
  ].join(' ');
  const path = isPair ? pairPath : isGateway ? gatewayPath : smoothPath;
  const labelX = isPair ? pairTrunkX : isGateway ? gatewayTrunkX : smoothLabelX;
  const labelY = isPair ? (sourceY + pairTargetY) / 2 : isGateway ? (sourceY + gatewayTargetY) / 2 : smoothLabelY;
  const pairHeat = d.load ? Math.min(d.load / 140, 1) : 0;
  const stroke = isPair ? getRouteWorkbenchPairColor(pairHeat) : d.healthy === false ? '#D92D20' : d.pending ? '#F59E0B' : d.type === 'worker' ? '#8EA4C0' : getRouteWorkbenchHeatColor(heat);
  const width = d.type === 'structure' ? 1.6 : 2;
  const label = d.label || (d.weight ? `w:${d.weight}` : d.qps ? `${d.qps} qps` : d.active ? String(d.active) : d.load ? String(d.load) : '');
  const labelWidth = Math.max(isPair ? 28 : 30, Math.min(58, String(label).length * 7 + 14));
  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={{ stroke, strokeWidth: width, opacity: d.type === 'structure' ? 0.55 : 0.82 }} />
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
    position: { x: 80, y: 210 },
    data: { kind: 'modelNode', title: 'GLM-5.1', subtitle: '模型服务 · 2 个集群', qps: 86, pods: 34, nodeCount: 14, logo: glmLogo, health: 'healthy', yaml: routeWorkbenchYaml('ModelService', 'glm51'), history: routeWorkbenchHistory },
  },
  {
    id: 'cluster-st',
    type: 'ingressGroupNode',
    position: { x: 430, y: 210 },
    data: { kind: 'ingressGroupNode', title: 'st 集群', subtitle: '2 SE · 33 实例', cluster: 'st', qps: 84, pods: 33, nodeCount: 12, health: 'healthy', yaml: routeWorkbenchYaml('Gateway', 'st-ingress'), history: routeWorkbenchHistory },
  },
  {
    id: 'se-glm51',
    type: 'clusterNode',
    position: { x: 760, y: 210 },
    data: { kind: 'clusterNode', title: 'glm51-service-entry', subtitle: 'ServiceEntry · ROUND_ROBIN', cluster: 'st', endpoints: 3, qps: 82, weight: 100, health: 'warning', yaml: routeWorkbenchYaml('ServiceEntry', 'glm51-service-entry'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-1',
    type: 'serviceNode',
    position: { x: 1100, y: 90 },
    data: { kind: 'serviceNode', title: 'glm51-router-1', subtitle: 'ClusterIP · 10.43.21.18', cluster: 'st', pods: 1, weight: 33, health: 'healthy', yaml: routeWorkbenchYaml('Service', 'glm51-router-1'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-2',
    type: 'serviceNode',
    position: { x: 1100, y: 230 },
    data: { kind: 'serviceNode', title: 'glm51-router-2', subtitle: 'ClusterIP · 10.43.21.19', cluster: 'st', pods: 1, weight: 33, health: 'warning', yaml: routeWorkbenchYaml('Service', 'glm51-router-2'), history: routeWorkbenchHistory },
  },
  {
    id: 'svc-router-3',
    type: 'serviceNode',
    position: { x: 1100, y: 370 },
    data: { kind: 'serviceNode', title: 'glm51-router-3', subtitle: 'ClusterIP · 10.43.21.20', cluster: 'st', pods: 1, weight: 34, health: 'healthy', yaml: routeWorkbenchYaml('Service', 'glm51-router-3'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-1',
    type: 'routerPodNode',
    position: { x: 1450, y: 90 },
    data: { kind: 'routerPodNode', title: 'glm51-router-1-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 31, health: 'healthy', yaml: routeWorkbenchYaml('Pod', 'glm51-router-1-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-2',
    type: 'routerPodNode',
    position: { x: 1450, y: 230 },
    data: { kind: 'routerPodNode', title: 'glm51-router-2-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 25, health: 'warning', yaml: routeWorkbenchYaml('Pod', 'glm51-router-2-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'rp-router-3',
    type: 'routerPodNode',
    position: { x: 1450, y: 370 },
    data: { kind: 'routerPodNode', title: 'glm51-router-3-0', subtitle: 'Router Pod · Running', cluster: 'st', namespace: 'default', qps: 28, health: 'healthy', yaml: routeWorkbenchYaml('Pod', 'glm51-router-3-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'w-prefill-1',
    type: 'pdWorkerNode',
    position: { x: 1790, y: 126 },
    data: { kind: 'pdWorkerNode', title: 'glm51-prefill-0', subtitle: 'Prefill · 3/4 Running', role: 'prefill', cluster: 'st', namespace: 'default', load: 8, health: 'warning', meta: 'P 1 · TTFT 31234', yaml: routeWorkbenchYaml('Pod', 'glm51-prefill-0'), history: routeWorkbenchHistory },
  },
  {
    id: 'w-decode-1',
    type: 'pdWorkerNode',
    position: { x: 1790, y: 310 },
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

const routeWorkbenchLayerX: Record<RouteWorkbenchKind, number> = {
  modelNode: 80,
  domainNode: 360,
  ingressGroupNode: 430,
  clusterNode: 760,
  serviceNode: 1100,
  routerPodNode: 1450,
  pdWorkerNode: 1790,
};

const getRouteWorkbenchNodeKind = (node: Node): RouteWorkbenchKind => {
  const data = node.data as RouteWorkbenchNodeData | undefined;
  return data?.kind || (node.type as RouteWorkbenchKind) || 'serviceNode';
};

const getRouteWorkbenchNewNodePosition = (kind: RouteWorkbenchKind, nodes: Node[]) => {
  const sameLayerCount = nodes.filter((node) => getRouteWorkbenchNodeKind(node) === kind).length;
  return {
    x: routeWorkbenchLayerX[kind],
    y: Math.max(80, 90 + sameLayerCount * 140),
  };
};

const getRouteWorkbenchFreePosition = (kind: RouteWorkbenchKind, nodes: Node[], preferredY?: number) => {
  const layerNodes = nodes.filter((node) => getRouteWorkbenchNodeKind(node) === kind);
  const occupied = layerNodes.map((node) => node.position.y).sort((a, b) => a - b);
  let y = Math.max(80, preferredY ?? 90);
  const gap = 140;
  while (occupied.some((item) => Math.abs(item - y) < 112)) {
    y += gap;
  }
  return {
    x: routeWorkbenchLayerX[kind],
    y,
  };
};

const getRouteWorkbenchLayerOrder = (kind: RouteWorkbenchKind) => {
  return (Object.keys(routeWorkbenchLayerX) as RouteWorkbenchKind[]).indexOf(kind);
};

const layoutRouteWorkbenchNodes = (nodes: Node[]) => {
  const grouped = new Map<RouteWorkbenchKind, Node[]>();
  nodes.forEach((node) => {
    const kind = getRouteWorkbenchNodeKind(node);
    grouped.set(kind, [...(grouped.get(kind) || []), node]);
  });
  const next: Node[] = [];
  (Object.keys(routeWorkbenchLayerX) as RouteWorkbenchKind[]).forEach((kind) => {
    const layerNodes = grouped.get(kind) || [];
    const startY = Math.max(80, 230 - ((layerNodes.length - 1) * 70));
    layerNodes.forEach((node, index) => {
      next.push({
        ...node,
        position: {
          x: routeWorkbenchLayerX[kind],
          y: Math.max(80, startY + index * 140),
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
  const modelNodes = new Map<string, { id: string; y: number; routeCount: number; clusterCount: number; podCount: number; nodeCount: number; health: RouteWorkbenchNodeData['health'] }>();
  const clusterIngress = new Map<string, { ingressId: string; y: number }>();
  const orderedRoutes = [...routes].sort((a, b) => {
    const aModel = getRouteModelName(a.name);
    const bModel = getRouteModelName(b.name);
    const aKnown = ['glm-5.1','deepseek-r1','kimi-k2'].includes(aModel);
    const bKnown = ['glm-5.1','deepseek-r1','kimi-k2'].includes(bModel);
    if (aKnown !== bKnown) return aKnown ? -1 : 1;
    const modelCompare = aModel.localeCompare(bModel);
    if (modelCompare !== 0) return modelCompare;
    const clusterCompare = (a.cluster || 'default').localeCompare(b.cluster || 'default');
    if (clusterCompare !== 0) return clusterCompare;
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

  const manualSeStateAtIngress = new Map<string, { cumulativeOffset: number; prevContentHeight: number }>();
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
    if (isKnownModel && !modelNodes.has(modelName)) {
      const rawStats = modelStats.get(modelName) || { routeCount: 1, clusterSet: new Set([route.cluster || 'default']), podCount: routePods.length, nodeSet: new Set(routePods.map((pod) => pod.node).filter(Boolean)), health: routeHealth };
      const stats = { ...rawStats, clusterCount: rawStats.clusterSet.size, nodeCount: rawStats.nodeSet.size };
      modelNodes.set(modelName, { id: modelId, y: baseY, routeCount: stats.routeCount, clusterCount: stats.clusterCount, podCount: stats.podCount, nodeCount: stats.nodeCount, health: stats.health });
      nodes.push({
        id: modelId,
        type: 'modelNode',
        position: { x: routeWorkbenchLayerX.modelNode, y: baseY },
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
            position: { x: routeWorkbenchLayerX.ingressGroupNode, y: baseY },
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
          position: { x: routeWorkbenchLayerX.ingressGroupNode, y: baseY },
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
    // 非已知模型的 SE（手动）：内容向上生长，间距根据内容动态调整
    if (!isKnownModel && ingress) {
      const ingressNode = nodes.find((n) => n.id === ingress.ingressId);
      if (ingressNode) {
        const ingressY = ingressNode.position.y;
        const state = manualSeStateAtIngress.get(ingress.ingressId) || { cumulativeOffset: 0, prevContentHeight: 0 };
        let spacing: number;
        if (state.cumulativeOffset === 0) {
          spacing = 220; // 第一个手动 SE，与已知 SE 保持 220px 间距
        } else {
          spacing = Math.max(220, state.prevContentHeight + 60); // 根据上一个 SE 的内容高度动态调整
        }
        const newCumulativeOffset = state.cumulativeOffset + spacing;
        manualSeStateAtIngress.set(ingress.ingressId, { cumulativeOffset: newCumulativeOffset, prevContentHeight: 0 });
        seY = ingressY - newCumulativeOffset;
      }
    }
    const isExpanded = expandedRouteKeys.has(route.key);

    nodes.push(
      {
        id: seId,
        type: 'clusterNode',
        position: { x: routeWorkbenchLayerX.clusterNode, y: seY },
        data: {
          kind: 'clusterNode',
          title: route.name,
          subtitle: `${isExpanded ? '已展开' : '概览'} · ${route.services.length} SVC · ${routePods.length} POD`,
          cluster: route.cluster,
          namespace: route.namespace,
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
      if (!isExpanded) return;
      const serviceY = branchY;
      nodes.push({
        id: serviceId,
        type: 'serviceNode',
        position: { x: routeWorkbenchLayerX.serviceNode, y: serviceY },
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
        const podY = isKnownModel ? (serviceY + podIndex * rowHeight) : (serviceY - podIndex * rowHeight);
        nodes.push({
          id: podId,
          type: podKind,
          position: { x: routeWorkbenchLayerX[podKind], y: podY },
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
              position: { x: routeWorkbenchLayerX.pdWorkerNode, y: workerY },
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
      branchY += isKnownModel
        ? Math.max(1, displayPods.length) * rowHeight
        : -(Math.max(1, displayPods.length) * rowHeight);
    });

    routeStartY = Math.max(routeStartY + 220, branchY + 120);
    if (!isKnownModel && ingress) {
      const calculatedContentHeight = Math.max(0, seY - branchY);
      const currentState = manualSeStateAtIngress.get(ingress.ingressId) || { cumulativeOffset: 0, prevContentHeight: 0 };
      manualSeStateAtIngress.set(ingress.ingressId, { ...currentState, prevContentHeight: calculatedContentHeight });
    }
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

const RouteWorkbenchPage = ({ onNavigateToNodeManagement }: { onNavigateToNodeManagement?: (clusterKey: string) => void }) => {
  const resourceStore = useK8sResourceStore();
  const { routes: routeList, pods: podList } = useMemo(() => toRouteWorkbenchResources(resourceStore.state), [resourceStore.state]);
  const [routeWorkbenchExpandedRouteKeys, setRouteWorkbenchExpandedRouteKeys] = useState<string[]>(() => routeList.map((route) => route.key));
  const initialRouteWorkbenchGraph = useMemo(() => buildRouteWorkbenchFromResources(routeList, podList, new Set(routeWorkbenchExpandedRouteKeys)), [routeList, podList, routeWorkbenchExpandedRouteKeys]);
  const [routeWorkbenchSelected, setRouteWorkbenchSelected] = useState('');
  const [routeWorkbenchPanelTab, setRouteWorkbenchPanelTab] = useState<'detail' | 'relation' | 'yaml' | 'history'>('detail');
  const [routeWorkbenchNodes, setRouteWorkbenchNodes, onRouteWorkbenchNodesChange] = useNodesState(initialRouteWorkbenchGraph.nodes);
  const [routeWorkbenchEdges, setRouteWorkbenchEdges, onRouteWorkbenchEdgesChange] = useEdgesState(initialRouteWorkbenchGraph.edges);
  const routeWorkbenchReactFlowRef = useRef<any>(null);
  const routeWorkbenchStateRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: initialRouteWorkbenchGraph.nodes, edges: initialRouteWorkbenchGraph.edges });
  const routeWorkbenchUndoRef = useRef<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const routeWorkbenchFocusNodeIdRef = useRef<string>('');
  const [routeWorkbenchContextMenu, setRouteWorkbenchContextMenu] = useState<{ nodeId: string; x: number; y: number } | null>(null);
  const [routeWorkbenchRenameNodeId, setRouteWorkbenchRenameNodeId] = useState('');
  const [routeWorkbenchRenameValue, setRouteWorkbenchRenameValue] = useState('');
  const [routeWorkbenchEditMode, setRouteWorkbenchEditMode] = useState(false);
  const [routeWorkbenchChanges, setRouteWorkbenchChanges] = useState<Array<{ type: string; desc: string }>>([]);
  const [routeWorkbenchPreviewOpen, setRouteWorkbenchPreviewOpen] = useState(false);
  const [routeWorkbenchModelFilter, setRouteWorkbenchModelFilter] = useState<string>('all');
  const [routeWorkbenchServiceFilter, setRouteWorkbenchServiceFilter] = useState('');
  const [routeWorkbenchCreateKind, setRouteWorkbenchCreateKind] = useState<'se' | 'svc' | ''>('');
  const [routeWorkbenchCreateDraft, setRouteWorkbenchCreateDraft] = useState({
    name: '',
    cluster: 'beijing-prod',
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
  useEffect(() => {
    if (routeWorkbenchEditMode) return;
    const nextGraph = buildRouteWorkbenchFromResources(routeList, podList, new Set(routeWorkbenchExpandedRouteKeys));
    setRouteWorkbenchNodes(nextGraph.nodes);
    setRouteWorkbenchEdges(nextGraph.edges);
  }, [podList, routeList, routeWorkbenchChanges.length, routeWorkbenchEditMode, routeWorkbenchExpandedRouteKeys, setRouteWorkbenchEdges, setRouteWorkbenchNodes]);
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
  useEffect(() => {
    routeWorkbenchStateRef.current = { nodes: routeWorkbenchNodes, edges: routeWorkbenchEdges };
  }, [routeWorkbenchEdges, routeWorkbenchNodes]);
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
    };
    window.addEventListener('keydown', handleRouteWorkbenchUndo);
    return () => window.removeEventListener('keydown', handleRouteWorkbenchUndo);
  }, [undoRouteWorkbench]);

  const selectedNode = routeWorkbenchNodes.find((node) => node.id === routeWorkbenchSelected) || null;
        const selectedData = selectedNode?.data as RouteWorkbenchNodeData | undefined;
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
        const visibleNodes = routeWorkbenchNodes.filter((node) => modelVisibleIds.has(node.id) && serviceVisibleIds.has(node.id));
        const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
        const visibleEdges = routeWorkbenchEdges.filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
        const clusterOptions = Array.from(new Set([
          ...resourceStore.state.serviceEntries.map((item) => item.cluster),
          ...resourceStore.state.services.map((item) => item.cluster),
          ...resourceStore.state.pods.map((item) => item.cluster),
        ])).filter(Boolean);
        const openWorkbenchCreate = (kind: 'se' | 'svc', preset?: Partial<typeof routeWorkbenchCreateDraft>) => {
          const nextCluster = preset?.cluster || clusterOptions[0] || 'beijing-prod';
          const nextSeId = preset?.serviceEntryId || resourceStore.state.serviceEntries.find((item) => item.cluster === nextCluster)?.id || '';
          const nextName = preset?.name || '';
          setRouteWorkbenchCreateKind(kind);
          setRouteWorkbenchCreateDraft({
            name: nextName,
            cluster: nextCluster,
            namespace: preset?.namespace || (kind === 'se' ? 'higress-system' : 'default'),
            serviceEntryId: kind === 'svc' ? nextSeId : '',
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
        const submitWorkbenchCreate = () => {
          const name = routeWorkbenchCreateDraft.name.trim();
          if (!routeWorkbenchCreateKind || !name) {
            message.warning('请输入资源名称');
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
            routeWorkbenchFocusNodeIdRef.current = `se-${entry.id}`;
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
            message.success(`SVC ${service.name} 已创建`);
          }
          setRouteWorkbenchCreateKind('');
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
          pushRouteWorkbenchUndo();
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
          const allKeys = routeList.map((r) => r.key);
          const initial = buildRouteWorkbenchFromResources(routeList, podList, new Set(allKeys));
          setRouteWorkbenchExpandedRouteKeys(allKeys);
          setRouteWorkbenchNodes(initial.nodes);
          setRouteWorkbenchEdges(initial.edges);
        };
        const addWorkbenchNode = (kind: RouteWorkbenchKind) => {
          if (kind === 'clusterNode') {
            openWorkbenchCreate('se');
            return;
          }
          if (kind === 'serviceNode') {
            openWorkbenchCreate('svc');
            return;
          }
          const label = routeWorkbenchKindLabel[kind];
          const id = `${kind}-${Date.now()}`;
          const title = `new-${label.toLowerCase()}`;
          pushRouteWorkbenchUndo();
          setRouteWorkbenchNodes((nodes) => [
            ...nodes,
            {
              id,
              type: kind,
              position: getRouteWorkbenchFreePosition(kind, nodes, getRouteWorkbenchNewNodePosition(kind, nodes).y),
              data: {
                kind,
                title,
                subtitle: '未关联资源',
                cluster: kind === 'domainNode' ? undefined : 'st',
                health: 'idle',
                yaml: routeWorkbenchYaml(label, title),
                history: [],
              },
            },
          ]);
          setRouteWorkbenchSelected(id);
          setRouteWorkbenchPanelTab('detail');
          setRouteWorkbenchChanges((changes) => [...changes, { type: '新增', desc: `新增 ${label} 节点` }]);
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
        const quickAddWorkbenchChild = (parentId: string, parentKind: RouteWorkbenchKind) => {
          const parent = routeWorkbenchNodes.find((node) => node.id === parentId);
          const parentData = parent?.data as RouteWorkbenchNodeData | undefined;
          if (!parent || !parentData) return;
          if (parentKind === 'ingressGroupNode') {
            openWorkbenchCreate('se', {
              cluster: parentData.cluster || 'beijing-prod',
              namespace: 'higress-system',
            });
            return;
          }
          if (parentKind === 'clusterNode') {
            openWorkbenchCreate('svc', {
              cluster: parentData.cluster || 'beijing-prod',
              namespace: 'default',
              serviceEntryId: parentData.sourceRouteKey || '',
            });
            return;
          }
        };
        const onWorkbenchConnect = (connection: Connection) => {
          if (!routeWorkbenchEditMode || !connection.source || !connection.target) {
            message.info('开启编辑模式后可以建立资源关联');
            return;
          }
          const source = routeWorkbenchNodes.find((node) => node.id === connection.source);
          const target = routeWorkbenchNodes.find((node) => node.id === connection.target);
          const sourceTitle = source ? (source.data as RouteWorkbenchNodeData).title : connection.source;
          const targetTitle = target ? (target.data as RouteWorkbenchNodeData).title : connection.target;
          const id = `e-${connection.source}-${connection.target}-${Date.now()}`;
          const nextEdge = {
              id,
              source: connection.source!,
              target: connection.target!,
              type: 'trafficEdge',
              markerEnd: routeWorkbenchMarkerEnd,
              data: { type: 'endpoint', pending: true, label: 'pending' },
          };
          pushRouteWorkbenchUndo();
          setRouteWorkbenchEdges((edges) => [...edges, nextEdge]);
          setRouteWorkbenchNodes((nodes) => layoutRouteWorkbenchNodes(nodes));
          setRouteWorkbenchChanges((changes) => [...changes, { type: '关联', desc: `${sourceTitle} -> ${targetTitle}` }]);
        };
        const workbenchFlowNodes = visibleNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            onQuickAdd: quickAddWorkbenchChild,
          },
        }));
        const renderWorkbenchPanel = () => {
          if (!selectedNode || !selectedData) return null;
          const typeLabel = routeWorkbenchKindLabel[selectedData.kind];
          const relatedEdges = routeWorkbenchEdges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id);
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
                    <button key={item.key} type="button">
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
              return (
                <div className="ataas-route-workbench-yaml-full">
                  {(selectedData.yaml || '').split('\n').map((line, index) => (
                    <div key={index}><span>{index + 1}</span><code>{line || ' '}</code></div>
                  ))}
                </div>
              );
            }
            if (routeWorkbenchPanelTab === 'history') {
              return (
                <div className="ataas-route-workbench-history ataas-route-workbench-history-full">
                  {(selectedData.history || []).length > 0 ? (selectedData.history || []).map((item) => (
                    <button key={item.hash}>
                      <span>{item.hash}</span>
                      <em>{item.time}</em>
                      <strong>{item.author} · {item.message}</strong>
                    </button>
                  )) : (
                    <div className="ataas-route-workbench-empty">暂无历史记录</div>
                  )}
                </div>
              );
            }
            return (
              <>
                {selectedData.kind !== 'ingressGroupNode' && (
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
                    <label><span>Service 类型</span><Select defaultValue="ClusterIP" options={['ClusterIP', 'NodePort', 'LoadBalancer'].map((value) => ({ value, label: value }))} onChange={(value) => pushWorkbenchChange('修改', `${selectedData.title} 类型改为 ${value}`)} /></label>
                    <label><span>端口</span><Input defaultValue="http : 8000 -> 8000 / TCP" onBlur={(event) => pushWorkbenchChange('修改', `${selectedData.title} 端口改为 ${event.target.value}`)} /></label>
                    <label><span>Selector</span><Input defaultValue="rolebasedgroup/name=glm51-router" onBlur={(event) => pushWorkbenchChange('修改', `${selectedData.title} selector 改为 ${event.target.value}`)} /></label>
                    <div className="ataas-route-workbench-edit-card">
                      <div className="ataas-route-workbench-edit-title">
                        <strong>Router 绑定</strong>
                        <Button size="small" type="text" icon={<DeploymentUnitOutlined />} onClick={() => pushWorkbenchChange('关联', `${selectedData.title} 关联 POD`)}>关联 POD</Button>
                      </div>
                      <div className="ataas-route-workbench-binding-row">
                        <span>glm51-router-1-0</span>
                        <em>Running · 10.0.1.7</em>
                        <Button size="small" type="text" danger onClick={() => pushWorkbenchChange('删除', `${selectedData.title} 解绑 glm51-router-1-0`)}>解绑</Button>
                      </div>
                    </div>
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
                {selectedData.kind === 'domainNode' && (
                  <>
                    <label><span>入口流量</span><Input value={`${selectedData.qps || 0} qps`} readOnly /></label>
                    <label><span>错误率</span><Input value={`${((selectedData.errRate || 0) * 100).toFixed(2)}%`} readOnly /></label>
                    <div className="ataas-route-workbench-edit-card">
                      <div className="ataas-route-workbench-edit-title">
                        <strong>域名路由</strong>
                      </div>
                      <label><span>Host</span><Input defaultValue={selectedData.title} onBlur={(event) => pushWorkbenchChange('修改', `Domain host 改为 ${event.target.value}`)} /></label>
                    </div>
                  </>
                )}
                {selectedData.kind !== 'ingressGroupNode' && (
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
            <aside className="ataas-route-workbench-panel">
              <div className="ataas-route-workbench-panel-head">
                <span className={`ataas-rf-node-icon ${selectedData.kind}`}>{routeWorkbenchKindIcon[selectedData.kind]}</span>
                <div>
                  <strong>{selectedData.title}</strong>
                  <span>{typeLabel}</span>
                </div>
                <Button type="text" icon={<CloseCircleOutlined />} onClick={() => setRouteWorkbenchSelected('')} />
              </div>
              <div className="ataas-route-workbench-panel-tabs">
                <button className={routeWorkbenchPanelTab === 'detail' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('detail')}>资源详情</button>
                <button className={routeWorkbenchPanelTab === 'relation' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('relation')}>关联关系</button>
                {selectedData.kind !== 'ingressGroupNode' && (
                  <button className={routeWorkbenchPanelTab === 'yaml' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('yaml')}>YAML</button>
                )}
                {selectedData.kind !== 'ingressGroupNode' && (
                  <button className={routeWorkbenchPanelTab === 'history' ? 'active' : ''} onClick={() => setRouteWorkbenchPanelTab('history')}>History</button>
                )}
              </div>
              <div className="ataas-route-workbench-form">
                {renderPanelBody()}
              </div>
              <div className="ataas-route-workbench-next">
                <span>关联资源</span>
                <button onClick={() => message.info('编辑模式下从节点右侧连接点拖到下游节点即可关联')}><PlusOutlined /> 关联下游资源</button>
              </div>
            </aside>
          );
        };
        return (
          <div className="ataas-route-workbench-page">
            <header className="ataas-route-workbench-topbar">
              <div>
                <strong>链路编排</strong>
              </div>
              <Space>
                <Select
                  value={routeWorkbenchModelFilter}
                  onChange={(value) => {
                    setRouteWorkbenchModelFilter(value);
                    setRouteWorkbenchServiceFilter('');
                  }}
                  options={[
                    { value: 'all', label: '全部模型服务' },
                    ...routeWorkbenchModelOptions,
                  ]}
                  style={{ width: 160 }}
                />
                <Input
                  allowClear
                  value={routeWorkbenchServiceFilter}
                  onChange={(event) => setRouteWorkbenchServiceFilter(event.target.value)}
                  placeholder="搜索 Service"
                  style={{ width: 180 }}
                />
                <Button
                  icon={<EditOutlined />}
                  type={routeWorkbenchEditMode ? 'primary' : 'default'}
                  onClick={() => {
                    setRouteWorkbenchEditMode((value) => !value);
                    if (routeWorkbenchEditMode) setRouteWorkbenchChanges([]);
                  }}
                >
                  {routeWorkbenchEditMode ? '退出编辑' : '编辑模式'}
                </Button>
                <Button onClick={autoLayoutWorkbench}>
                  <ApartmentOutlined /> 自动排版
                </Button>
              </Space>
            </header>
            <div className="ataas-route-workbench-shell">
              <aside className="ataas-route-workbench-palette">
                {([
                  ['ingressGroupNode', 'Cluster'],
                  ['clusterNode', 'SE'],
                  ['serviceNode', 'SVC'],
                ] as Array<[RouteWorkbenchKind, string]>).map(([type, label]) => (
                  <button
                    key={String(type)}
                    draggable
                    onClick={() => addWorkbenchNode(type)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/rtwb-node', type);
                      e.dataTransfer.effectAllowed = 'move';
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
                  edges={visibleEdges}
                  nodeTypes={routeWorkbenchNodeTypes}
                  edgeTypes={routeWorkbenchEdgeTypes}
                  onNodesChange={onRouteWorkbenchNodesChange}
                  onEdgesChange={onRouteWorkbenchEdgesChange}
                  onConnect={onWorkbenchConnect}
                  onNodeDragStart={pushRouteWorkbenchUndo}
                  onNodeClick={(_, node) => {
                    const data = node.data as RouteWorkbenchNodeData | undefined;
                    if (data?.kind === 'clusterNode' && data.sourceRouteKey) {
                      toggleWorkbenchRouteExpand(data.sourceRouteKey);
                    }
                    setRouteWorkbenchSelected(node.id);
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu(null);
                  }}
                  onNodeContextMenu={(event, node) => {
                    event.preventDefault();
                    setRouteWorkbenchSelected(node.id);
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu({ nodeId: node.id, x: event.clientX, y: event.clientY });
                  }}
                  onInit={(instance) => { routeWorkbenchReactFlowRef.current = instance; }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const kind = e.dataTransfer.getData('application/rtwb-node') as RouteWorkbenchKind | '';
                    if (kind) addWorkbenchNode(kind);
                  }}
                  onPaneClick={() => {
                    setRouteWorkbenchSelected('');
                    setRouteWorkbenchPanelTab('detail');
                    setRouteWorkbenchContextMenu(null);
                  }}
                  fitView
                  nodesDraggable
                  nodesConnectable={routeWorkbenchEditMode}
                  elementsSelectable
                  selectionOnDrag
                  selectionMode={SelectionMode.Partial}
                  selectionKeyCode="Shift"
                  multiSelectionKeyCode={['Meta', 'Control']}
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
                    <button type="button" onClick={() => openWorkbenchRename(routeWorkbenchContextMenu.nodeId)}>
                      <EditOutlined />
                      <span>重命名</span>
                    </button>
                    <button type="button" className="danger" onClick={() => deleteWorkbenchNode(routeWorkbenchContextMenu.nodeId)}>
                      <DeleteOutlined />
                      <span>删除卡片</span>
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
              </main>
            </div>
            {routeWorkbenchCreateKind === 'se' ? (
              <>
              <Drawer
                title="创建 ServiceEntry"
                open={true}
                onClose={() => setRouteWorkbenchCreateKind('')}
                width={560}
                footer={
                  <div className="ataas-drawer-footer">
                    <Button onClick={() => setRouteWorkbenchCreateKind('')}>取消</Button>
                    <Button type="primary" onClick={submitWorkbenchCreate}>确定</Button>
                  </div>
                }
              >
                <div className="ataas-cm-create-form">
                  <div className="ataas-cm-create-field">
                    <label>ServiceEntry名称 <span style={{ color: '#d92d20' }}>*</span></label>
                    <Input
                      placeholder="例如: glm-5.1"
                      value={routeWorkbenchCreateDraft.name}
                      onChange={(event) => setRouteWorkbenchCreateDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                        selectorValue: prev.selectorValue || event.target.value,
                      }))}
                    />
                  </div>
                  <div className="ataas-cm-create-field">
                    <label>集群 <span style={{ color: '#d92d20' }}>*</span></label>
                    <Select
                      value={routeWorkbenchCreateDraft.cluster || undefined}
                      onChange={(value) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, cluster: value }))}
                      placeholder="请选择集群"
                      style={{ width: '100%' }}
                      options={clusterOptions.map((item) => ({ value: item, label: item }))}
                    />
                  </div>
                  <div className="ataas-cm-create-field">
                    <label>YAML 文件</label>
                    <div className="ataas-cm-create-yaml-row">
                      {wbYamlSelectedPath ? (
                        <div className="ataas-cm-selected-yaml">
                          <FileSearchOutlined />
                          <span>{wbYamlSelectedPath}</span>
                          <button
                            type="button"
                            className="ataas-cm-remove-yaml"
                            onClick={() => { setWbYamlSelectedPath(''); setWbYamlPreview(''); setRouteWorkbenchCreateDraft((prev) => ({ ...prev, yaml: '' })); }}
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <span className="ataas-cm-select-yaml-hint">未选择</span>
                      )}
                      <Tooltip title="从资源文件选择">
                        <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { loadWbYamlTree(); setWbYamlPickerOpen(true); }} />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Drawer>
            </>
            ) : (
              <Drawer
                title="创建 SVC"
                open={!!routeWorkbenchCreateKind}
                onClose={() => setRouteWorkbenchCreateKind('')}
                width={560}
                footer={
                  <div className="ataas-drawer-footer">
                    <Button onClick={() => setRouteWorkbenchCreateKind('')}>取消</Button>
                    <Button type="primary" onClick={submitWorkbenchCreate}>确定</Button>
                  </div>
                }
              >
                <div className="ataas-cm-create-form">
                  <div className="ataas-cm-create-field">
                    <label>Service名称 <span style={{ color: '#d92d20' }}>*</span></label>
                    <Input
                      placeholder="例如: glm51-router-01"
                      value={routeWorkbenchCreateDraft.name}
                      onChange={(event) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, name: event.target.value }))}
                    />
                  </div>
                  <div className="ataas-cm-create-field">
                    <label>集群 <span style={{ color: '#d92d20' }}>*</span></label>
                    <Select
                      value={routeWorkbenchCreateDraft.cluster || undefined}
                      onChange={(value) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, cluster: value, serviceEntryId: '', podIds: [] }))}
                      placeholder="请选择集群"
                      style={{ width: '100%' }}
                      options={clusterOptions.map((item) => ({ value: item, label: item }))}
                    />
                  </div>
                  <div className="ataas-cm-create-field">
                    <label>关联 ServiceEntry（可选）</label>
                    <Select
                      value={routeWorkbenchCreateDraft.serviceEntryId || undefined}
                      onChange={(value) => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, serviceEntryId: value }))}
                      placeholder="不关联 SE"
                      allowClear
                      style={{ width: '100%' }}
                      options={resourceStore.state.serviceEntries
                        .filter((item) => item.cluster === routeWorkbenchCreateDraft.cluster)
                        .map((item) => ({ value: item.id, label: `${item.name} (${item.cluster})` }))}
                    />
                  </div>
                  <div className="ataas-cm-create-field">
                    <label>YAML 文件</label>
                    <div className="ataas-cm-create-yaml-row">
                      {routeWorkbenchCreateDraft.yaml ? (
                        <div className="ataas-cm-selected-yaml">
                          <FileSearchOutlined />
                          <span>已选择 YAML 文件</span>
                          <button
                            type="button"
                            className="ataas-cm-remove-yaml"
                            onClick={() => setRouteWorkbenchCreateDraft((prev) => ({ ...prev, yaml: '' }))}
                          >
                            移除
                          </button>
                        </div>
                      ) : (
                        <span className="ataas-cm-select-yaml-hint">未选择</span>
                      )}
                      <Tooltip title="从资源文件选择">
                        <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { loadWbYamlTree(); setWbYamlPickerOpen(true); }} />
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </Drawer>
            )}
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
