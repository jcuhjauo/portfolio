import ProjectCard from '../../components/ProjectCard';
import { PROJECTS } from '../../data/projects';

export const metadata = {
  title: '專案作品 ・ 趙誼臻',
};

export default function ProjectsPage() {
  return (
    <div className="wrap">
      <section className="project" id="work">
        <span className="eyebrow">專案作品</span>
        <div className="timeline">
          {PROJECTS.map((p) => (
            <div key={p.id} className="timeline-item">
              {p.period && <span className="timeline-date">{p.period}</span>}
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}