import React from 'react';
import { LayoutDashboard, ShieldCheck } from 'lucide-react';
import { AdminUser } from '../types';

interface FloatingNavProps {
  lang: 'ar' | 'en';
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  adminUser,
  onOpenAdmin,
  onOpenLogin,
}) => {
  const isAr = lang === 'ar';

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Brand Identity rule: White logo on colored/dark background, primary logo on white/light background
  const navLogoSrc = theme === 'dark' ? '/images/netpal-logo-3.svg' : '/images/netpal-logo-1.svg';

  return (
    <nav className="floating-nav nav-visible">
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollTo('hero');
        }}
        className="nav-logo"
      >
        <img
          src={navLogoSrc}
          alt="NetPal"
          className="nav-logo-img"
          style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/netpal-logo-3.svg';
          }}
        />
      </a>

      <div className="nav-links">
        <a
          href="#about"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('about');
          }}
        >
          {isAr ? 'من نحن' : 'About Us'}
        </a>
        <a
          href="#portfolio"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('portfolio');
          }}
        >
          {isAr ? 'أعمالنا' : 'Portfolio'}
        </a>
        <a
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            scrollTo('contact');
          }}
        >
          {isAr ? 'تواصل معنا' : 'Contact Us'}
        </a>
      </div>

      <div className="nav-controls">
        <button
          onClick={onToggleLang}
          id="lang-toggle"
          className="nav-btn"
          aria-label="Toggle Language"
        >
          {isAr ? 'EN' : 'AR'}
        </button>

        <button
          onClick={onToggleTheme}
          id="theme-toggle"
          className="nav-btn"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg className="icon-moon w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
          ) : (
            <svg className="icon-sun w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          )}
        </button>

        {adminUser ? (
          <button
            onClick={onOpenAdmin}
            className="nav-btn active flex items-center gap-1.5"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-dark)',
              fontWeight: 'bold',
              borderColor: 'var(--primary)',
            }}
            title={isAr ? 'لوحة تحكم المشرف' : 'Admin Dashboard'}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>{isAr ? 'لوحة الإدارة' : 'Admin'}</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="nav-btn flex items-center gap-1.5"
            style={{
              borderColor: 'rgba(93, 203, 202, 0.4)',
              color: 'var(--primary)',
            }}
            title={isAr ? 'دخول المشرف' : 'Admin Login'}
          >
            <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
            <span>{isAr ? 'دخول الإدارة' : 'Admin Login'}</span>
          </button>
        )}
      </div>
    </nav>
  );
};
