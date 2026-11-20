/* ============================================================
   Lamington Hotel — Christmas layer

   Dresses the site for Christmas from 20 November to 2 January
   (PNG time), every year, then steps aside by itself. Dates and
   all the wording live in SETTINGS just below.

   Preview on any date:    add  ?xmas=on   to a page address
   Switch the preview off: add  ?xmas=off
   (the choice sticks while you click around, until the tab closes)

   To remove for good: delete the christmas.css and christmas.js
   lines from the four pages. Nothing else on the site depends on it.
   ============================================================ */

(() => {
  'use strict';

  /* ============================================================
     Settings
     ============================================================ */

  const SETTINGS = {
    /* Season as [month, day] in PNG time, both days included. */
    from: [11, 20],
    to: [1, 2],

    /* What drifts down the hero: 'gold' (warm glints), 'snow', or 'none'. */
    falling: 'gold',

    ribbon: {
      lead: 'Meri Krismas na Hapi Niu Yia',
      text: 'from all of us at Lamington Hotel',
    },

    hero: {
      title: 'Christmas beneath <em>Mount Lamington</em>',
      text: 'Travelling home for the festive season? Eighteen comfortable rooms, honest hospitality, and Paia’s Restaurant — your home in the heart of Popondetta town.',
    },

    bell: {
      hint: 'Go on — ring in the season.',
      litState: 'MERRY CHRISTMAS',
      litHint: 'Lights on. Welcome in.',
      jingle: true,
    },

    band: {
      eyebrow: 'The festive season',
      title: 'Home to Oro for <em>Christmas</em>',
      text: 'Coming home for the holidays, or bringing the team together before the year ends? Stay with us in the heart of Popondetta — Paia’s Restaurant serves daily, and our conference room seats 150 for end-of-year functions.',
      primary: { label: 'Book your stay', href: 'reservation.html' },
      secondary: { label: 'Plan a function', href: 'contact.html' },
    },

    footer: 'Safe travels home this Christmas — and a happy New Year from Popondetta.',
  };

  /* ============================================================
     Is it Christmas?
     ============================================================ */

  function inSeason(now) {
    /* PNG is UTC+10 all year, so the season turns over at midnight in
       Popondetta wherever the visitor happens to be. */
    const png = new Date(now.getTime() + 10 * 60 * 60 * 1000);
    const today = (png.getUTCMonth() + 1) * 100 + png.getUTCDate();
    const first = SETTINGS.from[0] * 100 + SETTINGS.from[1];
    const last = SETTINGS.to[0] * 100 + SETTINGS.to[1];
    return first <= last
      ? today >= first && today <= last
      : today >= first || today <= last;        /* season runs across New Year */
  }

  function previewChoice() {
    let choice = new URLSearchParams(window.location.search).get('xmas');
    if (choice !== 'on' && choice !== 'off') choice = null;
    try {
      if (choice) sessionStorage.setItem('lamington-xmas', choice);
      else choice = sessionStorage.getItem('lamington-xmas');
    } catch (e) { /* storage blocked — the address still works for this page */ }
    return choice;
  }

  const preview = previewChoice();
  const active = preview ? preview === 'on' : inSeason(new Date());
  if (!active) return;

  /* ============================================================
     Switch the theme on
     ============================================================ */

  const root = document.documentElement;
  root.classList.add('xmas');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navbar = document.querySelector('.navbar');
  const hero = document.querySelector('.hero');

  const SPARKLE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0c.5 3.6 2.4 5.5 6 6-3.6.5-5.5 2.4-6 6-.5-3.6-2.4-5.5-6-6 3.6-.5 5.5-2.4 6-6z"/></svg>';

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function debounce(fn, wait) {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(fn, wait);
    };
  }

  /* ---------- Greeting ribbon above the navbar ---------- */
  if (navbar) {
    const ribbon = make('div', 'xmas-ribbon');
    ribbon.innerHTML = SPARKLE;
    ribbon.append(make('strong', '', SETTINGS.ribbon.lead), make('span', '', SETTINGS.ribbon.text));
    ribbon.insertAdjacentHTML('beforeend', SPARKLE);
    navbar.before(ribbon);
  }

  /* ---------- String of lights hanging from the navbar ---------- */
  if (navbar) {
    const BULBS = [
      { name: 'red', glass: '#E5483D', glow: '#FF6A5C' },
      { name: 'gold', glass: '#F3C766', glow: '#FFD77A' },
      { name: 'green', glass: '#58B37A', glow: '#74E09C' },
      { name: 'white', glass: '#FFF1CC', glow: '#FFF3D6' },
    ];
    const SAG = 13;               /* how far each swag of wire dips, in px */
    const PER_SWAG = 4;           /* bulbs on each swag */

    const lights = make('div', 'xmas-lights');
    lights.setAttribute('aria-hidden', 'true');
    navbar.append(lights);
    let drawnWidth = 0;

    const drawLights = () => {
      const width = lights.clientWidth;
      if (!width || width === drawnWidth) return;
      drawnWidth = width;

      const swags = Math.max(2, Math.round(width / 180));
      const span = width / swags;
      let wire = 'M0 1';
      let bulbs = '';
      let count = 0;

      for (let s = 0; s < swags; s++) {
        const x0 = s * span;
        wire += ` Q${(x0 + span / 2).toFixed(1)} ${1 + SAG * 2} ${(x0 + span).toFixed(1)} 1`;

        for (let k = 0; k < PER_SWAG; k++) {
          const t = (k + 0.5) / PER_SWAG;
          const x = x0 + span * t;
          const y = 1 + 4 * SAG * t * (1 - t);            /* a point on the swag's curve */
          const bulb = BULBS[count % BULBS.length];
          const twinkle = (2.6 + (count * 1.37) % 1.8).toFixed(2);   /* each bulb keeps its own time */
          const offset = (-((count * 0.73) % 3.4)).toFixed(2);
          const chase = (count * 0.08).toFixed(2);
          bulbs += `
            <g class="xmas-bulb" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.3)"
               style="--t:${twinkle}s;--d:${offset}s;--c:${chase}s">
              <circle class="halo" cx="0" cy="9" r="12" fill="url(#xmas-glow-${bulb.name})"/>
              <rect x="-2.1" y="0" width="4.2" height="3.8" rx="0.8" fill="#4A4026"/>
              <path class="glass" fill="${bulb.glass}" stroke="#000" stroke-opacity="0.22" stroke-width="0.4"
                    d="M-3.4 7.2C-3.4 4.2 3.4 4.2 3.4 7.2C3.4 10.4 1.2 13 0 14.4C-1.2 13-3.4 10.4-3.4 7.2Z"/>
              <ellipse cx="-1.2" cy="6.8" rx="0.8" ry="1.6" fill="#fff" opacity="0.45"/>
            </g>`;
          count++;
        }
      }

      const glows = BULBS.map((bulb) => `
        <radialGradient id="xmas-glow-${bulb.name}">
          <stop offset="0" stop-color="${bulb.glow}" stop-opacity="0.9"/>
          <stop offset="1" stop-color="${bulb.glow}" stop-opacity="0"/>
        </radialGradient>`).join('');

      lights.innerHTML = `
        <svg viewBox="0 0 ${width} 46" preserveAspectRatio="none">
          <defs>${glows}</defs>
          <path class="xmas-wire" d="${wire}"/>
          ${bulbs}
        </svg>`;
    };

    drawLights();
    window.addEventListener('resize', debounce(drawLights, 150));
  }

  /* ---------- Falling lights, and the burst when the bell rings ---------- */
  function fallingLights(host, density) {
    if (!host || reducedMotion || SETTINGS.falling === 'none') return null;

    const canvas = make('canvas', 'xmas-glints');
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    host.prepend(canvas);

    const snow = SETTINGS.falling === 'snow';
    const between = (a, b) => a + Math.random() * (b - a);
    let width = 0;
    let height = 0;
    let flakes = [];
    let sparks = [];
    let onScreen = true;
    let running = false;
    let frameId = 0;
    let lastTime = 0;

    const newFlake = (anywhere) => ({
      x: between(0, width),
      y: anywhere ? between(0, height) : -10,
      size: snow ? between(1, 3) : between(0.7, 2.2),
      fall: snow ? between(22, 55) : between(7, 24),          /* px per second */
      sway: between(6, 20),
      swayRate: between(0.3, 0.9),
      phase: between(0, 6.283),
      blink: snow ? 0 : between(0.6, 1.8),
      alpha: snow ? between(0.5, 0.95) : between(0.3, 0.9),
      colour: snow ? '#FFFFFF' : (Math.random() < 0.8 ? '#F4DCA0' : '#FFF7E2'),
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const wanted = Math.round(Math.max(14, Math.min(90, width * height / 15000)) * density);
      while (flakes.length < wanted) flakes.push(newFlake(true));
      flakes.length = wanted;
    };

    const dot = (x, y, size, alpha, colour) => {
      ctx.fillStyle = colour;
      ctx.globalAlpha = alpha * 0.16;           /* soft glow */
      ctx.beginPath();
      ctx.arc(x, y, size * 3.2, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = alpha;                  /* bright centre */
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 6.283);
      ctx.fill();
    };

    const frame = (now) => {
      if (!running) return;
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0;
      const seconds = now / 1000;
      lastTime = now;
      ctx.clearRect(0, 0, width, height);

      flakes.forEach((flake, i) => {
        flake.y += flake.fall * dt;
        if (flake.y > height + 10) {
          flakes[i] = newFlake(false);          /* off the bottom — start again from the top */
          return;
        }
        const x = flake.x + Math.sin(seconds * flake.swayRate + flake.phase) * flake.sway;
        const glow = flake.blink ? 0.55 + 0.45 * Math.sin(seconds * flake.blink + flake.phase) : 1;
        dot(x, flake.y, flake.size, flake.alpha * glow, flake.colour);
      });

      sparks = sparks.filter((spark) => (spark.life -= dt) > 0);
      sparks.forEach((spark) => {
        spark.vy += 260 * dt;                   /* gravity */
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        dot(spark.x, spark.y, spark.size, Math.min(1, spark.life / 0.5), spark.colour);
      });

      ctx.globalAlpha = 1;
      frameId = requestAnimationFrame(frame);
    };

    /* Only animate while the hero is on screen and the tab is in view */
    const update = () => {
      const shouldRun = onScreen && !document.hidden;
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) {
        lastTime = 0;
        frameId = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(frameId);
      }
    };

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(debounce(resize, 120)).observe(host);
    else window.addEventListener('resize', debounce(resize, 150));     /* older phones */
    new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      update();
    }).observe(host);
    document.addEventListener('visibilitychange', update);
    update();

    return {
      burst(x, y) {
        const palette = ['#E5483D', '#F3C766', '#74E09C', '#FFF1CC'];
        for (let n = 0; n < 34; n++) {
          const angle = between(-Math.PI, 0);   /* an upward fan */
          const speed = between(90, 300);
          sparks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 60,
            size: between(1.2, 2.6),
            life: between(0.7, 1.5),
            colour: palette[n % palette.length],
          });
        }
      },
    };
  }

  /* ---------- Home hero: wording, star and falling lights ---------- */
  let heroLights = null;

  if (hero) {
    const title = hero.querySelector('h1');
    const intro = hero.querySelector('.hero-text');
    if (title && SETTINGS.hero.title) title.innerHTML = SETTINGS.hero.title;
    if (intro && SETTINGS.hero.text) intro.textContent = SETTINGS.hero.text;

    /* The Christmas star, resting above the summit of the ridgeline */
    const star = make('span', 'xmas-star');
    star.setAttribute('aria-hidden', 'true');
    star.innerHTML = `
      <svg viewBox="0 0 40 56">
        <defs>
          <radialGradient id="xmas-star-glow">
            <stop offset="0" stop-color="#FFF3D0" stop-opacity="0.85"/>
            <stop offset="1" stop-color="#E4CE9C" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="20" cy="27" r="20" fill="url(#xmas-star-glow)" opacity="0.6"/>
        <path fill="#F8E7B8" d="M20 0C20.9 16 24 23.5 40 27C24 30.5 20.9 38 20 56C19.1 38 16 30.5 0 27C16 23.5 19.1 16 20 0Z"/>
        <path fill="#F8E7B8" opacity="0.7" transform="rotate(45 20 27)"
              d="M20 17C20.5 23 24 26.5 30 27C24 27.5 20.5 31 20 37C19.5 31 16 27.5 10 27C16 26.5 19.5 23 20 17Z"/>
      </svg>`;
    hero.append(star);

    heroLights = fallingLights(hero, 1);
  }

  /* Inner pages get a lighter fall in their page header */
  fallingLights(document.querySelector('.page-hero'), 0.7);

  /* ---------- Reception bell: ring in the season ---------- */
  const bell = document.getElementById('receptionBell');

  if (bell && hero) {
    const bellState = document.getElementById('bellState');
    const bellHint = document.getElementById('bellHint');
    let audio = null;

    if (bellHint) bellHint.textContent = SETTINGS.bell.hint;

    /* One glockenspiel-ish note: a sine with a quick, quieter overtone */
    const chime = (frequency, when) => {
      [[1, 0.11, 0.6], [2.76, 0.03, 0.2]].forEach(([multiple, level, length]) => {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency * multiple;
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(level, when + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
        osc.connect(gain).connect(audio.destination);
        osc.start(when);
        osc.stop(when + length + 0.05);
      });
    };

    /* The opening of "Jingle Bells" (J. L. Pierpont, 1857 — public domain) */
    const jingle = () => {
      if (!SETTINGS.bell.jingle) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        if (audio.state === 'suspended') audio.resume();
        const E = 1318.51, G = 1567.98, C = 1046.5, D = 1174.66;
        const beat = 0.21;                      /* seconds */
        const tune = [[E, 1], [E, 1], [E, 2], [E, 1], [E, 1], [E, 2], [E, 1], [G, 1], [C, 1.5], [D, 0.5], [E, 3]];
        let when = audio.currentTime + 0.3;     /* just after the desk bell's own ding */
        tune.forEach(([note, beats]) => {
          chime(note, when);
          when += beats * beat;
        });
      } catch (e) { /* audio unavailable — the lights still come on */ }
    };

    /* Listening on the hero (not the bell itself) means this always runs
       after script.js has toggled the hero's "lit" state. */
    hero.addEventListener('click', (event) => {
      if (!event.target.closest('#receptionBell')) return;
      const lit = hero.classList.contains('lit');
      root.classList.toggle('xmas-lit', lit);
      if (lit && bellState) bellState.textContent = SETTINGS.bell.litState;
      if (bellHint) bellHint.textContent = lit ? SETTINGS.bell.litHint : SETTINGS.bell.hint;
      if (!lit) return;

      jingle();
      if (heroLights) {
        const bellBox = bell.getBoundingClientRect();
        const heroBox = hero.getBoundingClientRect();
        heroLights.burst(
          bellBox.left - heroBox.left + bellBox.width / 2,
          bellBox.top - heroBox.top + bellBox.height / 2
        );
      }
    });
  }

  /* ---------- Festive band on the home page, just above the rooms ---------- */
  const roomsGrid = document.querySelector('.rooms-grid');
  const roomsSection = roomsGrid && roomsGrid.closest('.section');

  if (roomsSection) {
    const band = make('section', 'xmas-band');
    band.setAttribute('aria-label', 'Christmas at Lamington Hotel');
    band.innerHTML = `
      <div class="xmas-band-inner">
        <img class="xmas-baubles" src="images/xmas-baubles.svg" alt="" loading="lazy">
        <div class="xmas-band-copy">
          <p class="eyebrow"></p>
          <h2>${SETTINGS.band.title}</h2>
          <p class="xmas-band-text"></p>
          <div class="xmas-band-actions">
            <a class="primary-btn"></a>
            <a class="secondary-btn"></a>
          </div>
        </div>
      </div>`;

    const copy = band.querySelector('.xmas-band-copy');
    const [primary, secondary] = copy.querySelectorAll('a');
    copy.querySelector('.eyebrow').textContent = SETTINGS.band.eyebrow;
    copy.querySelector('.xmas-band-text').textContent = SETTINGS.band.text;
    primary.textContent = SETTINGS.band.primary.label;
    primary.href = SETTINGS.band.primary.href;
    secondary.textContent = SETTINGS.band.secondary.label;
    secondary.href = SETTINGS.band.secondary.href;
    roomsSection.before(band);

    /* The same scroll-reveal the rest of the page uses */
    copy.classList.add('reveal');
    if (reducedMotion) {
      copy.classList.add('in');
    } else {
      new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) return;
        copy.classList.add('in');
        observer.disconnect();
      }, { threshold: 0.15 }).observe(copy);
    }
  }

  /* ---------- Footer greeting ---------- */
  const copyright = document.querySelector('.footer .footer-copy');
  if (copyright && SETTINGS.footer) {
    copyright.before(make('p', 'xmas-footer-note', SETTINGS.footer));
  }
})();
