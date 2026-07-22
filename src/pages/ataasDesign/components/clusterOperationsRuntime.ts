// @ts-nocheck
// Prototype data and event handlers stay isolated here until the backend APIs
// replace the in-memory supplier, machine, cluster, and distribution task data.
export const initializeClusterOperations = (root: HTMLElement) => {
  if (root.dataset.clusterOperationsInitialized === 'true') return;
  root.dataset.clusterOperationsInitialized = 'true';

  const getById = (id: string) => root.querySelector(`#${id}`);

(() => {
      const tabs = Array.from(root.querySelectorAll('.module-tab[data-view]'));
      const resourcePageHashes = new Set(['#supplier-list', '#dc-list']);
      const resourceModalHashes = new Set(['#supplier-create', '#dc-create', '#supplier-delete', '#dc-delete', '#machine-onboard', '#cluster-create', '#node-scale']);
      let resourceContextMode = false;
      let previousHash = window.location.hash;
      const applyView = () => {
        const hash = window.location.hash;
        if (resourcePageHashes.has(hash)) resourceContextMode = true;
        else if (!resourceModalHashes.has(hash)) resourceContextMode = false;
        else if (resourcePageHashes.has(previousHash)) resourceContextMode = true;
        const view = hash === '#nodes' ? 'nodes' : (hash === '#workloads' ? 'workloads' : 'overview');
        const modelDistributionActive = hash === '#model-distribution';
        root.classList.toggle('nodes-mode', view === 'nodes');
        root.classList.toggle('workloads-mode', view === 'workloads');
        root.classList.toggle('model-distribution-mode', modelDistributionActive);
        if (!modelDistributionActive) root.querySelectorAll('.mdist-overlay.open').forEach((item) => item.classList.remove('open'));
        root.classList.toggle('supplier-create-mode', hash === '#supplier-create');
        root.classList.toggle('resource-files-mode', hash === '#supplier-list' || hash === '#dc-list');
        root.classList.toggle('supplier-list-mode', hash === '#supplier-list');
        root.classList.toggle('dc-list-mode', hash === '#dc-list');
        root.classList.toggle('supplier-delete-mode', hash === '#supplier-delete');
        root.classList.toggle('dc-create-mode', hash === '#dc-create');
        root.classList.toggle('dc-delete-mode', hash === '#dc-delete');
        root.classList.toggle('machine-onboard-mode', hash === '#machine-onboard');
        root.classList.toggle('cluster-create-mode', hash === '#cluster-create');
        root.classList.toggle('node-scale-mode', hash === '#node-scale');
        const resourceAccessActive = resourcePageHashes.has(hash) || (resourceContextMode && resourceModalHashes.has(hash));
        root.classList.toggle('resource-access-active', resourceAccessActive);
        root.classList.toggle('resource-context-mode', resourceContextMode && resourceModalHashes.has(hash));
        getById('clusterOverviewNav')?.classList.toggle('active', !resourceAccessActive && !modelDistributionActive);
        getById('resourceAccessButton')?.classList.toggle('active', resourceAccessActive);
        getById('modelDistributionNav')?.classList.toggle('active', modelDistributionActive);
        root.querySelectorAll('.resource-files-tab').forEach((tab) => tab.classList.toggle('active', hash === `#${tab.dataset.resourceHash}`));
        tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.view === view));
        previousHash = hash;
      };
      tabs.forEach((tab) => tab.addEventListener('click', () => {
        window.location.hash = tab.dataset.view === 'overview' ? '' : tab.dataset.view;
      }));
      window.addEventListener('hashchange', applyView);
      applyView();

      const resourceTreeCreateSupplier = getById('resourceTreeCreateSupplier');
      if (resourceTreeCreateSupplier) resourceTreeCreateSupplier.addEventListener('click', () => { window.location.hash = 'supplier-create'; });
      const resourceTreeArchive = getById('resourceTreeArchive');
      if (resourceTreeArchive) resourceTreeArchive.addEventListener('click', () => { window.location.hash = 'supplier-list'; });
      const collapseResourceAccordion = () => {
        root.querySelectorAll('.acc-supplier.open').forEach((item) => {
          item.classList.remove('open');
          item.querySelector('.acc-supplier-head')?.setAttribute('aria-expanded', 'false');
        });
        root.querySelectorAll('.tree-add-wrap.open').forEach((item) => item.classList.remove('open'));
      };
      window.collapseResourceAccordion = collapseResourceAccordion;
      const clusterOverviewNav = getById('clusterOverviewNav');
      if (clusterOverviewNav) clusterOverviewNav.addEventListener('click', () => { collapseResourceAccordion(); window.location.hash = ''; });
      const resourceAccessButton = getById('resourceAccessButton');
      if (resourceAccessButton) resourceAccessButton.addEventListener('click', () => { collapseResourceAccordion(); window.location.hash = 'supplier-list'; });
      const modelDistributionNav = getById('modelDistributionNav');
      if (modelDistributionNav) modelDistributionNav.addEventListener('click', () => { collapseResourceAccordion(); window.location.hash = 'model-distribution'; });
      const overviewMachineOnboardAction = getById('overviewMachineOnboardAction');
      if (overviewMachineOnboardAction) overviewMachineOnboardAction.addEventListener('click', () => {
        if (window.openMachineOnboard) window.openMachineOnboard('', 'gpu-prod-01');
        else window.location.hash = 'machine-onboard';
      });
      const overviewClusterCreateAction = getById('overviewClusterCreateAction');
      if (overviewClusterCreateAction) overviewClusterCreateAction.addEventListener('click', () => {
        if (window.openClusterAccess) window.openClusterAccess('');
        else window.location.hash = 'cluster-create';
      });
      const openCurrentClusterScale = () => {
        if (window.openNodeScale) window.openNodeScale('', '');
        else window.location.hash = 'node-scale';
      };
      getById('nodesScaleAction')?.addEventListener('click', openCurrentClusterScale);
      getById('overviewNodeScaleAction')?.addEventListener('click', openCurrentClusterScale);
      root.querySelectorAll('.supplier-dialog-close').forEach((button) => button.addEventListener('click', () => { window.location.hash = 'supplier-list'; }));
      root.querySelectorAll('[data-required-field] .dialog-input').forEach((input) => input.addEventListener('input', () => {
        if (input.value.trim()) input.closest('.form-field').classList.remove('invalid');
      }));
      const supplierCreateSubmit = getById('supplierCreateSubmit');
      if (supplierCreateSubmit) supplierCreateSubmit.addEventListener('click', () => {
        let firstInvalid = null;
        root.querySelectorAll('[data-required-field]').forEach((field) => {
          const input = field.querySelector('.dialog-input');
          const invalid = !input.value.trim();
          field.classList.toggle('invalid', invalid);
          if (invalid && !firstInvalid) firstInvalid = input;
        });
        if (firstInvalid) firstInvalid.focus();
      });

      root.querySelectorAll('.resource-files-close').forEach((button) => button.addEventListener('click', () => { collapseResourceAccordion(); window.location.hash = ''; }));
      root.querySelectorAll('.resource-files-tab').forEach((tab) => tab.addEventListener('click', () => { window.location.hash = tab.dataset.resourceHash; }));
      root.querySelectorAll('.overlay-return').forEach((button) => button.addEventListener('click', () => { window.location.hash = button.dataset.returnHash || ''; }));
      const openHash = (id, hash) => { const element = getById(id); if (element) element.addEventListener('click', () => { window.location.hash = hash; }); };
      openHash('archiveCreateSupplier', 'supplier-create');
      openHash('supplierCreateDc', 'dc-create');
      openHash('archiveCreateDc', 'dc-create');
      openHash('supplierDeleteOpen', 'supplier-delete');
      openHash('dcDeleteOpen', 'dc-delete');
      openHash('dcOnboardMachine', 'machine-onboard');
      openHash('dcCreateCluster', 'cluster-create');

      const supplierArchiveDetails = {
        'supplier-a': { name: '厂商A · xxx科技', status: '合作中', statusClass: '', code: 'SUP-2026-001 · 算力／裸金属供应商', contact: '李敏', phone: '138 0013 8001', email: 'limin@xxxtech.cn', hotline: '400-880-1024', region: '华东', dcs: '2', clusters: '2', machines: '106' },
        'supplier-b': { name: '厂商B · 中原算力', status: '需关注', statusClass: 'attention', code: 'SUP-2026-002 · 算力／裸金属供应商', contact: '王工', phone: '139 0013 9002', email: 'service@zycompute.cn', hotline: '400-660-2096', region: '华中', dcs: '1', clusters: '2', machines: '96' },
        'supplier-c': { name: '厂商C · 华北云', status: '合作中', statusClass: '', code: 'SUP-2026-003 · 云资源供应商', contact: '赵凯', phone: '137 0013 7003', email: 'zhaokai@northcloud.cn', hotline: '400-550-1040', region: '华北', dcs: '1', clusters: '1', machines: '40' },
        'supplier-d': { name: '厂商D · 边缘算力', status: '合作中', statusClass: '', code: 'SUP-2026-004 · 边缘算力供应商', contact: '陈璐', phone: '136 0013 6004', email: 'chenlu@edgecompute.cn', hotline: '400-330-2006', region: '华南', dcs: '2', clusters: '0', machines: '6' },
        'supplier-e': { name: '厂商E · 海外云', status: '待接入', statusClass: 'disabled', code: 'SUP-2026-005 · 云资源供应商', contact: 'Sofia', phone: '+65 6123 4567', email: 'sofia@globalcloud.example', hotline: '+65 6000 8000', region: '新加坡', dcs: '2', clusters: '0', machines: '0' }
      };
      const renderSupplierArchiveDetail = (id) => {
        const detail = supplierArchiveDetails[id];
        if (!detail) return;
        const values = { supplierDetailName: detail.name, supplierDetailCode: detail.code, supplierDetailContact: detail.contact, supplierDetailPhone: detail.phone, supplierDetailEmail: detail.email, supplierDetailHotline: detail.hotline, supplierDetailRegion: detail.region, supplierDetailDcCount: detail.dcs, supplierDetailClusterCount: detail.clusters, supplierDetailMachineCount: detail.machines };
        Object.entries(values).forEach(([key, value]) => { const element = getById(key); if (element) element.textContent = value; });
        const status = getById('supplierDetailStatus');
        if (status) { status.textContent = detail.status; status.className = `archive-status${detail.statusClass ? ` ${detail.statusClass}` : ''}`; }
      };
      const supplierRows = Array.from(root.querySelectorAll('.supplier-table .archive-table-row[data-supplier]'));
      supplierRows.forEach((row) => row.addEventListener('click', () => { supplierRows.forEach((item) => item.classList.remove('selected')); row.classList.add('selected'); renderSupplierArchiveDetail(row.dataset.supplier); }));
      const filterSupplierArchive = () => {
        const term = (getById('supplierArchiveSearch')?.value || '').trim().toLowerCase();
        const status = getById('supplierArchiveStatus')?.value || 'all';
        let count = 0;
        supplierRows.forEach((row) => { const visible = (!term || row.dataset.search.toLowerCase().includes(term)) && (status === 'all' || row.dataset.status === status); row.style.display = visible ? 'grid' : 'none'; if (visible) count += 1; });
        const meta = getById('supplierArchiveMeta'); if (meta) meta.textContent = `共 ${count} 家供应商`;
        const empty = getById('supplierArchiveEmpty'); if (empty) empty.style.display = count ? 'none' : 'block';
      };
      getById('supplierArchiveSearch')?.addEventListener('input', filterSupplierArchive);
      getById('supplierArchiveStatus')?.addEventListener('change', filterSupplierArchive);

      const dcArchiveDetails = {
        'dc-sh-01': { name: '上海一号数据中心', status: '1 项异常', statusClass: 'attention', code: 'DC-SH-001 · 厂商A · xxx科技', location: '上海市浦东新区', timezone: 'UTC+08:00', management: '10.24.16.0/20', bmc: '172.20.16.0/22', business: '10.28.0.0/16', proxy: '专线出口 · 已配置', clusters: '2', machines: '106', free: '18' },
        'dc-sh-02': { name: '上海二号数据中心', status: '待接入', statusClass: 'disabled', code: 'DC-SH-002 · 厂商A · xxx科技', location: '上海市临港新片区', timezone: 'UTC+08:00', management: '10.25.0.0/20', bmc: '172.20.32.0/22', business: '待配置', proxy: '待配置', clusters: '0', machines: '0', free: '0' },
        'dc-zz-01': { name: '郑州高新数据中心', status: '运行中', statusClass: '', code: 'DC-ZZ-001 · 厂商B · 中原算力', location: '河南省郑州市高新区', timezone: 'UTC+08:00', management: '10.34.0.0/20', bmc: '172.21.0.0/22', business: '10.38.0.0/16', proxy: '专线出口 · 已配置', clusters: '2', machines: '96', free: '0' },
        'dc-bj-01': { name: '北京亦庄数据中心', status: '运行中', statusClass: '', code: 'DC-BJ-001 · 厂商C · 华北云', location: '北京市亦庄经济技术开发区', timezone: 'UTC+08:00', management: '10.44.0.0/20', bmc: '172.22.0.0/22', business: '10.48.0.0/16', proxy: '云专线 · 已配置', clusters: '1', machines: '40', free: '0' },
        'dc-gz-01': { name: '广州边缘数据中心', status: '运行中', statusClass: '', code: 'DC-GZ-001 · 厂商D · 边缘算力', location: '广东省广州市黄埔区', timezone: 'UTC+08:00', management: '10.54.0.0/24', bmc: '172.23.0.0/26', business: '10.58.0.0/24', proxy: '专线出口 · 已配置', clusters: '0', machines: '3', free: '3' },
        'dc-cd-01': { name: '成都边缘数据中心', status: '运行中', statusClass: '', code: 'DC-CD-001 · 厂商D · 边缘算力', location: '四川省成都市高新区', timezone: 'UTC+08:00', management: '10.55.0.0/24', bmc: '172.23.1.0/26', business: '10.59.0.0/24', proxy: '专线出口 · 已配置', clusters: '0', machines: '3', free: '3' },
        'dc-sg-01': { name: '新加坡一号数据中心', status: '待接入', statusClass: 'disabled', code: 'DC-SG-001 · 厂商E · 海外云', location: 'Singapore West', timezone: 'UTC+08:00', management: '待配置', bmc: '待配置', business: '待配置', proxy: '待配置', clusters: '0', machines: '0', free: '0' },
        'dc-tk-01': { name: '东京一号数据中心', status: '待接入', statusClass: 'disabled', code: 'DC-TK-001 · 厂商E · 海外云', location: 'Tokyo East', timezone: 'UTC+09:00', management: '待配置', bmc: '待配置', business: '待配置', proxy: '待配置', clusters: '0', machines: '0', free: '0' }
      };
      const renderDcArchiveDetail = (id) => {
        const detail = dcArchiveDetails[id];
        if (!detail) return;
        const values = { dcDetailName: detail.name, dcDetailCode: detail.code, dcDetailLocation: detail.location, dcDetailTimezone: detail.timezone, dcDetailMgmtCidr: detail.management, dcDetailBmcCidr: detail.bmc, dcDetailBizCidr: detail.business, dcDetailProxy: detail.proxy, dcDetailClusterCount: detail.clusters, dcDetailMachineCount: detail.machines, dcDetailFreeCount: detail.free };
        Object.entries(values).forEach(([key, value]) => { const element = getById(key); if (element) element.textContent = value; });
        const status = getById('dcDetailStatus'); if (status) { status.textContent = detail.status; status.className = `archive-status${detail.statusClass ? ` ${detail.statusClass}` : ''}`; }
      };
      const dcRows = Array.from(root.querySelectorAll('.dc-table .archive-table-row[data-dc]'));
      dcRows.forEach((row) => row.addEventListener('click', () => { dcRows.forEach((item) => item.classList.remove('selected')); row.classList.add('selected'); renderDcArchiveDetail(row.dataset.dc); }));
      const filterDcArchive = () => {
        const term = (getById('dcArchiveSearch')?.value || '').trim().toLowerCase();
        const supplier = getById('dcSupplierFilter')?.value || 'all';
        let count = 0;
        dcRows.forEach((row) => { const visible = (!term || row.dataset.search.toLowerCase().includes(term)) && (supplier === 'all' || row.dataset.supplier === supplier); row.style.display = visible ? 'grid' : 'none'; if (visible) count += 1; });
        const meta = getById('dcArchiveMeta'); if (meta) meta.textContent = `当前显示 ${count} 个`;
        const empty = getById('dcArchiveEmpty'); if (empty) empty.style.display = count ? 'none' : 'block';
      };
      getById('dcArchiveSearch')?.addEventListener('input', filterDcArchive);
      getById('dcSupplierFilter')?.addEventListener('change', filterDcArchive);

      let machineOnboardMethod = 'ssh';
      let machineOnboardTargetCluster = '';
      let machineOnboardReturnHash = 'dc-list';
      const updateMachineOnboardMethod = (method = 'ssh') => {
        machineOnboardMethod = method;
        root.querySelectorAll('[data-machine-method]').forEach((card) => card.classList.toggle('selected', card.dataset.machineMethod === method));
        root.querySelectorAll('[data-machine-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.machinePanel === method));
        const validateButton = getById('machineOnboardValidate');
        const footNote = getById('machineOnboardFootNote');
        if (validateButton) validateButton.textContent = method === 'ssh' ? '开始校验' : (method === 'file' ? '上传并校验' : '创建回传任务');
        if (footNote) {
          const targetHint = machineOnboardTargetCluster ? `校验通过后可继续发起 ${machineOnboardTargetCluster} 的节点扩容` : '校验通过后机器进入当前数据中心的未分配资源池';
          footNote.textContent = method === 'ssh' ? `将执行 IP、SSH 凭据和硬件采集检查；${targetHint}` : (method === 'file' ? `将逐行校验字段、连通性和资产重复；${targetHint}` : '创建后需在目标机器执行采集包并等待回传；不会安装 Kubernetes');
        }
        root.querySelector('.machine-onboard-layer .small-dialog-body')?.scrollTo({ top: 0, behavior: 'smooth' });
      };
      root.querySelectorAll('[data-machine-method]').forEach((card) => card.addEventListener('click', () => updateMachineOnboardMethod(card.dataset.machineMethod)));
      getById('machineListFile')?.addEventListener('change', (event) => {
        const file = event.currentTarget.files?.[0];
        const preview = getById('machineFilePreview');
        const box = getById('machineUploadBox');
        box?.classList.remove('invalid');
        if (preview) preview.textContent = file ? `已选择：${file.name} · 待上传校验` : '尚未选择文件';
      });
      getById('machineTemplateDownload')?.addEventListener('click', (event) => {
        const button = event.currentTarget;
        button.textContent = '模板已准备';
        setTimeout(() => { button.textContent = '下载导入模板'; }, 900);
      });
      getById('machineOfflineDownload')?.addEventListener('click', (event) => {
        const button = event.currentTarget;
        button.textContent = '采集包已准备';
        const status = getById('machineOfflineStatus');
        if (status) status.innerHTML = '<span class="offline-wait-status">采集包已下载，等待目标机器执行</span>';
        setTimeout(() => { button.textContent = '下载采集包'; }, 900);
      });
      getById('machineOfflineCopy')?.addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const command = getById('machineOfflineCommand')?.textContent || '';
        try { await navigator.clipboard?.writeText(command); } catch (error) { /* file:// 环境可能不允许写入剪贴板 */ }
        button.textContent = '已复制';
        setTimeout(() => { button.textContent = '复制命令'; }, 900);
      });
      const resetMachineOnboardView = () => {
        const layer = root.querySelector('.machine-onboard-layer');
        if (layer) layer.classList.remove('show-result');
        const title = getById('machineOnboardTitle');
        const subtitle = getById('machineOnboardSubtitle');
        if (title) title.textContent = '纳管裸金属机器';
        if (subtitle) subtitle.textContent = machineOnboardTargetCluster ? `将机器纳入上海一号数据中心，验收后可加入 ${machineOnboardTargetCluster}` : '先将机器纳入数据中心资源池，再分配给集群';
        const fileInput = getById('machineListFile');
        if (fileInput) fileInput.value = '';
        const filePreview = getById('machineFilePreview');
        if (filePreview) filePreview.textContent = '尚未选择文件';
        getById('machineUploadBox')?.classList.remove('invalid');
        const offlineStatus = getById('machineOfflineStatus');
        if (offlineStatus) offlineStatus.innerHTML = '<span class="offline-wait-status">尚未创建回传任务</span>';
        updateMachineOnboardMethod('ssh');
        const body = layer?.querySelector('.small-dialog-body');
        if (body) body.scrollTop = 0;
      };
      window.resetMachineOnboardView = resetMachineOnboardView;
      window.openMachineOnboard = (returnHash = 'dc-list', targetCluster = '') => {
        machineOnboardTargetCluster = targetCluster;
        machineOnboardReturnHash = returnHash;
        resetMachineOnboardView();
        root.querySelectorAll('.machine-onboard-layer .overlay-return').forEach((button) => { button.dataset.returnHash = returnHash; });
        const subtitle = getById('machineOnboardSubtitle');
        const notice = getById('machineOnboardNotice');
        const scope = getById('machineOnboardScope');
        if (subtitle) subtitle.textContent = targetCluster ? `将机器纳入上海一号数据中心，验收后可加入 ${targetCluster}` : '先将机器纳入数据中心资源池，再分配给集群';
        if (notice) notice.textContent = targetCluster ? `本次只完成裸金属纳管和硬件验收，不会自动注册为 Node。校验通过后，可继续发起 ${targetCluster} 的节点扩容。` : '机器纳管后仍是裸金属资源，不会自动变成 Kubernetes Node。只有在创建集群或节点扩容完成后，机器才会注册为 Node。';
        if (scope) scope.textContent = targetCluster ? `上海一号数据中心 · 厂商A · 目标集群 ${targetCluster}` : '上海一号数据中心 · 厂商A';
        updateMachineOnboardMethod('ssh');
        window.location.hash = 'machine-onboard';
      };
      getById('machineOnboardValidate')?.addEventListener('click', () => {
        if (machineOnboardMethod === 'file' && !getById('machineListFile')?.files?.length) {
          getById('machineUploadBox')?.classList.add('invalid');
          const preview = getById('machineFilePreview');
          if (preview) preview.textContent = '请先选择 CSV 或 XLSX 机器清单';
          getById('machineListFile')?.focus();
          return;
        }
        const layer = root.querySelector('.machine-onboard-layer');
        if (layer) layer.classList.add('show-result');
        const title = getById('machineOnboardTitle');
        const subtitle = getById('machineOnboardSubtitle');
        const continueButton = getById('machineOnboardContinue');
        const metricLabels = [getById('machineResultMetric1Label'), getById('machineResultMetric2Label'), getById('machineResultMetric3Label')];
        const metricValues = [getById('machineResultMetric1'), getById('machineResultMetric2'), getById('machineResultMetric3')];
        const resultNote = getById('machineResultNote');
        const resultListTitle = getById('machineResultListTitle');
        const resultList = getById('machineResultList');
        const resultFlow = getById('machineResultFlow');
        const resultFootNote = getById('machineResultFootNote');
        if (machineOnboardMethod === 'offline') {
          if (title) title.textContent = '等待离线采集回传';
          if (subtitle) subtitle.textContent = '2026年7月GPU机器 · 任务 MC-20260721-0042';
          ['回传任务','已回传','纳管成功'].forEach((text, index) => { if (metricLabels[index]) metricLabels[index].textContent = text; });
          ['1','0','0'].forEach((text, index) => { if (metricValues[index]) metricValues[index].textContent = text; });
          if (resultNote) resultNote.innerHTML = '<strong>回传任务已创建，正在等待目标机器执行采集包。</strong><br />回传后才会进行资产去重和硬件校验；当前没有新增裸金属，更没有生成 Kubernetes Node。';
          if (resultListTitle) resultListTitle.textContent = '回传任务';
          if (resultList) resultList.innerHTML = '<div class="onboard-result-row head"><span>任务</span><span>采集包</span><span>状态</span><span>说明</span></div><div class="onboard-result-row"><span>MC-20260721-0042</span><span>v2.6.1</span><span>等待回传</span><span>注册码 24 小时有效</span></div>';
          if (resultFlow) resultFlow.innerHTML = '<span>执行采集包</span><b>→</b><span>机器信息回传</span><b>→</b><span>校验后进入裸金属池</span>';
          if (resultFootNote) resultFootNote.textContent = '任务可在“运维任务”中继续查看';
          if (continueButton) continueButton.textContent = '返回资源管理';
        } else {
          if (title) title.textContent = '裸金属纳管结果';
          if (subtitle) subtitle.textContent = '2026年7月GPU机器 · 上海一号数据中心';
          ['本次检测','纳管成功','校验失败'].forEach((text, index) => { if (metricLabels[index]) metricLabels[index].textContent = text; });
          ['12','10','2'].forEach((text, index) => { if (metricValues[index]) metricValues[index].textContent = text; });
          if (resultNote) resultNote.innerHTML = '<strong>10 台机器已进入当前数据中心的可用资源池。</strong><br />当前状态为“可用、未分配”，还不是 Kubernetes Node。';
          if (resultListTitle) resultListTitle.textContent = '纳管结果';
          if (resultList) resultList.innerHTML = '<div class="onboard-result-row head"><span>机器／IP</span><span>硬件采集</span><span>结果</span><span>说明</span></div><div class="onboard-result-row"><span>BM-00001121–1130</span><span>8×A100 · 1TB</span><span class="onboard-result-status">成功 10台</span><span>可用、未分配</span></div><div class="onboard-result-row"><span>10.24.18.131</span><span>未完成</span><span class="onboard-result-status failed">失败</span><span>SSH 认证失败</span></div><div class="onboard-result-row"><span>10.24.18.132</span><span>未完成</span><span class="onboard-result-status failed">失败</span><span>BMC 不可达</span></div>';
          if (resultFlow) resultFlow.innerHTML = `<span>裸金属可用</span><b>→</b><span>${machineOnboardTargetCluster ? `扩容 ${machineOnboardTargetCluster}` : '创建新集群'}</span><b>→</b><span>注册为 Node</span>`;
          if (resultFootNote) resultFootNote.textContent = '2 台失败机器可稍后修复并重试';
          if (continueButton) continueButton.textContent = machineOnboardTargetCluster ? `继续加入 ${machineOnboardTargetCluster}` : '继续创建集群';
        }
        const body = layer?.querySelector('.small-dialog-body');
        if (body) body.scrollTop = 0;
      });
      getById('machineOnboardContinue')?.addEventListener('click', () => {
        if (machineOnboardMethod === 'offline') { window.location.hash = machineOnboardReturnHash || ''; return; }
        if (machineOnboardTargetCluster) window.openNodeScale?.('', '2026年7月GPU机器');
        else window.openClusterAccess?.('dc-list', 'remote', '2026年7月GPU机器');
      });

      window.openNodeScale = (returnHash = '', batchName = '') => {
        root.querySelectorAll('.node-scale-layer .overlay-return').forEach((button) => { button.dataset.returnHash = returnHash; });
        const notice = getById('nodeScaleNotice');
        const batchSummary = getById('nodeScaleBatchSummary');
        if (notice) notice.textContent = batchName ? `已自动带入批次“${batchName}”中成功纳管的 10 台机器。平台将下发当前集群已验证的节点组件，执行 join 并等待 Node Ready。` : '从当前数据中心的可用、未分配机器中选择。平台将下发节点组件，执行 join 并等待 Node Ready。';
        if (batchSummary) batchSummary.textContent = batchName || '当前数据中心可用机器';
        window.location.hash = 'node-scale';
      };
      getById('nodeScaleSubmit')?.addEventListener('click', (event) => {
        event.currentTarget.textContent = '任务已创建';
        event.currentTarget.disabled = true;
        setTimeout(() => { window.location.hash = ''; event.currentTarget.textContent = '开始节点扩容'; event.currentTarget.disabled = false; }, 650);
      });

      let clusterWizardStep = 1;
      let clusterMethod = 'existing';
      const clusterMethodLabels = { existing: '接入已有 Kubernetes', remote: '远程部署新集群', offline: '离线软件包接入' };
      const remoteConfigGrid = root.querySelector('[data-method-panel="remote"] .form-section:last-child .form-grid');
      if (remoteConfigGrid && !getById('newClusterSchedulePolicy')) remoteConfigGrid.insertAdjacentHTML('beforeend', '<div class="form-field full"><label for="newClusterSchedulePolicy">节点 Ready 后的调度策略</label><select id="newClusterSchedulePolicy" class="dialog-select"><option>先保持不可调度，运维验收后手动启用</option><option>Ready 后自动启用调度</option></select><div class="field-help">默认不立即承载业务，避免未完成网络、存储和 GPU 验收的新 Node 被调度</div></div>');
      const updateClusterWizard = () => {
        root.querySelectorAll('[data-wizard-panel]').forEach((panel) => panel.classList.toggle('active', Number(panel.dataset.wizardPanel) === clusterWizardStep));
        root.querySelectorAll('[data-wizard-step]').forEach((step) => { const index = Number(step.dataset.wizardStep); step.classList.toggle('active', index === clusterWizardStep); step.classList.toggle('done', index < clusterWizardStep); });
        root.querySelectorAll('[data-method-panel]').forEach((panel) => { panel.style.display = panel.dataset.methodPanel === clusterMethod ? 'block' : 'none'; });
        const prev = getById('clusterWizardPrev'); if (prev) prev.classList.toggle('hidden', clusterWizardStep === 1);
        const next = getById('clusterWizardNext');
        if (next) next.textContent = clusterWizardStep === 3 ? (clusterMethod === 'remote' ? '开始部署并注册 Nodes' : (clusterMethod === 'existing' ? '开始接入并发现 Nodes' : '生成接入任务')) : '下一步';
        const note = getById('clusterWizardFootNote');
        if (note) note.textContent = clusterWizardStep === 1 ? (clusterMethod === 'remote' ? '下一步选择机器并配置 Kubernetes 软件包' : '下一步填写集群连接信息') : (clusterWizardStep === 2 ? '下一步执行预检' : '提交后将在“运维任务”中查看进度');
        const methodSummary = getById('clusterWizardMethodSummary'); if (methodSummary) methodSummary.textContent = clusterMethodLabels[clusterMethod];
        const resultSummary = root.querySelector('[data-wizard-panel="3"] .wizard-summary-item:nth-child(4) strong');
        if (resultSummary) resultSummary.textContent = clusterMethod === 'remote' ? '部署新集群并将选中机器注册为 Nodes' : (clusterMethod === 'existing' ? '接入已有集群，自动发现并关联 Nodes 与裸金属' : '安装接入组件，自动发现并关联 Nodes');
        const connectivitySummary = root.querySelector('[data-wizard-panel="3"] .precheck-row:nth-child(2) .precheck-action');
        if (connectivitySummary) connectivitySummary.textContent = clusterMethod === 'remote' ? '10 台可达' : (clusterMethod === 'existing' ? 'API Server 可达' : '目标环境待回连');
      };
      const hideClusterDeployResult = () => {
        const layer = root.querySelector('.cluster-create-layer');
        if (layer) layer.classList.remove('show-deploy-result');
        const title = getById('clusterCreateTitle');
        const subtitle = getById('clusterCreateSubtitle');
        if (title) title.textContent = '创建／接入 Kubernetes 集群';
        if (subtitle) subtitle.textContent = '集群只使用当前数据中心的机器，不跨供应商或数据中心';
      };
      window.hideClusterDeployResult = hideClusterDeployResult;
      const showClusterDeployResult = () => {
        const layer = root.querySelector('.cluster-create-layer');
        if (layer) layer.classList.add('show-deploy-result');
        const title = getById('clusterCreateTitle');
        const subtitle = getById('clusterCreateSubtitle');
        const heading = getById('clusterResultHeading');
        const description = getById('clusterResultDescription');
        const status = getById('clusterResultStatus');
        const labels = [getById('clusterResultMetric1Label'), getById('clusterResultMetric2Label'), getById('clusterResultMetric3Label')];
        const values = [getById('clusterResultMetric1'), getById('clusterResultMetric2'), getById('clusterResultMetric3')];
        const stages = getById('clusterDeployStageList');
        const explain = getById('clusterResultExplain');
        if (clusterMethod === 'remote') {
          if (title) title.textContent = '新集群部署任务';
          if (subtitle) subtitle.textContent = 'gpu-prod-02 · 远程部署 Kubernetes v1.36.2';
          if (heading) heading.textContent = '新集群部署任务已创建';
          if (description) description.textContent = 'gpu-prod-02 正在部署；Node 注册和 Ready 验收会继续在后台执行';
          if (status) status.textContent = '执行中';
          ['控制面部署','Node 已注册','Node Ready'].forEach((text, index) => { if (labels[index]) labels[index].textContent = text; });
          ['3/3','8/10','7/10'].forEach((text, index) => { if (values[index]) values[index].textContent = text; });
          if (stages) stages.innerHTML = '<div class="deploy-stage-row"><div class="deploy-stage-name"><strong>控制面初始化</strong><small>API Server · etcd · Controller</small></div><div class="deploy-stage-progress"><span style="width:100%"></span></div><span class="deploy-stage-state done">完成 3/3</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>节点组件安装与 join</strong><small>container runtime · kubelet · CNI</small></div><div class="deploy-stage-progress"><span style="width:80%"></span></div><span class="deploy-stage-state">注册 8/10</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>Node Ready 验收</strong><small>节点条件、网络、存储与 GPU 组件</small></div><div class="deploy-stage-progress"><span style="width:70%"></span></div><span class="deploy-stage-state">Ready 7/10</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>失败机器</strong><small>BM-00001129 · BM-00001130</small></div><div>一台 kubelet 启动失败，一台 CNI 未就绪</div><span class="deploy-stage-state failed">2 台待重试</span></div>';
          if (explain) explain.textContent = 'Node 对象在 kubelet 成功 join 后才会出现；本次已注册 8 个，其中 7 个 Ready。新 Node 默认保持不可调度，待运维验收后再启用调度。';
        } else if (clusterMethod === 'existing') {
          if (title) title.textContent = '已有集群接入任务';
          if (subtitle) subtitle.textContent = '只读连接 Kubernetes API，不重装或更改现有集群';
          if (heading) heading.textContent = '集群连接和资源发现任务已创建';
          if (description) description.textContent = '平台正在发现 Nodes，并根据管理 IP 与机器 UUID 关联裸金属';
          if (status) status.textContent = '发现中';
          ['API 连接','发现 Nodes','关联裸金属'].forEach((text, index) => { if (labels[index]) labels[index].textContent = text; });
          ['成功','80','78/80'].forEach((text, index) => { if (values[index]) values[index].textContent = text; });
          if (stages) stages.innerHTML = '<div class="deploy-stage-row"><div class="deploy-stage-name"><strong>API Server 连接</strong><small>权限与证书校验</small></div><div class="deploy-stage-progress"><span style="width:100%"></span></div><span class="deploy-stage-state done">完成</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>Node 发现</strong><small>读取 Node UID、Internal IP 和状态</small></div><div class="deploy-stage-progress"><span style="width:100%"></span></div><span class="deploy-stage-state done">80 个</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>裸金属关联</strong><small>根据 IP 和机器 UUID 匹配</small></div><div class="deploy-stage-progress"><span style="width:97.5%"></span></div><span class="deploy-stage-state">78/80</span></div>';
          if (explain) explain.textContent = '接入已有集群不会新建 Node；这些 Node 本来就属于该集群，平台只负责发现、监控并关联裸金属资产。它们不会进入未分配机器池；Ready 且允许调度只表示可在当前集群承载 Pods。';
        } else {
          if (title) title.textContent = '离线集群接入任务';
          if (subtitle) subtitle.textContent = '等待目标环境执行接入包并回连';
          if (heading) heading.textContent = '离线接入任务已生成';
          if (description) description.textContent = '一次性注册码在 24 小时内有效';
          if (status) status.textContent = '等待回连';
          ['接入包','注册码','Node 发现'].forEach((text, index) => { if (labels[index]) labels[index].textContent = text; });
          ['已生成','24小时','待回连'].forEach((text, index) => { if (values[index]) values[index].textContent = text; });
          if (stages) stages.innerHTML = '<div class="deploy-stage-row"><div class="deploy-stage-name"><strong>生成离线接入包</strong><small>包含平台 Agent 与版本校验</small></div><div class="deploy-stage-progress"><span style="width:100%"></span></div><span class="deploy-stage-state done">完成</span></div><div class="deploy-stage-row"><div class="deploy-stage-name"><strong>目标环境回连</strong><small>等待在目标网络执行接入命令</small></div><div class="deploy-stage-progress"><span style="width:12%"></span></div><span class="deploy-stage-state">等待中</span></div>';
          if (explain) explain.textContent = '回连成功后，平台才会读取集群和 Node 信息；此时不会安装新的 Kubernetes 集群。';
        }
        const body = layer?.querySelector('.small-dialog-body');
        if (body) body.scrollTop = 0;
      };
      window.openClusterAccess = (returnHash = 'dc-list', method = 'existing', preselectedBatch = '') => {
        hideClusterDeployResult();
        clusterWizardStep = 1;
        clusterMethod = method;
        root.querySelectorAll('.cluster-method').forEach((item) => item.classList.toggle('selected', item.dataset.clusterMethod === method));
        root.querySelectorAll('.cluster-create-layer .overlay-return').forEach((button) => { button.dataset.returnHash = returnHash; });
        const selectionHelp = getById('clusterMachineSelectionHelp');
        if (selectionHelp) selectionHelp.textContent = preselectedBatch ? `已自动带入批次“${preselectedBatch}”纳管成功的 10 台机器；前 3 台已设为控制面。` : '当前数据中心有 18 台未分配机器；至少选择 3 台控制面机器。';
        root.querySelectorAll('[data-method-panel="remote"] .machine-pool-row').forEach((row, index) => {
          const hardware = row.children[2];
          if (hardware && index < 3) hardware.textContent = preselectedBatch ? '8×A100 · 1TB' : '64C · 512G';
        });
        updateClusterWizard();
        window.location.hash = 'cluster-create';
      };
      root.querySelectorAll('.cluster-method').forEach((card) => card.addEventListener('click', () => { clusterMethod = card.dataset.clusterMethod; root.querySelectorAll('.cluster-method').forEach((item) => item.classList.toggle('selected', item === card)); updateClusterWizard(); }));
      getById('clusterWizardPrev')?.addEventListener('click', () => { clusterWizardStep = Math.max(1, clusterWizardStep - 1); updateClusterWizard(); });
      getById('clusterWizardNext')?.addEventListener('click', () => { if (clusterWizardStep < 3) { clusterWizardStep += 1; updateClusterWizard(); } else showClusterDeployResult(); });
      getById('clusterResultBack')?.addEventListener('click', hideClusterDeployResult);
      getById('clusterResultDone')?.addEventListener('click', () => { hideClusterDeployResult(); window.location.hash = ''; });
      getById('dcCreateCluster')?.addEventListener('click', () => { clusterWizardStep = 1; clusterMethod = 'existing'; root.querySelectorAll('.cluster-method').forEach((item) => item.classList.toggle('selected', item.dataset.clusterMethod === 'existing')); updateClusterWizard(); });
      updateClusterWizard();

      const nodeDetails = {
        'gpu-node-07': { status: 'NotReady', role: 'Worker', type: 'GPU', ip: '10.24.18.107', bm: 'BM-00001027', time: '3 分钟前', ready: 'False', diskPressure: 'False', cpu: '84%', cpuMeta: 'Requests 76% · 128 核', memory: '71%', memoryMeta: 'Requests 72% · 1.0 TB', gpu: '7／8 · 92%', gpuMeta: '2 张 A100 出现 Xid', gpuBad: true, disk: '68%', diskMeta: '12.8 TB · 无 DiskPressure', network: '1.8／1.2 Gbps', networkMeta: 'bond0 丢包 4.8%', networkBad: true, pods: '32／110', podsMeta: '5 个异常 · 影响 2 Services', podsBad: true, events: 7, freshness: '监控数据停留在 3 分钟前', stale: true, impact: 'Node NotReady → Kubelet 心跳中断 → BM-00001027 物理网卡丢包。<br>已定位到对应物理机器，影响 5 个 Pods／2 个 Services。' },
        'gpu-node-52': { status: 'NotReady', role: 'Worker', type: 'GPU', ip: '10.24.18.152', bm: 'BM-00001102', time: '18 分钟前', ready: 'False', diskPressure: 'False', cpu: '—', cpuMeta: 'Requests 41% · 监控不可用', memory: '—', memoryMeta: 'Requests 58% · 监控不可用', gpu: '4／8 · —', gpuMeta: 'A100 · 状态未知', gpuBad: false, disk: '—', diskMeta: '最后数据已超过 18 分钟', network: '—', networkMeta: '对应物理机器硬件健康', networkBad: false, pods: '9／110', podsMeta: '9 个异常', podsBad: true, events: 5, freshness: '监控数据停留在 18 分钟前', stale: true, impact: 'Node NotReady → Kubelet 18 分钟未上报。<br>对应物理机器硬件健康，正在排查操作系统、Kubelet 和网络链路。' },
        'gpu-node-12': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.112', bm: 'BM-00001032', time: '24 秒前', ready: 'True', diskPressure: 'True', cpu: '77%', cpuMeta: 'Requests 79% · 128 核', memory: '82%', memoryMeta: 'Requests 84% · 1.0 TB', gpu: '6／8 · 85%', gpuMeta: '2 张 A100 高温', gpuBad: true, disk: '92%', diskMeta: 'DiskPressure · 容量风险', diskBad: true, network: '1.4／1.1 Gbps', networkMeta: '网络正常', networkBad: false, pods: '88／110', podsMeta: '0 个异常', podsBad: false, events: 4, freshness: '监控数据更新于 24 秒前', stale: false, impact: 'Node Ready，但检测到 DiskPressure 和 2 张 GPU 高温。<br>当前已暂停调度，建议先释放磁盘容量并检查 GPU 散热。' },
        'gpu-node-18': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.118', bm: 'BM-00001045', time: '18 秒前', ready: 'True', diskPressure: 'False', cpu: '68%', cpuMeta: 'Requests 72% · 128 核', memory: '74%', memoryMeta: 'Requests 76% · 1.0 TB', gpu: '8／8 · 81%', gpuMeta: 'A100 · 健康', gpuBad: false, disk: '61%', diskMeta: '12.8 TB · 正常', network: '1.2／1.0 Gbps', networkMeta: '网络正常', networkBad: false, pods: '96／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 18 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' },
        'gpu-node-23': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.123', bm: 'BM-00001050', time: '15 秒前', ready: 'True', diskPressure: 'False', cpu: '62%', cpuMeta: 'Requests 67% · 128 核', memory: '69%', memoryMeta: 'Requests 74% · 1.0 TB', gpu: '6／8 · 63%', gpuMeta: 'A100 · 健康', gpuBad: false, disk: '57%', diskMeta: '12.8 TB · 正常', network: '1.0／0.9 Gbps', networkMeta: '网络正常', networkBad: false, pods: '72／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 15 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' },
        'cpu-node-04': { status: 'Ready', role: 'Worker', type: 'CPU', ip: '10.24.18.204', bm: 'BM-00001093', time: '12 秒前', ready: 'True', diskPressure: 'False', cpu: '55%', cpuMeta: 'Requests 60% · 128 核', memory: '66%', memoryMeta: 'Requests 70% · 512 GB', gpu: '—', gpuMeta: '无 GPU', gpuBad: false, disk: '49%', diskMeta: '8.0 TB · 正常', network: '0.8／0.7 Gbps', networkMeta: '网络正常', networkBad: false, pods: '104／110', podsMeta: '0 个异常', podsBad: false, events: 2, freshness: '监控数据更新于 12 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes 或硬件异常。' },
        'gpu-node-31': { status: 'Ready', role: 'Worker', type: 'GPU', ip: '10.24.18.131', bm: 'BM-00001068', time: '21 秒前', ready: 'True', diskPressure: 'False', cpu: '49%', cpuMeta: 'Requests 58% · 128 核', memory: '61%', memoryMeta: 'Requests 68% · 1.0 TB', gpu: '8／8 · 78%', gpuMeta: 'A800 · 健康', gpuBad: false, disk: '52%', diskMeta: '12.8 TB · 正常', network: '1.1／0.9 Gbps', networkMeta: '网络正常', networkBad: false, pods: '90／110', podsMeta: '0 个异常', podsBad: false, events: 1, freshness: '监控数据更新于 21 秒前', stale: false, normal: true, impact: '当前 Node 运行正常，未发现 Kubernetes、硬件或 GPU 异常。' }
      };
      const nodeIssueDetails = {
        'gpu-node-07': { abnormalPods: 5, issues: [['Kubernetes', 'NotReady · Kubelet 3 分钟未上报'], ['物理机器', 'BM-00001027 · bond0 丢包 4.8%'], ['GPU', '2 张 A100 出现 Xid']], impact: '<strong>影响范围</strong>：5 个异常 Pods · 影响 2 个 Services。' },
        'gpu-node-52': { abnormalPods: 9, issues: [['Kubernetes', 'NotReady · Kubelet 18 分钟未上报']], impact: '<strong>影响范围</strong>：该 Node 上 9 个 Pods 状态异常；物理机器硬件健康。' },
        'gpu-node-12': { abnormalPods: 0, issues: [['Kubernetes', 'DiskPressure · 本地盘使用率 92%'], ['GPU', '2 张 A100 温度过高']], impact: '<strong>影响范围</strong>：已暂停接收新 Pod；现有 88 个 Pods 继续运行。' },
        'gpu-node-18': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
        'gpu-node-23': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
        'cpu-node-04': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true },
        'gpu-node-31': { abnormalPods: 0, issues: [['运行状态', '当前未发现异常']], impact: '当前 Node 运行正常。', normal: true }
      };
      const nodeContextDetails = {
        'gpu-node-07': { manual: '未禁止调度', result: '不可参与（NotReady）', resultBad: true, taints: 'unreachable:NoSchedule', labels: 'worker · gpu · a100' },
        'gpu-node-52': { manual: '未禁止调度', result: '不可参与（NotReady）', resultBad: true, taints: 'unreachable:NoSchedule', labels: 'worker · gpu · a100' },
        'gpu-node-12': { manual: '已禁止调度', result: '不可参与（人工禁止）', resultBad: true, taints: 'disk-pressure:NoSchedule', labels: 'worker · gpu · a100' },
        'gpu-node-18': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a100' },
        'gpu-node-23': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a100' },
        'cpu-node-04': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · cpu' },
        'gpu-node-31': { manual: '未禁止调度', result: '可参与调度', resultBad: false, taints: '无', labels: 'worker · gpu · a800' }
      };
      const setText = (id, value) => { const element = getById(id); if (element) element.textContent = value; };
      const setMeta = (id, value, bad) => { const element = getById(id); if (element) { element.textContent = value; element.classList.toggle('bad', Boolean(bad)); } };
      const renderNodeDetail = (nodeName) => {
        const detail = nodeDetails[nodeName];
        const issueDetail = nodeIssueDetails[nodeName];
        const contextDetail = nodeContextDetails[nodeName];
        if (!detail) return;
        setText('detailNodeName', nodeName);
        const status = getById('detailNodeStatus');
        if (status) { status.textContent = detail.status; status.className = `node-status${detail.status === 'NotReady' ? ' bad' : ''}`; }
        setText('detailNodeId', `${detail.role} · ${detail.type} · ${detail.ip}`);
        setText('detailBmLink', `查看物理机器 ${detail.bm} →`);
        setText('detailBmValue', detail.bm);
        const ready = getById('detailReady');
        if (ready) { ready.textContent = detail.ready; ready.className = `condition-state${detail.ready === 'False' ? ' bad' : ''}`; }
        setText('detailReadyTime', detail.time);
        root.querySelectorAll('.detail-condition-time').forEach((element) => { element.textContent = detail.time; });
        ['detailMemoryPressure', 'detailPidPressure', 'detailNetworkUnavailable'].forEach((id) => { const element = getById(id); if (element) { element.textContent = 'False'; element.className = 'condition-state'; } });
        const diskPressure = getById('detailDiskPressure');
        if (diskPressure) { diskPressure.textContent = detail.diskPressure; diskPressure.className = `condition-state${detail.diskPressure === 'True' ? ' bad' : ''}`; }
        if (contextDetail) {
          setText('detailManualSchedule', contextDetail.manual);
          setText('detailScheduleResult', contextDetail.result);
          setText('detailTaints', contextDetail.taints);
          setText('detailLabels', contextDetail.labels);
          const scheduleResult = getById('detailScheduleResult');
          if (scheduleResult) scheduleResult.classList.toggle('bad', contextDetail.resultBad);
        }
        setText('detailCpu', detail.cpu); setText('detailCpuMeta', detail.cpuMeta);
        setText('detailMemory', detail.memory); setText('detailMemoryMeta', detail.memoryMeta);
        setText('detailGpu', detail.gpu); setMeta('detailGpuMeta', detail.gpuMeta, detail.gpuBad);
        setText('detailDisk', detail.disk); setMeta('detailDiskMeta', detail.diskMeta, detail.diskBad);
        setText('detailNetwork', detail.network); setMeta('detailNetworkMeta', detail.networkMeta, detail.networkBad);
        setText('detailPods', detail.pods); setMeta('detailPodsMeta', detail.podsMeta, detail.podsBad);
        const abnormalPods = issueDetail ? issueDetail.abnormalPods : 0;
        setText('detailPodsLink', abnormalPods > 0 ? `查看 ${abnormalPods} 个异常 Pods →` : `查看该 Node 上的 ${detail.pods.split('／')[0]} 个 Pods →`);
        setText('detailEventsLink', `查看 ${detail.events} 条相关事件 →`);
        const freshness = getById('detailFreshness');
        if (freshness) { freshness.textContent = detail.freshness; freshness.classList.toggle('fresh', !detail.stale); }
        const issueList = getById('detailIssueList');
        if (issueList && issueDetail) {
          issueList.innerHTML = issueDetail.issues.map(([source, text]) => `<div class="node-issue-row${issueDetail.normal ? ' normal' : ''}"><span class="node-issue-source">${source}</span><span class="node-issue-text">${text}</span></div>`).join('');
        }
        const impact = getById('detailImpact');
        if (impact && issueDetail) { impact.innerHTML = issueDetail.impact; impact.classList.toggle('normal', Boolean(issueDetail.normal)); }
      };
      root.querySelectorAll('.node-row[data-node]').forEach((row) => row.addEventListener('click', () => {
        root.querySelectorAll('.node-row').forEach((item) => item.classList.remove('selected'));
        row.classList.add('selected');
        renderNodeDetail(row.dataset.node);
      }));

      const rows = Array.from(root.querySelectorAll('.node-row[data-node]'));
      const summaryFilters = Array.from(root.querySelectorAll('.node-summary-filter'));
      const listMeta = getById('nodesListMeta');
      const paginationMeta = getById('nodesPaginationMeta');
      const paginationPages = getById('nodesPaginationPages');
      const applyNodeFilter = (filter, button) => {
        const resetToAll = button.classList.contains('active') && filter !== 'all';
        const activeFilter = resetToAll ? 'all' : filter;
        summaryFilters.forEach((item) => item.classList.toggle('active', item.dataset.nodeFilter === activeFilter));
        const visibleRows = rows.filter((row) => {
          const issues = row.dataset.issues.split(' ').filter(Boolean);
          const visible = activeFilter === 'all' || (activeFilter === 'attention' ? row.dataset.attention === 'true' : issues.includes(activeFilter));
          row.style.display = visible ? 'grid' : 'none';
          return visible;
        });
        const activeButton = summaryFilters.find((item) => item.dataset.nodeFilter === activeFilter);
        const total = activeFilter === 'all' ? 80 : Number(activeButton.dataset.filterTotal || visibleRows.length);
        if (listMeta) listMeta.textContent = activeFilter === 'all' ? '按影响优先 · 共 80 个 Node · 3 个需关注' : `已筛选：${activeButton.dataset.filterLabel} · ${total} 个 Node`;
        if (paginationMeta) paginationMeta.textContent = activeFilter === 'all' ? '显示 1–7，共 80 个 Nodes' : `显示 ${visibleRows.length} 个，共 ${total} 个 Nodes`;
        if (paginationPages) paginationPages.style.visibility = activeFilter === 'all' ? 'visible' : 'hidden';
        const selectedVisible = visibleRows.includes(root.querySelector('.node-row.selected'));
        if (!selectedVisible && visibleRows[0]) {
          rows.forEach((row) => row.classList.remove('selected'));
          visibleRows[0].classList.add('selected');
          renderNodeDetail(visibleRows[0].dataset.node);
        }
      };
      summaryFilters.forEach((button) => button.addEventListener('click', () => applyNodeFilter(button.dataset.nodeFilter, button)));

      const workloadDetails = {
        'payment-api': {
          kind: 'Deployment', status: '需关注', statusClass: '', scope: '项目A／payment', created: '2026-05-18 14:22', strategy: 'RollingUpdate', image: 'payment-api:v2.4.1', changed: '10分钟前更新镜像',
          replicas: [['期望', '5'], ['已更新', '5'], ['Ready', '3', true], ['Available', '3', true]],
          conditions: [['Available', 'False', 'MinimumReplicasUnavailable', true], ['Progressing', 'False', 'ProgressDeadlineExceeded', true]],
          issues: [['payment-api-7d8f-2kv9f', 'Pod', 'NotReady', true], ['payment-api-7d8f-7sk2h', 'Pod', 'NotReady', true]],
          impact: 'Workload副本不足 → 2个Pods未就绪 → <strong>gpu-node-07 NotReady</strong> → BM-00001027网卡丢包。<br>payment-service 后端就绪 3／5，存在服务降级风险。',
          podsLink: '查看2个异常Pods →', targetLabel: '查看gpu-node-07 →', targetNode: 'gpu-node-07', events: 6
        },
        'model-cache': {
          kind: 'StatefulSet', status: '需关注', statusClass: '', scope: '项目B／inference', created: '2026-04-02 09:18', strategy: 'RollingUpdate／OrderedReady', image: 'redis:7.2.5', changed: '18分钟前Pod重建',
          replicas: [['期望', '3'], ['当前', '3'], ['Ready', '2', true], ['Available', '2', true]],
          conditions: [['Ready', 'False', 'model-cache-2未就绪', true], ['PVC绑定', 'True', '卷已绑定，挂载超时', false]],
          issues: [['model-cache-2', 'Pod', 'Pending', true], ['pvc-model-cache-2', 'PVC', '挂载超时', true]],
          impact: 'StatefulSet副本不足 → model-cache-2 Pending → <strong>持久卷挂载超时</strong>。<br>读缓存能力降为 2／3，尚未影响数据一致性。',
          podsLink: '查看1个异常Pod →', targetLabel: '查看关联PVC →', targetNode: '', events: 4
        },
        'training-worker': {
          kind: 'Deployment', status: '更新中', statusClass: 'progress', scope: '项目B／training', created: '2026-06-10 16:40', strategy: 'RollingUpdate', image: 'trainer:v1.8.0', changed: '2分钟前更新镜像',
          replicas: [['期望', '12'], ['已更新', '10'], ['Ready', '10'], ['Available', '10']],
          conditions: [['Available', 'True', 'MinimumReplicasAvailable', false], ['Progressing', 'True', 'ReplicaSetUpdated', false]],
          issues: [['training-worker-6d5f-9p2cj', 'Pod', 'ContainerCreating', false], ['training-worker-6d5f-q7m4x', 'Pod', 'ContainerCreating', false]],
          impact: '滚动发布正常推进，10／12个副本已就绪；<strong>当前没有异常</strong>。', normal: true,
          podsLink: '查看12个Pods →', targetLabel: '查看发布记录 →', targetNode: '', events: 3
        },
        'dataset-index': {
          kind: 'Job', status: '执行中', statusClass: 'progress', scope: '项目C／data-pipeline', created: '2026-07-21 10:22', strategy: '并行度6／完成数24', image: 'indexer:v3.6.2', changed: '6分钟前开始执行',
          replicas: [['目标完成', '24'], ['已完成', '18'], ['Active', '6'], ['Failed', '0']],
          conditions: [['Complete', 'False', '任务仍在执行', false], ['Failed', 'False', '无失败重试', false]],
          issues: [['dataset-index', 'Job', '执行进度75%', false]],
          impact: '任务执行进度正常，当前6个Pods并行运行；<strong>预计8分钟完成</strong>。', normal: true,
          podsLink: '查看6个运行Pods →', targetLabel: '查看任务日志 →', targetNode: '', events: 2
        },
        'order-api': {
          kind: 'Deployment', status: '正常', statusClass: 'normal', scope: '项目A／order', created: '2026-03-12 11:08', strategy: 'RollingUpdate', image: 'order-api:v5.3.0', changed: '3天前发布完成',
          replicas: [['期望', '8'], ['已更新', '8'], ['Ready', '8'], ['Available', '8']],
          conditions: [['Available', 'True', 'MinimumReplicasAvailable', false], ['Progressing', 'True', 'NewReplicaSetAvailable', false]],
          issues: [['order-api', 'Deployment', '当前未发现异常', false]],
          impact: '全部副本可用，当前Workload运行正常。', normal: true,
          podsLink: '查看8个Pods →', targetLabel: '查看发布记录 →', targetNode: '', events: 1
        },
        'node-exporter': {
          kind: 'DaemonSet', status: '正常', statusClass: 'normal', scope: '平台运维／monitoring', created: '2026-01-15 10:12', strategy: 'RollingUpdate', image: 'node-exporter:v1.8.1', changed: '12天内无配置变化',
          replicas: [['期望节点', '78'], ['当前调度', '78'], ['Ready', '78'], ['Unavailable', '0']],
          conditions: [['Available', 'True', '目标节点全部覆盖', false], ['Updating', 'False', '当前无滚动更新', false]],
          issues: [['node-exporter', 'DaemonSet', '当前未发现异常', false]],
          impact: '目标节点全部覆盖，当前DaemonSet运行正常。', normal: true,
          podsLink: '查看78个Pods →', targetLabel: '查看目标Nodes →', targetNode: '', events: 1
        },
        'nightly-report': {
          kind: 'CronJob', status: '正常', statusClass: 'normal', scope: '项目D／ops', created: '2026-02-20 08:30', strategy: '0 1 * * *', image: 'reporter:v2.1.4', changed: '2小时前执行成功',
          replicas: [['最近执行', '成功'], ['当前Active', '0'], ['失败', '0'], ['下次执行', '01:00']],
          conditions: [['Suspended', 'False', '定时调度已启用', false], ['LastSchedule', '成功', '2小时前完成', false]],
          issues: [['nightly-report', 'CronJob', '当前未发现异常', false]],
          impact: '最近一次任务执行成功，下一次计划时间为01:00。', normal: true,
          podsLink: '查看执行历史 →', targetLabel: '查看最近Job →', targetNode: '', events: 1
        }
      };

      const renderWorkloadDetail = (workloadName) => {
        const detail = workloadDetails[workloadName];
        if (!detail) return;
        setText('workloadDetailName', workloadName);
        setText('workloadDetailMeta', `${detail.kind} · ${detail.scope}`);
        setText('workloadDetailKind', detail.kind);
        setText('workloadDetailCreated', detail.created);
        setText('workloadDetailScope', detail.scope);
        setText('workloadDetailStrategy', detail.strategy);
        setText('workloadDetailImage', detail.image);
        setText('workloadDetailChanged', detail.changed);
        const detailStatus = getById('workloadDetailStatus');
        if (detailStatus) { detailStatus.textContent = detail.status; detailStatus.className = `workload-detail-status${detail.statusClass ? ` ${detail.statusClass}` : ''}`; }
        const replicaGrid = getById('workloadReplicaGrid');
        if (replicaGrid) replicaGrid.innerHTML = detail.replicas.map(([label, value, bad]) => `<div class="workload-replica-item"><small>${label}</small><strong${bad ? ' class="bad"' : ''}>${value}</strong></div>`).join('');
        const conditionList = getById('workloadConditionList');
        if (conditionList) conditionList.innerHTML = detail.conditions.map(([type, state, reason, bad]) => `<div class="workload-condition-row"><span>${type}</span><strong class="workload-condition-state${bad ? ' bad' : ''}">${state}</strong><span class="workload-condition-reason">${reason}</span></div>`).join('');
        const issueList = getById('workloadIssueList');
        if (issueList) issueList.innerHTML = detail.issues.map(([name, kind, state, bad]) => `<div class="workload-issue-row"><span><strong>${name}</strong> · ${kind}</span><span class="workload-issue-state${bad ? '' : ' normal'}">${state}</span></div>`).join('');
        const impact = getById('workloadImpact');
        if (impact) { impact.innerHTML = detail.impact; impact.classList.toggle('normal', Boolean(detail.normal)); }
        setText('workloadPodsLink', detail.podsLink);
        setText('workloadEventsLink', `查看${detail.events}条相关事件 →`);
        const targetLink = getById('workloadNodeLink');
        if (targetLink) { targetLink.textContent = detail.targetLabel; targetLink.dataset.node = detail.targetNode; }
      };

      const workloadRows = Array.from(root.querySelectorAll('.workload-row[data-workload]'));
      workloadRows.forEach((row) => row.addEventListener('click', () => {
        workloadRows.forEach((item) => item.classList.remove('selected'));
        row.classList.add('selected');
        renderWorkloadDetail(row.dataset.workload);
      }));

      const workloadSummaryFilters = Array.from(root.querySelectorAll('.workload-summary-filter'));
      const workloadsListMeta = getById('workloadsListMeta');
      const workloadsPaginationMeta = getById('workloadsPaginationMeta');
      const workloadsPaginationPages = getById('workloadsPaginationPages');
      const applyWorkloadFilter = (filter, button) => {
        const resetToAll = button.classList.contains('active') && filter !== 'all';
        const activeFilter = resetToAll ? 'all' : filter;
        workloadSummaryFilters.forEach((item) => item.classList.toggle('active', item.dataset.workloadFilter === activeFilter));
        const visibleRows = workloadRows.filter((row) => {
          const visible = activeFilter === 'all' || row.dataset.health === activeFilter;
          row.style.display = visible ? 'grid' : 'none';
          return visible;
        });
        const activeButton = workloadSummaryFilters.find((item) => item.dataset.workloadFilter === activeFilter);
        const total = activeFilter === 'all' ? 126 : Number(activeButton.dataset.filterTotal || visibleRows.length);
        if (workloadsListMeta) workloadsListMeta.textContent = activeFilter === 'all' ? '按问题优先 · 共 126 个 · 2 个需关注' : `已筛选：${activeButton.dataset.filterLabel} · ${total} 个 Workload`;
        if (workloadsPaginationMeta) workloadsPaginationMeta.textContent = activeFilter === 'all' ? '显示 1–7，共 126 个 Workloads' : `当前页显示 ${visibleRows.length} 个，共 ${total} 个 Workloads`;
        if (workloadsPaginationPages) workloadsPaginationPages.style.visibility = activeFilter === 'all' ? 'visible' : 'hidden';
        const selectedVisible = visibleRows.includes(root.querySelector('.workload-row.selected'));
        if (!selectedVisible && visibleRows[0]) visibleRows[0].click();
      };
      workloadSummaryFilters.forEach((button) => button.addEventListener('click', () => applyWorkloadFilter(button.dataset.workloadFilter, button)));

      const workloadNodeLink = getById('workloadNodeLink');
      if (workloadNodeLink) workloadNodeLink.addEventListener('click', (event) => {
        event.stopPropagation();
        const nodeName = workloadNodeLink.dataset.node;
        if (!nodeName) return;
        const allNodesButton = root.querySelector('.node-summary-filter[data-node-filter="all"]');
        if (allNodesButton) applyNodeFilter('all', allNodesButton);
        window.location.hash = 'nodes';
        const nodeRow = root.querySelector(`.node-row[data-node="${nodeName}"]`);
        if (nodeRow) nodeRow.click();
      });
    })();

