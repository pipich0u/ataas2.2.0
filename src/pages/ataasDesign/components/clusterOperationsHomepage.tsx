import {
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, Drawer, Dropdown, Empty, Form, Input, message, Modal, Popover, Progress, Select, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowRightLeft, CircleAlert, CircuitBoard, Cpu, Database, FileText, HardDrive, MemoryStick, MonitorCog, Network, Search, Server, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CLUSTER_OPERATIONS_CLUSTER_DATA,
  CLUSTER_OPERATIONS_RESOURCE_TREE,
  initializeClusterOperations,
} from './clusterOperationsRuntime';
import ClusterResourceTables from './clusterResourceTables';
import {
  SupplierResourceCreateFlow,
  supplierResourceCreateMenuItems,
} from './supplierResourcesPage';
import type { SupplierResourceCreateKind } from './supplierResourcesPage';
import type { ClusterCreateTaskSummary } from './bareMetalClusterWizard';
import { K8sPodResource, useK8sResourceStore } from './k8sResourceStore';
import './clusterOperationsHomepage.less';

const OverviewCardHeader = ({
  icon,
  title,
  meta,
}: {
  icon?: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
}) => (
  <div className="overview-item-head">
    <div className="overview-item-heading">
      {icon ? <span className="overview-card-icon">{icon}</span> : null}
      <span className="overview-title">{title}</span>
    </div>
    {meta ? <span className="overview-head-info">{meta}</span> : null}
  </div>
);

type FaultData = {
  severity: 'critical' | 'amber';
  title: string;
  time: string;
  monitorCycle: string;
  monitorItem: string;
  abnormalPods: string[];
  detail: React.ReactNode;
};

const faultDetails: Record<string, FaultData> = {
  'router-pd-select': {
    severity: 'critical',
    title: '[并行郑州-2集群/GLM-5.2] router_pd_select 异常',
    time: '2026-07-21 16:14:04',
    monitorCycle: '每 2 分钟',
    monitorItem: 'router_pd_select',
    abnormalPods: ['glm51-router-2-router-0'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>阈值: 5000 ms</div>
        <div>glm51-router-2-router-0 (ip=10.25.110.45) (1 个超阈值, worst=5054 ms):</div>
        <div style={{ fontSize: 10, color: '#86909c', wordBreak: 'break-all' }}>rid=`d4624490...` started=`2026-07-21 08:11:21.948` dur=`5054ms`</div>
      </div>
    ),
  },
  'router-ttft': {
    severity: 'critical',
    title: '[并行郑州-1集群/GLM-5.2] router_ttft 异常',
    time: '2026-07-21 16:21:05',
    monitorCycle: '每 3 分钟',
    monitorItem: 'router_ttft',
    abnormalPods: ['glm51-router-1-router-0'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-router-1-router-0 (ip=10.25.110.35):</div>
        <div style={{ fontSize: 10, color: '#86909c' }}>ttft&gt;40s: 2次 (min/avg/max=49.28/51.02/52.76s)</div>
      </div>
    ),
  },
  'sglang-pod-log': {
    severity: 'critical',
    title: '[ST-YC 商汤-盐城集群/GLM-5.2] sglang_pod_log 异常',
    time: '2026-07-21 12:15:39',
    monitorCycle: '每 3 分钟',
    monitorItem: 'sglang_pod_log',
    abnormalPods: ['glm51-router-7-router-0', 'glm51-workers-7-decode-0', 'glm51-workers-7-prefill-0', 'glm51-workers-7-prefill-1', 'glm51-workers-7-prefill-2', 'glm51-workers-7-prefill-3'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-router-7-router-0 (ip=10.120.64.137): <span style={{ color: '#f53f3f' }}>KVTransferError</span></div>
        <div>glm51-workers-7-decode-0 (ip=10.120.64.137): <span style={{ color: '#f53f3f' }}>KVTransferError</span></div>
        <div style={{ fontSize: 10, color: '#86909c', marginTop: 4 }}>6 个异常 Pods，涉及 KVTransferError 和连接错误</div>
      </div>
    ),
  },
  'gpu-memory': {
    severity: 'amber',
    title: '[ST-YC 商汤-盐城集群/GLM-5.2] gpu_memory 异常',
    time: '2026-07-21 13:09:00',
    monitorCycle: '每分钟',
    monitorItem: 'gpu_memory',
    abnormalPods: ['10.120.64.16'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>阈值: low=180000 MiB / high_prefill=270000 MiB / high_decode=274500 MiB</div>
        <div>10.120.64.16: GPU 3 当前 271202 MiB / 275040 MiB (98%) — 显存占用过高</div>
      </div>
    ),
  },
  'prefill-load': {
    severity: 'amber',
    title: '[ST-YC 商汤-盐城集群/GLM-5.2] prefill_load 异常',
    time: '2026-07-21 16:15:26',
    monitorCycle: '每分钟',
    monitorItem: 'prefill_load',
    abnormalPods: ['glm51-workers-7-prefill-1', 'glm51-workers-7-prefill-3'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-workers-7-prefill-1 (ip=10.120.64.130): prefill_prealloc_queue_reqs=22 (阈值 20)</div>
        <div>glm51-workers-7-prefill-3 (ip=10.120.64.16): prefill_prealloc_queue_reqs=22 (阈值 20)</div>
      </div>
    ),
  },
  'decoder-load': {
    severity: 'amber',
    title: '[并行郑州-2集群/GLM-5.2] decoder_load 异常',
    time: '2026-07-21 15:30:12',
    monitorCycle: '每分钟',
    monitorItem: 'decoder_load',
    abnormalPods: ['glm51-workers-2-decode-1'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-workers-2-decode-1 (ip=10.25.110.50): decode_queue_reqs=18 (阈值 15)</div>
      </div>
    ),
  },
  'node-down': {
    severity: 'critical',
    title: '[并行郑州-1集群/GLM-5.2] node_status 异常',
    time: '2026-07-21 11:22:08',
    monitorCycle: '每分钟',
    monitorItem: 'node_status',
    abnormalPods: ['gpu-node-07'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>gpu-node-07 (ip=10.24.18.107): Kubelet 3 分钟未上报，NotReady</div>
      </div>
    ),
  },
  'api-latency': {
    severity: 'amber',
    title: '[ST-YC 商汤-盐城集群/GLM-5.2] api_latency 异常',
    time: '2026-07-21 14:45:33',
    monitorCycle: '每 2 分钟',
    monitorItem: 'api_latency',
    abnormalPods: ['glm51-router-7-router-0'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-router-7-router-0: p99 延迟 3200ms (阈值 2000ms)</div>
      </div>
    ),
  },
  'gpu-util': {
    severity: 'amber',
    title: '[并行郑州-2集群/GLM-5.2] gpu_util 异常',
    time: '2026-07-21 10:30:18',
    monitorCycle: '每 5 分钟',
    monitorItem: 'gpu_util',
    abnormalPods: ['glm51-workers-2-decode-2'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>glm51-workers-2-decode-2: GPU 利用率 12% (阈值 &lt; 20%)，低于预期</div>
      </div>
    ),
  },
  'disk-pressure': {
    severity: 'critical',
    title: '[并行郑州-1集群/GLM-5.2] gpu-node-12 DiskPressure',
    time: '2026-07-21 09:48:22',
    monitorCycle: '每分钟',
    monitorItem: 'node_disk_pressure',
    abnormalPods: ['gpu-node-12'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>gpu-node-12 (ip=10.24.18.112): 本地盘使用率 92% (阈值 85%)</div>
        <div style={{ fontSize: 10, color: '#86909c', marginTop: 4 }}>影响 88 个 Pods 的本地盘读写</div>
      </div>
    ),
  },
  'network-flap': {
    severity: 'amber',
    title: '[ST-YC 商汤-盐城集群/gpu-node-03] network_interface 异常',
    time: '2026-07-21 08:12:55',
    monitorCycle: '每 2 分钟',
    monitorItem: 'network_interface_flap',
    abnormalPods: ['gpu-node-03'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>gpu-node-03 (ip=10.120.64.19): bond0 接口 flap 计数 47 次/小时 (阈值 10)</div>
      </div>
    ),
  },
  'pod-crashloop': {
    severity: 'amber',
    title: '[并行郑州-1集群/payment-api] pod_crashloop 异常',
    time: '2026-07-21 07:35:10',
    monitorCycle: '每分钟',
    monitorItem: 'pod_crashloop_backoff',
    abnormalPods: ['payment-api-7d8f-2kv9f', 'payment-api-7d8f-7sk2h'],
    detail: (
      <div style={{ fontSize: 11, lineHeight: 1.6 }}>
        <div>payment-api-7d8f-2kv9f: CrashLoopBackOff (重启 7 次)</div>
        <div>payment-api-7d8f-7sk2h: CrashLoopBackOff (重启 5 次)</div>
        <div style={{ fontSize: 10, color: '#86909c', marginTop: 4 }}>镜像 payment-api:v2.4.1 · 疑似配置错误</div>
      </div>
    ),
  },
};

type HierarchyScope = {
  type: 'provider' | 'datacenter';
  provider: string;
  datacenter?: string;
};

type HierarchyClusterRow = {
  key: string;
  name: string;
  datacenter: string;
  location: string;
  k8s: string;
  nodes: number;
  normal: number;
  abnormal: number;
  alerts: {
    critical: number;
    warning: number;
  };
  resources: {
    cpuTotal: number;
    cpuUsed: number;
    gpuTotal: number;
    gpuUtilization: number;
    vramTotal: number;
    vramUsed: number;
    memoryTotal: number;
    memoryUsed: number;
    storageTotal: number;
    storageUsed: number;
  };
};

