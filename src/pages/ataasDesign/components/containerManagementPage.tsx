import { AppstoreOutlined, CodeOutlined, DeploymentUnitOutlined, FileOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Modal, Select, Space, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
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

const serviceRows: ServiceRow[] = Array.from({ length: 30 }, (_, index) => {
  const no = index + 1;
  const cluster = index % 3 === 0 ? 'beijing-prod' : index % 3 === 1 ? 'shanghai-online' : 'guangzhou-test';
  return {
    key: `svc-${no}`,
    name: `glm51-router-${String(no).padStart(2, '0')}`,
    se: 'glm-5.1',
    cluster,
    namespace: 'default',
    clusterIP: `10.43.${21 + (index % 6)}.${18 + index}`,
    type: 'ClusterIP',
    ports: 'http: 8000/TCP',
    endpoints: `${1 + (index % 4)} ready`,
    pods: 1 + (index % 3),
    age: `${2 + (index % 9)}d ${index % 20}h`,
  };
});

const podRows: PodRow[] = serviceRows.flatMap((svc, index) => {
  const router: PodRow = {
    key: `router-${svc.key}`,
    name: `${svc.name}-router-0`,
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'router',
    status: index % 9 === 0 ? 'Pending' : 'Running',
    restart: index % 5,
    image: 'sglang/router:v0.5.10',
    yaml: `glm-5.1/${svc.name}-router.yaml`,
    ip: `10.0.${index % 8}.${20 + index}`,
    node: `worker-${String(index % 12).padStart(3, '0')}`,
    age: svc.age,
  };
  const prefill: PodRow = {
    key: `prefill-${svc.key}`,
    name: `${svc.name}-prefill-0`,
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'prefill',
    status: index % 7 === 0 ? 'Failed' : 'Running',
    restart: (index + 1) % 4,
    image: 'sglang/worker:v0.5.10',
    yaml: `glm-5.1/${svc.name}-prefill.yaml`,
    ip: `10.1.${index % 8}.${20 + index}`,
    node: `worker-${String((index + 3) % 12).padStart(3, '0')}`,
    age: svc.age,
  };
  const decode: PodRow = {
    key: `decode-${svc.key}`,
    name: `${svc.name}-decode-0`,
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'decode',
    status: 'Running',
    restart: index % 3,
    image: 'sglang/worker:v0.5.10',
    yaml: `glm-5.1/${svc.name}-decode.yaml`,
    ip: `10.2.${index % 8}.${20 + index}`,
    node: `worker-${String((index + 6) % 12).padStart(3, '0')}`,
    age: svc.age,
  };
  return [router, prefill, decode];
});

const clusters = ['全部集群', ...Array.from(new Set(serviceRows.map((item) => item.cluster)))];

export default function ContainerManagementPage() {
  const [view, setView] = useState<'svc' | 'pod'>('svc');
  const [cluster, setCluster] = useState('全部集群');
  const [keyword, setKeyword] = useState('');
  const [yamlTarget, setYamlTarget] = useState<ServiceRow | PodRow | null>(null);

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
    ? `apiVersion: ${'clusterIP' in yamlTarget ? 'v1' : 'v1'}\nkind: ${'clusterIP' in yamlTarget ? 'Service' : 'Pod'}\nmetadata:\n  name: ${yamlTarget.name}\n  namespace: ${yamlTarget.namespace}\nspec:\n  cluster: ${yamlTarget.cluster}\n`
    : '';

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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.success(view === 'svc' ? '创建 Service 抽屉已打开' : '创建 POD 抽屉已打开')}>
            {view === 'svc' ? '创建 Service' : '新建 POD'}
          </Button>
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
      </div>
    </ConfigProvider>
  );
}
