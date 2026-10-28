# 趙誼臻的個人作品集(Next.js)

首頁(自我介紹與專案)加上一個可以在裡面走動的無盡 3D 攝影展間。

## 開始使用

```bash
npm install
npm run dev
```

打開 http://localhost:3000 。展間在 http://localhost:3000/gallery 。

## 放上你自己的內容

**1. 專案截圖**:把 `scan.png`、`login.png` 放進 `public/images/`(跟原本網站同一組圖)。
專案文字在 `data/projects.js`,新增專案就多加一筆。

**2. 攝影作品**:

1. 把照片放進 `public/images/photos/`,建議長邊 2000px 以內、JPG 品質 80 左右。
2. 打開 `data/photos.js`,把對應那筆的 `src` 改成 `'/images/photos/檔名.jpg'`,並把 `orient` 設成
   `'landscape'`(橫幅)或 `'portrait'`(直幅)。
3. 標題、地點、日期、器材、說明文字也都在同一筆裡改。
4. 想多放作品就複製一筆、換新的 `id`。

展間會把這些作品循環掛在無盡的空間裡,作品越多,重複出現的機率越低。

**3. 在展間裡預覽編輯**:網址後面加上 `?edit`(例如 `/gallery?edit`),燈箱裡會多出「編輯」按鈕,
可以即時改文字、試換照片。這些改動只存在你自己的瀏覽器,訪客看不到。
改好後按「複製資料」,把輸出貼進 `data/photos.js`,才會真正生效。

## 部署到 Vercel

1. 把專案推上 GitHub。
2. 到 Vercel 選 Import Project,選這個 repo,框架會自動偵測成 Next.js,直接 Deploy。
3. 之後每次 push 到 main 都會自動更新。

## 專案結構

```
app/
  layout.jsx            全站版型、字型、導覽列
  page.jsx              首頁
  gallery/page.jsx      展間頁面
  globals.css           全站樣式
components/
  Navbar.jsx            頂部選單
  ParrotPair.jsx        首頁的兩隻鸚鵡
  ProjectCard.jsx       專案卡片
  gallery/
    InfiniteGallery.jsx 展間元件:畫面、控制列、狀態
    engine.js           3D 引擎(three.js),不依賴 React
    Lightbox.jsx        作品大圖與編輯表單
    placeholders.js     還沒放照片時的示意圖
data/
  photos.js             攝影作品資料
  projects.js           專案資料
```

## 技術說明

- three.js 固定使用 0.128.0,`package.json` 裡不要加 `^`,新版的材質與色彩設定 API 不同。
- 3D 引擎只在瀏覽器端載入(動態 `import('three')`),所以不影響首頁載入速度。
- 空間是用座標算出來的,每 8 公尺一格,只建立你周圍的格子,所以走多遠都不會變慢。
- 手機可以用畫面上的方向鍵,或直接拖曳轉頭、點地板走過去。
