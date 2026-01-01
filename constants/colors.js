export const Colors = {
  // Brand Identity: "Organic Harmony"
  // Inspired by: Deep Space & Bioluminescence
  primary: '#7C3AED', // Electric Violet (Vibrant, distinct from generic blue)
  primaryDark: '#5B21B6',
  primaryLight: '#A78BFA',

  secondary: '#10B981', // Emerald (Success/Nature)
  accent: '#F59E0B', // Amber (Warmth/Warning)

  // Harmony OS Gradients (Start/End)
  gradients: {
    primary: ['#7C3AED', '#4F46E5'], // Violet -> Indigo
    success: ['#10B981', '#059669'],
    danger: ['#EF4444', '#DC2626'],
    glassBorder: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)'], // Ultra-subtle border
    background: ['#000000', '#111116'], // Pure OLED -> Deep Zinc
    card: ['rgba(30, 30, 40, 0.7)', 'rgba(20, 20, 30, 0.4)'],
  },

  // Signals (Softer, less alarming)
  success: '#10B981',
  warning: '#FBBF24',
  error: '#F87171',
  info: '#3B82F6',

  // Base Backgrounds
  background: '#000000', // Pure Black for OLED
  backgroundSecondary: '#18181B', // Zinc 900

  // Glass System (One UI 6.0 Style)
  glass: {
    background: 'rgba(30, 30, 40, 0.4)', // More transparency
    backgroundLight: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderHighlight: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.6)',
    blurIntensity: 30,
  },

  // Typography (Inter/San Francisco style)
  text: '#FAFAFA', // Almost white
  textSecondary: '#A1A1AA', // Zinc 400
  textMuted: '#52525B', // Zinc 600
  textInverse: '#000000',

  // Utilities
  divider: 'rgba(255, 255, 255, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.7)',
};
