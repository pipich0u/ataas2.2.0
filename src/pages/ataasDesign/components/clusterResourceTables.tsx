import { ConfigProvider, Input, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useK8sResourceStore } from './k8sResourceStore';
import './containerManagementPage.less';

type PortInfo = { port: number; targetPort: number; nodePort?: number; protocol: string };
type EndpointInfo = { address: string; weight?: number };

type ServiceRow = {
  key: string; name: string; se: string; cluster: string; namespace: string;
  clusterIP: string; type: string; ports: PortInfo[]; endpoints: EndpointInfo[]; pods: number; age: string;
};

type PodRow = {
  key: string; name: string; cluster: string; namespace: string;
  role: string; status: string; restart: number; image: string; ip: string; node: string; age: string;
};

type RouteEntry = {
  key: string; name: string; cluster: string; namespace: string;
  hosts: string[]; ports: PortInfo[];
  endpoints: { address: string; weight: number }[];
};

export default function ClusterResourceTables({ className, view: initialView }: { className?: string; view: 'svc' | 'se' | 'pod' }) {
  const [keyword, setKeyword] = useState('');

  const resourceStore = useK8sResourceStore();
  const { serviceEntries, services, pods } = resourceStore.state;

  const seNameMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceEntries.forEach((se) => se.serviceIds.forEach((sid) => map.set(sid, se.name)));
    return map;
  }, [serviceEntries]);

  const serviceEndpointMap = useMemo(() => {
    const map = new Map<string, EndpointInfo[]>();
    serviceEntries.forEach((se) => se.endpoints.forEach((ep) => {
      const list = map.get(ep.serviceId) || [];
      list.push({ address: ep.address, weight: ep.weight });
      map.set(ep.serviceId, list);
    }));
    return map;
  }, [serviceEntries]);

  const storeServiceRows = useMemo<ServiceRow[]>(() => services.map((svc) => ({
    key: svc.id, name: svc.name, se: seNameMap.get(svc.id) || svc.serviceEntryId || '-',
    cluster: svc.cluster, namespace: svc.namespace, clusterIP: svc.clusterIP, type: svc.type,
    ports: svc.ports, endpoints: serviceEndpointMap.get(svc.id) || [], pods: svc.podIds.length, age: svc.createdAt,
  })), [services, seNameMap, serviceEndpointMap]);

  const storePodRows = useMemo<PodRow[]>(() => pods.map((pod) => ({
    key: pod.id, name: pod.name, cluster: pod.cluster, namespace: pod.namespace,
    role: pod.role, status: pod.status === 'Draft' ? 'Pending' : pod.status,
    restart: pod.restart, image: pod.image, ip: pod.podIP, node: pod.node, age: pod.age,
  })), [pods]);

  const storeRouteData = useMemo<RouteEntry[]>(() => serviceEntries.map((se) => {
    const seServices = services.filter((s) => se.serviceIds.includes(s.id));
    const seen = new Set<string>();
    const sePorts: PortInfo[] = [];
    seServices.forEach((s) => s.ports.forEach((p) => {
      const key = `${p.port}-${p.protocol}`;
      if (!seen.has(key)) { seen.add(key); sePorts.push(p); }
    }));
    return {
      key: se.id, name: se.name, cluster: se.cluster, namespace: se.namespace,
      hosts: se.hosts, ports: sePorts,
      endpoints: (() => {
        const eps = se.endpoints.map((ep) => ({ address: ep.address, weight: ep.weight }));
        const total = eps.reduce((s, ep) => s + ep.weight, 0);
        if (total > 0) eps.forEach((ep) => { ep.weight = Math.round(ep.weight / total * 100); });
        return eps;
      })(),
    };
  }), [serviceEntries, services]);

  const filteredSvcs = useMemo(() => storeServiceRows.filter((row) => {
    const text = (row.name + ' ' + row.se + ' ' + row.namespace + ' ' + row.clusterIP).toLowerCase();
    return !keyword || text.includes(keyword.toLowerCase());
  }), [storeServiceRows, keyword]);

  const filteredPods = useMemo(() => storePodRows.filter((row) => {
    const text = (row.name + ' ' + row.namespace + ' ' + row.image + ' ' + row.ip + ' ' + row.node).toLowerCase();
    return !keyword || text.includes(keyword.toLowerCase());
  }), [storePodRows, keyword]);

  const filteredRoutes = useMemo(() => storeRouteData.filter((r) => {
    const text = (r.name + ' ' + r.hosts.join(' ')).toLowerCase();
    return !keyword || text.includes(keyword.toLowerCase());
  }), [storeRouteData, keyword]);

  const serviceColumns: ColumnsType<ServiceRow> = [
    { title: 'SVC', dataIndex: 'name', key: 'name', width: 190, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: 'SE', dataIndex: 'se', key: 'se', width: 120, render: (v) => <span style={{ color: '#2468F2', whiteSpace: 'nowrap' }}>{v}</span> },
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
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#4E5969', whiteSpace: 'nowrap' }}>{ep.address}</span>
            </div>
          ))}
        </div>
      ),
    },
    { title: 'POD', dataIndex: 'pods', key: 'pods', width: 80, render: (v) => <span>{v}</span> },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (v) => <span className="ataas-cm-muted" style={{ whiteSpace: 'nowrap' }}>{v}</span> },
  ];

  const podColumns: ColumnsType<PodRow> = [
    { title: 'POD', dataIndex: 'name', key: 'name', width: 220, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 90, render: (v) => <span className="ataas-cm-role">{v}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v) => <span className={'ataas-cm-status ' + String(v).toLowerCase()}><i />{v}</span> },
    { title: '重启', dataIndex: 'restart', key: 'restart', width: 70, render: (v) => <span className="ataas-cm-muted">{v}</span> },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 120, render: (v) => <span className="ataas-cm-code">{v}</span> },
    { title: 'Node', dataIndex: 'node', key: 'node', width: 130, render: (v) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span> },
    { title: '运行时间', dataIndex: 'age', key: 'age', width: 100, render: (v) => <span className="ataas-cm-muted">{v}</span> },
  ];

  const seColumns: ColumnsType<RouteEntry> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180, fixed: 'left', render: (v) => <strong className="ataas-cm-name">{v}</strong> },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 110 },
    { title: 'Hosts', dataIndex: 'hosts', key: 'hosts', width: 240, render: (hosts: string[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {hosts.map((h, i) => <span key={i} style={{ fontSize: 12, fontFamily: 'monospace', color: '#4E5969' }}>{h}</span>)}
      </div>
    ) },
    { title: 'Ports', dataIndex: 'ports', key: 'ports', width: 140, render: (ports: PortInfo[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {ports.map((p, i) => (
          <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', color: '#4E5969', whiteSpace: 'nowrap' }}>
            {p.port} / {p.protocol.toLowerCase()}
          </span>
        ))}
        {ports.length === 0 && <span style={{ color: '#98a2b3' }}>-</span>}
      </div>
    ) },
    { title: 'Endpoints（SVC）', dataIndex: 'endpoints', key: 'endpoints', width: 280, render: (endpoints: { address: string; weight: number }[]) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {endpoints.map((ep, i) => (
          <span key={i} style={{ fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#2468F2' }}>{ep.address}</span>
            <span style={{ color: '#86909C' }}> ({ep.weight}%)</span>
          </span>
        ))}
      </div>
    ) },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <div className={className}>
        <div className="ataas-cm-toolbar" style={{ border: 'none', padding: '8px 0' }}>
          <div style={{ flex: 1 }} />
          <Input.Search size="small" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={initialView === 'se' ? '搜索 SE / Host' : initialView === 'svc' ? '搜索 SVC / SE / Cluster IP' : '搜索 POD / IP / Node'} style={{ width: 320 }} />
        </div>
        {initialView === 'se' ? (
          <Table<RouteEntry> rowKey="key" columns={seColumns} dataSource={filteredRoutes} scroll={{ x: 1000 }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条路由' }} />
        ) : initialView === 'svc' ? (
          <Table<ServiceRow> rowKey="key" columns={serviceColumns} dataSource={filteredSvcs} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }} />
        ) : (
          <Table<PodRow> rowKey="key" columns={podColumns} dataSource={filteredPods} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }} />
        )}
      </div>
    </ConfigProvider>
  );
}
