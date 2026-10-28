// 首頁「專案作品」的資料。新增專案只要在陣列裡加一筆。
// 截圖放在 public/images/,例如 public/images/scan.png。

export const PROJECTS = [
  {
    id: 'parrotcare',
    title: 'ParrotCare',
    sub: '寵物照護・健康紀錄',
    image: '/images/scan.png',
    imageAlt: 'ParrotCare 掃描頁面截圖',
    desc: '拍下獸醫開的收據或藥單,AI 會自動辨識並整理成看得懂的日期、體重、用藥紀錄,不用自己一個字一個字打。前端用 Next.js、後端用 Laravel 搭配 Google Gemini 做圖片辨識,資料庫接的是 Supabase 的 Postgres——從資料庫設計、後端 API、AI 串接到部署上線,都是自己一手完成的。',
    tags: ['Next.js', 'Laravel', 'PostgreSQL', 'Supabase', 'Gemini API', 'Docker', 'Render', 'Vercel'],
    links: [
      { label: '查看網站 →', href: 'https://parrotcare-ai-frontend.vercel.app' },
      { label: '前端原始碼 →', href: 'https://github.com/jcuhjauo/parrotcare-ai-frontend' },
      { label: '後端原始碼 →', href: 'https://github.com/jcuhjauo/parrotcare-ai-backend' },
    ],
  },
  {
    id: 'campus-login',
    title: '校園登入系統',
    sub: '多因子驗證與安全防護機制・2025/6 ~ 2026/1',
    image: '/images/login.png',
    imageAlt: '校園登入系統頁面截圖',
    desc: '使用 AI Coding 開發的校園登入系統,整合多因子驗證來提升帳號安全性。自主研究並實作 Microsoft Authenticator 使用的 TOTP 協定,做出雙重驗證;同時設計 Rate Limit 與 Captcha,阻擋自動化暴力破解,並針對資料庫 API 做安全性優化。前後端串接、資料庫規劃與 PHP 驗證邏輯都由我負責。',
    tags: ['PHP', 'MySQL', 'HTML/CSS', 'JavaScript', 'TOTP', 'Rate Limit', 'CAPTCHA'],
    links: [{ label: '查看簡報 →', href: 'https://canva.link/bt0dqf59uhoa3at' }],
  },
];
