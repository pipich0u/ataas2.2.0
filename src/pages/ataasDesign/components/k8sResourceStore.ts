import { useCallback, useEffect, useMemo, useState } from 'react';
import { MODEL_OPS_RESOURCE_SPECS } from './modelOpsResourceSpec';
import { initialGroups } from './pdGroupsPage';

export type K8sResourceSource = 'model-deploy' | 'manual' | 'imported-yaml';
export type K8sResourceStatus = 'Running' | 'Pending' | 'Failed' | 'Draft';
export type K8sPodRole = 'dev' | 'master' | 'store' | 'etcd' | 'router' | 'prefill' | 'decode' | 'business';

export type K8sServiceEntryResource = {
  id: string;
  kind: 'ServiceEntry';
  name: string;
  cluster: string;
  namespace: string;
  hosts: string[];
  serviceIds: string[];
  endpoints: Array<{ serviceId: string; address: string; weight: number }>;
  source: K8sResourceSource;
  status: K8sResourceStatus;
  yaml: string;
  createdAt: string;
  updatedAt: string;
};

export type K8sServiceResource = {
  id: string;
  kind: 'Service';
  name: string;
  cluster: string;
  namespace: string;
  clusterIP: string;
  type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
  ports: Array<{ name: string; port: number; targetPort: number; nodePort?: number; protocol: 'TCP' | 'UDP' }>;
  selector: Record<string, string>;
  labels: Record<string, string>;
  podIds: string[];
  serviceEntryId?: string;
  source: K8sResourceSource;
  status: K8sResourceStatus;
  yaml: string;
  createdAt: string;
};

export type K8sPodResource = {
  id: string;
  kind: 'Pod';
  name: string;
  cluster: string;
  namespace: string;
  role: K8sPodRole;
  serviceId?: string;
  group?: string;
  ready: string;
  status: K8sResourceStatus;
  restart: number;
  image: string;
  podIP: string;
  node: string;
  nodeGPU: string;
  gpuUtil: number;
  gpuVram: number;
  age: string;
  trafficSource?: string;
  owner?: string;
  collaborators?: string[];
  expiresIn?: string;
  expiresAt?: string;
  source: K8sResourceSource;
  yaml: string;
  tpotP50?: number;
  tpotP99?: number;
  ttftP50?: number;
  ttftP99?: number;
  load: number;
};

export type K8sResourceState = {
  serviceEntries: K8sServiceEntryResource[];
  services: K8sServiceResource[];
  pods: K8sPodResource[];
};

const STORE_KEY = 'ataas.k8s.resources.v3';
const STORE_EVENT = 'ataas-k8s-resources-change';

const nowLabel = () => '2026-07-06 10:00';
const MODEL_OPS_SEED = MODEL_OPS_RESOURCE_SPECS
  .map((spec) => `${spec.name}:${spec.cluster}:${spec.routerReady}/${spec.routerTotal}:${spec.prefillReady}/${spec.prefillTotal}:${spec.decodeReady}/${spec.decodeTotal}:${spec.weight}`)
  .join('|') + '|only-group-pods-v2|with-serving-se';

const resolveResourceCluster = (name: string) => {
  if (/^(sh|zj)-/.test(name)) return 'st';
  if (/^bj-/.test(name)) return 'beijing-prod';
  if (/^(zz|cd|gy)-/.test(name)) return 'guangzhou-test';
  return 'wuhan-kunpeng';
};

export const clusterGroupNames: Record<string, string[]> = {
  'st': ['glm51_1', 'glm51_3', 'glm51_4'],
  'beijing-prod': ['glm51_1', 'glm51_2'],
  'guangzhou-test': ['glm51_1'],
  'wuhan-kunpeng': ['default'],
};

const resolveGroupName = (name: string, cluster: string, index: number): string => {
  const groups = clusterGroupNames[cluster] || ['default'];
  return groups[index % groups.length];
};

