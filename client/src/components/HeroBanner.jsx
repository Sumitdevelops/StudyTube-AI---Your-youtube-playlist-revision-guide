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
          margin: '10px 0 6px',
        }}
      >
        <button
          onClick={() => setIsDismissed(false)}
          className="clay-badge"
          style={{
            cursor: 'pointer',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            padding: '6px 14px',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            background: 'var(--bg-card)',
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
    <div className="hero-banner stitch-card animate-pop-in">
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
        <div className="hero-step-card">
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
        <div className="hero-step-card">
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
        <div className="hero-step-card hero-step-highlight">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '18px' }}>🎬</span>
            <span style={{ fontWeight: 900, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
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
            className="hero-pill-btn"
          >
            📐 &ldquo;What is DFA?&rdquo; <span className="pill-author">• Gate Smashers</span>
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
            className="hero-pill-btn"
          >
            🧠 &ldquo;What is RAG?&rdquo; <span className="pill-author">• Padho with Pratyush</span>
          </button>
        </div>

        <button
          onClick={onRequestClick}
          className="hero-request-badge"
        >
          ✨ Request a Playlist &rarr;
        </button>
      </div>

      <style jsx>{`
        .hero-banner {
          margin-top: 14px;
          margin-bottom: 18px;
          padding: 22px 26px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          position: relative;
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          max-width: 100%;
          box-sizing: border-box;
          transition: background-color 0.25s ease, border-color 0.25s ease;
        }

        :global([data-theme="dark"]) .hero-banner {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border-color: var(--border-subtle);
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
          transition: color 0.18s ease;
        }

        .hero-dismiss-btn:hover {
          color: var(--text-primary);
        }

        .hero-tagline-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }

        .hero-tagline-badge {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .hero-tagline-text {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .hero-headline {
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          line-height: 1.25;
          margin-bottom: 8px;
        }

        .hero-headline-gradient {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-desc {
          font-size: 0.86rem;
          color: var(--text-secondary);
          line-height: 1.55;
          max-width: 820px;
          margin-bottom: 16px;
        }

        .hero-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .hero-step-card {
          padding: 12px 16px;
          background: var(--bg-input);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          transition: all 0.2s ease;
        }

        .hero-step-highlight {
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
        }

        .hero-demo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding-top: 12px;
          border-top: 1px solid var(--border-subtle);
        }

        .hero-demo-label {
          font-size: 0.8rem;
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
          font-weight: 700;
          color: var(--text-primary);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
        }

        .hero-pill-btn:hover {
          background: var(--accent-primary-surface);
          border-color: var(--accent-primary-border);
          color: var(--accent-primary);
          transform: translateY(-1px);
        }

        .pill-author {
          opacity: 0.75;
          font-size: 0.72rem;
          margin-left: 4px;
        }

        .hero-request-badge {
          margin-left: auto;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.25);
          font-size: 0.8rem;
          padding: 7px 14px;
          color: #ffffff;
          font-weight: 800;
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          border-radius: var(--radius-full);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          white-space: nowrap;
          transition: all 0.18s ease;
        }

        .hero-request-badge:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .hero-banner {
            padding: 16px 14px;
            border-radius: var(--radius-lg);
          }

          .hero-headline {
            font-size: 1.15rem;
          }

          .hero-desc {
            font-size: 0.8rem;
          }

          .hero-steps-grid {
            grid-template-columns: 1fr;
            gap: 8px;
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
            padding: 9px 12px;
            font-size: 0.8rem;
            white-space: normal;
          }

          .hero-request-badge {
            margin-left: 0;
            width: 100%;
            text-align: center;
            justify-content: center;
            padding: 9px 14px;
            font-size: 0.82rem;
            display: flex;
          }
        }
      `}</style>
    </div>
  );
}
