'use client';

/**
 * AnswerView - Displays the AI-generated answer in a puffy claymorphism card.
 * Renders markdown-like formatting from the Groq response.
 */
export default function AnswerView({
  answer,
  isLoading,
  playlistTitle = '',
  onRequestPlaylist,
  userQuery = '',
}) {
  if (isLoading && !answer) {
    return (
      <div
        className="clay-card-flat animate-pop-in"
        style={{ padding: '28px', marginBottom: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary-surface)',
              boxShadow: 'var(--clay-shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              animation: 'clay-bounce 1s ease-in-out infinite',
            }}
          >
            🧠
          </div>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {playlistTitle ? `${playlistTitle} AI is thinking...` : 'AI is thinking...'}
          </span>
        </div>

        {/* Skeleton loading lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="skeleton" style={{ height: '16px', width: '90%' }} />
          <div className="skeleton" style={{ height: '16px', width: '75%' }} />
          <div className="skeleton" style={{ height: '16px', width: '85%' }} />
          <div className="skeleton" style={{ height: '16px', width: '60%' }} />
        </div>
      </div>
    );
  }

  if (!answer) return null;

  const isNotCovered =
    answer &&
    (answer.toLowerCase().includes('not covered') ||
      answer.toLowerCase().includes('not discussed') ||
      answer.toLowerCase().includes('request the admin') ||
      answer.toLowerCase().includes('request this playlist'));

  // Simple markdown-to-HTML rendering
  const renderMarkdown = (text) => {
    let html = text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // Bullet points
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    // Wrap loose <li> in <ul>
    html = html.replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>');

    return `<p>${html}</p>`;
  };

  return (
    <div className="answer-view-card clay-card-flat animate-fade-in">
      {/* Header */}
      <div className="answer-header">
        <div className="ai-icon-box">
          🧠
        </div>
        <span className="ai-title">
          {playlistTitle ? `${playlistTitle} AI Tutor` : 'AI Answer'}
        </span>
        <div className="clay-badge answer-badge">
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              Streaming live...
            </span>
          ) : (
            `Trained on ${playlistTitle || 'this playlist'}`
          )}
        </div>
      </div>

      {/* Answer Content */}
      <div
        className="markdown-content answer-content-box"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(answer + (isLoading ? ' ▌' : '')) }}
      />

      {/* Direct In-Answer CTA when topic is not in playlist */}
      {isNotCovered && !isLoading && (
        <div className="in-answer-cta clay-card-flat animate-pop-in">
          <div className="cta-info">
            <div className="cta-icon">
              📩
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                Want this subject added to StudyTube AI?
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Request the admin to index a YouTube playlist for this course!
              </div>
            </div>
          </div>

          <button
            onClick={() => onRequestPlaylist && onRequestPlaylist(userQuery)}
            className="clay-button cta-btn"
          >
            ✨ Request This Playlist
          </button>
        </div>
      )}

      <style jsx>{`
        .answer-view-card {
          padding: 26px;
          margin-bottom: 20px;
        }

        .answer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .ai-icon-box {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-sm);
          background: var(--accent-primary-surface);
          box-shadow: var(--clay-shadow-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }

        .ai-title {
          font-weight: 800;
          color: var(--text-primary);
          font-size: 1rem;
        }

        .answer-badge {
          margin-left: auto;
          font-size: 0.74rem;
        }

        .answer-content-box {
          padding: 20px;
          border-radius: var(--radius-md);
          background: var(--bg-input);
          box-shadow: var(--clay-shadow-pressed);
          line-height: 1.7;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .in-answer-cta {
          margin-top: 18px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
          border: 1.5px dashed rgba(99, 102, 241, 0.45);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cta-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1 1 240px;
        }

        .cta-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: var(--accent-primary-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          box-shadow: var(--clay-shadow-sm);
          flex-shrink: 0;
        }

        .cta-btn {
          padding: 10px 20px;
          font-size: 0.88rem;
          font-weight: 800;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .answer-view-card {
            padding: 16px 14px;
            margin-bottom: 16px;
          }

          .answer-content-box {
            padding: 14px 12px;
            font-size: 0.92rem;
          }

          .answer-header {
            gap: 8px;
          }

          .ai-title {
            font-size: 0.92rem;
          }

          .answer-badge {
            margin-left: 0;
            width: 100%;
            justify-content: center;
          }

          .in-answer-cta {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 14px;
          }

          .cta-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}