export const buildServiceYaml = (service: K8sServiceResource) => `apiVersion: v1
kind: Service
metadata:
  name: ${service.name}
  namespace: ${service.namespace}
  labels:
${Object.entries(service.labels || {}).map(([key, value]) => `    ${key}: ${value}`).join('\n') || '    app: unknown'}
spec:
  type: ${service.type}
  selector:
${Object.entries(service.selector || {}).map(([key, value]) => `    ${key}: ${value}`).join('\n') || '    app: unknown'}
  ports:
${service.ports.map((port) => `    - name: ${port.name}
      protocol: ${port.protocol}
      port: ${port.port}
      targetPort: ${port.targetPort}${port.nodePort ? `\n      nodePort: ${port.nodePort}` : ''}`).join('\n')}`;

export const buildPodYaml = (pod: K8sPodResource) => {
  const annotations = [
    pod.owner ? `    ataas.io/owner: ${pod.owner}` : '',
    pod.collaborators?.length ? `    ataas.io/collaborators: ${pod.collaborators.join(',')}` : '',
    pod.expiresIn ? `    ataas.io/expires-in: ${pod.expiresIn}` : '',
  ].filter(Boolean);
  const nodeName = pod.node && pod.node !== '自动调度'
    ? `  nodeName: ${pod.node}\n`
    : '';

  return `apiVersion: v1
kind: Pod
metadata:
  name: ${pod.name}
  namespace: ${pod.namespace}${annotations.length ? `\n  annotations:\n${annotations.join('\n')}` : ''}
  labels:
    app: ${pod.group || pod.name}
    role: ${pod.role}
spec:
${nodeName}  containers:
    - name: ${pod.role}
      image: ${pod.image}
      ports:
        - containerPort: 8000`;
};

export const buildServiceEntryYaml = (entry: K8sServiceEntryResource) => `apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: ${entry.name}
  namespace: ${entry.namespace}
spec:
  hosts:
${entry.hosts.map((host) => `    - ${host}`).join('\n')}
  endpoints:
${entry.endpoints.map((endpoint) => `    - address: ${endpoint.address}
      weight: ${endpoint.weight}`).join('\n')}`;

const getMockServiceEntryId = (name: string, cluster: string, index: number) => {
  return `se-${name}`;
};

const getMockServiceEntryName = (id: string, cluster: string) => {
  return id;
};

