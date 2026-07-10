// utils/themes.js
// Curated theme + typography presets. "Custom" theme uses user-picked colors instead.

const THEME_PRESETS = {
  'heritage-gold': {
    label: 'Heritage Gold',
    colors: { ink: '#0a1120', panel: '#122036', gold: '#c9a24b', maroon: '#7c232f', cream: '#f4eee1', teal: '#3f7d74' }
  },
  'emerald-zari': {
    label: 'Emerald Zari',
    colors: { ink: '#0a1a16', panel: '#0f251f', gold: '#d4b563', maroon: '#8a3b2b', cream: '#f2ede0', teal: '#4f9d8a' }
  },
  'rose-silk': {
    label: 'Rose Silk',
    colors: { ink: '#1a0f14', panel: '#251621', gold: '#dcae5a', maroon: '#b5445a', cream: '#f7ece7', teal: '#6a7d8f' }
  },
  'midnight-indigo': {
    label: 'Midnight Indigo',
    colors: { ink: '#0b0e1f', panel: '#131832', gold: '#b9a5e6', maroon: '#5c3d8f', cream: '#eef0fb', teal: '#4d7ea8' }
  }
};

const TYPOGRAPHY_PRESETS = {
  'classic-serif': {
    label: 'Classic Serif (Fraunces + Manrope)',
    display: "'Fraunces', serif",
    body: "'Manrope', sans-serif",
    mono: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,450;0,9..144,600;1,9..144,500;1,9..144,600&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap'
  },
  'modern-sans': {
    label: 'Modern Sans (Sora + Inter)',
    display: "'Sora', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
  },
  'editorial': {
    label: 'Editorial (Playfair Display + Source Sans)',
    display: "'Playfair Display', serif",
    body: "'Source Sans 3', sans-serif",
    mono: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
  },
  'minimal-grotesk': {
    label: 'Minimal Grotesk (Space Grotesk)',
    display: "'Space Grotesk', sans-serif",
    body: "'Space Grotesk', sans-serif",
    mono: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap'
  }
};

const FONT_SCALES = {
  compact: { label: 'Compact', base: '15px' },
  comfortable: { label: 'Comfortable', base: '16px' },
  spacious: { label: 'Spacious', base: '17.5px' }
};

module.exports = { THEME_PRESETS, TYPOGRAPHY_PRESETS, FONT_SCALES };
