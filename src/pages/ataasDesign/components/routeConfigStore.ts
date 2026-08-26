import { useSyncExternalStore } from 'react';
import { buildRoutePluginConfigDefaults, type RoutePluginConfigValue } from './routePluginConfig';

export type RouteMatchType = 'prefix' | 'exact' | 'regex';
export type RouteAuthMode = 'none' | 'consumer' | 'anonymous';
export type RouteType = 'production' | 'mirror' | 'coordination';
export type ServiceEntryEndpoint = { address: string; weight: number };
export type SharedServiceEntryRecord = {
  id: string;
  name: string;
  cluster: string;
  namespace: string;
  host: string;
  port: string;
  endpoints: ServiceEntryEndpoint[];
};

// ServiceEntry → SVC 关系由画布拓扑统一派生，其他页面只消费该结果。
export const canvasServiceEntryEndpoints = (serviceEntry: string): ServiceEntryEndpoint[] => serviceEntry === 'night-traffic-2'
  ? [
      { address: `${serviceEntry}-svc.production.svc:8000`, weight: 70 },
      { address: `${serviceEntry}-canary-svc.production.svc:8000`, weight: 30 },
    ]
  : [{ address: `${serviceEntry}-svc.production.svc:8000`, weight: 100 }];

export type SharedRouteRecord = {
  id: string;
  name: string;
  routeType: RouteType;
  domain: string;
  matchType: RouteMatchType;
  path: string;
  service: string;
  serviceEntry: string;
  serviceEntryHost?: string;
  serviceEntryEndpoints?: ServiceEntryEndpoint[];
  auth: RouteAuthMode;
  enabled: boolean;
  methods: string[];
  timeout: number;
  retries: number;
  policies: string[];
  pluginConfigs: Record<string, Record<string, RoutePluginConfigValue>>;
};

const ingressToServiceEntry: Record<string, string> = {
  'img-limit-test': 'hash-test-se', 'test-4': 'hash-test-se', 'test-3': 'hash-test-se', 'test-2': 'hash-test-se',
  'test-1': 'test', 'st-mirror-st': 'st-mirror-st', 'night-traffic-2': 'night-traffic-2', 'night-traffic': 'night-traffic',
  'kimi-router-ha': 'kimi-router-ha-se', 'kimi-2.6': 'kimi-2.6', 'glm-test': 'glm-test', 'glm-jd': 'glm-jd',
  'glm-wangbo': 'glm-retry-se', 'glm-changting': 'glm-retry-se', 'glm-5.1': 'glm-retry-se',
  'glm-liaohuankang-2': 'glm-se', 'glm-liaohuankang-1': 'glm-se', 'glm-changting-2': 'glm-se', 'glm': 'glm-se',
};

export const DEFAULT_ROUTE_CONFIGS: SharedRouteRecord[] = Object.entries(ingressToServiceEntry).map(([name, serviceEntry], index) => ({
  id: `st1-route-${name}`,
  name,
  routeType: name.includes('mirror') ? 'mirror' : 'production',
  domain: 'ktaas.llmapi.approaching-ai.com',
  matchType: name.includes('test') ? 'prefix' : name === 'glm' ? 'exact' : 'prefix',
  path: name === 'glm' ? '/v1/chat/completions' : `/${name}`,
  service: `${serviceEntry}-svc.production.svc:8000`,
  serviceEntry,
  serviceEntryHost: `${serviceEntry}.cluster.local`,
  auth: index % 4 === 0 ? 'consumer' : 'none',
  enabled: name !== 'st-mirror-st',
  methods: ['POST'],
  timeout: name.includes('glm') || name.includes('kimi') ? 120 : 60,
  retries: index % 3,
  policies: index % 4 === 0 ? ['basic-auth', 'request-rewrite'] : index % 5 === 0 ? ['key-auth', 'ai-router'] : [],
  pluginConfigs: Object.fromEntries((index % 4 === 0 ? ['basic-auth', 'request-rewrite'] : index % 5 === 0 ? ['key-auth', 'ai-router'] : []).map((key) => [key, buildRoutePluginConfigDefaults(key)])),
}));

let snapshot = DEFAULT_ROUTE_CONFIGS;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const routeConfigStore = {
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
  create: (route: SharedRouteRecord) => { snapshot = [route, ...snapshot]; emit(); },
  update: (id: string, patch: Partial<SharedRouteRecord>) => { snapshot = snapshot.map((route) => route.id === id ? { ...route, ...patch } : route); emit(); },
  remove: (id: string) => { snapshot = snapshot.filter((route) => route.id !== id); emit(); },
};

export const useRouteConfigStore = () => useSyncExternalStore(routeConfigStore.subscribe, routeConfigStore.getSnapshot);

let serviceEntrySnapshot: SharedServiceEntryRecord[] = [];
const serviceEntryListeners = new Set<() => void>();
const emitServiceEntries = () => serviceEntryListeners.forEach((listener) => listener());

export const serviceEntryStore = {
  getSnapshot: () => serviceEntrySnapshot,
  subscribe: (listener: () => void) => { serviceEntryListeners.add(listener); return () => serviceEntryListeners.delete(listener); },
  create: (entry: SharedServiceEntryRecord) => { serviceEntrySnapshot = [entry, ...serviceEntrySnapshot.filter((item) => item.name !== entry.name)]; emitServiceEntries(); },
  update: (id: string, patch: Partial<SharedServiceEntryRecord>) => { serviceEntrySnapshot = serviceEntrySnapshot.map((entry) => entry.id === id ? { ...entry, ...patch } : entry); emitServiceEntries(); },
  remove: (id: string) => { serviceEntrySnapshot = serviceEntrySnapshot.filter((entry) => entry.id !== id); emitServiceEntries(); },
};

export const useServiceEntryStore = () => useSyncExternalStore(serviceEntryStore.subscribe, serviceEntryStore.getSnapshot);
