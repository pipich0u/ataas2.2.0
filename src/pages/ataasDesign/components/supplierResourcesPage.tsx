import {
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Button,
  Dropdown,
  Form,
  Input,
  message,
  Modal,
  Select,
  Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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
  manager: string;
  managerPhone: string;
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

type ResourceSnapshot = {
  suppliers: SupplierRecord[];
  dataCenters: DataCenterRecord[];
};

const initialSnapshot: ResourceSnapshot = {
  suppliers: [
    {
      key: 'supplier-sensetime',
      name: '商汤',
      code: 'SUP-2026-001',
      type: '算力与裸金属',
      region: '华东',
      coverage: '上海',
      dataCenters: 1,
      clusters: 1,
      machines: 3,
      status: 'attention',
      contact: '周明',
      phone: '021-5890 1024',
      email: 'infra-service@sensetime.example',
      hotline: '400-900-1024',
    },
    {
      key: 'supplier-parallel',
      name: '并行科技',
      code: 'SUP-2026-002',
      type: '高性能计算服务',
      region: '华中／华南',
      coverage: '广州、武汉',
      dataCenters: 2,
      clusters: 2,
      machines: 1,
      status: 'normal',
      contact: '陈工',
      phone: '020-8901 2068',
      email: 'resource@parallel.example',
      hotline: '400-860-2068',
    },
    {
      key: 'supplier-yancheng',
      name: '盐城',
      code: 'SUP-2026-003',
      type: '算力基础设施',
      region: '华北',
      coverage: '北京',
      dataCenters: 1,
      clusters: 1,
      machines: 6,
      status: 'attention',
      contact: '王宁',
      phone: '010-6788 3056',
      email: 'ops@yancheng-compute.example',
      hotline: '400-810-3056',
    },
  ],
  dataCenters: [
    {
      key: 'dc-sh-waigaoqiao',
      name: '上海外高桥数据中心',
      code: 'DC-SH-001',
      supplierKey: 'supplier-sensetime',
      supplier: '商汤',
      manager: '刘工',
      managerPhone: '021-5890 1025',
      location: '上海市浦东新区',
      timezone: 'UTC+08:00',
      managementCidr: '10.24.16.0/20',
      bmcCidr: '172.20.16.0/22',
      businessCidr: '10.28.0.0/16',
      proxy: '专线出口 · 已配置',
      clusters: 1,
      machines: 3,
      freeMachines: 0,
      status: 'attention',
      statusLabel: '1 项异常',
    },
    {
      key: 'dc-gz-science-city',
      name: '广州科学城数据中心',
      code: 'DC-GZ-001',
      supplierKey: 'supplier-parallel',
      supplier: '并行科技',
      manager: '吴工',
      managerPhone: '020-8901 2069',
      location: '广东省广州市黄埔区',
      timezone: 'UTC+08:00',
      managementCidr: '10.34.0.0/20',
      bmcCidr: '172.21.0.0/22',
      businessCidr: '10.38.0.0/16',
      proxy: '专线出口 · 已配置',
      clusters: 1,
      machines: 1,
      freeMachines: 0,
      status: 'normal',
      statusLabel: '运行中',
    },
    {
      key: 'dc-wh-optics-valley',
      name: '武汉光谷数据中心',
      code: 'DC-WH-001',
      supplierKey: 'supplier-parallel',
      supplier: '并行科技',
      manager: '徐工',
      managerPhone: '027-8701 1038',
      location: '湖北省武汉市东湖高新区',
      timezone: 'UTC+08:00',
      managementCidr: '10.35.0.0/20',
      bmcCidr: '172.21.16.0/22',
      businessCidr: '10.39.0.0/16',
      proxy: '专线出口 · 已配置',
      clusters: 1,
      machines: 0,
      freeMachines: 0,
      status: 'normal',
      statusLabel: '运行中',
    },
    {
      key: 'dc-bj-yizhuang',
      name: '北京亦庄数据中心',
      code: 'DC-BJ-001',
      supplierKey: 'supplier-yancheng',
      supplier: '盐城',
      manager: '赵工',
      managerPhone: '010-6788 3057',
      location: '北京市大兴区亦庄',
      timezone: 'UTC+08:00',
      managementCidr: '10.44.0.0/20',
      bmcCidr: '172.22.0.0/22',
      businessCidr: '10.48.0.0/16',
      proxy: '云专线 · 已配置',
      clusters: 1,
      machines: 6,
      freeMachines: 0,
      status: 'attention',
      statusLabel: '2 项异常',
    },
  ],
};

let resourceSnapshot = initialSnapshot;
const resourceListeners = new Set<() => void>();

const publishSnapshot = (next: ResourceSnapshot) => {
  resourceSnapshot = next;
  resourceListeners.forEach((listener) => listener());
};

const subscribeResourceSnapshot = (listener: () => void) => {
  resourceListeners.add(listener);
  return () => resourceListeners.delete(listener);
};

const useSupplierResourceSnapshot = () => (
  useSyncExternalStore(
    subscribeResourceSnapshot,
    () => resourceSnapshot,
    () => resourceSnapshot,
  )
);

const statusText: Record<ResourceStatus, string> = {
  normal: '合作中',
  attention: '需关注',
  pending: '待接入',
};

const StatusTag = ({ status }: { status: ResourceStatus }) => (
  <span className={`supplier-resource-status ${status}`}>
    <i />
    {statusText[status]}
  </span>
);

export type SupplierResourceCreateKind = 'supplier' | 'dataCenter' | 'machine' | 'cluster';

export const supplierResourceCreateMenuItems = [
  {
    type: 'group' as const,
    label: '资源档案',
    children: [
      { key: 'supplier', label: '新增供应商' },
      { key: 'dataCenter', label: '新增数据中心' },
    ],
  },
  {
    type: 'group' as const,
    label: '已有数据中心',
    children: [
      { key: 'machine', label: '纳管裸金属' },
      { key: 'cluster', label: '创建／接入集群' },
    ],
  },
];

type SupplierResourceCreateFlowProps = {
  openKind: SupplierResourceCreateKind | null;
  onClose: () => void;
};

type CreateStage = 'supplier' | 'dataCenter' | 'completed' | 'machine' | 'cluster' | null;

export const SupplierResourceCreateFlow = ({
  openKind,
  onClose,
}: SupplierResourceCreateFlowProps) => {
  const { suppliers, dataCenters } = useSupplierResourceSnapshot();
  const [stage, setStage] = useState<CreateStage>(null);
  const [createdDataCenter, setCreatedDataCenter] = useState<DataCenterRecord | null>(null);
  const [supplierForm] = Form.useForm();
  const [dataCenterForm] = Form.useForm();
  const [machineForm] = Form.useForm();
  const [clusterForm] = Form.useForm();
  const machineDataCenterKey = Form.useWatch('dataCenterKey', machineForm);
  const clusterDataCenterKey = Form.useWatch('dataCenterKey', clusterForm);
  const machineDataCenter = dataCenters.find((item) => item.key === machineDataCenterKey);
  const clusterDataCenter = dataCenters.find((item) => item.key === clusterDataCenterKey);

  useEffect(() => {
    if (!openKind) return;
    setStage(openKind);
    setCreatedDataCenter(null);
    supplierForm.resetFields();
    dataCenterForm.resetFields();
    machineForm.resetFields();
    clusterForm.resetFields();
  }, [clusterForm, dataCenterForm, machineForm, openKind, supplierForm]);

  const closeFlow = () => {
    setStage(null);
    setCreatedDataCenter(null);
    onClose();
  };

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
    publishSnapshot({
      ...resourceSnapshot,
      suppliers: [next, ...resourceSnapshot.suppliers],
    });
    supplierForm.resetFields();
    message.success('供应商档案已创建');
    closeFlow();
  };

  const createDataCenter = async () => {
    const values = await dataCenterForm.validateFields();
    const supplier = resourceSnapshot.suppliers.find((item) => item.key === values.supplierKey);
    if (!supplier) return;
    const next: DataCenterRecord = {
      key: `dc-${Date.now()}`,
      name: values.name,
      code: `DC-${String(dataCenters.length + 1).padStart(3, '0')}`,
      supplierKey: supplier.key,
      supplier: supplier.name,
      manager: values.manager || '—',
      managerPhone: values.managerPhone || '—',
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
    publishSnapshot({
      suppliers: resourceSnapshot.suppliers.map((item) => (
        item.key === supplier.key
          ? { ...item, dataCenters: item.dataCenters + 1 }
          : item
      )),
      dataCenters: [next, ...resourceSnapshot.dataCenters],
    });
    setCreatedDataCenter(next);
    machineForm.setFieldValue('dataCenterKey', next.key);
    clusterForm.setFieldValue('dataCenterKey', next.key);
    setStage('completed');
    message.success('数据中心档案已创建');
  };

  const createMachineTask = async () => {
    await machineForm.validateFields();
    message.success('裸金属发现与纳管任务已创建');
    closeFlow();
  };

  const createClusterTask = async () => {
    await clusterForm.validateFields();
    message.success('Kubernetes 集群接入任务已创建');
    closeFlow();
  };

  return (
    <>
      <Modal
        rootClassName="supplier-resource-create-modal"
        title="新增供应商"
        open={stage === 'supplier'}
        width={720}
        okText="创建供应商"
        cancelText="取消"
        onOk={createSupplier}
        onCancel={closeFlow}
      >
        <p className="supplier-resource-modal-note">录入合作方基础资料，建立供应商档案。资源到期时间在具体机器纳管时维护。</p>
        <Form form={supplierForm} layout="vertical">
          <div className="supplier-resource-form-grid">
            <Form.Item label="供应商名称" name="name" rules={[{ required: true, message: '请输入供应商名称' }]}>
              <Input placeholder="例如：某某算力科技" />
            </Form.Item>
            <Form.Item label="服务类型" name="type" initialValue="算力／裸金属">
              <Select options={['算力／裸金属', 'IDC 机房服务', '云资源', '综合服务'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item label="服务区域" name="region" rules={[{ required: true, message: '请输入服务区域' }]}>
              <Input placeholder="例如：华东" />
            </Form.Item>
            <Form.Item label="覆盖城市" name="coverage">
              <Input placeholder="例如：上海、杭州" />
            </Form.Item>
            <Form.Item label="供应商总负责人（选填）" name="contact">
              <Input />
            </Form.Item>
            <Form.Item label="联系电话（选填）" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="服务邮箱（选填）" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="服务热线（选填）" name="hotline">
              <Input />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        rootClassName="supplier-resource-create-modal"
        title="新增数据中心"
        open={stage === 'dataCenter'}
        width={760}
        okText="创建数据中心"
        cancelText="取消"
        onOk={createDataCenter}
        onCancel={closeFlow}
      >
        <p className="supplier-resource-modal-note">创建数据中心只建立资源归属和网络档案；完成后再纳管机器，或使用已纳管机器创建集群。</p>
        <Form form={dataCenterForm} layout="vertical">
          <div className="supplier-resource-form-grid">
            <Form.Item label="数据中心名称" name="name" rules={[{ required: true, message: '请输入数据中心名称' }]}>
              <Input placeholder="例如：上海二号数据中心" />
            </Form.Item>
            <Form.Item label="所属供应商" name="supplierKey" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select showSearch optionFilterProp="label" options={suppliers.map((item) => ({ value: item.key, label: item.name }))} />
            </Form.Item>
            <Form.Item label="位置" name="location" rules={[{ required: true, message: '请输入位置' }]}>
              <Input placeholder="省市、国家地区或机房位置" />
            </Form.Item>
            <Form.Item label="时区" name="timezone" initialValue="UTC+08:00">
              <Select options={['UTC+08:00', 'UTC+00:00', 'UTC+09:00'].map((value) => ({ value, label: value }))} />
            </Form.Item>
            <Form.Item label="数据中心负责人（选填）" name="manager">
              <Input placeholder="例如：刘工" />
            </Form.Item>
            <Form.Item label="负责人电话（选填）" name="managerPhone">
              <Input placeholder="例如：021-5890 1025" />
            </Form.Item>
            <Form.Item label="管理网段" name="managementCidr" rules={[{ required: true, message: '请输入管理网段' }]}>
              <Input placeholder="10.24.16.0/20" />
            </Form.Item>
            <Form.Item label="BMC 网段（选填）" name="bmcCidr">
              <Input placeholder="172.20.16.0/22" />
            </Form.Item>
            <Form.Item label="业务网段（选填）" name="businessCidr">
              <Input placeholder="10.28.0.0/16" />
            </Form.Item>
            <Form.Item label="出口／代理（选填）" name="proxy">
              <Input placeholder="代理地址或专线说明" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        rootClassName="supplier-resource-create-modal"
        title="数据中心已创建"
        open={stage === 'completed'}
        width={600}
        footer={null}
        onCancel={closeFlow}
      >
        <div className="supplier-resource-create-result">
          <CheckCircleOutlined />
          <div>
            <h3>{createdDataCenter?.name}</h3>
            <p>资源归属与网络档案已建立，可立即延续下一步接入流程。</p>
          </div>
        </div>
        <div className="supplier-resource-next-actions">
          <Button onClick={() => setStage('machine')}>纳管裸金属机器</Button>
          <Button type="primary" onClick={() => setStage('cluster')}>创建／接入集群</Button>
          <Button type="text" onClick={closeFlow}>稍后处理</Button>
        </div>
      </Modal>

      <Modal
        rootClassName="supplier-resource-create-modal"
        title="纳管裸金属机器"
        open={stage === 'machine'}
        width={680}
        okText="创建纳管任务"
        cancelText={createdDataCenter ? '返回' : '取消'}
        onOk={createMachineTask}
        onCancel={() => createdDataCenter ? setStage('completed') : closeFlow()}
      >
        <p className="supplier-resource-modal-note">
          机器将先进入“{machineDataCenter?.name || '所选数据中心'}”的裸金属资源池，不会自动注册为 Kubernetes Node。
        </p>
        <Form form={machineForm} layout="vertical">
          <Form.Item label="所属数据中心" name="dataCenterKey" rules={[{ required: true, message: '请选择数据中心' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="请选择已有数据中心"
              options={dataCenters.map((item) => ({
                value: item.key,
                label: `${item.name} · ${item.supplier}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="接入方式" name="method" initialValue="ssh">
            <Select options={[
              { value: 'ssh', label: 'IP 段 + SSH' },
              { value: 'file', label: '导入机器清单' },
              { value: 'offline', label: '离线采集包' },
            ]} />
          </Form.Item>
          <Form.Item label="IP／IP 段" name="ipRange" rules={[{ required: true, message: '请输入 IP 或 IP 段' }]}>
            <Input placeholder="10.24.18.121-10.24.18.130" />
          </Form.Item>
          <Form.Item label="SSH 凭据" name="credential" rules={[{ required: true, message: '请选择 SSH 凭据' }]}>
            <Select options={[
              { value: 'sh-dc-root-key-01', label: 'sh-dc-root-key-01' },
              { value: 'cluster-default-root-key', label: 'cluster-default-root-key' },
            ]} />
          </Form.Item>
          <Form.Item label="资源到期时间（选填）" name="expiresAt">
            <Input placeholder="YYYY-MM-DD；到期前 30 天提醒" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        rootClassName="supplier-resource-create-modal"
        title="创建／接入 Kubernetes 集群"
        open={stage === 'cluster'}
        width={720}
        okText="创建接入任务"
        cancelText={createdDataCenter ? '返回' : '取消'}
        onOk={createClusterTask}
        onCancel={() => createdDataCenter ? setStage('completed') : closeFlow()}
      >
        <p className="supplier-resource-modal-note">
          集群使用“{clusterDataCenter?.name || '所选数据中心'}”的机器；接入已有集群不会重装或升级 Kubernetes。
        </p>
        <Form form={clusterForm} layout="vertical">
          <Form.Item label="所属数据中心" name="dataCenterKey" rules={[{ required: true, message: '请选择数据中心' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="请选择已有数据中心"
              options={dataCenters.map((item) => ({
                value: item.key,
                label: `${item.name} · ${item.supplier}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="集群名称" name="name" rules={[{ required: true, message: '请输入集群名称' }]}>
            <Input placeholder="例如：gpu-prod-02" />
          </Form.Item>
          <Form.Item label="接入方式" name="method" initialValue="existing">
            <Select options={[
              { value: 'existing', label: '接入已有 Kubernetes' },
              { value: 'remote', label: '使用已纳管机器远程部署新集群' },
              { value: 'offline', label: '离线软件包接入' },
            ]} />
          </Form.Item>
          <Form.Item label="API Server／管理地址" name="endpoint" rules={[{ required: true, message: '请输入连接地址' }]}>
            <Input placeholder="https://10.24.16.10:6443" />
          </Form.Item>
          <Form.Item label="说明" name="remark">
            <Input.TextArea rows={3} placeholder="可选，用于记录接入范围或部署说明" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const SupplierExpandedDetail = ({
  supplier,
}: {
  supplier: SupplierRecord;
}) => {
  const { dataCenters } = useSupplierResourceSnapshot();
  const supplierDataCenters = dataCenters.filter((item) => item.supplierKey === supplier.key);

  return (
    <div className="supplier-expanded-detail">
      <section>
        <h3>基础信息</h3>
        <dl className="supplier-detail-grid">
          <div><dt>供应商编号</dt><dd>{supplier.code}</dd></div>
          <div><dt>服务类型</dt><dd>{supplier.type}</dd></div>
          <div><dt>服务区域</dt><dd>{supplier.region}</dd></div>
          <div><dt>覆盖城市</dt><dd>{supplier.coverage}</dd></div>
        </dl>
      </section>
      <section>
        <h3>供应商总负责人</h3>
        <dl className="supplier-detail-grid contact">
          <div><dt>总负责人</dt><dd>{supplier.contact}</dd></div>
          <div><dt>联系电话</dt><dd>{supplier.phone}</dd></div>
          <div><dt>服务邮箱</dt><dd>{supplier.email}</dd></div>
          <div><dt>服务热线</dt><dd>{supplier.hotline}</dd></div>
        </dl>
      </section>
      <section className="supplier-detail-resources">
        <h3>关联资源</h3>
        <div className="supplier-resource-summary">
          <div><span>数据中心</span><strong>{supplier.dataCenters}</strong></div>
          <div><span>集群</span><strong>{supplier.clusters}</strong></div>
          <div><span>机器</span><strong>{supplier.machines}</strong></div>
        </div>
        <div className="supplier-data-center-list">
          {supplierDataCenters.length ? supplierDataCenters.map((item) => (
            <div key={item.key}>
              <strong title={item.name}>{item.name}</strong>
              <span>{item.manager}</span>
              <small>{item.managerPhone}</small>
            </div>
          )) : <em>暂未关联数据中心</em>}
        </div>
      </section>
    </div>
  );
};

const SupplierResourcesPage = () => {
  const { suppliers, dataCenters } = useSupplierResourceSnapshot();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ResourceStatus | 'all'>('all');
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [createKind, setCreateKind] = useState<SupplierResourceCreateKind | null>(null);

  const filteredSuppliers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return suppliers.filter((item) => {
      const relatedDataCenters = dataCenters.filter((dataCenter) => dataCenter.supplierKey === item.key);
      const searchMatch = !keyword || [
        item.name,
        item.code,
        item.type,
        item.region,
        item.coverage,
        item.contact,
        item.phone,
        ...relatedDataCenters.flatMap((dataCenter) => [
          dataCenter.name,
          dataCenter.manager,
          dataCenter.managerPhone,
        ]),
      ].join(' ').toLowerCase().includes(keyword);
      return searchMatch && (status === 'all' || item.status === status);
    });
  }, [dataCenters, search, status, suppliers]);

  const columns: ColumnsType<SupplierRecord> = [
    {
      title: '供应商',
      dataIndex: 'name',
      key: 'name',
      width: 190,
      render: (value, record) => (
        <span className="supplier-resource-main">
          <strong>{value}</strong>
          <small>{record.code} · {record.type}</small>
        </span>
      ),
    },
    {
      title: '服务区域',
      key: 'region',
      width: 128,
      render: (_, record) => (
        <span className="supplier-resource-main secondary">
          <strong>{record.region}</strong>
          <small>{record.coverage}</small>
        </span>
      ),
    },
    { title: '数据中心', dataIndex: 'dataCenters', key: 'dataCenters', width: 82, render: (value) => `${value} 个` },
    { title: '集群', dataIndex: 'clusters', key: 'clusters', width: 70, render: (value) => `${value} 个` },
    { title: '机器', dataIndex: 'machines', key: 'machines', width: 70, render: (value) => `${value} 台` },
    {
      title: '供应商总负责人',
      key: 'contact',
      width: 144,
      render: (_, record) => (
        <span className="supplier-resource-main secondary">
          <strong>{record.contact}</strong>
          <small>{record.phone}</small>
        </span>
      ),
    },
    {
      title: '数据中心负责人',
      key: 'dataCenterManagers',
      width: 156,
      render: (_, record) => {
        const managers = dataCenters
          .filter((item) => item.supplierKey === record.key)
          .map((item) => item.manager)
          .filter((manager) => manager && manager !== '—');
        const uniqueManagers = Array.from(new Set(managers));
        return (
          <span className="supplier-resource-main secondary">
            <strong title={uniqueManagers.join('、')}>{uniqueManagers.join('、') || '—'}</strong>
            <small>{uniqueManagers.length ? `${uniqueManagers.length} 位负责人` : '暂未配置'}</small>
          </span>
        );
      },
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 92, render: (value) => <StatusTag status={value} /> },
  ];

  return (
    <div className="supplier-resources-page">
      <header className="supplier-resources-header">
        <div>
          <h1>供应商列表</h1>
          <p>集中查看供应商档案、联系方式与已关联的算力资源。</p>
        </div>
      </header>

      <section className="supplier-list-frame">
        <div className="supplier-resource-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索供应商、数据中心或负责人"
          />
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'normal', label: '合作中' },
              { value: 'attention', label: '需关注' },
              { value: 'pending', label: '待接入' },
            ]}
          />
          <span className="supplier-resource-count">共 {filteredSuppliers.length} 家供应商</span>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: supplierResourceCreateMenuItems,
              onClick: ({ key }) => setCreateKind(key as SupplierResourceCreateKind),
            }}
          >
            <Button
              type="primary"
              className="ataas-deploy-create-button"
              icon={<PlusOutlined />}
            >
              新增
            </Button>
          </Dropdown>
        </div>
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="key"
          pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 家` }}
          scroll={{ x: 932 }}
          rowClassName={(record) => (
            expandedRowKeys.includes(record.key) ? 'supplier-row-expanded' : ''
          )}
          expandable={{
            showExpandColumn: false,
            expandRowByClick: true,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
            expandedRowRender: (record) => <SupplierExpandedDetail supplier={record} />,
          }}
        />
      </section>
      <SupplierResourceCreateFlow
        openKind={createKind}
        onClose={() => setCreateKind(null)}
      />
    </div>
  );
};

export default SupplierResourcesPage;
