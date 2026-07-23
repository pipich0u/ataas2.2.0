import { DownloadOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, Progress, Select, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import './resourceManagementPages.less';

type DistributionKind = 'model' | 'image' | 'file';
type TaskStatus = 'running' | 'completed' | 'failed' | 'stopped';

type ModelItem = {
  id: string;
  name: string;
  family: string;
  host: string;
  path: string;
  size: string;
  updated: string;
};

type DistributionTask = {
  id: number;
  type: 'download' | 'distribution';
  name: string;
  model: string;
  target: string;
  progress: number;
  speed: string;
  status: TaskStatus;
  updated: string;
  error?: string;
};

const models: ModelItem[] = [
  { id: 'qwen-coder', name: 'Qwen2.5-Coder-32B-Instruct', family: 'Qwen · 代码模型', host: 'ops-transfer-01', path: '/data/models/Qwen2.5-Coder-32B-Instruct', size: '612.8 GB', updated: '今天 10:18' },
  { id: 'bge-m3', name: 'BAAI/bge-m3', family: 'Embedding · 检索模型', host: 'model-store-02', path: '/data/models/bge-m3', size: '18.6 GB', updated: '今天 09:52' },
  { id: 'deepseek-distill', name: 'DeepSeek-R1-Distill-Qwen-32B', family: 'DeepSeek · 推理模型', host: 'ops-transfer-01', path: '/data/models/DeepSeek-R1-Distill-Qwen-32B', size: '384.2 GB', updated: '今天 09:46' },
  { id: 'glm4', name: 'glm-4-9b-chat', family: 'GLM · 对话模型', host: 'gpu-node-07', path: '/models/glm-4-9b-chat', size: '172.4 GB', updated: '昨天 18:36' },
  { id: 'llama', name: 'Llama-3.1-70B-Instruct', family: 'Llama · 通用模型', host: 'model-store-02', path: '/data/models/Llama-3.1-70B-Instruct', size: '421.7 GB', updated: '昨天 16:20' },
  { id: 'reranker', name: 'bge-reranker-v2-m3', family: 'Reranker · 排序模型', host: 'ops-transfer-01', path: '/data/models/bge-reranker-v2-m3', size: '2.4 GB', updated: '昨天 14:08' },
];

const tasks: DistributionTask[] = [
  { id: 106, type: 'download', name: '下载 Qwen3-32B', model: 'Qwen3-32B', target: 'model-store-02 · /data/models', progress: 57, speed: '428 MB/s', status: 'running', updated: '刚刚' },
  { id: 101, type: 'distribution', name: 'Qwen2.5-Coder-32B 生产分发', model: 'Qwen2.5-Coder-32B-Instruct', target: 'gpu-prod-01 · 8 个节点', progress: 68, speed: '842 MB/s', status: 'running', updated: '刚刚' },
  { id: 102, type: 'distribution', name: 'bge-m3 检索模型同步', model: 'BAAI/bge-m3', target: 'cluster-sh-02 · 3 个节点', progress: 41, speed: '286 MB/s', status: 'running', updated: '12 秒前' },
  { id: 103, type: 'distribution', name: 'DeepSeek-R1 批量同步', model: 'DeepSeek-R1-Distill-Qwen-32B', target: 'gpu-test-sh-01 · 3 个节点', progress: 100, speed: '—', status: 'completed', updated: '今天 09:46' },
  { id: 104, type: 'distribution', name: 'GLM-4-9B 上海集群分发', model: 'glm-4-9b-chat', target: 'cluster-sh-02 · 4 个节点', progress: 73, speed: '—', status: 'failed', updated: '今天 09:18', error: 'sh-node-04 SSH 认证失败' },
  { id: 105, type: 'distribution', name: 'Llama-3.1-70B 测试分发', model: 'Llama-3.1-70B-Instruct', target: 'gpu-prod-01 · 2 个节点', progress: 30, speed: '—', status: 'stopped', updated: '昨天 18:32' },
];

const imageRows = [
  ['vllm/vllm-openai:v0.10.2', '推理运行环境', 'Harbor 主仓库', '8.42 GB', '今天 10:16'],
  ['nvidia/cuda:12.8.1-runtime', 'CUDA 运行时', 'Harbor 主仓库', '4.86 GB', '今天 09:42'],
  ['platform/node-agent:v2.6.0', '节点管理组件', '离线镜像仓库', '628 MB', '昨天 18:20'],
];

const fileRows = [
  ['NVIDIA-Linux-x86_64-550.54.run', '驱动包', '326 MB', 'ops-transfer-01', '今天 10:08'],
  ['kubernetes-v1.36.2-offline.tar.gz', '软件包', '1.86 GB', 'model-store-02', '今天 09:36'],
  ['node-agent-config-20260722.zip', '配置文件', '12.4 MB', 'ops-transfer-01', '今天 08:54'],
];

const statusText: Record<TaskStatus, string> = { running: '执行中', completed: '已完成', failed: '异常', stopped: '已停止' };
const statusColor: Record<TaskStatus, string> = { running: 'processing', completed: 'success', failed: 'error', stopped: 'default' };

const DistributionCenterPage = () => {
  const [kind, setKind] = useState<DistributionKind>('model');
  const [modelView, setModelView] = useState<'catalog' | 'tasks'>('catalog');
  const [keyword, setKeyword] = useState('');
  const [host, setHost] = useState('all');
  const [taskStatus, setTaskStatus] = useState<'all' | TaskStatus>('all');
  const [dialog, setDialog] = useState<'download' | 'distribution' | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [taskDetail, setTaskDetail] = useState<DistributionTask | null>(null);

  const filteredModels = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return models.filter((model) => (host === 'all' || model.host === host) && (!term || `${model.name} ${model.host} ${model.path}`.toLowerCase().includes(term)));
  }, [host, keyword]);

  const filteredTasks = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return tasks.filter((task) => (taskStatus === 'all' || task.status === taskStatus) && (!term || `${task.name} ${task.model} ${task.target}`.toLowerCase().includes(term)));
  }, [keyword, taskStatus]);

  const openDistribution = (model?: ModelItem) => {
    setSelectedModel(model || models[0]);
    setDialog('distribution');
  };

  const createTask = () => {
    message.success(dialog === 'download' ? '模型下载任务已创建' : '模型分发任务已创建');
    setDialog(null);
    setModelView('tasks');
  };

  return (
    <div className="resource-management-page distribution-center-page">
      <header className="resource-page-header">
        <div><h1>分发中心</h1><p>统一管理模型、镜像与文件的分发，支持创建任务、选择目标，并跟踪传输进度与异常。</p></div>
      </header>

      <nav className="distribution-kind-tabs" aria-label="分发类型">
        {([['model', '模型分发'], ['image', '镜像分发'], ['file', '文件分发']] as const).map(([key, label]) => (
          <button key={key} type="button" className={kind === key ? 'active' : ''} onClick={() => setKind(key)}>{label}</button>
        ))}
      </nav>

      {kind === 'model' && (
        <section className="distribution-pane">
          <div className="distribution-subtabs">
            <button type="button" className={modelView === 'catalog' ? 'active' : ''} onClick={() => setModelView('catalog')}>模型列表</button>
            <button type="button" className={modelView === 'tasks' ? 'active' : ''} onClick={() => setModelView('tasks')}>任务列表 <span>{tasks.length}</span></button>
          </div>
          <div className="distribution-toolbar">
            {modelView === 'catalog' ? <Select value={host} onChange={setHost} options={[{ value: 'all', label: '全部模型主机' }, ...Array.from(new Set(models.map((model) => model.host))).map((value) => ({ value }))]} /> : <Select value={taskStatus} onChange={setTaskStatus} options={[{ value: 'all', label: '全部状态' }, ...Object.entries(statusText).map(([value, label]) => ({ value, label }))]} />}
            <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder={modelView === 'catalog' ? '搜索模型名称、主机或目录' : '搜索任务、模型或目标'} allowClear />
            <span className="distribution-toolbar-spacer" />
            <Button icon={<ReloadOutlined />} aria-label="刷新" onClick={() => message.success('列表已刷新')} />
            {modelView === 'catalog' && <Button icon={<DownloadOutlined />} onClick={() => setDialog('download')}>下载模型</Button>}
            {modelView === 'catalog' && <Button type="primary" icon={<PlusOutlined />} onClick={() => openDistribution()}>创建分发</Button>}
          </div>

          {modelView === 'catalog' ? (
            <div className="model-catalog-grid">
              {filteredModels.map((model) => (
                <article key={model.id} className="model-catalog-card">
                  <div className="model-card-head"><span className="model-card-icon">M</span><div><strong>{model.name}</strong><small>{model.family}</small></div></div>
                  <dl><div><dt>所在主机</dt><dd>{model.host}</dd></div><div><dt>模型大小</dt><dd>{model.size}</dd></div><div className="full"><dt>模型目录</dt><dd>{model.path}</dd></div><div><dt>最近更新</dt><dd>{model.updated}</dd></div></dl>
                  <div className="model-card-actions"><Button type="link" onClick={() => { setKeyword(model.name); setModelView('tasks'); }}>查看任务</Button><Button type="primary" ghost onClick={() => openDistribution(model)}>创建分发</Button></div>
                </article>
              ))}
            </div>
          ) : (
            <div className="distribution-table-wrap">
              <table className="distribution-table">
                <thead><tr><th>任务／模型</th><th>任务类型</th><th>保存位置／分发目标</th><th>任务进度</th><th>实时速度</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
                <tbody>{filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td><strong>{task.name}</strong><small>{task.model}</small></td>
                    <td><span className={'distribution-task-type ' + task.type}>{task.type === 'download' ? '模型下载' : '模型分发'}</span></td>
                    <td>{task.target}</td>
                    <td><div className="task-progress"><Progress percent={task.progress} size="small" status={task.status === 'failed' ? 'exception' : undefined} showInfo={false} /><span>{task.progress}%</span></div>{task.error && <small className="task-error">{task.error}</small>}</td>
                    <td>{task.speed}</td><td><Tag color={statusColor[task.status]}>{statusText[task.status]}</Tag></td><td>{task.updated}</td>
                    <td><Button type="link" size="small" onClick={() => setTaskDetail(task)}>详情</Button>{task.status === 'running' && <Button type="link" danger size="small">停止</Button>}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
          <div className="distribution-pagination">共 {modelView === 'catalog' ? filteredModels.length : filteredTasks.length} 条 <span>1</span> 10 条／页</div>
        </section>
      )}

      {kind === 'image' && <SimpleDistributionTable title="镜像分发" description="将已登记镜像同步到目标集群的镜像仓库或节点。" action="创建镜像分发" headers={['镜像', '说明', '来源', '镜像大小', '最近更新']} rows={imageRows} />}
      {kind === 'file' && <SimpleDistributionTable title="文件分发" description="将驱动、软件包和配置文件同步到指定集群或主机。" action="创建文件分发" headers={['文件／软件包', '类型', '文件大小', '来源主机', '最近更新']} rows={fileRows} />}

      <Modal title={dialog === 'download' ? '创建模型下载任务' : '创建模型分发'} open={Boolean(dialog)} onCancel={() => setDialog(null)} onOk={createTask} okText={dialog === 'download' ? '开始下载' : '创建并分发'} width={720} destroyOnHidden>
        {dialog === 'download' ? <div className="resource-dialog-stack"><div className="resource-dialog-notice">通过 HTTP／HTTPS URL 将远程模型下载到所选主机的保存目录。</div><label>任务名称<Input placeholder="例如：下载 Qwen3-32B" /></label><label>模型 URL<Input placeholder="https://models.example.com/Qwen3-32B.tar.zst" /></label><label>下载主机<Select defaultValue="model-store-02" options={[{ value: 'ops-transfer-01' }, { value: 'model-store-02' }, { value: 'gpu-node-07' }]} /></label><label>保存目录<Input defaultValue="/data/models" /></label><Checkbox defaultChecked>启用断点续传并校验文件完整性</Checkbox></div> : <div className="resource-dialog-stack"><div className="resource-dialog-notice">选择模型和目标范围，提交后生成分发任务并持续跟踪各节点状态。</div><label>模型<Select value={selectedModel?.id} onChange={(id) => setSelectedModel(models.find((model) => model.id === id) || null)} options={models.map((model) => ({ value: model.id, label: model.name }))} /></label><label>源模型目录<Input value={selectedModel?.path} readOnly /></label><label>目标集群<Select defaultValue="gpu-prod-01" options={[{ value: 'gpu-prod-01' }, { value: 'cluster-sh-02' }, { value: 'gpu-test-sh-01' }]} /></label><label>目标目录<Input defaultValue="/data/models/" /></label><Checkbox defaultChecked>完成后校验文件大小与校验值</Checkbox></div>}
      </Modal>

      <Modal title="分发任务详情" open={Boolean(taskDetail)} onCancel={() => setTaskDetail(null)} footer={<Button onClick={() => setTaskDetail(null)}>关闭</Button>} width={760}>
        {taskDetail && <div className="task-detail"><div><span>任务名称</span><strong>{taskDetail.name}</strong></div><div><span>模型</span><strong>{taskDetail.model}</strong></div><div><span>目标</span><strong>{taskDetail.target}</strong></div><div><span>状态</span><Tag color={statusColor[taskDetail.status]}>{statusText[taskDetail.status]}</Tag></div><div className="full"><span>整体进度</span><Progress percent={taskDetail.progress} status={taskDetail.status === 'failed' ? 'exception' : undefined} /></div>{taskDetail.error && <div className="full task-detail-error"><span>异常信息</span><strong>{taskDetail.error}</strong></div>}</div>}
      </Modal>
    </div>
  );
};

const SimpleDistributionTable = ({ title, description, action, headers, rows }: { title: string; description: string; action: string; headers: string[]; rows: string[][] }) => (
  <section className="distribution-pane">
    <div className="simple-distribution-head"><div><strong>{title}</strong><span>{description}</span></div><Button type="primary" icon={<PlusOutlined />} onClick={() => message.info(`${action}入口已打开`)}>{action}</Button></div>
    <div className="distribution-toolbar"><Select defaultValue="all" options={[{ value: 'all', label: '全部来源' }]} /><Input prefix={<SearchOutlined />} placeholder={`搜索${title.replace('分发', '')}名称`} /><span className="distribution-toolbar-spacer" /><Button icon={<ReloadOutlined />} /></div>
    <div className="distribution-table-wrap"><table className="distribution-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}<th>操作</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</td>)}<td><Button type="link" size="small">分发</Button></td></tr>)}</tbody></table></div>
  </section>
);

export default DistributionCenterPage;
