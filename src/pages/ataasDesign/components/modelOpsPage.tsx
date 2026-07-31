import {
  ArrowLeftOutlined,
  CaretRightOutlined,
  CheckCircleFilled,
  FolderOpenOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Empty, Input, InputNumber, message, Modal, Select, Slider, Switch, Tooltip } from 'antd';
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

const opsServiceOrder = ['svc-glm52-yc', 'svc-kimi-sh', 'svc-deepseek-v4-bj'];
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
  onPickConfigYaml: (onSelect: (yaml: string, path: string) => void) => void;
  onSaveConfigYaml: (path: string, yaml: string) => Promise<void>;
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

type OpsCreateNode = {
  key: string;
  name: string;
  clusterCode: string;
  ip: string;
  gpu: string;
  availableCards: number;
  totalCards: number;
  state: 'idle' | 'occupied';
  labels: string[];
};

type OpsCreateGroupDraft = {
  clusterCode: string;
  model: string;
  groupIndex: number;
  prefillNodes: string[];
  decodeNodes: string[];
  routerConfig: string;
  workersConfig: string;
  routerYaml: string;
  workersYaml: string;
  routerReplicas: number;
  prefillReplicas: number;
  decodeReplicas: number;
  routerPort: number;
  serviceEntry: string;
  enableSmokeSingle: boolean;
  enableSmokeBatch: boolean;
  smokePrompt: string;
  smokeMaxTokens: number;
  smokeBatchCount: number;
  smokeConcurrency: number;
  confirmed: boolean;
};

const opsCreateModelOptions = [
  { value: 'GLM-5.2', label: 'GLM-5.2', serviceId: 'svc-glm52-yc' },
  { value: 'Kimi-K3', label: 'Kimi-K3', serviceId: 'svc-kimi-sh' },
  { value: 'DeepSeek-v4-flash', label: 'DeepSeek-v4-flash', serviceId: 'svc-deepseek-v4-bj' },
];

const opsCreateClusters = [
  { code: 'bj', name: 'beijing-prod', meta: '北京一区 / A100-H20', serviceEntry: 'bj-higress-prod' },
  { code: 'sh', name: 'shanghai-online', meta: '上海二区 / H20-910B', serviceEntry: 'sh-higress-prod' },
  { code: 'gz', name: 'guangzhou-test', meta: '广州测试 / L20-A100', serviceEntry: 'gz-higress-test' },
  { code: 'wh', name: 'wuhan-kunpeng', meta: '武汉专区 / 910B-L20', serviceEntry: 'wh-higress-prod' },
  { code: 'zz', name: 'zhengzhou-prod', meta: '郑州一区 / H20', serviceEntry: 'zz-higress-prod' },
];

const getCreateServiceEntryOptions = (clusterCode: string) => {
  const cluster = opsCreateClusters.find((item) => item.code === clusterCode) || opsCreateClusters[0];
  return [
    { value: cluster.serviceEntry, label: `${cluster.serviceEntry} · 默认入口` },
    { value: `${cluster.code}-higress-canary`, label: `${cluster.code}-higress-canary · 灰度入口` },
    { value: `${cluster.code}-higress-internal`, label: `${cluster.code}-higress-internal · 内部入口` },
  ];
};

const opsCreateNodes: OpsCreateNode[] = opsCreateClusters.flatMap((cluster, clusterIndex) => (
  Array.from({ length: 64 }, (_, index) => {
    const occupied = index % 17 === 16;
    const occupiedGroupIndex = Math.floor(index / 17) + 1;
    const occupiedRole = occupiedGroupIndex % 2 === 0 ? 'decode' : 'prefill';
    return {
      key: `${cluster.code}-node-${index + 1}`,
      name: `${cluster.code}-gpu-${String(index + 1).padStart(3, '0')}`,
      clusterCode: cluster.code,
      ip: `10.${24 + clusterIndex}.${110 + Math.floor(index / 200)}.${20 + (index % 200)}`,
      gpu: cluster.code === 'wh' ? 'Ascend 910B' : cluster.code === 'gz' ? (index % 2 ? 'A100' : 'L20') : 'H20',
      availableCards: index % 3 === 0 ? 8 : index % 3 === 1 ? 6 : 4,
      totalCards: 8,
      state: occupied ? 'occupied' : 'idle',
      labels: occupied
        ? [
          `deployment=glm52_${occupiedGroupIndex}__${occupiedRole}`,
          'model=GLM-5.2',
          'managed-by=ataas',
        ]
        : [],
    };
  })
));

const modelSlugMap: Record<string, string> = {
  'GLM-5.2': 'glm52',
  'Kimi-K3': 'kimi-k3',
  'DeepSeek-v4-flash': 'deepseek-v4-flash',
};

const getCreateServiceId = (model: string) => (
  opsCreateModelOptions.find((option) => option.value === model)?.serviceId || opsCreateModelOptions[0].serviceId
);

const getCreateService = (model: string) => (
  opsPreviewServices.find((service) => service.id === getCreateServiceId(model)) || opsPreviewServices[0]
);

const getGroupNameFromDraft = (draft: OpsCreateGroupDraft) => (
  `${modelSlugMap[draft.model] || draft.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${draft.groupIndex}`
);

