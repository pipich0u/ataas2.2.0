import {
  CloudDownloadOutlined,
  CloudServerOutlined,
  FileOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Progress,
  Radio,
  Select,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import kimiLogo from '../kimi-logo.svg';
import { CLUSTER_OPERATIONS_CLUSTER_DATA } from './clusterOperationsRuntime';
import ModelDownloadTaskModal, { type ModelDownloadTaskValues } from './modelDownloadTaskModal';
import './distributionCenterPage.less';

type ModelCopy = {
  id: string;
  host: string;
  ip: string;
  path: string;
  sizeGb: number;
};

type ModelRecord = {
  id: string;
  name: string;
  type: string;
  copies: ModelCopy[];
};

const modelBrandLogos = {
  glm: glmLogo,
  deepseek: deepseekLogo,
  kimi: kimiLogo,
};

const getModelBrand = (name: string): keyof typeof modelBrandLogos => {
  const normalizedName = name.toLowerCase();
  if (normalizedName.includes('deepseek')) return 'deepseek';
  if (normalizedName.includes('kimi')) return 'kimi';
  return 'glm';
};

type TargetMode = 'cluster' | 'nodes';
type TaskNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';

type ClusterNode = {
  id: string;
  name: string;
  ip: string;
  status: 'Ready' | 'NotReady' | 'Disabled';
  diskTotalGb: number;
  diskFreeGb: number;
};

type ClusterRecord = {
  id: string;
  name: string;
  supplier: string;
  dataCenter: string;
  credential: string;
  nodes: ClusterNode[];
};

type TaskNodeProgress = {
  name: string;
  progress: number;
  speed: string;
  status: TaskNodeStatus;
  detail?: string;
};

type DistributionTask = {
  id: number;
  name: string;
  model: string;
  type: 'download' | 'distribution';
  source: string;
  target: string;
  progress: number;
  speed: string;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  updatedAt: number;
  updatedText: string;
  detail?: string;
  sourcePath?: string;
  targetPath?: string;
  targetCluster?: string;
  targetMode?: TargetMode;
  credential?: string;
  verify?: boolean;
  url?: string;
  resume?: boolean;
  fileName?: string;
  sizeGb?: number;
  nodes?: TaskNodeProgress[];
};

const createClusterNodes = (
  prefix: string,
  count: number,
  notReady: number[] = [],
  disabled: number[] = [],
  startNumber = 1,
) => Array.from({ length: count }, (_, index): ClusterNode => {
  const number = startNumber + index;
  const sequence = index + 1;
  const status = notReady.includes(sequence) ? 'NotReady' : disabled.includes(sequence) ? 'Disabled' : 'Ready';
  const diskTotalGb = number % 9 === 0 ? 4096 : number % 4 === 0 ? 2048 : 1024;
  const regularFreeGb = 260 + ((number * 137) % Math.max(520, diskTotalGb - 360));
  const nearlyFullFreeGb = number % 17 === 0 ? 96 + ((number * 11) % 90) : undefined;
  const diskFreeGb = Math.min(diskTotalGb - 80, nearlyFullFreeGb ?? regularFreeGb);
  return {
    id: `${prefix}-${String(number).padStart(2, '0')}`,
    name: `${prefix}-${String(number).padStart(2, '0')}`,
    ip: prefix.startsWith('st-')
      ? `192.168.${100 + index}.${index + 1}`
      : `10.${24 + (prefix.length % 5)}.${16 + Math.floor(index / 250)}.${20 + (index % 220)}`,
    status,
    diskTotalGb,
    diskFreeGb,
  };
});

const createOperationsCluster = (
  key: keyof typeof CLUSTER_OPERATIONS_CLUSTER_DATA,
  prefix: string,
  startNumber: number,
  credential: string,
): ClusterRecord => {
  const cluster = CLUSTER_OPERATIONS_CLUSTER_DATA[key];
  const total = Number(cluster.nodes) || 0;
  const abnormal = Number(cluster.abnormal) || 0;
  const notReady = Array.from({ length: abnormal }, (_, index) => Math.max(1, total - index));
  return {
    id: cluster.name,
    name: cluster.name,
    supplier: cluster.provider,
    dataCenter: cluster.dc,
    credential,
    nodes: createClusterNodes(prefix, total, notReady, [], startNumber),
  };
};

const clusters: ClusterRecord[] = [
  createOperationsCluster('st', 'st-b300', 11, 'st-model-deploy-key'),
  createOperationsCluster('shanghai-inference-02', 'st-b300', 31, 'st-model-deploy-key'),
  createOperationsCluster('shanghai-inference-03', 'st-b300', 51, 'st-model-deploy-key'),
  createOperationsCluster('shanghai-lingang', 'lg-b300', 11, 'lingang-model-deploy-key'),
  createOperationsCluster('suzhou-prod', 'sz-b300', 11, 'suzhou-model-deploy-key'),
  createOperationsCluster('hangzhou-online', 'hz-b300', 11, 'hangzhou-model-deploy-key'),
  createOperationsCluster('guangzhou-test', 'bx-b300', 11, 'gz-model-deploy-key'),
  createOperationsCluster('beijing-prod', 'bd-b300', 11, 'yc-model-deploy-key'),
];

const initialModels: ModelRecord[] = [
  {
    id: 'glm-52',
    name: 'GLM-5.2',
    type: '大语言模型',
    copies: [
      { id: 'glm-52-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-b', host: 'model-store-02', ip: '10.24.16.32', path: '/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-c', host: 'st-b300-11', ip: '192.168.100.1', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-d', host: 'st-b300-12', ip: '192.168.101.2', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-e', host: 'st-b300-13', ip: '192.168.102.3', path: '/data/models/GLM-5.2', sizeGb: 238 },
    ],
  },
  { id: 'deepseek-v4', name: 'DeepSeek-V4-Flash-Base', type: '大语言模型', copies: [{ id: 'dsv4-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/DeepSeek-V4-Flash-Base', sizeGb: 315 }] },
  { id: 'kimi-k27', name: 'Kimi-K2.7-Code', type: '代码模型', copies: [{ id: 'kimi-k27-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/Kimi-K2.7-Code', sizeGb: 284 }, { id: 'kimi-k27-b', host: 'st-b300-31', ip: '192.168.100.1', path: '/models/Kimi-K2.7-Code', sizeGb: 284 }] },
  { id: 'kimi-k25', name: 'Kimi-K2.5', type: '大语言模型', copies: [{ id: 'kimi-k25-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/Kimi-K2.5', sizeGb: 276 }] },
  { id: 'deepseek-r1', name: 'DeepSeek-R1-0528', type: '推理模型', copies: [{ id: 'dsr1-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/DeepSeek-R1-0528', sizeGb: 642 }, { id: 'dsr1-b', host: 'st-b300-11', ip: '192.168.100.1', path: '/data/models/DeepSeek-R1-0528', sizeGb: 642 }] },
  { id: 'glm-51', name: 'GLM-5.1-FP8', type: '量化模型', copies: [{ id: 'glm-51-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/GLM-5.1-FP8', sizeGb: 132 }] },
  { id: 'kimi-k2', name: 'Kimi-K2-Instruct', type: '大语言模型', copies: [{ id: 'kimi-k2-a', host: 'st-b300-12', ip: '192.168.101.2', path: '/data/models/Kimi-K2-Instruct', sizeGb: 278 }, { id: 'kimi-k2-b', host: 'model-store-02', ip: '10.24.16.32', path: '/models/Kimi-K2-Instruct', sizeGb: 278 }] },
];

const makeTaskNodes = (
  clusterId: string,
  count: number,
  taskStatus: DistributionTask['status'],
  failedNode?: string,
): TaskNodeProgress[] => {
  const cluster = clusters.find((item) => item.id === clusterId);
  return (cluster?.nodes.filter((node) => node.status === 'Ready').slice(0, count) || []).map((node, index) => {
    const failed = failedNode === node.name;
    const progress = failed ? 0 : taskStatus === 'completed' ? 100 : taskStatus === 'failed' ? 100 : taskStatus === 'stopped' ? 37 : Math.max(8, 38 + ((index % 5) - 2) * 4);
    return {
      name: node.name,
      progress,
      speed: taskStatus === 'running' && !failed ? `${420 + index * 36} MB/s` : '—',
      status: failed ? 'failed' : taskStatus === 'completed' ? 'completed' : taskStatus === 'stopped' ? 'stopped' : taskStatus === 'failed' ? 'completed' : 'running',
      detail: failed ? 'SSH 连接失败，请检查凭据或目标节点 sshd 状态' : undefined,
    };
  });
};

const initialTasks: DistributionTask[] = [
  {
    id: 1007,
    name: '下载 DeepSeek-V4 至模型主机',
    model: 'DeepSeek-V4-Flash-Base',
    type: 'download',
    source: 'HTTPS URL',
    target: 'model-store-02 · /models/',
    progress: 68,
    speed: '1.82 GB/s',
    status: 'running',
    updatedAt: Date.now(),
    updatedText: '刚刚',
    url: 'https://models.example.com/DeepSeek-V4-Flash-Base.tar.zst',
    targetPath: '/models/',
    resume: true,
    verify: true,
    sizeGb: 315,
  },
  {
    id: 1006,
    name: '同步 GLM-5.2 至生产集群',
    model: 'GLM-5.2',
    type: 'distribution',
    source: 'ops-transfer-01',
    target: 'st · 指定 2 个 Nodes',
    progress: 42,
    speed: '3.24 GB/s',
    status: 'running',
    updatedAt: Date.now() - 120_000,
    updatedText: '2 分钟前',
    sourcePath: '/data/models/GLM-5.2',
    targetPath: '/data/models/GLM-5.2',
    targetCluster: 'st',
    targetMode: 'nodes',
    credential: 'st-model-deploy-key',
    verify: true,
    sizeGb: 238,
    nodes: makeTaskNodes('st', 2, 'running'),
  },
  {
    id: 1005,
    name: '下载 Kimi-K2.7-Code',
    model: 'Kimi-K2.7-Code',
    type: 'download',
    source: 'HTTPS URL',
    target: 'ops-transfer-01 · /data/models/',
    progress: 100,
    speed: '—',
    status: 'completed',
    updatedAt: Date.now() - 1_800_000,
    updatedText: '30 分钟前',
    url: 'https://models.example.com/Kimi-K2.7-Code.tar.zst',
    targetPath: '/data/models/',
    resume: true,
    verify: true,
    sizeGb: 284,
  },
  {
    id: 1004,
    name: '同步 DeepSeek-R1 至广州测试集群',
    model: 'DeepSeek-R1-0528',
    type: 'distribution',
    source: 'model-store-02',
    target: 'guangzhou-test · 指定 1 个 Nodes',
    progress: 100,
    speed: '—',
    status: 'completed',
    updatedAt: Date.now() - 3_600_000,
    updatedText: '1 小时前',
    sourcePath: '/models/DeepSeek-R1-0528',
    targetPath: '/data/models/DeepSeek-R1-0528',
    targetCluster: 'guangzhou-test',
    targetMode: 'nodes',
    credential: 'gz-model-deploy-key',
    verify: true,
    sizeGb: 642,
    nodes: makeTaskNodes('guangzhou-test', 1, 'completed'),
  },
];

const imageRows = [
  { key: 'image-1', name: 'vllm/vllm-openai:v0.10.2', desc: '推理运行环境', source: 'Harbor 主仓库', size: '8.42 GB', updated: '今天 10:16' },
  { key: 'image-2', name: 'nvidia/cuda:12.8.1-runtime', desc: 'CUDA 运行时', source: 'Harbor 主仓库', size: '4.86 GB', updated: '今天 09:42' },
  { key: 'image-3', name: 'platform/node-agent:v2.6.0', desc: '节点管理组件', source: '离线镜像仓库', size: '628 MB', updated: '昨天 18:20' },
];

const fileRows = [
  { key: 'file-1', name: 'NVIDIA-Linux-x86_64-550.54.run', desc: '/data/packages/drivers/', type: '驱动包', size: '326 MB', source: 'ops-transfer-01', updated: '今天 10:08' },
  { key: 'file-2', name: 'kubernetes-v1.36.2-offline.tar.gz', desc: '/data/packages/kubernetes/', type: '软件包', size: '1.86 GB', source: 'model-store-02', updated: '今天 09:36' },
  { key: 'file-3', name: 'node-agent-config-20260722.zip', desc: '/data/packages/config/', type: '配置文件', size: '12.4 MB', source: 'ops-transfer-01', updated: '今天 08:54' },
];

const formatSize = (sizeGb: number) => sizeGb < 10 ? `${sizeGb.toFixed(1)} GB` : `${Math.round(sizeGb)} GB`;
const formatTotalSize = (sizeGb: number) => sizeGb >= 1024 ? `${(sizeGb / 1024).toFixed(1)} TB` : formatSize(sizeGb);
const canNodeReceiveModel = (node: ClusterNode, modelSizeGb: number) => node.status === 'Ready' && node.diskFreeGb >= modelSizeGb;
const getSelectableNodeIds = (nodes: ClusterNode[], modelSizeGb: number, limit?: number) => {
  const ids = nodes.filter((node) => canNodeReceiveModel(node, modelSizeGb)).map((node) => node.id);
  return typeof limit === 'number' ? ids.slice(0, limit) : ids;
};
const getTaskStatusLabel = (status: DistributionTask['status']) => ({
  running: '执行中',
  completed: '已完成',
  failed: '异常',
  stopped: '已停止',
}[status]);

const hostFreeSpace: Record<string, number> = {
  'ops-transfer-01': 1860,
  'model-store-02': 2940,
  'st-b300-11': 1160,
  'st-b300-12': 980,
  'st-b300-13': 1420,
  'st-b300-31': 1180,
};

const DistributionCenterPage = () => {
  const [resourceKind, setResourceKind] = useState<'models' | 'images' | 'files'>('models');
  const [modelSubview, setModelSubview] = useState<'catalog' | 'tasks'>('catalog');
  const [models, setModels] = useState(initialModels);
  const [tasks, setTasks] = useState(initialTasks);
  const [modelSearch, setModelSearch] = useState('');
  const [hostFilter, setHostFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [imageSearch, setImageSearch] = useState('');
  const [fileSearch, setFileSearch] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<'all' | 'download' | 'distribution'>('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | DistributionTask['status']>('all');
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [taskDetail, setTaskDetail] = useState<DistributionTask | null>(null);
  const [selectedModelId, setSelectedModelId] = useState(initialModels[0].id);
  const [selectedCopyId, setSelectedCopyId] = useState(initialModels[0].copies[0].id);
  const [targetMode, setTargetMode] = useState<TargetMode>('nodes');
  const [selectedClusterId, setSelectedClusterId] = useState(clusters[0].id);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [nodeSearch, setNodeSearch] = useState('');
  const [distributionForm] = Form.useForm();

  const hostOptions = useMemo(() => {
    const copies = models.flatMap((model) => model.copies);
    const hosts = [...new Set(copies.map((copy) => copy.host))];
    return [
      { value: 'all', label: '全部模型主机' },
      ...hosts.map((host) => {
        const copy = copies.find((item) => item.host === host);
        return {
          value: host,
          label: `${host} · ${copy?.ip || 'IP 未知'}`,
          freeGb: hostFreeSpace[host] || 600,
        };
      }),
    ];
  }, [models]);

  const clusterOptions = useMemo(() => {
    const groups = new Map<string, ClusterRecord[]>();
    clusters.forEach((cluster) => {
      const group = `${cluster.supplier} / ${cluster.dataCenter}`;
      groups.set(group, [...(groups.get(group) || []), cluster]);
    });
    return [...groups.entries()].map(([label, items]) => ({
      label,
      options: items.map((cluster) => {
        const ready = cluster.nodes.filter((node) => node.status === 'Ready').length;
        return {
          value: cluster.id,
          label: `${cluster.name} · ${ready}/${cluster.nodes.length} Ready`,
          searchText: `${label} ${cluster.name}`,
        };
      }),
    }));
  }, []);

  const visibleModels = useMemo(() => {
    const keyword = modelSearch.trim().toLowerCase();
    return models.filter((model) => {
      const hostMatch = hostFilter === 'all' || model.copies.some((copy) => copy.host === hostFilter);
      const text = `${model.name} ${model.type} ${model.copies.map((copy) => `${copy.host} ${copy.path}`).join(' ')}`.toLowerCase();
      return hostMatch && (!keyword || text.includes(keyword));
    });
  }, [hostFilter, modelSearch, models]);

  const visibleTasks = useMemo(() => {
    const keyword = taskSearch.trim().toLowerCase();
    return tasks
      .filter((task) => (taskTypeFilter === 'all' || task.type === taskTypeFilter)
        && (taskStatusFilter === 'all' || task.status === taskStatusFilter)
        && (!keyword || `${task.name} ${task.model} ${task.source} ${task.target}`.toLowerCase().includes(keyword)))
      .sort((a, b) => {
        const runningOrder = Number(b.status === 'running') - Number(a.status === 'running');
        return runningOrder || b.updatedAt - a.updatedAt;
      });
  }, [taskSearch, taskStatusFilter, taskTypeFilter, tasks]);

  const visibleImages = useMemo(() => {
    const keyword = imageSearch.trim().toLowerCase();
    return imageRows.filter((image) => !keyword || `${image.name} ${image.desc} ${image.source}`.toLowerCase().includes(keyword));
  }, [imageSearch]);

  const visibleFiles = useMemo(() => {
    const keyword = fileSearch.trim().toLowerCase();
    return fileRows.filter((file) => !keyword || `${file.name} ${file.desc} ${file.type} ${file.source}`.toLowerCase().includes(keyword));
  }, [fileSearch]);

  const selectedModel = models.find((model) => model.id === selectedModelId) || models[0];
  const selectedCopy = selectedModel.copies.find((copy) => copy.id === selectedCopyId) || selectedModel.copies[0];
  const selectedCluster = clusters.find((cluster) => cluster.id === selectedClusterId) || clusters[0];
  const readyNodes = selectedCluster.nodes.filter((node) => node.status === 'Ready');
  const selectableNodes = selectedCluster.nodes.filter((node) => canNodeReceiveModel(node, selectedCopy.sizeGb));
  const notReadyCount = selectedCluster.nodes.filter((node) => node.status === 'NotReady').length;
  const disabledCount = selectedCluster.nodes.filter((node) => node.status === 'Disabled').length;
  const spaceBlockedCount = readyNodes.length - selectableNodes.length;
  const selectedTargetNodes = targetMode === 'cluster'
    ? selectableNodes
    : selectedCluster.nodes.filter((node) => selectedNodeIds.includes(node.id) && canNodeReceiveModel(node, selectedCopy.sizeGb));
  const visibleClusterNodes = selectedCluster.nodes.filter((node) => `${node.name} ${node.ip}`.toLowerCase().includes(nodeSearch.trim().toLowerCase()));
  const targetSpaceBlockedCount = targetMode === 'cluster' ? spaceBlockedCount : 0;
  const estimatedTransferGb = selectedCopy.sizeGb * selectedTargetNodes.length;

  const openDistribution = (modelId: string, copyId?: string) => {
    const model = models.find((item) => item.id === modelId);
    if (!model) return;
    const copy = model.copies.find((item) => item.id === copyId) || model.copies[0];
    const defaultCluster = clusters[0];
    setSelectedModelId(model.id);
    setSelectedCopyId(copy.id);
    setTargetMode('nodes');
    setSelectedClusterId(defaultCluster.id);
    setSelectedNodeIds([]);
    setNodeSearch('');
    distributionForm.setFieldsValue({
      taskName: `同步 ${model.name} 至生产集群`,
      modelId: model.id,
      copyId: copy.id,
      targetMode: 'nodes',
      targetCluster: defaultCluster.id,
      targetNodeIds: [],
      credential: defaultCluster.credential,
      targetPath: `/data/models/${model.name}`,
      verify: true,
    });
    setDistributionOpen(true);
  };

  const openDownload = () => {
    setDownloadOpen(true);
  };

  const changeTargetMode = (mode: TargetMode) => {
    const nextNodeIds = mode === 'nodes'
      ? []
      : getSelectableNodeIds(selectedCluster.nodes, selectedCopy.sizeGb);
    setTargetMode(mode);
    setSelectedNodeIds(nextNodeIds);
    distributionForm.setFieldsValue({ targetMode: mode, targetNodeIds: nextNodeIds });
  };

  const changeTargetCluster = (clusterId: string) => {
    const cluster = clusters.find((item) => item.id === clusterId) || clusters[0];
    const nextNodeIds = targetMode === 'cluster'
      ? getSelectableNodeIds(cluster.nodes, selectedCopy.sizeGb)
      : [];
    setSelectedClusterId(cluster.id);
    setSelectedNodeIds(nextNodeIds);
    setNodeSearch('');
    distributionForm.setFieldsValue({
      targetCluster: cluster.id,
      targetNodeIds: nextNodeIds,
      credential: cluster.credential,
    });
  };

  const createDownloadTask = async (values: ModelDownloadTaskValues) => {
    const task: DistributionTask = {
      id: Date.now(),
      name: values.taskName,
      model: values.modelName,
      type: 'download',
      source: 'HTTPS URL',
      target: `${values.host} · ${values.path}`,
      progress: 0,
      speed: '等待连接',
      status: 'running',
      updatedAt: Date.now(),
      updatedText: '刚刚',
      url: values.url,
      targetPath: values.path,
      resume: values.resume,
      verify: values.verify,
      fileName: values.fileName,
    };
    setTasks((items) => [task, ...items]);
    setDownloadOpen(false);
    setModelSubview('tasks');
    message.success('模型下载任务已创建');
  };

  const createDistributionTask = async () => {
    const values = await distributionForm.validateFields();
    const model = models.find((item) => item.id === values.modelId);
    const copy = model?.copies.find((item) => item.id === values.copyId);
    const cluster = clusters.find((item) => item.id === values.targetCluster);
    if (!model || !copy || !cluster) return;
    const targetNodeIds = Array.isArray(values.targetNodeIds) ? values.targetNodeIds : [];
    const nodes = values.targetMode === 'cluster'
      ? cluster.nodes.filter((node) => canNodeReceiveModel(node, copy.sizeGb))
      : cluster.nodes.filter((node) => targetNodeIds.includes(node.id) && canNodeReceiveModel(node, copy.sizeGb));
    if (!nodes.length) {
      message.warning('请至少选择一个可用的目标 Node');
      return;
    }
    const task: DistributionTask = {
      id: Date.now(),
      name: values.taskName,
      model: model.name,
      type: 'distribution',
      source: copy.host,
      target: `${cluster.name} · ${values.targetMode === 'cluster' ? `全部 ${nodes.length} 个 Ready Nodes` : `指定 ${nodes.length} 个 Nodes`}`,
      progress: 0,
      speed: '等待预检',
      status: 'running',
      updatedAt: Date.now(),
      updatedText: '刚刚',
      sourcePath: copy.path,
      targetPath: values.targetPath,
      targetCluster: cluster.name,
      targetMode: values.targetMode,
      credential: values.credential,
      verify: values.verify,
      sizeGb: copy.sizeGb,
      nodes: nodes.map((node) => ({
        name: node.name,
        progress: 0,
        speed: '等待预检',
        status: 'pending',
      })),
    };
    setTasks((items) => [task, ...items]);
    setDistributionOpen(false);
    setModelSubview('tasks');
    message.success('模型分发任务已创建');
  };

  const showModelTasks = (model: ModelRecord) => {
    setTaskSearch(model.name);
    setTaskTypeFilter('all');
    setTaskStatusFilter('all');
    setModelSubview('tasks');
  };

  const taskColumns: ColumnsType<DistributionTask> = [
    {
      title: '任务／模型',
      key: 'task',
      width: 230,
      render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.model}</small></span>,
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      width: 92,
      render: (value) => <Tag className={`distribution-task-type ${value}`}>{value === 'download' ? '模型下载' : '模型分发'}</Tag>,
    },
    {
      title: '来源／目标',
      key: 'route',
      width: 200,
      render: (_, record) => <span className="distribution-table-main"><strong>{record.source}</strong><small>{record.target}</small></span>,
    },
    {
      title: '任务进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (value, record) => <div className="distribution-task-progress"><Progress percent={value} size="small" status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'} /><small>{record.type === 'download' ? '单任务下载进度' : '目标节点汇总进度'}</small></div>,
    },
    { title: '实时速度', dataIndex: 'speed', key: 'speed', width: 92 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 88,
      render: (value) => {
        return <span className={`distribution-task-status ${value}`}>{getTaskStatusLabel(value as DistributionTask['status'])}</span>;
      },
    },
    { title: '更新时间', dataIndex: 'updatedText', key: 'updatedText', width: 88 },
    {
      title: '操作',
      key: 'actions',
      width: 112,
      fixed: 'right',
      align: 'center',
      className: 'distribution-action-column',
      render: (_, record) => (
        <div className="distribution-task-actions">
          <Button className="distribution-table-action" type="link" size="small" onClick={() => setTaskDetail(record)}>详情</Button>
          {record.status === 'running' && <Button className="distribution-table-action" type="link" danger size="small" onClick={() => setTasks((items) => items.map((item) => item.id === record.id ? {
            ...item,
            status: 'stopped',
            speed: '—',
            updatedAt: Date.now(),
            updatedText: '刚刚',
            nodes: item.nodes?.map((node) => node.status === 'running' || node.status === 'pending' ? { ...node, status: 'stopped', speed: '—' } : node),
          } : item))}>停止</Button>}
        </div>
      ),
    },
  ];

  const modelCatalog = (
    <div className="distribution-model-view">
      <div className="distribution-toolbar">
        <Select value={hostFilter} onChange={setHostFilter} options={hostOptions} />
        <Input.Search value={modelSearch} onChange={(event) => setModelSearch(event.target.value)} allowClear placeholder="搜索模型名称、主机或目录" />
        <span />
        <Button icon={<ReloadOutlined />} onClick={() => message.success('模型列表已刷新')} />
        <Button icon={<CloudDownloadOutlined />} onClick={openDownload}>下载模型</Button>
        <Button className="ataas-page-create-button" type="primary" icon={<PlusOutlined />} onClick={() => openDistribution(models[0].id)}>创建分发</Button>
      </div>
      <div className="distribution-model-grid">
        {visibleModels.map((model) => {
          const opened = expandedModel === model.id;
          const extraCopies = Math.max(0, model.copies.length - 3);
          const modelBrand = getModelBrand(model.name);
          return (
            <article key={model.id} className={`distribution-model-card${opened ? ' expanded' : ''}`}>
              <header>
                <span className={`distribution-model-icon ${modelBrand}`}>
                  <img src={modelBrandLogos[modelBrand]} alt={`${model.name} logo`} />
                </span>
                <div><strong title={model.name}>{model.name}</strong><small>{model.type}</small></div>
                <span className="distribution-model-ready"><i />可分发</span>
              </header>
              <div className="distribution-model-body">
                <div className="distribution-model-summary">
                  <div className="distribution-model-size"><span>模型大小</span><strong>{formatSize(model.copies[0].sizeGb)}</strong></div>
                  <button type="button" className="distribution-copy-trigger" aria-expanded={opened} onClick={() => setExpandedModel(opened ? null : model.id)}>
                    <span className="distribution-host-stack">
                      {model.copies.slice(0, 3).map((copy) => <i key={copy.id}><CloudServerOutlined /></i>)}
                      {extraCopies > 0 && <b>+{extraCopies}</b>}
                    </span>
                    <span><strong>分布于 {model.copies.length} 台主机</strong><small>{opened ? '收起副本列表' : '展开查看可用副本'}</small></span>
                    <em>⌄</em>
                  </button>
                </div>
                {opened && (
                  <div className="distribution-copy-list">
                    <div className="distribution-copy-list-head"><span>可用副本 · {model.copies.length}</span><small>显示前 3 条，滚动查看更多</small></div>
                    {model.copies.map((copy) => (
                      <div key={copy.id} className="distribution-copy-row">
                        <span><strong>{copy.host} · {copy.ip} · {formatSize(copy.sizeGb)}</strong><small title={copy.path}>{copy.path}</small></span>
                        <Button className="distribution-copy-row-action" type="link" size="small" onClick={() => openDistribution(model.id, copy.id)}>从此副本分发</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <footer>
                <Button type="text" size="small" className="distribution-card-action" onClick={() => showModelTasks(model)}>查看相关任务</Button>
                <Button size="small" className="distribution-card-action primary" onClick={() => openDistribution(model.id)}>分发模型</Button>
              </footer>
            </article>
          );
        })}
      </div>
      <div className="distribution-pagination">共 {visibleModels.length} 个模型</div>
    </div>
  );

  const taskList = (
    <div className="distribution-task-view">
      <div className="distribution-toolbar">
        <Select value={taskStatusFilter} onChange={setTaskStatusFilter} options={[
          { value: 'all', label: '全部状态' },
          { value: 'running', label: '执行中' },
          { value: 'completed', label: '已完成' },
          { value: 'failed', label: '异常' },
          { value: 'stopped', label: '已停止' },
        ]} />
        <Select value={taskTypeFilter} onChange={setTaskTypeFilter} options={[
          { value: 'all', label: '全部任务类型' },
          { value: 'download', label: '模型下载' },
          { value: 'distribution', label: '模型分发' },
        ]} />
        <Input.Search value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} allowClear placeholder="搜索任务、模型、主机或目标集群" />
        <span />
        <Button icon={<ReloadOutlined />} onClick={() => message.success('任务列表已刷新')} />
      </div>
      <Table className="distribution-task-table" columns={taskColumns} dataSource={visibleTasks} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条任务` }} scroll={{ x: 1078 }} />
    </div>
  );

  const modelPane = (
    <Tabs
      activeKey={modelSubview}
      onChange={(key) => setModelSubview(key as 'catalog' | 'tasks')}
      items={[
        { key: 'catalog', label: <span>模型列表 <Tag bordered={false}>{models.length}</Tag></span>, children: modelCatalog },
        { key: 'tasks', label: <span>任务列表 <Tag bordered={false}>{tasks.length}</Tag></span>, children: taskList },
      ]}
    />
  );

  const imagePane = (
    <div className="distribution-simple-pane">
      <div className="distribution-simple-toolbar">
        <Input.Search value={imageSearch} onChange={(event) => setImageSearch(event.target.value)} allowClear placeholder="搜索镜像名称或来源仓库" />
        <span />
        <Button className="distribution-pane-create-button ataas-page-create-button" type="primary" icon={<PlusOutlined />} onClick={() => message.info('创建镜像分发')}>创建镜像分发</Button>
      </div>
      <Table tableLayout="fixed" dataSource={visibleImages} pagination={false} columns={[
        { title: '镜像', key: 'name', width: '22%', render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.desc}</small></span> },
        { title: '来源', dataIndex: 'source', key: 'source', width: '17%' },
        { title: '镜像大小', dataIndex: 'size', key: 'size', width: '13%' },
        { title: '可用状态', key: 'status', width: '14%', render: () => <span className="distribution-task-status completed">可分发</span> },
        { title: '最近更新', dataIndex: 'updated', key: 'updated', width: '16%' },
        { title: '操作', key: 'action', width: '10%', align: 'center', className: 'distribution-action-column', render: () => <Button className="distribution-table-action" type="link" icon={<SendOutlined />} onClick={() => message.info('创建镜像分发')}>分发</Button> },
        { title: '', key: 'spacer', width: '8%', className: 'distribution-flex-spacer', render: () => null },
      ]} />
    </div>
  );

  const filePane = (
    <div className="distribution-simple-pane">
      <div className="distribution-simple-toolbar">
        <Input.Search value={fileSearch} onChange={(event) => setFileSearch(event.target.value)} allowClear placeholder="搜索文件、类型或来源主机" />
        <span />
        <Button className="distribution-pane-create-button ataas-page-create-button" type="primary" icon={<PlusOutlined />} onClick={() => message.info('创建文件分发')}>创建文件分发</Button>
      </div>
      <Table tableLayout="fixed" dataSource={visibleFiles} pagination={false} columns={[
        { title: '文件／软件包', key: 'name', width: '23%', render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.desc}</small></span> },
        { title: '类型', dataIndex: 'type', key: 'type', width: '12%' },
        { title: '文件大小', dataIndex: 'size', key: 'size', width: '13%' },
        { title: '来源主机', dataIndex: 'source', key: 'source', width: '17%' },
        { title: '最近更新', dataIndex: 'updated', key: 'updated', width: '17%' },
        { title: '操作', key: 'action', width: '10%', align: 'center', className: 'distribution-action-column', render: () => <Button className="distribution-table-action" type="link" icon={<FileOutlined />} onClick={() => message.info('创建文件分发')}>分发</Button> },
        { title: '', key: 'spacer', width: '8%', className: 'distribution-flex-spacer', render: () => null },
      ]} />
    </div>
  );

  return (
    <div className="distribution-center-page">
      <header className="distribution-center-header">
        <div><h1>分发中心</h1><p>统一管理模型、镜像与文件的分发，支持创建任务、选择目标，并跟踪传输进度与异常。</p></div>
      </header>
      <Tabs
        className="distribution-kind-tabs"
        activeKey={resourceKind}
        onChange={(key) => setResourceKind(key as 'models' | 'images' | 'files')}
        items={[
          { key: 'models', label: '模型分发', children: modelPane },
          { key: 'images', label: '镜像分发', children: imagePane },
          { key: 'files', label: '文件分发', children: filePane },
        ]}
      />

      <ModelDownloadTaskModal
        open={downloadOpen}
        hostOptions={hostOptions.filter((item) => item.value !== 'all').map((item) => {
          const copy = models.flatMap((model) => model.copies).find((modelCopy) => modelCopy.host === item.value);
          return {
            value: item.value,
            label: item.label,
            ip: copy?.ip || '等待选择',
            freeGb: hostFreeSpace[item.value] || 600,
          };
        })}
        onSubmit={createDownloadTask}
        onCancel={() => setDownloadOpen(false)}
      />

      <Modal
        className="distribution-create-modal"
        title="创建模型分发"
        open={distributionOpen}
        width={1040}
        style={{ top: 24 }}
        okText="创建并分发"
        onOk={createDistributionTask}
        onCancel={() => setDistributionOpen(false)}
      >
        <p className="distribution-modal-note">从已有模型副本向目标集群或指定 Nodes 分发。提交前会检查 SSH 连通性、目录权限、节点状态和磁盘空间。</p>
        <Form form={distributionForm} layout="vertical">
          <section className="distribution-form-section">
            <h3>选择模型</h3>
            <div className="distribution-form-grid">
              <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}><Input /></Form.Item>
              <Form.Item label="模型" name="modelId" rules={[{ required: true, message: '请选择模型' }]}>
                <Select showSearch optionFilterProp="label" options={models.map((model) => ({ value: model.id, label: model.name }))} onChange={(modelId) => {
                  const model = models.find((item) => item.id === modelId);
                  if (!model) return;
                  const copy = model.copies[0];
                  const nextNodeIds = targetMode === 'cluster'
                    ? getSelectableNodeIds(selectedCluster.nodes, copy.sizeGb)
                    : [];
                  setSelectedModelId(modelId);
                  setSelectedCopyId(copy.id);
                  setSelectedNodeIds(nextNodeIds);
                  distributionForm.setFieldsValue({
                    copyId: copy.id,
                    targetPath: `/data/models/${model.name}`,
                    targetNodeIds: nextNodeIds,
                  });
                }} />
              </Form.Item>
              <Form.Item label="源副本（主机）" name="copyId" extra="同一模型存在于多台主机时，可选择本次使用的源副本。" rules={[{ required: true, message: '请选择源副本' }]}>
                <Select
                  onChange={(copyId) => {
                    const copy = selectedModel.copies.find((item) => item.id === copyId);
                    setSelectedCopyId(copyId);
                    if (!copy) return;
                    const nextNodeIds = targetMode === 'cluster'
                      ? getSelectableNodeIds(selectedCluster.nodes, copy.sizeGb)
                      : [];
                    setSelectedNodeIds(nextNodeIds);
                    distributionForm.setFieldsValue({ targetNodeIds: nextNodeIds });
                  }}
                  options={selectedModel.copies.map((copy) => ({
                    value: copy.id,
                    label: `${copy.host} · ${copy.ip} · ${formatSize(copy.sizeGb)}`,
                  }))}
                />
              </Form.Item>
              <div className="distribution-source-path">
                <span>源模型目录</span>
                <strong>{selectedCopy.path}</strong>
                <small>目录由所选副本自动带入，分发前只读校验。</small>
              </div>
            </div>
          </section>

          <section className="distribution-form-section">
            <h3>分发目标</h3>
            <Form.Item className="distribution-target-mode" label="目标方式" name="targetMode">
              <Radio.Group optionType="button" buttonStyle="solid" onChange={(event) => changeTargetMode(event.target.value as TargetMode)}>
                <Radio.Button value="cluster">整个集群</Radio.Button>
                <Radio.Button value="nodes">指定 Nodes</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <div className="distribution-form-grid">
              <Form.Item className="wide" label="目标集群" name="targetCluster" extra="支持按供应商、数据中心或集群名称搜索。" rules={[{ required: true, message: '请选择目标集群' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  popupClassName="distribution-cluster-select-popup"
                  filterOption={(input, option) => String((option as { searchText?: string })?.searchText || option?.label || '').toLowerCase().includes(input.toLowerCase())}
                  options={clusterOptions}
                  onChange={changeTargetCluster}
                />
              </Form.Item>

              <div className="distribution-target-summary wide">
                <div><span>所属位置</span><strong>{selectedCluster.supplier} / {selectedCluster.dataCenter}</strong></div>
                <div><span>集群 Nodes</span><strong>{selectedCluster.nodes.length}</strong></div>
                <div><span>可参与分发</span><strong>{selectableNodes.length} Ready</strong></div>
                <div><span>自动排除</span><strong>{notReadyCount} NotReady · {disabledCount} 已停用 · {spaceBlockedCount} 空间不足</strong></div>
              </div>

              {targetMode === 'nodes' && (
                <>
                  <div className="wide distribution-node-search">
                    <Input.Search value={nodeSearch} onChange={(event) => setNodeSearch(event.target.value)} allowClear placeholder="搜索 Node 名称或 IP" />
                    <span>NotReady、已停用和空间不足 Nodes 仅供查看，不能选中。</span>
                  </div>
                  <Form.Item
                    className="wide distribution-node-field"
                    label={`选择目标 Nodes（已选 ${selectedTargetNodes.length} 个）`}
                    name="targetNodeIds"
                    rules={[{ required: true, message: '请至少选择一个目标 Node' }]}
                  >
                    <Checkbox.Group onChange={(values) => {
                      const nextNodeIds = (values as string[]).filter((nodeId) => (
                        selectedCluster.nodes.some((node) => node.id === nodeId && canNodeReceiveModel(node, selectedCopy.sizeGb))
                      ));
                      setSelectedNodeIds(nextNodeIds);
                      distributionForm.setFieldsValue({ targetNodeIds: nextNodeIds });
                    }}>
                      <div className="distribution-node-picker">
                        {visibleClusterNodes.map((node) => {
                          const selectable = canNodeReceiveModel(node, selectedCopy.sizeGb);
                          const selected = selectedNodeIds.includes(node.id) && selectable;
                          const diskTotalGb = node.diskTotalGb;
                          const existingUsedGb = Math.max(0, diskTotalGb - node.diskFreeGb);
                          const remainingGb = Math.max(0, node.diskFreeGb - (selected ? selectedCopy.sizeGb : 0));
                          const projectedRemainingGb = Math.max(0, node.diskFreeGb - selectedCopy.sizeGb);
                          const shortageGb = Math.max(0, selectedCopy.sizeGb - node.diskFreeGb);
                          const usedPercent = Math.min(100, Math.round((existingUsedGb / diskTotalGb) * 100));
                          const modelPercent = selected ? Math.min(100 - usedPercent, Math.round((selectedCopy.sizeGb / diskTotalGb) * 100)) : 0;
                          const disabledLabel = node.status === 'Ready' ? '空间不足' : node.status;
                          const className = [
                            'distribution-node-option',
                            node.status.toLowerCase(),
                            selected ? 'selected' : '',
                            selectable ? '' : 'unavailable',
                            node.status === 'Ready' && !selectable ? 'insufficient' : '',
                          ].filter(Boolean).join(' ');

                          return (
                            <label key={node.id} className={className}>
                              <Checkbox value={node.id} disabled={!selectable} />
                              <span className="distribution-node-main">
                                <strong>{node.name}</strong>
                                <small>{node.ip} · {node.status}</small>
                              </span>
                              <span className="distribution-node-capacity">
                                <strong>{selected ? `剩余 ${formatSize(remainingGb)}` : `当前可用 ${formatSize(node.diskFreeGb)}`}</strong>
                                <small>总量 {formatTotalSize(diskTotalGb)} · 已用 {formatSize(existingUsedGb)}</small>
                                <span className="distribution-node-meter">
                                  <i className="used" style={{ width: `${usedPercent}%` }} />
                                  <i className="model" style={{ left: `${usedPercent}%`, width: `${modelPercent}%` }} />
                                </span>
                              </span>
                              <span className="distribution-node-impact">
                                <small>{selectable ? `${selected ? '模型占用' : '选择后占用'} ${formatSize(selectedCopy.sizeGb)}` : disabledLabel}</small>
                                <strong>{selectable ? `${selected ? '分发后剩余' : '预计剩余'} ${formatSize(selected ? remainingGb : projectedRemainingGb)}` : shortageGb ? `缺口 ${formatSize(shortageGb)}` : '不可选'}</strong>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </Checkbox.Group>
                  </Form.Item>
                </>
              )}

              <Form.Item label="SSH 凭据" name="credential" extra="使用已在平台维护并授权到该数据中心的凭据。" rules={[{ required: true, message: '请选择 SSH 凭据' }]}>
                <Select options={[
                  { value: selectedCluster.credential, label: selectedCluster.credential },
                  { value: 'cluster-default-root-key', label: 'cluster-default-root-key' },
                ]} />
              </Form.Item>
              <Form.Item label="目标目录" name="targetPath" rules={[{ required: true, message: '请输入目标目录' }]}><Input /></Form.Item>

              <div className={`distribution-preflight wide${targetSpaceBlockedCount ? ' warning' : ''}`}>
                <div><span>本次目标</span><strong>{selectedTargetNodes.length} 个 Nodes</strong></div>
                <div><span>模型大小</span><strong>{formatSize(selectedCopy.sizeGb)}</strong></div>
                <div><span>预计传输总量</span><strong>{formatTotalSize(estimatedTransferGb)}</strong></div>
                <div><span>空间预检</span><strong>{targetSpaceBlockedCount ? `已排除 ${targetSpaceBlockedCount} 个空间不足` : '当前选择可用'}</strong></div>
              </div>

              <Form.Item className="wide distribution-checks" name="verify" valuePropName="checked">
                <Checkbox>分发完成后校验文件大小与校验值</Checkbox>
              </Form.Item>
            </div>
          </section>
        </Form>
      </Modal>

      <Modal
        title={taskDetail?.type === 'download' ? '模型下载任务详情' : '模型分发任务详情'}
        open={Boolean(taskDetail)}
        width={900}
        className="distribution-task-detail-modal"
        footer={<Button onClick={() => setTaskDetail(null)}>关闭</Button>}
        onCancel={() => setTaskDetail(null)}
      >
        {taskDetail && (
          <div className="distribution-task-detail">
            <div className="distribution-detail-hero">
              <span className={`distribution-detail-icon ${taskDetail.type}`}>
                {taskDetail.type === 'download' ? <CloudDownloadOutlined /> : <SendOutlined />}
              </span>
              <div>
                <strong>{taskDetail.name}</strong>
                <small>{taskDetail.model}</small>
              </div>
              <span className={`distribution-task-status ${taskDetail.status}`}>{getTaskStatusLabel(taskDetail.status)}</span>
            </div>
            <div className="distribution-detail-summary">
              <div className="progress-metric">
                <span>{taskDetail.type === 'download' ? '下载进度' : '总体进度'}</span>
                <strong>{taskDetail.progress}%</strong>
                <Progress percent={taskDetail.progress} showInfo={false} size="small" status={taskDetail.status === 'failed' ? 'exception' : taskDetail.status === 'completed' ? 'success' : 'active'} />
              </div>
              <div><span>实时速度</span><strong>{taskDetail.speed}</strong></div>
              <div><span>{taskDetail.type === 'download' ? '文件大小' : '目标 Nodes'}</span><strong>{taskDetail.type === 'download' ? taskDetail.sizeGb ? formatTotalSize(taskDetail.sizeGb) : '预检中' : `${taskDetail.nodes?.length || 0} 个`}</strong></div>
              <div><span>更新时间</span><strong>{taskDetail.updatedText}</strong></div>
            </div>
            <h3 className="distribution-detail-section-title">任务信息</h3>
            <div className="distribution-detail-info">
              <div><span>任务名称</span><strong>{taskDetail.name}</strong></div>
              <div><span>模型</span><strong>{taskDetail.model}</strong></div>
              {taskDetail.type === 'download' ? (
                <>
                  <div className="wide"><span>模型 URL</span><strong>{taskDetail.url || '—'}</strong></div>
                  <div><span>下载位置</span><strong>{taskDetail.target}</strong></div>
                  <div><span>断点续传</span><strong>{taskDetail.resume ? '已启用' : '未启用'}</strong></div>
                  <div><span>完整性校验</span><strong>{taskDetail.verify ? '下载后执行' : '未启用'}</strong></div>
                </>
              ) : (
                <>
                  <div className="wide"><span>源主机与目录</span><strong>{taskDetail.source} · {taskDetail.sourcePath}</strong></div>
                  <div><span>目标集群</span><strong>{taskDetail.targetCluster}</strong></div>
                  <div><span>目标方式</span><strong>{taskDetail.targetMode === 'cluster' ? '整个集群（全部 Ready Nodes）' : '指定 Nodes'}</strong></div>
                  <div><span>目标目录</span><strong>{taskDetail.targetPath}</strong></div>
                  <div><span>SSH 凭据</span><strong>{taskDetail.credential}</strong></div>
                  <div><span>完成校验</span><strong>{taskDetail.verify ? '文件大小与校验值' : '未启用'}</strong></div>
                </>
              )}
            </div>
            {taskDetail.detail && <div className="distribution-detail-error"><strong>异常信息</strong><span>{taskDetail.detail}</span></div>}
            {taskDetail.type === 'download' ? (
              <div className="distribution-download-stages">
                <h3>执行阶段</h3>
                <div className="completed"><span>URL 与空间预检</span><strong>已完成</strong><small>URL 可访问，目标目录空间充足</small></div>
                <div className={taskDetail.status}><span>文件下载</span><strong>{taskDetail.status === 'completed' ? '已完成' : taskDetail.status === 'failed' ? '异常' : taskDetail.status === 'stopped' ? '已停止' : '下载中'}</strong><small>{taskDetail.progress}% · {taskDetail.speed}</small></div>
                <div className={taskDetail.status === 'completed' && taskDetail.verify ? 'completed' : 'pending'}><span>完整性校验</span><strong>{taskDetail.status === 'completed' && taskDetail.verify ? '已完成' : taskDetail.verify ? '等待下载完成' : '未启用'}</strong><small>{taskDetail.verify ? '校验文件大小与校验值' : '本任务未配置校验'}</small></div>
              </div>
            ) : (
              <div className="distribution-node-detail">
                <h3><span>Node 分发明细</span><small>共 {taskDetail.nodes?.length || 0} 个目标节点</small></h3>
                <Table
                  size="small"
                  rowKey="name"
                  pagination={false}
                  scroll={{ y: 280 }}
                  dataSource={taskDetail.nodes || []}
                  columns={[
                    { title: '目标 Node', dataIndex: 'name', key: 'name' },
                    { title: '进度', dataIndex: 'progress', key: 'progress', width: 180, render: (value, record) => <Progress percent={value} size="small" status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'} /> },
                    { title: '速度', dataIndex: 'speed', key: 'speed', width: 110 },
                    {
                      title: '状态／异常',
                      key: 'status',
                      width: 230,
                      render: (_, record) => <span className={record.status === 'failed' ? 'distribution-node-error' : ''}>{record.status === 'pending' ? '等待预检' : record.status === 'running' ? '分发中' : record.status === 'completed' ? '已完成' : record.status === 'failed' ? `异常 · ${record.detail}` : '已停止'}</span>,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DistributionCenterPage;
