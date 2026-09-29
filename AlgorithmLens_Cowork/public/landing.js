const LAUNCH_LIST_ENDPOINT = "https://czrehjybsqzmudtgneqy.supabase.co/functions/v1/launch-list";

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  // The hero film. Muted, inline, looping, with native controls and an
  // explicit toggle. Autoplay is requested once, only when the visitor has
  // not asked for reduced motion; a refusal only changes the button label.
  const film = $('heroFilm');
  const toggle = $('filmToggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  function sync() {
    toggle.textContent = film.paused ? 'Play the example film' : 'Pause the example film';
    toggle.setAttribute('aria-pressed', String(!film.paused));
  }
  function policy() {
    if (motion.matches) {
      film.autoplay = false;
      film.pause();
    } else {
      film.autoplay = true;
      const attempt = film.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(sync);
    }
    sync();
  }
  film.muted = true;
  film.addEventListener('play', sync);
  film.addEventListener('pause', sync);
  toggle.addEventListener('click', () => {
    if (film.paused) {
      const attempt = film.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(sync);
    } else {
      film.pause();
    }
  });
  motion.addEventListener('change', policy);
  policy();

  // The example record: the explorer's record view in a sandboxed frame.
  // The frame reports its own height; nothing else crosses the boundary.
  const frame = $('specimen');
  window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    const data = e.data;
    if (data && data.type === 'specimen-height' && Number.isFinite(data.height)) {
      frame.style.height = Math.max(320, Math.min(1800, Math.ceil(data.height))) + 'px';
    }
  });

  // The launch-list form. One POST, no credentials, distinct copy for each
  // way it can fail, and nothing is ever reported as saved unless the server
  // said so.
  const form = $('launchForm');
  const status = $('formStatus');
  const email = $('email');
  const button = $('submit');
  const COPY = {
    sending: 'Sending your request.',
    received: 'Your launch-list request was received.',
    unset: 'The launch list is not connected yet. Your email has not been sent.',
    unavailable: 'The launch list is not available. Your email has not been sent.',
    server: 'The launch list could not record your address. Nothing was saved. Try again later.',
    rejected: 'The launch list did not accept this address. Nothing was saved. Check the address and try again.',
    limited: 'Too many requests from this connection. Nothing was saved. Try again in ten minutes.',
    offline: 'The launch list could not be reached. Nothing was sent. Check your connection and try again.',
  };
  function say(text, isError) {
    status.textContent = text;
    status.classList.toggle('is-error', !!isError);
    email.setAttribute('aria-invalid', isError && text === COPY.rejected ? 'true' : 'false');
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    if (!LAUNCH_LIST_ENDPOINT) { say(COPY.unset, true); return; }
    let endpoint;
    try {
      endpoint = new URL(LAUNCH_LIST_ENDPOINT, location.href);
      if (!['https:', 'http:'].includes(endpoint.protocol)) throw new Error('scheme');
    } catch {
      say(COPY.unavailable, true);
      return;
    }
    button.disabled = true;
    say(COPY.sending, false);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), consent: true, source: 'algorithmlens-launch-list' }),
        credentials: 'omit',
        signal: controller.signal,
      });
      if (response.ok) {
        say(COPY.received, false);
        form.reset();
      } else if (response.status === 429) {
        say(COPY.limited, true);
      } else if (response.status >= 400 && response.status < 500) {
        say(COPY.rejected, true);
      } else {
        say(COPY.server, true);
      }
    } catch {
      say(COPY.offline, true);
    } finally {
      clearTimeout(timeout);
      button.disabled = false;
    }
  });
})();

