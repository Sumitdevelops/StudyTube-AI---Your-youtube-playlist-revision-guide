'use client';

import { useState, useEffect } from 'react';
import { requestPlaylist } from '@/lib/api';

export default function RequestPlaylistModal({ isOpen, onClose, initialSubject = '' }) {
  const [subject, setSubject] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && initialSubject) {
      const clean = initialSubject
        .replace(/^(what is|explain|tell me about|how to|how does|define)\s+/i, '')
        .replace(/\?+$/, '')
        .trim();
      setSubject(clean || initialSubject);
    }
  }, [isOpen, initialSubject]);


  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please provide the Subject or Course name.');
      return;
    }
    if (!playlistUrl.trim() || !playlistUrl.includes('youtube.com') && !playlistUrl.includes('youtu.be') && !playlistUrl.startsWith('PL')) {
      setError('Please provide a valid YouTube playlist URL or ID.');
      return;
    }

    setIsLoading(true);
    try {
      await requestPlaylist({
        name: name.trim() || 'Anonymous',
        email: email.trim() || 'Not provided',
        subject: subject.trim(),
        playlistUrl: playlistUrl.trim(),
        note: note.trim(),
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setSubject('');
    setPlaylistUrl('');
    setName('');
    setEmail('');
    setNote('');
    setError('');
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleResetAndClose();
      }}
    >
      <div className="modal-dialog clay-card animate-pop-in">
        {/* Close Button */}
        <button
          onClick={handleResetAndClose}
          className="modal-close-btn"
          aria-label="Close modal"
        >
          ✕
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--accent-success-surface)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '18px',
                boxShadow: 'var(--clay-shadow-sm)',
              }}
            >
              🎉
            </div>
            <h3
              style={{
                fontSize: '1.3rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              Request Dispatched!
            </h3>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              The admin has received an instant notification on Telegram with your playlist link.
              It will be reviewed and indexed shortly!
            </p>
            <button
              onClick={handleResetAndClose}
              className="clay-button clay-button-primary"
              style={{ padding: '12px 32px', fontSize: '0.95rem' }}
            >
              Awesome, Got It!
            </button>
          </div>
        ) : (
          /* Request Form */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-primary-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: 'var(--clay-shadow-sm)',
                  flexShrink: 0,
                }}
              >
                ✨
              </div>
              <div>
                <h2
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                  }}
                >
                  Request a Playlist
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Want a new course indexed? Admin will receive an instant alert!
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Course / Subject Name <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  className="clay-input"
                  type="text"
                  placeholder="e.g. Operating Systems, DBMS, Machine Learning"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  YouTube Playlist Link <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  className="clay-input"
                  type="text"
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-two-col">
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Name <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    className="clay-input"
                    type="text"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Your Email <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    className="clay-input"
                    type="email"
                    placeholder="to notify when live"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Note / Preferred Topics <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <textarea
                  className="clay-input"
                  rows={2}
                  placeholder="e.g. Focus on process scheduling lectures, please index soon!"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isLoading}
                  style={{ resize: 'none', paddingTop: '10px' }}
                />
              </div>

              {error && (
                <div
                  style={{
                    color: '#e74c3c',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '8px 12px',
                    background: 'rgba(231, 76, 60, 0.1)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div className="form-btn-row">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="clay-button cancel-btn"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-button clay-button-primary submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending alert...' : '🚀 Submit Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(30, 20, 40, 0.45);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .modal-dialog {
          width: 100%;
          max-width: 520px;
          padding: 30px 32px;
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--clay-shadow-lg);
          position: relative;
        }

        .modal-close-btn {
          position: absolute;
          top: 18px;
          right: 18px;
          background: none;
          border: none;
          fontSize: 1.4rem;
          cursor: pointer;
          color: var(--text-muted);
          line-height: 1;
          padding: 6px;
        }

        .form-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-btn-row {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .cancel-btn {
          padding: 10px 20px;
          font-size: 0.9rem;
        }

        .submit-btn {
          min-width: 150px;
          padding: 10px 24px;
          font-size: 0.9rem;
        }

        @media (max-width: 640px) {
          .modal-overlay {
            padding: 8px;
          }

          .modal-dialog {
            padding: 20px 16px;
            border-radius: var(--radius-lg);
            max-height: 94vh;
            overflow-y: auto;
          }

          .form-two-col {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .form-btn-row {
            flex-direction: column-reverse;
            align-items: stretch;
            gap: 8px;
          }

          .cancel-btn,
          .submit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
