// 無盡展間的 3D 引擎(three.js r128)。
//
// 這個檔案不依賴 React:給它一個 canvas、一張小地圖 canvas 和作品陣列,
// 它就會畫出一個沒有盡頭的暗色空間,並把作品掛在發光的光幕上。
// 畫面與使用者的互動(燈箱、按鈕)由 InfiniteGallery.jsx 處理,
// 引擎只透過 onNear / onHover / onOpen 回報狀態。
//
// 空間怎麼「無盡」:世界被切成 8 公尺的格子,每一格依座標算出固定的內容
// (有沒有光幕、掛哪幅作品、朝哪個方向)。只建立你周圍的格子,走遠就移除,
// 所以走多遠都不會變慢,而且同一個地方每次來看到的都一樣。

import { placeholderURL } from './placeholders';
import { rng } from './rng';

const CELL = 8; // 一格的邊長(公尺)
const RADIUS = 5; // 同時保留你周圍幾格
const EYE = 1.6; // 眼睛高度
const MARGIN = 0.5; // 離光幕的最小距離(碰撞)
const SLAB_H = 3.4; // 光幕高度
const SLAB_D = 0.18; // 光幕厚度
const CY = 2.15; // 光幕中心離地高度
const FT = 4; // 地板格線大小
const RR = 32; // 小地圖顯示半徑(公尺)

// 沒有照片時,各示意圖的光暈顏色。有照片時會改用照片的平均色。
const GLOW = {
  parrots: 0xff9fb8,
  mountain: 0xffc49a,
  sunset: 0xff8a5c,
  forest: 0x7fe3a6,
  city: 0x6f8cff,
  bloom: 0xff8fc4,
  stars: 0x8a9bff,
  street: 0xffd27a,
};

