export type RoutePluginConfigValue = string | number | boolean | string[];

export type RoutePluginConfigField = {
  key: string;
  label: string;
  type: 'input' | 'number' | 'textarea' | 'select' | 'switch' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  defaultValue?: RoutePluginConfigValue;
  options?: Array<{ label: string; value: string }>;
};

export const ROUTE_PLUGIN_CONFIG_SCHEMAS: Record<string, RoutePluginConfigField[]> = {
  'basic-auth': [
    { key: 'realm', label: '认证领域（Realm）', type: 'input', required: true, defaultValue: 'ataas-route', placeholder: '例如：ataas-route' },
    { key: 'hideCredentials', label: '隐藏认证凭据', type: 'switch', defaultValue: true },
    { key: 'consumerSource', label: '消费者来源', type: 'select', required: true, defaultValue: 'route', options: [{ label: '当前路由消费者', value: 'route' }, { label: '指定消费者组', value: 'group' }] },
  ],
  'forward-auth': [
    { key: 'endpoint', label: '外部鉴权地址', type: 'input', required: true, placeholder: 'https://auth.example.com/verify' },
    { key: 'timeout', label: '鉴权超时（ms）', type: 'number', required: true, defaultValue: 3000 },
    { key: 'requestHeaders', label: '透传请求头', type: 'textarea', placeholder: '每行一个 Header，例如：Authorization' },
  ],
  'hmac-auth': [
    { key: 'algorithm', label: '签名算法', type: 'select', required: true, defaultValue: 'hmac-sha256', options: [{ label: 'HMAC-SHA256', value: 'hmac-sha256' }, { label: 'HMAC-SHA512', value: 'hmac-sha512' }] },
    { key: 'clockSkew', label: '时间偏差容忍（秒）', type: 'number', required: true, defaultValue: 300 },
    { key: 'signedHeaders', label: '参与签名的请求头', type: 'textarea', placeholder: '每行一个 Header' },
  ],
  'jwt-auth': [
    { key: 'tokenSource', label: 'Token 来源', type: 'select', required: true, defaultValue: 'header', options: [{ label: 'Authorization Header', value: 'header' }, { label: 'Query 参数', value: 'query' }, { label: 'Cookie', value: 'cookie' }] },
    { key: 'headerName', label: 'Header / 参数名称', type: 'input', required: true, defaultValue: 'Authorization' },
    { key: 'claimsToHeaders', label: 'Claims 映射', type: 'textarea', placeholder: '例如：sub=X-Consumer-Id' },
  ],
  'key-auth': [
    { key: 'keyNames', label: 'API Key 字段名', type: 'textarea', required: true, defaultValue: 'apikey\nx-api-key', placeholder: '每行一个字段名' },
    { key: 'source', label: '读取位置', type: 'checkbox', required: true, defaultValue: ['header'], options: [{ label: 'Header', value: 'header' }, { label: 'Query', value: 'query' }, { label: 'Cookie', value: 'cookie' }] },
    { key: 'hideCredentials', label: '转发前移除 Key', type: 'switch', defaultValue: true },
  ],
  'request-rewrite': [
    { key: 'path', label: '重写路径', type: 'input', placeholder: '例如：/v1/chat/completions' },
    { key: 'host', label: '重写 Host', type: 'input', placeholder: '例如：model.internal' },
    { key: 'headers', label: 'Header 重写规则', type: 'textarea', placeholder: '每行一条，例如：X-Env=prod' },
    { key: 'method', label: '重写方法', type: 'select', defaultValue: 'keep', options: [{ label: '保持原方法', value: 'keep' }, { label: 'POST', value: 'POST' }, { label: 'GET', value: 'GET' }] },
  ],
  'ai-router': [
    { key: 'strategy', label: '模型选择策略', type: 'select', required: true, defaultValue: 'balanced', options: [{ label: '负载与质量均衡', value: 'balanced' }, { label: '最低延迟', value: 'latency' }, { label: '最低成本', value: 'cost' }] },
    { key: 'fallbackModel', label: '兜底模型', type: 'input', required: true, placeholder: '例如：glm-5.2' },
    { key: 'maxRetries', label: '最大重试次数', type: 'number', required: true, defaultValue: 2 },
    { key: 'enableAffinity', label: '启用会话亲和', type: 'switch', defaultValue: true },
  ],
};

export const buildRoutePluginConfigDefaults = (pluginKey: string) => Object.fromEntries(
  (ROUTE_PLUGIN_CONFIG_SCHEMAS[pluginKey] || []).map((field) => [field.key, field.defaultValue ?? '']),
) as Record<string, RoutePluginConfigValue>;
