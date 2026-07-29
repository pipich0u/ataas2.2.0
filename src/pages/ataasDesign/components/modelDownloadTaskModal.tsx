import { Button, Checkbox, Form, Input, Modal, Select, Space } from 'antd';
import { useEffect } from 'react';

export type ModelDownloadHostOption = {
  value: string;
  label: string;
  ip: string;
  freeGb: number;
};

export type ModelDownloadTaskValues = {
  taskName: string;
  modelName: string;
  url: string;
  host: string;
  path: string;
  fileName?: string;
  resume?: boolean;
  verify?: boolean;
};

type ModelDownloadTaskModalProps = {
  open: boolean;
  hostOptions: ModelDownloadHostOption[];
  onCancel: () => void;
  onSubmit: (values: ModelDownloadTaskValues) => void | Promise<void>;
};

const formatTotalSize = (gb: number) => (gb >= 1024 ? `${(gb / 1024).toFixed(1)} TiB` : `${gb} GiB`);

export default function ModelDownloadTaskModal({
  open,
  hostOptions,
  onCancel,
  onSubmit,
}: ModelDownloadTaskModalProps) {
  const [form] = Form.useForm<ModelDownloadTaskValues>();
  const watchedHost = Form.useWatch('host', form);
  const selectedHost = hostOptions.find((item) => item.value === watchedHost) || hostOptions[0];

  useEffect(() => {
    if (!open || !hostOptions.length) return;
    form.setFieldsValue({
      taskName: '',
      modelName: '',
      url: '',
      host: hostOptions[0].value,
      path: '/data/models/',
      fileName: '',
      resume: true,
      verify: true,
    });
  }, [form, hostOptions, open]);

  const submit = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="创建模型下载任务"
      open={open}
      width={820}
      okText="开始下载"
      onOk={submit}
      onCancel={onCancel}
    >
      <p className="distribution-modal-note">通过 HTTP／HTTPS 直链将远程模型保存到已纳管的模型主机，下载完成后可直接创建分发任务。</p>
      <Form form={form} layout="vertical">
        <section className="distribution-form-section">
          <h3>远程模型</h3>
          <div className="distribution-form-grid">
            <Form.Item label="任务名称" name="taskName" rules={[{ required: true, message: '请输入任务名称' }]}>
              <Input placeholder="例如：下载 GLM-5.2 至模型主机" />
            </Form.Item>
            <Form.Item label="模型名称" name="modelName" rules={[{ required: true, message: '请输入模型名称' }]}>
              <Input placeholder="例如：GLM-5.2" />
            </Form.Item>
            <Form.Item className="wide" label="模型 URL" name="url" extra="任务启动前会检查 URL 可访问性和文件大小。" rules={[{ required: true, type: 'url', message: '请输入有效的 HTTP／HTTPS URL' }]}>
              <Input placeholder="https://example.com/models/model.tar.zst" />
            </Form.Item>
          </div>
        </section>
        <section className="distribution-form-section">
          <h3>模型保存位置</h3>
          <div className="distribution-form-grid">
            <Form.Item label="下载主机" name="host" rules={[{ required: true, message: '请选择下载主机' }]}>
              <Select showSearch optionFilterProp="label" options={hostOptions} />
            </Form.Item>
            <div className="distribution-host-capacity">
              <span>主机状态</span>
              <strong>{selectedHost?.ip || '等待选择'} · 可用 {selectedHost ? formatTotalSize(selectedHost.freeGb) : '—'}</strong>
              <small>执行下载前会再次检查连通性、目录权限和剩余空间。</small>
            </div>
            <Form.Item label="保存目录" name="path" rules={[{ required: true, message: '请输入保存目录' }]}>
              <Input placeholder="/data/models/" />
            </Form.Item>
            <Form.Item label="保存名称（选填）" name="fileName" extra="留空时从 URL 自动识别。">
              <Input placeholder="例如：GLM-5.2.tar.zst" />
            </Form.Item>
            <div className="distribution-path-presets wide">
              <span>常用目录</span>
              {['/data/models/', '/mnt/model-cache/', '/opt/ataas/models/'].map((path) => (
                <Button key={path} size="small" onClick={() => form.setFieldValue('path', path)}>{path}</Button>
              ))}
            </div>
            <Form.Item className="wide distribution-checks">
              <Space size={24} wrap>
                <Form.Item name="resume" valuePropName="checked" noStyle><Checkbox>启用断点续传</Checkbox></Form.Item>
                <Form.Item name="verify" valuePropName="checked" noStyle><Checkbox>下载完成后校验文件完整性</Checkbox></Form.Item>
              </Space>
            </Form.Item>
          </div>
        </section>
      </Form>
    </Modal>
  );
}
