'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PHOTOS } from '../../data/photos';
import { createGallery } from './engine';
import Lightbox from './Lightbox';
import styles from './gallery.module.css';

// 編輯模式改的內容只存在「這個瀏覽器」的 localStorage,不會影響別人看到的網站。
// 要讓改動正式生效,請把內容寫進 data/photos.js(燈箱裡的「複製資料」可以匯出)。
const STORE = 'gallery-photo-overrides-v1';
const TEXT_FIELDS = ['title', 'place', 'date', 'camera', 'note'];

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
}
function writeOverrides(o) {
  try {
    localStorage.setItem(STORE, JSON.stringify(o));
    return true;
  } catch {
    return false;
  }
}

function loadPhotos() {
  const ov = readOverrides();
  return PHOTOS.map((p) => {
    const q = { ...p };
    const o = ov[p.id];
    if (o) {
      TEXT_FIELDS.forEach((k) => {
        if (typeof o[k] === 'string') q[k] = o[k];
      });
      if (typeof o.src === 'string') {
        q.src = o.src;
        if (o.orient) q.orient = o.orient;
      }
    }
    return q;
  });
}

// 螢幕上的方向鍵:按住持續移動
function holdProps(engineRef, key) {
  const set = (v) => engineRef.current && engineRef.current.setPad(key, v);
  return {
    onPointerDown: (e) => {
      set(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    },
    onPointerUp: () => set(false),
    onPointerCancel: () => set(false),
    onPointerLeave: () => set(false),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        set(true);
      }
    },
    onKeyUp: (e) => {
      if (e.key === 'Enter' || e.key === ' ') set(false);
    },
  };
}

export default function InfiniteGallery() {
  const stageRef = useRef(null);
  const glRef = useRef(null);
  const miniRef = useRef(null);
  const engineRef = useRef(null);
  const photosRef = useRef(null); // 引擎讀的就是這個陣列,改它就等於改展間

  const [phase, setPhase] = useState('loading'); // loading | ready | fail
  const [photos, setPhotos] = useState(() => PHOTOS.map((p) => ({ ...p })));
  const [near, setNear] = useState(null);
  const [hover, setHover] = useState(null);
  const [openIdx, setOpenIdx] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  // 網址加上 ?edit 才會出現編輯功能(給你自己用,訪客看不到)
  useEffect(() => {
    setCanEdit(new URLSearchParams(window.location.search).has('edit'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    let engine = null;
    const list = loadPhotos();
    photosRef.current = list;
    setPhotos(list.map((p) => ({ ...p })));

    // three.js 只在瀏覽器端載入,伺服器端渲染時不會碰到它
    import('three')
      .then((THREE) => {
        if (cancelled) return;
        try {
          engine = createGallery(THREE, {
            stage: stageRef.current,
            canvas: glRef.current,
            mini: miniRef.current,
            photos: list,
            classes: { drag: styles.drag, hot: styles.hot },
            onNear: setNear,
            onHover: setHover,
            onOpen: setOpenIdx,
            onReady: () => setPhase('ready'),
          });
          engineRef.current = engine;
        } catch {
          setPhase('fail');
        }
      })
      .catch(() => {
        if (!cancelled) setPhase('fail');
      });

    return () => {
      cancelled = true;
      if (engine) engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // 燈箱開著就暫停走動
  useEffect(() => {
    if (engineRef.current) engineRef.current.setPaused(openIdx !== null);
  }, [openIdx]);

  const handleSave = useCallback((index, patch) => {
    const list = photosRef.current;
    if (!list) return true;
    Object.assign(list[index], patch);
    const p = list[index];
    const ov = readOverrides();
    const entry = {};
    TEXT_FIELDS.forEach((k) => {
      entry[k] = p[k];
    });
    if (typeof patch.src === 'string') {
      entry.src = patch.src;
      entry.orient = p.orient;
    } else if (ov[p.id] && typeof ov[p.id].src === 'string') {
      entry.src = ov[p.id].src;
      entry.orient = ov[p.id].orient;
    }
    ov[p.id] = entry;
    const ok = writeOverrides(ov);
    if (engineRef.current) engineRef.current.refreshPhoto(index);
    setPhotos(list.map((q) => ({ ...q })));
    return ok;
  }, []);

  const handleReset = useCallback((index) => {
    const list = photosRef.current;
    if (!list) return;
    const base = PHOTOS[index];
    Object.assign(list[index], { ...base });
    const ov = readOverrides();
    delete ov[base.id];
    writeOverrides(ov);
    if (engineRef.current) engineRef.current.refreshPhoto(index);
    setPhotos(list.map((q) => ({ ...q })));
  }, []);

  const nearPhoto = near !== null ? photos[near] : null;
  const hoverPhoto = hover !== null ? photos[hover] : null;

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <div>
          <span className={styles.eyebrow}>Photo Gallery · 無盡空間</span>
          <h1 className={styles.title}>趙誼臻的無盡展間</h1>
        </div>
        <p className={styles.hint}>
          <span>
            <kbd>W</kbd>
            <kbd>S</kbd> 前後 <kbd>A</kbd>
            <kbd>D</kbd> 左右平移
          </span>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> 轉向,或拖曳畫面轉頭
          </span>
          <span>
            <kbd>Shift</kbd> 加速
          </span>
          <span>
            <kbd>Enter</kbd> 觀看
          </span>
        </p>
      </header>

      <section ref={stageRef} className={styles.stage} tabIndex={0} aria-label="無盡的立體展間,用鍵盤或拖曳在其中走動">
        <canvas ref={glRef} className={styles.gl} />
        <div className={styles.mini}>
          <span>周邊地圖</span>
          <canvas ref={miniRef} width={300} height={300} aria-label="周邊雷達圖,點一下走到該處" />
        </div>
        {hoverPhoto && <div className={styles.tip}>「{hoverPhoto.title}」點一下走近觀看</div>}
        {phase === 'loading' && <div className={styles.overlay}>正在點亮展間…</div>}
        {phase === 'fail' && <div className={styles.overlay}>這台裝置無法顯示 3D 畫面。可以改用電腦或較新的瀏覽器開啟。</div>}
      </section>

      <div className={styles.bar}>
        <p className={styles.status} aria-live="polite">
          {nearPhoto ? (
            <>
              <b>{nearPhoto.title}</b>　按 Enter 或「觀看這幅」放大
            </>
          ) : (
            '光幕會一直延伸下去,往前走,或點地板與地圖就能移動。'
          )}
        </p>
        <div className={styles.pad}>
          <button type="button" className={styles.btn} aria-label="向左轉" {...holdProps(engineRef, 'l')}>
            ↶
          </button>
          <button type="button" className={styles.btn} aria-label="前進" {...holdProps(engineRef, 'f')}>
            ▲
          </button>
          <button type="button" className={styles.btn} aria-label="後退" {...holdProps(engineRef, 'b')}>
            ▼
          </button>
          <button type="button" className={styles.btn} aria-label="向右轉" {...holdProps(engineRef, 'r')}>
            ↷
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.primary}`}
            disabled={near === null}
            onClick={() => engineRef.current && engineRef.current.openNearest()}
          >
            觀看這幅
          </button>
        </div>
      </div>

      <p className={styles.foot}>
        空間會隨著你走動一直長出新的光幕,作品會循環出現在不同位置,每塊光幕的兩面都有說明牌。點作品會走近,再點一次可以看大圖。
      </p>

      {openIdx !== null && (
        <Lightbox
          photos={photos}
          index={openIdx}
          canEdit={canEdit}
          onIndex={setOpenIdx}
          onClose={() => setOpenIdx(null)}
          onSave={handleSave}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
