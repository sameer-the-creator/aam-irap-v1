/* Minimal inline icon set (stroke-based, currentColor) — no external deps. */

const ICON_PATHS = {
  "trending-up":
    '<polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/>',
  handshake:
    '<path d="M8 12l3 3 5-5"/><path d="M2 12l5-5 4 2 3-3 6 6-3 3-3-3-4 4-5-5"/>',
  wrench:
    '<path d="M14.7 6.3a4 4 0 1 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-3 3-2-2z"/>',
  leaf:
    '<path d="M5 21c8-1 13-7 14-16-9 1-15 6-16 14"/><path d="M5 21c0-4 2-8 6-11"/>',
  plane:
    '<path d="M22 12l-8-3-3-7-2 1 2 6-7 2-3-2-1 1 3 4 4 3-1 1 2 1 1-2 4 3 1-1-3-4z"/><path d="M3 3l18 18" style="display:none"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5V4.5z"/><path d="M20 17H6.5a2.5 2.5 0 0 0-2.5 2.5"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  arrowleft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  arrowright: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  download: '<path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M4 20h16"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
};

function icon(name, size) {
  const s = size || 20;
  const body = ICON_PATHS[name] || "";
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
