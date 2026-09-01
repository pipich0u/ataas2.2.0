import {
  AppstoreOutlined,
  CheckCircleFilled,
  EditOutlined,
  ExclamationCircleFilled,
  PushpinFilled,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Modal, Select, Segmented, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PLATFORM_CLUSTER, PLATFORM_GPU_NODES, PLATFORM_INFERENCE_GROUPS, PLATFORM_UNASSIGNED_GPU_NODES } from './platformMockData';
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
  roleIndex: number;
  status: NodeStatus;
  model: string;
  groupId: string;
  bookable: boolean;
  pods: string[];
};

const ZONES = [PLATFORM_CLUSTER.id];
const GROUPS = PLATFORM_INFERENCE_GROUPS;
const makeNodes = (): TopologyNode[] => [
  ...PLATFORM_GPU_NODES.map((node) => {
    const group = PLATFORM_INFERENCE_GROUPS.find((item) => item.id === node.inferenceGroupId)!;
    return {
      id: node.id, name: node.name, ip: node.ip, zone: node.clusterId, vendor: node.gpuVendor,
      gpuModel: node.gpuModel, gpuCount: node.gpuCount, utilization: node.utilization, temperature: node.temperature,
      power: node.power, role: node.role, roleIndex: node.roleIndex, status: node.status, model: group.model, groupId: node.inferenceGroupId,
      bookable: node.bookable, pods: node.pods,
    };
  }),
  ...PLATFORM_UNASSIGNED_GPU_NODES.map((node) => ({
    id: node.id, name: node.name, ip: node.ip, zone: node.clusterId, vendor: node.gpuVendor,
    gpuModel: node.gpuModel, gpuCount: node.gpuCount, utilization: node.utilization, temperature: node.temperature,
    power: node.power, role: 'idle' as const, roleIndex: 0, status: 'empty' as const, model: '', groupId: '',
    bookable: false, pods: [],
  })),
];

const ROLE_META: Record<NodeRole, { short: string; label: string }> = {
  prefill: { short: 'P', label: 'Prefill' },
  decode: { short: 'D', label: 'Decode' },
  router: { short: 'R', label: 'Router 共置' },
  idle: { short: '·', label: '未分配' },
};

type NodeRuntime = {
  storeCapacity: string;
  workerName: string;
  throughput: number;
};

type GroupRuntime = {
  prefillNodes: number;
  decodeNodes: number;
  routerCount: number;
  prefillTps: number;
  decodeTps: number;
  routerRps: number;
  runningDecode: number;
  prefillQueue: number;
  cacheHitRate: number;
  inflightPrefill: number;
};

const formatInteger = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
const getNodeRuntime = (node: TopologyNode): NodeRuntime => ({
  storeCapacity: `${960 + node.roleIndex * 40}GB`,
  workerName: node.pods.find((pod) => !pod.includes('mooncake')) || `${node.groupId}-${node.role}-${node.roleIndex}`,
  throughput: Math.round(node.utilization * (node.role === 'prefill' ? 1.6 : 0.8)),
});
const getGroupRuntime = (groupId: string, nodes: TopologyNode[], group: typeof GROUPS[number] | undefined, tick: number): GroupRuntime => {
  const groupNodes = nodes.filter((node) => node.groupId === groupId);
  const prefillNodes = groupNodes.filter((node) => node.role === 'prefill');
  const decodeNodes = groupNodes.filter((node) => node.role === 'decode');
  const averageUtilization = groupNodes.reduce((sum, node) => sum + node.utilization, 0) / Math.max(groupNodes.length, 1);
  const hasWarning = groupNodes.some((node) => node.status === 'warning');
  const groupSeed = groupNodes.reduce((sum, node) => sum + node.roleIndex + node.utilization, 0);
  const wave = (phase: number) => Math.sin((tick + groupSeed) * 0.81 + phase);
  const prefillBase = prefillNodes.reduce((sum, node) => sum + node.utilization * 18, 0);
  const decodeBase = decodeNodes.reduce((sum, node) => sum + node.utilization * 34, 0);
  return {
    prefillNodes: prefillNodes.length,
    decodeNodes: decodeNodes.length,
    routerCount: group ? 1 : 0,
    prefillTps: Math.round(prefillBase * (1 + wave(0) * 0.06)),
    decodeTps: Math.round(decodeBase * (1 + wave(1.2) * 0.07)),
    routerRps: Math.round(averageUtilization * 42 * (1 + wave(2.4) * 0.05)),
    runningDecode: Math.max(0, Math.round(decodeNodes.reduce((sum, node) => sum + node.utilization / 10, 0) + wave(3.6) * 1.5)),
    prefillQueue: Math.max(0, Math.round((hasWarning ? 8 : Math.max(0, (100 - averageUtilization) / 16)) + wave(4.8) * 2)),
    cacheHitRate: Math.min(99, Math.max(0, Math.round(76 + averageUtilization / 5 + wave(6) * 3))),
    inflightPrefill: Math.max(0, Math.round(prefillNodes.reduce((sum, node) => sum + node.utilization / 8, 0) + wave(7.2) * 3)),
  };
};

