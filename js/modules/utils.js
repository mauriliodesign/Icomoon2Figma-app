import { showToast } from './toast.js';

export function copyToClipboard(text, name) {
  navigator.clipboard.writeText(text)
    .then(() => {
      showToast(`Copied glyph for "${name}"`);
    })
    .catch(() => {
      showToast('Failed to copy to clipboard');
    });
} 