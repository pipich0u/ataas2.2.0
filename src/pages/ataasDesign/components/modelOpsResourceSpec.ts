import { PLATFORM_CLUSTER, PLATFORM_INFERENCE_GROUPS, platformNodeNames } from './platformMockData';

export type ModelOpsResourceSpec = {
  name: string;
  serviceName: string;
  cluster: string;
  instanceCount: number;
  workerNames: string[];
  routerNodeNames: string[];
  prefillNodeNames: string[];
  decodeNodeNames: string[];
  mooncakeNodeNames: string[];
  routeNames: string[];
  routerReady: number;
  routerTotal: number;
  prefillReady: number;
  prefillTotal: number;
  decodeReady: number;
  decodeTotal: number;
  weight: number;
};

export const MODEL_OPS_RESOURCE_SPECS: ModelOpsResourceSpec[] = PLATFORM_INFERENCE_GROUPS.map((group) => {
  const prefillNodeNames = platformNodeNames(group.prefillNodeIds);
  const decodeNodeNames = platformNodeNames(group.decodeNodeIds);
  const workerNames = [...prefillNodeNames, ...decodeNodeNames];
  return {
    name: group.id,
    serviceName: group.serviceName,
    cluster: PLATFORM_CLUSTER.id,
    instanceCount: workerNames.length,
    workerNames,
    routerNodeNames: platformNodeNames(group.router.eligibleNodeIds),
    prefillNodeNames,
    decodeNodeNames,
    mooncakeNodeNames: platformNodeNames(group.mooncake.nodeIds),
    routeNames: group.ingressNames,
    routerReady: 1,
    routerTotal: 1,
    prefillReady: prefillNodeNames.length,
    prefillTotal: prefillNodeNames.length,
    decodeReady: decodeNodeNames.length,
    decodeTotal: decodeNodeNames.length,
    weight: 100,
  };
});

export const getModelOpsRoleSummary = (spec: ModelOpsResourceSpec) => ({
  router: `${spec.routerReady}/${spec.routerTotal}`,
  prefill: `${spec.prefillReady}/${spec.prefillTotal}`,
  decode: `${spec.decodeReady}/${spec.decodeTotal}`,
});