const GroupRuntimeSection = ({
  group,
  runtime,
  routerNode,
  standalone = false,
}: {
  group: typeof GROUPS[number];
  runtime: GroupRuntime;
  routerNode?: TopologyNode;
  standalone?: boolean;
}) => (
  <section className={`node-topology-group-runtime ${standalone ? 'standalone' : ''}`}>
    <div className="node-topology-group-runtime-head"><div><h3>推理组运行</h3><span>{group.name}</span></div><div className="node-topology-group-runtime-tags"><span><i />模拟动态 · 1 秒刷新</span><Tag color="blue">{runtime.prefillNodes}P / {runtime.decodeNodes}D</Tag></div></div>
    <div className="node-topology-group-runtime-metrics">
      <div><span>Prefill TPS</span><strong>{formatInteger(runtime.prefillTps)}</strong><small>当前输入吞吐</small></div>
      <div><span>Decode TPS</span><strong>{formatInteger(runtime.decodeTps)}</strong><small>当前生成吞吐</small></div>
      <div><span>路由请求速率</span><strong>{runtime.routerRps}</strong><small>Router RPS · {runtime.routerCount} 个 Router</small></div>
      <div><span>KVCache 命中率</span><strong>{runtime.cacheHitRate}%</strong><small>命中 Token / 查询 Token</small></div>
    </div>
    <div className="node-topology-group-router"><i /><div><small>ROUTER · 推理组共享组件</small><strong>{group.router.name}</strong></div><span>共置于 {routerNode?.name || '—'}</span><Tag color="success">Running</Tag></div>
    <dl className="node-topology-group-runtime-status">
      <div><dt>Prefill 排队</dt><dd>{runtime.prefillQueue} 请求</dd></div>
      <div><dt>Prefill 处理中</dt><dd>{runtime.inflightPrefill} 请求</dd></div>
      <div><dt>Decode 处理中</dt><dd>{runtime.runningDecode} 请求</dd></div>
    </dl>
  </section>
);

