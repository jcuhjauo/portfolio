'use client';

import { useEffect, useState } from 'react';
import { BIRDS } from './birds';

// 換頁時隨機一隻小鳥飛過畫面,不會連續出現同一隻。第一次載入不飛。
export default function PageFlyby({ children }) {
  const [pick, setPick] = useState(null);

  useEffect(() => {
    if (window.__visited) {
      let n;
      do {
        n = Math.floor(Math.random() * BIRDS.length);
      } while (n === window.__lastBird && BIRDS.length > 1);
      window.__lastBird = n;
      setPick(n);
      const t = setTimeout(() => setPick(null), 1300);
      return () => clearTimeout(t);
    }
    window.__visited = true;
  }, []);

  const Chosen = pick !== null ? BIRDS[pick] : null;

  return (
    <>
      {Chosen && (
        <div className="flyby" aria-hidden="true">
          <Chosen size={64} />
        </div>
      )}
      {children}
    </>
  );
}