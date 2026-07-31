import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloudDownloadOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DownloadOutlined,
  FileZipOutlined,
  InboxOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Steps,
  Table,
  Tabs,
  Tag,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import './softwarePackagePage.less';

type PackageStatus = 'available' | 'verifying' | 'deprecated';
type TaskStatus = 'running' | 'completed' | 'failed';

type PackageVersion = {
  version: string;
  releasedAt: string;
  size: string;
  checksum: string;
  status: PackageStatus;
};

type SoftwarePackage = {
  key: string;
  name: string;
  description: string;
  category: 'kubernetes' | 'runtime' | 'network' | 'gpu' | 'tool';
  currentVersion: string;
  k8sVersions: string[];
  os: string;
  arch: string;
  size: string;
  checksum: string;
  updatedAt: string;
  status: PackageStatus;
  versions: PackageVersion[];
};

type PackageVersionOption = {
  packageRecord: SoftwarePackage;
  versionRecord: PackageVersion;
};

type PackageVersionRow = PackageVersionOption & {
  key: string;
  category: SoftwarePackage['category'];
  isCurrent: boolean;
};

type DistributionTask = {
  key: string;
  name: string;
  packageName: string;
  version: string;
  targets: string;
  stage: string;
  progress: number;
  status: TaskStatus;
  createdAt: string;
};

type DistributionMachine = {
  key: string;
  ip: string;
  status: 'checking' | 'ready';
};

type UploadPackageValues = {
  name: string;
  category: SoftwarePackage['category'];
  version: string;
  k8sVersions: string[];
  os: string;
  arch: string;
  checksum?: string;
};

const initialPackages: SoftwarePackage[] = [
  {
    key: 'k8s-bundle',
    name: 'Kubernetes 离线安装套件',
    description: '包含 kubeadm、kubelet、kubectl、containerd 与 CNI，适用于新机器初始化',
    category: 'kubernetes',
    currentVersion: 'v1.31.4',
    k8sVersions: ['v1.31.4'],
    os: 'Ubuntu 22.04 / Rocky 9',
    arch: 'x86_64',
    size: '1.86 GB',
    checksum: '8b74…d1a9',
    updatedAt: '2026-07-26 14:32',
    status: 'available',
    versions: [
      { version: 'v1.31.4', releasedAt: '2026-07-26 14:32', size: '1.86 GB', checksum: '8b74…d1a9', status: 'available' },
      { version: 'v1.30.8', releasedAt: '2026-06-18 10:21', size: '1.79 GB', checksum: '9e2c…71b4', status: 'available' },
      { version: 'v1.29.12', releasedAt: '2026-04-09 18:06', size: '1.72 GB', checksum: '30ca…f80d', status: 'deprecated' },
    ],
  },
  {
    key: 'containerd',
    name: 'containerd',
    description: 'Kubernetes 节点容器运行时',
    category: 'runtime',
    currentVersion: '1.7.24',
    k8sVersions: ['v1.29.x', 'v1.30.x', 'v1.31.x'],
    os: 'Linux',
    arch: 'x86_64 / arm64',
    size: '96.4 MB',
    checksum: 'bf19…68ce',
    updatedAt: '2026-07-22 09:18',
    status: 'available',
    versions: [
      { version: '1.7.24', releasedAt: '2026-07-22 09:18', size: '96.4 MB', checksum: 'bf19…68ce', status: 'available' },
      { version: '1.7.22', releasedAt: '2026-05-11 13:42', size: '95.8 MB', checksum: 'a628…f67a', status: 'available' },
    ],
  },
  {
    key: 'cni-plugins',
    name: 'CNI Plugins',
    description: 'bridge、host-local、loopback 等基础网络插件',
    category: 'network',
    currentVersion: 'v1.6.2',
    k8sVersions: ['v1.29.x', 'v1.30.x', 'v1.31.x'],
    os: 'Linux',
    arch: 'x86_64 / arm64',
    size: '48.2 MB',
    checksum: 'c691…03d8',
    updatedAt: '2026-07-18 16:44',
    status: 'available',
    versions: [
      { version: 'v1.6.2', releasedAt: '2026-07-18 16:44', size: '48.2 MB', checksum: 'c691…03d8', status: 'available' },
      { version: 'v1.5.1', releasedAt: '2026-03-28 11:08', size: '46.9 MB', checksum: '105e…f82b', status: 'available' },
    ],
  },
  {
    key: 'calico',
    name: 'Calico',
    description: 'Kubernetes 集群网络与 NetworkPolicy 组件',
    category: 'network',
    currentVersion: 'v3.29.2',
    k8sVersions: ['v1.30.x', 'v1.31.x'],
    os: 'Linux',
    arch: 'x86_64',
    size: '612 MB',
    checksum: '4d23…0a7f',
    updatedAt: '2026-07-15 11:20',
    status: 'available',
    versions: [
      { version: 'v3.29.2', releasedAt: '2026-07-15 11:20', size: '612 MB', checksum: '4d23…0a7f', status: 'available' },
      { version: 'v3.28.3', releasedAt: '2026-03-12 17:32', size: '594 MB', checksum: 'b80e…ba15', status: 'deprecated' },
    ],
  },
  {
    key: 'nvidia-toolkit',
    name: 'NVIDIA Container Toolkit',
    description: '为容器工作负载提供 NVIDIA GPU 运行环境',
    category: 'gpu',
    currentVersion: '1.17.8',
    k8sVersions: ['v1.30.x', 'v1.31.x'],
    os: 'Ubuntu 22.04',
    arch: 'x86_64',
    size: '128 MB',
    checksum: 'fa03…2c91',
    updatedAt: '2026-07-08 15:36',
    status: 'available',
    versions: [
      { version: '1.17.8', releasedAt: '2026-07-08 15:36', size: '128 MB', checksum: 'fa03…2c91', status: 'available' },
      { version: '1.17.5', releasedAt: '2026-04-16 08:45', size: '126 MB', checksum: '754d…a632', status: 'available' },
    ],
  },
  {
    key: 'helm',
    name: 'Helm',
    description: 'Kubernetes 应用包管理工具',
    category: 'tool',
    currentVersion: 'v3.17.3',
    k8sVersions: ['通用'],
    os: 'Linux',
    arch: 'x86_64 / arm64',
    size: '32.6 MB',
    checksum: 'ea98…c540',
    updatedAt: '2026-06-30 19:12',
    status: 'verifying',
    versions: [
      { version: 'v3.17.3', releasedAt: '2026-06-30 19:12', size: '32.6 MB', checksum: 'ea98…c540', status: 'verifying' },
      { version: 'v3.16.4', releasedAt: '2026-02-23 10:17', size: '31.9 MB', checksum: '27d6…f443', status: 'available' },
    ],
  },
];

