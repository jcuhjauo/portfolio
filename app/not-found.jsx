import Link from 'next/link';

export const metadata = { title: '找不到頁面 ・ 趙誼臻' };

export default function NotFound() {
  return (
    <div className="wrap">
      <section className="hero notfound">
        <p className="eyebrow">404</p>
        <h1 className="tagline">
          鸚鵡飛走了,
          <br />
          找不到這個頁面。
        </h1>
        <p className="bio">牠大概是去偷吃葵花籽了。網址可能打錯,或這個頁面已經搬家。</p>
        <div className="links-row">
          <Link className="pill" href="/">回首頁</Link>
          <Link className="pill" href="/projects">看專案作品</Link>
        </div>
      </section>
    </div>
  );
}