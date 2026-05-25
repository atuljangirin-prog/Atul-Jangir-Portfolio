/* ══════════════════════════════════════════════
   ATUL JANGIR PORTFOLIO — script.js
   Performance-first · GPU-composited · Smooth
══════════════════════════════════════════════ */
'use strict';

/* ── 1. AOS ──────────────────────────────── */
AOS.init({
  duration: 650,
  easing: 'ease-out-cubic',
  once: true,
  offset: 50,
  disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches
});

/* ══════════════════════════════════════
   UNIFIED SCROLL HANDLER (single RAF)
   All scroll work merged → one listener
══════════════════════════════════════ */
const scrollBar = document.getElementById('scroll-progress');
const navbar    = document.getElementById('navbar');

let scrollTicking = false;
let lastScrollY   = window.scrollY;

function onScroll() {
  lastScrollY = window.scrollY;
  if (!scrollTicking) {
    requestAnimationFrame(processScroll);
    scrollTicking = true;
  }
}

function processScroll() {
  const sy  = lastScrollY;
  const max = document.body.scrollHeight - innerHeight;
  const pct = max > 0 ? Math.min(sy / max, 1) : 0;

  /* Progress bar — scaleX (compositor only, no layout) */
  scrollBar.style.transform = `scaleX(${pct})`;

  /* Navbar */
  navbar.classList.toggle('scrolled', sy > 40);

  scrollTicking = false;
}

window.addEventListener('scroll', onScroll, { passive: true });

/* ── 3. NAVBAR TOGGLE ────────────────────── */
const navToggle = document.getElementById('nav-toggle');
const navLinks  = document.getElementById('nav-links');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navbar.classList.toggle('menu-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navbar.classList.remove('menu-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ── 4. MOUSE GLOW — RAF-throttled ──────── */
(function initGlow() {
  if (!matchMedia('(pointer:fine)').matches) return;
  const glow = document.getElementById('mouse-glow');
  if (!glow) return;

  let mx = -500, my = -500, glowTicking = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!glowTicking) {
      requestAnimationFrame(() => {
        glow.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
        glowTicking = false;
      });
      glowTicking = true;
    }
  }, { passive: true });
})();

/* ── PREVIEW SCALE ───────────────────────── */
(function initPreviewScale() {
  function setScales() {
    document.querySelectorAll('.preview-frame-wrap').forEach(wrap => {
      const scale = wrap.clientWidth / 1280;
      wrap.style.setProperty('--preview-scale', scale);
      wrap.style.height = Math.round(scale * 700) + 'px';
    });
  }
  requestAnimationFrame(() => setTimeout(setScales, 0));
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t); t = setTimeout(setScales, 150);
  }, { passive: true });
})();