const PACKAGE_STORAGE_KEY = 'ataas.software-packages.catalog.v1';
const CLUSTER_WIZARD_RESUME_KEY = 'ataas.cluster-wizard.resume';

const loadPackageRecords = () => {
  if (typeof window === 'undefined') return initialPackages;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PACKAGE_STORAGE_KEY) || '[]') as SoftwarePackage[];
    return stored.length ? stored : initialPackages;
  } catch {
    return initialPackages;
  }
};

const initialTasks: DistributionTask[] = [
  {
    key: 'PKG-20260730-0021',
    name: '上海新节点初始化',
    packageName: 'Kubernetes 离线安装套件',
    version: 'v1.31.4',
    targets: '10.24.16.31 等 3 台',
    stage: '安装 kubelet',
    progress: 68,
    status: 'running',
    createdAt: '2026-07-30 10:24',
  },
  {
    key: 'PKG-20260729-0018',
    name: '郑州 GPU 节点扩容',
    packageName: 'NVIDIA Container Toolkit',
    version: '1.17.8',
    targets: '10.28.16.88 等 8 台',
    stage: '下发完成',
    progress: 100,
    status: 'completed',
    createdAt: '2026-07-29 18:06',
  },
];

const categoryLabels: Record<SoftwarePackage['category'], string> = {
  kubernetes: 'K8s 套件',
  runtime: '容器运行时',
  network: '网络组件',
  gpu: 'GPU 组件',
  tool: '运维工具',
};

const statusLabels: Record<PackageStatus, string> = {
  available: '可用',
  verifying: '验证中',
  deprecated: '已停用',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  running: '执行中',
  completed: '已完成',
  failed: '失败',
};

