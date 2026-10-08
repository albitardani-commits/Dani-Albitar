/* ══════════════════════════════════════════════════════════════
   NetPal – app.js  |  Theme · Lang · Cursor · Three.js · GSAP
   ══════════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ── Globals ─────────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const SC = window.SITE_CONTENT || {};
const PROJECTS = window.PROJECTS_DATA || [];
const TEAM = window.TEAM_DATA || [];
const SECTIONS = window.SECTIONS_DATA || [];

let currentLang = localStorage.getItem('netpal_lang') || 'ar';
let currentTheme = localStorage.getItem('netpal_theme') || 'dark';

/* ── Theme ───────────────────────────────────────────────── */
function applyTheme(t){
    currentTheme = t;
    document.body.className = 'theme-' + t;
    localStorage.setItem('netpal_theme', t);
    const moon = $('.icon-moon'), sun = $('.icon-sun');
    if(moon && sun){
        if(t==='dark'){moon.classList.remove('hidden');sun.classList.add('hidden');}
        else{moon.classList.add('hidden');sun.classList.remove('hidden');}
    }
}

/* ── Language ────────────────────────────────────────────── */
function applyLang(lang){
    currentLang = lang;
    localStorage.setItem('netpal_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang==='ar'?'rtl':'ltr';
    const btn = $('#lang-toggle');
    if(btn) btn.textContent = lang==='ar'?'EN':'AR';
    $$('[data-i18n]').forEach(el=>{
        const key = el.getAttribute('data-i18n');
        if(SC[key]){
            el.textContent = SC[key][lang] || SC[key]['ar'] || el.textContent;
        }
    });
    $$('[data-ar][data-en]').forEach(el=>{
        el.textContent = el.getAttribute('data-'+lang);
    });
    renderPortfolio();
    renderTeam();
}

/* ── Custom cursor ───────────────────────────────────────── */
function initCursor(){
    const cursor = $('#custom-cursor'), trail = $('#cursor-trail');
    if(!cursor || !trail || window.innerWidth < 768) return;
    let mx=0, my=0, tx=0, ty=0;
    document.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
    (function loop(){
        tx+=(mx-tx)*0.15; ty+=(my-ty)*0.15;
        cursor.style.transform = `translate(${mx}px,${my}px)`;
        trail.style.transform  = `translate(${tx}px,${ty}px)`;
        requestAnimationFrame(loop);
    })();
    $$('a,button,.project-card,.team-card').forEach(el=>{
        el.addEventListener('mouseenter',()=>{ cursor.classList.add('cursor-hover'); trail.classList.add('cursor-hover'); });
        el.addEventListener('mouseleave',()=>{ cursor.classList.remove('cursor-hover'); trail.classList.remove('cursor-hover'); });
    });
}

/* ── Three.js hero ───────────────────────────────────────── */
function initThreeHero(){
    const container = $('#three-canvas-container');
    if(!container || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true});
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    container.appendChild(renderer.domElement);

    // Infinity symbol particles
    const count = 600;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count*3);
    for(let i=0;i<count;i++){
        const t = (i/count)*Math.PI*2;
        const scale = 3;
        pos[i*3]   = scale * Math.cos(t) / (1 + Math.sin(t)*Math.sin(t));
        pos[i*3+1] = scale * Math.sin(t)*Math.cos(t) / (1 + Math.sin(t)*Math.sin(t)) + (Math.random()-0.5)*0.3;
        pos[i*3+2] = (Math.random()-0.5)*1.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({color:0x5DCBCA, size:0.04, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending});
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // Connecting lines
    const lineMat = new THREE.LineBasicMaterial({color:0x5DCBCA, transparent:true, opacity:0.15});
    const lineGeo = new THREE.BufferGeometry();
    const lp = [];
    for(let i=0;i<count;i++){
        for(let j=i+1;j<count && j<i+5;j++){
            lp.push(pos[i*3],pos[i*3+1],pos[i*3+2], pos[j*3],pos[j*3+1],pos[j*3+2]);
        }
    }
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp,3));
    scene.add(new THREE.LineSegments(lineGeo, lineMat));

    camera.position.z = 5;
    let mouseX=0, mouseY=0;
    document.addEventListener('mousemove', e=>{
        mouseX=(e.clientX/window.innerWidth -0.5)*0.5;
        mouseY=(e.clientY/window.innerHeight-0.5)*0.5;
    });
    function animate(){
        requestAnimationFrame(animate);
        points.rotation.y += 0.0015;
        points.rotation.x += mouseY*0.002;
        points.rotation.y += mouseX*0.002;
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize',()=>{
        camera.aspect = container.clientWidth/container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/* ── Portfolio rendering ─────────────────────────────────── */
let activeSection = null;
let activeSub = null;

function renderSectionTabs(){
    const tabsEl = $('#section-tabs');
    if(!tabsEl) return;
    tabsEl.innerHTML = '';
    // All tab
    const allBtn = document.createElement('button');
    allBtn.className = 'tab-btn' + (activeSection===null?' active':'');
    allBtn.textContent = currentLang==='ar'?'الكل':'All';
    allBtn.onclick = ()=>{ activeSection=null; activeSub=null; renderSectionTabs(); renderSubTabs(); renderPortfolio(); };
    tabsEl.appendChild(allBtn);

    SECTIONS.forEach(s=>{
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (activeSection===s.id?' active':'');
        btn.textContent = currentLang==='ar'?s.name_ar:s.name_en;
        btn.onclick = ()=>{ activeSection=s.id; activeSub=null; renderSectionTabs(); renderSubTabs(); renderPortfolio(); };
        tabsEl.appendChild(btn);
    });
}

function renderSubTabs(){
    const subEl = $('#sub-tabs');
    if(!subEl) return;
    subEl.innerHTML = '';
    if(!activeSection) return;
    const sec = SECTIONS.find(s=>s.id===activeSection);
    if(!sec || !sec.subsections || !sec.subsections.length) return;

    const allBtn = document.createElement('button');
    allBtn.className = 'sub-tab-btn' + (activeSub===null?' active':'');
    allBtn.textContent = currentLang==='ar'?'الكل':'All';
    allBtn.onclick = ()=>{ activeSub=null; renderSubTabs(); renderPortfolio(); };
    subEl.appendChild(allBtn);

    sec.subsections.forEach(sub=>{
        const btn = document.createElement('button');
        btn.className = 'sub-tab-btn' + (activeSub===sub.id?' active':'');
        btn.textContent = currentLang==='ar'?sub.name_ar:sub.name_en;
        btn.onclick = ()=>{ activeSub=sub.id; renderSubTabs(); renderPortfolio(); };
        subEl.appendChild(btn);
    });
}

function renderPortfolio(){
    const grid = $('#projects-container');
    if(!grid) return;
    grid.innerHTML = '';
    renderSectionTabs();

    let filtered = PROJECTS;
    if(activeSection) filtered = filtered.filter(p=>p.section_id===activeSection);
    if(activeSub) filtered = filtered.filter(p=>p.subsection_id===activeSub);

    if(!filtered.length){
        grid.innerHTML = `<p style="text-align:center;opacity:.5;grid-column:1/-1">${currentLang==='ar'?'لا توجد مشاريع حالياً':'No projects yet'}</p>`;
        return;
    }

    filtered.forEach(p=>{
        const card = document.createElement('a');
        card.href = '/project/' + p.id;
        card.className = 'project-card';
        const coverSrc = p.cover.startsWith('http') ? p.cover : '/static/uploads/' + p.cover;
        card.innerHTML = `
            <div class="card-image-wrap">
                <img src="${coverSrc}" alt="${currentLang==='ar'?p.title_ar:p.title_en}" loading="lazy" onerror="this.src='/static/uploads/${p.cover}'">
                <div class="card-overlay">
                    <span class="card-view">${currentLang==='ar'?'عرض':'View'}</span>
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${currentLang==='ar'?p.title_ar:p.title_en}</h3>
                <p class="card-desc">${currentLang==='ar'?(p.desc_ar||''):(p.desc_en||'')}</p>
                ${p.tags&&p.tags.length?'<div class="card-tags">'+p.tags.map(t=>'<span class="skill-tag">'+t.trim()+'</span>').join('')+'</div>':''}
            </div>`;
        grid.appendChild(card);

        // 3D tilt effect
        card.addEventListener('mousemove', e=>{
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = `perspective(800px) rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', ()=>{
            card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
        });
    });
}

/* ── Team rendering ──────────────────────────────────────── */
function renderTeam(){
    const grid = $('#team-container');
    if(!grid) return;
    grid.innerHTML = '';
    TEAM.forEach(t=>{
        const card = document.createElement('div');
        card.className = 'team-card';
        const imgSrc = t.image ? '/static/uploads/'+t.image : '/static/images/default-avatar.svg';
        const skills = currentLang==='ar' ? (t.skills_ar||[]) : (t.skills_en||[]);
        card.innerHTML = `
            <div class="team-front">
                <img src="${imgSrc}" alt="${currentLang==='ar'?t.name_ar:t.name_en}" loading="lazy">
                <h4>${currentLang==='ar'?t.name_ar:t.name_en}</h4>
                <p>${currentLang==='ar'?t.role_ar:t.role_en}</p>
            </div>
            <div class="team-back">
                <h4>${currentLang==='ar'?t.name_ar:t.name_en}</h4>
                <div class="team-skills">${skills.map(s=>'<span class="skill-tag">'+s.trim()+'</span>').join('')}</div>
            </div>`;
        grid.appendChild(card);
    });
}

/* ── GSAP animations ─────────────────────────────────────── */
function initAnimations(){
    if(typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Preloader
    const preloader = $('#preloader');
    const tl = gsap.timeline();
    tl.to('.stroke-draw',{strokeDashoffset:0,duration:1.5,ease:'power2.inOut'})
      .to(preloader,{opacity:0,duration:0.5,delay:0.3,onComplete:()=>{
          preloader.style.display='none';
          animateHeroEntrance();
      }});

    function animateHeroEntrance(){
        gsap.from('.hero-main-logo',{scale:0,rotation:180,duration:1.2,ease:'back.out(1.7)'});
        gsap.from('.hero-title',{y:60,opacity:0,duration:1,delay:0.3,ease:'power3.out'});
        gsap.from('.hero-subtitle',{y:40,opacity:0,duration:1,delay:0.5,ease:'power3.out'});
        gsap.from('.hero-cta',{y:40,opacity:0,duration:1,delay:0.7,ease:'power3.out'});
    }

    // Logo morph animation (clip-path breathing instead of shake)
    const heroLogo = $('.hero-main-logo');
    if(heroLogo){
        gsap.to(heroLogo,{
            clipPath: 'circle(48% at 50% 50%)',
            duration:2, repeat:-1, yoyo:true, ease:'sine.inOut',
            keyframes:[
                {clipPath:'circle(50% at 50% 50%)', duration:0},
                {clipPath:'circle(45% at 52% 48%)', duration:2},
                {clipPath:'circle(50% at 50% 50%)', duration:2}
            ]
        });
    }

    // Section reveals with 3D
    $$('.section-header, .about-text, .contact-section, .pd-header, .pd-body, .pd-cover, .pd-gallery-item').forEach(el=>{
        gsap.from(el,{
            scrollTrigger:{trigger:el, start:'top 85%', toggleActions:'play none none none'},
            y:60, opacity:0, rotationX:10, duration:0.8, ease:'power3.out'
        });
    });

    // Floating nav show/hide
    const nav = $('.floating-nav');
    if(nav){
        ScrollTrigger.create({
            start:'top -80', onUpdate:self=>{
                if(self.direction===1) nav.classList.add('nav-visible');
                else if(self.scroll()< 100) nav.classList.remove('nav-visible');
            }
        });
        nav.classList.add('nav-visible');
    }

    // Scroll indicator bounce
    gsap.to('.scroll-indicator',{y:10,repeat:-1,yoyo:true,duration:1,ease:'sine.inOut'});
}

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', ()=>{
    // Apply saved preferences
    applyTheme(currentTheme);

    // Toggle buttons
    const themeBtn = $('#theme-toggle');
    if(themeBtn) themeBtn.addEventListener('click', ()=>{ applyTheme(currentTheme==='dark'?'light':'dark'); });

    const langBtn = $('#lang-toggle');
    if(langBtn) langBtn.addEventListener('click', ()=>{ applyLang(currentLang==='ar'?'en':'ar'); });

    // Render dynamic content
    renderSectionTabs();
    renderSubTabs();
    renderPortfolio();
    renderTeam();

    // Apply language (this also re-renders)
    applyLang(currentLang);

    // Init systems
    initCursor();
    initThreeHero();
    initAnimations();
});

})();
