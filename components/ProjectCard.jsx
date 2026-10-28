import Image from 'next/image';

// 一張專案卡片。資料來自 data/projects.js。
export default function ProjectCard({ project }) {
  return (
    <article className="project-card">
      <div className="project-preview">
        <Image
          src={project.image}
          alt={project.imageAlt}
          fill
          sizes="(max-width: 800px) 100vw, 760px"
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div className="project-body">
        <h2 className="project-title">{project.title}</h2>
        <p className="project-sub">{project.sub}</p>
        {(Array.isArray(project.desc) ? project.desc : [project.desc]).map((para, i) => (
          <p key={i} className="project-desc">{para}</p>
        ))}

        <div className="tags">
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        <div className="project-links">
          {project.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
