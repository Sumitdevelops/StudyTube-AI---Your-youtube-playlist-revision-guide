'use client';

import { useMemo, useState } from 'react';
import { Marked } from 'marked';
import katex from 'katex';

// Pre-configure marked instance with GitHub Flavored Markdown and breaks
const markedInstance = new Marked({
  gfm: true,
  breaks: true,
});

/**
 * Robust markdown + KaTeX math renderer:
 * 1. Normalizes broken LLM bullet points and asterisks.
 * 2. Pre-extracts LaTeX math formulas ($$...$$ and $...$) so markdown parsers
 *    won't mangle LaTeX characters (_, *, \).
 * 3. Renders math via KaTeX with throwOnError: false.
 * 4. Compiles markdown to HTML via Marked.
 * 5. Reinserts rendered KaTeX math and styles inline citations cleanly.
 */
function renderEnhancedMarkdown(rawText) {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize unicode bullets
  text = text.replace(/^[\s]*[•●○][\s]*/gm, '- ');
  text = text.replace(/^[\s]*\*\s*[•●○][\s]*/gm, '- ');

  // 2. Normalize source tags
  text = text.replace(/\*\s*\*Source:\*\s*/gi, '**Source:** ');
  text = text.replace(/(?<!\*)\*Source:\*(?!\*)/gi, '**Source:** ');

  // 3. Extract and compile LaTeX math expressions to placeholders
  const mathPlaceholders = [];

  // Match display math $$...$$
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
      });
      const placeholder = `KATEXBLOCKPLACEHOLDER${mathPlaceholders.length}XYZ`;
      mathPlaceholders.push({ placeholder, html: rendered });
      return `\n\n${placeholder}\n\n`;
    } catch (e) {
      return match;
    }
  });

  // Match inline math $...$
  text = text.replace(/\$([^\$\n\r]+?)\$/g, (match, formula) => {
    const trimmed = formula.trim();
    if (!trimmed) return match;
    try {
      const rendered = katex.renderToString(trimmed, {
        displayMode: false,
        throwOnError: false,
      });
      const placeholder = `KATEXINLINEPLACEHOLDER${mathPlaceholders.length}XYZ`;
      mathPlaceholders.push({ placeholder, html: rendered });
      return placeholder;
    } catch (e) {
      return match;
    }
  });

  // 4. Compile markdown to HTML
  let html = '';
  try {
    html = markedInstance.parse(text);
  } catch (err) {
    html = text.replace(/\n/g, '<br/>');
  }

  // 5. Restore math placeholders
  for (const item of mathPlaceholders) {
    html = html.replace(new RegExp(item.placeholder, 'g'), item.html);
  }

  // 6. Transform citations [Video Title @ mm:ss] into interactive styled badges
  html = html.replace(
    /\[([^\]@\n]+?)\s*@\s*(\d{1,2}:\d{2}(?::\d{2})?)\]/g,
    (match, title, ts) => {
      const cleanTitle = title.trim();
      const escapedTitle = cleanTitle.replace(/"/g, '&quot;');
      return `<span class="inline-citation-badge" data-citation-title="${escapedTitle}" data-citation-ts="${ts}" title="Jump to ${cleanTitle} @ ${ts}"><span class="citation-icon">▶</span> <span class="citation-title">${cleanTitle}</span> <span class="citation-ts">${ts}</span></span>`;
    }
  );

  return html;
}

