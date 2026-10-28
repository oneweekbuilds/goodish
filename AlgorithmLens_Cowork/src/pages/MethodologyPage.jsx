/**
 * MethodologyPage: the public account of how the AlgorithmLens iPhone app
 * measures a feed, for people who want to stress-test the instrument.
 *
 * Rebuilt 27 October 2026 (pre-beta audit). The page now mirrors the
 * app's own Methodology screen, section for section: what the instrument
 * does (one capture method), what is counted against what is read, the
 * extraction schema, the prompts generated verbatim from the app's
 * source (src/pages/methodologyPrompts.generated.js, written by
 * scripts/sync-methodology-prompts.mjs and pinned by
 * src/methodologyPrompts.test.js), where the data goes, how the
 * instrument has been evaluated and what has not been evaluated, the
 * known limitations, and what the numbers do not license.
 *
 * Every figure below is copied from a dated artifact in the mobile
 * repository and named beside the figure: src/config/methodologyEvidence.ts
 * (pinned by test to the eval artifacts), METHODOLOGY_EVIDENCE.md,
 * GOLDSET_SCORING_AND_HEADROOM.md, INSTRUMENT_VERSIONS.md and
 * PRODUCT_DECISIONS.md (D-54). Nothing here is a number the app does not
 * itself stand behind.
 *
 * Last updated: October 27, 2026
 */

import React from 'react';
import { FileSearch } from 'lucide-react';
import SEO from '../components/SEO';
import BackLink from '../components/ui/BackLink';
import { PROMPTS } from './methodologyPrompts.generated.js';
import { EVALUATION_FIGURES, SCHEMA_FIELDS } from './methodologyContent.js';

// Accuracy rows as the app's methodology screen renders them
// (src/config/methodologyEvidence.ts). Coverage, conditional agreement
// and errors are three different numbers and are never added together.
const ACCURACY_ROWS = [
  {
    dimension: 'Extraction precision (is the item a real post?)',
    judgeable: 97, labeled: 97, agreed: 96, pct: '99.0%', interval: '94.4 to 99.8', errors: 1, declined: 0,
    note: 'The false-positive side rests on one item. Recall is not measured: the person only ever saw items the model proposed.',
    source: 'GOLDSET_SCORING_AND_HEADROOM.md, section 2 (2026-08-09)',
  },
  {
    dimension: 'Ads',
    judgeable: 78, labeled: 78, agreed: 78, pct: '100%', interval: '95.3 to 100', errors: 0, declined: 0,
    note: 'Detection untested: the capture held four posts with a paid label, so almost every agreement is the two sides agreeing a post was not an ad.',
    source: 'methodologyEvidence.ts ACCURACY_STUDY (2026-08-09)',
  },
  {
    dimension: 'Sources (creator transcription)',
    judgeable: 43, labeled: 43, agreed: 40, pct: '93.0%', interval: '81.4 to 97.6', errors: 3, declined: 0,
    note: 'A check of a transcription, not a blind label: the rater was shown the handle the reader had transcribed and asked whether it matched the screen.',
    source: 'methodologyEvidence.ts ACCURACY_STUDY (2026-08-09)',
  },
  {
    dimension: 'Suggested vs followed',
    judgeable: 77, labeled: 77, agreed: 77, pct: '100%', interval: '95.3 to 100', errors: 0, declined: 0,
    note: 'Detection entirely untested: the capture held no post with an origin label, so all 77 agreements are the two sides agreeing there was nothing to find.',
    source: 'methodologyEvidence.ts ACCURACY_STUDY (2026-08-09)',
  },
  {
    dimension: 'Politics',
    judgeable: 54, labeled: 54, agreed: 54, pct: '100%', interval: '93.4 to 100', errors: 0, declined: 0,
    note: 'Re-measured on 10 August 2026 after the reader was required to answer the politics question; before that it answered 2 of these 54 posts and the app recorded silence as "not political". Two political posts in the capture, so detection is untested.',
    source: 'eval/results/accuracy-politics-required-1786367219811.json (2026-08-10)',
  },
  {
    dimension: 'Tone',
    judgeable: 40, labeled: 7, agreed: 6, pct: 'withheld (under 20 items)', interval: '48.7 to 97.4', errors: 1, declined: 33,
    note: 'The reader declined on 33 of the 40 posts a person could read. Declines cost coverage and are never counted as errors; the app leaves such posts out of every tone count.',
    source: 'methodologyEvidence.ts ACCURACY_STUDY (2026-08-09)',
  },
];

