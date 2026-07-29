import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import kimiLogo from '../kimi-logo.svg';

export type ServiceStatus = 'running' | 'warning' | 'stopped';

export type TrafficTarget = {
  key: string;
  name: string;
  cluster: string;
  weight: number;
  health: 'healthy' | 'warning';
};

export type ModelService = {
  id: string;
  name: string;
  model: string;
  logo: string;
  mode: string;
  cluster: string;
  status: ServiceStatus;
  runtime: string;
  instanceCount: number;
  nodeCount: number;
  usage: string;
  ttft: number;
  tpot: number;
  errorRate: string;
  traffic: TrafficTarget[];
};

export const modelOpsServices: ModelService[] = [
  {
    id: 'svc-glm51-st',
    name: 'glm51-router-prod',
    model: 'GLM-5.1',
    logo: glmLogo,
    mode: 'PD 分离',
    cluster: 'st / shanghai-online',
    status: 'running',
    runtime: '25天 6小时',
    instanceCount: 9,
    nodeCount: 12,
    usage: '18.5K RPM',
    ttft: 14834,
    tpot: 20.7,
    errorRate: '0.03%',
    traffic: [
      { key: 'glm51-r1', name: 'glm51-router-1', cluster: 'st', weight: 70, health: 'healthy' },
      { key: 'glm51-r2', name: 'glm51-router-2', cluster: 'st', weight: 30, health: 'warning' },
    ],
  },
  {
    id: 'svc-glm52-yc',
    name: 'glm52-yichang-prod',
    model: 'GLM-5.2',
    logo: glmLogo,
    mode: '分布式部署',
    cluster: 'yc / yichang-prod',
    status: 'warning',
    runtime: '8天 11小时',
    instanceCount: 10,
    nodeCount: 10,
    usage: '9.7K RPM',
    ttft: 15572,
    tpot: 30.5,
    errorRate: '0.21%',
    traffic: [
      { key: 'glm52-r1', name: 'glm51-router-1', cluster: 'yc', weight: 41, health: 'healthy' },
      { key: 'glm52-r2', name: 'glm51-router-2', cluster: 'yc', weight: 45, health: 'healthy' },
      { key: 'glm52-r3', name: 'zhengzhou-higress', cluster: 'yc', weight: 14, health: 'warning' },
    ],
  },
  {
    id: 'svc-deepseek-v4-bj',
    name: 'deepseek-v4-prod',
    model: 'DeepSeek-V4',
    logo: deepseekLogo,
    mode: 'PD 分离',
    cluster: 'bj / beijing-a100-prod',
    status: 'warning',
    runtime: '6天 9小时',
    instanceCount: 6,
    nodeCount: 8,
    usage: '7.4K RPM',
    ttft: 9820,
    tpot: 24.8,
    errorRate: '0.08%',
    traffic: [
      { key: 'deepseek-v4-r1', name: 'deepseek-v4-router-1', cluster: 'bj', weight: 100, health: 'healthy' },
    ],
  },
  {
    id: 'svc-kimi-sh',
    name: 'kimi-k2-prod',
    model: 'KIMI-K2',
    logo: kimiLogo,
    mode: '单机部署',
    cluster: 'sh / shanghai-prod',
    status: 'running',
    runtime: '13天 2小时',
    instanceCount: 5,
    nodeCount: 5,
    usage: '4.8K RPM',
    ttft: 7220,
    tpot: 18.1,
    errorRate: '0.01%',
    traffic: [
      { key: 'kimi-k2-r1', name: 'kimi-k2-router-1', cluster: 'sh', weight: 100, health: 'healthy' },
    ],
  },
];
