import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: '趙誼臻 ・ 軟體工程師',
  description: '趙誼臻的個人作品集,正在往軟體工程師的路上前進。',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// 在畫面繪製前先套用主題,避免深色模式使用者看到白畫面閃一下。
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+TC:wght@400;500;600&family=Noto+Serif+TC:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