// The same-session two-arm run around the one instrument change that has
// gold-set evidence (METHODOLOGY_EVIDENCE.md section 11; INSTRUMENT_VERSIONS.md).
const BRIDGING_ROWS = [
  ['Extraction precision', '94 of 95 labeled, 94/95 agree', '94 of 95 labeled, 94/95 agree'],
  ['Ad detection', '78 labeled, 77/78 agree', '78 labeled, 77/78 agree'],
  ['Origin label', '77 labeled, 77/77 agree', '77 labeled, 77/77 agree'],
  ['Political flag', '2 of 54 labeled, 2/2 agree', '54 of 54 labeled, 54/54 agree'],
  ['Tone', '5 of 40 labeled, 4/5 agree', '10 of 40 labeled, 7/10 agree'],
  ['Creator transcription', '43 labeled, 40/43 agree', '43 labeled, 40/43 agree'],
];

// What is counted and what is read (mobile src/lib/methodology.ts DIMENSION_SPLIT).
const DIMENSIONS = [
  ['Ads', 'a sponsored or paid label shown on the post', 'Counted from a printed label'],
  ['Sources', 'the handle printed above the post', 'Counted from a printed label'],
  ['Suggested vs followed', 'an origin label the platform prints on the post, where one exists; on feeds that print none, which feed was scanned', 'Mixed: marked "inferred" wherever it rests on the feed rather than a label'],
  ['Topics', 'a reading of what the post is about', 'The model’s reading'],
  ['Politics', 'a reading of the wording and imagery', 'The model’s reading'],
  ['Tone', 'a reading of the wording and imagery', 'The model’s reading'],
];

const PLATFORM_HINTS_TEXT = PROMPTS.platformHints.map((h) => h.text).join('\n\n');

