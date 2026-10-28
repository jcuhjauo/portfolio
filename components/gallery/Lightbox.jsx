'use client';

import { useEffect, useRef, useState } from 'react';
import { placeholderURL } from './placeholders';
import styles from './lightbox.module.css';

const pad2 = (n) => (n < 10 ? '0' : '') + n;

// 換照片時先縮小,避免存進瀏覽器的資料太大
function shrink(file) {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1400 / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * s);
        c.height = Math.round(im.height * s);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        try {
          resolve({ url: c.toDataURL('image/jpeg', 0.82), orient: im.width >= im.height ? 'landscape' : 'portrait' });
        } catch {
          resolve(null);
        }
      };
      im.onerror = () => resolve(null);
      im.src = fr.result;
    };
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(file);
  });
}

function exportJSON(photos) {
  return JSON.stringify(
    photos.map((p) => ({
      id: p.id,
      src: typeof p.src === 'string' && !p.src.startsWith('data:') ? p.src : null,
      scene: p.scene,
      orient: p.orient,
      title: p.title,
      place: p.place,
      date: p.date,
      camera: p.camera,
      note: p.note,
    })),
    null,
    2,
  );
}

export default function Lightbox({ photos, index, canEdit, onIndex, onClose, onSave, onReset }) {
  const p = photos[index];
  const N = photos.length;
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [exportText, setExportText] = useState('');
  const cardRef = useRef(null);
  const lastFocus = useRef(null);

  // 切換作品時回到檢視狀態
  useEffect(() => {
    setEditing(false);
    setMsg('');
    setExportText('');
  }, [index]);

  // 開啟時記住原本的焦點,關閉時還回去
  useEffect(() => {
    lastFocus.current = document.activeElement;
    return () => {
      if (lastFocus.current && lastFocus.current.focus) {
        try {
          lastFocus.current.focus();
        } catch {}
      }
    };
  }, []);

  // 檢視與編輯切換時,把焦點放到第一個可操作的元件
  useEffect(() => {
    const el = cardRef.current && cardRef.current.querySelector(editing ? 'input' : 'button');
    if (el) el.focus();
  }, [editing, index]);

  // Esc 關閉、左右鍵換作品、Tab 不要跑出燈箱
  useEffect(() => {
    function onKey(e) {
      const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editing) setEditing(false);
        else onClose();
        return;
      }
      if (!typing && !editing) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onIndex((index - 1 + N) % N);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onIndex((index + 1) % N);
        }
      }
      if (e.key === 'Tab' && cardRef.current) {
        const list = Array.from(cardRef.current.querySelectorAll('button, input, textarea')).filter(
          (n) => !n.disabled && n.offsetParent !== null,
        );
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing, index, N, onClose, onIndex]);

  if (!p) return null;
  const land = p.orient === 'landscape';
  const src = p.src || placeholderURL(p.scene);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const text = (k) => String(fd.get(k) || '').trim();
    const patch = {
      title: text('title') || p.title,
      place: text('place'),
      date: text('date'),
      camera: text('camera'),
      note: text('note'),
    };
    const file = fd.get('file');
    if (file && file.size > 0) {
      setMsg('處理照片中…');
      const r = await shrink(file);
      if (!r) {
        setMsg('這個檔案讀不出來,請換一張 JPG 或 PNG。');
        return;
      }
      patch.src = r.url;
      patch.orient = r.orient;
    }
    const ok = onSave(index, patch);
    setEditing(false);
    setMsg(ok ? '' : '照片太大,這次的改動只會保留到你關掉頁面。');
  }

  async function copyData() {
    const text = exportJSON(photos);
    setExportText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMsg('已複製,可以貼進 data/photos.js 的 PHOTOS。');
    } catch {
      setMsg('下方是資料,請手動全選複製。');
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={cardRef} className={styles.card} role="dialog" aria-modal="true" aria-labelledby="lb-title">
        <div className={styles.photo}>
          <div className={`${styles.frame} ${land ? styles.land : styles.port}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={p.title} />
          </div>
        </div>

        <div className={styles.side}>
          {!editing ? (
            <>
              <span className={styles.count}>
                {pad2(index + 1)} / {pad2(N)}
              </span>
              {!p.src && <span className={styles.tag}>示意圖 · 可換成你的照片</span>}
              <h2 id="lb-title" className={styles.heading}>
                {p.title}
              </h2>
              <dl className={styles.meta}>
                <dt>地點</dt>
                <dd>{p.place}</dd>
                <dt>日期</dt>
                <dd>{p.date}</dd>
                <dt>器材</dt>
                <dd>{p.camera}</dd>
              </dl>
              <p className={styles.note}>{p.note}</p>
              {msg && <p className={styles.small}>{msg}</p>}
              <div className={styles.actions}>
                <button type="button" className={styles.btn} aria-label="上一幅" onClick={() => onIndex((index - 1 + N) % N)}>
                  ←
                </button>
                <button type="button" className={styles.btn} aria-label="下一幅" onClick={() => onIndex((index + 1) % N)}>
                  →
                </button>
                {canEdit && (
                  <button type="button" className={`${styles.btn} ${styles.primary}`} onClick={() => setEditing(true)}>
                    編輯
                  </button>
                )}
                <button type="button" className={styles.btn} onClick={onClose}>
                  回到展間
                </button>
              </div>
            </>
          ) : (
            <>
              <span className={styles.count}>編輯第 {pad2(index + 1)} 幅</span>
              <form className={styles.form} onSubmit={submit} autoComplete="off">
                <label htmlFor="f-title">
                  標題
                  <input id="f-title" name="title" type="text" defaultValue={p.title} />
                </label>
                <label htmlFor="f-place">
                  地點
                  <input id="f-place" name="place" type="text" defaultValue={p.place} />
                </label>
                <label htmlFor="f-date">
                  日期
                  <input id="f-date" name="date" type="text" defaultValue={p.date} />
                </label>
                <label htmlFor="f-camera">
                  器材
                  <input id="f-camera" name="camera" type="text" defaultValue={p.camera} />
                </label>
                <label htmlFor="f-note">
                  說明
                  <textarea id="f-note" name="note" defaultValue={p.note} />
                </label>
                <label htmlFor="f-file">
                  試換照片(只存在這個瀏覽器)
                  <input id="f-file" name="file" type="file" accept="image/*" />
                </label>
                <p className={styles.small}>
                  這裡改的只存在你的瀏覽器。要正式換照片,把檔案放進 public/images/photos,再把路徑寫進 data/photos.js 的 src。
                </p>
                {msg && <p className={styles.small}>{msg}</p>}
                <div className={styles.actions}>
                  <button type="submit" className={`${styles.btn} ${styles.primary}`}>
                    儲存
                  </button>
                  <button type="button" className={styles.btn} onClick={() => setEditing(false)}>
                    取消
                  </button>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => {
                      onReset(index);
                      setEditing(false);
                      setMsg('');
                    }}
                  >
                    還原這幅
                  </button>
                  <button type="button" className={styles.btn} onClick={copyData}>
                    複製資料
                  </button>
                </div>
                {exportText && <textarea className={styles.export} readOnly value={exportText} aria-label="作品資料 JSON" onFocus={(e) => e.target.select()} />}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
