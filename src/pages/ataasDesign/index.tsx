import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeSandboxOutlined,
  DeploymentUnitOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  NodeIndexOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  RocketOutlined,
  ReloadOutlined,
  SettingOutlined,
  SwapRightOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  WarningOutlined,
  PoweroffOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, DatePicker, Drawer, Dropdown, Form, Input, InputNumber, message, Modal, Popover, Progress, Segmented, Select, Slider, Switch, Table, Tabs, Tag, Tooltip, Upload } from 'antd';
import DeployList, { MOCK_DEPLOY_DATA, getDeployModelLogo, type DeployServiceItem, type ViewMode } from './components/deployList';
import BenchmarkPage from './components/benchmarkPage';
import PlaygroundChatPage from './components/playgroundChatPage';
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import ataasLogo from './ataas-logo.png';
import deepseekLogo from './deepseek-logo.svg';
import glmLogo from './glm-logo.svg';
import kimiLogo from './kimi-logo.svg';
import minimaxLogo from './minimax-logo.svg';
import minicpmLogo from './minicpm-logo.svg';
import qwenLogo from './qwen-logo.svg';
import nvidiaLogo from './nvidia-logo.svg';
import ascendLogo from './ascend-logo.png';
import './index.less';

type ClusterRecord = {
  key: string;
  name: string;
  region: string;
  nodes: number;
  gpu: string;
  gpuTypes: Array<{ name: string; nodes: number; cards: number; usage: number }>;
  gpuUsage: number;
  cpu: string;
  memory: string;
  models: number;
  status: 'healthy' | 'warning' | 'error';
  authInfo: string;
};

