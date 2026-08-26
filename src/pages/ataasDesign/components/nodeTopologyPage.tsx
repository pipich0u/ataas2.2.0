import {
  AppstoreOutlined,
  CheckCircleFilled,
  EditOutlined,
  ExclamationCircleFilled,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Modal, Select, Segmented, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { PLATFORM_CLUSTER, PLATFORM_GPU_NODES, PLATFORM_INFERENCE_GROUPS } from './platformMockData';
import './nodeTopologyPage.less';

type NodeRole = 'prefill' | 'decode' | 'router' | 'idle';
type NodeStatus = 'ready' | 'warning' | 'empty';
type GpuVendor = 'NVIDIA' | 'MetaX' | 'Moore';

type TopologyNode = {
  id: string;
  name: string;
  ip: string;
  zone: string;
  vendor: GpuVendor;
  gpuModel: string;
  gpuCount: number;
  utilization: number;
  temperature: number;
  power: number;
  role: NodeRole;
  status: NodeStatus;
  model: string;
  groupId: string;
  bookable: boolean;
  pods: string[];
};

const ZONES = [PLATFORM_CLUSTER.id];
const GROUPS = PLATFORM_INFERENCE_GROUPS;
const makeNodes = (): TopologyNode[] => PLATFORM_GPU_NODES.map((node) => {
  const group = PLATFORM_INFERENCE_GROUPS.find((item) => item.id === node.inferenceGroupId)!;
  return {
    id: node.id, name: node.name, ip: node.ip, zone: node.clusterId, vendor: node.gpuVendor,
    gpuModel: node.gpuModel, gpuCount: node.gpuCount, utilization: node.utilization, temperature: node.temperature,
    power: node.power, role: node.role, status: node.status, model: group.model, groupId: node.inferenceGroupId,
    bookable: node.bookable, pods: node.pods,
  };
});

const ROLE_META: Record<NodeRole, { short: string; label: string }> = {
  prefill: { short: 'P', label: 'Prefill' },
  decode: { short: 'D', label: 'Decode' },
  router: { short: 'R', label: 'Router 共置' },
  idle: { short: '·', label: '未分配' },
};

const NodeTopologyPage = () => {
  const [nodes, setNodes] = useState(makeNodes);
  const [keyword, setKeyword] = useState('');
  const [zone, setZone] = useState('all');
  const [vendor, setVendor] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [fillMode, setFillMode] = useState<'group' | 'utilization'>('group');
  const [hovered, setHovered] = useState<TopologyNode>();
  const [hoveredGroup, setHoveredGroup] = useState<string>();
  const [editTarget, setEditTarget] = useState<TopologyNode>();
  const [editModel, setEditModel] = useState('GLM-5.2');
  const [editGroup, setEditGroup] = useState('glm52-1');
  const [editRole, setEditRole] = useState<NodeRole>('prefill');

  const filtered = useMemo(() => nodes.filter((node) => {
    const query = keyword.trim().toLowerCase();
    return (!query || `${node.name} ${node.ip} ${node.model} ${node.groupId}`.toLowerCase().includes(query))
      && (zone === 'all' || node.zone === zone)
      && (vendor === 'all' || node.vendor === vendor)
      && (role === 'all' || node.role === role)
      && (status === 'all' || node.status === status);
  }), [keyword, nodes, role, status, vendor, zone]);

  const reset = () => {
    setKeyword(''); setZone('all'); setVendor('all'); setRole('all'); setStatus('all');
  };

  const openEdit = (node: TopologyNode) => {
    setEditTarget(node); setEditModel(node.model); setEditGroup(node.groupId); setEditRole(node.role === 'idle' ? 'prefill' : node.role);
  };

  const saveLabel = () => {
    if (!editTarget) return;
    setNodes((current) => current.map((node) => node.id === editTarget.id ? { ...node, model: editModel, groupId: editGroup, role: editRole, status: 'ready' } : node));
    setHovered((current) => current?.id === editTarget.id ? { ...current, model: editModel, groupId: editGroup, role: editRole, status: 'ready' } : current);
    setEditTarget(undefined);
    message.success('Deployment 标签已更新');
  };

  return (
    <div className="node-topology-page">
      <div className="node-topology-heading">
        <div><h1>节点拓扑</h1><p>集中查看 GPU 节点角色、推理组归属与实时运行状态</p></div>
        <Button icon={<ReloadOutlined />} onClick={() => message.success('节点状态已刷新')}>刷新</Button>
      </div>

      <section className="node-topology-toolbar">
        <Input prefix={<SearchOutlined />} allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索节点名称、IP、模型或推理组" />
        <Select value={zone} onChange={setZone} options={[{ value: 'all', label: '全部区域' }, ...ZONES.map((value) => ({ value, label: value }))]} />
        <Select value={vendor} onChange={setVendor} options={[{ value: 'all', label: '全部 GPU' }, ...['NVIDIA', 'MetaX', 'Moore'].map((value) => ({ value, label: value }))]} />
        <Select value={role} onChange={setRole} options={[{ value: 'all', label: '全部角色' }, ...Object.entries(ROLE_META).map(([value, meta]) => ({ value, label: meta.label }))]} />
        <Select value={status} onChange={setStatus} options={[{ value: 'all', label: '全部状态' }, { value: 'ready', label: '运行正常' }, { value: 'warning', label: '存在异常' }, { value: 'empty', label: '未分配' }]} />
        <Button onClick={reset}>重置</Button>
        <Segmented value={fillMode} onChange={(value) => setFillMode(value as typeof fillMode)} options={[{ value: 'group', label: '推理组' }, { value: 'utilization', label: '利用率' }]} />
      </section>

      <section className="node-topology-legend">
        <div className="node-topology-legend-title"><AppstoreOutlined /><span>图例</span></div>
        <div className="node-topology-legend-rules">
          {Object.entries(ROLE_META).map(([key, meta]) => <span key={key}><b>{meta.short}</b>{meta.label}</span>)}
          <span><i className="ready" />全部 Pod Ready</span><span><i className="warning" />存在异常 Pod</span><span><i className="empty" />暂无部署</span><span><em>B</em>可预约</span>
        </div>
        <div className="node-topology-groups">
          {GROUPS.map((item) => <button key={item.id} type="button" className={hoveredGroup === item.id ? 'active' : ''} onMouseEnter={() => setHoveredGroup(item.id)} onMouseLeave={() => setHoveredGroup(undefined)} onFocus={() => setHoveredGroup(item.id)} onBlur={() => setHoveredGroup(undefined)}><i style={{ background: item.color }} /><span>{item.clusterId} · {item.name}</span><small>{nodes.filter((node) => node.groupId === item.id).length}</small></button>)}
        </div>
      </section>

      <div className="node-topology-workspace">
        <section className="node-topology-board">
          <div className="node-topology-board-head">
            <div><h2>节点分布</h2><span>共 {filtered.length} 个节点</span></div>
            <div className="node-topology-vendor-stats"><span>NVIDIA <b>{filtered.filter((node) => node.vendor === 'NVIDIA').reduce((sum, node) => sum + node.gpuCount, 0)}</b></span><span>MetaX <b>{filtered.filter((node) => node.vendor === 'MetaX').reduce((sum, node) => sum + node.gpuCount, 0)}</b></span><span>Moore <b>{filtered.filter((node) => node.vendor === 'Moore').reduce((sum, node) => sum + node.gpuCount, 0)}</b></span></div>
          </div>
          {filtered.length ? <div className="node-topology-grid">
            {filtered.map((node) => {
              const groupColor = GROUPS.find((item) => item.id === node.groupId)?.color || '#6951ff';
              const utilColor = node.utilization >= 85 ? '#f53f3f' : node.utilization >= 65 ? '#ff7d00' : node.utilization >= 40 ? '#6951ff' : '#14b8a6';
              const accent = fillMode === 'utilization' ? utilColor : groupColor;
              return <button key={node.id} type="button" className={`node-topology-node ${node.status} ${hoveredGroup === node.groupId ? 'group-active' : ''} ${hoveredGroup && hoveredGroup !== node.groupId ? 'group-muted' : ''}`} style={{ '--node-accent': accent, '--node-util': `${node.utilization}%` } as React.CSSProperties} onMouseEnter={() => setHovered(node)} onMouseLeave={() => setHovered(undefined)} onFocus={() => setHovered(node)} onBlur={() => setHovered(undefined)} onClick={() => openEdit(node)}>
                  <span className="node-topology-node-role">{ROLE_META[node.role].short}</span>
                  {node.bookable && <em>B</em>}
                  <strong>{node.name}</strong>
                  <small>{node.gpuModel} · {node.gpuCount}卡</small>
                  <i />
              </button>;
            })}
          </div> : <div className="node-topology-empty"><AppstoreOutlined /><strong>没有匹配的节点</strong><span>请调整筛选条件后重试</span></div>}
        </section>

        <aside className="node-topology-detail">
          {hovered ? <>
            <div className="node-topology-detail-head"><div><span className={hovered.status}>{hovered.status === 'ready' ? <CheckCircleFilled /> : <ExclamationCircleFilled />}{hovered.status === 'ready' ? '运行正常' : hovered.status === 'warning' ? '存在异常' : '未分配'}</span><h2>{hovered.name}</h2><p>{hovered.ip} · {hovered.zone}</p></div><Button type="text" icon={<EditOutlined />} onClick={() => openEdit(hovered)}>编辑标签</Button></div>
            <div className="node-topology-detail-grid"><div><span>GPU</span><strong>{hovered.gpuCount} 张 · {hovered.gpuModel}</strong></div><div><span>厂商</span><strong>{hovered.vendor}</strong></div><div><span>利用率</span><strong>{hovered.utilization}%</strong></div><div><span>温度</span><strong>{hovered.temperature}℃</strong></div><div><span>功耗</span><strong>{hovered.power} W</strong></div><div><span>节点角色</span><strong>{ROLE_META[hovered.role].label}</strong></div></div>
            <div className="node-topology-progress"><div><span>GPU 利用率</span><b>{hovered.utilization}%</b></div><i><em style={{ width: `${hovered.utilization}%` }} /></i></div>
            <div className="node-topology-deployment"><h3>Deployment 标签</h3><div><Tag color="purple">{hovered.model}</Tag><Tag>{hovered.groupId}</Tag><Tag color={hovered.role === 'decode' ? 'green' : 'blue'}>{ROLE_META[hovered.role].label}</Tag></div><code>deployment={hovered.groupId}_{hovered.role}</code></div>
            <div className="node-topology-pods"><h3>运行组件 <span>{hovered.pods.length}</span></h3>{hovered.pods.length ? hovered.pods.map((pod) => <div key={pod}><i /><span>{pod}</span><Tag color="success">Running</Tag></div>) : <p>当前节点暂无推理组件</p>}</div>
          </> : <div className="node-topology-detail-empty"><AppstoreOutlined /><strong>悬浮查看节点</strong><span>移动到节点上查看硬件、状态、推理组和运行组件详情；单击可修改标签</span></div>}
        </aside>
      </div>

      <Modal title="编辑 Deployment 标签" open={Boolean(editTarget)} onCancel={() => setEditTarget(undefined)} onOk={saveLabel} okText="保存" cancelText="取消" width={560} className="node-topology-edit-modal">
        <p className="node-topology-edit-note">节点 <strong>{editTarget?.name}</strong> · 当前 deployment={editTarget?.groupId}_{editTarget?.role}</p>
        <label>模型</label><Select value={editModel} onChange={setEditModel} options={['GLM-5.2', 'KIMI-K2', 'DeepSeek-V4'].map((value) => ({ value, label: value }))} />
        <label>推理组</label><Select value={editGroup} onChange={(value) => { setEditGroup(value); setEditModel(GROUPS.find((item) => item.id === value)?.model || editModel); }} options={GROUPS.map((item) => ({ value: item.id, label: `${item.clusterId} · ${item.name}` }))} />
        <label>角色</label><Segmented block value={editRole} onChange={(value) => setEditRole(value as NodeRole)} options={[{ value: 'prefill', label: 'Prefill' }, { value: 'decode', label: 'Decode' }, { value: 'router', label: 'Router 共置' }]} />
        <div className="node-topology-label-preview"><span>标签预览</span><code>deployment={editGroup}_{editRole}</code></div>
      </Modal>

    </div>
  );
};

export default NodeTopologyPage;
