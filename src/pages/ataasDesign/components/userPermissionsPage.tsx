import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Input, message, Modal, Select, Table, Tabs, Tag } from 'antd';
import { useMemo, useState } from 'react';
import './userPermissionsPage.less';

type PermissionTemplate = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  updatedAt: string;
};

const permissionGroups = [
  { label: '总览与画布', options: ['资源总览.查看', '画布.查看', '画布.编辑'] },
  { label: '网关管理', options: ['路由配置.查看', '路由配置.编辑', '插件配置.查看', '插件配置.编辑'] },
  { label: '推理与节点', options: ['推理运维.查看', '推理运维.操作', 'GPU节点.查看', 'GPU节点.管理', '节点拓扑.查看', '供应商.管理'] },
  { label: '配置中心', options: ['资源文件.查看', '资源文件.编辑', '模型管理.查看', '模型管理.分发', '镜像仓库.查看', '镜像仓库.分发', '文件管理.查看', '文件管理.分发'] },
  { label: '任务与审计', options: ['任务流程.查看', '任务流程.执行', '用户管理.查看', '用户管理.编辑', '用户权限.管理', '操作日志.查看'] },
];

const allPermissions = permissionGroups.flatMap((group) => group.options);
const initialTemplates: PermissionTemplate[] = [
  { id: 'admin', name: '平台管理员', description: '拥有整个平台全部资源与操作权限', permissions: allPermissions, userCount: 1, updatedAt: '2026-08-26 10:20' },
  { id: 'ops', name: '运维人员', description: '负责集群、推理服务、配置与任务运维', permissions: allPermissions.filter((item) => !item.startsWith('用户')), userCount: 3, updatedAt: '2026-08-25 16:42' },
  { id: 'viewer', name: '只读用户', description: '仅可查看平台资源和运行状态', permissions: allPermissions.filter((item) => item.endsWith('.查看')), userCount: 5, updatedAt: '2026-08-24 09:18' },
];

const initialAssignments = [
  { id: 'admin', username: 'admin', templateId: 'admin', remark: 'Root User' },
  { id: 'ops', username: 'ops', templateId: 'ops', remark: '平台运维' },
];

const UserPermissionsPage = () => {
  const [templates, setTemplates] = useState(initialTemplates);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<PermissionTemplate>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [form] = Form.useForm();

  const filteredTemplates = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return templates.filter((item) => !query || `${item.name} ${item.description}`.toLowerCase().includes(query));
  }, [keyword, templates]);

  const openEditor = (template?: PermissionTemplate) => {
    setEditing(template);
    form.setFieldsValue(template || { name: '', description: '', permissions: [] });
    setEditorOpen(true);
  };

  const saveTemplate = async () => {
    const values = await form.validateFields();
    if (editing) {
      setTemplates((items) => items.map((item) => item.id === editing.id ? { ...item, ...values, updatedAt: '刚刚' } : item));
    } else {
      setTemplates((items) => [{ id: `permission-${Date.now()}`, ...values, userCount: 0, updatedAt: '刚刚' }, ...items]);
    }
    setEditorOpen(false);
    message.success(editing ? '权限模板已更新' : '权限模板已创建');
  };

  return <div className="user-permissions-page">
    <header><h1>用户权限</h1><p>通过权限模板统一配置用户可访问的平台资源与操作范围</p></header>
    <Tabs items={[
      { key: 'templates', label: `权限模板 ${templates.length}`, children: <>
        <div className="user-permissions-toolbar"><Input.Search value={keyword} onChange={(event) => setKeyword(event.target.value)} allowClear placeholder="搜索模板名称或说明" /><span /><Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>创建权限模板</Button></div>
        <Table rowKey="id" dataSource={filteredTemplates} pagination={false} columns={[
          { title: '模板名称', key: 'name', width: 220, render: (_, record) => <span className="permission-template-name"><SafetyCertificateOutlined /><span><strong>{record.name}</strong><small>{record.description}</small></span></span> },
          { title: '平台资源权限', key: 'permissions', render: (_, record) => <div className="permission-resource-tags">{record.permissions.slice(0, 6).map((item) => <Tag key={item}>{item}</Tag>)}{record.permissions.length > 6 && <Tag>+{record.permissions.length - 6}</Tag>}</div> },
          { title: '关联用户', dataIndex: 'userCount', key: 'userCount', width: 110, render: (value) => `${value} 个用户` },
          { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
          { title: '操作', key: 'actions', width: 150, render: (_, record) => <span className="permission-actions"><Button type="link" icon={<EditOutlined />} onClick={() => openEditor(record)}>编辑</Button><Button type="link" danger disabled={record.id === 'admin'} icon={<DeleteOutlined />} onClick={() => setTemplates((items) => items.filter((item) => item.id !== record.id))}>删除</Button></span> },
        ]} />
      </> },
      { key: 'assignments', label: `用户授权 ${assignments.length}`, children: <Table rowKey="id" dataSource={assignments} pagination={false} columns={[
        { title: '用户名', dataIndex: 'username', key: 'username', width: 220 },
        { title: '权限模板', key: 'template', width: 280, render: (_, record) => <Select value={record.templateId} style={{ width: 220 }} options={templates.map((item) => ({ value: item.id, label: item.name }))} onChange={(templateId) => setAssignments((items) => items.map((item) => item.id === record.id ? { ...item, templateId } : item))} /> },
        { title: '授权资源数', key: 'count', width: 140, render: (_, record) => `${templates.find((item) => item.id === record.templateId)?.permissions.length || 0} 项` },
        { title: '备注', dataIndex: 'remark', key: 'remark' },
      ]} /> },
    ]} />

    <Modal className="permission-template-modal" title={editing ? '编辑权限模板' : '创建权限模板'} open={editorOpen} width={860} okText="保存" cancelText="取消" onOk={saveTemplate} onCancel={() => setEditorOpen(false)}>
      <Form form={form} layout="vertical" className="permission-template-form">
        <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}><Input placeholder="例如：平台运维人员" /></Form.Item>
        <Form.Item label="模板说明" name="description"><Input placeholder="说明该模板的使用范围" /></Form.Item>
        <Form.Item label="平台资源权限" name="permissions" rules={[{ required: true, message: '请至少选择一项权限' }]}>
          <Checkbox.Group><div className="permission-group-list">{permissionGroups.map((group) => <section key={group.label}><header><strong>{group.label}</strong><Button type="link" onClick={() => {
            const current = form.getFieldValue('permissions') || [];
            form.setFieldValue('permissions', Array.from(new Set([...current, ...group.options])));
          }}>全选</Button></header><div className="permission-group-options">{group.options.map((permission) => {
            const [resource, action] = permission.split('.');
            return <Checkbox key={permission} value={permission}><span>{resource}</span><em>{action}</em></Checkbox>;
          })}</div></section>)}</div></Checkbox.Group>
        </Form.Item>
      </Form>
    </Modal>
  </div>;
};

export default UserPermissionsPage;
