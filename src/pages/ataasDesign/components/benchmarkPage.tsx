import { CheckCircleOutlined, DownloadOutlined, EyeOutlined, LoadingOutlined, PlusOutlined, ReloadOutlined, SettingOutlined, StopOutlined } from '@ant-design/icons';
import { Alert, Badge, Button, Checkbox, Collapse, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Popover, Select, Space, Switch, Table, Tabs, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import deepseekLogo from '../deepseek-logo.svg';
import glmLogo from '../glm-logo.svg';
import qwenLogo from '../qwen-logo.svg';
import './benchmarkPage.less';

type BenchmarkMode = 'custom' | 'max_concurrency' | 'matrix';
type BenchmarkStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped';
type BenchmarkRoundResult = {
  round_index: number;
  group_key?: string;
  search_phase?: 'coarse' | 'refine';
  params: Record<string, any>;
  metrics: Record<string, any>;
  throughput_growth_ratio?: number;
  bottleneck_reason?: string;
  raw_metrics?: Record<string, any>;
};
type BenchmarkTask = {
  id: number;
  task_name: string;
  model_id: number;
  model_name?: string;
  service_name?: string;
  benchmark_mode: BenchmarkMode;
  status: BenchmarkStatus;
  parallel: number;
  number: number;
  input_length: number;
  output_length: number;
  stream: boolean;
  dataset: string;
  extra_args: Record<string, any>;
  evalscope_args: Record<string, any>;
  matrix_config: Record<string, any>;
  threshold_config: Record<string, any>;
  round_results: BenchmarkRoundResult[];
  current_round: number;
  total_rounds: number;
  max_acceptable_parallel?: number;
  bottleneck_reason?: string;
  avg_ttft_ms?: number;
  avg_tpot_ms?: number;
  avg_e2e_ms?: number;
  p95_e2e_ms?: number;
  throughput?: number;
  output_throughput?: number;
  total_requests?: number;
  failed_requests?: number;
  error_rate?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  completed_at?: string;
  error_message?: string;
};

const statusMap: Record<BenchmarkStatus, { text: string; badge: 'default' | 'processing' | 'success' | 'error' | 'warning' }> = {
  pending: { text: '等待中', badge: 'default' },
  running: { text: '运行中', badge: 'processing' },
  completed: { text: '已完成', badge: 'success' },
  failed: { text: '失败', badge: 'error' },
  stopped: { text: '已停止', badge: 'warning' },
};

const modeMap: Record<BenchmarkMode, string> = {
  custom: '自定义压测',
  max_concurrency: '最大并发',
  matrix: '全矩阵',
};

const finalStatuses: BenchmarkStatus[] = ['completed', 'failed', 'stopped'];
const defaultDetailFields = ['input_length', 'output_length', 'parallel', 'round_avg_tps', 'avg_tpot_s', 'avg_ttft_s', 'output_throughput', 'throughput', 'time_taken_s', 'error_rate', 'bottleneck_reason'];
const requiredDetailFields = ['input_length', 'output_length', 'parallel', 'avg_tpot_s', 'avg_ttft_s'];
const modelOptions = [
  { id: 1, name: 'deepseek-r1-prod', display_model_name: 'DeepSeek-R1-671B', service_name: 'deepseek-r1-prod' },
  { id: 2, name: 'glm-4-air-prod', display_model_name: 'GLM-4-Air', service_name: 'glm-4-air-prod' },
  { id: 3, name: 'qwen2.5-coder-prod', display_model_name: 'Qwen2.5-Coder-32B', service_name: 'qwen2.5-coder-prod' },
];

function getBenchmarkModelLogo(name?: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('glm') || lower.includes('chatglm')) return glmLogo;
  if (lower.includes('qwen') || lower.includes('通义')) return qwenLogo;
  return deepseekLogo;
}

function renderBenchmarkStatus(value: BenchmarkStatus) {
  if (value === 'completed') {
    return <span className="benchmark-status benchmark-status-completed"><CheckCircleOutlined />已完成</span>;
  }
  if (value === 'running') {
    return <span className="benchmark-status benchmark-status-running"><LoadingOutlined />运行中</span>;
  }
  if (value === 'failed') {
    return <span className="benchmark-status benchmark-status-failed">失败</span>;
  }
  if (value === 'stopped') {
    return <span className="benchmark-status benchmark-status-stopped">已停止</span>;
  }
  return <span className="benchmark-status benchmark-status-pending">等待中</span>;
}

function parseNumberList(value?: string) {
  return (value || '').split(',').map((item) => Number(item.trim())).filter((item) => Number.isFinite(item) && item > 0);
}

function buildGeometricList(start?: number, max?: number, multiplier?: number) {
  const first = Math.max(1, Number(start || 1));
  const last = Math.max(first, Number(max || first));
  const factor = Number(multiplier || 2) > 1 ? Number(multiplier || 2) : 2;
  const values = [Math.floor(first)];
  let current = Math.floor(first);
  while (current < last) {
    current = Math.min(Math.max(Math.floor(current * factor), current + 1), Math.floor(last));
    values.push(current);
  }
  return Array.from(new Set(values));
}

