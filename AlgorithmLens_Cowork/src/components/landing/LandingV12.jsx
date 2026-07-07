import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './landingV12.css';

/*
 * LandingV12 — faithful port of the approved "AlgorithmLens Landing v12"
 * Claude Design export. One responsive page (1440 desktop frame as the base,
 * 390 mobile frame reconciled via landingV12.css breakpoints). The Claude
 * Design runtime, data-dc-* tooling attributes, and print/omelette shim were
 * all stripped; the interactive behaviour that the export drove through its
 * DCLogic component is reimplemented here with React state.
 *
 * Behaviours preserved:
 *  1. Hero "Scanning your feed" auto-scroll marquee + live posts counter +
 *     54% Live tally bar.
 *  2. Interactive feedback-loop phone: tap play / Follow / heart / Shop to
 *     register four signals, with the "profile forming" readout + tap-ring.
 *  3. "Three steps" walkthrough: click-to-select AND 3.8s auto-advance, with
 *     the right-hand preview keyed to the active step.
 *  4. "Algorithms infer hidden labels" dual marquees with edge-fade masks.
 *  5. data-reveal scroll reveal via IntersectionObserver.
 *  6. alGrow / alPulse / alNudgeX / alTapRing / alShim keyframes in place.
 */

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
const APPLE_PATH =
  'M16.3 13.8c0-2.7 2.2-4 2.3-4.1-1.3-1.8-3.2-2.1-3.9-2.1-1.7-.2-3.2.9-4 .9-.8 0-2.1-.9-3.5-.9-1.8 0-3.4 1-4.3 2.6-1.9 3.2-.5 8 1.3 10.6.9 1.3 1.9 2.7 3.1 2.6 1.3-.05 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.3 3-2.6.9-1.5 1.3-2.9 1.3-3-.1 0-2.5-1-2.5-3.9zM13.7 5.8c.7-.8 1.2-2 1-3.3-1 .05-2.3.7-3 1.6-.7.7-1.2 1.9-1.1 3.1 1.1.1 2.3-.6 3.1-1.4z';

function AppleGlyph({ w = 18, h = 22 }) {
  return (
    <svg width={w} height={h} viewBox="0 0 22 26" fill="#FFFFFF" aria-hidden="true">
      <path d={APPLE_PATH} />
    </svg>
  );
}

/* Black "Download on the App Store" button used across the page. */
function AppStoreButton({ style, className, glyph = { w: 18, h: 22 }, subSize = 20 }) {
  return (
    <button
      type="button"
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 12,
        background: '#0A0A0A', color: '#fff', border: 'none',
        borderRadius: 13, padding: '11px 24px', cursor: 'pointer', ...style,
      }}
    >
      <AppleGlyph w={glyph.w} h={glyph.h} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
        <span style={{ font: `400 11px/1.4 ${FONT}`, letterSpacing: '0.02em', opacity: 0.85 }}>Download on the</span>
        <span style={{ font: `600 ${subSize}px/1.1 ${FONT}`, letterSpacing: '-0.01em' }}>App Store</span>
      </span>
    </button>
  );
}

