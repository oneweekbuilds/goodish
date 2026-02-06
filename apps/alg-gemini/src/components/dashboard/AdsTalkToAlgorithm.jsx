import React, { useState, useCallback } from 'react';
import { MessageCircle, Send, Sparkles, Lock, ShieldCheck, MessageSquare, EyeOff, AlertCircle, ChevronDown, Database } from 'lucide-react';
import { useAdsTalkToAlgorithm, useAdsEvidenceBundle } from '../../hooks/useEvidenceBundle';

/**
 * AdsTalkToAlgorithm - Evidence-bound Talk to Your Algorithm for Ads & Influence tab
 *
 * Response structure (per accuracy_contract.md):
 * 1. What we observed (must cite 2-4 specific Evidence Bundle fields)
 * 2. What it might mean (2-3 labeled hypotheses; no certainty)
 * 3. What we cannot know (must cite limits)
 * 4. What you can try (2-4 non-judgmental, optional actions)
 *
 * The Talk responses are deterministic templates filled from evidence,
 * not generic AI chat. No external providers are used in this step.
 */

// Green theme constants (matching TalkToAlgorithmSection)
const TALK_THEME = {
  accent: '#10B981',
  accentRgb: '16, 185, 129',
  solidBackground: '#ECFDF5',
  solidBorder: '1px solid #6EE7B7',
  solidShadow: '0 4px 32px rgba(16, 185, 129, 0.12)',
};

// Tab-specific prompts for Ads & Influence
const ADS_PROMPTS = [
  "Why am I seeing these ads?",
  "What do advertisers think I'm interested in?",
  "How can I see fewer promotions?",
];

/**
 * ResponseSection - Renders one section of the 4-part response
 */