const makeService = (index: number): K8sServiceResource => {
  const spec = MODEL_OPS_RESOURCE_SPECS[index];
  const name = spec.name;
  const cluster = resolveResourceCluster(name);
  const serviceEntryId = getMockServiceEntryId(spec.name, cluster, index);
  const service: K8sServiceResource = {
    id: `svc-${name}-${cluster}`,
    kind: 'Service',
    name,
    cluster,
    namespace: 'default',
    clusterIP: `10.43.${21 + (index % 6)}.${18 + index}`,
    type: 'ClusterIP',
    ports: [{ name: 'http', port: 8000, targetPort: 8000, protocol: 'TCP' }],
    selector: { 'rolebasedgroup.workloads.x-k8s.io/name': name, 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
    labels: { monitoring: 'scrape', 'rolebasedgroup.workloads.x-k8s.io/name': name, 'rolebasedgroup.workloads.x-k8s.io/role': 'router' },
    podIds: [
      `pod-${name}-${cluster}-router-0`,
    ],
    serviceEntryId,
    source: 'model-deploy',
    status: 'Running',
    yaml: '',
    createdAt: `2026-06-${String((index % 20) + 1).padStart(2, '0')} 09:30`,
  };
  return { ...service, yaml: buildServiceYaml(service) };
};

const makePodsForService = (service: K8sServiceResource, index: number): K8sPodResource[] => {
  const spec = MODEL_OPS_RESOURCE_SPECS[index];
  const base = {
    cluster: service.cluster,
    namespace: service.namespace,
    group: '',
    age: `${2 + (index % 9)}d ${index % 20}h`,
    source: 'model-deploy' as K8sResourceSource,
    serviceId: service.id,
    trafficSource: service.name,
    nodeGPU: 'B300 192G x 8',
    gpuUtil: 24 + (index % 6) * 5,
    gpuVram: 20 + (index % 5) * 4,
  };
  const router: K8sPodResource = {
    ...base,
    id: `pod-${service.name}-${service.cluster}-router-0`,
    kind: 'Pod',
    name: `${service.name}-router-0`,
    role: 'router',
    ready: `${spec.routerReady}/${spec.routerTotal}`,
    status: spec.routerReady < spec.routerTotal ? 'Pending' : 'Running',
    restart: index % 5,
    image: 'sglang/router:v0.5.10',
    podIP: `10.0.${index % 8}.${20 + index}`,
    node: spec.workerNames[0] || `worker-${String(index % 12).padStart(3, '0')}`,
    yaml: '',
    load: 28 + (index % 7) * 6,
    ttftP50: 38 + (index % 6) * 4,
    ttftP99: 82 + (index % 8) * 7,
  };
  const prefillPods = Array.from({ length: spec.prefillTotal }, (_, podIndex): K8sPodResource => {
    const ready = podIndex < spec.prefillReady;
    const pod: K8sPodResource = {
      ...base,
      id: `pod-${service.name}-${service.cluster}-prefill-${podIndex}`,
      kind: 'Pod',
      name: `${service.name}-prefill-${podIndex}`,
      role: 'prefill',
      ready: ready ? '1/1' : '0/1',
      status: ready ? 'Running' : 'Pending',
      restart: (index + podIndex) % 4,
      image: 'sglang/worker:v0.5.10',
      podIP: `10.1.${index % 8}.${30 + podIndex}`,
      node: spec.workerNames[podIndex % spec.workerNames.length] || `worker-${String(index % 12).padStart(3, '0')}`,
      yaml: '',
      load: 18 + ((index + podIndex) % 8) * 7,
      ttftP50: 180 + (index % 7) * 24 + podIndex * 9,
      ttftP99: 31234 + index * 431 + podIndex * 137,
    };
    return { ...pod, yaml: buildPodYaml(pod) };
  });
  const decodePods = Array.from({ length: spec.decodeTotal }, (_, podIndex): K8sPodResource => {
    const ready = podIndex < spec.decodeReady;
    const pod: K8sPodResource = {
      ...base,
      id: `pod-${service.name}-${service.cluster}-decode-${podIndex}`,
      kind: 'Pod',
      name: `${service.name}-decode-${podIndex}`,
      role: 'decode',
      ready: ready ? '1/1' : '0/1',
      status: ready ? 'Running' : 'Pending',
      restart: (index + podIndex + 1) % 5,
      image: 'sglang/worker:v0.5.10',
      podIP: `10.2.${index % 8}.${40 + podIndex}`,
      node: spec.workerNames[(podIndex + spec.prefillTotal) % spec.workerNames.length] || `worker-${String((index + 4) % 12).padStart(3, '0')}`,
      yaml: '',
      load: 22 + ((index + podIndex) % 6) * 9,
      tpotP50: 12 + (index % 5) * 2 + podIndex,
      tpotP99: 24 + (index % 7) * 3 + podIndex * 2,
    };
    return { ...pod, yaml: buildPodYaml(pod) };
  });
  const infraRoles = [
    { role: 'store' as K8sPodRole, count: 2, image: 'mooncake/store:v3.2.1', baseIP: 52 },
    { role: 'master' as K8sPodRole, count: 1, image: 'mooncake/master:v3.2.1', baseIP: 62 },
    { role: 'etcd' as K8sPodRole, count: 1, image: 'mooncake/etcd:v3.5.7', baseIP: 72 },
  ];
  const infraPods = infraRoles.flatMap(({ role, count, image, baseIP }) =>
    Array.from({ length: count }, (_, podIndex): K8sPodResource => {
      const pod: K8sPodResource = {
        ...base,
        id: `pod-${service.name}-${service.cluster}-${role}-${podIndex}`,
        kind: 'Pod',
        name: `${service.name}-${role}-${podIndex}`,
        role,
        ready: '1/1',
        status: 'Running',
        restart: (index + podIndex + 2) % 3,
        image,
        podIP: `10.26.${baseIP}.${30 + podIndex}`,
        node: spec.workerNames[podIndex % spec.workerNames.length] || `worker-${String(index % 12).padStart(3, '0')}`,
        yaml: '',
        load: 5 + (index % 3),
      };
      return { ...pod, yaml: buildPodYaml(pod) };
    }),
  );
  return [{ ...router, yaml: buildPodYaml(router) }, ...prefillPods, ...decodePods, ...infraPods];
};

export const createInitialK8sResourceState = (): K8sResourceState => {
  const services = MODEL_OPS_RESOURCE_SPECS.map((_, index) => makeService(index));

  const groupPods = initialGroups.flatMap((group) =>
    group.pods.map((pod, podIndex) => {
      const id = `pod-${group.key}-${pod.role}-${podIndex}`;
      const prefillNodes = group.roles.prefill?.nodes || [];
      const prefillNode = prefillNodes.length > 0 ? prefillNodes[0] : pod.node;
      const isReusableRole = pod.role === 'router' || pod.role === 'store' || pod.role === 'master' || pod.role === 'etcd';
      return {
        id,
        kind: 'Pod' as const,
        name: pod.name,
        cluster: group.clusterKey,
        namespace: group.namespace,
        role: (pod.role === 'store' || pod.role === 'master' || pod.role === 'etcd' ? pod.role : pod.role === 'router' || pod.role === 'prefill' || pod.role === 'decode' ? pod.role : 'prefill') as K8sPodRole,
        serviceId: services.find((s) => s.cluster === group.clusterKey)?.id,
        group: group.name,
        ready: pod.readyLabel,
        status: pod.status,
        restart: pod.restarts,
        image: pod.role === 'router' ? 'sglang/router:v0.5.10'
          : ['store', 'master', 'etcd'].includes(pod.role) ? `mooncake/${pod.role}:v3.2.1`
          : 'sglang/worker:v0.5.10',
        podIP: pod.podIP,
        node: isReusableRole ? prefillNode : pod.node,
        nodeGPU: 'B300 192G x 8',
        gpuUtil: 30 + (podIndex % 5) * 8,
        gpuVram: 24 + (podIndex % 4) * 6,
        age: `${3 + (podIndex % 7)}d ${podIndex * 3 % 24}h`,
        source: 'model-deploy' as K8sResourceSource,
        yaml: '',
        load: 15 + (podIndex % 6) * 10,
        tpotP50: 12 + podIndex * 3,
        tpotP99: 28 + podIndex * 5,
        ttftP50: 40 + podIndex * 8,
        ttftP99: 90 + podIndex * 12,
        trafficSource: group.name,
      } satisfies K8sPodResource;
    }),
  );
  const pods = groupPods.map((pod) => ({ ...pod, yaml: buildPodYaml(pod) }));
  const serviceEntryGroups = services.reduce<Record<string, K8sServiceResource[]>>((acc, service) => {
    const serviceEntryId = service.serviceEntryId || `se-${service.cluster}-main`;
    acc[serviceEntryId] = [...(acc[serviceEntryId] || []), service];
    return acc;
  }, {});
  const serviceEntries = Object.entries(serviceEntryGroups).map(([serviceEntryId, clusterServices]) => {
    const cluster = clusterServices[0]?.cluster || 'default';
    const serviceEntry: K8sServiceEntryResource = {
      id: serviceEntryId,
      kind: 'ServiceEntry',
      name: getMockServiceEntryName(serviceEntryId, cluster),
      cluster,
      namespace: 'higress-system',
      hosts: [`${getMockServiceEntryName(serviceEntryId, cluster)}.cluster.local`],
      serviceIds: clusterServices.map((service) => service.id),
      endpoints: clusterServices.map((service) => {
        const spec = MODEL_OPS_RESOURCE_SPECS.find((item) => item.name === service.name);
        return { serviceId: service.id, address: `${service.name}.default.svc.cluster.local`, weight: spec?.weight || 0 };
      }),
      source: 'model-deploy',
      status: 'Running',
      yaml: '',
      createdAt: '2026-06-01 10:00',
      updatedAt: '2026-06-28 14:30',
    };
    return { ...serviceEntry, yaml: buildServiceEntryYaml(serviceEntry) };
  });

  const groupEntrySeNames = [
    { name: 'glm51-1-serving-se', cluster: 'st', hosts: ['glm51-1.model-serving.model.internal'] },
    { name: 'glm51-3-serving-se', cluster: 'st', hosts: ['glm51-3.model-serving.model.internal'] },
    { name: 'glm51-4-serving-se', cluster: 'st', hosts: ['glm51-4.model-serving.model.internal'] },
    { name: 'glm51-1-serving-se', cluster: 'beijing-prod', hosts: ['glm51-1.bd.model-serving.model.internal'] },
    { name: 'glm51-2-serving-se', cluster: 'beijing-prod', hosts: ['glm51-2.bd.model-serving.model.internal'] },
    { name: 'glm51-1-serving-se', cluster: 'guangzhou-test', hosts: ['glm51-1.bx.model-serving.model.internal'] },
  ];
  const extraServiceEntries: K8sServiceEntryResource[] = groupEntrySeNames.map((se, i) => ({
    id: `se-group-${se.cluster}-${i}`,
    kind: 'ServiceEntry' as const,
    name: se.name,
    cluster: se.cluster,
    namespace: 'higress-system',
    hosts: se.hosts,
    serviceIds: [],
    endpoints: [{ serviceId: '', address: `${se.name}.${se.cluster}.svc.cluster.local`, weight: 100 }],
    source: 'manual' as const,
    status: 'Running' as const,
    yaml: '',
    createdAt: '2026-06-15 08:00',
    updatedAt: '2026-06-28 14:30',
  }));
  const extraWithYaml = extraServiceEntries.map((entry) => ({ ...entry, yaml: buildServiceEntryYaml(entry) }));

  return { serviceEntries: [...serviceEntries, ...extraWithYaml], services, pods };
};

const readState = (): K8sResourceState => {
  if (typeof window === 'undefined') return createInitialK8sResourceState();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return createInitialK8sResourceState();
    const parsed = JSON.parse(raw) as K8sResourceState;
    if (!Array.isArray(parsed.serviceEntries) || !Array.isArray(parsed.services) || !Array.isArray(parsed.pods)) {
      return createInitialK8sResourceState();
    }
    if (parsed.pods.some((pod) => pod.node === undefined || pod.node === null)) {
      const next = createInitialK8sResourceState();
      window.localStorage.setItem(`${STORE_KEY}.seed`, MODEL_OPS_SEED);
      writeState(next);
      return next;
    }
    if (window.localStorage.getItem(`${STORE_KEY}.seed`) !== MODEL_OPS_SEED) {
      const next = createInitialK8sResourceState();
      window.localStorage.setItem(`${STORE_KEY}.seed`, MODEL_OPS_SEED);
      writeState(next);
      return next;
    }
    const normalizedServices = parsed.services.map((service) => (
      service.source === 'model-deploy'
        ? { ...service, cluster: resolveResourceCluster(service.name) }
        : service
    ));
    const serviceClusterMap = new Map(normalizedServices.map((service) => [service.id, service.cluster]));
    const now = Date.now();
    const pods = parsed.pods
      .filter((pod) => (
        pod.source !== 'manual'
        || !pod.expiresAt
        || Number.isNaN(Date.parse(pod.expiresAt))
        || Date.parse(pod.expiresAt) > now
      ))
      .map((pod) => (
        pod.source === 'model-deploy'
          ? { ...pod, cluster: serviceClusterMap.get(pod.serviceId || '') || resolveResourceCluster(pod.name) }
          : pod
      ));
    const services = normalizedServices.map((service) => ({
      ...service,
      podIds: pods
        .filter((pod) => pod.serviceId === service.id || service.podIds.includes(pod.id))
        .map((pod) => pod.id),
    }));
    const serviceEntries = parsed.serviceEntries.map((entry) => ({
      ...entry,
      cluster: entry.serviceIds
        .map((serviceId) => serviceClusterMap.get(serviceId))
        .find(Boolean) || entry.cluster,
    }));
    return { serviceEntries, services, pods };
  } catch {
    return createInitialK8sResourceState();
  }
};

