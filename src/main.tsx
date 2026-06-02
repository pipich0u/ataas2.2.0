import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { createRoot } from 'react-dom/client';
import AtAasDesign from './pages/ataasDesign';

dayjs.locale('zh-cn');

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN}>
    <AtAasDesign />
  </ConfigProvider>,
);
