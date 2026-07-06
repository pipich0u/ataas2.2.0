import {
  ArrowUpOutlined,
  BulbOutlined,
  CodeOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlusOutlined,
  SendOutlined,
  SettingOutlined,
  StopOutlined,
  SwapRightOutlined,
  ToolOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { Button, Drawer, Dropdown, Input, InputNumber, Modal, Popover, Select, Slider, Space, Switch, Tag, Tooltip, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import qwenLogo from '../qwen-logo.svg';
import { MOCK_DEPLOY_DATA } from './deployList';
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

const modelOptions = MOCK_DEPLOY_DATA
  .filter((item) => item.status === 'running')
  .map((item) => ({
    label: item.name,
    value: item.name,
    desc: `${item.modelInfo.name} / ${item.modelInfo.engine || '-'} ${item.modelInfo.engineVersion || ''}`.trim(),
    logo: item.logo,
  }));

function getPlaygroundModelLogo(value?: string) {
  const lowerValue = (value || '').toLowerCase();
  if (lowerValue.includes('deepseek')) return deepseekLogo;
  const deployModel = modelOptions.find((item) => item.value === value);
  if (deployModel?.logo) return deployModel.logo;
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

function CodeModal({ open, model, httpCode, params, onClose }: { open: boolean; model: string; httpCode: string; params: ChatParams; onClose: () => void }) {
  const modelName = modelOptions.find((item) => item.value === model)?.label || model || 'deepseek-r1-prod';
  const pythonCode = `# 请安装 OpenAI SDK： pip install openai
# apiKey 获取地址：控制台 API Key 页面

from openai import OpenAI

client = OpenAI(
    base_url="https://api.ataas.local/v1",
    api_key="YOUR_API_KEY",
)

response = client.chat.completions.create(
    model="${modelName}",
    messages=[],
    temperature=${params.temperature},
    top_p=${params.topP},
    max_tokens=${params.maxTokens},
)

print(response)`;

  const handleCopy = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    message.success('代码已复制');
  };
  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const CodeBlock = ({ title, lang, text, filename }: { title: string; lang: string; text: string; filename: string }) => (
    <section className="playground-code-section">
      <h3>{title}</h3>
      <div className="playground-code-block">
        <div>
          <span>{lang}</span>
          <Space>
            <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(text)} />
            <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownload(text, filename)} />
          </Space>
        </div>
        <pre>{text}</pre>
      </div>
    </section>
  );
  return (
    <Modal className="playground-code-modal" title={null} open={open} footer={null} width={720} onCancel={onClose}>
      <div className="playground-code-head">
        <h2>查看代码</h2>
        <p>你可以复制以下代码在本地或其他环境中使用，请使用合理方式确保 key 的安全性。</p>
      </div>
      <div className="playground-code-model-card">
        {renderPlaygroundModelLabel(model || 'deepseek-r1-prod')}
      </div>
      <CodeBlock title="OpenAI SDK:" lang="Python" text={pythonCode} filename="chat-completions.py" />
      <CodeBlock title="HTTP API:" lang="Curl" text={httpCode} filename="chat-completions.curl" />
    </Modal>
  );
}

