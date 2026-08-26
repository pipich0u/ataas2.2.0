import { EditOutlined, PlusOutlined, QuestionCircleOutlined, ReloadOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Drawer, Form, Input, InputNumber, message, Select, Space, Switch, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { dump as dumpYaml, load as loadYaml } from 'js-yaml';
import { MonacoEditor } from '../../../components/shared/MonacoEditor';
import { ROUTE_PLUGIN_CONFIG_SCHEMAS, type RoutePluginConfigField, type RoutePluginConfigValue } from './routePluginConfig';
import './pluginManagementPage.less';

export type PluginStatus = 'enabled' | 'disabled';
export type PluginRecord = {
  id: string;
  name: string;
  key: string;
  category: string;
  description: string;
  version: string;
  scope: string;
  bindings: number;
  status: PluginStatus;
  image?: string;
  phase?: string;
  priority?: number;
  pullPolicy?: string;
  pullSecret?: string;
};

export const PLUGIN_MANAGEMENT_MOCK_DATA: PluginRecord[] = [
  { id: 'basic-auth', name: 'Basic 认证', key: 'basic-auth', category: '认证', description: '基于 HTTP Basic Auth 标准进行身份认证与鉴权', version: '1.3.0', scope: '路由 / 服务', bindings: 8, status: 'enabled' },
  { id: 'external-auth', name: '外部认证', key: 'forward-auth', category: '认证', description: '向外部授权服务发送鉴权请求，校验客户端访问权限', version: '1.2.1', scope: '路由', bindings: 3, status: 'enabled' },
  { id: 'hmac-auth', name: 'HMAC 认证', key: 'hmac-auth', category: '认证', description: '使用 HMAC 签名校验请求身份与消息完整性', version: '2.0.0', scope: '路由 / Consumer', bindings: 5, status: 'enabled' },
  { id: 'jwt-auth', name: 'JWT 认证', key: 'jwt-auth', category: '认证', description: '校验 JSON Web Token，支持从 Header 或 Query 中读取凭据', version: '2.4.0', scope: '路由 / Consumer', bindings: 12, status: 'enabled' },
  { id: 'key-auth', name: 'Key 认证', key: 'key-auth', category: '认证', description: '基于 API Key 实现身份认证与访问控制', version: '1.8.2', scope: '路由 / Consumer', bindings: 16, status: 'enabled' },
  { id: 'oauth2', name: 'OAuth2 认证', key: 'oauth2', category: '认证', description: '基于 OAuth2 标准实现身份认证与授权', version: '2.1.0', scope: '路由', bindings: 2, status: 'disabled' },
  { id: 'cors', name: '跨域资源共享', key: 'cors', category: '安全', description: '配置跨域访问所需的响应头及预检请求策略', version: '1.6.0', scope: '全局 / 路由', bindings: 10, status: 'enabled' },
  { id: 'rate-limit', name: '请求限流', key: 'rate-limit', category: '流量治理', description: '按 Consumer、路由或服务限制请求速率与并发量', version: '3.0.1', scope: '全局 / 路由', bindings: 14, status: 'enabled' },
  { id: 'request-rewrite', name: '请求重写', key: 'request-rewrite', category: '流量治理', description: '按规则重写请求路径、Host、Header 和 Query 参数', version: '1.9.0', scope: '路由', bindings: 7, status: 'enabled' },
  { id: 'ai-router', name: '模型智能路由', key: 'ai-router', category: 'AI', description: '根据模型、负载和可用性将请求调度到合适的推理服务', version: '0.9.0', scope: '路由 / 模型', bindings: 6, status: 'enabled' },
];

const categoryColors: Record<string, string> = { AI: 'purple', 认证: 'blue', 安全: 'cyan', 流量治理: 'geekblue', 可观测性: 'green' };

const globalPluginSchemas: Record<string, RoutePluginConfigField[]> = {
  ...ROUTE_PLUGIN_CONFIG_SCHEMAS,
  oauth2: [
    { key: 'issuer', label: 'Issuer 地址', type: 'input', required: true, placeholder: 'https://auth.example.com' },
    { key: 'clientId', label: 'Client ID', type: 'input', required: true },
    { key: 'introspectionEndpoint', label: 'Token 校验地址', type: 'input', required: true, placeholder: 'https://auth.example.com/oauth/introspect' },
    { key: 'scopes', label: '默认 Scope', type: 'textarea', placeholder: '每行一个 Scope' },
  ],
  cors: [
    { key: 'allowOrigins', label: '允许的 Origin', type: 'textarea', required: true, defaultValue: '*', placeholder: '每行一个 Origin' },
    { key: 'allowMethods', label: '允许的方法', type: 'checkbox', defaultValue: ['GET', 'POST'], options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].map((value) => ({ label: value, value })) },
    { key: 'allowHeaders', label: '允许的 Header', type: 'textarea', placeholder: '每行一个 Header' },
    { key: 'exposeHeaders', label: '暴露的 Header', type: 'textarea', placeholder: '每行一个 Header' },
    { key: 'maxAge', label: '预检缓存（秒）', type: 'number', defaultValue: 3600 },
    { key: 'allowCredentials', label: '允许携带凭据', type: 'switch', defaultValue: false },
  ],
  'rate-limit': [
    { key: 'limitBy', label: '限流维度', type: 'select', required: true, defaultValue: 'consumer', options: [{ label: 'Consumer', value: 'consumer' }, { label: '客户端 IP', value: 'ip' }, { label: 'Header', value: 'header' }, { label: '全局', value: 'global' }] },
    { key: 'requestsPerSecond', label: '每秒请求数', type: 'number', required: true, defaultValue: 100 },
    { key: 'burst', label: '突发容量', type: 'number', required: true, defaultValue: 200 },
    { key: 'headerName', label: 'Header 名称', type: 'input', placeholder: '限流维度选择 Header 时填写' },
    { key: 'rejectedCode', label: '拒绝状态码', type: 'number', defaultValue: 429 },
    { key: 'rejectedMessage', label: '拒绝响应内容', type: 'input', defaultValue: 'Too Many Requests' },
  ],
};

