import { GithubIcon, MailIcon } from './Icons';

const EMAIL = 'juju11241103@gmail.com';
const GITHUB = 'https://github.com/jcuhjauo';

export default function Footer() {
  return (
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
  );
}