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
