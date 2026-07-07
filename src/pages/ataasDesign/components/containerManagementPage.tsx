import { AppstoreOutlined, CodeOutlined, DeploymentUnitOutlined, DownOutlined, FileOutlined, FileSearchOutlined, InboxOutlined, PlusOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Drawer, Input, Modal, Select, Space, Table, Tooltip, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { rpc } from '@/lib/bus/rpc';
import { MonacoEditor } from '@/components/shared/MonacoEditor';
import type { ConfigCommitEntry, ConfigTreeNode } from '@/lib/types';
import './containerManagementPage.less';

type PortInfo = { port: number; targetPort: number; nodePort?: number; protocol: string };
type EndpointInfo = { address: string; weight?: number };

type ServiceRow = {
  key: string;
  name: string;
  se: string;
  cluster: string;
  namespace: string;
  clusterIP: string;
  type: string;
  ports: PortInfo[];
  endpoints: EndpointInfo[];
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
  const basePort = 30000 + no;
  return {
    key: 'svc-' + no,
    name: 'glm51-router-' + String(no).padStart(2, '0'),
    se: 'glm-5.1',
    cluster,
    namespace: 'default',
    clusterIP: '10.43.' + (21 + (index % 6)) + '.' + (18 + index),
    type: 'ClusterIP',
    ports: [
      { port: basePort, targetPort: basePort, nodePort: basePort + 6, protocol: 'TCP' },
      { port: basePort + 100, targetPort: basePort + 100, nodePort: basePort + 106, protocol: 'TCP' },
    ],
    endpoints: [
      { address: 'glm51-router-' + String(no).padStart(2, '0') + '.default.svc.cluster.local', weight: 100 },
    ],
    pods: 1 + (index % 3),
    age: (2 + (index % 9)) + 'd ' + (index % 20) + 'h',
  };
});

const podRows: PodRow[] = serviceRows.flatMap((svc, index) => {
  const router: PodRow = {
    key: 'router-' + svc.key,
    name: svc.name + '-router-0',
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'router',
    status: index % 9 === 0 ? 'Pending' : 'Running',
    restart: index % 5,
    image: 'sglang/router:v0.5.10',
    yaml: 'glm-5.1/' + svc.name + '-router.yaml',
    ip: '10.0.' + (index % 8) + '.' + (20 + index),
    node: 'worker-' + String(index % 12).padStart(3, '0'),
    age: svc.age,
  };
  const prefill: PodRow = {
    key: 'prefill-' + svc.key,
    name: svc.name + '-prefill-0',
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'prefill',
    status: index % 7 === 0 ? 'Failed' : 'Running',
    restart: (index + 1) % 4,
    image: 'sglang/worker:v0.5.10',
    yaml: 'glm-5.1/' + svc.name + '-prefill.yaml',
    ip: '10.1.' + (index % 8) + '.' + (20 + index),
    node: 'worker-' + String((index + 3) % 12).padStart(3, '0'),
    age: svc.age,
  };
  const decode: PodRow = {
    key: 'decode-' + svc.key,
    name: svc.name + '-decode-0',
    cluster: svc.cluster,
    namespace: svc.namespace,
    role: 'decode',
    status: 'Running',
    restart: index % 3,
    image: 'sglang/worker:v0.5.10',
    yaml: 'glm-5.1/' + svc.name + '-decode.yaml',
    ip: '10.2.' + (index % 8) + '.' + (20 + index),
    node: 'worker-' + String((index + 6) % 12).padStart(3, '0'),
    age: svc.age,
  };
  return [router, prefill, decode];
});

const clusters = ['全部集群', ...Array.from(new Set(serviceRows.map((item) => item.cluster)))];

/* ServiceEntry data */
type RouteEntry = {
  key: string; name: string; cluster: string; namespace: string;
  hosts: string[];
  endpoints: { address: string; weight: number }[];
};

