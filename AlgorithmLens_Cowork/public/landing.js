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

  // The launch-list form. One POST, no credentials, distinct copy for each
  // way it can fail, and nothing is ever reported as saved unless the server
  // said so.
  const form = $('launchForm');
  const status = $('formStatus');
  const email = $('email');
  const button = $('submit');
  const buttonLabel = button.textContent;
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
    status.classList.toggle('is-ok', text === COPY.received);
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
    button.textContent = 'Sending';
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
      button.textContent = buttonLabel;
    }
  });
})();

// Polish pass: the header's scrolled state, the film panel's playing state,
// the example record's sheet stack, the tappable fictional feed whose readout
// is the record forming, and the selectable three steps. Everything here is
// decorative or illustrative; nothing leaves the page.
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  // Header: 72 px on the paper ground at rest, 64 px on translucent paper once
  // the page has scrolled. Reduced motion keeps the ground opaque (CSS).
  const topbar = $('topbar');
  if (topbar) {
    let scrolled = null;
    const check = () => {
      const now = window.scrollY > 8;
      if (now !== scrolled) { scrolled = now; topbar.classList.toggle('scrolled', now); }
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

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

  // The example record: four fictional Instagram scans, the same data the
  // explorer's record view shows (explore/examples.js). One mark, one post;
  // blue where the post carried a printed ad label, hollow where the label
  // could not be read. The rest pose follows the native port contract.
  // D-191: the data is the exported copy of the mobile repo's
  // canon/example-record.json (public/example-record.js, loaded before this
  // script); the inline list is the fallback if that file is missing, and
  // src/exampleRecord.test.js pins the two to each other.
  const FALLBACK_SCANS = [
    { date: 'Aug 30', n: 33, ads: [1, 8, 17, 24, 33], unknown: [7] },
    { date: 'Sep 6', n: 39, ads: [1, 8, 17, 24, 33], unknown: [7] },
    { date: 'Sep 13', n: 8, ads: [1, 8], unknown: [7] },
    { date: 'Sep 20', n: 45, ads: [1, 8, 17, 24, 33, 41], unknown: [7] },
  ];
  const exported = window.EXAMPLE_RECORD && window.EXAMPLE_RECORD.record && Array.isArray(window.EXAMPLE_RECORD.record.scans)
    ? window.EXAMPLE_RECORD.record.scans.map((s) => ({ date: s.date, n: s.posts, ads: s.ads, unknown: s.unknown }))
    : null;
  const SCANS = exported && exported.length ? exported : FALLBACK_SCANS;
  const stage = $('stage');
  const chips = $('chips');
  if (stage && chips) {
    const total = SCANS.reduce((a, s) => a + s.n, 0);
    const wide = () => matchMedia('(min-width: 900px)').matches;
    const sheets = SCANS.map(() => { const s = document.createElement('div'); s.className = 'sheet'; stage.append(s); return s; });
    const buttons = SCANS.map((scan, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = scan.date; b.id = 'week-' + i;
      b.addEventListener('click', () => select(i)); chips.append(b); return b;
    });
    const inspect = document.createElement('a'); inspect.className = 'chip inspect'; inspect.textContent = 'Inspect this scan'; chips.append(inspect);
    function marks(sheet, scan) {
      sheet.replaceChildren();
      const step = wide() ? 27 : 24;
      for (let p = 1; p <= scan.n; p++) {
        const i = document.createElement('i');
        const col = (p - 1) % 8, row = Math.floor((p - 1) / 8);
        i.style.left = (20 + col * step) + 'px';
        i.style.top = (23 + row * 19) + 'px';
        if (scan.ads.includes(p)) i.className = 'ad'; else if (scan.unknown.includes(p)) i.className = 'un';
        sheet.append(i);
      }
      const foot = document.createElement('span'); foot.className = 'foot';
      const d = document.createElement('span'); d.textContent = scan.date;
      const c = document.createElement('span'); c.textContent = scan.n + ' posts';
      foot.append(d, c); sheet.append(foot);
    }
    let current = SCANS.length - 1;
    function select(i) {
      current = i;
      sheets.forEach((sheet, k) => {
        const depth = i - k;
        const behind = depth > 0 ? depth : (SCANS.length - k) + i; // sheets after the chosen one go to the back
        sheet.classList.toggle('active', k === i);
        sheet.style.zIndex = k === i ? '8' : String(8 - behind);
        sheet.style.setProperty('--dx', (-9 * behind) + 'px');
        sheet.style.setProperty('--dy', (18 * behind) + 'px');
        sheet.style.setProperty('--s', String(1 - 0.015 * behind));
        if (k === i) marks(sheet, SCANS[k]); else sheet.replaceChildren();
      });
      buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      inspect.href = 'explore/#record';
      const s = SCANS[i];
      $('recordTitle').textContent = s.date + ', held on record.';
      $('recordFacts').textContent = s.n + ' posts in this scan. ' + s.ads.length + ' carried a printed ad label. ' + total + ' posts across ' + SCANS.length + ' scans.';
    }
    select(current);
    matchMedia('(min-width: 900px)').addEventListener('change', () => marks(sheets[current], SCANS[current]));
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
        const title = document.createElement('span'); title.textContent = 'Post ' + n + '. ' + p.account;
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
    const box = steps.closest('.how-grid') || steps.parentElement;
    box.addEventListener('mouseenter', () => { held = true; });
    box.addEventListener('mouseleave', () => { held = false; });
    box.addEventListener('focusin', () => { held = true; });
    box.addEventListener('focusout', () => { held = false; });
    reduced.addEventListener('change', start);
    show(1); start();
  }
})();
