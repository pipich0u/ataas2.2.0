import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Tag, message } from 'antd';
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

const supplierContacts: Record<string, { contact: string; phone: string; email: string; hotline: string }> = {
  'supplier-a': { contact: '李敏', phone: '138 0013 8001', email: 'limin@xxxtech.cn', hotline: '400-880-1024' },
  'supplier-b': { contact: '王工', phone: '139 0013 9002', email: 'service@zycompute.cn', hotline: '400-660-2096' },
  'supplier-c': { contact: '赵凯', phone: '137 0013 7003', email: 'zhaokai@northcloud.cn', hotline: '400-550-1040' },
  'supplier-d': { contact: '陈璐', phone: '136 0013 6004', email: 'chenlu@edgecompute.cn', hotline: '400-330-2006' },
  'supplier-e': { contact: 'Sofia', phone: '+65 6123 4567', email: 'sofia@globalcloud.example', hotline: '+65 6000 8000' },
};

type DataCenterProfile = DataCenterArchive & {
  supplierId: string;
  supplierName: string;
  fullLocation: string;
  timezone: string;
  management: string;
  bmc: string;
  business: string;
  proxy: string;
  freeMachines: number;
};

const dataCenterMeta: Record<string, Omit<DataCenterProfile, keyof DataCenterArchive | 'supplierId' | 'supplierName'>> = {
  'DC-SH-001': { fullLocation: '上海市浦东新区', timezone: 'UTC+08', management: '10.24.16.0/20', bmc: '172.20.16.0/22', business: '10.28.0.0/16', proxy: '专线出口 · 已配置', freeMachines: 18 },
  'DC-SH-002': { fullLocation: '上海市临港新片区', timezone: 'UTC+08', management: '10.25.0.0/20', bmc: '172.20.32.0/22', business: '待配置', proxy: '待配置', freeMachines: 0 },
  'DC-ZZ-001': { fullLocation: '河南省郑州市高新区', timezone: 'UTC+08', management: '10.34.0.0/20', bmc: '172.21.0.0/22', business: '10.38.0.0/16', proxy: '专线出口 · 已配置', freeMachines: 0 },
  'DC-BJ-001': { fullLocation: '北京市亦庄经济技术开发区', timezone: 'UTC+08', management: '10.44.0.0/20', bmc: '172.22.0.0/22', business: '10.48.0.0/16', proxy: '云专线 · 已配置', freeMachines: 0 },
  'DC-GZ-001': { fullLocation: '广东省广州市黄埔区', timezone: 'UTC+08', management: '10.54.0.0/24', bmc: '172.23.0.0/26', business: '10.58.0.0/24', proxy: '专线出口 · 已配置', freeMachines: 3 },
  'DC-CD-001': { fullLocation: '四川省成都市高新区', timezone: 'UTC+08', management: '10.55.0.0/24', bmc: '172.23.1.0/26', business: '10.59.0.0/24', proxy: '专线出口 · 已配置', freeMachines: 3 },
  'DC-SG-001': { fullLocation: 'Singapore West', timezone: 'UTC+08', management: '待配置', bmc: '待配置', business: '待配置', proxy: '待配置', freeMachines: 0 },
  'DC-TK-001': { fullLocation: 'Tokyo East', timezone: 'UTC+09', management: '待配置', bmc: '待配置', business: '待配置', proxy: '待配置', freeMachines: 0 },
};

const dataCenters: DataCenterProfile[] = suppliers.flatMap((supplier) => supplier.dataCenters.map((dataCenter) => ({
  ...dataCenter,
  supplierId: supplier.id,
  supplierName: supplier.name,
  ...dataCenterMeta[dataCenter.code],
})));

