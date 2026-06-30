import { Button, ConfigProvider, Dropdown, Image, Input, InputNumber, message, Modal, Popconfirm, Select, Slider, Table, Tag, Tooltip } from 'antd';
import type { ThemeConfig } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AppstoreOutlined, BarChartOutlined, BarsOutlined, DisconnectOutlined, FileSearchOutlined, FileTextOutlined, InfoCircleOutlined, LinkOutlined, PlayCircleOutlined, PlusOutlined, PoweroffOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import kimiLogo from '../kimi-logo.svg';
import minimaxLogo from '../minimax-logo.svg';
import minicpmLogo from '../minicpm-logo.svg';
import qwenLogo from '../qwen-logo.svg';

export type DeployStatus = 'running' | 'loading' | 'error' | 'ready' | 'updating' | 'updatable' | 'warning';
export type DeployCategory = 'llm' | 'embedding' | 'rerank' | 'vlm';
export type ViewMode = 'card' | 'table';

type DeployLogItem = { id: number; name: string };
type RestartRecord = { id: number; name: string; works: string; createTime: string; restartTime: string; reasonConsuming: string };
type InlineGatewayConfig = { enabled: boolean; traffic: Array<{ key: string; label: string; percent: number }> };

export type DeployServiceItem = {
  id: number;
  name: string;
  description?: string;
  logo: string;
  status: DeployStatus;
  category: DeployCategory;
  typeStr: string;
  timeStr: string;
  updateTime: string;
  deployMode?: '单机部署' | '分布式部署' | 'PD 分离';
  scheduleCountdown?: string;
  scheduleCountdownAt?: string;
  scheduleCountdownAction?: string;
  scheduleRepeatDaily?: boolean;
  scheduleAlertWebhook?: string;
  serviceGroupKey?: string;
  serviceGroupName?: string;
  modelOpsSourceServiceId?: number;
  modelOpsInstanceKey?: string;
  modelOpsRoleSummary?: {
    router: string;
    prefill: string;
    decode: string;
  };
  modelInfo: {
    name: string;
    supplier: string;
    number: number;
    works: string;
    size: string;
    tokens: string;
    point: string;
    memory: string;
    disk: string;
    vram: string;
    contextLength: string;
    attentionHeads: string;
    layers: string;
    engine: string;
    engineVersion: string;
    restartStatus: boolean;
    restartNumber: number;
    restartCount: number;
    restartPage: RestartRecord[];
    concurrencyControllStatus: boolean;
    concurrencyControllCount: number;
    logs: DeployLogItem[];
    updateTime: string;
  };
};

const SERVICE_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'running', label: '服务中' },
  { value: 'loading', label: '启动中' },
  { value: 'error', label: '异常' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: '全部类型' },
  { value: 'llm', label: '文本模型' },
  { value: 'vlm', label: '视觉模型' },
  { value: 'embedding', label: '嵌入模型' },
  { value: 'rerank', label: '重排模型' },
];

const CLUSTER_OPTIONS = [
  { value: '', label: '全部集群' },
  { value: 'beijing-prod', label: 'beijing-prod' },
  { value: 'shanghai-online', label: 'shanghai-online' },
  { value: 'guangzhou-test', label: 'guangzhou-test' },
  { value: 'wuhan-kunpeng', label: 'wuhan-kunpeng' },
];

export const getDeployClusterName = (item: DeployServiceItem) => {
  const text = `${item.name} ${item.modelInfo.works} ${item.typeStr}`.toLowerCase();
  if (text.includes('nj-') || text.includes('h20') || text.includes('qwen')) return 'shanghai-online';
  if (text.includes('gz-') || text.includes('l20') || text.includes('glm')) return 'guangzhou-test';
  if (text.includes('910b') || text.includes('kimi')) return 'wuhan-kunpeng';
  return 'beijing-prod';
};

const STATUS_TAG_CONFIG: Record<DeployStatus, { color: string; bg: string; label: string }> = {
  running: { color: '#669F71', bg: '#EDFCF7', label: '服务中' },
  loading: { color: '#2593FA', bg: '#EBF5FF', label: '启动中' },
  error: { color: '#FA4238', bg: '#FDF2F2', label: '异常' },
  ready: { color: '#FE9400', bg: '#FDF8F2', label: '可部署' },
  updating: { color: '#669F71', bg: '#EDFCF7', label: '更新中' },
  updatable: { color: '#9471F1', bg: '#F9F7FD', label: '可更新' },
  warning: { color: '#FA4238', bg: '#FDF2F2', label: '异常' },
};

const TABLE_STATUS_DOT_COLOR: Record<DeployStatus, string> = {
  running: '#00B42A',
  loading: '#0E70D8',
  error: '#E02D2D',
  ready: '#D96A00',
  updating: '#00B42A',
  updatable: '#5A3EEA',
  warning: '#E02D2D',
};

const CATEGORY_TAG_CONFIG: Record<DeployCategory, { color: string; bg: string; label: string }> = {
  llm: { color: '#6951FF', bg: '#EEF2FF', label: '文本模型' },
  vlm: { color: '#722ed1', bg: '#F3EAFF', label: '视觉模型' },
  embedding: { color: '#13c2c2', bg: '#E6FFFB', label: '嵌入模型' },
  rerank: { color: '#fa8c16', bg: '#FFF7E6', label: '重排模型' },
};

const DEPLOY_THEME: ThemeConfig = {
  token: {
    colorPrimary: '#6951FF',
    colorPrimaryHover: '#5B42F3',
    colorPrimaryActive: '#4E35DF',
    controlOutline: 'rgba(105, 81, 255, 0.12)',
  },
  components: {
    Table: { headerBg: '#f7f8fa' },
  },
};

export const getDeployModelLogo = (item: DeployServiceItem) => {
  const text = `${item.name} ${item.typeStr} ${item.modelInfo.name} ${item.modelInfo.supplier}`.toLowerCase();
  if (text.includes('deepseek') || text.includes('深度求索')) return deepseekLogo;
  if (text.includes('qwen') || text.includes('通义')) return qwenLogo;
  if (text.includes('kimi') || text.includes('moonshot')) return kimiLogo;
  if (text.includes('glm') || text.includes('chatglm') || text.includes('智谱')) return glmLogo;
  if (text.includes('minimax')) return minimaxLogo;
  if (text.includes('minicpm')) return minicpmLogo;
  return item.logo;
};

const createModelOpsMockService = (id: number, name: string, works: string, number: number): DeployServiceItem => ({
  id,
  name,
  description: '模型运维 mock 数据，用于检查多集群、多 PD 组、权重列和弹窗交互',
  logo: glmLogo,
  status: 'running',
  category: 'llm',
  typeStr: '5.1',
  timeStr: `运行 ${6 + (id % 9)}天`,
  updateTime: '2026-06-29 12:00',
  deployMode: 'PD 分离',
  serviceGroupKey: 'glm51',
  serviceGroupName: name.split('-').slice(0, 2).join('-'),
  modelInfo: {
    name: 'glm-5.1',
    supplier: '智谱AI',
    number,
    works,
    size: '72B',
    tokens: `${(2.4 + id / 100).toFixed(2)}B`,
    point: 'BF16',
    memory: '192 GB',
    disk: '480 GB',
    vram: '320 GB',
    contextLength: '128K',
    attentionHeads: '64',
    layers: '80',
    engine: 'SGLang',
    engineVersion: '0.5.9',
    restartStatus: true,
    restartNumber: 0,
    restartCount: 2,
    restartPage: [],
    concurrencyControllStatus: true,
    concurrencyControllCount: 300 + id,
    logs: [{ id: id * 10 + 1, name: `${name} router 日志` }, { id: id * 10 + 2, name: `${name} worker 日志` }],
    updateTime: '2026-06-29',
  },
});

