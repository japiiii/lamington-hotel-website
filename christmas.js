/* ============================================================
   Lamington Hotel — Christmas layer

   Dresses the site for Christmas from 20 November to 2 January
   (PNG time), every year, then steps aside by itself. Dates and
   all the wording live in SETTINGS just below.

   Preview on any date:    add  ?xmas=on   to a page address
   Switch the preview off: add  ?xmas=off
   (the choice sticks while you click around, until the tab closes)

   To remove for good: delete the christmas.css and christmas.js
   lines from each page. Nothing else on the site depends on it.
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

    ribbon: {
      lead: 'Meri Krismas na Hapi Niu Yia',
      text: 'from all of us at Lamington Hotel',
    },

    /* The home page headline, and the line under it */
    headline: {
      title: 'Christmas beneath <em>Mount Lamington</em>',
      text: 'Travelling home for the festive season? Sixteen comfortable rooms, honest hospitality, and Paia’s Restaurant — your home in the heart of Popondetta town.',
    },

    band: {
      label: 'The festive season',
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

  document.documentElement.classList.add('xmas');

  const navbar = document.querySelector('.navbar');

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

  /* ---------- Greeting ribbon above the header ---------- */
  if (navbar) {
    const ribbon = make('div', 'xmas-ribbon');
    ribbon.innerHTML = SPARKLE;
    ribbon.append(make('strong', '', SETTINGS.ribbon.lead), make('span', '', SETTINGS.ribbon.text));
    ribbon.insertAdjacentHTML('beforeend', SPARKLE);
    navbar.before(ribbon);
  }

  /* ---------- String of lights hanging from the header ---------- */
  if (navbar) {
    const BULBS = [
      { name: 'red', glass: '#E0352B', glow: '#FF6A5C' },
      { name: 'amber', glass: '#F5B83D', glow: '#FFD77A' },
      { name: 'green', glass: '#35B26B', glow: '#74E09C' },
      { name: 'cream', glass: '#FFF1CC', glow: '#FFF3D6' },
    ];
    const SAG = 12;               /* how far each swag of wire dips, in px */
    const PER_SWAG = 3;           /* bulbs on each swag */

    const lights = make('div', 'xmas-lights');
    lights.setAttribute('aria-hidden', 'true');
    navbar.append(lights);
    let drawnWidth = 0;

    const drawLights = () => {
      const width = lights.clientWidth;
      if (!width || width === drawnWidth) return;
      drawnWidth = width;

      const swags = Math.max(2, Math.round(width / 170));
      const span = width / swags;
      let wire = 'M0 0';
      let bulbs = '';
      let count = 0;

      for (let s = 0; s < swags; s++) {
        const x0 = s * span;
        wire += ` Q${(x0 + span / 2).toFixed(1)} ${SAG * 2} ${(x0 + span).toFixed(1)} 0`;

        for (let k = 0; k < PER_SWAG; k++) {
          const t = (k + 0.5) / PER_SWAG;
          const x = x0 + span * t;
          const y = 4 * SAG * t * (1 - t);                /* a point on the swag's curve */
          const bulb = BULBS[count % BULBS.length];
          const twinkle = (2.6 + (count * 1.37) % 1.8).toFixed(2);   /* each bulb keeps its own time */
          const offset = (-((count * 0.73) % 3.4)).toFixed(2);
          bulbs += `
            <g class="xmas-bulb" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(1.75)"
               style="--t:${twinkle}s;--d:${offset}s">
              <circle class="halo" cx="0" cy="9" r="11" fill="url(#xmas-glow-${bulb.name})"/>
              <rect x="-2.2" y="-0.4" width="4.4" height="4.2" rx="0.8" fill="#0C3A2B"/>
              <path fill="${bulb.glass}" stroke="#0C3A2B" stroke-opacity="0.55" stroke-width="0.5"
                    d="M-3.4 7.2C-3.4 4.2 3.4 4.2 3.4 7.2C3.4 10.4 1.2 13 0 14.4C-1.2 13-3.4 10.4-3.4 7.2Z"/>
              <ellipse cx="-1.2" cy="6.8" rx="0.8" ry="1.6" fill="#fff" opacity="0.5"/>
            </g>`;
          count++;
        }
      }

      const glows = BULBS.map((bulb) => `
        <radialGradient id="xmas-glow-${bulb.name}">
          <stop offset="0" stop-color="${bulb.glow}" stop-opacity="0.85"/>
          <stop offset="1" stop-color="${bulb.glow}" stop-opacity="0"/>
        </radialGradient>`).join('');

      lights.innerHTML = `
        <svg viewBox="0 0 ${width} 50" preserveAspectRatio="none">
          <defs>${glows}</defs>
          <path class="xmas-wire" d="${wire}"/>
          ${bulbs}
        </svg>`;
    };

    drawLights();
    window.addEventListener('resize', debounce(drawLights, 150));
  }

  /* ---------- Home page: the headline and the line under it ---------- */
  const intro = document.querySelector('.intro');

  if (intro) {
    const title = intro.querySelector('h1');
    const text = intro.querySelector('.lead');
    if (title && SETTINGS.headline.title) title.innerHTML = SETTINGS.headline.title;
    if (text && SETTINGS.headline.text) text.textContent = SETTINGS.headline.text;
  }

  /* ---------- Home page: festive band, just above the rooms ---------- */
  const roomsGrid = document.querySelector('.rooms-grid');
  const roomsSection = roomsGrid && roomsGrid.closest('.section');

  if (roomsSection) {
    const band = make('section', 'xmas-band');
    band.setAttribute('aria-label', 'Christmas at Lamington Hotel');
    band.innerHTML = `
      <div class="xmas-band-inner">
        <img class="xmas-baubles" src="images/xmas-baubles.svg?v=2" width="300" height="236" alt="" loading="lazy">
        <div class="xmas-band-copy">
          <p class="label"></p>
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
    copy.querySelector('.label').textContent = SETTINGS.band.label;
    copy.querySelector('.xmas-band-text').textContent = SETTINGS.band.text;
    primary.textContent = SETTINGS.band.primary.label;
    primary.href = SETTINGS.band.primary.href;
    secondary.textContent = SETTINGS.band.secondary.label;
    secondary.href = SETTINGS.band.secondary.href;
    roomsSection.before(band);
  }

  /* ---------- Footer greeting ---------- */
  const copyright = document.querySelector('.footer .footer-copy');
  if (copyright && SETTINGS.footer) {
    copyright.before(make('p', 'xmas-footer-note', SETTINGS.footer));
  }
})();