const writeState = (state: K8sResourceState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(STORE_EVENT, { detail: state }));
};

export const useK8sResourceStore = () => {
  const [state, setState] = useState<K8sResourceState>(() => readState());

  useEffect(() => {
    const sync = () => setState(readState());
    window.addEventListener('storage', sync);
    window.addEventListener(STORE_EVENT, sync);
    if (!window.localStorage.getItem(STORE_KEY) || window.localStorage.getItem(`${STORE_KEY}.seed`) !== MODEL_OPS_SEED) {
      const next = createInitialK8sResourceState();
      window.localStorage.setItem(`${STORE_KEY}.seed`, MODEL_OPS_SEED);
      writeState(next);
      setState(next);
    }
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(STORE_EVENT, sync);
    };
  }, []);

  const update = useCallback((updater: (prev: K8sResourceState) => K8sResourceState) => {
    setState((prev) => {
      const next = updater(prev);
      writeState(next);
      return next;
    });
  }, []);

  const addService = useCallback((service: K8sServiceResource) => {
    update((prev) => {
      const serviceEntries = service.serviceEntryId
        ? prev.serviceEntries.map((entry) => {
          if (entry.id !== service.serviceEntryId) return entry;
          const serviceIds = entry.serviceIds.includes(service.id) ? entry.serviceIds : [...entry.serviceIds, service.id];
          const endpoints = entry.endpoints.some((endpoint) => endpoint.serviceId === service.id)
            ? entry.endpoints
            : [...entry.endpoints, { serviceId: service.id, address: `${service.name}.${service.namespace}.svc.cluster.local`, weight: 0 }];
          const nextEntry = { ...entry, serviceIds, endpoints, updatedAt: nowLabel() };
          return { ...nextEntry, yaml: buildServiceEntryYaml(nextEntry) };
        })
        : prev.serviceEntries;
      return { ...prev, serviceEntries, services: [service, ...prev.services.filter((item) => item.id !== service.id)] };
    });
  }, [update]);

  const addServiceEntry = useCallback((entry: K8sServiceEntryResource) => {
    update((prev) => ({
      ...prev,
      serviceEntries: [{ ...entry, yaml: entry.yaml || buildServiceEntryYaml(entry) }, ...prev.serviceEntries.filter((item) => item.id !== entry.id)],
    }));
  }, [update]);

  const addPod = useCallback((pod: K8sPodResource) => {
    update((prev) => {
      const services = pod.serviceId
        ? prev.services.map((service) => service.id === pod.serviceId && !service.podIds.includes(pod.id)
          ? { ...service, podIds: [...service.podIds, pod.id] }
          : service)
        : prev.services;
      return { ...prev, services, pods: [pod, ...prev.pods.filter((item) => item.id !== pod.id)] };
    });
  }, [update]);

  const removeServiceEntry = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      serviceEntries: prev.serviceEntries.filter((entry) => entry.id !== id),
      services: prev.services.map((service) => service.serviceEntryId === id ? { ...service, serviceEntryId: undefined } : service),
    }));
  }, [update]);

  const removeService = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      serviceEntries: prev.serviceEntries.map((entry) => {
        const nextEntry = {
          ...entry,
          serviceIds: entry.serviceIds.filter((serviceId) => serviceId !== id),
          endpoints: entry.endpoints.filter((endpoint) => endpoint.serviceId !== id),
          updatedAt: nowLabel(),
        };
        return { ...nextEntry, yaml: buildServiceEntryYaml(nextEntry) };
      }),
      services: prev.services.filter((service) => service.id !== id),
      pods: prev.pods.map((pod) => pod.serviceId === id ? { ...pod, serviceId: undefined } : pod),
    }));
  }, [update]);

  const reset = useCallback(() => {
    const next = createInitialK8sResourceState();
    writeState(next);
    window.localStorage.setItem(`${STORE_KEY}.seed`, MODEL_OPS_SEED);
    setState(next);
  }, []);

  return useMemo(
    () => ({ state, addService, addServiceEntry, addPod, removeServiceEntry, removeService, reset, update }),
    [addPod, addService, addServiceEntry, removeService, removeServiceEntry, reset, state, update],
  );
};

