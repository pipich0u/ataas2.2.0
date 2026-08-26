import { DEFAULT_ROUTE_CONFIGS } from './routeConfigStore';

export const PLATFORM_CLUSTER = { id: 'ST1', key: 'ST1', name: 'ST1', namespace: 'production' } as const;
export type PlatformNodeRole = 'prefill' | 'decode';
export type PlatformNodeStatus = 'ready' | 'warning';
export type PlatformGpuNode = {
  id: string; name: string; ip: string; clusterId: string; inferenceGroupId: string; role: PlatformNodeRole; roleIndex: number;
  gpuVendor: 'NVIDIA'; gpuModel: 'B300'; gpuCount: 8; utilization: number; temperature: number; power: number;
  status: PlatformNodeStatus; bookable: boolean; pods: string[];
};
export type PlatformInferenceGroup = {
  id: string; name: string; clusterId: string; model: string; color: string; serviceName: string; routeIds: string[]; ingressNames: string[];
  router: { name: string; placement: 'co-located-with-pd'; primaryNodeId: string; eligibleNodeIds: string[] };
  prefillNodeIds: string[]; decodeNodeIds: string[];
  mooncake: { placement: 'reuse-pd-nodes'; nodeIds: string[] };
};

const serviceEntryNames = Array.from(new Set(DEFAULT_ROUTE_CONFIGS.map((route) => route.serviceEntry)));
const groupColors = ['#6951ff', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#22c55e', '#6366f1', '#e11d48'];
const getGroupModel = (groupId: string) => groupId.includes('kimi') ? 'KIMI-K2' : groupId.includes('glm') ? 'GLM-5.2' : 'DeepSeek-V4';
export const PLATFORM_GPU_NODES: PlatformGpuNode[] = serviceEntryNames.flatMap((groupId, groupIndex) =>
  Array.from({ length: 5 }, (_, nodeIndex) => {
    const inventoryIndex = groupIndex * 5 + nodeIndex;
    const role = nodeIndex < 4 ? 'prefill' as const : 'decode' as const;
    return {
      id: `node-st1-${String(inventoryIndex + 1).padStart(3, '0')}`,
      name: `st-gpu-${String(inventoryIndex + 1).padStart(3, '0')}`,
      ip: `192.168.${100 + Math.floor(inventoryIndex / 220)}.${20 + (inventoryIndex % 220)}`,
      clusterId: PLATFORM_CLUSTER.id,
      inferenceGroupId: groupId,
      role,
      roleIndex: role === 'prefill' ? nodeIndex + 1 : 1,
      gpuVendor: 'NVIDIA' as const,
      gpuModel: 'B300' as const,
      gpuCount: 8 as const,
      utilization: 24 + ((inventoryIndex * 11) % 68),
      temperature: 42 + ((inventoryIndex * 3) % 22),
      power: 2380 + ((inventoryIndex * 137) % 1840),
      status: inventoryIndex % 17 === 0 ? 'warning' as const : 'ready' as const,
      bookable: inventoryIndex % 9 === 0,
      pods: [`${groupId}-${role}-${role === 'prefill' ? nodeIndex + 1 : 1}`, `${groupId}-mooncake-store-${nodeIndex + 1}`],
    };
  }),
);
export const PLATFORM_INFERENCE_GROUPS: PlatformInferenceGroup[] = serviceEntryNames.map((groupId, groupIndex) => {
  const routes = DEFAULT_ROUTE_CONFIGS.filter((route) => route.serviceEntry === groupId);
  const nodes = PLATFORM_GPU_NODES.filter((node) => node.inferenceGroupId === groupId);
  const prefillNodes = nodes.filter((node) => node.role === 'prefill');
  const decodeNodes = nodes.filter((node) => node.role === 'decode');
  return {
    id: groupId, name: groupId, clusterId: PLATFORM_CLUSTER.id, model: getGroupModel(groupId), color: groupColors[groupIndex % groupColors.length], serviceName: `${groupId}-svc`,
    routeIds: routes.map((route) => route.id), ingressNames: routes.map((route) => route.name),
    router: { name: `${groupId}-router-0`, placement: 'co-located-with-pd', primaryNodeId: prefillNodes[0].id, eligibleNodeIds: nodes.map((node) => node.id) },
    prefillNodeIds: prefillNodes.map((node) => node.id), decodeNodeIds: decodeNodes.map((node) => node.id),
    mooncake: { placement: 'reuse-pd-nodes', nodeIds: nodes.map((node) => node.id) },
  };
});
export const PLATFORM_NODE_BY_ID = new Map(PLATFORM_GPU_NODES.map((node) => [node.id, node]));
export const PLATFORM_GROUP_BY_ID = new Map(PLATFORM_INFERENCE_GROUPS.map((group) => [group.id, group]));
export const platformNodeNames = (nodeIds: string[]) => nodeIds.map((id) => PLATFORM_NODE_BY_ID.get(id)?.name).filter((name): name is string => Boolean(name));
export const validatePlatformMockRelations = () => {
  const errors: string[] = [];
  const occupied = new Set<string>();
  PLATFORM_INFERENCE_GROUPS.forEach((group) => {
    const pd = [...group.prefillNodeIds, ...group.decodeNodeIds];
    if (group.prefillNodeIds.length !== 4 || group.decodeNodeIds.length !== 1) errors.push(`${group.id}: expected 4P+1D`);
    pd.forEach((id) => { if (occupied.has(id)) errors.push(`${id}: occupied twice`); occupied.add(id); });
    if (!group.router.eligibleNodeIds.every((id) => pd.includes(id))) errors.push(`${group.id}: router outside P/D nodes`);
    if (!group.mooncake.nodeIds.every((id) => pd.includes(id))) errors.push(`${group.id}: Mooncake outside P/D nodes`);
  });
  if (occupied.size !== PLATFORM_GPU_NODES.length) errors.push('GPU node inventory is not fully assigned to inference groups');
  return errors;
};

const platformRelationErrors = validatePlatformMockRelations();
if (platformRelationErrors.length > 0) {
  throw new Error(`Invalid platform mock relations: ${platformRelationErrors.join('; ')}`);
}
