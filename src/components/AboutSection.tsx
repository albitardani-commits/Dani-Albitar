import React from 'react';
import { TeamMember, SiteContentItem } from '../types';
import { getContentValue } from '../services/storage';

interface AboutSectionProps {
  content: SiteContentItem[];
  team: TeamMember[];
  lang: 'ar' | 'en';
}

export const AboutSection: React.FC<AboutSectionProps> = ({ content, team, lang }) => {
  const isAr = lang === 'ar';

  const aboutTitle = getContentValue(
    content,
    'about_title',
    lang,
    isAr ? 'فريق واحد. أربع مهارات. إبداع بلا حدود.' : 'One Team. Four Skills. Limitless Creativity.'
  );

  const aboutText = getContentValue(
    content,
    'about_text',
    lang,
    isAr
      ? 'نحن في NetPal نؤمن بأن التصميم ليس مجرد شكل.'
      : 'At NetPal, we believe design is more than just looks.'
  );

  const feat1 = getContentValue(content, 'feat_1', lang, isAr ? 'تصميم مبني على هدف' : 'Purpose-Driven Design');
  const feat2 = getContentValue(content, 'feat_2', lang, isAr ? 'نظام شغل واضح' : 'Clear Workflow');
  const feat3 = getContentValue(content, 'feat_3', lang, isAr ? 'تسليم ملفات جاهز فوراً' : 'Instant File Delivery');

  return (
    <section id="about" className="container" style={{ margin: '80px auto' }}>
      <div className="section-header">
        <h2 className="section-title">{isAr ? 'من نحن' : 'About Us'}</h2>
      </div>

      <div className="about-grid">
        {/* Left text column */}
        <div className="about-text">
          <h3>{aboutTitle}</h3>
          <p>{aboutText}</p>
          <ul className="about-features">
            <li>{feat1}</li>
            <li>{feat2}</li>
            <li>{feat3}</li>
          </ul>
        </div>

        {/* Right 3D Flip Card Team Grid */}
        <div className="team-grid" id="team-container">
          {team.map((member) => {
            const name = isAr ? member.name_ar : member.name_en;
            const role = isAr ? member.role_ar : member.role_en;
            const rawSkills = isAr ? member.skills_ar : member.skills_en;
            const skills = rawSkills ? rawSkills.split(',').map((s) => s.trim()) : [];
            const imgSrc = member.image
              ? member.image.startsWith('http')
                ? member.image
                : `/static/uploads/${member.image}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=07444E&color=5DCBCA&bold=true`;

            return (
              <div key={member.id} className="team-card">
                <div className="team-front">
                  <img src={imgSrc} alt={name} loading="lazy" />
                  <h4>{name}</h4>
                  <p>{role}</p>
                </div>
                <div className="team-back">
                  <h4>{name}</h4>
                  <div className="team-skills">
                    {skills.map((skill, sIdx) => (
                      <span key={sIdx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
