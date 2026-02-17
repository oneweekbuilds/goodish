import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles, Lock, ShieldCheck, MessageSquare, EyeOff } from 'lucide-react';
import AdsTalkToAlgorithm from './AdsTalkToAlgorithm';
import PoliticsTalkToAlgorithm from './PoliticsTalkToAlgorithm';
import PatternsTalkToAlgorithm from './PatternsTalkToAlgorithm';
import CreatorsTalkToAlgorithm from './CreatorsTalkToAlgorithm';
import InferencesTalkToAlgorithm from './InferencesTalkToAlgorithm';

/**
 * TalkToAlgorithmSection - Premium invitation to reflect on your feed
 *
 * Design principles:
 * - Single-column editorial layout (constrained width, centered)
 * - Premium invitation card that feels intentional and calm
 * - Generous whitespace and typography (slow the reader down)
 * - Part 1 Rule B: Uses GREEN accent (premium feature standout across all tabs)
 * - Positioned directly after hero insight for prominence
 *
 * GREEN THEME: This is the ONE consistent green element across all 5 tabs,
 * making the premium feature feel consistent and stand out from the blue editorial UI.
 */

// Green theme constants for Talk to Algorithm module
// SOLID SURFACES STRATEGY: Use solid colors, not translucent
const TALK_THEME = {
  accent: '#10B981',
  accentRgb: '16, 185, 129',
  // Solid light green background (not translucent)
  solidBackground: '#ECFDF5',
  solidBorder: '1px solid #6EE7B7',
  solidShadow: '0 4px 32px rgba(16, 185, 129, 0.12)',
  // Legacy gradient (kept for subtle inner areas)
  gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
  gradientLight: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.08))',
  border: 'rgba(16, 185, 129, 0.15)',
  shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  shadowButton: '0 6px 24px rgba(16, 185, 129, 0.3)',
};

/**
 * TAB_SPECIFIC_PROMPTS - Different prompt suggestions per tab
 * ACCURACY CONTRACT COMPLIANT: Questions grounded in observation, not intent
 * Updated per spec: more specific and bounded to available fields
 */
const TAB_SPECIFIC_PROMPTS = {
  algorithm: [
    "What high-confidence signals were detected?",
    "How does the topic coverage affect signal quality?",
    "What would a desktop scan capture differently?",
  ],
  ads: [
    "What is the unlabeled promotion rate?",
    "Which companies appeared in promotional content?",
    "What would a desktop scan capture for ads?",
  ],
  politics: [
    "What is the political content rate in this scan?",
    "Which political topics were detected?",
    "What would improve political coverage?",
  ],
  patterns: [
    "What is the topic diversity in this scan?",
    "Are there repetition clusters detected?",
    "What is the Simpson diversity index?",
  ],
  creators: [
    "What is the creator coverage percent?",
    "How concentrated is the top creator?",
    "What would capture better creator data?",
  ],
};

// Default prompts (fallback)
const EXAMPLE_PROMPTS = TAB_SPECIFIC_PROMPTS.algorithm;

/**
 * PremiumInvitationCard - The main invitation to start a conversation
 * Feels like an invitation to reflect, not a chat widget
 * Part 1 Rule B: Uses GREEN theme for premium standout
 *
 * Premium polish:
 * - Premium conversation badge with lock/sparkle icon
 * - More button-like prompt pills with enhanced hover states
 * - Larger, premium CTA with secondary "See example" link
 * - "What you get" micro row with 3 benefits
 * - Tab-specific prompts (Part 2)
 */