const HierarchyOverviewPage = ({
  scope,
  onSelectDataCenter,
  onSelectCluster,
}: {
  scope: HierarchyScope | null;
  onSelectDataCenter: (provider: string, datacenter: string) => void;
  onSelectCluster: (clusterKey: string) => void;
}) => {
  if (!scope) return null;

  const provider = CLUSTER_OPERATIONS_RESOURCE_TREE.find((item) => item.name === scope.provider);
  const datacenters = provider?.dcs.filter((item) => scope.type === 'provider' || item.name === scope.datacenter) || [];
  const clusters = datacenters.flatMap((datacenter) => datacenter.clusters.map((cluster) => ({
    ...cluster,
    datacenter: datacenter.name,
  })));
  const clusterRows: HierarchyClusterRow[] = clusters.map((cluster) => {
    const detail = CLUSTER_OPERATIONS_CLUSTER_DATA[cluster.key];
    return {
      key: cluster.key,
      name: detail?.name || cluster.name,
      datacenter: cluster.datacenter,
      location: detail?.location || cluster.meta,
      k8s: detail?.k8s || '—',
      nodes: Number(detail?.nodes || 0),
      normal: Number(detail?.normal || 0),
      abnormal: Number(detail?.abnormal || 0),
      alerts: detail?.alerts || { critical: 0, warning: 0 },
      resources: detail?.resources || {
        cpuTotal: 0,
        cpuUsed: 0,
        gpuTotal: 0,
        gpuUtilization: 0,
        vramTotal: 0,
        vramUsed: 0,
        memoryTotal: 0,
        memoryUsed: 0,
        storageTotal: 0,
        storageUsed: 0,
      },
    };
  });

  const nodeTotal = clusterRows.reduce((sum, row) => sum + row.nodes, 0);
  const normalTotal = clusterRows.reduce((sum, row) => sum + row.normal, 0);
  const abnormalTotal = clusterRows.reduce((sum, row) => sum + row.abnormal, 0);
  const normalRate = nodeTotal > 0 ? (normalTotal / nodeTotal) * 100 : 0;
  const normalRateLabel = nodeTotal > 0 ? `${normalRate.toFixed(1)}%` : '—';
  const aggregateResources = (rows: HierarchyClusterRow[]) => {
    const totals = rows.reduce((summary, row) => ({
      cpuTotal: summary.cpuTotal + row.resources.cpuTotal,
      cpuUsed: summary.cpuUsed + row.resources.cpuUsed,
      gpuTotal: summary.gpuTotal + row.resources.gpuTotal,
      gpuWeightedUtilization: summary.gpuWeightedUtilization + (
        row.resources.gpuUtilization * row.resources.gpuTotal
      ),
      vramTotal: summary.vramTotal + row.resources.vramTotal,
      vramUsed: summary.vramUsed + row.resources.vramUsed,
      memoryTotal: summary.memoryTotal + row.resources.memoryTotal,
      memoryUsed: summary.memoryUsed + row.resources.memoryUsed,
      storageTotal: summary.storageTotal + row.resources.storageTotal,
      storageUsed: summary.storageUsed + row.resources.storageUsed,
    }), {
      cpuTotal: 0,
      cpuUsed: 0,
      gpuTotal: 0,
      gpuWeightedUtilization: 0,
      vramTotal: 0,
      vramUsed: 0,
      memoryTotal: 0,
      memoryUsed: 0,
      storageTotal: 0,
      storageUsed: 0,
    });
    return {
      ...totals,
      gpuUtilization: totals.gpuTotal > 0 ? totals.gpuWeightedUtilization / totals.gpuTotal : 0,
    };
  };
  const resources = aggregateResources(clusterRows);
  const percent = (used: number, total: number) => (total > 0 ? (used / total) * 100 : 0);
  const cpuUsage = percent(resources.cpuUsed, resources.cpuTotal);
  const vramUsage = percent(resources.vramUsed, resources.vramTotal);
  const memoryUsage = percent(resources.memoryUsed, resources.memoryTotal);
  const storageUsage = percent(resources.storageUsed, resources.storageTotal);
  const alertCriticalTotal = clusterRows.reduce((sum, row) => sum + row.alerts.critical, 0);
  const alertWarningTotal = clusterRows.reduce((sum, row) => sum + row.alerts.warning, 0);
  const alertTotal = alertCriticalTotal + alertWarningTotal;
  const formatTib = (value: number) => {
    if (value === 0) return '0';
    if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
    return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };
  const resourceCards = [
    {
      key: 'cpu',
      title: 'CPU',
      icon: <Cpu />,
      usage: cpuUsage,
      total: `${resources.cpuTotal.toLocaleString()} Core`,
      facts: [
        ['已使用', `${resources.cpuUsed.toLocaleString()} Core`],
        ['可用', `${Math.max(0, resources.cpuTotal - resources.cpuUsed).toLocaleString()} Core`],
      ],
    },
    {
      key: 'gpu',
      title: 'GPU',
      icon: <MonitorCog />,
      usage: resources.gpuUtilization,
      total: `${resources.gpuTotal.toLocaleString()} 卡`,
      facts: [
        ['平均利用率', `${resources.gpuUtilization.toFixed(1)}%`],
        ['覆盖节点', `${nodeTotal} 个`],
      ],
    },
    {
      key: 'vram',
      title: '显存',
      icon: <CircuitBoard />,
      usage: vramUsage,
      total: `${formatTib(resources.vramTotal)} TiB`,
      facts: [
        ['已使用', `${formatTib(resources.vramUsed)} TiB`],
        ['可用', `${formatTib(Math.max(0, resources.vramTotal - resources.vramUsed))} TiB`],
      ],
    },
    {
      key: 'memory',
      title: '内存',
      icon: <MemoryStick />,
      usage: memoryUsage,
      total: `${formatTib(resources.memoryTotal)} TiB`,
      facts: [
        ['已使用', `${formatTib(resources.memoryUsed)} TiB`],
        ['可用', `${formatTib(Math.max(0, resources.memoryTotal - resources.memoryUsed))} TiB`],
      ],
    },
    {
      key: 'storage',
      title: '物理盘容量',
      icon: <HardDrive />,
      usage: storageUsage,
      total: `${formatTib(resources.storageTotal)} TiB`,
      facts: [
        ['已使用', `${formatTib(resources.storageUsed)} TiB`],
        ['可用', `${formatTib(Math.max(0, resources.storageTotal - resources.storageUsed))} TiB`],
      ],
    },
  ];

  const childRows = scope.type === 'provider'
    ? datacenters.map((datacenter) => {
      const rows = clusterRows.filter((row) => row.datacenter === datacenter.name);
      return {
        key: datacenter.name,
        name: datacenter.name,
        meta: `${rows.length} 个集群`,
        clusters: rows.length,
        nodes: rows.reduce((sum, row) => sum + row.nodes, 0),
        abnormal: rows.reduce((sum, row) => sum + row.abnormal, 0),
        alerts: {
          critical: rows.reduce((sum, row) => sum + row.alerts.critical, 0),
          warning: rows.reduce((sum, row) => sum + row.alerts.warning, 0),
        },
        resources: aggregateResources(rows),
      };
    })
    : clusterRows.map((row) => ({
      key: row.key,
      name: row.name,
      meta: row.location,
      clusters: 1,
      nodes: row.nodes,
      abnormal: row.abnormal,
      alerts: row.alerts,
      resources: {
        ...row.resources,
        gpuWeightedUtilization: row.resources.gpuUtilization * row.resources.gpuTotal,
        gpuUtilization: row.resources.gpuUtilization,
      },
    }));
  const clusterAlertRows = clusterRows
    .map((row) => ({
      key: row.key,
      name: row.name,
      datacenter: row.datacenter,
      location: row.location,
      critical: row.alerts.critical,
      warning: row.alerts.warning,
      total: row.alerts.critical + row.alerts.warning,
    }))
    .filter((row) => row.total > 0)
    .sort((left, right) => (
      right.critical - left.critical || right.total - left.total
    ));

  const title = scope.type === 'provider' ? scope.provider : scope.datacenter || '';
  const description = scope.type === 'provider'
    ? `覆盖 ${datacenters.length} 个数据中心、${clusterRows.length} 个集群的资源运行情况`
    : `所属供应商 ${scope.provider}，当前纳管 ${clusterRows.length} 个集群`;

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6951FF' }, components: { Table: { headerBg: '#F7F8FA' } } }}>
      <section className="hierarchy-overview-view">
        <header className="hierarchy-overview-head">
          <div className="hierarchy-overview-title">
            <span>{scope.type === 'provider' ? '供应商总览' : '数据中心总览'}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="hierarchy-overview-stats">
            {scope.type === 'provider' && (
              <span><small>数据中心</small><strong>{datacenters.length}</strong></span>
            )}
            {scope.type === 'datacenter' && (
              <span><small>供应商</small><strong className="is-text">{scope.provider}</strong></span>
            )}
            <span><small>集群</small><strong>{clusterRows.length}</strong></span>
            <span><small>纳管节点</small><strong>{nodeTotal}</strong></span>
            <span><small>异常节点</small><strong className={abnormalTotal > 0 ? 'is-warning' : 'is-normal'}>{abnormalTotal}</strong></span>
          </div>
        </header>

        <section className="hierarchy-capacity-overview" aria-label="基础资源使用情况">
          <div className="hierarchy-section-title">
            <strong>基础资源</strong>
            <span>{normalRateLabel} 节点运行正常</span>
          </div>
          <div className="hierarchy-capacity-grid">
            {resourceCards.map((card) => (
              <div key={card.key} className={`hierarchy-capacity-item is-${card.key}`}>
                <div className="hierarchy-capacity-title">{card.icon}<span>{card.title}</span></div>
                <div className="hierarchy-capacity-body">
                  <div
                    className="hierarchy-capacity-ring"
                    style={{
                      background: `conic-gradient(var(--hierarchy-capacity-color) 0 ${Math.min(100, card.usage)}%, #eef0f4 ${Math.min(100, card.usage)}% 100%)`,
                    }}
                  >
                    <span><strong>{card.usage.toFixed(1)}%</strong><small>使用率</small></span>
                  </div>
                  <div className="hierarchy-capacity-copy">
                    <div className="hierarchy-capacity-total"><small>总量</small><b>{card.total}</b></div>
                    <div className="hierarchy-capacity-facts">
                      {card.facts.map(([label, value]) => (
                        <span key={label}><small>{label}</small><b>{value}</b></span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="hierarchy-alert-overview" aria-label="告警概览">
          <div className="hierarchy-alert-head">
            <div className="hierarchy-alert-title">
              <WarningOutlined />
              <span>告警分布</span>
            </div>
            <span>共 {alertTotal} 条 · 涉及 {clusterAlertRows.length} 个集群</span>
          </div>
          <div className="hierarchy-alert-body">
            <div className="hierarchy-alert-summary">
            <div className="hierarchy-alert-total">
              <strong className={alertTotal > 0 ? 'is-warning' : ''}>{alertTotal}</strong>
              <span>当前范围告警总数</span>
            </div>
            <div className="hierarchy-alert-distribution" aria-label={`严重告警 ${alertCriticalTotal} 条，普通告警 ${alertWarningTotal} 条`}>
              <i
                className="is-critical"
                style={{ width: `${alertTotal > 0 ? (alertCriticalTotal / alertTotal) * 100 : 0}%` }}
              />
              <i
                className="is-warning"
                style={{ width: `${alertTotal > 0 ? (alertWarningTotal / alertTotal) * 100 : 0}%` }}
              />
            </div>
            <div className="hierarchy-alert-levels">
              <span><i className="is-critical" /><small>严重告警</small><b>{alertCriticalTotal}</b></span>
              <span><i className="is-warning" /><small>普通告警</small><b>{alertWarningTotal}</b></span>
              <span><i className="is-affected" /><small>涉及集群</small><b>{clusterAlertRows.length}</b></span>
            </div>
          </div>
          <div className="hierarchy-alert-clusters">
            <div className="hierarchy-section-title">
              <strong>各集群告警</strong>
              <span>严重告警优先</span>
            </div>
            <div className="hierarchy-alert-cluster-list">
              {clusterAlertRows.length > 0 ? clusterAlertRows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  onClick={() => onSelectCluster(row.key)}
                >
                  <span>
                    <strong>{row.name}</strong>
                    <small>{scope.type === 'provider' ? row.datacenter : row.location}</small>
                  </span>
                  <span className="hierarchy-alert-cluster-track">
                    <i
                      className="is-critical"
                      style={{ width: `${row.total > 0 ? (row.critical / row.total) * 100 : 0}%` }}
                    />
                    <i
                      className="is-warning"
                      style={{ width: `${row.total > 0 ? (row.warning / row.total) * 100 : 0}%` }}
                    />
                  </span>
                  <span><small>严重</small><b className={row.critical > 0 ? 'is-critical' : ''}>{row.critical}</b></span>
                  <span><small>普通</small><b className={row.warning > 0 ? 'is-warning' : ''}>{row.warning}</b></span>
                  <span><small>总数</small><b>{row.total}</b></span>
                  <em>进入集群总览 →</em>
                </button>
              )) : (
                <div className="hierarchy-alert-empty">当前范围暂无告警</div>
              )}
            </div>
          </div>
          </div>
        </section>

        <section className="hierarchy-child-resource-section">
          <div className="hierarchy-section-title">
            <strong>{scope.type === 'provider' ? '数据中心资源' : '集群资源'}</strong>
            <span>
              {scope.type === 'provider'
                ? `共 ${datacenters.length} 个数据中心`
                : `共 ${clusterRows.length} 个集群`}
            </span>
          </div>
          <div className="hierarchy-child-resource-table">
            <div className="hierarchy-child-resource-head">
              <span>{scope.type === 'provider' ? '数据中心' : '集群'}</span>
              <span>集群 / 节点</span>
              <span>CPU</span>
              <span>GPU</span>
              <span>显存</span>
              <span>内存</span>
              <span>物理盘容量</span>
            </div>
            {childRows.map((row) => {
              const rowCpuUsage = percent(row.resources.cpuUsed, row.resources.cpuTotal);
              const rowVramUsage = percent(row.resources.vramUsed, row.resources.vramTotal);
              const rowMemoryUsage = percent(row.resources.memoryUsed, row.resources.memoryTotal);
              const rowStorageUsage = percent(row.resources.storageUsed, row.resources.storageTotal);
              return (
                <div key={row.key} className="hierarchy-child-resource-row">
                  <div className="hierarchy-child-name">
                    {scope.type === 'provider' ? (
                      <button type="button" onClick={() => onSelectDataCenter(scope.provider, row.name)}>
                        <strong>{row.name}</strong>
                        <span>{row.meta}</span>
                      </button>
                    ) : (
                      <>
                        <strong>{row.name}</strong>
                        <span>{row.meta}</span>
                      </>
                    )}
                  </div>
                  <div className="hierarchy-child-status">
                    <span><small>集群</small><b>{row.clusters}</b></span>
                    <span><small>节点</small><b>{row.nodes}</b></span>
                    <span className={row.abnormal > 0 ? 'is-warning' : ''}>
                      <small>异常节点</small><b>{row.abnormal}</b>
                    </span>
                  </div>
                  <div className="hierarchy-child-metric">
                    <span><b>{rowCpuUsage.toFixed(1)}%</b><small>{row.resources.cpuTotal} Core</small></span>
                    <i><em style={{ width: `${Math.min(100, rowCpuUsage)}%` }} /></i>
                  </div>
                  <div className="hierarchy-child-metric">
                    <span><b>{row.resources.gpuUtilization.toFixed(1)}%</b><small>{row.resources.gpuTotal} 卡</small></span>
                    <i><em style={{ width: `${Math.min(100, row.resources.gpuUtilization)}%` }} /></i>
                  </div>
                  <div className="hierarchy-child-metric">
                    <span><b>{rowVramUsage.toFixed(1)}%</b><small>{formatTib(row.resources.vramTotal)} TiB</small></span>
                    <i><em style={{ width: `${Math.min(100, rowVramUsage)}%` }} /></i>
                  </div>
                  <div className="hierarchy-child-metric">
                    <span><b>{rowMemoryUsage.toFixed(1)}%</b><small>{formatTib(row.resources.memoryTotal)} TiB</small></span>
                    <i><em style={{ width: `${Math.min(100, rowMemoryUsage)}%` }} /></i>
                  </div>
                  <div className="hierarchy-child-metric">
                    <span><b>{rowStorageUsage.toFixed(1)}%</b><small>{formatTib(row.resources.storageTotal)} TiB</small></span>
                    <i><em style={{ width: `${Math.min(100, rowStorageUsage)}%` }} /></i>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </ConfigProvider>
  );
};

type ClusterProvisionTask = ClusterCreateTaskSummary & {
  key: string;
  startedAt: number;
};

const CLUSTER_TASK_STORAGE_KEY = 'ataas.cluster-provision-tasks.v1';
const CLUSTER_WIZARD_RESUME_KEY = 'ataas.cluster-wizard.resume';

type ClusterTaskMilestone = {
  threshold: number;
  offset: number;
  stage: string;
  detail: string;
};

const clusterTaskMilestones = [
  { threshold: 8, offset: 0, stage: '创建部署任务', detail: '任务已提交，开始生成节点部署计划。' },
  { threshold: 18, offset: 2200, stage: 'SSH 检查', detail: '目标机器 SSH 连通性与 sudo 权限校验通过。' },
  { threshold: 34, offset: 5600, stage: '软件包下发', detail: 'Kubernetes 离线软件包开始分发到全部节点。' },
  { threshold: 52, offset: 9800, stage: '组件安装', detail: 'containerd、kubelet、kubeadm 与 CNI 安装完成。' },
  { threshold: 70, offset: 13800, stage: '初始化控制面', detail: 'Master 控制面初始化并生成 Worker 加入凭据。' },
  { threshold: 86, offset: 17600, stage: '节点加入', detail: 'Worker 节点正在加入集群并等待 Ready。' },
  { threshold: 100, offset: 22200, stage: '创建完成', detail: '全部节点 Ready，集群资源已同步到算力中心。' },
] satisfies ClusterTaskMilestone[];

const tokenTaskMilestones = [
  { threshold: 100, offset: 0, stage: '接入完成', detail: '已使用 API Server 和 Token 建立访问配置。' },
] satisfies ClusterTaskMilestone[];

const getClusterTaskMilestones = (task: ClusterProvisionTask) => (
  task.accessMode === 'token' ? tokenTaskMilestones : clusterTaskMilestones
);

const loadClusterProvisionTasks = (): ClusterProvisionTask[] => {
  try {
    return JSON.parse(window.localStorage.getItem(CLUSTER_TASK_STORAGE_KEY) || '[]') as ClusterProvisionTask[];
  } catch {
    return [];
  }
};

const getClusterTaskProgress = (task: ClusterProvisionTask, now: number) => (
  task.accessMode === 'token'
    ? 100
    : Math.min(100, 8 + Math.max(0, Math.floor((now - task.startedAt) / 240)))
);

const formatTaskTime = (timestamp: number) => new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}).format(new Date(timestamp));

const ClusterOperationsHomepage = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hierarchyScope, setHierarchyScope] = useState<HierarchyScope | null>(null);
  const [resourceCreateKind, setResourceCreateKind] = useState<SupplierResourceCreateKind | null>(null);
  const [selectedClusterKey, setSelectedClusterKey] = useState('ST1');
  const [clusterTasks, setClusterTasks] = useState<ClusterProvisionTask[]>(loadClusterProvisionTasks);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);
  const [logTaskKey, setLogTaskKey] = useState<string | null>(null);
  const [taskClock, setTaskClock] = useState(Date.now());

  useEffect(() => {
    const handleHierarchyScopeChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail?.type === 'provider') {
        setHierarchyScope({ type: 'provider', provider: detail.provider });
      } else if (detail?.type === 'datacenter') {
        setHierarchyScope({
          type: 'datacenter',
          provider: detail.provider,
          datacenter: detail.datacenter,
        });
      } else if (detail?.type === 'cluster') {
        setSelectedClusterKey(detail.key || 'ST1');
        setHierarchyScope(null);
      }
    };

    window.addEventListener('ataas:hierarchy-scope-change', handleHierarchyScopeChange);
    if (window.sessionStorage.getItem(CLUSTER_WIZARD_RESUME_KEY) === '1') {
      window.sessionStorage.removeItem(CLUSTER_WIZARD_RESUME_KEY);
      setResourceCreateKind('cluster');
    }
    if (rootRef.current) initializeClusterOperations(rootRef.current);
    return () => window.removeEventListener('ataas:hierarchy-scope-change', handleHierarchyScopeChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CLUSTER_TASK_STORAGE_KEY, JSON.stringify(clusterTasks));
  }, [clusterTasks]);

  useEffect(() => {
    if (!clusterTasks.some((task) => getClusterTaskProgress(task, taskClock) < 100)) return undefined;
    const timer = window.setInterval(() => setTaskClock(Date.now()), 800);
    return () => window.clearInterval(timer);
  }, [clusterTasks, taskClock]);

  const addClusterTask = (summary: ClusterCreateTaskSummary) => {
    const task: ClusterProvisionTask = {
      ...summary,
      key: `CLUSTER-${Date.now()}`,
      startedAt: Date.now(),
    };
    setClusterTasks((current) => [task, ...current]);
    setTaskClock(Date.now());
  };

  const runningTaskCount = clusterTasks.filter((task) => getClusterTaskProgress(task, taskClock) < 100).length;
  const selectedLogTask = clusterTasks.find((task) => task.key === logTaskKey) || null;

  const focusNodeIssue = (kind: 'node' | 'network' | 'disk') => {
    rootRef.current?.querySelector<HTMLElement>('.module-tab[data-view="nodes"]')?.click();
    window.dispatchEvent(new CustomEvent('ataas:cluster-node-focus', {
      detail: { kind, nodeKey: 'n4' },
    }));
  };

  const selectDataCenter = (provider: string, datacenter: string) => {
    const heads = Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>('.tree-dc-head') || [],
    );
    const target = heads.find((head) => (
      head.dataset.providerName === provider
      && head.dataset.datacenterName === datacenter
    ));
    if (target) {
      target.click();
      return;
    }
    setHierarchyScope({ type: 'datacenter', provider, datacenter });
  };

  const selectCluster = (clusterKey: string) => {
    const target = rootRef.current?.querySelector<HTMLElement>(
      `.tree-cluster-link[data-cluster-key="${clusterKey}"]`,
    );
    target?.click();
  };

  return (
    <div ref={rootRef} className={`cluster-operations-homepage${hierarchyScope ? ' hierarchy-mode' : ''}`}>
    <aside className="resource-tree">
      <div className="tree-header">
        <div className="tree-header-actions">
          <Button
            className="resource-tree-task-button"
            onClick={() => setTaskDrawerOpen(true)}
          >
            任务进度
            {runningTaskCount > 0 && <b>{runningTaskCount}</b>}
          </Button>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: supplierResourceCreateMenuItems,
              onClick: ({ key }) => setResourceCreateKind(key as SupplierResourceCreateKind),
            }}
          >
            <Button
              type="primary"
              className="resource-tree-create-button ataas-page-create-button"
              icon={<PlusOutlined />}
              aria-label="新增算力中心资源"
            >
              新增
            </Button>
          </Dropdown>
        </div>
      </div>
      <div className="tree-controls">
        <label className="tree-search">
          <SearchOutlined />
          <input id="resourceTreeSearch" type="search" placeholder="搜索供应商、数据中心、集群" aria-label="搜索算力中心资源" />
        </label>
      </div>
      <div className="tree-scroll" id="resourceTreeContainer">
      </div>
    </aside>

    <section className="workspace">

      <main className="content">
        <HierarchyOverviewPage
          scope={hierarchyScope}
          onSelectDataCenter={selectDataCenter}
          onSelectCluster={selectCluster}
        />
        <div className="cluster-scope-view">
        <div className="page-title-row">
          <div>
            <div className="page-title" id="clusterTitle">gpu-prod-01</div>
            <div className="page-title-line">
              <span className="cluster-running">正常</span>
              <span className="k8s-badge" id="clusterK8sBadge">Kubernetes v1.36.2</span>
            </div>
          </div>
          <div className="page-actions">
          </div>
        </div>

        <nav className="module-nav">
          <div className="module-tab" data-view="overview">总览</div>
          <div className="module-tab active" data-view="nodes" title="Kubernetes Node对象及Ready、压力和调度状态">节点</div>
          <div className="module-tab" data-view="services" title="展示后端运行在上海资源段的Services；ServiceEntry为集群级配置">Services</div>
	        </nav>

        <div className="overview-view">
        <div className="overview-card-grid">

            <div className="overview-item overview-fault">
              <div className="overview-fault-head">
                <div className="overview-item-heading">
                  <span className="overview-card-icon"><WarningOutlined /></span>
                  <span className="overview-title">告警</span>
                </div>
                <button
                  type="button"
                  className="overview-fault-link"
                  onClick={() => window.dispatchEvent(new CustomEvent('ataas:navigate', { detail: { tab: 'alerts' } }))}
                >
                  查看全部
                </button>
              </div>
              <div className="overview-fault-stats">
                <div className="overview-fault-stat level-critical">
                  <span className="overview-fault-stat-value">5</span>
                  <span className="overview-fault-stat-label">严重告警</span>
                </div>
                <div className="overview-fault-stat level-warning">
                  <span className="overview-fault-stat-value">7</span>
                  <span className="overview-fault-stat-label">普通</span>
                </div>
                <div className="overview-fault-stat level-info">
                  <span className="overview-fault-stat-value">0</span>
                  <span className="overview-fault-stat-label">轻微</span>
                </div>
              </div>
              <div className="overview-fault-list">
                {Object.entries(faultDetails).map(([key, fault]) => (
                  <Tooltip key={key} title={
                    <div style={{ maxWidth: 480, color: '#1d2129' }}>
                      <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 12 }}>{fault.title}</div>
                      <div style={{ fontSize: 11, lineHeight: 1.7 }}>
                        <div>时间: {fault.time}</div>
                        <div>监控周期: {fault.monitorCycle}</div>
                        <div>监控项: 【{fault.monitorItem}】</div>
                        <div>异常 Pods ({fault.abnormalPods.length}): 【{fault.abnormalPods.join('】, 【')}】</div>
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e5e6eb' }}>
                          {fault.detail}
                        </div>
                      </div>
                    </div>
                  } styles={{ root: { maxWidth: 'none' } }} color="#fff">
                    <div className="overview-fault-row">
                      <i className={`overview-fault-dot ${fault.severity === 'critical' ? 'is-critical' : 'is-warning'}`} />
                      <span className="overview-fault-title">{fault.title}</span>
                      <span className="overview-fault-context">{fault.time}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            <section className="resource-canvas resource-canvas-refined" aria-label="资源运行">
              <div className="resource-node-summary">
                <div className="resource-visual-title module-title"><Server className="module-line-icon" /><span>节点</span></div>
                <div className="node-summary-body">
                  <div className="node-summary-primary">
                    <span><strong id="overviewNodeTotal">3</strong><small>节点总数</small></span>
                    <span><strong id="overviewNodeNormalRate">66.7%</strong><small>正常率</small></span>
                  </div>
                  <div className="node-summary-stats">
                    <span>
                      <i className="status-dot ok" />
                      <small>正常</small>
                      <b id="overviewNodeNormal">2</b>
                    </span>
                    <button type="button" onClick={() => focusNodeIssue('node')}>
                      <i className="status-dot bad" />
                      <small>异常</small>
                      <b id="overviewNodeAbnormal">1</b>
                      <em>故障定位 →</em>
                    </button>
                  </div>
                </div>
              </div>

              <div className="accelerator-summary">
                <div className="resource-visual-title module-title"><MonitorCog className="module-line-icon" /><span>GPU 与显存</span></div>
                <div className="accelerator-metrics">
                  <div className="accelerator-metric is-gpu">
                    <div className="accelerator-metric-copy">
                      <span><i />GPU 利用率</span>
                      <strong>76%</strong>
                    </div>
                    <div className="accelerator-scale">
                      <div className="accelerator-track"><i style={{ width: '76%' }} /></div>
                      <span><small>0%</small><small>100%</small></span>
                    </div>
                    <div className="accelerator-facts">
                      <span>总量 <b>512 卡</b></span>
                      <span>在线 <b>508 张</b></span>
                      <span>健康率 <b>99.2%</b></span>
                    </div>
                  </div>

                  <div className="accelerator-metric is-vram">
                    <div className="accelerator-metric-copy">
                      <span><i />显存使用率</span>
                      <strong>80%</strong>
                    </div>
                    <div className="accelerator-scale">
                      <div className="accelerator-track"><i style={{ width: '80%' }} /></div>
                      <span><small>0%</small><small>100%</small></span>
                    </div>
                    <div className="accelerator-facts">
                      <span>已使用 <b>32 TB</b></span>
                      <span>总容量 <b>40 TB</b></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="network-summary-refined">
                <div className="resource-visual-title module-title"><Network className="module-line-icon" /><span>网络</span></div>
                <div className="network-summary-rows">
                  <div className="network-summary-row">
                    <div><strong>RDMA</strong><span>1,024 个端口</span></div>
                    <div className="network-health-copy">
                      <strong>99.4%</strong><span>健康率</span>
                    </div>
                    <span className="network-abnormal"><b>6</b><span>个异常</span></span>
                    <button type="button" onClick={() => focusNodeIssue('network')}>查看路径 →</button>
                  </div>
                  <div className="network-summary-row">
                    <div><strong>网卡</strong><span>1,024 张</span></div>
                    <div className="network-health-copy">
                      <strong>99.6%</strong><span>健康率</span>
                    </div>
                    <span className="network-abnormal"><b>4</b><span>个异常</span></span>
                    <button type="button" onClick={() => focusNodeIssue('network')}>查看路径 →</button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="metric-grid">
            <section className="capacity-canvas" aria-label="容量概览">
              <div className="capacity-refined-grid">
                <div className="capacity-widget is-cpu">
                  <div className="capacity-widget-title module-title"><Cpu className="module-line-icon" /><span>CPU</span></div>
                  <div className="capacity-widget-body">
                    <div
                      className="capacity-donut"
                      style={{ background: 'conic-gradient(#6951ff 0 61%, #f0edff 61% 100%)' }}
                    >
                      <span><strong>61%</strong><small>使用率</small></span>
                    </div>
                    <div className="capacity-widget-facts">
                      <span><small>核心用量</small><b>1,824 / 2,432 Core</b></span>
                      <span><small>总算力</small><b>5.63 THz</b></span>
                    </div>
                  </div>
                </div>

                <div className="capacity-widget is-storage">
                  <div className="capacity-widget-title module-title"><Database className="module-line-icon" /><span>存储</span></div>
                  <div className="storage-amount"><strong>840</strong><span>TiB 总容量</span></div>
                  <div className="storage-segments" aria-label="已使用 50%，失效 10%，空闲 40%">
                    <i className="is-used" style={{ width: '50%' }} />
                    <i className="is-failed" style={{ width: '10%' }} />
                    <i className="is-free" style={{ width: '40%' }} />
                  </div>
                  <div className="storage-legend">
                    <span><i className="is-used" /><small>已使用</small><b>420 TiB</b></span>
                    <span><i className="is-failed" /><small>失效</small><b>84 TiB</b></span>
                    <span><i className="is-free" /><small>空闲</small><b>336 TiB</b></span>
                  </div>
                </div>

                <div className="capacity-widget is-memory">
                  <div className="capacity-widget-title module-title"><MemoryStick className="module-line-icon" /><span>内存</span></div>
                  <div className="memory-summary">
                    <strong>71%</strong>
                    <span>内存使用率</span>
                  </div>
                  <div className="memory-allocation" aria-label="内存使用情况">
                    <i className="is-active" style={{ height: '71%' }} />
                    <i className="is-system" style={{ height: '10%' }} />
                    <i className="is-free" style={{ height: '19%' }} />
                  </div>
                  <div className="memory-details">
                    <span><i className="is-active" /><small>已使用</small><b>15.0 TiB</b></span>
                    <span><i className="is-system" /><small>系统占用</small><b>2.0 TiB</b></span>
                    <span><i className="is-free" /><small>总容量</small><b>21.0 TiB</b></span>
                  </div>
                </div>

                <div className="capacity-widget is-disk">
                  <div className="capacity-widget-title module-title"><HardDrive className="module-line-icon" /><span>物理盘</span></div>
                  <div className="disk-widget-body">
                    <div className="disk-widget-total"><strong>36</strong><span>块磁盘</span></div>
                    <div className="disk-type-list">
                      <div className="is-ssd">
                        <span><i /><b>SSD</b></span>
                        <strong>24</strong>
                        <small>块磁盘</small>
                        <button
                          className="disk-fault-link"
                          type="button"
                          onClick={() => focusNodeIssue('disk')}
                        >
                          2 块异常 · 定位 →
                        </button>
                      </div>
                      <div className="is-hdd">
                        <span><i /><b>HDD</b></span>
                        <strong>12</strong>
                        <small>块磁盘</small>
                        <em>全部正常</em>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="overview-item metric-log">
              <OverviewCardHeader icon={<FileText />} title="操作日志" meta="最近更新" />
              <div className="operation-list">
                <div className="operation-row">
                  <span className="operation-time">14:23<small>07-22</small></span>
                  <i className="operation-dot maintenance" />
                  <div><strong>节点进入维护状态</strong><span>gpu-node-07</span></div>
                  <em>节点</em>
                </div>
                <div className="operation-row">
                  <span className="operation-time">11:05<small>07-22</small></span>
                  <i className="operation-dot success" />
                  <div><strong>资源段扩容完成</strong><span>新增 2 台 Worker 节点</span></div>
                  <em>扩容</em>
                </div>
                <div className="operation-row">
                  <span className="operation-time">18:42<small>07-21</small></span>
                  <i className="operation-dot success" />
                  <div><strong>GPU 驱动升级完成</strong><span>v550.127.05 → v550.144.03</span></div>
                  <em>升级</em>
                </div>
                <div className="operation-row">
                  <span className="operation-time">09:30<small>07-21</small></span>
                  <i className="operation-dot warning" />
                  <div><strong>触发 DiskPressure 告警</strong><span>节点 gpu-node-12</span></div>
                  <em>告警</em>
                </div>
                <div className="operation-row">
                  <span className="operation-time">22:15<small>07-20</small></span>
                  <i className="operation-dot success" />
                  <div><strong>Node Agent 批量下发完成</strong><span>平台组件</span></div>
                  <em>组件</em>
                </div>
              </div>
              <button
                className="operation-more"
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('ataas:navigate', { detail: { tab: 'logs' } }))}
              >
                查看全部操作记录
              </button>
            </div>
          </div>
        </div>

        <section className="nodes-view">
          <NodeTable selectedClusterKey={selectedClusterKey} />
        </section>

        <section className="services-view">
          <ClusterResourceTables view="svc" selectedClusterKey={selectedClusterKey} />
        </section>

        </div>
      </main>
    </section>

    <SupplierResourceCreateFlow
      openKind={resourceCreateKind}
      onClose={() => setResourceCreateKind(null)}
      onClusterTaskCreated={addClusterTask}
      onClusterTaskBackground={() => {
        setTaskDrawerOpen(true);
        message.info('任务已转入后台，可在算力中心左上角“任务”中查看进度和日志');
      }}
    />
    <Drawer
      rootClassName="cluster-task-drawer"
      title="集群创建 / 接入任务"
      open={taskDrawerOpen}
      onClose={() => setTaskDrawerOpen(false)}
      size={720}
      extra={<Tag>{runningTaskCount ? `${runningTaskCount} 个执行中` : '暂无执行中任务'}</Tag>}
    >
      {clusterTasks.length ? (
        <div className="cluster-task-list">
          {clusterTasks.map((task) => {
            const progress = getClusterTaskProgress(task, taskClock);
            const finished = progress >= 100;
            const milestones = getClusterTaskMilestones(task);
            const currentStage = [...milestones].reverse().find((item) => progress >= item.threshold);
            const taskStatusLabel = finished ? (task.accessMode === 'token' ? '已接入' : '已完成') : '执行中';
            return (
              <article key={task.key} className={finished ? 'finished' : ''}>
                <header>
                  <div>
                    <strong>{task.clusterName}</strong>
                    <small>
                      {task.accessMode === 'token'
                        ? 'Token 接入 · 兼容旧版接入'
                        : `${task.machineCount} 台机器 · Master ${task.masterCount} · Worker ${task.workerCount}`}
                    </small>
                  </div>
                  <Tag color={finished ? 'success' : 'processing'}>{taskStatusLabel}</Tag>
                </header>
                <div className="cluster-task-package">
                  <span>{task.k8sVersion}</span>
                  <span>{task.packageName}</span>
                  <span>{formatTaskTime(task.startedAt)}</span>
                </div>
                <Progress percent={progress} status={finished ? 'success' : 'active'} />
                <footer>
                  <span>{currentStage?.stage || '准备任务'} · {progress}%</span>
                  <Button type="link" icon={<FileText size={14} />} onClick={() => setLogTaskKey(task.key)}>查看日志</Button>
                </footer>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty description="还没有集群创建 / 接入任务" />
      )}
    </Drawer>
    <Modal
      rootClassName="cluster-task-log-modal"
      title={selectedLogTask ? `${selectedLogTask.clusterName} · 执行日志` : '执行日志'}
      open={Boolean(selectedLogTask)}
      onCancel={() => setLogTaskKey(null)}
      footer={null}
      width={780}
    >
      {selectedLogTask && (
        <div className="cluster-task-logs">
          {getClusterTaskMilestones(selectedLogTask)
            .filter((item) => getClusterTaskProgress(selectedLogTask, taskClock) >= item.threshold)
            .map((item) => (
              <div key={item.stage}>
                <time>{formatTaskTime(selectedLogTask.startedAt + item.offset)}</time>
                <span className={item.threshold >= 100 ? 'success' : ''}>{item.threshold >= 100 ? '完成' : 'INFO'}</span>
                <strong>{item.stage}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
        </div>
      )}
    </Modal>
    </div>
  );
};

type NodeRow = {
  key: string;
  name: string;
  ip: string;
  clusterName: string;
  label: string;
  tags?: string[];
  status: 'normal' | 'warning' | 'error' | 'pending' | 'draining';
  authStatus: 'authorized' | 'unauthorized';
  modelCount: number;
  runningInstances: number;
  cpu: number;
  cpuUsed: number;
  cpuModel: string;
  cpuArch: string;
  cpuSockets: number;
  cpuCores: number;
  cpuThreads: number;
  cpuFrequency: number;
  cpuTotalGHz: number;
  cpuUsedGHz: number;
  cpuReady: string;
  cpuLoad: string;
  gpu: number;
  gpuCards: Array<{ index: number; model: string; spec: string; memoryTotal: string; memoryUsed: string; memoryFree: string; utilization: number; power: number; temperature: number; status: string }>;
  gpuMemory: string;
  gpuMemoryUsed: string;
  memory: string;
  memoryUsed: string;
  memoryType: string;
  memoryActive: string;
  memoryConsumed: string;
  memoryShared: string;
  memoryBalloon: string;
  memoryCompression: string;
  memorySwap: string;
  memoryCache: string;
  disk: string;
  diskUsed: string;
  disks: NodeDisk[];
  networkCards: Array<{ name: string; ip: string; speed: string; status: string; type: string; mac: string; driver: string; pcie: string; linkStatus: string; duplex: string; lossRate: string; errors: number; inbound: string; outbound: string; bandwidthUtil: number; pps: string; tcpConns: number; avgLatency: string; connStatus: string }>;
  pods: Array<{ name: string; status: string; namespace: string; ready: string }>;
};

type NodeDisk = {
  name: string;
  total: string;
  used: string;
  free: string;
  type: string;
  source: 'local' | 'external';
  mountNode: string;
  mountPath: string;
  status: string;
  readSpeed: string;
  writeSpeed: string;
  iops: string;
  latency: string;
  readPressure: number;
  writePressure: number;
};

const getCapacityPercent = (used: string | number, total: string | number) => {
  const parseVal = (v: string | number) => {
    if (typeof v === 'number') return v;
    const n = Number(String(v).replace(/,/g, '').match(/[\d.]+/)?.[0] || 0);
    return String(v).toUpperCase().includes('TB') ? n * 1024 : n;
  };
  const u = parseVal(used), t = parseVal(total);
  return t > 0 ? (u / t) * 100 : 0;
};

const UsageRing = ({ percent, sub }: { percent: number; sub?: string }) => {
  const p = Math.min(Math.max(Math.round(percent), 0), 100);
  const color = p > 80 ? '#F53F3F' : p > 60 ? '#FF7D00' : '#4C6EF5';
  const r = 12, stroke = 3;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}>
      <svg width={32} height={32} aria-hidden="true" style={{ flexShrink: 0 }}>
        <circle cx={16} cy={16} r={r} fill="none" stroke="#E5E6EB" strokeWidth={stroke} />
        <circle cx={16} cy={16} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 16 16)" />
        <text x={16} y={17} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: '#4E5969' }}>{p}%</text>
      </svg>
      {sub && <span style={{ fontSize: 11, color: '#4E5969' }}>{sub}</span>}
    </span>
  );
};

