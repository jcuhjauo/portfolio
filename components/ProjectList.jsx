'use client';

import { useState } from 'react';
import ProjectCard from './ProjectCard';

// 標籤篩選 + 時間軸。資料可選填 period(例如 '2026.03 – 2026.06'),會顯示在時間軸上。
export default function ProjectList({ projects }) {
  const [active, setActive] = useState('全部');
  const tags = ['全部', ...Array.from(new Set(projects.flatMap((p) => p.tags)))];
  const shown = active === '全部' ? projects : projects.filter((p) => p.tags.includes(active));

  return (
    <>
      {projects.length > 1 && (
        <div className="filter-row" role="group" aria-label="依技術篩選">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              className="filter-chip"
              aria-pressed={active === t}
              onClick={() => setActive(t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="timeline">
        {shown.map((p) => (
          <div key={p.id} className="timeline-item">
            {p.period && <span className="timeline-date">{p.period}</span>}
            <ProjectCard project={p} />
          </div>
        ))}
      </div>
    </>
  );
}
