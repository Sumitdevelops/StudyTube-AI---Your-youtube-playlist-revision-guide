'use client';

import { useState, useRef, useEffect } from 'react';

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

  // Dynamic, playlist-specific suggestions
  const getSuggestions = () => {
    const titleLower = (playlistTitle || '').toLowerCase();

    if (titleLower.includes('toc') || titleLower.includes('computation') || titleLower.includes('theory')) {
      return [
        'What is DFA and how to construct it?',
        'Difference between NFA and DFA',
        'Explain Regular Expressions in TOC',
        'What is a Turing Machine?',
      ];
    }

    if (titleLower.includes('ai engineer') || titleLower.includes('langgraph') || titleLower.includes('rag')) {
      return [
        'What is RAG and how does it work?',
        'Explain LangGraph agents and nodes',
        'How do tokens and embeddings work?',
        'Prompt engineering techniques',
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

        if (clean.length > 5 && clean.length < 40 && !generated.some(g => g.includes(clean))) {
          generated.push(`Explain ${clean}`);
        }
        if (generated.length >= 4) break;
      }
      if (generated.length > 0) return generated;
    }

    return [
      'Summarize key topics in this playlist',
      'What are the core concepts covered?',
      'Explain the first video',
    ];
  };

  const suggestions = getSuggestions();

  return (
    <div className="search-bar-container clay-card-flat animate-pop-in">
      <form onSubmit={handleSubmit} className="search-form">
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            className="clay-input search-input"
            type="text"
            placeholder={
              disabled
                ? 'Index a playlist first...'
                : playlistTitle
                  ? `Ask ${playlistTitle}${channelTitle ? ` (${channelTitle})` : ''} AI Tutor anything...`
                  : 'Ask anything about topics in this playlist...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading || disabled}
          />

          <span className="search-icon">
            🔍
          </span>
        </div>

        <button
          type="submit"
          className="clay-button clay-button-primary search-submit-btn"
          disabled={isLoading || disabled || !isValid}
        >
          {isLoading ? (
            <>
              <span className="search-spinner" />
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span className="btn-text-desktop">Ask AI Tutor</span>
              <span className="btn-text-mobile">Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Suggestions - Horizontal swipeable on mobile */}
      {!disabled && !query && (
        <div className="suggestions-wrapper mobile-swipe-list">
          {suggestions.map((s) => (
            <button
              key={s}
              className="clay-button suggestion-btn"
              onClick={() => {
                setQuery(s);
                inputRef.current?.focus();
              }}
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .search-bar-container {
          padding: 24px;
          margin-bottom: 20px;
          animation-delay: 0.1s;
        }

        .search-form {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-input {
          padding-left: 48px;
          font-size: 1.02rem;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.2rem;
          opacity: 0.6;
        }

        .search-submit-btn {
          min-width: 140px;
          opacity: ${isLoading || disabled || !isValid ? 0.6 : 1};
          white-space: nowrap;
          padding: 13px 20px;
        }

        .search-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .btn-text-mobile {
          display: none;
        }

        .suggestions-wrapper {
          margin-top: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .suggestion-btn {
          font-size: 0.76rem;
          padding: 6px 14px;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .search-bar-container {
            padding: 16px 14px;
            margin-bottom: 16px;
          }

          .search-form {
            gap: 8px;
          }

          .search-input {
            padding-left: 42px;
            padding-right: 12px;
          }

          .search-icon {
            left: 14px;
            font-size: 1.05rem;
          }

          .search-submit-btn {
            min-width: 90px;
            padding: 10px 14px;
            font-size: 0.82rem;
          }

          .btn-text-desktop {
            display: none;
          }

          .btn-text-mobile {
            display: inline;
          }

          .suggestions-wrapper {
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }

          .suggestion-btn {
            flex-shrink: 0;
            font-size: 0.74rem;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
}
