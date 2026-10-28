// 還沒放照片時使用的示意圖(SVG)。放上真的照片後就不會用到。
import { rng } from './rng';

let uid = 0;

function gradient(id, stops) {
  const inner = stops.map((s) => `<stop offset="${s[0]}" stop-color="${s[1]}"/>`).join('');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${inner}</linearGradient>`;
}

export function placeholderSVG(kind) {
  const id = `g${++uid}`;
  const land = ['mountain', 'sunset', 'city', 'stars', 'street'].includes(kind);
  const w = land ? 400 : 300;
  const h = land ? 300 : 400;
  const r = rng(kind.length * 131 + kind.charCodeAt(0) * 7);
  let defs = '';
  let body = '';

  if (kind === 'mountain') {
    defs = gradient(id, [[0, '#f3d9c4'], [0.55, '#f7ead9'], [1, '#e9eef0']]);
    body = `<rect width="400" height="300" fill="url(#${id})"/><circle cx="292" cy="92" r="34" fill="#fff4dc" opacity="0.9"/>`;
    const cols = ['#b9c3cc', '#8fa0b0', '#5c6b7a'];
    const bases = [150, 190, 226];
    for (let k = 0; k < 3; k++) {
      let d = `M0 300 L0 ${bases[k]}`;
      for (let i = 1; i <= 10; i++) d += ` L${i * 40} ${Math.round(bases[k] - 10 - r() * (55 - k * 12))}`;
      body += `<path d="${d} L400 300 Z" fill="${cols[k]}"/>`;
    }
  } else if (kind === 'sunset') {
    defs = gradient(id, [[0, '#5b4b6e'], [0.5, '#e58a6e'], [0.78, '#f2c27b']]);
    body = `<rect width="400" height="300" fill="url(#${id})"/><circle cx="200" cy="186" r="48" fill="#fde7a8"/><rect y="190" width="400" height="110" fill="#2f3b4c"/>`;
    for (let k = 0; k < 6; k++) {
      body += `<rect x="${200 - (46 - k * 6)}" y="${198 + k * 15}" width="${92 - k * 12}" height="3" rx="1.5" fill="#fde7a8" opacity="0.6"/>`;
    }
  } else if (kind === 'city') {
    defs = gradient(id, [[0, '#1b2540'], [1, '#3b4a73']]);
    body = `<rect width="400" height="300" fill="url(#${id})"/><circle cx="330" cy="62" r="20" fill="#f3ead2" opacity="0.9"/>`;
    let x = 0;
    while (x < 400) {
      const bw = 24 + Math.floor(r() * 30);
      const bh = 70 + Math.floor(r() * 130);
      body += `<rect x="${x}" y="${300 - bh}" width="${bw - 2}" height="${bh}" fill="#10172b"/>`;
      for (let wy = 300 - bh + 8; wy < 292; wy += 12) {
        for (let wx = x + 5; wx < x + bw - 8; wx += 9) {
          if (r() > 0.55) body += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="#f2c872" opacity="0.85"/>`;
        }
      }
      x += bw;
    }
  } else if (kind === 'stars') {
    defs = gradient(id, [[0, '#0e1630'], [1, '#33406b']]);
    body = `<rect width="400" height="300" fill="url(#${id})"/>`;
    for (let i = 0; i < 80; i++) {
      body += `<circle cx="${Math.round(r() * 400)}" cy="${Math.round(r() * 200)}" r="${(0.5 + r() * 1.2).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`;
    }
    let rd = 'M0 300 L0 240';
    for (let i = 1; i <= 8; i++) rd += ` L${i * 50} ${Math.round(215 + r() * 50)}`;
    body += `<path d="${rd} L400 300 Z" fill="#0b1020"/>`;
  } else if (kind === 'street') {
    defs = gradient(id, [[0, '#6b7a8c'], [1, '#c9ccd0']]);
    body = `<rect width="400" height="300" fill="url(#${id})"/><rect x="0" y="90" width="120" height="120" fill="#4b5868"/><rect x="250" y="60" width="150" height="150" fill="#4b5868"/><rect y="200" width="400" height="100" fill="#3a4652"/>`;
    [90, 230, 350].forEach((lx) => {
      body += `<rect x="${lx - 2}" y="110" width="4" height="92" fill="#27303a"/><circle cx="${lx}" cy="108" r="9" fill="#ffe2a0"/><rect x="${lx - 3}" y="208" width="6" height="76" fill="#ffe2a0" opacity="0.3"/>`;
    });
  } else if (kind === 'parrots') {
    defs = gradient(id, [[0, '#f4d6cc'], [1, '#fbf1e2']]);
    body =
      `<rect width="300" height="400" fill="url(#${id})"/><path d="M-10 262 Q150 236 310 250" stroke="#8a6a4a" stroke-width="9" fill="none" stroke-linecap="round"/>` +
      '<g transform="translate(92 190)"><ellipse cx="0" cy="40" rx="44" ry="42" fill="#c4c6dc"/><circle cx="0" cy="-4" r="34" fill="#fafaf5"/><circle cx="14" cy="-6" r="4.5" fill="#2b2a28"/><path d="M30 -4 Q46 0 42 12 Q36 16 28 10 Z" fill="#ebc5bc"/></g>' +
      '<g transform="translate(208 196) scale(-1 1)"><ellipse cx="0" cy="40" rx="44" ry="42" fill="#4f78bd"/><circle cx="0" cy="-4" r="34" fill="#f6f4ee"/><circle cx="14" cy="-6" r="4.5" fill="#2b2a28"/><path d="M30 -4 Q46 0 42 12 Q36 16 28 10 Z" fill="#ebc5bc"/></g>';
  } else if (kind === 'forest') {
    defs = gradient(id, [[0, '#dfe8d0'], [1, '#7fa07a']]);
    body = `<rect width="300" height="400" fill="url(#${id})"/>`;
    const tc = ['#a8c0a0', '#6f9168', '#3f6249'];
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < 5; i++) {
        const tx = Math.round(r() * 300);
        const ty = 170 + k * 70 + Math.round(r() * 40);
        const ts = 30 + k * 14;
        for (let s = 0; s < 3; s++) {
          body += `<path d="M${tx} ${ty - 60 + s * 30} L${tx - ts + s * 4} ${ty - 10 + s * 30} L${tx + ts - s * 4} ${ty - 10 + s * 30} Z" fill="${tc[k]}"/>`;
        }
      }
    }
    body += '<path d="M128 400 L172 400 L158 250 L142 250 Z" fill="#efe6cf" opacity="0.8"/>';
  } else if (kind === 'bloom') {
    defs = gradient(id, [[0, '#f6e3e0'], [1, '#f7efe0']]);
    body = `<rect width="300" height="400" fill="url(#${id})"/><path d="M150 240 Q146 320 152 400" stroke="#6f9168" stroke-width="6" fill="none"/><ellipse cx="124" cy="330" rx="26" ry="10" transform="rotate(-25 124 330)" fill="#8fb088"/>`;
    for (let i = 0; i < 12; i++) {
      body += `<ellipse cx="150" cy="132" rx="18" ry="52" transform="rotate(${i * 30} 150 190)" fill="${i % 2 ? '#e8a9a0' : '#f0c4bb'}" opacity="0.88"/>`;
    }
    body += '<circle cx="150" cy="190" r="22" fill="#e3a857"/>';
  } else {
    defs = gradient(id, [[0, '#20243a'], [1, '#3a4166']]);
    body = `<rect width="${w}" height="${h}" fill="url(#${id})"/>`;
  }

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
}

export function placeholderURL(kind) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSVG(kind || ''))}`;
}