export const MOCK_DEPLOY_DATA: DeployServiceItem[] = [
  ...[
    ['st-router-1', Array.from({ length: 10 }, (_, index) => `st-router-1-inst-${index + 1}`).join(', '), 10],
    ['st-router-2', 'gz-l20-worker-003, gz-l20-worker-004', 2],
    ['st-router-3', 'gz-l20-worker-005, gz-l20-worker-006', 2],
    ['st-router-4', 'gz-l20-worker-007, gz-l20-worker-008', 2],
    ['h20-router-1', 'nj-h20-worker-001, nj-h20-worker-002', 2],
    ['h20-router-2', 'nj-h20-worker-003, nj-h20-worker-004', 2],
    ['h20-router-3', 'nj-h20-worker-005, nj-h20-worker-006', 2],
    ['kp-router-1', '910b-kunpeng-worker-001, 910b-kunpeng-worker-002', 2],
    ['kp-router-2', '910b-kunpeng-worker-003, 910b-kunpeng-worker-004', 2],
    ['bj-router-1', 'beijing-prod-worker-001, beijing-prod-worker-002', 2],
    ['bj-router-2', 'beijing-prod-worker-003, beijing-prod-worker-004', 2],
    ['bj-router-3', 'beijing-prod-worker-005, beijing-prod-worker-006', 2],
  ].map(([name, works, number], index) => createModelOpsMockService(100 + index, String(name), String(works), Number(number))),
  { id: 1, name: 'deepseek-r1-prod', description: '生产环境 DeepSeek-R1 模型服务，671B 参数规模', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=deepseek', status: 'running', category: 'llm', typeStr: 'DeepSeek-R1-671B', timeStr: '运行 12天', updateTime: '2026-05-28 10:30', deployMode: 'PD 分离', modelInfo: { name: 'DeepSeek-R1-671B', supplier: '深度求索', number: 2, works: 'qujing4, qujing7', size: '671B', tokens: '4.82B', point: 'BF16', memory: '128 GB', disk: '256 GB', vram: '320 GB', contextLength: '128K', attentionHeads: '96', layers: '64', engine: 'vLLM', engineVersion: '0.6.2', restartStatus: true, restartNumber: 0, restartCount: 3, restartPage: [], concurrencyControllStatus: true, concurrencyControllCount: 100, logs: [{ id: 1, name: '实例-1 运行日志' }, { id: 2, name: '实例-2 运行日志' }], updateTime: '2026-05-28' } },
  { id: 2, name: 'glm-4-air-prod', description: '生产环境 GLM-4-Air 模型服务，9B 参数规模', logo: glmLogo, status: 'running', category: 'llm', typeStr: 'GLM-4-Air', timeStr: '运行 15天', updateTime: '2026-05-27 08:00', deployMode: '单机部署', modelInfo: { name: 'GLM-4-Air', supplier: '智谱AI', number: 1, works: 'qujing4', size: '9B', tokens: '1.26B', point: 'BF16', memory: '48 GB', disk: '96 GB', vram: '48 GB', contextLength: '128K', attentionHeads: '64', layers: '40', engine: 'vLLM', engineVersion: '0.6.1', restartStatus: true, restartNumber: 0, restartCount: 3, restartPage: [], concurrencyControllStatus: true, concurrencyControllCount: 200, logs: [{ id: 6, name: '运行日志' }], updateTime: '2026-05-27' } },
  { id: 3, name: 'glm-4-air-dist-prod', description: '生产环境 GLM-4-Air 分布式模型服务，9B 参数规模', logo: glmLogo, status: 'running', category: 'llm', typeStr: 'GLM-4-Air', timeStr: '运行 8天', updateTime: '2026-05-29 09:20', deployMode: '分布式部署', modelInfo: { name: 'GLM-4-Air', supplier: '智谱AI', number: 2, works: 'gz-l20-worker-003, gz-l20-worker-005', size: '9B', tokens: '1.92B', point: 'BF16', memory: '96 GB', disk: '180 GB', vram: '96 GB', contextLength: '128K', attentionHeads: '64', layers: '40', engine: 'SGLang', engineVersion: '0.5.8', restartStatus: true, restartNumber: 0, restartCount: 3, restartPage: [], concurrencyControllStatus: true, concurrencyControllCount: 320, logs: [{ id: 7, name: '实例-1 运行日志' }, { id: 8, name: '实例-2 运行日志' }], updateTime: '2026-05-29' } },
];

interface DeployListProps {
  data: DeployServiceItem[];
  onDetail: (item: DeployServiceItem) => void;
  onStop: (item: DeployServiceItem) => void;
  onMonitor: (item: DeployServiceItem) => void;
  onExperience: (item: DeployServiceItem) => void;
  onLog: (item: DeployServiceItem, logId: number, podName?: string) => void;
  onDeleteInstance?: (item: DeployServiceItem, instanceIndex: number) => void;
  onAddInstance?: (item: DeployServiceItem) => void;
  onAllocateWeight?: (item: DeployServiceItem) => void;
  onOpenCreate: () => void;
  onScalePd?: (item: DeployServiceItem) => void;
  onNodeFilter?: (item: DeployServiceItem) => void;
  onScheduleDetail?: (item: DeployServiceItem) => void;
  viewModeValue?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  clusterFilterValue?: string;
  onClusterFilterChange?: (value: string) => void;
  getModelOpsRowWeight?: (item: DeployServiceItem) => number;
  mode?: 'deploy' | 'modelOps';
}

export default function DeployList({ data, onDetail, onStop, onMonitor, onExperience, onLog, onDeleteInstance, onAddInstance, onAllocateWeight, onOpenCreate, onScalePd, onNodeFilter, onScheduleDetail, viewModeValue, onViewModeChange, clusterFilterValue, onClusterFilterChange, getModelOpsRowWeight, mode = 'deploy' }: DeployListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [modelInfoPopup, setModelInfoPopup] = useState<{ item: DeployServiceItem; left: number; top: number } | null>(null);
  const [expandedServiceIds, setExpandedServiceIds] = useState<number[]>([]);
  const [inlineGatewayConfigs, setInlineGatewayConfigs] = useState<Record<number, InlineGatewayConfig>>({});
  const [routerLinkModal, setRouterLinkModal] = useState<{ item: DeployServiceItem; row: any; selected: string[] } | null>(null);
  const [drainWeightModal, setDrainWeightModal] = useState<{
    item: DeployServiceItem;
    row: any;
    routers: Array<{ key: string; routerName: string; groupName: string; cluster: string }>;
    weights: Record<string, number>;
  } | null>(null);
  const runtimeBaseRef = useRef(Date.now());
  const modelInfoHoveringRef = useRef(false);

  useEffect(() => {
    if (viewModeValue) {
      setViewMode(viewModeValue);
      setPage(1);
    }
  }, [viewModeValue]);

  useEffect(() => {
    if (clusterFilterValue !== undefined) {
      setClusterFilter(clusterFilterValue);
      setPage(1);
    }
  }, [clusterFilterValue]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!modelInfoHoveringRef.current) setNowTick(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (statusFilter === 'scheduled' && !(item.scheduleCountdownAt || item.scheduleCountdown)) return false;
      if (statusFilter && statusFilter !== 'scheduled' && item.status !== statusFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (clusterFilter && getDeployClusterName(item) !== clusterFilter) return false;
      if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [data, statusFilter, categoryFilter, clusterFilter, searchText]);

  const effectiveViewMode = mode === 'modelOps' ? 'table' : viewMode;

  const paginated = useMemo(() => {
    if (effectiveViewMode === 'table') return filtered;
    return filtered.slice(0, page * pageSize);
  }, [filtered, effectiveViewMode, page, pageSize]);

  const hasMore = filtered.length > page * pageSize;

  const getCountdownText = (item: DeployServiceItem) => {
    if (!item.scheduleCountdownAt) return item.scheduleCountdown;
    const target = new Date(item.scheduleCountdownAt.replace(/-/g, '/')).getTime();
    if (Number.isNaN(target)) return item.scheduleCountdown;
    const remaining = target - nowTick;
    if (remaining <= 0) return '等待执行';
    const totalSeconds = Math.floor(remaining / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}天${hours}小时后执行`;
    if (hours > 0) return `${hours}小时${minutes}分钟后执行`;
    return `${minutes}分${String(seconds).padStart(2, '0')}秒后执行`;
  };

  const getRuntimeText = (item: DeployServiceItem) => {
    const text = item.timeStr.replace(/^运行\s*/, '');
    const days = Number(text.match(/(\d+)\s*天/)?.[1] || 0);
    const hours = Number(text.match(/(\d+)\s*小时/)?.[1] || 0);
    const minutes = Number(text.match(/(\d+)\s*分钟/)?.[1] || 0);
    const seconds = Number(text.match(/(\d+)\s*秒/)?.[1] || 0);
    const elapsedSeconds = Math.max(0, Math.floor((nowTick - runtimeBaseRef.current) / 1000));
    const totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds + elapsedSeconds;
    const nextDays = Math.floor(totalSeconds / 86400);
    const nextHours = Math.floor((totalSeconds % 86400) / 3600);
    const nextMinutes = Math.floor((totalSeconds % 3600) / 60);
    const nextSeconds = totalSeconds % 60;
    return `${nextDays}天${nextHours}小时${nextMinutes}分钟${nextSeconds}秒`;
  };

  const StatusTag = ({ item }: { item: DeployServiceItem }) => {
    const countdown = getCountdownText(item);
    if (countdown) {
      return (
        <button type="button" className="ataas-deploy-service-status ataas-deploy-service-countdown ataas-deploy-countdown-button" onClick={() => onScheduleDetail?.(item)}>
          <span>{countdown}</span>
        </button>
      );
    }
    const { status } = item;
    const cfg = STATUS_TAG_CONFIG[status] || STATUS_TAG_CONFIG.error;
    return <span className="ataas-deploy-service-status" style={{ ['--status-color' as string]: TABLE_STATUS_DOT_COLOR[status] || cfg.color }}><span>{cfg.label}</span></span>;
  };

  const TableStatus = ({ item }: { item: DeployServiceItem }) => {
    const countdown = getCountdownText(item);
    if (countdown) {
      return (
        <button type="button" className="ataas-deploy-table-status ataas-deploy-table-countdown ataas-deploy-countdown-button" onClick={() => onScheduleDetail?.(item)}>
          {countdown}
        </button>
      );
    }
    const { status } = item;
    const cfg = STATUS_TAG_CONFIG[status] || STATUS_TAG_CONFIG.error;
    return <span className="ataas-deploy-table-status" style={{ ['--status-color' as string]: TABLE_STATUS_DOT_COLOR[status] || cfg.color }}>{cfg.label}</span>;
  };

  const MetaValue = ({ title, children }: { title: string; children: ReactNode }) => (
    <Tooltip title={title}>
      <span>{children}</span>
    </Tooltip>
  );

  const ModelInfoPopover = ({ item }: { item: DeployServiceItem }) => (
    <span
      className="ataas-deploy-model-info-wrap"
      onMouseEnter={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const view = event.currentTarget.ownerDocument.defaultView;
        const viewportWidth = view?.innerWidth || 1440;
        const viewportHeight = view?.innerHeight || 900;
        const panelHalfWidth = 180;
        const panelHeight = 238;
        const left = Math.min(Math.max(rect.left + rect.width / 2, panelHalfWidth + 12), viewportWidth - panelHalfWidth - 12);
        const preferredTop = rect.bottom + 10;
        const top = preferredTop + panelHeight > viewportHeight - 12 ? Math.max(12, rect.top - panelHeight - 10) : preferredTop;
        modelInfoHoveringRef.current = true;
        setModelInfoPopup({ item, left, top });
      }}
      onMouseLeave={() => {
        modelInfoHoveringRef.current = false;
        setModelInfoPopup(null);
      }}
    >
      <button type="button" className="ataas-deploy-model-info-trigger" aria-label="查看模型信息">!</button>
    </span>
  );

  const CategoryTag = ({ category, table }: { category: DeployCategory; table?: boolean }) => {
    const cfg = CATEGORY_TAG_CONFIG[category] || CATEGORY_TAG_CONFIG.llm;
    if (table) return <span className="ataas-deploy-table-category">{cfg.label}</span>;
    return <span className="ataas-deploy-service-category">{cfg.label}</span>;
  };

  const toggleServiceExpanded = (item: DeployServiceItem) => {
    setExpandedServiceIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]));
  };

  const getDetailInstances = (item: DeployServiceItem) => {
    const worksList = item.modelInfo.works?.split(',').map((work) => work.trim()).filter(Boolean) || [];
    const instanceCount = item.modelInfo.number || 1;
    const nodeList = worksList.length > 0 ? worksList : Array.from({ length: instanceCount }, (_, index) => `节点 ${index + 1}`);
    const cluster = getDeployClusterName(item);
    return nodeList.map((node, index) => ({ key: `${item.id}-${index}`, instance: `实例 ${index + 1}`, cluster, node, instanceIndex: index }));
  };

  const getInstanceGpuCountText = (item: DeployServiceItem) => {
    if (item.deployMode === '分布式部署') return '4 卡';
    return '1 卡';
  };

  const getDefaultInlineTraffic = (item: DeployServiceItem) => {
    const detailInstances = getDetailInstances(item);
    const isSingleTrafficGroup = detailInstances.length <= 1;
    return detailInstances.map((record, index) => {
      const basePercent = Math.floor(100 / detailInstances.length);
      const percent = isSingleTrafficGroup ? 100 : (index === detailInstances.length - 1 ? 100 - basePercent * (detailInstances.length - 1) : basePercent);
      return { key: record.key, label: record.instance, percent };
    });
  };

  const getInlineGatewayConfig = (item: DeployServiceItem): InlineGatewayConfig => {
    const saved = inlineGatewayConfigs[item.id];
    const defaults = getDefaultInlineTraffic(item);
    if (!saved) return { enabled: false, traffic: defaults };
    const traffic = defaults.map((row) => saved.traffic.find((item) => item.key === row.key) || row);
    return { ...saved, traffic };
  };

  const updateInlineGatewayConfig = (item: DeployServiceItem, updater: (config: InlineGatewayConfig) => InlineGatewayConfig) => {
    setInlineGatewayConfigs((prev) => {
      const current = prev[item.id] || { enabled: false, traffic: getDefaultInlineTraffic(item) };
      return { ...prev, [item.id]: updater(current) };
    });
  };

  const enableInlineTraffic = (item: DeployServiceItem) => {
    Modal.confirm({
      title: '启用按实例分配流量？',
      content: '启用后才可以调整各实例权重。调整权重会影响线上流量分配，请确认后再操作。',
      okText: '确认启用',
      cancelText: '取消',
      onOk: () => updateInlineGatewayConfig(item, (config) => ({ ...config, enabled: true })),
    });
  };

  const saveInlineTraffic = (item: DeployServiceItem) => {
    updateInlineGatewayConfig(item, (config) => ({ ...config, enabled: false }));
    message.success('流量权重已保存');
  };

  const DetailStatus = () => <span className="ataas-deploy-inline-status-running">运行中</span>;

  const renderInstanceCell = (item: DeployServiceItem, record: any) => (
    <div className="ataas-deploy-inline-instance-cell">
      <span>{record.instance}</span>
      {onDeleteInstance && (
        <Popconfirm
          title="删除实例？"
          description={`确认删除 ${record.instance} 吗？`}
          okText="删除"
          cancelText="取消"
          onConfirm={() => onDeleteInstance(item, record.instanceIndex)}
        >
          <button type="button" className="ataas-deploy-inline-instance-delete">删除实例</button>
        </Popconfirm>
      )}
    </div>
  );

  const renderDeployInlineDetail = (item: DeployServiceItem) => {
    const detailInstances = getDetailInstances(item);
    const isSingleTrafficGroup = detailInstances.length <= 1;
    const gatewayConfig = getInlineGatewayConfig(item);
    const trafficRows = isSingleTrafficGroup
      ? gatewayConfig.traffic.map((row) => ({ ...row, percent: 100 }))
      : gatewayConfig.traffic;
    const trafficEditable = gatewayConfig.enabled && !isSingleTrafficGroup;
    const podSuffix = (node: string) => node.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const pdMode = item.deployMode === 'PD 分离';
    const parseReadyTotal = (value?: string) => {
      const total = Number(String(value || '').split('/')[1]);
      return Number.isFinite(total) && total > 0 ? total : 1;
    };
    const pdInstanceGroups = pdMode
      ? detailInstances.map((record) => {
        const suffix = podSuffix(record.node);
        const routerCount = item.modelOpsRoleSummary ? parseReadyTotal(item.modelOpsRoleSummary.router) : 1;
        const prefillCount = item.modelOpsRoleSummary ? parseReadyTotal(item.modelOpsRoleSummary.prefill) : 1;
        const decodeCount = item.modelOpsRoleSummary ? parseReadyTotal(item.modelOpsRoleSummary.decode) : 1;
        const routerRows = Array.from({ length: routerCount }, (_, index) => ({
          key: `${record.key}-router-${index}`,
          podName: `router-${suffix}-${index}`,
          comp: 'Router',
          cluster: record.cluster,
          machine: record.node,
          gpu: '-',
          logId: 1,
        }));
        const prefillRows = Array.from({ length: prefillCount }, (_, index) => ({
          key: `${record.key}-prefill-${index}`,
          podName: `prefill-${suffix}-${index}`,
          comp: 'Prefill',
          cluster: record.cluster,
          machine: record.node,
          gpu: '8 卡',
          logId: 2,
        }));
        const decodeRows = Array.from({ length: decodeCount }, (_, index) => ({
          key: `${record.key}-decode-${index}`,
          podName: `decode-${suffix}-${index}`,
          comp: 'Decode',
          cluster: record.cluster,
          machine: record.node,
          gpu: '8 卡',
          logId: 3,
        }));
        return {
          record,
          rows: [...routerRows, ...prefillRows, ...decodeRows],
        };
      })
      : [];
    const pdRows = pdInstanceGroups.flatMap((group) => group.rows.map((row, rowIndex) => ({
      ...row,
      instanceRecord: group.record,
      instanceRowSpan: rowIndex === 0 ? group.rows.length : 0,
    })));
    const inlineRows = detailInstances.map((record, index) => ({
      ...record,
      podName: `pod-${podSuffix(record.node)}-0`,
      comp: '推理',
      gpu: getInstanceGpuCountText(item),
      logId: item.modelInfo.logs[index]?.id || item.modelInfo.logs[0]?.id || index + 1,
    }));
    const opsRoleRows = (pdMode ? pdRows : inlineRows).map((row: any, index: number) => {
      const compText = String(row.comp || 'Router').toLowerCase();
      const role = compText.includes('prefill') ? 'P' : compText.includes('decode') ? 'D' : compText.includes('router') ? 'R' : 'I';
      const image = compText.includes('router') ? 'sgl-model-gateway:default-fc-pa...' : 'sglang-main-fe5b30fe4';
      const ipLast = 24 + ((item.id * 7 + index * 3) % 18);
      const nodeIndex = 24 + ((item.id * 5 + index * 3) % 18);
      const instanceName = row.instanceRecord?.instance || row.instance || `实例 ${index + 1}`;
      const util = compText.includes('router') ? 20 : 0;
      const vram = compText.includes('router') ? 99 : 95 + ((item.id + index) % 5);
      const age = compText.includes('prefill') && index % 2 === 0 ? '6h' : '12h';
      const roleMetricPhase = Math.floor(nowTick / 1000) + item.id + index;
      const roleMetricWave = (offset: number, amplitude: number) => Math.sin((roleMetricPhase + offset) / 2.7) * amplitude;
      const avgTtft = Math.max(0, Math.round(1800 + ((item.id * 19 + index * 257) % 2200) + roleMetricWave(0, 180)));
      const p99Ttft = Math.max(0, Math.round(avgTtft + 3600 + ((item.id + index) % 6) * 260 + roleMetricWave(3, 260)));
      const avgTpot = Number(Math.max(0, 16 + ((item.id + index) % 9) * 1.4 + roleMetricWave(1, 1.2)).toFixed(1));
      const p99Tpot = Number(Math.max(0, avgTpot + 8 + ((item.id + index) % 5) * 0.7 + roleMetricWave(4, 1.6)).toFixed(1));
      const trafficSources = compText.includes('router')
        ? [item.modelInfo.name]
        : [`${item.serviceGroupName || getDeployClusterName(item)}-${item.name}-ha-1`, `${item.serviceGroupName || getDeployClusterName(item)}-${item.name}-router-0`];
      return {
        ...row,
        role,
        instanceName,
        ready: '1/1',
        statusText: 'Running',
        restarts: 0,
        load: 0,
        performance: compText.includes('router')
          ? null
          : compText.includes('prefill')
            ? { label: 'TTFT', avg: avgTtft, p99: p99Ttft }
            : { label: 'TPOT', avg: avgTpot, p99: p99Tpot },
        image,
        ip: `10.25.110.${ipLast}`,
        nodeName: `pod11-b300gpu${nodeIndex}`,
        util,
        vram,
        age,
        trafficSources,
      };
    }).sort((a: any, b: any) => {
      const roleOrder: Record<string, number> = { R: 0, P: 1, D: 2, I: 3 };
      return (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9);
    });
    const renderRolePerformance = (performance: any) => {
      if (!performance) return <span className="ataas-model-ops-performance-empty">-</span>;
      return (
        <span className="ataas-model-ops-performance-cell">
          <span><em>{performance.label}</em><strong>{performance.avg}</strong></span>
          <span><em>p99</em><strong>{performance.p99}</strong></span>
        </span>
      );
    };
    const baseColumns = [
      { title: '实例', dataIndex: 'instance', key: 'instance', width: 90 },
      { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 140 },
      { title: '节点', dataIndex: 'node', key: 'node', width: 160 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: () => <DetailStatus /> },
    ];
    const liveGroupReportCount = Math.max(1, opsRoleRows.length);
    const liveMetricPhase = Math.floor(nowTick / 1000) + item.id;
    const liveMetricWave = (offset: number, amplitude: number) => Math.sin((liveMetricPhase + offset) / 3) * amplitude;
    const liveGroupMetrics = {
      podsTotal: liveGroupReportCount,
      reporting: liveGroupReportCount,
      window: '60s',
      tpsP: Math.max(0, Math.round(43998 + liveMetricWave(0, 620) + (item.id % 5) * 71)),
      tpsPAvg: Math.max(0, Math.round(60640 + liveMetricWave(4, 420))),
      tpsD: Math.max(0, Math.round(955 + liveMetricWave(1, 34) + (item.id % 4) * 7)),
      tpsDAvg: Math.max(0, Math.round(834 + liveMetricWave(6, 18))),
      inflightP: Number(Math.max(0, 7 + liveMetricWave(2, 0.42)).toFixed(2)),
      inflightPAvg: Number(Math.max(0, 10.6 + liveMetricWave(7, 0.18)).toFixed(1)),
      inflightD: Number(Math.max(0, 5 + liveMetricWave(3, 0.32)).toFixed(2)),
      inflightDAvg: Number(Math.max(0, 2.85 + liveMetricWave(8, 0.12)).toFixed(2)),
      routerRps: Number(Math.max(0, 8.45 + liveMetricWave(4, 0.28)).toFixed(2)),
      routerRpsAvg: Number(Math.max(0, 8.45 + liveMetricWave(9, 0.16)).toFixed(2)),
      ttft: Math.max(0, Math.round(1511 + liveMetricWave(5, 86))),
      ttftAvg: Math.max(0, Math.round(2548 + liveMetricWave(10, 94))),
      cacheHit: Number(Math.max(0, 74.4 + liveMetricWave(6, 1.6)).toFixed(1)),
      cacheHitAvg: Number(Math.max(0, 84 + liveMetricWave(11, 0.8)).toFixed(1)),
      runningReq: Number(Math.max(0, 19 + liveMetricWave(7, 1.8)).toFixed(1)),
      runningReqAvg: Number(Math.max(0, 15.8 + liveMetricWave(12, 0.7)).toFixed(1)),
      queueReq: Number(Math.max(0, 35 + liveMetricWave(8, 2.7)).toFixed(1)),
      queueReqAvg: Number(Math.max(0, 3.44 + liveMetricWave(13, 0.22)).toFixed(2)),
      gpuPower: 17836 + item.id * 13,
      gpuUtil: Number((47 + (item.id % 7) * 0.8).toFixed(1)),
      tempAvg: Number((46 + (item.id % 6) * 0.3).toFixed(1)),
      hbmUsed: 10318 + item.id * 9,
    };
    return (
      <div className="ataas-deploy-inline-detail">
        {mode !== 'modelOps' && (
        <div className="ataas-deploy-inline-section">
          <div className="ataas-deploy-inline-section-head">服务信息</div>
          <div className="ataas-deploy-inline-summary">
            <div><span>部署方式</span><strong>{item.deployMode || '-'}</strong></div>
            <div><span>部署集群</span><strong>{getDeployClusterName(item)}</strong></div>
            <div><span>推理引擎</span><strong>{item.modelInfo.engine || '-'}</strong></div>
            <div><span>引擎版本</span><strong>{item.modelInfo.engineVersion || '-'}</strong></div>
          </div>
        </div>
        )}
        {mode !== 'modelOps' && (
        <div className="ataas-deploy-inline-section">
          <div className="ataas-deploy-inline-section-head ataas-deploy-inline-section-head-action">
            <span>网关配置</span>
            <Button
              className="ataas-traffic-enable-button"
              size="small"
              disabled={isSingleTrafficGroup}
              onClick={() => gatewayConfig.enabled ? saveInlineTraffic(item) : enableInlineTraffic(item)}
            >
              {gatewayConfig.enabled ? '保存' : '启用分配'}
            </Button>
          </div>
          <div className="ataas-deploy-inline-gateway">
            <div className="ataas-deploy-inline-traffic">
              <span>按实例分配流量</span>
              <div>
                {trafficRows.map((row, rowIndex) => (
                  <div className="ataas-deploy-inline-traffic-row" key={row.key}>
                    <em>{row.label}</em>
                    <i><b style={{ width: `${row.percent}%` }} /></i>
                    <InputNumber
                      min={0}
                      max={100}
                      value={row.percent}
                      disabled={!trafficEditable}
                      size="small"
                      className="ataas-deploy-inline-traffic-input"
                      formatter={(value) => (value !== undefined ? `${value}%` : '')}
                      parser={(value) => Number(value?.replace('%', '') || 0)}
                      onChange={(value) => {
                        if (value === null || !trafficEditable) return;
                        updateInlineGatewayConfig(item, (config) => {
                          const nextTraffic = [...config.traffic];
                          nextTraffic[rowIndex] = { ...nextTraffic[rowIndex], percent: Number(value) };
                          return { ...config, traffic: nextTraffic };
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}
        <div className="ataas-deploy-inline-section">
          {mode !== 'modelOps' && (
            <div className="ataas-deploy-inline-section-head ataas-deploy-inline-section-head-action">
              <span>实例信息</span>
              {onAddInstance && <Button className="ataas-traffic-enable-button" size="small" onClick={() => onAddInstance(item)}>添加实例</Button>}
            </div>
          )}
          {mode === 'modelOps' ? (
            <div className="ataas-deploy-inline-monitoring">
              <div className="ataas-model-ops-live-metrics">
                <div className="ataas-model-ops-live-metrics-grid top">
                  {[
                    {
                      title: 'TPS',
                      rows: [
                        { label: 'P', value: String(liveGroupMetrics.tpsP), avg: `avg ${liveGroupMetrics.tpsPAvg}`, color: '#8B48FF' },
                        { label: 'D', value: String(liveGroupMetrics.tpsD), avg: `avg ${liveGroupMetrics.tpsDAvg}`, color: '#14A0C7' },
                      ],
                    },
                    {
                      title: 'INFLIGHT / XFER',
                      rows: [
                        { label: 'P', value: liveGroupMetrics.inflightP.toFixed(2), avg: `avg ${liveGroupMetrics.inflightPAvg}`, color: '#8B48FF' },
                        { label: 'D', value: liveGroupMetrics.inflightD.toFixed(2), avg: `avg ${liveGroupMetrics.inflightDAvg}`, color: '#14A0C7' },
                      ],
                    },
                    { title: 'ROUTER RPS', value: liveGroupMetrics.routerRps.toFixed(2), suffix: 'req/s', avg: `avg ${liveGroupMetrics.routerRpsAvg.toFixed(2)}`, color: '#18A957' },
                    { title: 'TTFT', value: String(liveGroupMetrics.ttft), suffix: 'ms', avg: `avg ${liveGroupMetrics.ttftAvg}`, color: '#18A957' },
                    { title: 'CACHE HIT', value: liveGroupMetrics.cacheHit.toFixed(1), suffix: '%', avg: `avg ${liveGroupMetrics.cacheHitAvg.toFixed(1)}`, color: '#8B48FF' },
                    { title: 'RUNNING REQ', value: liveGroupMetrics.runningReq.toFixed(1), suffix: '', avg: `avg ${liveGroupMetrics.runningReqAvg.toFixed(1)}`, color: '#14A0C7' },
                    { title: 'QUEUE REQ', value: liveGroupMetrics.queueReq.toFixed(1), suffix: '', avg: `avg ${liveGroupMetrics.queueReqAvg.toFixed(2)}`, color: '#8B48FF' },
                    { title: 'KV XFER', value: '—', suffix: '', avg: '', color: '#8A8F98' },
                  ].map((card) => (
                    <div key={card.title} className="ataas-model-ops-live-metric-card">
                      <div className="ataas-model-ops-live-metric-title">{card.title}</div>
                      {'rows' in card ? (
                        <div className="ataas-model-ops-live-metric-pair">
                          {card.rows?.map((row) => (
                            <div key={row.label} className="ataas-model-ops-live-metric-row">
                              <span className="ataas-model-ops-live-metric-role">{row.label}</span>
                              <strong style={{ color: row.color }}>{row.value}</strong>
                              <em>{row.avg}</em>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="ataas-model-ops-live-metric-row single">
                            <strong style={{ color: card.color }}>{card.value}</strong>
                            {card.suffix ? <span className="ataas-model-ops-live-metric-suffix">{card.suffix}</span> : null}
                          </div>
                          {card.avg ? <div className="ataas-model-ops-live-metric-avg">{card.avg}</div> : null}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ataas-deploy-inline-table">
              <table className="ataas-deploy-inline-native-table">
                <colgroup>
                  <col style={{ width: 190 }} />
                  <col style={{ width: 112 }} />
                  <col style={{ width: 64 }} />
                  <col style={{ width: 78 }} />
                  <col style={{ width: 138 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 132 }} />
                  <col style={{ width: 148 }} />
                  <col style={{ width: 180 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 320 }} />
                  <col style={{ width: 132 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>POD</th>
                    <th>状态</th>
                    <th>重启</th>
                    <th>负载</th>
                    <th>性能</th>
                    <th>镜像</th>
                    <th>IP</th>
                    <th>NODE</th>
                    <th>NODE GPU</th>
                    <th>运行时间</th>
                    <th>接流来源</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {opsRoleRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <div className="ataas-model-ops-role-name">
                          <span className={'ataas-model-ops-role-badge role-' + row.role.toLowerCase()}>{row.role}</span>
                          <Tooltip title={`${row.instanceName} / ${row.podName}`}>
                            <span className="ataas-deploy-inline-pod-name">{row.podName}</span>
                          </Tooltip>
                        </div>
                      </td>
                      <td><span className="ataas-deploy-inline-status-running">{row.statusText}</span></td>
                      <td>{row.restarts}</td>
                      <td><span className="ataas-model-ops-load-pill">{row.load}</span></td>
                      <td>{renderRolePerformance(row.performance)}</td>
                      <td><Tooltip title={row.image}><span className="ataas-deploy-inline-pod-name">{row.image}</span></Tooltip></td>
                      <td>{row.ip}</td>
                      <td>{row.nodeName}</td>
                      <td>
                        <div className="ataas-model-ops-gpu-metrics">
                          {[
                            { label: 'util', value: row.util, color: row.util > 80 ? '#E02D2D' : '#1D2129' },
                            { label: 'vram', value: row.vram, color: row.vram > 90 ? '#E02D2D' : '#18A957' },
                          ].map((metric) => (
                            <div key={metric.label} className="ataas-model-ops-gpu-row">
                              <span>{metric.label}</span>
                              <i>
                                <b style={{ width: `${metric.value}%`, background: metric.label === 'vram' ? '#E02D2D' : '#1D2129' }} />
                              </i>
                              <span style={{ color: metric.color }}>{metric.value}%</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>{row.age}</td>
                      <td>
                        <div className="ataas-model-ops-source-list">
                          {row.trafficSources.map((source: string) => (
                            <span key={source} className="ataas-model-ops-source-tag">
                              <em />
                              <Tooltip title={source}><span>{source}</span></Tooltip>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="ataas-model-ops-row-actions">
                          <Tooltip title="日志">
                            <Button className="ataas-model-ops-row-action-button" type="text" shape="circle" size="small" icon={<FileSearchOutlined />} onClick={() => onLog(item, row.logId, row.podName)} />
                          </Tooltip>
                          {row.role === 'R' ? (
                            <Tooltip title="摘流">
                              <Button className="ataas-model-ops-row-action-button warning" type="text" shape="circle" size="small" icon={<DisconnectOutlined />} onClick={() => openDrainWeightModal(item, row)} />
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="下线">
                                <Button className="ataas-model-ops-row-action-button warning" type="text" shape="circle" size="small" icon={<PoweroffOutlined />} />
                              </Tooltip>
                              <Tooltip title="关联">
                                <Button className="ataas-model-ops-row-action-button link" type="text" shape="circle" size="small" icon={<LinkOutlined />} onClick={() => openRouterLinkModal(item, row)} />
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          ) : pdMode ? (
            <div className="ataas-deploy-inline-table">
              <table className="ataas-deploy-inline-native-table">
                <colgroup>
                  <col style={{ width: 116 }} />
                  <col style={{ width: 92 }} />
                  <col style={{ width: 150 }} />
                  <col style={{ width: 92 }} />
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
                    <th>组件</th>
                    <th>集群</th>
                    <th>所选机器</th>
                    <th>显卡数量</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pdRows.map((row) => (
                    <tr key={row.key}>
                      {row.instanceRowSpan > 0 && <td rowSpan={row.instanceRowSpan}>{renderInstanceCell(item, row.instanceRecord)}</td>}
                      <td><DetailStatus /></td>
                      <td><Tooltip title={row.podName}><span className="ataas-deploy-inline-pod-name">{row.podName}</span></Tooltip></td>
                      <td>{row.comp}</td>
                      <td>{row.cluster}</td>
                      <td>{row.machine}</td>
                      <td>{row.gpu}</td>
                      <td>
                        <span className="ataas-deploy-inline-table-actions">
                          <Tooltip title="运行日志">
                            <Button className="ataas-deploy-inline-log-button" type="text" size="small" icon={<FileSearchOutlined />} onClick={() => onLog(item, row.logId)} />
                          </Tooltip>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ataas-deploy-inline-table">
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
                  {inlineRows.map((row) => (
                    <tr key={row.key}>
                      <td>{renderInstanceCell(item, row)}</td>
                      <td><DetailStatus /></td>
                      <td><Tooltip title={row.podName}><span className="ataas-deploy-inline-pod-name">{row.podName}</span></Tooltip></td>
                      <td>{row.cluster}</td>
                      <td>{row.node}</td>
                      <td>{row.gpu}</td>
                      <td>
                        <span className="ataas-deploy-inline-table-actions">
                          <Tooltip title="运行日志">
                            <Button className="ataas-deploy-inline-log-button" type="text" size="small" icon={<FileSearchOutlined />} onClick={() => onLog(item, row.logId)} />
                          </Tooltip>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getModelOpsRoleSummary = (item: DeployServiceItem) => {
    if (item.modelOpsRoleSummary) return item.modelOpsRoleSummary;
    const detailCount = Math.max(1, getDetailInstances(item).length || item.modelInfo.number || 1);
    const prefillCount = item.deployMode === 'PD 分离' ? Math.max(1, detailCount * 2) : detailCount;
    return {
      router: '1/1',
      prefill: `${prefillCount}/${prefillCount}`,
      decode: '1/1',
    };
  };

  const renderModelOpsRoleSummary = (item: DeployServiceItem) => {
    const summary = getModelOpsRoleSummary(item);
    return (
      <span className="ataas-model-ops-role-summary">
        <span><b>R</b>{summary.router}</span>
        <span><b>P</b>{summary.prefill}</span>
        <span><b>D</b>{summary.decode}</span>
      </span>
    );
  };

  const renderModelOpsYamlFile = (fileName: string) => (
    <Tooltip title={fileName}>
      <span className="ataas-model-ops-yaml-file">
        <FileTextOutlined />
        <span>{fileName}</span>
      </span>
    </Tooltip>
  );

  const getModelOpsPerfSummary = (item: DeployServiceItem) => ({
    ttft: 11800 + item.id * 817,
    tpot: (18 + (item.id % 7) * 1.6).toFixed(1),
    prefillTps: 680 + (item.id % 9) * 37,
    decodeTps: 420 + (item.id % 8) * 29,
    routherRps: 1300 + (item.id % 11) * 86,
    hitRate: `${(92 + (item.id % 7) * 0.8).toFixed(1)}%`,
  });

  const getModelOpsRouterCandidates = (item: DeployServiceItem) => {
    const cluster = getDeployClusterName(item);
    const modelName = item.modelInfo.name;
    return data
      .filter((service) => service.modelInfo.name === modelName && getDeployClusterName(service) === cluster)
      .map((service) => ({
        key: `${service.id}-router-0`,
        podName: `${service.name}-router-0`,
        groupName: service.name,
        cluster: getDeployClusterName(service),
      }));
  };

  const getModelOpsDrainRouters = (item: DeployServiceItem) => {
    const cluster = getDeployClusterName(item);
    const modelName = item.modelInfo.name;
    return data
      .filter((service) => service.modelInfo.name === modelName && getDeployClusterName(service) === cluster)
      .map((service) => ({
        key: `${service.id}-router-0`,
        routerName: `${service.name}-router-0`,
        groupName: service.name,
        cluster: getDeployClusterName(service),
        service,
      }));
  };

  const getDefaultDrainWeights = (routers: ReturnType<typeof getModelOpsDrainRouters>) => {
    if (routers.length <= 1) {
      return routers.reduce<Record<string, number>>((acc, router) => ({ ...acc, [router.key]: 100 }), {});
    }
    const base = Math.floor(100 / routers.length);
    return routers.reduce<Record<string, number>>((acc, router, index) => ({
      ...acc,
      [router.key]: getModelOpsRowWeight?.(router.service) ?? (index === routers.length - 1 ? 100 - base * (routers.length - 1) : base),
    }), {});
  };

  const openDrainWeightModal = (item: DeployServiceItem, row: any) => {
    const routers = getModelOpsDrainRouters(item);
    setDrainWeightModal({
      item,
      row,
      routers,
      weights: getDefaultDrainWeights(routers),
    });
  };

  const updateDrainWeight = (routerKey: string, value: number) => {
    setDrainWeightModal((prev) => prev ? {
      ...prev,
      weights: { ...prev.weights, [routerKey]: Math.max(0, Math.min(100, Math.round(value))) },
    } : prev);
  };

  const normalizeDrainWeights = () => {
    setDrainWeightModal((prev) => {
      if (!prev) return prev;
      const total = prev.routers.reduce((sum, router) => sum + (prev.weights[router.key] ?? 0), 0);
      if (total <= 0) return prev;
      const next = prev.routers.map((router) => Math.floor(((prev.weights[router.key] ?? 0) / total) * 100));
      const rest = 100 - next.reduce((sum, value) => sum + value, 0);
      if (next.length > 0) next[next.length - 1] += rest;
      return {
        ...prev,
        weights: prev.routers.reduce<Record<string, number>>((acc, router, index) => ({ ...acc, [router.key]: next[index] }), {}),
      };
    });
  };

  const averageDrainWeights = () => {
    setDrainWeightModal((prev) => {
      if (!prev || prev.routers.length === 0) return prev;
      const base = Math.floor(100 / prev.routers.length);
      return {
        ...prev,
        weights: prev.routers.reduce<Record<string, number>>((acc, router, index) => ({
          ...acc,
          [router.key]: index === prev.routers.length - 1 ? 100 - base * (prev.routers.length - 1) : base,
        }), {}),
      };
    });
  };

  const openRouterLinkModal = (item: DeployServiceItem, row: any) => {
    const ownRouterKey = `${item.id}-router-0`;
    setRouterLinkModal({
      item,
      row,
      selected: getModelOpsRouterCandidates(item).some((router) => router.key === ownRouterKey) ? [ownRouterKey] : [],
    });
  };

  const toggleRouterLink = (routerKey: string) => {
    setRouterLinkModal((prev) => {
      if (!prev) return prev;
      return { ...prev, selected: prev.selected.includes(routerKey) ? [] : [routerKey] };
    });
  };

  const deployTableColumns: ColumnsType<DeployServiceItem> = [
    { title: '服务名称', dataIndex: 'name', key: 'name', width: 180, render: (v, r) => <><span className="ataas-deploy-table-main">{v}</span><div className="ataas-deploy-table-sub">{r.typeStr}</div></> },
    { title: '类别', key: 'category', width: 90, render: (_, r) => <CategoryTag category={r.category} table /> },
    { title: '状态', key: 'status', width: 120, render: (_, r) => <TableStatus item={r} /> },
    { title: '部署方式', key: 'deployMode', width: 100, render: (_, r) => <span>{r.deployMode || '-'}</span> },
    { title: '运行时长', dataIndex: 'timeStr', key: 'time', width: 100 },
    { title: '实例数', key: 'instances', width: 70, render: (_, r) => r.modelInfo.number },
    { title: '部署节点', key: 'works', width: 100, render: (_, r) => <button type="button" className="ataas-deploy-node-count-link" onClick={() => onNodeFilter?.(r)}>{r.modelInfo.works?.split(',').filter(Boolean).length || 0}</button> },
    { title: '集群', key: 'cluster', width: 140, render: (_, r) => <span className="ataas-deploy-table-cluster">{getDeployClusterName(r)}</span> },
    { title: '模型参数', key: 'size', width: 100, render: (_, r) => r.modelInfo.size },
    { title: '显存占用', key: 'vram', width: 100, render: (_, r) => r.modelInfo.vram },
    { title: '操作', key: 'action', width: 180, fixed: 'right' as const, className: 'ataas-deploy-fixed-action-cell', render: (_, r) => (
      <div className="ataas-deploy-table-actions ataas-deploy-table-service-actions">
        <IconActionButton title="停止" icon={<PoweroffOutlined />} onClick={() => onStop(r)} />
        <IconActionButton title="监控" icon={<BarChartOutlined />} disabled={r.status !== 'running'} onClick={() => onMonitor(r)} />
        <IconActionButton title="去体验" icon={<PlayCircleOutlined />} disabled={r.status !== 'running'} onClick={() => onExperience(r)} />
      </div>
    ) },
  ];

  const modelOpsTableColumns: ColumnsType<DeployServiceItem> = [
    { title: '模型实例', dataIndex: 'name', key: 'name', width: 130, render: (v) => <span className="ataas-deploy-table-main">{v}</span> },
    { title: '当前权重', key: 'weight', width: 86, render: (_, r) => <span className="ataas-model-ops-weight-pill">{getModelOpsRowWeight?.(r) ?? 100}%</span> },
    { title: '状态', key: 'status', width: 86, render: (_, r) => <TableStatus item={r} /> },
    { title: '集群', key: 'cluster', width: 120, render: (_, r) => <span className="ataas-deploy-table-cluster">{getDeployClusterName(r)}</span> },
    { title: 'Role', key: 'role', width: 180, render: (_, r) => renderModelOpsRoleSummary(r) },
    { title: 'Routher', key: 'routerYaml', width: 130, render: (_, r) => renderModelOpsYamlFile(`${r.modelInfo.name}/router.yaml`) },
    { title: 'Worker', key: 'workerYaml', width: 130, render: (_, r) => renderModelOpsYamlFile(`${r.modelInfo.name}/worker.yaml`) },
    { title: 'TTFT', key: 'ttft', width: 76, render: (_, r) => <span className="ataas-model-ops-perf-value">{getModelOpsPerfSummary(r).ttft}</span> },
    { title: 'TPOT', key: 'tpot', width: 76, render: (_, r) => <span className="ataas-model-ops-perf-value">{getModelOpsPerfSummary(r).tpot}</span> },
    { title: '操作', key: 'action', width: 96, fixed: 'right' as const, className: 'ataas-deploy-fixed-action-cell', render: (_, r) => (
      <div className="ataas-model-ops-table-actions">
        <Tooltip title="重建">
          <button type="button" className="ataas-model-ops-icon-action"><ReloadOutlined /></button>
        </Tooltip>
        <Tooltip title="整组下线">
          <button type="button" className="ataas-model-ops-icon-action danger" onClick={() => onStop(r)}><PoweroffOutlined /></button>
        </Tooltip>
        <Tooltip title="扩缩容">
          <button type="button" className="ataas-model-ops-icon-action" onClick={() => onScalePd?.(r)}><SettingOutlined /></button>
        </Tooltip>
      </div>
    ) },
  ];

  return (
    <ConfigProvider theme={DEPLOY_THEME}>
    <div className="ataas-deploy-list">
      {/* 搜索栏 */}
      <div className="ataas-deploy-list-toolbar">
        {mode !== 'modelOps' && (
          <>
            <Select className="ataas-deploy-list-select" value={statusFilter} onChange={setStatusFilter} options={SERVICE_STATUS_OPTIONS} placeholder="服务状态" size="middle" />
            <Select className="ataas-deploy-list-select" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_OPTIONS} placeholder="模型类型" size="middle" />
          </>
        )}
        <Select className="ataas-deploy-list-select" value={clusterFilter} onChange={(value) => { setClusterFilter(value); onClusterFilterChange?.(value); setPage(1); }} options={CLUSTER_OPTIONS} placeholder="集群名称" size="middle" />
        <Input.Search className="ataas-deploy-list-search" placeholder="搜索服务名称..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="middle" />
        <div style={{ flex: 1 }} />
        {mode === 'modelOps' && onAllocateWeight && (
          <Button
            className="ataas-deploy-create-button"
            type="primary"
            icon={<SettingOutlined />}
            disabled={filtered.length === 0}
            onClick={() => filtered[0] && onAllocateWeight(filtered[0])}
          >
            分配权重
          </Button>
        )}
        {mode === 'modelOps' && onAddInstance && (
          <Button
            className="ataas-deploy-create-button"
            type="primary"
            icon={<PlusOutlined />}
            disabled={filtered.length === 0}
            onClick={() => filtered[0] && onAddInstance(filtered[0])}
          >
            添加实例
          </Button>
        )}
        {mode !== 'modelOps' && (
          <>
            <div className="ataas-deploy-list-view-toggle" role="group" aria-label="视图切换">
              <button className={viewMode === 'card' ? 'active' : ''} type="button" onClick={() => { setViewMode('card'); onViewModeChange?.('card'); setPage(1); }}>
                <AppstoreOutlined />卡片
              </button>
              <span className="ataas-deploy-view-divider" aria-hidden="true" />
              <button className={viewMode === 'table' ? 'active' : ''} type="button" onClick={() => { setViewMode('table'); onViewModeChange?.('table'); setPage(1); }}>
                <BarsOutlined />列表
              </button>
            </div>
            <Button className="ataas-deploy-create-button" type="primary" icon={<PlusOutlined />} onClick={onOpenCreate}>创建模型服务</Button>
          </>
        )}
      </div>

      {effectiveViewMode === 'card' ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {paginated.map((item) => {
              const modelLogo = getDeployModelLogo(item);
              return (
                <div key={item.id} className="ataas-deploy-service-card">
                  <div className="ataas-deploy-service-card-glow" />
                  {/* 头部 */}
                  <div className="ataas-deploy-service-card-head">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                      <div className="ataas-deploy-service-logo">
                        <img src={modelLogo} alt="" />
                      </div>
                      <div className="ataas-deploy-service-title-block">
                        <Tooltip title={item.name}>
                          <div className="ataas-deploy-service-name">{item.name}</div>
                        </Tooltip>
                        <div className="ataas-deploy-service-subline">
                          <CategoryTag category={item.category} />
                          <Tooltip title={item.modelInfo.name || item.typeStr || item.name}>
                            <span className="ataas-deploy-service-type-text">{item.modelInfo.name || item.typeStr || item.name}</span>
                          </Tooltip>
                          <ModelInfoPopover item={item} />
                        </div>
                      </div>
                    </div>
                    <div className="ataas-deploy-service-head-right">
                      <StatusTag item={item} />
                    </div>
                  </div>

                  {/* 详情 */}
                  <div className="ataas-deploy-service-meta-grid">
                    <div>部署方式 <MetaValue title={item.deployMode || '-'}>{item.deployMode || '-'}</MetaValue></div>
                    <div>实例数 <MetaValue title={String(item.modelInfo.number)}>{item.modelInfo.number}</MetaValue></div>
                    <div>部署节点 <button type="button" className="ataas-deploy-node-count-link" onClick={() => onNodeFilter?.(item)}>{item.modelInfo.works?.split(',').filter(Boolean).length || 0}</button></div>
                    <div>部署集群 <MetaValue title={getDeployClusterName(item)}>{getDeployClusterName(item)}</MetaValue></div>
                    <div>Token数 <MetaValue title={item.modelInfo.tokens}>{item.modelInfo.tokens}</MetaValue></div>
                    <div>运行时间 <MetaValue title={getRuntimeText(item)}>{getRuntimeText(item)}</MetaValue></div>
                    <div>显存占用 <MetaValue title={item.modelInfo.vram}>{item.modelInfo.vram}</MetaValue></div>
                    <div>精度 <MetaValue title={item.modelInfo.point}>{item.modelInfo.point}</MetaValue></div>
                  </div>

                  {/* 操作栏 */}
                  <div className="ataas-deploy-service-actions">
                    <IconActionButton title="部署详情" icon={<InfoCircleOutlined />} disabled={item.status === 'loading'} onClick={() => onDetail(item)} />
                    <IconActionButton title="停止" icon={<PoweroffOutlined />} onClick={() => onStop(item)} />
                    <IconActionButton title="监控" icon={<BarChartOutlined />} disabled={item.status !== 'running'} onClick={() => onMonitor(item)} />
                    <IconActionButton title="去体验" icon={<PlayCircleOutlined />} disabled={item.status !== 'running'} onClick={() => onExperience(item)} />
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button type="text" onClick={() => setPage((p) => p + 1)}>加载更多</Button>
            </div>
          )}
          {paginated.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#86909c' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>◻</div>
              <div>暂无部署服务</div>
            </div>
          )}
        </div>
      ) : (
          <div className={`ataas-deploy-table-wrap${mode === 'modelOps' ? ' ataas-model-ops-detail-table-wrap' : ''}`}>
            <Table
              dataSource={paginated}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }}
              scroll={{ x: mode === 'modelOps' ? 'max-content' : 1180 }}
              expandable={mode === 'modelOps' ? {
                columnWidth: 40,
                expandedRowKeys: expandedServiceIds,
                onExpand: (expanded, record) => {
                  setExpandedServiceIds((prev) => (expanded ? [...new Set([...prev, record.id])] : prev.filter((id) => id !== record.id)));
                },
                expandedRowRender: (record) => renderDeployInlineDetail(record),
                rowExpandable: () => true,
              } : undefined}
              columns={mode === 'modelOps' ? modelOpsTableColumns : deployTableColumns}
            />
          </div>
      )}
    </div>
    <Modal
      className="ataas-model-ops-router-link-modal"
      title={routerLinkModal ? (
        <div className="ataas-model-ops-router-link-title">
          <LinkOutlined />
          <strong>编辑 Router 关联</strong>
          <em>{routerLinkModal.row.podName}</em>
        </div>
      ) : '编辑 Router 关联'}
      open={!!routerLinkModal}
      width={640}
      onCancel={() => setRouterLinkModal(null)}
      footer={[
        <Button key="cancel" onClick={() => setRouterLinkModal(null)}>取消</Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!routerLinkModal?.selected.length}
          onClick={() => {
            message.success('Router 关联变更已提交为 task');
            setRouterLinkModal(null);
          }}
        >
          提交为 task ({routerLinkModal?.selected.length || 0})
        </Button>,
      ]}
    >
      {routerLinkModal && (() => {
        const candidates = getModelOpsRouterCandidates(routerLinkModal.item);
        return (
          <div className="ataas-model-ops-router-link">
            <div className="ataas-model-ops-router-link-sub">
              {routerLinkModal.row.role === 'P' ? 'prefill' : 'decode'} · {routerLinkModal.row.ip} · 同集群同模型 Router POD
            </div>
            <div className="ataas-model-ops-router-link-tip">
              {routerLinkModal.row.role} 一般只关联一个 router；勾选第二个会被禁止。
            </div>
            <div className="ataas-model-ops-router-link-list">
              {candidates.map((candidate) => {
                const checked = routerLinkModal.selected.includes(candidate.key);
                const disabled = !checked && routerLinkModal.selected.length >= 1;
                return (
                  <label key={candidate.key} className={'ataas-model-ops-router-link-option' + (disabled ? ' disabled' : '')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleRouterLink(candidate.key)}
                    />
                    <span>{candidate.podName}</span>
                    <em>{candidate.groupName}</em>
                    <i />
                  </label>
                );
              })}
              {candidates.length === 0 && <div className="ataas-model-ops-router-link-empty">暂无可关联 Router POD</div>}
            </div>
          </div>
        );
      })()}
    </Modal>
    <Modal
      className="ataas-model-ops-weight-modal-shell ataas-model-ops-drain-modal-shell"
      title={drainWeightModal ? (
        <div className="ataas-model-ops-weight-modal-title">
          <DisconnectOutlined />
          <strong>摘流 · 降权</strong>
          <em>{drainWeightModal.item.modelInfo.name}</em>
        </div>
      ) : '摘流 · 降权'}
      open={!!drainWeightModal}
      width={720}
      onCancel={() => setDrainWeightModal(null)}
      footer={[
        <Button key="cancel" onClick={() => setDrainWeightModal(null)}>取消</Button>,
        <Button
          key="save"
          type="primary"
          onClick={() => {
            message.success('摘流权重调整已提交为 task');
            setDrainWeightModal(null);
          }}
        >
          确定
        </Button>,
      ]}
    >
      {drainWeightModal && (() => {
        const activeKey = `${drainWeightModal.item.id}-router-0`;
        const total = drainWeightModal.routers.reduce((sum, router) => sum + (drainWeightModal.weights[router.key] ?? 0), 0);
        return (
          <div className="ataas-model-ops-weight-modal ataas-model-ops-drain-modal">
            <div className="ataas-model-ops-weight-modal-subtitle">
              higress-system · host {getDeployClusterName(drainWeightModal.item)}.cluster.local · 占比超过 3%，先降权再摘除
            </div>
            <div className="ataas-model-ops-weight-modal-toolbar">
              <span>当前总和 <strong>{total}</strong></span>
              <div>
                <Button onClick={normalizeDrainWeights}>归一化到 100</Button>
                <Button onClick={averageDrainWeights}>均分</Button>
              </div>
            </div>
            <div className="ataas-model-ops-weight-modal-list">
              {drainWeightModal.routers.map((router) => {
                const value = drainWeightModal.weights[router.key] ?? 0;
                const active = router.key === activeKey;
                return (
                  <div key={router.key} className={'ataas-model-ops-weight-modal-row' + (active ? ' drain-target' : '')}>
                    <Tooltip title={router.routerName}>
                      <strong>
                        {active && <span className="ataas-model-ops-drain-mark">降</span>}
                        {router.routerName}
                      </strong>
                    </Tooltip>
                    <Slider min={0} max={100} value={value} tooltip={{ formatter: null }} onChange={(nextValue) => updateDrainWeight(router.key, Number(nextValue))} />
                    <span className="ataas-model-ops-weight-modal-percent">{value.toFixed(1)}%</span>
                    <InputNumber min={0} max={100} value={value} size="middle" onChange={(nextValue) => { if (nextValue !== null) updateDrainWeight(router.key, Number(nextValue)); }} />
                    <i />
                  </div>
                );
              })}
              {drainWeightModal.routers.length === 0 && <div className="ataas-model-ops-router-link-empty">暂无可调整 Router</div>}
            </div>
          </div>
        );
      })()}
    </Modal>
    {modelInfoPopup && typeof document !== 'undefined' && createPortal(
      <div className="ataas-deploy-model-info-card" style={{ left: modelInfoPopup.left, top: modelInfoPopup.top }}>
        <h3>模型信息</h3>
        <div className="ataas-deploy-model-info-grid">
          <div><span>模型名称</span><strong>{modelInfoPopup.item.modelInfo.name}</strong></div>
          <div><span>模型参数</span><strong>{modelInfoPopup.item.modelInfo.size}</strong></div>
          <div><span>上下文长度</span><strong>{modelInfoPopup.item.modelInfo.contextLength}</strong></div>
          <div><span>注意力头数</span><strong>{modelInfoPopup.item.modelInfo.attentionHeads}</strong></div>
          <div><span>层数</span><strong>{modelInfoPopup.item.modelInfo.layers}</strong></div>
        </div>
      </div>,
      document.body,
    )}
    </ConfigProvider>
  );
}

function IconActionButton({ title, icon, disabled, onClick, className }: { title: string; icon: ReactNode; disabled?: boolean; onClick: () => void; className?: string }) {
  return (
    <Tooltip title={title} placement="bottom" mouseEnterDelay={0.25}>
      <button type="button" className={['ataas-deploy-service-icon-action', className, disabled ? 'disabled' : ''].filter(Boolean).join(' ')} disabled={disabled} onClick={disabled ? undefined : onClick} aria-label={title}>
        {icon}
      </button>
    </Tooltip>
  );
}

function LogButton({ item, onLog, iconOnly }: { item: DeployServiceItem; onLog: (item: DeployServiceItem, logId: number) => void; iconOnly?: boolean }) {
  if (item.modelInfo.logs.length === 0) {
    return <div style={{ flex: iconOnly ? undefined : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#d9d9d9', cursor: 'not-allowed', userSelect: 'none' }}>
      {iconOnly ? <Button className="ataas-deploy-action-icon" type="text" size="small" disabled icon={<FileSearchOutlined />} /> : '日志'}
    </div>;
  }
  if (item.modelInfo.logs.length === 1) {
    return <div className={iconOnly ? '' : 'ataas-deploy-service-action'} style={iconOnly ? { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } : undefined}
      onClick={() => onLog(item, item.modelInfo.logs[0].id)}>
      {iconOnly ? <Tooltip title="运行日志"><Button className="ataas-deploy-action-icon" type="text" size="small" icon={<FileSearchOutlined />} /></Tooltip> : <span style={{ fontSize: 12, color: '#666' }}>日志</span>}
    </div>;
  }
  return (
    <Dropdown menu={{ items: item.modelInfo.logs.map((log) => ({ label: log.name, key: log.id })), onClick: ({ key }) => onLog(item, Number(key)) }}>
      <div className={iconOnly ? '' : 'ataas-deploy-service-action'} style={iconOnly ? { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } : undefined}>
        {iconOnly ? <Button className="ataas-deploy-action-icon" type="text" size="small" icon={<FileSearchOutlined />} /> : <span style={{ fontSize: 12, color: '#666' }}>日志</span>}
      </div>
    </Dropdown>
  );
}