const ResponseSection = ({ title, icon, items, type = 'bullets', citedFields }) => {
  const [showCitations, setShowCitations] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6 last:mb-0">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${TALK_THEME.accentRgb}, 0.15)` }}
        >
          {icon}
        </span>
        <h4
          className="text-sm font-semibold"
          style={{ color: TALK_THEME.accent }}
        >
          {title}
        </h4>
      </div>

      {/* Section content */}
      <div className="pl-8">
        {type === 'bullets' && (
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span style={{ color: TALK_THEME.accent }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {type === 'hypotheses' && (
          <div className="space-y-3">
            {items.map((hyp, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{
                    background: `rgba(${TALK_THEME.accentRgb}, 0.1)`,
                    color: TALK_THEME.accent,
                  }}
                >
                  {hyp.label || `H${idx + 1}`}
                </span>
                <p className="text-sm text-slate-700 flex-1">{hyp.text}</p>
              </div>
            ))}
          </div>
        )}

        {type === 'actions' && (
          <div className="space-y-2">
            {items.map((action, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-white"
                style={{ background: `rgba(${TALK_THEME.accentRgb}, 0.05)` }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `rgba(${TALK_THEME.accentRgb}, 0.2)`,
                    color: TALK_THEME.accent,
                  }}
                >
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700">{action}</p>
              </div>
            ))}
          </div>
        )}

        {/* Citations */}
        {citedFields && citedFields.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Database size={10} />
              <span>Evidence sources</span>
              <ChevronDown
                size={10}
                className={`transition-transform ${showCitations ? 'rotate-180' : ''}`}
              />
            </button>
            {showCitations && (
              <div className="mt-2 text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded">
                {citedFields.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * StructuredResponse - Renders the full 4-part response
 */
const StructuredResponse = ({ response }) => {
  if (!response) return null;

  const { what_we_observed, what_it_might_mean, what_we_cannot_know, what_you_can_try } = response;

  return (
    <div className="space-y-1">
      {/* What we observed */}
      <ResponseSection
        title="What we observed"
        icon={<Database size={12} style={{ color: TALK_THEME.accent }} />}
        items={what_we_observed?.facts}
        type="bullets"
        citedFields={what_we_observed?.cited_fields}
      />

      {/* What it might mean */}
      <ResponseSection
        title="What it might mean"
        icon={<AlertCircle size={12} style={{ color: TALK_THEME.accent }} />}
        items={what_it_might_mean?.hypotheses}
        type="hypotheses"
      />

      {/* What we cannot know */}
      <ResponseSection
        title="What we cannot know"
        icon={<ShieldCheck size={12} style={{ color: TALK_THEME.accent }} />}
        items={what_we_cannot_know?.limits}
        type="bullets"
        citedFields={what_we_cannot_know?.cited_fields}
      />

      {/* What you can try */}
      <ResponseSection
        title="What you can try"
        icon={<Sparkles size={12} style={{ color: TALK_THEME.accent }} />}
        items={what_you_can_try?.actions}
        type="actions"
      />
    </div>
  );
};

/**
 * PremiumInvitationCard - The initial invitation card
 */
const PremiumInvitationCard = ({ onStartConversation, onSelectPrompt }) => {
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
        {/* Left: Title + description */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-text-main mb-2"
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}
          >
            Talk to Your Algorithm
          </h3>
          {/* Subtitle */}
          <p
            className="text-slate-500"
            style={{ fontSize: '14px', maxWidth: '400px' }}
          >
            Explore what your ad data reveals about how you're being targeted.
          </p>
        </div>

        {/* Right: Premium conversation badge */}
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
              <Lock size={12} style={{ color: TALK_THEME.accent }} />
            </div>
            <Sparkles size={14} style={{ color: TALK_THEME.accent }} />
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
            Evidence-bound
          </p>
        </div>
      </div>

      {/* Explanatory paragraph */}
      <p
        className="text-text-muted mb-8"
        style={{
          fontSize: '16px',
          lineHeight: 1.8,
          maxWidth: '540px',
        }}
      >
        Ask questions about your ad exposure. Responses are generated strictly from your scan data, no guessing, no generic explanations.
      </p>

      {/* Example prompts */}
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
          {ADS_PROMPTS.map((prompt, index) => (
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
                e.target.style.borderColor = TALK_THEME.accent;
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

      {/* CTA row */}
      <div className="flex flex-wrap items-center gap-5 mb-8">
        {/* Primary CTA */}
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
          <MessageCircle size={22} />
          Start a conversation
        </button>
      </div>

      {/* "What you get" micro row */}
      <div
        className="rounded-xl flex flex-wrap gap-6"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.15)`,
          padding: '1rem 1.5rem',
        }}
      >
        <div className="flex items-center gap-2.5">
          <Database size={14} style={{ color: TALK_THEME.accent }} />
          <span className="text-sm text-slate-600 font-medium">Evidence-based answers</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={14} style={{ color: TALK_THEME.accent }} />
          <span className="text-sm text-slate-600 font-medium">No speculation</span>
        </div>
        <div className="flex items-center gap-2.5">
          <EyeOff size={14} style={{ color: TALK_THEME.accent }} />
          <span className="text-sm text-slate-600 font-medium">Private by default</span>
        </div>
      </div>
    </div>
  );
};

/**
 * ConversationArea - The active conversation view
 */
const ConversationArea = ({
  messages,
  inputValue,
  setInputValue,
  onSendMessage,
  isTyping,
  lastStructuredResponse,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: TALK_THEME.solidBackground,
        border: TALK_THEME.solidBorder,
        boxShadow: TALK_THEME.solidShadow,
      }}
    >
      {/* Conversation header */}
      <div
        className="flex items-center justify-between border-b"
        style={{
          borderColor: `rgba(${TALK_THEME.accentRgb}, 0.1)`,
          padding: '1.25rem 1.75rem',
          background: 'rgba(255, 255, 255, 0.3)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <MessageCircle size={18} style={{ color: TALK_THEME.accent }} />
          <p
            className="font-semibold"
            style={{
              color: TALK_THEME.accent,
              fontSize: '14px',
            }}
          >
            Talk to Your Algorithm · Ads & Influence
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
          Evidence-bound
        </span>
      </div>

      {/* Messages area */}
      <div
        style={{
          padding: 'clamp(2rem, 5vw, 2.5rem)',
          minHeight: '320px',
          maxHeight: '600px',
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <div className="text-center" style={{ padding: '3rem 0' }}>
            <p
              className="text-text-muted italic"
              style={{ fontSize: '15px', lineHeight: 1.7 }}
            >
              Type a question below to begin…
            </p>
          </div>
        )}

        {/* Messages with generous vertical rhythm */}
        <div className="space-y-8">
          {messages.map((message, index) => (
            <div key={index}>
              {/* User message */}
              {message.role === 'user' && (
                <div className="text-right mb-6">
                  <p
                    className="mb-2.5 font-medium"
                    style={{
                      color: '#94A3B8',
                      fontSize: '12px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    You asked
                  </p>
                  <div className="inline-block text-right" style={{ maxWidth: '90%' }}>
                    <p
                      className="text-text-main italic"
                      style={{ fontSize: '15px', lineHeight: 1.9 }}
                    >
                      {message.content}
                    </p>
                  </div>
                </div>
              )}

              {/* Assistant response - structured 4-part */}
              {message.role === 'assistant' && (
                <div className="text-left">
                  <p
                    className="mb-4 font-medium"
                    style={{
                      color: TALK_THEME.accent,
                      fontSize: '12px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Based on your scan data
                  </p>
                  {message.structured ? (
                    <StructuredResponse response={message.structured} />
                  ) : (
                    <p className="text-sm text-slate-700">{message.content}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Typing indicator */}
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
              Analyzing your data
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

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="border-t"
        style={{
          borderColor: '#A7F3D0',
          background: '#FFFFFF',
          padding: '1.5rem 2rem',
        }}
      >
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your ad exposure…"
            className="flex-1 rounded-xl text-text-main placeholder:text-slate-400 focus:outline-none transition-all"
            style={{
              padding: '1rem 1.25rem',
              fontSize: '15px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              boxShadow: 'none',
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(${TALK_THEME.accentRgb}, 0.2)`;
              e.target.style.borderColor = TALK_THEME.accent;
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
 * ReflectiveNote - Subtle grounding note below conversation
 */
const ReflectiveNote = ({ hasMessages }) => {
  if (!hasMessages) return null;

  return (
    <div
      className="text-center"
      style={{
        maxWidth: '400px',
        margin: '1.5rem auto 0',
      }}
    >
      <p
        className="text-text-muted italic"
        style={{
          fontSize: '12px',
          lineHeight: 1.7,
          opacity: 0.7,
        }}
      >
        These responses are generated strictly from your Evidence Bundle,
        based only on what we can observe in your scan data.
      </p>
    </div>
  );
};

/**
 * Main Component - AdsTalkToAlgorithm
 */
const AdsTalkToAlgorithm = ({ scanId }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const { sendQuestion, loading: talkLoading, error: talkError } = useAdsTalkToAlgorithm(scanId);
  const { bundle } = useAdsEvidenceBundle(scanId);

  const handleStartConversation = useCallback(() => {
    setHasStarted(true);
  }, []);

  const handleSelectPrompt = useCallback(async (prompt) => {
    setHasStarted(true);
    await handleSendMessage(prompt);
  }, [scanId]);

  const handleSendMessage = useCallback(async (content) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    // Send to backend
    const response = await sendQuestion(content);

    if (response) {
      // Add assistant response with structured data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response.formatted_text,
        structured: response.response.structured,
      }]);
    } else if (talkError) {
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Unable to generate response: ${talkError}`,
        structured: null,
      }]);
    }
  }, [sendQuestion, talkError]);

  // Don't render if no scanId
  if (!scanId) {
    return null;
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      {!hasStarted ? (
        <PremiumInvitationCard
          onStartConversation={handleStartConversation}
          onSelectPrompt={handleSelectPrompt}
        />
      ) : (
        <>
          <ConversationArea
            messages={messages}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            isTyping={talkLoading}
          />
          <ReflectiveNote hasMessages={messages.length > 0} />
        </>
      )}
    </section>
  );
};

export default AdsTalkToAlgorithm;
