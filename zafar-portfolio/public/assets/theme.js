// public/assets/theme.js
// Shared by the public site and the admin panel so both always render themes identically.

(function (global) {
  const VAR_MAP = {
    ink: '--ink',
    panel: '--panel',
    gold: '--gold',
    maroon: '--maroon',
    cream: '--cream',
    teal: '--teal'
  };

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function shade(hex, amt) {
    // amt > 0 lightens, amt < 0 darkens
    const { r, g, b } = hexToRgb(hex);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + (255 - c) * amt)));
    const fDark = (c) => Math.max(0, Math.min(255, Math.round(c * (1 + amt))));
    const fn = amt >= 0 ? f : fDark;
    return `rgb(${fn(r)}, ${fn(g)}, ${fn(b)})`;
  }

  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function resolveThemeColors(theme, presets) {
    if (theme.preset === 'custom' || !presets[theme.preset]) {
      return theme.custom;
    }
    return presets[theme.preset].colors;
  }

  function applyTheme(theme, meta) {
    const colors = resolveThemeColors(theme, meta.themePresets);
    const root = document.documentElement;

    Object.keys(VAR_MAP).forEach((key) => {
      if (colors[key]) root.style.setProperty(VAR_MAP[key], colors[key]);
    });

    // derived tones the CSS relies on
    root.style.setProperty('--gold-bright', shade(colors.gold, 0.22));
    root.style.setProperty('--gold-dim', withAlpha(colors.gold, 0.16));
    root.style.setProperty('--maroon-bright', shade(colors.maroon, 0.2));
    root.style.setProperty('--cream-dim', withAlpha(colors.cream, 0.68));
    root.style.setProperty('--cream-faint', withAlpha(colors.cream, 0.42));
    root.style.setProperty('--line', withAlpha(colors.cream, 0.12));
    root.style.setProperty('--panel-2', shade(colors.panel, 0.08));

    applyTypography(theme.typography, meta.typographyPresets);
    applyFontScale(theme.fontScale, meta.fontScales);
  }

  function applyTypography(key, typographyPresets) {
    const preset = typographyPresets[key] || Object.values(typographyPresets)[0];
    const root = document.documentElement;
    root.style.setProperty('--font-display', preset.display);
    root.style.setProperty('--font-body', preset.body);
    root.style.setProperty('--font-mono', preset.mono);

    let link = document.getElementById('dynamic-google-font');
    if (!link) {
      link = document.createElement('link');
      link.id = 'dynamic-google-font';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== preset.googleFontsUrl) {
      link.href = preset.googleFontsUrl;
    }
  }

  function applyFontScale(key, fontScales) {
    const scale = fontScales[key] || fontScales.comfortable;
    document.documentElement.style.setProperty('--base-font-size', scale.base);
  }

  global.ThemeEngine = { applyTheme, resolveThemeColors, shade, withAlpha, hexToRgb };
})(window);
