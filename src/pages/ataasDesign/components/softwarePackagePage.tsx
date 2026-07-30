import {
  CheckCircleFilled,
  CloudDownloadOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DownloadOutlined,
  FileZipOutlined,
  HistoryOutlined,
  InboxOutlined,
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
import { useMemo, useState } from 'react';
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

const SoftwarePackagePage = () => {
  const [packageRecords, setPackageRecords] = useState(initialPackages);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTab, setActiveTab] = useState('packages');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [architecture, setArchitecture] = useState('all');
  const [k8sVersion, setK8sVersion] = useState('all');
  const [versionTarget, setVersionTarget] = useState<SoftwarePackage | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [distributionOpen, setDistributionOpen] = useState(false);
  const [distributionPackageId, setDistributionPackageId] = useState('k8s-bundle');
  const [distributionVersion, setDistributionVersion] = useState('v1.31.4');
  const [distributionTargets, setDistributionTargets] = useState('10.24.16.31\n10.24.16.32\n10.24.16.33');
  const [sshPort, setSshPort] = useState(22);
  const [sshUser, setSshUser] = useState('root');
  const [credential, setCredential] = useState('sh-new-node-root');
  const [installK8s, setInstallK8s] = useState(true);
  const [initControlPlane, setInitControlPlane] = useState(false);
  const [uploadForm] = Form.useForm<UploadPackageValues>();

  const selectedDistributionPackage = packageRecords.find((item) => item.key === distributionPackageId) || packageRecords[0];
  const selectedTargetCount = distributionTargets.split(/[\n,]/).map((item) => item.trim()).filter(Boolean).length;

  const filteredPackages = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return packageRecords.filter((item) => {
      const matchesKeyword = !normalizedKeyword
        || item.name.toLowerCase().includes(normalizedKeyword)
        || item.description.toLowerCase().includes(normalizedKeyword)
        || item.currentVersion.toLowerCase().includes(normalizedKeyword);
      const matchesCategory = category === 'all' || item.category === category;
      const matchesArch = architecture === 'all' || item.arch.includes(architecture);
      const matchesK8s = k8sVersion === 'all'
        || item.k8sVersions.includes('通用')
        || item.k8sVersions.some((value) => value.includes(k8sVersion.replace('v', '').replace('.x', '')));
      return matchesKeyword && matchesCategory && matchesArch && matchesK8s;
    });
  }, [architecture, category, k8sVersion, keyword, packageRecords]);

  const openDistribution = (item = packageRecords[0], version = item.currentVersion) => {
    setDistributionPackageId(item.key);
    setDistributionVersion(version);
    setInstallK8s(item.category === 'kubernetes');
    setDistributionOpen(true);
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
  };

  const submitDistribution = () => {
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

    const newTask: DistributionTask = {
      key: `PKG-20260730-${String(tasks.length + 22).padStart(4, '0')}`,
      name: installK8s ? '新机器 K8s 初始化' : `${selectedDistributionPackage.name} 下发`,
      packageName: selectedDistributionPackage.name,
      version: distributionVersion,
      targets: `${distributionTargets.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)[0]} 等 ${selectedTargetCount} 台`,
      stage: 'SSH 连通性检查',
      progress: 8,
      status: 'running',
      createdAt: '2026-07-30 15:48',
    };
    setTasks((items) => [newTask, ...items]);
    setDistributionOpen(false);
    setActiveTab('tasks');
    message.success(`下发任务已创建，将通过 SSH 处理 ${selectedTargetCount} 台机器`);
  };

  const packageColumns: ColumnsType<SoftwarePackage> = [
    {
      title: '软件包',
      key: 'package',
      width: 310,
      render: (_, item) => (
        <div className="software-package-name">
          <span className={`software-package-icon ${item.category}`}>
            {item.category === 'kubernetes' ? <CloudServerOutlined /> : <FileZipOutlined />}
          </span>
          <span>
            <strong>{item.name}</strong>
            <small>{item.description}</small>
          </span>
        </div>
      ),
    },
    {
      title: '当前版本',
      dataIndex: 'currentVersion',
      width: 126,
      render: (value: string, item) => (
        <div className="software-package-version">
          <strong>{value}</strong>
          <Tag className={`package-status-tag ${item.status}`}>{statusLabels[item.status]}</Tag>
        </div>
      ),
    },
    {
      title: '适配 K8s',
      dataIndex: 'k8sVersions',
      width: 190,
      render: (values: string[]) => (
        <div className="software-package-k8s-tags">
          {values.map((value) => <Tag key={value}>{value}</Tag>)}
        </div>
      ),
    },
    {
      title: '系统 / 架构',
      key: 'system',
      width: 180,
      render: (_, item) => (
        <div className="software-package-system">
          <span>{item.os}</span>
          <small>{item.arch}</small>
        </div>
      ),
    },
    {
      title: '大小 / SHA256',
      key: 'file',
      width: 140,
      render: (_, item) => (
        <div className="software-package-system">
          <span>{item.size}</span>
          <small>{item.checksum}</small>
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 150,
      render: (value: string) => <span className="software-package-muted">{value}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 202,
      render: (_, item) => (
        <Space size={2} className="software-package-actions">
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => setVersionTarget(item)}>版本</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(item)}>下载</Button>
          <Button type="link" size="small" icon={<SendOutlined />} onClick={() => openDistribution(item)}>下发</Button>
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
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>上传软件包</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={() => openDistribution()}>新建下发</Button>
        </Space>
      </header>

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
            { title: '选择 K8s 套件', icon: <InboxOutlined /> },
            { title: 'SSH 下发', icon: <CloudDownloadOutlined /> },
            { title: '安装并校验', icon: <SafetyCertificateOutlined /> },
            { title: '创建 / 加入集群', icon: <CheckCircleFilled /> },
          ]}
        />
        <Button type="link" icon={<SendOutlined />} onClick={() => openDistribution()}>开始初始化</Button>
      </section>

      <section className="software-package-metrics">
        <article>
          <span className="purple"><InboxOutlined /></span>
          <div><small>软件包</small><strong>{packageRecords.length}</strong><em>已纳管</em></div>
        </article>
        <article>
          <span className="blue"><CodeOutlined /></span>
          <div><small>K8s 版本</small><strong>3</strong><em>v1.29 - v1.31</em></div>
        </article>
        <article>
          <span className="green"><CheckCircleFilled /></span>
          <div><small>可用版本</small><strong>{packageRecords.filter((item) => item.status === 'available').length}</strong><em>校验通过</em></div>
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
                onChange={setCategory}
                options={[
                  { value: 'all', label: '全部类型' },
                  ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label })),
                ]}
              />
              <Select
                value={k8sVersion}
                onChange={setK8sVersion}
                options={[
                  { value: 'all', label: '全部 K8s 版本' },
                  { value: 'v1.31', label: 'K8s v1.31' },
                  { value: 'v1.30', label: 'K8s v1.30' },
                  { value: 'v1.29', label: 'K8s v1.29' },
                ]}
              />
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
              <span>共 {filteredPackages.length} 个软件包</span>
            </div>
            <Table
              rowKey="key"
              columns={packageColumns}
              dataSource={filteredPackages}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 1490 }}
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
            <Table
              rowKey="version"
              pagination={false}
              dataSource={versionTarget.versions}
              columns={[
                {
                  title: '版本',
                  dataIndex: 'version',
                  render: (value: string) => (
                    <Space>
                      <strong>{value}</strong>
                      {value === versionTarget.currentVersion && <Tag color="purple">当前版本</Tag>}
                    </Space>
                  ),
                },
                { title: '上传时间', dataIndex: 'releasedAt' },
                { title: '大小', dataIndex: 'size', width: 100 },
                { title: 'SHA256', dataIndex: 'checksum', width: 120 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 90,
                  render: (value: PackageStatus) => <Tag className={`package-status-tag ${value}`}>{statusLabels[value]}</Tag>,
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 190,
                  render: (_, version) => (
                    <Space size={0}>
                      <Button type="link" size="small" onClick={() => handleDownload(versionTarget, version.version)}>下载</Button>
                      <Button type="link" size="small" onClick={() => {
                        openDistribution(versionTarget, version.version);
                        setVersionTarget(null);
                      }}>下发</Button>
                      {version.version !== versionTarget.currentVersion && version.status !== 'deprecated' && (
                        <Button type="link" size="small" onClick={() => handleSetCurrentVersion(version)}>设为当前</Button>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
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
        title="新建软件包下发"
        open={distributionOpen}
        onCancel={() => setDistributionOpen(false)}
        onOk={submitDistribution}
        okText={installK8s ? '下发并安装 K8s' : '创建下发任务'}
        cancelText="取消"
        width={860}
      >
        <div className="software-distribution-modal">
          <Steps
            size="small"
            current={0}
            items={[
              { title: '软件包' },
              { title: 'SSH 检查' },
              { title: '传输安装' },
              { title: '结果确认' },
            ]}
          />
          <div className="software-distribution-grid">
            <section>
              <h3>软件包配置</h3>
              <label>软件包</label>
              <Select
                value={distributionPackageId}
                onChange={(value) => {
                  const next = packageRecords.find((item) => item.key === value);
                  setDistributionPackageId(value);
                  if (next) {
                    setDistributionVersion(next.currentVersion);
                    setInstallK8s(next.category === 'kubernetes');
                  }
                }}
                options={packageRecords.map((item) => ({ value: item.key, label: item.name }))}
              />
              <label>版本</label>
              <Select
                value={distributionVersion}
                onChange={setDistributionVersion}
                options={(selectedDistributionPackage?.versions || []).map((item) => ({
                  value: item.version,
                  label: `${item.version}${item.version === selectedDistributionPackage?.currentVersion ? '（当前）' : ''}`,
                  disabled: item.status === 'deprecated',
                }))}
              />
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

            <section>
              <h3>目标机器与 SSH</h3>
              <label>目标 IP <em>每行一个，也可用逗号分隔</em></label>
              <Input.TextArea
                rows={4}
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
          </div>
          <div className="software-distribution-summary">
            <SafetyCertificateOutlined />
            <span>
              下发前置检查
              <small>将检查 {selectedTargetCount || 0} 台机器的 SSH 连通性、sudo 权限、磁盘空间、系统架构和 6443/10250 端口占用。</small>
            </span>
            <Tag color="purple">{selectedDistributionPackage?.name} {distributionVersion}</Tag>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SoftwarePackagePage;
