import {
  CheckCircleFilled,
  ClusterOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  DesktopOutlined,
  FileZipOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Steps,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import './bareMetalClusterWizard.less';

export type BareMetalDataCenter = {
  key: string;
  name: string;
  supplier: string;
};

type MachineRole = 'master' | 'worker';
type PrecheckStatus = 'checking' | 'ready' | 'failed';
type ClusterAccessMode = 'ssh' | 'token';
export type MachineConnectionStatus = 'idle' | 'testing' | 'success' | 'failed';

export type MachineAccessDraft = {
  key: string;
  ip: string;
  admin: string;
  password: string;
  sshPort?: number;
  testStatus: MachineConnectionStatus;
};

export type MachineCandidate = {
  key: string;
  ip: string;
  admin: string;
  sshPort: number;
  hostname: string;
  os: string;
  arch: string;
  cpu: string;
  memory: string;
  disk: string;
  role: MachineRole;
  status: PrecheckStatus;
};

type TokenAccessDraft = {
  apiServer: string;
  token: string;
};

type CompatiblePackage = {
  id: string;
  name: string;
  version: string;
  k8sVersions: string[];
  os: string;
  arch: string;
  size: string;
  checksum: string;
  status: 'available' | 'verifying';
};

export type ClusterCreateTaskSummary = {
  accessMode: ClusterAccessMode;
  clusterName: string;
  dataCenterKey: string;
  machineCount: number;
  masterCount: number;
  workerCount: number;
  k8sVersion: string;
  packageName: string;
};

export type ClusterWizardDraft = {
  accessMode?: ClusterAccessMode;
  step: number;
  clusterName: string;
  dataCenterKey: string;
  tokenDraft?: TokenAccessDraft;
  machineAccessList: MachineAccessDraft[];
  machineIPs?: string;
  sshPort?: number;
  sshUser?: string;
  credential?: string;
  machines: MachineCandidate[];
  k8sVersion: string;
  selectedPackageId: string;
};

type BareMetalClusterWizardProps = {
  open: boolean;
  dataCenters: BareMetalDataCenter[];
  initialDataCenterKey?: string;
  onCancel: () => void;
  onOpenResourceCreator?: (kind: 'supplier' | 'dataCenter') => void;
  onOpenPackageManager: (
    request: { k8sVersion: string; os: string; arch: string },
    draft: ClusterWizardDraft,
  ) => void;
  onTaskCreated?: (summary: ClusterCreateTaskSummary) => void;
  onRunInBackground?: () => void;
};

const PACKAGE_STORAGE_KEY = 'ataas.software-packages.catalog.v1';
export const CLUSTER_WIZARD_DRAFT_KEY = 'ataas.cluster-wizard.draft.v3';
const DEFAULT_MACHINE_PASSWORD = '';
const defaultTokenDraft: TokenAccessDraft = {
  apiServer: '',
  token: '',
};

const k8sVersionOptions = [
  { value: 'v1.32.2', label: 'v1.32.2' },
  { value: 'v1.32.0', label: 'v1.32.0' },
  { value: 'v1.31.4', label: 'v1.31.4（推荐）' },
  { value: 'v1.31.2', label: 'v1.31.2' },
  { value: 'v1.30.8', label: 'v1.30.8' },
  { value: 'v1.30.5', label: 'v1.30.5' },
  { value: 'v1.29.12', label: 'v1.29.12' },
];

const builtinPackages: CompatiblePackage[] = [
  {
    id: 'k8s-bundle-v1.31.4',
    name: 'Kubernetes 离线安装套件',
    version: 'v1.31.4',
    k8sVersions: ['v1.31.4', 'v1.31.x'],
    os: 'Ubuntu 22.04 / Rocky 9',
    arch: 'x86_64',
    size: '1.86 GB',
    checksum: '8b74…d1a9',
    status: 'available',
  },
  {
    id: 'k8s-bundle-v1.31.2',
    name: 'Kubernetes 离线安装套件',
    version: 'v1.31.2',
    k8sVersions: ['v1.31.2'],
    os: 'Ubuntu 22.04 / Rocky 9',
    arch: 'x86_64',
    size: '1.83 GB',
    checksum: '7d31…a82c',
    status: 'available',
  },
  {
    id: 'k8s-bundle-v1.30.8',
    name: 'Kubernetes 离线安装套件',
    version: 'v1.30.8',
    k8sVersions: ['v1.30.8', 'v1.30.x'],
    os: 'Ubuntu 22.04 / Rocky 9',
    arch: 'x86_64',
    size: '1.79 GB',
    checksum: '9e2c…71b4',
    status: 'available',
  },
  {
    id: 'k8s-bundle-v1.30.5',
    name: 'Kubernetes 离线安装套件',
    version: 'v1.30.5',
    k8sVersions: ['v1.30.5'],
    os: 'Ubuntu 22.04 / Rocky 9',
    arch: 'x86_64',
    size: '1.76 GB',
    checksum: '45aa…906e',
    status: 'available',
  },
];

const readStoredPackages = (): CompatiblePackage[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(PACKAGE_STORAGE_KEY) || '[]') as Array<{
      key?: string;
      name?: string;
      category?: string;
      currentVersion?: string;
      k8sVersions?: string[];
      os?: string;
      arch?: string;
      size?: string;
      checksum?: string;
      status?: 'available' | 'verifying' | 'deprecated';
      versions?: Array<{
        version: string;
        size: string;
        checksum: string;
        status: 'available' | 'verifying' | 'deprecated';
      }>;
    }>;
    return stored
      .filter((item) => item.category === 'kubernetes')
      .flatMap((item) => (item.versions || []).map((version) => ({
        id: `${item.key || item.name}-${version.version}`,
        name: item.name || 'Kubernetes 离线安装套件',
        version: version.version,
        k8sVersions: [version.version],
        os: item.os || 'Linux',
        arch: item.arch || 'x86_64',
        size: version.size,
        checksum: version.checksum,
        status: version.status === 'available' ? 'available' as const : 'verifying' as const,
      })));
  } catch {
    return [];
  }
};

