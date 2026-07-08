import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BarsOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CopyOutlined,
  DeploymentUnitOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  RocketOutlined,
  ReloadOutlined,
  SettingOutlined,
  SwapRightOutlined,
  TagOutlined,
  ThunderboltOutlined,
  UploadOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { AutoComplete, Button, Checkbox, ColorPicker, ConfigProvider, DatePicker, Drawer, Dropdown, Form, Input, InputNumber, message, Modal, Popconfirm, Popover, Progress, Segmented, Select, Slider, Space, Switch, Table, Tabs, Tag, Tooltip, Transfer, Upload } from 'antd';
import DeployList, { MOCK_DEPLOY_DATA, getDeployClusterName, getDeployModelLogo, type DeployCategory, type DeployServiceItem, type ViewMode } from './components/deployList';
import BenchmarkPage from './components/benchmarkPage';
import PlaygroundChatPage from './components/playgroundChatPage';
import type { ColumnsType } from 'antd/es/table';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState, type Dispatch, type Key, type MouseEvent as ReactMouseEvent, type ReactNode, type SetStateAction } from 'react';
import ataasLogo from './ataas-logo.png';
import deepseekLogo from './deepseek-logo.svg';
import glmLogo from './glm-logo.svg';
import kimiLogo from './kimi-logo.svg';
import minimaxLogo from './minimax-logo.svg';
import minicpmLogo from './minicpm-logo.svg';
import qwenLogo from './qwen-logo.svg';
import nvidiaLogo from './nvidia-logo.svg';
import ascendLogo from './ascend-logo.png';
import ppuLogo from './ppu-logo.png';
import mooreLogo from './moore-logo.png';
import muxiLogo from './muxi-logo.png';
import cambriconLogo from './cambricon-logo.png';
import kunlunLogo from './kunlun-logo.png';
import tianshuLogo from './tianshu-logo.png';
import hygonLogo from './hygon-logo.png';
import sglangLogo from './sglang-logo.png';
import vllmLogo from './vllm-logo.png';
import visionCatPreview from './vision-cat-preview.png';
import ConfigsPage from '../Configs';
import TasksPage from '../Tasks';
import { MonacoEditor } from '../../components/shared/MonacoEditor';
import { rpc } from '../../lib/bus/rpc';
import type { ConfigCommitEntry, ConfigTreeNode } from '../../lib/types';
import ContainerManagementPage from './components/containerManagementPage';
import RouteWorkbenchPage from './components/routeWorkbenchPage';
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

const SidebarIcon = ({ name }: { name: 'dashboard' | 'cluster' | 'modelRepo' | 'deploy' | 'ops' | 'image' | 'imageModel' | 'visionModel' | 'embedding' | 'rerank' | 'monitor' | 'benchmark' | 'engine' | 'template' | 'alert' | 'logs' | 'playground' | 'apiKey' | 'user' | 'engineMgr' | 'pod' | 'service' | 'config' | 'se' | 'task' }) => {
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
      {name === 'ops' && (
        <>
          <rect x="3" y="3" width="5.2" height="5.2" rx="1.4" fill="currentColor" />
          <rect x="11.8" y="3" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity="0.82" />
          <rect x="3" y="11.8" width="5.2" height="5.2" rx="1.4" fill="currentColor" opacity="0.82" />
          <rect x="11.8" y="11.8" width="5.2" height="5.2" rx="1.4" fill="currentColor" />
          <path d="M8.3 5.6h2.2M14.4 8.3v2.2M11.7 14.4H9.5M5.6 11.7V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6.9 6.9l6.2 6.2M13.1 6.9l-6.2 6.2" stroke={white} strokeWidth="1.15" strokeLinecap="round" opacity="0.82" />
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
          <path d="M3 4.5C3 3.1 4.1 2 5.5 2h9C15.9 2 17 3.1 17 4.5v11c0 1.4-1.1 2.5-2.5 2.5h-9C4.1 18 3 16.9 3 15.5v-11z" fill="currentColor" />
          <rect x="5.2" y="5" width="9.6" height="2" rx="1" fill={white} opacity="0.9" />
          <rect x="5.2" y="9" width="9.6" height="2" rx="1" fill={white} opacity="0.72" />
          <rect x="5.2" y="13" width="6" height="2" rx="1" fill={white} opacity="0.58" />
        </>
      )}
      {name === 'imageModel' && (
        <>
          <rect x="2.5" y="3" width="15" height="14" rx="2" fill="currentColor" />
          <circle cx="6.5" cy="7" r="1.7" fill={white} opacity="0.95" />
          <path d="M4.5 14.2l3.2-3.5 2.2 2.1 2.8-3.4 2.8 4.8H4.5z" fill={white} opacity="0.85" />
        </>
      )}
      {name === 'visionModel' && (
        <>
          <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5z" fill="currentColor" />
          <circle cx="10" cy="10" r="3" fill={white} opacity="0.92" />
          <circle cx="10" cy="10" r="1.4" fill="currentColor" />
        </>
      )}
      {name === 'embedding' && (
        <>
          <circle cx="4.5" cy="5" r="2" fill="currentColor" />
          <circle cx="15.5" cy="5" r="2" fill="currentColor" />
          <circle cx="10" cy="10" r="2.2" fill="currentColor" />
          <circle cx="4.5" cy="15" r="2" fill="currentColor" />
          <circle cx="15.5" cy="15" r="2" fill="currentColor" />
          <path d="M6.2 5.8l2.2 2M13.8 5.8l-2.2 2M6.3 14.2l2.1-2M13.7 14.2l-2.1-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {name === 'rerank' && (
        <>
          <rect x="3" y="3" width="10" height="3" rx="1.2" fill="currentColor" />
          <rect x="3" y="8.5" width="14" height="3" rx="1.2" fill="currentColor" />
          <rect x="3" y="14" width="7" height="3" rx="1.2" fill="currentColor" />
          <path d="M15 3.2l2 2 2-2M17 5V2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'monitor' && (
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
      {name === 'template' && (
        <>
          <path d="M3 5.2C3 3.4 6.1 2 10 2s7 1.4 7 3.2v9.6c0 1.8-3.1 3.2-7 3.2s-7-1.4-7-3.2V5.2z" fill="currentColor" />
          <path d="M15.6 5.2c0 .9-2.5 1.8-5.6 1.8s-5.6-.9-5.6-1.8S6.9 3.4 10 3.4s5.6.9 5.6 1.8z" fill={white} opacity="0.78" />
          <path d="M5 9.7l2.6-2.1 2.3 2.1 3.2-3.5 1.9 1.5" fill="none" stroke={white} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.4 12.4c1.2.9 3.2 1.4 5.6 1.4s4.4-.5 5.6-1.4" fill="none" stroke={white} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        </>
      )}
      {name === 'alert' && (
        <>
          <path d="M9.2 2.8c.4-.7 1.2-.7 1.6 0l7 12.2c.4.7-.1 1.5-.9 1.5H3.1c-.8 0-1.3-.8-.9-1.5l7-12.2z" fill="currentColor" />
          <rect x="9.2" y="6.5" width="1.6" height="5.2" rx="0.8" fill={white} />
          <circle cx="10" cy="14" r="1" fill={white} />
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
      {name === 'apiKey' && (
        <>
          <path d="M10 3a4 4 0 00-4 4c0 1.5.8 2.8 2 3.5V16l1.5 1.5L11 18l1.5-1.5L14 16v-5.5a4 4 0 00-4-7zm0 2a2 2 0 110 4 2 2 0 010-4z" fill="currentColor" />
        </>
      )}
      {name === 'user' && (
        <>
          <path d="M10 2a4 4 0 100 8 4 4 0 000-8z" fill="currentColor" />
          <path d="M3 17c0-3.3 3.1-5 7-5s7 1.7 7 5v1H3v-1z" fill="currentColor" />
        </>
      )}
      {name === 'engineMgr' && (
        <>
          <rect x="5" y="5" width="10" height="10" rx="2" fill="currentColor" />
          <rect x="7.4" y="7.4" width="5.2" height="5.2" rx="1" fill={white} opacity="0.9" />
          <path d="M3 7h2M3 10h2M3 13h2M15 7h2M15 10h2M15 13h2M7 3v2M10 3v2M13 3v2M7 15v2M10 15v2M13 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8.2 10h3.6M10 8.2v3.6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.95" />
        </>
      )}
      {name === 'pod' && (
        <>
          <rect x="3" y="3" width="14" height="14" rx="2" fill="currentColor" opacity="0.6" />
          <rect x="5" y="5" width="10" height="10" rx="1.5" fill="currentColor" />
        </>
      )}
      {name === 'service' && (
        <>
          <circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="8" y="4" width="4" height="5" rx="1" fill="currentColor" />
          <rect x="8" y="11" width="4" height="5" rx="1" fill="currentColor" />
        </>
      )}
      {name === 'config' && (
        <>
          <circle cx="10" cy="10" r="3" fill="currentColor" />
          <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
      {name === 'se' && (
        <>
          <rect x="3" y="4" width="14" height="12" rx="2" fill="currentColor" opacity="0.6" />
          <path d="M6 4V2h8v2M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      )}
      {name === 'task' && (
        <>
          <rect x="3" y="2.5" width="14" height="15" rx="2" fill="currentColor" opacity="0.18" />
          <path d="M6 6h8M6 10h8M6 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M5 6l1 1 2-2M5 10l1 1 2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
  routerYaml?: string;
  workerYaml?: string;
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
  type?: 'single' | 'pd' | 'kt';
  source?: 'official' | 'custom';
  model?: string;
  scenario?: string;
  gpu?: string;
  gpuCount?: number;
  gpuVram?: string;
  quantization?: string;
  backend?: string;
  maxModelLen?: number;
  maxBatchSize?: number;
  tested?: string;
  tester?: string;
  cpu?: string;
  version?: string;
  sceneTags?: string[];
  env?: { image?: string; cpu?: string; mem?: string; disk?: string; network?: string; kernel?: string; driver?: string; backend?: string; version?: string };
  benchmark?: Array<{ len?: number; label?: string; prefill?: number; decode?: number; outputTokens?: string; notes?: string; inputLen?: number; outputLen?: number; concurrency?: number; ttft?: number; tpot?: number; tps?: number }>;
  baselineBenchmark?: Array<{ len?: number; label?: string; prefill?: number; decode?: number; inputLen?: number; outputLen?: number; concurrency?: number; ttft?: number; tpot?: number; tps?: number }>;
  benchmarkSource?: { taskId: string; taskName: string; importedAt: string; mode: string };
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
  remark?: string;
  label: string;
  tags?: string[];
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

type PodRecord = {
  key: string;
  name: string;
  cluster: string;
  role: string;
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
  tpotP50?: number;
  tpotP99?: number;
  tpotHistory?: number[];
  ttftP50?: number;
  ttftP99?: number;
  ttftHistory?: number[];
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

type EngineManageRecord = {
  key: string;
  name: string;
  engine: string;
  version: string;
  status: 'normal' | 'error';
  platform: string;
  gpuTypes: string[];
  type: '用户上传' | '系统内置';
  description: string;
  imageName: string;
  startCommand: string;
  params: string;
  createdAt: string;
  updatedAt: string;
  exceptionInfo: string;
  relatedModels: string[];
};

type UserManageRecord = {
  key: string;
  username: string;
  role: 'admin' | 'user';
  remark: string;
};

type ThemeSettingsState = {
  colorPrimary: string;
  pageTitle: string;
  windowLogo: string;
  layoutLogo: string;
  loginBackground: string;
  loginCenterLogo: string;
  loginTopLogo: string;
  loginHeroTitle: string;
  loginHeroSubtitle: string;
  loginTitleColor: string;
  loginSubtitleColor: string;
  loginFooterText: string;
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

type ExtraInstanceInfo = {
  node: string;
  routerNodes: string[];
  prefillNodes: string[];
  decodeNodes: string[];
};

const clusters: ClusterRecord[] = [
  { key: 'c1', name: 'beijing-prod', region: '北京一区', nodes: 38, gpu: 'A100 80G x 160 / H20 x 64', gpuTypes: [{ name: 'A100', nodes: 24, cards: 160, usage: 78 }, { name: 'H20', nodes: 14, cards: 64, usage: 62 }], gpuUsage: 72, cpu: '1,824 / 2,432 Core', memory: '9.4 / 14.8 TB', models: 18, status: 'healthy', authInfo: '36/38' },
  { key: 'c2', name: 'shanghai-online', region: '上海二区', nodes: 46, gpu: 'H20 x 304 / 910B x 64', gpuTypes: [{ name: 'H20', nodes: 38, cards: 304, usage: 68 }, { name: '910B', nodes: 8, cards: 64, usage: 54 }], gpuUsage: 66, cpu: '2,118 / 2,944 Core', memory: '11.2 / 18.1 TB', models: 24, status: 'healthy', authInfo: '42/46' },
  { key: 'c3', name: 'guangzhou-test', region: '广州测试', nodes: 19, gpu: 'L20 x 72 / A100 x 24', gpuTypes: [{ name: 'L20', nodes: 15, cards: 72, usage: 38 }, { name: 'A100', nodes: 4, cards: 24, usage: 52 }], gpuUsage: 92, cpu: '742 / 1,216 Core', memory: '3.7 / 7.6 TB', models: 9, status: 'warning', authInfo: '15/19' },
  { key: 'c4', name: 'wuhan-kunpeng', region: '武汉专区', nodes: 16, gpu: 'Ascend 910B x 64 / L20 x 24', gpuTypes: [{ name: '910B', nodes: 8, cards: 64, usage: 61 }, { name: 'L20', nodes: 4, cards: 24, usage: 45 }], gpuUsage: 58, cpu: '624 / 1,024 Core', memory: '2.9 / 6.4 TB', models: 7, status: 'healthy', authInfo: '16/16' },
];

const nodes: NodeRecord[] = [
  { key: 'n1', clusterKey: 'c1', name: 'qujing4', label: 'GPU=RTX_4090', tags: ['deployment=dev', 'zone=shanghai', 'worker=high-performance', 'accelerator=nvidia-rtx'], clusterName: 'beijing-prod', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.4', cpu: 128, cpuUsed: 42, memory: '1007.56 GB', memoryUsed: '352.6 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '95.9 GB', disk: '3.86 TB', diskUsed: '1.54 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 52, power: 315, temperature: 72, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 98, power: 425, temperature: 81, status: 'active', replicas: [] }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 95, power: 410, temperature: 78, status: 'active', replicas: [] }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 87, power: 380, temperature: 75, status: 'active', replicas: [] }] },
  { key: 'n2', clusterKey: 'c1', name: 'qujing7', label: 'GPU=RTX_4090', clusterName: 'beijing-prod', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.21', cpu: 192, cpuUsed: 68, memory: '1.48 TB', memoryUsed: '521.3 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '115.2 GB', disk: '12.6 TB', diskUsed: '5.04 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 48, power: 300, temperature: 68, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 92, power: 400, temperature: 76, status: 'active', replicas: [] }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 94, power: 405, temperature: 77, status: 'active', replicas: [] }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 88, power: 385, temperature: 74, status: 'active', replicas: [] }] },
  { key: 'n3', clusterKey: 'c1', name: 'qujing21', label: 'GPU=RTX_4090', clusterName: 'beijing-prod', status: 'normal', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.109.6', cpu: 192, cpuUsed: 56, memory: '1007.51 GB', memoryUsed: '483.6 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '67.2 GB', disk: '3.86 TB', diskUsed: '2.12 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '19.2 GB', memoryFree: '4.79 GB', utilization: 78, power: 350, temperature: 71, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 96, power: 420, temperature: 82, status: 'active', replicas: [] }] },
  { key: 'n4', clusterKey: 'c1', name: 'qujing1', label: 'GPU=RTX_5000', clusterName: 'beijing-prod', status: 'error', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.200.10', cpu: 192, cpuUsed: 0, memory: '1007.39 GB', memoryUsed: '0 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '0 GB', disk: '3.86 TB', diskUsed: '1.89 TB', gpuCards: [{ index: 0, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 35, status: 'idle', replicas: [] }, { index: 1, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle', replicas: [] }] },
  { key: 'n5', clusterKey: 'c1', name: 'qujing24', label: 'GPU=RTX_4090', clusterName: 'beijing-prod', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.109.23', cpu: 96, cpuUsed: 38, memory: '503.35 GB', memoryUsed: '176.2 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '57.6 GB', disk: '5.68 TB', diskUsed: '2.27 TB', gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '14.4 GB', memoryFree: '9.59 GB', utilization: 58, power: 320, temperature: 69, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 93, power: 408, temperature: 79, status: 'active', replicas: [] }] },
  { key: 'n6', clusterKey: 'c1', name: 'qujing20', label: 'GPU=RTX_4011', clusterName: 'beijing-prod', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.110.20', cpu: 192, cpuUsed: 72, memory: '1007.51 GB', memoryUsed: '604.5 GB', gpu: 2, gpuMemory: '95.97 GB', gpuMemoryUsed: '72.0 GB', disk: '3.86 TB', diskUsed: '1.62 TB', gpuCards: [{ index: 0, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '16.8 GB', memoryFree: '7.19 GB', utilization: 68, power: 340, temperature: 70, status: 'active', replicas: [] }, { index: 1, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 91, power: 395, temperature: 76, status: 'active', replicas: [] }] },
  { key: 'n7', clusterKey: 'c2', name: 'nj-h20-001', label: 'GPU=H20', tags: ['deployment=glm51_1_prefill', 'worker=true'], clusterName: 'shanghai-online', status: 'normal', authStatus: 'authorized', modelCount: 1, runningInstances: 2, ip: '192.168.120.1', cpu: 256, cpuUsed: 112, memory: '2.01 TB', memoryUsed: '824.1 GB', gpu: 8, gpuMemory: '383.9 GB', gpuMemoryUsed: '230.3 GB', disk: '8.5 TB', diskUsed: '4.25 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'H20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: i < 5 ? '47.9 GB' : '23.9 GB', memoryFree: i < 5 ? '0.09 GB' : '24.09 GB', utilization: i < 5 ? 95 : 48, power: i < 5 ? 280 : 160, temperature: i < 5 ? 78 : 62, status: 'active', replicas: i < 5 ? ['deepseek-prod-r1-p1', 'deepseek-prod-r1-p2'] : [] })) },
  { key: 'n8', clusterKey: 'c2', name: 'nj-h20-002', label: 'GPU=H20', tags: ['deployment=prod'], clusterName: 'shanghai-online', status: 'normal', authStatus: 'authorized', modelCount: 2, runningInstances: 4, ip: '192.168.120.2', cpu: 256, cpuUsed: 148, memory: '2.01 TB', memoryUsed: '1.21 TB', gpu: 8, gpuMemory: '383.9 GB', gpuMemoryUsed: '287.9 GB', disk: '8.5 TB', diskUsed: '5.53 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'H20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: i < 6 ? '47.9 GB' : '23.9 GB', memoryFree: i < 6 ? '0.09 GB' : '24.09 GB', utilization: i < 6 ? 97 : 52, power: i < 6 ? 285 : 165, temperature: i < 6 ? 80 : 64, status: 'active', replicas: i < 6 ? ['qwen3-coding-p1', 'qwen3-coding-p2'] : [] })) },
  // ── c4: wuhan-kunpeng ──
  { key: 'n11', clusterKey: 'c4', name: 'nj-910b-001', label: 'GPU=Ascend_910B', clusterName: 'wuhan-kunpeng', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, ip: '192.168.140.5', cpu: 128, cpuUsed: 72, memory: '1.01 TB', memoryUsed: '604.8 GB', gpu: 8, gpuMemory: '191.95 GB', gpuMemoryUsed: '134.4 GB', disk: '4.2 TB', diskUsed: '2.52 TB', gpuCards: Array.from({ length: 8 }, (_, i) => ({ index: i, model: 'Ascend 910B', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: i < 6 ? '19.2 GB' : '9.6 GB', memoryFree: i < 6 ? '4.79 GB' : '14.39 GB', utilization: i < 6 ? 82 : 42, power: 220, temperature: 72, status: 'active', replicas: [] })) },
  { key: 'n10', clusterKey: 'c3', name: 'gz-l20-001', label: 'GPU=L20', clusterName: 'guangzhou-test', status: 'normal', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, ip: '192.168.130.5', cpu: 192, cpuUsed: 84, memory: '1007.51 GB', memoryUsed: '453.4 GB', gpu: 4, gpuMemory: '191.95 GB', gpuMemoryUsed: '115.2 GB', disk: '3.86 TB', diskUsed: '1.35 TB', gpuCards: Array.from({ length: 4 }, (_, i) => ({ index: i, model: 'L20', spec: '48 GB', memoryTotal: '47.99 GB', memoryUsed: '23.9 GB', memoryFree: '24.09 GB', utilization: 52 + i * 8, power: 180, temperature: 66, status: 'active', replicas: [] })) },
];

const pods: PodRecord[] = [
  { key: 'p1', name: 'deepseek-prod-r1-p1', cluster: 'shanghai-online', role: 'decode', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 78, performance: 92, image: 'vllm/vllm-openai:latest', podIP: '10.0.1.12', node: 'nj-h20-001', nodeGPU: 'H20 141G × 8', gpuUtil: 72, gpuVram: 61, age: '12d', trafficSource: 'rbg-deepseek-prod', tpotP50: 72, tpotP99: 98, tpotHistory: [68,71,73,75,72,69,66,70,74,77,76,73,70,68,65,69,72,75,73,71,68,67,70,74,78,80,79,76,73,71,68,66,69,72,75,78,76,74,71,69,67,70,73,76,79,81,80,77,74,72,69,71,74,77,75,72,70,67,71,73] },
  { key: 'p2', name: 'deepseek-prod-r1-p2', cluster: 'shanghai-online', role: 'decode', namespace: 'production', ready: '1/1', status: 'Running', restart: 1, load: 72, performance: 88, image: 'vllm/vllm-openai:latest', podIP: '10.0.1.13', node: 'nj-h20-001', nodeGPU: 'H20 141G × 8', gpuUtil: 68, gpuVram: 58, age: '10d', trafficSource: 'rbg-deepseek-prod', tpotP50: 68, tpotP99: 95, tpotHistory: [65,67,70,72,69,66,64,68,71,74,73,70,67,65,63,67,70,73,71,68,65,64,67,71,75,77,76,73,70,68,65,63,66,70,73,75,73,70,68,66,64,67,71,74,76,78,76,73,71,68,66,68,71,74,72,69,67,64,68,70] },
  { key: 'p3', name: 'qwen3-coding-p1', cluster: 'shanghai-online', role: 'decode', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 65, performance: 85, image: 'sglang/sglang:latest', podIP: '10.0.2.15', node: 'nj-h20-002', nodeGPU: 'H20 141G × 8', gpuUtil: 76, gpuVram: 69, age: '8d', trafficSource: 'qwen3-coding-slo', tpotP50: 62, tpotP99: 88, tpotHistory: [60,63,65,64,61,59,58,62,65,68,66,63,61,59,57,61,64,67,65,62,60,58,61,65,68,70,68,65,63,61,58,57,60,64,67,69,67,64,62,60,58,61,64,67,70,71,69,66,64,61,59,62,65,67,65,62,60,57,61,63] },
  { key: 'p4', name: 'qwen3-coding-p2', cluster: 'shanghai-online', role: 'decode', namespace: 'production', ready: '1/1', status: 'Running', restart: 2, load: 61, performance: 82, image: 'sglang/sglang:latest', podIP: '10.0.2.16', node: 'nj-h20-002', nodeGPU: 'H20 141G × 8', gpuUtil: 71, gpuVram: 64, age: '8d', trafficSource: 'qwen3-coding-slo', tpotP50: 58, tpotP99: 85, tpotHistory: [56,58,61,60,57,55,54,58,61,63,62,59,57,55,53,57,60,62,61,58,56,54,57,61,63,65,64,61,59,57,54,53,56,60,62,64,63,60,58,56,54,57,60,63,65,66,64,62,59,57,55,58,60,63,61,58,56,53,57,59] },
  { key: 'p5', name: 'glm51-1-prefill-p1', cluster: 'shanghai-online', role: 'prefill', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 89, performance: 95, image: 'sglang/sglang:latest', podIP: '10.0.1.8', node: 'nj-h20-001', nodeGPU: 'H20 141G × 8', gpuUtil: 85, gpuVram: 73, age: '15d', trafficSource: 'glm51-1-slo', ttftP50: 320, ttftP99: 580, ttftHistory: [310,325,340,335,315,305,298,320,345,360,350,330,315,308,295,318,340,355,345,325,310,302,325,348,365,370,358,340,322,310,300,315,338,355,360,345,328,312,305,298,315,335,355,370,375,362,342,325,312,305,320,340,358,350,332,315,302,310,330,345] },
  { key: 'p6', name: 'glm51-1-prefill-p2', cluster: 'shanghai-online', role: 'prefill', namespace: 'production', ready: '1/1', status: 'Running', restart: 1, load: 84, performance: 91, image: 'sglang/sglang:latest', podIP: '10.0.1.9', node: 'nj-h20-001', nodeGPU: 'H20 141G × 8', gpuUtil: 82, gpuVram: 70, age: '14d', trafficSource: 'glm51-1-slo', ttftP50: 305, ttftP99: 560, ttftHistory: [295,310,325,320,300,290,285,308,332,348,338,318,302,292,282,305,328,342,332,312,298,288,310,335,352,358,345,326,310,298,288,302,325,342,348,332,315,300,290,282,300,322,342,358,362,350,330,312,300,288,305,328,345,338,318,302,290,298,318,332] },
  { key: 'p7', name: 'glm-air-batch-p1', cluster: 'guangzhou-test', role: 'other', namespace: 'batch', ready: '1/1', status: 'Running', restart: 3, load: 45, performance: 63, image: 'vllm/vllm-openai:latest', podIP: '10.0.3.22', node: 'gz-l20-001', nodeGPU: 'L20 48G × 4', gpuUtil: 54, gpuVram: 66, age: '6d', trafficSource: 'glm-air-batch' },
  { key: 'p8', name: 'glm-air-batch-p2', cluster: 'guangzhou-test', role: 'other', namespace: 'batch', ready: '0/1', status: 'Pending', restart: 5, load: 0, performance: 0, image: 'vllm/vllm-openai:latest', podIP: '10.0.3.23', node: 'gz-l20-001', nodeGPU: 'L20 48G × 4', gpuUtil: 0, gpuVram: 0, age: '6d', trafficSource: 'glm-air-batch' },
  { key: 'p9', name: 'kimi-router-canary-p1', cluster: 'wuhan-kunpeng', role: 'router', namespace: 'canary', ready: '1/1', status: 'Running', restart: 0, load: 52, performance: 74, image: 'mindie/mindie:latest', podIP: '10.0.4.5', node: 'nj-910b-001', nodeGPU: 'Ascend 910B × 8', gpuUtil: 61, gpuVram: 52, age: '5d', trafficSource: 'kimi-router-canary', ttftP50: 180, ttftP99: 350, ttftHistory: [172,185,195,190,178,168,162,182,198,210,205,188,175,165,158,178,195,208,202,185,172,162,180,198,212,218,208,192,178,168,158,172,192,208,215,200,182,170,162,155,172,190,208,218,222,210,195,180,168,158,175,192,210,205,188,175,162,170,185,200] },
  { key: 'p10', name: 'kimi-router-canary-p2', cluster: 'wuhan-kunpeng', role: 'router', namespace: 'canary', ready: '1/1', status: 'Running', restart: 1, load: 48, performance: 71, image: 'mindie/mindie:latest', podIP: '10.0.4.6', node: 'nj-910b-001', nodeGPU: 'Ascend 910B × 8', gpuUtil: 57, gpuVram: 48, age: '4d', trafficSource: 'kimi-router-canary', ttftP50: 165, ttftP99: 320, ttftHistory: [158,170,182,178,162,155,150,168,185,198,190,175,162,152,145,165,182,195,188,172,158,150,168,185,200,205,195,180,165,155,148,160,178,195,202,188,170,158,150,142,160,178,195,205,210,198,182,168,155,145,162,178,195,190,172,160,148,155,172,188] },
  { key: 'p11', name: 'deepseek-prod-r1-p3', cluster: 'shanghai-online', role: 'decode', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 75, performance: 90, image: 'vllm/vllm-openai:latest', podIP: '10.0.2.18', node: 'nj-h20-002', nodeGPU: 'H20 141G × 8', gpuUtil: 74, gpuVram: 66, age: '9d', trafficSource: 'rbg-deepseek-prod', tpotP50: 70, tpotP99: 96, tpotHistory: [66,69,72,74,71,67,65,69,73,76,74,71,68,66,63,67,71,74,72,69,66,65,68,73,76,79,77,74,71,69,66,64,67,71,74,76,74,71,69,66,64,68,71,74,77,79,77,75,72,69,67,69,72,75,73,70,67,64,68,71] },
  { key: 'p12', name: 'deepseek-dev-p1', cluster: 'beijing-prod', role: 'decode', namespace: 'development', ready: '1/1', status: 'Running', restart: 0, load: 28, performance: 55, image: 'vllm/vllm-openai:latest', podIP: '10.0.5.2', node: 'qujing4', nodeGPU: 'A100 80G × 4', gpuUtil: 36, gpuVram: 42, age: '2d', trafficSource: 'deepseek-dev', tpotP50: 42, tpotP99: 65, tpotHistory: [40,42,44,43,41,39,38,41,44,46,45,42,40,38,37,40,43,45,44,41,39,38,41,44,46,48,46,44,42,40,38,37,40,43,45,47,45,43,41,39,37,40,43,46,48,49,47,45,42,40,38,41,43,46,44,41,39,37,40,42] },
  { key: 'p13', name: 'deepseek-dev-p2', cluster: 'beijing-prod', role: 'decode', namespace: 'development', ready: '1/1', status: 'Running', restart: 2, load: 24, performance: 48, image: 'vllm/vllm-openai:latest', podIP: '10.0.5.3', node: 'qujing7', nodeGPU: 'A100 80G × 4', gpuUtil: 31, gpuVram: 38, age: '1d', trafficSource: 'deepseek-dev', tpotP50: 39, tpotP99: 60, tpotHistory: [37,39,41,40,38,36,35,38,41,43,42,39,37,35,34,37,40,42,41,38,36,35,38,41,43,45,43,41,39,37,35,34,37,40,42,44,42,40,38,36,34,37,40,43,45,46,44,42,39,37,35,38,40,43,41,38,36,34,37,39] },
  { key: 'p14', name: 'qwen2-demo-p1', cluster: 'beijing-prod', role: 'other', namespace: 'demo', ready: '1/1', status: 'Running', restart: 0, load: 18, performance: 42, image: 'sglang/sglang:latest', podIP: '10.0.5.4', node: 'qujing4', nodeGPU: 'A100 80G × 4', gpuUtil: 24, gpuVram: 32, age: '3d', trafficSource: 'qwen2-demo' },
  { key: 'p15', name: 'qwen2-demo-p2', cluster: 'beijing-prod', role: 'other', namespace: 'demo', ready: '0/1', status: 'Failed', restart: 8, load: 0, performance: 0, image: 'sglang/sglang:latest', podIP: '10.0.5.5', node: 'qujing4', nodeGPU: 'A100 80G × 4', gpuUtil: 0, gpuVram: 0, age: '3d', trafficSource: 'qwen2-demo' },
  { key: 'p16', name: 'mistral-prod-p1', cluster: 'shanghai-online', role: 'prefill', namespace: 'production', ready: '1/1', status: 'Running', restart: 0, load: 82, performance: 93, image: 'sglang/sglang:latest', podIP: '10.0.1.20', node: 'nj-h20-001', nodeGPU: 'H20 141G × 8', gpuUtil: 79, gpuVram: 67, age: '20d', trafficSource: 'mistral-vllm-slo', ttftP50: 280, ttftP99: 520, ttftHistory: [272,285,298,292,278,268,260,282,305,320,310,290,275,265,255,278,300,315,305,285,270,260,282,305,322,328,315,298,280,268,258,272,295,312,318,302,285,270,262,252,270,292,312,328,332,318,300,282,270,258,275,298,315,308,290,275,262,270,288,302] },
];

const podYamlTemplates = [
  { name: 'nginx.yaml', desc: 'Nginx Web Server', content: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: nginx-web\n  labels:\n    app: nginx\nspec:\n  containers:\n    - name: nginx\n      image: nginx:latest\n      ports:\n        - containerPort: 80\n      resources:\n        requests:\n          cpu: "500m"\n          memory: "512Mi"\n        limits:\n          cpu: "1"\n          memory: "1Gi"' },
  { name: 'redis.yaml', desc: 'Redis Cache', content: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: redis-cache\n  labels:\n    app: redis\nspec:\n  containers:\n    - name: redis\n      image: redis:7-alpine\n      ports:\n        - containerPort: 6379\n      resources:\n        requests:\n          cpu: "500m"\n          memory: "512Mi"\n        limits:\n          cpu: "2"\n          memory: "2Gi"' },
  { name: 'vllm-infer.yaml', desc: 'vLLM Inference', content: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: vllm-infer\n  labels:\n    app: vllm\nspec:\n  containers:\n    - name: vllm\n      image: vllm/vllm-openai:latest\n      ports:\n        - containerPort: 8000\n      env:\n        - name: MODEL\n          value: "Qwen2.5-7B-Instruct"\n        - name: GPU_MEMORY_UTILIZATION\n          value: "0.9"\n      resources:\n        requests:\n          cpu: "8"\n          memory: "32Gi"\n          nvidia.com/gpu: 1\n        limits:\n          cpu: "16"\n          memory: "64Gi"\n          nvidia.com/gpu: 1' },
  { name: 'sglang-infer.yaml', desc: 'SGLang Inference', content: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: sglang-infer\n  labels:\n    app: sglang\nspec:\n  containers:\n    - name: sglang\n      image: lmsysorg/sglang:latest\n      ports:\n        - containerPort: 30000\n      env:\n        - name: MODEL\n          value: "Meta-Llama-3.1-8B-Instruct"\n        - name: MAX_MODEL_LEN\n          value: "16384"\n      resources:\n        requests:\n          cpu: "8"\n          memory: "32Gi"\n          nvidia.com/gpu: 2\n        limits:\n          cpu: "16"\n          memory: "64Gi"\n          nvidia.com/gpu: 2' },
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

type MonitorRow = {
  key: string;
  name: string;
  serviceName: string;
  modelName: string;
  cluster: string;
  clusterList: string[];
  callTotal: number;
  callFailed: number;
  failRate: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  avgTtft: number;
  avgOtps: number;
  cacheHitRate: string;
  interfaceCount: number;
  hasV2: boolean;
};

const monitorRows: MonitorRow[] = Array.from({ length: 107 }, (_, index) => {
  const name = monitorModelNames[index % monitorModelNames.length];
  const metrics = getMockMonitorMetrics(index);
  const rowName = index < monitorModelNames.length ? name : `${name}-${Math.floor(index / monitorModelNames.length) + 1}`;
  const cluster = monitorClusterNames[index % monitorClusterNames.length];
  return {
    key: `monitor-${index + 1}`,
    name: rowName,
    serviceName: rowName,
    modelName: rowName,
    cluster,
    clusterList: [cluster],
    ...metrics,
    hasV2: !['tokenizer', 'ERNIE Speed-AppBuilder'].includes(name),
  };
});

const defaultStartupSceneTags = ['AI Coding', 'RAG 问答', 'Agent 工具调用', '数据分析', '客服问答', '代码审查', '长文摘要'];
const chipVendorOptions = ['NVIDIA', 'Ascend', 'PPU', '摩尔', '沐曦', '寒武纪', '昆仑芯', '天数', '海光'];

type BenchmarkImportRecord = {
  id: number;
  taskName: string;
  mode: string;
  status: 'completed' | 'running' | 'failed' | 'stopped' | 'pending';
  serviceName: string;
  modelName: string;
  createdBy: string;
  createdAt: string;
  rows: Array<{ inputLen: number; outputLen: number; concurrency: number; ttft: number; tpot: number; tps: number }>;
};

const benchmarkImportRecords: BenchmarkImportRecord[] = [
  {
    id: 1001,
    taskName: 'DeepSeek-R1 0528 H20 单机压测',
    mode: '全矩阵压测',
    status: 'completed',
    serviceName: 'deepseek-r1-prod',
    modelName: 'DeepSeek-R1-0528',
    createdBy: 'admin',
    createdAt: '2026-06-06 15:20',
    rows: [
      { inputLen: 512, outputLen: 512, concurrency: 8, ttft: 170, tpot: 12.5, tps: 640 },
      { inputLen: 1024, outputLen: 512, concurrency: 16, ttft: 245, tpot: 12.1, tps: 1320 },
      { inputLen: 4096, outputLen: 1024, concurrency: 32, ttft: 940, tpot: 11.4, tps: 2800 },
      { inputLen: 8192, outputLen: 1024, concurrency: 64, ttft: 1000, tpot: 11.9, tps: 5376 },
    ],
  },
  {
    id: 1003,
    taskName: 'Qwen3-235B-A22B H100 单机压测',
    mode: '自定义压测',
    status: 'completed',
    serviceName: 'qwen2.5-coder-prod',
    modelName: 'Qwen3-235B-A22B',
    createdBy: 'admin',
    createdAt: '2026-06-02 15:20',
    rows: [
      { inputLen: 512, outputLen: 512, concurrency: 8, ttft: 88, tpot: 22.2, tps: 360 },
      { inputLen: 1024, outputLen: 512, concurrency: 16, ttft: 125, tpot: 21.6, tps: 739 },
      { inputLen: 4096, outputLen: 1024, concurrency: 32, ttft: 460, tpot: 20.2, tps: 1584 },
    ],
  },
  {
    id: 1005,
    taskName: 'Llama-3.1-8B vLLM 轻量压测',
    mode: '最大并发压测',
    status: 'completed',
    serviceName: 'llama-3-light-prod',
    modelName: 'Llama-3.1-8B-Instruct',
    createdBy: 'ops',
    createdAt: '2026-05-30 15:20',
    rows: [
      { inputLen: 512, outputLen: 256, concurrency: 16, ttft: 72, tpot: 35.7, tps: 448 },
      { inputLen: 1024, outputLen: 512, concurrency: 32, ttft: 105, tpot: 33.9, tps: 944 },
      { inputLen: 4096, outputLen: 512, concurrency: 64, ttft: 330, tpot: 33.1, tps: 1933 },
    ],
  },
];

const inferChipVendor = (gpu?: string) => {
  const value = String(gpu || '');
  if (/H20|H100|A100|A800|RTX|L40|L20/i.test(value)) return 'NVIDIA';
  if (/910|Ascend|昇腾/i.test(value)) return 'Ascend';
  if (/PPU/i.test(value)) return 'PPU';
  if (/摩尔|Moore|MTT|MUSA/i.test(value)) return '摩尔';
  if (/沐曦|沐熙|MetaX|METAx|MX/i.test(value)) return '沐曦';
  if (/寒武纪|MLU/i.test(value)) return '寒武纪';
  if (/昆仑|R\d+/i.test(value)) return '昆仑芯';
  if (/天数/i.test(value)) return '天数';
  if (/海光|DCU/i.test(value)) return '海光';
  return '其他';
};

const parseStartupYamlValue = (yaml: string, key: string) => {
  const line = yaml.split('\n').find((item) => item.trim().startsWith(`${key}:`));
  return line ? line.split(':').slice(1).join(':').trim() : undefined;
};

const isYamlFile = (file?: Pick<File, 'name' | 'type'> | null) => {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  return name.endsWith('.yaml') || name.endsWith('.yml');
};

const normalizeStartupTemplate = (item: StartupTemplateRecord): StartupTemplateRecord => {
  const type = item.type || (item.deployMode === 'PD 分离' ? 'pd' : item.engine === 'KTransformers' ? 'kt' : 'single');
  const model = item.model || item.name.replace(/\s*(SGLang|vLLM|PD|模板|单机|分布式).*/i, '') || item.modelFamily;
  const gpu = item.gpu || item.hardware.replace(/^NVIDIA\s+/i, '').replace(/^Ascend\s+/i, '') || item.hardware;
  const command = item.command || item.yamlContent || '';
  return {
    ...item,
    type,
    source: item.source || (item.key.includes('custom') ? 'custom' : 'official'),
    model,
    scenario: item.scenario || item.description,
    gpu,
    gpuCount: item.gpuCount || item.cardCount || 1,
    quantization: item.quantization || 'FP8',
    maxModelLen: item.maxModelLen || 32768,
    maxBatchSize: item.maxBatchSize || 128,
    command,
    env: item.env || { image: item.imageKey || '-', cpu: '-', mem: '-', disk: '-', network: '-', kernel: '-' },
    benchmark: item.benchmark || [
      { label: '512', len: 512, prefill: 170, decode: 80 },
      { label: '1K', len: 1024, prefill: 245, decode: 82.5 },
      { label: '4K', len: 4096, prefill: 940, decode: 87.5 },
    ],
  };
};

const isSingleBenchmarkRowFilled = (row: { inputLen?: number; outputLen?: number; concurrency?: number; ttft?: number; tpot?: number; tps?: number }) => (
  Number(row.inputLen || 0) > 0
  || Number(row.outputLen || 0) > 0
  || Number(row.concurrency || 0) > 0
  || Number(row.ttft || 0) > 0
  || Number(row.tpot || 0) > 0
  || Number(row.tps || 0) > 0
);

const isKtBenchmarkRowFilled = (row: { len?: number; prefill?: number; decode?: number }) => (
  Number(row.len || 0) > 0
  || Number(row.prefill || 0) > 0
  || Number(row.decode || 0) > 0
);

const ktOfficialTemplates: StartupTemplateRecord[] = [
  {
    "key": "tpl-kt-official-1",
    "name": "Qwen3.5-35B-A3B KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-35B-A3B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 4x RTX 5090 · 97.5 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 4 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 188,
        "decode": 88.3
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 272,
        "decode": 90.1
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1049,
        "decode": 97.5
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1007,
        "decode": 91.4
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1062,
        "decode": 89.4
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 1221,
        "decode": 83
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 1924,
        "decode": 75.8
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-2",
    "name": "Qwen3.5-35B-A3B KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-35B-A3B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 2x RTX 5090 · 93.2 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 2 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 189,
        "decode": 84.2
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 269,
        "decode": 86.9
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1079,
        "decode": 93
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1054,
        "decode": 93.2
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1123,
        "decode": 88.7
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 1327,
        "decode": 82.9
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 2107,
        "decode": 75.8
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-3",
    "name": "Qwen3.5-35B-A3B KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-35B-A3B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 1x RTX 5090 · 86.2 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 1 \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 167,
        "decode": 83
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 256,
        "decode": 82.9
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1141,
        "decode": 86.2
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1161,
        "decode": 84.6
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1239,
        "decode": 84.5
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 1493,
        "decode": 76
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 2413,
        "decode": 71.9
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-4",
    "name": "Qwen3.5-35B-A3B KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-35B-A3B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 1x RTX 5090 · 60.9 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355 (AVX2)",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 9355 (AVX2)",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 526.2,
        "decode": 60.9,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 1963.3,
        "decode": 60.7,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 2392.2,
        "decode": 59.6,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 6789.6,
        "decode": 57.4,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-5",
    "name": "Qwen3.5-122B-A10B KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-122B-A10B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 4x RTX 5090 · 54.6 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 4 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 512,
        "decode": 43.3
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 622,
        "decode": 49.5
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1624,
        "decode": 54.6
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1579,
        "decode": 53.7
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1665,
        "decode": 54.2
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 2032,
        "decode": 50.7
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 3256,
        "decode": 47.3
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-6",
    "name": "Qwen3-30B-A3B KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3-30B-A3B",
    "modelFamily": "Qwen3",
    "scenario": "KT 1x RTX 5090 · 52.5 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355 (AVX2)",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "BF16",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 9355 (AVX2)",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 1179.6,
        "decode": 52.5,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 2966.6,
        "decode": 51.6,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 3079.9,
        "decode": 50.2,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 2971.2,
        "decode": 45.8,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-7",
    "name": "Qwen3.5-122B-A10B KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-122B-A10B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 2x RTX 5090 · 51.9 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 2 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 384,
        "decode": 46
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 612,
        "decode": 47
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1920,
        "decode": 51.9
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1900,
        "decode": 51
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 2042,
        "decode": 51.4
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 2495,
        "decode": 48.5
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 4099,
        "decode": 44.8
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-8",
    "name": "Qwen3.5-122B-A10B KT 8x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-122B-A10B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 8x RTX 5090 · 48.0 TPS",
    "description": "KTransformers 官方性能配置，8x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 8,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 8,
    "topology": "TP8 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 8 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 398,
        "decode": 42.1
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 633,
        "decode": 43.3
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 1607,
        "decode": 48
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1639,
        "decode": 46
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1699,
        "decode": 47.5
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 2057,
        "decode": 44.4
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 3201,
        "decode": 42.1
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-9",
    "name": "Qwen3.5-122B-A10B KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-122B-A10B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 1x RTX 5090 · 47.3 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 1 \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 399,
        "decode": 41,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 615,
        "decode": 42.3,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 2571,
        "decode": 47.3,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 2627,
        "decode": 46.5,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 2832,
        "decode": 45.4,
        "notes": "TP=1, 16K+ OOM."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-10",
    "name": "MiniMax-M2.1 KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "MiniMax-M2.1",
    "modelFamily": "MiniMax",
    "scenario": "KT 4x RTX 5090 · 45.8 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model MiniMax-M2.1 \\\n  --kt-weight-path MiniMax-M2.1 \\\n  --kt-cpuinfer 102 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 63 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 4096 \\\n  --attention-backend flashinfer --trust-remote-code \\\n  --mem-fraction-static 0.8 --chunked-prefill-size 32768 \\\n  --max-running-requests 16 --max-total-tokens 100000 \\\n  --enable-mixed-chunk --tensor-parallel-size 4 \\\n  --enable-p2p-check --served-model-name MiniMax-M2.1 \\\n  --disable-shared-experts-fusion --fp8-gemm-backend triton",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 353,
        "decode": 45.7
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 437,
        "decode": 45.4
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 492,
        "decode": 45.8
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 1374,
        "decode": 45.3
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 2505,
        "decode": 45.3
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 4045,
        "decode": 44.3
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 2862,
        "decode": 43
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-11",
    "name": "MiniMax-M2.1 KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "MiniMax-M2.1",
    "modelFamily": "MiniMax",
    "scenario": "KT 2x RTX 5090 · 42.8 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model MiniMax-M2.1 \\\n  --kt-weight-path MiniMax-M2.1 \\\n  --kt-cpuinfer 102 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 31 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 4096 \\\n  --attention-backend flashinfer --trust-remote-code \\\n  --mem-fraction-static 0.8 --chunked-prefill-size 32768 \\\n  --max-running-requests 16 --max-total-tokens 50000 \\\n  --enable-mixed-chunk --tensor-parallel-size 2 \\\n  --enable-p2p-check --served-model-name MiniMax-M2.1 \\\n  --disable-shared-experts-fusion --fp8-gemm-backend triton",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 316,
        "decode": 42.1
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 389,
        "decode": 42.6
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 432,
        "decode": 42.8
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 987,
        "decode": 42.2
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1874,
        "decode": 41.8
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 2879,
        "decode": 40.2
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 2198,
        "decode": 38.2
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-12",
    "name": "MiniMax-M2.1 KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "MiniMax-M2.1",
    "modelFamily": "MiniMax",
    "scenario": "KT 1x RTX 5090 · 38.5 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model MiniMax-M2.1 \\\n  --kt-weight-path MiniMax-M2.1 \\\n  --kt-cpuinfer 102 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 15 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 4096 \\\n  --attention-backend flashinfer --trust-remote-code \\\n  --mem-fraction-static 0.8 --chunked-prefill-size 32768 \\\n  --max-running-requests 16 --max-total-tokens 40000 \\\n  --enable-mixed-chunk --tensor-parallel-size 1 \\\n  --served-model-name MiniMax-M2.1 \\\n  --disable-shared-experts-fusion --fp8-gemm-backend triton",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 301,
        "decode": 38.5,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 370,
        "decode": 38.5,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 411,
        "decode": 38.4,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 605,
        "decode": 38.3,
        "notes": "TP=1, 16K+ OOM."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1172,
        "decode": 37.2,
        "notes": "TP=1, 16K+ OOM."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-13",
    "name": "MiMo-V2-Flash KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "MiMo-V2-Flash",
    "modelFamily": "MiMo",
    "scenario": "KT 4x RTX 5090 · 35.7 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "python -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model MiMo-V2-Flash \\\n  --kt-weight-path MiMo-V2-Flash \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --served-model-name MiMo-V2-Flash --enable-mixed-chunk \\\n  --tensor-parallel-size 4 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --watchdog-timeout 3000 --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 79,
        "decode": 33.7,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 146,
        "decode": 34.2,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 235,
        "decode": 34,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 274,
        "decode": 35.7,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 315,
        "decode": 35.6,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 350,
        "decode": 35.5,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 462,
        "decode": 35.6,
        "notes": "256 routed experts, 8 experts/token, no shared expert. Hybrid SWA/GA attention."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-14",
    "name": "Qwen3.5-397B-A17B KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-397B-A17B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 4x RTX 5090 · 34.0 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 4 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 806,
        "decode": 27.3
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 1322,
        "decode": 27.7
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 4380,
        "decode": 34
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 4398,
        "decode": 34
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 4620,
        "decode": 34
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 5220,
        "decode": 32
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 8106,
        "decode": 29.5
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-15",
    "name": "DeepSeek-V4-Flash KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "DeepSeek-V4-Flash",
    "modelFamily": "DeepSeek",
    "scenario": "KT 2x RTX 5090 · 32.1 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "MXFP4",
    "version": "0.6.2.post3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export FLASHINFER_CUDA_ARCH_LIST=12.0a\nexport TORCH_CUDA_ARCH_LIST=\"12.0+PTX\"\nexport SGLANG_DSV4_MODE=2604\nexport SGLANG_DSV4_2604_SUBMODE=2604B\n\nnumactl --interleave=all python -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model /path/to/models/DeepSeek-V4-Flash \\\n  --kt-weight-path /path/to/models/DeepSeek-V4-Flash \\\n  --kt-method MXFP4 \\\n  --kt-num-gpu-experts 10 \\\n  --kt-cpuinfer 60 \\\n  --kt-threadpool-count 2 \\\n  --kt-gpu-prefill-token-threshold 4096 \\\n  --kt-enable-dynamic-expert-update \\\n  --tensor-parallel-size 2 \\\n  --context-length 16384 \\\n  --attention-backend flashinfer \\\n  --mem-fraction-static 0.85 \\\n  --chunked-prefill-size 2048 \\\n  --max-prefill-tokens 2048 \\\n  --max-running-requests 2 \\\n  --watchdog-timeout 1200 \\\n  --disable-shared-experts-fusion \\\n  --trust-remote-code \\\n  --cuda-graph-bs 1 \\\n  --cuda-graph-max-bs 1 \\\n  --disable-radix-cache \\\n  --skip-server-warmup",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.6.2.post3"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "150",
        "prefill": 308.5,
        "decode": 32.08,
        "notes": "256 routed experts, 6 experts/token, MXFP4 quant. 8K row completed with finish=stop at 19 output tokens (model-initiated EOS)."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "150",
        "prefill": 396.2,
        "decode": 31.55,
        "notes": "256 routed experts, 6 experts/token, MXFP4 quant. 8K row completed with finish=stop at 19 output tokens (model-initiated EOS)."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "150",
        "prefill": 1030.9,
        "decode": 30.97,
        "notes": "256 routed experts, 6 experts/token, MXFP4 quant. 8K row completed with finish=stop at 19 output tokens (model-initiated EOS)."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "150",
        "prefill": 998.3,
        "decode": 30.17,
        "notes": "256 routed experts, 6 experts/token, MXFP4 quant. 8K row completed with finish=stop at 19 output tokens (model-initiated EOS)."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "150",
        "prefill": 958.3,
        "decode": 26.7,
        "notes": "256 routed experts, 6 experts/token, MXFP4 quant. 8K row completed with finish=stop at 19 output tokens (model-initiated EOS)."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-16",
    "name": "Qwen3.5-397B-A17B KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-397B-A17B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 2x RTX 5090 · 32.0 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 2 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 785,
        "decode": 26.2
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 1284,
        "decode": 26.4
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 5488,
        "decode": 31.3
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 5544,
        "decode": 31.1
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 5825,
        "decode": 32
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 6660,
        "decode": 30.4
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 10488,
        "decode": 28.1
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-17",
    "name": "Qwen3.5-397B-A17B KT 8x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-397B-A17B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 8x RTX 5090 · 29.4 TPS",
    "description": "KTransformers 官方性能配置，8x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 8,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 8,
    "topology": "TP8 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model Qwen3.5-FP8 \\\n  --kt-weight-path Qwen3.5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --enable-mixed-chunk --tensor-parallel-size 8 \\\n  --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 812,
        "decode": 25.1
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 1335,
        "decode": 25.1
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 4301,
        "decode": 29.2
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 4421,
        "decode": 28.2
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 4550,
        "decode": 29.4
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 5073,
        "decode": 27.8
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 7709,
        "decode": 27.2
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-18",
    "name": "Qwen3.5-122B-A10B KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-122B-A10B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 1x RTX 5090 · 24.4 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355 (AVX2)",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 9355 (AVX2)",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 278.2,
        "decode": 24.4,
        "notes": "kt-cpuinfer 16, AVX2 mode. 8K OOM/FAIL."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 457.1,
        "decode": 24.3,
        "notes": "kt-cpuinfer 16, AVX2 mode. 8K OOM/FAIL."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 1111.6,
        "decode": 23.9,
        "notes": "kt-cpuinfer 16, AVX2 mode. 8K OOM/FAIL."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-19",
    "name": "GLM-4.7 395B KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "GLM-4.7 395B",
    "modelFamily": "GLM",
    "scenario": "KT 4x RTX 5090 · 22.8 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model GLM-4.7-FP8 \\\n  --kt-weight-path GLM-4.7-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8_PERCHANNEL \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --served-model-name GLM-4.7 --enable-mixed-chunk \\\n  --tensor-parallel-size 4 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend triton \\\n  --fp8-gemm-backend triton --kv-cache-dtype bf16 \\\n  --watchdog-timeout 3000 --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 71,
        "decode": 22.6,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 137,
        "decode": 22.8,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 277,
        "decode": 22.6,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 333,
        "decode": 22.4,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 408,
        "decode": 21.4,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 463,
        "decode": 19.6,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 462,
        "decode": 17.5,
        "notes": "160 routed experts, 8 experts/token. FP8 per-channel quantization."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-20",
    "name": "Qwen3-Coder-Next KT 1x4090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3-Coder-Next",
    "modelFamily": "Qwen3",
    "scenario": "KT 1x RTX 4090 · 20.6 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 4090 (24GB)，2x AMD EPYC 7C13 (AVX2)",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "gpuVram": "24GB",
    "hardware": "NVIDIA RTX 4090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 7C13 (AVX2)",
      "mem": "1TB DDR4-3200 16ch",
      "disk": "-",
      "network": "PCIe 4.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 16.7,
        "decode": 13.8,
        "notes": "kt-cpuinfer 16, threadpool 1, 16 GPU experts, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 232,
        "decode": 16.1,
        "notes": "kt-cpuinfer 16, threadpool 1, 16 GPU experts, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 482,
        "decode": 20.6,
        "notes": "kt-cpuinfer 16, threadpool 1, 16 GPU experts, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 917,
        "decode": 19,
        "notes": "kt-cpuinfer 16, threadpool 1, 16 GPU experts, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-21",
    "name": "Qwen3-30B-A3B-Instruct-2507 KT 1x4090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3-30B-A3B-Instruct-2507",
    "modelFamily": "Qwen3",
    "scenario": "KT 1x RTX 4090 · 19.4 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 4090 (24GB)，2x AMD EPYC 7C13 (AVX2)",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "gpuVram": "24GB",
    "hardware": "NVIDIA RTX 4090",
    "engine": "KTransformers",
    "quantization": "BF16",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 7C13 (AVX2)",
      "mem": "1TB DDR4-3200 16ch",
      "disk": "-",
      "network": "PCIe 4.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 115,
        "decode": 19.4,
        "notes": "kt-cpuinfer 16, threadpool 1, 28 GPU experts, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 240.2,
        "decode": 19.2,
        "notes": "kt-cpuinfer 16, threadpool 1, 28 GPU experts, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 236.9,
        "decode": 19.4,
        "notes": "kt-cpuinfer 16, threadpool 1, 28 GPU experts, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 218,
        "decode": 18.2,
        "notes": "kt-cpuinfer 16, threadpool 1, 28 GPU experts, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-22",
    "name": "Qwen3.5-35B-A3B KT 1x4090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3.5-35B-A3B",
    "modelFamily": "Qwen3.5",
    "scenario": "KT 1x RTX 4090 · 19.3 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 4090 (24GB)，2x AMD EPYC 7C13 (AVX2)",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "gpuVram": "24GB",
    "hardware": "NVIDIA RTX 4090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 7C13 (AVX2)",
      "mem": "1TB DDR4-3200 16ch",
      "disk": "-",
      "network": "PCIe 4.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 192.1,
        "decode": 18.8,
        "notes": "kt-cpuinfer 16, threadpool 1, 32 GPU experts, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 618.6,
        "decode": 18.9,
        "notes": "kt-cpuinfer 16, threadpool 1, 32 GPU experts, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 767.1,
        "decode": 18.9,
        "notes": "kt-cpuinfer 16, threadpool 1, 32 GPU experts, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 2072.9,
        "decode": 19.3,
        "notes": "kt-cpuinfer 16, threadpool 1, 32 GPU experts, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-23",
    "name": "DeepSeek-V4-Flash KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "DeepSeek-V4-Flash",
    "modelFamily": "DeepSeek",
    "scenario": "KT 2x RTX 5090 · 19.3 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355 (AVX2)",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "MXFP4",
    "version": "0.6.2.post3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export FLASHINFER_CUDA_ARCH_LIST=12.0a\nexport TORCH_CUDA_ARCH_LIST=\"12.0+PTX\"\nexport SGLANG_DSV4_MODE=2604\nexport SGLANG_DSV4_2604_SUBMODE=2604B\n\nnumactl --interleave=all python -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model /path/to/models/DeepSeek-V4-Flash \\\n  --kt-weight-path /path/to/models/DeepSeek-V4-Flash \\\n  --kt-method MXFP4 \\\n  --kt-num-gpu-experts 10 \\\n  --kt-cpuinfer 60 \\\n  --kt-threadpool-count 2 \\\n  --kt-gpu-prefill-token-threshold 4096 \\\n  --kt-enable-dynamic-expert-update \\\n  --tensor-parallel-size 2 \\\n  --context-length 16384 \\\n  --attention-backend flashinfer \\\n  --mem-fraction-static 0.85 \\\n  --chunked-prefill-size 2048 \\\n  --max-prefill-tokens 2048 \\\n  --max-running-requests 2 \\\n  --watchdog-timeout 1200 \\\n  --disable-shared-experts-fusion \\\n  --trust-remote-code \\\n  --cuda-graph-bs 1 \\\n  --cuda-graph-max-bs 1 \\\n  --disable-radix-cache \\\n  --skip-server-warmup",
    "env": {
      "cpu": "2x AMD EPYC 9355 (AVX2)",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.6.2.post3"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "150",
        "prefill": 60.5,
        "decode": 18.83,
        "notes": "AVX2-only kt-kernel build (LLAMA_AVX512=OFF). 256 routed experts, 6 experts/token, MXFP4 quant. 512/1K prefill rates include JIT cold-start cost; warm prefill ≥575 tok/s at 2K-4K."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "150",
        "prefill": 90.9,
        "decode": 19.13,
        "notes": "AVX2-only kt-kernel build (LLAMA_AVX512=OFF). 256 routed experts, 6 experts/token, MXFP4 quant. 512/1K prefill rates include JIT cold-start cost; warm prefill ≥575 tok/s at 2K-4K."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "150",
        "prefill": 574.7,
        "decode": 19.28,
        "notes": "AVX2-only kt-kernel build (LLAMA_AVX512=OFF). 256 routed experts, 6 experts/token, MXFP4 quant. 512/1K prefill rates include JIT cold-start cost; warm prefill ≥575 tok/s at 2K-4K."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "150",
        "prefill": 805.3,
        "decode": 18.89,
        "notes": "AVX2-only kt-kernel build (LLAMA_AVX512=OFF). 256 routed experts, 6 experts/token, MXFP4 quant. 512/1K prefill rates include JIT cold-start cost; warm prefill ≥575 tok/s at 2K-4K."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-24",
    "name": "DeepSeek-V3.2 KT 8x5090",
    "type": "kt",
    "source": "official",
    "model": "DeepSeek-V3.2",
    "modelFamily": "DeepSeek",
    "scenario": "KT 8x RTX 5090 · 17.3 TPS",
    "description": "KTransformers 官方性能配置，8x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 8,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 8,
    "topology": "TP8 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model DeepSeek-V3.2 \\\n  --kt-weight-path DeepSeek-V3.2 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 15 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --attention-backend triton \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --served-model-name DeepSeek-V3.2 --enable-mixed-chunk \\\n  --tensor-parallel-size 8 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 50000 \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 227,
        "decode": 14.2,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 322,
        "decode": 14.5,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 403,
        "decode": 17.3,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 813,
        "decode": 17.3,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 1498,
        "decode": 16.1,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 2274,
        "decode": 15,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 2222,
        "decode": 13.2,
        "notes": "256 routed experts, 8 experts/token, MLA + NSA."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-25",
    "name": "GLM-5 744B KT 8x5090",
    "type": "kt",
    "source": "official",
    "model": "GLM-5 744B",
    "modelFamily": "GLM",
    "scenario": "KT 8x RTX 5090 · 16.6 TPS",
    "description": "KTransformers 官方性能配置，8x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 8,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 8,
    "topology": "TP8 / kt-kernel + SGLang",
    "command": "export PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 30000 \\\n  --model GLM-5-FP8 \\\n  --kt-weight-path GLM-5-FP8 \\\n  --kt-cpuinfer 96 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 30 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.75 \\\n  --served-model-name GLM5 --enable-mixed-chunk \\\n  --tensor-parallel-size 8 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 4 \\\n  --max-total-tokens 128000 --attention-backend flashinfer \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 483,
        "decode": 12.8,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 592,
        "decode": 13.5,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 375,
        "decode": 16.6,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 740,
        "decode": 16.2,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 765,
        "decode": 15.7,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 1255,
        "decode": 15.4,
        "notes": "256 routed experts, 8 experts/token."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 1293,
        "decode": 15,
        "notes": "256 routed experts, 8 experts/token."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-26",
    "name": "Mistral-Large-3-675B KT 4x5090",
    "type": "kt",
    "source": "official",
    "model": "Mistral-Large-3-675B",
    "modelFamily": "Mistral",
    "scenario": "KT 4x RTX 5090 · 16.5 TPS",
    "description": "KTransformers 官方性能配置，4x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 4,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 4,
    "topology": "TP4 / kt-kernel + SGLang",
    "command": "export CUDA_VISIBLE_DEVICES=4,5,6,7\nexport PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 31000 \\\n  --model /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-weight-path /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-cpuinfer 64 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 6 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --served-model-name Mistral-Large-3 --enable-mixed-chunk \\\n  --tensor-parallel-size 4 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 1 \\\n  --max-total-tokens 40000 --attention-backend flashinfer \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --watchdog-timeout 3000 --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 41.44,
        "decode": 15.6,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 75.31,
        "decode": 16.5,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 148.66,
        "decode": 16.3,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 290.76,
        "decode": 16.1,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 542.43,
        "decode": 15.8,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 799.91,
        "decode": 15.4,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 1017.11,
        "decode": 15.2,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-27",
    "name": "Mistral-Large-3-675B KT 8x5090",
    "type": "kt",
    "source": "official",
    "model": "Mistral-Large-3-675B",
    "modelFamily": "Mistral",
    "scenario": "KT 8x RTX 5090 · 15.9 TPS",
    "description": "KTransformers 官方性能配置，8x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 8,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 8,
    "topology": "TP8 / kt-kernel + SGLang",
    "command": "export CUDA_VISIBLE_DEVICES=0,1,2,3,4,5,6,7\nexport PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 31000 \\\n  --model /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-weight-path /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-cpuinfer 64 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 6 --kt-method FP8 \\\n  --kt-gpu-prefill-token-threshold 1024 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.80 \\\n  --served-model-name Mistral-Large-3 --enable-mixed-chunk \\\n  --tensor-parallel-size 8 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 16384 --max-running-requests 1 \\\n  --max-total-tokens 40000 --attention-backend flashinfer \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --watchdog-timeout 3000 --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 39.22,
        "decode": 15,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 75.89,
        "decode": 15.7,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 150.62,
        "decode": 15.9,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 287.43,
        "decode": 15.4,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 537.92,
        "decode": 15.3,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 786.06,
        "decode": 14.9,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 985.16,
        "decode": 14.7,
        "notes": "128 routed experts, top-4 routing, layerwise prefill enabled (kt-gpu-prefill-token-threshold=1024), max-total-tokens=40000."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-28",
    "name": "MiniMax-M2.5 KT 1x5090",
    "type": "kt",
    "source": "official",
    "model": "MiniMax-M2.5",
    "modelFamily": "MiniMax",
    "scenario": "KT 1x RTX 5090 · 15.9 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 5090 (32GB)，2x AMD EPYC 9355 (AVX2)",
    "gpu": "RTX 5090",
    "gpuCount": 1,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 9355 (AVX2)",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 145.7,
        "decode": 15.9,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 203.9,
        "decode": 15.9,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 317,
        "decode": 15.8,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 317.9,
        "decode": 15.6,
        "notes": "kt-cpuinfer 16, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-29",
    "name": "Qwen3-Coder-Next KT 1x4090",
    "type": "kt",
    "source": "official",
    "model": "Qwen3-Coder-Next",
    "modelFamily": "Qwen3",
    "scenario": "KT 1x RTX 4090 · 15.8 TPS",
    "description": "KTransformers 官方性能配置，1x RTX 4090 (24GB)，2x AMD EPYC 7C13 (AVX2)",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "gpuVram": "24GB",
    "hardware": "NVIDIA RTX 4090",
    "engine": "KTransformers",
    "quantization": "BF16",
    "version": "0.5.3",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 1,
    "topology": "TP1 / kt-kernel + SGLang",
    "command": "",
    "env": {
      "cpu": "2x AMD EPYC 7C13 (AVX2)",
      "mem": "1TB DDR4-3200 16ch",
      "disk": "-",
      "network": "PCIe 4.0",
      "kernel": "Ubuntu 22.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.3"
    },
    "benchmark": [
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "300",
        "prefill": 99.3,
        "decode": 10.8,
        "notes": "kt-cpuinfer 16, threadpool 1, 6 GPU experts, AVX2 mode."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "300",
        "prefill": 149,
        "decode": 15.8,
        "notes": "kt-cpuinfer 16, threadpool 1, 6 GPU experts, AVX2 mode."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "300",
        "prefill": 336.1,
        "decode": 13.7,
        "notes": "kt-cpuinfer 16, threadpool 1, 6 GPU experts, AVX2 mode."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "300",
        "prefill": 651.4,
        "decode": 13.3,
        "notes": "kt-cpuinfer 16, threadpool 1, 6 GPU experts, AVX2 mode."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  },
  {
    "key": "tpl-kt-official-30",
    "name": "Mistral-Large-3-675B KT 2x5090",
    "type": "kt",
    "source": "official",
    "model": "Mistral-Large-3-675B",
    "modelFamily": "Mistral",
    "scenario": "KT 2x RTX 5090 · 14.8 TPS",
    "description": "KTransformers 官方性能配置，2x RTX 5090 (32GB)，2x AMD EPYC 9355",
    "gpu": "RTX 5090",
    "gpuCount": 2,
    "gpuVram": "32GB",
    "hardware": "NVIDIA RTX 5090",
    "engine": "KTransformers",
    "quantization": "FP8",
    "version": "0.5.1",
    "backend": "kt-kernel + SGLang",
    "deployMode": "单机部署",
    "nodeCount": 1,
    "cardCount": 2,
    "topology": "TP2 / kt-kernel + SGLang",
    "command": "export CUDA_VISIBLE_DEVICES=0,1\nexport PYTORCH_ALLOC_CONF=expandable_segments:True\nexport SGLANG_ENABLE_JIT_DEEPGEMM=0\nexport SGLANG_DISABLE_CUDNN_CHECK=1\n\npython -m sglang.launch_server \\\n  --host 0.0.0.0 --port 31000 \\\n  --model /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-weight-path /mnt/data/models/Mistral-Large-3-675B-Instruct-2512 \\\n  --kt-cpuinfer 64 --kt-threadpool-count 2 \\\n  --kt-num-gpu-experts 2 --kt-method FP8 \\\n  --kt-enable-dynamic-expert-update \\\n  --kt-expert-placement-strategy uniform \\\n  --trust-remote-code --mem-fraction-static 0.86 \\\n  --served-model-name Mistral-Large-3 --enable-mixed-chunk \\\n  --tensor-parallel-size 2 --enable-p2p-check \\\n  --disable-shared-experts-fusion \\\n  --chunked-prefill-size 8192 --max-running-requests 1 \\\n  --max-total-tokens 40000 --attention-backend flashinfer \\\n  --fp8-gemm-backend cutlass --kv-cache-dtype bf16 \\\n  --watchdog-timeout 3000 --disable-radix-cache",
    "env": {
      "cpu": "2x AMD EPYC 9355",
      "mem": "1.5TB DDR5-5600 24ch",
      "disk": "-",
      "network": "PCIe 5.0",
      "kernel": "Ubuntu 24.04",
      "backend": "kt-kernel + SGLang",
      "version": "0.5.1"
    },
    "benchmark": [
      {
        "len": 512,
        "label": "512",
        "outputTokens": "128",
        "prefill": 39.35,
        "decode": 14.6,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 1024,
        "label": "1K",
        "outputTokens": "128",
        "prefill": 64.76,
        "decode": 14.8,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 2048,
        "label": "2K",
        "outputTokens": "128",
        "prefill": 94.57,
        "decode": 14.8,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 4096,
        "label": "4K",
        "outputTokens": "128",
        "prefill": 122.63,
        "decode": 14.6,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 8192,
        "label": "8K",
        "outputTokens": "128",
        "prefill": 141.22,
        "decode": 14.4,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 16384,
        "label": "16K",
        "outputTokens": "128",
        "prefill": 152.83,
        "decode": 14.1,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      },
      {
        "len": 32768,
        "label": "32K",
        "outputTokens": "128",
        "prefill": 158.9,
        "decode": 14.8,
        "notes": "TP=2 uses conservative memory profile: no kt-gpu-prefill-token-threshold, kt-num-gpu-experts=2, chunked-prefill-size=8192."
      }
    ],
    "tested": "KTransformers 官方 benchmark",
    "tester": "official",
    "updatedAt": "2026-06-12 00:00"
  }
];

const buildKtStartupTemplates = (): StartupTemplateRecord[] => ktOfficialTemplates;

const buildSingleStartupTemplates = (): StartupTemplateRecord[] => [
  {
    key: 'tpl-101',
    name: 'DeepSeek-R1-0528 单机 8 卡满血推理',
    type: 'single',
    source: 'official',
    model: 'DeepSeek-R1-0528',
    modelFamily: 'DeepSeek',
    scenario: '单机 8 卡满血推理',
    description: '单机 8 卡满血推理',
    gpu: 'H20-96G',
    gpuCount: 8,
    hardware: 'NVIDIA H20-96G',
    engine: 'SGLang',
    quantization: 'FP8',
    deployMode: '单机部署',
    nodeCount: 1,
    cardCount: 8,
    topology: 'TP=8 PP=1 DP=1',
    command: '--model /models/DeepSeek-R1-0528-FP8 --tp 8 --trust-remote-code --context-length 32768 --mem-fraction 0.90 --cuda-graph-bs 1 2 4 8 16 32 64 128 --enable-dp-attention',
    env: { image: 'registry.internal/sglang:0.4.1-cu124', cpu: '96C', mem: '768Gi', disk: '1Ti', network: '25Gbps RoCE', kernel: '5.15.0-101-generic' },
    maxModelLen: 32768,
    maxBatchSize: 128,
    benchmark: [
      { len: 512, label: '512', prefill: 170.0, decode: 80.0 },
      { len: 1024, label: '1K', prefill: 245.0, decode: 82.5 },
      { len: 2048, label: '2K', prefill: 960.0, decode: 88.0 },
      { len: 4096, label: '4K', prefill: 940.0, decode: 87.5 },
      { len: 8192, label: '8K', prefill: 1000.0, decode: 84.0 },
      { len: 16384, label: '16K', prefill: 1180.0, decode: 78.0 },
      { len: 32768, label: '32K', prefill: 1850.0, decode: 71.0 },
    ],
    tested: '2026-06-06',
    tester: 'gaohuan',
    updatedAt: '2026-06-06 15:20',
  },
  {
    key: 'tpl-102',
    name: 'Qwen3-235B-A22B 单机大模型 MoE 推理',
    type: 'single',
    source: 'official',
    model: 'Qwen3-235B-A22B',
    modelFamily: 'Qwen',
    scenario: '单机大模型 MoE 推理',
    description: '单机大模型 MoE 推理',
    gpu: 'H100-80G',
    gpuCount: 8,
    hardware: 'NVIDIA H100-80G',
    engine: 'SGLang',
    quantization: 'FP8',
    deployMode: '单机部署',
    nodeCount: 1,
    cardCount: 8,
    topology: 'TP=8 PP=1 DP=1 EP=8',
    command: '--model /models/Qwen3-235B-FP8 --tp 8 --ep 8 --mem-fraction-static 0.88 --max-total-tokens 32768 --enable-ep-moe',
    env: { image: 'registry.internal/sglang:0.4.1-cu124', cpu: '96C', mem: '640Gi', disk: '800Gi', network: '25Gbps RoCE', kernel: '5.15.0-101-generic' },
    maxModelLen: 32768,
    maxBatchSize: 64,
    benchmark: [
      { len: 512, label: '512', prefill: 88.0, decode: 45.0 },
      { len: 1024, label: '1K', prefill: 125.0, decode: 46.2 },
      { len: 2048, label: '2K', prefill: 480.0, decode: 50.0 },
      { len: 4096, label: '4K', prefill: 460.0, decode: 49.5 },
      { len: 8192, label: '8K', prefill: 510.0, decode: 47.0 },
      { len: 16384, label: '16K', prefill: 590.0, decode: 43.5 },
      { len: 32768, label: '32K', prefill: 920.0, decode: 40.0 },
    ],
    tested: '2026-06-02',
    tester: 'zhangsan',
    updatedAt: '2026-06-02 15:20',
  },
  {
    key: 'tpl-103',
    name: 'Llama-3.1-8B-Instruct 轻量单机推理',
    type: 'single',
    source: 'official',
    model: 'Llama-3.1-8B-Instruct',
    modelFamily: 'Llama',
    scenario: '轻量单机推理',
    description: '轻量单机推理',
    gpu: 'H20-96G',
    gpuCount: 1,
    hardware: 'NVIDIA H20-96G',
    engine: 'vLLM',
    quantization: 'FP16',
    deployMode: '单机部署',
    nodeCount: 1,
    cardCount: 1,
    topology: 'TP=1 PP=1 DP=1',
    command: '--model /models/Llama-3.1-8B --tensor-parallel-size 1 --max-model-len 8192 --max-num-seqs 256 --gpu-memory-utilization 0.92',
    env: { image: 'registry.internal/vllm:0.6.1-cu121', cpu: '16C', mem: '120Gi', disk: '200Gi', network: '10Gbps', kernel: '5.15.0-91-generic' },
    maxModelLen: 8192,
    maxBatchSize: 256,
    benchmark: [
      { len: 512, label: '512', prefill: 72.0, decode: 28.0 },
      { len: 1024, label: '1K', prefill: 105.0, decode: 29.5 },
      { len: 2048, label: '2K', prefill: 320.0, decode: 31.0 },
      { len: 4096, label: '4K', prefill: 330.0, decode: 30.2 },
      { len: 8192, label: '8K', prefill: 360.0, decode: 29.0 },
    ],
    tested: '2026-05-30',
    tester: 'gaohuan',
    updatedAt: '2026-05-30 15:20',
  },
  {
    key: 'tpl-104',
    name: 'Qwen2.5-72B-Instruct 单机 4 卡推理（Ascend）',
    type: 'single',
    source: 'official',
    model: 'Qwen2.5-72B-Instruct',
    modelFamily: 'Qwen',
    scenario: '单机 4 卡推理（Ascend）',
    description: '单机 4 卡推理（Ascend）',
    gpu: '910B-64G',
    gpuCount: 4,
    hardware: 'Ascend 910B-64G',
    engine: 'SGLang',
    quantization: 'W4A16',
    deployMode: '单机部署',
    nodeCount: 1,
    cardCount: 4,
    topology: 'TP=4 PP=1 DP=1',
    command: '--model /models/Qwen2.5-72B-W4A16 --tp 4 --mem-fraction-static 0.82 --max-total-tokens 16384 --dtype float16',
    env: { image: 'registry.internal/sglang:0.3.6-ascend', cpu: '64C', mem: '480Gi', disk: '500Gi', network: '25Gbps RoCE', kernel: '5.10.0-60.18.0.50' },
    maxModelLen: 16384,
    maxBatchSize: 128,
    benchmark: [
      { len: 512, label: '512', prefill: 105.0, decode: 48.0 },
      { len: 1024, label: '1K', prefill: 148.0, decode: 50.0 },
      { len: 2048, label: '2K', prefill: 520.0, decode: 54.0 },
      { len: 4096, label: '4K', prefill: 510.0, decode: 53.5 },
      { len: 8192, label: '8K', prefill: 560.0, decode: 51.0 },
      { len: 16384, label: '16K', prefill: 640.0, decode: 48.5 },
    ],
    tested: '2026-06-04',
    tester: 'gaohuan',
    updatedAt: '2026-06-04 15:20',
  },
];

type StartupTemplateManagerProps = {
  templates: StartupTemplateRecord[];
  setTemplates: Dispatch<SetStateAction<StartupTemplateRecord[]>>;
  onDeployTemplate: (template: StartupTemplateRecord) => void;
  onPickConfigYaml: (onSelect: (yaml: string, path: string) => void) => void;
};

type PdConfigFileRecord = {
  path: string;
  group: string;
  name: string;
  versions: Array<{ key: string; label: string; meta: string; content: string }>;
};

const pdConfigCenterFiles: PdConfigFileRecord[] = [
  {
    path: 'devpod/djw.yaml',
    group: 'devpod',
    name: 'djw.yaml',
    versions: [
      { key: 'latest', label: 'latest（最新）', meta: 'f51faa4 d j w · 37d ago', content: 'apiVersion: devpod.io/v1alpha1\nkind: DevPod\nmetadata:\n  name: ${NAME}\n  namespace: devpods\nspec:\n  owner: ${OWNER}\n  pod:\n    metadata: {}\n    spec:\n      hostNetwork: true\n      hostIPC: true\n      dnsPolicy: ClusterFirstWithHostNet\n      nodeSelector:\n        kubernetes.io/hostname: ${NODE}\n      containers:\n        - name: dev\n          image: 10.12.11.7:16622/sglang:v0.5.10_glm51_0425\n          imagePullPolicy: IfNotPresent\n          command:\n            - sleep\n            - infinity\n          resources:\n            limits:\n              nvidia.com/gpu: 1' },
      { key: 'f51faa4', label: 'f51faa4  d j w', meta: '37d ago', content: 'apiVersion: devpod.io/v1alpha1\nkind: DevPod\nmetadata:\n  name: djw\n  namespace: devpods\nspec:\n  owner: djw\n  pod:\n    spec:\n      hostNetwork: true\n      containers:\n        - name: dev\n          image: 10.12.11.7:16622/sglang:v0.5.10_glm51_0425' },
      { key: '9c30d65', label: '9c30d65  djw', meta: '37d ago', content: 'apiVersion: devpod.io/v1alpha1\nkind: DevPod\nmetadata:\n  name: djw-old\nspec:\n  pod:\n    spec:\n      containers:\n        - name: dev\n          image: registry.internal/sglang:v0.5.8' },
    ],
  },
  {
    path: 'glm/djw_router.yaml',
    group: 'glm',
    name: 'djw_router.yaml',
    versions: [
      { key: 'latest', label: 'latest（最新）', meta: 'router · 12d ago', content: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: glm-router\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: router\n          image: registry.internal/sglang:glm-router\n          args:\n            - --host\n            - 0.0.0.0\n            - --port\n            - "30000"' },
    ],
  },
  {
    path: 'glm/bx_config/worker.yaml',
    group: 'glm / bx_config',
    name: 'worker.yaml',
    versions: [
      { key: 'latest', label: 'latest（最新）', meta: 'worker · 8d ago', content: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: glm-worker\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: worker\n          image: registry.internal/sglang:glm-worker\n          args:\n            - --model-path\n            - /models/GLM-5\n            - --tp\n            - "4"' },
    ],
  },
];

const StartupTemplateManager = ({ templates, setTemplates, onDeployTemplate, onPickConfigYaml }: StartupTemplateManagerProps) => {
  const [activeType, setActiveType] = useState<'single' | 'pd' | 'kt' | 'scene'>('single');
  const [keyword, setKeyword] = useState('');
  const [vendor, setVendor] = useState('');
  const [gpu, setGpu] = useState('');
  const [quant, setQuant] = useState('');
  const [engine, setEngine] = useState('');
  const [scene, setScene] = useState('');
  const [ktModel, setKtModel] = useState('');
  const [ktGpuCount, setKtGpuCount] = useState('');
  const [expandedKey, setExpandedKey] = useState('');
  const [deployTarget, setDeployTarget] = useState<StartupTemplateRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<StartupTemplateRecord | null>(null);
  const [form] = Form.useForm();
  const watchedRouterYaml = Form.useWatch('routerYaml', form);
  const watchedWorkerYaml = Form.useWatch('workerYaml', form);
  const [pdYamlFileLabels, setPdYamlFileLabels] = useState<{ routerYaml: string; workerYaml: string }>({ routerYaml: '', workerYaml: '' });
  const [sceneTags, setSceneTags] = useState<string[]>([]);
  const [customSceneTags, setCustomSceneTags] = useState<string[]>([]);
  const [deletedSceneTags, setDeletedSceneTags] = useState<string[]>([]);
  const [deletedTemplateKeys, setDeletedTemplateKeys] = useState<string[]>([]);
  const [sceneTagManageOpen, setSceneTagManageOpen] = useState(false);
  const [benchmarkRows, setBenchmarkRows] = useState<Array<{ label: string; len: number; prefill: number; decode: number }>>([{ label: '', len: 0, prefill: 0, decode: 0 }]);
  const [singleBenchmarkRows, setSingleBenchmarkRows] = useState<Array<{ inputLen: number; outputLen: number; concurrency: number; ttft: number; tpot: number; tps: number }>>([{ inputLen: 0, outputLen: 0, concurrency: 0, ttft: 0, tpot: 0, tps: 0 }]);
  const [parseHint, setParseHint] = useState('');
  const [modelServiceImportOpen, setModelServiceImportOpen] = useState(false);
  const [modelServiceKeyword, setModelServiceKeyword] = useState('');
  const [benchmarkImportOpen, setBenchmarkImportOpen] = useState(false);
  const [benchmarkKeyword, setBenchmarkKeyword] = useState('');
  const [importedBenchmarkSource, setImportedBenchmarkSource] = useState<StartupTemplateRecord['benchmarkSource']>();
  const importedBenchmarkSourceRef = useRef<StartupTemplateRecord['benchmarkSource']>(undefined);
  const editorType = Form.useWatch('type', form) || (activeType === 'scene' ? 'single' : activeType);
  const requiredTemplateLabel = (label: string) => (
    <span className="ataas-template-required-label"><span>*</span>{label}</span>
  );

  const richTemplates = useMemo(() => {
    const singleTemplates = buildSingleStartupTemplates();
    const existing = templates
      .map(normalizeStartupTemplate)
      .filter((item) => item.source === 'custom' || item.type !== 'single');
    const existingKeys = new Set([...singleTemplates, ...existing].map((item) => item.key));
    return [...singleTemplates, ...existing, ...buildKtStartupTemplates().filter((item) => !existingKeys.has(item.key))]
      .filter((item) => !deletedTemplateKeys.includes(item.key));
  }, [deletedTemplateKeys, templates]);

  const scenePool = useMemo(() => [...new Set([...defaultStartupSceneTags, ...customSceneTags, ...richTemplates.flatMap((item) => item.sceneTags || [])])].filter((tag) => !deletedSceneTags.includes(tag)), [customSceneTags, deletedSceneTags, richTemplates]);
  const baseTemplates = useMemo(() => activeType === 'scene' ? richTemplates.filter((item) => item.sceneTags?.length) : richTemplates.filter((item) => item.type === activeType), [activeType, richTemplates]);
  const chipFilteredTemplates = useMemo(() => {
    if (activeType === 'kt' || activeType === 'scene') return baseTemplates;
    return baseTemplates.filter((item) => {
      if (vendor && inferChipVendor(item.gpu || item.hardware) !== vendor) return false;
      if (gpu && (item.gpu || item.hardware) !== gpu) return false;
      return true;
    });
  }, [activeType, baseTemplates, gpu, vendor]);
  const filteredTemplates = useMemo(() => baseTemplates.filter((item) => {
    if (activeType === 'scene') return !scene || item.sceneTags?.includes(scene);
    if (activeType === 'kt') {
      if (ktModel && item.model !== ktModel) return false;
      if (ktGpuCount && String(item.gpuCount) !== ktGpuCount) return false;
      return true;
    }
    if (keyword && !`${item.name} ${item.model} ${item.description}`.toLowerCase().includes(keyword.toLowerCase())) return false;
    if (vendor && inferChipVendor(item.gpu || item.hardware) !== vendor) return false;
    if (gpu && (item.gpu || item.hardware) !== gpu) return false;
    if (quant && item.quantization !== quant) return false;
    if (engine && item.engine !== engine) return false;
    return true;
  }), [activeType, baseTemplates, engine, gpu, keyword, ktGpuCount, ktModel, quant, scene, vendor]);

  const countByType = (type: 'single' | 'pd' | 'kt') => richTemplates.filter((item) => item.type === type).length;
  const vendorCounts = chipVendorOptions.map((value) => ({ value, count: baseTemplates.filter((item) => inferChipVendor(item.gpu || item.hardware) === value).length }));
  const ktModelOptions = [...new Set(baseTemplates.map((item) => item.model).filter((value): value is string => Boolean(value)))].sort();
  const ktGpuCountOptions = [...new Set(baseTemplates.map((item) => String(item.gpuCount)))].sort((a, b) => Number(a) - Number(b));
  const gpuOptions = [...new Set(baseTemplates.filter((item) => !vendor || inferChipVendor(item.gpu || item.hardware) === vendor).map((item) => item.gpu || item.hardware).filter((value): value is string => Boolean(value)))];
  const quantOptions = [...new Set(chipFilteredTemplates.map((item) => item.quantization).filter((value): value is string => Boolean(value)))].sort();
  const engineOptions = (activeType === 'single' || activeType === 'pd')
    ? ['SGLang', 'vLLM']
    : [...new Set(chipFilteredTemplates.map((item) => item.engine).filter((value): value is string => Boolean(value)))].sort();
  const sceneCounts = scenePool.map((value) => ({ value, count: baseTemplates.filter((item) => item.sceneTags?.includes(value)).length }));
  const runningModelServices = useMemo(() => MOCK_DEPLOY_DATA.filter((service) => service.status === 'running'), []);
  const filteredModelServices = useMemo(() => {
    const keywordText = modelServiceKeyword.trim().toLowerCase();
    if (!keywordText) return runningModelServices;
    return runningModelServices.filter((service) => `${service.name} ${service.typeStr} ${service.deployMode || ''} ${service.description || ''} ${service.modelInfo.name} ${service.modelInfo.engine} ${service.modelInfo.supplier} ${service.modelInfo.works}`.toLowerCase().includes(keywordText));
  }, [modelServiceKeyword, runningModelServices]);
  const filteredBenchmarkRecords = useMemo(() => {
    const keywordText = benchmarkKeyword.trim().toLowerCase();
    if (!keywordText) return benchmarkImportRecords;
    return benchmarkImportRecords.filter((record) => `#${record.id} ${record.taskName} ${record.mode} ${record.serviceName} ${record.modelName} ${record.createdBy} ${record.createdAt}`.toLowerCase().includes(keywordText));
  }, [benchmarkKeyword]);
  const openPdConfigPicker = (target: 'routerYaml' | 'workerYaml') => {
    onPickConfigYaml((yaml, path) => {
      form.setFieldValue(target, yaml);
      setPdYamlFileLabels((prev) => ({ ...prev, [target]: path }));
      message.success(`${target === 'routerYaml' ? 'Router' : 'Worker'} YAML 已选择：${path}`);
    });
  };

  const resetFilters = () => {
    setKeyword('');
    setVendor('');
    setGpu('');
    setQuant('');
    setEngine('');
    setScene('');
    setKtModel('');
    setKtGpuCount('');
  };
  const handleSceneTagsChange = (nextTags: string[]) => {
    const normalized = [...new Set(nextTags.map((tag) => tag.trim()).filter(Boolean))];
    setSceneTags(normalized);
    setCustomSceneTags((prev) => [...new Set([...prev, ...normalized.filter((tag) => !scenePool.includes(tag))])]);
  };
  const deleteSceneTag = (tag: string) => {
    const relatedCount = templates.filter((template) => template.sceneTags?.includes(tag)).length;
    Modal.confirm({
      title: '删除场景标签？',
      content: relatedCount > 0 ? `该标签已关联 ${relatedCount} 个模板，删除后会从这些模板中移除。确认删除？` : '该标签未关联模板，确认删除？',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setCustomSceneTags((prev) => prev.filter((item) => item !== tag));
        setDeletedSceneTags((prev) => [...new Set([...prev, tag])]);
        setSceneTags((prev) => prev.filter((item) => item !== tag));
        if (scene === tag) setScene('');
        setTemplates((prev) => prev.map((template) => template.sceneTags?.includes(tag)
          ? { ...template, sceneTags: template.sceneTags.filter((item) => item !== tag) }
          : template));
        message.success('场景标签已删除');
      },
    });
  };

  const deleteTemplate = (template: StartupTemplateRecord) => {
    Modal.confirm({
      title: '删除模板？',
      content: `确认删除模板「${template.name}」吗？删除后将从性能仓库中移除。`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setTemplates((prev) => prev.filter((item) => normalizeStartupTemplate(item).key !== template.key));
        setDeletedTemplateKeys((prev) => [...new Set([...prev, template.key])]);
        if (expandedKey === template.key) setExpandedKey('');
        message.success('模板已删除');
      },
    });
  };

  const openEditor = (template?: StartupTemplateRecord) => {
    const next = template ? normalizeStartupTemplate(template) : undefined;
    const initialType: 'single' | 'pd' | 'kt' = next?.type || (activeType === 'scene' ? 'single' : activeType as 'single' | 'pd' | 'kt');
    const typedNext = next as (StartupTemplateRecord & { routerYaml?: string; workerYaml?: string }) | undefined;
    const nextRouterYaml = typedNext?.routerYaml;
    const nextWorkerYaml = typedNext?.workerYaml;
    form.resetFields();
    setEditing(next || null);
    setPdYamlFileLabels({
      routerYaml: nextRouterYaml ? '当前模板 Router YAML' : '',
      workerYaml: nextWorkerYaml ? '当前模板 PD Worker YAML' : '',
    });
    setSceneTags(next?.sceneTags || []);
    setImportedBenchmarkSource(next?.benchmarkSource);
    importedBenchmarkSourceRef.current = next?.benchmarkSource;
    setBenchmarkRows((next?.benchmark || [{ label: '', len: 0, prefill: 0, decode: 0 }]).map((row) => ({
      label: row.label || String(row.len || ''),
      len: row.len || 0,
      prefill: row.prefill || 0,
      decode: row.decode || 0,
    })));
    setSingleBenchmarkRows((next?.benchmark || [{ inputLen: 0, outputLen: 0, concurrency: 0, ttft: 0, tpot: 0, tps: 0 }]).map((row) => ({
      inputLen: row.inputLen ?? row.len ?? 0,
      outputLen: row.outputLen ?? 0,
      concurrency: row.concurrency ?? Math.min(Math.max(next?.gpuCount || 1, 1), 16),
      ttft: row.ttft ?? (row.prefill && row.len ? Math.round((row.len / row.prefill) * 1000) : 0),
      tpot: row.tpot ?? (row.decode ? Number((1000 / row.decode).toFixed(1)) : 0),
      tps: row.tps ?? (row.decode ? Number((row.decode * Math.min(Math.max(next?.gpuCount || 1, 1), 16)).toFixed(1)) : 0),
    })));
    setParseHint('');
    setImportedBenchmarkSource(undefined);
    importedBenchmarkSourceRef.current = undefined;
    form.setFieldsValue(next ? {
      type: next.type,
      name: next.name,
      model: next.model,
      description: next.description,
      gpu: next.gpu,
      gpuCount: next.gpuCount,
      quantization: next.quantization,
      engine: next.engine,
      topology: next.topology,
      command: next.command,
      routerYaml: nextRouterYaml,
      workerYaml: nextWorkerYaml,
      driverVersion: (next.env as (StartupTemplateRecord['env'] & { driver?: string }) | undefined)?.driver,
      cpuModel: next.cpu,
      ktMem: next.env?.mem,
      ktVersion: next.version,
      image: next.env?.image,
      cpu: next.env?.cpu,
      mem: next.env?.mem,
      disk: next.env?.disk,
      network: next.env?.network,
      kernel: next.env?.kernel,
      yamlContent: next.yamlContent,
    } : { type: initialType, gpuCount: 8, quantization: 'FP8', engine: initialType === 'kt' ? 'KTransformers' : initialType === 'pd' ? 'SGLang' : undefined });
    setEditorOpen(true);
  };

  const handleEditorTypeChange = (type: 'single' | 'pd' | 'kt') => {
    setParseHint('');
    setImportedBenchmarkSource(undefined);
    importedBenchmarkSourceRef.current = undefined;
    setBenchmarkRows([{ label: '', len: 0, prefill: 0, decode: 0 }]);
    setSingleBenchmarkRows([{ inputLen: 0, outputLen: 0, concurrency: 0, ttft: 0, tpot: 0, tps: 0 }]);
    if (type === 'pd') form.setFieldsValue({ engine: 'SGLang' });
    if (type !== 'pd') setPdYamlFileLabels({ routerYaml: '', workerYaml: '' });
    if (type === 'kt') form.setFieldsValue({ engine: 'KTransformers' });
  };

  const handleCommandChange = (value: string) => {
    const parsed: string[] = [];
    const tp = value.match(/--(?:tp|tensor-parallel-size)\s+(\d+)/);
    const pp = value.match(/--pp\s+(\d+)/);
    const dp = value.match(/--dp\s+(\d+)/);
    const ep = value.match(/--ep\s+(\d+)/);
    const maxTokens = value.match(/--max(?:-total)?-tokens?\s+(\d+)|--context-length\s+(\d+)|--max-model-len\s+(\d+)/);
    const maxBatch = value.match(/--max-batch-size\s+(\d+)|--max-num-seqs\s+(\d+)/);
    if (tp) parsed.push(`TP=${tp[1]}`);
    if (pp) parsed.push(`PP=${pp[1]}`);
    if (dp) parsed.push(`DP=${dp[1]}`);
    if (ep) parsed.push(`EP=${ep[1]}`);
    if (parsed.length && !form.getFieldValue('topology')) form.setFieldValue('topology', parsed.join(' '));
    setParseHint(parsed.length ? `检测到部署拓扑: ${parsed.join(', ')}${maxTokens ? ` | max-tokens: ${maxTokens[1] || maxTokens[2] || maxTokens[3]}` : ''}${maxBatch ? ` | batch-size: ${maxBatch[1] || maxBatch[2]}` : ''}` : '');
  };

  const openBenchmarkImport = () => {
    if (editorType === 'pd') {
      message.info('PD 模板请通过 YAML 创建');
      return;
    }
    setBenchmarkKeyword('');
    setBenchmarkImportOpen(true);
  };

  const openModelServiceImport = () => {
    if (editorType === 'pd') {
      message.info('PD 模板请通过 YAML 创建');
      return;
    }
    setModelServiceKeyword('');
    setModelServiceImportOpen(true);
  };

  const applyModelServiceImport = (service: DeployServiceItem) => {
    const gpuCount = Math.max(Number(service.modelInfo.number || 1), 1);
    const topology = service.deployMode === '单机部署' ? `TP=${gpuCount} PP=1 DP=1` : service.deployMode || '';
    const gpuType = getDeployServiceGpuType(service);
    form.setFieldsValue({
      model: service.modelInfo.name || service.typeStr || service.name,
      description: form.getFieldValue('description') || service.description || service.name,
      gpuCount,
      ...(gpuType ? { gpu: gpuType } : {}),
      quantization: service.modelInfo.point,
      engine: editorType === 'kt' ? 'KTransformers' : service.modelInfo.engine,
      topology,
      mem: service.modelInfo.memory,
      disk: service.modelInfo.disk,
    });
    setModelServiceImportOpen(false);
    message.success(gpuType ? '已同步模型服务信息和 GPU 类型' : '已同步模型服务信息，未匹配到唯一 GPU 类型');
  };

  const applyBenchmarkImport = (record: BenchmarkImportRecord) => {
    if (editorType === 'single') {
      setSingleBenchmarkRows(record.rows);
    } else {
      setBenchmarkRows(record.rows.map((row) => ({
        label: row.inputLen >= 1024 ? `${row.inputLen / 1024}K` : String(row.inputLen),
        len: row.inputLen,
        prefill: row.ttft > 0 ? Number((row.inputLen / (row.ttft / 1000)).toFixed(1)) : 0,
        decode: row.tpot > 0 ? Number((1000 / row.tpot).toFixed(1)) : 0,
      })));
    }
    const source = { taskId: String(record.id), taskName: record.taskName, importedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), mode: record.mode };
    setImportedBenchmarkSource(source);
    importedBenchmarkSourceRef.current = source;
    setBenchmarkImportOpen(false);
    message.success('已导入性能压测数据');
  };

  const submitEditor = () => {
    const values = form.getFieldsValue();
    const type = (values.type || 'single') as 'single' | 'pd' | 'kt';
    const templateName = String(values.name || '').trim();
    if (!templateName) {
      message.warning('请填写模板名称');
      return;
    }
    const duplicateTemplate = richTemplates.some((template) =>
      template.key !== editing?.key && String(template.name || '').trim().toLowerCase() === templateName.toLowerCase(),
    );
    if (duplicateTemplate) {
      message.warning('模板名称已存在，请更换名称');
      return;
    }
    if (type === 'pd' && (!values.routerYaml || !values.workerYaml)) {
      message.warning('请上传或粘贴 Router YAML 和 PD Worker YAML');
      return;
    }
    if (type !== 'pd' && (!values.model || !values.gpu || !values.command)) {
      message.warning('请补充模型、GPU 类型和启动参数');
      return;
    }
    if (type === 'kt' && (!values.cpuModel || !values.ktMem)) {
      message.warning('请补充 CPU 型号和内存');
      return;
    }
    const deployMode = type === 'pd' ? 'PD 分离' : '单机部署';
    const benchmark = type === 'single'
      ? singleBenchmarkRows
        .filter(isSingleBenchmarkRowFilled)
        .map((row) => ({ ...row, label: `${row.inputLen}/${row.outputLen}` }))
      : type === 'pd' ? [] : benchmarkRows
        .filter(isKtBenchmarkRowFilled)
        .map((row) => ({ ...row, label: row.label || String(row.len || '') }));
    const next: StartupTemplateRecord = {
      key: editing?.key || `tpl-custom-${Date.now()}`,
      name: templateName,
      type,
      source: editing?.source || 'custom',
      model: values.model || templateName,
      modelFamily: (values.model || templateName).split('-')[0] || values.model || templateName,
      description: values.description || templateName,
      scenario: values.description || templateName,
      gpu: values.gpu || '-',
      gpuCount: Number(values.gpuCount || 1),
      hardware: inferChipVendor(values.gpu) === 'NVIDIA' ? `NVIDIA ${values.gpu}` : values.gpu,
      engine: values.engine,
      quantization: values.quantization,
      deployMode,
      nodeCount: type === 'pd' ? 2 : 1,
      cardCount: Number(values.gpuCount || 1),
      topology: type === 'pd' ? 'PD 分离' : values.topology || `TP${values.gpuCount || 1} / PP1`,
      command: type === 'pd' ? '' : values.command,
      yamlContent: type === 'pd' ? `# Router YAML\n${values.routerYaml}\n\n# PD Worker YAML\n${values.workerYaml}` : values.yamlContent,
      params: String(values.command).split(/\s+/).filter((item) => item.startsWith('--')).map((item) => ({ key: item, value: '' })),
      env: { image: values.image, cpu: type === 'kt' ? values.cpuModel : values.cpu, mem: type === 'kt' ? values.ktMem : values.mem, disk: values.disk, network: values.network, kernel: values.kernel, ...(values.driverVersion ? { driver: values.driverVersion } : {}) },
      cpu: values.cpuModel,
      version: values.ktVersion,
      benchmark,
      benchmarkSource: importedBenchmarkSourceRef.current,
      sceneTags,
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    if (type === 'pd') {
      (next as StartupTemplateRecord & { routerYaml?: string; workerYaml?: string }).routerYaml = values.routerYaml;
      (next as StartupTemplateRecord & { routerYaml?: string; workerYaml?: string }).workerYaml = values.workerYaml;
    }
    setTemplates((prev) => editing ? prev.map((item) => item.key === editing.key ? next : item) : [next, ...prev]);
    setEditorOpen(false);
    setEditing(null);
    message.success(editing ? '启动模板已更新' : '启动模板已创建');
  };

  const renderFilterButton = (value: string, activeValue: string, setter: (value: string) => void, count?: number, label?: string) => (
    <button key={value || 'all'} type="button" className={activeValue === value ? 'active' : ''} onClick={() => setter(activeValue === value ? '' : value)}>
      <span>{label || value || '全部'}</span>{count !== undefined && <em>{count}</em>}
    </button>
  );
  const getChipVendorLogo = (value: string) => {
    if (value === 'NVIDIA') return nvidiaLogo;
    if (value === 'Ascend') return ascendLogo;
    if (value === 'PPU') return ppuLogo;
    if (value === '摩尔') return mooreLogo;
    if (value === '沐曦') return muxiLogo;
    if (value === '寒武纪') return cambriconLogo;
    if (value === '昆仑芯') return kunlunLogo;
    if (value === '天数') return tianshuLogo;
    if (value === '海光') return hygonLogo;
    return undefined;
  };
  const getEngineLogo = (value: string) => {
    if (value === 'SGLang') return sglangLogo;
    if (value === 'vLLM') return vllmLogo;
    return undefined;
  };
  const renderVendorFilterButton = (item: { value: string; count: number }) => {
    const logo = getChipVendorLogo(item.value);
    return (
      <button key={item.value} type="button" className={vendor === item.value ? 'active' : ''} onClick={() => { setVendor(vendor === item.value ? '' : item.value); setGpu(''); setQuant(''); setEngine(''); }}>
        <span className="ataas-template-vendor-label">
          <i className={logo ? 'has-logo' : ''}>{logo && <img src={logo} alt={item.value} />}</i>
          <span>{item.value}</span>
        </span>
        <em>{item.count}</em>
      </button>
    );
  };
  const renderEngineFilterButton = (value: string) => {
    const logo = getEngineLogo(value);
    return (
      <button key={value} type="button" className={engine === value ? 'active' : ''} onClick={() => setEngine(engine === value ? '' : value)}>
        <span className="ataas-template-vendor-label">
          <i className={logo ? 'has-logo' : ''}>{logo && <img src={logo} alt={value} />}</i>
          <span>{value}</span>
        </span>
      </button>
    );
  };
  const countTemplatesBy = (items: StartupTemplateRecord[], getter: (item: StartupTemplateRecord) => string | undefined) => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = getter(item);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  };
  const getTemplateModelRepoRecord = (template: StartupTemplateRecord) => {
    const modelName = template.model || template.name;
    return modelRepoData.find((item) => item.name === modelName || modelName.includes(item.name));
  };
  const canDeployTemplate = (template: StartupTemplateRecord) => getTemplateModelRepoRecord(template)?.status === 'installed';

  type SingleMetric = { inputLen: number; outputLen: number; concurrency: number; ttft: number; tpot: number; tps: number };
  type SingleCompareRow = { inputLen: number; outputLen: number; concurrency: number; baseline: SingleMetric; template: SingleMetric; tpsGain: number; ttftGain: number; tpotGain: number };

  const normalizeSingleBenchmark = (template: StartupTemplateRecord, point: NonNullable<StartupTemplateRecord['benchmark']>[number]): SingleMetric => {
    const inputLen = point.inputLen ?? point.len ?? 0;
    const outputLen = point.outputLen ?? 512;
    const concurrency = point.concurrency ?? Math.min(Math.max(template.gpuCount || 1, 1), 16);
    const ttft = point.ttft ?? (point.prefill ? Math.round((inputLen / point.prefill) * 1000) : 0);
    const tpot = point.tpot ?? (point.decode ? Math.round((1000 / point.decode) * 10) / 10 : 0);
    const tps = point.tps ?? (point.decode ? Math.round(point.decode * concurrency * 10) / 10 : 0);
    return { inputLen, outputLen, concurrency, ttft, tpot, tps };
  };

  const getSingleBaselineBenchmark = (template: StartupTemplateRecord): SingleMetric[] => {
    if (Array.isArray(template.baselineBenchmark) && template.baselineBenchmark.length > 0) {
      return template.baselineBenchmark.map((point) => normalizeSingleBenchmark(template, point));
    }
    if (template.type !== 'single' || template.source !== 'official') return [];
    return (template.benchmark || []).map((point) => {
      const metric = normalizeSingleBenchmark(template, point);
      return {
        inputLen: metric.inputLen,
        outputLen: metric.outputLen,
        concurrency: metric.concurrency,
        ttft: metric.ttft * 1.22,
        tpot: metric.tpot * 1.16,
        tps: Math.max(metric.tps * 0.82, 0),
      };
    });
  };

  const getSingleCompareRows = (template: StartupTemplateRecord): SingleCompareRow[] => {
    const baselineByKey = new Map(getSingleBaselineBenchmark(template).map((point) => [`${point.inputLen}-${point.outputLen}-${point.concurrency}`, point]));
    if (!baselineByKey.size) return [];
    return (template.benchmark || []).map((point) => {
      const next = normalizeSingleBenchmark(template, point);
      const base = baselineByKey.get(`${next.inputLen}-${next.outputLen}-${next.concurrency}`);
      if (!base) return null;
      return {
        inputLen: next.inputLen,
        outputLen: next.outputLen,
        concurrency: next.concurrency,
        baseline: base,
        template: next,
        tpsGain: base.tps ? ((next.tps - base.tps) / base.tps) * 100 : 0,
        ttftGain: base.ttft ? ((base.ttft - next.ttft) / base.ttft) * 100 : 0,
        tpotGain: base.tpot ? ((base.tpot - next.tpot) / base.tpot) * 100 : 0,
      };
    }).filter((row): row is SingleCompareRow => Boolean(row));
  };

  const renderPercent = (value: number) => (
    <span className={value >= 0 ? 'ataas-template-compare-up' : 'ataas-template-compare-down'}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  );

  const renderSingleCompareChart = (rows: SingleCompareRow[]) => {
    if (!rows.length) return null;
    const width = 760;
    const height = 190;
    const pad = { top: 18, right: 18, bottom: 38, left: 34 };
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = height - pad.top - pad.bottom;
    const maxValue = Math.max(...rows.flatMap((row) => [row.baseline.tps, row.template.tps]), 1) * 1.18;
    const groupWidth = plotWidth / rows.length;
    const barWidth = Math.min(18, groupWidth / 4);
    const y = (value: number) => pad.top + plotHeight - (value / maxValue) * plotHeight;
    return (
      <svg className="ataas-template-compare-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const yy = pad.top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={pad.left} y1={yy} x2={width - pad.right} y2={yy} stroke="#e5e7eb" strokeWidth="0.8" strokeDasharray="3,3" />
              <text x={pad.left - 8} y={yy + 3} fill="#9ca3af" fontSize="10" textAnchor="end">{Math.round(maxValue * ratio)}</text>
            </g>
          );
        })}
        {rows.map((row, index) => {
          const centerX = pad.left + groupWidth * index + groupWidth / 2;
          const baselineY = y(row.baseline.tps);
          const templateY = y(row.template.tps);
          const baselineHeight = plotHeight - (baselineY - pad.top);
          const templateHeight = plotHeight - (templateY - pad.top);
          return (
            <g key={`${row.inputLen}-${row.outputLen}-${row.concurrency}`}>
              <rect x={centerX - barWidth - 3} y={baselineY} width={barWidth} height={Math.max(baselineHeight, 1)} rx="4" fill="#cbd5e1" />
              <rect x={centerX + 3} y={templateY} width={barWidth} height={Math.max(templateHeight, 1)} rx="4" fill="#4f7cff" />
              <text x={centerX} y={Math.min(baselineY, templateY) - 6} fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle">+{row.tpsGain.toFixed(1)}%</text>
              <text x={centerX} y={height - 12} fill="#6b7280" fontSize="10" textAnchor="middle">{row.inputLen}/{row.outputLen} C{row.concurrency}</text>
            </g>
          );
        })}
        <g transform={`translate(${width - 170}, 8)`}>
          <rect x="0" y="0" width="10" height="10" rx="2" fill="#cbd5e1" /><text x="16" y="9" fill="#6b7280" fontSize="11">默认参数</text>
          <rect x="78" y="0" width="10" height="10" rx="2" fill="#4f7cff" /><text x="94" y="9" fill="#6b7280" fontSize="11">模板参数</text>
        </g>
      </svg>
    );
  };

  const renderKtLineChart = (template: StartupTemplateRecord, axisHeight = 240) => {
    const rows = (template.benchmark || []).filter((point) => point.prefill !== undefined && point.decode !== undefined);
    if (!rows.length) return null;
    const width = 1180;
    const pad = { top: 10, right: 58, bottom: 24, left: 62 };
    const height = axisHeight + pad.top + pad.bottom;
    const plotWidth = width - pad.left - pad.right;
    const plotHeight = axisHeight;
    const niceCeil = (value: number) => {
      const raw = Math.max(value, 1);
      const magnitude = 10 ** Math.floor(Math.log10(raw));
      const normalized = raw / magnitude;
      const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
      return nice * magnitude;
    };
    const maxPrefill = niceCeil(Math.max(...rows.map((row) => Number(row.prefill || 0)), 1));
    const maxDecode = niceCeil(Math.max(...rows.map((row) => Number(row.decode || 0)), 1));
    const ticks = [0, 0.25, 0.5, 0.75, 1];
    const x = (index: number) => pad.left + (rows.length === 1 ? plotWidth / 2 : (plotWidth * index) / (rows.length - 1));
    const yPrefill = (value: number) => pad.top + plotHeight - (value / maxPrefill) * plotHeight;
    const yDecode = (value: number) => pad.top + plotHeight - (value / maxDecode) * plotHeight;
    const smoothPath = (points: Array<{ x: number; y: number }>) => {
      if (points.length < 2) return '';
      const path = [`M${points[0].x},${points[0].y}`];
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path.push(`C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
      }
      return path.join(' ');
    };
    const prefillPoints = rows.map((row, index) => ({ x: x(index), y: yPrefill(Number(row.prefill || 0)) }));
    const decodePoints = rows.map((row, index) => ({ x: x(index), y: yDecode(Number(row.decode || 0)) }));
    const prefillPath = smoothPath(prefillPoints);
    const decodePath = smoothPath(decodePoints);
    return (
      <svg className="ataas-template-kt-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {ticks.map((ratio) => {
          const yy = pad.top + plotHeight - ratio * plotHeight;
          return (
            <g key={ratio}>
              <line x1={pad.left} y1={yy} x2={width - pad.right} y2={yy} stroke="#E6E0F4" strokeWidth="0.8" strokeDasharray="3,3" />
              <text x={pad.left - 10} y={yy + 5} fill="#6B7280" fontSize="12" textAnchor="end">{Math.round(maxPrefill * ratio)}</text>
              <text x={width - pad.right + 10} y={yy + 5} fill="#6B7280" fontSize="12" textAnchor="start">{Math.round(maxDecode * ratio)}</text>
            </g>
          );
        })}
        {rows.map((row, index) => {
          const xx = x(index);
          return (
            <g key={`${row.label}-${row.len}`}>
              <line x1={xx} y1={pad.top} x2={xx} y2={pad.top + plotHeight} stroke="#EEE8F8" strokeWidth="0.8" strokeDasharray="3,3" />
              <text x={xx} y={pad.top + plotHeight + 18} fill="#6b7280" fontSize="12" textAnchor="middle">{row.label || row.len}</text>
            </g>
          );
        })}
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotHeight} stroke="#7A7A7A" strokeWidth="0.8" />
        <line x1={width - pad.right} y1={pad.top} x2={width - pad.right} y2={pad.top + plotHeight} stroke="#7A7A7A" strokeWidth="0.8" />
        <line x1={pad.left} y1={pad.top + plotHeight} x2={width - pad.right} y2={pad.top + plotHeight} stroke="#7A7A7A" strokeWidth="0.8" />
        <text x={20} y={pad.top + plotHeight / 2} fill="#8B5CF6" fontSize="12" textAnchor="middle" transform={`rotate(-90 20 ${pad.top + plotHeight / 2})`}>预填充 TPS</text>
        <text x={width - 18} y={pad.top + plotHeight / 2} fill="#4F46E5" fontSize="12" textAnchor="middle" transform={`rotate(90 ${width - 18} ${pad.top + plotHeight / 2})`}>解码 TPS</text>
        <path d={prefillPath} fill="none" stroke="#A855F7" strokeWidth="2.2" />
        <path d={decodePath} fill="none" stroke="#4F46E5" strokeWidth="2.2" />
        {rows.map((row, index) => (
          <g key={`dot-${row.label}-${row.len}`}>
            <circle cx={x(index)} cy={yPrefill(Number(row.prefill || 0))} r="4.5" fill="#fff" stroke="#A855F7" strokeWidth="2.2" />
            <circle cx={x(index)} cy={yDecode(Number(row.decode || 0))} r="4.5" fill="#fff" stroke="#4F46E5" strokeWidth="2.2" />
          </g>
        ))}
        <text x={pad.left + plotWidth / 2} y={height - 8} fill="#9CA3AF" fontSize="12" textAnchor="middle">输入长度</text>
      </svg>
    );
  };

  const renderBenchmark = (template: StartupTemplateRecord) => (
    <div className="ataas-template-benchmark">
      <div className="ataas-template-detail-title">
        <span>{template.type === 'kt' ? '性能曲线' : '测试数据'}</span>
        <em>{template.type === 'single' && template.source === 'official' ? 'Template / baseline comparison' : template.type === 'single' ? 'Latency / throughput' : template.type === 'kt' ? 'Official benchmark' : 'Prefill / Decode throughput'}</em>
      </div>
      {template.benchmarkSource && <div className="ataas-template-parse-hint">来源：{template.benchmarkSource.taskName} / {template.benchmarkSource.mode} / 导入时间 {template.benchmarkSource.importedAt}</div>}
      {template.type === 'single' && template.source === 'official' ? (() => {
        const rows = getSingleCompareRows(template);
        return (
          <Table
            size="small"
            pagination={false}
            rowKey={(row) => `${row.inputLen}-${row.outputLen}-${row.concurrency}`}
            dataSource={rows}
            scroll={{ x: 980 }}
            columns={[
              { title: '输入', dataIndex: 'inputLen' },
              { title: '输出', dataIndex: 'outputLen' },
              { title: '并发', dataIndex: 'concurrency' },
              { title: '默认 TPS', render: (_, row) => row.baseline.tps.toFixed(1) },
              { title: '模板 TPS', render: (_, row) => <span className="ataas-template-decode">{row.template.tps.toFixed(1)}</span> },
              { title: 'TPS 提升', render: (_, row) => renderPercent(row.tpsGain) },
              { title: '默认 TTFT', render: (_, row) => row.baseline.ttft.toFixed(1) },
              { title: '模板 TTFT', render: (_, row) => row.template.ttft.toFixed(1) },
              { title: 'TTFT 变化', render: (_, row) => renderPercent(row.ttftGain) },
              { title: '默认 TPOT', render: (_, row) => row.baseline.tpot.toFixed(1) },
              { title: '模板 TPOT', render: (_, row) => row.template.tpot.toFixed(1) },
              { title: 'TPOT 变化', render: (_, row) => renderPercent(row.tpotGain) },
            ]}
          />
        );
      })() : template.type === 'single' ? <Table
        size="small"
        pagination={false}
        rowKey={(row) => `${row.inputLen}-${row.outputLen}-${row.concurrency}`}
        dataSource={(template.benchmark || []).map((point) => normalizeSingleBenchmark(template, point))}
        columns={[
          { title: '输入长度', dataIndex: 'inputLen' },
          { title: '输出长度', dataIndex: 'outputLen' },
          { title: '并发数', dataIndex: 'concurrency' },
          { title: 'TTFT(ms)', dataIndex: 'ttft', render: (value) => <span className="ataas-template-prefill">{Number(value || 0).toFixed(1)}</span> },
          { title: 'TPOT(ms)', dataIndex: 'tpot', render: (value) => Number(value || 0).toFixed(1) },
          { title: 'TPS', dataIndex: 'tps', render: (value) => <span className="ataas-template-decode">{Number(value || 0).toFixed(1)}</span> },
        ]}
      /> : (
        <div className="ataas-template-kt-chart-panel">
          <div className="ataas-template-kt-chart-legend">
            <span className="decode"><i />解码 TPS</span>
            <span className="prefill"><i />预填充 TPS</span>
          </div>
          <div className="ataas-template-kt-chart-wrap">{renderKtLineChart(template)}</div>
        </div>
      )}
    </div>
  );

  const renderEnvDetails = (template: StartupTemplateRecord) => (
    <dl>
      <dt>镜像</dt><dd>{template.env?.image || '-'}</dd>
      <dt>CPU</dt><dd>{template.env?.cpu || '-'}</dd>
      <dt>内存</dt><dd>{template.env?.mem || '-'}</dd>
      <dt>磁盘</dt><dd>{template.env?.disk || '-'}</dd>
      <dt>网络</dt><dd>{template.env?.network || '-'}</dd>
      {template.env?.driver && <><dt>驱动版本</dt><dd>{template.env.driver}</dd></>}
      <dt>操作系统</dt><dd>{template.env?.kernel || '-'}</dd>
      <dt>部署拓扑</dt><dd>{template.topology}</dd>
      <dt>max-model-len</dt><dd>{template.maxModelLen?.toLocaleString?.() || template.maxModelLen || '-'}</dd>
      <dt>max-batch-size</dt><dd>{template.maxBatchSize || '-'}</dd>
    </dl>
  );

  const formatSingleOfficialCpu = (template: StartupTemplateRecord) => {
    const cpu = template.env?.cpu || template.cpu || '';
    const gpuText = `${template.gpu || ''} ${template.hardware || ''}`;
    if (/AMD|Intel|Kunpeng|鲲鹏|EPYC|Xeon/i.test(cpu)) return cpu;
    if (/910B|Ascend/i.test(gpuText)) return `2 x Kunpeng 920${cpu ? `（${cpu}）` : ''}`;
    if (/16C/i.test(cpu)) return '1 x Intel Xeon Gold 5416S（16C）';
    if (/64C/i.test(cpu)) return '2 x Intel Xeon Gold 6430（64C）';
    if (/96C/i.test(cpu)) return '2 x Intel Xeon Platinum 8468（96C）';
    return cpu || '-';
  };

  const formatSingleOfficialOs = (template: StartupTemplateRecord) => {
    const kernel = template.env?.kernel || '';
    const gpuText = `${template.gpu || ''} ${template.hardware || ''}`;
    if (/Ubuntu|CentOS|Rocky|openEuler|Debian|Kylin|Anolis/i.test(kernel)) return kernel;
    if (/910B|Ascend/i.test(gpuText)) return 'openEuler 22.03 LTS';
    if (/5\.15/i.test(kernel)) return 'Ubuntu 22.04 LTS';
    if (/5\.10/i.test(kernel)) return 'Ubuntu 20.04 LTS';
    return kernel || '-';
  };

  const formatSingleOfficialDriver = (template: StartupTemplateRecord) => {
    const driver = template.env?.driver;
    const image = template.env?.image || '';
    const gpuText = `${template.gpu || ''} ${template.hardware || ''}`;
    if (driver) return driver;
    if (/910B|Ascend/i.test(gpuText)) return 'CANN 8.0.RC2';
    if (/cu124/i.test(image)) return 'NVIDIA 550.54.15 / CUDA 12.4';
    if (/cu121/i.test(image)) return 'NVIDIA 535.129.03 / CUDA 12.1';
    return '-';
  };

  const formatSingleOfficialEngine = (template: StartupTemplateRecord) => {
    const engineNameMap: Record<string, string> = {
      sglang: 'sglang-v0.5.8',
      vllm: 'vllm-v3.3.1',
      ktransformers: 'ktransformers-v0.5.1',
      mindie: 'mindie-2.0.RC1',
    };
    const key = (template.engine || '').toLowerCase();
    return engineNameMap[key] || template.engine || '-';
  };

  const renderSingleOfficialEnvTable = (template: StartupTemplateRecord) => {
    const rows = [
      ['引擎', formatSingleOfficialEngine(template)],
      ['CPU', formatSingleOfficialCpu(template)],
      ['内存', template.env?.mem || '-'],
      ['磁盘', template.env?.disk || '-'],
      ['操作系统', formatSingleOfficialOs(template)],
      ['卡类型', template.gpu || '-'],
      ['卡数量', template.gpuCount ? `${template.gpuCount} 卡` : '-'],
      ['驱动版本', formatSingleOfficialDriver(template)],
    ];
    return (
      <table className="ataas-template-env-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const TemplateCommandShellEditor = ({
    value = '',
    onChange,
    onCommandChange,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    onCommandChange?: (value: string) => void;
  }) => {
    const shellText = value || '';
    const placeholderText = '--model /models/xxx\n--tp 8\n--mem-fraction-static 0.85\n--max-total-tokens 32768';
    const lines = shellText ? shellText.split('\n') : [''];
    const displayLines = shellText ? lines : placeholderText.split('\n');
    const paramLineCount = lines.reduce((sum, line) => sum + (line.match(/(^|\s)--[^\s]+/g)?.length || 0), 0);
    const renderShellSegments = (line: string) => {
      const tokens = line.match(/\s+|[^\s]+/g) || [' '];
      let valueExpected = false;
      return tokens.map((token, tokenIndex) => {
        if (/^\s+$/.test(token)) return <span key={tokenIndex}>{token}</span>;
        if (token.startsWith('--')) {
          valueExpected = true;
          return <span className="param-name" key={tokenIndex}>{token}</span>;
        }
        if (valueExpected && token !== '\\') {
          valueExpected = false;
          return <span className="param-value" key={tokenIndex}>{token}</span>;
        }
        if (token === '\\') valueExpected = false;
        return <span key={tokenIndex}>{token}</span>;
      });
    };
    const renderLine = (line: string, index: number) => {
      return (
        <div className="ataas-advanced-shell-line" key={index}>
          <span className="line-number">{index + 1}</span>
          <span className="line-code">
            {line ? renderShellSegments(line) : <span> </span>}
            {shellText && index === lines.length - 1 && <span className="shell-caret" />}
          </span>
        </div>
      );
    };
    return (
      <div className="ataas-advanced-shell ataas-template-command-shell">
        <div className="ataas-advanced-shell-bar">
          <span>Shell</span>
          <span className="ataas-advanced-shell-count">参数 {paramLineCount} 行 · {shellText.length}/8192</span>
        </div>
        <div className="ataas-advanced-shell-editor">
          <pre className="ataas-advanced-shell-highlight" aria-hidden="true">
            {displayLines.map(renderLine)}
          </pre>
          <Input.TextArea
            className="ataas-advanced-shell-input"
            rows={Math.max(6, lines.length)}
            value={shellText}
            placeholder={placeholderText}
            maxLength={8192}
            onChange={(event) => {
              const next = event.target.value;
              onChange?.(next);
              onCommandChange?.(next);
            }}
          />
        </div>
      </div>
    );
  };

  const renderKtOfficialDetails = (template: StartupTemplateRecord) => {
    const memoryText = template.env?.mem || '-';
    const notes = [...new Set((template.benchmark || []).map((point) => point.notes).filter((value): value is string => Boolean(value)))];
    const benchmarkRows = template.benchmark || [];
    const tableHeight = 31 * (benchmarkRows.length + 1);
    const axisHeight = Math.max(220, tableHeight);
    const chartHeight = axisHeight + 34;
    return (
      <div className="ataas-template-kt-official">
        <div className="ataas-template-kt-top-grid">
          <section className="ataas-template-kt-box">
            <h4>硬件配置</h4>
            <dl>
              <dt>GPU</dt><dd>{template.gpuCount}x {template.gpu} {template.gpuVram ? `(${template.gpuVram})` : ''}</dd>
              <dt>CPU</dt><dd>{template.env?.cpu || '-'}</dd>
              <dt>内存</dt><dd>{memoryText}</dd>
              <dt>PCIe</dt><dd>{template.env?.network || '-'}</dd>
            </dl>
          </section>
          <section className="ataas-template-kt-box">
            <h4>软件环境</h4>
            <dl>
              <dt>版本</dt><dd>{template.version || template.env?.version || '-'}</dd>
              <dt>操作系统</dt><dd>{template.env?.kernel || '-'}</dd>
              <dt>后端</dt><dd>{template.backend || template.env?.backend || '-'}</dd>
            </dl>
          </section>
          {template.command && (
            <section className="ataas-template-kt-command ataas-template-kt-command-inline">
              <pre>{template.command}</pre>
            </section>
          )}
        </div>
        <section className="ataas-template-kt-box ataas-template-kt-metrics-panel">
          <h4>性能数据</h4>
          <div className="ataas-template-kt-metrics-grid">
            <div className="ataas-template-kt-params">
              <table>
                <thead>
                  <tr><th>输入</th><th>预填充 TPS</th><th>解码 TPS</th></tr>
                </thead>
                <tbody>
                  {benchmarkRows.map((point) => (
                    <tr key={`${point.label}-${point.len}`}>
                      <td>{point.label || point.len} in</td>
                      <td>{Number(point.prefill || 0).toFixed(1)}</td>
                      <td>{Number(point.decode || 0).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ataas-template-kt-chart-panel">
              <div className="ataas-template-kt-chart-legend">
                <span className="decode"><i />解码 TPS</span>
                <span className="prefill"><i />预填充 TPS</span>
              </div>
              <div
                className="ataas-template-kt-chart-wrap"
                style={{ height: chartHeight }}
              >
                {renderKtLineChart(template, axisHeight)}
              </div>
            </div>
          </div>
        </section>
        {notes.length > 0 && (
          <div className="ataas-template-kt-notes">
            <h4>备注</h4>
            {notes.map((note) => <p key={note}>{note}</p>)}
          </div>
        )}
      </div>
    );
  };

  const renderTemplateExpand = (template: StartupTemplateRecord) => {
    const showArgs = template.source !== 'official' || template.type === 'kt';
    if (template.type === 'kt') {
      return (
        <div className="ataas-template-expand ataas-template-kt-expand">
          {renderKtOfficialDetails(template)}
        </div>
      );
    }
    if (!showArgs) {
      return (
        <div className="ataas-template-expand">
          <div className="ataas-template-detail-grid compact ataas-template-single-official-grid">
            <div className="ataas-template-detail-panel">
              <div className="ataas-template-detail-title">测试环境</div>
              {renderSingleOfficialEnvTable(template)}
            </div>
            {renderBenchmark(template)}
          </div>
        </div>
      );
    }
    return (
      <div className="ataas-template-expand">
        <div className="ataas-template-detail-grid">
          <div className="ataas-template-detail-panel">
            <div className="ataas-template-detail-title">启动命令</div>
            <pre className="ataas-template-command-preview">{template.command}</pre>
          </div>
          <div className="ataas-template-detail-panel">
            <div className="ataas-template-detail-title">测试环境</div>
            {template.type === 'single' ? renderSingleOfficialEnvTable(template) : renderEnvDetails(template)}
          </div>
        </div>
        {renderBenchmark(template)}
      </div>
    );
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
    <div className="ataas-template-manager">
      <div className="ataas-template-head">
        <div>
          <h2>性能仓库</h2>
        </div>
      </div>
      <div className="ataas-template-stats">
        {[
          ['模板总数', richTemplates.length, ''],
          ['官方内置', richTemplates.filter((item) => item.source === 'official').length, 'blue'],
          ['自建模板', richTemplates.filter((item) => item.source === 'custom').length, 'orange'],
          ['单机模板', countByType('single'), 'green'],
          ['PD 模板', countByType('pd'), 'purple'],
          ['KT 模板', countByType('kt'), 'pink'],
          ['场景模板', richTemplates.filter((item) => item.sceneTags?.length).length, 'cyan'],
        ].map(([label, value, tone]) => <div key={label} className={`ataas-template-stat ${tone}`}><span>{label}</span><strong>{value}<em>个</em></strong></div>)}
      </div>
      <div className="ataas-template-tabbar">
        <Segmented
          className="ataas-template-tabs"
          value={activeType}
          onChange={(value) => { setActiveType(value as typeof activeType); resetFilters(); }}
          options={[
            { label: '单机模板', value: 'single' },
            { label: 'PD模板', value: 'pd' },
            { label: 'KT模板', value: 'kt' },
            { label: '场景模板', value: 'scene' },
          ]}
        />
        <Space>
          <Button onClick={resetFilters}>清除筛选</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>新建模板</Button>
        </Space>
      </div>
      <div className="ataas-template-layout">
        <aside className="ataas-template-filter">
          <strong>筛选</strong>
          {activeType !== 'scene' && activeType !== 'kt' && <div className="ataas-template-filter-section ataas-template-filter-search"><Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="输入模型名搜索" allowClear /></div>}
          {activeType !== 'scene' && activeType !== 'kt' && <div className="ataas-template-filter-section"><span>芯片品牌</span><div>{vendorCounts.map((item) => renderVendorFilterButton(item))}</div></div>}
          {activeType !== 'scene' && activeType !== 'kt' && vendor && <div className="ataas-template-filter-section"><span>卡型号</span><div>
            {renderFilterButton('', gpu, (value) => { setGpu(value); setQuant(''); setEngine(''); }, baseTemplates.filter((item) => inferChipVendor(item.gpu || item.hardware) === vendor).length)}
            {gpuOptions.map((item) => renderFilterButton(item, gpu, (value) => { setGpu(value); setQuant(''); setEngine(''); }, countTemplatesBy(baseTemplates.filter((tpl) => inferChipVendor(tpl.gpu || tpl.hardware) === vendor), (tpl) => tpl.gpu || tpl.hardware)[item] || 0))}
          </div></div>}
          {activeType !== 'scene' && activeType !== 'kt' && <div className="ataas-template-filter-section"><span>推理引擎</span><div>{engineOptions.map((item) => renderEngineFilterButton(item))}</div></div>}
          {activeType !== 'scene' && activeType !== 'kt' && <div className="ataas-template-filter-section"><span>量化格式</span><div>{quantOptions.map((item) => renderFilterButton(item, quant, setQuant))}</div></div>}
          {activeType === 'kt' && <div className="ataas-template-filter-section"><span>模型</span><div>{ktModelOptions.map((item) => renderFilterButton(item, ktModel, setKtModel, baseTemplates.filter((tpl) => tpl.model === item).length))}</div></div>}
          {activeType === 'kt' && <div className="ataas-template-filter-section"><span>GPU 卡数</span><div>{ktGpuCountOptions.map((item) => renderFilterButton(item, ktGpuCount, setKtGpuCount, undefined, `${item}x GPU`))}</div></div>}
          {activeType === 'scene' && <div className="ataas-template-filter-section"><span>业务场景</span><div>
            {renderFilterButton('', scene, setScene, baseTemplates.length)}
            {sceneCounts.map((item) => renderFilterButton(item.value, scene, setScene, item.count))}
          </div></div>}
        </aside>
        <main className="ataas-template-content">
          {filteredTemplates.length === 0 ? <div className="ataas-template-empty">没有匹配的模板</div> : (
            <div className="ataas-template-grid">
              {filteredTemplates.map((raw) => {
                const template = normalizeStartupTemplate(raw);
                const expanded = expandedKey === template.key;
                const canExpand = template.type !== 'pd';
                return (
                  <div key={template.key} className={`ataas-template-card ${template.type === 'pd' ? 'pd-card' : ''} ${expanded ? 'expanded' : ''}`}>
                    <button type="button" className="ataas-template-card-main" onClick={() => canExpand && setExpandedKey(expanded ? '' : template.key)}>
                      <div>
                        <div className="ataas-template-card-title">
                          <strong>{template.type === 'pd' ? `${template.model} ${template.engine} PD 模板` : template.name}</strong>
                          {canExpand && <DownOutlined />}
                        </div>
                        <div className="ataas-template-tags">
                          {template.source === 'official' && <Tag className="ataas-template-source-tag official">官方</Tag>}
                          <Tag color="green">{template.gpu || template.hardware}</Tag>
                          <Tag color="orange">{template.engine}</Tag>
                          <Tag color="purple">{template.quantization}</Tag>
                          {(template.sceneTags || []).slice(0, 3).map((tag) => <Tag key={tag} color="blue">{tag}</Tag>)}
                        </div>
                        <p>{template.scenario || template.description}</p>
                      </div>
                      <div className="ataas-template-meta">
                        <span>更新时间<strong>{template.updatedAt}</strong></span>
                      </div>
                    </button>
                    <div className="ataas-template-card-actions">
                      <Tooltip title={canDeployTemplate(template) ? '' : '模型仓库中该模型未下载，暂不可部署'}>
                        <span>
                          <Button size="small" type="primary" disabled={!canDeployTemplate(template)} onClick={() => onDeployTemplate(template)}>部署</Button>
                        </span>
                      </Tooltip>
                      {template.source !== 'official' && <Button size="small" onClick={() => openEditor(template)}>编辑</Button>}
                      <Button size="small" danger onClick={() => deleteTemplate(template)}>删除</Button>
                    </div>
                    {canExpand && expanded && renderTemplateExpand(template)}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <Modal title="部署确认" open={Boolean(deployTarget)} onCancel={() => setDeployTarget(null)} onOk={() => { message.success(`已提交部署：${deployTarget?.name}`); setDeployTarget(null); }} okText="确认部署" cancelText="取消">
        <p className="ataas-template-deploy-desc">将使用「{deployTarget?.name}」启动模型服务。</p>
        <Form layout="vertical">
          <Form.Item label="集群"><Select defaultValue="prod-gpu-cluster-01" options={['prod-gpu-cluster-01', 'prod-gpu-cluster-02', 'staging-gpu', 'dev-910b'].map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item label="实例数量"><InputNumber min={1} max={16} defaultValue={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="备注"><Input placeholder="可选" /></Form.Item>
        </Form>
      </Modal>
      <Modal title="场景标签管理" open={sceneTagManageOpen} onCancel={() => setSceneTagManageOpen(false)} footer={<Button type="primary" onClick={() => setSceneTagManageOpen(false)}>完成</Button>} width={520}>
        <div className="ataas-template-scene-tag-list">
          {scenePool.length === 0 ? <div className="ataas-template-scene-tag-empty">暂无场景标签</div> : scenePool.map((tag) => {
            const relatedCount = templates.filter((template) => template.sceneTags?.includes(tag)).length;
            return (
              <div className="ataas-template-scene-tag-row" key={tag}>
                <div>
                  <strong>{tag}</strong>
                  <span>关联 {relatedCount} 个模板</span>
                </div>
                <Button className="ataas-template-scene-delete-button" danger size="small" onClick={() => deleteSceneTag(tag)}>删除</Button>
              </div>
            );
          })}
        </div>
      </Modal>
      <Modal className="ataas-template-benchmark-import-modal" title="从性能压测导入" open={benchmarkImportOpen} onCancel={() => setBenchmarkImportOpen(false)} footer={null} width={560}>
        <div className="ataas-template-benchmark-import-note">仅同步压测详情中的性能记录和来源信息，不会覆盖当前模板的模型、GPU、引擎、镜像或启动参数。</div>
        <Input className="ataas-template-service-import-search" value={benchmarkKeyword} onChange={(event) => setBenchmarkKeyword(event.target.value)} placeholder="搜索任务名称、编号、模式、模型服务" allowClear />
        <div className="ataas-template-benchmark-task-list">
          {filteredBenchmarkRecords.length === 0 ? <div className="ataas-template-service-import-empty">没有匹配的压测任务</div> : filteredBenchmarkRecords.map((record) => (
            <div className="ataas-template-benchmark-task-item" key={record.id}>
              <div>
                <strong>{record.taskName}</strong>
                <span>#{record.id} · {record.mode} · {record.rows.length} 组性能数据 · {record.createdAt}</span>
              </div>
              <Button size="small" type="primary" onClick={() => applyBenchmarkImport(record)}>选择</Button>
            </div>
          ))}
        </div>
      </Modal>
      <Modal className="ataas-template-model-service-import-modal" title="从模型服务导入" open={modelServiceImportOpen} onCancel={() => setModelServiceImportOpen(false)} footer={null} width={560}>
        <div className="ataas-template-benchmark-import-note">选择当前平台运行中的模型服务，同步模型、GPU 类型、引擎、量化、实例数和资源信息；启动参数仍需在模板中确认。</div>
        <Input className="ataas-template-service-import-search" value={modelServiceKeyword} onChange={(event) => setModelServiceKeyword(event.target.value)} placeholder="搜索服务名、模型、引擎、节点" allowClear />
        <div className="ataas-template-benchmark-task-list">
          {filteredModelServices.length === 0 ? <div className="ataas-template-service-import-empty">没有匹配的运行中模型服务</div> : filteredModelServices.map((service) => (
            <div className="ataas-template-benchmark-task-item" key={service.id}>
              <div className="ataas-template-service-import-main">
                <img src={getDeployModelLogo(service)} alt="" />
                <div>
                  <strong>{service.name}</strong>
                  <span>{service.modelInfo.name} · {service.modelInfo.engine} · {service.deployMode || '-'} · 运行节点 {service.modelInfo.number}</span>
                </div>
              </div>
              <Button size="small" type="primary" onClick={() => applyModelServiceImport(service)}>选择</Button>
            </div>
          ))}
        </div>
      </Modal>
      <Drawer
        className="ataas-template-editor-drawer"
        title={editing ? '编辑模板' : '新建模板'}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={600}
        footer={<div className="ataas-template-editor-footer"><Button onClick={() => setEditorOpen(false)}>取消</Button><Button type="primary" onClick={submitEditor}>{editing ? '保存修改' : '创建模板'}</Button></div>}
      >
        <Form form={form} layout="vertical" className="ataas-template-editor-form" requiredMark={false}>
          <div className="ataas-template-form-section"><strong>1. 基本信息</strong><div className="ataas-template-form-grid">
            <Form.Item label={requiredTemplateLabel('模板名称')} name="name" rules={[{ required: true }]}><Input placeholder="如 DeepSeek-R1 H20 单机模板" /></Form.Item>
            <Form.Item label={requiredTemplateLabel('模板类型')} name="type" rules={[{ required: true }]}><Select disabled={Boolean(editing)} onChange={handleEditorTypeChange} options={[{ value: 'single', label: '单机模板' }, { value: 'pd', label: 'PD模板' }, { value: 'kt', label: 'KT模板 (KTransformers)' }]} /></Form.Item>
            <Form.Item label={editorType === 'pd' ? '模型' : requiredTemplateLabel('模型')} name="model" rules={editorType === 'pd' ? [] : [{ required: true, message: '请填写模型名称' }]}><AutoComplete options={[...new Set(richTemplates.map((item) => item.model || item.modelFamily).filter(Boolean))].map((value) => ({ value, label: value }))} placeholder="输入模型名称实时筛选" filterOption={(inputValue, option) => String(option?.value || '').toLowerCase().includes(inputValue.toLowerCase())} /></Form.Item>
            <Form.Item label="模板描述" name="description"><Input placeholder="如 单机 8 卡推理" /></Form.Item>
            <Form.Item
              label={<span className="ataas-template-scene-label"><span>业务场景</span><Tooltip title="管理场景标签"><Button type="text" size="small" icon={<SettingOutlined />} onClick={() => setSceneTagManageOpen(true)} /></Tooltip></span>}
              className="wide"
            >
              <Select mode="tags" value={sceneTags} onChange={handleSceneTagsChange} options={scenePool.map((value) => ({ value, label: value }))} placeholder="输入场景标签，回车添加" />
            </Form.Item>
          </div></div>
          <div className="ataas-template-form-section">
            <strong className="ataas-template-section-title">
              <span>2. 硬件与引擎</span>
              {(editorType === 'single' || editorType === 'kt') && (
                <Tooltip title="从模型服务导入">
                  <Button className="ataas-template-section-icon-button" type="text" size="small" icon={<FileSearchOutlined />} onClick={openModelServiceImport} />
                </Tooltip>
              )}
            </strong>
            <div className="ataas-template-form-grid three">
              <Form.Item label={editorType === 'pd' ? 'GPU 类型' : requiredTemplateLabel('GPU 类型')} name="gpu" rules={editorType === 'pd' ? [] : [{ required: true, message: '请选择 GPU 类型' }]}><Select allowClear showSearch options={templateGpuTypeOptions.map((value) => ({ value, label: value }))} placeholder="请选择" /></Form.Item>
              <Form.Item label={editorType === 'pd' ? 'GPU 数量' : requiredTemplateLabel('GPU 数量')} name="gpuCount"><InputNumber min={1} max={64} style={{ width: '100%' }} /></Form.Item>
            </div>
            <div className="ataas-template-form-grid three">
              <Form.Item label="驱动版本" name="driverVersion"><Input placeholder="550.54.15 / CUDA 12.4" /></Form.Item>
              <Form.Item label={editorType === 'pd' ? '推理引擎' : requiredTemplateLabel('推理引擎')} name="engine"><Select allowClear options={['SGLang', 'vLLM', 'TensorRT-LLM', 'KTransformers'].map((value) => ({ value, label: value }))} placeholder="请选择" /></Form.Item>
            </div>
            {editorType === 'kt' && <div className="ataas-template-form-grid three">
              <Form.Item label={requiredTemplateLabel('CPU 型号')} name="cpuModel"><Input placeholder="2x AMD EPYC 9355" /></Form.Item>
              <Form.Item label={requiredTemplateLabel('内存')} name="ktMem"><Input placeholder="768Gi" /></Form.Item>
            </div>}
            {editorType !== 'pd' && <Form.Item className="ataas-template-command-shell-field" label={requiredTemplateLabel('启动参数')} name="command" rules={[{ required: true, message: '请粘贴启动参数' }]}>
              <TemplateCommandShellEditor onCommandChange={handleCommandChange} />
            </Form.Item>}
          {parseHint && <div className="ataas-template-parse-hint">{parseHint}</div>}</div>
          {editorType === 'pd' && <div className="ataas-template-form-section"><strong>{requiredTemplateLabel('3. PD YAML')}</strong>
            <div className="ataas-pd-yaml-upload-grid">
              <Upload.Dragger
                accept=".yaml,.yml,text/yaml,text/x-yaml"
                multiple={false}
                showUploadList={false}
                beforeUpload={(file) => {
                  if (!isYamlFile(file)) {
                    message.error('仅支持 .yaml / .yml 文件');
                    return Upload.LIST_IGNORE;
                  }
                  const reader = new FileReader();
                  reader.onload = (readerEvent) => {
                    form.setFieldValue('routerYaml', String(readerEvent.target?.result || ''));
                    setPdYamlFileLabels((prev) => ({ ...prev, routerYaml: file.name }));
                  };
                  reader.onerror = () => message.error('Router YAML 文件读取失败');
                  reader.readAsText(file);
                  return false;
                }}
              >
                {watchedRouterYaml ? (
                  <div className="ataas-pd-yaml-current-file">
                    <FileSearchOutlined />
                    <strong>Router YAML</strong>
                    <span title={pdYamlFileLabels.routerYaml || '当前文件'}>{pdYamlFileLabels.routerYaml || '当前文件'}</span>
                    <em>点击卡片重新上传</em>
                  </div>
                ) : (
                  <>
                    <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                    <p className="ant-upload-text">Router YAML</p>
                    <p className="ant-upload-hint">点击或拖拽文件上传</p>
                  </>
                )}
                <button className="ataas-pd-config-select-button" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openPdConfigPicker('routerYaml'); }}>从资源文件选择</button>
              </Upload.Dragger>
              <Upload.Dragger
                accept=".yaml,.yml,text/yaml,text/x-yaml"
                multiple={false}
                showUploadList={false}
                beforeUpload={(file) => {
                  if (!isYamlFile(file)) {
                    message.error('仅支持 .yaml / .yml 文件');
                    return Upload.LIST_IGNORE;
                  }
                  const reader = new FileReader();
                  reader.onload = (readerEvent) => {
                    form.setFieldValue('workerYaml', String(readerEvent.target?.result || ''));
                    setPdYamlFileLabels((prev) => ({ ...prev, workerYaml: file.name }));
                  };
                  reader.onerror = () => message.error('PD Worker YAML 文件读取失败');
                  reader.readAsText(file);
                  return false;
                }}
              >
                {watchedWorkerYaml ? (
                  <div className="ataas-pd-yaml-current-file">
                    <FileSearchOutlined />
                    <strong>PD Worker YAML</strong>
                    <span title={pdYamlFileLabels.workerYaml || '当前文件'}>{pdYamlFileLabels.workerYaml || '当前文件'}</span>
                    <em>点击卡片重新上传</em>
                  </div>
                ) : (
                  <>
                    <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                    <p className="ant-upload-text">PD Worker YAML</p>
                    <p className="ant-upload-hint">点击或拖拽文件上传</p>
                  </>
                )}
                <button className="ataas-pd-config-select-button" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openPdConfigPicker('workerYaml'); }}>从资源文件选择</button>
              </Upload.Dragger>
            </div>
            <Form.Item name="routerYaml" rules={[{ required: true, message: '请上传或选择 Router YAML' }]} hidden><Input /></Form.Item>
            <Form.Item name="workerYaml" rules={[{ required: true, message: '请上传或选择 PD Worker YAML' }]} hidden><Input /></Form.Item>
          </div>}
          {editorType !== 'pd' && <div className="ataas-template-form-section">
            <strong className="ataas-template-section-title">
              <span>3. 测试数据</span>
              {editorType === 'single' && (
                <Tooltip title="从性能压测导入">
                  <Button className="ataas-template-section-icon-button" type="text" size="small" icon={<FileSearchOutlined />} onClick={openBenchmarkImport} />
                </Tooltip>
              )}
            </strong>
            {importedBenchmarkSource && <div className="ataas-template-parse-hint">当前数据来源：{importedBenchmarkSource.taskName} / {importedBenchmarkSource.mode} / 导入时间 {importedBenchmarkSource.importedAt}</div>}
            {editorType === 'single' ? <>
            <Table className="ataas-template-benchmark-table" size="small" pagination={false} scroll={{ x: 700 }} rowKey={(_, index) => String(index)} dataSource={singleBenchmarkRows} columns={[
              { title: '输入长度', width: 108, render: (_, row, index) => <InputNumber value={row.inputLen} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, inputLen: Number(value || 0) } : item))} /> },
              { title: '输出长度', width: 108, render: (_, row, index) => <InputNumber value={row.outputLen} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, outputLen: Number(value || 0) } : item))} /> },
              { title: '并发数', width: 96, render: (_, row, index) => <InputNumber value={row.concurrency} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, concurrency: Number(value || 0) } : item))} /> },
              { title: 'TTFT(ms)', width: 108, render: (_, row, index) => <InputNumber value={row.ttft} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, ttft: Number(value || 0) } : item))} /> },
              { title: 'TPOT(ms)', width: 108, render: (_, row, index) => <InputNumber value={row.tpot} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, tpot: Number(value || 0) } : item))} /> },
              { title: 'TPS', width: 88, render: (_, row, index) => <InputNumber value={row.tps} onChange={(value) => setSingleBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, tps: Number(value || 0) } : item))} /> },
              { title: '', width: 48, fixed: 'right', render: (_, __, index) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setSingleBenchmarkRows((prev) => prev.filter((_, i) => i !== index))} /> },
            ]} />
            <Button className="ataas-template-add-row-button" type="link" onClick={() => setSingleBenchmarkRows((prev) => [...prev, { inputLen: 0, outputLen: 0, concurrency: 0, ttft: 0, tpot: 0, tps: 0 }])}>添加一行数据</Button>
            </> : <>
            <Table className="ataas-template-benchmark-table" size="small" pagination={false} scroll={{ x: 520 }} rowKey={(_, index) => String(index)} dataSource={benchmarkRows} columns={[
              { title: '输入长度', width: 120, render: (_, row, index) => <InputNumber value={row.len} onChange={(value) => setBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, len: Number(value || 0), label: String(value || '') } : item))} /> },
              { title: 'Prefill', width: 110, render: (_, row, index) => <InputNumber value={row.prefill} onChange={(value) => setBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, prefill: Number(value || 0) } : item))} /> },
              { title: 'Decode', width: 110, render: (_, row, index) => <InputNumber value={row.decode} onChange={(value) => setBenchmarkRows((prev) => prev.map((item, i) => i === index ? { ...item, decode: Number(value || 0) } : item))} /> },
              { title: '', width: 48, fixed: 'right', render: (_, __, index) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => setBenchmarkRows((prev) => prev.filter((_, i) => i !== index))} /> },
            ]} />
            <Button className="ataas-template-add-row-button" type="link" onClick={() => setBenchmarkRows((prev) => [...prev, { label: '', len: 0, prefill: 0, decode: 0 }])}>添加一行数据</Button>
            </>}
          </div>}
        </Form>
      </Drawer>
    </div>
    </ConfigProvider>
  );
};

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

const initialAlertData: AlertRecord[] = [
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

const alertLevelMeta: Record<string, { label: string; color: string; tone: string }> = {
  critical: { label: '紧急', color: '#F53F3F', tone: 'critical' },
  warning: { label: '普通', color: '#FF7D00', tone: 'warning' },
  info: { label: '轻微', color: '#86909C', tone: 'info' },
};

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
    key: 'tpl-deployable-qwen-pd-h20',
    name: 'Qwen2.5-72B-Instruct H20 PD 可部署模板',
    type: 'pd',
    source: 'custom',
    model: 'Qwen2.5-72B-Instruct',
    modelFamily: 'Qwen',
    deployMode: 'PD 分离',
    hardware: 'NVIDIA H20',
    gpu: 'H20',
    gpuCount: 4,
    nodeCount: 2,
    cardCount: 4,
    engine: 'SGLang',
    quantization: 'BF16',
    topology: 'Router + Prefill + Decode / TP4',
    command: '',
    yamlContent: 'name: Qwen2.5-72B-Instruct H20 PD 可部署模板\nengine: SGLang\nmodelFamily: Qwen\ndeployMode: PD 分离\nhardware: NVIDIA H20\nnodeCount: 2\ncardCount: 4\ntopology: Router + Prefill + Decode / TP4\ndescription: 可直接部署的 Qwen2.5-72B H20 PD 分离模板。',
    routerYaml: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: qwen-pd-router\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: router\n          image: registry.internal/sglang:v0.5.8\n          args:\n            - --host\n            - 0.0.0.0\n            - --port\n            - "30000"',
    workerYaml: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: qwen-pd-worker\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: worker\n          image: registry.internal/sglang:v0.5.8\n          args:\n            - --model-path\n            - /models/Qwen2.5-72B-Instruct\n            - --tp\n            - "4"\n            - --max-model-len\n            - "32768"',
    description: '可直接部署的 Qwen2.5-72B H20 PD 分离模板，默认使用 1 个 Prefill 节点和 1 个 Decode 节点。',
    scenario: 'PD 分离高吞吐推理',
    sceneTags: ['RAG 问答', '数据分析'],
    env: { image: 'sglang-v0.5.8', cpu: '2x Intel Xeon Gold 6430', mem: '512Gi', disk: '1Ti', kernel: 'Ubuntu 22.04 LTS', driver: '550.54.15 / CUDA 12.4' },
    updatedAt: '2026-06-17 09:45',
  },
  {
    key: 'tpl-sglang-deepseek-pd',
    name: 'DeepSeek-R1 SGLang PD 模板',
    type: 'pd',
    source: 'custom',
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
    type: 'single',
    source: 'custom',
    model: 'Qwen2.5-72B-Instruct',
    gpu: 'A100-80G',
    gpuCount: 8,
    quantization: 'BF16',
    sceneTags: ['客服问答', '数据分析'],
    env: { image: 'vllm-v3.3.1', cpu: '2x Intel Xeon Gold 6430', mem: '512Gi', disk: '1Ti', kernel: 'CentOS 7.8', driver: '550.54.15 / CUDA 12.4' },
    benchmark: [
      { inputLen: 512, outputLen: 512, concurrency: 8, ttft: 286.4, tpot: 18.7, tps: 427.8 },
      { inputLen: 2048, outputLen: 512, concurrency: 8, ttft: 691.2, tpot: 21.4, tps: 373.8 },
      { inputLen: 8192, outputLen: 512, concurrency: 8, ttft: 1850.6, tpot: 25.9, tps: 308.9 },
    ],
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
    type: 'single',
    source: 'custom',
    model: 'GLM-4-Air',
    gpu: 'L20',
    gpuCount: 8,
    quantization: 'INT4',
    sceneTags: ['数据分析', 'RAG 问答'],
    env: { image: 'sglang-v0.5.8', cpu: '2x AMD EPYC 7543', mem: '384Gi', disk: '800Gi', kernel: 'Ubuntu 22.04 LTS', driver: '535.161.08 / CUDA 12.2' },
    benchmark: [
      { inputLen: 1024, outputLen: 256, concurrency: 16, ttft: 228.6, tpot: 16.1, tps: 994.0 },
      { inputLen: 4096, outputLen: 256, concurrency: 16, ttft: 775.3, tpot: 18.4, tps: 869.6 },
    ],
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
  {
    key: 'tpl-custom-single-deepseek-5090',
    name: 'DeepSeek-R1-0528 自建 5090 单机模板',
    type: 'single',
    source: 'custom',
    model: 'DeepSeek-R1-0528',
    modelFamily: 'DeepSeek',
    deployMode: '单机部署',
    hardware: 'NVIDIA RTX 5090',
    gpu: 'RTX 5090',
    gpuCount: 8,
    nodeCount: 1,
    cardCount: 8,
    engine: 'SGLang',
    quantization: 'FP8',
    topology: 'TP=8 PP=1 DP=1',
    command: 'python -m sglang.launch_server --model /models/DeepSeek-R1-0528-FP8 --host 0.0.0.0 --port 30000 --tensor-parallel-size 8 --max-model-len 32768 --mem-fraction-static 0.88 --trust-remote-code',
    description: '个人创建的 5090 单机 8 卡推理模板。',
    scenario: '5090 单机满卡推理',
    sceneTags: ['AI Coding', '代码审查'],
    env: { image: 'sglang-v0.5.8', cpu: '2x AMD EPYC 9355', mem: '768Gi', disk: '1Ti', kernel: 'Ubuntu 22.04 LTS', driver: '550.54.15 / CUDA 12.4' },
    benchmark: [
      { inputLen: 512, outputLen: 512, concurrency: 8, ttft: 318.2, tpot: 20.8, tps: 384.6 },
      { inputLen: 2048, outputLen: 512, concurrency: 8, ttft: 812.5, tpot: 23.6, tps: 339.0 },
      { inputLen: 8192, outputLen: 512, concurrency: 8, ttft: 2296.8, tpot: 28.4, tps: 281.7 },
    ],
    updatedAt: '2026-06-15 17:08',
  },
  {
    key: 'tpl-custom-single-qwen-h20',
    name: 'Qwen2.5-72B 自建 H20 单机模板',
    type: 'single',
    source: 'custom',
    model: 'Qwen2.5-72B-Instruct',
    modelFamily: 'Qwen',
    deployMode: '单机部署',
    hardware: 'NVIDIA H20-96G',
    gpu: 'H20-96G',
    gpuCount: 4,
    nodeCount: 1,
    cardCount: 4,
    engine: 'vLLM',
    quantization: 'BF16',
    topology: 'TP=4 PP=1 DP=1',
    command: 'vllm serve /models/Qwen2.5-72B-Instruct --host 0.0.0.0 --port 8000 --tensor-parallel-size 4 --max-model-len 32768 --gpu-memory-utilization 0.9 --trust-remote-code',
    description: '个人创建的 H20 4 卡通用问答模板。',
    scenario: 'H20 4 卡通用问答',
    sceneTags: ['RAG 问答', '客服问答'],
    env: { image: 'vllm-v3.3.1', cpu: '2x Intel Xeon Platinum 8468', mem: '512Gi', disk: '1Ti', kernel: 'CentOS 7.8', driver: '550.54.15 / CUDA 12.4' },
    benchmark: [
      { inputLen: 1024, outputLen: 512, concurrency: 4, ttft: 362.4, tpot: 24.1, tps: 166.0 },
      { inputLen: 4096, outputLen: 512, concurrency: 4, ttft: 918.7, tpot: 28.6, tps: 139.9 },
    ],
    updatedAt: '2026-06-15 16:45',
  },
  {
    key: 'tpl-custom-kt-qwen-5090',
    name: 'Qwen3.5-35B-A3B 自建 KT 4x5090',
    type: 'kt',
    source: 'custom',
    model: 'Qwen3.5-35B-A3B',
    modelFamily: 'Qwen3.5',
    deployMode: '单机部署',
    hardware: 'NVIDIA RTX 5090',
    gpu: 'RTX 5090',
    gpuCount: 4,
    gpuVram: '32GB',
    nodeCount: 1,
    cardCount: 4,
    engine: 'KTransformers',
    quantization: 'FP8',
    backend: 'kt-kernel + SGLang',
    topology: 'TP4 / kt-kernel + SGLang',
    command: 'python -m sglang.launch_server --model /models/Qwen3.5-35B-A3B-FP8 --kt-weight-path /models/Qwen3.5-35B-A3B-FP8 --tensor-parallel-size 4 --kt-cpuinfer 96 --kt-threadpool-count 2 --trust-remote-code',
    description: '个人创建的 KT 4 卡 5090 模板。',
    scenario: 'KT 4x5090 混合推理',
    sceneTags: ['AI Coding', 'Agent 工具调用'],
    env: { image: 'ktransformers-v0.5.1', cpu: '2x AMD EPYC 9355', mem: '1.5Ti', disk: '1Ti', kernel: 'Ubuntu 24.04 LTS', driver: '550.54.15 / CUDA 12.4', backend: 'kt-kernel + SGLang' },
    benchmark: [
      { len: 512, label: '512', prefill: 178.6, decode: 86.4 },
      { len: 2048, label: '2048', prefill: 436.2, decode: 92.1 },
      { len: 8192, label: '8192', prefill: 691.5, decode: 88.7 },
    ],
    updatedAt: '2026-06-15 16:30',
  },
  {
    key: 'tpl-custom-kt-minimax-5090',
    name: 'MiniMax-M2.1 自建 KT 8x5090',
    type: 'kt',
    source: 'custom',
    model: 'MiniMax-M2.1',
    modelFamily: 'MiniMax',
    deployMode: '单机部署',
    hardware: 'NVIDIA RTX 5090',
    gpu: 'RTX 5090',
    gpuCount: 8,
    gpuVram: '32GB',
    nodeCount: 1,
    cardCount: 8,
    engine: 'KTransformers',
    quantization: 'FP8',
    backend: 'kt-kernel + SGLang',
    topology: 'TP8 / kt-kernel + SGLang',
    command: 'python -m sglang.launch_server --model /models/MiniMax-M2.1-FP8 --kt-weight-path /models/MiniMax-M2.1-FP8 --tensor-parallel-size 8 --kt-cpuinfer 128 --kt-threadpool-count 2 --trust-remote-code',
    description: '个人创建的 KT 8 卡 5090 高吞吐模板。',
    scenario: 'KT 8x5090 高吞吐推理',
    sceneTags: ['数据分析', '客服问答'],
    env: { image: 'ktransformers-v0.5.1', cpu: '2x AMD EPYC 9654', mem: '1.5Ti', disk: '2Ti', kernel: 'Ubuntu 24.04 LTS', driver: '550.54.15 / CUDA 12.4', backend: 'kt-kernel + SGLang' },
    benchmark: [
      { len: 1024, label: '1024', prefill: 248.0, decode: 122.5 },
      { len: 4096, label: '4096', prefill: 612.4, decode: 130.2 },
      { len: 16384, label: '16384', prefill: 986.6, decode: 118.8 },
      { len: 32768, label: '32768', prefill: 1220.3, decode: 106.4 },
    ],
    updatedAt: '2026-06-15 16:12',
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
  { id: 1019, name: 'DeepSeek-R1-0528', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1019', status: 'installed', serveStatus: 'free', description: 'DeepSeek-R1-0528 满血推理模板模型，已完成本地下载，可直接用于单机模板部署。', categories: ['llm'], tags: { categories: '深度思考', weight_size: '671B', quanted_type: 'FP8', max_position_embeddings: '32K' }, updatedAt: '2026-06-06T15:20:00Z' },
  { id: 1020, name: 'Qwen3-235B-A22B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1020', status: 'installed', serveStatus: 'free', description: 'Qwen3 MoE 大模型模板模型，已完成本地下载，可用于单机 MoE 推理模板部署。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '235B-A22B', quanted_type: 'FP8', max_position_embeddings: '32K' }, updatedAt: '2026-06-02T15:20:00Z' },
  { id: 1021, name: 'Llama-3.1-8B-Instruct', family: 'Llama', type: 'llm', source: 'official', modelId: 'm1021', status: 'installed', serveStatus: 'free', description: 'Llama 3.1 8B 轻量单机推理模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '8B', quanted_type: 'FP16', max_position_embeddings: '8K' }, updatedAt: '2026-05-30T15:20:00Z' },
  { id: 1022, name: 'Qwen3.5-35B-A3B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1022', status: 'installed', serveStatus: 'free', description: 'Qwen3.5 35B-A3B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '35B-A3B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1023, name: 'Qwen3.5-122B-A10B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1023', status: 'installed', serveStatus: 'free', description: 'Qwen3.5 122B-A10B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '122B-A10B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1024, name: 'Qwen3-30B-A3B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1024', status: 'installed', serveStatus: 'free', description: 'Qwen3 30B-A3B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '30B-A3B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1025, name: 'MiniMax-M2.1', family: 'MiniMax', type: 'llm', source: 'official', modelId: 'm1025', status: 'installed', serveStatus: 'free', description: 'MiniMax-M2.1 KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: 'MoE', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1026, name: 'MiMo-V2-Flash', family: 'MiMo', type: 'llm', source: 'official', modelId: 'm1026', status: 'installed', serveStatus: 'free', description: 'MiMo-V2-Flash KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: 'MoE', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1027, name: 'Qwen3.5-397B-A17B', family: 'Qwen', type: 'llm', source: 'official', modelId: 'm1027', status: 'installed', serveStatus: 'free', description: 'Qwen3.5 397B-A17B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '397B-A17B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1028, name: 'DeepSeek-V4-Flash', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1028', status: 'installed', serveStatus: 'free', description: 'DeepSeek-V4-Flash KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: 'MoE', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1029, name: 'GLM-4.7 395B', family: 'GLM', type: 'llm', source: 'official', modelId: 'm1029', status: 'installed', serveStatus: 'free', description: 'GLM-4.7 395B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '395B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1030, name: 'DeepSeek-V3.2', family: 'DeepSeek', type: 'llm', source: 'official', modelId: 'm1030', status: 'installed', serveStatus: 'free', description: 'DeepSeek-V3.2 KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: 'MoE', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1031, name: 'GLM-5 744B', family: 'GLM', type: 'llm', source: 'official', modelId: 'm1031', status: 'installed', serveStatus: 'free', description: 'GLM-5 744B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '744B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1032, name: 'Mistral-Large-3-675B', family: 'Mistral', type: 'llm', source: 'official', modelId: 'm1032', status: 'installed', serveStatus: 'free', description: 'Mistral-Large-3 675B KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: '675B', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
  { id: 1033, name: 'MiniMax-M2.5', family: 'MiniMax', type: 'llm', source: 'official', modelId: 'm1033', status: 'installed', serveStatus: 'free', description: 'MiniMax-M2.5 KT 模板模型，已完成本地下载。', categories: ['llm'], tags: { categories: '文本生成', weight_size: 'MoE', quanted_type: 'FP8', max_position_embeddings: '40K' }, updatedAt: '2026-06-12T00:00:00Z' },
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

const engineManageSeed: EngineManageRecord[] = [
  { key: 'engine-1', name: 'ftransformers-v3.3.3', engine: 'ftransformers', version: 'v3.3.3', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '用户上传', description: '', imageName: 'ataas/engine/ftransformers:v3.3.3', startCommand: '/root/miniforge3/envs/ftransformers/bin/python -m ftransformers.server --host 0.0.0.0 --port 8080', params: '[]', createdAt: '2026-05-22 12:23:50Z', updatedAt: '2026-05-22 12:24:02Z', exceptionInfo: '-', relatedModels: ['Qwen2.5-7B-Instruct'] },
  { key: 'engine-2', name: 'sglang-v0.5.8', engine: 'sglang', version: 'v0.5.8', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090', 'H20'], type: '系统内置', description: 'SGLang 推理引擎，支持 PD 分离与长上下文服务。', imageName: 'ataas/engine/sglang:v0.5.8', startCommand: 'python -m sglang.launch_server --host 0.0.0.0 --port 30000', params: '[{"key":"--enable-prefix-caching","value":true}]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:12Z', exceptionInfo: '-', relatedModels: ['DeepSeek-R1-Distill-Qwen-32B'] },
  { key: 'engine-3', name: 'ktransformers-v0.5.1', engine: 'ktransformers', version: 'v0.5.1', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '系统内置', description: 'KTransformers 标准推理引擎。', imageName: 'ataas/engine/ktransformers:v0.5.1', startCommand: 'python -m ktransformers.server --host 0.0.0.0 --port 8080', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:10Z', exceptionInfo: '-', relatedModels: [] },
  { key: 'engine-4', name: 'ftransformers-v3.3.2', engine: 'ftransformers', version: 'v3.3.2', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '系统内置', description: '', imageName: 'ataas/engine/ftransformers:v3.3.2', startCommand: '/root/miniforge3/envs/ftransformers/bin/python -m ftransformers.server --port 8080', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:08Z', exceptionInfo: '-', relatedModels: [] },
  { key: 'engine-5', name: 'transformers-v3.3.1', engine: 'transformers', version: 'v3.3.1', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '系统内置', description: '', imageName: 'ataas/engine/transformers:v3.3.1', startCommand: 'python -m transformers.server --host 0.0.0.0 --port 8080', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:06Z', exceptionInfo: '-', relatedModels: [] },
  { key: 'engine-6', name: 'llama-box-v3.3.1', engine: 'llama-box', version: 'v3.3.1', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '系统内置', description: '', imageName: 'ataas/engine/llama-box:v3.3.1', startCommand: 'llama-box serve --host 0.0.0.0 --port 8080', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:04Z', exceptionInfo: '-', relatedModels: [] },
  { key: 'engine-7', name: 'vox-box-v3.3.1', engine: 'vox-box', version: 'v3.3.1', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090'], type: '系统内置', description: '', imageName: 'ataas/engine/vox-box:v3.3.1', startCommand: 'vox-box serve --host 0.0.0.0 --port 8080', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:02Z', exceptionInfo: '-', relatedModels: [] },
  { key: 'engine-8', name: 'vllm-v3.3.1', engine: 'vllm', version: 'v3.3.1', status: 'normal', platform: 'amd64', gpuTypes: ['RTX_4090', 'A100'], type: '系统内置', description: 'vLLM OpenAI 兼容推理服务。', imageName: 'ataas/engine/vllm:v3.3.1', startCommand: 'vllm serve /data/model --host 0.0.0.0 --port 8000', params: '[]', createdAt: '2026-05-22 10:35:59Z', updatedAt: '2026-05-22 10:36:00Z', exceptionInfo: '-', relatedModels: ['Qwen2.5-72B-Instruct'] },
];

const userManageSeed: UserManageRecord[] = [
  { key: 'user-admin', username: 'admin', role: 'admin', remark: 'Root User' },
];

const defaultThemeSettings: ThemeSettingsState = {
  colorPrimary: '#673CE0',
  pageTitle: '趋境·ATaaS',
  windowLogo: ataasLogo,
  layoutLogo: ataasLogo,
  loginBackground: visionCatPreview,
  loginCenterLogo: ataasLogo,
  loginTopLogo: ataasLogo,
  loginHeroTitle: '加速来到你的 AI 世界',
  loginHeroSubtitle: 'An accelerated, accessible, affordable approach to AI',
  loginTitleColor: '#FFFFFF',
  loginSubtitleColor: '#FFFFFF',
  loginFooterText: 'Powered by 趋境科技 (Approaching.ai)',
};

const themeAssetFields: Array<{
  key: keyof ThemeSettingsState;
  label: string;
  desc: string;
  shape: 'square' | 'logo' | 'wide' | 'poster';
}> = [
  { key: 'windowLogo', label: '窗口 Logo', desc: '浏览器标签与窗口识别图标', shape: 'square' },
  { key: 'layoutLogo', label: '布局 Logo', desc: '左侧导航栏顶部品牌标识', shape: 'logo' },
  { key: 'loginBackground', label: '登录背景图', desc: '登录页左侧大背景图', shape: 'poster' },
  { key: 'loginCenterLogo', label: '登录背景中心 Logo', desc: '登录页中部展示图', shape: 'wide' },
  { key: 'loginTopLogo', label: '登录顶部 Logo', desc: '登录页顶部品牌 Logo', shape: 'logo' },
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
  { key: 'dn9', clusterKey: 'c4', name: 'nj-910b-001', ip: '192.168.140.5', gpuType: 'Ascend 910B', totalCards: 8, availableCards: 2, status: 'busy' },
  { key: 'dn10', clusterKey: 'c3', name: 'gz-l20-001', ip: '192.168.130.5', gpuType: 'L20', totalCards: 4, availableCards: 4, status: 'ready' },
  { key: 'dn11', clusterKey: 'c3', name: 'gz-a100-001', ip: '192.168.130.6', gpuType: 'A100', totalCards: 8, availableCards: 6, status: 'ready' },
  { key: 'dn12', clusterKey: 'c1', name: 'qujing5090-01', ip: '192.168.111.10', gpuType: 'RTX 5090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn13', clusterKey: 'c1', name: 'qujing5090-02', ip: '192.168.111.11', gpuType: 'RTX 5090', totalCards: 8, availableCards: 8, status: 'ready' },
  { key: 'dn14', clusterKey: 'c1', name: 'qujing5090-03', ip: '192.168.111.12', gpuType: 'RTX 5090', totalCards: 4, availableCards: 4, status: 'ready' },
  { key: 'dn15', clusterKey: 'c2', name: 'nj-5090-001', ip: '192.168.120.30', gpuType: 'RTX 5090', totalCards: 8, availableCards: 6, status: 'ready' },
];

const templateGpuTypeOptions = [
  'H20-96G',
  'H100-80G',
  'A100-80G',
  'A800-80G',
  '910B-64G',
  ...Array.from(new Set(deployNodes.map((node) => node.gpuType))),
].filter((value, index, list) => list.indexOf(value) === index);

const inferGpuTypeFromNodeName = (name: string) => {
  const value = name.toLowerCase();
  if (value.includes('5090')) return 'RTX 5090';
  if (value.includes('4090')) return 'RTX 4090';
  if (value.includes('h20')) return 'H20';
  if (value.includes('h100')) return 'H100';
  if (value.includes('a800')) return 'A800';
  if (value.includes('a100')) return 'A100';
  if (value.includes('l20')) return 'L20';
  if (value.includes('910b')) return 'Ascend 910B';
  return '';
};

const getDeployServiceGpuType = (service: DeployServiceItem) => {
  const works = service.modelInfo.works
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) || [];
  const matchedNodeTypes = deployNodes
    .filter((node) => works.some((work) => {
      const workName = work.toLowerCase();
      const nodeName = node.name.toLowerCase();
      return workName === nodeName || workName.includes(nodeName) || nodeName.includes(workName);
    }))
    .map((node) => node.gpuType);
  const inferredTypes = works.map(inferGpuTypeFromNodeName).filter(Boolean);
  const types = Array.from(new Set([...matchedNodeTypes, ...inferredTypes]));
  return types.length === 1 ? types[0] : '';
};

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

const TinySparkline = ({ values, color = '#14A6C8' }: { values: number[]; color?: string }) => {
  const ref = useChart(createLineOption('trend', color, values));
  return <div className="ataas-model-ops-tiny-sparkline" ref={ref} />;
};

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

const OverviewSummary = ({ alertList }: { alertList: AlertRecord[] }) => (
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
      <Popover content={alertPopoverContent} title="最近告警" trigger="hover" placement="bottom">
        <div className="ataas-overview-summary-item" style={{ cursor: 'pointer' }} onClick={() => { document.getElementById('ataas-alerts-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <div>
            <span className="ataas-overview-label">告警</span>
            <div className="ataas-overview-value" style={{ color: '#f53f3f' }}>{alertList.length}<em>条</em></div>
          </div>
          <div className="ataas-overview-split">
            <span><i className="ataas-dot-red" />紧急 {alertList.filter(a => a.level === 'critical').length}</span>
            <span><i className="ataas-dot-orange" />普通 {alertList.filter(a => a.level === 'warning').length}</span>
            <span><i className="ataas-dot-gray" />轻微 {alertList.filter(a => a.level === 'info').length}</span>
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
        <Tooltip title={item.name}>
          <div className="ataas-cluster-name"><DeploymentUnitOutlined style={{ marginRight: 6 }} />{item.name}</div>
        </Tooltip>
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
          {item.chips && item.chips.map((c) => (
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
        <div className="ataas-model-top-name">
          <img src={getModelLogo(item.name)} alt="" />
          <Tooltip title={item.name}>
            <strong>{item.name}</strong>
          </Tooltip>
        </div>
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

const EmbeddingModelPage = () => {
  const [embeddingTexts, setEmbeddingTexts] = useState(['', '', '', '']);
  const [embeddingModel, setEmbeddingModel] = useState('bge-m3-prod');
  const [encodingFormat, setEncodingFormat] = useState('float');
  const [dimensions, setDimensions] = useState(1024);
  const [embeddingGenerated, setEmbeddingGenerated] = useState(false);
  const [embeddingCodeOpen, setEmbeddingCodeOpen] = useState(false);
  const textColors = ['purple', 'orange', 'green', 'red', 'blue', 'cyan'];
  const embeddingModelOptions = [
    { value: 'bge-m3-prod', label: 'BGE-M3-Embedding' },
    { value: 'qwen-embedding-prod', label: 'Qwen3-Embedding' },
    { value: 'gte-qwen-prod', label: 'GTE-Qwen-Embedding' },
  ];
  const updateText = (index: number, value: string) => {
    setEmbeddingTexts((prev) => prev.map((item, i) => (i === index ? value : item)));
  };
  const addText = () => {
    setEmbeddingTexts((prev) => [...prev, '']);
  };
  const clearTexts = () => {
    setEmbeddingTexts(['', '', '', '']);
    setEmbeddingGenerated(false);
  };
  const activeTexts = embeddingTexts.map((text, index) => ({ text: text.trim(), index })).filter((item) => item.text);
  const embeddingPythonCode = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.ataas.local/v1",
    api_key="YOUR_API_KEY",
)

response = client.embeddings.create(
    model="${embeddingModelOptions.find((item) => item.value === embeddingModel)?.label || embeddingModel}",
    input=["文本1", "文本2"],
    encoding_format="${encodingFormat}",
    dimensions=${dimensions},
)

print(response)`;
  const embeddingCurlCode = `curl https://api.ataas.local/v1/embeddings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${embeddingModelOptions.find((item) => item.value === embeddingModel)?.label || embeddingModel}",
    "input": ["文本1", "文本2"],
    "encoding_format": "${encodingFormat}",
    "dimensions": ${dimensions}
  }'`;
  const copyEmbeddingCode = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    message.success('代码已复制');
  };
  const EmbeddingCodeBlock = ({ title, lang, text }: { title: string; lang: string; text: string }) => (
    <section className="playground-code-section">
      <h3>{title}</h3>
      <div className="playground-code-block">
        <div>
          <span>{lang}</span>
          <Space>
            <Button type="text" icon={<CopyOutlined />} onClick={() => copyEmbeddingCode(text)} />
          </Space>
        </div>
        <pre>{text}</pre>
      </div>
    </section>
  );
  return (
    <div className="ataas-embedding-page">
      <div className="ataas-embedding-topbar">
        <h1>文本嵌入</h1>
        <Button type="text" icon={<CodeOutlined />} onClick={() => setEmbeddingCodeOpen(true)}>查看代码</Button>
      </div>
      <div className="ataas-embedding-layout">
        <main className="ataas-embedding-main">
          <section className="ataas-embedding-card ataas-embedding-input-card">
            <div className="ataas-embedding-section-head">
              <h2>文本</h2>
              <div>
                <Button icon={<PlusOutlined />} onClick={addText}>添加文本</Button>
                <Button icon={<DeleteOutlined />} onClick={clearTexts}>清除</Button>
                <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => setEmbeddingGenerated(true)} />
              </div>
            </div>
            <div className="ataas-embedding-text-list">
              {embeddingTexts.map((text, index) => (
                <div key={index} className="ataas-embedding-text-row">
                  <span className={`ataas-embedding-text-tag tag-${textColors[index % textColors.length]}`}>文本{index + 1}</span>
                  <Input value={text} onChange={(event) => updateText(index, event.target.value)} placeholder={`请输入文本${index + 1}`} />
                </div>
              ))}
            </div>
          </section>
          <section className="ataas-embedding-card ataas-embedding-result-card">
            <h2>向量生成结果</h2>
            {embeddingGenerated && activeTexts.length ? (
              <div className="ataas-embedding-vector-list">
                {activeTexts.map((item) => (
                  <div key={item.index} className="ataas-embedding-vector-row">
                    <span className={`ataas-embedding-text-tag tag-${textColors[item.index % textColors.length]}`}>文本{item.index + 1}</span>
                    <code>[0.024, -0.118, 0.337, 0.009, ..., 0.061]</code>
                    <em>{dimensions} dims</em>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ataas-embedding-empty">输入文本后点击生成，查看向量结果</div>
            )}
          </section>
          <section className="ataas-embedding-card ataas-embedding-sim-card">
            <h2>文本间相似度</h2>
            {embeddingGenerated && activeTexts.length > 1 ? (
              <div className="ataas-embedding-sim-grid">
                {activeTexts.slice(0, 4).map((row) => activeTexts.slice(0, 4).map((col) => {
                  const same = row.index === col.index;
                  const score = same ? '1.00' : (0.82 - Math.abs(row.index - col.index) * 0.07).toFixed(2);
                  return <span key={`${row.index}-${col.index}`} className={same ? 'same' : ''}>{score}</span>;
                }))}
              </div>
            ) : (
              <div className="ataas-embedding-empty">至少输入两段文本后生成相似度矩阵</div>
            )}
          </section>
        </main>
        <aside className="ataas-embedding-side">
          <section>
            <h2>模型</h2>
            <Select value={embeddingModel} onChange={setEmbeddingModel} options={embeddingModelOptions} />
          </section>
          <section>
            <h2>参数</h2>
            <label>encoding_format <InfoCircleOutlined /></label>
            <Select value={encodingFormat} onChange={setEncodingFormat} options={[{ value: 'float', label: 'float' }, { value: 'base64', label: 'base64' }]} />
            <label>dimensions <InfoCircleOutlined /></label>
            <Slider min={128} max={4096} step={128} value={dimensions} onChange={setDimensions} />
            <InputNumber min={128} max={4096} step={128} value={dimensions} onChange={(value) => setDimensions(Number(value ?? 128))} />
          </section>
        </aside>
      </div>
      <Modal className="playground-code-modal" title={null} open={embeddingCodeOpen} footer={null} width={720} onCancel={() => setEmbeddingCodeOpen(false)}>
        <div className="playground-code-head">
          <h2>查看代码</h2>
          <p>你可以复制以下代码在本地或其他环境中使用，请使用合理方式确保 key 的安全性。</p>
        </div>
        <div className="playground-code-model-card">
          <span className="playground-model-option"><img src={qwenLogo} alt="" /><span>{embeddingModelOptions.find((item) => item.value === embeddingModel)?.label || embeddingModel}</span></span>
        </div>
        <EmbeddingCodeBlock title="OpenAI SDK:" lang="Python" text={embeddingPythonCode} />
        <EmbeddingCodeBlock title="HTTP API:" lang="Curl" text={embeddingCurlCode} />
      </Modal>
    </div>
  );
};

const RerankModelPage = () => {
  const [rerankQuery, setRerankQuery] = useState('叶文洁是谁');
  const [rerankDocs, setRerankDocs] = useState([
    '叶文洁是刘慈欣科幻小说《三体》中的关键人物，天体物理学家，曾是红岸基地技术人员，后成为地球三体组织统帅',
    '大模型技术是基于海量参数和复杂架构的深度学习模型，具有强大的数据处理和泛化能力，广泛应用于自然语言处理、',
    '罗辑是《三体》系列中重要角色，社会学教授，面壁者，执剑人，提出黑暗森林法则，守护人类文明。',
    '',
  ]);
  const [rerankModel, setRerankModel] = useState('bge-reranker-prod');
  const [topN, setTopN] = useState(3);
  const [rerankGenerated, setRerankGenerated] = useState(false);
  const [rerankCodeOpen, setRerankCodeOpen] = useState(false);
  const rerankModelOptions = [
    { value: 'bge-reranker-prod', label: 'BGE-Reranker' },
    { value: 'qwen-reranker-prod', label: 'Qwen3-Reranker' },
    { value: 'gte-reranker-prod', label: 'GTE-Reranker' },
  ];
  const updateDoc = (index: number, value: string) => {
    setRerankDocs((prev) => prev.map((item, i) => (i === index ? value : item)));
  };
  const addDoc = () => setRerankDocs((prev) => [...prev, '']);
  const clearDocs = () => {
    setRerankQuery('');
    setRerankDocs(['', '', '', '']);
    setRerankGenerated(false);
  };
  const activeDocs = rerankDocs.map((text, index) => ({ text: text.trim(), index })).filter((item) => item.text);
  const rankedDocs = activeDocs
    .map((item) => ({ ...item, score: Math.max(0.32, 0.94 - item.index * 0.18) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
  const rerankPythonCode = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.ataas.local/v1",
    api_key="YOUR_API_KEY",
)

response = client.rerank.create(
    model="${rerankModelOptions.find((item) => item.value === rerankModel)?.label || rerankModel}",
    query="${rerankQuery || '请输入查询'}",
    documents=["文档1", "文档2", "文档3"],
    top_n=${topN},
)

print(response)`;
  const rerankCurlCode = `curl https://api.ataas.local/v1/rerank \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${rerankModelOptions.find((item) => item.value === rerankModel)?.label || rerankModel}",
    "query": "${rerankQuery || '请输入查询'}",
    "documents": ["文档1", "文档2", "文档3"],
    "top_n": ${topN}
  }'`;
  const copyRerankCode = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    message.success('代码已复制');
  };
  const RerankCodeBlock = ({ title, lang, text }: { title: string; lang: string; text: string }) => (
    <section className="playground-code-section">
      <h3>{title}</h3>
      <div className="playground-code-block">
        <div>
          <span>{lang}</span>
          <Space>
            <Button type="text" icon={<CopyOutlined />} onClick={() => copyRerankCode(text)} />
          </Space>
        </div>
        <pre>{text}</pre>
      </div>
    </section>
  );
  return (
    <div className="ataas-embedding-page ataas-rerank-page">
      <div className="ataas-embedding-topbar">
        <h1>文本相似度排序</h1>
        <Button type="text" icon={<CodeOutlined />} onClick={() => setRerankCodeOpen(true)}>查看代码</Button>
      </div>
      <div className="ataas-embedding-layout ataas-rerank-layout">
        <main className="ataas-embedding-main ataas-rerank-main">
          <section className="ataas-embedding-card ataas-rerank-query-card">
            <h2>查询</h2>
            <div className="ataas-rerank-query-row">
              <Input value={rerankQuery} onChange={(event) => setRerankQuery(event.target.value)} placeholder="请输入查询内容" />
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => setRerankGenerated(true)} />
            </div>
          </section>
          <section className="ataas-embedding-card ataas-rerank-doc-card">
            <div className="ataas-embedding-section-head">
              <h2>文档</h2>
              <div>
                <Button icon={<PlusOutlined />} onClick={addDoc}>添加文本</Button>
                <Button icon={<DeleteOutlined />} onClick={clearDocs}>清除</Button>
              </div>
            </div>
            <div className="ataas-rerank-doc-list">
              {rerankDocs.map((doc, index) => (
                <Input key={index} value={doc} onChange={(event) => updateDoc(index, event.target.value)} placeholder="请输入你的文本" />
              ))}
            </div>
          </section>
          <section className="ataas-embedding-card ataas-rerank-result-card">
            <h2>相似度最高的文档</h2>
            {rerankGenerated && rankedDocs.length ? (
              <div className="ataas-rerank-result-list">
                {rankedDocs.map((item, order) => (
                  <div key={item.index} className="ataas-rerank-result-row">
                    <strong>Top {order + 1}</strong>
                    <span>{item.text}</span>
                    <em>{item.score.toFixed(2)}</em>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ataas-embedding-empty">输入查询和文档后点击排序，查看相似度最高的文档</div>
            )}
          </section>
        </main>
        <aside className="ataas-embedding-side">
          <section>
            <h2>模型</h2>
            <Select value={rerankModel} onChange={setRerankModel} options={rerankModelOptions} />
          </section>
          <section>
            <h2>参数</h2>
            <label>Top N <InfoCircleOutlined /></label>
            <InputNumber min={1} max={10} value={topN} onChange={(value) => setTopN(Number(value ?? 1))} />
          </section>
        </aside>
      </div>
      <Modal className="playground-code-modal" title={null} open={rerankCodeOpen} footer={null} width={720} onCancel={() => setRerankCodeOpen(false)}>
        <div className="playground-code-head">
          <h2>查看代码</h2>
          <p>你可以复制以下代码在本地或其他环境中使用，请使用合理方式确保 key 的安全性。</p>
        </div>
        <div className="playground-code-model-card">
          <span className="playground-model-option"><img src={qwenLogo} alt="" /><span>{rerankModelOptions.find((item) => item.value === rerankModel)?.label || rerankModel}</span></span>
        </div>
        <RerankCodeBlock title="OpenAI SDK:" lang="Python" text={rerankPythonCode} />
        <RerankCodeBlock title="HTTP API:" lang="Curl" text={rerankCurlCode} />
      </Modal>
    </div>
  );
};

const VisualModelPage = () => {
  const [ratio, setRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1024 x 1024');
  const visionPromptPreset = '穿着宇航服的小猫咪，背景是地球，悬浮在宇宙中，手上拿着白板上面写着“宇宙行走第一猫”';
  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionCodeOpen, setVisionCodeOpen] = useState(false);
  const [visionModelPickerOpen, setVisionModelPickerOpen] = useState(false);
  const [visionModelSearch, setVisionModelSearch] = useState('');
  const [selectedVisionModel, setSelectedVisionModel] = useState('qwen-image');
  const [visionUploadName, setVisionUploadName] = useState('');
  const visionModelOptions = [
    { value: 'qwen-image', label: 'Qwen-Image', desc: '图像生成 / 文生图 / 多比例出图', logo: qwenLogo },
    { value: 'wanx-image', label: 'Wanx-Image', desc: '通用创意图像生成服务', logo: qwenLogo },
    { value: 'internvl-image', label: 'InternVL-Image', desc: '视觉理解与图像创作服务', logo: minicpmLogo },
  ];
  const currentVisionModel = visionModelOptions.find((item) => item.value === selectedVisionModel) || visionModelOptions[0];
  const renderVisionModelLabel = (modelValue: string) => {
    const model = visionModelOptions.find((item) => item.value === modelValue) || visionModelOptions[0];
    return (
      <span className="playground-model-option">
        <img src={model.logo} alt="" />
        <span>{model.label}</span>
      </span>
    );
  };
  const visionPythonCode = `# 请安装 OpenAI SDK： pip install openai
from openai import OpenAI

client = OpenAI(
    base_url="https://api.ataas.local/v1",
    api_key="YOUR_API_KEY",
)

response = client.images.generate(
    model="${currentVisionModel.label}",
    prompt="写下你想要创作的创意",
    size="${resolution.replace(/\s/g, '')}",
)

print(response)`;
  const visionCurlCode = `curl https://api.ataas.local/v1/images/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${currentVisionModel.label}",
    "prompt": "写下你想要创作的创意",
    "size": "${resolution.replace(/\s/g, '')}"
  }'`;
  const copyVisionCode = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    message.success('代码已复制');
  };
  const downloadVisionCode = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const VisionCodeBlock = ({ title, lang, text, filename }: { title: string; lang: string; text: string; filename: string }) => (
    <section className="playground-code-section">
      <h3>{title}</h3>
      <div className="playground-code-block">
        <div>
          <span>{lang}</span>
          <Space>
            <Button type="text" icon={<CopyOutlined />} onClick={() => copyVisionCode(text)} />
            <Button type="text" icon={<DownloadOutlined />} onClick={() => downloadVisionCode(text, filename)} />
          </Space>
        </div>
        <pre>{text}</pre>
      </div>
    </section>
  );
  const ratioOptions = [
    { value: '1:1', shape: 'square' },
    { value: '3:4', shape: 'portrait' },
    { value: '4:3', shape: 'landscape' },
    { value: '9:16', shape: 'tall' },
    { value: '16:9', shape: 'wide' },
  ];
  return (
    <div className="ataas-vision-page">
      <div className="ataas-vision-topbar">
        <h1>图像模型</h1>
        <Button type="text" icon={<CodeOutlined />} onClick={() => setVisionCodeOpen(true)}>查看代码</Button>
      </div>
      <div className="ataas-vision-layout">
        <aside className="ataas-vision-sidebar">
          <section className="ataas-vision-panel-block">
            <h2><RocketOutlined />写下你的创意</h2>
            <div className="ataas-vision-textarea-wrap">
              <Input.TextArea
                value={visionPrompt}
                onChange={(event) => setVisionPrompt(event.target.value)}
                maxLength={800}
                placeholder="写下你想要创作的创意"
                autoSize={false}
              />
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  setVisionUploadName(file.name);
                  message.success(`图片已选择：${file.name}`);
                  return false;
                }}
              >
                <button type="button" className="ataas-vision-upload-trigger" aria-label="上传图片">
                  <UploadOutlined />
                </button>
              </Upload>
            </div>
            {visionUploadName && <div className="ataas-vision-upload-name">{visionUploadName}</div>}
            <div className="ataas-vision-count">0/800</div>
          </section>
          <section className="ataas-vision-panel-block">
            <h3><DownOutlined />Negative Prompt</h3>
            <div className="ataas-vision-negative">
              <Input.TextArea
                maxLength={500}
                placeholder="如卡通、颜色、或者血腥内容"
                autoSize={false}
              />
            </div>
            <div className="ataas-vision-count">0/500</div>
          </section>
          <section className="ataas-vision-panel-block">
            <h3><DownOutlined />图片比例</h3>
            <div className="ataas-vision-ratio-grid">
              {ratioOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={ratio === item.value ? 'active' : ''}
                  onClick={() => setRatio(item.value)}
                >
                  <i className={`shape-${item.shape}`} />
                  <span>{item.value}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="ataas-vision-panel-block">
            <h3><DownOutlined />分辨率</h3>
            <div className="ataas-vision-resolution-grid">
              {['1024 x 1024', '768 x 1024', '1024 x 768', '720 x 1280'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={resolution === item ? 'active' : ''}
                  onClick={() => setResolution(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>
          <button type="button" className="ataas-vision-generate">生成图片</button>
        </aside>
        <main className="ataas-vision-stage">
          <div className="ataas-vision-modelbar">
            <div className="ataas-vision-model-name">
              <span><img src={currentVisionModel.logo} alt="" /></span>
              <strong>{currentVisionModel.label}</strong>
            </div>
            <Tooltip title="切换模型">
              <button type="button" aria-label="切换模型" onClick={() => setVisionModelPickerOpen(true)}><SwapRightOutlined /></button>
            </Tooltip>
          </div>
          <div className="ataas-vision-empty-title">
            <ThunderboltOutlined />
            <span>请在左侧输入你的创意测试吧</span>
          </div>
          <div className="ataas-vision-preview">
            <div className="ataas-vision-preview-scene">
              <img src={visionCatPreview} alt="图像模型生成预览" />
              <div className="ataas-vision-preview-overlay">
                <p>{visionPromptPreset}</p>
                <button type="button" onClick={() => setVisionPrompt(visionPromptPreset)}>引用参数</button>
              </div>
              <em>AI 作图</em>
            </div>
          </div>
        </main>
      </div>
      <Modal className="playground-code-modal" title={null} open={visionCodeOpen} footer={null} width={720} onCancel={() => setVisionCodeOpen(false)}>
        <div className="playground-code-head">
          <h2>查看代码</h2>
          <p>你可以复制以下代码在本地或其他环境中使用，请使用合理方式确保 key 的安全性。</p>
        </div>
        <div className="playground-code-model-card">
          {renderVisionModelLabel(selectedVisionModel)}
        </div>
        <VisionCodeBlock title="OpenAI SDK:" lang="Python" text={visionPythonCode} filename="image-generations.py" />
        <VisionCodeBlock title="HTTP API:" lang="Curl" text={visionCurlCode} filename="image-generations.curl" />
      </Modal>
      <Modal
        className="playground-service-modal"
        title="切换模型"
        open={visionModelPickerOpen}
        onCancel={() => setVisionModelPickerOpen(false)}
        width={860}
        footer={(
          <div className="playground-service-footer">
            <div className="playground-service-selected">
              <span>已选：1</span>
              <Tag closable={false}>{currentVisionModel.label}</Tag>
            </div>
            <Space>
              <Button onClick={() => setVisionModelPickerOpen(false)}>取消</Button>
              <Button type="primary" onClick={() => setVisionModelPickerOpen(false)}>确定</Button>
            </Space>
          </div>
        )}
      >
        <div className="playground-service-search">
          <Input.Search placeholder="搜索图像模型" value={visionModelSearch} onChange={(event) => setVisionModelSearch(event.target.value)} allowClear />
        </div>
        <div className="playground-service-picker">
          <div className="playground-service-list">
            <div className="playground-service-title">图像模型</div>
            {visionModelOptions.filter((item) => !visionModelSearch || item.label.toLowerCase().includes(visionModelSearch.toLowerCase()) || item.desc.toLowerCase().includes(visionModelSearch.toLowerCase())).map((item) => {
              const checked = item.value === selectedVisionModel;
              return (
                <button key={item.value} className={'playground-service-row' + (checked ? ' checked' : '')} onClick={() => setSelectedVisionModel(item.value)}>
                  {renderVisionModelLabel(item.value)}
                  <span>{item.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="playground-service-selected-panel">
            <div className="playground-service-title">已选服务</div>
            <button className="playground-service-selected-row" onClick={() => setVisionModelPickerOpen(false)}>
              {renderVisionModelLabel(selectedVisionModel)}
              <span>当前选择</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const VisionAnalysisPage = () => {
  const [analysisModel, setAnalysisModel] = useState('qwen-vl-max');
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [analysisImageName, setAnalysisImageName] = useState('');
  const [analysisCodeOpen, setAnalysisCodeOpen] = useState(false);
  const [temperature, setTemperature] = useState(1);
  const [maxToken, setMaxToken] = useState(1024);
  const [topP, setTopP] = useState(1);
  const modelOptions = [
    { value: 'qwen-vl-max', label: 'Qwen-VL-Max' },
    { value: 'internvl2-26b', label: 'InternVL2-26B' },
    { value: 'minicpm-v-2.6', label: 'MiniCPM-V-2.6' },
  ];
  const currentModel = modelOptions.find((item) => item.value === analysisModel)?.label || analysisModel;
  const visualPythonCode = `from openai import OpenAI

client = OpenAI(
    base_url="https://api.ataas.local/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="${currentModel}",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "${analysisPrompt || '请分析这张图片'}"},
            {"type": "image_url", "image_url": {"url": "IMAGE_URL"}}
        ]
    }],
    temperature=${temperature},
    max_tokens=${maxToken},
    top_p=${topP},
)

print(response.choices[0].message.content)`;
  const ParamSlider = ({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) => (
    <div className="ataas-visual-param-row">
      <div className="ataas-visual-param-head">
        <span>{label} <InfoCircleOutlined /></span>
        <InputNumber min={min} max={max} step={step} value={value} onChange={(next) => onChange(Number(next ?? min))} />
      </div>
      <Slider min={min} max={max} step={step} value={value} onChange={(next) => onChange(Number(next))} tooltip={{ open: false }} />
    </div>
  );
  return (
    <div className="ataas-visual-page">
      <div className="ataas-visual-topbar">
        <div className="ataas-visual-title">
          <h1>图片解析</h1>
        </div>
        <Button type="text" icon={<CodeOutlined />} onClick={() => setAnalysisCodeOpen(true)}>查看代码</Button>
      </div>
      <div className="ataas-visual-layout">
        <main className="ataas-visual-main">
          <section className="ataas-visual-output">
            {analysisImageName ? (
              <div className="ataas-visual-upload-preview">
                <InboxOutlined />
                <strong>{analysisImageName}</strong>
                <span>图片已上传，输入问题后可开始解析</span>
              </div>
            ) : null}
          </section>
          <div className="ataas-visual-token-bar">
            <span>Token 使用量: 0</span>
            <span>当前输出速度：0 tokens / s</span>
          </div>
          <section className="ataas-visual-input-card">
            <Input.TextArea
              value={analysisPrompt}
              onChange={(event) => setAnalysisPrompt(event.target.value)}
              placeholder="输入你想问的问题"
              autoSize={false}
            />
            <div className="ataas-visual-input-actions">
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  setAnalysisImageName(file.name);
                  message.success(`图片已选择：${file.name}`);
                  return false;
                }}
              >
                <button type="button" className="ataas-visual-upload-btn" aria-label="上传图片">
                  <UploadOutlined />
                </button>
              </Upload>
              <button type="button" className="ataas-visual-send-btn" disabled={!analysisPrompt.trim() && !analysisImageName}>
                <ArrowRightOutlined />
              </button>
            </div>
          </section>
        </main>
        <aside className="ataas-visual-side">
          <section>
            <h2>模型</h2>
            <Select value={analysisModel} onChange={setAnalysisModel} options={modelOptions} />
          </section>
          <section>
            <h2>参数</h2>
            <ParamSlider label="Temperature" value={temperature} min={0} max={2} step={0.1} onChange={setTemperature} />
            <ParamSlider label="Max Token" value={maxToken} min={1} max={4096} step={1} onChange={setMaxToken} />
            <ParamSlider label="Top P" value={topP} min={0} max={1} step={0.1} onChange={setTopP} />
          </section>
        </aside>
      </div>
      <Modal className="playground-code-modal" title={null} open={analysisCodeOpen} footer={null} width={720} onCancel={() => setAnalysisCodeOpen(false)}>
        <div className="playground-code-head">
          <h2>查看代码</h2>
          <p>你可以复制以下代码在本地或其他环境中使用，请使用合理方式确保 key 的安全性。</p>
        </div>
        <div className="playground-code-model-card">
          <span className="playground-model-option"><img src={qwenLogo} alt="" /><span>{currentModel}</span></span>
        </div>
        <section className="playground-code-section">
          <h3>OpenAI SDK:</h3>
          <div className="playground-code-block">
            <div><span>Python</span><Button type="text" icon={<CopyOutlined />} onClick={() => navigator.clipboard?.writeText(visualPythonCode)} /></div>
            <pre>{visualPythonCode}</pre>
          </div>
        </section>
      </Modal>
    </div>
  );
};

const LogBoardCard = ({ icon, label, detail, time, status }: { icon: React.ReactNode; label: string; detail: string; time: string; status: 'success' | 'warning' }) => (
  <div className="ataas-log-card">
    <span className={status === 'success' ? 'ataas-log-ok' : 'ataas-log-warning'}>{icon}</span>
    <div><strong>{label}</strong><span>{detail}</span></div>
    <em>{time}</em>
  </div>
);

const AtAasDesign = () => {
  const [activeTab, setActiveTab] = useState(() => {
    if (window.location.pathname.includes('/containers')) return 'containerManagement';
    if (window.location.pathname.includes('/route-workbench')) return 'routeWorkbench';
    if (window.location.pathname.includes('/task-flow')) return 'taskFlow';
    if (window.location.pathname.includes('/playground/chat')) return 'playgroundChat';
    if (window.location.pathname.includes('/playground/vision')) return 'playgroundChat';
    if (window.location.pathname.includes('/playground/visual')) return 'playgroundVisual';
    if (window.location.pathname.includes('/playground/embedding')) return 'playgroundEmbedding';
    if (window.location.pathname.includes('/playground/rerank')) return 'playgroundRerank';
    if (window.location.pathname.includes('/benchmark')) return 'benchmark';
    return 'overview';
  });
  const [themeSettings, setThemeSettings] = useState<ThemeSettingsState>(defaultThemeSettings);
  const [clusterViewMode, setClusterViewMode] = useState<'cluster' | 'gpu'>('cluster');
  const [callRankMode, setCallRankMode] = useState<'tpm' | 'rpm'>('tpm');
  const [clusterPanel, setClusterPanel] = useState<'clusters' | 'nodes'>('clusters');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set(['概览', '资源管理', '模型管理', '模型测试', '身份权限', '系统监控']));
  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };
  const [selectedClusterKey, setSelectedClusterKey] = useState('all');
  const [clusterCreateOpen, setClusterCreateOpen] = useState(false);
  const [clusterCreateName, setClusterCreateName] = useState('');
  const [clusterCreateUrl, setClusterCreateUrl] = useState('');
  const [clusterCreateAccessKey, setClusterCreateAccessKey] = useState('');
  const [clusterNodeList, setClusterNodeList] = useState<NodeRecord[]>(nodes);
  const [clusterNodeEditTarget, setClusterNodeEditTarget] = useState<NodeRecord | null>(null);
  const [clusterNodeEditRemark, setClusterNodeEditRemark] = useState('');
  const [clusterNodeLabelEditTarget, setClusterNodeLabelEditTarget] = useState<NodeRecord | null>(null);
  const [clusterNodeEditLabel, setClusterNodeEditLabel] = useState('');
  const [nodeGpuAuthTarget, setNodeGpuAuthTarget] = useState<NodeRecord | null>(null);
  const [podList] = useState<PodRecord[]>(pods);
  const [podClusterFilter, setPodClusterFilter] = useState('all');
  const [podNamespaceFilter, setPodNamespaceFilter] = useState('all');
  const [podSearch, setPodSearch] = useState('');
  const [podActionTarget, setPodActionTarget] = useState<PodRecord | null>(null);
  const [podYamlOpen, setPodYamlOpen] = useState(false);
  const [podLogOpen, setPodLogOpen] = useState(false);
  const [podTerminalHistory, setPodTerminalHistory] = useState<string[]>([]);
  const [podConsoleTarget, setPodConsoleTarget] = useState<PodRecord | null>(null);
  const [podDeleteStep1, setPodDeleteStep1] = useState<PodRecord | null>(null);
  const [podDeleteStep2, setPodDeleteStep2] = useState<PodRecord | null>(null);
  const [podDeleteConfirmText, setPodDeleteConfirmText] = useState('');
  const [podCreateOpen, setPodCreateOpen] = useState(false);
  const [podCreateCluster, setPodCreateCluster] = useState<string | null>(null);
  const [podCreateNode, setPodCreateNode] = useState<string | null>(null);
  const [podCreateYaml, setPodCreateYaml] = useState<string | null>(null);
  const podTerminalRef = useRef<HTMLDivElement>(null);
  const podTerminalInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (podTerminalRef.current) podTerminalRef.current.scrollTop = podTerminalRef.current.scrollHeight;
    if (podConsoleTarget && podTerminalInputRef.current) podTerminalInputRef.current.focus();
  }, [podTerminalHistory, podConsoleTarget]);
  const getPodYaml = (p: PodRecord) => [
    'apiVersion: v1', 'kind: Pod', 'metadata:', '  name: ' + p.name, '  namespace: ' + p.namespace,
    '  labels:', '    app: ' + p.trafficSource, '    cluster: ' + p.cluster,
    '  annotations:', '    kubectl.kubernetes.io/default-container: ' + p.name,
    'spec:', '  nodeName: ' + p.node, '  containers:',
    '    - name: main', '      image: ' + p.image, '      imagePullPolicy: IfNotPresent',
    '      ports:', '        - containerPort: 8000', '          protocol: TCP',
    '      resources:', '        limits:',
    '          cpu: "32"', '          memory: "256Gi"',
    '          nvidia.com/gpu: "' + (p.nodeGPU.match(/x\s*(\d+)/)?.[1] || '8') + '"',
    '      env:', '        - name: POD_IP', '          value: ' + p.podIP,
    '        - name: NODE_NAME', '          valueFrom:', '            fieldRef:', '              fieldPath: spec.nodeName',
    '  restartPolicy: Always',
    'status:', '  phase: ' + p.status, '  podIP: ' + p.podIP, '  hostIP: ' + p.node,
    '  conditions:', '    - type: Ready', '      status: "' + (p.ready === '1/1' ? 'True' : 'False') + '"',
    '      lastTransitionTime: "' + new Date().toISOString() + '"',
    '  containerStatuses:', '    - name: main',
    '      ready: ' + (p.ready.startsWith('1/') ? 'true' : 'false'),
    '      restartCount: ' + p.restart, '      image: ' + p.image,
    '      started: ' + (p.ready.startsWith('1/') ? 'true' : 'false'),
  ].join('\n');
  const getPodLogs = (p: PodRecord) => Array.from({ length: 40 }, (_, i) => {
    const ts = new Date(Date.now() - (40 - i) * 30000).toISOString().replace('T', ' ').replace('Z', '');
    const msgs = [
      'INFO: HTTP request received - GET /v1/chat/completions',
      'INFO: Scheduling request on GPU ' + (p.gpuUtil > 0 ? (i % 8) : 0),
      'DEBUG: KV cache hit ratio: ' + (50 + (i % 30)) + '%',
      'INFO: Batch size: ' + (4 + (i % 12)) + ', pending: ' + (i % 3),
      'INFO: Generated ' + (128 + i * 37) + ' tokens, avg ' + (18 + (i % 12)) + ' ms/token',
      'INFO: Request completed in ' + (200 + i * 45) + 'ms, status 200',
      'DEBUG: GPU memory: ' + (40 + (i % 40)) + '% used, ' + (p.gpuVram > 0 ? p.gpuVram - (i % 15) : 0) + '% cached',
    ][i % 7];
    return '[' + ts + '] ' + msgs;
  }).join('\n');
  const [nodeGpuAuthKeys, setNodeGpuAuthKeys] = useState<Key[]>([]);
  const [nodeGpuAuthMap, setNodeGpuAuthMap] = useState<Record<string, string[]>>(() => Object.fromEntries(
    nodes
      .filter((node) => node.authStatus === 'authorized')
      .map((node) => [node.key, node.gpuCards.map((card) => String(card.index))])
  ));
  const [clusterTokenOpen, setClusterTokenOpen] = useState(false);
  const [clusterTokenTarget, setClusterTokenTarget] = useState<ClusterRecord | null>(null);
  const [clusterTokenText, setClusterTokenText] = useState('');
  const [clusterDeleteConfirm, setClusterDeleteConfirm] = useState<ClusterRecord | null>(null);
  const [clusterKeyEditOpen, setClusterKeyEditOpen] = useState(false);
  const [clusterKeyEditTarget, setClusterKeyEditTarget] = useState<ClusterRecord | null>(null);
  const [clusterKeyEditValue, setClusterKeyEditValue] = useState('');
  const [clusterKeyYamlValue, setClusterKeyYamlValue] = useState('');
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
  const [monitorReportRow, setMonitorReportRow] = useState<MonitorRow | null>(null);
  const [monitorRefreshMode, setMonitorRefreshMode] = useState('手动刷新');
  const [monitorTimePrecision, setMonitorTimePrecision] = useState<MonitorTimePrecision>('minute');
  const [monitorReportDate, setMonitorReportDate] = useState(() => dayjs());
  const [monitorReportDateRange, setMonitorReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => [dayjs().subtract(7, 'day'), dayjs()]);
  const [monitorReportCalendarRange, setMonitorReportCalendarRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [alertDateRange, setAlertDateRange] = useState<[string, string] | null>(null);
  const [alertClusterFilter, setAlertClusterFilter] = useState<string | null>(null);
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
  const [alertSearchText, setAlertSearchText] = useState<string>('');
  const [alertSearchField, setAlertSearchField] = useState<string>('all');
  const [alertList, setAlertList] = useState<AlertRecord[]>(initialAlertData);
  const [alertDetailRecord, setAlertDetailRecord] = useState<AlertRecord | null>(null);
  const [apiKeySearchText, setApiKeySearchText] = useState('');
  const [apiKeyCreateOpen, setApiKeyCreateOpen] = useState(false);
  const [apiKeyForm] = Form.useForm();
  const [apiKeyList, setApiKeyList] = useState<Array<{ key: string; name: string; description: string; token: string; createdAt: string; expiresAt: string }>>([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [userCreateOpen, setUserCreateOpen] = useState(false);
  const [userCreateRole, setUserCreateRole] = useState<'admin' | 'user'>('user');
  const [userForm] = Form.useForm();
  const [userList, setUserList] = useState<UserManageRecord[]>(userManageSeed);
  const [engineSearchText, setEngineSearchText] = useState('');
  const [engineCreateOpen, setEngineCreateOpen] = useState(false);
  const [engineEditingRecord, setEngineEditingRecord] = useState<EngineManageRecord | null>(null);
  const [engineDetailRecord, setEngineDetailRecord] = useState<EngineManageRecord | null>(null);
  const [engineSelectedRowKeys, setEngineSelectedRowKeys] = useState<string[]>([]);
  const [engineAddModelValue, setEngineAddModelValue] = useState<string[]>([]);
  const [engineCreateForm] = Form.useForm();
  const [engineList, setEngineList] = useState<EngineManageRecord[]>(engineManageSeed);
  const getMonitorRangeLimitDays = (precision: MonitorTimePrecision) => (precision === 'day' ? 30 : 7);
  const handleMonitorPrecisionChange = (value: MonitorTimePrecision) => {
    const today = dayjs();
    setMonitorTimePrecision(value);
    setMonitorReportCalendarRange(null);
    if (value === 'minute') {
      setMonitorReportDate(today);
      return;
    }
    setMonitorReportDateRange([today.subtract(7, 'day'), today]);
  };
  const handleMonitorReportRangeChange = (range: null | [dayjs.Dayjs | null, dayjs.Dayjs | null]) => {
    if (!range?.[0] || !range?.[1]) return;
    const today = dayjs().endOf('day');
    const normalizedStart = range[0].isAfter(today) ? today : range[0];
    const normalizedEnd = range[1].isAfter(today) ? today : range[1];
    const [start, end] = normalizedStart.isAfter(normalizedEnd) ? [normalizedEnd, normalizedStart] : [normalizedStart, normalizedEnd];
    const limitDays = getMonitorRangeLimitDays(monitorTimePrecision);
    setMonitorReportDateRange([start, end.diff(start, 'day') > limitDays ? start.add(limitDays, 'day') : end]);
  };
  const disabledMonitorReportDate = (date: dayjs.Dayjs) => {
    if (date.isAfter(dayjs(), 'day')) return true;
    if (monitorTimePrecision === 'minute') return false;
    const selected = monitorReportCalendarRange?.[0] || monitorReportCalendarRange?.[1];
    if (!selected) return false;
    const limitDays = getMonitorRangeLimitDays(monitorTimePrecision);
    return date.isBefore(selected.subtract(limitDays, 'day'), 'day') || date.isAfter(selected.add(limitDays, 'day'), 'day');
  };
  const handleMonitorReportDateChange = (value: dayjs.Dayjs | null) => {
    if (!value) return;
    setMonitorReportDate(value.isAfter(dayjs(), 'day') ? dayjs() : value);
  };
  const logData: Array<{ user: string; action: string; object: string; objectType: string; cluster: string; node: string; status: string; time: string; detail: string }> = [
    { user: 'admin', action: '创建服务', object: 'deepseek-prod', objectType: '模型服务', cluster: 'beijing-a100-prod', node: 'bj-a100-worker-012', status: '成功', time: '2026-05-29 14:35', detail: '部署模式: PD 分离, 引擎: SGLang, GPU: H20 x 4, 实例: 2' },
    { user: 'ops-lilei', action: '上传镜像', object: 'sglang:v0.4.8-h20', objectType: '引擎镜像', cluster: '-', node: '-', status: '成功', time: '2026-05-29 14:18', detail: '镜像大小: 21.3 GB, 标签: h20-pd-cache, 来源: 在线拉取' },
    { user: 'zhaomin', action: '调整参数', object: 'qwen3-coding-slo', objectType: '模型服务', cluster: 'shanghai-h20-online', node: 'sh-h20-worker-021', status: '成功', time: '2026-05-29 13:57', detail: 'TTFT 阈值: 500ms → 300ms, TPOT 阈值: 50ms → 30ms' },
    { user: 'admin', action: '修改标签', object: 'gpu-worker-021', objectType: '节点', cluster: 'shanghai-h20-online', node: 'sh-h20-worker-021', status: '成功', time: '2026-05-29 13:42', detail: '标签变更: GPU=H20 → GPU=H20_PD, 节点: sh-h20-worker-021' },
    { user: 'system', action: '节点隔离', object: 'worker-a100-017', objectType: '节点', cluster: 'beijing-a100-prod', node: 'worker-a100-017', status: '失败', time: '2026-05-29 13:20', detail: '原因: GPU 温度过高(89°C), 自动隔离, 影响服务: deepseek-prod' },
    { user: 'admin', action: '部署模型', object: 'glm-air-batch', objectType: '模型服务', cluster: 'guangzhou-l20-test', node: 'gz-l20-worker-003', status: '成功', time: '2026-05-29 12:58', detail: '模型: GLM-4.5-Air, 引擎: vLLM, 集群: guangzhou-l20-test, 实例: 2' },
    { user: 'ops-wang', action: '集群扩容', object: 'guangzhou-test', objectType: '集群', cluster: 'guangzhou-l20-test', node: 'gz-l20-worker-019', status: '成功', time: '2026-05-29 12:15', detail: '新增节点: 4 台, GPU: L20 x 16, 扩容后总量: 19 台 / 72 卡' },
    { user: 'zhaomin', action: '更新配置', object: 'vLLM 0.9.1', objectType: '引擎镜像', cluster: '-', node: '-', status: '成功', time: '2026-05-29 11:42', detail: '配置参数: max_model_len=8192, gpu_memory_utilization=0.9' },
    { user: 'admin', action: '删除镜像', object: 'triton:23.12-py3', objectType: '引擎镜像', cluster: '-', node: '-', status: '成功', time: '2026-05-29 11:08', detail: '镜像标签: triton:23.12-py3, 大小: 12.4 GB, 已清理存储' },
    { user: 'system', action: '节点恢复', object: 'gz-l20-worker-005', objectType: '节点', cluster: 'guangzhou-l20-test', node: 'gz-l20-worker-005', status: '成功', time: '2026-05-29 10:35', detail: '节点离线后自动恢复, 当前状态: 正常, 运行服务: 3 个' },
    { user: 'ops-lilei', action: '创建命名空间', object: 'ns-aimon-002', objectType: '命名空间', cluster: '-', node: '-', status: '成功', time: '2026-05-29 09:54', detail: '命名空间: ns-aimon-002, 配额: CPU 32核, 内存 128GB, GPU 8卡' },
    { user: 'admin', action: '绑定配额', object: 'aimon-team', objectType: '配额', cluster: '-', node: '-', status: '成功', time: '2026-05-29 09:12', detail: '团队: aimon-team, GPU 配额: 32 卡, 有效期: 永久' },
  ];
  const filteredLogs = useMemo(() => {
    let list = logData;
    if (logDateRange) {
      list = list.filter((item) => item.time >= logDateRange[0] && item.time <= logDateRange[1]);
    }
    if (logSearchText) {
      const keyword = logSearchText.toLowerCase();
      list = list.filter((item) => {
        if (logSearchField === 'all') return item.user.toLowerCase().includes(keyword) || item.action.toLowerCase().includes(keyword) || item.object.toLowerCase().includes(keyword) || item.cluster.toLowerCase().includes(keyword) || item.node.toLowerCase().includes(keyword) || item.status.includes(keyword);
        if (logSearchField === 'user') return item.user.toLowerCase().includes(keyword);
        if (logSearchField === 'action') return item.action.toLowerCase().includes(keyword);
        if (logSearchField === 'object') return item.object.toLowerCase().includes(keyword);
        if (logSearchField === 'cluster') return item.cluster.toLowerCase().includes(keyword);
        if (logSearchField === 'node') return item.node.toLowerCase().includes(keyword);
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
      list = list.filter((item) => {
        if (alertSearchField === 'all') {
          return item.target.toLowerCase().includes(kw) || item.objectType.toLowerCase().includes(kw) || item.description.toLowerCase().includes(kw) || item.suggestion.toLowerCase().includes(kw);
        }
        if (alertSearchField === 'target') return item.target.toLowerCase().includes(kw);
        if (alertSearchField === 'objectType') return item.objectType.toLowerCase().includes(kw);
        if (alertSearchField === 'description') return item.description.toLowerCase().includes(kw);
        if (alertSearchField === 'suggestion') return item.suggestion.toLowerCase().includes(kw);
        return false;
      });
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
  const [modelRepoImportOpen, setModelRepoImportOpen] = useState(false);
  const [modelRepoTaskOpen, setModelRepoTaskOpen] = useState(false);
  const [modelRepoOfflineTarget, setModelRepoOfflineTarget] = useState<ModelRepoRecord | null>(null);
  const [modelRepoDownloadTarget, setModelRepoDownloadTarget] = useState<ModelRepoRecord | null>(null);
  const [modelRepoMoreOpenId, setModelRepoMoreOpenId] = useState<number | null>(null);
  const modelRepoInfoUploadRef = useRef<HTMLInputElement | null>(null);
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
  const [modelOpsListViewMode, setModelOpsListViewMode] = useState<ViewMode>('table');
  const [modelOpsClusterFilter, setModelOpsClusterFilter] = useState('');
  const [modelOpsSelectedModel, setModelOpsSelectedModel] = useState('');
  const [modelOpsSelectedServiceId, setModelOpsSelectedServiceId] = useState<number | null>(null);
  const [modelOpsWeights, setModelOpsWeights] = useState<Record<string, number>>({});
  const [modelOpsWeightModalServiceId, setModelOpsWeightModalServiceId] = useState<number | null>(null);
  const [deployMode, setDeployMode] = useState<string>('single');
  const [startupTemplateForm] = Form.useForm();
  const [addInstPdTemplateForm] = Form.useForm();
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
  const [deployDetailModalOpen, setDeployDetailModalOpen] = useState(false);
  const [deployDetailExtraNodes, setDeployDetailExtraNodes] = useState<ExtraInstanceInfo[]>([]);
  const [detailTrafficEnabled, setDetailTrafficEnabled] = useState(false);
  const [deployLogModal, setDeployLogModal] = useState<{ podName: string; namespace: string; lines: string[]; follow: boolean } | null>(null);
  const deployLogBodyRef = useRef<HTMLPreElement | null>(null);
  const resetGatewayTrafficByCount = (count: number) => {
    const safeCount = Math.max(1, count);
    if (safeCount <= 1) {
      setGatewayGroupTraffic([{ groupKey: '实例 1', percent: 100 }]);
      return;
    }
    const pct = Math.floor(100 / safeCount);
    setGatewayGroupTraffic(Array.from({ length: safeCount }, (_, i) => ({ groupKey: `实例 ${i + 1}`, percent: i === safeCount - 1 ? 100 - pct * (safeCount - 1) : pct })));
  };
  const handleDeployDetail = (item: DeployServiceItem) => {
    setDeployDetailItem(item);
    setDeployDetailModalOpen(false);
    setModelOpsSelectedModel(item.modelInfo.name || item.typeStr || item.name);
    setModelOpsSelectedServiceId(item.id);
    setModelOpsClusterFilter('');
    setActiveTab('modelOps');
    setDeployDetailExtraNodes([]);
    setDetailTrafficEnabled(false);
    const works = item.modelInfo.works?.split(',').map((w: string) => w.trim()).filter(Boolean) || [];
    const count = works.length > 0 ? works.length : (item.modelInfo.number || 1);
    resetGatewayTrafficByCount(count);
  };
  const handleDeployDeleteInstance = (item: DeployServiceItem, instanceIndex: number) => {
    const works = item.modelInfo.works?.split(',').map((work: string) => work.trim()).filter(Boolean) || [];
    const currentCount = works.length > 0 ? works.length : (item.modelInfo.number || 1);
    if (currentCount <= 1) {
      message.warning('至少保留一个实例');
      return;
    }
    const nextWorks = works.length > 0 ? works.filter((_: string, index: number) => index !== instanceIndex) : works;
    const nextCount = currentCount - 1;
    const nextItem: DeployServiceItem = {
      ...item,
      modelInfo: {
        ...item.modelInfo,
        number: nextCount,
        works: works.length > 0 ? nextWorks.join(', ') : item.modelInfo.works,
      },
    };
    setDeployServices((prev) => prev.map((service) => service.id === item.id ? nextItem : service));
    if (deployDetailItem?.id === item.id) {
      setDeployDetailItem(nextItem);
      setDeployDetailExtraNodes([]);
      resetGatewayTrafficByCount(nextCount);
    }
    message.success(`实例 ${instanceIndex + 1} 已删除`);
  };
  const handleDeployMonitor = (item: DeployServiceItem) => {
    const serviceName = item.name;
    setMonitorSearchText(serviceName);
    setMonitorExactServiceName(serviceName);
    setMonitorClusterFilter('');
    setMonitorReportRow(null);
    setActiveTab('monitoring');
  };
  const handleDeployStop = (item: DeployServiceItem) => {
    const parseRoleCount = (value?: string) => {
      const total = Number(String(value || '').split('/')[1]);
      return Number.isFinite(total) && total > 0 ? total : 0;
    };
    const sourceServiceId = item.modelOpsSourceServiceId || item.id;
    if (item.modelOpsRoleSummary) {
      const routerCount = parseRoleCount(item.modelOpsRoleSummary.router);
      const prefillCount = parseRoleCount(item.modelOpsRoleSummary.prefill);
      const decodeCount = parseRoleCount(item.modelOpsRoleSummary.decode);
      Modal.confirm({
        title: '确认整组下线',
        content: (
          <div>
            <p>当前 PD 组包含 {routerCount} 个 Router、{prefillCount} 个 Prefill、{decodeCount} 个 Decode，点击确认后将同时下线。</p>
            <div style={{ marginTop: 8, color: '#4E5969', lineHeight: 1.8 }}>
              模型实例：{item.name}
            </div>
          </div>
        ),
        onOk: () => {
          setDeployServices((prev) => prev.map((s) => s.id === sourceServiceId ? { ...s, status: 'ready' as const, timeStr: '未部署' } : s));
          message.success('已下线');
        },
      });
      return;
    }
    const workInstances = item.modelInfo.works?.split(',').map((work: string) => work.trim()).filter(Boolean) || [];
    const instanceCount = Math.max(1, workInstances.length || item.modelInfo.number || 1);
    const instanceNames = workInstances.length > 0
      ? workInstances
      : Array.from({ length: instanceCount }, (_, index) => `${item.name}-实例${index + 1}`);
    Modal.confirm({
      title: '确认停止',
      content: (
        <div>
          <p>当前此模型服务包含 {instanceCount} 个实例，点击确认后将同时下线。</p>
          <div style={{ marginTop: 8, color: '#4E5969', lineHeight: 1.8 }}>
            实例名：{instanceNames.join('、')}
          </div>
        </div>
      ),
      onOk: () => {
        setDeployServices((prev) => prev.map((s) => s.id === sourceServiceId ? { ...s, status: 'ready' as const, timeStr: '未部署' } : s));
        message.success('已停止');
      },
    });
  };
  const handleDeployExperience = (item: DeployServiceItem) => {
    const targetMap: Record<DeployServiceItem['category'], { tab: string; path: string; label: string }> = {
      llm: { tab: 'playgroundChat', path: '/playground/chat', label: '文本模型' },
      vlm: { tab: 'playgroundChat', path: '/playground/chat', label: '文本模型' },
      embedding: { tab: 'playgroundEmbedding', path: '/playground/embedding', label: '嵌入模型' },
      rerank: { tab: 'playgroundRerank', path: '/playground/rerank', label: '重排模型' },
    };
    const target = targetMap[item.category] || targetMap.llm;
    setActiveTab(target.tab);
    window.history.replaceState(null, '', target.path);
  };
  const createDeployPodLogLines = (podName: string, start: number, count: number) => {
    const pad = (value: number) => String(value).padStart(2, '0');
    const base = new Date('2026-06-29T13:09:35');
    const templates = [
      'INFO:        10.25.110.224:59532 - "GET /metrics HTTP/1.1" 200 OK',
      'ATTN_CP{lane} TP{lane} Req Time Stats(rid={rid}, bootstrap_room={room}, input_len={input}, output_len=1, type=prefill): bootstrap_queue_duration({boot}.74ms) = bootstrap({boot}.73ms) + alloc_wait(0.02ms); queue_duration={queue}ms, forward_duration={forward}ms, transfer_speed={speed}GB/s, transfer_total={total}MB, #retries=0',
      'Prefill batch, #new-seq: {seq}, #new-token: {token}, #cached-token: {cached}, token usage: 0.02, #running-req: 0, #queue-req: 0, #prealloc-req: 0, #inflight-req: 1, cuda graph: False, input throughput (token/s): {throughput}',
      'INFO:        10.25.110.35:58620 - "POST /v1/chat/completions HTTP/1.1" 200 OK',
    ];
    return Array.from({ length: count }, (_, index) => {
      const seq = start + index;
      const time = new Date(base.getTime() + seq * 1000);
      const stamp = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())} ${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
      const lane = seq % 8;
      const rid = `${podName.replace(/[^a-z0-9]/gi, '').slice(0, 8)}${String(seq).padStart(4, '0')}`;
      const line = templates[seq % templates.length]
        .replace(/\{lane\}/g, String(lane))
        .replace('{rid}', rid)
        .replace('{room}', String(4783591193743515556 + seq * 97))
        .replace('{input}', String(71750 + seq * 141))
        .replace(/\{boot\}/g, (44 + (seq % 70)).toFixed(0))
        .replace('{queue}', (2.8 + (seq % 9) * 0.31).toFixed(2))
        .replace('{forward}', (508 + (seq % 13) * 5.17).toFixed(2))
        .replace('{speed}', (2.7 + (seq % 11) * 0.13).toFixed(2))
        .replace('{total}', (355 + (seq % 8) * 42.91).toFixed(2))
        .replace('{seq}', String(1 + (seq % 3)))
        .replace('{token}', String(768 + (seq % 12) * 2304))
        .replace('{cached}', String(33408 + (seq % 9) * 1564))
        .replace('{throughput}', (159.98 + (seq % 17) * 612.31).toFixed(2));
      return `[${stamp}] ${line}`;
    });
  };
  const handleDeployLog = (item: DeployServiceItem, logId: number, podName?: string) => {
    const logName = item.modelInfo.logs.find((log) => log.id === logId)?.name || '运行日志';
    const resolvedPodName = podName || logName.replace(/\s*日志$/, '').replace(/\s+/g, '-') || `${item.name}-pod-0`;
    setDeployLogModal({
      podName: resolvedPodName,
      namespace: 'default',
      follow: true,
      lines: createDeployPodLogLines(resolvedPodName, 0, 113),
    });
  };
  useEffect(() => {
    if (!deployLogModal) return undefined;
    const timer = window.setInterval(() => {
      setDeployLogModal((prev) => prev ? {
        ...prev,
        lines: [...prev.lines, ...createDeployPodLogLines(prev.podName, prev.lines.length, 2)].slice(-180),
      } : prev);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [deployLogModal?.podName]);
  useEffect(() => {
    if (!deployLogModal?.follow || !deployLogBodyRef.current) return;
    deployLogBodyRef.current.scrollTop = deployLogBodyRef.current.scrollHeight;
  }, [deployLogModal?.lines.length, deployLogModal?.follow]);
  const [scalePdOpen, setScalePdOpen] = useState(false);
  const [scalePdTarget, setScalePdTarget] = useState<DeployServiceItem | null>(null);

  const [scalePdRouterCount, setScalePdRouterCount] = useState(1);
  const [scalePdRouterNodes, setScalePdRouterNodes] = useState<string[]>([]);
  const [scalePdPrefillCount, setScalePdPrefillCount] = useState(1);
  const [scalePdPrefillNodes, setScalePdPrefillNodes] = useState<string[]>([]);
  const [scalePdDecodeCount, setScalePdDecodeCount] = useState(1);
  const [scalePdDecodeNodes, setScalePdDecodeNodes] = useState<string[]>([]);
  const [scaleNodePickerOpen, setScaleNodePickerOpen] = useState(false);
  const [scaleNodePickerMode, setScaleNodePickerMode] = useState<'router' | 'prefill' | 'decode'>('router');
  const [scaleNodePickerSelected, setScaleNodePickerSelected] = useState<string[]>([]);
  const [pdTemplateUploadOpen, setPdTemplateUploadOpen] = useState(false);
  const [pdTemplateUploadTarget, setPdTemplateUploadTarget] = useState<'deploy' | 'add-instance'>('deploy');

  const pdRouterFileInputRef = useRef<HTMLInputElement>(null);
  const pdPrefillFileInputRef = useRef<HTMLInputElement>(null);
  const pdDecodeFileInputRef = useRef<HTMLInputElement>(null);

  const addInstRouterFileInputRef = useRef<HTMLInputElement>(null);
  const addInstPrefillFileInputRef = useRef<HTMLInputElement>(null);
  const addInstDecodeFileInputRef = useRef<HTMLInputElement>(null);

  const getScalePdCurrentCounts = (item: DeployServiceItem | null) => {
    const detailCount = Math.max(1, item?.modelInfo.number || 1);
    return {
      router: 1,
      prefill: item?.deployMode === 'PD 分离' ? Math.max(1, detailCount * 2) : detailCount,
      decode: 1,
    };
  };
  const getScalePdNextCount = (role: 'router' | 'prefill' | 'decode') => (
    role === 'router' ? scalePdRouterCount : role === 'prefill' ? scalePdPrefillCount : scalePdDecodeCount
  );
  const getScalePdSelectedNodes = (role: 'router' | 'prefill' | 'decode') => (
    role === 'router' ? scalePdRouterNodes : role === 'prefill' ? scalePdPrefillNodes : scalePdDecodeNodes
  );
  const setScalePdSelectedNodes = (role: 'router' | 'prefill' | 'decode', nodes: string[]) => {
    if (role === 'router') setScalePdRouterNodes(nodes);
    else if (role === 'prefill') setScalePdPrefillNodes(nodes);
    else setScalePdDecodeNodes(nodes);
  };
  const getScalePdNodeRequired = (role: 'router' | 'prefill' | 'decode') => {
    const current = getScalePdCurrentCounts(scalePdTarget)[role];
    return Math.max(0, getScalePdNextCount(role) - current);
  };
  const updateScalePdCount = (role: 'router' | 'prefill' | 'decode', value: number | null) => {
    const nextValue = Math.max(0, Math.round(value ?? 0));
    const current = getScalePdCurrentCounts(scalePdTarget)[role];
    const required = Math.max(0, nextValue - current);
    if (role === 'router') {
      setScalePdRouterCount(nextValue);
      setScalePdRouterNodes((prev) => prev.slice(0, required));
    } else if (role === 'prefill') {
      setScalePdPrefillCount(nextValue);
      setScalePdPrefillNodes((prev) => prev.slice(0, required));
    } else {
      setScalePdDecodeCount(nextValue);
      setScalePdDecodeNodes((prev) => prev.slice(0, required));
    }
  };
  const openScaleNodePicker = (role: 'router' | 'prefill' | 'decode') => {
    const required = getScalePdNodeRequired(role);
    if (required <= 0) return;
    setScaleNodePickerMode(role);
    setScaleNodePickerSelected(getScalePdSelectedNodes(role).slice(0, required));
    setScaleNodePickerOpen(true);
  };
  const renderScaleRoleRow = (
    role: 'router' | 'prefill' | 'decode',
    label: string,
    badge: string,
    count: number,
  ) => {
    const current = getScalePdCurrentCounts(scalePdTarget)[role];
    const required = Math.max(0, count - current);
    const selectedNodes = getScalePdSelectedNodes(role);
    return (
      <div className="ataas-scale-role-row">
        <div className="ataas-scale-role-main">
          <span className={'ataas-scale-role-badge role-' + badge.toLowerCase()}>{badge}</span>
          <strong>{label}</strong>
          <span>当前</span>
          <em>{current}/{current}</em>
        </div>
        <div className="ataas-scale-role-controls">
          <span>新值</span>
          <InputNumber
            min={0}
            value={count}
            onChange={(value) => updateScalePdCount(role, value)}
            controls
            className="ataas-scale-count-input"
          />
          <Button
            className="ataas-scale-node-button"
            disabled={required <= 0}
            onClick={() => openScaleNodePicker(role)}
          >
            选择节点 {required > 0 ? `${selectedNodes.length}/${required}` : ''}
          </Button>
        </div>
      </div>
    );
  };

  const handleScalePd = (item: DeployServiceItem) => {
    const current = getScalePdCurrentCounts(item);
    setScalePdTarget(item);
    setScalePdRouterCount(current.router);
    setScalePdRouterNodes([]);
    setScalePdPrefillCount(current.prefill);
    setScalePdPrefillNodes([]);
    setScalePdDecodeCount(current.decode);
    setScalePdDecodeNodes([]);

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
  const [selectedPerformanceTemplateKey, setSelectedPerformanceTemplateKey] = useState<string | undefined>(undefined);
  const [launchCommand, setLaunchCommand] = useState(startupTemplateSeed[0]?.command ?? '');
  const [launchTopology, setLaunchTopology] = useState(startupTemplateSeed[0]?.topology ?? '');
  const [deployParams, setDeployParams] = useState<Array<{ key: string; value: string }>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
    { key: 'tensor_parallel_size', value: '8' },
    { key: 'pipeline_parallel_size', value: '1' },
  ]);
  const [advancedShellText, setAdvancedShellText] = useState(
    '--max_model_len 8192\n--gpu_memory_utilization 0.9\n--tensor_parallel_size 8\n--pipeline_parallel_size 1',
  );
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [singleCardCount, setSingleCardCount] = useState<number>(0);
  const [gpuSelectMode, setGpuSelectMode] = useState<'auto' | 'manual'>('auto');
  const [manualGpuPickerOpen, setManualGpuPickerOpen] = useState(false);
  const [manualGpuSelected, setManualGpuSelected] = useState<string[]>([]);
  const [expandedGpuNodes, setExpandedGpuNodes] = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Reset GPU selection state when leaving deploy page (component stays mounted)
  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
    if (prevTabRef.current === 'deploy' && activeTab !== 'deploy') {
      setManualGpuSelected([]);
      setExpandedGpuNodes({});
      setSingleCardCount(0);
      setGpuSelectMode('auto');
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);
  // Reset GPU selection when switching between single/distributed mode
  useEffect(() => {
    setManualGpuSelected([]);
    setExpandedGpuNodes({});
    setSingleCardCount(0);
    setGpuSelectMode('auto');
  }, [deployMode]);
  const [deployServiceName, setDeployServiceName] = useState('');
  const [deployDescription, setDeployDescription] = useState('');
  const [deployCluster, setDeployCluster] = useState<string | undefined>(undefined);
  const [deployServiceEntry, setDeployServiceEntry] = useState<string | undefined>(undefined);
  const [deployEngine, setDeployEngine] = useState<string | undefined>(undefined);
  const [deployModel, setDeployModel] = useState<string | undefined>(undefined);
  const [strictTemplateDeploy, setStrictTemplateDeploy] = useState(false);
  const [protectedStartupTemplateName, setProtectedStartupTemplateName] = useState('');
  const formatDeployEngineTypeName = (value?: string) => {
    const lower = String(value || '').toLowerCase();
    if (lower === 'vllm') return 'vLLM';
    if (lower === 'sglang') return 'SGLang';
    if (lower === 'ktransformers') return 'KTransformers';
    if (lower === 'ftransformers') return 'FTransformers';
    if (lower === 'transformers') return 'Transformers';
    if (lower === 'llama-box') return 'llama-box';
    if (lower === 'vox-box') return 'vox-box';
    return value || '-';
  };
  const deployEngineRecords = useMemo(() => {
    return engineList
      .filter((engine) => engine.status === 'normal')
      .filter((engine) => {
        if (deployMode !== 'pd-separation') return true;
        return `${engine.engine} ${engine.name}`.toLowerCase().includes('sglang');
      });
  }, [engineList, deployMode]);
  const selectedDeployEngineRecord = deployEngineRecords.find((engine) => engine.key === deployEngine);
  const selectedDeployEngineType = selectedDeployEngineRecord?.engine;
  const deployEngineTypeOptions = useMemo(() => {
    return Array.from(new Set(deployEngineRecords.map((engine) => engine.engine))).map((value) => ({
      value,
      label: formatDeployEngineTypeName(value),
    }));
  }, [deployEngineRecords]);
  const deployEngineVersionOptions = useMemo(() => {
    if (!selectedDeployEngineType) return [];
    return deployEngineRecords
      .filter((engine) => engine.engine === selectedDeployEngineType)
      .map((engine) => ({
        value: engine.key,
        label: `${engine.version} / ${engine.name}`,
      }));
  }, [deployEngineRecords, selectedDeployEngineType]);
  const deployServiceEntryOptions = useMemo(() => {
    const clusterName = clusters.find((cluster) => cluster.key === deployCluster)?.name || deployCluster;
    const systemOption = deployCluster
      ? [{
        value: `${deployCluster}-system-se`,
        label: `系统 SE / ${clusterName}`,
      }]
      : [];
    const commonOptions = [
      { value: 'glm-5.1-se', label: 'glm-5.1 生产链路' },
      { value: 'deepseek-r1-se', label: 'deepseek-r1 生产链路' },
      { value: 'custom-business-se', label: '业务自定义 SE' },
    ];
    return [...systemOption, ...commonOptions];
  }, [deployCluster]);
  const selectDeployCluster = (value?: string) => {
    setDeployCluster(value);
    setDeployServiceEntry(value ? `${value}-system-se` : undefined);
  };
  useEffect(() => {
    if (deployEngine && !deployEngineRecords.some((engine) => engine.key === deployEngine)) {
      setDeployEngine(undefined);
    }
  }, [deployEngine, deployEngineRecords]);
  useEffect(() => {
    if (!deployCluster) {
      if (deployServiceEntry) setDeployServiceEntry(undefined);
      return;
    }
    if (!deployServiceEntry || !deployServiceEntryOptions.some((option) => option.value === deployServiceEntry)) {
      setDeployServiceEntry(`${deployCluster}-system-se`);
    }
  }, [deployCluster, deployServiceEntry, deployServiceEntryOptions]);
  const [pdTemplateMode, setPdTemplateMode] = useState<'select' | 'upload'>('select');
  const [pdSelectedTemplateKey, setPdSelectedTemplateKey] = useState<string>('');
  const [pdRouterParamMode, setPdRouterParamMode] = useState<'template' | 'manual'>('template');
  const [pdPrefillParamMode, setPdPrefillParamMode] = useState<'template' | 'manual'>('template');

  const [pdRouterCount, setPdRouterCount] = useState(1);
  const [pdRouterNodes, setPdRouterNodes] = useState<string[]>([]);
  const [pdRouterTemplateKey, setPdRouterTemplateKey] = useState<string>('');
  const [pdRouterParams, setPdRouterParams] = useState<Array<{key: string; value: string}>>([]);
  const [pdRouterShellText, setPdRouterShellText] = useState('--host 0.0.0.0\n--port 30000');

  const [pdPrefillCount, setPdPrefillCount] = useState(1);
  const [pdPrefillNodes, setPdPrefillNodes] = useState<string[]>([]);
  const [pdPrefillCardCount, setPdPrefillCardCount] = useState(0);
  const [pdPrefillTemplateKey, setPdPrefillTemplateKey] = useState<string>('');
  const [pdPrefillParams, setPdPrefillParams] = useState<Array<{key: string; value: string}>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
  ]);
  const [pdPrefillShellText, setPdPrefillShellText] = useState('--max_model_len 8192\n--gpu_memory_utilization 0.9');

  const [pdDecodeCount, setPdDecodeCount] = useState(1);
  const [pdDecodeNodes, setPdDecodeNodes] = useState<string[]>([]);
  const [pdDecodeCardCount, setPdDecodeCardCount] = useState(0);
  const [pdDecodeTemplateKey, setPdDecodeTemplateKey] = useState<string>('');
  const [pdDecodeParams, setPdDecodeParams] = useState<Array<{key: string; value: string}>>([
    { key: 'max_model_len', value: '8192' },
    { key: 'gpu_memory_utilization', value: '0.9' },
  ]);
  const [pdDecodeShellText, setPdDecodeShellText] = useState('--max_model_len 8192\n--gpu_memory_utilization 0.9');
  const [pdShellExpanded, setPdShellExpanded] = useState<Record<'router' | 'prefill' | 'decode', boolean>>({ router: false, prefill: false, decode: false });
  type ConfigYamlPickerTarget = 'deploy-router' | 'deploy-worker' | 'startup-template' | 'custom';
  const [configYamlPickerOpen, setConfigYamlPickerOpen] = useState(false);
  const [configYamlPickerTarget, setConfigYamlPickerTarget] = useState<ConfigYamlPickerTarget>('deploy-router');
  const [configYamlPickerReadonly, setConfigYamlPickerReadonly] = useState(false);
  const [configYamlCustomSelect, setConfigYamlCustomSelect] = useState<((yaml: string, path: string) => void) | null>(null);
  const [configYamlTree, setConfigYamlTree] = useState<ConfigTreeNode | null>(null);
  const [configYamlSelectedPath, setConfigYamlSelectedPath] = useState('');
  const [configYamlPreview, setConfigYamlPreview] = useState('');
  const [configYamlLatest, setConfigYamlLatest] = useState('');
  const [configYamlHistory, setConfigYamlHistory] = useState<ConfigCommitEntry[]>([]);
  const [configYamlVersionKey, setConfigYamlVersionKey] = useState('latest');
  const [configYamlPickerLoading, setConfigYamlPickerLoading] = useState(false);

  const [pdNodePickerOpen, setPdNodePickerOpen] = useState(false);
  const [pdNodePickerMode, setPdNodePickerMode] = useState<'router' | 'prefill' | 'decode'>('router');
  const [pdNodePickerSelected, setPdNodePickerSelected] = useState<string[]>([]);
  const [pdNodeGpuFilter, setPdNodeGpuFilter] = useState<string>('all');
  const [pdNodeSearch, setPdNodeSearch] = useState('');
  const [pdRouterUploadedYaml, setPdRouterUploadedYaml] = useState<string>('');
  const [pdPrefillUploadedYaml, setPdPrefillUploadedYaml] = useState<string>('');

  const getPdNodeOccupiedByOtherMode = (nodeKey: string, mode: 'router' | 'prefill' | 'decode' = pdNodePickerMode) => {
    if (mode === 'prefill' && pdDecodeNodes.includes(nodeKey)) return 'Decode';
    if (mode === 'decode' && pdPrefillNodes.includes(nodeKey)) return 'Prefill';
    return '';
  };

  const getPdNodeSelectedRoles = (nodeKey: string) => {
    const roles: Array<'Router' | 'Prefill' | 'Decode'> = [];
    const routerNodes = pdNodePickerMode === 'router' ? pdNodePickerSelected : pdRouterNodes;
    const prefillNodes = pdNodePickerMode === 'prefill' ? pdNodePickerSelected : pdPrefillNodes;
    const decodeNodes = pdNodePickerMode === 'decode' ? pdNodePickerSelected : pdDecodeNodes;
    if (routerNodes.includes(nodeKey)) roles.push('Router');
    if (prefillNodes.includes(nodeKey)) roles.push('Prefill');
    if (decodeNodes.includes(nodeKey)) roles.push('Decode');
    return roles;
  };

  const getDefaultPdCardCount = (nodeKeys: string[]) => {
    const minCards = nodeKeys.length > 0 ? Math.min(...nodeKeys.map((key) => deployNodes.find((node) => node.key === key)?.availableCards ?? 0)) : 0;
    if (minCards >= 8) return 8;
    if (minCards >= 4) return 4;
    if (minCards >= 2) return 2;
    if (minCards >= 1) return 1;
    return 0;
  };

  const [addInstanceModalOpen, setAddInstanceModalOpen] = useState(false);
  const [addInstCluster, setAddInstCluster] = useState<string | undefined>(undefined);
  const [addInstPerformanceTemplateKey, setAddInstPerformanceTemplateKey] = useState<string | undefined>(undefined);
  const [addInstCardCount, setAddInstCardCount] = useState<number>(0);
  const [addInstGpuSelectMode, setAddInstGpuSelectMode] = useState<'auto' | 'manual'>('auto');
  const [addInstManualGpuPickerOpen, setAddInstManualGpuPickerOpen] = useState(false);
  const [addInstManualGpuSelected, setAddInstManualGpuSelected] = useState<string[]>([]);
  const [gatewayGroupTraffic, setGatewayGroupTraffic] = useState<Array<{groupKey: string; percent: number}>>([]);
  const [addInstRouterParamMode, setAddInstRouterParamMode] = useState<'template' | 'manual'>('template');
  const [addInstPrefillParamMode, setAddInstPrefillParamMode] = useState<'template' | 'manual'>('template');
  const [addInstDecodeParamMode, setAddInstDecodeParamMode] = useState<'template' | 'manual'>('template');
  const [addInstRouterCount, setAddInstRouterCount] = useState(1);
  const [addInstPrefillCount, setAddInstPrefillCount] = useState(1);
  const [addInstDecodeCount, setAddInstDecodeCount] = useState(1);
  const [addInstRouterNodes, setAddInstRouterNodes] = useState<string[]>([]);
  const [addInstPrefillNodes, setAddInstPrefillNodes] = useState<string[]>([]);
  const [addInstDecodeNodes, setAddInstDecodeNodes] = useState<string[]>([]);
  const [addInstPrefillCardCount, setAddInstPrefillCardCount] = useState(0);
  const [addInstDecodeCardCount, setAddInstDecodeCardCount] = useState(0);
  const [addInstRouterTemplateKey, setAddInstRouterTemplateKey] = useState<string>('');
  const [addInstPrefillTemplateKey, setAddInstPrefillTemplateKey] = useState<string>('');
  const [addInstDecodeTemplateKey, setAddInstDecodeTemplateKey] = useState<string>('');
  const [addInstRouterParams, setAddInstRouterParams] = useState<Array<{key: string; value: string}>>([]);
  const [addInstPrefillParams, setAddInstPrefillParams] = useState<Array<{key: string; value: string}>>([]);
  const [addInstDecodeParams, setAddInstDecodeParams] = useState<Array<{key: string; value: string}>>([]);
  const [addInstRouterShellText, setAddInstRouterShellText] = useState('');
  const [addInstPrefillShellText, setAddInstPrefillShellText] = useState('');
  const [addInstDecodeShellText, setAddInstDecodeShellText] = useState('');
  const [addInstRouterUploadedYaml, setAddInstRouterUploadedYaml] = useState<string>('');
  const [addInstPrefillUploadedYaml, setAddInstPrefillUploadedYaml] = useState<string>('');
  const [addInstDecodeUploadedYaml, setAddInstDecodeUploadedYaml] = useState<string>('');
  const [addInstRouterYamlFileName, setAddInstRouterYamlFileName] = useState('');
  const [addInstWorkerYamlFileName, setAddInstWorkerYamlFileName] = useState('');
  const closeAddInstanceModal = () => {
    setAddInstanceModalOpen(false);
    if (!deployDetailModalOpen) setDeployDetailItem(null);
  };
  const [addInstNodePickerOpen, setAddInstNodePickerOpen] = useState(false);
  const [addInstNodePickerMode, setAddInstNodePickerMode] = useState<'router' | 'prefill' | 'decode'>('router');
  const [addInstNodePickerSelected, setAddInstNodePickerSelected] = useState<string[]>([]);
  const [addInstNodeSearch, setAddInstNodeSearch] = useState('');
  const [addInstNodeGpuFilter, setAddInstNodeGpuFilter] = useState<string>('all');

  const getAddInstNodeOccupiedByOtherMode = (nodeKey: string, mode: 'router' | 'prefill' | 'decode' = addInstNodePickerMode) => {
    if (deployDetailItem?.deployMode !== 'PD 分离') return '';
    if (mode === 'prefill' && addInstDecodeNodes.includes(nodeKey)) return 'Decode';
    if (mode === 'decode' && addInstPrefillNodes.includes(nodeKey)) return 'Prefill';
    return '';
  };

  const getAddInstNodePickerLimit = (mode: 'router' | 'prefill' | 'decode' = addInstNodePickerMode) => {
    if (deployDetailItem?.deployMode !== 'PD 分离') return Infinity;
    if (mode === 'router') return addInstRouterCount;
    if (mode === 'prefill') return addInstPrefillCount;
    if (mode === 'decode') return addInstDecodeCount;
    return Infinity;
  };

  const formatDeployParamsShell = (params: Array<{ key: string; value: string }>) => params
    .filter((param) => param.key.trim())
    .map((param) => `--${param.key.trim().replace(/^--/, '')}${param.value.trim() ? ` ${param.value.trim()}` : ''}`)
    .join('\n');

  const singlePerformanceTemplates = useMemo(() => {
    const merged = new Map<string, StartupTemplateRecord>();
    [...buildSingleStartupTemplates(), ...startupTemplates]
      .map((item) => normalizeStartupTemplate(item))
      .filter((item) => item.type === 'single' || item.deployMode === '单机部署')
      .forEach((item) => {
        if (!merged.has(item.key)) merged.set(item.key, item);
      });
    return Array.from(merged.values());
  }, [startupTemplates]);

  const singlePerformanceTemplateOptions = useMemo(() => singlePerformanceTemplates.map((template) => ({
    value: template.key,
    label: template.name,
    template,
  })), [singlePerformanceTemplates]);

  const renderPerformanceTemplateOption = (option: any) => {
    const template = option.data?.template as StartupTemplateRecord | undefined;
    if (!template) return option.label;
    return (
      <div className="ataas-performance-template-option">
        <strong>{template.name}</strong>
        <span>{[template.model || template.modelFamily, template.engine, template.gpu || template.hardware, `${template.cardCount || template.gpuCount || 1} 卡`].filter(Boolean).join(' / ')}</span>
      </div>
    );
  };

  const applySinglePerformanceTemplate = (templateKey?: string, target: 'deploy' | 'add-instance' = 'deploy') => {
    if (!templateKey) {
      if (target === 'deploy') setSelectedPerformanceTemplateKey(undefined);
      else setAddInstPerformanceTemplateKey(undefined);
      return;
    }
    const template = singlePerformanceTemplates.find((item) => item.key === templateKey);
    if (!template) return;
    const parsedParams = parseShellParams(template.command || '');
    const resolvedParams = parsedParams.length > 0
      ? parsedParams
      : (template.params || []).map((param) => ({ ...param }));
    const shellText = template.command || formatDeployParamsShell(resolvedParams);
    const requestedCards = Math.max(1, Number(template.cardCount || template.gpuCount || 1));
    const currentClusterKey = target === 'deploy'
      ? deployCluster
      : clusters.find((cluster) => cluster.name === addInstCluster || cluster.key === addInstCluster)?.key;
    const candidateNodes = deployNodes.filter((node) =>
      node.status === 'ready' &&
      templateMatchesDeployNode(template, node) &&
      node.availableCards >= requestedCards &&
      (!currentClusterKey || node.clusterKey === currentClusterKey)
    );
    const selectedNode = candidateNodes[0] || deployNodes.find((node) =>
      node.status === 'ready' &&
      templateMatchesDeployNode(template, node) &&
      node.availableCards >= requestedCards
    );

    if (target === 'deploy') {
      setSelectedPerformanceTemplateKey(template.key);
      setSelectedStartupTemplateKey(template.key);
      setLaunchConfigMode('template');
      setLaunchCommand(template.command || '');
      setLaunchTopology(template.topology || '');
      setDeployParams(resolvedParams.map((param) => ({ ...param })));
      setAdvancedShellText(shellText);
      setExpandedSections((prev) => ({ ...prev, advanced: true }));
      if (selectedNode) {
        selectDeployCluster(selectedNode.clusterKey);
        setSelectedSingleNode(selectedNode.key);
        setSingleCardCount(Math.min(requestedCards, selectedNode.availableCards));
      } else {
        setSelectedSingleNode(null);
        setSingleCardCount(0);
        message.warning(`无目标节点：当前没有满足「${template.name}」的可用节点`);
      }
      return;
    }

    setAddInstPerformanceTemplateKey(template.key);
    setAddInstRouterTemplateKey(template.key);
    setAddInstRouterParams(resolvedParams.map((param) => ({ ...param })));
    setAddInstRouterShellText(shellText);
    if (selectedNode) {
      const clusterName = clusters.find((cluster) => cluster.key === selectedNode.clusterKey)?.name;
      setAddInstCluster(clusterName || selectedNode.clusterKey);
      setAddInstRouterNodes([selectedNode.key]);
      setAddInstCardCount(Math.min(requestedCards, selectedNode.availableCards));
    } else {
      setAddInstRouterNodes([]);
      setAddInstCardCount(0);
      message.warning(`无目标节点：当前没有满足「${template.name}」的可用节点`);
    }
  };

  const applyStartupTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) return;
    const nextParams = template.params?.map((param) => ({ ...param })) || [];
    setSelectedStartupTemplateKey(template.key);
    setLaunchConfigMode('template');
    setLaunchCommand(template.command);
    setLaunchTopology(template.topology);
    setDeployParams(nextParams);
    setAdvancedShellText(formatDeployParamsShell(nextParams));
  };
  const pdTemplateOptions = startupTemplates
    .filter((item) => item.type === 'pd' || item.deployMode === 'PD 分离')
    .map((item) => ({ value: item.key, label: item.name + ' / ' + item.engine }));

  const getPdTemplateYamlPair = (template: StartupTemplateRecord) => {
    const typedTemplate = template as StartupTemplateRecord & { routerYaml?: string; workerYaml?: string };
    if (typedTemplate.routerYaml || typedTemplate.workerYaml) {
      return { routerYaml: typedTemplate.routerYaml || '', workerYaml: typedTemplate.workerYaml || '' };
    }
    const yaml = template.yamlContent || '';
    const routerMatch = yaml.match(/# Router YAML\n([\s\S]*?)(?:\n# PD Worker YAML\n|$)/);
    const workerMatch = yaml.match(/# PD Worker YAML\n([\s\S]*)$/);
    return {
      routerYaml: (routerMatch?.[1] || yaml).trim(),
      workerYaml: (workerMatch?.[1] || yaml).trim(),
    };
  };
  const getDeployModelName = () => deployModels.find((item) => item.key === deployModel)?.name
    || modelRepoData.find((item) => item.name === deployModel)?.name
    || deployModel
    || '';
  const getDeployEngineName = () => {
    const engine = engineList.find((item) => item.key === deployEngine);
    if (!engine) return deployEngine || 'SGLang';
    const value = engine.engine.toLowerCase();
    if (value.includes('sglang')) return 'SGLang';
    if (value.includes('vllm')) return 'vLLM';
    if (value.includes('tensorrt')) return 'TensorRT-LLM';
    if (value.includes('ktransformers')) return 'KTransformers';
    return engine.engine || engine.name;
  };

  const applyPdTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) {
      setPdSelectedTemplateKey('');
      setPdRouterTemplateKey('');
      setPdPrefillTemplateKey('');
      setPdDecodeTemplateKey('');
      setPdRouterUploadedYaml('');
      setPdPrefillUploadedYaml('');
      return;
    }
    applyPdTemplateRecord(template);
  };

  const applyPdTemplateRecord = (template: StartupTemplateRecord) => {
    const { routerYaml, workerYaml } = getPdTemplateYamlPair(template);
    setPdSelectedTemplateKey(template.key);
    setPdRouterTemplateKey(template.key);
    setPdPrefillTemplateKey(template.key);
    setPdDecodeTemplateKey(template.key);
    setPdRouterUploadedYaml(routerYaml);
    setPdPrefillUploadedYaml(workerYaml);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    const resolvedParams = nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }];
    setPdPrefillParams(resolvedParams.map((param) => ({ ...param })));
    setPdDecodeParams(resolvedParams.map((param) => ({ ...param })));
    setPdRouterShellText(formatDeployParamsShell(resolvedParams));
    setPdPrefillShellText(formatDeployParamsShell(resolvedParams));
    setPdDecodeShellText(formatDeployParamsShell(resolvedParams));
  };

  const openConfigYamlPicker = async (target: ConfigYamlPickerTarget, onSelect?: (yaml: string, path: string) => void) => {
    setConfigYamlPickerTarget(target);
    setConfigYamlPickerReadonly(false);
    setConfigYamlCustomSelect(() => onSelect || null);
    setConfigYamlPickerOpen(true);
    setConfigYamlSelectedPath('');
    setConfigYamlPreview('');
    setConfigYamlLatest('');
    setConfigYamlHistory([]);
    setConfigYamlVersionKey('latest');
    if (configYamlTree) return;
    setConfigYamlPickerLoading(true);
    try {
      const res = await rpc('config.list_tree');
      setConfigYamlTree(res.root);
    } catch {
      message.error('资源文件文件加载失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const openModelOpsYamlPreview = async (item: DeployServiceItem, kind: 'router' | 'worker', path: string) => {
    const cluster = getDeployClusterName(item);
    const resourceName = kind === 'router' ? `${item.name}-router` : `${item.name}-worker`;
    const yaml = [
      'apiVersion: apps/v1',
      'kind: Deployment',
      'metadata:',
      `  name: ${resourceName}`,
      '  namespace: default',
      '  labels:',
      `    app.kubernetes.io/name: ${item.name}`,
      `    app.kubernetes.io/component: ${kind}`,
      `    ataas.io/cluster: ${cluster}`,
      'spec:',
      `  replicas: ${kind === 'router' ? 1 : Math.max(1, item.modelInfo.number)}`,
      '  selector:',
      '    matchLabels:',
      `      app: ${resourceName}`,
      '  template:',
      '    metadata:',
      '      labels:',
      `        app: ${resourceName}`,
      `        ataas.io/model: ${item.modelInfo.name}`,
      '    spec:',
      '      containers:',
      `        - name: ${kind}`,
      `          image: registry.internal/${item.modelInfo.engine.toLowerCase() || 'sglang'}:latest`,
      '          imagePullPolicy: IfNotPresent',
      '          ports:',
      '            - containerPort: 8000',
      '              name: http',
      '          resources:',
      '            limits:',
      '              nvidia.com/gpu: "1"',
    ].join('\n');
    setConfigYamlPickerTarget('custom');
    setConfigYamlPickerReadonly(true);
    setConfigYamlCustomSelect(null);
    setConfigYamlPickerOpen(true);
    setConfigYamlSelectedPath(path);
    setConfigYamlLatest(yaml);
    setConfigYamlPreview(yaml);
    setConfigYamlHistory([]);
    setConfigYamlVersionKey('latest');
    if (configYamlTree) return;
    setConfigYamlPickerLoading(true);
    try {
      const res = await rpc('config.list_tree');
      setConfigYamlTree(res.root);
    } catch {
      message.error('资源文件文件加载失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const selectConfigYamlFile = async (path: string) => {
    setConfigYamlSelectedPath(path);
    setConfigYamlVersionKey('latest');
    setConfigYamlPickerLoading(true);
    try {
      const [fileRes, historyRes] = await Promise.all([
        rpc('config.get', { path }),
        rpc('config.history', { path }),
      ]);
      const latestYaml = fileRes.yaml || '';
      setConfigYamlLatest(latestYaml);
      setConfigYamlPreview(latestYaml);
      setConfigYamlHistory(historyRes.commits || []);
    } catch {
      message.error('YAML 读取失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const previewConfigYamlVersion = async (versionKey: string) => {
    if (!configYamlSelectedPath) return;
    setConfigYamlVersionKey(versionKey);
    if (versionKey === 'latest') {
      setConfigYamlPreview(configYamlLatest);
      return;
    }
    setConfigYamlPickerLoading(true);
    try {
      const res = await rpc('config.show_commit', { path: configYamlSelectedPath, hash: versionKey });
      setConfigYamlPreview(res.yaml || '');
    } catch {
      message.error('历史版本读取失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const formatConfigYamlHistoryTime = (ts?: number) => {
    if (!ts) return '';
    const diffHours = Math.max(1, Math.round((Date.now() - ts) / 3600000));
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.round(diffHours / 24)}d ago`;
  };

  const applyConfigYamlSelection = async () => {
    const selectedYaml = configYamlLatest || configYamlPreview;
    if (!configYamlSelectedPath || !selectedYaml.trim()) return;
    if (configYamlPickerReadonly) {
      setConfigYamlPickerOpen(false);
      setConfigYamlPickerReadonly(false);
      return;
    }
    if (configYamlLatest && selectedYaml.trim()) {
      try {
        await rpc('config.commit', {
          writes: [{ path: configYamlSelectedPath, yaml: selectedYaml }],
          message: 'update from selector',
        });
        try {
          const drafts = JSON.parse(sessionStorage.getItem('b300.configs.drafts') || '{}');
          drafts[configYamlSelectedPath] = { base: selectedYaml, draft: selectedYaml, deleted: false };
          sessionStorage.setItem('b300.configs.drafts', JSON.stringify(drafts));
        } catch {
          // ignore session sync failures
        }
        const [treeRes, historyRes] = await Promise.all([
          rpc('config.list_tree'),
          rpc('config.history', { path: configYamlSelectedPath }),
        ]);
        setConfigYamlTree(treeRes.root);
        setConfigYamlHistory(historyRes.commits || []);
      } catch {
        message.error('同步资源文件失败');
        return;
      }
    }
    if (configYamlPickerTarget === 'custom') {
      configYamlCustomSelect?.(selectedYaml, configYamlSelectedPath);
      setConfigYamlPickerOpen(false);
      setConfigYamlCustomSelect(null);
      message.success(`已从资源文件选择 ${configYamlSelectedPath}`);
      return;
    }
    if (configYamlPickerTarget === 'deploy-router') {
      setPdTemplateMode('upload');
      setPdSelectedTemplateKey('');
      setPdRouterTemplateKey('');
      setPdRouterUploadedYaml(selectedYaml);
      setPdRouterShellText(selectedYaml);
      setPdRouterParams(parseShellParams(selectedYaml));
      setPdShellExpanded((prev) => ({ ...prev, router: true }));
    } else if (configYamlPickerTarget === 'deploy-worker') {
      const nextParams = parseShellParams(selectedYaml);
      setPdTemplateMode('upload');
      setPdSelectedTemplateKey('');
      setPdPrefillTemplateKey('');
      setPdDecodeTemplateKey('');
      setPdPrefillUploadedYaml(selectedYaml);
      setPdPrefillShellText(selectedYaml);
      setPdDecodeShellText(selectedYaml);
      setPdPrefillParams(nextParams);
      setPdDecodeParams(nextParams.map((param) => ({ ...param })));
      setPdShellExpanded((prev) => ({ ...prev, prefill: true }));
    } else {
      setTemplateYamlContent(selectedYaml);
    }
    setConfigYamlPickerOpen(false);
    setConfigYamlCustomSelect(null);
    message.success(`已从资源文件选择 ${configYamlSelectedPath}`);
  };

  const applyPdRouterTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setPdRouterTemplateKey(''); return; }
    setPdRouterTemplateKey(template.key);
  };
  const applyPdPrefillTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) {
      setPdPrefillTemplateKey('');
      setPdDecodeTemplateKey('');
      setPdPrefillParams([{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }]);
      setPdDecodeParams([{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }]);
      return;
    }
    setPdPrefillTemplateKey(template.key);
    setPdDecodeTemplateKey(template.key);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    const resolvedParams = nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }];
    setPdPrefillParams(resolvedParams.map((param) => ({ ...param })));
    setPdDecodeParams(resolvedParams.map((param) => ({ ...param })));
  };
  const applyAddInstRouterTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setAddInstRouterTemplateKey(''); return; }
    setAddInstRouterTemplateKey(template.key);
  };
  const applyAddInstPrefillTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setAddInstPrefillTemplateKey(''); return; }
    setAddInstPrefillTemplateKey(template.key);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    const resolvedParams = nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }];
    setAddInstPrefillParams(resolvedParams);
    setAddInstPrefillShellText(formatDeployParamsShell(resolvedParams));
  };
  const applyAddInstDecodeTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) { setAddInstDecodeTemplateKey(''); return; }
    setAddInstDecodeTemplateKey(template.key);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    const resolvedParams = nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }];
    setAddInstDecodeParams(resolvedParams);
    setAddInstDecodeShellText(formatDeployParamsShell(resolvedParams));
  };
  const applyAddInstPdTemplate = (templateKey: string) => {
    const template = startupTemplates.find((item) => item.key === templateKey);
    if (!template) {
      setAddInstRouterTemplateKey('');
      setAddInstPrefillTemplateKey('');
      setAddInstDecodeTemplateKey('');
      setAddInstRouterUploadedYaml('');
      setAddInstPrefillUploadedYaml('');
      setAddInstDecodeUploadedYaml('');
      return;
    }
    const { routerYaml, workerYaml } = getPdTemplateYamlPair(template);
    const nextParams = (template.params || []).map((param) => ({ ...param }));
    const resolvedParams = nextParams.length > 0 ? nextParams : [{ key: 'max_model_len', value: '8192' }, { key: 'gpu_memory_utilization', value: '0.9' }];
    const workerShellText = workerYaml || formatDeployParamsShell(resolvedParams);
    setAddInstRouterTemplateKey(template.key);
    setAddInstPrefillTemplateKey(template.key);
    setAddInstDecodeTemplateKey(template.key);
    setAddInstRouterUploadedYaml(routerYaml);
    setAddInstPrefillUploadedYaml(workerYaml);
    setAddInstDecodeUploadedYaml(workerYaml);
    setAddInstRouterParams(resolvedParams.map((param) => ({ ...param })));
    setAddInstPrefillParams(resolvedParams.map((param) => ({ ...param })));
    setAddInstDecodeParams(resolvedParams.map((param) => ({ ...param })));
    setAddInstRouterShellText(routerYaml || formatDeployParamsShell(resolvedParams));
    setAddInstPrefillShellText(workerShellText);
    setAddInstDecodeShellText(workerShellText);
  };
  const openDeployPdTemplateCreate = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const suffix = `${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    const currentModel = getDeployModelName();
    addInstPdTemplateForm.setFieldsValue({
      name: `${currentModel || 'model'}-PD模板-${suffix}`,
      model: currentModel,
      engine: getDeployEngineName(),
      gpu: '',
      description: '由创建模型服务上传生成',
      routerYaml: '',
      workerYaml: '',
    });
    setAddInstRouterYamlFileName('');
    setAddInstWorkerYamlFileName('');
    setPdTemplateUploadTarget('deploy');
    setPdTemplateUploadOpen(true);
  };
  const openAddInstPdTemplateCreate = () => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const suffix = `${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}`;
    const currentModel = deployDetailItem?.modelInfo.name || deployDetailItem?.typeStr || '';
    const currentEngine = deployDetailItem?.modelInfo.engine || 'SGLang';
    addInstPdTemplateForm.setFieldsValue({
      name: `${deployDetailItem?.name || currentModel || 'model'}-PD模板-${suffix}`,
      model: currentModel,
      engine: currentEngine,
      gpu: '',
      description: '由添加实例上传生成',
      routerYaml: '',
      workerYaml: '',
    });
    setAddInstRouterYamlFileName('');
    setAddInstWorkerYamlFileName('');
    setPdTemplateUploadTarget('add-instance');
    setPdTemplateUploadOpen(true);
  };
  const createUploadedPdTemplate = () => {
    const values = addInstPdTemplateForm.getFieldsValue();
    if (!values.name) {
      message.warning('请填写模板名称');
      return;
    }
    if (!values.routerYaml || !values.workerYaml) {
      message.warning('请上传或粘贴 Router YAML 和 PD Worker YAML');
      return;
    }
    const nextParams = parseShellParams(values.workerYaml);
    const resolvedParams = nextParams.length > 0 ? nextParams : parseShellParams(values.routerYaml);
    const next: StartupTemplateRecord = {
      key: `tpl-custom-pd-${Date.now()}`,
      name: values.name,
      type: 'pd',
      source: 'custom',
      model: values.model || deployDetailItem?.modelInfo.name || values.name,
      modelFamily: (values.model || deployDetailItem?.modelInfo.name || values.name).split('-')[0] || values.name,
      description: values.description || values.name,
      scenario: values.description || values.name,
      gpu: values.gpu || '-',
      gpuCount: 1,
      hardware: values.gpu ? (inferChipVendor(values.gpu) === 'NVIDIA' ? `NVIDIA ${values.gpu}` : values.gpu) : '-',
      engine: values.engine || 'SGLang',
      quantization: 'FP8',
      deployMode: 'PD 分离',
      nodeCount: 2,
      cardCount: 1,
      topology: 'PD 分离',
      command: '',
      yamlContent: `# Router YAML\n${values.routerYaml}\n\n# PD Worker YAML\n${values.workerYaml}`,
      params: resolvedParams,
      env: {},
      benchmark: [],
      sceneTags: [],
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    (next as StartupTemplateRecord & { routerYaml?: string; workerYaml?: string }).routerYaml = values.routerYaml;
    (next as StartupTemplateRecord & { routerYaml?: string; workerYaml?: string }).workerYaml = values.workerYaml;
    setStartupTemplates((prev) => [next, ...prev]);
    if (pdTemplateUploadTarget === 'deploy') {
      setPdSelectedTemplateKey(next.key);
      setPdRouterTemplateKey(next.key);
      setPdPrefillTemplateKey(next.key);
      setPdDecodeTemplateKey(next.key);
      setPdRouterUploadedYaml(values.routerYaml);
      setPdPrefillUploadedYaml(values.workerYaml);
      setPdRouterShellText(values.routerYaml);
      setPdPrefillShellText(values.workerYaml);
      setPdDecodeShellText(values.workerYaml);
      setPdRouterParams(parseShellParams(values.routerYaml));
      setPdPrefillParams(resolvedParams.map((param) => ({ ...param })));
      setPdDecodeParams(resolvedParams.map((param) => ({ ...param })));
    } else {
      setAddInstRouterTemplateKey(next.key);
      setAddInstPrefillTemplateKey(next.key);
      setAddInstDecodeTemplateKey(next.key);
      setAddInstRouterUploadedYaml(values.routerYaml);
      setAddInstPrefillUploadedYaml(values.workerYaml);
      setAddInstDecodeUploadedYaml(values.workerYaml);
      setAddInstRouterShellText(values.routerYaml);
      setAddInstPrefillShellText(values.workerYaml);
      setAddInstDecodeShellText(values.workerYaml);
      setAddInstRouterParams(parseShellParams(values.routerYaml));
      setAddInstPrefillParams(resolvedParams.map((param) => ({ ...param })));
      setAddInstDecodeParams(resolvedParams.map((param) => ({ ...param })));
    }
    setPdTemplateUploadOpen(false);
    message.success(pdTemplateUploadTarget === 'deploy' ? 'PD 模板已创建并应用到当前模型服务' : 'PD 模板已创建并应用到当前实例');
  };
  const resetAddInstanceForm = () => {
    setAddInstCluster(undefined);
    setAddInstPerformanceTemplateKey(undefined);
    setAddInstCardCount(0);
    setAddInstGpuSelectMode('auto');
    setAddInstManualGpuSelected([]);
    setAddInstRouterParamMode('template');
    setAddInstPrefillParamMode('template');
    setAddInstDecodeParamMode('template');
    setAddInstRouterCount(1);
    setAddInstPrefillCount(1);
    setAddInstDecodeCount(1);
    setAddInstRouterNodes([]);
    setAddInstPrefillNodes([]);
    setAddInstDecodeNodes([]);
    setAddInstPrefillCardCount(0);
    setAddInstDecodeCardCount(0);
    setAddInstRouterTemplateKey('');
    setAddInstPrefillTemplateKey('');
    setAddInstDecodeTemplateKey('');
    setAddInstRouterParams([]);
    setAddInstPrefillParams([]);
    setAddInstDecodeParams([]);
    setAddInstRouterShellText('');
    setAddInstPrefillShellText('');
    setAddInstDecodeShellText('');
    setAddInstRouterUploadedYaml('');
    setAddInstPrefillUploadedYaml('');
    setAddInstDecodeUploadedYaml('');
  };
  const getDeployDetailClusterName = (item: DeployServiceItem | null) => {
    if (!item) return undefined;
    const text = `${item.name} ${item.modelInfo.works} ${item.typeStr}`.toLowerCase();
    if (text.includes('h20') || text.includes('qwen')) return 'shanghai-online';
    if (text.includes('gz-') || text.includes('l20') || text.includes('glm')) return 'guangzhou-test';
    if (text.includes('910b') || text.includes('kimi')) return 'wuhan-kunpeng';
    return 'beijing-prod';
  };
  const getDeployDetailInstanceGpuCount = (item: DeployServiceItem) => {
    if (item.deployMode === '分布式部署') return '4 卡';
    return '1 卡';
  };
  const openAddInstanceModal = (targetItem = deployDetailItem) => {
    resetAddInstanceForm();
    const defaultShell = advancedShellText || formatDeployParamsShell(deployParams);
    const defaultParams = parseShellParams(defaultShell);
    setAddInstRouterShellText(defaultShell);
    setAddInstPrefillShellText(defaultShell);
    setAddInstDecodeShellText(defaultShell);
    setAddInstRouterParams(defaultParams);
    setAddInstPrefillParams(defaultParams.map((param) => ({ ...param })));
    setAddInstDecodeParams(defaultParams.map((param) => ({ ...param })));
    setAddInstCluster(getDeployDetailClusterName(targetItem));
    if (targetItem?.deployMode === 'PD 分离') {
      setAddInstCluster(getDeployDetailClusterName(targetItem));
    }
    if (targetItem?.deployMode === '单机部署') {
      const defaultNode = deployNodes.find((node) => node.status === 'ready');
      if (defaultNode) {
        setAddInstRouterNodes([defaultNode.key]);
        setAddInstCardCount(Math.min(4, defaultNode.availableCards));
      }
    } else if (targetItem?.deployMode === '分布式部署') {
      const defaultNodes = deployNodes.filter((node) => node.status === 'ready').slice(0, 2);
      setAddInstRouterNodes(defaultNodes.map((node) => node.key));
      const minCards = defaultNodes.length ? Math.min(...defaultNodes.map((node) => node.availableCards)) : 0;
      setAddInstCardCount(Math.min(4, minCards));
    }
    setAddInstanceModalOpen(true);
  };
  const handleDeployAddInstance = (item: DeployServiceItem) => {
    setDeployDetailItem(item);
    setDeployDetailModalOpen(false);
    setDeployDetailExtraNodes([]);
    const works = item.modelInfo.works?.split(',').map((w: string) => w.trim()).filter(Boolean) || [];
    const count = works.length > 0 ? works.length : (item.modelInfo.number || 1);
    resetGatewayTrafficByCount(count);
    openAddInstanceModal(item);
  };
  const isAddInstanceNodesReady = !deployDetailItem
    ? false
    : deployDetailItem.deployMode === 'PD 分离'
      ? Boolean(addInstCluster && addInstRouterNodes.length > 0 && addInstPrefillNodes.length > 0 && addInstDecodeNodes.length > 0)
      : Boolean(addInstCluster && addInstRouterNodes.length > 0);
  const isAddInstanceSubmitDisabled = !isAddInstanceNodesReady;
  const handleAddInstanceConfirm = () => {
    if (!addInstCluster) {
      message.warning('请选择部署集群');
      return;
    }
    if (deployDetailItem?.deployMode === 'PD 分离') {
      if (addInstRouterNodes.length === 0) {
        message.warning('请选择 Router 节点');
        return;
      }
      if (addInstPrefillNodes.length === 0) {
        message.warning('请选择 Prefill 节点');
        return;
      }
      if (addInstDecodeNodes.length === 0) {
        message.warning('请选择 Decode 节点');
        return;
      }
    } else if (addInstRouterNodes.length === 0) {
      message.warning('请选择部署节点');
      return;
    }
    const firstNodeName = addInstRouterNodes.length > 0
      ? (deployNodes.find((n) => n.key === addInstRouterNodes[0])?.name || '节点')
      : '节点';
    const nextTotal = (deployDetailItem?.modelInfo.number ?? 1) + 1;
    setDeployDetailExtraNodes([...deployDetailExtraNodes, {
      node: firstNodeName,
      routerNodes: [...addInstRouterNodes],
      prefillNodes: [...addInstPrefillNodes],
      decodeNodes: [...addInstDecodeNodes],
    }]);
    if (deployDetailItem) {
      const nextItem = { ...deployDetailItem, modelInfo: { ...deployDetailItem.modelInfo, number: nextTotal } };
      setDeployDetailItem(nextItem);
      setDeployServices((prev) => prev.map((item) => item.id === deployDetailItem.id ? nextItem : item));
    }
    resetGatewayTrafficByCount(nextTotal);
    setAddInstanceModalOpen(false);
    if (!deployDetailModalOpen) setDeployDetailItem(null);
    resetAddInstanceForm();
  };
  const ensureAddInstanceShellText = (part: 'router' | 'prefill' | 'decode') => {
    const defaultShell = advancedShellText || formatDeployParamsShell(deployParams);
    const defaultParams = parseShellParams(defaultShell);
    if (part === 'router' && !addInstRouterShellText.trim()) {
      setAddInstRouterShellText(defaultShell);
      setAddInstRouterParams(defaultParams);
    }
    if (part === 'prefill' && !addInstPrefillShellText.trim()) {
      setAddInstPrefillShellText(defaultShell);
      setAddInstPrefillParams(defaultParams.map((param) => ({ ...param })));
    }
    if (part === 'decode' && !addInstDecodeShellText.trim()) {
      setAddInstDecodeShellText(defaultShell);
      setAddInstDecodeParams(defaultParams.map((param) => ({ ...param })));
    }
  };
  const resetDeployForm = () => {
    setDeployServiceName('');
    setDeployDescription('');
    setDeployCluster(undefined);
    setDeployServiceEntry(undefined);
    setDeployEngine(undefined);
    setDeployModel(undefined);
    setStrictTemplateDeploy(false);
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
    setSelectedPerformanceTemplateKey(undefined);
    setSingleCardCount(0);
    setSelectedDeployNodes([]);
    setLaunchConfigMode('template');
    setSelectedStartupTemplateKey(startupTemplateSeed[0]?.key ?? '');
    setLaunchCommand(startupTemplateSeed[0]?.command ?? '');
    setLaunchTopology(startupTemplateSeed[0]?.topology ?? '');
    setDeployMachineCount(4);
    const nextDeployParams = (startupTemplateSeed[0]?.params ?? [
      { key: 'max_model_len', value: '8192' },
      { key: 'gpu_memory_utilization', value: '0.9' },
      { key: 'tensor_parallel_size', value: '8' },
      { key: 'pipeline_parallel_size', value: '1' },
    ]).map((param) => ({ ...param }));
    setDeployParams(nextDeployParams);
    setAdvancedShellText(formatDeployParamsShell(nextDeployParams));
    setExpandedSections({});
    setPdTemplateMode('select');
    setPdSelectedTemplateKey('');
    setPdRouterCount(1);
    setPdRouterNodes([]);
    setPdRouterTemplateKey('');
    setPdRouterShellText('--host 0.0.0.0\n--port 30000');
    setPdPrefillCount(1);
    setPdPrefillNodes([]);
    setPdPrefillCardCount(0);
    setPdPrefillTemplateKey('');
    setPdPrefillParams([]);
    setPdPrefillShellText('--max_model_len 8192\n--gpu_memory_utilization 0.9');
    setPdDecodeCount(1);
    setPdDecodeNodes([]);
    setPdDecodeCardCount(0);
    setPdDecodeParams([]);
    setPdDecodeShellText('--max_model_len 8192\n--gpu_memory_utilization 0.9');
    setPdRouterUploadedYaml('');
    setPdPrefillUploadedYaml('');
    setPdDecodeTemplateKey('');

    setDeployDrawerOpen(false);
    setProtectedStartupTemplateName('');
  };

  const getTemplateGpuNeedle = (template: StartupTemplateRecord) => {
    const text = `${template.gpu || ''} ${template.hardware || ''}`.toLowerCase();
    if (text.includes('4090')) return '4090';
    if (text.includes('5090')) return '5090';
    if (text.includes('h20')) return 'h20';
    if (text.includes('a100')) return 'a100';
    if (text.includes('l20')) return 'l20';
    if (text.includes('910b')) return '910b';
    return text.replace(/nvidia|ascend|\(|\)|x\d+/g, '').trim();
  };

  const templateMatchesDeployNode = (template: StartupTemplateRecord, node: DeployNodeOption) => {
    const needle = getTemplateGpuNeedle(template);
    if (!needle || needle.includes('通用')) return true;
    const gpuType = node.gpuType.toLowerCase();
    if (needle === '5090') return gpuType.includes('5090');
    if (needle === '4090') return gpuType.includes('4090');
    return gpuType.includes(needle);
  };

  const resolveTemplateEngineKey = (template: StartupTemplateRecord) => {
    const engineText = `${template.engine || ''} ${template.version || ''}`.toLowerCase();
    return engineList.find((item) => {
      const text = `${item.engine} ${item.name} ${item.version}`.toLowerCase();
      if (engineText.includes('ktransformers')) return text.includes('ktransformers');
      if (engineText.includes('sglang')) return text.includes('sglang');
      if (engineText.includes('vllm')) return text.includes('vllm');
      if (engineText.includes('tensorrt')) return text.includes('tensorrt');
      return text.includes(engineText.trim());
    })?.key;
  };

  const resolveTemplateModelValue = (template: StartupTemplateRecord) => {
    const modelName = template.model || template.name;
    return modelRepoData.find((item) => item.status === 'installed' && (item.name === modelName || modelName.includes(item.name)))?.name
      || undefined;
  };

  const handleDeployStartupTemplate = (rawTemplate: StartupTemplateRecord) => {
    const template = normalizeStartupTemplate(rawTemplate);
    resetDeployForm();
    setStartupTemplates((prev) => prev.some((item) => item.key === template.key) ? prev : [template, ...prev]);

    const isPdTemplate = template.type === 'pd' || template.deployMode === 'PD 分离';
    const isProtectedOfficialSingleTemplate = template.source === 'official' && template.type === 'single';
    const requestedCards = Math.max(1, Number(template.cardCount || template.gpuCount || 1));
    const pdCandidateNodes = isPdTemplate
      ? deployNodes.filter((node) => node.status === 'ready' && templateMatchesDeployNode(template, node) && node.availableCards > 0)
      : [];
    const pdPrefillNode = pdCandidateNodes[0];
    const pdDecodeNode = pdCandidateNodes.find((node) => node.key !== pdPrefillNode?.key && node.clusterKey === pdPrefillNode?.clusterKey)
      || pdCandidateNodes.find((node) => node.key !== pdPrefillNode?.key);
    const selectedNode = isPdTemplate
      ? pdPrefillNode
      : deployNodes.find((node) => node.status === 'ready' && templateMatchesDeployNode(template, node) && node.availableCards >= requestedCards);
    const nextCardCount = selectedNode ? requestedCards : 0;
    const parsedParams = parseShellParams(template.command || '');
    const resolvedModel = resolveTemplateModelValue(template);
    if (!resolvedModel) return;

    setActiveTab('deploy');
    window.history.replaceState(null, '', '/deploy');
    setDeployListViewMode('card');
    setDeployMode(isPdTemplate ? 'pd-separation' : 'single');
    setStrictTemplateDeploy(true);
    setDeployServiceName(template.name);
    setDeployDescription(template.description || template.scenario || '');
    setDeployModel(resolvedModel);
    setDeployEngine(resolveTemplateEngineKey(template));
    selectDeployCluster(selectedNode?.clusterKey || clusters[0]?.key);
    setSelectedSingleNode(isPdTemplate ? null : selectedNode?.key || null);
    setSingleCardCount(isPdTemplate ? 0 : nextCardCount);
    setSelectedDeployNodes([]);
    setGpuSelectMode('auto');
    setManualGpuSelected([]);
    setLaunchConfigMode('template');
    setSelectedStartupTemplateKey(template.key);
    setLaunchCommand(template.command || '');
    setLaunchTopology(template.topology || '');
    setDeployParams(parsedParams);
    setAdvancedShellText(template.command || formatDeployParamsShell(parsedParams));
    setExpandedSections({ advanced: !isProtectedOfficialSingleTemplate });
    setProtectedStartupTemplateName(isProtectedOfficialSingleTemplate ? template.name : '');
    if (isPdTemplate) {
      applyPdTemplateRecord(template);
      setPdRouterCount(1);
      setPdPrefillCount(1);
      setPdDecodeCount(1);
      setPdRouterNodes(pdPrefillNode ? [pdPrefillNode.key] : []);
      setPdPrefillNodes(pdPrefillNode ? [pdPrefillNode.key] : []);
      setPdDecodeNodes(pdDecodeNode ? [pdDecodeNode.key] : []);
      setPdPrefillCardCount(pdPrefillNode ? getDefaultPdCardCount([pdPrefillNode.key]) : 0);
      setPdDecodeCardCount(pdDecodeNode ? getDefaultPdCardCount([pdDecodeNode.key]) : 0);
      setPdShellExpanded({ router: false, prefill: false, decode: false });
    }
    setDeployDrawerOpen(true);
    if (isPdTemplate) {
      if (pdPrefillNode && pdDecodeNode) {
        message.success('已按 PD 模板填充模型服务配置');
      } else {
        message.warning(`无目标节点：当前没有足够的 ${template.gpu || template.hardware || '模板 GPU'} 节点用于 Prefill / Decode`);
      }
    } else if (selectedNode) {
      message.success('已按启动模板填充模型服务配置');
    } else {
      message.warning(`无目标节点：当前没有可用的 ${template.gpu || template.hardware || '模板 GPU'} 且满足 ${requestedCards} 卡的节点`);
    }
  };

  const isPdDeployNodesReady = deployMode !== 'pd-separation' || (
    pdRouterNodes.length > 0 &&
    pdPrefillNodes.length > 0 &&
    pdDecodeNodes.length > 0
  );
  const isDeployNodeSelectionReady = deployMode === 'single'
    ? Boolean(selectedSingleNode && singleCardCount > 0)
    : deployMode === 'distributed'
      ? selectedDeployNodes.length > 0 && singleCardCount > 0
      : isPdDeployNodesReady;
  const isDeploySubmitDisabled = !(
    deployCluster &&
    deployEngine &&
    deployModel &&
    deployServiceName.trim() &&
    isDeployNodeSelectionReady
  );
  const formatDeployCreatedAt = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
  const resolveDeployModelMeta = () => {
    const modelName = getDeployModelName();
    const repo = modelRepoData.find((item) => item.name === deployModel || item.name === modelName);
    const legacy = deployModels.find((item) => item.key === deployModel || item.name === modelName);
    return { modelName, repo, legacy };
  };
  const resolveDeployCategory = (repo?: ModelRepoRecord): DeployCategory => {
    if (!repo) return 'llm';
    if (repo.type === 'embedding' || repo.categories.includes('embedding')) return 'embedding';
    if (repo.type === 'rerank' || repo.categories.includes('rerank')) return 'rerank';
    if (repo.type === 'vlm' || repo.categories.includes('vlm')) return 'vlm';
    return 'llm';
  };
  const getDeploySelectedNodes = () => {
    if (deployMode === 'pd-separation') {
      return [...pdRouterNodes, ...pdPrefillNodes, ...pdDecodeNodes]
        .map((key) => deployNodes.find((node) => node.key === key))
        .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
    }
    const nodeKeys = deployMode === 'single' ? (selectedSingleNode ? [selectedSingleNode] : []) : selectedDeployNodes;
    return nodeKeys
      .map((key) => deployNodes.find((node) => node.key === key))
      .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
  };
  const buildSubmittedDeployService = (): DeployServiceItem => {
    const { modelName, repo, legacy } = resolveDeployModelMeta();
    const engine = engineList.find((item) => item.key === deployEngine);
    const selectedNodes = getDeploySelectedNodes();
    const selectedTemplate = startupTemplates.find((template) => template.key === selectedStartupTemplateKey);
    const deployModeLabel: DeployServiceItem['deployMode'] = deployMode === 'pd-separation'
      ? 'PD 分离'
      : deployMode === 'distributed'
        ? '分布式部署'
        : '单机部署';
    const nodeNames = selectedNodes.map((node) => node.name).join(', ');
    const cardCount = deployMode === 'pd-separation'
      ? Math.max(1, pdPrefillCardCount + pdDecodeCardCount)
      : Math.max(1, singleCardCount || manualGpuSelected.length || 1);
    const createdAt = formatDeployCreatedAt();
    return {
      id: Date.now(),
      name: deployServiceName.trim(),
      description: deployDescription || selectedTemplate?.description || `${modelName} 模型服务`,
      logo: getModelLogo(modelName) || deepseekLogo,
      status: 'running',
      category: resolveDeployCategory(repo),
      typeStr: modelName,
      timeStr: '刚刚部署',
      updateTime: createdAt,
      deployMode: deployModeLabel,
      modelInfo: {
        name: modelName,
        supplier: repo?.family || selectedTemplate?.modelFamily || legacy?.scene || '-',
        number: deployMode === 'pd-separation' ? Math.max(1, selectedNodes.length) : Math.max(1, selectedNodes.length),
        works: nodeNames || '-',
        size: repo?.tags.weight_size || legacy?.size || selectedTemplate?.modelFamily || '-',
        tokens: '0',
        point: repo?.tags.quanted_type || legacy?.format || selectedTemplate?.quantization || '-',
        memory: selectedTemplate?.env?.mem || '-',
        disk: selectedTemplate?.env?.disk || '-',
        vram: `${cardCount} 卡`,
        contextLength: repo?.tags.max_position_embeddings || (selectedTemplate?.maxModelLen ? String(selectedTemplate.maxModelLen) : '-'),
        attentionHeads: '-',
        layers: '-',
        engine: getDeployEngineName(),
        engineVersion: engine?.version || '-',
        restartStatus: true,
        restartNumber: 0,
        restartCount: 0,
        restartPage: [],
        concurrencyControllStatus: true,
        concurrencyControllCount: 100,
        logs: selectedNodes.length > 0
          ? selectedNodes.map((node, index) => ({ id: Date.now() + index, name: `${node.name} 运行日志` }))
          : [{ id: Date.now(), name: '运行日志' }],
        updateTime: createdAt.slice(0, 10),
      },
    };
  };
  const handleSubmitDeploy = () => {
    if (!(deployCluster && deployEngine && deployModel && deployServiceName.trim())) {
      message.warning('请先填写服务名称、模型、推理引擎和部署集群');
      return;
    }
    if (deployMode === 'pd-separation' && !deployServiceEntry) {
      message.warning('PD 分离模式下请选择 SE');
      return;
    }
    if (!isDeployNodeSelectionReady) {
      message.warning('请先选择部署节点和使用卡数');
      return;
    }
    if (deployMode === 'pd-separation') {
      if (pdRouterNodes.length === 0) {
        message.warning('请选择 Router 节点');
        return;
      }
      if (pdPrefillNodes.length === 0) {
        message.warning('请选择 Prefill 节点');
        return;
      }
      if (pdDecodeNodes.length === 0) {
        message.warning('请选择 Decode 节点');
        return;
      }
    }
    const submittedService = buildSubmittedDeployService();
    setDeployServices((prev) => [submittedService, ...prev.filter((service) => service.name !== submittedService.name)]);
    setDeployListViewMode('card');
    setDeployListClusterFilter('');
    setActiveTab('deploy');
    message.success('部署提交成功，已添加到模型服务列表');
    setDeployDrawerOpen(false);
  };

  const readyNodeCount = useMemo(() => {
    if (!deployCluster) return 0;
    return deployNodes.filter((n) => n.clusterKey === deployCluster && n.status === 'ready').length;
  }, [deployCluster]);


  // 进入部署步骤时自动选择默认值
  useEffect(() => {
    if (strictTemplateDeploy) return;
    const ready = deployNodes.find((n) => n.status === 'ready');
    if (Boolean(deployCluster && deployEngine && deployModel) && deployMode === 'single' && !selectedSingleNode) {
        if (ready) {
          setSelectedSingleNode(ready.key);
          setSingleCardCount(1);
        }
      }
  }, [deployCluster, deployEngine, deployModel, deployMode, strictTemplateDeploy]);

  useEffect(() => {
    setPdDecodeCardCount(pdPrefillCardCount);
  }, [pdPrefillCardCount]);

  useEffect(() => {
    if (pdPrefillNodes.length > 0) {
      const cardOptions = [1, 2, 4, 8].filter((value) => value <= getDefaultPdCardCount(pdPrefillNodes));
      if (!cardOptions.includes(pdPrefillCardCount)) setPdPrefillCardCount(cardOptions[0] || 0);
    } else {
      setPdPrefillCardCount(0);
    }
  }, [pdPrefillNodes.join(',')]);

  useEffect(() => {
    setAddInstDecodeCardCount(addInstPrefillCardCount);
  }, [addInstPrefillCardCount]);

  useEffect(() => {
    setAddInstRouterNodes((prev) => prev.slice(0, addInstRouterCount));
    if (addInstNodePickerMode === 'router') {
      setAddInstNodePickerSelected((prev) => prev.slice(0, addInstRouterCount));
    }
  }, [addInstRouterCount, addInstNodePickerMode]);

  useEffect(() => {
    setAddInstPrefillNodes((prev) => prev.slice(0, addInstPrefillCount));
    if (addInstNodePickerMode === 'prefill') {
      setAddInstNodePickerSelected((prev) => prev.slice(0, addInstPrefillCount));
    }
  }, [addInstPrefillCount, addInstNodePickerMode]);

  useEffect(() => {
    setAddInstDecodeNodes((prev) => prev.slice(0, addInstDecodeCount));
    if (addInstNodePickerMode === 'decode') {
      setAddInstNodePickerSelected((prev) => prev.slice(0, addInstDecodeCount));
    }
  }, [addInstDecodeCount, addInstNodePickerMode]);

  useEffect(() => {
    if (addInstPrefillNodes.length > 0) {
      const cardOptions = [1, 2, 4, 8].filter((value) => value <= getDefaultPdCardCount(addInstPrefillNodes));
      if (!cardOptions.includes(addInstPrefillCardCount)) setAddInstPrefillCardCount(cardOptions[0] || 0);
    } else {
      setAddInstPrefillCardCount(0);
    }
  }, [addInstPrefillNodes.join(',')]);

  // 分布式部署默认选择一个可用节点，后续节点数量由节点选择控制
  useEffect(() => {
    if (Boolean(deployCluster && deployEngine && deployModel) && deployMode === 'distributed' && selectedDeployNodes.length === 0) {
      const readyList = deployNodes.filter((n) => n.status === 'ready');
      if (readyList.length > 0) {
        const count = 1;
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
    setDeployParams((prev) => {
      const next = prev.map((p) => {
        if (p.key === 'tensor_parallel_size') return { ...p, value: String(singleCardCount || 1) };
        if (p.key === 'pipeline_parallel_size') return { ...p, value: String(deployMode === 'distributed' ? Math.max(selectedDeployNodes.length, 1) : deployMachineCount) };
        return p;
      });
      setAdvancedShellText(formatDeployParamsShell(next));
      return next;
    });
  }, [singleCardCount, deployMachineCount, deployMode, selectedDeployNodes.length]);




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
      <>
      <div className="ataas-card-select-control">
        <Segmented value={gpuSelectMode} onChange={(value) => setGpuSelectMode(value as 'auto' | 'manual')} options={[{ value: 'auto', label: '自动选卡' }, { value: 'manual', label: '手动选卡' }]} />
        {gpuSelectMode === 'manual' ? (
          <div className="ataas-manual-gpu-trigger">
            <Button size="small" onClick={() => setManualGpuPickerOpen(true)}>选择 GPU</Button>
            <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>仅支持 1/2/4/8 卡</span>
          </div>
        ) : (
          <div className="ataas-card-count-stepper">
            <Button size="small" disabled={!canDecrease} onClick={() => canDecrease && setSingleCardCount(cardOptions[currentIndex - 1])}>-</Button>
            <div className="ataas-card-count-value">{current ? `${current} 卡` : '-'}</div>
            <Button size="small" disabled={!canIncrease} onClick={() => canIncrease && setSingleCardCount(cardOptions[currentIndex + 1])}>+</Button>
          </div>
        )}
      </div>
      {gpuSelectMode === 'manual' && manualGpuSelected.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#86909C', marginBottom: 4 }}>已选 GPU：</div>
          {(() => {
            const byNode: Record<string, string[]> = {};
            manualGpuSelected.forEach((key: string) => {
              const nk = key.substring(0, key.lastIndexOf('-'));
              if (!byNode[nk]) byNode[nk] = [];
              byNode[nk].push(key);
            });
            return Object.entries(byNode).map(([nodeKey, keys]) => {
              const node = deployNodes.find((n: DeployNodeOption) => n.key === nodeKey);
              const isExpanded = expandedGpuNodes[nodeKey] !== undefined ? expandedGpuNodes[nodeKey] : true;
              return (
                <div key={nodeKey} style={{ marginBottom: 8, border: '1px solid #E5E6EB', borderRadius: 6, overflow: 'hidden' }}>
                  <div
                    onClick={() => setExpandedGpuNodes((prev: Record<string, boolean>) => ({ ...prev, [nodeKey]: prev[nodeKey] === undefined ? false : !prev[nodeKey] }))}
                    style={{ padding: '8px 12px', background: '#F7F8FA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}
                  >
                    <span><strong>{node?.name || nodeKey}</strong> · {node?.ip || '-'} · {node?.gpuType || '-'}</span>
                    <span style={{ color: '#6951FF', fontWeight: 500 }}>{keys.length} 卡 {isExpanded ? '▲' : '▼'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '8px 12px' }}>
                      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#F7F8FA' }}>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 500, color: '#4E5969' }}>GPU</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 500, color: '#4E5969' }}>显卡类型</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 500, color: '#4E5969' }}>总显存</th>
                            <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 500, color: '#4E5969' }}>剩余显存</th>
                          </tr>
                        </thead>
                        <tbody>
                          {keys.map((key: string) => {
                            const gpuIndex = key.substring(key.lastIndexOf('-') + 1);
                            const managedNode = nodes.find((n: NodeRecord) => n.name === node?.name || n.ip === node?.ip);
                            const card = managedNode?.gpuCards?.find((c: GpuCardInfo) => String(c.index) === gpuIndex);
                            const mockTotal = card?.memoryTotal || (node?.gpuType?.includes('H20') || node?.gpuType?.includes('L20') ? '47.99 GB' : node?.gpuType?.includes('A100') ? '79.99 GB' : '23.99 GB');
                            const mockFree = card?.memoryFree || (node?.gpuType?.includes('H20') ? '24.09 GB' : '11.99 GB');
                            return (
                              <tr key={key} style={{ borderBottom: '1px solid #F2F3F5' }}>
                                <td style={{ padding: '4px 8px', color: '#6951FF', fontWeight: 500 }}>GPU {gpuIndex}</td>
                                <td style={{ padding: '4px 8px' }}>{card?.model || node?.gpuType || '-'}</td>
                                <td style={{ padding: '4px 8px' }}>{mockTotal}</td>
                                <td style={{ padding: '4px 8px' }}>{mockFree}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
      </>
    );
  };

  const renderDeployNodePicker = (mode: 'single' | 'distributed') => {
    const selectedNodes = mode === 'single' ? (selectedSingleNode ? [selectedSingleNode] : []) : selectedDeployNodes;
    const nodeRecords = selectedNodes
      .map((key) => deployNodes.find((node) => node.key === key))
      .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
    const visibleNodes = nodeRecords.slice(0, 3);
    return (
      <button type="button" className="ataas-deploy-node-picker" onClick={() => setSingleNodeModal(true)}>
        <div className="ataas-deploy-node-picker-main">
          {nodeRecords.length > 0 ? (
            <>
              {visibleNodes.map((node) => (
                <span className="ataas-deploy-node-chip" key={node.key}>
                  <strong>{node.name}</strong>
                  <em>{node.gpuType}</em>
                </span>
              ))}
              {nodeRecords.length > visibleNodes.length && <span className="ataas-deploy-node-more">+{nodeRecords.length - visibleNodes.length}</span>}
            </>
          ) : (
            <span className="ataas-deploy-node-empty">选择部署节点</span>
          )}
        </div>
        <span className="ataas-deploy-node-action">{nodeRecords.length ? '重新选择' : '选择节点'}</span>
      </button>
    );
  };

  const renderPdDeployNodePicker = (mode: 'router' | 'prefill' | 'decode') => {
    const selectedNodes = mode === 'router' ? pdRouterNodes : mode === 'prefill' ? pdPrefillNodes : pdDecodeNodes;
    const nodeRecords = selectedNodes
      .map((key) => deployNodes.find((node) => node.key === key))
      .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
    const visibleNodes = nodeRecords.slice(0, 2);
    return (
      <button
        type="button"
        className="ataas-deploy-node-picker ataas-pd-deploy-node-picker"
        onClick={() => {
          setPdNodePickerMode(mode);
          setPdNodePickerSelected([...selectedNodes]);
          setPdNodeGpuFilter('all');
          setPdNodeSearch('');
          setPdNodePickerOpen(true);
        }}
      >
        <div className="ataas-deploy-node-picker-main">
          {nodeRecords.length > 0 ? (
            <>
              {visibleNodes.map((node) => (
                <span className="ataas-deploy-node-chip" key={node.key}>
                  <strong>{node.name}</strong>
                  <em>{node.gpuType}</em>
                </span>
              ))}
              {nodeRecords.length > visibleNodes.length && <span className="ataas-deploy-node-more">+{nodeRecords.length - visibleNodes.length}</span>}
            </>
          ) : (
            <span className="ataas-deploy-node-empty">选择部署节点</span>
          )}
        </div>
        <span className="ataas-deploy-node-action">{nodeRecords.length ? '重新选择' : '选择节点'}</span>
      </button>
    );
  };

  const renderAddInstanceNodePicker = () => {
    const selectedNodes = addInstRouterNodes;
    const nodeRecords = selectedNodes
      .map((key) => deployNodes.find((node) => node.key === key))
      .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
    const visibleNodes = nodeRecords.slice(0, 3);
    return (
      <button
        type="button"
        className="ataas-deploy-node-picker"
        onClick={() => {
          setAddInstNodePickerMode('router');
          setAddInstNodePickerSelected([...addInstRouterNodes]);
          setAddInstNodeGpuFilter('all');
          setAddInstNodeSearch('');
          setAddInstNodePickerOpen(true);
        }}
      >
        <div className="ataas-deploy-node-picker-main">
          {nodeRecords.length > 0 ? (
            <>
              {visibleNodes.map((node) => (
                <span className="ataas-deploy-node-chip" key={node.key}>
                  <strong>{node.name}</strong>
                  <em>{node.gpuType}</em>
                </span>
              ))}
              {nodeRecords.length > visibleNodes.length && <span className="ataas-deploy-node-more">+{nodeRecords.length - visibleNodes.length}</span>}
            </>
          ) : (
            <span className="ataas-deploy-node-empty">选择部署节点</span>
          )}
        </div>
        <span className="ataas-deploy-node-action">{nodeRecords.length ? '重新选择' : '选择节点'}</span>
      </button>
    );
  };

  const renderAddInstanceCardCountStepper = () => {
    const selectedNodes = addInstRouterNodes
      .map((key) => deployNodes.find((node) => node.key === key))
      .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
    const maxCards = selectedNodes.length > 0 ? Math.min(...selectedNodes.map((node) => node.availableCards)) : 0;
    const cardOptions = [1, 2, 4, 8].filter((value) => value <= maxCards);
    const current = addInstCardCount || cardOptions[0] || 0;
    const currentIndex = cardOptions.indexOf(current);
    const canDecrease = currentIndex > 0;
    const canIncrease = currentIndex >= 0 && currentIndex < cardOptions.length - 1;
    return (
      <>
        <div className="ataas-card-select-control">
          <Segmented value={addInstGpuSelectMode} onChange={(value) => setAddInstGpuSelectMode(value as 'auto' | 'manual')} options={[{ value: 'auto', label: '自动选卡' }, { value: 'manual', label: '手动选卡' }]} />
          {addInstGpuSelectMode === 'manual' ? (
            <div className="ataas-manual-gpu-trigger">
              <Button size="small" onClick={() => setAddInstManualGpuPickerOpen(true)}>选择 GPU</Button>
              <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>仅支持每节点 1/2/4/8 卡</span>
            </div>
          ) : (
            <div className="ataas-card-count-stepper">
              <Button size="small" disabled={!canDecrease} onClick={() => canDecrease && setAddInstCardCount(cardOptions[currentIndex - 1])}>-</Button>
              <div className="ataas-card-count-value">{current ? `${current} 卡` : '-'}</div>
              <Button size="small" disabled={!canIncrease} onClick={() => canIncrease && setAddInstCardCount(cardOptions[currentIndex + 1])}>+</Button>
            </div>
          )}
        </div>
        {addInstGpuSelectMode === 'manual' && addInstManualGpuSelected.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: '#86909C', marginBottom: 4 }}>已选 GPU：</div>
            {Object.entries(addInstManualGpuSelected.reduce<Record<string, string[]>>((acc, key) => {
              const nodeKey = key.substring(0, key.lastIndexOf('-'));
              if (!acc[nodeKey]) acc[nodeKey] = [];
              acc[nodeKey].push(key);
              return acc;
            }, {})).map(([nodeKey, keys]) => {
              const node = deployNodes.find((item) => item.key === nodeKey);
              return (
                <div key={nodeKey} style={{ marginBottom: 8, border: '1px solid #E5E6EB', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', background: '#F7F8FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <span><strong>{node?.name || nodeKey}</strong> · {node?.ip || '-'} · {node?.gpuType || '-'}</span>
                    <span style={{ color: '#6951FF', fontWeight: 500 }}>{keys.length} 卡</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const renderPdAutoCardCount = (mode: 'prefill' | 'decode') => {
    const nodeKeys = mode === 'prefill' ? pdPrefillNodes : pdDecodeNodes;
    const minCards = nodeKeys.length > 0 ? Math.min(...nodeKeys.map((key) => deployNodes.find((node) => node.key === key)?.availableCards ?? 0)) : 0;
    const cardOptions = [1, 2, 4, 8].filter((value) => value <= minCards);
    const current = mode === 'prefill' ? (pdPrefillCardCount || cardOptions[0] || 0) : pdDecodeCardCount;
    const currentIndex = cardOptions.indexOf(current);
    const canDecrease = mode === 'prefill' && currentIndex > 0;
    const canIncrease = mode === 'prefill' && currentIndex >= 0 && currentIndex < cardOptions.length - 1;

    return (
      <div className="ataas-card-select-control ataas-pd-auto-card-control">
        <Segmented value="auto" options={[{ value: 'auto', label: '自动选卡' }]} />
        <div className="ataas-card-count-stepper">
          <Button size="small" disabled={!canDecrease} onClick={() => canDecrease && setPdPrefillCardCount(cardOptions[currentIndex - 1])}>-</Button>
          <div className="ataas-card-count-value">{current ? `${current} 卡` : '-'}</div>
          <Button size="small" disabled={!canIncrease} onClick={() => canIncrease && setPdPrefillCardCount(cardOptions[currentIndex + 1])}>+</Button>
        </div>
      </div>
    );
  };

  const renderAddInstPdAutoCardCount = (mode: 'prefill' | 'decode') => {
    const nodeKeys = mode === 'prefill' ? addInstPrefillNodes : addInstDecodeNodes;
    const minCards = nodeKeys.length > 0 ? Math.min(...nodeKeys.map((key) => deployNodes.find((node) => node.key === key)?.availableCards ?? 0)) : 0;
    const cardOptions = [1, 2, 4, 8].filter((value) => value <= minCards);
    const current = mode === 'prefill' ? (addInstPrefillCardCount || cardOptions[0] || 0) : addInstDecodeCardCount;
    const currentIndex = cardOptions.indexOf(current);
    const canDecrease = mode === 'prefill' && currentIndex > 0;
    const canIncrease = mode === 'prefill' && currentIndex >= 0 && currentIndex < cardOptions.length - 1;

    return (
      <div className="ataas-card-select-control ataas-pd-card-select-control">
        <Segmented value="auto" options={[{ value: 'auto', label: '自动选卡' }]} />
        <div className="ataas-card-count-stepper">
          <Button size="small" disabled={!canDecrease} onClick={() => canDecrease && setAddInstPrefillCardCount(cardOptions[currentIndex - 1])}>-</Button>
          <div className="ataas-card-count-value">{current ? `${current} 卡` : '-'}</div>
          <Button size="small" disabled={!canIncrease} onClick={() => canIncrease && setAddInstPrefillCardCount(cardOptions[currentIndex + 1])}>+</Button>
        </div>
        {mode === 'decode' && <span style={{ fontSize: 11, color: '#86909c' }}>跟随 Prefill 卡数</span>}
      </div>
    );
  };

  const renderDeployModeSelector = () => {
    const modes = [
      { value: 'single', label: '单机部署', desc: '单台机器部署，适合单节点多卡推理服务。' },
      { value: 'pd-separation', label: 'PD 分离', desc: 'Prefill/Decode 分离部署，适合高吞吐服务。' },
      { value: 'distributed', label: '分布式部署', desc: '多节点分布式部署，适合更大模型或多实例。' },
      { value: 'smart', label: '智能决策', desc: '当前版本暂不支持', disabled: true },
    ];
    return (
      <div className="ataas-deploy-mode-compact">
        {modes.map((mode) => {
          const button = (
            <button
              key={mode.value}
              type="button"
              className={(deployMode === mode.value ? 'active ' : '') + (mode.disabled ? 'disabled' : '')}
              disabled={mode.disabled}
              onClick={() => {
                if (mode.disabled) return;
                setDeployMode(mode.value);
                setSelectedSingleNode(null);
                setSelectedDeployNodes([]);
                setSingleCardCount(0);
              }}
            >
              {mode.label}
            </button>
          );
          return <Tooltip key={mode.value} title={mode.desc}>{mode.disabled ? <span>{button}</span> : button}</Tooltip>;
        })}
      </div>
    );
  };

  const updateDeployParamsFromShell = (value: string) => {
    setAdvancedShellText(value);
    const next = value.split('\n').map((line) => {
      const text = line.trim().replace(/\\$/, '').trim();
      if (!text) return null;
      if (!text.startsWith('--')) return null;
      const normalized = text.slice(2);
      const [key, ...rest] = normalized.split(/\s+/);
      return key ? { key, value: rest.join(' ') } : null;
    }).filter((item): item is { key: string; value: string } => Boolean(item));
    setDeployParams(next);
  };

  const parseShellParams = (value: string) => value.split('\n').map((line) => {
    const text = line.trim().replace(/\\$/, '').trim();
    if (!text || !text.startsWith('--')) return null;
    const normalized = text.slice(2);
    const [key, ...rest] = normalized.split(/\s+/);
    return key ? { key, value: rest.join(' ') } : null;
  }).filter((item): item is { key: string; value: string } => Boolean(item));

  const renderParamsShellEditor = (shellText: string, setShellText: (value: string) => void, onChange: (next: Array<{ key: string; value: string }>) => void) => {
    const lines = shellText ? shellText.split('\n') : [''];
    const paramLineCount = lines.filter((line) => line.trim().replace(/\\$/, '').trim().startsWith('--')).length;
    const renderLine = (line: string, index: number) => {
      const trimmed = line.trimEnd();
      const match = trimmed.match(/^(\s*)(--[^\s]+)(\s+)(.*?)(\s*\\)?$/);
      return (
        <div className="ataas-advanced-shell-line" key={index}>
          <span className="line-number">{index + 1}</span>
          <span className="line-code">
            {match ? (
              <>
                <span>{match[1]}</span>
                <span className="param-name">{match[2]}</span>
                <span>{match[3]}</span>
                <span className="param-value">{match[4]}</span>
                {match[5] && <span>{match[5]}</span>}
              </>
            ) : (
              <span>{line || ' '}</span>
            )}
            {index === lines.length - 1 && <span className="shell-caret" />}
          </span>
        </div>
      );
    };
    return (
      <div className="ataas-advanced-shell">
        <div className="ataas-advanced-shell-bar">
          <span>Shell</span>
          <span className="ataas-advanced-shell-count">参数 {paramLineCount} 行 · {shellText.length}/8192</span>
        </div>
        <div className="ataas-advanced-shell-editor">
          <pre className="ataas-advanced-shell-highlight" aria-hidden="true">
            {lines.map(renderLine)}
          </pre>
          <Input.TextArea
            className="ataas-advanced-shell-input"
            rows={Math.max(6, lines.length)}
            value={shellText}
            placeholder=""
            maxLength={8192}
            onChange={(e) => {
              setShellText(e.target.value);
              onChange(parseShellParams(e.target.value));
            }}
          />
        </div>
      </div>
    );
  };

  const renderPdYamlEditor = (yamlText: string, setYamlText: (value: string) => void, onChange: (next: Array<{ key: string; value: string }>) => void) => (
    <div className="ataas-pd-yaml-editor-wrap">
      <MonacoEditor
        value={yamlText}
        language="yaml"
        height={Math.min(320, Math.max(180, yamlText.split('\n').length * 18 + 28))}
        className="ataas-pd-yaml-editor ataas-config-yaml-picker-editor"
        onChange={(value) => {
          setYamlText(value);
          onChange(parseShellParams(value));
        }}
        options={{
          fontSize: 11,
          lineHeight: 18,
          fontWeight: '400',
          minimap: { enabled: false },
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          overviewRulerLanes: 0,
          renderLineHighlight: 'line',
          wordWrap: 'off',
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );

  const renderConfigYamlTree = (node: ConfigTreeNode, depth = 0): ReactNode => {
    const renderConfigName = (name: string, isDir = false) => {
      const parts = name.split(/(router|workers|worker|smg|glm|kimi|qwen)/gi);
      return (
        <span title={name}>
          {parts.map((part, index) => {
            const key = part.toLowerCase();
            const cls = key === 'router'
              ? 'part-router'
              : key === 'workers' || key === 'worker'
                ? 'part-workers'
                : key === 'smg'
                  ? 'part-smg'
                  : key === 'glm' || key === 'kimi' || key === 'qwen'
                    ? 'part-model'
                    : '';
            return cls ? <em key={`${part}-${index}`} className={cls}>{part}</em> : <span key={`${part}-${index}`}>{part}</span>;
          })}
          {isDir ? null : null}
        </span>
      );
    };
    const children = node.children || [];
    return children.map((child) => {
      if (child.is_dir) {
        return (
          <div key={child.path}>
            <div className="ataas-config-yaml-picker-dir" style={{ paddingLeft: 12 + depth * 14 }}>
              <DownOutlined />
              {renderConfigName(child.name, true)}
            </div>
            {renderConfigYamlTree(child, depth + 1)}
          </div>
        );
      }
      return (
        <button
          key={child.path}
          type="button"
          className={'ataas-config-yaml-picker-file' + (configYamlSelectedPath === child.path ? ' selected' : '')}
          style={{ paddingLeft: 24 + depth * 14 }}
          onClick={() => selectConfigYamlFile(child.path)}
        >
          <FileSearchOutlined />
          {renderConfigName(child.name)}
        </button>
      );
    });
  };

  const renderPdShellPanel = (
    role: 'router' | 'prefill' | 'decode',
    title: string,
    shellText: string,
    setShellText: (value: string) => void,
    onChange: (next: Array<{ key: string; value: string }>) => void,
    options?: { locked?: boolean; pickerTarget?: ConfigYamlPickerTarget },
  ) => {
    const paramLineCount = shellText.split('\n').filter((line) => line.trim().replace(/\\$/, '').trim().startsWith('--')).length;
    const expanded = pdShellExpanded[role];
    const locked = Boolean(options?.locked);
    return (
      <div className={`ataas-pd-shell-area ${expanded ? 'expanded' : ''}${locked ? ' locked' : ''}`}>
        <button
          type="button"
          className="ataas-pd-shell-toggle"
          onClick={() => {
            if (locked) return;
            setPdShellExpanded((prev) => ({ ...prev, [role]: !prev[role] }));
          }}
        >
          <span className="ataas-pd-shell-title">
            {title}
            {!locked && options?.pickerTarget && (
              <Tooltip title="从资源文件选择">
                <Button
                  className="ataas-pd-shell-config-button"
                  type="text"
                  size="small"
                  icon={<FileSearchOutlined />}
                  onClick={(event) => {
                    event.stopPropagation();
                    openConfigYamlPicker(options.pickerTarget!);
                  }}
                />
              </Tooltip>
            )}
          </span>
          <em>{locked ? '已由 PD 模板填充' : `${paramLineCount} 行 · ${expanded ? '收起' : '展开'}`}</em>
        </button>
        {expanded && renderPdYamlEditor(shellText, setShellText, onChange)}
      </div>
    );
  };

  const renderAdvancedParamsShell = () => {
    const shellText = advancedShellText;
    const lines = shellText.split('\n');
    const paramLineCount = lines.filter((line) => line.trim().replace(/\\$/, '').trim().startsWith('--')).length;
    const renderLine = (line: string, index: number) => {
      const trimmed = line.trimEnd();
      const match = trimmed.match(/^(\s*)(--[^\s]+)(\s+)(.*?)(\s*\\)?$/);
      return (
        <div className="ataas-advanced-shell-line" key={index}>
          <span className="line-number">{index + 1}</span>
          <span className="line-code">
            {match ? (
              <>
                <span>{match[1]}</span>
                <span className="param-name">{match[2]}</span>
                <span>{match[3]}</span>
                <span className="param-value">{match[4]}</span>
                {match[5] && <span>{match[5]}</span>}
              </>
            ) : (
              <span>{line || ' '}</span>
            )}
            {index === lines.length - 1 && <span className="shell-caret" />}
          </span>
        </div>
      );
    };
    return (
      <div className="ataas-advanced-shell">
        <div className="ataas-advanced-shell-bar">
          <span>Shell</span>
          <span className="ataas-advanced-shell-count">参数 {paramLineCount} 行 · {shellText.length}/8192</span>
        </div>
        <div className="ataas-advanced-shell-editor">
          <pre className="ataas-advanced-shell-highlight" aria-hidden="true">
            {lines.map(renderLine)}
          </pre>
          <Input.TextArea
            className="ataas-advanced-shell-input"
            rows={Math.max(6, lines.length)}
            value={shellText}
            placeholder={'--max_model_len 32768\n--gpu_memory_utilization 0.9\n--tensor_parallel_size 8'}
            maxLength={8192}
            onChange={(e) => updateDeployParamsFromShell(e.target.value)}
          />
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
          <Select value={scheduleClusterKey} onChange={(value) => { setScheduleClusterKey(value); setScheduleNodeKeys([]); }} options={clusters.map((cluster) => ({ value: cluster.key, label: cluster.name }))} />
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
        <span className="ataas-node-gpu-running-models">当前运行 {runningModels.length} 个模型</span>
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

  const openNodeGpuAuthModal = (node: NodeRecord) => {
    const storedKeys = nodeGpuAuthMap[node.key];
    setNodeGpuAuthTarget(node);
    setNodeGpuAuthKeys(storedKeys ?? node.gpuCards.map((card) => String(card.index)));
  };

  const setNodeAuthStatus = (node: NodeRecord, nextAuthStatus: NodeRecord['authStatus']) => {
    setClusterNodeList((prev) => prev.map((item) => item.key === node.key ? { ...item, authStatus: nextAuthStatus } : item));
    if (clusterNodeRecord?.key === node.key) setClusterNodeRecord({ ...clusterNodeRecord, authStatus: nextAuthStatus });
    if (nextAuthStatus === 'unauthorized') {
      setNodeGpuAuthMap((prev) => {
        const next = { ...prev };
        delete next[node.key];
        return next;
      });
    } else {
      setNodeGpuAuthMap((prev) => ({
        ...prev,
        [node.key]: prev[node.key] ?? node.gpuCards.map((card) => String(card.index)),
      }));
    }
    message.success(`${node.name} 已${nextAuthStatus === 'authorized' ? '授权' : '解除授权'}`);
  };

  const nodeColumns: ColumnsType<NodeRecord> = [
    { title: '节点名称', dataIndex: 'name', key: 'name', width: 120, render: (v) => (
      <span className="ataas-node-name-cell">
        <strong title={v}>{v}</strong>
      </span>
    ) },
    { title: '集群名称', dataIndex: 'clusterName', key: 'clusterName', width: 120 },
    { title: 'Labels', key: 'label', width: 200, render: (_: unknown, r: NodeRecord) => (
      <div className="ataas-node-label-cell">
        <span className="ataas-node-label-tag">{r.label}</span>
        {r.tags?.filter((tag) => /^(deployment|GPU|worker|controlplane)=/.test(tag)).map((tag) => <span key={tag} className="ataas-node-label-tag extra">{tag}</span>)}
      </div>
    ) },
    { title: '授权状态', dataIndex: 'authStatus', key: 'authStatus', width: 95, render: (v: string) => <span className={'ataas-cluster-auth-status' + (v === 'authorized' ? ' authorized' : '')}>{v === 'authorized' ? '已授权' : '未授权'}</span> },
    { title: '状态', key: 'status', width: 70, render: (_, r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#344054' }}>
        <i style={{ width: 7, height: 7, borderRadius: '50%', background: r.status === 'normal' ? '#00A11F' : r.status === 'warning' ? '#f59e0b' : '#E02D2D', flexShrink: 0 }} />
        {r.status === 'normal' ? '正常' : r.status === 'warning' ? '警告' : '异常'}
      </span>
    ) },
    { title: '模型数量', key: 'modelCount', width: 110, render: (_, r) => {
      const count = getNodeDeployServices(r).length;
      return <span className="ataas-cluster-table-main">{count}</span>;
    } },
    { title: '节点 IP', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: 'CPU', dataIndex: 'cpu', key: 'cpu', width: 160, render: (_: number, r) => (
      <TableUsageRing percent={getCapacityPercent(r.cpuUsed, r.cpu)} sub={`${r.cpuUsed}/${r.cpu}核`} />
    ) },
    { title: 'GPU', dataIndex: 'gpu', key: 'gpu', width: 150, render: (_: number, r) => {
      const usedCards = r.gpuCards.filter((card) => card.status === 'active').length;
      return <TableUsageRing percent={getCapacityPercent(usedCards, r.gpu)} sub={`${usedCards}/${r.gpu}片`} />;
    } },
    { title: 'GPU 显存', dataIndex: 'gpuMemory', key: 'gpuMemory', width: 180, render: (_: string, r) => (
      <TableUsageRing percent={getCapacityPercent(r.gpuMemoryUsed, r.gpuMemory)} sub={`${r.gpuMemoryUsed}/${r.gpuMemory}`} />
    ) },
    { title: '内存', dataIndex: 'memory', key: 'memory', width: 180, render: (_: string, r) => (
      <TableUsageRing percent={getCapacityPercent(r.memoryUsed, r.memory)} sub={`${r.memoryUsed}/${r.memory}`} />
    ) },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, r) => (
        <span className="ataas-monitor-table-actions ataas-node-table-actions">
          <Dropdown
            menu={{
              items: [
                { key: 'editRemark', label: '编辑备注', icon: <EditOutlined /> },
                { key: 'editLabel', label: '编辑标签', icon: <TagOutlined /> },
                {
                  key: r.authStatus === 'authorized' ? 'authDisable' : 'authEnable',
                  label: r.authStatus === 'authorized' ? '解除授权' : '授权节点',
                  icon: r.authStatus === 'authorized' ? <CloseCircleOutlined /> : <CheckCircleOutlined />,
                },
                {
                  key: 'authGpu',
                  label: '授权显卡',
                  icon: <CheckCircleOutlined />,
                  disabled: r.authStatus !== 'authorized',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'editRemark') {
                  setClusterNodeEditTarget(r);
                  setClusterNodeEditRemark(r.remark || '');
                }
                if (key === 'editLabel') {
                  setClusterNodeLabelEditTarget(r);
                  setClusterNodeEditLabel(r.label);
                }
                if (key === 'authEnable' || key === 'authDisable') {
                  const nextAuthStatus: NodeRecord['authStatus'] = key === 'authEnable' ? 'authorized' : 'unauthorized';
                  setNodeAuthStatus(r, nextAuthStatus);
                }
                if (key === 'authGpu') {
                  openNodeGpuAuthModal(r);
                }
              },
            }}
            placement="bottomRight"
          >
            <Button type="link" onClick={(e) => e.stopPropagation()}><i><SettingOutlined /></i>操作</Button>
          </Dropdown>
          <Button type="link" onClick={() => { message.info(`节点监控：${r.name}`); }}><i><EyeOutlined /></i>监控</Button>
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
    { title: '节点', dataIndex: 'node', key: 'node', width: 140 },
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
    const deployRows = deployServices.reduce<Array<MonitorRow & { avgTtftSum: number; avgOtpsSum: number; cacheHitSum: number }>>((rows, item, index) => {
      const serviceName = item.name;
      const modelName = item.modelInfo.name || item.name;
      const cluster = getDeployClusterName(item);
      const metrics = getMockMonitorMetrics(index + 12, 1.18);
      const existing = rows.find((row) => row.serviceName === serviceName);
      const nextClusterList = existing ? Array.from(new Set([...existing.clusterList, cluster])) : [cluster];
      if (existing) {
        existing.clusterList = nextClusterList;
        existing.cluster = nextClusterList.length > 1 ? nextClusterList.join(' / ') : nextClusterList[0];
        existing.callTotal += metrics.callTotal;
        existing.callFailed += metrics.callFailed;
        existing.totalTokens += metrics.totalTokens;
        existing.inputTokens += metrics.inputTokens;
        existing.outputTokens += metrics.outputTokens;
        existing.interfaceCount += metrics.interfaceCount || 1;
        existing.avgTtftSum += metrics.avgTtft * metrics.callTotal;
        existing.avgOtpsSum += metrics.avgOtps * metrics.callTotal;
        existing.cacheHitSum += Number(metrics.cacheHitRate.replace('%', '')) * metrics.callTotal;
        existing.hasV2 = existing.hasV2 || true;
      } else {
        rows.push({
          key: `deploy-monitor-${item.id}`,
          name: serviceName,
          serviceName,
          modelName,
          cluster: nextClusterList.length > 1 ? nextClusterList.join(' / ') : nextClusterList[0],
          clusterList: nextClusterList,
          callTotal: metrics.callTotal,
          callFailed: metrics.callFailed,
          failRate: metrics.failRate,
          totalTokens: metrics.totalTokens,
          inputTokens: metrics.inputTokens,
          outputTokens: metrics.outputTokens,
          avgTtft: metrics.avgTtft,
          avgOtps: metrics.avgOtps,
          cacheHitRate: metrics.cacheHitRate,
          interfaceCount: metrics.interfaceCount || 1,
          hasV2: true,
          avgTtftSum: metrics.avgTtft * metrics.callTotal,
          avgOtpsSum: metrics.avgOtps * metrics.callTotal,
          cacheHitSum: Number(metrics.cacheHitRate.replace('%', '')) * metrics.callTotal,
        });
      }
      return rows;
    }, []).map((row) => {
      const total = row.callTotal || 1;
      return {
        ...row,
        failRate: `${((row.callFailed / Math.max(1, row.callTotal)) * 100).toFixed(2)}%`,
        avgTtft: Math.round(row.avgTtftSum / total),
        avgOtps: Number((row.avgOtpsSum / total).toFixed(1)),
        cacheHitRate: `${(row.cacheHitSum / total).toFixed(1)}%`,
      };
    });
    const deployNames = new Set(deployRows.map((row) => row.name));
    return [...deployRows, ...monitorRows.filter((row) => !deployNames.has(row.name))];
  }, [deployServices]);

  const filteredMonitorRows = useMemo(() => {
    const q = monitorSearchText.trim().toLowerCase();
    return allMonitorRows.filter((row) => {
      if (monitorClusterFilter && !row.clusterList.includes(monitorClusterFilter)) return false;
      if (monitorExactServiceName) return row.name === monitorExactServiceName || row.modelName === monitorExactServiceName;
      const searchable = `${row.name} ${row.serviceName} ${row.modelName}`.toLowerCase();
      if (q && !searchable.includes(q)) return false;
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

  const monitorColumns: ColumnsType<MonitorRow> = [
    { title: '服务名称', dataIndex: 'name', key: 'name', width: 220, fixed: 'left', sorter: (a, b) => a.name.localeCompare(b.name), render: (v) => {
      const logo = getModelLogo(v);
      return (
        <span className="ataas-monitor-service-name">
          {logo ? <img src={logo} alt="" /> : <em>{String(v).slice(0, 1).toUpperCase()}</em>}
          <Tooltip title={v}>
            <strong>{v}</strong>
          </Tooltip>
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

  const updateThemeSetting = (field: keyof ThemeSettingsState, value: string) => {
    setThemeSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleThemeAssetUpload = (field: keyof ThemeSettingsState, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateThemeSetting(field, String(reader.result || ''));
      message.success('图片已更新');
    };
    reader.readAsDataURL(file);
    return false;
  };

  const saveThemeSettings = () => {
    message.success('主题配置已保存');
  };

  const resetThemeSettings = () => {
    setThemeSettings(defaultThemeSettings);
    message.success('已恢复默认主题');
  };

  const SIDEBAR_ITEMS = [
    { key: 'overview', icon: <SidebarIcon name="dashboard" />, label: '数据概览' },
    { key: 'clusters', icon: <SidebarIcon name="cluster" />, label: '集群管理' },
    { key: 'nodes', icon: <SidebarIcon name="engineMgr" />, label: '节点管理' },
    { key: 'modelRepo', icon: <SidebarIcon name="modelRepo" />, label: '模型仓库' },
    { key: 'startupTemplates', icon: <SidebarIcon name="template" />, label: '性能仓库' },
    { key: 'deploy', icon: <SidebarIcon name="deploy" />, label: '模型部署' },
    { key: 'modelOps', icon: <SidebarIcon name="ops" />, label: '运营调度' },
    { key: 'taskFlow', icon: <SidebarIcon name="task" />, label: '任务流程' },
    { key: 'images', icon: <SidebarIcon name="image" />, label: '镜像仓库' },
    { key: 'monitoring', icon: <SidebarIcon name="monitor" />, label: '模型监控' },
    { key: 'playgroundChat', icon: <SidebarIcon name="playground" />, label: '文本模型' },
    // { key: 'playgroundVision', icon: <SidebarIcon name="imageModel" />, label: '图像模型' },
    { key: 'playgroundVisual', icon: <SidebarIcon name="visionModel" />, label: '视觉模型' },
    { key: 'playgroundEmbedding', icon: <SidebarIcon name="embedding" />, label: '嵌入模型' },
    { key: 'playgroundRerank', icon: <SidebarIcon name="rerank" />, label: '重排模型' },
    { key: 'benchmark', icon: <SidebarIcon name="benchmark" />, label: '性能压测' },
    { key: 'logs', icon: <SidebarIcon name="logs" />, label: '操作日志' },
    { key: 'alerts', icon: <SidebarIcon name="alert" />, label: '告警详情' },
    { key: 'apiKeys', icon: <SidebarIcon name="apiKey" />, label: 'API Key' },
    { key: 'users', icon: <SidebarIcon name="user" />, label: '用户管理' },
    { key: 'engines', icon: <SidebarIcon name="engine" />, label: '镜像管理' },
    { key: 'containerManagement', icon: <SidebarIcon name="pod" />, label: '容器管理' },
    { key: 'routeWorkbench', icon: <SidebarIcon name="service" />, label: '链路编排' },
    { key: 'configCenter', icon: <SidebarIcon name="config" />, label: '资源文件' },
  ];
  const getSidebarItems = (keys: string[]) => keys.map((key) => SIDEBAR_ITEMS.find((item) => item.key === key)).filter(Boolean) as typeof SIDEBAR_ITEMS;
  const SIDEBAR_GROUPS = [
    { title: '概览', items: getSidebarItems(['overview']) },
    { title: '资源管理', items: getSidebarItems(['clusters', 'nodes', 'engines', 'containerManagement', 'routeWorkbench', 'configCenter']) },
    { title: '模型管理', items: getSidebarItems(['modelRepo', 'startupTemplates', 'deploy', 'modelOps', 'taskFlow', 'monitoring']) },
    { title: '模型测试', items: getSidebarItems(['playgroundChat', 'playgroundVisual', 'playgroundEmbedding', 'playgroundRerank', 'benchmark']) },
    { title: '身份权限', items: getSidebarItems(['apiKeys', 'users']) },
    { title: '系统监控', items: getSidebarItems(['alerts', 'logs']) },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
	      case 'overview': return (
			<div className="ataas-section-stack">
	              <OverviewSummary alertList={alertList} />

              <div style={{ display: 'flex', gap: 16, marginBottom: 28, alignItems: 'stretch' }}>
                {/* 左侧：集群概览 + 模型数据 */}
                <div style={{ flex: 3.5, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
	                  <div className="ataas-panel-head" style={{ marginBottom: 0 }}>
	                    <div>
	                      <h2>集群概览</h2>
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
                                <Tooltip title={item.name}>
                                  <span className="ataas-model-call-name">{item.name}</span>
                                </Tooltip>
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
                      <a onClick={() => { setActiveTab('monitoring'); }}>查看全部 <ArrowRightOutlined style={{ fontSize: 10 }} /></a>
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
                            <Tooltip title={alert.target}>
                              <span className="ataas-merged-title">{alert.target}</span>
                            </Tooltip>
                            <Tooltip title={alert.description}>
                              <span className="ataas-merged-desc">{alert.description}</span>
                            </Tooltip>
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
                            <Tooltip title={log.user}>
                              <span className="ataas-merged-title">{log.user}</span>
                            </Tooltip>
                            <span style={{ fontSize: 11, color: '#4E5969', flexShrink: 0 }}>{log.action}</span>
                            <Tooltip title={log.object}>
                              <span className="ataas-merged-desc">{log.object}</span>
                            </Tooltip>
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
      case 'nodes':
      case 'clusters': return (
		<div className="ataas-section-stack">
              <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
              <div className="ataas-panel ataas-cluster-page">
                <div className="ataas-panel-head">
                  <h2>{clusterPanel === 'clusters' ? '集群管理' : '节点管理'}</h2>
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
                      { title: '节点数', dataIndex: 'nodes', key: 'nodes', width: 90, render: (v: number, r) => <Button type="link" className="ataas-table-link" onClick={() => { setSelectedClusterKey(r.key); setClusterPanel('nodes'); setActiveTab('nodes'); }}>{v} 台</Button> },
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
                      { title: 'GPU', dataIndex: 'gpuUsage', key: 'gpuUsage', width: 130, render: (v: number, r) => {
                        const totalCards = r.gpuTypes.reduce((sum, gpu) => sum + gpu.cards, 0);
                        const usedCards = Math.round(totalCards * v / 100);
                        return <TableUsageRing percent={v} sub={`${usedCards}/${totalCards}片`} />;
                      } },
                      { title: 'CPU', dataIndex: 'cpu', key: 'cpu', width: 145, render: (v: string) => {
                        const usage = parseUsageText(v);
                        return <TableUsageRing percent={usage.percent} sub={usage.sub} />;
                      } },
                      { title: '内存', dataIndex: 'memory', key: 'memory', width: 145, render: (v: string) => {
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
                    <Table dataSource={filteredNodes} rowKey="key" columns={nodeColumns} scroll={{ x: 2000 }} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }} expandable={{
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
                                    <span className={'ataas-node-gpu-card-status' + (card.status === 'idle' ? ' idle' : '')}>{card.status === 'idle' ? '空闲' : '使用中'}</span>
                                  </div>
                                  <div className="ataas-node-gpu-card-model">{card.model}<em>{card.spec}</em></div>
                                  <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" />
                                  <div className="ataas-node-gpu-card-meta">
                                    <span>显存 {card.memoryUsed} / {card.memoryTotal}</span>
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
                              if (key === 'updateInfo') modelRepoInfoUploadRef.current?.click();
                              if (key === 'importPrivate') setModelRepoImportOpen(true);
                              if (key === 'updateStatus') message.success('模型状态已更新');
                            },
                          }}
                          onClick={() => setModelRepoTaskOpen(true)}
                        >
                          查看任务
                        </Dropdown.Button>
                        <input
                          ref={modelRepoInfoUploadRef}
                          type="file"
                          accept=".json,.yaml,.yml,.csv,.xlsx"
                          style={{ display: 'none' }}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) message.success(`模型信息文件已选择：${file.name}`);
                            event.target.value = '';
                          }}
                        />
                      </div>
                    </div>
                    <div className="ataas-model-repo-grid">
                      {filteredModelRepoData.map((item) => {
                        const logo = getModelLogo(item.name);
                        const updateTime = item.updatedAt ? item.updatedAt.slice(0, 16).replace('T', ' ') + ' 更新' : '';
                        return (
                          <div key={item.id} className={'ataas-model-repo-card' + (modelRepoMoreOpenId === item.id ? ' ataas-model-repo-card-actions-visible' : '')}>
                            <div className="ataas-model-repo-card-glow" />
                            <div className="ataas-model-repo-card-head">
                              {logo ? <img src={logo} alt="" /> : <span className="ataas-model-repo-fallback-logo">{item.family.slice(0, 1)}</span>}
                              <div>
                                <Tooltip title={item.name}>
                                  <strong>{item.name}</strong>
                                </Tooltip>
                                {item.source !== 'official' && <em>私有</em>}
                              </div>
                            </div>
                            <div className="ataas-model-repo-card-tags">
                              <span>{item.tags.categories}</span>
                              <span>{item.tags.weight_size}</span>
                              <span>{item.tags.quanted_type}</span>
                              <span>{item.tags.max_position_embeddings}</span>
                            </div>
                            <Tooltip title={item.description || '暂无描述'}>
                              <p>{item.description || '暂无描述'}</p>
                            </Tooltip>
                            <div className="ataas-model-repo-card-foot">
                              <span>{updateTime}</span>
                              <div>
                                <Button size="small" type="primary" disabled={item.status !== 'installed'} onClick={(e) => { e.stopPropagation(); setActiveTab('deploy'); setDeployModel(item.name); setDeployDrawerOpen(true); }}>部署</Button>
                                <Dropdown
                                  className="ataas-model-repo-more-dropdown"
                                  trigger={['click']}
                                  open={modelRepoMoreOpenId === item.id}
                                  onOpenChange={(open) => setModelRepoMoreOpenId(open ? item.id : null)}
                                  menu={{
                                    items: [
                                      {
                                        key: 'download',
                                        label: '下载',
                                        children: [
                                          { key: 'online', label: '在线下载' },
                                          { key: 'offline', label: '离线下载' },
                                        ],
                                      },
                                      { key: 'delete', label: '删除', danger: true },
                                    ],
                                    onClick: ({ key, domEvent }) => {
                                      domEvent.stopPropagation();
                                      setModelRepoMoreOpenId(null);
                                      if (key === 'online') {
                                        setModelRepoDownloadTarget(item);
                                        setModelRepoTaskOpen(true);
                                        message.success(`${item.name} 已开始在线下载`);
                                      }
                                      if (key === 'offline') setModelRepoOfflineTarget(item);
                                      if (key === 'delete') message.info(`删除模型: ${item.name}`);
                                    },
                                  }}
                                >
                                  <button type="button" className="ataas-model-repo-more-button" onClick={(e) => e.stopPropagation()}>更多</button>
                                </Dropdown>
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
                onDeleteInstance={handleDeployDeleteInstance}
                onAddInstance={handleDeployAddInstance}
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
      case 'modelOps': {
            const modelServiceGroups = deployServices.reduce<Array<{ name: string; services: DeployServiceItem[]; instances: number }>>((groups, service) => {
              const name = service.modelInfo.name || service.typeStr || service.name;
              const current = groups.find((group) => group.name === name);
              const instanceCount = Math.max(1, service.modelInfo.number || service.modelInfo.works?.split(',').filter(Boolean).length || 1);
              if (current) {
                current.services.push(service);
                current.instances += instanceCount;
              } else {
                groups.push({ name, services: [service], instances: instanceCount });
              }
              return groups;
            }, []);
            const activeModelName = modelServiceGroups.some((group) => group.name === modelOpsSelectedModel)
              ? modelOpsSelectedModel
              : modelServiceGroups[0]?.name || '';
            const activeModelGroup = modelServiceGroups.find((group) => group.name === activeModelName);
            const selectedModelOpsService = modelOpsSelectedServiceId
              ? deployServices.find((service) => service.id === modelOpsSelectedServiceId)
              : null;
            const activeModelServices = selectedModelOpsService ? [selectedModelOpsService] : (activeModelGroup?.services || []);
            const resolveModelOpsSourceService = (item: DeployServiceItem) => (
              deployServices.find((service) => service.id === (item.modelOpsSourceServiceId || item.id)) || item
            );
            const getModelOpsServiceInstances = (service: DeployServiceItem) => {
              const works = (service.modelInfo.works || '')
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean);
              const count = Math.max(1, works.length || service.modelInfo.number || 1);
              const stRouter1Mock = service.name === 'st-router-1'
                ? [
                    { cluster: 'guangzhou-test', roleSummary: { router: '1/1', prefill: '4/4', decode: '1/1' } },
                    { cluster: 'guangzhou-test', roleSummary: { router: '1/1', prefill: '3/4', decode: '1/1' } },
                    { cluster: 'guangzhou-test', roleSummary: { router: '1/1', prefill: '2/4', decode: '1/1' } },
                    { cluster: 'shanghai-online', roleSummary: { router: '1/1', prefill: '4/4', decode: '1/1' } },
                    { cluster: 'shanghai-online', roleSummary: { router: '1/1', prefill: '3/4', decode: '0/1' } },
                    { cluster: 'shanghai-online', roleSummary: { router: '0/1', prefill: '4/4', decode: '1/1' } },
                    { cluster: 'wuhan-kunpeng', roleSummary: { router: '1/1', prefill: '3/4', decode: '1/1' } },
                    { cluster: 'wuhan-kunpeng', roleSummary: { router: '1/1', prefill: '4/4', decode: '0/1' } },
                    { cluster: 'beijing-prod', roleSummary: { router: '1/1', prefill: '4/4', decode: '1/1' } },
                    { cluster: 'beijing-prod', roleSummary: { router: '0/1', prefill: '3/4', decode: '1/1' } },
                  ]
                : [];
              return Array.from({ length: count }, (_, index) => ({
                key: `${service.id}-instance-${index}`,
                serviceName: service.name,
                instanceName: works[index] || `${service.name}-实例${index + 1}`,
                cluster: stRouter1Mock[index]?.cluster || getDeployClusterName(service),
                roleSummary: stRouter1Mock[index]?.roleSummary,
              }));
            };
            const getModelOpsInstanceRows = (service: DeployServiceItem): DeployServiceItem[] => (
              getModelOpsServiceInstances(service).map((instance, index) => ({
                ...service,
                id: service.id * 1000 + index + 1,
                name: instance.instanceName,
                serviceGroupName: service.name,
                modelOpsSourceServiceId: service.id,
                modelOpsInstanceKey: instance.key,
                modelOpsCluster: instance.cluster,
                modelOpsRoleSummary: instance.roleSummary || {
                  router: '1/1',
                  prefill: '4/4',
                  decode: '1/1',
                },
                modelInfo: {
                  ...service.modelInfo,
                  number: 1,
                  works: instance.instanceName,
                  logs: service.modelInfo.logs.map((log) => ({ ...log, name: `${instance.instanceName} ${log.name}` })),
                },
              }))
            );
            const activeModelInstanceRows = activeModelServices.flatMap((service) => getModelOpsInstanceRows(service));
            const getInstanceClusterGroups = (instances: ReturnType<typeof getModelOpsServiceInstances>) => (
              instances.reduce<Array<{ cluster: string; items: Array<{ instance: typeof instances[number]; index: number }> }>>((groups, instance, index) => {
                const cluster = instance.cluster || '未指定集群';
                const current = groups.find((group) => group.cluster === cluster);
                if (current) current.items.push({ instance, index });
                else groups.push({ cluster, items: [{ instance, index }] });
                return groups;
              }, [])
            );
            const getDefaultWeight = (instances: ReturnType<typeof getModelOpsServiceInstances>, index: number) => {
              const instance = instances[index];
              const clusterItems = instances
                .map((item, itemIndex) => ({ item, itemIndex }))
                .filter(({ item }) => (item.cluster || '未指定集群') === (instance.cluster || '未指定集群'));
              if (clusterItems.length <= 1) return 100;
              const base = Math.floor(100 / clusterItems.length);
              const clusterIndex = clusterItems.findIndex(({ itemIndex }) => itemIndex === index);
              return clusterIndex === clusterItems.length - 1 ? 100 - base * (clusterItems.length - 1) : base;
            };
            const getInstanceWeight = (instances: ReturnType<typeof getModelOpsServiceInstances>, index: number) => modelOpsWeights[instances[index].key] ?? getDefaultWeight(instances, index);
            const updateInstanceWeight = (instanceKey: string, value: number) => {
              setModelOpsWeights((prev) => ({ ...prev, [instanceKey]: Math.max(0, Math.min(100, Math.round(value))) }));
            };
            const normalizeInstanceWeights = (instances: ReturnType<typeof getModelOpsServiceInstances>, cluster?: string) => {
              const groups = getInstanceClusterGroups(instances).filter((group) => !cluster || group.cluster === cluster);
              const nextWeights: Record<string, number> = {};
              groups.forEach((group) => {
                const current = group.items.map(({ index }) => getInstanceWeight(instances, index));
                const total = current.reduce((sum, value) => sum + value, 0);
                if (total <= 0) return;
                const next = current.map((value) => Math.floor((value / total) * 100));
                const rest = 100 - next.reduce((sum, value) => sum + value, 0);
                if (next.length > 0) next[next.length - 1] += rest;
                group.items.forEach(({ instance }, index) => {
                  nextWeights[instance.key] = next[index];
                });
              });
              setModelOpsWeights((prev) => ({ ...prev, ...nextWeights }));
            };
            const averageInstanceWeights = (instances: ReturnType<typeof getModelOpsServiceInstances>, cluster?: string) => {
              const groups = getInstanceClusterGroups(instances).filter((group) => !cluster || group.cluster === cluster);
              const nextWeights: Record<string, number> = {};
              groups.forEach((group) => {
                const base = Math.floor(100 / group.items.length);
                group.items.forEach(({ instance }, index) => {
                  nextWeights[instance.key] = index === group.items.length - 1 ? 100 - base * (group.items.length - 1) : base;
                });
              });
              setModelOpsWeights((prev) => ({ ...prev, ...nextWeights }));
            };
            const getServiceWeight = (item: DeployServiceItem) => {
              const sourceService = resolveModelOpsSourceService(item);
              const instances = getModelOpsServiceInstances(sourceService);
              const instanceIndex = item.modelOpsInstanceKey
                ? instances.findIndex((instance) => instance.key === item.modelOpsInstanceKey)
                : -1;
              if (instanceIndex >= 0) return getInstanceWeight(instances, instanceIndex);
              return instances.reduce((sum, _, index) => sum + getInstanceWeight(instances, index), 0);
            };
            const getModelOpsSourceInstanceIndex = (item: DeployServiceItem, fallbackIndex: number) => {
              const sourceService = resolveModelOpsSourceService(item);
              const instances = getModelOpsServiceInstances(sourceService);
              const instanceIndex = item.modelOpsInstanceKey
                ? instances.findIndex((instance) => instance.key === item.modelOpsInstanceKey)
                : -1;
              return instanceIndex >= 0 ? instanceIndex : fallbackIndex;
            };
            const openModelOpsWeightModal = (service?: DeployServiceItem) => {
              const targetService = service ? resolveModelOpsSourceService(service) : (selectedModelOpsService || activeModelServices[0]);
              if (!targetService) {
                message.warning('暂无可分配权重的实例');
                return;
              }
              setModelOpsWeightModalServiceId(targetService.id);
            };
            const activeWeightModalService = modelOpsWeightModalServiceId
              ? deployServices.find((service) => service.id === modelOpsWeightModalServiceId)
              : null;
            const activeWeightModalAllInstances = activeWeightModalService ? getModelOpsServiceInstances(activeWeightModalService) : [];
            const activeWeightModalInstances = modelOpsClusterFilter
              ? activeWeightModalAllInstances.filter((instance) => instance.cluster === modelOpsClusterFilter)
              : activeWeightModalAllInstances;
            const activeWeightModalGroups = getInstanceClusterGroups(activeWeightModalInstances);
            return (
              <div className="ataas-section-stack">
                <div className="ataas-model-ops-layout">
                  <main className="ataas-model-ops-main">
                    <DeployList
                      mode="modelOps"
                      data={activeModelInstanceRows}
                      onDetail={(item) => handleDeployDetail(resolveModelOpsSourceService(item))}
                      onStop={handleDeployStop}
                      onMonitor={(item) => handleDeployMonitor(resolveModelOpsSourceService(item))}
                      onExperience={(item) => handleDeployExperience(resolveModelOpsSourceService(item))}
                      onLog={(item, logId, podName) => handleDeployLog(resolveModelOpsSourceService(item), logId, podName)}
                      onDeleteInstance={(item, instanceIndex) => handleDeployDeleteInstance(resolveModelOpsSourceService(item), getModelOpsSourceInstanceIndex(item, instanceIndex))}
                      onAddInstance={(item) => handleDeployAddInstance(resolveModelOpsSourceService(item))}
                      onAllocateWeight={openModelOpsWeightModal}
                      onOpenCreate={handleOpenCreate}
                      onScalePd={(item) => handleScalePd(resolveModelOpsSourceService(item))}
                      onNodeFilter={(item) => handleDeployNodeFilter(resolveModelOpsSourceService(item))}
                      onScheduleDetail={(item) => handleScheduleDetail(resolveModelOpsSourceService(item))}
                      viewModeValue={modelOpsListViewMode}
                      onViewModeChange={setModelOpsListViewMode}
                      clusterFilterValue={modelOpsClusterFilter}
                      onClusterFilterChange={setModelOpsClusterFilter}
                      getModelOpsRowWeight={getServiceWeight}
                      onModelOpsYamlPreview={openModelOpsYamlPreview}
                    />
                    <Modal
                        className="ataas-model-ops-weight-modal-shell ataas-model-ops-task-modal ataas-model-ops-allocate-modal-shell"
	                      title={<div className="ataas-model-ops-router-link-title"><SettingOutlined /><strong>调整流量配比</strong><em>{activeWeightModalService?.name || activeModelName}</em></div>}
	                      open={!!activeWeightModalService}
	                      width={640}
	                      onCancel={() => setModelOpsWeightModalServiceId(null)}
	                      footer={[
	                        <Button key="cancel" onClick={() => setModelOpsWeightModalServiceId(null)}>取消</Button>,
	                        <Button key="save" type="primary" onClick={() => { message.success('权重配置已保存'); setModelOpsWeightModalServiceId(null); }}>确定</Button>,
	                      ]}
	                    >
	                      {activeWeightModalService && (
	                        <div className="ataas-model-ops-weight-modal">
                            <div className="ataas-model-ops-weight-modal-list">
                              {activeWeightModalGroups.map((group) => {
                                const total = group.items.reduce((sum, { index }) => sum + getInstanceWeight(activeWeightModalInstances, index), 0);
                                return (
                                  <div key={group.cluster} className="ataas-model-ops-weight-modal-cluster">
                                    <div className="ataas-model-ops-weight-modal-cluster-head">
                                      <div className="ataas-model-ops-weight-modal-cluster-title">
                                        <strong>{group.cluster}</strong>
                                        <span>{group.items.length} 个实例</span>
                                      </div>
                                      <span className="ataas-model-ops-weight-modal-cluster-total">当前总和 <em className={total === 100 ? '' : 'warning'}>{total}</em></span>
                                      <div>
                                        <Button onClick={() => normalizeInstanceWeights(activeWeightModalInstances, group.cluster)}>归一化至100</Button>
                                        <Button onClick={() => averageInstanceWeights(activeWeightModalInstances, group.cluster)}>均分</Button>
                                      </div>
                                    </div>
                                    {group.items.map(({ instance, index }) => {
                                      const value = getInstanceWeight(activeWeightModalInstances, index);
                                      return (
                                        <div key={instance.key} className="ataas-model-ops-weight-modal-row">
                                          <Tooltip title={instance.instanceName}><strong>{instance.instanceName}</strong></Tooltip>
                                          <Slider min={0} max={100} value={value} tooltip={{ formatter: null }} onChange={(nextValue) => updateInstanceWeight(instance.key, Number(nextValue))} />
                                          <InputNumber min={0} max={100} value={value} size="middle" onChange={(nextValue) => { if (nextValue !== null) updateInstanceWeight(instance.key, Number(nextValue)); }} />
                                          <span className="ataas-model-ops-weight-modal-percent">%</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
	                        </div>
	                      )}
	                    </Modal>
	                  </main>
                </div>
              </div>
            );
          }
      case 'startupTemplates': return (
            <div className="ataas-section-stack">
              <StartupTemplateManager
                templates={startupTemplates}
                setTemplates={setStartupTemplates}
                onDeployTemplate={handleDeployStartupTemplate}
                onPickConfigYaml={(onSelect) => openConfigYamlPicker('custom', onSelect)}
              />
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
      case 'playgroundVision': return (
            <div className="ataas-section-stack">
              <VisualModelPage />
            </div>
          );
      case 'playgroundVisual': return (
            <div className="ataas-section-stack">
              <VisionAnalysisPage />
            </div>
          );
      case 'playgroundEmbedding': return (
            <div className="ataas-section-stack">
              <EmbeddingModelPage />
            </div>
          );
      case 'playgroundRerank': return (
            <div className="ataas-section-stack">
              <RerankModelPage />
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
                      <div
                        className="ataas-monitor-report-time-segment"
                        data-active={monitorTimePrecision}
                        role="tablist"
                        aria-label="时间粒度"
                      >
                        <span className="ataas-monitor-report-time-indicator" aria-hidden="true" />
                        {[
                          { value: 'day', label: '按日' },
                          { value: 'hour', label: '按时' },
                          { value: 'minute', label: '按分钟' },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            role="tab"
                            aria-selected={monitorTimePrecision === option.value}
                            className={monitorTimePrecision === option.value ? 'is-active' : undefined}
                            onClick={() => handleMonitorPrecisionChange(option.value as MonitorTimePrecision)}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                      {monitorTimePrecision === 'minute' ? (
                        <DatePicker
                          className="ataas-log-range-picker ataas-monitor-report-date ataas-monitor-report-single-date"
                          value={monitorReportDate}
                          allowClear={false}
                          disabledDate={disabledMonitorReportDate}
                          onChange={handleMonitorReportDateChange}
                        />
                      ) : (
                        <DatePicker.RangePicker
                          className="ataas-log-range-picker ataas-monitor-report-date"
                          value={monitorReportDateRange}
                          allowClear={false}
                          disabledDate={disabledMonitorReportDate}
                          onCalendarChange={(range) => setMonitorReportCalendarRange(range)}
                          onChange={handleMonitorReportRangeChange}
                        />
                      )}
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
                  <DatePicker.RangePicker
                    className="ataas-log-range-picker"
                    size="middle"
                    value={logDateRange ? [dayjs(logDateRange[0]), dayjs(logDateRange[1])] : null}
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
                    { value: 'cluster', label: '集群' },
                    { value: 'node', label: '节点' },
                    { value: 'status', label: '状态' },
                  ]} />
                  <Input.Search className="ataas-deploy-list-search ataas-log-search" placeholder={'搜索' + ({ all: '日志', user: '操作人', action: '操作', object: '对象', cluster: '集群', node: '节点', status: '状态' }[logSearchField] || '日志') + '...'} value={logSearchText} onChange={(e) => setLogSearchText(e.target.value)} allowClear size="middle" />
                </div>
                <div className="ataas-deploy-table-wrap ataas-log-table-wrap">
                  <Table dataSource={filteredLogs} rowKey={(_, i) => String(i)} columns={logColumns} scroll={{ x: 1120 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }} />
                </div>
              </div>
              </ConfigProvider>
            </div>
          );
      case 'alerts': {
            const renderAlertCell = (value: React.ReactNode) => {
              const text = String(value ?? '-');
              return (
                <Tooltip title={text}>
                  <span className="ataas-alert-table-ellipsis">{text}</span>
                </Tooltip>
              );
            };
            const alertColumns: ColumnsType<AlertRecord> = [
              { title: '告警等级', dataIndex: 'level', key: 'level', width: 80, render: (v: string) => {
                const levelMap: Record<string, { color: string; label: string }> = { 'critical': { color: '#F53F3F', label: '紧急' }, 'warning': { color: '#FF7D00', label: '普通' }, 'info': { color: '#86909C', label: '轻微' } };
                const info = levelMap[v] || { color: '#4E5969', label: v };
                return <span style={{ color: info.color }}>{info.label}</span>;
              } },
              { title: '告警对象', dataIndex: 'target', key: 'target', width: 150, ellipsis: true, render: renderAlertCell },
              { title: '发生时间', dataIndex: 'time', key: 'time', width: 160, ellipsis: true, render: renderAlertCell },
              { title: '对象类型', dataIndex: 'objectType', key: 'objectType', width: 90, ellipsis: true, render: renderAlertCell },
              { title: '所属集群', dataIndex: 'cluster', key: 'cluster', width: 170, ellipsis: true, render: renderAlertCell },
              { title: '问题描述', dataIndex: 'description', key: 'description', width: 240, ellipsis: true, render: renderAlertCell },
              { title: '处置建议', dataIndex: 'suggestion', key: 'suggestion', width: 240, ellipsis: true, render: renderAlertCell },
              { title: '发生次数', dataIndex: 'count', key: 'count', width: 80, align: 'center' as const },
              { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => {
                const colorMap: Record<string, string> = { '未处理': '#E02D2D', '已恢复': '#00A11F' };
                if (v === '已恢复') {
                  return <span className="ataas-alert-table-status ataas-alert-table-status-restored" style={{ ['--status-color' as string]: colorMap[v] }}>{v}</span>;
                }
                return <span className="ataas-alert-table-status ataas-alert-table-status-pending" style={{ ['--status-color' as string]: colorMap[v] || '#E02D2D' }}>{v}</span>;
              }},
              { title: '操作', key: 'action', width: 160, fixed: 'right', className: 'ataas-alert-fixed-action-cell', render: (_, r) => (
                <span className="ataas-monitor-table-actions ataas-log-table-actions ataas-alert-table-actions">
                  <Button type="link" onClick={() => setAlertDetailRecord(r)}><i><EyeOutlined /></i>查看详情</Button>
                  {r.status !== '已恢复' && (
                    <Button type="link" onClick={() => { setAlertList((prev: AlertRecord[]) => prev.map((a: AlertRecord) => a.key === r.key ? { ...a, status: '已恢复' } : a)); message.success('已恢复: ' + r.target); }}>恢复</Button>
                  )}
                </span>
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
                    <DatePicker.RangePicker
                      className="ataas-log-range-picker ataas-alert-range-picker"
                      size="middle"
                      value={alertDateRange ? [dayjs(alertDateRange[0]), dayjs(alertDateRange[1])] : null}
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
                    <Select className="ataas-deploy-list-select" value={alertSearchField} onChange={setAlertSearchField} size="middle" style={{ width: 100, marginRight: 8 }} options={[
                      { value: 'all', label: '全部' },
                      { value: 'target', label: '告警对象' },
                      { value: 'objectType', label: '对象类型' },
                      { value: 'description', label: '问题描述' },
                      { value: 'suggestion', label: '处置建议' },
                    ]} />
                    <Input.Search className="ataas-deploy-list-search" placeholder={'搜索' + ({ all: '告警', target: '告警对象', objectType: '对象类型', description: '问题描述', suggestion: '处置建议' }[alertSearchField] || '告警') + '...'} value={alertSearchText} onChange={(e) => setAlertSearchText(e.target.value)} allowClear size="middle" style={{ width: 200 }} />
                  </div>
                  <div className="ataas-deploy-table-wrap ataas-alert-table-wrap">
                    <Table dataSource={filteredAlerts} rowKey="key" columns={alertColumns} scroll={{ x: 1370 }} pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }} />
                  </div>
                </div>
                </ConfigProvider>
              </div>
            );
          }
      case 'users': {
            const filteredUsers = userList.filter((item) => {
              if (!userSearchText.trim()) return true;
              const keyword = userSearchText.trim().toLowerCase();
              return item.username.toLowerCase().includes(keyword) || item.remark.toLowerCase().includes(keyword);
            });
            const openCreateUser = (role: 'admin' | 'user') => {
              setUserCreateRole(role);
              userForm.resetFields();
              setUserCreateOpen(true);
            };
            const createUser = async () => {
              const values = await userForm.validateFields();
              setUserList((prev) => [
                {
                  key: `user-${Date.now()}`,
                  username: values.username,
                  role: userCreateRole,
                  remark: values.remark || '-',
                },
                ...prev,
              ]);
              userForm.resetFields();
              setUserCreateOpen(false);
              message.success(userCreateRole === 'admin' ? '管理员已创建' : '普通用户已创建');
            };
            const userColumns: ColumnsType<UserManageRecord> = [
              { title: '用户名', dataIndex: 'username', key: 'username', render: (value) => <strong className="ataas-api-key-name">{value}</strong> },
              { title: '权限', dataIndex: 'role', key: 'role', render: (value) => <span className={'ataas-user-role ' + value}>{value === 'admin' ? '管理员' : '普通用户'}</span> },
              { title: '备注', dataIndex: 'remark', key: 'remark', render: (value) => value || '-' },
              { title: '操作', key: 'action', width: 120, render: (_, record) => (
                <div className="ataas-table-actions">
                  <Button type="link" size="small" danger disabled={record.key === 'user-admin'} onClick={() => {
                    setUserList((prev) => prev.filter((item) => item.key !== record.key));
                    message.success('已删除用户');
                  }}>删除</Button>
                </div>
              ) },
            ];
            return (
              <div className="ataas-section-stack">
                <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
                  <div className="ataas-panel ataas-api-key-page ataas-user-page ataas-deploy-list">
                    <div className="ataas-panel-head ataas-api-key-head">
                      <div>
                        <h2>用户管理</h2>
                        <span>高效管理用户权限</span>
                      </div>
                    </div>
                    <div className="ataas-user-toolbar ataas-api-key-toolbar ataas-deploy-list-toolbar">
                      <Input.Search className="ataas-deploy-list-search ataas-user-search" placeholder="名称/备注查询" value={userSearchText} onChange={(e) => setUserSearchText(e.target.value)} allowClear size="middle" />
                      <div className="ataas-api-key-toolbar-spacer" />
                      <Button className="ataas-deploy-create-button" type="primary" onClick={() => openCreateUser('user')}>新建普通用户</Button>
                      <Button className="ataas-deploy-create-button" type="primary" onClick={() => openCreateUser('admin')}>新建管理员</Button>
                    </div>
                    <div className="ataas-deploy-table-wrap ataas-api-key-table-wrap ataas-user-table-wrap">
                      <Table
                        dataSource={filteredUsers}
                        rowKey="key"
                        columns={userColumns}
                        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条`, showSizeChanger: false }}
                      />
                    </div>
                  </div>
                  <Modal
                    title={userCreateRole === 'admin' ? '新建管理员' : '新建普通用户'}
                    open={userCreateOpen}
                    onCancel={() => setUserCreateOpen(false)}
                    onOk={createUser}
                    okText="确定"
                    cancelText="取消"
                    width={520}
                    className="ataas-user-create-modal"
                  >
                    <Form form={userForm} layout="vertical" className="ataas-user-form">
                      <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="请输入用户名" />
                      </Form.Item>
                      <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password placeholder="请输入密码" />
                      </Form.Item>
                      <Form.Item label="备注" name="remark" rules={[{ required: true, message: '请输入备注' }]}>
                        <Input placeholder="请输入备注" />
                      </Form.Item>
                    </Form>
                  </Modal>
                </ConfigProvider>
              </div>
            );
          }
      case 'engines': {
            const filteredEngines = engineList.filter((item) => {
              if (!engineSearchText.trim()) return true;
              const keyword = engineSearchText.trim().toLowerCase();
              return item.name.toLowerCase().includes(keyword) || item.engine.toLowerCase().includes(keyword) || item.version.toLowerCase().includes(keyword);
            });
            const engineColumns: ColumnsType<EngineManageRecord> = [
              { title: '引擎名称', dataIndex: 'name', key: 'name', width: 210, render: (value) => <strong className="ataas-api-key-name">{value}</strong> },
              { title: '版本号', dataIndex: 'version', key: 'version', width: 110 },
              { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (value) => <span className={'ataas-engine-status-text ' + (value === 'normal' ? 'normal' : 'error')}>{value === 'normal' ? '正常' : '异常'}</span> },
              { title: '使用平台', dataIndex: 'platform', key: 'platform', width: 110 },
              { title: '支持显存类型', dataIndex: 'gpuTypes', key: 'gpuTypes', width: 140, render: (value: string[]) => value.join('、') || '-' },
              { title: '类型', dataIndex: 'type', key: 'type', width: 110 },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
              { title: '操作', key: 'action', width: 110, fixed: 'right', render: (_, record) => (
                <div className="ataas-engine-row-actions">
                  <Tooltip title="查看详情">
                    <Button className="ataas-engine-icon-action" size="small" icon={<EyeOutlined />} onClick={() => setEngineDetailRecord(record)} />
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button className="ataas-engine-icon-action" size="small" danger icon={<DeleteOutlined />} onClick={() => {
                    setEngineList((prev) => prev.filter((item) => item.key !== record.key));
                    setEngineSelectedRowKeys((prev) => prev.filter((key) => key !== record.key));
                    message.success('已删除引擎');
                    }} />
                  </Tooltip>
                </div>
              ) },
            ];
            const createEngine = async () => {
              const values = await engineCreateForm.validateFields();
              const now = '2026-06-03 14:30:00Z';
              if (engineEditingRecord) {
                const updated: EngineManageRecord = {
                  ...engineEditingRecord,
                  name: values.name,
                  engine: values.engine,
                  version: values.version,
                  platform: values.platform,
                  gpuTypes: values.gpuTypes || [],
                  description: values.description || '',
                  imageName: values.imageName,
                  startCommand: values.startCommand,
                  params: values.params || '[]',
                  updatedAt: now,
                };
                setEngineList((prev) => prev.map((item) => item.key === updated.key ? updated : item));
                setEngineDetailRecord(updated);
                setEngineEditingRecord(null);
                message.success('引擎已更新');
              } else {
                const record: EngineManageRecord = {
                  key: `engine-${Date.now()}`,
                  name: values.name,
                  engine: values.engine,
                  version: values.version,
                  status: 'normal',
                  platform: values.platform,
                  gpuTypes: values.gpuTypes || [],
                  type: '用户上传',
                  description: values.description || '',
                  imageName: values.imageName,
                  startCommand: values.startCommand,
                  params: values.params || '[]',
                  createdAt: now,
                  updatedAt: now,
                  exceptionInfo: '-',
                  relatedModels: [],
                };
                setEngineList((prev) => [record, ...prev]);
                message.success('引擎已创建');
              }
              engineCreateForm.resetFields();
              setEngineCreateOpen(false);
            };
            const openCreateEngineDrawer = () => {
              setEngineEditingRecord(null);
              engineCreateForm.resetFields();
              setEngineCreateOpen(true);
            };
            const openEditEngineDrawer = (record: EngineManageRecord) => {
              setEngineEditingRecord(record);
              engineCreateForm.setFieldsValue({
                name: record.name,
                engine: record.engine,
                version: record.version,
                platform: record.platform,
                imageName: record.imageName,
                startCommand: record.startCommand,
                params: record.params,
                gpuTypes: record.gpuTypes,
                description: record.description,
              });
              setEngineCreateOpen(true);
            };
            const updateDetailRelatedModels = (models: string[]) => {
              if (!engineDetailRecord) return;
              setEngineDetailRecord({ ...engineDetailRecord, relatedModels: models });
              setEngineList((prev) => prev.map((item) => item.key === engineDetailRecord.key ? { ...item, relatedModels: models } : item));
            };
            const DetailItem = ({ label, children }: { label: string; children: ReactNode }) => (
              <div className="ataas-engine-detail-item">
                <span>{label}</span>
                <strong>{children}</strong>
              </div>
            );
            return (
              <div className="ataas-section-stack">
                <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
                  <div className="ataas-panel ataas-api-key-page ataas-engine-page ataas-deploy-list">
                    <div className="ataas-panel-head ataas-api-key-head">
                      <div>
                        <h2>引擎管理</h2>
                      </div>
                    </div>
                    <div className="ataas-engine-filter">
                      <div className="ataas-api-key-toolbar ataas-deploy-list-toolbar">
                        <Input.Search className="ataas-deploy-list-search ataas-api-key-search" placeholder="请输入引擎名称" value={engineSearchText} onChange={(e) => setEngineSearchText(e.target.value)} allowClear size="middle" />
                        <Button disabled={engineSelectedRowKeys.length === 0} icon={<DeleteOutlined />} onClick={() => {
                          setEngineList((prev) => prev.filter((item) => !engineSelectedRowKeys.includes(item.key)));
                          setEngineSelectedRowKeys([]);
                          message.success('已批量删除');
                        }}>批量删除</Button>
                        <div className="ataas-api-key-toolbar-spacer" />
                        <Button className="ataas-deploy-create-button" type="primary" icon={<PlusOutlined />} onClick={openCreateEngineDrawer}>创建引擎</Button>
                      </div>
                    </div>
                    <div className="ataas-deploy-table-wrap ataas-api-key-table-wrap ataas-engine-table-wrap">
                      <Table
                        dataSource={filteredEngines}
                        rowKey="key"
                        columns={engineColumns}
                        rowSelection={{
                          selectedRowKeys: engineSelectedRowKeys,
                          onChange: (keys) => setEngineSelectedRowKeys(keys as string[]),
                        }}
                        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个引擎`, showSizeChanger: true }}
                      />
                    </div>
                  </div>
                  <Drawer
                    title={engineEditingRecord ? '编辑引擎' : '创建引擎'}
                    open={engineCreateOpen}
                    onClose={() => { setEngineCreateOpen(false); setEngineEditingRecord(null); engineCreateForm.resetFields(); }}
                    width={560}
                    className="ataas-engine-drawer"
                    footer={<div className="ataas-drawer-footer"><Button onClick={() => { setEngineCreateOpen(false); setEngineEditingRecord(null); engineCreateForm.resetFields(); }}>取消</Button><Button type="primary" onClick={createEngine}>确定</Button></div>}
                  >
                    <Form form={engineCreateForm} layout="vertical" className="ataas-engine-form">
                      <Form.Item label="引擎名称" name="name" rules={[{ required: true, message: '请输入引擎名称' }]}>
                        <Input placeholder="请输入引擎名称" maxLength={50} showCount />
                      </Form.Item>
                      <div className="ataas-engine-form-grid">
                        <Form.Item label="引擎" name="engine" rules={[{ required: true, message: '请选择引擎' }]}>
                          <Select placeholder="请选择引擎" options={['vllm', 'sglang', 'transformers', 'ftransformers', 'ktransformers', 'llama-box', 'vox-box'].map((value) => ({ value, label: value }))} />
                        </Form.Item>
                        <Form.Item label="引擎版本号" name="version" rules={[{ required: true, message: '请输入版本号' }]}>
                          <Input placeholder="例如：v1.0.0" maxLength={50} showCount />
                        </Form.Item>
                      </div>
                      <Form.Item label="引擎运行平台" name="platform" rules={[{ required: true, message: '请选择运行平台' }]}>
                        <Select placeholder="请选择引擎运行平台" options={[{ value: 'amd64', label: 'amd64' }, { value: 'arm64', label: 'arm64' }]} />
                      </Form.Item>
                      <Form.Item label="引擎镜像名称" name="imageName" rules={[{ required: true, message: '请选择引擎镜像名称' }]}>
                        <Select placeholder="请选择引擎镜像名称" showSearch options={images.filter((item) => item.section === '引擎镜像').map((item) => ({ value: item.tag, label: item.tag }))} />
                      </Form.Item>
                      <Form.Item label="引擎启动命令" name="startCommand" rules={[{ required: true, message: '请输入启动命令' }]}>
                        <Input placeholder="请输入启动命令，例如：python server.py --port 8080" maxLength={200} showCount />
                      </Form.Item>
                      <Form.Item label="引擎参数" name="params">
                        <Input.TextArea rows={4} placeholder="请输入引擎参数，支持填写 JSON 参数" />
                      </Form.Item>
                      <Form.Item label="引擎支持 GPU 类型列表" name="gpuTypes" rules={[{ required: true, message: '请选择 GPU 类型' }]}>
                        <Select mode="tags" placeholder="请输入或选择 GPU 类型" options={['RTX_4090', 'A100', 'H20', 'L20', 'Ascend 910B'].map((value) => ({ value, label: value }))} />
                      </Form.Item>
                      <Form.Item label="引擎描述" name="description">
                        <Input.TextArea rows={3} placeholder="请输入引擎描述" />
                      </Form.Item>
                    </Form>
                  </Drawer>
                  <Drawer
                    title={<div><strong>引擎详情</strong><span>查看引擎配置、状态信息及模型关联关系</span></div>}
                    open={!!engineDetailRecord}
                    onClose={() => setEngineDetailRecord(null)}
                    width={640}
                    className="ataas-engine-drawer ataas-engine-detail-drawer"
                    footer={<div className="ataas-drawer-footer"><Button onClick={() => setEngineDetailRecord(null)}>关闭</Button><Button type="primary" onClick={() => { if (engineDetailRecord) openEditEngineDrawer(engineDetailRecord); }}>编辑引擎</Button></div>}
                  >
                    {engineDetailRecord && (
                      <div className="ataas-engine-detail">
                        <div className="ataas-engine-detail-section-title">引擎配置信息</div>
                        <div className="ataas-engine-detail-card">
                          <DetailItem label="引擎名称">{engineDetailRecord.name}</DetailItem>
                          <DetailItem label="引擎版本号">{engineDetailRecord.version}</DetailItem>
                          <DetailItem label="引擎使用平台">{engineDetailRecord.platform}</DetailItem>
                          <DetailItem label="引擎支持显存类型">{engineDetailRecord.gpuTypes.join('、') || '-'}</DetailItem>
                          <DetailItem label="引擎类型">{engineDetailRecord.type}</DetailItem>
                          <DetailItem label="引擎描述"><div className="ataas-engine-detail-box">{engineDetailRecord.description || '-'}</div></DetailItem>
                          <DetailItem label="引擎镜像名称">{engineDetailRecord.imageName}</DetailItem>
                          <DetailItem label="引擎启动运行命令"><Tooltip title={engineDetailRecord.startCommand}><span className="ataas-engine-ellipsis">{engineDetailRecord.startCommand}</span></Tooltip></DetailItem>
                          <DetailItem label="引擎参数"><pre className="ataas-engine-detail-box">{engineDetailRecord.params || '[]'}</pre></DetailItem>
                          <DetailItem label="引擎状态"><span className={'ataas-engine-status-text ' + (engineDetailRecord.status === 'normal' ? 'normal' : 'error')}>{engineDetailRecord.status === 'normal' ? '正常' : '异常'}</span></DetailItem>
                          <div className="ataas-engine-detail-subtitle">引擎异常信息</div>
                          <DetailItem label="引擎异常信息">{engineDetailRecord.exceptionInfo || '-'}</DetailItem>
                          <DetailItem label="引擎创建时间">{engineDetailRecord.createdAt}</DetailItem>
                          <DetailItem label="引擎更新时间">{engineDetailRecord.updatedAt}</DetailItem>
                        </div>
                        <div className="ataas-engine-relation-head">
                          <div>
                            <h3>引擎与模型关联关系</h3>
                            <span>支持同时选择多个模型</span>
                          </div>
                        </div>
                        <div className="ataas-engine-relation-card">
                          <div className="ataas-engine-relation-label">
                            <strong>模型选择</strong>
                            <span>支持同时选择多个模型</span>
                          </div>
                          <div className="ataas-engine-model-box">
                            {engineDetailRecord.relatedModels.length > 0 ? engineDetailRecord.relatedModels.map((model) => (
                              <Tag key={model} closable onClose={() => updateDetailRelatedModels(engineDetailRecord.relatedModels.filter((item) => item !== model))}>{model}</Tag>
                            )) : <span className="ataas-engine-model-empty">暂无关联模型</span>}
                          </div>
                          <div className="ataas-engine-relation-actions">
                            <Select
                              mode="multiple"
                              placeholder="选择要添加的模型"
                              value={engineAddModelValue}
                              onChange={setEngineAddModelValue}
                              options={modelRepoData.map((item) => ({ value: item.name, label: item.name }))}
                            />
                            <Button onClick={() => updateDetailRelatedModels([])}>清空模型</Button>
                            <Button type="primary" onClick={() => {
                              updateDetailRelatedModels([...new Set([...engineDetailRecord.relatedModels, ...engineAddModelValue])]);
                              setEngineAddModelValue([]);
                            }}>添加模型</Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Drawer>
                </ConfigProvider>
              </div>
            );
          }
      case 'themeSettings': {
            const renderThemeAsset = (item: typeof themeAssetFields[number]) => (
              <div className="ataas-theme-asset-card" key={item.key}>
                <div className={'ataas-theme-asset-preview ' + item.shape}>
                  <img src={String(themeSettings[item.key])} alt={item.label} />
                </div>
                <div className="ataas-theme-asset-info">
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                  <Upload
                    accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.svg"
                    showUploadList={false}
                    beforeUpload={(file) => handleThemeAssetUpload(item.key, file)}
                  >
                    <Button icon={<UploadOutlined />}>更换图片</Button>
                  </Upload>
                </div>
              </div>
            );
            return (
              <div className="ataas-section-stack">
                <ConfigProvider theme={{ token: { colorPrimary: themeSettings.colorPrimary, colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
                  <div className="ataas-panel ataas-theme-page">
                    <div className="ataas-panel-head ataas-theme-head">
                      <div>
                        <h2>主题管理</h2>
                        <span>统一配置平台品牌、主题色和登录页展示内容。</span>
                      </div>
                      <div className="ataas-theme-actions">
                        <Button onClick={resetThemeSettings}>恢复默认</Button>
                        <Button type="primary" onClick={saveThemeSettings}>保存配置</Button>
                      </div>
                    </div>

                    <div className="ataas-theme-layout">
                      <div className="ataas-theme-main">
                        <section className="ataas-theme-section">
                          <div className="ataas-theme-section-title">
                            <strong>基础设置</strong>
                            <span>控制平台主色和浏览器窗口标题</span>
                          </div>
                          <div className="ataas-theme-basic-grid">
                            <label className="ataas-theme-field">
                              <span>主题色</span>
                              <div className="ataas-theme-color-row">
                                <Input value={themeSettings.colorPrimary} onChange={(event) => updateThemeSetting('colorPrimary', event.target.value)} />
                                <ColorPicker value={themeSettings.colorPrimary} onChange={(value) => updateThemeSetting('colorPrimary', '#' + value.toHex())} />
                              </div>
                            </label>
                            <label className="ataas-theme-field wide">
                              <span>页面标题</span>
                              <Input value={themeSettings.pageTitle} onChange={(event) => updateThemeSetting('pageTitle', event.target.value)} />
                            </label>
                          </div>
                        </section>

                        <section className="ataas-theme-section">
                          <div className="ataas-theme-section-title">
                            <strong>品牌资源</strong>
                            <span>用于窗口、导航栏和登录页的图形资源</span>
                          </div>
                          <div className="ataas-theme-assets-grid">
                            {themeAssetFields.map(renderThemeAsset)}
                          </div>
                        </section>

                        <section className="ataas-theme-section">
                          <div className="ataas-theme-section-title">
                            <strong>登录页文案</strong>
                            <span>控制登录页左侧标题、副标题和底部文字</span>
                          </div>
                          <div className="ataas-theme-copy-grid">
                            <label className="ataas-theme-field wide">
                              <span>登录左侧顶部标题</span>
                              <Input value={themeSettings.loginHeroTitle} onChange={(event) => updateThemeSetting('loginHeroTitle', event.target.value)} />
                            </label>
                            <label className="ataas-theme-field wide">
                              <span>登录左侧副标题</span>
                              <Input value={themeSettings.loginHeroSubtitle} onChange={(event) => updateThemeSetting('loginHeroSubtitle', event.target.value)} />
                            </label>
                            <label className="ataas-theme-field">
                              <span>主标题文字颜色</span>
                              <div className="ataas-theme-color-row">
                                <Input value={themeSettings.loginTitleColor} onChange={(event) => updateThemeSetting('loginTitleColor', event.target.value)} />
                                <ColorPicker value={themeSettings.loginTitleColor} onChange={(value) => updateThemeSetting('loginTitleColor', '#' + value.toHex())} />
                              </div>
                            </label>
                            <label className="ataas-theme-field">
                              <span>副标题文字颜色</span>
                              <div className="ataas-theme-color-row">
                                <Input value={themeSettings.loginSubtitleColor} onChange={(event) => updateThemeSetting('loginSubtitleColor', event.target.value)} />
                                <ColorPicker value={themeSettings.loginSubtitleColor} onChange={(value) => updateThemeSetting('loginSubtitleColor', '#' + value.toHex())} />
                              </div>
                            </label>
                            <label className="ataas-theme-field wide">
                              <span>登录底部文字</span>
                              <Input value={themeSettings.loginFooterText} onChange={(event) => updateThemeSetting('loginFooterText', event.target.value)} />
                            </label>
                          </div>
                        </section>
                      </div>

                      <aside className="ataas-theme-preview">
                        <div className="ataas-theme-preview-title">
                          <strong>效果预览</strong>
                          <span>{themeSettings.pageTitle}</span>
                        </div>
                        <div className="ataas-theme-login-preview" style={{ backgroundImage: `linear-gradient(180deg, rgba(25, 20, 42, 0.1), rgba(25, 20, 42, 0.46)), url(${themeSettings.loginBackground})` }}>
                          <img className="ataas-theme-preview-top-logo" src={themeSettings.loginTopLogo} alt="" />
                          <div className="ataas-theme-preview-center">
                            <img src={themeSettings.loginCenterLogo} alt="" />
                            <h3 style={{ color: themeSettings.loginTitleColor }}>{themeSettings.loginHeroTitle}</h3>
                            <p style={{ color: themeSettings.loginSubtitleColor }}>{themeSettings.loginHeroSubtitle}</p>
                          </div>
                          <span className="ataas-theme-preview-footer">{themeSettings.loginFooterText}</span>
                        </div>
                        <div className="ataas-theme-sidebar-preview">
                          <div className="ataas-theme-sidebar-preview-head">
                            <img src={themeSettings.layoutLogo} alt="" />
                          </div>
                          <div className="ataas-theme-sidebar-preview-item active" style={{ color: themeSettings.colorPrimary }}>
                            <SidebarIcon name="dashboard" />
                            <span>数据概览</span>
                          </div>
                          <div className="ataas-theme-sidebar-preview-item">
                            <SidebarIcon name="deploy" />
                            <span>模型部署</span>
                          </div>
                          <div className="ataas-theme-sidebar-preview-item">
                            <SidebarIcon name="monitor" />
                            <span>模型监控</span>
                          </div>
                        </div>
                      </aside>
                    </div>
                  </div>
                </ConfigProvider>
              </div>
            );
          }
      case 'apiKeys': {
            const filteredApiKeys = apiKeyList.filter((item) => {
              if (!apiKeySearchText.trim()) return true;
              const keyword = apiKeySearchText.trim().toLowerCase();
              return item.name.toLowerCase().includes(keyword) || item.description.toLowerCase().includes(keyword) || item.token.toLowerCase().includes(keyword);
            });
            const apiKeyColumns: ColumnsType<typeof apiKeyList[number]> = [
              { title: '名称', dataIndex: 'name', key: 'name', render: (value) => <strong className="ataas-api-key-name">{value}</strong> },
              { title: '描述', dataIndex: 'description', key: 'description', render: (value) => value || '-' },
              { title: 'Key', dataIndex: 'token', key: 'token', render: (value) => <span className="ataas-api-key-token">{value}</span> },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', sorter: (a, b) => a.createdAt.localeCompare(b.createdAt) },
              { title: '过期时间', dataIndex: 'expiresAt', key: 'expiresAt', sorter: (a, b) => a.expiresAt.localeCompare(b.expiresAt) },
              { title: '操作', key: 'action', width: 140, render: (_, record) => (
                <div className="ataas-table-actions">
                  <Button type="link" size="small" onClick={() => message.success('已复制 API Key')}>复制</Button>
                  <Button type="link" size="small" danger onClick={() => setApiKeyList((prev) => prev.filter((item) => item.key !== record.key))}>删除</Button>
                </div>
              ) },
            ];
            const createApiKey = async () => {
              const values = await apiKeyForm.validateFields();
              const now = '2026-06-03 14:30:00';
              setApiKeyList((prev) => [
                {
                  key: `ak-${Date.now()}`,
                  name: values.name,
                  description: values.description || '-',
                  token: `sk-ataa-${Math.random().toString(36).slice(2, 8)}••••••••••••${Math.random().toString(36).slice(2, 6)}`,
                  createdAt: now,
                  expiresAt: values.expiresAt || '永久有效',
                },
                ...prev,
              ]);
              apiKeyForm.resetFields();
              setApiKeyCreateOpen(false);
              message.success('API Key 已创建');
            };
            return (
              <div className="ataas-section-stack">
                <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
                  <div className="ataas-panel ataas-api-key-page ataas-deploy-list">
                    <div className="ataas-panel-head ataas-api-key-head">
                      <div>
                        <h2>API Key</h2>
                        <span>API Key 用于大模型服务和工具调用鉴权，请妥善保管并定期更换。</span>
                      </div>
                    </div>
                    <div className="ataas-api-key-toolbar ataas-deploy-list-toolbar">
                      <Input.Search className="ataas-deploy-list-search ataas-api-key-search" placeholder="请输入名称" value={apiKeySearchText} onChange={(e) => setApiKeySearchText(e.target.value)} allowClear size="middle" />
                      <div className="ataas-api-key-toolbar-spacer" />
                      <Button className="ataas-square-icon-button" icon={<ReloadOutlined />} onClick={() => message.success('已刷新')} />
                      <Button className="ataas-deploy-create-button" type="primary" icon={<PlusOutlined />} onClick={() => setApiKeyCreateOpen(true)}>创建 API Key</Button>
                    </div>
                    <div className="ataas-deploy-table-wrap ataas-api-key-table-wrap">
                      <Table
                        dataSource={filteredApiKeys}
                        rowKey="key"
                        columns={apiKeyColumns}
                        pagination={filteredApiKeys.length > 0 ? { pageSize: 10, showTotal: (total) => `共 ${total} 个 API Key`, showSizeChanger: true } : false}
                        locale={{
                          emptyText: (
                            <div className="ataas-api-key-empty">
                              <div className="ataas-api-key-empty-icon"><FileSearchOutlined /></div>
                              <strong>暂未创建任何 API Key</strong>
                              <Button type="link" icon={<PlusOutlined />} onClick={() => setApiKeyCreateOpen(true)}>立即创建</Button>
                            </div>
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <Modal title="创建 API Key" open={apiKeyCreateOpen} onCancel={() => setApiKeyCreateOpen(false)} onOk={createApiKey} okText="创建" cancelText="取消" width={480}>
                    <Form form={apiKeyForm} layout="vertical">
                      <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入 API Key 名称' }]}>
                        <Input placeholder="请输入名称" />
                      </Form.Item>
                      <Form.Item label="说明" name="description">
                        <Input.TextArea rows={3} placeholder="可选，用于标记用途" />
                      </Form.Item>
                      <Form.Item label="过期时间" name="expiresAt" initialValue="永久有效">
                        <Select options={[
                          { value: '永久有效', label: '永久有效' },
                          { value: '7 天后', label: '7 天后' },
                          { value: '30 天后', label: '30 天后' },
                          { value: '90 天后', label: '90 天后' },
                        ]} />
                      </Form.Item>
                    </Form>
                  </Modal>
                </ConfigProvider>
              </div>
	            );
	          }
      case 'containerManagement': return <ContainerManagementPage onNavigateToNodeManagement={(nodeName) => { setSelectedClusterKey('all'); setClusterNodeSearch(nodeName); setActiveTab('clusters'); setClusterPanel('nodes'); }} />;
      case 'routeWorkbench': return <RouteWorkbenchPage onNavigateToNodeManagement={(clusterKey) => { setSelectedClusterKey(clusterKey || 'all'); setActiveTab('clusters'); setClusterPanel('nodes'); }} />;
      case 'taskFlow': return (
        <div className="ataas-b300-task-page">
          <TasksPage />
        </div>
      );
	      case 'configCenter': return (
        <div className="ataas-config-migrated">
          <ConfigsPage />
        </div>
      );
      default: return null;
    }
  };
  return (
    <div className="ataas-page">
      <div className="ataas-body">
        <div className="ataas-sidebar">
          <div className="ataas-sidebar-header"><img className="ataas-sidebar-logo" src={ataasLogo} alt="ATaaS" /></div>
          <div className="ataas-sidebar-nav">
            {SIDEBAR_GROUPS.map((group) => (
              <div key={group.title || 'overview'} className="ataas-sidebar-group">
                {group.title && (
                  <div className="ataas-sidebar-group-title" onClick={() => toggleGroup(group.title || 'overview')}>
                    <span>{group.title}</span>
                    <DownOutlined className={'ataas-sidebar-group-arrow' + (expandedGroups.has(group.title || 'overview') ? '' : ' collapsed')} />
                  </div>
                )}
                {expandedGroups.has(group.title || 'overview') && group.items.map((item) => (
                  <div key={item.key} className={'ataas-sidebar-item' + (activeTab === item.key ? ' active' : '')} onClick={() => {
                    setActiveTab(item.key);
	                    if (item.key === 'modelOps') setModelOpsSelectedServiceId(null);
	                    if (item.key === 'clusters') setClusterPanel('clusters');
	                    if (item.key === 'nodes') setClusterPanel('nodes');
	                    const pathMap: Record<string, string> = {
	                      containerManagement: '/containers',
	                      routeWorkbench: '/route-workbench',
	                      taskFlow: '/task-flow',
	                      benchmark: '/benchmark',
                      playgroundChat: '/playground/chat',
                      playgroundVisual: '/playground/visual',
                      playgroundEmbedding: '/playground/embedding',
                      playgroundRerank: '/playground/rerank',
                    };
                    window.history.replaceState(null, '', pathMap[item.key] || '/');
                  }}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                ))}
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
                  <button type="button" onClick={() => {
                    setActiveTab('themeSettings');
                    window.history.replaceState(null, '', '/');
                  }}>主题管理</button>
                  <button type="button" onClick={() => message.info('设置')}>设置</button>
                  <button type="button" onClick={() => message.info('退出登录')}>退出登录</button>
                </div>
              )}
            >
              <button className="ataas-sidebar-user-setting" type="button" aria-label="用户设置"><SettingOutlined /></button>
            </Popover>
          </div>
        </div>
        <div className={'ataas-content' + (activeTab === 'configCenter' ? ' ataas-content-config' : '')} ref={contentRef}>
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
                className={'ataas-cluster-picker-item' + (active ? ' active' : '') + (overviewClusterSlots.includes(cluster.key) ? ' selected' : '')}
                disabled={overviewClusterSlots.includes(cluster.key)}
                onClick={() => {
                  if (overviewClusterPickerSlot !== null && !overviewClusterSlots.includes(cluster.key)) {
                    setOverviewClusterSlots((prev) => prev.map((key, index) => (index === overviewClusterPickerSlot ? cluster.key : key)));
                  }
                  setOverviewClusterPickerOpen(false);
                  setOverviewClusterPickerSlot(null);
                }}
              >
                <div>
                  <strong>{cluster.name}</strong>
                  {overviewClusterSlots.includes(cluster.key) && <span style={{ fontSize: 11, color: '#3370FF', marginLeft: 8 }}>已选择</span>}
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
        title="编辑备注"
        open={!!clusterNodeEditTarget}
        onCancel={() => { setClusterNodeEditTarget(null); setClusterNodeEditRemark(''); }}
        onOk={() => {
          if (clusterNodeEditTarget) {
            const nextRemark = clusterNodeEditRemark.trim().slice(0, 20);
            setClusterNodeList((prev) => prev.map((node) => node.key === clusterNodeEditTarget.key ? { ...node, remark: nextRemark } : node));
            if (clusterNodeRecord?.key === clusterNodeEditTarget.key) setClusterNodeRecord({ ...clusterNodeRecord, remark: nextRemark });
          }
          setClusterNodeEditTarget(null);
          setClusterNodeEditRemark('');
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input
          value={clusterNodeEditRemark}
          onChange={(e) => setClusterNodeEditRemark(e.target.value.slice(0, 20))}
          placeholder="请输入备注，20个字以内"
          maxLength={20}
          showCount
        />
      </Modal>

      <Modal
        title="编辑标签"
        open={!!clusterNodeLabelEditTarget}
        onCancel={() => { setClusterNodeLabelEditTarget(null); setClusterNodeEditLabel(''); }}
        onOk={() => {
          if (clusterNodeLabelEditTarget) {
            const nextLabel = clusterNodeEditLabel.trim() || '-';
            setClusterNodeList((prev) => prev.map((node) => node.key === clusterNodeLabelEditTarget.key ? { ...node, label: nextLabel } : node));
            if (clusterNodeRecord?.key === clusterNodeLabelEditTarget.key) setClusterNodeRecord({ ...clusterNodeRecord, label: nextLabel });
          }
          setClusterNodeLabelEditTarget(null);
          setClusterNodeEditLabel('');
        }}
        okText="确认"
        cancelText="取消"
      >
        <Input value={clusterNodeEditLabel} onChange={(e) => setClusterNodeEditLabel(e.target.value)} placeholder="请输入节点标签，例如 GPU=H20" />
      </Modal>

      <Modal
        className="ataas-node-gpu-auth-modal"
        title="节点授权显卡"
        open={!!nodeGpuAuthTarget}
        onCancel={() => { setNodeGpuAuthTarget(null); setNodeGpuAuthKeys([]); }}
        onOk={() => {
          if (nodeGpuAuthTarget) {
            setNodeGpuAuthMap((prev) => ({ ...prev, [nodeGpuAuthTarget.key]: nodeGpuAuthKeys.map(String) }));
            message.success(`${nodeGpuAuthTarget.name} 显卡授权已更新`);
          }
          setNodeGpuAuthTarget(null);
          setNodeGpuAuthKeys([]);
        }}
        okText="确认"
        cancelText="取消"
        width={760}
      >
        <Transfer
          className="ataas-node-gpu-auth-transfer"
          dataSource={(nodeGpuAuthTarget?.gpuCards || []).map((card) => ({
            key: String(card.index),
            title: `${card.model.startsWith('NVIDIA') ? card.model : 'NVIDIA GeForce ' + card.model} #${card.index}`,
          }))}
          targetKeys={nodeGpuAuthKeys}
          onChange={(nextTargetKeys) => setNodeGpuAuthKeys(nextTargetKeys)}
          render={(item) => item.title}
          titles={['未授权显卡', '授权显卡']}
          listStyle={{ width: 280, height: 420 }}
          operations={['>', '<']}
          selectAllLabels={[
            ({ selectedCount, totalCount }) => `${selectedCount} / ${totalCount} 项`,
            ({ selectedCount, totalCount }) => `${selectedCount} / ${totalCount} 项`,
          ]}
        />
      </Modal>

      <Modal title="集群认证" open={clusterTokenOpen} onCancel={() => setClusterTokenOpen(false)} onOk={() => setClusterTokenOpen(false)}><Input.TextArea rows={4} value={clusterTokenText} onChange={(e) => setClusterTokenText(e.target.value)} /></Modal>

      <Modal title="更新 Token" open={clusterKeyEditOpen} onCancel={() => { setClusterKeyEditOpen(false); setClusterKeyYamlValue(''); }} onOk={() => { if (clusterKeyEditTarget) { message.success('集群 ' + clusterKeyEditTarget.name + ' Token 已更新'); } setClusterKeyEditOpen(false); }} okButtonProps={{ className: 'ataas-modal-primary-button' }} width={560}>
        <Form layout="vertical" className="ataas-basic-form">
          <Form.Item label="Token" required>
            <Input.TextArea rows={4} placeholder="粘贴集群 Token（Base64 编码）" value={clusterKeyYamlValue} onChange={(e) => setClusterKeyYamlValue(e.target.value)} />
          </Form.Item>
        </Form>
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

      <Modal title="告警详情" open={!!alertDetailRecord} onCancel={() => setAlertDetailRecord(null)} footer={null} width={520}>
        {alertDetailRecord && (
          <div className="ataas-alert-detail">
            <div className="ataas-alert-detail-head">
              <div>
                <span>告警对象</span>
                <strong>{alertDetailRecord.target}</strong>
              </div>
              <div className="ataas-alert-detail-badges">
                <span className={`ataas-alert-detail-level ${alertLevelMeta[alertDetailRecord.level]?.tone || 'info'}`}>{alertLevelMeta[alertDetailRecord.level]?.label || alertDetailRecord.level}</span>
                <span className={`ataas-alert-detail-status ${alertDetailRecord.status === '已恢复' ? 'restored' : 'pending'}`}>{alertDetailRecord.status}</span>
              </div>
            </div>
            <div className="ataas-alert-detail-grid">
              <div><span>对象类型</span><strong>{alertDetailRecord.objectType}</strong></div>
              <div><span>所属集群</span><strong>{alertDetailRecord.cluster}</strong></div>
              <div><span>发生时间</span><strong>{alertDetailRecord.time}</strong></div>
              <div><span>发生次数</span><strong>{alertDetailRecord.count} 次</strong></div>
            </div>
            <div className="ataas-alert-detail-section">
              <span>问题描述</span>
              <p>{alertDetailRecord.description}</p>
            </div>
            <div className="ataas-alert-detail-section suggestion">
              <span>处置建议</span>
              <p>{alertDetailRecord.suggestion === '-' ? '暂无处置建议' : alertDetailRecord.suggestion}</p>
            </div>
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

      <Drawer title="导入私有模型" open={modelRepoImportOpen} onClose={() => setModelRepoImportOpen(false)} width={560} className="ataas-private-model-drawer">
        <Form layout="vertical" className="ataas-private-model-form">
          <Form.Item label="模型路径" name="modelPath" rules={[{ required: true, message: '请输入模型路径' }]}>
            <Input placeholder="请输入模型相对路径，例如 qwen2.5" />
          </Form.Item>
          <Form.Item label="模型名称" name="modelName" rules={[{ required: true, message: '请输入模型名称' }]}>
            <Input placeholder="请输入模型名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item label="模型描述" name="description" rules={[{ required: true, message: '请输入模型描述' }]}>
            <Input.TextArea rows={3} placeholder="请输入模型描述" maxLength={200} showCount />
          </Form.Item>
          <Form.Item label="选择引擎" required>
            <div className="ataas-private-engine-box">
              <div className="ataas-private-engine-row">
                <Select placeholder="请选择引擎" options={engineManageSeed.map((item) => ({ value: item.engine, label: item.engine }))} />
                <Select placeholder="请选择版本" options={engineManageSeed.map((item) => ({ value: item.version, label: item.version }))} />
                <Button type="text" icon={<DeleteOutlined />} />
              </div>
              <Button type="link" icon={<PlusOutlined />} className="ataas-private-engine-add">添加引擎（1 / 10）</Button>
            </div>
          </Form.Item>
          <Form.Item label="供应商名称" name="vendor" rules={[{ required: true, message: '请输入供应商名称' }]}>
            <Input placeholder="请输入供应商名称，例如 通义" />
          </Form.Item>
          <Form.Item label="供应商图标" name="vendorLogo">
            <Upload listType="picture-card" maxCount={1} showUploadList={false} beforeUpload={() => false}>
              <div className="ataas-private-logo-upload"><PlusOutlined /></div>
            </Upload>
          </Form.Item>
          <Form.Item label="模型类型" name="modelType" rules={[{ required: true, message: '请选择模型类型' }]}>
            <Select placeholder="请选择模型类型" options={[{ value: 'llm', label: '文本模型' }, { value: 'embedding', label: '嵌入模型' }, { value: 'rerank', label: '排序模型' }, { value: 'vlm', label: '多模态模型' }]} />
          </Form.Item>
          <Form.Item label="参数" name="params" rules={[{ required: true, message: '请输入参数规模' }]}>
            <Input placeholder="例如 671" suffix="B" />
          </Form.Item>
          <Form.Item label="上下文长度" name="contextLength" rules={[{ required: true, message: '请输入上下文长度' }]}>
            <Input placeholder="例如 1024" suffix="Tokens" />
          </Form.Item>
          <Form.Item label="模型精度" name="precision" rules={[{ required: true, message: '请输入模型精度' }]}>
            <Input placeholder="例如 GPTQ-INT8" />
          </Form.Item>
          <Form.Item label="占用显存" name="vram" rules={[{ required: true, message: '请输入显存占用' }]}>
            <Input placeholder="显存占用" suffix="MB" />
          </Form.Item>
          <Form.Item label="磁盘占用" name="disk" rules={[{ required: true, message: '请输入磁盘占用' }]}>
            <Input placeholder="磁盘占用" suffix="GB" />
          </Form.Item>
          <div className="ataas-private-model-footer">
            <Button onClick={() => setModelRepoImportOpen(false)}>取消</Button>
            <Button type="primary" className="ataas-deploy-create-button" onClick={() => { message.success('私有模型导入任务已创建'); setModelRepoImportOpen(false); }}>添加</Button>
          </div>
        </Form>
      </Drawer>

      <Drawer title="模型任务" open={modelRepoTaskOpen} onClose={() => setModelRepoTaskOpen(false)} width={420}>
        <div className="ataas-model-task-drawer">
          {[
            ...(modelRepoDownloadTarget ? [{ name: modelRepoDownloadTarget.name, desc: '在线模型下载', status: '进行中', progress: 36 }] : []),
            { name: 'Qwen2.5-72B-Instruct', desc: '模型信息同步', status: '已完成', progress: 100 },
            { name: 'finance-risk-private-13B', desc: '私有模型导入', status: '进行中', progress: 64 },
            { name: 'BGE-Reranker-V2-M3', desc: '模型状态更新', status: '等待中', progress: 0 },
          ].map((task) => (
            <div key={`${task.name}-${task.desc}`} className="ataas-model-task-item">
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

      <Modal
        className="ataas-offline-download-modal"
        title="模型离线下载说明"
        open={!!modelRepoOfflineTarget}
        onCancel={() => setModelRepoOfflineTarget(null)}
        footer={<Button type="primary" className="ataas-deploy-create-button" onClick={() => setModelRepoOfflineTarget(null)}>关闭</Button>}
        width={720}
      >
        <p className="ataas-offline-download-desc">当前模型因网络原因无法在线下载，请按以下步骤进行离线下载</p>
        <div className="ataas-offline-download-steps">
          <div className="ataas-offline-step">
            <i />
            <div>
              <span>第一步</span>
              <p><Button type="link" onClick={() => message.success('模型下载脚本已获取')}>点击</Button>获取模型下载脚本，放到需要下载的文件夹</p>
            </div>
          </div>
          <div className="ataas-offline-step">
            <i />
            <div>
              <span>第二步</span>
              <p>打开模型下载位置的终端，粘贴以下命令并运行</p>
              <div className="ataas-offline-command">
                <pre>{`# 2-1
sudo bash download.sh
# 然后选择模型 ${modelRepoOfflineTarget?.name || 'model-name'}

# 2-2
sudo bash download.sh --update-model ${modelRepoOfflineTarget?.name || 'model-name'}`}</pre>
                <Button type="text" icon={<CopyOutlined />} onClick={() => message.success('命令已复制')} />
              </div>
            </div>
          </div>
          <div className="ataas-offline-step">
            <i />
            <div>
              <span>第三步</span>
              <p>点击模型仓库右上角的更新模型状态，确认离线模型已同步</p>
            </div>
          </div>
        </div>
      </Modal>

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
            <div className="ataas-startup-template-yaml-actions">
              <Upload.Dragger
                beforeUpload={(file) => {
                  if (!isYamlFile(file)) {
                    message.error('仅支持 .yaml / .yml 文件');
                    return Upload.LIST_IGNORE;
                  }
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
              <Tooltip title="从资源文件选择 YAML">
                <Button icon={<FileSearchOutlined />} onClick={() => openConfigYamlPicker('startup-template')}>从资源文件选择</Button>
              </Tooltip>
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

      <Modal
        className="ataas-config-yaml-picker-modal"
        title="从资源文件选择 YAML"
        open={configYamlPickerOpen}
        onCancel={() => { setConfigYamlPickerOpen(false); setConfigYamlPickerReadonly(false); }}
        width={1140}
        footer={(
          <div className="ataas-config-yaml-picker-footer">
            <span className="ataas-config-yaml-picker-warning"><WarningOutlined /> 部署时始终使用文件的最新内容，历史版本仅供参考对比</span>
            <div>
              {!configYamlPickerReadonly && <Button onClick={() => setConfigYamlPickerOpen(false)}>取消</Button>}
              <Button type="primary" disabled={!configYamlSelectedPath || !(configYamlLatest || configYamlPreview).trim()} onClick={applyConfigYamlSelection}>{configYamlPickerReadonly ? '关闭' : '确认选择'}</Button>
            </div>
          </div>
        )}
      >
        <div className={'ataas-config-yaml-picker' + (configYamlSelectedPath ? ' has-history' : '')}>
          <div className="ataas-config-yaml-picker-tree">
            <div className="ataas-config-yaml-picker-title">文件</div>
            <div className="ataas-config-yaml-picker-tree-body">
              {configYamlPickerLoading && !configYamlTree ? (
                <div className="ataas-config-yaml-picker-empty">加载中...</div>
              ) : configYamlTree ? (
                renderConfigYamlTree(configYamlTree)
              ) : (
                <div className="ataas-config-yaml-picker-empty">暂无配置文件</div>
              )}
            </div>
          </div>
          {configYamlSelectedPath && (
            <div className="ataas-config-yaml-picker-history">
              <div className="ataas-config-yaml-picker-title">历史版本</div>
              <div className="ataas-config-yaml-picker-history-body">
                <button
                  type="button"
                  className={'ataas-config-yaml-picker-version' + (configYamlVersionKey === 'latest' ? ' selected' : '')}
                  onClick={() => previewConfigYamlVersion('latest')}
                >
                  <strong>latest（最新）</strong>
                </button>
                {configYamlHistory.map((item) => (
                  <button
                    type="button"
                    key={item.hash}
                    className={'ataas-config-yaml-picker-version' + (configYamlVersionKey === item.hash ? ' selected' : '')}
                    onClick={() => previewConfigYamlVersion(item.hash)}
                  >
                    <span><em>{item.hash.slice(0, 6)}</em>{item.message}</span>
                    <small>{formatConfigYamlHistoryTime(item.ts_ms)}</small>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="ataas-config-yaml-picker-preview">
            <div className="ataas-config-yaml-picker-title">
              {configYamlSelectedPath ? `${configYamlSelectedPath.toUpperCase()} ${configYamlVersionKey === 'latest' ? 'LATEST' : configYamlVersionKey.slice(0, 6)}` : 'YAML 预览'}
            </div>
            {configYamlSelectedPath ? (
              <MonacoEditor
                key={`${configYamlSelectedPath}-${configYamlVersionKey}`}
                value={configYamlPreview}
                language="yaml"
                height="100%"
                className="ataas-config-yaml-picker-editor"
                onChange={configYamlVersionKey === 'latest' ? (value) => {
                  setConfigYamlPreview(value);
                  setConfigYamlLatest(value);
                } : undefined}
                options={{
                  fontSize: 11,
                  lineHeight: 18,
                  fontWeight: '400',
                  minimap: { enabled: true, side: 'right', size: 'proportional', showSlider: 'mouseover' },
                  scrollbar: { verticalScrollbarSize: 9, horizontalScrollbarSize: 9 },
                  overviewRulerLanes: 0,
                  renderLineHighlight: 'line',
                  wordWrap: 'off',
                  readOnly: configYamlPickerReadonly || configYamlVersionKey !== 'latest',
                  domReadOnly: configYamlPickerReadonly || configYamlVersionKey !== 'latest',
                }}
              />
            ) : (
              <div className="ataas-config-yaml-picker-empty-preview">从左侧文件树选择一个 YAML 文件</div>
            )}
          </div>
        </div>
      </Modal>

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
                  hideSelectAll: true,
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

      <Modal
        className="ataas-manual-gpu-modal"
        title="手动选择 GPU"
        open={manualGpuPickerOpen}
        onCancel={() => setManualGpuPickerOpen(false)}
        footer={(
          <div className="ataas-node-select-footer">
            <span>已选 {manualGpuSelected.length} 张 GPU</span>
            {(() => {
              const perNodeCount: Record<string, number> = {};
              manualGpuSelected.forEach((key: string) => {
                const nk = key.substring(0, key.lastIndexOf('-'));
                perNodeCount[nk] = (perNodeCount[nk] || 0) + 1;
              });
              const allValid = deployMode === 'distributed'
                ? Object.values(perNodeCount).every((c: number) => [1, 2, 4, 8].includes(c))
                : [1, 2, 4, 8].includes(manualGpuSelected.length);
              return manualGpuSelected.length > 0 && !allValid ? (
                <span style={{ color: '#f53f3f', fontSize: 12, marginLeft: 12 }}>每节点请选择 1/2/4/8 张 GPU</span>
              ) : null;
            })()}
            <div>
              <Button onClick={() => setManualGpuPickerOpen(false)}>取消</Button>
              <Button type="primary" disabled={(() => {
                if (manualGpuSelected.length === 0) return false;
                if (deployMode === 'distributed') {
                  const pn: Record<string, number> = {};
                  manualGpuSelected.forEach((key: string) => {
                    const nk = key.substring(0, key.lastIndexOf('-'));
                    pn[nk] = (pn[nk] || 0) + 1;
                  });
                  return !Object.values(pn).every((c: number) => [1, 2, 4, 8].includes(c));
                }
                return ![1, 2, 4, 8].includes(manualGpuSelected.length);
              })()} onClick={() => setManualGpuPickerOpen(false)}>确认</Button>
            </div>
          </div>
        )}
        width={860}
      >
        <div className="ataas-manual-gpu-content">
          {(deployMode === 'single' ? (selectedSingleNode ? [selectedSingleNode] : []) : selectedDeployNodes).length === 0 ? (
            <div className="ataas-manual-gpu-empty">请先选择部署节点</div>
          ) : (
            (deployMode === 'single' ? (selectedSingleNode ? [selectedSingleNode] : []) : selectedDeployNodes).map((nodeKey) => {
              const node = deployNodes.find((item) => item.key === nodeKey);
              if (!node) return null;
              const managedNode = nodes.find((item) => item.name === node.name || item.ip === node.ip);
              const displayCards = managedNode
                ? getNodeDisplayGpuCards(managedNode)
                : Array.from({ length: Math.max(8, node.totalCards) }, (_, index) => ({
                    index,
                    model: node.gpuType,
                    spec: '',
                    memoryTotal: '-',
                    memoryUsed: '-',
                    memoryFree: '-',
                    utilization: index < node.availableCards ? 0 : 72,
                    power: index < node.availableCards ? 25 : 260,
                    temperature: index < node.availableCards ? 35 : 70,
                    status: index < node.availableCards ? 'idle' as const : 'active' as const,
                    replicas: [],
                  }));
              return (
                <div className="ataas-manual-gpu-node" key={node.key}>
                  <div className="ataas-manual-gpu-node-head">
                    <strong>{node.name}</strong>
                    <span>{node.ip} · {node.gpuType}</span>
                  </div>
                  <div className="ataas-node-gpu-card-grid ataas-manual-gpu-card-grid">
                    {displayCards.map((card) => {
                      const key = `${node.key}-${card.index}`;
                      const selected = manualGpuSelected.includes(key);
                      const idle = card.status === 'idle';
                      return (
                        <button
                          type="button"
                          key={key}
                          className={'ataas-node-gpu-card ataas-manual-gpu-card' + (idle ? ' idle' : '') + (selected ? ' selected' : '')}
                          style={selected ? { border: '2px solid #6951FF', background: '#F4F0FF' } : {}}
                          onClick={() => setManualGpuSelected((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key])}
                        >
                          <div className="ataas-node-gpu-card-head">
                            <strong>GPU {card.index}</strong>
                            <span className={'ataas-node-gpu-card-status' + (idle ? ' idle' : '')}>{idle ? '空闲' : '使用中'}</span>
                          </div>
                          <div className="ataas-node-gpu-card-model">{card.model}<em>{card.spec}</em></div>
                          <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" />
                          <div className="ataas-node-gpu-card-meta">
                            <span>显存 {card.memoryUsed} / {card.memoryTotal}</span>
                          </div>
                          
                          {managedNode && renderGpuCardRunningModels(managedNode, card)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
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
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>标签</span><br/><div className="ataas-node-label-cell" style={{ marginTop: 4 }}><span className="ataas-node-label-tag">{clusterNodeRecord.label}</span>{clusterNodeRecord.tags?.map((tag) => <span key={tag} className="ataas-node-label-tag extra">{tag}</span>)}</div></div>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>集群</span><br/>{clusterNodeRecord.clusterName}</div>
              <div style={{ padding: '10px 12px', background: '#f7f8fa', borderRadius: 6 }}><span style={{ color: '#86909c' }}>GPU 显存使用</span><br/>{clusterNodeRecord.gpuMemoryUsed} / {clusterNodeRecord.gpuMemory}</div>
            </div>
          </div>
        )}
      </Drawer>
      <Drawer className="ataas-deploy-drawer" title="模型部署" open={deployDrawerOpen} onClose={() => { setDeployDrawerOpen(false); setProtectedStartupTemplateName(''); }} width={560}>
        <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
            <div className="ataas-deploy-page">
                      <Form className="ataas-deploy-drawer-form" layout="horizontal" size="middle" labelCol={{ flex: '88px' }} wrapperCol={{ flex: '1' }}>
                        <Form.Item label="服务名称" required><Input placeholder="例如：my-inference-service" value={deployServiceName} onChange={(e) => setDeployServiceName(e.target.value)} /></Form.Item>
                        <Form.Item label="模型" required>
                          <Select className="ataas-deploy-primary-select" popupClassName="ataas-deploy-primary-select-dropdown" placeholder="选择模型" value={deployModel} onChange={setDeployModel} options={[
                            ...deployModels.map((m) => ({ value: m.key, label: `${m.name} (${m.size})` })),
                            ...modelRepoData.map((m) => ({ value: m.name, label: `${m.name} (${m.tags.weight_size})` })),
                          ]} />
                        </Form.Item>
                        <Form.Item label="推理引擎" required>
                          <div className="ataas-deploy-engine-combo">
                            <Select
                              className="ataas-deploy-primary-select ataas-deploy-engine-type-select"
                              popupClassName="ataas-deploy-primary-select-dropdown"
                              variant="borderless"
                              placeholder="选择引擎"
                              value={selectedDeployEngineType}
                              onChange={(value) => {
                                const nextEngine = deployEngineRecords.find((engine) => engine.engine === value);
                                setDeployEngine(nextEngine?.key);
                              }}
                              options={deployEngineTypeOptions}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                            />
                            <Select
                              className="ataas-deploy-primary-select ataas-deploy-engine-version-select"
                              popupClassName="ataas-deploy-primary-select-dropdown"
                              variant="borderless"
                              placeholder="选择版本"
                              value={deployEngine}
                              onChange={(value) => setDeployEngine(value)}
                              options={deployEngineVersionOptions}
                              disabled={!selectedDeployEngineType}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                            />
                          </div>
                        </Form.Item>
                        <Form.Item label="部署集群" required>
                          <div className="ataas-deploy-engine-combo ataas-deploy-cluster-se-combo">
                            <Select
                              className="ataas-deploy-primary-select ataas-deploy-cluster-select"
                              popupClassName="ataas-deploy-primary-select-dropdown"
                              variant="borderless"
                              placeholder="选择集群"
                              value={deployCluster}
                              onChange={selectDeployCluster}
                              optionRender={(o) => {
                                const c = clusters.find((x) => x.key === o.value);
                                return c ? <span style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><span>{c.name}</span><span style={{ color: '#86909c', fontSize: 12 }}>{c.gpuTypes.map(g => g.name).join(' / ')}</span></span> : o.label;
                              }}
                              options={clusters.map((c) => ({ value: c.key, label: c.name }))}
                              allowClear
                              showSearch
                              optionFilterProp="label"
                            />
                            {deployMode === 'pd-separation' && (
                              <Select
                                className="ataas-deploy-primary-select ataas-deploy-service-entry-select"
                                popupClassName="ataas-deploy-primary-select-dropdown"
                                variant="borderless"
                                placeholder="选择 SE"
                                value={deployServiceEntry}
                                onChange={setDeployServiceEntry}
                                options={deployServiceEntryOptions}
                                disabled={!deployCluster}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                              />
                            )}
                          </div>
                        </Form.Item>
                        <Form.Item label="部署方式">
                          {renderDeployModeSelector()}
                        </Form.Item>
                      </Form>
                    {deployMode === 'pd-separation' && (
                      <div className="ataas-pd-deploy-stack">
                        <div className="ataas-pd-template-strip">
                          <div className="ataas-pd-form-row">
                            <div className="ataas-pd-form-label">PD模板：</div>
                            <div className="ataas-pd-form-control ataas-pd-template-strip-main">
                              <Select
                                className="ataas-deploy-primary-select"
                                popupClassName="ataas-deploy-primary-select-dropdown"
                                value={pdSelectedTemplateKey || undefined}
                                onChange={(value) => applyPdTemplate(value as string)}
                                placeholder="选择 PD 模板（可选）"
                                options={pdTemplateOptions}
                                allowClear
                              />
                              <Tooltip title="上传 PD 模板 YAML">
                                <Button icon={<UploadOutlined />} onClick={openDeployPdTemplateCreate} />
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        {/* Router 配置 */}
                        <div className="ataas-pd-section">
                          <div className="ataas-pd-section-header">
                            <span>Router</span>
                          </div>
                          <div className="ataas-pd-section-body">
                            <div className="ataas-pd-config-form">
                              <div className="ataas-pd-form-row">
                                <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                                <div className="ataas-pd-form-control">{renderPdDeployNodePicker('router')}</div>
                              </div>
                            </div>
                            {renderPdShellPanel('router', 'Router YAML', pdRouterShellText, setPdRouterShellText, setPdRouterParams, {
                              locked: Boolean(pdSelectedTemplateKey),
                              pickerTarget: 'deploy-router',
                            })}
                          </div>
                        </div>
                        {/* PD Worker 配置 */}
                        <div className="ataas-pd-section ataas-pd-worker-card">
                          <div className="ataas-pd-worker-subsection">
                            <div className="ataas-pd-section-header">
                              <span>Prefill</span>
                            </div>
                            <div className="ataas-pd-section-body">
                              <div className="ataas-pd-config-form">
                                <div className="ataas-pd-form-row">
                                  <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                                  <div className="ataas-pd-form-control">{renderPdDeployNodePicker('prefill')}</div>
                                </div>
                                <div className="ataas-pd-form-row">
                                  <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>使用卡数：</div>
                                  <div className="ataas-pd-form-control">{renderPdAutoCardCount('prefill')}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ataas-pd-worker-subsection">
                          <div className="ataas-pd-section-header">
                            <span>Decode</span>
                          </div>
                          <div className="ataas-pd-section-body">
                            <div className="ataas-pd-config-form">
                              <div className="ataas-pd-form-row">
                                <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                                <div className="ataas-pd-form-control">{renderPdDeployNodePicker('decode')}</div>
                              </div>
                              <div className="ataas-pd-form-row">
                                <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>使用卡数：</div>
                                <div className="ataas-pd-form-control">{renderPdAutoCardCount('decode')}</div>
                              </div>
                            </div>
                            {renderPdShellPanel(
                              'prefill',
                              'PD Worker YAML',
                              pdPrefillShellText,
                              (value) => {
                                setPdPrefillShellText(value);
                                setPdDecodeShellText(value);
                              },
                              (next) => {
                                setPdPrefillParams(next);
                                setPdDecodeParams(next.map((param) => ({ ...param })));
                              },
                              {
                                locked: Boolean(pdSelectedTemplateKey),
                                pickerTarget: 'deploy-worker',
                              },
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
                          <div className="ataas-deploy-config-plain">
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12 }}>节点配置</div>
                                <Form.Item label="性能模板" style={{ marginBottom: 12 }}>
                                  <Select
                                    className="ataas-deploy-primary-select ataas-performance-template-select"
                                    popupClassName="ataas-deploy-primary-select-dropdown ataas-performance-template-dropdown"
                                    placeholder="选择性能模板"
                                    value={selectedPerformanceTemplateKey}
                                    onChange={(value) => applySinglePerformanceTemplate(value, 'deploy')}
                                    options={singlePerformanceTemplateOptions}
                                    optionRender={renderPerformanceTemplateOption}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                  />
                                </Form.Item>
                                <Form.Item label="部署节点" required style={{ marginBottom: 12 }}>
                                  {renderDeployNodePicker('single')}
                                </Form.Item>
                                <Form.Item label="使用卡数" required style={{ marginBottom: 16 }}>
                                  {renderCardCountStepper(selectedSingleNode ? (deployNodes.find((d) => d.key === selectedSingleNode)?.availableCards ?? 0) : 0)}
                                </Form.Item>
                                <div style={{ height: 1, background: '#F2F3F5', margin: '0 -16px 16px' }} />
                                <div
                                  className={`ataas-advanced-shell-toggle ${protectedStartupTemplateName ? 'disabled protected' : ''}`}
                                  onClick={() => {
                                    if (protectedStartupTemplateName) return;
                                    setExpandedSections((p) => ({ ...p, advanced: !p.advanced }));
                                  }}
                                >
                                  <DownOutlined className={expandedSections.advanced ? 'open' : ''} />
                                  <span>高级参数</span>
                                  {protectedStartupTemplateName && <em className="ataas-advanced-template-note">已选择「{protectedStartupTemplateName}」模板</em>}
                                </div>
                                {expandedSections.advanced && renderAdvancedParamsShell()}
                              </div>
                          </div>
                        )}

                        {deployMode === 'distributed' && (
                          <div className="ataas-deploy-config-plain">
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12 }}>节点配置</div>
                                <Form.Item label="部署节点" required style={{ marginBottom: 16 }}>
                                  {renderDeployNodePicker('distributed')}
                                </Form.Item>
                                <Form.Item label="使用卡数" required style={{ marginBottom: 16 }}>
                                  {renderCardCountStepper(selectedDeployNodes.length > 0 ? Math.min(...selectedDeployNodes.map((k) => deployNodes.find((d) => d.key === k)?.availableCards ?? 0)) : 0)}
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

                      </div>
                    )}
                    {/* PD分离节点选择弹窗 */}
                    <Modal className="ataas-node-select-modal" title={'选择' + (pdNodePickerMode === 'router' ? ' Router' : pdNodePickerMode === 'prefill' ? ' Prefill' : ' Decode') + '节点'} open={pdNodePickerOpen} onCancel={() => setPdNodePickerOpen(false)} footer={
                      <div className="ataas-node-select-footer">
                        <span>已选 {pdNodePickerSelected.length} 个节点</span>
                        <div>
                        <Button onClick={() => setPdNodePickerOpen(false)}>取消</Button>
                        <Button type="primary" onClick={() => {
                          const nextSelected = pdNodePickerMode === 'router' ? pdNodePickerSelected : pdNodePickerSelected.filter((key) => !getPdNodeOccupiedByOtherMode(key));
                          if (pdNodePickerMode === 'router') setPdRouterNodes(nextSelected);
                          else if (pdNodePickerMode === 'prefill') {
                            setPdPrefillNodes(nextSelected);
                            const nextCardCount = getDefaultPdCardCount(nextSelected);
                            setPdPrefillCardCount(nextCardCount);
                            setPdDecodeCardCount(nextCardCount);
                          }
                          else if (pdNodePickerMode === 'decode') setPdDecodeNodes(nextSelected);
                          setPdNodePickerOpen(false);
                        }}>确认</Button>
                        </div>
                      </div>
                    } width={760}>
                      <div className="ataas-node-picker-modal-head">
                        <Select value={pdNodeGpuFilter} onChange={setPdNodeGpuFilter} className="ataas-node-select-filter" options={[
                          { value: 'all', label: '全部显卡' },
                          ...Array.from(new Set(deployNodes.map((node) => node.gpuType))).map((gpu) => ({ value: gpu, label: gpu })),
                        ]} />
                        <Input.Search placeholder="搜索节点名或 IP" className="ataas-node-select-search" value={pdNodeSearch} onChange={(event) => setPdNodeSearch(event.target.value)} allowClear />
                      </div>
                      <div className="ataas-node-select-table-wrap">
                      <Table
                        dataSource={deployNodes.filter((node) => {
                          if (pdNodeGpuFilter !== 'all' && node.gpuType !== pdNodeGpuFilter) return false;
                          if (pdNodeSearch) {
                            const keyword = pdNodeSearch.toLowerCase();
                            return node.name.toLowerCase().includes(keyword) || node.ip.includes(keyword);
                          }
                          return true;
                        })}
                        rowKey="key" pagination={{ pageSize: 6, showSizeChanger: true, showTotal: (total) => `共 ${total} 个节点` }}
                        rowSelection={{
                          type: 'checkbox',
                          hideSelectAll: true,
                          selectedRowKeys: pdNodePickerSelected,
                          onSelect: (record) => {
                            if (getPdNodeOccupiedByOtherMode(record.key)) return;
                            setPdNodePickerSelected((prev) => {
                              if (prev.includes(record.key)) return prev.filter((k) => k !== record.key);
                              return [...prev, record.key];
                            });
                          },
                          onSelectAll: (selected, _selectedRows, changeRows) => {
                            setPdNodePickerSelected((prev) => {
                              const changeKeys = changeRows.map((r) => r.key).filter((key) => !getPdNodeOccupiedByOtherMode(key));
                              if (selected) {
                                return [...new Set([...prev, ...changeKeys])];
                              }
                              return prev.filter((k) => !changeKeys.includes(k));
                            });
                          },
                          getCheckboxProps: (row) => ({
                            disabled: row.status !== 'ready' || Boolean(getPdNodeOccupiedByOtherMode(row.key)),
                          }),
                        }}
                        columns={[
                          { title: '节点名称', dataIndex: 'name', key: 'name', render: (value, row) => <><strong className="ataas-node-select-name">{value}</strong><span className="ataas-table-sub">{row.ip}</span></> },
                          { title: '已选角色', key: 'pdRoles', width: 180, render: (_, row) => {
                            const roles = getPdNodeSelectedRoles(row.key);
                            return roles.length ? <div className="ataas-pd-node-role-tags">{roles.map((role) => <span key={role} className={`role-${role.toLowerCase()}`}>{role}</span>)}</div> : <span className="ataas-table-sub">未选择</span>;
                          } },
                          { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (value) => <span className="ataas-node-select-gpu">{value}</span> },
                          { title: '可用卡数', key: 'cards', render: (_, row) => <span className="ataas-node-select-card-count">{row.availableCards} / {row.totalCards}</span> },
                          { title: '状态', dataIndex: 'status', key: 'status', render: (value, row) => {
                            return <span className={'ataas-node-select-status ' + value}>{value === 'ready' ? '可用' : value === 'busy' ? '繁忙' : '异常'}</span>;
                          } },
                        ]}
                      />
                      </div>
                    </Modal>
                    <div className="ataas-deploy-drawer-actions" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <Button onClick={resetDeployForm}>取消</Button>
                      <Button type="primary" disabled={isDeploySubmitDisabled} onClick={handleSubmitDeploy}>部署</Button>
                    </div>
            </div>
        </ConfigProvider>
      </Drawer>

      <Modal
        title="上传并创建 PD 模板"
        open={pdTemplateUploadOpen}
        onCancel={() => setPdTemplateUploadOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setPdTemplateUploadOpen(false)}>取消</Button>
            <Button type="primary" onClick={createUploadedPdTemplate}>创建并使用</Button>
          </div>
        }
        width={760}
      >
        <Form form={addInstPdTemplateForm} layout="vertical" className="ataas-add-instance-template-create-form">
            <div className="ataas-startup-create-section">
              <div className="ataas-startup-create-section-title">模板信息</div>
              <div className="ataas-startup-create-grid">
                <Form.Item label="模板名称" name="name" required><Input placeholder="请输入模板名称" /></Form.Item>
                <Form.Item label="模型" name="model"><Input disabled={pdTemplateUploadTarget === 'deploy'} placeholder="当前模型或模型族" /></Form.Item>
                <Form.Item label="推理引擎" name="engine"><Select disabled={pdTemplateUploadTarget === 'deploy'} options={['SGLang', 'vLLM', 'TensorRT-LLM'].map((value) => ({ value, label: value }))} /></Form.Item>
                <Form.Item label="GPU 类型" name="gpu"><Select allowClear showSearch options={['H20-96G', 'H100-80G', 'A100-80G', 'A800-80G', '910B-64G'].map((value) => ({ value, label: value }))} placeholder="请选择" /></Form.Item>
                <Form.Item label="模板描述" name="description"><Input placeholder="可选" /></Form.Item>
              </div>
            </div>
            <div className="ataas-startup-create-section">
              <div className="ataas-startup-create-section-title">PD YAML</div>
              <div className="ataas-pd-yaml-upload-grid">
                <Upload.Dragger
                  accept=".yaml,.yml,text/yaml,text/x-yaml"
                  multiple={false}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (!isYamlFile(file)) {
                      message.error('仅支持 .yaml / .yml 文件');
                      return Upload.LIST_IGNORE;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      addInstPdTemplateForm.setFieldValue('routerYaml', ev.target?.result as string || '');
                      setAddInstRouterYamlFileName(file.name);
                    };
                    reader.onerror = () => message.error('Router YAML 读取失败');
                    reader.readAsText(file);
                    return false;
                  }}
                >
                  <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                  <p className="ant-upload-text">Router YAML</p>
                  <p className="ant-upload-hint">{addInstRouterYamlFileName || '点击或拖拽文件上传'}</p>
                </Upload.Dragger>
                <Upload.Dragger
                  accept=".yaml,.yml,text/yaml,text/x-yaml"
                  multiple={false}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    if (!isYamlFile(file)) {
                      message.error('仅支持 .yaml / .yml 文件');
                      return Upload.LIST_IGNORE;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      addInstPdTemplateForm.setFieldValue('workerYaml', ev.target?.result as string || '');
                      setAddInstWorkerYamlFileName(file.name);
                    };
                    reader.onerror = () => message.error('PD Worker YAML 读取失败');
                    reader.readAsText(file);
                    return false;
                  }}
                >
                  <p className="ant-upload-drag-icon"><UploadOutlined /></p>
                  <p className="ant-upload-text">PD Worker YAML</p>
                  <p className="ant-upload-hint">{addInstWorkerYamlFileName || '点击或拖拽文件上传'}</p>
                </Upload.Dragger>
              </div>
              <Form.Item name="routerYaml" required>
                <Input.TextArea rows={5} placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;metadata:&#10;  name: pd-router" style={{ marginTop: 8 }} />
              </Form.Item>
              <Form.Item name="workerYaml" required>
                <Input.TextArea rows={5} placeholder="apiVersion: apps/v1&#10;kind: Deployment&#10;metadata:&#10;  name: pd-worker" style={{ marginTop: 8 }} />
              </Form.Item>
            </div>
        </Form>
      </Modal>

      <Modal className="ataas-scale-pd-modal ataas-model-ops-task-modal" title={<div className="ataas-model-ops-router-link-title"><SettingOutlined /><strong>扩缩容</strong><em>{scalePdTarget?.name || ''}</em></div>} open={scalePdOpen} onCancel={() => setScalePdOpen(false)} width={600} footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setScalePdOpen(false)}>取消</Button>
          <Button type="primary" onClick={() => { alert('扩缩容提交成功！请等待部署完成。'); setScalePdOpen(false); }}>确认扩缩容</Button>
        </div>
      }>
        <div className="ataas-scale-role-list">
          {renderScaleRoleRow('router', 'router', 'R', scalePdRouterCount)}
          {renderScaleRoleRow('prefill', 'prefill', 'P', scalePdPrefillCount)}
          {renderScaleRoleRow('decode', 'decode', 'D', scalePdDecodeCount)}
        </div>
      </Modal>
      {/* 节点选择弹窗 - 扩容PD */}
      <Modal zIndex={2200} title={'选择' + (scaleNodePickerMode === 'router' ? 'Router' : scaleNodePickerMode === 'prefill' ? 'Prefill' : 'Decode') + '节点'} open={scaleNodePickerOpen} onCancel={() => setScaleNodePickerOpen(false)} footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button onClick={() => setScaleNodePickerOpen(false)}>取消</Button>
          <Button type="primary" onClick={() => {
            const required = getScalePdNodeRequired(scaleNodePickerMode);
            if (scaleNodePickerSelected.length !== required) {
              message.warning(`需要选择 ${required} 个节点`);
              return;
            }
            setScalePdSelectedNodes(scaleNodePickerMode, [...scaleNodePickerSelected]);
            setScaleNodePickerOpen(false);
          }}>确认（{scaleNodePickerSelected.length}/{getScalePdNodeRequired(scaleNodePickerMode)}）</Button>
        </div>
      } width={600}>
        <Table
          dataSource={deployNodes.filter((n) => n.status === 'ready')}
          rowKey="key" pagination={{ pageSize: 5, showSizeChanger: false }}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: scaleNodePickerSelected,
            onSelect: (record) => {
              const required = getScalePdNodeRequired(scaleNodePickerMode);
              setScaleNodePickerSelected((prev) =>
                prev.includes(record.key)
                  ? prev.filter((k) => k !== record.key)
                  : prev.length >= required
                    ? (message.warning(`最多选择 ${required} 个节点`), prev)
                    : [...prev, record.key]
              );
            },
            onSelectAll: (selected, _selectedRows, changeRows) => {
              const required = getScalePdNodeRequired(scaleNodePickerMode);
              setScaleNodePickerSelected((prev) => {
                const changeKeys = changeRows.map((r) => r.key);
                if (selected) {
                  const next = [...new Set([...prev, ...changeKeys])];
                  if (next.length > required) message.warning(`最多选择 ${required} 个节点`);
                  return next.slice(0, required);
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
      {deployDetailItem && deployDetailModalOpen && (() => {
        const InfoItem = ({ label, value }: { label: string; value: string }) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#1d2129', fontSize: 12, minWidth: 80, flexShrink: 0 }}>{label}</span>
            <span style={{ color: '#86909c', fontSize: 12, fontWeight: 400 }}>{value}</span>
          </div>
        );
        const worksList = deployDetailItem.modelInfo.works?.split(',').map((w: string) => w.trim()).filter(Boolean) || [];
        const instanceCount = deployDetailItem.modelInfo.number ?? 1;
        const isPdMode = deployDetailItem.deployMode === 'PD 分离';
        const baseInstanceCountFromNumber = Math.max(0, instanceCount - deployDetailExtraNodes.length);
        const nodeList = worksList.length > 0 ? worksList : Array.from({ length: baseInstanceCountFromNumber }, (_, i) => `节点 ${i + 1}`);
        const deployDetailCluster = getDeployClusterName(deployDetailItem);
        const allInstanceInfos: ExtraInstanceInfo[] = [
          ...nodeList.map((node: string) => ({ node, routerNodes: [], prefillNodes: [], decodeNodes: [] })),
          ...deployDetailExtraNodes,
        ];
        const baseInstanceCount = nodeList.length;
        const dataSource = allInstanceInfos.map((info, i) => ({
          key: i,
          instance: `实例 ${i + 1}`,
          source: i < baseInstanceCount ? 'base' : 'extra',
          sourceIndex: i < baseInstanceCount ? i : i - baseInstanceCount,
          cluster: deployDetailCluster,
          ...info,
        }));
        const isSingleTrafficGroup = gatewayGroupTraffic.length <= 1;
        const podSuffix = (node: string) => (node || '-').toLowerCase().replace(/[^a-z0-9]/g, '-');
        const getNodeNames = (nodeKeys: string[] | undefined, fallback: string) => {
          if (nodeKeys && nodeKeys.length > 0) {
            return nodeKeys.map((k: string) => {
              const n = deployNodes.find((d) => d.key === k);
              return n ? n.name : k;
            }).join(', ');
          }
          return fallback;
        };
        const detailStatus = () => <span className="ataas-deploy-inline-status-running">运行中</span>;
        const handleDeleteInstance = (record: any) => {
          if (dataSource.length <= 1) {
            message.warning('至少保留一个实例');
            return;
          }
          let nextTotal = dataSource.length - 1;
          if (record.source === 'extra') {
            setDeployDetailExtraNodes((prev) => prev.filter((_, index) => index !== record.sourceIndex));
            const nextItem = { ...deployDetailItem, modelInfo: { ...deployDetailItem.modelInfo, number: nextTotal } };
            setDeployDetailItem(nextItem);
            setDeployServices((prev) => prev.map((item) => item.id === deployDetailItem.id ? nextItem : item));
          } else {
            const nextWorks = nodeList.filter((_, index) => index !== record.sourceIndex);
            const nextItem: DeployServiceItem = {
              ...deployDetailItem,
              modelInfo: {
                ...deployDetailItem.modelInfo,
                number: nextTotal,
                works: nextWorks.join(', '),
              },
            };
            nextTotal = nextWorks.length + deployDetailExtraNodes.length;
            setDeployDetailItem(nextItem);
            setDeployServices((prev) => prev.map((item) => item.id === deployDetailItem.id ? nextItem : item));
          }
          resetGatewayTrafficByCount(nextTotal);
          message.success(`${record.instance} 已删除`);
        };
        const detailLogButton = (row: any) => (
          <Tooltip title="运行日志">
            <Button
              className="ataas-deploy-inline-log-button"
              type="text"
              size="small"
              icon={<FileSearchOutlined />}
              onClick={() => handleDeployLog(deployDetailItem, row.logId)}
            />
          </Tooltip>
        );
        const detailInstanceCell = (record: any) => (
          <div className="ataas-deploy-inline-instance-cell">
            <span>{record.instance}</span>
            <Popconfirm
              title="删除实例？"
              description={`确认删除 ${record.instance} 吗？`}
              okText="删除"
              cancelText="取消"
              onConfirm={() => handleDeleteInstance(record)}
            >
              <button type="button" className="ataas-deploy-inline-instance-delete">删除实例</button>
            </Popconfirm>
          </div>
        );
        const pdInstanceGroups = isPdMode
          ? dataSource.map((record: any) => {
            const routerNodeNames = getNodeNames(record.routerNodes, record.node || '-');
            const prefillNodeNames = getNodeNames(record.prefillNodes, record.node || '-');
            const decodeNodeNames = getNodeNames(record.decodeNodes, record.node || '-');
            const suffix = podSuffix(record.node || '-');
            return {
              record,
              rows: [
                { key: `${record.key}-router`, podName: `router-${suffix}-0`, comp: 'Router', cluster: record.cluster, machine: routerNodeNames, gpu: '-', logId: 1 },
                { key: `${record.key}-prefill`, podName: `prefill-${suffix}-0`, comp: 'Prefill', cluster: record.cluster, machine: prefillNodeNames, gpu: '8 卡', logId: 2 },
                { key: `${record.key}-decode`, podName: `decode-${suffix}-0`, comp: 'Decode', cluster: record.cluster, machine: decodeNodeNames, gpu: '8 卡', logId: 3 },
              ],
            };
          })
          : [];
        const trafficEditable = detailTrafficEnabled && !isSingleTrafficGroup;
        const enableDetailTraffic = () => {
          Modal.confirm({
            title: '启用按实例分配流量？',
            content: '启用后才可以调整各实例权重。调整权重会影响线上流量分配，请确认后再操作。',
            okText: '确认启用',
            cancelText: '取消',
            onOk: () => setDetailTrafficEnabled(true),
          });
        };
        const saveDetailTraffic = () => {
          setDetailTrafficEnabled(false);
          message.success('流量权重已保存');
        };
        return (
          <Modal
            className="ataas-deploy-detail-modal"
            title={
              <div className="ataas-deploy-detail-title-legacy" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={getDeployModelLogo(deployDetailItem)} alt="" style={{ width: 24, height: 24, borderRadius: 6 }} />
                <span>{deployDetailItem.name}</span>
              </div>
            }
            open={deployDetailModalOpen}
            onCancel={() => {
              setDeployDetailModalOpen(false);
              setDeployDetailItem(null);
              setDetailTrafficEnabled(false);
            }}
            width={800}
            footer={null}
          >
            <div className="ataas-deploy-detail-legacy" style={{ padding: '4px 0' }}>
              <div className="ataas-deploy-detail-section-title">
                <span>服务信息</span>
              </div>
              <div className="ataas-deploy-detail-info-grid">
                <InfoItem label="推理引擎" value={deployDetailItem.modelInfo.engine || '-'} />
                <InfoItem label="引擎版本" value={deployDetailItem.modelInfo.engineVersion || '-'} />
              </div>
              <div className="ataas-deploy-detail-section-title ataas-deploy-detail-section-title-action">
                <span>网关配置</span>
                <Button
                  className="ataas-traffic-enable-button"
                  size="small"
                  disabled={isSingleTrafficGroup}
                  onClick={detailTrafficEnabled ? saveDetailTraffic : enableDetailTraffic}
                >
                  {detailTrafficEnabled ? '保存' : '启用分配'}
                </Button>
              </div>
              <div className="ataas-deploy-detail-gateway-legacy" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#86909c', minWidth: 80, flexShrink: 0 }}>按实例分配流量</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {gatewayGroupTraffic.map((item, gi) => (
                      <div className="ataas-deploy-detail-traffic-row-legacy" key={item.groupKey} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag style={{ margin: 0 }}>{item.groupKey}</Tag>
                        <div className="ataas-deploy-detail-traffic-track" style={{ flex: 1 }}>
                          <div className="ataas-deploy-detail-traffic-fill" style={{ width: `${isSingleTrafficGroup ? 100 : item.percent}%` }} />
                        </div>
                        <InputNumber
                          min={0}
                          max={100}
                          value={isSingleTrafficGroup ? 100 : item.percent}
                          disabled={!trafficEditable}
                          onChange={(v) => {
                            if (!trafficEditable) return;
                            if (v === null) return;
                            const next = [...gatewayGroupTraffic];
                            next[gi] = { ...next[gi], percent: v };
                            setGatewayGroupTraffic(next);
                          }}
                          size="small"
                          style={{ width: 64 }}
                          formatter={(v) => (v !== undefined ? `${v}%` : '')}
                          parser={(v) => parseInt(v?.replace('%', '') || '0')}
                        />
                        </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="ataas-deploy-detail-section-title ataas-deploy-detail-section-title-action">
                <span>实例信息</span>
                <Button className="ataas-traffic-enable-button" size="small" onClick={() => openAddInstanceModal()}>添加实例</Button>
              </div>
              {isPdMode ? (
                <div className="ataas-deploy-inline-table ataas-deploy-detail-inline-table">
                  <table className="ataas-deploy-inline-native-table">
                    <colgroup>
                      <col style={{ width: 116 }} />
                      <col style={{ width: 92 }} />
                      <col style={{ width: 150 }} />
                      <col style={{ width: 128 }} />
                      <col style={{ width: 128 }} />
                      <col style={{ width: 92 }} />
                      <col style={{ width: 92 }} />
                      <col style={{ width: 64 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>实例</th>
                        <th>状态</th>
                        <th>Pod 名称</th>
                        <th>组件</th>
                        <th>集群</th>
                        <th>所选机器</th>
                        <th>显卡数量</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pdInstanceGroups.flatMap((group: any) => group.rows.map((row: any, rowIndex: number) => (
                        <tr key={row.key}>
                          {rowIndex === 0 && <td rowSpan={group.rows.length}>{detailInstanceCell(group.record)}</td>}
                          <td>{detailStatus()}</td>
                          <td><Tooltip title={row.podName}><span className="ataas-deploy-inline-pod-name">{row.podName}</span></Tooltip></td>
                          <td>{row.comp}</td>
                          <td>{row.cluster}</td>
                          <td>{row.machine}</td>
                          <td>{row.gpu}</td>
                          <td>{detailLogButton(row)}</td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ataas-deploy-inline-table ataas-deploy-detail-inline-table">
                  <table className="ataas-deploy-inline-native-table">
                    <colgroup>
                      <col style={{ width: 116 }} />
                      <col style={{ width: 92 }} />
                      <col style={{ width: 150 }} />
                      <col style={{ width: 128 }} />
                      <col style={{ width: 128 }} />
                      <col style={{ width: 92 }} />
                      <col style={{ width: 64 }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>实例</th>
                        <th>状态</th>
                        <th>Pod 名称</th>
                        <th>集群</th>
                        <th>所选机器</th>
                        <th>显卡数量</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataSource.map((record: any) => {
                        const suffix = podSuffix(record.node || '-');
                        const row = {
                          key: record.key,
                          podName: `pod-${suffix}-0`,
                          cluster: record.cluster,
                          machine: record.node,
                          gpu: getDeployDetailInstanceGpuCount(deployDetailItem),
                          logId: record.key + 1,
                        };
                        return (
                          <tr key={row.key}>
                            <td>{detailInstanceCell(record)}</td>
                            <td>{detailStatus()}</td>
                            <td><Tooltip title={row.podName}><span className="ataas-deploy-inline-pod-name">{row.podName}</span></Tooltip></td>
                            <td>{row.cluster}</td>
                            <td>{row.machine}</td>
                            <td>{row.gpu}</td>
                            <td>{detailLogButton(row)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
      {/* 添加实例弹窗 - PD 模式 */}
      {deployDetailItem?.deployMode === 'PD 分离' && (
        <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
        <Modal className="ataas-add-instance-modal" title="添加实例" open={addInstanceModalOpen} onCancel={closeAddInstanceModal} width={720} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeAddInstanceModal}>取消</Button>
            <Button type="primary" disabled={isAddInstanceSubmitDisabled} onClick={handleAddInstanceConfirm}>确认添加</Button>
          </div>
        }>
          <div className="ataas-pd-deploy-stack ataas-add-instance-pd-stack">
            <div className="ataas-deploy-config-plain ataas-add-instance-config" style={{ padding: '12px 16px' }}>
              <div className="ataas-pd-form-row ataas-add-instance-top-row">
                <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署集群：</div>
                <div className="ataas-pd-form-control">
                  <Select
                    className="ataas-deploy-primary-select"
                    popupClassName="ataas-deploy-primary-select-dropdown"
                    placeholder="选择部署集群"
                    value={addInstCluster}
                    onChange={setAddInstCluster}
                    options={clusters.map((cluster) => ({ value: cluster.name, label: cluster.name }))}
                  />
                </div>
              </div>
              <div className="ataas-pd-form-row ataas-add-instance-top-row">
                <div className="ataas-pd-form-label">PD模板：</div>
                <div className="ataas-pd-form-control ataas-deploy-pd-template-control">
                  <Select
                    className="ataas-deploy-primary-select"
                    popupClassName="ataas-deploy-primary-select-dropdown"
                    value={addInstRouterTemplateKey || undefined}
                    onChange={(value) => applyAddInstPdTemplate(value as string)}
                    placeholder="选择 PD 模板（可选）"
                    options={pdTemplateOptions}
                    allowClear
                  />
                  <Tooltip title="上传 PD 模板 YAML">
                    <Button icon={<UploadOutlined />} onClick={openAddInstPdTemplateCreate} />
                  </Tooltip>
                </div>
              </div>
            </div>
            {/* Router */}
            <div className="ataas-pd-section">
              <div className="ataas-pd-section-header">
                <span>Router</span>
              </div>
              <div className="ataas-pd-section-body">
                <div className="ataas-pd-config-form">
                  <div className="ataas-pd-form-row ataas-add-instance-node-row">
                    <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                    <div className="ataas-pd-form-control">
                      <div className="ataas-pd-node-selector" onClick={() => { setAddInstNodePickerMode('router'); setAddInstNodePickerSelected([...addInstRouterNodes]); setAddInstNodeGpuFilter('all'); setAddInstNodeSearch(''); setAddInstNodePickerOpen(true); }}>
                      {addInstRouterNodes.length > 0 ? addInstRouterNodes.map((k) => {
                        const n = deployNodes.find((d) => d.key === k);
                        return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setAddInstRouterNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-router">{n.name}</Tag> : null;
                      }) : <span className="ataas-pd-node-placeholder">选择部署节点</span>}
                        <span className="ataas-pd-node-action">选择节点</span>
                      </div>
                    </div>
                  </div>
                </div>
                {renderPdShellPanel('router', 'Router YAML', addInstRouterShellText, setAddInstRouterShellText, setAddInstRouterParams)}
              </div>
            </div>
            {/* PD Worker */}
            <div className="ataas-pd-section ataas-pd-worker-card">
              <div className="ataas-pd-worker-subsection">
                <div className="ataas-pd-section-header">
                  <span>Prefill</span>
                </div>
                <div className="ataas-pd-section-body">
                  <div className="ataas-pd-config-form">
                    <div className="ataas-pd-form-row ataas-add-instance-node-row">
                      <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                      <div className="ataas-pd-form-control">
                        <div className="ataas-pd-node-selector" onClick={() => { setAddInstNodePickerMode('prefill'); setAddInstNodePickerSelected([...addInstPrefillNodes]); setAddInstNodeGpuFilter('all'); setAddInstNodeSearch(''); setAddInstNodePickerOpen(true); }}>
                          {addInstPrefillNodes.length > 0 ? addInstPrefillNodes.map((k) => {
                            const n = deployNodes.find((d) => d.key === k);
                            return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setAddInstPrefillNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-prefill">{n.name}</Tag> : null;
                          }) : <span className="ataas-pd-node-placeholder">选择部署节点</span>}
                          <span className="ataas-pd-node-action">选择节点</span>
                        </div>
                      </div>
                    </div>
                    <div className="ataas-pd-form-row">
                      <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>使用卡数：</div>
                      <div className="ataas-pd-form-control">{renderAddInstPdAutoCardCount('prefill')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ataas-pd-worker-subsection">
                <div className="ataas-pd-section-header">
                  <span>Decode</span>
                </div>
                <div className="ataas-pd-section-body">
                  <div className="ataas-pd-config-form">
                    <div className="ataas-pd-form-row ataas-add-instance-node-row">
                      <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>部署节点：</div>
                      <div className="ataas-pd-form-control">
                        <div className="ataas-pd-node-selector" onClick={() => { setAddInstNodePickerMode('decode'); setAddInstNodePickerSelected([...addInstDecodeNodes]); setAddInstNodeGpuFilter('all'); setAddInstNodeSearch(''); setAddInstNodePickerOpen(true); }}>
                          {addInstDecodeNodes.length > 0 ? addInstDecodeNodes.map((k) => {
                            const n = deployNodes.find((d) => d.key === k);
                            return n ? <Tag key={k} closable onClose={(e) => { e.stopPropagation(); setAddInstDecodeNodes((prev) => prev.filter((x) => x !== k)); }} className="ataas-pd-node-tag ataas-pd-node-tag-decode">{n.name}</Tag> : null;
                          }) : <span className="ataas-pd-node-placeholder">选择部署节点</span>}
                          <span className="ataas-pd-node-action">选择节点</span>
                        </div>
                      </div>
                    </div>
                    <div className="ataas-pd-form-row">
                      <div className="ataas-pd-form-label"><span className="ataas-pd-required-mark">*</span>使用卡数：</div>
                      <div className="ataas-pd-form-control">{renderAddInstPdAutoCardCount('decode')}</div>
                    </div>
                  </div>
                  {renderPdShellPanel(
                    'prefill',
                    'PD Worker YAML',
                    addInstPrefillShellText,
                    (value) => {
                      setAddInstPrefillShellText(value);
                      setAddInstDecodeShellText(value);
                    },
                    (next) => {
                      setAddInstPrefillParams(next);
                      setAddInstDecodeParams(next.map((param) => ({ ...param })));
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
        </ConfigProvider>
      )}
      {/* 添加实例弹窗 - 非PD模式 */}
      {deployDetailItem && deployDetailItem.deployMode !== 'PD 分离' && (
        <ConfigProvider theme={{ token: { colorPrimary: '#6738E8', colorPrimaryHover: '#5D30D8', colorPrimaryActive: '#5127C7', controlOutline: 'rgba(103, 56, 232, 0.12)' } }}>
        <Modal className="ataas-add-instance-modal" title="添加实例" open={addInstanceModalOpen} onCancel={closeAddInstanceModal} width={680} footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={closeAddInstanceModal}>取消</Button>
            <Button type="primary" disabled={isAddInstanceSubmitDisabled} onClick={handleAddInstanceConfirm}>确认添加</Button>
          </div>
        }>
          <div className="ataas-deploy-config-plain ataas-add-instance-config">
            <Form.Item label="部署集群" required style={{ marginBottom: 16 }}>
              <Select
                className="ataas-deploy-primary-select"
                popupClassName="ataas-deploy-primary-select-dropdown"
                placeholder="选择部署集群"
                value={addInstCluster}
                onChange={setAddInstCluster}
                options={clusters.map((cluster) => ({ value: cluster.name, label: cluster.name }))}
              />
            </Form.Item>
            {deployDetailItem.deployMode === '单机部署' && (
              <Form.Item label="性能模板" style={{ marginBottom: 16 }}>
                <Select
                  className="ataas-deploy-primary-select ataas-performance-template-select"
                  popupClassName="ataas-deploy-primary-select-dropdown ataas-performance-template-dropdown"
                  placeholder="选择性能模板"
                  value={addInstPerformanceTemplateKey}
                  onChange={(value) => applySinglePerformanceTemplate(value, 'add-instance')}
                  options={singlePerformanceTemplateOptions}
                  optionRender={renderPerformanceTemplateOption}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
            <Form.Item label="部署节点" required style={{ marginBottom: 16 }}>
              {renderAddInstanceNodePicker()}
            </Form.Item>
            <Form.Item label="使用卡数" required style={{ marginBottom: 16 }}>
              {renderAddInstanceCardCountStepper()}
            </Form.Item>
            <div style={{ height: 1, background: '#F2F3F5', margin: '0 -16px 16px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2129', marginBottom: 12 }}>高级参数</div>
            {renderParamsShellEditor(addInstRouterShellText, setAddInstRouterShellText, setAddInstRouterParams)}
          </div>
        </Modal>
        </ConfigProvider>
      )}
      {/* 添加实例 - 节点选择弹窗 */}
      <Modal zIndex={2200} className="ataas-node-select-modal" title={deployDetailItem?.deployMode !== 'PD 分离' ? '选择部署节点' : '选择' + (addInstNodePickerMode === 'router' ? 'Router' : addInstNodePickerMode === 'prefill' ? 'Prefill' : 'Decode') + '节点'} open={addInstNodePickerOpen} onCancel={() => setAddInstNodePickerOpen(false)} footer={
        <div className="ataas-node-select-footer">
          <span>已选 {addInstNodePickerSelected.length} 个节点{Number.isFinite(getAddInstNodePickerLimit()) ? `，最多 ${getAddInstNodePickerLimit()} 个` : ''}</span>
          <div>
            <Button onClick={() => setAddInstNodePickerOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => {
              const nextSelected = addInstNodePickerSelected.filter((key) => !getAddInstNodeOccupiedByOtherMode(key)).slice(0, getAddInstNodePickerLimit());
              if (addInstNodePickerMode === 'router') {
                setAddInstRouterNodes(nextSelected);
                setAddInstManualGpuSelected((prev) => prev.filter((key) => nextSelected.includes(key.substring(0, key.lastIndexOf('-')))));
              }
              else if (addInstNodePickerMode === 'prefill') {
                setAddInstPrefillNodes(nextSelected);
                const nextCardCount = getDefaultPdCardCount(nextSelected);
                setAddInstPrefillCardCount(nextCardCount);
                setAddInstDecodeCardCount(nextCardCount);
              }
              else if (addInstNodePickerMode === 'decode') setAddInstDecodeNodes(nextSelected);
              if (addInstNodePickerMode === 'router' && deployDetailItem?.deployMode !== 'PD 分离') {
                const selectedNodes = nextSelected
                  .map((key) => deployNodes.find((node) => node.key === key))
                  .filter((node): node is (typeof deployNodes)[number] => Boolean(node));
                const maxCards = selectedNodes.length > 0 ? Math.min(...selectedNodes.map((node) => node.availableCards)) : 0;
                const cardOptions = [1, 2, 4, 8].filter((value) => value <= maxCards);
                setAddInstCardCount(cardOptions.includes(addInstCardCount) ? addInstCardCount : cardOptions[0] || 0);
              }
              setAddInstNodePickerOpen(false);
            }}>确认（{addInstNodePickerSelected.length}个）</Button>
          </div>
        </div>
      } width={760}>
        <div className="ataas-node-picker-modal-head">
          <Select value={addInstNodeGpuFilter} onChange={setAddInstNodeGpuFilter} className="ataas-node-select-filter" options={[
            { value: 'all', label: '全部显卡' },
            ...Array.from(new Set(deployNodes.map((n) => n.gpuType))).map((g) => ({ value: g, label: g })),
          ]} />
          <Input.Search placeholder="搜索节点名或 IP" className="ataas-node-select-search" value={addInstNodeSearch} onChange={(e) => setAddInstNodeSearch(e.target.value)} allowClear />
        </div>
        <div className="ataas-node-select-table-wrap">
          <Table
            dataSource={deployNodes.filter((n) => {
              if (n.status !== 'ready') return false;
              if (addInstNodeGpuFilter !== 'all' && n.gpuType !== addInstNodeGpuFilter) return false;
              if (addInstNodeSearch) {
                const q = addInstNodeSearch.toLowerCase();
                return n.name.toLowerCase().includes(q) || n.ip.includes(q);
              }
              return true;
            })}
            rowKey="key"
            pagination={{ pageSize: 6, showSizeChanger: true, showTotal: (t) => `共 ${t} 个节点` }}
            rowSelection={{
              type: deployDetailItem?.deployMode === '单机部署' && addInstNodePickerMode === 'router' ? 'radio' : 'checkbox',
              hideSelectAll: true,
              selectedRowKeys: addInstNodePickerSelected,
              onSelect: (record) => {
                if (getAddInstNodeOccupiedByOtherMode(record.key)) return;
                if (deployDetailItem?.deployMode === '单机部署' && addInstNodePickerMode === 'router') {
                setAddInstNodePickerSelected([record.key]);
                  return;
                }
                setAddInstNodePickerSelected((prev) => {
                  if (prev.includes(record.key)) return prev.filter((k) => k !== record.key);
                  if (prev.length >= getAddInstNodePickerLimit()) return prev;
                  return [...prev, record.key];
                });
              },
              onSelectAll: (selected, _selectedRows, changeRows) => {
                setAddInstNodePickerSelected((prev) => {
                  const changeKeys = changeRows.map((r) => r.key).filter((key) => !getAddInstNodeOccupiedByOtherMode(key));
                  if (selected) return [...new Set([...prev, ...changeKeys])].slice(0, getAddInstNodePickerLimit());
                  return prev.filter((k) => !changeKeys.includes(k));
                });
              },
              getCheckboxProps: (row) => ({
                disabled: row.status !== 'ready' || Boolean(getAddInstNodeOccupiedByOtherMode(row.key)) || (!addInstNodePickerSelected.includes(row.key) && addInstNodePickerSelected.length >= getAddInstNodePickerLimit()),
              }),
            }}
            columns={[
              { title: '节点名称', dataIndex: 'name', key: 'name', render: (v, r) => <><strong className="ataas-node-select-name">{v}</strong><span className="ataas-table-sub">{r.ip}</span></> },
              { title: '显卡类型', dataIndex: 'gpuType', key: 'gpuType', render: (v) => <span className="ataas-node-select-gpu">{v}</span> },
              { title: '可用卡数', key: 'cards', render: (_, r) => <span className="ataas-node-select-card-count">{r.availableCards} / {r.totalCards}</span> },
              { title: '状态', dataIndex: 'status', key: 'status', render: (v, row) => {
                const occupiedBy = getAddInstNodeOccupiedByOtherMode(row.key);
                return <span className={'ataas-node-select-status ' + (occupiedBy ? 'busy' : v)}>{occupiedBy ? `已选为 ${occupiedBy}` : v === 'ready' ? '可用' : v === 'busy' ? '繁忙' : '异常'}</span>;
              } },
            ]}
          />
        </div>
      </Modal>
      <Modal
        zIndex={2300}
        className="ataas-manual-gpu-modal"
        title="手动选择 GPU"
        open={addInstManualGpuPickerOpen}
        onCancel={() => setAddInstManualGpuPickerOpen(false)}
        footer={(
          <div className="ataas-node-select-footer">
            <span>已选 {addInstManualGpuSelected.length} 张 GPU</span>
            {(() => {
              const perNodeCount: Record<string, number> = {};
              addInstManualGpuSelected.forEach((key) => {
                const nodeKey = key.substring(0, key.lastIndexOf('-'));
                perNodeCount[nodeKey] = (perNodeCount[nodeKey] || 0) + 1;
              });
              const allValid = deployDetailItem?.deployMode === '分布式部署'
                ? Object.values(perNodeCount).every((count) => [1, 2, 4, 8].includes(count))
                : [1, 2, 4, 8].includes(addInstManualGpuSelected.length);
              return addInstManualGpuSelected.length > 0 && !allValid ? (
                <span style={{ color: '#f53f3f', fontSize: 12, marginLeft: 12 }}>每节点请选择 1/2/4/8 张 GPU</span>
              ) : null;
            })()}
            <div>
              <Button onClick={() => setAddInstManualGpuPickerOpen(false)}>取消</Button>
              <Button type="primary" disabled={(() => {
                if (addInstManualGpuSelected.length === 0) return false;
                if (deployDetailItem?.deployMode === '分布式部署') {
                  const perNodeCount: Record<string, number> = {};
                  addInstManualGpuSelected.forEach((key) => {
                    const nodeKey = key.substring(0, key.lastIndexOf('-'));
                    perNodeCount[nodeKey] = (perNodeCount[nodeKey] || 0) + 1;
                  });
                  return !Object.values(perNodeCount).every((count) => [1, 2, 4, 8].includes(count));
                }
                return ![1, 2, 4, 8].includes(addInstManualGpuSelected.length);
              })()} onClick={() => {
                if (deployDetailItem?.deployMode === '分布式部署') {
                  const perNodeCount: Record<string, number> = {};
                  addInstManualGpuSelected.forEach((key) => {
                    const nodeKey = key.substring(0, key.lastIndexOf('-'));
                    perNodeCount[nodeKey] = (perNodeCount[nodeKey] || 0) + 1;
                  });
                  setAddInstCardCount(Object.values(perNodeCount)[0] || 0);
                } else {
                  setAddInstCardCount(addInstManualGpuSelected.length);
                }
                setAddInstManualGpuPickerOpen(false);
              }}>确认</Button>
            </div>
          </div>
        )}
        width={860}
      >
        <div className="ataas-manual-gpu-content">
          {addInstRouterNodes.length === 0 ? (
            <div className="ataas-manual-gpu-empty">请先选择部署节点</div>
          ) : (
            addInstRouterNodes.map((nodeKey) => {
              const node = deployNodes.find((item) => item.key === nodeKey);
              if (!node) return null;
              const managedNode = nodes.find((item) => item.name === node.name || item.ip === node.ip);
              const displayCards = managedNode
                ? getNodeDisplayGpuCards(managedNode)
                : Array.from({ length: Math.max(8, node.totalCards) }, (_, index) => ({
                    index,
                    model: node.gpuType,
                    spec: '',
                    memoryTotal: '-',
                    memoryUsed: '-',
                    memoryFree: '-',
                    utilization: index < node.availableCards ? 0 : 72,
                    power: index < node.availableCards ? 25 : 260,
                    temperature: index < node.availableCards ? 35 : 70,
                    status: index < node.availableCards ? 'idle' as const : 'active' as const,
                    replicas: [],
                  }));
              return (
                <div className="ataas-manual-gpu-node" key={node.key}>
                  <div className="ataas-manual-gpu-node-head">
                    <strong>{node.name}</strong>
                    <span>{node.ip} · {node.gpuType}</span>
                  </div>
                  <div className="ataas-node-gpu-card-grid ataas-manual-gpu-card-grid">
                    {displayCards.map((card) => {
                      const key = `${node.key}-${card.index}`;
                      const selected = addInstManualGpuSelected.includes(key);
                      const idle = card.status === 'idle';
                      return (
                        <button
                          type="button"
                          key={key}
                          className={'ataas-node-gpu-card ataas-manual-gpu-card' + (idle ? ' idle' : '') + (selected ? ' selected' : '')}
                          style={selected ? { border: '2px solid #6951FF', background: '#F4F0FF' } : {}}
                          onClick={() => setAddInstManualGpuSelected((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key])}
                        >
                          <div className="ataas-node-gpu-card-head">
                            <strong>GPU {card.index}</strong>
                            <span className={'ataas-node-gpu-card-status' + (idle ? ' idle' : '')}>{idle ? '空闲' : '使用中'}</span>
                          </div>
                          <div className="ataas-node-gpu-card-model">{card.model}<em>{card.spec}</em></div>
                          <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" />
                          <div className="ataas-node-gpu-card-meta">
                            <span>显存 {card.memoryUsed} / {card.memoryTotal}</span>
                          </div>
                          {managedNode && renderGpuCardRunningModels(managedNode, card)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
      <Modal
        className="ataas-deploy-realtime-log-modal"
        title={deployLogModal ? (
          <div className="ataas-deploy-realtime-log-title">
            <FileSearchOutlined />
            <strong>日志</strong>
            <em>{deployLogModal.podName}</em>
            <span>{deployLogModal.namespace}</span>
          </div>
        ) : '日志'}
        open={!!deployLogModal}
        width={1120}
        footer={null}
        destroyOnClose
        onCancel={() => setDeployLogModal(null)}
      >
        {deployLogModal && (
          <div className="ataas-deploy-realtime-log">
            <div className="ataas-deploy-realtime-log-toolbar">
              <button
                type="button"
                className={deployLogModal.follow ? 'active' : ''}
                onClick={() => setDeployLogModal((prev) => prev ? { ...prev, follow: !prev.follow } : prev)}
              >
                <i />
                跟随
              </button>
              <span>{deployLogModal.lines.length} 行</span>
            </div>
            <pre ref={deployLogBodyRef}>{deployLogModal.lines.join('\n')}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AtAasDesign;
