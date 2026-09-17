'use client';

/**
 * AnswerView - Displays the AI-generated answer in a puffy claymorphism card.
 * Renders markdown-like formatting from the Groq response.
 */
export default function AnswerView({ answer, isLoading }) {
  if (isLoading) {
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
            AI is thinking...
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
          AI Answer
        </span>
        <div className="clay-badge" style={{ marginLeft: 'auto' }}>
          Powered by Groq
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
        dangerouslySetInnerHTML={{ __html: renderMarkdown(answer) }}
      />
    </div>
  );
}
