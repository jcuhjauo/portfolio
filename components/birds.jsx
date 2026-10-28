// 六隻小鳥(朝右),換頁飛行和導覽列 logo 共用。
function Bird({ size = 64, body, head, wing, tail, beak, feet = '#d6ccc9', children }) {
  return (
    <svg viewBox="0 0 70 56" width={size} height={size * 0.8} aria-hidden="true">
      <path d="M16 34 L2 45 L11 47 L22 38 Z" fill={tail} />
      <path d="M28 43 L28 51 M35 43 L35 51" stroke={feet} strokeWidth="1.8" strokeLinecap="round" />
      <ellipse cx="31" cy="32" rx="18" ry="13" fill={body} />
      <circle cx="47" cy="22" r="11" fill={head} />
      {children}
      <path d="M56 21 Q65 23 61 29 Q55 30 54 25 Z" fill={beak} />
      <g className="wing">
        <path d="M16 31 Q29 17 42 31 Q30 43 16 31 Z" fill={wing} />
      </g>
    </svg>
  );
}

const Eye = ({ cx = 51, cy = 20 }) => (
  <>
    <circle cx={cx} cy={cy} r="2.2" fill="#2b2a28" />
    <circle cx={cx + 0.8} cy={cy - 0.8} r="0.7" fill="#fff" />
  </>
);

export const BIRDS = [
  // 首頁的大隻
  ({ size }) => (
    <Bird size={size} body="#d8d9ea" head="#fcfcfa" wing="#4d607d" tail="#4d607d" beak="#ebc5bc">
      <Eye />
    </Bird>
  ),
  // 首頁的小隻
  ({ size }) => (
    <Bird size={size} body="#3f64a8" head="#f8f6f0" wing="#315894" tail="#315894" beak="#ebc5bc" feet="#e6cac3">
      <Eye />
    </Bird>
  ),
  // 灰藍色鸚鵡
  ({ size }) => (
    <Bird size={size} body="#a3abc6" head="#dcdfea" wing="#7e89ae" tail="#6f7aa0" beak="#e3c04a" feet="#e9a0a0">
      <circle cx="52" cy="26" r="0.9" fill="#6a7088" />
      <circle cx="49" cy="28" r="0.8" fill="#6a7088" />
      <Eye />
    </Bird>
  ),
    // 白頭藍身鸚鵡
  ({ size }) => (
    <Bird size={size} body="#7a8fd2" head="#fbfaf6" wing="#c9d3f0" tail="#6a7fc4" beak="#e8d27a" feet="#e9a0a0">
      
      {/* 臉頰斑點 */}
      <ellipse cx="51.5" cy="27" rx="1.2" ry="1" fill="#5b6aa8" />
      <ellipse cx="48.2" cy="28.6" rx="1" ry="0.85" fill="#5b6aa8" />
      
      <Eye />
    </Bird>
  ),
  // 綠繡眼
  ({ size }) => (
    <Bird size={size} body="#b7bab0" head="#8d9b2f" wing="#6b7a2a" tail="#55621f" beak="#5a5a5a" feet="#8a8a80">
      <ellipse cx="50" cy="28" rx="6" ry="3.4" fill="#d8d52a" />
      <circle cx="51" cy="20" r="4" fill="#fff" />
      <Eye />
    </Bird>
  ),
  // 文鳥
  ({ size }) => (
    <Bird size={size} body="#6c7078" head="#1d1d20" wing="#565a62" tail="#3a3c42" beak="#e8667a" feet="#e8a0a8">
      <ellipse cx="49" cy="27" rx="6.5" ry="4" fill="#fbfaf6" />
      <circle cx="51" cy="20" r="3.4" fill="#d9606e" />
      <circle cx="51" cy="20" r="1.8" fill="#2b2a28" />
    </Bird>
  ),
];