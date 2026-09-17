'use client';

import { useState } from 'react';

export default function HeroBanner({ onTryDemo, onRequestClick }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '12px 0 6px',
        }}
      >
        <button
          onClick={() => setIsDismissed(false)}
          className="clay-badge"
          style={{
            cursor: 'pointer',
            border: 'none',
            fontSize: '0.78rem',
            padding: '6px 14px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            background: 'var(--bg-card)',
            boxShadow: 'var(--clay-shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          💡 How does StudyTube AI work?
        </button>
      </div>
    );
  }

  return (
    <div
      className="clay-card-flat animate-pop-in"
      style={{
        marginTop: '20px',
        marginBottom: '24px',
        padding: '28px 32px',
        background: 'linear-gradient(135deg, #ede6df 0%, #f4ede6 50%, #f7f1eb 100%)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--clay-shadow)',
        position: 'relative',
        border: '1.5px solid rgba(255, 255, 255, 0.6)',
      }}
    >
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        style={{
          position: 'absolute',
          top: '18px',
          right: '20px',
          background: 'none',
          border: 'none',
          fontSize: '1.1rem',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '4px',
          lineHeight: 1,
        }}
        title="Minimize banner"
        aria-label="Minimize banner"
      >
        ✕
      </button>

      {/* Top Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff',
            fontSize: '0.72rem',
            fontWeight: 900,
            padding: '4px 10px',
            borderRadius: '999px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          }}
        >
          🚀 The Video Revision Superpower
        </span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Never scrub through 10-hour lecture playlists again.
        </span>
      </div>

      {/* Main Headline */}
      <h2
        style={{
          fontSize: '1.65rem',
          fontWeight: 900,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          lineHeight: 1.25,
          marginBottom: '8px',
        }}
      >
        Ask any question. AI explains it &{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          jumps straight to the exact second.
        </span>
      </h2>

      <p
        style={{
          fontSize: '0.92rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: '820px',
          marginBottom: '22px',
        }}
      >
        Unlike regular chatbots that just spit out text, StudyTube AI has indexed full course transcripts into vector memory.
        When you search, it provides a concise answer and <b>automatically seeks the video player to the exact moment the professor explains it.</b>
      </p>

      {/* 3 Step Feature Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        {/* Step 1 */}
        <div
          className="clay-card-flat"
          style={{
            padding: '16px 20px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--clay-shadow-sm)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🔍</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              1. Search Any Concept
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Type any exam topic, doubt, or theorem from the syllabus.
          </p>
        </div>

        {/* Step 2 */}
        <div
          className="clay-card-flat"
          style={{
            padding: '16px 20px',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--clay-shadow-sm)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              2. Real-Time AI Answer
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Groq RAG streams a crisp, structured English summary word-by-word.
          </p>
        </div>

        {/* Step 3 */}
        <div
          className="clay-card-flat"
          style={{
            padding: '16px 20px',
            background: 'var(--accent-primary-surface)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--clay-shadow-sm)',
            border: '1.5px solid var(--accent-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '20px' }}>🎬</span>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              3. Auto-Jumps Video!
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            The video player immediately seeks to the exact timestamp and starts playing.
          </p>
        </div>
      </div>

      {/* Interactive Try Live Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '6px',
          borderTop: '1px solid rgba(166, 152, 138, 0.2)',
        }}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
          ✨ Try 1-Click Interactive Demos:
        </span>

        <button
          onClick={() =>
            onTryDemo &&
            onTryDemo(
              'What is DFA and how to construct it?',
              'PLxCzCOWd7aiFM9Lj5G9G_76adtyb4ef7i',
              'TOC(Theory of Computation)'
            )
          }
          className="clay-button"
          style={{
            fontSize: '0.82rem',
            padding: '7px 16px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            boxShadow: 'var(--clay-shadow-sm)',
          }}
        >
          📐 &ldquo;What is DFA?&rdquo; (TOC)
        </button>

        <button
          onClick={() =>
            onTryDemo &&
            onTryDemo(
              'What is RAG and how does it work?',
              'PLW4OpyGE0RdY',
              'AI Engineer In 10 Weeks | No Maths No Statistics | Crack AI Interviews'
            )
          }
          className="clay-button"
          style={{
            fontSize: '0.82rem',
            padding: '7px 16px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            boxShadow: 'var(--clay-shadow-sm)',
          }}
        >
          🧠 &ldquo;What is RAG?&rdquo; (AI Course)
        </button>

        <button
          onClick={onRequestClick}
          className="clay-badge"
          style={{
            marginLeft: 'auto',
            cursor: 'pointer',
            border: 'none',
            fontSize: '0.82rem',
            padding: '7px 14px',
            color: 'var(--accent-primary)',
            fontWeight: 800,
            background: 'var(--accent-primary-surface)',
          }}
        >
          ✨ Request a Playlist &rarr;
        </button>
      </div>
    </div>
  );
}
