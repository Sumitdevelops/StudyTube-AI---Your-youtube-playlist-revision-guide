'use client';

import { useState, useRef } from 'react';

export default function SearchBar({ onSearch, isLoading, disabled, playlistTitle = '', channelTitle = '', videos = [] }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const isValid = query.trim().length >= 2 && /[a-zA-Z0-9]/.test(query.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (isValid && !isLoading && !disabled) {
      onSearch(trimmed);
    }
  };

  // Dynamic, playlist-specific suggestions matching Stitch prompt chips
  const getSuggestions = () => {
    const titleLower = (playlistTitle || '').toLowerCase();

    if (titleLower.includes('toc') || titleLower.includes('computation') || titleLower.includes('theory')) {
      return [
        { label: 'DFA vs NFA difference ⚡', query: 'Difference between NFA and DFA with examples' },
        { label: 'Chomsky Hierarchy table 🧠', query: 'Explain Chomsky Hierarchy grammar types and automata' },
        { label: 'Closure Properties 🚩', query: 'Closure properties of regular languages under union and concatenation' },
        { label: 'Pumping Lemma Proof 📐', query: 'How does pumping lemma prove a language is not regular?' },
      ];
    }

    if (titleLower.includes('dsa') || titleLower.includes('patterns') || titleLower.includes('neetcode')) {
      return [
        { label: 'Two Pointer Pattern ⚡', query: 'Explain two pointer pattern and time complexity' },
        { label: 'Sliding Window Template 🧠', query: 'Sliding window technique with fixed and dynamic sizes' },
        { label: 'Dynamic Programming Steps 📐', query: 'Memoization vs Tabulation in Dynamic Programming' },
        { label: 'Binary Search Edge Cases 🚩', query: 'Binary search boundary conditions and off-by-one errors' },
      ];
    }

    // Dynamic suggestions derived from the active playlist's video titles
    if (videos && videos.length > 0) {
      const generated = [];
      for (const v of videos.slice(0, 10)) {
        if (!v.title) continue;
        const clean = v.title
          .replace(/^(lecture|episode|lec|ep)[\s\d:.-]+/i, '')
          .replace(/\|.*$/g, '')
          .replace(/-.*$/g, '')
          .trim();

        if (clean.length > 5 && clean.length < 35 && !generated.some(g => g.label.includes(clean))) {
          generated.push({ label: `${clean} 💡`, query: `Explain ${clean} in detail with key takeaways` });
        }
        if (generated.length >= 4) break;
      }
      if (generated.length > 0) return generated;
    }

    return [
      { label: 'Summarize Key Topics ⚡', query: 'Summarize key topics and main takeaways in this course' },
      { label: 'Important Exam Concepts 🧠', query: 'What are the most important exam questions from this playlist?' },
      { label: 'First Lecture Overview 📝', query: 'Explain the concepts introduced in the first video' },
    ];
  };

  const suggestions = getSuggestions();

  return (
    <div className="search-bar-card stitch-card animate-pop-in">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-field-wrapper">
          <span className="search-icon-symbol">⚡</span>
          <input
            ref={inputRef}
            className="search-input-field"
            type="text"
            placeholder={
              disabled
                ? 'Select a course to ask questions...'
                : playlistTitle
                  ? `Ask anything from ${playlistTitle}...`
                  : 'Ask any doubt from this playlist...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading || disabled}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="clear-btn"
              title="Clear question"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="clay-button-primary search-action-btn"
          disabled={isLoading || disabled || !isValid}
        >
          {isLoading ? (
            <>
              <span className="spin-indicator" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <span>Ask AI</span>
              <span className="btn-arrow">→</span>
            </>
          )}
        </button>
      </form>

      {/* High-Yield Suggestion Chips */}
      {!disabled && !query && (
        <div className="chips-container">
          <span className="chips-hint">HIGH-YIELD PROMPTS:</span>
          <div className="chips-row">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                className="high-yield-chip"
                onClick={() => {
                  setQuery(s.query);
                  if (onSearch) onSearch(s.query);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .search-bar-card {
          padding: 16px 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-form {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .input-field-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon-symbol {
          position: absolute;
          left: 14px;
          font-size: 1rem;
          color: var(--accent-primary);
          pointer-events: none;
        }

        .search-input-field {
          width: 100%;
          padding: 12px 34px 12px 40px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          font-size: 0.95rem;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input-field:focus {
          background: var(--bg-card);
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-primary-surface);
        }

        .clear-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          cursor: pointer;
        }

        .search-action-btn {
          min-width: 120px;
          padding: 11px 20px;
          border-radius: var(--radius-full);
          font-size: 0.88rem;
          font-weight: 800;
          opacity: ${isLoading || disabled || !isValid ? 0.6 : 1};
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          white-space: nowrap;
          cursor: ${isLoading || disabled || !isValid ? 'not-allowed' : 'pointer'};
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-arrow {
          font-size: 1.05rem;
          transition: transform 0.18s ease;
        }

        .search-action-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(2px);
        }

        .spin-indicator {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .chips-container {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chips-hint {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .chips-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 2px 0;
        }
        .chips-row::-webkit-scrollbar {
          display: none;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .search-bar-card {
            padding: 12px 14px;
          }

          .search-action-btn {
            min-width: 90px;
            padding: 10px 14px;
            font-size: 0.82rem;
          }

          .chips-container {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }
      `}</style>
    </div>
  );
}
