import React, { useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';

/**
 * TalkToAlgorithmSection - Premium invitation to reflect on your feed
 *
 * Design principles:
 * - Single-column editorial layout (constrained width, centered)
 * - Premium invitation card that feels intentional and calm
 * - Generous whitespace and typography (slow the reader down)
 * - Uses only blue accent (algorithm tab semantic color)
 * - Positioned directly after hero insight for prominence
 */

const EXAMPLE_PROMPTS = [
  "Why do these topics keep showing up?",
  "What reinforces this pattern?",
  "How might this change over time?",
];

/**
 * PremiumInvitationCard - The main invitation to start a conversation
 * Feels like an invitation to reflect, not a chat widget
 */
const PremiumInvitationCard = ({ onStartConversation, onSelectPrompt }) => {
  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'linear-gradient(165deg, rgba(37, 99, 235, 0.05) 0%, rgba(37, 99, 235, 0.10) 50%, rgba(37, 99, 235, 0.06) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.12)',
        padding: 'clamp(2rem, 5vw, 3rem)',
      }}
    >
      {/* Premium label - subtle, positioned top */}
      <div className="flex items-center gap-2 mb-6">
        <Sparkles size={14} style={{ color: 'rgba(37, 99, 235, 0.5)' }} />
        <p
          className="uppercase"
          style={{
            color: 'rgba(37, 99, 235, 0.55)',
            fontSize: '10px',
            letterSpacing: '0.12em',
            fontWeight: 600,
          }}
        >
          Premium reflection
        </p>
      </div>

      {/* Main title - clear and inviting */}
      <h3
        className="font-bold text-text-main mb-4"
        style={{
          fontSize: 'clamp(1.5rem, 3vw, 1.875rem)',
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        Talk to Your Algorithm
      </h3>

      {/* Explanatory paragraph - calm, reassuring, non-judgmental */}
      <p
        className="text-text-muted mb-8"
        style={{
          fontSize: '15px',
          lineHeight: 1.8,
          maxWidth: '480px',
        }}
      >
        This is a space to explore what your feed reveals—and what it might mean.
        Not a chatbot, not a diagnosis. Just a thoughtful way to reflect together.
      </p>

      {/* Example prompts - soft pills, not buttons */}
      <div className="mb-8">
        <p
          className="mb-4"
          style={{
            color: 'rgba(37, 99, 235, 0.5)',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          You might ask…
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((prompt, index) => (
            <button
              key={index}
              onClick={() => onSelectPrompt(prompt)}
              className="rounded-full transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(37, 99, 235, 0.1)',
                padding: '0.5rem 1rem',
                fontSize: '13px',
                color: '#475569',
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Primary CTA - with Premium indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onStartConversation}
          className="inline-flex items-center gap-2.5 bg-primary-blue text-white rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5"
          style={{
            padding: '0.875rem 1.75rem',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(37, 99, 235, 0.25)',
          }}
        >
          <MessageCircle size={18} />
          Start a conversation
        </button>
        <span
          className="rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            color: 'rgba(37, 99, 235, 0.65)',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.02em',
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
        background: 'linear-gradient(165deg, rgba(37, 99, 235, 0.04) 0%, rgba(37, 99, 235, 0.08) 50%, rgba(37, 99, 235, 0.05) 100%)',
        border: '1px solid rgba(37, 99, 235, 0.12)',
      }}
    >
      {/* Conversation header - minimal, with premium label */}
      <div
        className="flex items-center justify-between border-b"
        style={{
          borderColor: 'rgba(37, 99, 235, 0.08)',
          padding: '1rem 1.5rem',
        }}
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={16} style={{ color: 'rgba(37, 99, 235, 0.5)' }} />
          <p
            className="font-medium"
            style={{
              color: 'rgba(37, 99, 235, 0.7)',
              fontSize: '13px',
            }}
          >
            Talk to Your Algorithm
          </p>
        </div>
        <span
          className="rounded-full px-2 py-0.5"
          style={{
            background: 'rgba(37, 99, 235, 0.08)',
            color: 'rgba(37, 99, 235, 0.55)',
            fontSize: '10px',
            fontWeight: 600,
          }}
        >
          Premium
        </span>
      </div>

      {/* Messages area - generous spacing */}
      <div
        style={{
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          minHeight: '280px',
          maxHeight: '450px',
          overflowY: 'auto',
        }}
      >
        {messages.length === 0 && (
          <div className="text-center" style={{ padding: '2.5rem 0' }}>
            <p
              className="text-text-muted italic"
              style={{ fontSize: '14px', lineHeight: 1.7 }}
            >
              Type a question below to begin…
            </p>
          </div>
        )}

        {/* Messages with generous vertical rhythm */}
        <div className="space-y-8">
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === 'user' ? 'text-right' : 'text-left'}
            >
              {/* Role label - small, muted */}
              <p
                className="mb-2 font-medium"
                style={{
                  color: message.role === 'user' ? '#94A3B8' : 'rgba(37, 99, 235, 0.55)',
                  fontSize: '11px',
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
                    fontSize: message.role === 'user' ? '14px' : '15px',
                    lineHeight: 1.85,
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
          <div className="text-left mt-8">
            <p
              className="mb-2 font-medium"
              style={{
                color: 'rgba(37, 99, 235, 0.55)',
                fontSize: '11px',
                letterSpacing: '0.02em',
              }}
            >
              Your feed reflects
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(37, 99, 235, 0.35)',
                }}
              />
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(37, 99, 235, 0.35)',
                  animationDelay: '0.2s',
                }}
              />
              <span
                className="rounded-full animate-pulse"
                style={{
                  width: '6px',
                  height: '6px',
                  background: 'rgba(37, 99, 235, 0.35)',
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input area - clean, uncluttered */}
      <form
        onSubmit={handleSubmit}
        className="border-t"
        style={{
          borderColor: 'rgba(37, 99, 235, 0.08)',
          background: 'rgba(255, 255, 255, 0.5)',
          padding: '1rem 1.5rem',
        }}
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your feed…"
            className="flex-1 rounded-xl text-text-main placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary-blue/15 transition-all"
            style={{
              padding: '0.75rem 1rem',
              fontSize: '14px',
              background: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(37, 99, 235, 0.1)',
            }}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="rounded-xl transition-all duration-200 disabled:opacity-35"
            style={{
              padding: '0.75rem',
              background: inputValue.trim() ? '#2563EB' : 'rgba(37, 99, 235, 0.08)',
              color: inputValue.trim() ? 'white' : 'rgba(37, 99, 235, 0.35)',
            }}
          >
            <Send size={18} />
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
