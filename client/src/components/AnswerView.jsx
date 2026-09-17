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
    <div
      className="clay-card-flat animate-fade-in"
      style={{ padding: '28px', marginBottom: '20px' }}
    >
      {/* Header */}
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
          }}
        >
          🧠
        </div>
        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
          {playlistTitle ? `${playlistTitle} AI Tutor` : 'AI Answer'}
        </span>
        <div className="clay-badge" style={{ marginLeft: 'auto' }}>
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
        className="markdown-content"
        style={{
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          boxShadow: 'var(--clay-shadow-pressed)',
          lineHeight: 1.7,
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(answer + (isLoading ? ' ▌' : '')) }}
      />

      {/* Direct In-Answer CTA when topic is not in playlist */}
      {isNotCovered && !isLoading && (
        <div
          className="clay-card-flat animate-pop-in"
          style={{
            marginTop: '18px',
            padding: '18px 22px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
            border: '1.5px dashed rgba(99, 102, 241, 0.45)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-primary-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: 'var(--clay-shadow-sm)',
                flexShrink: 0,
              }}
            >
              📩
            </div>
            <div>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.96rem' }}>
                Want this subject added to StudyTube AI?
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Request the admin to index a YouTube playlist for this course!
              </div>
            </div>
          </div>

          <button
            onClick={() => onRequestPlaylist && onRequestPlaylist(userQuery)}
            className="clay-button"
            style={{
              padding: '10px 22px',
              fontSize: '0.9rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            ✨ Request This Playlist
          </button>
        </div>
      )}
    </div>
  );
}


