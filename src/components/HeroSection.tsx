import React, { useEffect, useRef } from 'react';
import { getContentValue } from '../services/storage';
import { SiteContentItem } from '../types';

declare const THREE: any;

interface HeroSectionProps {
  content: SiteContentItem[];
  lang: 'ar' | 'en';
  theme?: 'dark' | 'light';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ content, lang, theme = 'dark' }) => {
  const isAr = lang === 'ar';
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const heroTitle = getContentValue(
    content,
    'hero_title',
    lang,
    isAr
      ? 'نحن فريق NetPal — نبتكر حضوراً بصرياً يخطف الأنظار ويترك أثراً لا يُنسى'
      : 'We are NetPal — We create visual presence that captures attention and leaves an unforgettable mark'
  );

  const heroSubtitle = getContentValue(
    content,
    'hero_subtitle',
    lang,
    isAr ? 'تصميم | فيديو وموشن | برمجة | تسويق' : 'Design | Video & Motion | Development | Marketing'
  );

  // Initialize Three.js infinity particles matching original app.js with exact Brand Guide color #5DCBCA (0x5DCBCA)
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || typeof THREE === 'undefined') return;

    container.innerHTML = '';

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Infinity symbol particles with brand guide teal (#5DCBCA)
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const scale = 3;
      pos[i * 3] = (scale * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
      pos[i * 3 + 1] =
        ((scale * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t))) +
        (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x5dcbca, // Brand Identity Guide Color 1
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Connecting lines with brand color
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x5dcbca,
      transparent: true,
      opacity: 0.2,
    });
    const lineGeo = new THREE.BufferGeometry();
    const lp: number[] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count && j < i + 5; j++) {
        lp.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
      }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    camera.position.z = 5;
    let mouseX = 0,
      mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      points.rotation.y += 0.0015;
      points.rotation.x += mouseY * 0.002;
      points.rotation.y += mouseX * 0.002;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container) container.innerHTML = '';
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Brand Identity rule: White logo on colored/dark background, primary logo on white/light background
  const logoSrc = theme === 'dark' ? '/images/netpal-logo-3.svg' : '/images/netpal-logo-1.svg';

  return (
    <section className="hero" id="hero">
      <div id="three-canvas-container" ref={canvasContainerRef}></div>

      {/* Hero Logo without clipping, showing exact brand identity logo */}
      <div className="hero-logo-container">
        <img
          src={logoSrc}
          alt="NetPal"
          className="hero-main-logo"
          style={{
            width: '260px',
            height: 'auto',
            maxHeight: '200px',
            objectFit: 'contain',
            filter: theme === 'dark' ? 'drop-shadow(0 0 35px rgba(93, 203, 202, 0.35))' : 'none',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/netpal-logo-3.svg';
          }}
        />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">{heroTitle}</h1>
        <p className="hero-subtitle">{heroSubtitle}</p>
        <div className="hero-cta">
          <a
            href="#portfolio"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('portfolio');
            }}
            className="btn btn-primary"
          >
            {isAr ? 'شوف أعمالنا' : 'See Our Work'}
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollTo('contact');
            }}
            className="btn btn-outline"
          >
            {isAr ? 'تواصل معنا' : 'Contact Us'}
          </a>
        </div>
      </div>

      <div
        className="scroll-indicator cursor-pointer"
        onClick={() => scrollTo('about')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
};
