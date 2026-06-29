import {
  ArrowUpOutlined,
  BulbOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  MoreOutlined,
  PlusOutlined,
  SendOutlined,
  SettingOutlined,
  StopOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input, InputNumber, Modal, Popover, Select, Slider, Space, Switch, Tooltip, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import qwenLogo from '../qwen-logo.svg';
import './playgroundChatPage.less';

type ChatRole = 'user' | 'assistant';
type ChatMessage = {
  role: ChatRole;
  content: string;
  thinkContent?: string;
};
type ChatParams = {
  temperature: number;
  maxTokens: number;
  topP: number;
  seed: string;
  stopSequence: string;
};

const modelOptions = [
  { label: 'deepseek-r1-prod', value: 'deepseek-r1-prod', desc: 'DeepSeek-R1-671B' },
  { label: 'glm-4-air-prod', value: 'glm-4-air-prod', desc: 'GLM-4-Air' },
  { label: 'qwen2.5-coder-prod', value: 'qwen2.5-coder-prod', desc: 'Qwen2.5-Coder-32B' },
];

function getPlaygroundModelLogo(value?: string) {
  const lowerValue = (value || '').toLowerCase();
  if (lowerValue.includes('glm')) return glmLogo;
  if (lowerValue.includes('qwen')) return qwenLogo;
  return deepseekLogo;
}

function renderPlaygroundModelLabel(value?: string, muted = false) {
  if (!value) return null;
  const model = modelOptions.find((item) => item.value === value);

  return (
    <span className={'playground-model-option' + (muted ? ' muted' : '')}>
      <img src={getPlaygroundModelLogo(value)} alt="" />
      <span>{model?.label || value}</span>
    </span>
  );
}

const defaultParams: ChatParams = {
  temperature: 1,
  maxTokens: 1024,
  topP: 1,
  seed: '',
  stopSequence: '',
};

const mockReplies = [
  '可以。当前模型服务已接入推理网关，我会根据你的问题生成结构化回答，并在需要时保留上下文继续追问。',
  '从平台视角看，文本模型体验主要用于验证服务可用性、输出质量、首 token 延迟以及流式响应稳定性。',
  '如果要进一步定位问题，可以同时查看模型监控中的 TTFT、OTPS、TPM、RPM 和失败率指标。',
  '这个请求已经完成。你可以继续输入问题，或切换到多模型对比查看不同服务的回答差异。',
];

const quickTemplates = [
  {
    icon: <BulbOutlined />,
    title: '逻辑推理',
    desc: '一个房间里有3盏灯，门外有3个开关。你只能进房间一次，如何确定...',
    prompt: '一个房间里有3盏灯，门外有3个开关，每个开关控制一盏灯。你只能进房间一次，如何确定每个开关分别控制哪盏灯？请详细说明你的推理过程。',
  },
  {
    icon: <CodeOutlined />,
    title: '代码生成',
    desc: '用 Python 实现一个高性能的 LRU 缓存，支持并发访问',
    prompt: '请用 Python 实现一个线程安全的 LRU 缓存类，要求支持 get 和 put 操作，时间复杂度 O(1)，支持容量淘汰，并附带使用示例。',
  },
  {
    icon: <TranslationOutlined />,
    title: '长文摘要',
    desc: '将一篇技术文章压缩为结构化的要点摘要',
    prompt: '请帮我将以下内容总结为一份结构化的技术摘要，包含核心观点、关键数据、技术方案、优缺点分析。',
  },
  {
    icon: <ExperimentOutlined />,
    title: '数学计算',
    desc: '求解一道涉及概率和期望的数学问题',
    prompt: '一个袋子里有5个红球和3个蓝球。每次随机取出一个球记录颜色后放回，重复取4次。求恰好取到2个红球的概率、红球个数的期望值，以及不放回时的概率。',
  },
];

function buildCode(model: string, inputValue: string, params: ChatParams) {
  return `curl -v http://api.ataas.local/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "accept: text/event-stream" \\
  -H "Authorization: Bearer {YOUR_API_KEY}" \\
  -d '{
    "model": "${model || '{MODEL_NAME}'}",
    "stream": true,
    "temperature": ${params.temperature},
    "top_p": ${params.topP},
    "max_tokens": ${params.maxTokens},
    "messages": [
      {
        "role": "user",
        "content": "${inputValue || '你好，请介绍一下当前模型服务'}"
      }
    ]
  }'`;
}

function splitReply(content: string) {
  const parts: string[] = [];
  for (let index = 0; index < content.length; index += 4) {
    parts.push(content.slice(index, index + 4));
  }
  return parts;
}

function ParameterControl({
  label,
  tip,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  tip: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="playground-param-item">
      <div className="playground-param-head">
        <span>{label}<Tooltip title={tip}><i>?</i></Tooltip></span>
        <InputNumber value={value} min={min} max={max} step={step} onChange={(next) => onChange(Number(next || 0))} />
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={'playground-message playground-message-' + message.role}>
      {message.thinkContent && (
        <details className="playground-think" open>
          <summary>已深度思考</summary>
          <div>{message.thinkContent}</div>
        </details>
      )}
      <div className="playground-message-bubble">{message.content}</div>
    </div>
  );
}

function ChatInputBox({
  value,
  pending,
  historyEnabled,
  showHistory,
  onChange,
  onSend,
  onHistoryChange,
}: {
  value: string;
  pending: boolean;
  historyEnabled?: boolean;
  showHistory?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onHistoryChange?: (checked: boolean) => void;
}) {
  return (
    <div className="playground-input-box">
      <Input.TextArea
        value={value}
        placeholder="输入你想问的问题"
        autoSize={{ minRows: 1, maxRows: 4 }}
        variant="borderless"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <div className="playground-input-footer">
        {showHistory && (
          <span className="playground-history-toggle">
            <Switch checked={historyEnabled} onChange={onHistoryChange} size="small" />
            历史对话
          </span>
        )}
        <Tooltip title={pending ? '停止生成' : '发送'}>
          <button className={'playground-send-button' + (value || pending ? ' active' : '')} onClick={onSend}>
            {pending ? <StopOutlined /> : <SendOutlined />}
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

function CodeModal({ open, code, onClose }: { open: boolean; code: string; onClose: () => void }) {
  const handleCopy = async () => {
    await navigator.clipboard?.writeText(code);
    message.success('代码已复制');
  };
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chat-completions.curl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  return (
    <Modal className="playground-code-modal" title="查看代码" open={open} footer={null} width={680} onCancel={onClose}>
      <p>你可以使用以下代码将当前的提示和设置集成到应用程序中。</p>
      <div className="playground-code-block">
        <div>
          <span>Curl</span>
          <Space>
            <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
            <Button type="text" icon={<DownloadOutlined />} onClick={handleDownload}>下载</Button>
          </Space>
        </div>
        <pre>{code}</pre>
      </div>
      <div className="playground-code-tip">
        <a onClick={() => message.info('API 密钥页面暂未接入')}>查看API密钥</a>
        <span>建议使用环境变量或密钥管理工具保存密钥。</span>
      </div>
    </Modal>
  );
}

export default function PlaygroundChatPage() {
  const [activeTab, setActiveTab] = useState<string | number>('chat');
  const [selectedModel, setSelectedModel] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [params, setParams] = useState<ChatParams>(defaultParams);
  const [pending, setPending] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [tps, setTps] = useState(0);
  const [codeOpen, setCodeOpen] = useState(false);
  const [compareInput, setCompareInput] = useState('');
  const [comparePending, setComparePending] = useState(false);
  const [compareMessages, setCompareMessages] = useState<Record<number, ChatMessage[]>>({ 0: [], 1: [], 2: [] });
  const [compareModels, setCompareModels] = useState<Record<number, string>>({ 0: 'deepseek-r1-prod', 1: 'glm-4-air-prod', 2: 'qwen2.5-coder-prod' });
  const [compareParams, setCompareParams] = useState<Record<number, ChatParams>>({ 0: defaultParams, 1: defaultParams, 2: defaultParams });
  const [compareTokens, setCompareTokens] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });
  const [compareTps, setCompareTps] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });
  const [selectedCompareIndex, setSelectedCompareIndex] = useState(0);
  const timers = useRef<number[]>([]);

  const code = useMemo(() => {
    if (activeTab === 'compare') {
      return buildCode(compareModels[selectedCompareIndex], compareInput, compareParams[selectedCompareIndex]);
    }
    return buildCode(selectedModel, inputValue, params);
  }, [activeTab, compareInput, compareModels, compareParams, inputValue, params, selectedCompareIndex, selectedModel]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearInterval(timer));
    timers.current = [];
    setPending(false);
    setComparePending(false);
  };

  useEffect(() => () => clearTimers(), []);

  const streamSingleReply = (reply: string, requestMessages: ChatMessage[]) => {
    const chunks = splitReply(reply);
    let cursor = 0;
    let content = '';
    const thinkContent = reply.includes('监控') ? '正在分析模型服务状态、上下文开关和当前参数设置。' : undefined;
    const timer = window.setInterval(() => {
      content += chunks[cursor] || '';
      cursor += 1;
      setMessages([...requestMessages, { role: 'assistant', content, thinkContent }]);
      setTokens(128 + content.length * 2);
      setTps(Number((18 + cursor * 0.8).toFixed(1)));
      if (cursor >= chunks.length) {
        window.clearInterval(timer);
        setPending(false);
      }
    }, 70);
    timers.current.push(timer);
  };

  const handleSingleSend = () => {
    if (pending) {
      clearTimers();
      return;
    }
    if (!inputValue.trim()) {
      message.error('请输入内容');
      return;
    }
    if (!selectedModel) {
      message.error('请选择模型');
      return;
    }
    const userMessage: ChatMessage = { role: 'user', content: inputValue };
    const nextMessages = [...messages, userMessage];
    const reply = systemPrompt ? `已按系统提示词执行。${mockReplies[(messages.length + selectedModel.length) % mockReplies.length]}` : mockReplies[(messages.length + selectedModel.length) % mockReplies.length];
    setPending(true);
    setMessages(nextMessages);
    setInputValue('');
    streamSingleReply(reply, nextMessages);
  };

  const handleCompareSend = () => {
    if (comparePending) {
      clearTimers();
      return;
    }
    if (!compareInput.trim()) {
      message.error('请输入内容');
      return;
    }
    const activeIndexes = [0, 1, 2].filter((index) => compareModels[index]);
    if (!activeIndexes.length) {
      message.error('请选择模型');
      return;
    }
    setComparePending(true);
    activeIndexes.forEach((index) => {
      const userMessage: ChatMessage = { role: 'user', content: compareInput };
      const baseMessages = [...(compareMessages[index] || []), userMessage];
      setCompareMessages((prev) => ({ ...prev, [index]: baseMessages }));
      const chunks = splitReply(`${compareModels[index]}：${mockReplies[(index + compareInput.length) % mockReplies.length]}`);
      let cursor = 0;
      let content = '';
      const timer = window.setInterval(() => {
        content += chunks[cursor] || '';
        cursor += 1;
        setCompareMessages((prev) => ({ ...prev, [index]: [...baseMessages, { role: 'assistant', content }] }));
        setCompareTokens((prev) => ({ ...prev, [index]: 96 + content.length * 2 }));
        setCompareTps((prev) => ({ ...prev, [index]: Number((16 + cursor * 0.6 + index).toFixed(1)) }));
        if (cursor >= chunks.length) {
          window.clearInterval(timer);
          timers.current = timers.current.filter((item) => item !== timer);
          if (timers.current.length === 0) setComparePending(false);
        }
      }, 70 + index * 15);
      timers.current.push(timer);
    });
    setCompareInput('');
  };

  const renderParameterPanel = (value: ChatParams, onChange: (patch: Partial<ChatParams>) => void) => (
    <div className="playground-param-list">
      <ParameterControl label="Temperature" tip="控制文本生成的随机性" value={value.temperature} min={0} max={2} step={0.1} onChange={(temperature) => onChange({ temperature })} />
      <ParameterControl label="Max Token" tip="生成文本的最大长度" value={value.maxTokens} min={128} max={4096} onChange={(maxTokens) => onChange({ maxTokens })} />
      <ParameterControl label="Top P" tip="控制文本生成的多样性" value={value.topP} min={0} max={1} step={0.1} onChange={(topP) => onChange({ topP })} />
      <div className="playground-param-field"><span>Seed</span><Input value={value.seed} placeholder="请输入 Seed" onChange={(event) => onChange({ seed: event.target.value })} /></div>
      <div className="playground-param-field"><span>Stop Sequence</span><Input value={value.stopSequence} placeholder="请输入 Stop Sequence" onChange={(event) => onChange({ stopSequence: event.target.value })} /></div>
    </div>
  );

  const handleQuickTemplate = (prompt: string) => {
    setInputValue(prompt);
    if (!selectedModel) {
      message.info('请先选择模型');
    }
  };

  return (
    <div className="playground-chat-page">
      {activeTab === 'chat' ? (
        <div className={'playground-home' + (messages.length ? ' has-messages' : '')}>
          <div className="playground-home-center">
            <div className="playground-home-title">
              {messages.length ? '对话' : '欢迎使用'}
              {!messages.length && (
                <Dropdown
                  trigger={['click']}
                  menu={{
                    selectedKeys: selectedModel ? [selectedModel] : [],
                    items: modelOptions.map((item) => ({
                      key: item.value,
                      label: renderPlaygroundModelLabel(item.value),
                    })),
                    onClick: ({ key }) => setSelectedModel(String(key)),
                  }}
                >
                  <button className="playground-title-model-trigger" type="button">
                    {selectedModel ? renderPlaygroundModelLabel(selectedModel, true) : <span>选择模型</span>}
                    <DownOutlined />
                  </button>
                </Dropdown>
              )}
              {!messages.length && '大模型'}
            </div>

            {messages.length > 0 && (
              <div className="playground-reply-card">
                <div className="playground-message-list">
                  {messages.map((item, index) => <ChatBubble key={`${item.role}-${index}`} message={item} />)}
                </div>
              </div>
            )}

            <div className="playground-hero-input">
              <textarea
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSingleSend();
                  }
                }}
                placeholder="在这里输入内容..."
                rows={1}
              />
              <div className="playground-hero-actions">
                <div className="playground-hero-actions-left">
                  <button onClick={() => setActiveTab('compare')}><PlusOutlined /> 对比模型</button>
                  <Popover
                    trigger="click"
                    placement="top"
                    content={(
                      <div className="playground-system-popover">
                        <div>设定模型角色或行为规则</div>
                        <textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} placeholder="例: 你是一位资深的 Python 开发工程师..." rows={3} />
                      </div>
                    )}
                  >
                    <button className={systemPrompt ? 'active' : ''}><FileTextOutlined /> 系统提示词{systemPrompt ? ' ✓' : ''}</button>
                  </Popover>
                  <Popover trigger="click" placement="top" content={<div className="playground-param-popover"><ParameterControl label="Temperature" tip="控制文本生成的随机性" value={params.temperature} min={0} max={2} step={0.1} onChange={(temperature) => setParams((prev) => ({ ...prev, temperature }))} /></div>}>
                    <button>Temperature {params.temperature}</button>
                  </Popover>
                  <Popover trigger="click" placement="top" content={<div className="playground-param-popover"><ParameterControl label="Max Tokens" tip="生成文本的最大长度" value={params.maxTokens} min={128} max={32768} step={128} onChange={(maxTokens) => setParams((prev) => ({ ...prev, maxTokens }))} /></div>}>
                    <button>MaxTokens {params.maxTokens}</button>
                  </Popover>
                  <Popover trigger="click" placement="top" content={<div className="playground-param-popover"><ParameterControl label="Top P" tip="控制文本生成的多样性" value={params.topP} min={0} max={1} step={0.1} onChange={(topP) => setParams((prev) => ({ ...prev, topP }))} /></div>}>
                    <button>TopP {params.topP}</button>
                  </Popover>
                  {messages.length > 0 && !pending && <button onClick={() => setMessages([])}><DeleteOutlined /> 清空</button>}
                  <button onClick={() => setCodeOpen(true)}><CodeOutlined /> API调用</button>
                </div>
                <div className="playground-hero-actions-right">
                  <span>{inputValue.length}/32000</span>
                  <button className={'playground-hero-send' + (inputValue.trim() || pending ? ' active' : '')} onClick={handleSingleSend}>
                    {pending ? '■' : <ArrowUpOutlined />}
                  </button>
                </div>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="playground-home-stats">
                <span>Token {tokens}</span>
                <span>{tps} t/s</span>
                {pending && <span>生成中...</span>}
              </div>
            )}

            {messages.length === 0 && (
              <div className="playground-quick-tasks">
                <div className="playground-quick-hint">选择模板，一键体验</div>
                <div className="playground-quick-grid">
                  {quickTemplates.map((item) => (
                    <div key={item.title} className="playground-quick-card" onClick={() => handleQuickTemplate(item.prompt)}>
                      <div className="playground-quick-card-icon">{item.icon}</div>
                      <div className="playground-quick-card-title">{item.title}</div>
                      <div className="playground-quick-card-desc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="playground-compare-layout">
          <div className="playground-compare-head">
            <h1>模型对比</h1>
            <Button onClick={() => setActiveTab('chat')}>返回对话</Button>
          </div>
          <div className="playground-compare-grid">
            {[0, 1, 2].map((index) => (
              <section key={index} className="playground-compare-card">
                <div className="playground-compare-card-head">
                  <Select
                    value={compareModels[index]}
                    allowClear
                    onChange={(value) => setCompareModels((prev) => ({ ...prev, [index]: value }))}
                    options={modelOptions}
                    placeholder="请选择模型"
                    optionRender={(option) => renderPlaygroundModelLabel(String(option.value))}
                    labelRender={({ value }) => renderPlaygroundModelLabel(value ? String(value) : undefined)}
                  />
                  <Space>
                    <Dropdown menu={{ items: [
                      { key: 'clear', label: '清除', icon: <DeleteOutlined />, onClick: () => setCompareMessages((prev) => ({ ...prev, [index]: [] })) },
                      { key: 'code', label: '查看代码', icon: <CodeOutlined />, onClick: () => { setSelectedCompareIndex(index); setCodeOpen(true); } },
                    ] }} trigger={['click']} placement="bottomRight">
                      <Button type="text" icon={<MoreOutlined />} />
                    </Dropdown>
                    <Popover trigger="click" placement="bottomRight" content={renderParameterPanel(compareParams[index], (patch) => setCompareParams((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } })))}>
                      <Button type="text" icon={<SettingOutlined />} />
                    </Popover>
                  </Space>
                </div>
                <div className="playground-compare-messages">
                  {(compareMessages[index] || []).length === 0 ? <div className="playground-empty compact">等待输入</div> : (compareMessages[index] || []).map((item, messageIndex) => <ChatBubble key={`${index}-${messageIndex}`} message={item} />)}
                </div>
                <div className="playground-stats compact">Token 使用量: {compareTokens[index]} <span /> 当前输出速度: {compareTps[index]} tokens / s</div>
              </section>
            ))}
          </div>
          <ChatInputBox value={compareInput} pending={comparePending} showHistory={false} onChange={setCompareInput} onSend={handleCompareSend} />
        </div>
      )}
      <CodeModal open={codeOpen} code={code} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
