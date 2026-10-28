import Link from 'next/link';
import ParrotPair from '../components/ParrotPair';
import ProjectCard from '../components/ProjectCard';
import { CubeIcon, GithubIcon, MailIcon } from '../components/Icons';
import { PROJECTS } from '../data/projects';

const EMAIL = 'juju11241103@gmail.com';
const GITHUB = 'https://github.com/jcuhjauo';

export default function Home() {
  return (
    <div className="wrap">
      <section className="hero">
        <div className="hero-top">
          <ParrotPair />
          <div className="name-block">
            <h1 className="name">趙誼臻</h1>
            <p className="role">軟體工程師・學習中</p>
          </div>
        </div>

        <p className="tagline">把想法一一實現。</p>

        <p className="bio">
          目前正往軟體工程師的路上前進,喜歡把腦中的點子做成能跑起來的系統
          <br />
          從資料庫設計、後端 API 到前端介面,皆有實際操作經驗
          <br />
          家裡養了兩隻牡丹鸚鵡,牠們常在我用電腦時湊熱鬧
          <br />
          作品集裡的 ParrotCare,就是因為牠們而誕生的&lt;3
        </p>

        <div className="links-row">
          <a className="pill" href={`mailto:${EMAIL}`}>
            <MailIcon />
            {EMAIL}
          </a>
          <a className="pill" href={GITHUB} target="_blank" rel="noopener noreferrer">
            <GithubIcon />
            jcuhjauo
          </a>
          <Link className="pill" href="/gallery">
            <CubeIcon />
            攝影展間
          </Link>
        </div>
      </section>

      <div className="divider" />

      <section className="project" id="work">
        <span className="eyebrow">專案作品</span>
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </section>

      <div className="divider" />

      <footer className="site-footer">
        <p className="footer-line">
          有想聊的專案、工作機會,
          <br />
          或只是想聊聊鸚鵡,都歡迎寫信給我。
        </p>

        <div className="links-row">
          <a className="pill" href={`mailto:${EMAIL}`}>
            <MailIcon />
            Email
          </a>
          <a className="pill" href={GITHUB} target="_blank" rel="noopener noreferrer">
            <GithubIcon />
            GitHub
          </a>
        </div>

        <div className="footer-bottom">
          <span>© 2026 趙誼臻</span>
          <span>設計靈感來自家裡的牡丹鸚鵡</span>
        </div>
      </footer>
    </div>
  );
}
