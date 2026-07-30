import {
  CheckCircleFilled,
  CloudServerOutlined,
  CodeSandboxOutlined,
  DesktopOutlined,
  LoadingOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
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

type MachineCandidate = {
  key: string;
  ip: string;
  hostname: string;
  os: string;
  arch: string;
  cpu: string;
  memory: string;
  disk: string;
  role: MachineRole;
  status: PrecheckStatus;
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
  clusterName: string;
  dataCenterKey: string;
  machineCount: number;
  masterCount: number;
  workerCount: number;
  k8sVersion: string;
  packageName: string;
};

type BareMetalClusterWizardProps = {
  open: boolean;
  dataCenters: BareMetalDataCenter[];
  initialDataCenterKey?: string;
  onCancel: () => void;
  onOpenPackageManager: (request: { k8sVersion: string; os: string; arch: string }) => void;
  onTaskCreated?: (summary: ClusterCreateTaskSummary) => void;
};

const PACKAGE_STORAGE_KEY = 'ataas.software-packages.catalog.v1';

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

const isValidIPv4 = (value: string) => {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => (
    /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255
  ));
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
  onOpenPackageManager,
  onTaskCreated,
}: BareMetalClusterWizardProps) => {
  const [step, setStep] = useState(0);
  const [clusterName, setClusterName] = useState('gpu-prod-02');
  const [dataCenterKey, setDataCenterKey] = useState('');
  const [machineIPs, setMachineIPs] = useState('10.24.16.31\n10.24.16.32\n10.24.16.33');
  const [sshPort, setSshPort] = useState(22);
  const [sshUser, setSshUser] = useState('root');
  const [credential, setCredential] = useState('sh-new-node-root');
  const [machines, setMachines] = useState<MachineCandidate[]>([]);
  const [precheckRunId, setPrecheckRunId] = useState(0);
  const [k8sVersion, setK8sVersion] = useState('v1.31.4');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [taskProgress, setTaskProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setClusterName('gpu-prod-02');
    setDataCenterKey(initialDataCenterKey || dataCenters[0]?.key || '');
    setMachineIPs('10.24.16.31\n10.24.16.32\n10.24.16.33');
    setSshPort(22);
    setSshUser('root');
    setCredential('sh-new-node-root');
    setMachines([]);
    setPrecheckRunId(0);
    setK8sVersion('v1.31.4');
    setSelectedPackageId('');
    setTaskProgress(0);
  }, [open]);

  useEffect(() => {
    if (!open || step !== 1 || precheckRunId === 0) return undefined;
    const ips = parseMachineIPs(machineIPs);
    const timers = ips.map((ip, index) => window.setTimeout(() => {
      setMachines((current) => current.map((machine) => (
        machine.ip === ip ? { ...machine, status: 'ready' } : machine
      )));
    }, 650 + index * 420));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [machineIPs, open, precheckRunId, step]);

  useEffect(() => {
    if (!open || step !== 4) return undefined;
    const timer = window.setInterval(() => {
      setTaskProgress((current) => {
        if (current >= 100) return 100;
        const increment = current < 25 ? 5 : current < 75 ? 4 : 3;
        return Math.min(100, current + increment);
      });
    }, 620);
    return () => window.clearInterval(timer);
  }, [open, step]);

  const packageCatalog = useMemo(() => {
    const catalog = new Map<string, CompatiblePackage>();
    builtinPackages.forEach((item) => catalog.set(`${item.version}-${item.arch}`, item));
    readStoredPackages().forEach((item) => catalog.set(`${item.version}-${item.arch}`, item));
    return Array.from(catalog.values());
  }, [open]);

  const matchedPackages = useMemo(() => {
    const minorVersion = k8sVersion.split('.').slice(0, 2).join('.');
    return packageCatalog.filter((item) => (
      item.status === 'available'
      && item.arch.includes('x86_64')
      && item.os.includes('Ubuntu 22.04')
      && (item.version === k8sVersion || item.k8sVersions.some((version) => (
        version === k8sVersion || version === `${minorVersion}.x`
      )))
    ));
  }, [k8sVersion, packageCatalog]);

  useEffect(() => {
    if (!matchedPackages.some((item) => item.id === selectedPackageId)) {
      setSelectedPackageId(matchedPackages[0]?.id || '');
    }
  }, [matchedPackages, selectedPackageId]);

  const selectedPackage = matchedPackages.find((item) => item.id === selectedPackageId);
  const precheckReady = machines.length > 0 && machines.every((item) => item.status === 'ready');
  const masterCount = machines.filter((item) => item.role === 'master').length;
  const workerCount = machines.filter((item) => item.role === 'worker').length;

  const startPrecheck = () => {
    const ips = parseMachineIPs(machineIPs);
    if (!dataCenterKey) {
      message.warning('请选择所属数据中心');
      return;
    }
    if (!clusterName.trim()) {
      message.warning('请输入集群名称');
      return;
    }
    if (!ips.length) {
      message.warning('请至少填写一台机器 IP');
      return;
    }
    const invalidIPs = ips.filter((ip) => !isValidIPv4(ip));
    if (invalidIPs.length) {
      message.error(`IP 格式不正确：${invalidIPs.slice(0, 3).join('、')}`);
      return;
    }
    if (!sshUser.trim() || !credential) {
      message.warning('请补充 SSH 用户和凭据');
      return;
    }
    setMachines(ips.map((ip, index) => ({
      key: ip,
      ip,
      hostname: `gpu-node-${String(index + 1).padStart(2, '0')}`,
      os: 'Ubuntu 22.04.4',
      arch: 'x86_64',
      cpu: '128 Core',
      memory: '512 GB',
      disk: index === 0 ? '3.8 TB' : '7.6 TB',
      role: index === 0 ? 'master' : 'worker',
      status: 'checking',
    })));
    setStep(1);
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
    setStep(3);
  };

  const createCluster = () => {
    if (!selectedPackage) {
      message.warning('请选择匹配的软件包');
      return;
    }
    setTaskProgress(8);
    setStep(4);
    onTaskCreated?.({
      clusterName: clusterName.trim(),
      dataCenterKey,
      machineCount: machines.length,
      masterCount,
      workerCount,
      k8sVersion,
      packageName: `${selectedPackage.name} ${selectedPackage.version}`,
    });
  };

  const openPackageManager = () => {
    onOpenPackageManager({
      k8sVersion,
      os: 'Ubuntu 22.04',
      arch: 'x86_64',
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
          <small>{item.ip}</small>
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
          <small>{item.ip}</small>
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
      title: '节点角色',
      key: 'role',
      width: 190,
      render: (_, item) => (
        <Select
          value={item.role}
          onChange={(role: MachineRole) => setMachines((current) => current.map((machine) => (
            machine.key === item.key ? { ...machine, role } : machine
          )))}
          options={[
            { value: 'master', label: 'Master / Control Plane' },
            { value: 'worker', label: 'Worker' },
          ]}
        />
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 112,
      render: () => <span className="cluster-wizard-status ready"><CheckCircleFilled /> 已就绪</span>,
    },
  ];

  const renderMachineStep = () => (
    <div className="cluster-wizard-machine-step">
      <section>
        <h3><CloudServerOutlined /> 集群与机器</h3>
        <label>所属数据中心</label>
        <Select
          value={dataCenterKey}
          onChange={setDataCenterKey}
          placeholder="请选择数据中心"
          options={dataCenters.map((item) => ({
            value: item.key,
            label: `${item.name} · ${item.supplier}`,
          }))}
        />
        <label>集群名称</label>
        <Input value={clusterName} onChange={(event) => setClusterName(event.target.value)} placeholder="例如：gpu-prod-02" />
        <label>机器 IP <em>每行一个，也可使用逗号分隔</em></label>
        <Input.TextArea
          rows={7}
          value={machineIPs}
          onChange={(event) => setMachineIPs(event.target.value)}
          placeholder={'10.24.16.31\n10.24.16.32\n10.24.16.33'}
        />
        <small className="cluster-wizard-input-note">将使用 {parseMachineIPs(machineIPs).length} 台机器组成一个 Kubernetes 集群。</small>
      </section>
      <section>
        <h3><SafetyCertificateOutlined /> SSH 连接</h3>
        <div className="cluster-wizard-two-columns compact">
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
            { value: 'cluster-default-root-key', label: 'cluster-default-root-key（SSH Key）' },
            { value: 'temporary-password', label: '临时密码凭据' },
          ]}
        />
        <div className="cluster-wizard-precheck-note">
          <SafetyCertificateOutlined />
          <span>
            <strong>逐机 Precheck</strong>
            <small>下一步将分别检查每台机器的 SSH 连通性、sudo 权限、CPU/内存、磁盘空间、系统架构以及 6443/10250 端口。</small>
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
          <p>至少需要 1 台 Master；生产集群建议使用 3 台 Master 组成高可用控制面。</p>
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
            options={[
              { value: 'v1.32.0', label: 'v1.32.0' },
              { value: 'v1.31.4', label: 'v1.31.4（推荐）' },
              { value: 'v1.30.8', label: 'v1.30.8' },
            ]}
          />
        </label>
      </section>

      <div className="cluster-wizard-package-list">
        <header>
          <div>
            <h3>选择 K8s 软件包</h3>
            <p>仅展示与版本、操作系统和架构完全匹配且校验通过的软件包。</p>
          </div>
          <Tag>{matchedPackages.length} 个匹配</Tag>
        </header>
        {matchedPackages.length ? (
          matchedPackages.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`cluster-wizard-package-card${selectedPackageId === item.id ? ' active' : ''}`}
              onClick={() => setSelectedPackageId(item.id)}
            >
              <span className="cluster-wizard-package-icon"><CodeSandboxOutlined /></span>
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
            <CodeSandboxOutlined />
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
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={startPrecheck}>开始 Precheck</Button>
        </Space>
      );
    }
    if (step === 1) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(0)}>上一步</Button>
          <span />
          <Button icon={<ReloadOutlined />} onClick={rerunPrecheck}>重新检测</Button>
          <Button type="primary" disabled={!precheckReady} onClick={() => setStep(2)}>下一步：分配角色</Button>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(1)}>上一步</Button>
          <span />
          <Button type="primary" onClick={continueFromRoles}>下一步：选择软件包</Button>
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="cluster-wizard-footer">
          <Button onClick={() => setStep(2)}>上一步</Button>
          <span />
          <Button type="primary" icon={<CloudServerOutlined />} disabled={!selectedPackage} onClick={createCluster}>创建集群</Button>
        </div>
      );
    }
    return (
      <div className="cluster-wizard-footer">
        <span />
        <Button type={taskProgress >= 100 ? 'primary' : 'default'} onClick={onCancel}>
          {taskProgress >= 100 ? '完成' : '后台运行'}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      rootClassName="bare-metal-cluster-wizard-modal"
      title={(
        <div className="cluster-wizard-title">
          <CodeSandboxOutlined />
          <span>
            <strong>创建 / 接入 Kubernetes 集群</strong>
            <small>通过 SSH 纳管裸机、完成 Precheck 并自动部署集群</small>
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
        items={[
          { title: '机器信息' },
          { title: 'Precheck' },
          { title: '角色分配' },
          { title: 'K8s 软件包' },
          { title: '创建进度' },
        ]}
      />
      <div className="cluster-wizard-content">
        {step === 0 && renderMachineStep()}
        {step === 1 && renderPrecheckStep()}
        {step === 2 && renderRoleStep()}
        {step === 3 && renderPackageStep()}
        {step === 4 && renderProgressStep()}
      </div>
    </Modal>
  );
};

export default BareMetalClusterWizard;
