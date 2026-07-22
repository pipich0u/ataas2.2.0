import {
  ApartmentOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DownOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input, Modal, Select, Tag, message } from 'antd';
import { useMemo, useState } from 'react';
import './resourceManagementPages.less';

type ResourceStatus = 'normal' | 'attention' | 'pending';
type ResourceDialog = 'supplier' | 'dataCenter' | 'machine' | 'cluster' | 'scale' | null;

type ClusterArchive = {
  name: string;
  version: string;
  nodes: number;
  status: ResourceStatus;
  statusText: string;
};

type DataCenterArchive = {
  name: string;
  code: string;
  location: string;
  machines: number;
  status: ResourceStatus;
  statusText: string;
  clusters: ClusterArchive[];
};

type SupplierArchive = {
  id: string;
  name: string;
  code: string;
  type: string;
  region: string;
  coverage: string;
  status: ResourceStatus;
  statusText: string;
  dataCenters: DataCenterArchive[];
};

const suppliers: SupplierArchive[] = [
  {
    id: 'supplier-a', name: '厂商A · xxx科技', code: 'SUP-2026-001', type: '算力／裸金属', region: '华东', coverage: '上海', status: 'normal', statusText: '合作中',
    dataCenters: [
      { name: '上海一号数据中心', code: 'DC-SH-001', location: '上海 · 浦东', machines: 106, status: 'attention', statusText: '1 项异常', clusters: [
        { name: 'gpu-prod-01', version: 'v1.36.2', nodes: 80, status: 'attention', statusText: '有异常' },
        { name: 'gpu-test-sh-01', version: 'v1.36.2', nodes: 24, status: 'normal', statusText: '健康' },
      ] },
      { name: '上海二号数据中心', code: 'DC-SH-002', location: '上海 · 临港', machines: 0, status: 'pending', statusText: '待接入', clusters: [] },
    ],
  },
  {
    id: 'supplier-b', name: '厂商B · 中原算力', code: 'SUP-2026-002', type: '算力／裸金属', region: '华中', coverage: '郑州', status: 'attention', statusText: '需关注',
    dataCenters: [{ name: '郑州高新数据中心', code: 'DC-ZZ-001', location: '河南 · 郑州', machines: 96, status: 'normal', statusText: '运行中', clusters: [
      { name: 'gpu-prod-01', version: 'v1.35.4', nodes: 64, status: 'attention', statusText: '异常 2' },
      { name: 'gpu-dev-zz-01', version: 'v1.35.4', nodes: 32, status: 'normal', statusText: '健康' },
    ] }],
  },
  {
    id: 'supplier-c', name: '厂商C · 华北云', code: 'SUP-2026-003', type: '云资源', region: '华北', coverage: '北京', status: 'normal', statusText: '合作中',
    dataCenters: [{ name: '北京亦庄数据中心', code: 'DC-BJ-001', location: '北京 · 亦庄', machines: 40, status: 'normal', statusText: '运行中', clusters: [
      { name: 'gpu-prod-01', version: 'v1.36.2', nodes: 40, status: 'normal', statusText: '健康' },
    ] }],
  },
  {
    id: 'supplier-d', name: '厂商D · 边缘算力', code: 'SUP-2026-004', type: '综合服务', region: '华南／西南', coverage: '广州、成都', status: 'normal', statusText: '合作中',
    dataCenters: [
      { name: '广州边缘数据中心', code: 'DC-GZ-001', location: '广东 · 广州', machines: 3, status: 'normal', statusText: '运行中', clusters: [] },
      { name: '成都边缘数据中心', code: 'DC-CD-001', location: '四川 · 成都', machines: 3, status: 'normal', statusText: '运行中', clusters: [] },
    ],
  },
  {
    id: 'supplier-e', name: '厂商E · 海外云', code: 'SUP-2026-005', type: '云资源', region: '海外', coverage: '新加坡、东京', status: 'pending', statusText: '待接入',
    dataCenters: [
      { name: '新加坡一号数据中心', code: 'DC-SG-001', location: '新加坡', machines: 0, status: 'pending', statusText: '待接入', clusters: [] },
      { name: '东京一号数据中心', code: 'DC-TK-001', location: '日本 · 东京', machines: 0, status: 'pending', statusText: '待接入', clusters: [] },
    ],
  },
];

const statusColor: Record<ResourceStatus, string> = { normal: 'green', attention: 'red', pending: 'default' };

const ResourceStatusTag = ({ status, children }: { status: ResourceStatus; children: string }) => (
  <Tag className="resource-status-tag" color={statusColor[status]}>{children}</Tag>
);

const ResourceAccessPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | ResourceStatus>('all');
  const [expanded, setExpanded] = useState<string[]>(['supplier-a']);
  const [dialog, setDialog] = useState<ResourceDialog>(null);

  const filteredSuppliers = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      const searchable = [supplier.name, supplier.code, supplier.region, supplier.coverage, ...supplier.dataCenters.flatMap((dc) => [dc.name, dc.code, ...dc.clusters.map((cluster) => cluster.name)])].join(' ').toLowerCase();
      return (!term || searchable.includes(term)) && (status === 'all' || supplier.status === status);
    });
  }, [keyword, status]);

  const totals = useMemo(() => ({
    suppliers: suppliers.length,
    dataCenters: suppliers.reduce((sum, supplier) => sum + supplier.dataCenters.length, 0),
    clusters: suppliers.reduce((sum, supplier) => sum + supplier.dataCenters.reduce((dcSum, dc) => dcSum + dc.clusters.length, 0), 0),
    machines: suppliers.reduce((sum, supplier) => sum + supplier.dataCenters.reduce((dcSum, dc) => dcSum + dc.machines, 0), 0),
  }), []);

  const toggleSupplier = (id: string) => {
    setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const finishDialog = () => {
    message.success('操作已创建，可在运维任务中查看进度');
    setDialog(null);
  };

  const dialogTitle: Record<Exclude<ResourceDialog, null>, string> = {
    supplier: '新增供应商', dataCenter: '新增数据中心', machine: '纳管裸金属机器', cluster: '创建／接入 Kubernetes 集群', scale: '节点扩缩容',
  };

  return (
    <div className="resource-management-page resource-access-page">
      <header className="resource-page-header">
        <div>
          <h1>资源接入与管理</h1>
          <p>统一管理供应商、数据中心，并完成裸金属纳管与 Kubernetes 集群接入。</p>
        </div>
        <Dropdown menu={{ items: [
          { key: 'supplier', label: '新增供应商', onClick: () => setDialog('supplier') },
          { key: 'dataCenter', label: '新增数据中心', onClick: () => setDialog('dataCenter') },
        ] }}>
          <Button type="primary" icon={<PlusOutlined />}>新增资源 <DownOutlined /></Button>
        </Dropdown>
      </header>

      <section className="resource-summary-grid" aria-label="资源统计">
        <div><ApartmentOutlined /><span>供应商</span><strong>{totals.suppliers}</strong></div>
        <div><DatabaseOutlined /><span>数据中心</span><strong>{totals.dataCenters}</strong></div>
        <div><CloudServerOutlined /><span>Kubernetes 集群</span><strong>{totals.clusters}</strong></div>
        <div><CloudServerOutlined /><span>已纳管机器</span><strong>{totals.machines}</strong></div>
      </section>

      <section className="resource-archive-panel">
        <div className="resource-toolbar">
          <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索供应商、数据中心、集群" allowClear />
          <Select value={status} onChange={setStatus} options={[
            { value: 'all', label: '全部状态' },
            { value: 'normal', label: '合作中／运行中' },
            { value: 'attention', label: '需关注' },
            { value: 'pending', label: '待接入' },
          ]} />
          <span className="resource-result-count">共 {filteredSuppliers.length} 家供应商 · {totals.dataCenters} 个数据中心</span>
        </div>
        <div className="resource-columns" aria-hidden="true"><span></span><span>供应商</span><span>服务区域</span><span>数据中心</span><span>集群</span><span>机器</span><span>状态</span></div>
        <div className="resource-archive-list">
          {filteredSuppliers.map((supplier) => {
            const isExpanded = expanded.includes(supplier.id);
            const clusterCount = supplier.dataCenters.reduce((sum, dc) => sum + dc.clusters.length, 0);
            const machineCount = supplier.dataCenters.reduce((sum, dc) => sum + dc.machines, 0);
            return (
              <article key={supplier.id} className={'resource-supplier-card' + (isExpanded ? ' expanded' : '')}>
                <button type="button" className="resource-supplier-row" onClick={() => toggleSupplier(supplier.id)} aria-expanded={isExpanded}>
                  <DownOutlined className="resource-expand-icon" />
                  <span className="resource-primary-cell"><strong>{supplier.name}</strong><small>{supplier.code} · {supplier.type}</small></span>
                  <span>{supplier.region}<small>{supplier.coverage}</small></span>
                  <span>{supplier.dataCenters.length} 个</span>
                  <span>{clusterCount} 个</span>
                  <span>{machineCount} 台</span>
                  <ResourceStatusTag status={supplier.status}>{supplier.statusText}</ResourceStatusTag>
                </button>
                {isExpanded && (
                  <div className="resource-supplier-body">
                    <div className="resource-supplier-actions">
                      <Button size="small">编辑档案</Button>
                      <Button size="small" type="primary" ghost onClick={() => setDialog('dataCenter')}>在此新建数据中心</Button>
                    </div>
                    {supplier.dataCenters.map((dc) => (
                      <section key={dc.code} className="resource-dc-card">
                        <div className="resource-dc-row">
                          <span className="resource-primary-cell"><strong>{dc.name}</strong><small>{dc.code}</small></span>
                          <span>{dc.location}</span><span>{dc.machines} 台机器</span>
                          <ResourceStatusTag status={dc.status}>{dc.statusText}</ResourceStatusTag>
                          <span className="resource-row-actions"><Button size="small" onClick={() => setDialog('machine')}>纳管裸金属</Button><Button size="small" onClick={() => setDialog('cluster')}>接入集群</Button></span>
                        </div>
                        <div className="resource-cluster-list">
                          {dc.clusters.length ? dc.clusters.map((cluster) => (
                            <div key={`${dc.code}-${cluster.name}`} className="resource-cluster-row">
                              <CloudServerOutlined /><strong>{cluster.name}</strong><span>Kubernetes {cluster.version}</span><span>{cluster.nodes} Nodes</span>
                              <ResourceStatusTag status={cluster.status}>{cluster.statusText}</ResourceStatusTag>
                              <Button type="link" size="small" onClick={() => setDialog('scale')}>节点扩缩容</Button>
                            </div>
                          )) : <div className="resource-empty-clusters">暂无集群 <Button type="link" size="small" onClick={() => setDialog('cluster')}>创建／接入 Kubernetes 集群</Button></div>}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          {!filteredSuppliers.length && <div className="resource-empty-state">没有符合条件的资源档案</div>}
        </div>
      </section>

      <Modal title={dialog ? dialogTitle[dialog] : ''} open={Boolean(dialog)} onCancel={() => setDialog(null)} onOk={finishDialog} okText={dialog === 'machine' ? '开始校验' : '确认创建'} width={720} destroyOnHidden>
        {dialog === 'supplier' && <div className="resource-dialog-grid"><label>供应商名称<Input placeholder="请输入供应商名称" /></label><label>服务类型<Select defaultValue="算力／裸金属供应商" options={[{ value: '算力／裸金属供应商' }, { value: 'IDC 机房服务商' }, { value: '云资源供应商' }]} /></label><label>企业主体名称<Input placeholder="合同或发票上的企业全称" /></label><label>服务地区<Input placeholder="例如：华东、华北" /></label><label>联系人<Input placeholder="联系人姓名" /></label><label>联系电话<Input placeholder="手机或固定电话" /></label></div>}
        {dialog === 'dataCenter' && <div className="resource-dialog-grid"><label>数据中心名称<Input placeholder="例如：上海二号数据中心" /></label><label>所属供应商<Select defaultValue="厂商A · xxx科技" options={suppliers.map((supplier) => ({ value: supplier.name }))} /></label><label>省市／国家地区<Input placeholder="例如：上海市浦东新区" /></label><label>管理网段<Input placeholder="例如：10.24.16.0/20" /></label><label>BMC 网段<Input placeholder="例如：172.20.16.0/22" /></label><label>业务接入网段<Input placeholder="负载均衡、对外服务等网段" /></label></div>}
        {dialog === 'machine' && <div className="resource-dialog-stack"><div className="resource-dialog-notice">机器纳管后进入数据中心资源池，不会自动注册为 Kubernetes Node。</div><label>接入方式<Select defaultValue="IP 段 + SSH" options={[{ value: 'IP 段 + SSH' }, { value: '导入机器清单' }, { value: '离线采集包' }]} /></label><label>管理 IP 范围<Input defaultValue="10.24.18.121-10.24.18.132" /></label><label>SSH 凭据<Select defaultValue="sh-dc-root-key-01" options={[{ value: 'sh-dc-root-key-01' }, { value: '新建凭据' }]} /></label></div>}
        {dialog === 'cluster' && <div className="resource-dialog-stack"><div className="resource-dialog-notice">接入已有集群不会重装 Kubernetes；平台将在连通后发现 Nodes 并关联裸金属台账。</div><label>集群名称<Input defaultValue="gpu-prod-02" /></label><label>接入方式<Select defaultValue="接入已有 Kubernetes" options={[{ value: '接入已有 Kubernetes' }, { value: '远程部署新集群' }, { value: '离线软件包接入' }]} /></label><label>API Server 地址<Input placeholder="https://10.24.16.10:6443" /></label><label>Kubeconfig<Input type="file" /></label></div>}
        {dialog === 'scale' && <div className="resource-dialog-stack"><div className="resource-dialog-notice">从当前数据中心已纳管且未分配的机器中选择，注册为集群 Nodes。</div><label>目标集群<Input value="gpu-prod-01 · Kubernetes v1.36.2" readOnly /></label><label>机器范围<Select mode="multiple" defaultValue={['BM-00001121', 'BM-00001122']} options={['BM-00001121', 'BM-00001122', 'BM-00001123'].map((value) => ({ value }))} /></label><label>加入后调度策略<Select defaultValue="先保持不可调度，验收后手动启用" options={[{ value: '先保持不可调度，验收后手动启用' }, { value: 'Ready 后自动启用调度' }]} /></label></div>}
      </Modal>
    </div>
  );
};

export default ResourceAccessPage;