export const getServicePods = (state: K8sResourceState, service: K8sServiceResource) =>
  state.pods.filter((pod) => pod.serviceId === service.id || service.podIds.includes(pod.id));

export const createManualService = (input: {
  name: string;
  cluster: string;
  namespace: string;
  type: K8sServiceResource['type'];
  serviceEntryId?: string;
  podIds?: string[];
  port?: number;
}): K8sServiceResource => {
  const id = `svc-manual-${Date.now()}`;
  const service: K8sServiceResource = {
    id,
    kind: 'Service',
    name: input.name,
    cluster: input.cluster,
    namespace: input.namespace || 'default',
    clusterIP: `10.43.${Math.floor(Math.random() * 80) + 80}.${Math.floor(Math.random() * 180) + 20}`,
    type: input.type || 'ClusterIP',
    ports: [{ name: 'http', port: input.port || 8000, targetPort: input.port || 8000, protocol: 'TCP' }],
    selector: { app: input.name },
    labels: { app: input.name },
    podIds: input.podIds || [],
    serviceEntryId: input.serviceEntryId,
    source: 'manual',
    status: 'Draft',
    yaml: '',
    createdAt: nowLabel(),
  };
  return { ...service, yaml: buildServiceYaml(service) };
};

export const createManualServiceEntry = (input: {
  name: string;
  cluster: string;
  namespace?: string;
  hosts?: string[];
  yaml?: string;
}): K8sServiceEntryResource => {
  const entry: K8sServiceEntryResource = {
    id: `se-manual-${Date.now()}`,
    kind: 'ServiceEntry',
    name: input.name,
    cluster: input.cluster,
    namespace: input.namespace || 'higress-system',
    hosts: input.hosts && input.hosts.length > 0 ? input.hosts : [`${input.name}.cluster.local`],
    serviceIds: [],
    endpoints: [],
    source: input.yaml ? 'imported-yaml' : 'manual',
    status: 'Draft',
    yaml: input.yaml || '',
    createdAt: nowLabel(),
    updatedAt: nowLabel(),
  };
  return { ...entry, yaml: entry.yaml || buildServiceEntryYaml(entry) };
};

export const createManualPod = (input: {
  name: string;
  cluster: string;
  namespace?: string;
  owner: string;
  image: string;
  node?: string;
  collaborators?: string[];
  expiresIn?: string;
}): K8sPodResource => {
  const expiresIn = input.expiresIn || '24h';
  const expiresHours = Number.parseInt(expiresIn, 10);
  const pod: K8sPodResource = {
    id: `pod-dev-${Date.now()}`,
    kind: 'Pod',
    name: input.name,
    cluster: input.cluster,
    namespace: input.namespace || 'devpods',
    role: 'business',
    group: 'DevPod',
    ready: '0/1',
    status: 'Pending',
    restart: 0,
    image: input.image,
    podIP: '待分配',
    node: input.node || '自动调度',
    nodeGPU: '按模板申请',
    gpuUtil: 0,
    gpuVram: 0,
    age: '刚刚',
    owner: input.owner,
    collaborators: input.collaborators || [],
    expiresIn,
    expiresAt: new Date(Date.now() + (Number.isFinite(expiresHours) ? expiresHours : 24) * 60 * 60 * 1000).toISOString(),
    source: 'manual',
    yaml: '',
    load: 0,
  };
  return { ...pod, yaml: buildPodYaml(pod) };
};
