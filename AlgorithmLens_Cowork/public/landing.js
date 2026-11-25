const LAUNCH_LIST_ENDPOINT = "https://czrehjybsqzmudtgneqy.supabase.co/functions/v1/launch-list";
// The public beta on TestFlight. BETA_LINK is the general beta group: the home
// page's "Join the beta on iPhone" button and "Join the beta" header pill point
// here. While it is empty the home page falls back to the launch-list call to
// action it carried before the beta (see the last block of this file).
const BETA_LINK = "https://testflight.apple.com/join/7n7n3scz";
// TIKTOK_BETA_LINK is a separate TestFlight group used only on /tt/, the page
// linked from TikTok, so installs that came from TikTok can be counted in App
// Store Connect. /tt/ marks itself with data-beta-group="tiktok" on <html>
// (scripts/build-tt-page.mjs). If this is empty, /tt/ falls back to BETA_LINK.
const TIKTOK_BETA_LINK = "https://testflight.apple.com/join/qUgygVHs";
// Which beta group this page belongs to: 'tiktok' on /tt/, '' on the home page.
const BETA_GROUP = document.documentElement.getAttribute('data-beta-group') || '';

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

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
        // The source names the page: the launch-list table keeps it, so
        // signups from /tt/ can be counted apart from the home page's.
        body: JSON.stringify({ email: email.value.trim(), consent: true, source: BETA_GROUP === 'tiktok' ? 'algorithmlens-launch-list-tt' : 'algorithmlens-launch-list' }),
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