const routeData: RouteEntry[] = [
  { key: "route-1", name: "glm-5.1", cluster: "beijing-prod", namespace: "higress-system", hosts: ["glm51.example.com"], endpoints: [{ address: "glm51-router.default.svc.cluster.local", weight: 100 }] },
  { key: "route-2", name: "deepseek-r1", cluster: "beijing-prod", namespace: "higress-system", hosts: ["deepseek.example.com"], endpoints: [{ address: "deepseek-router.default.svc.cluster.local", weight: 100 }] },
  { key: "route-3", name: "kimi-k2", cluster: "shanghai-online", namespace: "higress-system", hosts: ["kimi.example.com"], endpoints: [{ address: "kimi-router.default.svc.cluster.local", weight: 100 }] },
  { key: "route-4", name: "qwen-max", cluster: "shanghai-online", namespace: "higress-system", hosts: ["qwen.example.com"], endpoints: [{ address: "qwen-router.default.svc.cluster.local", weight: 100 }] },
  { key: "route-5", name: "minimax", cluster: "guangzhou-test", namespace: "higress-system", hosts: ["minimax.example.com"], endpoints: [{ address: "minimax-router.default.svc.cluster.local", weight: 100 }] },
  { key: "route-6", name: "glm-5.1-se", cluster: "shanghai-online", namespace: "higress-system", hosts: ["glm51-se.example.com"], endpoints: [{ address: "glm51-pd-router.default.svc.cluster.local", weight: 80 }, { address: "glm51-pd-bx-router.default.svc.cluster.local", weight: 20 }] },
  { key: "route-7", name: "deepseek-prod", cluster: "beijing-prod", namespace: "higress-system", hosts: ["deepseek-prod.example.com"], endpoints: [{ address: "deepseek-router.default.svc.cluster.local", weight: 55 }, { address: "deepseek-pd-router.default.svc.cluster.local", weight: 45 }] },
  { key: "route-8", name: "kimi-prod", cluster: "shanghai-online", namespace: "higress-system", hosts: ["kimi-prod.example.com"], endpoints: [{ address: "kimi-router.default.svc.cluster.local", weight: 70 }, { address: "kimi-pd-router.default.svc.cluster.local", weight: 30 }] },
];