const ArrowMini = () => (
  <svg width="16" height="10" viewBox="0 0 18 12" fill="none" aria-hidden="true">
    <path d="M1 6h14m0 0l-4-4m4 4l-4 4" stroke="#A0A0A5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ---- Hero scanning feed rows ---- */
const SCAN_ROWS = [
  { platform: 'YouTube', color: '#FF0000', action: 'watched to the end', reads: 'fitness', time: 'just now' },
  { platform: 'Instagram', color: '#E4405F', action: 'followed the account', reads: 'cooking', time: 'moments ago' },
  { platform: 'TikTok', color: '#0A0A0A', action: 'rewatched twice', reads: 'comedy', time: 'moments ago' },
  { platform: 'X', color: '#0A0A0A', action: 'liked a reply', reads: 'local politics', time: 'a minute ago' },
  { platform: 'Reddit', color: '#FF4500', action: 'opened comments', reads: 'PC building', time: '2 min ago' },
];

function ScanRow({ row }) {
  const chipBlue = {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(24,104,216,0.1)',
    color: '#1868D8', borderRadius: 999, padding: '5px 11px', font: `600 12px/1 ${FONT}`,
  };
  const chipGreen = {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(32,168,136,0.12)',
    color: '#20A888', borderRadius: 999, padding: '5px 11px', font: `600 12px/1 ${FONT}`,
  };
  return (
    <div style={{ padding: '6px 18px' }}>
      <div style={{
        background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '14px 16px',
        boxShadow: '0 1px 2px rgba(16,24,40,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
          <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 7, background: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.92)' }} />
          </span>
          <span style={{ font: `600 13px/1 ${FONT}`, color: '#0A0A0A' }}>{row.platform}</span>
          <span style={{ marginLeft: 'auto', font: `400 11px/1 ${FONT}`, color: '#A0A0A5' }}>{row.time}</span>
        </div>
        <div className="al-skel" style={{ height: 9, borderRadius: 4, width: '94%', marginBottom: 6 }} />
        <div className="al-skel" style={{ height: 9, borderRadius: 4, width: '58%', marginBottom: 13 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <span style={chipBlue}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1868D8' }} />{row.action}</span>
          <ArrowMini />
          <span style={chipGreen}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#20A888' }} />reads as: {row.reads}</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Report tab data ---- */
const REPORT_TABS = ['Overview', 'Sources', 'Ads', 'Politics', 'Tone', 'Suggested vs. Followed'];
const REPORT_METRICS = [
  ['Posts analyzed', '4,182'], ['Accounts seen', '312'], ['Ads shown', '97'], ['Days covered', '30'],
];
const INTEREST_BARS = [
  ['Home fitness', 28], ['City politics', 19], ['Cooking', 14], ['Standup comedy', 9], ['Sneaker resale', 7],
];
const AD_CATS = [['Fitness apparel', 14], ['Meal kits', 9], ['Streaming', 7], ['Local politics', 4], ['Travel', 3]];

/* ---- Labels marquee chips ---- */
const LABELS = [
  'Ad Receptive', 'Deal Seeker', 'Left-Leaning', 'Politically Engaged', 'Climate Conscious',
  'Wellness Curious', 'Social Justice', 'Frequent Traveler', 'Urban Progressive', 'Brand Loyal',
  'High Anxiety', 'Easily Nudged', 'Validation Seeking', 'Sports Fan', 'Impulse Buyer',
  'New Parent', 'News Avoider', 'Early Adopter', 'Night Owl', 'Homebody',
];
// Two offset orderings so the stacked marquee rows never line up.
const LABEL_ROWS = [
  LABELS,
  [...LABELS.slice(10), ...LABELS.slice(0, 10)],
];
const LABEL_MASK = 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)';

/* ---- Feedback-loop signals (active-state copy reconstructed to match the
   four sample feed items; the export only captured the untapped state).
   Each tap resolves into several inferred attributes to show how much a
   single interaction can feed, all hedged as illustrative reads. ---- */
const SIGNALS = [
  {
    key: 'watched', dot: '#1868D8', action: 'Watched a 3:00 video to the end', short: 'housing stress',
    tags: [['Topic', 'housing costs'], ['Could read as', 'financial anxiety'], ['Ad audience', 'renters, personal finance'], ['Signal strength', 'strong · finished it']],
  },
  {
    key: 'followed', dot: '#20A888', action: 'Followed a local news account', short: 'city politics',
    tags: [['Interest', 'city politics'], ['Could read as', 'civically engaged'], ['Ad audience', 'news, local services'], ['Signal strength', 'lasting · a follow']],
  },
  {
    key: 'liked', dot: '#E4405F', action: 'Liked an outrage post', short: 'political anger',
    tags: [['Trigger', 'political anger'], ['Topic', 'municipal spending'], ['Could read as', 'reacts to conflict'], ['Ad audience', 'high-arousal news']],
  },
  {
    key: 'tappedAd', dot: '#0A0A0A', action: 'Tapped a shopping ad', short: 'running gear',
    tags: [['Purchase intent', 'running gear'], ['Price band', '$100 to $150'], ['Category', 'fitness apparel'], ['Ad audience', 'ready to buy']],
  },
];

/* ---- "Three steps" walkthrough ---- */
const HOW_STEPS = [
  { n: '01', title: 'Start a scan', body: 'Point AlgorithmLens at a feed and it reads what actually appeared.' },
  { n: '02', title: 'We find patterns', body: 'Sources, ads, tone, and suggested-vs-followed, measured from what you saw.' },
  { n: '03', title: 'You get the picture', body: 'A plain-language dashboard, every metric explained and linked to the method.' },
];

export default function LandingV12() {
  const rootRef = useRef(null);

  // Hero live posts counter (DCLogic: start 1247, +1..3 every 1200ms)
  const [posts, setPosts] = useState(1247);
  // Walkthrough active step (0..2), auto-advances every 3800ms
  const [howStep, setHowStep] = useState(0);
  // Feedback-loop signals
  const [signals, setSignals] = useState({ watched: false, followed: false, liked: false, tappedAd: false });

  const howTimer = useRef(null);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Posts counter
  useEffect(() => {
    if (prefersReduced.current) return undefined;
    const id = setInterval(() => {
      setPosts((p) => p + 1 + Math.floor(Math.random() * 3));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  // Walkthrough auto-advance (restartable)
  const restartHow = useCallback(() => {
    if (howTimer.current) clearInterval(howTimer.current);
    if (prefersReduced.current) return;
    howTimer.current = setInterval(() => setHowStep((s) => (s + 1) % 3), 3800);
  }, []);
  useEffect(() => {
    restartHow();
    return () => { if (howTimer.current) clearInterval(howTimer.current); };
  }, [restartHow]);
  const selectHow = (i) => { setHowStep(i); restartHow(); };

  // Scroll reveal
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    if (prefersReduced.current || !('IntersectionObserver' in window)) return undefined;
    root.classList.add('al-js');
    const els = root.querySelectorAll('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('al-revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggle = (key) => setSignals((s) => ({ ...s, [key]: !s[key] }));
  const resetLoop = () => setSignals({ watched: false, followed: false, liked: false, tappedAd: false });

  const inferCount = SIGNALS.reduce((n, s) => n + (signals[s.key] ? 1 : 0), 0);
  const inferPct = (inferCount / 4) * 100;
  const activeSignals = SIGNALS.filter((s) => signals[s.key]);
  const postCount = posts.toLocaleString('en-US');

  // Shared styles
  const sampleChip = {
    display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,204,0,0.16)',
    border: '1px solid rgba(255,204,0,0.5)', borderRadius: 999, padding: '5px 10px', color: '#0A0A0A',
    font: `500 12px/1 ${FONT}`,
  };
  const h2Big = {
    margin: '0 0 14px', fontSize: 53, lineHeight: 1.03, fontWeight: 740,
    letterSpacing: '-0.028em', color: '#0A0A0A', textWrap: 'balance',
  };
  const leadP = { margin: 0, fontSize: 20, lineHeight: '30px', color: '#6B6B70', textWrap: 'pretty' };
  const sectionBand = 'linear-gradient(transparent 0%, #F7F7F8 11%, #F7F7F8 89%, transparent 100%)';

  return (
    <div className="alv12" ref={rootRef}>
      {/* ============================ NAV ============================ */}
      <nav
        className="al-nav"
        style={{
          display: 'flex', alignItems: 'center', gap: 32, height: 68, padding: '0 130px',
          borderBottom: '1px solid #E5E5EA', background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
          position: 'sticky', top: 0, zIndex: 20,
        }}
      >
        <img src="/algorithmlens-wordmark.svg" alt="AlgorithmLens" style={{ height: 38, display: 'block' }} />
        <div className="al-nav-links al-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: 30, marginLeft: 'auto' }}>
          <a className="al-navlink" href="#how-it-works" style={{ color: '#0A0A0A' }}>How it works</a>
          <a className="al-navlink" href="#report" style={{ color: '#0A0A0A' }}>The report</a>
          <a className="al-navlink" href="#privacy" style={{ color: '#0A0A0A' }}>Privacy</a>
          <Link className="al-navlink" to="/methodology" style={{ color: '#0A0A0A' }}>Methodology</Link>
          <span aria-hidden="true" style={{ width: 1, height: 22, background: '#E5E5EA' }} />
          <Link to="/dashboard" style={{ color: '#6B6B70' }}>Sign in</Link>
          <button
            type="button"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, background: '#0A0A0A', color: '#fff',
              border: 'none', borderRadius: 999, padding: '9px 16px', cursor: 'pointer', font: `600 14px/1 ${FONT}`,
            }}
          >
            <AppleGlyph w={14} h={17} />Get the app
          </button>
        </div>
        <button
          type="button"
          className="al-nav-cta al-mobile-only"
          style={{
            display: 'none', alignItems: 'center', gap: 6, background: '#0A0A0A', color: '#fff',
            border: 'none', borderRadius: 999, padding: '8px 14px', cursor: 'pointer', font: `600 13px/1 ${FONT}`,
          }}
        >
          <AppleGlyph w={14} h={17} />Get the app
        </button>
      </nav>

      {/* ============================ HERO ============================ */}
      <header className="al-hero" style={{ position: 'relative', padding: '72px 56px 88px', background: 'transparent' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(#E5E5EA 1px, transparent 1px)', backgroundSize: '26px 26px',
          maskImage: 'linear-gradient(rgba(0,0,0,0.5), transparent 62%)',
          WebkitMaskImage: 'linear-gradient(rgba(0,0,0,0.5), transparent 62%)', pointerEvents: 'none',
        }} />
        <div className="al-hero-grid" style={{
          position: 'relative', display: 'grid', gridTemplateColumns: '1fr 560px', gap: 56,
          alignItems: 'center', maxWidth: 1180, margin: '0 auto',
        }}>
          {/* Left column */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'rgba(32,168,136,0.12)', borderRadius: 999, padding: '9px 16px 9px 14px', marginBottom: 24 }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#20A888' }} />
              <span style={{ letterSpacing: '0.01em', color: '#0A0A0A' }}>Built at MIT</span>
            </div>
            <h1 className="al-hero-h1" style={{ margin: '0 0 22px', fontSize: 76, lineHeight: 0.95, fontWeight: 800, letterSpacing: '-0.042em', color: '#0A0A0A', textWrap: 'balance' }}>
              See how the <span style={{ color: '#1868D8' }}>algorithms</span>{' '}
              <span style={{ position: 'relative', whiteSpace: 'nowrap', color: '#20A888' }}>see you</span>
            </h1>
            <p className="al-hero-sub" style={{ margin: '0 0 32px', fontSize: 21, lineHeight: '32px', color: '#6B6B70', maxWidth: 500, textWrap: 'pretty' }}>
              Scan a feed. Get a clear report: what's filling it, who it's from, and what's an ad.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <AppStoreButton className="al-hero-cta" style={{ padding: '11px 24px' }} />
            </div>
            <div style={{ marginTop: 26 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <span style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%', background: 'rgba(32,168,136,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="#20A888" strokeWidth="1.8" />
                    <path d="M12 7v5l3 2" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{ display: 'block', maxWidth: 320, fontSize: 20, lineHeight: '27px', color: '#0A0A0A', letterSpacing: '-0.015em' }}>
                  <strong style={{ fontWeight: 700 }}>Two minutes a week</strong> is the whole commitment.
                </span>
              </div>
              <div style={{ color: '#A0A0A5', marginTop: 16 }}>Free · iPhone · works with YouTube, Instagram, TikTok, X, and Reddit.</div>
            </div>
          </div>

          {/* Right column — scanning panel */}
          <div className="al-card" style={{ borderRadius: 22, border: '1px solid #E5E5EA', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(16,24,40,0.06), 0 40px 80px rgba(16,24,40,0.30)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '16px 20px', borderBottom: '1px solid #E5E5EA' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span data-pulse="true" aria-hidden="true" style={{ flex: '0 0 auto', width: 9, height: 9, borderRadius: '50%', background: '#20A888', boxShadow: '0 0 0 4px rgba(32,168,136,0.16)' }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ color: '#0A0A0A' }}>Scanning your feed</span>
                  <span style={{ color: '#6B6B70', fontVariantNumeric: 'tabular-nums' }}>{postCount} posts scanned</span>
                </span>
              </span>
              <span style={sampleChip}>Sample data</span>
            </div>
            <div role="img" aria-label="A feed being scanned: each post paired with what platforms could infer from it" style={{ position: 'relative', height: 452, overflow: 'hidden' }}>
              <div data-scan="true" aria-hidden="true" style={{ position: 'absolute', zIndex: 3, left: 0, right: 0, top: 0, height: 66, background: 'rgba(24,104,216,0.06)', borderTop: '1.5px solid rgba(24,104,216,0.5)', pointerEvents: 'none' }} />
              <div aria-hidden="true" style={{ position: 'absolute', zIndex: 4, top: 0, left: 0, right: 0, height: 26, background: 'linear-gradient(#fff, transparent)', pointerEvents: 'none' }} />
              <div aria-hidden="true" style={{ position: 'absolute', zIndex: 4, bottom: 56, left: 0, right: 0, height: 30, background: 'linear-gradient(0deg, #fff, transparent)', pointerEvents: 'none' }} />
              <div data-marquee="true" style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
                {SCAN_ROWS.map((r, i) => <ScanRow key={`a${i}`} row={r} />)}
                {SCAN_ROWS.map((r, i) => <ScanRow key={`b${i}`} row={r} />)}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderTop: '1px solid #E5E5EA', background: '#F7F7F8' }}>
              <span style={{ color: '#6B6B70' }}>Live tally</span>
              <div style={{ flex: '1 1 0', display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', background: '#fff', border: '1px solid #E5E5EA' }}>
                <div style={{ width: '54%', background: '#20A888' }} />
                <div style={{ width: '46%', background: '#1868D8' }} />
              </div>
              <span style={{ color: '#20A888' }}>54% suggested</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================ THE REPORT ============================ */}
      <div id="report" className="al-section" style={{ background: sectionBand, padding: '104px 56px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <h2 className="al-report-h2" data-reveal style={{ margin: 0, fontSize: 46, lineHeight: 1.04, fontWeight: 740, letterSpacing: '-0.026em', color: '#0A0A0A', whiteSpace: 'nowrap' }}>
              One scan. One plain-language report.
            </h2>
          </div>
          <div data-reveal className="al-card" style={{ borderRadius: 18, border: '1px solid #E5E5EA', background: '#fff', overflow: 'hidden', boxShadow: '0 2px 8px rgba(16,24,40,0.06), 0 40px 80px rgba(16,24,40,0.30)' }}>
            {/* browser chrome */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 46, padding: '0 18px', background: '#F7F7F8', borderBottom: '1px solid #E5E5EA' }}>
              <div aria-hidden="true" style={{ display: 'flex', gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F57' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#FEBC2E' }} />
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28C840' }} />
              </div>
              <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E5E5EA', borderRadius: 8, padding: '5px 14px', color: '#6B6B70' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" stroke="#20A888" strokeWidth="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" stroke="#20A888" strokeWidth="2" />
                  </svg>
                  app.algorithmlens.com/dashboard
                </span>
              </div>
              <span aria-hidden="true" style={{ width: 52 }} />
            </div>
            <div style={{ padding: '24px 28px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
                <div style={{ flex: '1 1 0' }}>
                  <div style={{ fontSize: 24, lineHeight: '30px', fontWeight: 700, letterSpacing: '-0.015em' }}>Overview</div>
                  <div style={{ color: '#6B6B70', marginTop: 3 }}>Instagram · 30-day scan</div>
                </div>
                <span style={sampleChip}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="#0A0A0A" strokeWidth="2" />
                    <path d="M12 8v5" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="16.5" r="1.2" fill="#0A0A0A" />
                  </svg>
                  Sample data
                </span>
                <button type="button" style={{ background: '#1868D8', color: '#fff', border: 'none', borderRadius: 999, padding: '10px 16px', font: `600 13px/1 ${FONT}`, cursor: 'pointer' }}>New scan</button>
              </div>
              <div role="tablist" aria-label="Dashboard views" style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #E5E5EA', marginBottom: 20 }}>
                {REPORT_TABS.map((t, i) => (
                  <span key={t} role="tab" aria-selected={i === 0} style={{ padding: '10px 3px', marginRight: 22, color: i === 0 ? '#1868D8' : '#6B6B70', borderBottom: i === 0 ? '2px solid #1868D8' : undefined }}>{t}</span>
                ))}
              </div>
              <div className="al-report-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                {REPORT_METRICS.map(([label, val]) => (
                  <div key={label} style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '16px 18px' }}>
                    <div style={{ color: '#6B6B70', marginBottom: 8 }}>{label}</div>
                    <div style={{ color: '#1868D8', fontSize: 26, lineHeight: 1, fontWeight: 720, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="al-report-charts" style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: 12 }}>
                {/* Top inferred interests */}
                <div style={{ gridRow: '1 / 3', background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#20A888' }} />
                    <span>Top inferred interests</span>
                  </div>
                  <div style={{ color: '#A0A0A5', marginBottom: 16 }}>Illustrative examples — not your data</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {INTEREST_BARS.map(([label, pct]) => (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span>{label}</span>
                          <span style={{ color: '#6B6B70', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 7, borderRadius: 4, background: '#F0F0F2' }}>
                          <div data-grow="true" style={{ width: `${pct}%`, height: 7, borderRadius: 4, background: '#20A888' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 16 }}><Link to="/methodology">How labels are inferred →</Link></div>
                </div>
                {/* Suggested vs Followed */}
                <div style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ marginBottom: 4 }}>Suggested vs. Followed</div>
                  <div style={{ color: '#A0A0A5', marginBottom: 14 }}>Share of posts in the sample feed</div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 13 }}>
                    <div data-grow="true" style={{ width: '46%', background: '#1868D8' }} />
                    <div style={{ width: '54%', background: '#20A888' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#1868D8' }} />Accounts you follow<span style={{ marginLeft: 'auto', color: '#6B6B70', fontVariantNumeric: 'tabular-nums' }}>46%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#20A888' }} />Suggested for you<span style={{ marginLeft: 'auto', color: '#6B6B70', fontVariantNumeric: 'tabular-nums' }}>54%</span></div>
                  </div>
                </div>
                {/* Tone */}
                <div style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ marginBottom: 4 }}>Tone of what appeared</div>
                  <div style={{ color: '#A0A0A5', marginBottom: 14 }}>Sample classification</div>
                  <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 13 }}>
                    <div style={{ width: '58%', background: '#C7C7CC' }} />
                    <div style={{ width: '23%', background: '#FFCC00' }} />
                    <div style={{ width: '19%', background: '#20A888' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#C7C7CC' }} />Neutral<span style={{ marginLeft: 'auto', color: '#6B6B70' }}>58%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFCC00' }} />Emotionally charged<span style={{ marginLeft: 'auto', color: '#6B6B70' }}>23%</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: '#20A888' }} />Upbeat<span style={{ marginLeft: 'auto', color: '#6B6B70' }}>19%</span></div>
                  </div>
                </div>
                {/* Ad categories */}
                <div style={{ gridColumn: '2 / 4', background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '18px 20px' }}>
                  <div style={{ marginBottom: 4 }}>Ad categories shown</div>
                  <div style={{ color: '#A0A0A5', marginBottom: 14 }}>Sample counts over 30 days</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {AD_CATS.map(([label, n]) => (
                      <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #E5E5EA', borderRadius: 999, padding: '8px 13px', background: '#fff' }}>
                        <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px dashed #A0A0A5', boxSizing: 'border-box' }} />
                        {label} <span style={{ color: '#6B6B70', fontVariantNumeric: 'tabular-nums' }}>· {n}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ color: '#A0A0A5', marginTop: 14, textAlign: 'center' }}>All numbers shown are sample data, for illustration.</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================ FEEDBACK LOOP ============================ */}
      <div className="al-section" style={{ background: 'transparent', padding: '104px 56px' }}>
        <div className="al-loop-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 data-reveal style={{ ...h2Big, margin: '0 0 14px' }}>
              You're one half of a{' '}
              <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
                feedback loop.
                <svg viewBox="0 0 160 10" preserveAspectRatio="none" aria-hidden="true" style={{ position: 'absolute', left: '1%', bottom: '-0.14em', width: '98%', height: '0.12em' }}>
                  <path d="M2 7 Q 30 2, 62 6 T 120 6 T 158 5" fill="none" stroke="#20A888" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p data-reveal style={{ ...leadP, maxWidth: 500 }}>
              Tap the video, follow, like, and ad in this sample feed, and watch a platform turn four taps into a profile.
            </p>
            <div data-reveal className="al-try" style={{ marginTop: 22, marginBottom: 2 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#1868D8', borderRadius: 999, padding: '11px 16px 11px 20px' }}>
                <span style={{ font: `700 15px/1 ${FONT}`, color: '#fff', letterSpacing: '0.01em' }}>Try it yourself</span>
                <span data-nudge-x="true" style={{ display: 'inline-flex', width: 30, height: 30, borderRadius: '50%', background: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13m0 0l-5-5m5 5l-5 5" stroke="#1868D8" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </div>
            </div>

            {/* Profile-forming readout */}
            <div style={{ marginTop: 18, background: '#F7F7F8', border: '1px solid #E5E5EA', borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ letterSpacing: '0.05em', color: '#6B6B70' }}>The profile forming</span>
                <span style={{ color: '#1868D8', fontVariantNumeric: 'tabular-nums' }}>{inferCount} of 4 signals</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: '#E9E9EC', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ height: 6, borderRadius: 3, background: '#1868D8', width: `${inferPct}%`, transition: 'width 0.45s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
              {inferCount === 0 ? (
                <div style={{ color: '#8E8E93', padding: '4px 0 6px' }}>Nothing yet. Tap the play, Follow, heart, or Shop button in the phone to start.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeSignals.map((s) => (
                    <div data-pop="true" key={s.key} style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 14, padding: '13px 15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 11 }}>
                        <span aria-hidden="true" style={{ flex: '0 0 auto', width: 9, height: 9, borderRadius: '50%', background: s.dot }} />
                        <span style={{ font: `600 14px/1.2 ${FONT}`, color: '#0A0A0A', letterSpacing: '-0.01em' }}>{s.action}</span>
                        <span style={{ marginLeft: 'auto', flex: '0 0 auto', font: `600 11px/1 ${FONT}`, color: '#1868D8', background: 'rgba(24,104,216,0.1)', borderRadius: 999, padding: '4px 9px' }}>+{s.tags.length} inferred</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {s.tags.map(([k, v]) => (
                          <div key={k} style={{ background: '#F7F7F8', borderRadius: 9, padding: '8px 11px', minWidth: 0 }}>
                            <div style={{ font: `500 10.5px/1.3 ${FONT}`, letterSpacing: '0.02em', color: '#8E8E93', marginBottom: 3 }}>{k}</div>
                            <div style={{ font: `600 12.5px/1.35 ${FONT}`, color: '#0A0A0A' }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 2 }}>
                    <span style={{ font: `400 12px/1.4 ${FONT}`, color: '#8E8E93' }}>
                      {inferCount === 4 ? 'Four taps, sixteen inferred attributes.' : `${inferCount * 4} inferred attributes so far.`}
                    </span>
                    <button type="button" onClick={resetLoop} style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 0, color: '#6B6B70', font: `500 13px/1 ${FONT}`, cursor: 'pointer' }}>
                      Start over
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p style={{ margin: '16px 0 0', fontSize: 13, lineHeight: '19px', color: '#6B6B70', maxWidth: 500 }}>
              Illustrative. We show patterns in what you saw; we can't see platforms' internal models, and we say so in the <Link to="/methodology">methodology</Link>.
            </p>
          </div>

          {/* Phone */}
          <div data-reveal>
            <div className="al-phone" style={{ justifySelf: 'center', width: 300, background: '#0A0A0A', borderRadius: 44, padding: 7, boxShadow: '0 2px 8px rgba(16,24,40,0.06), 0 40px 80px rgba(16,24,40,0.38)' }}>
              <div style={{ position: 'relative', background: '#fff', borderRadius: 39, overflow: 'hidden' }}>
                {/* status bar */}
                <div style={{ position: 'relative', padding: '12px 22px 8px' }}>
                  <div style={{ position: 'absolute', top: 9, left: '50%', transform: 'translateX(-50%)', width: 86, height: 24, borderRadius: 13, background: '#0A0A0A' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>9:41</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="17" height="11" viewBox="0 0 17 11" fill="#0A0A0A" aria-hidden="true"><rect x="0" y="7.5" width="2.6" height="3.5" rx="0.8" /><rect x="4.6" y="5" width="2.6" height="6" rx="0.8" /><rect x="9.2" y="2.5" width="2.6" height="8.5" rx="0.8" /><rect x="13.8" y="0" width="2.6" height="11" rx="0.8" /></svg>
                      <svg width="16" height="11" viewBox="0 0 18 13" fill="none" aria-hidden="true"><path d="M9 11.5l1.9-2.3a2.9 2.9 0 00-3.8 0L9 11.5z" fill="#0A0A0A" /><path d="M4 6.4a7.5 7.5 0 0110 0M6.2 8.7a4.2 4.2 0 015.6 0" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" /></svg>
                      <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden="true"><rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke="#0A0A0A" opacity="0.35" /><rect x="2" y="2" width="16" height="8" rx="1.8" fill="#0A0A0A" /><rect x="21.6" y="4" width="1.8" height="4" rx="0.9" fill="#0A0A0A" opacity="0.35" /></svg>
                    </span>
                  </div>
                </div>
                {/* For you header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px 12px' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: '#1868D8' }} />
                  <span style={{ letterSpacing: '-0.02em', color: '#0A0A0A' }}>For you</span>
                  <span data-pulse="true" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.04em', color: '#20A888', background: 'rgba(32,168,136,0.12)', border: '1px solid rgba(32,168,136,0.4)', padding: '5px 10px', borderRadius: 999 }}>Live · try it</span>
                </div>
                {/* Feed-tuned strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderTop: '1px solid #F2F2F4', borderBottom: '1px solid #F2F2F4', background: '#FBFBFC' }}>
                  <span style={{ letterSpacing: '0.01em', color: '#A0A0A5', whiteSpace: 'nowrap' }}>Feed tuned to</span>
                  {activeSignals.length === 0 ? (
                    <span style={{ color: '#C2C2C7' }}>building your profile…</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflow: 'hidden' }}>
                      {activeSignals.map((s) => (
                        <span key={s.key} style={{ whiteSpace: 'nowrap', color: '#20A888', background: 'rgba(32,168,136,0.12)', borderRadius: 999, padding: '3px 9px', font: `600 11px/1 ${FONT}` }}>{s.short}</span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Feed body */}
                <div className="al-feed" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, background: '#F5F6F8', height: 452, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(24,104,216,0.1)', border: '1px solid rgba(24,104,216,0.28)', borderRadius: 12, padding: '11px 13px' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 11V6a1.8 1.8 0 013.6 0v5M12.6 11V8.5a1.6 1.6 0 013.2 0V11M15.8 11.2V9.6a1.5 1.5 0 013 0V15a5 5 0 01-5 5h-1.6a4 4 0 01-2.9-1.2L5.6 15a1.7 1.7 0 012.5-2.3L9.4 14V6" stroke="#1868D8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ color: '#1868D8' }}>Tap play, Follow, the heart, or Shop to see what it infers.</span>
                  </div>

                  {/* Video card (play) */}
                  <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px 9px' }}>
                      <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#F0D9C4' }} />
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: '#0A0A0A' }}>the.daily.brief</div>
                        <div style={{ color: '#A0A0A5', marginTop: 3 }}>Suggested · 2h</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#C7C7CC" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
                    </div>
                    <button type="button" onClick={() => toggle('watched')} aria-pressed={signals.watched} style={{ position: 'relative', height: 122, width: '100%', background: '#F7F7F8', cursor: 'pointer', border: 'none', display: 'block', padding: 0 }}>
                      <span
                        {...(!signals.watched ? { 'data-tapring': 'true' } : {})}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 46, height: 46, borderRadius: '50%', background: signals.watched ? '#20A888' : 'rgba(10,10,10,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {signals.watched ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="#FFFFFF" /></svg>
                        )}
                      </span>
                      <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(10,10,10,0.6)', color: '#fff', borderRadius: 6, padding: '3px 7px', font: `500 11px/1 ${FONT}` }}>3:00</span>
                    </button>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div style={{ color: '#0A0A0A', marginBottom: 9 }}>Why your rent keeps going up</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8E8E93' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 20.5s-6.4-4.2-8.7-7.9C1.5 9.7 2.9 6.6 6 6.6c1.9 0 3.1 1.2 4 2.3.9-1.1 2.1-2.3 4-2.3 3.1 0 4.5 3.1 2.7 6-2.3 3.7-8.7 7.9-8.7 7.9z" stroke="#8E8E93" strokeWidth="1.7" strokeLinejoin="round" /></svg>842
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8E8E93' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 01-11.8 7.8L3 21l1.7-6.2A8.5 8.5 0 1121 11.5z" stroke="#8E8E93" strokeWidth="1.7" strokeLinejoin="round" /></svg>37
                        </span>
                        <span style={{ marginLeft: 'auto' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v13M7 8l5-5 5 5" stroke="#8E8E93" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suggested account (Follow) */}
                  <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 16, padding: 12 }}>
                    <div style={{ letterSpacing: '0.01em', color: '#A0A0A5', marginBottom: 11 }}>Suggested account</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#CFE0D6' }} />
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: '#0A0A0A' }}>Metro Politics Daily</div>
                        <div style={{ color: '#A0A0A5', marginTop: 4 }}>@metro.politics · News</div>
                      </div>
                      <button type="button" onClick={() => toggle('followed')} aria-pressed={signals.followed} style={{
                        flex: '0 0 auto', border: signals.followed ? '1px solid #E5E5EA' : 'none',
                        background: signals.followed ? '#fff' : '#1868D8', color: signals.followed ? '#6B6B70' : '#fff',
                        borderRadius: 999, padding: '8px 18px', font: `600 12.5px/1 ${FONT}`, cursor: 'pointer',
                      }}>{signals.followed ? 'Following' : 'Follow'}</button>
                    </div>
                  </div>

                  {/* Post (heart / like) */}
                  <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 16, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#DDE6F2' }} />
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: '#0A0A0A' }}>CityDesk</div>
                        <div style={{ color: '#A0A0A5', marginTop: 3 }}>4h</div>
                      </div>
                    </div>
                    <div style={{ color: '#0A0A0A', marginBottom: 11 }}>They spent $2M on THIS? Unbelievable.</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <button type="button" onClick={() => toggle('liked')} aria-pressed={signals.liked} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', padding: 0, font: `500 11.5px/1 ${FONT}`, color: signals.liked ? '#E4405F' : '#8E8E93', cursor: 'pointer' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={signals.liked ? '#E4405F' : 'none'} aria-hidden="true"><path d="M12 20.5s-6.4-4.2-8.7-7.9C1.5 9.7 2.9 6.6 6 6.6c1.9 0 3.1 1.2 4 2.3.9-1.1 2.1-2.3 4-2.3 3.1 0 4.5 3.1 2.7 6-2.3 3.7-8.7 7.9-8.7 7.9z" stroke={signals.liked ? '#E4405F' : '#8E8E93'} strokeWidth="1.7" strokeLinejoin="round" /></svg>
                        {signals.liked ? '3,205' : '3,204'}
                      </button>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#8E8E93' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 01-11.8 7.8L3 21l1.7-6.2A8.5 8.5 0 1121 11.5z" stroke="#8E8E93" strokeWidth="1.7" strokeLinejoin="round" /></svg>128
                      </span>
                      <span style={{ marginLeft: 'auto' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v13M7 8l5-5 5 5" stroke="#8E8E93" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    </div>
                  </div>

                  {/* Sponsored (Shop) */}
                  <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px 8px' }}>
                      <span style={{ letterSpacing: '0.01em', color: '#A0A0A5' }}>Sponsored</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#C7C7CC" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 12px 11px' }}>
                      <span style={{ width: 48, height: 48, borderRadius: 11, background: '#F7F7F8' }} />
                      <div style={{ flex: '1 1 0' }}>
                        <div style={{ color: '#0A0A0A' }}>CloudRunner Pro</div>
                        <div style={{ color: '#A0A0A5', marginTop: 4 }}>$129 · Free shipping</div>
                      </div>
                    </div>
                    <div style={{ padding: '0 12px 12px' }}>
                      <button type="button" onClick={() => toggle('tappedAd')} aria-pressed={signals.tappedAd} style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#0A0A0A', border: 'none', color: '#fff', borderRadius: 11, padding: 11, font: `600 13px/1 ${FONT}`, cursor: 'pointer' }}>
                        {signals.tappedAd && <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l4 4 10-10" fill="none" stroke="#20A888" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        {signals.tappedAd ? 'Tapped' : 'Shop now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================ LABELS MARQUEE ============================ */}
      <div className="al-labels al-section" style={{ padding: '104px 0' }}>
        <div className="al-labels-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 56px', width: '100%', boxSizing: 'border-box' }}>
          <h2 data-reveal className="al-h2" style={h2Big}>Algorithms infer hidden labels.</h2>
          <p data-reveal style={{ ...leadP, maxWidth: 620 }}>From small signals, systems sort people into clusters that shape what comes next.</p>
        </div>
        <div className="al-labels-rows" style={{ margin: '48px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {LABEL_ROWS.map((row, ri) => (
            <div key={ri} style={{ overflow: 'hidden', maskImage: LABEL_MASK, WebkitMaskImage: LABEL_MASK }}>
              <div
                data-mqx={ri % 2 === 1 ? 'reverse' : 'true'}
                style={{ display: 'flex', gap: 14, width: 'max-content', padding: '4px 8px', animationDuration: ri === 1 ? '64s' : '56s' }}
              >
                {[...row, ...row].map((label, i) => {
                  const blue = i % 2 === 0;
                  return (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap',
                      background: blue ? 'rgba(24,104,216,0.1)' : 'rgba(32,168,136,0.12)',
                      border: blue ? '1px solid rgba(24,104,216,0.35)' : '1px solid rgba(32,168,136,0.4)',
                      borderRadius: 999, padding: '13px 24px', color: '#0A0A0A', fontSize: 15,
                    }}>{label}</span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="al-labels-pad" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 56px', width: '100%', boxSizing: 'border-box' }}>
          <span style={{ font: `400 13px/18px ${FONT}`, color: '#A0A0A5' }}>Illustrative examples of inferred labels, not categories we've assigned to you.</span>
        </div>
      </div>

      {/* ============================ HOW IT WORKS ============================ */}
      <div id="how-it-works" className="al-section" style={{ background: sectionBand, padding: '104px 56px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 620, marginBottom: 44 }}>
            <h2 data-reveal className="al-h2" style={h2Big}>Three steps. No jargon.</h2>
            <p data-reveal style={{ ...leadP, maxWidth: 560 }}>Click through what happens from your feed to a finished report — it advances on its own too.</p>
          </div>
          <div data-reveal className="al-how-grid" style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 40, alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              {HOW_STEPS.map((step, i) => {
                const active = howStep === i;
                return (
                  <button
                    key={step.n}
                    type="button"
                    onClick={() => selectHow(i)}
                    aria-pressed={active}
                    style={{
                      position: 'relative', display: 'flex', gap: 16, alignItems: active ? 'flex-start' : 'center',
                      textAlign: 'left', width: '100%', background: active ? '#fff' : 'transparent',
                      border: active ? '1px solid #E5E5EA' : '1px solid transparent', borderRadius: 16, padding: '20px 22px',
                      cursor: 'pointer', boxShadow: active ? '0 1px 2px rgba(16,24,40,0.04), 0 16px 32px -16px rgba(16,24,40,0.22)' : 'none',
                    }}
                  >
                    {active && <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: 18, bottom: 18, width: 4, borderRadius: '0 3px 3px 0', background: '#20A888' }} />}
                    <span style={{
                      flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%',
                      background: active ? '#20A888' : '#fff', border: active ? 'none' : '1.5px solid #E5E5EA',
                      color: active ? '#fff' : '#A0A0A5', display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 15px/1 ${FONT}`,
                    }}>{step.n}</span>
                    {active ? (
                      <span style={{ display: 'block' }}>
                        <span style={{ display: 'block', font: `800 19px/25px ${FONT}`, letterSpacing: '-0.015em', color: '#0A0A0A', marginBottom: 5 }}>{step.title}</span>
                        <span style={{ display: 'block', font: `400 15px/22px ${FONT}`, color: '#6B6B70' }}>{step.body}</span>
                      </span>
                    ) : (
                      <span style={{ font: `800 19px/25px ${FONT}`, letterSpacing: '-0.015em', color: '#A0A0A5' }}>{step.title}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Preview panel keyed to active step */}
            <div style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 20, padding: '30px 32px', minHeight: 340, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 2px 8px rgba(16,24,40,0.05), 0 34px 68px rgba(16,24,40,0.28)' }}>
              <HowPreview step={howStep} />
            </div>
          </div>

          {/* CTA row */}
          <div style={{ marginTop: 56, borderRadius: 18, background: '#fff', border: '1px solid #E5E5EA', padding: '44px 30px', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 28px rgba(16,24,40,0.16)', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 740, letterSpacing: '-0.02em', color: '#0A0A0A', marginBottom: 22 }}>Curious what yours would show?</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AppStoreButton style={{ padding: '16px 34px', borderRadius: 15 }} glyph={{ w: 24, h: 29 }} subSize={24} />
            </div>
            <div style={{ marginTop: 18 }}><Link to="/methodology" style={{ color: '#6B6B70' }}>Read the methodology first</Link></div>
          </div>
        </div>
      </div>

      {/* ============================ PRIVACY ============================ */}
      <div id="privacy" className="al-section" style={{ background: sectionBand, padding: '104px 56px' }}>
        <div className="al-privacy-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '460px 1fr', gap: 72, alignItems: 'start' }}>
          <div>
            <h2 data-reveal className="al-h2" style={{ ...h2Big, margin: '0 0 16px' }}>Your data stays yours.</h2>
            <p data-reveal style={{ ...leadP, margin: '0 0 22px' }}>Reading your feed means handling sensitive data. Here is exactly how it is treated.</p>
            <Link to="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1868D8' }}>Read how every metric is computed →</Link>
          </div>
          <div className="al-privacy-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {PRIVACY_CARDS.map((c) => (
              <div key={c.title} data-reveal style={{ border: '1px solid #E5E5EA', background: '#fff', borderRadius: 16, padding: 22, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 28px rgba(16,24,40,0.16)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(32,168,136,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 15 }}>{c.icon}</div>
                <div style={{ color: c.titleColor, marginBottom: 6 }}>{c.title}</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: '#6B6B70' }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================ WAYS TO USE ============================ */}
      <div className="al-section" style={{ background: 'transparent', padding: '104px 56px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 620, marginBottom: 46 }}>
            <h2 data-reveal className="al-h2" style={h2Big}>What people do with it</h2>
            <p data-reveal style={{ ...leadP, maxWidth: 620 }}>A read on your feed you can actually act on.</p>
          </div>
          <div className="al-ways-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {WAYS.map((w) => (
              <div key={w.title} className="al-way" style={{ background: w.blue ? 'rgba(24,104,216,0.05)' : 'rgba(32,168,136,0.06)', border: w.blue ? '1px solid rgba(24,104,216,0.14)' : '1px solid rgba(32,168,136,0.16)', borderRadius: 18, padding: '26px 24px' }}>
                <div className="al-ico" style={{ width: 50, height: 50, borderRadius: 14, background: w.blue ? 'rgba(24,104,216,0.12)' : 'rgba(32,168,136,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>{w.icon}</div>
                <div style={{ letterSpacing: '-0.017em', marginBottom: 8, color: w.blue ? '#1868D8' : '#20A888' }}>{w.title}</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: '22px', color: '#6B6B70' }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================ TRUST ============================ */}
      <div className="al-section" style={{ background: sectionBand, padding: '104px 56px' }}>
        <div className="al-trust-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 72, alignItems: 'center' }}>
          <div>
            <h2 data-reveal className="al-h2" style={{ margin: '0 0 16px', fontSize: 50, lineHeight: 1.05, fontWeight: 740, letterSpacing: '-0.027em', textWrap: 'balance' }}>You shouldn't have to take our word for it.</h2>
            <p data-reveal style={{ margin: '0 0 30px', fontSize: 18, lineHeight: '28px', color: '#6B6B70', maxWidth: 520, textWrap: 'pretty' }}>AlgorithmLens exists to make your feed legible, so every number it reports is documented, sourced, and open to check. It began as MIT research.</p>
            <div data-reveal style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {TRUST_POINTS.map((t) => (
                <div key={t.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 auto', width: 40, height: 40, borderRadius: 11, background: t.blue ? 'rgba(24,104,216,0.1)' : 'rgba(32,168,136,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.icon}</div>
                  <div>
                    <div style={{ color: '#0A0A0A' }}>{t.title}</div>
                    <div style={{ color: '#6B6B70' }}>{t.body}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 30 }}><Link to="/methodology" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#1868D8' }}>Read the full methodology →</Link></div>
          </div>
          {/* Worked example card */}
          <div data-reveal className="al-card" style={{ background: '#fff', border: '1px solid #E5E5EA', borderRadius: 18, padding: '26px 28px', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 12px 28px rgba(16,24,40,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18 }}>
              <span style={{ letterSpacing: '0.01em', color: '#A0A0A5' }}>Worked example</span>
              <span style={sampleChip}>Sample data</span>
            </div>
            <div style={{ color: '#0A0A0A', letterSpacing: '-0.01em' }}>How we get to 54%</div>
            <div style={{ color: '#6B6B70', marginTop: 4, marginBottom: 20 }}>Suggested vs. followed, from a sample 30-day scan.</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ color: '#20A888', letterSpacing: '-0.035em', fontVariantNumeric: 'tabular-nums', fontSize: 44, fontWeight: 800, lineHeight: 1 }}>54%</span>
              <span style={{ color: '#0A0A0A' }}>of posts were suggested to you, not from people you follow.</span>
            </div>
            <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', margin: '20px 0 12px' }}>
              <div style={{ width: '46%', background: '#1868D8' }} />
              <div style={{ width: '54%', background: '#20A888' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B6B70' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1868D8' }} />Followed · 1,925</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B6B70' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#20A888' }} />Suggested · 2,257</span>
            </div>
            <div style={{ background: '#F7F7F8', borderRadius: 10, padding: '12px 14px', color: '#6B6B70', textAlign: 'center' }}>2,257 suggested ÷ 4,182 total = <span style={{ color: '#0A0A0A', fontWeight: 700 }}>54%</span></div>
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #EFEFF1' }}><Link to="/methodology">See this metric in the methodology →</Link></div>
          </div>
        </div>
      </div>

      {/* ============================ FINAL CTA ============================ */}
      <div className="al-section" style={{ position: 'relative', overflow: 'hidden', background: '#F5F6F8', padding: '76px 56px 72px', textAlign: 'center' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(10,10,10,0.05) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(72% 72%, #000, transparent)', WebkitMaskImage: 'radial-gradient(72% 72%, #000, transparent)' }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <h2 className="al-final-h2" style={{ margin: '0 0 16px', fontSize: 62, lineHeight: 1, fontWeight: 760, letterSpacing: '-0.033em', color: '#0A0A0A', textWrap: 'balance' }}>See your feed clearly.</h2>
          <p style={{ margin: '0 0 26px', fontSize: 18, lineHeight: '27px', color: '#6B6B70' }}>Two minutes a week keeps your picture current. One scan to start.</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
            <AppStoreButton />
            <Link to="/methodology" style={{ color: '#1868D8' }}>Read the methodology →</Link>
          </div>
        </div>
      </div>

      {/* ============================ FOOTER ============================ */}
      <footer style={{ background: '#F0F0F2', borderTop: '1px solid #E5E5EA', padding: '64px 56px 40px' }}>
        <div className="al-footer-grid" style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.7fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <img src="/algorithmlens-wordmark.svg" alt="AlgorithmLens" style={{ height: 28, display: 'block', marginBottom: 16 }} />
            <p style={{ margin: 0, fontSize: 14, lineHeight: '21px', color: '#6B6B70', maxWidth: 260 }}>See what your feeds have learned about you. Built at MIT.</p>
          </div>
          <FooterCol title="Product" links={[['How it works', '#how-it-works'], ['The report', '#report'], ['Privacy', '#privacy'], ['Start a scan', '/start']]} />
          <FooterCol title="Company" links={[['Methodology', '/methodology'], ['About', '/methodology'], ['Contact', '/methodology']]} />
          <FooterCol title="Legal" links={[['Privacy policy', '/privacy'], ['Terms', '/terms']]} />
        </div>
        <div style={{ maxWidth: 1180, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid #E5E5EA', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ color: '#A0A0A5' }}>© 2026 AlgorithmLens · Built at MIT</span>
          <span style={{ color: '#A0A0A5' }}>Sample data shown throughout is illustrative.</span>
        </div>
      </footer>
    </div>
  );
}

/* ---- How-it-works preview panels ---- */
function HowPreview({ step }) {
  if (step === 0) {
    return (
      <div data-pop="true" key="s0">
        <div style={{ font: `700 11px/1 ${FONT}`, letterSpacing: '0.01em', color: '#1868D8', marginBottom: 14 }}>Step 01 · Start a scan</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['YouTube', '#FF0000'], ['Instagram', '#E4405F'], ['TikTok', '#0A0A0A'], ['X', '#0A0A0A'], ['Reddit', '#FF4500']].map(([p, color]) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F7F7F8', borderRadius: 12, padding: '12px 14px' }}>
              <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 7, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: 'rgba(255,255,255,0.92)' }} />
              </span>
              <span style={{ color: '#0A0A0A' }}>{p}</span>
              <span style={{ marginLeft: 'auto', color: '#A0A0A5' }}>Ready to scan</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div data-pop="true" key="s1">
        <div style={{ font: `700 11px/1 ${FONT}`, letterSpacing: '0.01em', color: '#1868D8', marginBottom: 14 }}>Step 02 · We find patterns</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {[['Sources mapped', 82], ['Ads classified', 64], ['Tone measured', 47]].map(([label, pct]) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#6B6B70' }}><span>{label}</span><span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span></div>
              <div style={{ height: 8, borderRadius: 4, background: '#F0F0F2' }}><div style={{ width: `${pct}%`, height: 8, borderRadius: 4, background: '#1868D8' }} /></div>
            </div>
          ))}
        </div>
        <div style={{ font: `400 12px/1 ${FONT}`, color: '#A0A0A5', marginTop: 16, textAlign: 'center' }}>Sample data, shown for illustration.</div>
      </div>
    );
  }
  return (
    <div data-pop="true" key="s2">
      <div style={{ font: `700 11px/1 ${FONT}`, letterSpacing: '0.01em', color: '#20A888', marginBottom: 14 }}>Step 03 · Your report</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 60, lineHeight: 1, color: '#20A888', letterSpacing: '-0.04em' }}>54%</span>
        <span style={{ font: `600 15px/21px ${FONT}`, color: '#0A0A0A' }}>of your feed was suggested,<br />not from people you follow.</span>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {[['Posts analyzed', '4,182', '#1868D8'], ['Ad categories', '5', '#1868D8'], ['Tone: charged', '23%', '#20A888']].map(([label, val, color]) => (
          <div key={label} style={{ flex: '1 1 0', background: '#F7F7F8', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ font: `500 12px/1 ${FONT}`, color: '#6B6B70', marginBottom: 7 }}>{label}</div>
            <div style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 24, lineHeight: 1, color, letterSpacing: '-0.02em' }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: '46%', background: '#1868D8' }} />
        <div style={{ width: '54%', background: '#20A888' }} />
      </div>
      <div style={{ font: `400 12px/1 ${FONT}`, color: '#A0A0A5', marginTop: 10, textAlign: 'center' }}>Sample data, shown for illustration.</div>
    </div>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div style={{ letterSpacing: '0.01em', color: '#A0A0A5', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {links.map(([label, href]) => (
          href.startsWith('#')
            ? <a key={label} href={href} style={{ color: '#3A3A40' }}>{label}</a>
            : <Link key={label} to={href} style={{ color: '#3A3A40' }}>{label}</Link>
        ))}
      </div>
    </div>
  );
}

/* ---- Icon-bearing card data (kept below the component for readability) ---- */
const PRIVACY_CARDS = [
  {
    title: 'Analyzed, then discarded', titleColor: '#1868D8',
    body: 'Frames from your feed are read by a vision model to build your report, then deleted.',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2.5" stroke="#20A888" strokeWidth="1.8" /><path d="M8 10V7a4 4 0 018 0v3" stroke="#20A888" strokeWidth="1.8" /></svg>),
  },
  {
    title: 'Delete anytime', titleColor: '#20A888',
    body: 'One click removes your scan data, no retention tricks.',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16M7 5l1 14a2 2 0 002 2h4a2 2 0 002-2l1-14M10 5V4a2 2 0 014 0v1" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    title: 'Never sold, never shared', titleColor: '#1868D8',
    body: 'No ad tech on this site, and your data is not a product.',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0121 12a15.9 15.9 0 01-3.3 3.9M6.2 6.2A15.4 15.4 0 003 12a9.9 9.9 0 0011.3 4.8" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    title: 'Public methodology', titleColor: '#20A888',
    body: 'Every metric documented and linked.',
    icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6v4H9V3zM8 12h8M8 16h5" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
];

const WAYS = [
  {
    title: 'Check your news diet', blue: true,
    body: 'See which sources really fill your feed, not the ones you think do.',
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6a1 1 0 011-1h12a1 1 0 011 1v13a1 1 0 001 1H5a2 2 0 01-2-2V6z" stroke="#1868D8" strokeWidth="1.8" strokeLinejoin="round" /><path d="M17 8h3a1 1 0 011 1v9a2 2 0 01-2 2M7 9h6M7 13h6M7 17h4" stroke="#1868D8" strokeWidth="1.8" strokeLinecap="round" /></svg>),
  },
  {
    title: 'Audit the ads', blue: false,
    body: 'Which categories you’re shown, how often, and how it shifts over time.',
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-6.2-6.2A2 2 0 013.8 13V5.5A1.5 1.5 0 015.3 4H13a2 2 0 011.4.6l6.2 6.2a2 2 0 010 2.6z" stroke="#20A888" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="8.5" cy="8.5" r="1.4" fill="#20A888" /></svg>),
  },
  {
    title: 'Re-tune on purpose', blue: true,
    body: 'Unfollow, mute, and follow deliberately, then rescan to compare.',
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 21v-6M4 11V3M12 21v-9M12 8V3M20 21v-4M20 13V3M1 15h6M9 8h6M17 17h6" stroke="#1868D8" strokeWidth="1.8" strokeLinecap="round" /></svg>),
  },
  {
    title: 'Teach and research', blue: false,
    body: 'Illustrative dashboards for classrooms studying recommender systems.',
    icon: (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2V5z" stroke="#20A888" strokeWidth="1.8" strokeLinejoin="round" /><path d="M19 18v3H6a2 2 0 01-2-2" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" /></svg>),
  },
];

const TRUST_POINTS = [
  {
    title: 'Built at MIT', blue: true, body: 'Academic research, made public.',
    icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3L2 8l10 5 10-5-10-5zM6 10.5V15c0 1.6 2.7 3 6 3s6-1.4 6-3v-4.5" stroke="#1868D8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    title: 'Public methodology', blue: false, body: 'Every metric documented and linked.',
    icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3h6v4H9V3zM8 12h8M8 16h5" stroke="#20A888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>),
  },
  {
    title: 'Honest about limits', blue: true, body: 'We show what you saw, and flag what we can’t.',
    icon: (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="#1868D8" strokeWidth="1.8" /><path d="M12 11v5" stroke="#1868D8" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="7.6" r="1.1" fill="#1868D8" /></svg>),
  },
];
