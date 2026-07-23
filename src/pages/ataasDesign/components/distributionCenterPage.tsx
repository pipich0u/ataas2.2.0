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
  Form,
  Input,
  message,
  Modal,
  Progress,
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
};

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

const initialTasks: DistributionTask[] = [
  { id: 1007, name: '下载 DeepSeek-V4 至模型主机', model: 'DeepSeek-V4-Flash-Base', type: 'download', source: 'HTTPS URL', target: 'model-store-02 · /models/', progress: 68, speed: '1.82 GB/s', status: 'running', updatedAt: Date.now(), updatedText: '刚刚' },
  { id: 1006, name: '同步 GLM-5.2 至生产集群', model: 'GLM-5.2', type: 'distribution', source: 'ops-transfer-01', target: 'gpu-prod-01 · 8 个 Nodes', progress: 42, speed: '3.24 GB/s', status: 'running', updatedAt: Date.now() - 120_000, updatedText: '2 分钟前' },
  { id: 1005, name: '下载 Kimi-K2.7-Code', model: 'Kimi-K2.7-Code', type: 'download', source: 'HTTPS URL', target: 'ops-transfer-01 · /data/models/', progress: 100, speed: '—', status: 'completed', updatedAt: Date.now() - 1_800_000, updatedText: '30 分钟前' },
  { id: 1004, name: '同步 DeepSeek-R1 至测试集群', model: 'DeepSeek-R1-0528', type: 'distribution', source: 'model-store-02', target: 'gpu-test-sh-01 · 4 个 Nodes', progress: 100, speed: '—', status: 'completed', updatedAt: Date.now() - 3_600_000, updatedText: '1 小时前' },
  { id: 1003, name: '下载 Qwen3-Coder-Next', model: 'Qwen3-Coder-Next', type: 'download', source: 'HTTPS URL', target: 'gpu-node-02 · /data/models/', progress: 37, speed: '—', status: 'stopped', updatedAt: Date.now() - 7_200_000, updatedText: '2 小时前' },
  { id: 1002, name: '同步 Qwen3-235B 至生产集群', model: 'Qwen3-235B-A22B', type: 'distribution', source: 'ops-transfer-01', target: 'gpu-prod-01 · 8 个 Nodes', progress: 91, speed: '—', status: 'failed', updatedAt: Date.now() - 10_800_000, updatedText: '3 小时前', detail: 'gpu-node-07 SSH 连接失败' },
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
  const [selectedModelId, setSelectedModelId] = useState(initialModels[0].id);
  const [selectedCopyId, setSelectedCopyId] = useState(initialModels[0].copies[0].id);
  const [downloadForm] = Form.useForm();
  const [distributionForm] = Form.useForm();

  const hostOptions = useMemo(() => {
    const hosts = [...new Set(models.flatMap((model) => model.copies.map((copy) => copy.host)))];
    return [{ value: 'all', label: '全部模型主机' }, ...hosts.map((host) => ({ value: host, label: host }))];
  }, [models]);

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

  const selectedModel = models.find((model) => model.id === selectedModelId) || models[0];

  const openDistribution = (modelId: string, copyId?: string) => {
    const model = models.find((item) => item.id === modelId);
    if (!model) return;
    const copy = model.copies.find((item) => item.id === copyId) || model.copies[0];
    setSelectedModelId(model.id);
    setSelectedCopyId(copy.id);
    distributionForm.setFieldsValue({
      taskName: `同步 ${model.name} 至生产集群`,
      modelId: model.id,
      copyId: copy.id,
      targetCluster: 'gpu-prod-01',
      targetPath: `/data/models/${model.name}`,
    });
    setDistributionOpen(true);
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
    if (!model || !copy) return;
    const task: DistributionTask = {
      id: Date.now(),
      name: values.taskName,
      model: model.name,
      type: 'distribution',
      source: copy.host,
      target: `${values.targetCluster} · 全部 Ready Nodes`,
      progress: 0,
      speed: '等待预检',
      status: 'running',
      updatedAt: Date.now(),
      updatedText: '刚刚',
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
          <Button type="link" size="small" onClick={() => message.info(record.detail || `${record.name}：${record.progress}%`)}>详情</Button>
          {record.status === 'running' && <Button type="link" danger size="small" onClick={() => setTasks((items) => items.map((item) => item.id === record.id ? { ...item, status: 'stopped', speed: '—', updatedAt: Date.now(), updatedText: '刚刚' } : item))}>停止</Button>}
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
        <Button icon={<CloudDownloadOutlined />} onClick={() => setDownloadOpen(true)}>下载模型</Button>
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

      <Modal title="创建模型下载任务" open={downloadOpen} width={700} okText="开始下载" onOk={createDownloadTask} onCancel={() => setDownloadOpen(false)}>
        <p className="distribution-modal-note">通过 HTTP／HTTPS URL 将远程模型下载到所选模型主机，下载完成后可继续创建分发任务。</p>
        <Form form={downloadForm} layout="vertical">
          <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}><Input placeholder="例如：下载 GLM-5.2 至模型主机" /></Form.Item>
          <Form.Item label="模型名称" name="modelName" rules={[{ required: true, message: '请输入模型名称' }]}><Input placeholder="例如：GLM-5.2" /></Form.Item>
          <Form.Item label="模型 URL" name="url" rules={[{ required: true, type: 'url', message: '请输入有效 URL' }]}><Input placeholder="https://example.com/models/model.tar.gz" /></Form.Item>
          <div className="distribution-form-grid">
            <Form.Item label="下载主机" name="host" rules={[{ required: true, message: '请选择主机' }]}><Select options={hostOptions.filter((item) => item.value !== 'all')} /></Form.Item>
            <Form.Item label="保存目录" name="path" initialValue="/data/models/" rules={[{ required: true, message: '请输入保存目录' }]}><Input /></Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal title="创建模型分发" open={distributionOpen} width={720} okText="创建并分发" onOk={createDistributionTask} onCancel={() => setDistributionOpen(false)}>
        <p className="distribution-modal-note">选择模型源副本和目标集群，创建后可在任务列表查看各节点进度与异常。</p>
        <Form form={distributionForm} layout="vertical">
          <div className="distribution-form-grid">
            <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}><Input /></Form.Item>
            <Form.Item label="模型" name="modelId" rules={[{ required: true }]}><Select options={models.map((model) => ({ value: model.id, label: model.name }))} onChange={(modelId) => {
              const model = models.find((item) => item.id === modelId);
              if (!model) return;
              setSelectedModelId(modelId);
              setSelectedCopyId(model.copies[0].id);
              distributionForm.setFieldValue('copyId', model.copies[0].id);
            }} /></Form.Item>
            <Form.Item label="源副本（主机）" name="copyId" rules={[{ required: true }]}><Select value={selectedCopyId} onChange={setSelectedCopyId} options={selectedModel.copies.map((copy) => ({ value: copy.id, label: `${copy.host} · ${copy.path}` }))} /></Form.Item>
            <Form.Item label="目标集群" name="targetCluster" rules={[{ required: true }]}><Select options={['gpu-prod-01', 'cluster-sh-02', 'gpu-test-sh-01'].map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item className="wide" label="目标目录" name="targetPath" rules={[{ required: true, message: '请输入目标目录' }]}><Input /></Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DistributionCenterPage;
