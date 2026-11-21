/* Lamington Hotel — shared script */

/* Page-view tracking */
document.addEventListener('DOMContentLoaded', function () {
  if (navigator.sendBeacon) {
    try {
      navigator.sendBeacon('/track.php', JSON.stringify({
        path: location.pathname,
        referrer: document.referrer,
      }));
    } catch (e) {
      // Tracking must never break the page.
    }
  }
});

/* Mobile navigation */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.navbar nav');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

/* Reservation form */
const checkIn = document.getElementById('checkIn');
const checkOut = document.getElementById('checkOut');
const reservationForm = document.querySelector('.reservation-form');
const reservationNote = document.getElementById('reservationNote');

if (checkIn && checkOut && reservationForm) {
  const today = new Date().toISOString().split('T')[0];
  checkIn.min = today;
  checkOut.min = today;

  /* Arriving from a "Book this room" link, e.g. reservation.html?room=vip */
  const roomType = document.getElementById('roomType');
  const wantedRoom = (new URLSearchParams(location.search).get('room') || '').replace(/[^a-z]/g, '');
  const wantedOption = roomType && wantedRoom && roomType.querySelector('option[data-room="' + wantedRoom + '"]');
  if (wantedOption) roomType.value = wantedOption.value;

  checkIn.addEventListener('change', () => {
    checkOut.min = checkIn.value;
    if (checkOut.value && checkOut.value < checkIn.value) {
      checkOut.value = '';
    }
  });

  reservationForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('guestName').value.trim();
    const email = document.getElementById('reservationEmail').value.trim();

    if (!name || !email || !checkIn.value || !checkOut.value) {
      showNote(reservationNote, 'Please fill in your name, email, and both dates to send a request.');
      return;
    }

    const submitBtn = reservationForm.querySelector('.form-submit');
    submitBtn.disabled = true;
    showNote(reservationNote, 'Sending your request…');

    fetch(reservationForm.action, { method: 'POST', body: new FormData(reservationForm) })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNote(reservationNote,
            'Thanks, ' + name.split(' ')[0] + ' — your booking request has been sent. ' +
            'Our front desk will confirm your booking by reply.');
          reservationForm.reset();
          checkOut.min = today;
        } else {
          showNote(reservationNote, data.message || 'Something went wrong — please email us directly at reservations@lamingtonhotel.com.pg.');
        }
      })
      .catch(() => {
        showNote(reservationNote, 'Something went wrong — please email us directly at reservations@lamingtonhotel.com.pg.');
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
}

/* Contact form */
const contactForm = document.getElementById('contactForm');
const contactNote = document.getElementById('contactNote');

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
      showNote(contactNote, 'Please fill in all three fields so we can get back to you.');
      return;
    }

    const submitBtn = contactForm.querySelector('.form-submit');
    submitBtn.disabled = true;
    showNote(contactNote, 'Sending your message…');

    fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm) })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNote(contactNote, 'Thanks — your message has been sent. Our front desk will get back to you soon.');
          contactForm.reset();
        } else {
          showNote(contactNote, data.message || 'Something went wrong — please email us directly at reservations@lamingtonhotel.com.pg.');
        }
      })
      .catch(() => {
        showNote(contactNote, 'Something went wrong — please email us directly at reservations@lamingtonhotel.com.pg.');
      })
      .finally(() => {
        submitBtn.disabled = false;
      });
  });
}

function showNote(el, text) {
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
}

/* ============================================================
   Interactive layer
   ============================================================ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Scroll reveals — auto-tag cards and section heads */
document.querySelectorAll(
  '.amenity-card, .room-card, .room-feature, .menu-card, .info-box, .section-head, .dine-band, .reservation-form, .contact-form, .reservation-aside'
).forEach(el => el.classList.add('reveal'));

if (prefersReducedMotion) {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
} else {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* Reception bell — ring to wake the hotel */
const bell = document.getElementById('receptionBell');
if (bell) {
  const hero = document.querySelector('.hero');
  const ridge = document.querySelector('.ridge');
  const bellState = document.getElementById('bellState');
  const bellHint = document.getElementById('bellHint');
  let audioCtx = null;

  function ding() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;
      [1318.5, 1975.5].forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(i ? 0.12 : 0.22, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.7);
      });
    } catch (e) { /* audio unavailable — the visual still plays */ }
  }

  bell.addEventListener('click', () => {
    ding();
    bell.classList.remove('ringing');
    void bell.offsetWidth; /* restart the swing */
    if (!prefersReducedMotion) bell.classList.add('ringing');

    const lit = hero.classList.toggle('lit');
    if (ridge) ridge.classList.toggle('lit', lit);
    bell.setAttribute('aria-pressed', lit ? 'true' : 'false');
    bellState.textContent = lit ? 'AT YOUR SERVICE' : 'FRONT DESK';
    bellHint.textContent = lit ? 'Someone is on the way. Welcome in.' : 'Go on — ring the bell.';
  });
}