const parseTargetIPs = (value: string) => (
  Array.from(new Set(
    value
      .split(/[\n,，;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  ))
);

const isValidIPv4 = (value: string) => {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => (
    /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
  ));
};

const getDistributionStage = (progress: number, installK8s: boolean) => {
  if (progress < 30) return '传输软件包';
  if (progress < 52) return '校验并解压';
  if (progress < 84) return installK8s ? '安装 Kubernetes 组件' : '执行软件包安装';
  if (progress < 100) return '安装后健康检查';
  return '下发安装完成';
};

const SoftwarePackagePage = () => {
  const [packageRecords, setPackageRecords] = useState<SoftwarePackage[]>(loadPackageRecords);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState('packages');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [architecture, setArchitecture] = useState('all');
  const [k8sVersion, setK8sVersion] = useState('all');
  const [versionTarget, setVersionTarget] = useState<SoftwarePackage | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [distributionStep, setDistributionStep] = useState(0);
  const [distributionCategory, setDistributionCategory] = useState<SoftwarePackage['category']>('kubernetes');
  const [distributionPackageId, setDistributionPackageId] = useState('k8s-bundle');
  const [distributionVersion, setDistributionVersion] = useState('v1.31.4');
  const [distributionTargets, setDistributionTargets] = useState('10.24.16.31\n10.24.16.32\n10.24.16.33');
  const [sshPort, setSshPort] = useState(22);
  const [sshUser, setSshUser] = useState('root');
  const [credential, setCredential] = useState('sh-new-node-root');
  const [installK8s, setInstallK8s] = useState(true);
  const [initControlPlane, setInitControlPlane] = useState(false);
  const [distributionMachines, setDistributionMachines] = useState<DistributionMachine[]>([]);
  const [distributionPrecheckRunId, setDistributionPrecheckRunId] = useState(0);
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [distributionTaskKey, setDistributionTaskKey] = useState('');
  const [clusterReturnContext, setClusterReturnContext] = useState<{
    k8sVersion: string;
    os: string;
    arch: string;
  } | null>(null);
  const [clusterReturnReady, setClusterReturnReady] = useState(false);
  const [clusterReturnValidating, setClusterReturnValidating] = useState(false);
  const [uploadForm] = Form.useForm<UploadPackageValues>();

  useEffect(() => {
    window.localStorage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(packageRecords));
  }, [packageRecords]);

  useEffect(() => {
    const rawRequest = window.sessionStorage.getItem('ataas.software-package.upload-request');
    if (!rawRequest) return;
    try {
      const request = JSON.parse(rawRequest) as { k8sVersion: string; os: string; arch: string };
      uploadForm.setFieldsValue({
        name: 'Kubernetes 离线安装套件',
        category: 'kubernetes',
        version: request.k8sVersion,
        k8sVersions: [request.k8sVersion],
        os: request.os,
        arch: request.arch,
      });
      setClusterReturnContext(request);
      setClusterReturnReady(false);
      setClusterReturnValidating(false);
      setUploadOpen(true);
      message.info(`请上传适配 ${request.k8sVersion} / ${request.arch} 的 Kubernetes 软件包`);
    } finally {
      window.sessionStorage.removeItem('ataas.software-package.upload-request');
    }
  }, [uploadForm]);

  const returnToClusterWizard = () => {
    window.sessionStorage.setItem(CLUSTER_WIZARD_RESUME_KEY, '1');
    window.dispatchEvent(new CustomEvent('ataas:navigate', {
      detail: { tab: 'clusterOperations' },
    }));
  };

  const selectedDistributionPackage = packageRecords.find((item) => item.key === distributionPackageId) || packageRecords[0];
  const selectedDistributionVersionRecord = selectedDistributionPackage?.versions.find((item) => item.version === distributionVersion);
  const selectedTargetIPs = parseTargetIPs(distributionTargets);
  const selectedTargetCount = selectedTargetIPs.length;
  const distributionPrecheckReady = distributionMachines.length > 0
    && distributionMachines.every((item) => item.status === 'ready');
  const managedVersionCount = useMemo(() => (
    packageRecords.reduce((count, item) => count + item.versions.length, 0)
  ), [packageRecords]);
  const availableVersionCount = useMemo(() => (
    packageRecords.reduce((count, item) => (
      count + item.versions.filter((version) => version.status === 'available').length
    ), 0)
  ), [packageRecords]);
  const k8sVersionCount = useMemo(() => (
    new Set(packageRecords.flatMap((item) => item.k8sVersions)).size
  ), [packageRecords]);
  const k8sFilterOptions = useMemo(() => (
    Array.from(new Set(
      packageRecords
        .filter((item) => item.category === 'kubernetes')
        .flatMap((item) => item.versions.map((version) => version.version)),
    ))
      .sort((first, second) => second.localeCompare(first, undefined, { numeric: true }))
      .map((value) => ({ value, label: value.startsWith('v') ? `K8s ${value}` : value }))
  ), [packageRecords]);
  const distributionCategoryPackages = useMemo(() => (
    packageRecords.filter((item) => item.category === distributionCategory)
  ), [distributionCategory, packageRecords]);
  const distributionVersionOptions = useMemo(() => (
    (selectedDistributionPackage?.versions || []).map((item) => ({
      value: item.version,
      label: `${item.version}${item.version === selectedDistributionPackage?.currentVersion ? '（当前）' : item.status === 'deprecated' ? '（已停用）' : ''}`,
      disabled: item.status === 'deprecated',
    }))
  ), [selectedDistributionPackage]);

  useEffect(() => {
    if (!distributionOpen || distributionStep !== 1 || distributionPrecheckRunId === 0) return undefined;
    const timers = distributionMachines.map((machine, index) => window.setTimeout(() => {
      setDistributionMachines((current) => current.map((item) => (
        item.key === machine.key ? { ...item, status: 'ready' } : item
      )));
    }, 480 + index * 360));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [distributionOpen, distributionPrecheckRunId, distributionStep]);

  useEffect(() => {
    if (distributionStep !== 2 || !distributionTaskKey || distributionProgress >= 100) return undefined;
    const timer = window.setInterval(() => {
      setDistributionProgress((current) => {
        const increment = current < 30 ? 8 : current < 75 ? 6 : 4;
        return Math.min(100, current + increment);
      });
    }, 520);
    return () => window.clearInterval(timer);
  }, [distributionProgress, distributionStep, distributionTaskKey]);

  useEffect(() => {
    if (!distributionTaskKey) return;
    setTasks((items) => items.map((item) => (
      item.key === distributionTaskKey
        ? {
            ...item,
            stage: getDistributionStage(distributionProgress, installK8s),
            progress: distributionProgress,
            status: distributionProgress >= 100 ? 'completed' : 'running',
          }
        : item
    )));
  }, [distributionProgress, distributionTaskKey, installK8s]);

  const filteredPackages = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return packageRecords.filter((item) => {
      const matchesKeyword = !normalizedKeyword
        || item.name.toLowerCase().includes(normalizedKeyword)
        || item.description.toLowerCase().includes(normalizedKeyword)
        || item.currentVersion.toLowerCase().includes(normalizedKeyword)
        || item.versions.some((version) => (
          version.version.toLowerCase().includes(normalizedKeyword)
          || version.checksum.toLowerCase().includes(normalizedKeyword)
      ));
      const matchesCategory = category === 'all' || item.category === category;
      const matchesArch = architecture === 'all' || item.arch.includes(architecture);
      const matchesK8s = category !== 'kubernetes'
        || k8sVersion === 'all'
        || item.versions.some((version) => version.version === k8sVersion);
      return matchesKeyword && matchesCategory && matchesArch && matchesK8s;
    });
  }, [architecture, category, k8sVersion, keyword, packageRecords]);

  const filteredPackageVersionRows = useMemo(() => (
    filteredPackages.flatMap((item) => item.versions
      .filter((version) => (
        category !== 'kubernetes'
        || k8sVersion === 'all'
        || version.version === k8sVersion
      ))
      .map((version) => ({
        key: `${item.key}-${version.version}`,
        packageRecord: item,
        versionRecord: version,
        category: item.category,
        isCurrent: version.version === item.currentVersion,
      })))
  ), [category, filteredPackages, k8sVersion]);

  const openDistribution = (item = packageRecords[0], version = item.currentVersion) => {
    setDistributionCategory(item.category);
    setDistributionPackageId(item.key);
    setDistributionVersion(version);
    setInstallK8s(item.category === 'kubernetes');
    setInitControlPlane(false);
    setDistributionStep(0);
    setDistributionMachines([]);
    setDistributionPrecheckRunId(0);
    setDistributionProgress(0);
    setDistributionTaskKey('');
    setDistributionOpen(true);
  };

  const selectDistributionPackage = (item: SoftwarePackage) => {
    setDistributionCategory(item.category);
    setDistributionPackageId(item.key);
    setDistributionVersion(item.currentVersion);
    setInstallK8s(item.category === 'kubernetes');
  };

  const handleDistributionCategoryChange = (nextCategory: SoftwarePackage['category']) => {
    const nextPackage = packageRecords.find((item) => item.category === nextCategory);
    setDistributionCategory(nextCategory);
    if (nextPackage) {
      selectDistributionPackage(nextPackage);
      return;
    }
    setDistributionPackageId('');
    setDistributionVersion('');
    setInstallK8s(nextCategory === 'kubernetes');
  };

  const handleDistributionPackageChange = (packageId: string) => {
    const nextPackage = packageRecords.find((item) => item.key === packageId);
    if (!nextPackage) return;
    selectDistributionPackage(nextPackage);
  };

  const handleDownload = (item: SoftwarePackage, version = item.currentVersion) => {
    message.success(`已开始下载 ${item.name} ${version}`);
  };

  const handleSetCurrentVersion = (version: PackageVersion) => {
    if (!versionTarget) return;
    setPackageRecords((records) => records.map((item) => (
      item.key === versionTarget.key
        ? {
            ...item,
            currentVersion: version.version,
            size: version.size,
            checksum: version.checksum,
            updatedAt: version.releasedAt,
            status: version.status,
          }
        : item
    )));
    setVersionTarget((item) => item ? {
      ...item,
      currentVersion: version.version,
      size: version.size,
      checksum: version.checksum,
      updatedAt: version.releasedAt,
      status: version.status,
    } : item);
    message.success(`已将 ${version.version} 设为当前版本`);
  };

  const handleUpload = async () => {
    const values = await uploadForm.validateFields();
    const existing = packageRecords.find((item) => item.name.trim().toLowerCase() === values.name.trim().toLowerCase());
    const now = '2026-07-30 15:48';
    const newVersion: PackageVersion = {
      version: values.version,
      releasedAt: now,
      size: '待计算',
      checksum: values.checksum || '上传后生成',
      status: 'verifying',
    };

    if (existing) {
      setPackageRecords((records) => records.map((item) => (
        item.key === existing.key
          ? {
              ...item,
              currentVersion: values.version,
              k8sVersions: values.k8sVersions,
              os: values.os,
              arch: values.arch,
              size: newVersion.size,
              checksum: newVersion.checksum,
              updatedAt: now,
              status: 'verifying',
              versions: [newVersion, ...item.versions],
            }
          : item
      )));
      message.success(`已为 ${existing.name} 添加版本 ${values.version}`);
    } else {
      setPackageRecords((records) => [{
        key: `package-${Date.now()}`,
        name: values.name,
        description: '用户上传的软件包',
        category: values.category,
        currentVersion: values.version,
        k8sVersions: values.k8sVersions,
        os: values.os,
        arch: values.arch,
        size: newVersion.size,
        checksum: newVersion.checksum,
        updatedAt: now,
        status: 'verifying',
        versions: [newVersion],
      }, ...records]);
      message.success(`已添加软件包 ${values.name}`);
    }
    setUploadOpen(false);
    uploadForm.resetFields();
    setClusterReturnReady(false);
    setClusterReturnValidating(Boolean(clusterReturnContext));
    window.setTimeout(() => {
      setPackageRecords((records) => records.map((item) => (
        item.name.trim().toLowerCase() === values.name.trim().toLowerCase()
          ? {
              ...item,
              status: 'available',
              versions: item.versions.map((version) => (
                version.version === values.version ? { ...version, status: 'available' } : version
              )),
            }
          : item
      )));
      setClusterReturnReady(true);
      setClusterReturnValidating(false);
      message.success(`${values.name} ${values.version} 完整性与兼容性校验通过`);
    }, 1400);
  };

  const startDistributionPrecheck = () => {
    if (!selectedDistributionPackage || !distributionVersion) {
      message.warning('请选择要下发的软件包和版本');
      return;
    }
    if (!selectedTargetCount) {
      message.warning('请至少填写一台目标机器');
      return;
    }
    if (!sshUser.trim() || !credential) {
      message.warning('请补充 SSH 用户和凭据');
      return;
    }
    const invalidIPs = selectedTargetIPs.filter((ip) => !isValidIPv4(ip));
    if (invalidIPs.length) {
      message.error(`IP 格式不正确：${invalidIPs.slice(0, 3).join('、')}`);
      return;
    }
    setDistributionMachines(selectedTargetIPs.map((ip) => ({
      key: ip,
      ip,
      status: 'checking',
    })));
    setDistributionStep(1);
    setDistributionPrecheckRunId((current) => current + 1);
  };

  const rerunDistributionPrecheck = () => {
    setDistributionMachines((current) => current.map((item) => ({ ...item, status: 'checking' })));
    setDistributionPrecheckRunId((current) => current + 1);
  };

  const startDistributionTransfer = () => {
    if (!distributionPrecheckReady || !selectedDistributionPackage) return;
    const taskKey = `PKG-${Date.now()}`;
    const newTask: DistributionTask = {
      key: taskKey,
      name: installK8s ? '新机器 K8s 初始化' : `${selectedDistributionPackage.name} 下发`,
      packageName: selectedDistributionPackage.name,
      version: distributionVersion,
      targets: selectedTargetCount > 1
        ? `${selectedTargetIPs[0]} 等 ${selectedTargetCount} 台`
        : selectedTargetIPs[0],
      stage: '传输软件包',
      progress: 6,
      status: 'running',
      createdAt: '2026-07-30 15:48',
    };
    setTasks((items) => [newTask, ...items]);
    setDistributionTaskKey(taskKey);
    setDistributionProgress(6);
    setDistributionStep(2);
  };

  const runDistributionInBackground = () => {
    setDistributionOpen(false);
    setActiveTab('tasks');
    message.success('任务已转入后台，可在「下发任务」中查看进度和日志');
  };

  const finishDistribution = () => {
    setDistributionOpen(false);
    setActiveTab('tasks');
    message.success(`软件包已成功下发至 ${selectedTargetCount} 台机器`);
  };

  const closeDistribution = () => {
    if (distributionStep === 2 && distributionProgress < 100) {
      runDistributionInBackground();
      return;
    }
    setDistributionOpen(false);
  };

  const renderDistributionConfig = () => (
    <div className="software-distribution-grid">
      <section className="software-distribution-package-panel">
        <h3><span className="software-distribution-title-icon"><FileZipOutlined /></span> 软件包版本定位</h3>
        <div className="software-distribution-select-stack">
          <label>软件包类型</label>
          <Select
            value={distributionCategory}
            onChange={handleDistributionCategoryChange}
            options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
          />
          <label>软件包</label>
          <Select
            value={distributionPackageId}
            onChange={handleDistributionPackageChange}
            options={distributionCategoryPackages.map((item) => ({
              value: item.key,
              label: item.name,
            }))}
          />
          <label>版本</label>
          <Select
            value={distributionVersion}
            onChange={setDistributionVersion}
            options={distributionVersionOptions}
          />
          <div className="software-distribution-package-info">
            <span className={`software-package-type-tag ${selectedDistributionPackage?.category}`}>{selectedDistributionPackage ? categoryLabels[selectedDistributionPackage.category] : '未选择'}</span>
            <strong>{selectedDistributionPackage?.name}</strong>
            <small>
              {selectedDistributionPackage?.os} · {selectedDistributionPackage?.arch}
              {selectedDistributionVersionRecord ? ` · ${selectedDistributionVersionRecord.size}` : ''}
            </small>
          </div>
        </div>
        <label>安装选项</label>
        <div className="software-install-options">
          <Checkbox checked={installK8s} onChange={(event) => setInstallK8s(event.target.checked)}>
            下发后自动安装 Kubernetes
          </Checkbox>
          <Checkbox
            checked={initControlPlane}
            disabled={!installK8s}
            onChange={(event) => setInitControlPlane(event.target.checked)}
          >
            初始化首个控制面节点
          </Checkbox>
        </div>
      </section>

      <section className="software-distribution-ssh-panel">
        <h3><span className="software-distribution-title-icon"><SafetyCertificateOutlined /></span> 目标机器与 SSH</h3>
        <label>目标 IP <em>每行一个，也可用逗号分隔</em></label>
        <Input.TextArea
          rows={3}
          value={distributionTargets}
          onChange={(event) => setDistributionTargets(event.target.value)}
          placeholder={'10.24.16.31\n10.24.16.32'}
        />
        <div className="software-ssh-row">
          <span>
            <label>SSH 端口</label>
            <InputNumber min={1} max={65535} value={sshPort} onChange={(value) => setSshPort(value || 22)} />
          </span>
          <span>
            <label>SSH 用户</label>
            <Input value={sshUser} onChange={(event) => setSshUser(event.target.value)} />
          </span>
        </div>
        <label>SSH 凭据</label>
        <Select
          value={credential}
          onChange={setCredential}
          options={[
            { value: 'sh-new-node-root', label: 'sh-new-node-root（SSH Key）' },
            { value: 'zz-baremetal-root', label: 'zz-baremetal-root（SSH Key）' },
            { value: 'temporary-password', label: '临时密码凭据' },
          ]}
        />
      </section>
      <div className="software-distribution-summary">
        <SafetyCertificateOutlined />
        <span>
          下一步将逐机执行 SSH 前置检查
          <small>检查 {selectedTargetCount} 台机器的连通性、sudo 权限、磁盘空间、系统架构和端口占用。</small>
        </span>
        <Tag color="purple">
          {selectedDistributionPackage?.name} {distributionVersion}
          {selectedDistributionVersionRecord ? ` · ${statusLabels[selectedDistributionVersionRecord.status]}` : ''}
        </Tag>
      </div>
    </div>
  );

  const renderDistributionPrecheck = () => {
    const readyCount = distributionMachines.filter((item) => item.status === 'ready').length;
    return (
      <div className="software-distribution-precheck">
        <header className="software-distribution-step-header">
          <div>
            <h3>SSH 前置检查</h3>
            <p>每台机器检查通过后，才能开始传输和安装软件包。</p>
          </div>
          <Tag color={distributionPrecheckReady ? 'success' : 'processing'}>
            {readyCount} / {distributionMachines.length} 台就绪
          </Tag>
        </header>
        <div className="software-distribution-machine-list">
          {distributionMachines.map((machine) => (
            <div key={machine.key} className={machine.status}>
              <span className="software-machine-status-icon">
                {machine.status === 'ready' ? <CheckCircleFilled /> : <LoadingOutlined spin />}
              </span>
              <strong>{machine.ip}</strong>
              <span className="software-machine-checks">
                <em>SSH</em>
                <em>sudo</em>
                <em>磁盘</em>
                <em>系统架构</em>
                <em>端口</em>
              </span>
              <b>{machine.status === 'ready' ? '检查通过' : '检查中'}</b>
            </div>
          ))}
        </div>
        <div className={`software-distribution-check-result${distributionPrecheckReady ? ' ready' : ''}`}>
          {distributionPrecheckReady ? <CheckCircleFilled /> : <LoadingOutlined spin />}
          <span>
            <strong>{distributionPrecheckReady ? '所有目标机器均已就绪' : '正在逐机检查环境'}</strong>
            <small>
              {distributionPrecheckReady
                ? '可进入下一步，通过 SSH 传输并安装所选软件包。'
                : '请保持弹窗开启，检查通常只需要几秒钟。'}
            </small>
          </span>
        </div>
      </div>
    );
  };

  const renderDistributionTransfer = () => {
    const stages = [
      { label: '传输软件包', threshold: 6, next: 30 },
      { label: '校验并解压', threshold: 30, next: 52 },
      { label: installK8s ? '安装 Kubernetes 组件' : '执行软件包安装', threshold: 52, next: 84 },
      { label: '安装后健康检查', threshold: 84, next: 100 },
    ];
    const logLines = [
      `[${distributionProgress >= 30 ? '完成' : '执行'}] 建立 SSH 连接并传输 ${selectedDistributionPackage?.name}`,
      ...(distributionProgress >= 30 ? ['[完成] SHA256 完整性校验通过，软件包已解压'] : []),
      ...(distributionProgress >= 52 ? [`[执行] ${installK8s ? '安装 kubeadm、kubelet、kubectl 与 containerd' : '执行安装脚本'}`] : []),
      ...(distributionProgress >= 84 ? ['[执行] 检查服务状态与节点健康度'] : []),
      ...(distributionProgress >= 100 ? [`[完成] ${selectedTargetCount} 台机器全部处理成功`] : []),
    ];
    return (
      <div className="software-distribution-transfer">
        <section className={`software-distribution-progress-hero${distributionProgress >= 100 ? ' finished' : ''}`}>
          <span>{distributionProgress >= 100 ? <CheckCircleFilled /> : <CloudDownloadOutlined />}</span>
          <div>
            <strong>{getDistributionStage(distributionProgress, installK8s)}</strong>
            <small>{selectedDistributionPackage?.name} {distributionVersion} · {selectedTargetCount} 台机器</small>
          </div>
          <b>{distributionProgress}%</b>
          <Progress
            percent={distributionProgress}
            showInfo={false}
            status={distributionProgress >= 100 ? 'success' : 'active'}
          />
        </section>
        <div className="software-distribution-progress-layout">
          <section className="software-distribution-stage-list">
            <h3>执行阶段</h3>
            {stages.map((stage, index) => {
              const completed = distributionProgress >= stage.next;
              const active = distributionProgress >= stage.threshold && distributionProgress < stage.next;
              return (
                <div key={stage.label} className={completed ? 'completed' : active ? 'active' : ''}>
                  <i>{completed ? <CheckCircleFilled /> : active ? <LoadingOutlined spin /> : index + 1}</i>
                  <span>{stage.label}</span>
                  <em>{completed ? '完成' : active ? '执行中' : '等待'}</em>
                </div>
              );
            })}
          </section>
          <section className="software-distribution-node-list">
            <h3>机器进度</h3>
            {distributionMachines.map((machine, index) => {
              const machineProgress = Math.max(0, Math.min(100, distributionProgress - index * 4));
              return (
                <div key={machine.key}>
                  <span>
                    <strong>{machine.ip}</strong>
                    <small>{machineProgress >= 100 ? '安装完成' : getDistributionStage(machineProgress, installK8s)}</small>
                  </span>
                  <Progress
                    percent={machineProgress}
                    showInfo={false}
                    size="small"
                    status={machineProgress >= 100 ? 'success' : 'active'}
                  />
                  <em>{machineProgress}%</em>
                </div>
              );
            })}
          </section>
        </div>
        <section className="software-distribution-log">
          <h3>实时日志 <Tag>任务 {distributionTaskKey}</Tag></h3>
          <div>{logLines.map((line) => <code key={line}>{line}</code>)}</div>
        </section>
      </div>
    );
  };

  const renderDistributionResult = () => (
    <div className="software-distribution-result">
      <span className="software-distribution-result-icon"><CheckCircleFilled /></span>
      <h3>软件包下发安装完成</h3>
      <p>{selectedTargetCount} 台目标机器全部处理成功，执行日志已保留在下发任务中。</p>
      <section>
        <div><small>软件包</small><strong>{selectedDistributionPackage?.name}</strong></div>
        <div><small>版本</small><strong>{distributionVersion}</strong></div>
        <div><small>目标机器</small><strong>{selectedTargetCount} 台</strong></div>
        <div><small>安装方式</small><strong>{installK8s ? '下发并安装 K8s' : '仅下发软件包'}</strong></div>
      </section>
      <div className="software-distribution-result-note">
        <SafetyCertificateOutlined />
        <span>
          <strong>任务 {distributionTaskKey}</strong>
          <small>关闭后可在软件包管理的「下发任务」页签中继续查看任务详情和日志。</small>
        </span>
      </div>
    </div>
  );

  const renderDistributionFooter = () => {
    if (distributionStep === 0) {
      return (
        <div className="software-distribution-footer">
          <Button onClick={() => setDistributionOpen(false)}>取消</Button>
          <span />
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={startDistributionPrecheck}>
            下一步：SSH 检查
          </Button>
        </div>
      );
    }
    if (distributionStep === 1) {
      return (
        <div className="software-distribution-footer">
          <Button onClick={() => setDistributionStep(0)}>上一步</Button>
          <span />
          <Button icon={<ReloadOutlined />} onClick={rerunDistributionPrecheck}>重新检查</Button>
          <Button
            type="primary"
            icon={<CloudDownloadOutlined />}
            disabled={!distributionPrecheckReady}
            onClick={startDistributionTransfer}
          >
            下一步：传输安装
          </Button>
        </div>
      );
    }
    if (distributionStep === 2) {
      return (
        <div className="software-distribution-footer">
          <Button onClick={runDistributionInBackground}>后台运行</Button>
          <small>后台运行后可在「下发任务」中查看进度与日志</small>
          <span />
          <Button
            type="primary"
            disabled={distributionProgress < 100}
            onClick={() => setDistributionStep(3)}
          >
            下一步：结果确认
          </Button>
        </div>
      );
    }
    return (
      <div className="software-distribution-footer">
        <span />
        <Button type="primary" onClick={finishDistribution}>完成并查看任务</Button>
      </div>
    );
  };

  const packageVersionColumns: ColumnsType<PackageVersionRow> = [
    {
      title: '类型',
      dataIndex: 'category',
      width: 112,
      render: (value: SoftwarePackage['category']) => (
        <Tag className={`software-package-type-tag ${value}`}>{categoryLabels[value]}</Tag>
      ),
    },
    {
      title: '软件包',
      key: 'package',
      width: 270,
      render: (_, item) => (
        <div className="software-package-name">
          <span>
            <strong>{item.packageRecord.name}</strong>
            <small>{item.packageRecord.description}</small>
          </span>
        </div>
      ),
    },
    {
      title: '版本',
      key: 'version',
      width: 150,
      render: (_, item) => (
        <div className="software-package-version">
          <strong>{item.versionRecord.version}</strong>
          {item.isCurrent && <Tag className="package-status-tag current">当前</Tag>}
          {item.versionRecord.status === 'deprecated' && (
            <Tag className="package-status-tag deprecated">{statusLabels[item.versionRecord.status]}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '适配 K8s',
      key: 'k8sVersions',
      width: 190,
      render: (_, item) => (
        <div className="software-package-k8s-tags">
          {item.packageRecord.k8sVersions.map((value) => <Tag key={value}>{value}</Tag>)}
        </div>
      ),
    },
    {
      title: '系统 / 架构',
      key: 'system',
      width: 170,
      render: (_, item) => (
        <div className="software-package-system">
          <span>{item.packageRecord.os}</span>
          <small>{item.packageRecord.arch}</small>
        </div>
      ),
    },
    {
      title: '大小 / SHA256',
      key: 'file',
      width: 140,
      render: (_, item) => (
        <div className="software-package-system">
          <span>{item.versionRecord.size}</span>
          <small>{item.versionRecord.checksum}</small>
        </div>
      ),
    },
    {
      title: '上传时间',
      key: 'releasedAt',
      width: 142,
      render: (_, item) => <span className="software-package-muted">{item.versionRecord.releasedAt}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 194,
      render: (_, item) => (
        <Space size={10} className="software-package-actions">
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item.packageRecord, item.versionRecord.version)}>下载</Button>
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            disabled={item.versionRecord.status === 'deprecated'}
            onClick={() => openDistribution(item.packageRecord, item.versionRecord.version)}
          >
            下发
          </Button>
        </Space>
      ),
    },
  ];

  const taskColumns: ColumnsType<DistributionTask> = [
    {
      title: '任务',
      key: 'task',
      width: 270,
      render: (_, item) => (
        <div className="software-task-name">
          <strong>{item.name}</strong>
          <small>{item.key} · {item.createdAt}</small>
        </div>
      ),
    },
    {
      title: '软件包 / 版本',
      key: 'package',
      width: 240,
      render: (_, item) => (
        <div className="software-task-name">
          <strong>{item.packageName}</strong>
          <small>{item.version}</small>
        </div>
      ),
    },
    { title: '目标机器', dataIndex: 'targets', width: 190 },
    {
      title: '执行进度',
      key: 'progress',
      width: 280,
      render: (_, item) => (
        <div className="software-task-progress">
          <div>
            <span>{item.stage}</span>
            <em>{item.progress}%</em>
          </div>
          <Progress
            percent={item.progress}
            showInfo={false}
            size="small"
            status={item.status === 'failed' ? 'exception' : item.status === 'completed' ? 'success' : 'active'}
          />
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: TaskStatus) => <Tag className={`package-task-status ${value}`}>{taskStatusLabels[value]}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_, item) => <Button type="link" size="small" onClick={() => message.info(`${item.key} 的执行日志已打开`)}>查看日志</Button>,
    },
  ];

  return (
    <div className="software-package-page">
      <header className="software-package-header">
        <div>
          <h1>软件包管理</h1>
          <p>统一维护节点初始化所需软件包，通过 SSH 下发到新机器并完成 Kubernetes 安装。</p>
        </div>
        <Space size={8}>
          <Button
            type="primary"
            className="ataas-page-create-button software-create-action"
            icon={<PlusOutlined />}
            onClick={() => setUploadOpen(true)}
          >
            上传软件包
          </Button>
          <Button
            type="primary"
            className="ataas-page-create-button software-create-action"
            icon={<SendOutlined />}
            onClick={() => openDistribution()}
          >
            新建下发
          </Button>
        </Space>
      </header>

      {clusterReturnContext && (
        <section className={`software-cluster-return${clusterReturnReady ? ' ready' : ''}`}>
          <span><ArrowLeftOutlined /></span>
          <div>
            <strong>
              {clusterReturnReady
                ? '软件包已校验通过，可以继续创建集群'
                : clusterReturnValidating
                  ? '正在校验软件包完整性与兼容性'
                  : '从集群创建向导跳转而来'}
            </strong>
            <small>
              {clusterReturnContext.k8sVersion} · {clusterReturnContext.os} · {clusterReturnContext.arch}
              {clusterReturnReady
                ? ' 已加入可选版本。'
                : clusterReturnValidating
                  ? '，校验完成后即可返回。'
                  : '，上传完成后可返回原来的创建现场。'}
            </small>
          </div>
          <Button
            type={clusterReturnReady ? 'primary' : 'default'}
            icon={<ArrowLeftOutlined />}
            disabled={clusterReturnValidating}
            onClick={returnToClusterWizard}
          >
            {clusterReturnValidating ? '校验中…' : '返回创建集群'}
          </Button>
        </section>
      )}

      <section className="software-bootstrap-guide">
        <div className="software-bootstrap-guide-title">
          <span><CloudServerOutlined /></span>
          <div>
            <strong>新机器初始化</strong>
            <small>一条任务完成环境准备，下发前会自动检查 SSH、系统版本、磁盘空间和端口。</small>
          </div>
        </div>
        <Steps
          size="small"
          current={-1}
          items={[
            { title: '选择 K8s 套件', icon: <FileZipOutlined /> },
            { title: 'SSH 下发', icon: <CloudDownloadOutlined /> },
            { title: '安装并校验', icon: <SafetyCertificateOutlined /> },
            { title: '创建 / 加入集群', icon: <CheckCircleFilled /> },
          ]}
        />
        <Button
          type="primary"
          className="ataas-page-create-button software-create-action"
          icon={<SendOutlined />}
          onClick={() => openDistribution()}
        >
          开始初始化
        </Button>
      </section>

      <section className="software-package-metrics">
        <article>
          <span className="purple"><FileZipOutlined /></span>
          <div><small>软件包</small><strong>{packageRecords.length}</strong><em>已纳管</em></div>
        </article>
        <article>
          <span className="blue"><CodeOutlined /></span>
          <div><small>K8s 版本</small><strong>{k8sVersionCount}</strong><em>已适配</em></div>
        </article>
        <article>
          <span className="green"><CheckCircleFilled /></span>
          <div><small>可用版本</small><strong>{availableVersionCount}</strong><em>共 {managedVersionCount} 个</em></div>
        </article>
        <article>
          <span className="orange"><SendOutlined /></span>
          <div><small>下发任务</small><strong>{tasks.filter((item) => item.status === 'running').length}</strong><em>正在执行</em></div>
        </article>
      </section>

      <section className="software-package-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'packages', label: <>软件包列表 <Tag>{packageRecords.length}</Tag></> },
            { key: 'tasks', label: <>下发任务 <Tag>{tasks.length}</Tag></> },
          ]}
        />

        {activeTab === 'packages' ? (
          <>
            <div className="software-package-toolbar">
              <Input.Search
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索软件包、版本或用途"
                allowClear
              />
              <Select
                value={category}
                onChange={(value) => {
                  setCategory(value);
                  if (value !== 'kubernetes') {
                    setK8sVersion('all');
                  }
                }}
                options={[
                  { value: 'all', label: '全部软件包类型' },
                  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
              {category === 'kubernetes' && (
                <Select
                  value={k8sVersion}
                  onChange={setK8sVersion}
                  options={[
                    { value: 'all', label: '全部 K8s 版本' },
                    ...k8sFilterOptions,
                  ]}
                />
              )}
              <Select
                value={architecture}
                onChange={setArchitecture}
                options={[
                  { value: 'all', label: '全部架构' },
                  { value: 'x86_64', label: 'x86_64' },
                  { value: 'arm64', label: 'arm64' },
                ]}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setKeyword('');
                  setCategory('all');
                  setK8sVersion('all');
                  setArchitecture('all');
                }}
              >
                重置
              </Button>
              <span>共 {filteredPackageVersionRows.length} 个版本</span>
            </div>
            <Table
              rowKey="key"
              className="software-package-version-table"
              columns={packageVersionColumns}
              dataSource={filteredPackageVersionRows}
              rowClassName={(record) => `${record.isCurrent ? 'is-current-version' : ''} ${record.versionRecord.status === 'deprecated' ? 'is-deprecated-version' : ''}`.trim()}
              pagination={false}
              scroll={{ x: 1390 }}
            />
          </>
        ) : (
          <Table
            rowKey="key"
            columns={taskColumns}
            dataSource={tasks}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 1200 }}
          />
        )}
      </section>

      <Modal
        title={versionTarget ? `${versionTarget.name} · 版本管理` : '版本管理'}
        open={!!versionTarget}
        onCancel={() => setVersionTarget(null)}
        footer={<Button onClick={() => setVersionTarget(null)}>关闭</Button>}
        width={820}
      >
        {versionTarget && (
          <div className="software-version-modal">
            <div className="software-version-summary">
              <span><FileZipOutlined /></span>
              <div>
                <strong>{versionTarget.name}</strong>
                <small>{versionTarget.os} · {versionTarget.arch} · 当前版本 {versionTarget.currentVersion}</small>
              </div>
              <Button
                type="primary"
                className="ataas-page-create-button software-create-action"
                icon={<PlusOutlined />}
                onClick={() => {
                  uploadForm.setFieldsValue({
                    name: versionTarget.name,
                    category: versionTarget.category,
                    k8sVersions: versionTarget.k8sVersions,
                    os: versionTarget.os,
                    arch: versionTarget.arch,
                  });
                  setVersionTarget(null);
                  setUploadOpen(true);
                }}
              >
                添加版本
              </Button>
            </div>
            <div className="software-version-flat-list">
              {versionTarget.versions.map((version) => {
                const isCurrent = version.version === versionTarget.currentVersion;
                return (
                  <article key={version.version} className={`software-version-flat-item${isCurrent ? ' current' : ''}${version.status === 'deprecated' ? ' disabled' : ''}`}>
                    <div>
                      <strong>{version.version}</strong>
                      {isCurrent && <Tag color="purple">当前版本</Tag>}
                      <Tag className={`package-status-tag ${version.status}`}>{statusLabels[version.status]}</Tag>
                    </div>
                    <span>{version.releasedAt}</span>
                    <span>{version.size}</span>
                    <small>SHA256 {version.checksum}</small>
                    <Space size={0}>
                      <Button type="link" size="small" onClick={() => handleDownload(versionTarget, version.version)}>下载</Button>
                      <Button
                        type="link"
                        size="small"
                        disabled={version.status === 'deprecated'}
                        onClick={() => {
                          openDistribution(versionTarget, version.version);
                          setVersionTarget(null);
                        }}
                      >
                        下发
                      </Button>
                      {version.version !== versionTarget.currentVersion && version.status !== 'deprecated' && (
                        <Button type="link" size="small" onClick={() => handleSetCurrentVersion(version)}>设为当前</Button>
                      )}
                    </Space>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="上传软件包"
        open={uploadOpen}
        onCancel={() => {
          setUploadOpen(false);
          uploadForm.resetFields();
        }}
        onOk={handleUpload}
        okText="上传并校验"
        okButtonProps={{ className: 'ataas-page-create-button software-create-action' }}
        cancelText="取消"
        width={680}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          initialValues={{
            category: 'tool',
            k8sVersions: ['通用'],
            os: 'Linux',
            arch: 'x86_64',
          }}
        >
          <div className="software-form-grid">
            <Form.Item label="软件包名称" name="name" rules={[{ required: true, message: '请输入软件包名称' }]}>
              <Input placeholder="例如 kubeadm 或 NVIDIA Container Toolkit" />
            </Form.Item>
            <Form.Item label="软件包类型" name="category" rules={[{ required: true }]}>
              <Select options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item label="版本" name="version" rules={[{ required: true, message: '请输入版本号' }]}>
              <Input placeholder="例如 v1.31.4" />
            </Form.Item>
            <Form.Item label="适配 K8s 版本" name="k8sVersions" rules={[{ required: true, message: '请选择适配版本' }]}>
              <Select mode="tags" options={['v1.31.x', 'v1.30.x', 'v1.29.x', '通用'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item label="操作系统" name="os" rules={[{ required: true }]}>
              <Select options={['Linux', 'Ubuntu 22.04', 'Rocky 9', '麒麟 V10'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item label="架构" name="arch" rules={[{ required: true }]}>
              <Select options={['x86_64', 'arm64', 'x86_64 / arm64'].map((value) => ({ value, label: value }))} />
            </Form.Item>
          </div>
          <Form.Item label="SHA256（可选）" name="checksum">
            <Input placeholder="留空则在上传完成后自动生成" />
          </Form.Item>
          <Form.Item label="软件包文件" required>
            <Upload.Dragger beforeUpload={() => false} maxCount={1} accept=".tar,.gz,.tgz,.zip,.rpm,.deb">
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽软件包到此区域</p>
              <p className="ant-upload-hint">支持 tar.gz、tgz、zip、rpm、deb，上传后自动执行完整性校验</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        rootClassName="software-distribution-wizard-modal"
        title="新建软件包下发"
        open={distributionOpen}
        mask={{ closable: false }}
        onCancel={closeDistribution}
        footer={renderDistributionFooter()}
        width={980}
      >
        <div className="software-distribution-modal">
          <Steps
            size="small"
            current={distributionStep}
            items={[
              { title: '软件包' },
              { title: 'SSH 检查' },
              { title: '传输安装' },
              { title: '结果确认' },
            ]}
          />
          <div className="software-distribution-content">
            {distributionStep === 0 && renderDistributionConfig()}
            {distributionStep === 1 && renderDistributionPrecheck()}
            {distributionStep === 2 && renderDistributionTransfer()}
            {distributionStep === 3 && renderDistributionResult()}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SoftwarePackagePage;
