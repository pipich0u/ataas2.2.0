import { Button, ConfigProvider, Dropdown, Image, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tag, Tooltip } from 'antd';
import type { ThemeConfig } from 'antd';
import { AppstoreOutlined, BarChartOutlined, BarsOutlined, CodeOutlined, InfoCircleOutlined, PlayCircleOutlined, PlusOutlined, PoweroffOutlined } from '@ant-design/icons';
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
type InlineGatewayConfig = { port: string; session: boolean; traffic: Array<{ key: string; label: string; percent: number }> };

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
  { value: 'scheduled', label: '定时中' },
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

const getDeployClusterName = (item: DeployServiceItem) => {
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

export const MOCK_DEPLOY_DATA: DeployServiceItem[] = [
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
  onLog: (item: DeployServiceItem, logId: number) => void;
  onRestartToggle: (item: DeployServiceItem) => void;
  onConcurrencyToggle: (item: DeployServiceItem) => void;
  onOpenCreate: () => void;
  onScalePd?: (item: DeployServiceItem) => void;
  onNodeFilter?: (item: DeployServiceItem) => void;
  onScheduleDetail?: (item: DeployServiceItem) => void;
  viewModeValue?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  clusterFilterValue?: string;
  onClusterFilterChange?: (value: string) => void;
}

export default function DeployList({ data, onDetail, onStop, onMonitor, onExperience, onLog, onRestartToggle, onConcurrencyToggle, onOpenCreate, onScalePd, onNodeFilter, onScheduleDetail, viewModeValue, onViewModeChange, clusterFilterValue, onClusterFilterChange }: DeployListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [clusterFilter, setClusterFilter] = useState('');
  const [serviceGroupFilter, setServiceGroupFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(6);
  const [page, setPage] = useState(1);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [modelInfoPopup, setModelInfoPopup] = useState<{ item: DeployServiceItem; left: number; top: number } | null>(null);
  const [expandedServiceIds, setExpandedServiceIds] = useState<number[]>([]);
  const [inlineGatewayConfigs, setInlineGatewayConfigs] = useState<Record<number, InlineGatewayConfig>>({});
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
      if (serviceGroupFilter && item.serviceGroupKey !== serviceGroupFilter) return false;
      if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [data, statusFilter, categoryFilter, clusterFilter, serviceGroupFilter, searchText]);

  const paginated = useMemo(() => {
    if (viewMode === 'table') return filtered;
    return filtered.slice(0, page * pageSize);
  }, [filtered, viewMode, page, pageSize]);

  const hasMore = filtered.length > page * pageSize;

  const serviceGroupOptions = useMemo(() => {
    const groupMap = new Map<string, string>();
    data.forEach((item) => {
      if (item.serviceGroupKey && item.serviceGroupName) groupMap.set(item.serviceGroupKey, item.serviceGroupName);
    });
    return [
      { value: '', label: '全部服务组' },
      ...Array.from(groupMap.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [data]);

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
    return nodeList.map((node, index) => ({ key: `${item.id}-${index}`, instance: `实例 ${index + 1}`, node }));
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
    if (!saved) return { port: '30000', session: false, traffic: defaults };
    const traffic = defaults.map((row) => saved.traffic.find((item) => item.key === row.key) || row);
    return { ...saved, traffic };
  };

  const updateInlineGatewayConfig = (item: DeployServiceItem, updater: (config: InlineGatewayConfig) => InlineGatewayConfig) => {
    setInlineGatewayConfigs((prev) => {
      const current = prev[item.id] || { port: '30000', session: false, traffic: getDefaultInlineTraffic(item) };
      return { ...prev, [item.id]: updater(current) };
    });
  };

  const DetailStatus = () => <span className="ataas-deploy-inline-status-running">运行中</span>;

  const renderDeployInlineDetail = (item: DeployServiceItem) => {
    const detailInstances = getDetailInstances(item);
    const isSingleTrafficGroup = detailInstances.length <= 1;
    const gatewayConfig = getInlineGatewayConfig(item);
    const trafficRows = isSingleTrafficGroup
      ? gatewayConfig.traffic.map((row) => ({ ...row, percent: 100 }))
      : gatewayConfig.traffic;
    const podSuffix = (node: string) => node.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const pdMode = item.deployMode === 'PD 分离';
    const pdFlatRows = pdMode
      ? detailInstances.flatMap((record) => [
        { key: `${record.key}-router`, instance: record.instance, podName: `router-${podSuffix(record.node)}-0`, comp: 'Router', machine: record.node, gpu: '-', logId: 1 },
        { key: `${record.key}-prefill`, instance: record.instance, podName: `prefill-${podSuffix(record.node)}-0`, comp: 'Prefill', machine: record.node, gpu: '8 卡', logId: 2 },
        { key: `${record.key}-decode`, instance: record.instance, podName: `decode-${podSuffix(record.node)}-0`, comp: 'Decode', machine: record.node, gpu: '8 卡', logId: 3 },
      ])
      : [];
    const baseColumns = [
      { title: '实例', dataIndex: 'instance', key: 'instance', width: 90 },
      { title: '节点', dataIndex: 'node', key: 'node', width: 160 },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: () => <DetailStatus /> },
    ];
    return (
      <div className="ataas-deploy-inline-detail">
        <div className="ataas-deploy-inline-section">
          <div className="ataas-deploy-inline-section-head">网关配置</div>
          <div className="ataas-deploy-inline-gateway">
            <div>
              <span>端口号</span>
              <Input
                className="ataas-deploy-inline-port-input"
                value={gatewayConfig.port}
                onChange={(event) => updateInlineGatewayConfig(item, (config) => ({ ...config, port: event.target.value }))}
                size="small"
              />
            </div>
            <div>
              <span>Session 模式</span>
              <Switch
                checked={gatewayConfig.session}
                onChange={(checked) => updateInlineGatewayConfig(item, (config) => ({ ...config, session: checked }))}
                size="small"
              />
            </div>
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
                      disabled={isSingleTrafficGroup}
                      size="small"
                      className="ataas-deploy-inline-traffic-input"
                      formatter={(value) => (value !== undefined ? `${value}%` : '')}
                      parser={(value) => Number(value?.replace('%', '') || 0)}
                      onChange={(value) => {
                        if (value === null || isSingleTrafficGroup) return;
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
        <div className="ataas-deploy-inline-section">
          <div className="ataas-deploy-inline-section-head">实例信息</div>
          {pdMode ? (
            <Table
              className="ataas-deploy-inline-table"
              dataSource={pdFlatRows}
              pagination={false}
              size="small"
              columns={[
                {
                  title: '实例',
                  dataIndex: 'instance',
                  key: 'instance',
                  width: 90,
                  render: (value: string, _row: any, index: number) => ({
                    children: <span className="ataas-deploy-inline-instance-cell">{value}</span>,
                    props: index % 3 === 0 ? { rowSpan: 3 } : { rowSpan: 0 },
                  }),
                },
                { title: 'Pod 名称', dataIndex: 'podName', key: 'podName' },
                { title: '组件', dataIndex: 'comp', key: 'comp', width: 90 },
                { title: '所选机器', dataIndex: 'machine', key: 'machine' },
                { title: '显卡数量', dataIndex: 'gpu', key: 'gpu', width: 90 },
                { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: () => <DetailStatus /> },
                { title: '操作', key: 'action', width: 80, render: (_: unknown, row: any) => <Button type="link" size="small" onClick={() => onLog(item, row.logId)}>日志</Button> },
              ]}
            />
          ) : (
            <Table
              className="ataas-deploy-inline-table"
              dataSource={detailInstances.map((record, index) => ({
                ...record,
                podName: `pod-${podSuffix(record.node)}-0`,
                comp: '推理',
                gpu: getInstanceGpuCountText(item),
                logId: item.modelInfo.logs[index]?.id || item.modelInfo.logs[0]?.id || index + 1,
              }))}
              pagination={false}
              size="small"
              columns={[
                { title: '实例', dataIndex: 'instance', key: 'instance', width: 90 },
                { title: 'Pod 名称', dataIndex: 'podName', key: 'podName' },
                { title: '组件', dataIndex: 'comp', key: 'comp', width: 90 },
                { title: '所选机器', dataIndex: 'node', key: 'node' },
                { title: '显卡数量', dataIndex: 'gpu', key: 'gpu', width: 90 },
                { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: () => <DetailStatus /> },
                { title: '操作', key: 'action', width: 80, render: (_: unknown, row: any) => <Button type="link" size="small" onClick={() => onLog(item, row.logId)}>日志</Button> },
              ]}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <ConfigProvider theme={DEPLOY_THEME}>
    <div className="ataas-deploy-list">
      {/* 搜索栏 */}
      <div className="ataas-deploy-list-toolbar">
        <Select className="ataas-deploy-list-select" value={statusFilter} onChange={setStatusFilter} options={SERVICE_STATUS_OPTIONS} placeholder="服务状态" size="middle" />
        <Select className="ataas-deploy-list-select" value={categoryFilter} onChange={setCategoryFilter} options={CATEGORY_OPTIONS} placeholder="模型类型" size="middle" />
        <Select className="ataas-deploy-list-select" value={clusterFilter} onChange={(value) => { setClusterFilter(value); onClusterFilterChange?.(value); setPage(1); }} options={CLUSTER_OPTIONS} placeholder="集群名称" size="middle" />
        <Select className="ataas-deploy-list-select" value={serviceGroupFilter} onChange={(value) => { setServiceGroupFilter(value); setPage(1); }} options={serviceGroupOptions} placeholder="服务组" size="middle" />
        <Input.Search className="ataas-deploy-list-search" placeholder="搜索服务名称..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear size="middle" />
        <div style={{ flex: 1 }} />
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
      </div>

      {viewMode === 'card' ? (
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
                          {item.serviceGroupName ? (
                            <Tooltip title={`Group: ${item.serviceGroupName}`}>
                              <span className="ataas-deploy-service-group-badge">Group: {item.serviceGroupName}</span>
                            </Tooltip>
                          ) : (
                            <Tooltip title={item.typeStr}>
                              <span className="ataas-deploy-service-type-text">{item.typeStr}</span>
                            </Tooltip>
                          )}
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
                    <div>自动重启 <MetaValue title={`${item.modelInfo.restartCount} / ${item.modelInfo.restartNumber || item.modelInfo.restartCount}`}><em>{item.modelInfo.restartCount}</em> / {item.modelInfo.restartNumber || item.modelInfo.restartCount}</MetaValue></div>
                    <div>并发控制 <MetaValue title={String(item.modelInfo.concurrencyControllCount)}>{item.modelInfo.concurrencyControllCount}</MetaValue></div>
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
          <div className="ataas-deploy-table-wrap">
            <Table dataSource={paginated} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }} scroll={{ x: 1420 }}
            expandable={{
              expandedRowKeys: expandedServiceIds,
              onExpand: (expanded, record) => {
                setExpandedServiceIds((prev) => (expanded ? [...new Set([...prev, record.id])] : prev.filter((id) => id !== record.id)));
              },
              expandedRowRender: (record) => renderDeployInlineDetail(record),
              rowExpandable: () => true,
            }}
            columns={[
              { title: '服务名称', dataIndex: 'name', key: 'name', width: 180, render: (v, r) => <><span className="ataas-deploy-table-main">{v}</span><div className="ataas-deploy-table-sub">{r.typeStr}</div></> },
              { title: '服务组', key: 'serviceGroup', width: 150, render: (_, r) => r.serviceGroupName ? <span className="ataas-deploy-table-group">{r.serviceGroupName}</span> : <span className="ataas-deploy-table-sub">-</span> },
              { title: '类别', key: 'category', width: 90, render: (_, r) => <CategoryTag category={r.category} table /> },
              { title: '状态', key: 'status', width: 120, render: (_, r) => <TableStatus item={r} /> },
              { title: '部署方式', key: 'deployMode', width: 100, render: (_, r) => <span>{r.deployMode || '-'}</span> },
              { title: '运行时长', dataIndex: 'timeStr', key: 'time', width: 100 },
              { title: '实例数', key: 'instances', width: 70, render: (_, r) => r.modelInfo.number },
              { title: '部署节点', key: 'works', width: 100, render: (_, r) => <button type="button" className="ataas-deploy-node-count-link" onClick={() => onNodeFilter?.(r)}>{r.modelInfo.works?.split(',').filter(Boolean).length || 0}</button> },
              { title: '集群', key: 'cluster', width: 140, render: (_, r) => <span className="ataas-deploy-table-cluster">{getDeployClusterName(r)}</span> },
              { title: '模型参数', key: 'size', width: 100, render: (_, r) => r.modelInfo.size },
              { title: '显存占用', key: 'vram', width: 100, render: (_, r) => r.modelInfo.vram },
              { title: '自动重启', key: 'restart', width: 80, render: (_, r) => <Switch size="small" checked={r.modelInfo.restartStatus} disabled={r.status !== 'running'} onChange={() => onRestartToggle(r)} /> },
              { title: '并发控制', key: 'concurrency', width: 80, render: (_, r) => <Switch size="small" checked={r.modelInfo.concurrencyControllStatus} disabled={r.status !== 'running'} onChange={() => onConcurrencyToggle(r)} /> },
              { title: '操作', key: 'action', width: 180, fixed: 'right', className: 'ataas-deploy-fixed-action-cell', render: (_, r) => {
                return (
                  <div className="ataas-deploy-table-actions ataas-deploy-table-service-actions">
                    <IconActionButton title="停止" icon={<PoweroffOutlined />} onClick={() => onStop(r)} />
                    <IconActionButton title="监控" icon={<BarChartOutlined />} disabled={r.status !== 'running'} onClick={() => onMonitor(r)} />
                    <IconActionButton title="去体验" icon={<PlayCircleOutlined />} disabled={r.status !== 'running'} onClick={() => onExperience(r)} />
                  </div>
                );
              }},
            ]}
          />
          </div>
      )}
    </div>
    {modelInfoPopup && typeof document !== 'undefined' && createPortal(
      <div className="ataas-deploy-model-info-card" style={{ left: modelInfoPopup.left, top: modelInfoPopup.top }}>
        <h3>模型信息</h3>
        <div className="ataas-deploy-model-info-grid">
          <div><span>模型名称</span><strong>{modelInfoPopup.item.modelInfo.name}</strong></div>
          <div><span>推理引擎</span><strong>{modelInfoPopup.item.modelInfo.engine} / {modelInfoPopup.item.modelInfo.engineVersion}</strong></div>
          <div><span>模型ID</span><strong>#{modelInfoPopup.item.id}</strong></div>
          <div><span>模型参数</span><strong>{modelInfoPopup.item.modelInfo.size}</strong></div>
          <div><span>上下文长度</span><strong>{modelInfoPopup.item.modelInfo.contextLength}</strong></div>
          <div><span>注意力头数</span><strong>{modelInfoPopup.item.modelInfo.attentionHeads}</strong></div>
          <div><span>模型精度</span><strong>{modelInfoPopup.item.modelInfo.point}</strong></div>
          <div><span>占用显存</span><strong>{modelInfoPopup.item.modelInfo.vram}</strong></div>
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
      {iconOnly ? <Button className="ataas-deploy-action-icon" type="text" size="small" disabled icon={<CodeOutlined />} /> : '日志'}
    </div>;
  }
  if (item.modelInfo.logs.length === 1) {
    return <div className={iconOnly ? '' : 'ataas-deploy-service-action'} style={iconOnly ? { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } : undefined}
      onClick={() => onLog(item, item.modelInfo.logs[0].id)}>
      {iconOnly ? <Tooltip title="运行日志"><Button className="ataas-deploy-action-icon" type="text" size="small" icon={<CodeOutlined />} /></Tooltip> : <span style={{ fontSize: 12, color: '#666' }}>日志</span>}
    </div>;
  }
  return (
    <Dropdown menu={{ items: item.modelInfo.logs.map((log) => ({ label: log.name, key: log.id })), onClick: ({ key }) => onLog(item, Number(key)) }}>
      <div className={iconOnly ? '' : 'ataas-deploy-service-action'} style={iconOnly ? { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } : undefined}>
        {iconOnly ? <Button className="ataas-deploy-action-icon" type="text" size="small" icon={<CodeOutlined />} /> : <span style={{ fontSize: 12, color: '#666' }}>日志</span>}
      </div>
    </Dropdown>
  );
}