/* ── 5. PARTICLES — RAF-shared, frame-capped ── */
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx    = canvas.getContext('2d', { alpha: true });
  const mobile = innerWidth < 768;
  const COUNT  = mobile ? 18 : 40;     /* fewer = less CPU */

  let W, H, particles = [];
  let lastFrame = 0;
  const FPS_CAP = 30;                  /* cap at 30fps → halves GPU load */
  const INTERVAL = 1000 / FPS_CAP;

  function resize() {
    W = canvas.width  = innerWidth;
    H = canvas.height = innerHeight;
  }
  resize();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 250);
  }, { passive: true });

  function rand(a, b) { return Math.random() * (b - a) + a; }
  function makeParticle() {
    return { x: rand(0,W), y: rand(0,H), vx: rand(-.22,.22), vy: rand(-.18,.18), r: rand(.7,2), a: rand(.18,.55) };
  }
  for (let i = 0; i < COUNT; i++) particles.push(makeParticle());

  let visible = !document.hidden;
  let scrolling = false;
  let scrollTimer = null;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  window.addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => { scrolling = false; }, 120);
  }, { passive: true });

  function draw(ts) {
    requestAnimationFrame(draw);
    if (!visible || scrolling) return;       /* pause during scroll */
    if (ts - lastFrame < INTERVAL) return;   /* frame-rate cap */
    lastFrame = ts;

    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,245,255,${p.a})`;
      ctx.fill();
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
  }
  requestAnimationFrame(draw);
})();

/* ── 6. TYPED ANIMATION ──────────────────── */
(function initTyped() {
  const el    = document.getElementById('typed-text');
  if (!el) return;
  const words = ['Web Developer','Graphic Designer','Video Editor','AI Enthusiast','Content Creator','Creative Technologist'];
  let wi = 0, ci = 0, del = false;

  function tick() {
    del ? ci-- : ci++;
    el.textContent = words[wi].slice(0, ci);
    let delay = del ? 55 : 95;
    if (!del && ci === words[wi].length) { delay = 1900; del = true; }
    else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; delay = 320; }
    setTimeout(tick, delay);
  }
  tick();
})();

/* ── 7. STAT COUNTERS — RAF-based ────────── */
(function initCounters() {
  function animateCounters() {
    document.querySelectorAll('.stat-num').forEach(el => {
      const target = +el.dataset.target;
      const dur = 1400;
      let start = null;

      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / dur, 1);
        /* ease-out quad */
        const eased = 1 - (1 - progress) * (1 - progress);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { animateCounters(); obs.disconnect(); }
  }, { threshold: .35 });
  const sec = document.getElementById('about');
  if (sec) obs.observe(sec);
})();

/* ── 8. SKILLS ───────────────────────────── */
(function initSkills() {
  const data = [
    { name:'Web Development',   icon:'fa-solid fa-code',               pct:85 },
    { name:'Graphic Designing', icon:'fa-solid fa-pen-nib',            pct:80 },
    { name:'Video Editing',     icon:'fa-solid fa-film',               pct:75 },
    { name:'MS-Office',         icon:'fa-solid fa-file-word',          pct:90 },
    { name:'Linux',             icon:'fa-brands fa-linux',             pct:78 },
    { name:'Game Development',  icon:'fa-solid fa-gamepad',            pct:60 },
    { name:'Content Creation',  icon:'fa-solid fa-photo-film',         pct:82 },
    { name:'Python',            icon:'fa-brands fa-python',            pct:70 },
    { name:'AI Tools',          icon:'fa-solid fa-brain',              pct:88 },
    { name:'Creativity',        icon:'fa-solid fa-wand-magic-sparkles',pct:95 },
  ];

  const grid = document.querySelector('.skills-grid');
  if (!grid) return;
  const frag = document.createDocumentFragment();
  data.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', String(i * 55));
    card.innerHTML = `
      <div class="skill-icon"><i class="${s.icon}" aria-hidden="true"></i></div>
      <p class="skill-name">${s.name}</p>
      <div class="skill-bar-bg" role="progressbar" aria-valuenow="${s.pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${s.name} proficiency">
        <div class="skill-bar-fill" data-pct="${s.pct}"></div>
      </div>`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelector('.skill-bar-fill').style.transform = 'scaleX(' + (+e.target.querySelector('.skill-bar-fill').dataset.pct / 100) + ')';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.skill-card').forEach(c => obs.observe(c));
})();

/* ── 9. TERMINAL ─────────────────────────── */
(function initTerminal() {
  const body = document.getElementById('terminal-body');
  if (!body) return;
  const lines = [
    { type:'cmd',    text:'whoami' },
    { type:'output', text:'Atul Jangir — Creative Technologist & Developer' },
    { type:'cmd',    text:'skills --list' },
    { type:'output', text:'Web Dev  |  Python  |  Linux  |  AI Tools  |  Graphic Design' },
    { type:'cmd',    text:'status' },
    { type:'output', text:'✅  Available' },
    { type:'cmd',    text:'location' },
    { type:'output', text:'📍  India' },
    { type:'cmd',    text:'contact --email' },
    { type:'output', text:'📧  atuljangir.in@gmail.com' },
    { type:'cmd',    text:"echo \"Let's build something amazing.\"" },
    { type:'output', text:"Let's build something amazing." },
  ];

  let li = 0, ci = 0, curEl = null;
  const cursor = document.createElement('span');
  cursor.className = 't-cursor';
  body.appendChild(cursor);

  function typeNext() {
    if (li >= lines.length) return;
    const line = lines[li];
    if (ci === 0) {
      curEl = document.createElement('div');
      curEl.className = 't-line';
      curEl.innerHTML = line.type === 'cmd'
        ? `<span class="t-prompt">$ </span><span class="t-cmd"></span>`
        : `<span class="t-output"></span>`;
      body.insertBefore(curEl, cursor);
    }
    const target = curEl.querySelector('.t-cmd, .t-output');
    if (ci < line.text.length) {
      target.textContent += line.text[ci++];
      body.scrollTop = body.scrollHeight;
      setTimeout(typeNext, line.type === 'cmd' ? 42 : 16);
    } else {
      ci = 0; li++;
      setTimeout(typeNext, line.type === 'cmd' ? 110 : 380);
    }
  }

  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { typeNext(); obs.disconnect(); }
  }, { threshold: .18 });
  obs.observe(document.getElementById('terminal'));
})();

/* ── 10. PROJECTS ────────────────────────── */
(function initProjects() {
  const data = [
    {
      name:'IRON PULSE',
      desc:'Premium futuristic gym and fitness website with cinematic UI/UX.',
      tags:['HTML','CSS','JavaScript','GSAP'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/Iron-Pulse-DEMO-/',
      url:'https://atuljangirin-prog.github.io/Iron-Pulse-DEMO-/',
      image:'assets/projects/ironpulse.webp'
    },

    {
      name:'MEDICARE+',
      desc:'Modern responsive hospital and healthcare website with clean medical UI.',
      tags:['CSS','HTML','JavaScript'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/Medicare-DEMO-/',
      url:'https://atuljangirin-prog.github.io/Medicare-DEMO-/',
      image:'assets/projects/medicare.webp'
    },

    {
      name:'StudyFlow AI',
      desc:'Smart AI-powered study planner and timetable dashboard for students.',
      tags:['HTML','CSS','JavaScript','AI','API'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/StudyFlow-AI-DEMO-/',
      url:'https://atuljangirin-prog.github.io/StudyFlow-AI-DEMO-/',
      image:'assets/projects/studyflow.webp'
    },

    {
      name:'Quantoryx AI',
      desc:'Modern AI FinTech dashboard with investment analytics and portfolio tracking.',
      tags:['JS','CSS','HTML','Charts'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/Quantoryx-AI-DEMO-/',
      url:'https://atuljangirin-prog.github.io/Quantoryx-AI-DEMO-/',
      image:'assets/projects/quantoryx.webp'
    },

    {
      name:'SpareFort',
      desc:'Modern submersible motor repair and spare parts solutions website.',
      tags:['HTML','CSS','JS','SaaS'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/SpareFort/',
      url:'https://atuljangirin-prog.github.io/SpareFort/',
      image:'assets/projects/sparefort.webp'
    },

    {
      name:'Vidoct AI',
      desc:'AI-powered YouTube video summarizer with smart insights.',
      tags:['React','Node','JavaScript','AI API','Next'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://vidoct.vercel.app/',
      url:'https://vidoct.vercel.app/',
      image:'assets/projects/vidoct.webp'
    },

    {
      name:'Summarix AI',
      desc:'AI-powered PDF summarizer that generates smart summaries.',
      tags:['HTML','CSS','JavaScript','AI API'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/Summarix-AI/',
      url:'https://atuljangirin-prog.github.io/Summarix-AI/',
      image:'assets/projects/summarix.webp'
    },

    {
      name:'Retro-Arcade-Hub',
      desc:'Futuristic browser-based retro arcade gaming platform.',
      tags:['HTML','CSS','JavaScript','Canvas API','GSAP'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/RetroArcadeHub/',
      url:'https://atuljangirin-prog.github.io/RetroArcadeHub/',
      image:'assets/projects/retroarcade.webp'
    },

    {
      name:'CreatorMindAI',
      desc:'Generate scripts, captions, hooks, hashtags and social media ideas instantly with advanced AI.',
      tags:['HTML','OPENAI', 'GROQ','JavaScript','API','GSAP'],
      github:'https://github.com/atuljangirin-prog',
      demo:'https://atuljangirin-prog.github.io/CreatorMindAi/',
      url:'https://atuljangirin-prog.github.io/CreatorMindAi/',
      image:'assets/projects/creatormindai.webp'
    }

  ];

  const grid = document.getElementById('projects-grid');
  const frag = document.createDocumentFragment();

  data.forEach((p, i) => {
    const card = document.createElement('div');

    card.className = 'project-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', String((i % 2) * 110));

    const tags = p.tags.map(t => `<span class="tech-tag">${t}</span>`).join('');

    card.innerHTML = `
      <div class="preview-browser"
           onclick="window.open('${p.url}','_blank','noopener')"
           role="button"
           tabindex="0"
           aria-label="Open ${p.name} website">

        <div class="preview-bar" aria-hidden="true">
          <div class="preview-dots">
            <span class="preview-dot pd-r"></span>
            <span class="preview-dot pd-y"></span>
            <span class="preview-dot pd-g"></span>
          </div>
          <div class="preview-url">${p.url}</div>
        </div>

        <div class="preview-image-wrap">
          <img
            src="${p.image}"
            alt="${p.name} Preview"
            class="project-preview-image"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="preview-overlay">
          <div class="preview-open-btn">
            <i class="fas fa-external-link-alt"></i>
            Open Site
          </div>
        </div>
      </div>

      <div class="project-body">
        <h3 class="project-name"
            onclick="window.open('${p.url}','_blank','noopener')"
            tabindex="0"
            role="button">${p.name}</h3>

        <p class="project-desc">${p.desc}</p>

        <div class="tech-tags">${tags}</div>

        <div class="project-btns">
          <a href="${p.github}"
             target="_blank"
             rel="noopener"
             class="btn-sm btn-gh">
             <i class="fab fa-github"></i>
             GitHub
          </a>

          <a href="${p.demo}"
             target="_blank"
             rel="noopener"
             class="btn-sm btn-demo">
             <i class="fas fa-rocket"></i>
             Live Demo
          </a>
        </div>
      </div>
    `;

    frag.appendChild(card);
  });

  grid.appendChild(frag);

  grid.querySelectorAll('.preview-browser').forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        el.click();
      }
    });
  });
})();

/* ── 11. SERVICES ────────────────────────── */
(function initServices() {
  const data = [
    { name:'Web Development',   icon:'fa-solid fa-code',         desc:'Modern, responsive websites and web apps built with clean, performant code.' },
    { name:'Graphic Designing',  icon:'fa-solid fa-pen-nib',      desc:'Stunning visuals, logos, branding, and creative assets tailored to your brand.' },
    { name:'Video Editing',      icon:'fa-solid fa-film',         desc:'Professional video editing, motion graphics, and cinematic post-production.' },
    { name:'AI Solutions',       icon:'fa-solid fa-brain',        desc:'Smart AI-powered tools, automations, and integrations for your workflow.' },
    { name:'Creative Branding',  icon:'fa-solid fa-palette',      desc:'End-to-end brand identity design that communicates your vision powerfully.' },
    { name:'Content Creation',   icon:'fa-solid fa-photo-film',   desc:'Engaging content for social media, blogs, YouTube, and digital platforms.' },
  ];

  const grid = document.getElementById('services-grid');
  if (!grid) return;
  const frag = document.createDocumentFragment();
  data.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.setAttribute('data-aos','fade-up');
    card.setAttribute('data-aos-delay', String(i * 75));
    card.innerHTML = `
      <div class="service-icon" aria-hidden="true"><i class="${s.icon}"></i></div>
      <h3 class="service-name">${s.name}</h3>
      <p class="service-desc">${s.desc}</p>`;
    frag.appendChild(card);
  });
  grid.appendChild(frag);
})();

/* ── 12. CONTACT FORM ────────────────────── */
(function initForm() {
  const form    = document.getElementById('contact-form');
  if (!form) return;
  const nameEl  = document.getElementById('cf-name');
  const emailEl = document.getElementById('cf-email');
  const mobEl   = document.getElementById('cf-mobile');
  const msgEl   = document.getElementById('cf-message');
  const btnText = document.getElementById('btn-text');
  const btnIcon = document.getElementById('btn-icon');
  const btnLoad = document.getElementById('btn-loader');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    [nameEl, emailEl, msgEl].forEach(el => el.classList.remove('error'));

    let ok = true;
    if (!nameEl.value.trim())  { nameEl.classList.add('error');  ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { emailEl.classList.add('error'); ok = false; }
    if (!msgEl.value.trim())   { msgEl.classList.add('error');   ok = false; }
    if (!ok) return;

    btnText.textContent = 'Sending…';
    btnIcon.style.display = 'none';
    btnLoad.style.display = 'inline-block';

    try {
      const fd = new FormData();
      fd.append('name',    nameEl.value.trim());
      fd.append('email',   emailEl.value.trim());
      fd.append('mobile',  mobEl.value.trim() || 'Not provided');
      fd.append('message', msgEl.value.trim());
      fd.append('_replyto', emailEl.value.trim());
      fd.append('_subject', 'New Portfolio Message from ' + nameEl.value.trim());
      fd.append('_captcha', 'false');

      const res = await fetch('https://formsubmit.co/atuljangirin.in@gmail.com', {
        method:'POST', body:fd, headers:{ Accept:'application/json' }
      });
      if (res.ok) { showModal('success'); form.reset(); }
      else        { showModal('error'); }
    } catch { showModal('error'); }
    finally {
      btnText.textContent = 'Send Message';
      btnIcon.style.display = '';
      btnLoad.style.display = 'none';
    }
  });
})();

function showModal(type) {
  const modal = document.getElementById('form-modal');
  document.getElementById('modal-icon').className  = type === 'success' ? 'fas fa-check-circle' : 'fas fa-times-circle';
  document.getElementById('modal-title').textContent = type === 'success' ? 'Message Sent!' : 'Oops!';
  document.getElementById('modal-msg').textContent   = type === 'success'
    ? "Thanks for reaching out. I'll get back to you soon."
    : 'Something went wrong. Please email directly at atuljangir.in@gmail.com';
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
}
window.closeModal = function() {
  const m = document.getElementById('form-modal');
  m.classList.remove('open'); m.setAttribute('aria-hidden','true');
};

/* ── 13. DISCORD TOAST ───────────────────── */
window.copyDiscord = function(e) {
  e.preventDefault();
  navigator.clipboard.writeText('atuljangir_').catch(() => {});
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
};

/* ── 14. AI WIDGET ───────────────────────── */
(function initAI() {
  const toggle  = document.getElementById('ai-toggle');
  const panel   = document.getElementById('ai-panel');
  const closeB  = document.getElementById('ai-close');
  const msgs    = document.getElementById('ai-messages');
  const suggest = document.getElementById('ai-suggestions');
  const input   = document.getElementById('ai-input');
  const sendB   = document.getElementById('ai-send');
  if (!toggle) return;

  const REPLIES = {
    skills:   "Atul is skilled in Web Development, Graphic Designing, Video Editing, Python, Linux, AI Tools, Game Development, and Content Creation.",
    projects: "Atul has built 6 projects: IRON PULSE, MEDICARE+, StudyFlow AI, Quantoryx AI, SpareFort, Retro-Arcade-Hub and Summarix AI. Scroll down to explore them!",
    contact:  "Reach Atul at atuljangir.in@gmail.com, or use the Contact section to send a message directly!",
    services: "Atul offers: Web Development, Graphic Designing, Video Editing, AI Solutions, Creative Branding, and Content Creation.",
    socials:  "Find Atul on Instagram, X, Bluesky, Mastodon, Threads, and Discord (@atuljangir_).",
    default:  "I'm Atul's AI assistant! Ask me about his skills, projects, services, contact info, or socials. 😊",
  };

  function getReply(t) {
    t = t.toLowerCase();
    if (t.includes('skill'))   return REPLIES.skills;
    if (t.includes('project')) return REPLIES.projects;
    if (t.includes('contact') || t.includes('email') || t.includes('hire')) return REPLIES.contact;
    if (t.includes('service')) return REPLIES.services;
    if (t.includes('social') || t.includes('instagram') || t.includes('discord') || t.includes('twitter')) return REPLIES.socials;
    return REPLIES.default;
  }

  function addMsg(text, role) {
    const el = document.createElement('div');
    el.className = `ai-msg ${role}`;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'ai-msg bot'; el.id = 'ai-typing';
    el.innerHTML = `<div class="ai-typing-indicator"><span></span><span></span><span></span></div>`;
    msgs.appendChild(el); msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function respond(text) {
    addMsg(text, 'user');
    const t = showTyping();
    setTimeout(() => { t.remove(); addMsg(getReply(text), 'bot'); }, 750 + Math.random() * 450);
  }

  function buildChips() {
    suggest.innerHTML = '';
    ['Skills','Projects','Contact','Services','Socials'].forEach(s => {
      const chip = document.createElement('button');
      chip.className = 'ai-chip'; chip.textContent = s;
      chip.addEventListener('click', () => respond(s));
      suggest.appendChild(chip);
    });
  }

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('open');
    panel.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    if (open && msgs.childElementCount === 0) {
      setTimeout(() => { addMsg("Hi! 👋 I'm Atul's AI assistant. What would you like to know?", 'bot'); buildChips(); }, 260);
    }
  });
  closeB.addEventListener('click', () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
  });
  sendB.addEventListener('click', () => {
    const v = input.value.trim(); if (!v) return;
    input.value = ''; respond(v);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendB.click(); });
})();

/* ── 15. ACTIVE NAV LINK ─────────────────── */
(function initActiveNav() {
  const anchors  = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[id]');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        anchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-38% 0px -55% 0px' });
  sections.forEach(s => obs.observe(s));
})();