export default function ContainerManagementPage() {
  const [view, setView] = useState<'se' | 'svc' | 'pod'>('se');
  const [cluster, setCluster] = useState('全部集群');
  const [keyword, setKeyword] = useState('');
  const [yamlTarget, setYamlTarget] = useState<ServiceRow | PodRow | null>(null);
  const [routeEditTarget, setRouteEditTarget] = useState<RouteEntry | null>(null);
  const [routeEditYaml, setRouteEditYaml] = useState('');
  const [routeEditOpen, setRouteEditOpen] = useState(false);

  /* 创建 Service 抽屉 */
  const [createOpen, setCreateOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceCluster, setServiceCluster] = useState<string>('');
  const [serviceYamlPath, setServiceYamlPath] = useState('');

  /* 创建 POD 抽屉 */
  const [podCreateOpen, setPodCreateOpen] = useState(false);
  const [podCreateName, setPodCreateName] = useState('');
  const [podCreateCluster, setPodCreateCluster] = useState<string>('');
  const [podCreateYamlPath, setPodCreateYamlPath] = useState('');

  /* 创建 ServiceEntry 抽屉 */
  const [seCreateOpen, setSeCreateOpen] = useState(false);
  const [seCreateName, setSeCreateName] = useState('');
  const [seCreateCluster, setSeCreateCluster] = useState<string>('');
  const [seCreateYamlPath, setSeCreateYamlPath] = useState('');

  / ── 从资源文件选择 YAML（含预览） ── */
  const [configYamlTree, setConfigYamlTree] = useState<ConfigTreeNode | null>(null);
  const [configYamlPickerOpen, setConfigYamlPickerOpen] = useState(false);
  const [configYamlSelectedPath, setConfigYamlSelectedPath] = useState('');
  const [configYamlPreview, setConfigYamlPreview] = useState('');
  const [configYamlLatest, setConfigYamlLatest] = useState('');
  const [configYamlHistory, setConfigYamlHistory] = useState<ConfigCommitEntry[]>([]);
  const [configYamlVersionKey, setConfigYamlVersionKey] = useState('latest');
  const [configYamlPickerLoading, setConfigYamlPickerLoading] = useState(false);
  const [configYamlTarget, setConfigYamlTarget] = useState<'service' | 'pod'>('service');

  useEffect(() => {
    loadConfigTree();
  }, []);

  const loadConfigTree = async () => {
    if (configYamlTree) return;
    setConfigYamlPickerLoading(true);
    try {
      const res = await rpc('config.list_tree');
      setConfigYamlTree(res.root);
    } catch {
      message.error('资源文件加载失败');
    }
    setConfigYamlPickerLoading(false);
  };

  const selectConfigYamlFile = async (path: string) => {
    setConfigYamlSelectedPath(path);
    setConfigYamlVersionKey('latest');
    setConfigYamlPickerLoading(true);
    try {
      const [fileRes, historyRes] = await Promise.all([
        rpc('config.get', { path }),
        rpc('config.history', { path }),
      ]);
      const latestYaml = fileRes.yaml || '';
      setConfigYamlLatest(latestYaml);
      setConfigYamlPreview(latestYaml);
      setConfigYamlHistory(historyRes.commits || []);
    } catch {
      message.error('YAML 读取失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const previewConfigYamlVersion = async (versionKey: string) => {
    if (!configYamlSelectedPath) return;
    setConfigYamlVersionKey(versionKey);
    if (versionKey === 'latest') {
      setConfigYamlPreview(configYamlLatest);
      return;
    }
    setConfigYamlPickerLoading(true);
    try {
      const res = await rpc('config.show_commit', { path: configYamlSelectedPath, hash: versionKey });
      setConfigYamlPreview(res.yaml || '');
    } catch {
      message.error('历史版本读取失败');
    } finally {
      setConfigYamlPickerLoading(false);
    }
  };

  const formatConfigYamlHistoryTime = (ts?: number) => {
    if (!ts) return '';
    const diffHours = Math.max(1, Math.round((Date.now() - ts) / 3600000));
    if (diffHours < 24) return diffHours + 'h ago';
    return Math.round(diffHours / 24) + 'd ago';
  };

  const handleApplyConfigYaml = () => {
    const selectedYaml = configYamlLatest || configYamlPreview;
    if (!configYamlSelectedPath || !selectedYaml.trim()) return;
    if (configYamlTarget === 'service') {
      setServiceYamlPath(configYamlSelectedPath);
    } else {
      setPodCreateYamlPath(configYamlSelectedPath);
    }
    setConfigYamlPickerOpen(false);
  };

  const resetCreateForm = () => {
    setServiceName('');
    setServiceCluster('');
    setServiceYamlPath('');
  };

  const resetPodCreateForm = () => {
    setPodCreateName('');
    setPodCreateCluster('');
    setPodCreateYamlPath('');
  };

  const handlePodCreate = () => {
    if (!podCreateName.trim()) { message.warning('请输入 POD 名称'); return; }
    if (!podCreateCluster) { message.warning('请选择集群'); return; }
    message.success('POD「' + podCreateName + '」创建成功！');
    setPodCreateOpen(false);
    resetPodCreateForm();
  };

  const handleCreate = () => {
    if (!serviceName.trim()) { message.warning('请输入服务名称'); return; }
    if (!serviceCluster) { message.warning('请选择集群'); return; }
    message.success('服务「' + serviceName + '」创建成功！');
    setCreateOpen(false);
    resetCreateForm();
  };

  const resetSeCreateForm = () => {
    setSeCreateName('');
    setSeCreateCluster('');
    setSeCreateYamlPath('');
  };

  const handleSeCreate = () => {
    if (!seCreateName.trim()) { message.warning('请输入 ServiceEntry 名称'); return; }
    if (!seCreateCluster) { message.warning('请选择集群'); return; }
    message.success('ServiceEntry「' + seCreateName + '」创建成功！');
    setSeCreateOpen(false);
    resetSeCreateForm();
  };

  /* ── 自定义资源文件树渲染 ── */
  const renderConfigName = (name: string) => {
    const parts = name.split(/(router|workers|worker|smg|glm|kimi|qwen)/gi);
    return (
      <span title={name}>
        {parts.map((part, index) => {
          const key = part.toLowerCase();
          const cls = key === 'router'
            ? 'part-router'
            : key === 'workers' || key === 'worker'
              ? 'part-workers'
              : key === 'smg'
                ? 'part-smg'
                : key === 'glm' || key === 'kimi' || key === 'qwen'
                  ? 'part-model'
                  : '';
          return cls ? <em key={`${part}-${index}`} className={cls}>{part}</em> : <span key={`${part}-${index}`}>{part}</span>;
        })}
      </span>
    );
  };

  const renderConfigYamlTree = (node: ConfigTreeNode, depth = 0): ReactNode => {
    const children = node.children || [];
    return children.map((child) => {
      if (child.is_dir) {
        return (
          <div key={child.path}>
            <div className="ataas-config-yaml-picker-dir" style={{ paddingLeft: 12 + depth * 14 }}>
              <DownOutlined />
              {renderConfigName(child.name)}
            </div>
            {renderConfigYamlTree(child, depth + 1)}
          </div>
        );
      }
      return (
        <button
          key={child.path}
          type="button"
          className={'ataas-config-yaml-picker-file' + (configYamlSelectedPath === child.path ? ' selected' : '')}
          style={{ paddingLeft: 24 + depth * 14 }}
          onClick={() => selectConfigYamlFile(child.path)}
        >
          <FileSearchOutlined />
          {renderConfigName(child.name)}
        </button>
      );
    });
  };

  const filteredSvcs = useMemo(() => serviceRows.filter((row) => {
    const matchedCluster = cluster === '全部集群' || row.cluster === cluster;
    const text = (row.name + ' ' + row.se + ' ' + row.namespace + ' ' + row.clusterIP).toLowerCase();
    return matchedCluster && (!keyword || text.includes(keyword.toLowerCase()));
  }), [cluster, keyword]);

  const filteredPods = useMemo(() => podRows.filter((row) => {
    const matchedCluster = cluster === '全部集群' || row.cluster === cluster;
    const text = (row.name + ' ' + row.namespace + ' ' + row.image + ' ' + row.ip + ' ' + row.node).toLowerCase();
    return matchedCluster && (!keyword || text.includes(keyword.toLowerCase()));
  }), [cluster, keyword]);

  const filteredRoutes = useMemo(() => routeData.filter((r) => {
    const matchedCluster = cluster === '全部集群' || r.cluster === cluster;
    const text = (r.name + ' ' + r.hosts.join(' ')).toLowerCase();
    return matchedCluster && (!keyword || text.includes(keyword.toLowerCase()));
  }), [cluster, keyword]);

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 120 },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 130 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: 'Cluster IP', dataIndex: 'clusterIP', key: 'clusterIP', width: 140, render: (v) => <span className="ataas-cm-code">{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    {
      title: 'Ports', dataIndex: 'ports', key: 'ports', width: 220,
      render: (ports: PortInfo[]) => (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 2 }}>
          {ports.map((p, i) => (
            <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#4E5969', whiteSpace: 'nowrap' }}>
              {p.port} → {p.targetPort}{p.nodePort ? ' (node:' + p.nodePort + ')' : ''} / {p.protocol.toLowerCase()}
            </span>
          ))}
        </div>
      ),
    },
    {
      title: 'Endpoints', dataIndex: 'endpoints', key: 'endpoints', width: 350,
      render: (endpoints: EndpointInfo[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {endpoints.map((ep, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4E5969', whiteSpace: 'nowrap' }}>
                {ep.address}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    { title: 'POD', dataIndex: 'pods', key: 'pods', width: 80 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (v) => <span className="ataas-cm-muted">{v}</span> },
    { title: '操作', key: 'action', width: 110, fixed: 'right', render: (_, record) => (
      <Space size={2}>
        <Tooltip title="YAML"><Button type="text" size="small" icon={<FileOutlined />} onClick={() => setYamlTarget(record)} /></Tooltip>
        <Tooltip title="关联 POD"><Button type="text" size="small" icon={<DeploymentUnitOutlined />} onClick={() => { setView('pod'); setKeyword(record.name); }} /></Tooltip>
      </Space>
    ) },
  ];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'POD', dataIndex: 'name', key: 'name', width: 220, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 130 },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 90, render: (v) => <span className="ataas-cm-role">{v}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => <span className={'ataas-cm-status ' + String(v).toLowerCase()}><i />{v}</span> },
    { title: '重启', dataIndex: 'restart', key: 'restart', width: 70, render: (v) => <span className="ataas-cm-muted">{v}</span> },
    { title: '镜像', dataIndex: 'image', key: 'image', width: 170, render: (v) => <span className="ataas-cm-ellipsis" title={v}>{v}</span> },
    { title: 'YAML', dataIndex: 'yaml', key: 'yaml', width: 190, render: (v, record) => (
      <button type="button" className="ataas-cm-yaml" onClick={() => setYamlTarget(record)}>
        <FileOutlined />
        <span title={v}>{v}</span>
      </button>
    ) },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120, render: (v) => <span className="ataas-cm-code">{v}</span> },
    { title: 'Node', dataIndex: 'node', key: 'node', width: 130 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (v) => <span className="ataas-cm-muted">{v}</span> },
    { title: '操作', key: 'action', width: 110, fixed: 'right', render: (_, record) => (
      <Space size={2}>
        <Tooltip title="控制台"><Button type="text" size="small" icon={<CodeOutlined />} onClick={() => message.info('控制台已打开')} /></Tooltip>
        <Tooltip title="日志"><Button type="text" size="small" icon={<InboxOutlined />} onClick={() => message.info(record.name + ' 日志加载中')} /></Tooltip>
      </Space>
    ) },
  ];

  const seColumns: ColumnsType<RouteEntry> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: '集群', dataIndex: 'cluster', key: 'cluster', width: 100 },
    { title: 'Hosts', dataIndex: 'hosts', key: 'hosts', width: 240, render: (hosts: string[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hosts.map((h, i) => <span key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: '#4E5969' }}>{h}</span>)}
      </div>
    ) },
    { title: 'Endpoints', dataIndex: 'endpoints', key: 'endpoints', width: 280, render: (endpoints: { address: string; weight: number }[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {endpoints.map((ep, i) => (
          <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#4E5969', whiteSpace: 'nowrap' }}>
            {ep.address} <span style={{ color: '#86909C' }}>({ep.weight}%)</span>
          </span>
        ))}
      </div>
    ) },
    { title: '操作', key: 'action', width: 100, fixed: 'right', render: (_, record) => (
      <Space size={2}>
        <Tooltip title="YAML"><Button type="text" size="small" icon={<FileOutlined />} onClick={() => { setRouteEditTarget(record); setRouteEditYaml('apiVersion: networking.istio.io/v1beta1\nkind: ServiceEntry\nmetadata:\n  name: ' + record.name + '\n  namespace: ' + record.namespace + '\nspec:\n  hosts:\n' + record.hosts.map((h) => '  - ' + h).join('\n') + '\n  location: MESH_INTERNAL\n  ports:\n  - number: 80\n    name: http\n    protocol: TCP\n  resolution: DNS\n  endpoints:\n' + record.endpoints.map((ep) => '  - address: ' + ep.address + '\n    weight: ' + ep.weight).join('\n')); setRouteEditOpen(true); }} /></Tooltip>
      </Space>
    ) },
  ];

  const yamlText = yamlTarget
    ? 'apiVersion: v1\nkind: ' + ('clusterIP' in yamlTarget ? 'Service' : 'Pod') + '\nmetadata:\n  name: ' + yamlTarget.name + '\n  namespace: ' + yamlTarget.namespace + '\nspec:\n  cluster: ' + yamlTarget.cluster + '\n'
    : '';

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <div className="ataas-cm-page">
        <div className="ataas-cm-head">
          <div>
            <h2>容器管理</h2>
          </div>
          <div className="ataas-cm-switch">
            <button type="button" className={view === 'se' ? 'active' : ''} onClick={() => setView('se')}><FileSearchOutlined />SE</button>
            <i />
            <button type="button" className={view === 'svc' ? 'active' : ''} onClick={() => setView('svc')}><AppstoreOutlined />SVC</button>
            <i />
            <button type="button" className={view === 'pod' ? 'active' : ''} onClick={() => setView('pod')}><DeploymentUnitOutlined />POD</button>
          </div>
        </div>
        <div className="ataas-cm-toolbar">
          <div className="ataas-cm-toolbar-filters">
            <Select value={cluster} onChange={setCluster} options={clusters.map((item) => ({ value: item, label: item }))} />
            <Input.Search allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={view === 'se' ? '搜索 SE / Host' : view === 'svc' ? '搜索 SVC / SE / Cluster IP' : '搜索 POD / 镜像 / IP / Node'} />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => view === 'se' ? (resetSeCreateForm(), setSeCreateOpen(true)) : view === 'svc' ? (resetCreateForm(), setCreateOpen(true)) : (resetPodCreateForm(), setPodCreateOpen(true))}>
            {view === 'se' ? '创建ServiceEntry' : view === 'svc' ? '创建 Service' : '新建 POD'}
          </Button>
        </div>
        {view === 'se' ? (
          <Table<RouteEntry>
            className="ataas-cm-table"
            rowKey="key"
            columns={seColumns}
            dataSource={filteredRoutes}
            scroll={{ x: 1000 }}
            pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条路由' }}
          />
        ) : view === 'svc' ? (
          <Table<ServiceRow>
            className="ataas-cm-table"
            rowKey="key"
            columns={serviceColumns}
            dataSource={filteredSvcs}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }}
          />
        ) : (
          <Table<PodRow>
            className="ataas-cm-table"
            rowKey="key"
            columns={podColumns}
            dataSource={filteredPods}
            scroll={{ x: 1580 }}
            pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }}
          />
        )}
        <Modal title="YAML" open={!!yamlTarget} onCancel={() => setYamlTarget(null)} footer={null} width={760}>
          <pre className="ataas-cm-yaml-preview">{yamlText}</pre>
        </Modal>
        <Modal title={'YAML - ' + (routeEditTarget?.name || '')} open={routeEditOpen} onCancel={() => setRouteEditOpen(false)} footer={null} width={860}>
          <div>
            <Input.TextArea value={routeEditYaml} onChange={(e) => setRouteEditYaml(e.target.value)} rows={24} style={{ fontFamily: 'Menlo, Monaco, Consolas, monospace', fontSize: 12, lineHeight: 1.6 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <Button onClick={() => setRouteEditOpen(false)}>取消</Button>
              <Button type="primary" onClick={() => { message.success('YAML 已保存'); setRouteEditOpen(false); }}>保存</Button>
            </div>
          </div>
        </Modal>

        {/* 创建 Service 抽屉 */}
        <Drawer
          title="创建 Service"
          open={createOpen}
          onClose={() => { setCreateOpen(false); resetCreateForm(); }}
          width={560}
          footer={
            <div className="ataas-drawer-footer">
              <Button onClick={() => { setCreateOpen(false); resetCreateForm(); }}>取消</Button>
              <Button type="primary" onClick={handleCreate}>确定</Button>
            </div>
          }
        >
          <div className="ataas-cm-create-form">
            <div className="ataas-cm-create-field">
              <label>Service名称 <span style={{ color: '#d92d20' }}>*</span></label>
              <Input
                placeholder="例如: glm51-router-01"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>集群 <span style={{ color: '#d92d20' }}>*</span></label>
              <Select
                value={serviceCluster || undefined}
                onChange={setServiceCluster}
                placeholder="请选择集群"
                style={{ width: '100%' }}
                options={[
                  { value: 'beijing-prod', label: 'beijing-prod' },
                  { value: 'shanghai-online', label: 'shanghai-online' },
                  { value: 'guangzhou-test', label: 'guangzhou-test' },
                ]}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>YAML 文件</label>
              <div className="ataas-cm-create-yaml-row">
                {serviceYamlPath ? (
                  <div className="ataas-cm-selected-yaml">
                    <FileSearchOutlined />
                    <span>{serviceYamlPath}</span>
                    <button
                      type="button"
                      className="ataas-cm-remove-yaml"
                      onClick={() => setServiceYamlPath('')}
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <span className="ataas-cm-select-yaml-hint">未选择</span>
                )}
                <Tooltip title="从资源文件选择">
                  <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { setConfigYamlTarget('service'); loadConfigTree(); setConfigYamlPickerOpen(true); }} />
                </Tooltip>
            </div>
          </div>
        </div>
        </Drawer>

        {/* 创建 POD 抽屉 */}
        <Drawer
          title="新建 POD"
          open={podCreateOpen}
          onClose={() => { setPodCreateOpen(false); resetPodCreateForm(); }}
          width={560}
          footer={
            <div className="ataas-drawer-footer">
              <Button onClick={() => { setPodCreateOpen(false); resetPodCreateForm(); }}>取消</Button>
              <Button type="primary" onClick={handlePodCreate}>确定</Button>
            </div>
          }
        >
          <div className="ataas-cm-create-form">
            <div className="ataas-cm-create-field">
              <label>POD 名称 <span style={{ color: '#d92d20' }}>*</span></label>
              <Input
                placeholder="例如: glm51-router-0"
                value={podCreateName}
                onChange={(e) => setPodCreateName(e.target.value)}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>集群 <span style={{ color: '#d92d20' }}>*</span></label>
              <Select
                value={podCreateCluster || undefined}
                onChange={setPodCreateCluster}
                placeholder="请选择集群"
                style={{ width: '100%' }}
                options={[
                  { value: 'beijing-prod', label: 'beijing-prod' },
                  { value: 'shanghai-online', label: 'shanghai-online' },
                  { value: 'guangzhou-test', label: 'guangzhou-test' },
                ]}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>YAML 文件</label>
              <div className="ataas-cm-create-yaml-row">
                {podCreateYamlPath ? (
                  <div className="ataas-cm-selected-yaml">
                    <FileSearchOutlined />
                    <span>{podCreateYamlPath}</span>
                    <button
                      type="button"
                      className="ataas-cm-remove-yaml"
                      onClick={() => setPodCreateYamlPath('')}
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <span className="ataas-cm-select-yaml-hint">未选择</span>
                )}
                <Tooltip title="从资源文件选择">
                  <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { setConfigYamlTarget('pod'); loadConfigTree(); setConfigYamlPickerOpen(true); }} />
                </Tooltip>
              </div>
            </div>
          </div>
        </Drawer>

        {/* 从资源文件选择 YAML — 完整三栏（文件树 + 历史版本 + YAML 预览） */}
        <Modal
          className="ataas-config-yaml-picker-modal"
          title="从资源文件选择 YAML"
          open={configYamlPickerOpen}
          onCancel={() => { setConfigYamlPickerOpen(false); setConfigYamlSelectedPath(''); }}
          width={1140}
          footer={
            <div className="ataas-config-yaml-picker-footer">
              <span className="ataas-config-yaml-picker-warning"><WarningOutlined /> 部署时始终使用文件的最新内容，历史版本仅供参考对比</span>
              <div>
                <Button onClick={() => { setConfigYamlPickerOpen(false); setConfigYamlSelectedPath(''); }}>取消</Button>
                <Button type="primary" disabled={!configYamlSelectedPath || !(configYamlLatest || configYamlPreview).trim()} onClick={handleApplyConfigYaml}>确认选择</Button>
              </div>
            </div>
          }
        >
          <div className={'ataas-config-yaml-picker' + (configYamlSelectedPath ? ' has-history' : '')}>
            {/* 左：文件树 */}
            <div className="ataas-config-yaml-picker-tree">
              <div className="ataas-config-yaml-picker-title">文件</div>
              <div className="ataas-config-yaml-picker-tree-body">
                {configYamlPickerLoading && !configYamlTree ? (
                  <div className="ataas-config-yaml-picker-empty">加载中...</div>
                ) : configYamlTree ? (
                  renderConfigYamlTree(configYamlTree)
                ) : (
                  <div className="ataas-config-yaml-picker-empty">暂无配置文件</div>
                )}
              </div>
            </div>
            {/* 中：历史版本 */}
            {configYamlSelectedPath && (
              <div className="ataas-config-yaml-picker-history">
                <div className="ataas-config-yaml-picker-title">历史版本</div>
                <div className="ataas-config-yaml-picker-history-body">
                  <button
                    type="button"
                    className={'ataas-config-yaml-picker-version' + (configYamlVersionKey === 'latest' ? ' selected' : '')}
                    onClick={() => previewConfigYamlVersion('latest')}
                  >
                    <strong>latest（最新）</strong>
                  </button>
                  {configYamlHistory.map((item) => (
                    <button
                      type="button"
                      key={item.hash}
                      className={'ataas-config-yaml-picker-version' + (configYamlVersionKey === item.hash ? ' selected' : '')}
                      onClick={() => previewConfigYamlVersion(item.hash)}
                    >
                      <span><em>{item.hash.slice(0, 6)}</em>{item.message}</span>
                      <small>{formatConfigYamlHistoryTime(item.ts_ms)}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* 右：YAML 预览 */}
            <div className="ataas-config-yaml-picker-preview">
              <div className="ataas-config-yaml-picker-title">
                {configYamlSelectedPath ? (configYamlSelectedPath.toUpperCase() + ' ' + (configYamlVersionKey === 'latest' ? 'LATEST' : configYamlVersionKey.slice(0, 6))) : 'YAML 预览'}
              </div>
              {configYamlSelectedPath ? (
                <MonacoEditor
                  key={configYamlSelectedPath + '-' + configYamlVersionKey}
                  value={configYamlPreview}
                  language="yaml"
                  height="100%"
                  className="ataas-config-yaml-picker-editor"
                  onChange={configYamlVersionKey === 'latest' ? (value) => {
                    setConfigYamlPreview(value);
                    setConfigYamlLatest(value);
                  } : undefined}
                  options={{
                    fontSize: 11,
                    lineHeight: 18,
                    fontWeight: '400',
                    minimap: { enabled: true, side: 'right', size: 'proportional', showSlider: 'mouseover' },
                    scrollbar: { verticalScrollbarSize: 9, horizontalScrollbarSize: 9 },
                    overviewRulerLanes: 0,
                    renderLineHighlight: 'line',
                    wordWrap: 'off',
                    readOnly: configYamlVersionKey !== 'latest',
                    domReadOnly: configYamlVersionKey !== 'latest',
                  }}
                />
              ) : (
                <div className="ataas-config-yaml-picker-empty" style={{ height: '100%' }}>请在左侧文件树中选择一个文件</div>
              )}
            </div>
          </div>
        </Modal>

        {/* 创建 ServiceEntry 抽屉 */}
        <Drawer
          title="创建 ServiceEntry"
          open={seCreateOpen}
          onClose={() => { setSeCreateOpen(false); resetSeCreateForm(); }}
          width={560}
          footer={
            <div className="ataas-drawer-footer">
              <Button onClick={() => { setSeCreateOpen(false); resetSeCreateForm(); }}>取消</Button>
              <Button type="primary" onClick={handleSeCreate}>确定</Button>
            </div>
          }
        >
          <div className="ataas-cm-create-form">
            <div className="ataas-cm-create-field">
              <label>ServiceEntry名称 <span style={{ color: '#d92d20' }}>*</span></label>
              <Input
                placeholder="例如: glm-5.1"
                value={seCreateName}
                onChange={(e) => setSeCreateName(e.target.value)}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>集群 <span style={{ color: '#d92d20' }}>*</span></label>
              <Select
                value={seCreateCluster || undefined}
                onChange={setSeCreateCluster}
                placeholder="请选择集群"
                style={{ width: '100%' }}
                options={[
                  { value: 'beijing-prod', label: 'beijing-prod' },
                  { value: 'shanghai-online', label: 'shanghai-online' },
                  { value: 'guangzhou-test', label: 'guangzhou-test' },
                ]}
              />
            </div>
            <div className="ataas-cm-create-field">
              <label>YAML 文件</label>
              <div className="ataas-cm-create-yaml-row">
                {seCreateYamlPath ? (
                  <div className="ataas-cm-selected-yaml">
                    <FileSearchOutlined />
                    <span>{seCreateYamlPath}</span>
                    <button
                      type="button"
                      className="ataas-cm-remove-yaml"
                      onClick={() => setSeCreateYamlPath('')}
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <span className="ataas-cm-select-yaml-hint">未选择</span>
                )}
                <Tooltip title="从资源文件选择">
                  <Button type="text" size="small" icon={<UploadOutlined />} onClick={() => { setConfigYamlTarget('service'); loadConfigTree(); setConfigYamlPickerOpen(true); }} />
                </Tooltip>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </ConfigProvider>
  );
}
