'use client';

import { useEffect, useRef } from 'react';

// 首頁的兩隻牡丹鸚鵡(SVG)。外層 <g> 管位置與大小,內層 <g className="bird"> 管呼吸晃動動畫。
// 眼睛(.eye)會跟著滑鼠方向轉動,最多偏移 3 個 SVG 單位。
export default function ParrotPair() {
  const ref = useRef(null);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e) => {
      const r = svg.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(d / 200, 1) * 3;
      svg.style.setProperty('--ex', `${(dx / d) * k}px`);
      svg.style.setProperty('--ey', `${(dy / d) * k}px`);
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  return (
    <div className="bird-wrap" aria-hidden="true">
      <svg ref={ref} viewBox="0 0 330 220" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bodyBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5f8fa" />
            <stop offset="25%" stopColor="#f5f8fa" />
            <stop offset="100%" stopColor="#3f64a8" />
          </linearGradient>
          <linearGradient id="bodyBlueBig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fafaf5" />
            <stop offset="30%" stopColor="#fafaf5" />
            <stop offset="100%" stopColor="#c4c6dc" />
          </linearGradient>
          <linearGradient id="headBig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ebeae6" />
            <stop offset="50%" stopColor="#fcfcfa" />
            <stop offset="100%" stopColor="#fbfaf6" />
          </linearGradient>
          <linearGradient id="headSmall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d3d0cb" />
            <stop offset="50%" stopColor="#f8f6f0" />
            <stop offset="100%" stopColor="#fdfcf9" />
          </linearGradient>
        </defs>

        {/* 左:大隻,面向右 */}
        <g className="bird bird-1">
          <ellipse cx="90" cy="150" rx="58" ry="55" fill="url(#bodyBlueBig)" />
          <path d="M34 148 Q20 152 24 168 Q32 172 40 162 Z" fill="#4d607d" />
          <path d="M146 148 Q160 152 156 168 Q148 172 140 162 Z" fill="#4d607d" />
          <path d="M74 200 L70 214 M74 200 L76 216 M74 200 L80 213" stroke="#d6ccc9" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M104 200 L100 214 M104 200 L106 216 M104 200 L110 213" stroke="#d6ccc9" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="90" cy="82" r="46" fill="url(#headBig)" />
          <g className="eye">
            <circle cx="106" cy="80" r="5.5" fill="#2b2a28" />
            <circle cx="108" cy="77.5" r="1.8" fill="#fff" />
          </g>
          <path d="M126 84 Q146 88 140 104 Q132 110 124 100 Z" fill="#ebc5bc" />
          <path d="M126 98 Q134 103 141 100" stroke="#a85d2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* 右:小隻,面向左 */}
        <g transform="translate(150 22) scale(0.88)">
          <g className="bird bird-2">
            <ellipse cx="100" cy="150" rx="58" ry="55" fill="url(#bodyBlue)" />
            <path d="M44 148 Q30 152 34 168 Q42 172 50 162 Z" fill="#315894" />
            <path d="M156 148 Q170 152 166 168 Q158 172 150 162 Z" fill="#315894" />
            <path d="M84 200 L80 214 M84 200 L86 216 M84 200 L90 213" stroke="#e6cac3" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M114 200 L110 214 M114 200 L116 216 M114 200 L120 213" stroke="#e6cac3" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="100" cy="82" r="46" fill="url(#headSmall)" />
            <g className="eye">
              <circle cx="84" cy="80" r="5.5" fill="#2b2a28" />
              <circle cx="82" cy="77.5" r="1.8" fill="#fff" />
            </g>
            <path d="M64 84 Q44 88 50 104 Q58 110 66 100 Z" fill="#ebc5bc" />
            <path d="M64 98 Q56 103 49 100" stroke="#a85d2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </svg>
    </div>
  );
}