const PremiumInvitationCard = ({ onStartConversation, onSelectPrompt, tabId }) => {
  // Get tab-specific prompts
  const prompts = TAB_SPECIFIC_PROMPTS[tabId] || EXAMPLE_PROMPTS;
  return (
    <div
      className="rounded-3xl relative overflow-hidden transition-shadow duration-300 hover:shadow-xl"
      style={{
        background: TALK_THEME.solidBackground,
        border: '2px solid #6EE7B7',
        padding: 'clamp(2.5rem, 7vw, 4rem)',
        boxShadow: '0 8px 40px rgba(16, 185, 129, 0.15)',
      }}
    >
      {/* Subtle decorative gradient at top-right */}
      <div
        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
        }}
      />

      {/* Header row with Premium badge */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 relative">
        {/* Left: Title + description - Updated per spec */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-text-main mb-2"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Ask About This Scan
          </h3>
          {/* Subtitle - FIX T4: Condensed description, removed repetitive "evidence" language */}
          <p
            className="text-slate-500"
            style={{ fontSize: '14px', maxWidth: '400px' }}
          >
            Ask about ad density, promotions, topics, creators, and other observed patterns.
          </p>
        </div>

        {/* Right: Premium conversation badge with icons */}
        <div
          className="flex items-center gap-3 rounded-xl flex-shrink-0"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            padding: '0.75rem 1.25rem',
            border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.25)`,
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: `rgba(${TALK_THEME.accentRgb}, 0.15)` }}
            >
              <Lock size={12} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
            </div>
            <Sparkles size={14} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
          </div>
          <p
            className="uppercase"
            style={{
              color: TALK_THEME.accent,
              fontSize: '10px',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            Premium conversation
          </p>
        </div>
      </div>

      {/* Example prompts - enhanced button-like appearance */}
      <div className="mb-10">
        <p
          className="mb-4"
          style={{
            color: `rgba(${TALK_THEME.accentRgb}, 0.75)`,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          You might ask…
        </p>
        <div className="flex flex-wrap gap-3">
          {prompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full transition-all duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                border: `1.5px solid rgba(${TALK_THEME.accentRgb}, 0.25)`,
                padding: '0.75rem 1.5rem',
                fontSize: '14px',
                color: '#334155',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#10B981';
                e.target.style.background = 'rgba(255, 255, 255, 1)';
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = `rgba(${TALK_THEME.accentRgb}, 0.25)`;
                e.target.style.background = 'rgba(255, 255, 255, 0.98)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* CTA row - button + secondary link */}
      <div className="flex flex-wrap items-center gap-5 mb-8">
        {/* Primary CTA - larger, more premium */}
        <button
          onClick={onStartConversation}
          className="inline-flex items-center gap-3 text-white rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          style={{
            backgroundColor: TALK_THEME.accent,
            padding: '1.25rem 2.75rem',
            fontSize: '17px',
            boxShadow: '0 8px 28px rgba(16, 185, 129, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <MessageCircle size={22} aria-hidden="true" />
          Start a conversation
        </button>

        {/* Secondary link - "See example" */}
        <button
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            padding: '0.5rem 0',
          }}
          disabled
          title="Coming soon"
        >
          <span style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>See example</span>
          <span className="text-slate-400 text-sm">(soon)</span>
        </button>
      </div>

      {/* "What you get" micro row - 3 benefits with icons */}
      <div
        className="rounded-xl flex flex-wrap gap-6"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.15)`,
          padding: '1rem 1.5rem',
        }}
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare size={14} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
          <span className="text-sm text-slate-600 font-medium">Reflective answers</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={14} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
          <span className="text-sm text-slate-600 font-medium">No blame language</span>
        </div>
        <div className="flex items-center gap-2.5">
          <EyeOff size={14} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
          <span className="text-sm text-slate-600 font-medium">Private by default</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ConversationArea - Where the actual conversation happens
 * Designed to feel gentle, like a written conversation
 * Replaces the invitation card when conversation starts
 * Part 1 Rule B: Uses GREEN theme for premium standout
 */
