import React from 'react';
import { X, ExternalLink, Video, Tag, Folder } from 'lucide-react';
import { Project, Section, SubSection } from '../types';

interface ProjectModalProps {
  project: Project | null;
  sections: Section[];
  subsections: SubSection[];
  lang: 'ar' | 'en';
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  project,
  sections,
  subsections,
  lang,
  onClose,
}) => {
  if (!project) return null;
  const isAr = lang === 'ar';

  const section = sections.find((s) => s.id === project.section_id);
  const subsection = subsections.find((sub) => sub.id === project.subsection_id);

  const title = isAr ? project.title_ar : project.title_en;
  const desc = isAr ? project.description_ar : project.description_en;
  const tags = project.tech_tags ? project.tech_tags.split(',').map((t) => t.trim()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
        <div className="relative w-full max-w-2xl bg-[#0e1620] border border-[#5DCBCA]/30 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/80 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-[#1b2230] text-slate-300 hover:text-white hover:bg-[#5DCBCA] hover:text-[#07444E] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cover / Media */}
        <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/50 border border-slate-800">
          <img
            src={project.cover_image.startsWith('http') ? project.cover_image : `/uploads/${project.cover_image}`}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/800x450/07444E/FFFFFF?text=NetPal+Project';
            }}
          />
        </div>

        {/* Header Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {section && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#07444E] text-white border border-[#5DCBCA]/30 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-[#5DCBCA]" />
                <span>{isAr ? section.name_ar : section.name_en}</span>
              </span>
            )}
            {subsection && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {isAr ? subsection.name_ar : subsection.name_en}
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">{title}</h3>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold text-white">{isAr ? 'تفاصيل المشروع' : 'Project Details'}</h4>
          <p className="text-slate-300 leading-relaxed text-sm sm:text-base bg-[#07444E]/30 p-4 rounded-xl border border-slate-800/80">
            {desc || (isAr ? 'لا يوجد وصف إضافي متوفر.' : 'No additional description provided.')}
          </p>
        </div>

        {/* Tech tags */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#5DCBCA]" />
              <span>{isAr ? 'الوسوم والتقنيات:' : 'Tags & Technologies:'}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-[#07444E]/60 text-white border border-[#5DCBCA]/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Links */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800">
          {project.link_url && (
            <a
              href={project.link_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5DCBCA] text-[#07444E] font-bold text-xs hover:bg-[#4ebaba] transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isAr ? 'معاينة الرابط المباشر' : 'Visit Live Project'}</span>
            </a>
          )}
          {project.video_url && (
            <a
              href={project.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#5DCBCA] text-white font-bold text-xs hover:bg-[#5DCBCA] hover:text-[#07444E] transition"
            >
              <Video className="w-4 h-4" />
              <span>{isAr ? 'مشاهدة الفيديو' : 'Watch Video'}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
