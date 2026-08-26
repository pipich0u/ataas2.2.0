import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  DeploymentUnitOutlined,
  ExperimentOutlined,
  PoweroffOutlined,
  RightOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Input, InputNumber, message, Select, Tag } from 'antd';
import { useState } from 'react';

type WorkflowTemplate = {
  id: string;
  title: string;
  description: string;
  steps: number;
  duration: string;
  icon: React.ReactNode;
  featured?: boolean;
};

const templates: WorkflowTemplate[] = [
  {
    id: 'bring-group-online', title: '上线 PD 组',
    description: '创建 router 和 workers RBG，等待就绪后更新 ServiceEntry 并设置限流。',
    steps: 5, duration: '约 18 分钟', icon: <RocketOutlined />, featured: true,
  },
  {
    id: 'take-group-offline', title: '下线 PD 组',
    description: '降低限流，更新 ServiceEntry，等待流量排空后删除 RBG。',
    steps: 5, duration: '约 8 分钟', icon: <PoweroffOutlined />,
  },
  {
    id: 'gradual-weight-migration', title: '流量权重端点转移',
    description: '在 ServiceEntry 的 router 端点间分阶段迁移流量权重。',
    steps: 5, duration: '约 5 分钟', icon: <SwapOutlined />,
  },
  {
    id: 'fresh-redeploy', title: 'Fresh redeploy（摘流 + 重新部署）',
    description: '从 ServiceEntry 摘流，删除并重新部署 RBG，待就绪后重新加回并进行验证。',
    steps: 6, duration: '约 10 分钟', icon: <DeploymentUnitOutlined />,
  },
  {
    id: 'redeploy-group', title: 'Redeploy group（更新配置）',
    description: '摘除 ServiceEntry 流量，按最新配置重新部署 RBG，恢复流量并执行验证。',
    steps: 6, duration: '约 10 分钟', icon: <SafetyCertificateOutlined />,
  },
  {
    id: 'rolling-worker-migration', title: 'Rolling worker migration',
    description: '创建新的 workers RBG，分批从旧 RBG 摘除、排空、打标签，等待新 pod 后加入 router。',
    steps: 7, duration: '约 20 分钟', icon: <DeploymentUnitOutlined />,
  },
  {
    id: 'rolling-pod-restart', title: 'Rolling pod restart',
    description: '按顺序重启目标 pod；每个 pod 恢复健康后再继续，保障服务可用。',
    steps: 3, duration: '约 2 分钟', icon: <ClockCircleOutlined />,
  },
  {
    id: 'smoke-test', title: 'Smoke test（压测）',
    description: '对指定 router 批量发送 chat completion 请求，统计 TTFT、TPOT 和 P50/P90/P99。',
    steps: 6, duration: '约 6 分钟', icon: <ExperimentOutlined />,
  },
];

const offlineSteps = [
  { title: 'Remove SE endpoint', description: '从 ServiceEntry 中移除当前 Group 的 router endpoint。', mode: '手动确认' },
  { title: 'Wait for traffic drain', description: '等待该 Group 的在途流量自然排空（超时 1200s）。', mode: '自动' },
  { title: 'Check worker loads（确认已排空）', description: '检查 workers 负载，确认没有正在处理的请求。', mode: '手动确认' },
  { title: 'Takedown router + workers RBG', description: '下线 Group 对应的 router 与 workers RBG。', mode: '手动确认' },
  { title: 'Delete remaining pods', description: '删除未随 RBG 回收的剩余 pod。', mode: '自动' },
  { title: 'Confirm all pods gone', description: '确认 router 与 workers 的全部 pod 均已删除（超时 300s）。', mode: '自动' },
];