const buildGlobalPluginDefaults = (pluginKey: string) => Object.fromEntries(
  (globalPluginSchemas[pluginKey] || []).map((field) => [field.key, field.defaultValue ?? '']),
) as Record<string, RoutePluginConfigValue>;

const PluginManagementPage = () => {
  const [plugins, setPlugins] = useState(PLUGIN_MANAGEMENT_MOCK_DATA);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<PluginRecord>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [configuring, setConfiguring] = useState<PluginRecord>();
  const [configView, setConfigView] = useState<'form' | 'yaml'>('form');
  const [globalConfigs, setGlobalConfigs] = useState<Record<string, Record<string, RoutePluginConfigValue>>>({});
  const [configDraft, setConfigDraft] = useState<Record<string, RoutePluginConfigValue>>({});
  const [configYaml, setConfigYaml] = useState('');
  const [configEnabled, setConfigEnabled] = useState(true);
  const [form] = Form.useForm<PluginRecord>();

  const categories = useMemo(() => Array.from(new Set(plugins.map((item) => item.category))), [plugins]);
  const filtered = useMemo(() => plugins.filter((item) => {
    const query = keyword.trim().toLowerCase();
    return (!query || [item.name, item.key, item.description].some((value) => value.toLowerCase().includes(query)))
      && (category === 'all' || item.category === category)
      && (status === 'all' || item.status === status);
  }), [category, keyword, plugins, status]);

  const openEditor = (plugin?: PluginRecord) => {
    setEditing(plugin);
    form.setFieldsValue(plugin ?? { name: '', key: '', category: '认证', description: '', version: '1.0.0', scope: '路由', bindings: 0, status: 'enabled', image: '', phase: '认证', priority: 100, pullPolicy: 'IfNotPresent', pullSecret: '' });
    setDrawerOpen(true);
  };

  const savePlugin = async () => {
    const values = await form.validateFields();
    const normalizedValues: PluginRecord = {
      ...values,
      id: editing?.id ?? '',
      key: values.key || values.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-|-$/g, ''),
      category: values.category || '自定义',
      version: values.version || '1.0.0',
      scope: values.scope || '路由',
      bindings: editing?.bindings ?? 0,
      status: values.status || 'enabled',
    };
    if (editing) {
      setPlugins((current) => current.map((item) => item.id === editing.id ? { ...item, ...normalizedValues } : item));
      message.success('插件信息已更新');
    } else {
      setPlugins((current) => [{ ...normalizedValues, id: `${normalizedValues.key}-${Date.now()}` }, ...current]);
      message.success('插件已添加');
    }
    setDrawerOpen(false);
  };

  const openConfiguration = (plugin: PluginRecord) => {
    const schema = globalPluginSchemas[plugin.key];
    const draft = globalConfigs[plugin.key] || (schema ? buildGlobalPluginDefaults(plugin.key) : {});
    setConfiguring(plugin);
    setConfigEnabled(plugin.status === 'enabled');
    setConfigDraft(draft);
    setConfigYaml(dumpYaml(draft, { noRefs: true, lineWidth: 100 }));
    setConfigView(schema ? 'form' : 'yaml');
  };

  const saveConfiguration = () => {
    if (!configuring) return;
    let next = configDraft;
    if (configView === 'yaml' || !globalPluginSchemas[configuring.key]) {
      try {
        const parsed = loadYaml(configYaml);
        if (parsed != null && (typeof parsed !== 'object' || Array.isArray(parsed))) throw new Error('配置根节点必须是对象');
        next = (parsed || {}) as Record<string, RoutePluginConfigValue>;
      } catch (error) {
        message.error(`YAML 格式错误：${error instanceof Error ? error.message : '无法解析'}`);
        return;
      }
    }
    setGlobalConfigs((current) => ({ ...current, [configuring.key]: next }));
    setPlugins((current) => current.map((item) => item.id === configuring.id ? { ...item, status: configEnabled ? 'enabled' : 'disabled' } : item));
    setConfiguring(undefined);
    message.success(`${configuring.name} 全局配置已保存`);
  };

  const columns: ColumnsType<PluginRecord> = [
    { title: '插件名称', dataIndex: 'name', key: 'name', width: 190, sorter: (a, b) => a.name.localeCompare(b.name), render: (name, item) => <div className="plugin-name-cell"><div><strong>{name}</strong><small>{item.key}</small></div></div> },
    { title: '分类', dataIndex: 'category', key: 'category', width: 110, filters: categories.map((value) => ({ text: value, value })), onFilter: (value, record) => record.category === value, render: (value) => <Tag color={categoryColors[value]}>{value}</Tag> },
    { title: '插件描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
    { title: '生效范围', dataIndex: 'scope', key: 'scope', width: 145 },
    { title: '关联配置', dataIndex: 'bindings', key: 'bindings', width: 105, sorter: (a, b) => a.bindings - b.bindings, render: (value) => `${value} 个` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 125, render: (value, item) => <span className="plugin-status"><Switch size="small" checked={value === 'enabled'} onChange={(checked) => setPlugins((current) => current.map((row) => row.id === item.id ? { ...row, status: checked ? 'enabled' : 'disabled' } : row))} /><i className={value}>{value === 'enabled' ? '已启用' : '已停用'}</i></span> },
    { title: '操作', key: 'actions', fixed: 'right', width: 165, render: (_, item) => <Space size={2}><Button type="link" icon={<SettingOutlined />} onClick={() => openConfiguration(item)}>配置</Button><Button type="link" icon={<EditOutlined />} onClick={() => openEditor(item)}>编辑</Button></Space> },
  ];

  return <div className="plugin-management-page">
    <div className="plugin-page-heading"><h1>插件管理</h1><p>统一管理网关插件、启用状态与关联配置</p></div>
    <div className="plugin-summary">
      <div><span>插件总数</span><strong>{plugins.length}</strong></div>
      <div><span>已启用</span><strong className="healthy">{plugins.filter((item) => item.status === 'enabled').length}</strong></div>
      <div><span>分类数量</span><strong>{categories.length}</strong></div>
      <div><span>关联配置</span><strong>{plugins.reduce((total, item) => total + item.bindings, 0)}</strong></div>
    </div>
    <div className="plugin-toolbar">
      <Input className="plugin-search" allowClear prefix={<SearchOutlined />} value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索插件名称、标识或描述" />
      <Select value={category} onChange={setCategory} options={[{ value: 'all', label: '全部分类' }, ...categories.map((value) => ({ value, label: value }))]} />
      <Select value={status} onChange={setStatus} options={[{ value: 'all', label: '全部状态' }, { value: 'enabled', label: '已启用' }, { value: 'disabled', label: '已停用' }]} />
      <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setCategory('all'); setStatus('all'); }}>重置</Button>
      <Button className="plugin-add-button" type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>添加插件</Button>
    </div>
    <div className="plugin-table-wrap"><Table rowKey="id" columns={columns} dataSource={filtered} scroll={{ x: 1320 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个插件`, showSizeChanger: true }} /></div>

    <Drawer
      className="ataas-engine-drawer plugin-editor-drawer"
      title={editing ? '编辑插件' : '添加插件'}
      width={640}
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      footer={<div className="ataas-drawer-footer"><Button onClick={() => setDrawerOpen(false)}>取消</Button><Button type="primary" onClick={savePlugin}>保存</Button></div>}
    >
      <Form className="ataas-engine-form" form={form} layout="vertical">
        <Form.Item label="插件名称" name="name" rules={[{ required: true, message: '请输入插件名称' }, { pattern: /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/, message: '名称只能包含字母、数字、- 和 .' }]}>
          <Input placeholder="包含大小写字母、数字以及特殊字符（- .），且不能以特殊字符开头和结尾" />
        </Form.Item>
        <Form.Item label="插件描述" name="description"><Input.TextArea rows={4} placeholder="请输入插件描述" /></Form.Item>
        <Form.Item label={<span>镜像地址 <Tooltip title="插件容器镜像的完整仓库地址与标签"><QuestionCircleOutlined /></Tooltip></span>} name="image" rules={[{ required: true, message: '请输入镜像地址' }]}>
          <Input placeholder="请输入镜像地址，例如：higress-registry.cn-hangzhou.cr.aliyuncs.com/plugins/request-block:1.0.0" />
        </Form.Item>
        <Form.Item label="插件执行阶段" name="phase" rules={[{ required: true, message: '请选择插件执行阶段' }]}>
          <Select placeholder="执行阶段先后顺序：认证 > 鉴权 > 统计 > 默认" options={['认证', '鉴权', '统计', '默认'].map((value) => ({ value, label: value }))} />
        </Form.Item>
        <Form.Item label="插件执行优先级" name="priority" rules={[{ required: true, message: '请输入执行优先级' }]}>
          <InputNumber min={1} max={1000} precision={0} placeholder="范围 1～1000，值越大越优先" />
        </Form.Item>
        <Form.Item label="插件拉取策略" name="pullPolicy" rules={[{ required: true, message: '请选择插件拉取策略' }]}>
          <Select options={[{ value: 'IfNotPresent', label: '本地不存在时拉取（IfNotPresent）' }, { value: 'Always', label: '始终拉取（Always）' }, { value: 'Never', label: '不拉取（Never）' }]} />
        </Form.Item>
        <Form.Item label="插件拉取密钥" name="pullSecret"><Input.Password placeholder="请输入镜像仓库拉取密钥（可选）" /></Form.Item>
        {editing && <>
          <div className="plugin-editor-divider">管理信息</div>
          <div className="plugin-form-grid"><Form.Item label="插件分类" name="category" rules={[{ required: true }]}><Select options={['AI', '认证', '安全', '流量治理', '可观测性'].map((value) => ({ value, label: value }))} /></Form.Item><Form.Item label="版本" name="version" rules={[{ required: true }]}><Input placeholder="1.0.0" /></Form.Item></div>
          <Form.Item label="生效范围" name="scope"><Select options={['全局', '路由', '服务', 'Consumer', '路由 / 服务', '路由 / Consumer', '路由 / 模型', '全局 / 路由'].map((value) => ({ value, label: value }))} /></Form.Item>
        </>}
        {!editing && <Form.Item name="key" hidden><Input /></Form.Item>}
      </Form>
    </Drawer>

    <Drawer
      className="ataas-engine-drawer plugin-config-drawer"
      title={configuring?.name || '插件配置'}
      width={720}
      open={!!configuring}
      onClose={() => setConfiguring(undefined)}
      extra={<Space><Button onClick={() => setConfiguring(undefined)}>取消</Button><Button type="primary" onClick={saveConfiguration}>保存</Button></Space>}
    >
      {configuring && <>
        <section className="plugin-config-enabled"><div><strong>开启状态</strong><span>启用后，该配置将在所有未被路由级配置覆盖的请求上生效。</span></div><Switch checked={configEnabled} onChange={setConfigEnabled} /></section>
        <Tabs activeKey={configView} onChange={(key) => {
          const next = key as 'form' | 'yaml';
          if (next === 'yaml') setConfigYaml(dumpYaml(configDraft, { noRefs: true, lineWidth: 100 }));
          if (next === 'form') {
            try { setConfigDraft((loadYaml(configYaml) || {}) as Record<string, RoutePluginConfigValue>); } catch { message.error('请先修正 YAML 格式'); return; }
          }
          setConfigView(next);
        }} items={[{ key: 'form', label: '表单视图', disabled: !globalPluginSchemas[configuring.key] }, { key: 'yaml', label: 'YAML 视图' }]} />
        {!globalPluginSchemas[configuring.key] && <Alert type="warning" showIcon message="Schema 信息无法正常解析，本插件仅支持 YAML 编辑方式。" description="保存前会校验 YAML 基本格式；该配置将在所有域名和路由上生效，请谨慎配置。" />}
        {configView === 'form' && globalPluginSchemas[configuring.key] ? <div className="plugin-config-form">
          {globalPluginSchemas[configuring.key].map((field) => {
            const value = configDraft[field.key];
            const update = (next: RoutePluginConfigValue) => setConfigDraft((current) => ({ ...current, [field.key]: next }));
            return <label className={`field-${field.type}`} key={field.key}><span>{field.required && <em>*</em>}{field.label}</span>
              {field.type === 'input' && <Input value={String(value ?? '')} placeholder={field.placeholder} onChange={(event) => update(event.target.value)} />}
              {field.type === 'textarea' && <Input.TextArea value={String(value ?? '')} placeholder={field.placeholder} autoSize={{ minRows: 3, maxRows: 7 }} onChange={(event) => update(event.target.value)} />}
              {field.type === 'number' && <InputNumber value={Number(value ?? 0)} min={0} onChange={(next) => update(Number(next ?? 0))} />}
              {field.type === 'select' && <Select value={String(value ?? '') || undefined} options={field.options} placeholder="请选择" onChange={update} />}
              {field.type === 'switch' && <Switch checked={Boolean(value)} onChange={update} />}
              {field.type === 'checkbox' && <Checkbox.Group value={Array.isArray(value) ? value : []} options={field.options} onChange={(next) => update(next as string[])} />}
            </label>;
          })}
        </div> : <div className="plugin-config-yaml-editor"><MonacoEditor
          value={configYaml}
          language="yaml"
          height={280}
          onChange={setConfigYaml}
          options={{
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: true,
            lineDecorationsWidth: 12,
            renderLineHighlight: 'line',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            wordWrap: 'off',
            padding: { top: 10, bottom: 10 },
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        /></div>}
        <p className="plugin-config-scope-note">注意：以上配置将会在所有域名和路由上生效。请谨慎配置。</p>
      </>}
    </Drawer>
  </div>;
};

export default PluginManagementPage;
