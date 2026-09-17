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
    <div className="hero-banner clay-card-flat animate-pop-in">
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="hero-dismiss-btn"
        title="Minimize banner"
        aria-label="Minimize banner"
      >
        ✕
      </button>

      {/* Top Tagline */}
      <div className="hero-tagline-row">
        <span className="hero-tagline-badge">
          🚀 Video Revision Superpower
        </span>
        <span className="hero-tagline-text">
          Never scrub through 10-hour lecture playlists again.
        </span>
      </div>

      {/* Main Headline */}
      <h2 className="hero-headline">
        Ask any question. AI explains it &{' '}
        <span className="hero-headline-gradient">
          jumps straight to the exact second.
        </span>
      </h2>

      <p className="hero-desc">
        Unlike regular chatbots that just spit out text, StudyTube AI has indexed full course transcripts into vector memory.
        When you search, it provides a concise answer and <b>automatically seeks the video player to the exact moment the professor explains it.</b>
      </p>

      {/* 3 Step Feature Grid */}
      <div className="hero-steps-grid">
        {/* Step 1 */}
        <div className="clay-card-flat hero-step-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              1. Search Any Concept
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Type any exam topic, doubt, or theorem from the syllabus.
          </p>
        </div>

        {/* Step 2 */}
        <div className="clay-card-flat hero-step-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              2. Real-Time AI Answer
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            Groq RAG streams a crisp, structured English summary word-by-word.
          </p>
        </div>

        {/* Step 3 */}
        <div className="clay-card-flat hero-step-card hero-step-highlight">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>🎬</span>
            <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
              3. Auto-Jumps Video!
            </span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            The video player immediately seeks to the exact timestamp and starts playing.
          </p>
        </div>
      </div>

      {/* Interactive Try Live Buttons */}
      <div className="hero-demo-row">
        <span className="hero-demo-label">
          ✨ Try 1-Click Demos:
        </span>

        <div className="hero-pills-container">
          <button
            onClick={() =>
              onTryDemo &&
              onTryDemo(
                'What is DFA and how to construct it?',
                'PLxCzCOWd7aiFM9Lj5G9G_76adtyb4ef7i',
                'TOC(Theory of Computation)'
              )
            }
            className="clay-button hero-pill-btn"
          >
            📐 &ldquo;What is DFA?&rdquo; <span style={{ opacity: 0.75, fontSize: '0.74rem', marginLeft: '4px' }}>• Gate Smashers</span>
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
            className="clay-button hero-pill-btn"
          >
            🧠 &ldquo;What is RAG?&rdquo; <span style={{ opacity: 0.75, fontSize: '0.74rem', marginLeft: '4px' }}>• Padho with Pratyush</span>
          </button>
        </div>

        <button
          onClick={onRequestClick}
          className="clay-badge hero-request-badge"
        >
          ✨ Request a Playlist &rarr;
        </button>
      </div>

      <style jsx>{`
        .hero-banner {
          margin-top: 16px;
          margin-bottom: 20px;
          padding: 24px 28px;
          background: linear-gradient(135deg, #ede6df 0%, #f4ede6 50%, #f7f1eb 100%);
          border-radius: var(--radius-xl);
          box-shadow: var(--clay-shadow);
          position: relative;
          border: 1.5px solid rgba(255, 255, 255, 0.6);
          overflow: hidden;
          max-width: 100%;
          box-sizing: border-box;
        }

        .hero-dismiss-btn {
          position: absolute;
          top: 16px;
          right: 18px;
          background: none;
          border: none;
          font-size: 1.1rem;
          cursor: pointer;
          color: var(--text-muted);
          padding: 4px;
          line-height: 1;
        }

        .hero-tagline-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .hero-tagline-badge {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 900;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .hero-tagline-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .hero-headline {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          line-height: 1.25;
          margin-bottom: 8px;
        }

        .hero-headline-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #d946ef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.55;
          max-width: 820px;
          margin-bottom: 18px;
        }

        .hero-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .hero-step-card {
          padding: 14px 16px;
          background: var(--bg-input);
          border-radius: var(--radius-md);
          box-shadow: var(--clay-shadow-sm);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .hero-step-highlight {
          background: var(--accent-primary-surface);
          border: 1.5px solid var(--accent-primary);
        }

        .hero-demo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 10px;
          border-top: 1px solid rgba(166, 152, 138, 0.2);
        }

        .hero-demo-label {
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--text-primary);
          white-space: nowrap;
        }

        .hero-pills-container {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          flex: 1;
        }

        .hero-pill-btn {
          font-size: 0.78rem;
          padding: 7px 14px;
          font-weight: 800;
          color: var(--text-primary);
          background: #ffffff;
          box-shadow: var(--clay-shadow-sm);
          white-space: nowrap;
          cursor: pointer;
        }

        .hero-request-badge {
          margin-left: auto;
          cursor: pointer;
          border: none;
          font-size: 0.82rem;
          padding: 8px 16px;
          color: #ffffff;
          font-weight: 900;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          border-radius: var(--radius-full);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        @media (max-width: 768px) {
          .hero-banner {
            padding: 16px 14px;
            border-radius: var(--radius-lg);
          }

          .hero-headline {
            font-size: 1.2rem;
          }

          .hero-desc {
            font-size: 0.82rem;
          }

          .hero-steps-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .hero-demo-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .hero-pills-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 8px;
          }

          .hero-pill-btn {
            width: 100%;
            text-align: left;
            padding: 9px 14px;
            font-size: 0.82rem;
            white-space: normal;
          }

          .hero-request-badge {
            margin-left: 0;
            width: 100%;
            text-align: center;
            justify-content: center;
            padding: 10px 16px;
            font-size: 0.85rem;
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
