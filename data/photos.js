// 攝影展間的作品資料。想換成自己的照片,改這個檔案就好。
//
// 每一筆的欄位:
//   id      唯一代號,不要重複
//   src     照片路徑。把檔案放進 public/images/photos/,例如 '/images/photos/morning-fog.jpg'
//           留 null 的話,展間會顯示下面 scene 指定的示意圖
//   orient  'landscape'(橫幅)或 'portrait'(直幅),決定牆上的比例
//   title / place / date / camera / note   說明牌與大圖旁的文字
//   scene   沒有 src 時用的示意圖。有放照片之後可以刪掉
//
// 小提醒:照片建議先壓到長邊 2000px 以內,JPG 品質 80 左右,載入會快很多。
// 展間會把這些作品循環掛在無盡的空間裡,作品越多,重複出現的機率越低。

export const PHOTOS = [
  {
    id: 'p1',
    src: '/images/photos/TAIYU.JPG',
    scene: 'parrots',
    orient: 'landscape',
    title: '抬頭',
    place: '學校附近的大樓',
    date: '2026.03',
    //camera: 'iPhone 15 Pro · 24mm · f/1.8 · 1/120s',
    note: '兩隻鸚鵡難得安靜待在同一根樹枝上。午後的光從左邊進來,羽色比平常更透。',
  },
  {
    id: 'p2',
    src: null,
    scene: 'mountain',
    orient: 'landscape',
    title: '晨霧',
    place: '陽明山',
    date: '2025.11',
    camera: 'Sony α7C · 85mm · f/8 · 1/250s · ISO 100',
    note: '清晨六點的稜線,霧還沒散。等了二十分鐘,太陽才從右邊的雲縫露出來。',
  },
  {
    id: 'p3',
    src: null,
    scene: 'sunset',
    orient: 'landscape',
    title: '退潮',
    place: '東北角海岸',
    date: '2025.08',
    camera: 'Fujifilm X-T30 · 35mm · f/11 · 1/60s',
    note: '潮水退到最遠的時候,天空和海面的顏色幾乎一樣。',
  },
  {
    id: 'p4',
    src: null,
    scene: 'forest',
    orient: 'portrait',
    title: '入林',
    place: '山區步道',
    date: '2025.05',
    camera: 'Sony α7C · 35mm · f/4 · 1/160s · ISO 200',
    note: '小徑盡頭有光,所以我停下來按了快門。',
  },
  {
    id: 'p5',
    src: null,
    scene: 'city',
    orient: 'landscape',
    title: '夜班',
    place: '台北',
    date: '2026.01',
    camera: 'Sony α7C · 50mm · f/2 · 1/60s · ISO 1600',
    note: '下班時間過了,大樓還亮著幾格燈。',
  },
  {
    id: 'p6',
    src: null,
    scene: 'bloom',
    orient: 'portrait',
    title: '盛開',
    place: '社區花圃',
    date: '2026.04',
    camera: 'Fujifilm X-T30 · 60mm macro · f/4 · 1/250s',
    note: '微距拍的。花瓣上有一點水氣,所以顏色看起來比較深。',
  },
  {
    id: 'p7',
    src: null,
    scene: 'stars',
    orient: 'landscape',
    title: '星空',
    place: '合歡山',
    date: '2025.09',
    camera: 'Sony α7C · 20mm · f/1.8 · 20s · ISO 3200',
    note: '曝光二十秒,星星剛好還沒拉成線。',
  },
  {
    id: 'p8',
    src: null,
    scene: 'street',
    orient: 'landscape',
    title: '雨後',
    place: '台北小巷',
    date: '2025.12',
    camera: 'Fujifilm X-T30 · 23mm · f/2.8 · 1/125s',
    note: '路燈倒映在濕地上,我蹲低一點拍。',
  },
];
