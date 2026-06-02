import { Button, ConfigProvider, Dropdown, Image, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tag, Tooltip } from 'antd';
import type { ThemeConfig } from 'antd';
import { AppstoreOutlined, BarChartOutlined, BarsOutlined, CodeOutlined, InfoCircleOutlined, PlayCircleOutlined, PlusCircleOutlined, PlusOutlined, PoweroffOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
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

  const CategoryTag = ({ category, table }: { category: DeployCategory; table?: boolean }) => {
    const cfg = CATEGORY_TAG_CONFIG[category] || CATEGORY_TAG_CONFIG.llm;
    if (table) return <span className="ataas-deploy-table-category">{cfg.label}</span>;
    return <span className="ataas-deploy-service-category">{cfg.label}</span>;
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
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
                      <div>
                        <div className="ataas-deploy-service-name">{item.name}</div>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <CategoryTag category={item.category} />
                          {item.serviceGroupName ? (
                            <span className="ataas-deploy-service-group-badge">Group: {item.serviceGroupName}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#86909c' }}>{item.typeStr}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ataas-deploy-service-head-right">
                      <StatusTag item={item} />
                    </div>
                  </div>

                  {/* 详情 */}
                  <div className="ataas-deploy-service-meta-grid">
                    <div>部署方式 <span>{item.deployMode || '-'}</span></div>
                    <div>实例数 <span>{item.modelInfo.number}</span></div>
                    <div>部署节点 <button type="button" className="ataas-deploy-node-count-link" onClick={() => onNodeFilter?.(item)}>{item.modelInfo.works?.split(',').filter(Boolean).length || 0}</button></div>
                    <div>模型参数 <span>{item.modelInfo.size}</span></div>
                    <div>Token数 <span>{item.modelInfo.tokens}</span></div>
                    <div>运行天数 <span>{item.timeStr.replace(/^运行\s*/, '')}</span></div>
                    <div>显存占用 <span>{item.modelInfo.vram}</span></div>
                    <div>精度 <span>{item.modelInfo.point}</span></div>
                    <div className="ataas-deploy-service-switch">自动重启 <Switch size="small" checked={item.modelInfo.restartStatus} disabled={item.status !== 'running'} onChange={() => onRestartToggle(item)} style={{ marginLeft: 4 }} /></div>
                    <div className="ataas-deploy-service-switch">并发控制 <Switch size="small" checked={item.modelInfo.concurrencyControllStatus} disabled={item.status !== 'running'} onChange={() => onConcurrencyToggle(item)} style={{ marginLeft: 4 }} /></div>
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
            <Table dataSource={paginated} rowKey="id" pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条`, showSizeChanger: true }}
            columns={[
              { title: '服务名称', dataIndex: 'name', key: 'name', width: 180, render: (v, r) => <><span className="ataas-deploy-table-main">{v}</span><div className="ataas-deploy-table-sub">{r.typeStr}</div></> },
              { title: '服务组', key: 'serviceGroup', width: 150, render: (_, r) => r.serviceGroupName ? <span className="ataas-deploy-table-group">{r.serviceGroupName}</span> : <span className="ataas-deploy-table-sub">-</span> },
              { title: '类别', key: 'category', width: 90, render: (_, r) => <CategoryTag category={r.category} table /> },
              { title: '状态', key: 'status', width: 120, render: (_, r) => <TableStatus item={r} /> },
              { title: '部署方式', key: 'deployMode', width: 100, render: (_, r) => <span>{r.deployMode || '-'}</span> },
              { title: '运行时长', dataIndex: 'timeStr', key: 'time', width: 100 },
              { title: '实例数', key: 'instances', width: 70, render: (_, r) => r.modelInfo.number },
              { title: '部署节点', key: 'works', width: 100, render: (_, r) => <button type="button" className="ataas-deploy-node-count-link" onClick={() => onNodeFilter?.(r)}>{r.modelInfo.works?.split(',').filter(Boolean).length || 0}</button> },
              { title: '模型参数', key: 'size', width: 100, render: (_, r) => r.modelInfo.size },
              { title: '显存占用', key: 'vram', width: 100, render: (_, r) => r.modelInfo.vram },
              { title: '自动重启', key: 'restart', width: 80, render: (_, r) => <Switch size="small" checked={r.modelInfo.restartStatus} disabled={r.status !== 'running'} onChange={() => onRestartToggle(r)} /> },
              { title: '并发控制', key: 'concurrency', width: 80, render: (_, r) => <Switch size="small" checked={r.modelInfo.concurrencyControllStatus} disabled={r.status !== 'running'} onChange={() => onConcurrencyToggle(r)} /> },
              { title: '操作', key: 'action', width: 180, render: (_, r) => {
                return (
                  <div className="ataas-deploy-table-actions ataas-deploy-table-service-actions">
                    <IconActionButton title="部署详情" icon={<InfoCircleOutlined />} disabled={r.status === 'loading'} onClick={() => onDetail(r)} />
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
    </ConfigProvider>
  );
}

function IconActionButton({ title, icon, disabled, onClick }: { title: string; icon: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <Tooltip title={title} placement="bottom" mouseEnterDelay={0.25}>
      <button type="button" className={'ataas-deploy-service-icon-action' + (disabled ? ' disabled' : '')} disabled={disabled} onClick={disabled ? undefined : onClick} aria-label={title}>
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
