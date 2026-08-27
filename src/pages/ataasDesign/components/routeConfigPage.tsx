import {
  DeleteOutlined,
  EditOutlined,
  FileSearchOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, ConfigProvider, Drawer, Form, Input, InputNumber, message, Modal, Select, Switch, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useRef, useState } from 'react';
import { dump as dumpYaml, load as loadYaml } from 'js-yaml';
import { MonacoEditor } from '../../../components/shared/MonacoEditor';
import { canvasServiceEntryEndpoints, routeConfigStore, serviceEntryStore, useRouteConfigStore, useServiceEntryStore, type RouteAuthMode as AuthMode, type RouteMatchType as MatchType, type RouteType, type ServiceEntryEndpoint, type SharedRouteRecord as RouteRecord } from './routeConfigStore';
import { buildRoutePluginConfigDefaults, ROUTE_PLUGIN_CONFIG_SCHEMAS, type RoutePluginConfigValue } from './routePluginConfig';
import { PLUGIN_MANAGEMENT_MOCK_DATA } from './pluginManagementPage';
import './routeConfigPage.less';

const matchLabels: Record<MatchType, string> = { prefix: '前缀匹配', exact: '精确匹配', regex: '正则匹配' };
const authLabels: Record<AuthMode, string> = { none: '未开启认证', consumer: 'Consumer 认证', anonymous: '允许匿名访问' };
const routeTypeLabels: Record<RouteType, string> = { production: '生产路由', mirror: '镜像路由', coordination: '协调路由' };
const routePluginCatalog = PLUGIN_MANAGEMENT_MOCK_DATA.filter((plugin) => plugin.status === 'enabled' && plugin.scope.includes('路由') && !plugin.scope.includes('全局'));

type RouteFormValues = Omit<RouteRecord, 'id' | 'enabled' | 'policies' | 'pluginConfigs' | 'serviceEntry'>;
type RuleRow = { id: number; key: string; operator: string; value: string };
type AnnotationRow = { id: number; key: string; value: string };
type ServiceMeshExitRecord = {
  id: string;
  name: string;
  cluster: string;
  host: string;
  port: string;
  endpoints: ServiceEntryEndpoint[];
  ingressNames: string[];
};

const TruncatedText = ({ text, className }: { text: string; className?: string }) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const checkOverflow = () => {
    const element = textRef.current;
    setTruncated(Boolean(element && element.scrollWidth > element.clientWidth));
  };

  return (
    <Tooltip title={truncated ? text : undefined} color="#fff" overlayClassName="route-config-white-tooltip">
      <span ref={textRef} className={`route-config-ellipsis ${className ?? ''}`} onMouseEnter={checkOverflow}>{text}</span>
    </Tooltip>
  );
};

