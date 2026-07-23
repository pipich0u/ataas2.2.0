import {
  CloudDownloadOutlined,
  CloudServerOutlined,
  FileOutlined,
  InboxOutlined,
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
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
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

type TargetMode = 'cluster' | 'nodes';
type TaskNodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';

type ClusterNode = {
  id: string;
  name: string;
  ip: string;
  status: 'Ready' | 'NotReady' | 'Disabled';
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
) => Array.from({ length: count }, (_, index): ClusterNode => {
  const number = index + 1;
  const status = notReady.includes(number) ? 'NotReady' : disabled.includes(number) ? 'Disabled' : 'Ready';
  return {
    id: `${prefix}-${String(number).padStart(2, '0')}`,
    name: `${prefix}-${String(number).padStart(2, '0')}`,
    ip: `10.${24 + (prefix.length % 5)}.${16 + Math.floor(index / 250)}.${20 + (index % 220)}`,
    status,
    diskFreeGb: 420 + ((number * 137) % 1860),
  };
});

const clusters: ClusterRecord[] = [
  {
    id: 'gpu-prod-01',
    name: 'gpu-prod-01',
    supplier: '厂商A · xxx科技',
    dataCenter: '上海一号数据中心',
    credential: 'sh-prod-model-key',
    nodes: createClusterNodes('gpu-node', 82, [7, 42, 57], [19, 20]),
  },
  {
    id: 'cluster-sh-02',
    name: 'cluster-sh-02',
    supplier: '厂商A · xxx科技',
    dataCenter: '上海一号数据中心',
    credential: 'sh-prod-model-key',
    nodes: createClusterNodes('sh-node', 24, [4], [18]),
  },
  {
    id: 'gpu-test-sh-01',
    name: 'gpu-test-sh-01',
    supplier: '厂商A · xxx科技',
    dataCenter: '上海二号数据中心',
    credential: 'sh-test-model-key',
    nodes: createClusterNodes('test-node', 12, [9]),
  },
  {
    id: 'gpu-prod-zz-01',
    name: 'gpu-prod-zz-01',
    supplier: '厂商B · 中原算力',
    dataCenter: '郑州高新数据中心',
    credential: 'zz-prod-model-key',
    nodes: createClusterNodes('zz-node', 64, [11, 36], [52]),
  },
  {
    id: 'training-zz-02',
    name: 'training-zz-02',
    supplier: '厂商B · 中原算力',
    dataCenter: '郑州高新数据中心',
    credential: 'zz-prod-model-key',
    nodes: createClusterNodes('train-node', 32, [15]),
  },
  {
    id: 'gpu-prod-bj-01',
    name: 'gpu-prod-bj-01',
    supplier: '厂商C · 华北云',
    dataCenter: '北京亦庄数据中心',
    credential: 'bj-prod-model-key',
    nodes: createClusterNodes('bj-node', 40, [23], [31]),
  },
];

const initialModels: ModelRecord[] = [
  {
    id: 'glm-52',
    name: 'GLM-5.2',
    type: '大语言模型',
    copies: [
      { id: 'glm-52-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-b', host: 'model-store-02', ip: '10.24.16.32', path: '/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-c', host: 'gpu-node-07', ip: '10.24.18.107', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-d', host: 'gpu-node-12', ip: '10.24.18.112', path: '/data/models/GLM-5.2', sizeGb: 238 },
      { id: 'glm-52-e', host: 'gpu-node-18', ip: '10.24.18.118', path: '/data/models/GLM-5.2', sizeGb: 238 },
    ],
  },
  { id: 'deepseek-v4', name: 'DeepSeek-V4-Flash-Base', type: '大语言模型', copies: [{ id: 'dsv4-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/DeepSeek-V4-Flash-Base', sizeGb: 315 }] },
  { id: 'kimi-k27', name: 'Kimi-K2.7-Code', type: '代码模型', copies: [{ id: 'kimi-k27-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/Kimi-K2.7-Code', sizeGb: 284 }, { id: 'kimi-k27-b', host: 'gpu-node-03', ip: '10.24.18.103', path: '/models/Kimi-K2.7-Code', sizeGb: 284 }] },
  { id: 'kimi-k25', name: 'Kimi-K2.5', type: '大语言模型', copies: [{ id: 'kimi-k25-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/Kimi-K2.5', sizeGb: 276 }] },
  { id: 'deepseek-r1', name: 'DeepSeek-R1-0528', type: '推理模型', copies: [{ id: 'dsr1-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/DeepSeek-R1-0528', sizeGb: 642 }, { id: 'dsr1-b', host: 'gpu-node-01', ip: '10.24.18.101', path: '/data/models/DeepSeek-R1-0528', sizeGb: 642 }] },
  { id: 'qwen3', name: 'Qwen3-235B-A22B', type: '大语言模型', copies: [{ id: 'qwen3-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/Qwen3-235B-A22B', sizeGb: 468 }] },
  { id: 'qwen3-coder', name: 'Qwen3-Coder-Next', type: '代码模型', copies: [{ id: 'qwen3-coder-a', host: 'gpu-node-02', ip: '10.24.18.102', path: '/data/models/Qwen3-Coder-Next', sizeGb: 194 }] },
  { id: 'glm-51', name: 'GLM-5.1-FP8', type: '量化模型', copies: [{ id: 'glm-51-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/GLM-5.1-FP8', sizeGb: 132 }] },
  { id: 'kimi-k2', name: 'Kimi-K2-Instruct', type: '大语言模型', copies: [{ id: 'kimi-k2-a', host: 'gpu-node-06', ip: '10.24.18.106', path: '/data/models/Kimi-K2-Instruct', sizeGb: 278 }, { id: 'kimi-k2-b', host: 'model-store-02', ip: '10.24.16.32', path: '/models/Kimi-K2-Instruct', sizeGb: 278 }] },
  { id: 'qwen25', name: 'Qwen2.5-72B-Instruct', type: '大语言模型', copies: [{ id: 'qwen25-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/Qwen2.5-72B-Instruct', sizeGb: 145 }] },
  { id: 'bge-m3', name: 'BAAI-bge-m3', type: 'Embedding 模型', copies: [{ id: 'bge-a', host: 'model-store-02', ip: '10.24.16.32', path: '/models/BAAI-bge-m3', sizeGb: 2.3 }] },
  { id: 'reranker', name: 'BCE-reranker-base-v1', type: '重排模型', copies: [{ id: 'reranker-a', host: 'ops-transfer-01', ip: '10.24.16.21', path: '/data/models/BCE-reranker-base-v1', sizeGb: 1.1 }] },
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
    target: 'gpu-prod-01 · 指定 8 个 Nodes',
    progress: 42,
    speed: '3.24 GB/s',
    status: 'running',
    updatedAt: Date.now() - 120_000,
    updatedText: '2 分钟前',
    sourcePath: '/data/models/GLM-5.2',
    targetPath: '/data/models/GLM-5.2',
    targetCluster: 'gpu-prod-01',
    targetMode: 'nodes',
    credential: 'sh-prod-model-key',
    verify: true,
    sizeGb: 238,
    nodes: makeTaskNodes('gpu-prod-01', 8, 'running'),
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
    name: '同步 DeepSeek-R1 至测试集群',
    model: 'DeepSeek-R1-0528',
    type: 'distribution',
    source: 'model-store-02',
    target: 'gpu-test-sh-01 · 指定 4 个 Nodes',
    progress: 100,
    speed: '—',
    status: 'completed',
    updatedAt: Date.now() - 3_600_000,
    updatedText: '1 小时前',
    sourcePath: '/models/DeepSeek-R1-0528',
    targetPath: '/data/models/DeepSeek-R1-0528',
    targetCluster: 'gpu-test-sh-01',
    targetMode: 'nodes',
    credential: 'sh-test-model-key',
    verify: true,
    sizeGb: 642,
    nodes: makeTaskNodes('gpu-test-sh-01', 4, 'completed'),
  },
  {
    id: 1003,
    name: '下载 Qwen3-Coder-Next',
    model: 'Qwen3-Coder-Next',
    type: 'download',
    source: 'HTTPS URL',
    target: 'gpu-node-02 · /data/models/',
    progress: 37,
    speed: '—',
    status: 'stopped',
    updatedAt: Date.now() - 7_200_000,
    updatedText: '2 小时前',
    url: 'https://models.example.com/Qwen3-Coder-Next.tar.zst',
    targetPath: '/data/models/',
    resume: true,
    verify: true,
    sizeGb: 194,
  },
  {
    id: 1002,
    name: '同步 Qwen3-235B 至生产集群',
    model: 'Qwen3-235B-A22B',
    type: 'distribution',
    source: 'ops-transfer-01',
    target: 'gpu-prod-01 · 指定 8 个 Nodes',
    progress: 91,
    speed: '—',
    status: 'failed',
    updatedAt: Date.now() - 10_800_000,
    updatedText: '3 小时前',
    detail: 'gpu-node-08 SSH 连接失败',
    sourcePath: '/data/models/Qwen3-235B-A22B',
    targetPath: '/data/models/Qwen3-235B-A22B',
    targetCluster: 'gpu-prod-01',
    targetMode: 'nodes',
    credential: 'sh-prod-model-key',
    verify: true,
    sizeGb: 468,
    nodes: makeTaskNodes('gpu-prod-01', 8, 'failed', 'gpu-node-08'),
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

const hostFreeSpace: Record<string, number> = {
  'ops-transfer-01': 1860,
  'model-store-02': 2940,
  'gpu-node-01': 1160,
  'gpu-node-02': 980,
  'gpu-node-03': 1420,
  'gpu-node-06': 880,
  'gpu-node-07': 760,
  'gpu-node-12': 1240,
  'gpu-node-18': 1520,
};

const DistributionCenterPage = () => {
  const [resourceKind, setResourceKind] = useState<'models' | 'images' | 'files'>('models');
  const [modelSubview, setModelSubview] = useState<'catalog' | 'tasks'>('catalog');
  const [models, setModels] = useState(initialModels);
  const [tasks, setTasks] = useState(initialTasks);
  const [modelSearch, setModelSearch] = useState('');
  const [hostFilter, setHostFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
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
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(clusters[0].nodes.filter((node) => node.status === 'Ready').slice(0, 8).map((node) => node.id));
  const [nodeSearch, setNodeSearch] = useState('');
  const [downloadForm] = Form.useForm();
  const [distributionForm] = Form.useForm();
  const watchedDownloadHost = Form.useWatch('host', downloadForm);

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

  const selectedDownloadHostCopy = models.flatMap((model) => model.copies).find((copy) => copy.host === watchedDownloadHost);
  const selectedDownloadHostFreeGb = hostFreeSpace[watchedDownloadHost] || 600;
  const selectedModel = models.find((model) => model.id === selectedModelId) || models[0];
  const selectedCopy = selectedModel.copies.find((copy) => copy.id === selectedCopyId) || selectedModel.copies[0];
  const selectedCluster = clusters.find((cluster) => cluster.id === selectedClusterId) || clusters[0];
  const readyNodes = selectedCluster.nodes.filter((node) => node.status === 'Ready');
  const notReadyCount = selectedCluster.nodes.filter((node) => node.status === 'NotReady').length;
  const disabledCount = selectedCluster.nodes.filter((node) => node.status === 'Disabled').length;
  const selectedTargetNodes = targetMode === 'cluster'
    ? readyNodes
    : selectedCluster.nodes.filter((node) => selectedNodeIds.includes(node.id) && node.status === 'Ready');
  const visibleClusterNodes = selectedCluster.nodes.filter((node) => `${node.name} ${node.ip}`.toLowerCase().includes(nodeSearch.trim().toLowerCase()));
  const lowSpaceCount = selectedTargetNodes.filter((node) => node.diskFreeGb < selectedCopy.sizeGb * 1.1).length;
  const estimatedTransferGb = selectedCopy.sizeGb * selectedTargetNodes.length;

  const openDistribution = (modelId: string, copyId?: string) => {
    const model = models.find((item) => item.id === modelId);
    if (!model) return;
    const copy = model.copies.find((item) => item.id === copyId) || model.copies[0];
    const defaultCluster = clusters[0];
    const defaultNodeIds = defaultCluster.nodes.filter((node) => node.status === 'Ready').slice(0, 8).map((node) => node.id);
    setSelectedModelId(model.id);
    setSelectedCopyId(copy.id);
    setTargetMode('nodes');
    setSelectedClusterId(defaultCluster.id);
    setSelectedNodeIds(defaultNodeIds);
    setNodeSearch('');
    distributionForm.setFieldsValue({
      taskName: `同步 ${model.name} 至生产集群`,
      modelId: model.id,
      copyId: copy.id,
      targetMode: 'nodes',
      targetCluster: defaultCluster.id,
      targetNodeIds: defaultNodeIds,
      credential: defaultCluster.credential,
      targetPath: `/data/models/${model.name}`,
      verify: true,
    });
    setDistributionOpen(true);
  };

  const openDownload = () => {
    downloadForm.setFieldsValue({
      taskName: '',
      modelName: '',
      url: '',
      host: 'model-store-02',
      path: '/data/models/',
      fileName: '',
      resume: true,
      verify: true,
    });
    setDownloadOpen(true);
  };

  const changeTargetMode = (mode: TargetMode) => {
    const nextNodeIds = mode === 'nodes'
      ? readyNodes.slice(0, Math.min(8, readyNodes.length)).map((node) => node.id)
      : readyNodes.map((node) => node.id);
    setTargetMode(mode);
    setSelectedNodeIds(nextNodeIds);
    distributionForm.setFieldsValue({ targetMode: mode, targetNodeIds: nextNodeIds });
  };

  const changeTargetCluster = (clusterId: string) => {
    const cluster = clusters.find((item) => item.id === clusterId) || clusters[0];
    const clusterReadyNodes = cluster.nodes.filter((node) => node.status === 'Ready');
    const nextNodeIds = targetMode === 'cluster'
      ? clusterReadyNodes.map((node) => node.id)
      : clusterReadyNodes.slice(0, Math.min(8, clusterReadyNodes.length)).map((node) => node.id);
    setSelectedClusterId(cluster.id);
    setSelectedNodeIds(nextNodeIds);
    setNodeSearch('');
    distributionForm.setFieldsValue({
      targetCluster: cluster.id,
      targetNodeIds: nextNodeIds,
      credential: cluster.credential,
    });
  };

  const createDownloadTask = async () => {
    const values = await downloadForm.validateFields();
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
    downloadForm.resetFields();
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
    const nodes = values.targetMode === 'cluster'
      ? cluster.nodes.filter((node) => node.status === 'Ready')
      : cluster.nodes.filter((node) => values.targetNodeIds?.includes(node.id) && node.status === 'Ready');
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
      width: 250,
      render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.model}</small></span>,
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value) => <Tag className={`distribution-task-type ${value}`}>{value === 'download' ? '模型下载' : '模型分发'}</Tag>,
    },
    {
      title: '来源／目标',
      key: 'route',
      width: 220,
      render: (_, record) => <span className="distribution-table-main"><strong>{record.source}</strong><small>{record.target}</small></span>,
    },
    {
      title: '任务进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 210,
      render: (value, record) => <div className="distribution-task-progress"><Progress percent={value} size="small" status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'} /><small>{record.type === 'download' ? '单任务下载进度' : '目标节点汇总进度'}</small></div>,
    },
    { title: '实时速度', dataIndex: 'speed', key: 'speed', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => {
        const labels = { running: '执行中', completed: '已完成', failed: '异常', stopped: '已停止' };
        return <span className={`distribution-task-status ${value}`}>{labels[value as DistributionTask['status']]}</span>;
      },
    },
    { title: '更新时间', dataIndex: 'updatedText', key: 'updatedText', width: 100 },
    {
      title: '操作',
      key: 'actions',
      width: 118,
      render: (_, record) => (
        <Space size={10}>
          <Button type="link" size="small" onClick={() => setTaskDetail(record)}>详情</Button>
          {record.status === 'running' && <Button type="link" danger size="small" onClick={() => setTasks((items) => items.map((item) => item.id === record.id ? {
            ...item,
            status: 'stopped',
            speed: '—',
            updatedAt: Date.now(),
            updatedText: '刚刚',
            nodes: item.nodes?.map((node) => node.status === 'running' || node.status === 'pending' ? { ...node, status: 'stopped', speed: '—' } : node),
          } : item))}>停止</Button>}
        </Space>
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openDistribution(models[0].id)}>创建分发</Button>
      </div>
      <div className="distribution-model-grid">
        {visibleModels.map((model) => {
          const opened = expandedModel === model.id;
          const extraCopies = Math.max(0, model.copies.length - 3);
          return (
            <article key={model.id} className={`distribution-model-card${opened ? ' expanded' : ''}`}>
              <header>
                <span className="distribution-model-icon"><InboxOutlined /></span>
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
                        <Button type="link" size="small" onClick={() => openDistribution(model.id, copy.id)}>从此副本分发</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <footer>
                <Button type="text" onClick={() => showModelTasks(model)}>查看相关任务</Button>
                <Button type="primary" onClick={() => openDistribution(model.id)}>分发模型</Button>
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
      <Table columns={taskColumns} dataSource={visibleTasks} rowKey="id" pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `共 ${total} 条任务` }} scroll={{ x: 1210 }} />
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
      <div className="distribution-pane-head"><div><strong>镜像分发</strong><span>将已登记镜像同步到目标集群的镜像仓库或节点。</span></div><Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('创建镜像分发')}>创建镜像分发</Button></div>
      <Table dataSource={imageRows} pagination={false} columns={[
        { title: '镜像', key: 'name', render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.desc}</small></span> },
        { title: '来源', dataIndex: 'source', key: 'source' },
        { title: '镜像大小', dataIndex: 'size', key: 'size' },
        { title: '可用状态', key: 'status', render: () => <span className="distribution-task-status completed">可分发</span> },
        { title: '最近更新', dataIndex: 'updated', key: 'updated' },
        { title: '操作', key: 'action', render: () => <Button type="link" icon={<SendOutlined />} onClick={() => message.info('创建镜像分发')}>分发</Button> },
      ]} />
    </div>
  );

  const filePane = (
    <div className="distribution-simple-pane">
      <div className="distribution-pane-head"><div><strong>文件分发</strong><span>将驱动、软件包和配置文件同步到指定集群或主机。</span></div><Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('创建文件分发')}>创建文件分发</Button></div>
      <Table dataSource={fileRows} pagination={false} columns={[
        { title: '文件／软件包', key: 'name', render: (_, record) => <span className="distribution-table-main"><strong>{record.name}</strong><small>{record.desc}</small></span> },
        { title: '类型', dataIndex: 'type', key: 'type' },
        { title: '文件大小', dataIndex: 'size', key: 'size' },
        { title: '来源主机', dataIndex: 'source', key: 'source' },
        { title: '最近更新', dataIndex: 'updated', key: 'updated' },
        { title: '操作', key: 'action', render: () => <Button type="link" icon={<FileOutlined />} onClick={() => message.info('创建文件分发')}>分发</Button> },
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

      <Modal title="创建模型下载任务" open={downloadOpen} width={820} okText="开始下载" onOk={createDownloadTask} onCancel={() => setDownloadOpen(false)}>
        <p className="distribution-modal-note">通过 HTTP／HTTPS 直链将远程模型保存到已纳管的模型主机，下载完成后可直接创建分发任务。</p>
        <Form form={downloadForm} layout="vertical">
          <section className="distribution-form-section">
            <h3>远程模型</h3>
            <div className="distribution-form-grid">
              <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}><Input placeholder="例如：下载 GLM-5.2 至模型主机" /></Form.Item>
              <Form.Item label="模型名称" name="modelName" rules={[{ required: true, message: '请输入模型名称' }]}><Input placeholder="例如：GLM-5.2" /></Form.Item>
              <Form.Item className="wide" label="模型 URL" name="url" extra="任务启动前会检查 URL 可访问性和文件大小。" rules={[{ required: true, type: 'url', message: '请输入有效的 HTTP／HTTPS URL' }]}><Input placeholder="https://example.com/models/model.tar.zst" /></Form.Item>
            </div>
          </section>
          <section className="distribution-form-section">
            <h3>模型保存位置</h3>
            <div className="distribution-form-grid">
              <Form.Item label="下载主机" name="host" rules={[{ required: true, message: '请选择下载主机' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={hostOptions.filter((item) => item.value !== 'all')}
                />
              </Form.Item>
              <div className="distribution-host-capacity">
                <span>主机状态</span>
                <strong>{selectedDownloadHostCopy?.ip || '等待选择'} · 可用 {formatTotalSize(selectedDownloadHostFreeGb)}</strong>
                <small>执行下载前会再次检查连通性、目录权限和剩余空间。</small>
              </div>
              <Form.Item label="保存目录" name="path" rules={[{ required: true, message: '请输入保存目录' }]}>
                <Input placeholder="/data/models/" />
              </Form.Item>
              <Form.Item label="保存名称（选填）" name="fileName" extra="留空时从 URL 自动识别。">
                <Input placeholder="例如：GLM-5.2.tar.zst" />
              </Form.Item>
              <div className="distribution-path-presets wide">
                <span>常用目录</span>
                {['/data/models/', '/mnt/model-cache/', '/opt/ataas/models/'].map((path) => (
                  <Button key={path} size="small" onClick={() => downloadForm.setFieldValue('path', path)}>{path}</Button>
                ))}
              </div>
              <Form.Item className="wide distribution-checks">
                <Space size={24} wrap>
                  <Form.Item name="resume" valuePropName="checked" noStyle><Checkbox>启用断点续传</Checkbox></Form.Item>
                  <Form.Item name="verify" valuePropName="checked" noStyle><Checkbox>下载完成后校验文件完整性</Checkbox></Form.Item>
                </Space>
              </Form.Item>
            </div>
          </section>
        </Form>
      </Modal>

      <Modal title="创建模型分发" open={distributionOpen} width={900} okText="创建并分发" onOk={createDistributionTask} onCancel={() => setDistributionOpen(false)}>
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
                  setSelectedModelId(modelId);
                  setSelectedCopyId(model.copies[0].id);
                  distributionForm.setFieldsValue({
                    copyId: model.copies[0].id,
                    targetPath: `/data/models/${model.name}`,
                  });
                }} />
              </Form.Item>
              <Form.Item label="源副本（主机）" name="copyId" extra="同一模型存在于多台主机时，可选择本次使用的源副本。" rules={[{ required: true, message: '请选择源副本' }]}>
                <Select
                  onChange={setSelectedCopyId}
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
                  filterOption={(input, option) => String((option as { searchText?: string })?.searchText || option?.label || '').toLowerCase().includes(input.toLowerCase())}
                  options={clusterOptions}
                  onChange={changeTargetCluster}
                />
              </Form.Item>

              <div className="distribution-target-summary wide">
                <div><span>所属位置</span><strong>{selectedCluster.supplier} / {selectedCluster.dataCenter}</strong></div>
                <div><span>集群 Nodes</span><strong>{selectedCluster.nodes.length}</strong></div>
                <div><span>可参与分发</span><strong>{readyNodes.length} Ready</strong></div>
                <div><span>自动排除</span><strong>{notReadyCount} NotReady · {disabledCount} 已停用</strong></div>
              </div>

              {targetMode === 'nodes' && (
                <>
                  <div className="wide distribution-node-search">
                    <Input.Search value={nodeSearch} onChange={(event) => setNodeSearch(event.target.value)} allowClear placeholder="搜索 Node 名称或 IP" />
                    <span>NotReady 和已停用 Nodes 仅供查看，不能选中。</span>
                  </div>
                  <Form.Item
                    className="wide distribution-node-field"
                    label={`选择目标 Nodes（已选 ${selectedNodeIds.length} 个）`}
                    name="targetNodeIds"
                    rules={[{ required: true, message: '请至少选择一个目标 Node' }]}
                  >
                    <Checkbox.Group onChange={(values) => setSelectedNodeIds(values as string[])}>
                      <div className="distribution-node-picker">
                        {visibleClusterNodes.map((node) => (
                          <label key={node.id} className={`distribution-node-option ${node.status.toLowerCase()}`}>
                            <Checkbox value={node.id} disabled={node.status !== 'Ready'} />
                            <span>
                              <strong>{node.name} · {node.ip}</strong>
                              <small>{node.status} · 磁盘可用 {formatSize(node.diskFreeGb)}</small>
                            </span>
                          </label>
                        ))}
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

              <div className={`distribution-preflight wide${lowSpaceCount ? ' warning' : ''}`}>
                <div><span>本次目标</span><strong>{selectedTargetNodes.length} 个 Nodes</strong></div>
                <div><span>模型大小</span><strong>{formatSize(selectedCopy.sizeGb)}</strong></div>
                <div><span>预计传输总量</span><strong>{formatTotalSize(estimatedTransferGb)}</strong></div>
                <div><span>空间预检</span><strong>{lowSpaceCount ? `${lowSpaceCount} 个 Nodes 预计不足` : '当前选择可用'}</strong></div>
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
        footer={<Button onClick={() => setTaskDetail(null)}>关闭</Button>}
        onCancel={() => setTaskDetail(null)}
      >
        {taskDetail && (
          <div className="distribution-task-detail">
            <div className="distribution-detail-summary">
              <div><span>{taskDetail.type === 'download' ? '下载进度' : '总体进度'}</span><strong>{taskDetail.progress}%</strong></div>
              <div><span>实时速度</span><strong>{taskDetail.speed}</strong></div>
              <div><span>{taskDetail.type === 'download' ? '文件大小' : '目标 Nodes'}</span><strong>{taskDetail.type === 'download' ? taskDetail.sizeGb ? formatTotalSize(taskDetail.sizeGb) : '预检中' : `${taskDetail.nodes?.length || 0} 个`}</strong></div>
              <div><span>状态</span><strong className={taskDetail.status === 'failed' ? 'bad' : ''}>{taskDetail.status === 'running' ? '执行中' : taskDetail.status === 'completed' ? '已完成' : taskDetail.status === 'failed' ? '异常' : '已停止'}</strong></div>
            </div>
            <div className="distribution-detail-info">
              <div><span>任务名称</span><strong>{taskDetail.name}</strong></div>
              <div><span>模型</span><strong>{taskDetail.model}</strong></div>
              {taskDetail.type === 'download' ? (
                <>
                  <div><span>模型 URL</span><strong>{taskDetail.url || '—'}</strong></div>
                  <div><span>下载位置</span><strong>{taskDetail.target}</strong></div>
                  <div><span>断点续传</span><strong>{taskDetail.resume ? '已启用' : '未启用'}</strong></div>
                  <div><span>完整性校验</span><strong>{taskDetail.verify ? '下载后执行' : '未启用'}</strong></div>
                </>
              ) : (
                <>
                  <div><span>源主机与目录</span><strong>{taskDetail.source} · {taskDetail.sourcePath}</strong></div>
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
                <h3>下载阶段</h3>
                <div><span>URL 与空间预检</span><strong>已完成</strong><small>URL 可访问，目标目录空间充足</small></div>
                <div><span>文件下载</span><strong>{taskDetail.status === 'completed' ? '已完成' : taskDetail.status === 'failed' ? '异常' : taskDetail.status === 'stopped' ? '已停止' : '下载中'}</strong><small>{taskDetail.progress}% · {taskDetail.speed}</small></div>
                <div><span>完整性校验</span><strong>{taskDetail.status === 'completed' && taskDetail.verify ? '已完成' : taskDetail.verify ? '等待下载完成' : '未启用'}</strong><small>{taskDetail.verify ? '校验文件大小与校验值' : '本任务未配置校验'}</small></div>
              </div>
            ) : (
              <div className="distribution-node-detail">
                <h3>Node 分发明细</h3>
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
