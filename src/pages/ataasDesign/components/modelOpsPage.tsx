import {
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, InputNumber, message, Modal, Slider, Tooltip } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import DeployList, { MOCK_DEPLOY_DATA, type DeployServiceItem } from './deployList';
import {
  modelOpsServices,
  type ModelService,
  type ServiceStatus,
  type TrafficTarget,
} from './modelOpsData';
import './modelRunPreviewPages.less';

type OpsSeRow = {
  key: string;
  serviceId: string;
  name: string;
  model: string;
  mode: string;
  clusterCode: string;
  clusterName: string;
  status: ServiceStatus;
  traffic: TrafficTarget[];
  instanceCount: number;
  routerReady: string;
  prefillReady: string;
  decodeReady: string;
  ttft: number;
  tpot: number;
  error: number;
  seed: number;
};

const matchesKeyword = (values: string[], keyword: string) => {
  if (!keyword) return true;
  return values.some((value) => value.toLowerCase().includes(keyword));
};

const makeTraffic = (
  rowKey: string,
  cluster: string,
  targets: Array<[name: string, weight: number, health?: TrafficTarget['health']]>,
): TrafficTarget[] => targets.map(([name, weight, health], index) => ({
  key: `${rowKey}-traffic-${index}`,
  name,
  cluster,
  weight,
  health: health || 'healthy',
}));

const makeRow = (
  service: ModelService,
  config: {
    key: string;
    name: string;
    clusterCode: string;
    clusterName: string;
    traffic: Array<[name: string, weight: number, health?: TrafficTarget['health']]>;
    status?: ServiceStatus;
    routerReady?: string;
    prefillReady?: string;
    decodeReady?: string;
    instanceCount?: number;
    ttft?: number;
    tpot?: number;
    error?: number;
    seed?: number;
  },
): OpsSeRow => ({
  key: config.key,
  serviceId: service.id,
  name: config.name,
  model: service.model,
  mode: service.mode,
  clusterCode: config.clusterCode,
  clusterName: config.clusterName,
  status: config.status || service.status,
  traffic: makeTraffic(config.key, config.clusterCode, config.traffic),
  instanceCount: config.instanceCount || service.instanceCount,
  routerReady: config.routerReady || '1/1',
  prefillReady: config.prefillReady || '4/4',
  decodeReady: config.decodeReady || '1/1',
  ttft: config.ttft || service.ttft,
  tpot: config.tpot || service.tpot,
  error: config.error ?? 0,
  seed: config.seed || service.instanceCount,
});

const opsServiceOrder = ['svc-glm52-yc'];
const opsPreviewServices: ModelService[] = modelOpsServices
  .filter((service) => opsServiceOrder.includes(service.id))
  .sort((left, right) => opsServiceOrder.indexOf(left.id) - opsServiceOrder.indexOf(right.id));

const getOpsServiceById = (serviceId: string) => (
  opsPreviewServices.find((service) => service.id === serviceId) || opsPreviewServices[0]
);

const clusterFullNameByCode: Record<string, string> = {
  bj: 'beijing-prod',
  sh: 'shanghai-online',
  gz: 'guangzhou-test',
  wh: 'wuhan-kunpeng',
  zz: 'zhengzhou-prod',
};

