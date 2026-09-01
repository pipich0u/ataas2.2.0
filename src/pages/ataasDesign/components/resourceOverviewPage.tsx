import {
  AppstoreOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useMemo, useState } from 'react';
import './resourceOverviewPage.less';

type ResourceOverviewPageProps = {
  onNavigate?: (tab: 'inferenceOps' | 'logs' | 'clusterOperations') => void;
};

type InferenceGroupStatus = 'running' | 'idle' | 'warning';

type InferenceGroup = {
  name: string;
  model: string;
  mode: string;
  cluster: string;
  pods: string;
  nodes: number;
  requestRate: string;
  status: InferenceGroupStatus;
};

const inferenceGroups: InferenceGroup[] = [
  { name: 'glm52-yc-prod', model: 'GLM-5.2', mode: 'PD 分离', cluster: '宜昌生产集群', pods: '18 / 18', nodes: 5, requestRate: '9.7K RPM', status: 'warning' },
  { name: 'glm51-router-prod', model: 'GLM-5.1', mode: 'PD 分离', cluster: '上海在线集群', pods: '14 / 14', nodes: 4, requestRate: '18.5K RPM', status: 'running' },
  { name: 'deepseek-v4-prod', model: 'DeepSeek-V4', mode: 'PD 分离', cluster: '北京 A100 集群', pods: '10 / 10', nodes: 3, requestRate: '7.4K RPM', status: 'running' },
  { name: 'kimi-k2-prod', model: 'KIMI-K2', mode: '单机部署', cluster: '上海生产集群', pods: '8 / 8', nodes: 3, requestRate: '4.8K RPM', status: 'running' },
  { name: 'qwen3-32b-batch', model: 'Qwen3-32B', mode: '批处理推理', cluster: '广州测试集群', pods: '6 / 6', nodes: 2, requestRate: '空闲', status: 'idle' },
  { name: 'minicpm-v-vision', model: 'MiniCPM-V 4.0', mode: '视觉推理', cluster: '武汉昇腾集群', pods: '5 / 5', nodes: 2, requestRate: '空闲', status: 'idle' },
  { name: 'bge-m3-embedding', model: 'BGE-M3', mode: '向量推理', cluster: '广州测试集群', pods: '4 / 4', nodes: 2, requestRate: '2.2K RPM', status: 'running' },
  { name: 'rerank-v3-service', model: 'BGE-Reranker-V2', mode: '重排序推理', cluster: '武汉昇腾集群', pods: '3 / 3', nodes: 1, requestRate: '1.6K RPM', status: 'running' },
];

const operationLogs = [
  { time: '14:23', date: '今天', title: '推理组配置已更新', detail: 'glm52-yc-prod · 扩容 Decode 实例至 4 个', actor: '李浩', tone: 'primary' },
  { time: '11:05', date: '今天', title: '节点已进入维护状态', detail: 'gpu-node-07 · 已完成实例迁移', actor: '周明', tone: 'warning' },
  { time: '18:42', date: '昨天', title: '模型版本发布完成', detail: 'DeepSeek-V4 · 版本 ds-v4.0.3', actor: '陈宇', tone: 'success' },
  { time: '09:30', date: '昨天', title: '资源池扩容完成', detail: '北京 A100 集群 · 新增 2 个节点', actor: '系统', tone: 'success' },
];

const auditLogs = [
  { operator: '李浩', action: '更新推理组', target: 'glm52-yc-prod', time: '今天 14:23:18', result: '成功' },
  { operator: '周明', action: '变更节点状态', target: 'gpu-node-07', time: '今天 11:05:42', result: '成功' },
  { operator: '陈宇', action: '发布模型版本', target: 'DeepSeek-V4', time: '昨天 18:42:07', result: '成功' },
  { operator: '王琳', action: '创建访问凭据', target: 'svc-qwen3-batch', time: '昨天 15:16:31', result: '成功' },
];

const statusCopy: Record<InferenceGroupStatus, { label: string; note: string }> = {
  running: { label: '运行中', note: '正在承载推理请求' },
  idle: { label: '空闲', note: '可调度新任务' },
  warning: { label: '需关注', note: '存在 1 项资源告警' },
};