const makeDefaultCreateDraft = (row?: OpsSeRow | null): OpsCreateGroupDraft => {
  const model = opsCreateModelOptions.some((option) => option.value === row?.model) ? row?.model || 'GLM-5.2' : 'GLM-5.2';
  const clusterCode = row?.clusterCode && opsCreateClusters.some((cluster) => cluster.code === row.clusterCode) ? row.clusterCode : 'bj';
  return {
    clusterCode,
    model,
    groupIndex: Math.max(1, (row?.seed || 0) + 1),
    prefillNodes: [],
    decodeNodes: [],
    routerConfig: '',
    workersConfig: '',
    routerYaml: '',
    workersYaml: '',
    routerReplicas: 1,
    prefillReplicas: 1,
    decodeReplicas: 1,
    routerPort: 30002,
    serviceEntry: '',
    enableSmokeSingle: true,
    enableSmokeBatch: false,
    smokePrompt: '介绍一下秦始皇',
    smokeMaxTokens: 128,
    smokeBatchCount: 20,
    smokeConcurrency: 20,
    confirmed: false,
  };
};

const createDeployPreviewFromRow = (
  row: OpsSeRow,
  draft: OpsCreateGroupDraft,
  idSeed: number,
): OpsDeployPreviewItem => {
  const base = modelOpsDeploySource[idSeed % Math.max(1, modelOpsDeploySource.length)] || MOCK_DEPLOY_DATA[0];
  const selectedNodeNames = [...draft.prefillNodes, ...draft.decodeNodes]
    .map((nodeKey) => opsCreateNodes.find((node) => node.key === nodeKey)?.name)
    .filter((name): name is string => Boolean(name));
  return {
    ...base,
    id: 9000 + idSeed,
    modelOpsSourceServiceId: base.id,
    name: `${getGroupNameFromDraft(draft)}-router`,
    status: 'running',
    deployMode: 'PD 分离',
    typeStr: draft.model,
    modelOpsCluster: clusterFullNameByCode[row.clusterCode] || row.clusterName,
    modelOpsInstanceKey: row.key,
    modelOpsRoleSummary: {
      router: row.routerReady,
      prefill: row.prefillReady,
      decode: row.decodeReady,
    },
    serviceGroupKey: row.serviceId,
    serviceGroupName: row.name,
    opsServiceId: row.serviceId,
    opsRowKey: row.key,
    opsInstanceIndex: 0,
    modelInfo: {
      ...base.modelInfo,
      name: draft.model,
      number: draft.routerReplicas + draft.prefillReplicas + draft.decodeReplicas,
      works: selectedNodeNames.join(', ') || getGroupNameFromDraft(draft),
    },
  };
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

type CreateExecutionPhase = 'idle' | 'running' | 'success';

type CreatePlanStep = {
  key: 'prefill' | 'decode' | 'deploy' | 'ready' | 'service-entry' | 'smoke-single' | 'smoke-batch';
  title: string;
  desc: string;
  ready: boolean;
  mode: 'manual' | 'auto';
  targetId: string;
  details: Array<{ label: string; value: string }>;
};

const OpsCreateGroupPage = ({
  draft,
  completion,
  executionPhase,
  executionIndex,
  onBack,
  onChange,
  onExecute,
  onPickConfigYaml,
}: {
  draft: OpsCreateGroupDraft;
  completion: CreatePlanStep[];
  executionPhase: CreateExecutionPhase;
  executionIndex: number;
  onBack: () => void;
  onChange: (patch: Partial<OpsCreateGroupDraft>) => void;
  onExecute: () => void;
  onPickConfigYaml: (onSelect: (yaml: string, path: string) => void) => void;
}) => {
  const isRunning = executionPhase === 'running';
  const isLocked = executionPhase !== 'idle';
  const clusterNodes = opsCreateNodes.filter((node) => node.clusterCode === draft.clusterCode);
  const serviceEntryOptions = getCreateServiceEntryOptions(draft.clusterCode);
  const groupName = getGroupNameFromDraft(draft);
  const canExecute = completion.every((step) => step.ready) && draft.confirmed;
  const [expandedPlanKeys, setExpandedPlanKeys] = useState<string[]>(() => completion.map((step) => step.key));
  const [nodeSearch, setNodeSearch] = useState('');
  const completionSignature = completion.map((step) => `${step.key}:${step.ready}`).join('|');
  const normalizedNodeSearch = nodeSearch.trim().toLowerCase();
  const visibleClusterNodes = clusterNodes.filter((node) => (
    !normalizedNodeSearch
    || [node.name, node.gpu].some((value) => value.toLowerCase().includes(normalizedNodeSearch))
  ));

  useEffect(() => {
    if (executionPhase !== 'idle') return;
    setExpandedPlanKeys(completion.map((step) => step.key));
  }, [completionSignature, executionPhase]);

  useEffect(() => {
    let visibleStepKey: CreatePlanStep['key'] | undefined;
    if (executionPhase === 'running') {
      const activeStep = completion[executionIndex];
      if (activeStep) {
        visibleStepKey = activeStep.key;
        setExpandedPlanKeys((current) => current.includes(activeStep.key) ? current : [...current, activeStep.key]);
      }
    }
    if (executionPhase === 'success') {
      const lastStep = completion[completion.length - 1];
      visibleStepKey = lastStep?.key;
      if (lastStep) {
        setExpandedPlanKeys((current) => current.includes(lastStep.key) ? current : [...current, lastStep.key]);
      }
    }
    if (visibleStepKey) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-create-plan-step="${visibleStepKey}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }, [completion, executionIndex, executionPhase]);

  const togglePlanStep = (step: CreatePlanStep) => {
    setExpandedPlanKeys((current) => (
      current.includes(step.key)
        ? current.filter((key) => key !== step.key)
        : [...current, step.key]
    ));
    document.getElementById(step.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const setRoleNode = (role: 'prefill' | 'decode', nodeKey: string) => {
    if (isLocked) return;
    const roleKey = role === 'prefill' ? 'prefillNodes' : 'decodeNodes';
    const otherKey = role === 'prefill' ? 'decodeNodes' : 'prefillNodes';
    const current = draft[roleKey];
    const selected = current.includes(nodeKey);
    onChange({
      [roleKey]: selected ? current.filter((key) => key !== nodeKey) : [...current, nodeKey],
      [otherKey]: selected ? draft[otherKey] : draft[otherKey].filter((key) => key !== nodeKey),
    } as Partial<OpsCreateGroupDraft>);
  };

  const selectConfigYaml = (kind: 'router' | 'workers') => {
    if (isLocked) return;
    onPickConfigYaml((yaml, path) => {
      onChange(kind === 'router'
        ? { routerConfig: path, routerYaml: yaml }
        : { workersConfig: path, workersYaml: yaml });
    });
  };

  const renderConfigFile = (kind: 'router' | 'workers') => {
    const label = kind === 'router' ? 'Router config' : 'Workers config';
    const path = kind === 'router' ? draft.routerConfig : draft.workersConfig;

    return (
      <div className={`model-ops-create-config-file ${path ? 'selected' : ''}`}>
        <div className="model-ops-create-config-file-head">
          <div className="model-ops-create-config-file-main">
            <FileTextOutlined />
            <span>
              <strong>{label}</strong>
              <em title={path}>{path || '尚未选择资源文件'}</em>
            </span>
          </div>
          <div className="model-ops-create-config-file-actions">
            <Button
              size="small"
              icon={path ? <SwapOutlined /> : <FolderOpenOutlined />}
              disabled={isLocked}
              onClick={() => selectConfigYaml(kind)}
            >
              {path ? '更换' : '选择 YAML'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderNodeButton = (node: OpsCreateNode, role: 'prefill' | 'decode') => {
    const selected = role === 'prefill' ? draft.prefillNodes.includes(node.key) : draft.decodeNodes.includes(node.key);
    const occupiedByOtherRole = role === 'prefill' ? draft.decodeNodes.includes(node.key) : draft.prefillNodes.includes(node.key);
    const disabled = isLocked || node.state !== 'idle' || occupiedByOtherRole;
    const roleLabel = role === 'prefill' ? 'Prefill' : 'Decode';
    const stateLabel = selected
      ? `已选为 ${roleLabel}`
      : occupiedByOtherRole
        ? `已选为 ${role === 'prefill' ? 'Decode' : 'Prefill'}`
        : node.state === 'idle'
          ? '可选择'
          : '已占用';

    return (
      <Tooltip
        key={`${role}-${node.key}`}
        placement="top"
        overlayClassName="model-ops-create-node-tooltip-overlay"
        title={(
          <div className="model-ops-create-node-tooltip">
            <strong>机器节点 · {node.name}</strong>
            <span>GPU 型号：{node.gpu}</span>
            <span>GPU 空闲：{node.availableCards} / {node.totalCards} 张</span>
            <span>状态：{stateLabel}</span>
            {node.labels.length > 0 && (
              <div className="model-ops-create-node-tooltip-labels">
                <em>节点标签</em>
                <div>
                  {node.labels.map((label) => <code key={label}>{label}</code>)}
                </div>
              </div>
            )}
          </div>
        )}
      >
        <span className="model-ops-create-node-wrap">
          <button
            type="button"
            disabled={disabled}
            className={`model-ops-create-node ${role} ${selected ? 'selected' : ''} ${disabled && !selected ? 'disabled' : ''}`}
            onClick={() => setRoleNode(role, node.key)}
          >
            <span className="model-ops-create-node-main">
              {selected ? <CheckCircleFilled /> : <i />}
              <strong>{node.name}</strong>
            </span>
            <small>{stateLabel}</small>
          </button>
        </span>
      </Tooltip>
    );
  };

  return (
    <div className="model-ops-create-page">
      <header className="model-ops-create-header">
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} disabled={isRunning}>返回</Button>
        <h1>新建 Group</h1>
      </header>

      <main className="model-ops-create-layout">
        <div className="model-ops-create-main">
          <section id="create-scope" className="model-ops-create-section">
            <div className="model-ops-create-section-head">
              <span>01</span>
              <div><strong>目标与 Group</strong><em>先确定创建到哪个集群、哪个模型，以及生成哪个 Group。</em></div>
            </div>
            <div className="model-ops-create-field-grid">
              <label>
                <span>目标 cluster</span>
                <Select
                  value={draft.clusterCode}
                  classNames={{ popup: { root: 'model-ops-create-select-popup' } }}
                  disabled={isLocked}
                  onChange={(value) => onChange({
                    clusterCode: value,
                    prefillNodes: [],
                    decodeNodes: [],
                    serviceEntry: '',
                  })}
                  options={opsCreateClusters.map((cluster) => ({ value: cluster.code, label: `${cluster.name} · ${cluster.meta}` }))}
                />
              </label>
              <label>
                <span>模型</span>
                <Select
                  value={draft.model}
                  classNames={{ popup: { root: 'model-ops-create-select-popup' } }}
                  disabled={isLocked}
                  onChange={(value) => {
                    onChange({
                      model: value,
                      routerConfig: '',
                      workersConfig: '',
                      routerYaml: '',
                      workersYaml: '',
                    });
                  }}
                  options={opsCreateModelOptions.map((option) => ({ value: option.value, label: option.label }))}
                />
              </label>
              <label>
                <span>Group index</span>
                <InputNumber min={1} max={99} value={draft.groupIndex} disabled={isLocked} onChange={(value) => onChange({ groupIndex: Number(value || 1) })} />
              </label>
              <label>
                <span>Group name</span>
                <Input value={groupName} readOnly />
              </label>
            </div>
          </section>

          <section id="create-nodes" className="model-ops-create-section">
            <div className="model-ops-create-section-head">
              <span>02</span>
              <div><strong>Prefill / Decode 节点</strong><em>每个节点代表一台可包含多张 GPU 的计算机器，同一台机器只能选择一个角色。</em></div>
            </div>
            <div className="model-ops-create-node-toolbar">
              <Input
                allowClear
                prefix={<SearchOutlined />}
                value={nodeSearch}
                disabled={isLocked}
                placeholder="搜索节点名称或 GPU 型号"
                onChange={(event) => setNodeSearch(event.target.value)}
              />
              <span className="model-ops-create-node-count">{visibleClusterNodes.length} / {clusterNodes.length} 个节点</span>
            </div>
            <div className="model-ops-create-node-columns">
              <div className="model-ops-create-role-block">
                <div className="model-ops-create-role-title"><strong>Prefill nodes</strong><em>{draft.prefillNodes.length} selected</em></div>
                <div className="model-ops-create-node-grid">
                  {visibleClusterNodes.length > 0
                    ? visibleClusterNodes.map((node) => renderNodeButton(node, 'prefill'))
                    : <span className="model-ops-create-node-empty">没有匹配的节点</span>}
                </div>
              </div>
              <div className="model-ops-create-role-block">
                <div className="model-ops-create-role-title"><strong>Decode nodes</strong><em>{draft.decodeNodes.length} selected</em></div>
                <div className="model-ops-create-node-grid">
                  {visibleClusterNodes.length > 0
                    ? visibleClusterNodes.map((node) => renderNodeButton(node, 'decode'))
                    : <span className="model-ops-create-node-empty">没有匹配的节点</span>}
                </div>
              </div>
            </div>
          </section>

          <section id="create-config" className="model-ops-create-section">
            <div className="model-ops-create-section-head">
              <span>03</span>
              <div><strong>Config 与运行规格</strong><em>从资源文件选择本次部署使用的 Router 与 Workers YAML。</em></div>
            </div>
            <div className="model-ops-create-config-files">
              {renderConfigFile('router')}
              {renderConfigFile('workers')}
            </div>
            <div className="model-ops-create-runtime-grid">
              <label><span>Router replicas</span><InputNumber min={1} max={8} value={draft.routerReplicas} disabled={isLocked} onChange={(value) => onChange({ routerReplicas: Number(value || 1) })} /></label>
              <label><span>Prefill replicas</span><InputNumber min={1} max={64} value={draft.prefillReplicas} disabled={isLocked} onChange={(value) => onChange({ prefillReplicas: Number(value || 1) })} /></label>
              <label><span>Decode replicas</span><InputNumber min={1} max={64} value={draft.decodeReplicas} disabled={isLocked} onChange={(value) => onChange({ decodeReplicas: Number(value || 1) })} /></label>
              <label><span>Router port</span><InputNumber min={1} max={65535} value={draft.routerPort} disabled={isLocked} onChange={(value) => onChange({ routerPort: Number(value || 30002) })} /></label>
            </div>
          </section>

          <section id="create-service-entry" className="model-ops-create-section">
            <div className="model-ops-create-section-head">
              <span>04</span>
              <div><strong>ServiceEntry</strong><em>选择 Group 就绪后需要更新的流量入口。</em></div>
            </div>
            <div className="model-ops-create-field-grid service-entry">
              <label>
                <span>ServiceEntry name</span>
                <Select
                  allowClear
                  value={draft.serviceEntry || undefined}
                  placeholder="选择 ServiceEntry"
                  classNames={{ popup: { root: 'model-ops-create-select-popup' } }}
                  disabled={isLocked}
                  onChange={(value) => onChange({ serviceEntry: value || '' })}
                  options={serviceEntryOptions}
                />
              </label>
            </div>
          </section>

          <section id="create-smoke" className="model-ops-create-section">
            <div className="model-ops-create-section-head">
              <span>05</span>
              <div><strong>Smoke Test（可选）</strong><em>选择部署完成后需要执行的验证测试，并配置实际请求参数。</em></div>
            </div>
            <div className="model-ops-create-test-switches">
              <div>
                <span><strong>单请求测试</strong><em>验证 Router、模型推理和响应链路是否正常。</em></span>
                <Switch
                  size="small"
                  checked={draft.enableSmokeSingle}
                  disabled={isLocked}
                  onChange={(checked) => onChange({ enableSmokeSingle: checked })}
                />
              </div>
              <div>
                <span><strong>批量 20×20 测试</strong><em>验证并发请求下的错误、超时和路由稳定性。</em></span>
                <Switch
                  size="small"
                  checked={draft.enableSmokeBatch}
                  disabled={isLocked}
                  onChange={(checked) => onChange({ enableSmokeBatch: checked })}
                />
              </div>
            </div>
            <div className={`model-ops-create-test-config ${!draft.enableSmokeSingle && !draft.enableSmokeBatch ? 'disabled' : ''}`}>
              <label className="wide">
                <span>Test prompt</span>
                <Input.TextArea
                  rows={3}
                  value={draft.smokePrompt}
                  disabled={isLocked || (!draft.enableSmokeSingle && !draft.enableSmokeBatch)}
                  placeholder="输入用于验证模型响应的 Prompt"
                  onChange={(event) => onChange({ smokePrompt: event.target.value })}
                />
              </label>
              <div>
                <label>
                  <span>Max tokens</span>
                  <InputNumber
                    min={1}
                    max={4096}
                    value={draft.smokeMaxTokens}
                    disabled={isLocked || (!draft.enableSmokeSingle && !draft.enableSmokeBatch)}
                    onChange={(value) => onChange({ smokeMaxTokens: Number(value || 128) })}
                  />
                </label>
                <label>
                  <span>Batch count</span>
                  <InputNumber
                    min={1}
                    max={500}
                    value={draft.smokeBatchCount}
                    disabled={isLocked || !draft.enableSmokeBatch}
                    onChange={(value) => onChange({ smokeBatchCount: Number(value || 20) })}
                  />
                </label>
                <label>
                  <span>Concurrency</span>
                  <InputNumber
                    min={1}
                    max={100}
                    value={draft.smokeConcurrency}
                    disabled={isLocked || !draft.enableSmokeBatch}
                    onChange={(value) => onChange({ smokeConcurrency: Number(value || 20) })}
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        <aside className="model-ops-create-guide">
          <section>
            <div className="model-ops-create-guide-head">
              <strong>执行计划</strong>
              <span>
                {executionPhase === 'idle'
                  ? completion.every((item) => item.ready) ? `参数已就绪 · ${completion.length} 步` : `待补充 ${completion.filter((item) => !item.ready).length} 项`
                  : executionPhase === 'running' ? '执行中' : '已完成'}
              </span>
            </div>
            <div className="model-ops-create-plan-list">
              {completion.map((item, index) => {
                const expanded = expandedPlanKeys.includes(item.key);
                const executionDone = executionPhase === 'success'
                  || (executionPhase === 'running' && index < executionIndex);
                const executionRunning = executionPhase === 'running' && index === executionIndex;
                const isSetupStep = item.key === 'prefill'
                  || item.key === 'decode'
                  || item.key === 'deploy'
                  || item.key === 'service-entry';
                const visualDone = executionPhase === 'idle' ? item.ready && isSetupStep : executionDone;
                const stateLabel = executionPhase === 'idle'
                  ? !item.ready ? '待配置' : isSetupStep ? '已就绪' : '待执行'
                  : executionDone ? '已完成' : executionRunning ? '执行中' : '等待执行';
                return (
                  <div
                    key={item.key}
                    data-create-plan-step={item.key}
                    className={[
                      'model-ops-create-plan-step',
                      visualDone ? 'done' : '',
                      executionRunning ? 'running' : '',
                      expanded ? 'expanded' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <button
                      type="button"
                      className="model-ops-create-plan-trigger"
                      aria-expanded={expanded}
                      onClick={() => togglePlanStep(item)}
                    >
                      <i>{visualDone ? <CheckCircleFilled /> : executionRunning ? <LoadingOutlined /> : index + 1}</i>
                      <span>
                        <span className="model-ops-create-plan-title">
                          <strong>{item.title}</strong>
                          <small className={item.mode}>{item.mode === 'auto' ? '自动' : '手动确认'}</small>
                        </span>
                        <em>{item.desc}</em>
                      </span>
                      <b>{stateLabel}</b>
                      <CaretRightOutlined className="model-ops-create-plan-caret" />
                    </button>
                    {expanded && (
                      <div className="model-ops-create-plan-detail">
                        {item.details.map((detail) => (
                          <div key={`${item.key}-${detail.label}`}>
                            <span>{detail.label}</span>
                            <strong title={detail.value}>{detail.value}</strong>
                          </div>
                        ))}
                        {item.key === 'smoke-single' && executionPhase !== 'idle' && (
                          <pre className={`model-ops-create-test-output ${executionDone ? 'done' : ''}`}>
                            {executionDone
                              ? `200 OK · Prompt: ${draft.smokePrompt} · 模型响应正常`
                              : '正在发送单请求并等待模型响应...'}
                          </pre>
                        )}
                        {item.key === 'smoke-batch' && executionPhase !== 'idle' && (
                          <pre className={`model-ops-create-test-output ${executionDone ? 'done' : ''}`}>
                            {executionDone
                              ? `${draft.smokeBatchCount}/${draft.smokeBatchCount} passed · error 0 · concurrency ${draft.smokeConcurrency}`
                              : '正在执行批量并发测试...'}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="model-ops-create-guide-actions">
              <Checkbox
                checked={draft.confirmed}
                disabled={isLocked}
                onChange={(event) => onChange({ confirmed: event.target.checked })}
              >
                <span className="model-ops-create-confirm-copy">
                  <strong>执行前确认</strong>
                  <em>我已检查节点、YAML 与运行规格</em>
                </span>
              </Checkbox>
              <div>
                <Button onClick={onBack} disabled={isRunning}>{executionPhase === 'success' ? '返回运营调度' : '取消'}</Button>
                <Button
                  type="primary"
                  icon={executionPhase === 'running' ? <LoadingOutlined /> : executionPhase === 'success' ? <CheckCircleFilled /> : <PlayCircleOutlined />}
                  disabled={!canExecute || executionPhase === 'running' || executionPhase === 'success'}
                  onClick={onExecute}
                >
                  {executionPhase === 'success' ? '执行完成' : executionPhase === 'running' ? '执行中' : '执行'}
                </Button>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

const ModelOpsPage = ({
  selectedModelName,
  onDetail,
  onStop,
  onMonitor,
  onExperience,
  onLog,
  onScalePd,
  onCreateService,
  onYamlPreview,
  onPickConfigYaml,
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
  const [createdRows, setCreatedRows] = useState<OpsSeRow[]>([]);
  const [createdDeployRows, setCreatedDeployRows] = useState<OpsDeployPreviewItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<OpsCreateGroupDraft>(() => makeDefaultCreateDraft());
  const [createExecutionPhase, setCreateExecutionPhase] = useState<CreateExecutionPhase>('idle');
  const [createExecutionIndex, setCreateExecutionIndex] = useState(-1);
  const allOpsRows = useMemo(() => [...opsSeRows, ...createdRows], [createdRows]);
  const allDeployRows = useMemo(() => [...opsDeployPreviewData, ...createdDeployRows], [createdDeployRows]);

  const getInitialRowKey = (serviceId: string) => (
    allOpsRows.find((row) => serviceId === 'all' || row.serviceId === serviceId)?.key || allOpsRows[0]?.key || ''
  );

  const selectedService = selectedServiceId === 'all' ? null : getOpsServiceById(selectedServiceId);
  const modelScopedRows = useMemo(() => (
    allOpsRows.filter((row) => !selectedService || row.serviceId === selectedService.id)
  ), [allOpsRows, selectedService]);
  const modelScopedRowKeys = useMemo(() => modelScopedRows.map((row) => row.key), [modelScopedRows]);
  const modelScopedDeployRows = useMemo(() => {
    const rowKeys = new Set(modelScopedRowKeys);
    return allDeployRows.filter((item) => rowKeys.has(item.opsRowKey));
  }, [allDeployRows, modelScopedRowKeys]);
  const clusterOptions = useMemo(() => (
    [...new Set(modelScopedRows.map((row) => row.clusterCode))].map((clusterCode) => {
      const clusterRowKeys = new Set(modelScopedRows.filter((row) => row.clusterCode === clusterCode).map((row) => row.key));
      return {
        clusterCode,
        count: allDeployRows.filter((item) => clusterRowKeys.has(item.opsRowKey)).length,
      };
    })
  ), [allDeployRows, modelScopedRows]);
  const visibleRows = selectedClusterCode === 'all'
    ? modelScopedRows
    : modelScopedRows.filter((row) => row.clusterCode === selectedClusterCode);
  const activeRow = visibleRows.find((row) => row.key === activeRowKey) || visibleRows[0] || allOpsRows[0];
  const linkedDeployRows = useMemo(() => {
    const visibleRowKeys = new Set(visibleRows.map((row) => row.key));
    return allDeployRows.filter((item) => visibleRowKeys.has(item.opsRowKey));
  }, [allDeployRows, visibleRows]);
  const activeDeployRow = linkedDeployRows.find((item) => item.opsRowKey === activeRow?.key) || linkedDeployRows[0];
  const weightRow = weightRowKey ? allOpsRows.find((row) => row.key === weightRowKey) || null : null;
  const visibleTrafficTargets = weightRow?.traffic.filter((target) => (
    matchesKeyword([target.name, target.cluster, target.health], weightTargetSearch.trim().toLowerCase())
  )) || [];
  const weightTotal = weightRow ? weightRow.traffic.reduce((sum, target) => sum + (weights[target.key] ?? target.weight), 0) : 0;
  const createCompletion = useMemo<CreatePlanStep[]>(() => {
    const cluster = opsCreateClusters.find((item) => item.code === createDraft.clusterCode) || opsCreateClusters[0];
    const groupName = getGroupNameFromDraft(createDraft);
    const prefillNodeNames = createDraft.prefillNodes
      .map((nodeKey) => opsCreateNodes.find((node) => node.key === nodeKey)?.name)
      .filter((name): name is string => Boolean(name));
    const decodeNodeNames = createDraft.decodeNodes
      .map((nodeKey) => opsCreateNodes.find((node) => node.key === nodeKey)?.name)
      .filter((name): name is string => Boolean(name));
    const scopeDone = Boolean(createDraft.clusterCode && createDraft.model && createDraft.groupIndex > 0);
    const prefillDone = prefillNodeNames.length > 0;
    const decodeDone = decodeNodeNames.length > 0;
    const routerDone = Boolean(createDraft.routerConfig && createDraft.routerYaml.trim())
      && createDraft.routerReplicas > 0
      && createDraft.routerPort > 0
      && createDraft.routerPort <= 65535;
    const workersDone = Boolean(createDraft.workersConfig && createDraft.workersYaml.trim())
      && createDraft.prefillReplicas > 0
      && createDraft.decodeReplicas > 0;
    const serviceEntryDone = Boolean(createDraft.serviceEntry);
    const deployDone = scopeDone && routerDone && workersDone;
    const workflowReady = prefillDone && decodeDone && deployDone;
    const trafficReady = workflowReady && serviceEntryDone;
    const smokeRequestReady = trafficReady
      && Boolean(createDraft.smokePrompt.trim())
      && createDraft.smokeMaxTokens > 0;
    const smokeBatchReady = smokeRequestReady
      && createDraft.smokeBatchCount > 0
      && createDraft.smokeConcurrency > 0;

    const steps: CreatePlanStep[] = [
      {
        key: 'prefill',
        title: 'Label prefill nodes',
        desc: prefillDone ? `Set label deployment=${groupName}__prefill on ${prefillNodeNames.join(', ')}` : '至少选择 1 个 Prefill 节点',
        ready: prefillDone,
        mode: 'manual',
        targetId: 'create-nodes',
        details: [
          { label: '目标节点', value: prefillNodeNames.join(', ') || '未选择' },
          { label: '写入标签', value: `deployment=${groupName}__prefill` },
        ],
      },
      {
        key: 'decode',
        title: 'Label decode nodes',
        desc: decodeDone ? `Set label deployment=${groupName}__decode on ${decodeNodeNames.join(', ')}` : '至少选择 1 个 Decode 节点',
        ready: decodeDone,
        mode: 'manual',
        targetId: 'create-nodes',
        details: [
          { label: '目标节点', value: decodeNodeNames.join(', ') || '未选择' },
          { label: '写入标签', value: `deployment=${groupName}__decode` },
        ],
      },
      {
        key: 'deploy',
        title: 'Deploy router + workers RBG',
        desc: deployDone ? `Deploy ${groupName} group to ${cluster.name}` : '请完成目标、Router YAML、Workers YAML 和运行规格',
        ready: deployDone,
        mode: 'manual',
        targetId: 'create-config',
        details: [
          { label: 'Group', value: `${groupName} · ${createDraft.model} · ${cluster.name}` },
          { label: 'Router YAML', value: createDraft.routerConfig || '未选择' },
          { label: 'Workers YAML', value: createDraft.workersConfig || '未选择' },
          { label: '运行参数', value: `R ${createDraft.routerReplicas} / P ${createDraft.prefillReplicas} / D ${createDraft.decodeReplicas} · port ${createDraft.routerPort}` },
        ],
      },
      {
        key: 'ready',
        title: 'Wait for pods ready',
        desc: workflowReady ? `Wait for ${groupName}-router, ${groupName}-workers to become Ready` : '前置步骤配置完成后自动执行',
        ready: workflowReady,
        mode: 'auto',
        targetId: 'create-config',
        details: [
          { label: 'Router Pods', value: `${groupName}-router · ${createDraft.routerReplicas} replicas` },
          { label: 'Workers Pods', value: `${groupName}-workers · P ${createDraft.prefillReplicas} / D ${createDraft.decodeReplicas}` },
          { label: 'Timeout', value: '1200s' },
        ],
      },
      {
        key: 'service-entry',
        title: 'Update ServiceEntry',
        desc: serviceEntryDone
          ? `Update ${createDraft.serviceEntry} to route ${groupName}-router:${createDraft.routerPort}`
          : '请选择 Group 创建完成后需要更新的 ServiceEntry',
        ready: serviceEntryDone,
        mode: 'manual',
        targetId: 'create-service-entry',
        details: [
          { label: 'ServiceEntry', value: createDraft.serviceEntry || '未选择' },
          { label: '目标服务', value: `${groupName}-router` },
          { label: '目标端口', value: String(createDraft.routerPort) },
        ],
      },
      ...(createDraft.enableSmokeSingle ? [{
        key: 'smoke-single' as const,
        title: 'Smoke test (single)',
        desc: trafficReady ? `workflow.smoke_test(model=${createDraft.model}, group_index=${createDraft.groupIndex})` : 'ServiceEntry 更新后执行单请求测试',
        ready: smokeRequestReady,
        mode: 'manual' as const,
        targetId: 'create-smoke',
        details: [
          { label: 'Prompt', value: createDraft.smokePrompt || '未填写' },
          { label: 'Max tokens', value: String(createDraft.smokeMaxTokens) },
          { label: 'ServiceEntry', value: createDraft.serviceEntry || '未选择' },
        ],
      }] : []),
      ...(createDraft.enableSmokeBatch ? [{
        key: 'smoke-batch' as const,
        title: `Smoke test (batch ${createDraft.smokeBatchCount}×${createDraft.smokeConcurrency})`,
        desc: trafficReady ? `workflow.smoke_test_batch(count=${createDraft.smokeBatchCount}, concurrency=${createDraft.smokeConcurrency})` : 'ServiceEntry 更新后执行批量测试',
        ready: smokeBatchReady,
        mode: 'manual' as const,
        targetId: 'create-smoke',
        details: [
          { label: 'Prompt', value: createDraft.smokePrompt || '未填写' },
          { label: 'Count', value: String(createDraft.smokeBatchCount) },
          { label: 'Concurrency', value: String(createDraft.smokeConcurrency) },
          { label: 'Max tokens', value: String(createDraft.smokeMaxTokens) },
          { label: 'ServiceEntry', value: createDraft.serviceEntry || '未选择' },
        ],
      }] : []),
    ];
    return steps;
  }, [createDraft]);
  const canExecuteCreate = createCompletion.every((step) => step.ready) && createDraft.confirmed;

  const selectService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const nextRowKey = getInitialRowKey(serviceId);
    setActiveRowKey(nextRowKey);
    setSelectedClusterCode('all');
  };

  useEffect(() => {
    const nextServiceId = getServiceIdByModelName(selectedModelName);
    setSelectedServiceId(nextServiceId);
    setActiveRowKey(getInitialRowKey(nextServiceId));
    setSelectedClusterCode('all');
  }, [selectedModelName]);

  useEffect(() => {
    if (createExecutionPhase !== 'running') return undefined;
    const timer = window.setInterval(() => {
      setCreateExecutionIndex((current) => {
        if (current >= createCompletion.length - 1) {
          window.clearInterval(timer);
          const service = getCreateService(createDraft.model);
          const groupName = getGroupNameFromDraft(createDraft);
          const cluster = opsCreateClusters.find((item) => item.code === createDraft.clusterCode) || opsCreateClusters[0];
          const rowKey = `${groupName}-${createDraft.clusterCode}-${createdRows.length + 1}`;
          const row: OpsSeRow = {
            key: rowKey,
            serviceId: service.id,
            name: `${groupName}-${cluster.name}`,
            model: createDraft.model,
            mode: 'PD 分离',
            clusterCode: createDraft.clusterCode,
            clusterName: `${createDraft.clusterCode} / ${cluster.meta.split('/').slice(-1)[0].trim()}`,
            status: 'running',
            traffic: [{ key: `${rowKey}-traffic-router`, name: `${groupName}-router`, cluster: createDraft.clusterCode, weight: 100, health: 'healthy' }],
            instanceCount: createDraft.routerReplicas + createDraft.prefillReplicas + createDraft.decodeReplicas,
            routerReady: `${createDraft.routerReplicas}/${createDraft.routerReplicas}`,
            prefillReady: `${createDraft.prefillReplicas}/${createDraft.prefillReplicas}`,
            decodeReady: `${createDraft.decodeReplicas}/${createDraft.decodeReplicas}`,
            ttft: createDraft.model === 'DeepSeek-v4-flash' ? 6200 : createDraft.model === 'Kimi-K3' ? 7400 : 8100,
            tpot: createDraft.model === 'DeepSeek-v4-flash' ? 16.8 : createDraft.model === 'Kimi-K3' ? 18.4 : 20.2,
            error: 0,
            seed: 30 + createdRows.length,
          };
          const deployRow = createDeployPreviewFromRow(row, createDraft, createdDeployRows.length + 1);
          setCreatedRows((rows) => [...rows, row]);
          setCreatedDeployRows((rows) => [...rows, deployRow]);
          setWeights((currentWeights) => ({ ...currentWeights, [row.traffic[0].key]: 100 }));
          setSelectedServiceId(service.id);
          setSelectedClusterCode(createDraft.clusterCode);
          setActiveRowKey(row.key);
          setCreateExecutionPhase('success');
          message.success(`${groupName} 已创建并接入运营调度`);
          return current;
        }
        return current + 1;
      });
    }, 720);
    return () => window.clearInterval(timer);
  }, [createCompletion.length, createExecutionPhase]);

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
    const row = allOpsRows.find((candidate) => candidate.key === rowKey);
    if (!row?.traffic.length) return 100;
    const instanceIndex = (item as OpsDeployPreviewItem).opsInstanceIndex || 0;
    const target = row.traffic[instanceIndex % row.traffic.length];
    return target ? weights[target.key] ?? target.weight : 100;
  };

  const openCreateGroup = (item?: DeployServiceItem) => {
    const sourceRow = item
      ? allOpsRows.find((row) => row.key === (item as OpsDeployPreviewItem).opsRowKey)
      : activeRow;
    const modelFromService = opsCreateModelOptions.find((option) => (
      option.serviceId === (sourceRow?.serviceId || selectedService?.id)
    ))?.value;
    const model = opsCreateModelOptions.some((option) => option.value === sourceRow?.model)
      ? sourceRow?.model || 'GLM-5.2'
      : modelFromService || 'GLM-5.2';
    const clusterCode = selectedClusterCode !== 'all'
      ? selectedClusterCode
      : sourceRow?.clusterCode || 'bj';
    const serviceId = getCreateServiceId(model);
    const groupIndex = Math.max(1, allOpsRows.filter((row) => (
      row.clusterCode === clusterCode && row.serviceId === serviceId
    )).length + 1);
    setCreateDraft({
      ...makeDefaultCreateDraft(sourceRow),
      clusterCode,
      model,
      groupIndex,
    });
    setCreateExecutionPhase('idle');
    setCreateExecutionIndex(-1);
    setCreateOpen(true);
  };

  const executeCreateGroup = () => {
    if (!canExecuteCreate) {
      message.warning('请先完成全部配置并确认执行计划');
      return;
    }
    setCreateExecutionPhase('running');
    setCreateExecutionIndex(0);
  };

  const closeCreateGroup = () => {
    setCreateOpen(false);
    setCreateExecutionPhase('idle');
    setCreateExecutionIndex(-1);
  };

  if (createOpen) {
    return (
      <OpsCreateGroupPage
        draft={createDraft}
        completion={createCompletion}
        executionPhase={createExecutionPhase}
        executionIndex={createExecutionIndex}
        onBack={closeCreateGroup}
        onChange={(patch) => setCreateDraft((current) => ({ ...current, ...patch }))}
        onExecute={executeCreateGroup}
        onPickConfigYaml={onPickConfigYaml}
      />
    );
  }

  return (
    <div className="model-ops-page">
      <aside className="model-ops-rail">
        <div className="model-ops-rail-title">
          <strong>模型</strong>
          <span>{opsPreviewServices.length} models</span>
        </div>
        {opsPreviewServices.map((service) => {
          const rows = allOpsRows.filter((row) => row.serviceId === service.id);
          const rowKeys = new Set(rows.map((row) => row.key));
          const instanceTotal = allDeployRows.filter((item) => rowKeys.has(item.opsRowKey)).length;
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
              <Button className="ataas-page-create-button" type="primary" icon={<PlusOutlined />} onClick={() => openCreateGroup(activeDeployRow)}>创建 Group 组</Button>
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
                    className={activeRow?.key === row.key ? 'model-ops-weight-item active' : 'model-ops-weight-item'}
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
                const row = allOpsRows.find((candidate) => candidate.key === (item as OpsDeployPreviewItem).opsRowKey);
                if (row) openWeightModal(row);
              }}
              onAddInstance={openCreateGroup}
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
