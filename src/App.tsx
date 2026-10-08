/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NetPalDatabase, AdminUser } from './types';
import { loadDatabase, saveDatabase, getAdminSession, setAdminSession } from './services/storage';
import { FloatingNav } from './components/FloatingNav';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { PortfolioSection } from './components/PortfolioSection';
import { ContactSection } from './components/ContactSection';
import { FooterSection } from './components/FooterSection';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

export default function App() {
  const [db, setDb] = useState<NetPalDatabase>(loadDatabase);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(getAdminSession);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'admin'>('public');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const handleUpdateDb = (newDb: NetPalDatabase) => {
    setDb(newDb);
    saveDatabase(newDb);
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setAdminSession(user);
    setViewMode('admin');
  };

  const handleLogout = () => {
    setAdminUser(null);
    setAdminSession(null);
    setViewMode('public');
  };

  const toggleLang = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.className = 'theme-light';
    } else {
      document.body.className = 'theme-dark';
    }
  };

  // Sync lang & theme to DOM on mount
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.body.className = 'theme-' + theme;
  }, [lang, theme]);

  // Original Custom Cursor implementation from NetPal app.js
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    const cursor = document.getElementById('custom-cursor');
    const trail = document.getElementById('cursor-trail');
    if (!cursor || !trail) return;

    let mx = 0,
      my = 0,
      tx = 0,
      ty = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let rafId: number;
    const loop = () => {
      tx += (mx - tx) * 0.15;
      ty += (my - ty) * 0.15;
      cursor.style.transform = `translate(${mx}px, ${my}px)`;
      trail.style.transform = `translate(${tx}px, ${ty}px)`;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const handleMouseEnter = () => {
      cursor.classList.add('cursor-hover');
      trail.classList.add('cursor-hover');
    };
    const handleMouseLeave = () => {
      cursor.classList.remove('cursor-hover');
      trail.classList.remove('cursor-hover');
    };

    const attachHover = () => {
      document.querySelectorAll('a, button, .project-card, .team-card').forEach((el) => {
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);
      });
    };
    attachHover();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [viewMode]);

  // If in admin mode, show the full Admin Dashboard
  if (viewMode === 'admin' && adminUser) {
    return (
      <AdminDashboard
        db={db}
        onUpdateDb={handleUpdateDb}
        adminUser={adminUser}
        onLogout={handleLogout}
        onReturnToSite={() => setViewMode('public')}
      />
    );
  }

  return (
    <>
      {/* Custom Cursor elements from original template */}
      <div id="custom-cursor"></div>
      <div id="cursor-trail"></div>

      {/* Floating Navigation */}
      <FloatingNav
        lang={lang}
        onToggleLang={toggleLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        adminUser={adminUser}
        onOpenAdmin={() => setViewMode('admin')}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Sections */}
      <main id="smooth-wrapper">
        <div id="smooth-content">
          <HeroSection content={db.content} lang={lang} theme={theme} />
          <AboutSection content={db.content} team={db.team} lang={lang} />
          <PortfolioSection
            projects={db.projects}
            sections={db.sections}
            subsections={db.subsections}
            lang={lang}
          />
          <ContactSection content={db.content} lang={lang} />
          <FooterSection
            content={db.content}
            lang={lang}
            theme={theme}
          />
        </div>
      </main>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        db={db}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
