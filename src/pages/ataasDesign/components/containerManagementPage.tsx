import { AppstoreOutlined, CodeOutlined, DeploymentUnitOutlined, FileOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Form, Input, Modal, Select, Space, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { createManualService, getServicePods, useK8sResourceStore } from './k8sResourceStore';
import './containerManagementPage.less';

type ServiceRow = {
  key: string;
  name: string;
  se: string;
  cluster: string;
  namespace: string;
  clusterIP: string;
  type: string;
  ports: string;
  endpoints: string;
  pods: number;
  age: string;
};

type PodRow = {
  key: string;
  name: string;
  cluster: string;
  namespace: string;
  role: 'router' | 'prefill' | 'decode' | 'business';
  status: 'Running' | 'Pending' | 'Failed';
  restart: number;
  image: string;
  yaml: string;
  ip: string;
  node: string;
  age: string;
};

export default function ContainerManagementPage() {
  const resourceStore = useK8sResourceStore();
  const [view, setView] = useState<'svc' | 'pod'>('svc');
  const [cluster, setCluster] = useState('全部集群');
  const [keyword, setKeyword] = useState('');
  const [yamlTarget, setYamlTarget] = useState<ServiceRow | PodRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const serviceRows = useMemo<ServiceRow[]>(() => resourceStore.state.services.map((service) => {
    const servicePods = getServicePods(resourceStore.state, service);
    const se = resourceStore.state.serviceEntries.find((entry) => entry.id === service.serviceEntryId);
    return {
      key: service.id,
      name: service.name,
      se: se?.name || '-',
      cluster: service.cluster,
      namespace: service.namespace,
      clusterIP: service.clusterIP,
      type: service.type,
      ports: service.ports.map((port) => `${port.name}: ${port.port}/${port.protocol}`).join(', '),
      endpoints: `${servicePods.filter((pod) => pod.status === 'Running').length} ready`,
      pods: servicePods.length,
      age: service.createdAt.includes('2026-') ? service.createdAt.slice(5, 16) : service.createdAt,
    };
  }), [resourceStore.state]);

  const podRows = useMemo<PodRow[]>(() => resourceStore.state.pods.map((pod) => ({
    key: pod.id,
    name: pod.name,
    cluster: pod.cluster,
    namespace: pod.namespace,
    role: pod.role,
    status: pod.status === 'Draft' ? 'Pending' : pod.status,
    restart: pod.restart,
    image: pod.image,
    yaml: `${pod.group || pod.namespace}/${pod.name}.yaml`,
    ip: pod.podIP,
    node: pod.node,
    age: pod.age,
  })), [resourceStore.state.pods]);

  const clusters = useMemo(() => ['全部集群', ...Array.from(new Set([...resourceStore.state.services.map((item) => item.cluster), ...resourceStore.state.pods.map((item) => item.cluster)]))], [resourceStore.state]);

  const filteredSvcs = useMemo(() => serviceRows.filter((row) => {
    const matchedCluster = cluster === '全部集群' || row.cluster === cluster;
    const text = `${row.name} ${row.se} ${row.namespace} ${row.clusterIP}`.toLowerCase();
    return matchedCluster && (!keyword || text.includes(keyword.toLowerCase()));
  }), [cluster, keyword]);

  const filteredPods = useMemo(() => podRows.filter((row) => {
    const matchedCluster = cluster === '全部集群' || row.cluster === cluster;
    const text = `${row.name} ${row.namespace} ${row.image} ${row.ip} ${row.node}`.toLowerCase();
    return matchedCluster && (!keyword || text.includes(keyword.toLowerCase()));
  }), [cluster, keyword]);

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, fixed: 'left', render: (value) => <strong className="ataas-cm-name">{value}</strong> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 120 },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 130 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: 'Cluster IP', dataIndex: 'clusterIP', key: 'clusterIP', width: 130, render: (value) => <span className="ataas-cm-code">{value}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: 'Ports', dataIndex: 'ports', key: 'ports', width: 150, render: (value) => <span className="ataas-cm-code">{value}</span> },
    { title: 'Endpoints', dataIndex: 'endpoints', key: 'endpoints', width: 110 },
    { title: 'POD', dataIndex: 'pods', key: 'pods', width: 80 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (value) => <span className="ataas-cm-muted">{value}</span> },
    { title: '操作', key: 'action', width: 110, fixed: 'right', render: (_, record) => (
      <Space size={2}>
        <Tooltip title="YAML"><Button type="text" size="small" icon={<FileOutlined />} onClick={() => setYamlTarget(record)} /></Tooltip>
        <Tooltip title="关联 POD"><Button type="text" size="small" icon={<DeploymentUnitOutlined />} onClick={() => { setView('pod'); setKeyword(record.name); }} /></Tooltip>
      </Space>
    ) },
  ];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'POD', dataIndex: 'name', key: 'name', width: 220, fixed: 'left', render: (value) => <strong className="ataas-cm-name">{value}</strong> },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 130 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 90, render: (value) => <span className="ataas-cm-role">{value}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (value) => <span className={`ataas-cm-status ${String(value).toLowerCase()}`}><i />{value}</span> },
    { title: '重启', dataIndex: 'restart', key: 'restart', width: 70, render: (value) => <span className="ataas-cm-muted">{value}</span> },
    { title: '镜像', dataIndex: 'image', key: 'image', width: 170, render: (value) => <span className="ataas-cm-ellipsis" title={value}>{value}</span> },
    { title: 'YAML', dataIndex: 'yaml', key: 'yaml', width: 190, render: (value, record) => (
      <button type="button" className="ataas-cm-yaml" onClick={() => setYamlTarget(record)}>
        <FileOutlined />
        <span title={value}>{value}</span>
      </button>
    ) },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120, render: (value) => <span className="ataas-cm-code">{value}</span> },
    { title: 'Node', dataIndex: 'node', key: 'node', width: 130 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (value) => <span className="ataas-cm-muted">{value}</span> },
    { title: '操作', key: 'action', width: 110, fixed: 'right', render: (_, record) => (
      <Space size={2}>
        <Tooltip title="控制台"><Button type="text" size="small" icon={<CodeOutlined />} onClick={() => message.info('控制台已打开')} /></Tooltip>
        <Tooltip title="日志"><Button type="text" size="small" icon={<InboxOutlined />} onClick={() => message.info(`${record.name} 日志加载中`)} /></Tooltip>
      </Space>
    ) },
  ];

  const yamlText = yamlTarget
    ? ('clusterIP' in yamlTarget
      ? resourceStore.state.services.find((item) => item.id === yamlTarget.key)?.yaml
      : resourceStore.state.pods.find((item) => item.id === yamlTarget.key)?.yaml) || ''
    : '';

  const openCreate = () => {
    form.setFieldsValue({ namespace: 'default', type: 'ClusterIP', port: 8000, cluster: cluster === '全部集群' ? 'beijing-prod' : cluster, yaml: '' });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const values = await form.validateFields();
    const service = createManualService({
      name: values.name,
      cluster: values.cluster,
      namespace: values.namespace,
      type: values.type,
      serviceEntryId: values.serviceEntryId,
      podIds: values.podIds || [],
      port: Number(values.port || 8000),
    });
    const nextService = values.yaml?.trim() ? { ...service, yaml: values.yaml.trim(), source: 'imported-yaml' as const } : service;
    resourceStore.addService(nextService);
    setView('svc');
    setCluster(nextService.cluster);
    setKeyword(nextService.name);
    message.success(`Service ${nextService.name} 已加入资源视图`);
    setCreateOpen(false);
    form.resetFields();
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <div className="ataas-cm-page">
        <div className="ataas-cm-head">
          <div>
            <h2>容器管理</h2>
          </div>
          <div className="ataas-cm-switch">
            <button type="button" className={view === 'svc' ? 'active' : ''} onClick={() => setView('svc')}><AppstoreOutlined />SVC</button>
            <i />
            <button type="button" className={view === 'pod' ? 'active' : ''} onClick={() => setView('pod')}><DeploymentUnitOutlined />POD</button>
          </div>
        </div>
        <div className="ataas-cm-toolbar">
          <div className="ataas-cm-toolbar-filters">
            <Select value={cluster} onChange={setCluster} options={clusters.map((item) => ({ value: item, label: item }))} />
            <Input.Search allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={view === 'svc' ? '搜索 SVC / SE / Cluster IP' : '搜索 POD / 镜像 / IP / Node'} />
          </div>
          {view === 'svc' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              创建 Service
            </Button>
          )}
        </div>
        {view === 'svc' ? (
          <Table<ServiceRow>
            className="ataas-cm-table"
            rowKey="key"
            columns={serviceColumns}
            dataSource={filteredSvcs}
            scroll={{ x: 1420 }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          />
        ) : (
          <Table<PodRow>
            className="ataas-cm-table"
            rowKey="key"
            columns={podColumns}
            dataSource={filteredPods}
            scroll={{ x: 1580 }}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
          />
        )}
        <Modal title="YAML" open={!!yamlTarget} onCancel={() => setYamlTarget(null)} footer={null} width={760}>
          <pre className="ataas-cm-yaml-preview">{yamlText}</pre>
        </Modal>
        <Modal
          title="创建 Service"
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onOk={submitCreate}
          okText="创建"
          cancelText="取消"
          width={560}
        >
          <Form form={form} layout="vertical" className="ataas-cm-create-form">
            <Form.Item name="name" label="Service 名称" rules={[{ required: true, message: '请输入名称' }]}>
              <Input placeholder="例如 business-api-svc" />
            </Form.Item>
            <Form.Item name="cluster" label="集群" rules={[{ required: true, message: '请选择集群' }]}>
              <Select options={clusters.filter((item) => item !== '全部集群').map((item) => ({ value: item, label: item }))} />
            </Form.Item>
            <Form.Item name="namespace" label="命名空间" rules={[{ required: true, message: '请输入命名空间' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="Service 类型" rules={[{ required: true, message: '请选择类型' }]}>
              <Select options={['ClusterIP', 'NodePort', 'LoadBalancer'].map((item) => ({ value: item, label: item }))} />
            </Form.Item>
            <Form.Item name="port" label="端口" rules={[{ required: true, message: '请输入端口' }]}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="serviceEntryId" label="绑定 SE">
              <Select allowClear options={resourceStore.state.serviceEntries.map((item) => ({ value: item.id, label: `${item.name} / ${item.cluster}` }))} />
            </Form.Item>
            <Form.Item name="podIds" label="关联 POD">
              <Select mode="multiple" allowClear placeholder="可为空，后续由模型部署同步后再关联" options={resourceStore.state.pods.map((pod) => ({ value: pod.id, label: `${pod.name} / ${pod.cluster}` }))} />
            </Form.Item>
            <Form.Item name="yaml" label="YAML">
              <Input.TextArea rows={5} placeholder="可选：从资源文件选择或粘贴 Service YAML，填写后以 YAML 内容为准保存展示" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  );
}
