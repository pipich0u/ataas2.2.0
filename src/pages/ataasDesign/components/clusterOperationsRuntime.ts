// @ts-nocheck
// The prototype data and interaction handlers stay isolated in this module so the
// page component remains readable while backend APIs are connected later.
export const initializeClusterOperations = (root: HTMLElement) => {
  if (root.dataset.clusterOperationsInitialized === 'true') return;
  root.dataset.clusterOperationsInitialized = 'true';

  const getById = (id: string) => root.querySelector(`#${id}`);

  const tabs = Array.from(root.querySelectorAll('.module-tab[data-view]'));
  const allModes = ['nodes-mode', 'workloads-mode', 'pods-mode', 'services-mode', 'serviceentry-mode', 'pv-mode', 'se-view-mode'];
  const applyView = (view = 'overview') => {
    root.classList.remove(...allModes);
    tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
    if (view === 'nodes') root.classList.add('nodes-mode');
    else if (view === 'workloads') root.classList.add('workloads-mode');
    else if (view === 'pods') root.classList.add('pods-mode');
    else if (view === 'services') root.classList.add('services-mode');
    else if (view === 'serviceentry') root.classList.add('serviceentry-mode');
    else if (view === 'pv') root.classList.add('pv-mode');
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    applyView(tab.dataset.view || 'overview');
  }));
  applyView();

  const setText = (id, value) => { const element = getById(id); if (element) element.textContent = value; };

  const clusterData = {
    'shanghai-online': { name: 'shanghai-online', location: '上海二区', provider: '商汤', dc: '上海外高桥数据中心', k8s: 'v1.36.2', bms: '3', nodes: '3', normal: '2', abnormal: '1', health: '正常', running: true, code: '上海二区' },
    'guangzhou-test': { name: 'guangzhou-test', location: '广州测试', provider: '并行科技', dc: '广州科学城数据中心', k8s: 'v1.36.0', bms: '1', nodes: '1', normal: '1', abnormal: '0', health: '有异常', running: true, code: '广州测试' },
    'wuhan-kunpeng': { name: 'wuhan-kunpeng', location: '武汉专区', provider: '并行科技', dc: '武汉光谷数据中心', k8s: 'v1.35.8', bms: '0', nodes: '0', normal: '0', abnormal: '0', health: '正常', running: true, code: '武汉专区' },
    'beijing-prod': { name: 'beijing-prod', location: '北京一区', provider: '盐城', dc: '北京亦庄数据中心', k8s: 'v1.36.2', bms: '6', nodes: '6', normal: '5', abnormal: '1', health: '正常', running: true, code: '北京一区' },
  };

  const applyCluster = (clusterKey: string) => {
    root.querySelectorAll('.tree-cluster-link').forEach((l) => l.classList.remove('active'));
    const link = root.querySelector(`.tree-cluster-link[data-cluster-key="${clusterKey}"]`);
    if (link) link.classList.add('active');
    const data = clusterData[clusterKey] || clusterData['beijing-prod'];
    setText('clusterBreadcrumbName', data.name);
    setText('clusterTitle', data.name);
    setText('clusterCode', data.code);
    setText('clusterK8sBadge', `Kubernetes ${data.k8s}`);
    setText('overviewNodeCount', data.bms);
    setText('overviewNodeNormal', data.normal || data.bms);
    setText('overviewNodeAbnormal', data.abnormal || '0');
  };

  // Resource tree data: providers → datacenters → clusters
  const resourceTreeData = [
    { name: '商汤', providerFull: '', expanded: true, dcs: [
      { name: '上海外高桥数据中心', count: '1', expanded: true, clusters: [
        { key: 'shanghai-online', name: 'shanghai-online', meta: '上海二区', count: '3台' },
      ]},
    ]},
    { name: '并行科技', providerFull: '', expanded: true, dcs: [
      { name: '广州科学城数据中心', count: '1', expanded: true, clusters: [
        { key: 'guangzhou-test', name: 'guangzhou-test', meta: '广州测试', count: '1台' },
      ]},
      { name: '武汉光谷数据中心', count: '1', expanded: true, clusters: [
        { key: 'wuhan-kunpeng', name: 'wuhan-kunpeng', meta: '武汉专区', count: '0台' },
      ]},
    ]},
    { name: '盐城', providerFull: '', expanded: true, dcs: [
      { name: '北京亦庄数据中心', count: '1', expanded: true, clusters: [
        { key: 'beijing-prod', name: 'beijing-prod', meta: '北京一区', count: '6台' },
      ]},
    ]},
  ];

  // Calculate tree totals
  let totalBms = 0, totalAbnormal = 0, totalProviders = 0, totalDcs = 0, totalClusters = 0, totalSegments = 0;
  const segmentSet = new Set();
  resourceTreeData.forEach((p) => {
    if (p.dcs.length > 0) totalProviders++;
    p.dcs.forEach((dc) => {
      totalDcs++;
      dc.clusters.forEach((cl) => {
        totalClusters++;
        totalBms += parseInt(cl.count) || 0;
        if (cl.bad) totalAbnormal++;
        if (cl.meta) segmentSet.add(cl.meta);
      });
    });
  });
  totalSegments = segmentSet.size;

  const el = (tag, cls, ...children) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    children.forEach((ch) => { if (typeof ch === 'string') e.appendChild(document.createTextNode(ch)); else if (ch) e.appendChild(ch); });
    return e;
  };

  const buildResourceTree = () => {
    const container = root.querySelector('#resourceTreeContainer');
    if (!container) return;
    container.innerHTML = '';

    // Tree all + stats
    container.appendChild(el('div', 'tree-all',
      el('span', null, '全部机器'),
      el('span', 'tree-all-count', `已纳管${totalBms}台 · 异常${totalAbnormal}`),
    ));
    container.appendChild(el('div', 'tree-stats',
      el('span', null, '供应商', el('strong', null, String(totalProviders))),
      el('span', null, '数据中心', el('strong', null, String(totalDcs))),
      el('span', null, '集群', el('strong', null, String(totalClusters))),
      el('span', null, '节点', el('strong', null, String(totalBms))),
    ));

    let firstClusterKey = '';

    resourceTreeData.forEach((provider, pi) => {
      const providerDiv = el('div', 'tree-provider' + (provider.expanded ? '' : ' collapsed'));
      const head = el('div', 'tree-provider-head',
        el('span', 'tree-chevron', provider.expanded ? '⌄' : '›'),
        el('span', null, provider.name),
        el('span', 'tree-provider-count', `${provider.dcs.length}个中心`),
      );
      providerDiv.appendChild(head);
      head.addEventListener('click', (e) => {
        e.stopPropagation();
        providerDiv.classList.toggle('collapsed');
        const cv = providerDiv.querySelector('.tree-chevron');
        if (cv) cv.textContent = providerDiv.classList.contains('collapsed') ? '›' : '⌄';
      });

      provider.dcs.forEach((dc) => {
        const dcDiv = el('div', 'tree-dc' + (dc.expanded ? '' : ' collapsed'));
        const dcHead = el('div', 'tree-dc-head',
          el('span', 'tree-chevron', dc.expanded ? '⌄' : '›'),
          el('span', null, dc.name),
          el('span', 'tree-dc-count', String(dc.count)),
        );
        dcDiv.appendChild(dcHead);
        dcHead.addEventListener('click', (e) => {
          e.stopPropagation();
          dcDiv.classList.toggle('collapsed');
          const cv = dcDiv.querySelector('.tree-chevron');
          if (cv) cv.textContent = dcDiv.classList.contains('collapsed') ? '›' : '⌄';
        });

        dc.clusters.forEach((cl, ci) => {
          const isFirst = pi === 0 && ci === 0 && !firstClusterKey;
          if (isFirst) firstClusterKey = cl.key;
          const linkCls = 'tree-cluster-link' + (isFirst ? ' active' : '');
          const countCls = 'tree-node-count' + (cl.bad ? ' bad' : '');
          const link = el('div', linkCls,
            el('span', null),
            el('span', null, cl.name + (cl.meta ? '' : ''), cl.meta ? el('small', 'tree-link-meta', cl.meta) : null),
            el('span', countCls, cl.count),
          );
          link.dataset.clusterKey = cl.key;
          link.addEventListener('click', () => applyCluster(cl.key));
          dcDiv.appendChild(link);
        });
        providerDiv.appendChild(dcDiv);
      });
      container.appendChild(providerDiv);
    });

    // Initialize with the first cluster
    if (firstClusterKey) applyCluster(firstClusterKey);
  };


  buildResourceTree();

  const nodeDetails = {
    'gpu-node-07': { status: 'NotReady', role: 'Worker', type: 'GPU', ip: '10.24.18.107', bm: 'BM-00001027', time: '3 分钟前', ready: 'False', diskPressure: 'False', cpu: '84%', cpuMeta: 'Requests 76% · 128 核', memory: '71%', memoryMeta: 'Requests 72% · 1.0 TB', gpu: '7／8 · 92%', gpuMeta: '2 张 A100 出现 Xid', gpuBad: true, disk: '68%', diskMeta: '12.8 TB · 无 DiskPressure', network: '1.8／1.2 Gbps', networkMeta: 'bond0 丢包 4.8%', networkBad: true, pods: '32／110', podsMeta: '5 个异常 · 影响 2 Services', podsBad: true, events: 7, freshness: '监控数据停留在 3 分钟前', stale: true, impact: 'Node NotReady → Kubelet 心跳中断 → BM-00001027 物理网卡丢包。<br>已定位到对应物理机器，影响 5 个 Pods／2 个 Services。' },
    'gpu-node-52': { status: 'NotReady', role: 'Worker', type: 'GPU', ip: '10.24.18.152', bm: 'BM-00001102', time: '18 分钟前', ready: 'False', diskPressure: 'False', cpu: '—', cpuMeta: 'Requests 41% · 监控不可用', memory: '—', memoryMeta: 'Requests 58% · 监控不可用', gpu: '4／8 · —', gpuMeta: 'A100 · 状态未知', gpuBad: false, disk: '—', diskMeta: '最后数据已超过 18 分钟', network: '—', networkMeta: '对应物理机器硬件健康', networkBad: false, pods: '9／110', podsMeta: '9 个异常', podsBad: true, events: 5, freshness: '监控数据停留在 18 分钟前', stale: true, impact: 'Node NotReady → Kubelet 18 分钟未上报。<br>对应物理机器硬件健康，正在排查操作系统、Kubelet 和网络链路。' },
    'gpu-node-12': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.112', bm: 'BM-00001032', time: '24 秒前', ready: 'True', diskPressure: 'True', cpu: '77%', cpuMeta: 'Requests 79% · 128 核', memory: '82%', memoryMeta: 'Requests 84% · 1.0 TB', gpu: '6／8 · 85%', gpuMeta: '2 张 A100 高温', gpuBad: true, disk: '92%', diskMeta: 'DiskPressure · 容量风险', diskBad: true, network: '1.4／1.1 Gbps', networkMeta: '网络正常', networkBad: false, pods: '88／110', podsMeta: '0 个异常', podsBad: false, events: 4, freshness: '监控数据更新于 24 秒前', stale: false, impact: 'Node Ready，但检测到 DiskPressure 和 2 张 GPU 高温。<br>当前已暂停调度，建议先释放磁盘容量并检查 GPU 散热。' },
    'gpu-node-18': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.118', bm: 'BM-00001045', time: '18 秒前', ready: 'True', diskPressure: 'False', cpu: '68%', cpuMeta: 'Requests 72% · 128 核', memory: '74%', memoryMeta: 'Requests 76% · 1.0 TB', gpu: '8／8 · 81%', gpuMeta: 'A100 · 健康', gpuBad: false, disk: '61%', diskMeta: '12.8 TB · 正常', network: '1.2／1.0 Gbps', networkMeta: '网络正常', networkBad: false, pods: '96／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 18 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' },
    'gpu-node-23': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.123', bm: 'BM-00001050', time: '15 秒前', ready: 'True', diskPressure: 'False', cpu: '62%', cpuMeta: 'Requests 67% · 128 核', memory: '69%', memoryMeta: 'Requests 74% · 1.0 TB', gpu: '6／8 · 63%', gpuMeta: 'A100 · 健康', gpuBad: false, disk: '57%', diskMeta: '12.8 TB · 正常', network: '1.0／0.9 Gbps', networkMeta: '网络正常', networkBad: false, pods: '72／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 15 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' },
    'cpu-node-04': { status: 'Ready', role: 'Worker', type: 'CPU', ip: '10.24.18.204', bm: 'BM-00001093', time: '12 秒前', ready: 'True', diskPressure: 'False', cpu: '55%', cpuMeta: 'Requests 60% · 128 核', memory: '66%', memoryMeta: 'Requests 70% · 512 GB', gpu: '—', gpuMeta: '无 GPU', gpuBad: false, disk: '49%', diskMeta: '8.0 TB · 正常', network: '0.8／0.7 Gbps', networkMeta: '网络正常', networkBad: false, pods: '104／110', podsMeta: '0 个异常', podsBad: false, events: 2, freshness: '监控数据更新于 12 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes 或硬件异常。' },
    'gpu-node-31': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.131', bm: 'BM-00001068', time: '21 秒前', ready: 'True', diskPressure: 'False', cpu: '49%', cpuMeta: 'Requests 58% · 128 核', memory: '61%', memoryMeta: 'Requests 68% · 1.0 TB', gpu: '8／8 · 78%', gpuMeta: 'A800 · 健康', gpuBad: false, disk: '52%', diskMeta: '12.8 TB · 正常', network: '1.1／0.9 Gbps', networkMeta: '网络正常', networkBad: false, pods: '90／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 21 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' }
  };
  const nodeIssueDetails = {
    'gpu-node-07': { abnormalPods: 5, issues: [['Kubernetes', 'NotReady · Kubelet 3 分钟未上报'], ['物理机器', 'BM-00001027 · bond0 丢包 4.8%'], ['GPU', '2 张 A100 出现 Xid']], impact: '<strong>影响范围</strong>：5 个异常 Pods · 影响 2 个 Services。' },
    'gpu-node-52': { abnormalPods: 9, issues: [['Kubernetes', 'NotReady · Kubelet 18 分钟未上报']], impact: '<strong>影响范围</strong>：该 Node 上 9 个 Pods 状态异常；物理机器硬件健康。' },
    'gpu-node-12': { abnormalPods: 0, issues: [['Kubernetes', 'DiskPressure · 本地盘使用率 92%'], ['GPU', '2 张 A100 温度过高']], impact: '<strong>影响范围</strong>：已暂停接收新 Pod；现有 88 个 Pods 继续运行。' },
    'gpu-node-18': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
    'gpu-node-23': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
    'cpu-node-04': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
    'gpu-node-31': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true }
  };
  const nodeContextDetails = {
    'gpu-node-07': { manual: '未禁止调度', result: '不可参与（NotReady）', resultBad: true, taints: 'unreachable:NoSchedule', labels: 'worker · gpu · a100' },
    'gpu-node-52': { manual: '未禁止调度', result: '不可参与（NotReady）', resultBad: true, taints: 'unreachable:NoSchedule', labels: 'worker · gpu · a100' },
    'gpu-node-12': { manual: '已禁止调度', result: '不可参与（人工禁止）', resultBad: true, taints: 'disk-pressure:NoSchedule', labels: 'worker · gpu · a100' },
    'gpu-node-18': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a100' },
    'gpu-node-23': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a100' },
    'cpu-node-04': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · cpu' },
    'gpu-node-31': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a800' }
  };
  const setMeta = (id, value, bad) => { const element = getById(id); if (element) { element.textContent = value; element.classList.toggle('bad', Boolean(bad)); } };
  const renderNodeDetail = (nodeName) => {
    const detail = nodeDetails[nodeName];
    const issueDetail = nodeIssueDetails[nodeName];
    const contextDetail = nodeContextDetails[nodeName];
    if (!detail) return;
    setText('detailNodeName', nodeName);
    const status = getById('detailNodeStatus');
    if (status) { status.textContent = detail.status; status.className = `node-status${detail.status === 'NotReady' ? ' bad' : ''}`; }
    setText('detailNodeId', `${detail.role} · ${detail.type} · ${detail.ip}`);
    setText('detailBmLink', `查看物理机器 ${detail.bm} →`);
    setText('detailBmValue', detail.bm);
    const ready = getById('detailReady');
    if (ready) { ready.textContent = detail.ready; ready.className = `condition-state${detail.ready === 'False' ? ' bad' : ''}`; }
    setText('detailReadyTime', detail.time);
    root.querySelectorAll('.detail-condition-time').forEach((element) => { element.textContent = detail.time; });
    ['detailMemoryPressure', 'detailPidPressure', 'detailNetworkUnavailable'].forEach((id) => { const element = getById(id); if (element) { element.textContent = 'False'; element.className = 'condition-state'; } });
    const diskPressure = getById('detailDiskPressure');
    if (diskPressure) { diskPressure.textContent = detail.diskPressure; diskPressure.className = `condition-state${detail.diskPressure === 'True' ? ' bad' : ''}`; }
    if (contextDetail) {
      setText('detailManualSchedule', contextDetail.manual);
      setText('detailScheduleResult', contextDetail.result);
      setText('detailTaints', contextDetail.taints);
      setText('detailLabels', contextDetail.labels);
      const scheduleResult = getById('detailScheduleResult');
      if (scheduleResult) scheduleResult.classList.toggle('bad', contextDetail.resultBad);
    }
    setText('detailCpu', detail.cpu); setText('detailCpuMeta', detail.cpuMeta);
    setText('detailMemory', detail.memory); setText('detailMemoryMeta', detail.memoryMeta);
    setText('detailGpu', detail.gpu); setMeta('detailGpuMeta', detail.gpuMeta, detail.gpuBad);
    setText('detailDisk', detail.disk); setMeta('detailDiskMeta', detail.diskMeta, detail.diskBad);
    setText('detailNetwork', detail.network); setMeta('detailNetworkMeta', detail.networkMeta, detail.networkBad);
    setText('detailPods', detail.pods); setMeta('detailPodsMeta', detail.podsMeta, detail.podsBad);
    const abnormalPods = issueDetail ? issueDetail.abnormalPods : 0;
    setText('detailPodsLink', abnormalPods > 0 ? `查看 ${abnormalPods} 个异常 Pods →` : `查看该 Node 上的 ${detail.pods.split('／')[0]} 个 Pods →`);
    setText('detailEventsLink', `查看 ${detail.events} 条相关事件 →`);
    const freshness = getById('detailFreshness');
    if (freshness) { freshness.textContent = detail.freshness; freshness.classList.toggle('fresh', !detail.stale); }
    const issueList = getById('detailIssueList');
    if (issueList && issueDetail) {
      issueList.innerHTML = issueDetail.issues.map(([source, text]) => `<div class="node-issue-row${issueDetail.normal ? ' normal' : ''}"><span class="node-issue-source">${source}</span><span class="node-issue-text">${text}</span></div>`).join('');
    }
    const impact = getById('detailImpact');
    if (impact && issueDetail) { impact.innerHTML = issueDetail.impact; impact.classList.toggle('normal', Boolean(issueDetail.normal)); }
  };
  root.querySelectorAll('.node-row[data-node]').forEach((row) => row.addEventListener('click', () => {
    root.querySelectorAll('.node-row').forEach((item) => item.classList.remove('selected'));
    row.classList.add('selected');
    renderNodeDetail(row.dataset.node);
  }));

  const rows = Array.from(root.querySelectorAll('.node-row[data-node]'));
  const summaryFilters = Array.from(root.querySelectorAll('.node-summary-filter'));
  const listMeta = getById('nodesListMeta');
  const paginationMeta = getById('nodesPaginationMeta');
  const paginationPages = getById('nodesPaginationPages');
  const applyNodeFilter = (filter, button) => {
    const resetToAll = button.classList.contains('active') && filter !== 'all';
    const activeFilter = resetToAll ? 'all' : filter;
    summaryFilters.forEach((item) => item.classList.toggle('active', item.dataset.nodeFilter === activeFilter));
    const visibleRows = rows.filter((row) => {
      const issues = row.dataset.issues.split(' ').filter(Boolean);
      const visible = activeFilter === 'all' || (activeFilter === 'attention' ? row.dataset.attention === 'true' : issues.includes(activeFilter));
      row.style.display = visible ? 'grid' : 'none';
      return visible;
    });
    const activeButton = summaryFilters.find((item) => item.dataset.nodeFilter === activeFilter);
    const total = activeFilter === 'all' ? 80 : Number(activeButton.dataset.filterTotal || visibleRows.length);
    if (listMeta) listMeta.textContent = activeFilter === 'all' ? '按影响优先 · 共 80 个 Node · 3 个需关注' : `已筛选：${activeButton.dataset.filterLabel} · ${total} 个 Node`;
    if (paginationMeta) paginationMeta.textContent = activeFilter === 'all' ? '显示 1–7，共 80 个 Nodes' : `显示 ${visibleRows.length} 个，共 ${total} 个 Nodes`;
    if (paginationPages) paginationPages.style.visibility = activeFilter === 'all' ? 'visible' : 'hidden';
    const selectedVisible = visibleRows.includes(root.querySelector('.node-row.selected'));
    if (!selectedVisible && visibleRows[0]) {
      rows.forEach((row) => row.classList.remove('selected'));
      visibleRows[0].classList.add('selected');
      renderNodeDetail(visibleRows[0].dataset.node);
    }
  };
  summaryFilters.forEach((button) => button.addEventListener('click', () => applyNodeFilter(button.dataset.nodeFilter, button)));

  const workloadDetails = {
    'payment-api': {
      kind: 'Deployment', status: '需关注', statusClass: '', scope: '项目A／payment', created: '2026-05-18 14:22', strategy: 'RollingUpdate', image: 'payment-api:v2.4.1', changed: '10分钟前更新镜像',
      replicas: [['期望', '5'], ['已更新', '5'], ['Ready', '3', true], ['Available', '3', true]],
      conditions: [['Available', 'False', 'MinimumReplicasUnavailable', true], ['Progressing', 'False', 'ProgressDeadlineExceeded', true]],
      issues: [['payment-api-7d8f-2kv9f', 'Pod', 'NotReady', true], ['payment-api-7d8f-7sk2h', 'Pod', 'NotReady', true]],
      impact: 'Workload副本不足 → 2个Pods未就绪 → <strong>gpu-node-07 NotReady</strong> → BM-00001027网卡丢包。<br>payment-service 后端就绪 3／5，存在服务降级风险。',
      podsLink: '查看2个异常Pods →', targetLabel: '查看gpu-node-07 →', targetNode: 'gpu-node-07', events: 6
    },
    'model-cache': {
      kind: 'StatefulSet', status: '需关注', statusClass: '', scope: '项目B／inference', created: '2026-04-02 09:18', strategy: 'RollingUpdate／OrderedReady', image: 'redis:7.2.5', changed: '18分钟前Pod重建',
      replicas: [['期望', '3'], ['当前', '3'], ['Ready', '2', true], ['Available', '2', true]],
      conditions: [['Ready', 'False', 'model-cache-2未就绪', true], ['PVC绑定', 'True', '卷已绑定，挂载超时', false]],
      issues: [['model-cache-2', 'Pod', 'Pending', true], ['pvc-model-cache-2', 'PVC', '挂载超时', true]],
      impact: 'StatefulSet副本不足 → model-cache-2 Pending → <strong>持久卷挂载超时</strong>。<br>读缓存能力降为 2／3，尚未影响数据一致性。',
      podsLink: '查看1个异常Pod →', targetLabel: '查看关联PVC →', targetNode: '', events: 4
    },
    'training-worker': {
      kind: 'Deployment', status: '更新中', statusClass: 'progress', scope: '项目B／training', created: '2026-06-10 16:40', strategy: 'RollingUpdate', image: 'trainer:v1.8.0', changed: '2分钟前更新镜像',
      replicas: [['期望', '12'], ['已更新', '10'], ['Ready', '10'], ['Available', '10']],
      conditions: [['Available', 'True', 'MinimumReplicasAvailable', false], ['Progressing', 'True', 'ReplicaSetUpdated', false]],
      issues: [['training-worker-6d5f-9p2cj', 'Pod', 'ContainerCreating', false], ['training-worker-6d5f-q7m4x', 'Pod', 'ContainerCreating', false]],
      impact: '滚动发布正常推进，10／12个副本已就绪；<strong>当前没有异常</strong>。', normal: true,
      podsLink: '查看12个Pods →', targetLabel: '查看发布记录 →', targetNode: '', events: 3
    },
    'dataset-index': {
      kind: 'Job', status: '执行中', statusClass: 'progress', scope: '项目C／data-pipeline', created: '2026-07-21 10:22', strategy: '并行度6／完成数24', image: 'indexer:v3.6.2', changed: '6分钟前开始执行',
      replicas: [['目标完成', '24'], ['已完成', '18'], ['Active', '6'], ['Failed', '0']],
      conditions: [['Complete', 'False', '任务仍在执行', false], ['Failed', 'False', '无失败重试', false]],
      issues: [['dataset-index', 'Job', '执行进度75%', false]],
      impact: '任务执行进度正常，当前6个Pods并行运行；<strong>预计8分钟完成</strong>。', normal: true,
      podsLink: '查看6个运行Pods →', targetLabel: '查看任务日志 →', targetNode: '', events: 2
    },
    'order-api': {
      kind: 'Deployment', status: '正常', statusClass: 'normal', scope: '项目A／order', created: '2026-03-12 11:08', strategy: 'RollingUpdate', image: 'order-api:v5.3.0', changed: '3天前发布完成',
      replicas: [['期望', '8'], ['已更新', '8'], ['Ready', '8'], ['Available', '8']],
      conditions: [['Available', 'True', 'MinimumReplicasAvailable', false], ['Progressing', 'True', 'NewReplicaSetAvailable', false]],
      issues: [['order-api', 'Deployment', '当前未发现异常', false]],
      impact: '全部副本可用，当前Workload运行正常。', normal: true,
      podsLink: '查看8个Pods →', targetLabel: '查看发布记录 →', targetNode: '', events: 1
    },
    'node-exporter': {
      kind: 'DaemonSet', status: '正常', statusClass: 'normal', scope: '平台运维／monitoring', created: '2026-01-15 10:12', strategy: 'RollingUpdate', image: 'node-exporter:v1.8.1', changed: '12天内无配置变化',
      replicas: [['期望节点', '78'], ['当前调度', '78'], ['Ready', '78'], ['Unavailable', '0']],
      conditions: [['Available', 'True', '目标节点全部覆盖', false], ['Updating', 'False', '当前无滚动更新', false]],
      issues: [['node-exporter', 'DaemonSet', '当前未发现异常', false]],
      impact: '目标节点全部覆盖，当前DaemonSet运行正常。', normal: true,
      podsLink: '查看78个Pods →', targetLabel: '查看目标Nodes →', targetNode: '', events: 1
    },
    'nightly-report': {
      kind: 'CronJob', status: '正常', statusClass: 'normal', scope: '项目D／ops', created: '2026-02-20 08:30', strategy: '0 1 * * *', image: 'reporter:v2.1.4', changed: '2小时前执行成功',
      replicas: [['最近执行', '成功'], ['当前Active', '0'], ['失败', '0'], ['下次执行', '01:00']],
      conditions: [['Suspended', 'False', '定时调度已启用', false], ['LastSchedule', '成功', '2小时前完成', false]],
      issues: [['nightly-report', 'CronJob', '当前未发现异常', false]],
      impact: '最近一次任务执行成功，下一次计划时间为01:00。', normal: true,
      podsLink: '查看执行历史 →', targetLabel: '查看最近Job →', targetNode: '', events: 1
    }
  };

  const renderWorkloadDetail = (workloadName) => {
    const detail = workloadDetails[workloadName];
    if (!detail) return;
    setText('workloadDetailName', workloadName);
    setText('workloadDetailMeta', `${detail.kind} · ${detail.scope}`);
    setText('workloadDetailKind', detail.kind);
    setText('workloadDetailCreated', detail.created);
    setText('workloadDetailScope', detail.scope);
    setText('workloadDetailStrategy', detail.strategy);
    setText('workloadDetailImage', detail.image);
    setText('workloadDetailChanged', detail.changed);
    const detailStatus = getById('workloadDetailStatus');
    if (detailStatus) { detailStatus.textContent = detail.status; detailStatus.className = `workload-detail-status${detail.statusClass ? ` ${detail.statusClass}` : ''}`; }
    const replicaGrid = getById('workloadReplicaGrid');
    if (replicaGrid) replicaGrid.innerHTML = detail.replicas.map(([label, value, bad]) => `<div class="workload-replica-item"><small>${label}</small><strong${bad ? ' class="bad"' : ''}>${value}</strong></div>`).join('');
    const conditionList = getById('workloadConditionList');
    if (conditionList) conditionList.innerHTML = detail.conditions.map(([type, state, reason, bad]) => `<div class="workload-condition-row"><span>${type}</span><strong class="workload-condition-state${bad ? ' bad' : ''}">${state}</strong><span class="workload-condition-reason">${reason}</span></div>`).join('');
    const issueList = getById('workloadIssueList');
    if (issueList) issueList.innerHTML = detail.issues.map(([name, kind, state, bad]) => `<div class="workload-issue-row"><span><strong>${name}</strong> · ${kind}</span><span class="workload-issue-state${bad ? '' : ' normal'}">${state}</span></div>`).join('');
    const impact = getById('workloadImpact');
    if (impact) { impact.innerHTML = detail.impact; impact.classList.toggle('normal', Boolean(detail.normal)); }
    setText('workloadPodsLink', detail.podsLink);
    setText('workloadEventsLink', `查看${detail.events}条相关事件 →`);
    const targetLink = getById('workloadNodeLink');
    if (targetLink) { targetLink.textContent = detail.targetLabel; targetLink.dataset.node = detail.targetNode; }
  };

  const workloadRows = Array.from(root.querySelectorAll('.workload-row[data-workload]'));
  workloadRows.forEach((row) => row.addEventListener('click', () => {
    workloadRows.forEach((item) => item.classList.remove('selected'));
    row.classList.add('selected');
    renderWorkloadDetail(row.dataset.workload);
  }));

  const workloadSummaryFilters = Array.from(root.querySelectorAll('.workload-summary-filter'));
  const workloadsListMeta = getById('workloadsListMeta');
  const workloadsPaginationMeta = getById('workloadsPaginationMeta');
  const workloadsPaginationPages = getById('workloadsPaginationPages');
  const applyWorkloadFilter = (filter, button) => {
    const resetToAll = button.classList.contains('active') && filter !== 'all';
    const activeFilter = resetToAll ? 'all' : filter;
    workloadSummaryFilters.forEach((item) => item.classList.toggle('active', item.dataset.workloadFilter === activeFilter));
    const visibleRows = workloadRows.filter((row) => {
      const visible = activeFilter === 'all' || row.dataset.health === activeFilter;
      row.style.display = visible ? 'grid' : 'none';
      return visible;
    });
    const activeButton = workloadSummaryFilters.find((item) => item.dataset.workloadFilter === activeFilter);
    const total = activeFilter === 'all' ? 126 : Number(activeButton.dataset.filterTotal || visibleRows.length);
    if (workloadsListMeta) workloadsListMeta.textContent = activeFilter === 'all' ? '按问题优先 · 共 126 个 · 2 个需关注' : `已筛选：${activeButton.dataset.filterLabel} · ${total} 个 Workload`;
    if (workloadsPaginationMeta) workloadsPaginationMeta.textContent = activeFilter === 'all' ? '显示 1–7，共 126 个 Workloads' : `当前页显示 ${visibleRows.length} 个，共 ${total} 个 Workloads`;
    if (workloadsPaginationPages) workloadsPaginationPages.style.visibility = activeFilter === 'all' ? 'visible' : 'hidden';
    const selectedVisible = visibleRows.includes(root.querySelector('.workload-row.selected'));
    if (!selectedVisible && visibleRows[0]) visibleRows[0].click();
  };
  workloadSummaryFilters.forEach((button) => button.addEventListener('click', () => applyWorkloadFilter(button.dataset.workloadFilter, button)));

  const workloadNodeLink = getById('workloadNodeLink');
  if (workloadNodeLink) workloadNodeLink.addEventListener('click', (event) => {
    event.stopPropagation();
    const nodeName = workloadNodeLink.dataset.node;
    if (!nodeName) return;
    const allNodesButton = root.querySelector('.node-summary-filter[data-node-filter="all"]');
    if (allNodesButton) applyNodeFilter('all', allNodesButton);
    applyView('nodes');
    const nodeRow = root.querySelector(`.node-row[data-node="${nodeName}"]`);
    if (nodeRow) nodeRow.click();
  });
};