const nodeTabs = ['故障定位', 'CPU', '内存', 'GPU', '磁盘详情', '网卡详情', 'Pods列表'];

const DiskDetailDrawer = ({ disk, nodeName, open, onClose }: { disk: NodeDisk | null; nodeName: string; open: boolean; onClose: () => void }) => {
  if (!disk) return null;
  const totalValue = Number(disk.total.match(/[\d.]+/)?.[0] || 0);
  const usedValue = Number(disk.used.match(/[\d.]+/)?.[0] || 0);
  const capacityUnit = disk.total.match(/[A-Za-z]+/)?.[0] || 'GB';
  const freeValue = Math.max(totalValue - usedValue, 0);
  const usagePct = totalValue > 0 ? Math.round((usedValue / totalValue) * 100) : 0;
  const usageTone = usagePct > 90 ? 'is-danger' : usagePct > 80 ? 'is-warning' : '';
  const isHealthy = disk.status === 'normal';
  const readValue = Number(disk.readSpeed.match(/[\d.]+/)?.[0] || 0);
  const writeValue = Number(disk.writeSpeed.match(/[\d.]+/)?.[0] || 0);
  const throughputMax = Math.max(readValue, writeValue, 1);

  return (
    <Drawer
      rootClassName="disk-detail-drawer"
      title={(
        <div className="disk-drawer-title">
          <strong>{disk.name}</strong>
          <span>{disk.type} · 挂载到 {disk.mountNode || nodeName}</span>
        </div>
      )}
      placement="right"
      open={open}
      onClose={onClose}
      closable
      width={540}
    >
      <div className="disk-detail-shell">
        <div className="disk-detail-topline">
          <span className={`disk-detail-status${isHealthy ? ' is-healthy' : ' is-abnormal'}`}>
            <i />
            {isHealthy ? '运行正常' : '存在告警'}
          </span>
          <span>{disk.mountNode || nodeName} · {disk.mountPath}</span>
        </div>

        <section className={`disk-capacity-overview ${usageTone}`}>
          <div className="disk-capacity-head">
            <div>
              <span>容量使用率</span>
              <strong>{usagePct}%</strong>
            </div>
            <small>{usedValue.toFixed(2)} / {totalValue.toFixed(2)} {capacityUnit}</small>
          </div>
          <div className="disk-capacity-track">
            <i style={{ width: `${usagePct}%` }} />
          </div>
          <div className="disk-capacity-legend">
            <div><span>已使用</span><strong>{usedValue.toFixed(2)} {capacityUnit}</strong></div>
            <div><span>可用</span><strong>{disk.free || `${freeValue.toFixed(2)} ${capacityUnit}`}</strong></div>
            <div><span>总容量</span><strong>{totalValue.toFixed(2)} {capacityUnit}</strong></div>
          </div>
        </section>

        <section className="disk-detail-section">
          <div className="disk-detail-section-head">
            <strong>基础信息</strong>
            <span>设备与挂载关系</span>
          </div>
          <div className="disk-detail-basic-grid">
            <div><span>设备类型</span><strong>{disk.type}</strong></div>
            <div><span>存储来源</span><strong>{disk.source === 'external' ? '外置存储' : '本地磁盘'}</strong></div>
            <div><span>挂载机器</span><strong>{disk.mountNode || nodeName}</strong></div>
            <div><span>挂载路径</span><strong>{disk.mountPath}</strong></div>
            <div><span>可用空间</span><strong>{disk.free || `${freeValue.toFixed(2)} ${capacityUnit}`}</strong></div>
            <div><span>设备状态</span><strong className={isHealthy ? 'is-healthy' : 'is-abnormal'}>{isHealthy ? '正常' : '告警'}</strong></div>
          </div>
        </section>

        <section className="disk-detail-section">
          <div className="disk-detail-section-head">
            <strong>实时吞吐</strong>
            <span>按当前读写速率对比</span>
          </div>
          <div className="disk-throughput-list">
            <div className="disk-throughput-row">
              <span>读取</span>
              <i><em style={{ width: `${(readValue / throughputMax) * 100}%` }} /></i>
              <strong>{disk.readSpeed}</strong>
            </div>
            <div className="disk-throughput-row is-write">
              <span>写入</span>
              <i><em style={{ width: `${(writeValue / throughputMax) * 100}%` }} /></i>
              <strong>{disk.writeSpeed}</strong>
            </div>
          </div>
        </section>

        <section className="disk-detail-section">
          <div className="disk-detail-section-head">
            <strong>性能与压力</strong>
            <span>当前采样值</span>
          </div>
          <div className="disk-performance-grid">
            <div><span>IOPS</span><strong>{disk.iops}</strong></div>
            <div><span>平均延迟</span><strong>{disk.latency}</strong></div>
          </div>
          <div className="disk-pressure-list">
            <div className="disk-pressure-row">
              <span>读取压力</span>
              <i><em style={{ width: `${disk.readPressure}%` }} /></i>
              <strong>{disk.readPressure}%</strong>
            </div>
            <div className="disk-pressure-row is-write">
              <span>写入压力</span>
              <i><em style={{ width: `${disk.writePressure}%` }} /></i>
              <strong>{disk.writePressure}%</strong>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};


type NetCardDetail = {
  name: string; ip: string; speed: string; status: string;
  type: string; mac: string; driver: string; pcie: string;
  linkStatus: string; duplex: string; lossRate: string; errors: number;
  inbound: string; outbound: string; bandwidthUtil: number;
  pps: string; tcpConns: number; avgLatency: string; connStatus: string;
  nodeName: string; runningPods: number;
};

const NetDetailDrawer = ({ card, open, onClose }: { card: NetCardDetail | null; open: boolean; onClose: () => void }) => {
  if (!card) return null;
  const isActive = card.status === 'active';
  const isRdma = card.type === 'InfiniBand';
  const bandwidthTone = card.bandwidthUtil > 85 ? 'is-danger' : card.bandwidthUtil > 70 ? 'is-warning' : '';
  return (
    <Drawer
      rootClassName="node-device-drawer"
      title={(
        <div className="node-device-drawer-title">
          <strong>{card.name}</strong>
          <span>{isRdma ? 'RDMA 网络' : card.type} · {card.nodeName}</span>
        </div>
      )}
      placement="right"
      open={open}
      onClose={onClose}
      closable
      width={540}
    >
      <div className="node-device-shell">
        <div className="node-device-topline">
          <span className={`node-device-status${isActive ? ' is-healthy' : ' is-abnormal'}`}>
            <i />
            {isActive ? '链路正常' : '链路异常'}
          </span>
          <span>{card.linkStatus} · {card.speed}</span>
        </div>

        <section className={`node-device-bandwidth ${bandwidthTone}`}>
          <div className="node-device-bandwidth-head">
            <div><span>带宽利用率</span><strong>{card.bandwidthUtil}%</strong></div>
            <small>{isRdma ? 'RDMA 实时负载' : '接口实时负载'}</small>
          </div>
          <div className="node-device-bandwidth-track"><i style={{ width: `${card.bandwidthUtil}%` }} /></div>
          <div className="node-device-traffic-grid">
            <div><span>接收</span><strong>{card.inbound}</strong></div>
            <div><span>发送</span><strong>{card.outbound}</strong></div>
          </div>
        </section>

        <section className="node-device-section">
          <div className="node-device-section-head"><strong>设备信息</strong><span>接口与驱动</span></div>
          <div className="node-device-info-grid">
            <div><span>接口类型</span><strong>{card.type}</strong></div>
            <div><span>IP 地址</span><strong>{card.ip}</strong></div>
            <div><span>MAC 地址</span><strong>{card.mac}</strong></div>
            <div><span>驱动</span><strong>{card.driver}</strong></div>
            <div><span>PCIe 位置</span><strong>{card.pcie}</strong></div>
            <div><span>双工模式</span><strong>{card.duplex}</strong></div>
          </div>
        </section>

        <section className="node-device-section">
          <div className="node-device-section-head"><strong>链路质量</strong><span>当前采样值</span></div>
          <div className="node-device-metric-grid">
            <div><span>丢包率</span><strong>{card.lossRate}</strong></div>
            <div><span>错误包</span><strong>{card.errors.toLocaleString()}</strong></div>
            <div><span>PPS</span><strong>{card.pps}</strong></div>
            <div><span>TCP 连接</span><strong>{card.tcpConns.toLocaleString()}</strong></div>
            <div><span>平均延迟</span><strong>{card.avgLatency}</strong></div>
            <div><span>运行 Pods</span><strong>{card.runningPods}</strong></div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};

const GpuDetailDrawer = ({ card, nodeName, open, onClose }: {
  card: NodeRow['gpuCards'][number] | null;
  nodeName: string;
  open: boolean;
  onClose: () => void;
}) => {
  if (!card) return null;
  const memoryPercent = Math.round(getCapacityPercent(card.memoryUsed, card.memoryTotal));
  const utilizationTone = card.utilization > 90 ? 'is-danger' : card.utilization > 75 ? 'is-warning' : '';
  const isActive = card.status === 'active';

  return (
    <Drawer
      rootClassName="gpu-detail-drawer"
      title={(
        <div className="gpu-drawer-title">
          <strong>GPU #{card.index}</strong>
          <span>{card.model} · {nodeName}</span>
        </div>
      )}
      placement="right"
      open={open}
      onClose={onClose}
      closable
      width={520}
    >
      <div className="gpu-detail-shell">
        <div className="gpu-detail-topline">
          <span className={`gpu-detail-status${isActive ? ' is-active' : ''}`}><i />{isActive ? '使用中' : '空闲'}</span>
          <span>{card.spec}</span>
        </div>

        <section className={`gpu-utilization-overview ${utilizationTone}`}>
          <div className="gpu-utilization-head">
            <div><span>GPU 利用率</span><strong>{card.utilization}%</strong></div>
            <small>{card.temperature}°C · {card.power}W</small>
          </div>
          <div className="gpu-utilization-track"><i style={{ width: `${card.utilization}%` }} /></div>
        </section>

        <section className="gpu-utilization-overview gpu-memory-overview">
          <div className="gpu-utilization-head">
            <div><span>GPU 显存使用</span><strong>{memoryPercent}%</strong></div>
            <small>{card.memoryUsed} / {card.memoryTotal}</small>
          </div>
          <div className="gpu-memory-track"><i style={{ width: `${memoryPercent}%` }} /></div>
          <div className="gpu-memory-grid">
            <div><span>已使用</span><strong>{card.memoryUsed}</strong></div>
            <div><span>空闲</span><strong>{card.memoryFree}</strong></div>
            <div><span>总显存</span><strong>{card.memoryTotal}</strong></div>
          </div>
        </section>

        <section className="gpu-detail-section">
          <div className="gpu-detail-section-head"><strong>运行指标</strong><span>当前采样值</span></div>
          <div className="gpu-runtime-grid">
            <div><span>型号</span><strong>{card.model}</strong></div>
            <div><span>规格</span><strong>{card.spec}</strong></div>
            <div><span>功耗</span><strong>{card.power} W</strong></div>
            <div><span>温度</span><strong>{card.temperature} °C</strong></div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};


const NodeExpandContent = ({ node, initialTab = 'CPU' }: { node: NodeRow; initialTab?: string }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [diskDetail, setDiskDetail] = useState<NodeDisk | null>(null);
  const [netDetail, setNetDetail] = useState<NetCardDetail | null>(null);
  const [gpuDetail, setGpuDetail] = useState<{ index: number; model: string; spec: string; memoryTotal: string; memoryUsed: string; memoryFree: string; utilization: number; power: number; temperature: number; status: string } | null>(null);

  const cpuUtil = node.cpu > 0 ? Math.round((node.cpuUsed / node.cpu) * 100) : 0;
  const memUtil = getCapacityPercent(node.memoryUsed, node.memory);
  const nodeHasFault = node.status === 'warning' || node.status === 'error';

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const renderTabBar = () => (
    <div className="node-detail-tabs">
      {nodeTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          className={activeTab === tab ? 'active' : ''}
          onClick={() => setActiveTab(tab)}
        >
          <span>{tab}</span>
          {tab === '故障定位' && nodeHasFault && (
            <Tooltip title="该节点存在异常，请优先查看故障定位">
              <span className="node-detail-fault-indicator"><CircleAlert /></span>
            </Tooltip>
          )}
        </button>
      ))}
    </div>
  );

  if (node.status === 'pending') {
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <div className="node-onboarding-state">
          <strong>节点正在接入</strong>
          <span>系统正在完成连通性检查、集群注册和硬件资源采集，完成后会自动更新这里的资源详情。</span>
          <div><i /><span>资源已关联到 {node.clusterName}</span></div>
        </div>
      </div>
    );
  }

  if (activeTab === '故障定位') {
    const abnormalNetworks = node.networkCards.filter((card) => card.status !== 'active');
    const hasFault = nodeHasFault;
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <div className={`node-fault-locator${hasFault ? ' has-fault' : ''}`}>
          <div className="node-fault-locator-head">
            <div>
              <strong>{hasFault ? '已定位节点故障路径' : '当前节点运行正常'}</strong>
              <span>{node.name} · {node.ip}</span>
            </div>
            <span className="node-fault-locator-status">{hasFault ? '异常' : '正常'}</span>
          </div>
          {hasFault ? (
            <>
              <div className="node-fault-path">
                <div><small>节点状态</small><strong>{node.name} 异常</strong></div>
                <span>→</span>
                <div><small>关联设备</small><strong>{abnormalNetworks.map((card) => card.name).join('、') || '待确认'}</strong></div>
                <span>→</span>
                <div><small>定位结果</small><strong>{abnormalNetworks.length ? '网络链路 DOWN' : '节点资源异常'}</strong></div>
              </div>
              <div className="node-fault-locator-actions">
                <span>建议优先检查节点网络链路、交换机端口和主机网络服务。</span>
                {abnormalNetworks.length > 0 && (
                  <button type="button" onClick={() => setActiveTab('网卡详情')}>查看网卡详情</button>
                )}
              </div>
            </>
          ) : (
            <div className="node-fault-empty">未检测到需要定位的节点故障。</div>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 'CPU') {
    const items = [
      { label: 'CPU型号', value: node.cpuModel },
      { label: 'CPU Socket数量', value: `${node.cpuSockets}` },
      { label: 'CPU核心数(Cores)', value: `${node.cpuCores}` },
      { label: 'CPU线程数(Threads)', value: `${node.cpuThreads}` },
      { label: 'CPU频率(GHz)', value: `${node.cpuFrequency.toFixed(1)} GHz` },
      { label: 'CPU总容量(GHz)', value: `${node.cpuTotalGHz.toFixed(1)} GHz` },
      { label: 'CPU已使用(GHz)', value: `${node.cpuUsedGHz.toFixed(1)} GHz` },
      { label: 'CPU Ready', value: node.cpuReady },
      { label: 'CPU负载(Load)', value: node.cpuLoad },
    ];
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <div className="node-resource-panel">
          <div className="node-usage-summary">
            <div className="node-usage-title"><span>CPU 运行状态</span></div>
            <strong>{cpuUtil}%</strong>
            <span>CPU 利用率</span>
            <div className="node-usage-track"><i className={cpuUtil > 80 ? 'is-danger' : cpuUtil > 60 ? 'is-warning' : ''} style={{ width: `${cpuUtil}%` }} /></div>
            <small>{node.cpuUsed} / {node.cpu} Core</small>
          </div>
          <div className="node-kv-grid">
            {items.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === '内存') {
    const memRows: Array<{ label: string; value: string }> = [
      { label: 'Memory 总容量', value: node.memory },
      { label: 'Memory 已使用', value: node.memoryUsed },
      { label: 'Memory 使用率', value: Math.round(memUtil) + '%' },
      { label: 'Memory 活跃', value: node.memoryActive },
      { label: 'Memory 已消费', value: node.memoryConsumed },
      { label: 'Memory 共享', value: node.memoryShared },
      { label: 'Memory Balloon', value: node.memoryBalloon },
      { label: 'Memory 压缩', value: node.memoryCompression },
      { label: 'Memory Swap', value: node.memorySwap },
      { label: 'Memory 缓存', value: node.memoryCache },
    ];
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <div className="node-resource-panel">
          <div className="node-usage-summary">
            <div className="node-usage-title"><span>内存运行状态</span></div>
            <strong>{Math.round(memUtil)}%</strong>
            <span>内存使用率</span>
            <div className="node-usage-track"><i className={memUtil > 80 ? 'is-danger' : memUtil > 60 ? 'is-warning' : ''} style={{ width: `${Math.round(memUtil)}%` }} /></div>
            <small>{node.memoryUsed} / {node.memory}</small>
          </div>
          <div className="node-kv-grid">
            {memRows.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'GPU') {
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <table className="node-detail-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>#</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>型号</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>显存</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>利用率</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>功耗</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>温度</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {node.gpuCards.map((card) => (
              <tr key={card.index}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.index}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><a style={{ cursor: 'pointer', color: '#6951FF', fontWeight: 500 }} onClick={() => setGpuDetail(card)}><strong>{card.model}</strong></a> <em style={{ color: '#86909c', fontStyle: 'normal' }}>{card.spec}</em></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.memoryUsed} / {card.memoryTotal}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" style={{ width: 80 }} />
                  <span style={{ marginLeft: 6, fontSize: 12, color: '#4E5969' }}>{card.utilization}%</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.power}W</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.temperature}°C</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: card.status === 'active' ? '#00B42A' : '#C9CDD4', marginRight: 6 }} />
                  <span style={{ color: card.status === 'active' ? '#00B42A' : '#86909c' }}>{card.status === 'active' ? '使用中' : '空闲'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <GpuDetailDrawer card={gpuDetail} nodeName={node.name} open={!!gpuDetail} onClose={() => setGpuDetail(null)} />
      </div>
    );
  }

  if (activeTab === '磁盘详情') {
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <table className="node-detail-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>名称</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>总量</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>已用</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>可用</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>类型</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>挂载位置</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {node.disks.map((d) => (
              <tr key={d.name} className={d.source === 'external' ? 'node-detail-external-storage-row' : undefined}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <a style={{ cursor: 'pointer', color: '#6951FF', fontWeight: 500 }} onClick={() => setDiskDetail(d)}>{d.name}</a>
                  {d.source === 'external' && <span className="node-detail-storage-kind">外置</span>}
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.total}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.used}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.free}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.type}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>
                  <span className="node-detail-storage-location">
                    <strong>{d.mountNode || node.name}</strong>
                    <small>{d.mountPath}</small>
                  </span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: d.status === 'normal' ? '#00B42A' : '#FF7D00', marginRight: 6 }} />
                  <span style={{ color: d.status === 'normal' ? '#00B42A' : '#FF7D00' }}>{d.status === 'normal' ? '正常' : '告警'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <DiskDetailDrawer disk={diskDetail} nodeName={node.name} open={!!diskDetail} onClose={() => setDiskDetail(null)} />
      </div>
    );
  }

  if (activeTab === '网卡详情') {
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <table className="node-detail-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>名称</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>类型</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>IP</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>速率</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {node.networkCards.map((card) => (
              <tr key={card.name}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><a style={{ cursor: 'pointer', color: '#6951FF', fontWeight: 500 }} onClick={() => {
                  setNetDetail({
                    ...card,
                    nodeName: node.name,
                    runningPods: node.pods.filter((pod) => pod.status === 'Running').length,
                  });
                }}>{card.name}</a></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.type}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.ip}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.speed}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: card.status === 'active' ? '#00B42A' : '#F53F3F', marginRight: 6 }} />
                  <span style={{ color: card.status === 'active' ? '#00B42A' : '#F53F3F' }}>{card.status === 'active' ? '正常' : '异常'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <NetDetailDrawer card={netDetail} open={!!netDetail} onClose={() => setNetDetail(null)} />
      </div>
    );
  }

  if (activeTab === 'Pods列表') {
    return (
      <div className="node-expand-shell">
        {renderTabBar()}
        <table className="node-detail-table" style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>Pod 名称</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>命名空间</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>就绪</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {node.pods.length === 0 && <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#C9CDD4' }}>暂无 Pod</td></tr>}
            {node.pods.map((pod) => (
              <tr key={pod.name}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><strong>{pod.name}</strong></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{pod.namespace}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>{pod.ready}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: pod.status === 'Running' ? '#00B42A' : '#F53F3F' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: pod.status === 'Running' ? '#00B42A' : '#F53F3F' }} />
                    {pod.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
};

const buildMockNodeRow = (name: string, matchedPods: NodeRow['pods'], index: number): NodeRow => {
  const gpuCount = 8;
  const clusterName = name.startsWith('st-') ? 'ST1'
    : name.startsWith('bd-') ? 'beijing-prod'
    : name.startsWith('bx-') ? 'guangzhou-test'
    : 'default';
  const runningCount = matchedPods.filter(p => p.status === 'Running').length;
  const baseIp = `192.168.${100 + (index % 200)}.${(index % 254) + 1}`;
  const s = index;
  const gpuCards: NodeRow['gpuCards'] = Array.from({ length: gpuCount }, (_, gi) => ({
    index: gi, model: 'B300', spec: '24 GB',
    memoryTotal: '23.99 GB',
    memoryUsed: `${(12 + (gi * 3 + s * 2) % 12).toFixed(1)} GB`,
    memoryFree: `${(12 - (gi * 3 + s * 2) % 12) < 0 ? '0.09' : (12 - (gi * 3 + s * 2) % 12).toFixed(2)} GB`,
    utilization: (30 + (gi * 12 + s * 5) % 60),
    power: 250 + (gi * 20 + s * 10) % 200,
    temperature: 55 + (gi * 5 + s * 3) % 30,
    status: 'active' as const,
  }));
  const localDiskUsed = 1.2 + (s * 0.1) % 1.5;
  const externalStorageUsed = 54 + (s * 2.7) % 24;
  const disks: NodeRow['disks'] = [
    {
      name: '/dev/sda',
      total: '3.86 TB',
      used: `${localDiskUsed.toFixed(2)} TB`,
      free: `${Math.max(0, 3.86 - localDiskUsed).toFixed(2)} TB`,
      type: 'NVMe SSD',
      source: 'local',
      mountNode: name,
      mountPath: '/data',
      status: 'normal',
      readSpeed: `${700 + (s * 50) % 300} MB/s`,
      writeSpeed: `${350 + (s * 25) % 200} MB/s`,
      iops: `${70 + (s * 5) % 30}K`,
      latency: `${(0.5 + (s * 0.1) % 1.5).toFixed(1)} ms`,
      readPressure: 40 + (s * 8) % 40,
      writePressure: 25 + (s * 5) % 30,
    },
    {
      name: 'external-model-store',
      total: '120.00 TB',
      used: `${externalStorageUsed.toFixed(2)} TB`,
      free: `${Math.max(0, 120 - externalStorageUsed).toFixed(2)} TB`,
      type: '外置存储',
      source: 'external',
      mountNode: name,
      mountPath: '/mnt/external/model-store',
      status: 'normal',
      readSpeed: `${460 + (s * 17) % 140} MB/s`,
      writeSpeed: `${280 + (s * 13) % 120} MB/s`,
      iops: `${32 + (s * 3) % 18}K`,
      latency: `${(1.8 + (s * 0.13) % 1.1).toFixed(1)} ms`,
      readPressure: 28 + (s * 5) % 36,
      writePressure: 22 + (s * 4) % 30,
    },
  ];
  const networkCards: NodeRow['networkCards'] = [
    { name: 'eth0', ip: baseIp, speed: '25Gbps', status: 'active', type: 'Ethernet', mac: `00:1A:2B:3C:${String(s).padStart(2, '0').slice(-2)}:01`, driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.001%', errors: 0, inbound: `${(5 + (s * 0.5) % 15).toFixed(1)} Gbps`, outbound: `${(8 + (s * 0.7) % 12).toFixed(1)} Gbps`, bandwidthUtil: 35 + (s * 5) % 45, pps: `${600 + (s * 50) % 400}K`, tcpConns: 8000 + (s * 300) % 5000, avgLatency: `${(0.25 + (s * 0.02) % 0.3).toFixed(2)}ms`, connStatus: '正常' },
    { name: 'ib0', ip: `192.168.200.${(s % 254) + 1}`, speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: `${(80 + (s * 10) % 100).toFixed(1)} Gbps`, outbound: `${(60 + (s * 8) % 90).toFixed(1)} Gbps`, bandwidthUtil: 55 + (s * 5) % 35, pps: `${(2 + (s * 0.3) % 4).toFixed(1)}M`, tcpConns: 0, avgLatency: `${(0.08 + (s * 0.02) % 0.12).toFixed(2)}ms`, connStatus: '正常' },
  ];
  return {
    key: `node-${name}`, name, ip: baseIp, clusterName,
    label: gpuCount > 0 ? 'GPU=B300' : 'CPU',
    status: 'normal' as const, authStatus: 'authorized' as const,
    modelCount: 0, runningInstances: runningCount,
    cpu: 64, cpuUsed: 28 + (s * 7) % 45,
    cpuModel: 'Intel Xeon Gold 6438M', cpuArch: 'x86_64',
    cpuSockets: 2, cpuCores: 64, cpuThreads: 128, cpuFrequency: 2.1,
    cpuTotalGHz: 134.4, cpuUsedGHz: +(44 + (s * 3) % 30).toFixed(1),
    cpuReady: `${(97 + (s % 3)).toFixed(1)}%`, cpuLoad: `${(5 + (s * 0.8) % 10).toFixed(1)}`,
    gpu: gpuCount, gpuCards,
    gpuMemory: gpuCount > 0 ? `${(gpuCount * 24).toFixed(1)} GB` : '—',
    gpuMemoryUsed: gpuCount > 0 ? `${(gpuCount * 12).toFixed(1)} GB` : '—',
    memory: '1007.56 GB',
    memoryUsed: `${(280 + (s * 15) % 200).toFixed(1)} GB`,
    memoryType: 'DDR5 4800MHz', memoryActive: '—', memoryConsumed: '—',
    memoryShared: '—', memoryBalloon: '0 GB', memoryCompression: '—',
    memorySwap: '—', memoryCache: '—',
    disk: '3.86 TB',
    diskUsed: `${localDiskUsed.toFixed(2)} TB`,
    disks, networkCards, pods: matchedPods,
  };
};

const generateNodeRows = (pods: K8sPodResource[]): NodeRow[] => {
  const nodeMap = new Map<string, NodeRow['pods']>();
  pods.forEach(p => {
    if (!p.node || p.node === '自动调度') return;
    if (p.role === 'router' || p.role === 'store' || p.role === 'master' || p.role === 'etcd') return;
    if (!nodeMap.has(p.node)) nodeMap.set(p.node, []);
    nodeMap.get(p.node)!.push({ name: p.name, status: p.status, namespace: p.namespace, ready: p.ready });
  });
  return Array.from(nodeMap.entries()).map(([name, matchedPods], i) => buildMockNodeRow(name, matchedPods, i));
};

const nodeStatusText: Record<NodeRow['status'], string> = {
  normal: '正常',
  warning: '告警',
  error: '异常',
  pending: '接入中',
  draining: '驱散中',
};

const getNodeTags = (node: NodeRow) => [node.label, ...(node.tags || [])]
  .map((tag) => tag.trim())
  .filter((tag, index, tags) => tag && tags.indexOf(tag) === index);

const getNodeRunningWorkload = (node: NodeRow) => {
  const runningPods = node.pods.filter((pod) => pod.status === 'Running').length;
  const runningInstances = node.runningInstances || 0;
  return {
    runningPods,
    runningInstances,
    total: runningPods + runningInstances,
  };
};

const NodeTable = ({ selectedClusterKey }: { selectedClusterKey: string }) => {
  const tableFrameRef = useRef<HTMLDivElement>(null);
  const [keyword, setKeyword] = useState('');
  const [faultFocus, setFaultFocus] = useState<{ kind: 'node' | 'network' | 'disk'; nodeKey: string } | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addNodeForm] = Form.useForm();
  const { state } = useK8sResourceStore();
  const storePods = state.pods;
  const baseNodeRows = useMemo(() => generateNodeRows(storePods), [storePods]);
  const [customNodes, setCustomNodes] = useState<NodeRow[]>([]);
  const [deletedNames, setDeletedNames] = useState<Set<string>>(new Set());
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Partial<Pick<NodeRow, 'status' | 'tags'>>>>({});
  const scopedNodeRows = useMemo(() => {
    const allRows = [
      ...customNodes,
      ...baseNodeRows.filter((r) => !deletedNames.has(r.name)),
    ];
    const withOverrides = allRows.map((r) => {
      const override = statusOverrides[r.name];
      return override ? { ...r, ...override, tags: override.tags ?? r.tags } : r;
    });
    return withOverrides.filter((r) => r.clusterName === selectedClusterKey);
  }, [baseNodeRows, customNodes, deletedNames, statusOverrides, selectedClusterKey]);
  const normalCount = scopedNodeRows.filter((row) => row.status === 'normal').length;
  const abnormalCount = scopedNodeRows.filter((row) => row.status === 'warning' || row.status === 'error').length;
  const errorCount = scopedNodeRows.filter((row) => row.status === 'error').length;
  const warningCount = scopedNodeRows.filter((row) => row.status === 'warning').length;
  const totalGpuCount = scopedNodeRows.reduce((total, row) => total + row.gpu, 0);
  const focusedNode = faultFocus ? scopedNodeRows.find((row) => row.key === faultFocus.nodeKey) : null;

  const closeAddNodeDrawer = () => {
    addNodeForm.resetFields();
    setAddNodeOpen(false);
  };

  const createNodeJoinTask = (values: {
    role: 'worker' | 'control-plane';
    name: string;
    ip: string;
    credential: string;
    labels?: string;
    remark?: string;
  }) => {
    const nodeName = values.name.trim();
    const nodeIp = values.ip.trim();
    if (customNodes.some((row) => row.name === nodeName) || baseNodeRows.some((row) => row.name === nodeName)) {
      addNodeForm.setFields([{ name: 'name', errors: ['节点名称已存在'] }]);
      return;
    }
    if (customNodes.some((row) => row.ip === nodeIp) || baseNodeRows.some((row) => row.ip === nodeIp)) {
      addNodeForm.setFields([{ name: 'ip', errors: ['管理 IP 已关联其他节点'] }]);
      return;
    }

    const labels = String(values.labels || '')
      .split(/\r?\n/)
      .map((label) => label.trim())
      .filter(Boolean);
    const roleLabel = values.role === 'control-plane' ? 'controlplane=true' : 'worker=general';
    const newNode: NodeRow = {
      key: `node-${Date.now()}`,
      name: nodeName,
      ip: nodeIp,
      clusterName: selectedClusterKey,
      label: roleLabel,
      tags: labels,
      status: 'pending',
      authStatus: 'unauthorized',
      modelCount: 0,
      runningInstances: 0,
      cpu: 0,
      cpuUsed: 0,
      cpuModel: '待采集',
      cpuArch: '待采集',
      cpuSockets: 0,
      cpuCores: 0,
      cpuThreads: 0,
      cpuFrequency: 0,
      cpuTotalGHz: 0,
      cpuUsedGHz: 0,
      cpuReady: '—',
      cpuLoad: '—',
      gpu: 0,
      gpuCards: [],
      gpuMemory: '—',
      gpuMemoryUsed: '—',
      memory: '—',
      memoryUsed: '—',
      memoryType: '待采集',
      memoryActive: '—',
      memoryConsumed: '—',
      memoryShared: '—',
      memoryBalloon: '—',
      memoryCompression: '—',
      memorySwap: '—',
      memoryCache: '—',
      disk: '—',
      diskUsed: '—',
      disks: [],
      networkCards: [],
      pods: [],
    };

    setCustomNodes((prev) => [newNode, ...prev]);
    setKeyword('');
    setFaultFocus(null);
    setExpandedRowKeys([newNode.key]);
    closeAddNodeDrawer();
  };

  const openDrainNodeConfirm = (node: NodeRow) => {
    if (node.status === 'pending') {
      message.warning(`${node.name} 仍在接入中，完成后才能执行驱散`);
      return;
    }
    if (node.status === 'draining') {
      message.info(`${node.name} 已在驱散中`);
      return;
    }

    const workload = getNodeRunningWorkload(node);
    Modal.confirm({
      rootClassName: 'node-action-confirm-modal is-drain',
      centered: true,
      width: 520,
      icon: null,
      title: (
        <div className="node-action-confirm-heading">
          <span className="node-action-confirm-icon"><ArrowRightLeft /></span>
          <span>
            <strong>驱散节点</strong>
            <small>{node.name}</small>
          </span>
        </div>
      ),
      content: (
        <div className="node-action-confirm-content">
          <p>节点将被标记为不可调度并执行 Kubernetes Drain，可迁移的业务负载会自动转移至其他节点。</p>
          <div className="node-action-confirm-impact">
            <span><small>运行 Pod</small><strong>{workload.runningPods}</strong></span>
            <span><small>业务实例</small><strong>{workload.runningInstances}</strong></span>
            <span><small>执行方式</small><strong>自动迁移</strong></span>
          </div>
          <div className="node-action-confirm-note">
            <CircleAlert />
            <span>驱散不会移除节点。执行期间不再向该节点调度新任务，现有负载将逐步迁移。</span>
          </div>
        </div>
      ),
      okText: '开始驱散',
      cancelText: '取消',
      focusable: { autoFocusButton: 'cancel' },
      onOk: () => {
        setStatusOverrides((prev) => ({ ...prev, [node.name]: {
          status: 'draining',
          tags: [...new Set([...(node.tags || []), 'node.kubernetes.io/unschedulable=true'])],
        } }));
        message.success(`${node.name} 已提交 Drain，业务负载将自动迁移`);
      },
    });
  };

  const openDeleteNodeConfirm = (node: NodeRow) => {
    const workload = getNodeRunningWorkload(node);

    Modal.confirm({
      rootClassName: 'node-action-confirm-modal is-delete',
      centered: true,
      width: 520,
      icon: null,
      title: (
        <div className="node-action-confirm-heading">
          <span className="node-action-confirm-icon"><Trash2 /></span>
          <span>
            <strong>删除节点</strong>
            <small>{node.name}</small>
          </span>
        </div>
      ),
      content: (
        <div className="node-action-confirm-content">
          <p>节点将执行下线及移除流程，系统会在提交前校验运行任务，完成后该节点不再属于当前集群。</p>
          <div className="node-action-confirm-impact">
            <span><small>运行 Pod</small><strong>{workload.runningPods}</strong></span>
            <span><small>业务实例</small><strong>{workload.runningInstances}</strong></span>
            <span><small>执行方式</small><strong>下线移除</strong></span>
          </div>
          <div className={`node-action-confirm-note${workload.total > 0 ? ' is-danger' : ''}`}>
            <CircleAlert />
            <span>
              {workload.total > 0
                ? '当前检测到运行任务。删除不会自动迁移负载，相关任务可能中断。'
                : '当前未检测到运行任务，确认后节点将从集群中移除。'}
            </span>
          </div>
        </div>
      ),
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      focusable: { autoFocusButton: 'cancel' },
      onOk: () => {
        setDeletedNames((prev) => new Set([...prev, node.name]));
        setStatusOverrides((prev) => { const next = { ...prev }; delete next[node.name]; return next; });
        setExpandedRowKeys((keys) => keys.filter((key) => key !== node.key));
        if (faultFocus?.nodeKey === node.key) setFaultFocus(null);
        message.success(`${node.name} 已提交下线及移除`);
      },
    });
  };

  useEffect(() => {
    setKeyword('');
    setFaultFocus(null);
    setExpandedRowKeys([]);
    setAddNodeOpen(false);
    addNodeForm.resetFields();
  }, [addNodeForm, selectedClusterKey]);

  useEffect(() => {
    const handleFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ kind?: 'node' | 'network' | 'disk'; nodeKey?: string }>).detail;
      if (!detail?.kind || !detail.nodeKey) return;
      setKeyword('');
      setFaultFocus({ kind: detail.kind, nodeKey: detail.nodeKey });
      setExpandedRowKeys([detail.nodeKey]);
    };

    const handleNodeFocus = (event: Event) => {
      const detail = (event as CustomEvent<{ nodeName: string; cluster?: string }>).detail;
      if (!detail?.nodeName) return;
      setFaultFocus(null);
      setKeyword(detail.nodeName);
      setExpandedRowKeys([`node-${detail.nodeName}`]);
    };

    window.addEventListener('ataas:cluster-node-focus', handleFocus);
    window.addEventListener('ataas:node-focus', handleNodeFocus);
    return () => {
      window.removeEventListener('ataas:cluster-node-focus', handleFocus);
      window.removeEventListener('ataas:node-focus', handleNodeFocus);
    };
  }, []);

  const filteredData = useMemo(() => scopedNodeRows.filter((row) => {
    if (faultFocus) return row.key === faultFocus.nodeKey;
    const text = (row.name + ' ' + row.ip + ' ' + row.clusterName + ' ' + getNodeTags(row).join(' ')).toLowerCase();
    return !keyword || text.includes(keyword.toLowerCase());
  }), [faultFocus, keyword, scopedNodeRows]);

  useEffect(() => {
    const frame = tableFrameRef.current;
    const scrollHost = frame?.querySelector<HTMLElement>('.ant-table-content');
    if (!frame || !scrollHost) return undefined;

    const syncFixedActionShadow = () => {
      const isAtEnd = scrollHost.scrollWidth <= scrollHost.clientWidth + 1
        || scrollHost.scrollLeft + scrollHost.clientWidth >= scrollHost.scrollWidth - 1;
      frame.classList.toggle('is-at-horizontal-scroll-end', isAtEnd);
    };

    const animationFrame = window.requestAnimationFrame(syncFixedActionShadow);
    const resizeObserver = new ResizeObserver(syncFixedActionShadow);
    resizeObserver.observe(scrollHost);
    scrollHost.addEventListener('scroll', syncFixedActionShadow, { passive: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      scrollHost.removeEventListener('scroll', syncFixedActionShadow);
    };
  }, [filteredData.length, selectedClusterKey]);

  const columns: ColumnsType<NodeRow> = [
    { title: '节点', key: 'name', width: 200, render: (_, r) => (
      <div className="node-list-identity">
        <div className="node-list-name-line">
          <strong>{r.name}</strong>
          {(r.status === 'warning' || r.status === 'error') && (
            <Tooltip
              title={r.status === 'error'
                ? '节点存在故障，点击该行查看故障定位'
                : '节点存在告警，点击该行查看详情'}
              placement="top"
            >
              <span className={`node-list-fault-badge is-${r.status}`}>
                <CircleAlert />
                {r.status === 'error' ? '故障' : '告警'}
              </span>
            </Tooltip>
          )}
        </div>
        <span>{r.ip} · {r.clusterName}</span>
      </div>
    ) },
    { title: '角色与标签', key: 'label', width: 180, render: (_, r) => {
      const tags = getNodeTags(r);
      const visibleTags = tags.slice(0, 3);
      const hiddenTags = tags.slice(3);
      return (
        <div className="node-list-tags">
          {visibleTags.map((tag, index) => (
            <span key={tag} className={index === 0 ? 'is-primary' : ''} title={tag}>{tag}</span>
          ))}
          {hiddenTags.length > 0 && (
            <Popover
              trigger="click"
              placement="bottomLeft"
              rootClassName="node-list-tags-popover"
              title={`全部角色与标签（${tags.length}）`}
              content={(
                <div className="node-list-tags-popover-content">
                  {tags.map((tag, index) => (
                    <span key={tag} className={index === 0 ? 'is-primary' : ''}>{tag}</span>
                  ))}
                </div>
              )}
            >
              <button
                type="button"
                className="is-more"
                aria-label={`查看 ${r.name} 的全部角色与标签`}
                onClick={(event) => event.stopPropagation()}
              >
                +{hiddenTags.length}
              </button>
            </Popover>
          )}
        </div>
      );
    } },
    { title: 'CPU / 内存', key: 'compute', width: 320, render: (_, r) => {
      if (r.status === 'pending') return <span className="node-list-awaiting">接入后自动采集</span>;
      const cpuPercent = r.cpu > 0 ? Math.round((r.cpuUsed / r.cpu) * 100) : 0;
      const memoryPercent = Math.round(getCapacityPercent(r.memoryUsed, r.memory));
      return (
        <div className="node-list-resource-stack">
          <div className="node-list-resource-line">
            <span>CPU</span>
            <i><em className={cpuPercent > 80 ? 'is-danger' : cpuPercent > 60 ? 'is-warning' : ''} style={{ width: `${cpuPercent}%` }} /></i>
            <b>{cpuPercent}%</b>
          </div>
          <div className="node-list-resource-line">
            <span>内存</span>
            <i><em className={memoryPercent > 80 ? 'is-danger' : memoryPercent > 60 ? 'is-warning' : ''} style={{ width: `${memoryPercent}%` }} /></i>
            <b>{memoryPercent}%</b>
          </div>
        </div>
      );
    } },
    { title: 'GPU / 显存', key: 'accelerator', width: 250, render: (_, r) => (
      r.status === 'pending'
        ? <span className="node-list-awaiting">待采集</span>
        : (
          <div className="node-list-capacity">
            <div><span>GPU</span><strong>{r.gpu} 张 · {r.gpuCards[0]?.model || '—'}</strong></div>
            <div><span>显存</span><strong>{r.gpuMemoryUsed} / {r.gpuMemory}</strong></div>
          </div>
        )
    ) },
    { title: '本地存储', key: 'disk', width: 180, render: (_, r) => (
      r.status === 'pending'
        ? <span className="node-list-awaiting">待采集</span>
        : (
          <div className="node-list-capacity">
            <div><span>已使用</span><strong>{r.diskUsed}</strong></div>
            <div><span>总容量</span><strong>{r.disk}</strong></div>
          </div>
        )
    ) },
    { title: '状态', key: 'status', width: 112, render: (_, r) => (
      <span className={`node-list-status is-${r.status}`}>
        <i />
        {nodeStatusText[r.status]}
      </span>
    ) },
    { title: '操作', key: 'action', width: 174, fixed: 'right', className: 'node-list-action-cell', render: (_, r) => (
      <div className="node-row-actions" onClick={(event) => event.stopPropagation()}>
        <Tooltip title="执行 Drain，自动迁移业务负载" placement="top">
          <Button
            type="link"
            size="small"
            className="node-row-action is-drain"
            aria-label={`驱散 ${r.name}`}
            icon={<ArrowRightLeft />}
            onClick={() => openDrainNodeConfirm(r)}
          >
            驱散
          </Button>
        </Tooltip>
        <Tooltip title="节点下线并移除，提交前校验运行任务" placement="top">
          <Button
            type="link"
            size="small"
            danger
            className="node-row-action is-danger"
            aria-label={`删除 ${r.name}`}
            icon={<Trash2 />}
            onClick={() => openDeleteNodeConfirm(r)}
          >
            删除
          </Button>
        </Tooltip>
      </div>
    ) },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6951FF' }, components: { Table: { headerBg: '#F7F8FA' } } }}>
      <div className="node-page-shell">
        <div className="node-page-head">
          <div className="node-page-summary">
            <span><small>节点总数</small><b>{scopedNodeRows.length}</b></span>
            <span><small>运行正常</small><b className="is-normal">{normalCount}</b></span>
            <Tooltip title={`故障节点 ${errorCount} 个 · 告警节点 ${warningCount} 个`}>
              <span><small>告警 / 异常</small><b className={abnormalCount ? 'is-error' : ''}>{abnormalCount}</b></span>
            </Tooltip>
            <span><small>GPU 总量</small><b>{totalGpuCount} 张</b></span>
          </div>
        </div>
        <div className="node-table-toolbar">
          <div className="node-table-toolbar-left">
            <Input
              size="small"
              allowClear
              value={keyword}
              onChange={(event) => {
                setFaultFocus(null);
                setKeyword(event.target.value);
              }}
              prefix={<Search className="node-search-icon" />}
              placeholder="搜索节点名称 / IP / 标签"
              className="node-search-input"
              style={{ width: 300 }}
            />
            {faultFocus && (
              <div className="node-focus-path">
                <span>
                  {faultFocus.kind === 'network'
                    ? '网络异常路径'
                    : faultFocus.kind === 'disk'
                      ? '物理盘异常定位'
                      : '节点故障定位'}
                </span>
                <strong>{focusedNode?.name || faultFocus.nodeKey}</strong>
                <button type="button" onClick={() => setFaultFocus(null)}>退出定位</button>
              </div>
            )}
          </div>
          <Button
            type="primary"
            className="node-add-action ataas-page-create-button"
            icon={<PlusOutlined />}
            onClick={() => setAddNodeOpen(true)}
          >
            新增节点
          </Button>
        </div>
        <div ref={tableFrameRef} className="node-table-frame">
          <Table<NodeRow>
            className="node-list-table"
            rowKey="key"
            columns={columns}
            dataSource={filteredData}
            scroll={{ x: 1416 }}
            tableLayout="fixed"
            pagination={{ pageSize: 10, size: 'small', showTotal: (total) => '共 ' + total + ' 个' }}
            rowClassName={(row) => [
              faultFocus?.nodeKey === row.key ? 'node-fault-focus-row' : '',
              expandedRowKeys.includes(row.key) ? 'node-row-expanded' : '',
            ].filter(Boolean).join(' ')}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys.map(String)),
              showExpandColumn: false,
              expandRowByClick: true,
              expandedRowRender: (r) => (
                <NodeExpandContent
                  key={`${r.key}-${faultFocus?.kind || 'default'}`}
                  node={r}
                  initialTab={
                    faultFocus?.kind === 'network'
                      ? '网卡详情'
                      : faultFocus?.kind === 'disk'
                        ? '磁盘详情'
                        : faultFocus?.kind === 'node'
                          ? '故障定位'
                          : 'CPU'
                  }
                />
              ),
              rowExpandable: () => true,
            }}
          />
        </div>
      </div>
      <Drawer
        rootClassName="node-add-drawer"
        title={(
          <div className="node-add-drawer-title">
            <strong>新增节点</strong>
            <span>在当前集群内创建并接入节点</span>
          </div>
        )}
        placement="right"
        open={addNodeOpen}
        onClose={closeAddNodeDrawer}
        width={520}
        footer={(
          <div className="node-add-drawer-footer">
            <Button onClick={closeAddNodeDrawer}>取消</Button>
            <Button type="primary" htmlType="submit" form="node-add-form">创建接入任务</Button>
          </div>
        )}
      >
        <Form
          id="node-add-form"
          form={addNodeForm}
          layout="vertical"
          className="node-add-form"
          initialValues={{
            role: 'worker',
            credential: 'cluster-default-root-key',
          }}
          onFinish={createNodeJoinTask}
        >
          <section className="node-add-section">
            <div className="node-add-section-head">
              <strong>接入配置</strong>
              <span>配置节点与连接信息</span>
            </div>
            <div className="node-add-form-grid">
              <div className="node-add-cluster-context">
                <span>当前集群（默认）</span>
                <strong>{selectedClusterKey}</strong>
              </div>
              <Form.Item label="节点名称" name="name" rules={[{ required: true, message: '请输入节点名称' }]}>
                <Input placeholder="例如：gpu-node-07" />
              </Form.Item>
              <Form.Item label="节点角色" name="role" rules={[{ required: true, message: '请选择节点角色' }]}>
                <Select
                  options={[
                    { value: 'worker', label: '计算节点（Worker）' },
                    { value: 'control-plane', label: '控制节点（Control Plane）' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="管理 IP" name="ip" rules={[{ required: true, message: '请输入管理 IP' }]}>
                <Input placeholder="例如：10.24.18.121" />
              </Form.Item>
              <Form.Item label="SSH 凭据" name="credential" rules={[{ required: true, message: '请选择 SSH 凭据' }]}>
                <Select
                  options={[
                    { value: 'cluster-default-root-key', label: 'cluster-default-root-key' },
                    { value: 'sh-dc-root-key-01', label: 'sh-dc-root-key-01' },
                  ]}
                />
              </Form.Item>
            </div>
            <p className="node-add-credential-note">登录用户、端口和密钥内容继承所选凭据，不会在节点页面重复保存。</p>
          </section>

          <section className="node-add-section">
            <div className="node-add-section-head">
              <strong>可选配置</strong>
              <span>可在接入完成后继续维护</span>
            </div>
            <Form.Item label="节点标签" name="labels" extra="每行一个标签，格式为 key=value">
              <Input.TextArea rows={3} placeholder={'例如：\nzone=shanghai\nworker=high-performance'} />
            </Form.Item>
            <Form.Item label="备注" name="remark">
              <Input.TextArea rows={2} placeholder="补充节点用途或维护说明" />
            </Form.Item>
          </section>
        </Form>
      </Drawer>
    </ConfigProvider>
  );
};

export default ClusterOperationsHomepage;
