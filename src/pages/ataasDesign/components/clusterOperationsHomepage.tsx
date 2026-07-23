import { ExportOutlined, FileTextOutlined, LineChartOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Drawer, Input, Progress, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useRef, useState } from 'react';
import { initializeClusterOperations } from './clusterOperationsRuntime';
import ClusterResourceTables from './clusterResourceTables';
import './clusterOperationsHomepage.less';

const CpuGauge = () => (
  <svg width="100" height="60" viewBox="0 0 120 70" style={{ display: 'block', flexShrink: 0 }}>
    <path d="M 18 55 A 42 42 0 0 1 89.70 25.30" stroke="#52c41a" strokeWidth="13" fill="none" strokeLinecap="butt" />
    <path d="M 89.70 25.30 A 42 42 0 0 1 101.19 46.81" stroke="#fadb14" strokeWidth="13" fill="none" strokeLinecap="butt" />
    <path d="M 101.19 46.81 A 42 42 0 0 1 102 55" stroke="#f5222d" strokeWidth="13" fill="none" strokeLinecap="butt" />
    <line x1="60" y1="55" x2="71.8" y2="22.1" stroke="#1d2129" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="60" cy="55" r="4" fill="#1d2129" />
    <circle cx="60" cy="55" r="1.5" fill="#fff" />
  </svg>
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

const ClusterOperationsHomepage = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootRef.current) initializeClusterOperations(rootRef.current);
  }, []);

  return (
    <div ref={rootRef} className="cluster-operations-homepage">
    <aside className="resource-tree">
      <div className="tree-header"><span className="tree-title">算力中心</span></div>
      <div className="tree-controls">
        <div className="tree-search"><span className="magnify"></span>搜索供应商、数据中心、集群</div>
      </div>
      <div className="tree-scroll" id="resourceTreeContainer">
      </div>
      <div className="tree-footer"><div className="tree-unmanaged"><span>未纳管节点</span><strong>8 台 · 去纳管 →</strong></div></div>
    </aside>

    <section className="workspace">

      <main className="content">
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
          <div className="module-tab active" data-view="overview">总览</div>
          <div className="module-tab" data-view="nodes" title="Kubernetes Node对象及Ready、压力和调度状态">节点</div>
          <div className="module-tab" data-view="workloads" title="Deployment、StatefulSet、DaemonSet、Job和CronJob等工作负载">Groups</div>
          <div className="module-tab" data-view="pods" title="Pod运行阶段、容器状态、重启和调度情况">Pods</div>
          <div className="module-tab" data-view="services" title="展示后端运行在上海资源段的Services；ServiceEntry为集群级配置">Services</div>
          <div className="module-tab" data-view="serviceentry" title="K8s ServiceEntry资源，用于定义网格出口流量规则">ServiceEntry</div>
          <div className="module-tab" data-view="pv" title="PersistentVolume资源状态">PV</div>
          <div className="module-tab" data-view="pvc" title="PersistentVolumeClaim资源状态">PVC</div>
	        </nav>

        <div className="overview-view">
        <div className="overview-card-grid">

            <div className="overview-item overview-fault">
              <div className="overview-fault-head"><span className="overview-title">告警</span><span className="overview-fault-link" style={{ fontSize: 12 }}>查看 →</span></div>
              <div className="overview-fault-stats">
                <div className="overview-fault-stat critical">
                  <span className="overview-fault-stat-value">5</span>
                  <span className="overview-fault-stat-label">严重告警</span>
                </div>
                <div className="overview-fault-stat warning">
                  <span className="overview-fault-stat-value">7</span>
                  <span className="overview-fault-stat-label">普通</span>
                </div>
                <div className="overview-fault-stat info">
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
                      <svg width="6" height="6" viewBox="0 0 6 6" style={{ display: 'block', flexShrink: 0, margin: '1px 0 0 8px' }}><circle cx="3" cy="3" r="3" fill={fault.severity === 'critical' ? '#f53f3f' : '#ff7d00'} /></svg>
                      <span className="overview-fault-title">{fault.title}</span>
                      <span className="overview-fault-context">{fault.time}</span>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="overview-card-side">
            <div className="overview-item overview-cpu">
              <div className="overview-item-head"><span className="overview-title">CPU</span><span className="overview-head-info">共2317核(5.63 THz) <ExportOutlined /></span></div>
              <div className="overview-value"><span className="overview-value-group">61%<div className="overview-value-label">CPU使用率</div></span><span className="overview-value-group"><CpuGauge /><div className="overview-value-label gauge-label">1,824/2,432 Core</div></span></div>
            </div>
            <div className="overview-item overview-storage">
              <div className="overview-item-head"><span className="overview-title">存储</span></div>
              <div className="storage-progress-bar">
                <div className="storage-progress-segment storage-progress-used" style={{ width: '50%' }} />
                <div className="storage-progress-segment storage-progress-failed" style={{ width: '10%' }} />
                <div className="storage-progress-segment storage-progress-free" style={{ flex: 1 }} />
              </div>
              <div className="overview-sub">
                <div className="storage-stat-row"><span className="storage-stat-label"><span className="storage-stat-dot" style={{ visibility: 'hidden' }} />总容量</span><span className="storage-stat-value">840TiB</span><span className="storage-stat-pct">100%</span></div>
                <div className="storage-stat-row"><span className="storage-stat-label"><span className="storage-stat-dot" style={{ background: '#2468F2' }} />已使用</span><span className="storage-stat-value">420TiB</span><span className="storage-stat-pct">50%</span></div>
                <div className="storage-stat-row"><span className="storage-stat-label"><span className="storage-stat-dot" style={{ background: '#8c8c8c' }} />失效</span><span className="storage-stat-value">84TiB</span><span className="storage-stat-pct">10%</span></div>
                <div className="storage-stat-row"><span className="storage-stat-label"><span className="storage-stat-dot" style={{ background: '#e8e8e8' }} />空闲</span><span className="storage-stat-value">336TiB</span><span className="storage-stat-pct">40%</span></div>
              </div>
            </div>
            <div className="overview-item overview-mem">
              <div className="overview-item-head"><span className="overview-title">内存</span><span className="overview-head-info">共 21.0TiB</span></div>
              <div className="mem-pct">
                <span className="mem-pct-value">71%</span>
                <span className="mem-pct-label">内存使用率</span>
              </div>
              <div className="mem-content">
                <div className="mem-stats">
                  <div className="mem-stat-row"><span className="mem-stat-dot" style={{ background: '#8c8c8c' }} /><span className="mem-stat-label">可分配</span><span className="mem-stat-value">21.0TiB</span></div>
                  <div className="mem-stat-row"><span className="mem-stat-dot" style={{ background: '#52c41a' }} /><span className="mem-stat-label">活跃分配</span><span className="mem-stat-value">15.0TiB</span></div>
                  <div className="mem-stat-row"><span className="mem-stat-dot" style={{ background: '#fadb14' }} /><span className="mem-stat-label">系统占用</span><span className="mem-stat-value">2.0TiB</span></div>
                </div>
                <div className="mem-vertical-bar">
                  <div className="mem-vbar-segment" style={{ height: '71%', background: '#52c41a' }} />
                  <div className="mem-vbar-segment" style={{ height: '10%', background: '#fadb14' }} />
                  <div className="mem-vbar-segment" style={{ flex: 1, background: '#e8e8e8' }} />
                </div>
              </div>
            </div>
            <div className="overview-item overview-disk">
              <div className="overview-item-head"><span className="overview-title">物理盘</span><span className="overview-head-info">共36块</span></div>
              <div className="overview-sub">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <img src="/ssd-icon.png" width="50" height="50" alt="" />
                  <div><b>24块</b> SSD  <svg width="8" height="8" viewBox="0 0 8 8" style={{ verticalAlign: 'middle', marginRight: 2, marginTop: -2 }}><circle cx="4" cy="4" r="4" fill="#00b42a" /></svg>正常 22块 <span className="bad">异常 2块</span></div>
                </div>
                <div style={{ height: 1, background: '#f0f0f0', margin: '6px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                  <img src="/hdd-icon.png" width="50" height="50" alt="" />
                  <div><b>12块</b> HDD  <svg width="8" height="8" viewBox="0 0 8 8" style={{ verticalAlign: 'middle', marginRight: 2, marginTop: -2 }}><circle cx="4" cy="4" r="4" fill="#00b42a" /></svg>正常 12块</div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <div className="metric-grid">
            <div className="metric-left">
              <div className="overview-item" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="overview-item-head"><span className="overview-title">节点</span><span className="overview-head-info">共3台机器 <span style={{ color: '#6951ff', marginLeft: 8, cursor: 'pointer' }}>查看 →</span></span></div>
                <div className="overview-value" style={{ flex: 1, justifyContent: 'center', gap: 0 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00b42a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
                      <span>2</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#86909c' }}>正常</span>
                  </div>
                  <div style={{ width: 1, background: '#f0f0f0', alignSelf: 'stretch', margin: '4px 0' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f53f3f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                      <span style={{ fontSize: 28, fontWeight: 650, lineHeight: 1.2, color: '#f53f3f' }}>1</span>
                    </div>
                    <span style={{ fontSize: 11, color: '#86909c' }}>异常</span>
                  </div>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-item-head"><span className="overview-title">网络</span></div>
                <div className="overview-sub" style={{ padding: '6px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 12px', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: '#86909c', gridColumn: '1 / -1' }}>RDMA</div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>1024</div><div style={{ fontSize: 11, color: '#86909c' }}>总量</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>99.4%</div><div style={{ fontSize: 11, color: '#86909c' }}>健康率</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2, color: '#f53f3f' }}>6</div><div style={{ fontSize: 11, color: '#86909c' }}>异常</div></div>
                  </div>
                  <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 12px', marginTop: 12 }}>
                    <div style={{ fontSize: 11, color: '#86909c', gridColumn: '1 / -1' }}>网卡</div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>1024</div><div style={{ fontSize: 11, color: '#86909c' }}>总量</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>99.6%</div><div style={{ fontSize: 11, color: '#86909c' }}>健康率</div></div>
                    <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2, color: '#f53f3f' }}>4</div><div style={{ fontSize: 11, color: '#86909c' }}>异常</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="metric-mid">
              <div className="overview-item">
                <div className="overview-item-head"><span className="overview-title">GPU</span><span className="overview-head-info">共512卡</span></div>
                <div className="overview-sub" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '8px 0' }}>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>512</div><div style={{ fontSize: 11, color: '#86909c' }}>GPU 总量（张）</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>508</div><div style={{ fontSize: 11, color: '#86909c' }}>在线 GPU（张）</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>76%</div><div style={{ fontSize: 11, color: '#86909c' }}>GPU 利用率</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>99.2%</div><div style={{ fontSize: 11, color: '#86909c' }}>GPU 健康率</div></div>
                </div>
              </div>
              <div className="overview-item">
                <div className="overview-item-head"><span className="overview-title">显存</span></div>
                <div className="overview-sub" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', padding: '8px 0' }}>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>40</div><div style={{ fontSize: 11, color: '#86909c' }}>显存总量（TB）</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>32</div><div style={{ fontSize: 11, color: '#86909c' }}>已使用显存（TB）</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2 }}>80%</div><div style={{ fontSize: 11, color: '#86909c' }}>显存利用率</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 650, lineHeight: 1.2, color: '#f53f3f' }}>3</div><div style={{ fontSize: 11, color: '#86909c' }}>OOM 次数</div></div>
                </div>
              </div>
            </div>
            <div className="overview-item metric-log">
              <div className="overview-item-head"><span className="overview-title">操作日志</span></div>
              <div className="overview-sub" style={{ fontSize: 11, gap: 6 }}>
                <span><span style={{ color: '#86909c' }}>07-22 14:23</span> 节点 gpu-node-07 已标记为维护状态</span>
                <span><span style={{ color: '#86909c' }}>07-22 11:05</span> 资源段扩容 · 新增 2 台 Worker 节点</span>
                <span><span style={{ color: '#86909c' }}>07-21 18:42</span> GPU 驱动升级 v550.127.05 → v550.144.03</span>
                <span><span style={{ color: '#86909c' }}>07-21 09:30</span> 节点 gpu-node-12 触发 DiskPressure 告警</span>
                <span><span style={{ color: '#86909c' }}>07-20 22:15</span> 平台组件 Node Agent 批量下发完成</span>
              </div>
            </div>
          </div>
        </div>

        <section className="nodes-view">
          <NodeTable />
        </section>

        <section className="workloads-view">
          <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
            <div>
              <div className="ataas-cm-toolbar" style={{ border: 'none', padding: '8px 0' }}>
                <div style={{ flex: 1 }} />
                <Input.Search size="small" allowClear placeholder="搜索 Workload" style={{ width: 320 }} />
              </div>
              <Table
                rowKey="key"
                columns={[
                  { title: '名称', dataIndex: 'name', key: 'name', width: 200, fixed: 'left', render: (v: string) => <strong className="ataas-cm-name">{v}</strong> },
                  { title: '类型', dataIndex: 'kind', key: 'kind', width: 120 },
                  { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
                  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
                  { title: '副本', dataIndex: 'replicas', key: 'replicas', width: 100 },
                  { title: '创建时间', dataIndex: 'age', key: 'age', width: 150 },
                ]}
                dataSource={[
                  { key: '1', name: 'payment-api', kind: 'Deployment', namespace: 'payment', status: '需关注', replicas: '3/5', age: '2026-05-18 14:22' },
                  { key: '2', name: 'model-cache', kind: 'StatefulSet', namespace: 'inference', status: '需关注', replicas: '2/3', age: '2026-06-01 09:15' },
                  { key: '3', name: 'training-worker', kind: 'Deployment', namespace: 'training', status: '更新中', replicas: '10/12', age: '2026-06-10 11:30' },
                  { key: '4', name: 'dataset-index', kind: 'Job', namespace: 'data-pipeline', status: '执行中', replicas: '18/24', age: '2026-06-15 08:00' },
                  { key: '5', name: 'order-api', kind: 'Deployment', namespace: 'order', status: '正常', replicas: '8/8', age: '2026-05-01 10:00' },
                  { key: '6', name: 'node-exporter', kind: 'DaemonSet', namespace: 'monitoring', status: '正常', replicas: '78/78', age: '2026-04-20 16:00' },
                  { key: '7', name: 'nightly-report', kind: 'CronJob', namespace: 'ops', status: '正常', replicas: '-', age: '2026-06-01 00:00' },
                ]}
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 10, showTotal: (total: number) => '共 ' + total + ' 条' }}
              />
            </div>
          </ConfigProvider>
        </section>
        <section className="pods-view">
          <ClusterResourceTables view="pod" />
        </section>

        <section className="services-view">
          <ClusterResourceTables view="svc" />
        </section>

        <section className="serviceentry-view">
          <ClusterResourceTables view="se" />
        </section>

        <section className="pv-view">
          <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
            <Table dataSource={[]} columns={[
              { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
              { title: '容量', dataIndex: 'capacity', key: 'capacity', width: 120 },
              { title: '存储类型', dataIndex: 'storageType', key: 'storageType', width: 120 },
              { title: '访问模式', dataIndex: 'accessMode', key: 'accessMode', width: 120 },
              { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
              { title: '回收策略', dataIndex: 'reclaimPolicy', key: 'reclaimPolicy', width: 100 },
              { title: '创建时间', dataIndex: 'age', key: 'age', width: 150 },
            ]} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }} locale={{ emptyText: '暂无 PV 数据' }} />
          </ConfigProvider>
        </section>
        <section className="pvc-view">
          <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
            <Table dataSource={[]} columns={[
              { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
              { title: '命名空间', dataIndex: 'namespace', key: 'namespace', width: 120 },
              { title: '容量请求', dataIndex: 'requestCapacity', key: 'requestCapacity', width: 120 },
              { title: '存储类', dataIndex: 'storageClass', key: 'storageClass', width: 120 },
              { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
              { title: '绑定 PV', dataIndex: 'boundPV', key: 'boundPV', width: 150 },
              { title: '创建时间', dataIndex: 'age', key: 'age', width: 150 },
            ]} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 条' }} locale={{ emptyText: '暂无 PVC 数据' }} />
          </ConfigProvider>
        </section>
      </main>
    </section>

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
  status: 'normal' | 'warning' | 'error';
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
  disks: Array<{ name: string; total: string; used: string; type: string; mountPath: string; status: string; readSpeed: string; writeSpeed: string; iops: string; latency: string; readPressure: number; writePressure: number }>;
  networkCards: Array<{ name: string; ip: string; speed: string; status: string; type: string; mac: string; driver: string; pcie: string; linkStatus: string; duplex: string; lossRate: string; errors: number; inbound: string; outbound: string; bandwidthUtil: number; pps: string; tcpConns: number; avgLatency: string; connStatus: string }>;
  pods: Array<{ name: string; status: string; namespace: string; ready: string }>;
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

const nodeTabs = ['CPU', '内存', 'GPU', '磁盘详情', '网卡详情', 'Pods列表'];

const mockKernelLogs = (label: string) => [
  `[${new Date().toLocaleString()}] kernel: ${label} - NVRM: GPU at PCI:0000:01:00.0 is OK`,
  `[${new Date().toLocaleString()}] kernel: ${label} - mlx5_core 0000:3b:00.0: Link up, 100Gbps, full duplex`,
  `[${new Date().toLocaleString()}] kernel: ${label} - nvidia-nvlink: link 0 enabled, speed 400 GB/s`,
  `[${new Date().toLocaleString()}] kernel: ${label} - x86/split lock detection: #AC: process took a split lock`,
  `[${new Date().toLocaleString()}] kernel: ${label} - nvme nvme0: new device found, PCI:0000:02:00.0`,
  `[${new Date().toLocaleString()}] kernel: ${label} - scsi 0:0:0:0: Direct-Access NVMe SSD 3.86TB`,
  `[${new Date().toLocaleString()}] kernel: ${label} - NETDEV: eth0: link becomes ready`,
  `[${new Date().toLocaleString()}] kernel: ${label} - CPU: frequency scaling enabled (governor: performance)`,
  `[${new Date().toLocaleString()}] kernel: ${label} - EDAC sbridge: S0 is ready`,
  `[${new Date().toLocaleString()}] kernel: ${label} - ACPI: button: Power button pressed - entering sleep`,
];

const DiskDetailDrawer = ({ disk, open, onClose }: { disk: { name: string; total: string; used: string; type: string; mountPath: string; status: string; readSpeed: string; writeSpeed: string; iops: string; latency: string; readPressure: number; writePressure: number } | null; open: boolean; onClose: () => void }) => {
  if (!disk) return null;
  const totalGB = parseFloat(disk.total);
  const usedGB = parseFloat(disk.used);
  const freeGB = totalGB - usedGB;
  const usagePct = totalGB > 0 ? Math.round((usedGB / totalGB) * 100) : 0;
  const barColor = usagePct > 90 ? '#F53F3F' : usagePct > 80 ? '#FF7D00' : '#16A34A';
  const isHealthy = disk.status === 'normal';
  const statusColor = isHealthy ? '#16A34A' : '#F53F3F';
  const Row = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F4F7', fontSize: 13, lineHeight: '22px' }}>
      <span style={{ color: '#667085' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || '#111827' }}>{value}</span>
    </div>
  );
  const GroupTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', padding: '4px 0 2px' }}>{title}</div>
  );
  return (
    <Drawer title={<span style={{ fontSize: 18, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace' }}>{disk.name}</span>} placement="right" open={open} onClose={onClose} closable width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding: '24px 28px', gap: 4 }}>
        <GroupTitle title="基础信息" />
        <Row label="类型" value={disk.type || 'NVMe SSD'} />
        <Row label="节点" value="qujing4" />
        <Row label="挂载路径" value={disk.mountPath} />
        <Row label="状态" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />{isHealthy ? '正常' : '异常'}</span>} color={statusColor} />
        <Row label="文件系统" value="ext4" />
        <Row label="角色" value="数据盘" />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="磁盘使用情况" />
        <Row label="总容量" value={`${totalGB.toFixed(2)} TB`} />
        <Row label="已使用" value={`${usedGB.toFixed(2)} TB`} />
        <Row label="可用" value={`${freeGB.toFixed(2)} TB`} />
        <Row label="使用率" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 60, height: 6, borderRadius: 3, background: '#E5E7EB', display: 'inline-block', overflow: 'hidden', verticalAlign: 'middle' }}><span style={{ width: usagePct + '%', height: '100%', borderRadius: 3, background: barColor, display: 'block' }} /></span>{usagePct}%</span>} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="性能指标" />
        <Row label="读取" value={disk.readSpeed} />
        <Row label="写入" value={disk.writeSpeed} />
        <Row label="IOPS" value={disk.iops} />
        <Row label="延迟" value={disk.latency} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="I/O 压力" />
        <Row label="读取压力" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 60, height: 6, borderRadius: 3, background: '#E5E7EB', display: 'inline-block', overflow: 'hidden' }}><span style={{ width: disk.readPressure + '%', height: '100%', borderRadius: 3, background: '#635BFF', display: 'block' }} /></span>{disk.readPressure}%</span>} />
        <Row label="写入压力" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 60, height: 6, borderRadius: 3, background: '#E5E7EB', display: 'inline-block', overflow: 'hidden' }}><span style={{ width: disk.writePressure + '%', height: '100%', borderRadius: 3, background: '#667085', display: 'block' }} /></span>{disk.writePressure}%</span>} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <div style={{ padding: '16px 0 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>IO 趋势</span>
            <span style={{ fontSize: 11, color: '#98A2B3' }}>最近 24 小时</span>
          </div>
          <svg width="100%" height="70" viewBox="0 0 380 70" style={{ display: 'block' }}>
            <polyline points="0,60 30,56 60,58 90,46 120,40 150,36 180,38 210,28 240,24 270,32 300,30 340,26 380,28" fill="none" stroke="#635BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,60 30,56 60,58 90,46 120,40 150,36 180,38 210,28 240,24 270,32 300,30 340,26 380,28" fill="url(#tG)" opacity="0.1" />
            <defs><linearGradient id="tG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#635BFF" /><stop offset="100%" stopColor="#635BFF" stopOpacity="0" /></linearGradient></defs>
            <text x="0" y="15" style={{ fontSize: 9, fill: '#98A2B3' }}>Throughput</text>
          </svg>
          <svg width="100%" height="70" viewBox="0 0 380 70" style={{ display: 'block', marginTop: 4 }}>
            <polyline points="0,64 30,60 60,62 90,50 120,44 150,38 180,40 210,32 240,20 270,24 300,22 340,18 380,21" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,64 30,60 60,62 90,50 120,44 150,38 180,40 210,32 240,20 270,24 300,22 340,18 380,21" fill="url(#lG)" opacity="0.1" />
            <defs><linearGradient id="lG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" /><stop offset="100%" stopColor="#16A34A" stopOpacity="0" /></linearGradient></defs>
            <text x="0" y="15" style={{ fontSize: 9, fill: '#98A2B3' }}>Latency</text>
          </svg>
        </div>
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
  nodeName: string; nodeRole: string; runningPods: number; services: string;
};

const NetDetailDrawer = ({ card, open, onClose }: { card: NetCardDetail | null; open: boolean; onClose: () => void }) => {
  if (!card) return null;
  const isActive = card.status === 'active';
  const Row = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F4F7', fontSize: 13, lineHeight: '22px' }}>
      <span style={{ color: '#667085' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || '#111827' }}>{value}</span>
    </div>
  );
  const GroupTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', padding: '4px 0 2px' }}>{title}</div>
  );
  const bwColor = card.bandwidthUtil > 80 ? '#F53F3F' : card.bandwidthUtil > 60 ? '#FF7D00' : '#16A34A';
  return (
    <Drawer placement="right" open={open} onClose={onClose} closable width={480}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 0', borderTop: 'none' }}>
          <Button icon={<LineChartOutlined />} style={{ fontSize: 13 }}>查看监控</Button>
          <Button type="primary" icon={<SettingOutlined />} style={{ fontSize: 13 }}>更多操作</Button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding: '0 28px' }}>
        {/* Top identity area */}
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#98A2B3', letterSpacing: '1px', marginBottom: 8 }}>NETWORK</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace', marginBottom: 8 }}>{card.name}</div>
          <div style={{ fontSize: 12, color: '#98A2B3', marginBottom: 14 }}>
            {card.type} <span style={{ margin: '0 6px', color: '#D0D5DD' }}>·</span> {card.nodeName} <span style={{ margin: '0 6px', color: '#D0D5DD' }}>·</span> 业务网络
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 8px', background: isActive ? '#F0FDF4' : '#FEF2F2', borderRadius: 20 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#16A34A' : '#F53F3F', display: 'inline-block' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#16A34A' : '#F53F3F' }}>{isActive ? '正常' : '异常'}</span>
          </div>
        </div>

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="基础信息" />
        <Row label="网卡名称" value={card.name} />
        <Row label="接口类型" value={card.type} />
        <Row label="IP地址" value={card.ip} />
        <Row label="MAC地址" value={card.mac} />
        <Row label="节点" value={card.nodeName} />
        <Row label="速率" value={card.speed} />
        <Row label="驱动" value={card.driver} />
        <Row label="PCIe位置" value={card.pcie} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="链路状态" />
        <Row label="Link状态" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: card.linkStatus === 'UP' ? '#16A34A' : '#F53F3F', display: 'inline-block' }} />{card.linkStatus}</span>} />
        <Row label="协商速率" value={card.speed} />
        <Row label="双工模式" value={card.duplex} />
        <Row label="丢包率" value={card.lossRate} />
        <Row label="错误包数量" value={card.errors.toString()} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="实时流量" />
        <div style={{ display: 'flex', gap: 40, padding: '16px 0 8px' }}>
          <div>
            <div style={{ fontSize: 11, color: '#98A2B3', marginBottom: 4 }}>入方向</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace' }}>{card.inbound}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#98A2B3', marginBottom: 4 }}>出方向</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace' }}>{card.outbound}</div>
          </div>
        </div>
        <Row label="带宽利用率" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 80, height: 6, borderRadius: 3, background: '#E5E7EB', display: 'inline-block', overflow: 'hidden' }}><span style={{ width: card.bandwidthUtil + '%', height: '100%', borderRadius: 3, background: bwColor, display: 'block' }} /></span><span style={{ fontWeight: 700, color: bwColor }}>{card.bandwidthUtil}%</span></span>} />

        <div style={{ padding: '8px 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#98A2B3' }}>24 小时流量趋势</span>
          </div>
          <svg width="100%" height="56" viewBox="0 0 380 56" style={{ display: 'block' }}>
            <defs>
              <linearGradient id="niG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#635BFF" /><stop offset="100%" stopColor="#635BFF" stopOpacity="0" /></linearGradient>
              <linearGradient id="noG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" /><stop offset="100%" stopColor="#16A34A" stopOpacity="0" /></linearGradient>
            </defs>
            <polyline points="0,52 20,48 40,44 60,40 80,42 100,38 120,34 140,30 160,28 180,24 200,22 220,18 240,14 260,16 280,12 300,10 320,6 340,4 360,3 380,2" fill="none" stroke="#635BFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,52 20,48 40,44 60,40 80,42 100,38 120,34 140,30 160,28 180,24 200,22 220,18 240,14 260,16 280,12 300,10 320,6 340,4 360,3 380,2" fill="url(#niG)" opacity="0.08" />
            <polyline points="0,55 20,52 40,48 60,44 80,46 100,42 120,36 140,34 160,30 180,28 200,24 220,22 240,20 260,22 280,18 300,16 320,12 340,8 360,6 380,5" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
            <polyline points="0,55 20,52 40,48 60,44 80,46 100,42 120,36 140,34 160,30 180,28 200,24 220,22 240,20 260,22 280,18 300,16 320,12 340,8 360,6 380,5" fill="url(#noG)" opacity="0.06" />
            <text x="0" y="8" style={{ fontSize: 9, fill: '#98A2B3' }}>入方向</text>
            <text x="56" y="8" style={{ fontSize: 9, fill: '#98A2B3' }}>出方向</text>
          </svg>
        </div>

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="网络性能" />
        <Row label="PPS" value={card.pps} />
        <Row label="TCP连接数" value={card.tcpConns.toLocaleString()} />
        <Row label="平均延迟" value={card.avgLatency} />
        <Row label="连接状态" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: card.connStatus === '正常' ? '#16A34A' : '#F53F3F', display: 'inline-block' }} />{card.connStatus}</span>} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

        <GroupTitle title="关联资源" />
        <Row label="运行Pod" value={card.runningPods.toString()} />
        <Row label="访问服务" value={card.services} />
        <Row label="节点角色" value={card.nodeRole} />

        <div style={{ height: 24 }} />
      </div>
    </Drawer>
  );
};