const NodeTopologyPage = () => {
  const [nodes, setNodes] = useState(makeNodes);
  const [keyword, setKeyword] = useState('');
  const [zone, setZone] = useState('all');
  const [vendor, setVendor] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [runtimeTick, setRuntimeTick] = useState(0);
  const [hovered, setHovered] = useState<TopologyNode>();
  const [hoveredGroup, setHoveredGroup] = useState<string>();
  const [pinnedNodeId, setPinnedNodeId] = useState<string>();
  const [pinnedGroupId, setPinnedGroupId] = useState<string>();
  const [editTarget, setEditTarget] = useState<TopologyNode>();
  const [editModel, setEditModel] = useState('GLM-5.2');
  const [editGroup, setEditGroup] = useState('glm52-1');
  const [editRole, setEditRole] = useState<NodeRole>('prefill');

  useEffect(() => {
    const timer = window.setInterval(() => setRuntimeTick((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => nodes.filter((node) => {
    const query = keyword.trim().toLowerCase();
    return (!query || `${node.name} ${node.ip} ${node.model} ${node.groupId}`.toLowerCase().includes(query))
      && (zone === 'all' || node.zone === zone)
      && (vendor === 'all' || node.vendor === vendor)
      && (role === 'all' || node.role === role)
      && (status === 'all' || node.status === status);
  }), [keyword, nodes, role, status, vendor, zone]);
  const pinnedNode = useMemo(() => nodes.find((node) => node.id === pinnedNodeId), [nodes, pinnedNodeId]);
  const hoveredNodeInPinnedGroup = hovered && (!pinnedNode || hovered.groupId === pinnedNode.groupId) ? hovered : undefined;
  const detailNode = hoveredNodeInPinnedGroup || pinnedNode;
  const activeGroupId = pinnedNode?.groupId || pinnedGroupId || hoveredGroup;
  const detailGroupId = detailNode ? detailNode.groupId : pinnedGroupId || hoveredGroup;
  const selectedGroup = useMemo(() => detailGroupId ? GROUPS.find((group) => group.id === detailGroupId) : undefined, [detailGroupId]);
  const selectedRouterNode = useMemo(() => selectedGroup ? nodes.find((node) => node.id === selectedGroup.router.primaryNodeId) : undefined, [nodes, selectedGroup]);
  const selectedNodeRuntime = useMemo(() => detailNode ? getNodeRuntime(detailNode) : undefined, [detailNode]);
  const selectedGroupRuntime = useMemo(() => selectedGroup ? getGroupRuntime(selectedGroup.id, nodes, selectedGroup, runtimeTick) : undefined, [nodes, runtimeTick, selectedGroup]);

  const reset = () => {
    setKeyword(''); setZone('all'); setVendor('all'); setRole('all'); setStatus('all');
  };

  const openEdit = (node: TopologyNode) => {
    setEditTarget(node); setEditModel(node.model); setEditGroup(node.groupId); setEditRole(node.role === 'idle' ? 'prefill' : node.role);
  };

  const togglePinnedNode = (node: TopologyNode) => {
    if (pinnedGroupId === node.groupId || pinnedNode?.groupId === node.groupId) {
      setPinnedGroupId(undefined);
      setPinnedNodeId(undefined);
      return;
    }
    setPinnedGroupId(undefined);
    setPinnedNodeId((current) => current === node.id ? undefined : node.id);
  };

  const togglePinnedGroup = (groupId: string) => {
    if (pinnedGroupId === groupId || pinnedNode?.groupId === groupId) {
      setPinnedNodeId(undefined);
      setPinnedGroupId(undefined);
      return;
    }
    setPinnedNodeId(undefined);
    setPinnedGroupId((current) => current === groupId ? undefined : groupId);
  };

  const saveLabel = () => {
    if (!editTarget) return;
    setNodes((current) => current.map((node) => node.id === editTarget.id ? { ...node, model: editModel, groupId: editGroup, role: editRole } : node));
    setHovered((current) => current?.id === editTarget.id ? { ...current, model: editModel, groupId: editGroup, role: editRole } : current);
    setEditTarget(undefined);
    message.success('Deployment 标签已更新');
  };

  return (
    <div className="node-topology-page">
      <div className="node-topology-heading">
        <div><h1>节点拓扑</h1><p>集中查看 GPU 节点角色、推理组归属与实时运行状态</p></div>
      </div>

      <section className="node-topology-toolbar">
        <Input prefix={<SearchOutlined />} allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索节点名称、IP、模型或推理组" />
        <Select value={zone} onChange={setZone} options={[{ value: 'all', label: '全部区域' }, ...ZONES.map((value) => ({ value, label: value }))]} />
        <Select value={vendor} onChange={setVendor} options={[{ value: 'all', label: '全部 GPU' }, ...['NVIDIA', 'MetaX', 'Moore'].map((value) => ({ value, label: value }))]} />
        <Select value={role} onChange={setRole} options={[{ value: 'all', label: '全部角色' }, ...Object.entries(ROLE_META).map(([value, meta]) => ({ value, label: meta.label }))]} />
        <Select value={status} onChange={setStatus} options={[{ value: 'all', label: '全部状态' }, { value: 'ready', label: '运行正常' }, { value: 'warning', label: '存在异常' }, { value: 'empty', label: '未分配' }]} />
        <Button onClick={reset}>重置</Button>
      </section>

      <section className="node-topology-legend">
        <div className="node-topology-legend-title"><AppstoreOutlined /><span>图例</span></div>
        <div className="node-topology-legend-rules">
          <span><b>P</b>Prefill</span><span><b>D</b>Decode</span><span><b className="router">★</b>Router Pod 共置</span>
          <span><ExclamationCircleFilled className="warning" />节点异常</span><span><em>B</em>可预约</span>
        </div>
        <div className="node-topology-groups">
          {GROUPS.map((item) => <button key={item.id} type="button" aria-pressed={pinnedGroupId === item.id} className={activeGroupId === item.id ? 'active' : ''} onMouseEnter={() => setHoveredGroup(item.id)} onMouseLeave={() => setHoveredGroup(undefined)} onFocus={() => setHoveredGroup(item.id)} onBlur={() => setHoveredGroup(undefined)} onClick={() => togglePinnedGroup(item.id)}><i style={{ background: item.color }} /><span>{item.clusterId} · {item.name}</span><small>{nodes.filter((node) => node.groupId === item.id).length}</small></button>)}
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
              const group = GROUPS.find((item) => item.id === node.groupId);
              const groupColor = group?.color || '#86909c';
              const accent = groupColor;
              return <button key={node.id} type="button" aria-pressed={pinnedNodeId === node.id} className={`node-topology-node ${node.status} ${activeGroupId === node.groupId ? 'group-active' : ''} ${pinnedNodeId === node.id ? 'selected' : ''}`} style={{ '--node-accent': accent, '--node-util': `${node.utilization}%` } as React.CSSProperties} onMouseEnter={() => { setHovered(node); setHoveredGroup(node.groupId); }} onMouseLeave={() => { setHovered(undefined); setHoveredGroup(undefined); }} onFocus={() => { setHovered(node); setHoveredGroup(node.groupId); }} onBlur={() => { setHovered(undefined); setHoveredGroup(undefined); }} onClick={() => togglePinnedNode(node)}>
                  <span className="node-topology-node-role">{ROLE_META[node.role].short}</span>
                  <span className="node-topology-node-flags">
                    {node.status === 'warning' && <span className="warning" title="节点异常" aria-label="节点异常"><ExclamationCircleFilled /></span>}
                    {group?.router.primaryNodeId === node.id && <span className="router" title="Router Pod 共置" aria-label="Router Pod 共置">★</span>}
                    {node.bookable && node.status === 'ready' && <span className="bookable" title="可预约" aria-label="可预约">B</span>}
                  </span>
                  <strong>{node.name}</strong>
                  <small>{node.status === 'empty' ? `未分配 · ${node.gpuCount}卡` : `${node.gpuModel} · ${node.gpuCount}卡`}</small>
                  <i />
              </button>;
            })}
          </div> : <div className="node-topology-empty"><AppstoreOutlined /><strong>没有匹配的节点</strong><span>请调整筛选条件后重试</span></div>}
        </section>

        <aside className="node-topology-detail">
          {detailNode && selectedNodeRuntime ? <>
            <div className="node-topology-detail-head">
              <div><span className={detailNode.status}>{detailNode.status === 'ready' ? <CheckCircleFilled /> : <ExclamationCircleFilled />}{detailNode.status === 'ready' ? '运行正常' : detailNode.status === 'warning' ? '存在异常' : '未分配'}</span><h2>{detailNode.name}</h2><p>{detailNode.ip} · {detailNode.zone}</p></div>
              <div className="node-topology-detail-actions">{pinnedNode && <Button type="text" icon={<PushpinFilled />} onClick={() => setPinnedNodeId(undefined)}>取消固定</Button>}<Button type="text" icon={<EditOutlined />} onClick={() => openEdit(detailNode)}>编辑标签</Button></div>
            </div>
            <div className="node-topology-hardware-summary">
              <span>GPU <b>{detailNode.gpuCount} 张 · {detailNode.gpuModel}</b></span><i />
              <span>{detailNode.vendor}</span><i />
              <span>{detailNode.status === 'empty' ? '—' : `${detailNode.temperature}℃`}</span><i />
              <span>{detailNode.status === 'empty' ? '—' : `${formatInteger(detailNode.power)} W`}</span>
            </div>
            <div className="node-topology-progress"><div><span>GPU 利用率</span><b>{detailNode.utilization}%</b></div><i><em style={{ width: `${detailNode.utilization}%` }} /></i></div>
            <section className="node-topology-deployment">
              <h3>{selectedGroup ? 'Deployment 标签' : '部署信息'}</h3>
              {selectedGroup ? <><div><Tag color="purple">{detailNode.model}</Tag><Tag>{detailNode.groupId}</Tag><Tag color={detailNode.role === 'decode' ? 'green' : 'blue'}>{ROLE_META[detailNode.role].label}</Tag></div><code>deployment={detailNode.groupId}_{detailNode.role}</code></> : <div className="node-topology-unassigned-note"><Tag>未分配</Tag><span>该节点尚未加入推理组</span></div>}
            </section>
            <section className="node-topology-runtime-components">
              <h3>节点运行组件 <span>{detailNode.pods.length + Number(selectedGroup?.mooncake.master.nodeId === detailNode.id)}</span></h3>
              {selectedGroup?.mooncake.master.nodeId === detailNode.id && <div className="node-topology-runtime-component master"><i /><div><small>MASTER · Mooncake</small><strong>{selectedGroup.mooncake.master.name}</strong></div><Tag color="success">Running</Tag></div>}
              {detailNode.pods.length ? <>
                <div className="node-topology-runtime-component"><i /><div><small>Mooncake Store · {selectedNodeRuntime.storeCapacity}</small><strong>{detailNode.pods.find((pod) => pod.includes('mooncake')) || `${detailNode.groupId}-mooncake-store`}</strong></div><Tag color="success">Running</Tag></div>
                <div className="node-topology-runtime-component"><i /><div><small>{ROLE_META[detailNode.role].label} · {selectedNodeRuntime.throughput} t/s</small><strong>{selectedNodeRuntime.workerName}</strong></div><Tag color="success">Running</Tag></div>
              </> : <p>当前节点暂无推理组件</p>}
            </section>
            {selectedGroup && selectedGroupRuntime && <GroupRuntimeSection group={selectedGroup} runtime={selectedGroupRuntime} routerNode={selectedRouterNode} />}
          </> : selectedGroup && selectedGroupRuntime ? <>
            <div className="node-topology-detail-head group-overview"><div><span className="ready"><CheckCircleFilled />推理组概览</span><h2>{selectedGroup.name}</h2><p>{selectedGroup.model} · {selectedGroup.clusterId} · {selectedGroup.prefillNodeIds.length + selectedGroup.decodeNodeIds.length} 个节点</p></div><div className="node-topology-detail-actions">{pinnedGroupId && <Button type="text" icon={<PushpinFilled />} onClick={() => setPinnedGroupId(undefined)}>取消固定</Button>}</div></div>
            <GroupRuntimeSection group={selectedGroup} runtime={selectedGroupRuntime} routerNode={selectedRouterNode} standalone />
          </> : <div className="node-topology-detail-empty"><AppstoreOutlined /><strong>悬浮查看节点或推理组</strong><span>移动到节点或推理组标签上查看详情；单击即可固定在右侧。</span></div>}
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