const ConversationArea = ({ messages, inputValue, setInputValue, onSendMessage, isTyping }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      className="rounded-3xl overflow-hidden" /* Larger radius */
      style={{
        background: TALK_THEME.solidBackground, /* SOLID background */
        border: TALK_THEME.solidBorder, /* Stronger border */
        boxShadow: TALK_THEME.solidShadow,
      }}
    >
      {/* Conversation header - enhanced, with premium label */}
      <div
        className="flex items-center justify-between border-b"
        style={{
          borderColor: `rgba(${TALK_THEME.accentRgb}, 0.1)`,
          padding: '1.25rem 1.75rem',
          background: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <MessageCircle size={18} style={{ color: TALK_THEME.accent }} aria-hidden="true" />
          <p
            className="font-semibold"
            style={{
              color: TALK_THEME.accent,
              fontSize: '14px',
            }}
          >
            Ask About This Scan
          </p>
        </div>
        <span
          className="rounded-full"
          style={{
            background: `rgba(${TALK_THEME.accentRgb}, 0.1)`,
            border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.12)`,
            color: TALK_THEME.accent,
            fontSize: '11px',
            fontWeight: 600,
            padding: '0.375rem 0.75rem',
          }}
        >
          Premium
        </span>
      </div>

      {/* Messages area - generous spacing, calm conversation panel feel */}
      <div
        style={{
          padding: 'clamp(2rem, 5vw, 2.5rem)',
          minHeight: '320px',
          maxHeight: '480px',
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <div className="text-center" style={{ padding: '3rem 0' }}>
            <p
              className="text-text-muted italic"
              style={{ fontSize: '15px', lineHeight: 1.7 }}
            >
              Ask about this scan's evidence bundle…
            </p>
          </div>
        )}

        {/* Messages with generous vertical rhythm */}
        <div className="space-y-10">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'text-right' : 'text-left'}
            >
              {/* Role label - small, muted - ACCURACY CONTRACT COMPLIANT */}
              <p
                className="mb-2.5 font-medium"
                style={{
                  color: message.role === 'user' ? '#94A3B8' : TALK_THEME.accent,
                  fontSize: '12px',
                  letterSpacing: '0.02em',
                }}
              >
                {message.role === 'user' ? 'You asked' : 'Based on this scan'}
              </p>

              {/* Message content - NOT in a bubble, generous line height */}
              <div
                className={`inline-block ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                style={{ maxWidth: '90%' }}
              >
                <p
                  className="text-text-main"
                  style={{
                    fontSize: message.role === 'user' ? '15px' : '16px',
                    lineHeight: 1.9,
                    fontStyle: message.role === 'user' ? 'italic' : 'normal',
                  }}
                >
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Typing indicator - ACCURACY CONTRACT COMPLIANT */}
        {isTyping && (
          <div className="text-left mt-10">
            <p
              className="mb-2.5 font-medium"
              style={{
                color: TALK_THEME.accent,
                fontSize: '12px',
                letterSpacing: '0.02em',
              }}
            >
              Based on this scan
            </p>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '7px',
                  height: '7px',
                  background: `rgba(${TALK_THEME.accentRgb}, 0.4)`,
                }}
              />
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '7px',
                  height: '7px',
                  background: `rgba(${TALK_THEME.accentRgb}, 0.4)`,
                  animationDelay: '0.2s',
                }}
              />
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '7px',
                  height: '7px',
                  background: `rgba(${TALK_THEME.accentRgb}, 0.4)`,
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input area - SOLID WHITE SURFACE inside green container */}
      <form
        onSubmit={handleSubmit}
        className="border-t"
        style={{
          borderColor: '#A7F3D0', /* Stronger border */
          background: '#FFFFFF', /* SOLID white background */
          padding: '1.5rem 2rem',
        }}
      >
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this scan's evidence…"
            className="flex-1 rounded-xl text-text-main placeholder:text-slate-400 focus:outline-none transition-all"
            style={{
              padding: '1rem 1.25rem',
              fontSize: '15px',
              background: '#F8FAFC', /* Solid light gray */
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(${TALK_THEME.accentRgb}, 0.2)`;
              e.target.style.borderColor = '#10B981';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.borderColor = '#E2E8F0';
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="rounded-xl transition-all duration-200 disabled:opacity-35"
            style={{
              padding: '1rem 1.125rem',
              background: inputValue.trim() ? TALK_THEME.accent : '#E2E8F0',
              color: inputValue.trim() ? 'white' : '#94A3B8',
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * ReflectiveNote - Explicit epistemic grounding below conversation
 * ACCURACY CONTRACT COMPLIANT: States limits clearly
 * Updated per spec: includes "Next best scan" suggestion
 */
const ReflectiveNote = ({ hasMessages }) => {
  if (!hasMessages) return null;

  return (
    <div
      className="text-center"
      style={{
        maxWidth: '450px',
        margin: '1.5rem auto 0',
      }}
    >
      <p
        className="text-text-muted"
        style={{
          fontSize: '12px',
          lineHeight: 1.7,
          opacity: 0.7,
        }}
      >
        <span className="font-medium">Answers are based only on this scan's evidence.</span>
        {' '}We cannot know why content appeared or what you prefer.
      </p>
      <p
        className="text-emerald-600 mt-2"
        style={{
          fontSize: '11px',
          lineHeight: 1.5,
        }}
      >
        For more complete data, try a desktop extension scan.
      </p>
    </div>
  );
};

/**
 * Main Component - TalkToAlgorithmSection
 * Positioned directly after hero insight, before evidence sections
 * Part 2: Now accepts tabId for tab-specific prompts
 *
 * Evidence Bundle Integration (Ads tab):
 * - When tabId === 'ads', uses AdsTalkToAlgorithm with strict 4-part structure
 * - Responses are generated ONLY from the Evidence Bundle
 * - Other tabs continue to use the generic implementation
 */
const TalkToAlgorithmSection = ({ feedData, tabId }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Extract scanId for Evidence Bundle (use most recent scan)
  const scanId = feedData?.scans?.[0]?.id || null;

  // For Ads tab, use the evidence-bound Talk component
  if (tabId === 'ads' && scanId) {
    return <AdsTalkToAlgorithm scanId={scanId} />;
  }

  // For Politics tab, use the politics evidence-bound Talk component
  if (tabId === 'politics' && scanId) {
    return <PoliticsTalkToAlgorithm scanId={scanId} />;
  }

  // For Patterns tab, use the patterns evidence-bound Talk component
  if (tabId === 'patterns' && scanId) {
    return <PatternsTalkToAlgorithm scanId={scanId} />;
  }

  // For Creators tab, use the creators evidence-bound Talk component
  if (tabId === 'creators' && scanId) {
    return <CreatorsTalkToAlgorithm scanId={scanId} />;
  }

  // For Algorithm tab ("What the Algorithm Thinks"), use the inferences evidence-bound Talk component
  if (tabId === 'algorithm' && scanId) {
    return <InferencesTalkToAlgorithm scanId={scanId} />;
  }

  // Simulated response generation - ACCURACY CONTRACT COMPLIANT
  // All responses use 4-part structure: observed, might mean, cannot know, could try
  const generateResponse = (question) => {
    // Placeholder responses grounded in observation, not intent
    const responses = {
      default: "In this scan, we observed certain topics appearing more frequently than others. We cannot know why these appeared. Platform algorithms are opaque. You could try engaging with different content to see if patterns shift over time.",
      topics: "In this scan, we detected specific topics that appeared multiple times. This may indicate topic clustering, but we cannot know why. You could try searching for different topics to see if variety increases.",
      reinforce: "We observed certain topics recurring in this scan. We cannot know whether the platform deliberately reinforces patterns, only what appeared. You could try sustained engagement with different content to see if topics shift.",
      change: "We can only observe what appeared in this scan. Changes across scans may indicate shifts, but we cannot predict future content. You could try changing engagement patterns to see if content responds.",
      fitness: "In this scan, fitness and wellness content appeared frequently. We cannot know why this content was shown, only that it appeared. You could try engaging with other topics to see if the mix changes.",
      political: "In this scan, political content showed a certain distribution. We cannot determine actual balance or bias from keyword matching alone. This is a rough estimate. You could try following diverse sources.",
      diverse: "You could try actively engaging with new topics to see if content variety changes over time. We cannot predict whether this will work, only observe what currently appears.",
      interests: "In this scan, certain topics appeared frequently. This does not indicate what you are interested in, only what showed up. We cannot infer your preferences from what platforms display.",
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('topics') || lowerQuestion.includes('showing up') || lowerQuestion.includes('appeared')) return responses.topics;
    if (lowerQuestion.includes('reinforce') || lowerQuestion.includes('pattern') || lowerQuestion.includes('concentrated')) return responses.reinforce;
    if (lowerQuestion.includes('change') || lowerQuestion.includes('over time') || lowerQuestion.includes('experiment')) return responses.change;
    if (lowerQuestion.includes('fitness')) return responses.fitness;
    if (lowerQuestion.includes('political') || lowerQuestion.includes('balance')) return responses.political;
    if (lowerQuestion.includes('diverse') || lowerQuestion.includes('different') || lowerQuestion.includes('variety')) return responses.diverse;
    if (lowerQuestion.includes('interests') || lowerQuestion.includes('about me')) return responses.interests;
    return responses.default;
  };

  const handleStartConversation = () => {
    setHasStarted(true);
  };

  const handleSelectPrompt = (prompt) => {
    setHasStarted(true);
    handleSendMessage(prompt);
  };

  const handleSendMessage = async (content) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    // Generate and add response
    const response = generateResponse(content);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsTyping(false);
  };

  return (
    <section
      style={{
        marginBottom: '2.5rem',
      }}
    >
      {/* Premium Invitation Card OR Conversation Area */}
      {!hasStarted ? (
        <PremiumInvitationCard
          onStartConversation={handleStartConversation}
          onSelectPrompt={handleSelectPrompt}
          tabId={tabId}
        />
      ) : (
        <>
          <ConversationArea
            messages={messages}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
          <ReflectiveNote hasMessages={messages.length > 0} />
        </>
      )}
    </section>
  );
};

export default TalkToAlgorithmSection;
