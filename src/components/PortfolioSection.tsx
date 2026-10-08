import React, { useState, useMemo } from 'react';
import { Project, Section, SubSection } from '../types';
import { ProjectModal } from './ProjectModal';

interface PortfolioSectionProps {
  projects: Project[];
  sections: Section[];
  subsections: SubSection[];
  lang: 'ar' | 'en';
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  projects,
  sections,
  subsections,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [activeSectionId, setActiveSectionId] = useState<number | null>(null);
  const [activeSubSectionId, setActiveSubSectionId] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Subsections for active section
  const currentSubSections = useMemo(() => {
    if (!activeSectionId) return [];
    return subsections.filter((s) => s.section_id === activeSectionId);
  }, [subsections, activeSectionId]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (activeSectionId) list = list.filter((p) => p.section_id === activeSectionId);
    if (activeSubSectionId) list = list.filter((p) => p.subsection_id === activeSubSectionId);
    return list;
  }, [projects, activeSectionId, activeSubSectionId]);

  // Handle 3D Tilt on card
  const handleCardMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = e.currentTarget;
    card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
  };

  return (
    <section id="portfolio" className="container" style={{ margin: '80px auto' }}>
      <div className="section-header">
        <h2 className="section-title">{isAr ? 'أعمالنا' : 'Portfolio'}</h2>
      </div>

      {/* Section Tabs */}
      <div className="portfolio-tabs" id="section-tabs">
        <button
          onClick={() => {
            setActiveSectionId(null);
            setActiveSubSectionId(null);
          }}
          className={`tab-btn ${activeSectionId === null ? 'active' : ''}`}
        >
          {isAr ? 'الكل' : 'All'}
        </button>

        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setActiveSectionId(s.id);
              setActiveSubSectionId(null);
            }}
            className={`tab-btn ${activeSectionId === s.id ? 'active' : ''}`}
          >
            {isAr ? s.name_ar : s.name_en}
          </button>
        ))}
      </div>

      {/* Subcategory Tabs */}
      {currentSubSections.length > 0 && (
        <div className="portfolio-subcategories" id="sub-tabs">
          <button
            onClick={() => setActiveSubSectionId(null)}
            className={`sub-tab-btn ${activeSubSectionId === null ? 'active' : ''}`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>

          {currentSubSections.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubSectionId(sub.id)}
              className={`sub-tab-btn ${activeSubSectionId === sub.id ? 'active' : ''}`}
            >
              {isAr ? sub.name_ar : sub.name_en}
            </button>
          ))}
        </div>
      )}

      {/* Projects Grid */}
      <div className="projects-grid" id="projects-container">
        {filteredProjects.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.5, gridColumn: '1 / -1' }}>
            {isAr ? 'لا توجد مشاريع حالياً' : 'No projects yet'}
          </p>
        ) : (
          filteredProjects.map((p) => {
            const title = isAr ? p.title_ar : p.title_en;
            const desc = isAr ? p.description_ar : p.description_en;
            const tags = p.tech_tags ? p.tech_tags.split(',').map((t) => t.trim()) : [];
            const coverSrc = p.cover_image.startsWith('http')
              ? p.cover_image
              : `/static/uploads/${p.cover_image}`;

            return (
              <a
                key={p.id}
                href={`#project-${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedProject(p);
                }}
                className="project-card"
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="card-image-wrap">
                  <img
                    src={coverSrc}
                    alt={title}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://placehold.co/800x450/07444E/FFFFFF?text=NetPal+Project';
                    }}
                  />
                  <div className="card-overlay">
                    <span className="card-view">{isAr ? 'عرض' : 'View'}</span>
                  </div>
                </div>

                <div className="card-info">
                  <h3 className="card-title">{title}</h3>
                  <p className="card-desc">{desc || ''}</p>
                  {tags.length > 0 && (
                    <div className="card-tags">
                      {tags.map((t, idx) => (
                        <span key={idx} className="skill-tag">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectModal
        project={selectedProject}
        sections={sections}
        subsections={subsections}
        lang={lang}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
};
