'use client';

import { useState, useRef, useEffect } from 'react';

export default function SearchBar({ onSearch, isLoading, disabled, playlistTitle = '', videos = [] }) {
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
    <div
      className="clay-card-flat animate-pop-in"
      style={{ padding: '24px', marginBottom: '20px', animationDelay: '0.1s' }}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            className="clay-input"
            type="text"
            placeholder={
              disabled
                ? 'Index a playlist first...'
                : playlistTitle
                  ? `Ask ${playlistTitle} AI Tutor anything...`
                  : 'Ask anything about topics in this playlist...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading || disabled}
            style={{
              paddingLeft: '48px',
              fontSize: '1.05rem',
            }}
          />

          <span
            style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1.2rem',
              opacity: 0.6,
            }}
          >
            🔍
          </span>
        </div>

        <button
          type="submit"
          className="clay-button clay-button-primary"
          disabled={isLoading || disabled || !isValid}
          style={{
            minWidth: '130px',
            opacity: isLoading || disabled || !isValid ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <>
              <span
                style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '3px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              Thinking...
            </>
          ) : (
            <>✨ Ask AI</>
          )}
        </button>
      </form>

      {/* Quick Suggestions */}
      {!disabled && !query && (
        <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {suggestions.map((s) => (
            <button
              key={s}
              className="clay-button"
              onClick={() => {
                setQuery(s);
                inputRef.current?.focus();
              }}
              style={{
                fontSize: '0.76rem',
                padding: '6px 14px',
                color: 'var(--text-secondary)',
              }}
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
