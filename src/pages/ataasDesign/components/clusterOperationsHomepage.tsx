import { useEffect, useRef } from 'react';
import { initializeClusterOperations } from './clusterOperationsRuntime';
import './clusterOperationsHomepage.less';

const ClusterOperationsHomepage = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootRef.current) initializeClusterOperations(rootRef.current);
  }, []);

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
            <div className="onboard-action overview-only-action" title="支持通过IP、SSH或软件包方式接入Kubernetes集群"><span>＋</span>纳管集群</div>
            <div className="onboard-action nodes-only-action" title="新增、移除或替换当前资源段的节点"><span>＋</span>节点扩缩容</div>
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
              <div className="quick-btn"><span className="quick-main">纳管集群</span><small>接入已有Kubernetes集群</small></div>
              <div className="quick-btn"><span className="quick-main">启用调度</span><small>验收通过后承载新任务</small></div>
              <div className="quick-btn"><span className="quick-main">停用调度</span><small>停止新任务并排空Pod</small></div>
              <div className="quick-btn"><span className="quick-main">节点扩缩容</span><small>新增或移除Nodes</small></div>
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

    </div>
  );
};

export default ClusterOperationsHomepage;