const GradualWeightMigrationPage = ({ onBack }: { onBack: () => void }) => {
  const [steps, setSteps] = useState(3);
  const [interval, setInterval] = useState(60);
  const [sourceEndpoint, setSourceEndpoint] = useState<string>();
  const [targetEndpoint, setTargetEndpoint] = useState<string>();
  const [activePlanStep, setActivePlanStep] = useState<number | null>(1);
  const configured = Boolean(sourceEndpoint && targetEndpoint && sourceEndpoint !== targetEndpoint);
  const phaseWeight = Math.round(100 - 100 / steps);
  const targetWeight = 100 - phaseWeight;
  const endpointLabel = (endpoint?: string) => endpoint === 'router-1' ? 'glm52-router-1.default.svc.cluster.local' : endpoint === 'router-2' ? 'glm52-router-2.default.svc.cluster.local' : '';
  const phaseWeights = (phase: number) => ({ source: Math.max(0, Math.round(100 - (phase * 100) / steps)), target: Math.min(100, Math.round((phase * 100) / steps)) });
  const renderWeightDiff = (phase: number) => {
    const weights = phaseWeights(phase);
    return <div className="workflow-se-diff"><div className="workflow-se-diff-pane before"><div className="workflow-se-diff-caption">变更前</div><pre>{`apiVersion: networking.istio.io/v1beta1\nkind: ServiceEntry\nmetadata:\n  name: glm-5.2\n  namespace: higress-system\nspec:\n  endpoints:\n  - address: glm52-router-1.default.svc.cluster.local`}<mark>{`\n    weight: ${phase === 1 ? 70 : phaseWeights(phase - 1).source}`}</mark>{`\n  - address: glm52-router-2.default.svc.cluster.local`}<mark>{`\n    weight: ${phase === 1 ? 30 : phaseWeights(phase - 1).target}`}</mark>{`\n  hosts:\n  - glm-5.2-cluster.local\n  ports:\n  - name: http\n    number: 30002`}</pre></div><div className="workflow-se-diff-pane after"><div className="workflow-se-diff-caption">变更后</div><pre>{`apiVersion: networking.istio.io/v1beta1\nkind: ServiceEntry\nmetadata:\n  name: glm-5.2\n  namespace: higress-system\nspec:\n  endpoints:\n  - address: glm52-router-1.default.svc.cluster.local`}<ins>{`\n    weight: ${weights.source}`}</ins>{`\n  - address: glm52-router-2.default.svc.cluster.local`}<ins>{`\n    weight: ${weights.target}`}</ins>{`\n  hosts:\n  - glm-5.2-cluster.local\n  ports:\n  - name: http\n    number: 30002`}</pre></div></div>;
  };
  return (
    <div className="model-ops-create-page workflow-migration-page">
      <header className="model-ops-create-header"><Button size="small" icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button><div><h1>Gradual weight migration</h1><span>Shift traffic between ServiceEntry endpoints over multiple steps</span></div></header>
      <main className="model-ops-create-layout workflow-migration-layout">
        <div className="model-ops-create-main workflow-migration-params">
          <section className="model-ops-create-section"><div className="model-ops-create-section-head"><span>01</span><div><strong>迁移目标</strong><em>选择流量所在的 ServiceEntry 与两个端点。</em></div></div><div className="workflow-migration-fields"><label><span>目标 cluster <b>*</b></span><div className="workflow-migration-select-visible"><Select defaultValue="beijing-prod" options={[{ value: 'beijing-prod', label: 'beijing-prod · 北京一区 / A100-H20' }]} /><span>beijing-prod · 北京一区 / A100-H20</span></div></label><label>ServiceEntry name<div className="workflow-migration-select-visible"><Select defaultValue="glm-5.2" options={[{ value: 'glm-5.2', label: 'glm-5.2（2 endpoints）' }]} /><span>glm-5.2（2 endpoints）</span></div></label><label>Source endpoint<div className="workflow-migration-select-visible"><Select value={sourceEndpoint} placeholder="选择 Endpoint" onChange={setSourceEndpoint} options={[{ value: 'router-1', label: 'glm52-router-1.default.svc.cluster.local' }, { value: 'router-2', label: 'glm52-router-2.default.svc.cluster.local' }]} />{sourceEndpoint && <span>{endpointLabel(sourceEndpoint)}</span>}</div></label><label>Target endpoint<div className="workflow-migration-select-visible"><Select value={targetEndpoint} placeholder="选择 Endpoint" onChange={setTargetEndpoint} options={[{ value: 'router-1', label: 'glm52-router-1.default.svc.cluster.local', disabled: sourceEndpoint === 'router-1' }, { value: 'router-2', label: 'glm52-router-2.default.svc.cluster.local', disabled: sourceEndpoint === 'router-2' }]} />{targetEndpoint && <span>{endpointLabel(targetEndpoint)}</span>}</div></label></div></section>
          <section className="model-ops-create-section"><div className="model-ops-create-section-head"><span>02</span><div><strong>迁移策略</strong><em>系统会在每个阶段后等待并观察服务状态。</em></div></div><div className="workflow-migration-fields two"><label>Number of steps<InputNumber value={steps} min={2} max={10} onChange={(value) => setSteps(value || 3)} /></label><label>Observe interval（seconds）<InputNumber value={interval} min={10} max={600} onChange={(value) => setInterval(value || 60)} /></label></div></section>
          <section className="model-ops-create-section workflow-migration-confirm"><Checkbox defaultChecked>每步确认</Checkbox><span>每次更新权重前均需手动确认。</span></section>
        </div>
        <aside className="model-ops-create-guide workflow-migration-plan"><section><div className="workflow-offline-plan-head"><h2>执行步骤（{configured ? steps * 2 - 1 : 1}）</h2><span>{configured ? `共 ${steps} 个迁移阶段` : '等待选择迁移端点'}</span></div>
          {!configured ? <article className="workflow-migration-row placeholder"><span>1</span><strong>（请选择 SE 和 endpoint）</strong><em>手动确认</em><small>Sleep 1s（placeholder）</small></article> : <>{Array.from({ length: steps }, (_, index) => {
            const phase = index + 1;
            const stepNumber = index * 2 + 1;
            const weights = phaseWeights(phase);
            return <div key={phase} className="workflow-migration-step-pair"><article className={`workflow-migration-phase ${activePlanStep === stepNumber ? 'expanded' : ''}`} onClick={() => setActivePlanStep((current) => current === stepNumber ? null : stepNumber)}><div className="workflow-migration-phase-head"><span>{stepNumber}</span><strong>Phase {phase}/{steps}: {weights.source}/{weights.target}</strong><em>手动确认</em><small>2 mutation(s) on glm-5.2</small></div>{activePlanStep === stepNumber && renderWeightDiff(phase)}</article>{phase < steps && <article className={`workflow-migration-row ${activePlanStep === stepNumber + 1 ? 'expanded' : ''}`} onClick={() => setActivePlanStep((current) => current === stepNumber + 1 ? null : stepNumber + 1)}><span>{stepNumber + 1}</span><strong>Observe（{interval}s）</strong><em>自动</em><small>Sleep {interval}s（Observe after {weights.source}/{weights.target} split）</small>{activePlanStep === stepNumber + 1 && <div className="workflow-observe-countdown"><b>{interval}s</b><span>等待 {interval} 秒</span><em>Observe after {weights.source}/{weights.target} split</em></div>}</article>}</div>;
          })}</>}
          <div className="workflow-offline-plan-actions"><Button onClick={onBack}>取消</Button><Button type="primary" disabled={!configured}>执行任务</Button></div>
        </section></aside>
      </main>
    </div>
  );
};

