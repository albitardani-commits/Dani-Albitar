import React from 'react';
import { getContentValue } from '../services/storage';
import { SiteContentItem, AdminUser } from '../types';

interface FooterSectionProps {
  content: SiteContentItem[];
  lang: 'ar' | 'en';
  theme?: 'dark' | 'light';
  adminUser?: AdminUser | null;
  onOpenLogin?: () => void;
  onOpenAdmin?: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  content,
  lang,
  theme = 'dark',
}) => {
  const isAr = lang === 'ar';
  const footerCopy = getContentValue(
    content,
    'footer_copy',
    lang,
    isAr ? 'جميع الحقوق محفوظة NetPal 2026' : 'All Rights Reserved NetPal 2026'
  );

  // Brand Identity rule: White logo on colored/dark background, primary logo on white/light background
  const footerLogo = theme === 'dark' ? '/images/netpal-logo-3.svg' : '/images/netpal-logo-1.svg';

  return (
    <footer className="site-footer">
      <div className="footer-content container">
        <img
          src={footerLogo}
          alt="NetPal"
          className="footer-logo"
          style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/netpal-logo-3.svg';
          }}
        />
        <p className="footer-madeby">{footerCopy}</p>
      </div>
    </footer>
  );
};