export default function AnswerView({
  answer,
  isLoading,
  playlistTitle = '',
  channelTitle = '',
  onRequestPlaylist,
  userQuery = '',
  sources = [],
  onJumpToCitation,
}) {
  const [copied, setCopied] = useState(false);
  const [isHelpful, setIsHelpful] = useState(null);

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleExportAnki = () => {
    if (!answer) return;
    const ankiText = `# Flashcard: ${userQuery || 'Concept'}\n\nQ: ${userQuery || 'Exam Question'}\nA: ${answer.slice(0, 500)}...\n\nSource: StudyTube AI`;
    const blob = new Blob([ankiText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anki_${(userQuery || 'concept').slice(0, 20).replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !answer) {
    return (
      <div className="stitch-card answer-loading-card animate-pop-in">
        <div className="loading-header">
          <div className="ai-icon-circle">🧠</div>
          <span className="loading-title">
            Synthesizing grounded explanation from lecture transcripts...
          </span>
        </div>

        <div className="skeleton-lines">
          <div className="skeleton" style={{ height: '16px', width: '92%' }} />
          <div className="skeleton" style={{ height: '16px', width: '78%' }} />
          <div className="skeleton" style={{ height: '16px', width: '85%' }} />
          <div className="skeleton" style={{ height: '16px', width: '64%' }} />
        </div>

        <style jsx>{`
          .answer-loading-card {
            padding: 22px;
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .loading-header {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .ai-icon-circle {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: var(--accent-primary-surface);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            animation: pulse-ai 1.2s infinite ease-in-out;
          }
          .loading-title {
            font-size: 0.92rem;
            font-weight: 700;
            color: var(--text-secondary);
          }
          .skeleton-lines {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          @keyframes pulse-ai {
            0%, 100% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 1; }
          }
        `}</style>
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const renderedHtml = useMemo(() => {
    return renderEnhancedMarkdown(answer + (isLoading ? ' ▌' : ''));
  }, [answer, isLoading]);

  const handleContentClick = (e) => {
    const badge = e.target.closest('.inline-citation-badge');
    if (!badge || !onJumpToCitation) return;

    const tsStr = badge.dataset.citationTs;
    const titleStr = badge.dataset.citationTitle;
    if (!tsStr) return;

    const parts = tsStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    let matchedVideoId = null;
    if (sources && sources.length > 0) {
      const match = sources.find(
        (s) =>
          (titleStr && s.title && s.title.toLowerCase().includes(titleStr.toLowerCase().slice(0, 15))) ||
          Math.abs((s.timestamp || 0) - seconds) <= 2
      );
      matchedVideoId = match ? match.video_id : sources[0].video_id;
    }

    onJumpToCitation(matchedVideoId, seconds);
  };

  return (
    <div className="stitch-card answer-container animate-fade-in">
      {/* Header Bar */}
      <div className="answer-header">
        <div className="header-left">
          <div className="ai-icon-box">🧠</div>
          <div>
            <h3 className="answer-heading">
              Grounded AI Explanation
            </h3>
            <p className="answer-sub">
              {channelTitle ? `Grounded in ${channelTitle} Transcripts` : 'Verified Lecture Transcripts'}
            </p>
          </div>
        </div>

        <div className="header-right">
          {isLoading ? (
            <span className="live-stream-badge">
              <span className="pulse-dot" /> Streaming live
            </span>
          ) : (
            <span className="source-verified-badge">
              ✓ Grounded in Lectures
            </span>
          )}
        </div>
      </div>

      {/* Answer Content */}
      <div
        className="markdown-content answer-body"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Action Footer (Helpful, Copy, Anki Export) */}
      {!isLoading && (
        <div className="answer-footer">
          <div className="footer-left">
            <span className="footer-label">Was this helpful?</span>
            <button
              onClick={() => setIsHelpful(true)}
              className={`feedback-btn ${isHelpful === true ? 'active-feedback' : ''}`}
            >
              👍 Yes
            </button>
            <button
              onClick={() => setIsHelpful(false)}
              className={`feedback-btn ${isHelpful === false ? 'active-feedback' : ''}`}
            >
              👎 No
            </button>
          </div>

          <div className="footer-right">
            <button onClick={handleCopy} className="clay-button footer-action-btn">
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button onClick={handleExportAnki} className="clay-button footer-action-btn anki-btn">
              🗂️ Export Anki
            </button>
          </div>
        </div>
      )}

      {/* Not Covered CTA */}
      {isNotCovered && !isLoading && (
        <div className="in-answer-cta">
          <div className="cta-left">
            <span style={{ fontSize: '24px' }}>📩</span>
            <div>
              <strong>Topic not covered in this playlist?</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Request our team to index the exact YouTube course you need!
              </p>
            </div>
          </div>
          <button
            onClick={() => onRequestPlaylist && onRequestPlaylist(userQuery)}
            className="clay-button cta-submit-btn"
          >
            ✨ Request Course
          </button>
        </div>
      )}

      <style jsx>{`
        .answer-container {
          padding: 20px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .answer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 12px;
          gap: 10px;
          flex-wrap: wrap;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ai-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          box-shadow: var(--clay-shadow-accent);
          flex-shrink: 0;
        }

        .answer-heading {
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .answer-sub {
          font-size: 0.74rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .live-stream-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: var(--accent-success-surface);
          border: 1px solid var(--accent-success-border);
          border-radius: var(--radius-full);
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent-success);
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-success);
          animation: pulse 1s infinite;
        }

        .source-verified-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-primary);
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }

        .answer-body {
          padding: 16px;
          border-radius: var(--radius-md);
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          line-height: 1.68;
        }

        .answer-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
          gap: 10px;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .footer-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-right: 4px;
        }

        .feedback-btn {
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.16s;
        }

        .feedback-btn:hover {
          background: var(--bg-hover);
        }

        .active-feedback {
          background: var(--accent-primary-surface);
          border-color: var(--accent-primary-border);
          color: var(--accent-primary);
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .footer-action-btn {
          font-size: 0.76rem;
          padding: 5px 12px;
          font-weight: 700;
        }

        .anki-btn {
          background: var(--accent-secondary-surface);
          border-color: rgba(139, 92, 246, 0.3);
          color: var(--accent-secondary);
        }

        .in-answer-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: var(--accent-primary-surface);
          border: 1px solid var(--accent-primary-border);
          border-radius: var(--radius-md);
          gap: 12px;
          flex-wrap: wrap;
        }

        .cta-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cta-submit-btn {
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: #fff;
          font-size: 0.8rem;
          padding: 8px 16px;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 640px) {
          .answer-container {
            padding: 14px;
          }
          .answer-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          .footer-right {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