const TakeGroupOfflinePage = ({ onBack }: { onBack: () => void }) => {
  const [confirmEach, setConfirmEach] = useState(true);
  const [cluster, setCluster] = useState('beijing-prod');
  const [serviceEntry, setServiceEntry] = useState('glm-5.2');
  const [model, setModel] = useState<string>();
  const [groupIndex, setGroupIndex] = useState('2');
  const [consumer, setConsumer] = useState<string>();
  const [expandedStep, setExpandedStep] = useState(0);
  const readyToExecute = Boolean(cluster && serviceEntry && model);
  const clusterLabel = cluster === 'shanghai-online' ? 'shanghai-online · H20-910B' : 'beijing-prod · 北京一区 / A100-H20';
  const serviceEntryLabel = serviceEntry === 'glm-5.2-sh' ? 'glm-5.2-sh（3 endpoints）' : serviceEntry === 'glm-5.2-canary' ? 'glm-5.2-canary（1 endpoint）' : 'glm-5.2（2 endpoints）';
  const modelKey = model?.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'model';
  const groupTargets = [`${modelKey}-router-${groupIndex}`, `${modelKey}-workers-${groupIndex}`];
  const groupPods = [`${modelKey}-router-${groupIndex}-router-0`, `${modelKey}-workers-${groupIndex}-decode-0`, `${modelKey}-workers-${groupIndex}-decode-1`, `${modelKey}-workers-${groupIndex}-decode-2`, ...Array.from({ length: 8 }, (_, pod) => `${modelKey}-workers-${groupIndex}-prefill-${pod}`)];
  return (
    <div className="model-ops-create-page workflow-offline-page">
      <header className="model-ops-create-header">
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
        <div><h1>Take group offline</h1><span>Lower rate limit → update ServiceEntry → wait drain → delete RBGs</span></div>
      </header>
      <main className="model-ops-create-layout workflow-offline-layout">
        <div className="model-ops-create-main workflow-offline-params">
          <section className="model-ops-create-section">
            <div className="model-ops-create-section-head"><span>01</span><div><strong>目标 Group</strong><em>选择要下线的集群、模型与 Group。</em></div></div>
            <div className="workflow-offline-field-grid">
              <label><span>目标 cluster <b>*</b></span><div className="workflow-offline-select-visible"><Select value={cluster} placeholder="请选择目标 cluster" onChange={(value) => { setCluster(value); setServiceEntry(value === 'shanghai-online' ? 'glm-5.2-sh' : 'glm-5.2'); }} options={[{ value: 'beijing-prod', label: 'beijing-prod · 北京一区 / A100-H20' }, { value: 'shanghai-online', label: 'shanghai-online · H20-910B' }]} /><span>{clusterLabel}</span></div></label>
              <label>Model<Select value={model} placeholder="请选择 Model" onChange={setModel} options={[{ value: 'GLM-5.2', label: 'GLM-5.2' }, { value: 'DeepSeek-V4', label: 'DeepSeek-V4' }, { value: 'KIMI-K2', label: 'KIMI-K2' }]} /></label>
              <label>Group index<Select value={groupIndex} onChange={setGroupIndex} options={[{ value: '1', label: 'Group 1' }, { value: '2', label: 'Group 2' }, { value: '3', label: 'Group 3' }]} /></label>
              <label>ServiceEntry name（可选）<div className="workflow-offline-select-visible"><Select value={serviceEntry} placeholder="请选择 ServiceEntry" onChange={setServiceEntry} options={cluster === 'shanghai-online' ? [{ value: 'glm-5.2-sh', label: 'glm-5.2-sh（3 endpoints）' }] : [{ value: 'glm-5.2', label: 'glm-5.2（2 endpoints）' }, { value: 'glm-5.2-canary', label: 'glm-5.2-canary（1 endpoint）' }]} /><span>{serviceEntryLabel}</span></div></label>
            </div>
          </section>
          <section className="model-ops-create-section">
            <div className="model-ops-create-section-head"><span>02</span><div><strong>排流配置</strong><em>先降低流量入口的限流，再开始等待流量排空。</em></div></div>
            <div className="workflow-offline-field-grid two">
              <label>Rate limit consumer（可选）<Select value={consumer} placeholder="选择 Consumer" onChange={setConsumer} options={[{ value: 'default', label: 'default' }, { value: 'internal', label: 'internal' }]} /></label>
              <label>Lowered QPS<InputNumber defaultValue={0} min={0} /></label>
            </div>
          </section>
          <section className="model-ops-create-section workflow-offline-confirm-section"><Checkbox checked={confirmEach} onChange={(event) => setConfirmEach(event.target.checked)}>每个手动步骤执行前均需确认</Checkbox></section>
        </div>
        <aside className="model-ops-create-guide workflow-offline-plan">
          <section>
          <div className="workflow-offline-plan-head"><h2>执行步骤（6）</h2><span>{model ? `${cluster} · ${model}` : '请选择目标 Model'}</span></div>
          <div className="workflow-offline-step-list">
            {offlineSteps.map((step, index) => (
              <article className={`workflow-offline-step ${expandedStep === index ? 'expanded' : ''}`} key={step.title} onClick={() => setExpandedStep(index)}>
                <span className="workflow-offline-step-number">{index + 1}</span>
                <div><div className="workflow-offline-step-title"><strong>{step.title}</strong><em className={step.mode === '自动' ? 'auto' : ''}>{step.mode}</em></div><p>{index === 0 && serviceEntry ? `从 ${serviceEntry} 中移除当前 Group 的 router endpoint。` : step.description}</p></div>
                <span className={`workflow-offline-step-status ${readyToExecute ? 'ready' : ''}`}>{readyToExecute ? '已就绪' : '待配置'}</span>
                {index === 0 && serviceEntry && expandedStep === index && (
                  <div className="workflow-se-diff" aria-label="ServiceEntry 变更预览">
                    <div className="workflow-se-diff-pane before"><div className="workflow-se-diff-caption">变更前</div><pre>{`apiVersion: networking.istio.io/v1beta1\nkind: ServiceEntry\nmetadata:\n  name: ${serviceEntry}\n  namespace: higress-system\nspec:\n  endpoints:\n  - address: glm52-router-1.default.svc.cluster.local\n    weight: 70`}<mark>{`\n  - address: glm52-router-2.default.svc.cluster.local\n    weight: 30`}</mark>{`\n  hosts:\n  - glm-5.2-cluster.local\n  location: MESH_INTERNAL\n  ports:\n  - name: http\n    number: 30002\n    protocol: HTTP`}</pre></div>
                    <div className="workflow-se-diff-pane after"><div className="workflow-se-diff-caption">变更后</div><pre>{`apiVersion: networking.istio.io/v1beta1\nkind: ServiceEntry\nmetadata:\n  name: ${serviceEntry}\n  namespace: higress-system\nspec:\n  endpoints:\n  - address: glm52-router-1.default.svc.cluster.local\n    weight: 70\n  hosts:\n  - glm-5.2-cluster.local\n  location: MESH_INTERNAL\n  ports:\n  - name: http\n    number: 30002\n    protocol: HTTP`}</pre></div>
                  </div>
                )}
                {index === 1 && expandedStep === index && (
                  <div className="workflow-drain-targets">
                    <strong>将等待这些 Pod 的请求排空</strong>
                    {model ? (
                      <><span>{modelKey}-workers-{groupIndex}</span><ul>{groupPods.slice(1).map((pod) => <li key={pod}>{pod}</li>)}</ul></>
                    ) : <em>（无目标）</em>}
                  </div>
                )}
                {index === 2 && expandedStep === index && (
                  <div className="workflow-step-detail"><div className="workflow-step-detail-heading"><strong>Check worker loads（确认已排空）</strong><span>sglang.loads</span></div><p>查询 {model ? `${modelKey}-workers-${groupIndex}` : '目标 workers'}（所有 pod）的负载状态，确认没有正在处理的请求。</p><small>参数（3）</small><pre>{`{\n  "model": "${model || '未选择'}",\n  "group_index": "${groupIndex}",\n  "namespace": "default"\n}`}</pre></div>
                )}
                {index === 3 && expandedStep === index && (
                  <div className="workflow-step-detail"><div className="workflow-step-detail-heading"><strong>Takedown router + workers RBG</strong><span>deployment.takedown_group_simple</span></div><p>删除 RBG：{groupTargets.join(' 和 ')}。</p><code>targets: [{groupTargets.map((target) => `"${target}"`).join(', ')}]</code><small>参数（4）</small><pre>{`{\n  "namespace": "default",\n  "model": "${model || '未选择'}",\n  "group_index": "${groupIndex}",\n  "message": "workflow: takedown ${modelKey} group ${groupIndex}"\n}`}</pre></div>
                )}
                {index === 4 && expandedStep === index && (
                  <div className="workflow-step-detail workflow-delete-pods"><div className="workflow-delete-meta"><span>NAMESPACE <b>default</b></span><span>SELECTOR <b>rolebasedgroup.workloads.x-k8s.io/name in ({groupTargets.join(',')})</b></span></div><ul>{groupPods.map((pod) => <li key={pod}>{pod}</li>)}</ul><em>将删除匹配的 {groupPods.length} 个 Pod</em></div>
                )}
                {index === 5 && expandedStep === index && (
                  <div className="workflow-step-detail workflow-confirm-pods"><strong>将等待 {model || '目标模型'} 第 {groupIndex} 组的 Pod 全部删除</strong><p>目标：{groupTargets.join('、')}</p><p>超时：300s</p></div>
                )}
              </article>
            ))}
          </div>
          <div className="workflow-offline-plan-actions"><Button onClick={onBack}>取消</Button><Button type="primary" disabled={!readyToExecute}>执行任务</Button></div>
          </section>
        </aside>
      </main>
    </div>
  );
};

