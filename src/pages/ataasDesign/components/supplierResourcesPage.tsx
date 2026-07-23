import {
  ApartmentOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import './supplierResourcesPage.less';

type ResourceStatus = 'normal' | 'attention' | 'pending';

type SupplierRecord = {
  key: string;
  name: string;
  code: string;
  type: string;
  region: string;
  coverage: string;
  dataCenters: number;
  clusters: number;
  machines: number;
  status: ResourceStatus;
  contact: string;
  phone: string;
  email: string;
  hotline: string;
};

type DataCenterRecord = {
  key: string;
  name: string;
  code: string;
  supplierKey: string;
  supplier: string;
  location: string;
  timezone: string;
  managementCidr: string;
  bmcCidr: string;
  businessCidr: string;
  proxy: string;
  clusters: number;
  machines: number;
  freeMachines: number;
  status: ResourceStatus;
  statusLabel: string;
};

const initialSuppliers: SupplierRecord[] = [
  { key: 'supplier-a', name: '厂商A · xxx科技', code: 'SUP-2026-001', type: '算力／裸金属', region: '华东', coverage: '上海', dataCenters: 2, clusters: 2, machines: 106, status: 'normal', contact: '李敏', phone: '138 0013 8001', email: 'limin@xxxtech.cn', hotline: '400-880-1024' },
  { key: 'supplier-b', name: '厂商B · 中原算力', code: 'SUP-2026-002', type: '算力／裸金属', region: '华中', coverage: '郑州', dataCenters: 1, clusters: 2, machines: 96, status: 'attention', contact: '王工', phone: '139 0013 9002', email: 'service@zycompute.cn', hotline: '400-660-2096' },
  { key: 'supplier-c', name: '厂商C · 华北云', code: 'SUP-2026-003', type: '云资源', region: '华北', coverage: '北京', dataCenters: 1, clusters: 1, machines: 40, status: 'normal', contact: '赵凯', phone: '137 0013 7003', email: 'zhaokai@northcloud.cn', hotline: '400-550-1040' },
  { key: 'supplier-d', name: '厂商D · 边缘算力', code: 'SUP-2026-004', type: '综合服务', region: '华南／西南', coverage: '广州、成都', dataCenters: 2, clusters: 0, machines: 6, status: 'normal', contact: '陈璐', phone: '136 0013 6004', email: 'chenlu@edgecompute.cn', hotline: '400-330-2006' },
  { key: 'supplier-e', name: '厂商E · 海外云', code: 'SUP-2026-005', type: '云资源', region: '海外', coverage: '新加坡、东京', dataCenters: 2, clusters: 0, machines: 0, status: 'pending', contact: 'Sofia', phone: '+65 6123 4567', email: 'sofia@globalcloud.example', hotline: '+65 6000 8000' },
];

const initialDataCenters: DataCenterRecord[] = [
  { key: 'dc-sh-01', name: '上海一号数据中心', code: 'DC-SH-001', supplierKey: 'supplier-a', supplier: '厂商A · xxx科技', location: '上海市浦东新区', timezone: 'UTC+08:00', managementCidr: '10.24.16.0/20', bmcCidr: '172.20.16.0/22', businessCidr: '10.28.0.0/16', proxy: '专线出口 · 已配置', clusters: 2, machines: 106, freeMachines: 18, status: 'attention', statusLabel: '1 项异常' },
  { key: 'dc-sh-02', name: '上海二号数据中心', code: 'DC-SH-002', supplierKey: 'supplier-a', supplier: '厂商A · xxx科技', location: '上海市临港新片区', timezone: 'UTC+08:00', managementCidr: '10.25.0.0/20', bmcCidr: '172.20.32.0/22', businessCidr: '待配置', proxy: '待配置', clusters: 0, machines: 0, freeMachines: 0, status: 'pending', statusLabel: '待接入' },
  { key: 'dc-zz-01', name: '郑州高新数据中心', code: 'DC-ZZ-001', supplierKey: 'supplier-b', supplier: '厂商B · 中原算力', location: '河南省郑州市高新区', timezone: 'UTC+08:00', managementCidr: '10.34.0.0/20', bmcCidr: '172.21.0.0/22', businessCidr: '10.38.0.0/16', proxy: '专线出口 · 已配置', clusters: 2, machines: 96, freeMachines: 0, status: 'normal', statusLabel: '运行中' },
  { key: 'dc-bj-01', name: '北京亦庄数据中心', code: 'DC-BJ-001', supplierKey: 'supplier-c', supplier: '厂商C · 华北云', location: '北京市亦庄经济技术开发区', timezone: 'UTC+08:00', managementCidr: '10.44.0.0/20', bmcCidr: '172.22.0.0/22', businessCidr: '10.48.0.0/16', proxy: '云专线 · 已配置', clusters: 1, machines: 40, freeMachines: 0, status: 'normal', statusLabel: '运行中' },
  { key: 'dc-gz-01', name: '广州边缘数据中心', code: 'DC-GZ-001', supplierKey: 'supplier-d', supplier: '厂商D · 边缘算力', location: '广东省广州市黄埔区', timezone: 'UTC+08:00', managementCidr: '10.54.0.0/24', bmcCidr: '172.23.0.0/26', businessCidr: '10.58.0.0/24', proxy: '专线出口 · 已配置', clusters: 0, machines: 3, freeMachines: 3, status: 'normal', statusLabel: '运行中' },
  { key: 'dc-cd-01', name: '成都边缘数据中心', code: 'DC-CD-001', supplierKey: 'supplier-d', supplier: '厂商D · 边缘算力', location: '四川省成都市高新区', timezone: 'UTC+08:00', managementCidr: '10.55.0.0/24', bmcCidr: '172.23.1.0/26', businessCidr: '10.59.0.0/24', proxy: '专线出口 · 已配置', clusters: 0, machines: 3, freeMachines: 3, status: 'normal', statusLabel: '运行中' },
  { key: 'dc-sg-01', name: '新加坡一号数据中心', code: 'DC-SG-001', supplierKey: 'supplier-e', supplier: '厂商E · 海外云', location: 'Singapore West', timezone: 'UTC+08:00', managementCidr: '待配置', bmcCidr: '待配置', businessCidr: '待配置', proxy: '待配置', clusters: 0, machines: 0, freeMachines: 0, status: 'pending', statusLabel: '待接入' },
  { key: 'dc-tk-01', name: '东京一号数据中心', code: 'DC-TK-001', supplierKey: 'supplier-e', supplier: '厂商E · 海外云', location: 'Tokyo East', timezone: 'UTC+09:00', managementCidr: '待配置', bmcCidr: '待配置', businessCidr: '待配置', proxy: '待配置', clusters: 0, machines: 0, freeMachines: 0, status: 'pending', statusLabel: '待接入' },
];

const statusText: Record<ResourceStatus, string> = {
  normal: '合作中',
  attention: '需关注',
  pending: '待接入',
};

const StatusTag = ({ status, label }: { status: ResourceStatus; label?: string }) => (
  <span className={`supplier-resource-status ${status}`}>
    <i />
    {label || statusText[status]}
  </span>
);

const SupplierResourcesPage = () => {
  const [activeKind, setActiveKind] = useState<'suppliers' | 'dataCenters'>('suppliers');
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [dataCenters, setDataCenters] = useState(initialDataCenters);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierStatus, setSupplierStatus] = useState<ResourceStatus | 'all'>('all');
  const [dataCenterSearch, setDataCenterSearch] = useState('');
  const [dataCenterSupplier, setDataCenterSupplier] = useState('all');
  const [dataCenterStatus, setDataCenterStatus] = useState<ResourceStatus | 'all'>('all');
  const [selectedSupplierKey, setSelectedSupplierKey] = useState(initialSuppliers[0].key);
  const [selectedDataCenterKey, setSelectedDataCenterKey] = useState(initialDataCenters[0].key);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [dataCenterModalOpen, setDataCenterModalOpen] = useState(false);
  const [machineModalOpen, setMachineModalOpen] = useState(false);
  const [clusterModalOpen, setClusterModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'supplier' | 'dataCenter' | null>(null);
  const [supplierForm] = Form.useForm();
  const [dataCenterForm] = Form.useForm();
  const [machineForm] = Form.useForm();
  const [clusterForm] = Form.useForm();

  const selectedSupplier = suppliers.find((item) => item.key === selectedSupplierKey) || suppliers[0];
  const selectedDataCenter = dataCenters.find((item) => item.key === selectedDataCenterKey) || dataCenters[0];

  const filteredSuppliers = useMemo(() => {
    const keyword = supplierSearch.trim().toLowerCase();
    return suppliers.filter((item) => {
      const searchMatch = !keyword || `${item.name} ${item.code} ${item.type} ${item.region} ${item.coverage}`.toLowerCase().includes(keyword);
      return searchMatch && (supplierStatus === 'all' || item.status === supplierStatus);
    });
  }, [supplierSearch, supplierStatus, suppliers]);

  const filteredDataCenters = useMemo(() => {
    const keyword = dataCenterSearch.trim().toLowerCase();
    return dataCenters.filter((item) => {
      const searchMatch = !keyword || `${item.name} ${item.code} ${item.supplier} ${item.location}`.toLowerCase().includes(keyword);
      return searchMatch
        && (dataCenterSupplier === 'all' || item.supplierKey === dataCenterSupplier)
        && (dataCenterStatus === 'all' || item.status === dataCenterStatus);
    });
  }, [dataCenterSearch, dataCenterStatus, dataCenterSupplier, dataCenters]);

  const supplierColumns: ColumnsType<SupplierRecord> = [
    {
      title: '供应商',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value, record) => <span className="supplier-resource-main"><strong>{value}</strong><small>{record.code}</small></span>,
    },
    { title: '服务类型', dataIndex: 'type', key: 'type', width: 130 },
    { title: '服务区域', key: 'region', width: 130, render: (_, record) => `${record.region} · ${record.coverage}` },
    { title: '数据中心', dataIndex: 'dataCenters', key: 'dataCenters', width: 92, render: (value) => `${value} 个` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (value) => <StatusTag status={value} /> },
  ];

  const dataCenterColumns: ColumnsType<DataCenterRecord> = [
    {
      title: '数据中心',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (value, record) => <span className="supplier-resource-main"><strong>{value}</strong><small>{record.code}</small></span>,
    },
    { title: '所属供应商', dataIndex: 'supplier', key: 'supplier', width: 180 },
    { title: '位置', dataIndex: 'location', key: 'location', width: 160, ellipsis: true },
    { title: '资源', key: 'resources', width: 140, render: (_, record) => `${record.machines} 台 · ${record.clusters} 集群` },
    { title: '状态', key: 'status', width: 100, render: (_, record) => <StatusTag status={record.status} label={record.statusLabel} /> },
  ];

  const createSupplier = async () => {
    const values = await supplierForm.validateFields();
    const next: SupplierRecord = {
      key: `supplier-${Date.now()}`,
      name: values.name,
      code: `SUP-${new Date().getFullYear()}-${String(suppliers.length + 1).padStart(3, '0')}`,
      type: values.type,
      region: values.region,
      coverage: values.coverage || values.region,
      dataCenters: 0,
      clusters: 0,
      machines: 0,
      status: 'pending',
      contact: values.contact || '—',
      phone: values.phone || '—',
      email: values.email || '—',
      hotline: values.hotline || '—',
    };
    setSuppliers((items) => [next, ...items]);
    setSelectedSupplierKey(next.key);
    supplierForm.resetFields();
    setSupplierModalOpen(false);
    message.success('供应商档案已创建');
  };

  const createDataCenter = async () => {
    const values = await dataCenterForm.validateFields();
    const supplier = suppliers.find((item) => item.key === values.supplierKey);
    if (!supplier) return;
    const next: DataCenterRecord = {
      key: `dc-${Date.now()}`,
      name: values.name,
      code: `DC-${String(dataCenters.length + 1).padStart(3, '0')}`,
      supplierKey: supplier.key,
      supplier: supplier.name,
      location: values.location,
      timezone: values.timezone,
      managementCidr: values.managementCidr,
      bmcCidr: values.bmcCidr || '待配置',
      businessCidr: values.businessCidr || '待配置',
      proxy: values.proxy || '待配置',
      clusters: 0,
      machines: 0,
      freeMachines: 0,
      status: 'pending',
      statusLabel: '待接入',
    };
    setDataCenters((items) => [next, ...items]);
    setSuppliers((items) => items.map((item) => item.key === supplier.key ? { ...item, dataCenters: item.dataCenters + 1 } : item));
    setSelectedDataCenterKey(next.key);
    dataCenterForm.resetFields();
    setDataCenterModalOpen(false);
    message.success('数据中心档案已创建');
  };

  const createMachineTask = async () => {
    await machineForm.validateFields();
    setMachineModalOpen(false);
    machineForm.resetFields();
    message.success('裸金属发现与纳管任务已创建');
  };

  const createClusterTask = async () => {
    await clusterForm.validateFields();
    setClusterModalOpen(false);
    clusterForm.resetFields();
    message.success('Kubernetes 集群接入任务已创建');
  };

  const supplierPanel = (
    <div className="supplier-resource-workspace">
      <section className="supplier-resource-list">
        <div className="supplier-resource-toolbar">
          <Input.Search allowClear value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} placeholder="搜索供应商名称、编号或服务区域" />
          <Select
            value={supplierStatus}
            onChange={setSupplierStatus}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'normal', label: '合作中' },
              { value: 'attention', label: '需关注' },
              { value: 'pending', label: '待接入' },
            ]}
          />
          <span className="supplier-resource-count">共 {filteredSuppliers.length} 家供应商</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setSupplierModalOpen(true)}>新建供应商</Button>
        </div>
        <Table
          columns={supplierColumns}
          dataSource={filteredSuppliers}
          rowKey="key"
          pagination={false}
          scroll={{ y: 'calc(100vh - 270px)' }}
          rowClassName={(record) => record.key === selectedSupplier?.key ? 'selected-row' : ''}
          onRow={(record) => ({ onClick: () => setSelectedSupplierKey(record.key) })}
        />
      </section>
      <aside className="supplier-resource-detail">
        <div className="supplier-resource-detail-head">
          <div><strong>{selectedSupplier?.name}</strong><span>{selectedSupplier?.code} · {selectedSupplier?.type}</span></div>
          {selectedSupplier && <StatusTag status={selectedSupplier.status} />}
        </div>
        {selectedSupplier && (
          <>
            <div className="supplier-resource-detail-section">
              <h3>档案信息</h3>
              <Descriptions column={2} colon={false} size="small" items={[
                { key: 'region', label: '服务区域', children: selectedSupplier.region },
                { key: 'contact', label: '主要联系人', children: selectedSupplier.contact },
                { key: 'phone', label: '联系电话', children: selectedSupplier.phone },
                { key: 'hotline', label: '服务热线', children: selectedSupplier.hotline },
                { key: 'email', label: '服务邮箱', children: selectedSupplier.email, span: 2 },
              ]} />
            </div>
            <div className="supplier-resource-detail-section">
              <h3>关联资源</h3>
              <div className="supplier-resource-stats">
                <div><span>数据中心</span><strong>{selectedSupplier.dataCenters}</strong></div>
                <div><span>集群</span><strong>{selectedSupplier.clusters}</strong></div>
                <div><span>机器</span><strong>{selectedSupplier.machines}</strong></div>
              </div>
            </div>
            <div className="supplier-resource-detail-actions">
              <Button onClick={() => message.info('编辑档案')}>编辑档案</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                dataCenterForm.setFieldValue('supplierKey', selectedSupplier.key);
                setDataCenterModalOpen(true);
              }}>在此新建数据中心</Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget('supplier')}>删除供应商</Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );

  const dataCenterPanel = (
    <div className="supplier-resource-workspace">
      <section className="supplier-resource-list">
        <div className="supplier-resource-toolbar data-center">
          <Input.Search allowClear value={dataCenterSearch} onChange={(event) => setDataCenterSearch(event.target.value)} placeholder="搜索数据中心名称、编号或位置" />
          <Select
            value={dataCenterSupplier}
            onChange={setDataCenterSupplier}
            options={[{ value: 'all', label: '全部供应商' }, ...suppliers.map((item) => ({ value: item.key, label: item.name }))]}
          />
          <Select
            value={dataCenterStatus}
            onChange={setDataCenterStatus}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'normal', label: '运行中' },
              { value: 'attention', label: '需关注' },
              { value: 'pending', label: '待接入' },
            ]}
          />
          <span className="supplier-resource-count">共 {filteredDataCenters.length} 个数据中心</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDataCenterModalOpen(true)}>新建数据中心</Button>
        </div>
        <Table
          columns={dataCenterColumns}
          dataSource={filteredDataCenters}
          rowKey="key"
          pagination={false}
          scroll={{ y: 'calc(100vh - 270px)' }}
          rowClassName={(record) => record.key === selectedDataCenter?.key ? 'selected-row' : ''}
          onRow={(record) => ({ onClick: () => setSelectedDataCenterKey(record.key) })}
        />
      </section>
      <aside className="supplier-resource-detail">
        <div className="supplier-resource-detail-head">
          <div><strong>{selectedDataCenter?.name}</strong><span>{selectedDataCenter?.code} · {selectedDataCenter?.supplier}</span></div>
          {selectedDataCenter && <StatusTag status={selectedDataCenter.status} label={selectedDataCenter.statusLabel} />}
        </div>
        {selectedDataCenter && (
          <>
            <div className="supplier-resource-detail-section">
              <h3>基础与网络</h3>
              <Descriptions column={2} colon={false} size="small" items={[
                { key: 'location', label: '位置', children: selectedDataCenter.location },
                { key: 'timezone', label: '时区', children: selectedDataCenter.timezone },
                { key: 'management', label: '管理网段', children: selectedDataCenter.managementCidr },
                { key: 'bmc', label: 'BMC 网段', children: selectedDataCenter.bmcCidr },
                { key: 'business', label: '业务网段', children: selectedDataCenter.businessCidr },
                { key: 'proxy', label: '出口／代理', children: selectedDataCenter.proxy },
              ]} />
            </div>
            <div className="supplier-resource-detail-section">
              <h3>关联资源</h3>
              <div className="supplier-resource-stats">
                <div><span>集群</span><strong>{selectedDataCenter.clusters}</strong></div>
                <div><span>机器</span><strong>{selectedDataCenter.machines}</strong></div>
                <div><span>未分配机器</span><strong>{selectedDataCenter.freeMachines}</strong></div>
              </div>
            </div>
            <div className="supplier-resource-detail-actions">
              <Button onClick={() => message.info('编辑档案')}>编辑档案</Button>
              <Button icon={<CloudServerOutlined />} onClick={() => setMachineModalOpen(true)}>纳管裸金属</Button>
              <Button type="primary" icon={<ApartmentOutlined />} onClick={() => setClusterModalOpen(true)}>创建／接入集群</Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget('dataCenter')}>删除数据中心</Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );

  return (
    <div className="supplier-resources-page">
      <header className="supplier-resources-header">
        <div>
          <h1>供应商资源列表与新增</h1>
          <p>分别维护供应商与数据中心档案，并从数据中心发起裸金属纳管和 Kubernetes 集群接入。</p>
        </div>
      </header>
      <Tabs
        activeKey={activeKind}
        onChange={(key) => setActiveKind(key as 'suppliers' | 'dataCenters')}
        items={[
          { key: 'suppliers', label: <span>供应商 <Tag bordered={false}>{suppliers.length}</Tag></span>, children: supplierPanel },
          { key: 'dataCenters', label: <span>数据中心 <Tag bordered={false}>{dataCenters.length}</Tag></span>, children: dataCenterPanel },
        ]}
      />

      <Modal title="新建供应商" open={supplierModalOpen} width={720} okText="创建供应商" onOk={createSupplier} onCancel={() => setSupplierModalOpen(false)}>
        <p className="supplier-resource-modal-note">录入合作方基础资料，建立供应商档案。资源到期时间在具体机器纳管时维护。</p>
        <Form form={supplierForm} layout="vertical">
          <div className="supplier-resource-form-grid">
            <Form.Item label="供应商名称" name="name" rules={[{ required: true, message: '请输入供应商名称' }]}><Input placeholder="例如：某某算力科技" /></Form.Item>
            <Form.Item label="服务类型" name="type" initialValue="算力／裸金属"><Select options={['算力／裸金属', 'IDC 机房服务', '云资源', '综合服务'].map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item label="服务区域" name="region" rules={[{ required: true, message: '请输入服务区域' }]}><Input placeholder="例如：华东" /></Form.Item>
            <Form.Item label="覆盖城市" name="coverage"><Input placeholder="例如：上海、杭州" /></Form.Item>
            <Form.Item label="主要联系人（选填）" name="contact"><Input /></Form.Item>
            <Form.Item label="联系电话（选填）" name="phone"><Input /></Form.Item>
            <Form.Item label="服务邮箱（选填）" name="email"><Input /></Form.Item>
            <Form.Item label="服务热线（选填）" name="hotline"><Input /></Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal title="新建数据中心" open={dataCenterModalOpen} width={760} okText="创建数据中心" onOk={createDataCenter} onCancel={() => setDataCenterModalOpen(false)}>
        <p className="supplier-resource-modal-note">创建数据中心只建立资源归属和网络档案；完成后再纳管机器，或使用已纳管机器创建集群。</p>
        <Form form={dataCenterForm} layout="vertical">
          <div className="supplier-resource-form-grid">
            <Form.Item label="数据中心名称" name="name" rules={[{ required: true, message: '请输入数据中心名称' }]}><Input placeholder="例如：上海二号数据中心" /></Form.Item>
            <Form.Item label="所属供应商" name="supplierKey" rules={[{ required: true, message: '请选择供应商' }]}><Select showSearch optionFilterProp="label" options={suppliers.map((item) => ({ value: item.key, label: item.name }))} /></Form.Item>
            <Form.Item label="位置" name="location" rules={[{ required: true, message: '请输入位置' }]}><Input placeholder="省市、国家地区或机房位置" /></Form.Item>
            <Form.Item label="时区" name="timezone" initialValue="UTC+08:00"><Select options={['UTC+08:00', 'UTC+00:00', 'UTC+09:00'].map((value) => ({ value, label: value }))} /></Form.Item>
            <Form.Item label="管理网段" name="managementCidr" rules={[{ required: true, message: '请输入管理网段' }]}><Input placeholder="10.24.16.0/20" /></Form.Item>
            <Form.Item label="BMC 网段（选填）" name="bmcCidr"><Input placeholder="172.20.16.0/22" /></Form.Item>
            <Form.Item label="业务网段（选填）" name="businessCidr"><Input placeholder="10.28.0.0/16" /></Form.Item>
            <Form.Item label="出口／代理（选填）" name="proxy"><Input placeholder="代理地址或专线说明" /></Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal title="纳管裸金属机器" open={machineModalOpen} width={680} okText="创建纳管任务" onOk={createMachineTask} onCancel={() => setMachineModalOpen(false)}>
        <p className="supplier-resource-modal-note">机器将先进入“{selectedDataCenter?.name}”的裸金属资源池，不会自动注册为 Kubernetes Node。</p>
        <Form form={machineForm} layout="vertical">
          <Form.Item label="接入方式" name="method" initialValue="ssh"><Select options={[{ value: 'ssh', label: 'IP 段 + SSH' }, { value: 'file', label: '导入机器清单' }, { value: 'offline', label: '离线采集包' }]} /></Form.Item>
          <Form.Item label="IP／IP 段" name="ipRange" rules={[{ required: true, message: '请输入 IP 或 IP 段' }]}><Input placeholder="10.24.18.121-10.24.18.130" /></Form.Item>
          <Form.Item label="SSH 凭据" name="credential" rules={[{ required: true, message: '请选择 SSH 凭据' }]}><Select options={[{ value: 'sh-dc-root-key-01', label: 'sh-dc-root-key-01' }, { value: 'cluster-default-root-key', label: 'cluster-default-root-key' }]} /></Form.Item>
          <Form.Item label="资源到期时间（选填）" name="expiresAt"><Input placeholder="YYYY-MM-DD；到期前 30 天提醒" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="创建／接入 Kubernetes 集群" open={clusterModalOpen} width={720} okText="创建接入任务" onOk={createClusterTask} onCancel={() => setClusterModalOpen(false)}>
        <p className="supplier-resource-modal-note">集群使用当前数据中心的机器；接入已有集群不会重装或升级 Kubernetes。</p>
        <Form form={clusterForm} layout="vertical">
          <Form.Item label="集群名称" name="name" rules={[{ required: true, message: '请输入集群名称' }]}><Input placeholder="例如：gpu-prod-02" /></Form.Item>
          <Form.Item label="接入方式" name="method" initialValue="existing"><Select options={[{ value: 'existing', label: '接入已有 Kubernetes' }, { value: 'remote', label: '使用已纳管机器远程部署新集群' }, { value: 'offline', label: '离线软件包接入' }]} /></Form.Item>
          <Form.Item label="API Server／管理地址" name="endpoint" rules={[{ required: true, message: '请输入连接地址' }]}><Input placeholder="https://10.24.16.10:6443" /></Form.Item>
          <Form.Item label="说明" name="remark"><Input.TextArea rows={3} placeholder="可选，用于记录接入范围或部署说明" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={deleteTarget === 'supplier' ? '删除供应商' : '删除数据中心'} open={Boolean(deleteTarget)} footer={<Button onClick={() => setDeleteTarget(null)}>返回</Button>} onCancel={() => setDeleteTarget(null)}>
        <div className="supplier-resource-delete-check">
          <strong>校验未通过，暂不能删除</strong>
          <p>{deleteTarget === 'supplier' ? `“${selectedSupplier?.name}”仍有关联的数据中心、集群和机器。` : `“${selectedDataCenter?.name}”仍承载集群或已纳管机器。`}</p>
          <Space wrap>
            <Tag>关联集群 {deleteTarget === 'supplier' ? selectedSupplier?.clusters : selectedDataCenter?.clusters}</Tag>
            <Tag>关联机器 {deleteTarget === 'supplier' ? selectedSupplier?.machines : selectedDataCenter?.machines}</Tag>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierResourcesPage;