const parseMachineIPs = (value: string) => (
  Array.from(new Set(
    value
      .split(/[\n,，;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  ))
);

const createMachineAccessKey = () => (
  `machine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
);

const createMachineAccessDraft = (overrides: Partial<MachineAccessDraft> = {}): MachineAccessDraft => ({
  key: overrides.key || createMachineAccessKey(),
  ip: overrides.ip || '',
  admin: overrides.admin || '',
  password: overrides.password ?? DEFAULT_MACHINE_PASSWORD,
  sshPort: overrides.sshPort,
  testStatus: overrides.testStatus || 'idle',
});

const createDefaultMachineAccessList = () => (
  [createMachineAccessDraft()]
);

const getConfiguredMachineAccessList = (items: MachineAccessDraft[]) => (
  items
    .map((item) => ({
      ...item,
      ip: item.ip.trim(),
      admin: item.admin.trim(),
    }))
    .filter((item) => item.ip)
);

const normalizeMachineAccessList = (draft: ClusterWizardDraft | null) => {
  if (draft?.machineAccessList?.length) {
    return draft.machineAccessList.map((item) => createMachineAccessDraft({
      ...item,
      testStatus: item.password ? item.testStatus || 'idle' : 'idle',
    }));
  }

  const legacyIPs = parseMachineIPs(draft?.machineIPs || '');
  if (!legacyIPs.length) return createDefaultMachineAccessList();

  return legacyIPs.map((ip) => createMachineAccessDraft({
    ip,
    admin: draft?.sshUser || 'root',
    sshPort: draft?.sshPort || 22,
    testStatus: draft?.machines?.some((machine) => machine.ip === ip) ? 'success' : 'idle',
  }));
};

const redactMachineAccessPasswords = (items: MachineAccessDraft[]) => (
  items.map((item) => ({
    ...item,
    password: '',
    testStatus: 'idle' as const,
  }))
);

const isValidIPv4 = (value: string) => {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => (
    /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
  ));
};

const isCompatiblePackage = (item: CompatiblePackage, targetVersion: string) => {
  const minorVersion = targetVersion.split('.').slice(0, 2).join('.');
  return item.status === 'available'
    && item.arch.includes('x86_64')
    && item.os.includes('Ubuntu 22.04')
    && (item.version === targetVersion || item.k8sVersions.some((version) => (
      version === targetVersion || version === `${minorVersion}.x`
    )));
};

const readClusterWizardDraft = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.sessionStorage.getItem(CLUSTER_WIZARD_DRAFT_KEY) || 'null') as ClusterWizardDraft | null;
  } catch {
    return null;
  }
};

const getProgressStage = (progress: number) => {
  if (progress < 16) return '创建部署任务';
  if (progress < 36) return 'SSH 下发软件包';
  if (progress < 56) return '安装 containerd 与 kubelet';
  if (progress < 74) return '初始化 Master 控制面';
  if (progress < 91) return 'Worker 加入集群';
  if (progress < 100) return '同步节点与硬件资源';
  return '集群创建完成';
};

const progressStages = [
  { threshold: 8, label: '创建部署任务' },
  { threshold: 22, label: 'SSH 下发软件包' },
  { threshold: 42, label: '安装 Kubernetes 组件' },
  { threshold: 62, label: '初始化 Master 控制面' },
  { threshold: 80, label: 'Worker 加入集群' },
  { threshold: 96, label: '同步节点与硬件资源' },
];

const BareMetalClusterWizard = ({
  open,
  dataCenters,
  initialDataCenterKey,
  onCancel,
  onOpenResourceCreator,
  onOpenPackageManager,
  onTaskCreated,
  onRunInBackground,
}: BareMetalClusterWizardProps) => {
  const [step, setStep] = useState(0);
  const [accessMode, setAccessMode] = useState<ClusterAccessMode>('ssh');
  const [clusterName, setClusterName] = useState('');
  const [dataCenterKey, setDataCenterKey] = useState('');
  const [tokenDraft, setTokenDraft] = useState<TokenAccessDraft>(defaultTokenDraft);
  const [machineAccessList, setMachineAccessList] = useState<MachineAccessDraft[]>(() => createDefaultMachineAccessList());
  const [machines, setMachines] = useState<MachineCandidate[]>([]);
  const [precheckRunId, setPrecheckRunId] = useState(0);
  const [k8sVersion, setK8sVersion] = useState('v1.31.4');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    const draft = readClusterWizardDraft();
    if (draft) {
      setStep(draft.step);
      setAccessMode(draft.accessMode || 'ssh');
      setClusterName(draft.clusterName);
      setDataCenterKey(draft.dataCenterKey);
      setTokenDraft(draft.tokenDraft || defaultTokenDraft);
      setMachineAccessList(normalizeMachineAccessList(draft));
      setMachines(draft.machines);
      setPrecheckRunId(0);
      setK8sVersion(draft.k8sVersion);
      setSelectedPackageId(draft.selectedPackageId);
      setTaskProgress(0);
      window.sessionStorage.removeItem(CLUSTER_WIZARD_DRAFT_KEY);
      return;
    }
    setStep(0);
    setAccessMode('ssh');
    setClusterName('');
    setDataCenterKey(initialDataCenterKey || '');
    setTokenDraft(defaultTokenDraft);
    setMachineAccessList(createDefaultMachineAccessList());
    setMachines([]);
    setPrecheckRunId(0);
    setK8sVersion('v1.31.4');
    setSelectedPackageId('');
    setTaskProgress(0);
  }, [open]);

  useEffect(() => {
    if (open && initialDataCenterKey && dataCenters.some((item) => item.key === initialDataCenterKey)) {
      setDataCenterKey(initialDataCenterKey);
    }
  }, [dataCenters, initialDataCenterKey, open]);

  useEffect(() => {
    if (!open || accessMode !== 'ssh' || step !== 2 || precheckRunId === 0) return undefined;
    const timers = machines.map((target, index) => window.setTimeout(() => {
      setMachines((current) => current.map((machine) => (
        machine.key === target.key ? { ...machine, status: 'ready' } : machine
      )));
    }, 650 + index * 420));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [accessMode, open, precheckRunId, step]);

  useEffect(() => {
    if (!open || accessMode !== 'ssh' || step !== 5) return undefined;
    const timer = window.setInterval(() => {
      setTaskProgress((current) => {
        if (current >= 100) return 100;
        const increment = current < 25 ? 5 : current < 75 ? 4 : 3;
        return Math.min(100, current + increment);
      });
    }, 620);
    return () => window.clearInterval(timer);
  }, [accessMode, open, step]);

  const packageCatalog = useMemo(() => {
    const catalog = new Map<string, CompatiblePackage>();
    builtinPackages.forEach((item) => catalog.set(`${item.version}-${item.arch}`, item));
    readStoredPackages().forEach((item) => catalog.set(`${item.version}-${item.arch}`, item));
    return Array.from(catalog.values());
  }, [open]);

  const matchedPackages = useMemo(() => {
    return packageCatalog.filter((item) => isCompatiblePackage(item, k8sVersion));
  }, [k8sVersion, packageCatalog]);

  useEffect(() => {
    if (!matchedPackages.some((item) => item.id === selectedPackageId)) {
      setSelectedPackageId(matchedPackages[0]?.id || '');
    }
  }, [matchedPackages, selectedPackageId]);

  const selectedPackage = matchedPackages.find((item) => item.id === selectedPackageId);
  const configuredMachineAccessList = getConfiguredMachineAccessList(machineAccessList);
  const configuredMachineCount = configuredMachineAccessList.length;
  const testedMachineCount = configuredMachineAccessList.filter((item) => item.testStatus === 'success').length;
  const connectionReady = configuredMachineCount > 0 && configuredMachineAccessList.every((item) => (
    item.admin && item.password && item.sshPort && item.testStatus === 'success'
  ));
  const precheckReady = machines.length > 0 && machines.every((item) => item.status === 'ready');
  const masterCount = machines.filter((item) => item.role === 'master').length;
  const workerCount = machines.filter((item) => item.role === 'worker').length;
  const tokenReady = Boolean(
    dataCenterKey
    && clusterName.trim()
    && /^https?:\/\/.+/i.test(tokenDraft.apiServer.trim())
    && tokenDraft.token.trim(),
  );

  const goNextFromAccessMode = () => {
    setStep(1);
  };

  const updateTokenDraft = (patch: Partial<TokenAccessDraft>) => {
    setTokenDraft((current) => ({ ...current, ...patch }));
  };

  const updateMachineAccess = (key: string, patch: Partial<Omit<MachineAccessDraft, 'key' | 'testStatus'>>) => {
    setMachineAccessList((current) => current.map((item) => (
      item.key === key ? { ...item, ...patch, testStatus: 'idle' } : item
    )));
  };

  const addMachineAccess = () => {
    setMachineAccessList((current) => [...current, createMachineAccessDraft()]);
  };

  const removeMachineAccess = (key: string) => {
    setMachineAccessList((current) => {
      const next = current.filter((item) => item.key !== key);
      return next.length ? next : [createMachineAccessDraft()];
    });
  };

  const setMachineConnectionStatus = (key: string, testStatus: MachineConnectionStatus) => {
    setMachineAccessList((current) => current.map((item) => (
      item.key === key ? { ...item, testStatus } : item
    )));
  };

  const completeMachineConnectionTest = (target: MachineAccessDraft) => {
    setMachineAccessList((current) => current.map((item) => {
      const unchanged = item.key === target.key
        && item.ip.trim() === target.ip.trim()
        && item.admin.trim() === target.admin.trim()
        && item.password === target.password
        && item.sshPort === target.sshPort;
      return unchanged ? { ...item, testStatus: 'success' } : item;
    }));
  };

  const validateMachineConnection = (target: MachineAccessDraft) => {
    if (!target.ip.trim()) {
      message.warning('请先填写机器 IP');
      return false;
    }
    if (!isValidIPv4(target.ip.trim())) {
      message.error(`IP 格式不正确：${target.ip}`);
      return false;
    }
    if (!target.admin.trim() || !target.password || !target.sshPort) {
      message.warning('请补充该机器的 admin、密码和端口');
      return false;
    }
    return true;
  };

  const testMachineConnection = (key: string) => {
    const target = machineAccessList.find((item) => item.key === key);
    if (!target || !validateMachineConnection(target)) return;
    setMachineConnectionStatus(key, 'testing');
    window.setTimeout(() => {
      completeMachineConnectionTest(target);
      message.success(`${target.ip.trim()} 连接测试通过`);
    }, 720);
  };

  const testAllMachineConnections = () => {
    const targets = getConfiguredMachineAccessList(machineAccessList);
    if (!targets.length) {
      message.warning('请至少填写一台机器 IP');
      return;
    }
    if (!targets.every(validateMachineConnection)) return;
    targets.forEach((target, index) => {
      setMachineConnectionStatus(target.key, 'testing');
      window.setTimeout(() => {
        completeMachineConnectionTest(target);
      }, 520 + index * 260);
    });
    window.setTimeout(() => {
      message.success(`${targets.length} 台机器连接测试通过`);
    }, 560 + Math.max(0, targets.length - 1) * 260);
  };

  const startPrecheck = () => {
    const targets = getConfiguredMachineAccessList(machineAccessList);
    if (!dataCenterKey) {
      message.warning('请选择所属数据中心');
      return;
    }
    if (!clusterName.trim()) {
      message.warning('请输入集群名称');
      return;
    }
    if (!targets.length) {
      message.warning('请至少填写一台机器 IP');
      return;
    }
    const invalidIPs = targets.map((item) => item.ip).filter((ip) => !isValidIPv4(ip));
    if (invalidIPs.length) {
      message.error(`IP 格式不正确：${invalidIPs.slice(0, 3).join('、')}`);
      return;
    }
    const duplicateIP = targets.find((item, index) => targets.findIndex((target) => target.ip === item.ip) !== index)?.ip;
    if (duplicateIP) {
      message.warning(`机器 IP 重复：${duplicateIP}`);
      return;
    }
    const missingLogin = targets.find((item) => !item.admin || !item.password || !item.sshPort);
    if (missingLogin) {
      message.warning(`请补充 ${missingLogin.ip} 的 admin、密码和端口`);
      return;
    }
    const untested = targets.find((item) => item.testStatus !== 'success');
    if (untested) {
      message.warning(`请先完成 ${untested.ip} 的连接测试`);
      return;
    }
    setMachines(targets.map((target, index) => ({
      key: target.key,
      ip: target.ip,
      admin: target.admin,
      sshPort: target.sshPort || 22,
      hostname: `gpu-node-${String(index + 1).padStart(2, '0')}`,
      os: 'Ubuntu 22.04.4',
      arch: 'x86_64',
      cpu: '128 Core',
      memory: '512 GB',
      disk: index === 0 ? '3.8 TB' : '7.6 TB',
      role: index === 0 ? 'master' : 'worker',
      status: 'checking',
    })));
    setStep(2);
    setPrecheckRunId((current) => current + 1);
  };

  const rerunPrecheck = () => {
    setMachines((current) => current.map((item) => ({ ...item, status: 'checking' })));
    setPrecheckRunId((current) => current + 1);
  };

  const continueFromRoles = () => {
    if (masterCount < 1) {
      message.warning('请至少分配一台 Master 节点');
      return;
    }
    setStep(4);
  };

  const createCluster = () => {
    if (!selectedPackage) {
      message.warning('请选择匹配的软件包');
      return;
    }
    setTaskProgress(8);
    setStep(5);
    onTaskCreated?.({
      accessMode: 'ssh',
      clusterName: clusterName.trim(),
      dataCenterKey,
      machineCount: machines.length,
      masterCount,
      workerCount,
      k8sVersion,
      packageName: `${selectedPackage.name} ${selectedPackage.version}`,
    });
  };

  const createTokenCluster = () => {
    if (!dataCenterKey) {
      message.warning('请选择所属数据中心');
      return;
    }
    if (!clusterName.trim()) {
      message.warning('请输入集群名称');
      return;
    }
    if (!/^https?:\/\/.+/i.test(tokenDraft.apiServer.trim())) {
      message.warning('请输入有效的 API Server 地址');
      return;
    }
    if (!tokenDraft.token.trim()) {
      message.warning('请输入接入 Token');
      return;
    }
    setTaskProgress(100);
    setStep(2);
    onTaskCreated?.({
      accessMode: 'token',
      clusterName: clusterName.trim(),
      dataCenterKey,
      machineCount: 0,
      masterCount: 0,
      workerCount: 0,
      k8sVersion: '已存在',
      packageName: 'Token 接入',
    });
  };

  const openPackageManager = () => {
    onOpenPackageManager({
      k8sVersion,
      os: 'Ubuntu 22.04',
      arch: 'x86_64',
    }, {
      accessMode,
      step: 4,
      clusterName,
      dataCenterKey,
      tokenDraft,
      machineAccessList: redactMachineAccessPasswords(machineAccessList),
      machineIPs: configuredMachineAccessList.map((item) => item.ip).join('\n'),
      sshPort: configuredMachineAccessList[0]?.sshPort,
      sshUser: configuredMachineAccessList[0]?.admin || 'root',
      credential: 'per-machine-password',
      machines,
      k8sVersion,
      selectedPackageId,
    });
  };

  const precheckColumns: ColumnsType<MachineCandidate> = [
    {
      title: '机器',
      key: 'machine',
      width: 200,
      render: (_, item) => (
        <div className="cluster-wizard-machine">
          <strong>{item.hostname}</strong>
          <small>{item.admin}@{item.ip}:{item.sshPort}</small>
        </div>
      ),
    },
    {
      title: '环境',
      key: 'environment',
      width: 188,
      render: (_, item) => (
        <div className="cluster-wizard-machine">
          <span>{item.os}</span>
          <small>{item.arch}</small>
        </div>
      ),
    },
    {
      title: '资源',
      key: 'resource',
      width: 210,
      render: (_, item) => <span className="cluster-wizard-resource">{item.cpu} · {item.memory} · {item.disk}</span>,
    },
    {
      title: '检查项',
      key: 'checks',
      width: 252,
      render: (_, item) => (
        <div className="cluster-wizard-check-tags">
          {['SSH', 'sudo', '磁盘', '端口'].map((label) => (
            <Tag key={label} className={item.status === 'ready' ? 'ready' : ''}>
              {item.status === 'ready' && <CheckCircleFilled />} {label}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 112,
      render: (status: PrecheckStatus) => (
        <span className={`cluster-wizard-status ${status}`}>
          {status === 'checking' ? <LoadingOutlined spin /> : status === 'ready' ? <CheckCircleFilled /> : <WarningOutlined />}
          {status === 'checking' ? '检查中' : status === 'ready' ? '已就绪' : '未通过'}
        </span>
      ),
    },
  ];

  const roleColumns: ColumnsType<MachineCandidate> = [
    {
      title: '机器',
      key: 'machine',
      width: 230,
      render: (_, item) => (
        <div className="cluster-wizard-machine">
          <strong>{item.hostname}</strong>
          <small>{item.admin}@{item.ip}:{item.sshPort}</small>
        </div>
      ),
    },
    {
      title: '系统与资源',
      key: 'resource',
      render: (_, item) => (
        <div className="cluster-wizard-machine">
          <span>{item.os} · {item.arch}</span>
          <small>{item.cpu} · {item.memory} · {item.disk}</small>
        </div>
      ),
    },
    {
      title: '选择 Master',
      key: 'role',
      width: 190,
      render: (_, item) => (
        <div className="cluster-wizard-master-choice">
          <Checkbox
            checked={item.role === 'master'}
            onChange={(event) => setMachines((current) => current.map((machine) => (
              machine.key === item.key
                ? { ...machine, role: event.target.checked ? 'master' : 'worker' }
                : machine
            )))}
          >
            设为 Master
          </Checkbox>
          <small>{item.role === 'master' ? 'Control Plane' : '自动作为 Worker'}</small>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 112,
      render: () => <span className="cluster-wizard-status ready"><CheckCircleFilled /> 已就绪</span>,
    },
  ];

  const renderConnectionTestIcon = (status: MachineConnectionStatus) => {
    if (status === 'testing') return <LoadingOutlined spin />;
    if (status === 'success') return <CheckCircleFilled />;
    if (status === 'failed') return <WarningOutlined />;
    return <SafetyCertificateOutlined />;
  };

  const renderAccessModeStep = () => (
    <div className="cluster-wizard-access-step">
      <button
        type="button"
        className={`cluster-wizard-access-card${accessMode === 'ssh' ? ' active' : ''}`}
        onClick={() => setAccessMode('ssh')}
      >
        <span><CloudServerOutlined /></span>
        <strong>IP + SSH 接入</strong>
        <small>逐台填写机器 IP、admin、密码和端口，先连接测试，再 Precheck、分配角色并部署 Kubernetes。</small>
      </button>
      <button
        type="button"
        className={`cluster-wizard-access-card${accessMode === 'token' ? ' active' : ''}`}
        onClick={() => setAccessMode('token')}
      >
        <span><SafetyCertificateOutlined /></span>
        <strong>Token 接入</strong>
        <small>兼容旧版接入流程，填写 API Server 和 ServiceAccount Token 后建立访问配置，不执行 SSH 裸机部署检查。</small>
      </button>
    </div>
  );

  const renderTokenStep = () => (
    <div className="cluster-wizard-token-step">
      <section className="cluster-wizard-token-form-panel">
        <h3><SafetyCertificateOutlined /> Token 接入信息</h3>
        <div className="cluster-wizard-label-row">
          <label>所属数据中心</label>
          <span>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => onOpenResourceCreator?.('supplier')}>新增供应商</Button>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => onOpenResourceCreator?.('dataCenter')}>新增数据中心</Button>
          </span>
        </div>
        <Select
          className="cluster-wizard-main-control"
          popupClassName="cluster-wizard-main-control-popup"
          value={dataCenterKey}
          onChange={setDataCenterKey}
          placeholder="请选择数据中心"
          options={dataCenters.map((item) => ({
            value: item.key,
            label: `${item.name} · ${item.supplier}`,
          }))}
        />
        <label>集群名称</label>
        <Input
          className="cluster-wizard-main-control"
          value={clusterName}
          onChange={(event) => setClusterName(event.target.value)}
          placeholder="例如：gpu-prod-02"
        />
        <label>API Server</label>
        <Input
          className="cluster-wizard-main-control"
          value={tokenDraft.apiServer}
          onChange={(event) => updateTokenDraft({ apiServer: event.target.value })}
          placeholder="例如：https://10.24.16.31:6443"
        />
        <label>ServiceAccount Token</label>
        <Input.TextArea
          className="cluster-wizard-token-textarea"
          rows={4}
          value={tokenDraft.token}
          onChange={(event) => updateTokenDraft({ token: event.target.value })}
          placeholder="粘贴 Kubernetes Bearer Token"
        />
      </section>
      <section className="cluster-wizard-token-guide-panel">
        <h3><SafetyCertificateOutlined /> 接入说明</h3>
        <p>Token 是兼容旧版本的接入方式，平台会使用 API Server 和 Token 建立访问配置。</p>
        <ul className="cluster-wizard-token-guide-list">
          <li><strong>不执行部署流程</strong><span>跳过 SSH 连通性、裸机 Precheck、角色分配和软件包部署。</span></li>
          <li><strong>保留旧链路</strong><span>用于仍依赖 Token 接入的历史集群或迁移场景。</span></li>
          <li><strong>控制 Token 权限</strong><span>建议只授予资源读取与必要运维动作，后续可在凭据管理中轮换。</span></li>
        </ul>
      </section>
    </div>
  );

  const renderMachineStep = () => (
    <div className="cluster-wizard-machine-step">
      <section className="cluster-wizard-machine-form-panel">
        <h3><CloudServerOutlined /> 集群与机器</h3>
        <div className="cluster-wizard-label-row">
          <label>所属数据中心</label>
          <span>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => onOpenResourceCreator?.('supplier')}>新增供应商</Button>
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => onOpenResourceCreator?.('dataCenter')}>新增数据中心</Button>
          </span>
        </div>
        <Select
          className="cluster-wizard-main-control"
          popupClassName="cluster-wizard-main-control-popup"
          value={dataCenterKey}
          onChange={setDataCenterKey}
          placeholder="请选择数据中心"
          options={dataCenters.map((item) => ({
            value: item.key,
            label: `${item.name} · ${item.supplier}`,
          }))}
        />
        {!dataCenters.length && (
          <div className="cluster-wizard-resource-empty">还没有可用数据中心，请先新增供应商和数据中心。</div>
        )}
        <label>集群名称</label>
        <Input
          className="cluster-wizard-main-control"
          value={clusterName}
          onChange={(event) => setClusterName(event.target.value)}
          placeholder="例如：gpu-prod-02"
        />
        <div className="cluster-wizard-machine-list-head">
          <label>机器连接 <em>每台机器单独填写并测试</em></label>
          <Button type="link" size="small" icon={<PlusOutlined />} onClick={addMachineAccess}>新增机器</Button>
        </div>
        <div className="cluster-wizard-machine-access-list">
          <div className="cluster-wizard-machine-access-header">
            <span>机器 IP</span>
            <span>Admin</span>
            <span>密码</span>
            <span>端口</span>
            <span>连接</span>
            <span />
          </div>
          {machineAccessList.map((machine, index) => (
            <div key={machine.key} className={`cluster-wizard-machine-access-row ${machine.testStatus}`}>
              <span className="cluster-wizard-machine-access-field ip" title={`机器 ${index + 1}`}>
                <Input
                  value={machine.ip}
                  onChange={(event) => updateMachineAccess(machine.key, { ip: event.target.value })}
                  placeholder="10.24.16.31"
                />
              </span>
              <span className="cluster-wizard-machine-access-field admin">
                <Input
                  value={machine.admin}
                  onChange={(event) => updateMachineAccess(machine.key, { admin: event.target.value })}
                  placeholder="root"
                />
              </span>
              <span className="cluster-wizard-machine-access-field password">
                <Input.Password
                  value={machine.password}
                  onChange={(event) => updateMachineAccess(machine.key, { password: event.target.value })}
                  placeholder="请输入"
                />
              </span>
              <span className="cluster-wizard-machine-access-field port">
                <InputNumber
                  min={1}
                  max={65535}
                  value={machine.sshPort}
                  onChange={(value) => updateMachineAccess(machine.key, { sshPort: value ?? undefined })}
                  placeholder="22"
                />
              </span>
              <Button
                size="small"
                className={`cluster-wizard-machine-test-button ${machine.testStatus}`}
                icon={renderConnectionTestIcon(machine.testStatus)}
                onClick={() => testMachineConnection(machine.key)}
              >
                {machine.testStatus === 'success' ? '已通过' : machine.testStatus === 'testing' ? '测试中' : '测试'}
              </Button>
              <Button
                size="small"
                type="text"
                className="cluster-wizard-machine-remove-button"
                icon={<DeleteOutlined />}
                title="移除机器"
                onClick={() => removeMachineAccess(machine.key)}
              />
            </div>
          ))}
        </div>
        <small className="cluster-wizard-input-note">
          已填写 {configuredMachineCount} 台机器，{testedMachineCount} 台已通过连接测试；全部通过后进入 Precheck。
        </small>
      </section>
      <section>
        <h3><SafetyCertificateOutlined /> 连接测试</h3>
        <div className="cluster-wizard-connection-stats">
          <span>
            <strong>{configuredMachineCount}</strong>
            <small>已填写机器</small>
          </span>
          <span className={connectionReady ? 'ready' : ''}>
            <strong>{testedMachineCount}</strong>
            <small>连接通过</small>
          </span>
        </div>
        <Button type="primary" ghost block icon={<SafetyCertificateOutlined />} onClick={testAllMachineConnections}>
          全部连接测试
        </Button>
        <div className="cluster-wizard-precheck-note">
          <SafetyCertificateOutlined />
          <span>
            <strong>SSH 凭据已合并到机器信息</strong>
            <small>每台机器使用自己的 admin 和密码连接，不再需要选择统一的 SSH 凭据。</small>
          </span>
        </div>
        <div className="cluster-wizard-precheck-note muted">
          <SafetyCertificateOutlined />
          <span>
            <strong>逐机 Precheck</strong>
            <small>下一步将检查 SSH 连通性、sudo 权限、CPU/内存、磁盘空间、系统架构以及 6443/10250 端口。</small>
          </span>
        </div>
      </section>
    </div>
  );

  const renderPrecheckStep = () => (
    <div className="cluster-wizard-table-step">
      <header>
        <div>
          <h3>机器 Precheck</h3>
          <p>所有机器通过检查后才能分配集群角色。</p>
        </div>
        <span className="cluster-wizard-ready-summary">
          <CheckCircleFilled />
          {machines.filter((item) => item.status === 'ready').length} / {machines.length} 台就绪
        </span>
      </header>
      <Table
        rowKey="key"
        size="small"
        columns={precheckColumns}
        dataSource={machines}
        pagination={false}
        scroll={{ x: 962 }}
      />
    </div>
  );

  const renderRoleStep = () => (
    <div className="cluster-wizard-table-step">
      <header>
        <div>
          <h3>分配 Master 与 Worker</h3>
          <p>只需勾选 Master 节点，其余机器会自动作为 Worker；生产集群建议选择 3 台 Master。</p>
        </div>
        <div className="cluster-wizard-role-summary">
          <Tag color="purple">Master {masterCount}</Tag>
          <Tag color="blue">Worker {workerCount}</Tag>
        </div>
      </header>
      <Table
        rowKey="key"
        size="small"
        columns={roleColumns}
        dataSource={machines}
        pagination={false}
      />
    </div>
  );

  const renderPackageStep = () => (
    <div className="cluster-wizard-package-step">
      <section className="cluster-wizard-environment">
        <div>
          <span><DesktopOutlined /></span>
          <div>
            <strong>已检测机器环境</strong>
            <small>{machines.length} 台机器 · Ubuntu 22.04 · x86_64 · containerd</small>
          </div>
        </div>
        <label>
          目标 Kubernetes 版本
          <Select
            value={k8sVersion}
            onChange={setK8sVersion}
            options={k8sVersionOptions}
          />
        </label>
      </section>

      <div className="cluster-wizard-package-list">
        <header>
          <div>
            <h3>软件包下发</h3>
            <p>仅展示与 Kubernetes 版本、操作系统和架构匹配，且校验通过的软件包。</p>
          </div>
          <Tag>{matchedPackages.length} 个匹配</Tag>
        </header>
        <div className="cluster-wizard-version-options">
          {k8sVersionOptions.map((option) => {
            const availableCount = packageCatalog.filter((item) => isCompatiblePackage(item, option.value)).length;
            return (
              <button
                type="button"
                key={option.value}
                className={k8sVersion === option.value ? 'active' : ''}
                onClick={() => setK8sVersion(option.value)}
              >
                <strong>{option.value}</strong>
                <small>{availableCount ? `${availableCount} 个可用` : '待上传'}</small>
              </button>
            );
          })}
        </div>
        {matchedPackages.length ? (
          matchedPackages.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`cluster-wizard-package-card${selectedPackageId === item.id ? ' active' : ''}`}
              onClick={() => setSelectedPackageId(item.id)}
            >
              <span className="cluster-wizard-package-icon"><FileZipOutlined /></span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.os} · {item.arch} · {item.size}</small>
              </span>
              <span>
                <b>{item.version}</b>
                <small>SHA256 {item.checksum}</small>
              </span>
              <CheckCircleFilled />
            </button>
          ))
        ) : (
          <div className="cluster-wizard-package-empty">
            <FileZipOutlined />
            <strong>没有匹配 {k8sVersion} 的可用软件包</strong>
            <p>当前环境为 Ubuntu 22.04 / x86_64。请先上传并完成软件包校验，再返回创建集群。</p>
            <Button type="primary" icon={<SendOutlined />} onClick={openPackageManager}>去软件包管理上传</Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderProgressStep = () => {
    const finished = taskProgress >= 100;
    if (accessMode === 'token') {
      return (
        <div className="cluster-wizard-progress-step">
          <section className="cluster-wizard-progress-hero finished">
            <span><CheckCircleFilled /></span>
            <div>
              <strong>Kubernetes 集群接入完成</strong>
              <small>{clusterName} · Token 接入 · {tokenDraft.apiServer.trim()}</small>
            </div>
            <b>100%</b>
            <Progress percent={100} showInfo={false} status="success" />
          </section>
          <section className="cluster-wizard-token-complete-card">
            <SafetyCertificateOutlined />
            <span>
              <strong>已跳过裸机部署检查</strong>
              <small>Token 接入不会执行 SSH Precheck、Master/Worker 分配或软件包下发，集群已接入平台管理。</small>
            </span>
          </section>
        </div>
      );
    }
    return (
      <div className="cluster-wizard-progress-step">
        <section className={`cluster-wizard-progress-hero${finished ? ' finished' : ''}`}>
          <span>{finished ? <CheckCircleFilled /> : <LoadingOutlined spin />}</span>
          <div>
            <strong>{finished ? 'Kubernetes 集群创建完成' : getProgressStage(taskProgress)}</strong>
            <small>{clusterName} · {machines.length} 台机器 · {k8sVersion}</small>
          </div>
          <b>{taskProgress}%</b>
          <Progress percent={taskProgress} showInfo={false} status={finished ? 'success' : 'active'} />
        </section>

        <div className="cluster-wizard-progress-layout">
          <section className="cluster-wizard-stage-list">
            <h3>执行阶段</h3>
            {progressStages.map((stageItem, index) => {
              const nextThreshold = progressStages[index + 1]?.threshold || 101;
              const completed = taskProgress >= nextThreshold || finished;
              const active = taskProgress >= stageItem.threshold && taskProgress < nextThreshold;
              return (
                <div key={stageItem.label} className={completed ? 'completed' : active ? 'active' : ''}>
                  <i>{completed ? <CheckCircleFilled /> : active ? <LoadingOutlined spin /> : index + 1}</i>
                  <span>{stageItem.label}</span>
                  <em>{completed ? '完成' : active ? '执行中' : '等待'}</em>
                </div>
              );
            })}
          </section>
          <section className="cluster-wizard-node-progress">
            <h3>节点进度</h3>
            {machines.map((machine, index) => {
              const nodeProgress = finished
                ? 100
                : Math.max(0, Math.min(100, taskProgress - index * 4 + (machine.role === 'master' ? 4 : 0)));
              return (
                <div key={machine.key}>
                  <span className={`cluster-wizard-node-role ${machine.role}`}>{machine.role === 'master' ? 'M' : 'W'}</span>
                  <span>
                    <strong>{machine.hostname}</strong>
                    <small>{machine.ip} · {machine.role === 'master' ? 'Master' : 'Worker'}</small>
                  </span>
                  <Progress percent={nodeProgress} showInfo={false} size="small" status={nodeProgress >= 100 ? 'success' : 'active'} />
                  <em>{nodeProgress >= 100 ? '已就绪' : `${nodeProgress}%`}</em>
                </div>
              );
            })}
          </section>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (step === 0) {
      return (
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={goNextFromAccessMode}>下一步：填写连接信息</Button>
        </Space>
      );
    }
    if (accessMode === 'token') {
      if (step === 1) {
        return (
          <div className="cluster-wizard-footer">
            <Button onClick={() => setStep(0)}>上一步</Button>
            <span />
            <Button type="primary" icon={<SafetyCertificateOutlined />} disabled={!tokenReady} onClick={createTokenCluster}>完成接入</Button>
          </div>
        );
      }
      return (
        <div className="cluster-wizard-footer">
          <small className="cluster-wizard-background-note">集群已通过 Token 接入，可在集群列表中查看资源。</small>
          <span />
          <Button type="primary" onClick={onCancel}>完成</Button>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(0)}>上一步</Button>
          <span />
          <Button type="primary" icon={<SafetyCertificateOutlined />} disabled={!connectionReady} onClick={startPrecheck}>开始 Precheck</Button>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(1)}>上一步</Button>
          <span />
          <Button icon={<ReloadOutlined />} onClick={rerunPrecheck}>重新检测</Button>
          <Button type="primary" disabled={!precheckReady} onClick={() => setStep(3)}>下一步：分配角色</Button>
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(2)}>上一步</Button>
          <span />
          <Button type="primary" onClick={continueFromRoles}>下一步：软件包下发</Button>
        </div>
      );
    }
    if (step === 4) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(3)}>上一步</Button>
          <span />
          <Button type="primary" icon={<CloudServerOutlined />} disabled={!selectedPackage} onClick={createCluster}>创建集群</Button>
        </div>
      );
    }
    return (
      <div className="cluster-wizard-footer">
        <small className="cluster-wizard-background-note">
          {taskProgress >= 100
            ? '执行日志已保留在算力中心「任务」中'
            : '转入后台后，可在算力中心「任务」中查看进度与日志'}
        </small>
        <span />
        <Button
          type={taskProgress >= 100 ? 'primary' : 'default'}
          onClick={taskProgress >= 100 ? onCancel : (onRunInBackground || onCancel)}
        >
          {taskProgress >= 100 ? '完成' : '后台运行'}
        </Button>
      </div>
    );
  };

  const stepItems = accessMode === 'token'
    ? [
        { title: '接入方式' },
        { title: 'Token 信息' },
        { title: '接入完成' },
      ]
    : [
        { title: '接入方式' },
        { title: '机器信息' },
        { title: 'Precheck' },
        { title: '角色分配' },
        { title: '软件包下发' },
        { title: '创建进度' },
      ];

  return (
    <Modal
      rootClassName="bare-metal-cluster-wizard-modal"
      title={(
        <div className="cluster-wizard-title">
          <ClusterOutlined />
          <span>
            <strong>创建 / 接入 Kubernetes 集群</strong>
            <small>选择 SSH 裸机部署或兼容 Token 接入</small>
          </span>
        </div>
      )}
      open={open}
      width={1080}
      mask={{ closable: false }}
      onCancel={onCancel}
      footer={renderFooter()}
    >
      <Steps
        className="cluster-wizard-steps"
        current={step}
        items={stepItems}
      />
      <div className="cluster-wizard-content">
        {step === 0 && renderAccessModeStep()}
        {accessMode === 'token' && step === 1 && renderTokenStep()}
        {accessMode === 'token' && step === 2 && renderProgressStep()}
        {accessMode === 'ssh' && step === 1 && renderMachineStep()}
        {accessMode === 'ssh' && step === 2 && renderPrecheckStep()}
        {accessMode === 'ssh' && step === 3 && renderRoleStep()}
        {accessMode === 'ssh' && step === 4 && renderPackageStep()}
        {accessMode === 'ssh' && step === 5 && renderProgressStep()}
      </div>
    </Modal>
  );
};

export default BareMetalClusterWizard;
