/**
 * Resolves a theme colour for code that needs a literal colour value (Plotly, Chart.js, canvas, colour pickers).
 * A value that starts with `--` is a design token (see docs/design-system/05-color-system.md); it is read from the
 * current theme. Any other value is returned unchanged.
 */
export const themeColor = (value: string): string => {
  if (!value?.startsWith('--') || typeof document === 'undefined') {
    return value;
  }
  return getComputedStyle(document.documentElement).getPropertyValue(value).trim() || value;
};