const SidebarIcon = ({ name }: { name: 'dashboard' | 'cluster' | 'modelRepo' | 'deploy' | 'image' | 'resource' | 'benchmark' | 'engine' | 'logs' | 'playground' }) => {
  const white = '#fff';
  return (
    <svg className="ataas-sidebar-icon" viewBox="0 0 20 20" aria-hidden="true">
      {name === 'dashboard' && (
        <>
          <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
          <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
        </>
      )}
      {name === 'cluster' && (
        <>
          <rect x="2" y="2" width="16" height="6" rx="1.5" fill="currentColor" />
          <rect x="2" y="12" width="16" height="6" rx="1.5" fill="currentColor" />
          <circle cx="5.5" cy="5" r="1" fill={white} />
          <circle cx="5.5" cy="15" r="1" fill={white} />
          <rect x="9" y="8" width="2" height="4" rx="0.5" fill="currentColor" />
        </>
      )}
      {name === 'deploy' && (
        <>
          <path d="M10 1c-2 2-5 6-5 11h10c0-5-3-9-5-11z" fill="currentColor" />
          <path d="M7 12v3.5L10 18l3-2.5V12H7z" fill="currentColor" opacity="0.6" />
        </>
      )}
      {name === 'modelRepo' && (
        <>
          <rect x="2" y="3" width="16" height="4" rx="1.5" fill="currentColor" />
          <rect x="2" y="8" width="7" height="9" rx="1.5" fill="currentColor" />
          <rect x="11" y="8" width="7" height="9" rx="1.5" fill="currentColor" />
          <rect x="4" y="4.5" width="7" height="1" rx="0.5" fill={white} opacity="0.9" />
        </>
      )}
      {name === 'image' && (
        <>
          <path d="M10 1L1 5.5 10 10l9-4.5L10 1z" fill="currentColor" />
          <path d="M1 9l9 4.5L19 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M1 13l9 4.5L19 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {name === 'resource' && (
        <>
          <rect x="2" y="10" width="4" height="8" rx="1" fill="currentColor" />
          <rect x="8" y="5" width="4" height="13" rx="1" fill="currentColor" />
          <rect x="14" y="2" width="4" height="16" rx="1" fill="currentColor" />
        </>
      )}
      {name === 'benchmark' && (
        <>
          <path d="M10.4 1.8c1.8 2.2.8 3.8 2.9 5.8 1.5 1.4 2.2 2.8 2.2 4.5 0 3.3-2.5 5.9-5.8 5.9S4 15.6 4 12.2c0-2.4 1.4-4.3 3.2-5.9 1.1-1 2.1-2.2 3.2-4.5z" fill="currentColor" />
          <path d="M9.8 9.1c1 .9.7 1.7 1.7 2.7.7.7 1 1.3 1 2.1 0 1.5-1.1 2.6-2.7 2.6s-2.7-1.1-2.7-2.6c0-1.1.6-2 1.4-2.8.5-.5.9-1 1.3-2z" fill={white} opacity="0.9" />
          <rect x="2.5" y="16.2" width="15" height="1.4" rx="0.7" fill="currentColor" opacity="0.55" />
        </>
      )}
      {name === 'engine' && (
        <>
          <path d="M11.5 2h-3l-.5 2.1a6 6 0 00-1.7 1L4.2 4.3l-1.5 2.6 1.6 1.4a6 6 0 000 2l-1.6 1.4 1.5 2.6 2.1-.8a6 6 0 001.7 1L8.5 17h3l.5-2.1a6 6 0 001.7-1l2.1.8 1.5-2.6-1.6-1.4a6 6 0 000-2l1.6-1.4-1.5-2.6-2.1.8a6 6 0 00-1.7-1L11.5 2z" fill="currentColor" />
          <circle cx="10" cy="10" r="2.5" fill={white} />
        </>
      )}
      {name === 'logs' && (
        <>
          <rect x="4" y="2.5" width="12" height="15" rx="2" fill="currentColor" />
          <rect x="6.5" y="6" width="7" height="1.3" rx="0.65" fill={white} opacity="0.95" />
          <rect x="6.5" y="9.2" width="7" height="1.3" rx="0.65" fill={white} opacity="0.82" />
          <rect x="6.5" y="12.4" width="4.8" height="1.3" rx="0.65" fill={white} opacity="0.7" />
        </>
      )}
      {name === 'playground' && (
        <>
          <path d="M4 4.5C4 3.1 5.1 2 6.5 2h7C14.9 2 16 3.1 16 4.5v5c0 1.4-1.1 2.5-2.5 2.5H9.2L5.6 15.2c-.6.5-1.6.1-1.6-.7V4.5z" fill="currentColor" />
          <rect x="6.8" y="5.4" width="6.4" height="1.2" rx="0.6" fill={white} opacity="0.95" />
          <rect x="6.8" y="8" width="4.6" height="1.2" rx="0.6" fill={white} opacity="0.78" />
          <path d="M11.7 14.1h2.1c1.2 0 2.2-.9 2.2-2.1v-.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

type ResourceCardRecord = {
  key: string;
  name: string;
  subtitle: string;
  family: string;
  nodes: number;
  gpuCards?: number;
  models: number;
  status: 'healthy' | 'warning' | 'error';
  gpuUsage: number;
  gpuMemoryUsage: number;
  gpuMemoryText: string;
  diskUsage: number;
  cpuUsage: number;
  memoryUsage: number;
  chips: string[];
  metaName: string;
};

type ImageRecord = {
  key: string;
  name: string;
  tag: string;
  size: string;
  vendor: string;
  gpuType: string;
  engine: string;
  runtime: string;
  hardware: string;
  models: string;
  importMethod: string;
  importStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  section: '引擎镜像' | '基础镜像';
  sectionDesc: string;
};

type StartupTemplateRecord = {
  key: string;
  name: string;
  yamlContent?: string;
  engine: string;
  modelFamily: string;
  deployMode: string;
  hardware: string;
  nodeCount: number;
  cardCount: number;
  cudaVersion?: string;
  cannVersion?: string;
  imageKey?: string;
  topology: string;
  command: string;
  params?: Array<{ key: string; value: string }>;
  description: string;
  updatedAt: string;
};

type ModelRepoRecord = {
  id: number;
  name: string;
  family: string;
  type: string;
  source: 'official' | 'private';
  modelId: string;
  status: 'installed' | 'uninstalled';
  serveStatus: 'serving' | 'free';
  description: string;
  categories: string[];
  tags: {
    categories: string;
    weight_size: string;
    quanted_type: string;
    max_position_embeddings: string;
  };
  updatedAt: string;
};

type GpuCardInfo = {
  index: number;
  model: string;
  spec: string;
  memoryTotal: string;
  memoryUsed: string;
  memoryFree: string;
  utilization: number;
  power: number;
  temperature: number;
  status: string;
  replicas: string[];
};

type NodeRecord = {
  key: string;
  clusterKey: string;
  name: string;
  label: string;
  clusterName: string;
  status: 'normal' | 'warning' | 'error';
  authStatus: 'authorized' | 'unauthorized';
  modelCount: number;
  runningInstances: number;
  ip: string;
  cpu: number;
  cpuUsed: number;
  memory: string;
  memoryUsed: string;
  gpu: number;
  gpuMemory: string;
  gpuMemoryUsed: string;
  disk: string;
  diskUsed: string;
  gpuCards: GpuCardInfo[];
};

type ModelMonitorRecord = {
  key: string;
  name: string;
  service: string;
  cluster: string;
  engine: string;
  status: 'running' | 'warning';
  totalToken: string;
  inputToken: string;
  outputToken: string;
  calls: string;
  successRate: number;
  failRate: number;
  ttft: number;
  tpot: number;
  tpm: string;
  rpm: string;
  concurrent: number;
  cacheHit: number;
  trend: number[];
};

type DeployEngineImage = {
  key: string;
  clusterKey: string;
  name: string;
  engine: string;
  version: string;
  accelerator: string;
  status: 'ready' | 'scanning';
};

type DeployModelOption = {
  key: string;
  name: string;
  size: string;
  format: string;
  scene: string;
};

type DeployNodeOption = {
  key: string;
  clusterKey: string;
  name: string;
  ip: string;
  gpuType: string;
  totalCards: number;
  availableCards: number;
  status: 'ready' | 'busy' | 'error';
};

const clusters: ClusterRecord[] = [
  { key: 'c1', name: 'beijing-prod', region: '北京一区', nodes: 38, gpu: 'A100 80G x 160 / H20 x 64', gpuTypes: [{ name: 'A100', nodes: 24, cards: 160, usage: 78 }, { name: 'H20', nodes: 14, cards: 64, usage: 62 }], gpuUsage: 72, cpu: '1,824 / 2,432 Core', memory: '9.4 / 14.8 TB', models: 18, status: 'healthy', authInfo: '36/38' },
  { key: 'c2', name: 'shanghai-online', region: '上海二区', nodes: 46, gpu: 'H20 x 304 / 910B x 64', gpuTypes: [{ name: 'H20', nodes: 38, cards: 304, usage: 68 }, { name: '910B', nodes: 8, cards: 64, usage: 54 }], gpuUsage: 66, cpu: '2,118 / 2,944 Core', memory: '11.2 / 18.1 TB', models: 24, status: 'healthy', authInfo: '42/46' },
  { key: 'c3', name: 'guangzhou-test', region: '广州测试', nodes: 19, gpu: 'L20 x 72 / A100 x 24', gpuTypes: [{ name: 'L20', nodes: 15, cards: 72, usage: 38 }, { name: 'A100', nodes: 4, cards: 24, usage: 52 }], gpuUsage: 92, cpu: '742 / 1,216 Core', memory: '3.7 / 7.6 TB', models: 9, status: 'warning', authInfo: '15/19' },
  { key: 'c4', name: 'wuhan-kunpeng', region: '武汉专区', nodes: 16, gpu: 'Ascend 910B x 64 / L20 x 24', gpuTypes: [{ name: '910B', nodes: 8, cards: 64, usage: 61 }, { name: 'L20', nodes: 4, cards: 24, usage: 45 }], gpuUsage: 58, cpu: '624 / 1,024 Core', memory: '2.9 / 6.4 TB', models: 7, status: 'healthy', authInfo: '16/16' },
];

const nodes: NodeRecord[] = [
  { key: 'n1', clusterKey: 'c1', name: 'qujing4', label: 'GPU=RTX_4090', clusterName: 'default', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.4', cpu: 128, cpuUsed: 42, memory: '1007.56 GB', memoryUsed: '352.6 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '95.9 GB', disk: '3.86 TB', diskUsed: '1.54 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 52, power: 315, temperature: 72, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 98, power: 425, temperature: 81, status: 'active', replicas: [] }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 95, power: 410, temperature: 78, status: 'active', replicas: [] }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 87, power: 380, temperature: 75, status: 'active', replicas: [] }] },
  { key: 'n2', clusterKey: 'c1', name: 'qujing7', label: 'GPU=RTX_4090', clusterName: 'default', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.21', cpu: 192, cpuUsed: 68, memory: '1.48 TB', memoryUsed: '521.3 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '115.2 GB', disk: '12.6 TB', diskUsed: '5.04 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 48, power: 300, temperature: 68, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 92, power: 400, temperature: 76, status: 'active', replicas: [] }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 94, power: 405, temperature: 77, status: 'active', replicas: [] }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 88, power: 385, temperature: 74, status: 'active', replicas: [] }] },
  { key: 'n3', clusterKey: 'c1', name: 'qujing21', label: 'GPU=RTX_4090', clusterName: 'default', status: 'normal', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.109.6', cpu: 192, cpuUsed: 56, memory: '1007.51 GB', memoryUsed: '483.6 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '67.2 GB', disk: '3.86 TB', diskUsed: '2.12 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '19.2 GB', memoryFree: '4.79 GB', utilization: 78, power: 350, temperature: 71, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 96, power: 420, temperature: 82, status: 'active', replicas: [] }] },
  { key: 'n4', clusterKey: 'c1', name: 'qujing1', label: 'GPU=RTX_5000', clusterName: 'default', status: 'error', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.200.10', cpu: 192, cpuUsed: 0, memory: '1007.39 GB', memoryUsed: '0 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '0 GB', disk: '3.86 TB', diskUsed: '1.89 TB', gpuCards: [{ index: 0, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 35, status: 'idle', replicas: [] }, { index: 1, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle', replicas: [] }] },
  { key: 'n5', clusterKey: 'c1', name: 'qujing24', label: 'GPU=RTX_4090', clusterName: 'default', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.109.23', cpu: 96, cpuUsed: 38, memory: '503.35 GB', memoryUsed: '176.2 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '57.6 GB', disk: '5.68 TB', diskUsed: '2.27 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '14.4 GB', memoryFree: '9.59 GB', utilization: 58, power: 320, temperature: 69, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 93, power: 408, temperature: 79, status: 'active', replicas: [] }] },
  { key: 'n6', clusterKey: 'c1', name: 'qujing20', label: 'GPU=RTX_4011', clusterName: 'default', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.20', cpu: 192, cpuUsed: 72, memory: '1007.51 GB', memoryUsed: '604.5 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '72.0 GB', disk: '3.86 TB', diskUsed: '1.62 TB', gpuCards: [{ index: 0, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '16.8 GB', memoryFree: '7.19 GB', utilization: 68, power: 340, temperature: 70, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 91, power: 395, temperature: 76, status: 'active', replicas: [] }] },
  { key: 'n7', clusterKey: 'c2', name: 'nj-h20-001', label: 'GPU=H20', clusterName: 'online', status: 'normal', authStatus: 'authorized', modelCount: 1, runningInstances: 2, ip: '192.168.120.1', cpu: 256, cpuUsed: 112, memory: '2.01 TB', memoryUsed: '824.1 GB', gpu: 8, gpuMemory: '383.9 GB', gpuMemoryUsed: '230.3 GB', disk: '8.5 TB', diskUsed: '4.25 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'H20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: i < 5 ? '47.9 GB' : '23.9 GB', memoryFree: i < 5 ? '0.09 GB' : '24.09 GB', utilization: i < 5 ? 95 : 48, power: i < 5 ? 280 : 160, temperature: i < 5 ? 78 : 62, status: 'active', replicas: i < 5 ? ['deepseek-prod-r1-p1', 'deepseek-prod-r1-p2'] : [] })) },
  { key: 'n8', clusterKey: 'c2', name: 'nj-h20-002', label: 'GPU=H20', clusterName: 'online', status: 'normal', authStatus: 'authorized', modelCount: 2, runningInstances: 4, ip: '192.168.120.2', cpu: 256, cpuUsed: 148, memory: '2.01 TB', memoryUsed: '1.21 TB', gpu: 8, gpuMemory: '383.9 GB', gpuMemoryUsed: '287.9 GB', disk: '8.5 TB', diskUsed: '5.53 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'H20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: i < 6 ? '47.9 GB' : '23.9 GB', memoryFree: i < 6 ? '0.09 GB' : '24.09 GB', utilization: i < 6 ? 97 : 52, power: i < 6 ? 285 : 165, temperature: i < 6 ? 80 : 64, status: 'active', replicas: i < 6 ? ['qwen3-coding-p1', 'qwen3-coding-p2'] : [] })) },
  { key: 'n9', clusterKey: 'c2', name: 'nj-910b-001', label: 'GPU=Ascend_910B', clusterName: 'online', status: 'warning', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.120.10', cpu: 128, cpuUsed: 96, memory: '1.01 TB', memoryUsed: '757.5 GB', gpu: 8, gpuMemory: '191.95 GB', gpuMemoryUsed: '153.6 GB', disk: '4.2 TB', diskUsed: '2.94 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'Ascend 910B', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '19.2 GB', memoryFree: '4.79 GB', utilization: i > 4 ? 82 : 76, power: 220, temperature: 72, status: 'active', replicas: [] })) },
  { key: 'n10', clusterKey: 'c3', name: 'gz-l20-001', label: 'GPU=L20', clusterName: 'test', status: 'normal', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.130.5', cpu: 192, cpuUsed: 84, memory: '1007.51 GB', memoryUsed: '453.4 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '115.2 GB', disk: '3.86 TB', diskUsed: '1.35 TB', gpuCards: Array.from({ length: 4 }, (_, i) => ({ index: i, model: 'L20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: '23.9 GB', memoryFree: '24.09 GB', utilization: 52 + i * 8, power: 180, temperature: 66, status: 'active', replicas: [] })) },
];

const overviewModelCards = [
  { name: 'DeepSeek-R1-Distill-Qwen-1.5B-1', top: 'TOP 1', token: '4.0 万', calls: 43, success: '100.00%', rpm: '18.6K', tpm: '812K', ttft: [0.54, 0.56, 0.59, 0.55, 0.57, 0.58, 0.56, 0.55, 0.54, 0.57, 0.56, 0.55, 0.58, 0.56], tpot: [84, 86, 89, 87, 90, 88, 86, 87, 85, 89, 87, 88, 90, 87] },
  { name: 'DeepSeek-R1-Distill-Qwen-7B-1', top: 'TOP 2', token: '3272', calls: 20, success: '100.00%', rpm: '9.7K', tpm: '392K', ttft: [0.78, 0.82, 0.85, 0.81, 0.79, 0.82, 0.80, 0.83, 0.81, 0.79, 0.82, 0.84, 0.80, 0.81], tpot: [58, 61, 63, 60, 64, 62, 59, 61, 63, 60, 62, 64, 61, 60] },
  { name: 'DeepSeek-R1-Distill-Qwen-1.5B-2', top: 'TOP 3', token: '1205', calls: 36, success: '100.00%', rpm: '7.2K', tpm: '278K', ttft: [0.66, 0.68, 0.71, 0.69, 0.67, 0.70, 0.68, 0.69, 0.67, 0.70, 0.68, 0.66, 0.69, 0.67], tpot: [46, 49, 51, 48, 50, 52, 49, 47, 50, 48, 51, 49, 52, 50] },
];

const overviewCallRank = [
  { name: 'GLM-4-Air', tpm: '812K', rpm: '18.6K' },
  { name: 'Qwen2.5-72B-Instruct', tpm: '646K', rpm: '14.8K' },
  { name: 'DeepSeek-R1-Distill', tpm: '392K', rpm: '9.7K' },
  { name: 'InternVL2-26B', tpm: '278K', rpm: '7.2K' },
  { name: 'Yi-1.5-34B', tpm: '198K', rpm: '5.4K' },
  { name: 'MiniCPM-2B', tpm: '145K', rpm: '3.8K' },
  { name: 'Qwen2.5-14B', tpm: '98K', rpm: '2.1K' },
  { name: 'DeepSeek-V2-Chat', tpm: '72K', rpm: '1.6K' },
  { name: 'GLM-4-9B', tpm: '42K', rpm: '1.1K' },
  { name: 'MiniMax-abab6.5', tpm: '12K', rpm: '312' },
];

const modelMonitors: ModelMonitorRecord[] = [
  { key: 'm1', name: 'DeepSeek-R1-671B', service: 'rbg-deepseek-prod', cluster: 'beijing-a100-prod', engine: 'vLLM', status: 'running', totalToken: '4.82B', inputToken: '2.91B', outputToken: '1.91B', calls: '1,248万', successRate: 99.92, failRate: 0.08, ttft: 318, tpot: 24, tpm: '812K', rpm: '18.6K', concurrent: 1240, cacheHit: 68, trend: [36, 42, 39, 51, 58, 62, 74, 78, 86, 91, 88, 96] },
  { key: 'm2', name: 'Qwen3-235B-A22B', service: 'qwen3-coding-slo', cluster: 'shanghai-h20-online', engine: 'SGLang', status: 'running', totalToken: '3.16B', inputToken: '1.86B', outputToken: '1.30B', calls: '984万', successRate: 99.71, failRate: 0.29, ttft: 286, tpot: 21, tpm: '646K', rpm: '14.8K', concurrent: 980, cacheHit: 74, trend: [32, 34, 41, 45, 49, 53, 58, 66, 70, 76, 72, 79] },
  { key: 'm3', name: 'GLM-4.5-Air', service: 'glm-air-batch', cluster: 'guangzhou-l20-test', engine: 'vLLM', status: 'warning', totalToken: '1.78B', inputToken: '1.09B', outputToken: '690M', calls: '612万', successRate: 98.94, failRate: 1.06, ttft: 241, tpot: 18, tpm: '392K', rpm: '9.7K', concurrent: 520, cacheHit: 51, trend: [28, 31, 30, 39, 35, 42, 48, 44, 52, 57, 54, 61] },
  { key: 'm4', name: 'Kimi-K2-Instruct', service: 'kimi-router-canary', cluster: 'wuhan-kunpeng-npu', engine: 'MindIE', status: 'running', totalToken: '1.22B', inputToken: '760M', outputToken: '460M', calls: '438万', successRate: 99.51, failRate: 0.49, ttft: 352, tpot: 29, tpm: '278K', rpm: '7.2K', concurrent: 430, cacheHit: 63, trend: [18, 21, 25, 29, 28, 33, 37, 39, 44, 48, 47, 52] },
];

const modelResourceUsage: Record<string, { nodes: number; cards: number; gpuType: string; memory: string }> = {
  m1: { nodes: 16, cards: 64, gpuType: 'A100 80G', memory: '5.12 TB' },
  m2: { nodes: 12, cards: 48, gpuType: 'H20 141G', memory: '6.77 TB' },
  m3: { nodes: 4, cards: 12, gpuType: 'L20 48G', memory: '576 GB' },
  m4: { nodes: 6, cards: 24, gpuType: 'Ascend 910B', memory: '1.54 TB' },
};

const serviceEvents = [
  { name: 'rbg-deepseek-prod', stage: '模型加载完成', status: 'success', time: '14:32:08' },
  { name: 'qwen3-coding-slo', stage: 'Decode 扩容 2 -> 4', status: 'processing', time: '14:29:41' },
  { name: 'glm-air-batch', stage: 'Hicache 命中率回升', status: 'success', time: '14:21:12' },
  { name: 'kimi-router-canary', stage: '灰度路由校验中', status: 'processing', time: '14:08:55' },
];


const alerts = [
  { level: 'critical', title: 'GPU 显存不足', detail: 'beijing-prod / worker-a100-012', time: '2026-05-29 14:32' },
  { level: 'warning', title: 'TTFT 超时阈值', detail: 'qwen3-coding-slo / 平均 512ms', time: '2026-05-29 14:28' },
  { level: 'critical', title: '节点离线', detail: 'guangzhou-test / gz-l20-worker-005', time: '2026-05-29 14:15' },
  { level: 'warning', title: '模型加载失败', detail: 'DeepSeek-R1 / 镜像拉取超时', time: '2026-05-29 13:58' },
  { level: 'info', title: '集群扩容完成', detail: 'shanghai-online / +4 H20 节点', time: '2026-05-29 13:40' },
];

const monitorModelNames = [
  'DeepSeek-R1-671B',
  'DeepSeek-R1-Distill-Qwen-32B',
  'DeepSeek-V2-Chat-236B',
  'Qwen3-235B-A22B',
  'Qwen2.5-72B-Instruct',
  'Qwen2.5-14B-Instruct',
  'Qwen2.5-Coder-32B',
  'GLM-4.5-Air',
  'GLM-4-9B-Chat',
  'GLM-4-Air',
  'Kimi-K2-Instruct',
  'Kimi-K2.5',
  'MiniCPM-2B-SFT',
  'MiniMax-abab6.5',
];

const monitorClusterNames = ['beijing-prod', 'shanghai-online', 'guangzhou-test', 'wuhan-kunpeng'];
const clusterFilterOptions = [
  { value: '', label: '全部集群' },
  ...monitorClusterNames.map((name) => ({ value: name, label: name })),
];

const getMockMonitorMetrics = (index: number, scale = 1) => {
  const callTotal = Math.round((186240 + index * 9421 + (index % 7) * 3188) * scale);
  const failRateNumber = Number((0.08 + (index % 9) * 0.11 + (index % 3) * 0.03).toFixed(2));
  const callFailed = Math.round(callTotal * failRateNumber / 100);
  const inputTokens = Math.round(callTotal * (78 + (index % 6) * 9) * scale);
  const outputTokens = Math.round(callTotal * (46 + (index % 5) * 7) * scale);
  const totalTokens = inputTokens + outputTokens;
  return {
    callTotal,
    callFailed,
    failRate: `${failRateNumber}%`,
    totalTokens,
    inputTokens,
    outputTokens,
    avgTtft: 180 + (index % 8) * 24,
    avgOtps: Number((42 + (index % 10) * 3.6).toFixed(1)),
    cacheHitRate: `${48 + (index % 11) * 4}%`,
    interfaceCount: 2 + (index % 4),
  };
};

const monitorRows = Array.from({ length: 107 }, (_, index) => {
  const name = monitorModelNames[index % monitorModelNames.length];
  const metrics = getMockMonitorMetrics(index);
  return {
    key: `monitor-${index + 1}`,
    name: index < monitorModelNames.length ? name : `${name}-${Math.floor(index / monitorModelNames.length) + 1}`,
    cluster: monitorClusterNames[index % monitorClusterNames.length],
    ...metrics,
    hasV2: !['tokenizer', 'ERNIE Speed-AppBuilder'].includes(name),
  };
});

const alertLevelSummary = {
  critical: alerts.filter((item) => item.level === 'critical').length,
  warning: alerts.filter((item) => item.level === 'warning').length,
  info: alerts.filter((item) => item.level === 'info').length,
};

type AlertRecord = {
  key: string;
  target: string;
  time: string;
  objectType: string;
  cluster: string;
  description: string;
  suggestion: string;
  count: number;
  status: string;
  level: string;
};

const alertList: AlertRecord[] = [
  { key: 'a1', target: 'worker-a100-012', time: '2026-05-29 14:32', objectType: '节点', cluster: 'beijing-a100-prod', description: 'GPU 显存使用率 97%，剩余 2.4 GB', suggestion: '建议迁移部分模型至其他节点或扩容', count: 12, status: '未处理', level: 'critical' },
  { key: 'a2', target: 'qwen3-coding-slo', time: '2026-05-29 14:28', objectType: '模型服务', cluster: 'shanghai-h20-online', description: 'TTFT 平均 512ms，超过阈值 300ms', suggestion: '检查 Decode 节点负载，考虑扩容', count: 8, status: '未处理', level: 'warning' },
  { key: 'a3', target: 'gz-l20-worker-005', time: '2026-05-29 14:15', objectType: '节点', cluster: 'guangzhou-l20-test', description: '节点心跳中断，已离线 5 分钟', suggestion: '检查网络连通性及 kubelet 状态', count: 3, status: '未处理', level: 'critical' },
  { key: 'a4', target: 'DeepSeek-R1', time: '2026-05-29 13:58', objectType: '模型服务', cluster: 'beijing-a100-prod', description: '模型加载失败，镜像拉取超时', suggestion: '检查镜像仓库连通性，重试拉取', count: 2, status: '已恢复', level: 'warning' },
  { key: 'a5', target: 'shanghai-online', time: '2026-05-29 13:40', objectType: '集群', cluster: 'shanghai-h20-online', description: '集群扩容完成，新增 4 个 H20 节点', suggestion: '-', count: 1, status: '已恢复', level: 'info' },
  { key: 'a6', target: 'nj-910b-001', time: '2026-05-29 12:10', objectType: '节点', cluster: 'shanghai-h20-online', description: '磁盘使用率 88%，剩余 512 GB', suggestion: '建议清理过期日志和镜像缓存', count: 6, status: '未处理', level: 'warning' },
  { key: 'a7', target: 'glm-air-batch', time: '2026-05-29 11:25', objectType: '模型服务', cluster: 'guangzhou-l20-test', description: 'TPOT 延迟飙升至 45ms，正常范围 <20ms', suggestion: '检查 GPU 是否被其他任务抢占', count: 4, status: '未处理', level: 'warning' },
  { key: 'a8', target: 'deepseek-prod', time: '2026-05-28 23:15', objectType: '模型服务', cluster: 'beijing-a100-prod', description: '并发请求数超过限制 1240/1000', suggestion: '检查是否遭受异常流量，考虑扩容', count: 15, status: '已恢复', level: 'critical' },
  { key: 'a9', target: 'worker-a100-008', time: '2026-05-28 21:30', objectType: '节点', cluster: 'beijing-a100-prod', description: 'GPU 温度 89°C 超过告警阈值 85°C', suggestion: '检查散热系统，降低负载或关机冷却', count: 7, status: '已恢复', level: 'critical' },
];

const getClusterAlertName = (item: ClusterRecord) => {
  if (item.key === 'c1') return 'beijing-a100-prod';
  if (item.key === 'c2') return 'shanghai-h20-online';
  if (item.key === 'c3') return 'guangzhou-l20-test';
  return item.name;
};

const images: ImageRecord[] = [
  { key: 'i1', name: 'vLLM 推理服务镜像', tag: 'registry.qujing.io/vllm/vllm-openai:v0.9.1-a100', size: '18.6 GB', vendor: 'NVIDIA', gpuType: 'A100', engine: 'vLLM', runtime: 'CUDA 12.4 / Driver 550+', hardware: 'NVIDIA A100/H20', models: 'Qwen2.5-72B, DeepSeek-R1', importMethod: '在线拉取', importStatus: '已可用', status: '可用', createdAt: '2026-05-15 09:30', updatedAt: '2026-05-18 13:20', section: '引擎镜像', sectionDesc: 'vLLM 0.9.1 / A100 优化' },
  { key: 'i2', name: 'SGLang 网关缓存镜像', tag: 'registry.qujing.io/sglang/sglang-router:h20-pd-cache', size: '21.3 GB', vendor: 'NVIDIA', gpuType: 'H20', engine: 'SGLang', runtime: 'CUDA 12.4 / Driver 550+', hardware: 'NVIDIA H20/910B', models: 'Qwen2.5-72B, GLM-4-Air', importMethod: '在线拉取', importStatus: '已可用', status: '可用', createdAt: '2026-05-14 14:15', updatedAt: '2026-05-18 11:42', section: '引擎镜像', sectionDesc: 'SGLang 0.4.8 / PD 缓存' },
  { key: 'i3', name: 'KLLM 标准推理镜像', tag: 'registry.qujing.io/kllm/kllm-standard:v4.3.0-h20', size: '22.1 GB', vendor: 'NVIDIA', gpuType: 'H20', engine: 'KLLM', runtime: 'CUDA 12.4 / Driver 550+', hardware: 'NVIDIA H20/RTX 6000', models: 'Qwen2.5-72B, DeepSeek-R1-Distill', importMethod: '在线拉取', importStatus: '已可用', status: '可用', createdAt: '2026-05-09 08:00', updatedAt: '2026-05-15 16:30', section: '引擎镜像', sectionDesc: 'KLLM 4.3 / 标准版' },
  { key: 'i4', name: 'Triton 推理服务镜像', tag: 'nvcr.io/nvidia/tritonserver:24.08-py3', size: '12.4 GB', vendor: 'NVIDIA', gpuType: '通用', engine: 'Triton', runtime: 'CUDA 12.4 / Driver 550+', hardware: 'NVIDIA A100/H20/L20', models: 'Qwen2.5-72B, InternVL2', importMethod: '在线拉取', importStatus: '已可用', status: '可用', createdAt: '2026-05-12 10:00', updatedAt: '2026-05-16 08:30', section: '引擎镜像', sectionDesc: 'Triton 24.08 / 多 GPU' },
  { key: 'i5', name: 'MindIE 昇腾推理镜像', tag: 'ascendhub.huawei.com/mindie/mindie:2.0.RC1-910b', size: '15.2 GB', vendor: 'Ascend', gpuType: 'Ascend 910B', engine: 'MindIE', runtime: 'CANN 8.0 / Driver 24.1+', hardware: '昇腾 910B', models: 'GLM-4-Air, Qwen2.5-7B', importMethod: '在线拉取', importStatus: '已可用', status: '可用', createdAt: '2026-05-10 16:20', updatedAt: '2026-05-10 17:45', section: '引擎镜像', sectionDesc: 'MindIE 2.0 / 昇腾适配' },
  { key: 'i8', name: 'Base LLM 运行时镜像', tag: 'registry.qujing.io/base/llm-runtime:py311-cu124', size: '4.2 GB', vendor: '平台自研', gpuType: '通用', engine: '-', runtime: 'CUDA 12.4 / Driver 550+', hardware: '通用', models: '-', importMethod: '镜像包上传', importStatus: '已可用', status: '可用', createdAt: '2026-05-07 11:00', updatedAt: '2026-05-13 09:45', section: '基础镜像', sectionDesc: 'Python 3.11 / CUDA 12.4' },
  { key: 'i9', name: 'Custom Agent 基础镜像', tag: 'registry.qujing.io/custom/agent-base:py311-fastapi', size: '3.6 GB', vendor: '平台自研', gpuType: '通用', engine: '-', runtime: 'CPU / Python 3.11', hardware: '通用', models: '-', importMethod: '镜像包上传', importStatus: '已可用', status: '可用', createdAt: '2026-05-06 15:30', updatedAt: '2026-05-12 08:20', section: '基础镜像', sectionDesc: 'FastAPI / 无 GPU' },
  { key: 'i12', name: 'Custom ROCm 客户镜像', tag: 'registry.qujing.io/customer/custom-runtime:rocm62-dcu', size: '25.4 GB', vendor: '客户上传', gpuType: 'DCU', engine: '-', runtime: 'ROCm 6.2 / Driver 6.x+', hardware: '海光 DCU BW1000/1100', models: '客户私有模型', importMethod: '镜像包上传', importStatus: '已可用', status: '可用', createdAt: '2026-05-04 16:40', updatedAt: '2026-05-09 11:20', section: '基础镜像', sectionDesc: 'ROCm 6.2 / 海光 DCU' },
];

const startupTemplateSeed: StartupTemplateRecord[] = [
  {
    key: 'tpl-sglang-deepseek-pd',
    name: 'DeepSeek-R1 SGLang PD 模板',
    yamlContent: 'name: DeepSeek-R1 SGLang PD 模板\nengine: SGLang\nmodelFamily: DeepSeek\ndeployMode: PD 分离\nhardware: NVIDIA H20\nnodeCount: 2\ncardCount: 16\ntopology: 2P2D / TP8 / EP1\ncommand: python -m sglang.launch_server --model-path /models/deepseek-r1 --host 0.0.0.0 --port 30000 --enable-pd-disaggregation\ndescription: DeepSeek-R1 生产环境 PD 分离启动模板，适合 H20/A100 多实例部署。',
    engine: 'SGLang',
    modelFamily: 'DeepSeek',
    deployMode: 'PD 分离',
    hardware: 'NVIDIA H20',
    nodeCount: 2,
    cardCount: 16,
    topology: '2P2D / TP8 / EP1',
    command: 'python -m sglang.launch_server --model-path /models/deepseek-r1 --host 0.0.0.0 --port 30000 --enable-pd-disaggregation',
    description: 'DeepSeek-R1 生产环境 PD 分离启动模板，适合 H20/A100 多实例部署。',
    updatedAt: '2026-05-29 15:20',
  },
  {
    key: 'tpl-vllm-qwen-single',
    name: 'Qwen vLLM 单机模板',
    yamlContent: 'name: Qwen vLLM 单机模板\nengine: vLLM\nmodelFamily: Qwen\ndeployMode: 单机部署\nhardware: NVIDIA A100 80G\nnodeCount: 1\ncardCount: 8\ntopology: TP8 / PP1\ncommand: vllm serve /models/qwen2.5 --host 0.0.0.0 --port 8000 --trust-remote-code\ndescription: Qwen 系列单机推理模板，默认 8 卡张量并行。',
    engine: 'vLLM',
    modelFamily: 'Qwen',
    deployMode: '单机部署',
    hardware: 'NVIDIA A100 80G',
    nodeCount: 1,
    cardCount: 8,
    topology: 'TP8 / PP1',
    command: 'vllm serve /models/qwen2.5 --host 0.0.0.0 --port 8000 --trust-remote-code',
    description: 'Qwen 系列单机推理模板，默认 8 卡张量并行。',
    updatedAt: '2026-05-28 10:10',
  },
  {
    key: 'tpl-sglang-glm-distributed',
    name: 'GLM SGLang 分布式模板',
    yamlContent: 'name: GLM SGLang 分布式模板\nengine: SGLang\nmodelFamily: GLM\ndeployMode: 分布式部署\nhardware: NVIDIA L20\nnodeCount: 2\ncardCount: 8\ntopology: TP8 / DP2 / EP1\ncommand: python -m sglang.launch_server --model-path /models/glm-4-air --host 0.0.0.0 --port 30000 --tp 8 --dp 2\ndescription: GLM 长上下文服务模板，适合多节点横向扩展。',
    engine: 'SGLang',
    modelFamily: 'GLM',
    deployMode: '分布式部署',
    hardware: 'NVIDIA L20',
    nodeCount: 2,
    cardCount: 8,
    topology: 'TP8 / DP2 / EP1',
    command: 'python -m sglang.launch_server --model-path /models/glm-4-air --host 0.0.0.0 --port 30000 --tp 8 --dp 2',
    description: 'GLM 长上下文服务模板，适合多节点横向扩展。',
    updatedAt: '2026-05-27 18:35',
  },
];

const scheduledServiceGroups = [
  { key: 'sg-deepseek-prod', name: 'DeepSeek-R1 生产服务组', family: 'DeepSeek', services: ['deepseek-r1-prod', 'deepseek-r1-canary', 'deepseek-r1-batch'] },
  { key: 'sg-glm-online', name: 'GLM 在线服务组', family: 'GLM', services: ['glm-4-air-prod', 'glm-4-air-batch'] },
  { key: 'sg-qwen-coding', name: 'Qwen 代码服务组', family: 'Qwen', services: ['qwen2.5-coder-prod', 'qwen2.5-coder-slo'] },
];

const modelRepoFilters = [
  {
    title: '模型类别',
    groups: [
      { label: '多模态', items: ['深度思考', '视觉理解', 'GUI Agent'] },
      { label: '文本', items: ['深度推理', '文本生成', '代码生成'] },
      { label: '视觉', items: ['图像生成', '视频生成', '3D生成'] },
      { label: '语音', items: ['语音识别', '语音合成', '实时语音'] },
      { label: '向量', items: ['向量模型', '排序模型'] },
    ],
  },
  {
    title: '模型提供方',
    groups: [
      { label: '自研', items: ['ATaaS'] },
      { label: '开源', items: ['Qwen', 'DeepSeek', 'GLM', 'Kimi', 'MiniMax', 'MiniCPM', 'Yi', 'BAAI', 'OpenAI', 'InternVL'] },
    ],
  },
];

const modelRepoData: ModelRepoRecord[] = [
  { id: 1001, name: 'Qwen2.5-72B-Instruct', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1001', status: 'installed', serveStatus: 'serving', description: '通义千问2.5 72B 指令微调版本，支持 128K 上下文，覆盖文本生成、代码编写、数学推理、多语言翻译等多种能力。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '72B', quanted_type: 'BF16', max_position_embeddings: '128K' }, updatedAt: '2026-04-16T10:30:00Z' },
  { id: 1002, name: 'DeepSeek-R1-Distill-Qwen-32B', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1002', status: 'installed', serveStatus: 'serving', description: 'DeepSeek R1 蒸馏版本，基于 Qwen 32B 架构，专注于推理和数学能力，支持 32K 上下文长度。', categories: ['llm'], tags: { categories: '深度思考', weight_size: '32B', quanted_type: 'BF16', max_position_embeddings: '32K' }, updatedAt: '2026-04-15T14:20:00Z' },
  { id: 1003, name: 'GLM-4-9B-Chat', family: 'GLM', type: 'llm', source: 'official', modelId: 'm1003', status: 'installed', serveStatus: 'free', description: '智谱 GLM-4 9B 对话模型，支持 128K 上下文，擅长中文理解与生成，适合政企场景的智能问答和文档处理。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '9B', quanted_type: 'BF16', max_position_embeddings: '128K' }, updatedAt: '2026-04-14T20:55:00Z' },
  { id: 1004, name: 'Kimi-K2.5', family: 'Kimi', type: 'llm', source: 'official', modelId: 'm1004', status: 'installed', serveStatus: 'serving', description: 'Moonshot Kimi K2.5 大语言模型，具备强大的长文本理解能力，支持 200K 上下文窗口，适用于文档摘要、报告生成等场景。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '128B', quanted_type: 'FP8', max_position_embeddings: '200K' }, updatedAt: '2026-04-18T02:58:00Z' },
  { id: 1005, name: 'Qwen2.5-14B-Instruct', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1005', status: 'installed', serveStatus: 'free', description: '通义千问2.5 14B 版本，性能与成本的最佳平衡点，适合中小规模部署和边缘推理场景。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '14B', quanted_type: 'BF16', max_position_embeddings: '128K' }, updatedAt: '2026-04-13T16:40:00Z' },
  { id: 1006, name: 'InternVL2-26B', family: 'InternVL', type: 'vlm', source: 'official', modelId: 'm1006', status: 'installed', serveStatus: 'free', description: '书生·万象 InternVL2 26B 多模态大模型，支持图像理解、OCR、图表分析等视觉任务，中英文双语能力优秀。', categories: ['vlm'], tags: { categories: '视觉理解', weight_size: '26B', quanted_type: 'BF16', max_position_embeddings: '8K' }, updatedAt: '2026-04-12T09:15:00Z' },
  { id: 1007, name: 'DeepSeek-V2-Chat-236B', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1007', status: 'uninstalled', serveStatus: 'free', description: 'DeepSeek V2 Chat 236B MoE 架构，激活参数 21B，兼顾大模型能力与推理效率，支持 128K 上下文。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '236B', quanted_type: 'BF16', max_position_embeddings: '128K' }, updatedAt: '2026-04-11T11:30:00Z' },
  { id: 1008, name: 'MiniCPM-2B-SFT', family: 'MiniCPM', type: 'llm', source: 'official', modelId: 'm1008', status: 'installed', serveStatus: 'free', description: '面壁 MiniCPM 2B 轻量级模型，适合端侧部署和低资源环境，在 2B 参数量下实现接近 7B 模型的能力水平。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '2B', quanted_type: 'BF16', max_position_embeddings: '4K' }, updatedAt: '2026-04-10T15:22:00Z' },
  { id: 1009, name: 'Yi-1.5-34B-Chat', family: 'Yi', type: 'llm', source: 'official', modelId: 'm1009', status: 'uninstalled', serveStatus: 'free', description: '零一万物 Yi-1.5 34B 对话模型，在代码、数学、推理和指令遵循方面表现优异，支持 200K 上下文窗口。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '34B', quanted_type: 'BF16', max_position_embeddings: '200K' }, updatedAt: '2026-04-09T08:45:00Z' },
  { id: 1010, name: 'BGE-M3', family: 'BAAI', type: 'embedding', source: 'official', modelId: 'm1010', status: 'installed', serveStatus: 'free', description: 'BAAI BGE-M3 多语言向量模型，支持 100+ 语言的文本嵌入，适用于语义搜索、RAG 检索等场景。', categories: ['embedding'], tags: { categories: '向量模型', weight_size: '568M', quanted_type: 'FP16', max_position_embeddings: '8K' }, updatedAt: '2026-04-08T12:10:00Z' },
  { id: 1011, name: 'Qwen2.5-Coder-32B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1011', status: 'uninstalled', serveStatus: 'free', description: '通义千问 Coder 32B 代码专用模型，在代码生成、补全、重构等任务上达到 SOTA 水平，支持 92 种编程语言。', categories: ['llm'], tags: { categories: '代码生成', weight_size: '32B', quanted_type: 'BF16', max_position_embeddings: '128K' }, updatedAt: '2026-04-07T18:30:00Z' },
  { id: 1012, name: 'GLM-4-Air', family: 'GLM', type: 'llm', source: 'official', modelId: 'm1012', status: 'installed', serveStatus: 'serving', description: '智谱 GLM-4 Air 轻量版本，在保持核心能力的同时大幅降低推理成本，适合大规模在线服务部署。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '10B', quanted_type: 'INT4', max_position_embeddings: '128K' }, updatedAt: '2026-04-06T22:15:00Z' },
  { id: 1013, name: 'Whisper-Large-V3', family: 'OpenAI', type: 'stt', source: 'official', modelId: 'm1013', status: 'uninstalled', serveStatus: 'free', description: 'OpenAI Whisper Large V3 语音识别模型，支持多语言自动语音识别和翻译。', categories: ['stt'], tags: { categories: '语音识别', weight_size: '1.5B', quanted_type: 'FP16', max_position_embeddings: '-' }, updatedAt: '2026-04-05T14:00:00Z' },
  { id: 1014, name: 'DeepSeek-R1-671B', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1014', status: 'uninstalled', serveStatus: 'free', description: 'DeepSeek R1 完整版 671B MoE 模型，在数学推理、代码生成和科学问答上达到 GPT-4 级别水平。', categories: ['llm'], tags: { categories: '深度思考', weight_size: '671B', quanted_type: 'FP8', max_position_embeddings: '128K' }, updatedAt: '2026-04-04T10:20:00Z' },
  { id: 1015, name: 'MiniMax-abab6.5', family: 'MiniMax', type: 'llm', source: 'official', modelId: 'm1015', status: 'uninstalled', serveStatus: 'free', description: 'MiniMax abab6.5 多模态模型，支持文本、语音、视觉多模态输入输出，擅长创意写作和多轮对话。', categories: ['llm'], tags: { categories: '多模态', weight_size: '100B+', quanted_type: 'BF16', max_position_embeddings: '200K' }, updatedAt: '2026-04-03T16:45:00Z' },
  { id: 1016, name: 'BGE-Reranker-V2-M3', family: 'BAAI', type: 'rerank', source: 'official', modelId: 'm1016', status: 'installed', serveStatus: 'free', description: 'BAAI BGE 重排序模型 V2 M3 版本，多语言重排序能力优秀，适用于 RAG 管道中的二次排序环节。', categories: ['rerank'], tags: { categories: '排序模型', weight_size: '568M', quanted_type: 'FP16', max_position_embeddings: '8K' }, updatedAt: '2026-04-02T09:30:00Z' },
  { id: 1017, name: 'finance-risk-private-13B', family: 'ATaaS', type: 'llm', source: 'private', modelId: 'pm1001', status: 'installed', serveStatus: 'free', description: '企业内部金融风控私有模型，已完成本地导入，可用于专有业务场景推理。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '13B', quanted_type: 'BF16', max_position_embeddings: '32K' }, updatedAt: '2026-04-01T13:15:00Z' },
  { id: 1018, name: 'customer-embedding-v2', family: 'ATaaS', type: 'embedding', source: 'private', modelId: 'pm1002', status: 'installed', serveStatus: 'free', description: '客户知识库向量化模型，支持私有语料检索和 RAG 召回优化。', categories: ['embedding'], tags: { categories: '向量模型', weight_size: '1.2B', quanted_type: 'FP16', max_position_embeddings: '8K' }, updatedAt: '2026-03-30T20:00:00Z' },
];

const deployEngineImages: DeployEngineImage[] = [
  { key: 'e1', clusterKey: 'c1', name: 'vllm-openai:v0.9.1-a100', engine: 'vLLM', version: '0.9.1', accelerator: 'A100 / H20', status: 'ready' },
  { key: 'e2', clusterKey: 'c1', name: 'sglang:v0.4.8-a100', engine: 'SGLang', version: '0.4.8', accelerator: 'A100', status: 'ready' },
  { key: 'e3', clusterKey: 'c2', name: 'sglang-router:h20-pd-cache', engine: 'SGLang', version: '0.4.8', accelerator: 'H20 / 910B', status: 'ready' },
  { key: 'e4', clusterKey: 'c2', name: 'vllm-openai:v0.8.5-h20', engine: 'vLLM', version: '0.8.5', accelerator: 'H20', status: 'ready' },
  { key: 'e5', clusterKey: 'c3', name: 'vllm-openai:v0.8.4-l20', engine: 'vLLM', version: '0.8.4', accelerator: 'L20 / A100', status: 'ready' },
  { key: 'e6', clusterKey: 'c4', name: 'mindie:2.0.RC1-910b', engine: 'MindIE', version: '2.0.RC1', accelerator: 'Ascend 910B', status: 'ready' },
  { key: 'e7', clusterKey: 'c4', name: 'sglang-ascend:0.4.8-910b', engine: 'SGLang', version: '0.4.8', accelerator: 'Ascend 910B', status: 'ready' },
];

const deployModels: DeployModelOption[] = [
  { key: 'dm1', name: 'Qwen2.5-72B-Instruct', size: '72B', format: 'BF16', scene: '通用推理' },
  { key: 'dm2', name: 'DeepSeek-R1-Distill-Qwen-32B', size: '32B', format: 'BF16', scene: '推理增强' },
  { key: 'dm3', name: 'Qwen2.5-7B-Instruct', size: '7B', format: 'BF16', scene: '低延迟问答' },
  { key: 'dm4', name: 'GLM-4.5-Air', size: '106B-A12B', format: 'BF16', scene: '长文本' },
  { key: 'dm5', name: 'bge-m3', size: '568M', format: 'FP16', scene: '向量检索' },
];

const deployNodes: DeployNodeOption[] = [
  { key: 'dn1', clusterKey: 'c1', name: 'qujing4', ip: '192.168.110.4', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn2', clusterKey: 'c1', name: 'qujing7', ip: '192.168.110.21', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn3', clusterKey: 'c1', name: 'qujing21', ip: '192.168.109.6', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn4', clusterKey: 'c1', name: 'qujing1', ip: '192.168.200.10', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn5', clusterKey: 'c1', name: 'qujing24', ip: '192.168.109.23', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn6', clusterKey: 'c1', name: 'qujing20', ip: '192.168.110.20', gpuType: 'RTX 4090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn7', clusterKey: 'c2', name: 'nj-h20-001', ip: '192.168.120.1', gpuType: 'H20', totalCards: 8, availableCards: 4, status: 'ready' },
  { key: 'dn8', clusterKey: 'c2', name: 'nj-h20-002', ip: '192.168.120.2', gpuType: 'H20', totalCards: 8, availableCards: 6, status: 'ready' },
  { key: 'dn9', clusterKey: 'c2', name: 'nj-910b-001', ip: '192.168.120.10', gpuType: 'Ascend 910B', totalCards: 8, availableCards: 2, status: 'busy' },
  { key: 'dn10', clusterKey: 'c3', name: 'gz-l20-001', ip: '192.168.130.5', gpuType: 'L20', totalCards: 4, availableCards: 4, status: 'ready' },
  { key: 'dn11', clusterKey: 'c3', name: 'gz-a100-001', ip: '192.168.130.6', gpuType: 'A100', totalCards: 8, availableCards: 6, status: 'ready' },
];

const miniTrend = [18, 22, 19, 31, 27, 36, 33, 42, 48, 44, 53, 61];

const useChart = (option: echarts.EChartsOption) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const chart = echarts.init(ref.current);
    chart.setOption(option);
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [option]);
  return ref;
};

const createLineOption = (name: string, color: string, values = miniTrend): echarts.EChartsOption => ({
  grid: { left: 0, right: 0, top: 8, bottom: 0 },
  xAxis: { type: 'category', show: false, data: values.map((_, i) => i + '') },
  yAxis: { type: 'value', show: false, min: 0 },
  series: [{ name, type: 'line', smooth: true, showSymbol: false, lineStyle: { width: 2, color }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: color + '55' }, { offset: 1, color: color + '05' }] } }, data: values }],
  tooltip: { trigger: 'axis' },
});

const MetricCard = ({ title, value, desc, tone, icon }: { title: string; value: string; desc: string; tone: string; icon: React.ReactNode }) => (
  <div className="ataas-metric-card">
    <div className={`ataas-metric-icon ataas-metric-icon-${tone}`}>{icon}</div>
    <div className="ataas-metric-title">{title}</div>
    <div className="ataas-metric-value">{value}</div>
    <div className="ataas-metric-desc">{desc}</div>
  </div>
);

const alertPopoverContent = (
  <div style={{ width: 360, maxHeight: 260, overflowY: 'auto' }}>
    {alerts.map((alert, i) => (
      <div key={i} style={{ padding: '8px 0', borderBottom: i < alerts.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', gap: 8 }}>
        <span style={{ color: '#f53f3f', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, marginTop: 2 }}>[严重]</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5, wordBreak: 'break-all' }}>{alert.title} — {alert.detail}</div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>{alert.time}</div>
        </div>
      </div>
    ))}
  </div>
);

const OverviewSummary = () => (
  <div className="ataas-overview-summary-card">
      <div className="ataas-overview-summary-item">
        <div>
          <span className="ataas-overview-label">集群数量</span>
          <div className="ataas-overview-value">4<em>个</em></div>
        </div>
        <div className="ataas-overview-split">
          <span><i className="ataas-dot-green" />授权 3</span>
          <span><i className="ataas-dot-orange" />未授权 1</span>
        </div>
      </div>
      <div className="ataas-overview-summary-item">
        <div>
          <span className="ataas-overview-label">节点数量</span>
          <div className="ataas-overview-value">119<em>台</em></div>
        </div>
        <div className="ataas-overview-split">
          <span><i className="ataas-dot-green" />正常 116</span>
          <span><i className="ataas-dot-red" />异常 3</span>
        </div>
      </div>
      <div className="ataas-overview-summary-item">
        <div>
          <span className="ataas-overview-label">GPU 总数</span>
          <div className="ataas-overview-value">512<em>片</em></div>
        </div>
        <div className="ataas-overview-split">
          <span><i className="ataas-dot-green" />已使用 226</span>
          <span><i className="ataas-dot-gray" />剩余 286</span>
        </div>
      </div>
      <div className="ataas-overview-summary-item">
        <div>
          <span className="ataas-overview-label">24 小时 Token</span>
          <div className="ataas-overview-value">10.98<em>B</em></div>
        </div>
        <div className="ataas-overview-split">
          <span><i className="ataas-dot-blue" />输入 58.5%</span>
          <span><i className="ataas-dot-green" />输出 41.5%</span>
        </div>
      </div>
      <div className="ataas-overview-summary-item">
        <div>
          <span className="ataas-overview-label">模型</span>
          <div className="ataas-overview-value">58<em>个</em></div>
        </div>
        <div className="ataas-overview-split">
          <span><i className="ataas-dot-green" />正常 52</span>
          <span><i className="ataas-dot-red" />异常 6</span>
        </div>
      </div>
      <Popover content={alertPopoverContent} title="最近严重告警" trigger="hover" placement="bottom">
        <div className="ataas-overview-summary-item" style={{ cursor: 'pointer' }} onClick={() => { document.getElementById('ataas-alerts-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div>
            <span className="ataas-overview-label">严重告警</span>
            <div className="ataas-overview-value" style={{ color: '#f53f3f' }}>{alerts.length}<em>条</em></div>
          </div>
          <div className="ataas-overview-split">
            <span><i className="ataas-dot-red" />紧急 {alertLevelSummary.critical}</span>
            <span><i className="ataas-dot-orange" />普通 {alertLevelSummary.warning}</span>
            <span><i className="ataas-dot-gray" />轻微 {alertLevelSummary.info}</span>
          </div>
        </div>
      </Popover>
    </div>
);

const getClusterFamily = (gpu: string) => {
  if (/910B|Ascend/i.test(gpu)) return 'Ascend 910B';
  if (/H20/i.test(gpu)) return 'H20';
  if (/L20/i.test(gpu)) return 'L20';
  return 'RTX 4090';
};

const getClusterHostName = (item: ClusterRecord) => {
  if (item.key === 'c1') return 'qujing4';
  if (item.key === 'c2') return 'sh-h20-worker-021';
  if (item.key === 'c3') return 'gz-l20-worker-009';
  return 'wh-910b-worker-002';
};

const gpuTypeCards: ResourceCardRecord[] = [
  { key: 'g1', name: 'A100 80G', subtitle: 'NVIDIA A100 PCIe 80GB', family: 'Ampere', nodes: 28, gpuCards: 184, models: 15, status: 'healthy', gpuUsage: 72, gpuMemoryUsage: 68, gpuMemoryText: '10.1 / 14.7 TB', diskUsage: 44.6, cpuUsage: 8.6, memoryUsage: 7.7, chips: ['A100'], metaName: 'a100-server' },
  { key: 'g2', name: 'H20 141G', subtitle: 'NVIDIA H20 141GB', family: 'Hopper', nodes: 52, gpuCards: 368, models: 24, status: 'healthy', gpuUsage: 66, gpuMemoryUsage: 61, gpuMemoryText: '31.7 / 51.9 TB', diskUsage: 52.8, cpuUsage: 21.7, memoryUsage: 34.2, chips: ['H20'], metaName: 'h20-server' },
  { key: 'g3', name: 'L20 48G', subtitle: 'NVIDIA L20 48GB', family: 'Ada Lovelace', nodes: 19, gpuCards: 96, models: 9, status: 'warning', gpuUsage: 41, gpuMemoryUsage: 38, gpuMemoryText: '1.7 / 4.6 TB', diskUsage: 31.4, cpuUsage: 13.9, memoryUsage: 22.5, chips: ['L20'], metaName: 'l20-server' },
  { key: 'g4', name: 'Ascend 910B', subtitle: '华为昇腾 910B 64GB', family: 'Ascend', nodes: 16, gpuCards: 128, models: 7, status: 'healthy', gpuUsage: 58, gpuMemoryUsage: 52, gpuMemoryText: '4.3 / 8.2 TB', diskUsage: 47.2, cpuUsage: 18.4, memoryUsage: 28.1, chips: ['910B'], metaName: '910b-server' },
];

const toClusterResourceCard = (item: ClusterRecord): ResourceCardRecord => {
  const chips = item.gpuTypes.map((gpu) => gpu.name);
  const diskUsage = item.key === 'c1' ? 44.6 : item.key === 'c2' ? 52.8 : item.key === 'c3' ? 31.4 : 47.2;
  const cpuUsage = item.key === 'c1' ? 8.6 : item.key === 'c2' ? 21.7 : item.key === 'c3' ? 13.9 : 18.4;
  const memoryUsage = item.key === 'c1' ? 7.7 : item.key === 'c2' ? 34.2 : item.key === 'c3' ? 22.5 : 28.1;
  const gpuMemoryUsage = item.key === 'c1' ? 68 : item.key === 'c2' ? 61 : item.key === 'c3' ? 38 : 52;
  const gpuMemoryText = item.key === 'c1' ? '10.1 / 14.7 TB' : item.key === 'c2' ? '31.7 / 51.9 TB' : item.key === 'c3' ? '1.7 / 4.6 TB' : '4.3 / 8.2 TB';
  return {
    key: item.key, name: item.name, subtitle: item.region, family: getClusterFamily(item.gpu),
    nodes: item.nodes, models: item.models, status: item.status, gpuUsage: item.gpuUsage,
    gpuMemoryUsage, gpuMemoryText, diskUsage, cpuUsage, memoryUsage, chips, metaName: getClusterHostName(item),
  };
};

const gpuIconMap: Record<string, string> = {
  'RTX 4090': nvidiaLogo,
  H20: nvidiaLogo,
  L20: nvidiaLogo,
  'Ascend 910B': ascendLogo,
  '910B': ascendLogo,
  A100: nvidiaLogo,
};

const GpuIcon = ({ name }: { name: string }) => {
  const src = gpuIconMap[name];
  return src ? <img src={src} alt={name} style={{ width: 24, height: 18, objectFit: 'contain', flexShrink: 0 }} /> : null;
};

const getGpuBrand = (name: string) => (/910B|950PR|Ascend/i.test(name) ? 'Ascend' : 'NVIDIA');

const ClusterGpuTypes = ({ gpus }: { gpus: ClusterRecord['gpuTypes'] }) => {
  const groups = gpus.reduce<Record<string, string[]>>((acc, gpu) => {
    const brand = getGpuBrand(gpu.name);
    acc[brand] = acc[brand] || [];
    acc[brand].push(gpu.name);
    return acc;
  }, {});
  return (
    <span className="ataas-cluster-gpu-types">
      {Object.entries(groups).map(([brand, names]) => (
        <span className="ataas-cluster-gpu-brand-row" key={brand}>
          <img src={brand === 'Ascend' ? ascendLogo : nvidiaLogo} alt={brand} />
          <strong>{Array.from(new Set(names)).join('、')}</strong>
        </span>
      ))}
    </span>
  );
};

const lerpColor = (a: string, b: string, t: number) => {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bv).toString(16).slice(1);
};

const RingMetric = ({ label, value, height = 100 }: { label: string; value: number; height?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const colorEnd = lerpColor('#5B6CFF', '#8B5CF6', value / 100);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      series: [{
        type: 'gauge',
        startAngle: 210,
        endAngle: -30,
        center: ['50%', '48%'],
        radius: '85%',
        min: 0,
        max: 100,
        axisLine: {
          show: true,
          lineStyle: {
            width: 8,
            color: [
              [value / 100, new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#4F6BFF' },
                { offset: 1, color: colorEnd },
              ])],
              [1, '#EDF0F4'],
            ],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          valueAnimation: true,
          fontSize: 17,
          fontWeight: 700,
          color: '#1D2129',
          offsetCenter: [0, '2%'],
          formatter: '{value}%',
        },
        title: {
          offsetCenter: [0, '68%'],
          fontSize: 10,
          color: '#86909C',
        },
        data: [{ value, name: label }],
      }],
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, [value, label]);
  return <div ref={ref} style={{ width: '100%', height }} />;
};

const TableUsageRing = ({ percent, sub }: { percent: number; sub?: string }) => {
  const p = Math.min(Math.max(Math.round(percent), 0), 100);
  const color = p > 80 ? '#F53F3F' : p > 60 ? '#FF7D00' : '#4C6EF5';
  const r = 12;
  const stroke = 3;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <div className="ataas-cluster-table-usage">
      <svg width={32} height={32} aria-hidden="true">
        <circle cx={16} cy={16} r={r} fill="none" stroke="#E5E6EB" strokeWidth={stroke} />
        <circle
          cx={16}
          cy={16}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
        <text x={16} y={17} textAnchor="middle" dominantBaseline="middle">{p}%</text>
      </svg>
      {sub && <span>{sub}</span>}
    </div>
  );
};

const MiniUsageRing = ({ label, percent }: { label: string; percent: number }) => {
  const p = Math.min(Math.max(Math.round(percent), 0), 100);
  const r = 15;
  const stroke = 3;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <div className="ataas-mini-usage-ring">
      <svg width={42} height={42} aria-hidden="true">
        <circle cx={21} cy={21} r={r} fill="none" stroke="#E5E6EB" strokeWidth={stroke} />
        <circle
          cx={21}
          cy={21}
          r={r}
          fill="none"
          stroke="#6738E8"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 21 21)"
        />
        <text x={21} y={22} textAnchor="middle" dominantBaseline="middle">{p}%</text>
      </svg>
      <span>{label}</span>
    </div>
  );
};

const parseUsageText = (text: string) => {
  const [usedRaw = '', totalRaw = ''] = text.split('/');
  const used = Number(usedRaw.replace(/,/g, '').replace(/[^\d.]/g, ''));
  const total = Number(totalRaw.replace(/,/g, '').replace(/[^\d.]/g, ''));
  const percent = total > 0 ? (used / total) * 100 : 0;
  return { percent, sub: text.replace(/\s*\/\s*/g, '/') };
};

const parseCapacityValue = (value: string | number) => {
  if (typeof value === 'number') return value;
  const amount = Number(value.replace(/,/g, '').match(/[\d.]+/)?.[0] || 0);
  const unit = value.toUpperCase();
  if (unit.includes('TB')) return amount * 1024;
  if (unit.includes('PB')) return amount * 1024 * 1024;
  return amount;
};

const getCapacityPercent = (used: string | number, total: string | number) => {
  const usedValue = parseCapacityValue(used);
  const totalValue = parseCapacityValue(total);
  return totalValue > 0 ? (usedValue / totalValue) * 100 : 0;
};

const ClusterCard = ({ item, compact }: { item: ResourceCardRecord; compact?: boolean }) => (
  <div className="ataas-cluster-card">
    <div className="ataas-machine-head">
      <div>
        <div className="ataas-cluster-name"><DeploymentUnitOutlined style={{ marginRight: 6 }} />{item.name}</div>
        <div className="ataas-cluster-stats">
          <span>{item.nodes} 节点</span>
          {item.gpuCards !== undefined && (
            <>
              <i />
              <span>{item.gpuCards} 卡</span>
            </>
          )}
          <i />
          <span>{item.models} 模型</span>
          {item.chips.map((c) => (
            <span key={c} className="ataas-cluster-chip"><i /><GpuIcon name={c} />{c}</span>
          ))}
        </div>
      </div>
    </div>
    <div className="ataas-machine-visual">
      <div className="ataas-server-rack">
{(() => {
          const totalNodes = item.nodes;
          const wW = 58;  // worker 宽度
          const wGap = 10; // worker 间距
          const ellipsisW = 24; // 省略号宽度
          const displayNodes = totalNodes <= 3
            ? Array.from({ length: totalNodes }, (_, i) => ({ label: `Worker-${i + 1}`, idx: i, width: wW }))
            : [
                { label: 'Worker-1', idx: 0, width: wW },
                { label: 'Worker-2', idx: 1, width: wW },
                { label: '...', idx: -1, width: ellipsisW },
                { label: `Worker-${totalNodes}`, idx: totalNodes - 1, width: wW },
              ];
          // 计算每个节点中心 x 坐标
          const positions: number[] = [];
          let curX = 14;
          displayNodes.forEach((w) => {
            positions.push(curX + w.width / 2);
            curX += w.width + wGap;
          });
          const totalW = curX - wGap + 14;
          return (
        <svg viewBox={`0 0 ${totalW} 90`} className="ataas-server-svg">
          {/* ── 连接线 ── */}
          {displayNodes.map((w, i) => {
            if (w.idx === -1) return null;
            return (
              <g key={i}>
                <line x1={totalW / 2} y1="18" x2={positions[i]} y2="42" stroke="#2d3140" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1={positions[i]} y1="60" x2={positions[i]} y2="78" stroke="#2d3140" strokeWidth="0.8" strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* ── Master 节点 ── */}
          <rect x={totalW / 2 - 30} y="4" width="60" height="16" rx="3" fill="#1a1d28" stroke="#3370FF" strokeWidth="0.8" />
          <text x={totalW / 2} y="15" textAnchor="middle" fill="#3370FF" fontSize="6" fontWeight="600">Master</text>
          <circle cx={totalW / 2 - 25} cy="12" r="1.5" className="ataas-led ataas-led-master" fill="#3370FF" />

          {/* ── Worker 节点 ── */}
          {displayNodes.map((w, i) => {
            const left = positions[i] - w.width / 2;
            if (w.idx === -1) {
              return <text key={i} x={positions[i]} y="60" textAnchor="middle" fill="#86909C" fontSize="8" fontWeight="700">...</text>;
            }
            return (
              <g key={i}>
                <rect x={left} y="42" width={w.width} height="36" rx="3" fill="#1a1d28" stroke="#2d3140" strokeWidth="0.8" />
                <rect x={left} y="42" width={w.width} height="8" rx="3" fill="#1e2235" />
                <text x={positions[i]} y="48" textAnchor="middle" fill="#86909C" fontSize="5" fontWeight="600">{w.label}</text>
                {Array.from({ length: 4 }).map((_, pi) => (
                  <rect key={pi} x={left + 4 + pi * (w.width - 8) / 4} y="54" width={(w.width - 8) / 4 - 1.5} height="8" rx="1" fill="#171923" stroke="#252836" strokeWidth="0.5" />
                ))}
                <rect x={left + 4} y="65" width={w.width - 8} height="10" rx="1.5" fill="#11131c" stroke="#1e2235" strokeWidth="0.5" />
                <text x={positions[i]} y="72" textAnchor="middle" fill="#4a5080" fontSize="5">GPU</text>
                <circle cx={left + w.width - 10} cy="46" r="1.3" className={`ataas-led ataas-led-w${i + 1}`} fill="#00e676" />
              </g>
            );
          })}

          {/* ── 高速互联 ── */}
          <line x1="10" y1="86" x2={totalW - 10} y2="86" stroke="#D0D5E0" strokeWidth="1.2" />
          {displayNodes.map((w, i) => {
            if (w.idx === -1) return null;
            return <line key={i} x1={positions[i]} y1="78" x2={positions[i]} y2="86" stroke="#C0C8D8" strokeWidth="0.7" />;
          })}
        </svg>);
        })()}
      </div>
    </div>
    <div className="ataas-machine-metrics">
      <RingMetric label="GPU 使用率" value={item.gpuUsage} height={compact ? 90 : 100} />
      <RingMetric label="CPU 使用率" value={item.cpuUsage} height={compact ? 90 : 100} />
      <RingMetric label="内存使用率" value={item.memoryUsage} height={compact ? 90 : 100} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <RingMetric label="显存使用量" value={item.gpuMemoryUsage} height={compact ? 90 : 100} />
        <span style={{ fontSize: 11, color: '#86909C', marginTop: -4, whiteSpace: 'nowrap' }}>{item.gpuMemoryText}</span>
      </div>
    </div>
  </div>
);

const ClusterAddCard = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="ataas-cluster-add-card" onClick={onClick}>
    <PlusOutlined />
  </button>
);

const BLUE = '#3370FF';
const GREEN = '#00B42A';
const BAR_COLORS = ['#3370FF', '#6690FF', '#80A3FF', '#99B4FF', '#B3C6FF', '#C2D1FF', '#D1DCFF', '#E0E8FF', '#EBF0FF', '#F5F8FF'];

const MiniMetricChart = ({ data, color, height = 160 }: { data: number[]; color: string; height?: number }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const now = new Date();
    const timeLabels = data.map((_, i) => {
      const d = new Date(now.getTime() - (data.length - 1 - i) * 60000);
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    });
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129', fontSize: 12 },
      },
      grid: { top: 24, left: 36, right: 12, bottom: 20 },
      xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { show: true, lineStyle: { color: '#1D2129' } },
        axisTick: { show: true, lineStyle: { color: '#1D2129' }, length: 4 },
        axisLabel: { fontSize: 11, color: '#86909C', margin: 6 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: '#C9CDD4' },
        splitLine: { lineStyle: { type: 'dashed', color: '#E5E6EB' } },
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicOut',
      series: [{
        type: 'line',
        data,
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 1.2, color },
        itemStyle: { color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + '20' },
            { offset: 1, color: color + '02' },
          ]),
        },
      }],
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, [data, color]);
  return <div ref={chartRef} style={{ height, width: '100%' }} />;
};