// Polish pass: the header's scrolled state, the example record's sheet stack, the tappable fictional feed whose readout
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

  // The header menu (below 900 px) is a native disclosure, so it opens
  // without script. Script only closes it: when a link inside it is
  // followed, on Escape, and when a click lands outside it.
  const menu = $('menu');
  if (menu) {
    menu.addEventListener('click', (e) => { if (e.target.closest('nav a')) menu.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.open = false; menu.querySelector('summary').focus(); } });
    document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }

  // Header links that point at sections of this page: the one whose section
  // lies across the middle of the viewport is marked as the current location
  // (and keeps the underline the others show on hover).
  const spyLinks = Array.from(document.querySelectorAll('nav.sections a[href^="#"]'));
  if (spyLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(spyLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const a = byId.get(e.target.id);
        if (!a) return;
        if (e.isIntersecting) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((a, id) => { const section = $(id); if (section) spy.observe(section); });
  }

  // Reveal: elements rise 12 px over 400 ms once, when they enter the viewport.
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
  }

  // The example film sits in a closed disclosure under the four posts. Its
  // poster is fetched when the disclosure is first opened, and the film
  // itself only when it is played (preload="none"), so a visitor who never
  // opens it downloads none of it.
  const filmMore = $('film');
  const exampleFilm = $('exampleFilm');
  if (filmMore && exampleFilm) {
    const dress = () => { if (filmMore.open && !exampleFilm.poster && exampleFilm.dataset.poster) exampleFilm.poster = exampleFilm.dataset.poster; };
    filmMore.addEventListener('toggle', dress);
    dress();
  }

  // Count bars: each cell carries its index so the bar can tick in from the
  // left when it is revealed (the stagger itself is CSS, and reduced motion
  // skips it).
  document.querySelectorAll('.countbar').forEach((bar) => {
    Array.from(bar.children).forEach((cell, i) => cell.style.setProperty('--i', String(i)));
  });

  // The can and cannot lists: each row carries its index too, so the two
  // lists come in row by row, side by side, when the ledger is revealed.
  document.querySelectorAll('.readlist').forEach((list) => {
    Array.from(list.children).forEach((row, i) => row.style.setProperty('--i', String(i)));
  });

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
    // A sheet behind the chosen one can be clicked to bring it forward. The
    // stage is hidden from assistive technology (the dated chips below it are
    // the control), so this is a pointer convenience only.
    const sheets = SCANS.map((scan, i) => {
      const s = document.createElement('div'); s.className = 'sheet';
      s.addEventListener('click', () => { if (i !== current) select(i); });
      stage.append(s); return s;
    });
    const buttons = SCANS.map((scan, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = scan.date; b.id = 'week-' + i;
      b.addEventListener('click', () => select(i)); chips.append(b); return b;
    });
    const inspect = document.createElement('a'); inspect.className = 'chip inspect'; inspect.textContent = 'Inspect this scan'; chips.append(inspect);
    // One mark per post, eight to a row in feed order. The geometry (mark
    // size and pitch) is CSS on .stage, so it follows the sheet's size.
    function marks(sheet, scan) {
      sheet.replaceChildren();
      const grid = document.createElement('span'); grid.className = 'marks';
      for (let p = 1; p <= scan.n; p++) {
        const i = document.createElement('i');
        if (scan.ads.includes(p)) i.className = 'ad'; else if (scan.unknown.includes(p)) i.className = 'un';
        grid.append(i);
      }
      const foot = document.createElement('span'); foot.className = 'foot';
      const d = document.createElement('span'); d.textContent = scan.date;
      const c = document.createElement('span'); c.textContent = scan.n + ' posts';
      foot.append(d, c); sheet.append(grid, foot);
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
      inspect.href = '/explore/#record';
      const s = SCANS[i];
      // The caption is a live region: write only when the words change, so
      // loading the page does not announce the sheet it already shows.
      const say = (id, text) => { const el = $(id); if (el.textContent !== text) el.textContent = text; };
      say('recordTitle', s.date + ', held on record.');
      say('recordFacts', s.n + ' posts in this scan. ' + s.ads.length + ' carried a printed ad label. ' + total + ' posts across ' + SCANS.length + ' scans.');
    }
    select(current);
  }

  // The record forming: four fictional posts, observable facts only.
  const POSTS = {
    1: { account: '@harbor.coffee', kind: 'ad', facts: [['Ad label', 'Printed: Sponsored'], ['Origin', 'No label read'], ['Account', '@harbor.coffee'], ['Position', '1 of 4']], chip: 'ad label', extra: 'Why it was shown: unknown.' },
    2: { account: '@city.notes', kind: 'mine', facts: [['Ad label', 'None printed'], ['Origin', 'Following, as labeled'], ['Account', '@city.notes'], ['Position', '2 of 4']], chip: 'following', extra: 'A headline was on screen. Whether it is political is an inference, not a fact.' },
    3: { account: '@wildpath.journal', kind: 'plain', facts: [['Ad label', 'None printed'], ['Origin', 'Suggested, as labeled'], ['Account', '@wildpath.journal'], ['Position', '3 of 4']], chip: 'suggested', extra: 'Suggested. Which action led here: unknown.' },
    4: { account: '@harbor.coffee', kind: 'mine', facts: [['Ad label', 'None printed'], ['Origin', 'Following, as labeled'], ['Account', '@harbor.coffee, also at post 1'], ['Position', '4 of 4']], chip: 'repeat account', extra: 'The same account returns. A repeat in four posts, not a pattern.' },
  };
  // Each post has a slot beneath it (#slot-1 to #slot-4). An unread slot
  // holds a blank form (static markup: the four fields, no values); reading
  // the post replaces it with the entry, so the record forms beside the post
  // it came from. A slot is only rebuilt when its own post changes.
  const feed = $('tapFeed');
  if (feed) {
    const read = new Set();
    const blanks = new Map();
    const buttons = Array.from(feed.querySelectorAll('.read[data-read]'));
    function entry(n) {
      const p = POSTS[n];
      const row = document.createElement('div'); row.className = 'row';
      const head = document.createElement('div'); head.className = 'row-head';
      const dot = document.createElement('i'); if (p.kind !== 'plain') dot.className = p.kind;
      const title = document.createElement('span'); title.textContent = 'Post ' + n + '. ' + p.account;
      const em = document.createElement('em'); em.textContent = p.facts.length + ' facts read';
      head.append(dot, title, em);
      const grid = document.createElement('div'); grid.className = 'row-grid';
      p.facts.forEach(([k, v]) => { const cell = document.createElement('div'); const s = document.createElement('small'); s.textContent = k; const val = document.createElement('span'); val.textContent = v; cell.append(s, val); grid.append(cell); });
      const extra = document.createElement('p'); extra.className = 'extra'; extra.textContent = p.extra;
      row.append(head, grid, extra);
      return row;
    }
    function draw() {
      const order = buttons.map((b) => Number(b.dataset.read)).filter((n) => read.has(n));
      buttons.forEach((b) => {
        const n = Number(b.dataset.read);
        const on = read.has(n);
        const slot = $('slot-' + n);
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? 'In record' : 'Read';
        if (slot) {
          // Keep the blank form the page shipped with, so "Start over" can put it back.
          if (!blanks.has(n)) blanks.set(n, slot.firstElementChild);
          const filled = slot.classList.contains('filled');
          if (on && !filled) slot.replaceChildren(entry(n));
          if (!on && filled) { const blank = blanks.get(n); if (blank) slot.replaceChildren(blank); else slot.replaceChildren(); }
          slot.classList.toggle('filled', on);
        }
      });
      const chips = $('tunedChips');
      chips.replaceChildren();
      order.forEach((n) => { const chip = document.createElement('b'); chip.textContent = POSTS[n].chip; chips.append(chip); });
      $('tuned').hidden = order.length === 0;
      $('readCount').textContent = order.length + ' of 4 posts';
      $('readBar').style.width = (order.length / 4) * 100 + '%';
      $('readEmpty').hidden = order.length > 0;
      $('readFoot').hidden = order.length === 0;
      $('readNote').textContent = order.length === 4 ? 'Four posts read. Why any of them appeared: still unknown.' : order.length + ' of 4 posts read. The record grows only with what is on screen.';
    }
    buttons.forEach((b) => b.addEventListener('click', () => { const n = Number(b.dataset.read); if (read.has(n)) read.delete(n); else read.add(n); draw(); }));
    $('readReset').addEventListener('click', () => { read.clear(); draw(); });
    draw();
  }

  // Three steps: click to select; advances every five seconds while the
  // steps are on screen, unless the visitor asked for reduced motion, is
  // hovering or has focus inside. The three previews share one grid cell
  // (CSS), so the panel keeps the height of the tallest and nothing below
  // it moves when the step changes.
  const steps = $('steps');
  if (steps) {
    const buttons = Array.from(steps.querySelectorAll('.step'));
    const previews = Array.from(document.querySelectorAll('.preview'));
    const canWatch = 'IntersectionObserver' in window;
    let current = 1, timer = null, held = false, visible = !canWatch, paused = false;
    function show(n) {
      current = n;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.step) === n)));
      previews.forEach((p) => { p.hidden = Number(p.dataset.preview) !== n; });
    }
    function tick() { if (!held && !document.hidden) show((current % 3) + 1); }
    function start() { stop(); if (!reduced.matches && !paused) timer = setInterval(tick, 5000); }
    function stop() { if (timer) clearInterval(timer); timer = null; }
    buttons.forEach((b) => b.addEventListener('click', () => { show(Number(b.dataset.step)); start(); }));
    const box = steps.closest('.how-grid') || steps.parentElement;
    box.addEventListener('mouseenter', () => { held = true; });
    box.addEventListener('mouseleave', () => { held = false; });
    box.addEventListener('focusin', () => { held = true; });
    box.addEventListener('focusout', () => { held = false; });
    reduced.addEventListener('change', () => { if (visible) start(); else stop(); });
    // A control to stop the steps advancing on their own, and to start them
    // again. It is hidden when nothing advances (reduced motion).
    const pause = $('stepsPause');
    if (pause) {
      const sync = () => { pause.hidden = reduced.matches; pause.textContent = paused ? 'Play the steps' : 'Pause the steps'; };
      pause.addEventListener('click', () => { paused = !paused; sync(); if (paused) stop(); else if (visible) start(); });
      reduced.addEventListener('change', sync);
      sync();
    }
    show(1);
    if (canWatch) {
      new IntersectionObserver((entries) => {
        visible = entries[entries.length - 1].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0.2 }).observe(box);
    } else {
      start();
    }
  }
})();

