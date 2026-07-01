import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { ThemeProvider } from 'next-themes';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import AtAasDesign from './pages/ataasDesign';

dayjs.locale('zh-cn');

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <ThemeProvider attribute="data-theme" defaultTheme="light" forcedTheme="light">
      <ConfigProvider locale={zhCN}>
        <AtAasDesign />
        <Toaster richColors position="top-right" />
      </ConfigProvider>
    </ThemeProvider>
  </BrowserRouter>,
);
