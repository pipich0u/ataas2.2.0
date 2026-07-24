import { ConfigProvider, Input, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useK8sResourceStore } from './k8sResourceStore';

type ResourceView = 'svc' | 'se' | 'pod' | 'pv' | 'pvc';
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
  role: string;
  status: string;
  restart: number;
  image: string;
  ip: string;
  node: string;
  age: string;
};

type RouteEntry = {
  key: string;
  name: string;
  cluster: string;
  namespace: string;
  hosts: string[];
  ports: PortInfo[];
  endpoints: { address: string; weight: number }[];
};

type PVRow = {
  key: string;
  name: string;
  capacity: string;
  storageType: string;
  accessMode: string;
  status: string;
  reclaimPolicy: string;
  age: string;
};

type PVCRow = {
  key: string;
  name: string;
  namespace: string;
  requestCapacity: string;
  storageClass: string;
  status: string;
  boundPV: string;
  age: string;
};

type SummaryItem = {
  label: string;
  value: number;
  tone?: 'is-normal' | 'is-warning' | 'is-error';
};

const pvRows: PVRow[] = [];
const pvcRows: PVCRow[] = [];

const includesKeyword = (content: string, keyword: string) => (
  !keyword || content.toLowerCase().includes(keyword)
);

export default function ClusterResourceTables({
  className,
  view: initialView,
}: {
  className?: string;
  view: ResourceView;
}) {
  const [keyword, setKeyword] = useState('');
  const normalizedKeyword = keyword.trim().toLowerCase();
  const resourceStore = useK8sResourceStore();
  const { serviceEntries, services, pods } = resourceStore.state;

  const seNameMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceEntries.forEach((entry) => entry.serviceIds.forEach((serviceId) => map.set(serviceId, entry.name)));
    return map;
  }, [serviceEntries]);

  const serviceEndpointMap = useMemo(() => {
    const map = new Map<string, EndpointInfo[]>();
    serviceEntries.forEach((entry) => entry.endpoints.forEach((endpoint) => {
      const list = map.get(endpoint.serviceId) || [];
      list.push({ address: endpoint.address, weight: endpoint.weight });
      map.set(endpoint.serviceId, list);
    }));
    return map;
  }, [serviceEntries]);

  const storeServiceRows = useMemo<ServiceRow[]>(() => services.map((service) => ({
    key: service.id,
    name: service.name,
    se: seNameMap.get(service.id) || service.serviceEntryId || '-',
    cluster: service.cluster,
    namespace: service.namespace,
    clusterIP: service.clusterIP,
    type: service.type,
    ports: service.ports,
    endpoints: serviceEndpointMap.get(service.id) || [],
    pods: service.podIds.length,
    age: service.createdAt,
  })), [services, seNameMap, serviceEndpointMap]);

  const storePodRows = useMemo<PodRow[]>(() => pods.map((pod) => ({
    key: pod.id,
    name: pod.name,
    cluster: pod.cluster,
    namespace: pod.namespace,
    role: pod.role,
    status: pod.status === 'Draft' ? 'Pending' : pod.status,
    restart: pod.restart,
    image: pod.image,
    ip: pod.podIP,
    node: pod.node,
    age: pod.age,
  })), [pods]);

  const storeRouteData = useMemo<RouteEntry[]>(() => serviceEntries.map((entry) => {
    const entryServices = services.filter((service) => entry.serviceIds.includes(service.id));
    const seen = new Set<string>();
    const entryPorts: PortInfo[] = [];
    entryServices.forEach((service) => service.ports.forEach((port) => {
      const portKey = `${port.port}-${port.protocol}`;
      if (!seen.has(portKey)) {
        seen.add(portKey);
        entryPorts.push(port);
      }
    }));

    const endpoints = entry.endpoints.map((endpoint) => ({
      address: endpoint.address,
      weight: endpoint.weight,
    }));
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    if (totalWeight > 0) {
      endpoints.forEach((endpoint) => {
        endpoint.weight = Math.round((endpoint.weight / totalWeight) * 100);
      });
    }

    return {
      key: entry.id,
      name: entry.name,
      cluster: entry.cluster,
      namespace: entry.namespace,
      hosts: entry.hosts,
      ports: entryPorts,
      endpoints,
    };
  }), [serviceEntries, services]);

  const filteredServices = useMemo(() => storeServiceRows.filter((row) => includesKeyword(
    `${row.name} ${row.se} ${row.namespace} ${row.clusterIP} ${row.type}`,
    normalizedKeyword,
  )), [storeServiceRows, normalizedKeyword]);

  const filteredPods = useMemo(() => storePodRows.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.role} ${row.status} ${row.image} ${row.ip} ${row.node}`,
    normalizedKeyword,
  )), [storePodRows, normalizedKeyword]);

  const filteredRoutes = useMemo(() => storeRouteData.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.hosts.join(' ')} ${row.endpoints.map((endpoint) => endpoint.address).join(' ')}`,
    normalizedKeyword,
  )), [storeRouteData, normalizedKeyword]);

  const filteredPVs = useMemo(() => pvRows.filter((row) => includesKeyword(
    `${row.name} ${row.storageType} ${row.status}`,
    normalizedKeyword,
  )), [normalizedKeyword]);

  const filteredPVCs = useMemo(() => pvcRows.filter((row) => includesKeyword(
    `${row.name} ${row.namespace} ${row.storageClass} ${row.status} ${row.boundPV}`,
    normalizedKeyword,
  )), [normalizedKeyword]);

  const pageConfig = useMemo<{
    title: string;
    description: string;
    placeholder: string;
    summary: SummaryItem[];
  }>(() => {
    if (initialView === 'pod') {
      const running = storePodRows.filter((row) => row.status === 'Running').length;
      const pending = storePodRows.filter((row) => row.status === 'Pending').length;
      const failed = storePodRows.filter((row) => row.status === 'Failed').length;
      return {
        title: 'Pods',
        description: '查看 Pod 的运行状态、调度节点与重启情况',
        placeholder: '搜索 Pod 名称 / IP / Node',
        summary: [
          { label: 'Pod 总数', value: storePodRows.length },
          { label: '运行中', value: running, tone: 'is-normal' },
          { label: '等待中', value: pending, tone: pending ? 'is-warning' : undefined },
          { label: '异常', value: failed, tone: failed ? 'is-error' : undefined },
        ],
      };
    }

    if (initialView === 'svc') {
      return {
        title: 'Services',
        description: '查看 Service 的访问地址、端口与关联后端',
        placeholder: '搜索 Service / ServiceEntry / Cluster IP',
        summary: [
          { label: 'Service 总数', value: storeServiceRows.length },
          { label: 'ClusterIP', value: storeServiceRows.filter((row) => row.type === 'ClusterIP').length },
          { label: 'NodePort', value: storeServiceRows.filter((row) => row.type === 'NodePort').length },
          { label: '关联 Pods', value: storeServiceRows.reduce((sum, row) => sum + row.pods, 0) },
        ],
      };
    }

    if (initialView === 'se') {
      return {
        title: 'ServiceEntry',
        description: '查看网格出口服务、主机与端点配置',
        placeholder: '搜索 ServiceEntry / Host / Endpoint',
        summary: [
          { label: 'ServiceEntry 总数', value: storeRouteData.length },
          { label: 'Hosts', value: storeRouteData.reduce((sum, row) => sum + row.hosts.length, 0) },
          { label: 'Ports', value: storeRouteData.reduce((sum, row) => sum + row.ports.length, 0) },
          { label: 'Endpoints', value: storeRouteData.reduce((sum, row) => sum + row.endpoints.length, 0) },
        ],
      };
    }

    if (initialView === 'pv') {
      return {
        title: 'PV',
        description: '查看当前集群的持久卷资源',
        placeholder: '搜索 PV 名称 / 存储类型',
        summary: [{ label: 'PV 总数', value: pvRows.length }],
      };
    }

    return {
      title: 'PVC',
      description: '查看当前集群的持久卷声明',
      placeholder: '搜索 PVC 名称 / 命名空间 / 存储类',
      summary: [{ label: 'PVC 总数', value: pvcRows.length }],
    };
  }, [initialView, storePodRows, storeRouteData, storeServiceRows]);

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 150, render: (value) => <span className="resource-list-text">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    { title: 'Cluster IP', dataIndex: 'clusterIP', key: 'clusterIP', width: 160, render: (value) => <span className="resource-list-code">{value}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 120, render: (value) => <span className="resource-kind-tag">{value}</span> },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      width: 260,
      render: (ports: PortInfo[]) => (
        <div className="resource-list-lines is-inline">
          {ports.map((port, index) => (
            <span key={`${port.port}-${index}`} className="resource-list-code">
              {port.port} → {port.targetPort}{port.nodePort ? ` (node:${port.nodePort})` : ''} / {port.protocol.toLowerCase()}
            </span>
          ))}
          {ports.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    {
      title: 'Endpoints',
      dataIndex: 'endpoints',
      key: 'endpoints',
      width: 300,
      render: (endpoints: EndpointInfo[]) => (
        <div className="resource-list-lines">
          {endpoints.map((endpoint, index) => (
            <span key={`${endpoint.address}-${index}`} className="resource-list-code">{endpoint.address}</span>
          ))}
          {endpoints.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    { title: 'POD', dataIndex: 'pods', key: 'pods', width: 90 },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 150, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
  ];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'POD', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 110, render: (value) => <span className="resource-kind-tag">{value}</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value) => (
        <span className={`resource-list-status is-${String(value).toLowerCase()}`}>
          <i />
          {value}
        </span>
      ),
    },
    { title: '重启', dataIndex: 'restart', key: 'restart', width: 90 },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 140, render: (value) => <span className="resource-list-code">{value}</span> },
    { title: 'Node', dataIndex: 'node', key: 'node', width: 160, render: (value) => <span className="is-nowrap">{value}</span> },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 120, render: (value) => <span className="resource-list-muted is-nowrap">{value}</span> },
  ];

  const serviceEntryColumns: ColumnsType<RouteEntry> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 140 },
    {
      title: 'Hosts',
      dataIndex: 'hosts',
      key: 'hosts',
      width: 280,
      render: (hosts: string[]) => (
        <div className="resource-list-lines">
          {hosts.map((host) => <span key={host} className="resource-list-code">{host}</span>)}
        </div>
      ),
    },
    {
      title: 'Ports',
      dataIndex: 'ports',
      key: 'ports',
      width: 180,
      render: (ports: PortInfo[]) => (
        <div className="resource-list-lines">
          {ports.map((port, index) => (
            <span key={`${port.port}-${index}`} className="resource-list-code">{port.port} / {port.protocol.toLowerCase()}</span>
          ))}
          {ports.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
    {
      title: 'Endpoints（SVC）',
      dataIndex: 'endpoints',
      key: 'endpoints',
      width: 320,
      render: (endpoints: { address: string; weight: number }[]) => (
        <div className="resource-list-lines">
          {endpoints.map((endpoint, index) => (
            <span key={`${endpoint.address}-${index}`}>
              <span className="resource-list-code">{endpoint.address}</span>
              <small>{endpoint.weight}%</small>
            </span>
          ))}
          {endpoints.length === 0 && <span className="resource-list-muted">-</span>}
        </div>
      ),
    },
  ];

  const pvColumns: ColumnsType<PVRow> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 130 },
    { title: '存储类型', dataIndex: 'storageType', key: 'storageType', width: 150 },
    { title: '访问模式', dataIndex: 'accessMode', key: 'accessMode', width: 150 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
    { title: '回收策略', dataIndex: 'reclaimPolicy', key: 'reclaimPolicy', width: 140 },
    { title: '创建时间', dataIndex: 'age', key: 'age', width: 180 },
  ];

  const pvcColumns: ColumnsType<PVCRow> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 190, render: (value) => <span className="resource-list-name">{value}</span> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 150 },
    { title: '容量请求', dataIndex: 'requestCapacity', key: 'requestCapacity', width: 140 },
    { title: '存储类', dataIndex: 'storageClass', key: 'storageClass', width: 160 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
    { title: '绑定 PV', dataIndex: 'boundPV', key: 'boundPV', width: 180 },
    { title: '创建时间', dataIndex: 'age', key: 'age', width: 180 },
  ];

  const pagination = {
    pageSize: 10,
    size: 'small' as const,
    showTotal: (total: number) => `共 ${total} 条`,
  };

  const table = initialView === 'se' ? (
    <Table<RouteEntry>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={serviceEntryColumns}
      dataSource={filteredRoutes}
      scroll={{ x: 1110 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 ServiceEntry 数据' }}
    />
  ) : initialView === 'svc' ? (
    <Table<ServiceRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={serviceColumns}
      dataSource={filteredServices}
      scroll={{ x: 1560 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 Service 数据' }}
    />
  ) : initialView === 'pod' ? (
    <Table<PodRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={podColumns}
      dataSource={filteredPods}
      scroll={{ x: 1070 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 Pod 数据' }}
    />
  ) : initialView === 'pv' ? (
    <Table<PVRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={pvColumns}
      dataSource={filteredPVs}
      scroll={{ x: 1060 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 PV 数据' }}
    />
  ) : (
    <Table<PVCRow>
      className="group-list-table cluster-resource-list-table"
      rowKey="key"
      columns={pvcColumns}
      dataSource={filteredPVCs}
      scroll={{ x: 1120 }}
      pagination={pagination}
      locale={{ emptyText: '暂无 PVC 数据' }}
    />
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6951FF' }, components: { Table: { headerBg: '#F7F8FA' } } }}>
      <div className={['group-page-shell', 'cluster-resource-page', className].filter(Boolean).join(' ')}>
        <div className="group-page-head">
          <div className="group-page-title">
            <strong>{pageConfig.title}</strong>
            <span>{pageConfig.description}</span>
          </div>
          <div className="group-page-summary">
            {pageConfig.summary.map((item) => (
              <span key={item.label}>
                <small>{item.label}</small>
                <b className={item.tone}>{item.value}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="group-table-toolbar">
          <Input
            size="small"
            allowClear
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            prefix={<Search className="group-search-icon" />}
            placeholder={pageConfig.placeholder}
            className="group-search-input"
            style={{ width: 340 }}
          />
        </div>

        <div className="group-table-frame">
          {table}
        </div>
      </div>
    </ConfigProvider>
  );
}