const createOpsSeRows = () => {
  const glm52 = getOpsServiceById('svc-glm52-yc');

  return [
    makeRow(glm52, {
      key: 'glm52-beijing-prod',
      name: 'glm-5.2-bj-prod',
      clusterCode: 'bj',
      clusterName: 'bj / A100-H20',
      traffic: [['glm52-bj-router-1', 60], ['glm52-bj-router-2', 40]],
      routerReady: '2/2',
      prefillReady: '4/4',
      decodeReady: '4/4',
      instanceCount: 10,
      ttft: 8124,
      tpot: 20.8,
      seed: 1,
    }),
    makeRow(glm52, {
      key: 'glm52-shanghai-online',
      name: 'glm-5.2-sh-online',
      clusterCode: 'sh',
      clusterName: 'sh / H20-910B',
      traffic: [['glm52-sh-router-1', 45], ['glm52-sh-router-2', 35], ['shanghai-higress', 20]],
      routerReady: '2/2',
      prefillReady: '4/4',
      decodeReady: '3/3',
      instanceCount: 9,
      ttft: 8468,
      tpot: 21.7,
      seed: 2,
    }),
    makeRow(glm52, {
      key: 'glm52-guangzhou-test',
      name: 'glm-5.2-gz-test',
      clusterCode: 'gz',
      clusterName: 'gz / L20-A100',
      traffic: [['glm52-gz-router-1', 100]],
      status: 'warning',
      routerReady: '1/1',
      prefillReady: '3/4',
      decodeReady: '2/2',
      instanceCount: 7,
      ttft: 9256,
      tpot: 24.1,
      error: 1,
      seed: 3,
    }),
    makeRow(glm52, {
      key: 'glm52-wuhan-kunpeng',
      name: 'glm-5.2-wh-kunpeng',
      clusterCode: 'wh',
      clusterName: 'wh / 910B-L20',
      traffic: [['glm52-wh-router-1', 55], ['glm52-wh-router-2', 45, 'warning']],
      routerReady: '1/1',
      prefillReady: '4/4',
      decodeReady: '2/2',
      instanceCount: 7,
      ttft: 8794,
      tpot: 22.5,
      seed: 4,
    }),
    makeRow(glm52, {
      key: 'glm52-zhengzhou-prod',
      name: 'glm-5.2-zz-prod',
      clusterCode: 'zz',
      clusterName: 'zz / H20',
      traffic: [['zhengzhou-higress', 14, 'warning'], ['glm52-zz-router-2', 45], ['glm52-zz-router-1', 41]],
      status: 'warning',
      routerReady: '2/2',
      prefillReady: '4/4',
      decodeReady: '3/3',
      instanceCount: 9,
      ttft: 9820,
      tpot: 25.4,
      error: 1,
      seed: 5,
    }),
  ];
};

const opsSeRows = createOpsSeRows();

type OpsDeployPreviewItem = DeployServiceItem & {
  opsServiceId: string;
  opsRowKey: string;
  opsInstanceIndex: number;
};

type ModelOpsPageProps = {
  selectedModelName?: string;
  onDetail?: (item: DeployServiceItem) => void;
  onStop?: (item: DeployServiceItem) => void;
  onMonitor?: (item: DeployServiceItem) => void;
  onExperience?: (item: DeployServiceItem) => void;
  onLog?: (item: DeployServiceItem, logId: number, podName?: string) => void;
  onAddInstance: (item: DeployServiceItem) => void;
  onScalePd?: (item: DeployServiceItem) => void;
  onCreateService?: () => void;
  onYamlPreview?: (item: DeployServiceItem, kind: 'router' | 'worker', path: string) => void;
};

const modelOpsDeploySource = MOCK_DEPLOY_DATA.filter((item) => Boolean(item.modelOpsInstanceKey));
const getReadyTotal = (value: string) => {
  const total = Number(value.split('/')[1]);
  return Number.isFinite(total) && total > 0 ? total : 1;
};
const opsInstanceNamesByCluster: Record<string, string[]> = {
  bj: ['glm-5.2-bj-router', 'glm-5.2-bj-llm-1', 'glm-5.2-bj-llm-2'],
  sh: ['glm-5.2-sh-router', 'glm-5.2-sh-llm-1', 'glm-5.2-sh-cache'],
  gz: ['glm-5.2-gz-router', 'glm-5.2-gz-canary'],
  wh: ['glm-5.2-wh-router', 'glm-5.2-wh-llm-1'],
  zz: ['glm-5.2-zz-router', 'glm-5.2-zz-llm-1', 'glm-5.2-zz-llm-2'],
};

const opsPrefillIssueIndexes: Record<string, number[]> = {
  'glm52-guangzhou-test': [1],
  'glm52-zhengzhou-prod': [0],
};

const makeReadyText = (total: number, degraded = false) => {
  const normalizedTotal = Math.max(1, total);
  const ready = degraded ? Math.max(0, normalizedTotal - 1) : normalizedTotal;
  return `${ready}/${normalizedTotal}`;
};

