'use client';

import { useMemo } from 'react';
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

  // 1. Normalize unicode bullets and broken bullet combinations at line starts
  // e.g. "• ", "● ", "* •", "•* " -> "- "
  text = text.replace(/^[\s]*[•●○][\s]*/gm, '- ');
  text = text.replace(/^[\s]*\*\s*[•●○][\s]*/gm, '- ');

  // 2. Normalize single asterisk bullets or malformed source tags
  // e.g. "* *Source:*" or "*Source:*" -> "**Source:** "
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

/**
 * AnswerView - Displays the AI-generated answer in a puffy claymorphism card.
 * Renders full markdown and KaTeX math formulas with interactive video citations.
 */
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
            {playlistTitle ? `${playlistTitle}${channelTitle ? ` (${channelTitle})` : ''} AI is thinking...` : 'AI is thinking...'}
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

  // Memoize markdown rendering for smooth performance during streaming and re-renders
  const renderedHtml = useMemo(() => {
    return renderEnhancedMarkdown(answer + (isLoading ? ' ▌' : ''));
  }, [answer, isLoading]);

  // Handle click on inline citation badge to jump player
  const handleContentClick = (e) => {
    const badge = e.target.closest('.inline-citation-badge');
    if (!badge || !onJumpToCitation) return;

    const tsStr = badge.dataset.citationTs;
    const titleStr = badge.dataset.citationTitle;
    if (!tsStr) return;

    // Parse mm:ss or hh:mm:ss to seconds
    const parts = tsStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    // Match video in sources
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
    <div className="answer-view-card clay-card-flat animate-fade-in">
      {/* Header */}
      <div className="answer-header">
        <div className="ai-icon-box">
          🧠
        </div>
        <span className="ai-title">
          {playlistTitle ? `${playlistTitle}${channelTitle ? ` (${channelTitle})` : ''} AI Tutor` : 'AI Answer'}
        </span>
        <div className="clay-badge answer-badge">
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
              Streaming live...
            </span>
          ) : (
            channelTitle
              ? `Trained on ${playlistTitle} • ${channelTitle}`
              : `Trained on ${playlistTitle || 'this playlist'}`
          )}
        </div>
      </div>

      {/* Answer Content */}
      <div
        className="markdown-content answer-content-box"
        onClick={handleContentClick}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
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