const ResourceOverviewPage = ({ onNavigate }: ResourceOverviewPageProps) => {
  const [filter, setFilter] = useState<'all' | InferenceGroupStatus>('all');
  const [refreshedAt, setRefreshedAt] = useState('刚刚');

  const visibleGroups = useMemo(() => (
    filter === 'all' ? inferenceGroups : inferenceGroups.filter((group) => group.status === filter)
  ), [filter]);

  const refresh = () => {
    const now = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
    setRefreshedAt(now);
  };

  return (
    <div className="resource-overview-page">
      <header className="resource-overview-header">
        <div>
          <div className="resource-overview-title-row">
            <h1>资源总览</h1>
            <span className="resource-overview-live"><i />资源状态正常</span>
          </div>
          <p>查看模型服务、推理组及底层资源的当前运行状态。</p>
        </div>
        <div className="resource-overview-actions">
          <span className="resource-overview-freshness">更新于 {refreshedAt}</span>
          <button className="resource-overview-refresh" type="button" onClick={refresh}>
            <ReloadOutlined /> 刷新
          </button>
          <button className="resource-overview-primary" type="button" onClick={() => onNavigate?.('inferenceOps')}>
            进入推理运维 <ArrowRightOutlined />
          </button>
        </div>
      </header>

      <section className="resource-overview-summary" aria-label="资源统计">
        <article className="resource-overview-stat-card model">
          <span className="resource-overview-stat-icon"><AppstoreOutlined /></span>
          <div>
            <span className="resource-overview-stat-label">当前模型</span>
            <strong>8</strong><em>个</em>
            <small>全部处于可用状态</small>
          </div>
        </article>
        <button
          className="resource-overview-stat-card groups is-action"
          type="button"
          onClick={() => onNavigate?.('inferenceOps')}
          aria-label="查看推理运维"
        >
          <span className="resource-overview-stat-icon"><CloudServerOutlined /></span>
          <div>
            <span className="resource-overview-stat-label">推理组</span>
            <strong>8</strong><em>个</em>
            <small><b>5</b> 个运行中 · <span>2</span> 个空闲 · 1 个需关注</small>
          </div>
          <span className="resource-overview-stat-link">查看推理运维 <ArrowRightOutlined /></span>
        </button>
        <button
          className="resource-overview-stat-card pods is-action"
          type="button"
          onClick={() => onNavigate?.('clusterOperations')}
          aria-label="查看 GPU 节点"
        >
          <span className="resource-overview-stat-icon"><DatabaseOutlined /></span>
          <div>
            <span className="resource-overview-stat-label">Pods</span>
            <strong>68</strong><em>个</em>
            <small><b>67</b> 个 Ready · 1 个需关注</small>
          </div>
          <span className="resource-overview-stat-link">查看 GPU 节点 <ArrowRightOutlined /></span>
        </button>
        <article className="resource-overview-stat-card nodes">
          <span className="resource-overview-stat-icon"><AuditOutlined /></span>
          <div>
            <span className="resource-overview-stat-label">Nodes</span>
            <strong>22</strong><em>台</em>
            <small><b>21</b> 台正常 · 1 台维护中</small>
          </div>
        </article>
      </section>

      <section className="resource-overview-main-grid">
        <article className="resource-overview-card resource-overview-groups-card">
          <header className="resource-overview-card-head">
            <div>
              <h2>推理组运行状态</h2>
              <p>推理组当前承载的模型、资源与调度状态</p>
            </div>
            <div className="resource-overview-filter" aria-label="推理组状态筛选">
              {([
                ['all', '全部'],
                ['running', '运行中'],
                ['idle', '空闲'],
                ['warning', '需关注'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? 'active' : ''}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </header>
          <div className="resource-overview-group-head" aria-hidden="true">
            <span>推理组 / 部署模型</span>
            <span>所在集群</span>
            <span>Pods</span>
            <span>节点</span>
            <span>状态</span>
          </div>
          <div className="resource-overview-group-list">
            {visibleGroups.map((group) => {
              const status = statusCopy[group.status];
              return (
                <button
                  className={`resource-overview-group-row ${group.status}`}
                  key={group.name}
                  type="button"
                  onClick={() => onNavigate?.('inferenceOps')}
                  aria-label={`查看 ${group.name} 推理组详情`}
                >
                  <span className="resource-overview-group-name">
                    <strong>{group.name}</strong>
                    <small>{group.model}<i>{group.mode}</i></small>
                  </span>
                  <span className="resource-overview-group-cluster">{group.cluster}</span>
                  <span className="resource-overview-group-pods"><b>{group.pods}</b><small>Ready</small></span>
                  <span className="resource-overview-group-nodes">{group.nodes} 台</span>
                  <span className="resource-overview-group-status">
                    <i />
                    <b>{status.label}</b>
                    <small>{group.requestRate === '空闲' ? status.note : group.requestRate}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <footer className="resource-overview-card-foot">
            <span>共 8 个推理组，其中 <b>2 个空闲组可直接调度</b></span>
            <button type="button" onClick={() => onNavigate?.('inferenceOps')}>查看全部 <ArrowRightOutlined /></button>
          </footer>
        </article>

        <aside className="resource-overview-side-stack">
          <article className="resource-overview-card resource-overview-health-card">
            <header className="resource-overview-card-head compact">
              <div>
                <h2>资源健康度</h2>
                <p>基础资源当前可用情况</p>
              </div>
              <span className="resource-overview-health-rate">97.1<small>%</small></span>
            </header>
            <div className="resource-overview-health-list">
              <div>
                <span><i className="gpu" />GPU 卡</span><b>346 / 552</b><em>已分配</em>
                <div className="resource-overview-progress"><i className="gpu" style={{ width: '63%' }} /></div>
              </div>
              <div>
                <span><i className="memory" />GPU 显存</span><b>42.6 / 62.4 TB</b><em>已使用</em>
                <div className="resource-overview-progress"><i className="memory" style={{ width: '68%' }} /></div>
              </div>
              <div>
                <span><i className="pod" />Pod 就绪率</span><b>67 / 68</b><em>Ready</em>
                <div className="resource-overview-progress"><i className="pod" style={{ width: '98%' }} /></div>
              </div>
            </div>
            <button className="resource-overview-health-link" type="button" onClick={() => onNavigate?.('clusterOperations')}>
              查看节点资源 <ArrowRightOutlined />
            </button>
          </article>

          <article className="resource-overview-card resource-overview-idle-card">
            <header className="resource-overview-card-head compact">
              <div>
                <h2>空闲推理组</h2>
                <p>可快速承载新模型或批处理任务</p>
              </div>
              <span className="resource-overview-idle-count">2 个</span>
            </header>
            <div className="resource-overview-idle-list">
              {inferenceGroups.filter((group) => group.status === 'idle').map((group) => (
                <button type="button" key={group.name} onClick={() => onNavigate?.('inferenceOps')}>
                  <span><i /><b>{group.name}</b><small>{group.cluster} · {group.pods} Pods Ready</small></span>
                  <span>{group.model}<ArrowRightOutlined /></span>
                </button>
              ))}
            </div>
          </article>
        </aside>
      </section>

      <section className="resource-overview-log-grid">
        <article className="resource-overview-card resource-overview-log-card">
          <header className="resource-overview-card-head compact">
            <div>
              <h2><FileTextOutlined />操作日志</h2>
              <p>平台和资源的最新操作记录</p>
            </div>
            <button className="resource-overview-view-all" type="button" onClick={() => onNavigate?.('logs')}>查看全部 <ArrowRightOutlined /></button>
          </header>
          <div className="resource-overview-operation-list">
            {operationLogs.map((log) => (
              <div className="resource-overview-operation-row" key={`${log.date}-${log.time}-${log.title}`}>
                <time><b>{log.time}</b><span>{log.date}</span></time>
                <i className={log.tone} />
                <div><strong>{log.title}</strong><span>{log.detail}</span></div>
                <em>{log.actor}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="resource-overview-card resource-overview-audit-card">
          <header className="resource-overview-card-head compact">
            <div>
              <h2><ClockCircleOutlined />审计日志</h2>
              <p>重要配置和权限变更留痕</p>
            </div>
            <button className="resource-overview-view-all" type="button" onClick={() => onNavigate?.('logs')}>查看全部 <ArrowRightOutlined /></button>
          </header>
          <div className="resource-overview-audit-table">
            <div className="resource-overview-audit-head"><span>操作人</span><span>操作</span><span>对象</span><span>结果</span><span>时间</span></div>
            {auditLogs.map((log) => (
              <div className="resource-overview-audit-row" key={`${log.operator}-${log.time}`}>
                <span className="resource-overview-audit-user"><i>{log.operator.slice(0, 1)}</i>{log.operator}</span>
                <span>{log.action}</span>
                <span>{log.target}</span>
                <span><b><CheckCircleFilled />{log.result}</b></span>
                <time>{log.time}</time>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default ResourceOverviewPage;