export default function PlaygroundChatPage() {
  const [activeTab, setActiveTab] = useState<string | number>('chat');
  const [selectedModel, setSelectedModel] = useState('deepseek-r1-prod');
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
  const [comparePickerOpen, setComparePickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'single' | 'compare'>('compare');
  const [comparePickerSearch, setComparePickerSearch] = useState('');
  const [comparePickerSelected, setComparePickerSelected] = useState<string[]>(['deepseek-r1-prod']);
  const [debugDrawerOpen, setDebugDrawerOpen] = useState(false);
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

  const handleCompareTemplate = (prompt: string) => {
    setCompareInput(prompt);
  };

  const openComparePicker = () => {
    setPickerMode('compare');
    setComparePickerSelected(Object.values(compareModels).filter(Boolean).slice(0, 3));
    setComparePickerOpen(true);
  };

  const openSingleModelPicker = () => {
    setPickerMode('single');
    setComparePickerSelected(selectedModel ? [selectedModel] : []);
    setComparePickerOpen(true);
  };

  const confirmComparePicker = () => {
    if (!comparePickerSelected.length) {
      message.error('请选择至少一个服务');
      return;
    }
    if (pickerMode === 'single') {
      setSelectedModel(comparePickerSelected[0]);
      setComparePickerOpen(false);
      return;
    }
    const next = comparePickerSelected.slice(0, 3);
    setCompareModels({ 0: next[0] || '', 1: next[1] || '', 2: next[2] || '' });
    setCompareMessages({ 0: [], 1: [], 2: [] });
    setComparePickerOpen(false);
    setActiveTab('compare');
  };

  return (
    <div className="playground-chat-page">
      {activeTab === 'chat' && (
        <div className="playground-topbar">
          <h1>文本模型</h1>
          <div className="playground-topbar-actions">
            <Button type="text" icon={<CodeOutlined />} onClick={() => setCodeOpen(true)}>查看代码</Button>
            <Button type="text" onClick={openComparePicker}>模型服务对比（1/3）</Button>
          </div>
        </div>
      )}
      {activeTab === 'chat' ? (
        <div className={'playground-home' + (messages.length ? ' has-messages' : '')}>
          <div className="playground-home-center">
            {!messages.length && (
              <div className="playground-model-strip">
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
                  <button className="playground-model-strip-trigger" type="button">
                    {selectedModel ? renderPlaygroundModelLabel(selectedModel) : renderPlaygroundModelLabel('deepseek-r1-prod')}
                  </button>
                </Dropdown>
                <div className="playground-model-strip-actions">
                  <Tooltip title="切换模型"><button onClick={openSingleModelPicker}><SwapRightOutlined /></button></Tooltip>
                  <Tooltip title="调试"><button onClick={() => setDebugDrawerOpen(true)}><ToolOutlined /></button></Tooltip>
                </div>
              </div>
            )}
            <div className="playground-home-title">
              {messages.length ? '对话' : `你好，我是${modelOptions.find((item) => item.value === (selectedModel || 'deepseek-r1-prod'))?.label || 'DeepSeek-R1'}模型`}
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
                  {messages.length > 0 && !pending && <button onClick={() => setMessages([])}><DeleteOutlined /> 清空</button>}
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
            <Space>
              <Button onClick={openComparePicker}>添加服务</Button>
              <Button onClick={() => setActiveTab('chat')}>返回对话</Button>
            </Space>
          </div>
          <div className="playground-compare-grid">
            {[0, 1, 2].filter((index) => compareModels[index]).map((index) => (
              <section key={index} className="playground-compare-card">
                <div className="playground-compare-card-head">
                  {renderPlaygroundModelLabel(compareModels[index])}
                  <Space>
                    <Popover trigger="click" placement="bottomRight" content={renderParameterPanel(compareParams[index], (patch) => setCompareParams((prev) => ({ ...prev, [index]: { ...prev[index], ...patch } })))}>
                      <Button type="text" icon={<SettingOutlined />} />
                    </Popover>
                    <Button type="text" icon={<CodeOutlined />} onClick={() => { setSelectedCompareIndex(index); setCodeOpen(true); }} />
                    <Button type="text" icon={<DeleteOutlined />} onClick={() => setCompareModels((prev) => ({ ...prev, [index]: '' }))} />
                  </Space>
                </div>
                <div className="playground-compare-welcome">
                  {(compareMessages[index] || []).length === 0 ? (
                    <>
                      <h2>你好，我是{modelOptions.find((item) => item.value === compareModels[index])?.label || compareModels[index]}模型</h2>
                    </>
                  ) : (
                    <div className="playground-compare-messages">
                      {(compareMessages[index] || []).map((item, messageIndex) => <ChatBubble key={`${index}-${messageIndex}`} message={item} />)}
                    </div>
                  )}
                </div>
                <div className="playground-stats compact">Token 使用量: {compareTokens[index]} <span /> 当前输出速度: {compareTps[index]} tokens / s</div>
              </section>
            ))}
          </div>
          <div className="playground-compare-composer">
            <div className="playground-hero-input playground-compare-hero-input">
              <textarea
                value={compareInput}
                onChange={(event) => setCompareInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleCompareSend();
                  }
                }}
                placeholder="输入你想问的问题"
                rows={1}
              />
              <div className="playground-hero-actions">
                <div className="playground-hero-actions-left" />
                <div className="playground-hero-actions-right">
                  <span>{compareInput.length}/32000</span>
                  <button className={'playground-hero-send' + (compareInput.trim() || comparePending ? ' active' : '')} onClick={handleCompareSend}>
                    {comparePending ? '■' : <ArrowUpOutlined />}
                  </button>
                </div>
              </div>
            </div>
            <div className="playground-quick-tasks playground-compare-quick-tasks">
              <div className="playground-quick-hint">选择模板，一键体验</div>
              <div className="playground-quick-grid">
                {quickTemplates.map((item) => (
                  <div key={item.title} className="playground-quick-card" onClick={() => handleCompareTemplate(item.prompt)}>
                    <div className="playground-quick-card-icon">{item.icon}</div>
                    <div className="playground-quick-card-title">{item.title}</div>
                    <div className="playground-quick-card-desc">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <Drawer
        title="调试"
        open={debugDrawerOpen}
        onClose={() => setDebugDrawerOpen(false)}
        width={420}
        className="playground-debug-drawer"
      >
        <div className="playground-debug-form">
          <div className="playground-debug-field">
            <span>系统提示词</span>
            <Input.TextArea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="例：你是一位资深的 Python 开发工程师..."
              rows={5}
            />
          </div>
          <ParameterControl label="Temperature" tip="控制文本生成的随机性" value={params.temperature} min={0} max={2} step={0.1} onChange={(temperature) => setParams((prev) => ({ ...prev, temperature }))} />
          <ParameterControl label="Max Tokens" tip="生成文本的最大长度" value={params.maxTokens} min={128} max={32768} step={128} onChange={(maxTokens) => setParams((prev) => ({ ...prev, maxTokens }))} />
          <ParameterControl label="Top P" tip="控制文本生成的多样性" value={params.topP} min={0} max={1} step={0.1} onChange={(topP) => setParams((prev) => ({ ...prev, topP }))} />
          <div className="playground-debug-actions">
            <Button type="primary" onClick={() => { setDebugDrawerOpen(false); message.success('调试参数已应用'); }}>应用</Button>
          </div>
        </div>
      </Drawer>
      <Modal
        className="playground-service-modal"
        title={pickerMode === 'single' ? '切换模型' : '添加服务'}
        open={comparePickerOpen}
        onCancel={() => setComparePickerOpen(false)}
        width={860}
        footer={(
          <div className="playground-service-footer">
            <div className="playground-service-selected">
              <span>已选：{comparePickerSelected.length}</span>
              {comparePickerSelected.map((value) => (
                <Tag key={value} closable onClose={() => setComparePickerSelected((prev) => prev.filter((item) => item !== value))}>
                  {modelOptions.find((item) => item.value === value)?.label || value}
                </Tag>
              ))}
            </div>
            <Space>
              <Button onClick={() => setComparePickerOpen(false)}>取消</Button>
              <Button type="primary" onClick={confirmComparePicker}>{pickerMode === 'single' ? '确定' : '立即体验'}</Button>
            </Space>
          </div>
        )}
      >
        <div className="playground-service-search">
          <Input.Search placeholder="搜索服务名称" value={comparePickerSearch} onChange={(event) => setComparePickerSearch(event.target.value)} allowClear />
        </div>
        <div className="playground-service-picker">
          <div className="playground-service-list">
            <div className="playground-service-title">模型服务</div>
            {modelOptions.filter((item) => {
              const matchesSearch = !comparePickerSearch || item.label.toLowerCase().includes(comparePickerSearch.toLowerCase()) || item.desc.toLowerCase().includes(comparePickerSearch.toLowerCase());
              const checked = comparePickerSelected.includes(item.value);
              const maxCount = pickerMode === 'single' ? 1 : 3;
              return matchesSearch && (checked || comparePickerSelected.length < maxCount);
            }).map((item) => {
              const checked = comparePickerSelected.includes(item.value);
              return (
                <button key={item.value} className={'playground-service-row' + (checked ? ' checked' : '')} onClick={() => {
                  setComparePickerSelected((prev) => checked ? prev.filter((value) => value !== item.value) : pickerMode === 'single' ? [item.value] : [...prev, item.value].slice(0, 3));
                }}>
                  {renderPlaygroundModelLabel(item.value)}
                  <span>{item.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="playground-service-selected-panel">
            <div className="playground-service-title">已选服务</div>
            {comparePickerSelected.length === 0 ? (
              <div className="playground-service-empty">从左侧选择模型服务，{pickerMode === 'single' ? '选择 1 个' : '最多可选择 3 个'}</div>
            ) : comparePickerSelected.map((value) => (
              <button key={value} className="playground-service-selected-row" onClick={() => setComparePickerSelected((prev) => prev.filter((item) => item !== value))}>
                {renderPlaygroundModelLabel(value)}
                <span>移除</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>
      <CodeModal open={codeOpen} model={activeTab === 'compare' ? compareModels[selectedCompareIndex] : selectedModel} httpCode={code} params={activeTab === 'compare' ? compareParams[selectedCompareIndex] : params} onClose={() => setCodeOpen(false)} />
    </div>
  );
}
