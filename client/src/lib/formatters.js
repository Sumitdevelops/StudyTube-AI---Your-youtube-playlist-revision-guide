/**
 * Format seconds to human-readable time string.
 * @param {number} totalSeconds
 * @returns {string} e.g. "2:34" or "1:02:15"
 */
export function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '0:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format duration in seconds to a friendly display.
 * @param {number} seconds
 * @returns {string} e.g. "12 min" or "1h 30m"
 */
export function formatDuration(seconds) {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text, maxLen = 120) {
  if (!text || text.length <= maxLen) return text || '';
  return text.substring(0, maxLen) + '...';
}