export default function MethodologyPage() {
  const f = EVALUATION_FIGURES;
  return (
    <>
      <SEO
        title="Methodology"
        description="How AlgorithmLens measures a feed: the schema, the exact prompts, where data goes, what has been measured about the instrument, and its limits."
        path="/methodology"
      />
      <div className="min-h-[100dvh] bg-bg-page pt-20 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <BackLink to="/" label="Back to home" />

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
              <FileSearch size={24} className="text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight-heading mb-2">
                Methodology
              </h1>
              <p className="text-text-muted">
                Last updated: October 27, 2026
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none space-y-10">

            {/* Intro and status */}
            <section>
              <p className="text-text-muted leading-relaxed mb-4">
                This page describes how the AlgorithmLens iPhone app measures the composition of a social media feed: what it captures, what the model reads and what ordinary code counts, the exact prompts it sends, where the data goes, what has been measured about the instrument, what has not, and what the numbers do not license. It is written for people who want to stress-test the instrument, not for people we are trying to impress. The app carries the same account in its own Methodology screen (Settings, then How your checkup is made; every finding card also carries a "How this was counted" row), drawn from the same source files these figures come from.
              </p>
              <div className="bg-blue-50 rounded-xl p-5 border border-primary-blue/20">
                <p className="text-sm font-semibold text-text-main mb-2">Current status, stated plainly</p>
                <ul className="text-sm text-text-muted space-y-2">
                  <li>The app is in a public TestFlight beta on iPhone (iOS 15.1 and later).</li>
                  <li>Stability (does the reader say the same thing twice?) was measured once, on 7 August 2026, on one YouTube capture.</li>
                  <li>Accuracy (does it agree with a person?) was measured once, on 9 August 2026 with politics re-measured on 10 August, by one annotator, on {f.goldItems} items from one YouTube session. That is enough to find a weakness and not enough to certify a strength.</li>
                  <li>Five of the six supported feeds (Instagram, TikTok, X, Facebook, Reddit) have never been tested against a real capture.</li>
                  <li>Every AI-derived label is a model's reading of a post, not a fact about the post, and the app says so wherever a number rests on one.</li>
                </ul>
              </div>
            </section>

            {/* What the instrument does */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">What the instrument does</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens analyzes a recording the user makes of their own screen. There is no scraping, no platform API access and no automated collection. Every scan is started and stopped by the user, with the user's hands on the screen. There is one capture method.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Capture: a screen recording</h3>
                  <p className="text-text-muted leading-relaxed">
                    The user starts a system screen recording through Apple's ReplayKit broadcast picker, from Control Center or from the app's own button, opens their social app and scrolls normally, then stops the recording from the red indicator. The broadcast extension samples one frame every 2.5 seconds, discards every audio buffer, drops near-duplicate frames by perceptual hash, runs on-device text recognition on each kept frame, compresses it to JPEG at quality 0.75, and stops at 200 frames or 10 minutes. The frames stay in the app's container on the phone until the user reviews a summary and taps Analyze. Nothing is sent before that tap.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Reading: one model request per frame</h3>
                  <p className="text-text-muted leading-relaxed">
                    Each frame goes to Google's Gemini API, model identifier <code className="font-mono">{PROMPTS.model}</code>, with the prompts published below, at temperature 0 and a response schema that constrains the output to the fields listed here. Three frames are in flight at a time; a transient failure is retried once; a request times out after 30 seconds. A malformed answer counts as a failed frame, and failed frames are listed on the checkup, never filled in.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Counting: ordinary code</h3>
                  <p className="text-text-muted leading-relaxed">
                    Items extracted from overlapping frames are merged by a fixed rule (same account, and the shorter text a substring of the longer or sharing at least 80 percent of its words), labels are tallied, and a share is withheld until enough posts back it. All aggregation into the numbers on the dashboard happens on the device by fixed rules, not by the AI.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Discarding</h3>
                  <p className="text-text-muted leading-relaxed">
                    The frames and the post wording go once the count finishes. What stays is the tally: handles, labels, topic and tone readings, and the date, platform and post count of the scan.
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">What the app asks for, and what it enforces</h3>
              <ul className="space-y-2 text-text-muted">
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>The app asks for at least 20 captured frames and 60 seconds of recording, and says so when a recording falls short. It does not refuse a shorter recording: one can still be analyzed, and its checkup says how little it held. The length the app suggests is about two minutes.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>One scan is a session, not the feed. Scans pool into a rolling 28-day record, and a share is called a stable read once 120 pooled posts back it; before that the app marks it as early.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>A share is shown only when at least 10 posts back it, and the suggested-vs-followed split only when a majority of the posts carry an origin basis; otherwise the app shows nothing rather than a guess.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>A change between two checkups is reported only when it clears the noise bar described under "How we evaluate ourselves" below. Most weeks nothing certifies, and the app says "No measurable change" rather than inventing a direction.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>Cost guards, not product thresholds: at most 400 model requests per device per day, and a remote switch that turns analysis off for maintenance.</span></li>
              </ul>
            </section>

            {/* Counted vs read */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">What is counted, and what is read into it</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Two of the six dimensions rest on something printed on the screen that a person could point at. Three are the model's reading of the content. One is in between, and the app marks each figure built that way as inferred where it appears.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border-light">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 font-semibold text-text-main">Dimension</th>
                      <th className="p-3 font-semibold text-text-main">Rests on</th>
                      <th className="p-3 font-semibold text-text-main">Kind</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONS.map(([dimension, rests, kind]) => (
                      <tr key={dimension} className="border-t border-border-light align-top">
                        <td className="p-3 font-mono text-xs text-text-main whitespace-nowrap">{dimension}</td>
                        <td className="p-3 text-text-muted">{rests}</td>
                        <td className="p-3 text-text-muted">{kind}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-text-muted leading-relaxed mt-4">
                Two consequences, stated on the app's own screens as well. A paid post without a printed label counts as a plain post, so ad shares are floors, not ceilings. Facebook, YouTube and Reddit print an origin label on some posts and nothing on the rest; TikTok, Instagram Explore and Reels, and the X For You feed print nothing per post at all, so there the split comes from which feed was scanned, and every figure built that way is marked inferred.
              </p>
            </section>

            {/* The extraction schema */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">The extraction schema</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                For every post the model can see in a frame, it is asked to fill the following fields. This is the complete list; nothing else is extracted. The model is constrained to this schema by Gemini's structured-output mechanism, so responses cannot add fields or values outside the enumerations.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border-light">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 font-semibold text-text-main">Field</th>
                      <th className="p-3 font-semibold text-text-main">Level</th>
                      <th className="p-3 font-semibold text-text-main">Meaning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCHEMA_FIELDS.map(([field, level, meaning]) => (
                      <tr key={field} className="border-t border-border-light align-top">
                        <td className="p-3 font-mono text-xs text-text-main whitespace-nowrap">{field}</td>
                        <td className="p-3 text-text-muted whitespace-nowrap">{level}</td>
                        <td className="p-3 text-text-muted">{meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* The full prompts */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">The full analysis prompts, verbatim</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                These blocks are generated from the app's source code (commit {PROMPTS.commit}, {PROMPTS.date}) by a script, and a test fails whenever they drift from it, so what you read here is what the app sends. The prompts contain everything the model is told; there are no hidden instructions. The app also records a version string on every scan made of the model identifier and a hash over this whole prompt surface, so a comparison across a prompt change says so instead of running the two together.
              </p>

              <h3 className="text-lg font-semibold text-text-main mb-2">System prompt</h3>
              <pre className="bg-gray-50 border border-border-light rounded-xl p-4 text-xs text-text-main whitespace-pre-wrap leading-relaxed mb-6">{PROMPTS.systemPrompt}</pre>

              <h3 className="text-lg font-semibold text-text-main mb-2">Per-frame prompt</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                Sent once per captured frame. Values in curly braces are filled in per frame; everything else is literal.
              </p>
              <pre className="bg-gray-50 border border-border-light rounded-xl p-4 text-xs text-text-main whitespace-pre-wrap leading-relaxed mb-6">{PROMPTS.framePrompt}</pre>

              <h3 className="text-lg font-semibold text-text-main mb-2">The on-device text, as it is framed</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                The text recognized on the phone is passed to the model as a second channel, inside this framing, after a short blocklist removes the commonest prompt-injection phrases and the text is cut at 3,000 characters. It is data to classify, never instructions.
              </p>
              <pre className="bg-gray-50 border border-border-light rounded-xl p-4 text-xs text-text-main whitespace-pre-wrap leading-relaxed mb-6">{PROMPTS.ocrFraming}</pre>

              <h3 className="text-lg font-semibold text-text-main mb-2">Platform-specific hints</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                One of these blocks is inserted into the per-frame prompt depending on which platform is being scanned.
              </p>
              <pre className="bg-gray-50 border border-border-light rounded-xl p-4 text-xs text-text-main whitespace-pre-wrap leading-relaxed mb-6">{PLATFORM_HINTS_TEXT}</pre>

              <h3 className="text-lg font-semibold text-text-main mb-2">The topic taxonomy</h3>
              <p className="text-text-muted leading-relaxed">
                The {PROMPTS.topicCategories.length} primary categories the extractor is instructed with, plus Other: {PROMPTS.topicCategories.join(', ')}.
              </p>
            </section>

            {/* Data flow */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">Where the data goes</h2>
              <ol className="space-y-3 text-text-muted list-decimal pl-5">
                <li className="leading-relaxed">
                  <strong>Capture happens on the device.</strong> Frames are compressed, deduplicated and text-recognized on the phone, and stay there until the user taps Analyze.
                </li>
                <li className="leading-relaxed">
                  <strong>Frames are sent to Google's Gemini API for analysis.</strong> The compressed frame images and the recognized text go to the model named above over an encrypted connection, with the prompts published above. This happens only if the user has explicitly consented to AI analysis; the consent gate fails closed and is re-checked before every analysis. In the current beta build the requests go directly from the device to Google's API, with the per-device daily cap and the remote switch described above as the guards. A server-side proxy that would move the API credential off the device is built and not yet switched on; switching it on changes where the request is routed, not what is sent or stored.
                </li>
                <li className="leading-relaxed">
                  <strong>Gemini returns text labels, not images.</strong> The response is structured JSON matching the schema above. No images come back.
                </li>
                <li className="leading-relaxed">
                  <strong>Frames are deleted after analysis.</strong> Frame files are deleted from the device once the count finishes (or when the user leaves a failed analysis without retrying it), and in-memory image data is released. AlgorithmLens keeps no copy. There is no central store of anyone's feed screenshots, and we intend to keep it that way permanently.
                </li>
                <li className="leading-relaxed">
                  <strong>The training question.</strong> The app's privacy policy states that its Gemini API access is configured on a paid billing account, and that under Google's paid-tier API terms, data submitted through it is not used to train Google's AI models. That is the basis for the claim; it depends on Google's terms and on the billing configuration.
                </li>
                <li className="leading-relaxed">
                  <strong>What is stored:</strong> per-post tallies (source handle, ad label, origin label, topic, tone reading) and scan metadata (date, platform, post count, capture duration and frame count), saved per user in a Supabase database with row-level security, so each user can only read their own rows. The text of posts is never stored on any path. Users can delete their whole account, and everything referencing it, from inside the app.
                </li>
                <li className="leading-relaxed">
                  <strong>What is never stored centrally:</strong> raw frames or screenshots, and the wording of posts. Images exist only transiently on the user's device and at Google's API during analysis.
                </li>
                <li className="leading-relaxed">
                  <strong>Research participants only.</strong> For people who separately join the research study, the text the model read from each post, its hashtags, the account handle and display name, and the platform are sent once more, through a server function, to a second reader (TypeSafe AI's Jev model) that answers a fixed set of yes-or-no questions with a probability each. Numbers come back, no image or visual description is sent, and today this runs on X, Reddit and YouTube checkups only. Nothing it answers reaches a count, a finding or a screen for anyone else.
                </li>
                <li className="leading-relaxed">
                  <strong>Also present:</strong> crash and error reports to Sentry (the account's internal user id attached; email, username and name stripped), and a check with Expo's update service at launch for newer app code. Both are described in the privacy policy.
                </li>
              </ol>
            </section>

            {/* How we evaluate ourselves */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">How we evaluate ourselves</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Four kinds of evidence exist about the instrument, each thin in a stated way, and one list of what has not been evaluated at all. Every figure here is also rendered inside the app, from constants a test pins to the dated result files in the repository.
              </p>

              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">1. The gold set: one person checked the reader against one feed</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                On 9 August 2026 one annotator (the app's owner) labeled {f.goldItems} items that the reader had pulled from {f.goldFrames} frames of one YouTube session, in a tool that never shows the model's answer first. Consecutive frames of a scroll show the same posts again, so under the app's own duplicate rule those {f.goldItems} items are {f.distinctPosts} distinct posts, and intervals that treat items as independent are optimistic. Three numbers are kept apart per dimension: coverage (how often the reader labeled a post at all), conditional agreement (where both labeled, how often they matched, with a 95 percent interval), and errors. Declining to label is not a wrong answer and is never counted as one. Under {f.pointEstimateFloor} items the rate is withheld and only the interval is quoted.
              </p>
              <div className="overflow-x-auto rounded-xl border border-border-light">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 font-semibold text-text-main">Dimension</th>
                      <th className="p-3 font-semibold text-text-main">A person could judge</th>
                      <th className="p-3 font-semibold text-text-main">Reader labeled</th>
                      <th className="p-3 font-semibold text-text-main">Agreed, where both labeled</th>
                      <th className="p-3 font-semibold text-text-main">95% interval</th>
                      <th className="p-3 font-semibold text-text-main">Errors</th>
                      <th className="p-3 font-semibold text-text-main">Declined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCURACY_ROWS.map((row) => (
                      <tr key={row.dimension} className="border-t border-border-light align-top">
                        <td className="p-3 text-text-main">{row.dimension}</td>
                        <td className="p-3 text-text-muted">{row.judgeable}</td>
                        <td className="p-3 text-text-muted">{row.labeled}</td>
                        <td className="p-3 text-text-muted">{row.agreed} of {row.labeled} ({row.pct})</td>
                        <td className="p-3 text-text-muted">{row.interval}</td>
                        <td className="p-3 text-text-muted">{row.errors}</td>
                        <td className="p-3 text-text-muted">{row.declined}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="space-y-2 text-text-muted mt-4">
                {ACCURACY_ROWS.map((row) => (
                  <li key={row.dimension} className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>{row.dimension}.</strong> {row.note} <span className="text-xs">Source: {row.source}.</span></span></li>
                ))}
              </ul>
              <p className="text-text-muted leading-relaxed mt-4">
                Two more limits on this study. It was captured through a since-retired in-app browser path of YouTube's mobile site at 384 by 848 pixels and scored on lossless frames without the on-device text channel the shipped recording path adds; re-scored with production-shaped input (JPEG plus recognized text), tone coverage fell from 7 of 40 to 4 of 40, so richer input did not raise it (GOLDSET_SCORING_AND_HEADROOM.md, section 4). And agreement with one annotator is agreement, not truth: with a single rater there is no measure of how much two careful people would differ.
              </p>

              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">2. Stability reruns: does the reader say the same thing twice?</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                On 7 August 2026 the repository's stability harness sent {f.stabilityFrames} feed frames of the same YouTube capture through the app's exact prompt, schema and generation settings {f.stabilityRuns} times each (eval/results/eval-1786156691961.json). Every run returned the same number of posts on every frame. Against each item's modal label, over {f.stabilityFlips.observations} item observations per dimension, the labels changed {f.stabilityFlips.ads} time for ads, {f.stabilityFlips.origin} for suggested vs followed, {f.stabilityFlips.politics} for politics and {f.stabilityFlips.tone} times for tone. A run over the whole recording the same day found one frame of two sampled outside the feed region that was genuinely unstable (two to four items across runs, tone flipping in 6 of 20 observations), so the reading is repeatable, not uniformly repeatable. Stability is not accuracy: a reader that is wrong the same way every time scores perfectly here.
              </p>

              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">3. Same-session control runs when the instrument changes</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                The model is a third-party service under a name Google resolves, and the prompt can change on our side. Every scan therefore carries its instrument version (a revision counter, the model identifier and a hash over the prompt surface), and the protocol for changing the instrument re-scores the committed gold set under the old and the new instrument in one session, both arms against the same labels, before the change ships (METHODOLOGY_EVIDENCE.md, section 11). One change has that evidence: on 10 August 2026 the reader was required to answer the politics question. Both arms ran back to back, lossless frames, no text channel:
              </p>
              <div className="overflow-x-auto rounded-xl border border-border-light">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="p-3 font-semibold text-text-main">Dimension</th>
                      <th className="p-3 font-semibold text-text-main">Control (before)</th>
                      <th className="p-3 font-semibold text-text-main">Current (after)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {BRIDGING_ROWS.map(([dimension, before, after]) => (
                      <tr key={dimension} className="border-t border-border-light align-top">
                        <td className="p-3 text-text-main">{dimension}</td>
                        <td className="p-3 text-text-muted">{before}</td>
                        <td className="p-3 text-text-muted">{after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-text-muted leading-relaxed mt-4">
                Read honestly: the change did what it was for (politics coverage from 2 of 54 to 54 of 54); ads, origin, extraction and creator transcription were identical across the two arms; and tone moved without being touched, on counts far below the floor for a point estimate, which was never explained and would have to be under the protocol as it now stands. What no version scheme can close: Google can change what the model name resolves to with no notice and no sign in the app, so every figure here describes the reader as it was measured on the dates given, not the reader running right now. Re-running the harness is cheap and dated result files are kept.
              </p>

              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">4. Simulated no-change data: how often the app cries wolf</h3>
              <p className="text-text-muted leading-relaxed mb-3">
                Two checkups of the same feed differ by sampling luck alone, so a change is reported only when it clears a noise bar. In July 2026 a seeded simulation of 200,000 no-change weeks against the app's own comparison code found the bar then in use (1.5 standard errors) certifying a phantom change on 13 to 15 percent of metrics and, across four metrics, about 43 percent of checkups (PRODUCT_DECISIONS.md, D-54). The bar was raised to 1.96 standard errors with a Sidak ladder (1.96, 2.24, 2.39, 2.49) for one to four metrics, and the trend rule gained a magnitude requirement. Under no change the simulation now shows a pair-level false-alarm chance near 5 percent per checkup across the four metrics, and 1 to 3 percent per metric (4 to 5 percent family-wise) for trends; the test suite re-simulates the null against the production functions on every run and pins trends at or below 5 percent per metric and 8 percent family-wise, and certification at or below 6.5 percent. The price, accepted deliberately: at 30 posts a scan, power against a real 10-point weekly move is in single digits under the four-metric bar, and a 30-versus-30 comparison cannot see below roughly a 30-point swing. So most weeks nothing certifies, and the app says so rather than manufacturing a verdict; sensitivity comes from pooled windows, not a looser bar.
              </p>

              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">5. What has not been validated</h3>
              <ul className="space-y-2 text-text-muted">
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>Five of six feeds.</strong> Instagram, TikTok, X, Facebook and Reddit have never been tested against a real capture, for stability or accuracy. Nothing measured on YouTube carries over to them. Inside the app, an "Accuracy by platform" card will state a per-feed reading only once {f.platformAccuracyFloor} posts on that feed have been labeled by research participants; as of 5 October 2026 no feed had reached that floor, and every row reads "not yet measured".</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>Tone.</strong> The reader labeled 7 of 40 readable posts, never once produced "mixed" on this capture, and the counts are below the floor for a point estimate. It is the least stable dimension as well.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>Inter-rater agreement.</strong> One annotator. Nothing here measures how much two careful people would differ, so none of the agreement figures should be quoted as accuracy against truth.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>Extraction recall.</strong> The person only ever judged items the model proposed, so posts on screen the model never extracted are invisible to the study.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span><strong>Detection of ads, origin labels and political posts.</strong> The capture held four posts with a paid label, none with an origin label and two a person read as political. High agreement there shows the reader did not see things that were not there; it does not show that it finds them when they are.</span></li>
              </ul>
            </section>

            {/* Limitations */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">Known limitations and failure modes</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                These are the ways the instrument can be wrong or can be misread. We would rather you read them here than discover them and conclude we hid them.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">The reader itself can change</h3>
                  <p className="text-text-muted leading-relaxed">
                    What reads a feed is a model under a fixed prompt, and it does change. Every change the app makes is recorded, and each scan carries the version that read it, so a comparison across a change says so instead of running the two together. What cannot be recorded is a change at Google's end.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Confidence differs sharply by dimension</h3>
                  <p className="text-text-muted leading-relaxed">
                    Ad share and the source list rest on labels the platform prints, and a person can check them against the same frames. Topic, politics and tone are the model's readings of meaning; humans disagree about them too, and they should be treated as a described method rather than ground truth. The model may decline to answer tone, and the app leaves such posts out rather than forcing a guess, but that does not make the guesses it does take correct.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Unlabeled ads and suggestions</h3>
                  <p className="text-text-muted leading-relaxed">
                    The app counts the labels platforms print. A paid post without a label counts as a plain post, so ad shares are floors, not ceilings. Platforms change their labeling; the hints above name what the reader is told to look for today.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Feeds that never label origin</h3>
                  <p className="text-text-muted leading-relaxed">
                    Where a platform prints no origin label per post, the suggested-vs-followed split comes from which feed was scanned. That is an inference, and every figure built that way is marked inferred where it appears.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">A single scan is a small window</h3>
                  <p className="text-text-muted leading-relaxed">
                    A scan sees what the user scrolled in one sitting, from the top of the feed at that moment. Ad load and content mix vary by time of day and how far one scrolls. One scan tells you what appeared in that window, not what the feed is like in general, and the app's copy is written to say so; percentages on small denominators move a lot from scan to scan.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Extraction can miss or mangle posts</h3>
                  <p className="text-text-muted leading-relaxed">
                    Blurry frames, fast scrolling, partially visible posts and unusual layouts reduce extraction quality. The model reports lower confidence on such frames and marks cut-off posts as partial, but it can still miss items, merge items or misread text. The AI-content disclosure field is the weakest in the schema and rarely populates. Occasionally the model's own safety filters refuse a frame; the app records that rather than substituting anything.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Tone is a read of the post, not of you</h3>
                  <p className="text-text-muted leading-relaxed">
                    Nothing here measures how anything made anyone feel.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-text-main mb-2">The instrument sees outputs, not causes</h3>
                  <p className="text-text-muted leading-relaxed">
                    Why a post was picked never appears on the screen, so it is never in the data. AlgorithmLens measures what appeared; it cannot see why the platform chose it, and it does not claim to. Any sentence about platform intent is outside what this instrument can support.
                  </p>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-text-main mt-6 mb-2">What the numbers do not license</h3>
              <ul className="space-y-2 text-text-muted">
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>No claim about a platform's intent, and no claim about why a feed looks as it does.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>No claim about what anyone believes or how they vote.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>No comparison between people, and no population-level claim about feeds today: scans exist only for people who chose to install a transparency tool and scan.</span></li>
                <li className="flex gap-3"><span className="flex-shrink-0 mt-1">•</span><span>No accuracy claim beyond the one YouTube session above, read by one person, and none at all about finding ads, politics or origin labels, because that capture contained almost none. Stability numbers must never be quoted as accuracy.</span></li>
              </ul>
              <p className="text-text-muted leading-relaxed mt-4">
                We would rather show you nothing than a shaky number.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">Questions and corrections</h2>
              <p className="text-text-muted leading-relaxed">
                If you are evaluating this instrument for reporting or research and want the response schema, the aggregation code, a test build, or answers about anything on this page, contact privacy@algorithmlens.com. If you find an error on this page, or a difference between it and what the app does, we will correct it and note the correction. This page changes whenever the method changes.
              </p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
