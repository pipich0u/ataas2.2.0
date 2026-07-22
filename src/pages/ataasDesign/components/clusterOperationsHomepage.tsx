import { useEffect, useRef } from 'react';
import { initializeClusterOperations } from './clusterOperationsRuntime';
import './clusterOperationsHomepage.less';

type ClusterOperationsSection = 'overview' | 'resource-access' | 'distribution-center';

type ClusterOperationsHomepageProps = {
  initialSection?: ClusterOperationsSection;
};

const sectionHashes: Record<ClusterOperationsSection, string> = {
  overview: '',
  'resource-access': 'supplier-list',
  'distribution-center': 'model-distribution',
};

const ClusterOperationsHomepage = ({ initialSection = 'overview' }: ClusterOperationsHomepageProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const targetHash = sectionHashes[initialSection];
    const targetUrl = `${window.location.pathname}${window.location.search}${targetHash ? `#${targetHash}` : ''}`;
    window.history.replaceState(null, '', targetUrl);
    initializeClusterOperations(rootRef.current);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }, [initialSection]);

  return (
    <div ref={rootRef} className="cluster-operations-homepage">
    <aside className="resource-tree">
      <div className="tree-header"><span className="tree-title">资源树</span></div>
      <div className="tree-controls">
        <div className="tree-search"><span className="magnify"></span>搜索供应商、数据中心、集群</div>
      </div>
      <div className="tree-scroll">
        <div className="tree-all"><span>⌄ 全部机器</span><span className="tree-all-count">已纳管248台 · 异常5</span></div>
        <div className="tree-stats"><span>供应商<strong>5</strong></span><span>数据中心<strong>8</strong></span><span>集群<strong>4</strong></span><span>资源段<strong>6</strong></span></div>
        <div className="tree-provider">
          <div className="tree-provider-head"><span className="tree-chevron">⌄</span><span>厂商A · xxx科技</span><span className="tree-provider-count">2个中心</span></div>
          <div className="tree-dc">
            <div className="tree-dc-head"><span className="tree-chevron">⌄</span><span>上海一号数据中心</span><span className="tree-dc-count">2</span></div>
            <div className="tree-cluster-link active"><span></span><span>gpu-prod-01<small className="tree-link-meta">上海资源段</small></span><span className="tree-node-count">82台</span></div>
            <div className="tree-cluster-link"><span></span><span>gpu-test-sh-01</span><span className="tree-node-count">24台</span></div>
          </div>
        </div>
        <div className="tree-provider">
          <div className="tree-provider-head"><span className="tree-chevron">⌄</span><span>厂商B · 中原算力</span><span className="tree-provider-count">1个中心</span></div>
          <div className="tree-dc">
            <div className="tree-dc-head"><span className="tree-chevron">⌄</span><span>郑州高新数据中心</span><span className="tree-dc-count">2</span></div>
            <div className="tree-cluster-link"><span></span><span>gpu-prod-01<small className="tree-link-meta">郑州资源段 · 点击查看本段</small></span><span className="tree-node-count bad">64台 · 异常2</span></div>
            <div className="tree-cluster-link"><span></span><span>gpu-dev-zz-01</span><span className="tree-node-count">32台</span></div>
          </div>
        </div>
        <div className="tree-provider">
          <div className="tree-provider-head"><span className="tree-chevron">⌄</span><span>厂商C · 华北云</span><span className="tree-provider-count">1个中心</span></div>
          <div className="tree-dc">
            <div className="tree-dc-head"><span className="tree-chevron">⌄</span><span>北京亦庄数据中心</span><span className="tree-dc-count">1</span></div>
            <div className="tree-cluster-link"><span></span><span>gpu-prod-01<small className="tree-link-meta">北京资源段 · 点击查看本段</small></span><span className="tree-node-count">40台</span></div>
          </div>
        </div>
        <div className="tree-provider"><div className="tree-provider-head"><span className="tree-chevron">›</span><span>厂商D · 边缘算力</span><span className="tree-provider-count">2个中心</span></div></div>
        <div className="tree-provider"><div className="tree-provider-head"><span className="tree-chevron">›</span><span>厂商E · 海外云</span><span className="tree-provider-count">2个中心</span></div></div>
      </div>
      <div className="tree-footer"><div className="tree-unmanaged"><span>未纳管裸金属</span><strong>8 台 · 去纳管 →</strong></div></div>
    </aside>

    <section className="workspace">
      <header className="topbar">
        <div className="product-context">集群资源概览 <span>/</span> <strong>gpu-prod-01</strong></div>
        <div className="abnormal-toggle"><span className="switch"></span>只看异常</div>
        <div className="avatar">运维</div>
      </header>

      <main className="content">
        <div className="page-title-row">
          <div><div className="page-title-line"><div className="page-title">gpu-prod-01</div><span className="cluster-code">上海资源段</span><span className="cluster-running">运行中</span><span className="cluster-health">健康状态：有异常</span></div><div className="page-subtitle"><span>供应商：<b>xxx科技</b></span><span>数据中心：<b>上海一号数据中心</b></span><span>Kubernetes：<b>v1.36.2</b></span><span>裸金属：<b>82</b></span><span>Nodes：<b>80</b></span></div></div>
          <div className="page-actions">
            <div className="freshness">数据更新于 10:28:36 · 自动刷新 30s</div>
            <button id="overviewMachineOnboardAction" type="button" className="onboard-action overview-only-action" title="将新机器纳入上海一号数据中心，验收后可继续加入 gpu-prod-01"><span>＋</span>纳管裸金属</button>
            <button id="nodesScaleAction" type="button" className="onboard-action nodes-only-action" title="从当前数据中心的已纳管机器中选择，加入 gpu-prod-01"><span>＋</span>节点扩缩容</button>
          </div>
        </div>

        <nav className="module-nav">
          <div className="module-tab active" data-view="overview">总览</div>
          <div className="module-tab" data-view="nodes" title="Kubernetes Node对象及Ready、压力和调度状态">Nodes<span className="count" title="异常3个">3</span></div>
          <div className="module-tab" data-view="workloads" title="Deployment、StatefulSet、DaemonSet、Job和CronJob等工作负载">Workloads<span className="count" title="异常2个">2</span></div>
          <div className="module-tab" title="Pod运行阶段、容器状态、重启和调度情况">Pods<span className="count" title="异常10个">10</span></div>
          <div className="module-tab" title="展示后端运行在上海资源段的Services；ServiceEntry为集群级配置">Services<span className="count" title="关联服务异常3项">3</span></div>
          <div className="module-tab group-start" title="当前资源段关联的PV、PVC及StorageClass状态">PV/PVC<span className="count" title="异常2项">2</span></div>
          <div className="module-tab" title="当前资源段CNI、网卡、链路和流量状态">网络<span className="count" title="异常1项">1</span></div>
          <div className="module-tab" title="当前资源段kubelet、CNI/CSI和Device Plugin等组件">系统组件<span className="count" title="异常1项">1</span></div>
          <div className="module-tab group-start" title="当前资源段相关的纳管、上下线、扩缩容、远程部署和软件下发任务">运维任务<span className="count neutral" title="执行中或待确认4项">4</span></div>
        </nav>

        <div className="overview-view">
        <section className="card resource-overview-card">
          <div className="card-head"><div className="card-title">上海资源段资源总览</div><div className="card-link">查看本资源段全部资源 →</div></div>
          <div className="overview-grid">
            <div className="overview-item"><div className="overview-head"><span className="overview-title"><i className="hardware-icon">BM</i>裸金属与 Nodes</span><span className="overview-state bad">硬件异常1台</span></div><div className="overview-dual"><div className="overview-value"><small>裸金属总数</small><strong>82</strong></div><div className="overview-value"><small>Node总数</small><strong>80</strong></div></div><div className="overview-details"><div className="overview-detail"><span>在线／Ready</span><b>81台／78个</b></div><div className="overview-detail"><span>未注册／NotReady</span><b className="bad">2台／2个</b></div><div className="overview-detail"><span>BMC异常／维护中</span><b className="bad">1台／1台</b></div></div></div>
            <div className="overview-item"><div className="overview-head"><span className="overview-title"><i className="hardware-icon">CPU</i>CPU 与内存</span><span className="overview-state bad">高负载2台</span></div><div className="overview-columns"><div className="overview-column"><small>CPU实际使用率</small><strong>61%</strong><div className="overview-column-details"><div className="overview-column-detail"><span>Requests</span><b>67%</b></div><div className="overview-column-detail"><span>可分配</span><b>5,248核</b></div><div className="overview-column-detail"><span>可调度余量</span><b>1,732核</b></div></div></div><div className="overview-column"><small>内存实际使用率</small><strong>69%</strong><div className="overview-column-details"><div className="overview-column-detail"><span>Requests</span><b>74%</b></div><div className="overview-column-detail"><span>可分配</span><b>21.0TB</b></div><div className="overview-column-detail"><span>可调度余量</span><b>5.5TB</b></div></div></div></div></div>
            <div className="overview-item"><div className="overview-head"><span className="overview-title"><i className="hardware-icon">GPU</i>GPU 与显存</span><span className="overview-state bad">异常GPU 4张</span></div><div className="overview-dual"><div className="overview-value"><small>GPU平均利用率</small><strong>75%</strong></div><div className="overview-value"><small>显存平均使用率</small><strong>80%</strong></div></div><div className="overview-details"><div className="overview-detail"><span>设备总量／已分配</span><b>328／272张</b></div><div className="overview-detail"><span>高温告警</span><b className="bad">2张 ＞85℃</b></div><div className="overview-detail"><span>主要型号</span><b>A100／A800</b></div></div></div>
            <div className="overview-item"><div className="overview-head"><span className="overview-title"><i className="hardware-icon">I/O</i>存储与网络</span><span className="overview-state bad">磁盘2块／网卡1张异常</span></div><div className="overview-columns"><div className="overview-column storage-column"><small>存储</small><strong>61%</strong><div className="overview-column-details"><div className="overview-column-detail"><span>总容量</span><b>840TB</b></div><div className="overview-column-detail"><span>异常磁盘</span><b className="bad">2块</b></div></div></div><div className="overview-column"><small>网络当前吞吐</small><div className="traffic-values"><span className="traffic-value"><small>接收</small><strong>1.4</strong></span><span className="traffic-value"><small>发送</small><strong>1.2</strong></span></div><div className="traffic-unit">Tbps · 5分钟平均</div><div className="overview-column-details"><div className="overview-column-detail"><span>标称带宽</span><b>8.2Tbps</b></div><div className="overview-column-detail"><span>异常网卡</span><b className="bad">1张</b></div></div></div></div></div>
            <div className="overview-item"><div className="overview-head"><span className="overview-title"><i className="hardware-icon">K8S</i>Pods 与服务</span><span className="overview-state bad">关联服务异常3项</span></div><div className="overview-dual"><div className="overview-value"><small>本段运行Pods</small><strong>5,420</strong></div><div className="overview-value"><small>关联Services</small><strong>286</strong></div></div><div className="overview-details"><div className="overview-detail"><span>异常Pods／其中Pending</span><b className="bad">10／6</b></div><div className="overview-detail"><span>服务后端就绪率</span><b>99.1%</b></div><div className="overview-detail"><span>统计口径</span><b>后端位于本资源段</b></div></div></div>
          </div>
        </section>

        <div className="lower-grid">
          <section className="card lower-card">
            <div className="card-head"><div className="card-title">异常与故障定位</div><div className="card-link">查看本资源段聚合故障 9 →</div></div>
            <div className="fault-collapse-hint"><strong>上海资源段当前有9个聚合故障，优先展示影响最大的4项</strong></div>
            <div className="fault-list">
              <div className="fault-row"><div><div className="fault-title-line"><span className="fault-level">严重</span><span className="fault-title">payment-service 服务降级</span></div><div className="fault-context">项目A · 厂商A／上海一号数据中心 · 10分钟前 · 关联7条告警</div><div className="fault-chain-line">Service → EndpointSlice无就绪地址 → Pod NotReady → Node NotReady → <strong>BM-00001027物理网卡丢包</strong></div></div><div className="fault-side"><div className="fault-impact">影响5个Pods／2个SVC</div><span className="fault-status">已定位根因 →</span></div></div>
              <div className="fault-row"><div><div className="fault-title-line"><span className="fault-level amber">重要</span><span className="fault-title">训练任务排队数量持续增加</span></div><div className="fault-context">项目B · 厂商A／上海一号数据中心 · 18分钟前 · 关联5条告警</div><div className="fault-chain-line amber">Pending Jobs → GPU Device Plugin异常 → <strong>2张GPU出现Xid错误</strong></div></div><div className="fault-side"><div className="fault-impact">影响6个训练任务</div><span className="fault-status">已定位根因 →</span></div></div>
              <div className="fault-row"><div><div className="fault-title-line"><span className="fault-level amber">重要</span><span className="fault-title">外部模型服务调用超时</span></div><div className="fault-context">项目C · 厂商A／上海一号数据中心 · 23分钟前 · 3条原始告警</div><div className="fault-chain-line amber">ServiceEntry → 外部后端探测超时 → 3个业务服务P95升高 → <strong>根因定位中</strong></div></div><div className="fault-side"><div className="fault-impact">影响3个服务</div><span className="fault-status tracking">定位中 →</span></div></div>
              <div className="fault-row"><div><div className="fault-title-line"><span className="fault-level amber">重要</span><span className="fault-title">本地存储可用容量不足</span></div><div className="fault-context">项目E · 厂商A／上海一号数据中心 · 36分钟前 · 关联4条告警</div><div className="fault-chain-line amber">PVC写入告警 → Local PV容量不足 → 2块硬盘SMART异常 → <strong>需确认更换硬盘</strong></div></div><div className="fault-side"><div className="fault-impact">影响1个StatefulSet</div><span className="fault-status tracking">待人工确认 →</span></div></div>
            </div>
          </section>

          <section className="card lower-card">
            <div className="card-head"><div className="card-title">集群接入、资产待办与运维任务</div><div className="card-link">进入运维任务 →</div></div>
            <div className="quick-actions">
              <button id="overviewClusterCreateAction" type="button" className="quick-btn" title="此入口不纳管裸金属：可以使用已纳管机器部署新集群，或接入已有 Kubernetes 集群"><span className="quick-main">创建／接入其他集群</span><small>在当前数据中心新增集群</small></button>
              <div className="quick-btn"><span className="quick-main">启用调度</span><small>验收通过后承载新任务</small></div>
              <div className="quick-btn"><span className="quick-main">停用调度</span><small>停止新任务并排空Pod</small></div>
              <button id="overviewNodeScaleAction" type="button" className="quick-btn"><span className="quick-main">节点扩缩容</span><small>新增或移除 Nodes</small></button>
              <div className="quick-btn"><span className="quick-main">远程部署与下发</span><small>组件、驱动和Agent</small></div>
              <div className="quick-btn danger"><span className="quick-main">取消纳管</span><small>解除连接并保留历史记录</small></div>
            </div>
            <div className="ops-section-title">资产待办 <span>3项需要处理</span></div>
            <div className="todo-list"><div className="todo-row"><div><div className="todo-name">6台裸金属将在30天内到期</div><div className="todo-meta">厂商A · 上海一号数据中心 · 项目A</div></div><span className="todo-action">续租／下线 →</span></div><div className="todo-row"><div><div className="todo-name">新到货2台裸金属尚未纳管</div><div className="todo-meta">厂商A · 上海一号数据中心 · 到货2天</div></div><span className="todo-action">去纳管 →</span></div><div className="todo-row"><div><div className="todo-name">1台裸金属已到计划下线时间</div><div className="todo-meta">厂商A · 上海一号数据中心 · 已完成Node排空</div></div><span className="todo-action red">确认下线 →</span></div></div>
            <div className="ops-section-title">执行中的任务 <span>4个任务</span></div>
            <div className="task-list ops"><div className="task"><div className="task-top"><span className="task-name">节点纳管 · gpu-prod-01 · 上海资源段</span><span className="task-status">执行中 60%</span></div><div className="task-track"><span style={{ width: '60%' }}></span></div><div className="task-meta"><span>SSH连通6／10台</span><span>校验IP并安装接入组件</span></div></div><div className="task"><div className="task-top"><span className="task-name">资源段扩容 · gpu-prod-01 · 上海10台</span><span className="task-status">执行中 82%</span></div><div className="task-track"><span style={{ width: '82%' }}></span></div><div className="task-meta"><span>网络、存储配置已完成</span><span>等待Node健康验收</span></div></div><div className="task"><div className="task-top"><span className="task-name">节点下线 · BM-00000018</span><span className="task-status amber">等待确认</span></div><div className="task-track"><span className="amber" style={{ width: '35%' }}></span></div><div className="task-meta"><span>前置步骤完成35%</span><span>已排空Pod并等待业务确认</span></div></div><div className="task"><div className="task-top"><span className="task-name">平台组件下发 · Node Agent v2.6.1</span><span className="task-status">执行中 42%</span></div><div className="task-track"><span style={{ width: '42%' }}></span></div><div className="task-meta"><span>已完成34／82台</span><span>灰度安装并验证节点心跳</span></div></div></div>
          </section>
        </div>
        </div>

        <section className="nodes-view">
          <div className="card nodes-summary">
            <div className="node-summary-group runtime"><span className="node-summary-group-title">Kubernetes 运行状态</span>
              <button type="button" className="node-summary-item node-summary-filter active" data-node-filter="all" data-filter-label="全部 Nodes"><span className="node-summary-label">Node 总数</span><strong className="node-summary-value">80</strong><span className="node-summary-meta">当前资源段</span></button>
              <button type="button" className="node-summary-item node-summary-filter" data-node-filter="notready" data-filter-label="NotReady" data-filter-total="2"><span className="node-summary-label">K8s 状态</span><strong className="node-summary-value">78 <small className="bad-inline">/ 2</small></strong><span className="node-summary-meta">Ready / NotReady · 点击异常数筛选</span></button>
              <div className="node-summary-item" title="Ready且未被人工暂停调度的Node；具体Pod能否调度还需检查资源、标签、污点和亲和性等条件"><span className="node-summary-label">可参与调度</span><strong className="node-summary-value">75</strong><span className="node-summary-meta">基础可用 · 另5个不可参与</span></div>
            </div>
            <div className="node-summary-group attention">
              <button type="button" className="node-summary-item node-summary-filter" data-node-filter="attention" data-filter-label="需关注节点" data-filter-total="3"><span className="node-summary-label">需关注节点</span><strong className="node-summary-value bad">3 <small>台</small></strong><span className="node-summary-meta">按 Node 去重</span></button>
              <button type="button" className="node-summary-item node-summary-filter" data-node-filter="pressure" data-filter-label="DiskPressure" data-filter-total="1"><span className="node-summary-label">节点压力</span><strong className="node-summary-value bad">1 <small>台</small></strong><span className="node-summary-meta">DiskPressure</span></button>
              <button type="button" className="node-summary-item node-summary-filter" data-node-filter="hardware-gpu" data-filter-label="硬件／GPU异常" data-filter-total="2"><span className="node-summary-label">硬件／GPU 异常</span><strong className="node-summary-value bad">2 <small>台</small></strong><span className="node-summary-meta">物理机1台 · GPU4张</span></button>
            </div>
          </div>

          <div className="card nodes-toolbar">
            <div className="node-search"><span className="magnify"></span>搜索 Node、IP、裸金属或 GPU 序列号</div>
            <div className="node-filter">全部状态</div>
            <div className="node-filter">全部角色</div>
            <div className="node-filter">全部节点类型</div>
            <div className="node-filter">全部调度状态</div>
            <div className="node-filter">标签／污点</div>
          </div>

          <div className="nodes-workspace">
            <section className="card nodes-list-card">
              <div className="nodes-list-head"><span className="nodes-list-title">Nodes 列表</span><span id="nodesListMeta" className="nodes-list-meta">按影响优先 · 共 80 个 Node · 3 个需关注</span></div>
              <div className="nodes-table-header"><span>Node／IP</span><span>K8s 状态</span><span>角色／类型</span><span>运行 Pods</span><span>CPU</span><span>内存</span><span>GPU 分配／利用</span><span>物理机器／硬件</span><span>Kubelet 最近上报</span></div>

              <div className="node-row selected" data-node="gpu-node-07" data-attention="true" data-issues="notready hardware-gpu">
                <div><span className="node-name">gpu-node-07</span><span className="node-sub">10.24.18.107 · v1.36.2</span></div>
                <div><span className="node-status bad">NotReady</span><span className="node-sub">节点不可用</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点</span></div>
                <div className="node-pods"><strong>32</strong><span className="node-sub">异常 Pod 5 · 上限110</span></div>
                <div><div className="node-resource-main"><span>84%</span><small>Req 76%</small></div><div className="node-bar"><span style={{ width: '84%' }}></span></div></div>
                <div><div className="node-resource-main"><span>71%</span><small>Req 72%</small></div><div className="node-bar"><span style={{ width: '71%' }}></span></div></div>
                <div><span className="node-gpu bad">7／8 · 92%</span><span className="node-sub">2 张 Xid 异常</span></div>
                <div className="node-machine"><strong>BM-00001027</strong><span className="node-sub bad">网卡丢包 4.8%</span></div>
                <div><span className="bad">3分钟前</span><span className="node-sub">Kubelet 无回报</span></div>
              </div>

              <div className="node-row" data-node="gpu-node-52" data-attention="true" data-issues="notready">
                <div><span className="node-name">gpu-node-52</span><span className="node-sub">10.24.18.152 · v1.36.2</span></div>
                <div><span className="node-status bad">NotReady</span><span className="node-sub">节点不可用</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点</span></div>
                <div className="node-pods"><strong>9</strong><span className="node-sub">异常 Pod 9 · 上限110</span></div>
                <div><div className="node-resource-main"><span>—</span><small>Req 41%</small></div><div className="node-bar"></div></div>
                <div><div className="node-resource-main"><span>—</span><small>Req 58%</small></div><div className="node-bar"></div></div>
                <div><span className="node-gpu">4／8 · —</span><span className="node-sub">A100 · 状态未知</span></div>
                <div className="node-machine"><strong>BM-00001102</strong><span className="node-sub">硬件健康</span></div>
                <div><span className="bad">18分钟前</span><span className="node-sub">Kubelet 无回报</span></div>
              </div>

              <div className="node-row" data-node="gpu-node-12" data-attention="true" data-issues="pressure hardware-gpu">
                <div><span className="node-name">gpu-node-12</span><span className="node-sub">10.24.18.112 · v1.36.2</span></div>
                <div><span className="node-status">Ready</span><span className="node-sub">节点正常</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点 · 调度已暂停</span></div>
                <div className="node-pods"><strong>88</strong><span className="node-sub">异常 Pod 0 · 上限110</span></div>
                <div><div className="node-resource-main"><span>77%</span><small>Req 79%</small></div><div className="node-bar"><span style={{ width: '77%' }}></span></div></div>
                <div><div className="node-resource-main"><span>82%</span><small>Req 84%</small></div><div className="node-bar"><span style={{ width: '82%' }}></span></div></div>
                <div><span className="node-gpu bad">6／8 · 85%</span><span className="node-sub">2 张高温 · GPU 告警</span></div>
                <div className="node-machine"><strong>BM-00001032</strong><span className="node-sub bad">DiskPressure · 本地盘 92%</span></div>
                <div>24秒前<span className="node-sub">心跳正常</span></div>
              </div>

              <div className="node-row" data-node="gpu-node-18" data-attention="false" data-issues="">
                <div><span className="node-name">gpu-node-18</span><span className="node-sub">10.24.18.118 · v1.36.2</span></div>
                <div><span className="node-status">Ready</span><span className="node-sub">节点正常</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点</span></div>
                <div className="node-pods"><strong>96</strong><span className="node-sub">异常 Pod 0 · 上限110</span></div>
                <div><div className="node-resource-main"><span>68%</span><small>Req 72%</small></div><div className="node-bar"><span style={{ width: '68%' }}></span></div></div>
                <div><div className="node-resource-main"><span>74%</span><small>Req 76%</small></div><div className="node-bar"><span style={{ width: '74%' }}></span></div></div>
                <div><span className="node-gpu">8／8 · 81%</span><span className="node-sub">A100 · 健康</span></div>
                <div className="node-machine"><strong>BM-00001045</strong><span className="node-sub">硬件健康</span></div>
                <div>18秒前<span className="node-sub">心跳正常</span></div>
              </div>

              <div className="node-row" data-node="gpu-node-23" data-attention="false" data-issues="">
                <div><span className="node-name">gpu-node-23</span><span className="node-sub">10.24.18.123 · v1.36.2</span></div>
                <div><span className="node-status">Ready</span><span className="node-sub">节点正常</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点</span></div>
                <div className="node-pods"><strong>72</strong><span className="node-sub">异常 Pod 0 · 上限110</span></div>
                <div><div className="node-resource-main"><span>62%</span><small>Req 67%</small></div><div className="node-bar"><span style={{ width: '62%' }}></span></div></div>
                <div><div className="node-resource-main"><span>69%</span><small>Req 74%</small></div><div className="node-bar"><span style={{ width: '69%' }}></span></div></div>
                <div><span className="node-gpu">6／8 · 63%</span><span className="node-sub">A100 · 健康</span></div>
                <div className="node-machine"><strong>BM-00001050</strong><span className="node-sub">硬件健康</span></div>
                <div>15秒前<span className="node-sub">心跳正常</span></div>
              </div>

              <div className="node-row" data-node="cpu-node-04" data-attention="false" data-issues="">
                <div><span className="node-name">cpu-node-04</span><span className="node-sub">10.24.18.204 · v1.36.2</span></div>
                <div><span className="node-status">Ready</span><span className="node-sub">节点正常</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">CPU 节点</span></div>
                <div className="node-pods"><strong>104</strong><span className="node-sub">异常 Pod 0 · 上限110</span></div>
                <div><div className="node-resource-main"><span>55%</span><small>Req 60%</small></div><div className="node-bar"><span style={{ width: '55%' }}></span></div></div>
                <div><div className="node-resource-main"><span>66%</span><small>Req 70%</small></div><div className="node-bar"><span style={{ width: '66%' }}></span></div></div>
                <div><span className="node-gpu">—</span><span className="node-sub">无 GPU</span></div>
                <div className="node-machine"><strong>BM-00001093</strong><span className="node-sub">硬件健康</span></div>
                <div>12秒前<span className="node-sub">心跳正常</span></div>
              </div>

              <div className="node-row" data-node="gpu-node-31" data-attention="false" data-issues="">
                <div><span className="node-name">gpu-node-31</span><span className="node-sub">10.24.18.131 · v1.36.2</span></div>
                <div><span className="node-status">Ready</span><span className="node-sub">节点正常</span></div>
                <div className="node-type"><strong>Worker</strong><span className="node-sub">GPU 节点</span></div>
                <div className="node-pods"><strong>90</strong><span className="node-sub">异常 Pod 0 · 上限110</span></div>
                <div><div className="node-resource-main"><span>49%</span><small>Req 58%</small></div><div className="node-bar"><span style={{ width: '49%' }}></span></div></div>
                <div><div className="node-resource-main"><span>61%</span><small>Req 68%</small></div><div className="node-bar"><span style={{ width: '61%' }}></span></div></div>
                <div><span className="node-gpu">8／8 · 78%</span><span className="node-sub">A800 · 健康</span></div>
                <div className="node-machine"><strong>BM-00001068</strong><span className="node-sub">硬件健康</span></div>
                <div>21秒前<span className="node-sub">心跳正常</span></div>
              </div>

              <div className="nodes-pagination"><span id="nodesPaginationMeta">显示 1–7，共 80 个 Nodes</span><span id="nodesPaginationPages"><i className="page-chip">1</i>&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;…&nbsp;&nbsp;12&nbsp;&nbsp;›</span></div>
            </section>

            <aside className="card node-detail-card">
              <div className="node-detail-head"><div><div className="node-detail-name"><span id="detailNodeName">gpu-node-07</span> <span id="detailNodeStatus" className="node-status bad">NotReady</span></div><div id="detailNodeId" className="node-detail-id">Worker · GPU · 10.24.18.107</div></div><div className="node-detail-links"><span id="detailBmLink" className="node-detail-link">查看物理机器 BM-00001027 →</span></div></div>
              <div className="node-detail-body">
                <section className="detail-section"><div className="detail-section-title">基本信息</div><div className="node-basic-grid">
                  <div className="node-basic-item"><small>Kubernetes</small><strong>v1.36.2</strong></div><div className="node-basic-item"><small>运行时</small><strong>containerd 2.0.2</strong></div>
                  <div className="node-basic-item"><small>操作系统</small><strong>TencentOS Server 4</strong></div><div className="node-basic-item"><small>内核</small><strong>6.6.30-x86_64</strong></div>
                  <div className="node-basic-item"><small>数据中心</small><strong>上海一号数据中心</strong></div><div className="node-basic-item"><small>对应物理机器</small><strong id="detailBmValue">BM-00001027</strong></div>
                </div></section>

                <section className="detail-section"><div className="detail-section-title">Node Conditions</div>
                  <div className="condition-row"><span>Ready</span><strong id="detailReady" className="condition-state bad">False</strong><span id="detailReadyTime" className="condition-time">3 分钟前</span></div>
                  <div className="condition-row"><span>MemoryPressure</span><strong id="detailMemoryPressure" className="condition-state">False</strong><span className="condition-time detail-condition-time">3 分钟前</span></div>
                  <div className="condition-row"><span>DiskPressure</span><strong id="detailDiskPressure" className="condition-state">False</strong><span className="condition-time detail-condition-time">3 分钟前</span></div>
                  <div className="condition-row"><span>PIDPressure</span><strong id="detailPidPressure" className="condition-state">False</strong><span className="condition-time detail-condition-time">3 分钟前</span></div>
                  <div className="condition-row"><span>NetworkUnavailable</span><strong id="detailNetworkUnavailable" className="condition-state">False</strong><span className="condition-time detail-condition-time">3 分钟前</span></div>
                </section>

                <section className="detail-section"><div className="detail-section-title">调度与标识</div><div className="node-context-grid">
                  <div className="node-context-item"><small>人工调度设置</small><strong id="detailManualSchedule">未禁止调度</strong></div>
                  <div className="node-context-item"><small>当前调度结果</small><strong id="detailScheduleResult" className="bad">不可参与（NotReady）</strong></div>
                  <div className="node-context-item"><small>影响调度的污点</small><strong id="detailTaints">unreachable:NoSchedule</strong></div>
                  <div className="node-context-item"><small>主要标签</small><strong id="detailLabels">worker · gpu · a100</strong></div>
                </div></section>

                <section className="detail-section"><div className="detail-section-title with-meta"><span>当前 Node 异常与影响</span><span id="detailFreshness" className="node-data-freshness">监控数据停留在 3 分钟前</span></div>
                  <div id="detailIssueList" className="node-issue-list">
                    <div className="node-issue-row"><span className="node-issue-source">Kubernetes</span><span className="node-issue-text">NotReady · Kubelet 3 分钟未上报</span></div>
                    <div className="node-issue-row"><span className="node-issue-source">物理机器</span><span className="node-issue-text">BM-00001027 · bond0 丢包 4.8%</span></div>
                    <div className="node-issue-row"><span className="node-issue-source">GPU</span><span className="node-issue-text">2 张 A100 出现 Xid</span></div>
                  </div>
                  <div id="detailImpact" className="node-impact"><strong>影响范围</strong>：5 个异常 Pods · 影响 2 个 Services。</div>
                  <div className="node-scope-links"><span id="detailPodsLink" className="node-scope-link">查看 5 个异常 Pods →</span><span id="detailEventsLink" className="node-scope-link">查看 7 条相关事件 →</span><span className="node-scope-link">查看该 Node 资源监控 →</span></div>
                </section>
              </div>
            </aside>
          </div>
        </section>

        <section className="workloads-view">
          <div className="card workloads-summary">
            <button type="button" className="workload-summary-item workload-summary-filter active" data-workload-filter="all" data-filter-label="全部 Workloads"><span className="workload-summary-label">Workloads 总数</span><strong className="workload-summary-value">126</strong><span className="workload-summary-meta">当前资源段</span></button>
            <button type="button" className="workload-summary-item workload-summary-filter" data-workload-filter="normal" data-filter-label="状态正常" data-filter-total="122"><span className="workload-summary-label">状态正常</span><strong className="workload-summary-value">122</strong><span className="workload-summary-meta">控制器符合预期状态</span></button>
            <button type="button" className="workload-summary-item workload-summary-filter" data-workload-filter="progress" data-filter-label="进行中" data-filter-total="2"><span className="workload-summary-label">进行中</span><strong className="workload-summary-value">2</strong><span className="workload-summary-meta">滚动更新1 · Job执行1</span></button>
            <button type="button" className="workload-summary-item workload-summary-filter" data-workload-filter="problem" data-filter-label="需关注" data-filter-total="2"><span className="workload-summary-label">需关注</span><strong className="workload-summary-value bad">2</strong><span className="workload-summary-meta">按 Workload 去重</span></button>
          </div>

          <div className="card workloads-toolbar">
            <div className="workload-search"><span className="magnify"></span>搜索 Workload、项目或 Namespace</div>
            <div className="workload-filter">全部类型</div>
            <div className="workload-filter">全部状态</div>
            <div className="workload-filter">全部项目</div>
            <div className="workload-filter">全部 Namespace</div>
          </div>

          <div className="workloads-workspace">
            <section className="card workloads-list-card">
              <div className="workloads-list-head"><span className="workloads-list-title">Workloads 列表</span><span id="workloadsListMeta" className="workloads-list-meta">按问题优先 · 共 126 个 · 2 个需关注</span></div>
              <div className="workloads-table-header"><span>名称／项目·Namespace</span><span>类型</span><span>状态</span><span>副本／执行进度</span><span>Pods</span><span>版本／镜像</span><span>最近变化</span><span>当前问题</span></div>

              <div className="workload-row selected" data-workload="payment-api" data-health="problem">
                <div><span className="workload-name">payment-api</span><span className="workload-sub">项目A · payment</span></div>
                <div><span className="workload-kind">Deployment</span><span className="workload-sub">无状态服务</span></div>
                <div><span className="workload-health bad">需关注</span><span className="workload-sub">发布超时</span></div>
                <div className="workload-ready"><strong>3／5 Ready</strong><div className="workload-progress-bar"><span style={{ width: '60%' }}></span></div></div>
                <div className="workload-pods"><strong>5</strong><span className="workload-sub bad">异常 2</span></div>
                <div><span className="workload-version">v2.4.1</span><span className="workload-sub">payment-api</span></div>
                <div>10分钟前<span className="workload-sub">配置已更新</span></div>
                <div className="workload-problem bad">ProgressDeadlineExceeded<span className="workload-sub">2个Pod未就绪</span></div>
              </div>

              <div className="workload-row" data-workload="model-cache" data-health="problem">
                <div><span className="workload-name">model-cache</span><span className="workload-sub">项目B · inference</span></div>
                <div><span className="workload-kind">StatefulSet</span><span className="workload-sub">有状态服务</span></div>
                <div><span className="workload-health bad">需关注</span><span className="workload-sub">副本不足</span></div>
                <div className="workload-ready"><strong>2／3 Ready</strong><div className="workload-progress-bar"><span style={{ width: '67%' }}></span></div></div>
                <div className="workload-pods"><strong>3</strong><span className="workload-sub bad">异常 1</span></div>
                <div><span className="workload-version">7.2.5</span><span className="workload-sub">redis</span></div>
                <div>18分钟前<span className="workload-sub">Pod重建</span></div>
                <div className="workload-problem bad">Volume挂载超时<span className="workload-sub">关联PVC不可用</span></div>
              </div>

              <div className="workload-row" data-workload="training-worker" data-health="progress">
                <div><span className="workload-name">training-worker</span><span className="workload-sub">项目B · training</span></div>
                <div><span className="workload-kind">Deployment</span><span className="workload-sub">GPU训练服务</span></div>
                <div><span className="workload-health progress">更新中</span><span className="workload-sub">滚动发布</span></div>
                <div className="workload-ready"><strong>10／12 Ready</strong><div className="workload-progress-bar"><span style={{ width: '83%' }}></span></div></div>
                <div className="workload-pods"><strong>12</strong><span className="workload-sub">2个创建中</span></div>
                <div><span className="workload-version">v1.8.0</span><span className="workload-sub">trainer</span></div>
                <div>2分钟前<span className="workload-sub">镜像已更新</span></div>
                <div className="workload-problem">发布正常推进<span className="workload-sub">尚未产生异常</span></div>
              </div>

              <div className="workload-row" data-workload="dataset-index" data-health="progress">
                <div><span className="workload-name">dataset-index</span><span className="workload-sub">项目C · data-pipeline</span></div>
                <div><span className="workload-kind">Job</span><span className="workload-sub">一次性任务</span></div>
                <div><span className="workload-health progress">执行中</span><span className="workload-sub">无失败重试</span></div>
                <div className="workload-ready"><strong>18／24 完成</strong><div className="workload-progress-bar"><span style={{ width: '75%' }}></span></div></div>
                <div className="workload-pods"><strong>6</strong><span className="workload-sub">运行中</span></div>
                <div><span className="workload-version">v3.6.2</span><span className="workload-sub">indexer</span></div>
                <div>6分钟前<span className="workload-sub">任务启动</span></div>
                <div className="workload-problem">执行进度正常<span className="workload-sub">预计8分钟完成</span></div>
              </div>

              <div className="workload-row" data-workload="order-api" data-health="normal">
                <div><span className="workload-name">order-api</span><span className="workload-sub">项目A · order</span></div>
                <div><span className="workload-kind">Deployment</span><span className="workload-sub">无状态服务</span></div>
                <div><span className="workload-health">正常</span><span className="workload-sub">副本全部可用</span></div>
                <div className="workload-ready"><strong>8／8 Ready</strong><div className="workload-progress-bar"><span style={{ width: '100%' }}></span></div></div>
                <div className="workload-pods"><strong>8</strong><span className="workload-sub">异常 0</span></div>
                <div><span className="workload-version">v5.3.0</span><span className="workload-sub">order-api</span></div>
                <div>3天前<span className="workload-sub">发布完成</span></div>
                <div className="workload-problem">—<span className="workload-sub">运行正常</span></div>
              </div>

              <div className="workload-row" data-workload="node-exporter" data-health="normal">
                <div><span className="workload-name">node-exporter</span><span className="workload-sub">平台运维 · monitoring</span></div>
                <div><span className="workload-kind">DaemonSet</span><span className="workload-sub">节点守护进程</span></div>
                <div><span className="workload-health">正常</span><span className="workload-sub">目标节点全覆盖</span></div>
                <div className="workload-ready"><strong>78／78 Ready</strong><div className="workload-progress-bar"><span style={{ width: '100%' }}></span></div></div>
                <div className="workload-pods"><strong>78</strong><span className="workload-sub">异常 0</span></div>
                <div><span className="workload-version">v1.8.1</span><span className="workload-sub">node-exporter</span></div>
                <div>12天前<span className="workload-sub">配置未变化</span></div>
                <div className="workload-problem">—<span className="workload-sub">运行正常</span></div>
              </div>

              <div className="workload-row" data-workload="nightly-report" data-health="normal">
                <div><span className="workload-name">nightly-report</span><span className="workload-sub">项目D · ops</span></div>
                <div><span className="workload-kind">CronJob</span><span className="workload-sub">定时任务</span></div>
                <div><span className="workload-health">正常</span><span className="workload-sub">最近执行成功</span></div>
                <div className="workload-ready"><strong>下次 01:00</strong><span className="workload-sub">最近成功 2小时前</span></div>
                <div className="workload-pods"><strong>0</strong><span className="workload-sub">当前未执行</span></div>
                <div><span className="workload-version">v2.1.4</span><span className="workload-sub">reporter</span></div>
                <div>2小时前<span className="workload-sub">执行成功</span></div>
                <div className="workload-problem">—<span className="workload-sub">调度正常</span></div>
              </div>

              <div className="workloads-pagination"><span id="workloadsPaginationMeta">显示 1–7，共 126 个 Workloads</span><span id="workloadsPaginationPages"><i className="page-chip">1</i>&nbsp;&nbsp;2&nbsp;&nbsp;3&nbsp;&nbsp;…&nbsp;&nbsp;18&nbsp;&nbsp;›</span></div>
            </section>

            <aside className="card workload-detail-card">
              <div className="workload-detail-head"><div><div className="workload-detail-name" id="workloadDetailName">payment-api</div><div id="workloadDetailMeta" className="workload-detail-meta">Deployment · 项目A／payment</div></div><span id="workloadDetailStatus" className="workload-detail-status">需关注</span></div>
              <div className="workload-detail-body">
                <section className="workload-detail-section"><div className="workload-detail-title">基本信息</div><div className="workload-basic-grid">
                  <div className="workload-basic-item"><small>类型</small><strong id="workloadDetailKind">Deployment</strong></div><div className="workload-basic-item"><small>创建时间</small><strong id="workloadDetailCreated">2026-05-18 14:22</strong></div>
                  <div className="workload-basic-item"><small>项目／Namespace</small><strong id="workloadDetailScope">项目A／payment</strong></div><div className="workload-basic-item"><small>更新策略</small><strong id="workloadDetailStrategy">RollingUpdate</strong></div>
                  <div className="workload-basic-item"><small>当前镜像</small><strong id="workloadDetailImage">payment-api:v2.4.1</strong></div><div className="workload-basic-item"><small>最近变化</small><strong id="workloadDetailChanged">10分钟前更新镜像</strong></div>
                </div></section>

                <section className="workload-detail-section"><div className="workload-detail-title">控制器状态</div><div id="workloadReplicaGrid" className="workload-replica-grid">
                  <div className="workload-replica-item"><small>期望</small><strong>5</strong></div><div className="workload-replica-item"><small>已更新</small><strong>5</strong></div><div className="workload-replica-item"><small>Ready</small><strong className="bad">3</strong></div><div className="workload-replica-item"><small>Available</small><strong className="bad">3</strong></div>
                </div></section>

                <section className="workload-detail-section"><div className="workload-detail-title">状态明细</div><div id="workloadConditionList">
                  <div className="workload-condition-row"><span>Available</span><strong className="workload-condition-state bad">False</strong><span className="workload-condition-reason">MinimumReplicasUnavailable</span></div>
                  <div className="workload-condition-row"><span>Progressing</span><strong className="workload-condition-state bad">False</strong><span className="workload-condition-reason">ProgressDeadlineExceeded</span></div>
                </div></section>

                <section className="workload-detail-section"><div className="workload-detail-title">问题定位与影响</div><div id="workloadIssueList">
                  <div className="workload-issue-row"><span><strong>payment-api-7d8f-2kv9f</strong> · Pod</span><span className="workload-issue-state">NotReady</span></div>
                  <div className="workload-issue-row"><span><strong>payment-api-7d8f-7sk2h</strong> · Pod</span><span className="workload-issue-state">NotReady</span></div>
                </div>
                  <div id="workloadImpact" className="workload-impact">Workload副本不足 → 2个Pods未就绪 → <strong>gpu-node-07 NotReady</strong> → BM-00001027网卡丢包。<br />payment-service 后端就绪 3／5，存在服务降级风险。</div>
                  <div className="workload-links"><span id="workloadPodsLink" className="workload-link">查看2个异常Pods →</span><span id="workloadNodeLink" className="workload-link workload-go-node" data-node="gpu-node-07">查看gpu-node-07 →</span><span id="workloadEventsLink" className="workload-link">查看6条相关事件 →</span></div>
                </section>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </section>

  <main id="modelDistributionPage" className="model-distribution-layer" aria-labelledby="modelDistributionTitle">
    <section className="mdist-panel">
      <header className="mdist-head">
        <div>
          <h1 id="modelDistributionTitle">分发中心</h1>
          <p>统一管理模型、镜像与文件的分发，支持创建任务、选择目标，并跟踪传输进度与异常。</p>
        </div>
      </header>
      <nav className="distribution-kind-tabs" aria-label="分发类型">
        <button id="distributionModelTab" type="button" className="active" aria-selected="true">模型分发</button>
        <button id="distributionImageTab" type="button" aria-selected="false">镜像分发</button>
        <button id="distributionFileTab" type="button" aria-selected="false">文件分发</button>
      </nav>
      <section id="distributionModelPane" className="distribution-kind-pane">
      <nav className="mdist-page-tabs" aria-label="模型分发页面">
        <button id="modelCatalogTab" type="button" className="mdist-page-tab active" aria-selected="true">模型列表</button>
        <button id="modelTaskTab" type="button" className="mdist-page-tab" aria-selected="false">任务列表<span id="modelTaskCount" className="mdist-tab-count">0</span></button>
      </nav>
      <section id="modelCatalogView" className="mdist-subview">
        <div className="mdist-toolbar">
          <select id="modelHostFilter" className="mdist-select" aria-label="按模型所在主机筛选"><option value="all">全部模型主机</option><option value="ops-transfer-01">ops-transfer-01</option><option value="model-store-02">model-store-02</option><option value="gpu-node-07">gpu-node-07</option><option value="gpu-node-12">gpu-node-12</option><option value="gpu-node-18">gpu-node-18</option></select>
          <input id="modelCatalogSearch" className="mdist-input" type="search" placeholder="搜索模型名称、主机或目录" aria-label="搜索模型" />
          <span className="mdist-toolbar-spacer"></span>
          <button id="modelCatalogRefresh" type="button" className="mdist-button mdist-icon-button" aria-label="刷新模型列表"><svg viewBox="0 0 20 20"><path d="M15.5 7A6 6 0 1 0 16 12"/><path d="M15.5 3v4h-4"/></svg></button>
          <button id="modelDownloadCreate" type="button" className="mdist-button download"><svg viewBox="0 0 20 20"><path d="M10 3v9M6.5 8.5 10 12l3.5-3.5"/><path d="M4 15.5h12"/></svg>下载模型</button>
          <button id="modelDistributionCreate" type="button" className="mdist-button primary"><span aria-hidden="true">＋</span>创建分发</button>
        </div>
        <div id="modelCatalogGrid" className="model-catalog-grid"></div>
        <div className="mdist-pagination"><span id="modelCatalogTotal">共 0 个模型</span><span className="mdist-page-chip">1</span><span>12 个／页</span></div>
      </section>
      <section id="modelTaskView" className="mdist-subview mdist-is-hidden">
        <div className="mdist-toolbar">
          <select id="modelDistributionStatusFilter" className="mdist-select" aria-label="按任务状态筛选"><option value="all">全部状态</option><option value="running">执行中</option><option value="completed">已完成</option><option value="failed">异常</option><option value="stopped">已停止</option></select>
          <select id="modelDistributionTypeFilter" className="mdist-select" aria-label="按任务类型筛选"><option value="all">全部任务</option><option value="download">模型下载</option><option value="distribution">模型分发</option></select>
          <select id="modelDistributionClusterFilter" className="mdist-select" aria-label="按目标集群筛选"><option value="all">全部目标集群</option><option value="gpu-prod-01">gpu-prod-01</option><option value="cluster-sh-02">cluster-sh-02</option><option value="gpu-test-sh-01">gpu-test-sh-01</option></select>
          <input id="modelDistributionSearch" className="mdist-input" type="search" placeholder="搜索任务、模型、主机或节点" aria-label="搜索分发任务" />
          <span className="mdist-toolbar-spacer"></span>
          <button id="modelDistributionRefresh" type="button" className="mdist-button mdist-icon-button" aria-label="刷新任务列表"><svg viewBox="0 0 20 20"><path d="M15.5 7A6 6 0 1 0 16 12"/><path d="M15.5 3v4h-4"/></svg></button>
        </div>
        <div id="modelDistributionTableView" className="mdist-table-wrap">
          <table className="mdist-table">
            <colgroup><col style={{ width: '22%' }} /><col style={{ width: '17%' }} /><col style={{ width: '21%' }} /><col style={{ width: '9%' }} /><col style={{ width: '12%' }} /><col style={{ width: '9%' }} /><col style={{ width: '10%' }} /></colgroup>
            <thead><tr><th>任务／模型</th><th>保存位置／分发目标</th><th>任务进度</th><th>实时速度</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
            <tbody id="modelDistributionTableBody"></tbody>
          </table>
        </div>
        <div className="mdist-pagination"><span id="modelDistributionTotal">共 0 条</span><span className="mdist-page-chip">1</span><span>10 条／页</span></div>
      </section>
      </section>
      <section id="distributionImagePane" className="distribution-kind-pane mdist-is-hidden">
        <div className="distribution-pane-head"><div><strong>镜像分发</strong><span>将已登记镜像同步到目标集群的镜像仓库或节点。</span></div><button id="imageDistributionCreate" type="button" className="mdist-button primary">＋ 创建镜像分发</button></div>
        <div className="mdist-toolbar"><select className="mdist-select"><option>全部镜像仓库</option><option>Harbor 主仓库</option><option>离线镜像仓库</option></select><input className="mdist-input" placeholder="搜索镜像名称或 Tag" /><span className="mdist-toolbar-spacer"></span><button type="button" className="mdist-button mdist-icon-button"><svg viewBox="0 0 20 20"><path d="M15.5 7A6 6 0 1 0 16 12"/><path d="M15.5 3v4h-4"/></svg></button></div>
        <div className="mdist-table-wrap"><table className="mdist-table"><thead><tr><th>镜像</th><th>来源</th><th>镜像大小</th><th>可用状态</th><th>最近更新</th><th>操作</th></tr></thead><tbody><tr><td><span className="mdist-main">vllm/vllm-openai:v0.10.2</span><span className="mdist-sub">推理运行环境</span></td><td>Harbor 主仓库</td><td>8.42 GB</td><td><span className="mdist-status completed">可分发</span></td><td>今天 10:16</td><td><button className="mdist-link">分发</button></td></tr><tr><td><span className="mdist-main">nvidia/cuda:12.8.1-runtime</span><span className="mdist-sub">CUDA 运行时</span></td><td>Harbor 主仓库</td><td>4.86 GB</td><td><span className="mdist-status completed">可分发</span></td><td>今天 09:42</td><td><button className="mdist-link">分发</button></td></tr><tr><td><span className="mdist-main">platform/node-agent:v2.6.0</span><span className="mdist-sub">节点管理组件</span></td><td>离线镜像仓库</td><td>628 MB</td><td><span className="mdist-status completed">可分发</span></td><td>昨天 18:20</td><td><button className="mdist-link">分发</button></td></tr></tbody></table></div>
      </section>
      <section id="distributionFilePane" className="distribution-kind-pane mdist-is-hidden">
        <div className="distribution-pane-head"><div><strong>文件分发</strong><span>将驱动、软件包和配置文件同步到指定集群或主机。</span></div><button id="fileDistributionCreate" type="button" className="mdist-button primary">＋ 创建文件分发</button></div>
        <div className="mdist-toolbar"><select className="mdist-select"><option>全部文件类型</option><option>驱动包</option><option>软件包</option><option>配置文件</option></select><input className="mdist-input" placeholder="搜索文件或软件包" /><span className="mdist-toolbar-spacer"></span><button type="button" className="mdist-button mdist-icon-button"><svg viewBox="0 0 20 20"><path d="M15.5 7A6 6 0 1 0 16 12"/><path d="M15.5 3v4h-4"/></svg></button></div>
        <div className="mdist-table-wrap"><table className="mdist-table"><thead><tr><th>文件／软件包</th><th>类型</th><th>文件大小</th><th>来源主机</th><th>最近更新</th><th>操作</th></tr></thead><tbody><tr><td><span className="mdist-main">NVIDIA-Linux-x86_64-550.54.run</span><span className="mdist-sub">/data/packages/drivers/</span></td><td>驱动包</td><td>326 MB</td><td>ops-transfer-01</td><td>今天 10:08</td><td><button className="mdist-link">分发</button></td></tr><tr><td><span className="mdist-main">kubernetes-v1.36.2-offline.tar.gz</span><span className="mdist-sub">/data/packages/kubernetes/</span></td><td>软件包</td><td>1.86 GB</td><td>model-store-02</td><td>今天 09:36</td><td><button className="mdist-link">分发</button></td></tr><tr><td><span className="mdist-main">node-agent-config-20260722.zip</span><span className="mdist-sub">/data/packages/config/</span></td><td>配置文件</td><td>12.4 MB</td><td>ops-transfer-01</td><td>今天 08:54</td><td><button className="mdist-link">分发</button></td></tr></tbody></table></div>
      </section>
    </section>
  </main>

  <div id="modelDistributionCreateOverlay" className="mdist-overlay mdist-create-drawer" role="dialog" aria-modal="true" aria-labelledby="modelDistributionCreateTitle">
    <section className="mdist-dialog">
      <header className="mdist-dialog-head"><div><h2 id="modelDistributionCreateTitle">创建模型分发</h2><p>选择模型和目标范围，提交后生成分发任务并持续跟踪各节点状态。</p></div><button type="button" className="mdist-close" data-mdist-close aria-label="关闭">×</button></header>
      <div className="mdist-dialog-body">
        <section className="mdist-form-section">
          <div className="mdist-section-title">选择模型</div>
          <div className="mdist-form-grid">
            <div className="mdist-field"><label htmlFor="mdistModelSelect"><span className="mdist-required">*</span>模型</label><select id="mdistModelSelect" className="mdist-select"></select><div className="mdist-field-help">模型来自已纳管主机的模型目录。</div></div>
            <div className="mdist-field"><label htmlFor="mdistTaskName"><span className="mdist-required">*</span>任务名称</label><input id="mdistTaskName" className="mdist-input" placeholder="例如：同步 Qwen2.5-32B 至生产集群" /></div>
            <div className="mdist-field"><label htmlFor="mdistSourceCopy"><span className="mdist-required">*</span>源副本（主机）</label><select id="mdistSourceCopy" className="mdist-select"></select><div className="mdist-field-help">同一模型存在于多台主机时，需要选择本次分发使用的源副本。</div></div>
            <div className="mdist-field full"><label htmlFor="mdistSourcePath">源模型目录</label><input id="mdistSourcePath" className="mdist-input" readOnly /><div className="mdist-field-help">主机和目录由所选模型自动带入，分发前会检查连通性、权限和文件完整性。</div></div>
          </div>
        </section>
        <section className="mdist-form-section">
          <div className="mdist-section-title">分发目标</div>
          <div className="mdist-field full" style={{ marginBottom: '14px' }}><span className="mdist-field-label">目标方式</span><div className="mdist-scope-switch"><label><input type="radio" name="mdistTargetMode" value="cluster" defaultChecked /><span>按集群</span></label><label><input type="radio" name="mdistTargetMode" value="nodes" /><span>指定节点</span></label></div></div>
          <div id="mdistClusterTarget" className="mdist-form-grid">
            <div className="mdist-field"><label htmlFor="mdistTargetCluster"><span className="mdist-required">*</span>目标集群</label><select id="mdistTargetCluster" className="mdist-select"><option value="gpu-prod-01">gpu-prod-01</option><option value="cluster-sh-02">cluster-sh-02</option><option value="gpu-test-sh-01">gpu-test-sh-01</option></select></div>
            <div className="mdist-field"><span className="mdist-field-label">目标节点</span><div id="mdistClusterNodeSummary" className="mdist-input" style={{ display: 'flex', alignItems: 'center', background: '#f7f8fa' }}>8 个 Ready 节点</div><div className="mdist-field-help">自动排除 NotReady 和已停用节点。</div></div>
          </div>
          <div id="mdistNodeTarget" className="mdist-field full" hidden><span className="mdist-field-label"><span className="mdist-required">*</span>选择目标节点</span><div className="mdist-node-options"><label className="mdist-node-option"><input type="checkbox" value="gpu-node-01" defaultChecked />gpu-node-01 · Ready</label><label className="mdist-node-option"><input type="checkbox" value="gpu-node-02" defaultChecked />gpu-node-02 · Ready</label><label className="mdist-node-option"><input type="checkbox" value="gpu-node-03" />gpu-node-03 · Ready</label><label className="mdist-node-option"><input type="checkbox" value="gpu-node-07" disabled />gpu-node-07 · NotReady</label></div></div>
          <div className="mdist-form-grid" style={{ marginTop: '16px' }}>
            <div className="mdist-field"><label htmlFor="mdistCredential"><span className="mdist-required">*</span>SSH 凭据</label><select id="mdistCredential" className="mdist-select"><option>sh-prod-model-key</option><option>cluster-default-root-key</option></select></div>
            <div className="mdist-field"><label htmlFor="mdistTargetPath"><span className="mdist-required">*</span>目标目录</label><input id="mdistTargetPath" className="mdist-input" defaultValue="/data/models/" /></div>
            <div className="mdist-field full"><label className="mdist-check"><input id="mdistVerify" type="checkbox" defaultChecked />分发完成后校验文件大小与校验值</label><div className="mdist-field-help">首版按节点并发同步；单个节点失败不会中断其他节点。</div></div>
          </div>
          <div id="mdistCreateValidation" className="mdist-validation">请完整填写任务名称、源模型目录和目标目录，并至少选择一个目标节点。</div>
        </section>
      </div>
      <footer className="mdist-dialog-foot"><span>创建后将生成一次分发执行，可在任务列表查看进度与异常。</span><div className="mdist-foot-actions"><button type="button" className="mdist-button" data-mdist-close>取消</button><button id="mdistCreateSubmit" type="button" className="mdist-button primary">创建并分发</button></div></footer>
    </section>
  </div>

  <div id="modelDownloadCreateOverlay" className="mdist-overlay mdist-create-drawer" role="dialog" aria-modal="true" aria-labelledby="modelDownloadCreateTitle">
    <section className="mdist-dialog">
      <header className="mdist-dialog-head">
        <div><h2 id="modelDownloadCreateTitle">创建模型下载任务</h2><p>通过 HTTP／HTTPS URL 将远程模型下载到所选主机的保存目录。</p></div>
        <button type="button" className="mdist-close" data-mdist-close aria-label="关闭">×</button>
      </header>
      <div className="mdist-dialog-body">
        <section className="mdist-form-section">
          <div className="mdist-section-title">远程模型</div>
          <div className="mdist-form-grid">
            <div className="mdist-field"><label htmlFor="mdownloadTaskName"><span className="mdist-required">*</span>任务名称</label><input id="mdownloadTaskName" className="mdist-input" placeholder="例如：下载 Qwen3-32B" /></div>
            <div className="mdist-field"><label htmlFor="mdownloadUrl"><span className="mdist-required">*</span>模型 URL</label><textarea id="mdownloadUrl" className="mdist-textarea" placeholder="https://models.example.com/Qwen3-32B.tar.zst"></textarea><div className="mdist-field-help">支持 HTTP／HTTPS 直链；任务启动前会检查 URL 可访问性与文件大小。</div></div>
          </div>
        </section>
        <section className="mdist-form-section">
          <div className="mdist-section-title">模型保存位置</div>
          <div className="mdist-form-grid">
            <div className="mdist-field"><label htmlFor="mdownloadNode"><span className="mdist-required">*</span>下载主机</label><select id="mdownloadNode" className="mdist-select"><option value="ops-transfer-01">ops-transfer-01 · 10.24.1.20</option><option value="model-store-02">model-store-02 · 10.24.2.32</option><option value="gpu-node-07">gpu-node-07 · 10.24.18.107</option></select><div className="mdist-field-help">选择负责执行下载并保存模型文件的已纳管主机。</div></div>
            <div className="mdist-field"><label htmlFor="mdownloadDirectory"><span className="mdist-required">*</span>保存目录</label><div className="mdist-path-picker"><input id="mdownloadDirectory" className="mdist-input" defaultValue="/data/models" /><button id="mdownloadBrowse" type="button" className="mdist-button">选择目录</button><div id="mdownloadDirectoryMenu" className="mdist-directory-menu"><button type="button" data-download-path="/data/models"><span>/data/models</span><small>可用 1.8 TB</small></button><button type="button" data-download-path="/mnt/model-cache"><span>/mnt/model-cache</span><small>可用 920 GB</small></button><button type="button" data-download-path="/opt/ataas/models"><span>/opt/ataas/models</span><small>可用 410 GB</small></button></div></div><div className="mdist-field-help">可选择常用目录，也可以直接输入下载主机上的绝对路径。</div></div>
            <div className="mdist-field"><label htmlFor="mdownloadFileName">保存名称</label><input id="mdownloadFileName" className="mdist-input" placeholder="留空则从 URL 自动识别" /></div>
            <div className="mdist-field"><label className="mdist-check"><input id="mdownloadResume" type="checkbox" defaultChecked />启用断点续传</label></div>
            <div className="mdist-field"><label className="mdist-check"><input id="mdownloadVerify" type="checkbox" defaultChecked />下载完成后校验文件完整性</label></div>
          </div>
          <div id="mdownloadUrlPreview" className="mdist-url-preview">填写 URL 后将自动识别保存名称和目标路径。</div>
          <div id="mdownloadValidation" className="mdist-validation">请填写任务名称、有效的 HTTP／HTTPS URL 和模型保存目录。</div>
        </section>
      </div>
      <footer className="mdist-dialog-foot"><span>下载任务将在后台执行；下载完成后可直接用于创建分发服务。</span><div className="mdist-foot-actions"><button type="button" className="mdist-button" data-mdist-close>取消</button><button id="mdownloadSubmit" type="button" className="mdist-button primary">开始下载</button></div></footer>
    </section>
  </div>

  <div id="modelDistributionDetailOverlay" className="mdist-overlay" role="dialog" aria-modal="true" aria-labelledby="modelDistributionDetailTitle">
    <section className="mdist-dialog detail">
      <header className="mdist-dialog-head"><div><h2 id="modelDistributionDetailTitle">分发任务详情</h2><p id="mdistDetailSubtitle"></p></div><button type="button" className="mdist-close" data-mdist-close aria-label="关闭">×</button></header>
      <div id="mdistDetailBody" className="mdist-dialog-body"></div>
      <footer className="mdist-dialog-foot"><span id="mdistDetailUpdate"></span><div className="mdist-foot-actions"><button type="button" className="mdist-button" data-mdist-close>关闭</button><button id="mdistDetailStop" type="button" className="mdist-button danger">停止任务</button></div></footer>
    </section>
  </div>

  <div id="modelDistributionStopOverlay" className="mdist-overlay" role="dialog" aria-modal="true" aria-labelledby="modelDistributionStopTitle">
    <section className="mdist-dialog confirm">
      <header className="mdist-dialog-head"><div><h2 id="modelDistributionStopTitle">停止任务</h2></div><button type="button" className="mdist-close" data-mdist-close aria-label="关闭">×</button></header>
      <div className="mdist-dialog-body"><div id="mdistStopText" className="mdist-confirm-text"></div></div>
      <footer className="mdist-dialog-foot"><span></span><div className="mdist-foot-actions"><button type="button" className="mdist-button" data-mdist-close>取消</button><button id="mdistStopConfirm" type="button" className="mdist-button danger">确认停止</button></div></footer>
    </section>
  </div>
  <div id="modelDistributionToast" className="mdist-toast" role="status" aria-live="polite"></div>

  <div className="small-page-layer supplier-create-layer" role="dialog" aria-modal="true" aria-labelledby="supplierCreateTitle">
    <section className="small-dialog">
      <header className="small-dialog-head">
        <div><div id="supplierCreateTitle" className="small-dialog-title">创建供应商</div><div className="small-dialog-subtitle">录入合作方基础资料，建立统一的供应商档案</div></div>
        <button type="button" className="small-dialog-close supplier-dialog-close" aria-label="关闭">×</button>
      </header>

      <div className="small-dialog-body">
        <div className="form-notice">这里只创建供应商档案。创建完成后，可继续在该供应商下新建数据中心；不会自动接入机器或创建集群。</div>

        <section className="form-section">
          <div className="form-section-title">基础信息</div>
          <div className="form-grid">
            <div className="form-field" data-required-field="supplierName"><label htmlFor="supplierName"><span className="required-mark">*</span>供应商名称</label><input id="supplierName" className="dialog-input" placeholder="请输入供应商名称" /><span className="field-error">请输入供应商名称</span></div>
            <div className="form-field"><label htmlFor="supplierShortName">供应商简称</label><input id="supplierShortName" className="dialog-input" placeholder="用于资源树和列表展示" /></div>
            <div className="form-field"><label htmlFor="supplierCode">供应商编号</label><input id="supplierCode" className="dialog-input" defaultValue="创建后自动生成" readOnly /><div className="field-help">编号生成后可在供应商档案中查看</div></div>
            <div className="form-field"><label htmlFor="supplierType"><span className="required-mark">*</span>服务类型</label><select id="supplierType" className="dialog-select"><option>算力／裸金属供应商</option><option>IDC机房服务商</option><option>云资源供应商</option><option>综合服务商</option></select></div>
            <div className="form-field"><label htmlFor="companyName">企业主体名称</label><input id="companyName" className="dialog-input" placeholder="合同或发票上的企业全称" /></div>
            <div className="form-field"><label htmlFor="serviceRegion">服务地区</label><input id="serviceRegion" className="dialog-input" placeholder="例如：华东、华北" /></div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-title">联系人（选填）</div>
          <div className="form-grid">
            <div className="form-field"><label htmlFor="contactName">联系人</label><input id="contactName" className="dialog-input" placeholder="可稍后在供应商档案中补充" /></div>
            <div className="form-field"><label htmlFor="contactPhone">联系电话</label><input id="contactPhone" className="dialog-input" placeholder="手机或固定电话" /></div>
            <div className="form-field"><label htmlFor="contactEmail">联系邮箱</label><input id="contactEmail" className="dialog-input" placeholder="name@example.com" /></div>
            <div className="form-field"><label htmlFor="serviceHotline">服务支持电话</label><input id="serviceHotline" className="dialog-input" placeholder="供应商7×24小时支持电话" /></div>
          </div>
        </section>

        <section className="form-section">
          <div className="form-section-title">补充信息（选填）</div>
          <div className="form-grid">
            <div className="form-field full"><label htmlFor="supplierRemark">备注</label><textarea id="supplierRemark" className="dialog-textarea" placeholder="补充合作范围、服务说明或其他信息"></textarea></div>
          </div>
        </section>
      </div>

      <footer className="small-dialog-foot">
        <span className="dialog-required-tip"><span className="required-mark">*</span>为必填项</span>
        <div className="dialog-actions"><button type="button" className="dialog-button supplier-dialog-close">取消</button><button id="supplierCreateSubmit" type="button" className="dialog-button primary">创建供应商</button></div>
      </footer>
    </section>
  </div>

  <main className="small-page-layer resource-files-layer" aria-labelledby="resourceFilesTitle">
    <section className="resource-files-dialog">
      <header className="small-dialog-head">
        <div className="resource-page-heading"><div><div id="resourceFilesTitle" className="small-dialog-title">资源接入与管理</div><div className="small-dialog-subtitle">统一管理供应商、数据中心，并完成裸金属纳管与 Kubernetes 集群接入</div></div></div>
        <button type="button" className="resource-page-back resource-files-close">返回集群概览</button>
      </header>
      <div className="archive-toolbar-top">
        <div className="archive-search"><input id="archiveSearch" className="dialog-input" placeholder="搜索供应商、数据中心、集群" /></div>
        <select id="archiveStatusFilter" className="dialog-select archive-filter"><option value="all">全部状态</option><option value="normal">合作中／运行中</option><option value="attention">需关注</option><option value="pending">待接入</option></select>
        <span id="archiveMeta" className="archive-toolbar-meta"></span>
        <div className="tree-add-wrap"><button type="button" className="dialog-button primary tree-add-btn">新增供应商／数据中心 ▾</button><div className="tree-add-menu"><button type="button" data-add="supplier-create">新增供应商</button><button type="button" data-add="dc-create">新增数据中心</button></div></div>
      </div>
      <div className="archive-columns-head" aria-hidden="true"><span></span><span>供应商</span><span>服务区域</span><span>数据中心</span><span>集群</span><span>机器</span><span>状态</span></div>
      <div id="archiveAccordion" className="archive-accordion"></div>
    </section>
  </main>

  <div className="small-page-layer supplier-delete-layer" role="dialog" aria-modal="true" aria-labelledby="supplierDeleteTitle">
    <section className="small-dialog confirm-dialog">
      <header className="small-dialog-head"><div><div id="supplierDeleteTitle" className="small-dialog-title">删除供应商</div><div className="small-dialog-subtitle">删除前先校验下级资源，避免留下无归属资源</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="supplier-list" aria-label="关闭">×</button></header>
      <div className="small-dialog-body"><div className="precheck-result"><span className="precheck-mark">!</span><div><strong>校验未通过，暂不能删除</strong>供应商“厂商A · xxx科技”仍有数据中心、集群和机器关联。</div></div><div className="precheck-list">
        <div className="precheck-row"><span>数据中心</span><b className="precheck-count">2 个</b><span className="precheck-action">查看数据中心 →</span></div>
        <div className="precheck-row"><span>集群</span><b className="precheck-count">2 个</b><span className="precheck-action">查看集群 →</span></div>
        <div className="precheck-row"><span>已纳管机器</span><b className="precheck-count">106 台</b><span className="precheck-action">查看机器 →</span></div>
        <div className="precheck-row"><span>执行中任务</span><b className="precheck-count precheck-pass">0 项</b><span className="precheck-action">已通过</span></div>
      </div><div className="delete-history-note">需先迁移或删除关联资源。校验通过后可删除档案，历史操作记录仍会保留。</div></div>
      <footer className="small-dialog-foot"><span></span><div className="dialog-actions"><button type="button" className="dialog-button overlay-return" data-return-hash="supplier-list">返回</button><button type="button" className="dialog-button danger" disabled>确认删除</button></div></footer>
    </section>
  </div>

  <div className="small-page-layer dc-create-layer" role="dialog" aria-modal="true" aria-labelledby="dcCreateTitle">
    <section className="small-dialog">
      <header className="small-dialog-head"><div><div id="dcCreateTitle" className="small-dialog-title">创建数据中心</div><div className="small-dialog-subtitle">在指定供应商下建立数据中心档案与网络边界</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="dc-list" aria-label="关闭">×</button></header>
      <div className="small-dialog-body"><div className="form-notice">创建数据中心只建立资源归属和网络档案；完成后再纳管机器，或使用已纳管机器创建集群。</div>
        <section className="form-section"><div className="form-section-title">基础信息</div><div className="form-grid">
          <div className="form-field"><label htmlFor="dcName"><span className="required-mark">*</span>数据中心名称</label><input id="dcName" className="dialog-input" placeholder="例如：上海二号数据中心" /></div><div className="form-field"><label htmlFor="dcSupplier"><span className="required-mark">*</span>所属供应商</label><select id="dcSupplier" className="dialog-select"><option>厂商A · xxx科技</option><option>厂商B · 中原算力</option><option>厂商C · 华北云</option><option>厂商D · 边缘算力</option><option>厂商E · 海外云</option></select><div className="field-help">展示已建档的全部供应商；供应商较多时可在下拉列表中滚动查看</div></div>
          <div className="form-field"><label htmlFor="dcRegion"><span className="required-mark">*</span>省市／国家地区</label><input id="dcRegion" className="dialog-input" placeholder="例如：上海市浦东新区" /></div><div className="form-field"><label htmlFor="dcTimezone">时区</label><select id="dcTimezone" className="dialog-select"><option>UTC+08:00 北京时间</option><option>UTC+00:00</option><option>UTC+09:00</option></select></div>
          <div className="form-field full"><label htmlFor="dcAddress">详细位置（选填）</label><input id="dcAddress" className="dialog-input" placeholder="机房地址或内部位置说明，不要填写无法维护的机架信息" /></div>
        </div></section>
        <section className="form-section"><div className="form-section-title">网络边界</div><div className="form-grid">
          <div className="form-field"><label htmlFor="dcMgmtCidr"><span className="required-mark">*</span>管理网段</label><input id="dcMgmtCidr" className="dialog-input" placeholder="例如：10.24.16.0/20" /><div className="field-help">用于 SSH、节点管理和平台连通</div></div><div className="form-field"><label htmlFor="dcBmcCidr">BMC 网段（选填）</label><input id="dcBmcCidr" className="dialog-input" placeholder="例如：172.20.16.0/22" /></div>
          <div className="form-field"><label htmlFor="dcBizCidr">业务接入网段（选填）</label><input id="dcBizCidr" className="dialog-input" placeholder="负载均衡、对外服务等网段" /></div><div className="form-field"><label htmlFor="dcProxy">出口／代理（选填）</label><input id="dcProxy" className="dialog-input" placeholder="代理地址或专线说明" /></div>
        </div></section>
      </div>
      <footer className="small-dialog-foot"><span className="dialog-required-tip"><span className="required-mark">*</span>为必填项</span><div className="dialog-actions"><button type="button" className="dialog-button overlay-return" data-return-hash="dc-list">取消</button><button type="button" className="dialog-button primary">创建数据中心</button></div></footer>
    </section>
  </div>

  <div className="small-page-layer dc-delete-layer" role="dialog" aria-modal="true" aria-labelledby="dcDeleteTitle">
    <section className="small-dialog confirm-dialog">
      <header className="small-dialog-head"><div><div id="dcDeleteTitle" className="small-dialog-title">删除数据中心</div><div className="small-dialog-subtitle">删除前校验集群、机器和执行中任务</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="dc-list" aria-label="关闭">×</button></header>
      <div className="small-dialog-body"><div className="precheck-result"><span className="precheck-mark">!</span><div><strong>校验未通过，暂不能删除</strong>“上海一号数据中心”仍承载集群和裸金属机器。</div></div><div className="precheck-list">
        <div className="precheck-row"><span>集群</span><b className="precheck-count">2 个</b><span className="precheck-action">先取消纳管 →</span></div><div className="precheck-row"><span>已纳管机器</span><b className="precheck-count">106 台</b><span className="precheck-action">移出或删除 →</span></div><div className="precheck-row"><span>执行中任务</span><b className="precheck-count">1 项</b><span className="precheck-action">查看任务 →</span></div>
      </div><div className="delete-history-note">集群取消纳管不会在这里自动删除 Kubernetes；需在对应集群操作中单独确认。</div></div>
      <footer className="small-dialog-foot"><span></span><div className="dialog-actions"><button type="button" className="dialog-button overlay-return" data-return-hash="dc-list">返回</button><button type="button" className="dialog-button danger" disabled>确认删除</button></div></footer>
    </section>
  </div>

  <div className="small-page-layer machine-onboard-layer" role="dialog" aria-modal="true" aria-labelledby="machineOnboardTitle">
    <section className="small-dialog">
      <header className="small-dialog-head"><div><div id="machineOnboardTitle" className="small-dialog-title">纳管裸金属机器</div><div id="machineOnboardSubtitle" className="small-dialog-subtitle">先将机器纳入数据中心资源池，再分配给集群</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="dc-list" aria-label="关闭">×</button></header>
      <div className="small-dialog-body">
        <div id="machineOnboardFormView" className="machine-onboard-form"><div id="machineOnboardNotice" className="form-notice">机器纳管后仍是裸金属资源，不会自动变成 Kubernetes Node。只有在创建集群或节点扩容完成后，机器才会注册为 Node。</div>
          <section className="form-section"><div className="form-section-title">纳管范围</div><div className="form-grid"><div className="form-field"><label>所属数据中心</label><div id="machineOnboardScope" className="fixed-scope">上海一号数据中心 · 厂商A</div></div><div className="form-field"><label htmlFor="machineBatchName">批次名称（选填）</label><input id="machineBatchName" className="dialog-input" defaultValue="2026年7月GPU机器" /></div></div></section>
          <section className="form-section"><div className="form-section-title">接入方式</div><div className="method-switch"><button type="button" className="method-card selected" data-machine-method="ssh"><strong>IP 段 + SSH</strong><span>平台扫描目标 IP，通过 SSH 采集硬件和网络信息</span></button><button type="button" className="method-card" data-machine-method="file"><strong>导入机器清单</strong><span>上传 CSV 或 XLSX，逐行校验 IP、凭据和资产字段</span></button><button type="button" className="method-card" data-machine-method="offline"><strong>离线采集包</strong><span>平台无法主动 SSH 时，到目标机器执行并回传</span></button></div></section>
          <section className="form-section machine-method-panel active" data-machine-panel="ssh"><div className="form-section-title">IP 范围与 SSH 凭据</div><div className="form-grid"><div className="form-field"><label htmlFor="machineIpRange"><span className="required-mark">*</span>管理 IP 范围</label><input id="machineIpRange" className="dialog-input" defaultValue="10.24.18.121-10.24.18.132" /><div className="field-help">支持起止 IP、CIDR 或逗号分隔的多个 IP</div></div><div className="form-field"><label htmlFor="machineSshCredential"><span className="required-mark">*</span>SSH 凭据</label><select id="machineSshCredential" className="dialog-select"><option>sh-dc-root-key-01</option><option>＋ 新建凭据</option></select><div className="field-help">仅用于本次连通校验与硬件采集</div></div><div className="form-field"><label htmlFor="machineSshPort">SSH 端口</label><input id="machineSshPort" className="dialog-input" defaultValue="22" /></div><div className="form-field"><label htmlFor="machineBmcRange">BMC IP 范围（选填）</label><input id="machineBmcRange" className="dialog-input" defaultValue="172.20.18.121-172.20.18.132" /></div><div className="form-field"><label htmlFor="machineExpiry">机器到期时间（选填）</label><input id="machineExpiry" type="date" className="dialog-input" /><div className="field-help">按本批机器统一设置，默认提前 30 天提醒</div></div></div></section>
          <section className="form-section machine-method-panel" data-machine-panel="file"><div className="form-section-title">上传机器清单</div><div id="machineUploadBox" className="machine-upload-box"><div className="machine-upload-main"><strong>选择 CSV 或 XLSX 文件</strong><small>必填管理 IP；可选 BMC IP、SSH 凭据标识、资源到期时间等字段</small></div><input id="machineListFile" className="machine-upload-input" type="file" accept=".csv,.xlsx" /></div><div id="machineFilePreview" className="machine-file-preview">尚未选择文件</div><div className="offline-package-actions"><button id="machineTemplateDownload" type="button" className="dialog-button">下载导入模板</button></div><div className="form-grid" style={{ marginTop: '10px' }}><div className="form-field"><label htmlFor="machineImportCredential">默认 SSH 凭据</label><select id="machineImportCredential" className="dialog-select"><option>sh-dc-root-key-01</option><option>按清单内凭据标识匹配</option></select><div className="field-help">清单未填凭据标识时使用此凭据</div></div><div className="form-field"><label>校验规则</label><div className="fixed-scope">重复 IP、字段格式、SSH 连通、资产重复</div></div></div></section>
          <section className="form-section machine-method-panel" data-machine-panel="offline"><div className="form-section-title">离线采集与回传</div><div className="form-notice">切换到此方式后，平台会生成采集包、一次性注册码和执行命令。它只采集裸金属信息，不会安装 Kubernetes，也不会注册 Node。</div><div className="offline-package-box"><div className="offline-package-item"><small>采集包</small><strong>ataas-machine-collector-v2.6.1.tar.gz</strong><div className="offline-package-actions"><button id="machineOfflineDownload" type="button" className="dialog-button">下载采集包</button></div></div><div className="offline-package-item"><small>一次性注册码</small><strong>MC-SH-7Q9K-2M4P · 24 小时有效</strong><div id="machineOfflineStatus" className="offline-package-actions"><span className="offline-wait-status">尚未创建回传任务</span></div></div><div className="offline-package-item full"><small>在每台目标机器上执行</small><code id="machineOfflineCommand" className="offline-command">sudo ./install.sh --token MC-SH-7Q9K-2M4P --server https://ops.ataas.local</code><div className="offline-package-actions"><button id="machineOfflineCopy" type="button" className="dialog-button">复制命令</button><span className="field-help">目标机器需能访问平台回调地址</span></div></div></div><div className="form-grid" style={{ marginTop: '10px' }}><div className="form-field"><label htmlFor="machineOfflineExpiry">机器到期时间（选填）</label><input id="machineOfflineExpiry" type="date" className="dialog-input" /></div><div className="form-field"><label>回传后的动作</label><div className="fixed-scope">资产去重 → 硬件校验 → 进入未分配机器池</div></div></div></section>
        </div>
        <div id="machineOnboardResultView" className="machine-onboard-result">
          <div className="onboard-result-summary"><div className="onboard-result-stat"><small id="machineResultMetric1Label">本次检测</small><strong id="machineResultMetric1">12</strong></div><div className="onboard-result-stat success"><small id="machineResultMetric2Label">纳管成功</small><strong id="machineResultMetric2">10</strong></div><div className="onboard-result-stat failed"><small id="machineResultMetric3Label">校验失败</small><strong id="machineResultMetric3">2</strong></div></div>
          <div id="machineResultNote" className="onboard-result-note"><strong>10 台机器已进入当前数据中心的可用资源池。</strong><br />当前状态为“可用、未分配”，还不是 Kubernetes Node。</div>
          <section className="form-section"><div id="machineResultListTitle" className="form-section-title">纳管结果</div><div id="machineResultList" className="onboard-result-list"><div className="onboard-result-row head"><span>机器／IP</span><span>硬件采集</span><span>结果</span><span>说明</span></div><div className="onboard-result-row"><span>BM-00001121–1130</span><span>8×A100 · 1TB</span><span className="onboard-result-status">成功 10台</span><span>可用、未分配</span></div><div className="onboard-result-row"><span>10.24.18.131</span><span>未完成</span><span className="onboard-result-status failed">失败</span><span>SSH 认证失败</span></div><div className="onboard-result-row"><span>10.24.18.132</span><span>未完成</span><span className="onboard-result-status failed">失败</span><span>BMC 不可达</span></div></div></section>
          <div id="machineResultFlow" className="onboard-next-flow"><span>裸金属可用</span><b>→</b><span id="machineOnboardNextStepLabel">创建集群或节点扩容</span><b>→</b><span>注册为 Node</span></div>
        </div>
      </div>
      <footer className="small-dialog-foot machine-onboard-form-footer"><span id="machineOnboardFootNote" className="dialog-required-tip">提交后先执行连通和硬件采集检查</span><div className="dialog-actions"><button type="button" className="dialog-button overlay-return" data-return-hash="dc-list">取消</button><button id="machineOnboardValidate" type="button" className="dialog-button primary">开始校验</button></div></footer>
      <footer className="small-dialog-foot machine-onboard-result-footer"><span id="machineResultFootNote">2 台失败机器可稍后修复并重试</span><div className="dialog-actions"><button id="machineOnboardFinish" type="button" className="dialog-button overlay-return" data-return-hash="dc-list">暂不分配</button><button id="machineOnboardContinue" type="button" className="dialog-button primary">继续创建集群</button></div></footer>
    </section>
  </div>

  <div className="small-page-layer node-scale-layer" role="dialog" aria-modal="true" aria-labelledby="nodeScaleTitle">
    <section className="small-dialog node-scale-dialog">
      <header className="small-dialog-head"><div><div id="nodeScaleTitle" className="small-dialog-title">扩容 gpu-prod-01</div><div className="small-dialog-subtitle">从上海一号数据中心的已纳管机器中选择，并注册为 Kubernetes Nodes</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="" aria-label="关闭">×</button></header>
      <div className="small-dialog-body">
        <div id="nodeScaleNotice" className="form-notice">已自动带入本次成功纳管的 10 台机器。平台将下发当前集群已验证的节点组件，执行 join 并等待 Node Ready。</div>
        <div className="node-scale-summary"><div><small>目标集群</small><strong>gpu-prod-01 · Kubernetes v1.36.2</strong></div><div><small>机器批次</small><strong id="nodeScaleBatchSummary">2026年7月GPU机器</strong></div><div><small>已选机器</small><strong>10 台 · Worker</strong></div></div>
        <section className="form-section"><div className="form-section-title">已选机器</div><div className="machine-pool node-scale-machine-pool"><div className="machine-pool-head"><span></span><span>机器／IP</span><span>硬件</span><span>节点角色</span><span>状态</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001121<br /><small>10.24.18.121</small></span><span>8×A100 · 1TB</span><span>Worker</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001122<br /><small>10.24.18.122</small></span><span>8×A100 · 1TB</span><span>Worker</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001123<br /><small>10.24.18.123</small></span><span>8×A100 · 1TB</span><span>Worker</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001124<br /><small>10.24.18.124</small></span><span>8×A100 · 1TB</span><span>Worker</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001125–1130</span><span>8×A100 · 1TB</span><span>Worker</span><span>可用 · 6台</span></div></div></section>
        <section className="form-section"><div className="form-section-title">加入集群设置</div><div className="form-grid"><div className="form-field"><label>节点软件版本</label><div className="fixed-scope">跟随集群 · Kubernetes v1.36.2</div></div><div className="form-field"><label htmlFor="nodeScaleSchedule">加入后调度策略</label><select id="nodeScaleSchedule" className="dialog-select"><option>先保持不可调度，验收后手动启用</option><option>Ready 后自动启用调度</option></select></div></div></section>
      </div>
      <footer className="small-dialog-foot"><span>创建任务后可在“运维任务”中查看安装、join 和 Ready 验收进度</span><div className="dialog-actions"><button type="button" className="dialog-button overlay-return" data-return-hash="">取消</button><button id="nodeScaleSubmit" type="button" className="dialog-button primary">开始节点扩容</button></div></footer>
    </section>
  </div>

  <div className="small-page-layer cluster-create-layer" role="dialog" aria-modal="true" aria-labelledby="clusterCreateTitle">
    <section className="small-dialog wizard-dialog">
      <header className="small-dialog-head"><div><div id="clusterCreateTitle" className="small-dialog-title">创建／接入 Kubernetes 集群</div><div id="clusterCreateSubtitle" className="small-dialog-subtitle">集群只使用当前数据中心的机器，不跨供应商或数据中心</div></div><button type="button" className="small-dialog-close overlay-return" data-return-hash="dc-list" aria-label="关闭">×</button></header>
      <div className="wizard-steps"><div className="wizard-step active" data-wizard-step="1"><span className="wizard-step-index">1</span><span>基础信息与方式</span></div><div className="wizard-step" data-wizard-step="2"><span className="wizard-step-index">2</span><span>连接或部署配置</span></div><div className="wizard-step" data-wizard-step="3"><span className="wizard-step-index">3</span><span>预检与确认</span></div></div>
      <div className="small-dialog-body">
        <section className="wizard-panel active" data-wizard-panel="1"><div className="form-notice">这里不重复录入 CPU、GPU 等裸金属信息。新建集群时选择已纳管机器；接入已有集群时提供 Kubernetes 连接信息。</div><section className="form-section"><div className="form-section-title">基础信息</div><div className="form-grid"><div className="form-field"><label htmlFor="newClusterName"><span className="required-mark">*</span>集群名称</label><input id="newClusterName" className="dialog-input" defaultValue="gpu-prod-02" /></div><div className="form-field"><label>所属数据中心</label><div className="fixed-scope">上海一号数据中心 · 厂商A</div></div><div className="form-field"><label htmlFor="clusterEnvironment">环境</label><select id="clusterEnvironment" className="dialog-select"><option>生产</option><option>测试</option><option>开发</option></select></div><div className="form-field"><label htmlFor="clusterOwner">负责人（选填）</label><input id="clusterOwner" className="dialog-input" placeholder="用于异常和变更通知" /></div></div></section><section className="form-section"><div className="form-section-title">集群接入方式</div><div className="method-switch">
          <button type="button" className="method-card cluster-method selected" data-cluster-method="existing"><strong>接入已有 Kubernetes</strong><span>连接 API Server 并发现该集群已有 Nodes，不重装 Kubernetes</span></button><button type="button" className="method-card cluster-method" data-cluster-method="remote"><strong>远程部署新集群</strong><span>从数据中心资源池选机器，通过 SSH 下发 Kubernetes 软件包</span></button><button type="button" className="method-card cluster-method" data-cluster-method="offline"><strong>离线软件包接入</strong><span>无法从平台主动连接时，在目标环境执行接入包</span></button>
        </div></section></section>

        <section className="wizard-panel" data-wizard-panel="2">
          <div className="cluster-method-panel" data-method-panel="remote"><section className="form-section"><div className="form-section-title">选择已纳管机器</div><div id="clusterMachineSelectionHelp" className="field-help">当前数据中心有 18 台未分配机器；至少选择 3 台控制面机器。</div><div className="machine-pool"><div className="machine-pool-head"><span></span><span>机器／IP</span><span>硬件</span><span>角色</span><span>状态</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001121<br /><small>10.24.18.121</small></span><span>64C · 512G</span><span>控制面</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001122<br /><small>10.24.18.122</small></span><span>64C · 512G</span><span>控制面</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001123<br /><small>10.24.18.123</small></span><span>64C · 512G</span><span>控制面</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001124<br /><small>10.24.18.124</small></span><span>8×A100 · 1TB</span><span>Worker</span><span>可用</span></div><div className="machine-pool-row"><input type="checkbox" defaultChecked /><span>BM-00001125–1130</span><span>8×A100 · 1TB</span><span>Worker</span><span>可用 · 6台</span></div></div></section><section className="form-section"><div className="form-section-title">Kubernetes 部署配置</div><div className="form-grid"><div className="form-field"><label htmlFor="k8sPackage"><span className="required-mark">*</span>Kubernetes 软件包</label><select id="k8sPackage" className="dialog-select"><option>Kubernetes v1.36.2 · 平台验证版</option><option>Kubernetes v1.35.6</option></select><div className="field-help">软件包包含 Kubernetes 及平台已验证的 CNI、CSI 和 Agent 版本</div></div><div className="form-field"><label htmlFor="clusterSshCredential"><span className="required-mark">*</span>SSH 凭据</label><select id="clusterSshCredential" className="dialog-select"><option>sh-dc-root-key-01</option></select></div><div className="form-field"><label htmlFor="podCidr"><span className="required-mark">*</span>Pod CIDR</label><input id="podCidr" className="dialog-input" defaultValue="10.244.0.0/16" /></div><div className="form-field"><label htmlFor="serviceCidr"><span className="required-mark">*</span>Service CIDR</label><input id="serviceCidr" className="dialog-input" defaultValue="10.96.0.0/12" /></div></div></section></div>
          <div className="cluster-method-panel" data-method-panel="existing" style={{ display: 'none' }}><section className="form-section"><div className="form-section-title">已有集群连接</div><div className="field-help" style={{ marginBottom: '10px' }}>前置条件：供应商已装好 Kubernetes 并提供 kubeconfig（含 list/watch 权限）。连通后平台<b>自动发现该集群已有的 Nodes</b>并与裸金属台账关联。这些 Nodes 已属于被接入集群，不会进入“未分配机器池”；其中 Ready 且允许调度的 Node 可以承载 Pods。</div><div className="form-grid"><div className="form-field"><label htmlFor="apiServer"><span className="required-mark">*</span>API Server 地址</label><input id="apiServer" className="dialog-input" placeholder="https://10.24.16.10:6443" /></div><div className="form-field"><label htmlFor="existingVersion">Kubernetes 版本</label><input id="existingVersion" className="dialog-input" placeholder="连通后自动识别" readOnly /></div><div className="form-field full"><label htmlFor="kubeconfigFile"><span className="required-mark">*</span>Kubeconfig</label><input id="kubeconfigFile" type="file" className="dialog-input" /><div className="field-help">用于首次连通和权限校验；接入不会重装或升级现有 Kubernetes</div></div></div></section></div>
          <div className="cluster-method-panel" data-method-panel="offline" style={{ display: 'none' }}><section className="form-section"><div className="form-section-title">离线接入包</div><div className="form-notice">下载包后，在目标网络中的管理机执行。接入包会校验 Kubernetes 版本、安装平台 Agent，并使用一次性注册码回连。</div><div className="form-grid"><div className="form-field"><label>一次性注册码</label><div className="fixed-scope">AT-7Q9K-2M4P · 24 小时内有效</div></div><div className="form-field"><label>离线软件包</label><button type="button" className="dialog-button">下载接入包</button></div><div className="form-field full"><label>执行命令</label><div className="fixed-scope">install.sh --token AT-7Q9K-2M4P</div></div></div></section></div>
        </section>

        <section className="wizard-panel" data-wizard-panel="3"><div className="form-notice">提交前先检查网段冲突、机器连通、权限、系统依赖与软件包兼容性。点击后只是创建异步任务，机器完成 join 后才会注册为 Node。</div><div className="wizard-summary"><div className="wizard-summary-item"><small>所属范围</small><strong>厂商A · 上海一号数据中心</strong></div><div className="wizard-summary-item"><small>集群名称</small><strong>gpu-prod-02</strong></div><div className="wizard-summary-item"><small>接入方式</small><strong id="clusterWizardMethodSummary">远程部署新集群</strong></div><div className="wizard-summary-item"><small>任务结果</small><strong>创建集群并将选中机器注册为 Nodes</strong></div></div><div className="precheck-list" style={{ marginTop: '12px' }}><div className="precheck-row"><span>数据中心与机器归属</span><b className="precheck-count precheck-pass">通过</b><span className="precheck-action">同一数据中心</span></div><div className="precheck-row"><span>管理网与 SSH 连通</span><b className="precheck-count precheck-pass">通过</b><span className="precheck-action">10 台可达</span></div><div className="precheck-row"><span>Pod／Service 网段冲突</span><b className="precheck-count precheck-pass">通过</b><span className="precheck-action">无冲突</span></div><div className="precheck-row"><span>软件包与系统依赖</span><b className="precheck-count precheck-pass">通过</b><span className="precheck-action">v1.36.2</span></div></div></section>
        <section id="clusterDeployResult" className="cluster-deploy-result">
          <div className="deploy-status-line"><div><strong id="clusterResultHeading">新集群部署任务已创建</strong><br /><span id="clusterResultDescription">gpu-prod-02 正在部署；Node 注册和 Ready 验收会继续在后台执行</span></div><span id="clusterResultStatus" className="deploy-status-chip">执行中</span></div>
          <div className="onboard-result-summary"><div className="onboard-result-stat"><small id="clusterResultMetric1Label">控制面部署</small><strong id="clusterResultMetric1">3/3</strong></div><div className="onboard-result-stat"><small id="clusterResultMetric2Label">Node 已注册</small><strong id="clusterResultMetric2">8/10</strong></div><div className="onboard-result-stat"><small id="clusterResultMetric3Label">Node Ready</small><strong id="clusterResultMetric3">7/10</strong></div></div>
          <section className="form-section"><div className="form-section-title">任务进度</div><div id="clusterDeployStageList" className="deploy-stage-list"><div className="deploy-stage-row"><div className="deploy-stage-name"><strong>控制面初始化</strong><small>API Server · etcd · Controller</small></div><div className="deploy-stage-progress"><span style={{ width: '100%' }}></span></div><span className="deploy-stage-state done">完成 3/3</span></div><div className="deploy-stage-row"><div className="deploy-stage-name"><strong>节点组件安装与 join</strong><small>container runtime · kubelet · CNI</small></div><div className="deploy-stage-progress"><span style={{ width: '80%' }}></span></div><span className="deploy-stage-state">注册 8/10</span></div><div className="deploy-stage-row"><div className="deploy-stage-name"><strong>Node Ready 验收</strong><small>节点条件、网络、存储与 GPU 组件</small></div><div className="deploy-stage-progress"><span style={{ width: '70%' }}></span></div><span className="deploy-stage-state">Ready 7/10</span></div><div className="deploy-stage-row"><div className="deploy-stage-name"><strong>失败机器</strong><small>BM-00001129 · BM-00001130</small></div><div>一台 kubelet 启动失败，一台 CNI 未就绪</div><span className="deploy-stage-state failed">2 台待重试</span></div></div></section>
          <div id="clusterResultExplain" className="deploy-result-explain">Node 对象在 kubelet 成功 join 后才会出现；本次已注册 8 个，其中 7 个 Ready。新 Node 默认保持不可调度，待运维验收后再启用调度。</div>
        </section>
      </div>
      <footer className="small-dialog-foot cluster-wizard-footer"><span id="clusterWizardFootNote" className="wizard-foot-note">下一步配置机器、网络和 Kubernetes 软件包</span><div className="dialog-actions"><button id="clusterWizardPrev" type="button" className="dialog-button hidden">上一步</button><button type="button" className="dialog-button overlay-return" data-return-hash="dc-list">取消</button><button id="clusterWizardNext" type="button" className="dialog-button primary">下一步</button></div></footer>
      <footer className="small-dialog-foot cluster-result-footer"><span>任务已进入后台执行，关闭页面不会中断部署</span><div className="dialog-actions"><button id="clusterResultBack" type="button" className="dialog-button">查看配置</button><button id="clusterResultDone" type="button" className="dialog-button primary">返回集群概览</button></div></footer>
    </section>
  </div>

    </div>
  );
};

export default ClusterOperationsHomepage;