export default function WorkflowCreatePage({ onBack, onCreatePdGroup }: { onBack: () => void; onCreatePdGroup: () => void }) {
  const [selected, setSelected] = useState('bring-group-online');
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [migrationOpen, setMigrationOpen] = useState(false);
  const chosen = templates.find((item) => item.id === selected)!;

  if (offlineOpen) return <TakeGroupOfflinePage onBack={() => setOfflineOpen(false)} />;
  if (migrationOpen) return <GradualWeightMigrationPage onBack={() => setMigrationOpen(false)} />;

  return (
    <div className="workflow-create-page">
      <div className="workflow-create-topbar">
        <button type="button" className="workflow-create-back" onClick={onBack}>
          <ArrowLeftOutlined /> 返回任务流程
        </button>
        <div className="workflow-live-status"><i /> 系统运行正常</div>
      </div>

      <main className="workflow-create-content">
        <div className="workflow-create-heading">
          <div>
            <span className="workflow-create-kicker">任务编排</span>
            <h1>选择要创建的任务流程</h1>
            <p>从标准流程开始创建，系统将引导你逐步完成配置与执行。</p>
          </div>
          <div className="workflow-create-progress"><CheckCircleFilled /> 第 1 步：选择流程</div>
        </div>

        <section className="workflow-template-grid" aria-label="任务流程模板">
          {templates.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`workflow-template-card ${selected === item.id ? 'selected' : ''}`}
              onClick={() => item.id === 'bring-group-online' ? onCreatePdGroup() : item.id === 'take-group-offline' ? setOfflineOpen(true) : item.id === 'gradual-weight-migration' ? setMigrationOpen(true) : setSelected(item.id)}
            >
              <span className="workflow-template-icon">{item.icon}</span>
              <span className="workflow-template-body">
                <span className="workflow-template-title-row">
                  <strong>{item.title}</strong>
                  {item.featured && <Tag>推荐</Tag>}
                </span>
                <span className="workflow-template-description">{item.description}</span>
                <span className="workflow-template-meta">{item.steps} 个步骤 <b /> {item.duration}</span>
              </span>
              <span className="workflow-template-arrow"><RightOutlined /></span>
            </button>
          ))}
        </section>

        <div className="workflow-create-footer">
          <div><strong>已选择：{chosen.title}</strong><span>{chosen.description}</span></div>
          <Button size="large" type="primary" onClick={() => chosen.id === 'bring-group-online' ? onCreatePdGroup() : chosen.id === 'take-group-offline' ? setOfflineOpen(true) : chosen.id === 'gradual-weight-migration' ? setMigrationOpen(true) : message.success(`已选择「${chosen.title}」，即将进入配置步骤`)}>
            下一步 <RightOutlined />
          </Button>
        </div>
      </main>
    </div>
  );
}
