import React from 'react';
import { getContentValue } from '../services/storage';
import { SiteContentItem } from '../types';

interface ContactSectionProps {
  content: SiteContentItem[];
  lang: 'ar' | 'en';
}

export const ContactSection: React.FC<ContactSectionProps> = ({ content, lang }) => {
  const isAr = lang === 'ar';

  const contactTitle = getContentValue(
    content,
    'contact_title',
    lang,
    isAr ? 'جاهزين للمشروع الجاي' : 'Ready for the Next Project'
  );

  const whatsappNumber = getContentValue(content, 'contact_whatsapp', lang, '966500000000');
  const emailAddr = getContentValue(content, 'contact_email', lang, 'info@netpal.sa');
  const btnWhatsapp = getContentValue(content, 'btn_whatsapp', lang, isAr ? 'واتساب' : 'WhatsApp');
  const btnEmail = getContentValue(content, 'btn_email', lang, isAr ? 'إيميل' : 'Email');

  return (
    <section id="contact" className="container contact-section">
      <div className="contact-bg"></div>
      <div className="section-header">
        <h2 className="section-title">{contactTitle}</h2>
      </div>
      <div className="contact-actions">
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
          </svg>
          <span>{btnWhatsapp}</span>
        </a>
        <a
          href={`mailto:${emailAddr}`}
          className="contact-btn"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
          <span>{btnEmail}</span>
        </a>
      </div>
    </section>
  );
};