const isReadyDegraded = (value: string) => {
  const [ready, total] = value.split('/').map((part) => Number(part));
  return Number.isFinite(ready) && Number.isFinite(total) && ready < total;
};

const getInstanceRoleSummary = (row: OpsSeRow, index: number) => {
  const routerTotal = index === 0 ? getReadyTotal(row.routerReady) : 1;
  const basePrefillTotal = getReadyTotal(row.prefillReady);
  const prefillTotal = index >= 2 ? Math.max(1, Math.min(2, basePrefillTotal)) : basePrefillTotal;
  const baseDecodeTotal = getReadyTotal(row.decodeReady);
  const decodeTotal = index >= 2 ? Math.max(1, Math.min(2, baseDecodeTotal)) : baseDecodeTotal;
  const hasPrefillIssue = opsPrefillIssueIndexes[row.key]?.includes(index) || false;
  return {
    routerReady: makeReadyText(routerTotal),
    prefillReady: makeReadyText(prefillTotal, hasPrefillIssue),
    decodeReady: makeReadyText(decodeTotal),
  };
};

const getInstanceStatus = (row: OpsSeRow, roleSummary: ReturnType<typeof getInstanceRoleSummary>) => {
  if (row.status === 'stopped') return 'error';
  return [roleSummary.routerReady, roleSummary.prefillReady, roleSummary.decodeReady].some(isReadyDegraded) ? 'warning' : 'running';
};

const opsDeployPreviewData: OpsDeployPreviewItem[] = opsSeRows.flatMap((row, rowIndex) => (
  (opsInstanceNamesByCluster[row.clusterCode] || [row.name]).map((instanceName, instanceIndex) => {
    const item = modelOpsDeploySource[(rowIndex + instanceIndex) % modelOpsDeploySource.length] || MOCK_DEPLOY_DATA[0];
    const roleSummary = getInstanceRoleSummary(row, instanceIndex);
    const podCount = getReadyTotal(roleSummary.routerReady) + getReadyTotal(roleSummary.prefillReady) + getReadyTotal(roleSummary.decodeReady);
    return {
      ...item,
      id: 2000 + rowIndex * 10 + instanceIndex,
      modelOpsSourceServiceId: item.id,
      name: instanceName,
      status: getInstanceStatus(row, roleSummary),
      typeStr: row.model,
      modelOpsCluster: clusterFullNameByCode[row.clusterCode] || row.clusterName,
      modelOpsInstanceKey: row.key,
      modelOpsRoleSummary: {
        router: roleSummary.routerReady,
        prefill: roleSummary.prefillReady,
        decode: roleSummary.decodeReady,
      },
      serviceGroupKey: row.serviceId,
      serviceGroupName: row.name,
      opsServiceId: row.serviceId,
      opsRowKey: row.key,
      opsInstanceIndex: instanceIndex,
      modelInfo: {
        ...item.modelInfo,
        name: row.model,
        number: podCount,
        works: Array.from({ length: podCount }, (_, podIndex) => `${row.clusterCode}-node-${instanceIndex + 1}-${podIndex + 1}`).join(', '),
      },
    };
  })
));

const getInitialActiveRowKey = (serviceId: string) => (
  opsSeRows.find((row) => serviceId === 'all' || row.serviceId === serviceId)?.key || opsSeRows[0].key
);

const getServiceIdByModelName = (modelName?: string) => {
  const normalized = modelName?.trim().toLowerCase();
  if (!normalized) return opsPreviewServices[0]?.id || 'all';
  return opsPreviewServices.find((service) => (
    normalized.includes(service.model.toLowerCase()) ||
    service.model.toLowerCase().includes(normalized)
  ))?.id || opsPreviewServices[0]?.id || 'all';
};

const WeightStrip = ({ row, weights }: { row: OpsSeRow; weights: Record<string, number> }) => (
  <div className="model-ops-weight-strip">
    {row.traffic.map((target) => {
      const value = weights[target.key] ?? target.weight;
      return (
        <Tooltip key={target.key} title={`${target.name}: ${value}%`}>
          <span className={`health-${target.health}`} style={{ width: `${Math.max(value, 4)}%` }}>
            <b>{target.name}</b>
            <em>{value}%</em>
          </span>
        </Tooltip>
      );
    })}
  </div>
);