// 起點附近手動擺的三面光幕,讓一進來就有東西可看。其餘格子都是自動產生。
const FORCED = {
  '0,-2': { x: 0, z: -9, ry: 0, idx: 0 },
  '-1,-2': { x: -6.5, z: -13.5, ry: 0.5, idx: 1 },
  '0,-3': { x: 7.5, z: -17.5, ry: -0.5, idx: 2 },
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad2 = (n) => (n < 10 ? '0' : '') + n;

function hash2(a, b) {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function angDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function fitText(x, text, maxW, size, weight, family) {
  let s = size;
  x.font = `${weight} ${s}px ${family}`;
  while (x.measureText(text).width > maxW && s > 18) {
    s -= 2;
    x.font = `${weight} ${s}px ${family}`;
  }
}

/**
 * @param THREE  three.js 模組(由呼叫端動態載入,避免伺服器端渲染時載入)
 * @param opts   { stage, canvas, mini, photos, classes, onNear, onHover, onOpen, onReady }
 *   photos 是會被 InfiniteGallery 直接修改的陣列;引擎每次都讀最新內容。
 */
export function createGallery(THREE, opts) {
  const { stage, canvas, mini, photos, classes = {}, onNear, onHover, onOpen, onReady } = opts;
  const N = photos.length;
  const miniCtx = mini.getContext('2d');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); // 裝置不支援時這行會丟錯,由呼叫端處理
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  let disposed = false;
  let paused = false;
  let raf = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050a);
  scene.fog = new THREE.FogExp2(0x04050a, 0.034);
  const camera = new THREE.PerspectiveCamera(68, 1.6, 0.1, 100);
  camera.rotation.order = 'YXZ';

  /* ---------- 共用材質與貼圖 ---------- */
  function radialTexture(stops, size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach((s) => g.addColorStop(s[0], s[1]));
    x.fillStyle = g;
    x.fillRect(0, 0, size, size);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const poolTex = radialTexture([[0, 'rgba(255,255,255,0.95)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']], 256);
  const dotTex = radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']], 64);

  // 鏡面地板:半透明的深色平面,下面放著每面光幕的倒影
  function gridTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#04050b';
    x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#1a2142';
    x.fillRect(0, 0, 128, 2);
    x.fillRect(0, 0, 2, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(60, 60);
    t.anisotropy = maxAniso;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }
  const gridTex = gridTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(FT * 60, FT * 60),
    new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0.8, depthWrite: false }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = 2;
  scene.add(floor);

  // 漂浮的光點,會繞著你循環,所以走到哪都有
  const PN = 700;
  const pPos = new Float32Array(PN * 3);
  const pCol = new Float32Array(PN * 3);
  const pr = rng(21);
  const tmpC = new THREE.Color();
  for (let i = 0; i < PN; i++) {
    pPos[i * 3] = (pr() - 0.5) * 44;
    pPos[i * 3 + 1] = 0.2 + pr() * 6;
    pPos[i * 3 + 2] = (pr() - 0.5) * 44;
    tmpC.setHSL(pr(), 0.7, 0.72);
    pCol[i * 3] = tmpC.r;
    pCol[i * 3 + 1] = tmpC.g;
    pCol[i * 3 + 2] = tmpC.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  const motes = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.12, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  motes.frustumCulled = false;
  motes.renderOrder = 4;
  scene.add(motes);

  /* ---------- 每幅作品自己的材質(所有同一幅作品的光幕共用) ---------- */
  const pm = [];

  function placardTexture(p, i) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 336;
    const x = c.getContext('2d');
    const soft = '#9aa4c8';
    const ink = '#eef1ff';
    x.fillStyle = 'rgba(10,12,24,0.92)';
    x.fillRect(0, 0, 512, 336);
    x.strokeStyle = 'rgba(160,175,255,0.5)';
    x.lineWidth = 4;
    x.strokeRect(2, 2, 508, 332);
    x.fillStyle = soft;
    x.font = '500 22px "IBM Plex Mono", monospace';
    x.fillText(`${pad2(i + 1)} / ${pad2(N)}`, 28, 52);
    if (!p.src) {
      x.textAlign = 'right';
      x.fillText('示意', 484, 52);
      x.textAlign = 'left';
    }
    x.fillStyle = ink;
    fitText(x, p.title, 456, 52, '700', '"Noto Serif TC", serif');
    x.fillText(p.title, 28, 124);
    x.fillStyle = soft;
    fitText(x, p.place, 456, 26, '400', '"IBM Plex Sans TC", sans-serif');
    x.fillText(p.place, 28, 176);
    fitText(x, p.date, 456, 26, '400', '"IBM Plex Sans TC", sans-serif');
    x.fillText(p.date, 28, 212);
    fitText(x, p.camera, 456, 19, '400', '"IBM Plex Mono", monospace');
    x.fillText(p.camera, 28, 292);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = maxAniso;
    return t;
  }

  function photoTexture(p, onColor) {
    const land = p.orient === 'landscape';
    const cw = land ? 960 : 720;
    const ch = land ? 720 : 960;
    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const x = c.getContext('2d');
    x.fillStyle = '#20243a';
    x.fillRect(0, 0, cw, ch);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = maxAniso;
    const im = new Image();
    im.onload = () => {
      if (disposed) return;
      const s = Math.max(cw / im.width, ch / im.height);
      const w = im.width * s;
      const h = im.height * s;
      x.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
      t.needsUpdate = true;
      if (p.src && onColor) {
        // 取照片的平均色當光暈顏色
        try {
          const sm = document.createElement('canvas');
          sm.width = sm.height = 1;
          const sx = sm.getContext('2d');
          sx.drawImage(im, 0, 0, 1, 1);
          const d = sx.getImageData(0, 0, 1, 1).data;
          const col = new THREE.Color(d[0] / 255, d[1] / 255, d[2] / 255);
          const hsl = {};
          col.getHSL(hsl);
          col.setHSL(hsl.h, clamp(hsl.s * 1.3 + 0.2, 0, 1), 0.62);
          onColor(col);
        } catch (e) {
          /* 跨網域的圖片讀不到顏色,維持預設光暈 */
        }
      }
    };
    im.src = p.src || placeholderURL(p.scene);
    return t;
  }

  function disposePhoto(i) {
    const m = pm[i];
    if (!m) return;
    [m.tex, m.placardTex].forEach((t) => t && t.dispose());
    ['photo', 'photoRef', 'edge', 'edgeRef', 'pool', 'placard'].forEach((k) => m[k].dispose());
  }

  function buildPhoto(i) {
    const p = photos[i];
    const glow = new THREE.Color(GLOW[p.scene] || 0xffffff);
    const m = { glow };
    m.tex = photoTexture(p, (c) => {
      glow.copy(c);
      if (m.edge) m.edge.color.copy(c);
      if (m.edgeRef) m.edgeRef.color.copy(c);
      if (m.pool) m.pool.color.copy(c);
    });
    m.placardTex = placardTexture(p, i);
    m.photo = new THREE.MeshBasicMaterial({ map: m.tex });
    m.photoRef = new THREE.MeshBasicMaterial({ map: m.tex, transparent: true, opacity: 0.3, depthWrite: false });
    m.edge = new THREE.LineBasicMaterial({ color: glow.clone() });
    m.edgeRef = new THREE.LineBasicMaterial({ color: glow.clone(), transparent: true, opacity: 0.35, depthWrite: false });
    m.pool = new THREE.MeshBasicMaterial({ map: poolTex, color: glow.clone(), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false });
    m.placard = new THREE.MeshBasicMaterial({ map: m.placardTex });
    pm[i] = m;
  }

  const sideMat = new THREE.MeshBasicMaterial({ color: 0x0c0e18 });
  const sideRefMat = new THREE.MeshBasicMaterial({ color: 0x0c0e18, transparent: true, opacity: 0.25, depthWrite: false });
  const plGeo = new THREE.PlaneGeometry(0.62, 0.41);
  const poolGeo = new THREE.PlaneGeometry(10, 10);
  const geo = {};
  [['L', 4.5], ['P', 2.55]].forEach((a) => {
    const b = new THREE.BoxGeometry(a[1], SLAB_H, SLAB_D);
    geo[a[0]] = { w: a[1], box: b, edges: new THREE.EdgesGeometry(b) };
  });
  for (let i = 0; i < N; i++) buildPhoto(i);

  /* ---------- 無盡的光幕場 ---------- */
  const slabs = {};
  let pickables = [];
  let pickDirty = true;
  let lastCell = '';

  function cellSpec(gx, gz) {
    const key = `${gx},${gz}`;
    if (FORCED[key]) {
      const f = FORCED[key];
      return { key, x: f.x, z: f.z, ry: f.ry, idx: f.idx % N };
    }
    const r = rng(hash2(gx, gz) + 17);
    if (r() > 0.58) return null;
    const x = (gx + 0.5) * CELL + (r() - 0.5) * 4;
    const z = (gz + 0.5) * CELL + (r() - 0.5) * 4;
    if (Math.hypot(x, z) < 6) return null; // 起點周圍留空
    return { key, x, z, ry: r() * Math.PI, idx: Math.floor(r() * N) };
  }

  function makeSlab(sp) {
    const m = pm[sp.idx];
    const land = photos[sp.idx].orient === 'landscape';
    const G = geo[land ? 'L' : 'P'];
    const g = new THREE.Group();
    g.position.set(sp.x, 0, sp.z);
    g.rotation.y = sp.ry;

    const body = new THREE.Mesh(G.box, [sideMat, sideMat, sideMat, sideMat, m.photo, m.photo]);
    body.position.y = CY;
    body.userData = { slab: sp, idx: sp.idx };
    g.add(body);
    const ed = new THREE.LineSegments(G.edges, m.edge);
    ed.position.y = CY;
    g.add(ed);

    // 倒影:上下翻轉的複本,放在半透明地板下面
    const rb = new THREE.Mesh(G.box, [sideRefMat, sideRefMat, sideRefMat, sideRefMat, m.photoRef, m.photoRef]);
    rb.position.y = -CY;
    rb.scale.y = -1;
    rb.renderOrder = 1;
    g.add(rb);
    const re = new THREE.LineSegments(G.edges, m.edgeRef);
    re.position.y = -CY;
    re.scale.y = -1;
    re.renderOrder = 1;
    g.add(re);

    const pool = new THREE.Mesh(poolGeo, m.pool);
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.03;
    pool.renderOrder = 3;
    g.add(pool);

    // 光幕兩面各有一張說明牌,放在照片的右手邊
    const off = G.w / 2 + 0.55;
    const pf = new THREE.Mesh(plGeo, m.placard);
    pf.position.set(off, 1.25, SLAB_D / 2 + 0.02);
    pf.userData = { slab: sp, idx: sp.idx };
    g.add(pf);
    const pb = new THREE.Mesh(plGeo, m.placard);
    pb.position.set(-off, 1.25, -SLAB_D / 2 - 0.02);
    pb.rotation.y = Math.PI;
    pb.userData = { slab: sp, idx: sp.idx };
    g.add(pb);

    sp.group = g;
    sp.w = G.w;
    sp.meshes = [body, pf, pb];
    scene.add(g);
    slabs[sp.key] = sp;
    pickDirty = true;
  }
  function removeSlab(key) {
    const sp = slabs[key];
    if (!sp) return;
    scene.remove(sp.group);
    delete slabs[key];
    pickDirty = true;
  }
  function clearAll() {
    Object.keys(slabs).forEach(removeSlab);
    lastCell = '';
  }
  function updateCells(force) {
    const gx = Math.floor(cam.x / CELL);
    const gz = Math.floor(cam.z / CELL);
    const ck = `${gx},${gz}`;
    if (!force && ck === lastCell) return;
    lastCell = ck;
    const keep = {};
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      for (let dz = -RADIUS; dz <= RADIUS; dz++) {
        if (dx * dx + dz * dz > RADIUS * RADIUS + 1) continue;
        const key = `${gx + dx},${gz + dz}`;
        keep[key] = 1;
        if (!slabs[key]) {
          const sp = cellSpec(gx + dx, gz + dz);
          if (sp) makeSlab(sp);
        }
      }
    }
    Object.keys(slabs).forEach((k) => {
      if (!keep[k]) removeSlab(k);
    });
  }
  const slabList = () => Object.keys(slabs).map((k) => slabs[k]);

  /* ---------- 視角與移動 ---------- */
  const cam = { x: 0, z: 0, yaw: 0, pitch: 0 };
  let keys = {};
  const padHeld = { f: false, b: false, l: false, r: false };
  let glide = null;
  let pendingOpen = null;
  let lastNearKey = '#';
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // 把視角推出光幕,避免穿牆
  function resolve(pos) {
    const list = slabList();
    for (let it = 0; it < 2; it++) {
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const dx = pos.x - s.x;
        const dz = pos.z - s.z;
        if (dx * dx + dz * dz > 25) continue;
        const c = Math.cos(s.ry);
        const sn = Math.sin(s.ry);
        let lx = dx * c - dz * sn;
        let lz = dx * sn + dz * c;
        const hx = s.w / 2 + MARGIN;
        const hz = SLAB_D / 2 + MARGIN;
        if (Math.abs(lx) < hx && Math.abs(lz) < hz) {
          if (hx - Math.abs(lx) < hz - Math.abs(lz)) lx = (lx < 0 ? -1 : 1) * hx;
          else lz = (lz < 0 ? -1 : 1) * hz;
          pos.x = s.x + lx * c + lz * sn;
          pos.z = s.z - lx * sn + lz * c;
        }
      }
    }
  }

  function startGlide(tx, tz, tyaw, open) {
    const t = { x: tx, z: tz };
    resolve(t);
    const dist = Math.hypot(t.x - cam.x, t.z - cam.z);
    glide = {
      t: 0,
      dur: reduce ? 0.01 : clamp(0.5 + dist * 0.08, 0.6, 2.2),
      x0: cam.x,
      z0: cam.z,
      y0: cam.yaw,
      p0: cam.pitch,
      x1: t.x,
      z1: t.z,
      dy: tyaw == null ? 0 : angDiff(cam.yaw, tyaw),
    };
    pendingOpen = open == null ? null : open;
  }
  const sideOf = (s) => ((cam.x - s.x) * Math.sin(s.ry) + (cam.z - s.z) * Math.cos(s.ry) >= 0 ? 1 : -1);

  function goToSlab(s) {
    const side = sideOf(s);
    const d = photos[s.idx].orient === 'landscape' ? 3.9 : 3.4;
    const nx = Math.sin(s.ry) * side;
    const nz = Math.cos(s.ry) * side;
    const tx = s.x + nx * d;
    const tz = s.z + nz * d;
    if (Math.hypot(cam.x - tx, cam.z - tz) < 0.9) {
      onOpen && onOpen(s.idx);
      return;
    }
    startGlide(tx, tz, Math.atan2(nx, nz), s.idx);
  }

  // 目前最適合「觀看」的光幕:在前方、夠近、你站在有說明牌的那一面
  function nearest() {
    const fx = -Math.sin(cam.yaw);
    const fz = -Math.cos(cam.yaw);
    let best = null;
    let bs = 1e9;
    const list = slabList();
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      const dx = s.x - cam.x;
      const dz = s.z - cam.z;
      const d = Math.hypot(dx, dz);
      if (d > 8 || d < 0.6) continue;
      const side = sideOf(s);
      const nx = Math.sin(s.ry) * side;
      const nz = Math.cos(s.ry) * side;
      if ((cam.x - s.x) * nx + (cam.z - s.z) * nz < 0.8) continue;
      const dot = (dx * fx + dz * fz) / d;
      if (dot < 0.6) continue;
      const score = d * (2 - dot);
      if (score < bs) {
        bs = score;
        best = s;
      }
    }
    return best;
  }

  /* ---------- 滑鼠與觸控:拖曳轉頭、點擊走近 ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let drag = null;
  let hoverDirty = false;
  let mouseX = 0;
  let mouseY = 0;
  let hoverSlab = null;

  function setNdc(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  function refreshPick() {
    if (!pickDirty) return;
    pickDirty = false;
    pickables = [];
    slabList().forEach((s) => s.meshes.forEach((m) => pickables.push(m)));
  }
  function pickSlab(e) {
    refreshPick();
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    for (let i = 0; i < hits.length; i++) {
      if (hits[i].distance < 22 && hits[i].object.userData.slab) return hits[i].object.userData.slab;
    }
    return null;
  }
  function setHover(s) {
    if (s === hoverSlab) return;
    if (hoverSlab && pm[hoverSlab.idx]) pm[hoverSlab.idx].edge.color.copy(pm[hoverSlab.idx].glow);
    hoverSlab = s;
    if (classes.hot) canvas.classList.toggle(classes.hot, !!s);
    if (s) pm[s.idx].edge.color.set(0xffffff);
    onHover && onHover(s ? s.idx : null);
  }

  function onPointerDown(e) {
    if (paused || (e.button != null && e.button > 0)) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false };
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {
      /* 部分瀏覽器不支援,忽略 */
    }
  }
  function onPointerMove(e) {
    if (drag && drag.id === e.pointerId) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
        drag.moved = true;
        if (classes.drag) canvas.classList.add(classes.drag);
        glide = null;
        pendingOpen = null;
      }
      if (drag.moved) {
        cam.yaw -= dx * 0.0042;
        cam.pitch = clamp(cam.pitch - dy * 0.0036, -0.9, 0.9);
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
    } else if (e.pointerType === 'mouse') {
      mouseX = e.clientX;
      mouseY = e.clientY;
      hoverDirty = true;
    }
  }
  function endDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const wasClick = !drag.moved && e.type === 'pointerup';
    drag = null;
    if (classes.drag) canvas.classList.remove(classes.drag);
    if (!wasClick || paused) return;
    const s = pickSlab(e);
    if (s) {
      goToSlab(s);
      return;
    }
    setNdc(e);
    ray.setFromCamera(ndc, camera);
    const pt = new THREE.Vector3();
    if (ray.ray.intersectPlane(floorPlane, pt) && Math.hypot(pt.x - cam.x, pt.z - cam.z) < 40) {
      startGlide(pt.x, pt.z, null, null);
    }
  }
  function onPointerLeave() {
    setHover(null);
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', onPointerLeave);

  /* ---------- 鍵盤 ---------- */
  const NAVKEYS = { ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, w: 1, a: 1, s: 1, d: 1 };
  const typing = (t) => t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

  function onKeyDown(e) {
    if (paused || typing(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (NAVKEYS[k]) {
      keys[k] = true;
      e.preventDefault();
    } else if (k === 'Shift') {
      keys.shift = true;
    } else if (k === 'Enter' && (document.activeElement === document.body || document.activeElement === stage)) {
      const n = nearest();
      if (n) {
        e.preventDefault();
        onOpen && onOpen(n.idx);
      }
    }
  }
  function onKeyUp(e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (NAVKEYS[k]) keys[k] = false;
    else if (k === 'Shift') keys.shift = false;
  }
  function onBlur() {
    keys = {};
    padHeld.f = padHeld.b = padHeld.l = padHeld.r = false;
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  /* ---------- 小地圖 ---------- */
  function drawMini() {
    const c = miniCtx;
    const w = mini.width;
    const h = mini.height;
    const k = (w / 2 - 6) / RR;
    const cx = w / 2;
    const cy = h / 2;
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(8,10,20,0.9)';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(160,175,255,0.22)';
    c.lineWidth = 2;
    [10, 20, 30].forEach((rr) => {
      c.beginPath();
      c.arc(cx, cy, rr * k, 0, 6.2832);
      c.stroke();
    });
    c.save();
    c.beginPath();
    c.arc(cx, cy, w / 2 - 3, 0, 6.2832);
    c.clip();
    slabList().forEach((s) => {
      const ux = (Math.cos(s.ry) * s.w) / 2;
      const uz = (-Math.sin(s.ry) * s.w) / 2;
      c.strokeStyle = `#${pm[s.idx].glow.getHexString()}`;
      c.lineWidth = 6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx + (s.x - ux - cam.x) * k, cy + (s.z - uz - cam.z) * k);
      c.lineTo(cx + (s.x + ux - cam.x) * k, cy + (s.z + uz - cam.z) * k);
      c.stroke();
    });
    c.restore();
    const a = Math.atan2(-Math.cos(cam.yaw), -Math.sin(cam.yaw));
    c.fillStyle = '#ffd27a';
    c.beginPath();
    c.arc(cx, cy, 8, 0, 6.2832);
    c.fill();
    c.strokeStyle = '#ffd27a';
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * 26, cy + Math.sin(a) * 26);
    c.stroke();
  }
  function onMiniClick(e) {
    if (paused) return;
    const r = mini.getBoundingClientRect();
    const k = ((mini.width / 2 - 6) / RR) * (r.width / mini.width);
    startGlide(cam.x + (e.clientX - r.left - r.width / 2) / k, cam.z + (e.clientY - r.top - r.height / 2) / k, null, null);
  }
  mini.addEventListener('click', onMiniClick);

  /* ---------- 主迴圈 ---------- */
  let prev = performance.now();
  let sizeW = 0;
  let sizeH = 0;
  let clock = 0;

  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h || (w === sizeW && h === sizeH)) return;
    sizeW = w;
    sizeH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function tick(now) {
    if (disposed) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    clock += dt;
    resize();

    if (!paused) {
      let mv = 0;
      let st = 0;
      let tr = 0;
      if (keys.ArrowUp || keys.w || padHeld.f) mv += 1;
      if (keys.ArrowDown || keys.s || padHeld.b) mv -= 1;
      if (keys.d) st += 1;
      if (keys.a) st -= 1;
      if (keys.ArrowLeft || padHeld.l) tr += 1;
      if (keys.ArrowRight || padHeld.r) tr -= 1;
      if (mv || st || tr) {
        glide = null;
        pendingOpen = null;
      }
      if (tr) cam.yaw += tr * 1.9 * dt;
      if (mv || st) {
        const n = Math.hypot(mv, st);
        const sp = (3.6 * (keys.shift ? 1.9 : 1) * dt) / n;
        const fx = -Math.sin(cam.yaw);
        const fz = -Math.cos(cam.yaw);
        const rx = Math.cos(cam.yaw);
        const rz = -Math.sin(cam.yaw);
        cam.x += (fx * mv + rx * st) * sp;
        cam.z += (fz * mv + rz * st) * sp;
      }
      if (glide) {
        glide.t += dt;
        const u = clamp(glide.t / glide.dur, 0, 1);
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        cam.x = glide.x0 + (glide.x1 - glide.x0) * e;
        cam.z = glide.z0 + (glide.z1 - glide.z0) * e;
        cam.yaw = glide.y0 + glide.dy * e;
        cam.pitch = glide.p0 * (1 - e);
        if (u >= 1) {
          glide = null;
          if (pendingOpen != null) {
            const o = pendingOpen;
            pendingOpen = null;
            onOpen && onOpen(o);
          }
        }
      }
      updateCells(false);
      resolve(cam);
    }

    camera.position.set(cam.x, EYE, cam.z);
    camera.rotation.set(cam.pitch, cam.yaw, 0);
    floor.position.set(Math.round(cam.x / FT) * FT, 0, Math.round(cam.z / FT) * FT);

    if (!reduce) {
      // 光點緩緩漂浮,超出範圍就繞到另一側,空間永遠不會空掉
      for (let i = 0; i < PN; i++) {
        const j = i * 3;
        pPos[j] += Math.sin(clock * 0.4 + i) * 0.12 * dt;
        pPos[j + 1] += (0.1 + (i % 5) * 0.03) * dt;
        pPos[j + 2] += Math.cos(clock * 0.35 + i * 1.7) * 0.12 * dt;
        if (pPos[j] - cam.x > 22) pPos[j] -= 44;
        else if (pPos[j] - cam.x < -22) pPos[j] += 44;
        if (pPos[j + 2] - cam.z > 22) pPos[j + 2] -= 44;
        else if (pPos[j + 2] - cam.z < -22) pPos[j + 2] += 44;
        if (pPos[j + 1] > 6.6) pPos[j + 1] = 0.2;
      }
      pGeo.attributes.position.needsUpdate = true;
      for (let q = 0; q < N; q++) {
        if (pm[q]) pm[q].pool.opacity = 0.34 + 0.16 * Math.sin(clock * 0.8 + q * 1.3);
      }
    }

    if (hoverDirty && !drag && !paused) {
      hoverDirty = false;
      setHover(pickSlab({ clientX: mouseX, clientY: mouseY }));
    }

    if (!paused) {
      const ns = nearest();
      const nk = ns ? ns.key : '';
      if (nk !== lastNearKey) {
        lastNearKey = nk;
        onNear && onNear(ns ? ns.idx : null);
      }
    }

    drawMini();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }

  /* ---------- 對外介面 ---------- */
  function rebuildAll() {
    clearAll();
    for (let i = 0; i < N; i++) {
      disposePhoto(i);
      buildPhoto(i);
    }
    updateCells(true);
  }

  updateCells(true);
  resize();
  onReady && onReady();

  // 字型載入完成後重畫說明牌,避免一開始用到備用字型
  if (document.fonts && document.fonts.load) {
    const txt = `${photos.map((p) => p.title + p.place + p.date).join('')}示意`;
    const jobs = [];
    try {
      jobs.push(document.fonts.load('700 52px "Noto Serif TC"', txt));
      jobs.push(document.fonts.load('400 26px "IBM Plex Sans TC"', txt));
      jobs.push(document.fonts.load('500 22px "IBM Plex Mono"', '0123456789/'));
    } catch (e) {
      /* 字型 API 失敗就維持目前畫面 */
    }
    Promise.all(jobs)
      .catch(() => {})
      .then(() => document.fonts.ready)
      .then(() => {
        if (!disposed) rebuildAll();
      });
  }

  raf = requestAnimationFrame((t) => {
    prev = t;
    tick(t);
  });

  return {
    // 某幅作品的文字或照片被改過,重畫它的材質與所有掛著它的光幕
    refreshPhoto(i) {
      if (disposed) return;
      clearAll();
      disposePhoto(i);
      buildPhoto(i);
      updateCells(true);
    },
    // 燈箱開著時暫停移動
    setPaused(v) {
      paused = !!v;
      if (paused) {
        keys = {};
        glide = null;
        pendingOpen = null;
        setHover(null);
      } else {
        lastNearKey = '#';
      }
    },
    // 螢幕上的方向鍵(手機用)
    setPad(key, v) {
      if (key in padHeld) padHeld[key] = !!v;
    },
    openNearest() {
      const n = nearest();
      if (n && onOpen) onOpen(n.idx);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endDrag);
      canvas.removeEventListener('pointercancel', endDrag);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      mini.removeEventListener('click', onMiniClick);
      for (let i = 0; i < N; i++) disposePhoto(i);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      Object.keys(geo).forEach((k) => {
        geo[k].box.dispose();
        geo[k].edges.dispose();
      });
      [poolTex, dotTex, gridTex, sideMat, sideRefMat, plGeo, poolGeo].forEach((o) => o.dispose());
      floor.material.dispose();
      motes.material.dispose();
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch (e) {
        /* 已經失去 context 就算了 */
      }
    },
  };
}
