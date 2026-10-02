(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Toast ---------- */
  const toastEl = $('.toast');
  let toastTimer;
  function toast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Active section in the dock ---------- */
  const navLinks = $$('.dock a');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  navLinks.forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (section) navObserver.observe(section);
  });

  /* ---------- Count-up stats ---------- */
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterObserver.unobserve(entry.target);
      const el = entry.target;
      const end = Number(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) return;
      const duration = 1500;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = `${prefix}${Math.round(end * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => counterObserver.observe(el));

  /* ---------- API console ---------- */
  const responses = {
    profile: {
      name: 'Shibani Purbey',
      role: 'Full Stack Software Developer',
      focus: 'Java · Spring Boot + Angular',
      experienceYears: 4,
      currently: 'Software Engineer II @ Caterpillar',
      location: 'Bangalore, India',
      education: 'B.Tech CSE, VIT Vellore',
      hackathonWinner: true,
    },
    stack: {
      backend: ['Java 8+', 'Spring Boot', 'Spring Security', 'JPA/Hibernate'],
      frontend: ['Angular', 'JavaScript', 'PWA'],
      cloud: ['AWS ECS', 'Lambda', 'S3', 'RDS', 'Docker'],
      messaging: ['Kafka', 'RabbitMQ'],
      testing: ['JUnit 5', 'Mockito', 'SonarQube'],
    },
    impact: {
      reliabilityGain: '80%',
      codeCoverage: '85%',
      criticalSecurityFixes: '100+',
      performanceGain: '20%',
      productionGoLives: 3,
      dailySalesOnPlatform: '$15M+',
    },
  };

  const tokenPattern = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?)|\b(true|false|null)\b|([{}[\],])/g;

  function tokenize(data) {
    // Pretty-print, but keep arrays of plain values on one line.
    const json = JSON.stringify(data, null, 2)
      .replace(/\[\n\s+([^[\]{}]*?)\n\s*\]/g, (_, items) => `[${items.split(/,\n\s*/).join(', ')}]`);
    const tokens = [];
    let last = 0;
    for (const match of json.matchAll(tokenPattern)) {
      if (match.index > last) tokens.push(['', json.slice(last, match.index)]);
      const [whole, str, colon, num, lit, punct] = match;
      if (str && colon) { tokens.push(['k', str], ['p', colon]); }
      else if (str) tokens.push(['s', str]);
      else if (num) tokens.push(['n', num]);
      else if (lit) tokens.push(['b', lit]);
      else if (punct) tokens.push(['p', punct]);
      else tokens.push(['', whole]);
      last = match.index + whole.length;
    }
    if (last < json.length) tokens.push(['', json.slice(last)]);
    return tokens;
  }

  const consoleOut = $('#console-out');
  const consoleStatus = $('#console-status');
  const endpoints = $$('.endpoint');
  let renderId = 0;

  function renderEndpoint(key) {
    const id = ++renderId;
    const tokens = tokenize(responses[key]);
    const latency = 9 + Math.floor(Math.random() * 28);
    consoleStatus.innerHTML = `<span class="ok">200 OK</span> · application/json · ${latency}ms`;
    consoleOut.textContent = '';

    const parts = tokens.map(([cls, text]) => {
      const span = document.createElement('span');
      if (cls) span.className = `tk-${cls}`;
      consoleOut.appendChild(span);
      return [span, text];
    });
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    consoleOut.appendChild(caret);

    if (reduceMotion || document.hidden) {
      parts.forEach(([span, text]) => { span.textContent = text; });
      return;
    }

    let i = 0;
    let j = 0;
    const step = () => {
      if (id !== renderId) return;
      let budget = 5;
      while (budget > 0 && i < parts.length) {
        const [span, text] = parts[i];
        const take = Math.min(budget, text.length - j);
        span.textContent += text.slice(j, j + take);
        j += take;
        budget -= take;
        if (j >= text.length) { i += 1; j = 0; }
      }
      if (i < parts.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  endpoints.forEach((btn) => {
    btn.addEventListener('click', () => {
      endpoints.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      renderEndpoint(btn.dataset.endpoint);
    });
  });

  const consoleObserver = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    consoleObserver.disconnect();
    renderEndpoint('profile');
  }, { threshold: 0.4 });
  if (consoleOut) consoleObserver.observe(consoleOut);

  /* ---------- Experience accordion ---------- */
  $$('.job').forEach((job) => {
    const head = $('.job-head', job);
    const body = $('.job-body', job);
    const setOpen = (open) => {
      job.classList.toggle('open', open);
      head.setAttribute('aria-expanded', String(open));
      body.inert = !open;
    };
    setOpen(job.classList.contains('open'));
    head.addEventListener('click', () => setOpen(!job.classList.contains('open')));
  });

  /* ---------- Tech stack filter ---------- */
  const filters = $$('.filter');
  const tools = $$('.tool');
  const filterCount = $('#filter-count');
  filters.forEach((btn) => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.filter;
      filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let shown = 0;
      tools.forEach((tool, index) => {
        const match = category === 'all' || tool.dataset.cat.split(' ').includes(category);
        tool.hidden = !match;
        if (!match) return;
        shown += 1;
        if (!reduceMotion) {
          tool.classList.remove('pop');
          tool.style.animationDelay = `${Math.min(index, 12) * 18}ms`;
          void tool.offsetWidth;
          tool.classList.add('pop');
        }
      });
      filterCount.textContent = category === 'all'
        ? `Showing all ${shown} tools`
        : `Showing ${shown} ${btn.textContent.trim()} tools`;
    });
  });

  /* ---------- Project card spotlight ---------- */
  $$('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  /* ---------- Profile card tilt ---------- */
  const tiltCard = $('[data-tilt]');
  if (tiltCard && finePointer && !reduceMotion) {
    tiltCard.addEventListener('pointermove', (event) => {
      const rect = tiltCard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      tiltCard.style.transition = 'transform 0.1s linear';
      tiltCard.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    tiltCard.addEventListener('pointerleave', () => {
      tiltCard.style.transition = '';
      tiltCard.style.transform = '';
    });
  }

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        toast('Email copied to clipboard');
      } catch {
        toast(btn.dataset.copy);
      }
    });
  });

  /* ---------- Contact form → email app ---------- */
  const form = $('#contact-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const name = data.get('name').trim();
      const subject = `${data.get('topic')} — from ${name}`;
      const body = `${data.get('message').trim()}\n\n— ${name}\n${data.get('email').trim()}`;
      window.location.href = `mailto:shibanipurbey@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      toast('Opening your email app…');
    });
  }
})();