type MonitorTimePrecision = 'day' | 'hour' | 'minute';

const getMonitorAxisLabels = (precision: MonitorTimePrecision) => {
  if (precision === 'day') return ['2026-05-25', '2026-05-27', '2026-05-29', '2026-05-31'];
  if (precision === 'hour') return ['00:00', '06:00', '12:00', '18:00', '24:00'];
  return ['00:00', '05:23', '10:46', '16:09', '17:53'];
};

const getNiceMonitorAxisMax = (value: number) => {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const normalized = value / base;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * base;
};

const formatMonitorAxisValue = (value: number) => {
  if (value >= 100000000) return `${Number((value / 100000000).toFixed(1))}亿`;
  if (value >= 10000) return `${Number((value / 10000).toFixed(1))}万`;
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  if (value >= 10) return String(Math.round(value));
  if (value >= 1) return String(Number(value.toFixed(1)));
  return String(Number(value.toFixed(2)));
};

const MonitorLineChart = ({ legends, timePrecision, height = 230, max, seed = '' }: { legends: Array<{ name: string; color: string; value?: number }>; timePrecision: MonitorTimePrecision; height?: number; max?: number; seed?: string }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const labels = getMonitorAxisLabels(timePrecision);
    const seedValue = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const seriesData = legends.map((item, legendIndex) => {
      const base = item.value ?? 1;
      const isLimitLine = item.name.toLowerCase().includes('ratelimit');
      return labels.map((_, pointIndex) => {
        const wave = isLimitLine ? 1 : 0.82 + (((seedValue + legendIndex * 7 + pointIndex * 5) % 9) / 25);
        const value = base * wave;
        const cappedValue = max ? Math.min(value, max) : value;
        return Number(cappedValue.toFixed(base >= 100 ? 0 : 2));
      });
    });
    const chartMax = max ?? getNiceMonitorAxisMax(Math.max(...seriesData.flat()) * 1.2);
    chart.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#fff', borderColor: '#E5E6EB', borderWidth: 1, textStyle: { color: '#1D2129', fontSize: 12 } },
      legend: { top: 4, right: 10, itemWidth: 14, itemHeight: 3, textStyle: { color: '#86909C', fontSize: 12 }, data: legends.map((item) => item.name) },
      grid: { top: 42, left: 44, right: 18, bottom: 34 },
      xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: '#C9CDD4' } }, axisTick: { show: false }, axisLabel: { color: '#4E5969', fontSize: 11 } },
      yAxis: { type: 'value', min: 0, max: chartMax, splitNumber: 4, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#9CA3AF', fontSize: 11, formatter: formatMonitorAxisValue }, splitLine: { lineStyle: { color: '#D9DDE5' } } },
      series: legends.map((item, index) => ({ name: item.name, type: 'line', data: seriesData[index], symbol: 'circle', symbolSize: 4, smooth: false, lineStyle: { width: 1.6, color: item.color }, itemStyle: { color: item.color } })),
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, [legends, max, seed, timePrecision]);
  return <div ref={chartRef} style={{ height, width: '100%' }} />;
};

const getModelLogo = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('qwen')) return qwenLogo;
  if (lowerName.includes('kimi')) return kimiLogo;
  if (lowerName.includes('glm') || lowerName.includes('chatglm')) return glmLogo;
  if (lowerName.includes('minimax')) return minimaxLogo;
  if (lowerName.includes('minicpm')) return minicpmLogo;
  if (lowerName.includes('deepseek')) return deepseekLogo;
  return undefined;
};

const formatMonitorNumber = (value: number) => value.toLocaleString('zh-CN');

const formatMonitorTokens = (value: number) => {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return formatMonitorNumber(value);
};

const TopModelCard = ({ item, index, activeMetric }: { item: typeof overviewModelCards[0]; index: number; activeMetric: 'tpm' | 'rpm' }) => {
  return (
    <div className="ataas-model-top-card">
      <div className="ataas-model-top-head">
        <div className="ataas-model-top-name"><img src={getModelLogo(item.name)} alt="" /><strong>{item.name}</strong></div>
        <span className="ataas-model-bird">TOP {index + 1}</span>
      </div>
      <div className="ataas-model-top-stats">
        <div style={{ color: activeMetric === 'rpm' ? '#6951FF' : undefined, fontWeight: activeMetric === 'rpm' ? 600 : undefined }}><span>RPM</span><strong>{item.rpm}</strong></div>
        <div style={{ color: activeMetric === 'tpm' ? '#6951FF' : undefined, fontWeight: activeMetric === 'tpm' ? 600 : undefined }}><span>TPM</span><strong>{item.tpm}</strong></div>
        <div><span>成功率</span><strong>{item.success}</strong></div>
      </div>
      <div className="ataas-model-chart-block">
        <span>TTFT (s)</span>
        <MiniMetricChart data={item.ttft} color={BLUE} />
      </div>
      <div className="ataas-model-chart-block">
        <span>TPOT (tok/s)</span>
        <MiniMetricChart data={item.tpot} color={GREEN} />
      </div>
    </div>
  );
};

