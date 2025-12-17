import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';

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
const TALK_THEME = {
  accent: '#10B981',
  accentRgb: '16, 185, 129',
  gradient: 'linear-gradient(165deg, rgba(16, 185, 129, 0.06) 0%, rgba(16, 185, 129, 0.12) 50%, rgba(16, 185, 129, 0.07) 100%)',
  gradientLight: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.08))',
  border: 'rgba(16, 185, 129, 0.15)',
  shadow: '0 4px 32px rgba(16, 185, 129, 0.1)',
  shadowButton: '0 6px 24px rgba(16, 185, 129, 0.3)',
};

const EXAMPLE_PROMPTS = [
  "Why do these topics keep showing up?",
  "What reinforces this pattern?",
  "How might this change over time?",
];

/**
 * PremiumInvitationCard - The main invitation to start a conversation
 * Feels like an invitation to reflect, not a chat widget
 * Part 1 Rule B: Uses GREEN theme for premium standout
 */
const PremiumInvitationCard = ({ onStartConversation, onSelectPrompt }) => {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: TALK_THEME.gradient,
        border: `1px solid ${TALK_THEME.border}`,
        padding: 'clamp(2.5rem, 6vw, 4rem)',
        boxShadow: TALK_THEME.shadow,
      }}
    >
      {/* Premium label - more visible, positioned top */}
      <div
        className="inline-flex items-center gap-2 mb-7 rounded-full"
        style={{
          background: `rgba(${TALK_THEME.accentRgb}, 0.12)`,
          padding: '0.625rem 1.25rem',
          border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.2)`,
        }}
      >
        <Sparkles size={15} style={{ color: TALK_THEME.accent }} />
        <p
          className="uppercase"
          style={{
            color: TALK_THEME.accent,
            fontSize: '12px',
            letterSpacing: '0.1em',
            fontWeight: 600,
          }}
        >
          Premium Feature
        </p>
      </div>

      {/* Main title - clear and inviting */}
      <h3
        className="font-bold text-text-main mb-5"
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
        }}
      >
        Talk to Your Algorithm
      </h3>

      {/* Explanatory paragraph - calm, reassuring, non-judgmental */}
      <p
        className="text-text-muted mb-10"
        style={{
          fontSize: '16px',
          lineHeight: 1.8,
          maxWidth: '520px',
        }}
      >
        This is a space to explore what your feed reveals—and what it might mean.
        Not a chatbot, not a diagnosis. Just a thoughtful way to reflect together.
      </p>

      {/* Example prompts - soft pills, not buttons */}
      <div className="mb-10">
        <p
          className="mb-4"
          style={{
            color: `rgba(${TALK_THEME.accentRgb}, 0.7)`,
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          You might ask…
        </p>
        <div className="flex flex-wrap gap-2.5">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.15)`,
                padding: '0.625rem 1.125rem',
                fontSize: '14px',
                color: '#475569',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Primary CTA - larger, with Premium indicator */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={onStartConversation}
          className="inline-flex items-center gap-3 text-white rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          style={{
            backgroundColor: TALK_THEME.accent,
            padding: '1.125rem 2.25rem',
            fontSize: '16px',
            boxShadow: TALK_THEME.shadowButton,
          }}
        >
          <MessageCircle size={22} />
          Start a conversation
        </button>
        <span
          className="rounded-full"
          style={{
            background: TALK_THEME.gradientLight,
            border: `1px solid ${TALK_THEME.border}`,
            color: TALK_THEME.accent,
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.03em',
            padding: '0.5rem 0.875rem',
          }}
        >
          Premium
        </span>
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
      className="rounded-2xl overflow-hidden"
      style={{
        background: TALK_THEME.gradient,
        border: `1px solid ${TALK_THEME.border}`,
        boxShadow: TALK_THEME.shadow,
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
          <MessageCircle size={18} style={{ color: TALK_THEME.accent }} />
          <p
            className="font-semibold"
            style={{
              color: TALK_THEME.accent,
              fontSize: '14px',
            }}
          >
            Talk to Your Algorithm
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
              Type a question below to begin…
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
              {/* Role label - small, muted */}
              <p
                className="mb-2.5 font-medium"
                style={{
                  color: message.role === 'user' ? '#94A3B8' : TALK_THEME.accent,
                  fontSize: '12px',
                  letterSpacing: '0.02em',
                }}
              >
                {message.role === 'user' ? 'You asked' : 'Your feed reflects'}
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
              Your feed reflects
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

      {/* Input area - improved spacing and height */}
      <form
        onSubmit={handleSubmit}
        className="border-t"
        style={{
          borderColor: `rgba(${TALK_THEME.accentRgb}, 0.1)`,
          background: 'rgba(255, 255, 255, 0.6)',
          padding: '1.25rem 1.75rem',
        }}
      >
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your feed…"
            className="flex-1 rounded-xl text-text-main placeholder:text-text-muted/50 focus:outline-none transition-all"
            style={{
              padding: '1rem 1.25rem',
              fontSize: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: `1px solid rgba(${TALK_THEME.accentRgb}, 0.12)`,
              boxShadow: `0 0 0 0 rgba(${TALK_THEME.accentRgb}, 0)`,
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 3px rgba(${TALK_THEME.accentRgb}, 0.15)`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = `0 0 0 0 rgba(${TALK_THEME.accentRgb}, 0)`;
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="rounded-xl transition-all duration-200 disabled:opacity-35"
            style={{
              padding: '1rem 1.125rem',
              background: inputValue.trim() ? TALK_THEME.accent : `rgba(${TALK_THEME.accentRgb}, 0.08)`,
              color: inputValue.trim() ? 'white' : `rgba(${TALK_THEME.accentRgb}, 0.35)`,
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
 * Provides emotional completion to the experience
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
        These reflections are based on patterns we've observed—
        meant to spark awareness, not define you.
      </p>
    </div>
  );
};

/**
 * Main Component - TalkToAlgorithmSection
 * Positioned directly after hero insight, before evidence sections
 */
const TalkToAlgorithmSection = ({ feedData }) => {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Simulated response generation (placeholder for actual AI integration)
  const generateResponse = (question) => {
    // This would be replaced with actual AI/data-driven responses
    const responses = {
      default: "Based on your recent scans, your feed seems to favor content that keeps you engaged through familiar topics. This is common—algorithms optimize for what you've already shown interest in.",
      topics: "The topics that keep showing up are likely tied to your engagement patterns—what you've clicked, watched, or lingered on. Even passive behavior signals interest to the algorithm.",
      reinforce: "Algorithms reinforce patterns by showing you more of what you've engaged with before. Each interaction—even a pause—strengthens that signal. Breaking the cycle requires sustained new behavior.",
      change: "Change happens slowly. Algorithms are designed to resist sudden shifts. Consistently engaging with different content over days or weeks gradually introduces new signals.",
      fitness: "Your feed has shown a consistent pattern of fitness and wellness content. This likely started from a few interactions, and the algorithm has reinforced it over time.",
      political: "The political content in your feed appears somewhat balanced, though there are subtle leanings based on the creators you engage with most.",
      diverse: "To see more diverse content, you might try actively seeking out new topics and engaging with content outside your usual patterns. Algorithms respond to new signals, though it takes time.",
      interests: "Your feed suggests interests in technology, personal growth, and current events. These patterns have been consistent across your recent scans.",
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('topics') || lowerQuestion.includes('showing up') || lowerQuestion.includes('keep seeing')) return responses.topics;
    if (lowerQuestion.includes('reinforce') || lowerQuestion.includes('pattern')) return responses.reinforce;
    if (lowerQuestion.includes('change') || lowerQuestion.includes('over time')) return responses.change;
    if (lowerQuestion.includes('fitness')) return responses.fitness;
    if (lowerQuestion.includes('political') || lowerQuestion.includes('bubble')) return responses.political;
    if (lowerQuestion.includes('diverse') || lowerQuestion.includes('different')) return responses.diverse;
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