type RdmaCardDetail = {
  name: string; ip: string; speed: string; status: string;
  type: string; mac: string; driver: string; pcie: string;
  linkStatus: string; duplex: string; lossRate: string; errors: number;
  inbound: string; outbound: string; bandwidthUtil: number;
  pps: string; tcpConns: number; avgLatency: string; connStatus: string;
  nodeName: string; nodeRole: string; runningPods: number; services: string;
  firmware: string; port: string; linkHealth: string;
  errorCount: number; retransmitCount: number;
  throughput: string; sendRate: string; recvRate: string;
  gpuDirectRdma: boolean; ncclStatus: string;
  commLatency: string; p99Latency: string; commErrors: number;
  rdmaHealth: string; linkErrors: number; dropCount: number; flitErrors: number;
};

const RdmaDetailDrawer = ({ card, open, onClose }: { card: RdmaCardDetail | null; open: boolean; onClose: () => void }) => {
  if (!card) return null;
  const isActive = card.status === 'active';
  const Row = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F2F4F7', fontSize: 13, lineHeight: '22px' }}>
      <span style={{ color: '#667085' }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || '#111827' }}>{value}</span>
    </div>
  );
  const GroupTitle = ({ title }: { title: string }) => (
    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', padding: '4px 0 2px' }}>{title}</div>
  );
  return (
    <Drawer placement="right" open={open} onClose={onClose} closable width={480}
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 0', borderTop: 'none' }}>
          <Button icon={<LineChartOutlined />} style={{ fontSize: 13 }}>查看监控</Button>
          <Button icon={<ExportOutlined />} style={{ fontSize: 13 }}>诊断链路</Button>
          <Button type="primary" icon={<SettingOutlined />} style={{ fontSize: 13 }}>更多操作</Button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', padding: '0 28px' }}>
        <div style={{ padding: '8px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: '1.5px', marginBottom: 8 }}>RDMA NETWORK</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace' }}>{card.name}</span>
            <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, background: '#F5F3FF', padding: '2px 8px', borderRadius: 4 }}>{card.speed}</span>
          </div>
          <div style={{ fontSize: 12, color: '#98A2B3', marginBottom: 14 }}>
            {card.type} <span style={{ margin: '0 6px', color: '#D0D5DD' }}>·</span> {card.nodeName} <span style={{ margin: '0 6px', color: '#D0D5DD' }}>·</span> GPU通信网络
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px 4px 8px', background: isActive ? '#F0FDF4' : '#FEF2F2', borderRadius: 20 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? '#16A34A' : '#F53F3F', display: 'inline-block' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#16A34A' : '#F53F3F' }}>{isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="设备信息" />
        <Row label="接口类型" value={card.type} />
        <Row label="设备名称" value={card.driver} />
        <Row label="PCIe位置" value={card.pcie} />
        <Row label="固件版本" value={card.firmware} />
        <Row label="端口" value={card.port} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="RDMA链路状态" />
        <Row label="Link状态" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16A34A', fontWeight: 700 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />{card.linkStatus}</span>} />
        <Row label="速率" value={card.speed} />
        <Row label="链路健康率" value={<span style={{ color: '#16A34A' }}>{card.linkHealth}</span>} />
        <Row label="错误计数" value={card.errorCount.toString()} />
        <Row label="重传次数" value={card.retransmitCount.toString()} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="RDMA性能" />
        <div style={{ display: 'flex', gap: 40, padding: '16px 0 8px' }}>
          <div>
            <div style={{ fontSize: 11, color: '#98A2B3', marginBottom: 4 }}>带宽利用率</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: card.bandwidthUtil > 80 ? '#F53F3F' : '#7C3AED', fontFamily: 'SF Mono, Menlo, monospace' }}>{card.bandwidthUtil}%</span>
            </div>
            <div style={{ width: 80, height: 4, borderRadius: 2, background: '#E5E7EB', marginTop: 4, overflow: 'hidden' }}>
              <span style={{ width: card.bandwidthUtil + '%', height: '100%', borderRadius: 2, background: card.bandwidthUtil > 80 ? '#F53F3F' : '#7C3AED', display: 'block' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#98A2B3', marginBottom: 4 }}>当前吞吐</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', fontFamily: 'SF Mono, Menlo, monospace' }}>{card.throughput}</div>
          </div>
        </div>
        <Row label="发送速率" value={card.sendRate} />
        <Row label="接收速率" value={card.recvRate} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="GPU通信状态" />
        <Row label="GPU Direct RDMA" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16A34A', fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />{card.gpuDirectRdma ? '已开启' : '未开启'}</span>} />
        <Row label="NCCL通信状态" value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: card.ncclStatus === '正常' ? '#16A34A' : '#F53F3F' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: card.ncclStatus === '正常' ? '#16A34A' : '#F53F3F', display: 'inline-block' }} />{card.ncclStatus}</span>} />
        <Row label="通信延迟" value={card.commLatency} />
        <Row label="P99延迟" value={card.p99Latency} />
        <Row label="通信错误" value={card.commErrors.toString()} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="网络健康" />
        <Row label="RDMA健康率" value={<span style={{ color: '#16A34A', fontWeight: 700 }}>{card.rdmaHealth}</span>} />
        <Row label="链路异常" value={card.linkErrors.toString()} />
        <Row label="丢包" value={card.dropCount.toString()} />
        <Row label="Flit错误" value={card.flitErrors.toString()} />

        <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />
        <GroupTitle title="趋势监控" />
        <div style={{ padding: '8px 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>RDMA 带宽趋势</span>
            <span style={{ fontSize: 10, color: '#98A2B3' }}>最近 24 小时</span>
          </div>
          <svg width="100%" height="60" viewBox="0 0 380 60" style={{ display: 'block' }}>
            <defs><linearGradient id="rdmaBw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#7C3AED" stopOpacity="0" /></linearGradient></defs>
            <polyline points="0,56 20,52 40,48 60,44 80,46 100,42 120,36 140,30 160,28 180,24 200,22 220,18 240,14 260,16 280,12 300,10 320,6 340,4 360,3 380,2" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,56 20,52 40,48 60,44 80,46 100,42 120,36 140,30 160,28 180,24 200,22 220,18 240,14 260,16 280,12 300,10 320,6 340,4 360,3 380,2" fill="url(#rdmaBw)" opacity="0.08" />
            <text x="0" y="8" style={{ fontSize: 9, fill: '#98A2B3' }}>带宽</text>
          </svg>
        </div>
        <div style={{ padding: '0 0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827' }}>通信延迟趋势</span>
            <span style={{ fontSize: 10, color: '#98A2B3' }}>最近 24 小时</span>
          </div>
          <svg width="100%" height="60" viewBox="0 0 380 60" style={{ display: 'block' }}>
            <defs><linearGradient id="rdmaLat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16A34A" /><stop offset="100%" stopColor="#16A34A" stopOpacity="0" /></linearGradient></defs>
            <polyline points="0,10 20,12 40,14 60,16 80,14 100,18 120,20 140,22 160,24 180,26 200,28 220,30 240,32 260,34 280,36 300,38 320,40 340,42 360,44 380,46" fill="none" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="0,10 20,12 40,14 60,16 80,14 100,18 120,20 140,22 160,24 180,26 200,28 220,30 240,32 260,34 280,36 300,38 320,40 340,42 360,44 380,46" fill="url(#rdmaLat)" opacity="0.08" />
            <text x="0" y="8" style={{ fontSize: 9, fill: '#98A2B3' }}>延迟</text>
          </svg>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </Drawer>
  );
};


const NodeExpandContent = ({ node }: { node: NodeRow }) => {
  const [activeTab, setActiveTab] = useState(nodeTabs[0]);
  const [diskDetail, setDiskDetail] = useState<{ name: string; total: string; used: string; type: string; mountPath: string; status: string; readSpeed: string; writeSpeed: string; iops: string; latency: string; readPressure: number; writePressure: number } | null>(null);
  const [netDetail, setNetDetail] = useState<NetCardDetail | null>(null);
  const [rdmaDetail, setRdmaDetail] = useState<RdmaCardDetail | null>(null);
  const [gpuDetail, setGpuDetail] = useState<{ index: number; model: string; spec: string; memoryTotal: string; memoryUsed: string; memoryFree: string; utilization: number; power: number; temperature: number; status: string } | null>(null);
  const [logDetail, setLogDetail] = useState<{ title: string; logs: string[] } | null>(null);

  const cpuUtil = node.cpu > 0 ? Math.round((node.cpuUsed / node.cpu) * 100) : 0;
  const memUtil = getCapacityPercent(node.memoryUsed, node.memory);
  const renderTabBar = () => (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E5E6EB', marginBottom: 16 }}>
      {nodeTabs.map((tab) => (
        <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{ padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: activeTab === tab ? '#6738E8' : '#4E5969', fontWeight: activeTab === tab ? 600 : 400, borderBottom: activeTab === tab ? '2px solid #6738E8' : '2px solid transparent', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', whiteSpace: 'nowrap' }}>{tab}</button>
      ))}
    </div>
  );

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
      <div>
        {renderTabBar()}
        <div style={{ display: 'flex', gap: 32, padding: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="65" fill="none" stroke="#E5E6EB" strokeWidth="12" />
              <circle cx="80" cy="80" r="65" fill="none" stroke={cpuUtil > 80 ? '#F53F3F' : cpuUtil > 60 ? '#FF7D00' : '#4C6EF5'} strokeWidth="12" strokeDasharray="408.4" strokeDashoffset={408.4 - (408.4 * Math.min(Math.max(cpuUtil, 0), 100)) / 100} strokeLinecap="round" transform="rotate(-90 80 80)" />
              <text x="80" y="74" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 700, fill: '#1d2129' }}>{cpuUtil}%</text>
              <text x="80" y="100" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: '#86909c' }}>CPU利用率</text>
            </svg>
            <div style={{ fontSize: 12, color: '#4E5969' }}>{node.cpuUsed} / {node.cpu} Core</div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px', fontSize: 13 }}>
            {items.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909c' }}>{item.label}</span>
                <strong style={{ color: '#1d2129' }}>{item.value}</strong>
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
      <div>
        {renderTabBar()}
        <div style={{ display: 'flex', gap: 32, padding: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="65" fill="none" stroke="#E5E6EB" strokeWidth="12" />
              <circle cx="80" cy="80" r="65" fill="none" stroke={memUtil > 80 ? '#F53F3F' : memUtil > 60 ? '#FF7D00' : '#4C6EF5'} strokeWidth="12" strokeDasharray="408.4" strokeDashoffset={408.4 - (408.4 * Math.min(Math.max(memUtil, 0), 100)) / 100} strokeLinecap="round" transform="rotate(-90 80 80)" />
              <text x="80" y="74" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 700, fill: '#1d2129' }}>{Math.round(memUtil)}%</text>
              <text x="80" y="100" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 12, fill: '#86909c' }}>内存使用率</text>
            </svg>
            <div style={{ fontSize: 12, color: '#4E5969' }}>{node.memoryUsed} / {node.memory}</div>
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 32px', fontSize: 13 }}>
            {memRows.map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#86909c' }}>{row.label}</span>
                <strong style={{ color: '#1d2129' }}>{row.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'GPU') {
    return (
      <div>
        {renderTabBar()}
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
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
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><a style={{ cursor: 'pointer', color: '#6738E8', fontWeight: 600 }} onClick={() => setGpuDetail(card)}><strong>{card.model}</strong></a> <em style={{ color: '#86909c', fontStyle: 'normal' }}>{card.spec}</em></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.memoryUsed} / {card.memoryTotal}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <Progress percent={card.utilization} showInfo={false} size="small" strokeColor={card.utilization > 90 ? '#E02D2D' : '#6951FF'} trailColor="#F2F3F5" style={{ width: 80 }} />
                  <span style={{ marginLeft: 6, fontSize: 12, color: '#4E5969' }}>{card.utilization}%</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.power}W</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.temperature}°C</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: card.status === 'active' ? '#00A11F' : '#C9CDD4', marginRight: 6 }} />
                  <span style={{ color: card.status === 'active' ? '#00A11F' : '#86909c' }}>{card.status === 'active' ? '使用中' : '空闲'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Drawer title={'GPU详情 - ' + (gpuDetail ? ('#' + gpuDetail.index + ' ' + gpuDetail.model) : '')} placement="right" open={!!gpuDetail} onClose={() => setGpuDetail(null)} width={420}>
          {gpuDetail && (
            <div style={{ fontSize: 13, lineHeight: '36px' }}>
              <div><span style={{ color: '#86909c' }}>卡序号</span> <strong style={{ marginLeft: 16 }}>#{gpuDetail.index}</strong></div>
              <div><span style={{ color: '#86909c' }}>型号</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.model}</strong></div>
              <div><span style={{ color: '#86909c' }}>规格</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.spec}</strong></div>
              <div><span style={{ color: '#86909c' }}>总显存</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.memoryTotal}</strong></div>
              <div><span style={{ color: '#86909c' }}>已用显存</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.memoryUsed}</strong></div>
              <div><span style={{ color: '#86909c' }}>空闲显存</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.memoryFree}</strong></div>
              <div><span style={{ color: '#86909c' }}>利用率</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.utilization}%</strong></div>
              <div><span style={{ color: '#86909c' }}>功耗</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.power}W</strong></div>
              <div><span style={{ color: '#86909c' }}>温度</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.temperature}°C</strong></div>
              <div><span style={{ color: '#86909c' }}>状态</span> <strong style={{ marginLeft: 16 }}>{gpuDetail.status === 'active' ? '使用中' : '空闲'}</strong></div>
            </div>
          )}
        </Drawer>
      </div>
    );
  }

  if (activeTab === '磁盘详情') {
    return (
      <div>
        {renderTabBar()}
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>名称</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>总量</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>已用</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>类型</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>挂载路径</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {node.disks.map((d) => (
              <tr key={d.name}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><a style={{ cursor: 'pointer', color: '#6738E8', fontWeight: 600 }} onClick={() => setDiskDetail(d)}>{d.name}</a></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.total}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.used}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.type}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{d.mountPath}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: d.status === 'normal' ? '#00A11F' : '#FF7D00', marginRight: 6 }} />
                  <span style={{ color: d.status === 'normal' ? '#00A11F' : '#FF7D00' }}>{d.status === 'normal' ? '正常' : '告警'}</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><FileTextOutlined style={{ cursor: 'pointer', color: '#6738E8', fontSize: 15 }} onClick={() => setLogDetail({ title: d.name + ' 内核日志', logs: mockKernelLogs(d.name) })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
                <DiskDetailDrawer disk={diskDetail} open={!!diskDetail} onClose={() => setDiskDetail(null)} />
        <Drawer title={logDetail?.title || ''} placement="right" open={!!logDetail} onClose={() => setLogDetail(null)} width={620}>
          {logDetail && (
            <div style={{ background: '#1d2129', color: '#52c41a', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, lineHeight: '22px', padding: 16, borderRadius: 6, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {logDetail.logs.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </Drawer>
      </div>
    );
  }

  if (activeTab === '网卡详情') {
    return (
      <div>
        {renderTabBar()}
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F7F8FA', color: '#4E5969', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>名称</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>类型</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>IP</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>速率</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>状态</th>
              <th style={{ padding: '8px 12px', borderBottom: '1px solid #E5E6EB' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {node.networkCards.map((card) => (
              <tr key={card.name}>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><a style={{ cursor: 'pointer', color: '#6738E8', fontWeight: 600 }} onClick={() => {
                  const base = { nodeName: node.name, nodeRole: '推理节点', runningPods: node.pods.filter((p) => p.status === 'Running').length, services: 'DeepSeek API' };
                  if (card.type === 'InfiniBand') {
                    setRdmaDetail({
                      ...card, ...base,
                      firmware: '28.39.1002', port: 'Port 1', linkHealth: '99.99%',
                      errorCount: 0, retransmitCount: 0,
                      throughput: '130Gbps', sendRate: '80Gbps', recvRate: '50Gbps',
                      gpuDirectRdma: true, ncclStatus: '正常',
                      commLatency: '1.2μs', p99Latency: '2.8μs', commErrors: 0,
                      rdmaHealth: '99.8%', linkErrors: 0, dropCount: 0, flitErrors: 0,
                    });
                  } else {
                    setNetDetail({ ...card, ...base });
                  }
                }}>{card.name}</a></td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.type}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.ip}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5', color: '#4E5969' }}>{card.speed}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: card.status === 'active' ? '#00A11F' : '#C9CDD4', marginRight: 6 }} />
                  <span style={{ color: card.status === 'active' ? '#00A11F' : '#86909c' }}>{card.status === 'active' ? '正常' : '异常'}</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #F2F3F5' }}><FileTextOutlined style={{ cursor: 'pointer', color: '#6738E8', fontSize: 15 }} onClick={() => setLogDetail({ title: card.name + ' 内核日志', logs: mockKernelLogs(card.name) })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <NetDetailDrawer card={netDetail} open={!!netDetail} onClose={() => setNetDetail(null)} />
        <RdmaDetailDrawer card={rdmaDetail} open={!!rdmaDetail} onClose={() => setRdmaDetail(null)} />
        <Drawer title={logDetail?.title || ''} placement="right" open={!!logDetail} onClose={() => setLogDetail(null)} width={620}>
          {logDetail && (
            <div style={{ background: '#1d2129', color: '#52c41a', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, lineHeight: '22px', padding: 16, borderRadius: 6, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              {logDetail.logs.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </Drawer>
      </div>
    );
  }

  if (activeTab === 'Pods列表') {
    return (
      <div>
        {renderTabBar()}
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: pod.status === 'Running' ? '#00A11F' : '#F53F3F' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: pod.status === 'Running' ? '#00A11F' : '#F53F3F' }} />
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

const nodeData: NodeRow[] = [
  { key: 'n1', name: 'qujing4', ip: '192.168.110.4', clusterName: 'default', label: 'GPU=RTX_4090', tags: ['deployment=dev', 'zone=shanghai', 'worker=high-performance', 'accelerator=nvidia-rtx'], status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, cpu: 128, cpuUsed: 42, cpuModel: 'Intel Xeon Gold 6438M', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 64, cpuThreads: 128, cpuFrequency: 2.1, cpuTotalGHz: 134.4, cpuUsedGHz: 44.1, cpuReady: '99.2%', cpuLoad: '8.5', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 52, power: 315, temperature: 72, status: 'active' }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 98, power: 425, temperature: 81, status: 'active' }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 95, power: 410, temperature: 78, status: 'active' }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 87, power: 380, temperature: 75, status: 'active' }, { index: 4, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '18.5 GB', memoryFree: '5.49 GB', utilization: 72, power: 360, temperature: 73, status: 'active' }, { index: 5, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '4.8 GB', memoryFree: '19.19 GB', utilization: 22, power: 180, temperature: 58, status: 'active' }, { index: 6, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 91, power: 415, temperature: 80, status: 'active' }, { index: 7, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '95.9 GB', memory: '1007.56 GB', memoryUsed: '352.6 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '3.86 TB', diskUsed: '1.54 TB', disks: [{ name: '/dev/sda', total: '3.86 TB', used: '1.54 TB', type: 'NVMe SSD', mountPath: '/data', status: 'normal', readSpeed: '850 MB/s', writeSpeed: '420 MB/s', iops: '85K', latency: '0.8 ms', readPressure: 60, writePressure: 40 }], networkCards: [{ name: 'eth0', ip: '192.168.110.4', speed: '25Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:01', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.001%', errors: 0, inbound: '8.5 Gbps', outbound: '12.3 Gbps', bandwidthUtil: 45, pps: '850K', tcpConns: 12430, avgLatency: '0.35ms', connStatus: '正常' }, { name: 'eth1', ip: '10.0.0.4', speed: '100Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:02', driver: 'mlx5_core', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '42.3 Gbps', outbound: '38.7 Gbps', bandwidthUtil: 42, pps: '2.1M', tcpConns: 8650, avgLatency: '0.28ms', connStatus: '正常' }, { name: 'ib0', ip: '192.168.200.4', speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.2', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '156.8 Gbps', outbound: '112.4 Gbps', bandwidthUtil: 78, pps: '4.5M', tcpConns: 0, avgLatency: '0.15ms', connStatus: '正常' }], pods: [{ name: 'deepseek-dev-p1', status: 'Running', namespace: 'development', ready: '1/1' }, { name: 'qwen2-demo-p1', status: 'Running', namespace: 'demo', ready: '1/1' }, { name: 'qwen2-demo-p2', status: 'Failed', namespace: 'demo', ready: '0/1' }] },
  { key: 'n2', name: 'qujing7', ip: '192.168.110.21', clusterName: 'default', label: 'GPU=RTX_4090', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, cpu: 192, cpuUsed: 68, cpuModel: 'AMD EPYC 9654', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 192, cpuThreads: 384, cpuFrequency: 2.4, cpuTotalGHz: 460.8, cpuUsedGHz: 163.2, cpuReady: '97.8%', cpuLoad: '12.3', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.0 GB', memoryFree: '11.99 GB', utilization: 48, power: 300, temperature: 68, status: 'active' }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 92, power: 400, temperature: 76, status: 'active' }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 94, power: 405, temperature: 77, status: 'active' }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 88, power: 385, temperature: 74, status: 'active' }, { index: 4, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '3.2 GB', memoryFree: '20.79 GB', utilization: 14, power: 120, temperature: 48, status: 'active' }, { index: 5, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '19.4 GB', memoryFree: '4.59 GB', utilization: 76, power: 345, temperature: 72, status: 'active' }, { index: 6, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '7.8 GB', memoryFree: '16.19 GB', utilization: 35, power: 210, temperature: 60, status: 'active' }, { index: 7, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 97, power: 430, temperature: 83, status: 'active' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '115.2 GB', memory: '1.48 TB', memoryUsed: '521.3 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '12.6 TB', diskUsed: '5.04 TB', disks: [{ name: '/dev/sda', total: '6.3 TB', used: '3.2 TB', type: 'NVMe SSD', mountPath: '/data', status: 'normal', readSpeed: '720 MB/s', writeSpeed: '380 MB/s', iops: '72K', latency: '1.2 ms', readPressure: 55, writePressure: 45 }, { name: '/dev/sdb', total: '6.3 TB', used: '1.84 TB', type: 'NVMe SSD', mountPath: '/models', status: 'normal', readSpeed: '560 MB/s', writeSpeed: '210 MB/s', iops: '48K', latency: '1.8 ms', readPressure: 35, writePressure: 25 }], networkCards: [{ name: 'eth0', ip: '192.168.110.21', speed: '25Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:11', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.002%', errors: 0, inbound: '6.2 Gbps', outbound: '9.8 Gbps', bandwidthUtil: 38, pps: '620K', tcpConns: 8920, avgLatency: '0.42ms', connStatus: '正常' }, { name: 'eth1', ip: '10.0.0.21', speed: '100Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:12', driver: 'mlx5_core', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '32.1 Gbps', outbound: '28.5 Gbps', bandwidthUtil: 32, pps: '1.8M', tcpConns: 5430, avgLatency: '0.31ms', connStatus: '正常' }, { name: 'ib0', ip: '192.168.200.21', speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.2', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '128.4 Gbps', outbound: '95.2 Gbps', bandwidthUtil: 65, pps: '3.2M', tcpConns: 0, avgLatency: '0.12ms', connStatus: '正常' }], pods: [{ name: 'deepseek-dev-p2', status: 'Running', namespace: 'development', ready: '1/1' }] },
  { key: 'n3', name: 'qujing21', ip: '192.168.109.6', clusterName: 'default', label: 'GPU=RTX_4090', status: 'normal', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, cpu: 192, cpuUsed: 56, cpuModel: 'Intel Xeon Gold 6438M', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 96, cpuThreads: 192, cpuFrequency: 2.1, cpuTotalGHz: 201.6, cpuUsedGHz: 58.8, cpuReady: '98.5%', cpuLoad: '9.8', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '19.2 GB', memoryFree: '4.79 GB', utilization: 78, power: 350, temperature: 71, status: 'active' }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 96, power: 420, temperature: 82, status: 'active' }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '15.6 GB', memoryFree: '8.39 GB', utilization: 63, power: 325, temperature: 68, status: 'active' }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0.5 GB', memoryFree: '23.49 GB', utilization: 2, power: 45, temperature: 36, status: 'idle' }, { index: 4, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 93, power: 412, temperature: 79, status: 'active' }, { index: 5, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '11.5 GB', memoryFree: '12.49 GB', utilization: 45, power: 280, temperature: 65, status: 'active' }, { index: 6, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 89, power: 390, temperature: 75, status: 'active' }, { index: 7, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '4.8 GB', memoryFree: '19.19 GB', utilization: 20, power: 160, temperature: 55, status: 'active' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '67.2 GB', memory: '1007.51 GB', memoryUsed: '483.6 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '3.86 TB', diskUsed: '2.12 TB', disks: [{ name: '/dev/sda', total: '3.86 TB', used: '2.12 TB', type: 'NVMe SSD', mountPath: '/data', status: 'normal', readSpeed: '920 MB/s', writeSpeed: '510 MB/s', iops: '92K', latency: '0.6 ms', readPressure: 75, writePressure: 55 }], networkCards: [{ name: 'eth0', ip: '192.168.109.6', speed: '25Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:21', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.003%', errors: 0, inbound: '12.8 Gbps', outbound: '15.2 Gbps', bandwidthUtil: 58, pps: '1.2M', tcpConns: 15670, avgLatency: '0.28ms', connStatus: '正常' }, { name: 'ib0', ip: '192.168.200.6', speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '178.6 Gbps', outbound: '142.3 Gbps', bandwidthUtil: 82, pps: '5.1M', tcpConns: 0, avgLatency: '0.11ms', connStatus: '正常' }], pods: [] },
  { key: 'n4', name: 'qujing1', ip: '192.168.200.10', clusterName: 'default', label: 'GPU=RTX_5000', status: 'error', authStatus: 'unauthorized', modelCount: 0, runningInstances: 0, cpu: 192, cpuUsed: 0, cpuModel: 'Intel Xeon Gold 6438M', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 96, cpuThreads: 192, cpuFrequency: 2.1, cpuTotalGHz: 201.6, cpuUsedGHz: 0, cpuReady: '0%', cpuLoad: '0.0', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 35, status: 'idle' }, { index: 1, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle' }, { index: 2, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 33, status: 'idle' }, { index: 3, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle' }, { index: 4, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 35, status: 'idle' }, { index: 5, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle' }, { index: 6, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 33, status: 'idle' }, { index: 7, model: 'RTX 5000', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 34, status: 'idle' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '0 GB', memory: '1007.39 GB', memoryUsed: '0 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '3.86 TB', diskUsed: '1.89 TB', disks: [{ name: '/dev/sda', total: '3.86 TB', used: '1.89 TB', type: 'NVMe SSD', mountPath: '/data', status: 'warning', readSpeed: '0 MB/s', writeSpeed: '0 MB/s', iops: '0', latency: 'N/A', readPressure: 0, writePressure: 0 }], networkCards: [{ name: 'eth0', ip: '192.168.200.10', speed: '25Gbps', status: 'inactive', type: 'Ethernet', mac: '00:1A:2B:3C:4D:31', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'DOWN', duplex: 'N/A', lossRate: 'N/A', errors: 0, inbound: '0 Gbps', outbound: '0 Gbps', bandwidthUtil: 0, pps: '0', tcpConns: 0, avgLatency: 'N/A', connStatus: '异常' }, { name: 'ib0', ip: '192.168.200.100', speed: '200Gbps', status: 'inactive', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.1', linkStatus: 'DOWN', duplex: 'N/A', lossRate: 'N/A', errors: 0, inbound: '0 Gbps', outbound: '0 Gbps', bandwidthUtil: 0, pps: '0', tcpConns: 0, avgLatency: 'N/A', connStatus: '异常' }], pods: [] },
  { key: 'n5', name: 'qujing24', ip: '192.168.109.23', clusterName: 'default', label: 'GPU=RTX_4090', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, cpu: 96, cpuUsed: 38, cpuModel: 'Intel Xeon Silver 4416+', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 40, cpuThreads: 80, cpuFrequency: 2.0, cpuTotalGHz: 80.0, cpuUsedGHz: 31.7, cpuReady: '99.5%', cpuLoad: '5.2', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '14.4 GB', memoryFree: '9.59 GB', utilization: 58, power: 320, temperature: 69, status: 'active' }, { index: 1, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 93, power: 408, temperature: 79, status: 'active' }, { index: 2, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0.2 GB', memoryFree: '23.79 GB', utilization: 1, power: 35, temperature: 32, status: 'idle' }, { index: 3, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '21.6 GB', memoryFree: '2.39 GB', utilization: 85, power: 375, temperature: 74, status: 'active' }, { index: 4, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '9.8 GB', memoryFree: '14.19 GB', utilization: 40, power: 250, temperature: 62, status: 'active' }, { index: 5, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 95, power: 418, temperature: 80, status: 'active' }, { index: 6, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '12.8 GB', memoryFree: '11.19 GB', utilization: 50, power: 295, temperature: 67, status: 'active' }, { index: 7, model: 'RTX 4090', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 90, power: 398, temperature: 77, status: 'active' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '57.6 GB', memory: '503.35 GB', memoryUsed: '176.2 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '5.68 TB', diskUsed: '2.27 TB', disks: [{ name: '/dev/sda', total: '5.68 TB', used: '2.27 TB', type: 'NVMe SSD', mountPath: '/data', status: 'normal', readSpeed: '780 MB/s', writeSpeed: '390 MB/s', iops: '78K', latency: '0.9 ms', readPressure: 50, writePressure: 35 }], networkCards: [{ name: 'eth0', ip: '192.168.109.23', speed: '25Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:41', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.001%', errors: 0, inbound: '5.6 Gbps', outbound: '8.9 Gbps', bandwidthUtil: 35, pps: '560K', tcpConns: 7230, avgLatency: '0.38ms', connStatus: '正常' }, { name: 'ib0', ip: '192.168.200.23', speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '89.6 Gbps', outbound: '72.1 Gbps', bandwidthUtil: 45, pps: '2.8M', tcpConns: 0, avgLatency: '0.13ms', connStatus: '正常' }], pods: [] },
  { key: 'n6', name: 'qujing20', ip: '192.168.110.20', clusterName: 'default', label: 'GPU=RTX_4011', status: 'normal', authStatus: 'authorized', modelCount: 0, runningInstances: 0, cpu: 192, cpuUsed: 72, cpuModel: 'AMD EPYC 9654', cpuArch: 'x86_64', cpuSockets: 2, cpuCores: 192, cpuThreads: 384, cpuFrequency: 2.4, cpuTotalGHz: 460.8, cpuUsedGHz: 172.8, cpuReady: '97.2%', cpuLoad: '14.1', gpu: 8, gpuCards: [{ index: 0, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '16.8 GB', memoryFree: '7.19 GB', utilization: 68, power: 340, temperature: 70, status: 'active' }, { index: 1, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 91, power: 395, temperature: 76, status: 'active' }, { index: 2, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '5.6 GB', memoryFree: '18.39 GB', utilization: 25, power: 185, temperature: 56, status: 'active' }, { index: 3, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '22.1 GB', memoryFree: '1.89 GB', utilization: 82, power: 365, temperature: 73, status: 'active' }, { index: 4, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '0 GB', memoryFree: '23.99 GB', utilization: 0, power: 25, temperature: 31, status: 'idle' }, { index: 5, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '23.9 GB', memoryFree: '0.09 GB', utilization: 96, power: 425, temperature: 81, status: 'active' }, { index: 6, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '18.2 GB', memoryFree: '5.79 GB', utilization: 74, power: 348, temperature: 71, status: 'active' }, { index: 7, model: 'RTX 4011', spec: '24 GB', memoryTotal: '23.99 GB', memoryUsed: '10.5 GB', memoryFree: '13.49 GB', utilization: 42, power: 265, temperature: 63, status: 'active' }], gpuMemory: '383.9 GB', gpuMemoryUsed: '72.0 GB', memory: '1007.51 GB', memoryUsed: '604.5 GB', memoryType: 'DDR5 4800MHz', memoryActive: '286.4 GB', memoryConsumed: '412.8 GB', memoryShared: '12.3 GB', memoryBalloon: '0 GB', memoryCompression: '8.7 GB', memorySwap: '2.1 GB', memoryCache: '156.2 GB', disk: '3.86 TB', diskUsed: '1.62 TB', disks: [{ name: '/dev/sda', total: '3.86 TB', used: '1.62 TB', type: 'NVMe SSD', mountPath: '/data', status: 'normal', readSpeed: '680 MB/s', writeSpeed: '350 MB/s', iops: '65K', latency: '1.1 ms', readPressure: 45, writePressure: 30 }], networkCards: [{ name: 'eth0', ip: '192.168.110.20', speed: '25Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:51', driver: 'mlx5_core', pcie: '0000:3b:00.0', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.004%', errors: 1, inbound: '15.2 Gbps', outbound: '18.6 Gbps', bandwidthUtil: 72, pps: '1.5M', tcpConns: 18240, avgLatency: '0.31ms', connStatus: '正常' }, { name: 'eth1', ip: '10.0.0.20', speed: '100Gbps', status: 'active', type: 'Ethernet', mac: '00:1A:2B:3C:4D:52', driver: 'mlx5_core', pcie: '0000:3b:00.1', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.001%', errors: 0, inbound: '52.6 Gbps', outbound: '48.3 Gbps', bandwidthUtil: 52, pps: '2.6M', tcpConns: 12450, avgLatency: '0.25ms', connStatus: '正常' }, { name: 'ib0', ip: '192.168.200.20', speed: '200Gbps', status: 'active', type: 'InfiniBand', mac: 'N/A', driver: 'mlx5_ib', pcie: '0000:3b:00.2', linkStatus: 'UP', duplex: 'Full Duplex', lossRate: '0.000%', errors: 0, inbound: '192.4 Gbps', outbound: '168.7 Gbps', bandwidthUtil: 92, pps: '6.2M', tcpConns: 0, avgLatency: '0.10ms', connStatus: '正常' }], pods: [] },
];

const NodeTable = () => {
  const [keyword, setKeyword] = useState('');
  const [nodeLog, setNodeLog] = useState<{ title: string; logs: string[] } | null>(null);

  const filteredData = useMemo(() => nodeData.filter((row) => {
    const text = (row.name + ' ' + row.ip + ' ' + row.clusterName + ' ' + row.label).toLowerCase();
    return !keyword || text.includes(keyword.toLowerCase());
  }), [keyword]);

  const columns: ColumnsType<NodeRow> = [
    { title: '节点名称', key: 'name', width: 120, render: (_, r) => (
      <strong style={{ fontSize: 13, color: '#1d2129' }}>{r.name}</strong>
    ) },
    { title: '节点 IP', dataIndex: 'ip', key: 'ip', width: 130 },
    { title: 'Labels', key: 'label', width: 200, render: (_, r) => (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <span style={{ display: 'inline-block', padding: '1px 6px', fontSize: 11, background: '#F0F0FF', color: '#6738E8', borderRadius: 3, border: '1px solid #D9D0FC' }}>{r.label}</span>
        {r.tags?.filter((tag) => /^(deployment|GPU|worker|controlplane)=/.test(tag)).map((tag) => (
          <span key={tag} style={{ display: 'inline-block', padding: '1px 6px', fontSize: 11, background: '#F7F8FA', color: '#4E5969', borderRadius: 3, border: '1px solid #E5E6EB' }}>{tag}</span>
        ))}
      </div>
    ) },
    { title: '状态', key: 'status', width: 80, render: (_, r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: r.status === 'normal' ? '#00A11F' : r.status === 'warning' ? '#FF7D00' : '#F53F3F', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: '#4E5969' }}>{r.status === 'normal' ? '正常' : r.status === 'warning' ? '警告' : '异常'}</span>
      </span>
    ) },
    { title: '操作', key: 'action', width: 100, render: (_, r) => <FileTextOutlined style={{ cursor: 'pointer', color: '#6738E8', fontSize: 15 }} onClick={() => setNodeLog({ title: r.name + ' 内核日志', logs: mockKernelLogs(r.name) })} /> },
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#6738E8' }, components: { Table: { headerBg: '#f7f8fa' } } }}>
      <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
        <Input.Search size="small" allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索节点名称 / IP / 标签" style={{ width: 320 }} />
      </div>
      <Table<NodeRow> rowKey="key" columns={columns} dataSource={filteredData} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10, showTotal: (total) => '共 ' + total + ' 个' }} expandable={{
        expandedRowRender: (r) => <NodeExpandContent node={r} />,
        rowExpandable: () => true,
      }} />
      <Drawer title={nodeLog?.title || ''} placement="right" open={!!nodeLog} onClose={() => setNodeLog(null)} width={620}>
        {nodeLog && (
          <div style={{ background: '#1d2129', color: '#52c41a', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, lineHeight: '22px', padding: 16, borderRadius: 6, whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
            {nodeLog.logs.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </Drawer>
    </ConfigProvider>
  );
};

export default ClusterOperationsHomepage;