const EmptyEntry = ({ title, description }: { title: string; description: string }) => (
  <div className="ataas-empty-entry">
    <InfoCircleOutlined style={{ fontSize: 36, color: '#c9d4e0', marginBottom: 16 }} />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const LogBoardCard = ({ icon, label, detail, time, status }: { icon: React.ReactNode; label: string; detail: string; time: string; status: 'success' | 'warning' }) => (
  <div className="ataas-log-card">
    <span className={status === 'success' ? 'ataas-log-ok' : 'ataas-log-warning'}>{icon}</span>
    <div><strong>{label}</strong><span>{detail}</span></div>
    <em>{time}</em>
  </div>
);

const AtAasDesign = () => {
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes('/playground/chat')) return 'playgroundChat';
    if (window.location.pathname.includes('/benchmark')) return 'benchmark';
    return 'overview';
  });
  const [clusterViewMode, setClusterViewMode] = useState<'cluster' | 'gpu'>('cluster');
  const [callRankMode, setCallRankMode] = useState<'tpm' | 'rpm'>('tpm');
  const [clusterPanel, setClusterPanel] = useState<'clusters' | 'nodes'>('clusters');
  const [selectedClusterKey, setSelectedClusterKey] = useState('all');
  const [clusterCreateOpen, setClusterCreateOpen] = useState(false);
  const [clusterCreateName, setClusterCreateName] = useState('');
  const [clusterCreateUrl, setClusterCreateUrl] = useState('');
  const [clusterCreateAccessKey, setClusterCreateAccessKey] = useState('');
  const [clusterNodeList, setClusterNodeList] = useState<NodeRecord[]>(nodes);
  const [clusterNodeEditTarget, setClusterNodeEditTarget] = useState<NodeRecord | null>(null);
  const [clusterNodeEditName, setClusterNodeEditName] = useState('');
  const [clusterTokenOpen, setClusterTokenOpen] = useState(false);
  const [clusterTokenTarget, setClusterTokenTarget] = useState<ClusterRecord | null>(null);
  const [clusterTokenText, setClusterTokenText] = useState('');
  const [clusterDeleteConfirm, setClusterDeleteConfirm] = useState<ClusterRecord | null>(null);
  const [clusterKeyEditOpen, setClusterKeyEditOpen] = useState(false);
  const [clusterKeyEditTarget, setClusterKeyEditTarget] = useState<ClusterRecord | null>(null);
  const [clusterKeyEditValue, setClusterKeyEditValue] = useState('');
  const [clusterList, setClusterList] = useState<ClusterRecord[]>(clusters);
  const [overviewClusterSlots, setOverviewClusterSlots] = useState<Array<string | null>>([clusters[0]?.key ?? null, clusters[1]?.key ?? null, null]);
  const [overviewGpuSlots, setOverviewGpuSlots] = useState<Array<string | null>>([gpuTypeCards[0]?.key ?? null, gpuTypeCards[1]?.key ?? null, gpuTypeCards[2]?.key ?? null]);
  const [overviewClusterPickerOpen, setOverviewClusterPickerOpen] = useState(false);
  const [overviewClusterPickerSlot, setOverviewClusterPickerSlot] = useState<number | null>(null);
  const [overviewGpuPickerOpen, setOverviewGpuPickerOpen] = useState(false);
  const [overviewGpuPickerSlot, setOverviewGpuPickerSlot] = useState<number | null>(null);
  const [clusterSearchText, setClusterSearchText] = useState('');
  const [clusterNodeSearch, setClusterNodeSearch] = useState('');
  const [clusterNodeModelSearch, setClusterNodeModelSearch] = useState('');
  const filteredClusterList = useMemo(() => {
    if (!clusterSearchText) return clusterList;
    const q = clusterSearchText.toLowerCase();
    return clusterList.filter((c) => c.name.toLowerCase().includes(q));
  }, [clusterList, clusterSearchText]);
  const [logSearchText, setLogSearchText] = useState('');
  const [logSearchField, setLogSearchField] = useState('all');
  const [logDateRange, setLogDateRange] = useState<[string, string] | null>(null);
  const [logDetailRecord, setLogDetailRecord] = useState<typeof logData[0] | null>(null);
  const [monitorSearchText, setMonitorSearchText] = useState('');
  const [monitorExactServiceName, setMonitorExactServiceName] = useState('');
  const [monitorClusterFilter, setMonitorClusterFilter] = useState('');
  const [monitorScope, setMonitorScope] = useState('all');
  const [monitorApp, setMonitorApp] = useState('all');
  const [monitorReportRow, setMonitorReportRow] = useState<typeof monitorRows[0] | null>(null);
  const [monitorRefreshMode, setMonitorRefreshMode] = useState('手动刷新');
  const [monitorTimePrecision, setMonitorTimePrecision] = useState<MonitorTimePrecision>('minute');
  const [alertDateRange, setAlertDateRange] = useState<[string, string] | null>(null);
  const [alertClusterFilter, setAlertClusterFilter] = useState<string | null>(null);
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
  const [alertSearchText, setAlertSearchText] = useState<string>('');
  const logData: Array<{ user: string; action: string; object: string; objectType: string; cluster: string; status: string; time: string; detail: string }> = [
    { user: 'admin', action: '创建服务', object: 'deepseek-prod', objectType: '模型服务', cluster: 'beijing-a100-prod', status: '成功', time: '2026-05-29 14:35', detail: '部署模式: PD 分离, 引擎: SGLang, GPU: H20 x 4, 实例: 2' },
    { user: 'ops-lilei', action: '上传镜像', object: 'sglang:v0.4.8-h20', objectType: '引擎镜像', cluster: '-', status: '成功', time: '2026-05-29 14:18', detail: '镜像大小: 21.3 GB, 标签: h20-pd-cache, 来源: 在线拉取' },
    { user: 'zhaomin', action: '调整参数', object: 'qwen3-coding-slo', objectType: '模型服务', cluster: 'shanghai-h20-online', status: '成功', time: '2026-05-29 13:57', detail: 'TTFT 阈值: 500ms → 300ms, TPOT 阈值: 50ms → 30ms' },
    { user: 'admin', action: '修改标签', object: 'gpu-worker-021', objectType: '节点', cluster: 'shanghai-h20-online', status: '成功', time: '2026-05-29 13:42', detail: '标签变更: GPU=H20 → GPU=H20_PD, 节点: sh-h20-worker-021' },
    { user: 'system', action: '节点隔离', object: 'worker-a100-017', objectType: '节点', cluster: 'beijing-a100-prod', status: '失败', time: '2026-05-29 13:20', detail: '原因: GPU 温度过高(89°C), 自动隔离, 影响服务: deepseek-prod' },
    { user: 'admin', action: '部署模型', object: 'glm-air-batch', objectType: '模型服务', cluster: 'guangzhou-l20-test', status: '成功', time: '2026-05-29 12:58', detail: '模型: GLM-4.5-Air, 引擎: vLLM, 集群: guangzhou-l20-test, 实例: 2' },
    { user: 'ops-wang', action: '集群扩容', object: 'guangzhou-test', objectType: '集群', cluster: 'guangzhou-l20-test', status: '成功', time: '2026-05-29 12:15', detail: '新增节点: 4 台, GPU: L20 x 16, 扩容后总量: 19 台 / 72 卡' },
    { user: 'zhaomin', action: '更新配置', object: 'vLLM 0.9.1', objectType: '引擎镜像', cluster: '-', status: '成功', time: '2026-05-29 11:42', detail: '配置参数: max_model_len=8192, gpu_memory_utilization=0.9' },
    { user: 'admin', action: '删除镜像', object: 'triton:23.12-py3', objectType: '引擎镜像', cluster: '-', status: '成功', time: '2026-05-29 11:08', detail: '镜像标签: triton:23.12-py3, 大小: 12.4 GB, 已清理存储' },
    { user: 'system', action: '节点恢复', object: 'gz-l20-worker-005', objectType: '节点', cluster: 'guangzhou-l20-test', status: '成功', time: '2026-05-29 10:35', detail: '节点离线后自动恢复, 当前状态: 正常, 运行服务: 3 个' },
    { user: 'ops-lilei', action: '创建命名空间', object: 'ns-aimon-002', objectType: '命名空间', cluster: '-', status: '成功', time: '2026-05-29 09:54', detail: '命名空间: ns-aimon-002, 配额: CPU 32核, 内存 128GB, GPU 8卡' },
    { user: 'admin', action: '绑定配额', object: 'aimon-team', objectType: '配额', cluster: '-', status: '成功', time: '2026-05-29 09:12', detail: '团队: aimon-team, GPU 配额: 32 卡, 有效期: 永久' },
  ];
  const filteredLogs = useMemo(() => {
    let list = logData;
    if (logDateRange) {
      list = list.filter((item) => item.time >= logDateRange[0] && item.time <= logDateRange[1]);
    }
    if (logSearchText) {
      const keyword = logSearchText.toLowerCase();
      list = list.filter((item) => {
        if (logSearchField === 'all') return item.user.toLowerCase().includes(keyword) || item.action.toLowerCase().includes(keyword) || item.object.toLowerCase().includes(keyword) || item.status.includes(keyword);
        if (logSearchField === 'user') return item.user.toLowerCase().includes(keyword);
        if (logSearchField === 'action') return item.action.toLowerCase().includes(keyword);
        if (logSearchField === 'object') return item.object.toLowerCase().includes(keyword);
        if (logSearchField === 'status') return item.status.includes(keyword);
        return true;
      });
    }
    return list;
  }, [logSearchText, logSearchField, logDateRange]);
  const filteredAlerts = useMemo(() => {
    let list = alertList;
    if (alertDateRange) {
      list = list.filter((item) => item.time >= alertDateRange[0] && item.time <= alertDateRange[1]);
    }
    if (alertClusterFilter) {
      list = list.filter((item) => item.cluster === alertClusterFilter);
    }
    if (alertLevelFilter !== 'all') {
      list = list.filter((item) => item.level === alertLevelFilter);
    }
    if (alertSearchText) {
      const kw = alertSearchText.toLowerCase();
      list = list.filter((item) => item.target.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw) || item.cluster.toLowerCase().includes(kw));
    }
    return list;
  }, [alertDateRange, alertClusterFilter, alertLevelFilter, alertSearchText]);
  const [imageVendorFilter, setImageVendorFilter] = useState<string>('all');
  const [imageEngineFilter, setImageEngineFilter] = useState<string>('all');
  const filteredImages = useMemo(() => {
    let list = images;
    if (imageVendorFilter !== 'all') {
      list = list.filter((item) => {
        if (imageVendorFilter === 'NVIDIA') return item.vendor === 'NVIDIA';
        if (imageVendorFilter === 'Ascend') return item.vendor === 'Ascend';
        return true;
      });
    }
    if (imageEngineFilter !== 'all') {
      list = list.filter((item) => item.engine === imageEngineFilter);
    }
    return list;
  }, [imageVendorFilter, imageEngineFilter]);
  const [selectedModelKey, setSelectedModelKey] = useState('m1');
  const [modelRepoSearch, setModelRepoSearch] = useState('');
  const [modelRepoCategory, setModelRepoCategory] = useState('all');
  const [modelRepoFamily, setModelRepoFamily] = useState('all');
  const [modelRepoSource, setModelRepoSource] = useState<'all' | 'official' | 'private'>('all');
  const [modelRepoDetail, setModelRepoDetail] = useState<ModelRepoRecord | null>(null);
  const [modelRepoImportOpen, setModelRepoImportOpen] = useState(false);
  const [modelRepoTaskOpen, setModelRepoTaskOpen] = useState(false);
  const filteredModelRepoData = useMemo(() => {
    const keyword = modelRepoSearch.trim().toLowerCase();
    return modelRepoData.filter((item) => {
      if (modelRepoSource !== 'all' && item.source !== modelRepoSource) return false;
      if (modelRepoCategory !== 'all' && item.tags.categories !== modelRepoCategory) return false;
      if (modelRepoFamily !== 'all' && item.family !== modelRepoFamily) return false;
      if (!keyword) return true;
      return item.name.toLowerCase().includes(keyword) || item.family.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword);
    });
  }, [modelRepoSearch, modelRepoCategory, modelRepoFamily, modelRepoSource]);
  const [deployListViewMode, setDeployListViewMode] = useState<ViewMode>('card');
  const [deployListClusterFilter, setDeployListClusterFilter] = useState('');
  const [deployMode, setDeployMode] = useState<string>('single');
  const [startupTemplateForm] = Form.useForm();
  const [startupTemplates, setStartupTemplates] = useState<StartupTemplateRecord[]>(startupTemplateSeed);
  const [startupTemplateSearch, setStartupTemplateSearch] = useState('');
  const [startupTemplateCreateOpen, setStartupTemplateCreateOpen] = useState(false);
  const [startupTemplateEditing, setStartupTemplateEditing] = useState<StartupTemplateRecord | null>(null);
  const [templateGpuType, setTemplateGpuType] = useState<string[]>([]);
  const [templateYamlContent, setTemplateYamlContent] = useState('');
  const [templateDeployMode, setTemplateDeployMode] = useState('');
  const [scheduleTargetType, setScheduleTargetType] = useState<'serviceGroup' | 'modelService'>('serviceGroup');
  const [scheduleTaskType, setScheduleTaskType] = useState<'startStop' | 'pdScale'>('startStop');
  const [scheduleTargetKey, setScheduleTargetKey] = useState(scheduledServiceGroups[0]?.key ?? '');
  const [scheduleTemplateKey, setScheduleTemplateKey] = useState(startupTemplateSeed[0]?.key ?? '');
  const [scheduleServiceTemplateOverrides, setScheduleServiceTemplateOverrides] = useState<Record<string, string>>({});
  const [scheduleClusterKey, setScheduleClusterKey] = useState<string | undefined>(clusters[0]?.key);
  const [scheduleNodeKeys, setScheduleNodeKeys] = useState<string[]>([]);
  const [scheduleFeishuWebhook, setScheduleFeishuWebhook] = useState('');
  const [scheduleAlertEnabled, setScheduleAlertEnabled] = useState(true);
  const [scheduleScaleTime, setScheduleScaleTime] = useState('2026-06-01 12:00');
  const [scheduleScaleDaily, setScheduleScaleDaily] = useState(false);
  const [scheduleStartStopTime, setScheduleStartStopTime] = useState('2026-06-01 09:00');
  const [selectedDeployNodes, setSelectedDeployNodes] = useState<string[]>([]);
  const [deployMachineCount, setDeployMachineCount] = useState(4);
  const [imageDrawerOpen, setImageDrawerOpen] = useState(false);
  const [imageDrawerRecord, setImageDrawerRecord] = useState<ImageRecord | null>(null);
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [deployDrawerOpen, setDeployDrawerOpen] = useState(false);
  const [deployServices, setDeployServices] = useState<DeployServiceItem[]>(MOCK_DEPLOY_DATA);
  const [scheduleDetailTarget, setScheduleDetailTarget] = useState<DeployServiceItem | null>(null);
  const [deployDetailItem, setDeployDetailItem] = useState<DeployServiceItem | null>(null);
  const handleDeployDetail = (item: DeployServiceItem) => {
    setDeployDetailItem(item);
  };
  const handleDeployMonitor = (item: DeployServiceItem) => {
    setMonitorSearchText(item.name);
    setMonitorExactServiceName(item.name);
    setMonitorClusterFilter('');
    setMonitorReportRow(null);
    setActiveTab('monitoring');
  };
  const handleDeployStop = (item: DeployServiceItem) => {
    Modal.confirm({
      title: '确认停止',
      content: '确定要停止服务 ' + item.name + ' 吗？',
      onOk: () => {
        setDeployServices((prev) => prev.map((s) => s.id === item.id ? { ...s, status: 'ready' as const, timeStr: '未部署' } : s));
        message.success('已停止');
      },
    });
  };
  const handleDeployExperience = (item: DeployServiceItem) => {
    message.info('体验功能: ' + item.name);
  };
  const handleDeployLog = (item: DeployServiceItem, logId: number) => {
    message.info('查看日志: ' + item.name + ' - ' + (item.modelInfo.logs.find((l) => l.id === logId)?.name || ''));
  };
  const handleRestartToggle = (item: DeployServiceItem) => {
    setDeployServices((prev) => prev.map((s) => s.id === item.id ? { ...s, modelInfo: { ...s.modelInfo, restartStatus: !s.modelInfo.restartStatus } } : s));
  };
  const handleConcurrencyToggle = (item: DeployServiceItem) => {
    setDeployServices((prev) => prev.map((s) => s.id === item.id ? { ...s, modelInfo: { ...s.modelInfo, concurrencyControllStatus: !s.modelInfo.concurrencyControllStatus } } : s));
  };
  const [scalePdOpen, setScalePdOpen] = useState(false);
  const [scalePdTarget, setScalePdTarget] = useState<DeployServiceItem | null>(null);
  const [scalePdRouterParamMode, setScalePdRouterParamMode] = useState<'template' | 'manual'>('template');
  const [scalePdPrefillParamMode, setScalePdPrefillParamMode] = useState<'template' | 'manual'>('template');

  const [scalePdRouterCount, setScalePdRouterCount] = useState(1);
  const [scalePdRouterNodes, setScalePdRouterNodes] = useState<string[]>([]);
  const [scalePdRouterParams, setScalePdRouterParams] = useState<Array<{key: string; value: string}>>([]);
  const [scalePdPrefillCount, setScalePdPrefillCount] = useState(1);
  const [scalePdPrefillNodes, setScalePdPrefillNodes] = useState<string[]>([]);
  const [scalePdPrefillParams, setScalePdPrefillParams] = useState<Array<{key: string; value: string}>>([]);
  const [scalePdDecodeCount, setScalePdDecodeCount] = useState(1);
  const [scalePdDecodeNodes, setScalePdDecodeNodes] = useState<string[]>([]);
  const [scalePdDecodeParams, setScalePdDecodeParams] = useState<Array<{key: string; value: string}>>([]);
  const [scaleNodePickerOpen, setScaleNodePickerOpen] = useState(false);
  const [scaleNodePickerMode, setScaleNodePickerMode] = useState<'router' | 'prefill' | 'decode'>('router');
  const [scaleNodePickerSelected, setScaleNodePickerSelected] = useState<string[]>([]);
  const [scalePdRouterUploadedYaml, setScalePdRouterUploadedYaml] = useState<string>('');
  const [scalePdPrefillUploadedYaml, setScalePdPrefillUploadedYaml] = useState<string>('');

  const pdRouterFileInputRef = useRef<HTMLInputElement>(null);
  const pdPrefillFileInputRef = useRef<HTMLInputElement>(null);

  const scalePdRouterFileInputRef = useRef<HTMLInputElement>(null);
  const scalePdPrefillFileInputRef = useRef<HTMLInputElement>(null);

  const handleScalePd = (item: DeployServiceItem) => {
    setScalePdTarget(item);
    setScalePdRouterCount(1);
    setScalePdRouterNodes([]);
    setScalePdPrefillCount(1);
    setScalePdPrefillNodes([]);
    setScalePdPrefillParams([]);
    setScalePdDecodeCount(1);
    setScalePdDecodeNodes([]);
    setScalePdDecodeParams([]);
    setScalePdRouterUploadedYaml('');
    setScalePdPrefillUploadedYaml('');

    setScalePdOpen(true);
  };
  const handleCreateSchedule = (item: DeployServiceItem) => {
    const serviceText = `${item.name} ${item.typeStr} ${item.modelInfo.name}`.toLowerCase();
    const family = serviceText.includes('glm') ? 'GLM' : serviceText.includes('qwen') ? 'Qwen' : serviceText.includes('kimi') ? 'Kimi' : 'DeepSeek';
    setScheduleTargetType('modelService');
    setScheduleTaskType('startStop');
    setScheduleTargetKey(String(item.id));
    setScheduleTemplateKey(startupTemplates.find((template) => template.modelFamily === family)?.key ?? startupTemplates[0]?.key ?? '');
    setScheduleServiceTemplateOverrides({});
    setDeployDrawerOpen(true);
  };
  const handleScheduleDetail = (item: DeployServiceItem) => {
    if (!item.scheduleCountdownAt && !item.scheduleCountdown) return;
    setScheduleDetailTarget(item);
  };
  const buildScheduledDeployService = (serviceName: string, index: number, template?: StartupTemplateRecord): DeployServiceItem => {
    const family = template?.modelFamily || (serviceName.toLowerCase().includes('glm') ? 'GLM' : serviceName.toLowerCase().includes('qwen') ? 'Qwen' : 'DeepSeek');
    const scheduleCountdownAt = scheduleTaskType === 'pdScale' ? scheduleScaleTime : scheduleStartStopTime;
    const scheduleCountdownAction = scheduleTaskType === 'pdScale' ? '扩缩' : '启动';
    const existing = deployServices.find((service) => service.name === serviceName);
    const scheduleGroup = scheduleTargetType === 'serviceGroup' ? scheduledServiceGroups.find((group) => group.key === scheduleTargetKey) : undefined;
    if (existing) return {
      ...existing,
      scheduleCountdown: undefined,
      scheduleCountdownAt,
      scheduleCountdownAction,
      scheduleRepeatDaily: scheduleTaskType === 'pdScale' ? scheduleScaleDaily : false,
      scheduleAlertWebhook: scheduleAlertEnabled ? scheduleFeishuWebhook : '',
      serviceGroupKey: scheduleGroup?.key ?? existing.serviceGroupKey,
      serviceGroupName: scheduleGroup?.name ?? existing.serviceGroupName,
    };
    return {
      id: Date.now() + index,
      name: serviceName,
      logo: getModelLogo(serviceName) || deepseekLogo,
      status: 'running',
      category: 'llm',
      typeStr: `${family} 定时服务`,
      timeStr: '定时任务',
      updateTime: '2026-05-31 18:40',
      deployMode: template?.deployMode === 'PD 分离' || template?.deployMode === '分布式部署' || template?.deployMode === '单机部署' ? template.deployMode : '单机部署',
      scheduleCountdownAt,
      scheduleCountdownAction,
      scheduleRepeatDaily: scheduleTaskType === 'pdScale' ? scheduleScaleDaily : false,
      scheduleAlertWebhook: scheduleAlertEnabled ? scheduleFeishuWebhook : '',
      serviceGroupKey: scheduleGroup?.key,
      serviceGroupName: scheduleGroup?.name,
      modelInfo: {
        name: `${family} Scheduled`,
        supplier: family,
        number: template?.nodeCount || 1,
        works: scheduleNodeKeys.map((key) => deployNodes.find((node) => node.key === key)?.name).filter(Boolean).join(', ') || '-',
        size: '-',
        tokens: '-',
        point: 'BF16',
        memory: '-',
        disk: '-',
        vram: template ? `${template.cardCount} 卡` : '-',
        contextLength: '-',
        attentionHeads: '-',
        layers: '-',
        engine: template?.engine || '-',
        engineVersion: '-',
        restartStatus: true,
        restartNumber: 0,
        restartCount: 0,
        restartPage: [],
        concurrencyControllStatus: true,
        concurrencyControllCount: 100,
        logs: [],
        updateTime: '2026-05-31',
      },
    };
  };
  const handleCreateScheduleDeployTask = () => {
    const rows = scheduleTargetType === 'serviceGroup'
      ? scheduleServiceTemplateRows.map((row) => ({ serviceName: row.serviceName, template: row.template }))
      : (() => {
        const service = deployServices.find((item) => String(item.id) === scheduleTargetKey);
        return service ? [{ serviceName: service.name, template: selectedScheduleTemplate }] : [];
      })();
    const scheduledServices = rows.map((row, index) => buildScheduledDeployService(row.serviceName, index, row.template));
    setDeployServices((prev) => {
      const scheduledNames = new Set(scheduledServices.map((service) => service.name));
      return [...scheduledServices, ...prev.filter((service) => !scheduledNames.has(service.name))];
    });
    setDeployListViewMode('card');
    setActiveTab('deploy');
    message.success('定时任务已创建');
    setPdGatewayPort('');
    setDeployDrawerOpen(false);
  };
  const handleOpenCreate = () => {
    resetDeployForm();
    setDeployDrawerOpen(true);
  };
  const [clusterNodeModal, setClusterNodeModal] = useState(false);
  const [clusterNodeModalTitle, setClusterNodeModalTitle] = useState('');
  const [clusterNodeRecord, setClusterNodeRecord] = useState<NodeRecord | null>(null);
  const [singleNodeModal, setSingleNodeModal] = useState(false);
  const [singleNodeSearch, setSingleNodeSearch] = useState('');
  const [singleNodeGpuFilter, setSingleNodeGpuFilter] = useState<string>('all');
  const [selectedSingleNode, setSelectedSingleNode] = useState<string | null>(null);
  const [launchConfigMode, setLaunchConfigMode] = useState<'template' | 'manual'>('template');
  const [selectedStartupTemplateKey, setSelectedStartupTemplateKey] = useState(startupTemplateSeed[0]?.key ?? '');
  const [launchCommand, setLaunchCommand] = useState(startupTemplateSeed[0]?.command ?? '');
  const [launchTopology, setLaunchTopology] = useState(startupTemplateSeed[0]?.topology ?? '');
  const [deployParams, setDeployParams] = useState<Array<{ key: string; value: string }>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
    { key: 'tensor_parallel_size', value: '8' },
    { key: 'pipeline_parallel_size', value: '1' },
  ]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [singleCardCount, setSingleCardCount] = useState<number>(0);
  const [deployServiceName, setDeployServiceName] = useState('');
  const [deployDescription, setDeployDescription] = useState('');
  const [deployCluster, setDeployCluster] = useState<string | undefined>(undefined);
  const [deployEngine, setDeployEngine] = useState<string | undefined>(undefined);
  const [deployModel, setDeployModel] = useState<string | undefined>(undefined);
  const [pdRouterParamMode, setPdRouterParamMode] = useState<'template' | 'manual'>('template');
  const [pdPrefillParamMode, setPdPrefillParamMode] = useState<'template' | 'manual'>('template');

  const [pdRouterCount, setPdRouterCount] = useState(1);
  const [pdRouterNodes, setPdRouterNodes] = useState<string[]>([]);
  const [pdRouterTemplateKey, setPdRouterTemplateKey] = useState<string>('');
  const [pdRouterParams, setPdRouterParams] = useState<Array<{key: string; value: string}>>([]);

  const [pdPrefillCount, setPdPrefillCount] = useState(1);
  const [pdPrefillNodes, setPdPrefillNodes] = useState<string[]>([]);
  const [pdPrefillTemplateKey, setPdPrefillTemplateKey] = useState<string>('');
  const [pdPrefillParams, setPdPrefillParams] = useState<Array<{key: string; value: string}>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
  ]);

  const [pdDecodeCount, setPdDecodeCount] = useState(1);
  const [pdGatewayPort, setPdGatewayPort] = useState<string>('');
  const [pdDecodeNodes, setPdDecodeNodes] = useState<string[]>([]);
  const [pdDecodeParams, setPdDecodeParams] = useState<Array<{key: string; value: string}>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
  ]);

  const [pdNodePickerOpen, setPdNodePickerOpen] = useState(false);
  const [pdNodePickerMode, setPdNodePickerMode] = useState<'router' | 'prefill' | 'decode'>('router');
  const [pdNodePickerSelected, setPdNodePickerSelected] = useState<string[]>([]);
  const [pdRouterUploadedYaml, setPdRouterUploadedYaml] = useState<string>('');
  const [pdPrefillUploadedYaml, setPdPrefillUploadedYaml] = useState<string>('');

  const applyStartupTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) return;
    const nextParams = template.params?.map((param) => ({ ...param })) || [];
    setSelectedStartupTemplateKey(template.key);
    setLaunchConfigMode('template');
    setLaunchCommand(template.command);
    setLaunchTopology(template.topology);
    setDeployParams(nextParams);
  };
  const applyPdRouterTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setPdRouterTemplateKey(''); return; }
    setPdRouterTemplateKey(template.key);
  };
  const applyPdPrefillTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setPdPrefillTemplateKey(''); return; }
    setPdPrefillTemplateKey(template.key);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    setPdPrefillParams(nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }]);
  };
  const resetDeployForm = () => {
    setDeployServiceName('');
    setDeployDescription('');
    setDeployCluster(undefined);
    setDeployEngine(undefined);
    setDeployModel(undefined);
    setScheduleTargetType('serviceGroup');
    setScheduleTaskType('startStop');
    setScheduleTargetKey(scheduledServiceGroups[0]?.key ?? '');
    setScheduleTemplateKey(startupTemplateSeed[0]?.key ?? '');
    setScheduleServiceTemplateOverrides({});
    setScheduleClusterKey(clusters[0]?.key);
    setScheduleNodeKeys([]);
    setScheduleFeishuWebhook('');
    setScheduleAlertEnabled(true);
    setScheduleScaleTime('2026-06-01 12:00');
    setScheduleScaleDaily(false);
    setScheduleStartStopTime('2026-06-01 09:00');
    setDeployMode('single');
    setSelectedSingleNode(null);
    setSingleCardCount(0);
    setSelectedDeployNodes([]);
    setLaunchConfigMode('template');
    setSelectedStartupTemplateKey(startupTemplateSeed[0]?.key ?? '');
    setLaunchCommand(startupTemplateSeed[0]?.command ?? '');
    setLaunchTopology(startupTemplateSeed[0]?.topology ?? '');
    setDeployMachineCount(4);
    setDeployParams((startupTemplateSeed[0]?.params ?? [
      { key: 'max_model_len', value: '8192' },
      { key: 'gpu_memory_utilization', value: '0.9' },
      { key: 'tensor_parallel_size', value: '8' },
      { key: 'pipeline_parallel_size', value: '1' },
    ]).map((param) => ({ ...param })));
    setExpandedSections({});
    setPdRouterCount(1);
    setPdRouterNodes([]);
    setPdRouterTemplateKey('');
    setPdPrefillCount(1);
    setPdPrefillNodes([]);
    setPdPrefillTemplateKey('');
    setPdPrefillParams([]);
    setPdDecodeCount(1);
    setPdDecodeNodes([]);
    setPdDecodeParams([]);
    setPdRouterUploadedYaml('');
    setPdPrefillUploadedYaml('');

    setPdGatewayPort('');
    setDeployDrawerOpen(false);
  };

  const readyNodeCount = useMemo(() => {
    if (!deployCluster) return 0;
    return deployNodes.filter((n) => n.clusterKey === deployCluster && n.status === 'ready').length;
  }, [deployCluster]);


  // 进入部署步骤时自动选择默认值
  useEffect(() => {
    const ready = deployNodes.find((n) => n.status === 'ready');
    if (Boolean(deployCluster && deployEngine && deployModel) && deployMode === 'single' && !selectedSingleNode) {
        if (ready) {
          setSelectedSingleNode(ready.key);
          setSingleCardCount(1);
        }
      }
  }, [deployCluster, deployEngine, deployModel, deployMode]);

  // 分布式部署自动选择默认节点和卡数
  useEffect(() => {
    if (Boolean(deployCluster && deployEngine && deployModel) && deployMode === 'distributed' && selectedDeployNodes.length === 0) {
      const readyList = deployNodes.filter((n) => n.status === 'ready');
      if (readyList.length > 0) {
        const count = Math.min(deployMachineCount, readyList.length);
        const selected = readyList.slice(0, count).map((n) => n.key);
        setSelectedDeployNodes(selected);
        const minCards = Math.min(...selected.map((k) => deployNodes.find((d) => d.key === k)?.availableCards ?? 0));
        if (minCards >= 8) setSingleCardCount(8);
        else if (minCards >= 4) setSingleCardCount(4);
        else if (minCards >= 2) setSingleCardCount(2);
        else if (minCards > 0) setSingleCardCount(minCards);
      }
    }
  }, [deployCluster, deployEngine, deployModel, deployMode]);

  // 机器数量变化→增加/删除节点，同时更新卡数
  useEffect(() => {
    if (Boolean(deployCluster && deployEngine && deployModel) && deployMode === 'distributed' && deployMachineCount > 0) {
      setSelectedDeployNodes((prev) => {
        const readyList = deployNodes.filter((n) => n.status === 'ready');
        if (deployMachineCount > prev.length) {
          const existingKeys = new Set(prev);
          const available = readyList.filter((n) => !existingKeys.has(n.key));
          const toAdd = available.slice(0, deployMachineCount - prev.length);
          return [...prev, ...toAdd.map((n) => n.key)];
        } else if (deployMachineCount < prev.length) {
          return prev.slice(0, deployMachineCount);
        }
        return prev;
      });
    }
  }, [deployCluster, deployEngine, deployModel, deployMachineCount, deployMode]);

  // 节点变化时默认选8卡（不足则取最小可用卡数）
  useEffect(() => {
    if (deployMode === 'distributed' && selectedDeployNodes.length > 0) {
      const minCards = Math.min(...selectedDeployNodes.map((k) => deployNodes.find((d) => d.key === k)?.availableCards ?? 0));
      if (minCards >= 8) setSingleCardCount(8);
      else if (minCards >= 4) setSingleCardCount(4);
      else if (minCards >= 2) setSingleCardCount(2);
      else if (minCards >= 1) setSingleCardCount(minCards);
    } else if (deployMode === 'distributed' && selectedDeployNodes.length === 0) {
      setSingleCardCount(0);
    }
  }, [selectedDeployNodes.length, deployMode]);

  // 节点增删→机器数量同步
  useEffect(() => {
    if (deployMode === 'distributed' && selectedDeployNodes.length > 0) {
      setDeployMachineCount(selectedDeployNodes.length);
    }
  }, [selectedDeployNodes.length, deployMode]);

  // TP/PP 自动同步
  useEffect(() => {
    setDeployParams((prev) => prev.map((p) => {
      if (p.key === 'tensor_parallel_size') return { ...p, value: String(singleCardCount || 1) };
      if (p.key === 'pipeline_parallel_size') return { ...p, value: String(deployMachineCount) };
      return p;
    }));
  }, [singleCardCount, deployMachineCount]);




  const toggleDeployNode = (key: string) => {
    setSelectedDeployNodes((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const renderCardCountStepper = (maxCards: number) => {
    const cardOptions = [1, 2, 4, 8].filter((value) => value <= maxCards);
    const current = singleCardCount || cardOptions[0] || 0;
    const currentIndex = cardOptions.indexOf(current);
    const canDecrease = currentIndex > 0;
    const canIncrease = currentIndex >= 0 && currentIndex < cardOptions.length - 1;

    return (
      <div className="ataas-card-count-stepper">
        <Button size="small" disabled={!canDecrease} onClick={() => canDecrease && setSingleCardCount(cardOptions[currentIndex - 1])}>-</Button>
        <div className="ataas-card-count-value">{current ? `${current} 卡` : '-'}</div>
        <Button size="small" disabled={!canIncrease} onClick={() => canIncrease && setSingleCardCount(cardOptions[currentIndex + 1])}>+</Button>
      </div>
    );
  };

  const getDeployParamsShellText = () => deployParams
    .filter((param) => param.key.trim())
    .map((param) => `--${param.key.trim().replace(/^--/, '')}${param.value.trim() ? ` ${param.value.trim()}` : ''}`)
    .join('\n');

  const updateDeployParamsFromShell = (value: string) => {
    const next = value.split('\n').map((line) => {
      const text = line.trim();
      if (!text) return null;
      const normalized = text.startsWith('--') ? text.slice(2) : text;
      const [key, ...rest] = normalized.split(/\s+/);
      return key ? { key, value: rest.join(' ') } : null;
    }).filter((item): item is { key: string; value: string } => Boolean(item));
    setDeployParams(next);
  };

  const renderAdvancedParamsShell = () => {
    const shellText = getDeployParamsShellText();
    const lines = shellText ? shellText.split('\n') : ['--max-model-len 32768'];
    return (
      <div className="ataas-advanced-shell">
        <Input.TextArea
          className="ataas-advanced-shell-input"
          rows={6}
          value={shellText}
          placeholder={'--max-model-len 32768\n--gpu-memory-utilization 0.9'}
          onChange={(e) => updateDeployParamsFromShell(e.target.value)}
        />
        <div className="ataas-advanced-shell-preview">
          {lines.map((line, index) => {
            const normalized = line.trim().startsWith('--') ? line.trim() : `--${line.trim()}`;
            const match = normalized.match(/^(--\S+)(?:\s+(.+))?$/);
            return (
              <div key={`${line}-${index}`}>
                <span className="param-name">{match?.[1] || normalized}</span>
                {match?.[2] && <span className="param-value"> {match[2]}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const filteredStartupTemplates = useMemo(() => {
    const keyword = startupTemplateSearch.trim().toLowerCase();
    if (!keyword) return startupTemplates;
    return startupTemplates.filter((item) =>
      (item.name || '').toLowerCase().includes(keyword) ||
      (item.engine || '').toLowerCase().includes(keyword) ||
      (item.modelFamily || '').toLowerCase().includes(keyword) ||
      (item.description || '').toLowerCase().includes(keyword),
    );
  }, [startupTemplates, startupTemplateSearch]);

  const resetStartupTemplateCreate = () => {
    startupTemplateForm.resetFields();
    setStartupTemplateEditing(null);
    setStartupTemplateCreateOpen(false);
    setTemplateGpuType([]);
    setTemplateYamlContent('');
    setTemplateDeployMode('');
  };

  const openStartupTemplateEditor = (template: StartupTemplateRecord) => {
    setStartupTemplateEditing(template);
    startupTemplateForm.setFieldsValue({ name: template.name, description: template.description || '' });
    setTemplateGpuType(template.hardware ? template.hardware.split(', ') : []);
    setTemplateYamlContent(template.yamlContent || '');
    setTemplateDeployMode(template.deployMode || '');
    setStartupTemplateCreateOpen(true);
  };

  // Template creation now handled inline in the drawer form

  const scheduleTargetOptions = useMemo(() => {
    if (scheduleTargetType === 'serviceGroup') {
      return scheduledServiceGroups.map((group) => ({
        value: group.key,
        label: `${group.name} / ${group.services.length} 服务`,
      }));
    }
    return deployServices.filter((service) => scheduleTaskType !== 'pdScale' || service.deployMode === 'PD 分离').map((service) => ({
      value: String(service.id),
      label: `${service.name} / ${service.typeStr}`,
    }));
  }, [deployServices, scheduleTargetType, scheduleTaskType]);

  const selectedScheduleTemplate = startupTemplates.find((template) => template.key === scheduleTemplateKey);
  const scheduleTemplateOptions = useMemo(() => (
    startupTemplates
      .filter((template) => scheduleTaskType !== 'pdScale' || template.deployMode === 'PD 分离')
      .map((template) => ({
        value: template.key,
        label: `${template.name}${template.engine ? ' / ' + template.engine : ''} / ${template.deployMode}`,
      }))
  ), [startupTemplates, scheduleTaskType]);
  const templateMatchesNode = (template: StartupTemplateRecord, node: DeployNodeOption) => {
    const hardware = template.hardware.toLowerCase();
    const gpuType = node.gpuType.toLowerCase();
    if (hardware.includes('通用')) return true;
    if (hardware.includes('h20')) return gpuType.includes('h20');
    if (hardware.includes('a100')) return gpuType.includes('a100');
    if (hardware.includes('l20')) return gpuType.includes('l20');
    if (hardware.includes('910b')) return gpuType.includes('910b');
    return gpuType.includes(hardware.replace('nvidia', '').replace('ascend', '').trim());
  };
  const selectedScheduleCluster = clusters.find((cluster) => cluster.key === scheduleClusterKey);
  const clusterCanRunTemplate = (template: StartupTemplateRecord) => {
    if (!selectedScheduleCluster) return false;
    const hardware = template.hardware.toLowerCase();
    return selectedScheduleCluster.gpuTypes.some((gpu) => {
      const gpuName = gpu.name.toLowerCase();
      if (hardware.includes('h20')) return gpuName.includes('h20');
      if (hardware.includes('a100')) return gpuName.includes('a100');
      if (hardware.includes('l20')) return gpuName.includes('l20');
      if (hardware.includes('910b')) return gpuName.includes('910b');
      return hardware.includes('通用') || hardware.includes(gpuName);
    });
  };
  const resolveStartupTemplateForService = (serviceName: string) => {
    const lower = serviceName.toLowerCase();
    const family = lower.includes('deepseek')
      ? 'DeepSeek'
      : lower.includes('glm')
        ? 'GLM'
        : lower.includes('qwen')
          ? 'Qwen'
          : lower.includes('kimi')
            ? 'Kimi'
            : '';
    if (!family) return undefined;
    return startupTemplates.find((template) => template.modelFamily === family);
  };
  const selectedScheduleGroup = scheduledServiceGroups.find((group) => group.key === scheduleTargetKey);
  const selectedScheduleService = deployServices.find((service) => String(service.id) === scheduleTargetKey);
  const selectedScheduleCurrentTemplate = selectedScheduleService ? resolveStartupTemplateForService(selectedScheduleService.name) : undefined;
  const scheduleServiceTemplateRows = scheduleTargetType === 'serviceGroup'
    ? (selectedScheduleGroup?.services ?? []).map((serviceName) => {
      const currentTemplate = resolveStartupTemplateForService(serviceName);
      return {
        serviceName,
        currentTemplate,
        template: startupTemplates.find((template) => template.key === scheduleServiceTemplateOverrides[serviceName]) || currentTemplate,
      };
    })
    : [];
  const activeScheduleTemplates = scheduleTargetType === 'serviceGroup'
    ? scheduleServiceTemplateRows.map((row) => row.template).filter((template): template is StartupTemplateRecord => Boolean(template))
    : selectedScheduleTemplate ? [selectedScheduleTemplate] : [];
  const hasMissingScheduleTemplate = scheduleTargetType === 'serviceGroup' && scheduleServiceTemplateRows.some((row) => !row.template);
  const scheduleRequiredNodeCount = activeScheduleTemplates.reduce((sum, template) => sum + (template.nodeCount || 1), 0);
  const scheduleRequiredCardCount = activeScheduleTemplates.reduce((sum, template) => sum + (template.cardCount || 1), 0);
  const scheduleNodeOptions = useMemo(() => {
    const templates = activeScheduleTemplates;
    return deployNodes
      .filter((node) => !scheduleClusterKey || node.clusterKey === scheduleClusterKey)
      .map((node) => {
        const matchTemplate = templates.length === 0 || templates.some((template) => templateMatchesNode(template, node) || clusterCanRunTemplate(template));
        const enoughCards = templates.length === 0 || node.availableCards > 0;
        return {
          value: node.key,
          label: `${node.name} / ${node.gpuType} / 可用${node.availableCards}卡`,
          disabled: node.status !== 'ready' || !matchTemplate || !enoughCards,
        };
      });
  }, [scheduleClusterKey, activeScheduleTemplates]);

  useEffect(() => {
    if (scheduleTargetType !== 'modelService') return;
    const currentAvailable = scheduleTargetOptions.some((option) => option.value === scheduleTargetKey);
    if (!currentAvailable) {
      setScheduleTargetKey(scheduleTargetOptions[0]?.value ?? '');
    }
    const templateAvailable = scheduleTemplateOptions.some((option) => option.value === scheduleTemplateKey);
    if (!templateAvailable) {
      setScheduleTemplateKey(scheduleTemplateOptions[0]?.value ?? startupTemplates[0]?.key ?? '');
    }
  }, [scheduleTargetType, scheduleTaskType, scheduleTargetOptions, scheduleTargetKey, scheduleTemplateOptions, scheduleTemplateKey, startupTemplates]);

  useEffect(() => {
    if (activeScheduleTemplates.length === 0 || !scheduleClusterKey) return;
    const exactCandidates = deployNodes
      .filter((node) => node.clusterKey === scheduleClusterKey && node.status === 'ready' && activeScheduleTemplates.some((template) => templateMatchesNode(template, node)) && node.availableCards > 0);
    const fallbackCandidates = deployNodes
      .filter((node) => node.clusterKey === scheduleClusterKey && node.status === 'ready' && node.availableCards > 0 && activeScheduleTemplates.some((template) => clusterCanRunTemplate(template)));
    const candidates = exactCandidates.length > 0 ? exactCandidates : fallbackCandidates;
    const selected: string[] = [];
    let cards = 0;
    for (const node of candidates) {
      if (selected.length >= scheduleRequiredNodeCount && cards >= scheduleRequiredCardCount) break;
      selected.push(node.key);
      cards += node.availableCards;
    }
    setScheduleNodeKeys(selected);
  }, [scheduleClusterKey, scheduleTargetType, scheduleTargetKey, scheduleTemplateKey, scheduleServiceTemplateOverrides, startupTemplates]);

  const renderScheduleDeployPanel = () => (
    <div className="ataas-schedule-deploy-panel">
      <Form className="ataas-deploy-drawer-form" layout="vertical" size="middle">
        <div className="ataas-schedule-mode-row">
          <span>任务类型</span>
          <Segmented
            value={scheduleTaskType}
            onChange={(value) => setScheduleTaskType(value as 'startStop' | 'pdScale')}
            options={[
              { label: '定时启停', value: 'startStop' },
              { label: '定时扩缩 PD', value: 'pdScale' },
            ]}
          />
        </div>
        <div className="ataas-schedule-mode-row">
          <span>任务目标</span>
          <Segmented
            value={scheduleTargetType}
            onChange={(value) => {
              const nextType = value as 'serviceGroup' | 'modelService';
              setScheduleTargetType(nextType);
              setScheduleTargetKey(nextType === 'serviceGroup' ? scheduledServiceGroups[0]?.key ?? '' : String(deployServices[0]?.id ?? ''));
              setScheduleServiceTemplateOverrides({});
            }}
            options={[
              { label: '服务组', value: 'serviceGroup' },
              { label: '模型服务', value: 'modelService' },
            ]}
          />
        </div>
        <Form.Item label={scheduleTargetType === 'serviceGroup' ? '选择服务组' : '选择模型服务'} required>
          <Select value={scheduleTargetKey} onChange={(value) => { setScheduleTargetKey(value); setScheduleServiceTemplateOverrides({}); }} options={scheduleTargetOptions} />
        </Form.Item>
        {scheduleTargetType === 'serviceGroup' ? (
          <div className="ataas-schedule-template-association">
            <div className="ataas-schedule-template-association-head">
              <span>{scheduleTaskType === 'pdScale' ? '配置目标启动模板' : '自动关联启动模板'}</span>
              <em>{scheduleServiceTemplateRows.filter((row) => row.template).length}/{scheduleServiceTemplateRows.length}</em>
            </div>
            <div className="ataas-schedule-template-association-list">
              {scheduleServiceTemplateRows.map((row) => (
                <div key={row.serviceName} className={`ataas-schedule-template-association-row ${scheduleTaskType === 'pdScale' ? 'ataas-schedule-template-scale-row' : ''}`}>
                  {scheduleTaskType === 'pdScale' ? (
                    <div className="ataas-schedule-template-current">
                      <strong>{row.serviceName}</strong>
                      <span>当前拓扑：{row.currentTemplate?.topology || '未关联启动模板'}</span>
                    </div>
                  ) : (
                    <strong>{row.serviceName}</strong>
                  )}
                  {row.template ? (
                    <div className="ataas-schedule-template-target">
                      <Select
                        value={row.template.key}
                        onChange={(value) => setScheduleServiceTemplateOverrides((prev) => ({ ...prev, [row.serviceName]: value }))}
                        options={startupTemplates.map((template) => ({
                          value: template.key,
                          label: `${template.name}${template.hardware ? ' / ' + template.hardware : ''}${template.nodeCount ? ' / ' + template.nodeCount + '节点' + (template.cardCount || '') + '卡' : ''}`,
                        }))}
                      />
                      {scheduleTaskType === 'pdScale' && <em>目标拓扑：{row.template.topology}</em>}
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setActiveTab('startupTemplates'); setDeployDrawerOpen(false); setStartupTemplateCreateOpen(true); }}>未关联，创建</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {scheduleTaskType === 'pdScale' ? (
              <div className="ataas-schedule-template-association">
                <div className="ataas-schedule-template-association-head">
                  <span>配置目标启动模板</span>
                  <em>{selectedScheduleTemplate ? '1/1' : '0/1'}</em>
                </div>
                <div className="ataas-schedule-template-association-list">
                  <div className="ataas-schedule-template-association-row ataas-schedule-template-scale-row">
                    <div className="ataas-schedule-template-current">
                      <strong>{selectedScheduleService?.name || '请选择模型服务'}</strong>
                      <span>当前拓扑：{selectedScheduleCurrentTemplate?.topology || '未关联启动模板'}</span>
                    </div>
                    <div className="ataas-schedule-template-target">
                      <Select value={scheduleTemplateKey} onChange={setScheduleTemplateKey} options={scheduleTemplateOptions} />
                      <em>目标拓扑：{selectedScheduleTemplate?.topology || '-'}</em>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Form.Item label="关联启动模板" required>
                  <Select value={scheduleTemplateKey} onChange={setScheduleTemplateKey} options={scheduleTemplateOptions} />
                </Form.Item>
                {selectedScheduleTemplate && (
                  <div className="ataas-schedule-template-preview">
                    <div><span>引擎</span><strong>{selectedScheduleTemplate.engine}</strong></div>
                    <div><span>模型家族</span><strong>{selectedScheduleTemplate.modelFamily}</strong></div>
                    <div><span>部署拓扑</span><strong>{selectedScheduleTemplate.topology}</strong></div>
                    <p>{selectedScheduleTemplate.command}</p>
                  </div>
                )}
              </>
            )}
          </>
        )}
        <Form.Item label="选择集群" required>
          <Select value={scheduleClusterKey} onChange={(value) => { setScheduleClusterKey(value); setScheduleNodeKeys([]); }} options={clusters.map((cluster) => ({ value: cluster.key, label: `${cluster.name} (${cluster.region})` }))} />
        </Form.Item>
        <Form.Item label="选择节点" required>
          <Select
            mode="multiple"
            value={scheduleNodeKeys}
            onChange={setScheduleNodeKeys}
            options={scheduleNodeOptions}
            placeholder="请选择执行启停的节点"
            maxTagCount={0}
            maxTagPlaceholder={() => `已选择 ${scheduleNodeKeys.length} 个节点`}
          />
        </Form.Item>
        {scheduleNodeKeys.length > 0 && (
          <div className="ataas-schedule-selected-nodes">
            <div className="ataas-schedule-selected-nodes-head">
              <span>已自动选择节点</span>
              <em>{scheduleNodeKeys.length} 个节点</em>
            </div>
            <div className="ataas-schedule-selected-node-list">
              {scheduleNodeKeys.map((nodeKey) => {
                const node = deployNodes.find((item) => item.key === nodeKey);
                if (!node) return null;
                return (
                  <div key={node.key} className="ataas-schedule-selected-node-item">
                    <strong>{node.name}</strong>
                    <span>{node.ip}</span>
                    <em>{node.gpuType} / 可用 {node.availableCards} 卡</em>
                    <button type="button" aria-label={`移除${node.name}`} onClick={() => setScheduleNodeKeys((prev) => prev.filter((key) => key !== node.key))}><MinusCircleOutlined /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {scheduleTaskType === 'startStop' ? (
          <Form.Item label="启停时间" required>
            <DatePicker.RangePicker
              showTime
              className="ataas-schedule-range-picker"
              placeholder={['启动时间', '停止时间']}
              onChange={(_, dateString) => setScheduleStartStopTime(Array.isArray(dateString) ? dateString[0] : scheduleStartStopTime)}
            />
          </Form.Item>
        ) : (
          <div className="ataas-schedule-scale-time-card">
            {activeScheduleTemplates.length > 0 && (
              <div className="ataas-schedule-scale-template-tip">
                <span>目标部署拓扑</span>
                <strong>{activeScheduleTemplates.map((template) => template.topology).join('、')}</strong>
              </div>
            )}
            <div className="ataas-schedule-scale-time-row">
              <Form.Item label="扩缩执行时间" required>
                <DatePicker
                  showTime
                  className="ataas-schedule-scale-picker"
                  placeholder={scheduleScaleTime}
                  onChange={(_, dateString) => setScheduleScaleTime(Array.isArray(dateString) ? dateString[0] : dateString)}
                />
              </Form.Item>
              <Checkbox checked={scheduleScaleDaily} onChange={(event) => setScheduleScaleDaily(event.target.checked)}>每天循环</Checkbox>
            </div>
          </div>
        )}
        <div className="ataas-schedule-alert-box">
          <div className="ataas-schedule-alert-head">
            <span>异常告警</span>
            <Switch size="small" checked={scheduleAlertEnabled} onChange={setScheduleAlertEnabled} />
          </div>
          <Input
            disabled={!scheduleAlertEnabled}
            value={scheduleFeishuWebhook}
            onChange={(event) => setScheduleFeishuWebhook(event.target.value)}
            placeholder="飞书 Webhook，例如：https://open.feishu.cn/open-apis/bot/v2/hook/..."
          />
          <p>任意模型最后进入拉起异常状态时，通过该 Webhook 发送告警。</p>
        </div>
        <div className="ataas-deploy-drawer-actions" style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={resetDeployForm}>取消</Button>
          <Button
            type="primary"
            disabled={!scheduleTargetKey || (scheduleTargetType === 'modelService' && !scheduleTemplateKey) || hasMissingScheduleTemplate || !scheduleClusterKey || scheduleNodeKeys.length === 0 || (scheduleTaskType === 'pdScale' && !scheduleScaleTime) || (scheduleAlertEnabled && !scheduleFeishuWebhook)}
            onClick={handleCreateScheduleDeployTask}
          >
            创建任务
          </Button>
        </div>
      </Form>
    </div>
  );

  const renderLaunchConfigBlock = () => (
    <div className="ataas-launch-config">
      <div className="ataas-launch-config-head">
        <span>启动配置</span>
        <Segmented
          value={launchConfigMode}
          onChange={(value) => setLaunchConfigMode(value as 'template' | 'manual')}
          options={[
            { label: '启动模板', value: 'template' },
            { label: '手动填写', value: 'manual' },
          ]}
        />
      </div>
      {launchConfigMode === 'template' && (
        <div className="ataas-launch-template-select-row">
          <Select
            value={selectedStartupTemplateKey}
            onChange={applyStartupTemplate}
            options={startupTemplates.map((template) => ({
              value: template.key,
              label: `${template.name}${template.engine ? ' / ' + template.engine : ''}`,
            }))}
            style={{ flex: 1 }}
          />
          <Button onClick={() => setActiveTab('startupTemplates')}>管理模板</Button>
        </div>
      )}
      <Form.Item label="部署拓扑" required style={{ marginBottom: 12 }}>
        <Input
          value={launchTopology}
          onChange={(event) => {
            setLaunchTopology(event.target.value);
            if (launchConfigMode === 'template') setLaunchConfigMode('manual');
          }}
          placeholder="例如：2P2D / TP8 / EP1"
        />
      </Form.Item>
      <Form.Item label="启动命令" required style={{ marginBottom: 12 }}>
        <Input.TextArea
          rows={3}
          value={launchCommand}
          onChange={(event) => {
            setLaunchCommand(event.target.value);
            if (launchConfigMode === 'template') setLaunchConfigMode('manual');
          }}
          placeholder="请输入引擎启动命令"
        />
      </Form.Item>
    </div>
  );

  const getNodeDeployServices = (node: NodeRecord) => {
    return deployServices.filter((service) => {
      const works = service.modelInfo.works
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
      const nodeName = node.name.toLowerCase();
      return works.some((work) => work === nodeName || work.includes(nodeName) || nodeName.includes(work));
    });
  };

  const renderNodeModelInfo = (node: NodeRecord) => {
    const services = getNodeDeployServices(node);
    if (services.length === 0) return <span className="ataas-table-sub">-</span>;
    return (
      <div className="ataas-node-model-info-list">
        {services.slice(0, 2).map((service) => {
          const logo = getModelLogo(service.name) || service.logo;
          return (
            <Tooltip key={service.id} title={service.name}>
              <span className="ataas-node-model-info-item">
                {logo ? <img src={logo} alt="" /> : <em>{service.name.slice(0, 1).toUpperCase()}</em>}
                <strong>{service.name}</strong>
              </span>
            </Tooltip>
          );
        })}
        {services.length > 2 && <span className="ataas-node-model-info-more">+{services.length - 2}</span>}
      </div>
    );
  };

  const getGpuCardRunningModels = (node: NodeRecord, card: GpuCardInfo) => {
    const services = getNodeDeployServices(node);
    const replicaText = card.replicas.join(' ').toLowerCase();
    const toModelView = (service: DeployServiceItem) => ({
      key: `service-${service.id}`,
      name: service.name,
      logo: getModelLogo(service.name) || service.logo,
    });

    if (replicaText) {
      const matched = services.filter((service) => {
        const serviceText = `${service.name} ${service.typeStr} ${service.modelInfo.name} ${service.modelInfo.supplier}`.toLowerCase();
        return ['deepseek', 'qwen', 'glm', 'kimi', 'minimax', 'minicpm'].some((keyword) => replicaText.includes(keyword) && serviceText.includes(keyword));
      });
      if (matched.length > 0) return matched.map(toModelView);
      if (replicaText.includes('deepseek')) return [{ key: `replica-${node.key}-${card.index}-deepseek`, name: 'DeepSeek-R1-671B', logo: deepseekLogo }];
      if (replicaText.includes('qwen')) return [{ key: `replica-${node.key}-${card.index}-qwen`, name: 'Qwen3-235B-A22B', logo: qwenLogo }];
      if (replicaText.includes('glm')) return [{ key: `replica-${node.key}-${card.index}-glm`, name: 'GLM-4-Air', logo: glmLogo }];
    }

    if (card.status !== 'active' || services.length === 0) return [];
    return [services[card.index % services.length]].map(toModelView);
  };

  const renderGpuCardRunningModels = (node: NodeRecord, card: GpuCardInfo) => {
    const runningModels = getGpuCardRunningModels(node, card);
    if (runningModels.length === 0) return <span className="ataas-table-sub">-</span>;
    const tooltipTitle = (
      <div className="ataas-node-gpu-model-tooltip">
        {runningModels.map((model) => (
          <div key={model.key}>{model.name}</div>
        ))}
      </div>
    );
    return (
      <Tooltip title={tooltipTitle}>
        <div className="ataas-node-gpu-running-models">
          {runningModels.slice(0, 1).map((model) => (
            <span key={model.key} className="ataas-node-gpu-running-model">
              {model.logo ? <img src={model.logo} alt="" /> : <em>{model.name.slice(0, 1).toUpperCase()}</em>}
              <strong>{model.name}</strong>
            </span>
          ))}
          {runningModels.length > 1 && <span className="ataas-node-gpu-running-model-more">+{runningModels.length - 1}</span>}
        </div>
      </Tooltip>
    );
  };

  const getNodeDisplayGpuCards = (node: NodeRecord) => {
    const sample = node.gpuCards[0];
    return Array.from({ length: Math.max(8, node.gpuCards.length) }, (_, index) => (
      node.gpuCards.find((card) => card.index === index) || {
        index,
        model: sample?.model || node.label.replace('GPU=', '').replace('_', ' '),
        spec: sample?.spec || '-',
        memoryTotal: sample?.memoryTotal || '-',
        memoryUsed: '0 GB',
        memoryFree: sample?.memoryTotal || '-',
        utilization: 0,
        power: 0,
        temperature: 0,
        status: 'idle',
        replicas: [],
      }
    ));
  };

  const getNodeArchitecture = (node: NodeRecord) => (
    /910|ascend|kunpeng/i.test(`${node.label} ${node.gpuCards.map((card) => card.model).join(' ')}`) ? 'ARM' : 'X86'
  );

  const getNodeOperatingSystem = (node: NodeRecord) => (
    getNodeArchitecture(node) === 'ARM' ? 'openEuler 22.03 LTS' : 'Ubuntu 22.04 LTS'
  );

  const getNodeCpuModel = (node: NodeRecord) => {
    if (getNodeArchitecture(node) === 'ARM') return '鲲鹏 920';
    if (node.cpu >= 192) return 'Intel Xeon Platinum 8480+';
    if (node.cpu >= 128) return 'Intel Xeon Gold 6338';
    return 'Intel Xeon Silver 4314';
  };

  const handleDeployNodeFilter = (item: DeployServiceItem) => {
    setActiveTab('clusters');
    setClusterPanel('nodes');
    setSelectedClusterKey('all');
    setClusterNodeModelSearch(item.name);
    setClusterNodeSearch('');
  };

  const getScheduleDetailTemplate = (item: DeployServiceItem) => {
    const text = `${item.name} ${item.typeStr} ${item.modelInfo.name} ${item.modelInfo.supplier}`.toLowerCase();
    const family = text.includes('glm')
      ? 'GLM'
      : text.includes('qwen')
        ? 'Qwen'
        : text.includes('kimi')
          ? 'Kimi'
          : 'DeepSeek';
    return startupTemplates.find((template) => template.modelFamily === family) || startupTemplates[0];
  };

  const getScheduleDetailNodes = (item: DeployServiceItem | null) => {
    if (!item) return [];
    const names = item.modelInfo.works.split(',').map((name) => name.trim().toLowerCase()).filter(Boolean);
    return deployNodes.filter((node) => names.some((name) => name === node.name.toLowerCase()));
  };

  const nodeColumns: ColumnsType<NodeRecord> = [
    { title: '节点名称', dataIndex: 'name', key: 'name', width: 130, render: (v, r) => <><Button type="link" className="ataas-table-link" onClick={() => { setClusterNodeModalTitle(r.name); setClusterNodeRecord(r); setClusterNodeModal(true); }}>{v}</Button></> },
    { title: '节点标签', dataIndex: 'label', key: 'label', width: 130 },
    { title: '集群名称', dataIndex: 'clusterName', key: 'clusterName', width: 120 },
    { title: '节点状态', dataIndex: 'status', key: 'status', width: 95, render: (v: string) => <span className="ataas-cluster-table-status" style={{ ['--status-color' as string]: v === 'normal' ? '#00A11F' : '#E02D2D' }}>{v === 'normal' ? '正常' : '异常'}</span> },
    { title: '授权状态', dataIndex: 'authStatus', key: 'authStatus', width: 95, render: (v: string) => <span className={'ataas-cluster-auth-status' + (v === 'authorized' ? ' authorized' : '')}>{v === 'authorized' ? '已授权' : '未授权'}</span> },
    { title: '模型数量', key: 'modelCount', width: 110, render: (_, r) => {
      const count = getNodeDeployServices(r).length;
      return <span className="ataas-cluster-table-main">{count}</span>;
    } },
    { title: '节点 IP', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: 'CPU使用量', dataIndex: 'cpu', key: 'cpu', width: 160, render: (_: number, r) => (
      <TableUsageRing percent={getCapacityPercent(r.cpuUsed, r.cpu)} sub={`${r.cpuUsed}/${r.cpu}核`} />
    ) },
    { title: 'GPU使用量', dataIndex: 'gpu', key: 'gpu', width: 150, render: (_: number, r) => {
      const usedCards = r.gpuCards.filter((card) => card.status === 'active').length;
      return <TableUsageRing percent={getCapacityPercent(usedCards, r.gpu)} sub={`${usedCards}/${r.gpu}片`} />;
    } },
    { title: 'GPU 显存', dataIndex: 'gpuMemory', key: 'gpuMemory', width: 180, render: (_: string, r) => (
      <TableUsageRing percent={getCapacityPercent(r.gpuMemoryUsed, r.gpuMemory)} sub={`${r.gpuMemoryUsed}/${r.gpuMemory}`} />
    ) },
    { title: '内存使用量', dataIndex: 'memory', key: 'memory', width: 180, render: (_: string, r) => (
      <TableUsageRing percent={getCapacityPercent(r.memoryUsed, r.memory)} sub={`${r.memoryUsed}/${r.memory}`} />
    ) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <span className="ataas-monitor-table-actions ataas-node-table-actions">
          <Button type="link" onClick={() => { setClusterNodeEditTarget(r); setClusterNodeEditName(r.name); }}><i><SettingOutlined /></i>操作</Button>
          <Button type="link" onClick={() => {
            Modal.confirm({
              title: '确认删除节点',
              content: `确定删除节点 ${r.name} 吗？`,
              okText: '删除',
              cancelText: '取消',
              okButtonProps: { danger: true },
              onOk: () => {
                setClusterNodeList((prev) => prev.filter((node) => node.key !== r.key));
                message.success('已删除节点');
              },
            });
          }}><i><DeleteOutlined /></i>删除</Button>
        </span>
      ),
    },
  ];

  const logColumns: ColumnsType<typeof logData[0]> = [
    { title: '状态', dataIndex: 'status', key: 'status', width: 72, render: (v: string) => {
      const colorMap: Record<string, string> = { '成功': '#00A11F', '失败': '#E02D2D' };
      const classMap: Record<string, string> = { '成功': 'ataas-log-table-status-success', '失败': 'ataas-log-table-status-warning' };
      return <span className={`ataas-log-table-status ${classMap[v] || ''}`} style={{ ['--status-color' as string]: colorMap[v] || '#4E5969' }}>{v}</span>;
    } },
    { title: '行为', dataIndex: 'action', key: 'action', width: 100 },
    { title: '对象', dataIndex: 'object', key: 'object', width: 140 },
    { title: '对象类型', dataIndex: 'objectType', key: 'objectType', width: 90 },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 140 },
    { title: '操作时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '操作人', dataIndex: 'user', key: 'user', width: 80 },
    { title: '操作', key: 'action', width: 100, render: (_, r) => (
      <span className="ataas-monitor-table-actions ataas-log-table-actions">
        <Button type="link" onClick={() => setLogDetailRecord(r)}><i><EyeOutlined /></i>查看详情</Button>
      </span>
    ) },
  ];

  const imageColumns: ColumnsType<ImageRecord> = [
    { title: '镜像名称', dataIndex: 'name', key: 'name', render: (v, r) => <><Button type="text" className="ataas-image-name-button" onClick={() => { setImageDrawerRecord(r); setImageDrawerOpen(true); }}>{v}</Button><span className="ataas-image-table-sub">{r.tag}</span></> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '引擎', dataIndex: 'engine', key: 'engine' },
    { title: 'GPU 类型', dataIndex: 'gpuType', key: 'gpuType' },
    { title: '运行时', dataIndex: 'runtime', key: 'runtime', render: (v: string) => <span style={{ fontSize: 12, color: '#4E5969' }}>{v}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <span className={v === '可用' ? 'ataas-image-table-status ataas-image-table-status-ready' : 'ataas-image-table-status ataas-image-table-status-processing'} style={{ ['--status-color' as string]: v === '可用' ? '#00A11F' : '#D96A00' }}>{v}</span> },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt' },
  ];

  const allMonitorRows = useMemo(() => {
    const deployRows = deployServices.map((item, index) => {
      const text = `${item.name} ${item.modelInfo.works} ${item.typeStr}`.toLowerCase();
      const cluster = text.includes('h20') || text.includes('qwen')
        ? 'shanghai-online'
        : text.includes('l20') || text.includes('glm')
          ? 'guangzhou-test'
          : text.includes('910b') || text.includes('kimi')
            ? 'wuhan-kunpeng'
            : 'beijing-prod';
      const metrics = getMockMonitorMetrics(index + 12, 1.18);
      return {
        key: `deploy-monitor-${item.id}`,
        name: item.name,
        cluster,
        ...metrics,
        hasV2: true,
      };
    });
    const deployNames = new Set(deployRows.map((row) => row.name));
    return [...deployRows, ...monitorRows.filter((row) => !deployNames.has(row.name))];
  }, [deployServices]);

  const filteredMonitorRows = useMemo(() => {
    const q = monitorSearchText.trim().toLowerCase();
    return allMonitorRows.filter((row) => {
      if (monitorClusterFilter && row.cluster !== monitorClusterFilter) return false;
      if (monitorExactServiceName) return row.name === monitorExactServiceName;
      if (q && !row.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allMonitorRows, monitorSearchText, monitorClusterFilter, monitorExactServiceName]);

  const monitorSummary = useMemo(() => {
    const total = filteredMonitorRows.reduce((sum, row) => sum + row.callTotal, 0);
    const failed = filteredMonitorRows.reduce((sum, row) => sum + row.callFailed, 0);
    const totalTokens = filteredMonitorRows.reduce((sum, row) => sum + row.totalTokens, 0);
    const inputTokens = filteredMonitorRows.reduce((sum, row) => sum + row.inputTokens, 0);
    const outputTokens = filteredMonitorRows.reduce((sum, row) => sum + row.outputTokens, 0);
    return {
      interfaceCount: filteredMonitorRows.reduce((sum, row) => sum + (row.interfaceCount || 1), 0),
      total,
      failed,
      totalTokens,
      inputTokens,
      outputTokens,
    };
  }, [filteredMonitorRows]);

  const monitorColumns: ColumnsType<typeof monitorRows[0]> = [
    { title: '服务名称', dataIndex: 'name', key: 'name', width: 220, fixed: 'left', sorter: (a, b) => a.name.localeCompare(b.name), render: (v) => {
      const logo = getModelLogo(v);
      return (
        <span className="ataas-monitor-service-name">
          {logo ? <img src={logo} alt="" /> : <em>{String(v).slice(0, 1).toUpperCase()}</em>}
          <strong>{v}</strong>
        </span>
      );
    } },
    { title: '调用总量', dataIndex: 'callTotal', key: 'callTotal', width: 110, sorter: (a, b) => a.callTotal - b.callTotal },
    { title: '调用失败', dataIndex: 'callFailed', key: 'callFailed', width: 110, sorter: (a, b) => a.callFailed - b.callFailed },
    { title: '失败率', dataIndex: 'failRate', key: 'failRate', width: 100, sorter: (a, b) => Number(a.failRate.replace('%', '')) - Number(b.failRate.replace('%', '')) },
    { title: '调用总tokens数', dataIndex: 'totalTokens', key: 'totalTokens', width: 150, sorter: (a, b) => a.totalTokens - b.totalTokens },
    { title: '输入tokens数', dataIndex: 'inputTokens', key: 'inputTokens', width: 140, sorter: (a, b) => a.inputTokens - b.inputTokens },
    { title: '输出tokens数', dataIndex: 'outputTokens', key: 'outputTokens', width: 140, sorter: (a, b) => a.outputTokens - b.outputTokens },
    { title: '平均TTFT', dataIndex: 'avgTtft', key: 'avgTtft', width: 120, sorter: (a, b) => a.avgTtft - b.avgTtft },
    { title: '平均OTPS', dataIndex: 'avgOtps', key: 'avgOtps', width: 120, sorter: (a, b) => a.avgOtps - b.avgOtps },
    { title: '缓存命中率', dataIndex: 'cacheHitRate', key: 'cacheHitRate', width: 120, sorter: (a, b) => Number(a.cacheHitRate.replace('%', '')) - Number(b.cacheHitRate.replace('%', '')) },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'right',
      render: (_, row) => (
        <span className="ataas-monitor-table-actions">
          <Button type="link" onClick={() => setMonitorReportRow(row)}><i><EyeOutlined /></i>查看监控</Button>
        </span>
      ),
    },
  ];

  const filteredNodes = useMemo(() => {
    let list = clusterNodeList;
    if (selectedClusterKey !== 'all') list = list.filter((n) => n.clusterKey === selectedClusterKey);
    if (clusterNodeSearch) {
      const q = clusterNodeSearch.toLowerCase();
      list = list.filter((n) => n.name.toLowerCase().includes(q) || n.ip.includes(q));
    }
    if (clusterNodeModelSearch) {
      const q = clusterNodeModelSearch.toLowerCase();
      list = list.filter((n) => getNodeDeployServices(n).some((service) => service.name.toLowerCase().includes(q) || service.typeStr.toLowerCase().includes(q) || service.modelInfo.name.toLowerCase().includes(q)));
    }
    return list;
  }, [selectedClusterKey, clusterNodeSearch, clusterNodeModelSearch, clusterNodeList, deployServices]);

  const SIDEBAR_ITEMS = [
    { key: 'overview', icon: <SidebarIcon name="dashboard" />, label: '数据概览' },
    { key: 'clusters', icon: <SidebarIcon name="cluster" />, label: '集群管理' },
    { key: 'modelRepo', icon: <SidebarIcon name="modelRepo" />, label: '模型仓库' },
    { key: 'deploy', icon: <SidebarIcon name="deploy" />, label: '模型部署（暂不做）' },
    { key: 'startupTemplates', icon: <SidebarIcon name="engine" />, label: '启动模板（暂不做）' },
    { key: 'images', icon: <SidebarIcon name="image" />, label: '镜像仓库' },
    { key: 'monitoring', icon: <SidebarIcon name="resource" />, label: '模型监控' },
    { key: 'playgroundChat', icon: <SidebarIcon name="playground" />, label: '模型体验' },
    { key: 'benchmark', icon: <SidebarIcon name="benchmark" />, label: '性能压测（暂不做）' },
    { key: 'logs', icon: <SidebarIcon name="logs" />, label: '操作日志' },
    { key: 'alerts', icon: <SidebarIcon name="engine" />, label: '告警详情' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return (
			<div className="ataas-section-stack">
	              <OverviewSummary />

              <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
                {/* 左侧：集群概览 + 模型数据 */}
                <div style={{ flex: 3.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
	                  <div className="ataas-panel-head" style={{ marginBottom: 0 }}>
	                    <div>
	                      <h2>集群概览</h2>
	                      <span>多集群 GPU 资源总览</span>
	                    </div>
	                    <Segmented value={clusterViewMode} onChange={(v) => setClusterViewMode(v as 'cluster' | 'gpu')} options={[{ value: 'cluster', label: '集群分类' }, { value: 'gpu', label: '显卡分类' }]} />
	                  </div>
	                  <div className="ataas-cluster-scroll">
	                    {clusterViewMode === 'cluster' ? (
                          overviewClusterSlots.map((clusterKey, slotIndex) => {
                            const selectedCluster = clusterKey ? clusterList.find((item) => item.key === clusterKey) : null;
                            const openPicker = () => { setOverviewClusterPickerSlot(slotIndex); setOverviewClusterPickerOpen(true); };
                            return selectedCluster ? (
                              <div
                                key={slotIndex}
                                className="ataas-cluster-custom-slot"
                                role="button"
                                tabIndex={0}
                                onClick={openPicker}
                                onKeyDown={(e) => { if (e.key === 'Enter') openPicker(); }}
                              >
                                <ClusterCard item={toClusterResourceCard(selectedCluster)} compact />
                              </div>
                            ) : (
                              <ClusterAddCard key={slotIndex} onClick={openPicker} />
                            );
                          })
                        ) : (
                          overviewGpuSlots.map((gpuKey, slotIndex) => {
                            const selectedGpu = gpuKey ? gpuTypeCards.find((item) => item.key === gpuKey) : null;
                            const openPicker = () => { setOverviewGpuPickerSlot(slotIndex); setOverviewGpuPickerOpen(true); };
                            return selectedGpu ? (
                              <div
                                key={slotIndex}
                                className="ataas-cluster-custom-slot"
                                role="button"
                                tabIndex={0}
                                onClick={openPicker}
                                onKeyDown={(e) => { if (e.key === 'Enter') openPicker(); }}
                              >
                                <ClusterCard item={selectedGpu} compact />
                              </div>
                            ) : (
                              <ClusterAddCard key={slotIndex} onClick={openPicker} />
                            );
                          })
                        )}
	                  </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 4px', color: '#1d2129', fontSize: 16, fontWeight: 600, lineHeight: '24px' }}>模型数据</h2>
                    <span style={{ display: 'block', margin: '0 0 8px', color: '#86909c', fontSize: 12, lineHeight: '18px' }}>按调用量与 Token 量排行 TOP 3</span>
                    <div className="ataas-model-top-panel">
                      {overviewModelCards.map((item, i) => (
                        <TopModelCard key={i} item={item} index={i} activeMetric={callRankMode} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 右侧合并卡片 */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <div className="ataas-panel ataas-overview-side-card">
                    {/* 模型热门榜单 */}
                    <div className="ataas-side-section ataas-side-section-rank">
                      <div className="ataas-panel-head">
                        <div>
                          <h2>模型热门榜单</h2>
                          <span>按模型 {callRankMode === 'tpm' ? 'TPM' : 'RPM'} 排序</span>
                        </div>
                        <div className="ataas-toggle-pill">
                          <button className={callRankMode === 'tpm' ? 'active' : ''} onClick={() => setCallRankMode('tpm')}>TPM</button>
                          <button className={callRankMode === 'rpm' ? 'active' : ''} onClick={() => setCallRankMode('rpm')}>RPM</button>
                        </div>
                      </div>
                      <div>
                        {[...overviewCallRank].sort((a, b) => {
                          const parseNum = (s: string) => { const n = parseFloat(s); return s.includes('K') ? n * 1000 : n; };
                          const aVal = parseNum(callRankMode === 'tpm' ? a.tpm : a.rpm);
                          const bVal = parseNum(callRankMode === 'tpm' ? b.tpm : b.rpm);
                          return bVal - aVal;
                        }).slice(0, 10).map((item, i) => {
                          const parseNum = (s: string) => { const n = parseFloat(s); return s.includes('K') ? n * 1000 : n; };
                          const vals = overviewCallRank.map((r) => parseNum(callRankMode === 'tpm' ? r.tpm : r.rpm));
                          const max = Math.max(...vals);
                          const val = parseNum(callRankMode === 'tpm' ? item.tpm : item.rpm);
                          const pct = max > 0 ? (val / max) * 100 : 0;
                          const logo = getModelLogo(item.name);
                          return (
                            <div key={i} className="ataas-merged-item" style={{ borderBottom: i < 9 ? '1px solid #F7F8FA' : 'none' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F7F8FA'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                              <span className="ataas-model-call-rank">{i + 1}</span>
                              {logo && <img src={logo} alt="" className="ataas-model-call-logo" />}
                              <div className="ataas-model-call-info">
                                <span className="ataas-model-call-name">{item.name}</span>
                                <div className="ataas-model-call-bar">
                                  <i style={{ width: `${pct}%`, background: BAR_COLORS[i] || '#3370FF' }} />
                                </div>
                              </div>
                              <span className="ataas-model-call-val">{callRankMode === 'tpm' ? item.tpm : item.rpm}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="ataas-side-more">
                      <a onClick={() => { setActiveTab('modelRepo'); }}>查看全部 <ArrowRightOutlined style={{ fontSize: 10 }} /></a>
                    </div>
                    {/* 告警列表 */}
                    <div className="ataas-side-section ataas-side-section-bordered">
                      <div className="ataas-panel-head">
                        <div>
                          <h2>告警列表</h2>
                          <span>实时告警概览</span>
                        </div>
                      </div>
                      <div>
                        {alertList.slice(0, 6).map((alert, i, arr) => (
                          <div key={alert.key} className="ataas-merged-item" style={{ borderBottom: i < arr.length - 1 ? '1px solid #F7F8FA' : 'none' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F7F8FA'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <span className={`ataas-merged-dot ${alert.level === 'critical' ? 'ataas-dot-critical' : ''}`} style={{ background: alert.level === 'critical' ? '#F53F3F' : alert.level === 'warning' ? '#FF7D00' : '#86909C' }} />
                            <span className="ataas-merged-title">{alert.target}</span>
                            <span className="ataas-merged-desc">{alert.description}</span>
                            <span className="ataas-merged-time">{alert.time.slice(-5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ataas-side-more">
                      <a onClick={() => { setActiveTab('alerts'); }}>查看全部 <ArrowRightOutlined style={{ fontSize: 10 }} /></a>
                    </div>
                    {/* 操作日志 */}
                    <div className="ataas-side-section ataas-side-section-bordered">
                      <div className="ataas-panel-head">
                        <div>
                          <h2>操作日志</h2>
                          <span>最近平台操作记录</span>
                        </div>
                      </div>
                      <div>
                        {logData.slice(0, 6).map((log, i, arr) => (
                          <div key={i} className="ataas-merged-item" style={{ borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none' }} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F7F8FA'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}>
                            <span style={{ flexShrink: 0, fontSize: 12, lineHeight: 1, color: log.status === '成功' ? '#00b42a' : '#f53f3f' }}>
                              {log.status === '成功' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                            </span>
                            <span className="ataas-merged-title">{log.user}</span>
                            <span style={{ fontSize: 11, color: '#4E5969', flexShrink: 0 }}>{log.action}</span>
                            <span className="ataas-merged-desc">{log.object}</span>
                            <span className="ataas-merged-time">{log.time.slice(-5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ataas-side-more ataas-side-more-last">
                      <a onClick={() => { setActiveTab('logs'); }}>查看全部 <ArrowRightOutlined style={{ fontSize: 10 }} /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
      case 'clusters': return (
		<div className="ataas-section-stack">
              <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
              <div className="ataas-panel ataas-cluster-page">
                <div className="ataas-panel-head">
                  <h2>{clusterPanel === 'clusters' ? '集群管理' : '节点管理'}</h2>
                  <div className="ataas-deploy-list-view-toggle ataas-cluster-mode-toggle" role="group" aria-label="集群管理类型切换">
                    <button className={clusterPanel === 'clusters' ? 'active' : ''} type="button" onClick={() => setClusterPanel('clusters')}><DeploymentUnitOutlined />集群列表</button>
                    <span className="ataas-deploy-view-divider" aria-hidden="true" />
                    <button className={clusterPanel === 'nodes' ? 'active' : ''} type="button" onClick={() => setClusterPanel('nodes')}><NodeIndexOutlined />节点管理</button>
                  </div>
                </div>
                {clusterPanel === 'clusters' ? (
                  <div>
                    <div className="ataas-cluster-stat-strip">
                      <div className="ataas-cluster-stat-item">
                        <span>集群数量</span>
                        <strong>{clusterList.length}</strong>
                        <em>个</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>授权集群</span>
                        <strong className="success">{clusterList.filter(c => { const [a, b] = c.authInfo.split('/'); return parseInt(a || '0') / Math.max(parseInt(b || '1'), 1) >= 0.8; }).length}</strong>
                        <em>个</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>异常集群</span>
                        <strong className="danger">{clusterList.filter(c => c.status !== 'healthy').length}</strong>
                        <em>个</em>
                      </div>
                    </div>
                    <div className="ataas-cluster-toolbar">
                      <Button className="ataas-deploy-create-button" icon={<PlusOutlined />} type="primary" onClick={() => setClusterCreateOpen(true)}>纳管新集群</Button>
                      <Input.Search placeholder="搜索集群名称..." className="ataas-cluster-search" value={clusterSearchText} onChange={(e) => setClusterSearchText(e.target.value)} allowClear />
                    </div>
                    <div className="ataas-cluster-table-wrap">
                    <Table dataSource={filteredClusterList} rowKey="key" pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 个集群` }} columns={[
                      { title: '集群名称', dataIndex: 'name', key: 'name', width: 140, render: (v) => <strong className="ataas-cluster-table-main">{v}</strong> },
                      { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (v: string, r) => {
                        const abnormal = v !== 'healthy';
                        const goAlerts = () => {
                          setAlertDateRange(null);
                          setAlertClusterFilter(getClusterAlertName(r));
                          setActiveTab('alerts');
                        };
                        return (
                          <button
                            className={'ataas-cluster-table-status' + (abnormal ? ' clickable' : '')}
                            style={{ ['--status-color' as string]: abnormal ? '#E02D2D' : '#00A11F' }}
                            type="button"
                            onClick={abnormal ? goAlerts : undefined}
                          >
                            {abnormal ? '异常' : '正常'}
                          </button>
                        );
                      } },
                      { title: '节点数', dataIndex: 'nodes', key: 'nodes', width: 90, render: (v: number, r) => <Button type="link" className="ataas-table-link" onClick={() => { setSelectedClusterKey(r.key); setClusterPanel('nodes'); }}>{v} 台</Button> },
                      { title: '授权状态', key: 'authStatus', width: 80, render: (_, r) => { const [a, b] = r.authInfo.split('/'); const allAuth = parseInt(a || '0') === parseInt(b || '1'); return <span className={'ataas-cluster-auth-status' + (allAuth ? ' authorized' : '')}>{allAuth ? '授权' : '未授权'}</span>; } },
                                            { title: '模型数', dataIndex: 'models', key: 'models', width: 80, render: (v: number, r) => (
                        <Button
                          type="link"
                          className="ataas-table-link"
                          onClick={() => {
                            setDeployListClusterFilter(r.name);
                            setDeployListViewMode('table');
                            setActiveTab('deploy');
                          }}
                        >
                          {v} 个
                        </Button>
                      ) },
                      { title: 'GPU使用量', dataIndex: 'gpuUsage', key: 'gpuUsage', width: 130, render: (v: number, r) => {
                        const totalCards = r.gpuTypes.reduce((sum, gpu) => sum + gpu.cards, 0);
                        const usedCards = Math.round(totalCards * v / 100);
                        return <TableUsageRing percent={v} sub={`${usedCards}/${totalCards}片`} />;
                      } },
                      { title: 'CPU使用量', dataIndex: 'cpu', key: 'cpu', width: 145, render: (v: string) => {
                        const usage = parseUsageText(v);
                        return <TableUsageRing percent={usage.percent} sub={usage.sub} />;
                      } },
                      { title: '内存使用量', dataIndex: 'memory', key: 'memory', width: 145, render: (v: string) => {
                        const usage = parseUsageText(v);
                        return <TableUsageRing percent={usage.percent} sub={usage.sub} />;
                      } },
                      {
                        title: '操作', key: 'action', width: 150, fixed: 'right', render: (_, r) => (
                          <span className="ataas-monitor-table-actions ataas-cluster-table-actions">
                            <Button type="link" danger onClick={() => setClusterDeleteConfirm(r)}><i><DeleteOutlined /></i>删除</Button>
                            <Dropdown
                              menu={{
                                items: [
                                  { key: 'updateKey', label: '更新 Token', icon: <SettingOutlined /> },
                                  { key: 'auth', label: '授权', icon: <CheckCircleOutlined /> },
                                ],
                                onClick: ({ key }) => {
                                  if (key === 'updateKey') {
                                    setClusterKeyEditTarget(r);
                                    setClusterKeyEditValue('');
                                    setClusterKeyEditOpen(true);
                                  }
                                  if (key === 'auth') {
                                    const authNodes = clusterNodeList.filter((n) => n.clusterKey === r.key);
                                    setClusterNodeList((prev) => prev.map((n) => authNodes.some((an) => an.key === n.key) ? { ...n, authStatus: 'authorized' } : n));
                                    message.success('集群 ' + r.name + ' 已授权');
                                  }
                                },
                              }}
                              placement="bottomRight"
                            >
                              <Button type="link" onClick={(e) => e.stopPropagation()}><i><DownOutlined /></i>更多</Button>
                            </Dropdown>
                          </span>
                        ),
                      },
                    ]} scroll={{ x: 1350 }} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ataas-cluster-stat-strip">
                      <div className="ataas-cluster-stat-item">
                        <span>节点数量</span>
                        <strong>{clusterNodeList.length}</strong>
                        <em>台</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>授权节点</span>
                        <strong className="success">{clusterNodeList.filter(n => n.authStatus === 'authorized').length}</strong>
                        <em>台</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>异常节点</span>
                        <strong className="danger">{clusterNodeList.filter(n => n.status !== 'normal').length}</strong>
                        <em>台</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>显卡数量</span>
                        <strong>{clusterNodeList.reduce((s, n) => s + n.gpu, 0)}</strong>
                        <em>片</em>
                      </div>
                      <i />
                      <div className="ataas-cluster-stat-item">
                        <span>授权显卡</span>
                        <strong className="success">{clusterNodeList.filter(n => n.authStatus === 'authorized').reduce((s, n) => s + n.gpu, 0)}</strong>
                        <em>片</em>
                      </div>
                    </div>
                    <div className="ataas-cluster-toolbar">
                      <Select value={selectedClusterKey} className="ataas-cluster-select" onChange={setSelectedClusterKey} options={[{ value: 'all', label: '全部集群' }, ...clusters.map((c) => ({ value: c.key, label: c.name }))]} />
                      <Input.Search placeholder="搜索节点名或 IP..." className="ataas-cluster-search" value={clusterNodeSearch} onChange={(e) => setClusterNodeSearch(e.target.value)} />
                      <Input.Search placeholder="按模型名称筛选..." className="ataas-cluster-search ataas-cluster-model-search" value={clusterNodeModelSearch} onChange={(e) => setClusterNodeModelSearch(e.target.value)} allowClear />
                    </div>
                    <div className="ataas-cluster-table-wrap">
                    <Table dataSource={filteredNodes} rowKey="key" columns={nodeColumns} scroll={{ x: 1620 }} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }} expandable={{
                      expandedRowRender: (r) => (
                        <div className="ataas-node-expand-detail">
                          <div className="ataas-node-resource-list">
                            <div><span>CPU</span><Tooltip title={`${r.cpu} 核（已用 ${r.cpuUsed} 核） / ${getNodeCpuModel(r)} / ${getNodeArchitecture(r)}`}><strong>{r.cpu} 核（已用 {r.cpuUsed} 核） / {getNodeCpuModel(r)} / {getNodeArchitecture(r)}</strong></Tooltip></div>
                            <div><span>内存</span><strong>{r.memory}（已用 {r.memoryUsed}）</strong></div>
                            <div><span>GPU</span><strong>{getNodeDisplayGpuCards(r).length} 片（显存 {r.gpuMemoryUsed} / {r.gpuMemory}）</strong></div>
                            <div><span>磁盘</span><strong>{r.disk}（已用 {r.diskUsed}）</strong></div>
                            <div><span>模型</span><strong>{r.modelCount} 个 / {r.runningInstances} 实例</strong></div>
                            <div><span>操作系统</span><strong>{getNodeOperatingSystem(r)}</strong></div>
                          </div>
                          <div className="ataas-node-gpu-panel">
                            <div className="ataas-node-gpu-card-grid">
                              {getNodeDisplayGpuCards(r).map((card) => (
                                <div key={card.index} className={'ataas-node-gpu-card' + (card.status === 'idle' ? ' idle' : '')}>
                                  <div className="ataas-node-gpu-card-head">
                                    <strong>GPU {card.index}</strong>
                                    <span className={'ataas-node-gpu-card-status' + (card.status === 'idle' ? ' idle' : '')}>{card.status === 'idle' ? '空闲' : '运行中'}</span>
                                  </div>
                                  <div className="ataas-node-gpu-card-model">{card.model}<em>{card.spec}</em></div>
                                  <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" />
                                  <div className="ataas-node-gpu-card-meta">
                                    <span>显存 {card.memoryUsed} / {card.memoryTotal}</span>
                                    <span>{card.temperature}°C · {card.power}W</span>
                                  </div>
                                  {renderGpuCardRunningModels(r, card)}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ),
                      rowExpandable: () => true,
                    }} />
                    </div>
                  </div>
                )}
              </div>
              </ConfigProvider>
            </div>
          );
      case 'modelRepo': return (
            <div className="ataas-section-stack">
              <ConfigProvider theme={{
                token: {
                  colorPrimary: '#6951FF',
                  colorPrimaryHover: '#5B42F3',
                  colorPrimaryActive: '#4E35DF',
                  controlOutline: 'rgba(105, 81, 255, 0.12)',
                },
              }}>
              <div className="ataas-panel ataas-model-repo-page ataas-deploy-list">
                <div className="ataas-model-repo-body">
                  <aside className="ataas-model-repo-filter">
                    <div className="ataas-model-repo-filter-section ataas-model-repo-filter-section-first">
                      <h3>模型来源</h3>
                      <div className="ataas-model-repo-filter-group">
                        <div className="ataas-model-repo-filter-tag-grid">
                          {[
                            { label: '全部模型', value: 'all' as const },
                            { label: '官方模型', value: 'official' as const },
                            { label: '私有模型', value: 'private' as const },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={modelRepoSource === item.value ? 'active' : ''}
                              onClick={() => setModelRepoSource(item.value)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {modelRepoFilters.map((section) => (
                      <div key={section.title} className="ataas-model-repo-filter-section">
                        <h3>{section.title}</h3>
                        {section.groups.map((group) => (
                          <div key={group.label} className="ataas-model-repo-filter-group">
                            <div className="ataas-model-repo-filter-group-title">{group.label}</div>
                            <div className="ataas-model-repo-filter-tag-grid">
                            {group.items.map((item) => {
                              const isCategory = section.title === '模型类别';
                              const active = isCategory ? modelRepoCategory === item : modelRepoFamily === item;
                              return (
                                <button
                                  key={item}
                                  type="button"
                                  className={active ? 'active' : ''}
                                  onClick={() => {
                                    if (isCategory) setModelRepoCategory(active ? 'all' : item);
                                    else setModelRepoFamily(active ? 'all' : item);
                                  }}
                                >
                                  {item}
                                </button>
                              );
                            })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </aside>
                  <main className="ataas-model-repo-main">
                    <div className="ataas-model-repo-toolbar ataas-deploy-list-toolbar">
                      <div className="ataas-model-repo-count"><strong>模型</strong><span>{filteredModelRepoData.length}个</span></div>
                      {(modelRepoCategory !== 'all' || modelRepoFamily !== 'all' || modelRepoSource !== 'all') && (
                        <Button className="ataas-model-repo-clear" type="text" onClick={() => { setModelRepoCategory('all'); setModelRepoFamily('all'); setModelRepoSource('all'); }}>清空筛选</Button>
                      )}
                      <Input.Search className="ataas-deploy-list-search ataas-model-repo-search" placeholder="请输入模型名称" value={modelRepoSearch} onChange={(e) => setModelRepoSearch(e.target.value)} allowClear size="middle" />
                      <div className="ataas-model-repo-toolbar-actions">
                        <Dropdown.Button
                          className="ataas-model-repo-task-button"
                          menu={{
                            items: [
                              { key: 'updateInfo', label: '更新模型信息' },
                              { key: 'importPrivate', label: '导入私有模型' },
                              { key: 'updateStatus', label: '更新模型状态' },
                            ],
                            onClick: ({ key }) => {
                              if (key === 'updateInfo') message.success('模型信息已更新');
                              if (key === 'importPrivate') setModelRepoImportOpen(true);
                              if (key === 'updateStatus') message.success('模型状态已更新');
                            },
                          }}
                          onClick={() => setModelRepoTaskOpen(true)}
                        >
                          查看任务
                        </Dropdown.Button>
                      </div>
                    </div>
                    <div className="ataas-model-repo-grid">
                      {filteredModelRepoData.map((item) => {
                        const logo = getModelLogo(item.name);
                        const updateTime = item.updatedAt ? item.updatedAt.slice(0, 16).replace('T', ' ') + ' 更新' : '';
                        return (
                          <div key={item.id} className="ataas-model-repo-card" onClick={() => setModelRepoDetail(item)}>
                            <div className="ataas-model-repo-card-glow" />
                            <div className="ataas-model-repo-card-head">
                              {logo ? <img src={logo} alt="" /> : <span className="ataas-model-repo-fallback-logo">{item.family.slice(0, 1)}</span>}
                              <div>
                                <strong>{item.name}</strong>
                                {item.source !== 'official' && <em>私有</em>}
                              </div>
                            </div>
                            <div className="ataas-model-repo-card-tags">
                              <span>{item.tags.categories}</span>
                              <span>{item.tags.weight_size}</span>
                              <span>{item.tags.quanted_type}</span>
                              <span>{item.tags.max_position_embeddings}</span>
                            </div>
                            <p>{item.description || '暂无描述'}</p>
                            <div className="ataas-model-repo-card-foot">
                              <span>{updateTime}</span>
                              <div>
                                <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); setActiveTab('deploy'); }}>部署</Button>
                                <Button size="small" onClick={(e) => { e.stopPropagation(); message.info(`删除模型: ${item.name}`); }}>删除</Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </main>
                </div>
              </div>
              </ConfigProvider>
            </div>
          );
      case 'deploy': return (
            <div className="ataas-section-stack">
              <DeployList
                data={deployServices}
                onDetail={handleDeployDetail}
                onStop={handleDeployStop}
                onMonitor={handleDeployMonitor}
                onExperience={handleDeployExperience}
                onLog={handleDeployLog}
                onRestartToggle={handleRestartToggle}
                onConcurrencyToggle={handleConcurrencyToggle}
                onOpenCreate={handleOpenCreate}
                onScalePd={handleScalePd}
                onNodeFilter={handleDeployNodeFilter}
                onScheduleDetail={handleScheduleDetail}
                viewModeValue={deployListViewMode}
                onViewModeChange={setDeployListViewMode}
                clusterFilterValue={deployListClusterFilter}
                onClusterFilterChange={setDeployListClusterFilter}
              />
            </div>
          );
      case 'startupTemplates': return (
            <div className="ataas-section-stack">
              <div className="ataas-panel ataas-startup-template-page ataas-deploy-list">
                <div className="ataas-deploy-list-toolbar">
                  <Input.Search
                    className="ataas-deploy-list-search"
                    placeholder="搜索模板名称"
                    value={startupTemplateSearch}
                    onChange={(event) => setStartupTemplateSearch(event.target.value)}
                    allowClear
                    size="middle"
                  />
                  <div style={{ flex: 1 }} />
                  <Button className="ataas-deploy-create-button" type="primary" icon={<PlusOutlined />} onClick={() => setStartupTemplateCreateOpen(true)}>
                    创建启动模板
                  </Button>
                </div>
                <div className="ataas-startup-template-grid">
                  {filteredStartupTemplates.map((template) => (
                    <div key={template.key} className="ataas-startup-template-card">
                      <div className="ataas-startup-template-card-head">
                        <div>
                          <strong>{template.name}</strong>
                          <span>{template.description}</span>
                        </div>
                      </div>
                      <div className="ataas-startup-template-meta">
                        <div><span>显卡类型</span><strong>{template.hardware}</strong></div>
                        <div><span>更新时间</span><strong>{template.updatedAt}</strong></div>
                      </div>
                      <div className="ataas-startup-template-actions">
                        <Button type="link" onClick={() => openStartupTemplateEditor(template)}>编辑</Button>
                        <Button type="link" onClick={() => {
                          Modal.confirm({
                            title: '确认删除',
                            content: '确定删除模板「' + template.name + '」吗？',
                            onOk: () => {
                              setStartupTemplates((prev) => prev.filter((t) => t.key !== template.key));
                              message.success('模板已删除');
                            },
                          });
                        }} style={{ color: '#E02D2D' }}>删除</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
      case 'benchmark': return (
            <div className="ataas-section-stack">
              <BenchmarkPage />
            </div>
          );
      case 'playgroundChat': return (
            <div className="ataas-section-stack">
              <PlaygroundChatPage />
            </div>
          );
      case 'images': return (
            <div className="ataas-section-stack">
              <ConfigProvider theme={{
                token: {
                  colorPrimary: '#6951FF',
                  colorPrimaryHover: '#5B42F3',
                  colorPrimaryActive: '#4E35DF',
                  controlOutline: 'rgba(105, 81, 255, 0.12)',
                },
                components: {
                  Table: { headerBg: '#f7f8fa' },
                },
              }}>
              <div className="ataas-panel ataas-image-page ataas-deploy-list">
                <div className="ataas-image-body" style={{ display: 'flex', gap: 16 }}>
                  <aside className="ataas-model-repo-filter" style={{ width: 180, flexShrink: 0 }}>
                    <div className="ataas-model-repo-filter-section ataas-model-repo-filter-section-first">
                      <h3>厂商</h3>
                      <div className="ataas-model-repo-filter-group">
                        <div className="ataas-model-repo-filter-tag-grid">
                          {[
                            { label: '全部', value: 'all' },
                            { label: 'NVIDIA', value: 'NVIDIA' },
                            { label: '昇腾', value: 'Ascend' },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={imageVendorFilter === item.value ? 'active' : ''}
                              onClick={() => setImageVendorFilter(item.value)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="ataas-model-repo-filter-section">
                      <h3>推理引擎</h3>
                      <div className="ataas-model-repo-filter-group">
                        <div className="ataas-model-repo-filter-tag-grid">
                          {[
                            { label: '全部', value: 'all' },
                            { label: 'vLLM', value: 'vLLM' },
                            { label: 'SGLang', value: 'SGLang' },
                            { label: 'KLLM', value: 'KLLM' },
                            { label: 'Triton', value: 'Triton' },
                            { label: 'MindIE', value: 'MindIE' },
                          ].map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              className={imageEngineFilter === item.value ? 'active' : ''}
                              onClick={() => setImageEngineFilter(item.value)}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </aside>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ataas-image-toolbar ataas-deploy-list-toolbar">
                      <div style={{ flex: 1 }} />
                      <Button className="ataas-deploy-create-button" icon={<PlusOutlined />} type="primary" onClick={() => setImageUploadOpen(true)}>上传镜像</Button>
                    </div>
                    <div className="ataas-deploy-table-wrap ataas-image-table-wrap">
                      <Table dataSource={filteredImages} rowKey="key" columns={imageColumns} pagination={false} />
                    </div>
                  </div>
                </div>
              </div>
              </ConfigProvider>
            </div>
          );
      case 'monitoring':
        if (monitorReportRow) return (
          <div className="ataas-section-stack">
            <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
              <div className="ataas-panel ataas-monitor-report-page ataas-deploy-list">
                <div className="ataas-monitor-report-title">
                  <Button className="ataas-monitor-report-back" type="text" icon={<ArrowLeftOutlined />} onClick={() => setMonitorReportRow(null)}>返回</Button>
                  <div className="ataas-monitor-report-model-title">
                    {getModelLogo(monitorReportRow.name) ? <img src={getModelLogo(monitorReportRow.name)} alt="" /> : <em>{monitorReportRow.name.slice(0, 1)}</em>}
                    <h2>{monitorReportRow.name}</h2>
                  </div>
                  <Select
                    className="ataas-monitor-model-switch-select"
                    showSearch
                    value={monitorReportRow.key}
                    placeholder="输入模型名称切换"
                    optionFilterProp="label"
                    suffixIcon={<SwapRightOutlined />}
                    onChange={(key) => {
                      const nextRow = allMonitorRows.find((row) => row.key === key);
                      if (nextRow) setMonitorReportRow(nextRow);
                    }}
                    options={allMonitorRows.map((row) => ({ value: row.key, label: row.name }))}
                  />
                </div>
                <div className="ataas-monitor-report-layout">
                  <main className="ataas-monitor-report-main">
                    <div className="ataas-monitor-summary ataas-monitor-report-summary">
                      {[
                        ['调用接口数', String(monitorReportRow.interfaceCount || 1), '个'],
                        ['调用总量', formatMonitorNumber(monitorReportRow.callTotal), '次'],
                        ['调用失败', formatMonitorNumber(monitorReportRow.callFailed), '次'],
                        ['调用总tokens数', formatMonitorTokens(monitorReportRow.totalTokens), 'tokens'],
                        ['输入tokens数', formatMonitorTokens(monitorReportRow.inputTokens), 'tokens'],
                        ['输出tokens数', formatMonitorTokens(monitorReportRow.outputTokens), 'tokens'],
                      ].map(([label, value, unit]) => (
                        <div key={label} className="ataas-monitor-stat">
                          <span>{label}</span>
                          <strong>{value}</strong>
                          <em>{unit}</em>
                        </div>
                      ))}
                    </div>
                    <div className="ataas-monitor-report-toolbar">
                      <Segmented
                        className="ataas-monitor-report-time-segment"
                        value={monitorTimePrecision}
                        onChange={(value) => setMonitorTimePrecision(value as MonitorTimePrecision)}
                        options={[{ value: 'day', label: '按日' }, { value: 'hour', label: '按时' }, { value: 'minute', label: '按分钟' }]}
                      />
                      <DatePicker.RangePicker className="ataas-log-range-picker ataas-monitor-report-date" defaultValue={undefined} placeholder={['2026-05-31', '2026-05-31']} />
                      <span>数据更新于 2026-05-31 17:53:30</span>
                      <div className="ataas-monitor-refresh-split">
                        <Button className="ataas-monitor-refresh-trigger" icon={<ReloadOutlined />} onClick={() => message.success('已手动刷新')} />
                        <Dropdown
                          trigger={['click']}
                          menu={{
                            selectedKeys: [monitorRefreshMode],
                            items: ['手动刷新', '每隔 5min 刷新', '每隔 15min 刷新', '每隔 30min 刷新', '每隔 1h 刷新'].map((label) => ({ key: label, label })),
                            onClick: ({ key }) => {
                              setMonitorRefreshMode(key);
                              message.success(key === '手动刷新' ? '已切换为手动刷新' : '刷新频率已更新');
                            },
                          }}
                          overlayClassName="ataas-monitor-refresh-menu"
                        >
                          <Button className="ataas-monitor-refresh-select">
                            <span>{monitorRefreshMode}</span>
                            <DownOutlined />
                          </Button>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="ataas-monitor-chart-grid">
                      {[
                        { title: '调用量（次）', legends: [{ name: '调用成功', color: '#4F46FF', value: Math.max(1, Math.round((monitorReportRow.callTotal - monitorReportRow.callFailed) / 96)) }, { name: '调用失败', color: '#8DDC7F', value: Math.max(1, Math.round(monitorReportRow.callFailed / 96)) }, { name: 'Prompt cache次数', color: '#DD8B6D', value: Math.max(1, Math.round(monitorReportRow.callTotal * Number(monitorReportRow.cacheHitRate.replace('%', '')) / 100 / 96)) }] },
                        { title: '调用tokens量（tokens）', legends: [{ name: '请求token数', color: '#4F46FF', value: Math.round(monitorReportRow.totalTokens / 96) }, { name: '输入tokens数', color: '#8DDC7F', value: Math.round(monitorReportRow.inputTokens / 96) }, { name: '输出tokens数', color: '#6FA9B3', value: Math.round(monitorReportRow.outputTokens / 96) }, { name: 'Prompt cache tokens数', color: '#DD8B6D', value: Math.round(monitorReportRow.totalTokens * Number(monitorReportRow.cacheHitRate.replace('%', '')) / 100 / 96) }] },
                        { title: '平均每请求输入输出tokens量（tokens）', legends: [{ name: '平均输入tokens', color: '#4F46FF', value: Math.round(monitorReportRow.inputTokens / monitorReportRow.callTotal) }, { name: '平均输出tokens', color: '#8DDC7F', value: Math.round(monitorReportRow.outputTokens / monitorReportRow.callTotal) }] },
                        { title: '调用失败率（百分比）', max: 5, legends: [{ name: '失败率', color: '#4F46FF', value: Number(monitorReportRow.failRate.replace('%', '')) }] },
                        { title: '4xx/5xx错误率（%）', max: 3, legends: [{ name: '4xx错误率', color: '#4F46FF', value: Number(monitorReportRow.failRate.replace('%', '')) * 0.62 }, { name: '5xx错误率', color: '#8DDC7F', value: Number(monitorReportRow.failRate.replace('%', '')) * 0.38 }] },
                        { title: 'TTFT：首Tokens时延（毫秒）', max: 600, hint: '仅统计流式响应', legends: [{ name: 'p99', color: '#4F46FF', value: monitorReportRow.avgTtft * 1.35 }, { name: 'p90', color: '#8DDC7F', value: monitorReportRow.avgTtft * 1.18 }, { name: 'p50', color: '#6FA9B3', value: monitorReportRow.avgTtft * 0.82 }] },
                        { title: 'TPOT：平均响应时间（毫秒）', max: 180, legends: [{ name: 'AVG', color: '#4F46FF', value: 68 + (monitorReportRow.avgTtft % 6) * 9 }] },
                        { title: '接口耗时（s）', max: 12, legends: [{ name: 'P50', color: '#4F46FF', value: 2.6 }, { name: 'P90', color: '#8DDC7F', value: 5.8 }, { name: 'P99', color: '#6FA9B3', value: 8.4 }] },
                        { title: 'OTPS（tokens/s）', max: 120, hint: '仅统计流式响应', legends: [{ name: 'p99', color: '#4F46FF', value: monitorReportRow.avgOtps * 1.22 }, { name: 'p90', color: '#8DDC7F', value: monitorReportRow.avgOtps * 1.08 }, { name: 'p50', color: '#6FA9B3', value: monitorReportRow.avgOtps * 0.76 }] },
                        { title: '各 Rank accept_length', max: 4096, legends: [{ name: '最小值', color: '#4F46FF', value: 768 + (monitorReportRow.avgTtft % 5) * 128 }, { name: '平均值', color: '#8DDC7F', value: 1792 + (monitorReportRow.avgTtft % 7) * 160 }] },
                        { title: 'RPM', max: 10000, legends: [{ name: 'RPM', color: '#4F46FF', value: Math.round(monitorReportRow.callTotal / 60) }, { name: 'RPM ratelimit', color: '#8DDC7F', value: 10000 }, { name: '成功RPM', color: '#6FA9B3', value: Math.round((monitorReportRow.callTotal - monitorReportRow.callFailed) / 60) }, { name: '失败RPM', color: '#DD8B6D', value: Math.max(1, Math.round(monitorReportRow.callFailed / 60)) }] },
                        { title: 'TPM', max: 800000, legends: [{ name: '总TPM', color: '#4F46FF', value: Math.round(monitorReportRow.totalTokens / 60) }, { name: '总TPM ratelimit', color: '#8DDC7F', value: 800000 }] },
                      ].map((chart) => (
                        <div key={chart.title} className="ataas-monitor-chart-card">
                          <div className="ataas-monitor-chart-head">
                            <div>
                              <strong>{chart.title}</strong>
                              {chart.hint && (
                                <span className="ataas-monitor-chart-hint">
                                  <ExclamationCircleOutlined />
                                  {chart.hint}
                                </span>
                              )}
                            </div>
                          </div>
                          <MonitorLineChart legends={chart.legends} timePrecision={monitorTimePrecision} max={chart.max} seed={`${monitorReportRow.key}-${chart.title}`} />
                        </div>
                      ))}
                    </div>
                  </main>
                </div>
              </div>
            </ConfigProvider>
          </div>
        );
        return (
            <div className="ataas-section-stack">
              <ConfigProvider theme={{
                token: {
                  colorPrimary: '#6738E8',
                  colorPrimaryHover: '#5D30D8',
                  colorPrimaryActive: '#5127C7',
                  controlOutline: 'rgba(103, 56, 232, 0.12)',
                },
                components: {
                  Table: { headerBg: '#f7f8fa' },
                },
              }}>
              <div className="ataas-panel ataas-monitor-page ataas-deploy-list">
                <div className="ataas-monitor-head">
                  <h2>调用统计</h2>
                </div>
                <div className="ataas-monitor-filter ataas-deploy-list-toolbar">
                </div>
                <div className="ataas-monitor-summary">
                  {[
                    ['调用接口数', formatMonitorNumber(monitorSummary.interfaceCount), '个'],
                    ['调用总量', formatMonitorNumber(monitorSummary.total), '次'],
                    ['调用失败', formatMonitorNumber(monitorSummary.failed), '次'],
                    ['调用总tokens数', formatMonitorTokens(monitorSummary.totalTokens), 'tokens'],
                    ['输入tokens数', formatMonitorTokens(monitorSummary.inputTokens), 'tokens'],
                    ['输出tokens数', formatMonitorTokens(monitorSummary.outputTokens), 'tokens'],
                  ].map(([label, value, unit]) => (
                    <div key={label} className="ataas-monitor-stat">
                      <span>{label}</span>
                      <strong>{value}</strong>
                      <em>{unit}</em>
                    </div>
                  ))}
                </div>
                <div className="ataas-monitor-table-panel">
	                  <div className="ataas-monitor-table-toolbar">
	                    <Select className="ataas-deploy-list-select ataas-monitor-cluster-select" value={monitorClusterFilter} onChange={setMonitorClusterFilter} options={clusterFilterOptions} size="middle" />
	                    <Input.Search className="ataas-deploy-list-search ataas-monitor-search" placeholder="请输入服务名称搜索" value={monitorSearchText} onChange={(e) => { setMonitorSearchText(e.target.value); setMonitorExactServiceName(''); }} allowClear size="middle" />
	                    <DatePicker.RangePicker className="ataas-log-range-picker ataas-monitor-range-picker" size="middle" defaultValue={undefined} placeholder={['2026-05-31', '2026-05-31']} />
	                    <Button className="ataas-deploy-create-button" type="primary" onClick={() => message.success('查询完成')}>查询</Button>
	                    <div style={{ flex: 1 }} />
		                    <Button className="ataas-monitor-light-button" icon={<ReloadOutlined />} onClick={() => message.success('已刷新')}>刷新</Button>
	                  </div>
                  <div className="ataas-deploy-table-wrap ataas-monitor-table-wrap">
                    <Table
                      dataSource={filteredMonitorRows}
                      rowKey="key"
                      columns={monitorColumns}
                      scroll={{ x: 1375 }}
                      pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共${t}条数据` }}
                    />
                  </div>
                </div>
              </div>
              </ConfigProvider>
            </div>
          );
      case 'logs': return (
            <div className="ataas-section-stack">
              <ConfigProvider theme={{
                token: {
                  colorPrimary: '#6951FF',
                  colorPrimaryHover: '#5B42F3',
                  colorPrimaryActive: '#4E35DF',
                  controlOutline: 'rgba(105, 81, 255, 0.12)',
                },
                components: {
                  Table: { headerBg: '#f7f8fa' },
                },
              }}>
              <div className="ataas-panel ataas-log-page ataas-deploy-list">
                <div className="ataas-log-toolbar ataas-deploy-list-toolbar">
                  <Select className="ataas-deploy-list-select ataas-log-time-select" size="middle" defaultValue="all" onChange={(v) => {
                    if (v === 'all') { setLogDateRange(null); return; }
                    const now = new Date();
                    const start = new Date(now.getTime() - parseInt(v) * 60 * 1000);
                    setLogDateRange([start.toISOString().slice(0, 16).replace('T', ' '), now.toISOString().slice(0, 16).replace('T', ' ')]);
                  }} options={[
                    { value: 'all', label: '全部时间' },
                    { value: '60', label: '近1小时' },
                    { value: '360', label: '近6小时' },
                    { value: '1440', label: '近24小时' },
                    { value: '10080', label: '近7天' },
                  ]} />
                  <span className="ataas-log-toolbar-divider" />
                  <DatePicker.RangePicker
                    className="ataas-log-range-picker"
                    size="middle"
                    placeholder={['开始日期', '结束日期']}
                    onChange={(dates) => {
                      if (dates && dates[0] && dates[1]) {
                        setLogDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD 23:59')]);
                      } else {
                        setLogDateRange(null);
                      }
                    }}
                  />
                  <div style={{ flex: 1 }} />
                  <Select className="ataas-deploy-list-select ataas-log-field-select" value={logSearchField} onChange={setLogSearchField} size="middle" options={[
                    { value: 'all', label: '全部' },
                    { value: 'user', label: '操作人' },
                    { value: 'action', label: '操作' },
                    { value: 'object', label: '对象' },
                    { value: 'status', label: '状态' },
                  ]} />
                  <Input.Search className="ataas-deploy-list-search ataas-log-search" placeholder="搜索日志..." value={logSearchText} onChange={(e) => setLogSearchText(e.target.value)} allowClear size="middle" />
                </div>
                <div className="ataas-deploy-table-wrap ataas-log-table-wrap">
                  <Table dataSource={filteredLogs} rowKey={(_, i) => String(i)} columns={logColumns} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }} />
                </div>
              </div>
              </ConfigProvider>
            </div>
          );
      case 'alerts': {
            const alertColumns: ColumnsType<AlertRecord> = [
              { title: '告警等级', dataIndex: 'level', key: 'level', width: 80, render: (v: string) => {
                const levelMap: Record<string, { color: string; label: string }> = { 'critical': { color: '#F53F3F', label: '紧急' }, 'warning': { color: '#FF7D00', label: '普通' }, 'info': { color: '#86909C', label: '轻微' } };
                const info = levelMap[v] || { color: '#4E5969', label: v };
                return <span style={{ color: info.color }}>{info.label}</span>;
              } },
              { title: '告警对象', dataIndex: 'target', key: 'target', width: 140 },
              { title: '发生时间', dataIndex: 'time', key: 'time', width: 160 },
              { title: '对象类型', dataIndex: 'objectType', key: 'objectType', width: 90 },
              { title: '所属集群', dataIndex: 'cluster', key: 'cluster', width: 150 },
              { title: '问题描述', dataIndex: 'description', key: 'description', width: 220 },
              { title: '处置建议', dataIndex: 'suggestion', key: 'suggestion', width: 200 },
              { title: '发生次数', dataIndex: 'count', key: 'count', width: 80, align: 'center' as const },
              { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => {
                const colorMap: Record<string, string> = { '未处理': '#E02D2D', '已恢复': '#00A11F' };
                if (v === '已恢复') {
                  return <span className="ataas-alert-table-status ataas-alert-table-status-restored" style={{ ['--status-color' as string]: colorMap[v] }}>{v}</span>;
                }
                return <span className="ataas-alert-table-status ataas-alert-table-status-pending" style={{ ['--status-color' as string]: colorMap[v] || '#E02D2D' }}>{v}</span>;
              }},
              { title: '操作', key: 'action', width: 110, render: (_, r) => (
                r.status !== '已恢复' ? (
                  <div className="ataas-alert-table-actions">
                    <Button className="ataas-alert-action-button" type="text" size="small" onClick={() => message.success('已恢复: ' + r.target)}>恢复</Button>
                    <Button className="ataas-alert-action-button muted" type="text" size="small" onClick={() => message.info('已忽略: ' + r.target)}>忽略</Button>
                  </div>
                ) : (
                  <span className="ataas-alert-action-empty">--</span>
                )
              )},
            ];
            return (
              <div className="ataas-section-stack">
                <ConfigProvider theme={{
                  token: {
                    colorPrimary: '#6951FF',
                    colorPrimaryHover: '#5B42F3',
                    colorPrimaryActive: '#4E35DF',
                    controlOutline: 'rgba(105, 81, 255, 0.12)',
                  },
                  components: {
                    Table: { headerBg: '#f7f8fa' },
                  },
                }}>
                <div className="ataas-panel ataas-alert-page ataas-deploy-list">
                  <div className="ataas-alert-toolbar ataas-deploy-list-toolbar">
                    <Select className="ataas-deploy-list-select ataas-alert-time-select" size="middle" defaultValue="1440" onChange={(v) => {
                      setAlertClusterFilter(null);
                      if (v === 'all') { setAlertDateRange(null); return; }
                      const now = new Date();
                      const start = new Date(now.getTime() - parseInt(v) * 60 * 1000);
                      setAlertDateRange([start.toISOString().slice(0, 16).replace('T', ' '), now.toISOString().slice(0, 16).replace('T', ' ')]);
                    }} options={[
                      { value: 'all', label: '全部时间' },
                      { value: '60', label: '近1小时' },
                      { value: '360', label: '近6小时' },
                      { value: '1440', label: '近24小时' },
                      { value: '10080', label: '近7天' },
                    ]} />
                    <span className="ataas-log-toolbar-divider" />
                    <DatePicker.RangePicker
                      className="ataas-log-range-picker ataas-alert-range-picker"
                      size="middle"
                      placeholder={['开始日期', '结束日期']}
                      onChange={(dates) => {
                        setAlertClusterFilter(null);
                        if (dates && dates[0] && dates[1]) {
                          setAlertDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD 23:59')]);
                        } else {
                          setAlertDateRange(null);
                        }
                      }}
                    />
                    <div style={{ flex: 1 }} />
                    {alertClusterFilter && (
                      <Button className="ataas-alert-filter-clear" type="text" onClick={() => setAlertClusterFilter(null)}>
                        {alertClusterFilter}
                        <CloseCircleOutlined />
                      </Button>
                    )}
                    <Select className="ataas-deploy-list-select" value={alertLevelFilter} onChange={setAlertLevelFilter} size="middle" style={{ width: 100, marginRight: 8 }} options={[
                      { value: 'all', label: '全部分类' },
                      { value: 'critical', label: '紧急' },
                      { value: 'warning', label: '普通' },
                      { value: 'info', label: '轻微' },
                    ]} />
                    <Input.Search className="ataas-deploy-list-search" placeholder="搜索告警..." value={alertSearchText} onChange={(e) => setAlertSearchText(e.target.value)} allowClear size="middle" style={{ width: 200 }} />
                  </div>
                  <div className="ataas-deploy-table-wrap ataas-alert-table-wrap">
                    <Table dataSource={filteredAlerts} rowKey="key" columns={alertColumns} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }} />
                  </div>
                </div>
                </ConfigProvider>
              </div>
            );
          }
      default: return null;
    }
  };

  return (
    <div className="ataas-page">
      <div className="ataas-body">
        <div className="ataas-sidebar">
          <div className="ataas-sidebar-header"><img className="ataas-sidebar-logo" src={ataasLogo} alt="ATaaS" /></div>
          <div className="ataas-sidebar-nav">
            {SIDEBAR_ITEMS.map((item) => (
              <div key={item.key} className={'ataas-sidebar-item' + (activeTab === item.key ? ' active' : '')} onClick={() => {
                setActiveTab(item.key);
                window.history.replaceState(null, '', item.key === 'benchmark' ? '/benchmark' : item.key === 'playgroundChat' ? '/playground/chat' : '/');
              }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="ataas-sidebar-user">
            <div className="ataas-sidebar-user-avatar">A</div>
            <strong>admin</strong>
            <Popover
              trigger="hover"
              placement="topRight"
              overlayClassName="ataas-sidebar-user-popover"
              content={(
                <div className="ataas-sidebar-user-menu">
                  <button type="button" onClick={() => message.info('主题管理')}>主题管理</button>
                  <button type="button" onClick={() => message.info('设置')}>设置</button>
                  <button type="button" onClick={() => message.info('退出登录')}>退出登录</button>
                </div>
              )}
            >
              <button className="ataas-sidebar-user-setting" type="button" aria-label="用户设置"><SettingOutlined /></button>
            </Popover>
          </div>
        </div>
        <div className="ataas-content">
          {renderTabContent()}
        </div>
      </div>

      <Modal title="纳管集群" open={clusterCreateOpen} onCancel={() => { setClusterCreateName(''); setClusterCreateUrl(''); setClusterCreateAccessKey(''); setClusterCreateOpen(false); }} onOk={() => { if (clusterCreateName && clusterCreateUrl && clusterCreateAccessKey) { setClusterList((prev) => [...prev, { key: `cluster-${Date.now()}`, name: clusterCreateName, region: '待配置', nodes: 0, gpu: '待同步', gpuTypes: [], gpuUsage: 0, cpu: '-', memory: '-', models: 0, status: 'healthy', authInfo: '0/0' }]); setClusterCreateName(''); setClusterCreateUrl(''); setClusterCreateAccessKey(''); setClusterCreateOpen(false); } }} okText="确认" okButtonProps={{ className: 'ataas-modal-primary-button' }} width={640}>
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f7f8fa', borderRadius: 6, fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Token 获取方式</div>
          <div style={{ marginBottom: 8 }}>在集群中创建 ServiceAccount 并绑定 ClusterRole，获取 Token：</div>
          <pre style={{ background: '#e8eaf0', padding: '10px 12px', borderRadius: 4, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
{`apiVersion: v1
kind: ServiceAccount
metadata:
  name: ataas-manager
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ataas-manager-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: ataas-manager
    namespace: kube-system`}
          </pre>
          <div style={{ marginTop: 8 }}>创建后执行以下命令获取 Token：</div>
          <code style={{ display: 'block', background: '#e8eaf0', padding: '6px 10px', borderRadius: 4, fontSize: 12, marginTop: 4 }}>kubectl -n kube-system create token ataas-manager</code>
        </div>
        <Form layout="vertical" className="ataas-basic-form">
          <Form.Item label="集群名称" required>
            <Input placeholder="例如：beijing-prod" value={clusterCreateName} onChange={(e) => setClusterCreateName(e.target.value)} />
          </Form.Item>
          <Form.Item label="ApiServer 地址" required>
            <Input placeholder="https://kubernetes.default.svc" value={clusterCreateUrl} onChange={(e) => setClusterCreateUrl(e.target.value)} />
          </Form.Item>
          <Form.Item label="Token" required>
            <Input.TextArea rows={4} placeholder="粘贴集群 Token（Base64 编码）" value={clusterCreateAccessKey} onChange={(e) => setClusterCreateAccessKey(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="选择展示集群"
        open={overviewClusterPickerOpen}
        onCancel={() => { setOverviewClusterPickerOpen(false); setOverviewClusterPickerSlot(null); }}
        footer={[
          <Button
            key="clear"
            onClick={() => {
              if (overviewClusterPickerSlot !== null) {
                setOverviewClusterSlots((prev) => prev.map((key, index) => (index === overviewClusterPickerSlot ? null : key)));
              }
              setOverviewClusterPickerOpen(false);
              setOverviewClusterPickerSlot(null);
            }}
          >
            恢复加号
          </Button>,
          <Button key="cancel" onClick={() => { setOverviewClusterPickerOpen(false); setOverviewClusterPickerSlot(null); }}>取消</Button>,
        ]}
        width={560}
      >
        <div className="ataas-cluster-picker-list">
          {clusterList.map((cluster) => {
            const active = overviewClusterPickerSlot !== null && cluster.key === overviewClusterSlots[overviewClusterPickerSlot];
            return (
              <button
                key={cluster.key}
                type="button"
                className={'ataas-cluster-picker-item' + (active ? ' active' : '')}
                onClick={() => {
                  if (overviewClusterPickerSlot !== null) {
                    setOverviewClusterSlots((prev) => prev.map((key, index) => (index === overviewClusterPickerSlot ? cluster.key : key)));
                  }
                  setOverviewClusterPickerOpen(false);
                  setOverviewClusterPickerSlot(null);
                }}
              >
                <div>
                  <strong>{cluster.name}</strong>
                  <span>{cluster.region} · {cluster.gpu}</span>
                </div>
                <em>{cluster.nodes} 节点 / {cluster.models} 模型</em>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal
        title="选择显卡类别"
        open={overviewGpuPickerOpen}
        onCancel={() => { setOverviewGpuPickerOpen(false); setOverviewGpuPickerSlot(null); }}
        footer={[
          <Button
            key="clear"
            onClick={() => {
              if (overviewGpuPickerSlot !== null) {
                setOverviewGpuSlots((prev) => prev.map((key, index) => (index === overviewGpuPickerSlot ? null : key)));
              }
              setOverviewGpuPickerOpen(false);
              setOverviewGpuPickerSlot(null);
            }}
          >
            恢复加号
          </Button>,
          <Button key="cancel" onClick={() => { setOverviewGpuPickerOpen(false); setOverviewGpuPickerSlot(null); }}>取消</Button>,
        ]}
        width={560}
      >
        <div className="ataas-cluster-picker-list">
          {gpuTypeCards.map((gpu) => {
            const active = overviewGpuPickerSlot !== null && gpu.key === overviewGpuSlots[overviewGpuPickerSlot];
            return (
              <button
                key={gpu.key}
                type="button"
                className={'ataas-cluster-picker-item' + (active ? ' active' : '')}
                onClick={() => {
                  if (overviewGpuPickerSlot !== null) {
                    setOverviewGpuSlots((prev) => prev.map((key, index) => (index === overviewGpuPickerSlot ? gpu.key : key)));
                  }
                  setOverviewGpuPickerOpen(false);
                  setOverviewGpuPickerSlot(null);
                }}
              >
                <div>
                  <strong>{gpu.name}</strong>
                  <span>{gpu.subtitle}</span>
                </div>
                <em>{gpu.nodes} 节点 / {gpu.gpuCards} 卡 / {gpu.models} 模型</em>
              </button>
            );
          })}
        </div>
      </Modal>


      <Modal
        title="编辑节点名称"
        open={!!clusterNodeEditTarget}
        onCancel={() => { setClusterNodeEditTarget(null); setClusterNodeEditName(''); }}
        onOk={() => {
          if (clusterNodeEditTarget && clusterNodeEditName.trim()) {
            setClusterNodeList((prev) => prev.map((node) => node.key === clusterNodeEditTarget.key ? { ...node, name: clusterNodeEditName.trim() } : node));
            if (clusterNodeRecord?.key === clusterNodeEditTarget.key) setClusterNodeRecord({ ...clusterNodeRecord, name: clusterNodeEditName.trim() });
          }
          setClusterNodeEditTarget(null);
          setClusterNodeEditName('');
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input value={clusterNodeEditName} onChange={(e) => setClusterNodeEditName(e.target.value)} placeholder="请输入节点名称" />
      </Modal>

      <Modal title="集群认证" open={clusterTokenOpen} onCancel={() => setClusterTokenOpen(false)} onOk={() => setClusterTokenOpen(false)}><Input.TextArea rows={4} value={clusterTokenText} onChange={(e) => setClusterTokenText(e.target.value)} /></Modal>

      <Modal title="更新 Token" open={clusterKeyEditOpen} onCancel={() => setClusterKeyEditOpen(false)} onOk={() => { if (clusterKeyEditTarget) { message.success('集群 ' + clusterKeyEditTarget.name + ' Token 已更新'); } setClusterKeyEditOpen(false); }} okButtonProps={{ className: 'ataas-modal-primary-button' }} width={560}>
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#f7f8fa', borderRadius: 6, fontSize: 13, lineHeight: 1.8 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Token 获取方式</div>
          <div style={{ marginBottom: 4, fontSize: 12, color: '#4E5969' }}>如未创建过 ServiceAccount，可参考以下 YAML 创建：</div>
          <pre style={{ background: '#e8eaf0', padding: '10px 12px', borderRadius: 4, fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '0 0 8px 0' }}>
{`apiVersion: v1
kind: ServiceAccount
metadata:
  name: ataas-manager
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ataas-manager-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: ataas-manager
    namespace: kube-system`}
          </pre>
          <div style={{ marginTop: 4, fontSize: 12, color: '#4E5969' }}>已创建过的可直接执行以下命令获取 Token：</div>
          <code style={{ display: 'block', background: '#e8eaf0', padding: '6px 10px', borderRadius: 4, fontSize: 12, marginTop: 4 }}>kubectl -n kube-system create token ataas-manager</code>
        </div>
        <Input.TextArea rows={4} placeholder="请输入新的 Token" value={clusterKeyEditValue} onChange={(e) => setClusterKeyEditValue(e.target.value)} />
      </Modal>
      <Modal title="确认删除" open={!!clusterDeleteConfirm} onCancel={() => setClusterDeleteConfirm(null)} onOk={() => { if (clusterDeleteConfirm) { setClusterList((prev) => prev.filter((c) => c.key !== clusterDeleteConfirm!.key)); } setClusterDeleteConfirm(null); }} okText="删除"><p>确定要删除集群 <strong>{clusterDeleteConfirm?.name}</strong> 吗？此操作不可撤销。</p></Modal>

      <Modal title="操作详情" open={!!logDetailRecord} onCancel={() => setLogDetailRecord(null)} footer={null} width={520}>
        {logDetailRecord && (
          <div className="ataas-single-config-summary">
            <div><span>操作人</span><strong>{logDetailRecord.user}</strong></div>
            <div><span>操作</span><strong>{logDetailRecord.action}</strong></div>
            <div><span>操作对象</span><strong>{logDetailRecord.object}</strong></div>
            <div><span>状态</span><strong>{logDetailRecord.status}</strong></div>
            <div><span>时间</span><strong>{logDetailRecord.time}</strong></div>
            <div><span>详情</span><strong style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{logDetailRecord.detail}</strong></div>
          </div>
        )}
      </Modal>

      <Modal title="模型详情" open={!!modelRepoDetail} onCancel={() => setModelRepoDetail(null)} footer={null} width={640}>
        {modelRepoDetail && (
          <div className="ataas-single-config-summary">
            <div><span>模型名称</span><strong>{modelRepoDetail.name}</strong></div>
            <div><span>提供方</span><strong>{modelRepoDetail.family}</strong></div>
            <div><span>来源</span><strong>{modelRepoDetail.source === 'official' ? '官方模型' : '私有模型'}</strong></div>
            <div><span>类别</span><strong>{modelRepoDetail.tags.categories}</strong></div>
            <div><span>参数规模</span><strong>{modelRepoDetail.tags.weight_size}</strong></div>
            <div><span>量化类型</span><strong>{modelRepoDetail.tags.quanted_type}</strong></div>
            <div><span>上下文长度</span><strong>{modelRepoDetail.tags.max_position_embeddings}</strong></div>
            <div><span>状态</span><strong>{modelRepoDetail.status === 'installed' ? (modelRepoDetail.serveStatus === 'serving' ? '服务中' : '已安装') : '未下载'}</strong></div>
            <div><span>更新时间</span><strong>{modelRepoDetail.updatedAt.slice(0, 16).replace('T', ' ')}</strong></div>
            <div><span>描述</span><strong style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.6 }}>{modelRepoDetail.description}</strong></div>
          </div>
        )}
      </Modal>

      <Drawer className="ataas-schedule-detail-drawer" title="定时任务配置参数" open={!!scheduleDetailTarget} onClose={() => setScheduleDetailTarget(null)} width={560}>
        {scheduleDetailTarget && (() => {
          const template = getScheduleDetailTemplate(scheduleDetailTarget);
          const taskNodes = getScheduleDetailNodes(scheduleDetailTarget);
          const taskType = scheduleDetailTarget.scheduleCountdownAction === '扩缩' ? '定时扩缩' : '定时启停';
          return (
            <div className="ataas-schedule-detail">
              <div className="ataas-schedule-detail-title">
                <span>{taskType}</span>
                <strong>{scheduleDetailTarget.name}</strong>
              </div>
              <div className="ataas-schedule-detail-grid">
                <div><span>任务动作</span><strong>{scheduleDetailTarget.scheduleCountdownAction || '执行'}</strong></div>
                <div><span>执行时间</span><strong>{scheduleDetailTarget.scheduleCountdownAt || '-'}</strong></div>
                <div><span>服务组</span><strong>{scheduleDetailTarget.serviceGroupName ? `Group: ${scheduleDetailTarget.serviceGroupName}` : '-'}</strong></div>
                <div><span>目标模型</span><strong>{scheduleDetailTarget.name}</strong></div>
                <div><span>部署方式</span><strong>{scheduleDetailTarget.deployMode || '-'}</strong></div>
                <div><span>实例数</span><strong>{scheduleDetailTarget.modelInfo.number}</strong></div>
                <div><span>循环策略</span><strong>{scheduleDetailTarget.scheduleRepeatDaily ? '每天循环' : '单次执行'}</strong></div>
                <div><span>异常告警</span><strong>{scheduleDetailTarget.scheduleAlertWebhook ? '已启用 Feishu Webhook' : '未启用'}</strong></div>
              </div>
              {template && (
                <div className="ataas-schedule-detail-section">
                  <div className="ataas-schedule-detail-section-head">启动模板</div>
                  <div className="ataas-schedule-detail-grid">
                    <div><span>模板名称</span><strong>{template.name}</strong></div>
                    <div><span>推理引擎</span><strong>{template.engine}</strong></div>
                    <div><span>运行环境</span><strong>{template.hardware}</strong></div>
                    <div><span>节点/显卡</span><strong>{template.nodeCount} 节点 / {template.cardCount} 卡</strong></div>
                    <div><span>镜像</span><strong>{images.find((image) => image.key === template.imageKey)?.name || template.imageKey || '-'}</strong></div>
                    <div><span>部署拓扑</span><strong>{template.topology}</strong></div>
                  </div>
                </div>
              )}
              <div className="ataas-schedule-detail-section">
                <div className="ataas-schedule-detail-section-head">执行节点</div>
                {taskNodes.length > 0 ? (
                  <div className="ataas-schedule-detail-node-list">
                    {taskNodes.map((node) => (
                      <div key={node.key}>
                        <strong>{node.name}</strong>
                        <span>{node.ip}</span>
                        <em>{node.gpuType} / {node.availableCards} 卡可用</em>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ataas-schedule-detail-empty">暂无节点信息</div>
                )}
              </div>
              <div className="ataas-schedule-detail-section">
                <div className="ataas-schedule-detail-section-head">告警参数</div>
                <div className="ataas-schedule-detail-webhook">{scheduleDetailTarget.scheduleAlertWebhook || '未启用'}</div>
              </div>
            </div>
          );
        })()}
      </Drawer>

      <Drawer title="导入私有模型" open={modelRepoImportOpen} onClose={() => setModelRepoImportOpen(false)} width={520}>
        <Form layout="vertical">
          <Form.Item label="模型名称" required><Input placeholder="例如：finance-risk-private-13B" /></Form.Item>
          <Form.Item label="模型类型" required><Select options={[{ value: 'llm', label: '文本模型' }, { value: 'embedding', label: '嵌入模型' }, { value: 'rerank', label: '排序模型' }, { value: 'vlm', label: '多模态模型' }]} /></Form.Item>
          <Form.Item label="模型路径" required><Input placeholder="/data/models/customer-model" /></Form.Item>
          <Form.Item label="参数规模"><Input placeholder="例如：13B" /></Form.Item>
          <Form.Item label="量化类型"><Select options={[{ value: 'BF16', label: 'BF16' }, { value: 'FP16', label: 'FP16' }, { value: 'INT8', label: 'INT8' }, { value: 'INT4', label: 'INT4' }]} /></Form.Item>
          <Form.Item label="描述"><Input.TextArea rows={4} placeholder="描述模型能力和适用场景" /></Form.Item>
          <Button className="ataas-deploy-create-button" type="primary" block onClick={() => { message.success('私有模型导入任务已创建'); setModelRepoImportOpen(false); }}>开始导入</Button>
        </Form>
      </Drawer>

      <Drawer title="模型任务" open={modelRepoTaskOpen} onClose={() => setModelRepoTaskOpen(false)} width={420}>
        <div className="ataas-model-task-drawer">
          {[
            { name: 'Qwen2.5-72B-Instruct', desc: '模型信息同步', status: '已完成', progress: 100 },
            { name: 'finance-risk-private-13B', desc: '私有模型导入', status: '进行中', progress: 64 },
            { name: 'BGE-Reranker-V2-M3', desc: '模型状态更新', status: '等待中', progress: 0 },
          ].map((task) => (
            <div key={task.name} className="ataas-model-task-item">
              <div className="ataas-model-task-item-head">
                <div>
                  <strong>{task.name}</strong>
                  <span>{task.desc}</span>
                </div>
                <em className={task.status === '进行中' ? 'running' : task.status === '已完成' ? 'done' : ''}>{task.status}</em>
              </div>
              <div className="ataas-model-task-progress"><i style={{ width: `${task.progress}%` }} /></div>
            </div>
          ))}
        </div>
      </Drawer>

      <Drawer className="ataas-startup-template-create-drawer" title={startupTemplateEditing ? '编辑启动模板' : '创建启动模板'} open={startupTemplateCreateOpen} onClose={resetStartupTemplateCreate} width={620}>
        <Form form={startupTemplateForm} className="ataas-startup-template-create-form" layout="vertical" onFinish={() => {
          const values = startupTemplateForm.getFieldsValue();
          if (!values.name || !templateGpuType.length || !templateYamlContent.trim()) return;
          const yamlLines = templateYamlContent.trim().split('\n');
          const getYamlValue = (key: string): string | undefined => {
            const line = yamlLines.find(l => l.trim().startsWith(key + ':') || l.trim().startsWith(key + ': '));
            return line ? line.split(':').slice(1).join(':').trim() : undefined;
          };
          const nextTemplate: StartupTemplateRecord = {
            key: startupTemplateEditing?.key || `tpl-${Date.now()}`,
            name: values.name,
            yamlContent: templateYamlContent,
            engine: getYamlValue('engine') || '-',
            modelFamily: getYamlValue('modelFamily') || '-',
            deployMode: templateDeployMode || getYamlValue('deployMode') || '-',
            hardware: templateGpuType.join(', ') || '-',
            nodeCount: parseInt(getYamlValue('nodeCount') || '1'),
            cardCount: parseInt(getYamlValue('cardCount') || '1'),
            topology: getYamlValue('topology') || '-',
            command: getYamlValue('command') || '',
            params: [],
            description: values.description || getYamlValue('description') || values.name,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          };
          setStartupTemplates((prev) => (
            startupTemplateEditing
              ? prev.map((t) => (t.key === startupTemplateEditing.key ? nextTemplate : t))
              : [nextTemplate, ...prev]
          ));
          message.success(startupTemplateEditing ? '启动模板已更新' : '启动模板已创建');
          resetStartupTemplateCreate();
        }}>
          <Form.Item label="模版名称" name="name" required rules={[{ required: true, message: '请输入模版名称' }]}>
            <Input placeholder="例如：DeepSeek-R1 SGLang PD 生产模板" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={2} placeholder="描述适用模型、环境限制或调优说明" />
          </Form.Item>
          <Form.Item label="部署方式" required>
            <Select value={templateDeployMode} onChange={setTemplateDeployMode} placeholder="请选择部署方式" options={[
              { value: 'router', label: 'Router' },
              { value: 'pd worker', label: 'PD Worker' },
              { value: '单机', label: '单机部署' },
              { value: '分布式', label: '分布式部署' },
            ]} />
          </Form.Item>
          <Form.Item label="支持的显卡类型" required>
            <Select mode="multiple" value={templateGpuType} onChange={setTemplateGpuType} placeholder="请选择支持的显卡类型" options={[
              { value: 'NVIDIA A100', label: 'NVIDIA A100' },
              { value: 'NVIDIA H20', label: 'NVIDIA H20' },
              { value: 'NVIDIA L20', label: 'NVIDIA L20' },
              { value: 'Ascend 910B', label: 'Ascend 910B' },
            ]} />
          </Form.Item>
          <Form.Item label="YAML 配置" required>
            <div style={{ marginBottom: 8 }}>
              <Upload.Dragger
                beforeUpload={(file) => {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const text = e.target?.result as string;
                    setTemplateYamlContent(text);
                  };
                  reader.readAsText(file);
                  return false;
                }}
                multiple={false}
                accept=".yaml,.yml"
                showUploadList={false}
                style={{ marginBottom: 8 }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽 YAML 文件到此区域</p>
              </Upload.Dragger>
            </div>
            <Input.TextArea
              rows={10}
              placeholder={'# 在此填写 YAML 配置，或拖拽 YAML 文件到上方区域\nname: my-template\nengine: SGLang\nmodelFamily: DeepSeek\ndeployMode: PD 分离\nhardware: NVIDIA H20\nnodeCount: 2\ncardCount: 16\ntopology: 2P2D / TP8 / EP1\ncommand: python -m sglang.launch_server ...\ndescription: 生产环境推理模板'}
              value={templateYamlContent}
              onChange={(e) => setTemplateYamlContent(e.target.value)}
              className="ataas-startup-template-yaml-input"
            />
          </Form.Item>

          <div className="ataas-startup-create-actions">
            <Button onClick={resetStartupTemplateCreate}>取消</Button>
            <Button type="primary" htmlType="submit">{startupTemplateEditing ? '更新' : '创建'}</Button>
          </div>
        </Form>
      </Drawer>

      <Modal title="镜像详情" open={imageDrawerOpen} onCancel={() => setImageDrawerOpen(false)} footer={null} width={640}>{imageDrawerRecord && <div className="ataas-single-config-summary"><div><span>镜像名称</span><strong>{imageDrawerRecord.name}</strong></div><div><span>标签</span><strong style={{ fontSize: 12 }}>{imageDrawerRecord.tag}</strong></div><div><span>大小</span><strong>{imageDrawerRecord.size}</strong></div><div><span>引擎</span><strong>{imageDrawerRecord.engine}</strong></div><div><span>GPU 类型</span><strong>{imageDrawerRecord.gpuType}</strong></div><div><span>运行时</span><strong style={{ fontSize: 12 }}>{imageDrawerRecord.runtime}</strong></div><div><span>硬件兼容</span><strong style={{ fontSize: 12 }}>{imageDrawerRecord.hardware}</strong></div><div><span>适用模型</span><strong style={{ fontSize: 12 }}>{imageDrawerRecord.models}</strong></div><div><span>导入方式</span><strong>{imageDrawerRecord.importMethod}</strong></div></div>}</Modal>

      <Drawer title="上传镜像" open={imageUploadOpen} onClose={() => setImageUploadOpen(false)} width={480}><Form layout="vertical"><Form.Item label="镜像名称"><Input placeholder="请输入镜像名称" /></Form.Item><Form.Item label="镜像标签"><Input placeholder="registry.example.com/namespace/image:tag" /></Form.Item><Form.Item label="引擎类型"><Select options={[{ value: 'vLLM', label: 'vLLM' }, { value: 'SGLang', label: 'SGLang' }, { value: 'Triton', label: 'Triton' }, { value: 'MindIE', label: 'MindIE' }]} placeholder="请选择引擎" /></Form.Item><Form.Item label="GPU 类型"><Select options={[{ value: 'NVIDIA', label: 'N卡' }, { value: 'Ascend', label: '昇腾' }]} placeholder="请选择 GPU 类型" /></Form.Item><Form.Item label="镜像文件"><Upload.Dragger beforeUpload={() => false} multiple={false} accept=".tar,.tar.gz,.tgz"><p className="ant-upload-drag-icon"><InboxOutlined /></p><p className="ant-upload-text">点击或拖拽 Docker 镜像包到此区域</p><p className="ant-upload-hint">支持 .tar / .tar.gz 格式</p></Upload.Dragger></Form.Item><Form.Item label="描述"><Input.TextArea rows={4} placeholder="请输入镜像描述" /></Form.Item><Button type="primary" block>开始上传</Button></Form></Drawer>

      <Modal className="ataas-node-select-modal" title="选择节点" open={singleNodeModal} onCancel={() => setSingleNodeModal(false)} footer={deployMode === 'distributed' ? (() => {
        const currentGpuType = selectedDeployNodes.length > 0 ? deployNodes.find((n) => n.key === selectedDeployNodes[0])?.gpuType : null;
        return <div className="ataas-node-select-footer"><span>已选 {selectedDeployNodes.length} 个节点{currentGpuType ? `（${currentGpuType}）` : ''}，仅可选择同类型显卡节点</span><div><Button onClick={() => setSingleNodeModal(false)}>取消</Button><Button type="primary" onClick={() => { setDeployMachineCount(selectedDeployNodes.length); setSingleNodeModal(false); }}>确认</Button></div></div>;
      })() : (
        <div className="ataas-node-select-footer"><span>{selectedSingleNode ? `已选 ${deployNodes.find((n) => n.key === selectedSingleNode)?.name || ''}` : '请选择一个可用节点'}</span><div><Button onClick={() => setSingleNodeModal(false)}>取消</Button><Button type="primary" disabled={!selectedSingleNode} onClick={() => setSingleNodeModal(false)}>确认</Button></div></div>
      )} width={760}>
        <div className="ataas-node-picker-modal-head">
          <Select value={singleNodeGpuFilter} onChange={setSingleNodeGpuFilter} className="ataas-node-select-filter" options={[
            { value: 'all', label: '全部显卡' },
            ...Array.from(new Set(deployNodes.map((n) => n.gpuType))).map((g) => ({ value: g, label: g })),
          ]} />
          <Input.Search placeholder="搜索节点名或 IP" className="ataas-node-select-search" value={singleNodeSearch} onChange={(e) => setSingleNodeSearch(e.target.value)} allowClear />
        </div>
        <div className="ataas-node-select-table-wrap">
          {deployMode === 'distributed' ? (
            (() => {
            const currentGpuType = selectedDeployNodes.length > 0 ? deployNodes.find((n) => n.key === selectedDeployNodes[0])?.gpuType : null;
            return (
              <Table dataSource={deployNodes.filter((n) => {
                if (singleNodeGpuFilter !== 'all' && n.gpuType !== singleNodeGpuFilter) return false;
                if (singleNodeSearch) {
                  const q = singleNodeSearch.toLowerCase();
                  return n.name.toLowerCase().includes(q) || n.ip.includes(q);
                }
                return true;
              })} rowKey="key" pagination={{ pageSize: 6, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }}
                rowSelection={{
                  type: 'checkbox',
                  selectedRowKeys: selectedDeployNodes,
                  onSelect: (record) => {
                    if (currentGpuType && record.gpuType !== currentGpuType) return;
                    setSelectedDeployNodes((prev) =>
                      prev.includes(record.key) ? prev.filter((k) => k !== record.key) : [...prev, record.key]
                    );
                  },
                  getCheckboxProps: (r) => ({
                    disabled: r.status !== 'ready' || (currentGpuType !== null && currentGpuType !== r.gpuType),
                  }),
                }}
                columns={[
                  { title: '节点名称', dataIndex: 'name', key: 'name', render: (v, r) => <><strong className="ataas-node-select-name">{v}</strong><span className="ataas-table-sub">{r.ip}</span></> },
                  { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (v) => <span className="ataas-node-select-gpu">{v}</span> },
                  { title: '可用卡数', key: 'cards', render: (_, r) => <span className="ataas-node-select-card-count">{r.availableCards} / {r.totalCards}</span> },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (v) => <span className={'ataas-node-select-status ' + v}>{v === 'ready' ? '可用' : v === 'busy' ? '繁忙' : '异常'}</span> },
                ]} />
            );
          })()
        ) : (
          <Table dataSource={deployNodes.filter((n) => {
            if (singleNodeGpuFilter !== 'all' && n.gpuType !== singleNodeGpuFilter) return false;
            if (singleNodeSearch) {
              const q = singleNodeSearch.toLowerCase();
              return n.name.toLowerCase().includes(q) || n.ip.includes(q);
            }
            return true;
          })} rowKey="key" pagination={{ pageSize: 6, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }} onRow={(r) => ({
            onClick: () => { if (r.status === 'ready') { setSelectedSingleNode(r.key); setSingleCardCount(0); } },
            className: selectedSingleNode === r.key ? 'ataas-node-select-row-selected' : '',
            style: { cursor: r.status === 'ready' ? 'pointer' : 'not-allowed', opacity: r.status === 'ready' ? 1 : 0.5 },
          })} columns={[
            { title: '节点名称', dataIndex: 'name', key: 'name', render: (v, r) => <><strong className="ataas-node-select-name">{v}</strong><span className="ataas-table-sub">{r.ip}</span></> },
            { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (v) => <span className="ataas-node-select-gpu">{v}</span> },
            { title: '可用卡数', key: 'cards', render: (_, r) => <span className="ataas-node-select-card-count">{r.availableCards} / {r.totalCards}</span> },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v) => <span className={'ataas-node-select-status ' + v}>{v === 'ready' ? '可用' : v === 'busy' ? '繁忙' : '异常'}</span> },
            { title: '操作', key: 'action', render: (_, r) => <span className={'ataas-node-select-action' + (selectedSingleNode === r.key ? ' selected' : '')}>{selectedSingleNode === r.key ? '已选' : '选择'}</span> },
          ]} />
        )}
        </div>
      </Modal>

<Drawer title={`节点详情 - ${clusterNodeModalTitle}`} open={clusterNodeModal} onClose={() => { setClusterNodeModal(false); setClusterNodeRecord(null); }} width={640}>
        {clusterNodeRecord && (
          <div>
            <div className="ataas-node-stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="ataas-node-stat-card"><span>CPU</span><strong>{clusterNodeRecord.cpu}<em>Core</em></strong></div>
              <div className="ataas-node-stat-card"><span>内存</span><strong>{clusterNodeRecord.memory.replace(/[^0-9.]+/g, '')}<em>{clusterNodeRecord.memory.includes('T') ? 'TB' : 'GB'}</em></strong></div>
              <div className="ataas-node-stat-card"><span>GPU</span><strong>{clusterNodeRecord.gpu}<em>卡</em></strong></div>
              <div className="ataas-node-stat-card"><span>运行实例</span><strong>{clusterNodeRecord.runningInstances}<em>个</em></strong></div>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1d2129', margin: '20px 0 12px' }}>GPU 详情</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {clusterNodeRecord.gpuCards.map((card) => (
                <div key={card.index} style={{ padding: '14px 16px', border: '1px solid #F2F3F5', borderRadius: 8, background: '#fafbff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#1d2129' }}>GPU {card.index}</span>
                      <span style={{ color: '#4e5969', fontSize: 13 }}>{card.model}</span>
                    </div>
                    <Tag color={card.status === 'active' ? 'green' : 'default'}>{card.status}</Tag>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px 16px', fontSize: 12, color: '#4e5969', marginBottom: 8 }}>
                    <div><span style={{ color: '#86909c' }}>显存</span> {card.memoryUsed}/{card.memoryTotal}</div>
                    <div><span style={{ color: '#86909c' }}>利用率</span> {card.utilization}%</div>
                    <div><span style={{ color: '#86909c' }}>功耗</span> {card.power}W</div>
                    <div><span style={{ color: '#86909c' }}>温度</span> {card.temperature}°C</div>
                  </div>
                  {card.replicas.length > 0 && (
                    <>
                      <div style={{ fontSize: 12, color: '#86909c', marginBottom: 4 }}>运行模型</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {card.replicas.map((rep, j) => (
                          <span key={j} style={{ padding: '2px 8px', borderRadius: 4, background: '#eef4ff', color: '#6951FF', fontSize: 12 }}>{rep}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1d2129', margin: '20px 0 12px' }}>节点信息</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 13, color: '#4e5969' }}>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>IP</span><br/>{clusterNodeRecord.ip}</div>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>标签</span><br/>{clusterNodeRecord.label}</div>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>集群</span><br/>{clusterNodeRecord.clusterName}</div>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>GPU 显存使用</span><br/>{clusterNodeRecord.gpuMemoryUsed} / {clusterNodeRecord.gpuMemory}</div>
            </div>
          </div>
        )}
      </Drawer>
      <Drawer className="ataas-deploy-drawer" title="模型部署" open={deployDrawerOpen} onClose={() => setDeployDrawerOpen(false)} width={780}>
            <div className="ataas-deploy-page">
                      <Form className="ataas-deploy-drawer-form" layout="vertical" size="middle">
                        <Form.Item label="服务名称" required><Input placeholder="例如：my-inference-service" value={deployServiceName} onChange={(e) => setDeployServiceName(e.target.value)} /></Form.Item>
                        <Form.Item label="模型" required>
                          <Select placeholder="选择模型" value={deployModel} onChange={setDeployModel} options={deployModels.map((m) => ({ value: m.key, label: `${m.name} (${m.size})` }))} />
                        </Form.Item>
                        <Form.Item label="推理引擎" required>
                          <Select placeholder="选择推理引擎" value={deployEngine} onChange={(v) => setDeployEngine(v)} options={
                            deployMode === 'pd-separation'
                              ? [{ value: 'sglang', label: 'SGLang' }]
                              : [{ value: 'sglang', label: 'SGLang' }, { value: 'vllm', label: 'vLLM' }]
                          } />
                        </Form.Item>
                        <Form.Item label="部署集群" required>
                          <Select placeholder="选择部署集群" value={deployCluster} onChange={setDeployCluster} optionRender={(o) => {
                            const c = clusters.find((x) => x.key === o.value);
                            return c ? <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><span>{c.name} ({c.region})</span><span style={{ color: '#86909c', fontSize: 12 }}>{c.gpuTypes.map(g => g.name).join(' / ')}</span></span> : o.label;
                          }} options={clusters.map((c) => ({ value: c.key, label: `${c.name} (${c.region})` }))} />
                        </Form.Item>
                        <Form.Item label="部署方式">
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
                            {[
                              { value: 'single', label: '单机部署', desc: '单台机器部署' },
                              { value: 'pd-separation', label: 'PD 分离', desc: 'Prefill/Decode 分离部署' },
                              { value: 'distributed', label: '分布式部署', desc: '多节点分布式部署' },
                              { value: 'smart', label: '智能决策', desc: '当前版本暂不支持', disabled: true },
                            ].map((mode) => {
                              const content = (
                                <button key={mode.value} type="button" disabled={mode.disabled} onClick={() => {
                                  if (mode.disabled) return;
                                  setDeployMode(mode.value);
                                  setSelectedSingleNode(null);
                                  setSingleCardCount(0);
                                }} style={{
                                width: '100%', minHeight: 64, padding: '10px 8px', border: `1px solid ${deployMode === mode.value ? '#1D2129' : '#E5E6EB'}`, borderRadius: 6,
                                background: mode.disabled ? '#F7F8FA' : (deployMode === mode.value ? '#F7F8FA' : '#fff'), cursor: mode.disabled ? 'not-allowed' : 'pointer', textAlign: 'center',
                                opacity: mode.disabled ? 0.55 : 1,
                                boxShadow: 'none',
                                transition: 'all 0.25s ease',
                              }}>
                                <div style={{ fontSize: 13, fontWeight: deployMode === mode.value ? 600 : 500, color: mode.disabled ? '#86909c' : '#1d2129' }}>{mode.label}</div>
                                <div style={{ fontSize: 12, color: '#86909c', marginTop: 3, lineHeight: '1.4' }}>{mode.desc}</div>
                              </button>
                              );
                              return mode.disabled ? <Tooltip key={mode.value} title="当前版本暂不支持"><span style={{ display: 'block' }}>{content}</span></Tooltip> : content;
                            })}
                          </div>
                        </Form.Item>
                      </Form>
                    {deployMode === 'distributed' && (
                      <div style={{ marginTop: 20, background: '#f8f9fc', border: '1px solid #F2F3F5', borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1d2129', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>分布式部署</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, color: '#4e5969' }}>机器数量</span>
                          <InputNumber min={1} max={readyNodeCount || 1} value={deployMachineCount} onChange={(v) => v && setDeployMachineCount(v)} style={{ width: 72 }} />
                          <span style={{ fontSize: 12, color: '#86909c' }}>{'' + readyNodeCount + ' 节点可用'}</span>
                        </div>
                      </div>
                    )}
                    {deployMode === 'pd-separation' && (
                      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fafbfc', border: '1px solid #e5e6eb', borderRadius: 10, padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, color: '#86909c' }}>网关端口号</span>
                          <Input value={pdGatewayPort} onChange={(e) => setPdGatewayPort(e.target.value)} style={{ width: 120 }} size="small" placeholder="例如: 30001" />
                          <span style={{ fontSize: 11, color: '#bcc2cc' }}>PD 分离部署网关暴露端口</span>
                        </div>
                        {/* Router 配置 */}
                        <div className="ataas-pd-section">
                          <div className="ataas-pd-section-header">
                            <span>Router</span>
                          </div>
                          <div className="ataas-pd-section-body">
                            <div className="ataas-pd-section-row">
                              <div>
                                <div className="ataas-pd-field-label">实例个数</div>
                                <Input value={String(pdRouterCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setPdRouterCount(n); }} style={{ width: 72 }} size="small" />
                              </div>
                              <div className="ataas-pd-divider" />
                              <div>
                                <div className="ataas-pd-field-label">节点选择</div>
                                <div className="ataas-pd-node-selector" onClick={() => { setPdNodePickerMode('router'); setPdNodePickerSelected([...pdRouterNodes]); setPdNodePickerOpen(true); }}>
                                  {pdRouterNodes.length > 0 ? pdRouterNodes.map((k) => {
                                    const n = deployNodes.find((d) => d.key === k);
                                    return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setPdRouterNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-router">{n.name}</Tag> : null;
                                  }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                                </div>
                              </div>
                            </div>
                            <div className="ataas-pd-mode-bar">
                              <Segmented value={pdRouterParamMode} onChange={(v) => setPdRouterParamMode(v as 'template' | 'manual')} size="small" options={[{ value: 'template', label: 'YAML 模版' }, { value: 'manual', label: '手填参数' }]} />
                              <div style={{ flex: 1 }}>
                                {pdRouterParamMode === 'template' ? (
                                  pdRouterNodes.length === 0 ? (
                                    <span className="ataas-pd-template-placeholder">请先选择节点</span>
                                  ) : (
                                    <div className="ataas-pd-template-content">
                                      <Select value={pdRouterTemplateKey || undefined} onChange={(v) => applyPdRouterTemplate(v as string)} placeholder="选择启动模板" options={startupTemplates.map((t) => ({ value: t.key, label: t.name + ' / ' + t.engine }))} style={{ minWidth: 180 }} allowClear />
                                      <input type="file" accept=".yaml,.yml" ref={pdRouterFileInputRef} style={{ display: 'none' }} onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => { setPdRouterUploadedYaml(ev.target?.result as string || ''); };
                                          reader.readAsText(file);
                                        }
                                        e.target.value = '';
                                      }} />
                                      <Button icon={<UploadOutlined />} size="small" onClick={() => pdRouterFileInputRef.current?.click()}>上传模版</Button>
                                      {pdRouterUploadedYaml && <Tag closable onClose={() => setPdRouterUploadedYaml('')} style={{ margin: 0 }}>已上传 YAML</Tag>}
                                    </div>
                                  )
                                ) : (
                                  <div className="ataas-pd-params-area">
                                    {pdRouterParams.length === 0 ? (
                                      <div className="ataas-pd-param-empty">暂无参数</div>
                                    ) : (
                                      pdRouterParams.map((param, pi) => (
                                        <div key={pi} className="ataas-pd-param-row">
                                          <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...pdRouterParams]; next[pi] = { ...next[pi], key: e.target.value }; setPdRouterParams(next); }} style={{ flex: 1 }} size="small" />
                                          <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...pdRouterParams]; next[pi] = { ...next[pi], value: e.target.value }; setPdRouterParams(next); }} style={{ flex: 1 }} size="small" />
                                          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setPdRouterParams(pdRouterParams.filter((_, j) => j !== pi))} />
                                        </div>
                                      ))
                                    )}
                                    <div className="ataas-pd-param-add">
                                      <Button size="small" icon={<PlusOutlined />} onClick={() => setPdRouterParams([...pdRouterParams, { key: '', value: '' }])}>添加参数</Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Prefill 配置 */}
                        <div className="ataas-pd-section">
                          <div className="ataas-pd-section-header">
                            <span>Prefill</span>
                          </div>
                          <div className="ataas-pd-section-body">
                            <div className="ataas-pd-section-row">
                              <div>
                                <div className="ataas-pd-field-label">实例个数</div>
                                <Input value={String(pdPrefillCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setPdPrefillCount(n); }} style={{ width: 72 }} size="small" />
                              </div>
                              <div className="ataas-pd-divider" />
                              <div>
                                <div className="ataas-pd-field-label">节点选择</div>
                                <div className="ataas-pd-node-selector" onClick={() => { setPdNodePickerMode('prefill'); setPdNodePickerSelected([...pdPrefillNodes]); setPdNodePickerOpen(true); }}>
                                  {pdPrefillNodes.length > 0 ? pdPrefillNodes.map((k) => {
                                    const n = deployNodes.find((d) => d.key === k);
                                    return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setPdPrefillNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-prefill">{n.name}</Tag> : null;
                                  }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                                </div>
                              </div>
                            </div>
                            <div className="ataas-pd-mode-bar">
                              <Segmented value={pdPrefillParamMode} onChange={(v) => setPdPrefillParamMode(v as 'template' | 'manual')} size="small" options={[{ value: 'template', label: 'YAML 模版' }, { value: 'manual', label: '手填参数' }]} />
                              <div style={{ flex: 1 }}>
                                {pdPrefillParamMode === 'template' ? (
                                  pdPrefillNodes.length === 0 ? (
                                    <span className="ataas-pd-template-placeholder">请先选择节点</span>
                                  ) : (
                                    <div className="ataas-pd-template-content">
                                      <Select value={pdPrefillTemplateKey || undefined} onChange={(v) => applyPdPrefillTemplate(v as string)} placeholder="选择启动模板" options={startupTemplates.map((t) => ({ value: t.key, label: t.name + ' / ' + t.engine }))} style={{ minWidth: 180 }} allowClear />
                                      <input type="file" accept=".yaml,.yml" ref={pdPrefillFileInputRef} style={{ display: 'none' }} onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => { setPdPrefillUploadedYaml(ev.target?.result as string || ''); };
                                          reader.readAsText(file);
                                        }
                                        e.target.value = '';
                                      }} />
                                      <Button icon={<UploadOutlined />} size="small" onClick={() => pdPrefillFileInputRef.current?.click()}>上传模版</Button>
                                      {pdPrefillUploadedYaml && <Tag closable onClose={() => setPdPrefillUploadedYaml('')} style={{ margin: 0 }}>已上传 YAML</Tag>}
                                    </div>
                                  )
                                ) : (
                                  <div className="ataas-pd-params-area">
                                    {pdPrefillParams.length === 0 ? (
                                      <div className="ataas-pd-param-empty">暂无参数</div>
                                    ) : (
                                      pdPrefillParams.map((param, pi) => (
                                        <div key={pi} className="ataas-pd-param-row">
                                          <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...pdPrefillParams]; next[pi] = { ...next[pi], key: e.target.value }; setPdPrefillParams(next); }} style={{ flex: 1 }} size="small" />
                                          <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...pdPrefillParams]; next[pi] = { ...next[pi], value: e.target.value }; setPdPrefillParams(next); }} style={{ flex: 1 }} size="small" />
                                          <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setPdPrefillParams(pdPrefillParams.filter((_, j) => j !== pi))} />
                                        </div>
                                      ))
                                    )}
                                    <div className="ataas-pd-param-add">
                                      <Button size="small" icon={<PlusOutlined />} onClick={() => setPdPrefillParams([...pdPrefillParams, { key: '', value: '' }])}>添加参数</Button>
                                    </div>
                                    <div className="ataas-pd-advanced-toggle" onClick={() => setExpandedSections((p) => ({ ...p, 'pd-prefill-adv': !p['pd-prefill-adv'] }))}>
                                      <span className="ataas-pd-advanced-toggle-label">高级参数</span>
                                      <DownOutlined className={'ataas-pd-advanced-toggle-icon' + (expandedSections['pd-prefill-adv'] ? ' open' : '')} />
                                    </div>
                                    {expandedSections['pd-prefill-adv'] && (
                                      <div className="ataas-pd-advanced-content">
                                        {pdPrefillParams.length > 0 && <div className="ataas-pd-advanced-hint">以下为额外高级配置参数，可按需添加</div>}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Decode 配置 */}
                        <div className="ataas-pd-section">
                          <div className="ataas-pd-section-header">
                            <span>Decode</span>
                          </div>
                          <div className="ataas-pd-section-body">
                            <div className="ataas-pd-section-row">
                              <div>
                                <div className="ataas-pd-field-label">实例个数</div>
                                <Input value={String(pdDecodeCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setPdDecodeCount(n); }} style={{ width: 72 }} size="small" />
                              </div>
                              <div className="ataas-pd-divider" />
                              <div>
                                <div className="ataas-pd-field-label">节点选择</div>
                                <div className="ataas-pd-node-selector" onClick={() => { setPdNodePickerMode('decode'); setPdNodePickerSelected([...pdDecodeNodes]); setPdNodePickerOpen(true); }}>
                                  {pdDecodeNodes.length > 0 ? pdDecodeNodes.map((k) => {
                                    const n = deployNodes.find((d) => d.key === k);
                                    return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setPdDecodeNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-decode">{n.name}</Tag> : null;
                                  }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                                </div>
                              </div>
                            </div>
                            <div className="ataas-pd-params-area" style={{ marginTop: 12 }}>
                              {pdDecodeParams.length === 0 ? (
                                <div className="ataas-pd-param-empty">暂无参数</div>
                              ) : (
                                pdDecodeParams.map((param, pi) => (
                                  <div key={pi} className="ataas-pd-param-row">
                                    <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...pdDecodeParams]; next[pi] = { ...next[pi], key: e.target.value }; setPdDecodeParams(next); }} style={{ flex: 1 }} size="small" />
                                    <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...pdDecodeParams]; next[pi] = { ...next[pi], value: e.target.value }; setPdDecodeParams(next); }} style={{ flex: 1 }} size="small" />
                                    <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setPdDecodeParams(pdDecodeParams.filter((_, j) => j !== pi))} />
                                  </div>
                                ))
                              )}
                              <div className="ataas-pd-param-add">
                                <Button size="small" icon={<PlusOutlined />} onClick={() => setPdDecodeParams([...pdDecodeParams, { key: '', value: '' }])}>添加参数</Button>
                              </div>
                              <div className="ataas-pd-advanced-toggle" onClick={() => setExpandedSections((p) => ({ ...p, 'pd-decode-adv': !p['pd-decode-adv'] }))}>
                                <span className="ataas-pd-advanced-toggle-label">高级参数</span>
                                <DownOutlined className={'ataas-pd-advanced-toggle-icon' + (expandedSections['pd-decode-adv'] ? ' open' : '')} />
                              </div>
                              {expandedSections['pd-decode-adv'] && (
                                <div className="ataas-pd-advanced-content">
                                  {pdDecodeParams.length > 0 && <div className="ataas-pd-advanced-hint">以下为额外高级配置参数，可按需添加</div>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {Boolean(deployCluster && deployEngine && deployModel) && (
                      <div>
                        {/* 部署配置 */}
                        {deployMode === 'single' && (
                          <div style={{ marginTop: 16, border: '1px solid #F2F3F5', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                            <div style={{ padding: '14px 18px', background: '#f8f9fc', borderBottom: '1px solid #F2F3F5' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1d2129' }}>部署配置</span>
                                {selectedSingleNode ? (() => {
                                  const n = deployNodes.find((d) => d.key === selectedSingleNode);
                                  return n ? <span style={{ fontSize: 12, color: '#86909c', marginLeft: 4 }}>{n.name} · {singleCardCount || '-'}卡</span> : null;
                                })() : <span style={{ fontSize: 12, color: '#bcc2cc', marginLeft: 4 }}>未配置</span>}
                              </div>
                            </div>
                              <div style={{ padding: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12 }}>节点配置</div>
                                <Form.Item label="部署节点" required style={{ marginBottom: 12 }}>
                                  <div onClick={() => setSingleNodeModal(true)} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', border: '1.5px dashed #d0d5e0', borderRadius: 10, cursor: 'pointer', minHeight: 40, background: '#fafbff', transition: 'all 0.2s' }}>
                                    {selectedSingleNode ? (() => {
                                      const n = deployNodes.find((d) => d.key === selectedSingleNode);
                                      return n ? <Tag closable onClose={(e) => { e.stopPropagation(); setSelectedSingleNode(null); }} style={{ padding: '2px 10px', fontSize: 12, borderRadius: 6, border: 'none', background: '#eef2ff' }}>{n.name} · {n.gpuType}</Tag> : <span style={{ color: '#bcc2cc', fontSize: 13 }}>点击选择节点</span>;
                                    })() : <span style={{ color: '#bcc2cc', fontSize: 13 }}>点击选择节点</span>}
                                  </div>
                                </Form.Item>
                                <Form.Item label="使用卡数" required style={{ marginBottom: 16 }}>
                                  {renderCardCountStepper(selectedSingleNode ? (deployNodes.find((d) => d.key === selectedSingleNode)?.availableCards ?? 0) : 0)}
                                </Form.Item>
                                <div style={{ height: 1, background: '#F2F3F5', margin: '0 -16px 16px' }} />
                                <div className="ataas-advanced-shell-toggle" onClick={() => setExpandedSections((p) => ({ ...p, advanced: !p.advanced }))}>
                                  <DownOutlined className={expandedSections.advanced ? 'open' : ''} />
                                  <span>高级参数</span>
                                </div>
                                {expandedSections.advanced && renderAdvancedParamsShell()}
                              </div>
                          </div>
                        )}

                        {deployMode === 'distributed' && (
                          <div style={{ marginTop: 16, border: '1px solid #F2F3F5', borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                            <div onClick={() => setExpandedSections((p) => ({ ...p, config: !p.config }))} style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedSections.config ? '#f8f9fc' : '#fff', borderBottom: expandedSections.config ? '1px solid #F2F3F5' : 'none', transition: 'all 0.2s' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#1d2129' }}>部署配置</span>
                                {selectedDeployNodes.length > 0 ? <span style={{ fontSize: 12, color: '#86909c', marginLeft: 4 }}>{selectedDeployNodes.length} 台 · {singleCardCount}卡</span> : <span style={{ fontSize: 12, color: '#bcc2cc', marginLeft: 4 }}>未配置</span>}
                              </div>
                              <span style={{ color: '#86909c', fontSize: 12 }}>{expandedSections.config ? '收起' : '展开'} <DownOutlined style={{ transform: expandedSections.config ? 'rotate(180deg)' : 'none', transition: '0.25s', fontSize: 10 }} /></span>
                            </div>
                            {expandedSections.config && (
                              <div style={{ padding: 16 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12 }}>节点配置</div>
                                <Form.Item label="部署节点" required style={{ marginBottom: 16 }}>
                                  <div onClick={() => setSingleNodeModal(true)} style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 12px', border: '1.5px dashed #d0d5e0', borderRadius: 10, cursor: 'pointer', minHeight: 40, background: '#fafbff', transition: 'all 0.2s' }}>
                                    {selectedDeployNodes.length > 0 ? selectedDeployNodes.map((key) => {
                                      const n = deployNodes.find((d) => d.key === key);
                                      return n ? (
                                        <Tag key={key} closable onClose={(e) => { e.stopPropagation(); setSelectedDeployNodes((prev) => prev.filter((k) => k !== key)); }} style={{ padding: '2px 10px', fontSize: 12, borderRadius: 6, border: 'none', background: '#eef2ff' }}>{n.name}</Tag>
                                      ) : null;
                                    }) : <span style={{ color: '#bcc2cc', fontSize: 13 }}>点击选择节点</span>}
                                  </div>
                                </Form.Item>
                                <Form.Item label="使用卡数" required style={{ marginBottom: 16 }}>
                                  {renderCardCountStepper(selectedDeployNodes.length > 0 ? Math.min(...selectedDeployNodes.map((k) => deployNodes.find((d) => d.key === k)?.availableCards ?? 0)) : 0)}
                                </Form.Item>
                                {renderLaunchConfigBlock()}
                                <div style={{ height: 1, background: '#F2F3F5', margin: '0 -16px 16px' }} />
                                <div className="ataas-advanced-shell-toggle" onClick={() => setExpandedSections((p) => ({ ...p, advanced: !p.advanced }))}>
                                  <DownOutlined className={expandedSections.advanced ? 'open' : ''} />
                                  <span>高级参数</span>
                                </div>
                                {expandedSections.advanced && renderAdvancedParamsShell()}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}
                    {/* PD分离节点选择弹窗 */}
                    <Modal title={'选择' + (pdNodePickerMode === 'router' ? 'Router' : pdNodePickerMode === 'prefill' ? 'Prefill' : 'Decode') + '节点'} open={pdNodePickerOpen} onCancel={() => setPdNodePickerOpen(false)} footer={
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Button onClick={() => setPdNodePickerOpen(false)}>取消</Button>
                        <Button type="primary" onClick={() => {
                          if (pdNodePickerMode === 'router') setPdRouterNodes([...pdNodePickerSelected]);
                          else if (pdNodePickerMode === 'prefill') setPdPrefillNodes([...pdNodePickerSelected]);
                          else if (pdNodePickerMode === 'decode') setPdDecodeNodes([...pdNodePickerSelected]);
                          setPdNodePickerOpen(false);
                        }}>确认（{pdNodePickerSelected.length}个）</Button>
                      </div>
                    } width={600}>
                      <Table
                        dataSource={deployNodes.filter((n) => n.status === 'ready')}
                        rowKey="key" pagination={{ pageSize: 5, showSizeChanger: false }}
                        rowSelection={{
                          type: 'checkbox',
                          selectedRowKeys: pdNodePickerSelected,
                          onSelect: (record) => {
                            setPdNodePickerSelected((prev) =>
                              prev.includes(record.key) ? prev.filter((k) => k !== record.key) : [...prev, record.key]
                            );
                          },
                          onSelectAll: (selected, _selectedRows, changeRows) => {
                            setPdNodePickerSelected((prev) => {
                              const changeKeys = changeRows.map((r) => r.key);
                              if (selected) {
                                return [...new Set([...prev, ...changeKeys])];
                              }
                              return prev.filter((k) => !changeKeys.includes(k));
                            });
                          },
                        }}
                        columns={[
                          { title: '节点名称', dataIndex: 'name', key: 'name', render: (v, r) => <><strong>{v}</strong><span className="ataas-table-sub">{r.ip}</span></> },
                          { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (v) => <Tag>{v}</Tag> },
                          { title: '可用卡数', key: 'cards', render: (_, r) => <span>{r.availableCards} / {r.totalCards}</span> },
                          { title: '状态', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'ready' ? 'green' : v === 'busy' ? 'orange' : 'red'}>{v === 'ready' ? '可用' : v === 'busy' ? '繁忙' : '异常'}</Tag> },
                        ]}
                      />
                    </Modal>
                    <div className="ataas-deploy-drawer-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <Button onClick={resetDeployForm}>取消</Button>
                      <Button type="primary" disabled={!(deployCluster && deployEngine && deployModel && deployServiceName)} onClick={() => { alert('部署提交成功！'); setDeployDrawerOpen(false); }}>部署</Button>
                    </div>
            </div>
      </Drawer>

      <Modal title={'PD 扩容 - ' + (scalePdTarget?.name || '')} open={scalePdOpen} onCancel={() => setScalePdOpen(false)} width={720} footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setScalePdOpen(false)}>取消</Button>
          <Button type="primary" onClick={() => { alert('扩容提交成功！请等待部署完成。'); setScalePdOpen(false); }}>确认扩容</Button>
        </div>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Router */}
          <div className="ataas-pd-section">
            <div className="ataas-pd-section-header">
              <SwapRightOutlined className="ataas-pd-section-header-icon" style={{ color: '#722ed1' }} />
              <span>Router 扩容</span>
            </div>
            <div className="ataas-pd-section-body">
              <div className="ataas-pd-section-row">
                <div>
                  <div className="ataas-pd-field-label">实例个数</div>
                  <Input value={String(scalePdRouterCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setScalePdRouterCount(n); }} style={{ width: 72 }} size="small" />
                </div>
                <div className="ataas-pd-divider" />
                <div>
                  <div className="ataas-pd-field-label">节点选择</div>
                  <div className="ataas-pd-node-selector" onClick={() => { setScaleNodePickerMode('router'); setScaleNodePickerSelected([...scalePdRouterNodes]); setScaleNodePickerOpen(true); }}>
                    {scalePdRouterNodes.length > 0 ? scalePdRouterNodes.map((k) => {
                      const n = deployNodes.find((d) => d.key === k);
                      return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setScalePdRouterNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-router">{n.name}</Tag> : null;
                    }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                  </div>
                </div>
              </div>
              <div className="ataas-pd-mode-bar">
                <Segmented value={scalePdRouterParamMode} onChange={(v) => setScalePdRouterParamMode(v as 'template' | 'manual')} size="small" options={[{ value: 'template', label: 'YAML 模版' }, { value: 'manual', label: '手填参数' }]} />
                <div style={{ flex: 1 }}>
                  {scalePdRouterParamMode === 'template' ? (
                    scalePdRouterNodes.length === 0 ? (
                      <span className="ataas-pd-template-placeholder">请先选择节点</span>
                    ) : (
                      <div className="ataas-pd-template-content">
                        <input type="file" accept=".yaml,.yml" ref={scalePdRouterFileInputRef} style={{ display: 'none' }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => { setScalePdRouterUploadedYaml(ev.target?.result as string || ''); };
                            reader.readAsText(file);
                          }
                          e.target.value = '';
                        }} />
                        <Button icon={<UploadOutlined />} size="small" onClick={() => scalePdRouterFileInputRef.current?.click()}>上传模版</Button>
                        {scalePdRouterUploadedYaml && <Tag closable onClose={() => setScalePdRouterUploadedYaml('')} style={{ margin: 0 }}>已上传 YAML</Tag>}
                      </div>
                    )
                  ) : scalePdRouterParamMode === 'manual' && (
                    <div className="ataas-pd-params-area">
                      {scalePdRouterParams.length === 0 ? (
                        <div className="ataas-pd-param-empty">暂无参数</div>
                      ) : (
                        scalePdRouterParams.map((param, pi) => (
                          <div key={pi} className="ataas-pd-param-row">
                            <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...scalePdRouterParams]; next[pi] = { ...next[pi], key: e.target.value }; setScalePdRouterParams(next); }} style={{ flex: 1 }} size="small" />
                            <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...scalePdRouterParams]; next[pi] = { ...next[pi], value: e.target.value }; setScalePdRouterParams(next); }} style={{ flex: 1 }} size="small" />
                            <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setScalePdRouterParams(scalePdRouterParams.filter((_, j) => j !== pi))} />
                          </div>
                        ))
                      )}
                      <div className="ataas-pd-param-add">
                        <Button size="small" icon={<PlusOutlined />} onClick={() => setScalePdRouterParams([...scalePdRouterParams, { key: '', value: '' }])}>添加参数</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Prefill */}
          <div className="ataas-pd-section">
            <div className="ataas-pd-section-header">
              <ThunderboltOutlined className="ataas-pd-section-header-icon" style={{ color: '#6951FF' }} />
              <span>Prefill 扩容</span>
            </div>
            <div className="ataas-pd-section-body">
              <div className="ataas-pd-section-row">
                <div>
                  <div className="ataas-pd-field-label">实例个数</div>
                  <Input value={String(scalePdPrefillCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setScalePdPrefillCount(n); }} style={{ width: 72 }} size="small" />
                </div>
                <div className="ataas-pd-divider" />
                <div>
                  <div className="ataas-pd-field-label">节点选择</div>
                  <div className="ataas-pd-node-selector" onClick={() => { setScaleNodePickerMode('prefill'); setScaleNodePickerSelected([...scalePdPrefillNodes]); setScaleNodePickerOpen(true); }}>
                    {scalePdPrefillNodes.length > 0 ? scalePdPrefillNodes.map((k) => {
                      const n = deployNodes.find((d) => d.key === k);
                      return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setScalePdPrefillNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-prefill">{n.name}</Tag> : null;
                    }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                  </div>
                </div>
              </div>
              <div className="ataas-pd-mode-bar">
                <Segmented value={scalePdPrefillParamMode} onChange={(v) => setScalePdPrefillParamMode(v as 'template' | 'manual')} size="small" options={[{ value: 'template', label: 'YAML 模版' }, { value: 'manual', label: '手填参数' }]} />
                <div style={{ flex: 1 }}>
                  {scalePdPrefillParamMode === 'template' ? (
                    scalePdPrefillNodes.length === 0 ? (
                      <span className="ataas-pd-template-placeholder">请先选择节点</span>
                    ) : (
                      <div className="ataas-pd-template-content">
                        <input type="file" accept=".yaml,.yml" ref={scalePdPrefillFileInputRef} style={{ display: 'none' }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => { setScalePdPrefillUploadedYaml(ev.target?.result as string || ''); };
                            reader.readAsText(file);
                          }
                          e.target.value = '';
                        }} />
                        <Button icon={<UploadOutlined />} size="small" onClick={() => scalePdPrefillFileInputRef.current?.click()}>上传模版</Button>
                        {scalePdPrefillUploadedYaml && <Tag closable onClose={() => setScalePdPrefillUploadedYaml('')} style={{ margin: 0 }}>已上传 YAML</Tag>}
                      </div>
                    )
                  ) : scalePdPrefillParamMode === 'manual' && (
                    <div className="ataas-pd-params-area">
                      {scalePdPrefillParams.length === 0 ? (
                        <div className="ataas-pd-param-empty">暂无参数</div>
                      ) : (
                        scalePdPrefillParams.map((param, pi) => (
                          <div key={pi} className="ataas-pd-param-row">
                            <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...scalePdPrefillParams]; next[pi] = { ...next[pi], key: e.target.value }; setScalePdPrefillParams(next); }} style={{ flex: 1 }} size="small" />
                            <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...scalePdPrefillParams]; next[pi] = { ...next[pi], value: e.target.value }; setScalePdPrefillParams(next); }} style={{ flex: 1 }} size="small" />
                            <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setScalePdPrefillParams(scalePdPrefillParams.filter((_, j) => j !== pi))} />
                          </div>
                        ))
                      )}
                      <div className="ataas-pd-param-add">
                        <Button size="small" icon={<PlusOutlined />} onClick={() => setScalePdPrefillParams([...scalePdPrefillParams, { key: '', value: '' }])}>添加参数</Button>
                      </div>
                      <div className="ataas-pd-advanced-toggle" onClick={() => setExpandedSections((p) => ({ ...p, 'scale-prefill-adv': !p['scale-prefill-adv'] }))}>
                        <span className="ataas-pd-advanced-toggle-label">高级参数</span>
                        <DownOutlined className={'ataas-pd-advanced-toggle-icon' + (expandedSections['scale-prefill-adv'] ? ' open' : '')} />
                      </div>
                      {expandedSections['scale-prefill-adv'] && (
                        <div className="ataas-pd-advanced-content">
                          {scalePdPrefillParams.length > 0 && <div className="ataas-pd-advanced-hint">以下为额外高级配置参数，可按需添加</div>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Decode */}
          <div className="ataas-pd-section">
            <div className="ataas-pd-section-header">
              <BarChartOutlined className="ataas-pd-section-header-icon" style={{ color: '#722ed1' }} />
              <span>Decode 扩容</span>
            </div>
            <div className="ataas-pd-section-body">
              <div className="ataas-pd-section-row">
                <div>
                  <div className="ataas-pd-field-label">实例个数</div>
                  <Input value={String(scalePdDecodeCount)} onChange={(e) => { const n = parseInt(e.target.value); if (!isNaN(n) && n > 0) setScalePdDecodeCount(n); }} style={{ width: 72 }} size="small" />
                </div>
                <div className="ataas-pd-divider" />
                <div>
                  <div className="ataas-pd-field-label">节点选择</div>
                  <div className="ataas-pd-node-selector" onClick={() => { setScaleNodePickerMode('decode'); setScaleNodePickerSelected([...scalePdDecodeNodes]); setScaleNodePickerOpen(true); }}>
                    {scalePdDecodeNodes.length > 0 ? scalePdDecodeNodes.map((k) => {
                      const n = deployNodes.find((d) => d.key === k);
                      return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setScalePdDecodeNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-decode">{n.name}</Tag> : null;
                    }) : <span className="ataas-pd-node-placeholder">点击选择节点</span>}
                  </div>
                </div>
              </div>
              <div className="ataas-pd-params-area" style={{ marginTop: 12 }}>
                {scalePdDecodeParams.length === 0 ? (
                  <div className="ataas-pd-param-empty">暂无参数</div>
                ) : (
                  scalePdDecodeParams.map((param, pi) => (
                    <div key={pi} className="ataas-pd-param-row">
                      <Input placeholder="参数名" value={param.key} onChange={(e) => { const next = [...scalePdDecodeParams]; next[pi] = { ...next[pi], key: e.target.value }; setScalePdDecodeParams(next); }} style={{ flex: 1 }} size="small" />
                      <Input placeholder="参数值" value={param.value} onChange={(e) => { const next = [...scalePdDecodeParams]; next[pi] = { ...next[pi], value: e.target.value }; setScalePdDecodeParams(next); }} style={{ flex: 1 }} size="small" />
                      <Button icon={<DeleteOutlined />} danger size="small" onClick={() => setScalePdDecodeParams(scalePdDecodeParams.filter((_, j) => j !== pi))} />
                    </div>
                  ))
                )}
                <div className="ataas-pd-param-add">
                  <Button size="small" icon={<PlusOutlined />} onClick={() => setScalePdDecodeParams([...scalePdDecodeParams, { key: '', value: '' }])}>添加参数</Button>
                </div>
                <div className="ataas-pd-advanced-toggle" onClick={() => setExpandedSections((p) => ({ ...p, 'scale-decode-adv': !p['scale-decode-adv'] }))}>
                  <span className="ataas-pd-advanced-toggle-label">高级参数</span>
                  <DownOutlined className={'ataas-pd-advanced-toggle-icon' + (expandedSections['scale-decode-adv'] ? ' open' : '')} />
                </div>
                {expandedSections['scale-decode-adv'] && (
                  <div className="ataas-pd-advanced-content">
                    {scalePdDecodeParams.length > 0 && <div className="ataas-pd-advanced-hint">以下为额外高级配置参数，可按需添加</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
      {/* 节点选择弹窗 - 扩容PD */}
      <Modal title={'选择' + (scaleNodePickerMode === 'router' ? 'Router' : scaleNodePickerMode === 'prefill' ? 'Prefill' : 'Decode') + '节点'} open={scaleNodePickerOpen} onCancel={() => setScaleNodePickerOpen(false)} footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setScaleNodePickerOpen(false)}>取消</Button>
          <Button type="primary" onClick={() => {
            if (scaleNodePickerMode === 'router') setScalePdRouterNodes([...scaleNodePickerSelected]);
            else if (scaleNodePickerMode === 'prefill') setScalePdPrefillNodes([...scaleNodePickerSelected]);
            else if (scaleNodePickerMode === 'decode') setScalePdDecodeNodes([...scaleNodePickerSelected]);
            setScaleNodePickerOpen(false);
          }}>确认（{scaleNodePickerSelected.length}个）</Button>
        </div>
      } width={600}>
        <Table
          dataSource={deployNodes.filter((n) => n.status === 'ready')}
          rowKey="key" pagination={{ pageSize: 5, showSizeChanger: false }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: scaleNodePickerSelected,
            onSelect: (record) => {
              setScaleNodePickerSelected((prev) =>
                prev.includes(record.key) ? prev.filter((k) => k !== record.key) : [...prev, record.key]
              );
            },
            onSelectAll: (selected, _selectedRows, changeRows) => {
              setScaleNodePickerSelected((prev) => {
                const changeKeys = changeRows.map((r) => r.key);
                if (selected) {
                  return [...new Set([...prev, ...changeKeys])];
                }
                return prev.filter((k) => !changeKeys.includes(k));
              });
            },
          }}
          columns={[
            { title: '节点名称', dataIndex: 'name', key: 'name', render: (v, r) => <><strong>{v}</strong><span className="ataas-table-sub">{r.ip}</span></> },
            { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (v) => <Tag>{v}</Tag> },
            { title: '可用卡数', key: 'cards', render: (_, r) => <span>{r.availableCards} / {r.totalCards}</span> },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'ready' ? 'green' : v === 'busy' ? 'orange' : 'red'}>{v === 'ready' ? '可用' : v === 'busy' ? '繁忙' : '异常'}</Tag> },
          ]}
        />
      </Modal>
      {deployDetailItem && (() => {
        const InfoItem = ({ label, value }: { label: string; value: string }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#86909c', fontSize: 12, minWidth: 80, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#1d2129', fontSize: 12, fontWeight: 500 }}>{value}</span>
          </div>
        );
        const worksList = deployDetailItem.modelInfo.works?.split(',').map((w: string) => w.trim()).filter(Boolean) || [];
        const instanceCount = deployDetailItem.modelInfo.number || 1;
        const isPdMode = deployDetailItem.deployMode === 'PD 分离';
        const nodeList = worksList.length > 0 ? worksList : Array.from({ length: instanceCount }, (_, i) => `节点 ${i + 1}`);
        const dataSource = nodeList.map((node: string, i: number) => ({ key: i, instance: `实例 ${i + 1}`, node }));
        const mainColumns = [
          { title: '实例', dataIndex: 'instance', key: 'instance', width: 80 },
          { title: '节点', dataIndex: 'node', key: 'node', width: 120 },
          { title: '状态', dataIndex: 'main', key: 'main', render: (_: any) => <span style={{ color: '#00b42a', fontSize: 12 }}><CheckCircleFilled style={{ marginRight: 4 }} />运行中</span> },
        ];
        const pdMainColumns = mainColumns.filter((c: any) => c.dataIndex !== 'node');
        return (
          <Drawer
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={getDeployModelLogo(deployDetailItem)} alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
                <span>{deployDetailItem.name}</span>
                <div style={{ flex: 1 }} />
                <Button type="text" danger icon={<PoweroffOutlined />} onClick={(e) => { e.stopPropagation(); handleDeployStop(deployDetailItem); }}>停止服务</Button>
              </div>
            }
            open={!!deployDetailItem}
            onClose={() => setDeployDetailItem(null)}
            width={640}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f2f3f5' }}>基础信息</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <InfoItem label="服务名称" value={deployDetailItem.name} />
                {deployDetailItem.description && <InfoItem label="服务描述" value={deployDetailItem.description} />}
                <InfoItem label="部署方式" value={deployDetailItem.deployMode || '-'} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f2f3f5' }}>模型信息</div>
              <div style={{ marginBottom: 16 }}>
                <InfoItem label="模型名称" value={deployDetailItem.modelInfo.name} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <InfoItem label="推理引擎" value={`${deployDetailItem.modelInfo.engine || '-'} / ${deployDetailItem.modelInfo.engineVersion || '-'}`} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 24px' }}>
                <InfoItem label="模型ID" value={'#' + deployDetailItem.id} />
                <InfoItem label="模型参数" value={deployDetailItem.modelInfo.size} />
                <InfoItem label="上下文长度" value={deployDetailItem.modelInfo.contextLength || '-'} />
                <InfoItem label="注意力头数" value={deployDetailItem.modelInfo.attentionHeads || '-'} />
                <InfoItem label="模型精度" value={deployDetailItem.modelInfo.point} />
                <InfoItem label="占用显存" value={deployDetailItem.modelInfo.vram} />
                <InfoItem label="层数" value={deployDetailItem.modelInfo.layers || '-'} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12, marginTop: 20, paddingBottom: 8, borderBottom: '1px solid #f2f3f5' }}>实例信息</div>
              {isPdMode ? (
                <Table
                  dataSource={dataSource}
                  columns={pdMainColumns}
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                  expandable={{
                    expandedRowRender: (record: any) => {
                      const node = record.node || '-';
                      const subColumns = [
                        { title: 'Pod 名称', dataIndex: 'podName', key: 'podName', render: (v: string) => <span style={{ fontSize: 12, color: '#4e5969' }}>{v}</span> },
                        { title: '组件', dataIndex: 'comp', key: 'comp', width: 80 },
                        { title: '所选机器', dataIndex: 'machine', key: 'machine', render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span> },
                        { title: '显卡数量', dataIndex: 'gpu', key: 'gpu', width: 80 },
                        { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (_: string) => <span style={{ color: '#00b42a', fontSize: 12 }}><CheckCircleFilled style={{ marginRight: 4 }} />运行中</span> },
                        { title: '操作', key: 'action', width: 80, render: (_: string, row: any) => (
                          <Tooltip title="查看日志">
                            <Button type="link" size="small" icon={<FileSearchOutlined />} style={{ padding: 0 }} onClick={() => handleDeployLog(deployDetailItem, row.logId)} />
                          </Tooltip>
                        )},
                      ];
                      const podSuffix = node.toLowerCase().replace(/[^a-z0-9]/g, '-');
                      const subData = [
                        { key: 'router', podName: `router-${podSuffix}-0`, comp: <span style={{ color: '#6951FF', fontWeight: 500 }}>Router</span>, machine: node, gpu: '-', status: 'running', logId: 1 },
                        { key: 'prefill', podName: `prefill-${podSuffix}-0`, comp: <span style={{ color: '#6951FF', fontWeight: 500 }}>Prefill</span>, machine: node, gpu: '8 卡', status: 'running', logId: 2 },
                        { key: 'decode', podName: `decode-${podSuffix}-0`, comp: <span style={{ color: '#722ed1', fontWeight: 500 }}>Decode</span>, machine: node, gpu: '8 卡', status: 'running', logId: 3 },
                      ];
                      return <Table dataSource={subData} columns={subColumns} pagination={false} size="small" style={{ margin: 0 }} />;
                    },
                  }}
                />
              ) : (
                <Table dataSource={dataSource} columns={mainColumns} pagination={false} size="small" style={{ marginTop: 8 }} />
              )}
            </div>
          </Drawer>
        );
      })()}
    </div>
  );
};

export default AtAasDesign;