const RouteConfigPage = () => {
  const routes = useRouteConfigStore();
  const standaloneServiceEntries = useServiceEntryStore();
  const [keyword, setKeyword] = useState('');
  const [routeTypeFilter, setRouteTypeFilter] = useState<'all' | RouteType>('all');
  const [routePage, setRoutePage] = useState(1);
  const [resourceView, setResourceView] = useState<'ingress' | 'egress'>('ingress');
  const [expandedId, setExpandedId] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<RouteRecord>();
  const [policyRoute, setPolicyRoute] = useState<RouteRecord>();
  const [policyDraft, setPolicyDraft] = useState<Record<string, Record<string, RoutePluginConfigValue>>>({});
  const [policyEditingPluginKey, setPolicyEditingPluginKey] = useState<string>();
  const [viewingPolicy, setViewingPolicy] = useState<{ route: RouteRecord; pluginKey: string }>();
  const [viewingPolicyDraft, setViewingPolicyDraft] = useState<Record<string, RoutePluginConfigValue>>({});
  const [form] = Form.useForm<RouteFormValues>();
  const [headerRules, setHeaderRules] = useState<RuleRow[]>([]);
  const [queryRules, setQueryRules] = useState<RuleRow[]>([]);
  const [annotations, setAnnotations] = useState<AnnotationRow[]>([]);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [editingExit, setEditingExit] = useState<ServiceMeshExitRecord>();
  const [exitEditorOpen, setExitEditorOpen] = useState(false);
  const [exitYaml, setExitYaml] = useState('');

  const filteredRoutes = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return routes.filter((route) => (routeTypeFilter === 'all' || route.routeType === routeTypeFilter)
      && (!query || [route.name, routeTypeLabels[route.routeType], route.domain, route.path, route.service].some((value) => value.toLowerCase().includes(query))));
  }, [keyword, routeTypeFilter, routes]);

  const serviceMeshExits = useMemo<ServiceMeshExitRecord[]>(() => {
    const grouped = new Map<string, RouteRecord[]>();
    routes.forEach((route) => grouped.set(route.serviceEntry, [...(grouped.get(route.serviceEntry) || []), route]));
    const linkedExits = Array.from(grouped.entries()).map(([name, linkedRoutes]) => ({
      id: `st1-se-${name}`,
      name,
      cluster: 'ST1',
      host: linkedRoutes[0]?.serviceEntryHost || `${name}.cluster.local`,
      port: '8000/tcp',
      endpoints: linkedRoutes[0]?.serviceEntryEndpoints?.length
        ? linkedRoutes[0].serviceEntryEndpoints
        : canvasServiceEntryEndpoints(name),
      ingressNames: linkedRoutes.map((route) => route.name),
    }));
    const linkedNames = new Set(linkedExits.map((exit) => exit.name));
    return [...linkedExits, ...standaloneServiceEntries.filter((entry) => !linkedNames.has(entry.name)).map((entry) => ({
      id: entry.id, name: entry.name, cluster: entry.cluster, host: entry.host, port: entry.port, endpoints: entry.endpoints, ingressNames: [],
    }))];
  }, [routes, standaloneServiceEntries]);

  const filteredServiceMeshExits = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) return serviceMeshExits;
    return serviceMeshExits.filter((item) => [item.name, item.cluster, item.host, ...item.endpoints.map((endpoint) => endpoint.address), ...item.ingressNames].some((value) => value.toLowerCase().includes(query)));
  }, [keyword, serviceMeshExits]);

  const openExitEditor = (exit: ServiceMeshExitRecord) => {
    setEditingExit(exit);
    setExitEditorOpen(true);
    setExitYaml(dumpYaml({
      apiVersion: 'networking.istio.io/v1beta1',
      kind: 'ServiceEntry',
      metadata: { name: exit.name, namespace: 'higress-system' },
      spec: {
        hosts: [exit.host],
        ports: [{ number: 8000, name: 'http', protocol: 'HTTP' }],
        endpoints: exit.endpoints,
      },
    }, { noRefs: true, lineWidth: 120 }));
  };

  const openCreateExit = () => {
    setEditingExit(undefined);
    setExitYaml(dumpYaml({
      apiVersion: 'networking.istio.io/v1beta1', kind: 'ServiceEntry',
      metadata: { name: 'new-service-entry', namespace: 'higress-system' },
      spec: { hosts: ['new-service-entry.cluster.local'], ports: [{ number: 8000, name: 'http', protocol: 'HTTP' }], endpoints: [{ address: 'target-svc.production.svc:8000', weight: 100 }] },
    }, { noRefs: true, lineWidth: 120 }));
    setExitEditorOpen(true);
  };

  const saveExitYaml = () => {
    try {
      const parsed = loadYaml(exitYaml) as { kind?: string; metadata?: { name?: string }; spec?: { hosts?: string[]; endpoints?: Array<{ address?: string; weight?: number }> } };
      if (!parsed || parsed.kind !== 'ServiceEntry') throw new Error('kind 必须为 ServiceEntry');
      const name = parsed.metadata?.name?.trim();
      const endpoints = (parsed.spec?.endpoints || []).map((endpoint) => ({ address: endpoint.address?.trim() || '', weight: Number(endpoint.weight ?? 100) }));
      if (!name) throw new Error('metadata.name 不能为空');
      if (!parsed.spec?.hosts?.[0]?.trim()) throw new Error('spec.hosts 不能为空');
      if (!endpoints.length || endpoints.some((endpoint) => !endpoint.address)) throw new Error('spec.endpoints[].address 不能为空');
      const host = parsed.spec?.hosts?.[0]?.trim();
      if (editingExit) {
        routes.filter((route) => route.serviceEntry === editingExit.name).forEach((route) => routeConfigStore.update(route.id, { serviceEntry: name, serviceEntryHost: host, serviceEntryEndpoints: endpoints, service: endpoints[0].address }));
        const standalone = standaloneServiceEntries.find((entry) => entry.name === editingExit.name);
        if (standalone) serviceEntryStore.update(standalone.id, { name, host, endpoints });
      } else {
        if (serviceMeshExits.some((exit) => exit.name === name)) throw new Error('metadata.name 已存在');
        serviceEntryStore.create({ id: `st1-se-manual-${Date.now()}`, name, cluster: 'ST1', namespace: 'higress-system', host, port: '8000/tcp', endpoints });
      }
      setEditingExit(undefined);
      setExitEditorOpen(false);
      message.success(editingExit ? 'ServiceEntry 已更新' : '服务网格出口已创建，并已同步到画布');
    } catch (error) {
      message.error(`YAML 配置错误：${error instanceof Error ? error.message : '无法解析'}`);
    }
  };

  const removeExit = (exit: ServiceMeshExitRecord) => Modal.confirm({
    title: `删除服务网格出口「${exit.name}」？`,
    content: `该出口关联 ${exit.ingressNames.length} 个服务网格入口，删除后关联入口也将一并移除。`,
    okText: '删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      routes.filter((route) => route.serviceEntry === exit.name).forEach((route) => routeConfigStore.remove(route.id));
      const standalone = standaloneServiceEntries.find((entry) => entry.name === exit.name);
      if (standalone) serviceEntryStore.remove(standalone.id);
      message.success('服务网格出口已删除');
    },
  });

  const openCreate = () => {
    setEditingRoute(undefined);
    form.setFieldsValue({ name: '', routeType: 'production', domain: '', matchType: 'prefix', path: '/', service: '', auth: 'consumer', methods: ['POST'], timeout: 60, retries: 1 });
    setHeaderRules([]);
    setQueryRules([]);
    setAnnotations([]);
    setAuthEnabled(false);
    setEditorOpen(true);
  };

  const openEdit = (route: RouteRecord) => {
    setEditingRoute(route);
    form.setFieldsValue({ name: route.name, routeType: route.routeType, domain: route.domain === '-' ? '' : route.domain, matchType: route.matchType, path: route.path, service: route.service, auth: route.auth === 'none' ? 'consumer' : route.auth, methods: route.methods, timeout: route.timeout, retries: route.retries });
    setHeaderRules([]);
    setQueryRules([]);
    setAnnotations([]);
    setAuthEnabled(route.auth !== 'none');
    setEditorOpen(true);
  };

  const saveRoute = async () => {
    const values = await form.validateFields();
    const normalizedValues = { ...values, auth: authEnabled ? values.auth : 'none' as AuthMode };
    if (editingRoute) {
      routeConfigStore.update(editingRoute.id, { ...normalizedValues, domain: values.domain || '-', serviceEntry: values.service.split('.')[0].replace(/-svc$/, '') });
      message.success('路由配置已更新');
    } else {
      routeConfigStore.create({ id: `st1-route-${Date.now()}`, enabled: true, policies: [], pluginConfigs: {}, serviceEntry: values.service.split('.')[0].replace(/-svc$/, ''), ...normalizedValues, domain: values.domain || '-' });
      message.success('路由创建成功');
    }
    setEditorOpen(false);
  };

  const removeRoute = (route: RouteRecord) => {
    Modal.confirm({
      title: `删除路由「${route.name}」？`,
      content: '删除后，对应域名与路径将不再转发到目标服务。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        routeConfigStore.remove(route.id);
        message.success('路由已删除');
      },
    });
  };

  const openPolicy = (route: RouteRecord) => {
    setPolicyRoute(route);
    setPolicyEditingPluginKey(undefined);
    setPolicyDraft(route.pluginConfigs || Object.fromEntries(route.policies.map((key) => [key, buildRoutePluginConfigDefaults(key)])));
  };

  const columns: ColumnsType<RouteRecord> = [
    {
      title: '路由名称', dataIndex: 'name', key: 'name', width: 210,
      render: (name: string) => <span className="route-config-name"><b>{name}</b></span>,
    },
    {
      title: '路由类型', dataIndex: 'routeType', key: 'routeType', width: 120,
      render: (routeType: RouteType) => <span className={`route-config-type route-config-type-${routeType}`}>{routeTypeLabels[routeType]}</span>,
    },
    { title: '域名', dataIndex: 'domain', key: 'domain', width: 210, render: (domain: string) => <TruncatedText text={domain} /> },
    {
      title: '路由条件', key: 'condition', width: 270,
      render: (_, route) => <span className="route-config-condition"><em>{matchLabels[route.matchType]}</em><code>{route.path}</code></span>,
    },
    { title: '目标服务', dataIndex: 'service', key: 'service', width: 280, render: (service: string) => <TruncatedText text={service} className="route-config-service" /> },
    { title: '请求授权', dataIndex: 'auth', key: 'auth', width: 140, render: (auth: AuthMode) => authLabels[auth] },
    {
      title: '操作', key: 'actions', fixed: 'right', width: 240,
      render: (_, route) => <span className="ataas-monitor-table-actions ataas-log-table-actions route-config-actions">
        <Button type="link" icon={<SettingOutlined />} onClick={() => openPolicy(route)}>插件</Button>
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(route)}>编辑</Button>
        <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeRoute(route)}>删除</Button>
      </span>,
    },
  ];

  const renderRuleEditor = (
    title: string,
    rows: RuleRow[],
    setRows: (rows: RuleRow[]) => void,
  ) => (
    <section className="route-create-rule-section">
      <h3>{title} <Tooltip title={`按 ${title} 进一步匹配请求`}><QuestionCircleOutlined /></Tooltip></h3>
      <div className="route-create-mini-table">
        <div className="route-create-mini-head"><span>Key</span><span>条件</span><span>值</span><span>操作</span></div>
        {rows.length === 0 ? <div className="route-create-empty"><span>▱</span><em>暂无数据</em></div> : rows.map((row) => (
          <div className="route-create-mini-row" key={row.id}>
            <Input value={row.key} placeholder="Key" onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, key: event.target.value } : item))} />
            <Select value={row.operator} options={[{ value: 'equal', label: '等于' }, { value: 'notEqual', label: '不等于' }, { value: 'contains', label: '包含' }]} onChange={(operator) => setRows(rows.map((item) => item.id === row.id ? { ...item, operator } : item))} />
            <Input value={row.value} placeholder="值" onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, value: event.target.value } : item))} />
            <Button type="link" danger onClick={() => setRows(rows.filter((item) => item.id !== row.id))}>删除</Button>
          </div>
        ))}
      </div>
      <Button className="route-create-add-link" type="link" icon={<PlusOutlined />} onClick={() => setRows([...rows, { id: Date.now(), key: '', operator: 'equal', value: '' }])}>参数</Button>
    </section>
  );

  return (
    <div className="route-config-page">
      <div className="route-config-page-heading">
        <h1>路由配置</h1>
        <p>统一管理画布中的服务网格入口与服务网格出口资源</p>
      </div>
      <Tabs
        className="route-config-resource-tabs"
        activeKey={resourceView}
        onChange={(key) => { setResourceView(key as 'ingress' | 'egress'); setKeyword(''); setRouteTypeFilter('all'); setRoutePage(1); }}
        items={[
          { key: 'ingress', label: `服务网格入口 ${routes.length}` },
          { key: 'egress', label: `服务网格出口 ${serviceMeshExits.length}` },
        ]}
      />
      <header className="route-config-toolbar">
        <div className="route-config-search">
          <Input
            allowClear
            value={keyword}
            onChange={(event) => { setKeyword(event.target.value); setRoutePage(1); }}
            placeholder={resourceView === 'ingress' ? '搜索入口名称、类型、域名、条件或目标服务' : '搜索出口名称、Hosts、目标服务或关联入口'}
          />
          <Button aria-label="搜索路由" icon={<SearchOutlined />} />
        </div>
        {resourceView === 'ingress' && <Select
          className="route-config-type-filter"
          value={routeTypeFilter}
          onChange={(value) => { setRouteTypeFilter(value); setRoutePage(1); }}
          options={[
            { value: 'all', label: '全部路由类型' },
            ...Object.entries(routeTypeLabels).map(([value, label]) => ({ value, label })),
          ]}
        />}
        <div className="route-config-toolbar-actions">
          {resourceView === 'ingress' ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>创建</Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateExit}>创建</Button>
          )}
        </div>
      </header>

      <ConfigProvider theme={{ token: { colorPrimary: '#6951FF', colorPrimaryHover: '#5B42F3', colorPrimaryActive: '#4E35DF' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <section className={resourceView === 'egress' ? 'route-config-card route-config-card-egress' : 'route-config-card ataas-panel ataas-log-page ataas-deploy-list'}>
        <div className={resourceView === 'egress' ? 'route-config-table' : 'route-config-table ataas-deploy-table-wrap ataas-log-table-wrap'}>
          {resourceView === 'ingress' ? <Table<RouteRecord>
            dataSource={filteredRoutes} rowKey="id" columns={columns} scroll={{ x: 1540 }}
            pagination={{ current: routePage, pageSize: 10, showTotal: (total) => `共 ${total} 个服务网格入口`, showSizeChanger: true, onChange: setRoutePage }}
            expandable={{
              expandedRowKeys: expandedId ? [expandedId] : [],
              onExpand: (expanded, route) => setExpandedId(expanded ? route.id : undefined),
              expandedRowRender: (route) => <div className="route-config-policy-detail">
                <div className="route-config-policy-detail-head"><strong>插件配置</strong><strong>插件描述</strong><strong>操作</strong></div>
                {route.policies.length ? route.policies.map((policyKey) => {
                  const plugin = routePluginCatalog.find((item) => item.key === policyKey);
                  return <div className="route-config-policy-detail-row" key={policyKey}>
                    <span>{plugin?.name || policyKey}</span>
                    <p>{plugin?.description || '已配置路由插件'}</p>
                    <div className="route-config-policy-detail-action"><Button type="link" icon={<EditOutlined />} onClick={() => {
                      setViewingPolicy({ route, pluginKey: policyKey });
                      setViewingPolicyDraft({ ...(route.pluginConfigs?.[policyKey] || {}) });
                    }}>编辑配置</Button></div>
                  </div>
                }) : <div className="route-config-policy-detail-empty">暂未配置插件，可点击右侧“插件”进行配置</div>}
              </div>,
            }}
            locale={{ emptyText: '没有匹配的服务网格入口' }}
          /> : <div className="route-config-exit-grid">
            {filteredServiceMeshExits.length ? filteredServiceMeshExits.map((exit) => (
              <article className="route-config-exit-card" key={exit.id}>
                <header>
                  <span className="route-config-exit-icon"><FileSearchOutlined /></span>
                  <div><strong>{exit.name}</strong><small>{exit.cluster} / higress-system</small></div>
                  <Tag className="route-config-exit-count">{exit.endpoints.length} endpoints</Tag>
                </header>
                <div className="route-config-exit-card-body">
                  <div className="route-config-exit-field"><span>Hosts</span><code title={exit.host}>{exit.host}</code></div>
                  <div className="route-config-exit-field"><span>Ports</span><code>{exit.port}</code></div>
                  <div className="route-config-exit-field route-config-exit-endpoints"><span>Endpoints</span><div>{exit.endpoints.map((endpoint) => <Tag key={`${endpoint.address}-${endpoint.weight}`} title={endpoint.address}>{endpoint.address}（{endpoint.weight}%）</Tag>)}</div></div>
                </div>
                <footer>
                  <div className="route-config-exit-links"><span>关联服务网格入口 · {exit.ingressNames.length}</span><div className="route-config-ingress-tags">{exit.ingressNames.map((name) => <Tag key={name} role="button" tabIndex={0} onClick={() => { setKeyword(name); setResourceView('ingress'); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setKeyword(name); setResourceView('ingress'); } }}>{name}</Tag>)}</div></div>
                  <div className="route-config-exit-actions"><Button type="link" icon={<EditOutlined />} onClick={() => openExitEditor(exit)}>编辑</Button><Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeExit(exit)}>删除</Button></div>
                </footer>
              </article>
            )) : <div className="route-config-exit-empty">没有匹配的服务网格出口</div>}
          </div>}
        </div>
      </section>
      </ConfigProvider>

      <Drawer
        className="ataas-engine-drawer route-config-drawer"
        title={editingRoute ? '编辑路由' : '创建路由'}
        open={editorOpen}
        width={560}
        onClose={() => setEditorOpen(false)}
        footer={<div className="ataas-drawer-footer"><Button onClick={() => setEditorOpen(false)}>取消</Button><Button type="primary" onClick={saveRoute}>确定</Button></div>}
      >
        <Form className="ataas-engine-form route-config-form" form={form} layout="vertical" requiredMark>
          <Form.Item label={<span>路由名称 <Tooltip title="用于识别当前路由"><QuestionCircleOutlined /></Tooltip></span>} name="name" rules={[{ required: true, message: '请输入路由名称' }, { max: 63, message: '最多 63 个字符' }]}>
            <Input showCount maxLength={63} placeholder="包含小写字母、数字和特殊字符（- .），且不能以特殊字符开头和结尾" />
          </Form.Item>
          <Form.Item label="路由类型" name="routeType" rules={[{ required: true, message: '请选择路由类型' }]}>
            <Select options={Object.entries(routeTypeLabels).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item label="域名" name="domain"><Input placeholder="根据域名名称搜索域名。若留空，则表示路由可匹配任意域名" /></Form.Item>

          <section className="route-create-match-section">
            <h3><i>*</i> 匹配规则 <Tooltip title="请求需满足以下规则"><QuestionCircleOutlined /></Tooltip></h3>
            <Form.Item label={<span><i className="required-dot">*</i> 路径（Path）</span>} required={false}>
              <div className="route-create-path-row">
                <Form.Item name="matchType" noStyle><Select options={Object.entries(matchLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
                <Form.Item name="path" noStyle rules={[{ required: true, message: '请输入请求路径' }]}><Input placeholder="路径匹配值，如：/user" /></Form.Item>
                <Checkbox>忽略大小写</Checkbox>
              </div>
            </Form.Item>
            <Form.Item label="方法（Method）" name="methods"><Select mode="multiple" placeholder="方法匹配值，可多选。不填则匹配所有的 HTTP 方法" options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map((value) => ({ value, label: value }))} /></Form.Item>
          </section>

          {renderRuleEditor('请求头（Header）', headerRules, setHeaderRules)}
          {renderRuleEditor('请求参数（Query）', queryRules, setQueryRules)}

          <section className="route-create-auth-section">
            <h3>是否启用请求认证</h3>
            <Switch checked={authEnabled} onChange={(checked) => { setAuthEnabled(checked); form.setFieldValue('auth', checked ? 'consumer' : 'none'); }} />
            <p>启用后，只有包含指定消费者认证信息的请求可以请求本路由。</p>
            <Form.Item label="认证方式" name="auth"><Select disabled={!authEnabled} options={[{ value: 'consumer', label: 'Key Auth' }]} /></Form.Item>
            <Form.Item label="允许请求本路由的消费者名称列表">
              <div className="route-create-consumer-row"><Input disabled={!authEnabled} placeholder="允许请求本路由的消费者名称列表" /><Button disabled={!authEnabled} icon={<ReloadOutlined />} /></div>
              <Button type="link" disabled={!authEnabled} className="route-create-consumer-link">创建消费者</Button>
            </Form.Item>
          </section>

          <section className="route-create-rule-section">
            <h3>附加注解（Annotation） <Tooltip title="为路由添加键值形式的注解"><QuestionCircleOutlined /></Tooltip></h3>
            <div className="route-create-mini-table annotation">
              <div className="route-create-mini-head"><span>Key</span><span>值</span><span>操作</span></div>
              {annotations.length === 0 ? <div className="route-create-empty"><span>▱</span><em>暂无数据</em></div> : annotations.map((row) => <div className="route-create-mini-row" key={row.id}><Input value={row.key} placeholder="Key" onChange={(event) => setAnnotations(annotations.map((item) => item.id === row.id ? { ...item, key: event.target.value } : item))} /><Input value={row.value} placeholder="值" onChange={(event) => setAnnotations(annotations.map((item) => item.id === row.id ? { ...item, value: event.target.value } : item))} /><Button type="link" danger onClick={() => setAnnotations(annotations.filter((item) => item.id !== row.id))}>删除</Button></div>)}
            </div>
            <Button className="route-create-add-link" type="link" icon={<PlusOutlined />} onClick={() => setAnnotations([...annotations, { id: Date.now(), key: '', value: '' }])}>注解</Button>
          </section>

          <Form.Item label="目标服务" name="service" rules={[{ required: true, message: '请选择目标服务' }]}><Select showSearch placeholder="搜索服务名称选择服务，可多选" options={routes.map((route) => ({ value: route.service, label: route.service }))} /></Form.Item>
          <div className="route-create-advanced"><Form.Item label="超时时间（秒）" name="timeout"><Input type="number" min={1} /></Form.Item><Form.Item label="失败重试次数" name="retries"><Input type="number" min={0} max={5} /></Form.Item></div>
        </Form>
      </Drawer>

      <Modal
        title={<span><SafetyCertificateOutlined /> 路由插件 · {policyRoute?.name}</span>}
        open={!!policyRoute}
        width={720}
        okText="保存插件"
        cancelText="取消"
        onCancel={() => setPolicyRoute(undefined)}
        onOk={() => {
          if (policyRoute) routeConfigStore.update(policyRoute.id, { policies: Object.keys(policyDraft), pluginConfigs: policyDraft });
          setPolicyRoute(undefined);
          message.success('路由插件已保存');
        }}
      >
        <div className="route-config-policy-card-list">
          {routePluginCatalog.map((plugin) => {
            const enabled = plugin.key in policyDraft;
            return <section className={`route-config-policy-card ${enabled ? 'enabled' : ''}`} key={plugin.key}>
              <header>
                <span className="route-config-policy-card-mark">{plugin.name.slice(0, 1)}</span>
                <span className="route-config-policy-card-copy"><strong>{plugin.name}</strong><small>{plugin.description}</small></span>
                <Switch checked={enabled} onChange={(checked) => setPolicyDraft((current) => checked ? { ...current, [plugin.key]: buildRoutePluginConfigDefaults(plugin.key) } : Object.fromEntries(Object.entries(current).filter(([key]) => key !== plugin.key)))} />
              </header>
              <footer><Tag>{plugin.category}</Tag><Button type="link" icon={<SettingOutlined />} disabled={!enabled} onClick={() => setPolicyEditingPluginKey(plugin.key)}>配置</Button></footer>
            </section>;
          })}
        </div>
      </Modal>

      <Modal
        className="route-config-exit-editor-modal"
        title={editingExit ? '编辑 ServiceEntry' : '创建 ServiceEntry'}
        open={exitEditorOpen}
        width={820}
        okText="确定"
        cancelText="取消"
        onCancel={() => { setEditingExit(undefined); setExitEditorOpen(false); }}
        onOk={saveExitYaml}
      >
        <div className="route-config-exit-yaml-editor"><MonacoEditor
          value={exitYaml}
          language="yaml"
          height={500}
          onChange={setExitYaml}
          options={{ lineNumbers: 'on', lineNumbersMinChars: 3, glyphMargin: false, folding: true, lineDecorationsWidth: 12, renderLineHighlight: 'line', overviewRulerLanes: 0, hideCursorInOverviewRuler: true, wordWrap: 'off', padding: { top: 10, bottom: 10 } }}
        /></div>
      </Modal>

      <Modal
        title={`配置 ${routePluginCatalog.find((plugin) => plugin.key === policyEditingPluginKey)?.name || '插件'}`}
        open={!!policyEditingPluginKey}
        width={620}
        okText="保存配置"
        cancelText="取消"
        onCancel={() => setPolicyEditingPluginKey(undefined)}
        onOk={() => setPolicyEditingPluginKey(undefined)}
      >
        {policyEditingPluginKey && <div className="route-config-policy-fields">{(ROUTE_PLUGIN_CONFIG_SCHEMAS[policyEditingPluginKey] || []).map((field) => {
          const value = policyDraft[policyEditingPluginKey]?.[field.key];
          const updateValue = (next: RoutePluginConfigValue) => setPolicyDraft((current) => ({ ...current, [policyEditingPluginKey]: { ...current[policyEditingPluginKey], [field.key]: next } }));
          return <label className={`field-${field.type}`} key={field.key}><span>{field.required && <em>*</em>}{field.label}</span>
            {field.type === 'input' && <Input value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => updateValue(event.target.value)} />}
            {field.type === 'textarea' && <Input.TextArea value={String(value ?? '')} placeholder={field.placeholder} autoSize={{ minRows: 2, maxRows: 5 }} onChange={(event) => updateValue(event.target.value)} />}
            {field.type === 'number' && <InputNumber value={Number(value ?? 0)} min={0} onChange={(next) => updateValue(Number(next ?? 0))} />}
            {field.type === 'select' && <Select value={String(value ?? '') || undefined} options={field.options} placeholder="请选择" onChange={updateValue} />}
            {field.type === 'switch' && <Switch checked={Boolean(value)} onChange={updateValue} />}
            {field.type === 'checkbox' && <Checkbox.Group value={Array.isArray(value) ? value : []} options={field.options} onChange={(next) => updateValue(next as string[])} />}
          </label>;
        })}</div>}
      </Modal>

      <Modal
        title={`编辑 ${routePluginCatalog.find((plugin) => plugin.key === viewingPolicy?.pluginKey)?.name || '插件'} 配置`}
        open={!!viewingPolicy}
        width={620}
        okText="保存配置"
        cancelText="取消"
        onOk={() => {
          if (!viewingPolicy) return;
          routeConfigStore.update(viewingPolicy.route.id, {
            pluginConfigs: {
              ...(viewingPolicy.route.pluginConfigs || {}),
              [viewingPolicy.pluginKey]: viewingPolicyDraft,
            },
          });
          setViewingPolicy(undefined);
          message.success('插件配置已保存');
        }}
        onCancel={() => setViewingPolicy(undefined)}
      >
        {viewingPolicy && (ROUTE_PLUGIN_CONFIG_SCHEMAS[viewingPolicy.pluginKey] || []).length > 0
          ? <div className="route-config-policy-fields">{(ROUTE_PLUGIN_CONFIG_SCHEMAS[viewingPolicy.pluginKey] || []).map((field) => {
            const value = viewingPolicyDraft[field.key];
            const updateValue = (next: RoutePluginConfigValue) => setViewingPolicyDraft((current) => ({ ...current, [field.key]: next }));
            return <label className={`field-${field.type}`} key={field.key}><span>{field.required && <em>*</em>}{field.label}</span>
              {field.type === 'input' && <Input value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => updateValue(event.target.value)} />}
              {field.type === 'textarea' && <Input.TextArea value={String(value ?? '')} placeholder={field.placeholder} autoSize={{ minRows: 2, maxRows: 5 }} onChange={(event) => updateValue(event.target.value)} />}
              {field.type === 'number' && <InputNumber value={Number(value ?? 0)} min={0} onChange={(next) => updateValue(Number(next ?? 0))} />}
              {field.type === 'select' && <Select value={String(value ?? '') || undefined} options={field.options} placeholder="请选择" onChange={updateValue} />}
              {field.type === 'switch' && <Switch checked={Boolean(value)} onChange={updateValue} />}
              {field.type === 'checkbox' && <Checkbox.Group value={Array.isArray(value) ? value : []} options={field.options} onChange={(next) => updateValue(next as string[])} />}
            </label>;
          })}</div>
          : <pre className="route-config-policy-json">{JSON.stringify(viewingPolicy?.route.pluginConfigs?.[viewingPolicy.pluginKey] || {}, null, 2)}</pre>}
      </Modal>
    </div>
  );
};

export default RouteConfigPage;