(() => {
      const stats = root.querySelectorAll('.tree-stats span');
      const wire = (i, hash) => { const el = stats[i]; if (!el) return; el.classList.add('clickable'); el.addEventListener('click', () => { window.location.hash = hash; }); };
      wire(0, 'supplier-list');
      wire(1, 'dc-list');
    })();

(() => {
      // 左上角返回按钮（二级页面）
      root.querySelectorAll('.small-page-layer').forEach((layer) => {
        if (layer.classList.contains('resource-files-layer') || layer.classList.contains('supplier-create-layer') || layer.classList.contains('dc-create-layer')) return;
        const head = layer.querySelector('.small-dialog-head');
        if (!head || head.querySelector('.dialog-back')) return;
        const closeBtn = layer.querySelector('.small-dialog-close');
        let hash = (closeBtn && closeBtn.dataset.returnHash) ? closeBtn.dataset.returnHash : '';
        if (!hash && layer.classList.contains('supplier-create-layer')) hash = 'supplier-list';
        const back = document.createElement('button');
        back.type = 'button'; back.className = 'dialog-back'; back.textContent = '\u2039 \u8fd4\u56de';
        back.addEventListener('click', () => {
          if (layer.classList.contains('machine-onboard-layer') && layer.classList.contains('show-result')) {
            window.resetMachineOnboardView?.();
            return;
          }
          if (layer.classList.contains('cluster-create-layer')) {
            if (layer.classList.contains('show-deploy-result')) {
              window.hideClusterDeployResult?.();
              return;
            }
            const ap = layer.querySelector('.wizard-panel.active');
            const step = ap ? Number(ap.dataset.wizardPanel) : 1;
            if (step > 1) { getById('clusterWizardPrev')?.click(); return; }
          }
          window.location.hash = (closeBtn && closeBtn.dataset.returnHash) ? closeBtn.dataset.returnHash : hash;
        });
        head.insertBefore(back, head.firstChild);
        if (closeBtn) closeBtn.style.marginLeft = 'auto';
        head.style.justifyContent = 'flex-start';
      });
      // 新建下拉
      const addWrap = root.querySelector('.tree-add-wrap');
      const addBtn = getById('treeAddBtn');
      if (addBtn && addWrap) {
        addBtn.addEventListener('click', (e) => { e.stopPropagation(); addWrap.classList.toggle('open'); });
        document.addEventListener('click', () => addWrap.classList.remove('open'));
        addWrap.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { window.location.hash = b.dataset.add; addWrap.classList.remove('open'); }));
      }
      // 从供应商创建数据中心时自动带入所属供应商
      const presetDcSupplier = () => {
        const name = (getById('supplierDetailName')?.textContent || '').trim();
        const sel = getById('dcSupplier');
        if (sel && name) Array.from(sel.options).forEach((o) => { if (o.textContent.trim() === name) sel.value = o.value; });
      };
      getById('supplierCreateDc')?.addEventListener('click', presetDcSupplier);
      // 创建供应商必填通过后回到供应商列表
      const submit = getById('supplierCreateSubmit');
      if (submit) submit.addEventListener('click', () => {
        const ok = Array.from(root.querySelectorAll('.supplier-create-layer [data-required-field] .dialog-input')).every((i) => i.value.trim());
        if (ok) window.location.hash = 'supplier-list';
      });
    })();

