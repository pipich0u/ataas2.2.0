export type ModelOpsResourceSpec = {
  name: string;
  cluster: string;
  instanceCount: number;
  workerNames: string[];
  routerReady: number;
  routerTotal: number;
  prefillReady: number;
  prefillTotal: number;
  decodeReady: number;
  decodeTotal: number;
  weight: number;
};

export const MODEL_OPS_RESOURCE_SPECS: ModelOpsResourceSpec[] = [
  /* ── 厂商A · xxx科技 → 上海一号数据中心 ── */
  // gpu-prod-01 上海资源段 82台
  { name: 'sh-prod-router', cluster: 'gpu-prod-01', instanceCount: 10, workerNames: Array.from({ length: 10 }, (_, i) => `sh-prod-node-${i + 1}`), routerReady: 2, routerTotal: 2, prefillReady: 4, prefillTotal: 4, decodeReady: 4, decodeTotal: 4, weight: 10 },
  { name: 'sh-prod-llm-1', cluster: 'gpu-prod-01', instanceCount: 6, workerNames: Array.from({ length: 6 }, (_, i) => `/gpu/nvidia-a100-${i + 1}`), routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 3, decodeReady: 3, decodeTotal: 3, weight: 12 },
  { name: 'sh-prod-llm-2', cluster: 'gpu-prod-01', instanceCount: 6, workerNames: Array.from({ length: 6 }, (_, i) => `/gpu/nvidia-a800-${i + 1}`), routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 4, decodeReady: 3, decodeTotal: 3, weight: 12 },
  { name: 'sh-prod-cache', cluster: 'gpu-prod-01', instanceCount: 4, workerNames: ['sh-cache-node-1', 'sh-cache-node-2', 'sh-cache-node-3', 'sh-cache-node-4'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 2, weight: 8 },
  // gpu-test-sh-01 24台
  { name: 'sh-test-router', cluster: 'gpu-test-sh-01', instanceCount: 2, workerNames: ['sh-test-node-1', 'sh-test-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 4, decodeReady: 1, decodeTotal: 1, weight: 10 },
  { name: 'sh-test-llm', cluster: 'gpu-test-sh-01', instanceCount: 2, workerNames: ['/gpu/test-a100-1', '/gpu/test-a100-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 2, weight: 10 },

  /* ── 厂商A · xxx科技 → 上海张江数据中心 ── */
  // gpu-llm-01 36台
  { name: 'zj-llm-router', cluster: 'gpu-llm-01', instanceCount: 4, workerNames: ['zj-llm-node-1', 'zj-llm-node-2', 'zj-llm-node-3', 'zj-llm-node-4'], routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 3, decodeReady: 3, decodeTotal: 3, weight: 11 },
  { name: 'zj-llm-worker', cluster: 'gpu-llm-01', instanceCount: 4, workerNames: ['/gpu/zj-a100-1', '/gpu/zj-a100-2', '/gpu/zj-a100-3', '/gpu/zj-a100-4'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 2, weight: 11 },

  /* ── 厂商B · 中原算力 → 郑州高新数据中心 ── */
  // gpu-prod-01 郑州资源段 64台
  { name: 'zz-prod-router', cluster: 'gpu-prod-01', instanceCount: 6, workerNames: ['zz-prod-node-1', 'zz-prod-node-2', 'zz-prod-node-3', 'zz-prod-node-4', 'zz-prod-node-5', 'zz-prod-node-6'], routerReady: 1, routerTotal: 1, prefillReady: 4, prefillTotal: 5, decodeReady: 2, decodeTotal: 2, weight: 9 },
  { name: 'zz-prod-llm', cluster: 'gpu-prod-01', instanceCount: 4, workerNames: ['/gpu/zz-kunlun-1', '/gpu/zz-kunlun-2', '/gpu/zz-kunlun-3', '/gpu/zz-kunlun-4'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 3, weight: 9 },
  // gpu-dev-zz-01 32台
  { name: 'zz-dev-router', cluster: 'gpu-dev-zz-01', instanceCount: 2, workerNames: ['zz-dev-node-1', 'zz-dev-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 8 },
  { name: 'zz-dev-llm', cluster: 'gpu-dev-zz-01', instanceCount: 2, workerNames: ['/gpu/zz-dev-ascend-1', '/gpu/zz-dev-ascend-2'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 8 },

  /* ── 厂商B · 中原算力 → 洛阳西苑数据中心 ── */
  // gpu-inf-01 18台
  { name: 'ly-inf-router', cluster: 'gpu-inf-01', instanceCount: 2, workerNames: ['ly-inf-node-1', 'ly-inf-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 1, decodeReady: 1, decodeTotal: 1, weight: 7 },
  { name: 'ly-inf-worker', cluster: 'gpu-inf-01', instanceCount: 2, workerNames: ['/gpu/ly-hygon-1', '/gpu/ly-hygon-2'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 7 },

  /* ── 厂商C · 华北云 → 北京亦庄数据中心 ── */
  // gpu-prod-01 北京资源段 40台
  { name: 'bj-prod-router', cluster: 'gpu-prod-01', instanceCount: 4, workerNames: ['bj-prod-node-1', 'bj-prod-node-2', 'bj-prod-node-3', 'bj-prod-node-4'], routerReady: 1, routerTotal: 1, prefillReady: 4, prefillTotal: 4, decodeReady: 2, decodeTotal: 2, weight: 7 },
  { name: 'bj-prod-llm-1', cluster: 'gpu-prod-01', instanceCount: 4, workerNames: ['/gpu/bj-a100-1', '/gpu/bj-a100-2', '/gpu/bj-a100-3', '/gpu/bj-a100-4'], routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 3, decodeReady: 2, decodeTotal: 2, weight: 7 },
  { name: 'bj-prod-llm-2', cluster: 'gpu-prod-01', instanceCount: 4, workerNames: ['/gpu/bj-a800-1', '/gpu/bj-a800-2', '/gpu/bj-a800-3', '/gpu/bj-a800-4'], routerReady: 1, routerTotal: 1, prefillReady: 5, prefillTotal: 6, decodeReady: 2, decodeTotal: 2, weight: 7 },

  /* ── 厂商C · 华北云 → 天津滨海数据中心 ── */
  // gpu-ml-01 28台
  { name: 'tj-ml-router', cluster: 'gpu-ml-01', instanceCount: 2, workerNames: ['tj-ml-node-1', 'tj-ml-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 4, decodeReady: 1, decodeTotal: 1, weight: 10 },
  { name: 'tj-ml-worker', cluster: 'gpu-ml-01', instanceCount: 2, workerNames: ['/gpu/tj-a100-1', '/gpu/tj-a100-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 2, weight: 10 },

  /* ── 厂商D · 边缘算力 → 成都天府数据中心 ── */
  // gpu-edge-01 成都资源段 16台
  { name: 'cd-edge-router', cluster: 'gpu-edge-01', instanceCount: 2, workerNames: ['cd-edge-node-1', 'cd-edge-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 6 },
  { name: 'cd-edge-worker', cluster: 'gpu-edge-01', instanceCount: 2, workerNames: ['/gpu/cd-a10-1', '/gpu/cd-a10-2'], routerReady: 1, routerTotal: 1, prefillReady: 4, prefillTotal: 5, decodeReady: 1, decodeTotal: 1, weight: 6 },
  // gpu-cdn-01 12台
  { name: 'cd-cdn-router', cluster: 'gpu-cdn-01', instanceCount: 2, workerNames: ['cd-cdn-node-1', 'cd-cdn-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 1, decodeReady: 1, decodeTotal: 1, weight: 5 },
  { name: 'cd-cdn-worker', cluster: 'gpu-cdn-01', instanceCount: 2, workerNames: ['/gpu/cd-t4-1', '/gpu/cd-t4-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 5 },

  /* ── 厂商D · 边缘算力 → 贵阳高新数据中心 ── */
  // gpu-edge-01 贵阳资源段 8台
  { name: 'gy-edge-router', cluster: 'gpu-edge-01', instanceCount: 1, workerNames: ['gy-edge-node-1'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 1, decodeReady: 1, decodeTotal: 1, weight: 4 },
  { name: 'gy-edge-worker', cluster: 'gpu-edge-01', instanceCount: 1, workerNames: ['/gpu/gy-a2-1'], routerReady: 1, routerTotal: 1, prefillReady: 1, prefillTotal: 1, decodeReady: 1, decodeTotal: 1, weight: 4 },

  /* ── 厂商E · 海外云 → 新加坡T3数据中心 ── */
  // gpu-prod-01 新加坡资源段 24台
  { name: 'sg-prod-router', cluster: 'gpu-prod-01', instanceCount: 2, workerNames: ['sg-prod-node-1', 'sg-prod-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 3, prefillTotal: 3, decodeReady: 2, decodeTotal: 2, weight: 8 },
  { name: 'sg-prod-llm', cluster: 'gpu-prod-01', instanceCount: 2, workerNames: ['/gpu/sg-h100-1', '/gpu/sg-h100-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 2, decodeTotal: 2, weight: 8 },

  /* ── 厂商E · 海外云 → 日本东京数据中心 ── */
  // gpu-prod-01 东京资源段 16台
  { name: 'tokyo-prod-router', cluster: 'gpu-prod-01', instanceCount: 2, workerNames: ['tokyo-prod-node-1', 'tokyo-prod-node-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 7 },
  { name: 'tokyo-prod-llm', cluster: 'gpu-prod-01', instanceCount: 2, workerNames: ['/gpu/tokyo-h100-1', '/gpu/tokyo-h100-2'], routerReady: 1, routerTotal: 1, prefillReady: 2, prefillTotal: 2, decodeReady: 1, decodeTotal: 1, weight: 7 },
];

export const getModelOpsRoleSummary = (spec: ModelOpsResourceSpec) => ({
  router: `${spec.routerReady}/${spec.routerTotal}`,
  prefill: `${spec.prefillReady}/${spec.prefillTotal}`,
  decode: `${spec.decodeReady}/${spec.decodeTotal}`,
});