// Brand batch: the old site's micro-interactions, adapted to the paper canon.
// Reveal on scroll, the film panel's playing state, the tappable fictional
// feed whose readout is the record forming, and the selectable three steps.
// Everything here is decorative or illustrative; nothing leaves the page.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Reveal: elements rise 12 px over 400 ms once, when they enter the viewport.
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  // Film panel: the pulse dot and the scan line run only while the film plays.
  const film = $('heroFilm');
  const panel = $('filmPanel');
  if (film && panel) {
    const state = () => panel.classList.toggle('playing', !film.paused && !film.ended);
    ['play', 'playing', 'pause', 'ended', 'emptied'].forEach((ev) => film.addEventListener(ev, state));
    state();
  }

  // The record forming: four fictional posts, observable facts only.
  const POSTS = {
    1: { account: '@harbor.coffee', kind: 'ad', facts: [['Ad label', 'Printed: Sponsored'], ['Origin', 'No label read'], ['Account', '@harbor.coffee'], ['Position', '1 of 4']], chip: 'ad label', extra: 'Why it was shown: unknown.' },
    2: { account: '@city.notes', kind: 'mine', facts: [['Ad label', 'None printed'], ['Origin', 'Following, as labeled'], ['Account', '@city.notes'], ['Position', '2 of 4']], chip: 'following', extra: 'A headline was on screen. Whether it is political is an inference, not a fact.' },
    3: { account: '@wildpath.journal', kind: 'plain', facts: [['Ad label', 'None printed'], ['Origin', 'Suggested, as labeled'], ['Account', '@wildpath.journal'], ['Position', '3 of 4']], chip: 'suggested', extra: 'Suggested. Which action led here: unknown.' },
    4: { account: '@harbor.coffee', kind: 'mine', facts: [['Ad label', 'None printed'], ['Origin', 'Following, as labeled'], ['Account', '@harbor.coffee, also at post 1'], ['Position', '4 of 4']], chip: 'repeat account', extra: 'The same account returns. A repeat in four posts, not a pattern.' },
  };
  const rows = $('readRows');
  if (rows) {
    const read = new Set();
    const buttons = Array.from(document.querySelectorAll('.read[data-read]'));
    function draw() {
      rows.replaceChildren();
      const chips = $('tunedChips');
      chips.replaceChildren();
      const order = buttons.map((b) => Number(b.dataset.read)).filter((n) => read.has(n));
      order.forEach((n) => {
        const p = POSTS[n];
        const row = document.createElement('div'); row.className = 'row';
        const head = document.createElement('div'); head.className = 'row-head';
        const dot = document.createElement('i'); if (p.kind !== 'plain') dot.className = p.kind;
        const title = document.createElement('span'); title.textContent = 'Post ' + n + ' · ' + p.account;
        const em = document.createElement('em'); em.textContent = p.facts.length + ' facts read';
        head.append(dot, title, em);
        const grid = document.createElement('div'); grid.className = 'row-grid';
        p.facts.forEach(([k, v]) => { const cell = document.createElement('div'); const s = document.createElement('small'); s.textContent = k; const val = document.createElement('span'); val.textContent = v; cell.append(s, val); grid.append(cell); });
        const extra = document.createElement('p'); extra.className = 'small'; extra.style.margin = '10px 0 0'; extra.textContent = p.extra;
        row.append(head, grid, extra);
        rows.append(row);
        const chip = document.createElement('b'); chip.textContent = p.chip; chips.append(chip);
      });
      if (!order.length) { const b = document.createElement('b'); b.textContent = 'nothing yet'; chips.append(b); }
      $('readCount').textContent = order.length + ' of 4 posts';
      $('readBar').style.width = (order.length / 4) * 100 + '%';
      $('readEmpty').hidden = order.length > 0;
      const foot = $('readFoot');
      foot.hidden = order.length === 0;
      $('readNote').textContent = order.length === 4 ? 'Four posts read. Why any of them appeared: still unknown.' : order.length + ' of 4 posts read. The record grows only with what is on screen.';
      buttons.forEach((b) => {
        const n = Number(b.dataset.read);
        b.setAttribute('aria-pressed', String(read.has(n)));
        b.textContent = read.has(n) ? 'In record' : 'Read';
        b.classList.toggle('ring', !read.size && n === 1);
      });
    }
    buttons.forEach((b) => b.addEventListener('click', () => { const n = Number(b.dataset.read); if (read.has(n)) read.delete(n); else read.add(n); draw(); }));
    $('readReset').addEventListener('click', () => { read.clear(); draw(); });
    draw();
  }

  // Three steps: click to select; advances every five seconds unless the
  // visitor asked for reduced motion, is hovering or has focus inside.
  const steps = $('steps');
  if (steps) {
    const buttons = Array.from(steps.querySelectorAll('.step'));
    const previews = Array.from(document.querySelectorAll('.preview'));
    let current = 1, timer = null, held = false;
    function show(n) {
      current = n;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === n)));
      previews.forEach((p) => { p.hidden = Number(p.dataset.preview) !== n; });
    }
    function tick() { if (!held && !document.hidden) show((current % 3) + 1); }
    function start() { stop(); if (!reduced.matches) timer = setInterval(tick, 5000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    buttons.forEach((b) => b.addEventListener('click', () => { show(Number(b.dataset.step)); start(); }));
    const box = steps.parentElement;
    box.addEventListener('mouseenter', () => { held = true; });
    box.addEventListener('mouseleave', () => { held = false; });
    box.addEventListener('focusin', () => { held = true; });
    box.addEventListener('focusout', () => { held = false; });
    reduced.addEventListener('change', start);
    show(1); start();
  }
})();