(() => {
      const accEl = getById('archiveAccordion');
      if (!accEl) return;
      const toast = (m) => { let t=getById('_acctoast'); if(!t){t=document.createElement('div');t.id='_acctoast';t.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:300;background:#1d2129;color:#fff;padding:8px 14px;border-radius:7px;font-size:10px;opacity:0;transition:opacity .2s;pointer-events:none';root.appendChild(t);} t.textContent=m;t.style.opacity='1';clearTimeout(t._x);t._x=setTimeout(()=>{t.style.opacity='0';},1800); };
      const stCls = (st) => st==='attention'?' attention':st==='pending'?' disabled':'';
      const stLabel = { normal:'合作中', attention:'需关注', pending:'待接入' };
      const ARCHIVE = [
        { st:'normal', name:'厂商A · xxx科技', code:'SUP-2026-001', type:'算力／裸金属', region:'华东', coverage:'上海', dc:2, clusters:2, machines:106,
          search:'厂商a xxx科技 李敏 上海一号 上海二号 gpu-prod-01 gpu-test-sh-01',
          dcs:[
            { name:'上海一号数据中心', code:'DC-SH-001', loc:'上海·浦东', st:'attention', status:'1 项异常', machines:106, clusterList:[
              { name:'gpu-prod-01', k8s:'v1.36.2', nodes:80, st:'attention', status:'有异常' },
              { name:'gpu-test-sh-01', k8s:'v1.36.2', nodes:24, st:'normal', status:'健康' } ] },
            { name:'上海二号数据中心', code:'DC-SH-002', loc:'上海·临港', st:'pending', status:'待接入', machines:0, clusterList:[] } ] },
        { st:'attention', name:'厂商B · 中原算力', code:'SUP-2026-002', type:'算力／裸金属', region:'华中', coverage:'郑州', dc:1, clusters:2, machines:96,
          search:'厂商b 中原算力 王工 郑州 gpu-prod-01 gpu-dev-zz-01',
          dcs:[
            { name:'郑州高新数据中心', code:'DC-ZZ-001', loc:'河南·郑州', st:'normal', status:'运行中', machines:96, clusterList:[
              { name:'gpu-prod-01', k8s:'v1.35.4', nodes:64, st:'attention', status:'异常 2' },
              { name:'gpu-dev-zz-01', k8s:'v1.35.4', nodes:32, st:'normal', status:'健康' } ] } ] },
        { st:'normal', name:'厂商C · 华北云', code:'SUP-2026-003', type:'云资源', region:'华北', coverage:'北京', dc:1, clusters:1, machines:40,
          search:'厂商c 华北云 赵凯 北京 亦庄 gpu-prod-01',
          dcs:[
            { name:'北京亦庄数据中心', code:'DC-BJ-001', loc:'北京·亦庄', st:'normal', status:'运行中', machines:40, clusterList:[
              { name:'gpu-prod-01', k8s:'v1.36.2', nodes:40, st:'normal', status:'健康' } ] } ] },
        { st:'normal', name:'厂商D · 边缘算力', code:'SUP-2026-004', type:'综合服务', region:'华南／西南', coverage:'广州、成都', dc:2, clusters:0, machines:6,
          search:'厂商d 边缘算力 陈璐 广州 成都',
          dcs:[
            { name:'广州边缘数据中心', code:'DC-GZ-001', loc:'广东·广州', st:'normal', status:'运行中', machines:3, clusterList:[] },
            { name:'成都边缘数据中心', code:'DC-CD-001', loc:'四川·成都', st:'normal', status:'运行中', machines:3, clusterList:[] } ] },
        { st:'pending', name:'厂商E · 海外云', code:'SUP-2026-005', type:'云资源', region:'海外', coverage:'新加坡、东京', dc:2, clusters:0, machines:0,
          search:'厂商e 海外云 sofia 新加坡 东京',
          dcs:[
            { name:'新加坡一号数据中心', code:'DC-SG-001', loc:'新加坡', st:'pending', status:'待接入', machines:0, clusterList:[] },
            { name:'东京一号数据中心', code:'DC-TK-001', loc:'日本·东京', st:'pending', status:'待接入', machines:0, clusterList:[] } ] }
      ];
      const renderDc = (d) => {
        const clusters = d.clusterList.length
          ? d.clusterList.map((c) => `<div class="acc-cluster"><span class="cl-name">${c.name}</span><span>${c.k8s}</span><span>${c.nodes} nodes</span><span class="archive-status${stCls(c.st)}">${c.status}</span></div>`).join('')
          : `<div class="acc-cluster empty">暂无集群 · <a data-act="add-cluster">＋ 创建／接入 K8s 集群</a></div>`;
        return `<div class="acc-dc"><div class="acc-dc-head"><span class="acc-dc-name">${d.name}<small>${d.code}</small></span><span class="acc-dc-loc">${d.loc} · ${d.machines} 台</span><span class="archive-status${stCls(d.st)}">${d.status}</span><span class="acc-dc-actions"><button class="mini-btn" data-act="onboard">纳管裸金属</button><button class="mini-btn" data-act="add-cluster">创建／接入 K8s 集群</button><button class="mini-btn danger" data-act="del-dc">删除</button></span></div><div class="acc-dc-clusters">${clusters}</div></div>`;
      };
      const renderSupplier = (s) => {
        const dcs = s.dcs.map(renderDc).join('') || '<div class="archive-empty2">该供应商下暂无数据中心</div>';
        return `<div class="acc-supplier" data-status="${s.st}" data-search="${s.search}"><button type="button" class="acc-supplier-head" aria-expanded="false"><span class="acc-chevron" aria-hidden="true"></span><span class="acc-sup-name">${s.name}<small>${s.code} · ${s.type}</small></span><span class="acc-cell">${s.region}<small>${s.coverage}</small></span><span class="acc-cell">${s.dc} 数据中心</span><span class="acc-cell">${s.clusters} 集群</span><span class="acc-cell">${s.machines} 台</span><span class="archive-status${stCls(s.st)}">${s.status || stLabel[s.st]}</span></button><div class="acc-supplier-body"><div class="acc-sup-actions"><button class="mini-btn" data-act="edit">编辑档案</button><button class="mini-btn primary" data-act="add-dc" data-sup="${s.name}">＋ 在此新建数据中心</button><button class="mini-btn danger" data-act="del-supplier">删除供应商</button></div>${dcs}</div></div>`;
      };
      accEl.innerHTML = ARCHIVE.map(renderSupplier).join('');

      // 展开/收起 + 上下文操作
      const actMap = { 'del-supplier':'supplier-delete', 'add-dc':'dc-create', 'onboard':'machine-onboard', 'add-cluster':'cluster-create', 'del-dc':'dc-delete' };
      accEl.addEventListener('click', (e) => {
        const act = e.target.closest('[data-act]');
        if (act) {
          e.stopPropagation();
          const a = act.dataset.act;
          if (a === 'edit') { toast('编辑档案 · 示例'); return; }
          if (a === 'add-dc') { const sel = getById('dcSupplier'); const name = act.dataset.sup; if (sel && name) Array.from(sel.options).forEach((o) => { if (o.textContent.trim() === name.trim()) sel.value = o.value; }); }
          if (a === 'onboard' && window.openMachineOnboard) { window.openMachineOnboard('dc-list'); return; }
          if (a === 'add-cluster' && window.openClusterAccess) { window.openClusterAccess('dc-list'); return; }
          if (actMap[a]) window.location.hash = actMap[a];
          return;
        }
        const head = e.target.closest('.acc-supplier-head');
        if (head) {
          const item = head.parentElement;
          const willOpen = !item.classList.contains('open');
          item.classList.toggle('open', willOpen);
          head.setAttribute('aria-expanded', String(willOpen));
        }
      });

      // 搜索 + 状态筛选
      const search = getById('archiveSearch');
      const statusF = getById('archiveStatusFilter');
      const applyFilter = () => {
        const term = (search && search.value || '').trim().toLowerCase();
        const st = (statusF && statusF.value) || 'all';
        let n = 0;
        accEl.querySelectorAll('.acc-supplier').forEach((el) => {
          const okT = !term || el.dataset.search.toLowerCase().includes(term);
          const okS = st === 'all' || el.dataset.status === st;
          el.style.display = (okT && okS) ? '' : 'none';
          if (okT && okS) n += 1;
        });
        const meta = getById('archiveMeta'); if (meta) meta.textContent = `共 ${n} 家供应商 · 8 个数据中心`;
      };
      search && search.addEventListener('input', applyFilter);
      statusF && statusF.addEventListener('change', applyFilter);
      applyFilter();

      // ＋新建 下拉（树标题栏 + 档案工具栏，通用）
      root.querySelectorAll('.tree-add-wrap').forEach((wrap) => {
        const btn = wrap.querySelector('.tree-add-btn');
        if (!btn) return;
        btn.addEventListener('click', (e) => { e.stopPropagation(); root.querySelectorAll('.tree-add-wrap').forEach((w) => { if (w !== wrap) w.classList.remove('open'); }); wrap.classList.toggle('open'); });
        wrap.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); window.location.hash = b.dataset.add; wrap.classList.remove('open'); }));
      });
      document.addEventListener('click', () => root.querySelectorAll('.tree-add-wrap').forEach((w) => w.classList.remove('open')));
    })();

