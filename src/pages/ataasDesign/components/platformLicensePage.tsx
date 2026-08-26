import { CheckCircleFilled, ClockCircleOutlined, FileProtectOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Descriptions, message, Modal, Progress, Tag, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import './platformLicensePage.less';

const PlatformLicensePage = () => {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [license, setLicense] = useState({
    status: '有效',
    customer: '并行科技',
    licenseId: 'ATAAS-ST1-2026-0019',
    edition: '企业版',
    issuedAt: '2026-01-01',
    expiresAt: '2026-12-31',
    clusterLimit: 10,
    nodeLimit: 200,
    gpuLimit: 1024,
    currentClusters: 1,
    currentNodes: 55,
    currentGpus: 512,
  });

  const remainingDays = Math.max(0, dayjs(license.expiresAt).startOf('day').diff(dayjs().startOf('day'), 'day'));
  const validityPercent = useMemo(() => {
    const total = dayjs(license.expiresAt).diff(dayjs(license.issuedAt), 'day');
    return total > 0 ? Math.max(0, Math.min(100, Math.round((remainingDays / total) * 100))) : 0;
  }, [license.expiresAt, license.issuedAt, remainingDays]);

  const applyLicense = () => {
    if (!fileList.length) {
      message.warning('请先选择 License 文件');
      return;
    }
    setLicense((current) => ({ ...current, status: '有效' }));
    setUploadOpen(false);
    setFileList([]);
    message.success('License 校验通过，平台授权已更新');
  };

  return <div className="platform-license-page">
    <header>
      <div><h1>平台授权</h1><p>查看平台 License 状态、有效期限与授权资源额度</p></div>
      <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>更新 License</Button>
    </header>

    <section className="license-overview-card">
      <div className="license-overview-icon"><FileProtectOutlined /></div>
      <div className="license-overview-main">
        <div className="license-title-row"><h2>{license.edition} License</h2><Tag icon={<CheckCircleFilled />} color="success">{license.status}</Tag></div>
        <p>授权主体：{license.customer}</p>
        <div className="license-validity">
          <span><ClockCircleOutlined /> 有效期至 {license.expiresAt}</span>
          <strong>剩余 {remainingDays} 天</strong>
        </div>
        <Progress percent={validityPercent} showInfo={false} strokeColor="#6b3df0" trailColor="#eef0f5" />
      </div>
    </section>

    <div className="license-content-grid">
      <section className="license-section">
        <header><h3>授权信息</h3><span>License 基本信息</span></header>
        <Descriptions column={1} colon={false} items={[
          { key: 'id', label: 'License ID', children: license.licenseId },
          { key: 'customer', label: '授权主体', children: license.customer },
          { key: 'edition', label: '授权版本', children: license.edition },
          { key: 'issued', label: '签发日期', children: license.issuedAt },
          { key: 'expires', label: '到期日期', children: license.expiresAt },
        ]} />
      </section>

      <section className="license-section">
        <header><h3>资源授权额度</h3><span>当前使用量 / 授权上限</span></header>
        <div className="license-quota-list">
          {[
            { label: '集群', used: license.currentClusters, limit: license.clusterLimit, unit: '个' },
            { label: '节点', used: license.currentNodes, limit: license.nodeLimit, unit: '台' },
            { label: 'GPU', used: license.currentGpus, limit: license.gpuLimit, unit: '卡' },
          ].map((item) => <div className="license-quota-item" key={item.label}>
            <div><span>{item.label}</span><strong>{item.used} <em>/ {item.limit} {item.unit}</em></strong></div>
            <Progress percent={Math.round((item.used / item.limit) * 100)} showInfo={false} strokeColor="#168cff" trailColor="#eef0f5" />
          </div>)}
        </div>
      </section>
    </div>

    <section className="license-notice"><strong>到期提醒</strong><span>License 到期前 30 天平台将持续提示。授权到期后仅保留查看能力，请及时上传新的 License 文件。</span></section>

    <Modal className="platform-license-modal" title="更新 License" open={uploadOpen} width={560} okText="校验并更新" cancelText="取消" onOk={applyLicense} onCancel={() => { setUploadOpen(false); setFileList([]); }}>
      <Upload.Dragger
        accept=".lic,.license,.json"
        maxCount={1}
        fileList={fileList}
        beforeUpload={() => false}
        onChange={({ fileList: next }) => setFileList(next.slice(-1))}
      >
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">点击或拖拽 License 文件到此区域</p>
        <p className="ant-upload-hint">支持 .lic、.license、.json 文件，上传后将校验签名、授权主体和有效期限</p>
      </Upload.Dragger>
    </Modal>
  </div>;
};

export default PlatformLicensePage;