const ModelOpsPage = ({
  selectedModelName,
  onDetail,
  onStop,
  onMonitor,
  onExperience,
  onLog,
  onAddInstance,
  onScalePd,
  onCreateService,
  onYamlPreview,
}: ModelOpsPageProps) => {
  const initialServiceId = getServiceIdByModelName(selectedModelName);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedClusterCode, setSelectedClusterCode] = useState('all');
  const [activeRowKey, setActiveRowKey] = useState(getInitialActiveRowKey(initialServiceId));
  const [weightRowKey, setWeightRowKey] = useState<string | null>(null);
  const [bulkWeightOpen, setBulkWeightOpen] = useState(false);
  const [weightTargetSearch, setWeightTargetSearch] = useState('');
  const [weights, setWeights] = useState<Record<string, number>>(() => (
    opsSeRows.reduce<Record<string, number>>((acc, row) => {
      row.traffic.forEach((target) => {
        acc[target.key] = target.weight;
      });
      return acc;
    }, {})
  ));

  const selectedService = selectedServiceId === 'all' ? null : getOpsServiceById(selectedServiceId);
  const modelScopedRows = useMemo(() => (
    opsSeRows.filter((row) => !selectedService || row.serviceId === selectedService.id)
  ), [selectedService]);
  const modelScopedRowKeys = useMemo(() => modelScopedRows.map((row) => row.key), [modelScopedRows]);
  const modelScopedDeployRows = useMemo(() => {
    const rowKeys = new Set(modelScopedRowKeys);
    return opsDeployPreviewData.filter((item) => rowKeys.has(item.opsRowKey));
  }, [modelScopedRowKeys]);
  const clusterOptions = useMemo(() => (
    [...new Set(modelScopedRows.map((row) => row.clusterCode))].map((clusterCode) => {
      const clusterRowKeys = new Set(modelScopedRows.filter((row) => row.clusterCode === clusterCode).map((row) => row.key));
      return {
        clusterCode,
        count: opsDeployPreviewData.filter((item) => clusterRowKeys.has(item.opsRowKey)).length,
      };
    })
  ), [modelScopedRows]);
  const visibleRows = selectedClusterCode === 'all'
    ? modelScopedRows
    : modelScopedRows.filter((row) => row.clusterCode === selectedClusterCode);
  const activeRow = visibleRows.find((row) => row.key === activeRowKey) || visibleRows[0] || opsSeRows[0];
  const linkedDeployRows = useMemo(() => {
    const visibleRowKeys = new Set(visibleRows.map((row) => row.key));
    return opsDeployPreviewData.filter((item) => visibleRowKeys.has(item.opsRowKey));
  }, [visibleRows]);
  const activeDeployRow = linkedDeployRows.find((item) => item.opsRowKey === activeRow.key) || linkedDeployRows[0];
  const weightRow = weightRowKey ? opsSeRows.find((row) => row.key === weightRowKey) || null : null;
  const visibleTrafficTargets = weightRow?.traffic.filter((target) => (
    matchesKeyword([target.name, target.cluster, target.health], weightTargetSearch.trim().toLowerCase())
  )) || [];
  const weightTotal = weightRow ? weightRow.traffic.reduce((sum, target) => sum + (weights[target.key] ?? target.weight), 0) : 0;

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const nextRowKey = getInitialActiveRowKey(serviceId);
    setActiveRowKey(nextRowKey);
    setSelectedClusterCode('all');
  };

  useEffect(() => {
    const nextServiceId = getServiceIdByModelName(selectedModelName);
    setSelectedServiceId(nextServiceId);
    setActiveRowKey(getInitialActiveRowKey(nextServiceId));
    setSelectedClusterCode('all');
  }, [selectedModelName]);

  const selectCluster = (clusterCode: string) => {
    setSelectedClusterCode(clusterCode);
    if (clusterCode !== 'all') {
      const firstRow = modelScopedRows.find((row) => row.clusterCode === clusterCode);
      if (firstRow) setActiveRowKey(firstRow.key);
    }
  };

  const updateWeight = (targetKey: string, value: number) => {
    setWeights((prev) => ({ ...prev, [targetKey]: Math.max(0, Math.min(100, Math.round(value))) }));
  };

  const applyWeightStrategy = (rows: OpsSeRow[], strategy: 'normalize' | 'average') => {
    setWeights((currentWeights) => {
      const next = { ...currentWeights };
      rows.forEach((row) => {
        if (!row.traffic.length) return;
        if (strategy === 'average') {
          const base = Math.floor(100 / row.traffic.length);
          row.traffic.forEach((target, index) => {
            next[target.key] = index === row.traffic.length - 1 ? 100 - base * (row.traffic.length - 1) : base;
          });
          return;
        }
        const total = row.traffic.reduce((sum, target) => sum + (currentWeights[target.key] ?? target.weight), 0);
        if (total <= 0) return;
        let used = 0;
        row.traffic.forEach((target, index) => {
          const current = currentWeights[target.key] ?? target.weight;
          const value = index === row.traffic.length - 1 ? 100 - used : Math.floor((current / total) * 100);
          next[target.key] = value;
          used += value;
        });
      });
      return next;
    });
  };

  const normalizeWeights = () => {
    if (weightRow) applyWeightStrategy([weightRow], 'normalize');
  };

  const averageWeights = () => {
    if (weightRow) applyWeightStrategy([weightRow], 'average');
  };

  const openWeightModal = (row: OpsSeRow) => {
    setWeightTargetSearch('');
    setWeightRowKey(row.key);
  };

  const getLinkedDeployWeight = (item: DeployServiceItem) => {
    const rowKey = (item as OpsDeployPreviewItem).opsRowKey;
    const row = opsSeRows.find((candidate) => candidate.key === rowKey);
    if (!row?.traffic.length) return 100;
    const instanceIndex = (item as OpsDeployPreviewItem).opsInstanceIndex || 0;
    const target = row.traffic[instanceIndex % row.traffic.length];
    return target ? weights[target.key] ?? target.weight : 100;
  };

  return (
    <div className="model-ops-page">
      <aside className="model-ops-rail">
        <div className="model-ops-rail-title">
          <strong>模型</strong>
          <span>{opsPreviewServices.length} models</span>
        </div>
        {opsPreviewServices.map((service) => {
          const rows = opsSeRows.filter((row) => row.serviceId === service.id);
          const rowKeys = new Set(rows.map((row) => row.key));
          const instanceTotal = opsDeployPreviewData.filter((item) => rowKeys.has(item.opsRowKey)).length;
          const badCount = rows.filter((row) => row.status !== 'running').length;
          return (
            <button key={service.id} type="button" className={`model-ops-model-filter${selectedServiceId === service.id ? ' active' : ''}`} onClick={() => selectService(service.id)}>
              <i className={`status-dot ${badCount ? 'warning' : ''}`} />
              <span><strong>{service.model}</strong><em>{rows.length} 个集群 · {instanceTotal} 实例</em></span>
            </button>
          );
        })}
        <div className="model-ops-rail-se-grid">
          <button
            type="button"
            aria-pressed={selectedClusterCode === 'all'}
            className={selectedClusterCode === 'all' ? 'active' : ''}
            onClick={() => selectCluster('all')}
          >
            <strong>全部</strong>
            <em>{modelScopedDeployRows.length} 个实例</em>
          </button>
          {clusterOptions.map(({ clusterCode, count }) => (
            <button
              key={clusterCode}
              type="button"
              aria-pressed={selectedClusterCode === clusterCode}
              className={selectedClusterCode === clusterCode ? 'active' : ''}
              onClick={() => selectCluster(clusterCode)}
            >
              <strong>{clusterCode}</strong>
              <em>{count} 个实例</em>
            </button>
          ))}
        </div>
      </aside>

      <main className="model-ops-main">
        <section className="model-ops-se-panel">
          <div className="model-ops-section-head">
            <strong>模型权重</strong>
            <div className="model-ops-section-actions">
              <Button type="primary" icon={<SettingOutlined />} disabled={!visibleRows.length} onClick={() => setBulkWeightOpen(true)}>分配权重</Button>
              <Button type="primary" icon={<PlusOutlined />} disabled={!activeDeployRow} onClick={() => activeDeployRow && onAddInstance(activeDeployRow)}>添加实例</Button>
            </div>
          </div>
          {visibleRows.length ? (
            <div className="model-ops-weight-board">
              {visibleRows.map((row) => {
                const total = row.traffic.reduce((sum, target) => sum + (weights[target.key] ?? target.weight), 0);
                return (
                  <div
                    key={row.key}
                    role="button"
                    tabIndex={0}
                    className={activeRow.key === row.key ? 'model-ops-weight-item active' : 'model-ops-weight-item'}
                    onClick={() => setActiveRowKey(row.key)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveRowKey(row.key);
                      }
                    }}
                  >
                    <span className="model-ops-weight-meta">
                      <Tooltip title={row.clusterCode}><em>{row.clusterCode}</em></Tooltip>
                      <span>
                        <strong>{row.name}</strong>
                        <small>{row.model} · {row.clusterName}</small>
                      </span>
                    </span>
                    <WeightStrip row={row} weights={weights} />
                    <span className="model-ops-weight-side">
                      <small>{row.traffic.length} targets · total {total}%</small>
                      <Button size="small" className="model-ops-weight-button" icon={<SettingOutlined />} onClick={(event) => { event.stopPropagation(); openWeightModal(row); }}>权重</Button>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的实例" />
          )}
        </section>

        <section className="model-ops-detail-panel">
          <div className="model-ops-section-head">
            <strong>模型实例</strong>
          </div>
          <div className="model-ops-original-table">
            <DeployList
              data={linkedDeployRows}
              mode="modelOps"
              hideToolbar
              aggregateModelOpsPods
              defaultExpandAllModelOps
              onDetail={(item) => onDetail ? onDetail(item) : message.info(`查看模型部署：${item.name}`)}
              onStop={(item) => onStop ? onStop(item) : message.info(`整组下线：${item.name}`)}
              onMonitor={(item) => onMonitor ? onMonitor(item) : message.info(`查看监控：${item.name}`)}
              onExperience={(item) => onExperience ? onExperience(item) : message.info(`试用服务：${item.name}`)}
              onLog={(item, logId, podName) => onLog ? onLog(item, logId, podName) : message.info(`查看日志：${podName || item.name} #${logId}`)}
              onOpenCreate={() => onCreateService ? onCreateService() : message.info('创建模型服务')}
              onAllocateWeight={(item) => {
                const row = opsSeRows.find((candidate) => candidate.key === (item as OpsDeployPreviewItem).opsRowKey);
                if (row) openWeightModal(row);
              }}
              onAddInstance={onAddInstance}
              onScalePd={(item) => onScalePd ? onScalePd(item) : message.info(`扩缩容：${item.name}`)}
              onModelOpsYamlPreview={(item, kind, path) => onYamlPreview ? onYamlPreview(item, kind, path) : message.info(`查看 ${item.name} ${kind} YAML`)}
              getModelOpsRowWeight={getLinkedDeployWeight}
            />
          </div>
        </section>
      </main>

      <Modal
        title={weightRow && (
          <span className="ataas-model-ops-weight-modal-title">
            <SettingOutlined />
            <span><strong>分配权重</strong><em>{weightRow.name} · {weightRow.clusterCode}</em></span>
          </span>
        )}
        className="ataas-model-ops-weight-modal-shell"
        open={Boolean(weightRow)}
        width={860}
        okText="保存"
        cancelText="取消"
        onOk={() => {
          setWeightRowKey(null);
          message.success('模型权重已保存');
        }}
        onCancel={() => setWeightRowKey(null)}
      >
        {weightRow && (
          <div className="ataas-model-ops-weight-modal">
            <div className="model-ops-weight-search">
              <Input prefix={<SearchOutlined />} allowClear value={weightTargetSearch} onChange={(event) => setWeightTargetSearch(event.target.value)} placeholder="搜索 Router / Higress" />
            </div>
            <div className="ataas-model-ops-weight-modal-toolbar">
              <span>总和 <strong className={weightTotal === 100 ? '' : 'warning'}>{weightTotal}%</strong></span>
              <div>
                <Button onClick={normalizeWeights}>归一化</Button>
                <Button onClick={averageWeights}>均分</Button>
              </div>
            </div>
            <div className="ataas-model-ops-weight-modal-list">
              <div className="ataas-model-ops-weight-modal-cluster">
                <div className="ataas-model-ops-weight-modal-cluster-head">
                  <div className="ataas-model-ops-weight-modal-cluster-title">
                    <strong>{weightRow.clusterName}</strong>
                    <span>{weightRow.traffic.length} targets</span>
                  </div>
                  <span className="ataas-model-ops-weight-modal-cluster-total">总和 <em className={weightTotal === 100 ? '' : 'warning'}>{weightTotal}%</em></span>
                  <div />
                </div>
                {visibleTrafficTargets.map((target) => {
                  const value = weights[target.key] ?? target.weight;
                  return (
                    <div key={target.key} className="ataas-model-ops-weight-modal-row">
                      <strong>{target.name}</strong>
                      <Slider min={0} max={100} value={value} tooltip={{ formatter: null }} onChange={(next) => updateWeight(target.key, Number(next))} />
                      <InputNumber min={0} max={100} value={value} onChange={(next) => updateWeight(target.key, Number(next || 0))} />
                      <span className="ataas-model-ops-weight-modal-percent">%</span>
                    </div>
                  );
                })}
                {!visibleTrafficTargets.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的目标" />}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={(
          <span className="ataas-model-ops-weight-modal-title">
            <SettingOutlined />
            <span>
              <strong>批量分配权重</strong>
              <em>{selectedService?.model || '全部模型'} · {visibleRows.length} 个实例</em>
            </span>
          </span>
        )}
        className="ataas-model-ops-weight-modal-shell ataas-model-ops-allocate-modal-shell model-ops-bulk-weight-modal"
        open={bulkWeightOpen}
        width={960}
        okText="保存"
        cancelText="取消"
        onOk={() => {
          setBulkWeightOpen(false);
          message.success(`已保存 ${visibleRows.length} 个模型实例的权重`);
        }}
        onCancel={() => setBulkWeightOpen(false)}
      >
        <div className="ataas-model-ops-weight-modal">
          <div className="ataas-model-ops-weight-modal-toolbar">
            <span>当前筛选范围内共 <strong>{visibleRows.length}</strong> 个实例</span>
            <div>
              <Button onClick={() => applyWeightStrategy(visibleRows, 'normalize')}>全部归一化</Button>
              <Button onClick={() => applyWeightStrategy(visibleRows, 'average')}>全部均分</Button>
            </div>
          </div>
          <div className="ataas-model-ops-weight-modal-list model-ops-bulk-weight-list">
            {visibleRows.map((row) => {
              const total = row.traffic.reduce((sum, target) => sum + (weights[target.key] ?? target.weight), 0);
              return (
                <div key={row.key} className="ataas-model-ops-weight-modal-cluster">
                  <div className="ataas-model-ops-weight-modal-cluster-head">
                    <div className="ataas-model-ops-weight-modal-cluster-title">
                      <strong>{row.name}</strong>
                      <span>{row.clusterName} · {row.traffic.length} targets</span>
                    </div>
                    <span className="ataas-model-ops-weight-modal-cluster-total">
                      总和 <em className={total === 100 ? '' : 'warning'}>{total}%</em>
                    </span>
                    <div>
                      <Button onClick={() => applyWeightStrategy([row], 'normalize')}>归一化</Button>
                      <Button onClick={() => applyWeightStrategy([row], 'average')}>均分</Button>
                    </div>
                  </div>
                  {row.traffic.map((target) => {
                    const value = weights[target.key] ?? target.weight;
                    return (
                      <div key={target.key} className="ataas-model-ops-weight-modal-row">
                        <strong>{target.name}</strong>
                        <Slider min={0} max={100} value={value} tooltip={{ formatter: null }} onChange={(next) => updateWeight(target.key, Number(next))} />
                        <InputNumber min={0} max={100} value={value} onChange={(next) => updateWeight(target.key, Number(next || 0))} />
                        <span className="ataas-model-ops-weight-modal-percent">%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModelOpsPage;