function buildAxisList(values: any, prefix: string, listField: string) {
  if (values[`${prefix}_generation_mode`] === 'geometric') {
    return buildGeometricList(values[`${prefix}_generation_start`], values[`${prefix}_generation_max`], values[`${prefix}_generation_multiplier`]);
  }
  return parseNumberList(values[listField]);
}

function parseJsonObject(value?: string, label = 'JSON') {
  if (!value?.trim()) return {};
  const parsed = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error(`${label} 必须是对象`);
  return parsed;
}

function compactObject(value: Record<string, any>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== ''));
}

function formatNumber(value?: number, digits = 2) {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  return Number(value).toFixed(digits);
}

function formatPercent(value?: number, digits = 2) {
  if (value === undefined || value === null || !Number.isFinite(value)) return '-';
  return `${formatNumber(value * 100, digits)}%`;
}

function numericMetric(record: BenchmarkRoundResult, ...keys: string[]) {
  const sources = [record.metrics, record.raw_metrics, record.raw_metrics?.summary, record.raw_metrics?.cache_metrics].filter(Boolean) as Record<string, any>[];
  for (const source of sources) {
    for (const key of keys) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function roundAvgTps(record: BenchmarkRoundResult) {
  const direct = numericMetric(record, 'avg_tps');
  if (direct !== undefined) return direct;
  const tpotMs = numericMetric(record, 'avg_tpot_ms');
  return tpotMs && tpotMs > 0 ? 1000 / tpotMs : undefined;
}

function outputTokenThroughput(record: BenchmarkRoundResult) {
  const direct = numericMetric(record, 'output_throughput');
  if (direct !== undefined) return direct;
  const requestThroughput = numericMetric(record, 'throughput');
  const outputTokens = numericMetric(record, 'avg_output_tokens');
  return requestThroughput !== undefined && outputTokens !== undefined ? requestThroughput * outputTokens : undefined;
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '-';
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainSeconds = totalSeconds % 60;
  return [hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${remainSeconds}s`].filter(Boolean).join(' ');
}

function escapeHtml(value: unknown) {
  return String(value ?? '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function downloadHtmlExcel(filename: string, html: string) {
  const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildMockRound(roundIndex: number, params: Record<string, any>): BenchmarkRoundResult {
  const parallel = Number(params.parallel || 1);
  const input = Number(params.input_length || 1024);
  const output = Number(params.output_length || 512);
  const avgTpotMs = Math.max(8, 28 + parallel * 0.7 + output / 120 - roundIndex * 0.6);
  const throughput = Math.max(0.1, parallel / Math.max(avgTpotMs / 1000 + input / 20000, 0.1));
  const outputThroughput = throughput * Math.min(output, 768);
  const failedRequests = parallel > 64 ? Math.ceil(parallel / 32) : 0;
  return {
    round_index: roundIndex,
    group_key: `${input}/${output}`,
    search_phase: roundIndex % 3 === 0 ? 'refine' : 'coarse',
    params,
    metrics: {
      avg_tps: 1000 / avgTpotMs,
      avg_tpot_ms: avgTpotMs,
      avg_ttft_ms: 180 + input / 7 + parallel * 8,
      output_throughput: outputThroughput,
      throughput,
      time_taken_s: Math.max(12, Number(params.number || 1000) / Math.max(throughput, 1)),
      avg_e2e_ms: 600 + input / 2 + output * 9,
      avg_input_tokens: input,
      avg_output_tokens: output,
      total_requests: params.number || 1000,
      failed_requests: failedRequests,
      error_rate: failedRequests / Math.max(Number(params.number || 1000), 1),
      actual_cache_hit_rate: params.cache_config ? 0.68 + roundIndex * 0.01 : undefined,
    },
    throughput_growth_ratio: roundIndex === 1 ? undefined : Math.max(0.02, 0.22 - roundIndex * 0.025),
    bottleneck_reason: parallel > 64 ? 'TTFT 超过阈值' : undefined,
  };
}

function buildMockTask(values: any, id: number): BenchmarkTask {
  const model = modelOptions.find((item) => item.id === values.model_id) || modelOptions[0];
  const mode = values.benchmark_mode as BenchmarkMode;
  const dataset = values.kv_cache_enabled ? 'custom' : values.dataset || 'random';
  const extraArgs = parseJsonObject(values.extra_args_text, '请求附加参数');
  const evalscopeArgs = parseJsonObject(values.evalscope_args_text, 'EvalScope 参数');
  const cacheConfig = values.kv_cache_enabled ? compactObject({
    enabled: true,
    target_cache_hit_rate: values.kv_target_cache_hit_rate,
    min_shared_prefix_tokens: values.kv_min_shared_prefix_tokens,
    cache_warmup: values.kv_cache_warmup,
    metrics_url: values.kv_metrics_url,
  }) : undefined;
  const thresholdConfig = compactObject({
    min_avg_tps: values.threshold_min_avg_tps,
    max_avg_ttft_ms: values.threshold_max_avg_ttft_ms,
    min_total_token_throughput_growth_ratio: values.threshold_min_total_token_throughput_growth_ratio,
  });
  let rounds: BenchmarkRoundResult[] = [];
  let matrixConfig: Record<string, any> = {};
  if (mode === 'custom') {
    rounds = [buildMockRound(1, { input_length: values.input_length, output_length: values.output_length, parallel: values.parallel, number: values.number, stream: values.stream, dataset, cache_config: cacheConfig })];
  }
  if (mode === 'max_concurrency') {
    const parallel = buildAxisList(values, 'parallel', 'parallel_list');
    matrixConfig = { parallel, number: values.number, input_length: values.input_length, output_length: values.output_length, stream: values.stream, dataset, refine_concurrency: values.refine_concurrency, refine_precision: values.refine_precision, cache_config: cacheConfig };
    rounds = parallel.map((item, index) => buildMockRound(index + 1, { input_length: values.input_length, output_length: values.output_length, parallel: item, number: values.number, stream: values.stream, dataset, cache_config: cacheConfig }));
  }
  if (mode === 'matrix') {
    const parallel = buildAxisList(values, 'matrix_parallel', 'matrix_parallel_list');
    const inputLength = buildAxisList(values, 'matrix_input', 'matrix_input_length_list');
    const outputLength = parseNumberList(values.matrix_output_length_list);
    matrixConfig = { parallel, input_length: inputLength, output_length: outputLength, number: values.number, stream: values.stream, dataset, refine_concurrency: values.refine_concurrency, refine_precision: values.refine_precision, cache_config: cacheConfig };
    inputLength.forEach((input) => outputLength.forEach((output) => parallel.forEach((parallelItem) => {
      rounds.push(buildMockRound(rounds.length + 1, { input_length: input, output_length: output, parallel: parallelItem, number: values.number, stream: values.stream, dataset, cache_config: cacheConfig }));
    })));
  }
  const completed = mode === 'custom';
  const first = rounds[0];
  const last = rounds[rounds.length - 1];
  return {
    id,
    task_name: values.task_name || `压测任务-${id}`,
    model_id: model.id,
    model_name: model.display_model_name,
    service_name: model.service_name,
    benchmark_mode: mode,
    status: completed ? 'completed' : 'running',
    parallel: first?.params.parallel || values.parallel || 1,
    number: values.number || 1000,
    input_length: first?.params.input_length || values.input_length || 1024,
    output_length: first?.params.output_length || values.output_length || 512,
    stream: Boolean(values.stream),
    dataset,
    extra_args: extraArgs,
    evalscope_args: evalscopeArgs,
    matrix_config: matrixConfig,
    threshold_config: thresholdConfig,
    round_results: completed ? rounds : rounds.slice(0, Math.max(1, Math.ceil(rounds.length * 0.35))),
    current_round: completed ? rounds.length : Math.max(1, Math.ceil(rounds.length * 0.35)),
    total_rounds: rounds.length,
    max_acceptable_parallel: mode === 'custom' ? undefined : Math.min(64, Math.max(...rounds.map((row) => Number(row.params.parallel || 1)))),
    bottleneck_reason: last?.bottleneck_reason,
    avg_ttft_ms: first?.metrics.avg_ttft_ms,
    avg_tpot_ms: first?.metrics.avg_tpot_ms,
    avg_e2e_ms: first?.metrics.avg_e2e_ms,
    p95_e2e_ms: first?.metrics.avg_e2e_ms ? first.metrics.avg_e2e_ms * 1.25 : undefined,
    throughput: first?.metrics.throughput,
    output_throughput: first?.metrics.output_throughput,
    total_requests: values.number,
    failed_requests: first?.metrics.failed_requests,
    error_rate: first?.metrics.error_rate,
    created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    created_by: values.created_by || 'admin',
    completed_at: completed ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
  };
}

function withBenchmarkStatus(task: BenchmarkTask, status: BenchmarkStatus, currentRound?: number): BenchmarkTask {
  const nextRound = currentRound ?? task.current_round;
  return {
    ...task,
    status,
    current_round: nextRound,
    round_results: task.round_results.slice(0, Math.max(1, Math.min(nextRound, task.total_rounds))),
    completed_at: finalStatuses.includes(status) ? task.completed_at || dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
  };
}

function buildBenchmarkReportHtml(task: BenchmarkTask) {
  const rows = task.round_results.length ? task.round_results : [];
  return `<html><head><meta charset="UTF-8" /></head><body><h1>压测报告 #${task.id}</h1><table border="1"><tbody><tr><th>模型</th><td>${escapeHtml(task.model_name)}</td></tr><tr><th>模式</th><td>${escapeHtml(modeMap[task.benchmark_mode])}</td></tr><tr><th>状态</th><td>${escapeHtml(statusMap[task.status].text)}</td></tr></tbody></table><h2>轮次结果</h2><table border="1"><thead><tr><th>输入</th><th>输出</th><th>并发</th><th>Avg TPS</th><th>TPOT(ms)</th><th>TTFT(ms)</th><th>吞吐(tok/s)</th><th>错误率</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.params.input_length)}</td><td>${escapeHtml(row.params.output_length)}</td><td>${escapeHtml(row.params.parallel)}</td><td>${escapeHtml(formatNumber(roundAvgTps(row), 4))}</td><td>${escapeHtml(formatNumber(numericMetric(row, 'avg_tpot_ms'), 2))}</td><td>${escapeHtml(formatNumber(numericMetric(row, 'avg_ttft_ms'), 2))}</td><td>${escapeHtml(formatNumber(outputTokenThroughput(row), 2))}</td><td>${escapeHtml(formatPercent(row.metrics.error_rate, 4))}</td></tr>`).join('')}</tbody></table></body></html>`;
}

export default function BenchmarkPage() {
  const [form] = Form.useForm();
  const mode = Form.useWatch('benchmark_mode', form) as BenchmarkMode;
  const kvCacheEnabled = Form.useWatch('kv_cache_enabled', form);
  const inputLength = Form.useWatch('input_length', form);
  const matrixInputLengthList = Form.useWatch('matrix_input_length_list', form);
  const parallelGenerationMode = Form.useWatch('parallel_generation_mode', form);
  const matrixParallelGenerationMode = Form.useWatch('matrix_parallel_generation_mode', form);
  const matrixInputGenerationMode = Form.useWatch('matrix_input_generation_mode', form);
  const kvTargetCacheHitRate = Form.useWatch('kv_target_cache_hit_rate', form);
  const kvMinSharedPrefixTokens = Form.useWatch('kv_min_shared_prefix_tokens', form);
  const [tasks, setTasks] = useState<BenchmarkTask[]>([
    buildMockTask({ task_name: 'DeepSeek 生产服务吞吐压测', model_id: 1, benchmark_mode: 'custom', parallel: 32, number: 1000, input_length: 1024, output_length: 512, stream: true, dataset: 'random', extra_args_text: '{"ignore_eos": true}', evalscope_args_text: '{"warmup_num": 0.1}', created_by: 'admin' }, 1001),
    buildMockTask({ task_name: 'GLM 最大并发探测', model_id: 2, benchmark_mode: 'max_concurrency', parallel_generation_mode: 'geometric', parallel_generation_start: 1, parallel_generation_max: 64, parallel_generation_multiplier: 2, number: 800, input_length: 2048, output_length: 512, stream: true, dataset: 'random', refine_concurrency: true, refine_precision: 1, extra_args_text: '{}', evalscope_args_text: '{}', created_by: 'system' }, 1002),
    buildMockTask({ task_name: 'Qwen 代码模型矩阵压测', model_id: 3, benchmark_mode: 'matrix', matrix_parallel_generation_mode: 'manual', matrix_parallel_list: '4,16,32', matrix_input_generation_mode: 'manual', matrix_input_length_list: '512,2048', matrix_output_length_list: '256,1024', number: 600, stream: true, dataset: 'random', refine_concurrency: false, extra_args_text: '{}', evalscope_args_text: '{}', created_by: 'admin' }, 1003),
    withBenchmarkStatus(buildMockTask({ task_name: 'DeepSeek KV Cache 命中率验证', model_id: 1, benchmark_mode: 'max_concurrency', parallel_generation_mode: 'manual', parallel_list: '8,16,32', number: 500, input_length: 4096, output_length: 256, stream: true, dataset: 'custom', refine_concurrency: true, refine_precision: 1, kv_cache_enabled: true, kv_target_cache_hit_rate: 0.72, kv_min_shared_prefix_tokens: 512, kv_cache_warmup: true, extra_args_text: '{}', evalscope_args_text: '{}', created_by: 'gaohuan' }, 1004), 'stopped', 2),
    withBenchmarkStatus(buildMockTask({ task_name: 'GLM 长上下文稳定性压测', model_id: 2, benchmark_mode: 'matrix', matrix_parallel_generation_mode: 'manual', matrix_parallel_list: '2,8,16', matrix_input_generation_mode: 'manual', matrix_input_length_list: '4096,8192', matrix_output_length_list: '512', number: 300, stream: true, dataset: 'random', refine_concurrency: false, extra_args_text: '{}', evalscope_args_text: '{}', created_by: 'ops' }, 1005), 'failed', 3),
  ]);
  const [status, setStatus] = useState<BenchmarkStatus | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<BenchmarkTask | null>(null);
  const [detailFields, setDetailFields] = useState<string[]>(defaultDetailFields);

  const filteredTasks = useMemo(() => tasks.filter((item) => !status || item.status === status), [tasks, status]);
  const runningCount = useMemo(() => tasks.filter((item) => item.status === 'running' || item.status === 'pending').length, [tasks]);
  const datasetOptions = kvCacheEnabled ? [{ value: 'custom', label: 'custom（KV共享前缀自动生成）' }] : [{ value: 'random', label: 'random' }, { value: 'openqa', label: 'openqa' }];
  const kvCachePreview = useMemo(() => {
    if (!kvCacheEnabled) return undefined;
    const target = Number(kvTargetCacheHitRate || 0);
    const minShared = Number(kvMinSharedPrefixTokens || 128);
    const candidates = mode === 'matrix' ? parseNumberList(matrixInputLengthList) : [Number(inputLength || 0)].filter((item) => Number.isFinite(item) && item > 0);
    const shortestInput = candidates.length ? Math.min(...candidates) : 0;
    if (!shortestInput || !target) return undefined;
    const effectiveShared = Math.min(Math.max(Math.round(shortestInput * target), minShared), Math.max(shortestInput - 1, 0));
    return { shortestInput, minShared, effectiveShared, estimated: shortestInput ? effectiveShared / shortestInput : 0, tooShort: effectiveShared < minShared };
  }, [inputLength, kvCacheEnabled, kvMinSharedPrefixTokens, kvTargetCacheHitRate, matrixInputLengthList, mode]);

  const openCreate = () => {
    form.setFieldsValue({
      task_name: `压测任务-${dayjs().format('MMDD-HHmm')}`,
      model_id: modelOptions[0].id,
      benchmark_mode: 'custom',
      parallel: 32,
      number: 1000,
      input_length: 1024,
      output_length: 512,
      min_prompt_length: 1024,
      max_prompt_length: 1024,
      stream: true,
      dataset: 'random',
      extra_args_text: '{\n  "ignore_eos": true\n}',
      evalscope_args_text: '{\n  "warmup_num": 0.1\n}',
      parallel_generation_mode: 'geometric',
      parallel_generation_start: 1,
      parallel_generation_max: 64,
      parallel_generation_multiplier: 2,
      parallel_list: '1,2,4,8,16,32,64',
      refine_concurrency: true,
      refine_precision: 1,
      matrix_parallel_generation_mode: 'geometric',
      matrix_parallel_generation_start: 1,
      matrix_parallel_generation_max: 64,
      matrix_parallel_generation_multiplier: 2,
      matrix_parallel_list: '1,8,32,64',
      matrix_input_generation_mode: 'manual',
      matrix_input_generation_start: 512,
      matrix_input_generation_max: 4096,
      matrix_input_generation_multiplier: 2,
      matrix_input_length_list: '512,1024,2048',
      matrix_output_length_list: '128,512,1024',
      kv_cache_enabled: false,
      kv_target_cache_hit_rate: 0.7,
      kv_min_shared_prefix_tokens: 128,
      kv_cache_warmup: true,
    });
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      await form.validateFields();
      const next = buildMockTask(form.getFieldsValue(), Date.now());
      setTasks((prev) => [next, ...prev]);
      setCreateOpen(false);
      message.success('压测任务已创建');
    } catch (error: any) {
      if (!error?.errorFields) message.error(error?.message || '创建压测任务失败');
    }
  };

  const handleRefresh = () => {
    setTasks((prev) => prev.map((task) => {
      if (task.status !== 'running') return task;
      const nextRound = Math.min(task.current_round + Math.max(1, Math.ceil(task.total_rounds * 0.2)), task.total_rounds);
      const completed = nextRound >= task.total_rounds;
      const allRows = Array.from({ length: task.total_rounds }, (_, index) => buildMockRound(index + 1, {
        input_length: task.input_length,
        output_length: task.output_length,
        parallel: task.benchmark_mode === 'custom' ? task.parallel : Math.min(2 ** index, 128),
        number: task.number,
        stream: task.stream,
        dataset: task.dataset,
      }));
      const nextTask = { ...task, current_round: nextRound, round_results: allRows.slice(0, nextRound), status: completed ? 'completed' as const : task.status, completed_at: completed ? dayjs().format('YYYY-MM-DD HH:mm:ss') : task.completed_at, updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss') };
      if (detailTask?.id === nextTask.id) setDetailTask(nextTask);
      return nextTask;
    }));
    message.success(runningCount > 0 ? '任务进度已刷新' : '已刷新');
  };

  const handleStop = (task: BenchmarkTask) => {
    const stopped = { ...task, status: 'stopped' as const, completed_at: dayjs().format('YYYY-MM-DD HH:mm:ss') };
    setTasks((prev) => prev.map((item) => (item.id === task.id ? stopped : item)));
    if (detailTask?.id === task.id) setDetailTask(stopped);
    message.success('已停止压测任务');
  };

  const handleDownloadReport = (task: BenchmarkTask) => {
    downloadHtmlExcel(`压测报告_${task.model_name || task.id}_${dayjs().format('YYYYMMDD_HHmmss')}.xls`, buildBenchmarkReportHtml(task));
  };

  const columns: ColumnsType<BenchmarkTask> = [
    { title: '编号', dataIndex: 'id', width: 90, render: (id) => `#${id}` },
    { title: '任务名', dataIndex: 'task_name', width: 180, ellipsis: true, render: (value, record) => value || `压测任务-${record.id}` },
    { title: '模型服务', dataIndex: 'service_name', width: 220, ellipsis: true, render: (_, record) => (
      <span className="benchmark-model-service">
        <img src={getBenchmarkModelLogo(`${record.service_name || ''} ${record.model_name || ''}`)} alt="" />
        <span>
          <b>{record.service_name || record.model_name || '-'}</b>
          <em>{record.model_name || '-'}</em>
        </span>
      </span>
    ) },
    { title: '模式', dataIndex: 'benchmark_mode', width: 120, render: (value: BenchmarkMode) => <Tag>{modeMap[value]}</Tag> },
    { title: '状态', dataIndex: 'status', width: 110, render: renderBenchmarkStatus },
    { title: '创建人', dataIndex: 'created_by', width: 120 },
    { title: '创建时间', dataIndex: 'created_at', width: 180 },
    { title: '操作', width: 168, fixed: 'right', render: (_, record) => (
      <Space className="benchmark-table-actions">
        <Button type="link" onClick={() => setDetailTask(record)}><i><EyeOutlined /></i>详情</Button>
        <Button type="link" onClick={() => handleDownloadReport(record)}><i><DownloadOutlined /></i>导出</Button>
        {!finalStatuses.includes(record.status) && (
          <Popconfirm title="停止压测任务？" okText="停止" cancelText="取消" onConfirm={() => handleStop(record)}>
            <Button type="link" danger><i><StopOutlined /></i>停止</Button>
          </Popconfirm>
        )}
      </Space>
    ) },
  ];

  const detailFieldOptions = useMemo(() => [
    { key: 'input_length', label: '输入', width: 90, render: (record: BenchmarkRoundResult) => record.params?.input_length ?? '-' },
    { key: 'output_length', label: '输出', width: 90, render: (record: BenchmarkRoundResult) => record.params?.output_length ?? '-' },
    { key: 'parallel', label: '并发数', width: 90, render: (record: BenchmarkRoundResult) => record.params?.parallel ?? '-' },
    { key: 'round_avg_tps', label: '单轮次 Avg TPS', width: 145, emphasis: true, render: (record: BenchmarkRoundResult) => formatNumber(roundAvgTps(record), 4) },
    { key: 'avg_tpot_s', label: 'Average TPOT (s)', width: 155, emphasis: true, render: (record: BenchmarkRoundResult) => formatNumber((numericMetric(record, 'avg_tpot_ms') || 0) / 1000, 4) },
    { key: 'avg_ttft_s', label: 'Average TTFT (s)', width: 150, emphasis: true, render: (record: BenchmarkRoundResult) => formatNumber((numericMetric(record, 'avg_ttft_ms') || 0) / 1000, 4) },
    { key: 'output_throughput', label: 'Output token throughput', width: 190, emphasis: true, render: (record: BenchmarkRoundResult) => formatNumber(outputTokenThroughput(record), 4) },
    { key: 'throughput', label: 'Request throughput', width: 150, render: (record: BenchmarkRoundResult) => formatNumber(numericMetric(record, 'throughput'), 4) },
    { key: 'time_taken_s', label: 'Time taken (s)', width: 130, render: (record: BenchmarkRoundResult) => formatNumber(numericMetric(record, 'time_taken_s'), 4) },
    { key: 'error_rate', label: '错误率', width: 90, render: (record: BenchmarkRoundResult) => formatPercent(record.metrics?.error_rate, 4) },
    { key: 'actual_cache_hit_rate', label: '真实命中率', width: 110, render: (record: BenchmarkRoundResult) => formatPercent(record.metrics?.actual_cache_hit_rate) },
    { key: 'bottleneck_reason', label: '终止原因', width: 190, render: (record: BenchmarkRoundResult) => record.bottleneck_reason || '-' },
    { key: 'params', label: '轮次参数', width: 260, render: (record: BenchmarkRoundResult) => <pre className="benchmark-table-json">{JSON.stringify(record.params, null, 2)}</pre> },
    { key: 'metrics', label: '轮次指标', width: 320, render: (record: BenchmarkRoundResult) => <pre className="benchmark-table-json">{JSON.stringify(record.metrics, null, 2)}</pre> },
  ], []);

  const detailColumns: ColumnsType<BenchmarkRoundResult> = detailFieldOptions.filter((item) => detailFields.includes(item.key)).map((item) => ({
    title: item.label,
    key: item.key,
    width: item.width,
    className: item.emphasis ? 'benchmark-emphasis-column' : undefined,
    render: (_, record) => item.render(record),
  }));

  const detailRows = detailTask?.round_results || [];
  const detailDuration = detailTask ? detailRows.reduce((sum, row) => sum + (numericMetric(row, 'time_taken_s') || 0), 0) : undefined;

  return (
    <div className="benchmark-page">
      <div className="benchmark-header">
        <div>
          <h1>性能压测</h1>
          <p>通过集群内 EvalScope Runner 对模型服务进行自定义、最大并发和全矩阵压测</p>
        </div>
      </div>

      <div className="benchmark-toolbar">
        <Space className="benchmark-toolbar-left">
          <Select allowClear placeholder="任务状态" value={status} onChange={setStatus} options={Object.entries(statusMap).map(([value, item]) => ({ value, label: item.text }))} style={{ width: 180 }} />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
        </Space>
        <Space className="benchmark-toolbar-right">
          <Popover trigger="click" placement="bottomRight" content={(
            <div className="benchmark-column-settings">
              <Space wrap>
                <span>详情表格列</span>
                <Button size="small" onClick={() => setDetailFields(detailFieldOptions.map((item) => item.key))}>全选</Button>
                <Button size="small" onClick={() => setDetailFields(defaultDetailFields)}>默认</Button>
              </Space>
              <Checkbox.Group value={detailFields} options={detailFieldOptions.map((item) => ({ label: item.label, value: item.key, disabled: requiredDetailFields.includes(item.key) }))} onChange={(values) => setDetailFields(Array.from(new Set([...requiredDetailFields, ...values.map(String)])))} />
            </div>
          )}>
            <Button icon={<SettingOutlined />}>详情列设置</Button>
          </Popover>
          <Button className="benchmark-create-button" type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建压测</Button>
        </Space>
      </div>

      <Table<BenchmarkTask> rowKey="id" columns={columns} dataSource={filteredTasks} scroll={{ x: 1220 }} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }} />

      <Modal className="benchmark-create-modal" title="新建压测任务" open={createOpen} width={760} okText="创建" cancelText="取消" onOk={handleCreate} onCancel={() => setCreateOpen(false)}>
        <Form form={form} layout="vertical" className="benchmark-form">
          <Form.Item name="task_name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="请输入压测任务名称" maxLength={40} showCount />
          </Form.Item>
          <Form.Item name="model_id" label="目标模型" rules={[{ required: true, message: '请选择目标模型' }]}>
            <Select showSearch placeholder="选择运行中的模型" optionFilterProp="label" options={modelOptions.map((item) => ({ value: item.id, label: `${item.display_model_name} (${item.service_name})` }))} />
          </Form.Item>
          <div className="benchmark-form-grid">
            <Form.Item name="benchmark_mode" label="压测模式"><Select options={[{ value: 'custom', label: '自定义压测' }, { value: 'max_concurrency', label: '最大并发压测' }, { value: 'matrix', label: '全矩阵压测' }]} /></Form.Item>
            <Form.Item name="dataset" label="数据集"><Select disabled={kvCacheEnabled} options={datasetOptions} /></Form.Item>
            <Form.Item name="stream" label="流式输出" valuePropName="checked"><Switch /></Form.Item>
          </div>
          <div className="benchmark-form-grid">
            {mode === 'custom' && (
              <>
                <Form.Item name="parallel" label="并发数" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="number" label="请求数" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="input_length" label="输入长度" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="output_length" label="输出长度" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="min_prompt_length" label="最小 Prompt 长度"><InputNumber min={0} className="w-full" /></Form.Item>
                <Form.Item name="max_prompt_length" label="最大 Prompt 长度"><InputNumber min={1} className="w-full" /></Form.Item>
              </>
            )}
          </div>
          {mode === 'max_concurrency' && (
            <div className="benchmark-mode-panel">
              <div className="benchmark-form-grid">
                <Form.Item name="input_length" label="固定输入长度" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="output_length" label="固定输出长度" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="number" label="每轮请求数" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="parallel_generation_mode" label="并发阶梯"><Select options={[{ value: 'geometric', label: '倍率生成' }, { value: 'manual', label: '手动输入' }]} /></Form.Item>
                {parallelGenerationMode === 'manual' ? <Form.Item name="parallel_list" label="并发列表"><Input placeholder="1,2,4,8,16,32,64" /></Form.Item> : (
                  <>
                    <Form.Item name="parallel_generation_start" label="起始并发"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="parallel_generation_max" label="最大并发"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="parallel_generation_multiplier" label="倍率"><InputNumber min={1.1} step={0.1} className="w-full" /></Form.Item>
                  </>
                )}
                <Form.Item name="refine_concurrency" label="自动精探并发边界" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="refine_precision" label="精探精度"><InputNumber min={1} className="w-full" /></Form.Item>
              </div>
            </div>
          )}
          <div className="benchmark-mode-panel">
            <Form.Item name="kv_cache_enabled" label="KV Cache 场景" valuePropName="checked"><Switch /></Form.Item>
            {kvCacheEnabled && (
              <div className="benchmark-form-grid">
                <Form.Item name="kv_target_cache_hit_rate" label="目标命中率"><InputNumber min={0.01} max={0.95} step={0.01} className="w-full" /></Form.Item>
                <Form.Item name="kv_min_shared_prefix_tokens" label="最小共享前缀"><InputNumber min={1} className="w-full" /></Form.Item>
                <Form.Item name="kv_cache_warmup" label="预热共享前缀" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="kv_metrics_url" label="SGLang Metrics URL"><Input placeholder="可选，默认推导 /metrics" /></Form.Item>
              </div>
            )}
            {kvCachePreview && <Alert type={kvCachePreview.tooShort ? 'warning' : 'info'} showIcon message={kvCachePreview.tooShort ? `最短输入 ${kvCachePreview.shortestInput} token，无法满足最小共享前缀 ${kvCachePreview.minShared} token` : `开启 KV Cache 后将自动使用 custom 数据集，预计共享前缀 ${kvCachePreview.effectiveShared} token，估算命中率 ${formatNumber(kvCachePreview.estimated * 100)}%`} />}
          </div>
          {mode === 'matrix' && (
            <div className="benchmark-mode-panel">
              <div className="benchmark-form-grid">
                <Form.Item name="matrix_parallel_generation_mode" label="并发阶梯"><Select options={[{ value: 'geometric', label: '倍率生成' }, { value: 'manual', label: '手动输入' }]} /></Form.Item>
                {matrixParallelGenerationMode === 'manual' ? <Form.Item name="matrix_parallel_list" label="并发列表"><Input placeholder="1,8,32,64" /></Form.Item> : (
                  <>
                    <Form.Item name="matrix_parallel_generation_start" label="起始并发"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="matrix_parallel_generation_max" label="最大并发"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="matrix_parallel_generation_multiplier" label="并发倍率"><InputNumber min={1.1} step={0.1} className="w-full" /></Form.Item>
                  </>
                )}
                <Form.Item name="matrix_input_generation_mode" label="输入长度"><Select options={[{ value: 'manual', label: '手动输入' }, { value: 'geometric', label: '倍率生成' }]} /></Form.Item>
                {matrixInputGenerationMode === 'geometric' ? (
                  <>
                    <Form.Item name="matrix_input_generation_start" label="起始输入"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="matrix_input_generation_max" label="最大输入"><InputNumber min={1} className="w-full" /></Form.Item>
                    <Form.Item name="matrix_input_generation_multiplier" label="输入倍率"><InputNumber min={1.1} step={0.1} className="w-full" /></Form.Item>
                  </>
                ) : <Form.Item name="matrix_input_length_list" label="输入长度列表"><Input placeholder="512,1024,2048" /></Form.Item>}
                <Form.Item name="matrix_output_length_list" label="输出长度列表" rules={[{ required: true }]}><Input placeholder="128,512,1024" /></Form.Item>
                <Form.Item name="number" label="每组请求数" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
              </div>
            </div>
          )}
          <div className="benchmark-form-grid">
            <Form.Item name="threshold_min_avg_tps" label="Avg TPS 下限"><InputNumber min={0} step={0.01} className="w-full" placeholder="可选" /></Form.Item>
            <Form.Item name="threshold_max_avg_ttft_ms" label="Average TTFT 上限(ms)"><InputNumber min={1} className="w-full" placeholder="可选" /></Form.Item>
            <Form.Item name="threshold_min_total_token_throughput_growth_ratio" label="总吞吐增长率下限"><InputNumber min={0} max={1} step={0.01} className="w-full" placeholder="例如 0.05" /></Form.Item>
          </div>
          <Collapse ghost className="benchmark-advanced-settings" items={[{ key: 'advanced', label: '高级设置', children: (
            <Tabs size="small" items={[
              { key: 'extra', label: '请求附加参数', children: <Form.Item name="extra_args_text"><Input.TextArea rows={5} spellCheck={false} /></Form.Item> },
              { key: 'evalscope', label: 'EvalScope 参数', children: <Form.Item name="evalscope_args_text"><Input.TextArea rows={5} spellCheck={false} /></Form.Item> },
            ]} />
          ) }]} />
        </Form>
      </Modal>

      <Drawer className="benchmark-detail-drawer" title={detailTask ? `压测任务 #${detailTask.id}` : '压测详情'} open={!!detailTask} size={1120} onClose={() => setDetailTask(null)} extra={detailTask && (
        <Space className="benchmark-drawer-actions">
          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          {!finalStatuses.includes(detailTask.status) && <Popconfirm title="停止压测任务？" okText="停止" cancelText="取消" onConfirm={() => handleStop(detailTask)}><Button danger icon={<StopOutlined />}>停止</Button></Popconfirm>}
        </Space>
      )}>
        {detailTask && (
          <div className="benchmark-detail">
            <div className="benchmark-detail-summary">
              <div className="benchmark-detail-model">
                <div>
                  <div className="benchmark-detail-model-name">{detailTask.model_name || detailTask.service_name || `模型 #${detailTask.model_id}`}</div>
                  <div className="benchmark-detail-service">{detailTask.service_name || '-'}</div>
                </div>
                <Badge status={statusMap[detailTask.status].badge} text={statusMap[detailTask.status].text} />
              </div>
              <div className="benchmark-detail-summary-grid">
                <div className="benchmark-detail-summary-item"><span>压测模式</span><b>{modeMap[detailTask.benchmark_mode]}</b></div>
                <div className="benchmark-detail-summary-item"><span>任务总时间</span><b>{formatDuration(detailDuration)}</b></div>
                <div className="benchmark-detail-summary-item"><span>轮次进度</span><b>{detailTask.current_round}/{detailTask.total_rounds}</b></div>
                <div className="benchmark-detail-summary-item"><span>请求规模</span><b>{detailTask.number} req / {detailTask.parallel} 并发</b></div>
                <div className="benchmark-detail-summary-item"><span>最大可接受并发</span><b>{detailTask.max_acceptable_parallel ?? '-'}</b></div>
              </div>
            </div>
            {detailTask.error_message && <div className="benchmark-error">{detailTask.error_message}</div>}
            <Table<BenchmarkRoundResult> className="benchmark-detail-table" rowKey="round_index" columns={detailColumns} dataSource={detailRows} pagination={false} size="small" scroll={{ x: 'max-content' }} />
          </div>
        )}
      </Drawer>
    </div>
  );
}
