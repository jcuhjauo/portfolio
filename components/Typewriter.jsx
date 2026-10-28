'use client';

import { useEffect, useState } from 'react';

export default function Typewriter({ text, speed = 110, delay = 500 }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length);
      return;
    }
    let i = 0;
    let timer;
    const tick = () => {
      i += 1;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [text, speed, delay]);

  return (
    <>
      <span>{text.slice(0, n)}</span>
      <span className={n < text.length ? 'caret typing' : 'caret'} aria-hidden="true" />
      <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
    </>
  );
}