// The beta call to action. The markup ships beta-first: the hero's primary
// button (#betaButton) and the header pill (#betaPill) are labelled for the
// beta and this block points them at BETA_LINK (top of this file), or at
// TIKTOK_BETA_LINK on /tt/. The launch list stays on the page, framed for
// people who cannot install yet. While the chosen link holds no https URL
// the page falls back to the launch-list call to action it carried before
// the beta: both links go to #launch and the hero note and launch section
// take back their pre-beta wording.
(function () {
  'use strict';
  const chosen = BETA_GROUP === 'tiktok' && TIKTOK_BETA_LINK ? TIKTOK_BETA_LINK : BETA_LINK;
  let href = null;
  try {
    const u = new URL(chosen);
    if (u.protocol === 'https:') href = u.href;
  } catch { href = null; }
  const button = document.getElementById('betaButton');
  const pill = document.getElementById('betaPill');
  if (href) {
    if (button) button.href = href;
    if (pill) pill.href = href;
    return;
  }
  const FALLBACK = {
    betaButton: 'Join the launch list',
    betaPill: 'Join the launch list',
    heroNote: 'A free iPhone app. Example data on this page, except the one real scan marked as such.',
    launchHeading: 'Curious what yours would show?',
    launchLede: 'One email when the app is out. Nothing else.',
  };
  Object.keys(FALLBACK).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = FALLBACK[id];
  });
  [button, pill].forEach((a) => { if (a) { a.href = '#launch'; a.removeAttribute('rel'); } });
})();