const ResourceAccessPage = () => {
  const [activeArchive, setActiveArchive] = useState<'supplier' | 'dataCenter'>('supplier');
  const [supplierKeyword, setSupplierKeyword] = useState('');
  const [supplierStatus, setSupplierStatus] = useState<'all' | ResourceStatus>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0].id);
  const [dataCenterKeyword, setDataCenterKeyword] = useState('');
  const [dataCenterSupplier, setDataCenterSupplier] = useState('all');
  const [dataCenterStatus, setDataCenterStatus] = useState<'all' | ResourceStatus>('all');
  const [selectedDataCenterCode, setSelectedDataCenterCode] = useState(dataCenters[0].code);
  const [dialog, setDialog] = useState<ResourceDialog>(null);

  const filteredSuppliers = useMemo(() => {
    const term = supplierKeyword.trim().toLowerCase();
    return suppliers.filter((supplier) => (!term || [supplier.name, supplier.code, supplier.region, supplier.coverage].join(' ').toLowerCase().includes(term)) && (supplierStatus === 'all' || supplier.status === supplierStatus));
  }, [supplierKeyword, supplierStatus]);

  const filteredDataCenters = useMemo(() => {
    const term = dataCenterKeyword.trim().toLowerCase();
    return dataCenters.filter((dataCenter) => (!term || [dataCenter.name, dataCenter.code, dataCenter.fullLocation].join(' ').toLowerCase().includes(term)) && (dataCenterSupplier === 'all' || dataCenter.supplierId === dataCenterSupplier) && (dataCenterStatus === 'all' || dataCenter.status === dataCenterStatus));
  }, [dataCenterKeyword, dataCenterStatus, dataCenterSupplier]);

  const selectedSupplier = filteredSuppliers.find((supplier) => supplier.id === selectedSupplierId) || filteredSuppliers[0] || suppliers[0];
  const selectedDataCenter = filteredDataCenters.find((dataCenter) => dataCenter.code === selectedDataCenterCode) || filteredDataCenters[0] || dataCenters[0];
  const selectedSupplierDataCenters = dataCenters.filter((dataCenter) => dataCenter.supplierId === selectedSupplier.id);
  const selectedSupplierTotals = selectedSupplierDataCenters.reduce((totals, dataCenter) => ({ clusters: totals.clusters + dataCenter.clusters.length, machines: totals.machines + dataCenter.machines }), { clusters: 0, machines: 0 });
  const contact = supplierContacts[selectedSupplier.id];

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
        <div><h1>资源接入与管理</h1><p>分别维护供应商与数据中心档案，并从数据中心发起裸金属纳管和 Kubernetes 集群接入。</p></div>
      </header>

      <nav className="resource-archive-tabs" aria-label="资源档案类型">
        <button type="button" className={activeArchive === 'supplier' ? 'active' : ''} onClick={() => setActiveArchive('supplier')}>供应商 <span>{suppliers.length}</span></button>
        <button type="button" className={activeArchive === 'dataCenter' ? 'active' : ''} onClick={() => setActiveArchive('dataCenter')}>数据中心 <span>{dataCenters.length}</span></button>
      </nav>

      {activeArchive === 'supplier' ? (
        <section className="resource-archive-workspace">
          <div className="resource-archive-list-panel">
            <div className="resource-toolbar">
              <Input value={supplierKeyword} onChange={(event) => setSupplierKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索供应商名称、编码或区域" allowClear />
              <Select value={supplierStatus} onChange={setSupplierStatus} options={[{ value: 'all', label: '全部状态' }, { value: 'normal', label: '合作中' }, { value: 'attention', label: '需关注' }, { value: 'pending', label: '待接入' }]} />
              <span className="resource-result-count">共 {filteredSuppliers.length} 家供应商</span>
              <Button type="primary" onClick={() => setDialog('supplier')}>新增供应商</Button>
            </div>
            <div className="resource-table resource-supplier-table">
              <div className="resource-table-head"><span>供应商</span><span>类型</span><span>服务区域</span><span>数据中心</span><span>状态</span></div>
              {filteredSuppliers.map((supplier) => (
                <button key={supplier.id} type="button" className={'resource-table-row' + (selectedSupplier.id === supplier.id ? ' selected' : '')} onClick={() => setSelectedSupplierId(supplier.id)}>
                  <span className="resource-primary-cell"><strong>{supplier.name}</strong><small>{supplier.code}</small></span>
                  <span>{supplier.type}</span>
                  <span>{supplier.region}<small>{supplier.coverage}</small></span>
                  <span>{supplier.dataCenters.length} 个</span>
                  <ResourceStatusTag status={supplier.status}>{supplier.statusText}</ResourceStatusTag>
                </button>
              ))}
              {!filteredSuppliers.length && <div className="resource-empty-state">没有符合条件的供应商档案</div>}
            </div>
          </div>
          <aside className="resource-archive-detail">
            <div className="resource-detail-head"><span>供应商档案</span><ResourceStatusTag status={selectedSupplier.status}>{selectedSupplier.statusText}</ResourceStatusTag><h2>{selectedSupplier.name}</h2><small>{selectedSupplier.code} · {selectedSupplier.type}</small></div>
            <div className="resource-detail-section"><h3>基础信息</h3><dl><div><dt>服务区域</dt><dd>{selectedSupplier.region} · {selectedSupplier.coverage}</dd></div><div><dt>联系人</dt><dd>{contact.contact}</dd></div><div><dt>联系电话</dt><dd>{contact.phone}</dd></div><div><dt>服务热线</dt><dd>{contact.hotline}</dd></div><div className="full"><dt>邮箱</dt><dd>{contact.email}</dd></div></dl></div>
            <div className="resource-detail-section"><h3>关联资源</h3><div className="resource-detail-stats"><div><strong>{selectedSupplierDataCenters.length}</strong><span>数据中心</span></div><div><strong>{selectedSupplierTotals.clusters}</strong><span>集群</span></div><div><strong>{selectedSupplierTotals.machines}</strong><span>机器</span></div></div></div>
            <div className="resource-detail-actions"><Button>编辑档案</Button><Button type="primary" ghost onClick={() => setDialog('dataCenter')}>新建数据中心</Button></div>
          </aside>
        </section>
      ) : (
        <section className="resource-archive-workspace">
          <div className="resource-archive-list-panel">
            <div className="resource-toolbar resource-dc-toolbar">
              <Input value={dataCenterKeyword} onChange={(event) => setDataCenterKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索数据中心名称、编码或位置" allowClear />
              <Select value={dataCenterSupplier} onChange={setDataCenterSupplier} options={[{ value: 'all', label: '全部供应商' }, ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))]} />
              <Select value={dataCenterStatus} onChange={setDataCenterStatus} options={[{ value: 'all', label: '全部状态' }, { value: 'normal', label: '运行中' }, { value: 'attention', label: '需关注' }, { value: 'pending', label: '待接入' }]} />
              <span className="resource-result-count">共 {filteredDataCenters.length} 个数据中心</span>
              <Button type="primary" onClick={() => setDialog('dataCenter')}>新增数据中心</Button>
            </div>
            <div className="resource-table resource-dc-table">
              <div className="resource-table-head"><span>数据中心</span><span>所属供应商</span><span>位置</span><span>资源</span><span>状态</span></div>
              {filteredDataCenters.map((dataCenter) => (
                <button key={dataCenter.code} type="button" className={'resource-table-row' + (selectedDataCenter.code === dataCenter.code ? ' selected' : '')} onClick={() => setSelectedDataCenterCode(dataCenter.code)}>
                  <span className="resource-primary-cell"><strong>{dataCenter.name}</strong><small>{dataCenter.code}</small></span>
                  <span>{dataCenter.supplierName}</span>
                  <span>{dataCenter.fullLocation}<small>{dataCenter.timezone}</small></span>
                  <span>{dataCenter.clusters.length} 集群<small>{dataCenter.machines} 台机器</small></span>
                  <ResourceStatusTag status={dataCenter.status}>{dataCenter.statusText}</ResourceStatusTag>
                </button>
              ))}
              {!filteredDataCenters.length && <div className="resource-empty-state">没有符合条件的数据中心档案</div>}
            </div>
          </div>
          <aside className="resource-archive-detail">
            <div className="resource-detail-head"><span>数据中心档案</span><ResourceStatusTag status={selectedDataCenter.status}>{selectedDataCenter.statusText}</ResourceStatusTag><h2>{selectedDataCenter.name}</h2><small>{selectedDataCenter.code} · {selectedDataCenter.supplierName}</small></div>
            <div className="resource-detail-section"><h3>位置与网络</h3><dl><div className="full"><dt>位置</dt><dd>{selectedDataCenter.fullLocation} · {selectedDataCenter.timezone}</dd></div><div><dt>管理网段</dt><dd>{selectedDataCenter.management}</dd></div><div><dt>BMC 网段</dt><dd>{selectedDataCenter.bmc}</dd></div><div><dt>业务接入网段</dt><dd>{selectedDataCenter.business}</dd></div><div><dt>代理／出口</dt><dd>{selectedDataCenter.proxy}</dd></div></dl></div>
            <div className="resource-detail-section"><h3>关联资源</h3><div className="resource-detail-stats"><div><strong>{selectedDataCenter.clusters.length}</strong><span>集群</span></div><div><strong>{selectedDataCenter.machines}</strong><span>机器</span></div><div><strong>{selectedDataCenter.freeMachines}</strong><span>空闲机器</span></div></div></div>
            <div className="resource-detail-actions"><Button onClick={() => setDialog('machine')}>纳管裸金属</Button><Button type="primary" onClick={() => setDialog('cluster')}>创建／接入集群</Button></div>
          </aside>
        </section>
      )}

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
