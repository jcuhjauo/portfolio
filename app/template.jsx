import PageFlyby from '../components/PageFlyby';

// template 每次換頁都會重新掛載,剛好拿來觸發飛行動畫。
export default function Template({ children }) {
  return <PageFlyby>{children}</PageFlyby>;
}
