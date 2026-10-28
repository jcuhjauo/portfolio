// 小型可重現亂數(mulberry32)。同一個種子永遠產生同一串數字,
// 無盡展間靠它讓「同一個格子」每次都長得一樣。
export function rng(seed) {
  let a = seed | 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
