export const brandColors = {
  prahariRose: '#C2255C', // Brand accent, nav highlight, primary CTA
  sentinelTeal: '#146356', // Low risk / verified / normal
  alertAmber: '#E8901A', // Moderate risk
  sosRed: '#C6362C', // High / Critical risk only
  commandPaper: '#F6F5F2', // Background; light, print-friendly, projector-legible
  ink: '#1D2321', // Primary text
  slate: '#5B6663', // Secondary text, gridlines, chart axes
  border: '#E2E8F0',
  surface: '#FFFFFF',
} as const;

export const riskColors = {
  low: '#146356',
  moderate: '#E8901A',
  high: '#C6362C',
  critical: '#8B0000',
  // Backward compatibility
  green: '#146356',
  amber: '#E8901A',
  red: '#C6362C',
} as const;

export const webPalette = {
  primary: '#C2255C',
  secondary: '#146356',
  accent: '#E8901A',
  background: '#F6F5F2',
  foreground: '#1D2321',
  muted: '#EAE8E3',
  border: '#E2E8F0',
} as const;

export const mobilePalette = {
  primary: '#C2255C',
  secondary: '#146356',
  accent: '#E8901A',
  background: '#F6F5F2',
  surface: '#FFFFFF',
  border: '#E2E8F0',
} as const;

