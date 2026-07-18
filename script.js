/* Lamington Hotel — shared script */

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
    const roomType = document.getElementById('roomType').value;
    const guests = document.getElementById('guestCount').value;

    if (!name || !email || !checkIn.value || !checkOut.value) {
      showNote(reservationNote, 'Please fill in your name, email, and both dates to send a request.');
      return;
    }

    const subject = encodeURIComponent('Booking request — ' + name);
    const body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Room type: ' + roomType + '\n' +
      'Check in: ' + checkIn.value + '\n' +
      'Check out: ' + checkOut.value + '\n' +
      'Guests: ' + guests
    );

    window.location.href = 'mailto:Lamington@gmail.com?subject=' + subject + '&body=' + body;
    showNote(reservationNote,
      'Thanks, ' + name.split(' ')[0] + ' — your email app should open with the request ready to send. ' +
      'Our front desk will confirm your booking by reply.');
    reservationForm.reset();
    checkOut.min = today;
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

    const subject = encodeURIComponent('Website enquiry — ' + name);
    const body = encodeURIComponent('From: ' + name + ' (' + email + ')\n\n' + message);

    window.location.href = 'mailto:Lamington@gmail.com?subject=' + subject + '&body=' + body;
    showNote(contactNote, 'Thanks — your email app should open with the message ready to send.');
    contactForm.reset();
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
  '.amenity-card, .room-card, .menu-card, .info-box, .section-head, .dine-band, .reservation-form, .contact-form, .reservation-aside'
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