(() => {
      const page = getById('modelDistributionPage');
      const tableBody = getById('modelDistributionTableBody');
      const catalogGrid = getById('modelCatalogGrid');
      const catalogView = getById('modelCatalogView');
      const taskView = getById('modelTaskView');
      if (!page || !tableBody || !catalogGrid || !catalogView || !taskView) return;

      const statusLabelFor = (task) => task.status === 'running'
        ? ((task.taskType || 'distribution') === 'download' ? '下载中' : '分发中')
        : ({ completed: '已完成', failed: '异常', stopped: '已停止' }[task.status] || task.status);
      const clusterNodes = {
        'gpu-prod-01': ['gpu-node-01', 'gpu-node-02', 'gpu-node-03', 'gpu-node-04', 'gpu-node-05', 'gpu-node-06', 'gpu-node-08', 'gpu-node-09'],
        'cluster-sh-02': ['sh-node-01', 'sh-node-02', 'sh-node-03', 'sh-node-04'],
        'gpu-test-sh-01': ['test-node-01', 'test-node-02', 'test-node-03']
      };
      const tasks = [
        { id: 106, taskType: 'download', name: '下载 Qwen3-32B', model: 'Qwen3-32B', modelId: '', sourceCopyId: '', url: 'https://models.example.com/qwen/Qwen3-32B.tar.zst', sourceNode: 'model-store-02', sourcePath: '/data/models/Qwen3-32B', targetMode: 'local', cluster: '', nodes: [], targetPath: '', progress: 56.8, totalGb: 64.5, speed: 428, status: 'running', updated: '刚刚', verify: true, resume: true, error: '' },
        { id: 107, taskType: 'download', name: '下载 bge-reranker-v2-m3', model: 'bge-reranker-v2-m3', modelId: 'model-reranker', sourceCopyId: 'copy-reranker-ops', url: 'https://models.example.com/embedding/bge-reranker-v2-m3.tar.gz', sourceNode: 'ops-transfer-01', sourcePath: '/data/models/bge-reranker-v2-m3', targetMode: 'local', cluster: '', nodes: [], targetPath: '', progress: 100, totalGb: 2.4, speed: 0, status: 'completed', updated: '今天 10:12', verify: true, resume: true, error: '' },
        { id: 101, taskType: 'distribution', name: 'Qwen2.5-Coder-32B 生产分发', model: 'Qwen2.5-Coder-32B-Instruct', modelId: 'model-qwen-coder', sourceCopyId: 'copy-qwen-ops', sourceNode: 'ops-transfer-01', sourcePath: '/data/models/Qwen2.5-Coder-32B-Instruct', targetMode: 'cluster', cluster: 'gpu-prod-01', nodes: clusterNodes['gpu-prod-01'], targetPath: '/data/models/Qwen2.5-Coder-32B-Instruct', progress: 68.4, totalGb: 612.8, speed: 842, status: 'running', updated: '刚刚', verify: true, error: '' },
        { id: 102, taskType: 'distribution', name: 'bge-m3 检索模型同步', model: 'BAAI/bge-m3', modelId: 'model-bge-m3', sourceCopyId: 'copy-bge-store', sourceNode: 'model-store-02', sourcePath: '/data/models/bge-m3', targetMode: 'nodes', cluster: 'cluster-sh-02', nodes: ['sh-node-01', 'sh-node-02', 'sh-node-03'], targetPath: '/data/models/bge-m3', progress: 41.2, totalGb: 18.6, speed: 286, status: 'running', updated: '12 秒前', verify: true, error: '' },
        { id: 103, taskType: 'distribution', name: 'DeepSeek-R1-Distill-32B 批量同步', model: 'DeepSeek-R1-Distill-Qwen-32B', modelId: 'model-deepseek-distill', sourceCopyId: 'copy-deepseek-distill-ops', sourceNode: 'ops-transfer-01', sourcePath: '/data/models/DeepSeek-R1-Distill-Qwen-32B', targetMode: 'cluster', cluster: 'gpu-test-sh-01', nodes: clusterNodes['gpu-test-sh-01'], targetPath: '/data/models/DeepSeek-R1-Distill-Qwen-32B', progress: 100, totalGb: 384.2, speed: 0, status: 'completed', updated: '今天 09:46', verify: true, error: '' },
        { id: 104, taskType: 'distribution', name: 'GLM-4-9B 上海集群分发', model: 'glm-4-9b-chat', modelId: 'model-glm4', sourceCopyId: 'copy-glm4-gpu07', sourceNode: 'gpu-node-07', sourcePath: '/models/glm-4-9b-chat', targetMode: 'cluster', cluster: 'cluster-sh-02', nodes: clusterNodes['cluster-sh-02'], targetPath: '/data/models/glm-4-9b-chat', progress: 73.1, totalGb: 172.4, speed: 0, status: 'failed', updated: '今天 09:18', verify: true, error: 'sh-node-04 SSH 认证失败，请检查凭据或目标节点 sshd 状态' },
        { id: 105, taskType: 'distribution', name: 'Llama-3.1-70B 测试分发', model: 'Llama-3.1-70B-Instruct', modelId: 'model-llama', sourceCopyId: 'copy-llama-store', sourceNode: 'model-store-02', sourcePath: '/data/models/Llama-3.1-70B-Instruct', targetMode: 'nodes', cluster: 'gpu-prod-01', nodes: ['gpu-node-03', 'gpu-node-04'], targetPath: '/data/models/Llama-3.1-70B-Instruct', progress: 29.6, totalGb: 421.7, speed: 0, status: 'stopped', updated: '昨天 18:32', verify: false, error: '' }
      ];
      const models = [
        { id: 'model-glm52', name: 'GLM-5.2', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-glm52-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/GLM-5.2', sizeGb: 1512, files: 286, checksum: '校验通过', updated: '今天 10:26' },
          { id: 'copy-glm52-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/zai-org/GLM-5.2', sizeGb: 1512, files: 286, checksum: '校验通过', updated: '今天 10:21' },
          { id: 'copy-glm52-gpu07', host: 'gpu-node-07', ip: '10.24.18.107', path: '/models/GLM-5.2', sizeGb: 1512, files: 286, checksum: '校验通过', updated: '今天 10:08' },
          { id: 'copy-glm52-gpu12', host: 'gpu-node-12', ip: '10.24.18.112', path: '/models/GLM-5.2', sizeGb: 1512, files: 286, checksum: '校验通过', updated: '今天 09:55' },
          { id: 'copy-glm52-gpu18', host: 'gpu-node-18', ip: '10.24.18.118', path: '/data/models/GLM-5.2', sizeGb: 1512, files: 286, checksum: '校验通过', updated: '今天 09:42' }
        ]},
        { id: 'model-deepseek-v4', name: 'DeepSeek-V4-Flash-Base', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-deepseek-v4-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/DeepSeek-V4-Flash-Base', sizeGb: 548, files: 112, checksum: '校验通过', updated: '今天 10:17' },
          { id: 'copy-deepseek-v4-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/deepseek-ai/DeepSeek-V4-Flash-Base', sizeGb: 548, files: 112, checksum: '校验通过', updated: '今天 10:06' }
        ]},
        { id: 'model-kimi-k27-code', name: 'Kimi-K2.7-Code', type: '多模态代码模型', origin: 'URL 下载', copies: [
          { id: 'copy-kimi-k27-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/moonshotai/Kimi-K2.7-Code', sizeGb: 638, files: 148, checksum: '校验通过', updated: '今天 10:14' },
          { id: 'copy-kimi-k27-gpu07', host: 'gpu-node-07', ip: '10.24.18.107', path: '/models/Kimi-K2.7-Code', sizeGb: 638, files: 148, checksum: '校验通过', updated: '今天 09:58' }
        ]},
        { id: 'model-kimi-k25', name: 'Kimi-K2.5', type: '多模态大模型', origin: '目录扫描', copies: [
          { id: 'copy-kimi-k25-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/moonshotai/Kimi-K2.5', sizeGb: 612, files: 126, checksum: '校验通过', updated: '今天 09:52' },
          { id: 'copy-kimi-k25-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/Kimi-K2.5', sizeGb: 612, files: 126, checksum: '校验通过', updated: '今天 09:47' }
        ]},
        { id: 'model-kimi-k2', name: 'Kimi-K2-Instruct', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-kimi-k2-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/Kimi-K2-Instruct', sizeGb: 1024, files: 201, checksum: '校验通过', updated: '今天 09:41' },
          { id: 'copy-kimi-k2-gpu07', host: 'gpu-node-07', ip: '10.24.18.107', path: '/models/Kimi-K2-Instruct', sizeGb: 1024, files: 201, checksum: '校验通过', updated: '今天 09:36' }
        ]},
        { id: 'model-glm51-fp8', name: 'GLM-5.1-FP8', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-glm51-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/GLM-5.1-FP8', sizeGb: 758, files: 284, checksum: '校验通过', updated: '今天 09:29' }
        ]},
        { id: 'model-qwen-coder', name: 'Qwen2.5-Coder-32B-Instruct', type: '代码大模型', origin: '目录扫描', copies: [
          { id: 'copy-qwen-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/Qwen2.5-Coder-32B-Instruct', sizeGb: 76.6, files: 18, checksum: '校验通过', updated: '今天 10:18' },
          { id: 'copy-qwen-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/Qwen2.5-Coder-32B-Instruct', sizeGb: 76.6, files: 18, checksum: '校验通过', updated: '今天 10:02' }
        ]},
        { id: 'model-bge-m3', name: 'BAAI/bge-m3', type: '嵌入模型', origin: '目录扫描', copies: [
          { id: 'copy-bge-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/bge-m3', sizeGb: 6.2, files: 9, checksum: '校验通过', updated: '今天 10:03' },
          { id: 'copy-bge-gpu07', host: 'gpu-node-07', ip: '10.24.18.107', path: '/models/bge-m3', sizeGb: 6.2, files: 9, checksum: '校验通过', updated: '今天 09:43' }
        ]},
        { id: 'model-deepseek-distill', name: 'DeepSeek-R1-Distill-Qwen-32B', type: '推理模型', origin: '目录扫描', copies: [
          { id: 'copy-deepseek-distill-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/DeepSeek-R1-Distill-Qwen-32B', sizeGb: 128.1, files: 24, checksum: '校验通过', updated: '今天 09:46' }
        ]},
        { id: 'model-glm4', name: 'glm-4-9b-chat', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-glm4-gpu07', host: 'gpu-node-07', ip: '10.24.18.107', path: '/models/glm-4-9b-chat', sizeGb: 43.1, files: 14, checksum: '校验通过', updated: '今天 09:18' }
        ]},
        { id: 'model-llama', name: 'Llama-3.1-70B-Instruct', type: '大语言模型', origin: '目录扫描', copies: [
          { id: 'copy-llama-store', host: 'model-store-02', ip: '10.24.2.32', path: '/data/models/Llama-3.1-70B-Instruct', sizeGb: 210.9, files: 34, checksum: '校验通过', updated: '昨天 18:32' },
          { id: 'copy-llama-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/Llama-3.1-70B-Instruct', sizeGb: 210.9, files: 34, checksum: '校验通过', updated: '昨天 18:04' }
        ]},
        { id: 'model-reranker', name: 'bge-reranker-v2-m3', type: '重排模型', origin: 'URL 下载', copies: [
          { id: 'copy-reranker-ops', host: 'ops-transfer-01', ip: '10.24.1.20', path: '/data/models/bge-reranker-v2-m3', sizeGb: 2.4, files: 7, checksum: '校验通过', updated: '今天 10:12' }
        ]}
      ];
      let currentDetailId = null;
      let pendingStopId = null;
      let toastTimer = null;
      let currentSubview = 'catalog';
      let taskModelScope = '';

      const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
      const formatSize = (gb) => gb >= 1024 ? `${(gb / 1024).toFixed(2)} TB` : `${gb.toFixed(gb >= 100 ? 1 : 2)} GB`;
      const transferredSize = (task) => formatSize(task.totalGb * task.progress / 100);
      const formatSpeed = (speed) => speed > 0 ? `${Math.round(speed)} MB/s` : '—';
      const clock = () => new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
      const taskUpdatedTime = (task, now) => {
        if (task.updated === '刚刚') return now;
        const seconds = task.updated?.match(/(\d+)\s*秒前/);
        if (seconds) return now - Number(seconds[1]) * 1000;
        const time = task.updated?.match(/(今天|昨天)\s*(\d{1,2}):(\d{2})/);
        if (time) {
          const value = new Date(now);
          value.setHours(Number(time[2]), Number(time[3]), 0, 0);
          if (time[1] === '昨天') value.setDate(value.getDate() - 1);
          return value.getTime();
        }
        return 0;
      };
      const showToast = (message) => {
        const toast = getById('modelDistributionToast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
      };
      const hostIp = { 'ops-transfer-01': '10.24.1.20', 'model-store-02': '10.24.2.32', 'gpu-node-07': '10.24.18.107' };
      const switchSubview = (view) => {
        currentSubview = view === 'tasks' ? 'tasks' : 'catalog';
        catalogView.classList.toggle('mdist-is-hidden', currentSubview !== 'catalog');
        taskView.classList.toggle('mdist-is-hidden', currentSubview !== 'tasks');
        const catalogTab = getById('modelCatalogTab');
        const taskTab = getById('modelTaskTab');
        catalogTab?.classList.toggle('active', currentSubview === 'catalog');
        taskTab?.classList.toggle('active', currentSubview === 'tasks');
        catalogTab?.setAttribute('aria-selected', String(currentSubview === 'catalog'));
        taskTab?.setAttribute('aria-selected', String(currentSubview === 'tasks'));
      };
      const switchDistributionKind = (kind) => {
        const selected = ['model', 'image', 'file'].includes(kind) ? kind : 'model';
        const entries = [
          ['model', 'distributionModelTab', 'distributionModelPane'],
          ['image', 'distributionImageTab', 'distributionImagePane'],
          ['file', 'distributionFileTab', 'distributionFilePane']
        ];
        entries.forEach(([value, tabId, paneId]) => {
          const active = value === selected;
          getById(tabId)?.classList.toggle('active', active);
          getById(tabId)?.setAttribute('aria-selected', String(active));
          getById(paneId)?.classList.toggle('mdist-is-hidden', !active);
        });
      };
      const syncCompletedDownloads = () => {
        let added = false;
        tasks.filter((task) => task.taskType === 'download' && task.status === 'completed').forEach((task) => {
          let model = models.find((item) => item.name.toLowerCase() === task.model.toLowerCase());
          const existingCopy = model?.copies.find((copy) => copy.host === task.sourceNode && copy.path === task.sourcePath);
          if (existingCopy) {
            task.modelId = model.id;
            task.sourceCopyId = existingCopy.id;
            return;
          }
          const copy = { id: `copy-download-${task.id}`, host: task.sourceNode, ip: hostIp[task.sourceNode] || '—', path: task.sourcePath, sizeGb: task.totalGb, files: 1, checksum: task.verify ? '校验通过' : '未校验', updated: task.updated };
          if (model) model.copies.push(copy);
          else {
            model = { id: `model-download-${task.id}`, name: task.model, type: '已下载模型', origin: 'URL 下载', copies: [copy] };
            models.unshift(model);
          }
          task.modelId = model.id;
          task.sourceCopyId = copy.id;
          added = true;
        });
        return added;
      };
      const visibleModels = () => {
        const host = getById('modelHostFilter')?.value || 'all';
        const keyword = (getById('modelCatalogSearch')?.value || '').trim().toLowerCase();
        return models.filter((model) => {
          if (host !== 'all' && !model.copies.some((copy) => copy.host === host)) return false;
          const copyText = model.copies.map((copy) => `${copy.host} ${copy.ip} ${copy.path}`).join(' ');
          if (keyword && !`${model.name} ${model.type} ${copyText}`.toLowerCase().includes(keyword)) return false;
          return true;
        });
      };
      const renderModels = () => {
        syncCompletedDownloads();
        const list = visibleModels();
        catalogGrid.innerHTML = list.length ? list.map((model) => {
          const primaryCopy = model.copies[0];
          const visibleHostCount = Math.min(model.copies.length, 3);
          const hostStack = Array.from({ length: visibleHostCount }, () => '<i aria-hidden="true"><svg viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="4" rx="1"/><rect x="2.5" y="9.5" width="11" height="4" rx="1"/><path d="M5 4.5h.01M5 11.5h.01M7.5 4.5h3.5M7.5 11.5h3.5"/></svg></i>').join('') + (model.copies.length > 3 ? `<b>+${model.copies.length - 3}</b>` : '');
          const copyRows = model.copies.map((copy) => `<div class="model-copy-row"><div><strong>${escapeHtml(copy.host)} · ${escapeHtml(copy.ip)} · ${formatSize(copy.sizeGb)}</strong><span title="${escapeHtml(copy.path)}">${escapeHtml(copy.path)}</span></div><button type="button" data-copy-distribute="${escapeHtml(model.id)}" data-copy-id="${escapeHtml(copy.id)}">从此副本分发</button></div>`).join('');
          return `<article class="model-catalog-card" data-model-id="${escapeHtml(model.id)}">
            <header class="model-catalog-head"><div class="model-catalog-identity"><div class="model-catalog-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 5.5C5 4.1 8.1 3 12 3s7 1.1 7 2.5S15.9 8 12 8 5 6.9 5 5.5Z"/><path d="M5 5.5v6C5 12.9 8.1 14 12 14s7-1.1 7-2.5v-6M5 11.5v6C5 18.9 8.1 20 12 20s7-1.1 7-2.5v-6"/></svg></div><div style="min-width:0"><div class="model-catalog-title">${escapeHtml(model.name)}</div><div class="model-catalog-kind">${escapeHtml(model.type)}</div></div></div><span class="model-catalog-state">可分发</span></header>
            <div class="model-catalog-body"><div class="model-catalog-summary"><div class="model-size-block"><span>模型大小</span><strong>${formatSize(primaryCopy.sizeGb)}</strong></div><button type="button" class="model-host-summary" data-model-copies="${escapeHtml(model.id)}" aria-expanded="false"><span class="model-host-stack">${hostStack}</span><span class="model-host-copy"><strong data-copy-label>分布于 ${model.copies.length} 台主机</strong><small>展开查看可用副本</small></span><svg class="model-host-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button></div><div class="model-copy-list" data-copy-list="${escapeHtml(model.id)}"><div class="model-copy-list-head"><span>可用副本 · ${model.copies.length}</span><small>显示前 3 条，滚动查看更多</small></div>${copyRows}</div></div>
            <footer class="model-catalog-actions"><button type="button" class="model-catalog-action" data-model-tasks="${escapeHtml(model.id)}">查看相关任务</button><button type="button" class="model-catalog-action primary" data-model-distribute="${escapeHtml(model.id)}">分发模型</button></footer>
          </article>`;
        }).join('') : '<div class="model-catalog-empty">当前筛选范围内没有发现可分发模型</div>';
        const total = getById('modelCatalogTotal');
        if (total) total.textContent = `共 ${list.length} 个模型`;
      };
      const visibleTasks = () => {
        const status = getById('modelDistributionStatusFilter')?.value || 'all';
        const type = getById('modelDistributionTypeFilter')?.value || 'all';
        const cluster = getById('modelDistributionClusterFilter')?.value || 'all';
        const keyword = (getById('modelDistributionSearch')?.value || '').trim().toLowerCase();
        const filtered = tasks.filter((task) => {
          const taskType = task.taskType || 'distribution';
          if (status !== 'all' && task.status !== status) return false;
          if (type !== 'all' && taskType !== type) return false;
          if (cluster !== 'all' && (taskType === 'download' || task.cluster !== cluster)) return false;
          if (taskModelScope && task.modelId !== taskModelScope) return false;
          if (keyword && !`${task.name} ${task.model} ${task.url || ''} ${task.sourceNode} ${task.sourcePath} ${task.cluster} ${(task.nodes || []).join(' ')}`.toLowerCase().includes(keyword)) return false;
          return true;
        });
        const now = Date.now();
        return filtered.sort((a, b) => {
          const runningDifference = (a.status === 'running' ? 0 : 1) - (b.status === 'running' ? 0 : 1);
          if (runningDifference) return runningDifference;
          const timeDifference = taskUpdatedTime(b, now) - taskUpdatedTime(a, now);
          return timeDifference || Number(b.id) - Number(a.id);
        });
      };
      const renderTasks = () => {
        const list = visibleTasks();
        tableBody.innerHTML = list.length ? list.map((task) => {
          const isDownload = (task.taskType || 'distribution') === 'download';
          const targetLabel = isDownload ? task.sourcePath : (task.targetMode === 'cluster' ? `${task.cluster} · 全部 Ready 节点` : `${task.cluster} · 指定 ${task.nodes.length} 个节点`);
          const error = task.error ? `<span class="mdist-error" title="${escapeHtml(task.error)}">${escapeHtml(task.error)}</span>` : '';
          const stopAction = task.status === 'running' ? `<button type="button" class="mdist-link stop" data-mdist-stop="${task.id}">停止</button>` : '';
          const distributeAction = isDownload && task.status === 'completed' ? `<button type="button" class="mdist-link" data-mdist-distribute="${task.id}">分发</button>` : '';
          return `<tr data-task-id="${task.id}">
            <td><span class="mdist-main">${escapeHtml(task.name)}</span><span class="mdist-sub">${isDownload ? 'URL 下载' : '节点分发'} · ${escapeHtml(task.model)}</span></td>
            <td><span class="mdist-main">${escapeHtml(isDownload ? task.sourceNode : task.cluster)}</span><span class="mdist-sub">${escapeHtml(targetLabel)}</span></td>
            <td><div class="mdist-progress-line"><span class="mdist-progress-track"><span class="mdist-progress-bar ${task.status}" style="width:${task.progress.toFixed(1)}%"></span></span><span class="mdist-progress-number">${task.progress.toFixed(1)}%</span></div><span class="mdist-sub">${transferredSize(task)} / ${formatSize(task.totalGb)}${isDownload ? '' : ` · ${task.nodes.length} 个节点`}</span></td>
            <td><span class="mdist-main">${formatSpeed(task.speed)}</span><span class="mdist-sub">${isDownload ? '当前下载速度' : '节点汇总速度'}</span></td>
            <td><span class="mdist-status ${task.status}">${statusLabelFor(task)}</span>${error}</td>
            <td><span class="mdist-main" style="font-weight:400">${escapeHtml(task.updated)}</span></td>
            <td><div class="mdist-actions"><button type="button" class="mdist-link" data-mdist-detail="${task.id}">详情</button>${stopAction}${distributeAction}</div></td>
          </tr>`;
        }).join('') : '<tr><td class="mdist-empty" colspan="7">没有符合当前条件的任务</td></tr>';
        const total = getById('modelDistributionTotal');
        const taskCount = getById('modelTaskCount');
        if (total) total.textContent = `共 ${list.length} 条`;
        if (taskCount) taskCount.textContent = String(tasks.length);
      };
      const showTaskList = (keyword = '', modelId = '') => {
        const status = getById('modelDistributionStatusFilter');
        const type = getById('modelDistributionTypeFilter');
        const cluster = getById('modelDistributionClusterFilter');
        const search = getById('modelDistributionSearch');
        if (status) status.value = 'all';
        if (type) type.value = 'all';
        if (cluster) cluster.value = 'all';
        if (search) search.value = keyword;
        taskModelScope = modelId;
        renderTasks();
        switchSubview('tasks');
      };

      const overlay = (id, open) => getById(id)?.classList.toggle('open', open);
      const getTask = (id) => tasks.find((task) => task.id === Number(id));
      const renderDetail = (task) => {
        if (!task) return;
        currentDetailId = task.id;
        const isDownload = (task.taskType || 'distribution') === 'download';
        const title = getById('modelDistributionDetailTitle');
        const subtitle = getById('mdistDetailSubtitle');
        const update = getById('mdistDetailUpdate');
        const body = getById('mdistDetailBody');
        const stopButton = getById('mdistDetailStop');
        if (title) title.textContent = isDownload ? '下载任务详情' : '分发任务详情';
        if (subtitle) subtitle.textContent = `${task.name} · ${statusLabelFor(task)}`;
        if (update) update.textContent = `数据更新 ${task.updated}`;
        if (stopButton) stopButton.style.display = task.status === 'running' ? '' : 'none';
        const errorBlock = task.error ? `<div class="mdist-detail-error"><strong>异常信息：</strong>${escapeHtml(task.error)}<br />${isDownload ? '可检查 URL、网络和目录空间后重新创建下载任务。' : '已完成节点不受影响，可修复 SSH 凭据后重新创建增量分发任务。'}</div>` : '';
        if (isDownload) {
          const downloadState = task.status === 'completed' ? '已完成' : (task.status === 'failed' ? '异常' : (task.status === 'stopped' ? '已停止' : '下载中'));
          const verifyState = task.status === 'completed' ? (task.verify ? '已完成' : '未启用') : (task.status === 'failed' || task.status === 'stopped' ? '未执行' : '等待下载完成');
          if (body) body.innerHTML = `<div class="mdist-detail-summary"><div class="mdist-detail-stat"><small>下载进度</small><strong>${task.progress.toFixed(1)}%</strong></div><div class="mdist-detail-stat"><small>已下载</small><strong>${transferredSize(task)}</strong></div><div class="mdist-detail-stat"><small>实时速度</small><strong>${formatSpeed(task.speed)}</strong></div><div class="mdist-detail-stat"><small>文件大小</small><strong>${formatSize(task.totalGb)}</strong></div></div>
            <div class="mdist-detail-info"><div><span>模型 URL</span>${escapeHtml(task.url)}</div><div><span>下载主机</span>${escapeHtml(task.sourceNode)}</div><div><span>模型保存路径</span>${escapeHtml(task.sourcePath)}</div><div><span>断点续传</span>${task.resume ? '已启用' : '未启用'}</div><div><span>完整性校验</span>${task.verify ? '下载后执行' : '未启用'}</div><div><span>更新时间</span>${escapeHtml(task.updated)}</div></div>
            <div class="mdist-section-title">下载阶段</div><table class="mdist-node-table"><thead><tr><th>阶段</th><th>进度</th><th>状态</th><th>说明</th></tr></thead><tbody><tr><td>URL 与空间预检</td><td>100%</td><td>已完成</td><td>URL 可访问，目录空间充足</td></tr><tr><td>文件下载</td><td>${task.progress.toFixed(1)}%</td><td>${downloadState}</td><td>${formatSpeed(task.speed)}</td></tr><tr><td>完整性校验</td><td>${task.status === 'completed' && task.verify ? '100%' : '—'}</td><td>${verifyState}</td><td>${task.verify ? '校验文件大小与校验值' : '未配置校验'}</td></tr></tbody></table>${errorBlock}`;
          return;
        }
        const nodeRows = task.nodes.map((node, index) => {
          const isFailed = task.status === 'failed' && index === task.nodes.length - 1;
          const nodeProgress = isFailed ? 0 : ((task.status === 'completed' || task.status === 'failed') ? 100 : Math.max(0, Math.min(100, task.progress + ((index % 3) - 1) * 2.4)));
          const nodeState = isFailed ? '异常' : (task.status === 'stopped' ? '已停止' : (nodeProgress >= 100 ? '已完成' : '分发中'));
          const nodeSpeed = (task.status === 'running' && !isFailed) ? formatSpeed(task.speed / task.nodes.length * (0.9 + (index % 3) * .08)) : '—';
          return `<tr><td>${escapeHtml(node)}</td><td>${nodeProgress.toFixed(1)}%</td><td>${nodeSpeed}</td><td class="${isFailed ? 'bad' : ''}">${nodeState}${isFailed ? ' · SSH 认证失败' : ''}</td></tr>`;
        }).join('');
        if (body) body.innerHTML = `<div class="mdist-detail-summary"><div class="mdist-detail-stat"><small>总体进度</small><strong>${task.progress.toFixed(1)}%</strong></div><div class="mdist-detail-stat"><small>已传输</small><strong>${transferredSize(task)}</strong></div><div class="mdist-detail-stat"><small>实时速度</small><strong>${formatSpeed(task.speed)}</strong></div><div class="mdist-detail-stat"><small>目标节点</small><strong>${task.nodes.length} 个</strong></div></div>
          <div class="mdist-detail-info"><div><span>源主机</span>${escapeHtml(task.sourceNode)}</div><div><span>目标集群</span>${escapeHtml(task.cluster)}</div><div><span>源模型目录</span>${escapeHtml(task.sourcePath)}</div><div><span>目标目录</span>${escapeHtml(task.targetPath)}</div><div><span>目标方式</span>${task.targetMode === 'cluster' ? '按集群（Ready 节点）' : '指定节点'}</div><div><span>完成校验</span>${task.verify ? '文件大小与校验值' : '未启用'}</div></div>
          <div class="mdist-section-title">节点分发明细</div><table class="mdist-node-table"><thead><tr><th>目标节点</th><th>进度</th><th>速度</th><th>状态／异常</th></tr></thead><tbody>${nodeRows}</tbody></table>${errorBlock}`;
      };
      const openDetail = (id) => {
        const task = getTask(id);
        if (!task) return;
        renderDetail(task);
        overlay('modelDistributionDetailOverlay', true);
      };
      const openStop = (id) => {
        const task = getTask(id);
        if (!task || task.status !== 'running') return;
        pendingStopId = task.id;
        const text = getById('mdistStopText');
        const isDownload = (task.taskType || 'distribution') === 'download';
        if (text) text.innerHTML = `确定停止任务 <strong>“${escapeHtml(task.name)}”</strong> 吗？<br />${isDownload ? '已下载的临时文件将保留；启用断点续传后可从当前进度重新创建任务。' : '停止后不会删除目标节点上已经传输的文件；后续重新创建任务时可以继续增量同步。'}`;
        overlay('modelDistributionStopOverlay', true);
      };

      const handleTaskAction = (event) => {
        const detailButton = event.target.closest('[data-mdist-detail]');
        if (detailButton) { openDetail(detailButton.dataset.mdistDetail); return; }
        const stopButton = event.target.closest('[data-mdist-stop]');
        if (stopButton) { openStop(stopButton.dataset.mdistStop); return; }
        const distributeButton = event.target.closest('[data-mdist-distribute]');
        if (distributeButton) {
          const task = getTask(distributeButton.dataset.mdistDistribute);
          if (!task || (task.taskType || 'distribution') !== 'download' || task.status !== 'completed') return;
          syncCompletedDownloads();
          renderModels();
          const model = models.find((item) => item.id === task.modelId);
          if (model) openDistributionForModel(model.id, task.sourceCopyId);
        }
      };
      tableBody.addEventListener('click', handleTaskAction);
      getById('mdistDetailStop')?.addEventListener('click', () => openStop(currentDetailId));
      getById('mdistStopConfirm')?.addEventListener('click', () => {
        const task = getTask(pendingStopId);
        if (!task) return;
        task.status = 'stopped';
        task.speed = 0;
        task.updated = '刚刚';
        overlay('modelDistributionStopOverlay', false);
        renderTasks();
        if (currentDetailId === task.id && getById('modelDistributionDetailOverlay')?.classList.contains('open')) renderDetail(task);
        showToast('任务已停止');
      });

      const createOverlay = getById('modelDistributionCreateOverlay');
      const taskNameInput = getById('mdistTaskName');
      const modelSelect = getById('mdistModelSelect');
      const sourceCopySelect = getById('mdistSourceCopy');
      const sourcePathInput = getById('mdistSourcePath');
      const targetPathInput = getById('mdistTargetPath');
      const targetClusterSelect = getById('mdistTargetCluster');
      const validation = getById('mdistCreateValidation');
      const syncTargetMode = () => {
        const mode = root.querySelector('input[name="mdistTargetMode"]:checked')?.value || 'cluster';
        getById('mdistClusterTarget').hidden = mode !== 'cluster';
        getById('mdistNodeTarget').hidden = mode !== 'nodes';
      };
      const syncClusterSummary = () => {
        const nodes = clusterNodes[targetClusterSelect?.value] || [];
        const summary = getById('mdistClusterNodeSummary');
        if (summary) summary.textContent = `${nodes.length} 个 Ready 节点`;
      };
      root.querySelectorAll('input[name="mdistTargetMode"]').forEach((radio) => radio.addEventListener('change', syncTargetMode));
      targetClusterSelect?.addEventListener('change', syncClusterSummary);
      const populateModelSelect = (selectedId) => {
        if (!modelSelect) return;
        modelSelect.innerHTML = models.map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.name)} · ${model.copies.length} 个副本</option>`).join('');
        modelSelect.value = models.some((model) => model.id === selectedId) ? selectedId : (models[0]?.id || '');
      };
      const syncSelectedCopy = () => {
        const model = models.find((item) => item.id === modelSelect?.value) || models[0];
        const copy = model?.copies.find((item) => item.id === sourceCopySelect?.value) || model?.copies[0];
        if (sourcePathInput) sourcePathInput.value = copy?.path || '';
      };
      const syncSelectedModel = (updateName = true, preferredCopyId = '') => {
        const model = models.find((item) => item.id === modelSelect?.value) || models[0];
        if (!model) return;
        if (sourceCopySelect) {
          sourceCopySelect.innerHTML = model.copies.map((copy) => `<option value="${escapeHtml(copy.id)}">${escapeHtml(copy.host)} · ${escapeHtml(copy.ip)} · ${formatSize(copy.sizeGb)}</option>`).join('');
          sourceCopySelect.value = model.copies.some((copy) => copy.id === preferredCopyId) ? preferredCopyId : (model.copies[0]?.id || '');
        }
        syncSelectedCopy();
        if (updateName && taskNameInput) taskNameInput.value = `分发 ${model.name}`;
      };
      const resetCreate = (modelId, copyId = '') => {
        populateModelSelect(modelId);
        syncSelectedModel(true, copyId);
        if (targetPathInput) targetPathInput.value = '/data/models/';
        const clusterRadio = root.querySelector('input[name="mdistTargetMode"][value="cluster"]');
        if (clusterRadio) clusterRadio.checked = true;
        if (targetClusterSelect) targetClusterSelect.value = 'gpu-prod-01';
        root.querySelectorAll('#mdistNodeTarget input[type="checkbox"]:not(:disabled)').forEach((checkbox, index) => { checkbox.checked = index < 2; });
        validation?.classList.remove('show');
        syncTargetMode();
        syncClusterSummary();
      };
      const openDistributionForModel = (modelId, copyId = '') => {
        resetCreate(modelId, copyId);
        overlay('modelDistributionCreateOverlay', true);
        window.setTimeout(() => taskNameInput?.focus(), 0);
      };
      modelSelect?.addEventListener('change', () => syncSelectedModel(true));
      sourceCopySelect?.addEventListener('change', syncSelectedCopy);
      getById('modelDistributionCreate')?.addEventListener('click', () => openDistributionForModel(models[0]?.id));
      getById('mdistCreateSubmit')?.addEventListener('click', () => {
        const mode = root.querySelector('input[name="mdistTargetMode"]:checked')?.value || 'cluster';
        const selectedNodes = mode === 'cluster' ? (clusterNodes[targetClusterSelect?.value] || []) : Array.from(root.querySelectorAll('#mdistNodeTarget input[type="checkbox"]:checked')).map((checkbox) => checkbox.value);
        if (!taskNameInput?.value.trim() || !sourcePathInput?.value.trim() || !targetPathInput?.value.trim() || selectedNodes.length === 0) { validation?.classList.add('show'); return; }
        const selectedModel = models.find((item) => item.id === modelSelect?.value);
        if (!selectedModel) { validation?.classList.add('show'); return; }
        const selectedCopy = selectedModel.copies.find((item) => item.id === sourceCopySelect?.value);
        if (!selectedCopy) { validation?.classList.add('show'); return; }
        const sourcePath = selectedCopy.path;
        const model = selectedModel.name;
        const cluster = mode === 'cluster' ? targetClusterSelect.value : 'cluster-sh-02';
        tasks.unshift({ id: Date.now(), taskType: 'distribution', name: taskNameInput.value.trim(), model, modelId: selectedModel.id, sourceCopyId: selectedCopy.id, sourceNode: selectedCopy.host, sourcePath, targetMode: mode, cluster, nodes: selectedNodes, targetPath: `${targetPathInput.value.trim().replace(/\/+$/, '')}/${model}`, progress: 0, totalGb: selectedCopy.sizeGb * selectedNodes.length, speed: 0, status: 'running', updated: '刚刚', verify: Boolean(getById('mdistVerify')?.checked), error: '' });
        overlay('modelDistributionCreateOverlay', false);
        showTaskList();
        showToast('模型分发任务已创建');
      });

      catalogGrid.addEventListener('click', (event) => {
        const copyDistributeButton = event.target.closest('[data-copy-distribute]');
        if (copyDistributeButton) { openDistributionForModel(copyDistributeButton.dataset.copyDistribute, copyDistributeButton.dataset.copyId); return; }
        const copiesButton = event.target.closest('[data-model-copies]');
        if (copiesButton) {
          const list = catalogGrid.querySelector(`[data-copy-list="${copiesButton.dataset.modelCopies}"]`);
          list?.classList.toggle('open');
          const expanded = Boolean(list?.classList.contains('open'));
          copiesButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
          const hint = copiesButton.querySelector('small');
          if (hint) hint.textContent = expanded ? '收起副本列表' : '展开查看可用副本';
          return;
        }
        const distributeButton = event.target.closest('[data-model-distribute]');
        if (distributeButton) { openDistributionForModel(distributeButton.dataset.modelDistribute); return; }
        const taskButton = event.target.closest('[data-model-tasks]');
        if (!taskButton) return;
        const model = models.find((item) => item.id === taskButton.dataset.modelTasks);
        if (model) showTaskList(model.name, model.id);
      });

      const downloadTaskNameInput = getById('mdownloadTaskName');
      const downloadUrlInput = getById('mdownloadUrl');
      const downloadNodeSelect = getById('mdownloadNode');
      const downloadDirectoryInput = getById('mdownloadDirectory');
      const downloadFileNameInput = getById('mdownloadFileName');
      const downloadPreview = getById('mdownloadUrlPreview');
      const downloadValidation = getById('mdownloadValidation');
      const downloadDirectoryMenu = getById('mdownloadDirectoryMenu');
      const inferDownloadName = (url) => {
        try {
          const pathname = new URL(url).pathname;
          return decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'remote-model').replace(/\.(tar\.zst|tar\.gz|tgz|zip|safetensors)$/i, '') || 'remote-model';
        } catch (error) { return 'remote-model'; }
      };
      const syncDownloadPreview = () => {
        const url = downloadUrlInput?.value.trim() || '';
        const directory = (downloadDirectoryInput?.value.trim() || '/data/models').replace(/\/+$/, '');
        const name = downloadFileNameInput?.value.trim() || (url ? inferDownloadName(url) : '');
        if (downloadPreview) downloadPreview.textContent = url && name ? `保存至 ${directory}/${name}` : '填写 URL 后将自动识别保存名称和目标路径。';
      };
      const resetDownloadCreate = () => {
        if (downloadTaskNameInput) downloadTaskNameInput.value = '';
        if (downloadUrlInput) downloadUrlInput.value = '';
        if (downloadNodeSelect) downloadNodeSelect.value = 'ops-transfer-01';
        if (downloadDirectoryInput) downloadDirectoryInput.value = '/data/models';
        if (downloadFileNameInput) downloadFileNameInput.value = '';
        const resume = getById('mdownloadResume');
        const verify = getById('mdownloadVerify');
        if (resume) resume.checked = true;
        if (verify) verify.checked = true;
        downloadValidation?.classList.remove('show');
        downloadDirectoryMenu?.classList.remove('open');
        syncDownloadPreview();
      };
      getById('modelDownloadCreate')?.addEventListener('click', () => {
        resetDownloadCreate();
        overlay('modelDownloadCreateOverlay', true);
        window.setTimeout(() => downloadTaskNameInput?.focus(), 0);
      });
      getById('mdownloadBrowse')?.addEventListener('click', (event) => {
        event.stopPropagation();
        downloadDirectoryMenu?.classList.toggle('open');
      });
      root.querySelectorAll('[data-download-path]').forEach((button) => button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (downloadDirectoryInput) downloadDirectoryInput.value = button.dataset.downloadPath || '/data/models';
        downloadDirectoryMenu?.classList.remove('open');
        syncDownloadPreview();
      }));
      [downloadUrlInput, downloadDirectoryInput, downloadFileNameInput].forEach((input) => input?.addEventListener('input', syncDownloadPreview));
      getById('mdownloadSubmit')?.addEventListener('click', () => {
        const name = downloadTaskNameInput?.value.trim() || '';
        const url = downloadUrlInput?.value.trim() || '';
        const directory = (downloadDirectoryInput?.value.trim() || '').replace(/\/+$/, '');
        const valid = name && /^https?:\/\//i.test(url) && directory.startsWith('/');
        if (!valid) { downloadValidation?.classList.add('show'); return; }
        const model = downloadFileNameInput?.value.trim() || inferDownloadName(url);
        tasks.unshift({ id: Date.now(), taskType: 'download', name, model, modelId: '', sourceCopyId: '', url, sourceNode: downloadNodeSelect?.value || 'ops-transfer-01', sourcePath: `${directory}/${model}`, targetMode: 'local', cluster: '', nodes: [], targetPath: '', progress: 0, totalGb: 48.6, speed: 0, status: 'running', updated: '刚刚', verify: Boolean(getById('mdownloadVerify')?.checked), resume: Boolean(getById('mdownloadResume')?.checked), error: '' });
        overlay('modelDownloadCreateOverlay', false);
        showTaskList();
        showToast('模型下载任务已创建');
      });

      root.querySelectorAll('[data-mdist-close]').forEach((button) => button.addEventListener('click', () => button.closest('.mdist-overlay')?.classList.remove('open')));
      document.addEventListener('click', (event) => { if (!event.target.closest('.mdist-path-picker')) downloadDirectoryMenu?.classList.remove('open'); });
      root.querySelectorAll('.mdist-overlay').forEach((item) => item.addEventListener('mousedown', (event) => { if (event.target === item) item.classList.remove('open'); }));
      document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        const openItems = Array.from(root.querySelectorAll('.mdist-overlay.open'));
        openItems.at(-1)?.classList.remove('open');
      });
      ['modelDistributionStatusFilter', 'modelDistributionTypeFilter', 'modelDistributionClusterFilter'].forEach((id) => getById(id)?.addEventListener('change', renderTasks));
      getById('modelDistributionSearch')?.addEventListener('input', (event) => {
        const scopedModel = models.find((model) => model.id === taskModelScope);
        if (scopedModel && event.currentTarget.value.trim() !== scopedModel.name) taskModelScope = '';
        renderTasks();
      });
      getById('modelDistributionRefresh')?.addEventListener('click', () => { renderTasks(); showToast('任务状态已刷新'); });
      getById('modelHostFilter')?.addEventListener('change', renderModels);
      getById('modelCatalogSearch')?.addEventListener('input', renderModels);
      getById('modelCatalogRefresh')?.addEventListener('click', () => { renderModels(); showToast('模型目录已刷新'); });
      getById('modelCatalogTab')?.addEventListener('click', () => switchSubview('catalog'));
      getById('modelTaskTab')?.addEventListener('click', () => { taskModelScope = ''; renderTasks(); switchSubview('tasks'); });
      getById('distributionModelTab')?.addEventListener('click', () => switchDistributionKind('model'));
      getById('distributionImageTab')?.addEventListener('click', () => switchDistributionKind('image'));
      getById('distributionFileTab')?.addEventListener('click', () => switchDistributionKind('file'));
      getById('imageDistributionCreate')?.addEventListener('click', () => showToast('镜像分发创建入口已打开'));
      getById('fileDistributionCreate')?.addEventListener('click', () => showToast('文件分发创建入口已打开'));

      window.setInterval(() => {
        let changed = false;
        tasks.forEach((task, index) => {
          if (task.status !== 'running') return;
          task.speed = Math.max(80, (task.speed || 320) + ((index % 2 ? -1 : 1) * (14 + Math.random() * 22)));
          task.progress = Math.min(100, task.progress + 0.12 + Math.random() * .22);
          task.updated = '刚刚';
          if (task.progress >= 100) { task.progress = 100; task.speed = 0; task.status = 'completed'; }
          changed = true;
        });
        if (!changed) return;
        const addedModel = syncCompletedDownloads();
        renderTasks();
        if (addedModel) renderModels();
        const detailOverlay = getById('modelDistributionDetailOverlay');
        if (currentDetailId && detailOverlay?.classList.contains('open')) renderDetail(getTask(currentDetailId));
      }, 2000);

      syncTargetMode();
      syncClusterSummary();
      renderModels();
      renderTasks();
      switchSubview('catalog');
      switchDistributionKind('model');
    })();
};