/* Gentle hero parallax */
const heroEl = document.querySelector('.hero');
if (heroEl && !prefersReducedMotion) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroEl.style.backgroundPosition = 'center calc(30% + ' + (y * 0.12) + 'px)';
    }
  }, { passive: true });
}

/* Photo galleries — swipe, use the arrows, or pick a thumbnail */
document.querySelectorAll('[data-gallery]').forEach((gallery) => {
  const track = gallery.querySelector('.gallery-track');
  const slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
  const thumbStrip = gallery.querySelector('.gallery-thumbs');
  const thumbs = Array.from(gallery.querySelectorAll('.gallery-thumb'));
  const prev = gallery.querySelector('.gallery-nav.prev');
  const next = gallery.querySelector('.gallery-nav.next');
  const count = gallery.querySelector('.gallery-count');
  let current = 0;

  function show(index) {
    const target = Math.max(0, Math.min(slides.length - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  /* Reflect whichever photo is in view */
  function mark(index) {
    current = index;
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle('is-active', i === index);
      if (i === index) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    if (count) count.textContent = (index + 1) + ' / ' + slides.length;
    /* aria-disabled (not disabled) so the button keeps keyboard focus at either end */
    if (prev) prev.setAttribute('aria-disabled', index === 0 ? 'true' : 'false');
    if (next) next.setAttribute('aria-disabled', index === slides.length - 1 ? 'true' : 'false');

    /* keep the active thumbnail in view without moving the page */
    const thumb = thumbs[index];
    if (thumb && thumbStrip) {
      const left = thumb.offsetLeft;      /* the strip is the thumbnail's offset parent */
      if (left < thumbStrip.scrollLeft) thumbStrip.scrollLeft = left;
      else if (left + thumb.offsetWidth > thumbStrip.scrollLeft + thumbStrip.clientWidth) {
        thumbStrip.scrollLeft = left + thumb.offsetWidth - thumbStrip.clientWidth;
      }
    }

    /* fetch the neighbouring photos now, so the next swipe is instant */
    [index - 1, index + 1].forEach((i) => {
      const img = slides[i] && slides[i].querySelector('img');
      if (img) img.loading = 'eager';
    });
  }

  track.addEventListener('scroll', () => {
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== current && slides[index]) mark(index);
  }, { passive: true });

  if (prev) prev.addEventListener('click', () => show(current - 1));
  if (next) next.addEventListener('click', () => show(current + 1));
  thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => show(i)));

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  /* Only start fetching neighbours once the gallery is actually on screen */
  if ('IntersectionObserver' in window) {
    const onScreen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        mark(current);
        onScreen.disconnect();
      }
    });
    onScreen.observe(gallery);
  }
  if (prev) prev.setAttribute('aria-disabled', 'true');
});

/* Stay calculator */
const calcRoom = document.getElementById('calcRoom');
if (calcRoom) {
  const calcNightsValue = document.getElementById('calcNightsValue');
  const calcTotal = document.getElementById('calcTotal');
  const calcGst = document.getElementById('calcGst');
  let nights = 2;

  function kina(n) {
    return 'K' + n.toLocaleString('en-PG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function updateCalc() {
    const rate = parseFloat(calcRoom.value);
    const total = rate * nights;
    const gst = total * 10 / 110; /* rates are GST-inclusive */
    calcNightsValue.textContent = nights;
    calcTotal.textContent = kina(total);
    calcGst.textContent = kina(gst);
  }

  document.getElementById('nightsMinus').addEventListener('click', () => {
    nights = Math.max(1, nights - 1);
    updateCalc();
  });
  document.getElementById('nightsPlus').addEventListener('click', () => {
    nights = Math.min(30, nights + 1);
    updateCalc();
  });
  calcRoom.addEventListener('change', updateCalc);
  updateCalc();
}
